/*
 * Chỉ số và cấp của linh thú đang gọi.
 *
 * Linh thú mạnh theo CẤP RIÊNG của nó, không theo cấp nhân vật; cấp thật bị kẹp tối đa bằng cấp chủ.
 */
(function (G) {
  'use strict';
  const { SUMMONS, PET_CURVE } = G;

  function summonLevelStats(lv, skLv, sp) {
    const mul = 1 + 0.12 * ((skLv || 1) - 1), s = sp || {};
    return { maxHp: Math.round(G.interp(PET_CURVE.hp, lv) * (s.hp || 1) * mul), maxMp: Math.round((24 + 4 * (lv - 1)) * mul), maxSta: Math.round((70 + 2 * (lv - 1)) * mul),
      atk: G.interp(PET_CURVE.atk, lv) * mul, def: Math.round(G.interp(PET_CURVE.def, lv) * (s.def || 1)) };
  }
  // Cấp hiệu lực của linh thú: cấp thật bị kẹp tối đa bằng cấp chủ
  function summonUnitLv(player, id) {
    const cap = Math.max(1, player.level || 1);
    const u = player.summons && player.summons.units && player.summons.units[id];
    return Math.max(1, Math.min(cap, (u && Number.isFinite(u.lv) ? Math.floor(u.lv) : 1)));
  }
  function summonUnitStats(player, id) {
    return G.applyPetGear(summonLevelStats(summonUnitLv(player, id), (player.skills && player.skills.th5) || 1, SUMMONS[id]), player, id);
  }
  // Kỹ năng riêng của linh thú đã mở khóa theo cấp riêng (từ thấp tới cao)
  function summonSkillsUnlocked(player, id) {
    const lv = summonUnitLv(player, id);
    return (G.SUMMON_SKILLS[id] || []).filter(sk => sk.lv <= lv);
  }
  // Giữ tên cũ cho nơi gọi chưa đổi: chỉ số của linh thú đang chọn
  function summonStats(player) { return summonUnitStats(player, summonChoice(player)); }
  // Kinh nghiệm lên cấp của linh thú / bóng ma (người chơi dùng expToNext trong core)
  function summonExpToNext(lv) { return Math.floor(60 * Math.pow(lv, 1.5)); }
  function shadowExpToNext(lv) { return Math.floor(55 * Math.pow(lv, 1.5)); }
  // Mỗi lần chỉ gọi 1 linh thú (người chơi chọn con nào); cấp kỹ năng th5 chỉ tăng sức mạnh linh thú
  function summonCount(player) { return ((player.skills && player.skills.th5) || 0) >= 1 ? 1 : 0; }
  // Linh thú đang được chọn (mặc định con đầu tiên)
  function summonChoice(player) {
    const c = player.summons && player.summons.choice;
    return SUMMONS[c] ? c : Object.keys(SUMMONS)[0];
  }

  Object.assign(G, { summonLevelStats, summonUnitLv, summonUnitStats, summonSkillsUnlocked, summonStats, summonExpToNext, shadowExpToNext, summonCount, summonChoice });
})(typeof module === 'object' && module.exports ? require('../../core') : self.GameData);
