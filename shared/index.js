/*
 * Điểm vào dữ liệu game cho server: nạp các file trong shared/ theo đúng thứ tự.
 * Trình duyệt nạp cùng các file này bằng thẻ <script> trong public/index.html (giữ đúng thứ tự).
 */
require('./core');
require('./data/classes');
require('./data/skills');
require('./data/items');
require('./data/equipment');
require('./data/monsters');
require('./data/npcs');
require('./data/maps');
require('./data/quests/chapter1');
require('./data/quests/side');
require('./data/quests/legacy');
require('./data/quests/periodic');
require('./logic/items');
require('./logic/monsters');
require('./logic/skills');
require('./logic/player');
require('./logic/quests');
require('./logic/shop');

module.exports = require('./core');
