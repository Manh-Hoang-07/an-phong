/*
 * Phẩm chất, dòng phụ, tên chỉ số và tỉ lệ nâng cấp trang bị.
 */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------- Phẩm chất và dòng phụ
  const QUALITY_NAMES = { 1: 'Thường', 2: 'Tốt', 3: 'Hiếm', 4: 'Huyền thoại' };
  const QUALITY_MUL = { 1: 1, 2: 1.1, 3: 1.2, 4: 1.35 };   // nhân chỉ số chính
  const QUALITY_AFFIX = { 1: 0, 2: 1, 3: 2, 4: 3 };       // số dòng phụ
  const QUALITY_PRICE = { 1: 1, 2: 2, 3: 4, 4: 8 };       // nhân giá bán
  // Tỉ lệ phẩm chất khi rơi: [thường, tốt, hiếm, huyền thoại]
  const QUALITY_ODDS = { normal: [0.62, 0.30, 0.07, 0.01], boss: [0, 0, 0.8, 0.2] };

  // Dòng phụ: giá trị ngẫu nhiên trong khoảng [min, max], tăng theo cấp món đồ
  const AFFIXES = {
    hp: { name: 'Máu', min: (l) => 8 + l * 5, max: (l) => 16 + l * 9 },
    mp: { name: 'Năng lượng', min: (l) => 5 + l * 3, max: (l) => 10 + l * 5 },
    atk: { name: 'Tấn công', min: (l) => 1 + l * 0.5, max: (l) => 2 + l * 1.1 },
    def: { name: 'Phòng thủ', min: (l) => 1 + l * 0.4, max: (l) => 2 + l * 0.8 },
    crit: { name: 'Chí mạng', unit: '%', min: () => 1, max: (l) => 2 + l * 0.25 },
    lifesteal: { name: 'Hút máu', unit: '%', min: () => 1, max: (l) => 2 + l * 0.15 },
    cdr: { name: 'Giảm hồi chiêu', unit: '%', min: () => 2, max: (l) => 4 + l * 0.4 },
    speed: { name: 'Tốc chạy', min: () => 4, max: (l) => 8 + l },
    boss: { name: 'Sát thương lên trùm', unit: '%', min: () => 3, max: (l) => 6 + l * 0.6 },
    goldfind: { name: 'Xu rơi thêm', unit: '%', min: () => 5, max: (l) => 12 + l },
    expfind: { name: 'Kinh nghiệm thêm', unit: '%', min: () => 3, max: (l) => 6 + l * 0.5 },
  };
  const STAT_NAMES = { atk: 'Tấn công', def: 'Phòng thủ', hp: 'Máu', mp: 'Năng lượng', crit: 'Chí mạng' };

  // Nâng cấp: tỉ lệ thành công khi nâng từ +n lên +(n+1)
  const UPGRADE_MAX = 12;
  const UPGRADE_RATES = [1, 1, 1, 1, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.15];

  Object.assign(G, { QUALITY_NAMES, QUALITY_MUL, QUALITY_AFFIX, QUALITY_PRICE, QUALITY_ODDS, AFFIXES, STAT_NAMES, UPGRADE_MAX, UPGRADE_RATES });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
