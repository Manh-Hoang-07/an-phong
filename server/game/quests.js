'use strict';
/* Luật chơi phía server · Nhiệm vụ: nhiệm vụ hiện tại, điều kiện hoàn thành, NPC, đồ rơi phụ tuyến. */
const G = require('../../shared');
const { countItem } = require('./inventory');

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

function onCurrentMapNpc(p, npc) {
  return G.npcHere(p, p.map, npc);
}

// Phụ tuyến có đang làm không (hỗ trợ tag nhóm như 'p3' cho cả p3-1, p3-2, p3-3)
function sideDropActive(p, tag) {
  if (p.side.active[tag]) return true;
  return Object.keys(p.side.active).some(id => id.startsWith(tag + '-'));
}
function sideDropNeed(p, tag, item) {
  let need = 0;
  for (const id in p.side.active) {
    if (id !== tag && !id.startsWith(tag + '-')) continue;
    const q = G.sideById(id);
    need = Math.max(need, (q && q.obj.collect && q.obj.collect[item]) || 0);
  }
  return need;
}

module.exports = { currentQuest, questComplete, questActive, onCurrentMapNpc, sideDropActive, sideDropNeed };
