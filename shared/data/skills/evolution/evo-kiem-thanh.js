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
    ks27: { school: 'kiem_si', evolutionKey: 'kiem_thanh', icon: '🌬️', name: 'Nhất Kiếm Thiên Phong', level: 27, mp: 66, cd: 9,
      type: 'dash', power: 2, distance: 300, after: 0.6, desc: 'Lướt xa chém một nhát cực mạnh.',
      m5: { distance: 360 }, t5: 'Xa hơn (360).',
      m10: { after: 1.2 }, t10: 'Vệt chém 120%.' },
    ks32: { school: 'kiem_si', evolutionKey: 'kiem_thanh', icon: '🧘', name: 'Kiếm Ý Hộ Thân', level: 32, mp: 72, cd: 22,
      type: 'buff', buff: 'swordheart', duration: 10, atkBuff: 0.15, speedBuff: 0.25, desc: 'Kiếm ý bao quanh thân, tăng tấn công và tốc đánh.',
      m5: { duration: 12 }, t5: 'Kéo dài 12 giây.',
      m10: { atkBuff: 0.25 }, t10: 'Tấn công +25%.' },
    ks37: { school: 'kiem_si', evolutionKey: 'kiem_thanh', icon: '🗡️', name: 'Tam Kiếm Hợp Nhất', level: 37, mp: 88, cd: 11,
      type: 'melee', power: 0.75, hits: 3, range: 220, finisher: 1.6, desc: 'Ba nhát liên hoàn, nhát cuối nổ kiếm khí.',
      m5: { hits: 4 }, t5: 'Chém 4 nhát.',
      m10: { finisher: 2.1 }, t10: 'Đòn cuối 210%.' },
    ks38: { school: 'kiem_si', evolutionKey: 'kiem_thanh', icon: '🌊', name: 'Kiếm Khí Trường Hà', level: 38, mp: 92, cd: 10,
      type: 'projectile', power: 2.8, pierce: true, range: 640, count: 1, desc: 'Luồng kiếm khí dài xuyên mọi quái.',
      m5: { range: 820 }, t5: 'Tầm xa hơn (820).',
      m10: { count: 2, power: 2 }, t10: 'Số lượng tăng lên 2. Sức mạnh 200%.' },
    ks42: { school: 'kiem_si', evolutionKey: 'kiem_thanh', icon: '🌪️', name: 'Phong Vân Kiếm Vũ', level: 42, mp: 112, cd: 14,
      type: 'aoe', power: 2.9, radius: 260, desc: 'Xoay chém diện rộng, đẩy lùi quái.',
      m5: { radius: 320 }, t5: 'Vùng rộng hơn (320).',
      m10: { power: 3.5 }, t10: 'Sức mạnh 350%.' },
    ks45: { school: 'kiem_si', evolutionKey: 'kiem_thanh', icon: '✨', name: 'Chân Kiếm Thức Tỉnh', level: 45, mp: 140, cd: 30,
      type: 'buff', buff: 'truesword', duration: 10, atkBuff: 0.3, critBuff: 15, speedBuff: 0.2, desc: 'Thức tỉnh chân kiếm: tăng mạnh tấn công, chí mạng và tốc đánh.',
      m5: { duration: 12 }, t5: 'Kéo dài 12 giây.',
      m10: { atkBuff: 0.42, critBuff: 22 }, t10: 'Tấn công +42%. Chí mạng +22%.' },
  };

  (G.SKILL_PARTS = G.SKILL_PARTS || []).push(PART);
})(typeof module === 'object' && module.exports ? require('../../../core') : self.GameData);
