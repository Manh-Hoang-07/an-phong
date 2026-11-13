/*
 * Bản đồ · Chương 9 – Thần Mộng (cấp 81–90).
 *
 * Mỗi bản đồ: name, theme (bộ vẽ nền), require (id nhiệm vụ mở khoá; bỏ trống = mở sẵn),
 * spawns (chỗ đứng của quái), npcs (ký tự trên bản đồ → id NPC), portals (cổng sang map khác),
 * gate (ký tự cổng ra làng). Toạ độ tính theo ô, xem shared/logic/quests.js.
 */
(function (G) {
  'use strict';

  const PART = {
    than_mong_1: { name: 'Cổng Mộng', theme: 'redgate', require: 'c9q1', home: 'tan_do_7',
      spawns: { a: 'tan_du_than_mong', b: 'bong_guong' },
      npcs: {  },
      portals: { '<': { to: 'tan_do_7', at: ')' }, '>': { to: 'than_mong_2', at: '<', require: 'c9q2' } } },
    than_mong_2: { name: 'Vườn Hoa Ảo', theme: 'redgate', require: 'c9q2', home: 'tan_do_7',
      spawns: { a: 'bong_guong', b: 'hoa_ao_an_thit' },
      npcs: {  },
      portals: { '<': { to: 'than_mong_1', at: '>' }, '>': { to: 'than_mong_3', at: '<', require: 'c9q4' } } },
    than_mong_3: { name: 'Mê Cung Gương', theme: 'redgate', require: 'c9q4', home: 'tan_do_7',
      spawns: { a: 'hoa_ao_an_thit', b: 'ho_vuong_than_mong' },
      npcs: {  },
      portals: { '<': { to: 'than_mong_2', at: '>' }, '>': { to: 'than_mong_4', at: '<', require: 'c9q6' } } },
    than_mong_4: { name: 'Tháp Mộng Đảo', theme: 'redgate', require: 'c9q6', home: 'tan_do_7',
      spawns: { a: 'ho_vuong_than_mong', b: 'quan_gia_giac_mo', c: 'thu_linh_me_cung', d: 'hoa_ao_an_thit', e: 'bong_guong', f: 'tan_du_than_mong' },
      npcs: {  },
      gate: '>',
      portals: { '<': { to: 'than_mong_3', at: '>' }, '>': { to: 'than_mong', at: '<', require: 'c9q7' }, ')': { to: 'sang_the_1', at: '<', require: 'c9q9' } } },
    than_mong: { name: 'Vùng Thần Mộng', theme: 'redgate', require: 'c9q7', home: 'tan_do_7',
      spawns: { a: 'quan_gia_giac_mo', b: 'hoa_ao_an_thit', c: 'thu_linh_me_cung', d: 'bong_guong', e: 'tan_du_than_mong', z: 'tru_mong_than_mong' },
      npcs: {  },
      portals: { '<': { to: 'than_mong_4', at: '>' } } },
  };

  (G.MAP_PARTS = G.MAP_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
