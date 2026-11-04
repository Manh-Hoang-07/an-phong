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
  }

  create() {
    App.scene = this;
    Art.makeAll(this);
    this.meta = GameData.MAPS[this.mapId];
    this.theme = this.meta.theme;
    this.parseMap();

    this.monsters = [];
    this.npcs = [];
    this.portals = [];
    this.projectiles = this.add.group();
    this.cooldowns = { atk: 0, s0: 0, s1: 0, s2: 0 };
    this.buff = null;
    this.invulnUntil = 0;
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
    this.loots = new Map();
    for (const l of App.player.loot || []) if (l.map === this.mapId) this.addLoot(l, false);

    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12, 0, -90);
    this.cameras.main.fadeIn(300);
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH + 200);

    UI.setMap(this.meta.name);
    UI.banner(this.meta.name, 1600);
    UI.refresh();

    this.saveTimer = this.time.addEvent({ delay: 10000, loop: true, callback: () => this.autoSave() });
    this.regenTimer = this.time.addEvent({ delay: 2000, loop: true, callback: () => this.regen() });
  }

  // ------------------------------------------------------------------ Bản đồ
  parseMap() {
    const raw = this.cache.text.get('map_' + this.mapId).replace(/\r/g, '').split('\n').filter(l => l.length);
    this.rows = raw.length;
    this.cols = Math.max(...raw.map(l => l.length));
    this.grid = raw.map(l => l.padEnd(this.cols, '.').split(''));
    // Thêm vài hàng đất bên dưới để nhân vật không bị nút cảm ứng che
    for (let i = 0; i < 3; i++) this.grid.push(Array(this.cols).fill('#'));
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
    // Hạt sáng bay lơ lửng
    const moteColor = { city: 0xffe6a0, forest: 0x7fffd4, cave: 0xb388ff }[this.theme];
    for (let i = 0; i < 28; i++) {
      const m = this.add.image(Phaser.Math.Between(0, this.worldW), Phaser.Math.Between(40, this.worldH - 120), 'mote')
        .setTint(moteColor).setAlpha(0.15 + Math.random() * 0.35).setScale(0.3 + Math.random() * 0.6)
        .setDepth(-1).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: m, y: m.y - Phaser.Math.Between(40, 120), x: m.x + Phaser.Math.Between(-60, 60),
        alpha: 0, duration: Phaser.Math.Between(4000, 9000), repeat: -1, delay: Math.random() * 4000,
      });
    }
    const layers = this.children.list.filter(c => c.type === 'TileSprite');
    const onResize = (size) => { for (const l of layers) l.setSize(size.width, size.height); };
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => this.scale.off('resize', onResize));
  }

  buildTiles() {
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
            this.add.image(k * T, r * T, `tile_${this.theme}_${top ? 'top' : 'fill'}`).setOrigin(0).setDepth(-2);
          } else {
            this.add.image(k * T, r * T, `plank_${this.theme}`).setOrigin(0).setDepth(-2);
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
        const l = this.add.image(x, this.groundY(r, c), this.theme === 'city' ? 'd_lamp' : 'd_crystal').setOrigin(0.5, 1).setDepth(-4);
        this.tweens.add({ targets: l, alpha: 0.85, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1 });
      } else if (ch === '&') {
        const v = (c * 7) % 3;
        const key = { city: 'd_tree', forest: v === 1 ? 'd_dtree' : 'd_shroom', cave: 'd_crystal' }[this.theme];
        this.add.image(x, this.groundY(r, c), key).setOrigin(0.5, 1).setDepth(-6);
      } else if (ch === '^') {
        if (this.isSolid(r - 1, c)) this.add.image(x, r * T, 'd_stalactite').setOrigin(0.5, 0).setDepth(-4);
        else this.add.image(x, this.groundY(r, c), 'd_crystal').setOrigin(0.5, 1).setDepth(-4);
      }
    });
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
      this.add.text(x, y - 70, GameData.NPCS[id].name, {
        fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontSize: '12px', color: '#ffe9a8', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(5);
      const mark = this.add.image(x, y - 90, 'mark_quest').setDepth(5).setVisible(false);
      this.tweens.add({ targets: mark, y: y - 96, duration: 500, yoyo: true, repeat: -1 });
      s.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.talkTo(id, x));
      this.npcs.push({ id, x, y, sprite: s, mark });
    }
    this.refreshNpcMarks();
  }

  refreshNpcMarks() {
    const p = App.player;
    if (this.portals) this.refreshPortals();
    const q = GameData.QUESTS[p.quest.step];
    for (const n of this.npcs) {
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

  updateWeaponLook() {
    const w = App.stats.wtype;
    this.weapon.setVisible(w !== 'tay');
    if (w !== 'tay') this.weapon.setTexture('w_' + w);
    this.player.setTexture(this.playerTexKey('idle'));
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
    const s = this.physics.add.sprite(x, y, `m_${def.look}_0`).setOrigin(0.5, 1).setDepth(3);
    this.mGroup.add(s);
    s.body.setAllowGravity(!fly);
    if (!fly) {
      s.body.setSize(s.width * 0.7, s.height * 0.9).setOffset(s.width * 0.15, s.height * 0.1);
    } else s.body.setSize(s.width * 0.6, s.height * 0.6).setOffset(s.width * 0.2, s.height * 0.2);
    if (fly) s.setOrigin(0.5, 0.5);
    const span = fly ? [x - 220, x + 220] : this.spanAt(Math.floor(y / T), c);
    const m = {
      id, def, sprite: s, hp: def.hp, maxHp: def.hp, homeX: x, homeY: y, span,
      dir: Math.random() < 0.5 ? -1 : 1, aggro: false, nextAttack: 0, nextTurn: 0, slowUntil: 0, freezeUntil: 0,
      nextJump: 0, nextSlam: 0, alive: true, frameT: 0, hitBy: new Set(),
    };
    s.mon = m;
    m.label = this.add.text(x, y, `${def.name} Lv${def.level}`, {
      fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontSize: def.boss ? '14px' : '11px', color: def.boss ? '#ffab40' : '#ffcdd2',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);
    m.bar = this.add.graphics().setDepth(6);
    this.monsters.push(m);
    this.drawMonsterBar(m);
  }

  monsterTop(m) {
    const s = m.sprite;
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
    for (const m of this.monsters) if (m.alive) this.updateMonster(m, time);
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
    const speedMul = this.buff && time < this.buff.until ? 1 + (this.buff.speed || 0) * 0.3 : 1;
    const speed = st.speed * speedMul;
    const onGround = body.blocked.down || body.touching.down;

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

    const jumpPressed = canAct && (this.pressed('Space') || this.pressed('ArrowUp') || this.pressed('KeyW') || this.tpressed('jump'));
    if (jumpPressed && onGround) {
      if ((this.key('ArrowDown', 'KeyS') || App.touch.down) && body.touching.down && this.onPlatform()) {
        this.dropping = true; this.time.delayedCall(250, () => { this.dropping = false; });
      } else body.setVelocityY(-JUMP_V);
    }

    // Hành động
    if (canAct) {
      if (this.key('KeyJ') || App.touch.attack) this.basicAttack(time);
      for (let i = 0; i < 3; i++) if (this.pressed('Digit' + (i + 1)) || this.tpressed('s' + i)) this.useSkill(i, time);
      if (this.pressed('KeyQ') || this.tpressed('hp')) this.usePotion('hp');
      if (this.pressed('KeyE') || this.tpressed('mp')) this.usePotion('mp');
      if (this.pressed('KeyF') || this.pressed('Enter') || this.tpressed('interact')) this.interact();
    }

    // Hình ảnh
    pl.setFlipX(this.facing < 0);
    let frame = 'idle';
    if (!onGround) frame = 'jump';
    else if (Math.abs(body.velocity.x) > 10) frame = Math.floor(time / 120) % 2 ? 'run1' : 'run2';
    pl.setTexture(this.playerTexKey(frame));
    if (time < this.invulnUntil) pl.setAlpha(Math.floor(time / 80) % 2 ? 0.4 : 1); else pl.setAlpha(1);
    if (this.buff && time < this.buff.until) pl.setTint(0xfff3b0); else pl.clearTint();

    this.placeWeapon();
    this.nameTag.setPosition(pl.x, pl.y - 44);
    this.shadow.setPosition(pl.x, pl.y + 29).setVisible(onGround);

    // Gợi ý tương tác
    const near = this.nearestInteract();
    const npcName = near && near.type === 'npc' ? GameData.NPCS[near.id].name : '';
    UI.hint(npcName ? `F: Nói chuyện với ${npcName}` : '', npcName);
    if (near && near.type === 'portal' && !this.changing && time > (this.portalReady || 0)) this.usePortal(near.portal);
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
    const s = this.saveState();
    const res = await Net.action('change_map', { portal: portal.ch, hp: s.hp, mp: s.mp });
    if (res.ok) {
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
    const buffAtk = this.buff && this.time.now < this.buff.until ? 1 + this.buff.atk : 1;
    const bossMul = mon.def.boss ? 1 + (st.boss || 0) / 100 : 1;
    let dmg = st.atk * mult * buffAtk * bossMul - mon.def.def * 0.5;
    dmg = Math.max(1, dmg) * Phaser.Math.FloatBetween(0.9, 1.1);
    const crit = Math.random() * 100 < st.crit;
    if (crit) dmg *= 1.6;
    return { dmg: Math.round(dmg), crit };
  }

  basicAttack(time) {
    const w = GameData.WEAPON_TYPES[App.stats.wtype];
    const fast = this.buff && time < this.buff.until ? 1 / (1 + this.buff.speed) : 1;
    if (time < this.cooldowns.atk) return;
    this.cooldowns.atk = time + w.cooldown * fast;
    this.swing();
    const pl = this.player;
    if (w.style === 'melee') {
      const fx = this.add.image(pl.x + this.facing * 28, pl.y, 'slash').setDepth(7).setFlipX(this.facing < 0).setAlpha(0.9).setTint(this.accent());
      this.tweens.add({ targets: fx, alpha: 0, scaleX: 1.3, duration: 180, onComplete: () => fx.destroy() });
      this.hitBox(pl.x + this.facing * w.range / 2, pl.y, w.range, 60, w.mult);
    } else if (w.style === 'projectile') {
      this.shoot({ key: 'proj_arrow', speed: 720, range: w.range, mult: w.mult });
    } else {
      this.shoot({ key: 'proj_orb', speed: 460, range: w.range, mult: w.mult, pierce: true, knock: 160 });
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

  hitBox(cx, cy, w, h, mult, extra = {}) {
    const rect = new Phaser.Geom.Rectangle(cx - w / 2, cy - h / 2, w, h);
    let hit = 0;
    for (const m of this.monsters) {
      if (!m.alive) continue;
      if (Phaser.Geom.Intersects.RectangleToRectangle(rect, m.sprite.getBounds())) { this.damageMonster(m, mult, extra); hit++; }
    }
    return hit;
  }

  hitCircle(cx, cy, radius, mult, extra = {}) {
    const circ = new Phaser.Geom.Circle(cx, cy, radius);
    for (const m of this.monsters) {
      if (m.alive && Phaser.Geom.Intersects.CircleToRectangle(circ, m.sprite.getBounds())) this.damageMonster(m, mult, extra);
    }
  }

  shoot(o) {
    const pl = this.player;
    const angle = o.angle || 0;
    const p = this.add.image(pl.x + this.facing * 16, pl.y - 2, o.key).setDepth(7).setFlipX(this.facing < 0);
    if (o.tint) p.setTint(o.tint);
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
        if (Phaser.Geom.Intersects.RectangleToRectangle(b, m.sprite.getBounds())) {
          p.hitSet.add(m);
          this.damageMonster(m, p.o.mult, { slow: p.o.slow, knock: p.o.knock, dir: Math.sign(p.vx) });
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
    const { dmg, crit } = this.calcDamage(mult, m);
    m.hp -= dmg;
    m.aggro = true;
    if (App.stats.lifesteal && !m.def.passive && !this.dead) {
      App.hp = Math.min(App.stats.maxHp, App.hp + dmg * App.stats.lifesteal / 100);
    }
    const s = m.sprite;
    this.floatText(s.x + Phaser.Math.Between(-8, 8), this.monsterTop(m) - 4, (crit ? '💥' : '') + dmg, crit ? '#ffd740' : '#ffffff', crit ? 20 : 15);
    m.flashUntil = this.time.now + 80;
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
    m.hp = 0;
    const s = m.sprite;
    s.body.enable = false;
    m.bar.clear();
    m.label.setVisible(false);
    for (let i = 0; i < 8; i++) {
      const sp = this.add.image(s.x, this.monsterTop(m) + s.height / 2, 'spark').setDepth(7).setTint(m.def.boss ? 0xffab40 : 0xffffff);
      this.tweens.add({ targets: sp, x: sp.x + Phaser.Math.Between(-40, 40), y: sp.y + Phaser.Math.Between(-40, 20), alpha: 0, scale: 0.3, duration: 450, onComplete: () => sp.destroy() });
    }
    this.tweens.add({ targets: s, alpha: 0, duration: 300 });
    if (m.def.boss) this.cameras.main.shake(400, 0.012);
    const dropY = m.def.fly ? this.groundY(Math.floor(s.y / T), Math.floor(s.x / T)) : s.y;
    Net.action('kill', { monster: m.id, x: Math.round(s.x), y: Math.round(dropY) }).then(() => this.refreshNpcMarks());
    this.time.delayedCall(m.def.respawn * 1000, () => this.respawnMonster(m));
  }

  respawnMonster(m) {
    if (!this.sys.isActive()) return;
    const s = m.sprite;
    m.hp = m.maxHp; m.alive = true; m.aggro = false; m.slowUntil = 0; m.freezeUntil = 0;
    s.setPosition(m.homeX, m.homeY).setAlpha(0);
    s.body.enable = true; s.body.setVelocity(0, 0);
    m.label.setVisible(true);
    this.tweens.add({ targets: s, alpha: 1, duration: 400 });
    this.drawMonsterBar(m);
  }

  updateMonster(m, time) {
    const s = m.sprite, d = m.def, pl = this.player;
    m.frameT += 1;
    const animRate = d.fly ? 8 : 14;
    s.setTexture(`m_${d.look}_${Math.floor(m.frameT / animRate) % 2}`);
    const frozen = time < m.freezeUntil;
    if (time < (m.flashUntil || 0)) s.setTintFill(0xffffff);
    else if (frozen) s.setTint(0x9ad7ff);
    else if (time < m.slowUntil) s.setTint(0x9fc5e8);
    else s.clearTint();
    if (d.passive) { this.drawMonsterBar(m); return; }

    const dx = pl.x - s.x, dy = pl.y - (d.fly ? s.y : s.y - s.height / 2);
    const dist = Math.hypot(dx, dy);
    if (!this.dead && dist < (d.boss ? 380 : 220) && Math.abs(dy) < 160) m.aggro = true;
    if (dist > 600 || this.dead) m.aggro = false;

    let spd = d.speed * (time < m.slowUntil ? 0.5 : 1);
    if (d.boss && m.hp < m.maxHp * 0.3) spd *= 1.4;

    if (frozen) { s.body.setVelocity(0, d.fly ? 0 : s.body.velocity.y); this.drawMonsterBar(m); return; }

    if (d.fly) {
      let tx, ty;
      if (m.aggro) { tx = pl.x; ty = pl.y - 10; }
      else { tx = m.homeX + Math.sin(time / 900 + m.homeX) * 80; ty = m.homeY + Math.sin(time / 500 + m.homeX) * 20; }
      if (Math.abs(tx - m.homeX) > 350) tx = m.homeX + Math.sign(tx - m.homeX) * 350;
      const ang = Math.atan2(ty - s.y, tx - s.x);
      const near = Math.hypot(tx - s.x, ty - s.y) < 6;
      s.body.setVelocity(near ? 0 : Math.cos(ang) * spd, near ? 0 : Math.sin(ang) * spd);
      s.setFlipX(s.body.velocity.x < 0);
    } else {
      if (!(time < (m.knockUntil || 0))) {
        let vx;
        if (m.aggro) vx = Math.abs(dx) > 12 ? Math.sign(dx) * spd * 1.25 : 0;
        else {
          if (time > m.nextTurn) { m.dir = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1); m.nextTurn = time + 1500 + Math.random() * 2000; }
          vx = m.dir * spd * 0.6;
          if (Math.abs(s.x - m.homeX) > 120) vx = Math.sign(m.homeX - s.x) * spd * 0.6;
        }
        if ((s.x <= m.span[0] && vx < 0) || (s.x >= m.span[1] && vx > 0)) vx = 0;
        s.body.setVelocityX(vx);
        if (vx) s.setFlipX(d.look === 'mushroom' ? false : vx < 0);
      }
      s.x = Phaser.Math.Clamp(s.x, m.span[0] - 4, m.span[1] + 4);
      if (d.jumper && m.aggro && time > m.nextJump && s.body.blocked.down) { s.body.setVelocityY(-420); m.nextJump = time + 1600; }
    }

    // Đòn đặc biệt của trùm: dậm đất
    if (d.boss && m.aggro && time > m.nextSlam) { m.nextSlam = time + 4500; this.bossSlam(m); }

    // Chạm vào người chơi thì gây sát thương
    if (!this.dead && time > m.nextAttack && d.atk > 0) {
      const b1 = s.getBounds(), b2 = pl.getBounds();
      Phaser.Geom.Rectangle.Inflate(b1, -4, -4);
      if (Phaser.Geom.Intersects.RectangleToRectangle(b1, b2)) {
        m.nextAttack = time + (d.boss ? 1400 : 1100);
        this.hurtPlayer(d.atk, Math.sign(pl.x - s.x) || 1);
      }
    }
    this.drawMonsterBar(m);
  }

  bossSlam(m) {
    const s = m.sprite;
    const g = this.add.graphics().setDepth(1);
    let t = 0;
    const R = 170;
    const ev = this.time.addEvent({
      delay: 30, repeat: 26, callback: () => {
        t++;
        g.clear();
        g.fillStyle(0xff3d00, 0.12 + t * 0.008).fillEllipse(s.x, s.y, R * 2 * (t / 27), 50 * (t / 27));
        g.lineStyle(2, 0xff6e40, 0.8).strokeEllipse(s.x, s.y, R * 2, 50);
      },
    });
    this.time.delayedCall(850, () => {
      g.destroy();
      if (!m.alive) return;
      this.cameras.main.shake(200, 0.01);
      const pl = this.player;
      if (Math.abs(pl.x - s.x) < R && Math.abs(pl.body.bottom - s.y) < 40 && !this.dead) {
        this.hurtPlayer(Math.round(m.def.atk * 1.5), Math.sign(pl.x - s.x) || 1, 420);
      }
    });
  }

  hurtPlayer(atk, dir, push = 260) {
    const now = this.time.now;
    if (now < this.invulnUntil || this.dashing) return;
    const dmg = Math.max(1, Math.round(atk * Phaser.Math.FloatBetween(0.9, 1.1) - App.stats.def * 0.5));
    App.hp -= dmg;
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
    this.player.setTint(0x555555).setAngle(this.facing * -90);
    this.player.body.setVelocity(0, 0);
    UI.banner('Bạn đã bị đánh bại', 1800);
    await new Promise(r => setTimeout(r, 1800));
    const res = await Net.action('die');
    if (res.player) { App.hp = res.player.hp; App.mp = res.player.mp; }
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => this.scene.restart({ map: GameData.START_MAP, arrive: 'S' }));
  }

  // ------------------------------------------------------------------ Kỹ năng
  useSkill(i, time) {
    const id = App.player.skillSlots[i];
    if (!id) { UI.log(App.player.school ? 'Ô kỹ năng trống (phím K để xem).' : 'Chưa có kỹ năng. Đạt cấp 5 và chọn class ở Hội trưởng Khải.', '#bdbdbd'); return; }
    const sk = GameData.SKILLS[id];
    if (sk.level > App.player.level) { UI.log(`${sk.name} cần cấp ${sk.level}.`, '#bdbdbd'); return; }
    if (time < this.cooldowns['s' + i]) return;
    const cost = Math.round(sk.mp * App.stats.costMul);
    if (App.mp < cost) { UI.log('Không đủ năng lượng!', '#64b5f6'); return; }
    App.mp -= cost;
    const cdMs = sk.cd * 1000 * (1 - (App.stats.cdr || 0) / 100);
    this.cooldowns['s' + i] = time + cdMs;
    this.cooldownLen = this.cooldownLen || {};
    this.cooldownLen['s' + i] = cdMs;
    const pw = sk.power ? sk.power * App.stats.skillMul : 0;
    const pl = this.player;
    this.floatText(pl.x, pl.y - 52, sk.name, '#fff59d', 14);

    switch (sk.type) {
      case 'dash': {
        this.dashing = true;
        const startX = pl.x;
        const endX = Phaser.Math.Clamp(pl.x + this.facing * sk.distance, 20, this.worldW - 20);
        pl.body.setVelocityX(this.facing * 1100);
        pl.body.setAllowGravity(false); pl.body.setVelocityY(0);
        const trail = this.time.addEvent({ delay: 25, repeat: 6, callback: () => {
          const ghost = this.add.image(pl.x, pl.y, pl.texture.key).setFlipX(pl.flipX).setAlpha(0.5).setTint(0x7fd3ff).setDepth(3);
          this.tweens.add({ targets: ghost, alpha: 0, duration: 250, onComplete: () => ghost.destroy() });
        } });
        this.time.delayedCall(Math.abs(endX - startX) / 1100 * 1000 + 20, () => {
          this.dashing = false; pl.body.setAllowGravity(true); pl.body.setVelocityX(0);
          const a = Math.min(startX, pl.x), b = Math.max(startX, pl.x);
          this.hitBox((a + b) / 2, pl.y, b - a + 50, 64, pw);
          const fx = this.add.image(pl.x, pl.y, 'slash').setScale(1.6, 1.2).setDepth(7).setFlipX(this.facing < 0).setTint(this.accent());
          this.tweens.add({ targets: fx, alpha: 0, duration: 250, onComplete: () => fx.destroy() });
        });
        this.invulnUntil = time + 400;
        break;
      }
      case 'melee': {
        for (let h = 0; h < sk.hits; h++) {
          this.time.delayedCall(h * 110, () => {
            this.swing();
            const fx = this.add.image(pl.x + this.facing * 34, pl.y + (h % 2 ? 8 : -8), 'slash').setDepth(7)
              .setFlipX(this.facing < 0).setFlipY(h % 2 === 1).setScale(1.3);
            this.tweens.add({ targets: fx, alpha: 0, duration: 150, onComplete: () => fx.destroy() });
            this.hitBox(pl.x + this.facing * sk.range / 2, pl.y, sk.range, 70, pw);
          });
        }
        break;
      }
      case 'buff': {
        this.buff = { until: time + sk.duration * 1000, atk: sk.atkBuff * (App.stats.skillMul), speed: sk.speedBuff };
        for (let k = 0; k < 6; k++) {
          const ghost = this.add.image(pl.x, pl.y, pl.texture.key).setTint(0x7fd3ff).setAlpha(0.6).setDepth(3);
          this.tweens.add({ targets: ghost, x: pl.x + Phaser.Math.Between(-60, 60), alpha: 0, duration: 500, onComplete: () => ghost.destroy() });
        }
        break;
      }
      case 'projectile': {
        const water = sk.school === 'phap_su';
        this.swing();
        this.shoot({ key: water ? 'fx_wave' : 'proj_fire', speed: water ? 520 : 820, range: sk.range, mult: pw,
          pierce: sk.pierce, slow: sk.slow, knock: water ? 140 : 60 });
        break;
      }
      case 'spread': {
        this.swing();
        for (let k = 0; k < sk.count; k++) {
          const ang = (k - (sk.count - 1) / 2) * 0.18;
          this.shoot({ key: 'proj_fire', speed: 760, range: sk.range, mult: pw, angle: ang });
        }
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
        const amount = Math.round(App.stats.maxHp * sk.heal * (App.stats.skillMul));
        App.hp = Math.min(App.stats.maxHp, App.hp + amount);
        this.floatText(pl.x, pl.y - 30, '+' + amount, '#69f0ae', 16);
        const c = this.add.circle(pl.x, pl.y, 10, 0xb2ff59, 0.5).setDepth(7);
        this.tweens.add({ targets: c, radius: 60, alpha: 0, duration: 500, onComplete: () => c.destroy() });
        break;
      }
    }
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
    App.mp = Math.min(App.stats.maxMp, App.mp + App.stats.maxMp * 0.02 * mul);
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
