'use strict';
/* Mô phỏng vật lý nhảy của nhân vật (đúng số liệu trong public/js/scene/world.js) để biết chỗ nào đi tới / quay lại được.
 *   Ô 32px · trọng lực 1300 · nhảy 560 (cao ~120px ≈ 3,75 ô) · thân 18×46 · tốc độ chạy `speed` (nhỏ nhất 190)
 *   '#' đặc · '=' bục một chiều (nhảy xuyên từ dưới lên, đáp từ trên xuống) · trên điện thoại không có nút xuống nên KHÔNG tính việc tụt xuống xuyên bục.
 * Nút đồ thị = chỗ đứng (cx làm tròn 4px, y chân). Cạnh = đi bộ 1 bước / nhảy với kiểu bấm hướng khác nhau / rơi khỏi mép. */
const T = 32, GRAV = 1300, JUMP_V = 560, BW = 18, BH = 46, DT = 1 / 60, Q = 4;

function makeWorld(grid, rows, cols) {
  const ch = (r, c) => (r < 0 || c < 0 || c >= cols) ? '#' : r >= rows ? '#' : grid[r][c];
  const solidAt = (r, c) => ch(r, c) === '#';
  const platAt = (r, c) => ch(r, c) === '=';
  // Chân đang đứng trên gì? (cx, feetY đúng bằng mép trên của ô)
  const supported = (cx, fy) => {
    if (fy % T !== 0) return false;
    const r = fy / T, c0 = Math.floor((cx - BW / 2 + 0.01) / T), c1 = Math.floor((cx + BW / 2 - 0.01) / T);
    for (let c = c0; c <= c1; c++) if (solidAt(r, c) || (platAt(r, c) && !solidAt(r - 1, c) )) return true;
    return false;
  };
  // Thân (cx, feetY) có chui vào khối đặc không?
  const blocked = (cx, fy) => {
    const top = fy - BH, c0 = Math.floor((cx - BW / 2) / T), c1 = Math.floor((cx + BW / 2 - 0.001) / T);
    const r0 = Math.floor(top / T), r1 = Math.floor((fy - 0.001) / T);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (solidAt(r, c)) return true;
    return false;
  };
  // Một bước vật lý. s = {x, y (chân), vy}. input dir ∈ {-1,0,1}. Trả về 'land' khi chạm chỗ đứng.
  const step = (s, dir, speed) => {
    // ngang
    let nx = s.x + dir * speed * DT;
    if (!blocked(nx, s.y)) s.x = nx;
    // dọc
    s.vy += GRAV * DT;
    const ny = s.y + s.vy * DT;
    if (s.vy < 0) {                                 // đang lên: đụng trần thì dừng
      if (blocked(s.x, ny)) { s.vy = 0; } else s.y = ny;
      return false;
    }
    // đang rơi: tìm mép ô cắt qua đường rơi
    for (let k = Math.floor(s.y / T + 1e-9) + 1; k * T <= ny + 1e-9; k++) {
      const fy = k * T;
      if (supported(s.x, fy) && !blocked(s.x, fy)) { s.y = fy; s.vy = 0; return true; }
    }
    s.y = ny;
    return false;
  };
  return { supported, blocked, step, solidAt, platAt, ch };
}

function simulate(grid, rows, cols, start, speed) {
  const W = makeWorld(grid, rows, cols);
  const nid = (x, y) => Math.round(x / Q) + ':' + y;
  const nodes = new Map();      // id → {x, y}
  const edges = new Map();      // id → Set(id)
  const addEdge = (a, b) => { if (!edges.has(a)) edges.set(a, new Set()); edges.get(a).add(b); };
  // chỗ đứng đầu tiên: thả từ điểm xuất hiện
  const s = { x: (start[1] + 0.5) * T, y: (start[0] + 1) * T - 0.0001, vy: 0 };
  s.y = Math.floor(s.y / T) * T;
  while (!W.supported(s.x, s.y)) { s.y += T; if (s.y > rows * T + T) return null; }
  const q = [{ x: Math.round(s.x / Q) * Q, y: s.y }];
  const startId = nid(q[0].x, q[0].y);
  nodes.set(startId, q[0]);
  const visit = (from, x, y) => {
    const qx = Math.round(x / Q) * Q, id = nid(qx, y);
    addEdge(from, id);
    if (!nodes.has(id)) { nodes.set(id, { x: qx, y }); q.push({ x: qx, y }); }
  };
  // Mô phỏng một cú nhảy / rơi. plan: [dir, thời điểm thả hướng (giây)]
  const fly = (from, x, y, vy, dir, release, maxT = 2.2) => {
    const st = { x, y, vy };
    for (let t = 0; t < maxT; t += DT) {
      const d = t < release ? dir : 0;
      if (W.step(st, d, speed)) { visit(from, st.x, st.y); return; }
      if (st.y > rows * T + 64) return;               // rơi ra ngoài đáy
    }
  };
  while (q.length) {
    const n = q.shift(), from = nid(n.x, n.y);
    // đi bộ sang hai bên (mỗi lần Q px); hết chỗ đứng thì rơi xuống
    for (const dir of [-1, 1]) {
      const nx = n.x + dir * Q;
      if (W.blocked(nx, n.y)) continue;
      if (W.supported(nx, n.y)) visit(from, nx, n.y);
      else fly(from, nx, n.y, 0, dir, 9);            // rơi khỏi mép, vẫn giữ hướng đi
    }
    // nhảy: giữ hướng từ đầu tới lúc thả (0 = nhảy thẳng đứng)
    for (const dir of [-1, 0, 1]) for (const rel of (dir ? [0.15, 0.25, 0.35, 0.45, 0.55, 0.7, 9] : [9])) fly(from, n.x, n.y, -JUMP_V, dir, rel);
    // rơi thẳng từ bục xuống (chỉ để lan đồ thị khi đứng ngay mép) đã được tính ở trên
  }
  return { nodes, edges, start: startId };
}

module.exports = { simulate, T, Q, BW, BH };
