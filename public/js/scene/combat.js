'use strict';
/* WorldScene · Chiến đấu: tính sát thương, đánh thường, vùng trúng đòn, đạn, người chơi bị đánh / chết, hiệu ứng chém. */
WorldScene.mix(class WorldCombat {
  // ------------------------------------------------------------------ Chiến đấu
  calcDamage(mult, mon) {
    const st = App.stats;
    const bt = this.buffTotals();
    const bossMul = (mon.def.boss || mon.def.leader) ? 1 + (st.boss || 0) / 100 : 1;
    // Giảm giáp theo tỉ lệ: DEF / (DEF + 60 + 12 x cấp quái), tối đa 75% (xem GameData.defReduce)
    // Thần Kiếm Vĩnh Hằng: đòn đánh xuyên mọi phòng thủ của quái Hư Không (cấp 41–50)
    const pierceFx = GameData.specialFx(App.player).pierce;
    const pierce = !!pierceFx && mon.def.level >= (pierceFx.minLevel || 1) && mon.def.level <= (pierceFx.maxLevel || 999);
    let dmg = st.atk * mult * (1 + bt.atk) * bossMul * (pierce ? 1 : 1 - GameData.defReduce(mon.def.def, mon.def.level));
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
          this.damageMonster(m, p.o.mult, { slow: p.o.slow, freeze: p.o.freeze, knock: p.o.knock, dir: Math.sign(p.vx), basic: p.o.basic, shred: p.o.shred });
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
    const now = this.time.now;
    // Hiệu ứng kỹ năng: nhân sức mạnh lên quái đang chậm / dưới ngưỡng máu (buff "exec")
    if (extra.vsSlowed && ((m.slowUntil || 0) > now || (m.freezeUntil || 0) > now)) mult *= extra.vsSlowed;
    if (!extra.pet && !extra.shadow && !extra.reflect && !extra.isChain) {
      for (const k in this.buffs) {
        const b = this.buffs[k];
        if (b.exec && now < b.until && m.hp <= m.maxHp * b.exec.below) mult *= b.exec.mult;
      }
    }
    m.lastHitSource = extra.pet ? 'pet' : extra.shadow ? 'shadow' : 'player';
    let { dmg, crit } = extra.reflect ? { dmg: extra.reflect, crit: false } : extra.shadow
      ? { dmg: Math.max(1, Math.round((extra.shadowAtk || GameData.calcStats(App.player).atk * 0.13) * mult * (1 - GameData.defReduce(m.def.def, m.def.level)))), crit: false }
      : extra.pet
      ? { dmg: Math.max(1, Math.round((extra.petAtk || 100) * mult * (1 - GameData.defReduce(m.def.def, m.def.level)))), crit: false }
      : this.calcDamage(mult, m);
    if (extra.basic && m.def.resist) dmg = Math.max(1, Math.round(dmg * (1 - m.def.resist)));
    // Ấn (trang bị đặc biệt) — Ấn Sát: cứ n đòn đánh trúng thì đòn thứ n gây thêm sát thương.
    // Đếm riêng theo từng mục tiêu (m.anCount), đổi mục tiêu thì đếm lại từ đầu.
    // Bỏ qua đòn phản sát thương / dây chuyền / thú / bóng ma: chỉ đếm đòn của người chơi.
    const anFx = GameData.specialFx(App.player).everyNth;
    if (anFx && !extra.reflect && !extra.isChain && !extra.pet && !extra.shadow) {
      m.anCount = (m.anCount || 0) + 1;
      if (m.anCount >= (anFx.n || 5)) {
        m.anCount = 0;
        dmg = Math.max(1, Math.round(dmg * (anFx.mult || 1)));
        this.floatText(m.sprite.x, this.monsterTop(m) - 26, '🔱 Ấn Sát', '#ffd54f', 15);
        this.hitstop(40);
      }
    }
    if (m.shredUntil > now && !extra.reflect) dmg = Math.max(1, Math.round(dmg * (1 + (m.shred || 0))));   // Tên Phá Giáp: quái chịu thêm sát thương
    if (extra.shred) { m.shred = extra.shred; m.shredUntil = now + 6000; }
    // Bộ Băng Long 10 món — Đóng Băng: đòn đánh của người chơi có cơ hội đóng băng quái.
    // Chỉ đòn của người chơi (không tính phản sát thương / dây chuyền / thú / bóng ma) để không bị đóng băng vô hạn.
    const freezeFx = GameData.specialFx(App.player).setFreeze;
    if (freezeFx && !extra.reflect && !extra.isChain && !extra.pet && !extra.shadow && !extra.freeze && !m.def.passive
        && Math.random() < (freezeFx.chance || 0)) {
      extra.freeze = freezeFx.dur || 2;
      this.floatText(m.sprite.x, this.monsterTop(m) - 40, '❄ Đóng Băng', '#80d8ff', 14);
    }
    if (!m.net) { m.hp -= dmg; m.aggro = true; }
    if (!extra.pet && App.stats.lifesteal && !m.def.passive && !this.dead) {
      App.hp = Math.min(App.stats.maxHp, App.hp + dmg * App.stats.lifesteal / 100);
    }
    // Nội tại Kiếm Tâm: đánh thường trúng quái hồi 0,5% máu
    if (!extra.pet && extra.basic && !m.def.passive && !this.dead && this.hasPassive('kiem_si') && this.time.now > (this.healTick || 0)) {
      this.healTick = this.time.now + 120;
      App.hp = Math.min(App.stats.maxHp, App.hp + App.stats.maxHp * 0.005);
    }
    // Quái do server quản lý: gửi đòn lên server, máu và hiệu ứng trúng đòn tới theo gói `mhit` (xem onMobNet)
    if (m.net) {
      const sp = m.sprite;
      Realtime.send({
        t: 'hit', u: m.uid, d: dmg, c: crit ? 1 : 0, src: m.lastHitSource, dir: extra.dir || Math.sign(sp.x - this.player.x) || 1,
        slow: extra.slow || 0, freeze: extra.freeze || 0, stun: extra.stun || 0, knock: extra.knock || 90,
        // k: loại đòn để server chọn trần sát thương — 0 đánh thường, 1 kỹ năng, 2 tuyệt kỹ, 3 siêu tuyệt kỹ.
        // Server không tin cờ này (client sửa được): nó chỉ dùng để chọn trần, còn chặn thật là ngân sách
        // sát thương mỗi giây (xem server/realtime/index.js onHit).
        k: extra.superUlt ? 3 : extra.ult ? 2 : extra.sk ? 1 : 0,
        // id kỹ năng: server đối chiếu với lần `cast` hợp lệ gần nhất (chống spam tầng 2).
        id: extra.id || undefined,
      });
      this.damageChain(m, extra);
      return;
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
    // Choáng: quái đứng yên, không gồng đòn (xem monsters.js). Trùm chỉ bị làm chậm thay vì choáng hẳn.
    if (extra.stun) {
      if (m.def.boss || m.def.leader || m.def.finalBoss) m.slowUntil = Math.max(m.slowUntil || 0, this.time.now + extra.stun * 1000);
      else m.stunUntil = Math.max(m.stunUntil || 0, this.time.now + extra.stun * 1000);
    }
    // Hồn Nổ Dây Chuyền: mỗi quái trúng gây thêm vụ nổ nhỏ lên quái bên cạnh (tối đa chainBudget.n lần mỗi lần dùng)
    this.damageChain(m, extra);
    if (extra.freeze) {
      // Thủ lĩnh / trùm không bị đóng băng: đổi thành làm chậm cùng thời gian
      if (m.def.boss || m.def.leader || m.def.finalBoss) m.slowUntil = Math.max(m.slowUntil || 0, this.time.now + extra.freeze * 1000);
      else m.freezeUntil = this.time.now + extra.freeze * 1000;
    }
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

  // Hồn Nổ Dây Chuyền: mỗi quái trúng gây thêm vụ nổ nhỏ lên quái bên cạnh (tối đa chainBudget.n lần mỗi lần dùng)
  damageChain(m, extra) {
    if (!extra.chain || extra.isChain) return;
    const s = m.sprite;
    const budget = extra.chainBudget || (extra.chainBudget = { n: 6 });
    for (const o of this.monsters) {
      if (budget.n <= 0) break;
      if (o === m || !o.alive || o.def.passive) continue;
      if (Math.hypot(o.sprite.x - s.x, o.sprite.y - s.y) <= (extra.chainRadius || 150)) { budget.n--; this.damageMonster(o, extra.chain, { isChain: true }); }
    }
  }

  hurtPlayer(atk, dir, push = 260, mon = null) {
    const now = this.time.now;
    if (now < this.invulnUntil || this.dashing) return;
    const fxNow = GameData.specialFx(App.player);
    // Cánh (trang bị đặc biệt) — Phiêu Diêu: né hoàn toàn một đòn, không mất máu, không mất khiên
    const dodgeFx = fxNow.dodge;
    if (dodgeFx && Math.random() < dodgeFx.chance) {
      this.floatText(this.player.x, this.player.y - 34, 'Né', '#8ef0ff', 17);
      Sound.play('dodge');
      this.invulnUntil = now + 300;
      return;
    }
    // Bộ Vĩnh Hằng 10 món — Xuyên Không: lướt qua đòn đánh mỗi `cd` giây
    const phaseFx = fxNow.setPhase;
    if (phaseFx && now >= (this.phaseCd || 0)) {
      this.phaseCd = now + (phaseFx.cd || 8) * 1000;
      this.floatText(this.player.x, this.player.y - 34, 'Xuyên Không', '#b388ff', 16);
      Sound.play('dodge');
      this.ringFx(this.player.x, this.player.y, 0xb388ff, 1.8);
      this.invulnUntil = now + 300;
      return;
    }
    // Bộ Thạch Vương 10 món — Khiên Đá: đỡ trọn một đòn mỗi `cd` giây
    const stoneFx = fxNow.setStone;
    if (stoneFx && now >= (this.stoneCd || 0)) {
      this.stoneCd = now + (stoneFx.cd || 12) * 1000;
      this.floatText(this.player.x, this.player.y - 46, '🛡 Khiên Đá', '#a1887f', 15);
      Sound.play('ward');
      this.ringFx(this.player.x, this.player.y, 0xa1887f, 2.0);
      this.invulnUntil = now + 400;
      return;
    }
    let dmg = Math.max(1, Math.round(atk * Phaser.Math.FloatBetween(0.9, 1.1) * (1 - GameData.defReduce(App.stats.def, App.player.level))));
    // Nội tại Tanker "Thành Đồng": máu dưới 50% giảm thêm 10% sát thương
    if (App.hp < App.stats.maxHp * 0.5 && this.hasPassive('tanker')) dmg = Math.max(1, Math.round(dmg * 0.9));
    // Thủ thế: giảm sát thương CỘNG DỒN từ mọi kỹ năng đang bật.
    // Cộng quá 100% thì đòn vẫn gây tối thiểu 1 sát thương (Math.max ở dưới), không âm máu.
    const reduce = this.buffReduce(now);
    if (reduce > 0) {
      dmg = Math.max(1, Math.round(dmg * (1 - reduce)));
      // Phản sát thương cũng cộng dồn từ mọi thủ thế đang bật
      const refl = this.buffReflect(now);
      if (refl && mon && mon.alive) this.damageMonster(mon, 0, { reflect: Math.round(atk * refl) });
    }
    // Khiên năng lượng: hấp thụ CỘNG DỒN từ mọi khiên đang bật
    const absorb = this.buffAbsorb(now);
    if (absorb > 0 && App.mp > 0) {
      const take = Math.min(App.mp, Math.round(dmg * absorb));
      App.mp -= take; dmg -= take;
      if (take) this.floatText(this.player.x, this.player.y - 46, '🔷' + take, '#8fb4ff', 13);
      if (dmg <= 0) { this.invulnUntil = now + 500; return; }
    }
    // Bùa Hộ Mệnh: đang trong 5 giây Hộ Mệnh thì mọi đòn đều không trừ máu, máu giữ nguyên 1
    if (this.lastStandUntil && now < this.lastStandUntil) {
      this.floatText(this.player.x, this.player.y - 46, '🪬', '#ffe082', 13);
      this.invulnUntil = now + 400;
      return;
    }
    App.hp -= dmg;
    const companions = this.summonedPetIds();
    if (companions.length) {
      const share = dmg * 0.18 / companions.length;
      for (const id of companions) {
        const petDef = GameData.companionStats(App.player, id);
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
    // Bùa Hộ Mệnh (trang bị đặc biệt) — Hộ Mệnh: máu cạn thì không chết, giữ 1 máu trong 5 giây.
    // Đặt SAU khi trừ máu để bắt đúng đòn gây chết, và TRƯỚC khi kiểm tra chết.
    this.lastStandCheck(now);
    if (App.hp <= 0) this.die();
  }

  // Hộ Mệnh: máu tụt xuống 0 thì cưỡng chế còn đúng 1 máu, giữ trong `dur` giây. Hồi lại sau `cd` giây.
  // Trong thời gian đó mọi đòn đánh đều không trừ máu (xem hurtPlayer). Hết hạn mà máu vẫn ≤ 0 thì gục.
  lastStandCheck(now) {
    const fx = GameData.specialFx(App.player).undying;
    if (!fx) return;
    if (App.hp > 0) return;
    if (now < (this.lastStandCd || 0)) return;
    this.lastStandCd = now + (fx.cd || 60) * 1000;
    this.lastStandUntil = now + (fx.dur || 5) * 1000;
    App.hp = 1;
    Sound.play('ward');
    this.floatText(this.player.x, this.player.y - 52, '🪬 Hộ Mệnh 5s', '#ffe082', 16);
    this.ringFx(this.player.x, this.player.y, 0xffe082, 2.4);
  }

  // Hết 5 giây bất tử: máu vẫn ≤ 0 (chưa kịp hồi) thì mới thật sự gục
  lastStandExpire(now) {
    if (!this.lastStandUntil || now < this.lastStandUntil) return;
    this.lastStandUntil = 0;
    if (App.hp <= 0 && !this.dead) this.die();
  }

  // Tử Linh Dung Hợp hết hạn: chỉ số cộng thêm tự mất hiệu lực theo mốc `until` trong calcStats,
  // nhưng App.stats chỉ tính lại khi có sự kiện. Nên tính lại một lần rồi báo server dọn `p.fusion`.
  fusionExpire() {
    const fu = App.player && App.player.fusion;
    if (!fu || !fu.until || fu.until > Date.now()) return;
    App.player.fusion = null;
    App.recalcStats();
    UI.log('Dung hợp tan: bóng ma đã tiêu biến, chỉ số trở lại bình thường.', '#9b8bbf');
    try { Realtime.send({ t: 'fusion_end' }); } catch (e) { /* mất kết nối thì server tự dọn khi hết hạn */ }
  }

  async die() {
    if (this.dead) return;
    this.dead = true;
    App.hp = 0;
    // Hồi sinh: reset cờ hiệu ứng bộ để trận mới được dùng lại Cổ Ngữ
    this.freeCastUsed = false;
    // Lỗi ở hiệu ứng/ mạng không được làm kẹt nhân vật ở trạng thái "đã chết": luôn hồi sinh về làng ở cuối
    try {
      this.endForm();
      if (this.sheetId) { this.attackUntil = 0; this.player.setAngle(0); this.player.play(this.charAnim('death')); }
      else this.player.setTint(0x555555).setAngle(this.facing * -90);
      this.player.body.setVelocity(0, 0);
    } catch (e) { /* bỏ qua hiệu ứng chết */ }
    UI.banner('Bạn đã bị đánh bại', 1800);
    await new Promise(r => setTimeout(r, 1800));
    try {
      const res = await Net.action('die');
      if (res && res.player) { App.hp = res.player.hp; App.mp = res.player.mp; }
    } catch (e) { /* mất mạng: vẫn về làng, server sẽ đồng bộ lại khi lưu */ }
    if (!(App.hp > 0)) App.hp = Math.max(1, Math.round(App.stats.maxHp * 0.5));
    App.sta = App.stats.maxSta; App.staLocked = false;
    const restart = () => { if (this.sys && this.sys.isActive()) this.scene.restart({ map: (App.player && App.player.map) || GameData.START_MAP, arrive: 'S' }); };
    try { this.cameras.main.fadeOut(300); } catch (e) { /* bỏ qua */ }
    setTimeout(restart, 340);   // dùng setTimeout thay đồng hồ cảnh: không phụ thuộc hitstop / làm chậm thời gian
  }

  // Vệt chém. o: { angle (radian), tint, life, sy, flipY, alpha }
  // Kỹ năng nhiều nhát cần mỗi nhát một vệt KHÁC NHAU (góc, cỡ, màu) thì người chơi mới đếm ra số nhát.
  slashFx(x, y, sx = 1, sy = 1, flipY = false, o = {}) {
    const fx = this.add.image(x, y, 'slash').setDepth(7).setFlipX(this.facing < 0).setFlipY(flipY)
      .setScale(sx, sy).setTint(o.tint == null ? this.accent() : o.tint);
    if (o.angle) fx.setAngle(this.facing * o.angle * 57.2958);
    // Hình vẽ sẵn đã có động tác vung vũ khí, vệt chém chỉ để làm sáng thêm
    if (this.sheetId) { fx.setAlpha(o.alpha || 0.45).setBlendMode(Phaser.BlendModes.ADD).setScale(sx * 0.9, sy * 0.7); }
    else if (o.alpha) fx.setAlpha(o.alpha);
    this.tweens.add({ targets: fx, alpha: 0, scaleX: fx.scaleX * 1.2, duration: o.life || 200, onComplete: () => fx.destroy() });
    return fx;
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

