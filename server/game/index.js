'use strict';
/*
 * Luật chơi phía server. Mọi thứ liên quan tới tiền, vật phẩm, kinh nghiệm,
 * nhiệm vụ và nâng cấp đều do server quyết định rồi lưu ngay vào PostgreSQL.
 *
 * Thư mục server/game/: luật chung (inventory, progress, quests, periodic, util)
 * và từng nhóm hành động người chơi gửi lên (actions/*.js).
 */
const G = require('../../shared');
const { GameError, fail } = require('./util');
const { pruneLoot, reforgeCost, salvageStones } = require('./inventory');
const { questComplete, currentQuest } = require('./quests');
const { resetCost, unequipWrongWeapon, storageFor } = require('./progress');
const { ensureBoards } = require('./periodic');

// Mọi hành động: tên → hàm (p, a, ev, userId)
const actions = Object.assign({},
  require('./actions/world'),
  require('./actions/combat'),
  require('./actions/quests'),
  require('./actions/items'),
  require('./actions/smith'),
  require('./actions/character'),
  require('./actions/advancement')
);

async function handle(userId, player, action) {
  const fn = actions[action && action.type];
  if (!fn) fail('Hành động không hợp lệ.');
  ensureBoards(player);
  const ev = [];
  await fn(player, action, ev, userId);
  return ev;
}

// Sửa dữ liệu cũ khi game thêm trường mới
function migrate(p) {
  const legacySkills = p.skills === undefined;
  // Nhân vật cũ (trước khi hạng phải qua đánh giá): giữ hạng đang có theo cấp, không bị tụt về E
  if (p.rank === undefined && p.level) p.rank = G.rankOf(p.level);
  const base = G.newPlayer(p.name);
  for (const k in base) if (p[k] === undefined) p[k] = base[k];
  // Kho và bảng nhiệm vụ ngày / tuần giờ riêng từng làng. Dữ liệu cũ (một kho, một bảng chung) chuyển về Hiệp Hội.
  // Kho cũ được giữ nguyên dù vượt STORAGE_SIZE (chỉ không nhận thêm cho tới khi lấy bớt ra).
  if (!p.storageByMap || typeof p.storageByMap !== 'object' || Array.isArray(p.storageByMap)) p.storageByMap = {};
  if (!p.dailyByMap || typeof p.dailyByMap !== 'object' || Array.isArray(p.dailyByMap)) p.dailyByMap = {};
  if (!p.weeklyByMap || typeof p.weeklyByMap !== 'object' || Array.isArray(p.weeklyByMap)) p.weeklyByMap = {};
  if (p.storage !== undefined) {
    if (Array.isArray(p.storage) && p.storage.length) storageFor(p, G.START_MAP).push(...p.storage);
    delete p.storage;
  }
  if (p.daily !== undefined) { if (p.daily && !p.dailyByMap[G.START_MAP]) p.dailyByMap[G.START_MAP] = p.daily; delete p.daily; }
  if (p.weekly !== undefined) { if (p.weekly && !p.weeklyByMap[G.START_MAP]) p.weeklyByMap[G.START_MAP] = p.weekly; delete p.weekly; }
  // Đổi tên từ phiên bản ninja cũ
  const OLD_SCHOOL = { phong_anh: 'kiem_si', hoa_lien: 'cung_thu', thuy_nguyet: 'phap_su', van_phap: 'toan_nang' };
  const OLD_ITEM = { phi_tieu_sat: 'cung_go', phi_tieu_lua: 'cung_go', phi_tieu_thach_quy: 'cung_thach_vuong',
    quat_tre: 'truong_go', quat_suong: 'truong_go', quat_thach_quy: 'truong_thach_vuong' };
  if (OLD_SCHOOL[p.school]) p.school = OLD_SCHOOL[p.school];
  if (!p.advancement || typeof p.advancement !== 'object') p.advancement = { quest: null, done: {}, unlocked: {} };
  if (!p.advancement.done) p.advancement.done = {};
  if (!p.advancement.unlocked) p.advancement.unlocked = {};
  p.hiddenNpcActive = false; // lần nạp lại hoặc đổi map đều cần gọi NPC lại
  if (!p.formChoice) p.formChoice = p.awakenTier >= 2 ? 'awaken2' : 'awaken1';
  // Dữ liệu Necromancer cũ được giữ làm nhánh tiến hóa thay vì đổi class nền.
  if (p.school === 'tu_linh_thuat_su') { p.school = 'trieu_hoi_su'; p.advancement.unlocked.tu_linh_thuat_su = true; }
  const fixId = (e) => { if (e && OLD_ITEM[e.id]) e.id = OLD_ITEM[e.id]; return e; };
  p.bag = p.bag.map(fixId).filter(e => G.ITEMS[e.id]);
  for (const id of Object.keys(p.storageByMap)) {
    p.storageByMap[id] = (Array.isArray(p.storageByMap[id]) ? p.storageByMap[id] : []).map(fixId).filter(e => e && G.ITEMS[e.id]);
  }
  for (const s in p.equip) { fixId(p.equip[s]); if (p.equip[s] && !G.ITEMS[p.equip[s].id]) p.equip[s] = null; }
  for (const l of p.loot || []) fixId(l.inst);
  if (Array.isArray(p.loot)) p.loot = p.loot.filter(l => G.ITEMS[l.inst.id]);
  for (const s of G.SLOTS) if (p.equip[s] === undefined) p.equip[s] = null;
  for (const s of G.SLOTS) G.normalizeInst(p.equip[s]);
  unequipWrongWeapon(p, null);   // mỗi class chỉ cầm vũ khí của mình: vũ khí sai loại cất vào túi
  p.bag.forEach(G.normalizeInst);
  for (const id of Object.keys(p.storageByMap)) p.storageByMap[id].forEach(G.normalizeInst);
  if (!G.MAPS[p.map]) { p.map = G.START_MAP; p.x = null; p.y = null; }
  if (!Array.isArray(p.titles)) p.titles = [];
  if (!p.choices || typeof p.choices !== 'object' || Array.isArray(p.choices)) p.choices = {};
  if (!Array.isArray(p.villages)) p.villages = [G.START_MAP];
  p.villages = [...new Set(p.villages.filter(id => G.MAPS[id] && G.MAPS[id].village))];
  if (G.MAPS[p.map].village && !p.villages.includes(p.map)) p.villages.push(p.map);
  if (!p.villages.includes(G.START_MAP)) p.villages.unshift(G.START_MAP);
  if (!Array.isArray(p.loot)) p.loot = [];
  if (!p.mounts || !Array.isArray(p.mounts.owned)) p.mounts = { owned: [], active: null };
  p.mounts.owned = p.mounts.owned.filter(id => G.MOUNTS[id]);
  if (p.mounts.active && !p.mounts.owned.includes(p.mounts.active)) p.mounts.active = null;
  if (!Array.isArray(p.mounts.summoned)) p.mounts.summoned = p.mounts.active ? [p.mounts.active] : [];
  p.mounts.summoned = [...new Set(p.mounts.summoned.filter(id => p.mounts.owned.includes(id)))];
  if (p.mounts.active && !p.mounts.summoned.includes(p.mounts.active)) p.mounts.summoned.unshift(p.mounts.active);
  p.mounts.active = p.mounts.summoned[0] || null;
  if (!G.PET_SKILLS[p.mounts.skill]) p.mounts.skill = 'bite';
  if (!p.mounts.skills || typeof p.mounts.skills !== 'object' || Array.isArray(p.mounts.skills)) p.mounts.skills = {};
  for (const id of p.mounts.owned) if (!G.PET_SKILLS[p.mounts.skills[id]]) p.mounts.skills[id] = G.PET_SKILLS[p.mounts.skill] ? p.mounts.skill : 'bite';
  const petStats = G.petStats(p);
  if (!p.pets || typeof p.pets !== 'object' || Array.isArray(p.pets)) p.pets = {};
  if (!p.shadows || typeof p.shadows !== 'object' || Array.isArray(p.shadows)) p.shadows = { roster: [], active: [], enabled: false, nextId: 1 };
  if (!Array.isArray(p.shadows.roster)) p.shadows.roster = [];
  p.shadows.roster = p.shadows.roster.filter(x => x && Number.isInteger(x.uid) && G.MONSTERS[x.monster]).slice(0, G.SHADOW_ROSTER);
  if (!Array.isArray(p.shadows.active)) p.shadows.active = [];
  p.shadows.active = [...new Set(p.shadows.active.filter(uid => p.shadows.roster.some(x => x.uid === uid)))].slice(0, G.SHADOW_PARTY);
  // Bóng ma thu từ trước khi có lưu thông số: bổ sung theo dữ liệu quái hiện tại
  for (const soul of p.shadows.roster) if (!soul.stats && G.MONSTERS[soul.monster]) soul.stats = { ...G.monSnapshot(soul.monster, null), at: null };
  // Bóng ma cũ chưa có cấp riêng: lấy cấp quái lúc bị hạ (lưu trong snapshot); kinh nghiệm bắt đầu từ 0
  const ownerLv = Math.max(1, p.level || 1);
  for (const soul of p.shadows.roster) {
    if (!Number.isFinite(soul.lv) || soul.lv < 1) soul.lv = Math.max(1, (soul.stats && soul.stats.level) || 1);
    if (!Number.isFinite(soul.exp) || soul.exp < 0) soul.exp = 0;
  }
  p.shadows.enabled = !!p.shadows.enabled;
  if (!Number.isInteger(p.shadows.nextId) || p.shadows.nextId < 1) p.shadows.nextId = Math.max(0, ...p.shadows.roster.map(x => x.uid)) + 1;
  const legacyPetId = p.mounts.active || p.mounts.owned[0];
  if (legacyPetId && !p.pets[legacyPetId] && p.pet && typeof p.pet === 'object') p.pets[legacyPetId] = p.pet;
  for (const id of p.mounts.owned) {
    const state = p.pets[id] && typeof p.pets[id] === 'object' ? p.pets[id] : (p.pets[id] = {});
    for (const [key, max] of [['hp', petStats.maxHp], ['mp', petStats.maxMp], ['sta', petStats.maxSta]]) {
      if (!Number.isFinite(state[key])) state[key] = max;
      state[key] = Math.max(0, Math.min(max, Math.round(state[key])));
    }
  }
  p.pet = p.pets[p.mounts.active] || { hp: petStats.maxHp, mp: petStats.maxMp, sta: petStats.maxSta };
  // Linh thú của Triệu Hồi Sư: bổ sung cấp/kinh nghiệm riêng cho từng con.
  // Bản cũ chỉ theo cấp nhân vật → migrate cho cấp bằng cấp nhân vật hiện tại để không yếu đi đột ngột.
  if (!p.summons || typeof p.summons !== 'object' || Array.isArray(p.summons)) p.summons = { enabled: false, states: {} };
  if (!p.summons.states || typeof p.summons.states !== 'object' || Array.isArray(p.summons.states)) p.summons.states = {};
  if (!p.summons.units || typeof p.summons.units !== 'object' || Array.isArray(p.summons.units)) p.summons.units = {};
  for (const id of Object.keys(G.SUMMONS)) {
    const u = p.summons.units[id] && typeof p.summons.units[id] === 'object' ? p.summons.units[id] : (p.summons.units[id] = {});
    if (!Number.isFinite(u.lv) || u.lv < 1) u.lv = ownerLv;
    if (!Number.isFinite(u.exp) || u.exp < 0) u.exp = 0;
    if (!p.summons.states[id] || typeof p.summons.states[id] !== 'object') p.summons.states[id] = {};
  }
  if (!p.unlocks || typeof p.unlocks !== 'object') p.unlocks = {};
  if (!Array.isArray(p.perks)) p.perks = [];
  p.perks = p.perks.filter(id => G.PERKS[id]);
  if (!p.side || typeof p.side !== 'object') p.side = { active: {}, done: [] };
  if (!p.side.active || typeof p.side.active !== 'object') p.side.active = {};
  if (!Array.isArray(p.side.done)) p.side.done = [];
  p.side.done = p.side.done.filter(id => G.sideById(id));
  for (const id of Object.keys(p.side.active)) {
    const sq = G.sideById(id);
    if (!sq || p.side.done.includes(id)) { delete p.side.active[id]; continue; }
    if (!p.side.active[id] || typeof p.side.active[id] !== 'object') p.side.active[id] = { progress: {} };
    if (!p.side.active[id].progress) p.side.active[id].progress = {};
  }
  if (!Number.isFinite(p.bagPlus)) p.bagPlus = 0;
  p.bagPlus = Math.max(0, Math.min(3, Math.floor(p.bagPlus)));
  if (!Number.isFinite(p.shopDiscount)) p.shopDiscount = 0;
  if (!p.quest.ver) {
    const oldId = G.OLD_QUEST_ORDER[p.quest.step];
    const newId = oldId ? (G.OLD_QUEST_MAP[oldId] || oldId) : 'q10';
    const idx = G.QUESTS.findIndex(q => q.id === newId);
    if (!oldId) { p.quest.state = 'none'; p.quest.progress = {}; }
    p.quest.step = idx >= 0 ? idx : G.QUESTS.length;
    p.quest.ver = G.QUEST_VERSION;
  }
  // Nhiệm vụ đang làm dở từ trước khi có "nhận ở đâu trả ở đó": ghi bản đồ của NPC giao
  const giverMap = (npcId) => (G.npcHere(p, p.map, npcId) ? p.map : (G.npcMaps(p, npcId)[0] || p.map));
  const cq = G.QUESTS[p.quest.step];
  if (p.quest.state === 'active' && cq && !p.quest.map) p.quest.map = giverMap(cq.npc);
  if (p.quest.state !== 'active') p.quest.map = null;
  for (const id of Object.keys(p.side.active)) {
    const sq = G.sideById(id);
    if (sq && !p.side.active[id].map) p.side.active[id].map = giverMap(sq.npc);
  }
  ensureBoards(p);
  if (!Array.isArray(p.redeemed)) p.redeemed = [];
  // Hệ thống điểm kỹ năng: người chơi cũ được trả điểm theo cấp, kỹ năng đang dùng được học sẵn cấp 1
  if (legacySkills || !p.skills || typeof p.skills !== 'object' || Array.isArray(p.skills)) {
    p.skills = {};
    p.skillPoints = Math.max(0, p.level - 1);
    const old = Array.isArray(p.skillSlots) ? p.skillSlots : [];
    p.skillSlots = Array(G.SKILL_SLOTS).fill(null);
    old.slice(0, 4).forEach((id, i) => {
      const sk = G.SKILLS[id];
      if (sk && !sk.ult && sk.level <= p.level && G.availableSkills(p).includes(id) && p.skillPoints > 0) {
        p.skills[id] = 1; p.skillPoints--; p.skillSlots[i] = id;
      }
    });
    const oldUlt = old[G.ULT_SLOT];
    if (oldUlt && G.SKILLS[oldUlt]?.ult && G.availableSkills(p).includes(oldUlt)) {
      p.skills[oldUlt] = 1;
      p.skillSlots[G.ULT_SLOT] = oldUlt;
    }
  }
  if (!Number.isFinite(p.skillPoints)) p.skillPoints = 0;
  // Toàn Năng Tinh Thông không còn là hình thái nhân chỉ số: Ấn II dùng chung, Tinh Thông chỉ mở khóa kỹ năng nhánh của mọi class
  if (p.school === 'toan_nang') {
    if (p.advancement?.unlocked?.toan_nang_tinh_thong && (p.awakenTier || 0) < 2) p.awakenTier = 2;
    if (p.formChoice === 'evolution') { p.formChoice = p.awakenTier >= 2 ? 'awaken2' : 'awaken1'; p.formActive = false; }
  }
  while (p.skillSlots.length < G.SKILL_SLOTS) p.skillSlots.push(null);
  p.skillSlots = p.skillSlots.slice(0, G.SKILL_SLOTS).map(id => (id && G.SKILLS[id] ? id : null));
  // Thanh kỹ năng chức nghiệp 2: chuyển kỹ năng nhánh đang nằm ở thanh chức nghiệp 1 (dữ liệu cũ) sang thanh riêng
  if (!Array.isArray(p.careerSlots)) p.careerSlots = [];
  while (p.careerSlots.length < G.SKILL_SLOTS) p.careerSlots.push(null);
  p.careerSlots = p.careerSlots.slice(0, G.SKILL_SLOTS).map(id => (id && G.SKILLS[id] && G.slotKeyOf(p, id) === 'careerSlots' ? id : null));
  p.skillSlots.forEach((id, i) => {
    if (!id || G.slotKeyOf(p, id) !== 'careerSlots') return;
    p.skillSlots[i] = null;
    if (!p.careerSlots.includes(id) && !p.careerSlots[i]) p.careerSlots[i] = id;
  });
  pruneLoot(p);
  return p;
}

module.exports = { handle, migrate, GameError, questComplete, currentQuest, reforgeCost, salvageStones, resetCost };
