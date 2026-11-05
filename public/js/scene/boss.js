'use strict';
/* WorldScene · Đòn riêng của từng trùm. */
WorldScene.mix(class WorldBoss {
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

  // ------------------------------------------------------------------ Đòn riêng của từng trùm
  // Đạn của trùm: bay thẳng tới người chơi, không bị chặn bởi địa hình (để né bằng cách di chuyển/nhảy)
  bossShoot(m, o) {
    const s = m.sprite, pl = this.player;
    const ang = o.angle != null ? o.angle
      : Math.atan2(pl.body.center.y - s.body.center.y, pl.x - s.x);
    const img = this.add.image(s.x, s.body.center.y, o.key || 'proj_orb').setDepth(7)
      .setTint(o.tint || 0xff7043).setBlendMode(Phaser.BlendModes.ADD);
    this.enemyShots.push({
      img, vx: Math.cos(ang) * o.speed, vy: Math.sin(ang) * o.speed,
      life: o.life || 3, dmg: o.dmg || Math.round(m.def.atk * 0.6),
    });
  }

  bossVolley(m, o) {
    const n = o.count || 3, spread = o.spread || 0.18;
    const base = Math.atan2(this.player.body.center.y - m.sprite.body.center.y, this.player.x - m.sprite.x);
    for (let i = 0; i < n; i++) {
      this.bossShoot(m, { ...o, angle: base + (i - (n - 1) / 2) * spread });
    }
  }

  updateEnemyShots(delta) {
    const dt = delta / 1000;
    for (const p of this.enemyShots.slice()) {
      p.img.x += p.vx * dt; p.img.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0 || p.img.x < -60 || p.img.x > this.worldW + 60 || p.img.y < -100 || p.img.y > this.worldH + 100) {
        p.img.destroy(); this.enemyShots.splice(this.enemyShots.indexOf(p), 1); continue;
      }
      if (this.dead) continue;
      if (Phaser.Geom.Intersects.RectangleToRectangle(p.img.getBounds(), this.pBounds())) {
        this.hurtPlayer(p.dmg, Math.sign(p.vx) || 1, 180);
        p.img.destroy(); this.enemyShots.splice(this.enemyShots.indexOf(p), 1);
      }
    }
  }

  bossSpecial(m, time) {
    switch (m.def.style) {
      case 'blade': this.bossBlades(m); break;
      case 'shadow': this.bossBlades(m, true); break;
      case 'water': this.bossWater(m); break;
      case 'ice': this.bossIce(m); break;
      case 'copy': this.bossCopy(m); break;
      case 'moon': this.bossMoon(m, time); break;
      case 'void': this.bossVoid(m); break;
      default: this.bossSlam(m); break;
    }
  }

  // Lam Sương / Lam Sương lần 2: chùm đao bóng tối
  bossBlades(m, stronger = false) {
    Sound.play('warn');
    this.bossVolley(m, {
      count: stronger ? 7 : 5, spread: 0.16, key: 'proj_orb',
      tint: stronger ? 0x9b5cff : 0x8fe0ff, speed: 430,
      dmg: Math.round(m.def.atk * (stronger ? 0.75 : 0.6)),
    });
    if (stronger) this.time.delayedCall(260, () => this.bossVolley(m, { count: 5, spread: 0.2, key: 'proj_orb', tint: 0x9b5cff, speed: 360, dmg: Math.round(m.def.atk * 0.5) }));
  }

  // Thủy Xà Vương: nước dâng quét toàn sàn, phải nhảy lên bục
  bossWater(m) {
    const s = m.sprite, pl = this.player;
    Sound.play('warn');
    UI.banner('Nước dâng! Nhảy lên bục!', 1200);
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x2f7dff, 0.16).fillRect(0, s.y - 44, this.worldW, 44);
    g.lineStyle(3, 0x8fe0ff, 0.8).strokeRect(0, s.y - 44, this.worldW, 44);
    this.time.delayedCall(950, () => {
      g.destroy();
      if (!m.alive || this.dead) return;
      this.cameras.main.flash(120, 60, 120, 255);
      if (Math.abs(pl.body.bottom - s.y) < 34) {
        this.playerSlowUntil = this.time.now + 2600;
        this.hurtPlayer(Math.round(m.def.atk * 0.8), Math.sign(pl.x - s.x) || 1, 320, m);
        this.floatText(pl.x, pl.y - 40, 'Chậm!', '#8fe0ff', 14);
      }
    });
  }

  // Băng Long: ba vùng băng đóng băng sàn đấu
  bossIce(m) {
    const s = m.sprite, pl = this.player;
    Sound.play('warn');
    const spots = [pl.x, pl.x - 150, pl.x + 150];
    for (const x of spots) this.telegraph(Math.max(40, Math.min(this.worldW - 40, x)), s.y, 95, 0x80deea, 850);
    this.time.delayedCall(850, () => {
      if (!m.alive || this.dead) return;
      this.cameras.main.flash(120, 140, 220, 255);
      for (const x of spots) {
        if (Math.abs(pl.x - x) < 95 && Math.abs(pl.body.bottom - s.y) < 46) {
          this.playerSlowUntil = this.time.now + 3000;
          this.hurtPlayer(Math.round(m.def.atk * 0.7), Math.sign(pl.x - s.x) || 1, 200, m);
        }
      }
      this.ringFx(s.x, s.y - 20, 0x80deea, 4);
    });
  }

  // Người Gác Lưu Trữ: sao chép đòn đánh thường của người chơi
  bossCopy(m) {
    const wt = App.stats.wtype;
    Sound.play('warn');
    UI.banner('Người Gác sao chép chiêu thức!', 1100);
    const key = wt === 'cung' ? 'proj_arrow' : wt === 'truong' ? 'proj_orb' : 'proj_fire';
    this.bossVolley(m, { count: 3, spread: 0.22, key, tint: 0x9ad7ff, speed: wt === 'cung' ? 640 : 460, dmg: Math.round(m.def.atk * 0.6) });
  }

  // Kẻ Đeo Mặt Nạ Trăng (Thiên): 3 giai đoạn — tráo vũ khí, không trọng lực, bùng nổ Lõi Đỏ
  bossMoon(m, time) {
    const s = m.sprite, pl = this.player;
    const ratio = m.hp / m.maxHp;
    if (m.moonStage == null) m.moonStage = 1;
    if (m.moonStage === 1 && ratio <= 0.66) {
      m.moonStage = 2;
      UI.banner('Thiên: Tráo đổi vũ khí!', 1600);
      Sound.play('roar');
      m.sprite.setTint(0xc9a0ff);
      m.baseTint = 0xc9a0ff;
    }
    if (m.moonStage === 2 && ratio <= 0.33) {
      m.moonStage = 3;
      UI.banner('Thiên: Không trọng lực!', 1600);
      Sound.play('roar');
      m.sprite.setTint(0xff9a9a);
      m.baseTint = 0xff9a9a;
      pl.body.setGravityY(-GRAVITY * 0.8);
      this.tweens.add({ targets: pl, angle: 360, duration: 900, onComplete: () => pl.setAngle(0) });
      this.time.delayedCall(4200, () => { if (this.sys.isActive() && pl.body) pl.body.setGravityY(0); });
    }
    if (m.moonStage === 1) {
      this.bossVolley(m, { count: 3, spread: 0.2, key: 'proj_fire', tint: 0xffb36b, speed: 560, dmg: Math.round(m.def.atk * 0.55) });
    } else if (m.moonStage === 2) {
      this.bossVolley(m, { count: 5, spread: 0.15, key: 'proj_orb', tint: 0xb388ff, speed: 430, dmg: Math.round(m.def.atk * 0.55) });
      this.time.delayedCall(700, () => { if (m.alive) this.bossVolley(m, { count: 5, spread: 0.15, key: 'proj_orb', tint: 0xb388ff, speed: 430, dmg: Math.round(m.def.atk * 0.55) }); });
    } else {
      // Bùng nổ Lõi Đỏ: vùng nổ dưới chân người chơi
      this.telegraph(pl.x, pl.body.bottom, 175, 0xff3d00, 900);
      this.time.delayedCall(900, () => {
        if (!m.alive || this.dead) return;
        this.ringFx(pl.x, pl.body.bottom - 20, 0xff3d00, 4);
        this.cameras.main.shake(260, 0.016);
        if (Math.abs(this.player.x - pl.x) < 175 && Math.abs(this.player.body.bottom - pl.body.bottom) < 60) {
          this.hurtPlayer(Math.round(m.def.atk * 1.3), Math.sign(this.player.x - s.x) || 1, 380, m);
        }
      });
    }
  }

  // Thực Thể Bên Kia Cổng: tia hư không quét toàn sàn, phải nhảy qua
  bossVoid(m) {
    const s = m.sprite, pl = this.player;
    Sound.play('warn');
    UI.banner('Tia hư không quét sàn! Nhảy lên!', 1300);
    const g = this.add.graphics().setDepth(8);
    g.fillStyle(0xff4dff, 0.22).fillRect(0, s.y - 26, this.worldW, 26);
    g.lineStyle(4, 0xff8aff, 0.95).lineBetween(0, s.y - 26, this.worldW, s.y - 26);
    this.time.delayedCall(900, () => {
      g.destroy();
      if (!m.alive || this.dead) return;
      this.cameras.main.flash(160, 255, 80, 255);
      this.cameras.main.shake(240, 0.012);
      if (Math.abs(pl.body.bottom - s.y) < 34) {
        this.hurtPlayer(Math.round(m.def.atk * 1.1), Math.sign(pl.x - s.x) || 1, 320, m);
      }
      this.bossVolley(m, { count: 4, spread: 0.16, key: 'proj_orb', tint: 0xff4dff, speed: 470, dmg: Math.round(m.def.atk * 0.5) });
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
});
