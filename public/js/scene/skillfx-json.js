'use strict';
/*
 * WorldScene · Bộ vẽ hiệu ứng từ file JSON riêng của từng kỹ năng.
 *
 * Nạp shared/data/skillfx/manifest.json + <id>.json (cùng một bộ file với app Godot),
 * rồi dịch các "layer" sang primitive đã có trong skillfx.js. Mỗi kỹ năng một file,
 * nên tinh chỉnh một chiêu không ảnh hưởng chiêu khác.
 *
 * Nguyên tắc an toàn (để không hỏng chiến đấu):
 *   - Nạp JSON bất đồng bộ. Chưa nạp xong hoặc file lỗi → gọi lại sfx() cũ của skillfx.js.
 *   - Mọi lỗi vẽ đều nuốt, rồi fallback. Không có ngoại lệ nào làm hỏng đòn đánh.
 *   - Không đụng skills.js (luật chơi): chỉ bọc lại WorldScene.prototype.sfx.
 *   - Giới hạn số hạt, tôn trọng Quality.low, pool image cho glow/ring/burst.
 */
(() => {
  const P = (typeof window !== 'undefined' && window.SkillFxPrim) || null;
  if (!P) return; // skillfx.js chưa nạp — cứ để sfx() cũ chạy

  const BASE = '/shared/data/skillfx/';
  const MAX_PARTICLES = 40;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const low = () => (typeof Quality !== 'undefined' && Quality.low);

  let manifest = null;
  const recipes = Object.create(null);
  const pools = Object.create(null);

  // ------------------------------------------------------------------ Nạp dữ liệu
  function loadManifest() {
    if (typeof fetch !== 'function') return;
    fetch(BASE + 'manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => { if (m && m.skills) manifest = m; })
      .catch(() => { /* không có manifest thì dùng fallback */ });
  }

  function recipe(id) {
    if (id in recipes) return recipes[id];
    if (!manifest) return null;
    const entry = manifest.skills[id];
    if (!entry) { recipes[id] = null; return null; }
    recipes[id] = null; // đánh dấu đang nạp để không fetch nhiều lần
    fetch(BASE + entry.file)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data && Array.isArray(data.layers)) recipes[id] = data; })
      .catch(() => { /* giữ null → fallback */ });
    return null;
  }

  // ------------------------------------------------------------------ Màu
  function colorOf(c, th) {
    if (c === 'core') return th.c[0];
    if (c === 'dark') return th.c[2];
    if (c == null || c === 'main') return th.c[1];
    if (typeof c === 'string') {
      if (c.charAt(0) === '#') return parseInt(c.slice(1), 16);
      if (c.slice(0, 2).toLowerCase() === '0x') return Number(c);
    }
    return th.c[1];
  }

  // ------------------------------------------------------------------ Pool image
  function take(s, key, col, depth, blend) {
    const arr = pools[key] || (pools[key] = []);
    let im = arr.pop();
    if (!im || !im.scene) im = s.add.image(0, 0, key).setDepth(depth);
    im.setActive(true).setVisible(true).setPosition(0, 0).setRotation(0)
      .setAlpha(1).setScale(1).setTint(col)
      .setBlendMode(blend == null ? Phaser.BlendModes.ADD : blend);
    im._poolKey = key;
    return im;
  }

  function give(im, s, props, ms, delay, ease) {
    if (!im || !im.scene) return;
    s.tweens.add({
      targets: im, ...props, duration: ms, delay: delay || 0, ease: ease || 'Quad.out',
      onComplete: () => {
        if (!im.scene) return;
        im.setActive(false).setVisible(false);
        const arr = pools[im._poolKey];
        if (arr) arr.push(im);
      },
    });
  }

  // ------------------------------------------------------------------ Vẽ một layer
  function paint(s, layer, th, L, id, sk, args) {
    const p = layer.params || {};
    const pl = s.player;
    const f = s.facing || 1;
    const x = pl.x, y = pl.y;
    const gy = pl.body ? pl.body.bottom : y;
    const col = colorOf(layer.color, th);
    const dur = layer.dur || 300;
    const a = args || [];
    const n = Math.max(1, Math.min(MAX_PARTICLES, Math.round((p.n || 8) * (low() ? 0.5 : 1))));

    switch (layer.kind) {
      case 'glow': {
        const im = take(s, 'fx_glow', col, p.d || 8.5);
        const sc = p.scale || 1.4;
        im.setScale(sc * 0.35).setAlpha(p.alpha == null ? 0.9 : p.alpha);
        give(im, s, { scale: sc, alpha: 0 }, dur);
        break;
      }
      case 'ring': {
        const im = take(s, 'fx_ring', col, p.d || 7.6);
        const r0 = (p.r0 || 8) / 28, sy = p.sy || 1, r1 = (p.r1 || 60) / 28;
        im.setScale(r0, r0 * sy).setAlpha(p.alpha == null ? 0.95 : p.alpha);
        give(im, s, { scaleX: r1, scaleY: r1 * sy, alpha: 0 }, dur, 0, 'Cubic.out');
        break;
      }
      case 'burst': {
        const key = p.tex || th.tex;
        const a0 = p.a0 == null ? 0 : p.a0;
        const a1 = p.a1 == null ? Math.PI * 2 : p.a1;
        for (let i = 0; i < n; i++) {
          const ang = rnd(a0, a1);
          const dist = rnd(p.d0 || 30, p.d1 || 110);
          const im = take(s, key, col, p.depth || 8.6, th.dark && col === th.c[2] ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD);
          im.setScale((p.size || 1) * rnd(0.6, 1.2));
          if (p.rot) im.setRotation(ang);
          give(im, s, {
            x: x + Math.cos(ang) * dist,
            y: y + Math.sin(ang) * dist + (p.grav || 0),
            alpha: 0, scale: 0.05,
          }, dur * rnd(0.7, 1.2));
        }
        break;
      }
      case 'stream': {
        P.stream(s, th, {
          x, y, w: p.w || 80, hh: p.hh || 0, n, dur: p.dur || 500,
          dx: p.dx || 0, dy: p.dy || -60, size: p.size || 1, life: p.life || 700,
        });
        break;
      }
      case 'beam': {
        const count = p.count || 1;
        const spread = p.spread || 0;
        for (let i = 0; i < count; i++) {
          const off = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
          const dx = (p.dx || 100) * f, dy = p.dy || 0;
          const ang = p.angle === 'random' ? rnd(-0.6, 0.6) : off;
          const len = Math.hypot(dx, dy) || 60;
          P.beam(s, x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len, col, p.w || 8, dur, p.key ? { key: p.key } : {});
        }
        break;
      }
      case 'bolt':
        P.bolt(s, x, y, x + (p.dx || 160) * f, y + (p.dy || 0), th, { jag: p.jag || 18, w: p.w || 5, segs: p.segs || 8 });
        break;
      case 'arc':
        P.arc(s, x, y, p.r || 70, p.a0 == null ? -1.2 : p.a0, p.a1 == null ? 1.2 : p.a1, col, p.thick || 24, dur, p.abs ? { abs: true } : {});
        break;
      case 'pillar':
        P.pillar(s, x, gy, col, p.w || 70, p.h || 280, dur);
        break;
      case 'sigil':
        P.sigil(s, x, p.y === 'ground' ? gy - 2 : y, col, p.r || 70, dur);
        break;
      case 'runeDisc':
        P.runeDisc(s, x, y, col, p.r || 80, dur, { spin: p.spin || 200 });
        break;
      case 'cracks':
        P.cracks(s, x, gy, col, p.span || 140, dur);
        break;
      case 'debris':
        P.debris(s, x, gy, th, n, p.spread || 70, col);
        break;
      case 'swirl':
        P.swirl(s, x, y, col, { n, r0: p.r0 || 80, r1: p.r1 || 8, turns: p.turns || 1.4, life: dur });
        break;
      case 'ghost':
        P.ghostOf(s, col, p.alpha == null ? 0.45 : p.alpha, dur, p.normal ? { normal: true } : {});
        break;
      case 'flash':
        P.flashCam(s, col, dur);
        break;
      case 'shake':
        s.cameras.main.shake(dur, p.intensity || 0.01);
        break;
      // Các đòn có đường bay riêng: dùng lại R.* của skillfx.js, JSON chỉ quyết định có vẽ hay không
      case 'fall':
        if (P.R.fall) P.R.fall(s, id, sk, L, a[0], a[1], a[2] || dur);
        break;
      case 'arrowZone':
        if (P.R.arrowZone) P.R.arrowZone(s, id, sk, L, a[0], a[1], a[2] || 160, a[3] || dur);
        break;
      case 'meteor':
        if (P.R.meteor) P.R.meteor(s, id, sk, L, a[0], a[1], a[2] || dur, a[3] || 0, a[4], a[5]);
        break;
      default:
        break;
    }
  }

  // ------------------------------------------------------------------ Điểm vào
  function draw(s, kind, id, sk, args) {
    if (!manifest || !P.alive(s)) return false;
    const r = recipe(id);
    if (!r) return false;
    const layers = r.layers.filter((l) => l.trigger === kind);
    if (!layers.length) return false; // kind này không có layer riêng → fallback

    const L = P.look(id, sk);
    for (const layer of layers) {
      if (layer.t > 0) {
        s.time.delayedCall(layer.t, () => { if (P.alive(s)) paint(s, layer, L.th, L, id, sk, args); });
      } else {
        paint(s, layer, L.th, L, id, sk, args);
      }
    }
    return true;
  }

  // Bọc sfx() cũ. JSON có layer cho kind này thì dùng JSON, nếu không fallback y hệt cũ.
  const proto = (typeof WorldScene !== 'undefined') ? WorldScene.prototype : null;
  if (proto && proto.sfx) {
    const original = proto.sfx;
    proto.sfx = function (kind, id, sk, a, b, c, d, e, f) {
      try {
        if (draw(this, kind, id, sk, [a, b, c, d, e, f])) return;
      } catch (err) { /* lỗi vẽ → fallback, không làm hỏng đòn */ }
      return original.call(this, kind, id, sk, a, b, c, d, e, f);
    };
  }

  (typeof window !== 'undefined' ? window : globalThis).SkillFxJson = {
    load: loadManifest,
    draw,
    ready: () => !!manifest,
    count: () => (manifest ? manifest.count : 0),
    recipe,
  };

  loadManifest();
})();
