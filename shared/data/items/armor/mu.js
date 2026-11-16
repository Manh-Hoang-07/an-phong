/*
 * Trang bị ô mu.
 */
(function (G) {
  'use strict';

  const PART = {
    mu_da: { name: 'Mũ da sói', kind: 'armor', slot: 'mu', level: 5, stats: { def: 4, hp: 32 }, price: 189 },
    // ===== Bộ II – Thạch Vương (cấp 11–20): đồ chế từ đá pha lê trong Cổng hạng D
    mu_thach_quy: { name: 'Mũ Thạch Vương', kind: 'armor', slot: 'mu', level: 15, minQ: 3, stats: { def: 9, hp: 90, mp: 20 }, price: 651 },
    mu_bang_long: { name: 'Mũ Băng Long', kind: 'armor', slot: 'mu', level: 25, minQ: 3, stats: { def: 14, hp: 150, mp: 30 }, price: 1320 },
    mu_luu_tru: { name: 'Mũ Lưu Trữ', kind: 'armor', slot: 'mu', level: 35, minQ: 3, stats: { def: 20, hp: 230, mp: 45 }, price: 2960 },
    mu_vinh_hang: { name: 'Mũ Vĩnh Hằng', kind: 'armor', slot: 'mu', level: 45, minQ: 3, stats: { def: 28, hp: 340, mp: 65 }, price: 13300 },
    mu_thien_khoi: { name: 'Mũ Thiên Khôi', kind: 'armor', slot: 'mu', level: 55, minQ: 3, stats: { def: 35, hp: 433, mp: 144 }, price: 36400 },
    mu_long_mach: { name: 'Mũ Long Mạch', kind: 'armor', slot: 'mu', level: 65, minQ: 3, stats: { def: 41, hp: 533, mp: 167 }, price: 43000 },
    mu_tinh_van: { name: 'Mũ Tinh Vân', kind: 'armor', slot: 'mu', level: 75, minQ: 3, stats: { def: 48, hp: 633, mp: 192 }, price: 49600 },
    mu_than_mong: { name: 'Mũ Thần Mộng', kind: 'armor', slot: 'mu', level: 85, minQ: 3, stats: { def: 56, hp: 733, mp: 218 }, price: 56300 },
    mu_sang_the: { name: 'Mũ Sáng Thế', kind: 'armor', slot: 'mu', level: 95, minQ: 3, stats: { def: 64, hp: 833, mp: 244 }, price: 62900 },
    vuong_mien_tri_thuc: { name: 'Vương Miện Tri Thức', kind: 'armor', slot: 'mu', level: 36, minQ: 4, stats: { def: 25, hp: 300, mp: 150, cdr: 15 }, price: 80000,
      grantsSkill: 'tk4',
      desc: 'Giảm 15% hồi chiêu toàn bộ kỹ năng. Đội mũ là dùng được Giáp Sắt của Tanker (ô kỹ năng F).' },
  };

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['mu'] = PART;
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
