/*
 * Bản đồ · Chương 5 – Cổng Vĩnh Hằng (cấp 41–50) · Tân Đô V – Bầu Trời Rách.
 *
 * Mỗi bản đồ: name, theme (bộ vẽ nền), require (id nhiệm vụ mở khoá; bỏ trống = mở sẵn),
 * spawns (chỗ đứng của quái), npcs (ký tự trên bản đồ → id NPC), portals (cổng sang map khác),
 * gate (ký tự cổng ra làng). Toạ độ tính theo ô, xem shared/logic/quests.js.
 */
(function (G) {
  'use strict';

  const PART = {
    tan_do_bt: { name: 'Tân Đô V – Bầu Trời Rách', theme: 'redgate', require: 'c4q8', village: { cap: 50, n: 5 }, home: 'tan_do_bt',
      spawns: {  },
      npcs: { L: 'truong_lang_5', V: 'vy', Q: 'lam_suong', N: 'bang_nv_5', R: 'tho_ren_5', B: 'ba_thuoc_5', G: 'tap_hoa_5', K: 'thu_kho_5', T: 'tram_5' },
      gate: ')',
      portals: { '<': { to: 'tan_do_4', at: ']' }, ')': { to: 'cau_dan', at: '<', require: 'c5q1' }, '(': { to: 'cong_ss', at: '<', require: 'c5q6' } } },
    cau_dan: { name: 'Cầu Dẫn Lên Cổng Vĩnh Hằng', theme: 'redgate', require: 'c5q1', home: 'tan_do_bt',
      spawns: { a: 'quai_hu_khong', b: 'quy_trang_den' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'tan_do_bt', at: ')' }, '>': { to: 'sanh_cho', at: '<', require: 'c5q2' } } },
    sanh_cho: { name: 'Sảnh Chờ Không Gian', theme: 'redgate', require: 'c5q2', home: 'tan_do_bt',
      spawns: { a: 'quy_trang_den', b: 'sv_ky_sinh_hk' },
      npcs: { V: 'vy', Q: 'lam_suong', M: 'lu_khach' },
      portals: { '<': { to: 'cau_dan', at: '>' }, '>': { to: 'dinh_cong_vh', at: '<', require: 'c5q3' } } },
    dinh_cong_vh: { name: 'Đỉnh Cổng Vĩnh Hằng', theme: 'redgate', require: 'c5q3', home: 'tan_do_bt',
      spawns: { a: 'ky_si_hu_khong', b: 'sv_ky_sinh_hk', c: 'quy_trang_den', d: 'quai_hu_khong', z: 'kieu_deo_mat_na' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'sanh_cho', at: '>' }, '>': { to: 'tam_diem', at: '<', require: 'c5q4' } } },
    tam_diem: { name: 'Tâm Điểm Dị Giới', theme: 'redgate', require: 'c5q4', home: 'tan_do_bt',
      spawns: { a: 'sv_ky_sinh_hk', b: 'ma_than_trang_tron', z: 'thuc_the_bkc' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'dinh_cong_vh', at: '>' } } },
  };

  (G.MAP_PARTS = G.MAP_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
