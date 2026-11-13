/*
 * Thuốc hồi máu / năng lượng, thuốc giải hiệu ứng.
 */
(function (G) {
  'use strict';

  const PART = {
    // Thuốc
    binh_mau_nho: { name: 'Bình máu nhỏ', kind: 'potion', hp: 80, price: 10, stack: true, desc: 'Hồi 80 máu.' },
    binh_mau_vua: { name: 'Bình máu vừa', kind: 'potion', hp: 260, price: 40, level: 6, stack: true, desc: 'Hồi 260 máu.' },
    binh_nl_nho: { name: 'Bình năng lượng nhỏ', kind: 'potion', mp: 40, price: 12, stack: true, desc: 'Hồi 40 năng lượng.' },
    binh_nl_vua: { name: 'Bình năng lượng vừa', kind: 'potion', mp: 130, price: 45, level: 6, stack: true, desc: 'Hồi 130 năng lượng.' },
    thuoc_nhiem_do: { name: 'Thuốc chữa nhiễm đỏ', kind: 'potion', hpPct: 0.5, cleanse: true, level: 20, price: 900, stack: true,
      desc: 'Hồi 50% máu tối đa và giải hiệu ứng làm chậm. Công thức của Dược sư Lan.' },
    // ===== Thuốc cấp cao
    binh_mau_lon: { name: 'Bình máu lớn', kind: 'potion', hp: 700, price: 100, level: 11, stack: true, desc: 'Hồi 700 máu.' },
    binh_mau_dac: { name: 'Bình máu đặc biệt', kind: 'potion', hp: 1800, price: 250, level: 21, stack: true, desc: 'Hồi 1800 máu.' },
    binh_mau_than_thoai: { name: 'Bình máu thần thoại', kind: 'potion', hp: 6500, price: 1800, level: 31, stack: true, desc: 'Hồi 6500 máu.' },
    binh_nl_lon: { name: 'Bình năng lượng lớn', kind: 'potion', mp: 350, price: 100, level: 11, stack: true, desc: 'Hồi 350 năng lượng.' },
    binh_nl_dac: { name: 'Bình năng lượng đặc biệt', kind: 'potion', mp: 900, price: 250, level: 21, stack: true, desc: 'Hồi 900 năng lượng.' },
    binh_nl_than_thoai: { name: 'Bình năng lượng thần thoại', kind: 'potion', mp: 3200, price: 1800, level: 31, stack: true, desc: 'Hồi 3200 năng lượng.' },
  };

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['potions'] = PART;
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
