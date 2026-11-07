'use strict';
/*
 * Hình nhân vật và quái vẽ sẵn (sprite sheet của LuizMelo, giấy phép CC0, xem public/assets/CREDITS.txt).
 * Mỗi bộ có số đo riêng:
 *   fw, fh: cỡ một khung hình     cx: tâm thân theo chiều ngang     fy: vị trí chân (đáy hình)
 *   s: tỉ lệ phóng để nhân vật cao khoảng 56px trong game
 *   anims: { tên: [số khung, tốc độ khung/giây] }
 * Bộ nào thiếu ảnh thì game tự dùng lại hình vẽ bằng code.
 */
const Sprites = (() => {
  const CHARS = {
    none: { fw: 324, fh: 324, cx: 171, fy: 202, s: 0.625, combo: ['attack1', 'attack2', 'attack3'],
      anims: { idle: [10, 10], run: [8, 14], jump: [3, 10], fall: [3, 10], attack1: [7, 18], attack2: [7, 18], attack3: [8, 18], hit: [3, 12], death: [7, 10] } },
    kiem_si: { fw: 252, fh: 252, cx: 135, fy: 164, s: 0.675, combo: ['attack1', 'attack2', 'attack3'],
      anims: { idle: [10, 10], run: [8, 14], jump: [3, 10], fall: [3, 10], attack1: [7, 20], attack2: [6, 20], attack3: [9, 20], hit: [3, 12], death: [11, 12] } },
    cung_thu: { fw: 200, fh: 200, cx: 101, fy: 134, s: 0.775, combo: ['attack1'],
      anims: { idle: [10, 10], run: [8, 14], jump: [2, 8], fall: [2, 8], attack1: [6, 16], hit: [3, 12], death: [10, 12] } },
    phap_su: { fw: 462, fh: 380, cx: 220, fy: 282, s: 0.34, combo: ['attack1', 'attack2'],
      anims: { idle: [6, 8], run: [8, 14], jump: [2, 8], fall: [2, 8], attack1: [8, 18], attack2: [8, 18], hit: [4, 12], death: [7, 10] } },
    toan_nang: { fw: 500, fh: 500, cx: 272, fy: 334, s: 0.45, combo: ['attack1', 'attack2'],
      anims: { idle: [8, 10], run: [8, 14], jump: [2, 8], fall: [2, 8], attack1: [8, 18], attack2: [8, 18], hit: [3, 12], death: [7, 10] } },
    // ---- 3 class mới
    // Sát Thủ: Martial Hero 3 (fw=252, tay không/dao nhanh, 3 combo)
    sat_thu: { fw: 252, fh: 252, cx: 135, fy: 164, s: 0.675, combo: ['attack1', 'attack2', 'attack3'],
      anims: { idle: [10, 10], run: [8, 14], jump: [3, 10], fall: [3, 10], attack1: [7, 22], attack2: [6, 22], attack3: [9, 22], hit: [3, 12], death: [11, 12] } },
    // Tanker: Fantasy Warrior (fw=324, kiếm to + khiên, 3 combo)
    tanker: { fw: 324, fh: 324, cx: 171, fy: 202, s: 0.625, combo: ['attack1', 'attack2', 'attack3'],
      anims: { idle: [10, 10], run: [8, 14], jump: [3, 10], fall: [3, 10], attack1: [7, 16], attack2: [7, 16], attack3: [8, 16], hit: [3, 12], death: [7, 10] } },
    // Trị Liệu Sư: Evil Wizard 2 tái dụng với tint xanh lá (fw=500, staff heal)
    tri_lieu_su: { fw: 500, fh: 500, cx: 272, fy: 334, s: 0.45, combo: ['attack1', 'attack2'],
      tint: 0x80ffb0,  // tint xanh lá nhạt để phân biệt với toan_nang
      anims: { idle: [8, 10], run: [8, 14], jump: [2, 8], fall: [2, 8], attack1: [8, 18], attack2: [8, 18], hit: [3, 12], death: [7, 10] } },
    // Triệu Hồi Sư: Evil Wizard 3 (fw=280, pháp trượng đầu lâu, áo đỏ)
    trieu_hoi_su: { fw: 280, fh: 280, cx: 144, fy: 198, s: 0.675, combo: ['attack1'],
      anims: { idle: [10, 10], run: [8, 14], jump: [3, 10], fall: [3, 10], attack1: [13, 18], hit: [3, 12], death: [18, 10] } },
    // Tử Linh Thuật Sư: Evil Wizard 2 (fw=500, pháp trượng lửa tím)
    tu_linh_thuat_su: { fw: 500, fh: 500, cx: 272, fy: 332, s: 0.45, combo: ['attack1', 'attack2'],
      anims: { idle: [8, 10], run: [8, 14], jump: [2, 8], fall: [2, 8], attack1: [8, 18], attack2: [8, 18], hit: [3, 12], death: [7, 10] } },
  };
  // bw, bh: khung va chạm trong game (px); fly: quái bay (cy = tâm thân theo chiều dọc)
  const MOBS = {
    mushroom: { fw: 150, fh: 150, cx: 75, fy: 101, s: 1.1, bw: 28, bh: 36,
      anims: { idle: [4, 8], run: [8, 12], attack: [8, 16], hit: [4, 14], death: [4, 8] } },
    goblin: { fw: 150, fh: 150, cx: 74, fy: 101, s: 1.3, bw: 28, bh: 44,
      anims: { idle: [4, 8], run: [8, 14], attack: [8, 16], hit: [4, 14], death: [4, 8] } },
    skeleton: { fw: 150, fh: 150, cx: 80, fy: 101, s: 1.1, bw: 30, bh: 54,
      anims: { idle: [4, 8], run: [4, 8], attack: [8, 14], hit: [4, 14], death: [4, 8] } },
    slime: { fw: 156, fh: 156, cx: 77, fy: 87, s: 1.35, bw: 40, bh: 28,
      anims: { idle: [14, 14], run: [6, 10], attack: [19, 30], hit: [3, 14], death: [11, 16] } },
    eye: { fw: 150, fh: 150, cx: 76, cy: 76, fly: true, s: 1.2, bw: 34, bh: 30,
      anims: { idle: [8, 14], run: [8, 14], attack: [8, 18], hit: [4, 14], death: [4, 8] } },
    bat: { fw: 87, fh: 87, cx: 48, cy: 43, fly: true, s: 0.95, bw: 40, bh: 32,
      anims: { idle: [11, 16], run: [11, 16], attack: [11, 22], hit: [3, 14], death: [4, 8] } },
  };
  // Kiểu dáng quái trong shared/data/monsters.js → bộ hình
  const LOOK = { mushroom: 'mushroom', wolf: 'goblin', frog: 'slime', bat: 'bat', spider: 'skeleton', shade: 'eye' };
  const LOOK_TINT = { shade: 0xff7080 };

  // Bộ hình cần ngay khi vào một bản đồ: class đang chơi + các loại quái xuất hiện ở bản đồ đó
  function needed(mapId, school) {
    const chars = new Set([CHARS[school] ? school : 'none']);
    const mobs = new Set();
    const meta = GameData.MAPS[mapId];
    for (const ch in (meta && meta.spawns) || {}) {
      const def = GameData.MONSTERS[meta.spawns[ch]];
      if (def && LOOK[def.look]) mobs.add(LOOK[def.look]);
    }
    const shadowData = App.player?.shadows || {};
    const activeSouls = shadowData.active?.length
      ? (shadowData.active || []).map(uid => shadowData.roster?.find(x => x.uid === uid)).filter(Boolean)
      : (shadowData.roster || []).slice(0, 3);
    for (const soul of activeSouls) {
      const def = GameData.MONSTERS[soul.monster];
      if (def && LOOK[def.look]) mobs.add(LOOK[def.look]);
    }
    return { chars, mobs };
  }

  // Danh sách file ảnh còn thiếu (only = null: mọi bộ hình). ?v= là mã phiên bản ảnh: trình duyệt lưu lâu dài.
  function missing(scene, only) {
    const v = window.BUILD ? '?v=' + BUILD.assets : '';
    const list = [];
    for (const [id, c] of Object.entries(CHARS)) {
      if (only && !only.chars.has(id)) continue;
      for (const a of Object.keys(c.anims)) list.push({ key: `ch_${id}_${a}`, url: `/assets/chars/${id}/${a}.png` + v, fw: c.fw, fh: c.fh });
    }
    for (const [id, m] of Object.entries(MOBS)) {
      if (only && !only.mobs.has(id)) continue;
      for (const a of Object.keys(m.anims)) list.push({ key: `mb_${id}_${a}`, url: `/assets/mobs/${id}/${a}.png` + v, fw: m.fw, fh: m.fh });
    }
    return list.filter(f => !scene.textures.exists(f.key));
  }

  // Xếp hàng tải các bộ hình (only = null: tải hết phần còn thiếu). Trả về số file được xếp hàng.
  function preload(scene, only) {
    const list = missing(scene, only);
    for (const f of list) scene.load.spritesheet(f.key, f.url, { frameWidth: f.fw, frameHeight: f.fh });
    return list.length;
  }

  // Thứ tự tải ngầm sau khi đã vào game: class đang chơi (vừa đổi class) → quái ở các bản đồ kề cổng → còn lại
  function background(scene, mapId, school) {
    const meta = GameData.MAPS[mapId] || {};
    const near = { chars: new Set([CHARS[school] ? school : 'none']), mobs: new Set() };
    for (const ch in meta.portals || {}) for (const m of needed(meta.portals[ch].to, school).mobs) near.mobs.add(m);
    const first = missing(scene, near);
    const keys = new Set(first.map(f => f.key));
    return first.concat(missing(scene, null).filter(f => !keys.has(f.key))).filter(f => !skipped.has(f.key));
  }
  const skipped = new Set();
  const skip = (key) => skipped.add(key);

  function createAnims(scene) {
    const mk = (prefix, id, a, n, rate, loop) => {
      const key = `${prefix}_${id}_${a}`;
      if (scene.anims.exists(key) || !scene.textures.exists(key)) return;
      scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(key, { start: 0, end: n - 1 }), frameRate: rate, repeat: loop ? -1 : 0 });
    };
    const loops = new Set(['idle', 'run', 'fall']);
    for (const [id, c] of Object.entries(CHARS)) for (const [a, [n, r]] of Object.entries(c.anims)) mk('ch', id, a, n, a === 'run' ? Math.max(16, r) : r, loops.has(a));
    for (const [id, m] of Object.entries(MOBS)) for (const [a, [n, r]] of Object.entries(m.anims)) mk('mb', id, a, n, r, loops.has(a));
  }

  // Giữ cạnh sprite pixel-art rõ: chỉ nội suy mượt khi ảnh bị thu nhỏ dưới một điểm ảnh nguồn.
  function applyFilters(scene, k) {
    const { NEAREST, LINEAR } = Phaser.Textures.FilterMode;
    const set = (prefix, id, def) => {
      const mode = def.s * k >= 1 ? NEAREST : LINEAR;
      for (const a of Object.keys(def.anims)) {
        const key = `${prefix}_${id}_${a}`;
        if (scene.textures.exists(key)) scene.textures.get(key).setFilter(mode);
      }
    };
    for (const [id, c] of Object.entries(CHARS)) set('ch', id, c);
    for (const [id, m] of Object.entries(MOBS)) set('mb', id, m);
  }

  const hasChar = (scene, id) => !!CHARS[id] && scene.textures.exists(`ch_${id}_idle`);
  const mobOf = (look) => LOOK[look];
  const hasMob = (scene, look) => !!LOOK[look] && scene.textures.exists(`mb_${LOOK[look]}_idle`);

  // Đặt gốc tọa độ và khung va chạm sao cho: x là tâm thân, chân ở y+30, khung va chạm 18x46 như cũ.
  // grow: phóng to thêm khi biến hình (khung va chạm trong thế giới game giữ nguyên, chân vẫn chạm đất)
  // lift: tùy chọn nâng HÌNH mà không đổi khung va chạm.
  function fitPlayer(sprite, id, flip, grow = 1, lift = 0) {
    const c = CHARS[id];
    const s = c.s * grow;
    const cx = flip ? c.fw - c.cx : c.cx;
    sprite.setScale(s);
    sprite.setOrigin(cx / c.fw, (c.fy - (30 - lift) / s) / c.fh);
    sprite.body.setSize(18 / s, 46 / s, false);
    sprite.body.setOffset(cx - 9 / s, c.fy - (46 - lift) / s);
    // Tint cố định theo class (ví dụ tri_lieu_su tái dụng sheet toan_nang với màu xanh lá)
    if (c.tint && grow === 1) sprite.setTint(c.tint); else sprite.clearTint();
  }

  // ---------------------------------------------------------------- Bộ hình biến hình (thức tỉnh)
  // Tạo từ chính bộ hình của class: tô lại từng điểm ảnh sang màu ấn (vàng / hồng tím), giữ khối sáng tối,
  // chỗ sáng gần trắng như phát quang. Tạo một lần cho mỗi class + ấn, dùng lại cả phiên chơi.
  // Khóa: chf<ấn>_<class>_<hoạt ảnh> (cùng số khung, tốc độ với ch_...).
  const FORM_RGB = { 1: [255, 206, 84], 2: [255, 112, 214] };
  const formKey = (id, tier, a) => `chf${tier}_${id}_${a}`;
  const shellKey = (id, tier, a) => `cha${tier}_${id}_${a}`;

  // Lớp màng hào quang: dải sáng ôm sát BÊN NGOÀI đường viền cơ thể (không phủ lên người).
  // Đo khoảng cách từng điểm ảnh tới thân (biến đổi khoảng cách 2 lượt), rồi tô:
  //   lòng màng (0 < d < R): mờ nhẹ;  mép ngoài (d ≈ R): sáng rõ, ngả trắng;  trong thân: trong suốt.
  const SHELL = { 1: { R: 4, rgb: [255, 214, 92] }, 2: { R: 5.5, rgb: [255, 120, 220] } };
  function shellFrame(src, W, H, out, tier) {
    const { R, rgb } = SHELL[tier] || SHELL[1];
    const dist = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) dist[i] = src[i * 4 + 3] > 60 ? 0 : 1e6;
    const D = 1.41;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; let d = dist[i];
      if (!d) continue;
      if (x > 0) d = Math.min(d, dist[i - 1] + 1);
      if (y > 0) { d = Math.min(d, dist[i - W] + 1); if (x > 0) d = Math.min(d, dist[i - W - 1] + D); if (x < W - 1) d = Math.min(d, dist[i - W + 1] + D); }
      dist[i] = d;
    }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x; let d = dist[i];
      if (!d) continue;
      if (x < W - 1) d = Math.min(d, dist[i + 1] + 1);
      if (y < H - 1) { d = Math.min(d, dist[i + W] + 1); if (x < W - 1) d = Math.min(d, dist[i + W + 1] + D); if (x > 0) d = Math.min(d, dist[i + W - 1] + D); }
      dist[i] = d;
    }
    for (let i = 0; i < W * H; i++) {
      const d = dist[i];
      if (!d || d > R + 2.5) continue;
      const rim = Math.exp(-((d - R) * (d - R)) / 1.4);                 // mép ngoài sáng
      const fill = d < R ? 0.28 * (1 - 0.4 * d / R) : 0;                 // lòng màng mờ
      const a = Math.min(1, Math.max(fill, rim * 0.95));
      const w = rim * 0.55;                                              // mép ngả trắng
      out[i * 4] = rgb[0] + (255 - rgb[0]) * w; out[i * 4 + 1] = rgb[1] + (255 - rgb[1]) * w; out[i * 4 + 2] = rgb[2] + (255 - rgb[2]) * w;
      out[i * 4 + 3] = a * 255;
    }
  }
  // Tô màu ấn cho một khung: chỗ tối (tóc, viền, mắt) gần như giữ nguyên để còn nhận ra nhân vật,
  // chỗ sáng (da, áo, vũ khí) ánh màu ấn và sáng rực lên
  function recolorFrame(d, tier) {
    const [cr, cg, cb] = FORM_RGB[tier] || FORM_RGB[1];
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
      const k = 0.25 + 0.45 * lum, L = lum * 1.25 + 0.08, glow = Math.max(0, lum - 0.6) * 0.9;
      d[i] = Math.min(255, r * (1 - k) + cr * L * k + 255 * glow * 0.3);
      d[i + 1] = Math.min(255, g * (1 - k) + cg * L * k + 255 * glow * 0.3);
      d[i + 2] = Math.min(255, b * (1 - k) + cb * L * k + 255 * glow * 0.3);
    }
  }

  // Việc tạo bộ hình biến hình + lớp màng cho MỘT hoạt ảnh, làm dần: mỗi step() xử lý 1 khung hình (vài ms),
  // khung cuối thì đưa vào game. Trả về null nếu đã có sẵn / chưa tải ảnh gốc.
  function formJob(scene, id, tier, a) {
    const c = CHARS[id], src = `ch_${id}_${a}`, key = formKey(id, tier, a), skey = shellKey(id, tier, a);
    if (!c || !scene.textures.exists(src)) return null;
    const finishAnim = () => {
      if (scene.anims.exists(key) || !scene.textures.exists(key)) return;
      const [n, baseRate] = c.anims[a];
      const rate = a === 'run' ? Math.max(16, baseRate) : baseRate;
      scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(key, { start: 0, end: n - 1 }), frameRate: rate, repeat: ['idle', 'run', 'fall'].includes(a) ? -1 : 0 });
    };
    if (scene.textures.exists(key)) { finishAnim(); return null; }
    const img = scene.textures.get(src).getSourceImage();
    const W = img.width, H = img.height, cols = Math.max(1, Math.floor(W / c.fw)), total = cols * Math.max(1, Math.floor(H / c.fh));
    const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; return [cv, cv.getContext('2d', { willReadFrequently: true })]; };
    const [bodyCv, body] = mk(), [shellCv, shell] = mk();
    body.drawImage(img, 0, 0);
    let j = 0;
    return {
      step() {
        if (j < total) {
          const x = (j % cols) * c.fw, y = Math.floor(j / cols) * c.fh;
          const data = body.getImageData(x, y, c.fw, c.fh);
          const out = shell.createImageData(c.fw, c.fh);
          shellFrame(data.data, c.fw, c.fh, out.data, tier);
          recolorFrame(data.data, tier);
          body.putImageData(data, x, y);
          shell.putImageData(out, x, y);
          j++;
          return false;
        }
        if (!scene.textures.exists(key)) {
          const { NEAREST, LINEAR } = Phaser.Textures.FilterMode;
          scene.textures.addSpriteSheet(key, bodyCv, { frameWidth: c.fw, frameHeight: c.fh });
          scene.textures.get(key).setFilter(c.s * View.k >= 1 ? NEAREST : LINEAR);
          scene.textures.addSpriteSheet(skey, shellCv, { frameWidth: c.fw, frameHeight: c.fh });
          scene.textures.get(skey).setFilter(LINEAR);
        }
        finishAnim();
        return true;
      },
    };
  }
  // Kiểm tra trạng thái tạo sẵn mà không làm nặng khung hình lúc người chơi kích hoạt biến hình.
  function formSheetsReady(scene, id, tier) {
    const c = CHARS[id];
    if (!c) return false;
    for (const a of Object.keys(c.anims)) {
      if (!scene.textures.exists(`ch_${id}_${a}`) || !scene.textures.exists(formKey(id, tier, a)) || !scene.textures.exists(shellKey(id, tier, a))) return false;
    }
    return true;
  }

  // walking: quái này đi bộ (def.fly = false). Một số quái đi bộ mượn bộ hình bay (shade → eye): khi đó gốc tọa độ
  // phải là ĐÁY khung va chạm (chân), không phải tâm. Trước đây đặt theo tâm → nửa thân lọt vào đất, quái chìm 1 ô.
  function fitMob(sprite, look, walking = true) {
    const m = MOBS[LOOK[look]];
    sprite.setScale(m.s);
    if (m.fly) {
      const oy = walking ? m.cy + m.bh / 2 / m.s : m.cy;
      sprite.setOrigin(m.cx / m.fw, oy / m.fh);
      sprite.body.setSize(m.bw / m.s, m.bh / m.s, false);
      sprite.body.setOffset(m.cx - m.bw / 2 / m.s, m.cy - m.bh / 2 / m.s);
    } else {
      sprite.setOrigin(m.cx / m.fw, m.fy / m.fh);
      sprite.body.setSize(m.bw / m.s, m.bh / m.s, false);
      sprite.body.setOffset(m.cx - m.bw / 2 / m.s, m.fy - m.bh / m.s);
    }
    if (LOOK_TINT[look]) sprite.setTint(LOOK_TINT[look]);
  }

  return { CHARS, MOBS, LOOK, LOOK_TINT, needed, preload, background, skip, createAnims, applyFilters, hasChar, hasMob, mobOf, fitPlayer, fitMob, formSheetsReady, formJob };
})();
