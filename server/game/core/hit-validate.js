'use strict';
/*
 * Ngân sách đòn thường trên TỪNG QUÁI — chặn spam một quái bằng nhiều nhát.
 *
 * Trần sát thương một đòn không còn ở đây: nó nằm ở damage-profile.js (theo class + kỹ năng đang gắn).
 *
 * Vũ khí nhanh nhất 3,7 đòn/giây, cộng thú/bóng ma (mỗi bên gom 0,5 giây) → tối đa ~7,7 gói/giây
 * trên cùng một quái. 10 là mức chừa dư cho lag. Đếm riêng từng uid nên đánh lan vẫn bình thường.
 */
const BASIC_HITS_PER_MOB_PER_SEC = 10;
const MAX_TRACKED_MOBS = 64;   // chặn client gửi uid ngẫu nhiên để làm phình Map

/*
 * `state` là Map<uid, {n, at}> của người chơi. Trả false → bỏ đòn.
 * Tự dọn entry cũ để Map không phình.
 */
function basicMobBudget(state, uid, now) {
  const key = uid | 0;
  let e = state.get(key);
  if (!e || now - e.at >= 1000) {
    if (state.size >= MAX_TRACKED_MOBS) {
      for (const [k, v] of state) if (now - v.at >= 1000) state.delete(k);
      if (state.size >= MAX_TRACKED_MOBS) state.delete(state.keys().next().value);
    }
    e = { n: 0, at: now };
    state.set(key, e);
  }
  if (e.n >= BASIC_HITS_PER_MOB_PER_SEC) return false;
  e.n++;
  return true;
}

module.exports = { BASIC_HITS_PER_MOB_PER_SEC, MAX_TRACKED_MOBS, basicMobBudget };
