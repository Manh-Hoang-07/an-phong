/*
 * Chỉ số thú đồng hành (cố định) và cộng thêm từ trang bị thú.
 *
 * Thú đồng hành (mã quà tặng) KHÔNG lên cấp: chỉ số cố định theo loài (MOUNTS[id].stats), chỉ tăng nhờ trang bị.
 * Trang bị thú cộng số cố định: tính theo đường cong thú (PET_CURVE) tại cấp refLv của món đó.
 */
(function (G) {
  'use strict';

  // Chỉ số cộng thêm của một món trang bị thú
  function petGearBonusOf(def) {
    if (!def || def.kind !== 'pet_gear') return {};
    const hp = G.interp(G.PET_CURVE.hp, def.refLv), atk = G.interp(G.PET_CURVE.atk, def.refLv), df = G.interp(G.PET_CURVE.def, def.refLv);
    switch (def.petSlot) {
      case 'yen': return { maxHp: hp * 0.25 };
      case 'cuong': return { atk: atk * 0.2 };
      case 'giap': return { def: df * 0.25 };
      default: return { maxHp: hp * 0.08, atk: atk * 0.06, def: df * 0.08 };   // vòng cổ
    }
  }
  // Trang bị đang mặc của một con thú: { yen: 'thu_yen_nho' | null, ... }
  function petGearOf(player, petId) {
    const g = (player.petGear && player.petGear[petId]) || {};
    return Object.fromEntries(Object.keys(G.PET_GEAR_SLOTS).map(k => [k, g[k] && G.ITEMS[g[k]] ? g[k] : null]));
  }
  // Cộng trang bị vào bảng chỉ số { maxHp, maxMp, maxSta, atk, def }
  function applyPetGear(stats, player, petId) {
    for (const id of Object.values(petGearOf(player, petId))) {
      if (!id) continue;
      const b = petGearBonusOf(G.ITEMS[id]);
      if (b.maxHp) stats.maxHp = Math.round(stats.maxHp + b.maxHp);
      if (b.atk) stats.atk += b.atk;
      if (b.def) stats.def = Math.round(stats.def + b.def);
    }
    return stats;
  }
  // Chỉ số của một thú đồng hành: cố định theo loài + trang bị
  function companionStats(player, petId) {
    const m = G.MOUNTS[petId], s = (m && m.stats) || { hp: 1000, mp: 60, sta: 100, atk: 100, def: 100 };
    return applyPetGear({ maxHp: s.hp, maxMp: s.mp, maxSta: s.sta, atk: s.atk, def: s.def }, player, petId);
  }
  // Ô trang bị thú: cấp của thú để so với cấp yêu cầu (linh thú: cấp riêng, thú đồng hành: cấp chủ)
  function petLevelFor(player, petId) {
    return G.SUMMONS[petId] ? G.summonUnitLv(player, petId) : Math.max(1, player.level || 1);
  }

  Object.assign(G, { petGearBonusOf, petGearOf, applyPetGear, companionStats, petLevelFor });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
