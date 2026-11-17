/*
 * Cửa hàng: danh sách hàng và giá.
 */
(function (G) {
  'use strict';
  const { ITEMS, NPCS, sideDone } = G;

  // Tiệm bán trang bị (gearShop): bày ĐỦ mọi bộ trang bị thường từ cấp 1 tới cấp tối đa.
  // Bỏ qua món độc nhất (có lời mô tả riêng: phần thưởng cốt truyện, đồ trùm) và món không có giá.
  const SLOT_ORDER = ['weapon', 'mu', 'ao', 'gang_tay', 'dai_lung', 'quan', 'giay', 'nhan', 'day_chuyen', 'ngoc_boi'];
  let gearCache = null;
  function shopGear() {
    if (!gearCache) {
      gearCache = Object.keys(ITEMS).filter(id => { const d = ITEMS[id]; return d.slot && d.price > 0 && !d.desc; });
      const lv = (id) => ITEMS[id].level || 1;
      const set = (id) => (G.setOfItem(ITEMS[id]) || { id: 0 }).id;
      gearCache.sort((a, b) => set(a) - set(b) || SLOT_ORDER.indexOf(ITEMS[a].slot) - SLOT_ORDER.indexOf(ITEMS[b].slot) || lv(a) - lv(b));
    }
    return gearCache;
  }

  // Dòng class của một cuốn sách kỹ năng: class nền + các nhánh tiến hóa của nó chung một dòng
  const bookLine = (id) => {
    const sk = G.SKILLS[ITEMS[id].skill];
    return sk ? G.baseSchool(sk.evolutionKey || sk.school) : '';
  };

  // Sách kỹ năng thường của MỌI class, xếp sách class người chơi lên đầu rồi theo dòng class và cấp.
  // Tiệm bày đủ để còn mua bán / trao đổi; sách class khác đọc không được (xem bookFits).
  let bookCache = null;
  function skillBookIds(player) {
    if (!bookCache) {
      bookCache = Object.keys(ITEMS).filter(id => ITEMS[id].kind === 'skill_book')
        .sort((a, b) => bookLine(a).localeCompare(bookLine(b)) || (ITEMS[a].level || 0) - (ITEMS[b].level || 0));
    }
    const mine = player.school ? new Set(G.availableSkills(player)) : new Set();
    const own = [], rest = [];
    for (const id of bookCache) (mine.has(ITEMS[id].skill) ? own : rest).push(id);
    return own.concat(rest);
  }

  // Sách kỹ năng này class hiện tại có đọc được không (sách class khác vẫn bán, chỉ là đọc sẽ bị từ chối)
  function bookFits(player, itemId) {
    const d = ITEMS[itemId];
    if (!d || d.kind !== 'skill_book' || !d.skill || !player.school) return true;
    return G.availableSkills(player).includes(d.skill);
  }

  // Danh sách hàng bán của NPC, có món mở khóa qua phụ tuyến
  function shopItems(player, npcId) {
    const n = NPCS[npcId];
    if (!n || !n.shop) return [];
    const list = n.gearShop ? shopGear().concat(n.shop.filter(id => !shopGear().includes(id))) : n.shop.slice();
    const add = (ids) => { for (const id of ids) if (ITEMS[id] && !list.includes(id)) list.push(id); };
    if (n.shopKind === 'herb' && sideDone(player, 'p5-2')) add(['thuoc_nhiem_do']);
    if (n.shopKind === 'gear' && sideDone(player, 'p2-1')) add(['binh_mau_vua', 'binh_nl_vua']);
    if (n.shopKind === 'gear' && sideDone(player, 'p2-2')) add(['da_cuong_hoa_cao']);
    if (n.shopKind === 'gear') {
      add(Object.keys(ITEMS).filter(id => ITEMS[id].kind === 'pet_gear'));
      // Chưa thức tỉnh class thì chưa bày sách (đọc cũng chưa được, xem action 'use')
      if (player.school) add(skillBookIds(player));
    }
    // Món bán bằng Linh Ngọc không bao giờ lọt vào quầy xu
    return capByVillage(player, list).filter(id => !(ITEMS[id].priceNgoc > 0));
  }

  // ===== Lầu Trân Bảo: bán bằng Linh Ngọc =====
  const NGOC_GROUPS = [['ky_nguyen', 'Kỳ Nguyên'], ['util', 'Tiện ích'], ['book', 'Sách'], ['ult', 'Tuyệt kỹ'], ['superult', 'Siêu tuyệt kỹ']];
  const ngocRank = (id) => Math.max(0, NGOC_GROUPS.findIndex(g => g[0] === ITEMS[id].ngocGroup));
  // Hàng bán bằng ngọc: món trong n.shop có priceNgoc + 5 Kỳ Nguyên
  // + mọi sách tuyệt kỹ class (không lọc theo class, không gồm tuyệt kỹ chung ultAny)
  function ngocShopItems(player, npcId) {
    const n = NPCS[npcId];
    if (!n || !n.ngocShop) return [];
    const list = (n.shop || []).filter(id => ITEMS[id] && ITEMS[id].priceNgoc > 0);
    // 5 Kỳ Nguyên: bán rời, mua cái nào sở hữu cái đó. Không còn bậc / nâng cấp tại chỗ.
    for (const id of (G.KY_NGUYEN || [])) {
      if (ITEMS[id] && ITEMS[id].priceNgoc > 0 && !list.includes(id)) list.push(id);
    }
    for (const sid of Object.keys(G.SKILLS)) {
      const sk = G.SKILLS[sid];
      const id = G.ultBookId(sid);
      if (sk.ult && ITEMS[id] && ITEMS[id].priceNgoc > 0 && !list.includes(id)) list.push(id);
    }
    const lv = (id) => ITEMS[id].level || 0;
    // Trong nhóm Kỳ Nguyên: xếp theo cấp mở khóa (10/30/50/70/90).
    const knRank = (id) => { const i = (G.KY_NGUYEN || []).indexOf(id); return i < 0 ? 99 : i; };
    return list.sort((a, b) => ngocRank(a) - ngocRank(b) || (ITEMS[a].kyNguyen && ITEMS[b].kyNguyen ? knRank(a) - knRank(b) : 0) || lv(a) - lv(b) || ITEMS[a].name.localeCompare(ITEMS[b].name, 'vi'));
  }
  // Giá ngọc không chịu giảm giá khách quen (chỉ giảm giá xu)
  function ngocPrice(def, qty = 1) { return def.priceNgoc * qty; }
  function ngocShopGroups(player, npcId) {
    const ids = ngocShopItems(player, npcId);
    return NGOC_GROUPS.map(([key, label]) => ({ key, label, ids: ids.filter(id => (ITEMS[id].ngocGroup || 'util') === key) })).filter(g => g.ids.length);
  }
  // Cửa hàng chỉ bán trong trần của Tân Đô đang đứng (cap = cấp trang bị cao nhất; thuốc và đá theo bậc làng), không xét cấp người chơi
  const TIER_OF = { nho: 1, vua: 2, lon: 3, dac: 4, than_thoai: 5, trung: 2, cao: 3 };
  function itemTier(id) {
    if (id === 'da_cuong_hoa') return 1;
    const m = /_(nho|vua|lon|dac|than_thoai|trung|cao)$/.exec(id);
    return m ? TIER_OF[m[1]] : 0;
  }
  const TIER_CAP_BY_VILLAGE = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 4, 6: 5, 7: 5 };
  function capByVillage(player, list) {
    const v = G.MAPS[player.map] && G.MAPS[player.map].village;
    if (!v) return list;
    return list.filter(id => {
      const d = ITEMS[id];
      if (d.slot) return (d.level || 1) <= v.cap;
      const t = itemTier(id);
      return !t || t <= TIER_CAP_BY_VILLAGE[v.n];
    });
  }
  function shopPrice(player, def, qty = 1) {
    return Math.max(1, Math.round(def.price * qty * (1 - (player.shopDiscount || 0))));
  }

  Object.assign(G, { shopItems, shopPrice, ngocShopItems, ngocPrice, ngocShopGroups, skillBookIds, bookFits, bookLine });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
