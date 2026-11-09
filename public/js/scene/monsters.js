'use strict';
/* WorldScene · Quái: tạo, thanh máu, hạ quái, hồi sinh, AI di chuyển / tấn công. */
WorldScene.mix(class WorldMonsters {
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
    const sheet = Sprites.hasMob(this, def) ? Sprites.mobOf(def) : null;
    const s = this.physics.add.sprite(x, y, sheet ? `mb_${sheet}_idle` : Sprites.codeTex(def.look)).setOrigin(0.5, 1).setDepth(3);
    this.mGroup.add(s);
    s.body.setAllowGravity(!fly);
    if (sheet) {
      Sprites.fitMob(s, def, !fly);
      s.play(`mb_${sheet}_idle`);
    } else if (!fly) {
      s.body.setSize(s.width * 0.7, s.height * 0.9).setOffset(s.width * 0.15, s.height * 0.1);
    } else s.body.setSize(s.width * 0.6, s.height * 0.6).setOffset(s.width * 0.2, s.height * 0.2);
    if (fly && !sheet) s.setOrigin(0.5, 0.5);
    // Phân biệt hạng quái (tinh anh/thủ lĩnh/boss): to hơn và màu riêng theo hệ số
    const grade = GameData.monGrade(def);
    if (grade.scale !== 1) s.setScale(s.scaleX * grade.scale, s.scaleY * grade.scale);
    const span = fly ? [x - 220, x + 220] : this.spanAt(Math.floor(y / T), c);
    for (const pt of this.portals) {
      if (pt.x < span[0] - 160 || pt.x > span[1] + 160) continue;
      if (pt.x <= x) span[0] = Math.max(span[0], pt.x + 160);
      else span[1] = Math.min(span[1], pt.x - 160);
    }
    if (span[0] > span[1]) span[0] = span[1] = x;
    const m = {
      id, def, sprite: s, sheet, baseTint: Sprites.tintOf(def), baseScale: s.scaleX, hp: GameData.monHp(def), maxHp: GameData.monHp(def), homeX: x, homeY: y, span,
      dir: Math.random() < 0.5 ? -1 : 1, aggro: false, nextAttack: 0, nextTurn: 0, slowUntil: 0, freezeUntil: 0,
      nextJump: 0, nextSlam: 0, nextSpecial: 0, alive: true, frameT: 0, hitBy: new Set(), state: 'move', stateUntil: 0, enraged: false,
    };
    s.mon = m;
    const isBig = def.boss || def.leader;
    m.label = this.add.text(x, y, `${def.name} Lv${def.level}`, {
      fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif', fontSize: isBig ? '14px' : '11px', color: grade.nameColor,
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
    const g = GameData.monGrade(m.def);
    const w = g.barW;
    const top = this.monsterTop(m);
    m.label.setPosition(s.x, top - 16);
    m.bar.clear();
    if (!m.alive || (m.hp >= m.maxHp && !m.def.boss && !m.def.leader)) return;
    m.bar.fillStyle(0x000000, 0.6).fillRect(s.x - w / 2 - 1, top - 8, w + 2, 6);
    m.bar.fillStyle(g.bar).fillRect(s.x - w / 2, top - 7, w * Math.max(0, m.hp / m.maxHp), 4);
  }

  killMonster(m) {
    m.alive = false;
    Sound.play(m.def.boss ? 'boom' : 'kill');
    m.hp = 0;
    const s = m.sprite;
    s.body.enable = false;
    m.bar.clear();
    m.label.setVisible(false);
    const grade = GameData.gradeOf(m.def);
    const sparkColor = grade === 'boss' || grade === 'leader' ? 0xffab40 : grade === 'elite' ? 0xff8a8a : 0xffffff;
    const sparkCount = grade === 'boss' ? 10 : grade === 'leader' ? 8 : grade === 'elite' ? 6 : 8;
    for (let i = 0; i < sparkCount; i++) {
      const sp = this.add.image(s.x, s.body.center.y, 'spark').setDepth(7).setTint(sparkColor);
      this.tweens.add({ targets: sp, x: sp.x + Phaser.Math.Between(-40, 40), y: sp.y + Phaser.Math.Between(-40, 20), alpha: 0, scale: 0.3, duration: 450, onComplete: () => sp.destroy() });
    }
    if (m.sheet && Sprites.MOBS[m.sheet].fakeDeath) {
      // Bộ hình không có hoạt ảnh chết: đứng khựng rồi ngã nghiêng sang một bên, mờ dần
      s.play(`mb_${m.sheet}_death`);
      const side = s.flipX === !!s._faceLeft ? -1 : 1;
      this.tweens.add({ targets: s, angle: 80 * side, y: s.y + 4, duration: 380, ease: 'Quad.easeIn' });
      this.tweens.add({ targets: s, alpha: 0, duration: 300, delay: 450 });
    } else if (m.sheet) { s.play(`mb_${m.sheet}_death`); this.tweens.add({ targets: s, alpha: 0, duration: 300, delay: 450 }); }
    else this.tweens.add({ targets: s, alpha: 0, duration: 300 });
    if (m.def.boss) { this.cameras.main.shake(400, 0.012); this.slowMo(0.3, 900); }
    if (m.def.leader) { this.cameras.main.shake(250, 0.008); this.slowMo(0.4, 600); }
    const dropY = m.def.fly ? this.groundY(Math.floor(s.y / T), Math.floor(s.x / T)) : s.y;
    this.pendingKills.push({ monster: m.id, x: Math.round(s.x), y: Math.round(dropY), source: m.lastHitSource || 'player' });
    if (!this.killFlush) this.killFlush = this.time.delayedCall(120, () => this.flushKills());
    if (m.def.boss) this.hitstop(120);
    if (m.def.leader) this.hitstop(60);
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
    m.fled = false; m.nextSpecial = 0; m.moonStage = 1;
    m.baseTint = Sprites.tintOf(m.def);
    s.setPosition(m.homeX, m.homeY).setAlpha(0).setScale(m.baseScale).setAngle(0);
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
    if (!m.sheet) s.setTexture(Sprites.codeTex(d.look, Math.floor(m.frameT / animRate) % 2));
    const frozen = time < m.freezeUntil;
    const winding = m.state === 'windup';
    if (time < (m.flashUntil || 0)) s.setTintFill(0xffffff);
    else if (frozen) s.setTint(0x9ad7ff);
    else if (winding) { if (Math.floor(time / 70) % 2) s.setTintFill(0xff4d4d); else this.baseTint(m); }
    else if (m.enraged) s.setTint(0xff9a9a);
    else if (time < m.slowUntil) s.setTint(0x9fc5e8);
    else this.baseTint(m);
    if (m.sheet && m.alive) this.mobAnim(m, time);
    // Lưới an toàn: quái đi bộ lọt vào trong đất / rơi khỏi bản đồ (bị đẩy lùi quá mạnh, khung hình giật...) → về chỗ xuất hiện
    if (!d.fly && m.alive && s.body && (s.body.bottom > this.worldH + 40 || this.isSolid(Math.floor((s.body.bottom - 6) / T), Math.floor(s.x / T)))) {
      s.body.reset(m.homeX, m.homeY);
    }
    if (d.passive) { this.drawMonsterBar(m); return; }

    const dx = pl.x - s.x, dy = pl.y - (d.fly ? s.y : s.body.center.y);
    const dist = Math.hypot(dx, dy);
    if (!this.dead && dist < (d.boss || d.leader ? 380 : 220) && Math.abs(dy) < 160) m.aggro = true;
    if (dist > 600 || this.dead) { m.aggro = false; if (m.state !== 'move') this.endAttack(m, time); }

    let spd = d.speed * (time < m.slowUntil ? 0.5 : 1);
    if (m.enraged) spd *= 1.35;

    // Trùm/thủ lĩnh: giai đoạn 2 khi còn dưới 50% máu
    if ((d.boss || d.leader) && !m.enraged && m.hp < m.maxHp * 0.5) this.bossEnrage(m, time);
    if (m.wave) this.updateBossWave(m, time);

    if (frozen) {
      if (m.state !== 'move') this.endAttack(m, time);
      s.body.setVelocity(0, d.fly ? 0 : s.body.velocity.y); this.drawMonsterBar(m); return;
    }

    const reach = (d.boss || d.leader ? 70 : 34) + s.width * 0.3;
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

    // Đòn đặc biệt của trùm theo phong cách riêng (xem bossSpecial)
    if (d.boss && (!d.style || d.style === 'slam') && m.aggro && time > m.nextSlam) {
      m.nextSlam = time + (m.enraged ? 3200 : 4500);
      this.bossSlam(m);
    }
    if (d.boss && d.style && d.style !== 'slam' && m.aggro && time > (m.nextSpecial || 0)) {
      m.nextSpecial = time + (m.enraged ? 4800 : 6200);
      this.bossSpecial(m, time);
    }

    // Đủ gần thì bắt đầu gồng đòn
    const inRange = d.fly ? dist < 90 : Math.abs(dx) < reach + 30 && Math.abs(pl.body.bottom - s.y) < 70;
    if (m.aggro && !this.dead && d.atk > 0 && time > m.nextAttack && inRange) {
      m.state = 'windup';
      m.stateUntil = time + (d.boss || d.leader ? (m.enraged ? 450 : 600) : d.fly ? 420 : 380);
      m.lungeDir = Math.sign(dx) || 1;
      if (!d.fly && d.look !== 'mushroom') s.setFlipX(dx < 0);
      this.tweens.add({ targets: s, scaleY: m.baseScale * 0.9, scaleX: m.baseScale * 1.06, duration: 120, yoyo: true });
      if (m.sheet) { const [n] = Sprites.MOBS[m.sheet].anims.attack; s.play({ key: `mb_${m.sheet}_attack`, frameRate: n / ((m.stateUntil - time + (d.boss || d.leader ? 320 : 240)) / 1000) }, false); }
      if (d.boss || d.leader) Sound.play('warn');
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
    m.nextAttack = time + (m.def.boss || m.def.leader ? (m.enraged ? 900 : 1300) : 1000 + Math.random() * 500);
    if (m.def.fly) m.sprite.body.setVelocity(0, 0);
    else m.sprite.body.setVelocityX(0);
  }
});
