'use strict';
const G = require('./shared');
const { QUESTS, SIDE_QUESTS, ITEMS, MONSTERS, NPCS, MAPS } = G;

const out = [];
const P = (s) => out.push(s);

P('=== COUNTS ===');
P('QUESTS ' + QUESTS.length + ' SIDE ' + SIDE_QUESTS.length + ' ITEMS ' + Object.keys(ITEMS).length + ' MONSTERS ' + Object.keys(MONSTERS).length + ' NPCS ' + Object.keys(NPCS).length + ' MAPS ' + Object.keys(MAPS).length);

// monster -> maps spawned
const monMaps = {};
for (const mid in MAPS) for (const k in (MAPS[mid].spawns || {})) {
  const m = MAPS[mid].spawns[k];
  (monMaps[m] = monMaps[m] || []).push(mid);
}
// item -> monsters dropping it
const itemDrops = {};
for (const mid in MONSTERS) for (const d of (MONSTERS[mid].drops || [])) {
  (itemDrops[d[0]] = itemDrops[d[0]] || []).push({ mon: mid, rate: d[1], tag: d[2], side: d[3] });
}

P('');
P('=== 1. KILL MONSTER NOT SPAWNED / COLLECT ITEM NOT DROPPED (main quests) ===');
QUESTS.forEach((q, i) => {
  const o = q.obj || {};
  for (const m in (o.kill || {})) {
    if (!MONSTERS[m]) P(`[MISSING MONSTER] idx${i} ${q.id} kill ${m} -> not in MONSTERS`);
    else if (!monMaps[m]) P(`[NO SPAWN] idx${i} ${q.id} kill ${m} (${MONSTERS[m].name}) -> not spawned on any map`);
  }
  for (const it in (o.collect || {})) {
    if (!ITEMS[it]) P(`[MISSING ITEM] idx${i} ${q.id} collect ${it} -> not in ITEMS`);
    else if (!itemDrops[it]) P(`[NO DROP] idx${i} ${q.id} collect ${it} (${ITEMS[it].name}) -> no monster drops it`);
    else P(`  ok  idx${i} ${q.id} collect ${it} <- ${itemDrops[it].map(d => d.mon + (d.tag ? '(tag ' + d.tag + ')' : '') + (d.side ? '(side ' + d.side + ')' : '')).join(', ')}`);
  }
});

P('');
P('=== 2. VISIT NPC ===');
QUESTS.forEach((q, i) => {
  for (const n of ((q.obj || {}).visit || [])) {
    const npc = NPCS[n];
    if (!npc) { P(`[MISSING NPC] idx${i} ${q.id} visit ${n} -> not in NPCS`); continue; }
    // maps where npc is placed
    const placed = Object.keys(MAPS).filter(mid => Object.values(MAPS[mid].npcs || {}).includes(n));
    if (!placed.length) { P(`[NPC NOT PLACED] idx${i} ${q.id} visit ${n} (${npc.name}) -> not in any map.npcs`); continue; }
    // check appear ranges: does any placed map allow step index i?
    let okAny = false, detail = [];
    for (const mid of placed) {
      const ap = npc.appear;
      if (!ap) { okAny = true; detail.push(mid + ':no-appear'); continue; }
      const ranges = ap[mid];
      if (!ranges) { detail.push(mid + ':no-range'); continue; }
      const at = (v, edge) => { if (typeof v !== 'string') return v; const k = QUESTS.findIndex(x => x.id === v); return k < 0 ? (edge ? Infinity : -1) : k; };
      const hit = ranges.some(([a, b]) => i >= at(a, false) && i <= at(b, true));
      detail.push(mid + ':' + JSON.stringify(ranges) + (hit ? ' HIT' : ' miss'));
      if (hit) okAny = true;
    }
    P(`${okAny ? '  ok ' : '[VISIT FAIL]'} idx${i} ${q.id} visit ${n} (${npc.name}) @step${i} :: ${detail.join(' | ')}`);
  }
});

P('');
P('=== 3. GIVER NPC (q.npc) ===');
const seenNpc = {};
QUESTS.forEach((q, i) => {
  const npc = NPCS[q.npc];
  if (!npc) { P(`[MISSING GIVER] idx${i} ${q.id} npc ${q.npc} -> not in NPCS`); return; }
  const placed = Object.keys(MAPS).filter(mid => Object.values(MAPS[mid].npcs || {}).includes(q.npc));
  if (!placed.length) { P(`[GIVER NOT PLACED] idx${i} ${q.id} npc ${q.npc} (${npc.name}) -> not in any map.npcs`); return; }
  // can the giver be present at step i?
  const at = (v, edge) => { if (typeof v !== 'string') return v; const k = QUESTS.findIndex(x => x.id === v); return k < 0 ? (edge ? Infinity : -1) : k; };
  let okAny = false, detail = [];
  for (const mid of placed) {
    const ap = npc.appear;
    if (!ap) { okAny = true; detail.push(mid + ':always'); continue; }
    const ranges = ap[mid];
    if (!ranges) { detail.push(mid + ':no-range'); continue; }
    const hit = ranges.some(([a, b]) => i >= at(a, false) && i <= at(b, true));
    detail.push(mid + ':' + JSON.stringify(ranges) + (hit ? ' HIT' : ' miss'));
    if (hit) okAny = true;
  }
  P(`${okAny ? '  ok ' : '[GIVER FAIL]'} idx${i} ${q.id} npc ${q.npc} (${npc.name}) @step${i} :: ${detail.join(' | ')}`);
});

P('');
P('=== 4. MIN LEVEL CHAIN ===');
let prev = 0;
QUESTS.forEach((q, i) => {
  const ml = q.minLevel;
  const o = q.obj || {};
  let maxKillLv = 0;
  for (const m in (o.kill || {})) if (MONSTERS[m]) maxKillLv = Math.max(maxKillLv, MONSTERS[m].level);
  const flag = [];
  if (ml < prev) flag.push('DECREASE from ' + prev);
  if (ml - prev > 5) flag.push('JUMP +' + (ml - prev));
  if (maxKillLv && ml > maxKillLv) flag.push('minLevel ' + ml + ' > kill monster level ' + maxKillLv);
  P(`idx${i} ${q.id} minLevel=${ml} prev=${prev} maxKillLv=${maxKillLv} ${flag.length ? '<< ' + flag.join('; ') : ''}`);
  prev = ml;
});

P('');
P('=== 5. QUEST ITEMS ===');
const questItems = Object.keys(ITEMS).filter(k => ITEMS[k].kind === 'quest');
const collectedByMain = {};
QUESTS.forEach(q => { for (const it in ((q.obj || {}).collect || {})) collectedByMain[it] = (collectedByMain[it] || 0) + q.obj.collect[it]; });
const collectedBySide = {};
SIDE_QUESTS.forEach(q => { for (const it in ((q.obj || {}).collect || {})) collectedBySide[it] = (collectedBySide[it] || 0) + q.obj.collect[it]; });
for (const it of questItems) {
  const drops = itemDrops[it] || [];
  const totalRate = drops.reduce((s, d) => s + d.rate, 0);
  P(`${it} (${ITEMS[it].name}) drops=${drops.length} sumRate=${totalRate.toFixed(2)} mainCollect=${collectedByMain[it] || 0} sideCollect=${collectedBySide[it] || 0} ${drops.length ? '' : '<< NO DROP SOURCE'}`);
}

P('');
P('=== 6. SIDE QUESTS ===');
const allQuestIds = new Set(QUESTS.map(q => q.id));
const allSideIds = new Set(SIDE_QUESTS.map(q => q.id));
SIDE_QUESTS.forEach(q => {
  const probs = [];
  for (const r of (q.req || [])) if (!allQuestIds.has(r) && !allSideIds.has(r)) probs.push('req missing: ' + r);
  if (!NPCS[q.npc]) probs.push('npc missing: ' + q.npc);
  else {
    const placed = Object.keys(MAPS).filter(mid => Object.values(MAPS[mid].npcs || {}).includes(q.npc));
    if (!placed.length) probs.push('npc not placed: ' + q.npc);
  }
  const o = q.obj || {};
  for (const m in (o.kill || {})) { if (!MONSTERS[m]) probs.push('kill monster missing: ' + m); else if (!monMaps[m]) probs.push('kill monster not spawned: ' + m); }
  for (const it in (o.collect || {})) {
    if (!ITEMS[it]) probs.push('collect item missing: ' + it);
    else if (!itemDrops[it]) probs.push('collect item no drop: ' + it);
  }
  for (const n of (o.visit || [])) if (!NPCS[n]) probs.push('visit npc missing: ' + n);
  const r = q.reward || {};
  for (const [id, n] of (r.items || [])) if (!ITEMS[id]) probs.push('reward item missing: ' + id);
  if (r.perk && !G.PERKS[r.perk]) probs.push('reward perk missing: ' + r.perk);
  if (r.unlockShop && !ITEMS[r.unlockShop]) probs.push('unlockShop item missing: ' + r.unlockShop);
  P(`${q.id} ${probs.length ? '<< ' + probs.join('; ') : 'ok'}`);
});

P('');
P('=== 7. PERIODIC ===');
P('DAILY_COUNT=' + G.DAILY_COUNT + ' WEEKLY_KILLS=' + G.WEEKLY_KILLS + ' WEEKLY_BOSSES=' + G.WEEKLY_BOSSES + ' WEEKLY_BOOKS=' + G.WEEKLY_BOOKS);
P('DAILY_BONUS=' + JSON.stringify(G.DAILY_BONUS));
P('loi_nang_luong in ITEMS: ' + !!ITEMS['loi_nang_luong'] + ' dropped by: ' + JSON.stringify(itemDrops['loi_nang_luong'] || null));
P('sach_ky_nang in ITEMS: ' + !!ITEMS['sach_ky_nang'] + ' price=' + (ITEMS['sach_ky_nang'] || {}).price);
P('da_cuong_hoa in ITEMS: ' + !!ITEMS['da_cuong_hoa'] + ' da_cuong_hoa_cao: ' + !!ITEMS['da_cuong_hoa_cao']);

console.log(out.join('\n'));
