/*
 * Kỹ năng · Kiếm Sĩ.
 *
 * Mỗi kỹ năng có cấp 1–10, nâng bằng điểm kỹ năng:
 *   m5 / m10: chỉ số đổi ở cấp 5 / 10; t5 / t10: mô tả hiện trong bảng kỹ năng.
 *   type: dash | melee | projectile | spread | aoe | heal | buff | guard | backstep | manashield | shadow_toggle | shadow_command
 *   ultSchools: các class học được; ultAny: mọi class đều học được.
 */
(function (G) {
  'use strict';

  const PART = {
    pa1: { school: 'kiem_si', icon: '💨', name: 'Trảm Kích Lướt', level: 5, mp: 24, cd: 3,
      type: 'dash', power: 1.33, distance: 170, desc: 'Lướt tới trước, chém mọi quái trên đường đi.',
      m5: { distance: 230 }, t5: 'Lướt xa hơn (230).',
      m10: { after: 0.74 }, t10: 'Để lại vệt kiếm, chém thêm một lần nữa.' },
    pa2: { school: 'kiem_si', icon: '⚔️', name: 'Liên Trảm', level: 8, mp: 40, cd: 6,
      type: 'melee', power: 0.27, hits: 4, range: 100, desc: 'Chém liên tiếp phía trước.',
      m5: { hits: 5 }, t5: 'Chém 5 nhát.',
      m10: { finisher: 0.76 }, t10: 'Nhát cuối gây 76% sức mạnh và hất văng quái.' },
    pa4: { school: 'kiem_si', icon: '🛡️', name: 'Khiên Ý Chí', level: 12, mp: 50, cd: 18,
      type: 'guard', duration: 5, reduce: 0.4, desc: 'Giảm sát thương nhận vào.',
      m5: { duration: 7 }, t5: 'Kéo dài 7 giây.',
      m10: { reduce: 0.55, reflect: 0.3 }, t10: 'Giảm 55% sát thương và phản lại 30% cho quái.' },
    pa3: { school: 'kiem_si', icon: '🔥', name: 'Cuồng Nộ', level: 15, mp: 70, cd: 20,
      type: 'buff', buff: 'rage', duration: 6, atkBuff: 0.23, speedBuff: 0.38, desc: 'Tăng tấn công và tốc đánh.',
      m5: { duration: 8 }, t5: 'Kéo dài 8 giây.',
      m10: { atkBuff: 0.34 }, t10: 'Tấn công +34%.' },
    pa5: { school: 'kiem_si', icon: '🗡️', name: 'Thiên Kiếm Giáng', level: 20, mp: 170, cd: 40, ult: true,
      type: 'sword_fall', power: 5.02, radius: 180, count: 1, desc: 'Triệu hồi thanh kiếm khổng lồ đâm xuống phía trước.',
      m5: { radius: 230 }, t5: 'Vùng sát thương rộng hơn.',
      m10: { count: 2, power: 3.45 }, t10: 'Hai thanh kiếm cùng giáng xuống, tổng sức mạnh cao hơn.' },
    pa6: { school: 'kiem_si', icon: '🌪️', name: 'Kiếm Vũ Liên Hoàn', level: 25, mp: 84, cd: 12,
      type: 'melee', power: 0.24, hits: 6, range: 150, finisher: 0.46, desc: 'Xoay kiếm chém liên tiếp, nhát cuối tung đòn kết liễu.',
      m5: { hits: 8 }, t5: 'Tăng thành 8 nhát chém.',
      m10: { finisher: 0.61, range: 180 }, t10: 'Nhát cuối mạnh hơn, tầm chém rộng hơn.' },
    pa7: { school: 'kiem_si', icon: '🌠', name: 'Phá Quân Trảm', level: 35, mp: 116, cd: 13,
      type: 'melee', power: 0.38, hits: 4, range: 190, finisher: 0.67, desc: 'Dồn lực chém bốn nhát, kết thúc bằng đòn phá giáp.',
      m5: { hits: 5 }, t5: 'Tăng thành 5 nhát chém.',
      m10: { finisher: 0.88, range: 230 }, t10: 'Đòn cuối mạnh hơn và tầm chém xa hơn.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
