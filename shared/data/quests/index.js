/*
 * Nhiệm vụ chính tuyến: gộp từng chương lại thành một mảng QUESTS, đúng thứ tự cốt truyện.
 *
 * Thứ tự nạp = thứ tự trong mảng QUESTS. Tiến độ người chơi lưu bằng chỉ số bước (p.quest.step),
 * nên ĐỔI THỨ TỰ hoặc CHÈN VÀO GIỮA sẽ làm lệch tiến độ của người chơi đang chơi.
 * Thêm chương mới: thêm file + thêm require ở CUỐI danh sách.
 */
(function (G) {
  'use strict';

  const QUESTS = [];
  for (const part of G.QUEST_PARTS || []) QUESTS.push(...part);
  delete G.QUEST_PARTS;

  Object.assign(G, { QUESTS });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
