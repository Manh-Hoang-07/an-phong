'use strict';
/* WorldScene · Bản đồ: đọc file bản đồ, dựng nền, ô đất, trang trí, cổng, NPC. */
WorldScene.mix(class WorldMap {
  // ------------------------------------------------------------------ Bản đồ
  parseMap() {
    const raw = this.cache.text.get('map_' + this.mapId).replace(/\r/g, '').split('\n').filter(l => l.length);
    this.rows = raw.length;
    const sourceCols = Math.max(...raw.map(l => l.length));
    this.cols = Math.ceil(sourceCols * 1.5);
    // Kéo giãn từng cột 1,5 lần; các ký hiệu chức năng chỉ giữ ở bản sao đầu tiên
    // để không nhân đôi cổng, NPC hay điểm xuất hiện quái.
    const meta = GameData.MAPS[this.mapId];
    const markers = new Set(['S', ...Object.keys(meta.spawns || {}), ...Object.keys(meta.npcs || {}), ...Object.keys(meta.portals || {}), meta.gate].filter(Boolean));
    this.grid = raw.map(line => {
      const source = line.padEnd(sourceCols, '.').split('');
      return Array.from({ length: this.cols }, (_, col) => {
        const oldCol = Math.min(sourceCols - 1, Math.floor(col / 1.5));
        const ch = source[oldCol];
        return markers.has(ch) && col !== Math.ceil(oldCol * 1.5) ? '.' : ch;
      });
    });
    // Chỉ thêm vừa đủ hàng đất để lấp kín khung hình (đỡ trơ và không bị nút cảm ứng che)
    const extraRows = Math.max(0, 17 - this.grid.length);
    for (let i = 0; i < extraRows; i++) this.grid.push(Array(this.cols).fill('#'));
    this.rows = this.grid.length;
    this.worldW = this.cols * T;
    this.worldH = this.rows * T;
  }
  cell(r, c) { return (r < 0 || r >= this.rows || c < 0 || c >= this.cols) ? '#' : this.grid[r][c]; }
  isSolid(r, c) { return this.cell(r, c) === '#'; }
  isStand(r, c) { const ch = this.cell(r, c); return ch === '#' || ch === '='; }

  // Mặt đất ngay dưới ô (r, c): trả về y của mặt trên
  groundY(r, c) {
    for (let rr = r + 1; rr < this.rows; rr++) if (this.isStand(rr, c)) return rr * T;
    return this.worldH;
  }
  // Đoạn đứng được liền mạch quanh cột c ở hàng rr (để quái không đi rơi khỏi bục)
  spanAt(rr, c) {
    let a = c, b = c;
    while (a > 0 && this.isStand(rr, a - 1) && !this.isSolid(rr - 1, a - 1)) a--;
    while (b < this.cols - 1 && this.isStand(rr, b + 1) && !this.isSolid(rr - 1, b + 1)) b++;
    return [a * T + 14, (b + 1) * T - 14];
  }
  findChar(ch) {
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.grid[r][c] === ch) return { r, c };
    return null;
  }
  forEachCell(fn) {
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) fn(this.grid[r][c], r, c);
  }

  // Đặt hình vẽ bằng code; hình độ nét cao (HD) tự thu về đúng kích thước cũ
  artImage(x, y, key) {
    return this.add.image(x, y, key).setScale(Art.hdScale(key));
  }

  onAddedText(obj) {
    if (obj.type === 'Text' && obj.style.resolution !== View.textRes) obj.setResolution(View.textRes);
  }

  // Đặt camera theo khung nhìn hiện tại (View): phóng k lần để khung logic phủ kín canvas độ phân giải thật.
  // Vật đặt cố định theo màn hình (scrollFactor khác 1) phải dời thêm screenOff vì camera phóng quanh tâm.
  applyView() {
    const cam = this.cameras.main, k = View.k;
    this.viewW = View.w; this.viewH = View.H;
    this.baseZoom = k;
    if (!(this.zoomTween && this.zoomTween.isPlaying())) cam.setZoom(k);
    const prev = this.screenOff || { x: 0, y: 0 };
    const off = { x: cam.width / 2 * (1 - 1 / k), y: cam.height / 2 * (1 - 1 / k) };
    this.screenOff = off;
    for (const l of this.screenLayers || []) l.setPosition(off.x, off.y).setSize(this.viewW, this.viewH);
    if (this.vignette) this.vignette.setPosition(off.x, off.y).setDisplaySize(this.viewW, this.viewH);
    for (const w of this.weather || []) { w.x += off.x - prev.x; w.y += off.y - prev.y; }
    Sprites.applyFilters(this, k);
    // Chữ vẽ theo độ nét mới
    const res = View.textRes;
    for (const t of this.children.list) if (t.type === 'Text' && t.style.resolution !== res) t.setResolution(res);
  }

  buildBackground() {
    // Cảnh được dựng lại mỗi lần chuyển bản đồ: bỏ tham chiếu tới vật của bản đồ cũ
    this.screenLayers = []; this.vignette = null; this.weather = []; this.screenOff = null; this.zoomTween = null;
    // Chữ mới tạo ra cũng vẽ theo độ nét màn hình
    this.events.off('addedtoscene', this.onAddedText, this);
    this.events.on('addedtoscene', this.onAddedText, this);
    this.look = MapLooks.get(this.mapId, this.theme);   // diện mạo riêng của map (thiếu thì theo theme)
    View.calc();
    this.applyView();
    const w = this.viewW, h = this.viewH;
    // Nền ảnh (giai đoạn A2): chỉ dùng khi cờ bật VÀ texture của pack đã nạp xong; nếu không → nền vẽ code như cũ
    // Công thức nền của map (ghép lớp từ nhiều bộ + chỉnh màu): xem MapLooks.layerDefs. Lớp nào không có ảnh → hình vẽ code.
    const defs = MapLooks.layerDefs(this.look);
    // Trả về khóa texture dùng cho lớp (đã nạp và chỉnh màu nếu cần), hoặc null
    const layerKey = (layer) => {
      const d = defs[layer];
      if (!d) return null;
      const src = `bgimg_${d.pack}_${d.layer}`;
      if (!this.textures.exists(src)) return null;
      const P = MapLooks.PACKS[d.pack];
      if (!MapLooks.needsGrade(d)) {
        this.textures.get(src).setFilter(P.filter === 'nearest' ? Phaser.Textures.FilterMode.NEAREST : Phaser.Textures.FilterMode.LINEAR);
        return src;
      }
      const key = `bgg_${this.mapId}_${layer}`;
      if (!this.textures.exists(key)) {
        try {
          this.textures.addCanvas(key, MapLooks.gradeCanvas(this.textures.get(src).getSourceImage(), d));
          this.textures.get(key).setFilter(P.filter === 'nearest' ? Phaser.Textures.FilterMode.NEAREST : Phaser.Textures.FilterMode.LINEAR);
        } catch (e) { return null; }   // lỗi canvas (hiếm) → hình vẽ code
      }
      return key;
    };
    const tall = this.rows > 20;   // map nhiều tầng: nền trượt dọc
    this.tallLayers = tall ? [] : null;
    const bgTile = (layer, depth) => {
      const key = layerKey(layer);
      if (key) {
        const src = this.textures.get(key).getSourceImage(), d = defs[layer], P = d && MapLooks.PACKS[d.pack];
        let sc = h / src.height, ty = 0;   // vừa khít chiều cao khung, lặp ngang
        if (P && P.cover) {   // cảnh tĩnh: phóng cho phủ kín bề ngang (cắt bớt trên/dưới, giữ giữa) thay vì lộ bản gương ngay từ đầu
          sc = Math.max(sc, w / (src.width / (d.mirror ? 2 : 1)));
          ty = Math.max(0, (src.height - h / sc) / 2);
        }
        if (tall) { sc = Math.max(sc, h * 1.3 / src.height); ty = 0; }
        const ts = this.add.tileSprite(0, 0, w, h, key).setOrigin(0).setScrollFactor(0).setDepth(depth).setTileScale(sc);
        ts.tilePositionY = ty;
        if (tall) this.tallLayers.push({ ts, sc, base: 0, spare: Math.max(0, src.height * sc - h) });
        return ts;
      }
      return this.add.tileSprite(0, 0, w, h, `bg_${this.theme}_${layer}`)
        .setOrigin(0).setScrollFactor(0).setDepth(depth).setTileScale(Art.hdScale(`bg_${this.theme}_${layer}`));
    };
    const sky = bgTile('sky', -30);
    this.bgFar = bgTile('far', -20);
    this.bgNear = bgTile('near', -10);
    this.screenLayers = [sky, this.bgFar, this.bgNear];
    // Lớp giữa (chiều sâu) và sương sát đất (nối nền với mặt đất); đồ họa Thấp bỏ qua cho nhẹ
    this.bgMid = null;
    if (!Quality.low) {
      this.bgMid = bgTile('mid', -15);
      const hazeTint = this.look.haze ?? 0xb8aaa0;
      const hz = this.add.tileSprite(0, 0, w, h, 'bg_haze').setOrigin(0).setScrollFactor(0).setDepth(-7)
        .setTileScale(Art.hdScale('bg_haze')).setTint(hazeTint);
      // Ánh sáng chung của bản đồ: phủ rất nhẹ (nhân màu) lên cảnh, nhân vật, quái, NPC
      // để mọi thứ cùng một tông, không bị "dán" lên nền. Chữ và hiệu ứng nằm trên lớp này nên không bị ảnh hưởng.
      const gradeTint = this.look.grade ?? 0xffffff;
      const grade = this.add.tileSprite(0, 0, w, h, 'fx_grade').setOrigin(0).setScrollFactor(0).setDepth(5.5)
        .setTint(gradeTint).setBlendMode(Phaser.BlendModes.MULTIPLY);
      this.screenLayers.push(this.bgMid, hz, grade);
    }
    if (this.look.bg != null) this.cameras.main.setBackgroundColor(this.look.bg);
    // Hạt sáng bay lơ lửng
    const moteColor = this.look.mote;
    this.motes = [];
    const moteCount = Quality.low ? 0 : (this.look.moteN ?? 14);
    for (let i = 0; i < moteCount; i++) {
      const m = this.add.image(Phaser.Math.Between(0, this.worldW), Phaser.Math.Between(40, this.worldH - 120), 'mote')
        .setTint(moteColor).setAlpha(0.15 + Math.random() * 0.35).setScale(0.3 + Math.random() * 0.6)
        .setDepth(-1).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: m, y: m.y - Phaser.Math.Between(40, 120), x: m.x + Phaser.Math.Between(-60, 60),
        alpha: 0, duration: Phaser.Math.Between(4000, 9000), repeat: -1, delay: Math.random() * 4000,
      });
      this.motes.push(m);
    }
    // Viền tối mềm, giúp khung hình có chiều sâu
    this.vignette = this.add.image(0, 0, 'fx_vignette').setOrigin(0).setScrollFactor(0).setDepth(24);
    this.applyView();
    const onResize = () => this.applyView();
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => this.scale.off('resize', onResize));
  }

  // Ảnh lớn ghép sẵn theo từng khúc 1024px để vẽ hàng nghìn ô gạch chỉ bằng vài lần vẽ
  chunkLayer(depth) {
    const CH = 1024, layer = [];
    for (let x = 0; x < this.worldW; x += CH) {
      layer.push(this.add.renderTexture(x, 0, Math.min(CH, this.worldW - x), this.worldH).setOrigin(0).setDepth(depth));
    }
    layer.queue = layer.map(() => []);
    return layer;
  }
  // Chỉ xếp hàng, chưa vẽ: vẽ dồn một lượt trong flushLayer
  stampTile(key, x, y, layer = this.tileLayer, ox = 0, oy = 0) {
    const fr = this.textures.getFrame(key);
    if (!fr) return;
    const left = x - fr.width * ox, top = y - fr.height * oy;
    const i0 = Math.floor(left / 1024), i1 = Math.floor((left + fr.width - 1) / 1024);
    for (let i = Math.max(0, i0); i <= Math.min(layer.length - 1, i1); i++) layer.queue[i].push(key, left - i * 1024, top);
  }
  // Vẽ mọi ô đã xếp hàng vào từng mảng ảnh ghép trong MỘT lượt vẽ.
  // (drawFrame từng ô thì mỗi ô phải mở/đóng một lượt vẽ GPU riêng: vài trăm ô mất ~300ms trên máy tính, lâu hơn nhiều trên điện thoại)
  flushLayer(layer) {
    layer.forEach((rt, i) => {
      const q = layer.queue[i];
      if (!q.length) return;
      rt.beginDraw();
      for (let j = 0; j < q.length; j += 3) rt.batchDrawFrame(q[j], undefined, q[j + 1], q[j + 2]);
      rt.endDraw();
      q.length = 0;
    });
  }

  // Khóa ô đất của map: biến thể màu riêng (look.decor.tile, xem MapLooks.TILE_VARIANTS) hoặc theo theme.
  // Biến thể tạo MỘT lần từ ô đất gốc bằng chỉnh màu (canvas); thiếu gì thì rơi về ô đất của theme.
  tileKeys() {
    const th = { top: `tile_${this.theme}_top`, fill: `tile_${this.theme}_fill`, plank: `plank_${this.theme}` };
    const v = this.look.decor && this.look.decor.tile, def = v && MapLooks.TILE_VARIANTS[v];
    if (v === 'earth' && this.textures.exists('tile_earth_top')) return { top: 'tile_earth_top', fill: 'tile_earth_fill0', fills: ['tile_earth_fill0', 'tile_earth_fill1', 'tile_earth_fill2'], deeps: ['tile_earth_deep0', 'tile_earth_deep1'], plank: 'plank_earth' };
    if (!def) return th;
    const out = {};
    for (const slot of ['top', 'fill', 'plank']) {
      const base = slot === 'plank' ? `plank_${def.from}` : `tile_${def.from}_${slot}`, key = `tilev_${v}_${slot}`;
      if (!this.textures.exists(key) && this.textures.exists(base)) {
        try {
          this.textures.addCanvas(key, MapLooks.gradeCanvas(this.textures.get(base).getSourceImage(), def));
          this.textures.get(key).setFilter(this.textures.get(base).source[0].scaleMode);
        } catch (e) { /* lỗi canvas → ô đất theme */ }
      }
      out[slot] = this.textures.exists(key) ? key : th[slot];
    }
    return out;
  }

  // Biến thể ô đất có viền theo hàng xóm (tạo một lần từ ô gốc bằng canvas, lưu cache theo khóa)
  edgeTileKey(baseKey, mask, R, soft) {
    return mask ? this.edgeOutline(baseKey, mask, R, soft) : baseKey;
  }
  edgeOutline(baseKey, mask, R, soft) {
    const key = `${baseKey}~e${mask}${soft ? 's' : ''}`;
    if (this.textures.exists(key)) return key;
    if (!this.textures.exists(baseKey)) return baseKey;
    try {
      const tex = this.textures.get(baseKey), src = tex.getSourceImage(), w = src.width, h = src.height, s = w / 32;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const g = cv.getContext('2d');
      g.drawImage(src, 0, 0);
      const r = R * s, N = mask & 1, E = mask & 2, S = mask & 4, W = mask & 8;
      const cTL = N && W, cTR = N && E, cBR = S && E, cBL = S && W;
      // Cắt bo góc
      g.globalCompositeOperation = 'destination-out';
      g.beginPath();
      if (cTL) { g.moveTo(0, 0); g.lineTo(r, 0); g.arc(r, r, r, 1.5 * Math.PI, Math.PI, true); g.closePath(); }
      if (cTR) { g.moveTo(w, 0); g.lineTo(w - r, 0); g.arc(w - r, r, r, 1.5 * Math.PI, 0, false); g.closePath(); }
      if (cBR) { g.moveTo(w, h); g.lineTo(w, h - r); g.arc(w - r, h - r, r, 0, 0.5 * Math.PI, false); g.closePath(); }
      if (cBL) { g.moveTo(0, h); g.lineTo(r, h); g.arc(r, h - r, r, 0.5 * Math.PI, Math.PI, false); g.closePath(); }
      g.fill();
      // Đổ bóng/sáng rồi viền tối (chỉ vẽ lên phần còn lại của ô)
      g.globalCompositeOperation = 'source-atop';
      if (S && !soft) { const gr = g.createLinearGradient(0, h - 9 * s, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,6,2,0.35)'); g.fillStyle = gr; g.fillRect(0, h - 9 * s, w, 9 * s); }
      if (W && !soft) { g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(2 * s, 0, 2 * s, h); }
      if (E && !soft) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(w - 5 * s, 0, 3 * s, h); }
      g.strokeStyle = soft ? 'rgba(40,24,14,0.6)' : 'rgba(28,18,10,0.85)'; g.lineWidth = (soft ? 4 : 3) * s; g.lineCap = 'butt';
      g.beginPath();
      if (N) { g.moveTo(cTL ? r : 0, 0); g.lineTo(cTR ? w - r : w, 0); }
      if (E) { g.moveTo(w, cTR ? r : 0); g.lineTo(w, cBR ? h - r : h); }
      if (S) { g.moveTo(cBL ? r : 0, h); g.lineTo(cBR ? w - r : w, h); }
      if (W) { g.moveTo(0, cTL ? r : 0); g.lineTo(0, cBL ? h - r : h); }
      if (cTL) { g.moveTo(0, r); g.arc(r, r, r, Math.PI, 1.5 * Math.PI); }
      if (cTR) { g.moveTo(w - r, 0); g.arc(w - r, r, r, 1.5 * Math.PI, 2 * Math.PI); }
      if (cBR) { g.moveTo(w, h - r); g.arc(w - r, h - r, r, 0, 0.5 * Math.PI); }
      if (cBL) { g.moveTo(r, h); g.arc(r, h - r, r, 0.5 * Math.PI, Math.PI); }
      g.stroke();
      this.textures.addCanvas(key, cv);
      this.textures.get(key).setFilter(tex.source[0].scaleMode);
      return key;
    } catch (e) { return baseKey; }
  }

  // Thân đất: ô sâu trong lõi (4 hướng cách mép ≥ 3 ô) dùng đá sẫm, ô gần mép dùng đất sáng; xen kẽ biến thể
  fillKey(tk, r, k) {
    if (!tk.fills) return tk.fill;
    return tk.fills[(k * 7 + r * 13) % tk.fills.length];
  }
  // Lõi sâu: mọi ô trong bán kính 2 đều là đất đặc
  isDeep(r, k) {
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) if (this.cell(r + dr, k + dc) !== '#') return false;
    return true;
  }

  // Lõi sâu cho theme không phải đất nâu: ô thân tối hơn kèm vài mảng đá lớn
  deepTile(fillKey, v) {
    const key = `${fillKey}~deep${v}`;
    if (this.textures.exists(key)) return key;
    if (!this.textures.exists(fillKey)) return fillKey;
    try {
      const tex = this.textures.get(fillKey), src = tex.getSourceImage(), w = src.width, h = src.height;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const g = cv.getContext('2d');
      g.drawImage(src, 0, 0);
      g.fillStyle = 'rgba(8,6,14,0.42)'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.ellipse(((i * 11 + v * 7) % 24 + 4) * w / 32, ((i * 13 + v * 5) % 22 + 5) * h / 32, 7 * w / 32, 4 * h / 32, 0, 0, 7); g.fill(); }
      this.textures.addCanvas(key, cv);
      this.textures.get(key).setFilter(tex.source[0].scaleMode);
      return key;
    } catch (e) { return fillKey; }
  }

  buildTiles() {
    this.tileLayer = this.chunkLayer(-2);
    this.solids = this.physics.add.staticGroup();
    this.platforms = this.physics.add.staticGroup();
    const tk = this.tileKeys();
    if (!tk.deeps && this.rows > 20) tk.deeps = [this.deepTile(tk.fill, 0), this.deepTile(tk.fill, 1)];
    const addBody = (group, x, y, w, h, oneWay) => {
      const z = this.add.zone(x + w / 2, y + h / 2, w, h);
      this.physics.add.existing(z, true);
      if (oneWay) { z.body.checkCollision.down = false; z.body.checkCollision.left = false; z.body.checkCollision.right = false; }
      group.add(z);
    };
    for (let r = 0; r < this.rows; r++) {
      let c = 0;
      while (c < this.cols) {
        const ch = this.grid[r][c];
        if (ch !== '#' && ch !== '=') { c++; continue; }
        let e = c;
        while (e + 1 < this.cols && this.grid[r][e + 1] === ch) e++;
        if (ch === '#') addBody(this.solids, c * T, r * T, (e - c + 1) * T, T, false);
        else addBody(this.platforms, c * T, r * T, (e - c + 1) * T, 12, true);
        for (let k = c; k <= e; k++) {
          if (ch === '#') {
            const top = !this.isSolid(r - 1, k);
            // Mặt lộ ra ngoài (bit: 1 trên, 2 phải, 4 dưới, 8 trái) → bo góc + viền tối kiểu vách đất
            const mask = (top ? 1 : 0) | (this.isSolid(r, k + 1) ? 0 : 2) | (this.isSolid(r + 1, k) ? 0 : 4) | (this.isSolid(r, k - 1) ? 0 : 8);
            this.stampTile(this.edgeTileKey(top ? tk.top : this.fillKey(tk, r, k), mask, 10), k * T, r * T);
            if (tk.deeps && this.rows > 20 && this.isDeep(r, k)) {   // lõi đá sẫm đè lên, bo góc mềm
              const dm = (this.isDeep(r - 1, k) ? 0 : 1) | (this.isDeep(r, k + 1) ? 0 : 2) | (this.isDeep(r + 1, k) ? 0 : 4) | (this.isDeep(r, k - 1) ? 0 : 8);
              this.stampTile(this.edgeTileKey(tk.deeps[(k * 5 + r * 3) % tk.deeps.length], dm, 12, true), k * T, r * T);
            }
          } else {
            const mask = 1 | 4 | (this.cell(r, k + 1) === '=' ? 0 : 2) | (this.cell(r, k - 1) === '=' ? 0 : 8);
            this.stampTile(this.edgeTileKey(tk.plank, mask, 4), k * T, r * T);
          }
        }
        c = e + 1;
      }
    }
    this.flushLayer(this.tileLayer);
  }

  // Cảnh trí ảnh (bộ cắt sẵn trong public/assets/props, xem MapProps): trả về sprite hoặc null nếu bộ/ảnh chưa nạp
  addProp(set, c, x, y, originY, depth, tint) {
    const def = MapProps.SETS[set];
    if (!def) return null;
    const key = `prop_${set}_${1 + ((c * 7 + originY * 3) % def.n)}`;
    if (!this.textures.exists(key)) return null;
    const img = this.add.image(x, y, key).setOrigin(0.5, originY).setDepth(depth).setScale(0.5 * (0.85 + ((c * 13) % 30) / 100));
    if (tint != null) img.setTint(tint);
    return img;
  }
  // Lay nhẹ quanh gốc (đồ họa Thấp bỏ qua)
  swayProp(img, c, amp = 1.2) {
    if (!img || Quality.low) return;
    const a = amp + (c % 3) * 0.3;
    img.setAngle(-a);
    this.tweens.add({ targets: img, angle: a, duration: 2600 + (c % 5) * 380, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: (c % 7) * 260 });
  }

  buildDecorations() {
    // Cấu hình cảnh trí riêng của map (MapDecor trong map_scenes.js): tree / ceil / floor = tên bộ ảnh hoặc 'none'; tint; bits; sway
    const D = this.look.decor || {}, has = (n) => !!(n && MapProps.SETS[n]);
    const tint = D.tint;
    this.forEachCell((ch, r, c) => {
      const x = c * T + T / 2;
      if (ch === '$') this.artImage(x, this.groundY(r, c), 'd_shop_' + (c % 3)).setOrigin(0.5, 1).setDepth(-5);
      else if (ch === '!') {
        const l = this.artImage(x, this.groundY(r, c), { city: 'd_lamp', redgate: 'd_redcrystal' }[this.theme] || 'd_crystal').setOrigin(0.5, 1).setDepth(-4);
        if (tint != null) l.setTint(tint);
        this.tweens.add({ targets: l, alpha: 0.85, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1 });
      } else if (ch === '&') {
        const gy = this.groundY(r, c);
        if (D.tree === 'none') return;
        const img = has(D.tree) ? this.addProp(D.tree, c, x, gy, 1, -6, tint) : null;
        if (img) { if (D.sway !== false) this.swayProp(img, c); return; }
        const v = (c * 7) % 3;
        const key = { city: 'd_tree', forest: v === 1 ? 'd_dtree' : 'd_shroom', cave: 'd_crystal', redgate: 'd_redcrystal' }[this.theme];
        const tree = this.artImage(x, gy, key).setOrigin(0.5, 1).setDepth(-6);
        if (tint != null) tree.setTint(tint);
        // Cây đung đưa rất nhẹ (chỉ map khai báo sway; đồ họa Thấp bỏ qua)
        if (this.look.sway && !Quality.low && (this.theme === 'forest' || this.theme === 'city')) {
          const a = 0.7 + (c % 3) * 0.35;
          tree.setAngle(-a);
          this.tweens.add({ targets: tree, angle: a, duration: 2600 + (c % 5) * 380, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: (c % 7) * 260 });
        }
      } else if (ch === '^') {
        if (this.isSolid(r - 1, c)) {   // nhũ đá treo trần
          if (D.ceil === 'none') return;
          if (has(D.ceil) && this.addProp(D.ceil, c, x, r * T, 0, -4, tint)) return;
          const st = this.artImage(x, r * T, 'd_stalactite').setOrigin(0.5, 0).setDepth(-4);
          if (this.theme === 'redgate') st.setTint(0xff8a96); else if (tint != null) st.setTint(tint);
        } else {   // vật mọc trên nền
          if (D.floor === 'none') return;
          const gy = this.groundY(r, c);
          const img = has(D.floor) ? this.addProp(D.floor, c, x, gy, 1, -4, tint) : null;
          if (img) { if (D.sway !== false) this.swayProp(img, c, 1.8); return; }
          const cr = this.artImage(x, gy, this.theme === 'redgate' ? 'd_redcrystal' : 'd_crystal').setOrigin(0.5, 1).setDepth(-4);
          if (tint != null) cr.setTint(tint);
        }
      }
    });

    // Cỏ, hoa, sỏi mọc rải rác trên mặt đất cho đỡ trơ (bộ ảnh 'bits' của map thay cho hình vẽ code nếu có)
    const bits = { city: ['d_rubble', 'd_pebble', 'd_pebble'], forest: ['d_grass', 'd_flower', 'd_grass'], cave: ['d_pebble', 'd_rubble'], redgate: ['d_pebble', 'd_rubble'] };
    const list = bits[this.theme] || bits.forest;
    const bitSet = has(D.bits) ? D.bits : null;
    const bitLayer = this.chunkLayer(-1);
    // Map có grassSway: cỏ/hoa là sprite riêng (lay khi nhân vật đi ngang); còn lại vẽ gộp như cũ cho nhẹ
    const swayGrass = !!this.look.grassSway && !Quality.low && this.theme === 'forest' && !bitSet;
    this.grassSprites = [];
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      if (!this.isSolid(r, c) || this.isSolid(r - 1, c)) continue;
      const h = (r * 71 + c * 137) % 100;
      if (h > 44) continue;
      const gx = c * T + 4 + (h * 13) % 21, gy = r * T + 2;
      if (bitSet) {
        const key = `prop_${bitSet}_${1 + (h % MapProps.SETS[bitSet].n)}`;
        if (this.textures.exists(key)) {
          const s2 = this.add.image(gx, gy, key).setOrigin(0.5, 1).setDepth(-1).setScale(0.5 * (0.8 + (h % 5) / 10));
          if (tint != null) s2.setTint(tint);
        }
        continue;
      }
      const key = list[h % list.length];
      if (swayGrass && (key === 'd_grass' || key === 'd_flower')) {
        const s = this.add.image(gx, gy, key).setOrigin(0.5, 1).setDepth(-1);
        this.grassSprites.push(s);
        this.tweens.add({ targets: s, angle: { from: -2.5, to: 2.5 }, duration: 1800 + (h % 9) * 140, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: (h % 11) * 150 });
      } else this.stampTile(key, gx, gy, bitLayer, 0.5, 1);
    }
    this.flushLayer(bitLayer);
  }

  // Thác nước '%' (rơi từ trên xuống, nằm sau ô đất) và hồ nước '"' (phủ mờ lên nhân vật như đang lội)
  buildWater() {
    this.falls = []; this.pools = [];
    if (!this.textures.exists('fx_fall')) return;
    // Bục '=' nằm giữa hai đoạn thác thì nước vẫn chảy liền phía sau bục
    const isFall = (r, c) => { const ch = this.grid[r]?.[c]; return ch === '%' || (ch === '=' && this.grid[r - 1]?.[c] === '%' && this.grid[r + 1]?.[c] === '%'); };
    for (let c = 0; c < this.cols; c++) {
      let r = 0;
      while (r < this.rows) {
        if (!isFall(r, c)) { r++; continue; }
        let e = r;
        while (e + 1 < this.rows && isFall(e + 1, c)) e++;
        this.falls.push(this.add.tileSprite(c * T, r * T, T, (e - r + 1) * T, 'fx_fall').setOrigin(0).setDepth(-3).setAlpha(0.88));
        // bọt nước ở chân thác
        const fx = c * T + T / 2, fy = (e + 1) * T;
        if (!Quality.low && c % 2 === 0) {
          const foam = this.add.image(fx, fy - 4, 'mote').setTint(0xffffff).setBlendMode(Phaser.BlendModes.ADD).setDepth(4.3).setScale(1.6).setAlpha(0.5);
          this.tweens.add({ targets: foam, scale: 2.6, alpha: 0.1, y: fy - 16, duration: 900 + (c % 5) * 120, repeat: -1, delay: (c % 7) * 130 });
        }
        r = e + 1;
      }
    }
    for (let r = 0; r < this.rows; r++) {
      let c = 0;
      while (c < this.cols) {
        if (this.grid[r][c] !== '"') { c++; continue; }
        let e = c;
        while (e + 1 < this.cols && this.grid[r][e + 1] === '"') e++;
        this.pools.push(this.add.tileSprite(c * T, r * T, (e - c + 1) * T, T, 'fx_water').setOrigin(0).setDepth(4.2).setAlpha(this.grid[r - 1]?.[c] === '"' ? 0.4 : 0.6));
        c = e + 1;
      }
    }
  }
  updateWater(time) {
    for (const f of this.falls || []) f.tilePositionY = -time * 0.22;
    for (const p of this.pools || []) p.tilePositionX = time * 0.015;
  }

  // Bản đồ có gate chỉ dựng một cổng gom nhiều điểm đến; bản đồ thường dựng cổng
  // ở từng ký hiệu để giữ riêng lối vào và lối ra.
  buildPortals() {
    const gm = this.meta.gate, gates = Object.keys(this.meta.portals || {}).filter(ch => !gm || ch === '<' || ch === gm);
    for (const ch of gates) {
      const pos = this.findChar(ch);
      if (!pos) continue;
      const def = this.meta.portals[ch];
      const x = pos.c * T + T / 2, y = this.groundY(pos.r, pos.c);
      const img = this.artImage(x, y, 'd_portal').setOrigin(0.5, 1).setDepth(-3).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: img, scaleX: img.scaleX * 0.85, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const label = this.add.text(x, y - 128, '', {
        fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontSize: '13px', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(5);
      this.portals.push({ ch, x, y, def, img, label });
    }
    this.refreshPortals();
  }

  refreshPortals() {
    for (const p of this.portals) {
      const dests = GameData.gateDestinations(App.player, this.mapId, p.ch);
      const open = dests.filter(d => d.ok).length;
      if (this.meta.gate && p.ch === this.meta.gate) {
        p.label.setText(`Cổng dịch chuyển · ${open}/${dests.length} nơi`).setColor(open ? '#e1d5ff' : '#bbbbbb');
      } else {
        const d = dests.find(x => x.ch === p.ch);
        if (d) p.label.setText((d.ok ? '' : '🔒 ') + d.name).setColor(d.ok ? '#e1d5ff' : '#bbbbbb');
      }
    }
  }

  buildNpcs() {
    for (const ch in this.meta.npcs) {
      const pos = this.findChar(ch);
      if (!pos) continue;
      const id = this.meta.npcs[ch];
      const x = pos.c * T + T / 2, y = this.groundY(pos.r, pos.c);
      const s = this.artImage(x, y, 'npc_' + id).setOrigin(0.5, 1).setDepth(2).setFlipX(x > this.worldW / 2);
      this.tweens.add({ targets: s, scaleY: s.scaleY * 1.02, duration: 1200 + Math.random() * 500, yoyo: true, repeat: -1 });
      const label = this.add.text(x, y - 70, GameData.NPCS[id].name, {
        fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontSize: '12px', color: '#ffe9a8', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(5);
      const mark = this.add.image(x, y - 90, 'mark_quest').setDepth(5).setVisible(false);
      this.tweens.add({ targets: mark, y: y - 96, duration: 500, yoyo: true, repeat: -1 });
      s.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.talkTo(id, x));
      // bóng mờ dưới chân để NPC "đứng" trên mặt đất
      const shadow = this.add.image(x, y - 1, 'shadow').setDepth(1.9).setScale(0.9, 1);
      this.npcs.push({ id, x, y, sprite: s, mark, label, shadow });
    }
    this.refreshNpcMarks();
  }

  addHiddenNpc() {
    if (this.mapId !== 'lang' || !App.player.hiddenNpcActive || this.hiddenNpcSprite) return;
    const x = Phaser.Math.Clamp((this.player?.x || this.worldW * 0.5) + 100, 50, this.worldW - 50);
    const y = this.groundY(Math.max(0, Math.floor((this.player?.y || 0) / T)), Math.floor(x / T));
    const sprite = this.add.container(x, y - 28).setDepth(5);
    const body = this.add.image(0, 28, 'npc_npc_an').setOrigin(0.5, 1).setScale(Art.hdScale('npc_npc_an'));   // chân ở gốc container +28 = mặt đất
    this.tweens.add({ targets: body, y: 24, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // lơ lửng nhẹ
    const label = this.add.text(0,-52,'Người Gác Màn',{fontSize:'12px',color:'#e1c6ff',stroke:'#000',strokeThickness:3}).setOrigin(.5);
    sprite.add([body,label]).setSize(44,62).setInteractive(new Phaser.Geom.Rectangle(-22,-58,44,62),Phaser.Geom.Rectangle.Contains).on('pointerdown',()=>this.talkTo('npc_an',x));
    this.hiddenNpcSprite=sprite; this.npcs.push({id:'npc_an',x,y,sprite,label,mark:{setVisible(){}},visible:true});
  }

  refreshNpcMarks() {
    const p = App.player;
    if (this.portals) this.refreshPortals();
    const q = GameData.QUESTS[p.quest.step];
    for (const n of this.npcs) {
      n.visible = n.id === 'npc_an' ? this.mapId === 'lang' && !!p.hiddenNpcActive : GameData.npcHere(p, this.mapId, n.id);
      n.sprite.setVisible(n.visible); n.label.setVisible(n.visible);
      if (n.shadow) n.shadow.setVisible(n.visible);
      if (!n.visible) { n.mark.setVisible(false); continue; }
      let key = null;
      if (q && q.npc === n.id) {
        if (p.quest.state === 'none') key = 'mark_quest';
        else if (UI.questReady()) key = 'mark_done';
      }
      if (q && p.quest.state === 'active' && q.obj.visit && q.obj.visit.includes(n.id) && !p.quest.progress.visit?.[n.id]) key = 'mark_quest';
      n.mark.setVisible(!!key);
      if (key && n.mark.setTexture) n.mark.setTexture(key);
    }
  }
});
