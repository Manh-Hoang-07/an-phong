/*
 * Kỹ năng · Kiếm Thánh: chém liên hoàn, phản kích, lướt chém, kiếm khí diện rộng.
 *
 * Mỗi kỹ năng có cấp 1–10, nâng bằng điểm kỹ năng:
 *   m5 / m10: chỉ số đổi ở cấp 5 / 10; t5 / t10: mô tả hiện trong bảng kỹ năng.
 *   type: dash | melee | projectile | spread | aoe | heal | buff | guard | backstep | manashield | shadow_toggle | shadow_command
 *   ultSchools: các class học được; ultAny: mọi class đều học được.
 *
 * Chức nghiệp 2 (nhánh tiến hóa). KHÔNG nhân chỉ số: sức mạnh nằm ở bộ 4 kỹ năng riêng,
 * khóa bộ chức nghiệp 1 khi bật nhánh. Khung mỗi nhánh: [đòn liên tục] [bản sắc] [cơ động / buff]
 * [đòn tuyệt đỉnh], mở ở cấp 25 / 25 / 30 / 35. */
(function (G) {
  'use strict';

  const PART = {
    ks25: { school: 'kiem_si', evolutionKey: 'kiem_thanh', icon: '⚔️', name: 'Kiếm Khí Hoành Tảo', level: 25, mp: 44, cd: 5,
      type: 'melee', power: 0.33, hits: 4, range: 200, finisher: 0.67, desc: 'Chém liên tiếp một đường kiếm rộng phía trước, nhát cuối mạnh hơn.',
      m5: { hits: 5 }, t5: 'Chém 5 nhát.', m10: { finisher: 0.86, range: 240 }, t10: 'Nhát cuối 86%, tầm chém rộng hơn (240).' },
    ks30: { school: 'kiem_si', evolutionKey: 'kiem_thanh', icon: '🛡️', name: 'Kiếm Tâm Phản Kích', level: 25, mp: 60, cd: 18,
      type: 'guard', duration: 5, reduce: 0.5, reflect: 0.6, atkBuff: 0.26, speedBuff: 0.23, desc: 'Thủ thế bằng kiếm tâm: giảm sát thương, phản lại kẻ đánh, tăng tấn công và tốc đánh.',
      m5: { duration: 7 }, t5: 'Kéo dài 7 giây.', m10: { reduce: 0.6, atkBuff: 0.38 }, t10: 'Giảm 60% sát thương, tấn công +38%.' },
    ks35: { school: 'kiem_si', evolutionKey: 'kiem_thanh', icon: '🐉', name: 'Long Ảnh Liên Trảm', level: 30, mp: 64, cd: 8,
      type: 'dash', power: 1.32, after: 0.99, distance: 220, desc: 'Lướt xuyên mục tiêu rồi để lại vệt chém dồn sát thương.',
      m5: { distance: 280 }, t5: 'Lướt xa hơn (280).', m10: { after: 1.32 }, t10: 'Vệt chém mạnh lên 132%.' },
    ks40: { school: 'kiem_si', evolutionKey: 'kiem_thanh', icon: '🌠', name: 'Vạn Kiếm Quy Tông', level: 35, mp: 88, cd: 16,
      type: 'aoe', power: 2.38, radius: 240, desc: 'Gọi kiếm khí chém nhiều hướng trong vùng rộng quanh người.',
      m5: { radius: 300 }, t5: 'Vùng rộng hơn (300).', m10: { power: 2.76 }, t10: 'Sát thương tăng lên 276%.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
