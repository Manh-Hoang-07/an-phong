/*
 * Kỹ năng · Pháp Sư.
 *
 * Mỗi kỹ năng có cấp 1–10, nâng bằng điểm kỹ năng:
 *   m5 / m10: chỉ số đổi ở cấp 5 / 10; t5 / t10: mô tả hiện trong bảng kỹ năng.
 *   type: dash | melee | projectile | spread | aoe | heal | buff | guard | backstep | manashield | shadow_toggle | shadow_command
 *   ultSchools: các class học được; ultAny: mọi class đều học được.
 */
(function (G) {
  'use strict';

  const PART = {
    tn1: { school: 'phap_su', icon: '🌊', name: 'Sóng Băng', level: 5, mp: 20, cd: 3,
      type: 'projectile', power: 2.07, pierce: true, range: 300, slow: 3, count: 1, desc: 'Sóng băng xuyên quái, làm chậm.',
      m5: { range: 420 }, t5: 'Bay xa hơn (420).',
      m10: { freeze: 1 }, t10: 'Đóng băng quái 1 giây.' },
    tn2: { school: 'phap_su', icon: '🌙', name: 'Hồi Phục', level: 8, mp: 50, cd: 12,
      type: 'heal', heal: 0.3, desc: 'Hồi máu.',
      m5: { heal: 0.4 }, t5: 'Hồi 40% máu tối đa.',
      m10: { mpHeal: 0.2 }, t10: 'Hồi thêm 20% năng lượng.' },
    tn4: { school: 'phap_su', icon: '🔷', name: 'Khiên Năng Lượng', level: 12, mp: 40, cd: 20,
      type: 'manashield', duration: 8, absorb: 0.6, desc: 'Dùng năng lượng đỡ phần lớn sát thương.',
      m5: { duration: 12 }, t5: 'Kéo dài 12 giây.',
      m10: { absorb: 0.6 }, t10: 'Đỡ toàn bộ sát thương bằng năng lượng.' },
    tn3: { school: 'phap_su', icon: '❄️', name: 'Băng Ngục', level: 15, mp: 80, cd: 18,
      type: 'aoe', power: 2.3, radius: 210, freeze: 2, desc: 'Đóng băng vùng quanh người.',
      m5: { radius: 260 }, t5: 'Vùng rộng hơn.',
      m10: { freeze: 3 }, t10: 'Quái đứng yên 3 giây.' },
    tn5: { school: 'phap_su', icon: '☄️', name: 'Thiên Thạch', level: 20, mp: 200, cd: 40, ult: true,
      type: 'meteor', power: 5.02, radius: 200, count: 1, desc: 'Gọi thiên thạch rơi xuống phía trước.',
      m5: { radius: 250 }, t5: 'Vụ nổ rộng hơn.',
      m10: { count: 2, power: 3.45 }, t10: 'Hai thiên thạch liên tiếp, tổng sức công phá cao hơn.' },
    tn6: { school: 'phap_su', icon: '🌌', name: 'Băng Lưu Bạo', level: 25, mp: 96, cd: 16,
      type: 'aoe', power: 2.11, radius: 190, freeze: 2, desc: 'Gọi luồng băng nổ quanh người, gây sát thương và đóng băng quái.',
      m5: { radius: 240 }, t5: 'Vùng băng lan rộng hơn.',
      m10: { freeze: 3, power: 2.53 }, t10: 'Đóng băng lâu hơn, sát thương tăng.' },
    tn7: { school: 'phap_su', icon: '🔥', name: 'Hỏa Tinh Bạo Liệt', level: 35, mp: 124, cd: 19,
      type: 'meteor', power: 1.05, radius: 250, count: 2, desc: 'Triệu hồi hai thiên thạch lửa phát nổ trên chiến trường.',
      m5: { radius: 300 }, t5: 'Vụ nổ lan rộng hơn.',
      m10: { count: 3, power: 0.92 }, t10: 'Gọi thêm một thiên thạch, tổng sức công phá lớn hơn.' },
    tn8: { school: 'phap_su', icon: '☄️', name: 'Hỏa Cầu', level: 10, mp: 30, cd: 3.5,
      type: 'projectile', power: 2.3, range: 380, count: 1, desc: 'Cầu lửa gây sát thương lớn lên một mục tiêu.',
      m5: { range: 480 }, t5: 'Tầm xa hơn (480).',
      m10: { count: 2, power: 1.6 }, t10: 'Số lượng tăng lên 2. Sức mạnh 160%.' },
    tn9: { school: 'phap_su', icon: '⚡', name: 'Tia Sét Xuyên', level: 18, mp: 56, cd: 8,
      type: 'projectile', power: 2, pierce: true, range: 520, count: 1, slow: 2, desc: 'Tia sét xuyên mọi quái trên đường bay, làm chậm.',
      m5: { range: 680 }, t5: 'Tầm xa hơn (680).',
      m10: { freeze: 1, power: 2.4 }, t10: 'Đóng băng 1 giây. Sức mạnh 240%.' },
    tn10: { school: 'phap_su', icon: '🌌', name: 'Dịch Chuyển Nguyên Tố', level: 30, mp: 80, cd: 14,
      type: 'backstep', power: 0.9, distance: 220, count: 3, desc: 'Dịch chuyển lùi về sau, để lại loạt đạn nguyên tố.',
      m5: { cd: 11 }, t5: 'Hồi chiêu còn 11 giây.',
      m10: { count: 5 }, t10: 'Số lượng tăng lên 5.' },
    tn11: { school: 'phap_su', icon: '🌋', name: 'Địa Ngục Liệt Hỏa', level: 40, mp: 126, cd: 16,
      type: 'meteor', power: 0.95, radius: 270, count: 3, desc: 'Ba cầu lửa lớn rơi xuống vùng phía trước.',
      m5: { radius: 320 }, t5: 'Vùng rộng hơn (320).',
      m10: { count: 4, power: 0.85 }, t10: 'Số lượng tăng lên 4. Sức mạnh 85%.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
