/*
 * Bản đồ · Chương 2 – Bóng Trăng Khuyết (cấp 11–20) · Tân Đô II – Hải Cảng.
 *
 * Mỗi bản đồ: name, theme (bộ vẽ nền), require (id nhiệm vụ mở khoá; bỏ trống = mở sẵn),
 * spawns (chỗ đứng của quái), npcs (ký tự trên bản đồ → id NPC), portals (cổng sang map khác),
 * gate (ký tự cổng ra làng). Toạ độ tính theo ô, xem shared/logic/quests.js.
 */
(function (G) {
  'use strict';

  const PART = {
    b_en_pha: { name: 'Bến Phà Hoang', theme: 'forest', require: 'q10', home: 'lang',
      spawns: { a: 'th_luoi_dam' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'rung', at: '>' }, '>': { to: 'd_lay_muc', at: '<', require: 'c2q1' } } },
    d_lay_muc: { name: 'Đầm Lầy Mục', theme: 'forest', require: 'c2q1', home: 'tan_do_2',
      spawns: { a: 'th_luoi_dam', b: 'ech_doc_kl' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'b_en_pha', at: '>' }, '>': { to: 'tan_do_2', at: '<', require: 'c2q2' } } },
    tan_do_2: { name: 'Tân Đô II – Hải Cảng', theme: 'forest', require: 'c2q2', village: { cap: 20, n: 2 }, home: 'tan_do_2',
      spawns: {  },
      npcs: { Y: 'ha_phong', V: 'vy', N: 'bang_nv_2', R: 'tho_ren_2', B: 'ba_thuoc_2', G: 'tap_hoa_2', K: 'thu_kho_2', T: 'tram_2' },
      gate: ')',
      portals: { '<': { to: 'd_lay_muc', at: '>' }, ')': { to: 'lang_chai', at: '<' }, '(': { to: 'tp_chim_t', at: '<', require: 'c2q7' }, ']': { to: 'chan_nui', at: '<', require: 'c2q12' } } },
    lang_chai: { name: 'Làng Chài Vùng Ven', theme: 'forest', require: 'c2q2', home: 'tan_do_2',
      spawns: { a: 'linh_giao_hn', b: 'sat_thu_bong_toi', c: 'linh_thuy_co', d: 'nhen_cong_ngam', e: 'ech_doc_kl' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'tan_do_2', at: ')' }, '>': { to: 'cc_hac_nguyet', at: '<', require: 'c2q4' } } },
    cc_hac_nguyet: { name: 'Căn Cứ Tiền Tiêu Hắc Nguyệt', theme: 'cave', require: 'c2q4', home: 'tan_do_2',
      spawns: { a: 'linh_giao_hn', b: 'sat_thu_bong_toi', c: 'linh_thuy_co', d: 'nhen_cong_ngam', e: 'ech_doc_kl', z: 'lam_suong' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'lang_chai', at: '>' } } },
    tp_chim_t: { name: 'Thành Phố Chìm – Tầng Thượng', theme: 'cave', require: 'c2q7', home: 'tan_do_2',
      spawns: { a: 'linh_thuy_co' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'tan_do_2', at: '(' }, '>': { to: 'tp_chim_c', at: '<', require: 'c2q8' } } },
    tp_chim_c: { name: 'Thành Phố Chìm – Cống Ngầm', theme: 'cave', require: 'c2q8', home: 'tan_do_2',
      spawns: { a: 'linh_thuy_co', b: 'nhen_cong_ngam', z: 'thuy_xa_vuong' },
      npcs: { V: 'vy', A: 'tho_san_1', B: 'tho_san_2', C: 'tho_san_3', D: 'tho_san_4', E: 'tho_san_5' },
      portals: { '<': { to: 'tp_chim_t', at: '>' } } },
  };

  (G.MAP_PARTS = G.MAP_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
