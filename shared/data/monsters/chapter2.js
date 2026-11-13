/*
 * Quái Chương 2 – Bóng Trăng Khuyết (cấp 11–20).
 *
 * drops: [itemId, tỉ lệ 0..1, (tùy chọn) chỉ rơi khi đang làm nhiệm vụ]
 * gear:  [tỉ lệ rơi 1 món trang bị, [danh sách món có thể rơi]]
 */
(function (G) {
  'use strict';

  const PART = {
    th_luoi_dam: { name: 'Thằn Lằn Đầm', level: 11, hp: 685, atk: 155, def: 20, exp: 193, gold: [8, 20],
      speed: 55, respawn: 7, look: 'wolf', sprite: 'ff_sahuagin',
      drops: [['manh_ao_tho_san', 0.5, 'c2q3'], ['binh_mau_vua', 0.1], ['da_cuong_hoa', 0.03],
        ['khan_binh_minh', 0.4, null, 'p1-3'], ['thao_duoc_do', 0.4, null, 'p5-1'], ['chia_khoa_kho', 0.3, null, 'p3']],
      gear: [0.04, ['mu_thach_quy', 'gang_thach_quy', 'dai_thach_quy', 'ao_giap_da', 'nhan_thach_quy', 'day_chuyen_thach_quy', 'ngoc_boi_thach_quy']] },
    ech_doc_kl: { name: 'Ếch Độc Khổng Lồ', level: 13, hp: 800, atk: 180, def: 23, exp: 248, gold: [12, 28],
      speed: 50, respawn: 8, look: 'frog', sprite: 'frog_boss', jumper: true,
      drops: [['manh_ao_tho_san', 0.4, 'c2q3'], ['binh_mau_vua', 0.12], ['da_cuong_hoa', 0.05], ['binh_nl_vua', 0.1],
        ['khan_binh_minh', 0.4, null, 'p1-3'], ['thao_duoc_do', 0.45, null, 'p5-1'], ['chia_khoa_kho', 0.3, null, 'p3']],
      gear: [0.05, ['ao_giap_da', 'quan_thach_quy', 'giay_thach_quy', 'mu_thach_quy', 'gang_thach_quy', 'dai_thach_quy', 'nhan_thach_quy', 'day_chuyen_thach_quy', 'ngoc_boi_thach_quy']] },
    linh_thuy_co: { name: 'Lính Thủy Cổ', level: 15, hp: 915, atk: 210, def: 26, exp: 307, gold: [15, 35],
      speed: 60, respawn: 8, look: 'shade', sprite: 'warrior',
      drops: [['binh_mau_vua', 0.12], ['da_cuong_hoa', 0.06], ['da_cuong_hoa_trung', 0.02],
        ['chia_khoa_kho', 0.25, null, 'p3'], ['hang_that_lac', 0.2, null, 'p2']],
      gear: [0.05, ['ao_giap_da', 'mu_thach_quy', 'gang_thach_quy', 'dai_thach_quy', 'quan_thach_quy', 'giay_thach_quy', 'nhan_thach_quy', 'day_chuyen_thach_quy', 'ngoc_boi_thach_quy']] },
    nhen_cong_ngam: { name: 'Nhện Cống Ngầm', level: 16, hp: 970, atk: 225, def: 28, exp: 338, gold: [18, 38],
      speed: 75, respawn: 8, look: 'spider', sprite: 'spider',
      drops: [['chia_khoa_long_giam', 0.45, 'c2q9'], ['binh_nl_vua', 0.1], ['da_cuong_hoa', 0.06], ['doc_to_dac', 0.45, null, 'p5-2']],
      gear: [0.05, ['ao_giap_da', 'quan_thach_quy', 'giay_thach_quy', 'mu_thach_quy', 'gang_thach_quy', 'dai_thach_quy', 'nhan_thach_quy', 'day_chuyen_thach_quy', 'ngoc_boi_thach_quy']] },
    linh_giao_hn: { name: 'Lính Giáo Hắc Nguyệt', level: 14, hp: 860, atk: 235, def: 29, exp: 278, gold: [25, 50],
      speed: 65, respawn: 30, look: 'shade', sprite: 'spearman', elite: true,
      drops: [['manh_ao_tho_san', 0.35, 'c2q3'], ['binh_mau_vua', 0.15], ['da_cuong_hoa_trung', 0.08]],
      gear: [0.06, ['ao_giap_da', 'mu_thach_quy', 'gang_thach_quy', 'dai_thach_quy', 'quan_thach_quy', 'giay_thach_quy', 'nhan_thach_quy', 'day_chuyen_thach_quy', 'ngoc_boi_thach_quy', 'song_dao_lam_suong']] },
    sat_thu_bong_toi: { name: 'Sát Thủ Bóng Tối', level: 17, hp: 1030, atk: 285, def: 35, exp: 369, gold: [30, 60],
      speed: 95, respawn: 30, look: 'shade', sprite: 'ronin', elite: true,
      drops: [['binh_mau_lon', 0.12], ['da_cuong_hoa_trung', 0.1]],
      gear: [0.06, ['ao_giap_da', 'mu_thach_quy', 'gang_thach_quy', 'dai_thach_quy', 'quan_thach_quy', 'giay_thach_quy', 'nhan_thach_quy', 'day_chuyen_thach_quy', 'ngoc_boi_thach_quy', 'song_dao_lam_suong']] },
    lam_suong: { name: 'Lam Sương', level: 15, hp: 915, atk: 355, def: 39, exp: 307, gold: [200, 400],
      speed: 100, respawn: 300, look: 'shade', sprite: 'samurai', boss: true, style: 'blade', fleeAt: 0.3,
      drops: [['da_cuong_hoa_trung', 1], ['da_cuong_hoa', 0.5]],
      gear: [1, ['song_dao_lam_suong', 'ao_giap_da', 'mu_thach_quy', 'gang_thach_quy', 'dai_thach_quy', 'quan_thach_quy', 'giay_thach_quy', 'nhan_thach_quy', 'day_chuyen_thach_quy', 'ngoc_boi_thach_quy'], 0.3] },
    thuy_xa_vuong: { name: 'Thủy Xà Vương', level: 18, hp: 1085, atk: 430, def: 46, exp: 400, gold: [500, 800],
      speed: 60, respawn: 300, look: 'hydra', tint: 0x9fd4ff, boss: true, style: 'water', minion: 'nhen_cong_ngam',
      drops: [['da_cuong_hoa_trung', 1], ['da_cuong_hoa_trung', 0.6]],
      gear: [1, ['song_dao_lam_suong', 'ao_giap_da', 'mu_thach_quy', 'gang_thach_quy', 'dai_thach_quy', 'quan_thach_quy', 'giay_thach_quy', 'nhan_thach_quy', 'day_chuyen_thach_quy', 'ngoc_boi_thach_quy', 'huy_hieu_binh_minh'], 0.35] },
  };

  (G.MONSTER_PARTS = G.MONSTER_PARTS || {})[2] = PART;
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
