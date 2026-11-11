'use strict';
/*
 * Hình ảnh bổ sung: NPC Lữ khách bí ẩn và hiệu ứng của các kỹ năng mới.
 * Dùng chung bút vẽ với art.js để cùng phong cách.
 */
const Fx = (() => {
  function makeAll(scene) {
    const { make, drawHunter, ell, rect, rrect, poly, tri, line } = Art;

    // Lữ khách bí ẩn: áo choàng tím sẫm, mũ trùm, mắt phát sáng
    make(scene, 'npc_lu_khach', 40, 60, (g) => {
      const pal = {
        coat: 0x2e2342, inner: 0x1a1426, accent: 0xb388ff, hair: 0x15111d,
        skin: 0xd8b8a0, skin2: 0xb08a72, pants: 0x1d1729, boot: 0x120e19, long: true, longHair: true,
        eye: 0xd6c2ff,
      };
      drawHunter(g, pal, 'idle', {
        prop: (gg) => {
          // mũ trùm
          poly(gg, 0x241b35, [[9.6, 12], [12, 2.6], [20, -0.4], [28, 2.6], [30.4, 12], [28, 16], [26.6, 6.6], [20, 4.6], [13.4, 6.6], [12, 16]]);
          poly(gg, 0x3a2d55, [[12.4, 5], [20, 1.6], [27.6, 5], [26.4, 6.6], [20, 4.4], [13.6, 6.6]], 0.9);
          // áo choàng phủ vai
          poly(gg, 0x241b35, [[10.6, 20], [29.4, 20], [31, 44], [9, 44]], 0.92);
          poly(gg, 0x3a2d55, [[12, 21], [16, 21], [14, 43], [10.6, 43]], 0.6);
          rect(gg, 0xb388ff, 19, 21, 2, 20, 0.6);
          // mắt phát sáng
          gg.fillStyle(0xd6c2ff, 0.35); gg.fillCircle(17.4, 12, 3); gg.fillCircle(22.6, 12, 3);
          // quả cầu pha lê trên tay
          ell(gg, 0xb388ff, 30, 30, 5, 5, 0.25);
          ell(gg, 0xc9b0ff, 30, 30, 3.4, 3.4, 0.9);
          ell(gg, 0xffffff, 29, 29, 1.2, 1.2, 0.95);
        },
      });
    });

    // Kiếm khổng lồ (Thiên Kiếm Giáng)
    make(scene, 'fx_bigsword', 48, 220, (g) => {
      g.fillStyle(0xffe9a8, 0.18); g.fillEllipse(24, 110, 48, 220);
      poly(g, 0x9aa8ba, [[14, 40], [34, 40], [34, 190], [24, 220], [14, 190]]);
      poly(g, 0xe8eef7, [[17, 40], [24, 40], [24, 214], [17, 190]]);
      rect(g, 0xffffff, 18, 44, 2, 140, 0.8);
      rrect(g, 0xc9a227, 2, 30, 44, 10, 3);
      rect(g, 0xf0d27a, 4, 32, 40, 3, 0.8);
      rrect(g, 0x3b2a20, 19, 2, 10, 28, 2);
      ell(g, 0xff7a63, 24, 4, 6, 6);
      ell(g, 0xffd0c4, 22.6, 2.6, 2, 2, 0.9);
    });

    // Thiên thạch
    make(scene, 'fx_meteor', 70, 70, (g) => {
      ell(g, 0xff7043, 35, 35, 35, 35, 0.18);
      ell(g, 0xff9d4d, 35, 35, 26, 26, 0.35);
      ell(g, 0x5a3a2a, 35, 35, 18, 18);
      ell(g, 0x7a4a32, 32, 32, 13, 13);
      ell(g, 0xffb74d, 40, 40, 6, 5, 0.9);
      ell(g, 0xfff3c4, 27, 28, 4, 3, 0.8);
    });

    // Mũi tên rơi (Mưa Tên) - mũi chĩa xuống
    make(scene, 'fx_arrow_down', 8, 34, (g) => {
      g.fillStyle(0x6ff0a6, 0.25); g.fillEllipse(4, 14, 8, 30);
      rect(g, 0x8b5a2b, 3, 2, 2, 22);
      poly(g, 0x6ff0a6, [[0.6, 0], [4, 6], [7.4, 0]]);
      poly(g, 0xdfe6ee, [[0.6, 24], [7.4, 24], [4, 34]]);
    });

    // ---------------------------------------------------------------- Chủ đề Cổng đỏ (bản đồ mở đầu)
    const RED = { top: 0x87634e, top2: 0x68443e, fill: 0x302932, fill2: 0x24202b, glow: 0xd89872 };
    make(scene, 'tile_redgate_top', 32, 32, (g) => {
      rect(g, RED.fill, 0, 0, 32, 32);
      for (let i = 0; i < 6; i++) rect(g, RED.fill2, (i * 13) % 28, 12 + (i * 7) % 18, 4, 3);
      rect(g, RED.top, 0, 0, 32, 8); rect(g, RED.top2, 0, 8, 32, 3);
      for (let x = 0; x < 32; x += 6) rect(g, RED.top, x + 1, 10, 3, 3);
      rect(g, RED.glow, 6, 3, 2, 2, 0.8); rect(g, RED.glow, 23, 5, 2, 2, 0.6);
    });
    make(scene, 'tile_redgate_fill', 32, 32, (g) => {
      rect(g, RED.fill, 0, 0, 32, 32);
      for (let i = 0; i < 6; i++) rect(g, RED.fill2, (i * 11 + 3) % 28, (i * 9 + 2) % 28, 4, 3);
      rect(g, RED.glow, 18, 20, 2, 2, 0.22);
    });
    make(scene, 'plank_redgate', 32, 12, (g) => {
      rect(g, 0x201a24, 0, 0, 32, 12); rect(g, 0x594044, 0, 1, 32, 8); rect(g, 0x987050, 0, 1, 32, 2); rect(g, 0x30242a, 0, 9, 32, 3);
      rect(g, RED.glow, 9, 4, 2, 2, 0.7);
    });
    make(scene, 'd_redcrystal', 50, 70, (g) => {
      g.fillStyle(0xd89872, 0.18); g.fillCircle(25, 50, 24);
      const cr = (x, h, w, c) => { tri(g, 0x241f29, x - w - 1, 70, x + w + 1, 70, x, 70 - h - 2); tri(g, c, x - w, 70, x + w, 70, x, 70 - h); };
      cr(14, 32, 7, 0x825148); cr(36, 42, 8, 0xb26e55); cr(25, 60, 9, 0xd89872);
      tri(g, 0xffd9a7, 25, 14, 22, 50, 26, 50, 0.7);
    });

    // ---------------------------------------------------------------- Quái Bóng Đỏ
    for (let f = 0; f < 2; f++) {
      make(scene, 'm_shade_' + f, 34, 40, (g) => {
        const b = f ? 2 : 0;
        ell(g, 0xff2d55, 17, 22, 17, 18, 0.18);
        poly(g, 0x12060a, [[5, 38], [6, 14], [17, 2 + b], [28, 14], [29, 38], [24, 33], [20, 38], [15, 33], [10, 38]]);
        poly(g, 0x3a0d18, [[7, 36], [8, 15], [17, 4 + b], [26, 15], [27, 36], [23, 31], [20, 35], [15, 31], [11, 35]]);
        ell(g, 0xff4d5e, 13, 16 + b, 2.6, 1.8); ell(g, 0xff4d5e, 21, 16 + b, 2.6, 1.8);
        ell(g, 0xffd0d6, 13, 15.6 + b, 1, 0.8); ell(g, 0xffd0d6, 21, 15.6 + b, 1, 0.8);
      });
    }

    // ---------------------------------------------------------------- NPC mới
    // Hệ thống: khối pha lê xanh lơ lửng có màn hình
    make(scene, 'npc_he_thong', 40, 60, (g) => {
      ell(g, 0x3fd0ff, 20, 30, 20, 28, 0.15);
      poly(g, 0x0b3a52, [[20, 4], [34, 22], [20, 50], [6, 22]]);
      poly(g, 0x3fd0ff, [[20, 7], [31, 22], [20, 46], [9, 22]], 0.75);
      poly(g, 0xbff1ff, [[20, 10], [26, 22], [20, 30], [14, 22]], 0.9);
      ell(g, 0x3fd0ff, 20, 57, 10, 2.4, 0.5);
    });
    // Vy: thợ săn hạng C, tóc đỏ, áo khoác đỏ đô
    make(scene, 'npc_vy', 40, 60, (g) => {
      drawHunter(g, {
        coat: 0x6e1f38, inner: 0x2a1820, accent: 0xff7a9c, hair: 0xb8323a,
        skin: 0xf3cba6, skin2: 0xd69c74, pants: 0x2a2030, boot: 0x1a1420, long: true, longHair: true, eye: 0x3a2028,
      }, 'idle', {
        prop: (gg) => {
          rect(gg, 0xcfd8e3, 6, 26, 2.2, 22); rect(gg, 0x3b2a20, 5.6, 46, 3, 6); rect(gg, 0xc9a227, 4.6, 45, 5, 1.6);
          rrect(gg, 0xf0f0f0, 22, 26, 6, 3, 1, 0.9);
        },
      });
    });
    // Lam Sương: sát thủ Hắc Nguyệt, tóc đen, song đao
    make(scene, 'npc_lam_suong', 40, 60, (g) => {
      drawHunter(g, {
        coat: 0x2a2038, inner: 0x171222, accent: 0x9b5cff, hair: 0x15101c,
        skin: 0xd9c0b0, skin2: 0xb08a78, pants: 0x20182c, boot: 0x120e19,
        long: true, longHair: true, eye: 0xb388ff,
      }, 'idle', {
        prop: (gg) => {
          // khăn che mặt
          poly(gg, 0x2a2038, [[12.6, 14.4], [27.4, 14.4], [26.6, 20.4], [13.4, 20.4]], 0.9);
          // song đao hai bên
          rect(gg, 0xcfd8e3, 5.4, 20, 2, 22, 0.95); rect(gg, 0x3b2a20, 5, 42, 2.8, 6);
          rect(gg, 0xcfd8e3, 32.6, 20, 2, 22, 0.95); rect(gg, 0x3b2a20, 32.2, 42, 2.8, 6);
          gg.fillStyle(0x9b5cff, 0.3); gg.fillCircle(20, 30, 14);
        },
      });
    });
    // Bảng nhiệm vụ: tấm bảng có giấy dán
    make(scene, 'npc_bang_nv', 48, 60, (g) => {
      rect(g, 0x2c3846, 6, 30, 3, 30); rect(g, 0x2c3846, 39, 30, 3, 30);
      rrect(g, 0x0b0d14, 1, 6, 46, 34, 3); rrect(g, 0x3b4a5a, 3, 8, 42, 30, 2);
      rect(g, 0x3fd0ff, 3, 8, 42, 2, 0.8);
      rect(g, 0xe8e2d0, 7, 13, 10, 12); rect(g, 0xfff3c4, 20, 12, 10, 14); rect(g, 0xe8e2d0, 33, 14, 9, 11);
      rect(g, 0x9aa3b8, 9, 16, 6, 1); rect(g, 0x9aa3b8, 22, 16, 6, 1); rect(g, 0x9aa3b8, 35, 17, 5, 1);
      ell(g, 0xff5a4e, 12, 13, 1.4, 1.4); ell(g, 0xff5a4e, 25, 12, 1.4, 1.4); ell(g, 0xff5a4e, 37, 14, 1.4, 1.4);
    });

    // Thợ săn bị giam (Chương 2): ngồi sau lồng sắt
    for (let i = 1; i <= 5; i++) {
      make(scene, 'npc_tho_san_' + i, 40, 60, (g) => {
        drawHunter(g, { coat: [0x4a5a6a, 0x6a4a4a, 0x4a6a58, 0x5a4a6a, 0x6a5a3a][i - 1], inner: 0x2a2a32, accent: 0xc8a45a, hair: [0x2a2018, 0x5a3a20, 0x1a1a22, 0x6a5a3a, 0x3a2a30][i - 1],
          skin: 0xe4b88f, skin2: 0xc0906a, pants: 0x30303a, boot: 0x1c1c24, long: false }, 'idle', {
          prop: (gg) => { for (let b = 0; b < 5; b++) rect(gg, 0x2a2e38, 4 + b * 7.4, 4, 2.2, 50); rect(gg, 0x2a2e38, 3, 4, 34, 2.4); rect(gg, 0x2a2e38, 3, 52, 34, 2.4); },
        });
      });
    }
    // Điểm dẫn mạch (Chương 7): trụ ngọc xanh phát sáng
    for (let i = 1; i <= 3; i++) make(scene, 'npc_hat_mach_' + i, 40, 60, (g) => {
      ell(g, 0x3fc9a0, 20, 54, 14, 3.4, 0.4); ell(g, 0x3fc9a0, 20, 30, 16, 26, 0.16);
      poly(g, 0x14584a, [[20, 6], [30, 24], [26, 54], [14, 54], [10, 24]]); poly(g, 0x3fe0b8, [[20, 10], [27, 24], [24, 50], [16, 50], [13, 24]], 0.85); poly(g, 0xd0fff0, [[20, 14], [23, 24], [20, 36], [17, 24]], 0.9);
    });
    // Trợ lý bị kẹt (Chương 8): học trò ôm cuộn bản vẽ, mắt kính
    for (let i = 1; i <= 4; i++) make(scene, 'npc_tro_ly_' + i, 40, 60, (g) => {
      drawHunter(g, { coat: [0x4a3a7a, 0x3a4a7a, 0x5a3a6a, 0x3a5a6a][i - 1], inner: 0xe8e2ff, accent: 0xffd166, hair: [0x2a2030, 0x4a3a28, 0x1a1a22, 0x5a4a3a][i - 1], skin: 0xf0cdac, skin2: 0xd09a74, pants: 0x2c2a44, boot: 0x1c1a2c, long: false }, 'idle', {
        prop: (gg) => { rect(gg, 0x1a1a22, 15.4, 10, 4, 3.6, 0.95); rect(gg, 0xcfd8ff, 15.8, 10.4, 3.2, 2.8, 0.9); rect(gg, 0x1a1a22, 20.6, 10, 4, 3.6, 0.95); rect(gg, 0xcfd8ff, 21, 10.4, 3.2, 2.8, 0.9); rrect(gg, 0xefe4c8, 26, 27, 7, 12, 2); },
      });
    });
    // Cánh cửa Sáng Thế (Chương 10): khung cửa vàng, bên trong sáng trắng
    for (let i = 1; i <= 3; i++) make(scene, 'npc_cua_sang_' + i, 40, 60, (g) => {
      ell(g, 0xffe8a0, 20, 30, 18, 28, 0.2);
      rect(g, 0xc8a45a, 6, 6, 28, 50); rect(g, 0xfff6d0, 10, 10, 20, 46); rect(g, 0xffffff, 14, 16, 12, 38, 0.8); ell(g, 0xffe8a0, 20, 56, 12, 2.4, 0.5);
    });
    // Lăng (Chương 10): hình bóng người phụ nữ cổ xưa, áo choàng sáng, vòng ánh sáng sau đầu
    make(scene, 'npc_lang_hinh', 40, 60, (g) => {
      ell(g, 0xffe8a0, 20, 28, 19, 27, 0.16); g.lineStyle(1.4, 0xffe8a0, 0.9); g.strokeCircle(20, 11, 9);
      poly(g, 0x6a5a30, [[20, 8], [31, 20], [34, 54], [6, 54], [9, 20]]); poly(g, 0xf6e6b0, [[20, 10], [28, 21], [30, 52], [10, 52], [12, 21]], 0.9);
      ell(g, 0xf0d0b0, 20, 14, 5.4, 6.2); ell(g, 0x2a2018, 20, 10, 6, 4.6); rect(g, 0xffffff, 17.4, 14, 1.4, 1.2); rect(g, 0xffffff, 21.4, 14, 1.4, 1.2);
    });
    // Trạm dịch chuyển: bệ đá có vòng rune sáng
    make(scene, 'npc_tram', 48, 60, (g) => {
      ell(g, 0x3fd0ff, 24, 52, 22, 6, 0.25);
      ell(g, 0x1e2a3a, 24, 52, 17, 4.4); ell(g, 0x3b4a5a, 24, 50, 15, 3.6);
      rect(g, 0x2c3846, 9, 24, 5, 26); rect(g, 0x2c3846, 34, 24, 5, 26);
      rect(g, 0x5a6a7a, 8, 20, 7, 4); rect(g, 0x5a6a7a, 33, 20, 7, 4);
      ell(g, 0x3fd0ff, 24, 32, 11, 15, 0.22);
      g.lineStyle(2, 0x7fe3ff, 0.95); g.strokeEllipse(24, 32, 18, 26);
      g.lineStyle(1.2, 0xe1f8ff, 0.8); g.strokeEllipse(24, 32, 10, 16);
      ell(g, 0xe1f8ff, 24, 32, 2.6, 3.4, 0.9);
    });
    // Hạ Phong: lái đò cụt tay, nón lá, áo ghi lê xanh
    make(scene, 'npc_ha_phong', 40, 60, (g) => {
      drawHunter(g, {
        coat: 0x2f6b8a, inner: 0xe8e2d0, accent: 0xd9a65a, hair: 0x2a2a30,
        skin: 0xc99a72, skin2: 0xa87650, pants: 0x3a3a44, boot: 0x2a2024, long: false,
      }, 'idle', {
        prop: (gg) => {
          tri(gg, 0xd9c58a, 20, 1.2, 4.4, 9, 35.6, 9); line(gg, 0xb89a4a, 5.6, 9, 34.4, 9, 1.4);
          rect(gg, 0x6b4a2f, 29, 14, 2.4, 34); rrect(gg, 0x8a6a3a, 27, 44, 6.4, 6, 1.4);
        },
      });
    });
    // Viện trưởng Minh Triết: học giả đeo kính, áo choàng tím, cuộn bản vẽ sao
    make(scene, 'npc_minh_triet', 40, 60, (g) => {
      drawHunter(g, {
        coat: 0x5a3a8a, inner: 0xeee6ff, accent: 0xffd166, hair: 0xd8d6e4,
        skin: 0xf0cdac, skin2: 0xd09a74, pants: 0x3a2c56, boot: 0x241a34, long: true, longHair: false,
      }, 'idle', {
        prop: (gg) => {
          rect(gg, 0x1a1a22, 15.4, 10, 4, 3.6, 0.95); rect(gg, 0xcfd8ff, 15.8, 10.4, 3.2, 2.8, 0.9);
          rect(gg, 0x1a1a22, 20.6, 10, 4, 3.6, 0.95); rect(gg, 0xcfd8ff, 21, 10.4, 3.2, 2.8, 0.9);
          rrect(gg, 0xefe4c8, 27, 26, 7, 12, 2); gg.fillStyle(0xffd166, 1); gg.fillCircle(30.5, 31, 1.4); gg.fillCircle(29, 35, 1); gg.fillCircle(32, 34, 1);
        },
      });
    });

    // Người Gác Màn (NPC ẩn): bóng áo choàng tím trùm đầu, mắt sáng, đuôi áo tan thành khói
    make(scene, 'npc_npc_an', 40, 60, (g) => {
      ell(g, 0xb46bff, 20, 30, 19, 28, 0.12);
      ell(g, 0xb46bff, 20, 30, 14, 22, 0.1);
      // thân áo choàng loe xuống, mép dưới rách như khói
      poly(g, 0x1c1228, [[20, 6], [30, 14], [34, 34], [37, 54], [31, 51], [27, 57], [21, 52], [16, 58], [11, 51], [5, 55], [7, 34], [10, 14]]);
      poly(g, 0x2c1c40, [[20, 8], [27, 15], [30, 34], [32, 50], [27, 47], [21, 50], [15, 47], [9, 50], [11, 34], [13, 15]], 0.95);
      // mũ trùm: bóng tối bên trong + viền sáng
      ell(g, 0x120a1c, 20, 17, 8.2, 9.2);
      g.lineStyle(1.2, 0xb46bff, 0.85); g.strokeEllipse(20, 17, 16.4, 18.4);
      // mắt phát sáng
      ell(g, 0xe9d4ff, 16.6, 17, 1.7, 1.2); ell(g, 0xe9d4ff, 23.4, 17, 1.7, 1.2);
      ell(g, 0xb46bff, 16.6, 17, 3, 2.2, 0.35); ell(g, 0xb46bff, 23.4, 17, 3, 2.2, 0.35);
      // tay áo giơ ra + quả cầu sáng
      poly(g, 0x2c1c40, [[28, 26], [34, 30], [33, 34], [27, 31]]);
      ell(g, 0xe1c6ff, 35, 30, 2.6, 2.6, 0.95); ell(g, 0xb46bff, 35, 30, 5, 5, 0.3);
      // nếp áo
      line(g, 0x120a1c, 20, 24, 20, 52, 0.8, 0.5); line(g, 0x120a1c, 14, 28, 12, 50, 0.7, 0.4); line(g, 0x120a1c, 26, 28, 28, 50, 0.7, 0.4);
    });

    // Vòng sóng nổ dùng chung
    make(scene, 'fx_ring', 64, 64, (g) => {
      g.lineStyle(5, 0xffffff, 0.9); g.strokeCircle(32, 32, 28);
      g.lineStyle(2, 0xffffff, 0.5); g.strokeCircle(32, 32, 22);
    });
  }
  return { makeAll };
})();
