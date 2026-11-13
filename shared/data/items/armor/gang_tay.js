/*
 * Trang bị ô gang_tay.
 */
(function (G) {
  'use strict';

  const PART = {
    gang_da: { name: 'Găng da sói', kind: 'armor', slot: 'gang_tay', level: 3, stats: { atk: 3, def: 2 }, price: 320 },
    gang_thach_quy: { name: 'Găng Thạch Vương', kind: 'armor', slot: 'gang_tay', level: 13, minQ: 3, stats: { atk: 8, def: 5, crit: 2 }, price: 2400 },
    gang_bang_long: { name: 'Găng Băng Long', kind: 'armor', slot: 'gang_tay', level: 23, minQ: 3, stats: { atk: 12, def: 8, crit: 3 }, price: 11000 },
    gang_luu_tru: { name: 'Găng Lưu Trữ', kind: 'armor', slot: 'gang_tay', level: 33, minQ: 3, stats: { atk: 18, def: 12, crit: 4 }, price: 42000 },
    gang_vinh_hang: { name: 'Găng Vĩnh Hằng', kind: 'armor', slot: 'gang_tay', level: 43, minQ: 3, stats: { atk: 26, def: 17, crit: 6 }, price: 170000 },
    gang_tay_thien_khoi: { name: 'Găng Thiên Khôi', kind: 'armor', slot: 'gang_tay', level: 53, minQ: 3, stats: { def: 26, hp: 325, atk: 34, crit: 6 }, price: 260000 },
    gang_tay_long_mach: { name: 'Găng Long Mạch', kind: 'armor', slot: 'gang_tay', level: 63, minQ: 3, stats: { def: 31, hp: 400, atk: 38, crit: 7 }, price: 1040000 },
    gang_tay_tinh_van: { name: 'Găng Tinh Vân', kind: 'armor', slot: 'gang_tay', level: 73, minQ: 3, stats: { def: 36, hp: 475, atk: 42, crit: 7 }, price: 2340000 },
    gang_tay_than_mong: { name: 'Găng Thần Mộng', kind: 'armor', slot: 'gang_tay', level: 83, minQ: 3, stats: { def: 42, hp: 550, atk: 46, crit: 8 }, price: 4160000 },
    gang_tay_sang_the: { name: 'Găng Sáng Thế', kind: 'armor', slot: 'gang_tay', level: 93, minQ: 3, stats: { def: 48, hp: 625, atk: 51, crit: 8 }, price: 6500000 },
  };

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['gang_tay'] = PART;
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
