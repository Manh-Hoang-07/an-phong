'use strict';
/*
 * Chia nhân vật thành các "section" để chỉ ghi phần nào đổi.
 *
 * Trong bộ nhớ và trong code game, nhân vật vẫn là MỘT object `p` như cũ. Chỉ tầng lưu trữ
 * (server/db.js, server/cache.js) tách `p` thành các section khi ghi và ghép lại khi đọc.
 *
 * Mỗi khóa của `p` thuộc đúng một section. Khóa không có trong bảng (ví dụ trường mới thêm sau này)
 * tự rơi vào section `misc`, nên không bao giờ bị mất dữ liệu.
 *
 *   core  (bảng players, phần nóng): thông tin chính, vị trí, vàng, kinh nghiệm
 *   Các section còn lại nằm ở bảng player_data.
 *
 * Kho (storageByMap) và bảng ngày / tuần (dailyByMap, weeklyByMap) của MỌI làng nằm chung section `storage` / `daily`:
 * chỉ đổi khi gửi / lấy đồ hoặc hạ quái nên không cần tách thêm dòng riêng cho từng làng.
 */
const SECTION_KEYS = {
  core: ['name', 'created', 'level', 'exp', 'gold', 'rank', 'school', 'hp', 'mp', 'map', 'x', 'y',
    'points', 'freePoints', 'shopDiscount'],
  kills: ['kills'],                                   // đổi mỗi lần hạ quái
  daily: ['dailyByMap', 'weeklyByMap'],               // bảng ngày / tuần riêng từng làng (đổi khi hạ quái)
  loot: ['loot'],                                     // đồ rơi trên đất
  bag: ['bag', 'bagPlus', 'nextUid'],
  equip: ['equip'],
  storage: ['storageByMap'],                       // kho riêng từng làng { mapId: [...] }
  quest: ['quest', 'side'],
  skills: ['skills', 'skillSlots', 'careerSlots', 'skillPoints'],
  pets: ['mounts', 'pets', 'pet'],
  summons: ['summons'],
  shadows: ['shadows'],
  advancement: ['advancement', 'awakenTier', 'formChoice', 'formActive', 'careerAwaken', 'hiddenNpcActive', 'perks', 'unlocks'],
  world: ['villages', 'choices', 'titles', 'redeemed', 'boosts'],
  misc: [],                                           // mọi khóa còn lại
};

const NAMES = Object.keys(SECTION_KEYS);
const OWNER = new Map();
for (const [sec, keys] of Object.entries(SECTION_KEYS)) for (const k of keys) OWNER.set(k, sec);

// p → { tên section: object chứa các khóa của section đó }
function split(p) {
  const out = {};
  for (const name of NAMES) out[name] = {};
  for (const k of Object.keys(p)) out[OWNER.get(k) || 'misc'][k] = p[k];
  return out;
}

// { tên section: object } → p
function assemble(parts) {
  const p = {};
  for (const name of NAMES) if (parts[name]) Object.assign(p, parts[name]);
  return p;
}

// p → { tên section: chuỗi JSON }
function stringifySections(p) {
  const parts = split(p);
  const out = {};
  for (const name of NAMES) out[name] = JSON.stringify(parts[name]);
  return out;
}

// Cột thật của bảng players (để tra cứu / xếp hạng), lấy từ section core
function coreColumns(p) {
  return {
    level: Number.isFinite(p.level) ? Math.trunc(p.level) : 1,
    exp: Number.isFinite(p.exp) ? Math.trunc(p.exp) : 0,
    gold: Number.isFinite(p.gold) ? Math.trunc(p.gold) : 0,
    map: p.map == null ? null : String(p.map),
    school: p.school == null ? null : String(p.school),
    rank: p.rank == null ? null : String(p.rank),
  };
}

module.exports = { SECTION_KEYS, NAMES, split, assemble, stringifySections, coreColumns };
