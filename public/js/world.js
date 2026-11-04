'use strict';
/* Cảnh chơi chính: bản đồ, nhân vật, quái, NPC, chiến đấu. */
const T = GameData.TILE;
const GRAVITY = 1300;
const JUMP_V = 560;

class WorldScene extends Phaser.Scene {
  constructor() { super('World'); }

  init(data) {
    this.mapId = data.map || App.player.map;
    this.arrive = data.arrive || App.player.arrive || null;
  }

  preload() {
    for (const id in GameData.MAPS) this.load.text('map_' + id, '/shared/maps/' + id + '.txt?v=' + Date.now());
    this.load.on('loaderror', () => { /* thiếu ảnh thì dùng hình vẽ bằng code */ });
    if (!this.textures.exists('ch_none_idle')) Sprites.preload(this);
  }

  create() {
    App.scene = this;
    Art.makeAll(this);
    Fx.makeAll(this);
    Sprites.createAnims(this);
    this.meta = GameData.MAPS[this.mapId];
    this.theme = this.meta.theme;
    this.parseMap();

    this.monsters = [];
    this.npcs = [];
    this.portals = [];
    this.projectiles = this.add.group();
    this.cooldowns = { atk: 0 };      // hồi chiêu theo từng kỹ năng
    this.cooldownLen = {};
    this.buffs = {};
    this.pendingKills = [];
    this.killFlush = null;
    this.invulnUntil = this.time.now + 2000;   // bất tử 2 giây khi vừa vào bản đồ
    this.portalReady = this.time.now + 800;
    this.lastGroundAt = 0;
    this.jumpBufferedAt = -1000;
    this.lastHurt = 0;
    this.changing = false;
    this.dead = false;

    this.buildBackground();
    this.buildTiles();
    this.buildDecorations();
    this.buildPortals();
    this.buildNpcs();
    this.buildPlayer();
    this.buildMonsters();
    this.setupJuice();
    this.loots = new Map();
    for (const l of App.player.loot || []) if (l.map === this.mapId) this.addLoot(l, false);

    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12, 0, -90);
    this.cameras.main.fadeIn(300);
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH + 200);

    UI.setMap(this.meta.name);
    Sound.music(this.theme);
    UI.banner(this.meta.name, 1600);
    UI.refresh();

    this.saveTimer = this.time.addEvent({ delay: 10000, loop: true, callback: () => this.autoSave() });
    this.regenTimer = this.time.addEvent({ delay: 2000, loop: true, callback: () => this.regen() });
    this.aura = this.add.graphics().setDepth(5);
    this.events.once('shutdown', () => this.flushKills());
  }

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

  // ------------------------------------------------------------------ Nhân vật
  playerTexKey(frame) {
    return `hunter_${App.player.school || 'none'}_${frame}`;
  }

  buildPlayer() {
    let x, y;
    const p = App.player;
    if (p.x != null && p.y != null && !this.arrive) { x = p.x; y = p.y; }
    else {
      const pos = (this.arrive && this.findChar(this.arrive)) || this.findChar('S') || this.findChar('<') || { r: 2, c: 2 };
      x = pos.c * T + T / 2;
      if (this.arrive === '<') x += 50; else if (this.arrive === '>') x -= 50;
      y = this.groundY(pos.r, pos.c) - 30;
    }
    App.player.arrive = null;
    if (App.hp <= 0) { App.hp = p.hp ?? App.stats.maxHp; App.mp = p.mp ?? App.stats.maxMp; }

    this.shadow = this.add.image(x, y, 'shadow').setDepth(3);
    this.player = this.physics.add.sprite(x, y, this.playerTexKey('idle')).setDepth(4);
    this.player.body.setSize(18, 46).setOffset(11, 14);
    this.sheetId = null;
    this.refreshPlayerLook();
    this.player.body.setMaxVelocity(1200, 1100);
    this.player.setCollideWorldBounds(false);
    this.facing = 1;
    this.weapon = this.add.image(x, y, 'w_kiem').setDepth(5).setOrigin(0.15, 0.5);
    this.updateWeaponLook();

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.platforms, null, () => !this.dropping);

    this.nameTag = this.add.text(x, y - 44, App.player.name, {
      fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontSize: '12px', color: '#ffffff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);
  }

  accent() {
    const h = Art.HUNTERS[App.player.school || 'none'];
    return App.player.school ? h.accent : 0xbfe9ff;
  }

  // Vị trí vũ khí trên tay theo từng loại: kiếm chĩa xuống, cung dựng đứng, trượng cầm thẳng
  placeWeapon() {
    const pl = this.player, f = this.facing, w = this.weapon, wt = App.stats.wtype;
    w.setFlipX(f < 0);
    if (wt === 'cung') {
      w.setPosition(pl.x + f * 12, pl.y + 4).setOrigin(f < 0 ? 0.7 : 0.3, 0.5);
      if (!this.swinging) w.setRotation(0).setScale(1);
    } else if (wt === 'truong') {
      w.setPosition(pl.x + f * 10, pl.y + 8).setOrigin(0.5, 0.7);
      if (!this.swinging) w.setRotation(f * 0.15);
    } else {
      w.setPosition(pl.x + f * 8, pl.y + 8).setOrigin(f < 0 ? 0.85 : 0.15, 0.5);
      if (!this.swinging) w.setRotation(f * -0.7);
    }
  }

  // Dùng hình vẽ sẵn (có hoạt ảnh) nếu có, không thì dùng hình vẽ bằng code
  refreshPlayerLook() {
    const id = App.player.school || 'none';
    const sheet = Sprites.hasChar(this, id) ? id : null;
    if (sheet === this.sheetId && this.sheetId !== undefined && this.fitDone) return;
    this.sheetId = sheet;
    this.fitDone = true;
    const pl = this.player;
    if (sheet) {
      pl.setTexture(`ch_${sheet}_idle`, 0);
      this.fitFacing = this.facing || 1;
      Sprites.fitPlayer(pl, sheet, this.fitFacing < 0);
      pl.setFlipX(this.fitFacing < 0);
      pl.play(`ch_${sheet}_idle`);
    } else {
      pl.anims.stop();
      pl.setScale(1).setOrigin(0.5);
      pl.body.setSize(18, 46).setOffset(11, 14);
      pl.setTexture(this.playerTexKey('idle'));
    }
  }

  // Chọn hoạt ảnh theo trạng thái: chết > bị đánh > đánh > nhảy/rơi > chạy > đứng
  updatePlayerAnim(time, onGround) {
    const pl = this.player, id = this.sheetId;
    if (this.fitFacing !== this.facing) {
      this.fitFacing = this.facing;
      Sprites.fitPlayer(pl, id, this.facing < 0);
      pl.setFlipX(this.facing < 0);
    }
    if (time < (this.attackUntil || 0)) return;
    let a;
    if (time < (this.hitAnimUntil || 0)) a = 'hit';
    else if (!onGround) a = pl.body.velocity.y < 0 ? 'jump' : 'fall';
    else if (Math.abs(pl.body.velocity.x) > 10) a = 'run';
    else a = 'idle';
    pl.play(`ch_${id}_${a}`, true);
  }

  // Hoạt ảnh đánh: đòn liên hoàn 1 → 2 → 3, tốc độ khớp với thời gian hồi đòn
  attackAnim(time, dur, kind = 'basic') {
    const id = this.sheetId;
    if (!id) return;
    const c = Sprites.CHARS[id];
    let a;
    if (kind === 'skill') a = c.combo[c.combo.length - 1];
    else {
      if (time - (this.lastAttackAt || 0) > 900) this.comboIdx = 0;
      a = c.combo[(this.comboIdx || 0) % c.combo.length];
      this.comboIdx = (this.comboIdx || 0) + 1;
    }
    this.lastAttackAt = time;
    const [n, base] = c.anims[a];
    const rate = Math.max(base, n / Math.max(0.18, dur / 1000));
    this.attackUntil = time + n / rate * 1000;
    this.player.play({ key: `ch_${id}_${a}`, frameRate: rate }, false);
  }

  updateWeaponLook() {
    const w = App.stats.wtype;
    this.refreshPlayerLook();
    // Hình vẽ sẵn đã cầm vũ khí trên tay nên ẩn vũ khí rời đi
    this.weapon.setVisible(w !== 'tay' && !this.sheetId);
    if (w !== 'tay') this.weapon.setTexture('w_' + w);
    if (!this.sheetId) this.player.setTexture(this.playerTexKey('idle'));
    const ico = { tay: '👊', kiem: '🗡️', cung: '🏹', truong: '🪄' }[w];
    UI.setAttackIcon(ico);
  }

  // ------------------------------------------------------------------ Quái
  buildMonsters() {
    this.mGroup = this.physics.add.group();
    for (const ch in this.meta.spawns) {
      const id = this.meta.spawns[ch];
      this.forEachCell((c2, r, c) => { if (c2 === ch) this.spawnMonster(id, r, c); });
    }
    this.physics.add.collider(this.mGroup, this.solids);
    this.physics.add.collider(this.mGroup, this.platforms);
  }

  spawnMonster(id, r, c) {
    const def = GameData.MONSTERS[id];
    const x = c * T + T / 2;
    const fly = !!def.fly;
    const y = fly ? r * T + T / 2 : this.groundY(r, c);
    const sheet = Sprites.hasMob(this, def.look) ? Sprites.mobOf(def.look) : null;
    const s = this.physics.add.sprite(x, y, sheet ? `mb_${sheet}_idle` : `m_${def.look}_0`).setOrigin(0.5, 1).setDepth(3);
    this.mGroup.add(s);
    s.body.setAllowGravity(!fly);
    if (sheet) {
      Sprites.fitMob(s, def.look);
      s.play(`mb_${sheet}_idle`);
    } else if (!fly) {
      s.body.setSize(s.width * 0.7, s.height * 0.9).setOffset(s.width * 0.15, s.height * 0.1);
    } else s.body.setSize(s.width * 0.6, s.height * 0.6).setOffset(s.width * 0.2, s.height * 0.2);
    if (fly && !sheet) s.setOrigin(0.5, 0.5);
    const span = fly ? [x - 220, x + 220] : this.spanAt(Math.floor(y / T), c);
    for (const pt of this.portals) {
      if (pt.x < span[0] - 160 || pt.x > span[1] + 160) continue;
      if (pt.x <= x) span[0] = Math.max(span[0], pt.x + 160);
      else span[1] = Math.min(span[1], pt.x - 160);
    }
    if (span[0] > span[1]) span[0] = span[1] = x;
    const m = {
      id, def, sprite: s, sheet, baseTint: Sprites.LOOK_TINT[def.look] || null, baseScale: s.scaleX, hp: def.hp, maxHp: def.hp, homeX: x, homeY: y, span,
      dir: Math.random() < 0.5 ? -1 : 1, aggro: false, nextAttack: 0, nextTurn: 0, slowUntil: 0, freezeUntil: 0,
      nextJump: 0, nextSlam: 0, alive: true, frameT: 0, hitBy: new Set(), state: 'move', stateUntil: 0, enraged: false,
    };
    s.mon = m;
    m.label = this.add.text(x, y, `${def.name} Lv${def.level}`, {
      fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontSize: def.boss ? '14px' : '11px', color: def.boss ? '#ffab40' : '#ffcdd2',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);
    m.bar = this.add.graphics().setDepth(6);
    this.monsters.push(m);
    this.drawMonsterBar(m);
    return m;
  }

  monsterTop(m) {
    const s = m.sprite;
    if (m.sheet) return s.body.y - 4;
    return s.originY === 1 ? s.y - s.height : s.y - s.height / 2;
  }

  drawMonsterBar(m) {
    const s = m.sprite;
    const w = m.def.boss ? 90 : 36;
    const top = this.monsterTop(m);
    m.label.setPosition(s.x, top - 16);
    m.bar.clear();
    if (!m.alive || (m.hp >= m.maxHp && !m.def.boss)) return;
    m.bar.fillStyle(0x000000, 0.6).fillRect(s.x - w / 2 - 1, top - 8, w + 2, 6);
    m.bar.fillStyle(m.def.boss ? 0xff7043 : 0xe53935).fillRect(s.x - w / 2, top - 7, w * Math.max(0, m.hp / m.maxHp), 4);
  }

  // ------------------------------------------------------------------ Vòng lặp
  update(time, delta) {
    if (!this.player) return;
    const cam = this.cameras.main;
    this.bgFar.tilePositionX = cam.scrollX * 0.15;
    this.bgNear.tilePositionX = cam.scrollX * 0.35;
    this.bgFar.tilePositionY = 0;

    if (!this.dead) this.updatePlayer(time, delta);
    for (const m of this.monsters) if (m.alive && this.mobActive(m)) this.updateMonster(m, time);
    this.updateProjectiles(time, delta);
    this.updateLoot(time);

    // Rơi khỏi bản đồ
    if (this.player.y > this.worldH + 100 && !this.dead) {
      const pos = this.findChar('S') || this.findChar('<');
      this.player.setPosition(pos.c * T + T / 2, this.groundY(pos.r, pos.c) - 30);
      this.player.setVelocity(0, 0);
    }
    UI.tick(time, this);
  }

  key(...codes) { return codes.some(c => App.keys[c]); }
  pressed(code) { if (App.keys['_p_' + code]) { App.keys['_p_' + code] = false; return true; } return false; }
  tpressed(name) { if (App.touch['_p_' + name]) { App.touch['_p_' + name] = false; return true; } return false; }

  updatePlayer(time, delta) {
    const pl = this.player, body = pl.body;
    const st = App.stats;
    const canAct = !App.panelOpen && !this.changing;
    const speedMul = 1 + this.buffTotals(time).speed * 0.3;
    const speed = st.speed * speedMul;
    const onGround = body.blocked.down || body.touching.down;
    // Không cho văng ra ngoài mép bản đồ
    if (pl.x < 14 || pl.x > this.worldW - 14) { pl.x = Phaser.Math.Clamp(pl.x, 14, this.worldW - 14); body.setVelocityX(0); }

    let move = 0;
    if (canAct && !this.dashing) {
      if (this.key('ArrowLeft', 'KeyA') || App.touch.left) move -= 1;
      if (this.key('ArrowRight', 'KeyD') || App.touch.right) move += 1;
    }
    if (!this.dashing) {
      if (time < this.knockUntil) { /* đang bị đẩy lùi */ }
      else body.setVelocityX(move * speed);
    }
    if (move) this.facing = move;

    if (onGround) { this.lastGroundAt = time; this.jumpedAir = false; }
    const jumpPressed = canAct && (this.pressed('Space') || this.pressed('ArrowUp') || this.pressed('KeyW') || this.tpressed('jump'));
    if (jumpPressed) this.jumpBufferedAt = time;
    const canJump = onGround || (time - this.lastGroundAt < 110 && !this.jumpedAir);
    if (time - this.jumpBufferedAt < 140 && canJump) {
      this.jumpBufferedAt = -1000;
      if ((this.key('ArrowDown', 'KeyS') || App.touch.down) && body.touching.down && this.onPlatform()) {
        this.dropping = true; this.time.delayedCall(250, () => { this.dropping = false; });
      } else { body.setVelocityY(-JUMP_V); this.jumpedAir = true; this.jumpFx(); }
    }

    // Hành động
    if (canAct) {
      if (this.key('KeyJ') || App.touch.attack) this.basicAttack(time);
      for (let i = 0; i < 5; i++) if (this.pressed('Digit' + (i + 1)) || this.tpressed('s' + i)) this.useSkill(i, time);
      if (this.pressed('KeyR') || this.tpressed('ult')) this.useSkill(GameData.ULT_SLOT, time);
      if (this.pressed('KeyQ') || this.tpressed('hp')) this.usePotion('hp');
      if (this.pressed('KeyE') || this.tpressed('mp')) this.usePotion('mp');
      if (this.pressed('KeyF') || this.pressed('Enter') || this.tpressed('interact')) this.interact();
    }

    // Hình ảnh
    if (this.sheetId) this.updatePlayerAnim(time, onGround);
    else {
      pl.setFlipX(this.facing < 0);
      let frame = 'idle';
      if (!onGround) frame = 'jump';
      else if (Math.abs(body.velocity.x) > 10) frame = Math.floor(time / 120) % 2 ? 'run1' : 'run2';
      pl.setTexture(this.playerTexKey(frame));
    }
    if (time < this.invulnUntil) pl.setAlpha(Math.floor(time / 80) % 2 ? 0.4 : 1); else pl.setAlpha(1);
    const bt = this.buffTotals(time);
    if (bt.atk || bt.crit || bt.speed) pl.setTint(0xfff3b0); else pl.clearTint();
    this.drawAura(time);

    this.placeWeapon();
    this.juiceUpdate(time, onGround, move);
    this.nameTag.setPosition(pl.x, pl.y - 44);
    this.shadow.setPosition(pl.x, pl.y + 29).setVisible(onGround);

    // Gợi ý tương tác
    const near = this.nearestInteract();
    const npcName = near && near.type === 'npc' ? GameData.NPCS[near.id].name : '';
    UI.hint(npcName ? `F: Nói chuyện với ${npcName}` : '', npcName);
    if (near && near.type === 'portal' && !this.changing && time > (this.portalReady || 0) && move !== 0 && time >= (this.knockUntil || 0)) {
      this.usePortal(near.portal);
    }
  }

  onPlatform() {
    const pl = this.player;
    const r = Math.floor((pl.body.bottom + 2) / T), c = Math.floor(pl.x / T);
    return this.cell(r, c) === '=';
  }

  nearestInteract() {
    const pl = this.player;
    for (const p of this.portals) if (Math.abs(pl.x - p.x) < 18 && Math.abs(pl.body.bottom - p.y) < 40) return { type: 'portal', portal: p };
    let best = null, bd = 60;
    for (const n of this.npcs) {
      if (n.visible === false) continue;
      const d = Math.abs(pl.x - n.x);
      if (d < bd && Math.abs(pl.body.bottom - n.y) < 50) { bd = d; best = { type: 'npc', id: n.id, x: n.x }; }
    }
    return best;
  }

  interact() {
    const n = this.nearestInteract();
    if (n && n.type === 'npc') this.talkTo(n.id, n.x);
  }

  talkTo(id, x) {
    if (Math.abs(this.player.x - x) > 140) { UI.log('Hãy lại gần hơn để nói chuyện.', '#bdbdbd'); return; }
    this.facing = x > this.player.x ? 1 : -1;
    Net.action('talk', { npc: id }).then(() => { this.refreshNpcMarks(); UI.openNpc(id); });
  }

  async usePortal(portal) {
    this.changing = true;
    this.flushKills();
    const s = this.saveState();
    const res = await Net.action('change_map', { portal: portal.ch, hp: s.hp, mp: s.mp });
    if (res.ok) {
      Sound.play('portal');
      this.cameras.main.fadeOut(250);
      this.time.delayedCall(260, () => this.scene.restart({ map: res.player.map, arrive: portal.def.at }));
    } else {
      this.changing = false;
      this.portalReady = this.time.now + 1500;
      this.player.setVelocityX(-this.facing * 300);
      this.knockUntil = this.time.now + 200;
    }
  }

  // ------------------------------------------------------------------ Chiến đấu
  calcDamage(mult, mon) {
    const st = App.stats;
    const bt = this.buffTotals();
    const bossMul = mon.def.boss ? 1 + (st.boss || 0) / 100 : 1;
    let dmg = st.atk * mult * (1 + bt.atk) * bossMul - mon.def.def * 0.5;
    dmg = Math.max(1, dmg) * Phaser.Math.FloatBetween(0.9, 1.1);
    const crit = Math.random() * 100 < Math.min(90, st.crit + bt.crit);
    if (crit) dmg *= this.hasPassive('cung_thu') ? 1.8 : 1.6;
    return { dmg: Math.round(dmg), crit };
  }

  basicAttack(time) {
    const w = GameData.WEAPON_TYPES[App.stats.wtype];
    const fast = 1 / (1 + this.buffTotals(time).speed);
    if (time < this.cooldowns.atk) return;
    this.cooldowns.atk = time + w.cooldown * fast;
    this.attackAnim(time, w.cooldown * fast);
    this.swing();
    Sound.play(w.style === 'melee' ? 'swing' : 'shoot');
    if (w.style === 'melee') this.attackLunge();
    const pl = this.player;
    if (w.style === 'melee') {
      this.slashFx(pl.x + this.facing * 28, pl.y);
      this.hitBox(pl.x + this.facing * w.range / 2, pl.y, w.range, 60, w.mult, { basic: true });
    } else if (w.style === 'projectile') {
      this.shoot({ key: 'proj_arrow', speed: 720, range: w.range, mult: w.mult, basic: true });
    } else {
      this.shoot({ key: 'proj_orb', speed: 460, range: w.range, mult: w.mult, pierce: true, knock: 160, basic: true });
    }
  }

  swing() {
    this.swinging = true;
    const wt = App.stats.wtype, f = this.facing, done = () => { this.swinging = false; };
    if (wt === 'cung') {
      this.weapon.setScale(0.8, 1);
      this.tweens.add({ targets: this.weapon, scaleX: 1, duration: 140, onComplete: done });
    } else if (wt === 'truong') {
      this.weapon.setRotation(f * -0.3);
      this.tweens.add({ targets: this.weapon, rotation: f * 1.0, duration: 110, yoyo: true, onComplete: done });
    } else {
      this.weapon.setRotation(f * -1.5);
      this.tweens.add({ targets: this.weapon, rotation: f * 1.0, duration: 120, onComplete: done });
    }
  }

  mBounds(m) { const b = m.sprite.body; return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height); }
  pBounds() { const b = this.player.body; return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height); }

  hitBox(cx, cy, w, h, mult, extra = {}) {
    const rect = new Phaser.Geom.Rectangle(cx - w / 2, cy - h / 2, w, h);
    let hit = 0;
    for (const m of this.monsters) {
      if (!m.alive) continue;
      if (Phaser.Geom.Intersects.RectangleToRectangle(rect, this.mBounds(m))) { this.damageMonster(m, mult, extra); hit++; }
    }
    return hit;
  }

  hitCircle(cx, cy, radius, mult, extra = {}) {
    const circ = new Phaser.Geom.Circle(cx, cy, radius);
    for (const m of this.monsters) {
      if (m.alive && Phaser.Geom.Intersects.CircleToRectangle(circ, this.mBounds(m))) this.damageMonster(m, mult, extra);
    }
  }

  shoot(o) {
    const pl = this.player;
    const angle = o.angle || 0;
    const p = this.add.image(pl.x + this.facing * 16, pl.y - 2 + (o.dy || 0), o.key).setDepth(7).setFlipX(this.facing < 0);
    if (o.tint) p.setTint(o.tint);
    // Đạn phép, mũi tên lửa sáng lên bằng cách cộng màu (nhẹ hơn nhiều so với hiệu ứng phát sáng)
    if (o.key !== 'proj_arrow') p.setBlendMode(Phaser.BlendModes.ADD);
    p.setRotation(angle * this.facing);
    p.vx = Math.cos(angle) * o.speed * this.facing;
    p.vy = Math.sin(angle) * o.speed;
    p.dist = 0; p.o = o; p.hitSet = new Set();
    this.projectiles.add(p);
  }

  updateProjectiles(time, delta) {
    const dt = delta / 1000;
    for (const p of this.projectiles.getChildren().slice()) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.dist += Math.hypot(p.vx, p.vy) * dt;
      if (p.o.spin) p.rotation += 0.5;
      const c = Math.floor(p.x / T), r = Math.floor(p.y / T);
      if (p.dist > p.o.range || this.isSolid(r, c)) { this.fadeProjectile(p); continue; }
      const b = p.getBounds();
      for (const m of this.monsters) {
        if (!m.alive || p.hitSet.has(m)) continue;
        if (Phaser.Geom.Intersects.RectangleToRectangle(b, this.mBounds(m))) {
          p.hitSet.add(m);
          this.damageMonster(m, p.o.mult, { slow: p.o.slow, freeze: p.o.freeze, knock: p.o.knock, dir: Math.sign(p.vx), basic: p.o.basic });
          if (!p.o.pierce) { this.fadeProjectile(p); break; }
        }
      }
    }
  }

  fadeProjectile(p) {
    this.projectiles.remove(p);
    this.tweens.add({ targets: p, alpha: 0, duration: 100, onComplete: () => p.destroy() });
  }

  damageMonster(m, mult, extra = {}) {
    if (!m.alive) return;
    const { dmg, crit } = extra.reflect ? { dmg: extra.reflect, crit: false } : this.calcDamage(mult, m);
    m.hp -= dmg;
    m.aggro = true;
    if (App.stats.lifesteal && !m.def.passive && !this.dead) {
      App.hp = Math.min(App.stats.maxHp, App.hp + dmg * App.stats.lifesteal / 100);
    }
    // Nội tại Kiếm Tâm: đánh thường trúng quái hồi 1% máu
    if (extra.basic && !m.def.passive && !this.dead && this.hasPassive('kiem_si') && this.time.now > (this.healTick || 0)) {
      this.healTick = this.time.now + 120;
      App.hp = Math.min(App.stats.maxHp, App.hp + App.stats.maxHp * 0.01);
    }
    const s = m.sprite;
    this.floatText(s.x + Phaser.Math.Between(-8, 8), this.monsterTop(m) - 4, (crit ? '💥' : '') + dmg, crit ? '#ffd740' : '#ffffff', crit ? 20 : 15);
    m.flashUntil = this.time.now + 80;
    if (!extra.reflect) this.hitFx(s.x, s.body.center.y, crit, extra.dir || this.facing);
    if (m.sheet && m.alive && m.state === 'move' && m.hp > dmg) { m.hitUntil = this.time.now + 220; s.play(`mb_${m.sheet}_hit`, true); }
    Sound.play(crit ? 'crit' : 'hit');
    if (!m.def.boss && !m.def.passive) {
      const dir = extra.dir || Math.sign(s.x - this.player.x) || 1;
      s.body.setVelocityX(dir * (extra.knock || 90));
      m.knockUntil = this.time.now + 150;
    }
    if (extra.slow) m.slowUntil = this.time.now + extra.slow * 1000;
    if (extra.freeze) m.freezeUntil = this.time.now + extra.freeze * 1000;
    if (m.hp <= 0) this.killMonster(m);
    else this.drawMonsterBar(m);
  }

  killMonster(m) {
    m.alive = false;
    Sound.play(m.def.boss ? 'boom' : 'kill');
    m.hp = 0;
    const s = m.sprite;
    s.body.enable = false;
    m.bar.clear();
    m.label.setVisible(false);
    for (let i = 0; i < 8; i++) {
      const sp = this.add.image(s.x, s.body.center.y, 'spark').setDepth(7).setTint(m.def.boss ? 0xffab40 : 0xffffff);
      this.tweens.add({ targets: sp, x: sp.x + Phaser.Math.Between(-40, 40), y: sp.y + Phaser.Math.Between(-40, 20), alpha: 0, scale: 0.3, duration: 450, onComplete: () => sp.destroy() });
    }
    if (m.sheet) { s.play(`mb_${m.sheet}_death`); this.tweens.add({ targets: s, alpha: 0, duration: 300, delay: 450 }); }
    else this.tweens.add({ targets: s, alpha: 0, duration: 300 });
    if (m.def.boss) { this.cameras.main.shake(400, 0.012); this.slowMo(0.3, 900); }
    const dropY = m.def.fly ? this.groundY(Math.floor(s.y / T), Math.floor(s.x / T)) : s.y;
    this.pendingKills.push({ monster: m.id, x: Math.round(s.x), y: Math.round(dropY) });
    if (!this.killFlush) this.killFlush = this.time.delayedCall(120, () => this.flushKills());
    if (m.def.boss) this.hitstop(120);
    if (m.minion) { this.time.delayedCall(400, () => { m.label.destroy(); m.bar.destroy(); s.destroy(); this.monsters.splice(this.monsters.indexOf(m), 1); }); }
    else this.time.delayedCall(m.def.respawn * 1000, () => this.respawnMonster(m));
  }

  flushKills() {
    if (this.killFlush) { this.killFlush.remove(false); this.killFlush = null; }
    if (!this.pendingKills || !this.pendingKills.length) return;
    const list = this.pendingKills.splice(0, this.pendingKills.length);
    for (let i = 0; i < list.length; i += 15) {
      Net.action('kills', { list: list.slice(i, i + 15) }).then(() => { if (this.sys.isActive()) this.refreshNpcMarks(); });
    }
  }

  respawnMonster(m) {
    if (!this.sys.isActive()) return;
    const s = m.sprite;
    m.hp = m.maxHp; m.alive = true; m.aggro = false; m.slowUntil = 0; m.freezeUntil = 0; m.state = 'move'; m.enraged = false;
    s.setPosition(m.homeX, m.homeY).setAlpha(0);
    if (m.sheet) s.play(`mb_${m.sheet}_idle`);
    s.body.enable = true; s.body.setVelocity(0, 0);
    m.label.setVisible(true);
    this.tweens.add({ targets: s, alpha: 1, duration: 400 });
    this.drawMonsterBar(m);
  }

  // Quái: đi tuần → phát hiện người chơi → đuổi → GỒNG (báo trước, đứng lại nháy đỏ) → LAO TỚI đánh → nghỉ
  // Chỉ gây sát thương trong lúc lao tới, nên người chơi luôn có thời gian né.
  updateMonster(m, time) {
    const s = m.sprite, d = m.def, pl = this.player;
    m.frameT += 1;
    const animRate = d.fly ? 8 : 14;
    if (!m.sheet) s.setTexture(`m_${d.look}_${Math.floor(m.frameT / animRate) % 2}`);
    const frozen = time < m.freezeUntil;
    const winding = m.state === 'windup';
    if (time < (m.flashUntil || 0)) s.setTintFill(0xffffff);
    else if (frozen) s.setTint(0x9ad7ff);
    else if (winding) { if (Math.floor(time / 70) % 2) s.setTintFill(0xff4d4d); else this.baseTint(m); }
    else if (m.enraged) s.setTint(0xff9a9a);
    else if (time < m.slowUntil) s.setTint(0x9fc5e8);
    else this.baseTint(m);
    if (m.sheet && m.alive) this.mobAnim(m, time);
    if (d.passive) { this.drawMonsterBar(m); return; }

    const dx = pl.x - s.x, dy = pl.y - (d.fly ? s.y : s.body.center.y);
    const dist = Math.hypot(dx, dy);
    if (!this.dead && dist < (d.boss ? 380 : 220) && Math.abs(dy) < 160) m.aggro = true;
    if (dist > 600 || this.dead) { m.aggro = false; if (m.state !== 'move') this.endAttack(m, time); }

    let spd = d.speed * (time < m.slowUntil ? 0.5 : 1);
    if (m.enraged) spd *= 1.35;

    // Trùm: giai đoạn 2 khi còn dưới 50% máu
    if (d.boss && !m.enraged && m.hp < m.maxHp * 0.5) this.bossEnrage(m, time);
    if (m.wave) this.updateBossWave(m, time);

    if (frozen) {
      if (m.state !== 'move') this.endAttack(m, time);
      s.body.setVelocity(0, d.fly ? 0 : s.body.velocity.y); this.drawMonsterBar(m); return;
    }

    const reach = (d.boss ? 70 : 34) + s.width * 0.3;
    // ---- Gồng đòn: đứng yên, nháy đỏ
    if (m.state === 'windup') {
      s.body.setVelocityX(0);
      if (d.fly) s.body.setVelocityY(0);
      if (time >= m.stateUntil) {
        m.state = 'lunge'; m.lungeHit = false;
        m.stateUntil = time + (d.boss ? 320 : 240);
        const ang = Math.atan2(pl.y - s.y, pl.x - s.x);
        if (d.fly) s.body.setVelocity(Math.cos(ang) * 520, Math.sin(ang) * 520);
        else { s.body.setVelocityX(m.lungeDir * (d.boss ? 420 : 340)); if (d.jumper) s.body.setVelocityY(-300); }
      }
      this.drawMonsterBar(m);
      return;
    }
    // ---- Lao tới: chỉ lúc này mới gây sát thương
    if (m.state === 'lunge') {
      if (!m.lungeHit && !this.dead) {
        const b1 = this.mBounds(m), b2 = this.pBounds();
        Phaser.Geom.Rectangle.Inflate(b1, -4, -4);
        if (Phaser.Geom.Intersects.RectangleToRectangle(b1, b2)) {
          m.lungeHit = true;
          this.hurtPlayer(Math.round(d.atk * (m.enraged ? 1.25 : 1)), Math.sign(pl.x - s.x) || 1, 260, m);
        }
      }
      if (!d.fly) s.x = Phaser.Math.Clamp(s.x, m.span[0] - 4, m.span[1] + 4);
      if (time >= m.stateUntil) this.endAttack(m, time);
      this.drawMonsterBar(m);
      return;
    }

    // ---- Di chuyển
    if (d.fly) {
      let tx, ty;
      if (m.aggro) { tx = pl.x - Math.sign(dx || 1) * 50; ty = pl.y - 40; }
      else { tx = m.homeX + Math.sin(time / 900 + m.homeX) * 80; ty = m.homeY + Math.sin(time / 500 + m.homeX) * 20; }
      if (Math.abs(tx - m.homeX) > 350) tx = m.homeX + Math.sign(tx - m.homeX) * 350;
      for (const pt of this.portals) if (Math.abs(tx - pt.x) < 160) tx = pt.x + (tx >= pt.x ? 160 : -160);
      const ang = Math.atan2(ty - s.y, tx - s.x);
      const near = Math.hypot(tx - s.x, ty - s.y) < 6;
      s.body.setVelocity(near ? 0 : Math.cos(ang) * spd, near ? 0 : Math.sin(ang) * spd);
      s.setFlipX(dx < 0);
    } else {
      if (!(time < (m.knockUntil || 0))) {
        let vx;
        if (m.aggro) vx = Math.abs(dx) > reach * 0.8 ? Math.sign(dx) * spd * 1.25 : 0;
        else {
          if (time > m.nextTurn) { m.dir = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1); m.nextTurn = time + 1500 + Math.random() * 2000; }
          vx = m.dir * spd * 0.6;
          if (Math.abs(s.x - m.homeX) > 120) vx = Math.sign(m.homeX - s.x) * spd * 0.6;
        }
        if ((s.x <= m.span[0] && vx < 0) || (s.x >= m.span[1] && vx > 0)) vx = 0;
        s.body.setVelocityX(vx);
        if (vx) s.setFlipX(d.look === 'mushroom' ? false : vx < 0);
        else if (m.aggro && d.look !== 'mushroom') s.setFlipX(dx < 0);
      }
      s.x = Phaser.Math.Clamp(s.x, m.span[0] - 4, m.span[1] + 4);
      if (d.jumper && m.aggro && time > m.nextJump && s.body.blocked.down) { s.body.setVelocityY(-420); m.nextJump = time + 1600; }
    }

    // Đòn đặc biệt của trùm: dậm đất (giai đoạn 2 nhanh hơn, có sóng đá chạy dọc mặt đất)
    if (d.boss && m.aggro && time > m.nextSlam) { m.nextSlam = time + (m.enraged ? 3200 : 4500); this.bossSlam(m); }

    // Đủ gần thì bắt đầu gồng đòn
    const inRange = d.fly ? dist < 90 : Math.abs(dx) < reach + 30 && Math.abs(pl.body.bottom - s.y) < 70;
    if (m.aggro && !this.dead && d.atk > 0 && time > m.nextAttack && inRange) {
      m.state = 'windup';
      m.stateUntil = time + (d.boss ? (m.enraged ? 450 : 600) : d.fly ? 420 : 380);
      m.lungeDir = Math.sign(dx) || 1;
      if (!d.fly && d.look !== 'mushroom') s.setFlipX(dx < 0);
      this.tweens.add({ targets: s, scaleY: m.baseScale * 0.9, scaleX: m.baseScale * 1.06, duration: 120, yoyo: true });
      if (m.sheet) { const [n] = Sprites.MOBS[m.sheet].anims.attack; s.play({ key: `mb_${m.sheet}_attack`, frameRate: n / ((m.stateUntil - time + (d.boss ? 320 : 240)) / 1000) }, false); }
      if (d.boss) Sound.play('warn');
    }
    this.drawMonsterBar(m);
  }

  baseTint(m) { if (m.baseTint) m.sprite.setTint(m.baseTint); else m.sprite.clearTint(); }

  // Quái dùng hình vẽ sẵn: đi/đứng theo tốc độ (đánh và bị đánh do chỗ khác điều khiển)
  mobAnim(m, time) {
    const s = m.sprite;
    if (m.state !== 'move' || time < (m.hitUntil || 0)) return;
    const moving = Math.abs(s.body.velocity.x) > 8 || (m.def.fly && Math.abs(s.body.velocity.y) > 8);
    s.play(`mb_${m.sheet}_${moving ? 'run' : 'idle'}`, true);
  }

  endAttack(m, time) {
    m.state = 'move';
    m.nextAttack = time + (m.def.boss ? (m.enraged ? 900 : 1300) : 1000 + Math.random() * 500);
    if (m.def.fly) m.sprite.body.setVelocity(0, 0);
    else m.sprite.body.setVelocityX(0);
  }

  // Trùm nổi giận ở 50% máu: gọi thêm quái nhỏ, đánh nhanh hơn
  bossEnrage(m, time) {
    m.enraged = true;
    UI.banner(`${m.def.name} nổi giận!`, 1800);
    Sound.play('roar');
    this.cameras.main.shake(500, 0.014);
    this.cameras.main.flash(250, 255, 60, 60);
    const minion = m.def.minion || 'nhen_da';
    if (GameData.MONSTERS[minion]) {
      for (const off of [-170, 170]) {
        const x = Phaser.Math.Clamp(m.sprite.x + off, m.span[0], m.span[1]);
        const c = Math.floor(x / T), r = Math.floor((m.sprite.y - 4) / T);
        const mm = this.spawnMonster(minion, r, c);
        if (mm) { mm.minion = true; mm.aggro = true; mm.sprite.setAlpha(0); this.tweens.add({ targets: mm.sprite, alpha: 1, duration: 400 }); }
      }
    }
  }

  bossSlam(m) {
    const s = m.sprite;
    const g = this.add.graphics().setDepth(1);
    let t = 0;
    const R = 170;
    this.time.addEvent({
      delay: 30, repeat: 26, callback: () => {
        t++;
        g.clear();
        g.fillStyle(0xff3d00, 0.12 + t * 0.008).fillEllipse(s.x, s.y, R * 2 * (t / 27), 50 * (t / 27));
        g.lineStyle(2, 0xff6e40, 0.8).strokeEllipse(s.x, s.y, R * 2, 50);
      },
    });
    Sound.play('warn');
    this.time.delayedCall(850, () => {
      g.destroy();
      if (!m.alive) return;
      this.cameras.main.shake(200, 0.01);
      Sound.play('boom');
      const pl = this.player;
      if (Math.abs(pl.x - s.x) < R && Math.abs(pl.body.bottom - s.y) < 40 && !this.dead) {
        this.hurtPlayer(Math.round(m.def.atk * 1.5), Math.sign(pl.x - s.x) || 1, 420, m);
      }
      // Giai đoạn 2: hai sóng đá chạy dọc mặt đất, phải nhảy qua
      if (m.enraged) {
        const mk = (dir) => {
          const img = this.add.image(s.x, s.y, 'd_crystal').setOrigin(0.5, 1).setDepth(6).setTint(0xff7043).setScale(0.8, 0.7);
          return { x: s.x, dir, img, hit: false };
        };
        m.wave = { list: [mk(-1), mk(1)], until: this.time.now + 1600, y: s.y };
      }
    });
  }

  updateBossWave(m, time) {
    const w = m.wave, dt = this.game.loop.delta / 1000, pl = this.player;
    for (const p of w.list) {
      p.x += p.dir * 330 * dt;
      p.img.setPosition(p.x, w.y);
      if (!p.hit && !this.dead && Math.abs(pl.x - p.x) < 22 && pl.body.bottom > w.y - 26) {
        p.hit = true;
        this.hurtPlayer(Math.round(m.def.atk * 0.9), p.dir, 300, m);
      }
    }
    if (time > w.until || !m.alive) {
      for (const p of w.list) p.img.destroy();
      m.wave = null;
    }
  }

  hurtPlayer(atk, dir, push = 260, mon = null) {
    const now = this.time.now;
    if (now < this.invulnUntil || this.dashing) return;
    let dmg = Math.max(1, Math.round(atk * Phaser.Math.FloatBetween(0.9, 1.1) - App.stats.def * 0.5));
    const guard = this.buffOn('guard', now);
    if (guard) {
      dmg = Math.max(1, Math.round(dmg * (1 - guard.reduce)));
      if (guard.reflect && mon && mon.alive) this.damageMonster(mon, 0, { reflect: Math.round(atk * guard.reflect) });
    }
    const shield = this.buffOn('manashield', now);
    if (shield && App.mp > 0) {
      const take = Math.min(App.mp, Math.round(dmg * shield.absorb));
      App.mp -= take; dmg -= take;
      if (take) this.floatText(this.player.x, this.player.y - 46, '🔷' + take, '#8fb4ff', 13);
      if (dmg <= 0) { this.invulnUntil = now + 500; return; }
    }
    App.hp -= dmg;
    this.hitAnimUntil = now + 260;
    Sound.play('hurt');
    this.lastHurt = now;
    this.invulnUntil = now + 700;
    this.floatText(this.player.x, this.player.y - 30, '-' + dmg, '#ff5252', 16);
    this.player.setVelocity(dir * push, -220);
    this.knockUntil = now + 220;
    if (App.hp <= 0) this.die();
  }

  async die() {
    if (this.dead) return;
    this.dead = true;
    App.hp = 0;
    if (this.sheetId) { this.attackUntil = 0; this.player.setAngle(0); this.player.play(`ch_${this.sheetId}_death`); }
    else this.player.setTint(0x555555).setAngle(this.facing * -90);
    this.player.body.setVelocity(0, 0);
    UI.banner('Bạn đã bị đánh bại', 1800);
    await new Promise(r => setTimeout(r, 1800));
    const res = await Net.action('die');
    if (res.player) { App.hp = res.player.hp; App.mp = res.player.mp; }
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => this.scene.restart({ map: GameData.START_MAP, arrive: 'S' }));
  }

  // ------------------------------------------------------------------ Kỹ năng
  // Hiệu ứng tăng cường đang có: cộng dồn tấn công, chí mạng, tốc độ
  buffTotals(time = this.time.now) {
    const t = { atk: 0, crit: 0, speed: 0 };
    for (const k in this.buffs) {
      const b = this.buffs[k];
      if (time >= b.until) continue;
      t.atk += b.atk || 0; t.crit += b.crit || 0; t.speed += b.speed || 0;
    }
    return t;
  }
  buffOn(name, time = this.time.now) { const b = this.buffs[name]; return b && time < b.until ? b : null; }
  hasPassive(id) { return GameData.passivesOf(App.player).includes(id); }

  useSkill(slot, time) {
    const p = App.player;
    const id = p.skillSlots[slot];
    if (!id) {
      UI.log(p.school ? 'Ô kỹ năng trống. Mở bảng Kỹ năng (phím K) để học và gắn kỹ năng.' : 'Chưa có kỹ năng. Đạt cấp 5 và thức tỉnh class ở Hội trưởng Khải.', '#bdbdbd');
      return;
    }
    const lv = GameData.skillLevel(p, id);
    if (!lv) return;
    const sk = GameData.skillAt(id, lv);
    if (time < (this.cooldowns[id] || 0)) return;
    const cost = Math.round(sk.mp * App.stats.costMul);
    if (App.mp < cost) { UI.log('Không đủ năng lượng!', '#64b5f6'); return; }
    App.mp -= cost;
    const cdMs = sk.cd * 1000 * (1 - (App.stats.cdr || 0) / 100);
    this.cooldowns[id] = time + cdMs;
    this.cooldownLen[id] = cdMs;
    const pw = sk.power ? sk.power * App.stats.skillMul : 0;
    const pl = this.player, f = this.facing;
    this.floatText(pl.x, pl.y - 52, sk.name, sk.ult ? '#ffd54f' : '#fff59d', sk.ult ? 17 : 14);
    this.attackAnim(time, sk.type === 'melee' ? (sk.hits || 3) * 110 : 420, 'skill');
    if (sk.ult) { this.cameras.main.flash(180, 255, 230, 160); }
    Sound.play(sk.ult ? 'ult' : sk.type === 'heal' ? 'heal' : 'skill');

    switch (sk.type) {
      case 'dash': {
        this.dashing = true;
        const startX = pl.x;
        const endX = Phaser.Math.Clamp(pl.x + f * sk.distance, 20, this.worldW - 20);
        pl.body.setVelocityX(f * 1100);
        pl.body.setAllowGravity(false); pl.body.setVelocityY(0);
        this.time.addEvent({ delay: 25, repeat: 6, callback: () => {
          const ghost = this.add.image(pl.x, pl.y, pl.texture.key).setFlipX(pl.flipX).setAlpha(0.5).setTint(this.accent()).setDepth(3);
          this.tweens.add({ targets: ghost, alpha: 0, duration: 250, onComplete: () => ghost.destroy() });
        } });
        this.time.delayedCall(Math.abs(endX - startX) / 1100 * 1000 + 20, () => {
          this.dashing = false; pl.body.setAllowGravity(true); pl.body.setVelocityX(0);
          const a = Math.min(startX, pl.x), b = Math.max(startX, pl.x);
          this.hitBox((a + b) / 2, pl.y, b - a + 50, 64, pw);
          this.slashFx(pl.x, pl.y, 1.6, 1.2);
          if (sk.after) {
            this.time.delayedCall(180, () => {
              const g = this.add.rectangle((a + b) / 2, pl.y, b - a + 40, 6, this.accent(), 0.9).setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
              this.tweens.add({ targets: g, scaleY: 4, alpha: 0, duration: 260, onComplete: () => g.destroy() });
              this.hitBox((a + b) / 2, pl.y, b - a + 50, 64, sk.after * App.stats.skillMul);
            });
          }
        });
        this.invulnUntil = Math.max(this.invulnUntil, time + 400);
        break;
      }
      case 'melee': {
        for (let h = 0; h < sk.hits; h++) {
          const last = h === sk.hits - 1 && sk.finisher;
          this.time.delayedCall(h * 110, () => {
            this.swing();
            this.slashFx(pl.x + this.facing * 34, pl.y + (h % 2 ? 8 : -8), last ? 1.8 : 1.3, last ? 1.5 : 1, h % 2 === 1);
            this.hitBox(pl.x + this.facing * sk.range / 2, pl.y, sk.range, 70,
              last ? sk.finisher * App.stats.skillMul : pw, last ? { knock: 360 } : {});
            if (last) this.cameras.main.shake(120, 0.006);
          });
        }
        break;
      }
      case 'guard': {
        this.buffs.guard = { until: time + sk.duration * 1000, reduce: sk.reduce, reflect: sk.reflect || 0 };
        this.ringFx(pl.x, pl.y, 0xffb36b);
        break;
      }
      case 'manashield': {
        this.buffs.manashield = { until: time + sk.duration * 1000, absorb: sk.absorb };
        this.ringFx(pl.x, pl.y, 0x8fb4ff);
        break;
      }
      case 'buff': {
        this.buffs[sk.buff] = { until: time + sk.duration * 1000, atk: (sk.atkBuff || 0) * App.stats.skillMul, crit: sk.critBuff || 0, speed: sk.speedBuff || 0 };
        for (let k = 0; k < (sk.ult ? 10 : 6); k++) {
          const ghost = this.add.image(pl.x, pl.y, pl.texture.key).setTint(this.accent()).setAlpha(0.6).setDepth(3);
          this.tweens.add({ targets: ghost, x: pl.x + Phaser.Math.Between(-70, 70), y: pl.y + Phaser.Math.Between(-20, 10), alpha: 0, duration: 520, onComplete: () => ghost.destroy() });
        }
        if (sk.ult) { this.ringFx(pl.x, pl.y, 0xffd54f, 4); this.cameras.main.shake(250, 0.008); }
        break;
      }
      case 'projectile': {
        const water = sk.school === 'phap_su';
        this.swing();
        const n = sk.count || 1;
        for (let k = 0; k < n; k++) {
          this.shoot({ key: water ? 'fx_wave' : 'proj_fire', speed: water ? 520 : 820, range: sk.range, mult: pw,
            pierce: sk.pierce, slow: sk.slow, freeze: sk.freeze, knock: water ? 140 : 60, dy: (k - (n - 1) / 2) * 16 });
        }
        break;
      }
      case 'spread': {
        this.swing();
        for (let k = 0; k < sk.count; k++) {
          const ang = (k - (sk.count - 1) / 2) * 0.16;
          this.shoot({ key: 'proj_fire', speed: 760, range: sk.range, mult: pw, angle: ang, slow: sk.slow });
        }
        break;
      }
      case 'backstep': {
        this.invulnUntil = Math.max(this.invulnUntil, time + 450);
        pl.body.setVelocity(-f * 650, -320);
        this.knockUntil = time + 260;
        this.time.delayedCall(120, () => {
          this.swing();
          for (let k = 0; k < (sk.count || 1); k++) {
            const ang = (k - ((sk.count || 1) - 1) / 2) * 0.12;
            this.shoot({ key: 'proj_fire', speed: 780, range: 420, mult: pw, angle: ang });
          }
        });
        break;
      }
      case 'aoe': {
        const ice = !!sk.freeze;
        const g = this.add.graphics().setDepth(7);
        const col = ice ? 0x80deea : 0xff7043;
        let t = 0;
        this.time.addEvent({ delay: 16, repeat: 20, callback: () => {
          t++; g.clear();
          g.fillStyle(col, 0.35 * (1 - t / 21)).fillCircle(pl.x, pl.y, sk.radius * (t / 21));
          g.lineStyle(4, ice ? 0xe0f7fa : 0xffd180, 1 - t / 21).strokeCircle(pl.x, pl.y, sk.radius * (t / 21));
          if (t >= 21) g.destroy();
        } });
        this.cameras.main.shake(150, 0.006);
        this.hitCircle(pl.x, pl.y, sk.radius, pw, { freeze: sk.freeze });
        break;
      }
      case 'heal': {
        const amount = Math.round(App.stats.maxHp * sk.heal * App.stats.skillMul);
        App.hp = Math.min(App.stats.maxHp, App.hp + amount);
        this.floatText(pl.x, pl.y - 30, '+' + amount, '#69f0ae', 16);
        if (sk.mpHeal) {
          const m = Math.round(App.stats.maxMp * sk.mpHeal);
          App.mp = Math.min(App.stats.maxMp, App.mp + m);
          this.floatText(pl.x, pl.y - 46, '+' + m, '#64b5f6', 14);
        }
        this.ringFx(pl.x, pl.y, 0xb2ff59);
        break;
      }
      case 'sword_fall': {
        const gy = pl.body.bottom;
        const offs = [140, 270, 400].slice(0, sk.count);
        offs.forEach((o, k) => this.time.delayedCall(k * 220, () => {
          const x = Phaser.Math.Clamp(pl.x + f * o, 30, this.worldW - 30);
          this.telegraph(x, gy, sk.radius, 0xffd54f, 300);
          const sw = this.add.image(x, gy - 420, 'fx_bigsword').setOrigin(0.5, 1).setDepth(8).setAlpha(0.95);
          this.tweens.add({ targets: sw, y: gy + 20, duration: 300, ease: 'Quad.in', onComplete: () => {
            this.cameras.main.shake(200, 0.012);
            this.ringFx(x, gy - 10, 0xffd54f, 3);
            this.hitCircle(x, gy - 30, sk.radius, pw, { knock: 300 });
            this.tweens.add({ targets: sw, alpha: 0, duration: 500, delay: 250, onComplete: () => sw.destroy() });
          } });
        }));
        break;
      }
      case 'arrow_rain': {
        const gy = pl.body.bottom;
        const cx = Phaser.Math.Clamp(pl.x + f * (sk.width / 2 + 30), 30, this.worldW - 30);
        this.telegraph(cx, gy, sk.width / 2, 0x6ff0a6, 1300);
        const top = this.cameras.main.worldView.y - 40;
        for (let i = 0; i < sk.arrows; i++) {
          this.time.delayedCall(150 + i * (1200 / sk.arrows), () => {
            const x = cx + Phaser.Math.Between(-sk.width / 2, sk.width / 2);
            const a = this.add.image(x, top, 'fx_arrow_down').setDepth(8);
            this.tweens.add({ targets: a, y: gy - 16, duration: 260, ease: 'Quad.in', onComplete: () => {
              this.hitBox(x, gy - 30, 46, 90, pw, { slow: sk.slow });
              this.tweens.add({ targets: a, alpha: 0, duration: 300, onComplete: () => a.destroy() });
            } });
          });
        }
        break;
      }
      case 'meteor': {
        const gy = pl.body.bottom;
        for (let k = 0; k < sk.count; k++) {
          this.time.delayedCall(k * 420, () => {
            const x = Phaser.Math.Clamp(pl.x + f * (170 + k * 110), 30, this.worldW - 30);
            this.telegraph(x, gy, sk.radius, 0xff7043, 600);
            const m = this.add.image(x - f * 260, this.cameras.main.worldView.y - 60, 'fx_meteor').setDepth(8);
            this.tweens.add({ targets: m, x, y: gy - 20, duration: 600, ease: 'Quad.in', onComplete: () => {
              m.destroy();
              this.cameras.main.shake(260, 0.016);
              this.cameras.main.flash(120, 255, 140, 60);
              this.ringFx(x, gy - 20, 0xff9d4d, 4);
              this.hitCircle(x, gy - 30, sk.radius, pw, { knock: 260 });
            } });
          });
        }
        break;
      }
    }
  }

  slashFx(x, y, sx = 1, sy = 1, flipY = false) {
    const fx = this.add.image(x, y, 'slash').setDepth(7).setFlipX(this.facing < 0).setFlipY(flipY).setScale(sx, sy).setTint(this.accent());
    // Hình vẽ sẵn đã có động tác vung vũ khí, vệt chém chỉ để làm sáng thêm
    if (this.sheetId) { fx.setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setScale(sx * 0.9, sy * 0.7); }
    this.tweens.add({ targets: fx, alpha: 0, scaleX: fx.scaleX * 1.2, duration: 200, onComplete: () => fx.destroy() });
  }

  ringFx(x, y, color, scale = 2) {
    const r = this.add.image(x, y, 'fx_ring').setDepth(7).setTint(color).setScale(0.4).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: r, scale, alpha: 0, duration: 480, onComplete: () => r.destroy() });
  }

  // Vùng báo trước trên mặt đất
  telegraph(x, y, radius, color, ms) {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(color, 0.18).fillEllipse(x, y, radius * 2, 34);
    g.lineStyle(2, color, 0.8).strokeEllipse(x, y, radius * 2, 34);
    this.tweens.add({ targets: g, alpha: 0, duration: ms, onComplete: () => g.destroy() });
  }

  // Khựng hình rất ngắn khi đòn trúng mạnh
  hitstop(ms = 45) {
    const now = this.time.now;
    if (now < (this.hitstopUntil || 0)) return;
    this.hitstopUntil = now + ms;
    this.physics.world.pause();
    this.time.delayedCall(ms, () => { if (!this.physics.world.isPaused) return; this.physics.world.resume(); });
  }

  usePotion(kind) {
    const p = App.player;
    const ids = kind === 'hp' ? ['binh_mau_vua', 'binh_mau_nho'] : ['binh_nl_vua', 'binh_nl_nho'];
    const id = ids.find(i => p.bag.some(e => e.id === i) && (GameData.ITEMS[i].level || 1) <= p.level);
    if (!id) { UI.log(kind === 'hp' ? 'Hết bình máu! Mua ở Bà Lan.' : 'Hết bình năng lượng! Mua ở Bà Lan.', '#ef5350'); return; }
    if (kind === 'hp' && App.hp >= App.stats.maxHp) return;
    if (kind === 'mp' && App.mp >= App.stats.maxMp) return;
    Net.action('use', { item: id, hp: Math.round(App.hp), mp: Math.round(App.mp) });
  }

  regen() {
    if (this.dead) return;
    const safe = this.mapId === GameData.START_MAP;
    const idle = this.time.now - this.lastHurt > 5000;
    const mul = safe ? 4 : idle ? 1 : 0.3;
    App.hp = Math.min(App.stats.maxHp, App.hp + App.stats.maxHp * 0.01 * mul);
    App.mp = Math.min(App.stats.maxMp, App.mp + App.stats.maxMp * 0.02 * mul * (this.hasPassive('phap_su') ? 2 : 1));
  }

  drawAura(time) {
    const g = this.aura, pl = this.player;
    g.clear();
    const guard = this.buffOn('guard', time), shield = this.buffOn('manashield', time);
    if (guard) { g.lineStyle(3, 0xffb36b, 0.6 + Math.sin(time / 120) * 0.2).strokeEllipse(pl.x, pl.y + 2, 54, 70); }
    if (shield) { g.fillStyle(0x8fb4ff, 0.12).fillCircle(pl.x, pl.y, 38); g.lineStyle(2, 0xbfd2ff, 0.7).strokeCircle(pl.x, pl.y, 38); }
    if (this.buffOn('awaken', time)) { g.lineStyle(2, 0xffd54f, 0.5 + Math.sin(time / 90) * 0.3).strokeEllipse(pl.x, pl.y + 28, 60, 14); }
  }

  levelUpFx() {
    const pl = this.player;
    if (!pl) return;
    const c = this.add.circle(pl.x, pl.y, 20, 0xffd54f, 0.5).setDepth(7);
    this.tweens.add({ targets: c, radius: 90, alpha: 0, duration: 700, onComplete: () => c.destroy() });
  }

  // ------------------------------------------------------------------ Đồ rơi trên đất
  addLoot(l, animate = true) {
    if (!this.loots || this.loots.has(l.lid) || l.map !== this.mapId) return;
    const def = GameData.ITEMS[l.inst.id];
    const q = def.slot ? (l.inst.q || 1) : 0;
    const color = [0xe8e2d0, 0xffffff, 0x64b5f6, 0xce93d8, 0xffca28][q];
    const c = this.add.container(l.x, l.y - 14).setDepth(3);
    if (q >= 3) {   // cột sáng cho đồ hiếm và huyền thoại
      const beam = this.add.rectangle(0, -60, 10, 120, color, 0.28).setBlendMode(Phaser.BlendModes.ADD);
      c.add(beam);
      this.tweens.add({ targets: beam, alpha: 0.1, duration: 700, yoyo: true, repeat: -1 });
    }
    const glow = this.add.circle(0, 0, q >= 2 ? 15 : 11, color, q >= 2 ? 0.45 : 0.25).setBlendMode(Phaser.BlendModes.ADD);
    const icon = this.add.text(0, 0, UI.itemIcon(l.inst.id), { fontSize: '20px' }).setOrigin(0.5);
    c.add([glow, icon]);
    if (q >= 2) {
      const label = this.add.text(0, -24, def.name, {
        fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontSize: '11px', color: '#' + color.toString(16).padStart(6, '0'),
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5);
      c.add(label);
    }
    this.tweens.add({ targets: glow, scale: 1.25, duration: 600, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: icon, y: -4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    if (animate) {
      c.y -= 40; c.setScale(0.4);
      this.tweens.add({ targets: c, y: l.y - 14, scale: 1, duration: 450, ease: 'Bounce.out' });
      if (q >= 3) {
        this.cameras.main.flash(250, q === 4 ? 255 : 200, q === 4 ? 200 : 120, q === 4 ? 40 : 255);
        UI.banner(`Rơi đồ ${GameData.QUALITY_NAMES[q]}: ${def.name}!`, 1800);
      }
    }
    this.loots.set(l.lid, { l, c, pending: false, retryAt: 0 });
  }

  removeLoot(lid, toPlayer) {
    const e = this.loots && this.loots.get(lid);
    if (!e) return;
    this.loots.delete(lid);
    // Dừng các hiệu ứng lặp mãi của món đồ để không tích tụ khi chơi lâu
    this.tweens.killTweensOf(e.c.list);
    if (toPlayer && this.player) {
      this.tweens.add({ targets: e.c, x: this.player.x, y: this.player.y - 10, scale: 0.3, alpha: 0, duration: 220, onComplete: () => e.c.destroy() });
    } else e.c.destroy();
  }

  updateLoot(time) {
    if (!this.loots || !this.loots.size || this.dead) return;
    const now = Date.now();
    const pl = this.player;
    for (const [lid, e] of this.loots) {
      if (e.l.until < now) { this.removeLoot(lid); continue; }
      if (e.pending || time < e.retryAt) continue;
      if (Math.abs(pl.x - e.l.x) < 30 && Math.abs(pl.body.bottom - e.l.y) < 60) {
        e.pending = true;
        Net.action('pickup', { lid }, { silent: true }).then((r) => {
          if (r.ok) return;
          e.pending = false;
          e.retryAt = this.time.now + 4000;
          if (r.error && r.error !== this.lastLootError) { UI.log(r.error, '#ef5350'); }
          this.lastLootError = r.error;
          if (r.error === 'Món đồ đã biến mất.') this.removeLoot(lid);
        });
      }
    }
  }

  // ------------------------------------------------------------------ Tiện ích
  floatText(x, y, text, color = '#fff', size = 14) {
    const t = this.add.text(x, y, text, {
      fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontSize: size + 'px', fontStyle: 'bold', color, stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);
    if (size >= 18) { t.setScale(0.4); this.tweens.add({ targets: t, scale: 1.25, duration: 120, yoyo: true, hold: 60, ease: 'Back.out' }); }
    this.tweens.add({ targets: t, y: y - 36, alpha: 0, duration: 1100, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }

  saveState() {
    return { map: this.mapId, x: Math.round(this.player.x), y: Math.round(this.player.y), hp: Math.round(App.hp), mp: Math.round(App.mp) };
  }

  autoSave() {
    if (this.dead || this.changing || !this.player) return;
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    const s = this.saveState();
    if (!onGround) { delete s.x; delete s.y; }
    Net.action('save', s, { silent: true });
  }
}
