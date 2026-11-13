/*
 * Bản đồ · Chương 8 – Tinh Vân (cấp 71–80).
 *
 * Mỗi bản đồ: name, theme (bộ vẽ nền), require (id nhiệm vụ mở khoá; bỏ trống = mở sẵn),
 * spawns (chỗ đứng của quái), npcs (ký tự trên bản đồ → id NPC), portals (cổng sang map khác),
 * gate (ký tự cổng ra làng). Toạ độ tính theo ô, xem shared/logic/quests.js.
 */
(function (G) {
  'use strict';

  const PART = {
    tinh_van_1: { name: 'Bến Sao Rơi', theme: 'redgate', require: 'c8q1', home: 'tan_do_7',
      spawns: { a: 'tan_du_tinh_van', b: 'nhen_tinh_van' },
      npcs: {  },
      portals: { '<': { to: 'tan_do_7', at: ')' }, '>': { to: 'tinh_van_2', at: '<', require: 'c8q2' } } },
    tinh_van_2: { name: 'Dải Tinh Vân Tím', theme: 'redgate', require: 'c8q2', home: 'tan_do_7',
      spawns: { a: 'nhen_tinh_van', b: 'tho_quan_trac_meo' },
      npcs: {  },
      portals: { '<': { to: 'tinh_van_1', at: '>' }, '>': { to: 'tinh_van_3', at: '<', require: 'c8q4' } } },
    tinh_van_3: { name: 'Trạm Quan Trắc Hỏng', theme: 'redgate', require: 'c8q4', home: 'tan_do_7',
      spawns: { a: 'tho_quan_trac_meo', b: 'ho_vuong_tinh_van' },
      npcs: { A: 'tro_ly_1', B: 'tro_ly_2', C: 'tro_ly_3', D: 'tro_ly_4' },
      portals: { '<': { to: 'tinh_van_2', at: '>' }, '>': { to: 'tinh_van_4', at: '<', require: 'c8q6' } } },
    tinh_van_4: { name: 'Vành Đai Thiên Thạch', theme: 'redgate', require: 'c8q6', home: 'tan_do_7',
      spawns: { a: 'ho_vuong_tinh_van', b: 'may_do_dien', c: 'thu_linh_vanh_dai', d: 'tho_quan_trac_meo', e: 'nhen_tinh_van', f: 'tan_du_tinh_van' },
      npcs: {  },
      portals: { '<': { to: 'tinh_van_3', at: '>' }, '>': { to: 'tinh_van', at: '<', require: 'c8q7' } } },
    tinh_van: { name: 'Vùng Tinh Vân', theme: 'redgate', require: 'c8q7', home: 'tan_do_7',
      spawns: { a: 'may_do_dien', b: 'tho_quan_trac_meo', c: 'thu_linh_vanh_dai', d: 'nhen_tinh_van', e: 'tan_du_tinh_van', z: 'tru_mong_tinh_van' },
      npcs: {  },
      portals: { '<': { to: 'tinh_van_4', at: '>' } } },
  };

  (G.MAP_PARTS = G.MAP_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
