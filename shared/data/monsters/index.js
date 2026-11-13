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

  Object.assign(G, { MONSTERS });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
