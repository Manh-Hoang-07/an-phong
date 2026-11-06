/*
 * Nhân vật: chỉ số cuối cùng, dùng được trang bị không, nội tại, thức tỉnh, nhân vật mới.
 */
(function (G) {
  'use strict';
  const { BAG_SIZE, r1, SCHOOLS, AWAKENS, PASSIVES, PERKS, SKILL_SLOTS, ITEMS, SLOTS, NEW_PLAYER_MAP, QUEST_VERSION, normalizeInst, instStats } = G;

  function nextAwaken(player) {
    const next = (player.awakenTier || 0) + 1;
    return AWAKENS.find(a => a.tier === next) || null;
  }
  function awakenOf(player) {
    const t = player.awakenTier || 0;
    return (t >= 1 && t <= AWAKENS.length) ? AWAKENS[t - 1] : null;
  }

  function passivesOf(player) {
    if (!player.school) return [];
    if (player.school === 'toan_nang') return Object.keys(PASSIVES);
    return PASSIVES[player.school] ? [player.school] : [];
  }

  function perksOf(player) { return (player.perks || []).filter(id => PERKS[id]); }

  function canUseItem(player, def) {
    if (!def || !def.slot) return false;
    if ((def.level || 1) > player.level) return false;
    if (def.slot === 'weapon' && def.school) {
      // Kiếm: kiem_si, sat_thu, tanker đều dùng được
      // Trượng: phap_su, tri_lieu_su đều dùng được
      // Cung: chỉ cung_thu
      // Toàn Năng: dùng tất cả
      if (player.school === 'toan_nang') return true;
      const compat = {
        kiem_si:    ['kiem_si', 'sat_thu', 'tanker'],
        sat_thu:    ['kiem_si', 'sat_thu', 'tanker'],
        tanker:     ['kiem_si', 'sat_thu', 'tanker'],
        phap_su:    ['phap_su', 'tri_lieu_su'],
        tri_lieu_su:['phap_su', 'tri_lieu_su'],
        cung_thu:   ['cung_thu'],
      };
      const allowed = compat[player.school] || [player.school];
      if (!allowed.includes(def.school)) return false;
    }
    return true;
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
    let hp = 80 + 18 * (lv - 1) + p.vit * 10 + eq.hp;
    let mp = 30 + 6 * (lv - 1) + p.spi * 6 + eq.mp;
    let atk = 5 + 2 * (lv - 1) + p.str * 2 + eq.atk;
    let def = 1 + (lv - 1) + Math.floor(p.vit * 0.8) + eq.def;
    let crit = 3 + p.agi * 0.4 + eq.crit;
    const perkMul = { hp: 1, mp: 1, atk: 1, def: 1 };
    const perkAdd = { crit: 0, boss: 0, cdr: 0, goldfind: 0, expfind: 0 };
    for (const id of perksOf(player)) {
      const pk = PERKS[id];
      for (const k in pk.mul || {}) perkMul[k] *= pk.mul[k];
      for (const k in pk.add || {}) perkAdd[k] += pk.add[k];
    }
    let skillMul = 1 + p.spi * 0.015;
    let costMul = 1;
    const sc = player.school && SCHOOLS[player.school];
    if (sc) {
      const b = sc.bonus;
      if (b.hp) hp *= b.hp;
      if (b.mp) mp *= b.mp;
      if (b.atk) atk *= b.atk;
      if (b.def) def *= b.def;
      if (b.critAdd) crit += b.critAdd;
      if (sc.skillPower) skillMul *= sc.skillPower;
      if (sc.skillCost) costMul = sc.skillCost;
    }
    // bonus speed nhân (sat_thu: speed: 1.15 — nhân trực tiếp vào base speed)
    const scSpeed = sc && sc.bonus && sc.bonus.speed ? sc.bonus.speed : 1;
    hp *= perkMul.hp; mp *= perkMul.mp; atk *= perkMul.atk; def *= perkMul.def;
    // Thức tỉnh: chỉ nhân thêm khi ĐANG BIẾN HÌNH (opts.form, do client bật/tắt). Server tính không có opts → chỉ số thường.
    const aw = opts.form ? awakenOf(player) : null;
    if (aw && aw.mul) {
      const m = aw.mul;
      if (m.hp) hp *= m.hp;
      if (m.mp) mp *= m.mp;
      if (m.atk) atk *= m.atk;
      if (m.def) def *= m.def;
    }
    crit += perkAdd.crit;
    const w = player.equip.weapon;
    const wtype = w ? ITEMS[w.id].wtype : 'tay';
    // bonus lifesteal và cdr từ class
    const scLifesteal = sc && sc.bonus && sc.bonus.lifestealAdd ? sc.bonus.lifestealAdd : 0;
    const scCdr = sc && sc.bonus && sc.bonus.cdrAdd ? sc.bonus.cdrAdd : 0;
    // speed: tính trước clamp, nhân thêm hệ số class (sat_thu)
    const speedFinal = Math.round(Math.min(290, Math.min(260, 190 + p.agi * 2) * scSpeed + eq.speed));
    return {
      maxHp: Math.round(hp), maxMp: Math.round(mp), atk: Math.round(atk), def: Math.round(def),
      maxSta: Math.round((G.STAMINA.base + G.STAMINA.perLevel * (lv - 1) + G.STAMINA.perAgi * (p.agi || 0)) * (sc && sc.bonus && sc.bonus.sta ? sc.bonus.sta : 1)),
      crit: Math.min(60, r1(crit)), speed: speedFinal, skillMul, costMul, wtype,
      lifesteal: Math.min(15, r1(eq.lifesteal + scLifesteal)),
      cdr: Math.min(30, r1(eq.cdr + perkAdd.cdr + scCdr)),
      boss: r1(eq.boss + perkAdd.boss), goldfind: r1(eq.goldfind + perkAdd.goldfind), expfind: r1(eq.expfind + perkAdd.expfind),
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
      awakenTier: 0,
      points: { str: 5, vit: 5, agi: 5, spi: 5 }, freePoints: 0,
      hp: null, mp: null,
      map: NEW_PLAYER_MAP, x: null, y: null,
      equip: Object.fromEntries(SLOTS.map(sl => [sl, null])),
      bag: [], storage: [], bagPlus: 0,
      skillSlots: Array(SKILL_SLOTS).fill(null),
      skills: {}, skillPoints: 0,
      unlocks: {}, redeemed: [], perks: [], boosts: {}, rank: 'E',
      quest: { step: 0, state: 'none', progress: {}, ver: QUEST_VERSION },
      side: { active: {}, done: [] },
      daily: null, weekly: null, shopDiscount: 0,
      kills: {},
      nextUid: 1,
      created: Date.now(),
    };
  }

  function bagSize(player) {
    return BAG_SIZE + 10 * Math.min(3, Math.max(0, player.bagPlus || 0));
  }

  Object.assign(G, { nextAwaken, awakenOf, passivesOf, perksOf, canUseItem, calcStats, newPlayer, bagSize, BOOST_MAX_MS, boostLeft, expBoostMul });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
