/*
 * Ô trang bị và 10 bộ trang bị theo cấp.
 *
 * Cứ 10 cấp là một bộ. Mỗi ô trang bị đúng một món; cấp sử dụng của từng món trải đều trong 10 cấp
 * (vũ khí ở cấp đầu bộ, ngọc bội ở cấp cuối), nên một bộ dùng được suốt 10 cấp, không phải thay đồ liên tục.
 */
(function (G) {
  'use strict';

  // 10 ô trang bị thường + 5 ô trang bị đặc biệt (chỉ mua bằng Linh Ngọc, xem items/special.js).
  // Trang bị đặc biệt KHÔNG thuộc bộ theo cấp nào (setOfItem trả về null cho món có special: true).
  const SLOTS = ['weapon', 'mu', 'ao', 'gang_tay', 'dai_lung', 'quan', 'giay', 'nhan', 'day_chuyen', 'ngoc_boi',
    'bua', 'an', 'canh', 'linh_dan', 'chuong'];
  const SLOT_NAMES = {
    weapon: 'Vũ khí', mu: 'Mũ', ao: 'Áo', gang_tay: 'Găng tay', dai_lung: 'Đai lưng',
    quan: 'Quần', giay: 'Giày', nhan: 'Nhẫn', day_chuyen: 'Dây chuyền', ngoc_boi: 'Ngọc bội',
    bua: 'Bùa Hộ Mệnh', an: 'Ấn', canh: 'Cánh', linh_dan: 'Linh Đan', chuong: 'Chuông Trấn Hồn',
  };
  // Ô trang bị đặc biệt: hiện ở hàng dưới bảng trang bị, không lẫn với 10 ô thường
  const SPECIAL_SLOTS = ['bua', 'an', 'canh', 'linh_dan', 'chuong'];

  // ---------------------------------------------------------------- Bộ trang bị theo cấp
  // Cứ 10 cấp là một bộ. Mỗi ô trang bị đúng một món; cấp sử dụng của từng món trải đều trong 10 cấp
  // (vũ khí ở cấp đầu bộ, ngọc bội ở cấp cuối), nên một bộ dùng được suốt 10 cấp, không phải thay đồ liên tục.
  const SET_LEVELS = 10;
  const SETS = [
    { id: 1, name: 'Tân Binh', min: 1, max: 10,
      desc: 'Đồ da sói của thợ săn mới vào nghề, dùng suốt cấp 1–10.' },
    { id: 2, name: 'Thạch Vương', min: 11, max: 20,
      desc: 'Trang bị chế từ đá pha lê trong Cổng hạng D, cấp 11–20.' },
    { id: 3, name: 'Băng Long', min: 21, max: 30,
      desc: 'Trang bị rèn từ Lõi Lò Rèn và Trái Tim Băng Long dưới núi tuyết.' },
    { id: 4, name: 'Lưu Trữ', min: 31, max: 40,
      desc: 'Trang bị cổ từ Thư Viện Hệ Thống, mang sức mạnh tri thức cổ đại.' },
    { id: 5, name: 'Vĩnh Hằng', min: 41, max: 50,
      desc: 'Trang bị rèn từ Lõi Cổng Vĩnh Hằng, sức mạnh xuyên không gian.' },
    { id: 6, name: 'Thiên Khôi', min: 51, max: 60, desc: 'Trang bị thợ săn cấp 51–60.' },
    { id: 7, name: 'Long Mạch', min: 61, max: 70, desc: 'Trang bị thợ săn cấp 61–70.' },
    { id: 8, name: 'Tinh Vân', min: 71, max: 80, desc: 'Trang bị thợ săn cấp 71–80.' },
    { id: 9, name: 'Thần Mộng', min: 81, max: 90, desc: 'Trang bị thợ săn cấp 81–90.' },
    { id: 10, name: 'Sáng Thế', min: 91, max: 100, desc: 'Trang bị thợ săn cấp 91–100.' },
  ];

  // ---------------------------------------------------------------- Thưởng mặc đủ bộ
  // Trước đây SETS chỉ là nhãn gom nhóm trong quầy: mặc đủ 10 món không được gì.
  // Nay mỗi bộ có hai ngưỡng:
  //   at6  — mặc từ 6 món cùng bộ trở lên: cộng chỉ số (mul = hệ số nhân, add = cộng phẳng)
  //   at10 — mặc đủ 10 món: hiệu ứng đổi lối chơi (fx) và/hoặc chỉ số cộng thêm
  //
  // Vì sao ngưỡng 6 chứ không phải 10: có 5 ô đặc biệt (bua/an/canh/linh_dan/chuong) KHÔNG thuộc
  // bộ nào, và đồ độc nhất rơi từ trùm cũng không thuộc bộ. Ngưỡng 6 buộc người chơi chọn giữa
  // "6 món cùng bộ + 4 ô tự do" và "đủ 10 món để lấy hiệu ứng". Đó là quyết định thật mỗi lần đổi đồ.
  //
  // fx dùng chung cơ chế với trang bị đặc biệt (xem specialFx trong shared/logic/player.js):
  //   setStone    { cd }             khiên đá: đỡ trọn 1 đòn mỗi `cd` giây
  //   setFreeze   { chance, dur }    đòn đánh có `chance` cơ hội đóng băng quái `dur` ms
  //   setFreeCast { }                kỹ năng đầu tiên mỗi trận không tốn năng lượng
  //   setPhase    { cd }             lướt qua đòn đánh mỗi `cd` giây, không mất máu
  const SET_BONUS = {
    1: { // Tân Binh — bộ mở đầu, thưởng nhẹ để người chơi mới thấy được tác dụng
      at6: { mul: { hp: 1.10 } },
      at10: { mul: { hp: 1.10, atk: 1.10 } },
    },
    2: { // Thạch Vương
      at6: { mul: { hp: 1.12 } },
      at10: { mul: { hp: 1.12 }, fx: { kind: 'setStone', cd: 12 } },
    },
    3: { // Băng Long
      at6: { mul: { def: 1.10 } },
      at10: { mul: { def: 1.10 }, fx: { kind: 'setFreeze', chance: 0.25, dur: 2 } },
    },
    4: { // Lưu Trữ
      at6: { mul: { mp: 1.08 } },
      at10: { mul: { mp: 1.08 }, fx: { kind: 'setFreeCast' } },
    },
    5: { // Vĩnh Hằng
      at6: { mul: { atk: 1.10 } },
      at10: { mul: { atk: 1.10 }, fx: { kind: 'setPhase', cd: 8 } },
    },
    6: { at6: { mul: { hp: 1.10, def: 1.06 } }, at10: { mul: { hp: 1.10, def: 1.06, atk: 1.08 } } },
    7: { at6: { mul: { atk: 1.08, hp: 1.06 } }, at10: { mul: { atk: 1.08, hp: 1.06 }, add: { crit: 5 } } },
    8: { at6: { mul: { hp: 1.10, mp: 1.06 } }, at10: { mul: { hp: 1.10, mp: 1.06 }, add: { cdr: 5 } } },
    9: { at6: { mul: { atk: 1.08, def: 1.08 } }, at10: { mul: { atk: 1.08, def: 1.08 }, add: { lifesteal: 3 } } },
    10: { at6: { mul: { hp: 1.12, atk: 1.10 } }, at10: { mul: { hp: 1.12, atk: 1.10, def: 1.10 }, add: { boss: 10 } } },
  };
  // Ngưỡng mặc đủ bộ
  const SET_TIER_LOW = 6;
  const SET_TIER_HIGH = 10;

  Object.assign(G, { SLOTS, SLOT_NAMES, SPECIAL_SLOTS, SET_LEVELS, SETS, SET_BONUS, SET_TIER_LOW, SET_TIER_HIGH });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
