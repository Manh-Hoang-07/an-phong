'use strict';
/*
 * Luật chơi phía server. Mọi thứ liên quan tới tiền, vật phẩm, kinh nghiệm,
 * nhiệm vụ và nâng cấp đều do server quyết định rồi lưu ngay vào SQLite.
 *
 * Thư mục server/game/: luật chung (inventory, progress, quests, periodic, util)
 * và từng nhóm hành động người chơi gửi lên (actions/*.js).
 */
const G = require('../../shared');
const { GameError, fail } = require('./util');
const { pruneLoot, reforgeCost, salvageStones } = require('./inventory');
const { questComplete, currentQuest } = require('./quests');
const { resetCost } = require('./progress');
const { ensureDaily } = require('./periodic');

// Mọi hành động: tên → hàm (p, a, ev, userId)
const actions = Object.assign({},
  require('./actions/world'),
  require('./actions/combat'),
  require('./actions/quests'),
  require('./actions/items'),
  require('./actions/smith'),
  require('./actions/character')
);

function handle(userId, player, action) {
  const fn = actions[action && action.type];
  if (!fn) fail('Hành động không hợp lệ.');
  ensureDaily(player);
  const ev = [];
  fn(player, action, ev, userId);
  return ev;
}

// Sửa dữ liệu cũ khi game thêm trường mới
function migrate(p) {
  const legacySkills = p.skills === undefined;
  const base = G.newPlayer(p.name);
  for (const k in base) if (p[k] === undefined) p[k] = base[k];
  // Đổi tên từ phiên bản ninja cũ
  const OLD_SCHOOL = { phong_anh: 'kiem_si', hoa_lien: 'cung_thu', thuy_nguyet: 'phap_su', van_phap: 'toan_nang' };
  const OLD_ITEM = { phi_tieu_sat: 'cung_go', phi_tieu_lua: 'cung_hop_kim', phi_tieu_thach_quy: 'cung_thach_vuong',
    quat_tre: 'truong_go', quat_suong: 'truong_pha_le', quat_thach_quy: 'truong_thach_vuong' };
  if (OLD_SCHOOL[p.school]) p.school = OLD_SCHOOL[p.school];
  const fixId = (e) => { if (e && OLD_ITEM[e.id]) e.id = OLD_ITEM[e.id]; return e; };
  p.bag = p.bag.map(fixId).filter(e => G.ITEMS[e.id]);
  p.storage = p.storage.map(fixId).filter(e => G.ITEMS[e.id]);
  for (const s in p.equip) { fixId(p.equip[s]); if (p.equip[s] && !G.ITEMS[p.equip[s].id]) p.equip[s] = null; }
  for (const l of p.loot || []) fixId(l.inst);
  if (Array.isArray(p.loot)) p.loot = p.loot.filter(l => G.ITEMS[l.inst.id]);
  for (const s of G.SLOTS) if (p.equip[s] === undefined) p.equip[s] = null;
  for (const s of G.SLOTS) G.normalizeInst(p.equip[s]);
  p.bag.forEach(G.normalizeInst);
  p.storage.forEach(G.normalizeInst);
  if (!G.MAPS[p.map]) { p.map = G.START_MAP; p.x = null; p.y = null; }
  if (!Array.isArray(p.loot)) p.loot = [];
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
  }
  if (!Number.isFinite(p.skillPoints)) p.skillPoints = 0;
  while (p.skillSlots.length < G.SKILL_SLOTS) p.skillSlots.push(null);
  p.skillSlots = p.skillSlots.slice(0, G.SKILL_SLOTS).map(id => (id && G.SKILLS[id] ? id : null));
  pruneLoot(p);
  return p;
}

module.exports = { handle, migrate, GameError, questComplete, currentQuest, reforgeCost, salvageStones, resetCost };
