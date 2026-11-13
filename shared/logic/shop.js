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
      add(['sach_mo_rong_thuong', 'sach_mo_rong_tuyet_ky', 'sach_tay_ky_nang']);
      add(Object.keys(ITEMS).filter(id => ITEMS[id].kind === 'pet_gear'));
      if (player.school) {
        const mine = G.availableSkills(player).filter(id => !G.SKILLS[id].ult).sort((a, b) => G.SKILLS[a].level - G.SKILLS[b].level);
        add(mine.map(G.skillBookId));
      }
    }
    return capByVillage(player, list);
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

  Object.assign(G, { shopItems, shopPrice });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
