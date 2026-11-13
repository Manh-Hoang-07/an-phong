/*
 * Nhiệm vụ phụ tuyến.
 */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------- Phụ tuyến
  // req: danh sách nhiệm vụ chính / phụ tuyến phải hoàn thành trước.
  // obj dùng cùng định dạng với nhiệm vụ chính: kill / collect / visit / level.
  // Thưởng thêm: bagPlus (+10 ô túi), shopDiscount (giảm giá), perk, unlockShop, title (danh hiệu).
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

  // ---------------------------------------------------------------- Phụ tuyến mới (theo kế hoạch Tân Đô)
  // Phần thưởng kinh nghiệm theo cấp; title = danh hiệu hiện ở bảng Nhân vật
  const sx = (level, k) => Math.round(G.expToNext(level) * k);
  SIDE_QUESTS.push(
    // ---- Rèn đồ cổ (Thiết), mở sau c3q10: tại Hiệp Hội, chỗ Thợ chế tác Thiết
    { id: 'p6-1', name: 'Lưỡi rèn thử lửa', npc: 'tho_ren', req: ['c3q10'],
      start: ['Thợ chế tác Thiết: Lò Rèn Cổ nung được rồi, nhưng tôi chưa biết thép nó rèn ra bền cỡ nào.', 'Thợ chế tác Thiết: Hạ 15 Người Tuyết quanh lò, để tôi thử độ bền của đồ rèn qua vết cắt của cậu.'],
      end: ['Thợ chế tác Thiết: Hay lắm. Thép này vừa dai vừa sắc. Cầm lấy ít đá cường hóa.'],
      obj: { kill: { nguoi_tuyet: 15 } }, reward: { exp: sx(25, 0.12), gold: 1500, items: [['da_cuong_hoa_cao', 3]] } },
    { id: 'p6-2', name: 'Than cho lò', npc: 'tho_ren', req: ['p6-1'],
      start: ['Thợ chế tác Thiết: Lò muốn nóng đều thì cần than trộn tinh thể băng, thứ Yêu Tinh Băng hay giấu.', 'Thợ chế tác Thiết: Hạ 20 con Yêu Tinh Băng rồi quay lại.'],
      end: ['Thợ chế tác Thiết: Than này cháy xanh. Lần đầu tôi thấy lửa mát.'],
      obj: { kill: { yeu_tinh_bang: 20 } }, reward: { exp: sx(26, 0.14), gold: 2000, items: [['da_cuong_hoa_cao', 4]] } },
    { id: 'p6-3', name: 'Khuôn rèn cổ', npc: 'tho_ren', req: ['p6-2'],
      start: ['Thợ chế tác Thiết: Khuôn rèn cổ của tổ tiên tôi bị Quỷ Búa Băng chiếm làm ổ trên đỉnh núi.', 'Thợ chế tác Thiết: Hạ 6 con để lấy lại. Nó cứng, cậu đừng đánh liều.'],
      end: ['Thợ chế tác Thiết: Khuôn đây rồi! Cậu giúp dòng họ tôi nhiều lắm. Từ nay ai hỏi, tôi nói cậu là học trò của ta.'],
      obj: { kill: { dai_thach_nhan: 6 } }, reward: { exp: sx(28, 0.2), gold: 3000, title: 'Học Trò Thợ Rèn', items: [['sach_ky_nang', 1]] } },

    // ---- Bảng truy nã (Hội trưởng Khải)
    { id: 'p7-1', name: 'Truy nã: kẻ trốn', npc: 'lao_su', req: ['c2q12'],
      start: ['Hội trưởng Khải: Bảng truy nã có tên mấy tên lính Hắc Nguyệt trốn khỏi Làng Chài. Hiệp Hội treo thưởng.', 'Hội trưởng Khải: Hạ 10 Lính Giáo Hắc Nguyệt. Mang chứng cứ về cho tôi, tôi thanh toán.'],
      end: ['Hội trưởng Khải: Đúng danh sách rồi. Tiền thưởng đây. Cậu làm việc gọn.'],
      obj: { kill: { linh_giao_hn: 10 } }, reward: { exp: sx(18, 0.15), gold: 1800, items: [['binh_mau_lon', 5]] } },
    { id: 'p7-2', name: 'Truy nã: kẻ cầm đầu', npc: 'lao_su', req: ['p7-1', 'c3q7'],
      start: ['Hội trưởng Khải: Sau chuyện kho bạc, tôi muốn dọn nốt tàn dư của Hắc Nguyệt quanh Tân Đô.', 'Hội trưởng Khải: Hạ 12 Sát Thủ Bóng Tối. Chúng giỏi lẩn, nên cậu để ý bóng đổ.'],
      end: ['Hội trưởng Khải: Bảng truy nã sạch rồi. Cậu xứng đáng với danh hiệu này.'],
      obj: { kill: { sat_thu_bong_toi: 10 } }, reward: { exp: sx(26, 0.16), gold: 3500, title: 'Thợ Săn Truy Nã', items: [['binh_mau_dac', 5]] } },

    // ---- Nhật ký người Số 3 (Lữ khách)
    { id: 'p8-1', name: 'Nhật ký người Số 3 (1)', npc: 'lu_khach', req: ['c4q5'],
      start: ['Lữ khách: Ta từng viết nhật ký khi còn trong Hệ thống. Nhiều trang rơi trong Thư Viện, hóa thành Linh Hồn Ký Ức.', 'Lữ khách: Hạ 15 con để ta lấy lại những gì còn sót.'],
      end: ['Lữ khách: Những dòng chữ... Ta không nhớ mình từng sợ hãi đến vậy.'],
      obj: { kill: { linh_hon_ky_uc: 15 } }, reward: { exp: sx(37, 0.12), gold: 3000, items: [['da_cuong_hoa_than_thoai', 3]] } },
    { id: 'p8-2', name: 'Nhật ký người Số 3 (2)', npc: 'lu_khach', req: ['p8-1', 'c4q8'],
      start: ['Lữ khách: Trang cuối của nhật ký nằm trong tay Thủ Thư Vô Diện ở Đỉnh Tháp. Hắn đọc từng chữ rồi xóa nó.', 'Lữ khách: Hạ 4 tên Thủ Thư. Ta muốn đọc trang đó trước khi quên.'],
      end: ['Lữ khách: Trang cuối chỉ có một dòng: "Hãy là người chơi đầu tiên không bị nuốt." Cậu đã làm được rồi.'],
      obj: { kill: { thu_thu_vo_dien: 4 } }, reward: { exp: sx(38, 0.2), gold: 5000, title: 'Người Đọc Ký Ức', items: [['sach_ky_nang', 2]] } },

    // ---- Lam Sương ở lại
    { id: 'p9-1', name: 'Lam Sương ở lại (1)', npc: 'lam_suong', req: ['c5q9'],
      start: ['Lam Sương: Tôi muốn ở lại thật sự. Nhưng trước đó tôi cần làm một việc: dọn những thứ Hắc Nguyệt để lại ở Cổng SS.', 'Lam Sương: Hạ 25 Quái Hư Không giúp tôi.'],
      end: ['Lam Sương: Cảm ơn. Lần đầu tôi thấy mình làm điều gì đó không vì ai ra lệnh.'],
      obj: { kill: { quai_hu_khong: 25 } }, reward: { exp: sx(48, 0.12), gold: 8000, items: [['da_cuong_hoa_than_thoai', 3]] } },
    { id: 'p9-2', name: 'Lam Sương ở lại (2)', npc: 'lam_suong', req: ['p9-1'],
      start: ['Lam Sương: Còn lũ Kỵ Sĩ Hư Không từng là thợ săn Hắc Nguyệt, bạn cũ của tôi.', 'Lam Sương: Hạ 10 tên. Tôi không dám tự tay làm.'],
      end: ['Lam Sương: ...Xong rồi. Tôi sẽ ở lại Tân Đô, thật sự ở lại. Cảm ơn, đồng đội.'],
      obj: { kill: { ky_si_hu_khong: 10 } }, reward: { exp: sx(49, 0.2), gold: 12000, title: 'Bạn Của Lam Sương', items: [['da_cuong_hoa_than_thoai', 4]] } },

    // ---- Phụ tuyến Chương 6–10 (mỗi chương một nhiệm vụ, nhẹ, không chặn chính tuyến)
    { id: 'p10-1', name: 'Mài lại lưỡi kiếm', npc: 'tho_ren', req: ['c6q8'],
      start: ['Thợ chế tác Thiết: Lưỡi kiếm cũ của cậu cùn rồi. Tôi mài lại bằng bụi Mảnh Khôi, nhưng cần thử trên Sói Lửa Khôi.', 'Thợ chế tác Thiết: Hạ 20 con.'],
      end: ['Thợ chế tác Thiết: Lưỡi bén như mới. Tôi ghi lại công thức này vào sổ rèn.'],
      obj: { kill: { soi_lua_khoi: 20 } }, reward: { exp: sx(58, 0.1), gold: 9000, items: [['loi_tinh_van', 2]] } },
    { id: 'p11-1', name: 'Nước long mạch', npc: 'ba_thuoc', req: ['c7q8'],
      start: ['Lan: Nước ở Vùng Long Mạch có thể chữa nhiễm đỏ tận gốc, nhưng bị Linh Thủy Mạch giữ.', 'Lan: Hạ 20 con để tôi lấy nước ngọc về bào chế.'],
      end: ['Lan: Thuốc này sẽ cứu được nhiều người. Cầm lấy phần của cậu.'],
      obj: { kill: { linh_thuy_mach: 20 } }, reward: { exp: sx(68, 0.1), gold: 12000, items: [['binh_mau_than_thoai', 5], ['binh_nl_than_thoai', 5]] } },
    { id: 'p12-1', name: 'Đo sao ở trạm quan trắc', npc: 'minh_triet', req: ['c8q5'],
      start: ['Minh Triết: Trạm quan trắc cần đo lại vị trí sao để tôi hiệu chỉnh bản vẽ. Nhưng Thợ Quan Trắc Méo cứ phá thiết bị.', 'Minh Triết: Hạ 15 con để tôi dựng lại máy đo.'],
      end: ['Minh Triết: Số liệu khớp! Tôi sẽ ghi tên cậu vào bản đồ sao. Ngoài ra, xin tặng cậu danh hiệu này.'],
      obj: { kill: { tho_quan_trac_meo: 15 } }, reward: { exp: sx(76, 0.1), gold: 14000, title: 'Người Đo Sao', items: [['da_cuong_hoa_than_thoai', 3]] } },
    { id: 'p13-1', name: 'Giấc mơ về đội Bình Minh', npc: 'vy', req: ['c9q5'],
      start: ['Vy: Sau giấc mơ đó, tôi muốn nhớ đội Bình Minh lâu hơn một khoảnh khắc. Bóng Gương trong Mê Cung có giữ lại hình họ.', 'Vy: Hạ 20 con để tôi lấy lại hình ảnh.'],
      end: ['Vy: Họ vẫn cười như hôm ấy. Cảm ơn cậu đã đi cùng tôi tới đây.'],
      obj: { kill: { bong_guong: 20 } }, reward: { exp: sx(84, 0.1), gold: 16000, title: 'Người Nhớ Bình Minh', items: [['da_cuong_hoa_than_thoai', 5]] } },
    { id: 'p14-1', name: 'Lời hứa cuối cùng', npc: 'lam_suong', req: ['c10q2'],
      start: ['Lam Sương: Tôi đã hứa với Vy sẽ ở lại. Giờ tôi muốn giữ lời hứa theo cách khác: bảo vệ lối vào Sáng Thế cho cậu.', 'Lam Sương: Hạ 20 Cá Ký Ức đang ăn ký ức người qua đường.'],
      end: ['Lam Sương: Lối này an toàn rồi. Giờ tôi mới thật sự là người của Hiệp Hội.'],
      obj: { kill: { ca_ky_uc: 20 } }, reward: { exp: sx(94, 0.1), gold: 20000, title: 'Người Giữ Lời Hứa', items: [['da_cuong_hoa_than_thoai', 5], ['loi_tinh_van', 3]] } },
    // ---- Khảo hạch Tuyệt Kỹ (Hội trưởng Khải): thưởng sách tuyệt kỹ dùng chung, yếu hơn tuyệt kỹ của từng class
    { id: 'ut-1', name: 'Khảo hạch Tuyệt Kỹ I', npc: 'lao_su', req: ['c3q10'],
      start: ['Hội trưởng Khải: Có những tuyệt kỹ không thuộc riêng class nào, ai đủ sức cũng học được. Hiệp Hội giữ vài cuốn.', 'Hội trưởng Khải: Chứng minh cậu đủ sức: hạ 20 Yêu Tinh Băng và 8 Quỷ Búa Băng.'],
      end: ['Hội trưởng Khải: Đạt. Cuốn này dạy Thiên Địa Chấn Động. Đọc trong Túi đồ.'],
      obj: { kill: { yeu_tinh_bang: 20, dai_thach_nhan: 8 } }, reward: { exp: sx(28, 0.2), gold: 4000, items: [['sach_tk_ulChung1', 1]] } },
    { id: 'ut-2', name: 'Khảo hạch Tuyệt Kỹ II', npc: 'lao_su', req: ['ut-1', 'c5q5'],
      start: ['Hội trưởng Khải: Khảo hạch thứ hai khó hơn. Thú Thủ Vô Diện lang thang ở nơi Hệ thống từng giấu dữ liệu.', 'Hội trưởng Khải: Hạ 20 con. Xong việc, tôi trao Ý Chí Bất Diệt.'],
      end: ['Hội trưởng Khải: Ý chí cậu đã được chứng minh. Cầm lấy.'],
      obj: { kill: { thu_thu_vo_dien: 10 } }, reward: { exp: sx(40, 0.15), gold: 8000, items: [['sach_tk_ulChung2', 1]] } },
    { id: 'ut-3', name: 'Khảo hạch Tuyệt Kỹ III', npc: 'lao_su', req: ['ut-2', 'c6q8'],
      start: ['Hội trưởng Khải: Khảo hạch cuối. Kỵ Sĩ Hư Không và Ma Thần Trắng Trơn xé toạc không gian mỗi khi xuất hiện.', 'Hội trưởng Khải: Hạ 15 Kỵ Sĩ Hư Không và 10 Ma Thần Trắng Trơn rồi tôi trao Hư Không Tuyệt Trảm.'],
      end: ['Hội trưởng Khải: Cậu đủ tư cách. Hư Không Tuyệt Trảm là của cậu.'],
      obj: { kill: { ky_si_hu_khong: 10, ma_than_trang_tron: 3 } }, reward: { exp: sx(55, 0.15), gold: 15000, items: [['sach_tk_ulChung3', 1]] } },
  );

  Object.assign(G, { SIDE_QUESTS });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
