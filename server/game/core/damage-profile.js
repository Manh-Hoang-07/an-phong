'use strict';
/*
 * HỒ SƠ SÁT THƯƠNG theo từng nhân vật — trần một đòn tính từ CHÍNH class, chỉ số và kỹ năng đang gắn của họ.
 *
 * Thay cho bốn hệ số cào bằng (CAP_MUL_BASIC/SKILL/ULT/SUPERULT) vốn giả định ai cũng chí mạng ×2,5,
 * ai cũng đang bật mọi buff. Ở đây mỗi người có một hồ sơ riêng, dựng một lần khi vào game / mỗi lần
 * refreshLook (5 giây), còn mỗi đòn chỉ tốn vài phép nhân:
 *
 *   trần = base × ngẫu nhiên(1,1) × (1 + tổng atkBuff đang gắn) × [chí mạng] × [trùm] × [Ấn Sát]
 *               × [phá giáp] × [vsSlowed] × [exec] × (1 − giáp quái) × biên + hằng
 *
 *   đánh thường  base = ATK × max(hệ số vũ khí, tổng phản sát thương)
 *   kỹ năng      base = ATK × power × skillMul            (mỗi kỹ năng đang gắn một dòng, tra theo id)
 *   tuyệt kỹ     như kỹ năng — chung một bảng id, nên không cần bảng riêng
 *   tuyệt phẩm   như kỹ năng, riêng Cấm Chú Giải Phóng: base = MP tối đa × mpPower
 *
 * Mỗi hệ số lấy từ ĐÚNG công thức client (public/js/scene/combat.js calcDamage / damageMonster) và chỉ
 * bật khi server thấy điều kiện đó có thể xảy ra:
 *   - chí mạng ×1,6; Cung Thủ ×1,8; Sát Thủ (hoặc Toàn Năng) ×2,5 chỉ khi ĐANG GẮN kỹ năng lướt (dash)
 *   - trùm ×(1 + boss%) chỉ khi quái là trùm / thủ lĩnh
 *   - giáp quái chỉ bỏ qua khi có trang bị xuyên giáp đúng khoảng cấp
 *   - phá giáp chỉ khi chính người này vừa phá giáp quái đó (≤ 7,5 giây)
 *   - vsSlowed / exec chỉ khi quái đang chậm / đóng băng / dưới ngưỡng máu
 * Đổi chỉ số (lên cấp, đổi vũ khí, gắn buff) thì hồ sơ cũ còn được dùng thêm PROFILE_GRACE_MS để không
 * chặt oan người chơi trong lúc server chưa kịp làm mới.
 */
const G = require('../../../shared');

const RANDOM_MAX = 1.1;        // client nhân ngẫu nhiên 0,9–1,1
const MARGIN = 1.06;           // làm tròn + lệch pha nhỏ giữa server và client
const FLAT_BASIC = 30;         // cộng phẳng cho số rất nhỏ (ATK sàn 30)
const FLAT_SKILL = 100;
const CRIT_NORMAL = 1.6;
const CRIT_ARCHER = 1.8;       // nội tại Cung Thủ
const CRIT_SHADOW = 2.5;       // nội tại Sát Thủ "Bóng Tối": chí mạng đầu tiên sau kỹ năng lướt
const CRIT_P_MAX = 0.9;        // client kẹp tỉ lệ chí mạng ≤ 90%
const SLOW_GRACE_MS = 1500;
const EXEC_GRACE = 0.05;       // máu quái trên server có thể trễ hơn client
const SHRED_WINDOW_MS = 7500;  // client giữ phá giáp 6 giây, chừa 1,5 giây trễ
const PROFILE_GRACE_MS = 15000;
const MAX_SHRED_MOBS = 64;
const REFLECT_MOB_ATK_MUL = 1.5 * 1.25;   // công quái đánh mạnh nhất so với công gốc: đòn trùm ×1,5, nổi giận ×1,25
const LEGACY_ASSIST_MUL = 8;  // thú / bóng ma: giữ trần cũ, công của chúng không tính từ ATK người chơi

// Thống kê chí mạng: n đòn, k lần cờ chí mạng. Vượt n·p + Z·σ thì từ chối cờ chí mạng cho tới khi tụt lại.
const CRIT_Z = 4.5;
const CRIT_SLACK = 3;
const CRIT_MIN_N = 15;
const CRIT_WINDOW = 400;       // chạm mốc này thì giảm một nửa để thích nghi theo thời gian

// ---------------------------------------------------------------- thông tin tĩnh theo (kỹ năng, cấp)
// Chỉ phụ thuộc dữ liệu game nên nhớ lại toàn cục: mỗi cặp id:cấp chỉ gọi skillAt một lần cho cả tiến trình.
const infoMemo = new Map();
function skillInfo(id, lv) {
  const key = id + ':' + lv;
  let r = infoMemo.get(key);
  if (r !== undefined) return r;
  r = null;
  const sk = G.skillAt(id, lv);
  if (sk) {
    let power = Math.max(Number(sk.power) || 0, Number(sk.finisher) || 0, Number(sk.after) || 0);
    // Vạn Pháp Quy Nhất tung thêm hai chiêu con ở cấp 10 (xem castAllIn): lấy power lớn nhất trong cả ba.
    if (sk.type === 'allin') {
      for (const sid of ['ulChung1', 'ulChung3']) {
        const sub = G.skillAt(sid, 10);
        if (sub) power = Math.max(power, Number(sub.power) || 0);
      }
    }
    r = {
      kind: sk.superUlt ? 3 : sk.ult ? 2 : 1,
      power,
      mpPower: sk.type === 'manaburst' ? (Number(sk.mpPower) || 5.5) : 0,
      vs: Number(sk.vsSlowed) > 1 ? Number(sk.vsSlowed) : 1,
      atkBuff: Number(sk.atkBuff) > 0 ? Number(sk.atkBuff) : 0,
      critBuff: Number(sk.critBuff) > 0 ? Number(sk.critBuff) : 0,
      shred: Number(sk.shred) > 0 ? Number(sk.shred) : 0,
      execMul: sk.exec && Number(sk.exec.mult) > 1 ? Number(sk.exec.mult) : 1,
      execBelow: sk.exec ? Number(sk.exec.below) || 0 : 0,
      reflect: Number(sk.reflect) > 0 ? Number(sk.reflect) : 0,
      dash: sk.type === 'dash',
    };
  }
  infoMemo.set(key, r);
  return r;
}

// ---------------------------------------------------------------- dựng hồ sơ
/*
 * p: nhân vật trong cache; st: G.calcStats(p, { form }) do server tính;
 * skillLevels: { id: cấp } đã học (gồm tuyệt phẩm đã sở hữu + kỹ năng trang bị cấp);
 * equipped: id đang gắn trên thanh; gearId: kỹ năng do trang bị cấp (hoặc null).
 * prev: hồ sơ trước của kết nối này, để giữ thời gian ân hạn khi chỉ số đổi.
 */
function buildProfile(p, st, skillLevels, equipped, gearId, prev, now = Date.now()) {
  const atk = Math.max(Number(st.atk) || 0, 30);
  const skillMul = Number(st.skillMul) || 1;
  const maxMp = Math.max(Number(st.maxMp) || 0, 0);
  const passives = G.passivesOf(p);
  const fx = G.specialFx(p);

  const ids = new Set(Array.isArray(equipped) ? equipped : []);
  if (gearId) ids.add(gearId);

  const entries = new Map();
  const kindBase = [0, 0, 0, 0];
  let atkBuff = 0, critBuff = 0, shred = 0, execMul = 1, execBelow = 0, reflect = 0, dash = false;
  for (const id of ids) {
    const lv = skillLevels[id];
    if (!lv) continue;
    const si = skillInfo(id, lv);
    if (!si) continue;
    atkBuff += si.atkBuff;
    critBuff += si.critBuff;
    reflect += si.reflect;
    if (si.shred > shred) shred = si.shred;
    if (si.execMul > execMul) { execMul = si.execMul; execBelow = si.execBelow; }
    if (si.dash) dash = true;
    const base = si.mpPower ? maxMp * si.mpPower : si.power > 0 ? atk * si.power * skillMul : 0;
    if (base > 0) {
      entries.set(id, { kind: si.kind, base, vs: si.vs, shred: si.shred });
      if (base > kindBase[si.kind]) kindBase[si.kind] = base;
    }
  }

  const archer = passives.includes('cung_thu');
  const shadow = passives.includes('sat_thu') && dash;
  const wt = G.WEAPON_TYPES[st.wtype];
  const pr = {
    at: now, changedAt: now, prev: null,
    atk, school: p.school || null,
    critMul: shadow ? CRIT_SHADOW : archer ? CRIT_ARCHER : CRIT_NORMAL,
    critP: Math.min(CRIT_P_MAX, ((Number(st.crit) || 0) + critBuff) / 100),
    bossMul: 1 + (Number(st.boss) || 0) / 100,
    atkBuffMul: 1 + atkBuff,
    nth: fx.everyNth && Number(fx.everyNth.mult) > 1 ? Number(fx.everyNth.mult) : 1,
    shredMul: 1 + shred,
    execMul, execBelow,
    pierce: fx.pierce || null,
    basicBase: atk * (wt ? wt.mult : 1.25),
    reflect,
    kindBase, entries,
    assistCap: atk * LEGACY_ASSIST_MUL + 50,
    budgetHit: 0,
    sig: '',
  };

  // Lần đánh mạnh nhất có thể của kỹ năng/tuyệt kỹ khi MỌI điều kiện cùng bật: làm tốc độ nạp ngân sách sát thương/giây.
  let worst = 0;
  for (const e of entries.values()) {
    if (e.kind === 3) continue;
    const c = e.base * RANDOM_MAX * pr.atkBuffMul * pr.critMul * pr.nth * pr.shredMul * pr.execMul * pr.bossMul * e.vs * MARGIN;
    if (c > worst) worst = c;
  }
  pr.budgetHit = worst + FLAT_SKILL;

  pr.sig = [atk, skillMul.toFixed(3), maxMp, pr.critMul, pr.critP.toFixed(3), pr.bossMul, pr.atkBuffMul.toFixed(3), pr.nth,
    pr.shredMul, pr.execMul, pr.basicBase.toFixed(1), kindBase.map((v) => Math.round(v)).join(','), entries.size, pr.pierce ? 1 : 0].join('|');

  // Chỉ số đổi → giữ hồ sơ cũ làm ân hạn. Không đổi → thừa hưởng bộ đếm ân hạn đang chạy, không gia hạn mãi.
  if (prev && prev.sig !== pr.sig) { pr.prev = prev; pr.prev.prev = null; pr.changedAt = now; }
  else if (prev) { pr.prev = prev.prev; pr.changedAt = prev.changedAt; }
  return pr;
}

// ---------------------------------------------------------------- tính trần một đòn
function capOf(pr, base, vs, mob, crit, shredOn, now, flat) {
  let m = RANDOM_MAX * pr.atkBuffMul * MARGIN;
  if (crit) m *= pr.critMul;
  if (pr.nth > 1) m *= pr.nth;
  if (shredOn) m *= pr.shredMul;
  const d = mob && mob.def;
  if (d && (d.boss || d.leader)) m *= pr.bossMul;
  if (vs > 1 && mob && (now < (mob.slowUntil || 0) + SLOW_GRACE_MS || now < (mob.freezeUntil || 0) + SLOW_GRACE_MS)) m *= vs;
  if (pr.execMul > 1 && mob && mob.maxHp > 0 && mob.hp <= mob.maxHp * (pr.execBelow + EXEC_GRACE)) m *= pr.execMul;
  if (d) {
    const px = pr.pierce;
    const pierced = px && d.level >= (px.minLevel || 1) && d.level <= (px.maxLevel || 999);
    if (!pierced) m *= 1 - G.defReduce(d.def, d.level);
  }
  return base * m + flat;
}

/*
 * Trần cho một đòn của người chơi (src = 'player').
 *   isSkill=false → đánh thường (gồm phản sát thương); isSkill=true → tra theo id kỹ năng.
 * Kỹ năng không có dòng (chưa gắn, không gây sát thương, id lạ) chỉ còn phần cộng phẳng = coi như bỏ.
 * crit là cờ ĐÃ qua kiểm thống kê, không phải cờ thô từ client.
 */
function hitCap(pr, isSkill, id, mob, crit, shredOn, now) {
  let base, vs = 1, flat;
  if (isSkill) {
    const e = id ? pr.entries.get(id) : null;
    base = e ? e.base : 0; vs = e ? e.vs : 1; flat = FLAT_SKILL;
    if (!e) return flat;
  } else { base = pr.basicBase; flat = FLAT_BASIC; }
  let cap = capOf(pr, base, vs, mob, crit, shredOn, now, flat);
  const old = pr.prev;
  const inGrace = old && now - pr.changedAt < PROFILE_GRACE_MS;
  if (inGrace) {
    let ob = base, ov = vs;
    if (isSkill) { const oe = old.entries.get(id); if (!oe) return cap; ob = oe.base; ov = oe.vs; }
    else ob = old.basicBase;
    const c2 = capOf(old, ob, ov, mob, crit, shredOn, now, flat);
    if (c2 > cap) cap = c2;
  }
  // Phản sát thương của thủ thế đi như đòn thường (không id) nhưng giá trị = CÔNG CỦA QUÁI × tổng phản,
  // cố định (không ngẫu nhiên, không chí mạng, không trùm). Quái đánh mạnh nhất = công gốc × 1,5 (trùm) × 1,25 (nổi giận).
  if (!isSkill) {
    const rf = inGrace && old.reflect > pr.reflect ? old.reflect : pr.reflect;
    if (rf > 0 && mob && mob.def) {
      const rc = (Number(mob.def.atk) || 0) * REFLECT_MOB_ATK_MUL * rf * MARGIN + flat;
      if (rc > cap) cap = rc;
    }
  }
  return cap;
}

// ---------------------------------------------------------------- phá giáp theo từng người đánh
// Client giữ phá giáp trên quái của CHÍNH nó, nên server cũng đếm riêng theo người chơi (state dùng chung theo tài khoản).
function shredActive(g, uid, now) {
  const m = g.shredMobs;
  return !!m && (m.get(uid) || 0) > now;
}
function shredMark(g, uid, now) {
  const m = g.shredMobs || (g.shredMobs = new Map());
  if (m.size >= MAX_SHRED_MOBS && !m.has(uid)) {
    for (const [k, v] of m) if (v <= now) m.delete(k);
    if (m.size >= MAX_SHRED_MOBS) m.delete(m.keys().next().value);
  }
  m.set(uid, now + SHRED_WINDOW_MS);
}

// ---------------------------------------------------------------- kiểm thống kê cờ chí mạng
/*
 * Client tự tung xúc xắc chí mạng nên server không kiểm được từng đòn, chỉ kiểm được TỈ LỆ.
 * Đếm n đòn và k lần cờ chí mạng; với p lớn nhất hợp lệ (chỉ số + buff chí mạng đang gắn), k vượt
 * n·p + 4,5·σ + 3 là xác suất ~1e-5 với người chơi thật. Quá ngưỡng thì cờ chí mạng bị từ chối
 * (đòn bị coi là không chí mạng, bị kẹp bằng trần không chí mạng) cho tới khi tỉ lệ tụt lại.
 * Trả về true nếu cờ chí mạng được chấp nhận.
 */
function critAllowed(g, claimed, pr, now) {
  g.critN = (g.critN || 0) + 1;
  if (claimed) g.critK = (g.critK || 0) + 1;
  if (g.critN >= CRIT_WINDOW) { g.critN /= 2; g.critK = (g.critK || 0) / 2; }
  if (!claimed) return false;
  let p = pr.critP;
  const old = pr.prev;
  if (old && now - pr.changedAt < PROFILE_GRACE_MS && old.critP > p) p = old.critP;
  const n = g.critN;
  if (n < CRIT_MIN_N) return true;
  const limit = n * p + CRIT_Z * Math.sqrt(n * p * (1 - p)) + CRIT_SLACK;
  if (g.critK <= limit) return true;
  g.critFlagged = (g.critFlagged || 0) + 1;
  return false;
}

module.exports = {
  buildProfile, hitCap, shredActive, shredMark, critAllowed, skillInfo,
  RANDOM_MAX, MARGIN, FLAT_BASIC, FLAT_SKILL, PROFILE_GRACE_MS, CRIT_NORMAL, CRIT_ARCHER, CRIT_SHADOW,
};
