/*
 * Trang bị ô day_chuyen.
 */
(function (G) {
  'use strict';

  const PART = {
    day_chuyen_bac: { name: 'Dây chuyền bạc', kind: 'armor', slot: 'day_chuyen', level: 9, stats: { hp: 80, mp: 30 }, price: 600 },
    day_chuyen_thach_quy: { name: 'Dây chuyền Thạch Vương', kind: 'armor', slot: 'day_chuyen', level: 19, minQ: 3, stats: { hp: 140, mp: 55 }, price: 2500 },
    day_chuyen_bang_long: { name: 'Dây chuyền Băng Long', kind: 'armor', slot: 'day_chuyen', level: 29, minQ: 3, stats: { hp: 230, mp: 90 }, price: 11500 },
    day_chuyen_luu_tru: { name: 'Dây chuyền Lưu Trữ', kind: 'armor', slot: 'day_chuyen', level: 39, minQ: 3, stats: { hp: 340, mp: 130 }, price: 44000 },
    day_chuyen_vinh_hang: { name: 'Dây chuyền Vĩnh Hằng', kind: 'armor', slot: 'day_chuyen', level: 49, minQ: 3, stats: { hp: 480, mp: 180 }, price: 175000 },
    day_chuyen_thien_khoi: { name: 'Dây chuyền Thiên Khôi', kind: 'armor', slot: 'day_chuyen', level: 59, minQ: 3, stats: { hp: 520, mp: 200 }, price: 260000 },
    day_chuyen_long_mach: { name: 'Dây chuyền Long Mạch', kind: 'armor', slot: 'day_chuyen', level: 69, minQ: 3, stats: { hp: 640, mp: 235 }, price: 1040000 },
    day_chuyen_tinh_van: { name: 'Dây chuyền Tinh Vân', kind: 'armor', slot: 'day_chuyen', level: 79, minQ: 3, stats: { hp: 760, mp: 270 }, price: 2340000 },
    day_chuyen_than_mong: { name: 'Dây chuyền Thần Mộng', kind: 'armor', slot: 'day_chuyen', level: 89, minQ: 3, stats: { hp: 880, mp: 305 }, price: 4160000 },
    day_chuyen_sang_the: { name: 'Dây chuyền Sáng Thế', kind: 'armor', slot: 'day_chuyen', level: 99, minQ: 3, stats: { hp: 1000, mp: 340 }, price: 6500000 },
  };

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['day_chuyen'] = PART;
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
