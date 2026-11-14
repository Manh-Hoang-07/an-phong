/*
 * Kỹ năng · Đặc biệt: mọi class đều học được.
 *
 * Mỗi kỹ năng có cấp 1–10, nâng bằng điểm kỹ năng:
 *   m5 / m10: chỉ số đổi ở cấp 5 / 10; t5 / t10: mô tả hiện trong bảng kỹ năng.
 *   type: dash | melee | projectile | spread | aoe | heal | buff | guard | backstep | manashield | shadow_toggle | shadow_command
 *   ultSchools: các class học được; ultAny: mọi class đều học được.
 *
 * Tuyệt kỹ: mạnh hơn kỹ năng thường, học bằng sách riêng (sach_tk_<id>), bán ở Lầu Trân Bảo bằng Linh Ngọc (trừ tuyệt kỹ dùng chung ultAny). */
(function (G) {
  'use strict';

  const PART = {
    ulChung1: { school: 'chung', ultAny: true, icon: '💥', name: 'Thiên Địa Chấn Động', level: 25, mp: 220, cd: 48, ult: true,
      type: 'aoe', power: 5.43, radius: 240, desc: 'Giải phóng nguyên lực, nổ tung mọi thứ xung quanh.',
      m5: { radius: 280 }, t5: 'Vùng nổ rộng hơn.',
      m10: { radius: 330, power: 7.24 }, t10: 'Vùng nổ cực rộng, sát thương tăng mạnh.' },
    ulChung2: { school: 'chung', ultAny: true, icon: '🔥', name: 'Ý Chí Bất Diệt', level: 30, mp: 240, cd: 60, ult: true,
      type: 'buff', buff: 'awaken', duration: 10, atkBuff: 0.34, critBuff: 11, speedBuff: 0.19, desc: 'Bùng cháy ý chí chiến đấu: tăng tấn công, chí mạng, tốc đánh.',
      m5: { duration: 13 }, t5: 'Kéo dài 13 giây.',
      m10: { atkBuff: 0.47 }, t10: 'Tấn công +47%.' },
    ulChung3: { school: 'chung', ultAny: true, icon: '🌌', name: 'Hư Không Tuyệt Trảm', level: 40, mp: 270, cd: 50, ult: true,
      type: 'sword_fall', power: 3.61, radius: 200, count: 2, desc: 'Xé toạc hư không, hai nhát chém khổng lồ đánh xuống.',
      m5: { radius: 240 }, t5: 'Vùng sát thương rộng hơn.',
      m10: { count: 3, power: 2.76 }, t10: 'Ba nhát chém hư không.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
