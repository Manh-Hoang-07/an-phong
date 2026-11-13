/*
 * Bản đồ: gộp từng chương lại thành một bảng MAPS.
 *
 * Thêm bản đồ: thêm vào file chương tương ứng. Thêm chương mới: tạo file mới trong maps/
 * và thêm require vào shared/index.js + public/index.html.
 *
 * Thứ tự nạp KHÔNG quan trọng với MAPS (tra theo id), nhưng giữ theo chương cho dễ đọc.
 */
(function (G) {
  'use strict';

  const MAPS = {};
  for (const part of G.MAP_PARTS || []) Object.assign(MAPS, part);
  delete G.MAP_PARTS;

  const NEW_PLAYER_MAP = 'cong_do';
  // Danh sách làng theo thứ tự: [{ id, n, cap }]
  const VILLAGES = Object.keys(MAPS).filter(id => MAPS[id].village).map(id => ({ id, ...MAPS[id].village })).sort((a, b) => a.n - b.n);
  const TELEPORT_FEE = 300;   // phí Trạm dịch chuyển giữa các làng (cố định, không theo cấp)

  // Phí tới làng `to`: về Hiệp Hội (làng khởi đầu) miễn phí vì nhiệm vụ Hội trưởng Khải và phụ tuyến chỉ nhận / trả ở đó
  const teleportFee = (to) => (to === G.START_MAP ? 0 : TELEPORT_FEE);


  Object.assign(G, { MAPS, NEW_PLAYER_MAP, VILLAGES, TELEPORT_FEE, teleportFee });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
