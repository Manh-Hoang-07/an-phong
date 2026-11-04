'use strict';
/*
 * Luật chơi phía server. Mọi thứ liên quan tới tiền, vật phẩm, kinh nghiệm,
 * nhiệm vụ và nâng cấp đều do server quyết định rồi lưu ngay vào SQLite.
 */
const G = require('../shared/data');
const codes = require('./codes');

class GameError extends Error {}
const fail = (msg) => { throw new GameError(msg); };

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const fmt = (n) => Number(n).toLocaleString('vi-VN');

// ------------------------------------------------------------ Túi đồ
function bagFree(p) { return G.BAG_SIZE - p.bag.length; }

function countItem(p, id) {
  return p.bag.filter(e => e.id === id).reduce((s, e) => s + e.qty, 0);
}

function slotsNeeded(p, id, qty) {
  const def = G.ITEMS[id];
  if (def.stack) return p.bag.some(e => e.id === id) ? 0 : 1;
  return qty;
}

// Thêm vật phẩm mới vào túi. Trang bị được tạo theo opts (mặc định: đồ chuẩn như cửa hàng)
function addItem(p, id, qty = 1, opts = { plain: true }) {
  const def = G.ITEMS[id];
  if (!def) return false;
  if (def.stack) {
    const e = p.bag.find(x => x.id === id);
    if (e) { e.qty += qty; return true; }
    if (bagFree(p) < 1) return false;
    p.bag.push({ uid: p.nextUid++, id, qty, plus: 0 });
    return true;
  }
  if (bagFree(p) < qty) return false;
  for (let i = 0; i < qty; i++) p.bag.push({ uid: p.nextUid++, ...G.makeInst(id, opts) });
  return true;
}

// Thêm một món đã có sẵn chỉ số (ví dụ nhặt từ đất)
function addInst(p, inst) {
  const def = G.ITEMS[inst.id];
  if (def.stack) return addItem(p, inst.id, inst.qty);
  if (bagFree(p) < 1) return false;
  p.bag.push({ ...inst, uid: p.nextUid++, qty: 1 });
  return true;
}

function instName(inst) {
  const def = G.ITEMS[inst.id];
  return def.name + (inst.plus ? ' +' + inst.plus : '') + (inst.qty > 1 ? ' ×' + inst.qty : '');
}

function removeItem(p, id, qty) {
  let left = qty;
  for (let i = p.bag.length - 1; i >= 0 && left > 0; i--) {
    const e = p.bag[i];
    if (e.id !== id) continue;
    const take = Math.min(e.qty, left);
    e.qty -= take; left -= take;
    if (e.qty <= 0) p.bag.splice(i, 1);
  }
  return left === 0;
}

function bagEntry(p, uid) {
  const e = p.bag.find(x => x.uid === Number(uid));
  if (!e) fail('Không tìm thấy vật phẩm trong túi.');
  return e;
}

// ------------------------------------------------------------ Kinh nghiệm
function gainExp(p, amount, ev) {
  if (p.level >= G.MAX_LEVEL) return;
  p.exp += amount;
  ev.push({ t: 'float', text: `+${fmt(amount)} kinh nghiệm`, color: '#b388ff' });
  while (p.level < G.MAX_LEVEL && p.exp >= G.expToNext(p.level)) {
    p.exp -= G.expToNext(p.level);
    p.level++;
    p.freePoints += G.STAT_POINTS_PER_LEVEL;
    p.skillPoints = (p.skillPoints || 0) + 1;
    const st = G.calcStats(p);
    p.hp = st.maxHp; p.mp = st.maxMp;
    ev.push({ t: 'levelup', level: p.level });
    ev.push({ t: 'msg', text: `[Hệ thống] Thăng cấp! Đạt cấp ${p.level}: +${G.STAT_POINTS_PER_LEVEL} điểm tiềm năng, +1 điểm kỹ năng.`, color: '#ffd54f' });
    const newSkills = G.availableSkills(p).filter(id => G.SKILLS[id].level === p.level);
    for (const id of newSkills) ev.push({ t: 'msg', text: `Có thể học kỹ năng mới: ${G.SKILLS[id].name} (phím K).`, color: '#4fc3f7' });
  }
  if (p.level >= G.MAX_LEVEL) p.exp = 0;
}

function gainGold(p, amount, ev) {
  if (amount <= 0) return;
  p.gold += amount;
  ev.push({ t: 'float', text: `+${fmt(amount)} xu`, color: '#ffd54f' });
}

function giveItem(p, id, qty, ev, opts) {
  if (addItem(p, id, qty, opts)) {
    const def = G.ITEMS[id];
    const last = p.bag[p.bag.length - 1];
    ev.push({ t: 'msg', text: `Nhận được ${def.name}${qty > 1 ? ' ×' + qty : ''}.`, color: qualityColor(def.slot ? last.q : 1) });
    return true;
  }
  ev.push({ t: 'msg', text: `Túi đã đầy, không nhận được ${G.ITEMS[id].name}!`, color: '#ef5350' });
  return false;
}

function qualityColor(q) {
  return q === 4 ? '#ffca28' : q === 3 ? '#ce93d8' : q === 2 ? '#64b5f6' : '#e0e0e0';
}

// ------------------------------------------------------------ Đồ rơi trên đất
const LOOT_TTL = 3 * 60 * 1000;
const LOOT_MAX = 50;
function pruneLoot(p) {
  const now = Date.now();
  p.loot = (p.loot || []).filter(l => l.until > now).slice(-LOOT_MAX);
}
function dropLoot(p, inst, x, y, ev) {
  pruneLoot(p);
  const l = { lid: p.nextUid++, map: p.map, x, y, inst, until: Date.now() + LOOT_TTL };
  p.loot.push(l);
  ev.push({ t: 'loot', loot: l });
}

// ------------------------------------------------------------ Nhiệm vụ
function currentQuest(p) { return G.QUESTS[p.quest.step] || null; }

function questComplete(p) {
  const q = currentQuest(p);
  if (!q || p.quest.state !== 'active') return false;
  const o = q.obj;
  const pr = p.quest.progress;
  if (o.kill) for (const m in o.kill) if ((pr.kill?.[m] || 0) < o.kill[m]) return false;
  if (o.collect) for (const it in o.collect) if (countItem(p, it) < o.collect[it]) return false;
  if (o.visit) for (const n of o.visit) if (!pr.visit?.[n]) return false;
  if (o.level && p.level < o.level) return false;
  if (o.school && !p.school) return false;
  return true;
}

function questActive(p, id) {
  const q = currentQuest(p);
  return q && q.id === id && p.quest.state === 'active';
}

// ------------------------------------------------------------ Hành động
const lastKill = new Map(); // userId -> {t, boss:{monster:time}}
const lastPotion = new Map();

function onCurrentMapNpc(p, npc) {
  return G.npcHere(p, p.map, npc);
}

const actions = {
  // Tự lưu định kỳ: vị trí, máu, năng lượng
  save(p, a) {
    if (a.map !== p.map) return;
    const st = G.calcStats(p);
    if (Number.isFinite(a.x)) p.x = Math.round(a.x);
    if (Number.isFinite(a.y)) p.y = Math.round(a.y);
    if (Number.isFinite(a.hp)) p.hp = Math.max(1, Math.min(st.maxHp, Math.round(a.hp)));
    if (Number.isFinite(a.mp)) p.mp = Math.max(0, Math.min(st.maxMp, Math.round(a.mp)));
  },

  change_map(p, a, ev) {
    const m = G.MAPS[p.map];
    const portal = m.portals[a.portal];
    if (!portal) fail('Không có cổng này.');
    const target = G.MAPS[portal.to];
    if (portal.require && !G.questDone(p, portal.require)) fail('Lối ra chưa mở. Hoàn thành nhiệm vụ của Hệ thống trước.');
    if (target.require && !G.questDone(p, target.require)) {
      const q = G.QUESTS.find(x => x.id === target.require);
      fail(`Chưa thể vào ${target.name}. Cần hoàn thành nhiệm vụ "${q.name}".`);
    }
    if (Number.isFinite(a.hp)) actions.save(p, { map: p.map, hp: a.hp, mp: a.mp });
    p.map = portal.to;
    p.x = null; p.y = null;
    p.arrive = portal.at;
    ev.push({ t: 'map', map: p.map });
  },

  kill(p, a, ev, userId) {
    actions.kills(p, { list: [a] }, ev, userId);
  },

  // Hạ nhiều quái cùng lúc (đánh lan) gửi gộp một lần cho nhanh
  kills(p, a, ev, userId) {
    const list = Array.isArray(a.list) ? a.list.slice(0, 15) : [];
    if (!list.length) fail('Không có quái.');
    const now = Date.now();
    const lk = lastKill.get(userId) || { t: 0, boss: {} };
    if (now - lk.t < 90) fail('Quá nhanh.');
    lk.t = now;
    lastKill.set(userId, lk);
    for (const k of list) killOne(p, k, ev, lk, now);
  },
};

function killOne(p, a, ev, lk, now) {
  {
    const m = G.MAPS[p.map];
    const mon = G.MONSTERS[a.monster];
    if (!mon || !Object.values(m.spawns).includes(a.monster)) return;
    if (mon.boss && lk.boss[a.monster] && now - lk.boss[a.monster] < mon.respawn * 900) return;
    if (mon.boss) lk.boss[a.monster] = now;

    p.kills[a.monster] = (p.kills[a.monster] || 0) + 1;
    // Quái thấp hơn mình 5 cấp trở lên cho ít kinh nghiệm
    const diff = p.level - mon.level;
    const expMul = diff >= 8 ? 0.1 : diff >= 5 ? 0.4 : 1;
    const st = G.calcStats(p);
    gainExp(p, Math.max(1, Math.round(mon.exp * expMul * (1 + st.expfind / 100))), ev);
    gainGold(p, Math.round(rand(mon.gold[0], mon.gold[1]) * (1 + st.goldfind / 100)), ev);

    // Đồ rơi ra đất ở chỗ quái chết, người chơi đi qua để nhặt
    const x = Number.isFinite(a.x) ? Math.round(a.x) : p.x || 0;
    const y = Number.isFinite(a.y) ? Math.round(a.y) : p.y || 0;
    let n = 0;
    const spot = () => x + (n++ % 2 ? 1 : -1) * Math.ceil(n / 2) * 22;
    for (const [item, chance, onlyQuest] of mon.drops) {
      if (onlyQuest && !questActive(p, onlyQuest)) continue;
      if (onlyQuest) {
        const need = currentQuest(p).obj.collect?.[item] || 0;
        const onGround = (p.loot || []).filter(l => l.inst.id === item).length;
        if (countItem(p, item) + onGround >= need) continue;
      }
      if (Math.random() < chance) dropLoot(p, { id: item, qty: 1, plus: 0 }, spot(), y, ev);
    }
    if (mon.gear) {
      const [chance, list, extra] = mon.gear;
      const table = mon.boss ? 'boss' : 'normal';
      const drops = (Math.random() < chance ? 1 : 0) + (extra && Math.random() < extra ? 1 : 0);
      for (let i = 0; i < drops; i++) {
        const id = list[Math.floor(Math.random() * list.length)];
        dropLoot(p, G.makeInst(id, { table }), spot(), y, ev);
      }
    }

    if (questActive(p, currentQuest(p)?.id)) {
      const q = currentQuest(p);
      if (q.obj.kill && q.obj.kill[a.monster]) {
        const pr = p.quest.progress;
        pr.kill = pr.kill || {};
        const cur = pr.kill[a.monster] || 0;
        if (cur < q.obj.kill[a.monster]) {
          pr.kill[a.monster] = cur + 1;
          ev.push({ t: 'msg', text: `${q.name}: ${mon.name} ${cur + 1}/${q.obj.kill[a.monster]}`, color: '#a5d6a7' });
        }
      }
    }
    ensureDaily(p);
    for (const d of p.daily.list) {
      if (d.claimed || d.type === 'collect' || d.target !== a.monster || d.have >= d.need) continue;
      d.have++;
      if (d.have === d.need) ev.push({ t: 'msg', text: `Nhiệm vụ ngày xong: hạ ${d.need} ${mon.name}. Về Bảng nhiệm vụ nhận thưởng.`, color: '#ffd54f' });
    }
    const col = p.daily.list.find(d => d.type === 'collect' && !d.claimed);
    if (col && !mon.passive && p.map !== 'lang' && p.map !== 'cong_do') {
      const onGround = (p.loot || []).filter(l => l.inst.id === col.target).length;
      if (countItem(p, col.target) + onGround < col.need && Math.random() < 0.35) dropLoot(p, { id: col.target, qty: 1, plus: 0 }, spot(), y, ev);
    }
    if (mon.boss) ev.push({ t: 'msg', text: `Bạn đã hạ ${mon.name}!`, color: '#ffab40' });
    if (questComplete(p)) ev.push({ t: 'msg', text: 'Nhiệm vụ đã hoàn thành, quay về gặp Hội trưởng Khải.', color: '#ffd54f' });
  }
}

Object.assign(actions, {
  talk(p, a, ev) {
    if (!onCurrentMapNpc(p, a.npc)) fail('NPC không ở đây.');
    const q = currentQuest(p);
    if (q && p.quest.state === 'active' && q.obj.visit && q.obj.visit.includes(a.npc)) {
      const pr = p.quest.progress;
      pr.visit = pr.visit || {};
      if (!pr.visit[a.npc]) {
        pr.visit[a.npc] = true;
        ev.push({ t: 'msg', text: `${q.name}: đã gặp ${G.NPCS[a.npc].name}.`, color: '#a5d6a7' });
        if (questComplete(p)) ev.push({ t: 'msg', text: 'Nhiệm vụ đã hoàn thành, quay về gặp Hội trưởng Khải.', color: '#ffd54f' });
      }
    }
  },

  quest_accept(p, a, ev) {
    const q = currentQuest(p);
    if (!q) fail('Bạn đã làm hết nhiệm vụ hiện có.');
    if (!onCurrentMapNpc(p, q.npc)) fail('Hãy đến gặp người giao nhiệm vụ.');
    if (p.quest.state !== 'none') fail('Bạn đang làm nhiệm vụ này rồi.');
    p.quest.state = 'active';
    p.quest.progress = {};
    ev.push({ t: 'msg', text: `Nhận nhiệm vụ: ${q.name}`, color: '#ffd54f' });
  },

  quest_complete(p, a, ev) {
    const q = currentQuest(p);
    if (!q) fail('Không có nhiệm vụ.');
    if (!onCurrentMapNpc(p, q.npc)) fail('Hãy đến gặp người giao nhiệm vụ.');
    if (!questComplete(p)) fail('Nhiệm vụ chưa xong.');
    const r = q.reward;
    let items = r.items.slice();
    if (r.schoolWeapon) {
      const map = { kiem_si: ['kiem_sat'], cung_thu: ['cung_go'], phap_su: ['truong_go'],
        toan_nang: ['kiem_sat', 'cung_go', 'truong_go'] };
      items = items.concat((map[p.school] || []).map(id => [id, 1]));
    }
    const need = items.reduce((s, [id, n]) => s + slotsNeeded(p, id, n), 0);
    if (bagFree(p) < need) fail(`Túi cần trống ít nhất ${need} ô để nhận thưởng.`);
    if (q.obj.collect) for (const it in q.obj.collect) removeItem(p, it, q.obj.collect[it]);
    p.quest.step++;
    p.quest.state = 'none';
    p.quest.progress = {};
    ev.push({ t: 'msg', text: `Hoàn thành nhiệm vụ: ${q.name}`, color: '#ffd54f' });
    gainExp(p, r.exp, ev);
    gainGold(p, r.gold, ev);
    if (r.skillPoints) {
      p.skillPoints += r.skillPoints;
      ev.push({ t: 'msg', text: `[Hệ thống] Nhận ${r.skillPoints} điểm kỹ năng.`, color: '#4fc3f7' });
    }
    for (const [id, n] of items) giveItem(p, id, n, ev);
  },

  choose_school(p, a, ev) {
    if (p.school) fail('Bạn đã thức tỉnh class rồi.');
    if (p.level < 5) fail('Cần đạt cấp 5.');
    if (!questActive(p, 'q6')) fail('Hãy nhận nhiệm vụ "Thức tỉnh lần hai" từ Hội trưởng Khải.');
    const sc = G.SCHOOLS[a.school];
    if (!sc) fail('Class không hợp lệ.');
    if (sc.special && !p.unlocks[a.school]) fail('Class này chỉ thức tỉnh được bằng mật mã.');
    setSchool(p, a.school, ev);
  },

  buy(p, a, ev) {
    const npc = G.NPCS[a.npc];
    if (!npc || !npc.shop || !onCurrentMapNpc(p, a.npc)) fail('Cửa hàng không ở đây.');
    if (!npc.shop.includes(a.item)) fail('Cửa hàng không bán món này.');
    const def = G.ITEMS[a.item];
    const qty = Math.max(1, Math.min(99, Math.floor(Number(a.qty) || 1)));
    if (!def.stack && qty > 1) fail('Món này chỉ mua từng cái.');
    const cost = def.price * qty;
    if (p.gold < cost) fail('Không đủ xu.');
    if (bagFree(p) < slotsNeeded(p, a.item, qty)) fail('Túi đã đầy.');
    p.gold -= cost;
    addItem(p, a.item, qty);
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
    if (def.kind !== 'potion') fail('Không dùng được.');
    if ((def.level || 1) > p.level) fail(`Cần đạt cấp ${def.level}.`);
    const now = Date.now();
    if (now - (lastPotion.get(userId) || 0) < 400) fail('Từ từ thôi!');
    lastPotion.set(userId, now);
    const st = G.calcStats(p);
    const hp = Number.isFinite(a.hp) ? a.hp : p.hp ?? st.maxHp;
    const mp = Number.isFinite(a.mp) ? a.mp : p.mp ?? st.maxMp;
    p.hp = Math.min(st.maxHp, Math.round(hp + (def.hp || 0)));
    p.mp = Math.min(st.maxMp, Math.round(mp + (def.mp || 0)));
    e.qty--;
    if (e.qty <= 0) p.bag.splice(p.bag.indexOf(e), 1);
    ev.push({ t: 'heal', hp: def.hp || 0, mp: def.mp || 0 });
  },

  upgrade(p, a, ev) {
    if (!onCurrentMapNpc(p, 'tho_ren')) fail('Hãy đến gặp Thợ rèn.');
    let target;
    if (a.slot) target = p.equip[a.slot];
    else target = bagEntry(p, a.uid);
    if (!target) fail('Không có trang bị.');
    const def = G.ITEMS[target.id];
    if (!def.slot) fail('Chỉ nâng cấp được trang bị.');
    const plus = target.plus || 0;
    if (plus >= G.UPGRADE_MAX) fail(`Đã đạt tối đa +${G.UPGRADE_MAX}.`);
    const cost = G.upgradeCost(plus);
    if (p.gold < cost.gold) fail('Không đủ xu.');
    if (countItem(p, 'da_cuong_hoa') < cost.stones) fail(`Cần ${cost.stones} Đá cường hóa.`);
    p.gold -= cost.gold;
    removeItem(p, 'da_cuong_hoa', cost.stones);
    if (Math.random() < G.UPGRADE_RATES[plus]) {
      target.plus = plus + 1;
      ev.push({ t: 'upgrade', ok: true, plus: target.plus });
      ev.push({ t: 'msg', text: `Nâng cấp thành công! ${def.name} +${target.plus}`, color: '#69f0ae' });
    } else if (G.upgradeFailDrops(plus)) {
      target.plus = Math.max(0, plus - 1);
      ev.push({ t: 'upgrade', ok: false, plus: target.plus });
      ev.push({ t: 'msg', text: `Thất bại! ${def.name} bị giảm còn +${target.plus}.`, color: '#ef5350' });
    } else {
      ev.push({ t: 'upgrade', ok: false, plus });
      ev.push({ t: 'msg', text: `Thất bại! ${def.name} vẫn giữ +${plus}.`, color: '#ef5350' });
    }
    clampHpMp(p);
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

  // Tẩy luyện: gieo lại toàn bộ dòng phụ (giữ nguyên số dòng)
  reforge(p, a, ev) {
    if (!onCurrentMapNpc(p, 'tho_ren')) fail('Hãy đến gặp Thợ rèn.');
    const target = a.slot ? p.equip[a.slot] : bagEntry(p, a.uid);
    if (!target) fail('Không có trang bị.');
    const def = G.ITEMS[target.id];
    if (!def.slot) fail('Chỉ tẩy luyện được trang bị.');
    G.normalizeInst(target);
    if (target.q < 2) fail('Đồ thường không có dòng phụ để tẩy luyện.');
    const cost = reforgeCost(target);
    if (p.gold < cost.gold) fail('Không đủ xu.');
    if (countItem(p, 'da_cuong_hoa') < cost.stones) fail(`Cần ${cost.stones} Đá cường hóa.`);
    p.gold -= cost.gold;
    removeItem(p, 'da_cuong_hoa', cost.stones);
    target.aff = G.rollAffixes(def, target.q, target.aff.length || G.QUALITY_AFFIX[target.q]);
    clampHpMp(p);
    ev.push({ t: 'msg', text: `Tẩy luyện xong ${def.name}: ${target.aff.map(([k, v]) => `${G.statLabel(k)} +${v}${G.statUnit(k)}`).join(', ')}`, color: '#ce93d8' });
  },

  // Phân rã: đổi đồ không dùng lấy đá cường hóa
  salvage(p, a, ev) {
    if (!onCurrentMapNpc(p, 'tho_ren')) fail('Hãy đến gặp Thợ rèn.');
    const e = bagEntry(p, a.uid);
    const def = G.ITEMS[e.id];
    if (!def.slot) fail('Chỉ phân rã được trang bị.');
    G.normalizeInst(e);
    const stones = salvageStones(e);
    p.bag.splice(p.bag.indexOf(e), 1);
    if (stones > 0) addItem(p, 'da_cuong_hoa', stones);
    ev.push({ t: 'msg', text: `Phân rã ${def.name}${stones ? `, nhận ${stones} Đá cường hóa` : ', không thu được gì'}.`, color: '#e0e0e0' });
  },

  add_stat(p, a) {
    const n = Math.max(1, Math.min(p.freePoints, Math.floor(Number(a.n) || 1)));
    if (!['str', 'vit', 'agi', 'spi'].includes(a.stat)) fail('Chỉ số không hợp lệ.');
    if (p.freePoints < 1) fail('Không còn điểm tiềm năng.');
    p.points[a.stat] += n;
    p.freePoints -= n;
  },

  set_skill(p, a) {
    const slot = Number(a.slot);
    if (!Number.isInteger(slot) || slot < 0 || slot >= G.SKILL_SLOTS) fail('Ô kỹ năng không hợp lệ.');
    if (slot === G.EXTRA_SLOT && p.school !== 'toan_nang') fail('Ô này chỉ dành cho Toàn Năng.');
    if (!a.skill) { p.skillSlots[slot] = null; return; }
    const sk = G.SKILLS[a.skill];
    if (!sk || !G.availableSkills(p).includes(a.skill)) fail('Kỹ năng không thuộc class của bạn.');
    if (!G.skillLevel(p, a.skill)) fail('Hãy học kỹ năng này trước.');
    if (sk.ult && slot !== G.ULT_SLOT) fail('Tuyệt kỹ chỉ đặt được ở ô tuyệt kỹ.');
    if (!sk.ult && slot === G.ULT_SLOT) fail('Ô tuyệt kỹ chỉ dành cho tuyệt kỹ.');
    const other = p.skillSlots.indexOf(a.skill);
    if (other >= 0) p.skillSlots[other] = null;
    p.skillSlots[slot] = a.skill;
  },

  daily_claim(p, a, ev) {
    if (!onCurrentMapNpc(p, 'bang_nv')) fail('Hãy đến Bảng nhiệm vụ của Hiệp Hội.');
    ensureDaily(p);
    const d = p.daily.list[Number(a.i)];
    if (!d) fail('Không có nhiệm vụ này.');
    if (d.claimed) fail('Đã nhận thưởng rồi.');
    if (!dailyDone(p, d)) fail('Nhiệm vụ chưa xong.');
    if (bagFree(p) < 1 && !p.bag.some(e => e.id === 'da_cuong_hoa')) fail('Túi đã đầy.');
    if (d.type === 'collect') removeItem(p, d.target, d.need);
    d.claimed = true;
    const r = G.dailyReward(p.level);
    const mul = d.type === 'boss' ? 2 : 1;
    ev.push({ t: 'msg', text: 'Hoàn thành nhiệm vụ ngày.', color: '#ffd54f' });
    gainExp(p, r.exp * mul, ev);
    gainGold(p, r.gold * mul, ev);
    giveItem(p, 'da_cuong_hoa', r.stones * mul, ev);
  },

  daily_bonus(p, a, ev) {
    if (!onCurrentMapNpc(p, 'bang_nv')) fail('Hãy đến Bảng nhiệm vụ của Hiệp Hội.');
    ensureDaily(p);
    if (!p.daily.list.length || !p.daily.list.every(d => d.claimed)) fail('Hãy hoàn thành cả 3 nhiệm vụ ngày.');
    if (p.daily.bonus) fail('Hôm nay bạn đã nhận thưởng thêm rồi.');
    const b = G.DAILY_BONUS;
    const need = 1 + b.items.length;
    if (bagFree(p) < need) fail(`Túi cần trống ít nhất ${need} ô.`);
    p.daily.bonus = true;
    ev.push({ t: 'msg', text: '[Hệ thống] Hoàn thành toàn bộ nhiệm vụ ngày!', color: '#ffd54f' });
    giveItem(p, 'da_cuong_hoa', b.stones, ev);
    for (const [id, n] of b.items) giveItem(p, id, n, ev);
  },

  // Học hoặc nâng cấp kỹ năng bằng điểm kỹ năng
  learn_skill(p, a, ev) {
    const sk = G.SKILLS[a.skill];
    if (!sk || !G.availableSkills(p).includes(a.skill)) fail('Kỹ năng không thuộc class của bạn.');
    if (sk.level > p.level) fail(`Cần đạt cấp ${sk.level}.`);
    const lv = G.skillLevel(p, a.skill);
    if (lv >= G.SKILL_MAX) fail('Kỹ năng đã đạt cấp tối đa.');
    if (p.skillPoints < 1) fail('Không còn điểm kỹ năng.');
    p.skillPoints -= 1;
    p.skills[a.skill] = lv + 1;
    if (lv === 0) {
      // Học lần đầu thì tự đặt vào ô trống
      const slots = sk.ult ? [G.ULT_SLOT] : [0, 1, 2, 3].concat(p.school === 'toan_nang' ? [G.EXTRA_SLOT] : []);
      const free = slots.find(i => !p.skillSlots[i]);
      if (free !== undefined) p.skillSlots[free] = a.skill;
      ev.push({ t: 'msg', text: `Đã học ${sk.name}.`, color: '#4fc3f7' });
    } else {
      const milestone = (lv + 1 === 5 && sk.t5) || (lv + 1 === 10 && sk.t10);
      ev.push({ t: 'msg', text: `${sk.name} lên cấp ${lv + 1}.${milestone ? ' Mở hiệu ứng: ' + milestone : ''}`, color: '#4fc3f7' });
    }
  },

  // Tẩy điểm kỹ năng ở Hội trưởng
  reset_skills(p, a, ev) {
    if (!onCurrentMapNpc(p, 'lao_su')) fail('Hãy đến gặp Hội trưởng Khải.');
    const spent = Object.values(p.skills).reduce((x, y) => x + y, 0);
    if (!spent) fail('Bạn chưa cộng điểm kỹ năng nào.');
    const cost = resetCost(p);
    if (p.gold < cost) fail('Không đủ xu.');
    p.gold -= cost;
    p.skillPoints += spent;
    p.skills = {};
    p.skillSlots = Array(G.SKILL_SLOTS).fill(null);
    ev.push({ t: 'msg', text: `Đã tẩy điểm kỹ năng, nhận lại ${spent} điểm (-${fmt(cost)} xu).`, color: '#ffd54f' });
  },

  // Nhập mật mã ở Lữ khách bí ẩn
  redeem(p, a, ev, userId) {
    if (!onCurrentMapNpc(p, 'lu_khach')) fail('Hãy đến gặp Lữ khách bí ẩn.');
    const now = Date.now();
    const tr = redeemTries.get(userId) || { start: now, n: 0 };
    if (now - tr.start > 10 * 60 * 1000) { tr.start = now; tr.n = 0; }
    if (tr.n >= 8) fail('Sai quá nhiều lần, thử lại sau 10 phút.');
    const c = codes.find(a.code);
    if (!c) { tr.n++; redeemTries.set(userId, tr); fail('Mật mã không đúng.'); }
    const key = codes.normalize(c.code);
    if (p.redeemed.includes(key)) fail('Bạn đã dùng mật mã này rồi.');
    const r = c.rewards || {};
    const items = Array.isArray(r.items) ? r.items.filter(([id]) => G.ITEMS[id]) : [];
    const need = items.reduce((s2, [id, n]) => s2 + slotsNeeded(p, id, n), 0);
    if (bagFree(p) < need) fail(`Túi cần trống ít nhất ${need} ô.`);
    p.redeemed.push(key);
    ev.push({ t: 'msg', text: '[Hệ thống] Mật mã hợp lệ.', color: '#ffd54f' });
    if (r.unlockClass && G.SCHOOLS[r.unlockClass]) {
      p.unlocks[r.unlockClass] = true;
      ev.push({ t: 'unlock', school: r.unlockClass });
      ev.push({ t: 'msg', text: `[Hệ thống] Đã mở khóa class đặc biệt: ${G.SCHOOLS[r.unlockClass].name}.`, color: '#ffc94a' });
    }
    if (r.gold) gainGold(p, Math.max(0, Math.floor(r.gold)), ev);
    if (r.skillPoints) p.skillPoints += Math.max(0, Math.floor(r.skillPoints));
    for (const [id, n] of items) giveItem(p, id, Math.max(1, Math.floor(n)), ev);
  },

  // Thức tỉnh class đặc biệt ở Lữ khách bí ẩn (đổi được cả khi đã có class khác)
  awaken_special(p, a, ev) {
    if (!onCurrentMapNpc(p, 'lu_khach')) fail('Hãy đến gặp Lữ khách bí ẩn.');
    const sc = G.SCHOOLS[a.school];
    if (!sc || !sc.special || !p.unlocks[a.school]) fail('Bạn chưa mở khóa class này.');
    if (p.school === a.school) fail('Bạn đã là ' + sc.name + ' rồi.');
    if (p.level < 5) fail('Cần đạt cấp 5.');
    setSchool(p, a.school, ev);
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

  die(p, a, ev) {
    const lose = Math.floor(G.expToNext(p.level) * 0.05);
    p.exp = Math.max(0, p.exp - lose);
    const st = G.calcStats(p);
    p.hp = Math.round(st.maxHp * 0.5);
    p.mp = Math.round(st.maxMp * 0.5);
    p.map = G.START_MAP; p.x = null; p.y = null; p.arrive = 'S';
    ev.push({ t: 'msg', text: `Bạn đã bị đánh bại, mất ${fmt(lose)} kinh nghiệm. Hồi sinh ở làng.`, color: '#ef5350' });
    ev.push({ t: 'map', map: p.map });
  },
});

// Đặt class: trả lại toàn bộ điểm kỹ năng đã cộng, xóa ô kỹ năng
function setSchool(p, school, ev) {
  const spent = Object.values(p.skills || {}).reduce((x, y) => x + y, 0);
  p.skillPoints += spent;
  p.skills = {};
  p.skillSlots = Array(G.SKILL_SLOTS).fill(null);
  p.school = school;
  const st = G.calcStats(p);
  p.hp = st.maxHp; p.mp = st.maxMp;
  ev.push({ t: 'msg', text: `[Hệ thống] Thức tỉnh class ${G.SCHOOLS[school].name} thành công! Mở bảng Kỹ năng để học kỹ năng.`, color: '#ffd54f' });
  ev.push({ t: 'school', school });
}

function resetCost(p) { return 100 * p.level; }

// Tạo 3 nhiệm vụ ngày theo các cổng người chơi đã vào được
function ensureDaily(p) {
  const today = G.dailyDate();
  if (p.daily && p.daily.date === today) return;
  const maps = ['rung', 'hang'].filter(id => { const req = G.MAPS[id].require; return !req || G.questDone(p, req); });
  const list = [];
  if (maps.length) {
    const mons = [...new Set(maps.flatMap(id => Object.values(G.MAPS[id].spawns)))]
      .filter(id => !G.MONSTERS[id].boss && !G.MONSTERS[id].passive)
      .sort((a, b) => Math.abs(G.MONSTERS[a].level - p.level) - Math.abs(G.MONSTERS[b].level - p.level));
    const pick = mons.slice(0, 3).sort(() => Math.random() - 0.5);
    list.push({ type: 'kill', target: pick[0], need: 15 + Math.floor(Math.random() * 3) * 5, have: 0, claimed: false });
    list.push({ type: 'collect', target: 'loi_nang_luong', need: 6 + Math.floor(Math.random() * 3) * 2, have: 0, claimed: false });
    if (maps.includes('hang') && p.level >= 10) list.push({ type: 'boss', target: 'thach_quy', need: 1, have: 0, claimed: false });
    else list.push({ type: 'kill', target: pick[1] || pick[0], need: 20 + Math.floor(Math.random() * 3) * 5, have: 0, claimed: false });
  }
  p.daily = { date: today, list, bonus: false };
}

function dailyDone(p, d) {
  if (d.type === 'collect') return countItem(p, d.target) >= d.need;
  return d.have >= d.need;
}

const redeemTries = new Map();


function reforgeCost(inst) {
  const def = G.ITEMS[inst.id];
  return { gold: 60 * inst.q * Math.max(2, def.level || 1), stones: inst.q };
}
function salvageStones(inst) {
  const base = { 1: Math.random() < 0.35 ? 1 : 0, 2: 1, 3: 3, 4: 6 }[inst.q || 1];
  return base + Math.floor((inst.plus || 0) / 2);
}

function clampHpMp(p) {
  const st = G.calcStats(p);
  if (p.hp != null) p.hp = Math.min(p.hp, st.maxHp);
  if (p.mp != null) p.mp = Math.min(p.mp, st.maxMp);
}

function handle(userId, player, action) {
  const fn = actions[action && action.type];
  if (!fn) fail('Hành động không hợp lệ.');
  ensureDaily(player);
  const ev = [];
  fn(player, action, ev, userId);
  return ev;
}

// Sửa dữ liệu cũ khi game thêm trường mới
function migrate(p) {
  const legacySkills = p.skills === undefined;
  const base = G.newPlayer(p.name);
  for (const k in base) if (p[k] === undefined) p[k] = base[k];
  // Đổi tên từ phiên bản ninja cũ
  const OLD_SCHOOL = { phong_anh: 'kiem_si', hoa_lien: 'cung_thu', thuy_nguyet: 'phap_su', van_phap: 'toan_nang' };
  const OLD_ITEM = { phi_tieu_sat: 'cung_go', phi_tieu_lua: 'cung_hop_kim', phi_tieu_thach_quy: 'cung_thach_vuong',
    quat_tre: 'truong_go', quat_suong: 'truong_pha_le', quat_thach_quy: 'truong_thach_vuong' };
  if (OLD_SCHOOL[p.school]) p.school = OLD_SCHOOL[p.school];
  const fixId = (e) => { if (e && OLD_ITEM[e.id]) e.id = OLD_ITEM[e.id]; return e; };
  p.bag = p.bag.map(fixId).filter(e => G.ITEMS[e.id]);
  p.storage = p.storage.map(fixId).filter(e => G.ITEMS[e.id]);
  for (const s in p.equip) { fixId(p.equip[s]); if (p.equip[s] && !G.ITEMS[p.equip[s].id]) p.equip[s] = null; }
  for (const l of p.loot || []) fixId(l.inst);
  if (Array.isArray(p.loot)) p.loot = p.loot.filter(l => G.ITEMS[l.inst.id]);
  for (const s of G.SLOTS) if (p.equip[s] === undefined) p.equip[s] = null;
  for (const s of G.SLOTS) G.normalizeInst(p.equip[s]);
  p.bag.forEach(G.normalizeInst);
  p.storage.forEach(G.normalizeInst);
  if (!G.MAPS[p.map]) { p.map = G.START_MAP; p.x = null; p.y = null; }
  if (!Array.isArray(p.loot)) p.loot = [];
  if (!p.unlocks || typeof p.unlocks !== 'object') p.unlocks = {};
  if (!p.quest.ver) {
    const oldId = G.OLD_QUEST_ORDER[p.quest.step];
    const newId = oldId ? (G.OLD_QUEST_MAP[oldId] || oldId) : 'q10';
    const idx = G.QUESTS.findIndex(q => q.id === newId);
    if (!oldId) { p.quest.state = 'none'; p.quest.progress = {}; }
    p.quest.step = idx >= 0 ? idx : G.QUESTS.length;
    p.quest.ver = G.QUEST_VERSION;
  }
  ensureDaily(p);
  if (!Array.isArray(p.redeemed)) p.redeemed = [];
  // Hệ thống điểm kỹ năng: người chơi cũ được trả điểm theo cấp, kỹ năng đang dùng được học sẵn cấp 1
  if (legacySkills || !p.skills || typeof p.skills !== 'object' || Array.isArray(p.skills)) {
    p.skills = {};
    p.skillPoints = Math.max(0, p.level - 1);
    const old = Array.isArray(p.skillSlots) ? p.skillSlots : [];
    p.skillSlots = Array(G.SKILL_SLOTS).fill(null);
    old.slice(0, 4).forEach((id, i) => {
      const sk = G.SKILLS[id];
      if (sk && !sk.ult && sk.level <= p.level && G.availableSkills(p).includes(id) && p.skillPoints > 0) {
        p.skills[id] = 1; p.skillPoints--; p.skillSlots[i] = id;
      }
    });
  }
  if (!Number.isFinite(p.skillPoints)) p.skillPoints = 0;
  while (p.skillSlots.length < G.SKILL_SLOTS) p.skillSlots.push(null);
  p.skillSlots = p.skillSlots.slice(0, G.SKILL_SLOTS).map(id => (id && G.SKILLS[id] ? id : null));
  pruneLoot(p);
  return p;
}

module.exports = { handle, migrate, GameError, questComplete, currentQuest, reforgeCost, salvageStones, resetCost };
