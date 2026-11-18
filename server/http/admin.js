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
const auth = require('../accounts/auth');
const xplayer = require('../game/core/xplayer');
const rewards = require('../game/core/rewards');
const { clampHpMp } = require('../game/core/progress');
const { GameError } = require('../game/core/util');

// Trần mỗi lần tặng / thu hồi: gõ nhầm thêm số 0 không phá được nền kinh tế
const CAP = { gold: 1e9, exp: 1e9, linhNgoc: 1e5, skillPoints: 1000, freePoints: 1e5, itemQty: 999, items: 30 };

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

// Chuẩn hóa yêu cầu thu hồi. Khác cleanRewards: ở đây là lấy ĐI, nên có thêm kỹ năng / Tuyệt Phẩm / thú / class.
function cleanRevoke(raw) {
  raw = raw || {};
  const r = {};
  for (const [k, label] of [['gold', 'Xu'], ['exp', 'Kinh nghiệm'], ['linhNgoc', 'Linh Ngọc'], ['skillPoints', 'Điểm kỹ năng'], ['freePoints', 'Điểm tiềm năng']]) {
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

  // Kỹ năng: [id, số cấp giảm]; 0 = xóa hẳn. Tuyệt Phẩm đi đường riêng (p.superUlts, không có cấp).
  if (raw.skills !== undefined && !Array.isArray(raw.skills)) throw new GameError('Danh sách kỹ năng không hợp lệ.');
  const skills = [];
  for (const row of raw.skills || []) {
    const [id, cut] = Array.isArray(row) ? row : [];
    const sk = G.SKILLS[id];
    if (!sk) throw new GameError(`Không có kỹ năng "${String(id).slice(0, 40)}".`);
    if (G.isSuperUlt(id)) throw new GameError(`${sk.name} là Tuyệt Phẩm, thu hồi ở mục Tuyệt Phẩm.`);
    const n = cut === undefined || cut === null || cut === '' ? 0 : Number(cut);
    if (!Number.isInteger(n) || n < 0 || n > G.SKILL_MAX) throw new GameError(`Số cấp giảm của ${sk.name} không hợp lệ.`);
    skills.push([id, n]);
  }
  if (skills.length) r.skills = skills;

  if (raw.superUlts !== undefined && !Array.isArray(raw.superUlts)) throw new GameError('Danh sách Tuyệt Phẩm không hợp lệ.');
  const superUlts = [];
  for (const id of raw.superUlts || []) {
    if (!G.isSuperUlt(id)) throw new GameError(`Không có Tuyệt Phẩm "${String(id).slice(0, 40)}".`);
    superUlts.push(id);
  }
  if (superUlts.length) r.superUlts = superUlts.slice(0, 30);

  if (raw.mounts !== undefined && !Array.isArray(raw.mounts)) throw new GameError('Danh sách thú không hợp lệ.');
  const mounts = [];
  for (const id of raw.mounts || []) {
    if (!Object.prototype.hasOwnProperty.call(G.MOUNTS, id)) throw new GameError(`Không có thú "${String(id).slice(0, 40)}".`);
    mounts.push(id);
  }
  if (mounts.length) r.mounts = mounts.slice(0, 20);

  if (raw.unlockClass) {
    const sc = Object.prototype.hasOwnProperty.call(G.SCHOOLS, raw.unlockClass) ? G.SCHOOLS[raw.unlockClass] : null;
    if (!sc || !sc.special || sc.evolved) throw new GameError('Class mở khóa không hợp lệ (chỉ class đặc biệt).');
    r.unlockClass = raw.unlockClass;
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
    skills: pick(G.SKILLS).sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    superUlts: pick(G.SKILLS).filter((s) => G.SKILLS[s.id].superUlt),
    caps: CAP,
    skillMax: G.SKILL_MAX,
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

  // Xem nhân vật đang có gì, để trang thu hồi biết chính xác đang giữ bao nhiêu.
  async detail(session, body) {
    const target = await store.userById(Number(body.user));
    if (!target) return bad('Không tìm thấy người chơi.');
    const p = await cache.getPlayer(target.id);
    if (!p) return bad('Không đọc được nhân vật.');
    const bag = {};
    for (const e of p.bag || []) {
      const def = G.ITEMS[e.id];
      if (!def) continue;
      bag[e.id] = bag[e.id] || { id: e.id, name: def.name, qty: 0, plus: 0 };
      bag[e.id].qty += e.qty || 1;
      bag[e.id].plus = Math.max(bag[e.id].plus, e.plus || 0);
    }
    // Kỳ Nguyên đã mua hiện chung danh sách vật phẩm để chọn thu hồi
    for (const id of (p.kyNguyen && p.kyNguyen.owned) || []) {
      const def = G.ITEMS[id];
      if (def && def.kyNguyen) bag[id] = { id, name: def.name, qty: 1, plus: 0 };
    }
    const skills = Object.keys(p.skills || {})
      .filter((id) => G.SKILLS[id] && p.skills[id] > 0)
      .map((id) => ({ id, name: G.SKILLS[id].name, level: p.skills[id], ult: !!G.SKILLS[id].ult }));
    return ok({
      user: rowOut({ ...target, level: p.level, school: p.school, gold: p.gold, ngoc: p.linhNgoc, name: p.name }),
      player: {
        level: p.level, exp: p.exp, gold: p.gold, linhNgoc: p.linhNgoc || 0,
        skillPoints: p.skillPoints || 0, freePoints: p.freePoints || 0,
        bag: Object.values(bag).sort((a, b) => a.name.localeCompare(b.name, 'vi')),
        skills: skills.sort((a, b) => a.name.localeCompare(b.name, 'vi')),
        superUlts: Object.keys(p.superUlts || {}).filter((id) => G.isSuperUlt(id)).map((id) => ({ id, name: G.SKILLS[id].name })),
        mounts: (p.mounts && p.mounts.owned ? p.mounts.owned : []).filter((id) => G.MOUNTS[id]).map((id) => ({ id, name: G.MOUNTS[id].name })),
        unlocks: Object.keys(p.unlocks || {}).filter((id) => p.unlocks[id] && G.SCHOOLS[id]).map((id) => ({ id, name: G.SCHOOLS[id].name })),
      },
    });
  },

  /*
   * Thu hồi. Ngược chiều với grant nhưng KHÔNG hoàn điểm: lấy đi là mất.
   * Thiếu thì lấy tới mức có và báo lại đúng số đã lấy, không âm ví và không xóa quá tay.
   */
  async revoke(session, body) {
    const target = await store.userById(Number(body.user));
    if (!target) return bad('Không tìm thấy người chơi.');
    let r;
    try { r = cleanRevoke(body.rewards); } catch (e) { if (e instanceof GameError) return bad(e.message); throw e; }
    if (!Object.keys(r).length) return bad('Chưa chọn thứ gì để thu hồi.');

    const taken = {};
    const note = (k, v) => { if (v) taken[k] = v; };
    try {
      const out = await xplayer.mutate(target.id, (p, ev) => {
        if (r.gold) { const n = Math.min(r.gold, Math.max(0, p.gold || 0)); p.gold -= n; note('gold', n); }
        if (r.exp) { const n = Math.min(r.exp, Math.max(0, p.exp || 0)); p.exp -= n; note('exp', n); }
        if (r.linhNgoc) { const n = Math.min(r.linhNgoc, Math.max(0, p.linhNgoc || 0)); p.linhNgoc -= n; note('linhNgoc', n); }
        if (r.skillPoints) { const n = Math.min(r.skillPoints, Math.max(0, p.skillPoints || 0)); p.skillPoints -= n; note('skillPoints', n); }
        if (r.freePoints) { const n = Math.min(r.freePoints, Math.max(0, p.freePoints || 0)); p.freePoints -= n; note('freePoints', n); }

        const items = [];
        for (const [id, want] of r.items || []) {
          // Kỳ Nguyên không nằm trong túi: nằm ở p.kyNguyen (owned = đã mua, active = đang bật). Thu hồi là gỡ khỏi cả hai.
          if (G.ITEMS[id] && G.ITEMS[id].kyNguyen) {
            const kn = p.kyNguyen;
            if (!kn || !Array.isArray(kn.owned) || !kn.owned.includes(id)) continue;
            kn.owned = kn.owned.filter((x) => x !== id);
            kn.active = (kn.active || []).filter((x) => x !== id);
            items.push([id, 1]);
            continue;
          }
          const have = (p.bag || []).filter((e) => e.id === id).reduce((s, e) => s + (e.qty || 1), 0);
          const n = Math.min(want, have);
          if (n < 1) continue;
          let left = n;
          for (let i = p.bag.length - 1; i >= 0 && left > 0; i--) {
            const e = p.bag[i];
            if (e.id !== id) continue;
            const take = Math.min(e.qty || 1, left);
            e.qty -= take; left -= take;
            if (e.qty <= 0) p.bag.splice(i, 1);
          }
          items.push([id, n]);
        }
        if (items.length) taken.items = items;

        const skills = [];
        for (const [id, cut] of r.skills || []) {
          const cur = (p.skills && p.skills[id]) || 0;
          if (cur < 1) continue;
          const next = cut === 0 ? 0 : Math.max(0, cur - cut);
          if (next < 1) {
            delete p.skills[id];
            p.skillSlots = (p.skillSlots || []).map((s) => (s === id ? null : s));
          } else p.skills[id] = next;
          skills.push([id, cut === 0 ? cur : cur - next]);
        }
        if (skills.length) taken.skills = skills;

        const superUlts = [];
        for (const id of r.superUlts || []) {
          if (!p.superUlts || !p.superUlts[id]) continue;
          delete p.superUlts[id];
          p.skillSlots = (p.skillSlots || []).map((s) => (s === id ? null : s));
          superUlts.push(id);
        }
        if (superUlts.length) taken.superUlts = superUlts;

        const mounts = [];
        for (const id of r.mounts || []) {
          if (!p.mounts || !p.mounts.owned.includes(id)) continue;
          p.mounts.owned = p.mounts.owned.filter((x) => x !== id);
          p.mounts.summoned = (p.mounts.summoned || []).filter((x) => x !== id);
          if (p.pets) delete p.pets[id];
          if (p.mounts.skills) delete p.mounts.skills[id];
          mounts.push(id);
        }
        if (mounts.length) {
          p.mounts.active = (p.mounts.summoned || [])[0] || null;
          p.pet = p.mounts.active ? p.pets[p.mounts.active] : { hp: null, mp: null, sta: null };
          taken.mounts = mounts;
        }

        if (r.unlockClass && p.unlocks && p.unlocks[r.unlockClass]) {
          delete p.unlocks[r.unlockClass];
          taken.unlockClass = r.unlockClass;
        }

        if (!Object.keys(taken).length) throw new GameError('Người chơi không còn gì trong số đó để thu hồi.');
        clampHpMp(p);
        ev.push({ t: 'msg', text: '[Hệ thống] Quản trị viên đã thu hồi một số vật phẩm và giá trị trong tài khoản.', color: '#ff8a80' });
      });
      await store.adminLog(session.userId, target.id, 'revoke', taken);
      return ok({
        taken,
        events: out.events.filter((e) => e.t === 'msg').map((e) => e.text),
        online: cache.isLoaded(target.id),
      });
    } catch (e) {
      if (e instanceof GameError) return bad(e.message);
      console.error('Admin thu hồi lỗi:', e);
      return bad(e.message || 'Không thu hồi được.');
    }
  },

  // Đổi tên đăng nhập / mật khẩu của một tài khoản.
  async account(session, body) {
    const target = await store.userById(Number(body.user));
    if (!target) return bad('Không tìm thấy người chơi.');
    if (Number(target.id) === Number(session.userId)) return bad('Không đổi tài khoản của chính mình ở đây. Dùng lệnh đổi mật khẩu ngoài trang admin.');
    const newName = String(body.username || '').trim();
    const newPass = String(body.password || '');
    if (!newName && !newPass) return bad('Chưa nhập tên đăng nhập mới hay mật khẩu mới.');
    if (newName && !/^[\p{L}\p{N}_]{3,20}$/u.test(newName)) {
      return bad('Tên đăng nhập 3–20 ký tự, chỉ gồm chữ, số và dấu gạch dưới.');
    }
    if (newPass && (newPass.length < 6 || newPass.length > 100)) return bad('Mật khẩu cần ít nhất 6 ký tự.');

    const changed = {};
    if (newName && newName.toLowerCase() !== String(target.username).toLowerCase()) {
      const clash = await store.userByName(newName);
      if (clash && Number(clash.id) !== target.id) return bad('Tên đăng nhập đã tồn tại.');
      try {
        await store.setUsername(target.id, newName);
      } catch (e) {
        if (e.code === '23505') return bad('Tên đăng nhập đã tồn tại.');
        throw e;
      }
      changed.username = { from: target.username, to: newName };
    }
    if (newPass) {
      await store.setPassword(target.id, await auth.hashPassword(newPass));
      changed.password = true;
    }
    if (!Object.keys(changed).length) return bad('Không có gì thay đổi.');

    // Đổi mật khẩu thì đá hết phiên cũ, trừ khi admin muốn giữ nguyên.
    // Đổi tên thì chỉ xóa cache (session vẫn sống, lần sau đọc lại lấy tên mới) để không hiện tên cũ 60 giây.
    if (newPass && body.logout !== false) {
      await store.deleteUserSessions(target.id);
      changed.sessionsCleared = true;
    }
    if (newPass || changed.username) cache.dropUserSessions(target.id);
    await store.logAuth({
      userId: target.id, username: newName || target.username,
      event: 'admin_change', detail: `admin:${session.username} đổi ${[changed.username ? 'tên đăng nhập' : '', changed.password ? 'mật khẩu' : ''].filter(Boolean).join(' + ')}`,
    });
    await store.adminLog(session.userId, target.id, 'account', changed);
    return ok({ changed });
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
