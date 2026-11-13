/*
 * Kỹ năng · Ảnh Vương: lướt đoạt mệnh, phi đao, thế thân, bách ảnh.
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
    av25: { school: 'sat_thu', evolutionKey: 'anh_vuong', icon: '🌑', name: 'Ảnh Bộ Đoạt Mệnh', level: 25, mp: 48, cd: 6,
      type: 'dash', power: 1.26, after: 0.74, distance: 220, desc: 'Lướt xuyên mục tiêu và chém thêm một nhát ở điểm kết thúc.',
      m5: { distance: 280 }, t5: 'Lướt xa hơn (280).', m10: { after: 1.26 }, t10: 'Vệt chém mạnh lên 126%.' },
    av30: { school: 'sat_thu', evolutionKey: 'anh_vuong', icon: '🔪', name: 'Phi Đao U Ảnh', level: 25, mp: 56, cd: 5,
      type: 'projectile', power: 0.63, range: 420, count: 2, slow: 1, desc: 'Phóng hai phi đao bóng tối tầm trung, làm chậm.',
      m5: { count: 3 }, t5: 'Phóng 3 phi đao.', m10: { count: 4 }, t10: 'Phóng 4 phi đao.' },
    av35: { school: 'sat_thu', evolutionKey: 'anh_vuong', icon: '👤', name: 'Thế Thân Bóng Tối', level: 30, mp: 64, cd: 16,
      type: 'guard', duration: 5, reduce: 0.6, atkBuff: 0.23, critBuff: 15, speedBuff: 0.3, desc: 'Để lại bóng thế thân chịu đòn: giảm sát thương, tăng tấn công, chí mạng và tốc đánh.',
      m5: { duration: 6.5 }, t5: 'Kéo dài 6,5 giây.', m10: { reduce: 0.6, critBuff: 23 }, t10: 'Giảm 60% sát thương, chí mạng +23%.' },
    av40: { school: 'sat_thu', evolutionKey: 'anh_vuong', icon: '🗡️', name: 'Bách Ảnh Sát', level: 35, mp: 92, cd: 16,
      type: 'melee', power: 0.26, hits: 7, range: 170, finisher: 0.57, desc: 'Dồn loạt đòn liên tiếp lên mục tiêu trước mặt, kết thúc bằng nhát chí mạng.',
      m5: { hits: 8 }, t5: 'Chém 8 nhát.', m10: { finisher: 0.72 }, t10: 'Nhát cuối 72%.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
