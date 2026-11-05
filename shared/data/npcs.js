/*
 * NPC.
 */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------- NPC
  // appear: NPC chỉ xuất hiện ở bản đồ đó khi tiến độ cốt truyện (chỉ số nhiệm vụ) nằm trong khoảng [từ, đến]
  const NPCS = {
    he_thong: { name: 'Hệ thống', role: 'quest', color: 0x3fd0ff,
      greet: '[Hệ thống] Người chơi đã tỉnh lại. Đang chờ lệnh.' },
    lao_su: { name: 'Hội trưởng Khải', role: 'quest', color: 0x2b3a55,
      greet: 'Thợ săn mới à? Ở Tân Đô này, cổng mở ra mỗi ngày. Ai cũng cần người đủ gan bước vào.' },
    vy: { name: 'Vy', role: 'quest', color: 0x7a2b4a,
      greet: 'Đừng nhìn tôi như vậy, hạng C cũng là thợ săn thôi. Theo sát tôi là được.',
      appear: {
        lang: [[0, 4], [10, 11], [16, 17], [22, 23], [28, 29], [31, 33], [39, 40], [45, 999]],
        rung: [[4, 7]], hang: [[7, 9]],
        b_en_pha: [[11, 11]], d_lay_muc: [[12, 12]], lang_chai: [[13, 14]], cc_hac_nguyet: [[15, 15]],
        tp_chim_t: [[18, 18]], tp_chim_c: [[19, 21]],
        chan_nui: [[24, 24]], hem_nui: [[25, 25]], lo_ren_bang: [[26, 26]], dinh_nui: [[27, 27]],
        kho_bac: [[29, 30]],
        vac_da: [[34, 34]], cong_khai_hoan: [[34, 35]], quang_truong: [[35, 35]],
        cau_dan: [[41, 41]], sanh_cho: [[42, 42]], dinh_cong_vh: [[43, 43]], tam_diem: [[44, 45]],
      } },
    lam_suong: { name: 'Lam Sương', role: '', color: 0x4a3a6a,
      greet: 'Vy, tôi ở lại. Lần này, thật sự ở lại.',
      appear: { lang: [[46, 999]] } },
    bang_nv: { name: 'Bảng nhiệm vụ', role: 'daily', color: 0x3b4a5a,
      greet: 'Bảng nhiệm vụ của Hiệp Hội. Mỗi ngày có 3 việc mới, làm mới lúc 0 giờ.' },
    tho_ren: { name: 'Thợ chế tác Thiết', role: 'smith', color: 0x5d4a3a,
      greet: 'Đồ rơi từ cổng thì phải qua tay ta mới thành vũ khí thật sự. Đưa đây xem nào!' },
    ba_thuoc: { name: 'Dược sư Lan', role: 'shop', color: 0x2f7d6d,
      greet: 'Vào cổng mà không mang thuốc là tự sát đấy, cậu nhóc.',
      shop: ['binh_mau_nho', 'binh_nl_nho', 'binh_mau_vua', 'binh_nl_vua',
        'binh_mau_lon', 'binh_nl_lon', 'binh_mau_dac', 'binh_nl_dac',
        'binh_mau_than_thoai', 'binh_nl_than_thoai',
        'da_cuong_hoa', 'da_cuong_hoa_trung', 'da_cuong_hoa_cao', 'da_cuong_hoa_than_thoai'] },
    tap_hoa: { name: 'Chủ tiệm Tư', role: 'shop', color: 0x6b4fa0,
      greet: 'Trang bị cho thợ săn mới vào nghề đây! Bán gì cũng mua, giá hữu nghị.',
      shop: ['khan_vai', 'ao_vai', 'gang_vai', 'dai_vai', 'quan_vai', 'giay_vai', 'nhan_dong', 'day_chuyen_dong', 'ngoc_boi_xanh',
        'kiem_go', 'kiem_sat', 'cung_go', 'truong_go', 'da_cuong_hoa',
        'kiem_thach_quy', 'cung_thach_vuong', 'truong_thach_vuong', 'da_cuong_hoa_trung',
        'kiem_bang_long', 'cung_bang_long', 'truong_bang_long', 'da_cuong_hoa_cao'] },
    thu_kho: { name: 'Quản kho Bảo', role: 'storage', color: 0x3b4a5a,
      greet: 'Kho của Hiệp Hội, khóa ba lớp. Gửi gì cũng giữ nguyên vẹn.' },
    lu_khach: { name: 'Lữ khách bí ẩn', role: 'mystic', color: 0x3a2a55,
      greet: 'Cậu cũng nghe thấy giọng nói của Hệ thống, phải không? Nó không chọn ngẫu nhiên đâu. Nếu cậu biết mật mã, ta sẽ chỉ cho cậu một con đường khác.' },
  };

  Object.assign(G, { NPCS });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
