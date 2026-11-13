/*
 * Nhiệm vụ chính tuyến · Chương 9 – Thần Mộng (cấp 81–90) · giao: Minh Triết, Vy.
 * Cốt truyện: Mỗi chương 9 nhiệm vụ (Chương 10: 8):
 *   1 Truyện (mở map 1) · 2 Hạ (map 1) · 3 Thu nguyên liệu · 4 Hạ + Đạt cấp (map 2) · 5 cơ chế đặc trưng (map 3)
 *   6 Hạ tinh anh · 7 Truyện + Hạ thủ lĩnh (map 4) · 8 Trùm (hang) · 9 Truyện hậu quả.
 * Thưởng: rw(cấp, loại, items, extra) — loại: story | hunt | elite | boss (xem helpers.js).
 */
(function (G) {
  'use strict';
  const { questReward: rw } = G;

  const PART = [
    { id: 'c9q1', name: 'Cổng Mộng', npc: 'minh_triet',
      start: [
        'Minh Triết: Vùng Thần Mộng không có hình thù cố định. Ai bước vào sẽ nhìn thấy điều mình mong nhất.',
        'Minh Triết: Tôi thì thấy một phòng thí nghiệm sạch sẽ, có người pha trà cho tôi. Cậu cẩn thận.',
      ],
      end: ['Minh Triết: Cổng Mộng đã mở. Nhớ rằng những gì cậu thấy không phải lúc nào cũng thật.'],
      obj: {},
      reward: rw(81, 'story', [['binh_mau_than_thoai', 3]]) },
    { id: 'c9q2', name: 'Vườn hoa không có mùi', npc: 'minh_triet',
      start: [
        'Minh Triết: Bướm Mộng và Bóng Gương ở Vườn Hoa Ảo. Hoa ở đó đẹp, nhưng không có mùi, và bướm không có tiếng cánh.',
        'Minh Triết: Hạ 13 con mỗi loại. Cần cấp 81.',
      ],
      end: ['Minh Triết: Vườn Hoa Ảo đã mở. Hoa có mùi hơn rồi, tôi nghĩ vậy.'],
      obj: { kill: { tan_du_than_mong: 13, bong_guong: 13 }, level: 81 },
      reward: rw(81, 'hunt', [['da_cuong_hoa_than_thoai', 2]]) },
    { id: 'c9q3', name: 'Cánh bướm mộng', npc: 'minh_triet',
      start: [
        'Minh Triết: Thợ chế tác Thiết cần Cánh Bướm Mộng để rèn bộ cấp 81–90. Cánh rơi từ bướm và bóng gương.',
        'Minh Triết: Thu 8 cánh. Cẩn thận, nó tan khi nhìn quá lâu.',
      ],
      end: ['Minh Triết: Mỏng như giấc mơ. Thiết sẽ rèn được thứ nhẹ như không khí.'],
      obj: { collect: { canh_buom_mong: 8 } },
      reward: rw(82, 'hunt', [['loi_tinh_van', 2]]) },
    { id: 'c9q4', name: 'Mê cung gương', npc: 'minh_triet',
      start: [
        'Minh Triết: Hoa Ảo Ăn Thịt giăng khắp Mê Cung Gương. Chúng ăn những người đi lạc, rồi lấy khuôn mặt của họ để dụ người khác.',
        'Minh Triết: Hạ 20 con và đạt cấp 85.',
      ],
      end: ['Minh Triết: Tháp Mộng Đảo đã hiện ra giữa mê cung. Một cánh cổng đen nằm ở đỉnh tháp.'],
      obj: { kill: { hoa_ao_an_thit: 20 }, level: 85 },
      reward: rw(85, 'hunt', [['da_cuong_hoa_than_thoai', 2]]) },
    { id: 'c9q5', name: 'Giấc mơ của Vy', npc: 'vy',
      start: [
        'Vy: Cậu có thấy không? Tôi vừa ngủ gật, và tôi thấy đội Bình Minh ngồi quanh bàn ăn. Minh cười, Đoạn lại khoe thanh kiếm, Khăn đang vá áo.',
        'Vy: Tôi muốn ở lại đó. Chỉ một chút thôi. Cậu nghĩ tôi nên làm gì?',
      ],
      end: ['Vy: ...Cảm ơn. Tôi sẽ không quên họ. Cũng không để họ giữ tôi lại.'],
      obj: {},
      reward: rw(86, 'story', [['binh_mau_than_thoai', 4]]),
      choices: [
        { id: 'tam_biet', label: 'Nói lời tạm biệt: "Họ sẽ muốn cô sống tiếp."', title: 'Người Tiễn Đưa', text: 'Vy: Họ luôn bảo tôi cứng đầu. Lần này, tôi nghe theo.' },
        { id: 'o_lai', label: 'Ở lại một chút: "Chúng ta còn thời gian."', title: 'Người Giữ Ký Ức', text: 'Vy: Chỉ một chút thôi nhé. Rồi cậu phải kéo tôi ra.' },
        { id: 'cung_di', label: 'Cùng ngồi xuống: "Cho tôi gặp họ với."', title: 'Người Đồng Hành Giấc Mơ', text: 'Vy: ...Họ sẽ quý cậu đấy. Minh chắc chắn sẽ trêu cậu.' },
      ],
    },
    { id: 'c9q6', name: 'Nghệ nhân gương', npc: 'minh_triet',
      start: [
        'Minh Triết: Nghệ Nhân Gương trong Mê Cung vẽ lại khuôn mặt ai bước vào, rồi giữ họ lại cho tới khi họ quên lối ra.',
        'Minh Triết: Hạ 8 tên. Đừng nhìn vào gương của chúng.',
      ],
      end: ['Minh Triết: Thang lên đỉnh tháp đã mở. Mộng Điệp ở trên đó.'],
      obj: { kill: { ho_vuong_than_mong: 8 } },
      reward: rw(87, 'elite', [['da_cuong_hoa_than_thoai', 3]]) },
    { id: 'c9q7', name: 'Bức tranh cuối', npc: 'minh_triet',
      start: [
        'Minh Triết: Mộng Điệp là họa sĩ. Cô vẽ một thế giới không có cổng, và Hệ thống cho cô quyền biến mơ thành thật.',
        'Minh Triết: Thủ Lĩnh Mê Cung giữ bức tranh cuối của cô. Hạ hắn, lấy nó.',
      ],
      end: [
        'Bức tranh cuối: một cánh đồng hoa, một người đứng một mình, và bầu trời không có vết nứt nào.',
        'Minh Triết: Cô ấy vẽ thế giới không cần ai hi sinh. Chỉ tiếc là cô ấy đã hi sinh chính mình để vẽ nó.',
      ],
      obj: { kill: { thu_linh_me_cung: 1 } },
      reward: rw(88, 'elite', [['loi_tinh_van', 3]]) },
    { id: 'c9q8', name: 'Trụ Mộng Thần Mộng', npc: 'minh_triet',
      start: [
        'Minh Triết: Mộng Điệp, người chơi số 5. Giấc mơ của cô đã nuốt dần cả cô lẫn những người lạc vào.',
        'Minh Triết: Hãy đánh thức cô ấy, nhẹ nhàng nhất có thể.',
      ],
      end: [
        'Trụ Mộng Thần Mộng vỡ như gương. Mộng Điệp ngồi giữa đám cánh bướm, cọ vẽ vẫn trong tay.',
        'Mộng Điệp: Tôi vẽ xong rồi, phải không? Chỉ tiếc là tôi không ở trong bức tranh được.',
      ],
      obj: { kill: { tru_mong_than_mong: 1 } },
      reward: rw(90, 'boss', [['ao_than_mong', 1], ['loi_tinh_van', 4]], { skillPoints: 3 }) },
    { id: 'c9q9', name: 'Một Trụ nữa', npc: 'minh_triet',
      start: [
        'Minh Triết: Bốn Trụ đã giải. Bản vẽ của tôi vừa sáng lên: một vết nứt mới ở Tháp Mộng Đảo, dẫn về phía Sáng Thế.',
        'Minh Triết: Đó là Trụ thứ năm, nơi mọi chuyện bắt đầu.',
      ],
      end: [
        'Lữ khách: Ta chưa bao giờ biết Trụ thứ năm giam ai. Có lẽ không ai muốn biết.',
        '[Hệ thống] Đã mở khóa: Chương 10 – Sáng Thế.',
      ],
      obj: {},
      reward: rw(90, 'story', [['binh_mau_than_thoai', 5]]) },
  ];

  (G.QUEST_PARTS = G.QUEST_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
