/*
 * Trang bị ô giay.
 */
(function (G) {
  'use strict';

  const PART = {
    giay_da: { name: 'Giày da sói', kind: 'armor', slot: 'giay', level: 4, stats: { def: 4, hp: 25, crit: 1 }, price: 300 },
    giay_thach_quy: { name: 'Giày đá Thạch Vương', kind: 'armor', slot: 'giay', level: 14, minQ: 3, stats: { def: 9, hp: 60, crit: 1 }, price: 2400 },
    giay_bang_long: { name: 'Giày Băng Long', kind: 'armor', slot: 'giay', level: 24, minQ: 3, stats: { def: 14, hp: 100, crit: 2 }, price: 11000 },
    giay_luu_tru: { name: 'Giày Lưu Trữ', kind: 'armor', slot: 'giay', level: 34, minQ: 3, stats: { def: 21, hp: 160, crit: 3 }, price: 42000 },
    giay_vinh_hang: { name: 'Giày Vĩnh Hằng', kind: 'armor', slot: 'giay', level: 44, minQ: 3, stats: { def: 30, hp: 240, crit: 4 }, price: 170000 },
    giay_thien_khoi: { name: 'Giày Thiên Khôi', kind: 'armor', slot: 'giay', level: 54, minQ: 3, stats: { def: 27, hp: 347, crit: 5 }, price: 260000 },
    giay_long_mach: { name: 'Giày Long Mạch', kind: 'armor', slot: 'giay', level: 64, minQ: 3, stats: { def: 33, hp: 427, crit: 5 }, price: 1040000 },
    giay_tinh_van: { name: 'Giày Tinh Vân', kind: 'armor', slot: 'giay', level: 74, minQ: 3, stats: { def: 38, hp: 507, crit: 6 }, price: 2340000 },
    giay_than_mong: { name: 'Giày Thần Mộng', kind: 'armor', slot: 'giay', level: 84, minQ: 3, stats: { def: 44, hp: 587, crit: 6 }, price: 4160000 },
    giay_sang_the: { name: 'Giày Sáng Thế', kind: 'armor', slot: 'giay', level: 94, minQ: 3, stats: { def: 51, hp: 667, crit: 7 }, price: 6500000 },
  };

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['giay'] = PART;
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
