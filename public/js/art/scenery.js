'use strict';
/* Art · Cảnh trí: cây, nhà, đèn, tinh thể... */
(() => {
  const { OUT, shade, light, make, ell, rect, rrect, poly, line, bone, tri, rnd } = Art._;

  // ---------------------------------------------------------------- Cảnh trí
  function decorations(scene) {
    // Cửa hiệu kiểu đô thị: mái, biển hiệu phát sáng, cửa kính
    const shops = [
      { wall: 0x2b3350, neon: 0x3fd0ff, wall2: 0x1d2440 },
      { wall: 0x3a2b4a, neon: 0xff4fa3, wall2: 0x2a1e38 },
      { wall: 0x2f3d3a, neon: 0xffc94a, wall2: 0x232e2c },
    ];
    shops.forEach((s, i) => {
      make(scene, 'd_shop_' + i, 150, 170, (g) => {
        rect(g, OUT, 6, 0, 138, 170);
        rect(g, s.wall, 7, 1, 136, 169);
        rect(g, s.wall2, 7, 1, 14, 169);                 // phía khuất
        rect(g, light(s.wall, 8), 100, 1, 43, 169, 0.35);
        // mái
        poly(g, 0x171b26, [[0, 12], [150, 12], [140, 0], [10, 0]]);
        poly(g, 0x2a3040, [[4, 11], [146, 11], [137, 2], [13, 2]]);
        rect(g, s.neon, 6, 11.4, 138, 2.4, 0.55);
        // dãy cửa sổ trên
        for (let y = 22; y < 92; y += 26) {
          for (let x = 22; x < 128; x += 30) {
            const on = ((x * 7 + y * 3 + i * 5) % 5) > 1;
            rrect(g, 0x12151f, x - 1.5, y - 1.5, 25, 18, 3);
            rrect(g, on ? 0xffd88a : 0x1b2130, x, y, 22, 15, 2);
            if (on) {
              rect(g, 0xfff1c9, x, y, 22, 3, 0.85);
              rect(g, 0xffe6ae, x + 3, y + 6, 6, 8, 0.45);
            }
          }
        }
        // mái hiên
        poly(g, 0x1a2130, [[10, 96], [140, 96], [132, 108], [18, 108]]);
        poly(g, s.neon, [[12, 97], [138, 97], [134, 101], [16, 101]], 0.3);
        rect(g, OUT, 12, 104, 126, 5);
        rect(g, 0x2d3648, 13, 105, 124, 3);
        // biển hiệu
        rect(g, 0x0e1220, 18, 110, 114, 18, 0.95);
        rect(g, s.neon, 20, 112, 110, 14, 0.22);
        rect(g, s.neon, 26, 117, 98, 4, 0.9);
        rect(g, 0xffffff, 26, 117, 98, 1.4, 0.8);
        g.fillStyle(s.neon, 0.16); g.fillRect(12, 104, 126, 30);
        // cửa kính
        rrect(g, OUT, 18, 132, 114, 38, 4);
        rrect(g, 0x101722, 20, 133, 110, 36, 3);
        rect(g, 0xa8d8ff, 24, 137, 48, 28, 0.22);
        rect(g, 0xa8d8ff, 78, 137, 48, 28, 0.22);
        rect(g, s.neon, 20, 133, 110, 2.4, 0.75);
        rect(g, 0x0b0f18, 68, 138, 16, 31);
        // chi tiết: máy lạnh, ống nước
        rrect(g, 0x3a4356, 118, 76, 20, 14, 2);
        for (let k = 0; k < 3; k++) rect(g, 0x2b3242, 120, 78 + k * 4, 16, 1.4, 0.9);
        rect(g, 0x2a3040, 8, 16, 3, 154, 0.8);
      });
    });

    // Đèn đường: thân cong, quầng sáng
    make(scene, 'd_lamp', 40, 96, (g) => {
      g.fillStyle(0xffe6a0, 0.1); g.fillTriangle(28, 14, 6, 96, 40, 96);
      rrect(g, 0x2e3546, 3, 6, 6, 90, 3);
      rect(g, 0x59647a, 4.2, 8, 2, 86, 0.9);
      bone(g, 0x2e3546, 7, 10, 26, 13, 5);
      rrect(g, 0x2e3546, 22, 10, 14, 8, 3);
      rrect(g, 0xfff0c0, 24, 12, 10, 5, 2);
      g.fillStyle(0xffe6a0, 0.3); g.fillCircle(29, 15, 10);
      g.fillStyle(0xfff8e0, 0.9); g.fillCircle(29, 14.6, 3.8);
      rrect(g, 0x2e3546, 1, 92, 12, 4, 2);
    });

    // Cây đô thị: bồn + tán lá nhiều lớp
    make(scene, 'd_tree', 70, 100, (g) => {
      poly(g, 0x2a303c, [[22, 84], [48, 84], [52, 100], [18, 100]]);
      rect(g, 0x4a5364, 20, 82, 30, 4);
      rrect(g, 0x4a3426, 30, 46, 7, 38, 2);
      rect(g, 0x6b4a33, 31, 48, 2.4, 34, 0.8);
      bone(g, 0x4a3426, 34, 52, 22, 42, 3.4);
      bone(g, 0x4a3426, 34, 50, 47, 40, 3);
      ell(g, 0x1d3a2c, 35, 34, 24, 20);
      ell(g, 0x26513a, 34, 32, 21, 17);
      ell(g, 0x2f6b47, 30, 28, 14, 11);
      ell(g, 0x3d8a56, 26, 24, 8.6, 6.4, 0.9);
      ell(g, 0x4aa869, 22, 21, 4.6, 3.4, 0.7);
      ell(g, 0x26513a, 50, 42, 12, 9);
      ell(g, 0x2f6b47, 48, 39, 8, 6);
      ell(g, 0x7fffd4, 20, 30, 1.6, 1.6, 0.5);
      ell(g, 0x7fffd4, 44, 24, 1.4, 1.4, 0.4);
    });

    // Đại thụ trong cổng: thân xoắn, nấm phát sáng, dây leo
    make(scene, 'd_dtree', 90, 190, (g) => {
      poly(g, 0x24222c, [[34, 40], [54, 40], [58, 190], [28, 190]]);
      poly(g, 0x2f2d38, [[36, 44], [50, 44], [52, 190], [34, 190]]);
      rect(g, 0x3a3944, 37, 48, 4, 140, 0.8);
      // rễ
      bone(g, 0x24222c, 30, 176, 12, 190, 7);
      bone(g, 0x24222c, 56, 176, 76, 190, 7);
      bone(g, 0x2f2d38, 40, 168, 26, 190, 4);
      // cành
      bone(g, 0x24222c, 40, 70, 12, 34, 5);
      bone(g, 0x24222c, 48, 78, 80, 30, 5);
      bone(g, 0x2f2d38, 38, 110, 14, 84, 4);
      // tán lá ít, tập trung trên
      ell(g, 0x1d3a34, 44, 22, 22, 12);
      ell(g, 0x26513a, 40, 18, 15, 8);
      // nấm phát sáng dưới gốc
      g.fillStyle(0x7fffd4, 0.14); g.fillCircle(30, 176, 16);
      ell(g, 0x7fffd4, 28, 176, 8, 4);
      ell(g, 0xc77dff, 62, 182, 6, 3);
      ell(g, 0x7fffd4, 16, 184, 5, 2.6);
      // dây leo
      line(g, 0x2f6b47, 46, 30, 40, 90, 1.6, 0.6);
      line(g, 0x2f6b47, 50, 40, 58, 110, 1.4, 0.5);
      // đom đóm
      for (let i = 0; i < 8; i++) {
        ell(g, i % 3 ? 0x7fffd4 : 0xc77dff, 14 + rnd(i) * 62, 20 + rnd(i, 2) * 120, 1.4, 1.4, 0.5);
      }
    });

    // Cụm nấm phát sáng
    make(scene, 'd_shroom', 46, 34, (g) => {
      g.fillStyle(0x7fffd4, 0.14); g.fillCircle(23, 22, 20);
      const shroom = (x, y, w, c, cap) => {
        rrect(g, 0xd8f5ec, x - 1.2, y, 2.4, 34 - y, 1);
        ell(g, cap, x, y, w, w * 0.6);
        ell(g, light(cap, 20), x - w * 0.2, y - w * 0.16, w * 0.6, w * 0.3, 0.8);
      };
      shroom(12, 19, 7, 0, 0x5ce0c0);
      shroom(30, 11, 10, 0, 0x7fffd4);
      shroom(40, 23, 5, 0, 0xc77dff);
      ell(g, 0xd8f5ec, 12, 19, 1.4, 0.8);
      ell(g, 0xffffff, 29, 10, 2.4, 1.2, 0.6);
    });

    // Mỏ pha lê
    make(scene, 'd_crystal', 50, 70, (g) => {
      g.fillStyle(0xb388ff, 0.18); g.fillCircle(25, 52, 24);
      const cr = (x, h, w, c) => {
        poly(g, shade(c, 35), [[x - w, 70], [x + w, 70], [x, 70 - h]]);
        poly(g, c, [[x - w * 0.6, 70], [x + w * 0.7, 70], [x, 70 - h + 2]]);
        poly(g, light(c, 25), [[x - w * 0.2, 70], [x + w * 0.2, 70], [x, 70 - h + 6]], 0.55);
      };
      cr(14, 32, 7, 0x8a6cff);
      cr(36, 42, 8, 0xa98bff);
      cr(25, 58, 9, 0xc4b0ff);
      ell(g, 0xffffff, 25, 18, 2, 5, 0.45);
      ell(g, 0xe0d0ff, 25, 60, 14, 4, 0.35);
    });

    // Nhũ đá treo
    make(scene, 'd_stalactite', 26, 52, (g) => {
      poly(g, 0x2a2838, [[1, 0], [25, 0], [13, 52]]);
      poly(g, 0x4e4f72, [[3, 0], [23, 0], [13, 46]]);
      poly(g, 0x6a6a94, [[9, 0], [17, 0], [13, 34]], 0.8);
      poly(g, 0xb388ff, [[11, 0], [15, 0], [13, 26]], 0.5);
      g.fillStyle(0xb388ff, 0.14); g.fillCircle(13, 34, 10);
    });

    // Cổng dịch chuyển: xoáy sáng nhiều lớp
    make(scene, 'd_portal', 80, 120, (g) => {
      ell(g, 0x3fd0ff, 40, 60, 40, 60, 0.08);
      ell(g, 0x3fd0ff, 40, 60, 33, 53, 0.14);
      ell(g, 0x1f4fa0, 40, 60, 30, 50, 0.85);
      ell(g, 0x2a68c8, 40, 58, 25, 44, 0.9);
      ell(g, 0x3fd0ff, 40, 56, 18, 34, 0.55);
      ell(g, 0x9fe8ff, 40, 54, 11, 22, 0.7);
      ell(g, 0xeafaff, 40, 52, 5, 12, 0.85);
      g.lineStyle(2.4, 0x9fe8ff, 0.85); g.strokeEllipse(40, 60, 66, 106);
      g.lineStyle(1.2, 0xffffff, 0.6); g.strokeEllipse(40, 60, 54, 90);
      // tia sáng vòng quanh
      for (let i = 0; i < 10; i++) {
        const an = i / 10 * Math.PI * 2;
        const x = 40 + Math.cos(an) * 34, y = 60 + Math.sin(an) * 52;
        ell(g, 0xffffff, x, y, 1.4, 1.4, 0.45);
      }
    });

    make(scene, 'mark_quest', 16, 24, (g) => {
      rect(g, 0x2a1f0a, 5, 1, 6, 15, 0.9);
      rect(g, 0xffd54f, 5.6, 1.6, 4.8, 12.6, 0.98);
      rect(g, 0xfff3c0, 6.2, 2.4, 1.6, 8, 0.8);
      ell(g, 0x2a1f0a, 8, 20.4, 3.2, 3.2, 0.9);
      ell(g, 0xffd54f, 8, 20.4, 2.4, 2.4);
      g.fillStyle(0xffd54f, 0.16); g.fillCircle(8, 12, 10);
    });
    make(scene, 'mark_done', 18, 24, (g) => {
      g.fillStyle(0x69f0ae, 0.16); g.fillCircle(9, 12, 11);
      g.lineStyle(4.4, 0x1c3f30, 0.9);
      g.beginPath(); g.moveTo(4, 12); g.lineTo(8, 17); g.lineTo(15, 6); g.strokePath();
      g.lineStyle(2.6, 0x69f0ae, 1);
      g.beginPath(); g.moveTo(4.4, 11.6); g.lineTo(8, 16); g.lineTo(14.6, 5.6); g.strokePath();
    });

    // Cỏ, hoa, sỏi rải trên mặt đất
    make(scene, 'd_grass', 18, 14, (g) => {
      for (let i = 0; i < 6; i++) {
        const x = 2 + i * 2.8, h = 5 + (i % 3) * 3.4;
        tri(g, i % 2 ? 0x4f9a5e : 0x3d7c4c, x, 14, x + 1.8, 14, x + 0.8, 14 - h);
      }
      ell(g, 0x6fbf7c, 9, 13.4, 6, 1.4, 0.35);
    });
    make(scene, 'd_flower', 16, 12, (g) => {
      line(g, 0x3d7c4c, 8, 12, 8, 6.6, 1.2);
      ell(g, 0xffe08a, 8, 5, 2.4, 2.4);
      ell(g, 0xfff6d0, 8, 5, 1.2, 1.2);
      ell(g, 0x8ed8a0, 11, 9.6, 2.2, 1);
      ell(g, 0xc77dff, 4, 9, 1.6, 1.6, 0.8);
    });
    make(scene, 'd_pebble', 16, 10, (g) => {
      ell(g, 0x2a2f3a, 8, 7.4, 6, 2.4, 0.35);
      ell(g, 0x5d6472, 7, 6, 3.6, 2.4);
      ell(g, 0x7d8494, 6.2, 5.2, 2, 1.2, 0.8);
      ell(g, 0x464c58, 12, 7.4, 2.2, 1.6);
    });
    make(scene, 'd_rubble', 18, 12, (g) => {
      ell(g, 0x20242c, 9, 9.4, 8, 2.6, 0.35);
      poly(g, 0x3a4150, [[3, 10], [6, 4], [9, 10]]);
      poly(g, 0x4d5666, [[9, 10], [13, 5], [16, 10]]);
      poly(g, 0x6b7484, [[12, 10], [15, 7], [17, 10]], 0.7);
    });
  }

  Object.assign(Art._, { decorations });
})();
