'use strict';
/*
 * Giao dịch trực tiếp giữa hai người chơi (xem docs/KE_HOACH_DA_NGUOI_CHOI.md mục 12.4).
 *
 * Luồng: mời → chấp nhận → mỗi bên đặt đồ + xu → mỗi bên bấm KHOÁ → cả hai khoá thì server thực hiện.
 * Chống lừa: đổi bất cứ thứ gì thì bỏ khoá cả hai bên; khoá chỉ bấm được sau LOCK_DELAY_MS kể từ lần đổi gần nhất.
 * Chống nhân bản: việc chuyển đồ / xu chạy đồng bộ trong xplayer.mutateTwo, kiểm tra lại mọi thứ lúc thực hiện.
 */
const G = require('../../shared');
const store = require('../storage/db');
const cache = require('../storage/cache');
const xplayer = require('../game/core/xplayer');
const exchange = require('../game/core/exchange');
const { GameError } = require('../game/core/util');

const LOCK_DELAY_MS = 1500;
const MAX_DIST = 600;
const MAX_AGE_MS = 3 * 60 * 1000;
const INVITE_MS = 30000;

let ctx = null;
let nextId = 1;
const sessions = new Map();     // id → session
const byUser = new Map();       // userId → session
const invites = new Map();      // userId được mời → { from: userId, at }

const init = (c) => { ctx = c; };
const connOf = (userId) => ctx.byUser.get(userId);
const sys = (conn, text) => ctx.send(conn, { t: 'sys', text });

function side(session, userId) { return session.a.userId === userId ? session.a : session.b; }
function other(session, s) { return s === session.a ? session.b : session.a; }

// Cho client xem đúng món đồ thật (lấy từ túi trong bộ nhớ server, không tin client)
async function entriesOf(userId, offer) {
  const p = await cache.getPlayer(userId);
  const out = [];
  for (const it of offer.items) {
    const e = p && p.bag.find((x) => x.uid === it.uid);
    if (e) out.push({ ...e, qty: it.qty });
  }
  return out;
}

async function sendState(session) {
  const [ea, eb] = await Promise.all([entriesOf(session.a.userId, session.a), entriesOf(session.b.userId, session.b)]);
  const lockAt = session.changedAt + LOCK_DELAY_MS;
  for (const [me, them, em, et] of [[session.a, session.b, ea, eb], [session.b, session.a, eb, ea]]) {
    const c = connOf(me.userId);
    if (!c) continue;
    ctx.send(c, {
      t: 'trade', id: session.id, lockAt,
      me: { items: em, gold: me.gold, locked: me.locked },
      them: { id: them.id, name: them.name, lv: them.lv, items: et, gold: them.gold, locked: them.locked },
    });
  }
}

function end(session, reason, done = null) {
  if (!sessions.delete(session.id)) return;
  byUser.delete(session.a.userId); byUser.delete(session.b.userId);
  for (const s of [session.a, session.b]) {
    const c = connOf(s.userId);
    if (c) ctx.send(c, { t: 'trade_end', reason, done });
  }
}

// Điều kiện cùng map, gần nhau, còn sống: kiểm tra mỗi lần khoá và mỗi giây
function problem(session) {
  const ca = connOf(session.a.userId), cb = connOf(session.b.userId);
  if (!ca || !cb) return 'Đối phương đã mất kết nối.';
  if (ca.map !== cb.map || !ca.map) return 'Hai bên không còn ở cùng bản đồ.';
  if (ca.dead || cb.dead) return 'Có người bị đánh bại, giao dịch bị huỷ.';
  if (Math.hypot(ca.x - cb.x, ca.y - cb.y) > MAX_DIST) return 'Hai bên đã đi quá xa nhau.';
  return null;
}

// ---- Lời mời
function invite(conn, targetId) {
  const t = ctx.byId.get(Number(targetId));
  if (!t || t === conn) return sys(conn, 'Không tìm thấy người chơi.');
  if (byUser.has(conn.userId)) return sys(conn, 'Bạn đang trong một giao dịch.');
  if (byUser.has(t.userId)) return sys(conn, `${t.name} đang giao dịch với người khác.`);
  if (t.map !== conn.map || !conn.map || Math.hypot(t.x - conn.x, t.y - conn.y) > MAX_DIST) return sys(conn, 'Phải đứng gần nhau mới giao dịch được.');
  if (conn.dead || t.dead) return sys(conn, 'Không giao dịch được lúc này.');
  invites.set(t.userId, { from: conn.userId, at: Date.now() });
  ctx.send(t, { t: 'trade_inv', from: { id: conn.id, name: conn.name, lv: conn.level }, ms: INVITE_MS });
  sys(conn, `Đã mời ${t.name} giao dịch.`);
}

function respond(conn, ok) {
  const inv = invites.get(conn.userId);
  invites.delete(conn.userId);
  if (!inv || Date.now() - inv.at > INVITE_MS) return sys(conn, 'Lời mời giao dịch đã hết hạn.');
  const from = connOf(inv.from);
  if (!from) return sys(conn, 'Người mời đã thoát.');
  if (!ok) return sys(from, `${conn.name} từ chối giao dịch.`);
  if (byUser.has(conn.userId) || byUser.has(from.userId)) return sys(conn, 'Một trong hai bên đang bận giao dịch.');
  const now = Date.now();
  const session = {
    id: nextId++, startedAt: now, changedAt: now, executing: false,
    a: { userId: from.userId, id: from.id, name: from.name, lv: from.level, items: [], gold: 0, locked: false },
    b: { userId: conn.userId, id: conn.id, name: conn.name, lv: conn.level, items: [], gold: 0, locked: false },
  };
  const why = problem(session);
  if (why) return sys(conn, why);
  sessions.set(session.id, session);
  byUser.set(from.userId, session); byUser.set(conn.userId, session);
  sendState(session);
}

// ---- Đặt đồ / khoá
async function set(conn, raw) {
  const session = byUser.get(conn.userId);
  if (!session || session.executing) return;
  const s = side(session, conn.userId);
  const offer = exchange.normalizeOffer(raw);
  try {
    const p = await cache.getPlayer(conn.userId);
    exchange.checkOffer(p, offer);   // sai thì ném GameError, không đổi gì
  } catch (e) {
    if (e instanceof GameError) return sys(conn, e.message);
    throw e;
  }
  if (!sessions.has(session.id) || session.executing) return;
  s.items = offer.items; s.gold = offer.gold;
  session.a.locked = session.b.locked = false;    // đổi gì cũng bỏ khoá cả hai bên
  session.changedAt = Date.now();
  sendState(session);
}

async function lock(conn, on) {
  const session = byUser.get(conn.userId);
  if (!session || session.executing) return;
  const s = side(session, conn.userId);
  if (!on) { s.locked = false; return sendState(session); }
  const wait = session.changedAt + LOCK_DELAY_MS - Date.now();
  if (wait > 0) return sys(conn, 'Vừa có thay đổi, hãy xem lại rồi khoá sau giây lát.');
  const why = problem(session);
  if (why) return end(session, why);
  try {
    const p = await cache.getPlayer(conn.userId);
    exchange.checkOffer(p, s);
  } catch (e) {
    if (e instanceof GameError) return sys(conn, e.message);
    throw e;
  }
  if (session.executing || !sessions.has(session.id)) return;
  if (Date.now() < session.changedAt + LOCK_DELAY_MS) return sys(conn, 'Vừa có thay đổi, hãy xem lại rồi khoá sau giây lát.');
  s.locked = true;
  if (session.a.locked && session.b.locked) return execute(session);
  sendState(session);
}

async function execute(session) {
  session.executing = true;
  const { a, b } = session;
  try {
    const [outA, outB] = await xplayer.mutateTwo(a.userId, b.userId, (pa, pb, evA, evB) => {
      const sum = exchange.executeTrade(pa, pb, exchange.normalizeOffer(a), exchange.normalizeOffer(b), a.name, b.name);
      evA.push({ t: 'msg', text: `Giao dịch với ${b.name} thành công.`, color: '#a5d6a7' });
      evB.push({ t: 'msg', text: `Giao dịch với ${a.name} thành công.`, color: '#a5d6a7' });
      return sum;
    });
    store.query('INSERT INTO trade_log (at, user_a, user_b, detail) VALUES ($1, $2, $3, $4)',
      [Date.now(), a.userId, b.userId, JSON.stringify({ names: [a.name, b.name], ...outA.result })])
      .catch((e) => console.error('Ghi nhật ký giao dịch lỗi:', e.message));
    end(session, 'Giao dịch thành công.', outA.result);
  } catch (e) {
    end(session, e instanceof GameError ? e.message : 'Giao dịch thất bại, không có gì bị đổi.');
    if (!(e instanceof GameError)) console.error('Giao dịch lỗi:', e);
  }
}

function cancel(conn) {
  const session = byUser.get(conn.userId);
  if (session && !session.executing) end(session, `${conn.name} đã huỷ giao dịch.`);
  invites.delete(conn.userId);
}

// ---- Sự kiện từ realtime
const leaveAny = (conn, reason) => {
  const session = byUser.get(conn.userId);
  if (session && !session.executing) end(session, reason);
  invites.delete(conn.userId);
};
const onClose = (conn) => leaveAny(conn, `${conn.name} đã mất kết nối.`);
const onMapChange = (conn) => leaveAny(conn, 'Giao dịch bị huỷ vì đổi bản đồ.');
const onDead = (conn) => leaveAny(conn, 'Giao dịch bị huỷ vì có người bị đánh bại.');

function tick() {
  const now = Date.now();
  for (const [u, inv] of invites) if (now - inv.at > INVITE_MS) invites.delete(u);
  for (const session of [...sessions.values()]) {
    if (session.executing) continue;
    if (now - session.startedAt > MAX_AGE_MS) { end(session, 'Giao dịch quá thời gian, đã huỷ.'); continue; }
    const why = problem(session);
    if (why) end(session, why);
  }
}

module.exports = { init, invite, respond, set, lock, cancel, onClose, onMapChange, onDead, tick, activeFor: (userId) => byUser.has(userId) };
