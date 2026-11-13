/*
 * Kỹ năng · Sát Thủ.
 *
 * Mỗi kỹ năng có cấp 1–10, nâng bằng điểm kỹ năng:
 *   m5 / m10: chỉ số đổi ở cấp 5 / 10; t5 / t10: mô tả hiện trong bảng kỹ năng.
 *   type: dash | melee | projectile | spread | aoe | heal | buff | guard | backstep | manashield | shadow_toggle | shadow_command
 *   ultSchools: các class học được; ultAny: mọi class đều học được.
 */
(function (G) {
  'use strict';

  const PART = {
    st1: { school: 'sat_thu', icon: '💨', name: 'Lướt Bóng', level: 5, mp: 20, cd: 2.5,
      type: 'dash', power: 1.34, distance: 160, desc: 'Lướt nhanh, chém mọi kẻ trên đường, tạm miễn sát thương.',
      m5: { distance: 220 }, t5: 'Lướt xa hơn (220).',
      m10: { after: 0.73 }, t10: 'Để lại vệt dao chém thêm một lần.' },
    st2: { school: 'sat_thu', icon: '🔪', name: 'Nhát Kép', level: 8, mp: 32, cd: 4,
      type: 'melee', power: 0.45, hits: 2, range: 90, desc: 'Hai nhát liên tiếp từ hai hướng.',
      m5: { hits: 3 }, t5: '3 nhát.',
      m10: { finisher: 0.78 }, t10: 'Nhát cuối gây 78% sức mạnh.' },
    st4: { school: 'sat_thu', icon: '🕶️', name: 'Ẩn Thân', level: 12, mp: 44, cd: 15,
      type: 'guard', duration: 4, reduce: 0.5, desc: 'Ẩn nửa người, giảm 50% sát thương nhận vào.',
      m5: { duration: 5.5 }, t5: 'Kéo dài 5.5 giây.',
      m10: { reduce: 0.6 }, t10: 'Giảm 60%, sau khi hết buff: đòn kế tiếp chắc chắn chí mạng.' },
    st3: { school: 'sat_thu', icon: '⚡', name: 'Cuồng Sát', level: 15, mp: 60, cd: 18,
      type: 'buff', buff: 'frenzy', duration: 6, atkBuff: 0.23, speedBuff: 0.3, desc: 'Tốc độ và tấn công tăng vọt.',
      m5: { duration: 8 }, t5: 'Kéo dài 8 giây.',
      m10: { atkBuff: 0.34, critBuff: 11 }, t10: 'Tấn công +34% và chí mạng +11%.' },
    st5: { school: 'sat_thu', icon: '🗡️', name: 'Trăm Nhát Phân Tán', level: 20, mp: 150, cd: 38, ult: true,
      type: 'spread', power: 2.3, count: 5, range: 380, desc: 'Phóng 5 dao ngắn tỏa ra phía trước.',
      m5: { count: 8 }, t5: '8 dao.',
      m10: { slow: 2 }, t10: 'Dao trúng làm chậm quái 2 giây.' },
    st6: { school: 'sat_thu', icon: '🌑', name: 'Ảnh Trảm Liên Kích', level: 25, mp: 80, cd: 8,
      type: 'dash', power: 1.36, distance: 230, after: 0.78, desc: 'Lướt xuyên mục tiêu rồi để lại một nhát chém bóng tối.',
      m5: { distance: 290 }, t5: 'Lướt xa hơn.',
      m10: { after: 1.17 }, t10: 'Vệt chém gây sát thương lớn hơn.' },
    st7: { school: 'sat_thu', icon: '🩸', name: 'Huyết Ảnh Truy Sát', level: 35, mp: 112, cd: 12,
      type: 'dash', power: 1.43, distance: 280, after: 0.95, desc: 'Lướt chớp nhoáng qua kẻ địch, để lại bóng ảnh chém bồi.',
      m5: { distance: 340 }, t5: 'Tăng tầm lướt.',
      m10: { after: 1.33 }, t10: 'Bóng ảnh gây sát thương mạnh hơn.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
