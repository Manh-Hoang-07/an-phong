/*
 * Kỳ Nguyên: 5 phúc duyên mở ra ở các mốc cấp 10/30/50/70/90.
 *
 * Thay thế cho 5 món "trang bị đặc biệt" (bua/an/canh/linh_dan/chuong, 5 bậc I→V).
 * Khác với trang bị cũ:
 *   - KHÔNG có ô mặc, KHÔNG thuộc bộ, KHÔNG phẩm chất / dòng phụ / cường hóa / khắc ấn / nhiễm.
 *   - KHÔNG có bậc, KHÔNG nâng cấp, KHÔNG dùng Huyền Tinh Thạch.
 *   - Mua bằng Linh Ngọc tại Lầu Trân Bảo (cần đủ cấp ngay khi mua) → sở hữu + tự bật.
 *   - Có bật/tắt: player.kyNguyen = { owned: [id], active: [id] }. active ⊆ owned.
 *   - Chỉ số CỐ ĐỊNH, hiệu ứng CỐ ĐỊNH; cộng dồn mọi cái đang active.
 *
 * Để tận dụng lại hệ thống hiển thị (itemIcon / itemInfo / quầy ngọc), mỗi Kỳ Nguyên cũng được
 * đăng ký vào ITEMS với cờ `kyNguyen: true` và KHÔNG có `slot`. Nhờ không có slot mà chúng tự động
 * đứng ngoài SLOTS, setOfItem, Thợ rèn, và mọi vòng lặp trang bị. Catalog đặt hàng là G.KY_NGUYEN.
 */
(function (G) {
  'use strict';

  // stats/fx/fxText chép nguyên từ special.js theo đúng bậc nguồn (xem bảng trong kế hoạch).
  const ROWS = [
    {
      id: 'kn_bat_tu', name: 'Kỳ Nguyên · Bất Tử', level: 10, price: 40,
      stats: { hp: 120, def: 8 },
      fx: { kind: 'undying', dur: 5, cd: 60 },
      fxText: 'Bất Tử: máu tụt xuống 0 thì không chết, giữ nguyên 1 máu trong 5 giây. Hết 5 giây mà vẫn chưa hồi máu thì mới gục. Hồi lại sau 60 giây. Không cần bấm gì.',
    },
    {
      id: 'kn_sat_kiep', name: 'Kỳ Nguyên · Sát Kiếp', level: 30, price: 90,
      stats: { atk: 22, crit: 5 },
      fx: { kind: 'everyNth', n: 5, mult: 1.35 },
      fxText: 'Sát Kiếp: cứ 5 đòn đánh trúng thì đòn thứ 5 gây thêm 35% sát thương. Đếm riêng theo từng mục tiêu, đổi mục tiêu thì đếm lại từ đầu.',
    },
    {
      id: 'kn_phiu_dieu', name: 'Kỳ Nguyên · Phiêu Diêu', level: 50, price: 180,
      stats: { speed: 20, def: 12, sta: 120, staRegen: 35 },
      fx: { kind: 'dodge', chance: 0.10 },
      fxText: 'Phiêu Diêu: 10% cơ hội né hoàn toàn một đòn đánh. Né được thì không mất máu, không mất khiên, hiện chữ "Né".',
    },
    {
      id: 'kn_tu_linh', name: 'Kỳ Nguyên · Tụ Linh', level: 70, price: 320,
      stats: { mp: 270, cdr: 4, skill: 14 },
      fx: { kind: 'skillPower', mul: 0.14 },
      fxText: 'Tụ Linh: kỹ năng gây thêm 14% sát thương. Cộng thẳng vào sát thương kỹ năng, ngoài điểm Tinh thần.',
    },
    {
      id: 'kn_tran_hon', name: 'Kỳ Nguyên · Trấn Hồn', level: 90, price: 500,
      stats: { goldfind: 22, expfind: 12, lifesteal: 3 },
      fx: { kind: 'onKill', hp: 0.04, mp: 0.04 },
      fxText: 'Trấn Hồn: mỗi khi hạ quái, hồi 4% máu tối đa và 4% năng lượng tối đa.',
    },
  ];

  const PART = {};
  for (const r of ROWS) {
    PART[r.id] = {
      name: r.name,
      kind: 'ky_nguyen', kyNguyen: true,
      // Không có `slot` → đứng ngoài hệ thống trang bị.
      level: r.level,
      priceNgoc: r.price, price: 0, ngocGroup: 'ky_nguyen',
      stats: r.stats, fx: r.fx, fxText: r.fxText,
      desc: `Kỳ Nguyên — mở khóa ở cấp ${r.level}. Mua bằng Linh Ngọc tại Lầu Trân Bảo, sau đó bật/tắt trong bảng Nhân vật. `
        + `Không chiếm ô trang bị, không cường hóa được. ${r.fxText}`,
    };
  }

  (G.ITEM_PARTS = G.ITEM_PARTS || {})['ky_nguyen'] = PART;
  // Catalog đặt hàng (theo cấp tăng dần). Dùng cho quầy, UI và game logic.
  G.KY_NGUYEN = ROWS.map(r => r.id);
  // Map ô trang bị đặc biệt CŨ → id Kỳ Nguyên mới (dùng cho migrate save cũ).
  G.OLD_SPECIAL_SLOT_TO_KY_NGUYEN = { bua: 'kn_bat_tu', an: 'kn_sat_kiep', canh: 'kn_phiu_dieu', linh_dan: 'kn_tu_linh', chuong: 'kn_tran_hon' };
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
