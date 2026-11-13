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
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
