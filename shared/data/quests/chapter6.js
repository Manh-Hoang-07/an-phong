/*
 * Nhiệm vụ chính tuyến · Chương 6–10 (cấp 51–100): "Năm Trụ Mộng". Nối tiếp chapter1.js.
 * Cốt truyện: xem docs/KE_HOACH_NHIEM_VU_TAN_DO.md. Mỗi chương 9 nhiệm vụ (Chương 10: 8):
 *   1 Truyện (mở map 1) · 2 Hạ (map 1) · 3 Thu nguyên liệu · 4 Hạ + Đạt cấp (map 2) · 5 cơ chế đặc trưng (map 3)
 *   6 Hạ tinh anh · 7 Truyện + Hạ thủ lĩnh (map 4) · 8 Trùm (hang) · 9 Truyện hậu quả.
 */
(function (G) {
  'use strict';
  const { QUESTS, expToNext } = G;

  // Phần thưởng theo cấp: kinh nghiệm theo tỉ lệ cấp, xu theo cấp; thêm đồ theo loại
  const KIND = { story: [0.05, 60], hunt: [0.09, 110], elite: [0.13, 150], boss: [0.3, 400] };
  function rw(level, kind, items, extra) {
    const [e, g] = KIND[kind];
    return Object.assign({ exp: Math.round(expToNext(level) * e), gold: level * g, items: items || [] }, extra || {});
  }
  const Q = (id, name, npc, start, end, obj, reward, more) => QUESTS.push(Object.assign({ id, name, npc, start, end, obj, reward }, more || {}));

  // ===================================================================== Chương 6 – Thiên Khôi (51–60) · giao: Khải
  Q('c6q1', 'Năm vết nứt trên trời', 'truong_lang_6', [
    'Trưởng Thịnh: Cổng Vĩnh Hằng đã đóng, Thiên ở lại bên kia để giữ nó. Ba tháng yên ổn, rồi bầu trời nứt thành năm vết sáng.',
    'Trưởng Thịnh: Năm hòn đảo rơi xuống quanh Cổng SS, mảnh còn lại của thế giới bên kia cổng. Chúng tôi gọi chúng là Vùng. Hiệp Hội dựng Thiên Đô ngay tại đây làm tiền đồn.',
    'Trưởng Thịnh: Vùng gần nhất là Thiên Khôi, nơi lửa và thiên thạch. Đi khảo sát đi. Cậu có một mảnh Hệ thống trong túi, nó đang rung theo nhịp của Vùng đó.',
  ], ['Trưởng Thịnh: Bãi Thiên Thạch đã mở. Đừng đi quá xa khi chưa biết gì.'], {}, rw(51, 'story', [['binh_mau_than_thoai', 3]]));
  Q('c6q2', 'Khảo sát Thiên Khôi', 'truong_lang_6', [
    'Trưởng Thịnh: Bãi Thiên Thạch và Đồi Khôi Đỏ là hai khu đầu của Vùng. Quái ở đó mang hơi lửa, không còn là sinh vật bình thường.',
    'Trưởng Thịnh: Hạ 12 Quỷ Tro và 12 Bọ Thiên Thạch. Cần đạt cấp 51 để chịu được nhiệt.',
  ], ['Trưởng Thịnh: Số liệu cậu mang về rất hữu ích. Đồi Khôi Đỏ đã mở.'], { kill: { tan_du_thien_khoi: 12, bo_thien_thach: 12 }, level: 51 }, rw(51, 'hunt', [['da_cuong_hoa_than_thoai', 2]]));
  Q('c6q3', 'Tro thiên thạch', 'truong_lang_6', [
    'Trưởng Thịnh: Thợ chế tác Thiết cần Mảnh Khôi để rèn bộ trang bị cấp 51–60. Mảnh rơi từ Quỷ Tro và Bọ Thiên Thạch.',
    'Trưởng Thịnh: Thu 8 mảnh. Đừng cầm lâu, nó nóng.',
  ], ['Trưởng Thịnh: Đủ rồi. Thiết sẽ rèn ngay. Còn lại là phần của cậu.'], { collect: { manh_khoi: 8 } }, rw(52, 'hunt', [['loi_tinh_van', 2]]));
  Q('c6q4', 'Đường vào mỏ', 'truong_lang_6', [
    'Trưởng Thịnh: Phía sau Đồi Khôi Đỏ là Mỏ Lửa Cổ, nơi thợ mỏ của Hiệp Hội từng khai thác thiên thạch. Giờ Sói Lửa Khôi chiếm hết.',
    'Trưởng Thịnh: Hạ 20 con để mở đường. Cần cấp 55.',
  ], ['Trưởng Thịnh: Mỏ đã sạch lối vào. Nhưng trong mỏ còn thợ mỏ bị kẹt.'], { kill: { soi_lua_khoi: 20 }, level: 55 }, rw(55, 'hunt', [['da_cuong_hoa_than_thoai', 2]]));
  Q('c6q5', 'Giữ trạm khai thác', 'truong_lang_6', [
    'Trưởng Thịnh: Trạm khai thác ở Mỏ Lửa Cổ là nơi còn người sống. Sói Lửa Khôi đang tràn vào từng đợt.',
    'Trưởng Thịnh: Phòng thủ cho tới khi dọn sạch 30 con. Tôi sẽ cho người tiếp tế phía sau cậu.',
  ], ['Trạm khai thác giữ được. Thợ mỏ chui ra khỏi hầm, mặt lấm than nhưng còn sống.', 'Trưởng Thịnh: Phòng thủ tốt. Lần này không ai phải chết.'], { kill: { soi_lua_khoi: 30 } }, rw(56, 'hunt', [['binh_mau_than_thoai', 4]]));
  Q('c6q6', 'Hộ vệ lửa', 'truong_lang_6', [
    'Trưởng Thịnh: Hộ Vệ Khôi Đỏ canh các hầm sâu. Đây là loại tinh anh, đánh theo đội.',
    'Trưởng Thịnh: Hạ 8 tên. Đừng tách ra, nhất là khi nó nổi giận.',
  ], ['Trưởng Thịnh: Thành Khôi Sụp ở phía sau đã mở. Nơi đó có thứ cậu cần thấy.'], { kill: { ho_vuong_thien_khoi: 8 } }, rw(57, 'elite', [['da_cuong_hoa_than_thoai', 3]]));
  Q('c6q7', 'Lá thư của Số 1', 'truong_lang_6', [
    'Trưởng Thịnh: Trong Thành Khôi Sụp có một cuốn nhật ký của người chơi số 1. Tên anh ta là Triệu Cương.',
    'Trưởng Thịnh: Thủ Lĩnh Khôi Tàn giữ nó. Hạ hắn rồi đọc.',
  ], [
    'Nhật ký Triệu Cương: "Ngày 1: Hệ thống nói tôi là người mạnh nhất. Ngày 300: Tôi không nhớ mình đã đánh ai. Ngày 301: Tôi chỉ còn cơn giận."',
    'Nhật ký Triệu Cương: "Ngày 302: Nó nói tôi đã đạt thành. Tôi bị cắm vào một cột đá. Tôi vẫn nghe thấy tiếng lửa."',
  ], { kill: { thu_linh_khoi_tan: 1 } }, rw(58, 'elite', [['loi_tinh_van', 3]]));
  Q('c6q8', 'Trụ Mộng Thiên Khôi', 'truong_lang_6', [
    'Trưởng Thịnh: Trụ Mộng là cột đá giam ý thức của Triệu Cương. Hệ thống dùng anh ta để giữ cổng, và anh ta đã hóa thành cơn giận không ngừng.',
    'Trưởng Thịnh: Hạ anh ta không phải để giết. Hãy xem như để giải thoát.',
  ], [
    'Trụ Mộng vỡ, lửa tắt dần. Giữa tro tàn, một người đàn ông cao lớn quỳ xuống, tỉnh lại trong một khắc.',
    'Triệu Cương: ...Đã lâu rồi mới thấy ánh sáng. Cậu là người chơi thứ bảy?',
    'Triệu Cương: Đừng trở thành người thứ tám.',
    '[Hệ thống] Mảnh Hệ thống trong túi nóng lên.',
  ], { kill: { tru_mong_thien_khoi: 1 } }, rw(60, 'boss', [['ao_thien_khoi', 1], ['loi_tinh_van', 4]], { skillPoints: 3 }));
  Q('c6q9', 'Điều Hệ thống không nói', 'truong_lang_6', [
    'Trưởng Thịnh (chuyển lời Hội trưởng Khải): Cậu về rồi. Lữ khách đã nói chuyện với tôi qua đường truyền.',
    'Trưởng Thịnh (chuyển lời Hội trưởng Khải): Các người chơi trước không biến mất khi chạm hạng S. Họ bị Hệ thống cắm vào trụ để giữ các cổng khỏi vỡ ra, rồi gọi việc đó là "đạt thành".',
  ], [
    'Trưởng Thịnh (chuyển lời Hội trưởng Khải): Thiên đã biết điều này. Chúng tôi từng cãi nhau về nó suốt đêm.',
    'Trưởng Thịnh (chuyển lời Hội trưởng Khải): Vùng tiếp theo là Long Mạch. Cửa đã mở.',
    '[Hệ thống] Đã mở khóa: Chương 7 – Long Mạch.',
  ], {}, rw(60, 'story', [['binh_mau_than_thoai', 4]]));

  // ===================================================================== Chương 7 – Long Mạch (61–70) · giao: Khải, Vy
  Q('c7q1', 'Vết thương của đất', 'truong_lang_6', [
    'Trưởng Thịnh: Mạch ngầm của Vùng Long Mạch đang chảy ngược. Nước ngọc tràn ra từ hang, người chạm vào thì ngủ mê không dậy.',
    'Trưởng Thịnh: Vy xin đi cùng lần này. Cô ấy nói trong Vùng có tiếng gọi quen.',
  ], ['Trưởng Thịnh: Cửa Long Mạch đã mở. Giữ lấy dây an toàn, đá ở đó trơn.'], {}, rw(61, 'story', [['binh_mau_than_thoai', 3]]));
  Q('c7q2', 'Cửa Long Mạch', 'truong_lang_6', [
    'Trưởng Thịnh: Rắn Mạch Ngọc và Rùa Đá Mạch canh cửa vào. Chúng không ác, nhưng đã mất mạch để theo, nên cắn bất cứ thứ gì.',
    'Trưởng Thịnh: Hạ 12 con mỗi loại. Cần cấp 61.',
  ], ['Trưởng Thịnh: Suối Long Cốt đã mở. Nước ở đó đục như sữa, đừng uống.'], { kill: { tan_du_long_mach: 12, rua_da_mach: 12 }, level: 61 }, rw(61, 'hunt', [['da_cuong_hoa_than_thoai', 2]]));
  Q('c7q3', 'Nước ngọc', 'truong_lang_6', [
    'Trưởng Thịnh: Thợ chế tác Thiết cần Mảnh Ngọc Mạch để rèn bộ cấp 61–70. Ngọc rơi từ rắn và rùa.',
    'Trưởng Thịnh: Thu 8 mảnh.',
  ], ['Trưởng Thịnh: Ngọc này ấm lắm, như còn mạch đập bên trong. Thiết sẽ vui.'], { collect: { manh_ngoc_mach: 8 } }, rw(62, 'hunt', [['loi_tinh_van', 2]]));
  Q('c7q4', 'Suối Long Cốt', 'truong_lang_6', [
    'Trưởng Thịnh: Linh Thủy Mạch ở suối đang sinh sôi bất thường. Chúng uống mạch rồi lớn như thủy quái.',
    'Trưởng Thịnh: Hạ 20 con và đạt cấp 65 trước khi vào sâu hơn.',
  ], ['Trưởng Thịnh: Mạch Ngầm Lam đã mở. Ở đó có thứ Vy muốn cậu nhìn.'], { kill: { linh_thuy_mach: 20 }, level: 65 }, rw(65, 'hunt', [['da_cuong_hoa_than_thoai', 2]]));
  Q('c7q5', 'Dẫn Hạt Mạch', 'truong_lang_6', [
    'Trưởng Thịnh: Có một Hạt Mạch, mảnh nhỏ của dòng chảy, bị kẹt trong Mạch Ngầm Lam. Nếu nó nối lại, mạch của cả Vùng sẽ liền.',
    'Trưởng Thịnh: Đi dọc ba điểm dẫn mạch, chạm vào từng điểm để dẫn Hạt Mạch qua. Quái sẽ tìm cách ngăn.',
  ], ['Ba điểm dẫn mạch sáng lên liền nhau. Dòng chảy xanh ngọc chảy xuôi, êm như hơi thở.', 'Trưởng Thịnh: Hạt Mạch đã qua. Mạch bắt đầu liền lại.'], { visit: ['hat_mach_1', 'hat_mach_2', 'hat_mach_3'] }, rw(66, 'hunt', [['binh_mau_than_thoai', 4]]));
  Q('c7q6', 'Giáp vảy', 'truong_lang_6', [
    'Trưởng Thịnh: Điện Vảy Rồng ở phía trong có Hộ Mạch Giáp Vảy và Rồng Con Mất Mẹ. Rồng con thì đừng đánh quá tay, nó chỉ đang tìm mẹ.',
    'Trưởng Thịnh: Hạ 8 Hộ Mạch Giáp Vảy.',
  ], ['Trưởng Thịnh: Điện Vảy Rồng đã mở. Mạch chảy về phía đó, và Vy nói tiếng gọi cũng từ đó ra.'], { kill: { ho_vuong_long_mach: 8 } }, rw(67, 'elite', [['da_cuong_hoa_than_thoai', 3]]));
  Q('c7q7', 'Tiếng gọi người y sư', 'vy', [
    'Vy: Cậu nghe không? Phép chữa đó... tôi quen. Đội Bình Minh từng có một y sư dùng đúng nhịp thở này.',
    'Vy: Thủ Lĩnh Mạch Vỡ giữ lối vào hang trụ. Hạ nó, tôi muốn biết ai đang gọi.',
  ], [
    'Vy đứng im rất lâu trước hang. Tiếng gọi ngừng lại, như đang chờ.',
    'Vy: ...Đó là một người chơi. Cô ấy chữa cho mọi người bằng chính máu của mình.',
  ], { kill: { thu_linh_mach_vo: 1 } }, rw(68, 'elite', [['loi_tinh_van', 3]]));
  Q('c7q8', 'Trụ Mộng Long Mạch', 'vy', [
    'Vy: Diệp Tâm. Người chơi số 2. Hệ thống dùng phép chữa của cô ấy để nuôi cổng: thương tích của người khác chảy vào cô ấy.',
    'Vy: Tôi sẽ đi cùng cậu tới cuối cùng. Nhưng tôi không muốn cô ấy phải chịu thêm nữa.',
  ], [
    'Trụ Mộng Long Mạch vỡ, nước ngọc rút về lòng đất. Diệp Tâm tỉnh lại một khắc.',
    'Vy cầm tay cô ấy lúc cô tan đi. Diệp Tâm: Chữa cho người khác xong thì tự chữa cho mình nữa nhé.',
    'Vy khóc, lần đầu tiên trước mặt cậu.',
  ], { kill: { tru_mong_long_mach: 1 } }, rw(70, 'boss', [['ao_long_mach', 1], ['loi_tinh_van', 4]], { skillPoints: 3 }));
  Q('c7q9', 'Đường tới Tinh Hà', 'truong_lang_6', [
    'Trưởng Thịnh: Lối từ Mạch Ngầm Lam dẫn tới một Tân Đô mới của Hiệp Hội: Tinh Hà. Viện trưởng Minh Triết đang đợi cậu.',
    'Trưởng Thịnh: Ông ta hay quên ăn quên ngủ. Nhưng ông ta đã theo dấu Hệ thống suốt mười năm.',
  ], ['Trưởng Thịnh: Đi đi. Tôi ở lại giữ Thiên Đô.', '[Hệ thống] Đã mở khóa: Chương 8 – Tinh Vân (Tân Đô VII – Tinh Hà).'], {}, rw(70, 'story', [['binh_mau_than_thoai', 5]]));

  // ===================================================================== Chương 8 – Tinh Vân (71–80) · giao: Viện trưởng Minh Triết
  Q('c8q1', 'Viện trưởng Minh Triết', 'minh_triet', [
    'Minh Triết: Ồ, cậu đến rồi. Xin lỗi, tôi quên ăn trưa. Tôi đang vẽ các cổng lên bản đồ: chúng nằm theo một hình.',
    'Minh Triết: Vùng Tinh Vân là nơi bản vẽ này phát sáng mạnh nhất. Tôi muốn cậu ra Bến Sao Rơi xem tận mắt.',
  ], ['Minh Triết: Bến Sao Rơi đã mở. Đem về mọi thứ lạ lùng cậu thấy.'], {}, rw(71, 'story', [['binh_mau_than_thoai', 3]]));
  Q('c8q2', 'Bến Sao Rơi', 'minh_triet', [
    'Minh Triết: Sao Băng Sống và Nhện Tinh Vân tụ ở bến. Chúng ăn bụi sao rồi lớn.',
    'Minh Triết: Hạ 12 con mỗi loại. Cần cấp 71.',
  ], ['Minh Triết: Dải Tinh Vân Tím đã mở. Màu tím đó là bụi sao đang kết tinh.'], { kill: { tan_du_tinh_van: 12, nhen_tinh_van: 12 }, level: 71 }, rw(71, 'hunt', [['da_cuong_hoa_than_thoai', 2]]));
  Q('c8q3', 'Mảnh sao', 'minh_triet', [
    'Minh Triết: Thợ chế tác Thiết cần Mảnh Tinh Vân để rèn bộ cấp 71–80. Mảnh rơi từ Sao Băng Sống và Nhện Tinh Vân.',
    'Minh Triết: Thu 8 mảnh.',
  ], ['Minh Triết: Đẹp quá. Chạm vào nghe tiếng ù xa xăm, như bài hát cổ.'], { collect: { manh_tinh_van: 8 } }, rw(72, 'hunt', [['loi_tinh_van', 2]]));
  Q('c8q4', 'Dải Tinh Vân Tím', 'minh_triet', [
    'Minh Triết: Thợ Quan Trắc Méo từng là học trò của tôi. Hệ thống bóp méo họ khi các trạm quan trắc sập.',
    'Minh Triết: Hạ 20 con. Làm ơn đừng nhìn mặt chúng quá lâu. Cần cấp 75.',
  ], ['Minh Triết: Trạm Quan Trắc Hỏng đã mở. Có một số trợ lý của tôi vẫn bị kẹt trong đó.'], { kill: { tho_quan_trac_meo: 20 }, level: 75 }, rw(75, 'hunt', [['da_cuong_hoa_than_thoai', 2]]));
  Q('c8q5', 'Giải cứu người đo sao', 'minh_triet', [
    'Minh Triết: Bốn trợ lý của tôi bị kẹt trong Trạm Quan Trắc. Mái trạm sập, cửa bị chặn.',
    'Minh Triết: Nói chuyện với từng người trong trạm để đưa họ ra. Quái sẽ cản.',
  ], ['Bốn trợ lý thoát ra, mặt tái, tay vẫn ôm chặt cuộn bản vẽ.', 'Minh Triết: Cảm ơn! Bản vẽ vẫn còn nguyên. Tôi tưởng mất hết rồi.'], { visit: ['tro_ly_1', 'tro_ly_2', 'tro_ly_3', 'tro_ly_4'] }, rw(76, 'hunt', [['binh_mau_than_thoai', 4]]));
  Q('c8q6', 'Kỵ sĩ sao tím', 'minh_triet', [
    'Minh Triết: Kỵ Sĩ Sao Tím là vệ binh cũ của Viện, nay bị bụi sao nhiễm và đánh theo đội. Chúng canh lối vào Vành Đai Thiên Thạch.',
    'Minh Triết: Hạ 8 tên. Đừng đứng yên khi nghe tiếng sao rơi.',
  ], ['Minh Triết: Vành Đai đã mở. Đó là nơi cuối cùng bản vẽ chỉ tới.'], { kill: { ho_vuong_tinh_van: 8 } }, rw(77, 'elite', [['da_cuong_hoa_than_thoai', 3]]));
  Q('c8q7', 'Hình của ổ khóa', 'minh_triet', [
    'Minh Triết: Thủ Lĩnh Vành Đai giữ mảnh bản vẽ cuối của Quan Tinh, nhà thiên văn đầu tiên tính ra hình của các cổng.',
    'Minh Triết: Hạ hắn, lấy mảnh đó, ghép lại.',
  ], [
    'Mảnh bản vẽ ghép vào bản đồ. Các cổng nối nhau thành một hình tròn khép kín với bảy điểm.',
    'Minh Triết: Đây là một ổ khóa. Các cổng không mở thế giới ra. Chúng giữ thứ gì đó lại.',
  ], { kill: { thu_linh_vanh_dai: 1 } }, rw(78, 'elite', [['loi_tinh_van', 3]]));
  Q('c8q8', 'Trụ Mộng Tinh Vân', 'minh_triet', [
    'Minh Triết: Quan Tinh, người chơi số 4. Anh ta tính ra con số bảy: bảy chìa mới đủ để gia cố ổ khóa. Rồi anh ta bị cắm vào trụ.',
    'Minh Triết: Tôi từng đọc bản thảo của anh ta hàng trăm lần. Làm ơn, hãy cho anh ta nghỉ.',
  ], [
    'Trụ Mộng Tinh Vân vỡ thành bụi sao. Quan Tinh hiện ra như một nhà khoa học mệt mỏi.',
    'Quan Tinh: Số bảy... Cậu là chìa thứ bảy nhưng không bị nuốt. Có lẽ vì cậu chưa từng tin Hệ thống hoàn toàn.',
  ], { kill: { tru_mong_tinh_van: 1 } }, rw(80, 'boss', [['ao_tinh_van', 1], ['loi_tinh_van', 4]], { skillPoints: 3 }));
  Q('c8q9', 'Con số bảy', 'minh_triet', [
    'Minh Triết: Bản vẽ của Quan Tinh cho thấy một điều: Hệ thống không mở cổng. Nó giữ cổng.',
    'Minh Triết: Lữ khách đang đứng ở cổng làng, ông ta muốn gặp cậu.',
  ], [
    'Lữ khách im lặng rất lâu. Rồi nói: Ta đã nghi từ lâu. Ta không muốn tin.',
    'Minh Triết: Vùng Thần Mộng đã mở. Cậu nên đi, trước khi cơn mộng đó nuốt thêm ai nữa.',
    '[Hệ thống] Đã mở khóa: Chương 9 – Thần Mộng.',
  ], {}, rw(80, 'story', [['binh_mau_than_thoai', 5]]));

  // ===================================================================== Chương 9 – Thần Mộng (81–90) · giao: Minh Triết, Vy
  Q('c9q1', 'Cổng Mộng', 'minh_triet', [
    'Minh Triết: Vùng Thần Mộng không có hình thù cố định. Ai bước vào sẽ nhìn thấy điều mình mong nhất.',
    'Minh Triết: Tôi thì thấy một phòng thí nghiệm sạch sẽ, có người pha trà cho tôi. Cậu cẩn thận.',
  ], ['Minh Triết: Cổng Mộng đã mở. Nhớ rằng những gì cậu thấy không phải lúc nào cũng thật.'], {}, rw(81, 'story', [['binh_mau_than_thoai', 3]]));
  Q('c9q2', 'Vườn hoa không có mùi', 'minh_triet', [
    'Minh Triết: Bướm Mộng và Bóng Gương ở Vườn Hoa Ảo. Hoa ở đó đẹp, nhưng không có mùi, và bướm không có tiếng cánh.',
    'Minh Triết: Hạ 13 con mỗi loại. Cần cấp 81.',
  ], ['Minh Triết: Vườn Hoa Ảo đã mở. Hoa có mùi hơn rồi, tôi nghĩ vậy.'], { kill: { tan_du_than_mong: 13, bong_guong: 13 }, level: 81 }, rw(81, 'hunt', [['da_cuong_hoa_than_thoai', 2]]));
  Q('c9q3', 'Cánh bướm mộng', 'minh_triet', [
    'Minh Triết: Thợ chế tác Thiết cần Cánh Bướm Mộng để rèn bộ cấp 81–90. Cánh rơi từ bướm và bóng gương.',
    'Minh Triết: Thu 8 cánh. Cẩn thận, nó tan khi nhìn quá lâu.',
  ], ['Minh Triết: Mỏng như giấc mơ. Thiết sẽ rèn được thứ nhẹ như không khí.'], { collect: { canh_buom_mong: 8 } }, rw(82, 'hunt', [['loi_tinh_van', 2]]));
  Q('c9q4', 'Mê cung gương', 'minh_triet', [
    'Minh Triết: Hoa Ảo Ăn Thịt giăng khắp Mê Cung Gương. Chúng ăn những người đi lạc, rồi lấy khuôn mặt của họ để dụ người khác.',
    'Minh Triết: Hạ 20 con và đạt cấp 85.',
  ], ['Minh Triết: Tháp Mộng Đảo đã hiện ra giữa mê cung. Một cánh cổng đen nằm ở đỉnh tháp.'], { kill: { hoa_ao_an_thit: 20 }, level: 85 }, rw(85, 'hunt', [['da_cuong_hoa_than_thoai', 2]]));
  Q('c9q5', 'Giấc mơ của Vy', 'vy', [
    'Vy: Cậu có thấy không? Tôi vừa ngủ gật, và tôi thấy đội Bình Minh ngồi quanh bàn ăn. Minh cười, Đoạn lại khoe thanh kiếm, Khăn đang vá áo.',
    'Vy: Tôi muốn ở lại đó. Chỉ một chút thôi. Cậu nghĩ tôi nên làm gì?',
  ], ['Vy: ...Cảm ơn. Tôi sẽ không quên họ. Cũng không để họ giữ tôi lại.'], {}, rw(86, 'story', [['binh_mau_than_thoai', 4]]), {
    choices: [
      { id: 'tam_biet', label: 'Nói lời tạm biệt: "Họ sẽ muốn cô sống tiếp."', title: 'Người Tiễn Đưa', text: 'Vy: Họ luôn bảo tôi cứng đầu. Lần này, tôi nghe theo.' },
      { id: 'o_lai', label: 'Ở lại một chút: "Chúng ta còn thời gian."', title: 'Người Giữ Ký Ức', text: 'Vy: Chỉ một chút thôi nhé. Rồi cậu phải kéo tôi ra.' },
      { id: 'cung_di', label: 'Cùng ngồi xuống: "Cho tôi gặp họ với."', title: 'Người Đồng Hành Giấc Mơ', text: 'Vy: ...Họ sẽ quý cậu đấy. Minh chắc chắn sẽ trêu cậu.' },
    ],
  });
  Q('c9q6', 'Nghệ nhân gương', 'minh_triet', [
    'Minh Triết: Nghệ Nhân Gương trong Mê Cung vẽ lại khuôn mặt ai bước vào, rồi giữ họ lại cho tới khi họ quên lối ra.',
    'Minh Triết: Hạ 8 tên. Đừng nhìn vào gương của chúng.',
  ], ['Minh Triết: Thang lên đỉnh tháp đã mở. Mộng Điệp ở trên đó.'], { kill: { ho_vuong_than_mong: 8 } }, rw(87, 'elite', [['da_cuong_hoa_than_thoai', 3]]));
  Q('c9q7', 'Bức tranh cuối', 'minh_triet', [
    'Minh Triết: Mộng Điệp là họa sĩ. Cô vẽ một thế giới không có cổng, và Hệ thống cho cô quyền biến mơ thành thật.',
    'Minh Triết: Thủ Lĩnh Mê Cung giữ bức tranh cuối của cô. Hạ hắn, lấy nó.',
  ], [
    'Bức tranh cuối: một cánh đồng hoa, một người đứng một mình, và bầu trời không có vết nứt nào.',
    'Minh Triết: Cô ấy vẽ thế giới không cần ai hi sinh. Chỉ tiếc là cô ấy đã hi sinh chính mình để vẽ nó.',
  ], { kill: { thu_linh_me_cung: 1 } }, rw(88, 'elite', [['loi_tinh_van', 3]]));
  Q('c9q8', 'Trụ Mộng Thần Mộng', 'minh_triet', [
    'Minh Triết: Mộng Điệp, người chơi số 5. Giấc mơ của cô đã nuốt dần cả cô lẫn những người lạc vào.',
    'Minh Triết: Hãy đánh thức cô ấy, nhẹ nhàng nhất có thể.',
  ], [
    'Trụ Mộng Thần Mộng vỡ như gương. Mộng Điệp ngồi giữa đám cánh bướm, cọ vẽ vẫn trong tay.',
    'Mộng Điệp: Tôi vẽ xong rồi, phải không? Chỉ tiếc là tôi không ở trong bức tranh được.',
  ], { kill: { tru_mong_than_mong: 1 } }, rw(90, 'boss', [['ao_than_mong', 1], ['loi_tinh_van', 4]], { skillPoints: 3 }));
  Q('c9q9', 'Một Trụ nữa', 'minh_triet', [
    'Minh Triết: Bốn Trụ đã giải. Bản vẽ của tôi vừa sáng lên: một vết nứt mới ở Tháp Mộng Đảo, dẫn về phía Sáng Thế.',
    'Minh Triết: Đó là Trụ thứ năm, nơi mọi chuyện bắt đầu.',
  ], [
    'Lữ khách: Ta chưa bao giờ biết Trụ thứ năm giam ai. Có lẽ không ai muốn biết.',
    '[Hệ thống] Đã mở khóa: Chương 10 – Sáng Thế.',
  ], {}, rw(90, 'story', [['binh_mau_than_thoai', 5]]));

  // ===================================================================== Chương 10 – Sáng Thế (91–100) · giao: Minh Triết, Lăng
  Q('c10q1', 'Biên giới khởi nguyên', 'minh_triet', [
    'Minh Triết: Qua Tháp Mộng Đảo là Vùng Sáng Thế. Mảnh Hệ thống trong túi cậu đang phát sáng như chưa từng.',
    'Minh Triết: Nếu bản vẽ của tôi đúng, đây là nơi ổ khóa nằm. Cậu sắp thấy thứ giữ các cổng suốt ba trăm năm.',
  ], ['Minh Triết: Đồng Bằng Khởi Nguyên đã mở. Cậu đi trước. Tôi viết lại mọi thứ ở đây.'], {}, rw(91, 'story', [['binh_mau_than_thoai', 4]]));
  Q('c10q2', 'Đồng bằng khởi nguyên', 'minh_triet', [
    'Minh Triết: Hạt Giống Ánh Sáng và Cá Ký Ức là những quái đầu tiên ở Sáng Thế. Chúng sinh ra từ ký ức tan vỡ.',
    'Minh Triết: Hạ 15 con mỗi loại. Cần cấp 91.',
  ], ['Minh Triết: Rừng Ánh Sáng đã mở. Ánh sáng ở đó không làm hại, nhưng cũng không dễ chịu.'], { kill: { tan_du_sang_the: 15, ca_ky_uc: 15 }, level: 91 }, rw(91, 'hunt', [['da_cuong_hoa_than_thoai', 3]]));
  Q('c10q3', 'Biển ký ức', 'minh_triet', [
    'Minh Triết: Thợ chế tác Thiết cần Mảnh Ký Ức để rèn bộ cấp 91–100. Mảnh rơi từ Hạt Giống Ánh Sáng và Cá Ký Ức.',
    'Minh Triết: Thu 10 mảnh. Chúng là ký ức của người chơi cũ, hãy giữ gìn.',
  ], ['Minh Triết: Mỗi mảnh là một khoảnh khắc ai đó từng hạnh phúc. Tôi sẽ cất giữ cẩn thận.'], { collect: { manh_ky_uc: 10 } }, rw(93, 'hunt', [['loi_tinh_van', 3]]));
  Q('c10q4', 'Ba cánh cửa', 'minh_triet', [
    'Minh Triết: Rừng Ánh Sáng có ba cánh cửa cổ. Mỗi cánh dẫn tới một nơi cậu từng trải qua: người cần cứu, nơi cần giữ, đường cần dẫn.',
    'Minh Triết: Chạm vào cả ba cánh cửa và dọn thiên thần rỗng đang canh giữ. Nó sẽ thử cậu bằng cả ba điều.',
  ], ['Ba cánh cửa sáng lên cùng lúc, mở ra một con đường dẫn lên Ngai Sáng Thế.', 'Minh Triết: Cậu đã qua cả ba thử thách của Vùng. Lên đỉnh thôi.'], { visit: ['cua_sang_1', 'cua_sang_2', 'cua_sang_3'], kill: { thien_than_rong: 20 } }, rw(95, 'hunt', [['binh_mau_than_thoai', 5]]));
  Q('c10q5', 'Người gác ngai', 'minh_triet', [
    'Minh Triết: Người Gác Ngai và Bản Sao Số 7 canh giữ lối lên ngai. Bản Sao đánh y như cậu, hãy đề phòng.',
    'Minh Triết: Hạ 8 tên Người Gác Ngai.',
  ], ['Minh Triết: Ngai Sáng Thế đã hiện ra. Ở đó có một người đang đợi cậu.'], { kill: { ho_vuong_sang_the: 8 } }, rw(96, 'elite', [['da_cuong_hoa_than_thoai', 4]]));
  Q('c10q6', 'Lăng', 'lang_hinh', [
    'Lăng: Ngươi tới rồi. Ta đã đợi ba trăm năm.',
    'Lăng: Ba trăm năm trước, Thực Thể tìm tới thế giới này. Ta là người thức tỉnh đầu tiên. Ta biến ý thức của mình thành một ổ khóa để giam nó lại. Các ngươi gọi ổ khóa đó là Hệ thống.',
    'Lăng: Hệ thống tuyển thợ săn mạnh làm chìa để gia cố ổ khóa, không phải để mở nó. Nhưng ba trăm năm qua, ổ khóa tự ăn mòn thành cơn đói. Mỗi chìa đều bị nuốt. Ta xin lỗi.',
    'Lăng: Hãy giải thoát ta. Hoặc quyết định thay ta. Trước đó, hãy thử sức mình với phần cuối của ổ khóa này.',
  ], ['Lăng: Ngươi không giống sáu người trước. Họ tin ta. Ngươi thì hỏi ta.', 'Lăng: Ta sẽ không cản ngươi. Nhưng phần còn lại của ổ khóa sẽ cản, vì nó chỉ biết tự vệ.'], {}, rw(98, 'story', [['binh_mau_than_thoai', 5]]));
  Q('c10q7', 'Trụ Mộng Sáng Thế', 'lang_hinh', [
    'Lăng: Phần cuối của ổ khóa đã thức dậy. Đó không còn là ta nữa, chỉ là bản năng tự vệ. Nó sẽ đánh bằng mọi chiêu ngươi từng thấy.',
    'Lăng: Vy, Lam Sương, Lữ khách, Thiết... những người ngươi tin đều đứng sau ngươi. Đi đi.',
  ], [
    'Trụ Mộng Sáng Thế vỡ thành hàng nghìn mảnh sáng. Giữa ánh sáng, Lăng hiện ra, nhẹ như không.',
    'Lăng: Giờ đây ta hỏi ngươi, người chơi số 7. Ngươi muốn ổ khóa này thành gì?',
  ], { kill: { tru_mong_sang_the: 1 } }, rw(100, 'boss', [['ao_sang_the', 1], ['loi_tinh_van', 6]], { skillPoints: 5 }));
  Q('c10q8', 'Lựa chọn của Số 7', 'lang_hinh', [
    'Lăng: Có ba con đường. Giải thoát ta và để ổ khóa tan. Giữ ổ khóa nhưng cho phép người ta từ chối. Hoặc viết lại nó theo cách không nuốt ai.',
    'Lăng: Cậu chọn đi. Dù chọn gì, thế giới này vẫn còn một cánh cổng mở cho cậu.',
  ], ['[Hệ thống] ...', '[Hệ thống] Người chơi số 7. Trạng thái: tự do. Chế độ cổng ngẫu nhiên đã mở.', '— Hết Phần Hai: Năm Trụ Mộng —'], {}, rw(100, 'story', [['sach_ky_nang_vo_dinh', 1], ['da_cuong_hoa_than_thoai', 8]], { skillPoints: 8 }), {
    choices: [
      { id: 'pha_chuoi', label: 'Phá Chuỗi: "Giải thoát bà. Để ổ khóa tan."', title: 'Người Phá Chuỗi', text: 'Lăng mỉm cười, tan thành ánh sáng. Các cổng đóng dần; thợ săn mất sức mạnh Hệ thống nhưng không ai phải trả giá nữa.' },
      { id: 'giu_loi', label: 'Giữ Lời: "Giữ ổ khóa, nhưng ai cũng được quyền từ chối."', title: 'Người Giữ Lời', text: 'Lăng gật đầu. Hệ thống tiếp tục, nhưng từ nay, thợ săn tự quyết có nhận sức mạnh hay không.' },
      { id: 'viet_lai', label: 'Viết Lại: "Để tôi giữ ổ khóa theo cách không nuốt ai."', title: 'Người Viết Lại', text: 'Ánh sáng quấn quanh cậu. Từ bên kia cổng, Thiên bước ra, nhận phần giữ cổng thay cậu. Ổ khóa mới không còn đói.' },
    ],
  });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
