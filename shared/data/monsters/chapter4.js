/*
 * Quái Chương 4 – Tầng Trời Thứ Bảy (cấp 31–40).
 *
 * drops: [itemId, tỉ lệ 0..1, (tùy chọn) chỉ rơi khi đang làm nhiệm vụ]
 * gear:  [tỉ lệ rơi 1 món trang bị, [danh sách món có thể rơi]]
 */
(function (G) {
  'use strict';

  const PART = {
    ho_ve_may: { name: 'Hộ Vệ Mây Đá', level: 31, hp: 1965, atk: 510, def: 52, exp: 847, gold: [30, 70],
      speed: 55, respawn: 8, look: 'troll', sprite: 'rock_golem', tint: 0xb4c6e0,
      drops: [['binh_mau_dac', 0.12], ['da_cuong_hoa_cao', 0.05], ['manh_luu_tru', 0.35, 'c4q4']],
      gear: [0.05, ['mu_luu_tru', 'gang_luu_tru', 'dai_luu_tru', 'ao_luu_tru', 'nhan_luu_tru', 'day_chuyen_luu_tru', 'ngoc_boi_luu_tru']] },
    bo_canh_cung: { name: 'Cua Giáp', level: 33, hp: 2095, atk: 565, def: 55, exp: 919, gold: [35, 75],
      speed: 80, respawn: 8, look: 'spider', sprite: 'ff_crab', jumper: true,
      drops: [['binh_mau_dac', 0.12], ['da_cuong_hoa_cao', 0.06], ['nhat_ky_nguoi_choi', 0.08]],
      gear: [0.05, ['ao_luu_tru', 'quan_luu_tru', 'giay_luu_tru', 'mu_luu_tru', 'gang_luu_tru', 'dai_luu_tru', 'nhan_luu_tru', 'day_chuyen_luu_tru', 'ngoc_boi_luu_tru']] },
    tri_thuc_ma: { name: 'Tri Thức Ma Thần', level: 35, hp: 2225, atk: 625, def: 58, exp: 992, gold: [40, 90],
      speed: 60, respawn: 9, look: 'shade', sprite: 'evil_wizard',
      drops: [['binh_mau_than_thoai', 0.1], ['da_cuong_hoa_cao', 0.08], ['nhat_ky_nguoi_choi', 0.1], ['manh_luu_tru', 0.35, 'c4q4']],
      gear: [0.06, ['ao_luu_tru', 'quan_luu_tru', 'giay_luu_tru', 'mu_luu_tru', 'gang_luu_tru', 'dai_luu_tru', 'nhan_luu_tru', 'day_chuyen_luu_tru', 'ngoc_boi_luu_tru']] },
    linh_hon_ky_uc: { name: 'Linh Hồn Ký Ức', level: 37, hp: 2355, atk: 685, def: 61, exp: 1065, gold: [45, 95],
      speed: 90, respawn: 9, look: 'bat', fly: true,
      drops: [['binh_nl_than_thoai', 0.1], ['da_cuong_hoa_than_thoai', 0.05], ['nhat_ky_nguoi_choi', 0.12], ['manh_luu_tru', 0.35, 'c4q4']],
      gear: [0.06, ['ao_luu_tru', 'quan_luu_tru', 'giay_luu_tru', 'mu_luu_tru', 'gang_luu_tru', 'dai_luu_tru', 'nhan_luu_tru', 'day_chuyen_luu_tru', 'ngoc_boi_luu_tru']] },
    ho_ve_sat_thu: { name: 'Hộ Vệ Sát Thủ Cánh Bạc', level: 35, hp: 2225, atk: 750, def: 70, exp: 992, gold: [60, 120],
      speed: 100, respawn: 30, look: 'wolf', sprite: 'swordsman', elite: true,
      drops: [['binh_mau_than_thoai', 0.12], ['da_cuong_hoa_than_thoai', 0.08]],
      gear: [0.07, ['kiem_luu_tru', 'cung_luu_tru', 'truong_luu_tru', 'ao_luu_tru', 'mu_luu_tru', 'gang_luu_tru', 'dai_luu_tru', 'quan_luu_tru', 'giay_luu_tru', 'nhan_luu_tru', 'day_chuyen_luu_tru', 'ngoc_boi_luu_tru']] },
    thu_thu_vo_dien: { name: 'Thủ Thư Vô Diện', level: 38, hp: 2420, atk: 855, def: 75, exp: 1102, gold: [70, 150],
      speed: 70, respawn: 30, look: 'shade', sprite: 'mimic', elite: true,
      drops: [['binh_mau_than_thoai', 0.15], ['da_cuong_hoa_than_thoai', 0.1]],
      gear: [0.07, ['kiem_luu_tru', 'cung_luu_tru', 'truong_luu_tru', 'ao_luu_tru', 'mu_luu_tru', 'gang_luu_tru', 'dai_luu_tru', 'quan_luu_tru', 'giay_luu_tru', 'nhan_luu_tru', 'day_chuyen_luu_tru', 'ngoc_boi_luu_tru']] },
    nguoi_gac_luu_tru: { name: 'Người Gác Lưu Trữ', level: 38, hp: 2420, atk: 1210, def: 94, exp: 1102, gold: [2000, 3000],
      speed: 65, respawn: 300, look: 'reaper', sprite: 'skeleton_knight', boss: true, style: 'copy', minion: 'ho_ve_sat_thu',
      drops: [['da_cuong_hoa_than_thoai', 1], ['da_cuong_hoa_than_thoai', 0.6]],
      gear: [1, ['kiem_luu_tru', 'cung_luu_tru', 'truong_luu_tru', 'vuong_mien_tri_thuc', 'ao_luu_tru', 'mu_luu_tru', 'gang_luu_tru', 'dai_luu_tru', 'quan_luu_tru', 'giay_luu_tru', 'nhan_luu_tru', 'day_chuyen_luu_tru', 'ngoc_boi_luu_tru'], 0.35] },
  };

  (G.MONSTER_PARTS = G.MONSTER_PARTS || {})[4] = PART;
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
