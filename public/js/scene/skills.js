'use strict';
/* WorldScene · Kỹ năng: buff, nội tại, dùng kỹ năng. */
WorldScene.mix(class WorldSkills {
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
  // Hồi máu từ kỹ năng (Trị Liệu Sư có nội tại "Sinh Lực": +20% máu tối đa)
  skillHeal(ratio) {
    const extra = this.hasPassive('tri_lieu_su') ? 0.2 : 0;
    const amount = Math.round(App.stats.maxHp * (ratio * App.stats.skillMul + extra));
    App.hp = Math.min(App.stats.maxHp, App.hp + amount);
    this.floatText(this.player.x, this.player.y - 30, '+' + amount, '#69f0ae', 16);
  }

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
    const sta = this.skillStaminaCost(sk);
    if (!this.canSpendStamina(sta)) return;
    App.mp -= cost;
    this.spendStamina(sta);
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
        this.shadowCrit = true;
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
        this.buffs[sk.buff] = { until: time + sk.duration * 1000, atk: (sk.atkBuff || 0) * App.stats.skillMul, crit: sk.critBuff || 0, speed: sk.speedBuff || 0, regen: sk.regen || 0 };
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
        if (sk.heal) this.skillHeal(sk.heal);
        break;
      }
      case 'heal': {
        this.skillHeal(sk.heal);
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
});
