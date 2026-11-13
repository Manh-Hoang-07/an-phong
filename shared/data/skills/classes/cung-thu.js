/*
 * Kỹ năng · Cung Thủ.
 *
 * Mỗi kỹ năng có cấp 1–10, nâng bằng điểm kỹ năng:
 *   m5 / m10: chỉ số đổi ở cấp 5 / 10; t5 / t10: mô tả hiện trong bảng kỹ năng.
 *   type: dash | melee | projectile | spread | aoe | heal | buff | guard | backstep | manashield | shadow_toggle | shadow_command
 *   ultSchools: các class học được; ultAny: mọi class đều học được.
 */
(function (G) {
  'use strict';

  const PART = {
    hl1: { school: 'cung_thu', icon: '🔥', name: 'Tiễn Xuyên Phá', level: 5, mp: 20, cd: 2.5,
      type: 'projectile', power: 1.52, pierce: true, range: 460, count: 1, desc: 'Bắn mũi tên lửa xuyên qua mọi quái.',
      m5: { range: 620 }, t5: 'Bay xa hơn (620).',
      m10: { count: 2, power: 1.03 }, t10: 'Bắn 2 mũi tên song song.' },
    hl2: { school: 'cung_thu', icon: '✴️', name: 'Tam Tiễn', level: 8, mp: 36, cd: 5,
      type: 'spread', power: 0.71, count: 3, range: 420, desc: 'Bắn nhiều mũi tên tỏa ra.',
      m5: { count: 5 }, t5: 'Bắn 5 mũi tên.',
      m10: { slow: 2 }, t10: 'Trúng tên làm quái chậm 2 giây.' },
    hl4: { school: 'cung_thu', icon: '🦘', name: 'Lùi Né', level: 12, mp: 30, cd: 6,
      type: 'backstep', power: 1.11, distance: 160, count: 1, desc: 'Nhảy lùi né đòn, vừa lùi vừa bắn.',
      m5: { cd: 4 }, t5: 'Hồi chiêu còn 4 giây.',
      m10: { count: 2 }, t10: 'Bắn 2 mũi tên khi lùi.' },
    hl3: { school: 'cung_thu', icon: '🦅', name: 'Mắt Ưng', level: 15, mp: 60, cd: 20,
      type: 'buff', buff: 'eagle', duration: 8, critBuff: 19, speedBuff: 0.23, desc: 'Tăng chí mạng và tốc bắn.',
      m5: { duration: 10 }, t5: 'Kéo dài 10 giây.',
      m10: { critBuff: 30 }, t10: 'Chí mạng +30%.' },
    hl5: { school: 'cung_thu', icon: '🌧️', name: 'Mưa Tên', level: 20, mp: 170, cd: 40, ult: true,
      type: 'arrow_rain', power: 1.44, arrows: 12, width: 360, desc: 'Trút mưa tên xuống vùng phía trước.',
      m5: { arrows: 18 }, t5: '18 mũi tên.',
      m10: { width: 480, arrows: 24, slow: 2 }, t10: 'Vùng rộng hơn, 24 mũi tên, quái trúng tên bị chậm.' },
    hl6: { school: 'cung_thu', icon: '🎯', name: 'Tam Tiễn Truy Kích', level: 25, mp: 84, cd: 11,
      type: 'projectile', power: 0.51, pierce: true, range: 620, count: 3, slow: 1, desc: 'Bắn ba mũi tên xuyên giáp theo đường thẳng.',
      m5: { range: 760 }, t5: 'Tầm bắn xa hơn.',
      m10: { count: 5, slow: 2 }, t10: 'Bắn năm tên, làm chậm mục tiêu lâu hơn.' },
    hl7: { school: 'cung_thu', icon: '🏹', name: 'Bão Tên Định Mệnh', level: 35, mp: 112, cd: 17,
      type: 'arrow_rain', power: 0.71, arrows: 16, width: 430, desc: 'Gọi một loạt tên dày đặc xuống khu vực phía trước.',
      m5: { arrows: 22 }, t5: 'Mưa tên dày hơn.',
      m10: { width: 540, slow: 2 }, t10: 'Vùng tên rộng hơn và làm chậm quái.' },
    hl8: { school: 'cung_thu', icon: '🧊', name: 'Tên Băng', level: 10, mp: 28, cd: 4,
      type: 'projectile', power: 1.35, range: 420, count: 1, slow: 2, desc: 'Mũi tên băng làm chậm mục tiêu.',
      m5: { range: 560 }, t5: 'Tầm xa hơn (560).',
      m10: { freeze: 1 }, t10: 'Đóng băng 1 giây.' },
    hl9: { school: 'cung_thu', icon: '🏹', name: 'Xạ Liên Hoàn', level: 18, mp: 48, cd: 7,
      type: 'spread', power: 0.75, count: 3, range: 400, desc: 'Bắn loạt tên theo quạt hẹp.',
      m5: { count: 5 }, t5: 'Số lượng tăng lên 5.',
      m10: { power: 0.9, slow: 1 }, t10: 'Sức mạnh 90%. Làm chậm 1 giây.' },
    hl10: { school: 'cung_thu', icon: '🎯', name: 'Tiễn Xuyên Tâm', level: 30, mp: 86, cd: 12,
      type: 'projectile', power: 3.4, pierce: true, range: 760, count: 1, desc: 'Một mũi tên cực mạnh, tầm xa, xuyên mọi quái.',
      m5: { range: 900 }, t5: 'Tầm xa hơn (900).',
      m10: { power: 4.2 }, t10: 'Sức mạnh 420%.' },
    hl11: { school: 'cung_thu', icon: '🔥', name: 'Hỏa Vũ Liên Châu', level: 40, mp: 120, cd: 14,
      type: 'spread', power: 0.62, count: 7, range: 460, desc: 'Bắn bảy mũi tên lửa tỏa quạt.',
      m5: { count: 9 }, t5: 'Số lượng tăng lên 9.',
      m10: { power: 0.78, slow: 1.5 }, t10: 'Sức mạnh 78%. Làm chậm 1.5 giây.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
