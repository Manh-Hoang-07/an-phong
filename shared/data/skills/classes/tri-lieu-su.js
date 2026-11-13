/*
 * Kỹ năng · Trị Liệu Sư.
 *
 * Mỗi kỹ năng có cấp 1–10, nâng bằng điểm kỹ năng:
 *   m5 / m10: chỉ số đổi ở cấp 5 / 10; t5 / t10: mô tả hiện trong bảng kỹ năng.
 *   type: dash | melee | projectile | spread | aoe | heal | buff | guard | backstep | manashield | shadow_toggle | shadow_command
 *   ultSchools: các class học được; ultAny: mọi class đều học được.
 */
(function (G) {
  'use strict';

  const PART = {
    tl1: { school: 'tri_lieu_su', icon: '💚', name: 'Chữa Lành', level: 5, mp: 40, cd: 10,
      type: 'heal', heal: 0.35, desc: 'Hồi 35% máu tối đa.',
      m5: { heal: 0.42 }, t5: 'Hồi 42% máu.',
      m10: { mpHeal: 0.25 }, t10: 'Hồi thêm 25% năng lượng.' },
    tl2: { school: 'tri_lieu_su', icon: '🌊', name: 'Sóng Thánh', level: 8, mp: 30, cd: 3.5,
      type: 'projectile', power: 1.07, pierce: true, range: 340, slow: 2, count: 1,
      desc: 'Sóng ánh sáng xuyên quái, làm chậm.',
      m5: { range: 460, count: 2 }, t5: 'Bay xa hơn, bắn 2 sóng.',
      m10: { freeze: 1 }, t10: 'Trúng đóng băng quái 1 giây.' },
    tl4: { school: 'tri_lieu_su', icon: '🔷', name: 'Khiên Ánh Sáng', level: 12, mp: 44, cd: 20,
      type: 'manashield', duration: 10, absorb: 0.6, desc: 'Dùng năng lượng đỡ 60% sát thương.',
      m5: { duration: 14 }, t5: 'Kéo dài 14 giây.',
      m10: { absorb: 0.6 }, t10: 'Đỡ 60% sát thương bằng năng lượng.' },
    tl3: { school: 'tri_lieu_su', icon: '✨', name: 'Ân Sủng', level: 15, mp: 80, cd: 22,
      type: 'buff', buff: 'grace', duration: 9, atkBuff: 0.11, speedBuff: 0.15, regen: 0.03, desc: 'Buff toàn bộ chỉ số, tự hồi máu liên tục.',
      m5: { duration: 12 }, t5: 'Kéo dài 12 giây.',
      m10: { atkBuff: 0.23, regen: 0.05 }, t10: 'Tấn công +23%, hồi máu nhanh hơn.' },
    tl5: { school: 'tri_lieu_su', icon: '☀️', name: 'Phép Thánh Toàn Trị', level: 20, mp: 210, cd: 45, ult: true,
      type: 'aoe', power: 6.9, radius: 240, freeze: 0, heal: 0.25, desc: 'Nổ tung ánh sáng thánh xung quanh, gây sát thương lớn và hồi máu.',
      m5: { radius: 300 }, t5: 'Vùng rộng hơn.',
      m10: { heal: 0.4 }, t10: 'Hồi máu nhiều hơn.' },
    tl6: { school: 'tri_lieu_su', icon: '🌿', name: 'Thánh Quang Hộ Thể', level: 25, mp: 92, cd: 18,
      type: 'heal', heal: 0.3, mpHeal: 0.12, desc: 'Ánh sáng hồi phục máu và một phần năng lượng.',
      m5: { heal: 0.42 }, t5: 'Hồi máu nhiều hơn.',
      m10: { heal: 0.5, mpHeal: 0.2 }, t10: 'Hồi 50% máu và 20% năng lượng.' },
    tl7: { school: 'tri_lieu_su', icon: '🌼', name: 'Kết Giới Sinh Mệnh', level: 35, mp: 120, cd: 18,
      type: 'aoe', power: 1.97, radius: 260, heal: 0.35, desc: 'Tỏa ánh sáng quanh thân, gây sát thương và hồi phục sinh lực.',
      m5: { radius: 320, heal: 0.42 }, t5: 'Vùng ảnh hưởng và lượng hồi phục tăng.',
      m10: { power: 2.76, heal: 0.5 }, t10: 'Sát thương và hồi phục tăng mạnh.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
