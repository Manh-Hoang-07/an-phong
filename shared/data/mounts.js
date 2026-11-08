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
  // Linh thú mặc định của Triệu Hồi Sư: gọi bằng kỹ năng, không cần mã quà tặng.
  // Nâng cấp kỹ năng tăng số lượng gọi ra và sức mạnh (xem skill th5).
  const SUMMONS = {
    linh_soi: { name: 'Linh Sói', icon: '🐺', look: 'wolf', tint: 0x9fd8ff, atk: 1, desc: 'Linh thú mặc định, nhanh nhẹn.' },
    linh_hac: { name: 'Linh Phong', icon: '🐝', look: 'insect', tint: 0xffe9a8, atk: 1.05, desc: 'Linh thú mặc định, linh hoạt.' },
    linh_than: { name: 'Linh Thằn', icon: '🦎', look: 'lizard', tint: 0xa8ffb0, atk: 1.1, desc: 'Linh thú mặc định, khỏe.' },
    linh_ky: { name: 'Linh Hồ', icon: '🦊', look: 'fox', tint: 0xffe6f5, atk: 1.2, desc: 'Linh thú mặc định, mạnh nhất.' },
  };
  function petStats(player) {
    const lv = Math.max(1, player.level || 1);
    return { maxHp: 70 + 16 * (lv - 1), maxMp: 28 + 5 * (lv - 1), maxSta: 80 + 2 * (lv - 1), atk: 7 + 2.1 * (lv - 1), def: 1 + Math.floor((lv - 1) * 0.8) };
  }
  // Linh thú mặc định: sức mạnh theo cấp nhân vật và cấp kỹ năng th5
  function summonStats(player) {
    const lv = Math.max(1, player.level || 1);
    const skLv = (player.skills && player.skills.th5) || 1;
    const mul = 1 + 0.12 * (skLv - 1);
    return { maxHp: Math.round((60 + 14 * (lv - 1)) * mul), maxMp: Math.round((24 + 4 * (lv - 1)) * mul), maxSta: Math.round((70 + 2 * (lv - 1)) * mul), atk: (6 + 1.9 * (lv - 1)) * mul, def: 1 + Math.floor((lv - 1) * 0.7) };
  }
  // Mỗi lần chỉ gọi 1 linh thú (người chơi chọn con nào); cấp kỹ năng th5 chỉ tăng sức mạnh linh thú
  function summonCount(player) { return ((player.skills && player.skills.th5) || 0) >= 1 ? 1 : 0; }
  // Linh thú đang được chọn (mặc định con đầu tiên)
  function summonChoice(player) {
    const c = player.summons && player.summons.choice;
    return SUMMONS[c] ? c : Object.keys(SUMMONS)[0];
  }
  // Bóng ma của Tử Linh Thuật Sư: tối đa 12 bóng lưu giữ, gọi ra cùng lúc tối đa 5 bóng
  const SHADOW_ROSTER = 12, SHADOW_PARTY = 5;
  Object.assign(G, { MOUNTS, PET_SKILLS, SUMMONS, petStats, summonStats, summonCount, summonChoice, SHADOW_ROSTER, SHADOW_PARTY });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
