'use strict';
/* Sinh toàn bộ bản đồ nhiều tầng: shared/maps/<id>.txt
 *   node server/tools/gen-maps.js            → ghi tất cả bản đồ
 *   node server/tools/gen-maps.js rung hang  → chỉ các bản đồ nêu tên
 *
 * Bố cục sinh từ 4 kiểu địa hình (xem ARCH), số lượng quái / NPC / cổng lấy từ shared/data/maps.js + bản đồ cũ
 * (mỗi chữ quái giữ đúng số lượng cũ để nhịp nhiệm vụ không đổi). Mọi tầng cách nhau ≤ 3 ô (nhảy cao ~3,7 ô)
 * và cuối cùng có bước kiểm tra "đi tới được" cho mọi mặt đứng.
 * Ký hiệu thêm so với cũ: % thác nước (trang trí), " hồ nước nông (trang trí).
 */
const fs = require('fs');
const path = require('path');
const G_ = require('../../shared/index.js');
const MAPS = G_.MAPS, MONS = G_.MONSTERS;
const DIR = path.join(__dirname, '../../shared/maps');

// ---------------------------------------------------------------------------------- tiện ích
function rngOf(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
class Grid {
  constructor(W, H) { this.W = W; this.H = H; this.g = Array.from({ length: H }, () => Array(W).fill('.')); }
  get(r, c) { return r < 0 || r >= this.H || c < 0 || c >= this.W ? '#' : this.g[r][c]; }
  set(r, c, ch) { if (r >= 0 && r < this.H && c >= 0 && c < this.W) this.g[r][c] = ch; }
  fill(r0, r1, c0, c1, ch) { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) this.set(r, c, ch); }
  ledge(r, c0, c1) { for (let c = c0; c <= c1; c++) if (this.get(r, c) === '.' || this.get(r, c) === '%') this.set(r, c, '='); }
  empty(r, c) { return this.get(r, c) === '.'; }
  text() { return this.g.map(r => r.join('')).join('\n') + '\n'; }
}
const stand = (ch) => ch === '#' || ch === '=';

// Các hàng bục từ mặt đất lên tới đỉnh (cách nhau ≤ 3 ô): trả mảng hàng từ thấp lên cao
function stepRows(G, top) {
  const n = Math.max(1, Math.ceil((G - top) / 3)), out = [];
  for (let k = 1; k < n; k++) out.push(G - Math.round(k * (G - top) / n));
  return out;
}
// Bậc thang zig-zag cạnh một vách: side = -1 (bên trái vách) | +1 (bên phải); edge = cột mép vách
function stairs(g, side, edge, G, top, rng) {
  const rows = stepRows(G, top);
  rows.forEach((r, i) => {
    const near = (rows.length - 1 - i) % 2 === 0;           // bục sát vách ở trên cùng
    const off = near ? 2 : 8;
    const c1 = side < 0 ? edge - off : edge + off + 4, c0 = side < 0 ? edge - off - 4 : edge + off;
    g.ledge(r, Math.min(c0, c1), Math.max(c0, c1));
  });
}
// Bậc zig-zag trong khe giữa hai tháp (c0..c1 = ô trống của khe)
function gapStairs(g, c0, c1, G, top) {
  const rows = stepRows(G, top), w = c1 - c0 + 1, bw = Math.max(4, Math.floor(w / 2) - 1);
  rows.forEach((r, i) => {
    const left = (rows.length - 1 - i) % 2 === 1;           // bục cuối cùng sát tháp phải
    g.ledge(r, left ? c0 + 1 : c1 - bw, left ? c0 + bw : c1 - 1);
  });
}
function tower(g, a, b, top, G, dir) {
  for (let r = top; r < G; r++) {
    const seg = Math.floor(r / 3);
    const out = r < top + 2 ? 1 : (r > G - 6 ? 0 : (seg * 7 + a) % 2), inn = (seg * 5 + b) % 3 === 0 ? 1 : 0;
    if (dir > 0) g.fill(r, r, a + out, b - inn, '#'); else g.fill(r, r, a + inn, b - out, '#');
  }
}
// Đảo nổi dày 3 ô, bục hai bên để leo lên (bục cao hơn mặt đảo 0, thấp hơn 3 ô)
function island(g, top, c0, c1, withLedges = true) {
  g.fill(top, top + 2, c0, c1, '#');
  g.fill(top + 2, top + 2, c0, c0, '.'); g.fill(top + 2, top + 2, c1, c1, '.');   // đáy bo tròn
  if (withLedges) { g.ledge(top + 3, c0 - 6, c0 - 2); g.ledge(top + 3, c1 + 2, c1 + 6); }
}

// ---------------------------------------------------------------------------------- 4 kiểu địa hình
const ARCH = {
  // Hai tháp đá + khe giữa (thác / hồ / bậc), bậc thang hai phía ngoài, tầng cao trên đỉnh
  towers(g, o, rng) {
    const { W, G } = g, top = o.top || 10, tw = o.tw || 12, gap = o.gap || 11;
    const mid = Math.floor(W / 2), a1 = mid - Math.floor(gap / 2) - tw, b1 = a1 + tw - 1, a2 = b1 + gap + 1, b2 = a2 + tw - 1;
    tower(g, a1, b1, top, G, 1); tower(g, a2, b2, top, G, -1);
    const c0 = b1 + 1, c1 = a2 - 1;
    if (o.gapMode === 'falls') {
      const wc = Math.floor((c0 + c1) / 2);
      g.fill(0, G - 1, wc - 2, wc + 2, '%'); g.fill(G - 2, G - 1, c0, c1, '"');
    } else if (o.gapMode === 'pond') g.fill(G - 1, G - 1, c0, c1, '"');
    gapStairs(g, c0, c1, G, top);
    stairs(g, -1, a1, G, top, rng); stairs(g, 1, b2, G, top, rng);
    g.ledge(top - 3, a1 + 2, a1 + 7); g.ledge(top - 3, b2 - 7, b2 - 2);   // tầng cao trên đỉnh
    o._tops = [top];
  },
  // Sườn núi bậc thang: thấp → cao → đỉnh phẳng → thấp, thêm bục lơ lửng; boss ở đỉnh
  terraces(g, o, rng) {
    const { W, G } = g, steps = o.steps || 4, sh = 2, plat = o.plat || 16, mid = Math.floor(W / 2);
    const ps = Math.floor(mid - plat / 2), pe = Math.floor(mid + plat / 2);        // đỉnh phẳng
    const sw = Math.max(5, Math.floor((ps - 16) / steps)), left0 = ps - steps * sw;
    const hAt = (c) => {
      if (c >= ps && c <= pe) return (steps + 1) * sh;
      if (c < ps && c >= left0) return (Math.floor((c - left0) / sw) + 1) * sh;
      if (c > pe && c <= pe + steps * sw) return (steps - Math.floor((c - pe - 1) / sw)) * sh;
      return 0;
    };
    for (let c = 0; c < W; c++) { const h = hAt(c); if (h) g.fill(G - h, G - 1, c, c, '#'); }
    const topRow = G - (steps + 1) * sh;
    for (let k = 0; k < steps; k++) {     // bục lơ lửng trên mỗi bậc (cao hơn mặt bậc 3 ô)
      const row = G - (k + 1) * sh - 3, cl = left0 + k * sw + 1, cr = pe + 1 + (steps - 1 - k) * sw;
      if (k % 2 === 0) { g.ledge(row, cl, cl + Math.min(6, sw - 2)); g.ledge(row, cr, cr + Math.min(6, sw - 2)); }
    }
    g.ledge(topRow - 3, ps + 1, ps + 6); g.ledge(topRow - 3, pe - 6, pe - 1);
    g.ledge(topRow - 6, mid - 4, mid + 4);
    o._summit = { r: topRow, c0: ps, c1: pe };
  },
  // Hang nhiều tầng: trần nhũ đá, 3 tầng sàn đá dày có cột chống, bục nối
  caverns(g, o, rng) {
    const { W, H, G } = g;
    g.fill(0, 2, 0, W - 1, '#');
    for (let c = 0; c < W; c++) { const d = Math.floor(rng() * 3); if (c % 4 === 0 || d === 2) g.fill(3, 3 + (d % 2), c, c + 2, '#'); }
    const s1 = G - 6, s2 = G - 12, s3 = G - 18;
    const L = [Math.floor(W * 0.12), Math.floor(W * 0.4)], R = [Math.floor(W * 0.58), Math.floor(W * 0.88)];
    // Cột chống dừng cách mặt đất 2 ô (chừa cửa cho người đi vào): cột chạm đất sẽ biến gầm khối đá thành phòng kín, quái bên trong không đánh được
    const slab = (top, c0, c1) => { g.fill(top, top + 2, c0, c1, '#'); g.fill(top + 3, G - 3, c0, c0 + 2, '#'); g.fill(top + 3, G - 3, c1 - 2, c1, '#'); };
    slab(s1, L[0], L[1]); slab(s1, R[0], R[1]);
    const m0 = Math.floor(W * 0.32), m1 = Math.floor(W * 0.68);
    g.fill(s2, s2 + 2, m0, m1, '#');
    g.ledge(G - 3, L[0] - 6, L[0] - 2); g.ledge(G - 3, R[1] + 2, R[1] + 6);
    g.ledge(G - 3, L[1] + 3, L[1] + 7); g.ledge(G - 3, R[0] - 7, R[0] - 3);
    g.ledge(s1 - 3, m0 - 6, m0 - 2); g.ledge(s1 - 3, m1 + 2, m1 + 6);
    g.ledge(s2 - 3, m0 + 3, m0 + 9); g.ledge(s2 - 3, m1 - 9, m1 - 3);
    g.ledge(s3, Math.floor(W / 2) - 5, Math.floor(W / 2) + 5);
    g.ledge(s3 + 3, m0 + 12, m0 + 16); g.ledge(s3 + 3, m1 - 16, m1 - 12);
  },
  // Đảo nổi 3 lớp so le trên nền đất
  skyislands(g, o, rng) {
    const { W, G } = g, iw = o.iw || 11;
    const layers = o.layers || 3;
    for (let L = 1; L <= layers; L++) {
      const top = G - 6 * L;
      const n = Math.max(1, Math.floor((W - 20) / (iw + 12 + 8 * (L - 1))) + (L === 1 ? 0 : -0));
      const span = (W - 24) / n;
      for (let i = 0; i < n; i++) {
        const c0 = Math.floor(14 + i * span + ((L - 1) % 2) * (span / 2) - (L % 2 === 0 ? 0 : 0));
        if (c0 < 10 || c0 + iw > W - 10) continue;
        island(g, top, c0, c0 + iw - 1);
      }
    }
    // chắc chắn có đảo lớp cao nhất để thêm chỗ boss / thưởng
  },
};

// ---------------------------------------------------------------------------------- đặt quái, NPC, trang trí
const pass = (g, r, c) => { const ch = g.get(r, c); return !stand(ch) && ch !== '#'; };
function surfaces(g) {
  const runs = [];
  for (let r = 2; r < g.H - 1; r++) {
    let c = 0;
    while (c < g.W) {
      if (stand(g.get(r, c)) && pass(g, r - 1, c) && pass(g, r - 2, c)) {
        let e = c;
        while (e + 1 < g.W && stand(g.get(r, e + 1)) && pass(g, r - 1, e + 1) && pass(g, r - 2, e + 1)) e++;
        if (e - c + 1 >= 3) runs.push({ r, c0: c, c1: e, len: e - c + 1 });
        c = e + 1;
      } else c++;
    }
  }
  return runs;
}
// Kiểm tra đi tới được: nút = mặt đứng; cạnh khi nhảy lên ≤ 3 hàng với khoảng hở ≤ 2 cột, hoặc rơi xuống (hở ≤ 4 cột)
function reachable(g, runs, startRun) {
  const seen = new Set([startRun]), q = [startRun];
  while (q.length) {
    const a = q.pop();
    for (const b of runs) {
      if (seen.has(b)) continue;
      const overlap = Math.max(a.c0, b.c0) <= Math.min(a.c1, b.c1);
      const horiz = overlap ? 0 : Math.max(a.c0, b.c0) - Math.min(a.c1, b.c1) - 1;
      const up = a.r - b.r;                                   // >0: b cao hơn a
      const ok = up > 3 ? false : up >= -99 && (up > 0 ? horiz <= 2 : horiz <= 4);
      // lên cao: phải không bị khối đặc chắn ngay trên bục (đã đảm bảo bởi empty(r-1,r-2))
      if (ok && (up <= 0 || overlap || horiz <= 2)) { seen.add(b); q.push(b); }
    }
  }
  return seen;
}

function pick(arr, n, rng) {     // n phần tử rải đều theo thứ tự cột
  if (!arr.length || n <= 0) return [];
  const s = arr.slice().sort((x, y) => x.c - y.c), out = [];
  for (let i = 0; i < n; i++) out.push(s[Math.min(s.length - 1, Math.floor((i + 0.2 + rng() * 0.6) * s.length / n))]);
  return out;
}

function build(id, spec, counts) {
  const meta = MAPS[id], rng = rngOf(id);
  const W = spec.W, H = spec.H, g = new Grid(W, H); g.G = H - 4;
  const G = g.G;
  g.fill(G, H - 1, 0, W - 1, '#');
  ARCH[spec.arch](g, spec, rng);
  // ---- cổng, điểm xuất hiện, NPC trên mặt đất
  const ports = Object.keys(meta.portals || {});
  if (ports.includes('<')) g.set(G - 1, 1, '<');
  g.set(G - 1, 4, 'S');
  const gate = meta.gate, hasNext = ports.includes('>') || !!gate;      // bản đồ có gate: các lối ra gộp thành một cổng ở cuối đường
  if (hasNext) g.set(G - 1, W - 3, gate || '>');
  // cổng nhánh (ký hiệu khác < >): đặt trên mặt đất, từ phải sang trái, cách nhau ≥ 5 cột
  const portalCols = [];
  (gate ? [] : ports.filter(c => c !== '<' && c !== '>')).forEach((ch, i) => {
    for (let c = W - 9 - i * 6; c > 14; c--) {
      if (g.get(G, c) === '#' && [-1, 0, 1].every(d => g.get(G - 1, c + d) === '.' && g.get(G - 2, c + d) === '.') && !portalCols.some(x => Math.abs(x - c) < 5)) { g.set(G - 1, c, ch); portalCols.push(c); break; }
    }
  });
  const npcs = Object.keys(meta.npcs || {});
  const far = new Set(spec.npcFar || []), near = npcs.filter(ch => !far.has(ch));
  near.forEach((ch, i) => g.set(G - 1, 8 + i * 5, ch));
  const npcEnd = 8 + near.length * 5;
  // NPC "nằm sâu" (ví dụ thợ săn bị giam): rải ở nửa sau bản đồ, trên mặt đất trống
  (spec.npcFar || []).forEach((ch, i) => {
    const free = (c) => g.get(G, c) === '#' && g.get(G - 1, c) === '.' && g.get(G - 2, c) === '.' && ![-1, 1].some(d => /[A-Z]/.test(g.get(G - 1, c + d)));
    let placed = false;
    for (let c = Math.floor(W * 0.5) + i * 7; c < W - 12 && !placed; c++) if (free(c)) { g.set(G - 1, c, ch); placed = true; }
    for (let c = W - 14; c > 14 && !placed; c--) if (free(c)) { g.set(G - 1, c, ch); placed = true; }
  });
  // ---- quái
  const runs = surfaces(g);
  const okCell = (r, c) => {
    if (r === G && (c < Math.max(11, npcEnd + 2) || (hasNext && c > W - 9) || portalCols.some(x => Math.abs(c - x) < 6))) return false;
    return true;
  };
  const pos = [];
  for (const run of runs) for (let c = run.c0 + 1; c <= run.c1 - 1; c += 3) if (okCell(run.r, c)) pos.push({ r: run.r, c });
  const heights = pos.map(p => G - p.r).sort((x, y) => x - y), med = heights[Math.floor(heights.length / 2)] || 0;
  const low = pos.filter(p => G - p.r <= med), high = pos.filter(p => G - p.r > med);
  const used = new Set(), free = (p) => !used.has(p.r + ',' + p.c);
  const place = (list, ch, n) => {
    const fl = MONS[meta.spawns[ch]] && MONS[meta.spawns[ch]].fly;
    let cand = list.filter(free); if (cand.length < n) cand = pos.filter(free);
    for (const p of pick(cand, n, rng)) {
      let r = p.r - 1;
      if (fl && g.empty(p.r - 3, p.c)) r = p.r - 3;
      used.add(p.r + ',' + p.c); used.add(p.r + ',' + (p.c + 1)); used.add(p.r + ',' + (p.c - 1));
      g.set(r, p.c, ch);
    }
  };
  // boss 'z': đỉnh núi (terraces) hoặc cuối đường
  if (counts.z) {
    let p;
    if (spec._summit) p = { r: spec._summit.r, c: Math.floor((spec._summit.c0 + spec._summit.c1) / 2) };
    else p = { r: G, c: W - Math.floor(W * 0.16) };
    g.set(p.r - 1, p.c, 'z'); used.add(p.r + ',' + p.c);
  }
  const letters = Object.keys(counts).filter(k => /[a-y]/.test(k)).sort();
  letters.forEach((ch, i) => {
    const n = counts[ch];
    place(letters.length === 1 ? pos : (i === 0 ? low : i === 1 ? high : pos), ch, n);
  });
  // ---- trang trí
  const free2 = runs.filter(r => r.len >= 4);
  const deco = (ch, n, pred) => {
    const cand = [];
    for (const run of free2) for (let c = run.c0 + 1; c < run.c1; c++) if ((!pred || pred(run, c)) && g.empty(run.r - 1, c)) cand.push({ r: run.r, c });
    for (const p of pick(cand, Math.min(n, cand.length), rng)) if (g.empty(p.r - 1, p.c)) g.set(p.r - 1, p.c, ch);
  };
  if (counts['&']) deco('&', Math.min(counts['&'] + 6, 22), (run, c) => g.get(run.r, c) === '#');
  if (counts['$']) deco('$', counts['$'], (run) => run.r === G);
  if (counts['!']) deco('!', Math.min(counts['!'], 14));
  const ceil = [];
  for (let r = 1; r < H - 1; r++) for (let c = 0; c < W; c++) if (g.get(r, c) === '.' && g.get(r - 1, c) === '#' && r < G - 8) ceil.push({ r, c });
  if (counts['^']) {
    const n = counts['^'] + 4;
    if (ceil.length > 10) for (const p of pick(ceil, Math.min(n + 6, ceil.length), rng)) g.set(p.r, p.c, '^');
    else deco('^', Math.min(counts['^'], 4), (run) => run.r === G);
  }
  // ---- kiểm tra đi tới được từ điểm xuất hiện
  const rr = surfaces(g), start = rr.find(r => r.r === G && r.c0 <= 4 && r.c1 >= 4);
  const seen = reachable(g, rr, start), bad = rr.filter(r => !seen.has(r) && r.len >= 4);
  return { text: g.text(), bad };
}

// ---------------------------------------------------------------------------------- bảng cấu hình từng bản đồ
// W = số cột gốc (nhân 1,5 khi chạy), H = số hàng. Kiểu khác nhau để các bản đồ không giống nhau.
const SPECS = {
  lang:           { arch: 'village', W: 104 },
  tan_do_2:       { arch: 'village', W: 104 },
  tan_do_3:       { arch: 'village', W: 104 },
  tan_do_4:       { arch: 'village', W: 104 },
  tan_do_bt:      { arch: 'village', W: 104 },
  tan_do_6:       { arch: 'village', W: 104 },
  tan_do_7:       { arch: 'village', W: 104 },
  cong_do:        { arch: 'skyislands', W: 64, H: 26, layers: 2, iw: 10 },
  rung:           { arch: 'towers', W: 110, H: 34, top: 10, tw: 12, gap: 11, gapMode: 'falls' },
  hang:           { arch: 'caverns', W: 96, H: 32 },
  b_en_pha:       { arch: 'towers', W: 96, H: 30, top: 9, tw: 11, gap: 13, gapMode: 'pond' },
  d_lay_muc:      { arch: 'terraces', W: 96, H: 30, steps: 3, sw: 10, plat: 18 },
  lang_chai:      { arch: 'towers', W: 96, H: 30, top: 12, tw: 13, gap: 12 },
  cc_hac_nguyet:  { arch: 'caverns', W: 92, H: 32 },
  tp_chim_t:      { arch: 'skyislands', W: 96, H: 30, layers: 3, iw: 12 },
  tp_chim_c:      { arch: 'caverns', W: 96, H: 32, npcFar: ['A', 'B', 'C', 'D', 'E'] },
  ham_ngam:       { arch: 'caverns', W: 80, H: 28 },
  thien_khoi_1: { arch: 'terraces', W: 100, H: 32, steps: 3, sw: 9, plat: 16 },
  thien_khoi_2: { arch: 'towers', W: 100, H: 30, top: 10, tw: 12, gap: 12, gapMode: 'zig' },
  thien_khoi_3: { arch: 'caverns', W: 96, H: 32 },
  thien_khoi_4: { arch: 'skyislands', W: 96, H: 30, layers: 3, iw: 12 },
  long_mach_1: { arch: 'terraces', W: 100, H: 32, steps: 3, sw: 9, plat: 16 },
  long_mach_2: { arch: 'towers', W: 100, H: 30, top: 10, tw: 12, gap: 12, gapMode: 'zig' },
  long_mach_3: { arch: 'caverns', W: 96, H: 32, npcFar: ['A', 'B', 'C'] },
  long_mach_4: { arch: 'skyislands', W: 96, H: 30, layers: 3, iw: 12 },
  tinh_van_1: { arch: 'terraces', W: 100, H: 32, steps: 3, sw: 9, plat: 16 },
  tinh_van_2: { arch: 'towers', W: 100, H: 30, top: 10, tw: 12, gap: 12, gapMode: 'zig' },
  tinh_van_3: { arch: 'caverns', W: 96, H: 32, npcFar: ['A', 'B', 'C', 'D'] },
  tinh_van_4: { arch: 'skyislands', W: 96, H: 30, layers: 3, iw: 12 },
  than_mong_1: { arch: 'terraces', W: 100, H: 32, steps: 3, sw: 9, plat: 16 },
  than_mong_2: { arch: 'towers', W: 100, H: 30, top: 10, tw: 12, gap: 12, gapMode: 'zig' },
  than_mong_3: { arch: 'caverns', W: 96, H: 32 },
  than_mong_4: { arch: 'skyislands', W: 96, H: 30, layers: 3, iw: 12 },
  sang_the_1: { arch: 'terraces', W: 100, H: 32, steps: 3, sw: 9, plat: 16 },
  sang_the_2: { arch: 'towers', W: 100, H: 30, top: 10, tw: 12, gap: 12, gapMode: 'zig', npcFar: ['A', 'B', 'C'] },
  sang_the_3: { arch: 'caverns', W: 96, H: 32 },
  sang_the_4: { arch: 'skyislands', W: 96, H: 30, layers: 3, iw: 12, npcFar: ['W'] },
  quan_thuong_mai: { arch: 'towers', W: 96, H: 26, top: 10, tw: 12, gap: 12 },
  chan_nui:       { arch: 'terraces', W: 100, H: 32, steps: 4, sw: 9, plat: 16 },
  hem_nui:        { arch: 'caverns', W: 92, H: 32 },
  lo_ren_bang:    { arch: 'towers', W: 96, H: 30, top: 10, tw: 12, gap: 11, gapMode: 'zig' },
  dinh_nui:       { arch: 'terraces', W: 104, H: 34, steps: 5, sw: 8, plat: 14 },
  kho_bac:        { arch: 'caverns', W: 96, H: 32 },
  vac_da:         { arch: 'towers', W: 100, H: 30, top: 12, tw: 14, gap: 11 },
  cong_khai_hoan: { arch: 'towers', W: 104, H: 32, top: 11, tw: 13, gap: 13 },
  quang_truong:   { arch: 'towers', W: 100, H: 30, top: 12, tw: 12, gap: 12 },
  thu_vien:       { arch: 'caverns', W: 92, H: 32 },
  phong_luu_tru:  { arch: 'caverns', W: 96, H: 32 },
  dinh_thap:      { arch: 'terraces', W: 96, H: 34, steps: 5, sw: 8, plat: 14 },
  cau_dan:        { arch: 'skyislands', W: 96, H: 30, layers: 3, iw: 11 },
  sanh_cho:       { arch: 'towers', W: 110, H: 30, top: 12, tw: 13, gap: 12 },
  dinh_cong_vh:   { arch: 'terraces', W: 96, H: 32, steps: 4, sw: 9, plat: 16 },
  tam_diem:       { arch: 'caverns', W: 96, H: 32 },
  cong_ss:        { arch: 'skyislands', W: 100, H: 30, layers: 3, iw: 11 },
  thien_khoi:     { arch: 'terraces', W: 88, H: 30, steps: 3, sw: 10, plat: 16 },
  long_mach:      { arch: 'caverns', W: 88, H: 30 },
  tinh_van:       { arch: 'skyislands', W: 88, H: 30, layers: 3, iw: 10 },
  than_mong:      { arch: 'terraces', W: 88, H: 30, steps: 3, sw: 10, plat: 16 },
  sang_the:       { arch: 'skyislands', W: 88, H: 30, layers: 3, iw: 10 },
};

// Đếm ký hiệu của bản đồ cũ (đọc từ git nếu đã bị ghi đè: lưu cache trong assets_raw/map_counts.json)
const CACHE = path.join(__dirname, '../../assets_raw/map_counts.json');
function readCounts() {
  if (fs.existsSync(CACHE)) return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const out = {};
  for (const id in MAPS) {
    const t = fs.readFileSync(path.join(DIR, id + '.txt'), 'utf8'), c = {};
    for (const ch of t) if (/[a-zA-Z>]/.test(ch) || '^&$!'.includes(ch)) c[ch] = (c[ch] || 0) + 1;
    out[id] = c;
  }
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(out, null, 1));
  return out;
}

// Tân Đô (làng an toàn): hàng mặt đất theo thứ tự  < S  NPC…  cổng nhánh…  >  rồi các tầng mái nhà / bục phía trên
function buildVillage(id, spec, counts) {
  const meta = MAPS[id], W = spec.W, H = 24, G = 20, g = new Grid(W, H);
  g.fill(G, H - 1, 0, W - 1, '#');
  const ports = Object.keys(meta.portals || {});
  if (ports.includes('<')) g.set(G - 1, 1, '<');
  g.set(G - 1, 4, 'S');
  if (meta.gate || ports.includes('>')) g.set(G - 1, W - 3, meta.gate || '>');
  const items = Object.keys(meta.npcs || {}).concat(meta.gate ? [] : ports.filter(c => c !== '<' && c !== '>'));
  const hasMobs = Object.keys(meta.spawns || {}).length > 0, last = W - (hasMobs ? 30 : 12), first = 9;
  const step = items.length > 1 ? Math.max(5, Math.min(8, Math.floor((last - first) / (items.length - 1)))) : 0;
  items.forEach((ch, i) => g.set(G - 1, first + i * step, ch));
  // quái (bãi hình nhân ở Tân Đô I)
  for (const ch of Object.keys(meta.spawns || {})) for (let i = 0; i < Math.max(1, counts[ch] || 3); i++) g.set(G - 1, W - 26 + i * 6, ch);
  // tầng trên: bậc thang bục + mái cao ở giữa
  const mid = Math.floor(W / 2), ch = [[17, 10, 18], [14, 20, 28], [11, 30, 38], [8, mid - 8, mid + 3], [11, mid + 6, mid + 14], [14, mid + 16, mid + 24], [17, mid + 26, mid + 34], [17, 34, 42], [14, W - 20, W - 12], [17, W - 18, W - 12]];
  for (const [r, a, b] of ch) g.ledge(r, Math.max(1, a), Math.min(W - 2, b));
  g.fill(8, 9, mid - 4, mid + 2, '#');
  for (const [c, r] of [[12, 16], [24, 13], [mid - 2, 7], [mid + 10, 10], [mid + 20, 13], [mid + 30, 16], [W - 16, 13]]) if (g.empty(r, c)) g.set(r, c, '!');
  const rr = surfaces(g), start = rr.find(r => r.r === G && r.c0 <= 4 && r.c1 >= 4), seen = reachable(g, rr, start);
  return { text: g.text(), bad: rr.filter(r => !seen.has(r) && r.len >= 4) };
}

if (require.main === module) {
  const COUNTS = readCounts();
  const want = process.argv.slice(2), ids = Object.keys(SPECS).filter(id => !want.length || want.includes(id));
  for (const id of ids) {
    const { text, bad } = (SPECS[id].arch === 'village' ? buildVillage : build)(id, SPECS[id], COUNTS[id] || {});
    fs.writeFileSync(path.join(DIR, id + '.txt'), text);
    console.log(id.padEnd(15), SPECS[id].arch.padEnd(11), bad.length ? 'KHÔNG TỚI ĐƯỢC: ' + bad.map(b => `r${b.r}c${b.c0}-${b.c1}`).join(' ') : 'ok');
  }
}
module.exports = { build, SPECS };
