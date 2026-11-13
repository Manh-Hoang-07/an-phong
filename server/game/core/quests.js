'use strict';
/* Luật chơi phía server · Nhiệm vụ: nhiệm vụ hiện tại, điều kiện hoàn thành, NPC, đồ rơi phụ tuyến. */
const G = require('../../../shared');
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

// NPC dịch vụ mỗi làng một người: kiểm tra theo vai trò (smith, storage, daily, teleport...), trả id NPC hoặc null
function roleHere(p, role) {
  return G.npcByRole(p, p.map, role);
}

// Bản đồ ghi cho nhiệm vụ lúc nhận (nhận ở đâu thì trả ở đó): bản đồ hiện tại của người chơi,
// nếu NPC giao không đứng ở đó thì bản đồ đầu tiên có NPC đó.
function giverMap(p, npcId) {
  if (G.npcHere(p, p.map, npcId)) return p.map;
  return G.npcMaps(p, npcId)[0] || p.map;
}

// Nhiệm vụ đã nhận ở bản đồ khác thì phải quay lại đó mới trả được
function mustReturnTo(p, mapId) {
  return mapId && mapId !== p.map && G.MAPS[mapId] ? `Hãy quay về ${G.MAPS[mapId].name} để trả nhiệm vụ.` : null;
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

module.exports = { currentQuest, questComplete, questActive, onCurrentMapNpc, roleHere, giverMap, mustReturnTo, sideDropActive, sideDropNeed };
