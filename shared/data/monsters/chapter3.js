/*
 * Quái Chương 3 – Lò Rèn Cổ (cấp 21–30).
 *
 * drops: [itemId, tỉ lệ 0..1, (tùy chọn) chỉ rơi khi đang làm nhiệm vụ]
 * gear:  [tỉ lệ rơi 1 món trang bị, [danh sách món có thể rơi]]
 */
(function (G) {
  'use strict';

  const PART = {
    soi_tuyet: { name: 'Sói Tuyết', level: 21, hp: 1270, atk: 300, def: 36, exp: 498, gold: [20, 45],
      speed: 85, respawn: 7, look: 'wolf', sprite: 'ff_wolf',
      drops: [['binh_mau_lon', 0.12], ['da_cuong_hoa_trung', 0.05], ['bang_tinh', 0.4, 'c3q3']],
      gear: [0.05, ['mu_bang_long', 'gang_bang_long', 'dai_bang_long', 'ao_bang_long', 'nhan_bang_long', 'day_chuyen_bang_long', 'ngoc_boi_bang_long']] },
    quai_rac_td: { name: 'Quái Rác Tân Đô', level: 22, hp: 1340, atk: 320, def: 37, exp: 532, gold: [18, 40],
      speed: 50, respawn: 7, look: 'shade', sprite: 'ff_rat',
      drops: [['da_cuong_hoa', 0.08], ['da_cuong_hoa_trung', 0.03]],
      gear: [0.04, ['ao_bang_long', 'quan_bang_long', 'giay_bang_long', 'mu_bang_long', 'gang_bang_long', 'dai_bang_long']] },
    nguoi_tuyet: { name: 'Người Tuyết', level: 23, hp: 1410, atk: 340, def: 39, exp: 566, gold: [25, 55],
      speed: 45, respawn: 8, look: 'troll', sprite: 'ice_beast',
      drops: [['than_co', 0.4, 'c3q4'], ['binh_mau_lon', 0.1], ['da_cuong_hoa_trung', 0.06]],
      gear: [0.05, ['mu_bang_long', 'ao_bang_long', 'gang_bang_long', 'dai_bang_long', 'quan_bang_long', 'giay_bang_long', 'nhan_bang_long', 'day_chuyen_bang_long', 'ngoc_boi_bang_long']] },
    yeu_tinh_bang: { name: 'Yêu Tinh Băng', level: 25, hp: 1550, atk: 380, def: 42, exp: 635, gold: [30, 65],
      speed: 70, respawn: 8, look: 'wolf', sprite: 'ff_kobold',
      drops: [['bang_tinh', 0.3, 'c3q3'], ['binh_nl_lon', 0.12], ['da_cuong_hoa_trung', 0.08]],
      gear: [0.05, ['ao_bang_long', 'quan_bang_long', 'giay_bang_long', 'mu_bang_long', 'gang_bang_long', 'dai_bang_long', 'nhan_bang_long', 'day_chuyen_bang_long', 'ngoc_boi_bang_long']] },
    soi_dau_do: { name: 'Sói Đầu Đàn Băng Giá · Thủ Lĩnh', level: 26, hp: 1620, atk: 560, def: 57, exp: 669, gold: [40, 80],
      speed: 95, respawn: 90, look: 'wolf', sprite: 'skull_wolf', leader: true,
      drops: [['binh_mau_dac', 0.12], ['da_cuong_hoa_cao', 0.08]],
      gear: [0.07, ['kiem_bang_long', 'cung_bang_long', 'truong_bang_long', 'ao_bang_long', 'mu_bang_long', 'gang_bang_long', 'dai_bang_long', 'quan_bang_long', 'giay_bang_long', 'nhan_bang_long', 'day_chuyen_bang_long', 'ngoc_boi_bang_long']] },
    dai_thach_nhan: { name: 'Quỷ Búa Băng', level: 28, hp: 1760, atk: 530, def: 56, exp: 740, gold: [50, 100],
      speed: 40, respawn: 30, look: 'troll', sprite: 'ff_troll', elite: true,
      drops: [['binh_mau_dac', 0.15], ['da_cuong_hoa_cao', 0.1]],
      gear: [0.07, ['kiem_bang_long', 'cung_bang_long', 'truong_bang_long', 'ao_bang_long', 'mu_bang_long', 'gang_bang_long', 'dai_bang_long', 'quan_bang_long', 'giay_bang_long', 'nhan_bang_long', 'day_chuyen_bang_long', 'ngoc_boi_bang_long']] },
    lam_suong_2: { name: 'Lam Sương (Lần 2)', level: 25, hp: 1550, atk: 645, def: 63, exp: 635, gold: [400, 700],
      speed: 105, respawn: 300, look: 'shade', sprite: 'samurai', boss: true, style: 'shadow', minion: 'sat_thu_bong_toi',
      drops: [['da_cuong_hoa_cao', 1], ['da_cuong_hoa_trung', 0.5], ['manh_loi_do_co_dai', 1, 'c3q7']],
      gear: [1, ['thuong_bang_suong', 'ao_bang_long', 'mu_bang_long', 'gang_bang_long', 'dai_bang_long', 'quan_bang_long', 'giay_bang_long', 'nhan_bang_long', 'day_chuyen_bang_long', 'ngoc_boi_bang_long'], 0.35] },
    bang_long: { name: 'Băng Long', level: 28, hp: 1760, atk: 750, def: 70, exp: 740, gold: [1000, 1500],
      speed: 50, respawn: 300, look: 'dragon', tint: 0xb8e4ff, boss: true, style: 'ice', minion: 'yeu_tinh_bang',
      drops: [['da_cuong_hoa_cao', 1], ['da_cuong_hoa_cao', 0.6], ['trai_tim_bang_long', 1, 'c3q5']],
      gear: [1, ['kiem_bang_long', 'cung_bang_long', 'truong_bang_long', 'thuong_bang_suong', 'ao_bang_long', 'mu_bang_long', 'gang_bang_long', 'dai_bang_long', 'quan_bang_long', 'giay_bang_long', 'nhan_bang_long', 'day_chuyen_bang_long', 'ngoc_boi_bang_long'], 0.35] },
  };

  (G.MONSTER_PARTS = G.MONSTER_PARTS || {})[3] = PART;
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
