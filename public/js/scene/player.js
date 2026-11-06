'use strict';
/* WorldScene · Nhân vật: dựng hình, vũ khí, hoạt ảnh, thuốc, hồi phục, vầng quang, hiệu ứng lên cấp / thức tỉnh. */
WorldScene.mix(class WorldPlayer {
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

  usePotion(kind, wanted) {
    const p = App.player;
    const ids = kind === 'hp' ? ['binh_mau_vua', 'thuoc_nhiem_do', 'binh_mau_nho'] : ['binh_nl_vua', 'binh_nl_nho'];
    const can = (i) => p.bag.some(e => e.id === i) && (GameData.ITEMS[i].level || 1) <= p.level;
    const id = (wanted && can(wanted)) ? wanted : ids.find(can);
    if (!id) { UI.log(kind === 'hp' ? 'Hết bình máu! Mua ở Bà Lan.' : 'Hết bình năng lượng! Mua ở Bà Lan.', '#ef5350'); return; }
    if (kind === 'hp' && App.hp >= App.stats.maxHp) return;
    if (kind === 'mp' && App.mp >= App.stats.maxMp) return;
    // Server chặn uống quá nhanh (400ms); chặn luôn ở đây để không hồi máu "ảo" rồi bị trả lại
    const now = Date.now();
    if (now < (this.potionReadyAt || 0)) return;
    this.potionReadyAt = now + 450;
    // Hồi máu NGAY khi bấm (cùng công thức với server), server kiểm tra sau; nếu bị từ chối thì trả lại như cũ
    const def = GameData.ITEMS[id], st = App.stats;
    const healHp = (def.hp || 0) + (def.hpPct ? Math.round(st.maxHp * def.hpPct) : 0);
    const healMp = def.mp || 0;
    const sent = { item: id, hp: Math.round(App.hp), mp: Math.round(App.mp) };
    const gotHp = Math.min(st.maxHp, App.hp + healHp) - App.hp, gotMp = Math.min(st.maxMp, App.mp + healMp) - App.mp;
    App.hp += gotHp; App.mp += gotMp;
    const entry = p.bag.find(e => e.id === id);
    if (entry) entry.qty--;          // số bình hiển thị giảm ngay; server gửi về số chuẩn sau
    if (this.player) {
      if (healHp) this.floatText(this.player.x, this.player.y - 30, '+' + healHp, '#69f0ae');
      if (healMp) this.floatText(this.player.x, this.player.y - 46, '+' + healMp, '#64b5f6');
    }
    UI.refresh();
    Net.action('use', sent, { skipEvents: ['heal'] }).then((r) => {
      if (r && r.ok === false) {
        App.hp = Math.max(1, App.hp - gotHp); App.mp = Math.max(0, App.mp - gotMp);
        if (!r.player && entry) entry.qty++;   // mất mạng hẳn: trả lại bình (có phản hồi thì server đã gửi số chuẩn)
        UI.refresh();
      }
    });
  }

  regen() {
    if (this.dead) return;
    const safe = this.mapId === GameData.START_MAP;
    const idle = this.time.now - this.lastHurt > 5000;
    const mul = safe ? 4 : idle ? 1 : 0.3;
    App.hp = Math.min(App.stats.maxHp, App.hp + App.stats.maxHp * 0.01 * mul);
    // Buff "Ân Sủng" (Trị Liệu Sư): hồi 3% máu mỗi nhịp (2 giây), 5% khi skill cấp 10
    const grace = this.buffOn('grace');
    if (grace) App.hp = Math.min(App.stats.maxHp, App.hp + App.stats.maxHp * (grace.regen || 0.03));
    App.mp = Math.min(App.stats.maxMp, App.mp + App.stats.maxMp * 0.02 * mul * (this.hasPassive('phap_su') ? 2 : 1));
  }

  // ------------------------------------------------------------------ Thể lực (tách riêng với năng lượng)
  // Trừ thể lực cho một đòn/kỹ năng. Không đủ, hoặc đang kiệt sức → trả false (không được đánh).
  canSpendStamina(cost) {
    if (App.staLocked || App.sta < cost) {
      if (!App.staLocked) App.staLocked = true;   // vừa cạn: kiệt sức tới khi hồi đủ ngưỡng
      if (this.time.now > (this.staWarnAt || 0)) {
        this.staWarnAt = this.time.now + 1500;
        UI.log('Hết thể lực! Chờ hồi lại rồi mới đánh tiếp được.', '#ffca28');
        if (this.player) this.floatText(this.player.x, this.player.y - 52, 'Kiệt sức', '#ffca28', 13);
      }
      return false;
    }
    return true;
  }
  spendStamina(cost) {
    App.sta = Math.max(0, App.sta - cost);
    this.staUsedAt = this.time.now;
  }
  attackStaminaCost() {
    const S = GameData.STAMINA, w = GameData.WEAPON_TYPES[App.stats.wtype];
    return Math.max(1, Math.round(S.attack * w.cooldown / 400));
  }
  skillStaminaCost(sk) { return sk.ult ? GameData.STAMINA.ult : GameData.STAMINA.skill; }

  // Hồi thể lực từ từ (gọi mỗi khung hình)
  staminaTick(time, delta) {
    const S = GameData.STAMINA, max = App.stats.maxSta;
    if (App.sta == null) App.sta = max;
    if (App.sta < max && !this.dead) {
      const rate = time - (this.staUsedAt || 0) > S.delay ? 1 : S.activeMul;
      App.sta = Math.min(max, App.sta + S.regen * rate * delta / 1000);
    }
    if (App.staLocked && App.sta >= max * S.unlock) App.staLocked = false;
  }

  drawAura(time) {
    const g = this.aura, pl = this.player;
    g.clear();
    const guard = this.buffOn('guard', time), shield = this.buffOn('manashield', time);
    if (guard) { g.lineStyle(3, 0xffb36b, 0.6 + Math.sin(time / 120) * 0.2).strokeEllipse(pl.x, pl.y + 2, 54, 70); }
    if (shield) { g.fillStyle(0x8fb4ff, 0.12).fillCircle(pl.x, pl.y, 38); g.lineStyle(2, 0xbfd2ff, 0.7).strokeCircle(pl.x, pl.y, 38); }
    // Buff awaken tạm thời (skill vn1 Toàn Năng)
    if (this.buffOn('awaken', time)) { g.lineStyle(2, 0xffd54f, 0.5 + Math.sin(time / 90) * 0.3).strokeEllipse(pl.x, pl.y + 28, 60, 14); }
    // Vầng quang vĩnh viễn theo bậc thức tỉnh
    const tier = App.player.awakenTier || 0;
    if (tier >= 1) {
      const aw = GameData.awakenOf(App.player);
      const col = aw ? aw.aura : 0xffd54f;
      const pulse = 0.45 + Math.sin(time / 110) * 0.2;
      // Đường sáng dưới chân + ring ngoài
      g.fillStyle(col, 0.18 * pulse).fillEllipse(pl.x, pl.y + 28, 80, 22);
      g.lineStyle(tier >= 2 ? 3 : 2, col, pulse).strokeEllipse(pl.x, pl.y + 28, tier >= 2 ? 90 : 68, tier >= 2 ? 24 : 16);
      if (tier >= 2) {
        // ấn 2: thêm ring thứ hai xoay đối
        g.lineStyle(1, col, pulse * 0.5).strokeEllipse(pl.x, pl.y, 50, 70);
      }
    }
  }

  levelUpFx() {
    const pl = this.player;
    if (!pl) return;
    const c = this.add.circle(pl.x, pl.y, 20, 0xffd54f, 0.5).setDepth(7);
    this.tweens.add({ targets: c, radius: 90, alpha: 0, duration: 700, onComplete: () => c.destroy() });
  }

  // Hiệu ứng khi thức tỉnh bậc mới
  awakenFx(tier) {
    const pl = this.player;
    if (!pl) return;
    const col = tier >= 2 ? 0xff80ab : 0xffe082;
    // Vụ nổ ring
    for (let i = 0; i < 3; i++) {
      const ring = this.add.graphics().setDepth(8);
      this.time.delayedCall(i * 120, () => {
        let r = 10;
        this.time.addEvent({ delay: 16, repeat: 18, callback: () => {
          r += 8; ring.clear().lineStyle(3 - i * 0.5, col, 1 - r / 160).strokeEllipse(pl.x, pl.y, r * 2, r * 0.7);
          if (r >= 150) ring.destroy();
        } });
      });
    }
    this.cameras.main.flash(350, (col >> 16) & 0xff, (col >> 8) & 0xff, col & 0xff);
    this.cameras.main.shake(300, 0.01);
    for (let k = 0; k < 16; k++) {
      const sp = this.add.image(pl.x, pl.y, 'spark').setDepth(8).setTint(col);
      this.tweens.add({ targets: sp, x: pl.x + Phaser.Math.Between(-90, 90), y: pl.y + Phaser.Math.Between(-80, 30), alpha: 0, scale: 0.5, duration: 650, onComplete: () => sp.destroy() });
    }
    Sound.play('levelup');
  }
});
