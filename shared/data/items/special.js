/*
 * Trang bị đặc biệt: 5 ô × 5 bậc, CHỈ mua bằng Linh Ngọc ở Lầu Trân Bảo.
 *
 * Khác trang bị thường ở năm điểm:
 *   - CÓ cấp sử dụng, và cấp gắn với BẬC: I=10, II=30, III=50, IV=70, V=90.
 *     Mua thì không cần cấp (mua trước cất túi được), nhưng MẶC và NÂNG BẬC thì phải đủ cấp.
 *     Đây là món đầu tư dài hạn: bậc V mở ở cấp 90, gần trần game 100.
 *   - Không bán bằng xu, không bán lại được (price = 0) → không có lỗ hổng đổi ngọc ra xu.
 *   - Chỉ số CỐ ĐỊNH: mua ra là đúng chỉ số, không ngẫu nhiên, không dòng phụ, không cường hóa ở Thợ rèn.
 *   - Mỗi món mang một trường `fx` (hiệu ứng riêng) mà KHÔNG bộ trang bị thường nào có.
 *   - Không thuộc bộ theo cấp nào (setOfItem trả về null) → không hiện "Bộ ..." trong bảng chi tiết.
 *
 * 5 ô:
 *   bua       Bùa Hộ Mệnh   sống sót   — máu + phòng thủ, cưỡng chế sống sót khi máu cạn
 *   an        Ấn            sát thương — tấn công + chí mạng, đòn thứ 5 nặng hơn
 *   canh      Cánh          cơ động    — tốc chạy + phòng thủ + thể lực + hồi thể lực, né đòn
 *   linh_dan  Linh Đan      kỹ năng    — năng lượng + giảm hồi chiêu, kỹ năng mạnh hơn
 *   chuong    Chuông Trấn Hồn cày cuốc  — xu + kinh nghiệm + hút máu, hồi máu/năng lượng khi hạ quái
 *
 * Thể lực: trước file này, KHÔNG có món nào trong game cộng thể lực (chỉ cấp và Nhanh nhẹn quyết định).
 * Cánh là nơi duy nhất đầu tư được vào thể lực, nên nó là món "phải có" cho lối chơi đánh liên tục.
 */
(function (G) {
  'use strict';

  // Bậc: cấp sử dụng và giá Linh Ngọc. Cấp là điều kiện MẶC, không phải điều kiện mua.
  const TIERS = [
    { n: 1, level: 10, price: 40 },
    { n: 2, level: 30, price: 90 },
    { n: 3, level: 50, price: 180 },
    { n: 4, level: 70, price: 320 },
    { n: 5, level: 90, price: 500 },
  ];
  const TIER_NAMES = ['I', 'II', 'III', 'IV', 'V'];

  // Mỗi dòng: ô, tên, chỉ số từng bậc (theo thứ tự khoá), hiệu ứng từng bậc, câu mô tả hiệu ứng
  const ROWS = [
    {
      slot: 'bua', name: 'Bùa Hộ Mệnh',
      stats: [
        { hp: 120, def: 8 }, { hp: 320, def: 20 }, { hp: 620, def: 36 }, { hp: 1050, def: 58 }, { hp: 1650, def: 88 },
      ],
      // Hộ Mệnh: máu tụt xuống 0 thì không chết, giữ đúng 1 máu trong `dur` giây. Hồi lại sau `cd` giây.
      // Bậc thang đều +1 giây mỗi bậc: 5/6/7/8/9. Hồi chiêu GHIM 60 giây cho mọi bậc.
      fx: [
        { kind: 'undying', dur: 5, cd: 60 },
        { kind: 'undying', dur: 6, cd: 60 },
        { kind: 'undying', dur: 7, cd: 60 },
        { kind: 'undying', dur: 8, cd: 60 },
        { kind: 'undying', dur: 9, cd: 60 },
      ],
      fxText: (i) => `Hộ Mệnh: máu tụt xuống 0 thì không chết, giữ nguyên 1 máu trong ${[5, 6, 7, 8, 9][i]} giây. Hết ${[5, 6, 7, 8, 9][i]} giây mà vẫn chưa hồi máu thì mới gục. Hồi lại sau 60 giây. Không cần bấm gì.`,
    },
    {
      slot: 'an', name: 'Ấn',
      stats: [
        { atk: 10, crit: 3 }, { atk: 22, crit: 5 }, { atk: 38, crit: 7 }, { atk: 60, crit: 9 }, { atk: 92, crit: 12 },
      ],
      fx: [
        { kind: 'everyNth', n: 5, mult: 1.25 },
        { kind: 'everyNth', n: 5, mult: 1.35 },
        { kind: 'everyNth', n: 5, mult: 1.45 },
        { kind: 'everyNth', n: 5, mult: 1.55 },
        { kind: 'everyNth', n: 5, mult: 1.70 },
      ],
      fxText: (i) => `Ấn Sát: cứ 5 đòn đánh trúng thì đòn thứ 5 gây thêm ${[25, 35, 45, 55, 70][i]}% sát thương. Đếm riêng theo từng mục tiêu, đổi mục tiêu thì đếm lại từ đầu.`,
    },
    {
      slot: 'canh', name: 'Cánh',
      stats: [
        { speed: 6, def: 3, sta: 30, staRegen: 15 },
        { speed: 12, def: 7, sta: 70, staRegen: 25 },
        { speed: 20, def: 12, sta: 120, staRegen: 35 },
        { speed: 30, def: 18, sta: 180, staRegen: 50 },
        { speed: 44, def: 26, sta: 260, staRegen: 70 },
      ],
      fx: [
        { kind: 'dodge', chance: 0.06 },
        { kind: 'dodge', chance: 0.08 },
        { kind: 'dodge', chance: 0.10 },
        { kind: 'dodge', chance: 0.12 },
        { kind: 'dodge', chance: 0.15 },
      ],
      fxText: (i) => `Phiêu Diêu: ${[6, 8, 10, 12, 15][i]}% cơ hội né hoàn toàn một đòn đánh. Né được thì không mất máu, không mất khiên, hiện chữ "Né".`,
    },
    {
      slot: 'linh_dan', name: 'Linh Đan',
      stats: [
        { mp: 40, cdr: 1, skill: 5 }, { mp: 95, cdr: 2, skill: 8 }, { mp: 170, cdr: 3, skill: 11 },
        { mp: 270, cdr: 4, skill: 14 }, { mp: 400, cdr: 6, skill: 18 },
      ],
      fx: [
        { kind: 'skillPower', mul: 0.05 },
        { kind: 'skillPower', mul: 0.08 },
        { kind: 'skillPower', mul: 0.11 },
        { kind: 'skillPower', mul: 0.14 },
        { kind: 'skillPower', mul: 0.18 },
      ],
      fxText: (i) => `Tụ Linh: kỹ năng gây thêm ${[5, 8, 11, 14, 18][i]}% sát thương. Đây là món duy nhất ngoài điểm Tinh thần cộng thẳng vào sát thương kỹ năng.`,
    },
    {
      slot: 'chuong', name: 'Chuông Trấn Hồn',
      stats: [
        { goldfind: 4, expfind: 2, lifesteal: 1 }, { goldfind: 7, expfind: 4, lifesteal: 1 },
        { goldfind: 11, expfind: 6, lifesteal: 2 }, { goldfind: 16, expfind: 9, lifesteal: 2 },
        { goldfind: 22, expfind: 12, lifesteal: 3 },
      ],
      fx: [
        { kind: 'onKill', hp: 0.015, mp: 0.015 },
        { kind: 'onKill', hp: 0.02, mp: 0.02 },
        { kind: 'onKill', hp: 0.025, mp: 0.025 },
        { kind: 'onKill', hp: 0.03, mp: 0.03 },
        { kind: 'onKill', hp: 0.04, mp: 0.04 },
      ],
      fxText: (i) => `Trấn Hồn: mỗi khi hạ quái, hồi ${[1.5, 2, 2.5, 3, 4][i]}% máu tối đa và ${[1.5, 2, 2.5, 3, 4][i]}% năng lượng tối đa.`,
    },
  ];

  const PART = {};
  for (const row of ROWS) {
    TIERS.forEach((t, i) => {
      const id = `${row.slot}_db_${t.n}`;
      PART[id] = {
        // Tên CỐ ĐỊNH, không kèm số La Mã: bậc là thuộc tính của món, không phải một món khác.
        name: row.name,
        kind: 'armor', slot: row.slot,
        // tier: bậc I→V, dùng để sắp xếp trong quầy và chọn dáng icon.
        tier: t.n,
        // level: cấp tối thiểu để MẶC món ở bậc này (10/30/50/70/90). Mua thì không cần cấp.
        level: t.level,
        special: true, ngocGroup: 'gear', priceNgoc: t.price, price: 0,
        // Huyền Tinh Thạch để nâng lên đúng bậc này: 1 / 2 / 4 / 8 / 16
        stoneCost: Math.pow(2, t.n - 1),
        stats: row.stats[i], fx: row.fx[i],
        desc: `Trang bị đặc biệt, chỉ mua bằng Linh Ngọc ở Lầu Trân Bảo. Mặc được từ cấp ${t.level}. `
          + `Nâng bậc bằng Huyền Tinh Thạch + Linh Ngọc (bậc ${TIER_NAMES[i]}: ${Math.pow(2, t.n - 1)} đá · ${t.price} Linh Ngọc, cần cấp ${t.level}). `
          + `Không cường hóa ở Thợ rèn được. ${row.fxText(i)}`,
      };
    });
  }

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['special'] = PART;
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
