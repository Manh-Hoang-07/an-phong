'use strict';
/* Sinh toàn bộ bản đồ nhiều tầng: shared/maps/<id>.txt
 *   node server/tools/gen/gen-maps.js            → ghi tất cả bản đồ
 *   node server/tools/gen/gen-maps.js rung hang  → chỉ các bản đồ nêu tên
 *
 * Bố cục sinh từ 4 kiểu địa hình (xem ARCH), số lượng quái / NPC / cổng lấy từ shared/data/maps/ + bản đồ cũ
 * (mỗi chữ quái giữ đúng số lượng cũ để nhịp nhiệm vụ không đổi). Mọi tầng cách nhau ≤ 3 ô (nhảy cao ~3,7 ô)
 * và cuối cùng có bước kiểm tra "đi tới được" cho mọi mặt đứng.
 * Ký hiệu thêm so với cũ: % thác nước (trang trí), " hồ nước nông (trang trí).
 */
const fs = require('fs');
const path = require('path');
const G_ = require('../../../shared/index.js');
const MAPS = G_.MAPS, MONS = G_.MONSTERS;
const DIR = path.join(__dirname, '../../../shared/maps');

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
    // Bục trên cùng: thêm bục sát tháp bên kia để từ khe leo ngược lại được lên đỉnh cả hai tháp (không có thì chỉ đi một chiều)
    if (i === rows.length - 1) g.ledge(r, left ? c1 - bw : c0 + 1, left ? c1 - 1 : c0 + bw);
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

  // Hàng cột đá: nhiều cột thấp cao khác nhau xếp đều (nhìn như hàng cột / răng cưa nhỏ).
  // Cột cao ≤ 3 ô nên nhảy tới trực tiếp từ mặt đất, ground luôn thông suốt.
  columns(g, o, rng) {
    const { W, G } = g, n = o.n || 9, span = (W - 22) / n;
    for (let i = 0; i < n; i++) {
      const c0 = Math.floor(12 + i * span), w = 2 + Math.floor(rng() * 3);
      const h = 2 + Math.floor(rng() * 2);                 // 2–3 ô
      if (c0 + w >= W - 6) continue;
      g.fill(G - h, G - 1, c0, c0 + w - 1, '#');
    }
    // vài cột cao hơn có bục đệm để vẫn leo được
    for (let i = 0; i < Math.floor(n / 3); i++) {
      const c0 = Math.floor(14 + i * span * 3);
      if (c0 + 5 >= W - 8) continue;
      g.fill(G - 5, G - 1, c0, c0 + 3, '#');
      g.ledge(G - 3, c0 - 3, c0 - 1);
      g.ledge(G - 3, c0 + 4, c0 + 6);
    }
  },

  // Dốc hình thang: bậc tăng dần tới giữa rồi GIẢM dần về cuối → đi lên đỉnh rồi đi xuống cổng, leo ngược lại được.
  // (Dốc đơn trước đó tạo đoạn cuối cao không quay lại được = đúng lỗi "kẹt cuối map".)
  ramp(g, o, rng) {
    const { W, G } = g, sw = o.sw || 8, maxH = o.maxH || 12;
    const steps = Math.max(4, Math.floor((W - 24) / sw));
    const up = Math.ceil(steps / 2);
    const height = (s) => {
      const k = s < up ? s + 1 : steps - s;                 // 1..up..1
      return Math.min(maxH, k * 2);
    };
    for (let s = 0; s < steps; s++) {
      const h = height(s), c0 = 12 + s * sw, c1 = Math.min(W - 3, c0 + sw - 1);
      g.fill(G - h, G - 1, c0, c1, '#');
      if (h >= 4) g.ledge(G - h - 1, c0 + 1, c1 - 1);       // bục sát mặt bậc (cao 1 ô)
    }
    const peak = Math.min(maxH, up * 2);
    o._summit = { r: G - peak, c0: 12 + (up - 1) * sw, c1: Math.min(W - 3, 12 + up * sw - 1) };
  },

  // Nhà nhiều tầng: các sàn ngang xếp chồng cách nhau 3 ô (nhảy tới trực tiếp), lỗ mở ngẫu nhiên theo map.
  floors(g, o, rng) {
    const { W, G } = g, levels = o.levels || 3;
    for (let L = 1; L <= levels; L++) {
      const r = G - L * 3;
      const gap = 10 + Math.floor(rng() * (W - 30));      // vị trí lỗ mở riêng cho mỗi map/tầng
      g.ledge(r, 6, Math.max(6, gap - 2));
      g.ledge(r, gap + 4, W - 7);
    }
  },

  // Hố sâu + cầu: mặt đất có vài hố, bắc cầu ngang, thêm bục nổi → nhìn khác hẳn đất liền.
  chasm(g, o, rng) {
    const { W, G, H } = g, pits = o.pits || 2, pw = o.pw || 11;
    for (let i = 0; i < pits; i++) {
      const c0 = Math.floor(W * (i + 1) / (pits + 1)) - Math.floor(pw / 2), c1 = c0 + pw - 1;
      g.fill(G, H - 1, c0, c1, '.');                       // hố
      g.ledge(G, c0, c1);                                  // cầu = bắc qua hố
      g.ledge(G - 3, c0 + 1, c1 - 1);                      // bục nổi phía trên
    }
  },

  // Răng cưa: vách cao 2 ô / thấp 1 ô lặp lại, luôn có bậc nối → đi tới và quay lại được.
  zigzag(g, o, rng) {
    const { W, G } = g, seg = o.seg || 12;
    const segs = Math.max(3, Math.floor((W - 20) / seg));
    for (let s = 0; s < segs; s++) {
      const h = (s % 2) ? 2 : 1, c0 = 10 + s * seg, c1 = Math.min(W - 3, c0 + seg - 1);
      g.fill(G - h, G - 1, c0, c1, '#');
      if (h === 2) g.ledge(G - h + 2, c0 - 2, c0 + 2);      // bậc đệm trước răng cao
    }
  },
};

// ---------------------------------------------------------------------------------- nước (thác % / hồ ")
// Engine đã vẽ sẵn: '%' thác rơi từ trên xuống (nằm sau ô đất), '"' mặt hồ phủ mờ lên nhân vật.
// Cả hai đều là ô khí (không chắn, không đứng được) nên không ảnh hưởng đường nhảy. Chỉ ghi vào ô '.' trống.
function addWater(g, spec, rng) {
  const { W, G } = g;
  // Thác: 1–2 dải rơi tự do ở cột KHÔNG có bục/khe (mặt đất liền, phía trên trống suốt từ trần tới G-2).
  // Chỉ chọn cột mà toàn bộ các hàng 1..G-2 đều trống '.' → thác không cắt đường nhảy lên bục/quái.
  const safeFallCols = [];
  for (let c = 15; c < W - 16; c++) {
    let clear = true;
    for (let r = 1; r < G - 1; r++) if (g.get(r, c) !== '.') { clear = false; break; }
    if (clear) safeFallCols.push(c);
  }
  const falls = spec.falls != null ? spec.falls : (safeFallCols.length ? (rng() < 0.65 ? 1 : 2) : 0);
  for (let i = 0; i < falls && safeFallCols.length; i++) {
    const idx = Math.floor(rng() * safeFallCols.length);
    const c = safeFallCols[idx], r0 = 3 + Math.floor(rng() * 4);
    const width = rng() < 0.5 ? 2 : 1;
    for (let k = 0; k < width; k++) {
      if (!safeFallCols.includes(c + k)) continue;
      for (let r = r0; r < G - 1; r++) if (g.get(r, c + k) === '.') g.set(r, c + k, '%');
    }
  }
  // Hồ: ĐÀO HỐ nông vào mặt đất — nước nằm TRONG hố, không phủ lên nền đất.
  // Xóa mặt đất ở hàng G, đặt '"' vào đó; đáy G+1 vẫn là '#' để nhân vật đứng lội và nhảy lên.
  const pools = spec.pools != null ? spec.pools : (rng() < 0.5 ? 1 : 2);
  for (let i = 0; i < pools; i++) {
    const len = 6 + Math.floor(rng() * 7);
    for (let attempt = 0; attempt < 12; attempt++) {
      const c0 = 15 + Math.floor(rng() * Math.max(1, W - 30 - len));
      let ok = true;
      for (let c = c0; c < c0 + len && ok; c++) {
        // Cần mặt đất liền, đáy liền, và 3 ô phía trên TRỐNG — né mọi NPC/S/cổng/quái (kể cả quái bay).
        if (g.get(G, c) !== '#' || g.get(G + 1, c) !== '#') { ok = false; break; }
        for (let d = 1; d <= 2; d++) if (g.get(G - d, c) !== '.') { ok = false; break; }
      }
      if (!ok) continue;
      for (let c = c0; c < c0 + len; c++) g.set(G, c, '"');
      break;
    }
  }
}

// Cổng ra đặt trên sàn CAO ở cuối map (cổng vào vẫn ở dưới) → lối vào/lối ra không cùng một đường thẳng.
// Tách 2 bước: exitPlan() chỉ TÍNH (trước khi đặt quái, không ghi), exitBuild() mới ghi bậc (sau khi đặt quái).
function exitPlan(g, spec, rng) {
  const { W, G } = g;
  const rise = spec.exitH || [6, 9][Math.floor(rng() * 2)];
  const top = G - rise;
  const rows = stepRows(G, top);
  // CHỈ dùng 8 cột cuối (W-8..W-2) — đây là vùng okCell đã chừa cho cổng, không đụng chỗ quái.
  return { top, rows, c0: W - 8, pc: W - 4 };
}
function exitBuild(g, plan, ch) {
  const { top, rows, c0, pc } = plan, W = g.W;
  rows.forEach((r, k) => { const a = c0 + (k % 2) * 2; g.ledge(r, a, Math.min(W - 2, a + 3)); });
  g.ledge(top, c0, W - 2);                                   // sàn đỉnh
  g.set(top - 1, pc, ch);                                    // cổng đứng trên sàn
}

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
  // Cổng ra lên sàn CAO ở cuối map; cổng vào (<) vẫn ở dưới → vào dưới, ra trên (không cùng đường thẳng).
  const exitZone = hasNext ? exitPlan(g, spec, rngOf(id + '-exit')) : null;
  // Dựng bậc + cổng TRƯỚC khi lấy surfaces: place() sẽ tự bỏ qua ô có cổng (occupied), không đè lên nhau.
  if (exitZone) exitBuild(g, exitZone, gate || '>');
  // cổng nhánh (ký hiệu khác < >): đặt trên mặt đất, từ phải sang trái, cách nhau ≥ 5 cột
  const portalCols = [];
  (gate ? [] : ports.filter(c => c !== '<' && c !== '>')).forEach((ch, i) => {
    for (let c = W - 9 - i * 6; c > 14; c--) {
      if (g.get(G, c) === '#' && [-1, 0, 1].every(d => g.get(G - 1, c + d) === '.' && g.get(G - 2, c + d) === '.') && !portalCols.some(x => Math.abs(x - c) < 5)) { g.set(G - 1, c, ch); portalCols.push(c); break; }
    }
  });
  const npcs = Object.keys(meta.npcs || {});
  const far = new Set(spec.npcFar || []), near = npcs.filter(ch => !far.has(ch));
  // Chọn cột mặt đất TRỐNG (không nằm dưới cột đặc) để NPC không bị kín trong cột/răng.
  const npcCols = new Set();
  const clearCol = (want, min, max) => {
    const ok = c => c >= min && c <= max && !npcCols.has(c)
      && g.get(G - 1, c) === '.' && g.get(G - 2, c) === '.' && g.get(G - 3, c) === '.';
    if (ok(want)) return want;
    for (let d = 1; d < W; d++) { if (ok(want - d)) return want - d; if (ok(want + d)) return want + d; }
    return want;
  };
  near.forEach((ch, i) => { const c = clearCol(8 + i * 5, 6, W - 6); npcCols.add(c); g.set(G - 1, c, ch); });
  const npcEnd = Math.max(...npcCols, 8);
  // NPC "nằm sâu" (thợ săn bị giam, cửa sáng, tro lỵ...): lấy từ meta.npcs, rải ở nửa sau bản đồ.
  // Dùng chính meta thay vì cache/cấu hình để không bao giờ thiếu hay đè NPC (cache cũ từng làm mất B, W).
  const farSet = new Set(spec.npcFar || []);
  const farNpcs = npcs.filter(ch => farSet.has(ch));
  const farCols = [];
  farNpcs.forEach((ch) => {
    const free = (c) => g.get(G, c) === '#' && g.get(G - 1, c) === '.' && g.get(G - 2, c) === '.' && ![-1, 1].some(d => /[A-Z]/.test(g.get(G - 1, c + d)));
    let placed = false;
    for (let c = Math.floor(W * 0.5); c < W - 5 && !placed; c++) {
      if (free(c) && !farCols.some(x => Math.abs(x - c) < 4)) { g.set(G - 1, c, ch); farCols.push(c); placed = true; }
    }
    if (!placed) for (let c = 12; c < W - 5 && !placed; c++) {
      if (free(c) && !farCols.some(x => Math.abs(x - c) < 4)) { g.set(G - 1, c, ch); farCols.push(c); placed = true; }
    }
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
  // Không đặt quái đè lên ký tự chức năng (NPC/cổng/S/quái khác) đã có trên mặt đất.
  const occupied = (p) => /[A-Za-z<>()[\]]/.test(g.get(p.r - 1, p.c));
  const place = (list, ch, n) => {
    const fl = MONS[meta.spawns[ch]] && MONS[meta.spawns[ch]].fly;
    const eligible = (p) => free(p) && !occupied(p) && okCell(p.r, p.c);
    let cand = list.filter(eligible); if (cand.length < n) cand = pos.filter(eligible);
    for (const p of pick(cand, n, rng)) {
      let r = p.r - 1;
      if (fl && g.empty(p.r - 3, p.c)) r = p.r - 3;
      used.add(p.r + ',' + p.c); used.add(p.r + ',' + (p.c + 1)); used.add(p.r + ',' + (p.c - 1));
      g.set(r, p.c, ch);
    }
  };
  // boss 'z': đỉnh núi (terraces) hoặc giữa mặt đất trống (không đặt sát cổng cuối dễ bị kín)
  if (counts.z) {
    let p;
    if (spec._summit) p = { r: spec._summit.r, c: Math.floor((spec._summit.c0 + spec._summit.c1) / 2) };
    else {
      const ground = runs.find(r => r.r === G && r.c1 - r.c0 > 12) || { c0: 10, c1: W - 10 };
      let c = Math.floor((ground.c0 + ground.c1) / 2);
      const ok = x => g.get(G - 1, x) === '.' && g.get(G - 2, x) === '.' && g.get(G - 3, x) === '.' && !npcCols.has(x);
      if (!ok(c)) for (let d = 1; d < W; d++) { if (ok(c - d)) { c -= d; break; } if (ok(c + d)) { c += d; break; } }
      p = { r: G, c };
    }
    g.set(p.r - 1, p.c, 'z'); used.add(p.r + ',' + p.c);
  }
  const letters = Object.keys(counts).filter(k => /[a-y]/.test(k)).sort();
  letters.forEach((ch, i) => {
    const n = counts[ch];
    place(letters.length === 1 ? pos : (i === 0 ? low : i === 1 ? high : pos), ch, n);
  });
  // Nước đặt SAU khi NPC/quái đã đứng → hồ né được cột có NPC/quái, không chèn nước dưới chân ai.
  addWater(g, spec, rngOf(id + '-water'));
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
  rung:           { arch: 'chasm', W: 110, H: 32, pits: 3, pw: 10 },
  hang:           { arch: 'floors', W: 96, H: 32, levels: 3 },
  b_en_pha:       { arch: 'ramp', W: 96, H: 30, sw: 9, maxH: 12 },
  d_lay_muc:      { arch: 'zigzag', W: 96, H: 30, seg: 12, amp: 3 },
  lang_chai:      { arch: 'columns', W: 96, H: 30, n: 10 },
  cc_hac_nguyet:  { arch: 'floors', W: 92, H: 32, levels: 4 },
  tp_chim_t:      { arch: 'chasm', W: 96, H: 30, pits: 2, pw: 13 },
  tp_chim_c:      { arch: 'floors', W: 96, H: 32, levels: 3, npcFar: ['A', 'B', 'C', 'D', 'E'] },
  ham_ngam:       { arch: 'floors', W: 80, H: 28, levels: 3 },
  thien_khoi_1: { arch: 'ramp', W: 112, H: 32, sw: 10, maxH: 14 },
  thien_khoi_2: { arch: 'zigzag', W: 100, H: 30, seg: 11, amp: 3 },
  thien_khoi_3: { arch: 'columns', W: 104, H: 32, n: 9 },
  thien_khoi_4: { arch: 'chasm', W: 100, H: 30, pits: 3, pw: 11 },
  long_mach_1: { arch: 'floors', W: 104, H: 32, levels: 4 },
  long_mach_2: { arch: 'ramp', W: 104, H: 30, sw: 11, maxH: 12 },
  long_mach_3: { arch: 'floors', W: 96, H: 32, levels: 3, npcFar: ['A', 'B', 'C'] },
  long_mach_4: { arch: 'columns', W: 96, H: 31, n: 11 },
  tinh_van_1: { arch: 'chasm', W: 100, H: 33, pits: 2, pw: 14 },
  tinh_van_2: { arch: 'zigzag', W: 100, H: 31, seg: 13, amp: 3 },
  tinh_van_3: { arch: 'floors', W: 96, H: 32, levels: 4, npcFar: ['A', 'B', 'C', 'D'] },
  tinh_van_4: { arch: 'ramp', W: 102, H: 30, sw: 9, maxH: 12 },
  than_mong_1: { arch: 'columns', W: 104, H: 32, n: 12 },
  than_mong_2: { arch: 'chasm', W: 98, H: 30, pits: 3, pw: 9 },
  than_mong_3: { arch: 'zigzag', W: 96, H: 32, seg: 10, amp: 3 },
  than_mong_4: { arch: 'floors', W: 96, H: 32, levels: 3 },
  sang_the_1: { arch: 'ramp', W: 102, H: 31, sw: 12, maxH: 14 },
  sang_the_2: { arch: 'columns', W: 102, H: 32, n: 10, npcFar: ['A', 'B', 'C'] },
  sang_the_3: { arch: 'chasm', W: 96, H: 32, pits: 2, pw: 12 },
  sang_the_4: { arch: 'floors', W: 104, H: 30, levels: 3, npcFar: ['W'] },
  quan_thuong_mai: { arch: 'zigzag', W: 96, H: 26, seg: 10, amp: 2 },
  chan_nui:       { arch: 'ramp', W: 100, H: 32, sw: 9, maxH: 16 },
  hem_nui:        { arch: 'floors', W: 92, H: 32, levels: 3 },
  lo_ren_bang:    { arch: 'columns', W: 96, H: 30, n: 8 },
  dinh_nui:       { arch: 'ramp', W: 110, H: 34, sw: 10, maxH: 18 },
  kho_bac:        { arch: 'floors', W: 96, H: 32, levels: 4 },
  vac_da:         { arch: 'zigzag', W: 108, H: 30, seg: 14, amp: 3 },
  cong_khai_hoan: { arch: 'chasm', W: 104, H: 32, pits: 3, pw: 12 },
  quang_truong:   { arch: 'columns', W: 100, H: 30, n: 11 },
  thu_vien:       { arch: 'floors', W: 92, H: 32, levels: 3 },
  phong_luu_tru:  { arch: 'floors', W: 96, H: 32, levels: 3 },
  dinh_thap:      { arch: 'ramp', W: 96, H: 34, sw: 9, maxH: 18 },
  cau_dan:        { arch: 'chasm', W: 96, H: 30, pits: 2, pw: 11 },
  sanh_cho:       { arch: 'columns', W: 110, H: 30, n: 12 },
  dinh_cong_vh:   { arch: 'ramp', W: 96, H: 32, sw: 10, maxH: 14 },
  tam_diem:       { arch: 'floors', W: 96, H: 32, levels: 4 },
  cong_ss:        { arch: 'zigzag', W: 108, H: 30, seg: 12, amp: 3 },
  thien_khoi:     { arch: 'columns', W: 88, H: 30, n: 8 },
  long_mach:      { arch: 'floors', W: 88, H: 30, levels: 3 },
  tinh_van:       { arch: 'chasm', W: 92, H: 30, pits: 2, pw: 10 },
  than_mong:      { arch: 'ramp', W: 94, H: 31, sw: 9, maxH: 12 },
  sang_the:       { arch: 'zigzag', W: 88, H: 30, seg: 11, amp: 3 },
};

// Đếm ký hiệu của bản đồ cũ (đọc từ git nếu đã bị ghi đè: lưu cache trong assets_raw/map_counts.json)
const CACHE = path.join(__dirname, '../../../assets_raw/map_counts.json');
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
// Mỗi Tân Đô một bố cục riêng: xáo trộn vị trí NPC/bục/mái theo seed từ tên map (vẫn giữ số lượng NPC, cổng, quái).
function buildVillage(id, spec, counts) {
  const meta = MAPS[id], W = spec.W, H = 24, G = 20, g = new Grid(W, H), rng = rngOf('village-' + id);
  g.fill(G, H - 1, 0, W - 1, '#');
  const ports = Object.keys(meta.portals || {});
  if (ports.includes('<')) g.set(G - 1, 1, '<');
  g.set(G - 1, 4, 'S');
  // Cổng ra lên bục CAO cuối làng (cổng vào vẫn ở dưới) → vào dưới, ra trên.
  if (meta.gate || ports.includes('>')) {
    const ch = meta.gate || '>', top = G - 6, edge = W - 6;
    const rows = stepRows(G, top);
    rows.forEach((r, k) => { const a = edge - 12 + (k % 2) * 2; g.ledge(r, a, Math.min(W - 2, a + 4)); });
    g.ledge(top, edge - 12, W - 2);
    g.set(top - 1, W - 4, ch);
  }
  // NPC đặc biệt (Lầu Trân Bảo, cốt truyện, lữ khách...) đứng trên các bục cao; NPC dịch vụ (shop, rèn, nhiệm vụ, trạm, chợ) ở mặt đất.
  // Ưu tiên bục cao nhất cho NPC đứng đầu danh sách UPPER. Cột chọn tránh ký hiệu đèn '!' bên dưới.
  const UPPER = ['tran_bao', 'minh_triet', 'ha_phong', 'lam_suong', 'lu_khach', 'vy'];
  const SLOTS = [[7, 52], [10, 62], [10, 34], [13, 22], [13, 74], [13, 90], [16, 16], [16, 38], [16, 86]];   // [hàng đứng, cột]
  const npcIds = meta.npcs || {};
  const upper = Object.keys(npcIds).filter(c => UPPER.includes(npcIds[c])).sort((a, b) => UPPER.indexOf(npcIds[a]) - UPPER.indexOf(npcIds[b]));
  // Xáo trộn thứ tự gán NPC lên các bục: cùng số NPC nhưng vị trí khác nhau giữa các làng.
  const slots = SLOTS.slice();
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  upper.slice(0, slots.length).forEach((c, i) => g.set(slots[i][0], slots[i][1], c));
  const items = Object.keys(npcIds).filter(c => !upper.slice(0, slots.length).includes(c)).concat(meta.gate ? [] : ports.filter(c => c !== '<' && c !== '>'));
  const hasMobs = Object.keys(meta.spawns || {}).length > 0, last = W - (hasMobs ? 30 : 12), first = 9;
  const step = items.length > 1 ? Math.max(5, Math.min(8, Math.floor((last - first) / (items.length - 1)))) : 0;
  // Dịch vị trí dãy NPC dịch vụ theo seed (giãn cách giữ nguyên).
  const shift = Math.floor(rng() * 3) - 1;
  items.forEach((ch, i) => g.set(G - 1, Math.max(6, Math.min(W - 4, first + i * step + shift)), ch));
  // quái (bãi hình nhân ở Tân Đô I)
  for (const ch of Object.keys(meta.spawns || {})) for (let i = 0; i < Math.max(1, counts[ch] || 3); i++) g.set(G - 1, W - 26 + i * 6, ch);
  // Tầng trên: mỗi Tân Đô một DÁNG NHÀ hoàn toàn khác (không chỉ lệch vài ô như trước).
  const VILLAGE_ORDER = ['lang', 'tan_do_2', 'tan_do_3', 'tan_do_4', 'tan_do_bt', 'tan_do_6', 'tan_do_7'];
  const variant = Math.max(0, VILLAGE_ORDER.indexOf(id));
  const mid = Math.floor(W / 2);
  const ledges = [];
  if (variant === 0) {              // mái trung tâm + bậc hai bên
    ledges.push([17, 10, 18], [14, 20, 28], [11, 30, 38], [8, mid - 10, mid + 4], [11, mid + 6, mid + 14], [14, mid + 16, mid + 24], [17, mid + 26, mid + 34]);
    ledges.push([8, mid - 5, mid + 1]);                    // mái trung tâm
  } else if (variant === 1) {       // hai tháp nhà đối xứng
    ledges.push([17, 12, 22], [14, 22, 32], [11, 26, 34], [8, 26, 36], [11, mid - 2, mid + 6], [14, mid + 6, mid + 16], [17, mid + 16, mid + 30]);
    ledges.push([8, 28, 34], [8, mid + 6, mid + 12]);      // đỉnh hai tháp
  } else if (variant === 2) {       // sàn chữ L: một sàn ngang dài + tháp đứng ở giữa (có bậc nối)
    ledges.push([17, 10, 40], [14, 14, 34], [11, 18, 30], [14, 34, 44], [11, 40, 50], [8, mid - 3, mid + 8], [11, mid - 6, mid + 1], [14, mid + 6, mid + 20], [17, mid + 16, mid + 36]);
    ledges.push([8, mid + 1, mid + 6]);
  } else if (variant === 3) {       // bậc tam cấp nghiêng trái
    ledges.push([17, 8, 24], [14, 18, 34], [11, 28, 44], [8, 38, 54], [11, mid + 4, mid + 18], [14, mid + 14, mid + 28], [17, mid + 24, mid + 38]);
    ledges.push([8, 40, 46]);
  } else if (variant === 4) {       // bậc tam cấp nghiêng phải
    ledges.push([17, mid + 20, W - 8], [14, mid + 10, W - 12], [11, mid, W - 16], [8, mid - 10, W - 20], [11, 14, 28], [14, 20, 34], [17, 26, 40]);
    ledges.push([8, mid - 8, mid - 2]);
  } else if (variant === 5) {       // ba mái nhỏ rời rạc
    ledges.push([17, 10, 26], [14, 14, 24], [17, mid - 8, mid + 8], [14, mid - 5, mid + 5], [11, mid - 2, mid + 2], [17, mid + 16, mid + 32], [14, mid + 20, mid + 30]);
    ledges.push([11, mid - 2, mid + 2]);
  } else {                          // mái vòm rộng, bậc vòng ngoài
    ledges.push([17, 8, 20], [14, 16, 30], [11, 24, 38], [8, mid - 14, mid + 14], [11, mid + 18, mid + 32], [14, mid + 22, mid + 36], [17, mid + 26, mid + 40]);
    ledges.push([8, mid - 12, mid + 12]);
  }
  for (const [r, a, b] of ledges) g.ledge(r, Math.max(1, a), Math.min(W - 2, b));
  const lamps = [[12, 16], [24, 13], [mid - 2, 7], [mid + 10, 10], [mid + 20, 13], [mid + 30, 16], [W - 16, 13]];
  for (const [c, r] of lamps) if (g.empty(r, c)) g.set(r, c, '!');
  // Hồ đào xuống mặt đất (hàng G), né cột có NPC/quái/S/cổng đã đặt ở trên.
  const poolRng = rngOf('village-water-' + id), npool = poolRng() < 0.5 ? 1 : 2;
  for (let i = 0; i < npool; i++) {
    const len = 5 + Math.floor(poolRng() * 6);
    for (let attempt = 0; attempt < 12; attempt++) {
      const c0 = 11 + Math.floor(poolRng() * Math.max(1, W - 24 - len));
      let ok = true;
      for (let c = c0; c < c0 + len && ok; c++) {
        if (g.get(G, c) !== '#' || g.get(G + 1, c) !== '#') { ok = false; break; }
        for (let d = 1; d <= 2; d++) if (g.get(G - d, c) !== '.') { ok = false; break; }
      }
      if (!ok) continue;
      for (let c = c0; c < c0 + len; c++) g.set(G, c, '"');
      break;
    }
  }
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
module.exports = { build, buildVillage, SPECS };
