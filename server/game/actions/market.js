'use strict';
/*
 * Luật chơi phía server · Chợ người chơi (xem docs/KE_HOACH_DA_NGUOI_CHOI.md mục 12.5).
 *
 * Món đồ đăng bán được RÚT khỏi túi và giữ trong bảng market_listings. Người mua duy nhất được quyết định bằng một
 * câu lệnh UPDATE ... WHERE status='active' (cùng lúc hai người mua thì chỉ một người thắng). Thứ tự ở mọi hành động:
 * sửa nhân vật trong bộ nhớ trước, rồi mới đổi bảng; bảng không đổi được thì ném lỗi để hành động bị hoàn tác.
 * Tiền cho người bán chuyển sau (có thể đang offline), có cơ chế thử lại (settleUnpaid).
 */
const G = require('../../../shared');
const store = require('../../storage/db');
const xplayer = require('../core/xplayer');
const { fail, fmt } = require('../core/util');
const { bagFree, slotsNeeded, addItem, addInst } = require('../core/inventory');

const MAX_LISTINGS = 10;
const MAX_PRICE = 999999999;
const LIFETIME_MS = 48 * 3600 * 1000;
const TAX = 0.05;
const PAGE = 20;

const isVillage = (p) => !!(G.MAPS[p.map] && G.MAPS[p.map].village);
const needVillage = (p) => { if (!isVillage(p)) fail('Chợ chỉ mở trong làng.'); };
const int = (v) => (Number.isFinite(Number(v)) ? Math.floor(Number(v)) : NaN);

function rowOut(r, now) {
  return {
    id: r.id, seller: r.seller_name, sellerId: r.seller_id, inst: r.inst, price: r.price, level: r.level, slot: r.slot,
    expires: r.expires, expired: r.status === 'active' && r.expires <= now, status: r.status,
  };
}

// Thêm món trong tin đăng vào túi (stack gộp, trang bị lấy lại đúng chỉ số)
function receive(p, inst) {
  const def = G.ITEMS[inst.id];
  if (!def) fail('Vật phẩm không còn tồn tại.');
  if (bagFree(p) < slotsNeeded(p, inst.id, inst.qty || 1)) fail('Túi đã đầy.');
  if (def.stack) addItem(p, inst.id, inst.qty || 1);
  else addInst(p, { ...inst });
}

// Chuyển tiền bán cho người bán (đã trừ thuế). Mỗi tin chỉ trả một lần: đánh dấu paid trước, thất bại thì bỏ đánh dấu để thử lại.
async function settle(id) {
  const { rows } = await store.query('UPDATE market_listings SET paid = TRUE WHERE id = $1 AND status = \'sold\' AND paid = FALSE RETURNING *', [id]);
  if (!rows.length) return false;
  const r = rows[0];
  const gain = r.price - Math.floor(r.price * TAX);
  const def = G.ITEMS[r.item_id];
  try {
    await xplayer.mutate(r.seller_id, (p, ev) => {
      p.gold += gain;
      ev.push({ t: 'msg', text: `[Chợ] Đã bán ${def ? def.name : 'vật phẩm'}${r.qty > 1 ? ' ×' + r.qty : ''}: +${fmt(gain)} xu (thuế ${Math.round(TAX * 100)}%).`, color: '#ffd54f' });
      ev.push({ t: 'float', text: `+${fmt(gain)} xu`, color: '#ffd54f' });
    });
    return true;
  } catch (e) {
    await store.query('UPDATE market_listings SET paid = FALSE WHERE id = $1', [id]).catch(() => {});
    console.error('Chuyển tiền chợ cho người bán lỗi (sẽ thử lại):', id, e.message);
    return false;
  }
}

// Thử lại các tin đã bán mà chưa trả tiền (lỗi mạng DB, người bán chưa tải được...). Gọi định kỳ.
async function settleUnpaid() {
  const { rows } = await store.query('SELECT id FROM market_listings WHERE status = \'sold\' AND paid = FALSE AND sold_at < $1 ORDER BY id LIMIT 20', [Date.now() - 30000]);
  for (const r of rows) await settle(r.id);
  return rows.length;
}

const actions = {
  // Duyệt chợ: tìm theo tên, loại (slot hoặc 'stack' cho vật phẩm không phải trang bị), khoảng cấp, sắp xếp theo giá / mới nhất
  async market_browse(p, a, ev) {
    needVillage(p);
    const now = Date.now();
    const where = ['status = \'active\'', 'expires > $1'], params = [now];
    const add = (cond, v) => { params.push(v); where.push(cond.replace('?', '$' + params.length)); };
    const q = String(a.q || '').trim().slice(0, 40);
    if (q) add('item_name ILIKE ?', '%' + q.replace(/[\\%_]/g, (c) => '\\' + c) + '%');
    if (a.slot === 'stack') where.push('slot IS NULL');
    else if (typeof a.slot === 'string' && G.SLOTS.includes(a.slot)) add('slot = ?', a.slot);
    const lo = int(a.min), hi = int(a.max);
    if (lo >= 1) add('level >= ?', lo);
    if (hi >= 1) add('level <= ?', hi);
    const order = a.sort === 'price_desc' ? 'price DESC, id DESC' : a.sort === 'new' ? 'id DESC' : 'price ASC, id ASC';
    const page = Math.max(0, Math.min(500, int(a.page) || 0));
    const [{ rows }, { rows: cnt }] = await Promise.all([
      store.query(`SELECT * FROM market_listings WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ${PAGE} OFFSET ${page * PAGE}`, params),
      store.query(`SELECT COUNT(*)::int AS n FROM market_listings WHERE ${where.join(' AND ')}`, params),
    ]);
    ev.push({ t: 'market', kind: 'browse', list: rows.map((r) => rowOut(r, now)), total: cnt[0].n, page, per: PAGE });
  },

  async market_mine(p, a, ev, userId) {
    needVillage(p);
    const now = Date.now();
    const { rows } = await store.query(
      `SELECT * FROM market_listings WHERE seller_id = $1 AND (status = 'active' OR (status = 'sold' AND sold_at > $2)) ORDER BY id DESC LIMIT 40`,
      [userId, now - 24 * 3600 * 1000]);
    ev.push({ t: 'market', kind: 'mine', list: rows.map((r) => rowOut(r, now)), max: MAX_LISTINGS, tax: TAX });
  },

  async market_list(p, a, ev, userId) {
    needVillage(p);
    const e = p.bag.find((x) => x.uid === Number(a.uid));
    if (!e) fail('Không tìm thấy vật phẩm trong túi.');
    const def = G.ITEMS[e.id];
    if (!def || def.kind === 'quest') fail('Vật phẩm nhiệm vụ không bán được.');
    const price = int(a.price);
    if (!(price >= 1 && price <= MAX_PRICE)) fail(`Giá từ 1 đến ${fmt(MAX_PRICE)} xu.`);
    const qty = def.stack ? Math.max(1, Math.min(e.qty, int(a.qty) || e.qty)) : 1;
    const { rows: mine } = await store.query('SELECT COUNT(*)::int AS n FROM market_listings WHERE seller_id = $1 AND status = \'active\'', [userId]);
    if (mine[0].n >= MAX_LISTINGS) fail(`Chỉ đăng bán tối đa ${MAX_LISTINGS} món cùng lúc.`);
    // Rút khỏi túi trước (hoàn tác được nếu bảng lỗi)
    let inst;
    if (def.stack) {
      inst = { id: e.id, qty, plus: 0 };
      e.qty -= qty;
      if (e.qty <= 0) p.bag.splice(p.bag.indexOf(e), 1);
    } else {
      const { uid, ...rest } = e;
      inst = { ...rest, qty: 1 };
      p.bag.splice(p.bag.indexOf(e), 1);
    }
    const now = Date.now();
    await store.query(
      `INSERT INTO market_listings (seller_id, seller_name, inst, item_id, item_name, slot, level, qty, price, status, created, expires)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, $11)`,
      [userId, p.name, JSON.stringify(inst), e.id, def.name, def.slot || null, def.level || 1, qty, price, now, now + LIFETIME_MS]);
    ev.push({ t: 'msg', text: `[Chợ] Đã đăng bán ${def.name}${qty > 1 ? ' ×' + qty : ''} giá ${fmt(price)} xu (phí thuế ${Math.round(TAX * 100)}% khi bán được).`, color: '#ffd54f' });
  },

  async market_buy(p, a, ev, userId) {
    needVillage(p);
    const id = int(a.id);
    if (!(id > 0)) fail('Tin không hợp lệ.');
    const now = Date.now();
    const { rows: cur } = await store.query('SELECT * FROM market_listings WHERE id = $1', [id]);
    const r = cur[0];
    if (!r || r.status !== 'active' || r.expires <= now) fail('Món này đã được bán hoặc hết hạn.');
    if (r.seller_id === userId) fail('Không tự mua đồ của mình, hãy huỷ tin để lấy lại.');
    if (p.gold < r.price) fail('Không đủ xu.');
    // Sửa nhân vật người mua trước (túi không đủ chỗ thì ném lỗi, chưa đụng tới bảng)
    receive(p, r.inst);
    p.gold -= r.price;
    // Chỉ một người thắng: tin phải còn 'active' ngay lúc này
    const { rows } = await store.query(
      'UPDATE market_listings SET status = \'sold\', buyer_id = $2, sold_at = $3 WHERE id = $1 AND status = \'active\' AND expires > $3 RETURNING id',
      [id, userId, now]);
    if (!rows.length) fail('Món này vừa có người khác mua mất.');
    const def = G.ITEMS[r.item_id];
    ev.push({ t: 'msg', text: `[Chợ] Đã mua ${def ? def.name : 'vật phẩm'}${r.qty > 1 ? ' ×' + r.qty : ''} (-${fmt(r.price)} xu).`, color: '#a5d6a7' });
    // Tiền cho người bán: lỗi thì không ảnh hưởng người mua, sẽ được thử lại (settleUnpaid)
    settle(id).catch((e) => console.error('Chuyển tiền chợ lỗi:', e.message));
  },

  // Huỷ tin đang bán, hoặc lấy lại tin hết hạn: món về túi
  async market_cancel(p, a, ev, userId) {
    needVillage(p);
    const id = int(a.id);
    if (!(id > 0)) fail('Tin không hợp lệ.');
    const { rows: cur } = await store.query('SELECT * FROM market_listings WHERE id = $1 AND seller_id = $2', [id, userId]);
    const r = cur[0];
    if (!r || r.status !== 'active') fail('Tin này không còn để lấy lại.');
    receive(p, r.inst);
    const { rows } = await store.query('UPDATE market_listings SET status = \'closed\' WHERE id = $1 AND seller_id = $2 AND status = \'active\' RETURNING id', [id, userId]);
    if (!rows.length) fail('Tin này vừa được bán, không lấy lại được.');
    ev.push({ t: 'msg', text: '[Chợ] Đã lấy lại món đồ về túi.', color: '#a5d6a7' });
  },
};

module.exports = actions;
// Không liệt kê (enumerable: false) để không lọt vào danh sách hành động client gọi được (Object.assign ở game/index.js)
Object.defineProperty(module.exports, 'settleUnpaid', { value: settleUnpaid, enumerable: false });
