'use strict';
/*
 * Bộ đếm chống spam chiến đấu dùng CHUNG cho mọi kết nối của cùng một tài khoản.
 *
 * Trước đây các bộ đếm này nằm trên `conn`: đóng/mở WebSocket là reset sạch hồi chiêu,
 * ngân sách đòn và số lần siêu tuyệt kỹ. Module này chuyển chúng sang key theo userId,
 * nằm hoàn toàn trong bộ nhớ, O(1) mỗi lần tra cứu, không query DB.
 *
 * Mỗi entry tự dọn sau GUARD_TTL_MS kể từ lần cuối được dùng. `prune()` được gọi từ
 * nhịp maintain() hiện có của realtime nên không thêm timer mới.
 */
const GUARD_TTL_MS = 5 * 60 * 1000;

const byUser = new Map();   // userId → state

function state(userId) {
  let s = byUser.get(userId);
  if (!s) {
    s = {
      at: Date.now(),
      hitAt: 0, hitN: 0, skillHitN: 0, superHitN: 0,
      skillCds: {}, castN: {}, castWinAt: {}, recentCasts: [], castDenyUntil: 0,
      skillDmg: 0, skillDmgAt: 0, superUses: 0, superWinAt: 0, superCastAt: 0,
      basicMobHits: new Map(),
    };
    byUser.set(userId, s);
  } else s.at = Date.now();
  return s;
}

// Gọi từ maintain(): chỉ xét một ít entry mỗi nhịp, không quét toàn bộ cùng lúc.
function prune(now = Date.now(), limit = 64) {
  let n = 0;
  for (const [id, s] of byUser) {
    if (n++ >= limit) break;
    if (now - s.at > GUARD_TTL_MS) byUser.delete(id);
  }
}

function drop(userId) { byUser.delete(userId); }

function clear() { byUser.clear(); }

module.exports = { state, prune, drop, clear, byUser, GUARD_TTL_MS };
