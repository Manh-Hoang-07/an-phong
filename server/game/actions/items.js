'use strict';
/* Luật chơi phía server · Hành động: mua bán, mặc / tháo trang bị, dùng thuốc, nhặt đồ, kho. */
const G = require('../../../shared');
const { fail, fmt } = require('../util');
const { bagFree, slotsNeeded, addItem, addInst, instName, bagEntry, qualityColor, pruneLoot } = require('../inventory');
const { clampHpMp } = require('../progress');
const { onCurrentMapNpc } = require('../quests');

const lastPotion = new Map();

const actions = {
  buy(p, a, ev) {
    const npc = G.NPCS[a.npc];
    if (!npc || !npc.shop || !onCurrentMapNpc(p, a.npc)) fail('Cửa hàng không ở đây.');
    if (!G.shopItems(p, a.npc).includes(a.item)) fail('Cửa hàng không bán món này.');
    const def = G.ITEMS[a.item];
    const qty = Math.max(1, Math.min(99, Math.floor(Number(a.qty) || 1)));
    if (!def.stack && qty > 1) fail('Món này chỉ mua từng cái.');
    const cost = G.shopPrice(p, def, qty);
    if (p.gold < cost) fail('Không đủ xu.');
    if (bagFree(p) < slotsNeeded(p, a.item, qty)) fail('Túi đã đầy.');
    p.gold -= cost;
    addItem(p, a.item, qty, { shop: true });
    ev.push({ t: 'msg', text: `Đã mua ${def.name}${qty > 1 ? ' ×' + qty : ''} (-${fmt(cost)} xu).`, color: '#e0e0e0' });
  },

  sell(p, a, ev) {
    const e = bagEntry(p, a.uid);
    const def = G.ITEMS[e.id];
    if (def.kind === 'quest' || !def.price) fail('Không bán được vật phẩm này.');
    const shopHere = Object.values(G.MAPS[p.map].npcs).some(n => G.NPCS[n].shop);
    if (!shopHere) fail('Phải ở gần cửa hàng mới bán được.');
    const qty = Math.max(1, Math.min(e.qty, Math.floor(Number(a.qty) || e.qty)));
    const gain = G.sellPrice(e) * qty;
    e.qty -= qty;
    if (e.qty <= 0) p.bag.splice(p.bag.indexOf(e), 1);
    p.gold += gain;
    ev.push({ t: 'msg', text: `Đã bán ${def.name}${qty > 1 ? ' ×' + qty : ''} (+${fmt(gain)} xu).`, color: '#e0e0e0' });
  },

  equip(p, a, ev) {
    const e = bagEntry(p, a.uid);
    const def = G.ITEMS[e.id];
    if (!def.slot) fail('Không trang bị được.');
    if ((def.level || 1) > p.level) fail(`Cần đạt cấp ${def.level}.`);
    if (!G.canUseItem(p, def)) fail(`Chỉ class ${G.SCHOOLS[def.school].name} (hoặc Toàn Năng) dùng được.`);
    const old = p.equip[def.slot];
    p.bag.splice(p.bag.indexOf(e), 1);
    p.equip[def.slot] = { ...e, qty: 1 };
    if (old) p.bag.push({ ...old, qty: 1 });
    clampHpMp(p);
    ev.push({ t: 'msg', text: `Đã trang bị ${def.name}${e.plus ? ' +' + e.plus : ''}.`, color: '#e0e0e0' });
  },

  unequip(p, a, ev) {
    const it = p.equip[a.slot];
    if (!it) fail('Ô này đang trống.');
    if (bagFree(p) < 1) fail('Túi đã đầy.');
    p.equip[a.slot] = null;
    p.bag.push({ ...it, qty: 1 });
    clampHpMp(p);
  },

  use(p, a, ev, userId) {
    const e = p.bag.find(x => x.id === a.item);
    if (!e) fail('Hết ' + (G.ITEMS[a.item]?.name || 'vật phẩm') + '.');
    const def = G.ITEMS[e.id];
    if (def.kind === 'book') {
      e.qty--;
      if (e.qty <= 0) p.bag.splice(p.bag.indexOf(e), 1);
      p.skillPoints += 1;
      ev.push({ t: 'msg', text: '[Hệ thống] Đọc Sách kỹ năng: +1 điểm kỹ năng.', color: '#4fc3f7' });
      return;
    }
    if (def.kind === 'boost') {
      const now = Date.now();
      p.boosts = p.boosts || {};
      const left = G.boostLeft(p, def.boost, now);
      if (left + def.minutes * 60000 > G.BOOST_MAX_MS) fail('Đã cộng dồn tối đa 24 giờ, dùng tiếp khi bớt thời gian.');
      p.boosts[def.boost] = now + left + def.minutes * 60000;
      e.qty--;
      if (e.qty <= 0) p.bag.splice(p.bag.indexOf(e), 1);
      const total = Math.round((left + def.minutes * 60000) / 60000);
      ev.push({ t: 'msg', text: `[Hệ thống] ${def.name}: kinh nghiệm khi hạ quái x${def.mul} trong ${total} phút.`, color: '#ffd54f' });
      ev.push({ t: 'float', text: `Kinh nghiệm x${def.mul}!`, color: '#ffd54f' });
      return;
    }
    if (def.kind !== 'potion') fail('Không dùng được.');
    if ((def.level || 1) > p.level) fail(`Cần đạt cấp ${def.level}.`);
    const now = Date.now();
    if (now - (lastPotion.get(userId) || 0) < 400) fail('Từ từ thôi!');
    lastPotion.set(userId, now);
    const st = G.calcStats(p);
    const hp = Number.isFinite(a.hp) ? a.hp : p.hp ?? st.maxHp;
    const mp = Number.isFinite(a.mp) ? a.mp : p.mp ?? st.maxMp;
    const healHp = (def.hp || 0) + (def.hpPct ? Math.round(st.maxHp * def.hpPct) : 0);
    p.hp = Math.min(st.maxHp, Math.round(hp + healHp));
    p.mp = Math.min(st.maxMp, Math.round(mp + (def.mp || 0)));
    if (def.cleanse) ev.push({ t: 'cleanse' });
    e.qty--;
    if (e.qty <= 0) p.bag.splice(p.bag.indexOf(e), 1);
    ev.push({ t: 'heal', hp: healHp, mp: def.mp || 0 });
  },

  // Nhặt đồ trên đất
  pickup(p, a, ev) {
    pruneLoot(p);
    const l = p.loot.find(x => x.lid === Number(a.lid));
    if (!l || l.map !== p.map) fail('Món đồ đã biến mất.');
    if (!addInst(p, l.inst)) { ev.push({ t: 'bagfull' }); fail('Túi đã đầy! Về làng bán bớt hoặc gửi kho.'); }
    p.loot.splice(p.loot.indexOf(l), 1);
    const def = G.ITEMS[l.inst.id];
    ev.push({ t: 'picked', lid: l.lid });
    ev.push({ t: 'msg', text: `Nhặt được ${instName(l.inst)}${def.slot ? ` [${G.QUALITY_NAMES[l.inst.q]}]` : ''}.`, color: qualityColor(def.slot ? l.inst.q : 1) });
  },

  store(p, a) {
    if (!onCurrentMapNpc(p, 'thu_kho')) fail('Hãy đến gặp Thủ kho.');
    const e = bagEntry(p, a.uid);
    const def = G.ITEMS[e.id];
    if (def.stack) {
      const s = p.storage.find(x => x.id === e.id);
      if (s) s.qty += e.qty;
      else { if (p.storage.length >= G.STORAGE_SIZE) fail('Kho đã đầy.'); p.storage.push({ ...e }); }
    } else {
      if (p.storage.length >= G.STORAGE_SIZE) fail('Kho đã đầy.');
      p.storage.push({ ...e });
    }
    p.bag.splice(p.bag.indexOf(e), 1);
  },

  retrieve(p, a) {
    if (!onCurrentMapNpc(p, 'thu_kho')) fail('Hãy đến gặp Thủ kho.');
    const e = p.storage.find(x => x.uid === Number(a.uid));
    if (!e) fail('Không có trong kho.');
    if (bagFree(p) < slotsNeeded(p, e.id, e.qty)) fail('Túi đã đầy.');
    p.storage.splice(p.storage.indexOf(e), 1);
    if (G.ITEMS[e.id].stack) addItem(p, e.id, e.qty);
    else p.bag.push(e);
  },
};

module.exports = actions;
