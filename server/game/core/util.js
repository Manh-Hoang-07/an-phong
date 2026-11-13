'use strict';
/* Luật chơi phía server · Lỗi luật chơi và tiện ích nhỏ. */

class GameError extends Error {}
const fail = (msg) => { throw new GameError(msg); };

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const fmt = (n) => Number(n).toLocaleString('vi-VN');

module.exports = { GameError, fail, rand, fmt };
