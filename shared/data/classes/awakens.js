/*
 * Thức tỉnh (biến hình): bật/tắt bằng phím T, tốn năng lượng và thể lực mỗi giây.
 *
 * Đi theo NGƯỜI CHƠI, không theo nghề: chức nghiệp 1 hay chức nghiệp 2 đều dùng chung Ấn I / Ấn II.
 * mul chỉ có tác dụng khi đang biến hình.
 */
(function (G) {
  'use strict';

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
    { tier: 2, level: 40, npc: 'lu_khach', name: 'Biến hình · Ấn thứ hai', drain: 2,
      mul: { hp: 1.6, mp: 1.5, atk: 1.6, def: 1.3 }, tint: 0xff80ab, aura: 0xff6ec7, aura2: 0xffd6f0,
      desc: 'Nâng BIẾN HÌNH lên dạng dị giới: máu +60%, năng lượng +50%, tấn công +60%, phòng thủ +30%, hào quang hồng tím kèm tia điện. Tốn 2 năng lượng và 2 thể lực mỗi giây.',
      start: [
        'Lữ khách: Cậu đã thấy bản chất của Hệ thống rồi. Nó không cho đi sức mạnh — nó mượn.',
        'Lữ khách: Dấu ấn thứ hai không lấy từ Hệ thống, mà từ chính ký ức của những người chơi đã mất tích.',
        'Lữ khách: Đạt cấp 40, ta sẽ chỉ cho cậu. Nhưng sau này, cậu sẽ không còn hoàn toàn là người.',
      ],
      end: [
        '[Hệ thống] Dấu ấn thức tỉnh thứ hai đã kích hoạt. Cậu đã vượt ra ngoài quản lý của Hệ thống.',
        'Lữ khách: Đi đi, người chơi thứ 7. Còn một Cổng cuối cùng đợi cậu.',
      ] },
    // Ấn 3–5: mở ở cấp 60 / 80 / 100. Mỗi ấn mở bằng nhiệm vụ ở NPC ẩn (hạ số quái bằng cấp yêu cầu) rồi đọc Sách Biến Hình tương ứng.
    { tier: 3, level: 60, npc: 'npc_an', name: 'Biến hình · Ấn thứ ba', drain: 3,
      mul: { hp: 1.9, mp: 1.8, atk: 1.9, def: 1.45 }, tint: 0x80d8ff, aura: 0x4fc3f7, aura2: 0xe1f5fe,
      desc: 'Nâng BIẾN HÌNH lên dạng băng lam: máu +90%, năng lượng +80%, tấn công +90%, phòng thủ +45%, hào quang xanh lam. Tốn 3 năng lượng và 3 thể lực mỗi giây.',
      start: ['Người Gác Màn: Cấp 60. Dấu ấn thứ ba không còn là ký ức của kẻ khác, mà là của chính cậu.'],
      end: ['[Hệ thống] Dấu ấn thức tỉnh thứ ba đã kích hoạt.'] },
    { tier: 4, level: 80, npc: 'npc_an', name: 'Biến hình · Ấn thứ tư', drain: 4,
      mul: { hp: 2.2, mp: 2.1, atk: 2.25, def: 1.6 }, tint: 0xff8a80, aura: 0xff5252, aura2: 0xffe0b2,
      desc: 'Nâng BIẾN HÌNH lên dạng huyết hỏa: máu +120%, năng lượng +110%, tấn công +125%, phòng thủ +60%, hào quang đỏ lửa. Tốn 4 năng lượng và 4 thể lực mỗi giây.',
      start: ['Người Gác Màn: Cấp 80. Sức mạnh này đòi một cái giá. Cậu chuẩn bị chưa?'],
      end: ['[Hệ thống] Dấu ấn thức tỉnh thứ tư đã kích hoạt.'] },
    { tier: 5, level: 100, npc: 'npc_an', name: 'Biến hình · Ấn thứ năm', drain: 5,
      mul: { hp: 2.6, mp: 2.5, atk: 2.7, def: 1.8 }, tint: 0xe1bee7, aura: 0xce93d8, aura2: 0xffffff,
      desc: 'Dạng cuối của BIẾN HÌNH: máu +160%, năng lượng +150%, tấn công +170%, phòng thủ +80%, hào quang tím trắng. Tốn 5 năng lượng và 5 thể lực mỗi giây.',
      start: ['Người Gác Màn: Cấp 100. Ấn cuối cùng. Sau nó không còn gì để Hệ thống mượn nữa.'],
      end: ['[Hệ thống] Dấu ấn thức tỉnh thứ năm đã kích hoạt. Giới hạn cuối cùng đã bị phá.'] },
  ];

  // Số ấn của tên hình thái ('awaken3' → 3). Tên không hợp lệ → 0.
  const awakenTierOf = (choice) => { const m = /^awaken(\d)$/.exec(choice || ''); const t = m ? Number(m[1]) : 0; return t >= 1 && t <= AWAKENS.length ? t : 0; };

  Object.assign(G, { AWAKENS, awakenTierOf });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
