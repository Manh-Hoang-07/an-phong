'use strict';
const G = require('./shared');
const { QUESTS, SIDE_QUESTS, ITEMS, MONSTERS, MAPS, NPCS } = G;
const out = []; const P = s => out.push(s);

const itemDrops = {};
for (const mid in MONSTERS) for (const d of (MONSTERS[mid].drops || [])) (itemDrops[d[0]] = itemDrops[d[0]] || []).push({ mon: mid, rate: d[1], tag: d[2], side: d[3] });

const collectMain = {}; QUESTS.forEach(q => { for (const it in ((q.obj || {}).collect || {})) collectMain[it] = (collectMain[it] || 0) + q.obj.collect[it]; });
const collectSide = {}; SIDE_QUESTS.forEach(q => { for (const it in ((q.obj || {}).collect || {})) collectSide[it] = (collectSide[it] || 0) + q.obj.collect[it]; });
const rewardMain = {}; const rewardWhere = {};
QUESTS.forEach(q => { for (const [id, n] of ((q.reward || {}).items || [])) { rewardMain[id] = (rewardMain[id] || 0) + n; (rewardWhere[id] = rewardWhere[id] || []).push(q.id + 'x' + n); } });
const rewardSide = {}; SIDE_QUESTS.forEach(q => { for (const [id, n] of ((q.reward || {}).items || [])) rewardSide[id] = (rewardSide[id] || 0) + n; });

P('=== Quest-kind items: stuck analysis ===');
P('(kind=quest => sell/drop/market/exchange all blocked => cannot ever leave the bag)');
const questItems = Object.keys(ITEMS).filter(k => ITEMS[k].kind === 'quest');
let totalStuck = 0;
for (const it of questItems) {
  const consumed = (collectMain[it] || 0) + (collectSide[it] || 0);
  const gained = (rewardMain[it] || 0) + (rewardSide[it] || 0);
  const dropped = (itemDrops[it] || []).length;
  if (consumed > 0) continue;
  const stuck = gained + (dropped ? 1 : 0);
  totalStuck += stuck;
  P(`${it.padEnd(22)} consumed=0  rewardGiven=${gained}${rewardWhere[it] ? '(' + rewardWhere[it].join(',') + ')' : ''}  dropSources=${(itemDrops[it] || []).map(d => d.mon + '@' + d.rate + (d.tag ? '[q:' + d.tag + ']' : '')).join(',') || 'none'}  => stuckSlots>=${stuck}`);
}
P('TOTAL stuck quest-item slots (min): ' + totalStuck);

P('');
P('=== Items both DROPPED (quest-tagged) and REWARDED for same quest => duplicate copies ===');
QUESTS.forEach(q => {
  for (const [id, n] of ((q.reward || {}).items || [])) {
    const d = (itemDrops[id] || []).filter(x => x.tag === q.id);
    if (d.length) P(`${q.id}: reward ${id} x${n} AND drops from ${d.map(x => x.mon + '@' + x.rate).join(',')} with tag ${q.id}  => player ends with >=${n + 1} copies`);
  }
});

P('');
P('=== village cap semantics ===');
const capUsers = [];
const fs = require('fs'), path = require('path');
function walk(d, acc) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const st = fs.statSync(p); if (st.isDirectory()) { if (!/node_modules|\.git/.test(f)) walk(p, acc); } else if (/\.js$/.test(f)) acc.push(p); } return acc; }
const files = [...walk('server', []), ...walk('shared', []), ...walk('public', [])];
for (const f of files) { const t = fs.readFileSync(f, 'utf8'); if (/\.cap\b|village\.cap|\bcap\b/.test(t)) { const lines = t.split('\n'); lines.forEach((l, i) => { if (/cap/.test(l) && !/capital|escape/.test(l)) capUsers.push(path.relative('.', f) + ':' + (i + 1) + '  ' + l.trim()); }); } }
P(capUsers.slice(0, 40).join('\n'));

P('');
P('=== shopKind / unlockShop wiring ===');
for (const f of files) { const t = fs.readFileSync(f, 'utf8'); if (/unlockShop|shopKind/.test(t)) { const lines = t.split('\n'); lines.forEach((l, i) => { if (/unlockShop|shopKind/.test(l)) P(path.relative('.', f) + ':' + (i + 1) + '  ' + l.trim()); }); } }

console.log(out.join('\n'));
