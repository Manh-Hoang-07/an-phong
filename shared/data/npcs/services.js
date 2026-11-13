/*
 * NPC dịch vụ ở Tân Đô I: bảng nhiệm vụ, thợ chế tác, dược sư, chủ tiệm, trạm dịch chuyển, quản kho, NPC ẩn.
 *
 * shop: danh sách id vật phẩm bán sẵn. gearShop: tự bày đủ mọi bộ trang bị thường
 * (xem shopItems trong shared/logic/shop.js). shopKind: mở bán thêm hàng khi xong phụ tuyến tương ứng.
 */
(function (G) {
  'use strict';

  const NPCS = (G.NPCS = G.NPCS || {});

  Object.assign(NPCS, {
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
  });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
