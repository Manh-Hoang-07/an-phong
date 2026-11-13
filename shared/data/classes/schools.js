/*
 * Class chọn ở cấp 5: tên, vũ khí, màu, đường cong chỉ số gốc.
 *
 * curve: [cơ bản, mỗi cấp] cho hp / mp / atk / def. Đây là chỉ số NỀN của class;
 * điểm tiềm năng và trang bị cộng thêm sau (xem shared/logic/player.js calcStats).
 *
 * Bảng SCHOOLS có HAI loại:
 *   - class nền (chọn được ở cấp 5): kiem_si, cung_thu, phap_su, sat_thu, tanker, tri_lieu_su, trieu_hoi_su
 *   - class đặc biệt (special: true, không có trong bảng chọn): toan_nang mở bằng mật mã
 *   - chức nghiệp 2 (evolved: true): sinh tự động ở cuối file, chỉ mở bằng Sách Tiến Hóa Chức Nghiệp
 * Lọc theo ý muốn: !s.special && !s.evolved = chỉ class nền.
 */
(function (G) {
  'use strict';

  const SCHOOLS = {
    kiem_si: {
      name: 'Kiếm Sĩ', weapon: 'kiem', color: 0xff5a4e, icon: '⚔️',
      desc: 'Cận chiến bằng kiếm, lướt và chém liên hoàn. Cân bằng công thủ, chỉ số tăng đều theo cấp.',
      // chỉ số gốc = [cơ bản, mỗi cấp]
      curve: { hp: [120,60], mp: [40,5], atk: [10,6], def: [4,3.25] },
      bonus: {},
    },
    cung_thu: {
      name: 'Cung Thủ', weapon: 'cung', color: 0x4fd18b, icon: '🏹',
      desc: 'Bắn cung từ xa. Tấn công tăng nhanh theo cấp, chí mạng +5%, nhưng máu và phòng thủ thấp.',
      // chỉ số gốc = [cơ bản, mỗi cấp]
      curve: { hp: [95,45], mp: [45,6], atk: [11,6.75], def: [2,2] },
      bonus: { critAdd: 5 },
    },
    phap_su: {
      name: 'Pháp Sư', weapon: 'truong', color: 0x6c8cff, icon: '🔮',
      desc: 'Dùng trượng phép khống chế quái, tự hồi máu và đỡ đòn bằng năng lượng. Năng lượng rất dồi dào, máu và phòng thủ thấp.',
      // chỉ số gốc = [cơ bản, mỗi cấp]
      curve: { hp: [100,47.5], mp: [70,11], atk: [10,6.25], def: [2,2.25] },
      bonus: {},
    },
    toan_nang: {
      name: 'Toàn Năng', weapon: 'than_binh', color: 0xffc94a, icon: '✴️', special: true,
      desc: 'Class đặc biệt, chỉ thức tỉnh được bằng mật mã. Dùng Thần Binh và mọi vũ khí của các class khác (cầm vũ khí class nào thì hóa thân thành class đó), học mọi kỹ năng của các class, ' +
        'có cả 3 nội tại, thêm 1 ô kỹ năng và tuyệt kỹ riêng. Kỹ năng gây 80% sức mạnh và tốn thêm 20% năng lượng.',
      skillPower: 0.8, skillCost: 1.2, bonus: {},
    },
    sat_thu: {
      name: 'Sát Thủ', weapon: 'song_dao', color: 0xe040fb, icon: '🗡️',
      desc: 'Tốc độ cao, chí mạng cực mạnh. Tấn công tăng nhanh nhất, chí mạng +10%, tốc chạy +15%, máu và phòng thủ thấp.',
      // chỉ số gốc = [cơ bản, mỗi cấp]
      curve: { hp: [90,42.5], mp: [40,5], atk: [12,7.25], def: [2,1.75] },
      bonus: { critAdd: 10, speed: 1.15 },
    },
    tanker: {
      name: 'Tanker', weapon: 'chuy', color: 0x90caf9, icon: '🛡️',
      desc: 'Hấp thụ đòn, chịu đựng cực tốt. Máu và phòng thủ tăng mạnh theo cấp, hút máu +3%, tấn công thấp.',
      // chỉ số gốc = [cơ bản, mỗi cấp]
      curve: { hp: [150,80], mp: [40,5], atk: [8,4.5], def: [6,4.75] },
      bonus: { lifestealAdd: 3 },
    },
    tri_lieu_su: {
      name: 'Trị Liệu Sư', weapon: 'thanh_truong', color: 0x69f0ae, icon: '💚',
      desc: 'Hồi máu, bảo vệ đồng đội, năng lượng dồi dào. Hồi chiêu kỹ năng -10%, tấn công thấp.',
      // chỉ số gốc = [cơ bản, mỗi cấp]
      curve: { hp: [110,52.5], mp: [80,13], atk: [7,4.75], def: [3,2.75] },
      bonus: { cdrAdd: 10 },
    },
    trieu_hoi_su: {
      name: 'Triệu Hồi Sư', weapon: 'linh_chau', color: 0x8d78d6, icon: '🔮',
      desc: 'Dùng linh lực gọi thực thể hỗ trợ chiến đấu. Năng lượng dồi dào, sức mạnh kỹ năng +8%.',
      // chỉ số gốc = [cơ bản, mỗi cấp]
      curve: { hp: [100,47.5], mp: [70,11], atk: [8,5], def: [2,2.25] },
      bonus: { skillPower: 1.08 },
    },
  };

  // ---------------------------------------------------------------- Chức nghiệp 2 (nhánh tiến hóa)
  // KHÔNG có trong bảng chọn class. Chỉ đổi được bằng Sách Tiến Hóa Chức Nghiệp sau khi làm
  // nhiệm vụ nâng cấp chức nghiệp ở NPC ẩn, và đổi là ĐỔI HẲN: không quay lại chức nghiệp 1.
  //
  // Kế thừa vũ khí / bonus / nội tại của class nền (spread bên dưới), chỉ đổi tên, màu, mô tả.
  // curve: null → shared/logic/player.js lấy đường cong class nền rồi nhân EVOLUTION_MUL (×1.3).
  // Kỹ năng: chỉ dùng bộ kỹ năng có evolutionKey trùng id nhánh (xem shared/logic/skills.js).
  const EVOLVED = {
    kiem_thanh: { base: 'kiem_si', name: 'Kiếm Thánh', color: 0xffd54f, icon: '⚔️',
      desc: 'Chức nghiệp 2 của Kiếm Sĩ. Kiếm khí chém diện rộng, phản kích bằng kiếm tâm, lướt xuyên mục tiêu.' },
    than_xa: { base: 'cung_thu', name: 'Thần Xạ', color: 0x42f5bb, icon: '🏹',
      desc: 'Chức nghiệp 2 của Cung Thủ. Bắn nhiều mũi cùng lúc, đặt bẫy và tung một phát xuyên phòng thủ.' },
    dai_phap_su: { base: 'phap_su', name: 'Đại Pháp Sư', color: 0x72c8ff, icon: '🔮',
      desc: 'Chức nghiệp 2 của Pháp Sư. Lôi xà, hỏa tường, tinh thạch hộ thân và bão nguyên tố.' },
    anh_vuong: { base: 'sat_thu', name: 'Ảnh Vương', color: 0xc75aff, icon: '🗡️',
      desc: 'Chức nghiệp 2 của Sát Thủ. Đoạt mệnh, phi đao u ảnh, thế thân bóng tối và bách ảnh sát.' },
    ho_ve_bat_khuat: { base: 'tanker', name: 'Hộ Vệ Bất Khuất', color: 0x8bdcff, icon: '🛡️',
      desc: 'Chức nghiệp 2 của Tanker. Khiên phi trận, thuẫn trận, chấn địa và pháo đài tiễn.' },
    thanh_linh: { base: 'tri_lieu_su', name: 'Thánh Linh', color: 0x9dffd0, icon: '💚',
      desc: 'Chức nghiệp 2 của Trị Liệu Sư. Hồi máu diện rộng, ban phước và che chở đồng đội.' },
    tu_linh_thuat_su: { base: 'trieu_hoi_su', name: 'Tử Linh Thuật Sư', color: 0xb46bff, icon: '☠️',
      bonus: { skillPower: 1.12 },
      desc: 'Chức nghiệp 2 của Triệu Hồi Sư. Thu phục quái làm bóng ma, lưu tối đa 20 và gọi tối đa 7 cùng lúc.' },
  };
  for (const [id, e] of Object.entries(EVOLVED)) SCHOOLS[id] = { ...SCHOOLS[e.base], ...e, evolved: true, curve: null };

  // Chưa chọn class (cấp 1–4): đường cong chung
  const NOVICE_CURVE = { hp: [100, 50], mp: [40, 6], atk: [8, 5], def: [2, 2.5] };

  Object.assign(G, { SCHOOLS, NOVICE_CURVE, EVOLVED });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
