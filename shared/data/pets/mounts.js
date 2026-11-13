/*
 * Thú đồng hành (mã quà tặng) và kỹ năng của thú.
 *
 * Thú đồng hành KHÔNG lên cấp: chỉ số cố định theo loài (stats), chỉ tăng nhờ trang bị thú (items/pet-gear.js, pets/gear.js).
 * atk là hệ số sát thương của loài nhân lên chỉ số tấn công.
 */
(function (G) {
  'use strict';

  const MOUNTS = {
    soi_xam: { name: 'Sói Xám', icon: '🐺', level: 1, stats: { hp: 2400, mp: 60, sta: 100, atk: 180, def: 150 }, look: 'wolf', tint: 0xb8c1cc, atk: 1, desc: 'Sói đồng hành nhanh nhẹn, lao vào cắn mục tiêu.' },
    than_lan: { name: 'Thằn Lằn Đầm', icon: '🦎', level: 1, stats: { hp: 2800, mp: 60, sta: 100, atk: 170, def: 190 }, look: 'lizard', tint: 0xffffff, atk: 1.05, desc: 'Thằn lằn đồng hành, dùng vuốt cào mục tiêu.' },
    soi_tuyet: { name: 'Sói Tuyết Bạc', icon: '🐺', level: 1, stats: { hp: 3000, mp: 60, sta: 100, atk: 210, def: 170 }, look: 'wolf', tint: 0xe5f3ff, atk: 1.12, desc: 'Sói núi tuyết khỏe hơn, chuyên tấn công áp sát.' },
    hac_may: { name: 'Hạc Mây Đá', icon: '🕊️', level: 1, stats: { hp: 2200, mp: 70, sta: 110, atk: 200, def: 130 }, look: 'bird', tint: 0xffffff, atk: 1.08, desc: 'Hạc linh hoạt, dùng mỏ và cánh tấn công quái.' },
    ky_lan: { name: 'Kỳ Lân', icon: '🦄', level: 1, stats: { hp: 3400, mp: 80, sta: 110, atk: 240, def: 200 }, look: 'horse', tint: 0xffe8c4, atk: 1.15, desc: 'Kỳ lân đồng hành, có sức tấn công mạnh nhất.' },
  };
  const PET_SKILLS = {
    bite: { name: 'Cắn Xé', icon: '🦷', mp: 4, sta: 8, cooldown: 1800, range: 74, mult: 1.35, desc: 'Cắn mục tiêu gần nhất.' },
    pounce: { name: 'Vồ Mồi', icon: '🐾', mp: 8, sta: 14, cooldown: 3600, range: 115, mult: 1.9, desc: 'Vồ tới mục tiêu và gây sát thương lớn.' },
    howl: { name: 'Gầm Hống', icon: '🌟', mp: 12, sta: 20, cooldown: 6000, range: 150, mult: 1.25, desc: 'Tiếng gầm dồn sức vào đòn đánh.' },
  };

  Object.assign(G, { MOUNTS, PET_SKILLS });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
