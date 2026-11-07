/*
 * Ẩn Phong - dữ liệu game dùng chung cho server (Node) và client (trình duyệt).
 * Lõi dữ liệu: tạo đối tượng GameData và các hằng số / công thức chung.
 * Mỗi file trong shared/ tự gắn phần của mình vào GameData; thứ tự nạp: shared/index.js
 * (server) và public/index.html (trình duyệt). Thêm file mới thì nhớ thêm vào cả 2 chỗ.
 */
(function (root) {
  'use strict';
  const G = {};

  const MAX_LEVEL = 100;
  const BAG_SIZE = 40;
  const STORAGE_SIZE = 60;
  const STAT_POINTS_PER_LEVEL = 3;

  // Hạng thợ săn: [cấp tối thiểu để được đánh giá, hạng]. Hạng KHÔNG tự lên theo cấp: đủ cấp thì người chơi đến
  // Hội trưởng Khải xin đánh giá (hành động rank_eval); không đánh giá thì hạng giữ nguyên. Hạng hiện tại: player.rank.
  const RANKS = [[100, 'EX'], [80, 'X'], [60, 'SSS'], [40, 'SS'], [30, 'S'], [20, 'A'], [15, 'B'], [10, 'C'], [5, 'D'], [1, 'E']];
  function rankOf(level) { return RANKS.find(([lv]) => level >= lv)[1]; }   // hạng cao nhất mà cấp này ĐỦ ĐIỀU KIỆN
  const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'X', 'EX'];
  function playerRank(player) { return (player && RANK_ORDER.includes(player.rank)) ? player.rank : 'E'; }
  // Hạng kế tiếp và cấp cần để đánh giá: { rank, level } (null khi đã cao nhất)
  function nextRank(player) {
    const next = RANK_ORDER[RANK_ORDER.indexOf(playerRank(player)) + 1];
    if (!next) return null;
    return { rank: next, level: RANKS.find(([, r]) => r === next)[0] };
  }

  const START_MAP = 'lang';
  const TILE = 32;

  // ---------------------------------------------------------------- Công thức
  function expToNext(level) {
    return Math.floor(40 * Math.pow(level, 1.7));
  }

  const r1 = (v) => Math.round(v * 10) / 10;

  Object.assign(G, { MAX_LEVEL, BAG_SIZE, STORAGE_SIZE, STAT_POINTS_PER_LEVEL, RANKS, rankOf, RANK_ORDER, playerRank, nextRank, START_MAP, TILE, expToNext, r1 });
  if (typeof module === 'object' && module.exports) module.exports = G;
  else root.GameData = G;
})(typeof self !== 'undefined' ? self : this);
