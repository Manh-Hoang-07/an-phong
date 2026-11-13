/*
 * Nhân vật: chỉ số cuối cùng, dùng được trang bị không, nội tại, thức tỉnh, nhân vật mới.
 */
(function (G) {
  'use strict';
  const { BAG_SIZE, r1, SCHOOLS, AWAKENS, PASSIVES, PERKS, SKILL_SLOTS, ITEMS, SLOTS, NEW_PLAYER_MAP, QUEST_VERSION, normalizeInst, instStats, baseSchool } = G;

  function nextAwaken(player) {
    const next = (player.awakenTier || 0) + 1;
    return AWAKENS.find(a => a.tier === next) || null;
  }
  function awakenOf(player) {
    const t = player.awakenTier || 0;
    return (t >= 1 && t <= AWAKENS.length) ? AWAKENS[t - 1] : null;
  }

  // Ấn thức tỉnh đi theo NGƯỜI chơi, không theo nghề: chức nghiệp 1 hay chức nghiệp 2 đều dùng chung Ấn I / Ấn II.
  function canAwaken(player) { return (player.awakenTier || 0) >= 1; }

  // Nội tại: chức nghiệp 2 giữ nội tại của class nền, trừ nhánh có nội tại riêng (Tử Linh Thuật Sư).
  // Toàn Năng có cả 3 nội tại.
  function passivesOf(player) {
    const school = player.school;
    if (!school) return [];
    if (baseSchool(school) === 'toan_nang') return Object.keys(PASSIVES);
    if (PASSIVES[school]) return [school];
    const base = baseSchool(school);
    return PASSIVES[base] ? [base] : [];
  }

  function perksOf(player) { return (player.perks || []).filter(id => PERKS[id]); }

  function canUseItem(player, def) {
    if (!def || !def.slot) return false;
    if ((def.level || 1) > player.level) return false;
    if (def.slot === 'weapon') return canUseWeapon(player, def);
    return true;
  }
  // Mỗi class chỉ dùng đúng loại vũ khí của mình (SCHOOLS[...].weapon). Chức nghiệp 2 dùng chung vũ khí class nền.
  // Ngoại lệ: Toàn Năng dùng Thần Binh và mọi vũ khí của class khác (cầm vũ khí class nào thì hiện hình class đó).
  // Chưa chọn class: chỉ dùng vũ khí luyện tập (không thuộc class nào).
  function canUseWeapon(player, def) {
    if (!player.school) return !def.school;
    if (baseSchool(player.school) === 'toan_nang') return true;
    return def.wtype === G.classWeapon(player.school);
  }

  // Tính chỉ số cuối cùng của nhân vật từ cấp, điểm tiềm năng, trang bị và class
  function calcStats(player, opts = {}) {
    const lv = player.level;
    const p = player.points;
    const eq = { hp: 0, mp: 0, atk: 0, def: 0, crit: 0, lifesteal: 0, cdr: 0, speed: 0, boss: 0, goldfind: 0, expfind: 0 };
    for (const slot of SLOTS) {
      const it = player.equip[slot];
      if (!it) continue;
      const s = instStats(normalizeInst(it)).all;
      for (const k in s) eq[k] = (eq[k] || 0) + s[k];
    }
    // Chỉ số gốc theo đường cong RIÊNG của từng class: [cơ bản, mỗi cấp] (chưa chọn class dùng NOVICE_CURVE).
    // Chức nghiệp 2 không khai báo curve riêng: lấy đường cong class nền rồi nhân EVOLUTION_MUL (×1.3).
    const sc = player.school && SCHOOLS[player.school];
    const base = sc && sc.base && SCHOOLS[sc.base];
    const cv = (sc && sc.curve) || (base && base.curve) || G.NOVICE_CURVE;
    const evoMul = sc && sc.evolved ? G.EVOLUTION_MUL : 1;
    const lvl = (a) => (a[0] + a[1] * (lv - 1)) * evoMul;
    let hp = lvl(cv.hp) + p.vit * 10 + eq.hp;
    let mp = lvl(cv.mp) + p.spi * 6 + eq.mp;
    let atk = lvl(cv.atk) + p.str * 2 + eq.atk;
    let def = lvl(cv.def) + Math.floor(p.vit * 0.8) + eq.def;
    let crit = 3 + p.agi * 0.4 + eq.crit;
    const perkMul = { hp: 1, mp: 1, atk: 1, def: 1 };
    const perkAdd = { crit: 0, boss: 0, cdr: 0, goldfind: 0, expfind: 0 };
    for (const id of perksOf(player)) {
      const pk = PERKS[id];
      for (const k in pk.mul || {}) perkMul[k] *= pk.mul[k];
      for (const k in pk.add || {}) perkAdd[k] += pk.add[k];
    }
    // Sức mạnh kỹ năng theo Tinh thần: có trần ×2 (SPI/(SPI+150)), không tăng vô hạn như trước. Chỉ nhân vào sát thương kỹ năng (không nhân hồi máu / buff).
    let skillMul = 1 + p.spi / (p.spi + 150);
    let costMul = 1;
    if (sc) {
      const b = sc.bonus;
      if (b.critAdd) crit += b.critAdd;
      if (b.skillPower || sc.skillPower) skillMul *= b.skillPower || sc.skillPower;
      if (sc.skillCost) costMul = sc.skillCost;
    }
    // bonus speed nhân (sat_thu: speed: 1.15 — nhân trực tiếp vào base speed)
    const scSpeed = sc && sc.bonus && sc.bonus.speed ? sc.bonus.speed : 1;
    hp *= perkMul.hp; mp *= perkMul.mp; atk *= perkMul.atk; def *= perkMul.def;
    // Thức tỉnh (biến hình): chỉ nhân thêm khi ĐANG BIẾN HÌNH (opts.form, do client bật/tắt).
    // Đi theo người chơi, không theo nghề: chức nghiệp 1 hay chức nghiệp 2 đều dùng chung Ấn I / Ấn II.
    // Server tính không có opts → chỉ số thường.
    const aw = !opts.form ? null : player.formChoice === 'awaken2' ? AWAKENS[1] : AWAKENS[0];
    let formSta = 1;   // hệ số thể lực của ấn đang bật (theo hệ số năng lượng của ấn)
    const applyMul = (m) => {
      if (!m) return;
      formSta *= m.mp || 1;
      if (m.hp) hp *= m.hp;
      if (m.mp) mp *= m.mp;
      if (m.atk) atk *= m.atk;
      if (m.def) def *= m.def;
    };
    // Chức nghiệp 2 đã cộng 30% vào đường cong nền ở trên (evoMul); ở đây chỉ còn hệ số của Ấn thức tỉnh.
    if (aw) applyMul(aw.mul);
    crit += perkAdd.crit;
    const w = player.equip.weapon;
    const wtype = w ? ITEMS[w.id].wtype : 'tay';
    // bonus lifesteal và cdr từ class
    const scLifesteal = sc && sc.bonus && sc.bonus.lifestealAdd ? sc.bonus.lifestealAdd : 0;
    const scCdr = sc && sc.bonus && sc.bonus.cdrAdd ? sc.bonus.cdrAdd : 0;
    // speed: tính trước clamp, nhân thêm hệ số class (sat_thu)
    const speedFinal = Math.round(Math.min(290, Math.min(260, 190 + p.agi * 2) * scSpeed + eq.speed));
    // Thể lực tối đa: dạng thường x1.3 (STAMINA.maxMul). Đang biến hình thì KHÔNG có hệ số này, thay bằng hệ số của ấn / hình thái
    const staMul = aw ? formSta : G.STAMINA.maxMul;
    return {
      maxHp: Math.round(hp), maxMp: Math.round(mp), atk: Math.round(atk), def: Math.round(def),
      maxSta: Math.round((G.STAMINA.base + G.STAMINA.perLevel * (lv - 1) + G.STAMINA.perAgi * (p.agi || 0)) * staMul * (sc && sc.bonus && sc.bonus.sta ? sc.bonus.sta : 1)),
      crit: Math.min(60, r1(crit)), speed: speedFinal, skillMul, costMul, wtype,
      lifesteal: Math.min(15, r1(eq.lifesteal + scLifesteal)),
      cdr: Math.min(30, r1(eq.cdr + perkAdd.cdr + scCdr)),
      // Trần cộng dồn: sát thương lên trùm 80%, xu rơi thêm 100%, kinh nghiệm thêm 60%
      boss: Math.min(80, r1(eq.boss + perkAdd.boss)), goldfind: Math.min(100, r1(eq.goldfind + perkAdd.goldfind)), expfind: Math.min(60, r1(eq.expfind + perkAdd.expfind)),
    };
  }

  // Tăng cường đang có hiệu lực (Bùa nhân đôi kinh nghiệm...): player.boosts = { exp: mốc hết hạn (ms) }
  const BOOST_MAX_MS = 24 * 3600 * 1000;
  function boostLeft(player, kind, now) { return Math.max(0, ((player.boosts || {})[kind] || 0) - now); }
  function expBoostMul(player, now) { return boostLeft(player, 'exp', now) > 0 ? 2 : 1; }

  function newPlayer(name) {
    return {
      name,
      level: 1, exp: 0, gold: 50,
      school: null,
      awakenTier: 0, formChoice: 'awaken1', formActive: false, hiddenNpcActive: false, villages: ['lang'], titles: [], choices: {},
      advancement: { quest: null, done: {}, unlocked: {} },
      points: { str: 5, vit: 5, agi: 5, spi: 5 }, freePoints: 0,
      hp: null, mp: null,
      map: NEW_PLAYER_MAP, x: null, y: null,
      equip: Object.fromEntries(SLOTS.map(sl => [sl, null])),
      bag: [], storageByMap: {}, bagPlus: 0,   // storageByMap: kho riêng từng làng { mapId: [vật phẩm] }
      skillSlots: Array(SKILL_SLOTS).fill(null),
      skills: {}, skillPoints: 0, skillExpand: { normal: 0, ult: 0 },
      unlocks: {}, redeemed: [], perks: [], boosts: {}, rank: 'E',
      mounts: { owned: [], active: null, summoned: [], skill: 'bite', skills: {} },   // giữ active / skill để đọc dữ liệu client cũ
      pets: {},
      summons: { enabled: false, states: {} },   // linh thú mặc định của Triệu Hồi Sư (kỹ năng th5)
      shadows: { roster: [], active: [], enabled: false, nextId: 1 },
      pet: { hp: null, mp: null, sta: null },   // trạng thái thú cũ, migrate chuyển sang pets
      quest: { step: 0, state: 'none', progress: {}, ver: QUEST_VERSION },
      side: { active: {}, done: [] },
      dailyByMap: {}, weeklyByMap: {}, shopDiscount: 0,   // bảng nhiệm vụ ngày / tuần riêng từng làng { mapId: ... }
      kills: {},
      nextUid: 1,
      created: Date.now(),
    };
  }

  // Kho của làng (mảng, chỉ đọc nếu chưa có). mapId bỏ trống = bản đồ đang đứng.
  function storageOf(player, mapId) {
    return (player.storageByMap && player.storageByMap[mapId || player.map]) || [];
  }

  function bagSize(player) {
    return BAG_SIZE + 10 * Math.min(3, Math.max(0, player.bagPlus || 0));
  }

  Object.assign(G, { nextAwaken, awakenOf, canAwaken, passivesOf, perksOf, canUseItem, canUseWeapon, calcStats, newPlayer, bagSize, storageOf, BOOST_MAX_MS, boostLeft, expBoostMul });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
