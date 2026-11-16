/*
 * Trang bị ô dai_lung.
 */
(function (G) {
  'use strict';

  const PART = {
    dai_da: { name: 'Đai da sói', kind: 'armor', slot: 'dai_lung', level: 7, stats: { hp: 45, mp: 15, def: 1 }, price: 189 },
    dai_thach_quy: { name: 'Đai đá Thạch Vương', kind: 'armor', slot: 'dai_lung', level: 17, minQ: 3, stats: { def: 6, hp: 110, mp: 35 }, price: 651 },
    dai_bang_long: { name: 'Đai Băng Long', kind: 'armor', slot: 'dai_lung', level: 27, minQ: 3, stats: { def: 9, hp: 180, mp: 55 }, price: 1320 },
    dai_luu_tru: { name: 'Đai Lưu Trữ', kind: 'armor', slot: 'dai_lung', level: 37, minQ: 3, stats: { def: 14, hp: 280, mp: 85 }, price: 2960 },
    dai_vinh_hang: { name: 'Đai Vĩnh Hằng', kind: 'armor', slot: 'dai_lung', level: 47, minQ: 3, stats: { def: 20, hp: 400, mp: 120 }, price: 13300 },
    dai_lung_thien_khoi: { name: 'Đai Thiên Khôi', kind: 'armor', slot: 'dai_lung', level: 57, minQ: 3, stats: { def: 29, hp: 368 }, price: 36400 },
    dai_lung_long_mach: { name: 'Đai Long Mạch', kind: 'armor', slot: 'dai_lung', level: 67, minQ: 3, stats: { def: 35, hp: 453 }, price: 43000 },
    dai_lung_tinh_van: { name: 'Đai Tinh Vân', kind: 'armor', slot: 'dai_lung', level: 77, minQ: 3, stats: { def: 41, hp: 538 }, price: 49600 },
    dai_lung_than_mong: { name: 'Đai Thần Mộng', kind: 'armor', slot: 'dai_lung', level: 87, minQ: 3, stats: { def: 48, hp: 623 }, price: 56300 },
    dai_lung_sang_the: { name: 'Đai Sáng Thế', kind: 'armor', slot: 'dai_lung', level: 97, minQ: 3, stats: { def: 54, hp: 708 }, price: 62900 },
  };

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['dai_lung'] = PART;
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
