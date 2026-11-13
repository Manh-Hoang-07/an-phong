/*
 * Quái Chương 5 – Cổng Vĩnh Hằng (cấp 41–50).
 *
 * drops: [itemId, tỉ lệ 0..1, (tùy chọn) chỉ rơi khi đang làm nhiệm vụ]
 * gear:  [tỉ lệ rơi 1 món trang bị, [danh sách món có thể rơi]]
 */
(function (G) {
  'use strict';

  const PART = {
    quai_hu_khong: { name: 'Quái Hư Không', level: 41, hp: 2665, atk: 815, def: 68, exp: 1213, gold: [50, 100],
      speed: 65, respawn: 8, look: 'shade', sprite: 'tooth_walker',
      drops: [['binh_mau_than_thoai', 0.12], ['da_cuong_hoa_than_thoai', 0.06]],
      gear: [0.05, ['mu_vinh_hang', 'gang_vinh_hang', 'dai_vinh_hang', 'ao_vinh_hang', 'nhan_vinh_hang', 'day_chuyen_vinh_hang', 'ngoc_boi_vinh_hang']] },
    quy_trang_den: { name: 'Quỷ Trăng Đen', level: 43, hp: 2895, atk: 900, def: 71, exp: 1287, gold: [60, 120],
      speed: 80, respawn: 8, look: 'wolf', sprite: 'ff_gnoll', tint: 0x9a8cc0,
      drops: [['binh_mau_than_thoai', 0.12], ['da_cuong_hoa_than_thoai', 0.08]],
      gear: [0.06, ['ao_vinh_hang', 'quan_vinh_hang', 'giay_vinh_hang', 'mu_vinh_hang', 'gang_vinh_hang', 'dai_vinh_hang', 'nhan_vinh_hang', 'day_chuyen_vinh_hang', 'ngoc_boi_vinh_hang']] },
    sv_ky_sinh_hk: { name: 'Ký Sinh Hư Không', level: 45, hp: 3125, atk: 985, def: 74, exp: 1361, gold: [70, 140],
      speed: 90, respawn: 9, look: 'spider', sprite: 'worm',
      drops: [['binh_mau_than_thoai', 0.12], ['da_cuong_hoa_than_thoai', 0.08], ['binh_nl_than_thoai', 0.1]],
      gear: [0.06, ['ao_vinh_hang', 'quan_vinh_hang', 'giay_vinh_hang', 'mu_vinh_hang', 'gang_vinh_hang', 'dai_vinh_hang', 'nhan_vinh_hang', 'day_chuyen_vinh_hang', 'ngoc_boi_vinh_hang']] },
    ky_si_hu_khong: { name: 'Kỵ Sĩ Hư Không', level: 46, hp: 3240, atk: 1235, def: 91, exp: 1398, gold: [100, 200],
      speed: 85, respawn: 30, look: 'shade', sprite: 'hero_knight', elite: true,
      drops: [['binh_mau_than_thoai', 0.15], ['da_cuong_hoa_than_thoai', 0.1]],
      gear: [0.08, ['kiem_vinh_hang', 'cung_vinh_hang', 'truong_vinh_hang', 'ao_vinh_hang', 'mu_vinh_hang', 'gang_vinh_hang', 'dai_vinh_hang', 'quan_vinh_hang', 'giay_vinh_hang', 'nhan_vinh_hang', 'day_chuyen_vinh_hang', 'ngoc_boi_vinh_hang']] },
    ma_than_trang_tron: { name: 'Ma Thần Trăng Tròn · Thủ Lĩnh', level: 48, hp: 3470, atk: 1560, def: 102, exp: 1472, gold: [120, 250],
      speed: 70, respawn: 90, look: 'werewolf', tint: 0xd9c2ff, leader: true,
      drops: [['binh_mau_than_thoai', 0.15], ['da_cuong_hoa_than_thoai', 0.12]],
      gear: [0.08, ['kiem_vinh_hang', 'cung_vinh_hang', 'truong_vinh_hang', 'ao_vinh_hang', 'mu_vinh_hang', 'gang_vinh_hang', 'dai_vinh_hang', 'quan_vinh_hang', 'giay_vinh_hang', 'nhan_vinh_hang', 'day_chuyen_vinh_hang', 'ngoc_boi_vinh_hang']] },
    kieu_deo_mat_na: { name: 'Kẻ Đeo Mặt Nạ Trăng', level: 45, hp: 3125, atk: 1675, def: 111, exp: 1361, gold: [5000, 8000],
      speed: 90, respawn: 300, look: 'shade', sprite: 'witch', boss: true, style: 'moon', minion: 'ky_si_hu_khong',
      drops: [['da_cuong_hoa_than_thoai', 1], ['da_cuong_hoa_than_thoai', 0.6], ['mat_na_trang_khuyet', 1, 'c5q4']],
      gear: [1, ['than_kiem_vinh_hang', 'kiem_vinh_hang', 'cung_vinh_hang', 'truong_vinh_hang', 'ao_vinh_hang', 'mu_vinh_hang', 'gang_vinh_hang', 'dai_vinh_hang', 'quan_vinh_hang', 'giay_vinh_hang', 'nhan_vinh_hang', 'day_chuyen_vinh_hang', 'ngoc_boi_vinh_hang'], 0.35] },
    thuc_the_bkc: { name: 'Thực Thể Bên Kia Cổng', level: 50, hp: 3700, atk: 2400, def: 139, exp: 1546, gold: [10000, 15000],
      speed: 55, respawn: 300, look: 'dragon', sprite: 'void_beast', tint: 0xe0a8ff, boss: true, style: 'void', minion: 'sv_ky_sinh_hk', finalBoss: true,
      drops: [['da_cuong_hoa_than_thoai', 1], ['da_cuong_hoa_than_thoai', 0.6], ['manh_he_thong', 1, 'c5q5']],
      gear: [1, ['than_kiem_vinh_hang', 'kiem_vinh_hang', 'cung_vinh_hang', 'truong_vinh_hang', 'ao_vinh_hang', 'mu_vinh_hang', 'gang_vinh_hang', 'dai_vinh_hang', 'quan_vinh_hang', 'giay_vinh_hang', 'nhan_vinh_hang', 'day_chuyen_vinh_hang', 'ngoc_boi_vinh_hang'], 0.5] },
  };

  (G.MONSTER_PARTS = G.MONSTER_PARTS || {})[5] = PART;
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
