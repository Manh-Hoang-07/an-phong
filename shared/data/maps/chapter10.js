/*
 * Bản đồ · Chương 10 – Sáng Thế (cấp 91–100).
 *
 * Mỗi bản đồ: name, theme (bộ vẽ nền), require (id nhiệm vụ mở khoá; bỏ trống = mở sẵn),
 * spawns (chỗ đứng của quái), npcs (ký tự trên bản đồ → id NPC), portals (cổng sang map khác),
 * gate (ký tự cổng ra làng). Toạ độ tính theo ô, xem shared/logic/quests.js.
 */
(function (G) {
  'use strict';

  const PART = {
    sang_the_1: { name: 'Đồng Bằng Khởi Nguyên', theme: 'redgate', require: 'c10q1', home: 'tan_do_7',
      spawns: { a: 'tan_du_sang_the', b: 'ca_ky_uc' },
      npcs: {  },
      portals: { '<': { to: 'than_mong_4', at: ')' }, '>': { to: 'sang_the_2', at: '<', require: 'c10q2' } } },
    sang_the_2: { name: 'Rừng Ánh Sáng', theme: 'redgate', require: 'c10q2', home: 'tan_do_7',
      spawns: { a: 'ca_ky_uc', b: 'thien_than_rong' },
      npcs: { A: 'cua_sang_1', B: 'cua_sang_2', C: 'cua_sang_3' },
      portals: { '<': { to: 'sang_the_1', at: '>' }, '>': { to: 'sang_the_3', at: '<', require: 'c10q3' } } },
    sang_the_3: { name: 'Biển Ký Ức', theme: 'redgate', require: 'c10q3', home: 'tan_do_7',
      spawns: { a: 'thien_than_rong', b: 'ho_vuong_sang_the' },
      npcs: {  },
      portals: { '<': { to: 'sang_the_2', at: '>' }, '>': { to: 'sang_the_4', at: '<', require: 'c10q4' } } },
    sang_the_4: { name: 'Ngai Sáng Thế', theme: 'redgate', require: 'c10q4', home: 'tan_do_7',
      spawns: { a: 'ho_vuong_sang_the', b: 'ban_sao_so_7', c: 'thu_linh_khoi_nguyen', d: 'thien_than_rong', e: 'ca_ky_uc', f: 'tan_du_sang_the' },
      npcs: { W: 'lang_hinh' },
      portals: { '<': { to: 'sang_the_3', at: '>' }, '>': { to: 'sang_the', at: '<', require: 'c10q6' } } },
    sang_the: { name: 'Vùng Sáng Thế', theme: 'redgate', require: 'c10q6', home: 'tan_do_7',
      spawns: { a: 'ban_sao_so_7', b: 'thien_than_rong', c: 'thu_linh_khoi_nguyen', d: 'ca_ky_uc', e: 'tan_du_sang_the', z: 'tru_mong_sang_the' },
      npcs: {  },
      portals: { '<': { to: 'sang_the_4', at: '>' } } },
  };

  (G.MAP_PARTS = G.MAP_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
