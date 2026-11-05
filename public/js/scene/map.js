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

  buildBackground() {
    const w = this.scale.width, h = this.scale.height;
    this.add.tileSprite(0, 0, w, h, `bg_${this.theme}_sky`).setOrigin(0).setScrollFactor(0).setDepth(-30);
    this.bgFar = this.add.tileSprite(0, 0, w, h, `bg_${this.theme}_far`).setOrigin(0).setScrollFactor(0).setDepth(-20);
    this.bgNear = this.add.tileSprite(0, 0, w, h, `bg_${this.theme}_near`).setOrigin(0).setScrollFactor(0).setDepth(-10);
    if (this.theme === 'cave') this.cameras.main.setBackgroundColor(0x0e1016);
    if (this.theme === 'redgate') this.cameras.main.setBackgroundColor(0x12060a);
    // Hạt sáng bay lơ lửng
    const moteColor = { city: 0xffe6a0, forest: 0x7fffd4, cave: 0xb388ff, redgate: 0xff5c5c }[this.theme];
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
    this.vignette.setDisplaySize(this.scale.width, this.scale.height);
    const layers = this.children.list.filter(c => c.type === 'TileSprite');
    const onResize = (size) => {
      for (const l of layers) l.setSize(size.width, size.height);
      if (this.vignette) this.vignette.setDisplaySize(size.width, size.height);
    };
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => this.scale.off('resize', onResize));
  }

  // Ảnh lớn ghép sẵn theo từng khúc 1024px để vẽ hàng nghìn ô gạch chỉ bằng vài lần vẽ
  chunkLayer(depth) {
    const CH = 1024, layer = [];
    for (let x = 0; x < this.worldW; x += CH) {
      layer.push(this.add.renderTexture(x, 0, Math.min(CH, this.worldW - x), this.worldH).setOrigin(0).setDepth(depth));
    }
    return layer;
  }
  stampTile(key, x, y, layer = this.tileLayer, ox = 0, oy = 0) {
    const fr = this.textures.getFrame(key);
    if (!fr) return;
    const left = x - fr.width * ox, top = y - fr.height * oy;
    const i0 = Math.floor(left / 1024), i1 = Math.floor((left + fr.width - 1) / 1024);
    for (let i = Math.max(0, i0); i <= Math.min(layer.length - 1, i1); i++) layer[i].drawFrame(key, undefined, left - i * 1024, top);
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
  }

  buildDecorations() {
    this.forEachCell((ch, r, c) => {
      const x = c * T + T / 2;
      if (ch === '$') this.add.image(x, this.groundY(r, c), 'd_shop_' + (c % 3)).setOrigin(0.5, 1).setDepth(-5);
      else if (ch === '!') {
        const l = this.add.image(x, this.groundY(r, c), { city: 'd_lamp', redgate: 'd_redcrystal' }[this.theme] || 'd_crystal').setOrigin(0.5, 1).setDepth(-4);
        this.tweens.add({ targets: l, alpha: 0.85, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1 });
      } else if (ch === '&') {
        const v = (c * 7) % 3;
        const key = { city: 'd_tree', forest: v === 1 ? 'd_dtree' : 'd_shroom', cave: 'd_crystal', redgate: 'd_redcrystal' }[this.theme];
        this.add.image(x, this.groundY(r, c), key).setOrigin(0.5, 1).setDepth(-6);
      } else if (ch === '^') {
        if (this.isSolid(r - 1, c)) { const st = this.add.image(x, r * T, 'd_stalactite').setOrigin(0.5, 0).setDepth(-4); if (this.theme === 'redgate') st.setTint(0xff8a96); }
        else this.add.image(x, this.groundY(r, c), this.theme === 'redgate' ? 'd_redcrystal' : 'd_crystal').setOrigin(0.5, 1).setDepth(-4);
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
  }

  buildPortals() {
    for (const ch in this.meta.portals) {
      const pos = this.findChar(ch);
      if (!pos) continue;
      const def = this.meta.portals[ch];
      const x = pos.c * T + T / 2, y = this.groundY(pos.r, pos.c);
      const img = this.add.image(x, y, 'd_portal').setOrigin(0.5, 1).setDepth(-3).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: img, scaleX: 0.85, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const label = this.add.text(x, y - 128, '', {
        fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontSize: '13px', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(5);
      this.portals.push({ ch, x, y, def, img, label });
    }
    this.refreshPortals();
  }

  refreshPortals() {
    for (const p of this.portals) {
      const target = GameData.MAPS[p.def.to];
      const locked = target.require && !GameData.questDone(App.player, target.require);
      p.label.setText((locked ? '🔒 ' : '') + target.name).setColor(locked ? '#bbbbbb' : '#e1d5ff');
    }
  }

  buildNpcs() {
    for (const ch in this.meta.npcs) {
      const pos = this.findChar(ch);
      if (!pos) continue;
      const id = this.meta.npcs[ch];
      const x = pos.c * T + T / 2, y = this.groundY(pos.r, pos.c);
      const s = this.add.image(x, y, 'npc_' + id).setOrigin(0.5, 1).setDepth(2).setFlipX(x > this.worldW / 2);
      this.tweens.add({ targets: s, scaleY: 1.02, duration: 1200 + Math.random() * 500, yoyo: true, repeat: -1 });
      const label = this.add.text(x, y - 70, GameData.NPCS[id].name, {
        fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontSize: '12px', color: '#ffe9a8', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(5);
      const mark = this.add.image(x, y - 90, 'mark_quest').setDepth(5).setVisible(false);
      this.tweens.add({ targets: mark, y: y - 96, duration: 500, yoyo: true, repeat: -1 });
      s.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.talkTo(id, x));
      this.npcs.push({ id, x, y, sprite: s, mark, label });
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
