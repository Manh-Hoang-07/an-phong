'use strict';
/* Luật chơi phía server · Hành động: lưu vị trí, đổi bản đồ, chết. */
const G = require('../../../shared');
const { fail, fmt } = require('../core/util');

// Ghi nhận Tân Đô vừa tới (để mở Trạm dịch chuyển tới đó)
function markVillage(p, ev) {
  const v = G.MAPS[p.map] && G.MAPS[p.map].village;
  if (v && !p.villages.includes(p.map)) {
    p.villages.push(p.map);
    if (ev) ev.push({ t: 'msg', text: 'Đã ghi nhận ' + G.MAPS[p.map].name + '. Từ nay có thể dùng Trạm dịch chuyển tới đây.', color: '#7fe3ff' });
  }
}

// Đặt chỗ đứng dậy sau khi chết. `stay` = tại chỗ, `home` = làng gần nhất (mặc định).
// Map có cờ respawn (Cổng đỏ...) luôn đứng dậy tại chỗ: không có lối quay lại.
// Trả về tên chỗ để die()/respawn_choice() đưa ra thông báo phù hợp.
function placeRespawn(p, ev, where) {
  const cur = G.MAPS[p.map];
  if (where === 'stay' || (cur && cur.respawn)) {
    p.x = null; p.y = null; p.arrive = 'S';
    ev.push({ t: 'map', map: p.map });
    return cur ? cur.name : 'đây';
  }
  const home = cur && cur.home;
  p.map = home && p.villages.includes(home) ? home : G.START_MAP;
  p.x = null; p.y = null; p.arrive = 'S';
  // Ưu tiên điểm hồi sinh đã đặt ở làng này: client dùng p.x/p.y khi arrive rỗng.
  const saved = G.respawnPointOf(p, p.map);
  if (saved) { p.x = saved.x; p.y = saved.y; p.arrive = null; }
  ev.push({ t: 'map', map: p.map });
  return 'làng';
}

const actions = {
  // Tự lưu định kỳ: vị trí, máu, năng lượng
  save(p, a) {
    if (a.map !== p.map) return;
    const st = G.calcStats(p, { form: !!p.formActive });
    if (Number.isFinite(a.x)) p.x = Math.round(a.x);
    if (Number.isFinite(a.y)) p.y = Math.round(a.y);
    // Đã lưu được vị trí đứng thật thì cờ `arrive` (điểm tới của lần đổi bản đồ) hết hiệu lực.
    // Không xoá thì lần sau vào game client thấy arrive và ném nhân vật về cổng, bỏ qua x/y vừa lưu.
    if (p.x != null && p.y != null) p.arrive = null;
    if (Number.isFinite(a.hp)) p.hp = Math.max(1, Math.min(st.maxHp, Math.round(a.hp)));
    if (Number.isFinite(a.mp)) p.mp = Math.max(0, Math.min(st.maxMp, Math.round(a.mp)));
    if (p.mounts && Array.isArray(p.mounts.summoned) && a.pets && typeof a.pets === 'object') {
      for (const id of p.mounts.summoned) {
        const ps = G.companionStats(p, id);
        const incoming = a.pets[id];
        if (!incoming || typeof incoming !== 'object') continue;
        if (!p.pets[id]) p.pets[id] = {};
        for (const [key, max] of [['hp', ps.maxHp], ['mp', ps.maxMp], ['sta', ps.maxSta]])
          if (Number.isFinite(incoming[key])) p.pets[id][key] = Math.max(0, Math.min(max, Math.round(incoming[key])));
      }
      if (p.mounts.active) p.pet = p.pets[p.mounts.active];
    }
    if (p.summons && p.summons.enabled && a.summons && typeof a.summons === 'object') {
      for (const id of Object.keys(G.SUMMONS)) {
        const incoming = a.summons[id];
        if (!incoming || typeof incoming !== 'object') continue;
        if (!p.summons.states[id]) p.summons.states[id] = {};
        // Max HP/MP/thể lực theo cấp riêng của từng linh thú
        const ss = G.summonUnitStats(p, id);
        for (const [key, max] of [['hp', ss.maxHp], ['mp', ss.maxMp], ['sta', ss.maxSta]])
          if (Number.isFinite(incoming[key])) p.summons.states[id][key] = Math.max(0, Math.min(max, Math.round(incoming[key])));
      }
    }
  },

  change_map(p, a, ev) {
    const m = G.MAPS[p.map];
    const portal = m.portals[a.portal];
    if (!portal) fail('Không có cổng này.');
    const st = G.portalStatus(p, p.map, a.portal);
    if (!st.ok) fail(`Chưa thể vào ${G.MAPS[portal.to].name}. ${st.reason}.`);
    if (Number.isFinite(a.hp)) actions.save(p, { map: p.map, hp: a.hp, mp: a.mp, pets: a.pets });
    p.map = portal.to;
    p.hiddenNpcActive = false;
    p.x = null; p.y = null;
    const dm = G.MAPS[portal.to];
    p.arrive = (dm.gate && portal.at && portal.at !== '<' && dm.portals[portal.at] ? dm.gate : portal.at) || G.gateOf(portal.to) || 'S';   // tới đúng lối vào ứng với cổng vừa đi qua
    markVillage(p, ev);
    ev.push({ t: 'map', map: p.map });
  },

  // Trạm dịch chuyển: đi nhanh giữa các Tân Đô đã từng tới, phí cố định G.TELEPORT_FEE (không theo cấp).
  teleport(p, a, ev) {
    if (!G.npcByRole(p, p.map, 'teleport')) fail('Phải đứng cạnh Trạm dịch chuyển.');
    const to = String(a.to || '');
    const v = G.MAPS[to] && G.MAPS[to].village;
    if (!v) fail('Trạm chỉ đưa tới các Tân Đô.');
    if (to === p.map) fail('Bạn đang ở đây rồi.');
    if (!p.villages.includes(to)) fail('Bạn chưa từng tới Tân Đô này. Hãy đi bộ tới đó một lần trước.');
    const req = G.MAPS[to].require;
    if (req && !G.questDone(p, req)) fail('Chưa đủ điều kiện vào Tân Đô này.');
    // Về Hiệp Hội miễn phí: nhiệm vụ của Hội trưởng Khải và các phụ tuyến chỉ nhận / trả ở đó
    const fee = G.teleportFee(to);
    if (p.gold < fee) fail('Không đủ xu (cần ' + fmt(fee) + ' xu).');
    if (Number.isFinite(a.hp)) actions.save(p, { map: p.map, hp: a.hp, mp: a.mp, pets: a.pets });
    p.gold -= fee;
    p.map = to; p.hiddenNpcActive = false; p.x = null; p.y = null; p.arrive = 'S';
    ev.push({ t: 'msg', text: 'Dịch chuyển tới ' + G.MAPS[to].name + (fee ? ' (-' + fmt(fee) + ' xu).' : ' (miễn phí).'), color: '#7fe3ff' });
    ev.push({ t: 'map', map: p.map });
  },

  // Đặt điểm hồi sinh tại Trạm dịch chuyển của làng đang đứng.
  // Client gửi toạ độ đang đứng (p.x/p.y của server chỉ cập nhật mỗi 10 giây nên có thể lệch);
  // server kiểm lại: phải là làng có NPC trạm, toạ độ phải GẦN trạm và không nằm trong khối đất.
  set_respawn(p, a, ev) {
    const village = G.villageOf(p.map);
    if (!village || village !== p.map) fail('Chỉ đặt được điểm hồi sinh ở Tân Đô.');
    const npcId = G.npcByRole(p, p.map, 'teleport');
    if (!npcId) fail('Hãy đến gần Trạm dịch chuyển để đặt điểm hồi sinh.');
    const x = Number.isFinite(a && a.x) ? Math.round(a.x) : p.x;
    const y = Number.isFinite(a && a.y) ? Math.round(a.y) : p.y;
    if (!Number.isFinite(x) || !Number.isFinite(y)) fail('Chưa xác định được vị trí của bạn. Hãy đi lại một chút rồi thử lại.');
    // Kiểm tra bằng lưới bản đồ: toạ độ phải gần NPC trạm và đứng được (không lọt trong đất).
    const grid = require('../../realtime/mapgrid').load(p.map);
    if (!grid) fail('Không đọc được bản đồ này.');
    const T = G.TILE;
    const pos = Object.keys(G.MAPS[p.map].npcs).find(ch => G.MAPS[p.map].npcs[ch] === npcId);
    const at = pos ? grid.findChar(pos) : null;
    if (at) {
      const nx = at.c * T + T / 2, ny = at.r * T;
      if (Math.hypot(x - nx, y - ny) > 160) fail('Hãy đứng sát Trạm dịch chuyển rồi đặt lại.');
    }
    if (grid.isSolid(Math.floor(y / T), Math.floor(x / T))) fail('Vị trí này không đứng được. Hãy bước ra chỗ trống rồi thử lại.');
    if (!p.respawnByMap || typeof p.respawnByMap !== 'object' || Array.isArray(p.respawnByMap)) p.respawnByMap = {};
    p.respawnByMap[p.map] = { x, y };
    ev.push({ t: 'msg', text: `Đã lưu điểm hồi sinh tại ${G.MAPS[p.map].name}.`, color: '#a5d6a7' });
  },

  die(p, a, ev) {
    const lose = Math.floor(G.expToNext(p.level) * 0.05);
    p.exp = Math.max(0, p.exp - lose);
    p.formActive = false;
    // Hồi sinh: bóng ma cũng được giải trừ
    if (p.shadows) p.shadows.enabled = false;
    const st = G.calcStats(p, { form: false });
    p.hp = Math.round(st.maxHp * 0.5);
    p.mp = Math.round(st.maxMp * 0.5);
    p.hiddenNpcActive = false;
    // Độ bền: chết làm mọi món đang mặc hao thêm (tính trước khi tính lại máu để món vừa hỏng không còn cộng chỉ số)
    const broke = G.applyDeathWear(p);
    if (broke.length) {
      ev.push({ t: 'msg', text: `Hỏng do bị đánh bại: ${broke.map((s) => G.ITEMS[p.equip[s].id].name).join(', ')}. Đến Thợ rèn để sửa.`, color: '#ef5350' });
      const st2 = G.calcStats(p, { form: false });
      p.hp = Math.min(p.hp, Math.round(st2.maxHp * 0.5));
      p.mp = Math.min(p.mp, Math.round(st2.maxMp * 0.5));
    }
    // Mặc định `home` để các luồng chết tự động (Đổi mạng gọi die(p, {}, [])) giữ nguyên hành vi cũ.
    const where = placeRespawn(p, ev, a && a.where);
    ev.push({ t: 'msg', text: `Bạn đã bị đánh bại, mất ${fmt(lose)} kinh nghiệm. Hồi sinh tại ${where}.`, color: '#ef5350' });
  },

  // Đổi mạng: server đã chạy luật chết (trừ 5% EXP, hồi sinh về làng) ngay trong onExec.
  // Khi người chơi chọn "Ở lại", đưa về đúng bản đồ đang đứng lúc gục — KHÔNG trừ EXP lần nữa.
  respawn_choice(p, a, ev) {
    if (a && a.where === 'stay') {
      // onExec lưu map gốc vào lastDeathMap trước khi die() đẩy về làng.
      if (p.lastDeathMap && G.MAPS[p.lastDeathMap]) p.map = p.lastDeathMap;
      delete p.lastDeathMap;
      const where = placeRespawn(p, ev, 'stay');
      ev.push({ t: 'msg', text: `Bạn đứng dậy tại ${where}.`, color: '#a5d6a7' });
    } else {
      delete p.lastDeathMap;   // chọn về làng: dọn dẹp dấu vết
    }
  },
};

module.exports = actions;
