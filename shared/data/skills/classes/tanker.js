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
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
