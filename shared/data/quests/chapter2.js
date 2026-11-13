/*
 * Nhiệm vụ chính tuyến · Chương 2 – Bóng Trăng Khuyết (cấp 11–20).
 *
 * obj: { kill: {monster: n} } | { collect: {item: n} } | { visit: [npc...] } | { level: n, school: true } | {}
 * Thưởng: rw(cấp, loại, items, extra) — loại: story | hunt | elite | boss (xem helpers.js).
 * Thêm nhiệm vụ: thêm một phần tử vào mảng dưới, đúng thứ tự cốt truyện.
 */
(function (G) {
  'use strict';
  const { questReward: rw } = G;

  const PART = [
    { id: 'c2q1', name: 'Những người không trở về', npc: 'vy',
      start: [
        'Vy: Bến phà này dẫn về phía nam, nơi những thợ săn mất tích lần cuối được nhìn thấy.',
        'Vy: Ba tháng qua, bảy đội vào vùng này. Không ai về.',
        'Vy: Cũng giống hệt ba năm trước... khi đội Bình Minh của tôi...',
        'Vy: Bỏ qua. Vào đầm lầy trước, tôi sẽ chỉ đường.',
      ],
      obj: {},
      end: [
        'Vy: Mùi này... nước bẩn thỉu, xác ủi. Đầm Lầy Mục.',
        'Vy: Bọn chúng nuôi quái trong đầm. Dọn sạch rồi mới đi tiếp được.',
      ],
      reward: rw(11, 'story', []) },
    { id: 'c2q2', name: 'Bùn rác và xương', npc: 'vy',
      start: [
        'Vy: Thằn Lằn Đầm tràn ngập. Bọn chúng ăn xác thợ săn mất tích.',
        'Vy: Tiêu diệt 20 con. Tôi giữ lối sau.',
      ],
      obj: { kill: { th_luoi_dam: 20 } },
      end: [
        'Vy: Xong rồi. Nhưng phía trước có tiếng đánh nhau.',
        'Vy: Phía trước là Hải Cảng, Tân Đô II. Lối vào đã mở cho cậu. Có người còn sống ở đó.',
      ],
      reward: rw(12, 'hunt', [['binh_mau_vua', 5]]) },
    { id: 'c2q3', name: 'Dấu chân bị bỏ quên', npc: 'vy',
      start: [
        'Vy: Làng chài này đã bỏ hoang. Nhưng tôi thấy mảnh áo thợ săn vương đất.',
        'Vy: Có người đã đánh nhau ở đây. Thu 6 mảnh, biết đâu tìm được manh mối.',
      ],
      obj: { collect: { manh_ao_tho_san: 6 } },
      end: [
        'Vy: Mảnh áo này... dấu hiệu Hắc Nguyệt. Bọn chúng bắt thợ săn làm mồi nhử.',
        'Vy: Có trạm ẩn của Hắc Nguyệt phía sau làng. Phải dọn nó.',
      ],
      reward: rw(12, 'hunt', [['da_cuong_hoa_trung', 3]]) },
    { id: 'c2q4', name: 'Trạm thu thập ẩn', npc: 'vy',
      start: [
        'Vy: Hắc Nguyệt lập trạm thu lõi đỏ ở đây. 5 tên lính giáo canh.',
        'Vy: Hạ chúng. Tôi lo phần sau.',
      ],
      obj: { kill: { linh_giao_hn: 5 } },
      end: [
        'Vy: Dọn xong. Nhưng trong trạm có dấu vết chiến đấu... ai đó đã giao chiến trước chúng ta.',
        'Vy: Dấu đao song. Tôi biết ai dùng đao song.',
      ],
      reward: rw(13, 'elite', [['da_cuong_hoa_trung', 3]]) },
    { id: 'c2q5', name: 'Người quen cũ', npc: 'vy',
      start: [
        'Vy: ...Lam Sương. Cô ấy đã chết. Ba năm trước, trong vụ Bình Minh.',
        'Vy: Nhưng dấu đao này là của cô ấy. Chỉ có cô ấy dùng song đao.',
        'Vy: Căn cứ Hắc Nguyệt ở phía trước. Đi. Tôi cần biết sự thật.',
      ],
      obj: { kill: { lam_suong: 1 } },
      end: [
        'Lam Sương gục xuống, nhưng không chết. Cô ta lướt lui, máu nhỏ giọt.',
        'Lam Sương: Vy... sau ba năm, vẫn là cậu đến tìm tôi...',
        'Lam Sương: Hắn đã cứu tôi. Hắn biết sự thật về Hệ thống. Cậu không hiểu đâu.',
        'Lam Sương bỏ chạy, để lại song đao cắm trên đất.',
        'Vy đứng im rất lâu. Rồi cô nhặt song đao lên.',
      ],
      reward: rw(14, 'elite', [['song_dao_lam_suong', 1]]) },
    { id: 'c2q6', name: 'Vy im lặng', npc: 'ha_phong',
      start: [
        'Hạ Phong: Cậu về rồi. Vy nói cô gặp Lam Sương, ngoài bến này ai cũng nghe tin.',
        'Hạ Phong: Lam Sương... đội Bình Minh. Ba năm trước, cả đội bị giết, chỉ Vy sống sót. Tôi đưa đò cho họ hôm cuối cùng.',
        'Hạ Phong: Nói chuyện với Vy đi. Cô ấy cần thời gian.',
      ],
      obj: { visit: ['vy', 'ha_phong'] },
      end: [
        'Vy: ...Tôi ổn. Lam Sương nói "hắn" đã cứu cô. Hắn = Kẻ Đeo Mặt Nạ Trăng.',
        'Vy: Hắn biết gì về Hệ thống mà chúng ta không biết. Tôi sẽ tìm ra.',
        'Hạ Phong: Hội trưởng Khải vừa nhắn qua đường truyền: trước tiên, cậu cần mạnh hơn. Đạt cấp 15 rồi nói tiếp.',
      ],
      reward: rw(14, 'hunt', [['binh_mau_lon', 5]]) },
    { id: 'c2q7', name: 'Thử thách hạng C', npc: 'ha_phong',
      start: [
        'Hạ Phong: Đạt cấp 15 rồi. Hội trưởng Khải đã duyệt: cậu xứng đáng lên hạng C.',
        'Hạ Phong: Có một Cổng hạng C vừa mở ngay dưới bến này: Thành Phố Chìm, dưới đáy hồ.',
        'Hạ Phong: Lõi của cổng đó đang bị nhiễm. Quái trong đó mạnh hơn bình thường.',
      ],
      obj: { level: 15 },
      end: [
        '[Hệ thống] Đạt hạng C. Đã mở khóa Thành Phố Chìm.',
        'Hạ Phong: Vy đang đợi cậu ở lối vào cổng. Cẩn thận, dưới nước không giống trên bờ.',
      ],
      reward: rw(15, 'story', [['da_cuong_hoa_trung', 5]]) },
    { id: 'c2q8', name: 'Thành phố dưới nước', npc: 'vy',
      start: [
        'Vy: Thành phố này chìm từ ba trăm năm. Năng lượng cổng giữ nó không bị sập.',
        'Vy: Lính Thủy Cổ tuần tra tầng trên. Dọn 25 con rồi xuống cống ngầm.',
      ],
      obj: { kill: { linh_thuy_co: 25 } },
      end: [
        'Vy: Tầng trên sạch. Lối xuống cống ngầm ở phía xa.',
        'Vy: Dưới đó tối hơn. Và có tiếng la yếu ớt...',
      ],
      reward: rw(16, 'hunt', [['binh_mau_lon', 5], ['binh_nl_lon', 5]]) },
    { id: 'c2q9', name: 'Mồi nhử Hắc Nguyệt', npc: 'vy',
      start: [
        'Vy: Nhện Cống Ngầm làm tổ khắp nơi. Chúng giữ chìa khóa lồng giam.',
        'Vy: Hạ nhện, lấy 5 chìa. Có thợ săn bị nhốt dưới này.',
      ],
      obj: { collect: { chia_khoa_long_giam: 5 } },
      end: [
        'Vy: Đủ chìa rồi. Tôi nghe tiếng gọi từ phía sâu.',
        'Vy: Nhanh lên. Nước đang dâng.',
      ],
      reward: rw(17, 'hunt', [['da_cuong_hoa_trung', 5]]) },
    { id: 'c2q10', name: 'Giải cứu trong đêm', npc: 'vy',
      start: [
        'Vy: Năm lồng giam. Năm thợ săn còn sống. Hắc Nguyệt nhốt họ để thu lõi đỏ.',
        'Vy: Chìa khóa cậu có đủ rồi. Đi dọc cống, nói chuyện với từng người để mở lồng. Tôi giữ lối thoát.',
      ],
      obj: { visit: ['tho_san_1', 'tho_san_2', 'tho_san_3', 'tho_san_4', 'tho_san_5'] },
      end: [
        'Năm thợ săn được giải cứu, run rẩy nhưng còn thở.',
        'Thợ săn giải cứu: Cảm ơn... bọn chúng nói lõi cổng ở dưới sâu nhất. Có con rắn khổng lồs...',
        'Vy: Thủy Xà Vương. Tôi biết con đó. Nó từng nuốt cả một đội thợ săn.',
      ],
      reward: rw(17, 'hunt', [['binh_mau_lon', 10]]) },
    { id: 'c2q11', name: 'Chủ nhân thủy cung', npc: 'vy',
      start: [
        'Vy: Lõi cổng xanh ở đây, nhưng Thủy Xà Vương canh nó.',
        'Vy: Nó có hai giai đoạn. Lúc đầu gọi nước dâng làm chậm, sau đó gọi rắn con.',
        'Vy: Đừng để bị kẹt dưới nước. Nhảy lên bục khi nước dâng.',
        'Vy: Tôi giữ lối thoát cho cậu. Đi.',
      ],
      obj: { kill: { thuy_xa_vuong: 1 } },
      end: [
        'Thủy Xà Vương gầm lên, nước rút về, thân rắn khổng lồ chìm xuống đáy.',
        'Giữa đống vảy, Lõi Cổng Xanh phát sáng, đập đều như tim.',
        'Vy: Lõi cổng... Nó đập. Giống như nó còn sống.',
        'Vy: Mang theo. Về Tân Đô. Tôi cần đọc thứ Lam Sương để lại.',
      ],
      reward: rw(18, 'boss', [['valy_thuy_xa', 1], ['loi_cong_xanh', 1]]) },
    { id: 'c2q12', name: 'Mảnh giấy để lại', npc: 'vy',
      start: [
        'Vy: Trên song đao Lam Sương để lại, có mảnh giấy cuốn trong chuôi.',
        'Vy: Đọc đi.',
      ],
      obj: {},
      end: [
        'Mảnh giấy: "Vy, nếu cậu đọc được, nghĩa là tôi đã rời đi. Hắn biết sự thật. Hệ thống là ký sinh trùng không gian. Nó ăn các thế giới. Lõi Đỏ là mầm bệnh. Hắn gom lõi để mở Cổng Vĩnh Hằng, nơi Hệ thống sinh ra. Hủy nguồn gốc, hủy Hệ thống. Nhưng cái giá..."',
        'Vy: Ký sinh trùng... không gian...',
        'Hạ Phong (chuyển lời Hội trưởng Khải): Nếu đây là sự thật, Hắc Nguyệt không hẳn là kẻ thù. Nhưng mở Cổng Vĩnh Hằng mà không kiểm soát... hậu quả không lường được.',
        '[Hệ thống] Đã mở khóa cấp tối đa: 50.',
      ],
      reward: rw(20, 'story', [['sach_ky_nang', 1]], { skillPoints: 2 }) },
  ];

  (G.QUEST_PARTS = G.QUEST_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
