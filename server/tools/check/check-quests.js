'use strict';
/* Kiểm tra chuỗi nhiệm vụ chính tuyến có làm được từ đầu tới cuối không (theo mạng đường đi hiện tại).
 *   node server/tools/check-quests.js
 * Với mỗi nhiệm vụ (khi người chơi vừa làm xong nhiệm vụ trước):
 *   - người giao có đang đứng ở một bản đồ đi tới được không (đi bộ qua các cổng đã mở)
 *   - quái cần hạ / nơi rơi vật phẩm / NPC cần gặp có ở bản đồ đi tới được không
 *   - vật phẩm Thu có quái rơi đúng mã nhiệm vụ không
 *   - phần thưởng, người giao có tồn tại không
 * Đồng thời in số bước đi bộ tối thiểu từ nơi trả nhiệm vụ trước tới nơi giao nhiệm vụ này (nhắc dùng Trạm dịch chuyển). */
const G = require('../../../shared');

function reachable(step) {
  const player = { quest: { step } };
  const dist = { cong_do: 0 }, q = ['cong_do'];
  const seen = new Set(['cong_do']);
  // đi được từ đâu cũng được (cổng hai chiều); chỉ cần cổng đích đã mở khi bước vào
  while (q.length) {
    const a = q.shift();
    for (const ch of Object.keys(G.MAPS[a].portals || {})) {
      const to = G.MAPS[a].portals[ch].to;
      if (seen.has(to) || !G.portalStatus(player, a, ch).ok) continue;
      seen.add(to); dist[to] = dist[a] + 1; q.push(to);
    }
  }
  return { seen, dist };
}
function walk(from, to) {                           // số cổng phải đi giữa hai bản đồ (đã mở ở bước step)
  const dist = { [from]: 0 }, q = [from];
  while (q.length) {
    const a = q.shift();
    for (const p of Object.values(G.MAPS[a].portals || {})) if (dist[p.to] === undefined) { dist[p.to] = dist[a] + 1; q.push(p.to); }
  }
  return dist[to];
}

let bad = 0;
const say = (...a) => console.log(...a);
let lastMap = 'cong_do';
const rows = [];
G.QUESTS.forEach((qst, i) => {
  const { seen } = reachable(i);
  const player = { quest: { step: i } };
  const where = (npc) => Object.keys(G.MAPS).filter(m => seen.has(m) && G.npcHere(player, m, npc));
  const issues = [];
  const giverMaps = where(qst.npc);
  if (!G.NPCS[qst.npc]) issues.push('người giao không tồn tại: ' + qst.npc);
  else if (!giverMaps.length) issues.push('người giao ' + qst.npc + ' không ở bản đồ nào đi tới được');
  const o = qst.obj || {};
  for (const m in o.kill || {}) {
    if (!G.MONSTERS[m]) { issues.push('quái không tồn tại ' + m); continue; }
    if (!Object.keys(G.MAPS).some(map => seen.has(map) && Object.values(G.MAPS[map].spawns || {}).includes(m))) issues.push('quái ' + m + ' không có ở bản đồ đi tới được');
  }
  for (const it in o.collect || {}) {
    const src = Object.keys(G.MONSTERS).filter(id => (G.MONSTERS[id].drops || []).some(d => d[0] === it && d[2] === qst.id));
    if (!src.length) issues.push('vật phẩm ' + it + ' không có quái nào rơi riêng cho nhiệm vụ này');
    else if (!src.some(id => Object.keys(G.MAPS).some(map => seen.has(map) && Object.values(G.MAPS[map].spawns || {}).includes(id)))) issues.push('nguồn rơi ' + it + ' không ở bản đồ đi tới được');
  }
  for (const n of o.visit || []) if (!where(n).length) issues.push('NPC cần gặp ' + n + ' không ở bản đồ đi tới được');
  for (const [id] of (qst.reward && qst.reward.items) || []) if (!G.ITEMS[id]) issues.push('thưởng sai ' + id);
  const gm = giverMaps.slice().sort((x, y) => walk(lastMap, x) - walk(lastMap, y))[0];
  const steps = gm ? walk(lastMap, gm) : '?';
  rows.push([i, qst.id, qst.name, qst.npc, gm || '-', steps]);
  if (issues.length) { bad += issues.length; say(`✗ ${qst.id} (${qst.name}):`, issues.join('; ')); }
  if (gm) lastMap = gm;
});
// nhiệm vụ buộc đi bộ rất xa (≥ 5 cổng) so với chỗ trả nhiệm vụ trước: nên dùng Trạm dịch chuyển hoặc đổi người giao
const far = rows.filter(r => typeof r[5] === 'number' && r[5] >= 5);
if (far.length) say('\nQuãng đi xa (≥ 5 cổng) tới người giao:\n' + far.map(r => `  ${r[1]} ${r[3]} @${r[4]}: ${r[5]} cổng`).join('\n'));
// Phụ tuyến: sau khi xong các nhiệm vụ yêu cầu, người giao có ở bản đồ đi tới được không; quái / vật phẩm hợp lệ
let sideBad = 0;
for (const sq of G.SIDE_QUESTS) {
  const issues = [];
  // chỉ số nhiệm vụ chính tối thiểu để mở phụ tuyến này (tính cả chuỗi phụ tuyến nối nhau)
  const reqStep = (id, d = 0) => {
    const i = G.QUESTS.findIndex(x => x.id === id);
    if (i >= 0) return i + 1;
    const side = G.SIDE_QUESTS.find(x => x.id === id);
    if (!side) { issues.push('yêu cầu không tồn tại: ' + id); return 0; }
    return d > 10 ? 0 : Math.max(0, ...(side.req || []).map(r => reqStep(r, d + 1)));
  };
  const step = Math.max(0, ...(sq.req || []).map(r => reqStep(r)));
  const { seen } = reachable(Math.min(step, G.QUESTS.length));
  const player = { quest: { step: Math.min(step, G.QUESTS.length) } };
  if (!G.NPCS[sq.npc]) issues.push('người giao không tồn tại ' + sq.npc);
  else if (![...seen].some(m => G.npcHere(player, m, sq.npc))) issues.push('người giao ' + sq.npc + ' không ở bản đồ đi tới được (sau ' + (sq.req || []).join(',') + ')');
  for (const m in (sq.obj || {}).kill || {}) {
    if (!G.MONSTERS[m]) issues.push('quái không tồn tại ' + m);
    else if (![...seen].some(map => Object.values(G.MAPS[map].spawns || {}).includes(m))) issues.push('quái ' + m + ' không có ở bản đồ đi tới được');
  }
  for (const [id] of (sq.reward && sq.reward.items) || []) if (!G.ITEMS[id]) issues.push('thưởng sai ' + id);
  if (issues.length) { sideBad += issues.length; say('✗ phụ tuyến ' + sq.id + ' (' + sq.name + '): ' + issues.join('; ')); }
}
say('Phụ tuyến: ' + G.SIDE_QUESTS.length + (sideBad ? ' (CÓ ' + sideBad + ' VẤN ĐỀ)' : ', đều làm được'));
bad += sideBad;
say(bad ? `\nCÓ ${bad} VẤN ĐỀ` : '\nChuỗi nhiệm vụ chạy được từ đầu tới cuối.');
process.exitCode = bad ? 1 : 0;
