'use strict';
/*
 * BƯỚC TRUNG GIAN chống gian lận sát thương — trước khi chuyển sang server-authoritative.
 *
 * Client vẫn tính damage và gửi `d`. Server KHÔNG thay thế công thức, chỉ tự tính một
 * "trần tham chiếu" từ dữ liệu và chỉ số của CHÍNH NÓ, rồi lấy min với trần cũ.
 * Client sửa được `d`, thậm chí sửa được cả `k` (loại đòn) — nên trần phải gắn với
 * `id` skill thật do server đối chiếu với lần `cast` hợp lệ, không chỉ với cờ `k`.
 *
 * REF_SAFETY = 30 đủ lớn để chứa mọi hiệu ứng server không theo dõi theo thời gian thực:
 *   crit 2.5 × random 1.1 × exec 1.6 × shred 1.4 × vsSlowed 2.5 × atkBuff 1.87 ≈ 36,
 *   nhưng các hiệu ứng đó không thể bật cùng lúc một cách ổn định (xem ghi chú CAP_MUL_*
 *   trong realtime/index.js). 30 là mức chừa dư: thà lọt vài đòn còn hơn chặt oan người thật.
 * Với skill yếu (đánh nhiều nhát) trần mới chặt hơn trần cũ rất nhiều; với skill mạnh
 * thì min() giữ nguyên trần cũ, không có chuyện giảm damage oan.
 *
 * Ngân sách đòn thường đếm RIÊNG từng quái: vũ khí nhanh nhất 3,7 đòn/giây, cộng
 * thú/bóng ma (mỗi bên gom 0,5 giây) → tối đa ~7,7 gói/giây trên cùng một quái.
 * 10 là mức chừa dư cho lag. Đếm riêng từng uid nên đánh lan vẫn bình thường.
 */
const G = require('../../../shared');

const REF_SAFETY = 30;
const BASIC_HITS_PER_MOB_PER_SEC = 10;
const MAX_TRACKED_MOBS = 64;   // chặn client gửi uid ngẫu nhiên để làm phình Map

/*
 * Trần sát thương tham chiếu cho MỘT đòn của skill `id`.
 * Trả null nếu không có đủ dữ liệu (skill lạ / heal / buff) → caller giữ trần cũ.
 */
/*
 * Hệ số nhân tham chiếu THEO TRẠNG THÁI QUÁI mà server thật sự thấy (thay cho REF_SAFETY cào bằng).
 *   nền   = crit 2,5 × ngẫu nhiên 1,1 × trùm 1,8 (4,95) × atkBuff 1,87 × shred 1,4   — server không theo dõi buff nên giữ cả hai
 *   vsSlowed: chỉ khi quái đang chậm/đóng băng (chừa EXEC_GRACE_MS cho độ trễ) — lấy giá trị THẬT của skill
 *   exec    : chỉ khi quái ≤ 50% máu (client dùng 40%, chừa biên vì máu server có thể trễ) — mức lớn nhất 2
 * Luôn kẹp ≤ REF_SAFETY để không bao giờ nới lỏng hơn trần cũ.
 */
const BASE_MUL = 2.5 * 1.1 * 1.8 * 1.87 * 1.4;
const EXEC_HP_RATIO = 0.5;
const EXEC_MAX_MUL = 2;
const SLOW_GRACE_MS = 1500;

function refMultiplier(sk, mob, now) {
  let m = BASE_MUL;
  const vs = Number(sk && sk.vsSlowed) || 0;
  if (vs > 1 && mob && (now < (mob.slowUntil || 0) + SLOW_GRACE_MS || now < (mob.freezeUntil || 0) + SLOW_GRACE_MS)) m *= vs;
  if (mob && mob.maxHp > 0 && mob.hp <= mob.maxHp * EXEC_HP_RATIO) m *= EXEC_MAX_MUL;
  return Math.min(m, REF_SAFETY);
}

function skillCeiling(atk, skillMul, id, level, mob, now) {
  if (!id) return null;
  const lv = Number(level) || 0;
  if (lv <= 0) return null;
  const sk = G.skillAt(String(id).slice(0, 40), lv);
  if (!sk) return null;
  // Nhát kết liễu / đòn sau lướt thay THẾ power chứ không nhân thêm (xem skills.js useSkill).
  const power = Math.max(Number(sk.power) || 0, Number(sk.finisher) || 0, Number(sk.after) || 0);
  if (!(power > 0)) return null;
  const a = Math.max(Number(atk) || 0, 30);
  const mul = Number(skillMul) > 0 ? Number(skillMul) : 1;
  return a * power * mul * refMultiplier(sk, mob, now === undefined ? Date.now() : now);
}

/*
 * Ngân sách đòn thường trên từng quái. `state` là Map<uid, {n, at}> của conn.
 * Trả false → bỏ đòn. Tự dọn entry cũ để Map không phình.
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

module.exports = { refMultiplier, BASE_MUL, REF_SAFETY, BASIC_HITS_PER_MOB_PER_SEC, MAX_TRACKED_MOBS, skillCeiling, basicMobBudget };