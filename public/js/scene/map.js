'use strict';
/* WorldScene · Bản đồ: đọc file bản đồ, dựng nền, ô đất, trang trí, cổng, NPC. */
WorldScene.mix(class WorldMap {
  // ------------------------------------------------------------------ Bản đồ
  parseMap() {
    const raw = this.cache.text.get('map_' + this.mapId).replace(/\r/g, '').split('\n').filter(l => l.length);
    this.rows = raw.length;
    this.cols = Math.max(...raw.map(l => l.length));
    this.grid = raw.map(l => l.padEnd(this.cols, '.').split(''));
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
    View.calc();
    this.applyView();
    const w = this.viewW, h = this.viewH;
    const bgTile = (layer, depth) => this.add.tileSprite(0, 0, w, h, `bg_${this.theme}_${layer}`)
      .setOrigin(0).setScrollFactor(0).setDepth(depth).setTileScale(Art.hdScale(`bg_${this.theme}_${layer}`));
    const sky = bgTile('sky', -30);
    this.bgFar = bgTile('far', -20);
    this.bgNear = bgTile('near', -10);
    this.screenLayers = [sky, this.bgFar, this.bgNear];
    // Lớp giữa (chiều sâu) và sương sát đất (nối nền với mặt đất); đồ họa Thấp bỏ qua cho nhẹ
    this.bgMid = null;
    if (!Quality.low) {
      this.bgMid = bgTile('mid', -15);
      const hazeTint = { city: 0xd3a37c, forest: 0xc8c4a0, cave: 0x91b7b2, redgate: 0xd89178 }[this.theme] || 0xb8aaa0;
      const hz = this.add.tileSprite(0, 0, w, h, 'bg_haze').setOrigin(0).setScrollFactor(0).setDepth(-7)
        .setTileScale(Art.hdScale('bg_haze')).setTint(hazeTint);
      // Ánh sáng chung của bản đồ: phủ rất nhẹ (nhân màu) lên cảnh, nhân vật, quái, NPC
      // để mọi thứ cùng một tông, không bị "dán" lên nền. Chữ và hiệu ứng nằm trên lớp này nên không bị ảnh hưởng.
      const gradeTint = { city: 0xffeedc, forest: 0xffead1, cave: 0xd7ece4, redgate: 0xffd9c2 }[this.theme] || 0xffffff;
      const grade = this.add.tileSprite(0, 0, w, h, 'fx_grade').setOrigin(0).setScrollFactor(0).setDepth(5.5)
        .setTint(gradeTint).setBlendMode(Phaser.BlendModes.MULTIPLY);
      this.screenLayers.push(this.bgMid, hz, grade);
    }
    if (this.theme === 'cave') this.cameras.main.setBackgroundColor(0x182735);
    if (this.theme === 'redgate') this.cameras.main.setBackgroundColor(0x21182c);
    // Hạt sáng bay lơ lửng
    const moteColor = { city: 0xf0c37f, forest: 0xe7b773, cave: 0xb7d9c7, redgate: 0xf1ae83 }[this.theme];
    this.motes = [];
    const moteCount = Quality.low ? 0 : 14;
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

  buildTiles() {
    this.tileLayer = this.chunkLayer(-2);
    this.solids = this.physics.add.staticGroup();
    this.platforms = this.physics.add.staticGroup();
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
            this.stampTile(`tile_${this.theme}_${top ? 'top' : 'fill'}`, k * T, r * T);
          } else {
            this.stampTile(`plank_${this.theme}`, k * T, r * T);
          }
        }
        c = e + 1;
      }
    }
    this.flushLayer(this.tileLayer);
  }

  buildDecorations() {
    this.forEachCell((ch, r, c) => {
      const x = c * T + T / 2;
      if (ch === '$') this.artImage(x, this.groundY(r, c), 'd_shop_' + (c % 3)).setOrigin(0.5, 1).setDepth(-5);
      else if (ch === '!') {
        const l = this.artImage(x, this.groundY(r, c), { city: 'd_lamp', redgate: 'd_redcrystal' }[this.theme] || 'd_crystal').setOrigin(0.5, 1).setDepth(-4);
        this.tweens.add({ targets: l, alpha: 0.85, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1 });
      } else if (ch === '&') {
        const v = (c * 7) % 3;
        const key = { city: 'd_tree', forest: v === 1 ? 'd_dtree' : 'd_shroom', cave: 'd_crystal', redgate: 'd_redcrystal' }[this.theme];
        this.artImage(x, this.groundY(r, c), key).setOrigin(0.5, 1).setDepth(-6);
      } else if (ch === '^') {
        if (this.isSolid(r - 1, c)) { const st = this.artImage(x, r * T, 'd_stalactite').setOrigin(0.5, 0).setDepth(-4); if (this.theme === 'redgate') st.setTint(0xff8a96); }
        else this.artImage(x, this.groundY(r, c), this.theme === 'redgate' ? 'd_redcrystal' : 'd_crystal').setOrigin(0.5, 1).setDepth(-4);
      }
    });

    // Cỏ, hoa, sỏi mọc rải rác trên mặt đất cho đỡ trơ
    const bits = { city: ['d_rubble', 'd_pebble', 'd_pebble'], forest: ['d_grass', 'd_flower', 'd_grass'], cave: ['d_pebble', 'd_rubble'], redgate: ['d_pebble', 'd_rubble'] };
    const list = bits[this.theme] || bits.forest;
    const bitLayer = this.chunkLayer(-1);
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      if (!this.isSolid(r, c) || this.isSolid(r - 1, c)) continue;
      const h = (r * 71 + c * 137) % 100;
      if (h > 44) continue;
      const key = list[h % list.length];
      this.stampTile(key, c * T + 4 + (h * 13) % 21, r * T + 2, bitLayer, 0.5, 1);
    }
    this.flushLayer(bitLayer);
  }

  // Bản đồ có gate chỉ dựng một cổng gom nhiều điểm đến; bản đồ thường dựng cổng
  // ở từng ký hiệu để giữ riêng lối vào và lối ra.
  buildPortals() {
    const gates = this.meta.gate ? [this.meta.gate] : Object.keys(this.meta.portals || {});
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
    const dests = GameData.gateDestinations(App.player, this.mapId);
    const open = dests.filter(d => d.ok).length;
    for (const p of this.portals) {
      if (this.meta.gate) {
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

  refreshNpcMarks() {
    const p = App.player;
    if (this.portals) this.refreshPortals();
    const q = GameData.QUESTS[p.quest.step];
    for (const n of this.npcs) {
      n.visible = GameData.npcHere(p, this.mapId, n.id);
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
      if (key) n.mark.setTexture(key);
    }
  }
});
