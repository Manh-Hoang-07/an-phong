/*
 * NPC cốt truyện: người giao / trả nhiệm vụ chính tuyến và các nhân vật đi theo người chơi.
 *
 * appear: NPC chỉ xuất hiện ở bản đồ đó khi tiến độ cốt truyện (chỉ số nhiệm vụ) nằm trong khoảng [từ, đến].
 *   Ví dụ: lang: [['q0', 'q4']] = ở Tân Đô I từ nhiệm vụ q0 tới q4.
 *   Số thay cho mã nhiệm vụ = chỉ số bước (NPC chỉ hiện đúng một lúc).
 */
(function (G) {
  'use strict';

  const NPCS = (G.NPCS = G.NPCS || {});

  Object.assign(NPCS, {
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
  });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
