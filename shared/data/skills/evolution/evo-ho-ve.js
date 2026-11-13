/*
 * Kỹ năng · Hộ Vệ Bất Khuất: ném khiên, thuẫn trận phản chấn, chấn địa, pháo đài tiến quân.
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
    hv25: { school: 'tanker', evolutionKey: 'ho_ve_bat_khuat', icon: '🔰', name: 'Khiên Phi Trảm', level: 25, mp: 40, cd: 4,
      type: 'projectile', power: 1.26, range: 320, count: 1, slow: 1, desc: 'Ném khiên vào quái phía trước, làm chậm.',
      m5: { count: 2 }, t5: 'Ném 2 khiên.', m10: { slow: 2 }, t10: 'Làm chậm 2 giây.' },
    hv30: { school: 'tanker', evolutionKey: 'ho_ve_bat_khuat', icon: '🛡️', name: 'Thuẫn Trận Phản Chấn', level: 25, mp: 60, cd: 15,
      type: 'guard', duration: 7, reduce: 0.55, reflect: 0.6, atkBuff: 0.19, desc: 'Dựng thuẫn trận: giảm mạnh sát thương, phản lại kẻ đánh và tăng tấn công.',
      m5: { duration: 9 }, t5: 'Kéo dài 9 giây.', m10: { reduce: 0.6, reflect: 0.9 }, t10: 'Giảm 60% sát thương, phản 90%.' },
    hv35: { school: 'tanker', evolutionKey: 'ho_ve_bat_khuat', icon: '🌋', name: 'Chấn Địa', level: 30, mp: 60, cd: 12,
      type: 'aoe', power: 2.11, radius: 220, slow: 2, desc: 'Dậm đất gây sát thương và làm chậm quái xung quanh.',
      m5: { radius: 270 }, t5: 'Vùng rộng hơn (270).', m10: { power: 2.64 }, t10: 'Sát thương tăng lên 264%.' },
    hv40: { school: 'tanker', evolutionKey: 'ho_ve_bat_khuat', icon: '🏰', name: 'Pháo Đài Tiến Quân', level: 35, mp: 76, cd: 14,
      type: 'dash', power: 1.41, after: 0.88, distance: 160, desc: 'Tiến lên trong tư thế phòng thủ, đánh bật quái phía trước.',
      m5: { distance: 200 }, t5: 'Tiến xa hơn (200).', m10: { after: 1.35 }, t10: 'Vệt đánh mạnh lên 135%.' },
    hv27: { school: 'tanker', evolutionKey: 'ho_ve_bat_khuat', icon: '🛡️', name: 'Thuẫn Kích', level: 27, mp: 52, cd: 5,
      type: 'melee', power: 0.9, hits: 2, range: 120, finisher: 1.4, desc: 'Đập khiên bồi, đẩy lùi quái.',
      m5: { hits: 3 }, t5: 'Chém 3 nhát.',
      m10: { finisher: 1.9 }, t10: 'Đòn cuối 190%.' },
    hv32: { school: 'tanker', evolutionKey: 'ho_ve_bat_khuat', icon: '💪', name: 'Ý Chí Hộ Vệ', level: 32, mp: 76, cd: 22,
      type: 'buff', buff: 'resolve', duration: 10, atkBuff: 0.1, regen: 0.04, desc: 'Hồi máu liên tục và tăng tấn công.',
      m5: { duration: 12 }, t5: 'Kéo dài 12 giây.',
      m10: { regen: 0.06 }, t10: 'Hồi máu nhanh hơn (6%/s).' },
    hv37: { school: 'tanker', evolutionKey: 'ho_ve_bat_khuat', icon: '🌀', name: 'Khiên Xoáy', level: 37, mp: 84, cd: 11,
      type: 'aoe', power: 2.3, radius: 230, slow: 2, desc: 'Xoay khiên quanh người, đẩy lùi và làm chậm quái.',
      m5: { radius: 280 }, t5: 'Vùng rộng hơn (280).',
      m10: { power: 2.9 }, t10: 'Sức mạnh 290%.' },
    hv38: { school: 'tanker', evolutionKey: 'ho_ve_bat_khuat', icon: '🏰', name: 'Thành Lũy Bất Diệt', level: 38, mp: 96, cd: 24,
      type: 'guard', duration: 3, reduce: 0.7, desc: 'Giảm sát thương cực mạnh trong thời gian ngắn.',
      m5: { duration: 4 }, t5: 'Kéo dài 4 giây.',
      m10: { reduce: 0.8, reflect: 0.4 }, t10: 'Giảm 80% sát thương. Phản 40% sát thương.' },
    hv42: { school: 'tanker', evolutionKey: 'ho_ve_bat_khuat', icon: '🐉', name: 'Phản Chấn Địa Long', level: 42, mp: 110, cd: 16,
      type: 'aoe', power: 3, radius: 280, slow: 3, desc: 'Dậm đất tạo sóng chấn lan rộng, làm chậm quái.',
      m5: { radius: 340 }, t5: 'Vùng rộng hơn (340).',
      m10: { power: 3.7 }, t10: 'Sức mạnh 370%.' },
    hv45: { school: 'tanker', evolutionKey: 'ho_ve_bat_khuat', icon: '📣', name: 'Tuyên Chiến', level: 45, mp: 130, cd: 28,
      type: 'buff', buff: 'declare', duration: 10, atkBuff: 0.25, speedBuff: 0.2, desc: 'Tuyên chiến: tăng mạnh tấn công và tốc đánh.',
      m5: { duration: 12 }, t5: 'Kéo dài 12 giây.',
      m10: { atkBuff: 0.35 }, t10: 'Tấn công +35%.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
