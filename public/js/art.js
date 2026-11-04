'use strict';
/*
 * Toàn bộ hình ảnh của game được vẽ bằng code.
 * Phong cách: pixel art mềm — dựng khối bằng đường cong và nhiều tông màu,
 * viền tối màu cùng họ với màu nền thay vì viền đen cứng từng ô.
 * Sau này muốn dùng ảnh vẽ tay, chỉ cần nạp ảnh PNG cùng tên key trong preload là được.
 */
const Art = (() => {
  const OUT = 0x0b0d14;
  const shade = (c, p) => Phaser.Display.Color.IntegerToColor(c).darken(p).color;
  const light = (c, p) => Phaser.Display.Color.IntegerToColor(c).lighten(p).color;

  // ---------------------------------------------------------------- Bút vẽ
  function make(scene, key, w, h, draw) {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }
  const ell = (g, c, x, y, rx, ry, a = 1) => { g.fillStyle(c, a); g.fillEllipse(x, y, rx * 2, ry * 2); };
  const rect = (g, c, x, y, w, h, a = 1) => { g.fillStyle(c, a); g.fillRect(x, y, w, h); };
  const rrect = (g, c, x, y, w, h, r, a = 1) => { g.fillStyle(c, a); g.fillRoundedRect(x, y, w, h, r); };
  const poly = (g, c, pts, a = 1) => { g.fillStyle(c, a); g.fillPoints(pts.map(p => ({ x: p[0], y: p[1] })), true); };
  const line = (g, c, x1, y1, x2, y2, w, a = 1) => {
    g.lineStyle(w, c, a); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath();
  };
  // Xương: đoạn thẳng dày hai đầu bo tròn — dùng cho tay, chân, cành cây
  const bone = (g, c, x1, y1, x2, y2, w) => {
    line(g, c, x1, y1, x2, y2, w);
    g.fillStyle(c, 1); g.fillCircle(x1, y1, w / 2); g.fillCircle(x2, y2, w / 2);
  };
  const tri = (g, c, x1, y1, x2, y2, x3, y3, a = 1) => poly(g, c, [[x1, y1], [x2, y2], [x3, y3]], a);
  const rnd = (i, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

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
  };

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

  function npcs(scene) {
    for (const id in NPCS) {
      const pal = NPCS[id];
      make(scene, 'npc_' + id, 40, 60, (g) => drawHunter(g, pal, 'idle', { prop: pal.prop }));
    }
  }

  // ---------------------------------------------------------------- Vũ khí
  function weapons(scene) {
    // Thanh kiếm cong nhẹ, lưỡi sáng, chuôi quấn
    make(scene, 'w_kiem', 46, 10, (g) => {
      poly(g, 0x9aa8ba, [[14, 2], [40, 3.2], [43, 5], [40, 6.8], [14, 8]]);
      poly(g, 0xe8eef7, [[15, 2.6], [39, 3.8], [41.6, 5], [39, 4.6], [15, 4.4]]);
      rect(g, 0xffffff, 16, 2.6, 24, 1, 0.85);
      rect(g, 0x3b2a20, 3, 3, 10, 4);
      rect(g, 0x5b3a29, 3.6, 3.4, 8.6, 1.2, 0.8);
      rect(g, 0xc9a227, 11.4, 1, 3, 8);
      rect(g, 0xf0d27a, 11.8, 1.4, 1.2, 7.2, 0.9);
      g.fillStyle(0x7fd8ff, 0.22); g.fillRect(14, 1, 30, 8);
    });
    // Cung cong, dây cung, chỗ cầm
    make(scene, 'w_cung', 22, 48, (g) => {
      g.lineStyle(5, 0x3b2a20, 1); g.beginPath(); g.arc(-5, 24, 23, -1.02, 1.02); g.strokePath();
      g.lineStyle(3, 0x8b5a2b, 1); g.beginPath(); g.arc(-5, 24, 23, -1.02, 1.02); g.strokePath();
      g.lineStyle(1.4, 0xc9a227, 0.9); g.beginPath(); g.arc(-5, 24, 23, -0.55, 0.55); g.strokePath();
      g.lineStyle(1, 0xe8e2d0, 0.9); g.lineBetween(5.4, 4, 5.4, 44);
      rect(g, 0x4fd18b, 3.6, 20, 4.4, 8, 0.9);
      g.fillStyle(0x4fd18b, 0.2); g.fillCircle(6, 24, 8);
    });
    // Trượng: cán quấn, viên ngọc phát sáng
    make(scene, 'w_truong', 14, 56, (g) => {
      rect(g, 0x4a3120, 5.6, 12, 3.4, 43);
      rect(g, 0x7a5433, 6.2, 12, 1.6, 43, 0.9);
      for (let i = 0; i < 5; i++) rect(g, 0x2f2216, 5.2, 44 + i * 2.2, 4.4, 1, 0.85);
      rect(g, 0xc9a227, 4.4, 10.6, 5.6, 3);
      g.fillStyle(0x6c8cff, 0.28); g.fillCircle(7, 6.4, 6.6);
      g.fillStyle(0x9db6ff, 0.85); g.fillCircle(7, 6.4, 4.4);
      g.fillStyle(0xffffff, 0.95); g.fillCircle(5.8, 5.2, 1.6);
      g.lineStyle(1, 0xc9d8ff, 0.8); g.strokeCircle(7, 6.4, 4.6);
    });
  }

  // ---------------------------------------------------------------- Hiệu ứng
  function crescent(g, w, h, color, thick) {
    for (let i = 0; i < 3; i++) {
      const t = thick * (1 - i * 0.3);
      g.lineStyle(t, color, 0.35 + i * 0.25);
      g.beginPath(); g.arc(w / 2 - h * 0.32, h / 2, h / 2 - thick - i, -1.12, 1.12); g.strokePath();
    }
    g.lineStyle(Math.max(1, thick / 2.5), 0xffffff, 0.95);
    g.beginPath(); g.arc(w / 2 - h * 0.32 + 1, h / 2, h / 2 - thick, -0.92, 0.92); g.strokePath();
  }

  function effects(scene) {
    make(scene, 'slash', 54, 70, (g) => crescent(g, 54, 70, 0xfff3d0, 7));
    make(scene, 'fx_wave', 44, 60, (g) => crescent(g, 44, 60, 0x9fe8ff, 8));
    make(scene, 'proj_arrow', 32, 8, (g) => {
      rect(g, 0x8b5a2b, 5, 3, 19, 2);
      rect(g, 0xd7c39a, 6, 3.4, 17, 0.9, 0.8);
      poly(g, 0xdfe6ee, [[24, 0.6], [32, 4], [24, 7.4]]);
      poly(g, 0x4fd18b, [[1, 0.6], [7, 3.4], [1, 6.4]]);
      poly(g, 0x9ff2c9, [[2.4, 1.6], [5.6, 3.4], [2.4, 5.2]], 0.8);
      g.fillStyle(0x4fd18b, 0.18); g.fillEllipse(16, 4, 32, 10);
    });
    make(scene, 'proj_fire', 40, 14, (g) => {
      g.fillStyle(0xff7043, 0.16); g.fillEllipse(18, 7, 40, 14);
      g.fillStyle(0xff9d4d, 0.4); g.fillEllipse(16, 7, 30, 10);
      poly(g, 0xffb74d, [[4, 7], [14, 1.4], [30, 5], [38, 7], [30, 9], [14, 12.6]], 0.9);
      poly(g, 0xfff3c4, [[12, 7], [20, 4], [30, 6.6], [20, 8], [12, 9]], 0.95);
      g.fillStyle(0xffffff, 0.9); g.fillCircle(24, 7, 1.6);
    });
    make(scene, 'proj_orb', 22, 22, (g) => {
      ell(g, 0x6c8cff, 11, 11, 11, 11, 0.16);
      ell(g, 0x8fb0ff, 11, 11, 8, 8, 0.35);
      ell(g, 0xcdd8ff, 11, 11, 5.2, 5.2, 0.85);
      ell(g, 0xffffff, 11, 11, 2.6, 2.6);
    });
    make(scene, 'spark', 8, 8, (g) => { ell(g, 0xffffff, 4, 4, 4, 4, 0.35); ell(g, 0xffffff, 4, 4, 2.2, 2.2); });
    make(scene, 'shadow', 34, 8, (g) => {
      for (let i = 4; i >= 1; i--) ell(g, 0x000000, 17, 4, 17 * i / 4, 4 * i / 4, 0.12);
    });
    make(scene, 'mote', 6, 6, (g) => { ell(g, 0xffffff, 3, 3, 3, 3, 0.3); ell(g, 0xffffff, 3, 3, 1.4, 1.4, 0.95); });
  }

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

  // ---------------------------------------------------------------- Địa hình
  const THEMES = {
    city: { top: 0x9aa0ad, top2: 0x6f7584, fill: 0x3b424e, fill2: 0x2b313b, plank: [0x3a4556, 0x8fa3c4, 0x222b38] },
    forest: { top: 0x3c6e5c, top2: 0x2b5145, fill: 0x353b36, fill2: 0x272d28, glow: 0x7fffd4, plank: [0x4a5a52, 0x8aa79a, 0x2f3a35] },
    cave: { top: 0x4e4f72, top2: 0x3a3a58, fill: 0x373754, fill2: 0x28283e, glow: 0xb388ff, plank: [0x4a4766, 0x7c76a8, 0x2c2a40] },
  };

  function tiles(scene) {
    // Mặt đất: viền sáng mảnh ở trên, thân có vân loang (không kẻ ô)
    for (const t in THEMES) {
      const c = THEMES[t];
      make(scene, `tile_${t}_top`, 32, 32, (g) => {
        rect(g, c.fill, 0, 0, 32, 32);
        if (t === 'city') {
          // mép vỉa hè liền một dải, bên dưới là mặt nhựa mịn (không lát gạch)
          rect(g, 0x8b93a1, 0, 0, 32, 0.9, 0.35);
          rect(g, 0x6c7482, 0, 0.9, 32, 3.6);
          rect(g, 0x828a98, 0, 0.9, 32, 1.1, 0.5);
          ell(g, 0x646c7a, 9, 3.4, 7, 1.6, 0.5);
          ell(g, 0x646c7a, 26, 2.6, 5, 1.4, 0.4);
          rect(g, 0x4b525d, 0, 4.5, 32, 1.8);
          rect(g, 0x242a33, 0, 6.3, 32, 1.5, 0.75);
          // mảng loang rất nhẹ + một vết nứt mảnh cho đỡ phẳng
          ell(g, 0x363d49, 7, 19, 11, 7, 0.28);
          ell(g, 0x2c323c, 25, 25, 12, 6, 0.3);
          line(g, 0x262c35, 12, 12, 19, 26, 0.8, 0.22);
        } else if (t === 'forest') {
          rect(g, 0x7fffd4, 0, 0, 32, 1, 0.2);
          rect(g, c.top, 0, 0.6, 32, 4.6);
          rect(g, 0x4f9a62, 0, 0.6, 32, 2.4, 0.9);
          rect(g, 0x6fc07c, 0, 0.6, 32, 0.9, 0.55);
          // cỏ mọc tua tủa, nhiều sắc
          for (let i = 0; i < 14; i++) {
            const x = 0.6 + i * 2.3 + rnd(i) * 1.6, h = 2.6 + rnd(i, 3) * 4.6;
            tri(g, i % 3 === 0 ? 0x7ad08a : i % 3 === 1 ? 0x5aa86e : 0x46895a, x, 1.4, x + 1.9, 1.4, x + 0.6, 1.4 - h);
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

  // ---------------------------------------------------------------- Nền xa
  function gradient(scene, key, colors) {
    const H = 576;
    make(scene, key, 16, H, (g) => {
      const steps = 48;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1) * (colors.length - 1);
        const a = Math.floor(t), b = Math.min(colors.length - 1, a + 1);
        const col = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.IntegerToColor(colors[a]), Phaser.Display.Color.IntegerToColor(colors[b]), 100, (t - a) * 100);
        g.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b));
        g.fillRect(0, (H / steps) * i, 16, H / steps + 1);
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

  function makeAll(scene) {
    hunters(scene); weapons(scene); effects(scene); monsters(scene); npcs(scene);
    tiles(scene); decorations(scene); backgrounds(scene);
  }

  return { makeAll, THEMES, HUNTERS, drawHunter, make, ell, rect, rrect, poly, line, tri };
})();
