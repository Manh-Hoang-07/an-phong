/*
 * Nhiệm vụ chính tuyến · Chương 7 – Long Mạch (cấp 61–70) · giao: Khải, Vy.
 * Cốt truyện: Mỗi chương 9 nhiệm vụ (Chương 10: 8):
 *   1 Truyện (mở map 1) · 2 Hạ (map 1) · 3 Thu nguyên liệu · 4 Hạ + Đạt cấp (map 2) · 5 cơ chế đặc trưng (map 3)
 *   6 Hạ tinh anh · 7 Truyện + Hạ thủ lĩnh (map 4) · 8 Trùm (hang) · 9 Truyện hậu quả.
 * Thưởng: rw(cấp, loại, items, extra) — loại: story | hunt | elite | boss (xem helpers.js).
 */
(function (G) {
  'use strict';
  const { questReward: rw } = G;

  const PART = [
    { id: 'c7q1', name: 'Vết thương của đất', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh: Mạch ngầm của Vùng Long Mạch đang chảy ngược. Nước ngọc tràn ra từ hang, người chạm vào thì ngủ mê không dậy.',
        'Trưởng Thịnh: Vy xin đi cùng lần này. Cô ấy nói trong Vùng có tiếng gọi quen.',
      ],
      end: ['Trưởng Thịnh: Cửa Long Mạch đã mở. Giữ lấy dây an toàn, đá ở đó trơn.'],
      obj: {},
      reward: rw(61, 'story', [['binh_mau_than_thoai', 3]]) },
    { id: 'c7q2', name: 'Cửa Long Mạch', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh: Rắn Mạch Ngọc và Rùa Đá Mạch canh cửa vào. Chúng không ác, nhưng đã mất mạch để theo, nên cắn bất cứ thứ gì.',
        'Trưởng Thịnh: Hạ 12 con mỗi loại. Cần cấp 61.',
      ],
      end: ['Trưởng Thịnh: Suối Long Cốt đã mở. Nước ở đó đục như sữa, đừng uống.'],
      obj: { kill: { tan_du_long_mach: 12, rua_da_mach: 12 }, level: 61 },
      reward: rw(61, 'hunt', [['da_cuong_hoa_than_thoai', 2]]) },
    { id: 'c7q3', name: 'Nước ngọc', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh: Thợ chế tác Thiết cần Mảnh Ngọc Mạch để rèn bộ cấp 61–70. Ngọc rơi từ rắn và rùa.',
        'Trưởng Thịnh: Thu 8 mảnh.',
      ],
      end: ['Trưởng Thịnh: Ngọc này ấm lắm, như còn mạch đập bên trong. Thiết sẽ vui.'],
      obj: { collect: { manh_ngoc_mach: 8 } },
      reward: rw(62, 'hunt', [['loi_tinh_van', 2]]) },
    { id: 'c7q4', name: 'Suối Long Cốt', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh: Linh Thủy Mạch ở suối đang sinh sôi bất thường. Chúng uống mạch rồi lớn như thủy quái.',
        'Trưởng Thịnh: Hạ 20 con và đạt cấp 65 trước khi vào sâu hơn.',
      ],
      end: ['Trưởng Thịnh: Mạch Ngầm Lam đã mở. Ở đó có thứ Vy muốn cậu nhìn.'],
      obj: { kill: { linh_thuy_mach: 20 }, level: 65 },
      reward: rw(65, 'hunt', [['da_cuong_hoa_than_thoai', 2]]) },
    { id: 'c7q5', name: 'Dẫn Hạt Mạch', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh: Có một Hạt Mạch, mảnh nhỏ của dòng chảy, bị kẹt trong Mạch Ngầm Lam. Nếu nó nối lại, mạch của cả Vùng sẽ liền.',
        'Trưởng Thịnh: Đi dọc ba điểm dẫn mạch, chạm vào từng điểm để dẫn Hạt Mạch qua. Quái sẽ tìm cách ngăn.',
      ],
      end: ['Ba điểm dẫn mạch sáng lên liền nhau. Dòng chảy xanh ngọc chảy xuôi, êm như hơi thở.', 'Trưởng Thịnh: Hạt Mạch đã qua. Mạch bắt đầu liền lại.'],
      obj: { visit: ['hat_mach_1', 'hat_mach_2', 'hat_mach_3'] },
      reward: rw(66, 'hunt', [['binh_mau_than_thoai', 4]]) },
    { id: 'c7q6', name: 'Giáp vảy', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh: Điện Vảy Rồng ở phía trong có Hộ Mạch Giáp Vảy và Rồng Con Mất Mẹ. Rồng con thì đừng đánh quá tay, nó chỉ đang tìm mẹ.',
        'Trưởng Thịnh: Hạ 8 Hộ Mạch Giáp Vảy.',
      ],
      end: ['Trưởng Thịnh: Điện Vảy Rồng đã mở. Mạch chảy về phía đó, và Vy nói tiếng gọi cũng từ đó ra.'],
      obj: { kill: { ho_vuong_long_mach: 8 } },
      reward: rw(67, 'elite', [['da_cuong_hoa_than_thoai', 3]]) },
    { id: 'c7q7', name: 'Tiếng gọi người y sư', npc: 'vy',
      start: [
        'Vy: Cậu nghe không? Phép chữa đó... tôi quen. Đội Bình Minh từng có một y sư dùng đúng nhịp thở này.',
        'Vy: Thủ Lĩnh Mạch Vỡ giữ lối vào hang trụ. Hạ nó, tôi muốn biết ai đang gọi.',
      ],
      end: [
        'Vy đứng im rất lâu trước hang. Tiếng gọi ngừng lại, như đang chờ.',
        'Vy: ...Đó là một người chơi. Cô ấy chữa cho mọi người bằng chính máu của mình.',
      ],
      obj: { kill: { thu_linh_mach_vo: 1 } },
      reward: rw(68, 'elite', [['loi_tinh_van', 3]]) },
    { id: 'c7q8', name: 'Trụ Mộng Long Mạch', npc: 'vy',
      start: [
        'Vy: Diệp Tâm. Người chơi số 2. Hệ thống dùng phép chữa của cô ấy để nuôi cổng: thương tích của người khác chảy vào cô ấy.',
        'Vy: Tôi sẽ đi cùng cậu tới cuối cùng. Nhưng tôi không muốn cô ấy phải chịu thêm nữa.',
      ],
      end: [
        'Trụ Mộng Long Mạch vỡ, nước ngọc rút về lòng đất. Diệp Tâm tỉnh lại một khắc.',
        'Vy cầm tay cô ấy lúc cô tan đi. Diệp Tâm: Chữa cho người khác xong thì tự chữa cho mình nữa nhé.',
        'Vy khóc, lần đầu tiên trước mặt cậu.',
      ],
      obj: { kill: { tru_mong_long_mach: 1 } },
      reward: rw(70, 'boss', [['ao_long_mach', 1], ['loi_tinh_van', 4]], { skillPoints: 3 }) },
    { id: 'c7q9', name: 'Đường tới Tinh Hà', npc: 'truong_lang_6',
      start: [
        'Trưởng Thịnh: Lối từ Mạch Ngầm Lam dẫn tới một Tân Đô mới của Hiệp Hội: Tinh Hà. Viện trưởng Minh Triết đang đợi cậu.',
        'Trưởng Thịnh: Ông ta hay quên ăn quên ngủ. Nhưng ông ta đã theo dấu Hệ thống suốt mười năm.',
      ],
      end: ['Trưởng Thịnh: Đi đi. Tôi ở lại giữ Thiên Đô.', '[Hệ thống] Đã mở khóa: Chương 8 – Tinh Vân (Tân Đô VII – Tinh Hà).'],
      obj: {},
      reward: rw(70, 'story', [['binh_mau_than_thoai', 5]]) },
  ];

  (G.QUEST_PARTS = G.QUEST_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
