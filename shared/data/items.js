/*
 * Vật phẩm, ô trang bị và bộ trang bị theo cấp.
 */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------- Vật phẩm
  // kind: weapon | armor | potion | material | quest
  // slot (trang bị): weapon | ao | quan | giay | nhan | day_chuyen
  // quality: 1 thường (trắng), 2 tốt (xanh), 3 hiếm (tím)
  const ITEMS = {
    // Thuốc
    binh_mau_nho: { name: 'Bình máu nhỏ', kind: 'potion', hp: 80, price: 10, stack: true, desc: 'Hồi 80 máu.' },
    binh_mau_vua: { name: 'Bình máu vừa', kind: 'potion', hp: 260, price: 40, level: 6, stack: true, desc: 'Hồi 260 máu.' },
    binh_nl_nho: { name: 'Bình năng lượng nhỏ', kind: 'potion', mp: 40, price: 12, stack: true, desc: 'Hồi 40 năng lượng.' },
    binh_nl_vua: { name: 'Bình năng lượng vừa', kind: 'potion', mp: 130, price: 45, level: 6, stack: true, desc: 'Hồi 130 năng lượng.' },
    thuoc_nhiem_do: { name: 'Thuốc chữa nhiễm đỏ', kind: 'potion', hpPct: 0.5, cleanse: true, level: 20, price: 900, stack: true,
      desc: 'Hồi 50% máu tối đa và giải hiệu ứng làm chậm. Công thức của Dược sư Lan.' },

    // Nguyên liệu, vật phẩm nhiệm vụ
    da_cuong_hoa: { name: 'Đá cường hóa', kind: 'material', price: 80, stack: true, desc: 'Dùng để nâng cấp trang bị ở Thợ rèn.' },
    sach_ky_nang: { name: 'Sách kỹ năng', kind: 'book', stack: true, price: 0, desc: 'Đọc để nhận thêm 1 điểm kỹ năng.' },
    sach_tuyet_ky: { name: 'Sách Tuyệt Kỹ Chức Nghiệp', kind: 'ult_book', stack: true, price: 0, desc: 'Đọc để học tuyệt kỹ đặc trưng của class hiện tại.' },
    sach_bien_hinh_1: { name: 'Sách Biến Hình I', kind: 'transform_book', transform: 'awaken1', stack: true, price: 0, desc: 'Mở khóa hình thái biến hình lần thứ nhất.' },
    sach_tien_hoa_chuc_nghiep: { name: 'Sách Tiến Hóa Chức Nghiệp', kind: 'transform_book', transform: 'evolution', stack: true, price: 0, desc: 'Mở khóa hình thái tiến hóa của class nền.' },
    sach_bien_hinh_2: { name: 'Sách Biến Hình II', kind: 'transform_book', transform: 'awaken2', stack: true, price: 0, desc: 'Mở khóa hình thái biến hình lần thứ hai.' },
    // Vật phẩm tăng cường (kind 'boost'): chỉ có qua mã quà tặng (npm run giftcode -- add --item bua_x2_kinh_nghiem 3)
    bua_x2_kinh_nghiem: { name: 'Bùa nhân đôi kinh nghiệm', kind: 'boost', boost: 'exp', mul: 2, minutes: 60, stack: true, price: 0,
      desc: 'Dùng để nhận gấp đôi kinh nghiệm khi hạ quái trong 60 phút. Dùng thêm khi còn hiệu lực sẽ cộng dồn thời gian (tối đa 24 giờ).' },
    manh_vai_den: { name: 'Mảnh huy hiệu đen', kind: 'quest', stack: true, desc: 'Mảnh kim loại đen khắc hình trăng khuyết.' },
    tinh_the_xanh: { name: 'Tinh thể xanh', kind: 'quest', stack: true, desc: 'Tinh thể mát lạnh lấy từ lồng ngực Bộ Xương Pha Lê, hút được năng lượng đỏ.' },
    loi_nang_luong: { name: 'Lõi năng lượng', kind: 'quest', stack: true, desc: 'Vật phẩm nhiệm vụ ngày, rơi từ quái trong cổng.' },
    manh_an_1: { name: 'Lõi cổng đỏ', kind: 'quest', stack: true, desc: 'Lõi năng lượng của Cổng hạng D, vẫn còn đập như tim sống.' },
    // Vật phẩm phụ tuyến
    the_bai_minh: { name: 'Thẻ bài của Minh', kind: 'quest', stack: true, desc: 'Thẻ bài thợ săn đã sờn, khắc tên Minh — đồng đội cũ của Vy.' },
    doan_kiem_ga: { name: 'Đoạn kiếm gãy', kind: 'quest', stack: true, desc: 'Phần lưỡi kiếm gãy của đội Bình Minh, còn vương băng.' },
    khan_binh_minh: { name: 'Khăn Bình Minh', kind: 'quest', stack: true, desc: 'Chiếc khăn đỏ sẫm của đội Bình Minh, lẫn trong bùn đầm lầy.' },
    thao_duoc_do: { name: 'Thảo dược đỏ', kind: 'quest', stack: true, desc: 'Loại cỏ chỉ mọc nơi nước nhiễm đỏ, nguyên liệu chữa bệnh của Lan.' },
    doc_to_dac: { name: 'Độc tố đặc', kind: 'quest', stack: true, desc: 'Tuyến độc đặc quánh lấy từ Nhện Cống Ngầm, cần để bào chế thuốc.' },
    hang_that_lac: { name: 'Hàng thất lạc', kind: 'quest', stack: true, desc: 'Kiện hàng của tiệm Tư bị quái tha đi trong lúc giao hàng.' },
    chia_khoa_kho: { name: 'Chìa khóa kho', kind: 'quest', stack: true, desc: 'Chìa khóa đồng của Quản kho Bảo, rơi trong lúc dọn kho.' },

    // Trang sức phụ tuyến
    huy_hieu_binh_minh: { name: 'Huy hiệu Bình Minh', kind: 'armor', slot: 'ngoc_boi', level: 20, minQ: 3,
      stats: { hp: 180, mp: 60, def: 12, crit: 3 }, price: 15000,
      desc: 'Kỷ vật của đội Bình Minh: máu, năng lượng, phòng thủ và chí mạng.' },

    // ---- Trang bị. "stats" là chỉ số gốc; đồ rơi từ quái có chỉ số ngẫu nhiên 80–120%,
    //      phẩm chất ngẫu nhiên và dòng phụ. "minQ": phẩm chất thấp nhất khi rơi ra.
    // Trang bị chia bộ theo cấp (xem SETS): mỗi 10 cấp MỘT bộ, mỗi ô trang bị chỉ có một món trong bộ.
    // Mỗi món có cấp sử dụng riêng, trải đều trên 10 cấp: vũ khí +0, áo +1, găng +2, giày +3, mũ +4, quần +5, đai +6, nhẫn +7, dây chuyền +8, ngọc bội +9
    // (cấp đầu bộ: 1, 11, 21, … 91), nên mở dần từng món trong lúc lên cấp. Đồ độc nhất (đồ trùm, thưởng nhiệm vụ) có cấp riêng.

    // ===== Bộ I – Tân Binh (cấp 1–10): đồ da sói (đã gộp bậc vải và thép vào một bộ)
    // Vũ khí
    kiem_go: { name: 'Kiếm luyện tập', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: null, level: 1, stats: { atk: 5 }, price: 30, desc: 'Kiếm tập của thợ săn mới, chưa thuộc class nào.' },
    kiem_sat: { name: 'Kiếm thép', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 1, stats: { atk: 14 }, price: 260 },
    cung_go: { name: 'Cung gỗ sồi', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 1, stats: { atk: 13, crit: 2 }, price: 260 },
    truong_go: { name: 'Trượng gỗ', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 1, stats: { atk: 11, mp: 20 }, price: 260 },
    // Mũ
    mu_da: { name: 'Mũ da sói', kind: 'armor', slot: 'mu', level: 5, stats: { def: 4, hp: 32 }, price: 320 },
    // Áo
    ao_da: { name: 'Áo khoác da sói', kind: 'armor', slot: 'ao', level: 2, stats: { def: 8, hp: 55 }, price: 400 },
    // Găng tay
    gang_da: { name: 'Găng da sói', kind: 'armor', slot: 'gang_tay', level: 3, stats: { atk: 3, def: 2 }, price: 320 },
    // Đai lưng
    dai_da: { name: 'Đai da sói', kind: 'armor', slot: 'dai_lung', level: 7, stats: { hp: 45, mp: 15, def: 1 }, price: 320 },
    // Quần
    quan_da: { name: 'Quần da sói', kind: 'armor', slot: 'quan', level: 6, stats: { def: 6, hp: 40 }, price: 350 },
    // Giày
    giay_da: { name: 'Giày da sói', kind: 'armor', slot: 'giay', level: 4, stats: { def: 4, hp: 25, crit: 1 }, price: 300 },
    // Nhẫn
    nhan_bac: { name: 'Nhẫn bạc', kind: 'armor', slot: 'nhan', level: 8, stats: { atk: 7, crit: 2 }, price: 600 },
    // Dây chuyền
    day_chuyen_bac: { name: 'Dây chuyền bạc', kind: 'armor', slot: 'day_chuyen', level: 9, stats: { hp: 80, mp: 30 }, price: 600 },
    // Ngọc bội
    ngoc_boi_luc: { name: 'Ngọc bội lục bảo', kind: 'armor', slot: 'ngoc_boi', level: 10, stats: { hp: 55, mp: 40, crit: 1 }, price: 650 },

    // ===== Bộ II – Thạch Vương (cấp 11–20): đồ chế từ đá pha lê trong Cổng hạng D
    // Mũ
    mu_thach_quy: { name: 'Mũ Thạch Vương', kind: 'armor', slot: 'mu', level: 15, minQ: 3, stats: { def: 9, hp: 90, mp: 20 }, price: 2400 },
    // Áo
    ao_giap_da: { name: 'Giáp đá Thạch Vương', kind: 'armor', slot: 'ao', level: 12, minQ: 3, stats: { def: 15, hp: 140 }, price: 2500 },
    // Găng tay
    gang_thach_quy: { name: 'Găng Thạch Vương', kind: 'armor', slot: 'gang_tay', level: 13, minQ: 3, stats: { atk: 8, def: 5, crit: 2 }, price: 2400 },
    // Đai lưng
    dai_thach_quy: { name: 'Đai đá Thạch Vương', kind: 'armor', slot: 'dai_lung', level: 17, minQ: 3, stats: { def: 6, hp: 110, mp: 35 }, price: 2400 },
    // Quần
    quan_thach_quy: { name: 'Quần đá Thạch Vương', kind: 'armor', slot: 'quan', level: 16, minQ: 3, stats: { def: 14, hp: 120 }, price: 2400 },
    // Giày
    giay_thach_quy: { name: 'Giày đá Thạch Vương', kind: 'armor', slot: 'giay', level: 14, minQ: 3, stats: { def: 9, hp: 60, crit: 1 }, price: 2400 },
    // Nhẫn
    nhan_thach_quy: { name: 'Nhẫn Thạch Vương', kind: 'armor', slot: 'nhan', level: 18, minQ: 3, stats: { atk: 11, crit: 4 }, price: 2500 },
    // Dây chuyền
    day_chuyen_thach_quy: { name: 'Dây chuyền Thạch Vương', kind: 'armor', slot: 'day_chuyen', level: 19, minQ: 3, stats: { hp: 140, mp: 55 }, price: 2500 },
    // Ngọc bội
    ngoc_boi_thach_quy: { name: 'Ngọc bội Thạch Vương', kind: 'armor', slot: 'ngoc_boi', level: 20, minQ: 3, stats: { hp: 110, mp: 70, crit: 2 }, price: 2600 },
    // Vũ khí
    kiem_thach_quy: { name: 'Kiếm Thạch Vương', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 11, minQ: 3, stats: { atk: 36, def: 4, hp: 50 }, price: 3000 },
    cung_thach_vuong: { name: 'Cung Thạch Vương', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 11, minQ: 3, stats: { atk: 34, crit: 6 }, price: 3000 },
    truong_thach_vuong: { name: 'Trượng Thạch Vương', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 11, minQ: 3, stats: { atk: 29, mp: 70, hp: 80 }, price: 3000 },

    // ===== Bộ III – Băng Long (cấp 21–30): đồ rèn từ lõi Lò Rèn và Trái Tim Băng Long
    // Vũ khí
    kiem_bang_long: { name: 'Kiếm Băng Long', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 21, minQ: 3, stats: { atk: 54, def: 6, hp: 80 }, price: 12000 },
    cung_bang_long: { name: 'Cung Băng Long', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 21, minQ: 3, stats: { atk: 51, crit: 9, hp: 50 }, price: 12000 },
    truong_bang_long: { name: 'Trượng Băng Long', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 21, minQ: 3, stats: { atk: 43, mp: 100, hp: 120 }, price: 12000 },
    // Mũ
    mu_bang_long: { name: 'Mũ Băng Long', kind: 'armor', slot: 'mu', level: 25, minQ: 3, stats: { def: 14, hp: 150, mp: 30 }, price: 11000 },
    // Áo
    ao_bang_long: { name: 'Giáp Băng Long', kind: 'armor', slot: 'ao', level: 22, minQ: 3, stats: { def: 22, hp: 230 }, price: 11500 },
    // Găng tay
    gang_bang_long: { name: 'Găng Băng Long', kind: 'armor', slot: 'gang_tay', level: 23, minQ: 3, stats: { atk: 12, def: 8, crit: 3 }, price: 11000 },
    // Đai lưng
    dai_bang_long: { name: 'Đai Băng Long', kind: 'armor', slot: 'dai_lung', level: 27, minQ: 3, stats: { def: 9, hp: 180, mp: 55 }, price: 11000 },
    // Quần
    quan_bang_long: { name: 'Quần Băng Long', kind: 'armor', slot: 'quan', level: 26, minQ: 3, stats: { def: 21, hp: 200 }, price: 11000 },
    // Giày
    giay_bang_long: { name: 'Giày Băng Long', kind: 'armor', slot: 'giay', level: 24, minQ: 3, stats: { def: 14, hp: 100, crit: 2 }, price: 11000 },
    // Nhẫn
    nhan_bang_long: { name: 'Nhẫn Băng Long', kind: 'armor', slot: 'nhan', level: 28, minQ: 3, stats: { atk: 17, crit: 6 }, price: 11500 },
    // Dây chuyền
    day_chuyen_bang_long: { name: 'Dây chuyền Băng Long', kind: 'armor', slot: 'day_chuyen', level: 29, minQ: 3, stats: { hp: 230, mp: 90 }, price: 11500 },
    // Ngọc bội
    ngoc_boi_bang_long: { name: 'Ngọc bội Băng Long', kind: 'armor', slot: 'ngoc_boi', level: 30, minQ: 3, stats: { hp: 180, mp: 110, crit: 3 }, price: 12000 },

    // ===== Bộ IV – Lưu Trữ (cấp 31–40): trang bị cổ từ Thư Viện Hệ Thống
    // Vũ khí
    kiem_luu_tru: { name: 'Kiếm Lưu Trữ', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 31, minQ: 3, stats: { atk: 78, def: 9, hp: 120 }, price: 45000 },
    cung_luu_tru: { name: 'Cung Lưu Trữ', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 31, minQ: 3, stats: { atk: 73, crit: 13, hp: 80 }, price: 45000 },
    truong_luu_tru: { name: 'Trượng Lưu Trữ', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 31, minQ: 3, stats: { atk: 62, mp: 140, hp: 170 }, price: 45000 },
    // Mũ
    mu_luu_tru: { name: 'Mũ Lưu Trữ', kind: 'armor', slot: 'mu', level: 35, minQ: 3, stats: { def: 20, hp: 230, mp: 45 }, price: 42000 },
    // Áo
    ao_luu_tru: { name: 'Giáp Lưu Trữ', kind: 'armor', slot: 'ao', level: 32, minQ: 3, stats: { def: 33, hp: 360 }, price: 44000 },
    // Găng tay
    gang_luu_tru: { name: 'Găng Lưu Trữ', kind: 'armor', slot: 'gang_tay', level: 33, minQ: 3, stats: { atk: 18, def: 12, crit: 4 }, price: 42000 },
    // Đai lưng
    dai_luu_tru: { name: 'Đai Lưu Trữ', kind: 'armor', slot: 'dai_lung', level: 37, minQ: 3, stats: { def: 14, hp: 280, mp: 85 }, price: 42000 },
    // Quần
    quan_luu_tru: { name: 'Quần Lưu Trữ', kind: 'armor', slot: 'quan', level: 36, minQ: 3, stats: { def: 31, hp: 310 }, price: 42000 },
    // Giày
    giay_luu_tru: { name: 'Giày Lưu Trữ', kind: 'armor', slot: 'giay', level: 34, minQ: 3, stats: { def: 21, hp: 160, crit: 3 }, price: 42000 },
    // Nhẫn
    nhan_luu_tru: { name: 'Nhẫn Lưu Trữ', kind: 'armor', slot: 'nhan', level: 38, minQ: 3, stats: { atk: 25, crit: 9 }, price: 44000 },
    // Dây chuyền
    day_chuyen_luu_tru: { name: 'Dây chuyền Lưu Trữ', kind: 'armor', slot: 'day_chuyen', level: 39, minQ: 3, stats: { hp: 340, mp: 130 }, price: 44000 },
    // Ngọc bội
    ngoc_boi_luu_tru: { name: 'Ngọc bội Lưu Trữ', kind: 'armor', slot: 'ngoc_boi', level: 40, minQ: 3, stats: { hp: 270, mp: 160, crit: 4 }, price: 46000 },

    // ===== Bộ V – Vĩnh Hằng (cấp 41–50): trang bị rèn từ Lõi Cổng Vĩnh Hằng
    // Vũ khí
    kiem_vinh_hang: { name: 'Kiếm Vĩnh Hằng', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 41, minQ: 4, stats: { atk: 110, def: 12, hp: 180 }, price: 180000 },
    cung_vinh_hang: { name: 'Cung Vĩnh Hằng', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 41, minQ: 4, stats: { atk: 104, crit: 18, hp: 120 }, price: 180000 },
    truong_vinh_hang: { name: 'Trượng Vĩnh Hằng', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 41, minQ: 4, stats: { atk: 88, mp: 190, hp: 240 }, price: 180000 },
    // Mũ
    mu_vinh_hang: { name: 'Mũ Vĩnh Hằng', kind: 'armor', slot: 'mu', level: 45, minQ: 4, stats: { def: 28, hp: 340, mp: 65 }, price: 170000 },
    // Áo
    ao_vinh_hang: { name: 'Giáp Vĩnh Hằng', kind: 'armor', slot: 'ao', level: 42, minQ: 4, stats: { def: 46, hp: 520 }, price: 175000 },
    // Găng tay
    gang_vinh_hang: { name: 'Găng Vĩnh Hằng', kind: 'armor', slot: 'gang_tay', level: 43, minQ: 4, stats: { atk: 26, def: 17, crit: 6 }, price: 170000 },
    // Đai lưng
    dai_vinh_hang: { name: 'Đai Vĩnh Hằng', kind: 'armor', slot: 'dai_lung', level: 47, minQ: 4, stats: { def: 20, hp: 400, mp: 120 }, price: 170000 },
    // Quần
    quan_vinh_hang: { name: 'Quần Vĩnh Hằng', kind: 'armor', slot: 'quan', level: 46, minQ: 4, stats: { def: 44, hp: 450 }, price: 170000 },
    // Giày
    giay_vinh_hang: { name: 'Giày Vĩnh Hằng', kind: 'armor', slot: 'giay', level: 44, minQ: 4, stats: { def: 30, hp: 240, crit: 4 }, price: 170000 },
    // Nhẫn
    nhan_vinh_hang: { name: 'Nhẫn Vĩnh Hằng', kind: 'armor', slot: 'nhan', level: 48, minQ: 4, stats: { atk: 36, crit: 13 }, price: 175000 },
    // Dây chuyền
    day_chuyen_vinh_hang: { name: 'Dây chuyền Vĩnh Hằng', kind: 'armor', slot: 'day_chuyen', level: 49, minQ: 4, stats: { hp: 480, mp: 180 }, price: 175000 },
    // Ngọc bội
    ngoc_boi_vinh_hang: { name: 'Ngọc bội Vĩnh Hằng', kind: 'armor', slot: 'ngoc_boi', level: 50, minQ: 4, stats: { hp: 380, mp: 230, crit: 6 }, price: 180000 },

    // ===== Bộ 6 – Thiên Khôi (cấp 51–60)
    kiem_thien_khoi: { name: 'Kiếm Thiên Khôi', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 51, minQ: 4, stats: { atk: 145, def: 9, hp: 217, mp: 144 }, price: 260000 },
    cung_thien_khoi: { name: 'Cung Thiên Khôi', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 51, minQ: 4, stats: { atk: 138, def: 9, hp: 217, mp: 144, crit: 8 }, price: 260000 },
    truong_thien_khoi: { name: 'Trượng Thiên Khôi', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 51, minQ: 4, stats: { atk: 116, def: 9, hp: 217, mp: 144 }, price: 260000 },
    mu_thien_khoi: { name: 'Mũ Thiên Khôi', kind: 'armor', slot: 'mu', level: 55, minQ: 4, stats: { def: 35, hp: 433, mp: 144 }, price: 260000 },
    ao_thien_khoi: { name: 'Giáp Thiên Khôi', kind: 'armor', slot: 'ao', level: 52, minQ: 4, stats: { def: 52, hp: 650 }, price: 260000 },
    gang_tay_thien_khoi: { name: 'Găng Thiên Khôi', kind: 'armor', slot: 'gang_tay', level: 53, minQ: 4, stats: { def: 26, hp: 325, atk: 34, crit: 3 }, price: 260000 },
    dai_lung_thien_khoi: { name: 'Đai Thiên Khôi', kind: 'armor', slot: 'dai_lung', level: 57, minQ: 4, stats: { def: 29, hp: 368 }, price: 260000 },
    quan_thien_khoi: { name: 'Quần Thiên Khôi', kind: 'armor', slot: 'quan', level: 56, minQ: 4, stats: { def: 42, hp: 520 }, price: 260000 },
    giay_thien_khoi: { name: 'Giày Thiên Khôi', kind: 'armor', slot: 'giay', level: 54, minQ: 4, stats: { def: 27, hp: 347, crit: 3 }, price: 260000 },
    nhan_thien_khoi: { name: 'Nhẫn Thiên Khôi', kind: 'armor', slot: 'nhan', level: 58, minQ: 4, stats: { def: 26, hp: 325, atk: 34, crit: 3 }, price: 260000 },
    day_chuyen_thien_khoi: { name: 'Dây chuyền Thiên Khôi', kind: 'armor', slot: 'day_chuyen', level: 59, minQ: 4, stats: { def: 35, hp: 433, mp: 144 }, price: 260000 },
    ngoc_boi_thien_khoi: { name: 'Ngọc bội Thiên Khôi', kind: 'armor', slot: 'ngoc_boi', level: 60, minQ: 4, stats: { def: 31, hp: 390, mp: 144, crit: 3 }, price: 260000 },
    // ===== Bộ 7 – Long Mạch (cấp 61–70)
    kiem_long_mach: { name: 'Kiếm Long Mạch', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 61, minQ: 4, stats: { atk: 165, def: 10, hp: 267, mp: 177 }, price: 1040000 },
    cung_long_mach: { name: 'Cung Long Mạch', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 61, minQ: 4, stats: { atk: 157, def: 10, hp: 267, mp: 177, crit: 10 }, price: 1040000 },
    truong_long_mach: { name: 'Trượng Long Mạch', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 61, minQ: 4, stats: { atk: 132, def: 10, hp: 267, mp: 177 }, price: 1040000 },
    mu_long_mach: { name: 'Mũ Long Mạch', kind: 'armor', slot: 'mu', level: 65, minQ: 4, stats: { def: 41, hp: 533, mp: 167 }, price: 1040000 },
    ao_long_mach: { name: 'Giáp Long Mạch', kind: 'armor', slot: 'ao', level: 62, minQ: 4, stats: { def: 62, hp: 800 }, price: 1040000 },
    gang_tay_long_mach: { name: 'Găng Long Mạch', kind: 'armor', slot: 'gang_tay', level: 63, minQ: 4, stats: { def: 31, hp: 400, atk: 38, crit: 4 }, price: 1040000 },
    dai_lung_long_mach: { name: 'Đai Long Mạch', kind: 'armor', slot: 'dai_lung', level: 67, minQ: 4, stats: { def: 35, hp: 453 }, price: 1040000 },
    quan_long_mach: { name: 'Quần Long Mạch', kind: 'armor', slot: 'quan', level: 66, minQ: 4, stats: { def: 50, hp: 640 }, price: 1040000 },
    giay_long_mach: { name: 'Giày Long Mạch', kind: 'armor', slot: 'giay', level: 64, minQ: 4, stats: { def: 33, hp: 427, crit: 4 }, price: 1040000 },
    nhan_long_mach: { name: 'Nhẫn Long Mạch', kind: 'armor', slot: 'nhan', level: 68, minQ: 4, stats: { def: 31, hp: 400, atk: 38, crit: 4 }, price: 1040000 },
    day_chuyen_long_mach: { name: 'Dây chuyền Long Mạch', kind: 'armor', slot: 'day_chuyen', level: 69, minQ: 4, stats: { def: 41, hp: 533, mp: 167 }, price: 1040000 },
    ngoc_boi_long_mach: { name: 'Ngọc bội Long Mạch', kind: 'armor', slot: 'ngoc_boi', level: 70, minQ: 4, stats: { def: 37, hp: 480, mp: 167, crit: 4 }, price: 1040000 },
    // ===== Bộ 8 – Tinh Vân (cấp 71–80)
    kiem_tinh_van: { name: 'Kiếm Tinh Vân', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 71, minQ: 4, stats: { atk: 185, def: 12, hp: 317, mp: 211 }, price: 2340000 },
    cung_tinh_van: { name: 'Cung Tinh Vân', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 71, minQ: 4, stats: { atk: 176, def: 12, hp: 317, mp: 211, crit: 12 }, price: 2340000 },
    truong_tinh_van: { name: 'Trượng Tinh Vân', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 71, minQ: 4, stats: { atk: 148, def: 12, hp: 317, mp: 211 }, price: 2340000 },
    mu_tinh_van: { name: 'Mũ Tinh Vân', kind: 'armor', slot: 'mu', level: 75, minQ: 4, stats: { def: 48, hp: 633, mp: 192 }, price: 2340000 },
    ao_tinh_van: { name: 'Giáp Tinh Vân', kind: 'armor', slot: 'ao', level: 72, minQ: 4, stats: { def: 72, hp: 950 }, price: 2340000 },
    gang_tay_tinh_van: { name: 'Găng Tinh Vân', kind: 'armor', slot: 'gang_tay', level: 73, minQ: 4, stats: { def: 36, hp: 475, atk: 42, crit: 5 }, price: 2340000 },
    dai_lung_tinh_van: { name: 'Đai Tinh Vân', kind: 'armor', slot: 'dai_lung', level: 77, minQ: 4, stats: { def: 41, hp: 538 }, price: 2340000 },
    quan_tinh_van: { name: 'Quần Tinh Vân', kind: 'armor', slot: 'quan', level: 76, minQ: 4, stats: { def: 58, hp: 760 }, price: 2340000 },
    giay_tinh_van: { name: 'Giày Tinh Vân', kind: 'armor', slot: 'giay', level: 74, minQ: 4, stats: { def: 38, hp: 507, crit: 5 }, price: 2340000 },
    nhan_tinh_van: { name: 'Nhẫn Tinh Vân', kind: 'armor', slot: 'nhan', level: 78, minQ: 4, stats: { def: 36, hp: 475, atk: 42, crit: 5 }, price: 2340000 },
    day_chuyen_tinh_van: { name: 'Dây chuyền Tinh Vân', kind: 'armor', slot: 'day_chuyen', level: 79, minQ: 4, stats: { def: 48, hp: 633, mp: 192 }, price: 2340000 },
    ngoc_boi_tinh_van: { name: 'Ngọc bội Tinh Vân', kind: 'armor', slot: 'ngoc_boi', level: 80, minQ: 4, stats: { def: 43, hp: 570, mp: 192, crit: 5 }, price: 2340000 },
    // ===== Bộ 9 – Thần Mộng (cấp 81–90)
    kiem_than_mong: { name: 'Kiếm Thần Mộng', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 81, minQ: 4, stats: { atk: 205, def: 14, hp: 367, mp: 244 }, price: 4160000 },
    cung_than_mong: { name: 'Cung Thần Mộng', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 81, minQ: 4, stats: { atk: 195, def: 14, hp: 367, mp: 244, crit: 14 }, price: 4160000 },
    truong_than_mong: { name: 'Trượng Thần Mộng', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 81, minQ: 4, stats: { atk: 164, def: 14, hp: 367, mp: 244 }, price: 4160000 },
    mu_than_mong: { name: 'Mũ Thần Mộng', kind: 'armor', slot: 'mu', level: 85, minQ: 4, stats: { def: 56, hp: 733, mp: 218 }, price: 4160000 },
    ao_than_mong: { name: 'Giáp Thần Mộng', kind: 'armor', slot: 'ao', level: 82, minQ: 4, stats: { def: 84, hp: 1100 }, price: 4160000 },
    gang_tay_than_mong: { name: 'Găng Thần Mộng', kind: 'armor', slot: 'gang_tay', level: 83, minQ: 4, stats: { def: 42, hp: 550, atk: 46, crit: 6 }, price: 4160000 },
    dai_lung_than_mong: { name: 'Đai Thần Mộng', kind: 'armor', slot: 'dai_lung', level: 87, minQ: 4, stats: { def: 48, hp: 623 }, price: 4160000 },
    quan_than_mong: { name: 'Quần Thần Mộng', kind: 'armor', slot: 'quan', level: 86, minQ: 4, stats: { def: 67, hp: 880 }, price: 4160000 },
    giay_than_mong: { name: 'Giày Thần Mộng', kind: 'armor', slot: 'giay', level: 84, minQ: 4, stats: { def: 44, hp: 587, crit: 6 }, price: 4160000 },
    nhan_than_mong: { name: 'Nhẫn Thần Mộng', kind: 'armor', slot: 'nhan', level: 88, minQ: 4, stats: { def: 42, hp: 550, atk: 46, crit: 6 }, price: 4160000 },
    day_chuyen_than_mong: { name: 'Dây chuyền Thần Mộng', kind: 'armor', slot: 'day_chuyen', level: 89, minQ: 4, stats: { def: 56, hp: 733, mp: 218 }, price: 4160000 },
    ngoc_boi_than_mong: { name: 'Ngọc bội Thần Mộng', kind: 'armor', slot: 'ngoc_boi', level: 90, minQ: 4, stats: { def: 50, hp: 660, mp: 218, crit: 6 }, price: 4160000 },
    // ===== Bộ 10 – Sáng Thế (cấp 91–100)
    kiem_sang_the: { name: 'Kiếm Sáng Thế', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 91, minQ: 4, stats: { atk: 225, def: 16, hp: 417, mp: 277 }, price: 6500000 },
    cung_sang_the: { name: 'Cung Sáng Thế', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 91, minQ: 4, stats: { atk: 214, def: 16, hp: 417, mp: 277, crit: 16 }, price: 6500000 },
    truong_sang_the: { name: 'Trượng Sáng Thế', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 91, minQ: 4, stats: { atk: 180, def: 16, hp: 417, mp: 277 }, price: 6500000 },
    mu_sang_the: { name: 'Mũ Sáng Thế', kind: 'armor', slot: 'mu', level: 95, minQ: 4, stats: { def: 64, hp: 833, mp: 244 }, price: 6500000 },
    ao_sang_the: { name: 'Giáp Sáng Thế', kind: 'armor', slot: 'ao', level: 92, minQ: 4, stats: { def: 96, hp: 1250 }, price: 6500000 },
    gang_tay_sang_the: { name: 'Găng Sáng Thế', kind: 'armor', slot: 'gang_tay', level: 93, minQ: 4, stats: { def: 48, hp: 625, atk: 51, crit: 7 }, price: 6500000 },
    dai_lung_sang_the: { name: 'Đai Sáng Thế', kind: 'armor', slot: 'dai_lung', level: 97, minQ: 4, stats: { def: 54, hp: 708 }, price: 6500000 },
    quan_sang_the: { name: 'Quần Sáng Thế', kind: 'armor', slot: 'quan', level: 96, minQ: 4, stats: { def: 77, hp: 1000 }, price: 6500000 },
    giay_sang_the: { name: 'Giày Sáng Thế', kind: 'armor', slot: 'giay', level: 94, minQ: 4, stats: { def: 51, hp: 667, crit: 7 }, price: 6500000 },
    nhan_sang_the: { name: 'Nhẫn Sáng Thế', kind: 'armor', slot: 'nhan', level: 98, minQ: 4, stats: { def: 48, hp: 625, atk: 51, crit: 7 }, price: 6500000 },
    day_chuyen_sang_the: { name: 'Dây chuyền Sáng Thế', kind: 'armor', slot: 'day_chuyen', level: 99, minQ: 4, stats: { def: 64, hp: 833, mp: 244 }, price: 6500000 },
    ngoc_boi_sang_the: { name: 'Ngọc bội Sáng Thế', kind: 'armor', slot: 'ngoc_boi', level: 100, minQ: 4, stats: { def: 57, hp: 750, mp: 244, crit: 7 }, price: 6500000 },

    // ===== Thuốc cấp cao
    binh_mau_lon: { name: 'Bình máu lớn', kind: 'potion', hp: 700, price: 100, level: 11, stack: true, desc: 'Hồi 700 máu.' },
    binh_mau_dac: { name: 'Bình máu đặc biệt', kind: 'potion', hp: 1800, price: 250, level: 21, stack: true, desc: 'Hồi 1800 máu.' },
    binh_mau_than_thoai: { name: 'Bình máu thần thoại', kind: 'potion', hp: 6500, price: 1800, level: 31, stack: true, desc: 'Hồi 4500 máu.' },
    binh_nl_lon: { name: 'Bình năng lượng lớn', kind: 'potion', mp: 350, price: 100, level: 11, stack: true, desc: 'Hồi 350 năng lượng.' },
    binh_nl_dac: { name: 'Bình năng lượng đặc biệt', kind: 'potion', mp: 900, price: 250, level: 21, stack: true, desc: 'Hồi 900 năng lượng.' },
    binh_nl_than_thoai: { name: 'Bình năng lượng thần thoại', kind: 'potion', mp: 3200, price: 1800, level: 31, stack: true, desc: 'Hồi 2200 năng lượng.' },

    // ===== Đá cường hóa cấp cao
    da_cuong_hoa_trung: { name: 'Đá cường hóa trung', kind: 'material', price: 300, stack: true, desc: 'Đá cường hóa chất lượng cao, dùng cho trang bị cấp 11 trở lên.' },
    da_cuong_hoa_cao: { name: 'Đá cường hóa cao', kind: 'material', price: 1000, stack: true, desc: 'Đá cường hóa tinh khiết, dùng cho trang bị cấp 21 trở lên.' },
    da_cuong_hoa_than_thoai: { name: 'Đá cường hóa thần thoại', kind: 'material', price: 5000, stack: true, desc: 'Đá cường hóa tối thượng, dùng cho trang bị cấp 31 trở lên.' },
    loi_tinh_van: { name: 'Lõi Tinh Vân', kind: 'material', price: 12000, stack: true, desc: 'Nguyên liệu cường hóa và chế tạo trang bị cấp 51 trở lên.' },

    // ===== Vật phẩm nhiệm vụ Chương 2–5
    manh_ao_tho_san: { name: 'Mảnh áo thợ săn', kind: 'quest', stack: true, desc: 'Mảnh vải áo của thợ săn mất tích, nhuốm mùi nước bẩn.' },
    chia_khoa_long_giam: { name: 'Chìa khóa lồng giam', kind: 'quest', stack: true, desc: 'Chìa khóa gỉ sét mở lồng giam trong cống ngầm Thành Phố Chìm.' },
    thu_lam_suong: { name: 'Thư Lam Sương', kind: 'quest', stack: true, desc: 'Mảnh giấy Lam Sương để lại sau khi bỏ chạy, chữ run lẩy bẩy.' },
    valy_thuy_xa: { name: 'Vảy Thủy Xà Vương', kind: 'quest', stack: true, desc: 'Vảy rắn khổng lồ ánh xanh, vẫn rỉ độc.' },
    loi_cong_xanh: { name: 'Lõi Cổng Xanh', kind: 'quest', stack: true, desc: 'Lõi năng lượng của Cổng hạng C, phát sáng xanh dương.' },
    bang_tinh: { name: 'Băng tinh thượng thừa', kind: 'quest', stack: true, desc: 'Tinh thể băng trong vắt, lạnh buốt khi cầm.' },
    than_co: { name: 'Than cổ', kind: 'quest', stack: true, desc: 'Than đá cổ từ Lò Rèn, vẫn còn ấm.' },
    trai_tim_bang_long: { name: 'Trái Tim Băng Long', kind: 'quest', stack: true, desc: 'Trái tim băng rực sáng, nguồn sức mạnh tối thượng hệ Băng.' },
    manh_loi_do_co_dai: { name: 'Mảnh Lõi Đỏ cổ đại', kind: 'quest', stack: true, desc: 'Mảnh Lõi Đỏ từ thời Hệ thống mới hình thành, năng lượng mãnh liệt.' },
    nhat_ky_nguoi_choi: { name: 'Nhật ký người chơi', kind: 'quest', stack: true, desc: 'Trang nhật ký của một người chơi đã mất tích, chữ viết nhạt dần.' },
    manh_luu_tru: { name: 'Mảnh trang lưu trữ', kind: 'quest', stack: true, desc: 'Mảnh dữ liệu lưu trữ cổ, phát sáng khi xếp cạnh nhau.' },
    tri_thuc_co_dai: { name: 'Tri thức cổ đại', kind: 'quest', stack: true, desc: 'Khối tri thức cô đọng từ Thư Viện Hệ Thống.' },
    mat_na_trang_khuyet: { name: 'Mặt Nạ Trăng Khuyết', kind: 'quest', stack: true, desc: 'Mặt nạ đen hình trăng khuyết của Thiên, vẫn còn ấm.' },
    manh_khoi: { name: 'Mảnh Khôi', kind: 'quest', stack: true, desc: 'Mảnh thiên thạch còn nóng, rơi từ quái Vùng Thiên Khôi. Thợ rèn Thiết dùng nó rèn bộ cấp 51–60.' },
    manh_ngoc_mach: { name: 'Mảnh Ngọc Mạch', kind: 'quest', stack: true, desc: 'Ngọc xanh từ mạch rồng ngầm, ấm như thể còn dòng máu chảy bên trong.' },
    manh_tinh_van: { name: 'Mảnh Tinh Vân', kind: 'quest', stack: true, desc: 'Bụi sao kết thành tinh thể, tím lấp lánh, chạm vào nghe tiếng ù xa xăm.' },
    canh_buom_mong: { name: 'Cánh Bướm Mộng', kind: 'quest', stack: true, desc: 'Cánh bướm mỏng như giấc mơ, tan khi nhìn quá lâu.' },
    manh_ky_uc: { name: 'Mảnh Ký Ức', kind: 'quest', stack: true, desc: 'Mảnh ký ức của ai đó, đọng thành tinh thể sáng vàng nhạt.' },
    manh_he_thong: { name: 'Mảnh Hệ Thống cuối cùng', kind: 'quest', stack: true, desc: 'Mảnh vỡ cuối cùng của Hệ thống, chứa toàn bộ dữ liệu cốt lõi.' },

    // ===== Vật phẩm đặc biệt / hiếm từ GDD
    song_dao_lam_suong: { name: 'Song Đao Lam Sương', kind: 'weapon', slot: 'weapon', wtype: 'song_dao', school: 'sat_thu', level: 15, minQ: 3, stats: { atk: 28, crit: 8, speed: 20 }, price: 5000, desc: 'Song đao của Lam Sương, tốc độ đánh +20%.' },
    huy_hieu_binh_minh: { name: 'Huy Hiệu Bình Minh', kind: 'armor', slot: 'ngoc_boi', level: 12, minQ: 3, stats: { atk: 10, hp: 80, mp: 40 }, price: 3000, desc: 'Huy hiệu đội Bình Minh, tăng 10% tấn công khi đi cùng Vy.' },
    thuong_bang_suong: { name: 'Thượng Băng Sương', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 27, minQ: 4, stats: { atk: 65, hp: 150, def: 10 }, price: 25000, desc: 'Kiếm băng tạo vùng làm chậm 40% xung quanh nhân vật.' },
    vuong_mien_tri_thuc: { name: 'Vương Miện Tri Thức', kind: 'armor', slot: 'mu', level: 36, minQ: 4, stats: { def: 25, hp: 300, mp: 150, cdr: 15 }, price: 80000, desc: 'Giảm 15% hồi chiêu toàn bộ kỹ năng.' },
    sach_ky_nang_vo_dinh: { name: 'Sách kỹ năng Vô Định', kind: 'book', stack: true, price: 0, desc: 'Cho phép cộng tối đa 1 kỹ năng vượt cấp giới hạn.' },
    than_kiem_vinh_hang: { name: 'Thần Kiếm Vĩnh Hằng', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 45, minQ: 4, stats: { atk: 130, def: 15, hp: 250, boss: 30 }, price: 0, desc: 'Gây sát thương chuẩn xuyên giáp quái Hư Không.' },
  };

  // ---------------------------------------------------------------- Vũ khí riêng từng class
  // Kiếm (Kiếm Sĩ), Cung (Cung Thủ), Trượng (Pháp Sư) viết tay ở trên. 5 loại còn lại tạo tự động cho đủ 11 bậc,
  // cùng cấp / giá / phẩm chất tối thiểu với kiếm hoặc trượng cùng bậc, chỉ số chỉnh theo lối chơi của class.
  // WEAPON_TIERS: [hậu tố id, kiếm cùng bậc, cung cùng bậc, trượng cùng bậc, tên bậc]
  const WEAPON_TIERS = [
    ['sat', 'kiem_sat', 'cung_go', 'truong_go', 'thép'],
    ['thach_vuong', 'kiem_thach_quy', 'cung_thach_vuong', 'truong_thach_vuong', 'Thạch Vương'],
    ['bang_long', 'kiem_bang_long', 'cung_bang_long', 'truong_bang_long', 'Băng Long'],
    ['luu_tru', 'kiem_luu_tru', 'cung_luu_tru', 'truong_luu_tru', 'Lưu Trữ'],
    ['vinh_hang', 'kiem_vinh_hang', 'cung_vinh_hang', 'truong_vinh_hang', 'Vĩnh Hằng'],
    ['thien_khoi', 'kiem_thien_khoi', 'cung_thien_khoi', 'truong_thien_khoi', 'Thiên Khôi'],
    ['long_mach', 'kiem_long_mach', 'cung_long_mach', 'truong_long_mach', 'Long Mạch'],
    ['tinh_van', 'kiem_tinh_van', 'cung_tinh_van', 'truong_tinh_van', 'Tinh Vân'],
    ['than_mong', 'kiem_than_mong', 'cung_than_mong', 'truong_than_mong', 'Thần Mộng'],
    ['sang_the', 'kiem_sang_the', 'cung_sang_the', 'truong_sang_the', 'Sáng Thế'],
  ];
  const r0 = (v) => Math.max(1, Math.round(v));
  // [loại, class, tên, gốc ('kiem' | 'truong'), cách đổi chỉ số]
  const GEN_WEAPONS = [
    ['song_dao', 'sat_thu', 'Song Đao', 'kiem', (s, lv) => ({ atk: r0(s.atk * 0.92), crit: r0(3 + lv * 0.12), ...(s.hp ? { hp: r0(s.hp * 0.8) } : {}) })],
    ['chuy', 'tanker', 'Chùy', 'kiem', (s) => ({ atk: r0(s.atk * 0.95), def: r0((s.def || 1) * 1.6 + 2), ...(s.hp ? { hp: r0(s.hp * 1.3) } : {}) })],
    ['than_binh', 'toan_nang', 'Thần Binh', 'kiem', (s, lv) => ({ atk: r0(s.atk), crit: r0(1 + lv * 0.06), ...(s.hp ? { hp: r0(s.hp) } : {}) })],
    ['thanh_truong', 'tri_lieu_su', 'Thánh Trượng', 'truong', (s) => ({ atk: r0(s.atk * 0.9), mp: r0((s.mp || 10) * 1.3), ...(s.hp ? { hp: r0(s.hp * 1.1) } : {}) })],
    ['linh_chau', 'trieu_hoi_su', 'Linh Châu', 'truong', (s) => ({ atk: r0(s.atk * 0.95), mp: r0((s.mp || 10) * 1.15), ...(s.hp ? { hp: r0(s.hp) } : {}) })],
  ];
  // Vũ khí cùng bậc của từng loại: WEAPON_TIER_OF[id] = hậu tố bậc; TIER_WEAPONS[hậu tố][loại] = id
  const TIER_WEAPONS = {}, WEAPON_TIER_OF = {};
  for (const [suf, kiemId, cungId, truongId, tierName] of WEAPON_TIERS) {
    const row = TIER_WEAPONS[suf] = { kiem: kiemId, cung: cungId, truong: truongId };
    for (const [wtype, school, name, base, stat] of GEN_WEAPONS) {
      const b = ITEMS[base === 'kiem' ? kiemId : truongId];
      const id = `${wtype}_${suf}`;
      ITEMS[id] = { name: `${name} ${tierName}`, kind: 'weapon', slot: 'weapon', wtype, school, level: b.level,
        ...(b.minQ ? { minQ: b.minQ } : {}), stats: stat(b.stats, b.level), price: b.price };
      row[wtype] = id;
    }
    for (const id of Object.values(row)) WEAPON_TIER_OF[id] = suf;
  }
  // Vũ khí bậc đầu của class (thưởng khi chọn class) và vũ khí Băng Long (thưởng chế tạo cốt truyện)
  function classTierWeapon(school, suf) {
    const wt = G.classWeapon ? G.classWeapon(school) : null;
    return wt && TIER_WEAPONS[suf] ? TIER_WEAPONS[suf][wt] || null : null;
  }

  const SLOTS = ['weapon', 'mu', 'ao', 'gang_tay', 'dai_lung', 'quan', 'giay', 'nhan', 'day_chuyen', 'ngoc_boi'];
  const SLOT_NAMES = {
    weapon: 'Vũ khí', mu: 'Mũ', ao: 'Áo', gang_tay: 'Găng tay', dai_lung: 'Đai lưng',
    quan: 'Quần', giay: 'Giày', nhan: 'Nhẫn', day_chuyen: 'Dây chuyền', ngoc_boi: 'Ngọc bội',
  };

  // ---------------------------------------------------------------- Bộ trang bị theo cấp
  // Cứ 10 cấp là một bộ. Mỗi ô trang bị đúng một món; cấp sử dụng của từng món trải đều trong 10 cấp
  // (vũ khí ở cấp đầu bộ, ngọc bội ở cấp cuối), nên một bộ dùng được suốt 10 cấp, không phải thay đồ liên tục.
  const SET_LEVELS = 10;
  const SETS = [
    { id: 1, name: 'Tân Binh', min: 1, max: 10,
      desc: 'Đồ da sói của thợ săn mới vào nghề, dùng suốt cấp 1–10.' },
    { id: 2, name: 'Thạch Vương', min: 11, max: 20,
      desc: 'Trang bị chế từ đá pha lê trong Cổng hạng D, cấp 11–20.' },
    { id: 3, name: 'Băng Long', min: 21, max: 30,
      desc: 'Trang bị rèn từ Lõi Lò Rèn và Trái Tim Băng Long dưới núi tuyết.' },
    { id: 4, name: 'Lưu Trữ', min: 31, max: 40,
      desc: 'Trang bị cổ từ Thư Viện Hệ Thống, mang sức mạnh tri thức cổ đại.' },
    { id: 5, name: 'Vĩnh Hằng', min: 41, max: 50,
      desc: 'Trang bị rèn từ Lõi Cổng Vĩnh Hằng, sức mạnh xuyên không gian.' },
    { id: 6, name: 'Thiên Khôi', min: 51, max: 60, desc: 'Trang bị thợ săn cấp 51–60.' },
    { id: 7, name: 'Long Mạch', min: 61, max: 70, desc: 'Trang bị thợ săn cấp 61–70.' },
    { id: 8, name: 'Tinh Vân', min: 71, max: 80, desc: 'Trang bị thợ săn cấp 71–80.' },
    { id: 9, name: 'Thần Mộng', min: 81, max: 90, desc: 'Trang bị thợ săn cấp 81–90.' },
    { id: 10, name: 'Sáng Thế', min: 91, max: 100, desc: 'Trang bị thợ săn cấp 91–100.' },
  ];

  // Mỗi tuyệt kỹ có một cuốn sách riêng: sach_tk_<id>. Không bán ở cửa hàng.
  //  - Tuyệt kỹ class (kể cả tuyệt kỹ cũ): chỉ có qua mã quà tặng (npm run giftcode -- add --item sach_tk_<id> 1)
  //  - Tuyệt kỹ dùng chung (ultAny, yếu hơn): nhận từ chuỗi nhiệm vụ Khảo hạch Tuyệt Kỹ của Hội trưởng Khải
  for (const [sid, sk] of Object.entries(G.SKILLS)) {
    if (!sk.ult) continue;
    const who = sk.ultAny ? 'mọi class' : (sk.ultSchools || [sk.school]).map(x => G.SCHOOLS[x]?.name || x).join(', ');
    ITEMS[G.ultBookId(sid)] = { name: `Sách Tuyệt Kỹ: ${sk.name}`, kind: 'ult_book', skill: sid, level: sk.level, stack: true, price: 0,
      desc: `Đọc để học tuyệt kỹ ${sk.name}. Dành cho: ${who}. Cần cấp ${sk.level}. ${sk.ultAny ? 'Nhận từ nhiệm vụ Khảo hạch Tuyệt Kỹ.' : 'Chỉ có qua mã quà tặng.'}` };
  }

  Object.assign(G, { ITEMS, SLOTS, SLOT_NAMES, SET_LEVELS, SETS, WEAPON_TIERS, TIER_WEAPONS, WEAPON_TIER_OF, classTierWeapon });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
