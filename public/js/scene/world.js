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
    this.enemyShots = [];              // đạn của trùm (không dùng chung với đạn người chơi)
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
    this.updateEnemyShots(delta);
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
    let speed = st.speed * speedMul;
    if (time < (this.playerSlowUntil || 0)) speed *= 0.6;   // nước dâng / băng của trùm
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
    // Tint: thức tỉnh vĩnh viễn (awakenTier) ưu tiên; buff tạm thời dùng vàng nhạt;
    // khi không có gì thì dùng tint cố định của class (ví dụ tri_lieu_su xanh lá)
    const tier = App.player.awakenTier || 0;
    const classSheet = Sprites.CHARS[this.sheetId];
    const classTint = classSheet && classSheet.tint;
    if (tier >= 2) pl.setTint(0xff94c4);
    else if (tier === 1) pl.setTint(0xffe082);
    else if (bt.atk || bt.crit || bt.speed) pl.setTint(0xfff3b0);
    else if (classTint) pl.setTint(classTint);
    else pl.clearTint();
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

// Các phần khác của WorldScene nằm trong public/js/scene/*.js, viết dạng class rồi gắn
// method vào WorldScene.prototype (giữ nguyên cú pháp method như khi còn chung một file).
WorldScene.mix = function (part) {
  for (const k of Object.getOwnPropertyNames(part.prototype)) {
    if (k !== 'constructor') Object.defineProperty(WorldScene.prototype, k, Object.getOwnPropertyDescriptor(part.prototype, k));
  }
};
