'use strict';
/* Art · Nền xa và viền tối khung hình. */
(() => {
  const { light, make, ell, rect, rrect, poly, rnd } = Art._;

  // ---------------------------------------------------------------- Nền xa
  // Trời chuyển màu: mỗi hàng điểm ảnh một màu, nội suy mượt (smoothstep) giữa các mốc → không lộ vệt
  function gradient(scene, key, colors) {
    const H = 576;
    make(scene, key, 4, H, (g) => {
      const C = Phaser.Display.Color;
      for (let y = 0; y < H; y++) {
        const t = y / (H - 1) * (colors.length - 1);
        const a = Math.min(colors.length - 2, Math.floor(t)), f = t - a;
        const s = f * f * (3 - 2 * f);
        const col = C.Interpolate.ColorWithColor(C.IntegerToColor(colors[a]), C.IntegerToColor(colors[a + 1]), 1000, s * 1000);
        g.fillStyle(C.GetColor(col.r, col.g, col.b));
        g.fillRect(0, y, 4, 1);
      }
    });
  }

  // Lớp nền giữa: dải bóng mờ nằm giữa nền xa và nền gần, tạo chiều sâu khi camera trượt.
  // kind: 'city' nhà cao tầng · 'forest' đồi + ngọn cây · 'cave'/'redgate' vách đá lởm chởm
  function midLayer(scene, key, kind, col, hazeCol) {
    const W = 960, H = 576;
    make(scene, key, W, H, (g) => {
      if (kind === 'city') {
        for (let i = 0; i < 18; i++) {
          const x = i * 56 - 8 + rnd(i, 21) * 14, w = 34 + rnd(i, 22) * 22, hh = 150 + rnd(i, 23) * 120;
          rect(g, col, x, H - hh, w, hh, 0.78);
          if (rnd(i, 24) > 0.6) rect(g, col, x + w * 0.4, H - hh - 18, 3, 18, 0.78);
          for (let y = H - hh + 10; y < H - 40; y += 18) {
            for (let wx = x + 5; wx < x + w - 6; wx += 10) {
              if (rnd(wx * 3 + y, 25) > 0.78) rect(g, 0xffd9a0, wx, y, 3, 4, 0.18);
            }
          }
        }
      } else {
        const jag = kind === 'forest' ? 0 : 1;
        g.fillStyle(col, 0.8);
        g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W; x += 8) {
          // hàm tuần hoàn theo W để ghép nối liền mạch khi lặp ngang
          const p = x / W * Math.PI * 2;
          let y = 360 + Math.sin(p * 2 + 0.6) * 30 + Math.sin(p * 5 + 1.3) * 14;
          if (jag) y += Math.abs(Math.sin(p * 13)) * -26 + Math.sin(p * 31) * 6;
          g.lineTo(x, y);
        }
        g.lineTo(W, H); g.closePath(); g.fillPath();
        if (kind === 'forest') {
          // ngọn cây lá kim nhô lên khỏi sườn đồi
          for (let i = 0; i < 26; i++) {
            const x = (i * 37 + rnd(i, 31) * 20) % W, p = x / W * Math.PI * 2;
            const base = 360 + Math.sin(p * 2 + 0.6) * 30 + Math.sin(p * 5 + 1.3) * 14 + 6;
            const h = 34 + rnd(i, 32) * 40, w = 10 + rnd(i, 33) * 8;
            poly(g, col, [[x - w, base], [x, base - h], [x + w, base]], 0.8);
            poly(g, col, [[x - w * 0.8, base - h * 0.35], [x, base - h * 1.1], [x + w * 0.8, base - h * 0.35]], 0.8);
          }
        }
      }
      // sương phủ chân lớp giữa → hòa vào nền gần
      mist(g, 430, 150, hazeCol, 0.22);
    });
  }

  // Sương sát mặt đất (đặt trước nền gần, sau cây cối): chuyển màu mượt từ trong suốt sang màu sương
  function haze(scene) {
    make(scene, 'bg_haze', 4, 576, (g) => {
      for (let y = 300; y < 576; y++) {
        const t = (y - 300) / 276;
        rect(g, 0xffffff, 0, y, 4, 1, 0.16 * t * t);
      }
    });
  }

  // Dải sương mờ dùng chung cho các lớp nền
  function mist(g, y, h, color, a) {
    for (let i = 0; i < h; i++) {
      const p = 1 - Math.abs((i / h - 0.5) * 2);
      rect(g, color, 0, y + i, 960, 1, a * p * p);
    }
  }

  function backgrounds(scene) {
    const W = 960, H = 576;
    midLayer(scene, 'bg_city_mid', 'city', 0x120d24, 0x2a1f46);
    midLayer(scene, 'bg_forest_mid', 'forest', 0x0f302d, 0x9ffff0);
    midLayer(scene, 'bg_cave_mid', 'cave', 0x110c1e, 0x3a2a5a);
    midLayer(scene, 'bg_redgate_mid', 'redgate', 0x1c070c, 0x5a1420);
    haze(scene);
    make(scene, 'fx_grade', 4, 4, (g) => rect(g, 0xffffff, 0, 0, 4, 4));
    gradient(scene, 'bg_city_sky', [0x050814, 0x10142c, 0x252046, 0x4a2a56, 0x6b3a5c]);
    gradient(scene, 'bg_forest_sky', [0x061418, 0x0e2b30, 0x1d4c46, 0x2f6b58]);
    gradient(scene, 'bg_cave_sky', [0x05040c, 0x110c20, 0x1d1533, 0x2a1e42]);

    // --- Đô thị ban đêm
    make(scene, 'bg_city_far', W, H, (g) => {
      // sao
      for (let i = 0; i < 90; i++) {
        const x = (i * 137.5) % W, y = (i * 71.3) % 300, s = 0.8 + rnd(i) * 1.4;
        rect(g, 0xffffff, x, y, s, s, 0.18 + rnd(i, 2) * 0.4);
      }
      // trăng + quầng
      ell(g, 0xfff3d6, 782, 92, 52, 52, 0.06);
      ell(g, 0xfff3d6, 782, 92, 34, 34, 0.1);
      ell(g, 0xfff6e0, 782, 92, 23, 23, 0.92);
      ell(g, 0xfffdf2, 776, 84, 13, 13, 0.55);
      // cổng đỏ lơ lửng
      ell(g, 0xff2d55, 300, 118, 96, 60, 0.05);
      ell(g, 0xff2d55, 300, 118, 70, 42, 0.1);
      g.lineStyle(4, 0xff5c7a, 0.7); g.strokeEllipse(300, 118, 118, 66);
      g.lineStyle(1.6, 0xffb3c1, 0.5); g.strokeEllipse(300, 118, 96, 52);
      ell(g, 0x2a0616, 300, 118, 48, 26, 0.85);
      ell(g, 0x8a1030, 300, 118, 26, 14, 0.5);
      // dãy nhà xa
      for (let i = 0; i < 26; i++) {
        const x = i * 38 - 10, hh = 110 + rnd(i, 5) * 150, w = 30 + rnd(i, 7) * 12;
        rect(g, 0x150f2a, x, H - hh, w, hh, 0.75);
        rect(g, 0x1c1738, x, H - hh, w, 6, 0.8);
        for (let y = H - hh + 12; y < H - 30; y += 14) {
          for (let wx = x + 4; wx < x + w - 4; wx += 8) {
            if (rnd(wx + y, 3) > 0.62) rect(g, 0xffd27a, wx, y, 3, 5, 0.3 + rnd(wx * y) * 0.35);
          }
        }
      }
      // cột ăng ten
      rect(g, 0x150f2a, 598, 120, 5, 340, 0.9);
      rect(g, 0xff2d55, 598, 112, 5, 6, 0.9);
      mist(g, 400, 176, 0x2a1f46, 0.22);
    });

    make(scene, 'bg_city_near', W, H, (g) => {
      const neons = [0x3fd0ff, 0xff4fa3, 0x7c4dff, 0xffc94a];
      for (let i = 0; i < 9; i++) {
        const x = i * 116 - 30, hh = 250 + rnd(i, 11) * 120;
        rect(g, 0x0d1120, x, H - hh, 96, hh);
        rect(g, 0x141a2e, x, H - hh, 96, 8);
        rect(g, 0x1a2138, x + 4, H - hh + 8, 88, 6, 0.7);
        // cửa sổ
        for (let y = H - hh + 26; y < H - 40; y += 22) {
          for (let wx = x + 10; wx < x + 84; wx += 16) {
            const on = rnd(wx + y * 3, i) > 0.55;
            rect(g, on ? 0xffe0a8 : 0x10141f, wx, y, 8, 12, on ? 0.5 + rnd(wx) * 0.3 : 0.7);
          }
        }
        // biển neon dọc
        const n = neons[i % neons.length];
        g.fillStyle(n, 0.14); g.fillRect(x + 12, H - hh + 54, 40, 84);
        rect(g, n, x + 18, H - hh + 60, 16, 66, 0.55);
        rect(g, light(n, 25), x + 20, H - hh + 62, 12, 20, 0.35);
        // bồn nước / máy móc trên mái
        if (i % 3 === 0) {
          rrect(g, 0x1c2334, x + 58, H - hh - 22, 26, 24, 4);
          rect(g, 0x2a3448, x + 60, H - hh - 18, 22, 3, 0.8);
        }
        if (i % 4 === 1) {
          rect(g, 0x1c2334, x + 30, H - hh - 34, 3, 34);
          ell(g, 0xff4fa3, x + 31.5, H - hh - 36, 2, 2, 0.9);
        }
      }
      // dây điện
      g.lineStyle(1, 0x0a0d16, 0.7);
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(0, 120 + i * 16);
        for (let x = 0; x <= W; x += 60) g.lineTo(x, 120 + i * 16 + Math.sin(x / 90 + i) * 5);
        g.strokePath();
      }
      mist(g, 420, 156, 0x1a2340, 0.3);
    });

    // --- Rừng sương
    make(scene, 'bg_forest_far', W, H, (g) => {
      // núi xa
      for (let layer = 0; layer < 2; layer++) {
        const base = 330 + layer * 40, col = layer ? 0x123a38 : 0x16423e;
        g.fillStyle(col, layer ? 0.85 : 0.6);
        g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W; x += 12) g.lineTo(x, base + Math.sin(x / 150 + layer) * 34 + Math.sin(x / 57 + layer * 2) * 14);
        g.lineTo(W, H); g.closePath(); g.fillPath();
      }
      // cụm tre xa: thân thưa, có đốt và lá, không xếp đều như cột
      for (let i = 0; i < 13; i++) {
        const x = i * 78 + rnd(i) * 46 - 12, hh = 290 + rnd(i, 2) * 240, w = 4 + rnd(i, 3) * 3.2;
        rect(g, 0x0f3230, x, H - hh, w, hh, 0.62);
        rect(g, 0x17453f, x + 1, H - hh, 1.6, hh, 0.45);
        for (let k = 1; k < 7; k++) rect(g, 0x0a2a28, x - 1, H - hh + k * hh / 7, w + 2, 1.4, 0.32);
        for (let k = 0; k < 3; k++) {
          const ly = H - hh + 44 + k * 52 + rnd(i + k) * 16, cx = x + w / 2;
          const lb = (dir, len, ang, col, a) => {
            const ex = cx + dir * Math.cos(ang) * len, ey = ly + 6 + Math.sin(ang) * len;
            const nx = -Math.sin(ang) * 2.4 * dir, ny = Math.cos(ang) * 2.4;
            poly(g, col, [[cx, ly + 6], [cx + nx, ly + 6 + ny], [ex + nx * 0.2, ey + ny * 0.2], [ex, ey], [ex - nx * 0.2, ey - ny * 0.2], [cx - nx, ly + 6 - ny]], a);
          };
          lb(-1, 30 + k * 4, 0.72, 0x0f3230, 0.5);
          lb(1, 32 + k * 5, 0.95, 0x0f3230, 0.5);
          lb(-1, 20, -0.55, 0x123a36, 0.35);
          lb(1, 22, -0.42, 0x123a36, 0.35);
        }
      }
      mist(g, 280, 140, 0x9ffff0, 0.1);
      mist(g, 380, 180, 0x6fd8c0, 0.1);
      for (let i = 0; i < 34; i++) {
        ell(g, 0x7fffd4, (i * 97.3) % W, 140 + (i * 53.7) % 320, 1.3, 1.3, 0.3 + rnd(i) * 0.35);
      }
    });

    make(scene, 'bg_forest_near', W, H, (g) => {
      for (let i = 0; i < 7; i++) {
        const bx = 14 + i * 142 + rnd(i, 6) * 26, hh = 380 + rnd(i, 4) * 170, w = 11 + rnd(i, 8) * 5;
        const lean = (rnd(i, 9) - 0.5) * 16;
        // thân tre cong dần, có đốt
        for (let k = 0; k < 6; k++) {
          const yy = H - hh + k * hh / 6, off = lean * (k / 6);
          rect(g, 0x0b2724, bx + off, yy, w, hh / 6 + 1);
          rect(g, 0x113330, bx + off + 1.6, yy, w * 0.3, hh / 6 + 1, 0.7);
          rect(g, 0x08201e, bx + off + 0.8, yy, w - 1.6, 1.6, 0.55);
        }
        // lá tre thuôn nhọn, rủ xuống theo nhiều hướng
        const leaf = (ox, oy, len, ang, col, a) => {
          const sx = bx + ox, sy = oy;
          const ex = sx + Math.cos(ang) * len, ey = sy + Math.sin(ang) * len;
          const nx = -Math.sin(ang) * 3.2, ny = Math.cos(ang) * 3.2;
          poly(g, col, [[sx, sy], [sx + nx, sy + ny], [ex + nx * 0.25, ey + ny * 0.25], [ex, ey], [ex - nx * 0.25, ey - ny * 0.25], [sx - nx, sy - ny]], a);
        };
        for (let k = 0; k < 2; k++) {
          const sy = H - hh + 46 + k * 70, sx = bx + lean * (0.2 + k * 0.12) + w / 2;
          leaf(sx - bx, sy, 44 + rnd(i, k) * 22, 0.95 + rnd(i, k + 1) * 0.25, 0x0b2724, 1);
          leaf(sx - bx, sy + 3, 34 + rnd(i, k + 4) * 18, 1.3, 0x0b2724, 0.9);
          leaf(sx - bx, sy + 1, 36 + rnd(i, k + 7) * 16, -0.8 - rnd(i, k + 2) * 0.2, 0x0b2724, 0.92);
          leaf(sx - bx, sy + 2, 24, 1.05, 0x103531, 0.85);
          leaf(sx - bx, sy + 4, 20, -0.95, 0x103531, 0.7);
        }
      }
      // nấm ven bờ
      for (let i = 0; i < 6; i++) {
        const x = 40 + i * 150;
        ell(g, 0xc77dff, x, 470 + rnd(i) * 80, 3.4, 2, 0.55);
      }
      mist(g, 430, 146, 0x9ffff0, 0.12);
    });

    // --- Hang pha lê
    make(scene, 'bg_cave_far', W, H, (g) => {
      for (let i = 0; i < 9; i++) {
        const x = i * 120;
        poly(g, 0x140f26, [[x, 0], [x + 120, 0], [x + 120, 140], [x + 60, 230], [x, 120]]);
        rect(g, 0x140f26, x + 20, 0, 20, H, 0.9);
      }
      mist(g, 200, 160, 0x2a1e42, 0.3);
      for (const [x, y, s] of [[90, 330, 1], [330, 430, 1.3], [610, 270, 0.9], [850, 390, 1.1], [470, 190, 0.8]]) {
        g.fillStyle(0xb388ff, 0.1); g.fillCircle(x, y, 26 * s);
        poly(g, 0x8a6cff, [[x - 8 * s, y + 26 * s], [x + 8 * s, y + 26 * s], [x, y - 30 * s]]);
        poly(g, 0xc4b0ff, [[x - 3 * s, y + 24 * s], [x + 2 * s, y + 24 * s], [x, y - 22 * s]], 0.8);
        ell(g, 0xffffff, x, y - 12 * s, 2 * s, 5 * s, 0.35);
      }
    });

    make(scene, 'bg_cave_near', W, H, (g) => {
      // măng đá gồ ghề, không phải hình tam giác đều
      for (let i = 0; i < 6; i++) {
        const x = 60 + i * 186, top = 268 + rnd(i) * 60;
        poly(g, 0x120d20, [[x - 84, H], [x - 50, top + 90], [x - 22, top + 34], [x + 2, top], [x + 26, top + 40], [x + 48, top + 78], [x + 84, H]]);
        poly(g, 0x1a142c, [[x - 40, H], [x - 12, top + 96], [x + 4, top + 44], [x + 20, top + 84], [x + 46, H]], 0.85);
        poly(g, 0x241a3a, [[x + 2, top + 10], [x + 14, top + 58], [x + 26, top + 34]], 0.6);
      }
      for (const [x, y] of [[150, 470], [520, 500], [760, 450], [300, 520]]) {
        g.fillStyle(0x7c4dff, 0.16); g.fillCircle(x, y, 16);
        ell(g, 0x7c4dff, x, y, 6, 3.4, 0.5);
      }
      mist(g, 440, 136, 0x3a2a5a, 0.16);
    });

    // Viền tối cho khung hình (đặt phía trên cảnh, dưới HUD)
    make(scene, 'fx_vignette', 960, 576, (g) => {
      for (let i = 0; i < 54; i++) {
        const a = Math.pow(1 - i / 54, 2.2) * 0.42;
        g.lineStyle(2, 0x03060a, a);
        g.strokeRect(i, i, 960 - i * 2, 576 - i * 2);
      }
    });
  }

  Object.assign(Art._, { gradient, mist, midLayer, backgrounds });
})();
