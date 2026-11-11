'use strict';
/*
 * Một số hình ảnh của game được dựng bằng code; nhân vật, quái và thú đồng hành dùng sprite sheet.
 * Phong cách: pixel art mềm — dựng khối bằng đường cong và nhiều tông màu,
 * viền tối màu cùng họ với màu nền thay vì viền đen cứng từng ô.
 * Hình code giữ vai trò dự phòng cho phần chưa có sprite sheet.
 *
 * File này chỉ có bút vẽ dùng chung; từng nhóm hình nằm trong public/js/art/*.js
 * và tự gắn hàm vẽ vào Art._ (nội bộ) cùng phần công khai vào Art.
 */
const Art = (() => {
  const OUT = 0x0b0d14;
  const shade = (c, p) => Phaser.Display.Color.IntegerToColor(c).darken(p).color;
  const light = (c, p) => Phaser.Display.Color.IntegerToColor(c).lighten(p).color;

  // ---------------------------------------------------------------- Bút vẽ
  // Hình vẽ nét cong (nhà, cây, đèn, pha lê, cổng, NPC) được tạo ở độ phân giải gấp HD lần và lọc mượt,
  // nên phóng to trên màn hình nét vẫn mịn. Khi đặt hình phải nhân scale với Art.hdScale(key) (xem scene.artImage).
  // Ô đất và chi tiết pixel nhỏ giữ 1×; nền vẽ ở 2× để rõ trên màn hình độ phân giải cao.
  const HD = 2;
  const BG_HD = 2;
  const NPC_HD = 4;   // NPC vẽ bằng code ở độ nét gấp 4 (texture 160×240) cho đỡ mờ khi phóng lên màn hình
  const HD_KEYS = /^(npc_|d_(shop|lamp|tree|dtree|shroom|crystal|redcrystal|stalactite|portal))/;
  const SMOOTH_KEYS = /^(bg_|fx_vignette$|fx_grade$|shadow$)/;
  const textureScale = new Map();
  // Nền lớn (960×576) chỉ vẽ cho chủ đề của bản đồ đang vào; chủ đề khác vẽ khi tới bản đồ đó → vào game nhanh hơn
  const THEME_BG = /^bg_(city|forest|cave|redgate)_/;
  let onlyTheme = null;
  function make(scene, key, w, h, draw) {
    if (scene.textures.exists(key)) return;
    if (onlyTheme) { const m = THEME_BG.exec(key); if (m && m[1] !== onlyTheme) return; }
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const scale = /^npc_/.test(key) ? NPC_HD : HD_KEYS.test(key) ? HD : (/^bg_/.test(key) || key === 'fx_vignette' ? BG_HD : 1);
    if (scale > 1) g.scaleCanvas(scale, scale);
    draw(g);
    g.generateTexture(key, Math.round(w * scale), Math.round(h * scale));
    g.destroy();
    if (scale > 1) textureScale.set(key, scale);
    if (scale > 1 || SMOOTH_KEYS.test(key)) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
  const hdScale = (key) => 1 / (textureScale.get(key) || 1);
  // Ảnh có sẵn (không vẽ bằng code) dùng làm hình NPC: khai báo chiều cao hiển thị (px logic) để artImage thu về đúng cỡ
  function registerImage(scene, key, logicH) {
    if (!scene.textures.exists(key) || textureScale.has(key)) return;
    const tex = scene.textures.get(key), src = tex.getSourceImage();
    if (!src || !src.height) return;
    textureScale.set(key, src.height / logicH);
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
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

  function makeAll(scene, theme) {
    onlyTheme = theme || null;
    const p = lib;
    p.hunters(scene); p.weapons(scene); p.effects(scene); p.monsters(scene); p.npcs(scene);
    p.tiles(scene); p.water(scene); p.earth(scene); p.decorations(scene); p.backgrounds(scene);
  }

  // Dùng nội bộ cho các file public/js/art/*.js
  const lib = { OUT, shade, light, make, ell, rect, rrect, poly, line, bone, tri, rnd, makeAll };
  // THEMES, HUNTERS, drawHunter: gắn trong art/terrain.js và art/characters.js
  return { makeAll, make, hdScale, registerImage, ell, rect, rrect, poly, line, tri, _: lib };
})();
