/*
 * Trang bị ô nhan.
 */
(function (G) {
  'use strict';

  const PART = {
    nhan_bac: { name: 'Nhẫn bạc', kind: 'armor', slot: 'nhan', level: 8, stats: { atk: 7, crit: 2 }, price: 600 },
    nhan_thach_quy: { name: 'Nhẫn Thạch Vương', kind: 'armor', slot: 'nhan', level: 18, minQ: 3, stats: { atk: 11, crit: 4 }, price: 2500 },
    nhan_bang_long: { name: 'Nhẫn Băng Long', kind: 'armor', slot: 'nhan', level: 28, minQ: 3, stats: { atk: 17, crit: 6 }, price: 11500 },
    nhan_luu_tru: { name: 'Nhẫn Lưu Trữ', kind: 'armor', slot: 'nhan', level: 38, minQ: 3, stats: { atk: 25, crit: 9 }, price: 44000 },
    nhan_vinh_hang: { name: 'Nhẫn Vĩnh Hằng', kind: 'armor', slot: 'nhan', level: 48, minQ: 3, stats: { atk: 36, crit: 13 }, price: 175000 },
    nhan_thien_khoi: { name: 'Nhẫn Thiên Khôi', kind: 'armor', slot: 'nhan', level: 58, minQ: 3, stats: { atk: 39, crit: 14 }, price: 260000 },
    nhan_long_mach: { name: 'Nhẫn Long Mạch', kind: 'armor', slot: 'nhan', level: 68, minQ: 3, stats: { atk: 44, crit: 15 }, price: 1040000 },
    nhan_tinh_van: { name: 'Nhẫn Tinh Vân', kind: 'armor', slot: 'nhan', level: 78, minQ: 3, stats: { atk: 48, crit: 16 }, price: 2340000 },
    nhan_than_mong: { name: 'Nhẫn Thần Mộng', kind: 'armor', slot: 'nhan', level: 88, minQ: 3, stats: { atk: 53, crit: 17 }, price: 4160000 },
    nhan_sang_the: { name: 'Nhẫn Sáng Thế', kind: 'armor', slot: 'nhan', level: 98, minQ: 3, stats: { atk: 59, crit: 18 }, price: 6500000 },
  };

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['nhan'] = PART;
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
