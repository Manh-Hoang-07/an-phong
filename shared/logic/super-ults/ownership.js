/*
 * Tuyệt Phẩm — sở hữu và ghi trạng thái.
 *
 * Đọc THẲNG từ p.superUlts — không suy ra từ p.skills. Đây là hàng rào chống sửa save:
 * ghi p.skills.ulPhapSuper = 10 không tạo ra quyền dùng (skillLevel cũng từ chối đường đó).
 *
 * Nạp SAU identity.js (cần isTuyetPham).
 */
(function (G) {
  'use strict';

  // Đã sở hữu chưa.
  function ownsTuyetPham(player, id) {
    if (!player || !id || !G.isTuyetPham(id)) return false;
    return !!(player.superUlts && player.superUlts[id]);
  }

  // Danh sách đã sở hữu, lọc theo catalog dữ liệu (id lạ trong save bị bỏ qua).
  const tuyetPhamOf = (player) => (G.TUYET_PHAM || []).filter(id => ownsTuyetPham(player, id));

  // Mở một Tuyệt Phẩm (điều kiện đã kiểm ở nơi gọi). Trả false nếu đã có sẵn.
  // KHÔNG tự gắn vào thanh: người chơi chọn ô R/X/Z như tuyệt kỹ, qua set_skill.
  function learnTuyetPham(player, id) {
    if (!G.isTuyetPham(id) || ownsTuyetPham(player, id)) return false;
    if (!player.superUlts || typeof player.superUlts !== 'object' || Array.isArray(player.superUlts)) player.superUlts = {};
    player.superUlts[id] = true;
    return true;
  }

  Object.assign(G, { ownsTuyetPham, tuyetPhamOf, learnTuyetPham });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
