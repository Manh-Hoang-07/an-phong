/*
 * Class (chọn ở cấp 5), thức tỉnh, vũ khí đánh thường, nội tại.
 */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------- Class (chọn ở cấp 5)
  // special: class đặc biệt, không có trong danh sách chọn, chỉ mở bằng mã code ở Lữ khách bí ẩn
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
    tu_linh_thuat_su: {
      name: 'Tử Linh Thuật Sư', weapon: 'linh_chau', color: 0xb46bff, icon: '☠️', special: true,
      desc: 'Nhánh tiến hóa của Triệu Hồi Sư. Thu phục quái làm bóng ma, lưu tối đa 20 và gọi tối đa 7 cùng lúc.',
      // chỉ số gốc = [cơ bản, mỗi cấp]
      curve: { hp: [105,50], mp: [80,12], atk: [8,5.25], def: [3,2.5] },
      bonus: { skillPower: 1.12 },
    },
  };

  // Chưa chọn class (cấp 1–4): đường cong chung
  const NOVICE_CURVE = { hp: [100, 50], mp: [40, 6], atk: [8, 5], def: [2, 2.5] };

  // Chức nghiệp 2 (nhánh tiến hóa, cấp 25) KHÔNG nhân chỉ số. Nó mạnh hơn chức nghiệp 1 nhờ bộ kỹ năng riêng (SKILLS có evolutionKey).
  // Ấn thức tỉnh (AWAKENS) dùng chung mọi class và chồng được lên chức nghiệp 2.

  // ---------------------------------------------------------------- Thức tỉnh (biến hình)
  // Sau khi chọn class (cấp 5) người chơi có thể "thức tỉnh" thêm các bậc biến hình.
  // Mỗi bậc nhân chỉ số (mul), đổi màu (tint) và vầng quang (aura) nhân vật.
  // awakenTier: 0 = chưa biến hình, 1 = Ấn 1, 2 = Ấn 2.
  const AWAKENS = [
    // Thức tỉnh = kỹ năng BIẾN HÌNH bật/tắt (phím T / nút ⚡). Chỉ số `mul` chỉ có tác dụng khi đang biến hình.
    // drain: mỗi giây biến hình tốn bấy nhiêu năng lượng (MP) và thể lực; cạn một trong hai thì tự trở lại dạng thường.
    { tier: 1, level: 20, npc: 'lao_su', name: 'Biến hình · Ấn thứ nhất', drain: 1,
      mul: { hp: 1.3, mp: 1.2, atk: 1.3, def: 1.15 }, tint: 0xffe082, aura: 0xffd54f, aura2: 0xfff3b0,
      desc: 'Mở khóa BIẾN HÌNH (phím T / nút ⚡): máu +30%, năng lượng +20%, tấn công +30%, phòng thủ +15%, hào quang vàng rực. Tốn 1 năng lượng và 1 thể lực mỗi giây.',
      start: [
        'Hội trưởng Khải: Cậu đã đi được xa rồi. Nhưng sức mạnh class chỉ là khởi đầu.',
        'Hội trưởng Khải: Trong Cổng Vĩnh Hằng có năng lượng gốc. Để dấu ấn đầu tiên in lên cậu, cậu cần đạt cấp 25.',
        'Hội trưởng Khải: Sẵn sàng chưa? Nó sẽ đau. Và tóc cậu... có thể đổi màu.',
      ],
      end: [
        '[Hệ thống] Dấu ấn thức tỉnh thứ nhất đã kích hoạt. Cơ thể vượt qua giới hạn cũ.',
        'Hội trưởng Khải: Nhìn cậu đi... Đúng là người được Hệ thống chọn.',
      ] },
    { tier: 2, level: 45, npc: 'lu_khach', name: 'Biến hình · Ấn thứ hai', drain: 2,
      mul: { hp: 1.6, mp: 1.5, atk: 1.6, def: 1.3 }, tint: 0xff80ab, aura: 0xff6ec7, aura2: 0xffd6f0,
      desc: 'Nâng BIẾN HÌNH lên dạng dị giới: máu +60%, năng lượng +50%, tấn công +60%, phòng thủ +30%, hào quang hồng tím kèm tia điện. Tốn 2 năng lượng và 2 thể lực mỗi giây.',
      start: [
        'Lữ khách: Cậu đã thấy bản chất của Hệ thống rồi. Nó không cho đi sức mạnh — nó mượn.',
        'Lữ khách: Dấu ấn thứ hai không lấy từ Hệ thống, mà từ chính ký ức của những người chơi đã mất tích.',
        'Lữ khách: Đạt cấp 45, ta sẽ chỉ cho cậu. Nhưng sau này, cậu sẽ không còn hoàn toàn là người.',
      ],
      end: [
        '[Hệ thống] Dấu ấn thức tỉnh thứ hai đã kích hoạt. Cậu đã vượt ra ngoài quản lý của Hệ thống.',
        'Lữ khách: Đi đi, người chơi thứ 7. Còn một Cổng cuối cùng đợi cậu.',
      ] },
  ];

  // ---------------------------------------------------------------- Vũ khí đánh thường
  // Mỗi class chỉ dùng đúng một loại vũ khí (SCHOOLS[...].weapon). look: dáng vũ khí rời (kiem/cung/truong) dùng cho
  // hình vẽ dự phòng, cách vung và đạn của trùm sao chép. proj/speed: đạn riêng của kiểu 'projectile'.
  const WEAPON_TYPES = {
    tay: { name: 'Tay không', range: 46, cooldown: 400, mult: 0.8, style: 'melee', look: 'kiem', icon: '👊' },
    kiem: { name: 'Kiếm', range: 74, cooldown: 360, mult: 1.0, style: 'melee', look: 'kiem', icon: '🗡️' },
    cung: { name: 'Cung', range: 400, cooldown: 430, mult: 0.8, style: 'projectile', look: 'cung', icon: '🏹' },
    truong: { name: 'Trượng', range: 170, cooldown: 480, mult: 0.95, style: 'wave', look: 'truong', icon: '🪄' },
    // Sát Thủ: hai dao ngắn, đánh rất nhanh, tầm ngắn
    song_dao: { name: 'Song Đao', range: 58, cooldown: 270, mult: 0.78, style: 'melee', look: 'kiem', icon: '🔪' },
    // Tanker: chùy nặng + khiên, chậm nhưng đòn mạnh
    chuy: { name: 'Chùy', range: 70, cooldown: 470, mult: 1.25, style: 'melee', look: 'kiem', icon: '🔨' },
    // Trị Liệu Sư: sóng phép ngắn hơn trượng, ra đòn nhanh hơn chút
    thanh_truong: { name: 'Thánh Trượng', range: 150, cooldown: 450, mult: 0.8, style: 'wave', look: 'truong', icon: '⚕️' },
    // Triệu Hồi Sư (cả nhánh Tử Linh): bắn cầu linh lực
    linh_chau: { name: 'Linh Châu', range: 320, cooldown: 440, mult: 0.85, style: 'projectile', look: 'truong', proj: 'proj_orb', speed: 520, icon: '🔮' },
    // Toàn Năng: thần binh riêng
    than_binh: { name: 'Thần Binh', range: 80, cooldown: 380, mult: 1.05, style: 'melee', look: 'kiem', icon: '⚜️' },
  };
  // Loại vũ khí của class (Tử Linh Thuật Sư là nhánh của Triệu Hồi Sư, dùng chung Linh Châu)
  function classWeapon(school) { return school && SCHOOLS[school] ? SCHOOLS[school].weapon : null; }
  // Class sở hữu một loại vũ khí (để hiện "Dùng cho: ...")
  function weaponOwners(wtype) { return Object.keys(SCHOOLS).filter(s => SCHOOLS[s].weapon === wtype && !(s === 'tu_linh_thuat_su')); }

  // Thể lực: tách riêng với năng lượng (MP). Đánh thường và dùng kỹ năng đều tốn; hết thì kiệt sức,
  // phải chờ hồi tới `unlock` (tỉ lệ so với tối đa) mới đánh tiếp được.
  //   max = base + perLevel × (cấp − 1) + perAgi × điểm Nhanh nhẹn
  //   attack: tốn mỗi đòn thường (nhân theo tốc độ đánh của vũ khí: cooldown / 400ms)
  //   regen: hồi mỗi giây khi đã ngừng đánh `delay` ms; đang đánh thì chỉ hồi `activeMul` phần
  const STAMINA = { base: 100, perLevel: 2, perAgi: 1, maxMul: 1.3, attack: 4.8, skill: 14, ult: 50, regen: 12, delay: 800, activeMul: 0.3, unlock: 0.3 };
  // Máu / năng lượng tự hồi mỗi giây khi không giao chiến (không đánh, không dùng kỹ năng, không bị đánh trong calmMs).
  // Đang biến hình thì không hồi. Thể lực hồi riêng theo STAMINA ở trên.
  const REGEN = { hp: 1, mp: 1, calmMs: 2000 };

  // Nội tại: luôn có tác dụng sau khi thức tỉnh class
  const PASSIVES = {
    kiem_si: { icon: '❤️', name: 'Kiếm Tâm', desc: 'Mỗi lần đánh thường trúng quái hồi 0,5% máu tối đa.' },
    cung_thu: { icon: '🎯', name: 'Yếu Điểm', desc: 'Đòn chí mạng gây 180% sát thương thay vì 160%.' },
    phap_su: { icon: '💠', name: 'Dòng Chảy', desc: 'Hồi 0,5% năng lượng tối đa mỗi giây ngay cả khi đang chiến đấu; ngoài chiến đấu hồi gấp đôi.' },
    sat_thu: { icon: '🌑', name: 'Bóng Tối', desc: 'Chí mạng đầu tiên sau kỹ năng lướt gây 250% sát thương.' },
    tanker: { icon: '⚔️', name: 'Thành Đồng', desc: 'Giảm thêm 10% sát thương nhận vào khi máu dưới 50%.' },
    tri_lieu_su: { icon: '🌿', name: 'Sinh Lực', desc: 'Kỹ năng hồi máu hồi thêm 20% lượng hồi.' },
    trieu_hoi_su: { icon: '🔮', name: 'Liên Kết Linh Thể', desc: 'Thực thể được triệu hồi gây thêm 10% sát thương.' },
    tu_linh_thuat_su: { icon: '☠️', name: 'Thu Hồn', desc: 'Quái thường và tinh anh do bạn kết liễu được lưu thành bóng ma. Bộ sưu tập tối đa 20 bóng.' },
  };

  const EVOLUTIONS = {
    kiem_si: 'kiem_thanh', cung_thu: 'than_xa', phap_su: 'dai_phap_su', sat_thu: 'anh_vuong',
    tanker: 'ho_ve_bat_khuat', tri_lieu_su: 'thanh_linh', trieu_hoi_su: 'tu_linh_thuat_su', toan_nang: 'toan_nang_tinh_thong',
  };
  const EVOLUTION_NAMES = { kiem_thanh:'Kiếm Thánh', than_xa:'Thần Xạ', dai_phap_su:'Đại Pháp Sư', anh_vuong:'Ảnh Vương',
    ho_ve_bat_khuat:'Hộ Vệ Bất Khuất', thanh_linh:'Thánh Linh', tu_linh_thuat_su:'Tử Linh Thuật Sư', toan_nang_tinh_thong:'Toàn Năng Tinh Thông' };
  Object.assign(G, { SCHOOLS, NOVICE_CURVE, AWAKENS, EVOLUTIONS, EVOLUTION_NAMES, WEAPON_TYPES, classWeapon, weaponOwners, PASSIVES, STAMINA, REGEN });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
