'use strict';
/*
 * Xuất dữ liệu game dùng chung (shared/) ra một file JSON cho app Godot.
 *
 *   node server/tools/export-gamedata.js
 *
 * Ghi ra: D:\Source\AnPhong-App\data\gamedata.json (có thể đổi bằng --out <file>).
 * Nội dung: SKILLS, ITEMS, SCHOOLS, MONSTERS, NPCS, MAPS + bản đồ .txt + constants.
 * Kèm `dataHash` (sha256 của phần dữ liệu, không đổi theo thời gian xuất) để app so với
 * /api/version dataHash. Chỉ đọc shared/, KHÔNG sửa server đang chạy.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const G = require('../../shared');

const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_OUT = path.join(ROOT, '..', 'AnPhong-App', 'data', 'gamedata.json');
const MAPS_DIR = path.join(ROOT, 'shared', 'maps');

const argv = process.argv.slice(2);
function arg(name, fallback) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}
const OUT = path.resolve(arg('--out', DEFAULT_OUT));

// Sắp xếp khóa để hash ổn định dù thứ tự khai báo trong shared/ đổi.
function stable(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(stable);
  const out = {};
  for (const k of Object.keys(value).sort()) out[k] = stable(value[k]);
  return out;
}

const SECTIONS = ['SKILLS', 'ITEMS', 'SCHOOLS', 'MONSTERS', 'NPCS', 'MAPS'];
const data = {};
for (const key of SECTIONS) {
  const v = G[key];
  if (!v || typeof v !== 'object') throw new Error(`shared/ thiếu ${key}`);
  data[key] = v;
}

// Bản đồ .txt: app đọc trực tiếp từ JSON này, không cần đóng gói thêm file.
// Chỉ lấy các map có định nghĩa trong GameData.MAPS.
const mapTexts = {};
let mapFiles = 0;
for (const id of Object.keys(data.MAPS)) {
  const file = path.join(MAPS_DIR, id + '.txt');
  if (!fs.existsSync(file)) continue;
  mapTexts[id] = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
  mapFiles++;
}
data.MAP_TEXTS = mapTexts;

// Hằng số cần cho app (vật lý, cấp, chỉ số).
data.CONSTANTS = {
  MAX_LEVEL: G.MAX_LEVEL,
  BAG_SIZE: G.BAG_SIZE,
  STORAGE_SIZE: G.STORAGE_SIZE,
  STAT_POINTS_PER_LEVEL: G.STAT_POINTS_PER_LEVEL,
  START_MAP: G.START_MAP,
  TILE: G.TILE,
  DEF_REDUCE_MAX: G.DEF_REDUCE_MAX,
  RANK_ORDER: G.RANK_ORDER,
};

// Hash chỉ tính trên dữ liệu + hằng số (không tính version/time để so sánh được với server).
const dataHash = crypto.createHash('sha256')
  .update(JSON.stringify(stable(data)), 'utf8')
  .digest('hex');

const out = {
  version: 1,
  generatedAt: new Date().toISOString(),
  dataHash,
  ...data,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out), 'utf8');

const size = fs.statSync(OUT).size;
console.log(`Đã xuất ${OUT}`);
console.log(`  SKILLS=${Object.keys(data.SKILLS).length} ITEMS=${Object.keys(data.ITEMS).length} ` +
  `SCHOOLS=${Object.keys(data.SCHOOLS).length} MONSTERS=${Object.keys(data.MONSTERS).length} ` +
  `NPCS=${Object.keys(data.NPCS).length} MAPS=${Object.keys(data.MAPS).length} (${mapFiles} file .txt)`);
console.log(`  dataHash=${dataHash}`);
console.log(`  kích thước=${(size / 1024).toFixed(1)} KB`);
