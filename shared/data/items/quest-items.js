/*
 * Vật phẩm nhiệm vụ (kind 'quest'): chỉ dùng để trả nhiệm vụ, không bán được.
 */
(function (G) {
  'use strict';

  const PART = {
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
  };

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['quest-items'] = PART;
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
