/*
 * Nhiệm vụ chính tuyến · Chương 4 – Tầng Trời Thứ Bảy (cấp 31–40).
 *
 * obj: { kill: {monster: n} } | { collect: {item: n} } | { visit: [npc...] } | { level: n, school: true } | {}
 * Thưởng: rw(cấp, loại, items, extra) — loại: story | hunt | elite | boss (xem helpers.js).
 * Thêm nhiệm vụ: thêm một phần tử vào mảng dưới, đúng thứ tự cốt truyện.
 */
(function (G) {
  'use strict';
  const { questReward: rw } = G;

  const PART = [
    { id: 'c4q1', name: 'Lời nói của người Số 3', npc: 'lu_khach',
      start: [
        'Lữ khách: Cậu đã đến đúng lúc. Tôi là Người chơi thứ 3.',
        'Lữ khách: Sáu người chơi trước cậu. Thiên là thứ 6. Tôi là thứ 3. Số 1, 2, 4, 5 đều đã mất tích.',
        'Lữ khách: Tôi từ bỏ Hệ thống. Tôi biết nó là gì. Nó không phải hệ thống game. Nó là thực thể ký sinh.',
        'Lữ khách: Hắn gom lõi đỏ để mở Cổng Vĩnh Hằng, nơi Hệ thống sinh ra. Nếu hắn mở được...',
        'Lữ khách: Phía bắc có Vách Đá Gió Thần. Từ đó, cậu sẽ tìm thấy Thư Viện Hệ Thống. Chứa câu trả lời.',
      ],
      obj: {},
      end: [
        'Lữ khách: Đi đi. Tôi sẽ dẫn đường phía trước. Cậu cần đủ mạnh.',
        '[Hệ thống] Đã mở khóa: Chương 4 – Tầng Trời Thứ Bảy.',
      ],
      reward: rw(30, 'story', [['binh_mau_dac', 5], ['binh_nl_dac', 5]]) },
    { id: 'c4q2', name: 'Cánh cổng bị cấm', npc: 'lu_khach',
      start: [
        'Lữ khách: Cổng Khải Hoàn này được Hệ thống phong ấn.',
        'Lữ khách: Chỉ người chơi đủ mạnh mới mở được. Cậu cần đạt cấp 30.',
        'Lữ khách: Hộ Vệ Mây Đá canh cổng. Khi cậu đủ mạnh, cổng sẽ mở.',
      ],
      obj: { level: 30 },
      end: [
        'Lữ khách: Cậu đủ mạnh rồi. Cổng mở ra.',
        'Lữ khách: Phía trước là Quảng Trường Ánh Sáng. Vy đang đợi ở đó.',
      ],
      reward: rw(30, 'story', [['da_cuong_hoa_cao', 5]]) },
    { id: 'c4q3', name: 'Thảm đá phù đảo', npc: 'vy',
      start: [
        'Vy: Quảng trường này nổi trên mây. Hộ Vệ Mây Đá canh khắp nơi.',
        'Vy: Dọn 30 con. Phía sau quảng trường là Thư Viện Hệ Thống.',
      ],
      obj: { kill: { ho_ve_may: 30 } },
      end: [
        'Vy: Quảng trường sạch. Cổng Thư Viện ở phía trước.',
        'Vy: Tôi cảm nhận được... dữ liệu. Hàng nghìn năm dữ liệu. Nó gọi.',
      ],
      reward: rw(31, 'hunt', [['binh_mau_than_thoai', 3]]) },
    { id: 'c4q3b', name: 'Cua giáp trên quảng trường', npc: 'vy',
      start: [
        'Vy: Mấy con Cua Giáp trên quảng trường cứ ăn mảnh đá phát sáng. Nghe nói ăn xong chúng tự sáng lên như đèn.',
        'Vy: Dọn 20 con trước khi vào Thư Viện. Tôi không muốn có thứ gì phát sáng sau lưng khi đi trong chỗ tối.',
      ],
      obj: { kill: { bo_canh_cung: 20 } },
      end: [
        'Vy: Xong. Lần đầu tôi thấy cua khóc vì mất đèn.',
        'Vy: Đi thôi. Thư Viện ở phía trên, qua Tân Đô Phù Đảo là tới.',
      ],
      reward: rw(33, 'hunt', [['da_cuong_hoa_cao', 3]]) },
    { id: 'c4q4', name: 'Thư Viện Hệ Thống', npc: 'lu_khach',
      start: [
        'Lữ khách: Thư Viện này chứa toàn bộ dữ liệu Hệ Thống đã thu thập.',
        'Lữ khách: Mảnh Trang Lưu Trữ rơi ra từ quái trong này. Thu 7 mảnh.',
        'Lữ khách: Ghép đủ 7 mảnh, ta sẽ giải mã được sơ đồ Cổng Vĩnh Hằng.',
      ],
      obj: { collect: { manh_luu_tru: 7 } },
      end: [
        'Lữ khách: Đủ rồi. Ghép lại... Đây là bản đồ Cổng Vĩnh Hằng.',
        'Lữ khách: Phía sâu Thư Viện có Phòng Lưu Trữ Cấm. Nhật ký của Thiên ở đó.',
        '[Hệ thống] Nhận được: Mảnh Tri Thức Cổ Đại.',
      ],
      reward: rw(35, 'hunt', [['tri_thuc_co_dai', 1]]) },
    { id: 'c4q4b', name: 'Phòng cấm', npc: 'lu_khach',
      start: [
        'Lữ khách: Trước khi tới Phòng Lưu Trữ Cấm, phải qua đám Hộ Vệ Sát Thủ Cánh Bạc. Hệ thống đặt chúng ở đó để giữ nhật ký.',
        'Lữ khách: Hạ 6 tên. Đừng đứng yên: chúng lướt rất nhanh.',
      ],
      obj: { kill: { ho_ve_sat_thu: 6 } },
      end: [
        'Lữ khách: Lối vào đã thông. Tôi nghe thấy tiếng chữ đang chạy trong tường... đó là nhật ký của một người chơi.',
      ],
      reward: rw(35, 'elite', [['binh_mau_than_thoai', 2]]) },
    { id: 'c4q5', name: 'Trang nhật ký thứ 6', npc: 'lu_khach',
      start: [
        'Lữ khách: Đây là Phòng Lưu Trữ Cấm. Nhật ký của Thiên ở trong này.',
        'Lữ khách: Hắn là Người chơi thứ 6. Hắn phát hiện sự thật đầu tiên.',
        'Lữ khách: Đọc nhật ký của hắn. Biết kẻ thù thực sự là ai.',
      ],
      obj: {},
      end: [
        'Nhật ký Thiên: "Ngày 1: Hệ thống chọn tôi. Ngày 100: Tôi hiểu. Hệ thống là ký sinh trùng. Nó ăn thế giới. Phải mở Cổng Vĩnh Hằng. Hủy nguồn gốc. Dù phải hy sinh cả thế giới này."',
        'Lữ khách: Hắn sẵn sàng hy sinh tất cả. Cậu phải ngăn hắn.',
        '[Hệ thống] Nhận nội tại "Nhận Thức Ký Sinh".',
      ],
      reward: rw(36, 'story', [['sach_ky_nang', 1]], { perk: 'nhan_thuc_ky_sinh' }) },
    { id: 'c4q6', name: 'Kẻ gác đỉnh tháp', npc: 'lu_khach',
      start: [
        'Lữ khách: Đỉnh Tháp Lưu Trữ. Người Gác canh toàn bộ dữ liệu.',
        'Lữ khách: Hắn sao chép chiêu thức của người giao chiến. Cậu đánh gì, hắn đánh lại.',
        'Lữ khách: Hạ hắn, lấy Vương Miện Tri Thức và chìa khóa mở Chương 5.',
      ],
      obj: { kill: { nguoi_gac_luu_tru: 1 } },
      end: [
        'Người Gác Lưu Trữ phân rã thành dòng dữ liệu trắng.',
        'Giữa đống sáng, Vương Miện Tri Thức lơ lửng, phát hào quang xanh.',
        'Lữ khách: Vương Miện Tri Thức. Giảm hồi chiêu toàn bộ kỹ năng. Cậu cần nó cho Chương 5.',
        'Lữ khách: Về Tân Đô. Chương cuối đợi cậu.',
      ],
      reward: rw(38, 'boss', [['vuong_mien_tri_thuc', 1]]) },
    { id: 'c4q7', name: 'Giọng nói từ hư không', npc: 'lu_khach',
      start: [
        'Lữ khách: Cậu đã biết đủ. Giờ nghe ta nói về Chương 5.',
        'Lữ khách: Cổng Vĩnh Hằng ở trên cao. Bầu trời Tân Đô đang nứt.',
        'Lữ khách: Thiên đã gom đủ lõi đỏ. Hắn sắp mở cổng.',
        '[Hệ thống] Giọng nói: Người chơi thứ 7... ngươi đã đến xa hơn ta dự đoán.',
      ],
      obj: {},
      // Chọn thoại: chỉ đổi danh hiệu và câu đáp, phần thưởng như nhau
      choices: [
        { id: 'tin', label: 'Chấp nhận: "Tôi sẽ dùng sức mạnh của ngươi để ngăn Thiên."', title: 'Người Dùng Hệ Thống', text: '[Hệ thống] Giọng nói: ...Sáng suốt. Ta sẽ dõi theo ngươi.' },
        { id: 'ngo', label: 'Nghi ngờ: "Ngươi là gì? Nói rõ rồi ta mới tin."', title: 'Kẻ Hoài Nghi', text: '[Hệ thống] Giọng nói: Sự thật không phải thứ ta cho không. Hãy tự tìm.' },
        { id: 'thach', label: 'Thách thức: "Ta không cần ngươi. Ta tự đi."', title: 'Kẻ Chống Hệ Thống', text: '[Hệ thống] Giọng nói: ...Ngươi giống Thiên hơn ngươi nghĩ.' },
      ],
      end: [
        '[Hệ thống] Nhận 5 điểm kỹ năng. Cấp tối đa: 50.',
        'Lữ khách: Hệ thống không còn che giấu nữa. Nghe thấy rồi chứ?',
      ],
      reward: rw(39, 'story', [['sach_ky_nang', 2]], { skillPoints: 5 }) },
    { id: 'c4q8', name: 'Bầu trời rách', npc: 'lu_khach',
      start: [
        'Lữ khách: Cậu đã nghe giọng nói đó. Lời Hệ thống không phải lời đe dọa suông.',
        'Lữ khách: Bầu trời phía đông Phù Đảo đã nứt. Hiệp Hội dựng một Tân Đô mới ngay dưới khe nứt: Bầu Trời Rách.',
        'Lữ khách: Đi đi, người chơi thứ 7. Ta ở lại giữ cổng sau lưng cậu.',
      ],
      obj: {},
      end: [
        'Lữ khách: Hội trưởng Khải đã tới đó trước. Gặp ông ấy.',
        '[Hệ thống] Đã mở khóa: Chương 5 – Cổng Vĩnh Hằng.',
      ],
      reward: rw(40, 'story', [['binh_mau_than_thoai', 3]]) },
  ];

  (G.QUEST_PARTS = G.QUEST_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
