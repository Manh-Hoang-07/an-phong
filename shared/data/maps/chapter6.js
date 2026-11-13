/*
 * Bản đồ · Chương 6 – Thiên Khôi (cấp 51–60).
 *
 * Mỗi bản đồ: name, theme (bộ vẽ nền), require (id nhiệm vụ mở khoá; bỏ trống = mở sẵn),
 * spawns (chỗ đứng của quái), npcs (ký tự trên bản đồ → id NPC), portals (cổng sang map khác),
 * gate (ký tự cổng ra làng). Toạ độ tính theo ô, xem shared/logic/quests.js.
 */
(function (G) {
  'use strict';

  const PART = {
    cong_ss: { name: 'Cổng SS – Vực Không Cùng', theme: 'redgate', require: 'c5q6', home: 'tan_do_bt',
      spawns: { a: 'quai_hu_khong', b: 'ky_si_hu_khong', c: 'ma_than_trang_tron', z: 'thuc_the_bkc' },
      npcs: {  },
      portals: { '<': { to: 'tan_do_bt', at: '(' }, '>': { to: 'tan_do_6', at: '<', require: 'c5q9' } } },
    tan_do_6: { name: 'Tân Đô VI – Thiên Đô', theme: 'redgate', require: 'c5q9', village: { cap: 70, n: 6 }, home: 'tan_do_6',
      spawns: {  },
      npcs: { L: 'truong_lang_6', V: 'vy', Q: 'lam_suong', N: 'bang_nv_6', R: 'tho_ren_6', B: 'ba_thuoc_6', G: 'tap_hoa_6', K: 'thu_kho_6', T: 'tram_6' },
      gate: ')',
      portals: { '<': { to: 'cong_ss', at: '>' }, ')': { to: 'thien_khoi_1', at: '<' }, '(': { to: 'long_mach_1', at: '<', require: 'c6q9' } } },
    thien_khoi_1: { name: 'Bãi Thiên Thạch', theme: 'redgate', require: 'c6q1', home: 'tan_do_6',
      spawns: { a: 'tan_du_thien_khoi', b: 'bo_thien_thach' },
      npcs: {  },
      portals: { '<': { to: 'tan_do_6', at: ')' }, '>': { to: 'thien_khoi_2', at: '<', require: 'c6q2' } } },
    thien_khoi_2: { name: 'Đồi Khôi Đỏ', theme: 'redgate', require: 'c6q2', home: 'tan_do_6',
      spawns: { a: 'bo_thien_thach', b: 'soi_lua_khoi' },
      npcs: {  },
      portals: { '<': { to: 'thien_khoi_1', at: '>' }, '>': { to: 'thien_khoi_3', at: '<', require: 'c6q4' } } },
    thien_khoi_3: { name: 'Mỏ Lửa Cổ', theme: 'redgate', require: 'c6q4', home: 'tan_do_6',
      spawns: { a: 'soi_lua_khoi', b: 'ho_vuong_thien_khoi' },
      npcs: {  },
      portals: { '<': { to: 'thien_khoi_2', at: '>' }, '>': { to: 'thien_khoi_4', at: '<', require: 'c6q6' } } },
    thien_khoi_4: { name: 'Thành Khôi Sụp', theme: 'redgate', require: 'c6q6', home: 'tan_do_6',
      spawns: { a: 'ho_vuong_thien_khoi', b: 'tho_mo_chay', c: 'thu_linh_khoi_tan', d: 'soi_lua_khoi', e: 'bo_thien_thach', f: 'tan_du_thien_khoi' },
      npcs: {  },
      portals: { '<': { to: 'thien_khoi_3', at: '>' }, '>': { to: 'thien_khoi', at: '<', require: 'c6q7' } } },
    thien_khoi: { name: 'Vùng Thiên Khôi', theme: 'redgate', require: 'c6q7', home: 'tan_do_6',
      spawns: { a: 'tho_mo_chay', b: 'soi_lua_khoi', c: 'thu_linh_khoi_tan', d: 'bo_thien_thach', e: 'tan_du_thien_khoi', z: 'tru_mong_thien_khoi' },
      npcs: {  },
      portals: { '<': { to: 'thien_khoi_4', at: '>' } } },
  };

  (G.MAP_PARTS = G.MAP_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
