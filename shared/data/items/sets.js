/*
 * Ô trang bị và 10 bộ trang bị theo cấp.
 *
 * Cứ 10 cấp là một bộ. Mỗi ô trang bị đúng một món; cấp sử dụng của từng món trải đều trong 10 cấp
 * (vũ khí ở cấp đầu bộ, ngọc bội ở cấp cuối), nên một bộ dùng được suốt 10 cấp, không phải thay đồ liên tục.
 */
(function (G) {
  'use strict';

  const SLOTS = ['weapon', 'mu', 'ao', 'gang_tay', 'dai_lung', 'quan', 'giay', 'nhan', 'day_chuyen', 'ngoc_boi'];
  const SLOT_NAMES = {
    weapon: 'Vũ khí', mu: 'Mũ', ao: 'Áo', gang_tay: 'Găng tay', dai_lung: 'Đai lưng',
    quan: 'Quần', giay: 'Giày', nhan: 'Nhẫn', day_chuyen: 'Dây chuyền', ngoc_boi: 'Ngọc bội',
  };

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

  Object.assign(G, { SLOTS, SLOT_NAMES, SET_LEVELS, SETS });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
