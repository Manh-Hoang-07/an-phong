/*
 * NPC: gộp các phần lại thành một bảng NPCS.
 *
 * Thư mục:
 *   story.js     NPC cốt truyện, người giao / trả nhiệm vụ, nhân vật đi theo
 *   services.js  NPC dịch vụ ở Tân Đô I: bảng nhiệm vụ, thợ rèn, dược sư, chủ tiệm, trạm, kho, NPC ẩn
 *   villages.js  nhân bản NPC dịch vụ ra từng làng (Tân Đô II–VII) + trưởng làng
 *
 * Thêm NPC: thêm vào story.js (cốt truyện) hoặc services.js (dịch vụ). Không phải sửa danh sách nạp.
 *
 * Thứ tự nạp quan trọng: services.js phải chạy trước villages.js vì villages.js nhân bản NPC gốc.
 */
(function (G) {
  'use strict';

  // NPCS đã được ba file trên gắn vào G.NPCS; ở đây không cần làm gì thêm.
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
