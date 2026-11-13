/*
 * Kỹ năng · Thần Xạ: xạ kích xuyên giáp, lùi bắn, mắt ưng, mưa tên diện rộng.
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
    xa25: { school: 'cung_thu', evolutionKey: 'than_xa', icon: '🎯', name: 'Ấn Tâm Tiễn', level: 25, mp: 44, cd: 4.5,
      type: 'projectile', power: 0.84, pierce: true, range: 620, count: 2, desc: 'Bắn hai mũi tên xuyên giáp theo đường thẳng.',
      m5: { count: 3 }, t5: 'Bắn 3 mũi tên.', m10: { slow: 1.5, range: 760 }, t10: 'Làm chậm mục tiêu 1,5 giây, bay xa hơn (760).' },
    xa30: { school: 'cung_thu', evolutionKey: 'than_xa', icon: '🏹', name: 'Bước Lùi Liên Xạ', level: 25, mp: 52, cd: 9,
      type: 'backstep', power: 0.42, distance: 160, count: 4, desc: 'Lùi khỏi quái gần nhất và bắn loạt tên.',
      m5: { cd: 7 }, t5: 'Hồi chiêu còn 7 giây.', m10: { count: 6 }, t10: 'Bắn 6 mũi tên khi lùi.' },
    xa35: { school: 'cung_thu', evolutionKey: 'than_xa', icon: '🦅', name: 'Thần Nhãn', level: 30, mp: 64, cd: 20,
      type: 'buff', buff: 'eagle', duration: 8, atkBuff: 0.23, critBuff: 23, speedBuff: 0.26, desc: 'Mắt ưng khóa mục tiêu: tăng tấn công, chí mạng và tốc bắn.',
      m5: { duration: 11 }, t5: 'Kéo dài 11 giây.', m10: { atkBuff: 0.3, critBuff: 30 }, t10: 'Tấn công +30%, chí mạng +30%.' },
    xa40: { school: 'cung_thu', evolutionKey: 'than_xa', icon: '🌧️', name: 'Thiên Võng Xạ Kích', level: 35, mp: 96, cd: 18,
      type: 'arrow_rain', power: 0.65, arrows: 18, width: 420, desc: 'Trút mưa tên xuống một vùng chiến trường phía trước.',
      m5: { arrows: 24 }, t5: 'Mưa 24 mũi tên.', m10: { width: 540, slow: 2 }, t10: 'Vùng rộng hơn (540), quái trúng tên bị chậm 2 giây.' },
    xa27: { school: 'cung_thu', evolutionKey: 'than_xa', icon: '⚡', name: 'Tiễn Thần Tốc', level: 27, mp: 56, cd: 3.5,
      type: 'projectile', power: 1.6, pierce: true, range: 700, count: 2, desc: 'Hai mũi tên cực nhanh xuyên qua hàng quái.',
      m5: { count: 3 }, t5: 'Số lượng tăng lên 3.',
      m10: { slow: 1 }, t10: 'Làm chậm 1 giây.' },
    xa32: { school: 'cung_thu', evolutionKey: 'than_xa', icon: '🪓', name: 'Tên Phá Giáp', level: 32, mp: 70, cd: 8,
      type: 'projectile', power: 2.2, pierce: true, range: 680, count: 1, shred: 0.25, desc: 'Mũi tên xuyên giáp: quái trúng đòn chịu thêm sát thương trong thời gian ngắn.',
      m5: { range: 820 }, t5: 'Tầm xa hơn (820).',
      m10: { shred: 0.4 }, t10: 'Quái chịu thêm 40% sát thương trong 6 giây.' },
    xa37: { school: 'cung_thu', evolutionKey: 'than_xa', icon: '🏹', name: 'Liên Châu Ngũ Tiễn', level: 37, mp: 88, cd: 9,
      type: 'spread', power: 0.8, count: 5, range: 520, desc: 'Năm mũi tên tỏa quạt.',
      m5: { count: 7 }, t5: 'Số lượng tăng lên 7.',
      m10: { power: 1, slow: 1.5 }, t10: 'Sức mạnh 100%. Làm chậm 1.5 giây.' },
    xa38: { school: 'cung_thu', evolutionKey: 'than_xa', icon: '🪤', name: 'Bẫy Linh Quang', level: 38, mp: 78, cd: 12,
      type: 'aoe', power: 2.2, radius: 220, slow: 3, desc: 'Bẫy sáng nổ quanh người, làm chậm quái.',
      m5: { radius: 280 }, t5: 'Vùng rộng hơn (280).',
      m10: { power: 2.8, freeze: 1 }, t10: 'Sức mạnh 280%. Đóng băng 1 giây.' },
    xa42: { school: 'cung_thu', evolutionKey: 'than_xa', icon: '🌟', name: 'Tinh Tú Truy Hồn', level: 42, mp: 110, cd: 13,
      type: 'projectile', power: 0.8, pierce: true, range: 700, count: 5, desc: 'Loạt mũi tên sao xuyên qua mọi quái.',
      m5: { count: 6 }, t5: 'Số lượng tăng lên 6.',
      m10: { count: 8 }, t10: 'Số lượng tăng lên 8.' },
    xa45: { school: 'cung_thu', evolutionKey: 'than_xa', icon: '☄️', name: 'Thiên Hỏa Thần Tiễn', level: 45, mp: 140, cd: 22,
      type: 'arrow_rain', power: 0.6, arrows: 24, width: 520, desc: 'Mưa tên lửa phủ một vùng rộng.',
      m5: { arrows: 30 }, t5: '30 mũi tên.',
      m10: { width: 640, slow: 2 }, t10: 'Vùng rộng hơn (640). Làm chậm 2 giây.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
