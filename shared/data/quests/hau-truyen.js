/*
 * Nhiệm vụ chính tuyến · Hậu truyện – Tàn dư Cổng Vĩnh Hằng.
 *
 * obj: { kill: {monster: n} } | { collect: {item: n} } | { visit: [npc...] } | { level: n, school: true } | {}
 * Thưởng: rw(cấp, loại, items, extra) — loại: story | hunt | elite | boss (xem helpers.js).
 * Thêm nhiệm vụ: thêm một phần tử vào mảng dưới, đúng thứ tự cốt truyện.
 */
(function (G) {
  'use strict';
  const { questReward: rw } = G;

  const PART = [
    { id: 'c5q7', name: 'Tàn dư trong Vực Không Cùng', npc: 'truong_lang_5',
      start: [
        'Trưởng làng Vực: Cổng Vĩnh Hằng đã khép, nhưng Cổng SS vẫn phát ra tín hiệu lạ.',
        'Trưởng làng Vực: Vào Vực Không Cùng, dọn sạch 30 Quái Hư Không rồi báo cho ta.',
      ],
      obj: { kill: { quai_hu_khong: 30 } },
      end: [
        'Trưởng làng Vực: Tín hiệu yếu đi rồi. Nhưng ta cảm nhận được một nguồn năng lượng khác ở Đỉnh Cổng.',
        '[Hệ thống] Đã mở nhiệm vụ hậu truyện tiếp theo.',
      ],
      reward: rw(50, 'hunt', [['da_cuong_hoa_than_thoai', 4]], { skillPoints: 4 }) },
    { id: 'c5q8', name: 'Dư ảnh của Thiên', npc: 'truong_lang_5',
      start: [
        'Trưởng làng Vực: Những Kỵ Sĩ Hư Không ở Đỉnh Cổng đang tụ tập quanh một vệt sáng.',
        'Trưởng làng Vực: Hạ 20 tên. Có lẽ dấu vết của Thiên vẫn còn lưu lại ở đó.',
      ],
      obj: { kill: { ky_si_hu_khong: 10 } },
      end: [
        'Trưởng làng Vực: Cậu đã giải phóng nơi đó. Một tín hiệu mới xuất hiện ở Tâm Điểm Dị Giới.',
      ],
      reward: rw(50, 'elite', [['sach_ky_nang', 3]], { skillPoints: 4 }) },
    { id: 'c5q9', name: 'Bình minh sau cánh cổng', npc: 'truong_lang_5',
      start: [
        'Trưởng làng Vực: Tâm Điểm vẫn còn Ma Thần Trắng Trơn. Chúng đang bảo vệ tàn tích cuối cùng.',
        'Trưởng làng Vực: Hạ 15 con để chắc chắn Cổng SS không còn đe dọa thế giới.',
      ],
      obj: { kill: { ma_than_trang_tron: 3 } },
      end: [
        'Trưởng làng Vực: Lần này thì thật sự yên bình rồi. Tân Đô sẽ luôn mở cửa chào đón cậu.',
        '[Hệ thống] Hậu truyện hoàn thành. Cổng SS vẫn mở để thợ săn tiếp tục khám phá.',
      ],
      reward: rw(50, 'boss', [['sach_ky_nang_vo_dinh', 1], ['da_cuong_hoa_than_thoai', 8]], { skillPoints: 6 }) },
  ];

  (G.QUEST_PARTS = G.QUEST_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
