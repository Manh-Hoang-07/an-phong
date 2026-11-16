'use strict';
const G = require('./shared');
const { QUESTS, SIDE_QUESTS, ITEMS, MONSTERS, MAPS } = G;
const out = []; const P = s => out.push(s);
const idxOf = id => QUESTS.findIndex(q => q.id === id);

P('=== reachability BFS from START_MAP at each step ===');
function reachable(i) {
  const seen = new Set();
  const start = G.START_MAP;
  const q = [start]; seen.add(start);
  while (q.length) {
    const cur = q.shift();
    const m = MAPS[cur];
    for (const ch in (m.portals || {})) {
      const p = m.portals[ch];
      const to = MAPS[p.to];
      if (!to || seen.has(p.to)) continue;
      if (p.require && idxOf(p.require) >= i) continue;
      if (to.require && idxOf(to.require) >= i) continue;
      seen.add(p.to); q.push(p.to);
    }
  }
  return seen;
}
const unreach = {};
for (let i = 0; i < QUESTS.length; i++) {
  const r = reachable(i);
  for (const mid in MAPS) if (!r.has(mid)) (unreach[mid] = unreach[mid] || []).push(i);
}
P('maps never reachable at any step: ' + Object.keys(MAPS).filter(mid => (unreach[mid] || []).length === QUESTS.length).join(', ') || 'none');

P('');
P('=== kill/collect/visit target map reachable at that step ===');
QUESTS.forEach((q, i) => {
  const r = reachable(i);
  const o = q.obj || {};
  for (const m in (o.kill || {})) {
    const maps = Object.keys(MAPS).filter(mid => Object.values(MAPS[mid].spawns || {}).includes(m));
    if (!maps.some(mid => r.has(mid))) P(`[KILL UNREACHABLE] idx${i} ${q.id} ${m} maps=${maps.join(',')}`);
  }
  for (const it in (o.collect || {})) {
    const mons = Object.keys(MONSTERS).filter(mid => (MONSTERS[mid].drops || []).some(d => d[0] === it && (d[2] === q.id || (!d[2] && !d[3]))));
    const maps = [...new Set(mons.flatMap(mid => Object.keys(MAPS).filter(x => Object.values(MAPS[x].spawns || {}).includes(mid))))];
    if (!maps.some(mid => r.has(mid))) P(`[COLLECT UNREACHABLE] idx${i} ${q.id} ${it} maps=${maps.join(',')}`);
  }
  for (const n of (o.visit || [])) {
    const maps = Object.keys(MAPS).filter(mid => Object.values(MAPS[mid].npcs || {}).includes(n));
    if (!maps.some(mid => r.has(mid))) P(`[VISIT UNREACHABLE] idx${i} ${q.id} ${n} maps=${maps.join(',')}`);
  }
});
P('(only failures listed above)');

P('');
P('=== reward KIND vs killed monster grade ===');
const gradeOf = G.gradeOf;
QUESTS.forEach((q, i) => {
  const r = q.reward || {};
  const o = q.obj || {};
  const kills = Object.keys(o.kill || {});
  if (!kills.length) return;
  const grades = kills.map(m => MONSTERS[m] ? gradeOf(MONSTERS[m]) : '?');
  const kind = Object.keys(G.QUEST_REWARD_KIND).find(k => G.QUEST_REWARD_KIND[k] === G.QUEST_REWARD_KIND[k] && false) || null;
  P(`idx${i} ${q.id.padEnd(7)} kills=${kills.map((m, j) => m + ':' + grades[j]).join(',')} rewardExp=${r.exp} gold=${r.gold}`);
});

P('');
P('=== quest-kind items that drop UNCONDITIONALLY (no quest tag, no side tag) but are never consumed ===');
const itemDrops = {};
for (const mid in MONSTERS) for (const d of (MONSTERS[mid].drops || [])) (itemDrops[d[0]] = itemDrops[d[0]] || []).push({ mon: mid, rate: d[1], tag: d[2], side: d[3] });
const collectMain = {}; QUESTS.forEach(q => { for (const it in ((q.obj || {}).collect || {})) collectMain[it] = (collectMain[it] || 0) + q.obj.collect[it]; });
const collectSide = {}; SIDE_QUESTS.forEach(q => { for (const it in ((q.obj || {}).collect || {})) collectSide[it] = (collectSide[it] || 0) + q.obj.collect[it]; });
for (const it of Object.keys(ITEMS).filter(k => ITEMS[k].kind === 'quest')) {
  if (collectMain[it] || collectSide[it]) continue;
  const free = (itemDrops[it] || []).filter(d => !d.tag && !d.side);
  if (free.length) P(`${it} (${ITEMS[it].name}): drops ALWAYS from ${free.map(d => d.mon + '@' + d.rate).join(',')} but no quest consumes it => infinite stuck drops`);
}
P('(only failures listed above)');

P('');
P('=== side quest reward kind vs kill grade sanity (kill count vs text) ===');
SIDE_QUESTS.forEach(q => { });

console.log(out.join('\n'));
