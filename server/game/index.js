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
const { resetCost, unequipWrongWeapon } = require('./progress');
const { ensureDaily } = require('./periodic');

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
  ensureDaily(player);
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
  // Đổi tên từ phiên bản ninja cũ
  const OLD_SCHOOL = { phong_anh: 'kiem_si', hoa_lien: 'cung_thu', thuy_nguyet: 'phap_su', van_phap: 'toan_nang' };
  const OLD_ITEM = { phi_tieu_sat: 'cung_go', phi_tieu_lua: 'cung_hop_kim', phi_tieu_thach_quy: 'cung_thach_vuong',
    quat_tre: 'truong_go', quat_suong: 'truong_pha_le', quat_thach_quy: 'truong_thach_vuong' };
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
  p.storage = p.storage.map(fixId).filter(e => G.ITEMS[e.id]);
  for (const s in p.equip) { fixId(p.equip[s]); if (p.equip[s] && !G.ITEMS[p.equip[s].id]) p.equip[s] = null; }
  for (const l of p.loot || []) fixId(l.inst);
  if (Array.isArray(p.loot)) p.loot = p.loot.filter(l => G.ITEMS[l.inst.id]);
  for (const s of G.SLOTS) if (p.equip[s] === undefined) p.equip[s] = null;
  for (const s of G.SLOTS) G.normalizeInst(p.equip[s]);
  unequipWrongWeapon(p, null);   // mỗi class chỉ cầm vũ khí của mình: vũ khí sai loại cất vào túi
  p.bag.forEach(G.normalizeInst);
  p.storage.forEach(G.normalizeInst);
  if (!G.MAPS[p.map]) { p.map = G.START_MAP; p.x = null; p.y = null; }
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
  ensureDaily(p);
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
  while (p.skillSlots.length < G.SKILL_SLOTS) p.skillSlots.push(null);
  p.skillSlots = p.skillSlots.slice(0, G.SKILL_SLOTS).map(id => (id && G.SKILLS[id] ? id : null));
  pruneLoot(p);
  return p;
}

module.exports = { handle, migrate, GameError, questComplete, currentQuest, reforgeCost, salvageStones, resetCost };
