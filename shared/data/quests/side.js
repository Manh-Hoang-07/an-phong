/*
 * Nhiệm vụ phụ tuyến.
 */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------- Phụ tuyến
  // req: danh sách nhiệm vụ chính / phụ tuyến phải hoàn thành trước.
  // obj dùng cùng định dạng với nhiệm vụ chính: kill / collect / visit / level.
  // Thưởng thêm: bagPlus (+10 ô túi), shopDiscount (giảm giá), perk, unlockShop.
  const SIDE_QUESTS = [
    // ---- Đội Bình Minh (Vy), mở sau c2q6
    { id: 'p1-1', name: 'Kỷ vật thứ nhất', npc: 'vy', req: ['c2q6'],
      start: [
        'Vy: Ba năm trước, đội Bình Minh của tôi bị Hắc Nguyệt xóa sổ. Tôi là người duy nhất sống sót.',
        'Vy: Minh, Đoạn, Khăn... mỗi người còn một kỷ vật nằm lại trong các cổng. Tôi chưa từng đủ can đảm đi tìm.',
        'Vy: Giúp tôi mang thẻ bài của Minh về. Nó rơi trong Rừng Sương, chắc bọn Yêu Tinh nhặt được.',
      ],
      end: ['Vy: ...Thẻ bài của Minh. Cậu ấy vẫn luôn đi đầu, đúng là đồ ngốc.', 'Vy: Cảm ơn. Tôi sẽ giữ nó cẩn thận.'],
      obj: { collect: { the_bai_minh: 3 } },
      reward: { exp: 900, gold: 400, items: [['binh_mau_vua', 3]] } },
    { id: 'p1-2', name: 'Kỷ vật thứ hai', npc: 'vy', req: ['p1-1'],
      start: [
        'Vy: Đoạn từng nói thanh kiếm của cậu ấy sẽ không bao giờ gãy. Rồi cậu ấy gãy trước thanh kiếm.',
        'Vy: Nửa lưỡi kiếm còn nằm trong Hang Pha Lê. Bọn Bộ Xương canh giữ nó.',
        'Vy: Mang về đây, tôi muốn tự tay lau sạch băng trên đó.',
      ],
      end: ['Vy: Đoạn... cậu vẫn cứng đầu như ngày nào.', 'Vy: Tôi sẽ rèn lại nó thành một con dao nhỏ. Để không quên.'] ,
      obj: { collect: { doan_kiem_ga: 2 } },
      reward: { exp: 1200, gold: 600, items: [['da_cuong_hoa', 3]] } },
    { id: 'p1-3', name: 'Kỷ vật thứ ba', npc: 'vy', req: ['p1-2'],
      start: [
        'Vy: Khăn là người cuối cùng che cho tôi khi cổng sập. Chiếc khăn của cô ấy rơi lại Đầm Lầy Mục.',
        'Vy: Nước ở đó nhiễm đỏ, quái vật canh khắp nơi. Nhưng tôi cần nó về.',
        'Vy: Tìm ba chiếc khăn đỏ sẫm. Chúng dễ lẫn trong bùn lắm, cẩn thận.',
      ],
      end: ['Vy: Khăn... Cô ấy luôn nói chiếc khăn này che được mọi thứ, trừ cái chết.', 'Vy: Còn một người nữa. Lam Sương. Cô ấy vẫn còn sống.'] ,
      obj: { collect: { khan_binh_minh: 3 } },
      reward: { exp: 1500, gold: 800, items: [['binh_mau_lon', 3]] } },
    { id: 'p1-4', name: 'Người thứ tư', npc: 'vy', req: ['p1-3', 'c3q8'],
      start: [
        'Vy: Sau chuyện ở Kho bạc, tôi đã gặp lại Lam Sương. Cô ấy không còn là kẻ thù.',
        'Vy: Cô ấy nói đội Bình Minh chưa từng chết. Chỉ là chúng tôi đã quên cách sống cùng nhau.',
        'Vy: Đây là mảnh cuối. Từ hôm nay, huy hiệu Bình Minh thuộc về cậu. Đừng để nó rơi vào tay Hắc Nguyệt.',
      ],
      end: [
        'Vy: Đội Bình Minh không còn ai. Nhưng ít nhất, chúng tôi đã có người nhớ đến họ.',
        '[Hệ thống] Nhận nội tại: Đồng Đội Bình Minh.',
      ],
      obj: { visit: ['vy'] },
      reward: { exp: 2200, gold: 1200, items: [['huy_hieu_binh_minh', 1]], perk: 'binh_minh' } },

    // ---- Cửa hàng mở rộng (Chủ tiệm Tư), mở sau chương 1
    { id: 'p2-1', name: 'Hàng thất lạc', npc: 'tap_hoa', req: ['q10'],
      start: [
        'Tư: Cậu đến đúng lúc! Lô hàng mới của tôi bị quái tha mất khi đi ngang Rừng Sương.',
        'Tư: Kiện hàng nào cũng có dấu đỏ của tiệm. Nhặt lại giúp tôi năm kiện, tôi giảm giá cho!',
        'Tư: Mà này, đừng kể với Bảo bên kho nhé. Hắn sẽ cười tôi cả tháng.',
      ],
      end: ['Tư: Ha! Đủ cả! Từ hôm nay, khách quen của Tư được giảm 10% mọi món.', 'Tư: Cầm lấy ít xu, coi như tiền công. Lần sau nhớ ghé!'] ,
      obj: { collect: { hang_that_lac: 5 } },
      reward: { exp: 600, gold: 900, shopDiscount: 0.1 } },
    { id: 'p2-2', name: 'Chuyến hàng cuối', npc: 'tap_hoa', req: ['p2-1'],
      start: [
        'Tư: Lô hàng cuối nằm sâu trong cổng hạng C. Tôi già rồi, không dám vào.',
        'Tư: Tìm thêm tám kiện nữa. Xong chuyến này, tôi sẽ giảm giá 20% cho cậu và mở thêm hàng mới.',
      ],
      end: ['Tư: Tốt lắm! Từ giờ cậu là khách VIP của tiệm. Giảm 20%, nhớ đừng nói giá cho ai khác.', 'Tư: Mà này, nếu thấy món gì lạ trong cổng, mang về đây. Tôi trả giá cao.'] ,
      obj: { collect: { hang_that_lac: 8 } },
      reward: { exp: 1400, gold: 1800, items: [['da_cuong_hoa_trung', 2]], shopDiscount: 0.2 } },

    // ---- Kho chật quá (Quản kho Bảo), mở sau c2q2
    { id: 'p3-1', name: 'Kho chật quá (1)', npc: 'thu_kho', req: ['c2q2'],
      start: [
        'Bảo: Kho của Hiệp Hội chật kín rồi. Tôi dọn ba ngày nay vẫn chưa thấy chìa khóa dự phòng.',
        'Bảo: Chắc nó rơi trong Đầm Lầy Mục lúc tôi đi kiểm kê. Nhặt giúp tôi sáu chiếc, tôi sẽ sửa lại kho cho cậu.',
      ],
      end: ['Bảo: Đây rồi! Từ hôm nay cậu được thêm 10 ô túi. Đừng nhồi nhét quá, hỏng hết đồ đấy.'] ,
      obj: { collect: { chia_khoa_kho: 6 } },
      reward: { exp: 700, gold: 500, bagPlus: 1 } },
    { id: 'p3-2', name: 'Kho chật quá (2)', npc: 'thu_kho', req: ['p3-1'],
      start: [
        'Bảo: Kho vẫn chật. Cậu mang về nhiều đồ quá rồi đấy.',
        'Bảo: Tôi tìm thấy bản vẽ mở rộng tầng hai. Cần thêm tám chìa khóa nữa để mở cửa kho phụ.',
      ],
      end: ['Bảo: Xong! Thêm 10 ô nữa. Cậu mà làm hỏng kho là tôi bắt đền đấy.'] ,
      obj: { collect: { chia_khoa_kho: 8 } },
      reward: { exp: 1200, gold: 900, bagPlus: 1 } },
    { id: 'p3-3', name: 'Kho chật quá (3)', npc: 'thu_kho', req: ['p3-2'],
      start: [
        'Bảo: Tầng kho cuối cùng. Nếu mở được, cậu sẽ có chỗ chứa đồ thoải mái đến hết đời thợ săn.',
        'Bảo: Mười chìa khóa nữa. Tôi tin cậu.',
      ],
      end: ['Bảo: Thành công! Túi cậu giờ rộng gấp đôi người thường. Đừng khoe với Hội trưởng, ông ấy sẽ bắt tôi dọn kho tiếp.'] ,
      obj: { collect: { chia_khoa_kho: 10 } },
      reward: { exp: 2000, gold: 1500, bagPlus: 1 } },

    // ---- Thuốc chữa nhiễm đỏ (Dược sư Lan), mở sau c2q2
    { id: 'p5-1', name: 'Thảo dược đỏ', npc: 'ba_thuoc', req: ['c2q2'],
      start: [
        'Lan: Em trai tôi bị nước đỏ nhiễm vào người. Thuốc thường không chữa được.',
        'Lan: Chỉ có thảo dược đỏ mọc trong Đầm Lầy Mục mới giữ được mạng cho nó. Tìm giúp tôi năm nhánh.',
        'Lan: Cẩn thận, Ếch Độc canh mấy bụi cỏ đó.',
      ],
      end: ['Lan: Đủ rồi... Cảm ơn cậu. Tôi sẽ bào chế ngay.', 'Lan: Nếu cậu tìm thêm độc tố đặc, tôi có thể làm thuốc mạnh hơn.'] ,
      obj: { collect: { thao_duoc_do: 5 } },
      reward: { exp: 800, gold: 500, items: [['binh_mau_vua', 5]] } },
    { id: 'p5-2', name: 'Thuốc chữa nhiễm đỏ', npc: 'ba_thuoc', req: ['p5-1'],
      start: [
        'Lan: Thuốc đã đỡ, nhưng em tôi vẫn sốt. Tôi cần độc tố đặc từ Nhện Cống Ngầm để trung hòa nước đỏ.',
        'Lan: Ba lọ là đủ. Cậu vào Thành Phố Chìm giúp tôi nhé.',
      ],
      end: [
        'Lan: Được rồi... Em tôi sẽ sống.',
        'Lan: Đây là thuốc chữa nhiễm đỏ tôi làm từ công thức mới. Từ giờ cậu mua được ở tiệm tôi, và tôi tặng cậu 5 bình.',
      ],
      obj: { collect: { doc_to_dac: 3 } },
      reward: { exp: 1600, gold: 900, items: [['thuoc_nhiem_do', 5]], unlockShop: 'thuoc_nhiem_do' } },
  ];

  Object.assign(G, { SIDE_QUESTS });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
