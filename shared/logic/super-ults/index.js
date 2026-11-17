/*
 * TUYỆT PHẨM — logic của trụ riêng (trước đây gọi là "siêu tuyệt kỹ").
 *
 * Tách khỏi logic/skills.js vì đây KHÔNG phải kỹ năng: không cấp, không điểm, không ô học.
 *
 * Thư mục (mỗi phần một file):
 *   identity.js   hằng TUYET_PHAM_LEVEL + isTuyetPham
 *   ownership.js  ownsTuyetPham / tuyetPhamOf / learnTuyetPham
 *   costs.js      tuyetPhamCosts — đọc cái giá từ đối tượng `cost` trong data
 *
 * Tên trụ: TUYỆT PHẨM. Tên cũ vẫn còn trong cờ dữ liệu (superUlt) và field save (p.superUlts)
 * — đổi hai thứ đó sẽ vỡ save cũ. Vì vậy file này gắn bí danh tên cũ trỏ về hàm mới: engine,
 * UI và server đang gọi chúng, giữ bí danh để không phải sửa hàng chục chỗ cùng lúc.
 *
 * Nạp SAU data/skills/index.js (cần G.SKILLS) và TRƯỚC logic/skills.js.
 */
(function (G) {
  'use strict';

  Object.assign(G, {
    SUPER_ULT_LEVEL: G.TUYET_PHAM_LEVEL,
    isSuperUlt: G.isTuyetPham, ownsSuperUlt: G.ownsTuyetPham,
    superUltsOf: G.tuyetPhamOf, learnSuperUlt: G.learnTuyetPham,
    superUltCosts: G.tuyetPhamCosts,
  });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
