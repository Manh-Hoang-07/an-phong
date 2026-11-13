/*
 * Nhiệm vụ chính tuyến · Chương 6 – Thiên Khôi (cấp 51–60) · giao: Khải.
 * Cốt truyện: Mỗi chương 9 nhiệm vụ (Chương 10: 8):
 *   1 Truyện (mở map 1) · 2 Hạ (map 1) · 3 Thu nguyên liệu · 4 Hạ + Đạt cấp (map 2) · 5 cơ chế đặc trưng (map 3)
 *   6 Hạ tinh anh · 7 Truyện + Hạ thủ lĩnh (map 4) · 8 Trùm (hang) · 9 Truyện hậu quả.
 * Thưởng: rw(cấp, loại, items, extra) — loại: story | hunt | elite | boss (xem helpers.js).
 */
(function (G) {
  'use strict';
  const { questReward: rw } = G;

  const PART = [
    { id: 'c6q1', name: 'Năm vết nứt trên trời', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh: Cổng Vĩnh Hằng đã đóng, Thiên ở lại bên kia để giữ nó. Ba tháng yên ổn, rồi bầu trời nứt thành năm vết sáng.',
        'Trưởng Thịnh: Năm hòn đảo rơi xuống quanh Cổng SS, mảnh còn lại của thế giới bên kia cổng. Chúng tôi gọi chúng là Vùng. Hiệp Hội dựng Thiên Đô ngay tại đây làm tiền đồn.',
        'Trưởng Thịnh: Vùng gần nhất là Thiên Khôi, nơi lửa và thiên thạch. Đi khảo sát đi. Cậu có một mảnh Hệ thống trong túi, nó đang rung theo nhịp của Vùng đó.',
      ],
      end: ['Trưởng Thịnh: Bãi Thiên Thạch đã mở. Đừng đi quá xa khi chưa biết gì.'],
      obj: {},
      reward: rw(51, 'story', [['binh_mau_than_thoai', 3]]) },
    { id: 'c6q2', name: 'Khảo sát Thiên Khôi', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh: Bãi Thiên Thạch và Đồi Khôi Đỏ là hai khu đầu của Vùng. Quái ở đó mang hơi lửa, không còn là sinh vật bình thường.',
        'Trưởng Thịnh: Hạ 12 Quỷ Tro và 12 Bọ Thiên Thạch. Cần đạt cấp 51 để chịu được nhiệt.',
      ],
      end: ['Trưởng Thịnh: Số liệu cậu mang về rất hữu ích. Đồi Khôi Đỏ đã mở.'],
      obj: { kill: { tan_du_thien_khoi: 12, bo_thien_thach: 12 }, level: 51 },
      reward: rw(51, 'hunt', [['da_cuong_hoa_than_thoai', 2]]) },
    { id: 'c6q3', name: 'Tro thiên thạch', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh: Thợ chế tác Thiết cần Mảnh Khôi để rèn bộ trang bị cấp 51–60. Mảnh rơi từ Quỷ Tro và Bọ Thiên Thạch.',
        'Trưởng Thịnh: Thu 8 mảnh. Đừng cầm lâu, nó nóng.',
      ],
      end: ['Trưởng Thịnh: Đủ rồi. Thiết sẽ rèn ngay. Còn lại là phần của cậu.'],
      obj: { collect: { manh_khoi: 8 } },
      reward: rw(52, 'hunt', [['loi_tinh_van', 2]]) },
    { id: 'c6q4', name: 'Đường vào mỏ', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh: Phía sau Đồi Khôi Đỏ là Mỏ Lửa Cổ, nơi thợ mỏ của Hiệp Hội từng khai thác thiên thạch. Giờ Sói Lửa Khôi chiếm hết.',
        'Trưởng Thịnh: Hạ 20 con để mở đường. Cần cấp 55.',
      ],
      end: ['Trưởng Thịnh: Mỏ đã sạch lối vào. Nhưng trong mỏ còn thợ mỏ bị kẹt.'],
      obj: { kill: { soi_lua_khoi: 20 }, level: 55 },
      reward: rw(55, 'hunt', [['da_cuong_hoa_than_thoai', 2]]) },
    { id: 'c6q5', name: 'Giữ trạm khai thác', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh: Trạm khai thác ở Mỏ Lửa Cổ là nơi còn người sống. Sói Lửa Khôi đang tràn vào từng đợt.',
        'Trưởng Thịnh: Phòng thủ cho tới khi dọn sạch 30 con. Tôi sẽ cho người tiếp tế phía sau cậu.',
      ],
      end: ['Trạm khai thác giữ được. Thợ mỏ chui ra khỏi hầm, mặt lấm than nhưng còn sống.', 'Trưởng Thịnh: Phòng thủ tốt. Lần này không ai phải chết.'],
      obj: { kill: { soi_lua_khoi: 30 } },
      reward: rw(56, 'hunt', [['binh_mau_than_thoai', 4]]) },
    { id: 'c6q6', name: 'Hộ vệ lửa', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh: Hộ Vệ Khôi Đỏ canh các hầm sâu. Đây là loại tinh anh, đánh theo đội.',
        'Trưởng Thịnh: Hạ 8 tên. Đừng tách ra, nhất là khi nó nổi giận.',
      ],
      end: ['Trưởng Thịnh: Thành Khôi Sụp ở phía sau đã mở. Nơi đó có thứ cậu cần thấy.'],
      obj: { kill: { ho_vuong_thien_khoi: 8 } },
      reward: rw(57, 'elite', [['da_cuong_hoa_than_thoai', 3]]) },
    { id: 'c6q7', name: 'Lá thư của Số 1', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh: Trong Thành Khôi Sụp có một cuốn nhật ký của người chơi số 1. Tên anh ta là Triệu Cương.',
        'Trưởng Thịnh: Thủ Lĩnh Khôi Tàn giữ nó. Hạ hắn rồi đọc.',
      ],
      end: [
        'Nhật ký Triệu Cương: "Ngày 1: Hệ thống nói tôi là người mạnh nhất. Ngày 300: Tôi không nhớ mình đã đánh ai. Ngày 301: Tôi chỉ còn cơn giận."',
        'Nhật ký Triệu Cương: "Ngày 302: Nó nói tôi đã đạt thành. Tôi bị cắm vào một cột đá. Tôi vẫn nghe thấy tiếng lửa."',
      ],
      obj: { kill: { thu_linh_khoi_tan: 1 } },
      reward: rw(58, 'elite', [['loi_tinh_van', 3]]) },
    { id: 'c6q8', name: 'Trụ Mộng Thiên Khôi', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh: Trụ Mộng là cột đá giam ý thức của Triệu Cương. Hệ thống dùng anh ta để giữ cổng, và anh ta đã hóa thành cơn giận không ngừng.',
        'Trưởng Thịnh: Hạ anh ta không phải để giết. Hãy xem như để giải thoát.',
      ],
      end: [
        'Trụ Mộng vỡ, lửa tắt dần. Giữa tro tàn, một người đàn ông cao lớn quỳ xuống, tỉnh lại trong một khắc.',
        'Triệu Cương: ...Đã lâu rồi mới thấy ánh sáng. Cậu là người chơi thứ bảy?',
        'Triệu Cương: Đừng trở thành người thứ tám.',
        '[Hệ thống] Mảnh Hệ thống trong túi nóng lên.',
      ],
      obj: { kill: { tru_mong_thien_khoi: 1 } },
      reward: rw(60, 'boss', [['ao_thien_khoi', 1], ['loi_tinh_van', 4]], { skillPoints: 3 }) },
    { id: 'c6q9', name: 'Điều Hệ thống không nói', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh (chuyển lời Hội trưởng Khải): Cậu về rồi. Lữ khách đã nói chuyện với tôi qua đường truyền.',
        'Trưởng Thịnh (chuyển lời Hội trưởng Khải): Các người chơi trước không biến mất khi chạm hạng S. Họ bị Hệ thống cắm vào trụ để giữ các cổng khỏi vỡ ra, rồi gọi việc đó là "đạt thành".',
      ],
      end: [
        'Trưởng Thịnh (chuyển lời Hội trưởng Khải): Thiên đã biết điều này. Chúng tôi từng cãi nhau về nó suốt đêm.',
        'Trưởng Thịnh (chuyển lời Hội trưởng Khải): Vùng tiếp theo là Long Mạch. Cửa đã mở.',
        '[Hệ thống] Đã mở khóa: Chương 7 – Long Mạch.',
      ],
      obj: {},
      reward: rw(60, 'story', [['binh_mau_than_thoai', 4]]) },
  ];

  (G.QUEST_PARTS = G.QUEST_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
