'use strict';
const G = require('./shared');
const { QUESTS, SIDE_QUESTS, ITEMS, MONSTERS, MAPS, NPCS } = G;
const out = []; const P = s => out.push(s);
const idxOf = id => QUESTS.findIndex(q => q.id === id);
const itemDrops = {};
for (const mid in MONSTERS) for (const d of (MONSTERS[mid].drops || [])) (itemDrops[d[0]] = itemDrops[d[0]] || []).push({ mon: mid, rate: d[1], tag: d[2], side: d[3] });
const monMaps = {};
for (const mid in MAPS) for (const k in (MAPS[mid].spawns || {})) (monMaps[MAPS[mid].spawns[k]] = monMaps[MAPS[mid].spawns[k]] || []).push(mid);

P('=== minLevel jumps >= 4 and drops ===');
let prev = 0;
QUESTS.forEach((q, i) => {
  const d = q.minLevel - prev;
  if (d >= 4) P(`idx${i} ${q.id}: minLevel ${prev} -> ${q.minLevel} (+${d})`);
  prev = q.minLevel;
});

P('');
P('=== minLevel vs level of monster that DROPS the collect item ===');
QUESTS.forEach((q, i) => {
  const o = q.obj || {};
  for (const it in (o.collect || {})) {
    const lvs = (itemDrops[it] || []).filter(d => d.tag === q.id).map(d => MONSTERS[d.mon].level);
    if (!lvs.length) continue;
    const lo = Math.min(...lvs);
    if (q.minLevel > lo) P(`idx${i} ${q.id}: minLevel=${q.minLevel} > lowest drop-monster level ${lo} for ${it}`);
  }
});

P('');
P('=== GIVER reachable at its own step (map open + appear) ===');
const at = (v, edge) => { if (typeof v !== 'string') return v; const k = idxOf(v); return k < 0 ? (edge ? Infinity : -1) : k; };
QUESTS.forEach((q, i) => {
  const npc = NPCS[q.npc]; if (!npc) return;
  const placed = Object.keys(MAPS).filter(mid => Object.values(MAPS[mid].npcs || {}).includes(q.npc));
  const ok = placed.filter(mid => {
    const m = MAPS[mid];
    if (m.require && idxOf(m.require) >= i) return false;
    const ap = npc.appear; if (!ap) return true;
    const r = ap[mid]; if (!r) return false;
    return r.some(([a, b]) => i >= at(a, false) && i <= at(b, true));
  });
  if (!ok.length) P(`[GIVER UNREACHABLE] idx${i} ${q.id} npc=${q.npc} placed=${JSON.stringify(placed)}`);
});
P('(only failures listed above)');

P('');
P('=== quest text naming a map that is LOCKED at that step ===');
QUESTS.forEach((q, i) => {
  const txt = (q.start || []).join(' ');
  for (const mid in MAPS) {
    const m = MAPS[mid];
    if (!m.require) continue;
    if (idxOf(m.require) >= i && txt.includes(m.name)) {
      P(`idx${i} ${q.id}: text names map "${m.name}" (${mid}) but ${mid}.require='${m.require}' (idx ${idxOf(m.require)}) not done at step ${i}`);
    }
  }
});

P('');
P('=== bagSize / bagPlus ===');
const p = G.newPlayer ? G.newPlayer('x') : null;
P('BAG_SIZE=' + G.BAG_SIZE + ' bagSize(new)=' + (p ? G.bagSize(p) : '?'));
if (p) { p.bagPlus = 3; P('bagSize(+3)=' + G.bagSize(p)); }

P('');
P('=== daily board: max collect need per player across villages ===');
P('boards per player = number of villages visited (up to 7). collect need 6..10 each => up to ' + (7 * 10) + ' loi_nang_luong');
P('each loi_nang_luong is kind=quest => unsellable/undroppable');

P('');
P('=== village cap vs quest minLevel (cap used by shop.js) ===');
for (const vid of Object.keys(MAPS).filter(id => MAPS[id].village)) {
  const cap = MAPS[vid].village.cap;
  const region = Object.keys(MAPS).filter(id => { const m = MAPS[id]; return !m.village && m.home === vid; });
  const qs = QUESTS.filter(q => region.some(r => MAPS[r].require === q.id));
  P(`${vid} cap=${cap} regionMaps=${region.length}`);
}

console.log(out.join('\n'));
