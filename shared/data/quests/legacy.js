/*
 * Thông tin chuyển đổi tiến độ nhiệm vụ của phiên bản cũ.
 */
(function (G) {
  'use strict';

  // Thứ tự nhiệm vụ của phiên bản trước (để chuyển tiến độ cũ sang)
  const OLD_QUEST_ORDER = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'];
  const OLD_QUEST_MAP = { q8: 'q9' };
  const QUEST_VERSION = 2;

  Object.assign(G, { OLD_QUEST_ORDER, OLD_QUEST_MAP, QUEST_VERSION });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
