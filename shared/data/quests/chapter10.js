/*
 * Nhiệm vụ chính tuyến · Chương 10 – Sáng Thế (cấp 91–100) · giao: Minh Triết, Lăng.
 * Cốt truyện: Mỗi chương 9 nhiệm vụ (Chương 10: 8):
 *   1 Truyện (mở map 1) · 2 Hạ (map 1) · 3 Thu nguyên liệu · 4 Hạ + Đạt cấp (map 2) · 5 cơ chế đặc trưng (map 3)
 *   6 Hạ tinh anh · 7 Truyện + Hạ thủ lĩnh (map 4) · 8 Trùm (hang) · 9 Truyện hậu quả.
 * Thưởng: rw(cấp, loại, items, extra) — loại: story | hunt | elite | boss (xem helpers.js).
 */
(function (G) {
  'use strict';
  const { questReward: rw } = G;

  const PART = [
    { id: 'c10q1', name: 'Biên giới khởi nguyên', npc: 'minh_triet',
      start: [
        'Minh Triết: Qua Tháp Mộng Đảo là Vùng Sáng Thế. Mảnh Hệ thống trong túi cậu đang phát sáng như chưa từng.',
        'Minh Triết: Nếu bản vẽ của tôi đúng, đây là nơi ổ khóa nằm. Cậu sắp thấy thứ giữ các cổng suốt ba trăm năm.',
      ],
      end: ['Minh Triết: Đồng Bằng Khởi Nguyên đã mở. Cậu đi trước. Tôi viết lại mọi thứ ở đây.'],
      obj: {},
      reward: rw(91, 'story', [['binh_mau_than_thoai', 4]]) },
    { id: 'c10q2', name: 'Đồng bằng khởi nguyên', npc: 'minh_triet',
      start: [
        'Minh Triết: Hạt Giống Ánh Sáng và Cá Ký Ức là những quái đầu tiên ở Sáng Thế. Chúng sinh ra từ ký ức tan vỡ.',
        'Minh Triết: Hạ 15 con mỗi loại. Cần cấp 91.',
      ],
      end: ['Minh Triết: Rừng Ánh Sáng đã mở. Ánh sáng ở đó không làm hại, nhưng cũng không dễ chịu.'],
      obj: { kill: { tan_du_sang_the: 15, ca_ky_uc: 15 }, level: 91 },
      reward: rw(91, 'hunt', [['da_cuong_hoa_than_thoai', 3]]) },
    { id: 'c10q3', name: 'Biển ký ức', npc: 'minh_triet',
      start: [
        'Minh Triết: Thợ chế tác Thiết cần Mảnh Ký Ức để rèn bộ cấp 91–100. Mảnh rơi từ Hạt Giống Ánh Sáng và Cá Ký Ức.',
        'Minh Triết: Thu 10 mảnh. Chúng là ký ức của người chơi cũ, hãy giữ gìn.',
      ],
      end: ['Minh Triết: Mỗi mảnh là một khoảnh khắc ai đó từng hạnh phúc. Tôi sẽ cất giữ cẩn thận.'],
      obj: { collect: { manh_ky_uc: 10 } },
      reward: rw(93, 'hunt', [['loi_tinh_van', 3]]) },
    { id: 'c10q4', name: 'Ba cánh cửa', npc: 'minh_triet',
      start: [
        'Minh Triết: Rừng Ánh Sáng có ba cánh cửa cổ. Mỗi cánh dẫn tới một nơi cậu từng trải qua: người cần cứu, nơi cần giữ, đường cần dẫn.',
        'Minh Triết: Chạm vào cả ba cánh cửa và dọn thiên thần rỗng đang canh giữ. Nó sẽ thử cậu bằng cả ba điều.',
      ],
      end: ['Ba cánh cửa sáng lên cùng lúc, mở ra một con đường dẫn lên Ngai Sáng Thế.', 'Minh Triết: Cậu đã qua cả ba thử thách của Vùng. Lên đỉnh thôi.'],
      obj: { visit: ['cua_sang_1', 'cua_sang_2', 'cua_sang_3'], kill: { thien_than_rong: 20 } },
      reward: rw(95, 'hunt', [['binh_mau_than_thoai', 5]]) },
    { id: 'c10q5', name: 'Người gác ngai', npc: 'minh_triet',
      start: [
        'Minh Triết: Người Gác Ngai và Bản Sao Số 7 canh giữ lối lên ngai. Bản Sao đánh y như cậu, hãy đề phòng.',
        'Minh Triết: Hạ 8 tên Người Gác Ngai.',
      ],
      end: ['Minh Triết: Ngai Sáng Thế đã hiện ra. Ở đó có một người đang đợi cậu.'],
      obj: { kill: { ho_vuong_sang_the: 8 } },
      reward: rw(96, 'elite', [['da_cuong_hoa_than_thoai', 4]]) },
    { id: 'c10q6', name: 'Lăng', npc: 'lang_hinh',
      start: [
        'Lăng: Ngươi tới rồi. Ta đã đợi ba trăm năm.',
        'Lăng: Ba trăm năm trước, Thực Thể tìm tới thế giới này. Ta là người thức tỉnh đầu tiên. Ta biến ý thức của mình thành một ổ khóa để giam nó lại. Các ngươi gọi ổ khóa đó là Hệ thống.',
        'Lăng: Hệ thống tuyển thợ săn mạnh làm chìa để gia cố ổ khóa, không phải để mở nó. Nhưng ba trăm năm qua, ổ khóa tự ăn mòn thành cơn đói. Mỗi chìa đều bị nuốt. Ta xin lỗi.',
        'Lăng: Hãy giải thoát ta. Hoặc quyết định thay ta. Trước đó, hãy thử sức mình với phần cuối của ổ khóa này.',
      ],
      end: ['Lăng: Ngươi không giống sáu người trước. Họ tin ta. Ngươi thì hỏi ta.', 'Lăng: Ta sẽ không cản ngươi. Nhưng phần còn lại của ổ khóa sẽ cản, vì nó chỉ biết tự vệ.'],
      obj: {},
      reward: rw(98, 'story', [['binh_mau_than_thoai', 5]]) },
    { id: 'c10q7', name: 'Trụ Mộng Sáng Thế', npc: 'lang_hinh',
      start: [
        'Lăng: Phần cuối của ổ khóa đã thức dậy. Đó không còn là ta nữa, chỉ là bản năng tự vệ. Nó sẽ đánh bằng mọi chiêu ngươi từng thấy.',
        'Lăng: Vy, Lam Sương, Lữ khách, Thiết... những người ngươi tin đều đứng sau ngươi. Đi đi.',
      ],
      end: [
        'Trụ Mộng Sáng Thế vỡ thành hàng nghìn mảnh sáng. Giữa ánh sáng, Lăng hiện ra, nhẹ như không.',
        'Lăng: Giờ đây ta hỏi ngươi, người chơi số 7. Ngươi muốn ổ khóa này thành gì?',
      ],
      obj: { kill: { tru_mong_sang_the: 1 } },
      reward: rw(100, 'boss', [['ao_sang_the', 1], ['loi_tinh_van', 6]], { skillPoints: 5 }) },
    { id: 'c10q8', name: 'Lựa chọn của Số 7', npc: 'lang_hinh',
      start: [
        'Lăng: Có ba con đường. Giải thoát ta và để ổ khóa tan. Giữ ổ khóa nhưng cho phép người ta từ chối. Hoặc viết lại nó theo cách không nuốt ai.',
        'Lăng: Cậu chọn đi. Dù chọn gì, thế giới này vẫn còn một cánh cổng mở cho cậu.',
      ],
      end: ['[Hệ thống] ...', '[Hệ thống] Người chơi số 7. Trạng thái: tự do. Chế độ cổng ngẫu nhiên đã mở.', '— Hết Phần Hai: Năm Trụ Mộng —'],
      obj: {},
      reward: rw(100, 'story', [['sach_ky_nang_vo_dinh', 1], ['da_cuong_hoa_than_thoai', 8]], { skillPoints: 8 }),
      choices: [
        { id: 'pha_chuoi', label: 'Phá Chuỗi: "Giải thoát bà. Để ổ khóa tan."', title: 'Người Phá Chuỗi', text: 'Lăng mỉm cười, tan thành ánh sáng. Các cổng đóng dần; thợ săn mất sức mạnh Hệ thống nhưng không ai phải trả giá nữa.' },
        { id: 'giu_loi', label: 'Giữ Lời: "Giữ ổ khóa, nhưng ai cũng được quyền từ chối."', title: 'Người Giữ Lời', text: 'Lăng gật đầu. Hệ thống tiếp tục, nhưng từ nay, thợ săn tự quyết có nhận sức mạnh hay không.' },
        { id: 'viet_lai', label: 'Viết Lại: "Để tôi giữ ổ khóa theo cách không nuốt ai."', title: 'Người Viết Lại', text: 'Ánh sáng quấn quanh cậu. Từ bên kia cổng, Thiên bước ra, nhận phần giữ cổng thay cậu. Ổ khóa mới không còn đói.' },
      ],
    },
  ];

  (G.QUEST_PARTS = G.QUEST_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
