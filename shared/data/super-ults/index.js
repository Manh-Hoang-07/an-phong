/*
 * TUYỆT PHẨM — trụ riêng, bậc trên tuyệt kỹ.
 *
 * Tên gọi: TUYỆT PHẨM (siêu tuyệt kỹ là tên cũ). Mỗi Tuyệt Phẩm là một đòn CỐ ĐỊNH:
 *   - không cấp, không điểm kỹ năng, không ô học, không pips;
 *   - sở hữu ở p.superUlts (giữ tên field cũ để save cũ không vỡ);
 *   - đọc sách riêng sach_tk_<id> là sở hữu, rồi gắn vào ô R/X/Z như tuyệt kỹ;
 *   - chỉ số gộp sẵn ở mốc cấp 10 cũ, skillAt() trả nguyên bản (xem logic/super-ults/).
 *
 * Vì sao có thư mục riêng: Tuyệt Phẩm là một TRỤ ngang hàng Kỳ Nguyên / bóng ma / thú cưỡi,
 * không phải một nhánh của tuyệt kỹ. Để chung trong ult-*.js là bắt người đọc phải đoán
 * dựa vào cờ `superUlt`. Ở đây mọi thứ của trụ nằm một chỗ: dữ liệu, catalog, sách.
 *
 * Thư mục (mỗi Tuyệt Phẩm một file, chỉ chứa dữ liệu):
 *   sinh-tu.js           Sinh Tử Đồng Quy    — mọi class, execute
 *   tu-linh-dung-hop.js  Tử Linh Dung Hợp    — Tử Linh Thuật Sư, fusion
 *   thiet-bich.js        Thiết Bích Vĩnh Cửu — Tanker/Hộ Vệ, guard
 *   cam-chu.js           Cấm Chú Giải Phóng  — Pháp Sư/Đại Pháp Sư, manaburst
 *   van-phap.js          Vạn Pháp Quy Nhất   — Toàn Năng, allin
 *
 * File này gộp chúng rồi đẩy vào G.SKILL_PARTS để bảng SKILLS gộp chung. Thêm Tuyệt Phẩm mới
 * thì tạo file cùng thư mục rồi require ở đây — nhớ thêm cả public/index.html (check-shared-order bắt).
 *
 * Cờ tương thích (KHÔNG đổi, vì save / engine / shop đang đọc):
 *   ult: true       → dùng chung ô R/X/Z, đi qua engine cast + trần sát thương superUlt
 *   superUlt: true  → nhận diện trụ; skillAt bỏ qua nâng cấp; shop gom nhóm 'superult'
 */
(function (G) {
  'use strict';

  // `cost` là nơi KHAI BÁO DUY NHẤT cái giá của mỗi Tuyệt Phẩm. Engine (client + server) vẫn đọc
  // các field rời selfZero / lockSec / atkBuff / fusionCost, nên ở đây suy ra chúng từ cost một lần
  // lúc nạp. Sửa giá ở `cost` là đủ, không phải sửa engine, và không có hai nguồn lệch nhau.
  //   hp       → selfZero (+ buaSaves)
  //   mp_burn  → lockSec
  //   skill_lock → lockSec
  //   roster   → fusionCost
  //   atk_zero → atkBuff
  const COST_FIELDS = {
    hp: (c) => ({ selfZero: !!c.selfZero, buaSaves: !!c.buaSaves }),
    mp_burn: (c) => ({ lockSec: c.lockSec }),
    skill_lock: (c) => ({ lockSec: c.lockSec }),
    roster: (c) => ({ fusionCost: c.fusionCost }),
    atk_zero: (c) => ({ atkBuff: c.atkBuff, duration: c.duration }),
  };

  const PART = {};
  for (const p of (G.TUYET_PHAM_PARTS || [])) {
    for (const [id, def] of Object.entries(p)) {
      const c = def.cost;
      if (c && COST_FIELDS[c.type]) Object.assign(def, COST_FIELDS[c.type](c));
      PART[id] = def;
    }
  }
  delete G.TUYET_PHAM_PARTS;

  // Đăng ký vào SKILLS để engine cast / trần sát thương / sinh sách dùng chung một bảng.
  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
  // Catalog riêng của trụ: G.TUYET_PHAM (không phải G.SKILLS lọc theo cờ).
  G.TUYET_PHAM = Object.keys(PART);
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
