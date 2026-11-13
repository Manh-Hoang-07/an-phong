/*
 * Kỹ năng: gộp từng class lại thành một bảng SKILLS.
 *
 * Thư mục:
 *   classes/<class>.js     kỹ năng chức nghiệp 1 (mở ở cấp 5–40)
 *   evolution/evo-*.js     kỹ năng chức nghiệp 2 (nhánh tiến hóa, cấp 25–35)
 *   ult/ult-*.js           tuyệt kỹ học bằng sách (mỗi tuyệt kỹ một cuốn sach_tk_<id>)
 *   perks.js               nội tại cốt truyện
 *
 * Thêm kỹ năng: thêm vào file class tương ứng. Thêm class mới: tạo file mới trong classes/
 * và thêm require vào shared/index.js + public/index.html.
 */
(function (G) {
  'use strict';

  const SKILLS = {};
  for (const part of G.SKILL_PARTS || []) Object.assign(SKILLS, part);
  delete G.SKILL_PARTS;

  const SKILL_MAX = 10;

  const SKILL_SLOTS = 8;
  const ULT_SLOT = 5;
  const EXTRA_SLOT = 4;
  const ULT_SLOTS = [5, 6, 7];
  const ULT_EXTRA_SLOT = 7;

  // Id vật phẩm sách của một tuyệt kỹ
  const ultBookId = (id) => 'sach_tk_' + id;


  Object.assign(G, { SKILL_MAX, SKILLS, SKILL_SLOTS, ULT_SLOT, EXTRA_SLOT, ULT_SLOTS, ULT_EXTRA_SLOT, ultBookId });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
