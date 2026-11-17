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
 * Thư mục (mỗi Kỳ Nguyên một file, chỉ chứa dữ liệu):
 *   bat-tu.js      cấp 10 — Bất Tử      (undying)
 *   sat-kiep.js    cấp 30 — Sát Kiếp    (everyNth)
 *   phieu-dieu.js  cấp 50 — Phiêu Diêu  (dodge)
 *   tu-linh.js     cấp 70 — Tụ Linh     (skillPower)
 *   tran-hon.js    cấp 90 — Trấn Hồn    (onKill)
 *
 * File này gộp chúng, dựng ITEMS, đặt catalog và map save cũ. Thêm Kỳ Nguyên mới thì tạo file
 * cùng thư mục rồi require ở đây — nhớ thêm cả public/index.html (check-shared-order sẽ bắt).
 *
 * Để tận dụng lại hệ thống hiển thị (itemIcon / itemInfo / quầy ngọc), mỗi Kỳ Nguyên cũng được
 * đăng ký vào ITEMS với cờ `kyNguyen: true` và KHÔNG có `slot`. Nhờ không có slot mà chúng tự động
 * đứng ngoài SLOTS, setOfItem, Thợ rèn, và mọi vòng lặp trang bị. Catalog đặt hàng là G.KY_NGUYEN.
 */
(function (G) {
  'use strict';

  const ROWS = G.KY_NGUYEN_PARTS || [];
  delete G.KY_NGUYEN_PARTS;

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
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
