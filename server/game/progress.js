'use strict';
/* Luật chơi phía server · Tiến độ nhân vật: kinh nghiệm, xu, class, giới hạn máu / năng lượng. */
const G = require('../../shared');
const { fmt } = require('./util');

// ------------------------------------------------------------ Kinh nghiệm
function gainExp(p, amount, ev) {
  if (p.level >= G.MAX_LEVEL) return;
  p.exp += amount;
  ev.push({ t: 'float', text: `+${fmt(amount)} kinh nghiệm`, color: '#b388ff' });
  while (p.level < G.MAX_LEVEL && p.exp >= G.expToNext(p.level)) {
    p.exp -= G.expToNext(p.level);
    p.level++;
    p.freePoints += G.STAT_POINTS_PER_LEVEL;
    p.skillPoints = (p.skillPoints || 0) + 1;
    const st = G.calcStats(p, { form: !!p.formActive });
    p.hp = st.maxHp; p.mp = st.maxMp;
    ev.push({ t: 'levelup', level: p.level });
    ev.push({ t: 'msg', text: `[Hệ thống] Thăng cấp! Đạt cấp ${p.level}: +${G.STAT_POINTS_PER_LEVEL} điểm tiềm năng, +1 điểm kỹ năng.`, color: '#ffd54f' });
    const newSkills = G.availableSkills(p).filter(id => G.SKILLS[id].level === p.level && !G.SKILLS[id].ult);
    for (const id of newSkills) ev.push({ t: 'msg', text: `Có thể học kỹ năng mới: ${G.SKILLS[id].name} (phím K).`, color: '#4fc3f7' });
    const nr = G.nextRank(p);
    if (nr && nr.level === p.level) ev.push({ t: 'msg', text: `[Hiệp Hội] Bạn đã đủ cấp để đánh giá hạng ${nr.rank}. Gặp Hội trưởng Khải ở Hiệp Hội nếu muốn được đánh giá.`, color: '#ffb74d' });
  }
  if (p.level >= G.MAX_LEVEL) p.exp = 0;
}

function gainGold(p, amount, ev) {
  if (amount <= 0) return;
  p.gold += amount;
  ev.push({ t: 'float', text: `+${fmt(amount)} xu`, color: '#ffd54f' });
}

// Kho riêng của làng (tạo nếu chưa có). mapId = id làng.
function storageFor(p, mapId) {
  if (!p.storageByMap || typeof p.storageByMap !== 'object') p.storageByMap = {};
  if (!Array.isArray(p.storageByMap[mapId])) p.storageByMap[mapId] = [];
  return p.storageByMap[mapId];
}

// Vũ khí đang cầm không đúng loại của class (đổi class, hoặc dữ liệu từ trước khi tách vũ khí theo class):
// tháo ra cất vào túi; túi đầy thì cất vào kho; cả hai đầy vẫn cất vào túi (vượt giới hạn) để không mất đồ.
function unequipWrongWeapon(p, ev) {
  const w = p.equip && p.equip.weapon;
  if (!w || !G.ITEMS[w.id] || G.canUseWeapon(p, G.ITEMS[w.id])) return false;
  p.equip.weapon = null;
  const item = { ...w, qty: 1 };
  // Túi đầy thì cất vào kho của làng gốc của bản đồ đang đứng
  const kho = storageFor(p, G.villageOf(p.map) || G.START_MAP);
  const toStorage = G.bagSize(p) - p.bag.length < 1 && kho.length < G.STORAGE_SIZE;
  (toStorage ? kho : p.bag).push(item);
  const wt = G.classWeapon(p.school), wName = wt ? G.WEAPON_TYPES[wt].name : 'vũ khí luyện tập';
  if (ev) ev.push({ t: 'msg', text: `Đã tháo ${G.ITEMS[w.id].name} cất vào ${toStorage ? 'kho' : 'túi'}: class ${p.school ? G.SCHOOLS[p.school].name : 'hiện tại'} chỉ dùng ${wName}.`, color: '#ffb74d' });
  return true;
}

// Đặt class: trả lại toàn bộ điểm kỹ năng đã cộng, xóa ô kỹ năng
function setSchool(p, school, ev) {
  const evolve = p.school === 'trieu_hoi_su' && school === 'tu_linh_thuat_su';
  if (!evolve) {
    // Tuyệt kỹ đã học bằng sách được giữ lại (cấp 1), chỉ hoàn điểm đã cộng
    const ults = Object.keys(p.skills || {}).filter(id => G.SKILLS[id]?.ult && p.skills[id] > 0);
    const spent = Object.values(p.skills || {}).reduce((x, y) => x + y, 0) - ults.length;
    p.skillPoints += spent;
    p.skills = Object.fromEntries(ults.map(id => [id, 1]));
    p.skillSlots = Array(G.SKILL_SLOTS).fill(null);
    p.careerSlots = Array(G.SKILL_SLOTS).fill(null);
  }
  p.school = school;
  // Gắn lại các tuyệt kỹ đã học (phù hợp class mới) vào ô tuyệt kỹ
  for (const id of Object.keys(p.skills || {})) {
    if (!G.SKILLS[id]?.ult || !G.availableSkills(p).includes(id)) continue;
    const bar = p[G.slotKeyOf(p, id)];
    if (bar.includes(id)) continue;
    const free = G.ultSlotsOf(p).find(i => !bar[i]);
    if (free !== undefined) bar[free] = id;
  }
  unequipWrongWeapon(p, ev);
  if (school !== 'tu_linh_thuat_su' && p.shadows) p.shadows.enabled = false;
  p.formActive = false;
  const st = G.calcStats(p, { form: false });
  p.hp = st.maxHp; p.mp = st.maxMp;
  ev.push({ t: 'msg', text: `[Hệ thống] Thức tỉnh class ${G.SCHOOLS[school].name} thành công! Mở bảng Kỹ năng để học kỹ năng.`, color: '#ffd54f' });
  ev.push({ t: 'school', school });
}

function resetCost(p) { return 100 * p.level; }

function clampHpMp(p) {
  const st = G.calcStats(p, { form: !!p.formActive });
  if (p.hp != null) p.hp = Math.min(p.hp, st.maxHp);
  if (p.mp != null) p.mp = Math.min(p.mp, st.maxMp);
}

module.exports = { gainExp, gainGold, setSchool, resetCost, clampHpMp, unequipWrongWeapon, storageFor };
