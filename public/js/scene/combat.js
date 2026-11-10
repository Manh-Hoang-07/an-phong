'use strict';
/* WorldScene · Chiến đấu: tính sát thương, đánh thường, vùng trúng đòn, đạn, người chơi bị đánh / chết, hiệu ứng chém. */
WorldScene.mix(class WorldCombat {
  // ------------------------------------------------------------------ Chiến đấu
  calcDamage(mult, mon) {
    const st = App.stats;
    const bt = this.buffTotals();
    const bossMul = (mon.def.boss || mon.def.leader) ? 1 + (st.boss || 0) / 100 : 1;
    // Giảm giáp theo tỉ lệ: DEF / (DEF + 60 + 12 x cấp quái), tối đa 75% (xem GameData.defReduce)
    let dmg = st.atk * mult * (1 + bt.atk) * bossMul * (1 - GameData.defReduce(mon.def.def, mon.def.level));
    dmg = Math.max(1, dmg) * Phaser.Math.FloatBetween(0.9, 1.1);
    const crit = Math.random() * 100 < Math.min(90, st.crit + bt.crit);
    if (crit) {
      // Nội tại Sát Thủ "Bóng Tối": chí mạng đầu tiên sau kỹ năng lướt gây 250%
      if (this.shadowCrit && this.hasPassive('sat_thu')) { dmg *= 2.5; this.shadowCrit = false; }
      else dmg *= this.hasPassive('cung_thu') ? 1.8 : 1.6;
    }
    return { dmg: Math.round(dmg), crit };
  }

  basicAttack(time) {
    const w = GameData.WEAPON_TYPES[App.stats.wtype];
    const fast = 1 / (1 + this.buffTotals(time).speed);
    if (time < this.cooldowns.atk) return;
    const sta = this.attackStaminaCost();
    if (!this.canSpendStamina(sta)) { this.cooldowns.atk = time + 250; return; }
    this.spendStamina(sta);
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
      this.shoot({ key: w.proj || 'proj_arrow', speed: w.speed || 720, range: w.range, mult: w.mult, basic: true });
    } else {
      this.shoot({ key: 'proj_orb', speed: 460, range: w.range, mult: w.mult, pierce: true, knock: 160, basic: true });
    }
  }

  swing() {
    this.swinging = true;
    const wt = GameData.WEAPON_TYPES[App.stats.wtype]?.look, f = this.facing, done = () => { this.swinging = false; };
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
        if (!m.alive || p.hitSet.has(m) || Math.abs(m.sprite.x - p.x) > 350) continue;   // quái xa: không cần tính khung va chạm
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
    m.lastHitSource = extra.pet ? 'pet' : extra.shadow ? 'shadow' : 'player';
    let { dmg, crit } = extra.reflect ? { dmg: extra.reflect, crit: false } : extra.shadow
      ? { dmg: Math.max(1, Math.round((extra.shadowAtk || GameData.calcStats(App.player).atk * 0.13) * mult * (1 - GameData.defReduce(m.def.def, m.def.level)))), crit: false }
      : extra.pet
      ? { dmg: Math.max(1, Math.round((extra.petAtk || GameData.petStats(App.player).atk) * mult * (1 - GameData.defReduce(m.def.def, m.def.level)))), crit: false }
      : this.calcDamage(mult, m);
    if (extra.basic && m.def.resist) dmg = Math.max(1, Math.round(dmg * (1 - m.def.resist)));
    m.hp -= dmg;
    m.aggro = true;
    if (!extra.pet && App.stats.lifesteal && !m.def.passive && !this.dead) {
      App.hp = Math.min(App.stats.maxHp, App.hp + dmg * App.stats.lifesteal / 100);
    }
    // Nội tại Kiếm Tâm: đánh thường trúng quái hồi 1% máu
    if (!extra.pet && extra.basic && !m.def.passive && !this.dead && this.hasPassive('kiem_si') && this.time.now > (this.healTick || 0)) {
      this.healTick = this.time.now + 120;
      App.hp = Math.min(App.stats.maxHp, App.hp + App.stats.maxHp * 0.01);
    }
    const s = m.sprite;
    this.floatText(s.x + Phaser.Math.Between(-8, 8), this.monsterTop(m) - 4, (crit ? '💥' : '') + dmg, crit ? '#ffd740' : '#ffffff', crit ? 20 : 15);
    m.flashUntil = this.time.now + 80;
    if (!extra.reflect) this.hitFx(s.x, s.body.center.y, crit, extra.dir || this.facing);
    if (m.sheet && m.alive && m.state === 'move' && m.hp > dmg) { m.hitUntil = this.time.now + 220; s.play(`mb_${m.sheet}_hit`, true); }
    Sound.play(crit ? 'crit' : 'hit');
    if (!m.def.boss && !m.def.leader && !m.def.passive) {
      const dir = extra.dir || Math.sign(s.x - this.player.x) || 1;
      s.body.setVelocityX(dir * (extra.knock || 90));
      m.knockUntil = this.time.now + 150;
    }
    if (extra.slow) m.slowUntil = this.time.now + extra.slow * 1000;
    if (extra.freeze) m.freezeUntil = this.time.now + extra.freeze * 1000;
    // Trùm phụ bỏ chạy khi còn ít máu (Lam Sương): tính là hạ gục cho nhiệm vụ
    if (m.hp > 0 && m.def.fleeAt && m.hp <= m.maxHp * m.def.fleeAt) {
      m.fled = true;
      UI.banner(`${m.def.name} bỏ chạy!`, 1600);
      this.floatText(s.x, this.monsterTop(m), 'Bỏ chạy!', '#ffd54f', 16);
      this.killMonster(m);
      return;
    }
    if (m.hp <= 0) this.killMonster(m);
    else this.drawMonsterBar(m);
  }

  hurtPlayer(atk, dir, push = 260, mon = null) {
    const now = this.time.now;
    if (now < this.invulnUntil || this.dashing) return;
    let dmg = Math.max(1, Math.round(atk * Phaser.Math.FloatBetween(0.9, 1.1) * (1 - GameData.defReduce(App.stats.def, App.player.level))));
    // Nội tại Tanker "Thành Đồng": máu dưới 50% giảm thêm 10% sát thương
    if (App.hp < App.stats.maxHp * 0.5 && this.hasPassive('tanker')) dmg = Math.max(1, Math.round(dmg * 0.9));
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
    const companions = this.summonedPetIds();
    if (companions.length) {
      const petDef = GameData.petStats(App.player), share = dmg * 0.18 / companions.length;
      for (const id of companions) {
        const petState = App.player.pets[id];
        if (!petState || petState.hp <= 0) continue;
        const petDamage = Math.max(1, Math.round(share * (1 - GameData.defReduce(petDef.def, App.player.level))));
        petState.hp = Math.max(0, petState.hp - petDamage);
        const companion = this.companionSprites[id];
        this.floatText(companion ? companion.sprite.x : this.player.x - 35, this.player.y - 36, `-${petDamage}`, '#ff9b9b', 12);
      }
    }
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
    this.endForm();
    this.dead = true;
    App.hp = 0;
    if (this.sheetId) { this.attackUntil = 0; this.player.setAngle(0); this.player.play(this.charAnim('death')); }
    else this.player.setTint(0x555555).setAngle(this.facing * -90);
    this.player.body.setVelocity(0, 0);
    UI.banner('Bạn đã bị đánh bại', 1800);
    await new Promise(r => setTimeout(r, 1800));
    const res = await Net.action('die');
    if (res.player) { App.hp = res.player.hp; App.mp = res.player.mp; }
    App.sta = App.stats.maxSta; App.staLocked = false;
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => this.scene.restart({ map: GameData.START_MAP, arrive: 'S' }));
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
});
