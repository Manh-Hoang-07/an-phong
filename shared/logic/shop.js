/*
 * Cửa hàng: danh sách hàng và giá.
 */
(function (G) {
  'use strict';
  const { ITEMS, NPCS, sideDone } = G;

  // Danh sách hàng bán của NPC, có món mở khóa qua phụ tuyến
  function shopItems(player, npcId) {
    const n = NPCS[npcId];
    if (!n || !n.shop) return [];
    const list = n.shop.slice();
    const add = (ids) => { for (const id of ids) if (ITEMS[id] && !list.includes(id)) list.push(id); };
    if (npcId === 'ba_thuoc' && sideDone(player, 'p5-2')) add(['thuoc_nhiem_do']);
    if (npcId === 'tap_hoa' && sideDone(player, 'p2-1')) add(['binh_mau_vua', 'binh_nl_vua']);
    if (npcId === 'tap_hoa' && sideDone(player, 'p2-2')) add(['kiem_thep', 'cung_hop_kim', 'truong_pha_le',
      'mu_thep', 'ao_thep', 'quan_thep', 'giay_thep', 'da_cuong_hoa_cao']);
    return list;
  }
  function shopPrice(player, def, qty = 1) {
    return Math.max(1, Math.round(def.price * qty * (1 - (player.shopDiscount || 0))));
  }

  Object.assign(G, { shopItems, shopPrice });
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
