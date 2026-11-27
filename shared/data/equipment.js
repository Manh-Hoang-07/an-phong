/*
 * Phẩm chất, dòng phụ, tên chỉ số và tỉ lệ nâng cấp trang bị.
 */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------- Phẩm chất và dòng phụ
  const QUALITY_NAMES = { 1: 'Thường', 2: 'Tốt', 3: 'Hiếm', 4: 'Huyền thoại' };
  const QUALITY_MUL = { 1: 1, 2: 1.1, 3: 1.2, 4: 1.35 };   // nhân chỉ số chính
  const QUALITY_AFFIX = { 1: 0, 2: 1, 3: 2, 4: 3 };       // số dòng phụ
  // Nhân giá BÁN LẠI (sellPrice = price/4 × hệ số này). Giữ dưới 4 để bán lại luôn lỗ so với giá shop:
  // mua shop rồi bán lại mất 75%, đồ rơi q4 bán được 75% giá shop (không phải 200% như trước).
  const QUALITY_PRICE = { 1: 1, 2: 1.5, 3: 2, 4: 3 };
  // Tỉ lệ phẩm chất khi rơi: [thường, tốt, hiếm, huyền thoại]
  const QUALITY_ODDS = { normal: [0.62, 0.30, 0.07, 0.01], boss: [0, 0, 0.8, 0.2] };

  // Dòng phụ: giá trị ngẫu nhiên trong khoảng [min, max], tăng theo cấp món đồ
  const AFFIXES = {
    hp: { name: 'Máu', min: (l) => 8 + l * 5, max: (l) => 16 + l * 9 },
    mp: { name: 'Năng lượng', min: (l) => 5 + l * 3, max: (l) => 10 + l * 5 },
    atk: { name: 'Tấn công', min: (l) => 1 + l * 0.5, max: (l) => 2 + l * 1.1 },
    def: { name: 'Phòng thủ', min: (l) => 1 + l * 0.4, max: (l) => 2 + l * 0.8 },
    crit: { name: 'Chí mạng', unit: '%', min: () => 1, max: (l) => Math.min(15, 2 + l * 0.25) },
    lifesteal: { name: 'Hút máu', unit: '%', min: () => 1, max: (l) => Math.min(6, 2 + l * 0.15) },
    cdr: { name: 'Giảm hồi chiêu', unit: '%', min: () => 2, max: (l) => Math.min(12, 4 + l * 0.4) },
    speed: { name: 'Tốc chạy', min: () => 4, max: (l) => 8 + l },
    boss: { name: 'Sát thương lên trùm', unit: '%', min: () => 3, max: (l) => Math.min(20, 6 + l * 0.6) },
    goldfind: { name: 'Xu rơi thêm', unit: '%', min: () => 5, max: (l) => Math.min(25, 12 + l) },
    expfind: { name: 'Kinh nghiệm thêm', unit: '%', min: () => 3, max: (l) => Math.min(15, 6 + l * 0.5) },
  };
  // Nhãn chỉ số. sta / staRegen / skill chỉ có trên trang bị đặc biệt (không nằm trong AFFIXES nên
  // đồ thường không bao giờ roll ra), nhưng vẫn cần nhãn để bảng chi tiết hiện đúng tên.
  const STAT_NAMES = {
    atk: 'Tấn công', def: 'Phòng thủ', hp: 'Máu', mp: 'Năng lượng', crit: 'Chí mạng',
    sta: 'Thể lực', staRegen: 'Hồi thể lực', skill: 'Sát thương kỹ năng',
  };

  // Nâng cấp: tỉ lệ thành công khi nâng từ +n lên +(n+1)
  const UPGRADE_MAX = 12;
  // Từ +8→+9 đến +10→+11: thất bại giữ nguyên cấp. Chỉ +11→+12 mới rớt, và ở mức 30% (thay vì 15%)
  // để không còn cảnh "tốn 2160 xu + 4 đá rồi mất cả cấp lẫn tài nguyên" ở ngưỡng cuối.
  const UPGRADE_RATES = [1, 1, 1, 1, 0.85, 0.78, 0.7, 0.62, 0.55, 0.48, 0.4, 0.3];

  // ---------------------------------------------------------------- Độ bền
  // Mục tiêu đặt theo SỐ ĐÒN, rồi suy ra điểm (xem logic/items.js: durMax). Gốc: 1 điểm = 1 đòn thường / 1 cú bị đánh,
  // nhân MOB_LEVEL_DIV để quái cấp cao hao nặng hơn; durMax nhân cùng hệ số nên số đòn để hỏng gần như đều ở mọi tầng.
  const DURABILITY = {
    HITS_WEAPON: 25000,                       // đòn thường để vũ khí từ 100% về 0% (kiếm 360ms ≈ 2,5 giờ đánh liên tục)
    HITS_ARMOR: 400,                          // cú bị đánh mỗi ô giáp để về 0% (hao ngẫu nhiên đều 9 ô)
    WEAPON_WEAR: { 0: 1, 1: 3, 2: 8, 3: 15 }, // đánh thường / kỹ năng / tuyệt kỹ / siêu tuyệt kỹ
    ARMOR_WEAR: 1,                            // điểm gốc mỗi cú bị đánh
    MOB_LEVEL_DIV: 20,                        // mobFactor(lv) = 1 + lv / 20
    GRADE_WEAR: { normal: 1, elite: 1.5, leader: 2, boss: 3 },
    DEATH_PCT: 0.03,                          // chết: mọi ô đang mặc mất thêm 3% độ bền tối đa
    WARN_PCT: 20,                             // dưới mức này cảnh báo
    BROKEN_SELL: 0.25,                        // món hỏng bán được 25% giá
    FLUSH_MS: 8000,                           // server gom hao mòn, ghi mỗi 8 giây một lần
    HURT_GAP_MS: 300,                         // hai cú 'hurt' liên tiếp cách nhau ít nhất 300ms (client bất tử 700ms sau mỗi cú trúng)
  };

  Object.assign(G, { QUALITY_NAMES, QUALITY_MUL, QUALITY_AFFIX, QUALITY_PRICE, QUALITY_ODDS, AFFIXES, STAT_NAMES, UPGRADE_MAX, UPGRADE_RATES, DURABILITY });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
