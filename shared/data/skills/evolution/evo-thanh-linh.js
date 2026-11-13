/*
 * Kỹ năng · Thánh Linh: quang tiễn, thánh vực, kết giới, bình minh.
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
    tl30: { school: 'tri_lieu_su', evolutionKey: 'thanh_linh', icon: '✨', name: 'Quang Tiễn', level: 25, mp: 52, cd: 4.5,
      type: 'projectile', power: 1.26, pierce: true, range: 440, count: 1, slow: 1, desc: 'Bắn mũi tên thánh xuyên qua kẻ địch, làm chậm.',
      m5: { count: 2 }, t5: 'Bắn 2 mũi tên thánh.', m10: { slow: 2, range: 520 }, t10: 'Làm chậm 2 giây, bay xa hơn (520).' },
    tl25: { school: 'tri_lieu_su', evolutionKey: 'thanh_linh', icon: '🌿', name: 'Thánh Vực', level: 25, mp: 60, cd: 11,
      type: 'heal', heal: 0.5, mpHeal: 0.08, desc: 'Gọi thánh quang hồi phục sinh lực và một phần năng lượng.',
      m5: { heal: 0.6 }, t5: 'Hồi 60% máu.', m10: { heal: 0.7, mpHeal: 0.15 }, t10: 'Hồi 70% máu và 15% năng lượng.' },
    tl35: { school: 'tri_lieu_su', evolutionKey: 'thanh_linh', icon: '🔰', name: 'Kết Giới Thánh Quang', level: 30, mp: 72, cd: 20,
      type: 'manashield', duration: 9, absorb: 0.6, desc: 'Tạo kết giới thánh quang, dùng năng lượng đỡ 60% sát thương.',
      m5: { duration: 12 }, t5: 'Kéo dài 12 giây.', m10: { absorb: 0.6 }, t10: 'Đỡ toàn bộ sát thương bằng năng lượng.' },
    tl40: { school: 'tri_lieu_su', evolutionKey: 'thanh_linh', icon: '🌅', name: 'Bình Minh Tái Sinh', level: 35, mp: 100, cd: 24,
      type: 'aoe', power: 2.47, radius: 260, heal: 0.4, desc: 'Ánh bình minh bùng nổ quanh người, gây sát thương lớn và hồi phục sinh lực.',
      m5: { radius: 320, heal: 0.5 }, t5: 'Vùng rộng hơn (320), hồi 50% máu.', m10: { power: 2.76, heal: 0.6 }, t10: 'Sát thương 276%, hồi 60% máu.' },
    tg27: { school: 'tri_lieu_su', evolutionKey: 'thanh_linh', icon: '☀️', name: 'Thánh Quang Chiếu', level: 27, mp: 58, cd: 4,
      type: 'projectile', power: 1.7, pierce: true, range: 520, count: 1, desc: 'Tia sáng thánh xuyên qua kẻ địch.',
      m5: { count: 2 }, t5: 'Số lượng tăng lên 2.',
      m10: { slow: 2 }, t10: 'Làm chậm 2 giây.' },
    tg32: { school: 'tri_lieu_su', evolutionKey: 'thanh_linh', icon: '🙏', name: 'Phước Lành', level: 32, mp: 80, cd: 24,
      type: 'buff', buff: 'blessing', duration: 12, atkBuff: 0.1, speedBuff: 0.15, regen: 0.05, desc: 'Ban phước: hồi máu liên tục, tăng nhẹ tốc độ.',
      m5: { duration: 15 }, t5: 'Kéo dài 15 giây.',
      m10: { regen: 0.07 }, t10: 'Hồi máu nhanh hơn (7%/s).' },
    tg37: { school: 'tri_lieu_su', evolutionKey: 'thanh_linh', icon: '👼', name: 'Thiên Sứ Hộ Tống', level: 37, mp: 92, cd: 22,
      type: 'guard', duration: 4, reduce: 0.65, desc: 'Thiên sứ chắn đòn, giảm mạnh sát thương.',
      m5: { duration: 5 }, t5: 'Kéo dài 5 giây.',
      m10: { reduce: 0.75 }, t10: 'Giảm 75% sát thương.' },
    tg38: { school: 'tri_lieu_su', evolutionKey: 'thanh_linh', icon: '📜', name: 'Thánh Dụ', level: 38, mp: 110, cd: 30,
      type: 'heal', heal: 0.6, mpHeal: 0.1, desc: 'Lời thánh dụ hồi phục sinh lực lớn.',
      m5: { heal: 0.7 }, t5: 'Hồi 70% máu.',
      m10: { heal: 0.85, mpHeal: 0.2 }, t10: 'Hồi 85% máu. Hồi 20% năng lượng.' },
    tg42: { school: 'tri_lieu_su', evolutionKey: 'thanh_linh', icon: '⚖️', name: 'Ánh Sáng Phán Xét', level: 42, mp: 118, cd: 16,
      type: 'aoe', power: 3.2, radius: 280, desc: 'Ánh sáng nổ quanh người, sát thương cao.',
      m5: { radius: 340 }, t5: 'Vùng rộng hơn (340).',
      m10: { power: 3.9 }, t10: 'Sức mạnh 390%.' },
    tg45: { school: 'tri_lieu_su', evolutionKey: 'thanh_linh', icon: '🌄', name: 'Phục Sinh Ánh Quang', level: 45, mp: 150, cd: 40,
      type: 'heal', heal: 0.8, mpHeal: 0.4, desc: 'Ánh quang hồi gần đầy sinh lực và năng lượng.',
      m5: { heal: 0.85 }, t5: 'Hồi 85% máu.',
      m10: { heal: 0.9, mpHeal: 0.6 }, t10: 'Hồi 90% máu. Hồi 60% năng lượng.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
