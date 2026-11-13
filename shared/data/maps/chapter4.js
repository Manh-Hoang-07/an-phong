/*
 * Bản đồ · Chương 4 – Tầng Trời Thứ Bảy (cấp 31–40) · Tân Đô IV – Phù Đảo.
 *
 * Mỗi bản đồ: name, theme (bộ vẽ nền), require (id nhiệm vụ mở khoá; bỏ trống = mở sẵn),
 * spawns (chỗ đứng của quái), npcs (ký tự trên bản đồ → id NPC), portals (cổng sang map khác),
 * gate (ký tự cổng ra làng). Toạ độ tính theo ô, xem shared/logic/quests.js.
 */
(function (G) {
  'use strict';

  const PART = {
    vac_da: { name: 'Vách Đá Gió Thần', theme: 'city', require: 'c4q1', home: 'tan_do_3',
      spawns: { a: 'ho_ve_may' },
      npcs: { M: 'lu_khach', V: 'vy' },
      portals: { '<': { to: 'tan_do_3', at: '(' }, '>': { to: 'cong_khai_hoan', at: '<' } } },
    cong_khai_hoan: { name: 'Cổng Khải Hoàn Thành Cổ', theme: 'city', require: 'c4q1', home: 'tan_do_4',
      spawns: { a: 'ho_ve_may', b: 'bo_canh_cung' },
      npcs: { V: 'vy', M: 'lu_khach' },
      portals: { '<': { to: 'vac_da', at: '>' }, '>': { to: 'tan_do_4', at: '<', require: 'c4q2' } } },
    tan_do_4: { name: 'Tân Đô IV – Phù Đảo', theme: 'city', require: 'c4q2', village: { cap: 40, n: 4 }, home: 'tan_do_4',
      spawns: {  },
      npcs: { M: 'lu_khach', V: 'vy', N: 'bang_nv_4', R: 'tho_ren_4', B: 'ba_thuoc_4', G: 'tap_hoa_4', K: 'thu_kho_4', T: 'tram_4' },
      gate: ')',
      portals: { '<': { to: 'cong_khai_hoan', at: '>' }, ')': { to: 'quang_truong', at: '<', require: 'c4q2' }, '(': { to: 'thu_vien', at: '<', require: 'c4q3' }, ']': { to: 'tan_do_bt', at: '<', require: 'c4q8' } } },
    quang_truong: { name: 'Quảng Trường Ánh Sáng', theme: 'city', require: 'c4q2', home: 'tan_do_4',
      spawns: { a: 'ho_ve_may', b: 'bo_canh_cung' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'tan_do_4', at: ')' } } },
    thu_vien: { name: 'Thư Viện Hệ Thống – Sảnh Lớn', theme: 'cave', require: 'c4q3', home: 'tan_do_4',
      spawns: { a: 'tri_thuc_ma', b: 'linh_hon_ky_uc' },
      npcs: { M: 'lu_khach' },
      portals: { '<': { to: 'tan_do_4', at: '(' }, '>': { to: 'phong_luu_tru', at: '<' } } },
    phong_luu_tru: { name: 'Phòng Lưu Trữ Cấm', theme: 'cave', require: 'c4q3', home: 'tan_do_4',
      spawns: { a: 'linh_hon_ky_uc', b: 'ho_ve_sat_thu' },
      npcs: { M: 'lu_khach' },
      portals: { '<': { to: 'thu_vien', at: '>' }, '>': { to: 'dinh_thap', at: '<', require: 'c4q5' } } },
    dinh_thap: { name: 'Đỉnh Tháp Lưu Trữ', theme: 'cave', require: 'c4q5', home: 'tan_do_4',
      spawns: { a: 'thu_thu_vo_dien', b: 'linh_hon_ky_uc', c: 'tri_thuc_ma', d: 'bo_canh_cung', z: 'nguoi_gac_luu_tru' },
      npcs: { M: 'lu_khach' },
      portals: { '<': { to: 'phong_luu_tru', at: '>' } } },
  };

  (G.MAP_PARTS = G.MAP_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
