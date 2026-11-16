'use strict';
const G = require('./shared');
const { QUESTS, SIDE_QUESTS, NPCS, MAPS, ITEMS, MONSTERS } = G;
const out = []; const P = s => out.push(s);
const idxOf = id => QUESTS.findIndex(q => q.id === id);

function npcMapsAt(nid, i) {
  const npc = NPCS[nid]; if (!npc) return [];
  const placed = Object.keys(MAPS).filter(mid => Object.values(MAPS[mid].npcs || {}).includes(nid));
  const at = (v, edge) => { if (typeof v !== 'string') return v; const k = idxOf(v); return k < 0 ? (edge ? Infinity : -1) : k; };
  return placed.filter(mid => {
    const m = MAPS[mid];
    if (m.require && idxOf(m.require) >= i) return false;   // map not open yet
    const ap = npc.appear; if (!ap) return true;
    const r = ap[mid]; if (!r) return false;
    return r.some(([a, b]) => i >= at(a, false) && i <= at(b, true));
  });
}

P('=== NPC availability per quest step (only gaps) ===');
const watch = ['vy', 'lu_khach', 'lam_suong', 'lao_su', 'minh_triet', 'ha_phong', 'truong_lang_5', 'truong_lang_6', 'lang_hinh', 'tho_ren', 'ba_thuoc', 'tap_hoa', 'thu_kho'];
for (const nid of watch) {
  const gaps = [];
  for (let i = 0; i < QUESTS.length; i++) if (!npcMapsAt(nid, i).length) gaps.push(i + ':' + QUESTS[i].id);
  P(`${nid.padEnd(14)} gaps at steps: ${gaps.length ? gaps.join(', ') : 'none'}`);
}

P('');
P('=== Side quest giver reachable at its req step? ===');
for (const q of SIDE_QUESTS) {
  const reqIdx = (q.req || []).map(r => idxOf(r)).filter(x => x >= 0);
  const minStep = reqIdx.length ? Math.max(...reqIdx) + 1 : 0;
  // any step from minStep..99 where npc is findable
  let ok = [];
  for (let i = minStep; i < QUESTS.length; i++) if (npcMapsAt(q.npc, i).length) ok.push(i);
  P(`${q.id.padEnd(7)} npc=${q.npc.padEnd(12)} minStep=${String(minStep).padEnd(3)} findableAtSteps=${ok.length ? ok[0] + '..' + ok[ok.length - 1] + ' (' + ok.length + ')' : 'NONE <<<'}`);
}

P('');
P('=== Quest-kind items: used anywhere in code besides quests? ===');
const fs = require('fs'), path = require('path');
function walk(d, acc) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const st = fs.statSync(p); if (st.isDirectory()) { if (!/node_modules|\.git/.test(f)) walk(p, acc); } else if (/\.js$/.test(f)) acc.push(p); } return acc; }
const files = [...walk('server', []), ...walk('shared', []), ...walk('public', [])];
const questItems = Object.keys(ITEMS).filter(k => ITEMS[k].kind === 'quest');
for (const it of questItems) {
  const hits = [];
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    if (txt.includes(it)) hits.push(path.relative('.', f));
  }
  P(`${it.padEnd(22)} referenced in: ${hits.join(', ')}`);
}

P('');
P('=== gradeOf / daily monster pool ===');
P('gradeOf exists: ' + typeof G.gradeOf);
for (const mid of ['bong_do', 'hinh_nhan', 'quai_rac_td', 'tan_du_thien_khoi', 'thach_quy', 'lam_suong']) P(`  ${mid}: grade=${G.gradeOf ? G.gradeOf(MONSTERS[mid]) : '?'} boss=${!!MONSTERS[mid].boss} passive=${!!MONSTERS[mid].passive} lv=${MONSTERS[mid].level}`);

P('');
P('=== BOSS_MAPS entries: does boss spawn on that map? ===');
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
for (const b of BOSS_MAPS) {
  const m = MAPS[b.map];
  const spawns = m ? Object.values(m.spawns || {}) : [];
  P(`${b.map.padEnd(14)} boss=${b.boss.padEnd(20)} spawnsHere=${spawns.includes(b.boss)} bossLv=${MONSTERS[b.boss] ? MONSTERS[b.boss].level : '?'} minLv=${b.minLv} home=${m && m.home} village=${m && m.village ? m.village.n : '-'}`);
}

P('');
P('=== multi-target kill quests (order-dependent in combat.js) ===');
QUESTS.forEach((q, i) => { const k = Object.keys((q.obj || {}).kill || {}); if (k.length > 1) P(`idx${i} ${q.id}: ${k.join(' -> ')}`); });
SIDE_QUESTS.forEach(q => { const k = Object.keys((q.obj || {}).kill || {}); if (k.length > 1) P(`${q.id}: ${k.join(' -> ')}`); });

console.log(out.join('\n'));
