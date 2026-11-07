/* Thú triệu hồi. Cờ quà tặng --mount và dữ liệu cũ vẫn được giữ tương thích. */
(function (G) {
  'use strict';
  const MOUNTS = {
    soi_xam: { name: 'Sói Xám', icon: '🐺', level: 1, look: 'wolf', tint: 0xb8c1cc, atk: 1, desc: 'Sói đồng hành nhanh nhẹn, lao vào cắn mục tiêu.' },
    than_lan: { name: 'Thằn Lằn Đầm', icon: '🦎', level: 1, look: 'lizard', tint: 0xffffff, atk: 1.05, desc: 'Thằn lằn đồng hành, dùng vuốt cào mục tiêu.' },
    soi_tuyet: { name: 'Sói Tuyết Bạc', icon: '🐺', level: 1, look: 'wolf', tint: 0xe5f3ff, atk: 1.12, desc: 'Sói núi tuyết khỏe hơn, chuyên tấn công áp sát.' },
    hac_may: { name: 'Hạc Mây Đá', icon: '🕊️', level: 1, look: 'bird', tint: 0xffffff, atk: 1.08, desc: 'Hạc linh hoạt, dùng mỏ và cánh tấn công quái.' },
    ky_lan: { name: 'Kỳ Lân', icon: '🦄', level: 1, look: 'horse', tint: 0xffe8c4, atk: 1.15, desc: 'Kỳ lân đồng hành, có sức tấn công mạnh nhất.' },
  };
  const PET_SKILLS = {
    bite: { name: 'Cắn Xé', icon: '🦷', mp: 4, sta: 8, cooldown: 1800, range: 74, mult: 1.35, desc: 'Cắn mục tiêu gần nhất.' },
    pounce: { name: 'Vồ Mồi', icon: '🐾', mp: 8, sta: 14, cooldown: 3600, range: 115, mult: 1.9, desc: 'Vồ tới mục tiêu và gây sát thương lớn.' },
    howl: { name: 'Gầm Hống', icon: '🌟', mp: 12, sta: 20, cooldown: 6000, range: 150, mult: 1.25, desc: 'Tiếng gầm dồn sức vào đòn đánh.' },
  };
  function petStats(player) {
    const lv = Math.max(1, player.level || 1);
    return { maxHp: 70 + 16 * (lv - 1), maxMp: 28 + 5 * (lv - 1), maxSta: 80 + 2 * (lv - 1), atk: 7 + 2.1 * (lv - 1), def: 1 + Math.floor((lv - 1) * 0.8) };
  }
  Object.assign(G, { MOUNTS, PET_SKILLS, petStats });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
