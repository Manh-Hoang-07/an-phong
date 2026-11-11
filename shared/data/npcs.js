/*
 * NPC.
 */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------- NPC
  // appear: NPC chỉ xuất hiện ở bản đồ đó khi tiến độ cốt truyện (chỉ số nhiệm vụ) nằm trong khoảng [từ, đến]
  const NPCS = {
    npc_an: { name: 'Người Gác Màn', role: 'hidden', color: 0xb46bff, greet: 'Ta chỉ xuất hiện khi cậu gọi đúng mật hiệu.' },
    he_thong: { name: 'Hệ thống', role: 'quest', color: 0x3fd0ff,
      greet: '[Hệ thống] Người chơi đã tỉnh lại. Đang chờ lệnh.' },
    lao_su: { name: 'Hội trưởng Khải', role: 'quest', color: 0x2b3a55,
      greet: 'Thợ săn mới à? Ở Tân Đô này, cổng mở ra mỗi ngày. Ai cũng cần người đủ gan bước vào.' },
    vy: { name: 'Vy', role: 'quest', color: 0x7a2b4a,
      greet: 'Đừng nhìn tôi như vậy, hạng C cũng là thợ săn thôi. Theo sát tôi là được.',
      // Vy đứng ở nơi nhiệm vụ cần cô (khoảng nhiệm vụ theo mã, xem npcHere)
      appear: {
        lang: [['q0', 'q4'], ['q10', 'c2q1'], ['c3q6', 'c3q7'], ['c3q9', 'c4q1']],
        ham_ngam: [['q5', 'q5']], rung: [['q4', 'q7']], hang: [['q7', 'q9']],
        b_en_pha: [['c2q1', 'c2q1']], d_lay_muc: [['c2q2', 'c2q2']], lang_chai: [['c2q3', 'c2q4']], cc_hac_nguyet: [['c2q5', 'c2q5']],
        tan_do_2: [['c2q6', 'c2q7'], ['c2q12', 'c3q1']],
        tp_chim_t: [['c2q8', 'c2q8']], tp_chim_c: [['c2q9', 'c2q11']],
        chan_nui: [['c3q2', 'c3q2']], hem_nui: [['c3q3', 'c3q3']], lo_ren_bang: [['c3q4', 'c3q4']], dinh_nui: [['c3q5', 'c3q5']],
        kho_bac: [['c3q7', 'c3q8']],
        vac_da: [['c4q1', 'c4q1']], cong_khai_hoan: [['c4q1', 'c4q2']], tan_do_4: [['c4q2', 'c4q3b']], quang_truong: [['c4q3', 'c4q3b']],
        cau_dan: [['c5q2', 'c5q2c']], sanh_cho: [['c5q2c', 'c5q3b']], dinh_cong_vh: [['c5q4', 'c5q4']], tam_diem: [['c5q5', 'c5q5']],
        tan_do_bt: [['c5q6', 'c5q9']], tan_do_6: [['c6q1', 'c7q9']], tan_do_7: [['c8q1', 'c10q8']],
      } },
    lam_suong: { name: 'Lam Sương', role: '', color: 0x4a3a6a,
      greet: 'Vy, tôi ở lại. Lần này, thật sự ở lại.',
      appear: { tan_do_bt: [['c5q7', 'c5q9']], tan_do_6: [['c6q1', 'c7q9']], tan_do_7: [['c8q1', 'c10q8']] } },
    // Chương 2: thợ săn bị Hắc Nguyệt nhốt trong Cống Ngầm (chỉ xuất hiện khi đang làm nhiệm vụ Giải cứu)
    tho_san_1: { name: 'Thợ săn bị giam', role: 'quest', color: 0x6a6a7a, greet: 'Làm ơn... mở lồng giúp tôi. Bọn chúng đã nhốt chúng tôi ba ngày rồi.', appear: { tp_chim_c: [[20, 20]] } },
    tho_san_2: { name: 'Thợ săn bị giam', role: 'quest', color: 0x6a6a7a, greet: 'Cô gái tóc đỏ đâu? Tôi nghe tiếng cô ấy gọi... Mau mở lồng đi!', appear: { tp_chim_c: [[20, 20]] } },
    tho_san_3: { name: 'Thợ săn bị giam', role: 'quest', color: 0x6a6a7a, greet: 'Nước đang dâng! Làm ơn, tôi chưa muốn chết ở đây.', appear: { tp_chim_c: [[20, 20]] } },
    tho_san_4: { name: 'Thợ săn bị giam', role: 'quest', color: 0x6a6a7a, greet: 'Tôi tưởng sẽ không ai tới. Cảm ơn trời.', appear: { tp_chim_c: [[20, 20]] } },
    tho_san_5: { name: 'Thợ săn bị giam', role: 'quest', color: 0x6a6a7a, greet: 'Bọn chúng lấy lõi đỏ từ chúng tôi mỗi đêm. Đi đi, mở lồng!', appear: { tp_chim_c: [[20, 20]] } },
    hat_mach_1: { name: 'Điểm dẫn mạch', role: 'quest', color: 0x6a8a9a, greet: 'Hạt Mạch đi qua đây, nối vào dòng chảy này là mạch sẽ liền lại.', appear: { long_mach_3: [['c7q5', 'c7q5']] } },
    hat_mach_2: { name: 'Điểm dẫn mạch', role: 'quest', color: 0x6a8a9a, greet: 'Hạt Mạch đi qua đây, nối vào dòng chảy này là mạch sẽ liền lại.', appear: { long_mach_3: [['c7q5', 'c7q5']] } },
    hat_mach_3: { name: 'Điểm dẫn mạch', role: 'quest', color: 0x6a8a9a, greet: 'Hạt Mạch đi qua đây, nối vào dòng chảy này là mạch sẽ liền lại.', appear: { long_mach_3: [['c7q5', 'c7q5']] } },
    tro_ly_1: { name: 'Trợ lý Viện Tinh Hà', role: 'quest', color: 0x6a8a9a, greet: 'Viện trưởng sai chúng tôi đo sao ở đây rồi trạm sập. Cảm ơn trời, cậu tới rồi!', appear: { tinh_van_3: [['c8q5', 'c8q5']] } },
    tro_ly_2: { name: 'Trợ lý Viện Tinh Hà', role: 'quest', color: 0x6a8a9a, greet: 'Viện trưởng sai chúng tôi đo sao ở đây rồi trạm sập. Cảm ơn trời, cậu tới rồi!', appear: { tinh_van_3: [['c8q5', 'c8q5']] } },
    tro_ly_3: { name: 'Trợ lý Viện Tinh Hà', role: 'quest', color: 0x6a8a9a, greet: 'Viện trưởng sai chúng tôi đo sao ở đây rồi trạm sập. Cảm ơn trời, cậu tới rồi!', appear: { tinh_van_3: [['c8q5', 'c8q5']] } },
    tro_ly_4: { name: 'Trợ lý Viện Tinh Hà', role: 'quest', color: 0x6a8a9a, greet: 'Viện trưởng sai chúng tôi đo sao ở đây rồi trạm sập. Cảm ơn trời, cậu tới rồi!', appear: { tinh_van_3: [['c8q5', 'c8q5']] } },
    cua_sang_1: { name: 'Cánh cửa Sáng Thế', role: 'quest', color: 0x6a8a9a, greet: 'Cánh cửa phát sáng, đợi người đủ can đảm bước qua.', appear: { sang_the_2: [['c10q4', 'c10q4']] } },
    cua_sang_2: { name: 'Cánh cửa Sáng Thế', role: 'quest', color: 0x6a8a9a, greet: 'Cánh cửa phát sáng, đợi người đủ can đảm bước qua.', appear: { sang_the_2: [['c10q4', 'c10q4']] } },
    cua_sang_3: { name: 'Cánh cửa Sáng Thế', role: 'quest', color: 0x6a8a9a, greet: 'Cánh cửa phát sáng, đợi người đủ can đảm bước qua.', appear: { sang_the_2: [['c10q4', 'c10q4']] } },
    lang_hinh: { name: 'Lăng', role: 'quest', color: 0xffe8a0, greet: 'Ngươi tới rồi. Ta đã đợi ba trăm năm.', appear: { sang_the_4: [['c10q6', 'c10q8']] } },
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
      // gearShop: tự bày đủ mọi bộ trang bị thường (xem shopItems trong shared/logic/shop.js)
      gearShop: true,
      shop: ['da_cuong_hoa', 'da_cuong_hoa_trung', 'da_cuong_hoa_cao'] },
    tram: { name: 'Trạm dịch chuyển', role: 'teleport', color: 0x3fd0ff,
      greet: 'Trạm dịch chuyển của Hiệp Hội. Đưa cậu tới Tân Đô nào cậu đã từng ghé, mỗi lượt 300 xu. Đi bộ thì miễn phí.' },
    ha_phong: { name: 'Hạ Phong', role: 'quest', color: 0x2f6b8a,
      greet: 'Tôi đứng ở bến này hai mươi năm rồi. Sông nào, cổng nào, tôi đều biết đường. Nhưng mấy tháng nay có những người đi qua mà không trở về.' },
    minh_triet: { name: 'Viện trưởng Minh Triết', role: 'quest', color: 0x5a3a8a,
      greet: 'À, cậu đến rồi. Xin lỗi, tôi đã quên ăn trưa. Tôi đang đo xem năm Vùng rơi xuống theo quy luật nào. Cậu có muốn nhìn bản vẽ không?' },
    thu_kho: { name: 'Quản kho Bảo', role: 'storage', color: 0x3b4a5a,
      greet: 'Kho của Hiệp Hội, khóa ba lớp. Gửi gì cũng giữ nguyên vẹn.' },
    lu_khach: { name: 'Lữ khách bí ẩn', role: 'mystic', color: 0x3a2a55,
      greet: 'Cậu cũng nghe thấy giọng nói của Hệ thống, phải không? Nó không chọn ngẫu nhiên đâu. Nếu cậu biết mật mã, ta sẽ chỉ cho cậu một con đường khác.',
      // Lữ khách đi cùng cậu qua Chương 4: ở Tân Đô I trước và sau, giữa chừng đứng ở nơi nhiệm vụ cần
      appear: {
        lang: [['q0', 'c3q10'], ['c5q1', 'c10q8']],
        tan_do_3: [['c3q11', 'c4q1']], vac_da: [['c4q1', 'c4q2']], cong_khai_hoan: [['c4q1', 'c4q2']],
        tan_do_4: [['c4q2', 'c4q3b'], ['c4q7', 'c4q8']],
        thu_vien: [['c4q4', 'c4q4b']], phong_luu_tru: [['c4q4b', 'c4q5']], dinh_thap: [['c4q6', 'c4q6']],
        sanh_cho: [['c5q3', 'c5q3b']], tan_do_7: [['c8q9', 'c9q9']],
      } },
  };

  Object.assign(G, { NPCS });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
