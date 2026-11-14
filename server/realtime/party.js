'use strict';
/*
 * Đội nhóm (xem docs/KE_HOACH_DA_NGUOI_CHOI.md mục 12.3). Toàn bộ trạng thái nằm trong bộ nhớ tiến trình.
 * Thành viên được định danh theo userId (giữ được khi mất kết nối / đổi map); gói gửi cho client dùng connId.
 */
const MAX_MEMBERS = 5;
const INVITE_MS = 30000;
const OFFLINE_MS = 90000;
const SHARE_RANGE = 1200;     // đồng đội trong tầm này quanh quái mới được chia kinh nghiệm
const BONUS_PER_MEMBER = 0.1;
const BONUS_MAX = 0.4;

let ctx = null;               // { byId, byUser, send } do realtime/index.js cấp
const parties = new Map();    // partyId → { id, leader: userId, members: [userId], last: Map(userId → thông tin cuối), sig }
const partyOf = new Map();    // userId → partyId
const invites = new Map();    // userId được mời → { from: userId, at }
const offlineAt = new Map();  // userId → mốc mất kết nối
const lastInvite = new Map(); // `${from}>${to}` → mốc (chống spam lời mời)
let nextId = 1;

const init = (c) => { ctx = c; };
const connOf = (userId) => ctx.byUser.get(userId);
const partyById = (conn) => parties.get(partyOf.get(conn.userId));

function info(party, userId) {
  const c = connOf(userId);
  if (c) {
    const i = { id: c.id, name: c.name, lv: c.level, sc: c.school, hp: c.hpPct, map: c.map, on: 1, dead: c.dead ? 1 : 0 };
    party.last.set(userId, { name: i.name, lv: i.lv, sc: i.sc });
    return i;
  }
  const l = party.last.get(userId) || {};
  return { id: 0, name: l.name || '?', lv: l.lv || 0, sc: l.sc || null, hp: 0, map: null, on: 0, dead: 0 };
}

function stateMsg(party) {
  const leaderConn = connOf(party.leader);
  return { t: 'party', id: party.id, leader: leaderConn ? leaderConn.id : 0, members: party.members.map((u) => info(party, u)) };
}

function sendState(party, force = false) {
  const msg = stateMsg(party);
  const sig = JSON.stringify(msg);
  if (!force && sig === party.sig) return;
  party.sig = sig;
  for (const u of party.members) { const c = connOf(u); if (c) ctx.send(c, msg); }
}

function sys(conn, text) { ctx.send(conn, { t: 'sys', text }); }

function createParty(leaderUser) {
  const party = { id: nextId++, leader: leaderUser, members: [leaderUser], last: new Map(), sig: '' };
  parties.set(party.id, party);
  partyOf.set(leaderUser, party.id);
  return party;
}

function removeMember(party, userId, why) {
  const i = party.members.indexOf(userId);
  if (i < 0) return;
  party.members.splice(i, 1);
  partyOf.delete(userId);
  offlineAt.delete(userId);
  const c = connOf(userId);
  if (c) { ctx.send(c, { t: 'party', id: 0 }); if (why) sys(c, why); }
  if (party.members.length <= 1) {
    // Chỉ còn một người: giải tán
    for (const u of party.members) {
      partyOf.delete(u);
      const lc = connOf(u);
      if (lc) { ctx.send(lc, { t: 'party', id: 0 }); sys(lc, 'Đội đã giải tán.'); }
    }
    parties.delete(party.id);
    return;
  }
  if (party.leader === userId) party.leader = party.members[0];
  sendState(party, true);
}

// ---- Lời mời
function invite(conn, targetId) {
  const t = ctx.byId.get(Number(targetId));
  if (!t || t === conn) return sys(conn, 'Không tìm thấy người chơi.');
  if (t.map !== conn.map || !conn.map) return sys(conn, 'Người đó không ở cùng bản đồ.');
  if (conn.dead || t.dead) return sys(conn, 'Không mời được lúc này.');
  const mine = partyById(conn);
  if (mine && mine.leader !== conn.userId) return sys(conn, 'Chỉ trưởng đội mới mời được.');
  if (mine && mine.members.length >= MAX_MEMBERS) return sys(conn, `Đội đã đủ ${MAX_MEMBERS} người.`);
  if (partyOf.has(t.userId)) return sys(conn, `${t.name} đã ở trong một đội.`);
  const key = `${conn.userId}>${t.userId}`;
  const now = Date.now();
  if (now - (lastInvite.get(key) || 0) < 5000) return sys(conn, 'Đừng mời liên tục, đợi vài giây.');
  lastInvite.set(key, now);
  invites.set(t.userId, { from: conn.userId, at: now });
  ctx.send(t, { t: 'party_inv', from: { id: conn.id, name: conn.name, lv: conn.level }, ms: INVITE_MS });
  sys(conn, `Đã mời ${t.name} vào đội.`);
}

function respond(conn, ok) {
  const inv = invites.get(conn.userId);
  invites.delete(conn.userId);
  if (!inv || Date.now() - inv.at > INVITE_MS) return sys(conn, 'Lời mời đã hết hạn.');
  const from = connOf(inv.from);
  if (!ok) { if (from) sys(from, `${conn.name} từ chối lời mời vào đội.`); return; }
  if (partyOf.has(conn.userId)) return sys(conn, 'Bạn đang ở trong một đội.');
  if (!from) return sys(conn, 'Người mời đã thoát.');
  let party = parties.get(partyOf.get(inv.from));
  if (party && party.leader !== inv.from) return sys(conn, 'Người mời không còn là trưởng đội.');
  if (party && party.members.length >= MAX_MEMBERS) return sys(conn, 'Đội đã đầy.');
  if (!party) party = createParty(inv.from);
  party.members.push(conn.userId);
  partyOf.set(conn.userId, party.id);
  for (const u of party.members) { const c = connOf(u); if (c && c !== conn) sys(c, `${conn.name} đã vào đội.`); }
  sendState(party, true);
}

function leave(conn) {
  const party = partyById(conn);
  if (party) removeMember(party, conn.userId, 'Bạn đã rời đội.');
}

function kick(conn, targetId) {
  const party = partyById(conn);
  if (!party || party.leader !== conn.userId) return sys(conn, 'Chỉ trưởng đội mới đuổi được.');
  const t = ctx.byId.get(Number(targetId));
  if (!t || t === conn || !party.members.includes(t.userId)) return;
  removeMember(party, t.userId, 'Bạn đã bị đuổi khỏi đội.');
}

function promote(conn, targetId) {
  const party = partyById(conn);
  if (!party || party.leader !== conn.userId) return;
  const t = ctx.byId.get(Number(targetId));
  if (!t || !party.members.includes(t.userId)) return;
  party.leader = t.userId;
  sendState(party, true);
}

// ---- Kết nối
function onConnect(conn) {
  if (!partyOf.has(conn.userId)) return;
  offlineAt.delete(conn.userId);
  sendState(parties.get(partyOf.get(conn.userId)), true);
}
function onClose(conn) {
  invites.delete(conn.userId);
  const party = partyById(conn);
  if (!party) return;
  offlineAt.set(conn.userId, Date.now());
  sendState(party, true);
}

// Kênh chat đội: gửi cho mọi thành viên đang online (kể cả ở map khác)
function chat(conn, text) {
  const party = partyById(conn);
  if (!party) return false;
  const msg = { t: 'chat', ch: 'party', id: conn.id, name: conn.name, text };
  for (const u of party.members) { const c = connOf(u); if (c) ctx.send(c, msg); }
  return true;
}

// ---- Chia thưởng khi hạ quái
const present = (userId, mapId, x) => {
  const c = connOf(userId);
  return !!c && c.map === mapId && !c.dead && Math.abs(c.x - x) <= SHARE_RANGE;
};

// Đồng đội (cùng đội với userId) đang ở gần chỗ quái chết, gồm cả chính userId nếu ở gần
function membersNear(userId, mapId, x) {
  const party = parties.get(partyOf.get(userId));
  return party ? party.members.filter((u) => present(u, mapId, x)) : [];
}

// Thưởng thêm cho người tự hạ: +10% kinh nghiệm cho mỗi thành viên (từ người thứ 2) có mặt, tối đa +40%
function bonusFor(userId, mapId, x) {
  const n = membersNear(userId, mapId, x).length;
  return 1 + Math.min(BONUS_MAX, BONUS_PER_MEMBER * Math.max(0, n - 1));
}

// ---- Dọn dẹp định kỳ (mỗi giây)
function tick() {
  const now = Date.now();
  for (const [u, inv] of invites) if (now - inv.at > INVITE_MS) invites.delete(u);
  for (const [k, t] of lastInvite) if (now - t > 60000) lastInvite.delete(k);
  for (const [u, at] of offlineAt) {
    if (now - at <= OFFLINE_MS) continue;
    const party = parties.get(partyOf.get(u));
    if (party) removeMember(party, u, null);
    offlineAt.delete(u);
  }
  for (const party of parties.values()) sendState(party);   // chỉ gửi khi có thay đổi (máu, map, cấp...)
}

module.exports = { init, invite, respond, leave, kick, promote, onConnect, onClose, chat, membersNear, bonusFor, tick, partyOfUser: (u) => partyOf.get(u) };
