'use strict';
const G = require('./shared');
const { QUESTS, SIDE_QUESTS, ITEMS, MONSTERS, NPCS, MAPS } = G;
const out = []; const P = s => out.push(s);

const idxOf = (id) => QUESTS.findIndex(q => q.id === id);
const monMaps = {};
for (const mid in MAPS) for (const k in (MAPS[mid].spawns || {})) (monMaps[MAPS[mid].spawns[k]] = monMaps[MAPS[mid].spawns[k]] || []).push(mid);
const itemDrops = {};
for (const mid in MONSTERS) for (const d of (MONSTERS[mid].drops || [])) (itemDrops[d[0]] = itemDrops[d[0]] || []).push({ mon: mid, rate: d[1], tag: d[2], side: d[3] });

// map reachable at step i: map.require done (index < i) AND some portal into it from a reachable map is open
function mapOpenAt(mapId, i) {
  const m = MAPS[mapId];
  if (!m) return false;
  if (m.require && idxOf(m.require) >= i) return false;
  return true;
}

P('=== A. REWARD ITEMS / PERKS / TITLES (main quests) ===');
QUESTS.forEach((q, i) => {
  const r = q.reward || {};
  const probs = [];
  for (const [id, n] of (r.items || [])) if (!ITEMS[id]) probs.push('reward item missing: ' + id);
  if (r.perk && !G.PERKS[r.perk]) probs.push('perk missing: ' + r.perk);
  if (probs.length) P(`[REWARD] idx${i} ${q.id}: ${probs.join('; ')}`);
});
P('(only failures listed above)');

P('');
P('=== B. KILL TARGET: any spawn map OPEN at that quest step? ===');
QUESTS.forEach((q, i) => {
  for (const m in ((q.obj || {}).kill || {})) {
    const maps = monMaps[m] || [];
    const open = maps.filter(mid => mapOpenAt(mid, i));
    if (!open.length) P(`[UNREACHABLE KILL] idx${i} ${q.id} kill ${m} (${MONSTERS[m] && MONSTERS[m].name}) spawns only on ${JSON.stringify(maps)} whose require is not satisfied at step ${i}`);
  }
});
P('(only failures listed above)');

P('');
P('=== C. COLLECT: drop-monster spawn map open at that step? ===');
QUESTS.forEach((q, i) => {
  for (const it in ((q.obj || {}).collect || {})) {
    const ds = (itemDrops[it] || []).filter(d => d.tag === q.id || (!d.tag && !d.side));
    const maps = [...new Set(ds.flatMap(d => monMaps[d.mon] || []))];
    const open = maps.filter(mid => mapOpenAt(mid, i));
    if (!open.length) P(`[UNREACHABLE COLLECT] idx${i} ${q.id} ${it} drop maps ${JSON.stringify(maps)} not open at step ${i}`);
  }
});
P('(only failures listed above)');

P('');
P('=== D. VISIT: is the npc map open at that step? ===');
QUESTS.forEach((q, i) => {
  for (const n of ((q.obj || {}).visit || [])) {
    const placed = Object.keys(MAPS).filter(mid => Object.values(MAPS[mid].npcs || {}).includes(n));
    const open = placed.filter(mid => mapOpenAt(mid, i));
    if (!open.length) P(`[UNREACHABLE VISIT] idx${i} ${q.id} visit ${n} maps ${JSON.stringify(placed)} not open at step ${i}`);
  }
});
P('(only failures listed above)');

P('');
P('=== E. BOSS_MAPS coverage vs villages ===');
const BOSS_MAPS = [
  { map: 'hang', boss: 'thach_quy', minLv: 10 },
  { map: 'cc_hac_nguyet', boss: 'lam_suong', minLv: 15 },
  { map: 'tp_chim_c', boss: 'thuy_xa_vuong', minLv: 18 },
  { map: 'dinh_nui', boss: 'bang_long', minLv: 28 },
  { map: 'kho_bac', boss: 'lam_suong_2', minLv: 28 },
  { map: 'dinh_thap', boss: 'nguoi_gac_luu_tru', minLv: 38 },
  { map: 'dinh_cong_vh', boss: 'kieu_deo_mat_na', minLv: 45 },
  { map: 'tam_diem', boss: 'thuc_the_bkc', minLv: 50 },
];
const allBossMaps = Object.keys(MAPS).filter(id => Object.values(MAPS[id].spawns || {}).some(m => MONSTERS[m] && MONSTERS[m].boss));
P('maps containing a boss: ' + allBossMaps.join(', '));
P('maps in BOSS_MAPS: ' + BOSS_MAPS.map(b => b.map).join(', '));
P('boss maps MISSING from BOSS_MAPS: ' + allBossMaps.filter(m => !BOSS_MAPS.some(b => b.map === m)).join(', '));
for (const v of Object.keys(MAPS).filter(id => MAPS[id].village)) {
  const region = Object.keys(MAPS).filter(id => { const m = MAPS[id]; return !m.village && m.home === v && Object.keys(m.spawns || {}).length; });
  const avail = BOSS_MAPS.filter(b => region.includes(b.map));
  P(`village ${v} (n=${MAPS[v].village.n}): regionMaps=${region.length} [${region.join(',')}] -> bossQuestPossible=${avail.length > 0} ${avail.map(a => a.boss).join(',')}`);
}

P('');
P('=== F. QUEST-KIND ITEMS: who drops / who consumes / who rewards ===');
const questItems = Object.keys(ITEMS).filter(k => ITEMS[k].kind === 'quest');
const collectMain = {}; QUESTS.forEach(q => { for (const it in ((q.obj || {}).collect || {})) collectMain[it] = (collectMain[it] || 0) + q.obj.collect[it]; });
const collectSide = {}; SIDE_QUESTS.forEach(q => { for (const it in ((q.obj || {}).collect || {})) collectSide[it] = (collectSide[it] || 0) + q.obj.collect[it]; });
const rewardMain = {}; QUESTS.forEach(q => { for (const [id, n] of ((q.reward || {}).items || [])) rewardMain[id] = (rewardMain[id] || 0) + n; });
const rewardSide = {}; SIDE_QUESTS.forEach(q => { for (const [id, n] of ((q.reward || {}).items || [])) rewardSide[id] = (rewardSide[id] || 0) + n; });
for (const it of questItems) {
  const d = itemDrops[it] || [];
  P(`${it.padEnd(22)} drops=${String(d.length).padEnd(2)} collectMain=${String(collectMain[it] || 0).padEnd(3)} collectSide=${String(collectSide[it] || 0).padEnd(3)} rewardMain=${String(rewardMain[it] || 0).padEnd(3)} rewardSide=${String(rewardSide[it] || 0).padEnd(3)} ${(!collectMain[it] && !collectSide[it]) ? '<< NEVER CONSUMED' : ''}`);
}

P('');
P('=== G. TEXT vs DATA number mismatch (main + side) ===');
// crude: pull first number mentioned in start text, compare to obj counts
function nums(s) { return (s.match(/\d+/g) || []).map(Number); }
QUESTS.forEach((q, i) => {
  const o = q.obj || {};
  const need = [];
  for (const m in (o.kill || {})) need.push(['kill:' + m, o.kill[m]]);
  for (const it in (o.collect || {})) need.push(['collect:' + it, o.collect[it]]);
  if (!need.length) return;
  const txt = (q.start || []).join(' ');
  const n = nums(txt);
  const missing = need.filter(([k, v]) => !n.includes(v));
  if (missing.length) P(`[TEXT?] idx${i} ${q.id} obj=${JSON.stringify(need)} numbersInStartText=${JSON.stringify(n)}  -> ${missing.map(x => x[0] + '=' + x[1]).join(',')} not mentioned`);
});
P('');
SIDE_QUESTS.forEach(q => {
  const o = q.obj || {};
  const need = [];
  for (const m in (o.kill || {})) need.push(['kill:' + m, o.kill[m]]);
  for (const it in (o.collect || {})) need.push(['collect:' + it, o.collect[it]]);
  if (!need.length) return;
  const txt = (q.start || []).join(' ');
  const n = nums(txt);
  const missing = need.filter(([k, v]) => !n.includes(v));
  if (missing.length) P(`[TEXT?] ${q.id} obj=${JSON.stringify(need)} numbersInStartText=${JSON.stringify(n)} -> ${missing.map(x => x[0] + '=' + x[1]).join(',')} not mentioned`);
});

P('');
P('=== H. duplicate quest ids / duplicate side ids ===');
const seen = {};
QUESTS.forEach((q, i) => { if (seen[q.id] != null) P(`[DUP] ${q.id} at idx ${seen[q.id]} and ${i}`); seen[q.id] = i; });
const seenS = {};
SIDE_QUESTS.forEach((q, i) => { if (seenS[q.id] != null) P(`[DUP SIDE] ${q.id}`); seenS[q.id] = i; });
P('(only failures listed above)');

P('');
P('=== I. NPC appear ranges referencing unknown quest ids ===');
for (const nid in NPCS) {
  const ap = NPCS[nid].appear; if (!ap) continue;
  for (const mid in ap) {
    if (!MAPS[mid]) P(`[NPC APPEAR MAP MISSING] ${nid} -> map ${mid} not in MAPS`);
    for (const [a, b] of ap[mid]) for (const v of [a, b]) {
      if (typeof v === 'string' && idxOf(v) < 0) P(`[NPC APPEAR QUEST MISSING] ${nid} @${mid} -> '${v}' not a quest id`);
    }
  }
}
P('(only failures listed above)');

P('');
P('=== J. map.require / portal.require referencing unknown quest ids ===');
for (const mid in MAPS) {
  const m = MAPS[mid];
  if (m.require && idxOf(m.require) < 0) P(`[MAP REQUIRE MISSING] ${mid}.require='${m.require}'`);
  for (const ch in (m.portals || {})) {
    const p = m.portals[ch];
    if (!MAPS[p.to]) P(`[PORTAL TARGET MISSING] ${mid}['${ch}'] -> ${p.to}`);
    if (p.require && idxOf(p.require) < 0) P(`[PORTAL REQUIRE MISSING] ${mid}['${ch}'].require='${p.require}'`);
  }
}
P('(only failures listed above)');

P('');
P('=== K. monsters spawned but not in MONSTERS, npcs placed but not in NPCS ===');
for (const mid in MAPS) {
  for (const k in (MAPS[mid].spawns || {})) if (!MONSTERS[MAPS[mid].spawns[k]]) P(`[SPAWN MISSING MONSTER] ${mid}.${k}='${MAPS[mid].spawns[k]}'`);
  for (const k in (MAPS[mid].npcs || {})) if (!NPCS[MAPS[mid].npcs[k]]) P(`[NPC MISSING] ${mid}.${k}='${MAPS[mid].npcs[k]}'`);
}
P('(only failures listed above)');

P('');
P('=== L. monster drops referencing unknown items ===');
for (const mid in MONSTERS) for (const d of (MONSTERS[mid].drops || [])) if (!ITEMS[d[0]]) P(`[DROP MISSING ITEM] ${mid} -> ${d[0]}`);
P('(only failures listed above)');

console.log(out.join('\n'));
