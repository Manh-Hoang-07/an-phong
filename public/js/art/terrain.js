'use strict';
/* Art · Địa hình: bảng màu theo chủ đề bản đồ và ô đất. */
(() => {
  const { light, make, ell, rect, rrect, line, tri, rnd } = Art._;

  // ---------------------------------------------------------------- Địa hình
  const THEMES = {
    city: { top: 0x98816a, top2: 0x68594f, fill: 0x514941, fill2: 0x393537, plank: [0x5a4038, 0xb27b53, 0x30262a] },
    forest: { top: 0x7e875b, top2: 0x55583f, fill: 0x514b3c, fill2: 0x35342e, glow: 0xe2ad67, plank: [0x674832, 0xb38653, 0x34291f] },
    cave: { top: 0x68807f, top2: 0x43585e, fill: 0x34434b, fill2: 0x25323b, glow: 0xa8d6c4, plank: [0x43545a, 0x86aaa0, 0x26323a] },
  };

  function tiles(scene) {
    // Mặt đất: viền sáng mảnh ở trên, thân có vân loang (không kẻ ô)
    for (const t in THEMES) {
      const c = THEMES[t];
      make(scene, `tile_${t}_top`, 32, 32, (g) => {
        rect(g, c.fill, 0, 0, 32, 32);
        if (t === 'city') {
          // mép vỉa hè liền một dải, bên dưới là mặt nhựa mịn (không lát gạch)
          rect(g, 0xd0ac76, 0, 0, 32, 0.9, 0.36);
          rect(g, 0x92775d, 0, 0.9, 32, 3.6);
          rect(g, 0xb39672, 0, 0.9, 32, 1.1, 0.5);
          ell(g, 0x6d6256, 9, 3.4, 7, 1.6, 0.5);
          ell(g, 0x6d6256, 26, 2.6, 5, 1.4, 0.4);
          rect(g, 0x594e46, 0, 4.5, 32, 1.8);
          rect(g, 0x373438, 0, 6.3, 32, 1.5, 0.75);
          // mảng loang rất nhẹ + một vết nứt mảnh cho đỡ phẳng
          ell(g, 0x65584b, 7, 19, 11, 7, 0.28);
          ell(g, 0x403b3a, 25, 25, 12, 6, 0.3);
          line(g, 0x302d2c, 12, 12, 19, 26, 0.8, 0.22);
        } else if (t === 'forest') {
          rect(g, 0xe1b36e, 0, 0, 32, 1, 0.2);
          rect(g, c.top, 0, 0.6, 32, 4.6);
          rect(g, 0x4f9a62, 0, 0.6, 32, 2.4, 0.9);
          rect(g, 0x6fc07c, 0, 0.6, 32, 0.9, 0.55);
          // cỏ mọc tua tủa, nhiều sắc
          for (let i = 0; i < 14; i++) {
            const x = 0.6 + i * 2.3 + rnd(i) * 1.6, h = 2.6 + rnd(i, 3) * 4.6;
            tri(g, i % 3 === 0 ? 0xa5a466 : i % 3 === 1 ? 0x828a54 : 0x65754b, x, 1.4, x + 1.9, 1.4, x + 0.6, 1.4 - h);
          }
          rect(g, c.top2, 0, 5, 32, 2.2);
          rect(g, 0x4a3728, 0, 7.2, 32, 2.4, 0.95);
          rect(g, c.fill, 0, 9.6, 32, 22.4);
          for (let i = 0; i < 9; i++) {
            const x = (i * 11.7) % 30, y = 11 + (i * 8.3) % 19;
            rect(g, i % 2 ? 0x4f3d2c : 0x2b312c, x, y, 1.8, 1.4, 0.35);
          }
          ell(g, 0x3a2c20, 8, 20, 8, 4, 0.2);
          ell(g, 0x4d6b4a, 24, 13, 6, 3, 0.18);
          ell(g, 0x6f7f88, 19, 24, 4, 2.4, 0.22);
          line(g, 0x3a2c20, 4, 12, 9, 26, 1.2, 0.45);
          line(g, 0x3a2c20, 27, 10, 22, 28, 1.2, 0.35);
        } else {
          // mặt đá gồ ghề: vài phiến đá bo tròn thay cho đường kẻ ngang
          rect(g, c.top, 0, 0.4, 32, 4.4);
          ell(g, 0x7a7498, 6, 1.2, 9, 2.6, 0.7);
          ell(g, 0x7a7498, 24, 1.6, 8, 2.4, 0.6);
          ell(g, 0x8f8bb8, 15, 0.2, 5, 1.6, 0.45);
          ell(g, c.top2, 20, 6, 11, 3.4, 0.9);
          ell(g, 0x1b1a2b, 8, 7.6, 9, 2, 0.8);
          for (let i = 0; i < 9; i++) {
            const x = (i * 10.3) % 30, y = 10 + (i * 7.7) % 20;
            rect(g, i % 3 ? 0x3c3a58 : 0x27263a, x, y, 1.8, 1.5, 0.3);
          }
          ell(g, 0x3a3758, 10, 18, 7, 4, 0.2);
          ell(g, 0x22203a, 26, 26, 8, 4, 0.24);
          rect(g, c.glow, 8, 6.4, 2.2, 1.4, 0.5);
          rect(g, c.glow, 24, 9.4, 1.8, 1.2, 0.35);
        }
      });

      make(scene, `tile_${t}_fill`, 32, 32, (g) => {
        rect(g, c.fill, 0, 0, 32, 32);
        // hạt li ti rất nhẹ, không thành hàng lối
        for (let i = 0; i < 6; i++) {
          const x = (i * 17.3) % 30, y = 5 + (i * 12.7) % 25, s = 1 + (i % 2) * 0.8;
          rect(g, i % 2 ? c.fill2 : light(c.fill, 6), x, y, s, s * 0.7, 0.18);
        }
        rect(g, 0x000000, 0, 0, 32, 1.4, 0.1);
        if (t === 'forest') {
          line(g, 0x3a2c20, 8, 6, 12, 18, 1.2, 0.35);
          line(g, 0x3a2c20, 12, 18, 9, 30, 1.2, 0.25);
          rect(g, 0x4f8a5e, 3, 2, 3, 2, 0.25);
        } else if (t === 'cave') {
          rect(g, c.glow, 18, 20, 2, 2, 0.18);
          rect(g, c.glow, 5, 13, 1.6, 1.6, 0.12);
        } else {
          rect(g, 0x3a404c, 0, 0, 32, 2, 0.35);
        }
      });

      make(scene, `plank_${t}`, 32, 12, (g) => {
        const [base, hi, lo] = c.plank;
        rrect(g, lo, 0, 0, 32, 12, 2);
        rrect(g, base, 0, 0.8, 32, 9.4, 2);
        rect(g, hi, 0, 0.8, 32, 2, 0.9);
        rect(g, light(base, 12), 0, 2.8, 32, 1, 0.4);
        if (t === 'city') {
          for (let i = 0; i < 4; i++) rect(g, 0x8f9aad, 3 + i * 8, 4.4, 4, 1, 0.5);
          rect(g, 0xc3c8d3, 4, 5.2, 2, 2, 0.8);
          rect(g, 0xc3c8d3, 26, 5.2, 2, 2, 0.8);
          rect(g, lo, 15, 1.8, 2, 8, 0.8);
        } else if (t === 'forest') {
          line(g, lo, 6, 2.4, 26, 3.4, 0.9, 0.4);
          line(g, lo, 4, 6.4, 20, 7.2, 0.9, 0.3);
          ell(g, 0x5aa86e, 8, 3.4, 3.4, 1.4, 0.8);
          ell(g, 0x46895a, 22, 8.6, 4, 1.4, 0.6);
          rect(g, 0x6b4a2f, 15, 1, 1.6, 9, 0.8);
        } else {
          line(g, lo, 5, 4, 27, 5.4, 0.9, 0.4);
          rect(g, c.glow, 10, 5.4, 2, 1.6, 0.4);
          rect(g, c.glow, 22, 3.4, 1.6, 1.4, 0.3);
        }
      });
    }
  }

  Object.assign(Art._, { THEMES, tiles });
  Object.assign(Art, { THEMES });
})();
