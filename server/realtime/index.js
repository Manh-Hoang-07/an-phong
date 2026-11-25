'use strict';
/*
 * Thời gian thực: người chơi cùng bản đồ thấy nhau và chat (xem docs/KE_HOACH_DA_NGUOI_CHOI.md).
 *
 * - WebSocket tại /ws, xác thực bằng cookie phiên `ap_session` có sẵn.
 * - Mỗi tài khoản một kết nối; mở kết nối mới thì kết nối cũ bị đóng (mã 4001).
 * - Phòng theo bản đồ. Vị trí chỉ để HIỂN THỊ (combat/di chuyển vẫn ở client), không tính thưởng từ đây.
 * - Tên, class, cấp, vũ khí lấy từ nhân vật trong cache server, không tin client.
 * - Mọi trạng thái nằm trong bộ nhớ tiến trình. Nếu sau này chạy nhiều tiến trình thì thay `rooms`
 *   bằng Redis pub/sub; phần còn lại của server không đụng tới module này.
 */
const { WebSocketServer } = require('ws');
const G = require('../../shared');
const auth = require('../accounts/auth');
const cache = require('../storage/cache');
const claims = require('./claims');
const party = require('./party');
const trade = require('./trade');
const xplayer = require('../game/core/xplayer');
const gameActions = require('../game/actions/world');
const combatActions = require('../game/actions/combat');
const mobstore = require('./mobstore');
const { World, STEP_MS } = require('./mobs');
const hitValidate = require('../game/core/hit-validate');
const combatGuard = require('../game/core/combat-guard');

const PATH = '/ws';
const TICK_MS = 100;              // chu kỳ phát vị trí
const PING_MS = 25000;
const LOOK_REFRESH_MS = 5000;     // cập nhật tên/cấp/class/vũ khí từ nhân vật
const SESSION_CHECK_MS = 30000;
const MAX_MSG_BYTES = 1024;
const MAX_MSGS_PER_SEC = 160;
// Trần đòn đánh mỗi giây. Vũ khí nhanh nhất (song đao 270ms) là 3,7 đòn/giây; đánh lan gửi mỗi quái
// một gói nên một nhát trúng 4 quái = 14,8 gói/giây. 16 chừa dư cho lag, và chặn 80 → 16.
const MAX_HITS_PER_SEC = 16;
// Đòn từ KỸ NĂNG có ngân sách riêng, vì một lần dùng kỹ năng bắn ra nhiều đòn (hits 9, count 5, chain 6).
// Kỹ năng thưa nhất là 1 lần/giây; 20 đòn/giây đủ cho kỹ năng nhiều nhát nhất trong lúc chờ hồi chiêu.
const MAX_SKILL_HITS_PER_SEC = 20;
// Hệ số trần sát thương một đòn, tính từ ATK của chính nhân vật (server tự đọc, client không sửa được).
//
// BỐN MỨC, vì bốn loại đòn chênh nhau tới 140 lần (đánh thường 1,25 → siêu tuyệt kỹ 176,3).
// Dùng chung một mức thì hoặc cắt oan loại mạnh, hoặc thả cửa loại yếu.
//
// Hệ số nhân THỰC TẾ áp lên một đòn (đọc từ engine, không phải cộng dồn lý thuyết):
//   chí mạng 2,5 (Sát Thủ "Bóng Tối") × ngẫu nhiên 1,1 × sát thương trùm 1,8 = 4,95
// Các buff sau KHÔNG tính vào trần vì không ai bật được cùng lúc một cách ổn định:
//   atkBuff 1,87 (vn1) × shred 1,4 (xa32) × exec 1,6 (av38) → cộng dồn thành 51,84
// Bảo vệ tổ hợp 51,84 là bảo vệ thứ không tồn tại; nó cần quái vừa dưới 40% máu, vừa bị phá giáp,
// vừa đúng đòn chí mạng bóng tối. Trần tính theo 4,95 rồi chừa biên 15%.
//
// mult THỰC TẾ lớn nhất đo được (đã gồm skillMul và vsSlowed, trên mọi class ở cấp 70 và 100):
//   đánh thường 1,25  (vũ khí mạnh nhất)              × 4,95 =   6 → trần 8
//   kỹ năng     19,42 (Sát Thủ st10 Tử Huyệt)          × 4,95 =  96 → trần 111
//   tuyệt kỹ    16,57 (Tử Linh Thuật Sư ulChung1)      × 4,95 =  82 → trần 95
//   siêu tuyệt 125,89 (Toàn Năng ulToanNangSuper)      × 4,95 = 623 → trần 717
// Lưu ý: st10 là kỹ năng THƯỜNG nhưng mạnh hơn mọi tuyệt kỹ, vì finisher 5,51 × vsSlowed 2,5.
// Đó là lý do trần kỹ năng (111) cao hơn trần tuyệt kỹ (95) — phản ánh thực tế, không sửa dữ liệu.
// Chặn thật vẫn là NGÂN SÁCH mỗi giây bên dưới, không phải trần này.
const CAP_MUL_BASIC = 8;
const CAP_MUL_SKILL = 111;
const CAP_MUL_ULT = 95;
const CAP_MUL_SUPERULT = 717;
// Ngân sách SÁT THƯƠNG kỹ năng mỗi giây. Cần thiết vì cờ loại đòn do client gửi: kẻ gian có thể giả nó
// để lấy trần cao hơn. Ngân sách này chặn TỔNG sát thương, không chỉ số đòn.
//
// Tách làm hai: kỹ năng/tuyệt kỹ dùng chung một ngân sách, siêu tuyệt kỹ có ngân sách riêng.
// Lý do tách: một siêu tuyệt kỹ thật (Vạn Pháp Quy Nhất, 1.009.670 sát thương ở ATK 1.157) LỚN HƠN
// ngân sách chung cũ (atk × 1.080 = 1.249.560 chỉ vừa đủ một đòn), nên nếu để chung thì hai siêu tuyệt kỹ
// liên tiếp sẽ bị ghì, còn một siêu tuyệt kỹ cộng thêm kỹ năng thường thì không. Tách ra thì mỗi loại có
// hạn mức riêng, đúng bản chất.
const SKILL_DMG_RATE_MUL = 6;
const SKILL_DMG_BURST_SEC = 2;
// Siêu tuyệt kỹ: mỗi 60 giây chỉ cho dùng 2 lần. Đếm SỐ LẦN, không đếm sát thương — đếm sát thương
// thì một đòn nhỏ (Cấm Chú với ít MP) lại cho lọt nhiều lần hơn một đòn lớn, sai ý đồ.
// Đây là lớp chặn CUỐI, không phụ thuộc client: sửa đồng hồ hồi chiêu cũng không spam được.
const SUPERULT_USES_MAX = 2;
const SUPERULT_WINDOW_MS = 60000;
// ---------------------------------------------------------------- Chống spam theo SỐ LẦN DÙNG CHIÊU
// Client tự giữ hồi chiêu/MP/thể lực, nhưng sửa được đồng hồ. Server giữ thêm một bộ đếm riêng:
// mỗi lần bấm chiêu gửi gói `cast` kèm id; server kiểm đã học / đang gắn / hồi chiêu / số lần dùng.
// Ba mức theo đúng câu hỏi "kỹ năng x lần/s, tuyệt kỹ y lần/s, siêu tuyệt kỹ z lần/phút":
//   kỹ năng thường 4 lần/giây (xoay vòng 8 ô tối đa ~2-3 lần/giây, chừa dư cho lag)
//   tuyệt kỹ       1 lần/2 giây (thực tế 2 ô xoay ~0,06 lần/giây, đặt rộng gấp ~30 lần)
//   siêu tuyệt kỹ  2 lần/60 giây (khớp SUPERULT_USES_MAX ở trên)
// Đặt rộng là có chủ đích: không ghì người chơi bình thường, chỉ chặn kẻ sửa client spam liên tục.
const CAST_RATE = {
  skill:    { max: 4, windowMs: 1000 },
  ult:      { max: 1, windowMs: 2000 },
  superUlt: { max: 2, windowMs: 60000 },
};
const CAST_HIT_WINDOW_MS = 2000;   // một đòn kỹ năng phải có lần dùng hợp lệ trong 2 giây qua
const CAST_DENY_MS = 1000;         // sau một lần dùng bị từ chối, bỏ qua đòn kỹ năng trong 1 giây
const CHAT_MAX_LEN = 100;
const CHAT_GAP_MS = { map: 1200, world: 8000, party: 800 };
const WORLD_BOUND = 100000;
const ANIMS = new Set(['idle', 'run', 'jump', 'fall', 'atk', 'hit', 'dead']);

// KHU (kênh): mỗi bản đồ có MAX_CH khu, mỗi khu tối đa CH_CAP người. Người chơi chọn khu qua NPC "Người dẫn khu" (2 người mỗi bản đồ, rộng 3) Mỗi khu là một phòng riêng với bộ quái riêng.
// Khoá phòng = "<mapId>#<khu>". Khu 1 dùng trạng thái quái đã lưu (máu quái giữ qua đăng xuất / restart); các khu khác bắt đầu
// đầy máu và bị bỏ khỏi bộ nhớ sau CH_IDLE_MS khi vắng người.
const MAX_CH = 30;
const CH_CAP = 20;
const CH_IDLE_MS = 120000;
const CH_SWITCH_GAP_MS = 3000;
const roomKey = (mapId, ch) => mapId + '#' + ch;
const rooms = new Map();          // khoá phòng → Map(connId → conn)
const byUser = new Map();         // userId → conn
const byId = new Map();           // connId → conn
const worlds = new Map();         // khoá phòng → World (quái của khu)
const outbox = new Map();         // khoá phòng → [gói quái chờ gửi]: mỗi nhịp 50ms gộp thành MỘT tin / phòng (xem flushOutbox)
let mobTimer = null;
let nextId = 1;
let wss = null;
let tickTimer = null;

const cookies = (req) => {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) { try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* bỏ qua */ } }
  }
  return out;
};

const SNAP_FULL_EVERY = 10;       // cứ 10 nhịp (~1 giây) gửi đủ hướng + hoạt ảnh một lần
// Cảnh báo (tối đa mỗi 10 giây) khi một nhịp tick / mobTick chậm quá PERF_SLOW_MS. Bình thường không in gì.
const PERF_SLOW_MS = Number(process.env.AP_PERF_SLOW_MS) || 25;
let perfWarnAt = 0;

function sendRaw(conn, text) {
  if (conn.ws.readyState === 1 && conn.ws.bufferedAmount < 256 * 1024) conn.ws.send(text);
}

// Đo một nhịp; `kind` là 'tick' hoặc 'mob'.
function timed(kind, fn) {
  const t0 = process.hrtime.bigint();
  try { fn(); } finally {
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    const now = Date.now();
    if (ms > PERF_SLOW_MS && now - perfWarnAt > 10000) {
      perfWarnAt = now;
      console.warn(`[perf] ${kind}Tick chậm ${ms.toFixed(1)}ms (ngưỡng ${PERF_SLOW_MS}ms) | người ${byUser.size} | phòng ${rooms.size} | thế giới quái ${worlds.size}`);
    }
  }
}

const send = (conn, obj) => sendRaw(conn, JSON.stringify(obj));

function lookOf(conn) {
  return { id: conn.id, name: conn.name, sc: conn.school, lv: conn.level, w: conn.weapon };
}
function stateOf(conn) {
  return { ...lookOf(conn), x: conn.x, y: conn.y, f: conn.f, a: conn.a };
}

// Đọc nhân vật trong cache để lấy thông tin hiển thị; trả về true nếu có thay đổi
async function refreshLook(conn) {
  const p = await cache.getPlayer(conn.userId);
  if (!p) return false;
  const weapon = (p.equip && p.equip.weapon && p.equip.weapon.id) || null;
  const school = p.school || null;
  const level = Number(p.level) || 1;
  const name = String(p.name || '?').slice(0, 16);
  // Bản đồ do SERVER xác nhận (HTTP change_map/teleport đã sửa p.map trong cache). Client không gửi được.
  conn.serverMap = p.map;
  try {
    const st = G.calcStats(p, { form: !!p.formActive });
    // Trần sát thương một đòn, tính từ ATK của chính nhân vật: chặn client gửi số tuỳ ý.
    // Bốn trần vì bốn loại đòn chênh nhau tới 140 lần (xem CAP_MUL_* ở đầu file).
    // dmgCap giữ lại cho tương thích; capBasic/capSkill/capUlt/capSuperUlt là thứ onHit dùng.
    conn.dmgCap = Math.max(st.atk, 30) * 60 + 500;
    conn.atk = Math.max(st.atk, 30);
    conn.capBasic = conn.atk * CAP_MUL_BASIC + 50;
    conn.capSkill = conn.atk * CAP_MUL_SKILL + 500;
    conn.capUlt = conn.atk * CAP_MUL_ULT + 500;
    conn.capSuperUlt = conn.atk * CAP_MUL_SUPERULT + 500;
    conn.cdr = st.cdr || 0;
    conn.skillMul = st.skillMul || 1;  // sức mạnh kỹ năng do server tính, dùng cho trần tham chiếu
  } catch { conn.dmgCap = 5000; conn.atk = 30; conn.capBasic = 5000; conn.capSkill = 20000; conn.capUlt = 40000; conn.capSuperUlt = 400000; conn.cdr = 0; conn.skillMul = 1; }
  // Cache danh sách kỹ năng đã học + đang gắn để onCast đối chiếu (server tự đọc, không tin client).
  // Chỉ lấy id + cấp + cờ loại; refresh mỗi LOOK_REFRESH_MS nên thay đổi sách/ô được cập nhật trong vài giây.
  conn.skillLevels = {};
  for (const id of Object.keys(p.skills || {})) if (G.SKILLS[id] && p.skills[id] > 0) conn.skillLevels[id] = p.skills[id];
  // Siêu tuyệt kỹ nằm ở p.superUlts (trụ riêng), nhưng engine cast vẫn cần thấy chúng ở cache này.
  // Chỉ đưa vào khi ĐÃ SỞ HỮU thật — server tự đọc từ save, client không gửi được trường này.
  for (const id of G.superUltsOf(p)) conn.skillLevels[id] = G.SUPER_ULT_LEVEL;
  conn.skillEquipped = Array.isArray(p.skillSlots) ? p.skillSlots.filter(Boolean) : [];
  // Kỹ năng do trang bị cấp (ô thứ 9) — cache riêng để onCast không từ chối nhầm.
  conn.gearSkillId = null;
  try { const gs = G.gearSkill(p); if (gs && gs.id) { conn.gearSkillId = gs.id; conn.skillLevels[gs.id] = conn.skillLevels[gs.id] || gs.level || 1; } } catch { /* bỏ qua */ }
  const changed = name !== conn.name || school !== conn.school || level !== conn.level || weapon !== conn.weapon;
  conn.name = name; conn.school = school; conn.level = level; conn.weapon = weapon;
  return changed;
}

function room(mapId) {
  let r = rooms.get(mapId);
  if (!r) { r = new Map(); rooms.set(mapId, r); }
  return r;
}

function broadcast(mapId, obj, exceptId) {
  const r = rooms.get(mapId);
  if (!r) return;
  const text = JSON.stringify(obj);
  for (const c of r.values()) if (c.id !== exceptId) sendRaw(c, text);
}

function leaveRoom(conn) {
  if (!conn.room) return;
  const r = rooms.get(conn.room);
  if (r) {
    r.delete(conn.id);
    if (!r.size) rooms.delete(conn.room);
    else broadcast(conn.room, { t: 'leave', id: conn.id });
  }
  conn.map = null;
  conn.room = null;
}

const countOf = (mapId, ch) => { const r = rooms.get(roomKey(mapId, ch)); return r ? r.size : 0; };

// Chọn khu: khu muốn vào nếu còn chỗ, không thì khu thấp nhất còn chỗ (người chơi dồn vào khu đầu cho đông vui),
// hết chỗ cả thì khu vắng nhất.
function pickChannel(mapId, want) {
  if (want >= 1 && want <= MAX_CH && countOf(mapId, want) < CH_CAP) return want;
  let best = 1, bn = Infinity;
  for (let ch = 1; ch <= MAX_CH; ch++) {
    const n = countOf(mapId, ch);
    if (n < CH_CAP) return ch;
    if (n < bn) { bn = n; best = ch; }
  }
  return best;
}

function enterRoom(conn, mapId, want) {
  // Vào lại đúng bản đồ đang đứng (hồi sinh, dựng lại cảnh) thì giữ nguyên khu
  if (want == null && conn.map === mapId) want = conn.ch;
  leaveRoom(conn);
  const ch = pickChannel(mapId, want);
  const key = roomKey(mapId, ch);
  conn.map = mapId; conn.ch = ch; conn.room = key;
  conn.dirty = false;
  const r = room(key);
  send(conn, { t: 'room', map: mapId, ch, list: [...r.values()].map(stateOf) });
  const world = worldOf(mapId, ch);
  if (world) send(conn, { t: 'mobs', map: mapId, list: world.fullList() });
  r.set(conn.id, conn);
  broadcast(key, { t: 'join', p: stateOf(conn) }, conn.id);
}

// Danh sách đủ MAX_CH khu của bản đồ đang đứng: [số khu, số người]
function sendChannels(conn) {
  if (!conn.map) return;
  const list = [];
  for (let ch = 1; ch <= MAX_CH; ch++) list.push([ch, countOf(conn.map, ch)]);
  send(conn, { t: 'chlist', map: conn.map, cur: conn.ch, cap: CH_CAP, max: MAX_CH, list });
}

function onChannel(conn, m) {
  const n = Number(m.n) | 0;
  if (!conn.map || n < 1 || n > MAX_CH || n === conn.ch) return;
  const now = Date.now();
  if (now - (conn.chAt || 0) < CH_SWITCH_GAP_MS) { send(conn, { t: 'sys', text: 'Đổi khu quá nhanh, chờ vài giây.' }); return; }
  if (countOf(conn.map, n) >= CH_CAP) { send(conn, { t: 'sys', text: `Khu ${n} đã đầy (${CH_CAP}/${CH_CAP}).` }); sendChannels(conn); return; }
  conn.chAt = now;
  trade.onMapChange(conn);
  enterRoom(conn, conn.map, n);
  send(conn, { t: 'sys', text: `Đã chuyển sang Khu ${conn.ch}.` });
}

// ---- Quái do server quản lý (server/realtime/mobs.js)
// Thế giới quái của bản đồ KHÔNG bị xoá khi bản đồ vắng người: máu quái phải giữ nguyên dù người chơi
// đăng xuất hay đổi bản đồ. Bản đồ vắng người thì chỉ ngừng chạy AI (xem mobTick).
function worldOf(mapId, ch = 1) {
  const key = roomKey(mapId, ch);
  let w = worlds.get(key);
  if (!w) {
    w = new World(mapId, {
      emit: (obj) => { const q = outbox.get(key); if (q) q.push(obj); else outbox.set(key, [obj]); },
      // Người kết liễu và người góp từ 10% máu trở lên đều được phiếu nhận thưởng (đổi ở hành động kills)
      kill: (mob, killerId, contrib, share, kid) => {
        const assist = [];
        const rewarded = new Set();
        const x = Math.round(mob.x), y = Math.round(mob.def.fly ? mob.homeY : mob.y);
        for (const [cid, dmg] of contrib) {
          const c = byId.get(cid);
          // Phiếu chỉ cấp cho người còn ở trong map lúc quái chết (người đã rời / vừa về làng sẽ không nhận được gói mdie để đổi thưởng)
          if (!c || c.room !== key || (cid !== killerId && dmg < mob.maxHp * share)) continue;
          const src = mob.contribSrc && mob.contribSrc.get(cid);
          // Người tự hạ được cộng thêm kinh nghiệm theo số đồng đội có mặt
          claims.add(c.userId, kid, { monster: mob.id, x, y, source: src === 'pet' || src === 'shadow' ? src : 'player', bonus: party.bonusFor(c.userId, key, mob.x) });
          rewarded.add(c.userId);
          if (cid !== killerId) assist.push(cid);
        }
        // Đồng đội đứng gần nhưng không tự đánh: nhận phần chia (kinh nghiệm + tiến độ nhiệm vụ)
        for (const u of [...rewarded]) {
          for (const m of party.membersNear(u, key, mob.x)) {
            if (rewarded.has(m)) continue;
            const c = byUser.get(m);
            if (!c) continue;
            rewarded.add(m);
            claims.add(m, kid, { monster: mob.id, x, y, source: 'player', party: true });
            assist.push(c.id);
          }
        }
        return assist;
      },
    }, ch === 1 ? mobstore.get(mapId) : null);
    if (!w.map) return null;
    w.ch = ch; w.key = key; w.kidPrefix = key;
    worlds.set(key, w);
  }
  return w;
}

// Gộp mọi gói quái phát sinh trong một nhịp thành MỘT tin cho mỗi phòng. Trước đây mỗi đòn đánh là một tin gửi cho cả phòng
// (số tin = đòn × người × người). Client mở tin 'batch' theo đúng thứ tự (public/js/core/realtime.js).
function flushOutbox() {
  for (const [key, list] of outbox) {
    if (list.length === 1) broadcast(key, list[0]);
    else if (list.length) broadcast(key, { t: 'batch', l: list });
  }
  outbox.clear();
}

function mobTick() {
  const now = Date.now();
  for (const [key, w] of worlds) {
    const r = rooms.get(key);
    // Bản đồ vắng người: ngừng AI (không ai để đánh) nhưng GIỮ NGUYÊN máu quái. Quái chết vẫn hồi sinh
    // đúng giờ để lần sau vào không gặp bản đồ trống. Không có ai thì chỉ cần chạy 1 giây một lần.
    if (r && r.size) {
      const players = [];
      for (const c of r.values()) players.push({ id: c.id, x: c.x, y: c.y, dead: c.dead });
      w.emptyAt = 0;
      w.step(now, players);
      if (w.stepCount % 2 === 0) {
        const snap = w.snapshot(now);
        if (snap.length) { const o = { t: 'msnap', p: snap }; const q = outbox.get(key); if (q) q.push(o); else outbox.set(key, [o]); }
      }
    } else if (w.ch !== 1 && now - (w.emptyAt || (w.emptyAt = now)) > CH_IDLE_MS) {
      worlds.delete(key);   // khu phụ vắng người đủ lâu: bỏ khỏi bộ nhớ (khu 1 giữ để lưu máu quái)
      continue;
    } else if (now - (w.lastIdleAt || 0) >= 1000) {
      w.lastIdleAt = now;
      w.stepIdle(now);
    }
    // Máu / sống-chết vừa đổi: đưa vào hàng đợi ghi (gộp vài giây một lần, xem mobstore.js)
    if (w.dirty) { w.dirty = false; if (w.ch === 1) mobstore.markDirty(w.mapId, w.serialize()); }
  }
  flushOutbox();
}

// ---------------------------------------------------------------- Nhận lệnh dùng chiêu (chống spam)
// Client gửi gói `cast` NGAY TRƯỚC khi bắn đòn. Server kiểm ba thứ nó tự biết:
//   1. kỹ năng đã học VÀ đang gắn trên thanh (cache từ refreshLook, client sửa không được)
//   2. hồi chiêu do SERVER giữ (combatGuard theo userId), có áp cdr như client
//   3. số lần dùng mỗi giây/phút theo CAST_RATE
// Hợp lệ thì mở một "cửa sổ đòn" trong CAST_HIT_WINDOW_MS: onHit chỉ nhận đòn kỹ năng có id này.
// Không hợp lệ thì đánh dấu castDenyUntil để onHit bỏ qua đòn trong 1 giây.
// Không kiểm MP/thể lực: hai thứ đó tự hồi theo thời gian và chỉ có ở client; đưa về server là việc lớn
// gấp ba mà không chặn được vector spam chính (sửa đồng hồ hồi chiêu).
function onCast(conn, m) {
  const id = String(m.id || '').slice(0, 40);
  const now = Date.now();
  const sk = G.SKILLS[id];
  if (!sk) return;
  const g = combatGuard.state(conn.userId);   // dùng chung cho mọi kết nối của tài khoản này
  const lv = (conn.skillLevels || {})[id] || 0;
  const equipped = (conn.skillEquipped || []).includes(id);
  // Kỹ năng do TRANG BỊ cấp (GEAR_SKILL_SLOT) không nằm trong p.skills/p.skillSlots nên không có trong cache.
  // Với chúng ta chỉ áp hồi chiêu + rate limit (không chặn theo học/gắn), còn kỹ năng thường phải đã học VÀ gắn.
  // Không có cờ "grantsSkill" trong dữ liệu nên không đoán; skill do gear tự chịu trách nhiệm ở client.
  const known = lv > 0;
  if (!known) return;                                       // không có trong cache → chưa học / không thuộc class
  const isGear = id === conn.gearSkillId;
  if (!isGear && !equipped) return;                         // đã học nhưng không gắn trên thanh → không được dùng
  const kind = sk.superUlt ? 'superUlt' : sk.ult ? 'ult' : 'skill';
  // 1) Hồi chiêu do server giữ. Áp cdr y hệt client: cd_ms × (1 - cdr/100).
  const cdMs = (sk.cd || 0) * 1000 * (1 - (conn.cdr || 0) / 100);
  if (now < (g.skillCds[id] || 0)) { g.castDenyUntil = now + CAST_DENY_MS; return; }
  // 2) Giới hạn số lần dùng theo từng loại (cửa sổ trượt).
  const rate = CAST_RATE[kind];
  if (!g.castWinAt[kind]) { g.castN[kind] = 0; g.castWinAt[kind] = now; }
  else {
    const add = ((now - g.castWinAt[kind]) / rate.windowMs) * rate.max;
    g.castN[kind] = Math.max(0, (g.castN[kind] || 0) - add);
    g.castWinAt[kind] = now;
  }
  if (g.castN[kind] >= rate.max) { g.castDenyUntil = now + CAST_DENY_MS; return; }
  g.castN[kind] = (g.castN[kind] || 0) + 1;
  // Hợp lệ: ghi hồi chiêu server + mở cửa sổ cho đòn của lần dùng này.
  g.skillCds[id] = now + cdMs;
  conn.lastCastAt = now;
  conn.lastCastId = id;
  // Giữ TẤT CẢ lần dùng trong cửa sổ: kỹ năng bắn nhiều nhát có thể còn đòn rơi sau khi đã bấm chiêu khác.
  g.recentCasts.push({ id, at: now });
  if (g.recentCasts.length > 32) g.recentCasts.splice(0, g.recentCasts.length - 32);
  g.castDenyUntil = 0;
}

function onHit(conn, m) {
  const w = conn.room && worlds.get(conn.room);
  if (!w) return;
  const now = Date.now();
  if (conn.dead && now - conn.deadAt > 1500) return;
  const g = combatGuard.state(conn.userId);   // bộ đếm dùng chung, reconnect không reset được
  // Loại đòn do client khai: 0 đánh thường, 1 kỹ năng, 2 tuyệt kỹ, 3 siêu tuyệt kỹ.
  // Cờ này KHÔNG đáng tin (client sửa được), nên nó chỉ dùng để CHỌN TRẦN; chặn thật là ngân sách bên dưới.
  // Giữ tương thích cũ: gói chỉ có `sk: 1` thì coi là kỹ năng.
  const kind = Number.isFinite(m.k) ? Math.max(0, Math.min(3, m.k | 0)) : (m.sk === 1 ? 1 : 0);
  const isSkill = kind > 0;
  const isSuper = kind === 3;
  // TẦNG 2: đòn kỹ năng do CHÍNH NGƯỜI CHƠI gửi phải có một lần `cast` hợp lệ trong cửa sổ 2 giây.
  // Pet / bóng ma / phản đòn không đi qua cast (chúng không tiêu MP/hồi chiêu) nên được miễn.
  // Nếu client gửi `id`, phải khớp MỘT lần dùng gần đây (không chỉ lần cuối — nhiều nhát có thể còn rơi
  // sau khi đã bấm chiêu khác). Nếu không gửi id thì chấp nhận đòn trong cửa sổ (tương thích client cũ).
  // Bị từ chối cast gần đây → bỏ qua đòn trong CAST_DENY_MS.
  if (isSkill && m.src !== 'pet' && m.src !== 'shadow') {
    if (now < (g.castDenyUntil || 0)) return;
    const casts = g.recentCasts;
    if (!casts.length || now - casts[casts.length - 1].at > CAST_HIT_WINDOW_MS) return;
    if (m.id) {
      const want = String(m.id).slice(0, 40);
      if (!casts.some((c) => c.id === want && now - c.at <= CAST_HIT_WINDOW_MS)) return;
    }
  }
  // Hai ngân sách riêng: đánh thường và kỹ năng. Kỹ năng bắn nhiều đòn một lần nên cần ngân sách rộng hơn,
  // nhưng không được dùng chung với đánh thường (nếu không thì đánh thường thành cửa sau).
  if (now - g.hitAt >= 1000) { g.hitAt = now; g.hitN = 0; g.skillHitN = 0; }
  if (isSkill) {
    // Siêu tuyệt kỹ bắn ít đòn nhưng mỗi đòn rất lớn, nên đếm riêng để không giành hạn mức với kỹ năng thường.
    if (isSuper) { g.superHitN = (g.superHitN || 0) + 1; if (g.superHitN > MAX_SKILL_HITS_PER_SEC) return; }
    else if (++g.skillHitN > MAX_SKILL_HITS_PER_SEC) return;
  } else if (++g.hitN > MAX_HITS_PER_SEC) return;
  const mob = w.byUid.get(m.u | 0);
  if (!mob || !mob.alive) return;
  if (Math.abs(conn.x - mob.x) > 1100 || Math.abs(conn.y - mob.y) > 700) return;   // quá xa (đã gồm tầm bắn / thú đi theo)
  const dmg = Number(m.d);
  if (!(dmg >= 1)) return;
  // Bước trung gian: ngân sách đòn thường trên TỪNG QUÁI (chặn spam 1 quái bằng nhiều nhát). 
  if (!isSkill && !hitValidate.basicMobBudget(g.basicMobHits, m.u, now)) return;
  const f = (v, max) => (Number.isFinite(v) && v > 0 ? Math.min(v, max) : 0);
  const atk = Math.max(conn.atk || 30, 30);
  const capOf = (k) => {
    if (k === 3) return conn.capSuperUlt || atk * CAP_MUL_SUPERULT + 500;
    if (k === 2) return conn.capUlt || atk * CAP_MUL_ULT + 500;
    if (k === 1) return conn.capSkill || atk * CAP_MUL_SKILL + 500;
    return conn.capBasic || atk * CAP_MUL_BASIC + 50;
  };
  let cap = capOf(kind);
  // Trần tham chiếu gắn với skill THẬT đã cast (client sửa được cờ k, không sửa được lịch sử cast của server).
  // Chỉ áp cho skill/tuyệt kỹ/siêu tuyệt kỹ có id; đánh thường giữ nguyên trần CAP_MUL_BASIC.
  if (isSkill && m.id) {
    const cast = g.recentCasts.find((x) => x.id === String(m.id).slice(0, 40));
    const ref = cast ? hitValidate.skillCeiling(conn.atk, conn.skillMul, m.id, (conn.skillLevels || {})[cast.id], mob, now) : null;
    if (ref > 0) cap = Math.min(cap, ref);
  }
  // Cờ loại đòn do client gửi nên không đáng tin: kỹ năng còn bị ghì thêm bằng ngân sách SÁT THƯƠNG mỗi giây,
  // để giả cờ cũng không đổi được nhiều hơn một lượng nhỏ.
  if (isSkill) {
    if (isSuper) {
      // Ngân sách siêu tuyệt kỹ: cửa sổ trượt 60 giây, tối đa SUPERULT_USES_MAX lần dùng.
      // Đếm SỐ LẦN chứ không đếm sát thương — xem chú thích hằng số ở đầu file.
      // Một lần dùng siêu tuyệt kỹ bắn nhiều đòn (AoE nhiều quái) trong vài trăm ms, nên các đòn
      // trong cùng một đợt chỉ tính là MỘT lần. Đợt mới phải cách đợt trước ít nhất 1,5 giây —
      // ngắn hơn thì đó là cùng một lần dùng (đòn thứ 2, 3 của cùng AoE), không phải lần dùng mới.
      const newCast = !g.superCastAt || now - g.superCastAt >= 1500;
      if (newCast) {
        if (!g.superWinAt) { g.superUses = 0; g.superWinAt = now; }
        else {
          // Nạp lại theo tỉ lệ thời gian trôi qua: 60 giây hoàn lại đủ 2 lần.
          const add = ((now - g.superWinAt) / SUPERULT_WINDOW_MS) * SUPERULT_USES_MAX;
          g.superUses = Math.max(0, (g.superUses || 0) - add);
          g.superWinAt = now;
        }
        if (g.superUses >= SUPERULT_USES_MAX) return;
        g.superUses = (g.superUses || 0) + 1;
      }
      g.superCastAt = now;
    } else {
      const rate = atk * CAP_MUL_SKILL * SKILL_DMG_RATE_MUL;
      const pool = rate * SKILL_DMG_BURST_SEC;
      // Lần dùng kỹ năng đầu tiên phải có ngân sách đầy, nếu không đòn đầu tiên bị chặn oan.
      if (!g.skillDmgAt) { g.skillDmg = pool; g.skillDmgAt = now; }
      else {
        g.skillDmg = Math.min(pool, (g.skillDmg || 0) + ((now - g.skillDmgAt) / 1000) * rate);
        g.skillDmgAt = now;
      }
      if (g.skillDmg < 1) return;
      cap = Math.min(cap, g.skillDmg);
      g.skillDmg -= Math.min(dmg, cap);
    }
  }
  w.applyHit(mob, conn.id, {
    dmg: Math.min(dmg, cap), crit: m.c === 1,
    src: m.src === 'pet' || m.src === 'shadow' ? m.src : 'player', dir: m.dir === -1 ? -1 : 1,
    slow: f(m.slow, 6), freeze: f(m.freeze, 4), stun: f(m.stun, 2), knock: f(m.knock, 400),
  }, now);
}

const num = (v) => (Number.isFinite(v) && Math.abs(v) <= WORLD_BOUND ? Math.round(v) : null);

// ---------------------------------------------------------------- Lấy Mạng Đổi Mạng
// Đòn giết ngay: mục tiêu mất toàn bộ máu, người dùng cũng mất toàn bộ máu.
// Bùa Hộ Mệnh (hiệu ứng `undying` của trang bị đặc biệt) cứu NGƯỜI DÙNG lên 1 máu; quái không có bùa nên chết.
//
// Vì sao phải đi đường riêng thay vì để client gửi `hit` với dmg = máu quái:
//   - `onHit` có trần sát thương và ngân sách mỗi giây → trùm 925.000 máu không bao giờ lọt.
//   - Hồi chiêu phải do SERVER giữ, nếu không client sửa đồng hồ là dùng được liên tục.
//   - Cái giá (máu về 0) phải do server ghi, không tin client.
//
// Hồi chiêu bùa: client giữ `lastStandCd` cho đường bị quái đánh, nhưng server KHÔNG biết biến đó.
// Nên ở đây server giữ bộ đếm riêng `p.buaCd` (rơi vào section `misc` nên tự được lưu).
// Đánh đổi đã biết: nếu người chơi vừa được bùa cứu do quái đánh rồi dùng chiêu ngay, server vẫn cho
// bùa cứu lần nữa (tối đa mỗi 180 giây). Chặn tuyệt đối thì phải cho client làm nguồn sự thật về hồi
// chiêu, tức là mở lỗ lớn hơn — không đáng.
async function onExec(conn, m) {
  const w = conn.room && worlds.get(conn.room);
  if (!w) return;
  const now = Date.now();
  if (conn.dead && now - conn.deadAt > 1500) return;
  const mob = w.byUid.get(m.u | 0);
  if (!mob || !mob.alive) return;
  if (Math.abs(conn.x - mob.x) > 1100 || Math.abs(conn.y - mob.y) > 700) return;   // quá xa
  if (mob.def.passive) return;

  let buaUsed = false;
  let applied = false;
  let overLevel = false;
  await xplayer.mutate(conn.userId, (p) => {
    // Đã SỞ HỮU (trụ riêng p.superUlts) và ĐANG GẮN trên thanh. Thiếu một trong hai thì không dùng.
    if (!G.ownsSuperUlt(p, 'ulSinhTu')) return;
    if (!Array.isArray(p.skillSlots) || !p.skillSlots.includes('ulSinhTu')) return;
    if (now < (p.execCd || 0)) return;
    const sk = G.skillAt('ulSinhTu', G.SUPER_ULT_LEVEL);
    const st = G.calcStats(p, { form: !!p.formActive });
    // Bùa chỉ cứu khi ĐANG MẶC và chưa hồi chiêu. Client gửi cờ `bua` chỉ để đối chiếu, không tin.
    const fx = G.specialFx(p).undying;
    const bua = !!fx && m.bua === 1 && now >= (p.buaCd || 0);
    p.hp = bua ? 1 : 0;
    p.execCd = now + (sk.cd || 180) * 1000;
    if (bua) { p.buaCd = now + 60000; buaUsed = true; }
    // Mục tiêu cao hơn nhân vật TRÊN 20 cấp thì không gục ngay, chỉ mất 50% sinh lực tối đa.
    // Cái giá của người dùng chiêu không đổi: vẫn về 0 máu (Bùa giữ 1 máu).
    overLevel = !!sk.execOverLevel && (mob.def.level || 1) - (p.level || 1) > sk.execOverLevel;
    // Chết theo: dùng đúng luật chết của game (mất 5% kinh nghiệm, hồi sinh ở làng).
    // Gọi SAU khi đã ghi hp = 0 để không bị ghi đè.
    // Lưu bản đồ đang đứng để người chơi còn có thể chọn "Ở lại" sau khi die() đã đẩy về làng.
    if (!bua) {
      p.lastDeathMap = conn.map || p.map;
      gameActions.die(p, {}, []);
    }
    applied = true;
  }).catch((e) => console.error('Đổi mạng lỗi:', e.message));

  if (!applied) return;
  // Giết quái SAU khi nhân vật đã ghi xong: applyHit → die → hooks.kill → phiếu thưởng → client nhận mdie.
  // dmg = mob.hp nên máu về đúng 0, không phụ thuộc trần sát thương.
  // Mục tiêu trên 20 cấp: chỉ ăn 50% máu tối đa (kẹp theo máu còn lại để đòn vét vẫn hạ được).
  const dmg = overLevel ? Math.min(mob.hp, Math.round(mob.maxHp * 0.5)) : mob.hp;
  w.applyHit(mob, conn.id, { dmg, crit: true, src: 'player', dir: 1 }, now);
  if (buaUsed) send(conn, { t: 'sys', text: '🪬 Bùa Hộ Mệnh giữ bạn lại 1 máu. Hồi chiêu bùa 60 giây.' });
  if (overLevel) send(conn, { t: 'sys', text: `💀 Mục tiêu cao hơn bạn trên 20 cấp: chỉ mất 50% sinh lực, không gục.` });
}

// ===== Siêu tuyệt kỹ Tử Linh Dung Hợp =====
// Client chỉ báo "tôi dùng chiêu"; server tự kiểm class, đã học, đang gắn trên thanh, hồi chiêu, có bóng, đủ MP.
// Logic nằm ở combatActions.applyFusion (một chỗ duy nhất, dùng chung với action `fusion`).
async function onFusion(conn) {
  let msg = null;
  await xplayer.mutate(conn.userId, (p) => {
    // Đang gắn trên thanh kỹ năng mới dùng được — cùng luật với onExec.
    if (!Array.isArray(p.skillSlots) || !p.skillSlots.includes('ulTuLinhDungHop')) {
      msg = 'Kỹ năng chưa được gắn lên thanh.';
      return;
    }
    const r = combatActions.applyFusion(p);
    msg = r.ok ? r.text : r.msg;
  }).catch((e) => console.error('Dung hợp lỗi:', e.message));
  if (msg) send(conn, { t: 'sys', text: msg });
}


// ===== Siêu tuyệt kỹ Cấm Chú Giải Phóng =====
// Client đã tự vẽ vụ nổ và gửi đòn lên đường `hit` như kỹ năng thường (có trần sát thương + ngân sách).
// Ở đây server chỉ giữ HAI thứ mà client không được phép quyết:
//   - hồi chiêu (p.manaBurstCd), nếu không sửa đồng hồ là dùng liên tục;
//   - cái giá: đốt sạch MP và phong ấn hồi năng lượng `lockSec` giây (p.mpLock).
// Không tự tính sát thương ở đây: đòn đã đi qua onHit với trần CAP_MUL_SKILL, và MP thật do server
// đọc từ nhân vật nên không thể khai khống lượng MP đã đốt.
async function onManaBurst(conn) {
  const now = Date.now();
  let msg = null;
  await xplayer.mutate(conn.userId, (p) => {
    if (!Array.isArray(p.skillSlots) || !p.skillSlots.includes('ulPhapSuper')) {
      msg = 'Kỹ năng chưa được gắn lên thanh.';
      return;
    }
    if (!G.ownsSuperUlt(p, 'ulPhapSuper')) { msg = 'Bạn chưa sở hữu Cấm Chú Giải Phóng.'; return; }
    const sk = G.skillAt('ulPhapSuper', G.SUPER_ULT_LEVEL);
    if (now < (p.mpLock || 0)) { msg = `Cấm chú đang phong ấn năng lượng (còn ${Math.ceil((p.mpLock - now) / 1000)} giây).`; return; }
    if (now < (p.manaBurstCd || 0)) { msg = `Chưa hồi chiêu (còn ${Math.ceil((p.manaBurstCd - now) / 1000)} giây).`; return; }
    if ((p.mp || 0) < 50) { msg = 'Cần ít nhất 50 năng lượng để giải phóng.'; return; }
    p.mp = 0;
    p.mpLock = now + (sk.lockSec || 10) * 1000;
    p.manaBurstCd = now + (sk.cd || 90) * 1000;
    msg = `📕 Cấm Chú Giải Phóng: năng lượng phong ấn ${sk.lockSec || 10} giây.`;
  }).catch((e) => console.error('Cấm chú lỗi:', e.message));
  if (msg) send(conn, { t: 'sys', text: msg });
}


// ===== Siêu tuyệt kỹ Vạn Pháp Quy Nhất =====
// Client đã tung ba tuyệt kỹ chung và gửi đòn lên đường `hit` (có trần + ngân sách như mọi kỹ năng).
// Server giữ hai thứ client không được quyết: hồi chiêu (p.allinCd) và cái giá — phong ấn kỹ năng
// `lockSec` giây (p.skillLock). Client chặn ở useSkill, nhưng mốc thật nằm ở đây để đổi bản đồ
// hay hồi sinh cũng không xoá được.
async function onAllIn(conn) {
  const now = Date.now();
  let msg = null;
  await xplayer.mutate(conn.userId, (p) => {
    if (!Array.isArray(p.skillSlots) || !p.skillSlots.includes('ulToanNangSuper')) {
      msg = 'Kỹ năng chưa được gắn lên thanh.';
      return;
    }
    if (!G.ownsSuperUlt(p, 'ulToanNangSuper')) { msg = 'Bạn chưa sở hữu Vạn Pháp Quy Nhất.'; return; }
    const sk = G.skillAt('ulToanNangSuper', G.SUPER_ULT_LEVEL);
    if (now < (p.skillLock || 0)) { msg = `Kỹ năng đang bị phong ấn (còn ${Math.ceil((p.skillLock - now) / 1000)} giây).`; return; }
    if (now < (p.allinCd || 0)) { msg = `Chưa hồi chiêu (còn ${Math.ceil((p.allinCd - now) / 1000)} giây).`; return; }
    p.skillLock = now + (sk.lockSec || 60) * 1000;
    p.allinCd = now + (sk.cd || 240) * 1000;
    msg = `🌀 Vạn Pháp Quy Nhất: kỹ năng phong ấn ${sk.lockSec || 60} giây.`;
  }).catch((e) => console.error('Vạn pháp lỗi:', e.message));
  if (msg) send(conn, { t: 'sys', text: msg });
}


function onPos(conn, m) {
  const x = num(m.x), y = num(m.y);
  if (x === null || y === null) return;
  const mapId = typeof m.map === 'string' && G.MAPS && G.MAPS[m.map] ? m.map : null;
  if (!mapId) return;
  // Chống đổi bản đồ qua gói vị trí: bản đồ hợp lệ chỉ đổi được qua action change_map/teleport
  // (server đã sửa p.map và refreshLook đọc sang conn.serverMap trong vòng 5 giây).
  // Lần đầu vào phòng conn.serverMap chưa có thì cho đi, nhưng chỉ đúng map client khai.
  const trustedMap = conn.serverMap || mapId;
  if (mapId !== trustedMap) return;
  const now = Date.now();
  // `r=1` là gói xin vào lại phòng lúc dựng cảnh/hồi sinh. Trước đây client có thể gửi liên tục để
  // đổi khu bỏ qua CH_SWITCH_GAP_MS (farm quái respawn). Áp cùng mốc chờ như onChannel.
  const reenter = m.r === 1;
  if (reenter && now - (conn.chAt || 0) < CH_SWITCH_GAP_MS) return;
  if (reenter) conn.chAt = now;
  conn.x = x; conn.y = y;
  conn.f = m.f === -1 ? -1 : 1;
  conn.a = ANIMS.has(m.a) ? m.a : 'idle';
  if (Number.isFinite(m.h)) conn.hpPct = Math.max(0, Math.min(100, Math.round(m.h)));   // chỉ để hiển thị trong đội
  // Đang nằm chết: quái không nhắm vào nữa, và không nhận thêm đòn đánh quá 1,5 giây sau khi chết
  if (conn.a === 'dead') { if (!conn.dead) { conn.dead = true; conn.deadAt = Date.now(); trade.onDead(conn); } } else conn.dead = false;
  if (conn.map && conn.map !== mapId) trade.onMapChange(conn);
  if (conn.map !== mapId || reenter) { enterRoom(conn, mapId); return; }
  conn.dirty = true;
}

// Làm sạch tin chat: bỏ ký tự điều khiển, gộp khoảng trắng, chặn link, rút chuỗi lặp
function cleanChat(raw) {
  let s = String(raw || '').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  if (/(https?:|www\.|\b[\w-]+\.(com|net|org|vn|xyz|me|io|gg|tk|ml)\b)/i.test(s)) return null;
  s = s.replace(/(.)\1{5,}/gu, '$1$1$1$1$1');
  return Array.from(s).slice(0, CHAT_MAX_LEN).join('');
}

function onChat(conn, m) {
  const ch = m.ch === 'world' ? 'world' : m.ch === 'party' ? 'party' : 'map';
  const now = Date.now();
  const wait = CHAT_GAP_MS[ch] - (now - (conn.lastChat[ch] || 0));
  if (wait > 0) { send(conn, { t: 'sys', text: `Nói chậm thôi, đợi ${Math.ceil(wait / 1000)} giây nữa.` }); return; }
  const text = cleanChat(m.text);
  if (!text) { send(conn, { t: 'sys', text: 'Tin nhắn không hợp lệ (trống hoặc có đường link).' }); return; }
  if (!conn.map) { send(conn, { t: 'sys', text: 'Chưa vào bản đồ.' }); return; }
  if (ch === 'party') {
    if (!party.chat(conn, text)) { send(conn, { t: 'sys', text: 'Bạn chưa ở trong đội nào.' }); return; }
    conn.lastChat[ch] = now;
    return;
  }
  conn.lastChat[ch] = now;
  const msg = { t: 'chat', ch, id: conn.id, name: conn.name, text };
  if (ch === 'map') broadcast(conn.room, msg);
  else { const text2 = JSON.stringify(msg); for (const c of byUser.values()) sendRaw(c, text2); }
}

function onWho(conn) {
  const r = conn.room && rooms.get(conn.room);
  const list = r ? [...r.values()].map((c) => ({ name: c.name, lv: c.level, sc: c.school })) : [];
  send(conn, { t: 'who', map: conn.map, list, online: byUser.size });
}

function onMessage(conn, data) {
  const now = Date.now();
  if (now - conn.rateAt >= 1000) { conn.rateAt = now; conn.rateN = 0; }
  if (++conn.rateN > MAX_MSGS_PER_SEC) return;
  let m;
  try { m = JSON.parse(data.toString('utf8')); } catch { return; }
  if (!m || typeof m !== 'object') return;
  if (m.t === 'pos') onPos(conn, m);
  else if (m.t === 'chat') onChat(conn, m);
  else if (m.t === 'who') onWho(conn);
  else if (m.t === 'chlist') sendChannels(conn);
  else if (m.t === 'ch') onChannel(conn, m);
  else if (m.t === 'hit') onHit(conn, m);
  else if (m.t === 'cast') onCast(conn, m);
  else if (m.t === 'exec') onExec(conn, m).catch((e) => console.error('Đổi mạng lỗi:', e.message));
  else if (m.t === 'fusion') onFusion(conn).catch((e) => console.error('Dung hợp lỗi:', e.message));
  else if (m.t === 'manaburst') onManaBurst(conn).catch((e) => console.error('Cấm chú lỗi:', e.message));
  else if (m.t === 'allin') onAllIn(conn).catch((e) => console.error('Vạn pháp lỗi:', e.message));
  else if (m.t === 'fusion_end') xplayer.mutate(conn.userId, (p) => {
    if (p.fusion && p.fusion.until <= Date.now()) delete p.fusion;
  }).catch(() => {});
  else if (m.t === 'party_inv') party.invite(conn, m.to);
  else if (m.t === 'party_resp') party.respond(conn, m.ok === true);
  else if (m.t === 'party_leave') party.leave(conn);
  else if (m.t === 'party_kick') party.kick(conn, m.id);
  else if (m.t === 'party_lead') party.promote(conn, m.id);
  else if (m.t === 'trade_inv') trade.invite(conn, m.to);
  else if (m.t === 'trade_resp') trade.respond(conn, m.ok === true);
  else if (m.t === 'trade_set') trade.set(conn, m).catch((e) => console.error('Giao dịch lỗi:', e.message));
  else if (m.t === 'trade_lock') trade.lock(conn, m.on !== false).catch((e) => console.error('Giao dịch lỗi:', e.message));
  else if (m.t === 'trade_cancel') trade.cancel(conn);
}

function tick() {
  for (const [mapId, r] of rooms) {
    let list = null;
    for (const c of r.values()) {
      if (!c.dirty) continue;
      c.dirty = false;
      // Delta: chỉ gửi [id,x,y] khi hướng và hoạt ảnh không đổi so với lần gửi trước (tiết kiệm ~40% mỗi mục).
      // Gửi đủ [id,x,y,f,a] khi có đổi, và cứ SNAP_FULL_EVERY lần lại gửi đủ một lần để sửa mọi sai lệch
      // (người mới vào phòng nhận trạng thái đầy đủ qua gói 'room', nên không cần mốc riêng cho từng người).
      c.sn = (c.sn | 0) + 1;
      if (c.sf !== c.f || c.sa !== c.a || c.sn >= SNAP_FULL_EVERY) {
        c.sf = c.f; c.sa = c.a; c.sn = 0;
        (list = list || []).push([c.id, c.x, c.y, c.f, c.a]);
      } else (list = list || []).push([c.id, c.x, c.y]);
    }
    if (!list) continue;
    // Người vừa di chuyển không cần nhận lại chính vị trí của mình: client bỏ qua id lạ
    // (remote.js chỉ tra this.remotes, không có mình trong đó). Phòng chỉ có 1 người thì khỏi gửi.
    if (r.size < 2) continue;
    if (list.length === 1) broadcast(mapId, { t: 'snap', p: list }, list[0][0]);
    else broadcast(mapId, { t: 'snap', p: list });
  }
}

// Dàn đều: mỗi tick chỉ xử lý một batch conn, xoay vòng bằng con trỏ. Thay vì cứ 2 giây lại
// kiểm tra MỌI conn trong cùng một nhịp (spike khi đông), ta quét từng phần nhỏ cách nhau 500ms.
// Với batch 128: dưới 128 conn thì mọi conn được xét mỗi 500ms; 500 conn thì mỗi ~2s — vẫn sớm
// hơn chu kỳ 30s (session) và 5s (look), nên hành vi không đổi, chỉ giảm spike.
const MAINTAIN_BATCH = 128;
let maintainCursor = 0;

async function maintain() {
  combatGuard.prune();   // dọn bộ đếm cũ theo userId (O(64) mỗi nhịp 500ms)
  const conns = [...byUser.values()];
  if (!conns.length) return;
  const n = Math.min(MAINTAIN_BATCH, conns.length);
  for (let i = 0; i < n; i++) {
    const conn = conns[(maintainCursor + i) % conns.length];
    if (conn.ws.readyState !== 1) continue;
    const now = Date.now();
    if (now - conn.checkedAt >= SESSION_CHECK_MS) {
      conn.checkedAt = now;
      const s = await auth.getSession(conn.token);
      if (!s) { conn.ws.close(4003, 'session'); continue; }
    }
    if (now - conn.lookAt >= LOOK_REFRESH_MS) {
      conn.lookAt = now;
      if (await refreshLook(conn) && conn.room) broadcast(conn.room, { t: 'look', p: lookOf(conn) });
    }
  }
  maintainCursor = (maintainCursor + n) % conns.length;
}

function reject(socket, code, text) {
  socket.write(`HTTP/1.1 ${code} ${text}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  socket.destroy();
}

function attach(server) {
  wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MSG_BYTES, perMessageDeflate: false });

  server.on('upgrade', async (req, socket, head) => {
    try {
      if ((req.url || '').split('?')[0] !== PATH) return reject(socket, 404, 'Not Found');
      const cookieToken = cookies(req).ap_session;
      // App mobile (Godot) không gửi được custom header/Cookie lúc WS handshake → nhận token qua query.
      // Browser vẫn dùng cookie như cũ; origin check chỉ áp cho browser (cookie).
      let queryToken = '';
      try { queryToken = new URL(req.url, 'http://localhost').searchParams.get('token') || ''; } catch { /* bỏ qua */ }
      const token = cookieToken || queryToken;
      const origin = req.headers.origin;
      if (origin && cookieToken) {
        let host = '';
        try { host = new URL(origin).host; } catch { /* sai định dạng */ }
        if (host !== req.headers.host) return reject(socket, 403, 'Forbidden');
      }
      const session = await auth.getSession(token);
      if (!session) return reject(socket, 401, 'Unauthorized');
      wss.handleUpgrade(req, socket, head, (ws) => connect(ws, token, session));
    } catch (e) {
      console.error('WebSocket lỗi:', e.message);
      reject(socket, 500, 'Error');
    }
  });

  const ctx = { byId, byUser, send };
  party.init(ctx);
  trade.init(ctx);
  // Bản vá nhân vật do server đổi (giao dịch, chợ...) gửi thẳng cho client đang online
  xplayer.setPusher((userId, out) => {
    const c = byUser.get(userId);
    if (c) send(c, { t: 'patch', patch: out.patch, base: out.base, rev: out.rev, ev: out.events });
  });
  const social = setInterval(() => { try { party.tick(); trade.tick(); } catch (e) { console.error('Đội / giao dịch lỗi:', e.message); } }, 1000);
  social.unref();
  tickTimer = setInterval(() => timed('tick', tick), TICK_MS);
  tickTimer.unref();
  mobTimer = setInterval(() => { try { timed('mob', mobTick); } catch (e) { console.error('Quái lỗi:', e.message); } }, STEP_MS);
  mobTimer.unref();
  const m = setInterval(() => maintain().catch((e) => console.error('Realtime lỗi:', e.message)), 500);
  m.unref();
  const ping = setInterval(() => {
    for (const c of byUser.values()) {
      if (!c.alive) { c.ws.terminate(); continue; }
      c.alive = false;
      try { c.ws.ping(); } catch { /* bỏ qua */ }
    }
  }, PING_MS);
  ping.unref();
}

async function connect(ws, token, session) {
  const now = Date.now();
  const conn = {
    id: nextId++, ws, token, userId: session.userId,
    name: '?', school: null, level: 1, weapon: null,
    map: null, x: 0, y: 0, f: 1, a: 'idle', dirty: false, hpPct: 100,
    dmgCap: 5000, atk: 30, capBasic: 5000, capSkill: 20000, skillDmg: 0, skillDmgAt: now,
    hitAt: now, hitN: 0, skillHitN: 0, dead: false, deadAt: 0,
    // Chống spam: hồi chiêu do server giữ, bộ đếm số lần dùng, và cửa sổ đòn hợp lệ sau một lần cast.
    skillCds: {}, castN: { skill: 0, ult: 0, superUlt: 0 }, castWinAt: { skill: now, ult: now, superUlt: now },
    lastCastAt: 0, lastCastId: null, recentCasts: [], castDenyUntil: 0,
    skillLevels: {}, skillEquipped: [], gearSkillId: null, cdr: 0, skillMul: 1, basicMobHits: new Map(),
    alive: true, rateAt: now, rateN: 0, lastChat: {}, checkedAt: now, lookAt: now,
  };
  const old = byUser.get(conn.userId);
  if (old) { old.ws.close(4001, 'duplicate'); leaveRoom(old); }
  byUser.set(conn.userId, conn);
  byId.set(conn.id, conn);
  claims.setOnline(conn.userId, true);

  ws.on('pong', () => { conn.alive = true; });
  const close = () => {
    trade.onClose(conn);
    leaveRoom(conn);
    byId.delete(conn.id);
    if (byUser.get(conn.userId) === conn) { byUser.delete(conn.userId); claims.setOnline(conn.userId, false); party.onClose(conn); }
  };
  ws.on('close', close);
  ws.on('error', () => { /* 'close' sẽ dọn */ });

  // Đọc nhân vật xong mới nhận gói, để tên/class đã đúng khi vào phòng
  try { await refreshLook(conn); } catch (e) { console.error('Realtime đọc nhân vật lỗi:', e.message); }
  ws.on('message', (data) => { conn.alive = true; try { onMessage(conn, data); } catch (e) { console.error('Realtime gói lỗi:', e.message); } });
  send(conn, { t: 'hello', id: conn.id });
  party.onConnect(conn);
}

function close() {
  if (tickTimer) clearInterval(tickTimer);
  if (mobTimer) clearInterval(mobTimer);
  mobstore.stop();
  if (wss) for (const c of wss.clients) c.close(1001, 'shutdown');
}

// Ghi hết trạng thái quái đang chờ (gọi lúc tắt server, sau close()).
async function flushMobs() {
  for (const w of worlds.values()) if (w.dirty && w.ch === 1) { w.dirty = false; mobstore.markDirty(w.mapId, w.serialize()); }
  await mobstore.flush();
}

module.exports = { attach, close, flushMobs, initMobs: () => mobstore.init() };
