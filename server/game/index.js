'use strict';
/*
 * Luật chơi phía server. Mọi thứ liên quan tới tiền, vật phẩm, kinh nghiệm,
 * nhiệm vụ và nâng cấp đều do server quyết định rồi lưu ngay vào PostgreSQL.
 *
 * Thư mục server/game/: luật chung (inventory, progress, quests, periodic, util)
 * và từng nhóm hành động người chơi gửi lên (actions/*.js).
 */
const G = require('../../shared');
const { GameError, fail } = require('./core/util');
const { pruneLoot, reforgeCost, salvageStones } = require('./core/inventory');
const { questComplete, currentQuest } = require('./core/quests');
const { resetCost, unequipWrongWeapon, storageFor } = require('./core/progress');
const { ensureBoards } = require('./core/periodic');

// Mọi hành động: tên → hàm (p, a, ev, userId)
const actions = Object.assign({},
  require('./actions/world'),
  require('./actions/combat'),
  require('./actions/quests'),
  require('./actions/items'),
  require('./actions/smith'),
  require('./actions/character'),
  require('./actions/advancement'),
  require('./actions/pets'),
  require('./actions/market')
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
  // ---------------------------------------------------------------- Migrate: trang bị đặc biệt → Kỳ Nguyên
  // Save cũ có thể đang giữ các món *_db_N (bua_db_1 … chuong_db_5) trong túi / đang mặc / kho / đất,
  // cùng Huyền Tinh Thạch. Cơ chế mới không còn các id này trong ITEMS, nên phải đổi sang quyền sở hữu
  // Kỳ Nguyên TRƯỚC khi dòng lọc `filter(e => G.ITEMS[e.id])` ở dưới chạy (nếu không sẽ mất sạch).
  // Quy tắc: mỗi ô cũ có BẤT KỂ món nào (bậc nào) → cấp id Kỳ Nguyên tương ứng vào owned + active.
  // Cấp người chơi cũ có thể chưa đủ mốc (vd có chuong_db_5 ở cấp 60) — vẫn cấp quyền để không mất lợi ích.
  {
    p.kyNguyen = p.kyNguyen || { owned: [], active: [] };
    if (!Array.isArray(p.kyNguyen.owned)) p.kyNguyen.owned = [];
    if (!Array.isArray(p.kyNguyen.active)) p.kyNguyen.active = [];
    const SLOT_TO_KN = G.OLD_SPECIAL_SLOT_TO_KY_NGUYEN || {};
    // Nhận diện id cũ theo regex: <slot>_db_<bậc>. Không phụ thuộc vào ITEMS (đã xóa các id này).
    const knOfOldId = (id) => {
      if (typeof id !== 'string') return null;
      const m = /^(bua|an|canh|linh_dan|chuong)_db_[1-5]$/.exec(id);
      return m ? (SLOT_TO_KN[m[1]] || null) : null;
    };
    const grant = (id) => {
      if (!id) return;
      if (!p.kyNguyen.owned.includes(id)) p.kyNguyen.owned.push(id);
      if (!p.kyNguyen.active.includes(id)) p.kyNguyen.active.push(id);
    };
    // 1. Đang mặc ở 5 ô cũ (nằm trong p.equip dù SLOTS mới đã bỏ chúng).
    for (const sl of Object.keys(SLOT_TO_KN)) {
      const it = p.equip && p.equip[sl];
      if (it && knOfOldId(it.id)) grant(SLOT_TO_KN[sl]);
      if (p.equip) delete p.equip[sl];
    }
    // 2. Trong túi / kho từng làng / đất: ghi nhận rồi bỏ instance cũ đi.
    const strip = (arr) => (Array.isArray(arr) ? arr.filter(e => {
      const kn = e && knOfOldId(e.id);
      if (kn) { grant(kn); return false; }
      return !(e && e.id === 'huyen_tinh_thach');   // xóa luôn đá nâng bậc đã vô dụng
    }) : arr);
    p.bag = strip(p.bag);
    for (const mapId of Object.keys(p.storageByMap || {})) p.storageByMap[mapId] = strip(p.storageByMap[mapId]);
    if (Array.isArray(p.loot)) {
      p.loot = p.loot.filter(l => {
        const kn = l && l.inst && knOfOldId(l.inst.id);
        if (kn) { grant(kn); return false; }
        return !(l && l.inst && l.inst.id === 'huyen_tinh_thach');
      });
    }
    // active ⊆ owned, và chỉ giữ id Kỳ Nguyên còn hợp lệ
    p.kyNguyen.active = [...new Set(p.kyNguyen.active.filter(id => p.kyNguyen.owned.includes(id) && G.ITEMS[id] && G.ITEMS[id].kyNguyen))];
    p.kyNguyen.owned = [...new Set(p.kyNguyen.owned.filter(id => G.ITEMS[id] && G.ITEMS[id].kyNguyen))];
  }
  // `arrive` là điểm tới của lần đổi bản đồ gần nhất, chỉ có nghĩa trong đúng phiên đó. Nếu đã có vị trí
  // đứng thật (x/y) thì cờ này là dấu vết cũ: giữ lại sẽ khiến lần vào game sau client ném nhân vật về cổng
  // thay vì đặt đúng chỗ đã lưu. Dữ liệu của người chơi cũ cũng được dọn ở đây.
  if (p.x != null && p.y != null) p.arrive = null;
  if (!p.formChoice) p.formChoice = 'awaken' + Math.max(1, Math.min(G.AWAKENS.length, p.awakenTier || 1));
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
  if (!p.petGear || typeof p.petGear !== 'object' || Array.isArray(p.petGear)) p.petGear = {};
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
    const petStats = G.companionStats(p, id);
    for (const [key, max] of [['hp', petStats.maxHp], ['mp', petStats.maxMp], ['sta', petStats.maxSta]]) {
      if (!Number.isFinite(state[key])) state[key] = max;
      state[key] = Math.max(0, Math.min(max, Math.round(state[key])));
    }
  }
  const activeStats = p.mounts.active ? G.companionStats(p, p.mounts.active) : { maxHp: 1, maxMp: 1, maxSta: 1 };
  p.pet = p.pets[p.mounts.active] || { hp: activeStats.maxHp, mp: activeStats.maxMp, sta: activeStats.maxSta };
  // Linh thú của Triệu Hồi Sư: bổ sung cấp/kinh nghiệm riêng cho từng con.
  // Bản cũ chỉ theo cấp nhân vật → người đã học Triệu Hồi Linh Thú từ trước được cấp bằng cấp nhân vật để không yếu đi đột ngột.
  // Người chơi mới (hoặc chưa học th5) bắt đầu từ cấp 1, lên cấp bằng cách đánh quái.
  if (!p.summons || typeof p.summons !== 'object' || Array.isArray(p.summons)) p.summons = { enabled: false, states: {} };
  if (!p.summons.states || typeof p.summons.states !== 'object' || Array.isArray(p.summons.states)) p.summons.states = {};
  if (!p.summons.units || typeof p.summons.units !== 'object' || Array.isArray(p.summons.units)) p.summons.units = {};
  for (const id of Object.keys(G.SUMMONS)) {
    const u = p.summons.units[id] && typeof p.summons.units[id] === 'object' ? p.summons.units[id] : (p.summons.units[id] = {});
    if (!Number.isFinite(u.lv) || u.lv < 1) u.lv = (!p.summons.v && G.skillLevel(p, 'th5') > 0) ? ownerLv : 1;
    if (!Number.isFinite(u.exp) || u.exp < 0) u.exp = 0;
    if (!p.summons.states[id] || typeof p.summons.states[id] !== 'object') p.summons.states[id] = {};
  }
  p.summons.v = 1;
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
  // Sách kỹ năng đã đọc (tối đa SKILL_BOOK_MAX). Người chơi cũ chưa có trường này: suy ra từ
  // số điểm đã cộng vượt quá điểm thăng cấp, chặn ở mức trần để không ai bị coi là đọc quá.
  if (!Number.isFinite(p.skillBooks)) {
    const fromLevel = Math.max(0, (p.level || 1) - 1);
    const spent = Object.keys(p.skills || {}).reduce((s, id) => s + (G.SKILLS[id] && !G.SKILLS[id].ult ? (p.skills[id] || 0) : 0), 0);
    p.skillBooks = Math.min(G.SKILL_BOOK_MAX, Math.max(0, spent + p.skillPoints - fromLevel));
  }
  // Dữ liệu cũ của cơ chế hai hình thái chức nghiệp: bỏ hẳn.
  // Người chơi cũ đã mở chức nghiệp 2 thì p.school đổi sang id nhánh luôn, không còn chuyện bật/tắt.
  if (p.careerSlots !== undefined) delete p.careerSlots;
  if (p.careerAwaken !== undefined) delete p.careerAwaken;
  // Hình thái chọn phải là một ấn hợp lệ và đã mở; không thì về ấn cao nhất đang có (tối thiểu ấn 1)
  { const t = G.awakenTierOf(p.formChoice);
    if (!t || t > (p.awakenTier || 0)) p.formChoice = 'awaken' + Math.max(1, p.awakenTier || 1); }
  if (p.school && !G.isEvolved(p.school) && p.advancement?.unlocked?.[G.evolutionOf(p.school)]) {
    // Người chơi cũ đã mở khóa nhánh: chuyển hẳn sang chức nghiệp 2 (không còn quay lại chức nghiệp 1)
    p.school = G.evolutionOf(p.school);
  }
  // Học kỹ năng bằng sách (bản 1): kỹ năng đã học giữ nguyên; mỗi kỹ năng thường trước đây tốn 1 điểm để học nên hoàn lại.
  // Ai đã học nhiều hơn 5 thì giữ nguyên (chỉ không học thêm được cho tới khi có ô trống).
  if (!p.skillExpand || typeof p.skillExpand !== 'object') p.skillExpand = { normal: 0, ult: 0 };
  if (!p.skillBookVer) {
    const usable = p.school ? new Set(G.availableSkills(p)) : null;
    for (const id of Object.keys(p.skills)) {
      const sk = G.SKILLS[id];
      if (!sk || !(p.skills[id] > 0)) { delete p.skills[id]; continue; }
      // Kỹ năng không còn thuộc class hiện tại (vd. Tử Linh Thuật Sư không còn học bộ Triệu Hồi Sư): mất, hoàn mọi điểm đã cộng
      if (usable && !usable.has(id) && G.baseSchool(p.school) !== 'toan_nang') { if (!sk.ult) p.skillPoints += p.skills[id]; delete p.skills[id]; continue; }
      if (!sk.ult) p.skillPoints += 1;
    }
    p.skillBookVer = 1;
  }
  while (p.skillSlots.length < G.SKILL_SLOTS) p.skillSlots.push(null);
  p.skillSlots = p.skillSlots.slice(0, G.SKILL_SLOTS).map(id => (id && G.SKILLS[id] && G.availableSkills(p).includes(id) ? id : null));
  // TUYỆT PHẨM tách khỏi p.skills sang p.superUlts (trụ riêng, không cấp, không ô học).
  // Chạy SAU các bước migrate trên để save cũ đã qua migrate vẫn được chuyển.
  // Idempotent: đã có p.superUlts thì chỉ dọn phần còn sót trong p.skills.
  if (!p.superUlts || typeof p.superUlts !== 'object' || Array.isArray(p.superUlts)) p.superUlts = {};
  for (const id of Object.keys(p.superUlts)) {
    // Id lạ hoặc không còn là TUYỆT PHẨM trong dữ liệu hiện tại: bỏ, không để rác trong save.
    if (!G.isSuperUlt(id) || p.superUlts[id] !== true) delete p.superUlts[id];
  }
  for (const id of Object.keys(p.skills)) {
    if (!G.isSuperUlt(id)) continue;
    // Đã sở hữu trong p.skills nghĩa là đã đọc sách: chuyển sang trụ mới. Cấp cũ (nếu có) bỏ —
    // TUYỆT PHẨM không dùng cấp, và giữ lại chỉ tạo ra trạng thái không có thật.
    p.superUlts[id] = true;
    delete p.skills[id];
  }
  pruneLoot(p);
  return p;
}

const market = require('./actions/market');

module.exports = { handle, migrate, settleMarket: market.settleUnpaid, GameError, questComplete, currentQuest, reforgeCost, salvageStones, resetCost };
