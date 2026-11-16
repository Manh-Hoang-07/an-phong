'use strict';
/* WorldScene · Kỹ năng: buff, nội tại, dùng kỹ năng. */

WorldScene.mix(class WorldSkills {
  // ------------------------------------------------------------------ Kỹ năng
  // Bảng hiệu ứng đang bật, KHOÁ THEO ID KỸ NĂNG — không phải theo tên hiệu ứng.
  // Trước đây khoá theo tên ('rage', 'guard', 'awaken'…) nên hai kỹ năng khác nhau dùng chung một tên
  // ghi đè lên nhau: dùng A (10 giây) rồi bấm B là A mất ngay. Giờ mỗi kỹ năng một ô riêng, cùng chạy.
  buffList(time = this.time.now) {
    const out = [];
    for (const k in this.buffs) {
      const b = this.buffs[k];
      if (b && time < b.until) out.push(b);
    }
    return out;
  }
  // Một hiệu ứng đang bật mang tên này (dùng cho kiểm tra "có đang bật không" và vẽ vòng sáng)
  buffOn(name, time = this.time.now) {
    for (const b of this.buffList(time)) if (b.name === name) return b;
    return null;
  }
  // Tổng tấn công / chí mạng / tốc đánh của MỌI hiệu ứng đang bật: cộng dồn
  buffTotals(time = this.time.now) {
    const t = { atk: 0, crit: 0, speed: 0 };
    for (const b of this.buffList(time)) {
      t.atk += b.atk || 0; t.crit += b.crit || 0; t.speed += b.speed || 0;
    }
    return t;
  }
  // Giảm sát thương: CỘNG DỒN mọi thủ thế đang bật, không chặn trần.
  // (Tanker học tk4 + tk7 + tk10 = 60% + 60% + 55%; cộng lại vượt 100% thì đòn đánh chỉ còn 1 sát thương.)
  buffReduce(time = this.time.now) {
    let r = 0;
    for (const b of this.buffList(time)) if (b.name === 'guard') r += b.reduce || 0;
    return r;
  }
  // Hấp thụ năng lượng: CỘNG DỒN mọi khiên đang bật, không chặn trần
  buffAbsorb(time = this.time.now) {
    let a = 0;
    for (const b of this.buffList(time)) if (b.name === 'manashield') a += b.absorb || 0;
    return a;
  }
  // Phản sát thương: CỘNG DỒN mọi thủ thế đang bật, không chặn trần
  buffReflect(time = this.time.now) {
    let r = 0;
    for (const b of this.buffList(time)) if (b.name === 'guard') r += b.reflect || 0;
    return r;
  }
  hasPassive(id) { return GameData.passivesOf(App.player).includes(id); }
  // Hồi máu từ kỹ năng: theo % máu tối đa của kỹ năng (không nhân sức mạnh kỹ năng / SPI); nội tại "Sinh Lực" của Trị Liệu Sư: +20% lượng hồi
  skillHeal(ratio) {
    const boost = this.hasPassive('tri_lieu_su') ? 1.2 : 1;
    const amount = Math.round(App.stats.maxHp * ratio * boost);
    App.hp = Math.min(App.stats.maxHp, App.hp + amount);
    this.floatText(this.player.x, this.player.y - 30, '+' + amount, '#69f0ae', 16);
  }

  useSkill(slot, time) {
    const p = App.player;
    // Ô thứ 9 (GEAR_SKILL_SLOT): kỹ năng do TRANG BỊ cấp, không nằm trong p.skillSlots.
    // Mặc đồ thì có, tháo đồ thì mất — xem gearSkill trong shared/logic/skills.js.
    const gear = slot === GameData.GEAR_SKILL_SLOT ? GameData.gearSkill(p) : null;
    const id = gear ? gear.id : p.skillSlots[slot];
    if (!id) {
      UI.log(p.school ? 'Ô kỹ năng trống. Mở bảng Kỹ năng (phím K) để học và gắn kỹ năng.' : 'Chưa có kỹ năng. Đạt cấp 5 và thức tỉnh class ở Hội trưởng Khải.', '#bdbdbd');
      return;
    }
    const lv = gear ? gear.level : GameData.skillLevel(p, id);
    if (!lv) return;
    const sk = GameData.skillAt(id, lv);
    if (time < (this.cooldowns[id] || 0)) return;
    const cost = Math.round(sk.mp * App.stats.costMul);
    // Bộ Lưu Trữ 10 món — Cổ Ngữ: kỹ năng ĐẦU TIÊN mỗi trận không tốn năng lượng.
    // Cờ reset ở resetCombatFlags() khi vào bản đồ mới hoặc hồi sinh.
    const freeCast = GameData.specialFx(p).setFreeCast && !this.freeCastUsed;
    if (!freeCast && App.mp < cost) { UI.log('Không đủ năng lượng!', '#64b5f6'); return; }
    const sta = this.skillStaminaCost(sk);
    if (!this.canSpendStamina(sta)) return;
    if (freeCast) {
      this.freeCastUsed = true;
      this.floatText(this.player.x, this.player.y - 60, '📖 Cổ Ngữ', '#4fc3f7', 14);
    } else {
      App.mp -= cost;
    }
    this.spendStamina(sta);
    const cdMs = sk.cd * 1000 * (1 - (App.stats.cdr || 0) / 100);
    this.cooldowns[id] = time + cdMs;
    this.cooldownLen[id] = cdMs;
    const pw = sk.power ? sk.power * App.stats.skillMul : 0;
    const pl = this.player, f = this.facing;
    // Nhịp giữa các nhát: đủ thưa để người chơi ĐẾM được số nhát, đủ nhanh để không thành đòn chậm chạp
    const HIT_GAP = 130;
    // Gom mọi trường hiệu ứng đã khai báo thành object cho damageMonster.
    // Đây là chỗ duy nhất quyết định "khai báo có thành hiệu ứng hay không": thiếu một dòng ở đây
    // là mô tả kỹ năng nói dối người chơi.
    const fx = (over = {}) => {
      const o = {};
      if (sk.knock) o.knock = sk.knock;
      if (sk.stun) o.stun = sk.stun;
      if (sk.slow) o.slow = sk.slow;
      if (sk.freeze) o.freeze = sk.freeze;
      if (sk.shred) o.shred = sk.shred;
      if (sk.vsSlowed) o.vsSlowed = sk.vsSlowed;
      return Object.assign(o, over);
    };
    if (sk.ult && (p.school === 'tu_linh_thuat_su' || p.school === 'trieu_hoi_su' && p.advancement?.unlocked?.tu_linh_thuat_su)) this.shadowPowerUntil = time + 8000;
    this.floatText(pl.x, pl.y - 52, sk.name, sk.ult ? '#ffd54f' : '#fff59d', sk.ult ? 17 : 14);
    this.attackAnim(time, sk.type === 'melee' ? (sk.hits || 3) * HIT_GAP : 420, 'skill');
    if (sk.ult) { this.cameras.main.flash(180, 255, 230, 160); }
    Sound.play(sk.ult ? 'ult' : sk.type === 'heal' ? 'heal' : 'skill');

    switch (sk.type) {
      case 'summon':
        Net.action('summon_toggle').then(() => { if (this.sys.isActive()) this.buildSummons(); });
        this.floatText(pl.x, pl.y - 52, App.player.summons?.enabled ? 'Thu hồi' : 'Triệu hồi', '#8be9ff', 14);
        break;
      case 'shadow_toggle':
        Net.action('shadow_toggle').then(() => { if (this.sys.isActive()) this.buildShadows(); });
        this.floatText(pl.x, pl.y - 52, App.player.shadows?.enabled ? 'Giải trừ' : 'Triệu hồi', '#c6a7ff', 14);
        break;
      case 'shadow_command': {
        const target = this.monsters.filter(m => m.alive && m.sprite?.body?.enable && !m.def.passive && Math.abs(m.sprite.x - pl.x) < 500 && Math.abs(m.sprite.y - pl.y) < 200)
          .sort((a, b) => Math.abs(a.sprite.x - pl.x) - Math.abs(b.sprite.x - pl.x))[0];
        if (target) {
          this.shadowFocusTarget = target;
          this.shadowFocusUntil = time + 6000;
          this.hitCircle(target.sprite.x, target.sprite.y, sk.radius, pw, fx({ freeze: sk.freeze, sk: 1 }));
        } else this.hitCircle(pl.x + f * 100, pl.y, sk.radius, pw, fx({ freeze: sk.freeze, sk: 1 }));
        break;
      }
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
          // Vệt lướt: một đường sáng dọc cả quãng đã đi, để thấy rõ đòn đánh xuyên qua bao xa
          const trail = this.add.rectangle((a + b) / 2, pl.y, Math.max(40, b - a + 50), 5, this.accent(), 0.75)
            .setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
          this.tweens.add({ targets: trail, scaleY: 3, alpha: 0, duration: 280, onComplete: () => trail.destroy() });
          this.hitBox((a + b) / 2, pl.y, b - a + 50, 64, pw, fx({ sk: 1 }));
          this.slashFx(pl.x, pl.y, 1.6, 1.2);
          if (sk.after) {
            this.time.delayedCall(180, () => {
              const g = this.add.rectangle((a + b) / 2, pl.y, b - a + 40, 6, this.accent(), 0.9).setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
              this.tweens.add({ targets: g, scaleY: 4, alpha: 0, duration: 260, onComplete: () => g.destroy() });
              this.hitBox((a + b) / 2, pl.y, b - a + 50, 64, sk.after * App.stats.skillMul, fx({ sk: 1 }));
            });
          }
        });
        this.invulnUntil = Math.max(this.invulnUntil, time + 400);
        this.shadowCrit = true;
        break;
      }
      case 'melee': {
        // Mỗi nhát một vệt chém RIÊNG: lệch góc, lệch độ cao, lệch cỡ. Trước đây mọi nhát gần như
        // trùng nhau nên 4–5 nhát chồng thành một vệt và người chơi không đếm được.
        const n = sk.hits || 1;
        for (let h = 0; h < n; h++) {
          const isLast = h === n - 1;                 // nhát cuối = nhát cuối cùng, kể cả khi không có finisher
          const fin = isLast && !!sk.finisher;        // chỉ nhát cuối mới được hưởng sức mạnh finisher
          this.time.delayedCall(h * HIT_GAP, () => {
            this.swing();
            const up = h % 2 === 0;
            const ang = (up ? -1 : 1) * (0.34 + 0.1 * (h % 3));
            const sx = fin ? 1.9 : 1.25 + 0.08 * (h % 3);
            const sy = fin ? 1.55 : 1;
            this.slashFx(pl.x + this.facing * (30 + 6 * (h % 2)), pl.y + (up ? -10 : 10), sx, sy, !up,
              { angle: ang, life: fin ? 260 : 190, alpha: fin ? 0.85 : 0.6, tint: fin ? 0xffffff : undefined });
            // Chấm sáng ở điểm chạm: đếm được từng nhát kể cả khi vệt chém đã mờ
            this.ringFx(pl.x + this.facing * (sk.range / 2), pl.y, fin ? 0xffffff : this.accent(), fin ? 2.2 : 1.1);
            // Hất văng / choáng dồn vào NHÁT CUỐI (mô tả luôn nói "nhát cuối ... hất văng"),
            // làm chậm / đóng băng / xuyên giáp thì mọi nhát đều ăn.
            const hitFx = fx(isLast ? { sk: 1 } : { knock: 0, stun: 0, sk: 1 });
            this.hitBox(pl.x + this.facing * sk.range / 2, pl.y, sk.range, 70,
              fin ? sk.finisher * App.stats.skillMul : pw, hitFx);
            if (fin) { this.cameras.main.shake(120, 0.006); this.hitstop(40); }
          });
        }
        break;
      }
      case 'guard': {
        // Mỗi kỹ năng thủ thế một ô riêng: dùng cái thứ hai KHÔNG xoá cái thứ nhất,
        // giảm sát thương và phản đòn cộng dồn (xem buffReduce / buffReflect).
        // Kỹ năng thủ có thể kèm buff tấn công / chí mạng / tốc đánh (cộng dồn qua buffTotals)
        this.buffs[id] = { name: 'guard', until: time + sk.duration * 1000, dur: sk.duration * 1000, skill: id, reduce: sk.reduce, reflect: sk.reflect || 0,
          atk: sk.atkBuff || 0, crit: sk.critBuff || 0, speed: sk.speedBuff || 0 };
        this.ringFx(pl.x, pl.y, 0xffb36b);
        break;
      }
      case 'manashield': {
        // Khiên cũng vậy: mỗi kỹ năng một ô, hấp thụ cộng dồn
        this.buffs[id] = { name: 'manashield', until: time + sk.duration * 1000, dur: sk.duration * 1000, skill: id, absorb: sk.absorb };
        this.ringFx(pl.x, pl.y, 0x8fb4ff);
        break;
      }
      case 'buff': {
        // Mỗi kỹ năng một ô riêng (khoá theo id), nên hai kỹ năng tăng cường khác nhau CÙNG CHẠY và cộng dồn.
        // Bấm lại chính kỹ năng đó thì làm mới thời gian, không tạo ô thứ hai.
        // Buff tấn công theo % của kỹ năng, không nhân sức mạnh kỹ năng / SPI
        this.buffs[id] = { name: sk.buff || id, until: time + sk.duration * 1000, dur: sk.duration * 1000, skill: id,
          atk: sk.atkBuff || 0, crit: sk.critBuff || 0, speed: sk.speedBuff || 0, regen: sk.regen || 0, exec: sk.exec || null };
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
            pierce: sk.pierce, slow: sk.slow, freeze: sk.freeze, shred: sk.shred, stun: sk.stun,
            knock: sk.knock || (water ? 140 : 60), sk: 1, dy: (k - (n - 1) / 2) * 16 });
        }
        break;
      }
      case 'spread': {
        this.swing();
        for (let k = 0; k < sk.count; k++) {
          const ang = (k - (sk.count - 1) / 2) * 0.16;
          this.shoot({ key: 'proj_fire', speed: 760, range: sk.range, mult: pw, angle: ang, sk: 1,
            slow: sk.slow, freeze: sk.freeze, shred: sk.shred, stun: sk.stun, knock: sk.knock, pierce: sk.pierce });
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
            this.shoot({ key: 'proj_fire', speed: 780, range: 420, mult: pw, angle: ang, sk: 1,
              slow: sk.slow, freeze: sk.freeze, stun: sk.stun, knock: sk.knock });
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
        this.hitCircle(pl.x, pl.y, sk.radius, pw, fx({ ...(sk.chain ? { chain: pw * sk.chain, chainRadius: 150, chainBudget: { n: 6 } } : {}), sk: 1 }));
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
            this.hitCircle(x, gy - 30, sk.radius, pw, fx({ knock: sk.knock || 300, sk: 1 }));
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
              this.hitBox(x, gy - 30, 46, 90, pw, fx({ sk: 1 }));
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
              this.hitCircle(x, gy - 30, sk.radius, pw, fx({ knock: sk.knock || 260, sk: 1,
                ...(sk.chain ? { chain: pw * sk.chain, chainRadius: 170, chainBudget: { n: 6 } } : {}) }));
            } });
          });
        }
        break;
      }
    }
  }
});
