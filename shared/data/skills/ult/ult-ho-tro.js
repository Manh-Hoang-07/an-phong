/*
 * Kỹ năng · Hỗ trợ / triệu hồi.
 *
 * Mỗi kỹ năng có cấp 1–10, nâng bằng điểm kỹ năng:
 *   m5 / m10: chỉ số đổi ở cấp 5 / 10; t5 / t10: mô tả hiện trong bảng kỹ năng.
 *   type: dash | melee | projectile | spread | aoe | heal | buff | guard | backstep | manashield | shadow_toggle | shadow_command
 *   ultSchools: các class học được; ultAny: mọi class đều học được.
 *
 * Tuyệt kỹ: mạnh hơn kỹ năng thường, học bằng sách riêng (sach_tk_<id>), không bán ở cửa hàng. */
(function (G) {
  'use strict';

  const PART = {
    ulTri1: { school: 'tri_lieu_su', ultSchools: ['tri_lieu_su'], icon: '😇', name: 'Thánh Quang Hồi Sinh', level: 30, mp: 240, cd: 55, ult: true,
      type: 'heal', heal: 0.85, mpHeal: 0.4, desc: 'Ánh thánh quang hồi phục phần lớn sinh lực và năng lượng.',
      m5: { mpHeal: 0.6 }, t5: 'Hồi năng lượng nhiều hơn.',
      m10: { cd: 40 }, t10: 'Hồi chiêu ngắn hơn.' },
    ulLinh1: { school: 'trieu_hoi_su', ultSchools: ['trieu_hoi_su', 'tu_linh_thuat_su'], icon: '👻', name: 'Vạn Linh Bùng Nổ', level: 30, mp: 220, cd: 42, ult: true,
      type: 'meteor', power: 3.31, radius: 220, count: 2, desc: 'Giải phóng linh khí nổ tung thành hai đợt thiên thạch.',
      m5: { radius: 270 }, t5: 'Vùng nổ rộng hơn.',
      m10: { count: 3, power: 2.53 }, t10: 'Ba đợt nổ liên tiếp.' },
    ulLinh2: { school: 'tu_linh_thuat_su', ultSchools: ['tu_linh_thuat_su', 'trieu_hoi_su'], icon: '💀', name: 'U Minh Cuồng Triều', level: 35, mp: 200, cd: 48, ult: true,
      type: 'buff', buff: 'awaken', duration: 12, atkBuff: 0.41, critBuff: 11, speedBuff: 0.26, desc: 'Triệu gọi triều âm khí, tăng mạnh tấn công và tốc đánh.',
      m5: { duration: 15 }, t5: 'Kéo dài 15 giây.',
      m10: { atkBuff: 0.6 }, t10: 'Tấn công +60%.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
