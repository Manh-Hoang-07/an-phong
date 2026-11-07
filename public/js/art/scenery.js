'use strict';
/* Art · Cảnh trí: cây, nhà, đèn, tinh thể... */
(() => {
  const { OUT, shade, light, make, ell, rect, rrect, poly, line, bone, tri, rnd } = Art._;

  // ---------------------------------------------------------------- Cảnh trí
  function decorations(scene) {
    // Cửa hiệu Tân Đô: gỗ sẫm, mái ngói và cửa giấy ấm màu
    const shops = [
      { wall: 0x614238, neon: 0xd49a5e, wall2: 0x382b29 },
      { wall: 0x594337, neon: 0xc98658, wall2: 0x342a29 },
      { wall: 0x4b4838, neon: 0xd5b170, wall2: 0x302f2a },
    ];
    shops.forEach((s, i) => {
      make(scene, 'd_shop_' + i, 150, 170, (g) => {
        rect(g, OUT, 6, 0, 138, 170);
        rect(g, s.wall, 7, 1, 136, 169);
        rect(g, s.wall2, 7, 1, 14, 169);                 // phía khuất
        rect(g, light(s.wall, 8), 100, 1, 43, 169, 0.35);
        // mái
        poly(g, 0x332527, [[0, 12], [150, 12], [140, 0], [10, 0]]);
        poly(g, 0x68453a, [[4, 11], [146, 11], [137, 2], [13, 2]]);
        rect(g, s.neon, 6, 11.4, 138, 2.4, 0.5);
        // dãy cửa sổ trên
        for (let y = 22; y < 92; y += 26) {
          for (let x = 22; x < 128; x += 30) {
            const on = ((x * 7 + y * 3 + i * 5) % 5) > 1;
            rrect(g, 0x302725, x - 1.5, y - 1.5, 25, 18, 2);
            rrect(g, on ? 0xd8ad75 : 0x40332d, x, y, 22, 15, 1);
            if (on) {
              rect(g, 0xfff1c9, x, y, 22, 3, 0.85);
              rect(g, 0xffe6ae, x + 3, y + 6, 6, 8, 0.45);
            }
          }
        }
        // mái hiên
        poly(g, 0x352827, [[10, 96], [140, 96], [132, 108], [18, 108]]);
        poly(g, s.neon, [[12, 97], [138, 97], [134, 101], [16, 101]], 0.38);
        rect(g, 0x302625, 12, 104, 126, 5); rect(g, 0x76503b, 13, 105, 124, 3);
        // Biển vải treo và ô cửa shoji.
        rect(g, 0x362728, 18, 110, 114, 18, .98);
        rect(g, s.neon, 20, 112, 110, 14, .82);
        for (let x = 26; x < 125; x += 13) rect(g, 0x78483c, x, 112, 1.5, 14, .48);
        rect(g, 0xf0d3a0, 26, 116, 5, 6, .7); rect(g, 0xf0d3a0, 38, 116, 5, 6, .7);
        // Cửa trượt gỗ, giấy ấm màu và khung đậm.
        rrect(g, 0x2d2524, 18, 132, 114, 38, 3); rect(g, 0xc6a474, 21, 134, 108, 34, .7);
        for (let x = 26; x < 126; x += 16) rect(g, 0x74503a, x, 134, 2, 34, .8);
        rect(g, 0x74503a, 21, 150, 108, 2, .8); rect(g, 0x2e2524, 68, 136, 15, 32);
        // Dầm gỗ chạy dọc mặt tiền.
        rect(g, 0x332625, 8, 16, 4, 154, .85); rect(g, 0x936443, 11, 18, 2, 148, .55);
      });
    });

    // Đèn đường: thân cong, quầng sáng
    make(scene, 'd_lamp', 40, 96, (g) => {
      g.fillStyle(0xe9bd77, 0.1); g.fillTriangle(28, 14, 6, 96, 40, 96);
      rrect(g, 0x40332c, 3, 6, 6, 90, 3);
      rect(g, 0x8b6b4c, 4.2, 8, 2, 86, 0.9);
      bone(g, 0x40332c, 7, 10, 26, 13, 5);
      rrect(g, 0x40332c, 22, 10, 14, 8, 3);
      rrect(g, 0xfff0c0, 24, 12, 10, 5, 2);
      g.fillStyle(0xffe6a0, 0.3); g.fillCircle(29, 15, 10);
      g.fillStyle(0xfff8e0, 0.9); g.fillCircle(29, 14.6, 3.8);
      rrect(g, 0x40332c, 1, 92, 12, 4, 2);
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
      g.fillStyle(0x94c8b5, 0.15); g.fillCircle(25, 52, 24);
      const cr = (x, h, w, c) => {
        poly(g, shade(c, 35), [[x - w, 70], [x + w, 70], [x, 70 - h]]);
        poly(g, c, [[x - w * 0.6, 70], [x + w * 0.7, 70], [x, 70 - h + 2]]);
        poly(g, light(c, 25), [[x - w * 0.2, 70], [x + w * 0.2, 70], [x, 70 - h + 6]], 0.55);
      };
      cr(14, 32, 7, 0x537f83);
      cr(36, 42, 8, 0x78a79e);
      cr(25, 58, 9, 0xb8d3b4);
      ell(g, 0xffedc6, 25, 18, 2, 5, 0.45);
      ell(g, 0xc1ddc5, 25, 60, 14, 4, 0.35);
    });

    // Nhũ đá treo
    make(scene, 'd_stalactite', 26, 52, (g) => {
      poly(g, 0x24333b, [[1, 0], [25, 0], [13, 52]]);
      poly(g, 0x496167, [[3, 0], [23, 0], [13, 46]]);
      poly(g, 0x72958a, [[9, 0], [17, 0], [13, 34]], 0.8);
      poly(g, 0xc0ddc6, [[11, 0], [15, 0], [13, 26]], 0.5);
      g.fillStyle(0x9bc8b8, 0.12); g.fillCircle(13, 34, 10);
    });

    // Cổng dịch chuyển: xoáy sáng nhiều lớp
    make(scene, 'd_portal', 80, 120, (g) => {
      ell(g, 0xe4a871, 40, 60, 40, 60, 0.1);
      ell(g, 0xe4a871, 40, 60, 33, 53, 0.18);
      ell(g, 0x512b41, 40, 60, 30, 50, 0.86);
      ell(g, 0x713b4c, 40, 58, 25, 44, 0.9);
      ell(g, 0xd28a65, 40, 56, 18, 34, 0.54);
      ell(g, 0xf1c08a, 40, 54, 11, 22, 0.72);
      ell(g, 0xffe5b2, 40, 52, 5, 12, 0.86);
      g.lineStyle(2.4, 0xf0c080, 0.85); g.strokeEllipse(40, 60, 66, 106);
      g.lineStyle(1.2, 0xffe2b4, 0.55); g.strokeEllipse(40, 60, 54, 90);
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
