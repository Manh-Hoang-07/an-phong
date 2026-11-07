'use strict';
/*
 * Art · Thú cưỡi (vẽ bằng code, quay mặt sang phải). Khung MW × MH, mặt đất ở đáy (y = MH).
 * Mỗi thú: mt_<id>_idle, mt_<id>_run0..3, mt_<id>_jump. Tạo khi cần (Art.mount), dùng lại cả phiên chơi.
 * Độ nét cao (HD, xem art.js) → khi đặt hình phải nhân scale với Art.hdScale(key).
 *
 * Thân / cổ / đầu là đường cong mềm (spline), chân có khớp (đùi → ống → móng) chạy kiểu phi nước đại 4 nhịp.
 * Mỗi hình vẽ sẵn YÊN + một CHÂN NGƯỜI CƯỠI vắt bên hông (đùi, ống chân, ủng trong bàn đạp): người cưỡi chỉ
 * hiện nửa trên (cắt ở thắt lưng, xem scene/player.js) và ngồi đúng mặt yên SEAT[look].
 */
(() => {
  const { make, shade, light, OUT } = Art._;
  // Khung cao 72, vẽ dời xuống 6px (để sừng / tai không bị cắt); mặt đất của hình vẽ ở y = GROUND
  const MW = 100, MH = 72, TOP = 6, GROUND = 66;
  // Mặt yên: x trong khung, độ cao so với mặt đất (px). Người cưỡi đặt thắt lưng tại đây.
  const SEAT = { horse: { x: 45, h: 41 }, unicorn: { x: 45, h: 41 }, wolf: { x: 44, h: 33 }, lizard: { x: 47, h: 24 }, crane: { x: 43, h: 43 } };
  const RIDER = { pants: 0x2f2c3a, pantsHi: 0x48445a, boot: 0x3a281b, bootHi: 0x5a4130 };

  // ---------------------------------------------------------------- Bút vẽ đường cong
  // Catmull-Rom khép kín qua các điểm → đường viền mềm
  function spline(pts, closed = true, seg = 5) {
    const out = [], n = pts.length;
    const P = (i) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let k = 0; k < seg; k++) {
        const t = k / seg, t2 = t * t, t3 = t2 * t;
        out.push({
          x: 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          y: 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        });
      }
    }
    if (!closed) out.push({ x: pts[n - 1][0], y: pts[n - 1][1] });
    return out;
  }
  const mv = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);
  // Tô hình khép kín + viền tối
  function shape(g, color, pts, outline = 1.4, alpha = 1) {
    const p = spline(pts);
    if (outline) { g.lineStyle(outline * 2, OUT, alpha); g.strokePoints(p, true, true); }
    g.fillStyle(color, alpha); g.fillPoints(p, true, true);
    return p;
  }
  // Phần dưới của hình (y > cut) tô màu tối hơn → khối tròn, có bóng bụng
  function underShade(g, color, pts, cut, alpha = 0.55) {
    const p = spline(pts).map(q => ({ x: q.x, y: Math.max(q.y, cut) }));
    g.fillStyle(color, alpha); g.fillPoints(p, true, true);
  }
  // Đoạn thon từ (x1,y1, rộng w1) tới (x2,y2, rộng w2), hai đầu bo tròn
  function taper(g, color, x1, y1, w1, x2, y2, w2, outline = true) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const quad = (e) => [
      { x: x1 + nx * (w1 / 2 + e), y: y1 + ny * (w1 / 2 + e) }, { x: x2 + nx * (w2 / 2 + e), y: y2 + ny * (w2 / 2 + e) },
      { x: x2 - nx * (w2 / 2 + e), y: y2 - ny * (w2 / 2 + e) }, { x: x1 - nx * (w1 / 2 + e), y: y1 - ny * (w1 / 2 + e) }];
    if (outline) {
      g.fillStyle(OUT, 1); g.fillPoints(quad(1.2), true);
      g.fillCircle(x1, y1, w1 / 2 + 1.2); g.fillCircle(x2, y2, w2 / 2 + 1.2);
    }
    g.fillStyle(color, 1); g.fillPoints(quad(0), true);
    g.fillCircle(x1, y1, w1 / 2); g.fillCircle(x2, y2, w2 / 2);
  }

  // ---------------------------------------------------------------- Dáng chân (phi nước đại)
  // Trả về [đùi, ống] (radian so với phương thẳng đứng, + là về phía trước) cho chân trước / sau, gần / xa
  const PHASE = { fN: 2.9, fF: 2.2, hN: 0.7, hF: 0 };
  function legPose(frame, which) {
    const front = which[0] === 'f';
    if (frame === 'idle') return front ? [0.06, -0.02] : [-0.22, 0.18];
    if (frame === 'jump') return front ? [0.95, -0.55] : [-0.75, -0.25];
    const ph = PHASE[which] + Number(frame.slice(3)) * Math.PI / 2;
    const a1 = Math.sin(ph) * (front ? 0.55 : 0.5);
    const swing = Math.max(0, Math.cos(ph));                 // đang đưa chân về trước → gập gối
    return front ? [a1, a1 - swing * 1.1] : [a1 - 0.1, a1 + swing * 0.7 - 0.05];
  }
  const BOB = { idle: 0, jump: -3, run0: 0, run1: -2.5, run2: -1, run3: 1 };

  // Chân có khớp: hông (x,y) → gối → móng. Dài L1 + L2, rộng w1 (đùi) → w2 (ống).
  // Vẽ thành MỘT khối liền (viền mềm qua hông – gối – cổ chân), đùi to thon dần xuống cổ chân, không lộ khớp tròn.
  function leg(g, col, hoof, x, y, [a1, a2], L1, L2, w1, w2, paw) {
    const kx = x + Math.sin(a1) * L1, ky = y + Math.cos(a1) * L1;
    const fx = kx + Math.sin(a2) * L2, fy = ky + Math.cos(a2) * L2;
    // pháp tuyến tại hông / gối / cổ chân
    const nrm = (ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1; return [-dy / L, dx / L]; };
    const [n1x, n1y] = nrm(x, y, kx, ky), [n2x, n2y] = nrm(kx, ky, fx, fy);
    const nkx = (n1x + n2x) / 2, nky = (n1y + n2y) / 2;
    const wk = w2 * 1.25, wf = w2 * 0.85, wm = (w1 + wk) / 2;
    const mx = (x + kx) / 2, my = (y + ky) / 2;
    const pts = [
      [x + n1x * w1 / 2, y + n1y * w1 / 2], [mx + n1x * wm / 2, my + n1y * wm / 2], [kx + nkx * wk / 2, ky + nky * wk / 2], [fx + n2x * wf / 2, fy + n2y * wf / 2],
      [fx - n2x * wf / 2, fy - n2y * wf / 2], [kx - nkx * wk / 2, ky - nky * wk / 2], [mx - n1x * wm / 2, my - n1y * wm / 2], [x - n1x * w1 / 2, y - n1y * w1 / 2],
      [x - Math.sin(a1) * w1 * 0.3, y - Math.cos(a1) * w1 * 0.3],
    ];
    shape(g, col, pts, 1.1);
    g.fillStyle(light(col, 12), 0.5); g.fillEllipse(mx + n1x * wm * 0.2, my + n1y * wm * 0.2, wm * 0.45, Math.max(3, L1 * 0.5));   // vệt sáng bắp đùi
    if (paw) { g.fillStyle(OUT, 1); g.fillEllipse(fx + 1.5, fy - 0.3, w2 * 2 + 2.4, w2 + 2); g.fillStyle(hoof, 1); g.fillEllipse(fx + 1.5, fy - 0.3, w2 * 2, w2); }
    else { g.fillStyle(OUT, 1); g.fillRoundedRect(fx - w2 * 0.75 - 1, fy - 3.2, w2 * 1.6 + 2.6, 5, 1.5); g.fillStyle(hoof, 1); g.fillRoundedRect(fx - w2 * 0.75, fy - 2.6, w2 * 1.6 + 0.6, 3.8, 1.2); }
  }

  // ---------------------------------------------------------------- Yên + chân người cưỡi
  function saddle(g, sx, sy, cloth) {
    // chăn lót yên (viền trang trí) + yên da + núm yên / lưng yên
    shape(g, cloth, [[sx - 13, sy + 1], [sx + 11, sy + 1], [sx + 12, sy + 9], [sx - 12, sy + 10]], 1);
    g.fillStyle(light(cloth, 25), 1); g.fillRect(sx - 12, sy + 7.5, 23.5, 1.4);
    shape(g, 0x6b4126, [[sx - 10, sy - 1], [sx - 6, sy + 1.5], [sx + 5, sy + 1.5], [sx + 9, sy - 2.5], [sx + 8, sy + 3.5], [sx - 9, sy + 4]], 1);
    g.fillStyle(0x9a6438, 1); g.fillEllipse(sx - 1, sy + 1.8, 13, 2);
  }
  // Chân người cưỡi phía gần: đùi từ yên ra trước, ống chân xuống bàn đạp, ủng
  function riderLeg(g, sx, sy) {
    const kx = sx + 8, ky = sy + 9, fx = sx + 5, fy = sy + 19;
    g.lineStyle(1.2, 0x2a1a10, 1); g.lineBetween(sx + 1, sy + 3, fx + 1, fy + 2);          // dây bàn đạp
    taper(g, RIDER.pants, sx + 1, sy + 2, 7.5, kx, ky, 6);
    taper(g, RIDER.pants, kx, ky, 5.6, fx, fy - 2, 4.8);
    g.fillStyle(RIDER.pantsHi, 0.8); g.fillEllipse(sx + 4.5, sy + 4.4, 7, 2.2);
    // ủng
    g.fillStyle(OUT, 1); g.fillRoundedRect(fx - 4.2, fy - 4.6, 11.2, 7.4, 2.4);
    g.fillStyle(RIDER.boot, 1); g.fillRoundedRect(fx - 3.4, fy - 3.8, 9.6, 5.8, 2);
    g.fillStyle(RIDER.bootHi, 1); g.fillRect(fx - 2.6, fy - 3.2, 6, 1.4);
    g.fillStyle(0x9e9e9e, 1); g.fillRect(fx - 3, fy + 2, 8, 1.4);                            // bàn đạp
  }

  // ---------------------------------------------------------------- Ngựa / Kỳ lân
  function horse(g, col, frame, unicorn) {
    const b = BOB[frame], oy = b, run = frame.startsWith('run');
    const far = shade(col.body, 24), hoof = 0x3a2c22;
    const L = (w) => legPose(frame, w);
    // chân xa
    leg(g, far, hoof, 63, 41 + oy, L('fF'), 12, 13, 7, 3.4);
    leg(g, far, hoof, 27, 39 + oy, L('hF'), 12, 14, 9.5, 3.5);
    // đuôi: nhiều lọn bay theo nhịp chạy
    const sw = run ? Math.sin(Number(frame.slice(3)) * 1.6) * 3 : 0;
    for (let i = 0; i < 4; i++) {
      const tp = spline([[22, 27 + oy], [12 + i, 30 + oy + sw * 0.4], [5 + i * 2, 40 + oy + sw + i * 2], [3 + i * 3, 52 + oy + sw + i]], false);
      g.lineStyle(5 - i * 0.6, i % 2 ? shade(col.mane, 15) : col.mane, 1); g.strokePoints(tp, false);
    }
    // thân
    const body = mv([[20, 30], [27, 24.5], [40, 26], [52, 27], [61, 23.5], [70, 28], [73, 36], [67, 43], [52, 45.5], [36, 45], [24, 42], [18, 36]], 0, oy);
    shape(g, col.body, body);
    underShade(g, shade(col.body, 30), body, 38 + oy);
    g.fillStyle(light(col.body, 18), 0.7); g.fillEllipse(42, 28.5 + oy, 34, 4);              // vệt sáng lưng
    g.fillStyle(shade(col.body, 22), 0.5); g.fillEllipse(30, 34 + oy, 12, 9);                // cơ đùi sau
    g.fillStyle(shade(col.body, 18), 0.45); g.fillEllipse(64, 35 + oy, 9, 8);                // vai
    // cổ + đầu
    const neck = mv([[57, 27], [61, 16], [69, 8.5], [77, 7], [81, 13], [75, 23], [72, 34], [63, 37]], 0, oy);
    shape(g, col.body, neck);
    underShade(g, shade(col.body, 22), neck, 26 + oy, 0.4);
    const head = mv([[73, 5], [79, 2.5], [86, 6], [93.5, 13.5], [96, 19], [92, 22.5], [86, 21], [80, 17], [74.5, 11.5]], 0, oy);
    shape(g, col.body, head);
    g.fillStyle(light(col.body, 10), 0.8); g.fillEllipse(88, 12 + oy, 9, 4);
    g.fillStyle(shade(col.body, 35), 1); g.fillCircle(94.2, 18.4 + oy, 1.1);                 // lỗ mũi
    g.fillStyle(OUT, 1); g.fillEllipse(83.5, 9.5 + oy, 3.4, 2.6);                            // mắt
    g.fillStyle(col.eye, 1); g.fillCircle(83.9, 9.2 + oy, 0.9);
    // tai
    shape(g, col.body, mv([[75, 4], [76.5, -2.5], [79.5, 3]], 0, oy), 1);
    // bờm dọc cổ + chỏm trán
    const flow = run ? 2.5 : 0, mane = [];
    for (let i = 0; i <= 6; i++) {            // mép trong: dọc gáy cổ (từ vai lên chỏm đầu)
      const t = i / 6; mane.push([59 + t * 17, 26 - t * 21 + oy]);
    }
    for (let i = 6; i >= 0; i--) {            // mép ngoài: lọn bờm lượn sóng buông về sau
      const t = i / 6, wave = i % 2 ? 2.5 : 5.5;
      mane.push([59 + t * 17 - wave - flow, 26 - t * 21 + oy + 2.5 + (i % 2 ? 0 : 1.5)]);
    }
    shape(g, col.mane, mane, 1);
    g.fillStyle(light(col.mane, 22), 0.75); for (let i = 1; i < 6; i++) g.fillEllipse(60 + i * 2.8 - 1.5, 24 - i * 3.5 + oy, 2.2, 4.5);
    shape(g, col.mane, mv([[75, 5], [80, 2], [79, 8], [74, 10]], 0, oy), 1);   // chỏm bờm trước trán
    if (unicorn) {
      // sừng xoắn
      shape(g, col.horn, mv([[76.5, 3.5], [79.5, 3], [83, -6]], 0, oy), 1);
      g.lineStyle(0.8, shade(col.horn, 30), 1); g.lineBetween(77.5, 1.5 + oy, 80, 1 + oy); g.lineBetween(79, -1.5 + oy, 81, -2 + oy);
    }
    // dây cương
    g.lineStyle(1.1, 0x4a2e1a, 1); g.lineBetween(92, 19 + oy, 80, 13 + oy); g.lineBetween(80, 13 + oy, 66, 24 + oy);
    // chân gần
    leg(g, col.body, hoof, 66, 41 + oy, L('fN'), 12, 13, 7.5, 3.6);
    leg(g, col.body, hoof, 30, 40 + oy, L('hN'), 12, 14, 10, 3.7);
    const s = SEAT.horse;
    saddle(g, s.x, GROUND - s.h + oy - 2, unicorn ? 0x7e57c2 : 0x8e2f2f);
    riderLeg(g, s.x, GROUND - s.h + oy - 2);
  }

  // ---------------------------------------------------------------- Sói
  function wolf(g, col, frame) {
    const b = BOB[frame] * 0.8, oy = b, run = frame.startsWith('run');
    const far = shade(col.body, 24), paw = shade(col.body, 40);
    const L = (w) => legPose(frame, w);
    leg(g, far, paw, 62, 46 + oy, L('fF'), 9.5, 11, 6, 3, true);
    leg(g, far, paw, 28, 44 + oy, L('hF'), 9.5, 11.5, 8, 3.1, true);
    // đuôi xù cong lên
    const wag = run ? Math.sin(Number(frame.slice(3)) * 1.6) * 2.5 : 0;
    shape(g, col.mane, mv([[22, 35], [12, 30 + wag], [5, 24 + wag], [4, 30 + wag], [9, 37 + wag], [20, 41]], 0, oy));
    g.fillStyle(col.belly, 0.85); g.fillEllipse(6.5, 27 + wag + oy, 4, 3);
    // thân dài, lưng thấp
    const body = mv([[20, 37], [28, 32], [44, 33], [58, 31], [68, 34], [71, 41], [64, 48], [48, 49], [32, 48.5], [22, 45]], 0, oy);
    shape(g, col.body, body);
    underShade(g, col.belly, body, 44 + oy, 0.75);
    g.fillStyle(light(col.body, 16), 0.7); g.fillEllipse(44, 34.5 + oy, 30, 3.2);
    // lông cổ xù + đầu
    shape(g, col.mane, mv([[58, 32], [64, 24], [71, 23], [73, 33], [67, 41], [60, 40]], 0, oy));
    const head = mv([[66, 22], [72, 18], [79, 19], [88, 23.5], [92, 26], [88, 29], [80, 29], [72, 29], [66, 27]], 0, oy);
    shape(g, col.body, head);
    g.fillStyle(col.belly, 0.9); g.fillEllipse(85, 27.5 + oy, 9, 2.8);                        // mõm sáng
    g.fillStyle(OUT, 1); g.fillCircle(92, 25.4 + oy, 1.5);                                       // mũi
    g.fillStyle(OUT, 1); g.fillEllipse(77.5, 22.2 + oy, 3.6, 2.2);
    g.fillStyle(col.eye, 1); g.fillCircle(78, 22 + oy, 0.85);
    shape(g, col.body, mv([[68.5, 20], [70, 12], [74, 19]], 0, oy), 1);                           // tai
    g.fillStyle(shade(col.mane, 10), 1); g.fillTriangle(69.6, 19, 70.3, 14.5 + oy, 72.6, 19);
    leg(g, col.body, paw, 64, 47 + oy, L('fN'), 9.5, 11, 6.5, 3.2, true);
    leg(g, col.body, paw, 31, 45 + oy, L('hN'), 9.5, 11.5, 8.5, 3.3, true);
    const s = SEAT.wolf;
    saddle(g, s.x, GROUND - s.h + oy - 2, 0x37506e);
    riderLeg(g, s.x, GROUND - s.h + oy - 2);
  }

  // ---------------------------------------------------------------- Thằn lằn
  function lizard(g, col, frame) {
    const b = BOB[frame] * 0.5, oy = b, run = frame.startsWith('run');
    const far = shade(col.body, 24);
    const sp = (w) => { const [a1, a2] = legPose(frame, w); return [a1 * 0.7 + (w[0] === 'f' ? 0.35 : -0.35), a2 * 0.5 + (w[0] === 'f' ? -0.3 : 0.3)]; };
    leg(g, far, far, 64, 52 + oy, sp('fF'), 6, 8, 5, 3.4, true);
    leg(g, far, far, 30, 52 + oy, sp('hF'), 6, 8, 5.5, 3.4, true);
    const sw = run ? Math.sin(Number(frame.slice(3)) * 1.6) * 3 : 0;
    // đuôi dài
    shape(g, col.body, mv([[26, 47], [14, 50 + sw * 0.5], [3, 56 + sw], [1, 58 + sw], [12, 55 + sw * 0.5], [26, 54]], 0, oy));
    const body = mv([[24, 47], [36, 42], [56, 42], [70, 44], [74, 50], [66, 55], [44, 56], [28, 54]], 0, oy);
    shape(g, col.body, body);
    underShade(g, col.belly, body, 51.5 + oy, 0.85);
    // vảy gai lưng
    for (let i = 0; i < 8; i++) shape(g, col.mane, [[28 + i * 5.5, 44 - (i > 1 && i < 6 ? 1.2 : 0) + oy], [30.5 + i * 5.5, 39 + oy], [33 + i * 5.5, 44 + oy]], 0.8);
    for (let i = 0; i < 6; i++) { g.fillStyle(shade(col.body, 20), 0.6); g.fillCircle(34 + i * 6, 47 + (i % 2) * 2 + oy, 1.4); }
    // đầu dẹt
    const head = mv([[68, 44], [76, 41], [86, 42.5], [95, 46], [93, 50], [82, 51.5], [72, 51]], 0, oy);
    shape(g, col.body, head);
    g.fillStyle(col.belly, 0.8); g.fillEllipse(86, 49.6 + oy, 14, 2.6);
    g.fillStyle(OUT, 1); g.fillEllipse(80, 44.6 + oy, 3.6, 3);
    g.fillStyle(col.eye, 1); g.fillCircle(80.3, 44.3 + oy, 1.1);
    g.lineStyle(1, OUT, 1); g.lineBetween(84, 48.5 + oy, 94, 47.6 + oy);                     // miệng
    leg(g, col.body, col.body, 66, 53 + oy, sp('fN'), 6, 8, 5.5, 3.6, true);
    leg(g, col.body, col.body, 33, 53 + oy, sp('hN'), 6, 8, 6, 3.6, true);
    const s = SEAT.lizard;
    saddle(g, s.x, GROUND - s.h + oy - 2, 0x6d4c41);
    riderLeg(g, s.x, GROUND - s.h + oy - 2);
  }

  // ---------------------------------------------------------------- Hạc
  function crane(g, col, frame) {
    const b = BOB[frame], oy = b, jump = frame === 'jump';
    const legCol = 0x37474f;
    const L = (w) => { const [a1, a2] = legPose(frame, w === 'n' ? 'hN' : 'hF'); return [a1 * 0.8, a2 * 0.8 + 0.35]; };
    leg(g, shade(legCol, 10), legCol, 40, 40 + oy, L('f'), 11, 15, 3.4, 2.2, true);
    // đuôi lông đen
    shape(g, col.mane, mv([[24, 24], [8, 22], [4, 28], [10, 32], [24, 34]], 0, oy));
    // thân tròn
    const body = mv([[22, 26], [34, 18], [50, 18], [60, 24], [58, 36], [44, 42], [28, 40]], 0, oy);
    shape(g, col.body, body);
    underShade(g, shade(col.body, 12), body, 34 + oy, 0.6);
    // cánh: gập (đứng/chạy) hoặc dang lên (nhảy)
    if (jump) {
      shape(g, col.body, mv([[30, 24], [20, 4], [36, -2], [52, 6], [52, 22]], 0, oy));
      for (let i = 0; i < 4; i++) shape(g, col.mane, mv([[20 + i * 4, 4 - i * 1.5], [24 + i * 4, -1 - i * 1.2], [26 + i * 4, 6]], 0, oy), 0.8);
    } else {
      shape(g, light(col.body, 4), mv([[28, 22], [44, 20], [52, 26], [42, 33], [28, 32]], 0, oy), 1);
      shape(g, col.mane, mv([[24, 25], [30, 22], [32, 31], [24, 31]], 0, oy), 0.8);
      g.lineStyle(0.8, shade(col.body, 25), 1); g.lineBetween(32, 26 + oy, 46, 25 + oy); g.lineBetween(32, 29 + oy, 44, 29 + oy);
    }
    // cổ cong chữ S + đầu
    const neck = spline(mv([[56, 25], [62, 18], [63, 10], [67, 3], [73, 1]], 0, oy), false);
    g.lineStyle(7.4, OUT, 1); g.strokePoints(neck, false); g.lineStyle(5, col.body, 1); g.strokePoints(neck, false);
    shape(g, col.body, mv([[69, -1], [76, -1.5], [78, 2.5], [72, 4.5], [68, 3]], 0, oy), 1.1);
    g.fillStyle(0xe53935, 1); g.fillEllipse(72.4, -1.4 + oy, 4.4, 2.2);                      // mào đỏ
    shape(g, 0xc8a46a, mv([[77, 0.5], [92, 3], [77, 3.2]], 0, oy), 0.9);                     // mỏ dài
    g.fillStyle(OUT, 1); g.fillCircle(74, 0.9 + oy, 1.1);
    leg(g, legCol, legCol, 44, 40 + oy, L('n'), 11, 15, 3.6, 2.3, true);
    const s = SEAT.crane;
    saddle(g, s.x, GROUND - s.h + oy - 2, 0x1f6f78);
    riderLeg(g, s.x, GROUND - s.h + oy - 2);
  }

  const FRAMES = ['idle', 'run0', 'run1', 'run2', 'run3', 'jump'];
  const LOOKS = { wolf, lizard, crane, horse, unicorn: (g, c, f) => horse(g, c, f, true) };
  // Tạo đủ khung hình cho một thú (bỏ qua khung đã có). Trả về khóa khung đứng.
  function mount(scene, id) {
    const def = GameData.MOUNTS[id];
    if (!def) return null;
    const draw = LOOKS[def.look] || horse;
    for (const f of FRAMES) make(scene, `mt_${id}_${f}`, MW, MH, (g) => { g.translateCanvas(0, TOP); draw(g, def.colors, f); });
    return `mt_${id}_idle`;
  }
  // Mặt yên của thú: { x: lệch so với giữa khung (px), h: độ cao so với mặt đất }
  function mountSeat(id) {
    const def = GameData.MOUNTS[id], s = (def && SEAT[def.look]) || SEAT.horse;
    return { dx: s.x - MW / 2, h: s.h };
  }

  Object.assign(Art, { mount, mountSeat, MOUNT_FRAMES: FRAMES });
})();
