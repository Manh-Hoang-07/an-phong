/*
 * Nhiệm vụ chính tuyến · Chương 5 – Cổng Vĩnh Hằng (cấp 41–50).
 *
 * obj: { kill: {monster: n} } | { collect: {item: n} } | { visit: [npc...] } | { level: n, school: true } | {}
 * Thưởng: rw(cấp, loại, items, extra) — loại: story | hunt | elite | boss (xem helpers.js).
 * Thêm nhiệm vụ: thêm một phần tử vào mảng dưới, đúng thứ tự cốt truyện.
 */
(function (G) {
  'use strict';
  const { questReward: rw } = G;

  const PART = [
    { id: 'c5q1', name: 'Bầu trời rách tạc', npc: 'truong_lang_5',
      start: [
        'Trưởng làng Vực: Nhìn lên! Bầu trời đang nứt!',
        'Trưởng làng Vực: Cổng Vĩnh Hằng đang rỉ năng lượng xuống. Quái Hư Không chui qua khe.',
        'Trưởng làng Vực: Cậu phải lên đó. Cầu dẫn lên cổng ở phía đông thành.',
      ],
      obj: {},
      end: [
        'Trưởng làng Vực: Leo lên cầu. Vy đang đợi ở giữa.',
        '[Hệ thống] Cổng Vĩnh Hằng phát năng lượng mạnh. Cầu dẫn đang mở.',
      ],
      reward: rw(41, 'story', [['binh_mau_than_thoai', 5], ['binh_nl_than_thoai', 5]]) },
    { id: 'c5q2', name: 'Leo lên đỉnh cổng', npc: 'vy',
      start: [
        'Vy: Cầu này dài lắm. Quái Hư Không đầy.',
        'Vy: Tiêu diệt 40 con. Tôi dò phía trước.',
      ],
      obj: { kill: { quai_hu_khong: 40 } },
      end: [
        'Vy: Đường sạch. Sảnh Chờ ở phía trên.',
        'Vy: Lam Sương đang ở đó. Cô ta... đổi phe rồi.',
      ],
      reward: rw(41, 'hunt', [['da_cuong_hoa_than_thoai', 5]]) },
    { id: 'c5q2b', name: 'Quỷ trăng đen', npc: 'vy',
      start: [
        'Vy: Mấy con Quỷ Trăng Đen này mang dấu Hắc Nguyệt, nhưng không còn là người nữa.',
        'Vy: Hạ 25 con. Tôi không muốn ai trong chúng nhận ra tôi.',
      ],
      obj: { kill: { quy_trang_den: 25 } },
      end: ['Vy: Xong. Tôi tưởng sẽ thấy ai đó quen. May là không.', 'Vy: Sảnh Chờ ở phía trên. Bọn ký sinh đang tụ ở đó.'],
      reward: rw(43, 'hunt', [['da_cuong_hoa_than_thoai', 3]]) },
    { id: 'c5q2c', name: 'Sinh vật ký sinh', npc: 'vy',
      start: [
        'Vy: Sảnh Chờ Không Gian. Những thứ ký sinh trên người thợ săn bị bắt, rồi lớn lên bằng sức mạnh của họ.',
        'Vy: Hạ 20 con. Đừng để chúng bám lên cậu.',
      ],
      obj: { kill: { sv_ky_sinh_hk: 20 } },
      end: ['Vy: Gọn. Lam Sương đang đợi ở trong sảnh. Cô ấy đổi phe rồi.', 'Vy: Đừng nhìn cô ấy như thế. Tôi đã tha rồi.'],
      reward: rw(45, 'hunt', [['binh_mau_than_thoai', 4]]) },
    { id: 'c5q3', name: 'Tập hợp liên minh', npc: 'vy',
      start: [
        'Vy: Lam Sương, Lữ khách, Thiết... tất cả đều ở đây.',
        'Lam Sương: Vy, tôi nợ cậu. Hôm nay trả.',
        'Lữ khách: Ta dẫn đường. Cậu đánh.',
        'Thợ chế tác Thiết: Vũ khí tôi rèn, không gãy đâu!',
        'Vy: Liên Minh. Lần đầu tiên sau ba năm.',
      ],
      obj: {},
      end: [
        '[Hệ thống] Buff Liên Minh: +20% toàn bộ chỉ số.',
        'Vy: Thiên ở đỉnh cổng. Đi.',
      ],
      reward: rw(46, 'story', [['binh_mau_than_thoai', 10], ['binh_nl_than_thoai', 10]], { perk: 'lien_minh' }) },
    { id: 'c5q3b', name: 'Chuẩn bị trận chiến', npc: 'truong_lang_5',
      start: [
        'Trưởng làng Vực: Liên minh đã đủ người. Giờ cậu phải chọn cách tham chiến, vì tôi không thể cho cậu hết mọi thứ.',
        'Trưởng làng Vực: Thiên từng là học trò của tôi. Tôi biết hắn sẽ đánh theo kiểu nào. Cậu chọn đi.',
      ],
      obj: {},
      // Chọn thoại: chỉ đổi danh hiệu và câu đáp, phần thưởng như nhau
      choices: [
        { id: 'mui', label: 'Dẫn đầu mũi nhọn: "Tôi đi trước."', title: 'Mũi Nhọn Liên Minh', text: 'Hội trưởng Khải: Đúng như tôi đoán. Đừng chết sớm quá.' },
        { id: 'khien', label: 'Giữ đội hình: "Tôi che cho mọi người."', title: 'Lá Chắn Liên Minh', text: 'Hội trưởng Khải: Người giữ đội hình quan trọng hơn người xông lên. Nhớ điều đó.' },
        { id: 'mat', label: 'Dò đường phía sau: "Tôi tìm điểm yếu của hắn."', title: 'Mắt Liên Minh', text: 'Hội trưởng Khải: Hắn có một điểm yếu duy nhất: hắn vẫn là con người. Tìm nó.' },
      ],
      end: ['[Hệ thống] Đội hình Liên Minh đã sẵn sàng.', 'Hội trưởng Khải: Thiên ở Đỉnh Cổng. Đi đi.'],
      reward: rw(46, 'story', [['binh_mau_than_thoai', 5], ['binh_nl_than_thoai', 5]]) },
    { id: 'c5q4', name: 'Thầy và trò', npc: 'vy',
      start: [
        'Vy: Thiên. Hắn đứng đó, mặt nạ trăng khuyết.',
        'Vy: Hắn 3 giai đoạn. Tráo vũ khí, tạo vùng không trọng lực, bùng nổ lõi đỏ.',
        'Vy: Hội trưởng Khải từng dạy cả hai chúng tôi. Hắn là học trò giỏi nhất.',
        'Vy: Nhưng giờ... cậu là người ngăn hắn lại.',
      ],
      obj: { kill: { kieu_deo_mat_na: 1 } },
      end: [
        'Mặt nạ trăng khuyết vỡ đôi. Thiên ngã xuống, mặt lộ ra.',
        'Thiên: Hội trưởng... cậu nói đúng. Có người dừng tôi lại. Người chơi thứ 7.',
        'Thiên: Nhưng cậu hiểu không? Hệ thống đang ăn thế giới này. Cổng Vĩnh Hằng là cách duy nhất...',
        'Vy: Có cách khác. Cậu tin tôi.',
        'Thiên: ...Đi. Bên kia cổng... thực thể thật sự... chờ cậu.',
        '[Hệ thống] Nhận được: Mặt Nạ Trăng Khuyết.',
      ],
      reward: rw(45, 'boss', [['mat_na_trang_khuyet', 1]]) },
    { id: 'c5q5', name: 'Thực thể bên kia cổng', npc: 'vy',
      start: [
        'Vy: Đây là tâm điểm. Bên kia cổng... Thực Thể.',
        'Vy: Nó là bản thể ý thức đứng sau Hệ thống. Bàn tay khổng lồ xé nứt không gian.',
        'Vy: Nó bắn chùm laser hư không quét toàn sàn đấu. Phải né.',
        'Vy: Đây là trận cuối. Tất cả chúng ta ở đây. Đi!',
      ],
      obj: { kill: { thuc_the_bkc: 1 } },
      end: [
        'Thực Thể Bên Kia Cổng gầm lên, không gian nứt vỡ xung quanh.',
        'Bàn tay khổng lồ co lại. Khe hở đóng dần. Ánh sáng trắng nuốt hết.',
        'Mảnh Hệ Thống cuối cùng rơi xuống, lấp lánh.',
        '[Hệ thống] ...',
        '[Hệ thống] Người chơi thứ 7. Ngươi đã làm điều không thể.',
        '[Hệ thống] Hệ thống... ngừng hoạt động. Cổng đóng lại.',
        'Vy: Xong rồi. Thật sự xong rồi.',
      ],
      reward: rw(50, 'boss', [['manh_he_thong', 1]]) },
    { id: 'c5q6', name: 'Người chơi số 7', npc: 'vy',
      start: [
        'Vy: Về Tân Đô thôi. Mọi người đợi.',
        'Vy: Bầu trời đã liền lại. Không còn khe hở, không còn cổng.',
        'Vy: Hệ thống tắt. Nhưng chúng ta vẫn còn. Cậu vẫn còn.',
        'Vy: Cảm ơn, đồng đội.',
      ],
      obj: {},
      end: [
        '[Hệ thống] ... Tự do.',
        'Hội trưởng Khải: Cậu về rồi. Tân Đô vẫn đứng.',
        'Lữ khách: Hệ thống tắt, nhưng thế giới vẫn quay. Cậu làm được điều mà sáu người trước không làm được.',
        'Lam Sương: Vy, tôi ở lại. Lần này, thật sự ở lại.',
        'Thợ chế tác Thiết: Lò Rèn vẫn nóng. Cậu cần gì, cứ đến.',
        'Vy: Người chơi thứ 7. Không, cậu là thợ săn. Thợ săn số 7.',
        '— Kết thúc: Thức Tỉnh —',
        '[Hệ thống] Chế độ End-game đã mở. Cổng SS xuất hiện ở phía đông Tân Đô.',
      ],
      reward: rw(50, 'story', [['sach_ky_nang_vo_dinh', 1]], { skillPoints: 10, perk: 'tu_do' }) },
  ];

  (G.QUEST_PARTS = G.QUEST_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
