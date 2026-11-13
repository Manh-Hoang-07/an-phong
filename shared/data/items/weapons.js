/*
 * Vũ khí viết tay: kiếm / cung / trượng theo từng bậc, và vũ khí độc nhất.
 */
(function (G) {
  'use strict';

  const PART = {
    // ---- Trang bị. "stats" là chỉ số gốc; đồ rơi từ quái có chỉ số ngẫu nhiên 80–120%,
    //      phẩm chất ngẫu nhiên và dòng phụ. "minQ": phẩm chất thấp nhất khi rơi ra.
    // Trang bị chia bộ theo cấp (xem SETS): mỗi 10 cấp MỘT bộ, mỗi ô trang bị chỉ có một món trong bộ.
    // Mỗi món có cấp sử dụng riêng, trải đều trên 10 cấp: vũ khí +0, áo +1, găng +2, giày +3, mũ +4, quần +5, đai +6, nhẫn +7, dây chuyền +8, ngọc bội +9
    // (cấp đầu bộ: 1, 11, 21, … 91), nên mở dần từng món trong lúc lên cấp. Đồ độc nhất (đồ trùm, thưởng nhiệm vụ) có cấp riêng.
    // ===== Bộ I – Tân Binh (cấp 1–10): đồ da sói (đã gộp bậc vải và thép vào một bộ)
    kiem_go: { name: 'Kiếm luyện tập', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: null, level: 1, stats: { atk: 5 }, price: 30, desc: 'Kiếm tập của thợ săn mới, chưa thuộc class nào.' },
    kiem_sat: { name: 'Kiếm thép', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 1, stats: { atk: 14 }, price: 260 },
    cung_go: { name: 'Cung gỗ sồi', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 1, stats: { atk: 13, crit: 2 }, price: 260 },
    truong_go: { name: 'Trượng gỗ', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 1, stats: { atk: 11, mp: 20 }, price: 260 },
    kiem_thach_quy: { name: 'Kiếm Thạch Vương', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 11, minQ: 3, stats: { atk: 36, def: 4, hp: 50 }, price: 3000 },
    cung_thach_vuong: { name: 'Cung Thạch Vương', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 11, minQ: 3, stats: { atk: 34, crit: 6 }, price: 3000 },
    truong_thach_vuong: { name: 'Trượng Thạch Vương', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 11, minQ: 3, stats: { atk: 29, mp: 70, hp: 80 }, price: 3000 },
    // ===== Bộ III – Băng Long (cấp 21–30): đồ rèn từ lõi Lò Rèn và Trái Tim Băng Long
    kiem_bang_long: { name: 'Kiếm Băng Long', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 21, minQ: 3, stats: { atk: 54, def: 6, hp: 80 }, price: 12000 },
    cung_bang_long: { name: 'Cung Băng Long', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 21, minQ: 3, stats: { atk: 51, crit: 9, hp: 50 }, price: 12000 },
    truong_bang_long: { name: 'Trượng Băng Long', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 21, minQ: 3, stats: { atk: 43, mp: 100, hp: 120 }, price: 12000 },
    // ===== Bộ IV – Lưu Trữ (cấp 31–40): trang bị cổ từ Thư Viện Hệ Thống
    kiem_luu_tru: { name: 'Kiếm Lưu Trữ', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 31, minQ: 3, stats: { atk: 78, def: 9, hp: 120 }, price: 45000 },
    cung_luu_tru: { name: 'Cung Lưu Trữ', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 31, minQ: 3, stats: { atk: 73, crit: 13, hp: 80 }, price: 45000 },
    truong_luu_tru: { name: 'Trượng Lưu Trữ', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 31, minQ: 3, stats: { atk: 62, mp: 140, hp: 170 }, price: 45000 },
    // ===== Bộ V – Vĩnh Hằng (cấp 41–50): trang bị rèn từ Lõi Cổng Vĩnh Hằng
    kiem_vinh_hang: { name: 'Kiếm Vĩnh Hằng', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 41, minQ: 3, stats: { atk: 110, def: 12, hp: 180 }, price: 180000 },
    cung_vinh_hang: { name: 'Cung Vĩnh Hằng', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 41, minQ: 3, stats: { atk: 104, crit: 18, hp: 120 }, price: 180000 },
    truong_vinh_hang: { name: 'Trượng Vĩnh Hằng', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 41, minQ: 3, stats: { atk: 88, mp: 190, hp: 240 }, price: 180000 },
    // ===== Bộ 6 – Thiên Khôi (cấp 51–60)
    kiem_thien_khoi: { name: 'Kiếm Thiên Khôi', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 51, minQ: 3, stats: { atk: 145, def: 9, hp: 217, mp: 144 }, price: 260000 },
    cung_thien_khoi: { name: 'Cung Thiên Khôi', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 51, minQ: 3, stats: { atk: 138, hp: 217, mp: 144, crit: 20 }, price: 260000 },
    truong_thien_khoi: { name: 'Trượng Thiên Khôi', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 51, minQ: 3, stats: { atk: 116, def: 9, hp: 217, mp: 216 }, price: 260000 },
    // ===== Bộ 7 – Long Mạch (cấp 61–70)
    kiem_long_mach: { name: 'Kiếm Long Mạch', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 61, minQ: 3, stats: { atk: 165, def: 10, hp: 267, mp: 177 }, price: 1040000 },
    cung_long_mach: { name: 'Cung Long Mạch', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 61, minQ: 3, stats: { atk: 157, hp: 267, mp: 177, crit: 22 }, price: 1040000 },
    truong_long_mach: { name: 'Trượng Long Mạch', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 61, minQ: 3, stats: { atk: 132, def: 10, hp: 267, mp: 266 }, price: 1040000 },
    // ===== Bộ 8 – Tinh Vân (cấp 71–80)
    kiem_tinh_van: { name: 'Kiếm Tinh Vân', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 71, minQ: 3, stats: { atk: 185, def: 12, hp: 317, mp: 211 }, price: 2340000 },
    cung_tinh_van: { name: 'Cung Tinh Vân', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 71, minQ: 3, stats: { atk: 176, hp: 317, mp: 211, crit: 24 }, price: 2340000 },
    truong_tinh_van: { name: 'Trượng Tinh Vân', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 71, minQ: 3, stats: { atk: 148, def: 12, hp: 317, mp: 317 }, price: 2340000 },
    // ===== Bộ 9 – Thần Mộng (cấp 81–90)
    kiem_than_mong: { name: 'Kiếm Thần Mộng', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 81, minQ: 3, stats: { atk: 205, def: 14, hp: 367, mp: 244 }, price: 4160000 },
    cung_than_mong: { name: 'Cung Thần Mộng', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 81, minQ: 3, stats: { atk: 195, hp: 367, mp: 244, crit: 26 }, price: 4160000 },
    truong_than_mong: { name: 'Trượng Thần Mộng', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 81, minQ: 3, stats: { atk: 164, def: 14, hp: 367, mp: 366 }, price: 4160000 },
    // ===== Bộ 10 – Sáng Thế (cấp 91–100)
    kiem_sang_the: { name: 'Kiếm Sáng Thế', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 91, minQ: 3, stats: { atk: 225, def: 16, hp: 417, mp: 277 }, price: 6500000 },
    cung_sang_the: { name: 'Cung Sáng Thế', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 91, minQ: 3, stats: { atk: 214, hp: 417, mp: 277, crit: 28 }, price: 6500000 },
    truong_sang_the: { name: 'Trượng Sáng Thế', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 91, minQ: 3, stats: { atk: 180, def: 16, hp: 417, mp: 416 }, price: 6500000 },
    // ===== Vật phẩm đặc biệt / hiếm từ GDD
    song_dao_lam_suong: { name: 'Song Đao Lam Sương', kind: 'weapon', slot: 'weapon', wtype: 'song_dao', school: 'sat_thu', level: 15, minQ: 3, stats: { atk: 28, crit: 8, speed: 20 }, price: 5000, desc: 'Song đao của Lam Sương: tốc chạy +20.' },
    thuong_bang_suong: { name: 'Thượng Băng Sương', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 27, minQ: 4, stats: { atk: 65, hp: 150, def: 10 }, price: 25000, desc: 'Kiếm băng: quái lại gần (trong 170) bị làm chậm một nửa tốc độ.' },
    than_kiem_vinh_hang: { name: 'Thần Kiếm Vĩnh Hằng', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 45, minQ: 4, stats: { atk: 130, def: 15, hp: 250, boss: 30 }, price: 0, desc: 'Đòn đánh xuyên mọi phòng thủ của quái Hư Không (cấp 41–50) và tăng sát thương lên trùm.' },
  };

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['weapons'] = PART;
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
