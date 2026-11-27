'use strict';
/*
 * Hao mòn trang bị do server giữ (xem .perch/plans/do-ben-trang-bi.md).
 *  - Đánh quái  → hao VŨ KHÍ   (onHit, loại đòn × cấp/hạng quái).
 *  - Bị quái đánh → hao MỘT trong 9 ô còn lại, chọn ngẫu nhiên (onHurt; client chỉ báo uid quái, không báo lượng hao).
 * Hao được gom trong bộ nhớ theo kết nối rồi ghi mỗi FLUSH_MS qua xplayer.mutate (một lần ghi cho cả chục đòn),
 * nên không phải lưu nhân vật ở mỗi đòn. Mất kết nối thì phần chưa ghi (tối đa vài giây) bỏ qua.
 */
const G = require('../../../shared');
const xplayer = require('./xplayer');
const { clampHpMp } = require('./progress');

const D = G.DURABILITY;
const MAX_PENDING_HITS = 400;

function st(conn, now) {
  return conn.wear || (conn.wear = { w: 0, hits: [], at: now, busy: false });
}

function pending(s) { return s.w > 0 || s.hits.length > 0; }

// Gom hao vũ khí cho một đòn trúng quái (chỉ đòn của chính người chơi, thú/bóng không tính)
function addWeaponWear(conn, kind, mdef, now) {
  if (!mdef) return;
  const s = st(conn, now);
  s.w += G.weaponWearPts(kind, mdef);
  maybeFlush(conn, now);
}

// Gom hao giáp cho một cú bị quái đánh trúng
function addArmorWear(conn, mdef, now) {
  if (!mdef) return;
  const s = st(conn, now);
  if (s.hits.length < MAX_PENDING_HITS) s.hits.push(G.armorWearPts(mdef));
  maybeFlush(conn, now);
}

function maybeFlush(conn, now) {
  const s = st(conn, now);
  if (s.busy || !pending(s) || now - s.at < D.FLUSH_MS) return;
  flush(conn, now).catch((e) => console.error('Độ bền lỗi:', e.message));
}

// Ghi hao mòn đang gom vào nhân vật. Mỗi cú bị đánh chọn ô ngẫu nhiên tại thời điểm ghi (lúc đó mới biết ô nào đang mặc).
async function flush(conn, now = Date.now()) {
  const s = st(conn, now);
  if (s.busy || !pending(s)) return;
  s.busy = true;
  const w = s.w, hits = s.hits;
  s.w = 0; s.hits = []; s.at = now;
  try {
    await xplayer.mutate(conn.userId, (p, ev) => applyPending(p, ev, w, hits));
  } finally { s.busy = false; }
}

// Tách riêng (đồng bộ, không IO) để kiểm thử trực tiếp
function applyPending(p, ev, weaponPts, armorHits) {
  if (!p.equip) return;
  let broke = false;
  const note = (inst, res) => {
    if (!res.changed) return;
    const name = G.ITEMS[inst.id].name;
    if (res.broke) {
      broke = true;
      ev.push({ t: 'msg', text: `${name} đã hỏng! Đến Thợ rèn để sửa.`, color: '#ef5350' });
    } else if (res.pct < D.WARN_PCT && !inst.warned) {
      inst.warned = true;
      ev.push({ t: 'msg', text: `${name} sắp hỏng (còn ${res.pct}%).`, color: '#ffb74d' });
    }
    if (res.pct >= D.WARN_PCT && inst.warned) delete inst.warned;
  };
  const wep = p.equip.weapon;
  if (wep && weaponPts > 0) note(wep, G.applyWear(wep, weaponPts));
  if (armorHits.length) {
    const slots = G.SLOTS.filter((sl) => sl !== 'weapon' && p.equip[sl] && !G.durInfinite(G.ITEMS[p.equip[sl].id]) && !G.isBroken(p.equip[sl]));
    for (const pts of armorHits) {
      if (!slots.length) break;
      const i = Math.floor(Math.random() * slots.length);
      const inst = p.equip[slots[i]];
      note(inst, G.applyWear(inst, pts));
      if (G.isBroken(inst)) slots.splice(i, 1);
    }
  }
  if (broke) clampHpMp(p);   // mất chỉ số → kẹp máu/năng lượng về trần mới
}

module.exports = { addWeaponWear, addArmorWear, flush, maybeFlush, applyPending };
