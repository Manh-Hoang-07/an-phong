'use strict';
/* Luật chơi phía server · Hành động: mua bán, mặc / tháo trang bị, dùng thuốc, nhặt đồ, kho. */
const G = require('../../../shared');
const { fail, fmt } = require('../core/util');
const { bagFree, slotsNeeded, addItem, addInst, instName, bagEntry, qualityColor, pruneLoot } = require('../core/inventory');
const { clampHpMp, storageFor, setSchool, learnNewSkill } = require('../core/progress');
const { onCurrentMapNpc, roleHere } = require('../core/quests');

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

  // Lầu Trân Bảo: mua bằng Linh Ngọc. Kiểm túi TRƯỚC khi trừ ngọc.
  buy_ngoc(p, a, ev) {
    const npc = G.NPCS[a.npc];
    if (!npc || !npc.ngocShop || !onCurrentMapNpc(p, a.npc)) fail('Lầu Trân Bảo không ở đây.');
    if (!G.ngocShopItems(p, a.npc).includes(a.item)) fail('Lầu Trân Bảo không bán món này.');
    const def = G.ITEMS[a.item];
    const qty = Math.max(1, Math.min(99, Math.floor(Number(a.qty) || 1)));
    if (!def.stack && qty > 1) fail('Món này chỉ mua từng cái.');
    const cost = G.ngocPrice(def, qty);
    if ((p.linhNgoc || 0) < cost) fail('Không đủ Linh Ngọc.');
    if (bagFree(p) < slotsNeeded(p, a.item, qty)) fail('Túi đã đầy.');
    p.linhNgoc -= cost;
    addItem(p, a.item, qty, { shop: true });
    ev.push({ t: 'msg', text: `Đã mua ${def.name}${qty > 1 ? ' ×' + qty : ''} (-${fmt(cost)} Linh Ngọc).`, color: '#b388ff' });
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

  // Bỏ vật phẩm khỏi túi (ở đâu cũng được, mất luôn, không được xu). Vật phẩm nhiệm vụ không bỏ được để khỏi kẹt nhiệm vụ.
  drop(p, a, ev) {
    const e = bagEntry(p, a.uid);
    const def = G.ITEMS[e.id];
    if (def.kind === 'quest') fail('Không bỏ được vật phẩm nhiệm vụ.');
    const qty = Math.max(1, Math.min(e.qty, Math.floor(Number(a.qty) || e.qty)));
    e.qty -= qty;
    if (e.qty <= 0) p.bag.splice(p.bag.indexOf(e), 1);
    ev.push({ t: 'msg', text: `Đã bỏ ${def.name}${e.plus ? ' +' + e.plus : ''}${qty > 1 ? ' ×' + qty : ''}.`, color: '#e0e0e0' });
  },

  equip(p, a, ev) {
    const e = bagEntry(p, a.uid);
    const def = G.ITEMS[e.id];
    if (!def.slot) fail('Không trang bị được.');
    if ((def.level || 1) > p.level) fail(`Cần đạt cấp ${def.level}.`);
    if (!G.canUseItem(p, def)) {
      if (def.slot === 'weapon' && !p.school) fail('Chưa chọn class: chỉ dùng được vũ khí luyện tập.');
      if (def.slot === 'weapon') fail(`${G.WEAPON_TYPES[def.wtype]?.name || 'Vũ khí này'} chỉ dành cho ${G.weaponOwners(def.wtype).map(s => G.SCHOOLS[s].name).join(', ') || 'class khác'}. Class ${G.SCHOOLS[p.school].name} dùng ${G.WEAPON_TYPES[G.classWeapon(p.school)].name}.`);
      fail('Không trang bị được.');
    }
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
    if (def.kind === 'transform_book') {
      const id = def.transform;
      const awT = G.awakenTierOf(id);   // sách Biến Hình I–V → ấn 1–5
      if (awT) {
        // Mở lần lượt: đã có ấn này rồi, thiếu ấn trước, chưa đủ cấp hay chưa làm nhiệm vụ NPC ẩn thì chưa đọc được
        if ((p.awakenTier || 0) >= awT || (p.awakenTier || 0) < awT - 1 || p.level < G.AWAKENS[awT - 1].level || !p.advancement.done[id]) fail('Sách này chưa thể sử dụng.');
      }
      if (id === 'evolution') {
        // Đọc sách này là ĐỔI HẲN sang chức nghiệp 2: p.school thành id nhánh, không có đường quay lại.
        const evo = G.evolutionOf(p.school);
        if (!evo) fail('Class hiện tại không có chức nghiệp 2.');
        if (G.isEvolved(p.school)) fail('Bạn đã ở chức nghiệp 2 rồi.');
        if (p.level < 25 || !p.advancement.done.evolution) fail('Sách này chưa thể sử dụng với class/cấp hiện tại.');
        e.qty--;
        if (e.qty <= 0) p.bag.splice(p.bag.indexOf(e), 1);
        p.advancement.unlocked[evo] = true;   // dữ liệu cũ vẫn đọc được
        setSchool(p, evo, ev);   // setSchool tự báo "Tiến hóa thành ..."
        return;
      }
      p.awakenTier = awT;
      e.qty--;
      if (e.qty <= 0) p.bag.splice(p.bag.indexOf(e), 1);
      p.formChoice = id;
      const label = 'Biến Hình ' + ['I', 'II', 'III', 'IV', 'V'][awT - 1];
      ev.push({ t: 'msg', text: `[Hệ thống] Đã mở khóa ${label}. Bật/tắt bằng nút biến hình (⚡).`, color: '#ffd54f' });
      return;
    }
    if (def.kind === 'ult_book') {
      if (!p.school) fail('Hãy thức tỉnh class trước khi đọc Sách Tuyệt Kỹ.');
      // Sách riêng (def.skill) dạy đúng tuyệt kỹ ghi trên sách; sách chức nghiệp dạy tuyệt kỹ đặc trưng của class
      const id = def.skill || G.signatureUlt(p);
      const sk = id && G.SKILLS[id];
      if (!sk || !sk.ult) fail('Class hiện tại không có tuyệt kỹ tương ứng.');
      if (!G.ultFits(p, sk)) fail('Tuyệt kỹ này không phù hợp với class của bạn.');
      if (G.skillLevel(p, id)) fail('Bạn đã học tuyệt kỹ này rồi.');
      if (sk.level > p.level) fail(`Cần đạt cấp ${sk.level} để học ${sk.name}.`);
      if (G.usedSkillSlots(p, true) >= G.skillCap(p, true)) fail('Đã hết ô học tuyệt kỹ. Dùng Sách Mở Rộng Ô Tuyệt Kỹ hoặc Sách Tẩy Kỹ Năng.');
      e.qty--;
      if (e.qty <= 0) p.bag.splice(p.bag.indexOf(e), 1);
      learnNewSkill(p, id);
      ev.push({ t: 'msg', text: `[Hệ thống] Đọc Sách Tuyệt Kỹ: đã học ${sk.name}.`, color: '#ffd54f' });
      return;
    }
    if (def.kind === 'skill_book') {
      if (!p.school) fail('Hãy thức tỉnh class trước khi đọc Sách Kỹ Năng.');
      const id = def.skill, sk = G.SKILLS[id];
      if (!sk || sk.ult) fail('Sách này không hợp lệ.');
      if (!G.availableSkills(p).includes(id)) fail('Kỹ năng này không thuộc class của bạn.');
      if (G.skillLevel(p, id)) fail('Bạn đã học kỹ năng này rồi.');
      if (sk.level > p.level) fail(`Cần đạt cấp ${sk.level} để học ${sk.name}.`);
      if (G.usedSkillSlots(p, false) >= G.skillCap(p, false)) fail('Đã hết ô học kỹ năng thường. Dùng Sách Mở Rộng Ô Kỹ Năng hoặc Sách Tẩy Kỹ Năng.');
      e.qty--;
      if (e.qty <= 0) p.bag.splice(p.bag.indexOf(e), 1);
      learnNewSkill(p, id);
      ev.push({ t: 'msg', text: `[Hệ thống] Đọc Sách Kỹ Năng: đã học ${sk.name}.`, color: '#4fc3f7' });
      return;
    }
    if (def.kind === 'slot_book') {
      const key = def.ult ? 'ult' : 'normal';
      p.skillExpand = p.skillExpand || { normal: 0, ult: 0 };
      if ((p.skillExpand[key] || 0) >= G.SKILL_EXPAND_MAX) fail(`Ô học ${def.ult ? 'tuyệt kỹ' : 'kỹ năng thường'} đã mở rộng tối đa (+${G.SKILL_EXPAND_MAX}).`);
      e.qty--;
      if (e.qty <= 0) p.bag.splice(p.bag.indexOf(e), 1);
      p.skillExpand[key] = (p.skillExpand[key] || 0) + 1;
      ev.push({ t: 'msg', text: `[Hệ thống] Đã mở thêm 1 ô học ${def.ult ? 'tuyệt kỹ' : 'kỹ năng thường'} (${G.skillCap(p, !!def.ult)} ô).`, color: '#ffd54f' });
      return;
    }
    if (def.kind === 'erase_book') fail('Đọc sách trong Túi đồ rồi chọn kỹ năng muốn xóa.');
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
    const st = G.calcStats(p, { form: !!p.formActive });
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

  // Kho riêng từng làng: chỉ gửi / lấy được ở kho của làng đang đứng
  store(p, a) {
    if (!roleHere(p, 'storage')) fail('Hãy đến gặp Quản kho của làng.');
    const kho = storageFor(p, p.map);
    const e = bagEntry(p, a.uid);
    const def = G.ITEMS[e.id];
    if (def.stack) {
      const s = kho.find(x => x.id === e.id);
      if (s) s.qty += e.qty;
      else { if (kho.length >= G.STORAGE_SIZE) fail('Kho của làng này đã đầy.'); kho.push({ ...e }); }
    } else {
      if (kho.length >= G.STORAGE_SIZE) fail('Kho của làng này đã đầy.');
      kho.push({ ...e });
    }
    p.bag.splice(p.bag.indexOf(e), 1);
  },

  retrieve(p, a) {
    if (!roleHere(p, 'storage')) fail('Hãy đến gặp Quản kho của làng.');
    const kho = storageFor(p, p.map);
    const e = kho.find(x => x.uid === Number(a.uid));
    if (!e) fail('Không có trong kho của làng này.');
    if (bagFree(p) < slotsNeeded(p, e.id, e.qty)) fail('Túi đã đầy.');
    kho.splice(kho.indexOf(e), 1);
    if (G.ITEMS[e.id].stack) addItem(p, e.id, e.qty);
    else p.bag.push(e);
  },
};

module.exports = actions;
