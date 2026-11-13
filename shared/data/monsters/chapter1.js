/*
 * Quái Chương 1 – Cổng Đỏ (cấp 1–10).
 *
 * drops: [itemId, tỉ lệ 0..1, (tùy chọn) chỉ rơi khi đang làm nhiệm vụ]
 * gear:  [tỉ lệ rơi 1 món trang bị, [danh sách món có thể rơi]]
 */
(function (G) {
  'use strict';

  const PART = {
    bong_do: { name: 'Mắt Đỏ', level: 1, hp: 130, atk: 17, def: 4, exp: 4, gold: [1, 3],
      speed: 45, respawn: 5, look: 'shade', drops: [] },
    hinh_nhan: { name: 'Hình nhân', level: 1, hp: 30, atk: 0, def: 0, exp: 4, gold: [0, 0],
      speed: 0, passive: true, respawn: 2, look: 'dummy', drops: [] },
    nam_doc: { name: 'Nấm Độc', level: 2, hp: 185, atk: 31, def: 5, exp: 12, gold: [2, 6],
      speed: 35, respawn: 6, look: 'mushroom',
      drops: [['binh_mau_nho', 0.12], ['hang_that_lac', 0.3, null, 'p2']],
      gear: [0.04, ['mu_da', 'gang_da', 'dai_da', 'quan_da', 'giay_da', 'ao_da']] },
    chuot_cong_do: { name: 'Chuột Cống Đỏ', level: 4, hp: 270, atk: 52, def: 7, exp: 33, gold: [4, 10],
      speed: 85, respawn: 7, look: 'shade', sprite: 'ff_rat', tint: 0xd8786a,
      drops: [['manh_vai_den', 0.5, 'q5'], ['binh_mau_nho', 0.14], ['da_cuong_hoa', 0.02]],
      gear: [0.05, ['ao_da', 'quan_da', 'giay_da', 'mu_da', 'gang_da', 'dai_da']] },
    soi_tre: { name: 'Yêu Tinh', level: 4, hp: 295, atk: 58, def: 8, exp: 39, gold: [5, 12],
      speed: 80, respawn: 8, look: 'wolf',
      drops: [['binh_mau_nho', 0.15], ['da_cuong_hoa', 0.02],
        ['the_bai_minh', 0.4, null, 'p1-1'], ['hang_that_lac', 0.25, null, 'p2']],
      gear: [0.05, ['ao_da', 'quan_da', 'giay_da', 'mu_da', 'gang_da', 'dai_da', 'nhan_bac', 'day_chuyen_bac', 'ngoc_boi_luc']] },
    ech_suong: { name: 'Slime Sương', level: 6, hp: 410, atk: 85, def: 12, exp: 75, gold: [8, 16],
      speed: 60, respawn: 8, look: 'frog', sprite: 'ff_slime', jumper: true,
      drops: [['binh_nl_nho', 0.15], ['da_cuong_hoa', 0.05]],
      gear: [0.05, ['mu_da', 'gang_da', 'dai_da', 'ao_da', 'nhan_bac', 'day_chuyen_bac', 'ngoc_boi_luc']] },
    doi_hang: { name: 'Dơi Hang', level: 7, hp: 465, atk: 99, def: 13, exp: 96, gold: [10, 20],
      speed: 90, respawn: 8, look: 'bat', sprite: 'ff_bat', fly: true,
      drops: [['binh_mau_vua', 0.08], ['da_cuong_hoa', 0.06]],
      gear: [0.05, ['ao_da', 'quan_da', 'giay_da', 'mu_da', 'gang_da', 'dai_da', 'nhan_bac', 'day_chuyen_bac', 'ngoc_boi_luc']] },
    nhen_da: { name: 'Bộ Xương Pha Lê', level: 9, hp: 575, atk: 125, def: 16, exp: 142, gold: [15, 30],
      speed: 70, respawn: 10, look: 'spider', sprite: 'ff_skeleton',
      drops: [['tinh_the_xanh', 0.5, 'q8'], ['binh_nl_vua', 0.08], ['da_cuong_hoa', 0.1], ['doan_kiem_ga', 0.45, null, 'p1-2']],
      gear: [0.06, ['ao_da', 'quan_da', 'giay_da', 'gang_da', 'nhan_bac', 'day_chuyen_bac', 'kiem_sat', 'cung_go', 'truong_go']] },
    thach_quy: { name: 'Thạch Vương', level: 12, hp: 745, atk: 285, def: 32, exp: 220, gold: [300, 500],
      speed: 55, respawn: 300, look: 'troll', sprite: 'rock_golem', tint: 0xd6cfc4, boss: true, style: 'slam', resist: 0.25,
      drops: [['da_cuong_hoa', 1], ['da_cuong_hoa', 0.6], ['da_cuong_hoa', 0.3]],
      // Trùm chắc chắn rơi 1 món (hiếm hoặc huyền thoại), 35% rơi thêm món thứ hai
      gear: [1, ['kiem_thach_quy', 'cung_thach_vuong', 'truong_thach_vuong', 'ao_giap_da', 'mu_thach_quy', 'gang_thach_quy', 'dai_thach_quy', 'quan_thach_quy', 'giay_thach_quy', 'nhan_thach_quy', 'day_chuyen_thach_quy', 'ngoc_boi_thach_quy'], 0.35] },
  };

  (G.MONSTER_PARTS = G.MONSTER_PARTS || {})[1] = PART;
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
