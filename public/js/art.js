'use strict';
/*
 * Toàn bộ hình ảnh của game được vẽ bằng code (pixel art có viền).
 * Sau này muốn dùng ảnh vẽ tay, chỉ cần nạp ảnh PNG cùng tên key trong preload là được.
 */
const Art = (() => {
  const OUT = 0x0b0d14;
  const SKIN = 0xf2c9a0, SKIN2 = 0xd9a77e;

  // Vẽ texture từ danh sách hình chữ nhật [màu, x, y, w, h, (alpha)], tự thêm viền tối bao quanh
  function pix(scene, key, w, h, shapes, extra) {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    for (const s of shapes) if (!s[6]) { g.fillStyle(OUT, 1); g.fillRect(s[1] - 1, s[2] - 1, s[3] + 2, s[4] + 2); }
    for (const s of shapes) { g.fillStyle(s[0], s[5] == null ? 1 : s[5]); g.fillRect(s[1], s[2], s[3], s[4]); }
    if (extra) extra(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }
  function tex(scene, key, w, h, draw) {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(g, (c, x, y, ww, hh, a = 1) => { g.fillStyle(c, a); g.fillRect(x, y, ww, hh); });
    g.generateTexture(key, w, h);
    g.destroy();
  }
  const shade = (c, p) => Phaser.Display.Color.IntegerToColor(c).darken(p).color;
  const light = (c, p) => Phaser.Display.Color.IntegerToColor(c).lighten(p).color;

  // ---------------------------------------------------------------- Thợ săn
  const HUNTERS = {
    none: { coat: 0x4a5163, accent: 0x9aa3b8, hair: 0x23232b, eye: 0x2a2a2a, inner: 0x2c303c, long: false },
    kiem_si: { coat: 0x7a1f2b, accent: 0xff5a4e, hair: 0x1a1a22, eye: 0xff7a6e, inner: 0xe6e8ef, long: true },
    cung_thu: { coat: 0x1f5a45, accent: 0x4fd18b, hair: 0x5a3626, eye: 0x7affb8, inner: 0xd9d2bf, long: false },
    phap_su: { coat: 0x2b2f7a, accent: 0x6c8cff, hair: 0x1a1f3a, eye: 0x9ab4ff, inner: 0xcdd6ff, long: true },
    toan_nang: { coat: 0x17171f, accent: 0xffc94a, hair: 0xe9edf5, eye: 0xffd76a, inner: 0x2a2a35, long: true },
  };
  const LEGS = {
    idle: [[15, 40, 5, 13, 14, 52], [21, 40, 5, 13, 21, 52]],
    run1: [[12, 40, 5, 12, 9, 52], [23, 40, 5, 12, 24, 52]],
    run2: [[17, 40, 5, 13, 16, 52], [19, 40, 5, 11, 20, 50]],
    jump: [[14, 40, 5, 9, 12, 48], [21, 40, 5, 11, 22, 50]],
  };

  function hunterShapes(pal, frame, opt = {}) {
    const coat2 = shade(pal.coat, 12);
    const s = [];
    const flap = frame === 'run1' ? -3 : frame === 'run2' ? -1 : frame === 'jump' ? -2 : 0;
    s.push([coat2, 11, 24, 4, 13]);                                    // tay sau
    if (pal.long) s.push([coat2, 12 + flap, 37, 16 - flap, 10]);         // vạt áo khoác dài
    for (const [x, y, w, h, bx, by] of LEGS[frame]) { s.push([0x22252f, x, y, w, h]); s.push([0x15161c, bx, by, 7, 7]); }
    s.push([pal.coat, 12, 22, 17, 17]);                                 // thân áo
    s.push([pal.inner, 21, 22, 5, 12]);                                 // áo trong
    s.push([coat2, 12, 22, 3, 17]);
    s.push([0x1a1c24, 12, 35, 17, 3]);                                  // thắt lưng
    s.push([pal.accent, 19, 35, 3, 3]);
    s.push([pal.accent, 20, 24, 1, 11]);                                // viền áo phát sáng
    s.push([coat2, 13, 20, 15, 3]);                                     // cổ áo
    s.push([SKIN2, 18, 18, 6, 3]);                                      // cổ
    s.push([SKIN, 15, 8, 12, 12]);                                      // mặt
    s.push([SKIN2, 16, 13, 2, 3]);
    s.push([pal.eye, 23, 12, 2, 3]);
    s.push([0xffffff, 23, 12, 1, 1]);
    s.push([SKIN2, 23, 17, 2, 1]);
    s.push([pal.hair, 14, 3, 14, 6]);                                   // tóc
    s.push([pal.hair, 13, 6, 4, 10]);
    s.push([pal.hair, 21, 7, 7, 3]);
    s.push([pal.hair, 26, 5, 3, 3]);
    s.push([pal.hair, 11, 4, 4, 3]);
    s.push([light(pal.hair, 12), 17, 4, 6, 1]);
    s.push([pal.coat, 24, 23, 5, 12]);                                  // tay trước
    s.push([coat2, 24, 33, 5, 2]);
    s.push([SKIN, 25, 35, 4, 4]);
    if (opt.extra) s.push(...opt.extra);
    return s;
  }

  function hunters(scene) {
    for (const id in HUNTERS) for (const f of Object.keys(LEGS)) {
      const pal = HUNTERS[id];
      pix(scene, `hunter_${id}_${f}`, 40, 60, hunterShapes(pal, f), (g) => {
        // mắt phát sáng cho người đã thức tỉnh
        if (id !== 'none') { g.fillStyle(pal.eye, 0.35); g.fillCircle(24, 13, 4); }
      });
    }
  }

  // ---------------------------------------------------------------- NPC (người của Hiệp Hội)
  function npcs(scene) {
    const def = {
      lao_su: { coat: 0x2b3a55, accent: 0xd94a4a, hair: 0x9a9ca6, eye: 0x2a2a2a, inner: 0xeef0f5, long: true,
        extra: [[0xd94a4a, 22, 23, 2, 9], [0x111111, 21, 11, 6, 1], [0x111111, 21, 11, 1, 3], [0x111111, 26, 11, 1, 3]] },
      tho_ren: { coat: 0x6b4a35, accent: 0xffa040, hair: 0x2a1d16, eye: 0x2a2a2a, inner: 0x8a6448, long: false,
        extra: [[0x9c6b3e, 13, 26, 15, 16], [0x7fd8ff, 15, 4, 10, 3], [0x8d8f99, 29, 26, 7, 5], [0x5b3a29, 31, 31, 3, 12]] },
      ba_thuoc: { coat: 0xe6ede9, accent: 0x2fbf9f, hair: 0x2b1e2e, eye: 0x2a2a2a, inner: 0x2f7d6d, long: true,
        extra: [[0x2b1e2e, 15, 0, 7, 5], [0x2fbf9f, 28, 30, 6, 8], [0xbfeee0, 29, 28, 4, 3]] },
      tap_hoa: { coat: 0x6b4fa0, accent: 0xffd166, hair: 0x3b2a20, eye: 0x2a2a2a, inner: 0xf2efe6, long: false,
        extra: [[0xffd166, 13, 1, 16, 4], [0xffd166, 25, 4, 7, 2]] },
      thu_kho: { coat: 0x3b4a5a, accent: 0x7fd8ff, hair: 0x1f1f25, eye: 0x2a2a2a, inner: 0x5a6a7a, long: false,
        extra: [[0x2c3846, 13, 1, 16, 5], [0xe8e2d0, 28, 27, 7, 10], [0x9aa3b8, 29, 29, 5, 1], [0x9aa3b8, 29, 32, 5, 1]] },
    };
    for (const id in def) {
      pix(scene, 'npc_' + id, 40, 60, hunterShapes(def[id], 'idle', { extra: def[id].extra }));
    }
  }

  // ---------------------------------------------------------------- Vũ khí và hiệu ứng
  function weapons(scene) {
    pix(scene, 'w_kiem', 46, 10, [
      [0x3b2a20, 1, 3, 9, 4], [0xc9a227, 10, 1, 3, 8], [0xcfd8e3, 13, 3, 28, 4], [0xffffff, 13, 3, 28, 1], [0xcfd8e3, 41, 4, 3, 2],
    ], (g) => { g.fillStyle(0x7fd8ff, 0.25); g.fillRect(13, 2, 30, 6); });
    tex(scene, 'w_cung', 22, 48, (g) => {
      g.lineStyle(5, OUT); g.beginPath(); g.arc(-6, 24, 24, -1.05, 1.05); g.strokePath();
      g.lineStyle(3, 0x8b5a2b); g.beginPath(); g.arc(-6, 24, 24, -1.05, 1.05); g.strokePath();
      g.lineStyle(1, 0x4fd18b); g.beginPath(); g.arc(-6, 24, 24, -0.4, 0.4); g.strokePath();
      g.lineStyle(1, 0xe8e2d0, 0.9); g.lineBetween(6, 4, 6, 44);
    });
    pix(scene, 'w_truong', 14, 56, [[0x5b3a29, 6, 12, 3, 44], [0x8a6448, 6, 12, 1, 44], [0xc9a227, 4, 11, 7, 3]], (g) => {
      g.fillStyle(0x6c8cff, 0.35); g.fillCircle(7, 6, 7);
      g.fillStyle(OUT); g.fillCircle(7, 6, 5); g.fillStyle(0x8fb0ff); g.fillCircle(7, 6, 4); g.fillStyle(0xffffff); g.fillCircle(6, 5, 1.5);
    });
  }

  function crescent(scene, key, w, h, color, thick) {
    tex(scene, key, w, h, (g) => {
      g.lineStyle(thick, color, 0.9);
      g.beginPath(); g.arc(w / 2 - h * 0.35, h / 2, h / 2 - thick, -1.15, 1.15); g.strokePath();
      g.lineStyle(Math.max(1, thick / 3), 0xffffff, 0.95);
      g.beginPath(); g.arc(w / 2 - h * 0.35 + 2, h / 2, h / 2 - thick, -0.9, 0.9); g.strokePath();
    });
  }

  function effects(scene) {
    crescent(scene, 'slash', 54, 70, 0xffffff, 6);
    crescent(scene, 'fx_wave', 44, 60, 0x9fe8ff, 7);
    pix(scene, 'proj_arrow', 32, 8, [[0xd7c39a, 6, 3, 20, 2], [0x4fd18b, 1, 1, 6, 2], [0x4fd18b, 1, 5, 6, 2]],
      (g) => { g.fillStyle(OUT); g.fillTriangle(25, 0, 32, 4, 25, 8); g.fillStyle(0xdfe6ee); g.fillTriangle(26, 1, 31, 4, 26, 7); });
    tex(scene, 'proj_fire', 40, 14, (g) => {
      g.fillStyle(0xff7043, 0.3); g.fillEllipse(18, 7, 40, 14);
      g.fillStyle(0xffb74d, 0.6); g.fillEllipse(22, 7, 26, 8);
      g.fillStyle(0xfff3c4); g.fillRect(8, 6, 24, 2); g.fillTriangle(30, 2, 40, 7, 30, 12);
    });
    tex(scene, 'proj_orb', 22, 22, (g) => {
      g.fillStyle(0x6c8cff, 0.3); g.fillCircle(11, 11, 11);
      g.fillStyle(0x8fb0ff, 0.7); g.fillCircle(11, 11, 7);
      g.fillStyle(0xffffff); g.fillCircle(11, 11, 3.5);
    });
    tex(scene, 'spark', 8, 8, (g) => { g.fillStyle(0xffffff); g.fillCircle(4, 4, 4); });
    tex(scene, 'shadow', 34, 8, (g) => { g.fillStyle(0x000000, 0.35); g.fillEllipse(17, 4, 32, 7); });
    tex(scene, 'mote', 6, 6, (g) => { g.fillStyle(0xffffff, 0.9); g.fillCircle(3, 3, 3); });
  }

  // ---------------------------------------------------------------- Quái
  function monsters(scene) {
    tex(scene, 'm_dummy_0', 30, 46, (g, r) => {
      r(OUT, 12, 13, 6, 33); r(0x6a6f7d, 13, 14, 4, 32);
      r(OUT, 1, 18, 28, 6); r(0x8a90a0, 2, 19, 26, 4);
      r(OUT, 7, 1, 16, 15); r(0xb6bcc8, 8, 2, 14, 13); r(0x3fd0ff, 10, 7, 10, 3);
      r(OUT, 8, 25, 14, 13); r(0xb6bcc8, 9, 26, 12, 11); r(0xff5a4e, 13, 29, 4, 4);
    });
    tex(scene, 'm_dummy_1', 30, 46, (g, r) => {
      r(OUT, 12, 13, 6, 33); r(0x6a6f7d, 13, 14, 4, 32);
      r(OUT, 1, 17, 28, 6); r(0x8a90a0, 2, 18, 26, 4);
      r(OUT, 9, 0, 16, 15); r(0xb6bcc8, 10, 1, 14, 13); r(0x3fd0ff, 12, 6, 10, 3);
      r(OUT, 8, 25, 14, 13); r(0xb6bcc8, 9, 26, 12, 11); r(0xff5a4e, 13, 29, 4, 4);
    });
    for (let f = 0; f < 2; f++) {
      const sq = f ? 2 : 0;
      tex(scene, 'm_mushroom_' + f, 36, 34, (g, r) => {
        g.fillStyle(OUT); g.fillEllipse(18, 12 + sq, 36, 24 - sq); r(OUT, 9, 14 + sq, 18, 20 - sq);
        r(0xe9dcc0, 10, 15 + sq, 16, 18 - sq);
        r(0x1a1020, 13, 21 + sq, 3, 3); r(0x1a1020, 20, 21 + sq, 3, 3);
        g.fillStyle(0x8e3bb8); g.fillEllipse(18, 12 + sq, 33, 21 - sq);
        g.fillStyle(0xc77dff); g.fillEllipse(15, 8 + sq, 18, 8);
        g.fillStyle(0xe6ff9a); g.fillCircle(9, 10 + sq, 2.5); g.fillCircle(21, 5 + sq, 2.5); g.fillCircle(27, 12 + sq, 2);
      });
      tex(scene, 'm_wolf_' + f, 50, 32, (g, r) => {
        const c = 0x5d6474, d = 0x3d4250;
        r(OUT, 1, 5 + f, 10, 6); r(d, 2, 6 + f, 8, 4);
        r(OUT, 7, 7, 30, 16); r(c, 8, 8, 28, 13); r(d, 8, 17, 28, 4); r(0x7d8494, 10, 8, 20, 3);
        r(OUT, 31, 3, 17, 14); r(c, 32, 4, 15, 12); r(d, 32, 0, 4, 6); r(d, 40, 0, 4, 6);
        r(0xff4d4d, 41, 7, 3, 2); r(OUT, 46, 10, 3, 3);
        const L = f ? [[10, 2], [16, -2], [26, 2], [32, -2]] : [[10, -2], [16, 2], [26, -2], [32, 2]];
        for (const [x, o] of L) { r(OUT, x + o - 1, 21, 6, 11); r(d, x + o, 21, 4, 10); }
      });
      tex(scene, 'm_frog_' + f, 38, 30, (g, r) => {
        const c = 0x3fae8f, d = 0x2a7562;
        g.fillStyle(OUT); g.fillEllipse(19, 18 - f * 2, 34, 22);
        g.fillStyle(c); g.fillEllipse(19, 18 - f * 2, 31, 19);
        g.fillStyle(0x9ff2c9); g.fillEllipse(19, 22 - f * 2, 18, 7);
        r(d, 4, 23 - f * 2, 8, 6); r(d, 26, 23 - f * 2, 8, 6);
        g.fillStyle(OUT); g.fillCircle(10, 8 - f * 2, 6); g.fillCircle(28, 8 - f * 2, 6);
        g.fillStyle(0xfff59d); g.fillCircle(10, 8 - f * 2, 5); g.fillCircle(28, 8 - f * 2, 5);
        g.fillStyle(OUT); g.fillCircle(11, 8 - f * 2, 2.5); g.fillCircle(29, 8 - f * 2, 2.5);
      });
      tex(scene, 'm_bat_' + f, 46, 28, (g, r) => {
        const c = 0x6a4c93, d = 0x45306a;
        g.fillStyle(OUT);
        if (f) { g.fillTriangle(17, 13, -1, 1, 6, 22); g.fillTriangle(29, 13, 47, 1, 40, 22); }
        else { g.fillTriangle(17, 13, -1, 25, 8, 5); g.fillTriangle(29, 13, 47, 25, 38, 5); }
        g.fillStyle(d);
        if (f) { g.fillTriangle(17, 13, 1, 3, 7, 20); g.fillTriangle(29, 13, 45, 3, 39, 20); }
        else { g.fillTriangle(17, 13, 1, 23, 9, 7); g.fillTriangle(29, 13, 45, 23, 37, 7); }
        g.fillStyle(OUT); g.fillEllipse(23, 14, 20, 18); g.fillStyle(c); g.fillEllipse(23, 14, 18, 16);
        r(c, 16, 2, 4, 6); r(c, 26, 2, 4, 6);
        r(0xff3d6e, 18, 11, 3, 3); r(0xff3d6e, 25, 11, 3, 3);
        r(0xffffff, 20, 18, 2, 3); r(0xffffff, 24, 18, 2, 3);
      });
      tex(scene, 'm_spider_' + f, 48, 30, (g, r) => {
        const c = 0x6d6a85, d = 0x3e3b52;
        g.lineStyle(4, OUT);
        for (let i = 0; i < 4; i++) { const x = 12 + i * 7, o = (i + f) % 2 ? 3 : -3; g.lineBetween(x, 14, x - 8 + o, 29); g.lineBetween(x + 4, 14, x + 12 + o, 29); }
        g.lineStyle(2, d);
        for (let i = 0; i < 4; i++) { const x = 12 + i * 7, o = (i + f) % 2 ? 3 : -3; g.lineBetween(x, 14, x - 8 + o, 29); g.lineBetween(x + 4, 14, x + 12 + o, 29); }
        g.fillStyle(OUT); g.fillEllipse(18, 13, 28, 20); g.fillEllipse(37, 14, 16, 14);
        g.fillStyle(c); g.fillEllipse(18, 13, 26, 18); g.fillStyle(d); g.fillEllipse(37, 14, 14, 12);
        g.fillStyle(0xb388ff); g.fillTriangle(12, 6, 18, 2, 22, 8);
        r(0xff5252, 39, 11, 2, 2); r(0xff5252, 43, 11, 2, 2); r(0xff5252, 41, 14, 2, 2);
      });
      tex(scene, 'm_golem_' + f, 104, 108, (g, r) => {
        const c = 0x6e6a80, d = 0x4a4660, l = 0x908ca6;
        const a = f ? 4 : 0;
        r(OUT, 19, 77, 24, 31); r(OUT, 57, 77, 24, 31); r(d, 20, 78, 22, 29); r(d, 58, 78, 22, 29);
        r(OUT, 13, 29, 74, 54); r(c, 14, 30, 72, 52); r(l, 14, 30, 72, 6); r(d, 14, 74, 72, 8);
        r(OUT, -1 + 1, 33 + a, 18, 44); r(c, 1, 34 + a, 16, 42); r(d, 1, 68 + a, 16, 10);
        r(OUT, 85, 33 - a, 18, 44); r(c, 86, 34 - a, 16, 42); r(d, 86, 68 - a, 16, 10);
        r(OUT, 29, 3, 42, 32); r(c, 30, 4, 40, 30); r(l, 30, 4, 40, 5);
        r(0xff2d55, 38, 16, 8, 6); r(0xff2d55, 54, 16, 8, 6); r(0xffb3c1, 40, 17, 3, 2); r(0xffb3c1, 56, 17, 3, 2);
        r(d, 40, 27, 20, 3);
        g.fillStyle(0xff2d55, 0.35); g.fillCircle(50, 54, 14);
        g.fillStyle(OUT); g.fillTriangle(50, 42, 41, 55, 59, 55); g.fillTriangle(50, 66, 41, 55, 59, 55);
        g.fillStyle(0xff5c7a); g.fillTriangle(50, 44, 43, 55, 57, 55); g.fillTriangle(50, 64, 43, 55, 57, 55);
        g.fillStyle(0xb388ff); g.fillTriangle(16, 30, 22, 14, 28, 30); g.fillTriangle(72, 30, 80, 10, 86, 30);
        r(d, 24, 40, 10, 3); r(d, 66, 62, 12, 3); r(d, 28, 64, 8, 3);
      });
    }
  }

  // ---------------------------------------------------------------- Bản đồ
  const THEMES = {
    city: { top: 0x9aa0ad, top2: 0x6f7584, fill: 0x343844, fill2: 0x2a2d37, plank: [0x4d5a70, 0x8fa3c4, 0x2d3546] },
    forest: { top: 0x3c6e5c, top2: 0x2b5145, fill: 0x2a3036, fill2: 0x20252a, glow: 0x7fffd4, plank: [0x4a5a52, 0x6f8a7e, 0x2f3a35] },
    cave: { top: 0x4e4f72, top2: 0x3a3a58, fill: 0x2a2a40, fill2: 0x212134, glow: 0xb388ff, plank: [0x4a4766, 0x7c76a8, 0x2c2a40] },
  };

  function tiles(scene) {
    for (const t in THEMES) {
      const c = THEMES[t];
      tex(scene, `tile_${t}_top`, 32, 32, (g, r) => {
        r(c.fill, 0, 0, 32, 32);
        for (let i = 0; i < 6; i++) r(c.fill2, (i * 13) % 28, 12 + (i * 7) % 18, 4, 3);
        if (t === 'city') {
          r(c.top, 0, 0, 32, 7); r(0xc3c8d3, 0, 0, 32, 2); r(c.top2, 0, 7, 32, 3); r(0x23262e, 0, 10, 32, 2);
          r(c.top2, 15, 2, 1, 5);
        } else {
          r(c.top, 0, 0, 32, 8); r(c.top2, 0, 8, 32, 3);
          for (let x = 0; x < 32; x += 6) r(c.top, x + 1, 10, 3, 3);
          r(c.glow, 5, 2, 2, 2, 0.9); r(c.glow, 22, 4, 2, 2, 0.7);
        }
      });
      tex(scene, `tile_${t}_fill`, 32, 32, (g, r) => {
        r(c.fill, 0, 0, 32, 32);
        for (let i = 0; i < 6; i++) r(c.fill2, (i * 11 + 3) % 28, (i * 9 + 2) % 28, 4, 3);
        if (c.glow) r(c.glow, 18, 20, 2, 2, 0.25);
      });
      tex(scene, `plank_${t}`, 32, 12, (g, r) => {
        const [base, hi, lo] = c.plank;
        r(OUT, 0, 0, 32, 12); r(base, 0, 1, 32, 8); r(hi, 0, 1, 32, 2); r(lo, 0, 9, 32, 3);
        if (t === 'city') { r(0xc3c8d3, 4, 4, 2, 2); r(0xc3c8d3, 26, 4, 2, 2); r(lo, 15, 1, 2, 8); }
        else { r(lo, 15, 1, 1, 8); r(c.glow, 8, 4, 2, 2, 0.6); }
      });
    }
  }

  function decorations(scene) {
    // Cửa tiệm / tòa nhà ở thành phố (3 kiểu)
    const shops = [[0x2b3350, 0x3fd0ff], [0x3a2b4a, 0xff4fa3], [0x2f3d3a, 0xffc94a]];
    shops.forEach(([wall, neon], i) => {
      tex(scene, 'd_shop_' + i, 150, 170, (g, r) => {
        r(OUT, 9, 0, 132, 170); r(wall, 10, 1, 130, 169); r(shade(wall, 10), 10, 1, 8, 169);
        for (let y = 12; y < 92; y += 22) for (let x = 24; x < 130; x += 26) {
          const on = ((x * 7 + y * 3 + i * 5) % 5) > 1;
          r(OUT, x - 1, y - 1, 16, 14); r(on ? 0xffd88a : 0x1a1d2b, x, y, 14, 12);
          if (on) r(0xfff1c9, x, y, 14, 2);
        }
        r(OUT, 18, 100, 114, 22); r(0x11131c, 19, 101, 112, 20);
        g.fillStyle(neon, 0.25); g.fillRect(14, 96, 122, 30);
        r(neon, 22, 108, 106, 4); r(0xffffff, 22, 108, 106, 1);
        r(OUT, 24, 128, 102, 42); r(0x1a1d2b, 25, 129, 100, 41);
        r(0xbfe9ff, 30, 134, 36, 30, 0.35); r(0xbfe9ff, 84, 134, 36, 30, 0.35);
        r(neon, 25, 129, 100, 2);
        r(OUT, 66, 136, 18, 34); r(0x0d0f16, 67, 137, 16, 33);
      });
    });
    tex(scene, 'd_lamp', 40, 96, (g, r) => {
      g.fillStyle(0xffe6a0, 0.18); g.fillTriangle(28, 14, 8, 96, 40, 96);
      r(OUT, 5, 8, 6, 88); r(0x4a5163, 6, 9, 4, 87);
      r(OUT, 5, 6, 28, 6); r(0x4a5163, 6, 7, 26, 4);
      r(OUT, 24, 10, 12, 7); r(0xfff1c9, 25, 11, 10, 5);
      g.fillStyle(0xffe6a0, 0.35); g.fillCircle(30, 14, 9);
    });
    tex(scene, 'd_tree', 70, 100, (g, r) => {
      r(OUT, 18, 84, 34, 16); r(0x5a6070, 19, 85, 32, 15); r(0x7a8090, 19, 85, 32, 3);
      r(OUT, 32, 50, 7, 36); r(0x4a3426, 33, 51, 5, 35);
      g.fillStyle(OUT); g.fillCircle(35, 34, 26); g.fillCircle(20, 46, 16); g.fillCircle(50, 46, 16);
      g.fillStyle(0x245a4a); g.fillCircle(35, 34, 24); g.fillCircle(20, 46, 14); g.fillCircle(50, 46, 14);
      g.fillStyle(0x2f7a62); g.fillCircle(30, 28, 15); g.fillCircle(50, 42, 8);
    });
    // Cây trong cổng: thân xoắn, nấm phát sáng
    tex(scene, 'd_dtree', 90, 190, (g, r) => {
      g.fillStyle(OUT); g.fillRect(36, 40, 18, 150); g.fillTriangle(40, 60, 6, 20, 12, 14); g.fillTriangle(50, 70, 86, 26, 80, 20);
      g.fillStyle(0x2b2a33); g.fillRect(38, 40, 14, 150); g.fillTriangle(41, 60, 9, 20, 13, 17); g.fillTriangle(49, 70, 83, 26, 80, 23);
      g.fillStyle(0x3a3944); g.fillRect(38, 40, 4, 150);
      g.fillStyle(0x7fffd4, 0.3); g.fillCircle(30, 168, 14);
      g.fillStyle(0x7fffd4); g.fillEllipse(28, 170, 14, 7); g.fillEllipse(58, 178, 10, 5);
      g.fillStyle(0xc77dff, 0.9); g.fillCircle(12, 18, 4); g.fillCircle(82, 24, 4);
    });
    tex(scene, 'd_shroom', 46, 34, (g) => {
      g.fillStyle(0x7fffd4, 0.22); g.fillCircle(23, 22, 20);
      const m = (x, y, w, c) => { g.fillStyle(OUT); g.fillRect(x - 2, y, 4, 34 - y); g.fillEllipse(x, y, w + 2, w * 0.6 + 2); g.fillStyle(0xd8f5ec); g.fillRect(x - 1, y, 2, 34 - y); g.fillStyle(c); g.fillEllipse(x, y, w, w * 0.6); };
      m(12, 20, 14, 0x7fffd4); m(30, 12, 20, 0x5ce0c0); m(40, 24, 10, 0xc77dff);
    });
    tex(scene, 'd_crystal', 50, 70, (g) => {
      g.fillStyle(0xb388ff, 0.25); g.fillCircle(25, 50, 24);
      const cr = (x, h, w, c) => { g.fillStyle(OUT); g.fillTriangle(x - w - 1, 70, x + w + 1, 70, x, 70 - h - 2); g.fillStyle(c); g.fillTriangle(x - w, 70, x + w, 70, x, 70 - h); };
      cr(14, 34, 7, 0x8a6cff); cr(36, 44, 8, 0xa98bff); cr(25, 62, 9, 0xc4b0ff);
      g.fillStyle(0xffffff, 0.7); g.fillTriangle(25, 14, 22, 50, 26, 50);
    });
    tex(scene, 'd_stalactite', 26, 52, (g) => {
      g.fillStyle(OUT); g.fillTriangle(0, 0, 26, 0, 13, 52);
      g.fillStyle(0x4e4f72); g.fillTriangle(2, 0, 24, 0, 13, 48);
      g.fillStyle(0xb388ff, 0.8); g.fillTriangle(10, 0, 16, 0, 13, 30);
    });
    tex(scene, 'd_portal', 80, 120, (g) => {
      g.fillStyle(0x3fd0ff, 0.12); g.fillEllipse(40, 60, 80, 120);
      g.fillStyle(0x3fd0ff, 0.25); g.fillEllipse(40, 60, 64, 104);
      g.fillStyle(0x0a1a3a, 0.95); g.fillEllipse(40, 60, 50, 90);
      g.fillStyle(0x1f4fa0, 0.8); g.fillEllipse(40, 60, 36, 72);
      g.fillStyle(0x3fd0ff, 0.6); g.fillEllipse(40, 60, 18, 44);
      g.fillStyle(0xe0f7ff, 0.9); g.fillEllipse(40, 60, 6, 18);
      g.lineStyle(3, 0x7fe3ff, 0.95); g.strokeEllipse(40, 60, 52, 92);
    });
    tex(scene, 'mark_quest', 16, 24, (g, r) => { r(OUT, 4, 0, 8, 24); r(0xffd54f, 5, 1, 6, 14); r(0xffd54f, 5, 17, 6, 6); });
    tex(scene, 'mark_done', 18, 24, (g, r) => {
      r(OUT, 1, 0, 16, 24);
      r(0x69f0ae, 2, 1, 14, 4); r(0x69f0ae, 12, 4, 4, 6); r(0x69f0ae, 7, 9, 7, 4); r(0x69f0ae, 7, 12, 4, 4); r(0x69f0ae, 7, 18, 4, 5);
    });
  }

  // ---------------------------------------------------------------- Nền xa (tự lặp theo chiều ngang)
  function gradient(scene, key, colors) {
    const H = 576;
    tex(scene, key, 16, H, (g) => {
      const steps = 36;
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

  function backgrounds(scene) {
    const W = 960, H = 576;
    gradient(scene, 'bg_city_sky', [0x070a1c, 0x161a3e, 0x3a2456, 0x6b2f5c]);
    gradient(scene, 'bg_forest_sky', [0x081a20, 0x123a40, 0x2a6460]);
    gradient(scene, 'bg_cave_sky', [0x07050f, 0x150f26, 0x241a3c]);

    // Thành phố: sao, trăng, cổng đỏ trên trời, nhà cao tầng xa
    tex(scene, 'bg_city_far', W, H, (g, r) => {
      for (let i = 0; i < 70; i++) r(0xffffff, (i * 137) % W, (i * 71) % 260, 1 + (i % 3 === 0), 1 + (i % 3 === 0), 0.3 + (i % 5) * 0.12);
      g.fillStyle(0xfff3d6, 0.12); g.fillCircle(780, 90, 46); g.fillStyle(0xfff3d6); g.fillCircle(780, 90, 26);
      g.fillStyle(0xff2d55, 0.08); g.fillCircle(300, 120, 90); g.fillStyle(0xff2d55, 0.18); g.fillEllipse(300, 120, 120, 70);
      g.lineStyle(4, 0xff5c7a, 0.8); g.strokeEllipse(300, 120, 110, 62); g.fillStyle(0x1a0612, 0.85); g.fillEllipse(300, 120, 96, 52);
      for (let x = 0; x < W; x += 46) {
        const h = 180 + ((x * 53) % 170);
        r(0x1a1f3a, x, H - h, 40, h);
        for (let y = H - h + 10; y < H - 20; y += 16) for (let wx = x + 5; wx < x + 36; wx += 9) {
          if (((wx * 13 + y * 7) % 9) < 3) r(0xffd27a, wx, y, 4, 6, 0.55);
        }
      }
      r(0x1a1f3a, 600, 120, 24, 340); r(0xff2d55, 610, 112, 4, 8);
    });
    tex(scene, 'bg_city_near', W, H, (g, r) => {
      const neons = [0x3fd0ff, 0xff4fa3, 0x7c4dff, 0xffc94a];
      for (let x = 10, i = 0; x < W; x += 120, i++) {
        const h = 230 + ((x * 31) % 120);
        r(0x10142a, x, H - h, 96, h);
        r(0x181d38, x, H - h, 96, 6);
        for (let y = H - h + 18; y < H - 24; y += 20) for (let wx = x + 8; wx < x + 88; wx += 14) {
          if (((wx * 5 + y * 11) % 7) < 2) r(0xffe6a0, wx, y, 6, 9, 0.7);
        }
        const n = neons[i % neons.length];
        g.fillStyle(n, 0.2); g.fillRect(x + 12, H - h + 40, 30, 70);
        r(n, x + 18, H - h + 46, 18, 58, 0.85);
      }
    });
    // Rừng trong cổng
    tex(scene, 'bg_forest_far', W, H, (g, r) => {
      for (let x = 0; x < W; x += 34) { const h = 320 + ((x * 37) % 180); r(0x1d4f4a, x, H - h, 12, h, 0.8); }
      g.fillStyle(0x9ffff0, 0.1); g.fillRect(0, 300, W, 140); g.fillStyle(0x9ffff0, 0.06); g.fillRect(0, 250, W, 60);
      for (let i = 0; i < 40; i++) r(0x7fffd4, (i * 97) % W, 120 + (i * 53) % 300, 2, 2, 0.5);
    });
    tex(scene, 'bg_forest_near', W, H, (g, r) => {
      for (let x = 20; x < W; x += 70) {
        const h = 400 + ((x * 53) % 140); r(0x0f2e2c, x, H - h, 18, h);
        g.fillStyle(0x0f2e2c); g.fillTriangle(x + 9, H - h + 60, x - 30, H - h + 20, x - 26, H - h + 14);
        r(0xc77dff, x + 2, H - 80 - ((x * 7) % 60), 6, 4, 0.8);
      }
      g.fillStyle(0xcff7ee, 0.08); g.fillRect(0, 440, W, 80);
    });
    // Hang pha lê
    tex(scene, 'bg_cave_far', W, H, (g, r) => {
      for (let x = 0; x < W; x += 120) { r(0x17122a, x + 20, 0, 50, H); g.fillStyle(0x17122a); g.fillTriangle(x, 0, x + 120, 0, x + 45, 150); }
      for (const [x, y] of [[90, 300], [330, 420], [610, 260], [850, 380], [470, 180]]) {
        g.fillStyle(0xb388ff, 0.25); g.fillCircle(x + 6, y - 10, 18);
        g.fillStyle(0xa98bff, 0.8); g.fillTriangle(x, y, x + 6, y - 26, x + 12, y);
      }
    });
    tex(scene, 'bg_cave_near', W, H, (g, r) => {
      g.fillStyle(0x1e1833);
      for (let x = 40; x < W; x += 200) g.fillTriangle(x, H, x + 70, 250, x + 140, H);
      for (const [x, y] of [[150, 470], [520, 500], [760, 450]]) { g.fillStyle(0x7c4dff, 0.4); g.fillCircle(x, y, 6); }
    });
  }

  function makeAll(scene) {
    hunters(scene); weapons(scene); effects(scene); monsters(scene); npcs(scene); tiles(scene); decorations(scene); backgrounds(scene);
  }

  return { makeAll, THEMES, HUNTERS };
})();
