'use strict';
/*
 * Trang admin: các route /api/admin/* (chỉ POST + JSON, gắn trong server/index.js).
 *
 * Admin là tài khoản game thường có cờ users.is_admin (cấp bằng: node server/tools/ops/user.js admin <tên> on).
 * Người không phải admin gọi bất kỳ route nào ở đây đều nhận 404 như không có gì.
 * Mọi thao tác làm thay đổi dữ liệu đều ghi vào bảng admin_log.
 */
const G = require('../../shared');
const store = require('../storage/db');
const cache = require('../storage/cache');
const codes = require('../accounts/codes');
const xplayer = require('../game/core/xplayer');
const rewards = require('../game/core/rewards');
const { GameError } = require('../game/core/util');

// Trần mỗi lần tặng: gõ nhầm thêm số 0 không phá được nền kinh tế
const CAP = { gold: 1e9, exp: 1e9, linhNgoc: 1e5, skillPoints: 1000, itemQty: 999, items: 30 };

const NOT_FOUND = { status: 404, obj: { error: 'Không tìm thấy.' } };
const bad = (msg) => ({ status: 400, obj: { error: msg } });
const ok = (obj = {}) => ({ status: 200, obj: { ok: true, ...obj } });

// Giới hạn tốc độ nhẹ: mỗi admin tối đa 120 lệnh / phút
const hits = new Map();
function rateOk(userId) {
  const now = Date.now(), h = (hits.get(userId) || []).filter((t) => now - t < 60000);
  h.push(now); hits.set(userId, h);
  return h.length <= 120;
}

// Số nguyên không âm trong trần; rỗng → 0; sai → ném lỗi
function amount(v, max, label) {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) throw new GameError(`${label}: phải là số nguyên không âm.`);
  if (n > max) throw new GameError(`${label}: tối đa ${max.toLocaleString('en-US')} mỗi lần.`);
  return n;
}

// Chuẩn hóa phần thưởng nhập từ trang web (dùng cho cả tặng trực tiếp lẫn tạo mã). Id lạ → từ chối.
function cleanRewards(raw) {
  raw = raw || {};
  const r = {};
  for (const [k, label] of [['gold', 'Xu'], ['exp', 'Kinh nghiệm'], ['linhNgoc', 'Linh Ngọc'], ['skillPoints', 'Điểm kỹ năng']]) {
    const n = amount(raw[k], CAP[k], label);
    if (n) r[k] = n;
  }
  if (raw.items !== undefined && !Array.isArray(raw.items)) throw new GameError('Danh sách vật phẩm không hợp lệ.');
  const items = [];
  for (const row of raw.items || []) {
    const [id, n] = Array.isArray(row) ? row : [];
    if (!Object.prototype.hasOwnProperty.call(G.ITEMS, id)) throw new GameError(`Không có vật phẩm "${String(id).slice(0, 40)}".`);
    const q = amount(n, CAP.itemQty, 'Số lượng');
    if (q < 1) throw new GameError(`Số lượng của ${G.ITEMS[id].name} phải từ 1.`);
    items.push([id, q]);
  }
  if (items.length > CAP.items) throw new GameError(`Tối đa ${CAP.items} loại vật phẩm mỗi lần.`);
  if (items.length) r.items = items;
  if (raw.unlockClass) {
    const sc = Object.prototype.hasOwnProperty.call(G.SCHOOLS, raw.unlockClass) ? G.SCHOOLS[raw.unlockClass] : null;
    if (!sc || !sc.special || sc.evolved) throw new GameError('Class mở khóa không hợp lệ (chỉ class đặc biệt).');
    r.unlockClass = raw.unlockClass;
  }
  if (Array.isArray(raw.mounts) && raw.mounts.length) {
    for (const id of raw.mounts) if (!Object.prototype.hasOwnProperty.call(G.MOUNTS, id)) throw new GameError(`Không có thú "${String(id).slice(0, 40)}".`);
    r.mounts = raw.mounts.slice(0, 20);
  }
  return r;
}

// Danh mục để trang chọn: chỉ {id, tên} cho gọn
function catalog() {
  const pick = (obj) => Object.keys(obj).map((id) => ({ id, name: obj[id].name }));
  return {
    items: pick(G.ITEMS).sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    schools: pick(G.SCHOOLS).filter((s) => G.SCHOOLS[s.id].special && !G.SCHOOLS[s.id].evolved),
    mounts: pick(G.MOUNTS),
    caps: CAP,
  };
}

const rowOut = (r) => ({
  id: Number(r.id), username: r.username, name: r.name || null, level: r.level, school: r.school,
  gold: r.gold == null ? null : Number(r.gold), ngoc: r.ngoc == null ? 0 : Number(r.ngoc),
  banned: !!r.banned, banReason: r.ban_reason, isAdmin: !!r.is_admin, online: cache.isLoaded(Number(r.id)),
  lastLogin: r.last_login == null ? null : Number(r.last_login),
});

const routes = {
  async me(session) { return ok({ admin: session.username }); },

  async catalog() { return ok(catalog()); },

  async find(session, body) {
    const q = String(body.q || '').trim().slice(0, 40);
    if (q.length < 1) return bad('Nhập tên đăng nhập hoặc tên nhân vật.');
    return ok({ users: (await store.findUsers(q)).map(rowOut) });
  },

  // Tặng cho một người. Đi qua xplayer.mutate: nhân vật đang online được sửa đúng trong bộ nhớ (không bị cache ghi đè)
  // và nhận bản vá ngay qua WebSocket; offline thì nạp lên, sửa, lưu.
  async grant(session, body) {
    const target = await store.userById(Number(body.user));
    if (!target) return bad('Không tìm thấy người chơi.');
    let r;
    try { r = cleanRewards(body.rewards); } catch (e) { if (e instanceof GameError) return bad(e.message); throw e; }
    if (!Object.keys(r).length) return bad('Chưa chọn phần thưởng nào.');
    const src = 'admin:' + session.username;
    try {
      const out = await xplayer.mutate(target.id, (p, ev) => {
        const plan = rewards.checkRewards(p, r);   // túi đầy... → ném lỗi, hoàn tác hết
        ev.push({ t: 'msg', text: '[Hệ thống] Bạn nhận được quà từ quản trị viên.', color: '#ffd54f' });
        rewards.applyRewards(p, plan, ev, src);
      });
      await store.adminLog(session.userId, target.id, 'grant', r);
      return ok({ events: out.events.filter((e) => e.t === 'msg').map((e) => e.text) });
    } catch (e) {
      if (e instanceof GameError) return bad(e.message);
      console.error('Admin tặng lỗi:', e);
      return bad(e.message || 'Không tặng được.');
    }
  },

  async 'codes/list'() {
    const rows = await codes.list();
    return ok({ codes: rows.map((c) => ({ code: c.code, note: c.note, rewards: c.rewards, maxUses: c.max_uses, uses: Number(c.uses), expires: c.expires == null ? null : Number(c.expires) })) });
  },

  async 'codes/add'(session, body) {
    const code = codes.normalize(body.code);
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return bad('Mã gồm 3–32 ký tự: chữ, số, gạch ngang, gạch dưới.');
    let r;
    try { r = cleanRewards(body.rewards); } catch (e) { if (e instanceof GameError) return bad(e.message); throw e; }
    if (!Object.keys(r).length) return bad('Mã chưa có phần thưởng nào.');
    const maxUses = body.maxUses === '' || body.maxUses == null ? null : Number(body.maxUses);
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 1e7)) return bad('Số lượt phải là số nguyên từ 1.');
    const expires = body.expires === '' || body.expires == null ? null : Number(body.expires);
    if (expires !== null && (!Number.isFinite(expires) || expires < Date.now())) return bad('Hạn dùng phải ở tương lai.');
    const note = body.note ? String(body.note).slice(0, 100) : null;
    const meta = await store.giftCodeMeta(code);
    const row = await codes.add({ code, note, rewards: r, maxUses, expires });
    await store.adminLog(session.userId, null, meta ? 'code_update' : 'code_add', { code, note, rewards: r, maxUses, expires });
    return ok({ code: row.code, updated: !!meta });
  },

  async 'codes/remove'(session, body) {
    const code = codes.normalize(body.code);
    const n = await codes.remove(code);
    if (!n) return bad('Không có mã này.');
    await store.adminLog(session.userId, null, 'code_remove', { code });
    return ok();
  },

  async ban(session, body) {
    const target = await store.userById(Number(body.user));
    if (!target) return bad('Không tìm thấy người chơi.');
    if (target.is_admin) return bad('Không khóa được tài khoản admin (gỡ quyền admin bằng dòng lệnh trước).');
    const on = !!body.banned;
    const reason = on ? String(body.reason || '').slice(0, 100) || null : null;
    await store.setBanned(target.id, on, reason);
    if (on) { await store.deleteUserSessions(target.id); cache.dropUserSessions(Number(target.id)); }
    await store.logAuth({ userId: target.id, username: target.username, event: on ? 'ban' : 'unban', detail: reason });
    await store.adminLog(session.userId, target.id, on ? 'ban' : 'unban', { reason });
    return ok();
  },

  async log() {
    const rows = await store.adminLogList(50);
    return ok({ log: rows.map((r) => ({ id: Number(r.id), at: Number(r.at), action: r.action, admin: r.admin, target: r.target, detail: r.detail })) });
  },
};

// url: '/api/admin/<route>'. Trả { status, obj }.
async function handle(url, session, body) {
  const name = url.slice('/api/admin/'.length);
  if (!session || !session.isAdmin || !Object.prototype.hasOwnProperty.call(routes, name)) return NOT_FOUND;
  if (!rateOk(session.userId)) return { status: 429, obj: { error: 'Thao tác quá nhanh, chờ một chút.' } };
  try { return await routes[name](session, body || {}); }
  catch (e) { console.error('Admin lỗi:', e); return { status: 500, obj: { error: 'Lỗi server.' } }; }
}

module.exports = { handle };
