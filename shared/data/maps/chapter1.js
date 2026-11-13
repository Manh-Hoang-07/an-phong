/*
 * Bản đồ · Chương 1 – Cổng Đỏ (cấp 1–10) · Tân Đô I.
 *
 * Mỗi bản đồ: name, theme (bộ vẽ nền), require (id nhiệm vụ mở khoá; bỏ trống = mở sẵn),
 * spawns (chỗ đứng của quái), npcs (ký tự trên bản đồ → id NPC), portals (cổng sang map khác),
 * gate (ký tự cổng ra làng). Toạ độ tính theo ô, xem shared/logic/quests.js.
 */
(function (G) {
  'use strict';

  const PART = {
    cong_do: { name: 'Cổng đỏ chưa phân hạng', theme: 'redgate', home: 'lang',
      spawns: { r: 'bong_do' },
      npcs: { H: 'he_thong' },
      portals: { '>': { to: 'lang', at: 'S', require: 'q0' } } },
    lang: { name: 'Tân Đô – Khu Hiệp Hội', theme: 'city', village: { cap: 10, n: 1 }, home: 'lang',
      spawns: { d: 'hinh_nhan' },
      npcs: { L: 'lao_su', V: 'vy', N: 'bang_nv', R: 'tho_ren', B: 'ba_thuoc', G: 'tap_hoa', K: 'thu_kho', M: 'lu_khach', T: 'tram' },
      gate: '>',
      portals: { '>': { to: 'rung', at: '<' }, ')': { to: 'kho_bac', at: '<', require: 'c3q6' }, '[': { to: 'quan_thuong_mai', at: '<', require: 'c3q5' }, '(': { to: 'ham_ngam', at: '<', require: 'q4' } } },
    ham_ngam: { name: 'Hầm Ngầm Tàu Điện', theme: 'cave', require: 'q4', home: 'lang',
      spawns: { a: 'chuot_cong_do' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'lang', at: '(' } } },
    rung: { name: 'Cổng hạng E – Rừng Sương', theme: 'forest', require: 'q3', home: 'lang',
      spawns: { a: 'nam_doc', b: 'soi_tre', c: 'ech_suong' },
      npcs: { V: 'vy' },
      gate: '>',
      portals: { '<': { to: 'lang', at: '>' }, '>': { to: 'b_en_pha', at: '<', require: 'q10' }, ')': { to: 'hang', at: '<', require: 'q6' } } },
    hang: { name: 'Cổng hạng D – Hang Pha Lê', theme: 'cave', require: 'q6', home: 'lang',
      spawns: { a: 'doi_hang', b: 'nhen_da', z: 'thach_quy' },
      npcs: { V: 'vy' },
      portals: { '<': { to: 'rung', at: ')' } } },
  };

  (G.MAP_PARTS = G.MAP_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
