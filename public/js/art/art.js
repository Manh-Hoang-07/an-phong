'use strict';
/*
 * Toàn bộ hình ảnh của game được vẽ bằng code.
 * Phong cách: pixel art mềm — dựng khối bằng đường cong và nhiều tông màu,
 * viền tối màu cùng họ với màu nền thay vì viền đen cứng từng ô.
 * Sau này muốn dùng ảnh vẽ tay, chỉ cần nạp ảnh PNG cùng tên key trong preload là được.
 *
 * File này chỉ có bút vẽ dùng chung; từng nhóm hình nằm trong public/js/art/*.js
 * và tự gắn hàm vẽ vào Art._ (nội bộ) cùng phần công khai vào Art.
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

  function makeAll(scene) {
    const p = lib;
    p.hunters(scene); p.weapons(scene); p.effects(scene); p.monsters(scene); p.npcs(scene);
    p.tiles(scene); p.decorations(scene); p.backgrounds(scene);
  }

  // Dùng nội bộ cho các file public/js/art/*.js
  const lib = { OUT, shade, light, make, ell, rect, rrect, poly, line, bone, tri, rnd, makeAll };
  // THEMES, HUNTERS, drawHunter: gắn trong art/terrain.js và art/characters.js
  return { makeAll, make, ell, rect, rrect, poly, line, tri, _: lib };
})();
