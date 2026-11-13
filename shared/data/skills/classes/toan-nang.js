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
    vn4: { school: 'toan_nang', icon: '☯️', name: 'Thế Cân Bằng', level: 15, mp: 56, cd: 18,
      type: 'buff', buff: 'balance', duration: 8, atkBuff: 0.12, critBuff: 6, speedBuff: 0.12, desc: 'Cân bằng sức mạnh: tăng nhẹ tấn công, chí mạng và tốc đánh.',
      m5: { duration: 10 }, t5: 'Kéo dài 10 giây.',
      m10: { atkBuff: 0.2 }, t10: 'Tấn công +20%.' },
    vn5: { school: 'toan_nang', icon: '💫', name: 'Tinh Lực Dồi Dào', level: 22, mp: 60, cd: 14,
      type: 'heal', heal: 0.3, mpHeal: 0.15, desc: 'Hồi máu và năng lượng vừa phải.',
      m5: { heal: 0.38 }, t5: 'Hồi 38% máu.',
      m10: { heal: 0.45, mpHeal: 0.25 }, t10: 'Hồi 45% máu. Hồi 25% năng lượng.' },
    vn6: { school: 'toan_nang', icon: '🔱', name: 'Thủ Ấn Toàn Năng', level: 35, mp: 100, cd: 11,
      type: 'projectile', power: 3, pierce: true, range: 640, count: 1, desc: 'Phóng ấn xuyên mọi quái, sát thương cao.',
      m5: { range: 780 }, t5: 'Tầm xa hơn (780).',
      m10: { count: 2, power: 2.2 }, t10: 'Số lượng tăng lên 2. Sức mạnh 220%.' },
    vn7: { school: 'toan_nang', icon: '⚔️', name: 'Trảm Hợp Nhất', level: 45, mp: 130, cd: 16,
      type: 'melee', power: 0.6, hits: 4, range: 200, finisher: 1.4, desc: 'Chém bốn nhát liên tiếp, nhát cuối nổ lực mạnh.',
      m5: { hits: 5 }, t5: 'Chém 5 nhát.',
      m10: { finisher: 1.9 }, t10: 'Đòn cuối 190%.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
