'use strict';
/* Art · Nhân vật (thợ săn theo class) và NPC. */
(() => {
  const { shade, light, make, ell, rect, rrect, poly, line, bone, tri } = Art._;

  // ---------------------------------------------------------------- Bảng màu nhân vật
  const HUNTERS = {
    none: {
      coat: 0x5d6576, inner: 0x333a49, accent: 0xc7d6ef, hair: 0x2b303c,
      skin: 0xf1c8a1, skin2: 0xd29a72, pants: 0x3a4152, boot: 0x1c2029,
      eye: 0x2a2f3a, long: false, longHair: false,
    },
    kiem_si: {
      coat: 0x8e2434, inner: 0xf1e6d8, accent: 0xff7a63, hair: 0x241c22,
      skin: 0xf3caa3, skin2: 0xd69c74, pants: 0x3b2a30, boot: 0x1e1a20,
      eye: 0xff8a76, long: true, longHair: true,
    },
    cung_thu: {
      coat: 0x20604a, inner: 0xdfd8c4, accent: 0x6ff0a6, hair: 0x6b4128,
      skin: 0xf0c39b, skin2: 0xcf9468, pants: 0x2c3a33, boot: 0x232a22,
      eye: 0x8affc0, long: false, longHair: false,
    },
    phap_su: {
      coat: 0x34409a, inner: 0xd8e2ff, accent: 0x8fb4ff, hair: 0x1f2340,
      skin: 0xf5d0ac, skin2: 0xd6a37d, pants: 0x2a3054, boot: 0x1b1e2e,
      eye: 0xa9c6ff, long: true, longHair: true,
    },
    toan_nang: {
      coat: 0x1e1f2a, inner: 0x3a3b4c, accent: 0xffcb52, hair: 0xeef2fa,
      skin: 0xf0c8a2, skin2: 0xd0966f, pants: 0x191a24, boot: 0x101117,
      eye: 0xffd76a, long: true, longHair: true,
    },
    // 3 class mới — palette dùng cho hình vẽ code (fallback) và màu accent hiệu ứng
    sat_thu: {
      coat: 0x1a1a2e, inner: 0x2a1a2e, accent: 0xe040fb, hair: 0x0d0d0d,
      skin: 0xeec49a, skin2: 0xcf9468, pants: 0x16213e, boot: 0x0f0f1a,
      eye: 0xe040fb, long: false, longHair: false,
    },
    tanker: {
      coat: 0x3a3a4a, inner: 0x8a9ab8, accent: 0x90caf9, hair: 0xc0a060,
      skin: 0xf1c8a1, skin2: 0xd29a72, pants: 0x2a2a3a, boot: 0x1a1a28,
      eye: 0x90caf9, long: false, longHair: false,
    },
    tri_lieu_su: {
      coat: 0x1a4a2a, inner: 0xd8f5e0, accent: 0x69f0ae, hair: 0xf5e6c8,
      skin: 0xf5d0ac, skin2: 0xd6a37d, pants: 0x1a3a2a, boot: 0x0f2018,
      eye: 0x69f0ae, long: true, longHair: true,
    },
    trieu_hoi_su: {
      coat: 0x4e3c79, inner: 0xc9b9eb, accent: 0x9c83e8, hair: 0x25213a,
      skin: 0xf0c9aa, skin2: 0xd29a78, pants: 0x302846, boot: 0x191625,
      eye: 0xb8a5ff, long: true, longHair: true,
    },
    tu_linh_thuat_su: {
      coat: 0x171321, inner: 0x36234b, accent: 0xc17aff, hair: 0x17111f,
      skin: 0xe2c4b2, skin2: 0xb99283, pants: 0x21182c, boot: 0x100d17,
      eye: 0xd29aff, long: true, longHair: true,
    },
  };

  for (const [id, base, accent] of [['kiem_thanh','kiem_si',0xffd54f],['than_xa','cung_thu',0x42f5bb],
    ['dai_phap_su','phap_su',0x72c8ff],['anh_vuong','sat_thu',0xc75aff],['ho_ve_bat_khuat','tanker',0x8bdcff],
    ['thanh_linh','tri_lieu_su',0x9dffd0],['toan_nang_tinh_thong','toan_nang',0xffe782]]) HUNTERS[id] = { ...HUNTERS[base], accent, eye: accent };

  // Thân người dùng chung cho nhân vật và NPC. Texture 40x60, chân chạm đáy khung.
  function drawHunter(g, pal, frame, opt = {}) {
    const jump = frame === 'jump';
    const run = frame === 'run1' ? 1 : frame === 'run2' ? -1 : 0;
    const C = pal.coat, CD = shade(C, 30), CL = light(C, 20);
    const I = pal.inner, ID = shade(I, 24);
    const PA = pal.pants, PAD = shade(PA, 28);
    const BO = pal.boot, BOL = light(BO, 24);
    const SK = pal.skin, SKD = pal.skin2;
    const HA = pal.hair, HAD = shade(HA, 35), HAL = light(HA, 30);
    const AC = pal.accent, ACD = shade(AC, 30);

    const leg = (c, hip, knee, foot, w1 = 5.2, w2 = 4.4) => {
      bone(g, c, hip[0], hip[1], knee[0], knee[1], w1);
      bone(g, c, knee[0], knee[1], foot[0], foot[1], w2);
    };
    const boot = (x, y, dir = 0) => {
      ell(g, shade(BO, 32), x + dir * 0.8, y + 0.7, 3.9, 2.7);
      ell(g, BO, x + dir * 0.8, y, 3.6, 2.4);
      rect(g, BOL, x - 2.3 + dir * 0.8, y - 1.7, 2.1, 0.9, 0.55);
      rect(g, shade(BO, 48), x - 3 + dir * 0.8, y + 1.5, 6.2, 0.9, 0.8);
    };
    const arm = (c, sh, el, hd, w1 = 4.4, w2 = 3.4) => {
      bone(g, c, sh[0], sh[1], el[0], el[1], w1);
      bone(g, c, el[0], el[1], hd[0], hd[1], w2);
    };

    // --- lớp phía sau: tóc dài, vạt áo
    if (pal.longHair) {
      poly(g, HAD, [[12.4, 14], [27.6, 14], [27, 30], [20, 33], [13, 29]]);
      ell(g, HAD, 20, 17, 7.8, 8.6);
    }
    if (pal.long) poly(g, shade(C, 48), [[13.4, 30], [21, 31], [22.4, 49], [15, 46], [12.6, 37]]);

    // --- chân sau + tay sau
    if (jump) { leg(PAD, [18, 36], [15.4, 43], [17.4, 49]); boot(17.6, 51); }
    else if (run > 0) { leg(PAD, [18, 36], [15, 46], [12.4, 54]); boot(12.2, 56.6); }
    else if (run < 0) { leg(PAD, [18, 36], [16.4, 47], [15, 55]); boot(15, 57); }
    else { leg(PAD, [17.8, 36], [17.2, 46], [17, 55]); boot(17.1, 57); }

    arm(shade(C, 42), [15, 24], [12.4, 29], [14, 33]);
    ell(g, SKD, 14.1, 34.1, 2.2, 2.2);

    // --- chân trước
    if (jump) { leg(PA, [23, 36], [25.6, 42], [24, 48]); boot(23.8, 50); }
    else if (run > 0) { leg(PA, [22.6, 36], [26.2, 44], [27.2, 53.4]); boot(27.4, 55.8); }
    else if (run < 0) { leg(PA, [22.6, 36], [24.2, 47], [23, 55]); boot(23.2, 57); }
    else { leg(PA, [22.4, 36], [22.9, 46], [23, 55]); boot(23.2, 57); }

    // --- thân áo
    poly(g, CD, [[11.6, 22.4], [28.4, 22.4], [27.2, 37], [12.8, 37]]);
    poly(g, C, [[12.1, 21.6], [27.9, 21.6], [26.8, 35.6], [13.2, 35.6]]);
    ell(g, C, 20, 22.2, 8, 3.6);            // vai bo tròn
    ell(g, CL, 15.4, 26.4, 3, 4.2, 0.85);   // ánh sáng bên vai
    poly(g, CL, [[13.1, 23.4], [15, 23.4], [14.4, 34], [12.9, 33]], 0.7);
    // cổ áo chữ V
    poly(g, ID, [[17.2, 21.4], [22.8, 21.4], [20, 28]]);
    poly(g, I, [[17.9, 21.4], [22.1, 21.4], [20, 27]]);
    // đai lưng + khoá
    rrect(g, shade(C, 55), 13.3, 32.2, 13.4, 3.6, 1.3);
    rrect(g, ACD, 18.2, 32.4, 3.6, 3.2, 0.9);
    rrect(g, AC, 18.5, 32.6, 3, 2.6, 0.7);
    // vạt áo trước
    poly(g, CD, [[15, 35.6], [25, 35.6], [24.6, 41], [15.4, 41]]);
    poly(g, shade(C, 18), [[15.4, 35.6], [24.6, 35.6], [24.2, 39.6], [15.8, 39.6]]);
    // tua áo
    if (pal.long) poly(g, ACD, [[15.4, 40], [17, 40], [16.4, 45], [15.2, 44]], 0.9);

    // --- đầu
    rrect(g, SKD, 18.3, 18.2, 3.4, 4, 1.2);          // cổ
    ell(g, SKD, 20, 11.4, 7.9, 8.4);                  // viền tối quanh mặt
    ell(g, SK, 19.9, 11.1, 7.4, 7.9);
    ell(g, SKD, 20.7, 14.6, 6, 3.6, 0.5);             // bóng hàm
    ell(g, light(SK, 14), 18.4, 9, 3.4, 3.2, 0.5);    // hồi sáng
    ell(g, SKD, 27.1, 12.4, 1.6, 2.2);                // tai
    ell(g, SK, 27.1, 12.4, 1.1, 1.6);
    // mắt
    const eye = (x, y) => {
      rect(g, shade(SKD, 30), x - 1.3, y - 1.6, 2.6, 0.8, 0.85);   // mí trên
      ell(g, 0xf6efe6, x, y + 0.2, 1.15, 1.5, 0.95);
      ell(g, pal.eye || 0x2a2f3a, x + 0.15, y + 0.35, 0.95, 1.2);
      rect(g, 0xffffff, x - 0.4, y - 0.5, 0.8, 0.7, 0.85);
    };
    eye(17.4, 12.2); eye(22.6, 12.2);
    rect(g, HAD, 15.8, 10, 3.3, 0.9, 0.85);          // lông mày
    rect(g, HAD, 21, 10, 3.3, 0.9, 0.85);
    rect(g, SKD, 19.8, 13.6, 1.2, 1, 0.7);           // sống mũi
    rect(g, shade(SKD, 45), 19.5, 16.2, 1.8, 0.8, 0.9); // miệng
    // tóc (mái ngắn để lộ mắt)
    ell(g, HA, 20, 5.2, 8.4, 5.4);
    poly(g, HA, [[11.7, 5.4], [13.4, 9.6], [15.3, 5.8], [17.3, 9.9], [19.6, 6], [21.8, 9.8], [23.7, 5.8], [25.7, 9.5], [28.4, 5.4]]);
    ell(g, HA, 12.2, 10.4, 2.5, 4.4);                // tóc mai
    ell(g, HA, 27.7, 10.2, 2.3, 4.2);
    ell(g, HAL, 17.3, 3.6, 4.2, 1.8, 0.55);          // ánh sáng tóc
    rect(g, HAL, 22.4, 4.6, 3.4, 0.9, 0.4);
    if (pal.longHair) {
      poly(g, HA, [[11.8, 9], [13.4, 10], [12.4, 20], [10.9, 18]]);
      poly(g, HA, [[28.2, 9], [26.6, 10], [27.6, 20], [29.1, 18]]);
    }
    // khăn quàng (nằm dưới cằm)
    ell(g, ACD, 20, 21.8, 5.6, 2.4);
    ell(g, AC, 20, 21.2, 5, 1.9);
    poly(g, ACD, [[14.2, 20.6], [17.2, 20.6], [16.2, 27.6], [13, 24.6]]);
    poly(g, AC, [[14.7, 21], [16.6, 21], [15.7, 26.2], [13.8, 23.6]]);

    // --- tay trước: nhô ra ngoài thân áo để thấy rõ cánh tay
    line(g, CD, 26.6, 22.6, 27.2, 33.4, 1, 0.5);
    if (jump) arm(CL, [26.6, 23.6], [29.8, 26.2], [27.8, 29.2]);
    else if (run > 0) arm(CL, [26.6, 23.6], [29.8, 27], [27.4, 30.6]);
    else if (run < 0) arm(CL, [26.6, 23.6], [29.6, 28], [28.4, 32.4]);
    else arm(CL, [26.6, 23.6], [29.8, 28.2], [27.8, 32.4]);
    const handX = jump ? 27.8 : run > 0 ? 27.4 : run < 0 ? 28.4 : 27.8;
    const handY = jump ? 30.2 : run > 0 ? 31.6 : run < 0 ? 33.4 : 33.4;
    ell(g, SKD, handX + 0.3, handY + 0.8, 2.4, 2.3);
    ell(g, SK, handX, handY, 2.2, 2.1);
    rect(g, SKD, handX - 0.9, handY + 0.4, 0.9, 1.3, 0.45);

    if (opt.prop) opt.prop(g, pal);
  }

  function hunters(scene) {
    for (const id in HUNTERS) for (const f of ['idle', 'run1', 'run2', 'jump']) {
      const pal = HUNTERS[id];
      make(scene, `hunter_${id}_${f}`, 40, 60, (g) => {
        drawHunter(g, pal, f);
        if (id !== 'none') {   // người đã thức tỉnh: mắt loé sáng nhẹ
          g.fillStyle(pal.eye, 0.28); g.fillCircle(17.4, 11.4, 3.4); g.fillCircle(22.6, 11.4, 3.4);
        }
      });
    }
  }

  // ---------------------------------------------------------------- NPC
  const NPCS = {
    lao_su: {
      coat: 0x2b3a55, inner: 0xeef0f5, accent: 0xd94a4a, hair: 0x9a9ca6,
      skin: 0xf1c9a3, skin2: 0xd39a72, pants: 0x263244, boot: 0x1a1e28, long: true, longHair: false,
      prop: (g) => {  // kính + sổ tay
        rect(g, 0x1a1a22, 15.4, 10, 4, 3.6, 0.95); rect(g, 0xcfd8e3, 15.8, 10.4, 3.2, 2.8, 0.9);
        rect(g, 0x1a1a22, 20.6, 10, 4, 3.6, 0.95); rect(g, 0xcfd8e3, 21, 10.4, 3.2, 2.8, 0.9);
        rect(g, 0x1a1a22, 19.4, 11.2, 1.4, 0.8);
        rrect(g, 0x8d3b3b, 27.4, 29, 6, 8, 1);
        rect(g, 0xe8e2d0, 28, 30, 4.6, 0.8, 0.9); rect(g, 0xe8e2d0, 28, 32, 4.6, 0.8, 0.6);
      },
    },
    tho_ren: {
      coat: 0x6b4a35, inner: 0x8a6448, accent: 0xffa040, hair: 0x2a1d16,
      skin: 0xd9a279, skin2: 0xb47e57, pants: 0x4a3427, boot: 0x33241a, long: false, longHair: false,
      prop: (g) => {  // tạp dề + búa
        poly(g, 0x54402e, [[14.6, 30], [25.4, 30], [25, 41], [15, 41]]);
        rect(g, 0x9c6b3e, 18.6, 31, 2.6, 9, 0.9);
        rect(g, 0x6f6a63, 27, 8.4, 8, 5.4, 0.95);
        rect(g, 0x9aa3b8, 27.4, 9, 7, 1.6, 0.7);
        line(g, 0x5b3a29, 30, 13.6, 29, 30, 2.6);
        rect(g, 0xd9a279, 27.4, 29.4, 3.4, 2.6, 0.95);
        rect(g, 0xc98a4a, 14, 6, 12, 2.4, 0.95);  // băng đô
      },
    },
    ba_thuoc: {
      coat: 0xe6ede9, inner: 0x2f7d6d, accent: 0x2fbf9f, hair: 0x2b1e2e,
      skin: 0xeec6a2, skin2: 0xcf9a74, pants: 0xcfd8d3, boot: 0x8a9591, long: true, longHair: true,
      prop: (g) => {  // búi tóc + lọ thuốc
        ell(g, 0x2b1e2e, 20, 2.4, 4, 3);
        rect(g, 0x2f7d6d, 16.4, 34, 7.2, 2, 0.9);
        rrect(g, 0xbfeee0, 27, 27.4, 4.2, 6.6, 1.4);
        rrect(g, 0x7fffd4, 27.2, 29, 3.8, 4.6, 1.2, 0.95);
        rect(g, 0x8a6d55, 28, 26, 2.4, 1.8);
      },
    },
    tap_hoa: {
      coat: 0x6b4fa0, inner: 0xf2efe6, accent: 0xffd166, hair: 0x3b2a20,
      skin: 0xf1c8a0, skin2: 0xd29a72, pants: 0x4a3768, boot: 0x2c2238, long: false, longHair: false,
      prop: (g) => {  // nón lá + túi tiền
        tri(g, 0xffd166, 20, 1.4, 4.4, 9, 35.6, 9);
        tri(g, 0xf0b93f, 20, 2.4, 6, 9, 34, 9);
        line(g, 0xd19a2a, 5.6, 9, 34.4, 9, 1.4);
        rrect(g, 0xc98a3a, 27.4, 30.2, 5.8, 6, 2.2);
        rect(g, 0xffd166, 29.4, 30.2, 1.8, 1.6, 0.9);
      },
    },
    thu_kho: {
      coat: 0x3b4a5a, inner: 0x5a6a7a, accent: 0x7fd8ff, hair: 0x1f1f25,
      skin: 0xe8bd95, skin2: 0xc69169, pants: 0x2e3a46, boot: 0x222a33, long: false, longHair: false,
      prop: (g) => {  // mũ lưỡi trai + thùng gỗ
        rrect(g, 0x2c3846, 13.6, 2.2, 12.8, 5, 2.4);
        rect(g, 0x222c38, 24.6, 5.4, 7.4, 1.8, 0.95);
        rect(g, 0x7fd8ff, 17.6, 3.4, 4.6, 1.4, 0.5);
        rrect(g, 0x9c6b3e, 27, 28, 7.4, 9.4, 1.6);
        rect(g, 0x6f4a2a, 27, 30.6, 7.4, 1.6, 0.9);
        rect(g, 0x6f4a2a, 27, 34, 7.4, 1.6, 0.9);
      },
    },
  };

  // NPC có ảnh riêng (public/assets/npcs/<id>.png, nguồn CSAF Hearthhands, xem server/tools/npc-images.js): chiều cao hiển thị (px logic).
  // Không tải được ảnh thì make() bên dưới vẽ lại bằng code như cũ.
  const NPC_IMAGES = { lao_su: 62, tap_hoa: 62, thu_kho: 64 };

  function npcs(scene) {
    for (const id in NPCS) {
      const pal = NPCS[id];
      make(scene, 'npc_' + id, 40, 60, (g) => drawHunter(g, pal, 'idle', { prop: pal.prop }));
    }
    for (const id in NPC_IMAGES) Art.registerImage(scene, 'npc_' + id, NPC_IMAGES[id]);
  }

  Object.assign(Art._, { HUNTERS, drawHunter, hunters, NPCS, NPC_IMAGES, npcs });
  Object.assign(Art, { HUNTERS, drawHunter });
})();
