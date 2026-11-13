/*
 * Thể lực và hồi phục.
 *
 * Thể lực tách riêng với năng lượng (MP). Đánh thường và dùng kỹ năng đều tốn; hết thì kiệt sức,
 * phải chờ hồi tới `unlock` (tỉ lệ so với tối đa) mới đánh tiếp được.
 *   max = base + perLevel × (cấp − 1) + perAgi × điểm Nhanh nhẹn
 *   attack: tốn mỗi đòn thường (nhân theo tốc độ đánh của vũ khí: cooldown / 400ms)
 *   regen: hồi mỗi giây khi đã ngừng đánh `delay` ms; đang đánh thì chỉ hồi `activeMul` phần
 *
 * REGEN: máu / năng lượng tự hồi mỗi giây khi không giao chiến. Đang biến hình thì không hồi.
 */
(function (G) {
  'use strict';

  const STAMINA = { base: 100, perLevel: 2, perAgi: 1, maxMul: 1.3, attack: 4.8, skill: 14, ult: 50, regen: 12, delay: 800, activeMul: 0.3, unlock: 0.3 };
  const REGEN = { hp: 1, mp: 1, calmMs: 2000 };

  Object.assign(G, { STAMINA, REGEN });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
