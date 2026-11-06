/*
 * Tính toán trang bị: bộ, chỉ số từng món, phẩm chất ngẫu nhiên, giá bán, nâng cấp.
 */
(function (G) {
  'use strict';
  const { r1, ITEMS, SET_LEVELS, SETS, QUALITY_MUL, QUALITY_AFFIX, QUALITY_PRICE, QUALITY_ODDS, AFFIXES, STAT_NAMES } = G;

  // Bộ của một cấp; cấp vượt quá bộ cuối thì thuộc bộ cuối
  function setOfLevel(level) {
    const lv = Math.max(1, Math.floor(level || 1));
    return SETS[Math.min(SETS.length - 1, Math.floor((lv - 1) / SET_LEVELS))];
  }
  // Bộ của một món trang bị (vật phẩm không phải trang bị thì trả về null)
  function setOfItem(def) { return def && def.slot ? setOfLevel(def.level || 1) : null; }

  function statLabel(k) { return (AFFIXES[k] && AFFIXES[k].name) || STAT_NAMES[k] || k; }
  function statUnit(k) { return k === 'crit' ? '%' : (AFFIXES[k] && AFFIXES[k].unit) || ''; }

  function upgradeCost(plus) {
    return { gold: 15 * (plus + 1) * (plus + 1), stones: Math.ceil((plus + 1) / 3) };
  }
  // Thất bại khi nâng lên +8 trở lên thì bị giảm 1 cấp
  function upgradeFailDrops(plus) { return plus + 1 >= 8; }

  // ---------------------------------------------------------------- Trang bị theo từng món
  // Mỗi món trang bị trong túi: { uid, id, qty, plus, q (phẩm chất), roll (0.8–1.2), aff: [[dòng phụ, giá trị, độ tốt 0..1]] }

  // Đồ cũ (trước khi có hệ thống ngẫu nhiên) được coi như chỉ số chuẩn
  function normalizeInst(e) {
    if (!e) return e;
    const def = ITEMS[e.id];
    if (def && def.slot) {
      if (e.q == null) e.q = def.minQ || 1;
      if (e.roll == null) e.roll = 1;
      if (!Array.isArray(e.aff)) e.aff = [];
      if (e.plus == null) e.plus = 0;
    }
    return e;
  }

  // Chỉ số của một món: chỉ số chính (nhân độ ngẫu nhiên, phẩm chất, cấp nâng) + dòng phụ
  function instStats(inst) {
    const def = ITEMS[inst.id];
    const main = {}, aff = {}, all = {};
    if (!def || !def.stats) return { main, aff, all };
    const mul = (inst.roll || 1) * QUALITY_MUL[inst.q || 1] * (1 + 0.08 * (inst.plus || 0));
    for (const k in def.stats) {
      const v = def.stats[k] * mul;
      main[k] = k === 'crit' ? r1(v) : Math.round(v);
    }
    for (const [k, v] of inst.aff || []) aff[k] = r1((aff[k] || 0) + v);
    for (const k in main) all[k] = main[k];
    for (const k in aff) all[k] = r1((all[k] || 0) + aff[k]);
    return { main, aff, all };
  }

  function rollQuality(table, minQ) {
    const odds = QUALITY_ODDS[table] || QUALITY_ODDS.normal;
    let x = Math.random(), q = 1;
    for (let i = 0; i < odds.length; i++) { if (x < odds[i]) { q = i + 1; break; } x -= odds[i]; q = i + 1; }
    return Math.max(q, minQ || 1);
  }

  function rollAffixes(def, q, count) {
    const n = count != null ? count : QUALITY_AFFIX[q];
    const keys = Object.keys(AFFIXES);
    const out = [];
    const lv = def.level || 1;
    while (out.length < n && keys.length) {
      const k = keys.splice(Math.floor(Math.random() * keys.length), 1)[0];
      const a = AFFIXES[k];
      const p = Math.random();
      let v = a.min(lv) + (a.max(lv) - a.min(lv)) * p;
      v = a.unit === '%' ? r1(v) : Math.max(1, Math.round(v));
      out.push([k, v, Math.round(p * 100) / 100]);
    }
    return out;
  }

  // Tạo một món mới. opts.plain = true: đồ cửa hàng (thường, chỉ số chuẩn 100%, không dòng phụ)
  function makeInst(id, opts = {}) {
    const def = ITEMS[id];
    if (!def.slot) return { id, qty: opts.qty || 1, plus: 0 };
    // Mua ở tiệm: luôn phẩm chất Thường, không dòng phụ (đồ Hiếm/Huyền thoại chỉ có từ quái, trùm).
    // Bán lại được 1/4 giá, nên không thể mua rồi bán lại để kiếm lời.
    if (opts.shop) return { id, qty: 1, plus: 0, q: 1, roll: 1, aff: [] };
    if (opts.plain) return { id, qty: 1, plus: 0, q: def.minQ || 1, roll: 1, aff: def.minQ ? rollAffixes(def, def.minQ) : [] };
    const q = opts.q || rollQuality(opts.table || 'normal', def.minQ);
    const roll = Math.round((0.8 + Math.random() * 0.4) * 1000) / 1000;
    return { id, qty: 1, plus: 0, q, roll, aff: rollAffixes(def, q) };
  }

  // Độ hoàn hảo 0–100%: chỉ số chính và các dòng phụ ra cao hay thấp trong khoảng có thể
  function perfection(inst) {
    const parts = [((inst.roll || 1) - 0.8) / 0.4];
    for (const a of inst.aff || []) parts.push(a[2] != null ? a[2] : 0.5);
    return Math.round(parts.reduce((s, x) => s + x, 0) / parts.length * 100);
  }

  function sellPrice(inst) {
    const def = ITEMS[inst.id];
    if (!def || !def.price || def.kind === 'quest') return 0;
    if (!def.slot) return Math.floor(def.price / 4);
    return Math.floor(def.price / 4 * QUALITY_PRICE[inst.q || 1] * (1 + (inst.plus || 0) * 0.25));
  }

  Object.assign(G, { setOfLevel, setOfItem, statLabel, statUnit, upgradeCost, upgradeFailDrops, normalizeInst, instStats, rollQuality, rollAffixes, makeInst, perfection, sellPrice });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
