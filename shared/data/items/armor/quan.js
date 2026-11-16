/*
 * Trang bị ô quan.
 */
(function (G) {
  'use strict';

  const PART = {
    quan_da: { name: 'Quần da sói', kind: 'armor', slot: 'quan', level: 6, stats: { def: 6, hp: 40 }, price: 206 },
    quan_thach_quy: { name: 'Quần đá Thạch Vương', kind: 'armor', slot: 'quan', level: 16, minQ: 3, stats: { def: 14, hp: 120 }, price: 651 },
    quan_bang_long: { name: 'Quần Băng Long', kind: 'armor', slot: 'quan', level: 26, minQ: 3, stats: { def: 21, hp: 200 }, price: 1320 },
    quan_luu_tru: { name: 'Quần Lưu Trữ', kind: 'armor', slot: 'quan', level: 36, minQ: 3, stats: { def: 31, hp: 310 }, price: 2960 },
    quan_vinh_hang: { name: 'Quần Vĩnh Hằng', kind: 'armor', slot: 'quan', level: 46, minQ: 3, stats: { def: 44, hp: 450 }, price: 13300 },
    quan_thien_khoi: { name: 'Quần Thiên Khôi', kind: 'armor', slot: 'quan', level: 56, minQ: 3, stats: { def: 42, hp: 520 }, price: 36400 },
    quan_long_mach: { name: 'Quần Long Mạch', kind: 'armor', slot: 'quan', level: 66, minQ: 3, stats: { def: 50, hp: 640 }, price: 43000 },
    quan_tinh_van: { name: 'Quần Tinh Vân', kind: 'armor', slot: 'quan', level: 76, minQ: 3, stats: { def: 58, hp: 760 }, price: 49600 },
    quan_than_mong: { name: 'Quần Thần Mộng', kind: 'armor', slot: 'quan', level: 86, minQ: 3, stats: { def: 67, hp: 880 }, price: 56300 },
    quan_sang_the: { name: 'Quần Sáng Thế', kind: 'armor', slot: 'quan', level: 96, minQ: 3, stats: { def: 77, hp: 1000 }, price: 62900 },
  };

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['quan'] = PART;
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
