/*
 * Nhiệm vụ chính tuyến · Chương 1 – Cổng Đỏ (cấp 1–10).
 *
 * obj: { kill: {monster: n} } | { collect: {item: n} } | { visit: [npc...] } | { level: n, school: true } | {}
 * Thưởng: rw(cấp, loại, items, extra) — loại: story | hunt | elite | boss (xem helpers.js).
 * Thêm nhiệm vụ: thêm một phần tử vào mảng dưới, đúng thứ tự cốt truyện.
 */
(function (G) {
  'use strict';
  const { questReward: rw } = G;

  const PART = [
    { id: 'q0', name: 'Tỉnh dậy trong Cổng đỏ', npc: 'he_thong',
      start: [
        '...Lạnh. Mùi sắt gỉ. Bạn mở mắt giữa một hang đá nhuộm màu đỏ máu.',
        'Bạn chỉ nhớ một tia sáng đỏ lóe lên giữa phố, rồi mặt đất dưới chân biến mất.',
        '[Hệ thống] Phát hiện năng lượng thức tỉnh. Đăng ký người chơi... hoàn tất.',
        '[Hệ thống] Cảnh báo: bạn đang ở bên trong một Cổng chưa được phân hạng.',
        '[Hệ thống] Nhiệm vụ khẩn cấp: tiêu diệt 3 Mắt Đỏ để mở lối ra. Thất bại đồng nghĩa với cái chết.',
        '(Phím J để đánh, mũi tên hoặc A/D để di chuyển, Space để nhảy.)',
      ],
      obj: { kill: { bong_do: 3 } },
      end: [
        '[Hệ thống] Nhiệm vụ khẩn cấp hoàn thành. Lối ra đã mở ở cuối hang.',
        '[Hệ thống] Người chơi được ghi nhận. Mọi tiến bộ của bạn từ nay sẽ được ghi lại.',
        'Giọng nói tắt lịm. Phía cuối hang, một vòng sáng xanh bắt đầu xoay.',
      ],
      reward: rw(1, 'hunt', [['binh_mau_nho', 3]]) },
    { id: 'q1', name: 'Bài kiểm tra thức tỉnh', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Cậu bước ra từ cái cổng đỏ ở giữa phố? Sống sót trở ra một mình... hiếm thấy đấy.',
        'Hội trưởng Khải: Ai thức tỉnh cũng phải qua kiểm tra trước khi được cấp giấy phép thợ săn.',
        'Hội trưởng Khải: Ra bãi tập phía đông, phá 3 hình nhân rồi quay lại đây.',
      ],
      obj: { kill: { hinh_nhan: 3 } },
      end: ['Hội trưởng Khải: Không tệ. Đây là kiếm luyện tập, nhớ trang bị vào (phím I mở túi đồ).',
        '[Hệ thống] Đã cấp giấy phép Thợ săn hạng E.'],
      reward: rw(1, 'hunt', [['kiem_go', 1]]) },
    { id: 'q2', name: 'Làm quen Hiệp Hội', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Thợ săn giỏi không đi một mình. Hãy làm quen người của Hiệp Hội.',
        'Hội trưởng Khải: Chào Thợ chế tác Thiết, Dược sư Lan, và cô gái đứng gần cửa kia: Vy, thợ săn hạng C.',
      ],
      obj: { visit: ['tho_ren', 'ba_thuoc', 'vy'] },
      end: ['Hội trưởng Khải: Dược sư Lan gửi cậu mấy bình thuốc. Vào cổng nhớ dùng (phím Q).'],
      reward: rw(2, 'hunt', [['binh_mau_nho', 5], ['binh_nl_nho', 3]]) },
    { id: 'q3', name: 'Cổng đỏ', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Cái cổng cậu kẹt bên trong không phải trường hợp đầu tiên.',
        'Hội trưởng Khải: Mấy tháng nay, lõi của nhiều cổng bị nhiễm năng lượng đỏ. Quái trong đó mạnh lên, hung dữ hơn.',
        'Hội trưởng Khải: Chúng tôi nghi một nhóm thợ săn ngầm tự xưng là Hắc Nguyệt đứng sau chuyện này.',
        'Hội trưởng Khải: Một Cổng hạng E vừa mở ở cuối phố. Vy sẽ đi cùng cậu.',
        '[Hệ thống] Nhiệm vụ đặc biệt đã được mở khóa: Điều tra Cổng đỏ.',
      ],
      obj: {},
      end: ['Hội trưởng Khải: Gặp Vy trước khi vào cổng. Đừng có liều.'],
      reward: rw(2, 'story', []) },
    { id: 'q4', name: 'Đồng đội', npc: 'vy',
      start: [
        'Vy: Vậy cậu là người sống sót từ Cổng đỏ. Trông cũng... bình thường.',
        'Vy: Nghe này. Trong cổng, Nấm Độc mọc tràn hết lối đi. Dọn 10 con, tôi sẽ đợi ở lối vào Rừng Sương.',
      ],
      obj: { kill: { nam_doc: 10 } },
      end: ['Vy: Được đấy. Tay kiếm cậu không tệ như tôi nghĩ.', 'Vy: Nhưng có gì đó sai sai. Quái ở đây đáng lẽ không hung dữ thế này.'],
      reward: rw(3, 'hunt', [['binh_mau_nho', 5]]) },
    { id: 'q5', name: 'Dấu vết Hắc Nguyệt', npc: 'vy',
      start: [
        'Vy: Lũ chuột trong Hầm Ngầm Tàu Điện, ngay dưới Tân Đô, đang tha về những mảnh kim loại đen. Nhìn này, có khắc hình gì đó.',
        'Vy: Thu thêm 5 mảnh. Hầm ngầm vào từ phía ga cũ ở Tân Đô. Nếu đúng là huy hiệu của Hắc Nguyệt, chúng đã vào cổng trước chúng ta.',
      ],
      obj: { collect: { manh_vai_den: 5 } },
      end: [
        'Vy: Trăng khuyết đen... đúng là chúng rồi. Ba năm trước, Hắc Nguyệt đã giết cả đội của tôi.',
        'Vy: Tôi muốn đuổi theo ngay, nhưng cậu còn yếu lắm. Về gặp Hội trưởng đi, ông ấy sẽ giúp cậu mạnh lên.',
        'Vy: Mặc chiếc áo khoác này vào. Của đồng đội cũ của tôi.',
      ],
      reward: rw(4, 'hunt', [['ao_da', 1]]) },
    { id: 'q6', name: 'Thức tỉnh lần hai', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Vy kể rồi. Nếu là Hắc Nguyệt, cậu cần nhiều hơn một thanh kiếm luyện tập.',
        'Hội trưởng Khải: Đạt cấp 5 rồi quay lại, ta sẽ giúp cậu thức tỉnh class.',
      ],
      obj: { level: 5, school: true },
      end: ['[Hệ thống] Thức tỉnh thành công. Hãy học kỹ năng bằng điểm kỹ năng (phím K).',
        'Hội trưởng Khải: Vy đang chờ cậu ở Rừng Sương. Cổng hạng D ở cuối rừng đã cho phép cậu vào.'],
      reward: rw(5, 'story', [], { schoolWeapon: true }) },
    { id: 'q7', name: 'Cổng hạng D', npc: 'vy',
      start: [
        'Vy: Cuối cùng cũng tới. Dấu vết dẫn vào Hang Pha Lê, một Cổng hạng D.',
        'Vy: Tôi vào trước dò đường. Đàn Dơi Hang trong đó bị năng lượng đỏ làm cho điên loạn, hạ 15 con rồi tìm tôi.',
      ],
      obj: { kill: { doi_hang: 15 } },
      end: [
        'Vy: ...Cậu tới rồi. Đừng lo, chỉ là vết xước.',
        'Vy: Tôi gặp hắn. Một gã đeo mặt nạ hình trăng. Hắn chỉ vung tay một cái, tôi đã bay xa mười mét.',
      ],
      reward: rw(7, 'hunt', [['da_cuong_hoa', 3]]) },
    { id: 'q8', name: 'Vết thương của Vy', npc: 'vy',
      start: [
        'Vy: Vết thương này nhiễm năng lượng đỏ, thuốc thường không ăn thua.',
        'Vy: Bộ Xương Pha Lê trong hang có Tinh thể xanh trong lồng ngực. Mang về 5 viên, tôi tự lo được phần còn lại.',
      ],
      obj: { collect: { tinh_the_xanh: 5 } },
      end: ['Vy: Đỡ hơn nhiều rồi. Cảm ơn... đồng đội.', 'Vy: Gã mặt nạ đi về phía sâu nhất của hang, nơi lõi cổng đang đập.'],
      reward: rw(8, 'hunt', [['binh_mau_vua', 5]]) },
    { id: 'q9', name: 'Chủ nhân của cổng', npc: 'vy',
      start: [
        'Vy: Lõi cổng nhiễm đỏ đã biến một khối đá cổ thành Thạch Vương.',
        'Vy: Khi nó yếu đi, nó sẽ nổi điên và gọi thêm quái. Nhảy qua sóng đá của nó, đừng đứng yên.',
        'Vy: Tôi sẽ giữ lối ra. Đi đi.',
      ],
      obj: { kill: { thach_quy: 1 } },
      end: [
        'Thạch Vương vỡ vụn. Giữa đống đá, Lõi cổng đỏ vẫn đập như một trái tim.',
        '???: Đáng tiếc. Ta đã mất ba tháng để nuôi nó.',
        'Một bóng người đeo mặt nạ trăng khuyết bước ra từ khe tối. Hắn nhặt nửa lõi cổng, rồi tan vào không khí.',
        'Vy: Là hắn... Kẻ Đeo Mặt Nạ Trăng.',
        '[Hệ thống] Phát hiện thực thể không xác định. Dữ liệu không đủ để phân tích.',
      ],
      reward: rw(10, 'boss', [['manh_an_1', 1], ['nhan_thach_quy', 1]]) },
    { id: 'q10', name: 'Báo cáo Hiệp Hội', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Nửa lõi cổng... và một gã đeo mặt nạ biến mất giữa không khí.',
        'Hội trưởng Khải: Nếu Hắc Nguyệt gom đủ lõi đỏ, chúng có thể mở một cổng mà không ai đóng nổi.',
        'Hội trưởng Khải: Hệ thống chọn cậu không phải ngẫu nhiên. Từ hôm nay, cậu và Vy là một đội.',
      ],
      obj: {},
      end: [
        '[Hệ thống] Chương 1 – Cổng đỏ: hoàn thành. Phần thưởng chương đã được gửi.',
        'Hội trưởng Khải: Cổng mới đã mở ở bến phà phía nam thành. Vy sẽ đi cùng cậu.',
        'Hội trưởng Khải: Nhiều thợ săn đã vào đó và không trở về. Tìm hiểu xem chuyện gì đang xảy ra.',
        '[Hệ thống] Đã mở khóa Chương 2 – Bóng Trăng Khuyết.',
      ],
      reward: rw(10, 'story', [['sach_ky_nang', 1]], { skillPoints: 2 }) },
  ];

  (G.QUEST_PARTS = G.QUEST_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
