'use strict';
/* Luật chơi phía server · Túi đồ: thêm / bớt vật phẩm, đồ rơi trên đất, giá tẩy luyện / phân rã. */
const G = require('../../../shared');
const { fail } = require('./util');

// ------------------------------------------------------------ Túi đồ
function bagFree(p) { return G.bagSize(p) - p.bag.length; }

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

function reforgeCost(inst) {
  const def = G.ITEMS[inst.id];
  return { gold: 60 * inst.q * Math.max(2, def.level || 1), stones: inst.q };
}
function salvageStones(inst) {
  const base = { 1: Math.random() < 0.35 ? 1 : 0, 2: 1, 3: 3, 4: 6 }[inst.q || 1];
  return base + Math.floor((inst.plus || 0) / 2);
}

module.exports = { bagFree, countItem, slotsNeeded, addItem, addInst, instName, removeItem, bagEntry, giveItem, qualityColor, LOOT_TTL, LOOT_MAX, pruneLoot, dropLoot, reforgeCost, salvageStones };
