/*
 * Nhiệm vụ chính tuyến.
 */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------- Nhiệm vụ chính tuyến · Chương 1: Cổng đỏ
  // obj: { kill: {monster: n} } | { collect: {item: n} } | { visit: [npc...] } | { level: n, school: true } | {}
  const QUESTS = [
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
      reward: { exp: 30, gold: 30, items: [['binh_mau_nho', 3]] } },

    { id: 'q1', name: 'Bài kiểm tra thức tỉnh', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Cậu bước ra từ cái cổng đỏ ở giữa phố? Sống sót trở ra một mình... hiếm thấy đấy.',
        'Hội trưởng Khải: Ai thức tỉnh cũng phải qua kiểm tra trước khi được cấp giấy phép thợ săn.',
        'Hội trưởng Khải: Ra bãi tập phía đông, phá 3 hình nhân rồi quay lại đây.',
      ],
      obj: { kill: { hinh_nhan: 3 } },
      end: ['Hội trưởng Khải: Không tệ. Đây là kiếm luyện tập, nhớ trang bị vào (phím I mở túi đồ).',
        '[Hệ thống] Đã cấp giấy phép Thợ săn hạng E.'],
      reward: { exp: 40, gold: 50, items: [['kiem_go', 1]] } },

    { id: 'q2', name: 'Làm quen Hiệp Hội', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Thợ săn giỏi không đi một mình. Hãy làm quen người của Hiệp Hội.',
        'Hội trưởng Khải: Chào Thợ chế tác Thiết, Dược sư Lan, và cô gái đứng gần cửa kia: Vy, thợ săn hạng C.',
      ],
      obj: { visit: ['tho_ren', 'ba_thuoc', 'vy'] },
      end: ['Hội trưởng Khải: Dược sư Lan gửi cậu mấy bình thuốc. Vào cổng nhớ dùng (phím Q).'],
      reward: { exp: 30, gold: 20, items: [['binh_mau_nho', 5], ['binh_nl_nho', 3]] } },

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
      reward: { exp: 30, gold: 30, items: [] } },

    { id: 'q4', name: 'Đồng đội', npc: 'vy',
      start: [
        'Vy: Vậy cậu là người sống sót từ Cổng đỏ. Trông cũng... bình thường.',
        'Vy: Nghe này. Trong cổng, Nấm Độc mọc tràn hết lối đi. Dọn 10 con, tôi sẽ đợi ở lối vào Rừng Sương.',
      ],
      obj: { kill: { nam_doc: 10 } },
      end: ['Vy: Được đấy. Tay kiếm cậu không tệ như tôi nghĩ.', 'Vy: Nhưng có gì đó sai sai. Quái ở đây đáng lẽ không hung dữ thế này.'],
      reward: { exp: 150, gold: 100, items: [['binh_mau_nho', 5]] } },

    { id: 'q5', name: 'Dấu vết Hắc Nguyệt', npc: 'vy',
      start: [
        'Vy: Bọn Yêu Tinh trong rừng mang theo những mảnh kim loại đen. Nhìn này, có khắc hình gì đó.',
        'Vy: Thu thêm 5 mảnh. Nếu đúng là huy hiệu của Hắc Nguyệt, chúng đã vào cổng trước chúng ta.',
      ],
      obj: { collect: { manh_vai_den: 5 } },
      end: [
        'Vy: Trăng khuyết đen... đúng là chúng rồi. Ba năm trước, Hắc Nguyệt đã giết cả đội của tôi.',
        'Vy: Tôi muốn đuổi theo ngay, nhưng cậu còn yếu lắm. Về gặp Hội trưởng đi, ông ấy sẽ giúp cậu mạnh lên.',
        'Vy: Mặc chiếc áo khoác này vào. Của đồng đội cũ của tôi.',
      ],
      reward: { exp: 250, gold: 100, items: [['ao_vai', 1]] } },

    { id: 'q6', name: 'Thức tỉnh lần hai', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Vy kể rồi. Nếu là Hắc Nguyệt, cậu cần nhiều hơn một thanh kiếm luyện tập.',
        'Hội trưởng Khải: Đạt cấp 5 rồi quay lại, ta sẽ giúp cậu thức tỉnh class.',
      ],
      obj: { level: 5, school: true },
      end: ['[Hệ thống] Thức tỉnh thành công. Hãy học kỹ năng bằng điểm kỹ năng (phím K).',
        'Hội trưởng Khải: Vy đang chờ cậu ở Rừng Sương. Cổng hạng D ở cuối rừng đã cho phép cậu vào.'],
      reward: { exp: 200, gold: 150, items: [], schoolWeapon: true } },

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
      reward: { exp: 800, gold: 200, items: [['da_cuong_hoa', 3]] } },

    { id: 'q8', name: 'Vết thương của Vy', npc: 'vy',
      start: [
        'Vy: Vết thương này nhiễm năng lượng đỏ, thuốc thường không ăn thua.',
        'Vy: Bộ Xương Pha Lê trong hang có Tinh thể xanh trong lồng ngực. Mang về 5 viên, tôi tự lo được phần còn lại.',
      ],
      obj: { collect: { tinh_the_xanh: 5 } },
      end: ['Vy: Đỡ hơn nhiều rồi. Cảm ơn... đồng đội.', 'Vy: Gã mặt nạ đi về phía sâu nhất của hang, nơi lõi cổng đang đập.'],
      reward: { exp: 600, gold: 200, items: [['binh_mau_vua', 5]] } },

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
      reward: { exp: 2000, gold: 500, items: [['manh_an_1', 1], ['nhan_thach_quy', 1]] } },

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
      reward: { exp: 500, gold: 300, skillPoints: 2, items: [['sach_ky_nang', 1]] } },

    // ===== CHƯƠNG 2: BÓNG TRĂNG KHUYẾT (cấp 11–20)
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
      reward: { exp: 400, gold: 200, items: [] } },

    { id: 'c2q2', name: 'Bùn rác và xương', npc: 'vy',
      start: [
        'Vy: Thằn Lằn Đầm tràn ngập. Bọn chúng ăn xác thợ săn mất tích.',
        'Vy: Tiêu diệt 20 con. Tôi giữ lối sau.',
      ],
      obj: { kill: { th_luoi_dam: 20 } },
      end: [
        'Vy: Xong rồi. Nhưng phía trước có tiếng đánh nhau.',
        'Vy: Làng chài gần đây. Có người còn sống.',
      ],
      reward: { exp: 600, gold: 300, items: [['binh_mau_vua', 5]] } },

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
      reward: { exp: 500, gold: 250, items: [['da_cuong_hoa_trung', 3]] } },

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
      reward: { exp: 700, gold: 350, items: [['da_cuong_hoa_trung', 3]] } },

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
      reward: { exp: 1500, gold: 500, items: [['song_dao_lam_suong', 1]] } },

    { id: 'c2q6', name: 'Vy im lặng', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Cậu về rồi. Vy nói cô gặp Lam Sương.',
        'Hội trưởng Khải: Lam Sương... đội Bình Minh. Ba năm trước, cả đội bị giết, chỉ Vy sống sót.',
        'Hội trưởng Khải: Nói chuyện với Vy đi. Cô ấy cần thời gian.',
      ],
      obj: { visit: ['vy', 'lao_su'] },
      end: [
        'Vy: ...Tôi ổn. Lam Sương nói "hắn" đã cứu cô. Hắn = Kẻ Đeo Mặt Nạ Trăng.',
        'Vy: Hắn biết gì về Hệ thống mà chúng ta không biết. Tôi sẽ tìm ra.',
        'Hội trưởng Khải: Trước tiên, cậu cần mạnh hơn. Đạt cấp 15 rồi nói tiếp.',
      ],
      reward: { exp: 500, gold: 300, items: [['binh_mau_lon', 5]] } },

    { id: 'c2q7', name: 'Thử thách hạng C', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Đạt cấp 15 rồi. Cậu xứng đáng lên hạng C.',
        'Hội trưởng Khải: Có một Cổng hạng C vừa mở: Thành Phố Chìm, dưới đáy hồ phía đông.',
        'Hội trưởng Khải: Lõi của cổng đó đang bị nhiễm. Quái trong đó mạnh hơn bình thường.',
      ],
      obj: { level: 15 },
      end: [
        '[Hệ thống] Đạt hạng C. Đã mở khóa Thành Phố Chìm.',
        'Hội trưởng Khải: Vy đang đợi cậu ở lối vào cổng. Cẩn thận, dưới nước không giống trên bờ.',
      ],
      reward: { exp: 800, gold: 400, items: [['da_cuong_hoa_trung', 5]] } },

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
      reward: { exp: 1500, gold: 600, items: [['binh_mau_lon', 5], ['binh_nl_lon', 5]] } },

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
      reward: { exp: 1200, gold: 500, items: [['da_cuong_hoa_trung', 5]] } },

    { id: 'c2q10', name: 'Giải cứu trong đêm', npc: 'vy',
      start: [
        'Vy: Năm lồng giam. Năm thợ săn còn sống. Hắc Nguyệt nhốt họ để thu lõi đỏ.',
        'Vy: Mở lồng, đưa họ ra. Tôi giữ lối thoát.',
      ],
      obj: {},
      end: [
        'Năm thợ săn được giải cứu, run rẩy nhưng còn thở.',
        'Thợ săn giải cứu: Cảm ơn... bọn chúng nói lõi cổng ở dưới sâu nhất. Có con rắn khổng lồs...',
        'Vy: Thủy Xà Vương. Tôi biết con đó. Nó từng nuốt cả một đội thợ săn.',
      ],
      reward: { exp: 1000, gold: 500, items: [['binh_mau_lon', 10]] } },

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
      reward: { exp: 3000, gold: 800, items: [['valy_thuy_xa', 1], ['loi_cong_xanh', 1]] } },

    { id: 'c2q12', name: 'Mảnh giấy để lại', npc: 'vy',
      start: [
        'Vy: Trên song đao Lam Sương để lại, có mảnh giấy cuốn trong chuôi.',
        'Vy: Đọc đi.',
      ],
      obj: {},
      end: [
        'Mảnh giấy: "Vy, nếu cậu đọc được, nghĩa là tôi đã rời đi. Hắn biết sự thật. Hệ thống là ký sinh trùng không gian. Nó ăn các thế giới. Lõi Đỏ là mầm bệnh. Hắn gom lõi để mở Cổng Vĩnh Hằng, nơi Hệ thống sinh ra. Hủy nguồn gốc, hủy Hệ thống. Nhưng cái giá..."',
        'Vy: Ký sinh trùng... không gian...',
        'Hội trưởng Khải: Nếu đây là sự thật, Hắc Nguyệt không hẳn là kẻ thù. Nhưng mở Cổng Vĩnh Hằng mà không kiểm soát... hậu quả không lường được.',
        '[Hệ thống] Đã mở khóa cấp tối đa: 50.',
      ],
      reward: { exp: 1000, gold: 500, skillPoints: 2, items: [['sach_ky_nang', 1]] } },

    // ===== CHƯƠNG 3: LÒ RÈN CỔ (cấp 21–30)
    { id: 'c3q1', name: 'Lưỡi kiếm không xuyên', npc: 'tho_ren',
      start: [
        'Thợ chế tác Thiết: Vũ khí cậu dùng bây giờ... chỉ là thép pha pha lê. Đánh quái lõi cổng mạnh hơn thì không xuyên nổi.',
        'Thợ chế tác Thiết: Dòng họ thợ rèn cổ đại tôi từng nói tới... Lò Rèn Cổ dưới núi tuyết phía bắc. Nơi đó mới rèn được vũ khí thật sự.',
        'Thợ chế tác Thiết: Cổng vừa mở ở đó. Nhưng lạnh lắm. Mang đủ thuốc.',
      ],
      obj: {},
      end: [
        'Thợ chế tác Thiết: Cổng đã mở ở phía bắc Tân Đô. Vy sẽ đi cùng cậu.',
        '[Hệ thống] Đã mở khóa: Chương 3 – Lò Rèn Cổ.',
      ],
      reward: { exp: 500, gold: 300, items: [['binh_mau_lon', 5], ['binh_nl_lon', 5]] } },

    { id: 'c3q2', name: 'Đường lên núi băng', npc: 'vy',
      start: [
        'Vy: Chân núi lạnh thật. Sói Tuyết đầy nơi này.',
        'Vy: Dọn 25 con để mở đường. Tôi dò phía trên.',
      ],
      obj: { kill: { soi_tuyet: 25 } },
      end: ['Vy: Đường sạch. Nhưng gió từ hẻm núi thổi buốt. Cẩn thận bục đá trơn.'],
      reward: { exp: 2500, gold: 500, items: [['binh_mau_dac', 3]] } },

    { id: 'c3q3', name: 'Thu thập băng tinh', npc: 'vy',
      start: [
        'Vy: Băng Tinh thượng thừa mọc trong hẻm núi. Lò Rèn cần chúng để nung lửa.',
        'Vy: Thu 8 viên. Người Tuyết canh khu này, cẩn thận.',
      ],
      obj: { collect: { bang_tinh: 8 } },
      end: ['Vy: Đủ rồi. Lò Rèn Cổ ở phía trong hẻm. Nóng và lạnh cùng lúc... kỳ lạ.'],
      reward: { exp: 2000, gold: 500, items: [['da_cuong_hoa_cao', 2]] } },

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
      reward: { exp: 2000, gold: 500, items: [['da_cuong_hoa_cao', 2]] } },

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
      ],
      reward: { exp: 5000, gold: 1000, items: [['trai_tim_bang_long', 1]] } },

    { id: 'c3q6', name: 'Báo động đỏ Tân Đô', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Tân Đô vừa bị tấn công! Quái tràn vào Quận Thương Mại!',
        'Hội trưởng Khải: Vy và lính Hiệp Hội đã đẩy lùi 3 đợt. Cậu về đúng lúc.',
        'Hội trưởng Khải: Nhưng kho bạc Hiệp Hội bị đột kích trong lúc thành bị tấn công!',
        'Hội trưởng Khải: Kẻ dẫn đầu đột kích... là Lam Sương.',
      ],
      obj: {},
      end: [
        'Hội trưởng Khải: Mặc giáp này. Vệ Binh Tân Đô cần cậu.',
        'Hội trưởng Khải: Kho bạc ở dưới Hiệp Hội. Vy đang giữ đó. Đi nhanh!',
      ],
      reward: { exp: 2000, gold: 800, items: [['ao_bang_long', 1]] } },

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
      reward: { exp: 2500, gold: 1000, items: [['manh_loi_do_co_dai', 1]] } },

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
      reward: { exp: 1000, gold: 500, items: [] } },

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
      reward: { exp: 1500, gold: 500, perk: 'y_chi_thay', items: [['sach_ky_nang', 1]] } },

    { id: 'c3q10', name: 'Vũ khí từ lõi cổng', npc: 'tho_ren',
      start: [
        'Thợ chế tác Thiết: Trái Tim Băng Long, Lõi Lò Rèn, Mảnh Lõi Đỏ cổ đại... đủ rồi!',
        'Thợ chế tác Thiết: Ta sẽ rèn cho cậu vũ khí đầu tiên từ Lõi Cổng. Hạng B!',
        'Thợ chế tác Thiết: Đây là vũ khí theo class của cậu. Nhận đi.',
      ],
      obj: {},
      end: [
        'Thợ chế tác Thiết: Vũ khí hạng B! Xuyên được giáp quái lõi cổng.',
        'Thợ chế tác Thiết: Lữ khách muốn gặp cậu. Hắn nói có chuyện quan trọng về Chương 4.',
        '[Hệ thống] Đã mở khóa: Chương 4 – Tầng Trời Thứ Bảy.',
      ],
      reward: { exp: 2000, gold: 1000, craftWeapon: true, items: [['da_cuong_hoa_cao', 5], ['sach_ky_nang', 1]] } },

    // ===== CHƯƠNG 4: TẦNG TRỜI THỨ BẢY (cấp 31–40)
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
      reward: { exp: 2000, gold: 1000, items: [['binh_mau_dac', 5], ['binh_nl_dac', 5]] } },

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
      reward: { exp: 3000, gold: 1500, items: [['da_cuong_hoa_cao', 5]] } },

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
      reward: { exp: 5000, gold: 2000, items: [['binh_mau_than_thoai', 3]] } },

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
      reward: { exp: 4000, gold: 2000, items: [['tri_thuc_co_dai', 1]] } },

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
      reward: { exp: 3000, gold: 1500, perk: 'nhan_thuc_ky_sinh', items: [['sach_ky_nang', 1]] } },

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
      reward: { exp: 8000, gold: 3000, items: [['vuong_mien_tri_thuc', 1]] } },

    { id: 'c4q7', name: 'Giọng nói từ hư không', npc: 'lu_khach',
      start: [
        'Lữ khách: Cậu đã biết đủ. Giờ nghe ta nói về Chương 5.',
        'Lữ khách: Cổng Vĩnh Hằng ở trên cao. Bầu trời Tân Đô đang nứt.',
        'Lữ khách: Thiên đã gom đủ lõi đỏ. Hắn sắp mở cổng.',
        '[Hệ thống] Giọng nói: Người chơi thứ 7... ngươi đã đến xa hơn ta dự đoán.',
      ],
      obj: {},
      end: [
        '[Hệ thống] Nhận 5 điểm kỹ năng. Cấp tối đa: 50.',
        'Lữ khách: Cổng đã mở ở Tân Đô. Bầu trời rách toác. Đi, người chơi thứ 7.',
        '[Hệ thống] Đã mở khóa: Chương 5 – Cổng Vĩnh Hằng.',
      ],
      reward: { exp: 5000, gold: 3000, skillPoints: 5, items: [['sach_ky_nang', 2]] } },

    // ===== CHƯƠNG 5: CỔNG VĨNH HẰNG (cấp 41–50)
    { id: 'c5q1', name: 'Bầu trời rách tạc', npc: 'lao_su',
      start: [
        'Hội trưởng Khải: Nhìn lên! Bầu trời đang nứt!',
        'Hội trưởng Khải: Cổng Vĩnh Hằng đang rỉ năng lượng xuống. Quái Hư Không chui qua khe.',
        'Hội trưởng Khải: Cậu phải lên đó. Cầu dẫn lên cổng ở phía đông thành.',
      ],
      obj: {},
      end: [
        'Hội trưởng Khải: Leo lên cầu. Vy đang đợi ở giữa.',
        '[Hệ thống] Cổng Vĩnh Hằng phát năng lượng mạnh. Cầu dẫn đang mở.',
      ],
      reward: { exp: 5000, gold: 3000, items: [['binh_mau_than_thoai', 5], ['binh_nl_than_thoai', 5]] } },

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
      reward: { exp: 10000, gold: 5000, items: [['da_cuong_hoa_than_thoai', 5]] } },

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
      reward: { exp: 5000, gold: 3000, perk: 'lien_minh', items: [['binh_mau_than_thoai', 10], ['binh_nl_than_thoai', 10]] } },

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
      reward: { exp: 20000, gold: 8000, items: [['mat_na_trang_khuyet', 1]] } },

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
      reward: { exp: 50000, gold: 20000, items: [['manh_he_thong', 1]] } },

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
      reward: { exp: 10000, gold: 10000, skillPoints: 10, perk: 'tu_do', items: [['sach_ky_nang_vo_dinh', 1]] } },
  ];

  Object.assign(G, { QUESTS });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
