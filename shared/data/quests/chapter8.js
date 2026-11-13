/*
 * Nhiệm vụ chính tuyến · Chương 8 – Tinh Vân (cấp 71–80) · giao: Viện trưởng Minh Triết.
 * Cốt truyện: Mỗi chương 9 nhiệm vụ (Chương 10: 8):
 *   1 Truyện (mở map 1) · 2 Hạ (map 1) · 3 Thu nguyên liệu · 4 Hạ + Đạt cấp (map 2) · 5 cơ chế đặc trưng (map 3)
 *   6 Hạ tinh anh · 7 Truyện + Hạ thủ lĩnh (map 4) · 8 Trùm (hang) · 9 Truyện hậu quả.
 * Thưởng: rw(cấp, loại, items, extra) — loại: story | hunt | elite | boss (xem helpers.js).
 */
(function (G) {
  'use strict';
  const { questReward: rw } = G;

  const PART = [
    { id: 'c8q1', name: 'Viện trưởng Minh Triết', npc: 'minh_triet',
      start: [
        'Minh Triết: Ồ, cậu đến rồi. Xin lỗi, tôi quên ăn trưa. Tôi đang vẽ các cổng lên bản đồ: chúng nằm theo một hình.',
        'Minh Triết: Vùng Tinh Vân là nơi bản vẽ này phát sáng mạnh nhất. Tôi muốn cậu ra Bến Sao Rơi xem tận mắt.',
      ],
      end: ['Minh Triết: Bến Sao Rơi đã mở. Đem về mọi thứ lạ lùng cậu thấy.'],
      obj: {},
      reward: rw(71, 'story', [['binh_mau_than_thoai', 3]]) },
    { id: 'c8q2', name: 'Bến Sao Rơi', npc: 'minh_triet',
      start: [
        'Minh Triết: Sao Băng Sống và Nhện Tinh Vân tụ ở bến. Chúng ăn bụi sao rồi lớn.',
        'Minh Triết: Hạ 12 con mỗi loại. Cần cấp 71.',
      ],
      end: ['Minh Triết: Dải Tinh Vân Tím đã mở. Màu tím đó là bụi sao đang kết tinh.'],
      obj: { kill: { tan_du_tinh_van: 12, nhen_tinh_van: 12 }, level: 71 },
      reward: rw(71, 'hunt', [['da_cuong_hoa_than_thoai', 2]]) },
    { id: 'c8q3', name: 'Mảnh sao', npc: 'minh_triet',
      start: [
        'Minh Triết: Thợ chế tác Thiết cần Mảnh Tinh Vân để rèn bộ cấp 71–80. Mảnh rơi từ Sao Băng Sống và Nhện Tinh Vân.',
        'Minh Triết: Thu 8 mảnh.',
      ],
      end: ['Minh Triết: Đẹp quá. Chạm vào nghe tiếng ù xa xăm, như bài hát cổ.'],
      obj: { collect: { manh_tinh_van: 8 } },
      reward: rw(72, 'hunt', [['loi_tinh_van', 2]]) },
    { id: 'c8q4', name: 'Dải Tinh Vân Tím', npc: 'minh_triet',
      start: [
        'Minh Triết: Thợ Quan Trắc Méo từng là học trò của tôi. Hệ thống bóp méo họ khi các trạm quan trắc sập.',
        'Minh Triết: Hạ 20 con. Làm ơn đừng nhìn mặt chúng quá lâu. Cần cấp 75.',
      ],
      end: ['Minh Triết: Trạm Quan Trắc Hỏng đã mở. Có một số trợ lý của tôi vẫn bị kẹt trong đó.'],
      obj: { kill: { tho_quan_trac_meo: 20 }, level: 75 },
      reward: rw(75, 'hunt', [['da_cuong_hoa_than_thoai', 2]]) },
    { id: 'c8q5', name: 'Giải cứu người đo sao', npc: 'minh_triet',
      start: [
        'Minh Triết: Bốn trợ lý của tôi bị kẹt trong Trạm Quan Trắc. Mái trạm sập, cửa bị chặn.',
        'Minh Triết: Nói chuyện với từng người trong trạm để đưa họ ra. Quái sẽ cản.',
      ],
      end: ['Bốn trợ lý thoát ra, mặt tái, tay vẫn ôm chặt cuộn bản vẽ.', 'Minh Triết: Cảm ơn! Bản vẽ vẫn còn nguyên. Tôi tưởng mất hết rồi.'],
      obj: { visit: ['tro_ly_1', 'tro_ly_2', 'tro_ly_3', 'tro_ly_4'] },
      reward: rw(76, 'hunt', [['binh_mau_than_thoai', 4]]) },
    { id: 'c8q6', name: 'Kỵ sĩ sao tím', npc: 'minh_triet',
      start: [
        'Minh Triết: Kỵ Sĩ Sao Tím là vệ binh cũ của Viện, nay bị bụi sao nhiễm và đánh theo đội. Chúng canh lối vào Vành Đai Thiên Thạch.',
        'Minh Triết: Hạ 8 tên. Đừng đứng yên khi nghe tiếng sao rơi.',
      ],
      end: ['Minh Triết: Vành Đai đã mở. Đó là nơi cuối cùng bản vẽ chỉ tới.'],
      obj: { kill: { ho_vuong_tinh_van: 8 } },
      reward: rw(77, 'elite', [['da_cuong_hoa_than_thoai', 3]]) },
    { id: 'c8q7', name: 'Hình của ổ khóa', npc: 'minh_triet',
      start: [
        'Minh Triết: Thủ Lĩnh Vành Đai giữ mảnh bản vẽ cuối của Quan Tinh, nhà thiên văn đầu tiên tính ra hình của các cổng.',
        'Minh Triết: Hạ hắn, lấy mảnh đó, ghép lại.',
      ],
      end: [
        'Mảnh bản vẽ ghép vào bản đồ. Các cổng nối nhau thành một hình tròn khép kín với bảy điểm.',
        'Minh Triết: Đây là một ổ khóa. Các cổng không mở thế giới ra. Chúng giữ thứ gì đó lại.',
      ],
      obj: { kill: { thu_linh_vanh_dai: 1 } },
      reward: rw(78, 'elite', [['loi_tinh_van', 3]]) },
    { id: 'c8q8', name: 'Trụ Mộng Tinh Vân', npc: 'minh_triet',
      start: [
        'Minh Triết: Quan Tinh, người chơi số 4. Anh ta tính ra con số bảy: bảy chìa mới đủ để gia cố ổ khóa. Rồi anh ta bị cắm vào trụ.',
        'Minh Triết: Tôi từng đọc bản thảo của anh ta hàng trăm lần. Làm ơn, hãy cho anh ta nghỉ.',
      ],
      end: [
        'Trụ Mộng Tinh Vân vỡ thành bụi sao. Quan Tinh hiện ra như một nhà khoa học mệt mỏi.',
        'Quan Tinh: Số bảy... Cậu là chìa thứ bảy nhưng không bị nuốt. Có lẽ vì cậu chưa từng tin Hệ thống hoàn toàn.',
      ],
      obj: { kill: { tru_mong_tinh_van: 1 } },
      reward: rw(80, 'boss', [['ao_tinh_van', 1], ['loi_tinh_van', 4]], { skillPoints: 3 }) },
    { id: 'c8q9', name: 'Con số bảy', npc: 'minh_triet',
      start: [
        'Minh Triết: Bản vẽ của Quan Tinh cho thấy một điều: Hệ thống không mở cổng. Nó giữ cổng.',
        'Minh Triết: Lữ khách đang đứng ở cổng làng, ông ta muốn gặp cậu.',
      ],
      end: [
        'Lữ khách im lặng rất lâu. Rồi nói: Ta đã nghi từ lâu. Ta không muốn tin.',
        'Minh Triết: Vùng Thần Mộng đã mở. Cậu nên đi, trước khi cơn mộng đó nuốt thêm ai nữa.',
        '[Hệ thống] Đã mở khóa: Chương 9 – Thần Mộng.',
      ],
      obj: {},
      reward: rw(80, 'story', [['binh_mau_than_thoai', 5]]) },
  ];

  (G.QUEST_PARTS = G.QUEST_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
