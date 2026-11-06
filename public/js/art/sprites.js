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
    none: { fw: 162, fh: 162, cx: 85.5, fy: 101, s: 1.25, combo: ['attack1', 'attack2', 'attack3'],
      anims: { idle: [10, 10], run: [8, 14], jump: [3, 10], fall: [3, 10], attack1: [7, 18], attack2: [7, 18], attack3: [8, 18], hit: [3, 12], death: [7, 10] } },
    kiem_si: { fw: 126, fh: 126, cx: 67.5, fy: 82, s: 1.35, combo: ['attack1', 'attack2', 'attack3'],
      anims: { idle: [10, 10], run: [8, 14], jump: [3, 10], fall: [3, 10], attack1: [7, 20], attack2: [6, 20], attack3: [9, 20], hit: [3, 12], death: [11, 12] } },
    cung_thu: { fw: 100, fh: 100, cx: 50.5, fy: 67, s: 1.55, combo: ['attack1'],
      anims: { idle: [10, 10], run: [8, 14], jump: [2, 8], fall: [2, 8], attack1: [6, 16], hit: [3, 12], death: [10, 12] } },
    phap_su: { fw: 231, fh: 190, cx: 110, fy: 141, s: 0.68, combo: ['attack1', 'attack2'],
      anims: { idle: [6, 8], run: [8, 14], jump: [2, 8], fall: [2, 8], attack1: [8, 18], attack2: [8, 18], hit: [4, 12], death: [7, 10] } },
    toan_nang: { fw: 250, fh: 250, cx: 136, fy: 167, s: 0.9, combo: ['attack1', 'attack2'],
      anims: { idle: [8, 10], run: [8, 14], jump: [2, 8], fall: [2, 8], attack1: [8, 18], attack2: [8, 18], hit: [3, 12], death: [7, 10] } },
    // ---- 3 class mới
    // Sát Thủ: Martial Hero 3 (fw=126, tay không/dao nhanh, 3 combo)
    sat_thu: { fw: 126, fh: 126, cx: 67.5, fy: 82, s: 1.35, combo: ['attack1', 'attack2', 'attack3'],
      anims: { idle: [10, 10], run: [8, 14], jump: [3, 10], fall: [3, 10], attack1: [7, 22], attack2: [6, 22], attack3: [9, 22], hit: [3, 12], death: [11, 12] } },
    // Tanker: Fantasy Warrior (fw=162, kiếm to + khiên, 3 combo)
    tanker: { fw: 162, fh: 162, cx: 85.5, fy: 101, s: 1.25, combo: ['attack1', 'attack2', 'attack3'],
      anims: { idle: [10, 10], run: [8, 14], jump: [3, 10], fall: [3, 10], attack1: [7, 16], attack2: [7, 16], attack3: [8, 16], hit: [3, 12], death: [7, 10] } },
    // Trị Liệu Sư: Evil Wizard 2 tái dụng với tint xanh lá (fw=250, staff heal)
    tri_lieu_su: { fw: 250, fh: 250, cx: 136, fy: 167, s: 0.9, combo: ['attack1', 'attack2'],
      tint: 0x80ffb0,  // tint xanh lá nhạt để phân biệt với toan_nang
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
    for (const [id, c] of Object.entries(CHARS)) for (const [a, [n, r]] of Object.entries(c.anims)) mk('ch', id, a, n, r, loops.has(a));
    for (const [id, m] of Object.entries(MOBS)) for (const [a, [n, r]] of Object.entries(m.anims)) mk('mb', id, a, n, r, loops.has(a));
  }

  // Chọn kiểu lọc ảnh theo độ phóng thực trên màn hình (tỉ lệ bộ hình × độ nét khung nhìn k):
  //  - phóng từ ~1.75 lần trở lên: giữ điểm ảnh sắc (NEAREST), các ô vuông gần như đều nhau
  //  - phóng ít hoặc thu nhỏ (Pháp Sư, Toàn Năng...): lọc mượt (LINEAR) để không mất hàng điểm ảnh, không răng cưa
  function applyFilters(scene, k) {
    const { NEAREST, LINEAR } = Phaser.Textures.FilterMode;
    const set = (prefix, id, def) => {
      const mode = def.s * k >= 1.75 ? NEAREST : LINEAR;
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

  // Đặt gốc tọa độ và khung va chạm sao cho: x là tâm thân, chân ở y+30, khung va chạm 18x46 như cũ
  function fitPlayer(sprite, id, flip) {
    const c = CHARS[id];
    const cx = flip ? c.fw - c.cx : c.cx;
    sprite.setScale(c.s);
    sprite.setOrigin(cx / c.fw, (c.fy - 30 / c.s) / c.fh);
    sprite.body.setSize(18 / c.s, 46 / c.s, false);
    sprite.body.setOffset(cx - 9 / c.s, c.fy - 46 / c.s);
    // Tint cố định theo class (ví dụ tri_lieu_su tái dụng sheet toan_nang với màu xanh lá)
    if (c.tint) sprite.setTint(c.tint); else sprite.clearTint();
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

  return { CHARS, MOBS, LOOK, LOOK_TINT, needed, preload, background, skip, createAnims, applyFilters, hasChar, hasMob, mobOf, fitPlayer, fitMob };
})();
