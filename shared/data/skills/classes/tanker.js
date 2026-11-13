/*
 * Kỹ năng · Tanker.
 *
 * Mỗi kỹ năng có cấp 1–10, nâng bằng điểm kỹ năng:
 *   m5 / m10: chỉ số đổi ở cấp 5 / 10; t5 / t10: mô tả hiện trong bảng kỹ năng.
 *   type: dash | melee | projectile | spread | aoe | heal | buff | guard | backstep | manashield | shadow_toggle | shadow_command
 *   ultSchools: các class học được; ultAny: mọi class đều học được.
 */
(function (G) {
  'use strict';

  const PART = {
    tk1: { school: 'tanker', icon: '🛡️', name: 'Khiên Phá', level: 5, mp: 28, cd: 3.5,
      type: 'melee', power: 0.75, hits: 1, range: 110, desc: 'Đập khiên tới trước, hất văng quái xa.',
      m5: { range: 140, power: 0.94 }, t5: 'Mạnh hơn và tầm rộng hơn.',
      m10: { finisher: 1.13 }, t10: 'Nếu quái đã bị choáng, gây 113% sát thương.' },
    tk2: { school: 'tanker', icon: '⚙️', name: 'Vòng Thép', level: 8, mp: 40, cd: 7,
      type: 'aoe', power: 1.43, radius: 160, freeze: 0, desc: 'Quét tất cả quái xung quanh.',
      m5: { radius: 200 }, t5: 'Vùng rộng hơn.',
      m10: { power: 2.14 }, t10: 'Sát thương tăng mạnh, hất văng quái.' },
    tk4: { school: 'tanker', icon: '🔩', name: 'Giáp Sắt', level: 12, mp: 56, cd: 22,
      type: 'guard', duration: 7, reduce: 0.5, desc: 'Khoác giáp sắt, giảm 50% sát thương.',
      m5: { duration: 9, reduce: 0.6 }, t5: 'Kéo dài 9 giây, giảm 60%.',
      m10: { reduce: 0.6, reflect: 0.25 }, t10: 'Giảm 60% và phản 25% lại quái.' },
    tk3: { school: 'tanker', icon: '💪', name: 'Thịnh Nộ', level: 15, mp: 70, cd: 20,
      type: 'buff', buff: 'rage', duration: 8, atkBuff: 0.19, speedBuff: 0.15, desc: 'Tăng tấn công và tốc đánh.',
      m5: { duration: 10, atkBuff: 0.26 }, t5: 'Kéo dài 10 giây, tấn công +26%.',
      m10: { atkBuff: 0.34 }, t10: 'Tấn công +34%.' },
    tk5: { school: 'tanker', icon: '🌊', name: 'Sóng Thép', level: 20, mp: 180, cd: 42, ult: true,
      type: 'sword_fall', power: 5.17, radius: 220, count: 1, desc: 'Đập kiếm xuống đất, sóng thép nổ diện rộng.',
      m5: { radius: 270 }, t5: 'Vùng nổ rộng hơn.',
      m10: { count: 2, power: 3.45 }, t10: 'Hai vụ nổ liên tiếp, tổng sức công phá cao hơn.' },
    tk6: { school: 'tanker', icon: '🌋', name: 'Địa Chấn', level: 25, mp: 96, cd: 16,
      type: 'aoe', power: 1.97, radius: 220, desc: 'Dậm mạnh xuống đất, tạo chấn động quanh người.',
      m5: { radius: 270 }, t5: 'Chấn động lan xa hơn.',
      m10: { power: 2.53 }, t10: 'Sát thương chấn động tăng mạnh.' },
    tk7: { school: 'tanker', icon: '🪨', name: 'Pháo Đài Bất Khuất', level: 35, mp: 116, cd: 24,
      type: 'guard', duration: 8, reduce: 0.6, desc: 'Dựng thế phòng thủ vững chắc, giảm mạnh sát thương nhận vào.',
      m5: { duration: 10 }, t5: 'Kéo dài trạng thái phòng thủ.',
      m10: { duration: 10, reduce: 0.6 }, t10: 'Giảm sát thương nhiều hơn trong thời gian dài hơn.' },
    tk8: { school: 'tanker', icon: '🐂', name: 'Xung Phong', level: 10, mp: 32, cd: 6,
      type: 'dash', power: 1.25, distance: 190, desc: 'Lao tới đẩy lùi quái trên đường đi.',
      m5: { distance: 250 }, t5: 'Xa hơn (250).',
      m10: { after: 0.8 }, t10: 'Vệt chém 80%.' },
    tk9: { school: 'tanker', icon: '📢', name: 'Tiếng Gầm Uy Hiếp', level: 18, mp: 52, cd: 12,
      type: 'aoe', power: 1.3, radius: 230, slow: 3, desc: 'Gầm vang làm chậm mọi quái quanh người và gây sát thương nhẹ.',
      m5: { radius: 290 }, t5: 'Vùng rộng hơn (290).',
      m10: { power: 1.9, slow: 4 }, t10: 'Sức mạnh 190%. Làm chậm 4 giây.' },
    tk10: { school: 'tanker', icon: '🛡️', name: 'Phản Giáp', level: 30, mp: 80, cd: 20,
      type: 'guard', duration: 6, reduce: 0.45, reflect: 0.3, desc: 'Giảm sát thương và phản một phần về kẻ đánh.',
      m5: { duration: 8 }, t5: 'Kéo dài 8 giây.',
      m10: { reduce: 0.55, reflect: 0.6 }, t10: 'Giảm 55% sát thương. Phản 60% sát thương.' },
    tk11: { school: 'tanker', icon: '🔨', name: 'Búa Thiên Lôi', level: 40, mp: 120, cd: 18,
      type: 'sword_fall', power: 5, radius: 210, count: 1, desc: 'Giáng búa khổng lồ xuống phía trước, hất văng quái.',
      m5: { radius: 260 }, t5: 'Vùng rộng hơn (260).',
      m10: { count: 2, power: 3.3 }, t10: 'Số lượng tăng lên 2. Sức mạnh 330%.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
