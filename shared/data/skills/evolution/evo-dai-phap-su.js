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
    ps27: { school: 'phap_su', evolutionKey: 'dai_phap_su', icon: '🔥', name: 'Hỏa Cầu Nổ', level: 27, mp: 60, cd: 4.5,
      type: 'projectile', power: 2.8, range: 450, count: 1, desc: 'Cầu lửa nổ tung trên mục tiêu.',
      m5: { range: 550 }, t5: 'Tầm xa hơn (550).',
      m10: { count: 2, power: 2.1 }, t10: 'Số lượng tăng lên 2. Sức mạnh 210%.' },
    ps32: { school: 'phap_su', evolutionKey: 'dai_phap_su', icon: '❄️', name: 'Băng Phong Trận', level: 32, mp: 86, cd: 16,
      type: 'aoe', power: 2.2, radius: 240, freeze: 2, desc: 'Đóng băng mọi quái quanh người.',
      m5: { radius: 300 }, t5: 'Vùng rộng hơn (300).',
      m10: { freeze: 3, power: 2.8 }, t10: 'Đóng băng 3 giây. Sức mạnh 280%.' },
    ps37: { school: 'phap_su', evolutionKey: 'dai_phap_su', icon: '🌀', name: 'Lôi Cầu Xoáy', level: 37, mp: 100, cd: 16,
      type: 'meteor', power: 1.5, radius: 260, count: 2, desc: 'Quả cầu sét rơi xuống và nổ lan.',
      m5: { radius: 310 }, t5: 'Vùng rộng hơn (310).',
      m10: { count: 3, power: 1.2 }, t10: 'Số lượng tăng lên 3. Sức mạnh 120%.' },
    ps38: { school: 'phap_su', evolutionKey: 'dai_phap_su', icon: '💠', name: 'Hồi Nguyên', level: 38, mp: 30, cd: 20,
      type: 'heal', heal: 0.12, mpHeal: 0.5, desc: 'Hồi năng lượng lớn, hồi thêm chút máu.',
      m5: { mpHeal: 0.6 }, t5: 'Hồi 60% năng lượng.',
      m10: { heal: 0.25, mpHeal: 0.7 }, t10: 'Hồi 25% máu. Hồi 70% năng lượng.' },
    ps42: { school: 'phap_su', evolutionKey: 'dai_phap_su', icon: '🌌', name: 'Dịch Chuyển Tức Thời', level: 42, mp: 84, cd: 12,
      type: 'backstep', power: 0.7, distance: 260, count: 4, desc: 'Dịch chuyển lùi nhanh, để lại loạt đạn phép.',
      m5: { cd: 9 }, t5: 'Hồi chiêu còn 9 giây.',
      m10: { count: 6 }, t10: 'Số lượng tăng lên 6.' },
    ps45: { school: 'phap_su', evolutionKey: 'dai_phap_su', icon: '🌠', name: 'Thiên Địa Hợp Nhất Pháp', level: 45, mp: 150, cd: 24,
      type: 'meteor', power: 0.75, radius: 280, count: 5, desc: 'Năm đợt nguyên tố rơi khắp vùng phía trước.',
      m5: { radius: 330 }, t5: 'Vùng rộng hơn (330).',
      m10: { power: 0.9 }, t10: 'Sức mạnh 90%.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
