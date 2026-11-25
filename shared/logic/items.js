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
  // Bộ của một món trang bị (vật phẩm không phải trang bị thì trả về null).
  // Kỳ Nguyên không có `slot` nên tự động trả null — không cần special-case nữa.
  function setOfItem(def) { return def && def.slot ? setOfLevel(def.level || 1) : null; }

  // ---------------------------------------------------------------- Đếm món cùng bộ đang mặc
  // Trả về { [setId]: số món }. Chỉ đếm 10 ô trang bị thường; ô đặc biệt và đồ độc nhất (có desc,
  // không thuộc bộ) tự động không được tính vì setOfItem trả null cho chúng.
  function setCounts(player) {
    const out = {};
    for (const slot of G.SLOTS) {
      const it = player.equip && player.equip[slot];
      if (!it) continue;
      const set = setOfItem(ITEMS[it.id]);
      if (!set) continue;
      out[set.id] = (out[set.id] || 0) + 1;
    }
    return out;
  }

  // Thưởng của bộ mạnh nhất đang mặc: { id, name, count, tier, mul, add, fx } hoặc null.
  // Chỉ MỘT bộ được tính (bộ có nhiều món nhất); hòa thì lấy bộ id nhỏ hơn.
  // tier: 0 = chưa đủ ngưỡng, 1 = đủ 6 món, 2 = đủ 10 món.
  function setBonusOf(player) {
    const counts = setCounts(player);
    let best = null;
    for (const id in counts) {
      const n = counts[id];
      if (!best || n > best.count) best = { id: Number(id), count: n };
    }
    if (!best || best.count < G.SET_TIER_LOW) return null;
    const def = G.SETS.find(s => s.id === best.id);
    const bonus = G.SET_BONUS[best.id];
    if (!def || !bonus) return null;
    const tier = best.count >= G.SET_TIER_HIGH ? 2 : 1;
    const part = tier === 2 ? bonus.at10 : bonus.at6;
    if (!part) return null;
    return { id: best.id, name: def.name, count: best.count, tier, mul: part.mul || null, add: part.add || null, fx: part.fx || null };
  }

  function statLabel(k) { return (AFFIXES[k] && AFFIXES[k].name) || STAT_NAMES[k] || k; }
  function statUnit(k) { return k === 'crit' || k === 'staRegen' || k === 'skill' || k === 'cdr' || k === 'lifesteal' || k === 'boss' || k === 'goldfind' || k === 'expfind' ? '%' : (AFFIXES[k] && AFFIXES[k].unit) || ''; }

  function upgradeCost(plus) {
    return { gold: 15 * (plus + 1) * (plus + 1), stones: Math.ceil((plus + 1) / 3) };
  }
  // Chỉ thất bại ở ngưỡng cuối (+11 → +12) mới giảm 1 cấp; các cấp thấp hơn thất bại thì giữ nguyên.
  function upgradeFailDrops(plus) { return plus + 1 >= 12; }

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
    // Đồ nhiễm: chỉ số chính mạnh hơn đồ thường cùng cấp — đó là lý do người ta vẫn mặc nó
    const nhiemMul = inst.nhiem > 0 ? NHIEM_STAT_MUL : 1;
    const mul = (inst.roll || 1) * QUALITY_MUL[inst.q || 1] * (1 + 0.08 * (inst.plus || 0)) * nhiemMul;
    for (const k in def.stats) {
      // Chí mạng trên đồ là số cố định: không nhân theo độ ngẫu nhiên, phẩm chất hay cấp cường hóa (để không chạm trần 60% quá sớm)
      main[k] = k === 'crit' ? r1(def.stats[k]) : Math.round(def.stats[k] * mul);
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
    // opts.plus: cấp cường hóa tặng sẵn (trang admin); mọi chỗ khác không truyền thì vẫn +0
    const plus = Math.max(0, Math.min(G.UPGRADE_MAX || 12, Math.floor(opts.plus) || 0));
    return { id, qty: 1, plus, q, roll, aff: rollAffixes(def, q) };
  }

  // Độ hoàn hảo 0–100%: chỉ số chính và các dòng phụ ra cao hay thấp trong khoảng có thể
  function perfection(inst) {
    const parts = [((inst.roll || 1) - 0.8) / 0.4];
    for (const a of inst.aff || []) parts.push(a[2] != null ? a[2] : 0.5);
    return Math.round(parts.reduce((s, x) => s + x, 0) / parts.length * 100);
  }

  // ---------------------------------------------------------------- Vết Nhiễm (nhiễm đỏ)
  // Đồ rơi ở cổng đỏ (theme 'redgate') có thể dính Nhiễm đỏ — đúng thứ đã xuất hiện trong cốt truyện
  // từ chương 1 (Cổng đỏ chưa phân hạng) tới chương 5 (Cổng Vĩnh Hằng).
  //
  // Món nhiễm: chỉ số mạnh hơn đồ thường cùng cấp (NHIEM_STAT_MUL), nhưng khi ĐANG MẶC thì
  //   - máu tối đa bị trừ theo bậc nhiễm (NHIEM_HP_PENALTY)
  //   - không hồi máu ngoài giao chiến (regen tự nhiên bị chặn)
  // Đó là một câu hỏi thật mỗi lần nhặt đồ: ăn chỉ số, hay giữ máu hồi?
  //
  // Gột bằng Thuốc chữa nhiễm đỏ (thuoc_nhiem_do, đã có sẵn từ trước) ở Dược sư:
  // uống thuốc khi ĐANG MẶC món nhiễm sẽ gột sạch vết nhiễm của món đó, giữ nguyên chỉ số đã roll.
  const NHIEM_STAT_MUL = 1.18;      // đồ nhiễm mạnh hơn 18% chỉ số chính
  const NHIEM_HP_PENALTY = 0.06;    // mỗi bậc nhiễm trừ 6% máu tối đa
  const NHIEM_MAX = 3;              // bậc nhiễm tối đa
  const NHIEM_CHANCE = 0.35;        // tỉ lệ đồ rơi ở cổng đỏ bị nhiễm

  // Bản đồ này có phải cổng đỏ không (đọc theme của bản đồ)
  function isRedGate(mapId) {
    const m = G.MAPS && G.MAPS[mapId];
    return !!m && m.theme === 'redgate';
  }

  // Gieo vết nhiễm cho một món vừa rơi. Trả về inst (đã sửa tại chỗ) để chỗ gọi dùng luôn.
  // Chỉ đồ có ô và không phải đồ đặc biệt (đồ Linh Ngọc không nhiễm — nó đã là hàng trả tiền).
  function rollNhiem(inst, mapId) {
    if (!inst) return inst;
    const def = ITEMS[inst.id];
    if (!def || !def.slot || def.special) return inst;
    if (!isRedGate(mapId)) return inst;
    if (Math.random() >= NHIEM_CHANCE) return inst;
    // Bậc nhiễm: đồ càng hiếm càng dễ nhiễm nặng (1–3)
    const q = inst.q || 1;
    const maxTier = Math.min(NHIEM_MAX, Math.max(1, q));
    inst.nhiem = 1 + Math.floor(Math.random() * maxTier);
    return inst;
  }

  // Món này có đang bị nhiễm không
  const isNhiem = (inst) => !!(inst && inst.nhiem > 0);

  // Tổng bậc nhiễm của các món ĐANG MẶC
  function nhiemLoad(player) {
    let n = 0;
    for (const slot of G.SLOTS) {
      const it = player.equip && player.equip[slot];
      if (it && it.nhiem > 0) n += it.nhiem;
    }
    return n;
  }

  // Hệ số máu do nhiễm: 1 - 6% mỗi bậc, sàn 0.7 (không bao giờ mất quá 30% máu)
  const nhiemHpMul = (load) => Math.max(0.7, 1 - NHIEM_HP_PENALTY * (load || 0));

  // Gột sạch vết nhiễm của một món (giữ nguyên chỉ số đã roll)
  function cleanseNhiem(inst) {
    if (!inst || !(inst.nhiem > 0)) return false;
    delete inst.nhiem;
    return true;
  }

  // Mô tả ngắn để hiện trong bảng chi tiết
  function nhiemText(tier) {
    const t = Math.max(1, Math.min(NHIEM_MAX, tier || 1));
    return `Nhiễm đỏ bậc ${t}: +${Math.round((NHIEM_STAT_MUL - 1) * 100)}% chỉ số, −${Math.round(NHIEM_HP_PENALTY * t * 100)}% máu tối đa, không hồi máu ngoài giao chiến`;
  }

  // ---------------------------------------------------------------- Khắc ấn (đồ hoàn hảo)
  // Đồ đạt PERFECT_MIN% độ hoàn hảo trở lên được khắc ấn MỘT LẦN ở Thợ rèn: thêm 1 dòng phụ thứ tư.
  // Đây là chỗ duy nhất độ hoàn hảo có tác dụng thật, không chỉ để hiển thị.
  // Khắc ấn xong thì đóng dấu `seal` để không khắc lại được (dòng phụ thứ tư là vĩnh viễn).
  const PERFECT_MIN = 95;
  const SEAL_AFFIX_COUNT = 4;
  function canSeal(inst) {
    const def = ITEMS[inst.id];
    if (!def || !def.slot || def.special) return false;
    if (inst.seal) return false;
    if ((inst.q || 1) < 2) return false;            // đồ Thường không có dòng phụ để nhân bản
    if ((inst.aff || []).length >= SEAL_AFFIX_COUNT) return false;
    return perfection(inst) >= PERFECT_MIN;
  }
  // Chi phí khắc ấn: đắt hơn tẩy luyện vì kết quả là vĩnh viễn
  function sealCost(inst) {
    const def = ITEMS[inst.id];
    return { gold: 120 * (inst.q || 1) * Math.max(2, def.level || 1), stones: (inst.q || 1) * 2 };
  }

  function sellPrice(inst) {
    const def = ITEMS[inst.id];
    if (!def || !def.price || def.kind === 'quest') return 0;
    if (!def.slot) return Math.floor(def.price / 4);
    return Math.floor(def.price / 4 * QUALITY_PRICE[inst.q || 1] * (1 + (inst.plus || 0) * 0.25));
  }

  Object.assign(G, { setOfLevel, setOfItem, setCounts, setBonusOf, statLabel, statUnit, upgradeCost, upgradeFailDrops, normalizeInst, instStats, rollQuality, rollAffixes, makeInst, perfection, sellPrice,
    PERFECT_MIN, SEAL_AFFIX_COUNT, canSeal, sealCost,
    NHIEM_STAT_MUL, NHIEM_HP_PENALTY, NHIEM_MAX, NHIEM_CHANCE, isRedGate, rollNhiem, isNhiem, nhiemLoad, nhiemHpMul, cleanseNhiem, nhiemText });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
