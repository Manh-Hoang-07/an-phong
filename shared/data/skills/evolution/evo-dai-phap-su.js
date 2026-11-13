/*
 * Kỹ năng · Đại Pháp Sư: tia sét xuyên, tường lửa, hộ thể tinh thạch, bão nguyên tố.
 *
 * Mỗi kỹ năng có cấp 1–10, nâng bằng điểm kỹ năng:
 *   m5 / m10: chỉ số đổi ở cấp 5 / 10; t5 / t10: mô tả hiện trong bảng kỹ năng.
 *   type: dash | melee | projectile | spread | aoe | heal | buff | guard | backstep | manashield | shadow_toggle | shadow_command
 *   ultSchools: các class học được; ultAny: mọi class đều học được.
 *
 * Chức nghiệp 2 (nhánh tiến hóa). KHÔNG nhân chỉ số: sức mạnh nằm ở bộ 4 kỹ năng riêng,
 * khóa bộ chức nghiệp 1 khi bật nhánh. Khung mỗi nhánh: [đòn liên tục] [bản sắc] [cơ động / buff]
 * [đòn tuyệt đỉnh], mở ở cấp 25 / 25 / 30 / 35. */
(function (G) {
  'use strict';

  const PART = {
    ps25: { school: 'phap_su', evolutionKey: 'dai_phap_su', icon: '⚡', name: 'Lôi Xà', level: 25, mp: 52, cd: 5,
      type: 'projectile', power: 0.84, pierce: true, range: 430, count: 2, slow: 1, desc: 'Phóng tia sét xuyên qua nhiều mục tiêu, làm chậm.',
      m5: { count: 3 }, t5: 'Phóng 3 tia sét.', m10: { freeze: 1 }, t10: 'Đóng băng quái 1 giây.' },
    ps30: { school: 'phap_su', evolutionKey: 'dai_phap_su', icon: '🔥', name: 'Hỏa Tường', level: 25, mp: 64, cd: 10,
      type: 'aoe', power: 1.98, radius: 220, slow: 2, desc: 'Dựng dải lửa ma thuật quanh người, làm chậm quái.',
      m5: { radius: 270 }, t5: 'Vùng rộng hơn (270).', m10: { power: 2.53 }, t10: 'Sát thương tăng lên 253%.' },
    ps35: { school: 'phap_su', evolutionKey: 'dai_phap_su', icon: '💎', name: 'Tinh Thạch Hộ Thể', level: 30, mp: 72, cd: 20,
      type: 'manashield', duration: 10, absorb: 0.6, desc: 'Tạo lớp khiên tinh thạch, dùng năng lượng đỡ phần lớn sát thương.',
      m5: { duration: 14 }, t5: 'Kéo dài 14 giây.', m10: { absorb: 0.6 }, t10: 'Đỡ toàn bộ sát thương bằng năng lượng.' },
    ps40: { school: 'phap_su', evolutionKey: 'dai_phap_su', icon: '🌌', name: 'Bão Nguyên Tố', level: 35, mp: 104, cd: 18,
      type: 'meteor', power: 0.8, count: 3, radius: 250, desc: 'Gọi ba đợt nguyên tố giáng xuống vùng mục tiêu.',
      m5: { radius: 300 }, t5: 'Vùng nổ rộng hơn (300).', m10: { power: 0.92, radius: 330 }, t10: 'Sát thương 92%, vùng nổ 330.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
