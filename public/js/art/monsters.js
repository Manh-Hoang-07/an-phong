'use strict';
/* Art · Quái. */
(() => {
  const { make, ell, rect, rrect, poly, line, bone, tri } = Art._;

  // ---------------------------------------------------------------- Quái
  function monsters(scene) {
    // Bù nhìn tập luyện: cột gỗ, thân rơm, bia đỏ
    for (let f = 0; f < 2; f++) {
      make(scene, 'm_dummy_' + f, 30, 46, (g) => {
        const o = f ? 1 : 0;
        rrect(g, 0x2e2015, 12, 14, 6, 31, 2);
        rrect(g, 0x5c422c, 12.6, 14, 3, 30, 1.5);
        ell(g, 0x7d6a34, 15, 25 + o, 9.6, 8.6);
        ell(g, 0xa89a55, 13.8, 23 + o, 7.6, 6.6);
        for (let i = 0; i < 5; i++) {
          line(g, 0x6b5a2c, 8 + i * 3.4, 19 + o, 9 + i * 3.2, 31 + o, 0.9, 0.5);
        }
        rect(g, 0x4a3a20, 11, 22 + o, 9, 1.6, 0.9);
        rect(g, 0x4a3a20, 11, 28 + o, 9, 1.6, 0.9);
        // bia tập
        ell(g, 0xe8e0cc, 15, 25 + o, 4.6, 4.6, 0.9);
        ell(g, 0xd94a4a, 15, 25 + o, 3.4, 3.4, 0.9);
        ell(g, 0xe8e0cc, 15, 25 + o, 2, 2, 0.95);
        ell(g, 0xb8b0a0, 15, 25 + o, 0.8, 0.8);
        // đầu bao cát
        ell(g, 0x3b3540, 15, 10 + f, 8.6, 8);
        ell(g, 0xb6bcc8, 15, 9.6 + f, 7.8, 7.2);
        rect(g, 0x1f1c24, 11.4, 8.4 + f, 2, 2);
        rect(g, 0x1f1c24, 16.6, 8.4 + f, 2, 2);
        rect(g, 0x8a8f9a, 12.6, 13 + f, 4.8, 1, 0.8);
        rect(g, 0x8a8f9a, 13.4, 15 + f, 3.2, 0.8, 0.6);
        tri(g, 0x6a5f3a, 20.6, 4 + f, 25, 8 + f, 20, 9 + f, 0.95);
      });
    }

    // Nấm độc: mũ cong, đốm sáng, thân mập
    for (let f = 0; f < 2; f++) {
      const sq = f ? 1.4 : 0;
      make(scene, 'm_mushroom_' + f, 36, 34, (g) => {
        ell(g, 0x8e3bb8, 18, 20 + sq, 12.6, 12);
        ell(g, 0xd8d0c0, 18, 23 + sq, 11, 9.6);
        ell(g, 0xefe7d8, 16.6, 22 + sq, 8.4, 7.4);
        rect(g, 0x2a1a2e, 13.6, 24 + sq, 2.4, 3);
        rect(g, 0x2a1a2e, 20.4, 24 + sq, 2.4, 3);
        ell(g, 0x2a1a2e, 13.6, 25.4 + sq, 1.2, 1.4);
        ell(g, 0x2a1a2e, 20.4, 25.4 + sq, 1.2, 1.4);
        rect(g, 0x6a5a70, 17.4, 28.4 + sq, 1.6, 1, 0.8);
        // mũ nấm
        ell(g, 0x6a2a8e, 18, 13 + sq, 17, 11.6);
        ell(g, 0x8e3bb8, 18, 11.6 + sq, 16, 10.6);
        ell(g, 0xb968e0, 16.4, 8.6 + sq, 11, 5.6, 0.9);
        ell(g, 0xe0a8ff, 14.4, 6.4 + sq, 5.6, 2.6, 0.75);
        ell(g, 0xfff0a8, 8.4, 11 + sq, 2.6, 2.4);
        ell(g, 0xfff0a8, 20.4, 5.4 + sq, 2.2, 2);
        ell(g, 0xd8f5a0, 27, 12 + sq, 2, 1.8);
        ell(g, 0xc77dff, 18, 17 + sq, 14.4, 5, 0.35);
        rect(g, 0x3a1a4a, 5, 17.6 + sq, 26, 1.6, 0.5);
      });
    }

    // Sói xám: lưng cong, đuôi xù, mắt hổ phách
    for (let f = 0; f < 2; f++) {
      const b = f ? -1.6 : 0;
      make(scene, 'm_wolf_' + f, 50, 32, (g) => {
        bone(g, 0x565d73, 12, 16, 5, 9 + b, 6);           // đuôi
        ell(g, 0x6f7a90, 4.4, 8 + b, 3, 2.4, 0.9);
        ell(g, 0x3d4250, 20, 18, 15, 8.6);                // thân
        ell(g, 0x5d6474, 19.4, 16.6, 13.6, 7);            // lưng sáng
        ell(g, 0x7d8494, 18, 13.6, 10, 2.8, 0.7);
        // bốn chân
        bone(g, 0x3d4250, 11, 22, 9, 28 + b, 4);
        bone(g, 0x3d4250, 17, 22, 16, 29 - b, 4);
        bone(g, 0x4a5062, 26, 22, 25, 29 + b, 4);
        bone(g, 0x4a5062, 31, 22, 33, 28 - b, 4);
        // đầu
        ell(g, 0x3d4250, 39, 13 + b, 10.4, 8.4);
        ell(g, 0x5d6474, 38.6, 12 + b, 9.2, 7);
        tri(g, 0x3d4250, 33, 6 + b, 35.4, 0.4 + b, 38.4, 6 + b);
        tri(g, 0x3d4250, 41, 5.6 + b, 44, 0 + b, 46, 6.4 + b);
        tri(g, 0x6f7a90, 33.6, 6 + b, 35.6, 2.6 + b, 37.6, 6 + b, 0.85);
        // mõm
        poly(g, 0x5d6474, [[44, 12 + b], [50, 15 + b], [44, 18 + b]]);
        rect(g, 0x2a2f3a, 45.6, 15 + b, 2.4, 1, 0.95);
        ell(g, 0xffb347, 41.4, 11.4 + b, 2, 1.8);
        ell(g, 0x1a1a20, 41.8, 11.4 + b, 1, 1.4);
        rect(g, 0x8a909e, 36.4, 9.6 + b, 3, 0.8, 0.7);
        ell(g, 0x2a2f3a, 34.6, 7.6 + b, 1, 1.2, 0.8);
      });
    }

    // Ếch xanh: mắt to, bụng sáng
    for (let f = 0; f < 2; f++) {
      const sq = f ? 1.6 : 0;
      make(scene, 'm_frog_' + f, 38, 30, (g) => {
        ell(g, 0x1f5a4a, 19, 19 - sq, 15.4, 10.4);
        ell(g, 0x3fae8f, 19, 17.6 - sq, 14.4, 9.4);
        ell(g, 0x6fd8b8, 18, 14 - sq, 9.6, 4.6, 0.7);
        ell(g, 0xd8f5e0, 19, 21 - sq, 9.6, 5, 0.95);
        ell(g, 0x2a7562, 7, 23 - sq, 4.6, 3.4);
        ell(g, 0x2a7562, 31, 23 - sq, 4.6, 3.4);
        // mắt
        ell(g, 0x1f5a4a, 10.6, 8 - sq, 5.6, 5.4);
        ell(g, 0x2a7562, 28, 7.4 - sq, 5.8, 5.6);
        ell(g, 0xfff59d, 10.6, 8 - sq, 4.4, 4.2);
        ell(g, 0xfff59d, 28, 7.4 - sq, 4.4, 4.2);
        ell(g, 0x18202a, 11.4, 8.6 - sq, 2, 2.6);
        ell(g, 0x18202a, 28.6, 8 - sq, 2, 2.6);
        ell(g, 0xffffff, 10.6, 6.8 - sq, 1, 1, 0.9);
        ell(g, 0xffffff, 27.6, 6.2 - sq, 1, 1, 0.9);
        rect(g, 0x2a7562, 15, 13.4 - sq, 8, 1.2, 0.75);
        ell(g, 0x8e3bb8, 24, 16.4 - sq, 1.4, 1.2, 0.7);
      });
    }

    // Dơi: cánh da mềm, mắt đỏ
    for (let f = 0; f < 2; f++) {
      make(scene, 'm_bat_' + f, 46, 28, (g) => {
        const up = f ? 1 : -1;
        const wing = (dir) => {
          const cx = 23;
          poly(g, 0x3a2856, [[cx + dir * 5, 12], [cx + dir * 22, 3 + up * 4], [cx + dir * 23, 12 + up * 2],
            [cx + dir * 17, 15 + up], [cx + dir * 15, 20 + up * 2], [cx + dir * 9, 16]]);
          poly(g, 0x6a4c93, [[cx + dir * 6, 12], [cx + dir * 20, 6 + up * 3], [cx + dir * 20.4, 12 + up],
            [cx + dir * 14, 14 + up], [cx + dir * 12, 17 + up], [cx + dir * 8, 15]], 0.9);
          line(g, 0x4a3568, cx + dir * 6, 12, cx + dir * 20.6, 8 + up * 3, 1, 0.7);
          line(g, 0x4a3568, cx + dir * 6, 13, cx + dir * 12.4, 18 + up, 1, 0.6);
        };
        wing(-1); wing(1);
        ell(g, 0x3a2856, 23, 14.6, 7.6, 8.4);
        ell(g, 0x6a4c93, 23, 13.8, 6.8, 7.4);
        ell(g, 0x8a68b8, 22, 11.6, 4.2, 3, 0.7);
        tri(g, 0x6a4c93, 18.6, 7.6, 19, 1.4, 22, 7);
        tri(g, 0x6a4c93, 27.4, 7.6, 27, 1.4, 24, 7);
        ell(g, 0xff3d6e, 20.2, 11.4, 2, 1.8, 0.95);
        ell(g, 0xff3d6e, 25.8, 11.4, 2, 1.8, 0.95);
        ell(g, 0xfff0f4, 20.4, 11.4, 0.9, 0.9);
        ell(g, 0xfff0f4, 26, 11.4, 0.9, 0.9);
        tri(g, 0xffffff, 21, 16.4, 22, 19.4, 23, 16.4);
        tri(g, 0xffffff, 25, 16.4, 24, 19.4, 23, 16.4);
        rect(g, 0x2a1c40, 21.4, 15.2, 3.4, 1, 0.8);
        g.fillStyle(0xff3d6e, 0.16); g.fillCircle(23, 11.4, 8);
      });
    }

    // Nhện: bụng có hoa văn, 8 chân khớp
    for (let f = 0; f < 2; f++) {
      make(scene, 'm_spider_' + f, 48, 30, (g) => {
        const leg = (x, y, dx, dy, dx2, dy2) => {
          bone(g, 0x2e2b40, x, y, x + dx, y + dy, 3);
          bone(g, 0x565270, x + dx, y + dy, x + dx2, y + dy2, 2.4);
        };
        const ph = f ? 2 : -2;
        for (let i = 0; i < 4; i++) {
          const bx = 16 + i * 4;
          leg(bx, 14, -7 + (i % 2) * 3, 5 + ph, -12 + (i % 2) * 4, 12 + ph);
          leg(bx + 2, 14, 6 - (i % 2) * 3, 5 - ph, 11 - (i % 2) * 4, 12 - ph);
        }
        ell(g, 0x2e2b40, 16, 15, 12, 10);
        ell(g, 0x6d6a85, 16, 14, 11, 9);
        ell(g, 0x8a87a8, 14, 11.6, 6.6, 4.6, 0.8);
        ell(g, 0x3e3b52, 16, 16, 5.4, 3.6, 0.8);
        ell(g, 0xb388ff, 16, 13, 3, 2.2, 0.75);
        // đầu
        ell(g, 0x3e3b52, 33, 15, 8.4, 6.8);
        ell(g, 0x6d6a85, 33, 14.4, 7.6, 6);
        ell(g, 0xff5252, 38.4, 12.6, 1.4, 1.4);
        ell(g, 0xff5252, 38.4, 16, 1.2, 1.2);
        ell(g, 0xff5252, 34.6, 11, 1.2, 1.2);
        ell(g, 0xff5252, 34.6, 17.4, 1.2, 1.2);
        ell(g, 0xffe0e0, 38.6, 12.4, 0.6, 0.6);
        tri(g, 0x2e2b40, 40.6, 14.6, 44, 16.4, 40.6, 17.2);
        tri(g, 0x2e2b40, 40.6, 15.4, 44, 14.2, 40.6, 13.6);
        g.fillStyle(0xb388ff, 0.12); g.fillEllipse(16, 15, 26, 18);
      });
    }

    // Trùm Thạch Quỷ: đá có mạch nứt phát sáng, lõi pha lê
    for (let f = 0; f < 2; f++) {
      make(scene, 'm_golem_' + f, 104, 108, (g) => {
        const a = f ? 3 : 0;
        const rock = 0x6e6a80, rockD = 0x4a4660, rockL = 0x918da6, rockH = 0xb0acc4;
        // chân
        rrect(g, rockD, 22, 76, 24, 30, 6);
        rrect(g, rock, 24, 76, 21, 28, 5);
        rrect(g, rockD, 58, 76, 24, 30, 6);
        rrect(g, rock, 60, 76, 21, 28, 5);
        rect(g, rockL, 26, 76, 6, 26, 0.6);
        rect(g, rockL, 62, 76, 6, 26, 0.6);
        // thân
        rrect(g, rockD, 13, 28, 76, 56, 12);
        rrect(g, rock, 15, 27, 72, 53, 11);
        poly(g, rockL, [[17, 30], [40, 27], [38, 78], [17, 74]], 0.55);
        poly(g, rockD, [[62, 30], [85, 33], [84, 77], [64, 79]], 0.5);
        // mảng đá
        poly(g, rockH, [[24, 40], [44, 34], [52, 46], [34, 54]], 0.35);
        poly(g, rockD, [[58, 58], [78, 50], [80, 66], [62, 70]], 0.5);
        // mạch nứt phát sáng
        line(g, 0xff2d55, 30, 62, 40, 50, 2, 0.8);
        line(g, 0xff2d55, 40, 50, 36, 38, 2, 0.7);
        line(g, 0xff5c7a, 66, 40, 74, 52, 2, 0.7);
        line(g, 0xff5c7a, 74, 52, 70, 66, 2, 0.6);
        // vai
        ell(g, rockD, 18, 38 + a, 12, 11);
        ell(g, rock, 18, 36 + a, 11, 10);
        ell(g, rockL, 16, 32 + a, 6, 4, 0.5);
        ell(g, rockD, 86, 38 - a, 12, 11);
        ell(g, rock, 86, 36 - a, 11, 10);
        ell(g, rockL, 84, 32 - a, 6, 4, 0.5);
        // tay
        rrect(g, rockD, 1, 44 + a, 18, 34, 8);
        rrect(g, rock, 3, 43 + a, 15, 32, 7);
        rect(g, rockL, 5, 44 + a, 4, 28, 0.55);
        rrect(g, rockD, 85, 44 - a, 18, 34, 8);
        rrect(g, rock, 86, 43 - a, 15, 32, 7);
        rect(g, rockL, 88, 44 - a, 4, 28, 0.55);
        // đầu
        rrect(g, rockD, 28, 2, 48, 34, 10);
        rrect(g, rock, 30, 1, 44, 32, 9);
        poly(g, rockL, [[33, 4], [50, 1], [49, 30], [33, 28]], 0.45);
        // mắt
        ell(g, 0x3a0010, 40, 15, 6, 4.4);
        ell(g, 0x3a0010, 64, 15, 6, 4.4);
        ell(g, 0xff2d55, 40, 15, 4.4, 3.2);
        ell(g, 0xff2d55, 64, 15, 4.4, 3.2);
        ell(g, 0xffb3c1, 41.4, 14.2, 1.4, 1.2);
        ell(g, 0xffb3c1, 65.4, 14.2, 1.4, 1.2);
        rect(g, 0x3a0010, 40, 25, 24, 3, 0.85);
        rect(g, 0xff5c7a, 44, 25.8, 3, 1.4, 0.8);
        rect(g, 0xff5c7a, 54, 25.8, 3, 1.4, 0.8);
        // sừng pha lê
        tri(g, 0x8a6cff, 34, 2, 22, 14, 38, 12);
        tri(g, 0xb388ff, 35, 2, 25, 12, 37, 10, 0.8);
        tri(g, 0x8a6cff, 70, 2, 84, 12, 68, 13);
        tri(g, 0xb388ff, 70, 2, 82, 11, 69, 11, 0.8);
        // lõi pha lê phát sáng
        g.fillStyle(0xff2d55, 0.16); g.fillCircle(50, 56, 20);
        g.fillStyle(0xff2d55, 0.3); g.fillCircle(50, 56, 12);
        tri(g, 0x6a1030, 50, 42, 41, 56, 59, 56);
        tri(g, 0x6a1030, 50, 70, 41, 56, 59, 56);
        tri(g, 0xff5c7a, 50, 45, 44, 55, 56, 55);
        tri(g, 0xff8fa5, 50, 66, 44, 57, 56, 57, 0.9);
        ell(g, 0xffd0da, 50, 56, 2.4, 4, 0.8);
        // rêu
        ell(g, 0x4f8a52, 22, 30 + a, 6, 2.6, 0.7);
        ell(g, 0x4f8a52, 82, 72 - a, 5, 2.2, 0.6);
        ell(g, 0x376b46, 50, 82, 7, 2.4, 0.6);
      });
    }
  }

  Object.assign(Art._, { monsters });
})();
