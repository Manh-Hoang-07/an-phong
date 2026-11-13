/*
 * Kỹ năng · Toàn Năng (riêng).
 *
 * Mỗi kỹ năng có cấp 1–10, nâng bằng điểm kỹ năng:
 *   m5 / m10: chỉ số đổi ở cấp 5 / 10; t5 / t10: mô tả hiện trong bảng kỹ năng.
 *   type: dash | melee | projectile | spread | aoe | heal | buff | guard | backstep | manashield | shadow_toggle | shadow_command
 *   ultSchools: các class học được; ultAny: mọi class đều học được.
 */
(function (G) {
  'use strict';

  const PART = {
    vn1: { school: 'toan_nang', icon: '🌟', name: 'Thức Tỉnh Tối Thượng', level: 20, mp: 220, cd: 60, ult: true,
      type: 'buff', buff: 'awaken', duration: 10, atkBuff: 0.38, critBuff: 15, speedBuff: 0.3,
      desc: 'Giải phóng toàn bộ sức mạnh: tăng tấn công, chí mạng, tốc đánh.',
      m5: { duration: 13 }, t5: 'Kéo dài 13 giây.',
      m10: { atkBuff: 0.6 }, t10: 'Tấn công +60%.' },
    vn2: { school: 'toan_nang', icon: '💫', name: 'Hợp Nhất Nguyên Tố', level: 30, mp: 116, cd: 24,
      type: 'aoe', power: 2.09, radius: 210, freeze: 1, heal: 0.18, desc: 'Hợp nhất các nguyên tố, gây sát thương diện rộng và hồi một phần máu.',
      m5: { radius: 260, heal: 0.24 }, t5: 'Vùng ảnh hưởng rộng hơn và hồi thêm máu.',
      m10: { power: 2.64, freeze: 2 }, t10: 'Sát thương mạnh hơn, đóng băng quái lâu hơn.' },
    vn3: { school: 'toan_nang', icon: '🌈', name: 'Dòng Chảy Toàn Năng', level: 40, mp: 136, cd: 28,
      type: 'buff', buff: 'awaken', duration: 8, atkBuff: 0.23, critBuff: 9, speedBuff: 0.19, desc: 'Cân bằng các sức mạnh, tăng công kích, chí mạng và tốc độ.',
      m5: { duration: 10 }, t5: 'Duy trì trạng thái lâu hơn.',
      m10: { atkBuff: 0.3, critBuff: 14 }, t10: 'Tăng thêm công kích và tỷ lệ chí mạng.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
