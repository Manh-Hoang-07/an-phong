/*
 * Ẩn Phong - dữ liệu game dùng chung cho server (Node) và client (trình duyệt).
 * Lõi dữ liệu: tạo đối tượng GameData và các hằng số / công thức chung.
 * Mỗi file trong shared/ tự gắn phần của mình vào GameData; thứ tự nạp: shared/index.js
 * (server) và public/index.html (trình duyệt). Thêm file mới thì nhớ thêm vào cả 2 chỗ.
 */
(function (root) {
  'use strict';
  const G = {};

  const MAX_LEVEL = 50;
  const BAG_SIZE = 40;
  const STORAGE_SIZE = 60;
  const STAT_POINTS_PER_LEVEL = 3;

  // Hạng thợ săn theo cấp
  const RANKS = [[40, 'SS'], [30, 'S'], [20, 'A'], [15, 'B'], [10, 'C'], [5, 'D'], [1, 'E']];
  function rankOf(level) { return RANKS.find(([lv]) => level >= lv)[1]; }

  const START_MAP = 'lang';
  const TILE = 32;

  // ---------------------------------------------------------------- Công thức
  function expToNext(level) {
    return Math.floor(40 * Math.pow(level, 1.7));
  }

  const r1 = (v) => Math.round(v * 10) / 10;

  Object.assign(G, { MAX_LEVEL, BAG_SIZE, STORAGE_SIZE, STAT_POINTS_PER_LEVEL, RANKS, rankOf, START_MAP, TILE, expToNext, r1 });
  if (typeof module === 'object' && module.exports) module.exports = G;
  else root.GameData = G;
})(typeof self !== 'undefined' ? self : this);
