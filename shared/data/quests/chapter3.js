/*
 * Nhiệm vụ chính tuyến · Chương 3 – Lò Rèn Cổ (cấp 21–30).
 *
 * obj: { kill: {monster: n} } | { collect: {item: n} } | { visit: [npc...] } | { level: n, school: true } | {}
 * Thưởng: rw(cấp, loại, items, extra) — loại: story | hunt | elite | boss (xem helpers.js).
 * Thêm nhiệm vụ: thêm một phần tử vào mảng dưới, đúng thứ tự cốt truyện.
 */
(function (G) {
  'use strict';
  const { questReward: rw } = G;

  const PART = [
    { id: 'c3q1', name: 'Lưỡi kiếm không xuyên', npc: 'tho_ren_2',
      start: [
        'Thợ chế tác Phong: Vũ khí cậu dùng bây giờ... chỉ là thép pha pha lê. Đánh quái lõi cổng mạnh hơn thì không xuyên nổi.',
        'Thợ chế tác Phong: Dòng họ thợ rèn cổ đại tôi từng nói tới... Lò Rèn Cổ dưới núi tuyết phía bắc. Nơi đó mới rèn được vũ khí thật sự.',
        'Thợ chế tác Phong: Cổng vừa mở ở đó. Nhưng lạnh lắm. Mang đủ thuốc.',
      ],
      obj: {},
      end: [
        'Thợ chế tác Phong: Cổng đã mở ở phía bắc Tân Đô. Vy sẽ đi cùng cậu.',
        '[Hệ thống] Đã mở khóa: Chương 3 – Lò Rèn Cổ.',
      ],
      reward: rw(21, 'story', [['binh_mau_lon', 5], ['binh_nl_lon', 5]]) },
    { id: 'c3q2', name: 'Đường lên núi băng', npc: 'vy',
      start: [
        'Vy: Chân núi lạnh thật. Sói Tuyết đầy nơi này.',
        'Vy: Dọn 25 con để mở đường. Tôi dò phía trên.',
      ],
      obj: { kill: { soi_tuyet: 25 } },
      end: ['Vy: Đường sạch. Nhưng gió từ hẻm núi thổi buốt. Cẩn thận bục đá trơn.'],
      reward: rw(21, 'hunt', [['binh_mau_dac', 3]]) },
    { id: 'c3q3', name: 'Thu thập băng tinh', npc: 'vy',
      start: [
        'Vy: Băng Tinh thượng thừa mọc trong hẻm núi. Lò Rèn cần chúng để nung lửa.',
        'Vy: Thu 8 viên. Người Tuyết canh khu này, cẩn thận.',
      ],
      obj: { collect: { bang_tinh: 8 } },
      end: ['Vy: Đủ rồi. Lò Rèn Cổ ở phía trong hẻm. Nóng và lạnh cùng lúc... kỳ lạ.'],
      reward: rw(23, 'hunt', [['da_cuong_hoa_cao', 2]]) },
    { id: 'c3q4', name: 'Mồi lửa than cổ', npc: 'vy',
      start: [
        'Vy: Lò Rèn đã tắt từ trăm năm. Cần Than Cổ để nhóm lại.',
        'Vy: Người Tuyết mang than trong bụng. Hạ 6 con, lấy than.',
        'Thợ chế tác Thiết: (từ xa) Nhớ giữ than nóng! Để nguội là hỏng!',
      ],
      obj: { collect: { than_co: 6 } },
      end: [
        'Vy: Than còn nóng. Lò Rèn bắt đầu rực sáng.',
        'Thợ chế tác Thiết: Tốt lắm! Nhưng lõi lò rèn ở đỉnh núi. Băng Long canh nó.',
      ],
      reward: rw(23, 'hunt', [['da_cuong_hoa_cao', 2]]) },
    { id: 'c3q5', name: 'Thức tỉnh Lò Rèn', npc: 'vy',
      start: [
        'Vy: Băng Long. Nó phun băng diện rộng, đóng băng toàn sàn đấu.',
        'Vy: Khi nó yếu, nó nổi giận. Nhảy qua sóng băng, đừng đứng yên.',
        'Vy: Hạ nó, lấy Trái Tim Băng Long. Đó là chìa khóa của Lò Rèn.',
      ],
      obj: { kill: { bang_long: 1 } },
      end: [
        'Băng Long rống lên lần cuối, vỡ thành hàng nghìn mảnh băng.',
        'Giữa đống băng, Trái Tim Băng Long rực sáng xanh, vẫn đập.',
        'Vy: Lõi Lò Rèn... Nó phản ứng với Trái Tim. Lò Rèn đã thức tỉnh.',
        'Thợ chế tác Thiết: (từ xa) Mang Trái Tim về, ta rèn vũ khí!',
        'Hội trưởng Khải: (qua đường truyền) Tân Đô bị tấn công! Dùng Trạm dịch chuyển ở Tân Đô III về ngay, 300 xu, đừng đi bộ!',
      ],
      reward: rw(28, 'boss', [['trai_tim_bang_long', 1]]) },
    { id: 'c3q6', name: 'Báo động đỏ Tân Đô', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Tân Đô vừa bị tấn công! Quái tràn vào Quận Thương Mại!',
        'Hội trưởng Khải: Vy và lính Hiệp Hội đã giữ được ba đợt đầu, nhưng quái vẫn tràn từ cống lên.',
        'Hội trưởng Khải: Ra Quận Thương Mại (cổng ở cuối phố), phòng thủ cho tới khi dọn sạch 24 Quái Rác. Mỗi đợt lính sẽ đỡ cho cậu một ít.',
        'Hội trưởng Khải: Mà kho bạc Hiệp Hội bị đột kích trong lúc thành bị tấn công! Kẻ dẫn đầu... là Lam Sương.',
      ],
      obj: { kill: { quai_rac_td: 24 } },
      end: [
        'Quận Thương Mại im lặng trở lại. Dân thường bắt đầu mở cửa tiệm.',
        'Hội trưởng Khải: Mặc giáp này. Vệ Binh Tân Đô cần cậu.',
        'Hội trưởng Khải: Kho bạc ở dưới Hiệp Hội. Vy đang giữ đó. Đi nhanh!',
      ],
      reward: rw(22, 'hunt', [['ao_bang_long', 1]]) },
    { id: 'c3q7', name: 'Kho bạc bị đột kích', npc: 'vy',
      start: [
        'Vy: Lam Sương. Lần này cô ta có phân thân bóng tối.',
        'Vy: Lần trước cô ta bỏ chạy. Lần này... không cho cô ta chạy nữa.',
        'Vy: Hạ cô ta. Lấy mảnh Lõi Đỏ cổ đại cô ta đang cầm.',
      ],
      obj: { kill: { lam_suong_2: 1 } },
      end: [
        'Lam Sương gục lần nữa. Lần này, cô ta không chạy.',
        'Lam Sương: Vy... cậu mạnh hơn rồi. Hắn nói đúng, Hệ thống đang ăn thế giới này...',
        'Vy: Im. Tôi không muốn nghe.',
        'Lam Sương: Hắn gom lõi đỏ... để mở Cổng Vĩnh Hằng. Tiêu diệt nguồn gốc Hệ thống...',
        'Vy cúi xuống, nhìn Lam Sương rất lâu.',
      ],
      reward: rw(25, 'elite', [['manh_loi_do_co_dai', 1]]) },
    { id: 'c3q8', name: 'Quyết định của Vy', npc: 'vy',
      start: [
        'Vy: ...Tôi không giết cô ta.',
        'Vy: Ba năm trước, Lam Sương đã che tôi khi đội Bình Minh bị tấn công. Cô ta lấy đòn thay tôi.',
        'Vy: Tôi nợ cô ta một mạng. Hôm nay trả xong.',
        'Vy: Nhưng cô ta nói về Cổng Vĩnh Hằng... và Hệ thống là ký sinh trùng. Tôi cần xác nhận.',
      ],
      obj: {},
      end: [
        '[Hệ thống] Nâng cấp kỹ năng đồng đội: Vy.',
        'Vy: Về Tân Đô. Tôi cần nói chuyện riêng với Hội trưởng.',
      ],
      reward: rw(25, 'story', []) },
    { id: 'c3q9', name: 'Bí mật của thầy', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Cậu nên nghe câu chuyện này. Về Kẻ Đeo Mặt Nạ Trăng.',
        'Hội trưởng Khải: Tên thật của hắn là Thiên. Hắn từng là học trò giỏi nhất của tôi.',
        'Hội trưởng Khải: Thiên là "Người chơi thứ 6". Hắn phát hiện ra sự thật về Hệ thống trước ai hết.',
        'Hội trưởng Khải: Hắn gom lõi đỏ để mở Cổng Vĩnh Hằng, định tiêu diệt nguồn gốc Hệ thống. Bất chấp hậu quả.',
      ],
      obj: {},
      end: [
        '[Hệ thống] Nhận nội tại "Ý Chí Thầy Truyền".',
        'Hội trưởng Khải: Cậu là người chơi thứ 7. Hệ thống chọn cậu không phải ngẫu nhiên.',
        'Hội trưởng Khải: Cậu là hy vọng duy nhất ngăn Thiên lại. Nhưng trước tiên, cậu cần vũ khí xứng tầm.',
      ],
      reward: rw(26, 'story', [['sach_ky_nang', 1]], { perk: 'y_chi_thay' }) },
    { id: 'c3q10', name: 'Vũ khí từ lõi cổng', npc: 'tho_ren',
      start: [
        'Thợ chế tác Thiết: Trái Tim Băng Long, Lõi Lò Rèn, Mảnh Lõi Đỏ cổ đại... đủ rồi!',
        'Thợ chế tác Thiết: Ta sẽ rèn cho cậu vũ khí đầu tiên từ Lõi Cổng. Hạng B!',
        'Thợ chế tác Thiết: Đây là vũ khí theo class của cậu. Nhận đi.',
      ],
      obj: {},
      end: [
        'Thợ chế tác Thiết: Vũ khí hạng B! Xuyên được giáp quái lõi cổng.',
      ],
      reward: rw(28, 'story', [['da_cuong_hoa_cao', 5], ['sach_ky_nang', 1]], { craftWeapon: true }) },
    { id: 'c3q11', name: 'Cổng thành cổ', npc: 'tho_ren',
      start: [
        'Thợ chế tác Thiết: Vũ khí xong rồi. Giờ tới chuyện khác, chuyện tôi chưa nói với ai.',
        'Thợ chế tác Thiết: Phía đông Lò Rèn là Vách Đá Gió Thần. Sổ rèn của tổ tiên tôi ghi rằng có một cánh cổng cổ ở đó, bị Hệ thống phong ấn cả trăm năm.',
        'Thợ chế tác Thiết: Người từng canh cổng đó là một người chơi đã bỏ trốn khỏi Hệ thống. Ông ta đang đứng ngay cạnh cổng làng này, áo choàng tím. Đi gặp ông ta đi.',
      ],
      obj: { visit: ['lu_khach'] },
      end: [
        'Thợ chế tác Thiết: Ông ta chịu nói chuyện với cậu rồi à? Hiếm đấy.',
        'Thợ chế tác Thiết: Nhớ ghé tôi trước khi đi xa. Đồ rèn đủ bậc rồi, nhưng thuốc thì cậu phải tự mang.',
        '[Hệ thống] Đã mở khóa: Chương 4 – Tầng Trời Thứ Bảy.',
      ],
      reward: rw(29, 'story', [['binh_mau_dac', 3]]) },
  ];

  (G.QUEST_PARTS = G.QUEST_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
