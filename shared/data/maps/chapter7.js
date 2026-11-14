/*
 * Bản đồ · Chương 7 – Long Mạch (cấp 61–70).
 *
 * Mỗi bản đồ: name, theme (bộ vẽ nền), require (id nhiệm vụ mở khoá; bỏ trống = mở sẵn),
 * spawns (chỗ đứng của quái), npcs (ký tự trên bản đồ → id NPC), portals (cổng sang map khác),
 * gate (ký tự cổng ra làng). Toạ độ tính theo ô, xem shared/logic/quests.js.
 */
(function (G) {
  'use strict';

  const PART = {
    long_mach_1: { name: 'Cửa Long Mạch', theme: 'redgate', require: 'c7q1', home: 'tan_do_6',
      spawns: { a: 'tan_du_long_mach', b: 'rua_da_mach' },
      npcs: {  },
      portals: { '<': { to: 'tan_do_6', at: '(' }, '>': { to: 'long_mach_2', at: '<', require: 'c7q2' } } },
    long_mach_2: { name: 'Suối Long Cốt', theme: 'redgate', require: 'c7q2', home: 'tan_do_6',
      spawns: { a: 'rua_da_mach', b: 'linh_thuy_mach' },
      npcs: {  },
      portals: { '<': { to: 'long_mach_1', at: '>' }, '>': { to: 'long_mach_3', at: '<', require: 'c7q4' } } },
    long_mach_3: { name: 'Mạch Ngầm Lam', theme: 'redgate', require: 'c7q4', home: 'tan_do_6',
      spawns: { a: 'linh_thuy_mach', b: 'ho_vuong_long_mach' },
      npcs: { A: 'hat_mach_1', B: 'hat_mach_2', C: 'hat_mach_3' },
      gate: '>',
      portals: { '<': { to: 'long_mach_2', at: '>' }, '>': { to: 'long_mach_4', at: '<', require: 'c7q6' }, ')': { to: 'tan_do_7', at: '<', require: 'c7q9' } } },
    long_mach_4: { name: 'Điện Vảy Rồng', theme: 'redgate', require: 'c7q6', home: 'tan_do_6',
      spawns: { a: 'ho_vuong_long_mach', b: 'rong_con_mat_me', c: 'thu_linh_mach_vo', d: 'linh_thuy_mach', e: 'rua_da_mach', f: 'tan_du_long_mach' },
      npcs: {  },
      portals: { '<': { to: 'long_mach_3', at: '>' }, '>': { to: 'long_mach', at: '<', require: 'c7q7' } } },
    long_mach: { name: 'Vùng Long Mạch', theme: 'redgate', require: 'c7q7', home: 'tan_do_6',
      spawns: { a: 'rong_con_mat_me', b: 'linh_thuy_mach', c: 'thu_linh_mach_vo', d: 'rua_da_mach', e: 'tan_du_long_mach', z: 'tru_mong_long_mach' },
      npcs: {  },
      portals: { '<': { to: 'long_mach_4', at: '>' } } },
    tan_do_7: { name: 'Tân Đô VII – Tinh Hà', theme: 'redgate', require: 'c7q9', village: { cap: 100, n: 7 }, home: 'tan_do_7',
      spawns: {  },
      npcs: { X: 'minh_triet', N: 'bang_nv_7', R: 'tho_ren_7', B: 'ba_thuoc_7', G: 'tap_hoa_7', K: 'thu_kho_7', T: 'tram_7', V: 'vy', Q: 'lam_suong', M: 'lu_khach', C: 'cho_7'},
      gate: ')',
      portals: { '<': { to: 'long_mach_3', at: ')' }, ')': { to: 'tinh_van_1', at: '<' }, '(': { to: 'than_mong_1', at: '<', require: 'c8q9' } } },
  };

  (G.MAP_PARTS = G.MAP_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
