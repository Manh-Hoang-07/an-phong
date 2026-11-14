'use strict';
/*
 * Thời gian thực: người chơi cùng bản đồ thấy nhau và chat (xem docs/KE_HOACH_DA_NGUOI_CHOI.md).
 *
 * - WebSocket tại /ws, xác thực bằng cookie phiên `ap_session` có sẵn.
 * - Mỗi tài khoản một kết nối; mở kết nối mới thì kết nối cũ bị đóng (mã 4001).
 * - Phòng theo bản đồ. Vị trí chỉ để HIỂN THỊ (combat/di chuyển vẫn ở client), không tính thưởng từ đây.
 * - Tên, class, cấp, vũ khí lấy từ nhân vật trong cache server, không tin client.
 * - Mọi trạng thái nằm trong bộ nhớ tiến trình. Nếu sau này chạy nhiều tiến trình thì thay `rooms`
 *   bằng Redis pub/sub; phần còn lại của server không đụng tới module này.
 */
const { WebSocketServer } = require('ws');
const G = require('../../shared');
const auth = require('../accounts/auth');
const cache = require('../storage/cache');
const claims = require('./claims');
const party = require('./party');
const trade = require('./trade');
const xplayer = require('../game/core/xplayer');
const { World, STEP_MS, IDLE_DROP_MS } = require('./mobs');

const PATH = '/ws';
const TICK_MS = 100;              // chu kỳ phát vị trí
const PING_MS = 25000;
const LOOK_REFRESH_MS = 5000;     // cập nhật tên/cấp/class/vũ khí từ nhân vật
const SESSION_CHECK_MS = 30000;
const MAX_MSG_BYTES = 1024;
const MAX_MSGS_PER_SEC = 160;
const MAX_HITS_PER_SEC = 80;      // đòn đánh quái tối đa mỗi giây của một người
const CHAT_MAX_LEN = 100;
const CHAT_GAP_MS = { map: 1200, world: 8000, party: 800 };
const WORLD_BOUND = 100000;
const ANIMS = new Set(['idle', 'run', 'jump', 'fall', 'atk', 'hit', 'dead']);

const rooms = new Map();          // mapId → Map(connId → conn)
const byUser = new Map();         // userId → conn
const byId = new Map();           // connId → conn
const worlds = new Map();         // mapId → World (quái của bản đồ đang có người)
let mobTimer = null;
let nextId = 1;
let wss = null;
let tickTimer = null;

const cookies = (req) => {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) { try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* bỏ qua */ } }
  }
  return out;
};

function sendRaw(conn, text) {
  if (conn.ws.readyState === 1 && conn.ws.bufferedAmount < 256 * 1024) conn.ws.send(text);
}
const send = (conn, obj) => sendRaw(conn, JSON.stringify(obj));

function lookOf(conn) {
  return { id: conn.id, name: conn.name, sc: conn.school, lv: conn.level, w: conn.weapon };
}
function stateOf(conn) {
  return { ...lookOf(conn), x: conn.x, y: conn.y, f: conn.f, a: conn.a };
}

// Đọc nhân vật trong cache để lấy thông tin hiển thị; trả về true nếu có thay đổi
async function refreshLook(conn) {
  const p = await cache.getPlayer(conn.userId);
  if (!p) return false;
  const weapon = (p.equip && p.equip.weapon && p.equip.weapon.id) || null;
  const school = p.school || null;
  const level = Number(p.level) || 1;
  const name = String(p.name || '?').slice(0, 16);
  try {
    const st = G.calcStats(p, { form: !!p.formActive });
    // Trần sát thương một đòn (đã gồm chí mạng, buff, hệ số kỹ năng): chặn client gửi số tuỳ ý
    conn.dmgCap = Math.max(st.atk, 30) * 60 + 500;
  } catch { conn.dmgCap = 5000; }
  const changed = name !== conn.name || school !== conn.school || level !== conn.level || weapon !== conn.weapon;
  conn.name = name; conn.school = school; conn.level = level; conn.weapon = weapon;
  return changed;
}

function room(mapId) {
  let r = rooms.get(mapId);
  if (!r) { r = new Map(); rooms.set(mapId, r); }
  return r;
}

function broadcast(mapId, obj, exceptId) {
  const r = rooms.get(mapId);
  if (!r) return;
  const text = JSON.stringify(obj);
  for (const c of r.values()) if (c.id !== exceptId) sendRaw(c, text);
}

function leaveRoom(conn) {
  if (!conn.map) return;
  const r = rooms.get(conn.map);
  if (r) {
    r.delete(conn.id);
    if (!r.size) rooms.delete(conn.map);
    else broadcast(conn.map, { t: 'leave', id: conn.id });
  }
  conn.map = null;
}

function enterRoom(conn, mapId) {
  leaveRoom(conn);
  conn.map = mapId;
  conn.dirty = false;
  const r = room(mapId);
  send(conn, { t: 'room', map: mapId, list: [...r.values()].map(stateOf) });
  const world = worldOf(mapId);
  if (world) { world.emptySince = 0; send(conn, { t: 'mobs', map: mapId, list: world.fullList() }); }
  r.set(conn.id, conn);
  broadcast(mapId, { t: 'join', p: stateOf(conn) }, conn.id);
}

// ---- Quái do server quản lý (server/realtime/mobs.js)
function worldOf(mapId) {
  let w = worlds.get(mapId);
  if (!w) {
    w = new World(mapId, {
      emit: (obj) => broadcast(mapId, obj),
      // Người kết liễu và người góp từ 10% máu trở lên đều được phiếu nhận thưởng (đổi ở hành động kills)
      kill: (mob, killerId, contrib, share, kid) => {
        const assist = [];
        const rewarded = new Set();
        const x = Math.round(mob.x), y = Math.round(mob.def.fly ? mob.homeY : mob.y);
        for (const [cid, dmg] of contrib) {
          const c = byId.get(cid);
          // Phiếu chỉ cấp cho người còn ở trong map lúc quái chết (người đã rời / vừa về làng sẽ không nhận được gói mdie để đổi thưởng)
          if (!c || c.map !== mapId || (cid !== killerId && dmg < mob.maxHp * share)) continue;
          const src = mob.contribSrc && mob.contribSrc.get(cid);
          // Người tự hạ được cộng thêm kinh nghiệm theo số đồng đội có mặt
          claims.add(c.userId, kid, { monster: mob.id, x, y, source: src === 'pet' || src === 'shadow' ? src : 'player', bonus: party.bonusFor(c.userId, mapId, mob.x) });
          rewarded.add(c.userId);
          if (cid !== killerId) assist.push(cid);
        }
        // Đồng đội đứng gần nhưng không tự đánh: nhận phần chia (kinh nghiệm + tiến độ nhiệm vụ)
        for (const u of [...rewarded]) {
          for (const m of party.membersNear(u, mapId, mob.x)) {
            if (rewarded.has(m)) continue;
            const c = byUser.get(m);
            if (!c) continue;
            rewarded.add(m);
            claims.add(m, kid, { monster: mob.id, x, y, source: 'player', party: true });
            assist.push(c.id);
          }
        }
        return assist;
      },
    });
    if (!w.map) return null;
    worlds.set(mapId, w);
  }
  return w;
}

function mobTick() {
  const now = Date.now();
  for (const [mapId, w] of worlds) {
    const r = rooms.get(mapId);
    if (!r || !r.size) {
      if (!w.emptySince) w.emptySince = now;
      else if (now - w.emptySince > IDLE_DROP_MS) worlds.delete(mapId);
      continue;
    }
    const players = [];
    for (const c of r.values()) players.push({ id: c.id, x: c.x, y: c.y, dead: c.dead });
    w.step(now, players);
    if (w.stepCount % 2 === 0) {
      const snap = w.snapshot(now);
      if (snap.length) broadcast(mapId, { t: 'msnap', p: snap });
    }
  }
}

function onHit(conn, m) {
  const w = conn.map && worlds.get(conn.map);
  if (!w) return;
  const now = Date.now();
  if (conn.dead && now - conn.deadAt > 1500) return;
  if (now - conn.hitAt >= 1000) { conn.hitAt = now; conn.hitN = 0; }
  if (++conn.hitN > MAX_HITS_PER_SEC) return;
  const mob = w.byUid.get(m.u | 0);
  if (!mob || !mob.alive) return;
  if (Math.abs(conn.x - mob.x) > 1100 || Math.abs(conn.y - mob.y) > 700) return;   // quá xa (đã gồm tầm bắn / thú đi theo)
  const dmg = Number(m.d);
  if (!(dmg >= 1)) return;
  const f = (v, max) => (Number.isFinite(v) && v > 0 ? Math.min(v, max) : 0);
  w.applyHit(mob, conn.id, {
    dmg: Math.min(dmg, conn.dmgCap || 5000), crit: m.c === 1,
    src: m.src === 'pet' || m.src === 'shadow' ? m.src : 'player', dir: m.dir === -1 ? -1 : 1,
    slow: f(m.slow, 6), freeze: f(m.freeze, 4), knock: f(m.knock, 400),
  }, now);
}

const num = (v) => (Number.isFinite(v) && Math.abs(v) <= WORLD_BOUND ? Math.round(v) : null);

function onPos(conn, m) {
  const x = num(m.x), y = num(m.y);
  if (x === null || y === null) return;
  const mapId = typeof m.map === 'string' && G.MAPS && G.MAPS[m.map] ? m.map : null;
  if (!mapId) return;
  conn.x = x; conn.y = y;
  conn.f = m.f === -1 ? -1 : 1;
  conn.a = ANIMS.has(m.a) ? m.a : 'idle';
  if (Number.isFinite(m.h)) conn.hpPct = Math.max(0, Math.min(100, Math.round(m.h)));   // chỉ để hiển thị trong đội
  // Đang nằm chết: quái không nhắm vào nữa, và không nhận thêm đòn đánh quá 1,5 giây sau khi chết
  if (conn.a === 'dead') { if (!conn.dead) { conn.dead = true; conn.deadAt = Date.now(); trade.onDead(conn); } } else conn.dead = false;
  if (conn.map && conn.map !== mapId) trade.onMapChange(conn);
  if (conn.map !== mapId || m.r === 1) { enterRoom(conn, mapId); return; }
  conn.dirty = true;
}

// Làm sạch tin chat: bỏ ký tự điều khiển, gộp khoảng trắng, chặn link, rút chuỗi lặp
function cleanChat(raw) {
  let s = String(raw || '').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  if (/(https?:|www\.|\b[\w-]+\.(com|net|org|vn|xyz|me|io|gg|tk|ml)\b)/i.test(s)) return null;
  s = s.replace(/(.)\1{5,}/gu, '$1$1$1$1$1');
  return Array.from(s).slice(0, CHAT_MAX_LEN).join('');
}

function onChat(conn, m) {
  const ch = m.ch === 'world' ? 'world' : m.ch === 'party' ? 'party' : 'map';
  const now = Date.now();
  const wait = CHAT_GAP_MS[ch] - (now - (conn.lastChat[ch] || 0));
  if (wait > 0) { send(conn, { t: 'sys', text: `Nói chậm thôi, đợi ${Math.ceil(wait / 1000)} giây nữa.` }); return; }
  const text = cleanChat(m.text);
  if (!text) { send(conn, { t: 'sys', text: 'Tin nhắn không hợp lệ (trống hoặc có đường link).' }); return; }
  if (!conn.map) { send(conn, { t: 'sys', text: 'Chưa vào bản đồ.' }); return; }
  if (ch === 'party') {
    if (!party.chat(conn, text)) { send(conn, { t: 'sys', text: 'Bạn chưa ở trong đội nào.' }); return; }
    conn.lastChat[ch] = now;
    return;
  }
  conn.lastChat[ch] = now;
  const msg = { t: 'chat', ch, id: conn.id, name: conn.name, text };
  if (ch === 'map') broadcast(conn.map, msg);
  else { const text2 = JSON.stringify(msg); for (const c of byUser.values()) sendRaw(c, text2); }
}

function onWho(conn) {
  const r = conn.map && rooms.get(conn.map);
  const list = r ? [...r.values()].map((c) => ({ name: c.name, lv: c.level, sc: c.school })) : [];
  send(conn, { t: 'who', map: conn.map, list, online: byUser.size });
}

function onMessage(conn, data) {
  const now = Date.now();
  if (now - conn.rateAt >= 1000) { conn.rateAt = now; conn.rateN = 0; }
  if (++conn.rateN > MAX_MSGS_PER_SEC) return;
  let m;
  try { m = JSON.parse(data.toString('utf8')); } catch { return; }
  if (!m || typeof m !== 'object') return;
  if (m.t === 'pos') onPos(conn, m);
  else if (m.t === 'chat') onChat(conn, m);
  else if (m.t === 'who') onWho(conn);
  else if (m.t === 'hit') onHit(conn, m);
  else if (m.t === 'party_inv') party.invite(conn, m.to);
  else if (m.t === 'party_resp') party.respond(conn, m.ok === true);
  else if (m.t === 'party_leave') party.leave(conn);
  else if (m.t === 'party_kick') party.kick(conn, m.id);
  else if (m.t === 'party_lead') party.promote(conn, m.id);
  else if (m.t === 'trade_inv') trade.invite(conn, m.to);
  else if (m.t === 'trade_resp') trade.respond(conn, m.ok === true);
  else if (m.t === 'trade_set') trade.set(conn, m).catch((e) => console.error('Giao dịch lỗi:', e.message));
  else if (m.t === 'trade_lock') trade.lock(conn, m.on !== false).catch((e) => console.error('Giao dịch lỗi:', e.message));
  else if (m.t === 'trade_cancel') trade.cancel(conn);
}

function tick() {
  for (const [mapId, r] of rooms) {
    let list = null;
    for (const c of r.values()) {
      if (!c.dirty) continue;
      c.dirty = false;
      (list = list || []).push([c.id, c.x, c.y, c.f, c.a]);
    }
    if (list) broadcast(mapId, { t: 'snap', p: list });
  }
}

async function maintain() {
  for (const conn of [...byUser.values()]) {
    if (conn.ws.readyState !== 1) continue;
    const now = Date.now();
    if (now - conn.checkedAt >= SESSION_CHECK_MS) {
      conn.checkedAt = now;
      const s = await auth.getSession(conn.token);
      if (!s) { conn.ws.close(4003, 'session'); continue; }
    }
    if (now - conn.lookAt >= LOOK_REFRESH_MS) {
      conn.lookAt = now;
      if (await refreshLook(conn) && conn.map) broadcast(conn.map, { t: 'look', p: lookOf(conn) });
    }
  }
}

function reject(socket, code, text) {
  socket.write(`HTTP/1.1 ${code} ${text}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  socket.destroy();
}

function attach(server) {
  wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MSG_BYTES, perMessageDeflate: false });

  server.on('upgrade', async (req, socket, head) => {
    try {
      if ((req.url || '').split('?')[0] !== PATH) return reject(socket, 404, 'Not Found');
      const origin = req.headers.origin;
      if (origin) {
        let host = '';
        try { host = new URL(origin).host; } catch { /* sai định dạng */ }
        if (host !== req.headers.host) return reject(socket, 403, 'Forbidden');
      }
      const token = cookies(req).ap_session;
      const session = await auth.getSession(token);
      if (!session) return reject(socket, 401, 'Unauthorized');
      wss.handleUpgrade(req, socket, head, (ws) => connect(ws, token, session));
    } catch (e) {
      console.error('WebSocket lỗi:', e.message);
      reject(socket, 500, 'Error');
    }
  });

  const ctx = { byId, byUser, send };
  party.init(ctx);
  trade.init(ctx);
  // Bản vá nhân vật do server đổi (giao dịch, chợ...) gửi thẳng cho client đang online
  xplayer.setPusher((userId, out) => {
    const c = byUser.get(userId);
    if (c) send(c, { t: 'patch', patch: out.patch, base: out.base, rev: out.rev, ev: out.events });
  });
  const social = setInterval(() => { try { party.tick(); trade.tick(); } catch (e) { console.error('Đội / giao dịch lỗi:', e.message); } }, 1000);
  social.unref();
  tickTimer = setInterval(tick, TICK_MS);
  tickTimer.unref();
  mobTimer = setInterval(() => { try { mobTick(); } catch (e) { console.error('Quái lỗi:', e.message); } }, STEP_MS);
  mobTimer.unref();
  const m = setInterval(() => maintain().catch((e) => console.error('Realtime lỗi:', e.message)), 2000);
  m.unref();
  const ping = setInterval(() => {
    for (const c of byUser.values()) {
      if (!c.alive) { c.ws.terminate(); continue; }
      c.alive = false;
      try { c.ws.ping(); } catch { /* bỏ qua */ }
    }
  }, PING_MS);
  ping.unref();
}

async function connect(ws, token, session) {
  const now = Date.now();
  const conn = {
    id: nextId++, ws, token, userId: session.userId,
    name: '?', school: null, level: 1, weapon: null,
    map: null, x: 0, y: 0, f: 1, a: 'idle', dirty: false, hpPct: 100,
    dmgCap: 5000, hitAt: now, hitN: 0, dead: false, deadAt: 0,
    alive: true, rateAt: now, rateN: 0, lastChat: {}, checkedAt: now, lookAt: now,
  };
  const old = byUser.get(conn.userId);
  if (old) { old.ws.close(4001, 'duplicate'); leaveRoom(old); }
  byUser.set(conn.userId, conn);
  byId.set(conn.id, conn);
  claims.setOnline(conn.userId, true);

  ws.on('pong', () => { conn.alive = true; });
  const close = () => {
    trade.onClose(conn);
    leaveRoom(conn);
    byId.delete(conn.id);
    if (byUser.get(conn.userId) === conn) { byUser.delete(conn.userId); claims.setOnline(conn.userId, false); party.onClose(conn); }
  };
  ws.on('close', close);
  ws.on('error', () => { /* 'close' sẽ dọn */ });

  // Đọc nhân vật xong mới nhận gói, để tên/class đã đúng khi vào phòng
  try { await refreshLook(conn); } catch (e) { console.error('Realtime đọc nhân vật lỗi:', e.message); }
  ws.on('message', (data) => { conn.alive = true; try { onMessage(conn, data); } catch (e) { console.error('Realtime gói lỗi:', e.message); } });
  send(conn, { t: 'hello', id: conn.id });
  party.onConnect(conn);
}

function close() {
  if (tickTimer) clearInterval(tickTimer);
  if (mobTimer) clearInterval(mobTimer);
  if (wss) for (const c of wss.clients) c.close(1001, 'shutdown');
}

module.exports = { attach, close };
