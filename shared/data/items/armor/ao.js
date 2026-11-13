/*
 * Trang bị ô ao.
 */
(function (G) {
  'use strict';

  const PART = {
    ao_da: { name: 'Áo khoác da sói', kind: 'armor', slot: 'ao', level: 2, stats: { def: 8, hp: 55 }, price: 400 },
    ao_giap_da: { name: 'Giáp đá Thạch Vương', kind: 'armor', slot: 'ao', level: 12, minQ: 3, stats: { def: 15, hp: 140 }, price: 2500 },
    ao_bang_long: { name: 'Giáp Băng Long', kind: 'armor', slot: 'ao', level: 22, minQ: 3, stats: { def: 22, hp: 230 }, price: 11500 },
    ao_luu_tru: { name: 'Giáp Lưu Trữ', kind: 'armor', slot: 'ao', level: 32, minQ: 3, stats: { def: 33, hp: 360 }, price: 44000 },
    ao_vinh_hang: { name: 'Giáp Vĩnh Hằng', kind: 'armor', slot: 'ao', level: 42, minQ: 3, stats: { def: 46, hp: 520 }, price: 175000 },
    ao_thien_khoi: { name: 'Giáp Thiên Khôi', kind: 'armor', slot: 'ao', level: 52, minQ: 3, stats: { def: 52, hp: 650 }, price: 260000 },
    ao_long_mach: { name: 'Giáp Long Mạch', kind: 'armor', slot: 'ao', level: 62, minQ: 3, stats: { def: 62, hp: 800 }, price: 1040000 },
    ao_tinh_van: { name: 'Giáp Tinh Vân', kind: 'armor', slot: 'ao', level: 72, minQ: 3, stats: { def: 72, hp: 950 }, price: 2340000 },
    ao_than_mong: { name: 'Giáp Thần Mộng', kind: 'armor', slot: 'ao', level: 82, minQ: 3, stats: { def: 84, hp: 1100 }, price: 4160000 },
    ao_sang_the: { name: 'Giáp Sáng Thế', kind: 'armor', slot: 'ao', level: 92, minQ: 3, stats: { def: 96, hp: 1250 }, price: 6500000 },
  };

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['ao'] = PART;
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
