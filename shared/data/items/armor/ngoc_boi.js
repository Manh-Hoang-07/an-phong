/*
 * Trang bị ô ngoc_boi.
 */
(function (G) {
  'use strict';

  const PART = {
    ngoc_boi_luc: { name: 'Ngọc bội lục bảo', kind: 'armor', slot: 'ngoc_boi', level: 10, stats: { hp: 55, mp: 40, crit: 1 }, price: 650 },
    ngoc_boi_thach_quy: { name: 'Ngọc bội Thạch Vương', kind: 'armor', slot: 'ngoc_boi', level: 20, minQ: 3, stats: { hp: 110, mp: 70, crit: 2 }, price: 2600 },
    ngoc_boi_bang_long: { name: 'Ngọc bội Băng Long', kind: 'armor', slot: 'ngoc_boi', level: 30, minQ: 3, stats: { hp: 180, mp: 110, crit: 3 }, price: 12000 },
    ngoc_boi_luu_tru: { name: 'Ngọc bội Lưu Trữ', kind: 'armor', slot: 'ngoc_boi', level: 40, minQ: 3, stats: { hp: 270, mp: 160, crit: 4 }, price: 46000 },
    ngoc_boi_vinh_hang: { name: 'Ngọc bội Vĩnh Hằng', kind: 'armor', slot: 'ngoc_boi', level: 50, minQ: 3, stats: { hp: 380, mp: 230, crit: 6 }, price: 180000 },
    ngoc_boi_thien_khoi: { name: 'Ngọc bội Thiên Khôi', kind: 'armor', slot: 'ngoc_boi', level: 60, minQ: 3, stats: { def: 31, hp: 390, mp: 144, crit: 7 }, price: 260000 },
    ngoc_boi_long_mach: { name: 'Ngọc bội Long Mạch', kind: 'armor', slot: 'ngoc_boi', level: 70, minQ: 3, stats: { def: 37, hp: 480, mp: 167, crit: 8 }, price: 1040000 },
    ngoc_boi_tinh_van: { name: 'Ngọc bội Tinh Vân', kind: 'armor', slot: 'ngoc_boi', level: 80, minQ: 3, stats: { def: 43, hp: 570, mp: 192, crit: 9 }, price: 2340000 },
    ngoc_boi_than_mong: { name: 'Ngọc bội Thần Mộng', kind: 'armor', slot: 'ngoc_boi', level: 90, minQ: 3, stats: { def: 50, hp: 660, mp: 218, crit: 10 }, price: 4160000 },
    ngoc_boi_sang_the: { name: 'Ngọc bội Sáng Thế', kind: 'armor', slot: 'ngoc_boi', level: 100, minQ: 3, stats: { def: 57, hp: 750, mp: 244, crit: 11 }, price: 6500000 },
    huy_hieu_binh_minh: { name: 'Huy Hiệu Bình Minh', kind: 'armor', slot: 'ngoc_boi', level: 12, minQ: 3, stats: { atk: 10, hp: 80, mp: 40 }, price: 3000, desc: 'Huy hiệu đội Bình Minh: tăng tấn công, máu và năng lượng.' },
  };

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['ngoc_boi'] = PART;
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
