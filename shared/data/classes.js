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
      desc: 'Cận chiến bằng kiếm, lướt và chém liên hoàn, chịu đòn tốt. Tấn công +10%, phòng thủ +10%.',
      bonus: { atk: 1.10, def: 1.10 },
    },
    cung_thu: {
      name: 'Cung Thủ', weapon: 'cung', color: 0x4fd18b, icon: '🏹',
      desc: 'Bắn cung từ xa, chí mạng cao nhưng máu mỏng. Tấn công +15%, chí mạng +5%, máu -8%.',
      bonus: { atk: 1.15, critAdd: 5, hp: 0.92 },
    },
    phap_su: {
      name: 'Pháp Sư', weapon: 'truong', color: 0x6c8cff, icon: '🔮',
      desc: 'Dùng trượng phép khống chế quái, tự hồi máu và đỡ đòn bằng năng lượng. Máu +12%, năng lượng +25%.',
      bonus: { hp: 1.12, mp: 1.25 },
    },
    toan_nang: {
      name: 'Toàn Năng', weapon: 'all', color: 0xffc94a, icon: '✴️', special: true,
      desc: 'Class đặc biệt, chỉ thức tỉnh được bằng mật mã. Dùng mọi vũ khí, học mọi kỹ năng của các class, ' +
        'có cả 3 nội tại, thêm 1 ô kỹ năng và tuyệt kỹ riêng. Máu, tấn công, năng lượng, thể lực +200%.',
      // +200% = nhân 3. Muốn nhẹ hơn thì giảm các số này (ví dụ 2 = +100%). sta: thể lực tối đa
      bonus: { hp: 3, atk: 3, mp: 3, sta: 3 },
    },
    sat_thu: {
      name: 'Sát Thủ', weapon: 'kiem', color: 0xe040fb, icon: '🗡️',
      desc: 'Tốc độ cao, chí mạng cực mạnh, máu thấp. Tấn công +20%, chí mạng +10%, tốc chạy +15%, máu -15%.',
      bonus: { atk: 1.20, critAdd: 10, speed: 1.15, hp: 0.85 },
    },
    tanker: {
      name: 'Tanker', weapon: 'kiem', color: 0x90caf9, icon: '🛡️',
      desc: 'Hấp thụ đòn, chịu đựng cực tốt, sát thương ổn định. Máu +40%, phòng thủ +35%, hút máu +3%, tấn công -5%.',
      bonus: { hp: 1.40, def: 1.35, lifestealAdd: 3, atk: 0.95 },
    },
    tri_lieu_su: {
      name: 'Trị Liệu Sư', weapon: 'truong', color: 0x69f0ae, icon: '💚',
      desc: 'Hồi máu, bảo vệ đồng đội, năng lượng dồi dào. Máu +15%, năng lượng +50%, hồi chiêu kỹ năng -10%.',
      bonus: { hp: 1.15, mp: 1.50, cdrAdd: 10 },
    },
  };

  // ---------------------------------------------------------------- Thức tỉnh (biến hình)
  // Sau khi chọn class (cấp 5) người chơi có thể "thức tỉnh" thêm các bậc biến hình.
  // Mỗi bậc nhân chỉ số (mul), đổi màu (tint) và vầng quang (aura) nhân vật.
  // awakenTier: 0 = chưa biến hình, 1 = Ấn 1, 2 = Ấn 2.
  const AWAKENS = [
    // Thức tỉnh = kỹ năng BIẾN HÌNH bật/tắt (phím T / nút ⚡). Chỉ số `mul` chỉ có tác dụng khi đang biến hình.
    // drain: mỗi giây biến hình tốn bấy nhiêu năng lượng (MP) và thể lực; cạn một trong hai thì tự trở lại dạng thường.
    { tier: 1, level: 25, npc: 'lao_su', name: 'Thức tỉnh · Ấn thứ nhất', drain: 1,
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
    { tier: 2, level: 45, npc: 'lu_khach', name: 'Thức tỉnh · Ấn thứ hai', drain: 2,
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
  const WEAPON_TYPES = {
    tay: { name: 'Tay không', range: 46, cooldown: 400, mult: 0.8, style: 'melee' },
    kiem: { name: 'Kiếm', range: 74, cooldown: 360, mult: 1.0, style: 'melee' },
    cung: { name: 'Cung', range: 400, cooldown: 430, mult: 0.9, style: 'projectile' },
    truong: { name: 'Trượng', range: 170, cooldown: 480, mult: 0.85, style: 'wave' },
  };

  // Thể lực: tách riêng với năng lượng (MP). Đánh thường và dùng kỹ năng đều tốn; hết thì kiệt sức,
  // phải chờ hồi tới `unlock` (tỉ lệ so với tối đa) mới đánh tiếp được.
  //   max = base + perLevel × (cấp − 1) + perAgi × điểm Nhanh nhẹn
  //   attack: tốn mỗi đòn thường (nhân theo tốc độ đánh của vũ khí: cooldown / 400ms)
  //   regen: hồi mỗi giây khi đã ngừng đánh `delay` ms; đang đánh thì chỉ hồi `activeMul` phần
  const STAMINA = { base: 100, perLevel: 2, perAgi: 1, attack: 6, skill: 14, ult: 30, regen: 16, delay: 800, activeMul: 0.3, unlock: 0.3 };

  // Nội tại: luôn có tác dụng sau khi thức tỉnh class
  const PASSIVES = {
    kiem_si: { icon: '❤️', name: 'Kiếm Tâm', desc: 'Mỗi lần đánh thường trúng quái hồi 1% máu tối đa.' },
    cung_thu: { icon: '🎯', name: 'Yếu Điểm', desc: 'Đòn chí mạng gây 180% sát thương thay vì 160%.' },
    phap_su: { icon: '💠', name: 'Dòng Chảy', desc: 'Hồi năng lượng nhanh gấp đôi.' },
    sat_thu: { icon: '🌑', name: 'Bóng Tối', desc: 'Chí mạng đầu tiên sau kỹ năng lướt gây 250% sát thương.' },
    tanker: { icon: '⚔️', name: 'Thành Đồng', desc: 'Giảm thêm 10% sát thương nhận vào khi máu dưới 50%.' },
    tri_lieu_su: { icon: '🌿', name: 'Sinh Lực', desc: 'Kỹ năng hồi máu hồi thêm 20% theo máu tối đa.' },
  };

  Object.assign(G, { SCHOOLS, AWAKENS, WEAPON_TYPES, PASSIVES, STAMINA });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
