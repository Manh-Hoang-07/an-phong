'use strict';
/*
 * Phiếu nhận thưởng hạ quái. Quái do server quản lý nên người chơi chỉ được nhận thưởng (kinh nghiệm, vàng, đồ rơi,
 * tiến độ nhiệm vụ) khi server đã ghi nhận họ hạ / góp sức hạ con quái đó. Hành động `kills` (server/game/actions/combat.js)
 * đổi phiếu này lấy thưởng, mỗi phiếu dùng được một lần.
 *
 * Người chơi không có kết nối realtime (mạng chưa tới WebSocket, đang chơi chế độ riêng lẻ) thì vẫn nhận thưởng
 * theo cách cũ: tin client như trước giờ.
 */
const TTL_MS = 3 * 60 * 1000;
const MAX_PER_USER = 300;

const byUser = new Map();   // userId → Map(kid → { monster, x, y, source, at })
const online = new Set();

function add(userId, kid, claim) {
  let m = byUser.get(userId);
  if (!m) { m = new Map(); byUser.set(userId, m); }
  const now = Date.now();
  if (m.size >= MAX_PER_USER) for (const [k, v] of m) { if (now - v.at > TTL_MS || m.size >= MAX_PER_USER) m.delete(k); else break; }
  m.set(kid, { ...claim, at: now });
}

function take(userId, kid) {
  const m = byUser.get(userId);
  const c = m && m.get(String(kid));
  if (!c) return null;
  m.delete(String(kid));
  return Date.now() - c.at <= TTL_MS ? c : null;
}

function setOnline(userId, on) {
  if (on) online.add(userId); else { online.delete(userId); byUser.delete(userId); }
}
const isOnline = (userId) => online.has(userId);

module.exports = { add, take, setOnline, isOnline };
