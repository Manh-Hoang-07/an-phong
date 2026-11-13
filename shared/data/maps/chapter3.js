/*
 * Bản đồ · Chương 3 – Lò Rèn Cổ (cấp 21–30) · Tân Đô III – Lò Rèn Băng.
 *
 * Mỗi bản đồ: name, theme (bộ vẽ nền), require (id nhiệm vụ mở khoá; bỏ trống = mở sẵn),
 * spawns (chỗ đứng của quái), npcs (ký tự trên bản đồ → id NPC), portals (cổng sang map khác),
 * gate (ký tự cổng ra làng). Toạ độ tính theo ô, xem shared/logic/quests.js.
 */
(function (G) {
  'use strict';

  const PART = {
    chan_nui: { name: 'Chân Núi Tuyết Lặng', theme: 'forest', require: 'c2q12', home: 'tan_do_2',
      spawns: { a: 'soi_tuyet' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'tan_do_2', at: ']' }, '>': { to: 'tan_do_3', at: '<' } } },
    tan_do_3: { name: 'Tân Đô III – Lò Rèn Băng', theme: 'forest', require: 'c2q12', village: { cap: 30, n: 3 }, home: 'tan_do_3',
      spawns: {  },
      npcs: { M: 'lu_khach', N: 'bang_nv_3', R: 'tho_ren_3', B: 'ba_thuoc_3', G: 'tap_hoa_3', K: 'thu_kho_3', T: 'tram_3' },
      gate: ')',
      portals: { '<': { to: 'chan_nui', at: '>' }, ')': { to: 'hem_nui', at: '<', require: 'c3q2' }, '(': { to: 'vac_da', at: '<', require: 'c4q1' } } },
    hem_nui: { name: 'Hẻm Núi Gió Hú', theme: 'cave', require: 'c3q2', home: 'tan_do_3',
      spawns: { a: 'soi_tuyet', b: 'nguoi_tuyet' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'tan_do_3', at: ')' }, '>': { to: 'lo_ren_bang', at: '<', require: 'c3q3' } } },
    lo_ren_bang: { name: 'Lò Rèn Cổ Dưới Băng', theme: 'cave', require: 'c3q3', home: 'tan_do_3',
      spawns: { a: 'nguoi_tuyet', b: 'yeu_tinh_bang' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'hem_nui', at: '>' }, '>': { to: 'dinh_nui', at: '<', require: 'c3q4' } } },
    dinh_nui: { name: 'Đỉnh Núi Sương Giá', theme: 'cave', require: 'c3q4', home: 'tan_do_3',
      spawns: { a: 'yeu_tinh_bang', b: 'dai_thach_nhan', z: 'bang_long' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'lo_ren_bang', at: '>' } } },
    kho_bac: { name: 'Kho Bạc Ngầm Hiệp Hội', theme: 'cave', require: 'c3q6', home: 'lang',
      spawns: { a: 'sat_thu_bong_toi', b: 'quai_rac_td', c: 'soi_tuyet', d: 'nguoi_tuyet', z: 'lam_suong_2' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'lang', at: ')' } } },
    quan_thuong_mai: { name: 'Tân Đô – Quận Thương Mại', theme: 'city', require: 'c3q5', home: 'lang',
      spawns: { a: 'quai_rac_td' },
      npcs: {},
      portals: { '<': { to: 'lang', at: '[' } } },
  };

  (G.MAP_PARTS = G.MAP_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
