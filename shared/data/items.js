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
    sach_tuyet_ky: { name: 'Sách Tuyệt Kỹ', kind: 'ult_book', stack: true, price: 0, desc: 'Đọc để học tuyệt kỹ tối thượng của class hiện tại.' },
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
    // Trang bị chia bộ theo cấp (xem SETS): mỗi bộ 10 cấp, mỗi món có cấp sử dụng riêng.

    // ===== Bộ I – Tân Binh (cấp 1–10): vải (1–3) → da sói (5–7) → thép (9–10)
    // Vũ khí
    kiem_go: { name: 'Kiếm luyện tập', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: null, level: 1, stats: { atk: 5 }, price: 30 },
    kiem_sat: { name: 'Kiếm thép', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 5, stats: { atk: 14 }, price: 260 },
    cung_go: { name: 'Cung gỗ sồi', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 5, stats: { atk: 13, crit: 2 }, price: 260 },
    truong_go: { name: 'Trượng gỗ', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 5, stats: { atk: 11, mp: 20 }, price: 260 },
    kiem_thep: { name: 'Kiếm hợp kim', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 10, stats: { atk: 24, def: 2 }, price: 900 },
    cung_hop_kim: { name: 'Cung hợp kim', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 10, stats: { atk: 22, crit: 4 }, price: 900 },
    truong_pha_le: { name: 'Trượng pha lê', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 10, stats: { atk: 19, mp: 40, hp: 35 }, price: 900 },
    // Mũ
    khan_vai: { name: 'Khăn vải', kind: 'armor', slot: 'mu', level: 1, stats: { def: 1, hp: 12 }, price: 45 },
    mu_da: { name: 'Mũ da sói', kind: 'armor', slot: 'mu', level: 5, stats: { def: 4, hp: 32 }, price: 320 },
    mu_thep: { name: 'Mũ thép', kind: 'armor', slot: 'mu', level: 9, stats: { def: 7, hp: 55 }, price: 700 },
    // Áo
    ao_vai: { name: 'Áo khoác vải', kind: 'armor', slot: 'ao', level: 1, stats: { def: 3, hp: 20 }, price: 60 },
    ao_da: { name: 'Áo khoác da sói', kind: 'armor', slot: 'ao', level: 5, stats: { def: 8, hp: 55 }, price: 400 },
    ao_thep: { name: 'Giáp thép', kind: 'armor', slot: 'ao', level: 9, stats: { def: 12, hp: 90 }, price: 900 },
    // Găng tay
    gang_vai: { name: 'Găng vải', kind: 'armor', slot: 'gang_tay', level: 2, stats: { atk: 1, def: 1 }, price: 45 },
    gang_da: { name: 'Găng da sói', kind: 'armor', slot: 'gang_tay', level: 6, stats: { atk: 3, def: 2 }, price: 320 },
    gang_thep: { name: 'Găng thép', kind: 'armor', slot: 'gang_tay', level: 9, stats: { atk: 5, def: 3, crit: 1 }, price: 700 },
    // Đai lưng
    dai_vai: { name: 'Đai vải', kind: 'armor', slot: 'dai_lung', level: 2, stats: { hp: 15, mp: 5 }, price: 45 },
    dai_da: { name: 'Đai da sói', kind: 'armor', slot: 'dai_lung', level: 6, stats: { hp: 45, mp: 15, def: 1 }, price: 320 },
    dai_bac: { name: 'Đai bạc', kind: 'armor', slot: 'dai_lung', level: 9, stats: { hp: 75, mp: 25, def: 2 }, price: 700 },
    // Quần
    quan_vai: { name: 'Quần vải', kind: 'armor', slot: 'quan', level: 3, stats: { def: 2, hp: 15 }, price: 50 },
    quan_da: { name: 'Quần da sói', kind: 'armor', slot: 'quan', level: 6, stats: { def: 6, hp: 40 }, price: 350 },
    quan_thep: { name: 'Quần thép', kind: 'armor', slot: 'quan', level: 9, stats: { def: 9, hp: 65 }, price: 800 },
    // Giày
    giay_vai: { name: 'Giày vải', kind: 'armor', slot: 'giay', level: 3, stats: { def: 1, hp: 10 }, price: 40 },
    giay_da: { name: 'Giày da sói', kind: 'armor', slot: 'giay', level: 6, stats: { def: 4, hp: 25, crit: 1 }, price: 300 },
    giay_thep: { name: 'Giày thép', kind: 'armor', slot: 'giay', level: 9, stats: { def: 6, hp: 40, crit: 1 }, price: 700 },
    // Nhẫn
    nhan_dong: { name: 'Nhẫn đồng', kind: 'armor', slot: 'nhan', level: 3, stats: { atk: 3 }, price: 120 },
    nhan_bac: { name: 'Nhẫn bạc', kind: 'armor', slot: 'nhan', level: 7, stats: { atk: 7, crit: 2 }, price: 600 },
    // Dây chuyền
    day_chuyen_dong: { name: 'Dây chuyền đồng', kind: 'armor', slot: 'day_chuyen', level: 3, stats: { hp: 30, mp: 10 }, price: 120 },
    day_chuyen_bac: { name: 'Dây chuyền bạc', kind: 'armor', slot: 'day_chuyen', level: 7, stats: { hp: 80, mp: 30 }, price: 600 },
    // Ngọc bội
    ngoc_boi_xanh: { name: 'Ngọc bội xanh', kind: 'armor', slot: 'ngoc_boi', level: 3, stats: { hp: 20, mp: 20 }, price: 150 },
    ngoc_boi_luc: { name: 'Ngọc bội lục bảo', kind: 'armor', slot: 'ngoc_boi', level: 7, stats: { hp: 55, mp: 40, crit: 1 }, price: 650 },

    // ===== Bộ II – Thạch Vương (cấp 11–20): đồ chế từ đá pha lê trong Cổng hạng D
    // Mũ
    mu_thach_quy: { name: 'Mũ Thạch Vương', kind: 'armor', slot: 'mu', level: 11, minQ: 3, stats: { def: 9, hp: 90, mp: 20 }, price: 2400 },
    // Áo
    ao_giap_da: { name: 'Giáp đá Thạch Vương', kind: 'armor', slot: 'ao', level: 11, minQ: 3, stats: { def: 15, hp: 140 }, price: 2500 },
    // Găng tay
    gang_thach_quy: { name: 'Găng Thạch Vương', kind: 'armor', slot: 'gang_tay', level: 13, minQ: 3, stats: { atk: 8, def: 5, crit: 2 }, price: 2400 },
    // Đai lưng
    dai_thach_quy: { name: 'Đai đá Thạch Vương', kind: 'armor', slot: 'dai_lung', level: 13, minQ: 3, stats: { def: 6, hp: 110, mp: 35 }, price: 2400 },
    // Quần
    quan_thach_quy: { name: 'Quần đá Thạch Vương', kind: 'armor', slot: 'quan', level: 13, minQ: 3, stats: { def: 14, hp: 120 }, price: 2400 },
    // Giày
    giay_thach_quy: { name: 'Giày đá Thạch Vương', kind: 'armor', slot: 'giay', level: 13, minQ: 3, stats: { def: 9, hp: 60, crit: 1 }, price: 2400 },
    // Nhẫn
    nhan_thach_quy: { name: 'Nhẫn Thạch Vương', kind: 'armor', slot: 'nhan', level: 12, minQ: 3, stats: { atk: 11, crit: 4 }, price: 2500 },
    // Dây chuyền
    day_chuyen_thach_quy: { name: 'Dây chuyền Thạch Vương', kind: 'armor', slot: 'day_chuyen', level: 12, minQ: 3, stats: { hp: 140, mp: 55 }, price: 2500 },
    // Ngọc bội
    ngoc_boi_thach_quy: { name: 'Ngọc bội Thạch Vương', kind: 'armor', slot: 'ngoc_boi', level: 12, minQ: 3, stats: { hp: 110, mp: 70, crit: 2 }, price: 2600 },
    // Vũ khí
    kiem_thach_quy: { name: 'Kiếm Thạch Vương', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 14, minQ: 3, stats: { atk: 36, def: 4, hp: 50 }, price: 3000 },
    cung_thach_vuong: { name: 'Cung Thạch Vương', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 14, minQ: 3, stats: { atk: 34, crit: 6 }, price: 3000 },
    truong_thach_vuong: { name: 'Trượng Thạch Vương', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 14, minQ: 3, stats: { atk: 29, mp: 70, hp: 80 }, price: 3000 },

    // ===== Bộ III – Băng Long (cấp 21–30): đồ rèn từ lõi Lò Rèn và Trái Tim Băng Long
    // Vũ khí
    kiem_bang_long: { name: 'Kiếm Băng Long', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 22, minQ: 3, stats: { atk: 54, def: 6, hp: 80 }, price: 12000 },
    cung_bang_long: { name: 'Cung Băng Long', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 22, minQ: 3, stats: { atk: 51, crit: 9, hp: 50 }, price: 12000 },
    truong_bang_long: { name: 'Trượng Băng Long', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 22, minQ: 3, stats: { atk: 43, mp: 100, hp: 120 }, price: 12000 },
    // Mũ
    mu_bang_long: { name: 'Mũ Băng Long', kind: 'armor', slot: 'mu', level: 21, minQ: 3, stats: { def: 14, hp: 150, mp: 30 }, price: 11000 },
    // Áo
    ao_bang_long: { name: 'Giáp Băng Long', kind: 'armor', slot: 'ao', level: 21, minQ: 3, stats: { def: 22, hp: 230 }, price: 11500 },
    // Găng tay
    gang_bang_long: { name: 'Găng Băng Long', kind: 'armor', slot: 'gang_tay', level: 23, minQ: 3, stats: { atk: 12, def: 8, crit: 3 }, price: 11000 },
    // Đai lưng
    dai_bang_long: { name: 'Đai Băng Long', kind: 'armor', slot: 'dai_lung', level: 23, minQ: 3, stats: { def: 9, hp: 180, mp: 55 }, price: 11000 },
    // Quần
    quan_bang_long: { name: 'Quần Băng Long', kind: 'armor', slot: 'quan', level: 23, minQ: 3, stats: { def: 21, hp: 200 }, price: 11000 },
    // Giày
    giay_bang_long: { name: 'Giày Băng Long', kind: 'armor', slot: 'giay', level: 23, minQ: 3, stats: { def: 14, hp: 100, crit: 2 }, price: 11000 },
    // Nhẫn
    nhan_bang_long: { name: 'Nhẫn Băng Long', kind: 'armor', slot: 'nhan', level: 22, minQ: 3, stats: { atk: 17, crit: 6 }, price: 11500 },
    // Dây chuyền
    day_chuyen_bang_long: { name: 'Dây chuyền Băng Long', kind: 'armor', slot: 'day_chuyen', level: 22, minQ: 3, stats: { hp: 230, mp: 90 }, price: 11500 },
    // Ngọc bội
    ngoc_boi_bang_long: { name: 'Ngọc bội Băng Long', kind: 'armor', slot: 'ngoc_boi', level: 22, minQ: 3, stats: { hp: 180, mp: 110, crit: 3 }, price: 12000 },

    // ===== Bộ IV – Lưu Trữ (cấp 31–40): trang bị cổ từ Thư Viện Hệ Thống
    // Vũ khí
    kiem_luu_tru: { name: 'Kiếm Lưu Trữ', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 32, minQ: 3, stats: { atk: 78, def: 9, hp: 120 }, price: 45000 },
    cung_luu_tru: { name: 'Cung Lưu Trữ', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 32, minQ: 3, stats: { atk: 73, crit: 13, hp: 80 }, price: 45000 },
    truong_luu_tru: { name: 'Trượng Lưu Trữ', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 32, minQ: 3, stats: { atk: 62, mp: 140, hp: 170 }, price: 45000 },
    // Mũ
    mu_luu_tru: { name: 'Mũ Lưu Trữ', kind: 'armor', slot: 'mu', level: 31, minQ: 3, stats: { def: 20, hp: 230, mp: 45 }, price: 42000 },
    // Áo
    ao_luu_tru: { name: 'Giáp Lưu Trữ', kind: 'armor', slot: 'ao', level: 31, minQ: 3, stats: { def: 33, hp: 360 }, price: 44000 },
    // Găng tay
    gang_luu_tru: { name: 'Găng Lưu Trữ', kind: 'armor', slot: 'gang_tay', level: 33, minQ: 3, stats: { atk: 18, def: 12, crit: 4 }, price: 42000 },
    // Đai lưng
    dai_luu_tru: { name: 'Đai Lưu Trữ', kind: 'armor', slot: 'dai_lung', level: 33, minQ: 3, stats: { def: 14, hp: 280, mp: 85 }, price: 42000 },
    // Quần
    quan_luu_tru: { name: 'Quần Lưu Trữ', kind: 'armor', slot: 'quan', level: 33, minQ: 3, stats: { def: 31, hp: 310 }, price: 42000 },
    // Giày
    giay_luu_tru: { name: 'Giày Lưu Trữ', kind: 'armor', slot: 'giay', level: 33, minQ: 3, stats: { def: 21, hp: 160, crit: 3 }, price: 42000 },
    // Nhẫn
    nhan_luu_tru: { name: 'Nhẫn Lưu Trữ', kind: 'armor', slot: 'nhan', level: 32, minQ: 3, stats: { atk: 25, crit: 9 }, price: 44000 },
    // Dây chuyền
    day_chuyen_luu_tru: { name: 'Dây chuyền Lưu Trữ', kind: 'armor', slot: 'day_chuyen', level: 32, minQ: 3, stats: { hp: 340, mp: 130 }, price: 44000 },
    // Ngọc bội
    ngoc_boi_luu_tru: { name: 'Ngọc bội Lưu Trữ', kind: 'armor', slot: 'ngoc_boi', level: 32, minQ: 3, stats: { hp: 270, mp: 160, crit: 4 }, price: 46000 },

    // ===== Bộ V – Vĩnh Hằng (cấp 41–50): trang bị rèn từ Lõi Cổng Vĩnh Hằng
    // Vũ khí
    kiem_vinh_hang: { name: 'Kiếm Vĩnh Hằng', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 42, minQ: 4, stats: { atk: 110, def: 12, hp: 180 }, price: 180000 },
    cung_vinh_hang: { name: 'Cung Vĩnh Hằng', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 42, minQ: 4, stats: { atk: 104, crit: 18, hp: 120 }, price: 180000 },
    truong_vinh_hang: { name: 'Trượng Vĩnh Hằng', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 42, minQ: 4, stats: { atk: 88, mp: 190, hp: 240 }, price: 180000 },
    // Mũ
    mu_vinh_hang: { name: 'Mũ Vĩnh Hằng', kind: 'armor', slot: 'mu', level: 41, minQ: 4, stats: { def: 28, hp: 340, mp: 65 }, price: 170000 },
    // Áo
    ao_vinh_hang: { name: 'Giáp Vĩnh Hằng', kind: 'armor', slot: 'ao', level: 41, minQ: 4, stats: { def: 46, hp: 520 }, price: 175000 },
    // Găng tay
    gang_vinh_hang: { name: 'Găng Vĩnh Hằng', kind: 'armor', slot: 'gang_tay', level: 43, minQ: 4, stats: { atk: 26, def: 17, crit: 6 }, price: 170000 },
    // Đai lưng
    dai_vinh_hang: { name: 'Đai Vĩnh Hằng', kind: 'armor', slot: 'dai_lung', level: 43, minQ: 4, stats: { def: 20, hp: 400, mp: 120 }, price: 170000 },
    // Quần
    quan_vinh_hang: { name: 'Quần Vĩnh Hằng', kind: 'armor', slot: 'quan', level: 43, minQ: 4, stats: { def: 44, hp: 450 }, price: 170000 },
    // Giày
    giay_vinh_hang: { name: 'Giày Vĩnh Hằng', kind: 'armor', slot: 'giay', level: 43, minQ: 4, stats: { def: 30, hp: 240, crit: 4 }, price: 170000 },
    // Nhẫn
    nhan_vinh_hang: { name: 'Nhẫn Vĩnh Hằng', kind: 'armor', slot: 'nhan', level: 42, minQ: 4, stats: { atk: 36, crit: 13 }, price: 175000 },
    // Dây chuyền
    day_chuyen_vinh_hang: { name: 'Dây chuyền Vĩnh Hằng', kind: 'armor', slot: 'day_chuyen', level: 42, minQ: 4, stats: { hp: 480, mp: 180 }, price: 175000 },
    // Ngọc bội
    ngoc_boi_vinh_hang: { name: 'Ngọc bội Vĩnh Hằng', kind: 'armor', slot: 'ngoc_boi', level: 42, minQ: 4, stats: { hp: 380, mp: 230, crit: 6 }, price: 180000 },

    // ===== Bộ 6 – Thiên Khôi (cấp 51–60)
    kiem_thien_khoi: { name: 'Kiếm Thiên Khôi', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 55, minQ: 4, stats: { atk: 145, def: 10, hp: 300, mp: 200 }, price: 260000 },
    cung_thien_khoi: { name: 'Cung Thiên Khôi', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 55, minQ: 4, stats: { atk: 138, def: 10, hp: 300, mp: 200, crit: 8 }, price: 260000 },
    truong_thien_khoi: { name: 'Trượng Thiên Khôi', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 55, minQ: 4, stats: { atk: 116, def: 10, hp: 300, mp: 200 }, price: 260000 },
    mu_thien_khoi: { name: 'Mũ Thiên Khôi', kind: 'armor', slot: 'mu', level: 51, minQ: 4, stats: { def: 38, hp: 600, mp: 200 }, price: 260000 },
    ao_thien_khoi: { name: 'Giáp Thiên Khôi', kind: 'armor', slot: 'ao', level: 51, minQ: 4, stats: { def: 57, hp: 900 }, price: 260000 },
    gang_tay_thien_khoi: { name: 'Găng Thiên Khôi', kind: 'armor', slot: 'gang_tay', level: 53, minQ: 4, stats: { def: 29, hp: 450, atk: 34, crit: 3 }, price: 260000 },
    dai_lung_thien_khoi: { name: 'Đai Thiên Khôi', kind: 'armor', slot: 'dai_lung', level: 53, minQ: 4, stats: { def: 32, hp: 510 }, price: 260000 },
    quan_thien_khoi: { name: 'Quần Thiên Khôi', kind: 'armor', slot: 'quan', level: 53, minQ: 4, stats: { def: 46, hp: 720 }, price: 260000 },
    giay_thien_khoi: { name: 'Giày Thiên Khôi', kind: 'armor', slot: 'giay', level: 53, minQ: 4, stats: { def: 30, hp: 480, crit: 3 }, price: 260000 },
    nhan_thien_khoi: { name: 'Nhẫn Thiên Khôi', kind: 'armor', slot: 'nhan', level: 51, minQ: 4, stats: { def: 29, hp: 450, atk: 34, crit: 3 }, price: 260000 },
    day_chuyen_thien_khoi: { name: 'Dây chuyền Thiên Khôi', kind: 'armor', slot: 'day_chuyen', level: 51, minQ: 4, stats: { def: 38, hp: 600, mp: 200 }, price: 260000 },
    ngoc_boi_thien_khoi: { name: 'Ngọc bội Thiên Khôi', kind: 'armor', slot: 'ngoc_boi', level: 51, minQ: 4, stats: { def: 34, hp: 540, mp: 200, crit: 3 }, price: 260000 },
    // ===== Bộ 7 – Long Mạch (cấp 61–70)
    kiem_long_mach: { name: 'Kiếm Long Mạch', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 65, minQ: 4, stats: { atk: 200, def: 13, hp: 430, mp: 286 }, price: 1040000 },
    cung_long_mach: { name: 'Cung Long Mạch', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 65, minQ: 4, stats: { atk: 190, def: 13, hp: 430, mp: 286, crit: 10 }, price: 1040000 },
    truong_long_mach: { name: 'Trượng Long Mạch', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 65, minQ: 4, stats: { atk: 160, def: 13, hp: 430, mp: 286 }, price: 1040000 },
    mu_long_mach: { name: 'Mũ Long Mạch', kind: 'armor', slot: 'mu', level: 61, minQ: 4, stats: { def: 53, hp: 860, mp: 270 }, price: 1040000 },
    ao_long_mach: { name: 'Giáp Long Mạch', kind: 'armor', slot: 'ao', level: 61, minQ: 4, stats: { def: 80, hp: 1290 }, price: 1040000 },
    gang_tay_long_mach: { name: 'Găng Long Mạch', kind: 'armor', slot: 'gang_tay', level: 63, minQ: 4, stats: { def: 40, hp: 645, atk: 46, crit: 4 }, price: 1040000 },
    dai_lung_long_mach: { name: 'Đai Long Mạch', kind: 'armor', slot: 'dai_lung', level: 63, minQ: 4, stats: { def: 45, hp: 731 }, price: 1040000 },
    quan_long_mach: { name: 'Quần Long Mạch', kind: 'armor', slot: 'quan', level: 63, minQ: 4, stats: { def: 64, hp: 1032 }, price: 1040000 },
    giay_long_mach: { name: 'Giày Long Mạch', kind: 'armor', slot: 'giay', level: 63, minQ: 4, stats: { def: 42, hp: 688, crit: 4 }, price: 1040000 },
    nhan_long_mach: { name: 'Nhẫn Long Mạch', kind: 'armor', slot: 'nhan', level: 61, minQ: 4, stats: { def: 40, hp: 645, atk: 46, crit: 4 }, price: 1040000 },
    day_chuyen_long_mach: { name: 'Dây chuyền Long Mạch', kind: 'armor', slot: 'day_chuyen', level: 61, minQ: 4, stats: { def: 53, hp: 860, mp: 270 }, price: 1040000 },
    ngoc_boi_long_mach: { name: 'Ngọc bội Long Mạch', kind: 'armor', slot: 'ngoc_boi', level: 61, minQ: 4, stats: { def: 48, hp: 774, mp: 270, crit: 4 }, price: 1040000 },
    // ===== Bộ 8 – Tinh Vân (cấp 71–80)
    kiem_tinh_van: { name: 'Kiếm Tinh Vân', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 75, minQ: 4, stats: { atk: 255, def: 17, hp: 560, mp: 373 }, price: 2340000 },
    cung_tinh_van: { name: 'Cung Tinh Vân', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 75, minQ: 4, stats: { atk: 242, def: 17, hp: 560, mp: 373, crit: 12 }, price: 2340000 },
    truong_tinh_van: { name: 'Trượng Tinh Vân', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 75, minQ: 4, stats: { atk: 204, def: 17, hp: 560, mp: 373 }, price: 2340000 },
    mu_tinh_van: { name: 'Mũ Tinh Vân', kind: 'armor', slot: 'mu', level: 71, minQ: 4, stats: { def: 68, hp: 1120, mp: 340 }, price: 2340000 },
    ao_tinh_van: { name: 'Giáp Tinh Vân', kind: 'armor', slot: 'ao', level: 71, minQ: 4, stats: { def: 102, hp: 1680 }, price: 2340000 },
    gang_tay_tinh_van: { name: 'Găng Tinh Vân', kind: 'armor', slot: 'gang_tay', level: 73, minQ: 4, stats: { def: 51, hp: 840, atk: 58, crit: 5 }, price: 2340000 },
    dai_lung_tinh_van: { name: 'Đai Tinh Vân', kind: 'armor', slot: 'dai_lung', level: 73, minQ: 4, stats: { def: 58, hp: 952 }, price: 2340000 },
    quan_tinh_van: { name: 'Quần Tinh Vân', kind: 'armor', slot: 'quan', level: 73, minQ: 4, stats: { def: 82, hp: 1344 }, price: 2340000 },
    giay_tinh_van: { name: 'Giày Tinh Vân', kind: 'armor', slot: 'giay', level: 73, minQ: 4, stats: { def: 54, hp: 896, crit: 5 }, price: 2340000 },
    nhan_tinh_van: { name: 'Nhẫn Tinh Vân', kind: 'armor', slot: 'nhan', level: 71, minQ: 4, stats: { def: 51, hp: 840, atk: 58, crit: 5 }, price: 2340000 },
    day_chuyen_tinh_van: { name: 'Dây chuyền Tinh Vân', kind: 'armor', slot: 'day_chuyen', level: 71, minQ: 4, stats: { def: 68, hp: 1120, mp: 340 }, price: 2340000 },
    ngoc_boi_tinh_van: { name: 'Ngọc bội Tinh Vân', kind: 'armor', slot: 'ngoc_boi', level: 71, minQ: 4, stats: { def: 61, hp: 1008, mp: 340, crit: 5 }, price: 2340000 },
    // ===== Bộ 9 – Thần Mộng (cấp 81–90)
    kiem_than_mong: { name: 'Kiếm Thần Mộng', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 85, minQ: 4, stats: { atk: 310, def: 21, hp: 690, mp: 460 }, price: 4160000 },
    cung_than_mong: { name: 'Cung Thần Mộng', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 85, minQ: 4, stats: { atk: 295, def: 21, hp: 690, mp: 460, crit: 14 }, price: 4160000 },
    truong_than_mong: { name: 'Trượng Thần Mộng', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 85, minQ: 4, stats: { atk: 248, def: 21, hp: 690, mp: 460 }, price: 4160000 },
    mu_than_mong: { name: 'Mũ Thần Mộng', kind: 'armor', slot: 'mu', level: 81, minQ: 4, stats: { def: 83, hp: 1380, mp: 410 }, price: 4160000 },
    ao_than_mong: { name: 'Giáp Thần Mộng', kind: 'armor', slot: 'ao', level: 81, minQ: 4, stats: { def: 125, hp: 2070 }, price: 4160000 },
    gang_tay_than_mong: { name: 'Găng Thần Mộng', kind: 'armor', slot: 'gang_tay', level: 83, minQ: 4, stats: { def: 62, hp: 1035, atk: 70, crit: 6 }, price: 4160000 },
    dai_lung_than_mong: { name: 'Đai Thần Mộng', kind: 'armor', slot: 'dai_lung', level: 83, minQ: 4, stats: { def: 71, hp: 1173 }, price: 4160000 },
    quan_than_mong: { name: 'Quần Thần Mộng', kind: 'armor', slot: 'quan', level: 83, minQ: 4, stats: { def: 100, hp: 1656 }, price: 4160000 },
    giay_than_mong: { name: 'Giày Thần Mộng', kind: 'armor', slot: 'giay', level: 83, minQ: 4, stats: { def: 66, hp: 1104, crit: 6 }, price: 4160000 },
    nhan_than_mong: { name: 'Nhẫn Thần Mộng', kind: 'armor', slot: 'nhan', level: 81, minQ: 4, stats: { def: 62, hp: 1035, atk: 70, crit: 6 }, price: 4160000 },
    day_chuyen_than_mong: { name: 'Dây chuyền Thần Mộng', kind: 'armor', slot: 'day_chuyen', level: 81, minQ: 4, stats: { def: 83, hp: 1380, mp: 410 }, price: 4160000 },
    ngoc_boi_than_mong: { name: 'Ngọc bội Thần Mộng', kind: 'armor', slot: 'ngoc_boi', level: 81, minQ: 4, stats: { def: 75, hp: 1242, mp: 410, crit: 6 }, price: 4160000 },
    // ===== Bộ 10 – Sáng Thế (cấp 91–100)
    kiem_sang_the: { name: 'Kiếm Sáng Thế', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 95, minQ: 4, stats: { atk: 365, def: 25, hp: 820, mp: 546 }, price: 6500000 },
    cung_sang_the: { name: 'Cung Sáng Thế', kind: 'weapon', slot: 'weapon', wtype: 'cung', school: 'cung_thu', level: 95, minQ: 4, stats: { atk: 347, def: 25, hp: 820, mp: 546, crit: 16 }, price: 6500000 },
    truong_sang_the: { name: 'Trượng Sáng Thế', kind: 'weapon', slot: 'weapon', wtype: 'truong', school: 'phap_su', level: 95, minQ: 4, stats: { atk: 292, def: 25, hp: 820, mp: 546 }, price: 6500000 },
    mu_sang_the: { name: 'Mũ Sáng Thế', kind: 'armor', slot: 'mu', level: 91, minQ: 4, stats: { def: 98, hp: 1640, mp: 480 }, price: 6500000 },
    ao_sang_the: { name: 'Giáp Sáng Thế', kind: 'armor', slot: 'ao', level: 91, minQ: 4, stats: { def: 147, hp: 2460 }, price: 6500000 },
    gang_tay_sang_the: { name: 'Găng Sáng Thế', kind: 'armor', slot: 'gang_tay', level: 93, minQ: 4, stats: { def: 74, hp: 1230, atk: 82, crit: 7 }, price: 6500000 },
    dai_lung_sang_the: { name: 'Đai Sáng Thế', kind: 'armor', slot: 'dai_lung', level: 93, minQ: 4, stats: { def: 83, hp: 1394 }, price: 6500000 },
    quan_sang_the: { name: 'Quần Sáng Thế', kind: 'armor', slot: 'quan', level: 93, minQ: 4, stats: { def: 118, hp: 1968 }, price: 6500000 },
    giay_sang_the: { name: 'Giày Sáng Thế', kind: 'armor', slot: 'giay', level: 93, minQ: 4, stats: { def: 78, hp: 1312, crit: 7 }, price: 6500000 },
    nhan_sang_the: { name: 'Nhẫn Sáng Thế', kind: 'armor', slot: 'nhan', level: 91, minQ: 4, stats: { def: 74, hp: 1230, atk: 82, crit: 7 }, price: 6500000 },
    day_chuyen_sang_the: { name: 'Dây chuyền Sáng Thế', kind: 'armor', slot: 'day_chuyen', level: 91, minQ: 4, stats: { def: 98, hp: 1640, mp: 480 }, price: 6500000 },
    ngoc_boi_sang_the: { name: 'Ngọc bội Sáng Thế', kind: 'armor', slot: 'ngoc_boi', level: 91, minQ: 4, stats: { def: 88, hp: 1476, mp: 480, crit: 7 }, price: 6500000 },

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
    manh_he_thong: { name: 'Mảnh Hệ Thống cuối cùng', kind: 'quest', stack: true, desc: 'Mảnh vỡ cuối cùng của Hệ thống, chứa toàn bộ dữ liệu cốt lõi.' },

    // ===== Vật phẩm đặc biệt / hiếm từ GDD
    song_dao_lam_suong: { name: 'Song Đao Lam Sương', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 15, minQ: 3, stats: { atk: 28, crit: 8, speed: 20 }, price: 5000, desc: 'Song đao của Lam Sương, tốc độ đánh +20%.' },
    huy_hieu_binh_minh: { name: 'Huy Hiệu Bình Minh', kind: 'armor', slot: 'ngoc_boi', level: 12, minQ: 3, stats: { atk: 10, hp: 80, mp: 40 }, price: 3000, desc: 'Huy hiệu đội Bình Minh, tăng 10% tấn công khi đi cùng Vy.' },
    thuong_bang_suong: { name: 'Thượng Băng Sương', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 27, minQ: 4, stats: { atk: 65, hp: 150, def: 10 }, price: 25000, desc: 'Kiếm băng tạo vùng làm chậm 40% xung quanh nhân vật.' },
    vuong_mien_tri_thuc: { name: 'Vương Miện Tri Thức', kind: 'armor', slot: 'mu', level: 36, minQ: 4, stats: { def: 25, hp: 300, mp: 150, cdr: 15 }, price: 80000, desc: 'Giảm 15% hồi chiêu toàn bộ kỹ năng.' },
    sach_ky_nang_vo_dinh: { name: 'Sách kỹ năng Vô Định', kind: 'book', stack: true, price: 0, desc: 'Cho phép cộng tối đa 1 kỹ năng vượt cấp giới hạn.' },
    than_kiem_vinh_hang: { name: 'Thần Kiếm Vĩnh Hằng', kind: 'weapon', slot: 'weapon', wtype: 'kiem', school: 'kiem_si', level: 45, minQ: 4, stats: { atk: 130, def: 15, hp: 250, boss: 30 }, price: 0, desc: 'Gây sát thương chuẩn xuyên giáp quái Hư Không.' },
  };

  const SLOTS = ['weapon', 'mu', 'ao', 'gang_tay', 'dai_lung', 'quan', 'giay', 'nhan', 'day_chuyen', 'ngoc_boi'];
  const SLOT_NAMES = {
    weapon: 'Vũ khí', mu: 'Mũ', ao: 'Áo', gang_tay: 'Găng tay', dai_lung: 'Đai lưng',
    quan: 'Quần', giay: 'Giày', nhan: 'Nhẫn', day_chuyen: 'Dây chuyền', ngoc_boi: 'Ngọc bội',
  };

  // ---------------------------------------------------------------- Bộ trang bị theo cấp
  // Cứ 10 cấp là một bộ. Trong mỗi bộ, từng món có cấp sử dụng riêng (ITEMS[id].level),
  // nên mở dần theo cấp chứ không mặc được cả bộ ngay.
  const SET_LEVELS = 10;
  const SETS = [
    { id: 1, name: 'Tân Binh', min: 1, max: 10,
      desc: 'Đồ vải, da sói rồi tới thép của thợ săn mới vào nghề.' },
    { id: 2, name: 'Thạch Vương', min: 11, max: 20,
      desc: 'Trang bị chế từ đá pha lê trong Cổng hạng D.' },
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

  Object.assign(G, { ITEMS, SLOTS, SLOT_NAMES, SET_LEVELS, SETS });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
