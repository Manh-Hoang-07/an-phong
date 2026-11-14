'use strict';
/* Luật chơi phía server · Tiến độ nhân vật: kinh nghiệm, xu, class, giới hạn máu / năng lượng. */
const G = require('../../../shared');
const { fmt } = require('./util');
const { giveItem } = require('./inventory');

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
    const newSkills = G.availableSkills(p).filter(id => G.SKILLS[id].level === p.level && !G.SKILLS[id].ult && !G.skillLevel(p, id));
    for (const id of newSkills) ev.push({ t: 'msg', text: `Đã đủ cấp học kỹ năng ${G.SKILLS[id].name}: mua Sách Kỹ Năng ở tiệm tạp hóa.`, color: '#4fc3f7' });
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

// Nguồn DUY NHẤT sinh ra Linh Ngọc. src dùng để đối soát: 'code:<MÃ>' hôm nay, 'topup:<ORDER>' sau này.
function grantNgoc(p, amount, src, ev) {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (!n) return 0;
  p.linhNgoc = (p.linhNgoc || 0) + n;
  p.ngocLog = (Array.isArray(p.ngocLog) ? p.ngocLog : []).concat([{ t: Date.now(), n, src }]).slice(-50);
  if (ev) ev.push({ t: 'msg', text: `[Hệ thống] Nhận ${fmt(n)} Linh Ngọc.`, color: '#b388ff' });
  return n;
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

// Học một kỹ năng mới (đã kiểm tra điều kiện): cấp 1, tự đặt vào ô thanh kỹ năng còn trống.
function learnNewSkill(p, id) {
  const sk = G.SKILLS[id];
  p.skills[id] = 1;
  const slots = sk.ult ? G.ultSlotsOf(p) : G.normalSlotsOf(p);
  const free = slots.find(i => !p.skillSlots[i]);
  if (free !== undefined) p.skillSlots[free] = id;
}

// Quà khởi đầu mỗi lần đặt class: 2 Sách Kỹ Năng cấp thấp nhất của class (để không phải tay trắng khi chưa mua được sách)
function giveStarterBooks(p, ev) {
  const mine = G.availableSkills(p)
    .filter(id => !G.SKILLS[id].ult && !G.skillLevel(p, id) && G.SKILLS[id].level <= p.level && (G.SKILLS[id].evolutionKey || G.SKILLS[id].school === p.school))
    .sort((a, b) => G.SKILLS[a].level - G.SKILLS[b].level).slice(0, 2);
  for (const id of mine) giveItem(p, G.skillBookId(id), 1, ev);
}

// Đặt class (chọn class nền ở cấp 5, mật mã mở class đặc biệt, Sách Tiến Hóa Chức Nghiệp).
// Kỹ năng đã học mà class mới không dùng được thì MẤT LUÔN (hoàn lại điểm đã cộng thêm, không hoàn sách).
// Kỹ năng vẫn dùng được (vd. tuyệt kỹ chung dòng, bộ triệu hồi của Tử Linh) giữ nguyên cấp.
function setSchool(p, school, ev) {
  p.school = school;
  const usable = new Set(G.availableSkills(p));
  let refund = 0, lost = 0;
  for (const id of Object.keys(p.skills || {})) {
    if (usable.has(id)) continue;
    refund += Math.max(0, (p.skills[id] || 1) - 1);
    delete p.skills[id];
    lost++;
  }
  p.skillPoints += refund;
  const old = Array.isArray(p.skillSlots) ? p.skillSlots : [];
  p.skillSlots = Array(G.SKILL_SLOTS).fill(null);
  old.slice(0, G.SKILL_SLOTS).forEach((id, i) => { if (id && p.skills[id]) p.skillSlots[i] = id; });
  // Gắn lại các tuyệt kỹ đã học chưa có ô
  for (const id of Object.keys(p.skills)) {
    if (!G.SKILLS[id]?.ult || p.skillSlots.includes(id)) continue;
    const free = G.ultSlotsOf(p).find(i => !p.skillSlots[i]);
    if (free !== undefined) p.skillSlots[free] = id;
  }
  if (lost && ev) ev.push({ t: 'msg', text: `[Hệ thống] ${lost} kỹ năng của class cũ đã mất${refund ? `, hoàn ${refund} điểm kỹ năng` : ''}.`, color: '#ffb74d' });
  giveStarterBooks(p, ev);
  unequipWrongWeapon(p, ev);
  if (school !== 'tu_linh_thuat_su' && p.shadows) p.shadows.enabled = false;
  p.formActive = false;
  const st = G.calcStats(p, { form: false });
  p.hp = st.maxHp; p.mp = st.maxMp;
  const sc = G.SCHOOLS[school];
  ev.push({ t: 'msg', text: sc.evolved
    ? `[Hệ thống] Tiến hóa thành ${sc.name}! Chức nghiệp 1 không còn nữa — mua Sách Kỹ Năng ở tiệm tạp hóa để học bộ kỹ năng mới.`
    : `[Hệ thống] Thức tỉnh class ${sc.name} thành công! Mua Sách Kỹ Năng ở tiệm tạp hóa để học kỹ năng.`, color: '#ffd54f' });
  ev.push({ t: 'school', school });
}

function resetCost(p) { return 100 * p.level; }

function clampHpMp(p) {
  const st = G.calcStats(p, { form: !!p.formActive });
  if (p.hp != null) p.hp = Math.min(p.hp, st.maxHp);
  if (p.mp != null) p.mp = Math.min(p.mp, st.maxMp);
}

module.exports = { learnNewSkill, gainExp, gainGold, grantNgoc, setSchool, resetCost, clampHpMp, unequipWrongWeapon, storageFor };
