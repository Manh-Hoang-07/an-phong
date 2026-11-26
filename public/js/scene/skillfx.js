'use strict';
/*
 * WorldScene · Hiệu ứng RIÊNG cho từng kỹ năng / tuyệt kỹ / tuyệt phẩm.
 *
 * Tách bạch hai việc:
 *   - skills.js  : luật chơi (tốn MP, hồi chiêu, vùng đánh, sát thương) — KHÔNG đụng tới ở đây.
 *   - skillfx.js : chỉ VẼ. Mỗi kỹ năng có một "chủ đề" (bảng màu + hạt) và một "kiểu" (hình dạng chuyển động).
 *
 * Nhân vật KHÔNG tung đòn khi dùng kỹ năng: đứng yên, chỉ có hiệu ứng phát ra từ người / mục tiêu.
 *
 * Thêm kỹ năng mới: thêm một dòng vào bảng SK bên dưới ('chủ_đề:kiểu'). Quên thì tự suy ra từ class + loại
 * kỹ năng (xem look()), nên không bao giờ mất hiệu ứng.
 * Mọi hiệu ứng bọc try/catch: lỗi vẽ không bao giờ được làm hỏng một đòn đánh.
 */
(() => {
  const PI = Math.PI;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const ADD = () => Phaser.BlendModes.ADD;
  const NORMAL = () => Phaser.BlendModes.NORMAL;
  const quality = () => (typeof Quality !== 'undefined' && Quality.low ? 0.5 : 1);

  // ------------------------------------------------------------------ Chủ đề: c = [lõi sáng, màu chính, màu tối]
  const TH = {
    sword:  { c: [0xffffff, 0xbcd6ff, 0x5b8cff], tex: 'fx_spark' },
    fire:   { c: [0xfff1b0, 0xff9d4d, 0xff4a2b], tex: 'fx_ember' },
    inferno:{ c: [0xffd180, 0xff5a1f, 0x8a1200], tex: 'fx_ember' },
    ice:    { c: [0xffffff, 0xa8f0ff, 0x3cc8ff], tex: 'fx_snow' },
    bolt:   { c: [0xffffff, 0xfff176, 0x82b1ff], tex: 'fx_spark' },
    wind:   { c: [0xffffff, 0xc9ffe0, 0x6fe3b0], tex: 'fx_leaf' },
    holy:   { c: [0xffffff, 0xffe9a0, 0xffc23c], tex: 'fx_star' },
    heal:   { c: [0xf4fff0, 0xa5f58c, 0x2fcf6a], tex: 'fx_leaf' },
    shadow: { c: [0xe8d8ff, 0x9a6cff, 0x2a1448], tex: 'fx_dust', dark: true },
    blood:  { c: [0xffd0d0, 0xff3b4f, 0x7d0a1e], tex: 'fx_drop', dark: true },
    necro:  { c: [0xe6ffd8, 0x7bf27a, 0x4a2a80], tex: 'fx_glow', dark: true },
    steel:  { c: [0xfff4dc, 0xd9b36e, 0x78879a], tex: 'fx_spark' },
    earth:  { c: [0xffe6b8, 0xc08a4c, 0x5a4030], tex: 'fx_dust', dark: true },
    arcane: { c: [0xffffff, 0xe0b3ff, 0x9b4dff], tex: 'fx_star' },
    spirit: { c: [0xe6ffff, 0x72e8ff, 0x2a9cff], tex: 'fx_glow' },
    star:   { c: [0xffffff, 0xbfd4ff, 0xffe08a], tex: 'fx_star' },
    dragon: { c: [0xfff3c0, 0x5ff2d0, 0xffb300], tex: 'fx_spark' },
    arrow:  { c: [0xffffff, 0x8dffb8, 0x2fd47a], tex: 'fx_leaf' },
    water:  { c: [0xffffff, 0x9fe8ff, 0x2f8cff], tex: 'fx_drop' },
    void:   { c: [0xf0dcff, 0xc07bff, 0x1a0033], tex: 'fx_dust', dark: true },
  };

  // ------------------------------------------------------------------ Bảng kỹ năng: 'chủ_đề:kiểu'
  // Kiểu theo từng loại (type):
  //  melee: slash sweep cross whirl thrust claw bash stab      dash: streak shadow blood charge dragon
  //  projectile/spread: bolt wave lance arrow fan shard lightning dagger bird cursed holy star disc dragon
  //  backstep: smoke hop blink
  //  aoe: nova frost blizzard quake vortex flame drain miasma roar garden blades trap chain veil judge dawn elem
  //  heal: cross holy moon drop dawn garden phoenix spirit      buff: rage eye rune bless clones wings spirit bloodlust awaken orbit
  //  guard: shield counter fortress thorn cloak angel spirit dome      manashield: crystal holy soul
  //  sword_fall: sword blade hammer steel void      arrow_rain: arrow storm fire net      meteor: fire lightning void spirit elem hell
  const SK = {};
  `
  pa1 sword:streak|pa2 sword:slash|pa4 steel:shield|pa3 fire:rage|pa5 sword:sword|pa6 wind:whirl|pa7 steel:cross|pa8 sword:thrust
  pa9 steel:counter|pa10 wind:vortex|pa11 sword:wave|ks25 sword:sweep|ks30 steel:counter|ks35 dragon:dragon|ks40 sword:blades
  ks27 wind:streak|ks32 sword:orbit|ks37 sword:thrust|ks38 water:wave|ks42 wind:vortex|ks45 holy:awaken|ulKiem1 sword:blade|ulKiem2 sword:whirl
  hl1 fire:arrow|hl2 arrow:fan|hl4 wind:hop|hl3 arrow:eye|hl5 arrow:arrow|hl6 wind:arrow|hl7 spirit:storm|hl8 ice:shard
  hl9 arrow:fan|hl10 holy:lance|hl11 fire:fan|xa25 holy:arrow|xa30 arrow:hop|xa35 arrow:eye|xa40 spirit:net|xa27 bolt:lance
  xa32 steel:lance|xa37 arrow:fan|xa38 holy:trap|xa42 star:star|xa45 fire:fire|ulCung1 star:lance|ulCung2 fire:fire
  tn1 water:wave|tn2 water:moon|tn4 arcane:crystal|tn3 ice:frost|tn5 fire:fire|tn6 ice:blizzard|tn7 fire:fire|tn8 fire:bolt
  tn9 bolt:lightning|tn10 arcane:blink|tn11 inferno:hell|ps25 bolt:lightning|ps30 fire:flame|ps35 arcane:crystal|ps40 arcane:elem
  ps27 fire:bolt|ps32 ice:frost|ps37 bolt:lightning|ps38 water:moon|ps42 arcane:blink|ps45 arcane:elem|ulPhap1 bolt:lightning|ulPhap2 ice:blizzard
  vn1 holy:awaken|vn2 arcane:elem|vn3 arcane:rune|vn4 arcane:rune|vn5 arcane:spirit|vn6 arcane:holy|vn7 arcane:cross
  st1 shadow:shadow|st2 blood:stab|st4 shadow:cloak|st3 blood:bloodlust|st5 shadow:dagger|st6 shadow:shadow|st7 blood:blood
  st8 necro:dagger|st9 shadow:smoke|st10 blood:stab|st11 shadow:veil|av25 shadow:shadow|av30 shadow:dagger|av35 shadow:cloak
  av40 blood:stab|av27 shadow:smoke|av32 shadow:clones|av37 shadow:dagger|av38 blood:bloodlust|av42 blood:blood|av45 shadow:veil|ulSat1 blood:dagger
  tk1 steel:bash|tk2 steel:vortex|tk4 steel:shield|tk3 earth:rage|tk5 steel:steel|tk6 earth:quake|tk7 earth:fortress|tk8 earth:charge
  tk9 earth:roar|tk10 steel:thorn|tk11 bolt:hammer|hv25 steel:disc|hv30 steel:dome|hv35 earth:quake|hv40 steel:charge|hv27 steel:bash
  hv32 earth:orbit|hv37 steel:vortex|hv38 steel:fortress|hv42 dragon:quake|hv45 steel:awaken|ulTank1 steel:fortress|ulTank2 earth:quake|ulTankSuper steel:dome
  tl1 heal:cross|tl2 holy:wave|tl4 holy:holy|tl3 holy:bless|tl5 holy:dawn|tl6 holy:holy|tl7 heal:garden|tl8 water:drop
  tl9 holy:holy|tl10 holy:wings|tl11 holy:dawn|tl30 holy:arrow|tl25 heal:garden|tl35 holy:holy|tl40 holy:dawn|tg27 holy:holy
  tg32 holy:bless|tg37 holy:angel|tg38 holy:holy|tg42 holy:judge|tg45 holy:phoenix|ulTri1 holy:phoenix
  th1 spirit:bolt|th2 spirit:spirit|th3 spirit:nova|th4 spirit:spirit|th5 spirit:summon|th6 spirit:spirit|th7 spirit:soul
  th8 spirit:bird|th9 spirit:spirit|th10 dragon:dragon|th11 spirit:spirit|ulLinh1 spirit:spirit
  nl1 necro:cursed|nl2 shadow:summon|nl3 blood:drain|nl4 necro:spirit|nl5 void:void|nl6 shadow:chain|nl7 necro:claw|nl8 void:cursed
  nl9 necro:soul|nl10 necro:chain|nl11 necro:miasma|ulLinh2 necro:awaken
  ulChung1 arcane:nova|ulChung2 holy:awaken|ulChung3 void:void
  ulSinhTu void:execute|ulTuLinhDungHop shadow:fusion|ulPhapSuper inferno:manaburst|ulToanNangSuper arcane:allin
  `.split(/[|\n]/).forEach((e) => { const [id, v] = e.trim().split(/\s+/); if (id) SK[id] = v; });

  const SCHOOL_TH = { kiem_si: 'sword', cung_thu: 'arrow', phap_su: 'arcane', toan_nang: 'arcane', sat_thu: 'shadow',
    tanker: 'steel', tri_lieu_su: 'holy', trieu_hoi_su: 'spirit', tu_linh_thuat_su: 'necro', chung: 'arcane' };
  const TYPE_SIG = { melee: 'slash', dash: 'streak', projectile: 'bolt', spread: 'fan', aoe: 'nova', heal: 'holy', buff: 'rune',
    guard: 'shield', manashield: 'crystal', backstep: 'smoke', sword_fall: 'sword', arrow_rain: 'arrow', meteor: 'fire',
    shadow_command: 'chain', summon: 'summon', shadow_toggle: 'summon' };

  const lookCache = {};
  function look(id, sk) {
    if (lookCache[id]) return lookCache[id];
    const e = SK[id] && SK[id].split(':');
    const key = (e && TH[e[0]] && e[0]) || SCHOOL_TH[sk.school] || 'arcane';
    return (lookCache[id] = { key, th: TH[key], c: TH[key].c, sig: (e && e[1]) || TYPE_SIG[sk.type] || 'nova' });
  }

  // ------------------------------------------------------------------ Hình dựng sẵn (vẽ bằng code, trắng để tô màu)
  function makeTex(s) {
    if (s.textures.exists('fx_orb')) return;
    const mk = (key, w, h, draw) => {
      if (s.textures.exists(key)) return;
      const g = s.make.graphics({ x: 0, y: 0, add: false }); draw(g); g.generateTexture(key, w, h); g.destroy();
    };
    const poly = (g, pts, col, a = 1) => {
      g.fillStyle(col, a); g.beginPath();
      pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.closePath(); g.fillPath();
    };
    mk('fx_glow', 32, 32, (g) => { for (let i = 16; i > 0; i--) { g.fillStyle(0xffffff, 0.08); g.fillCircle(16, 16, i); } });
    mk('fx_orb', 40, 40, (g) => {
      g.fillStyle(0xffffff, 0.10); g.fillCircle(20, 20, 20); g.fillStyle(0xffffff, 0.2); g.fillCircle(20, 20, 15);
      g.fillStyle(0xffffff, 0.5); g.fillCircle(20, 20, 10); g.fillStyle(0xffffff, 1); g.fillCircle(20, 20, 6);
    });
    mk('fx_streak', 64, 8, (g) => { poly(g, [[0, 4], [32, 0.4], [64, 4], [32, 7.6]], 0xffffff, 0.55); poly(g, [[6, 4], [32, 2.4], [58, 4], [32, 5.6]], 0xffffff, 1); });
    mk('fx_tail', 64, 10, (g) => { poly(g, [[0, 5], [64, 0], [64, 10]], 0xffffff, 0.75); poly(g, [[20, 5], [64, 2.5], [64, 7.5]], 0xffffff, 1); });
    mk('fx_beam', 16, 128, (g) => {
      for (let y = 0; y < 128; y += 2) {
        const a = Math.pow(y / 128, 1.6);
        g.fillStyle(0xffffff, a * 0.45); g.fillRect(0, y, 16, 2);
        g.fillStyle(0xffffff, a * 0.9); g.fillRect(4, y, 8, 2);
      }
    });
    mk('fx_lance', 96, 14, (g) => {
      poly(g, [[0, 7], [14, 1], [86, 3], [96, 7], [86, 11], [14, 13]], 0xffffff, 0.28);
      poly(g, [[8, 7], [16, 4], [80, 5], [96, 7], [80, 9], [16, 10]], 0xffffff, 1);
    });
    mk('fx_shard', 24, 10, (g) => { poly(g, [[0, 5], [8, 0], [24, 5], [8, 10]], 0xffffff, 0.55); poly(g, [[3, 5], [9, 2], [22, 5], [9, 8]], 0xffffff, 1); });
    mk('fx_star', 28, 28, (g) => {
      const pts = []; for (let i = 0; i < 8; i++) { const r = i % 2 ? 4 : 13, a = i * PI / 4 - PI / 2; pts.push([14 + Math.cos(a) * r, 14 + Math.sin(a) * r]); }
      g.fillStyle(0xffffff, 0.25); g.fillCircle(14, 14, 13); poly(g, pts, 0xffffff, 1);
    });
    mk('fx_dagger', 30, 10, (g) => {
      poly(g, [[0, 5], [8, 2], [24, 3], [24, 7], [8, 8]], 0xffffff, 1);
      g.fillStyle(0xffffff, 0.7); g.fillRect(22, 0, 3, 10); g.fillRect(25, 3, 5, 4);
    });
    mk('fx_bird', 46, 30, (g) => {
      poly(g, [[8, 16], [24, 8], [44, 16], [24, 22]], 0xffffff, 0.85);
      poly(g, [[18, 14], [10, 0], [30, 12]], 0xffffff, 0.9); poly(g, [[18, 18], [10, 30], [30, 20]], 0xffffff, 0.7);
      g.fillStyle(0xffffff, 1); g.fillCircle(40, 14, 4);
    });
    mk('fx_feather', 8, 20, (g) => { poly(g, [[4, 0], [8, 8], [4, 20], [0, 8]], 0xffffff, 0.9); g.fillStyle(0xffffff, 0.5); g.fillRect(3.5, 2, 1, 16); });
    mk('fx_drop', 8, 12, (g) => { poly(g, [[4, 0], [8, 8], [4, 12], [0, 8]], 0xffffff, 0.35); g.fillStyle(0xffffff, 1); g.fillCircle(4, 8, 3); });
    mk('fx_cross', 16, 16, (g) => { g.fillStyle(0xffffff, 0.35); g.fillRect(5, 0, 6, 16); g.fillRect(0, 5, 16, 6); g.fillStyle(0xffffff, 1); g.fillRect(6, 1, 4, 14); g.fillRect(1, 6, 14, 4); });
    mk('fx_skull', 24, 26, (g) => {
      g.fillStyle(0xffffff, 0.2); g.fillCircle(12, 13, 12); g.fillStyle(0xffffff, 1); g.fillCircle(12, 10, 9); g.fillRect(7, 14, 10, 8);
      g.fillStyle(0x000000, 0.85); g.fillCircle(8, 10, 2.6); g.fillCircle(16, 10, 2.6); g.fillRect(11, 14, 2, 3);
    });
    mk('fx_disc', 36, 36, (g) => {
      g.fillStyle(0xffffff, 0.25); g.fillCircle(18, 18, 18); g.lineStyle(3, 0xffffff, 1); g.strokeCircle(18, 18, 14);
      g.fillStyle(0xffffff, 0.8); g.fillRect(16, 4, 4, 28); g.fillRect(4, 16, 28, 4);
    });
    mk('fx_hammer', 70, 90, (g) => {
      g.fillStyle(0x6b4a2a, 1); g.fillRect(31, 24, 8, 64); g.fillStyle(0xc9a227, 1); g.fillRect(29, 70, 12, 5);
      g.fillStyle(0x8793a6, 1); g.fillRoundedRect(4, 0, 62, 30, 5); g.fillStyle(0xdfe7f2, 1); g.fillRoundedRect(7, 3, 56, 8, 3);
      g.fillStyle(0xffe066, 0.8); g.fillRect(30, 8, 10, 18);
    });
    mk('fx_sword_v', 16, 48, (g) => {   // kiếm dựng đứng, mũi hướng lên
      g.fillStyle(0xffffff, 0.25); g.fillEllipse(8, 24, 16, 48);
      poly(g, [[8, 0], [13, 9], [12, 35], [4, 35], [3, 9]], 0xffffff, 1);
      g.fillStyle(0xffffff, 0.6); g.fillRect(7, 6, 2, 28); g.fillRect(1, 35, 14, 3); g.fillRect(6, 38, 4, 9);
    });
    mk('fx_roundshield', 40, 40, (g) => {   // khiên tròn
      g.fillStyle(0xffffff, 0.3); g.fillCircle(20, 20, 19); g.lineStyle(3, 0xffffff, 1); g.strokeCircle(20, 20, 17);
      g.lineStyle(1.5, 0xffffff, 0.8); g.strokeCircle(20, 20, 11);
      g.fillStyle(0xffffff, 1); g.fillCircle(20, 20, 4.5); g.fillStyle(0xffffff, 0.6); g.fillRect(19, 4, 2, 32); g.fillRect(4, 19, 32, 2);
    });
    mk('fx_sigil', 128, 128, (g) => {
      g.lineStyle(3, 0xffffff, 0.95); g.strokeCircle(64, 64, 60);
      g.lineStyle(1.5, 0xffffff, 0.8); g.strokeCircle(64, 64, 52); g.strokeCircle(64, 64, 34);
      for (let i = 0; i < 24; i++) { const a = i * PI / 12; g.lineStyle(i % 2 ? 1.5 : 3, 0xffffff, 0.9); g.beginPath(); g.moveTo(64 + Math.cos(a) * 52, 64 + Math.sin(a) * 52); g.lineTo(64 + Math.cos(a) * 60, 64 + Math.sin(a) * 60); g.strokePath(); }
      g.lineStyle(2, 0xffffff, 0.9);
      for (const off of [0, PI]) { g.beginPath(); for (let i = 0; i < 3; i++) { const a = off - PI / 2 + i * PI * 2 / 3; (i ? g.lineTo : g.moveTo).call(g, 64 + Math.cos(a) * 34, 64 + Math.sin(a) * 34); } g.closePath(); g.strokePath(); }
      g.fillStyle(0xffffff, 0.12); g.fillCircle(64, 64, 34);
    });
  }

  // ------------------------------------------------------------------ Phần tử dựng sẵn
  const alive = (s) => s.sys && s.sys.isActive();
  function later(s, ms, fn) {
    if (!ms || ms <= 0) { fn(); return; }
    s.time.delayedCall(ms, () => { if (alive(s)) fn(); });
  }
  function kill(s, o, props, ms, delay = 0, ease = 'Quad.out') {
    s.tweens.add({ targets: o, ...props, duration: ms, delay, ease, onComplete: () => o.destroy() });
  }
  function img(s, key, x, y, col, d = 8, blend = ADD()) {
    const i = s.add.image(x, y, key).setDepth(d);
    if (col != null) i.setTint(col);
    i.setBlendMode(blend);
    return i;
  }
  const blendFor = (th, col) => (th.dark && col === th.c[2] ? NORMAL() : ADD());
  function glow(s, x, y, col, sc, life, o = {}) {
    const i = img(s, 'fx_glow', x, y, col, o.d || 8.5, o.blend || ADD()).setScale(sc * 0.35).setAlpha(o.a == null ? 0.9 : o.a);
    kill(s, i, { scale: sc, alpha: 0 }, life);
    return i;
  }
  function ring(s, x, y, col, r1, o = {}) {
    const r0 = (o.r0 || 8) / 28, sy = o.sy || 1;
    const i = img(s, 'fx_ring', x, y, col, o.d || 7.6).setScale(r0, r0 * sy).setAlpha(o.a == null ? 0.95 : o.a);
    kill(s, i, { scaleX: r1 / 28, scaleY: (r1 / 28) * sy, alpha: 0 }, o.life || 480, 0, 'Cubic.out');
  }
  function burst(s, x, y, th, o = {}) {
    const n = Math.max(1, Math.round((o.n || 10) * quality()));
    for (let i = 0; i < n; i++) {
      const a = rnd(o.a0 == null ? 0 : o.a0, o.a1 == null ? PI * 2 : o.a1), d = rnd(o.d0 || 30, o.d1 || 110);
      const col = o.col != null ? o.col : pick(th.c);
      const p = img(s, o.tex || th.tex, x, y, col, o.depth || 8.6, blendFor(th, col)).setScale((o.size || 1) * rnd(0.6, 1.2)).setAlpha(0.95);
      if (o.rot) p.setRotation(a);
      kill(s, p, { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d + (o.grav || 0), alpha: 0, scale: 0.05 }, (o.life || 480) * rnd(0.7, 1.2), 0, 'Cubic.out');
    }
  }
  // Dòng hạt bay lên (dy < 0) hoặc rơi xuống (dy > 0) trong `dur` ms
  function stream(s, th, o) {
    const n = Math.max(1, Math.round(o.n * quality()));
    for (let i = 0; i < n; i++) {
      later(s, ((o.dur || 500) * i) / n, () => {
        const col = o.col != null ? o.col : pick(th.c);
        const px = o.x + rnd(-o.w / 2, o.w / 2), py = o.y + rnd(-(o.hh || 0), o.hh || 0);
        const p = img(s, o.tex || th.tex, px, py, col, o.depth || 8.6, blendFor(th, col)).setScale((o.size || 1) * rnd(0.7, 1.25)).setAlpha(0.95);
        if (o.rot != null) p.setRotation(o.rot);
        kill(s, p, { x: px + (o.dx || 0) + rnd(-14, 14), y: py + o.dy, alpha: 0, scale: o.end == null ? 0.2 : o.end }, (o.life || 700) * rnd(0.8, 1.2));
      });
    }
  }
  function beam(s, x1, y1, x2, y2, col, w, life, o = {}) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const b = img(s, o.key || 'fx_streak', x1, y1, col, o.depth || 8.4).setOrigin(0, 0.5).setRotation(Math.atan2(y2 - y1, x2 - x1))
      .setScale(len / (o.key === 'fx_lance' ? 96 : 64), w / (o.key === 'fx_lance' ? 14 : 8)).setAlpha(o.a == null ? 0.95 : o.a);
    kill(s, b, { scaleY: 0, alpha: 0 }, life, o.delay || 0);
    return b;
  }
  function bolt(s, x1, y1, x2, y2, th, o = {}) {
    const g = s.add.graphics().setDepth(o.depth || 9).setBlendMode(ADD());
    const segs = o.segs || Math.max(4, Math.round(Math.hypot(x2 - x1, y2 - y1) / 34));
    const nx = -(y2 - y1), ny = x2 - x1, nl = Math.hypot(nx, ny) || 1;
    const pts = [[x1, y1]];
    for (let i = 1; i < segs; i++) { const t = i / segs, j = rnd(-1, 1) * (o.jag || 18); pts.push([x1 + (x2 - x1) * t + (nx / nl) * j, y1 + (y2 - y1) * t + (ny / nl) * j]); }
    pts.push([x2, y2]);
    const pass = (w, col, a) => { g.lineStyle(w, col, a); g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.strokePath(); };
    const w = o.w || 5;
    pass(w * 3, th.c[2], 0.35); pass(w, th.c[1], 0.9); pass(Math.max(1.5, w * 0.4), th.c[0], 1);
    kill(s, g, { alpha: 0 }, o.life || 260, 0, 'Quad.in');
    return pts;
  }
  // Vệt chém hình lưỡi liềm (đầu nhọn, giữa dày). Góc tính từ hướng nhân vật quay mặt (0 = thẳng trước mặt).
  function arc(s, cx, cy, r, a0, a1, col, thick, life, o = {}) {
    const f = s.facing, mirror = (a) => (o.abs || f >= 0 ? a : PI - a);
    const g = s.add.graphics({ x: cx, y: cy }).setDepth(o.depth || 8.2).setBlendMode(o.blend || ADD());
    const N = 14;
    const shape = (kk) => {
      const out = [], inn = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N, a = mirror(a0 + (a1 - a0) * t), k = (Math.pow(Math.sin(PI * t), 0.8) * thick * kk) / 2;
        out.push([Math.cos(a) * (r + k), Math.sin(a) * (r + k)]); inn.push([Math.cos(a) * (r - k * 0.9), Math.sin(a) * (r - k * 0.9)]);
      }
      return out.concat(inn.reverse());
    };
    const fill = (pts, c, al) => { g.fillStyle(c, al); g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fillPath(); };
    fill(shape(1.25), col, 0.35); fill(shape(1), col, 0.7); fill(shape(0.4), o.core == null ? 0xffffff : o.core, 0.95);
    kill(s, g, { alpha: 0, scaleX: o.grow || 1.18, scaleY: o.grow || 1.18 }, life, o.delay || 0);
    return g;
  }
  function pillar(s, x, gy, col, w, h, life, o = {}) {
    const p = img(s, 'fx_beam', x, gy, col, o.depth || 7.4).setOrigin(0.5, 1).setScale(w / 16, h / 128).setAlpha(o.a == null ? 0.85 : o.a);
    kill(s, p, { scaleX: 0, alpha: 0 }, life, 0, 'Cubic.in');
  }
  function sigil(s, x, y, col, r, life, o = {}) {
    const i = img(s, 'fx_sigil', x, y, col, o.depth || 1.6).setScale((r / 60) * 0.3, (r / 60) * 0.3 * 0.3).setAlpha(o.a == null ? 0.9 : o.a);
    s.tweens.add({ targets: i, scaleX: r / 60, scaleY: (r / 60) * 0.3, duration: life * 0.3, ease: 'Back.out' });
    s.tweens.add({ targets: i, alpha: 0, duration: life * 0.5, delay: life * 0.5, onComplete: () => i.destroy() });
  }
  // Đĩa rune quay phía sau nhân vật (thẳng đứng)
  function runeDisc(s, x, y, col, r, life, o = {}) {
    const i = img(s, 'fx_sigil', x, y, col, o.depth || 3).setScale(r / 60 * 0.5).setAlpha(0.8);
    s.tweens.add({ targets: i, scale: r / 60, angle: o.spin || 200, duration: life, ease: 'Sine.out' });
    s.tweens.add({ targets: i, alpha: 0, duration: life * 0.45, delay: life * 0.55, onComplete: () => i.destroy() });
  }
  function cracks(s, x, gy, col, span, life) {
    const g = s.add.graphics().setDepth(1.8).setBlendMode(ADD());
    for (const dir of [-1, 1]) for (let b = 0; b < 3; b++) {
      let px = x, py = gy; const L = span * rnd(0.55, 1), steps = 7;
      g.lineStyle(4 - b, col, 0.95); g.beginPath(); g.moveTo(px, py);
      for (let i = 0; i < steps; i++) { px += (dir * L) / steps; py = gy + rnd(-4, 9) * (b ? 1 : 0.4); g.lineTo(px, py); }
      g.strokePath();
    }
    kill(s, g, { alpha: 0 }, life, life * 0.35, 'Quad.in');
  }
  function debris(s, x, gy, th, n, spread, col) {
    n = Math.max(1, Math.round(n * quality()));
    for (let i = 0; i < n; i++) {
      const w = rnd(4, 9), h = rnd(4, 9), c = col != null ? col : pick([th.c[1], th.c[2]]);
      const r = s.add.rectangle(x, gy - 4, w, h, c, 1).setDepth(8.5).setAngle(rnd(0, 90));
      const dx = rnd(-spread, spread), up = rnd(40, 110), dur = rnd(380, 600);
      s.tweens.add({ targets: r, y: gy - 4 - up, duration: dur / 2, yoyo: true, ease: 'Quad.out' });
      s.tweens.add({ targets: r, x: x + dx, angle: r.angle + rnd(-240, 240), alpha: 0.2, duration: dur, ease: 'Linear', onComplete: () => r.destroy() });
    }
  }
  function swirl(s, x, y, col, o = {}) {
    const n = Math.max(1, Math.round((o.n || 4) * (quality() < 1 ? 0.6 : 1)));
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, p = img(s, o.tex || 'fx_glow', x, y, col, 8.6).setScale(o.size || 0.7);
      const r0 = o.r0 == null ? 60 : o.r0, r1 = o.r1 == null ? 6 : o.r1;
      s.tweens.addCounter({
        from: 0, to: 1, duration: o.life || 600, ease: 'Sine.inOut',
        onUpdate: (tw) => {
          const t = tw.getValue(), r = r0 + (r1 - r0) * t, a = a0 + t * (o.turns || 1.2) * PI * 2;
          p.setPosition(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6 - (o.rise || 0) * t).setAlpha(1 - t * 0.7);
        },
        onComplete: () => p.destroy(),
      });
    }
  }
  function ghostOf(s, col, a, ms, o = {}) {
    const pl = s.player;
    const g = s.add.image(pl.x + (o.dx || 0), pl.y + (o.dy || 0), pl.texture.key, pl.frame && pl.frame.name).setFlipX(pl.flipX)
      .setOrigin(pl.originX, pl.originY).setScale(pl.scaleX, pl.scaleY).setTint(col).setAlpha(a).setDepth(3);
    if (o.normal) g.setBlendMode(NORMAL());
    kill(s, g, { alpha: 0, x: g.x + (o.mx || 0), y: g.y + (o.my || 0) }, ms);
    return g;
  }
  const rgbOf = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  function flashCam(s, col, ms) { const [r, g, b] = rgbOf(col); s.cameras.main.flash(ms, r, g, b); }
  function glyph(s, x, y, ch, col, size, life, rise) {
    const t = s.add.text(x, y, ch, { fontSize: size + 'px', color: col }).setOrigin(0.5).setDepth(9).setAlpha(0.95);
    kill(s, t, { y: y - rise, alpha: 0 }, life, 0, 'Quad.out');
  }
  const hex = (c) => '#' + ('000000' + c.toString(16)).slice(-6);

  // ------------------------------------------------------------------ Bộ vẽ theo từng loại kỹ năng
  const R = {};

  // ---- Khoảnh khắc tung chiêu: vầng sáng + trận đồ dưới chân (nhân vật đứng yên nên cần thấy rõ "đã tung")
  R.cast = (s, id, sk, L) => {
    const pl = s.player, gy = pl.body.bottom, c = L.c, ult = !!sk.ult, sup = !!sk.superUlt;
    const type = sk.type;
    const R0 = sup ? 150 : ult ? 105 : 58;
    sigil(s, pl.x, gy - 2, c[1], R0, sup ? 1000 : ult ? 760 : 380);
    glow(s, pl.x, pl.y, c[1], ult ? 3.4 : 1.7, ult ? 520 : 300, { a: ult ? 0.8 : 0.6 });
    burst(s, pl.x, gy - 4, L.th, { n: ult ? 20 : 8, d0: 20, d1: ult ? 120 : 60, life: 560, size: 0.8, grav: -26, a0: -PI, a1: 0 });
    if (ult) {
      pillar(s, pl.x, gy, c[1], sup ? 120 : 80, sup ? 420 : 320, 700);
      runeDisc(s, pl.x, pl.y - 6, c[1], sup ? 120 : 84, 760);
      flashCam(s, c[1], sup ? 260 : 180);
    }
    // Loại đánh ra phía trước: thêm tia tụ lực ở tay
    if (type === 'melee' || type === 'projectile' || type === 'spread' || type === 'dash') {
      glow(s, pl.x + s.facing * 16, pl.y - 2, c[0], 1.1, 240, { a: 0.9 });
    }
  };

  // ---- Cận chiến: mỗi nhát một vệt riêng (nhân vật đứng yên, vệt chém phát ra trước mặt)
  R.melee = (s, id, sk, L, h, n, fin) => {
    const pl = s.player, f = s.facing, c = L.c, y = pl.y, rg = sk.range || 100, big = fin ? 1.5 : 1;
    const px = pl.x, tipx = px + f * rg * 0.85, up = h % 2 === 0;
    switch (L.sig) {
      case 'sweep': {
        arc(s, px - f * 8, y + 8, rg * 0.72 * big, -1.5, 1.5, c[1], 34 * big, 300);
        stream(s, L.th, { x: tipx, y, w: 30, hh: 40, n: 5, dur: 120, dx: f * 60, dy: 0, size: 0.8, life: 340 });
        break;
      }
      case 'whirl': {
        const base = h * 1.15, r = rg * 0.55 * (fin ? 1.25 : 1);
        arc(s, px, y, r, base, base + 2.5, c[1], 26 * big, 280, { abs: true });
        arc(s, px, y, r, base + PI, base + PI + 2.5, c[1], 26 * big, 280, { abs: true });
        ring(s, px, pl.body.bottom - 2, c[1], r * 1.2, { sy: 0.25, life: 360, a: 0.7 });
        stream(s, L.th, { x: px, y: y + 20, w: r * 1.6, hh: 10, n: 4, dur: 100, dy: -50, size: 0.8, life: 400 });
        break;
      }
      case 'thrust': {
        const yo = ((h % 3) - 1) * 16;
        beam(s, px + f * 12, y + yo, px + f * rg, y + yo, c[1], 16 * big, 260);
        beam(s, px + f * 12, y + yo, px + f * rg, y + yo, c[0], 6 * big, 240);
        glow(s, px + f * rg, y + yo, c[0], 1.5 * big, 240);
        ring(s, px + f * rg, y + yo, c[1], 36 * big, { life: 300 });
        burst(s, px + f * rg, y + yo, L.th, { n: 6, d1: 60, life: 300, size: 0.7 });
        break;
      }
      case 'cross': {
        const cx = px + f * rg * 0.6, k = rg * 0.38 * big;
        beam(s, cx - f * k, y - k, cx + f * k, y + k, c[1], 20 * big, 300);
        beam(s, cx - f * k, y + k, cx + f * k, y - k, c[1], 20 * big, 300);
        beam(s, cx - f * k, y - k, cx + f * k, y + k, c[0], 7 * big, 260);
        beam(s, cx - f * k, y + k, cx + f * k, y - k, c[0], 7 * big, 260);
        glow(s, cx, y, c[0], 1.6 * big, 260);
        if (fin) ring(s, cx, y, c[1], 70, { life: 340 });
        break;
      }
      case 'claw': {
        const cx = px + f * rg * 0.55;
        for (let i = -1; i <= 1; i++) {
          beam(s, cx - f * 26, y + i * 20 - 44, cx + f * 40, y + i * 20 + 44, c[1], 12, 320, { delay: Math.abs(i) * 30 });
          beam(s, cx - f * 26, y + i * 20 - 44, cx + f * 40, y + i * 20 + 44, c[0], 4, 280, { delay: Math.abs(i) * 30 });
        }
        burst(s, cx, y, L.th, { n: 8, d1: 50, grav: 40, life: 460, size: 0.8, col: c[1] });
        break;
      }
      case 'bash': {
        arc(s, px + f * 6, y, rg * 0.6 * big, -0.95, 0.95, c[1], 38 * big, 280);
        ring(s, tipx, pl.body.bottom - 4, c[1], 70 * big, { sy: 0.3, life: 380 });
        glow(s, tipx, y, c[0], 1.8 * big, 260);
        debris(s, tipx, pl.body.bottom, L.th, 6, 50);
        break;
      }
      case 'stab': {
        const tx = px + f * rg * rnd(0.45, 0.9), ty = y + rnd(-16, 16), a = rnd(0, PI), l = 46;
        beam(s, tx - Math.cos(a) * l, ty - Math.sin(a) * l, tx + Math.cos(a) * l, ty + Math.sin(a) * l, c[1], 9, 240);
        beam(s, tx - Math.cos(a) * l, ty - Math.sin(a) * l, tx + Math.cos(a) * l, ty + Math.sin(a) * l, c[0], 3, 220);
        beam(s, tx - Math.cos(a + 1.3) * 30, ty - Math.sin(a + 1.3) * 30, tx + Math.cos(a + 1.3) * 30, ty + Math.sin(a + 1.3) * 30, c[1], 6, 200);
        glow(s, tx, ty, c[0], 0.9, 200);
        burst(s, tx, ty, L.th, { n: 5, d1: 40, grav: 30, life: 360, size: 0.7 });
        break;
      }
      default: { // slash
        const a0 = up ? -1.25 : -0.35, a1 = up ? 0.35 : 1.25, jit = ((h % 3) - 1) * 0.12;
        arc(s, px - f * 6, y + 4, rg * 0.7 * big, a0 + jit, a1 + jit, fin ? c[0] : c[1], (fin ? 36 : 24), fin ? 320 : 240);
        burst(s, tipx, y + (up ? -10 : 10), L.th, { n: fin ? 10 : 4, d1: fin ? 80 : 40, life: 320, size: 0.7 });
        if (fin) { ring(s, tipx, y, c[1], 64, { life: 340 }); glow(s, tipx, y, c[0], 1.8, 280); }
      }
    }
  };

  // ---- Lướt: mỗi nhịp (25ms) để lại một dư ảnh; kết thúc có đòn dứt điểm
  R.dashStep = (s, id, sk, L, first) => {
    const pl = s.player, c = L.c;
    switch (L.sig) {
      case 'shadow':
        ghostOf(s, c[2], 0.7, 360, { normal: true }); ghostOf(s, c[1], 0.35, 260);
        burst(s, pl.x, pl.y + 10, L.th, { n: 2, d1: 26, life: 420, size: 1.4, col: c[2], tex: 'fx_dust' });
        break;
      case 'blood':
        ghostOf(s, c[1], 0.5, 300);
        burst(s, pl.x, pl.y, L.th, { n: 2, d1: 30, grav: 50, life: 420, size: 0.9, col: c[1] });
        break;
      case 'charge':
        ghostOf(s, c[1], 0.25, 200);
        burst(s, pl.x - s.facing * 10, pl.body.bottom - 4, L.th, { n: 3, d1: 40, grav: -10, life: 440, size: 1.6, tex: 'fx_dust', col: c[1] });
        if (first) ring(s, pl.x, pl.body.bottom - 3, c[1], 60, { sy: 0.25, life: 360 });
        break;
      case 'dragon':
        ghostOf(s, c[1], 0.4, 300);
        for (let i = 0; i < 2; i++) glow(s, pl.x - s.facing * (6 + i * 10), pl.y + Math.sin(pl.x / 20 + i * 3) * 20, i ? c[2] : c[1], 0.9, 360, { a: 0.8 });
        break;
      default: // streak
        ghostOf(s, c[1], 0.45, 260);
        beam(s, pl.x, pl.y + rnd(-14, 14), pl.x - s.facing * 70, pl.y + rnd(-14, 14), c[0], 3, 220);
    }
  };
  R.dashEnd = (s, id, sk, L, a, b, second) => {
    const pl = s.player, c = L.c, y = pl.y, mid = (a + b) / 2, w = Math.max(40, b - a + 50), x2 = s.facing > 0 ? b : a;
    const line = (col, th, life) => beam(s, a - 10, y, b + 10, y, col, th, life);
    if (second) { line(c[1], 12, 300); line(c[0], 4, 260); return; }
    switch (L.sig) {
      case 'shadow':
        line(c[2], 18, 320); line(c[1], 8, 300); line(c[0], 3, 260);
        beam(s, x2 - 40, y - 40, x2 + 40, y + 40, c[1], 10, 300); beam(s, x2 - 40, y + 40, x2 + 40, y - 40, c[1], 10, 300);
        burst(s, x2, y, L.th, { n: 10, d1: 70, life: 480, size: 1.4, col: c[2], tex: 'fx_dust' });
        break;
      case 'blood':
        line(c[1], 14, 320); line(c[0], 4, 280);
        beam(s, x2 - 36, y - 36, x2 + 36, y + 36, c[1], 8, 300); beam(s, x2 - 36, y + 36, x2 + 36, y - 36, c[0], 4, 300);
        burst(s, x2, y, L.th, { n: 14, d1: 90, grav: 50, life: 520, size: 1, col: c[1] });
        ring(s, x2, y, c[1], 50, { life: 340 });
        break;
      case 'charge':
        ring(s, x2, pl.body.bottom - 3, c[1], 110, { sy: 0.3, life: 460 }); ring(s, x2, pl.body.bottom - 3, c[0], 70, { sy: 0.3, life: 360 });
        debris(s, x2, pl.body.bottom, L.th, 10, 80); glow(s, x2, y, c[0], 2.2, 300);
        break;
      case 'dragon':
        line(c[1], 20, 380); line(c[2], 10, 340); line(c[0], 4, 300);
        ring(s, x2, y, c[2], 90, { life: 460 }); glow(s, x2, y, c[0], 2.4, 340);
        stream(s, L.th, { x: mid, y, w, hh: 20, n: 10, dur: 160, dy: -40, size: 1, life: 460 });
        break;
      default:
        line(c[1], 12, 320); line(c[0], 4, 280);
        ring(s, x2, y, c[1], 56, { life: 340 }); glow(s, x2, y, c[0], 1.6, 260);
        burst(s, x2, y, L.th, { n: 8, d1: 70, life: 380, size: 0.8 });
    }
  };

  // ---- Lùi né: làn khói / gió / dịch chuyển ở chỗ vừa đứng
  R.backstep = (s, id, sk, L) => {
    const pl = s.player, c = L.c, gy = pl.body.bottom;
    switch (L.sig) {
      case 'blink':
        glow(s, pl.x, pl.y, c[1], 2.4, 340); ring(s, pl.x, pl.y, c[1], 60, { life: 360 });
        sigil(s, pl.x, gy - 2, c[1], 50, 420); ghostOf(s, c[1], 0.6, 380);
        burst(s, pl.x, pl.y, L.th, { n: 12, d1: 70, life: 460, size: 0.9 });
        break;
      case 'hop':
        ring(s, pl.x, gy - 3, c[1], 70, { sy: 0.25, life: 360 }); ghostOf(s, c[1], 0.4, 300);
        stream(s, L.th, { x: pl.x, y: gy - 6, w: 40, n: 8, dur: 120, dy: -30, dx: -s.facing * 40, size: 1, life: 420 });
        break;
      default:
        burst(s, pl.x, pl.y + 6, L.th, { n: 14, d1: 70, life: 560, size: 1.8, col: c[2], tex: 'fx_dust' });
        ghostOf(s, c[2], 0.6, 320, { normal: true }); ring(s, pl.x, gy - 3, c[2], 56, { sy: 0.25, life: 360 });
    }
  };

  // ---- Vùng quanh người / tại một điểm: s.sfx('aoe', id, sk, cx, cy, radius, groundY)
  R.aoe = (s, id, sk, L, cx, cy, rad, gy) => {
    const c = L.c, th = L.th;
    cx = cx == null ? s.player.x : cx; cy = cy == null ? s.player.y : cy; rad = rad || sk.radius || 200; gy = gy == null ? s.player.body.bottom : gy;
    const rays = (n, col, w, life, len) => { for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2 + rnd(-0.1, 0.1); beam(s, cx, cy, cx + Math.cos(a) * (len || rad), cy + Math.sin(a) * (len || rad), col, w, life); } };
    switch (L.sig) {
      case 'frost': case 'blizzard': {
        const big = L.sig === 'blizzard';
        ring(s, cx, gy - 2, c[1], rad, { sy: 0.28, life: 560 }); ring(s, cx, cy, c[0], rad * 0.8, { life: 460 });
        const sheet = img(s, 'fx_glow', cx, gy - 4, c[2], 1.7).setScale(rad / 14, 1.6).setAlpha(0.5);
        kill(s, sheet, { alpha: 0 }, 1000, 250);
        const m = Math.max(5, Math.round((rad / (big ? 22 : 30)) * quality()));
        for (let i = 0; i < m; i++) {
          const x = cx + rnd(-rad, rad) * 0.95, len = rnd(46, big ? 120 : 96) / 24, sp = img(s, 'fx_shard', x, gy, i % 3 ? c[1] : c[0], 8.3).setOrigin(0, 0.5).setRotation(-PI / 2 + rnd(-0.25, 0.25)).setScale(0.05, rnd(1.1, 1.8));
          s.tweens.add({ targets: sp, scaleX: len, duration: 160, delay: i * 18, ease: 'Back.out' });
          s.tweens.add({ targets: sp, alpha: 0, duration: 420, delay: 420 + i * 12, onComplete: () => sp.destroy() });
        }
        stream(s, th, { x: cx, y: cy - 90, w: rad * 2, n: big ? 36 : 20, dur: 420, dy: 150, size: 1, life: 800 });
        if (big) burst(s, cx, cy, th, { n: 22, d0: rad * 0.3, d1: rad, rot: true, tex: 'fx_shard', size: 1, life: 560 });
        break;
      }
      case 'quake': {
        cracks(s, cx, gy, c[1], rad, 760); cracks(s, cx, gy, c[0], rad * 0.7, 600);
        for (let i = 0; i < 3; i++) later(s, i * 90, () => ring(s, cx, gy - 3, i ? c[2] : c[1], rad * (0.7 + i * 0.2), { sy: 0.22, life: 420 + i * 60 }));
        debris(s, cx, gy, th, Math.round(rad / 22), rad * 0.8);
        burst(s, cx, gy - 6, th, { n: 14, d0: 20, d1: rad * 0.8, a0: -PI, a1: 0, size: 1.8, tex: 'fx_dust', col: c[2], life: 640 });
        glow(s, cx, gy - 10, c[0], rad / 40, 360, { a: 0.6 });
        break;
      }
      case 'vortex': {
        for (let j = 0; j < 5; j++) later(s, j * 60, () => arc(s, cx, cy, rad * (0.3 + 0.13 * j), j * 1.25, j * 1.25 + 2.6, j % 2 ? c[1] : c[0], 24, 300, { abs: true }));
        ring(s, cx, gy - 3, c[1], rad, { sy: 0.25, life: 480 });
        swirl(s, cx, cy, c[1], { n: 6, r0: rad * 0.9, r1: 10, turns: 1.6, life: 520, size: 0.8 });
        break;
      }
      case 'flame': {
        ring(s, cx, gy - 3, c[1], rad, { sy: 0.25, life: 520 });
        const m = Math.max(4, Math.round((rad / 34) * quality()));
        for (let i = 0; i < m; i++) {
          const x = cx + (i / (m - 1) - 0.5) * rad * 1.9, fl = img(s, 'fx_flame', x, gy, pick([c[1], c[2], c[0]]), 8.2).setOrigin(0.5, 1).setScale(0.3, 0.1);
          const sc = rnd(2.4, 3.8);
          s.tweens.add({ targets: fl, scaleX: sc * 0.8, scaleY: sc, duration: 200, delay: i * 40, ease: 'Back.out' });
          s.tweens.add({ targets: fl, alpha: 0, scaleY: sc * 1.3, duration: 460, delay: 380 + i * 40, onComplete: () => fl.destroy() });
        }
        stream(s, th, { x: cx, y: gy - 10, w: rad * 1.8, n: 22, dur: 500, dy: -120, size: 1.2, life: 700 });
        glow(s, cx, gy - 20, c[2], rad / 22, 520, { a: 0.5 });
        break;
      }
      case 'drain': {
        ring(s, cx, cy, c[2], 8, { r0: rad, life: 520, a: 0.9 }); ring(s, cx, cy, c[1], 10, { r0: rad * 0.6, life: 420 });
        for (let i = 0; i < 12; i++) {
          const a = rnd(0, PI * 2), p = img(s, 'fx_drop', cx + Math.cos(a) * rad * rnd(0.6, 1), cy + Math.sin(a) * rad * 0.5, pick([c[1], c[0]]), 8.6).setScale(1.2);
          p.setRotation(a + PI / 2);
          kill(s, p, { x: cx, y: cy, alpha: 0.2, scale: 0.3 }, rnd(380, 560), i * 18, 'Quad.in');
        }
        later(s, 460, () => { glow(s, cx, cy, c[1], 2.4, 320); ring(s, cx, cy, c[1], 60, { life: 320 }); });
        break;
      }
      case 'miasma': {
        ring(s, cx, gy - 3, c[1], rad, { sy: 0.28, life: 600 });
        const m = Math.max(4, Math.round(8 * quality()));
        for (let i = 0; i < m; i++) {
          const col = i % 2 ? c[1] : c[2], p = img(s, 'fx_dust', cx + rnd(-rad, rad) * 0.3, gy - 10, col, 8.2, NORMAL()).setScale(rnd(3, 5)).setAlpha(0.5);
          kill(s, p, { x: cx + rnd(-rad, rad) * 0.9, y: gy - rnd(20, 70), alpha: 0, scale: 6.5 }, rnd(640, 900), i * 30, 'Sine.out');
        }
        for (let i = 0; i < 4; i++) later(s, i * 70, () => glyph(s, cx + rnd(-rad, rad) * 0.7, gy - 10, '☠', hex(c[1]), 20, 800, 90));
        break;
      }
      case 'roar': {
        for (let i = 0; i < 4; i++) later(s, i * 80, () => ring(s, cx, cy, i % 2 ? c[1] : c[0], rad * (0.55 + i * 0.15), { life: 400 }));
        for (const d of [-1, 1]) for (let i = 0; i < 4; i++) beam(s, cx + d * 20, cy - 36 + i * 24, cx + d * rad, cy - 36 + i * 24, c[1], 5, 360, { delay: i * 30 });
        burst(s, cx, gy - 6, th, { n: 10, d1: rad * 0.7, a0: -PI, a1: 0, size: 1.6, tex: 'fx_dust', col: c[1], life: 520 });
        break;
      }
      case 'garden': {
        sigil(s, cx, gy - 2, c[1], rad, 1100); ring(s, cx, gy - 3, c[1], rad, { sy: 0.28, life: 700 });
        stream(s, th, { x: cx, y: gy - 6, w: rad * 1.7, n: 30, dur: 700, dy: -130, size: 1.3, life: 900 });
        stream(s, { c: [0xffffff, 0xfff59d, 0xffd54f], tex: 'fx_star' }, { x: cx, y: gy - 20, w: rad * 1.4, n: 12, dur: 700, dy: -90, size: 0.8, life: 900 });
        glow(s, cx, gy - 10, c[1], rad / 22, 600, { a: 0.4 });
        break;
      }
      case 'blades': {
        ring(s, cx, gy - 3, c[1], rad, { sy: 0.25, life: 520 });
        const m = Math.max(5, Math.round(10 * quality()));
        for (let i = 0; i < m; i++) {
          const x = cx + rnd(-rad, rad) * 0.95, sw = img(s, 'fx_lance', x, gy - 360, i % 3 ? c[1] : c[0], 8.3).setRotation(PI / 2).setScale(0.55, 0.8);
          s.tweens.add({ targets: sw, y: gy - 8, duration: 230, delay: i * 45, ease: 'Quad.in', onComplete: () => { burst(s, x, gy - 8, th, { n: 4, d1: 40, size: 0.7, life: 300 }); ring(s, x, gy - 6, c[1], 26, { sy: 0.4, life: 260 }); kill(s, sw, { alpha: 0 }, 420, 220); } });
        }
        break;
      }
      case 'trap': {
        sigil(s, cx, gy - 2, c[1], rad, 900); ring(s, cx, gy - 3, c[1], rad, { sy: 0.28, life: 600 });
        const m = 6;
        for (let i = 0; i < m; i++) later(s, i * 70, () => { const x = cx + (i / (m - 1) - 0.5) * rad * 1.8; pillar(s, x, gy, c[1], 34, rnd(110, 190), 520); glow(s, x, gy - 14, c[0], 0.9, 280); });
        later(s, 300, () => glow(s, cx, gy - 20, c[0], rad / 16, 340, { a: 0.7 }));
        break;
      }
      case 'chain': {
        const pts = [[cx, cy]];
        for (let i = 0; i < 4; i++) pts.push([cx + rnd(-rad, rad) * 0.9, cy + rnd(-30, 30)]);
        pts.forEach((p, i) => later(s, i * 110, () => {
          glow(s, p[0], p[1], c[1], 2, 320); ring(s, p[0], p[1], i % 2 ? c[1] : c[0], 60, { life: 360 });
          burst(s, p[0], p[1], th, { n: 8, d1: 60, life: 420, size: 1 });
          if (i) bolt(s, pts[i - 1][0], pts[i - 1][1], p[0], p[1], th, { jag: 14, w: 4, life: 300 });
        }));
        break;
      }
      case 'veil': {
        const dome = img(s, 'fx_glow', cx, cy, c[2], 8, NORMAL()).setScale(rad / 40).setAlpha(0.7);
        kill(s, dome, { scale: rad / 13, alpha: 0 }, 700);
        burst(s, cx, cy, th, { n: 16, d0: rad * 0.3, d1: rad * 0.9, size: 1.8, tex: 'fx_dust', col: c[2], life: 700 });
        ring(s, cx, gy - 3, c[1], rad, { sy: 0.25, life: 500 });
        const m = Math.max(5, Math.round(9 * quality()));
        for (let i = 0; i < m; i++) later(s, 80 + i * 45, () => {
          const x = cx + rnd(-rad, rad) * 0.85, y = cy + rnd(-40, 30), a = rnd(-0.9, 0.9) + PI / 2.6, l = rnd(50, 90);
          beam(s, x - Math.cos(a) * l, y - Math.sin(a) * l, x + Math.cos(a) * l, y + Math.sin(a) * l, i % 2 ? c[1] : c[0], 7, 220);
        });
        break;
      }
      case 'judge': {
        pillar(s, cx, gy, c[1], rad * 0.6, 460, 700); pillar(s, cx, gy, c[0], rad * 0.3, 460, 560);
        sigil(s, cx, gy - 2, c[1], rad, 900); ring(s, cx, gy - 3, c[0], rad, { sy: 0.28, life: 600 });
        glow(s, cx, gy - 30, c[0], rad / 14, 520, { a: 0.8 });
        for (let i = 0; i < 6; i++) later(s, i * 60, () => beam(s, cx + rnd(-rad, rad) * 0.5, gy - 420, cx + rnd(-rad, rad) * 0.9, gy, c[1], 6, 260));
        stream(s, th, { x: cx, y: gy - 20, w: rad * 1.5, n: 20, dur: 600, dy: -140, size: 1, life: 800 });
        break;
      }
      case 'dawn': {
        glow(s, cx, cy, c[1], rad / 8, 640, { a: 0.55 }); glow(s, cx, cy, c[0], rad / 14, 520, { a: 0.8 });
        for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; beam(s, cx + Math.cos(a) * 24, cy + Math.sin(a) * 24, cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, i % 2 ? c[1] : c[0], i % 2 ? 7 : 12, 560); }
        ring(s, cx, cy, c[0], rad, { life: 560 }); ring(s, cx, gy - 3, c[1], rad, { sy: 0.25, life: 600 });
        stream(s, th, { x: cx, y: cy, w: rad * 1.6, hh: 30, n: 22, dur: 500, dy: -80, size: 1.1, life: 800 });
        break;
      }
      case 'elem': {
        const els = [TH.fire, TH.ice, TH.bolt];
        els.forEach((e, i) => {
          const a0 = (i / 3) * PI * 2, orb = img(s, 'fx_orb', cx, cy, e.c[1], 8.7).setScale(0.9);
          s.tweens.addCounter({ from: 0, to: 1, duration: 420, ease: 'Sine.in', onUpdate: (tw) => { const t = tw.getValue(), r = rad * 0.9 * (1 - t), a = a0 + t * 4; orb.setPosition(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.7); }, onComplete: () => orb.destroy() });
        });
        later(s, 430, () => {
          els.forEach((e, i) => { ring(s, cx, cy, e.c[1], rad * (0.55 + i * 0.22), { life: 480 }); burst(s, cx, cy, e, { n: 10, d0: rad * 0.3, d1: rad * 0.95, life: 520, size: 1 }); });
          glow(s, cx, cy, 0xffffff, rad / 12, 380, { a: 0.8 });
        });
        break;
      }
      default: { // nova
        glow(s, cx, cy, c[1], rad / 10, 460, { a: 0.55 }); glow(s, cx, cy, c[0], rad / 18, 360, { a: 0.9 });
        ring(s, cx, cy, c[1], rad, { life: 520 }); ring(s, cx, cy, c[0], rad * 0.7, { life: 420 });
        ring(s, cx, gy - 3, c[1], rad, { sy: 0.25, life: 560 });
        rays(10, c[1], 8, 380);
        burst(s, cx, cy, th, { n: 22, d0: rad * 0.3, d1: rad * 0.95, life: 560, size: 1 });
      }
    }
  };

  // ---- Hồi phục
  R.heal = (s, id, sk, L) => {
    const pl = s.player, c = L.c, th = L.th, gy = pl.body.bottom, x = pl.x, y = pl.y;
    switch (L.sig) {
      case 'cross':
        stream(s, th, { x, y: gy - 10, w: 50, n: 10, dur: 520, dy: -80, tex: 'fx_cross', size: 1, col: c[1], life: 800 });
        ring(s, x, gy - 3, c[1], 56, { sy: 0.3, life: 520 }); glow(s, x, y, c[1], 2.2, 460, { a: 0.5 });
        break;
      case 'holy':
        pillar(s, x, gy, c[1], 70, 300, 640); pillar(s, x, gy, c[0], 30, 300, 520);
        ring(s, x, gy - 3, c[1], 60, { sy: 0.3, life: 520 }); glow(s, x, y, c[0], 2.6, 480);
        stream(s, th, { x, y: gy, w: 50, n: 14, dur: 520, dy: -110, size: 1, life: 800 });
        break;
      case 'moon':
        ring(s, x, y, c[1], 64, { life: 520 }); ring(s, x, gy - 3, c[1], 58, { sy: 0.3, life: 520 });
        swirl(s, x, y, c[1], { n: 5, r0: 50, r1: 8, rise: 30, turns: 1, life: 640, size: 0.8 });
        stream(s, { c: c, tex: 'fx_star' }, { x, y: gy, w: 40, n: 8, dur: 480, dy: -90, size: 0.9, life: 800 });
        break;
      case 'drop':
        stream(s, th, { x, y: y - 90, w: 70, n: 16, dur: 480, dy: 100, size: 1.2, life: 560 });
        for (let i = 0; i < 3; i++) later(s, 200 + i * 130, () => ring(s, x + rnd(-14, 14), gy - 3, c[1], 40, { sy: 0.3, life: 420 }));
        glow(s, x, y, c[1], 2, 480, { a: 0.5 });
        break;
      case 'dawn':
        glow(s, x, gy - 6, c[1], 3.2, 640, { a: 0.7 });
        for (let i = 0; i < 9; i++) { const a = -PI + (i / 8) * PI; beam(s, x, gy - 6, x + Math.cos(a) * 110, gy - 6 + Math.sin(a) * 110, i % 2 ? c[1] : c[0], 8, 560); }
        stream(s, th, { x, y: gy, w: 60, n: 12, dur: 500, dy: -100, size: 1, life: 800 });
        break;
      case 'garden':
        sigil(s, x, gy - 2, c[1], 96, 1000); ring(s, x, gy - 3, c[1], 96, { sy: 0.28, life: 640 });
        stream(s, th, { x, y: gy - 6, w: 120, n: 22, dur: 600, dy: -120, size: 1.3, life: 900 });
        break;
      case 'phoenix':
        for (const sg of [-1, 1]) arc(s, x, y + 6, 70, sg > 0 ? -1.5 : PI + 0.1, sg > 0 ? 0.1 : PI + 1.6, c[1], 34, 620, { abs: true, grow: 1.3 });
        pillar(s, x, gy, c[1], 70, 340, 720); glow(s, x, y, c[0], 3, 600);
        stream(s, { c: c, tex: 'fx_feather' }, { x, y: gy, w: 60, n: 16, dur: 560, dy: -120, size: 1.2, life: 900 });
        ring(s, x, gy - 3, c[1], 80, { sy: 0.3, life: 600 });
        break;
      default: // spirit
        swirl(s, x, y, c[1], { n: 5, r0: 56, r1: 6, rise: 40, turns: 1.2, life: 680, size: 0.9 });
        ring(s, x, gy - 3, c[1], 56, { sy: 0.3, life: 520 }); glow(s, x, y, c[1], 2, 480, { a: 0.5 });
    }
  };

  // ---- Tăng cường (buff)
  R.buff = (s, id, sk, L) => {
    const pl = s.player, c = L.c, th = L.th, gy = pl.body.bottom, x = pl.x, y = pl.y;
    switch (L.sig) {
      case 'rage':
        for (let i = 0; i < 14; i++) later(s, i * 36, () => {
          const px = x + rnd(-22, 22), fl = img(s, 'fx_flame', px, gy, pick([c[1], c[2], c[0]]), 8.3).setOrigin(0.5, 1).setScale(rnd(0.9, 1.4), rnd(1, 1.6)).setAlpha(0.9);
          kill(s, fl, { y: gy - rnd(50, 90), alpha: 0, scaleY: 2.4, scaleX: 0.4 }, 560);
        });
        ring(s, x, gy - 3, c[1], 64, { sy: 0.3, life: 460 }); ring(s, x, gy - 3, c[2], 90, { sy: 0.3, life: 560 });
        glow(s, x, y, c[2], 2.6, 520, { a: 0.5 });
        break;
      case 'eye':
        ring(s, x, y, c[1], 8, { r0: 110, life: 520 }); ring(s, x, y, c[0], 8, { r0: 70, life: 420 });
        for (const a of [0, PI / 2, PI, -PI / 2]) beam(s, x + Math.cos(a) * 110, y + Math.sin(a) * 110, x + Math.cos(a) * 30, y + Math.sin(a) * 30, c[1], 4, 420);
        later(s, 120, () => {
          const g = s.add.graphics({ x, y: y - 62 }).setDepth(9).setBlendMode(ADD());
          g.lineStyle(3, c[1], 1); g.beginPath(); g.moveTo(-18, 0); g.lineTo(-6, -8); g.lineTo(6, -8); g.lineTo(18, 0); g.lineTo(6, 8); g.lineTo(-6, 8); g.closePath(); g.strokePath();
          g.fillStyle(c[0], 1); g.fillCircle(0, 0, 4.5);
          kill(s, g, { alpha: 0, y: y - 80 }, 700, 100);
        });
        stream(s, th, { x, y: y - 20, w: 40, n: 8, dur: 400, dy: -70, size: 1, life: 700 });
        break;
      case 'rune':
        runeDisc(s, x, y, c[1], 78, 900, { spin: 240 }); sigil(s, x, gy - 2, c[1], 64, 800);
        stream(s, th, { x, y: gy, w: 50, n: 12, dur: 500, dy: -90, size: 1, life: 800 });
        glow(s, x, y, c[1], 2.4, 520, { a: 0.5 });
        break;
      case 'bless':
        pillar(s, x, gy, c[1], 84, 330, 800, { a: 0.5 }); glow(s, x, y, c[0], 2.4, 560, { a: 0.6 });
        stream(s, th, { x, y: y - 100, w: 70, n: 20, dur: 600, dy: 130, size: 1, life: 800 });
        ring(s, x, gy - 3, c[1], 60, { sy: 0.3, life: 560 });
        break;
      case 'clones':
        for (const d of [-1, 1]) for (let i = 1; i <= 2; i++) later(s, i * 60, () => {
          ghostOf(s, c[2], 0.6, 600, { dx: d * i * 8, mx: d * i * 38, normal: true }); ghostOf(s, c[1], 0.3, 520, { dx: d * i * 8, mx: d * i * 38 });
        });
        burst(s, x, y + 6, th, { n: 14, d1: 70, life: 520, size: 1.5, col: c[2], tex: 'fx_dust' });
        break;
      case 'wings':
        for (const sg of [-1, 1]) arc(s, x, y + 4, 56, sg > 0 ? -1.4 : PI + 0.2, sg > 0 ? 0.2 : PI + 1.6, c[1], 28, 600, { abs: true, grow: 1.25 });
        stream(s, { c: c, tex: 'fx_feather' }, { x, y: y - 20, w: 90, n: 14, dur: 420, dy: 70, size: 1.1, life: 800 });
        glow(s, x, y, c[0], 2.4, 520, { a: 0.6 });
        break;
      case 'spirit':
        swirl(s, x, y, c[1], { n: 5, r0: 62, r1: 10, rise: 50, turns: 1.1, life: 720, size: 1 });
        for (let i = 0; i < 3; i++) { const gh = img(s, 'fx_glow', x + (i - 1) * 26, gy - 10, c[1], 8.2).setScale(0.9, 2.2).setAlpha(0.6); kill(s, gh, { y: gy - 70, alpha: 0 }, 700, i * 90); }
        ring(s, x, gy - 3, c[1], 60, { sy: 0.3, life: 520 });
        break;
      case 'bloodlust':
        glow(s, x, y, c[1], 3.2, 560, { a: 0.5 }); ring(s, x, gy - 3, c[1], 70, { sy: 0.3, life: 520 }); ring(s, x, gy - 3, c[2], 100, { sy: 0.3, life: 620 });
        stream(s, th, { x, y: gy, w: 40, n: 12, dur: 460, dy: -80, size: 1.1, col: c[1], life: 700 });
        for (const d of [-5, 5]) later(s, 140, () => glow(s, x + d, y - 22, c[1], 0.9, 520, { a: 1 }));
        break;
      case 'awaken':
        pillar(s, x, gy, c[1], 80, 380, 860); pillar(s, x, gy, c[0], 34, 380, 700);
        sigil(s, x, gy - 2, c[1], 124, 1000); runeDisc(s, x, y, c[1], 92, 900);
        ring(s, x, gy - 3, c[1], 150, { sy: 0.3, life: 700 }); ring(s, x, y, c[0], 110, { life: 520 });
        for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; beam(s, x, y, x + Math.cos(a) * 120, y + Math.sin(a) * 120, i % 2 ? c[1] : c[0], 6, 420); }
        stream(s, th, { x, y: gy, w: 60, n: 24, dur: 700, dy: -160, size: 1.2, life: 900 });
        break;
      default: { // orbit: kiếm lơ lửng xoay quanh người
        const n = 4;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * PI * 2, sw = img(s, 'fx_dagger', x, y, c[1], 8.6).setScale(1.3);
          s.tweens.addCounter({
            from: 0, to: 1, duration: 1000, ease: 'Sine.inOut',
            onUpdate: (tw) => { const t = tw.getValue(), a = a0 + t * PI * 3; sw.setPosition(pl.x + Math.cos(a) * 44, pl.y + Math.sin(a) * 26).setRotation(a + PI / 2).setAlpha(t < 0.8 ? 1 : 1 - (t - 0.8) * 5); },
            onComplete: () => sw.destroy(),
          });
        }
        ring(s, x, gy - 3, c[1], 56, { sy: 0.3, life: 520 }); glow(s, x, y, c[1], 2, 480, { a: 0.5 });
      }
    }
  };

  // ---- Thủ thế / khiên
  R.guard = (s, id, sk, L) => {
    const pl = s.player, c = L.c, th = L.th, gy = pl.body.bottom, x = pl.x, y = pl.y, f = s.facing;
    switch (L.sig) {
      case 'counter':
        for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2, b = img(s, 'fx_lance', x + Math.cos(a) * 14, y + Math.sin(a) * 14, i % 2 ? c[1] : c[0], 8.5).setRotation(a).setScale(0.4); kill(s, b, { x: x + Math.cos(a) * 66, y: y + Math.sin(a) * 66, alpha: 0 }, 420, i * 12, 'Cubic.out'); }
        ring(s, x, y, c[1], 70, { life: 420 }); glow(s, x, y, c[0], 1.8, 320);
        break;
      case 'fortress': {
        const m = 7;
        for (let i = 0; i < m; i++) {
          const dx = (i - (m - 1) / 2) * 16, h = rnd(46, 78), r = s.add.rectangle(x + dx, gy, rnd(12, 20), h, i % 2 ? c[2] : c[1], 0.85).setOrigin(0.5, 1).setDepth(7.8).setScale(1, 0.05);
          s.tweens.add({ targets: r, scaleY: 1, duration: 200, delay: i * 25, ease: 'Back.out' });
          s.tweens.add({ targets: r, alpha: 0, duration: 520, delay: 700 + i * 20, onComplete: () => r.destroy() });
        }
        ring(s, x, gy - 3, c[1], 80, { sy: 0.28, life: 480 }); debris(s, x, gy, th, 8, 70);
        break;
      }
      case 'thorn':
        for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2, sp = img(s, 'fx_shard', x, y, i % 2 ? c[1] : c[0], 8.4).setRotation(a).setScale(0.3, 1.2); kill(s, sp, { x: x + Math.cos(a) * 44, y: y + Math.sin(a) * 44, scaleX: 1.8, alpha: 0 }, 460, 0, 'Cubic.out'); }
        ring(s, x, y, c[1], 66, { life: 420 });
        break;
      case 'cloak':
        burst(s, x, y + 4, th, { n: 16, d1: 60, life: 640, size: 1.8, col: c[2], tex: 'fx_dust' });
        glow(s, x, y, c[2], 3, 560, { a: 0.7, blend: NORMAL() }); ring(s, x, gy - 3, c[1], 60, { sy: 0.3, life: 520 });
        break;
      case 'angel':
        for (const sg of [-1, 1]) arc(s, x, y + 2, 54, sg > 0 ? -1.4 : PI + 0.2, sg > 0 ? 0.2 : PI + 1.6, c[1], 28, 640, { abs: true, grow: 1.25 });
        later(s, 60, () => { const g = s.add.graphics().setDepth(9).setBlendMode(ADD()); g.lineStyle(3, c[0], 1).strokeEllipse(x, y - 44, 26, 8); kill(s, g, { alpha: 0 }, 700); });
        stream(s, { c: c, tex: 'fx_feather' }, { x, y: y - 10, w: 80, n: 10, dur: 400, dy: 60, size: 1.1, life: 800 });
        break;
      case 'spirit':
        swirl(s, x, y, c[1], { n: 5, r0: 46, r1: 46, turns: 1.4, life: 800, size: 1 }); ring(s, x, y, c[1], 62, { life: 480 });
        break;
      case 'dome': {
        const g = s.add.graphics({ x, y }).setDepth(8).setBlendMode(ADD());
        g.fillStyle(c[1], 0.12).fillCircle(0, 0, 66); g.lineStyle(3, c[1], 0.9).strokeCircle(0, 0, 66); g.lineStyle(2, c[0], 0.8);
        for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2, hx = Math.cos(a) * 36, hy = Math.sin(a) * 36; g.beginPath(); for (let k = 0; k < 6; k++) { const b = (k / 6) * PI * 2 + PI / 6; (k ? g.lineTo : g.moveTo).call(g, hx + Math.cos(b) * 18, hy + Math.sin(b) * 18); } g.closePath(); g.strokePath(); }
        g.setScale(0.5); s.tweens.add({ targets: g, scale: 1, duration: 220, ease: 'Back.out' }); kill(s, g, { alpha: 0 }, 480, 520);
        ring(s, x, gy - 3, c[1], 76, { sy: 0.28, life: 500 });
        break;
      }
      default: { // shield: tấm khiên hiện ra trước người
        const g = s.add.graphics({ x: x + f * 34, y }).setDepth(8.4).setBlendMode(ADD());
        const pts = [[0, -34], [24, -22], [20, 14], [0, 34], [-20, 14], [-24, -22]];
        const path = () => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
        g.fillStyle(c[1], 0.3); path(); g.fillPath(); g.lineStyle(3, c[0], 1); path(); g.strokePath();
        g.fillStyle(c[0], 0.55); g.fillRect(-2.5, -24, 5, 46); g.fillRect(-14, -6, 28, 5);
        g.setScale(0.4); s.tweens.add({ targets: g, scale: 1, duration: 200, ease: 'Back.out' }); kill(s, g, { alpha: 0, x: g.x + f * 10 }, 520, 560);
        ring(s, x, y, c[1], 66, { life: 420 }); burst(s, x + f * 34, y, th, { n: 8, d1: 50, life: 360, size: 0.8 });
      }
    }
  };

  // ---- Khiên năng lượng
  R.shield = (s, id, sk, L) => {
    const pl = s.player, c = L.c, th = L.th, x = pl.x, y = pl.y, gy = pl.body.bottom;
    ring(s, x, y, c[1], 56, { life: 460 });
    switch (L.sig) {
      case 'holy':
        glow(s, x, y, c[1], 3.4, 600, { a: 0.5 }); ring(s, x, y, c[0], 66, { life: 560 });
        stream(s, th, { x, y: gy, w: 50, n: 10, dur: 440, dy: -80, size: 1, life: 760 });
        break;
      case 'soul':
        swirl(s, x, y, c[1], { n: 6, r0: 48, r1: 48, turns: 1.2, life: 760, size: 0.9 }); glow(s, x, y, c[1], 2.8, 560, { a: 0.4 });
        break;
      default: // crystal
        for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2, sh = img(s, 'fx_shard', x + Math.cos(a) * 12, y + Math.sin(a) * 12, i % 2 ? c[1] : c[0], 8.5).setRotation(a).setScale(1.4); s.tweens.add({ targets: sh, x: x + Math.cos(a) * 48, y: y + Math.sin(a) * 48, duration: 220, ease: 'Back.out' }); kill(s, sh, { alpha: 0 }, 480, 560); }
        glow(s, x, y, c[1], 2.8, 560, { a: 0.4 });
    }
  };

  // ---- Triệu hồi / gọi bóng
  // ---- Vật thể xoay quanh người suốt thời gian buff (gắn thẳng vào bảng this.buffs nên hết buff là biến mất)
  // atk = tăng công / chí mạng / tốc đánh · def = giảm sát thương / khiên · heal = hồi dần
  // rot: góc gốc của hình (hình vẽ mũi hướng phải nên cần xoay -90° để dựng đứng); mode: 'up' giữ nguyên, 'spin' tự xoay
  const SCHOOL_AURA = {
    kiem_si:   { atk: { tex: 'fx_sword_v', n: 5, sc: 1.0 }, def: { tex: 'fx_roundshield', n: 4, sc: 0.95 } },
    cung_thu:  { atk: { tex: 'fx_lance', n: 5, sc: 0.42, rot: -PI / 2 }, def: { tex: 'fx_feather', n: 6, sc: 1.5, mode: 'spin' } },
    phap_su:   { atk: { tex: 'fx_orb', n: 5, sc: 0.6, mix: [TH.fire, TH.ice, TH.bolt] }, def: { tex: 'fx_shard', n: 6, sc: 1.4, rot: -PI / 2 } },
    toan_nang: { atk: { tex: 'fx_star', n: 5, sc: 0.85, mode: 'spin', mix: [TH.fire, TH.holy, TH.ice, TH.arcane, TH.heal] }, def: { tex: 'fx_disc', n: 4, sc: 0.75, mode: 'spin' } },
    sat_thu:   { atk: { tex: 'fx_dagger', n: 5, sc: 1.15, rot: -PI / 2 }, def: { tex: 'fx_dust', n: 7, sc: 2.2, normal: true, col: 2 } },
    tanker:    { atk: { tex: 'fx_hammer', n: 4, sc: 0.34, normal: true }, def: { tex: 'fx_roundshield', n: 4, sc: 1.3, rx: 1.1 } },
    tri_lieu_su: { atk: { tex: 'fx_star', n: 5, sc: 0.85, mode: 'spin' }, def: { tex: 'fx_feather', n: 6, sc: 1.5, mode: 'spin', halo: true } },
    trieu_hoi_su: { atk: { tex: 'fx_orb', n: 5, sc: 0.6 }, def: { tex: 'fx_bird', n: 3, sc: 0.65 } },
    tu_linh_thuat_su: { atk: { tex: 'fx_skull', n: 5, sc: 0.8 }, def: { tex: 'fx_skull', n: 4, sc: 0.6, col: 2 } },
  };
  const HEAL_AURA = { tex: 'fx_cross', n: 4, sc: 0.9 };

  R.aura = (s, id, sk, L) => {
    const b = s.buffs && s.buffs[id];
    if (!b) return;
    const atk = !!(b.atk || b.crit || b.speed || b.exec);
    const def = b.name === 'guard' || b.name === 'manashield' || !!b.reduce || !!b.absorb;
    const heal = !!b.regen && !atk && !def;
    if (!atk && !def && !heal) return;
    let school = sk.school;
    if (!school || !SCHOOL_AURA[school]) school = (App.player && SCHOOL_AURA[App.player.school] && App.player.school) || 'toan_nang';
    const SA = SCHOOL_AURA[school], th = L.th, c = L.c;
    s._auras = s._auras || {};
    if (s._auras[id]) sfxAuraKill(s._auras[id]);
    const rings = [];
    const both = atk && def;
    if (atk) rings.push({ ...SA.atk, rx: both ? 36 : 44, ry: both ? 12 : 15, dy: -4, spd: 1.6, dir: 1 });
    if (def) rings.push({ ...SA.def, rx: (both ? 62 : 52) * (SA.def.rx || 1), ry: both ? 20 : 17, dy: 2, spd: 1.1, dir: both ? -1 : 1 });
    if (heal) rings.push({ ...HEAL_AURA, rx: 46, ry: 15, dy: -4, spd: 1.2, dir: 1, col: 1 });
    const a = { t0: s.time.now + 320, items: [], rings, sig: null, fixed: [] };
    s._auras[id] = a;
    later(s, 320, () => {
      if (s._auras[id] !== a) return;
      for (const g of rings) {
        g.list = [];
        for (let i = 0; i < g.n; i++) {
          const col = g.mix ? g.mix[i % g.mix.length].c[1] : c[g.col == null ? 1 : g.col];
          const it = s.add.image(s.player.x, s.player.y, g.tex).setTint(col).setBlendMode(g.normal ? NORMAL() : ADD()).setScale(0.01).setDepth(4.5);
          g.list.push(it); a.items.push(it);
        }
      }
      // Vòng sáng trên đầu (Trị Liệu Sư) và trận đồ mờ dưới chân suốt thời gian buff
      if (def && SA.def.halo) { const h = s.add.image(s.player.x, s.player.y - 36, 'fx_ring').setTint(c[1]).setBlendMode(ADD()).setScale(0.01).setDepth(4.6); a.halo = h; a.items.push(h); }
      const sg = s.add.image(s.player.x, s.player.body.bottom - 2, 'fx_sigil').setTint(c[1]).setBlendMode(ADD()).setScale(0.01).setDepth(1.6);
      a.sig = sg; a.items.push(sg); a.sigR = both ? 70 : 56;
    });
  };
  function sfxAuraKill(a) { for (const it of a.items) if (it && it.active) it.destroy(); a.dead = true; }

  R.summon = (s, id, sk, L) => {
    const pl = s.player, c = L.c, th = L.th, gy = pl.body.bottom;
    sigil(s, pl.x, gy - 2, c[1], 78, 900); pillar(s, pl.x, gy, c[1], 60, 260, 640);
    stream(s, th, { x: pl.x, y: gy, w: 60, n: 14, dur: 500, dy: -110, size: 1.1, life: 800 });
    ring(s, pl.x, gy - 3, c[1], 70, { sy: 0.3, life: 520 });
  };

  // ---- Vật nặng rơi xuống: kiếm khổng lồ / búa / mũi nhọn thép / vết nứt hư không
  R.fall = (s, id, sk, L, x, gy, dur) => {
    const c = L.c, th = L.th, rad = sk.radius || 180;
    sigil(s, x, gy, c[1], rad * 0.9, dur + 700, { depth: 1.2 });
    ring(s, x, gy, c[1], rad, { sy: 0.25, life: dur + 200, a: 0.6, r0: rad * 0.2 });
    const impact = () => {
      ring(s, x, gy - 8, c[1], rad * 1.1, { sy: 0.3, life: 460 }); ring(s, x, gy - 8, c[0], rad * 0.7, { sy: 0.3, life: 360 });
      glow(s, x, gy - 20, c[0], rad / 22, 320, { a: 0.9 });
      beam(s, x - rad, gy - 10, x + rad, gy - 10, c[1], 12, 360);
    };
    switch (L.sig) {
      case 'steel': {
        for (let i = 0; i < 7; i++) {
          const dx = (i - 3) * (rad / 3.2), sp = img(s, 'fx_lance', x + dx, gy, i === 3 ? c[0] : c[1], 8.3).setOrigin(0, 0.5).setRotation(-PI / 2).setScale(0.05, 1.4);
          const len = (i === 3 ? 2.2 : 1.5 - Math.abs(i - 3) * 0.18) * 1.1;
          s.tweens.add({ targets: sp, scaleX: len, duration: 130, delay: Math.max(0, dur - 140) + Math.abs(i - 3) * 30, ease: 'Back.out' });
          s.tweens.add({ targets: sp, alpha: 0, duration: 380, delay: dur + 260, onComplete: () => sp.destroy() });
        }
        later(s, dur, () => { impact(); debris(s, x, gy, th, 10, rad * 0.8); });
        break;
      }
      case 'hammer': {
        const hm = s.add.image(x, gy - 400, 'fx_hammer').setDepth(8).setScale(1.5).setRotation(-0.5);
        s.tweens.add({ targets: hm, y: gy - 56, rotation: 0.2, duration: dur, ease: 'Quad.in', onComplete: () => kill(s, hm, { alpha: 0 }, 420, 160) });
        beam(s, x, gy - 420, x, gy - 80, c[1], 10, dur + 100, { a: 0.5 });
        later(s, dur, () => {
          impact();
          for (let i = 0; i < 4; i++) bolt(s, x, gy - 20, x + (i < 2 ? -1 : 1) * rnd(0.4, 1) * rad, gy - rnd(0, 60), th, { jag: 14, w: 4, life: 320 });
          bolt(s, x, gy - 420, x, gy - 20, th, { jag: 22, w: 7, life: 320 }); burst(s, x, gy - 20, th, { n: 16, d1: 100, life: 460, size: 1 });
        });
        break;
      }
      case 'void': {
        const sw = img(s, 'fx_bigsword', x, gy - 420, 0xd9c2ff, 8, NORMAL()).setOrigin(0.5, 1).setAlpha(0.95);
        s.tweens.add({ targets: sw, y: gy + 20, duration: dur, ease: 'Quad.in', onComplete: () => kill(s, sw, { alpha: 0 }, 420, 200) });
        later(s, dur, () => {
          impact();
          const a = -0.55, l = rad * 1.3;
          beam(s, x - Math.cos(a) * l, gy - 40 - Math.sin(a) * l, x + Math.cos(a) * l, gy - 40 + Math.sin(a) * l, c[1], 26, 520);
          beam(s, x - Math.cos(a) * l, gy - 40 - Math.sin(a) * l, x + Math.cos(a) * l, gy - 40 + Math.sin(a) * l, c[0], 8, 460);
          const dk = img(s, 'fx_glow', x, gy - 40, c[2], 8, NORMAL()).setScale(rad / 14, rad / 30).setAlpha(0.7); kill(s, dk, { alpha: 0 }, 700);
          burst(s, x, gy - 30, th, { n: 14, d1: 90, life: 560, size: 1.5, tex: 'fx_dust', col: c[1] });
        });
        break;
      }
      default: { // sword / blade
        const big = L.sig === 'blade';
        const sw = s.add.image(x, gy - 420, 'fx_bigsword').setOrigin(0.5, 1).setDepth(8).setAlpha(0.97);
        if (big) sw.setTint(0xcfe0ff);
        s.tweens.add({ targets: sw, y: gy + 20, duration: dur, ease: 'Quad.in', onComplete: () => kill(s, sw, { alpha: 0 }, 460, 220) });
        beam(s, x, gy - 430, x, gy - 40, c[1], big ? 16 : 11, dur + 120, { a: 0.45 });
        glow(s, x, gy - 400, c[1], 1.6, dur, { a: 0.7 });
        later(s, dur, () => {
          impact(); pillar(s, x, gy, c[1], 60, 280, 560);
          burst(s, x, gy - 20, th, { n: big ? 20 : 12, d1: big ? 130 : 90, rot: true, tex: 'fx_shard', life: 520, size: 1 });
          if (big) { ring(s, x, gy - 8, c[2], rad * 1.4, { sy: 0.3, life: 560 }); runeDisc(s, x, gy - 60, c[1], rad * 0.7, 640); }
        });
      }
    }
  };

  // ---- Mưa tên: vùng báo + từng mũi
  R.arrowZone = (s, id, sk, L, cx, gy, halfW, ms) => {
    const c = L.c;
    sigil(s, cx, gy, c[1], halfW * 1.05, ms + 300, { depth: 1.2, a: 0.7 });
    ring(s, cx, gy, c[1], halfW, { sy: 0.25, life: ms * 0.8, a: 0.6, r0: halfW * 0.5 });
    if (L.sig === 'net') for (let i = 0; i < 4; i++) beam(s, cx - halfW, gy - 4 - i * 3, cx + halfW, gy - 4 - i * 3, c[1], 2, ms, { a: 0.5 });
    if (L.sig === 'storm') swirl(s, cx, gy - 30, c[1], { n: 5, r0: halfW * 0.9, r1: halfW * 0.5, turns: 2, life: ms, size: 0.8 });
  };
  R.arrow = (s, id, sk, L, x, top, gy, dur) => {
    const c = L.c, th = L.th, fire = L.sig === 'fire';
    const a = img(s, 'fx_lance', x, top, fire ? c[1] : c[1], 8.2).setRotation(PI / 2).setScale(0.5, 0.7);
    s.tweens.add({ targets: a, y: gy - 16, duration: dur, ease: 'Quad.in' });
    kill(s, a, { alpha: 0 }, 260, dur);
    const tail = img(s, 'fx_tail', x, top, c[0], 8.1).setOrigin(1, 0.5).setRotation(PI / 2).setScale(2.2, 0.8).setAlpha(0.6);
    s.tweens.add({ targets: tail, y: gy - 16, duration: dur, ease: 'Quad.in' }); kill(s, tail, { alpha: 0 }, 140, dur);
    later(s, dur, () => {
      burst(s, x, gy - 14, th, { n: fire ? 8 : 5, d1: fire ? 60 : 40, life: 340, size: 0.8, a0: -PI, a1: 0 });
      ring(s, x, gy - 8, c[1], 30, { sy: 0.4, life: 280 }); glow(s, x, gy - 14, c[0], 0.9, 240);
      if (fire) { const fl = img(s, 'fx_flame', x, gy - 6, c[1], 8.1).setOrigin(0.5, 1).setScale(1, 1.2); kill(s, fl, { scaleY: 2, alpha: 0 }, 360); }
      if (L.sig === 'net') {
        if (s._sfxNetX != null && Math.abs(s._sfxNetX - x) < 160) beam(s, s._sfxNetX, gy - 10, x, gy - 10, c[1], 3, 520, { a: 0.8 });
        s._sfxNetX = x;
      }
    });
  };

  // ---- Thiên thạch / sét / cổng / dung nham: R.meteor(x, gy, dur, k, fromX, fromY)
  R.meteor = (s, id, sk, L, x, gy, dur, k, fx, fy) => {
    const c = L.c, rad = sk.radius || 200;
    let th = L.th, cc = c, sig = L.sig;
    if (sig === 'elem') { const e = [TH.fire, TH.ice, TH.bolt][k % 3]; th = e; cc = e.c; sig = ['fire', 'iceo', 'lightning'][k % 3]; }
    sigil(s, x, gy, cc[1], rad * 0.9, dur + 800, { depth: 1.2 });
    ring(s, x, gy, cc[1], rad, { sy: 0.25, life: dur + 200, a: 0.6, r0: rad * 0.2 });
    const slam = () => {
      ring(s, x, gy - 10, cc[1], rad * 1.1, { sy: 0.32, life: 480 }); glow(s, x, gy - 20, cc[0], rad / 18, 340, { a: 0.9 });
    };
    switch (sig) {
      case 'lightning': {
        const orb = img(s, 'fx_orb', x, fy, cc[1], 8.4).setScale(1.2);
        s.tweens.add({ targets: orb, y: gy - 80, x, duration: Math.max(80, dur - 60), ease: 'Quad.in', onUpdate: () => { if (Math.random() < 0.4) bolt(s, orb.x, orb.y, orb.x + rnd(-40, 40), orb.y + rnd(-40, 40), th, { segs: 3, jag: 8, w: 3, life: 120 }); }, onComplete: () => orb.destroy() });
        later(s, dur, () => {
          bolt(s, x + rnd(-14, 14), fy, x, gy - 10, th, { jag: 24, w: 8, life: 340 }); bolt(s, x + rnd(-30, 30), fy + 60, x, gy - 10, th, { jag: 20, w: 4, life: 280 });
          slam(); burst(s, x, gy - 16, th, { n: 14, d1: 100, life: 440, size: 0.9 });
          for (let i = 0; i < 3; i++) bolt(s, x, gy - 10, x + rnd(-1, 1) * rad, gy - rnd(0, 30), th, { jag: 10, w: 3, life: 260 });
        });
        break;
      }
      case 'iceo': {
        const orb = img(s, 'fx_orb', fx, fy, cc[1], 8.4).setScale(1.3);
        s.tweens.add({ targets: orb, x, y: gy - 20, duration: dur, ease: 'Quad.in', onComplete: () => orb.destroy() });
        later(s, dur, () => { slam(); burst(s, x, gy - 16, th, { n: 16, d1: 110, rot: true, tex: 'fx_shard', life: 520, size: 1.1 }); });
        break;
      }
      case 'void': {
        const por = img(s, 'fx_glow', x, gy - 6, cc[2], 8, NORMAL()).setScale(0.3, 0.12).setAlpha(0.85);
        s.tweens.add({ targets: por, scaleX: rad / 14, scaleY: rad / 40, duration: dur, ease: 'Sine.out' }); kill(s, por, { alpha: 0 }, 500, dur + 200);
        ring(s, x, gy - 6, cc[1], rad * 0.9, { sy: 0.25, life: dur + 400, r0: rad * 0.3 });
        later(s, dur, () => {
          for (let i = 0; i < 6; i++) { const px = x + rnd(-rad, rad) * 0.6; beam(s, px, gy - 4, px + rnd(-14, 14), gy - rnd(90, 170), i % 2 ? cc[1] : cc[0], 10, 480, { delay: i * 30 }); }
          glyph(s, x, gy - 20, '☠', hex(cc[1]), 28, 760, 110); slam(); stream(s, th, { x, y: gy - 10, w: rad * 1.4, n: 14, dur: 300, dy: -110, size: 1.2, life: 700 });
        });
        break;
      }
      case 'spirit': {
        const orb = img(s, 'fx_orb', fx, fy, cc[1], 8.4).setScale(1.5);
        const tick = s.time.addEvent({ delay: 36, loop: true, callback: () => { if (!orb.active) return; const gh = img(s, 'fx_glow', orb.x, orb.y, cc[1], 8.2).setScale(0.9); kill(s, gh, { alpha: 0, scale: 0.2 }, 320); } });
        s.tweens.add({ targets: orb, x, y: gy - 20, duration: dur, ease: 'Quad.in', onComplete: () => { tick.remove(); orb.destroy(); } });
        later(s, dur, () => { slam(); swirl(s, x, gy - 20, cc[1], { n: 6, r0: 20, r1: rad * 0.7, rise: 80, turns: 1, life: 640, size: 1 }); burst(s, x, gy - 16, th, { n: 14, d1: 100, life: 520, size: 1 }); });
        break;
      }
      case 'hell': {
        later(s, Math.max(0, dur - 160), () => {
          cracks(s, x, gy, cc[1], rad, 620);
          for (let i = 0; i < 5; i++) {
            const px = x + (i - 2) * (rad / 2.6), fl = img(s, 'fx_flame', px, gy, pick([cc[1], cc[2], cc[0]]), 8.2).setOrigin(0.5, 1).setScale(0.4, 0.1);
            const sc = rnd(3.4, 5);
            s.tweens.add({ targets: fl, scaleX: sc * 0.8, scaleY: sc, duration: 220, delay: i * 30, ease: 'Back.out' });
            s.tweens.add({ targets: fl, alpha: 0, scaleY: sc * 1.4, duration: 520, delay: 420, onComplete: () => fl.destroy() });
          }
        });
        later(s, dur, () => { slam(); debris(s, x, gy, th, 10, rad * 0.9, pick([cc[1], cc[2]])); stream(s, th, { x, y: gy, w: rad * 1.6, n: 24, dur: 400, dy: -150, size: 1.2, life: 800 }); });
        break;
      }
      default: { // fire
        const m = img(s, 'fx_meteor', fx, fy, null, 8, NORMAL()).setScale(1.2).setTint(cc[1]);
        const tick = s.time.addEvent({ delay: 30, loop: true, callback: () => { if (!m.active) return; const e = img(s, 'fx_ember', m.x, m.y, pick(cc), 7.9).setScale(rnd(1, 1.8)); kill(s, e, { alpha: 0, scale: 0.2, y: e.y - 20 }, 380); } });
        s.tweens.add({ targets: m, x, y: gy - 20, rotation: 0.6, duration: dur, ease: 'Quad.in', onComplete: () => { tick.remove(); m.destroy(); } });
        later(s, dur, () => { slam(); burst(s, x, gy - 16, th, { n: 18, d1: 110, life: 560, size: 1.3 }); debris(s, x, gy, th, 6, rad * 0.7, cc[2]); });
      }
    }
  };

  // ---- Tuyệt phẩm
  R.execute = (s, id, sk, L, tx, ty) => {
    const c = L.c;
    arc(s, tx, ty, 70, -PI * 0.9, PI * 0.15, 0xffffff, 42, 520, { abs: true, grow: 1.35, core: 0xffffff });
    arc(s, tx, ty, 70, PI * 0.1, PI * 1.15, c[1], 30, 520, { abs: true, grow: 1.3 });
    ring(s, tx, ty, c[2], 120, { life: 560 }); glow(s, tx, ty, 0xffffff, 3.2, 360);
    glyph(s, tx, ty - 10, '💀', '#ffffff', 40, 900, 70);
    burst(s, tx, ty, L.th, { n: 14, d1: 100, life: 600, size: 1.6, tex: 'fx_dust', col: c[1] });
    flashCam(s, 0x300010, 200);
  };
  R.fusion = (s, id, sk, L) => {
    const pl = s.player, c = L.c, gy = pl.body.bottom;
    sigil(s, pl.x, gy - 2, c[1], 128, 1100); pillar(s, pl.x, gy, c[1], 90, 380, 900);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; beam(s, pl.x + Math.cos(a) * 150, pl.y + Math.sin(a) * 90, pl.x, pl.y, c[1], 4, 480, { delay: i * 25 }); }
    runeDisc(s, pl.x, pl.y, c[1], 96, 900);
  };
  R.manaburst = (s, id, sk, L) => {
    const pl = s.player, c = L.c, gy = pl.body.bottom, rad = sk.radius || 300;
    sigil(s, pl.x, gy - 2, c[1], rad, 1000); pillar(s, pl.x, gy, c[1], 120, 460, 800); pillar(s, pl.x, gy, c[0], 50, 460, 640);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2; beam(s, pl.x, pl.y, pl.x + Math.cos(a) * rad, pl.y + Math.sin(a) * rad, i % 2 ? c[1] : c[0], 10, 520); }
    for (let i = 0; i < 10; i++) { const a = rnd(0, PI * 2), p = img(s, 'fx_orb', pl.x + Math.cos(a) * 120, pl.y + Math.sin(a) * 80, 0x64b5f6, 8.6).setScale(0.7); kill(s, p, { x: pl.x, y: pl.y, alpha: 0.2 }, 300, i * 14, 'Quad.in'); }
    glow(s, pl.x, pl.y, c[0], rad / 10, 520, { a: 0.85 });
    stream(s, L.th, { x: pl.x, y: gy, w: rad * 1.4, n: 26, dur: 600, dy: -170, size: 1.3, life: 900 });
  };
  R.allin = (s, id, sk, L) => {
    const pl = s.player, gy = pl.body.bottom, rad = sk.radius || 400;
    const cols = [0xff7043, 0x80deea, 0xfff176, 0xb388ff];
    cols.forEach((col, i) => { sigil(s, pl.x, gy - 2, col, rad * (0.4 + i * 0.2), 1000); ring(s, pl.x, pl.y, col, rad * (0.5 + i * 0.18), { life: 520 + i * 60 }); });
    pillar(s, pl.x, gy, 0xffffff, 130, 480, 900); runeDisc(s, pl.x, pl.y, 0xe0b3ff, 120, 900, { spin: 360 });
    for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; beam(s, pl.x, pl.y, pl.x + Math.cos(a) * rad, pl.y + Math.sin(a) * rad, cols[i % 4], 8, 560); }
    glow(s, pl.x, pl.y, 0xffffff, rad / 10, 560, { a: 0.9 });
  };

  // ------------------------------------------------------------------ Đạn bay (dùng chung với shoot / updateProjectiles)
  const PS = {
    bolt:      { key: 'fx_orb',    sc: 1.1, trail: 'ember',   hit: 'burst' },
    wave:      { key: 'fx_wave',   sc: 1.3, trail: 'glow',    hit: 'burst' },
    lance:     { key: 'fx_lance',  sc: 1.0, trail: 'tail',    hit: 'star' },
    arrow:     { key: 'fx_lance',  sc: 0.55, trail: 'tail',   hit: 'spark' },
    shard:     { key: 'fx_shard',  sc: 1.7, trail: 'snow',    hit: 'shatter' },
    lightning: { key: 'fx_orb',    sc: 0.75, trail: 'bolt',   hit: 'strike' },
    dagger:    { key: 'fx_dagger', sc: 1.0, trail: 'smear',   hit: 'cross', spin: true },
    bird:      { key: 'fx_bird',   sc: 1.0, trail: 'feather', hit: 'burst', flap: true },
    cursed:    { key: 'fx_skull',  sc: 1.2, trail: 'wisp',    hit: 'burst' },
    holy:      { key: 'fx_star',   sc: 1.1, trail: 'sparkle', hit: 'star', spin: true },
    star:      { key: 'fx_star',   sc: 0.9, trail: 'sparkle', hit: 'star', spin: true },
    disc:      { key: 'fx_disc',   sc: 1.0, trail: 'tail',    hit: 'cross', spin: true },
    dragon:    { key: 'fx_orb',    sc: 1.0, trail: 'serpent', hit: 'burst' },
  };
  PS.fan = PS.arrow;
  const BACKSTEP_PS = { arrow: 'arrow', shadow: 'dagger', arcane: 'bolt', wind: 'arrow' };

  function projStyle(id, sk, forced) {
    const L = look(id, sk);
    let st = forced || L.sig;
    if (sk.type === 'backstep') st = BACKSTEP_PS[L.key] || 'bolt';
    const ps = PS[st] || PS.bolt;
    return { L, ps, st };
  }

  const TRAIL = {
    ember: (s, p, th) => { const e = img(s, 'fx_ember', p.x, p.y, pick(th.c), 7.9).setScale(rnd(1, 1.7)); kill(s, e, { alpha: 0, scale: 0.2, y: e.y - 16 }, 380); },
    glow: (s, p, th) => { const e = img(s, 'fx_glow', p.x, p.y, th.c[1], 7.9).setScale(0.8).setAlpha(0.55); kill(s, e, { alpha: 0, scale: 0.2 }, 300); },
    tail: (s, p, th) => { const e = img(s, 'fx_tail', p.x, p.y, th.c[1], 7.9).setOrigin(1, 0.5).setRotation(Math.atan2(p.vy, p.vx)).setScale(1.1, 0.7).setAlpha(0.7); kill(s, e, { alpha: 0, scaleY: 0 }, 220); },
    snow: (s, p, th) => { const e = img(s, 'fx_snow', p.x + rnd(-6, 6), p.y + rnd(-6, 6), pick(th.c), 7.9).setScale(rnd(1, 1.6)); kill(s, e, { alpha: 0, y: e.y + 14, scale: 0.2 }, 360); },
    bolt: (s, p, th) => { bolt(s, p.x, p.y, p.x - Math.sign(p.vx) * 36 + rnd(-8, 8), p.y + rnd(-20, 20), th, { segs: 3, jag: 9, w: 3, life: 160 }); },
    smear: (s, p, th) => { const e = img(s, 'fx_tail', p.x, p.y, th.c[2], 7.9, NORMAL()).setOrigin(1, 0.5).setRotation(Math.atan2(p.vy, p.vx)).setScale(0.9, 0.6).setAlpha(0.7); kill(s, e, { alpha: 0, scaleY: 0 }, 260); },
    feather: (s, p, th) => { const e = img(s, 'fx_feather', p.x, p.y, th.c[1], 7.9).setRotation(rnd(0, PI)).setScale(1.1); kill(s, e, { alpha: 0, y: e.y + 26, x: e.x - Math.sign(p.vx) * 14, rotation: e.rotation + 1.5 }, 460); },
    wisp: (s, p, th) => { const e = img(s, 'fx_glow', p.x, p.y, pick([th.c[1], th.c[2]]), 7.9).setScale(0.9).setAlpha(0.7); kill(s, e, { alpha: 0, y: e.y - 20, scale: 1.4 }, 420); },
    sparkle: (s, p, th) => { const e = img(s, 'fx_star', p.x + rnd(-8, 8), p.y + rnd(-8, 8), pick(th.c), 7.9).setScale(rnd(0.4, 0.8)); kill(s, e, { alpha: 0, scale: 0.1, rotation: 2 }, 380); },
    serpent: (s, p, th) => { const k = p.sfxK = (p.sfxK || 0) + 1; for (let i = 0; i < 2; i++) { const e = img(s, 'fx_glow', p.x, p.y + Math.sin(k * 0.7 + i * 3) * 18, i ? th.c[2] : th.c[1], 7.9).setScale(0.9); kill(s, e, { alpha: 0, scale: 0.2 }, 360); } },
  };
  const HIT = {
    burst: (s, x, y, th) => { burst(s, x, y, th, { n: 12, d1: 70, life: 420, size: 1 }); ring(s, x, y, th.c[1], 44, { life: 320 }); glow(s, x, y, th.c[0], 1.4, 240); },
    spark: (s, x, y, th) => { burst(s, x, y, th, { n: 6, d1: 46, life: 320, size: 0.8 }); glow(s, x, y, th.c[0], 0.9, 200); },
    star: (s, x, y, th) => { for (let i = 0; i < 4; i++) { const a = (i / 4) * PI + 0.4; beam(s, x - Math.cos(a) * 36, y - Math.sin(a) * 36, x + Math.cos(a) * 36, y + Math.sin(a) * 36, i % 2 ? th.c[1] : th.c[0], 5, 280); } glow(s, x, y, th.c[0], 1.4, 260); },
    shatter: (s, x, y, th) => { burst(s, x, y, th, { n: 12, d1: 76, rot: true, tex: 'fx_shard', life: 440, size: 1 }); glow(s, x, y, th.c[0], 1.3, 240); },
    strike: (s, x, y, th) => { bolt(s, x + rnd(-10, 10), y - 200, x, y, th, { jag: 18, w: 6, life: 300 }); glow(s, x, y, th.c[0], 1.6, 260); burst(s, x, y, th, { n: 6, d1: 50, life: 300, size: 0.8 }); },
    cross: (s, x, y, th) => { beam(s, x - 30, y - 30, x + 30, y + 30, th.c[1], 7, 260); beam(s, x - 30, y + 30, x + 30, y - 30, th.c[1], 7, 260); beam(s, x - 30, y - 30, x + 30, y + 30, th.c[0], 2.5, 220); glow(s, x, y, th.c[0], 1.1, 220); },
  };

  // ------------------------------------------------------------------ Gắn vào WorldScene
  WorldScene.mix(class SkillFx {
    // Điểm vào duy nhất: this.sfx('loại', id, sk, ...tham số). Lỗi vẽ bị nuốt để không hỏng đòn đánh.
    sfx(kind, id, sk, a, b, c, d, e, f) {
      try {
        const fn = R[kind];
        if (!fn || !alive(this)) return;
        makeTex(this);
        fn(this, id, sk, look(id, sk), a, b, c, d, e, f);
      } catch (err) { /* bỏ qua: hiệu ứng không được làm hỏng chiến đấu */ }
    }

    // Tuỳ chọn hình dạng đạn cho shoot(): trả {} khi lỗi để đạn vẫn bay bằng hình mặc định
    sfxProj(id, sk, forced) {
      try {
        makeTex(this);
        const { L, ps, st } = projStyle(id, sk, forced);
        return { key: ps.key, tint: L.c[1], scale: ps.sc * (sk.ult ? 1.35 : 1), spin: !!ps.spin, sfx: { th: L.th, ps, st } };
      } catch (err) { return {}; }
    }

    // Mỗi khung hình: rải vệt đuôi theo kiểu của đạn
    sfxProjTick(p, delta) {
      const sf = p.o.sfx;
      if (!sf || !alive(this)) return;
      if (sf.ps.flap) p.scaleY = p.o.scale * (1 + 0.3 * Math.sin(p.dist / 14));
      p.sfxAcc = (p.sfxAcc || 0) + delta;
      const gap = Quality.low ? 70 : 36;
      if (p.sfxAcc < gap) return;
      p.sfxAcc = 0;
      try { (TRAIL[sf.ps.trail] || TRAIL.glow)(this, p, sf.th); } catch (err) { /* bỏ qua */ }
    }

    // Đạn trúng quái
    // Mỗi khung hình (gọi từ drawAura): đặt lại vị trí vật thể xoay quanh người; buff hết / bị xoá thì dọn
    sfxAuraUpdate(time) {
      const A = this._auras;
      if (!A) return;
      const pl = this.player;
      for (const id of Object.keys(A)) {
        const a = A[id], b = this.buffs[id];
        if (a.dead || !b || time >= b.until || (a.items[0] && !a.items[0].active)) { sfxAuraKill(a); delete A[id]; continue; }
        if (time < a.t0) continue;
        const k = Math.min(1, (time - a.t0) / 350) * Math.min(1, (b.until - time) / 500);
        const tt = time / 1000;
        for (const g of a.rings || []) {
          if (!g.list) continue;
          for (let i = 0; i < g.list.length; i++) {
            const it = g.list[i], ang = tt * g.spd * g.dir + (i * PI * 2) / g.n, sn = Math.sin(ang), front = sn > 0;
            it.setPosition(pl.x + Math.cos(ang) * g.rx, pl.y + g.dy + sn * g.ry)
              .setDepth(front ? 4.5 : 3.8).setAlpha(k * (front ? 1 : 0.6)).setScale(g.sc * k * (0.9 + 0.1 * sn));
            it.setRotation(g.mode === 'spin' ? tt * 4 + i : (g.rot || 0));
          }
        }
        if (a.halo) a.halo.setPosition(pl.x, pl.y - 36).setScale(0.62 * k, 0.17 * k).setAlpha(0.8 * k);
        if (a.sig) a.sig.setPosition(pl.x, pl.body.bottom - 2).setScale((a.sigR / 60) * k, (a.sigR / 60) * 0.3 * k).setAlpha(k * (0.3 + 0.1 * Math.sin(tt * 4)));
      }
    }

    sfxProjHit(p, m) {
      const sf = p.o.sfx;
      if (!sf || !alive(this)) return;
      try { (HIT[sf.ps.hit] || HIT.burst)(this, p.x, p.y, sf.th); } catch (err) { /* bỏ qua */ }
    }
  });

  // Export primitive cho bộ vẽ JSON (skillfx-json.js) dùng chung. Không đổi luật chơi,
  // chỉ mở các hàm vẽ đã có để file JSON điều khiển màu/kiểu mà không phải viết lại Phaser.
  (typeof window !== 'undefined' ? window : globalThis).SkillFxPrim = {
    makeTex, alive, img, glow, ring, burst, stream, beam, bolt, arc, pillar, sigil,
    runeDisc, cracks, debris, swirl, ghostOf, flashCam, glyph, R, look, TH,
  };
})();
