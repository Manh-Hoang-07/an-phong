/*
 * Quái: gộp từng chương lại thành một bảng MONSTERS.
 *
 * Thêm quái mới: thêm vào file chương tương ứng (chapter1.js … chapter10.js).
 * Sửa đường cong chỉ số / hệ số hạng: grades.js.
 */
(function (G) {
  'use strict';

  const MONSTERS = {};
  for (const part of Object.values(G.MONSTER_PARTS || {})) Object.assign(MONSTERS, part);
  delete G.MONSTER_PARTS;

  // Huyền Tinh Thạch: đá riêng của trang bị đặc biệt, KHÔNG bán ở đâu, chỉ rơi từ trùm và tinh anh.
  // Gắn ở đây thay vì sửa tay từng file chương: một chỗ duy nhất để chỉnh tỉ lệ cho toàn bộ 13 trùm + 16 tinh anh,
  // và không thể sót con nào. Trùm rơi trung bình 1,2 viên/lần hạ, tinh anh 0,5 viên.
  const STONE = 'huyen_tinh_thach';
  const STONE_DROPS = {
    boss: [[STONE, 0.6], [STONE, 0.4], [STONE, 0.2]],
    elite: [[STONE, 0.35], [STONE, 0.15]],
  };
  for (const mon of Object.values(MONSTERS)) {
    const kind = mon.boss ? 'boss' : mon.elite ? 'elite' : null;
    if (!kind) continue;
    mon.drops = (mon.drops || []).concat(STONE_DROPS[kind]);
  }

  Object.assign(G, { MONSTERS });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
