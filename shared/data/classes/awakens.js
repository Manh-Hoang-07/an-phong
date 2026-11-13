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

  Object.assign(G, { AWAKENS });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
