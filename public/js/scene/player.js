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
      // Tới bằng cổng: đứng lệch khỏi cổng 50px về phía giữa bản đồ (cổng nằm ở đầu hoặc cuối bản đồ)
      if (this.arrive && this.meta.portals && this.meta.portals[this.arrive]) x += x < this.worldW / 2 ? 50 : -50;
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

  // Tên hoạt ảnh nhân vật: đang biến hình (formTier) thì dùng bộ hình biến hình chf<ấn>_..., không thì ch_...
  charAnim(a) { return `${this.formTier ? 'chf' + this.formTier : 'ch'}_${this.sheetId}_${a}`; }
  // Biến hình thì nhân vật to hơn: ấn 1 ×1.15, ấn 2 ×1.25
  formGrow() { return this.formTier ? (this.formTier >= 2 ? 1.25 : 1.15) : 1; }
  // Đổi sang / trở về bộ hình biến hình và vừa lại kích thước
  applyFormLook() {
    const aw = App.form ? GameData.awakenOf(App.player) : null;
    this.formTier = aw && this.sheetId && Sprites.makeFormSheets(this, this.sheetId, aw.tier) ? aw.tier : 0;
    if (!this.sheetId || !this.player) return;
    this.fitFacing = this.facing || 1;
    Sprites.fitPlayer(this.player, this.sheetId, this.fitFacing < 0, this.formGrow(), 0);
    this.player.setFlipX(this.fitFacing < 0);
    this.attackUntil = 0;
    this.player.play(this.charAnim('idle'));
  }

  // Tạo sẵn ngầm bộ hình biến hình + lớp màng: mỗi nhịp (~30ms) chỉ xử lý MỘT khung ảnh (vài ms) → không khựng.
  // Xong rồi thì bấm biến hình là có ngay. Ảnh tạo ra dùng chung cả phiên chơi (đổi bản đồ không phải tạo lại).
  prewarmForm() {
    const aw = GameData.awakenOf(App.player);
    if (!aw || !this.sheetId || !this.sys.isActive()) return;
    const id = this.sheetId, anims = Object.keys(Sprites.CHARS[id].anims);
    let i = 0, job = null;
    const tick = () => {
      if (!this.sys.isActive() || this.sheetId !== id || App.form) return;   // đang biến hình thì đã tạo đủ rồi
      if (!job) {
        while (i < anims.length && !(job = Sprites.formJob(this, id, aw.tier, anims[i]))) i++;
        if (!job) return;   // xong hết
      }
      if (job.step()) { job = null; i++; }
      this.time.delayedCall(30, tick);
    };
    tick();
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
      this.formTier = 0;
      pl.setTexture(`ch_${sheet}_idle`, 0);
      this.fitFacing = this.facing || 1;
      Sprites.fitPlayer(pl, sheet, this.fitFacing < 0, 1, 0);
      pl.setFlipX(this.fitFacing < 0);
      pl.play(`ch_${sheet}_idle`);
      if (App.form) this.applyFormLook();
    } else {
      pl.anims.stop();
      this.fitDrawnHero();
      pl.setTexture(this.playerTexKey('idle'));
    }
  }

  // Chọn hoạt ảnh theo trạng thái: chết > bị đánh > đánh > nhảy/rơi > chạy > đứng
  updatePlayerAnim(time, onGround) {
    const pl = this.player, id = this.sheetId;
    if (this.fitFacing !== this.facing) {
      this.fitFacing = this.facing;
      Sprites.fitPlayer(pl, id, this.facing < 0, this.formGrow(), 0);
      pl.setFlipX(this.facing < 0);
    }
    if (time < (this.attackUntil || 0)) return;
    let a;
    if (time < (this.hitAnimUntil || 0)) a = 'hit';
    else if (!onGround) a = pl.body.velocity.y < 0 ? 'jump' : 'fall';
    else if (Math.abs(pl.body.velocity.x) > 10) a = 'run';
    else a = 'idle';
    pl.play(this.charAnim(a), true);
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
    this.player.play({ key: this.charAnim(a), frameRate: rate }, false);
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

  // Gọi mỗi giây. Máu và năng lượng tự hồi GameData.REGEN mỗi giây, chỉ khi KHÔNG giao chiến: đứng yên hoặc chỉ di chuyển
  // (không đánh / dùng kỹ năng và không bị đánh trong 2 giây gần nhất). Đang biến hình thì không hồi.
  regen() {
    if (this.dead) return;
    const now = this.time.now, R = GameData.REGEN;
    // Buff "Ân Sủng" (Trị Liệu Sư): hồi 3% máu mỗi 2 giây (1.5% mỗi giây), 5% khi skill cấp 10 — có cả khi đang đánh
    const grace = this.buffOn('grace');
    if (grace) App.hp = Math.min(App.stats.maxHp, App.hp + App.stats.maxHp * (grace.regen || 0.03) / 2);
    if (App.form) return;
    const fighting = now - (this.staUsedAt || -1e9) < R.calmMs || now - (this.lastHurt || -1e9) < R.calmMs;
    if (fighting) return;
    App.hp = Math.min(App.stats.maxHp, App.hp + R.hp);
    App.mp = Math.min(App.stats.maxMp, App.mp + R.mp * (this.hasPassive('phap_su') ? 2 : 1));   // Pháp Sư hồi năng lượng gấp đôi
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

  // ------------------------------------------------------------------ Thú đồng hành
  fitDrawnHero() {
    const pl = this.player;
    pl.setScale(1).setOrigin(0.5, 0.5);
    pl.body.setSize(18, 46).setOffset(11, 14);
  }
  companionDef(id) { return GameData.MOUNTS[id] || null; }
  summonedPetIds() {
    const m = App.player.mounts || {};
    const ids = Array.isArray(m.summoned) ? m.summoned : (m.active ? [m.active] : []);
    return [...new Set(ids)].filter(id => m.owned.includes(id) && GameData.MOUNTS[id]);
  }
  buildCompanions() {
    if (!this.companionSprites) this.companionSprites = {};
    const ids = this.summonedPetIds(), wanted = new Set(ids);
    for (const [id, c] of Object.entries(this.companionSprites)) {
      if (wanted.has(id)) continue;
      c.sprite.destroy();
      delete this.companionSprites[id];
    }
    const ps = GameData.petStats(App.player), pets = App.player.pets || (App.player.pets = {});
    ids.forEach((id, index) => {
      if (this.companionSprites[id]) return;
      const def = this.companionDef(id), tex = PetSprites.textureKey(def.look);
      PetSprites.createAnims(this, def.look);
      if (!this.textures.exists(tex)) return;
      const state = pets[id] || (pets[id] = { hp: ps.maxHp, mp: ps.maxMp, sta: ps.maxSta });
      for (const [k, max] of [['hp', ps.maxHp], ['mp', ps.maxMp], ['sta', ps.maxSta]]) state[k] = Math.max(0, Math.min(max, Number.isFinite(state[k]) ? state[k] : max));
      const scale = { wolf: 1.3, horse: 0.82, bird: 1.6, lizard: 0.52 }[def.look] || 1.2;
      const x = this.player.x - this.facing * (42 + index * 24);
      const sprite = this.add.sprite(x, this.player.body.bottom, tex, 0).setOrigin(0.5, 1).setDepth(3.6 + index * 0.001).setScale(scale).setTint(def.tint || 0xffffff);
      if (!PetSprites.def(def.look).static) sprite.play(`pet_${def.look}_walk_anim`);
      this.companionSprites[id] = { sprite, nextAttack: 0, deadUntil: 0, lastCombat: 0, attackUntil: 0 };
    });
  }
  companionUpdate(time, delta) {
    const ids = this.summonedPetIds();
    this.buildCompanions();
    const ps = GameData.petStats(App.player), pets = App.player.pets || {};
    if (time >= (this.nextPetTargetScan || 0)) {
      const pl = this.player;
      this.petTarget = this.monsters.filter(m => m.alive && m.sprite?.body?.enable && !m.def.passive && Math.abs(m.sprite.y - pl.y) < 180 && Math.abs(m.sprite.x - pl.x) < 260)
        .sort((a, b) => Math.abs(a.sprite.x - pl.x) - Math.abs(b.sprite.x - pl.x))[0] || null;
      this.nextPetTargetScan = time + 220;
    }
    ids.forEach((id, index) => {
      const c = this.companionSprites[id];
      if (c) this.updateCompanion(id, c, index, time, delta, ps, pets[id]);
    });
    UI.tickPets(ps, pets, ids);
  }
  updateCompanion(id, c, index, time, delta, ps, state) {
    const def = this.companionDef(id), sprite = c.sprite;
    if (state.hp <= 0) {
      if (!c.deadUntil) {
        c.deadUntil = time + 15000;
        sprite.setVisible(false);
        UI.log(`${def.name} đã gục, sẽ hồi sinh sau 15 giây.`, '#ffb74d');
      }
      if (time >= c.deadUntil) {
        c.deadUntil = 0; state.hp = Math.max(1, Math.round(ps.maxHp * 0.5)); state.mp = ps.maxMp; state.sta = ps.maxSta;
        sprite.setVisible(true);
      } else return;
    }
    const regen = delta / 1000;
    if (time - c.lastCombat >= 3000) {
      state.hp = Math.min(ps.maxHp, state.hp + ps.maxHp * 0.018 * regen);
      state.mp = Math.min(ps.maxMp, state.mp + 5 * regen);
      state.sta = Math.min(ps.maxSta, state.sta + 14 * regen);
    }
    const pl = this.player;
    const target = this.petTarget && this.petTarget.alive && this.petTarget.sprite?.body?.enable ? this.petTarget : null;
    let tx = pl.x - this.facing * (42 + index * 24), ty = pl.body.bottom;
    let attacking = false;
    if (target && !this.dead && !App.panelOpen && !this.changing) {
      const dx = target.sprite.x - sprite.x;
      if (Math.abs(dx) > 58) {
        const lane = (index % 2 ? 1 : -1) * Math.ceil(index / 2) * 18;
        tx = target.sprite.x - Math.sign(dx) * 48 + lane; ty = target.sprite.body.bottom;
      } else {
        attacking = true;
        const skillId = App.player.mounts.skills?.[id] || App.player.mounts.skill || 'bite';
        const skill = GameData.PET_SKILLS[skillId] || GameData.PET_SKILLS.bite;
        const useSkill = time >= c.nextAttack && state.mp >= skill.mp && state.sta >= skill.sta && Math.abs(dx) <= skill.range;
        if (useSkill) {
          state.mp -= skill.mp; state.sta -= skill.sta; c.nextAttack = time + skill.cooldown;
          this.damageMonster(target, skill.mult * def.atk, { pet: true, petName: def.name, dir: Math.sign(dx) || 1 });
          c.lastCombat = time; c.attackUntil = time + 420;
          this.floatText(sprite.x, sprite.y - 32, skill.name, '#8be9ff', 11);
        } else if (time >= c.nextAttack && state.sta >= 4) {
          state.sta -= 4; c.nextAttack = time + 1150;
          this.damageMonster(target, 0.82 * def.atk, { pet: true, petName: def.name, dir: Math.sign(dx) || 1 });
          c.lastCombat = time; c.attackUntil = time + 320;
        }
      }
    }
    sprite.x = Phaser.Math.Linear(sprite.x, tx, Math.min(1, delta / (attacking ? 90 : 140)));
    const visual = PetSprites.def(def.look);
    const faceLeft = this.facing < 0;
    sprite.setFlipX(visual.baseLeft ? !faceLeft : faceLeft);
    if (visual.static) sprite.y = Phaser.Math.Linear(sprite.y, ty, Math.min(1, delta / 140)) + Math.sin(time / 160 + index) * 2;
    else {
      sprite.y = Phaser.Math.Linear(sprite.y, ty, Math.min(1, delta / 140));
      const anim = attacking ? 'run' : (Math.abs(sprite.x - tx) > 4 ? 'run' : 'walk');
      const key = `pet_${def.look}_${anim}_anim`;
      if (visual.frames.attack && time < c.attackUntil) {
        const attackKey = `pet_${def.look}_attack_anim`;
        if (sprite.anims.currentAnim?.key !== attackKey) sprite.play(attackKey, true);
      } else if (sprite.anims.currentAnim?.key !== key) sprite.play(key, true);
    }
    sprite.setTint(time < c.lastCombat + 120 ? 0xffffff : (def.tint || 0xffffff));
  }  // ------------------------------------------------------------------ Biến hình (thức tỉnh)
  // Bật/tắt bằng phím T hoặc nút ⚡. Đang biến hình: chỉ số nhân theo ấn, hào quang lửa, mỗi giây tốn `drain` năng lượng
  // và thể lực (ấn 1: 1, ấn 2: 2); MP và thể lực không tự hồi. Cạn một trong hai thì tự trở lại dạng thường.
  toggleForm(time) {
    if (App.form) { this.endForm(); return; }
    const aw = GameData.awakenOf(App.player);
    if (!aw) { UI.log('Chưa thức tỉnh. Đạt cấp 25 rồi gặp Hội trưởng Khải để nhận Ấn thứ nhất.', '#bdbdbd'); return; }
    if (time < (this.formReadyAt || 0)) return;
    const need = aw.drain * 3;   // phải đủ ít nhất 3 giây biến hình
    if (App.mp < need || App.sta < need || App.staLocked) { UI.log(`Không đủ năng lượng / thể lực để biến hình (cần ${need}).`, '#ffca28'); return; }
    // Giữ nguyên % máu và % năng lượng khi giá trị tối đa tăng (không thì thanh MP tụt xuống như bị mất MP)
    const hpRatio = App.hp / App.stats.maxHp, mpRatio = App.mp / App.stats.maxMp;
    App.form = true;
    App.recalcStats();
    App.hp = Math.round(App.stats.maxHp * hpRatio);
    App.mp = Math.round(App.stats.maxMp * mpRatio);
    this.formDrainAcc = 0;
    this.formReadyAt = time + 1500;
    this.awakenFx(aw.tier);
    this.formStart();
    UI.banner(aw.tier >= 2 ? 'BIẾN HÌNH · ẤN THỨ HAI' : 'BIẾN HÌNH · ẤN THỨ NHẤT', 1400);
    UI.refresh();
  }
  endForm(reason) {
    if (!App.form) return;
    const hpRatio = App.hp / App.stats.maxHp, mpRatio = App.mp / App.stats.maxMp;
    App.form = false;
    App.recalcStats();
    App.hp = Math.max(1, Math.round(App.stats.maxHp * hpRatio));
    App.mp = Math.max(0, Math.round(App.stats.maxMp * mpRatio));
    this.formReadyAt = this.time.now + 1500;
    this.formStop();
    if (reason) UI.log(reason, '#ffca28');
    if (this.player) this.floatText(this.player.x, this.player.y - 52, 'Trở lại dạng thường', '#e0e0e0', 12);
    UI.refresh();
  }
  formTick(time, delta) {
    if (!App.form) return;
    const aw = GameData.awakenOf(App.player);
    if (!aw || this.dead) { this.endForm(); return; }
    // Trừ theo từng giây tròn (hiện số trên thanh đổi đều 1, 2 mỗi giây)
    this.formDrainAcc = (this.formDrainAcc || 0) + delta;
    while (this.formDrainAcc >= 1000) {
      this.formDrainAcc -= 1000;
      App.mp = Math.max(0, App.mp - aw.drain);
      App.sta = Math.max(0, App.sta - aw.drain);
    }
    if (App.mp <= 0) this.endForm('Hết năng lượng, biến hình kết thúc.');
    else if (App.sta <= 0) { App.staLocked = true; this.endForm('Hết thể lực, biến hình kết thúc.'); }
  }

  // Hồi thể lực từ từ (gọi mỗi khung hình)
  staminaTick(time, delta) {
    const S = GameData.STAMINA, max = App.stats.maxSta;
    if (App.sta == null) App.sta = max;
    if (App.sta < max && !this.dead && !App.form) {
      const rate = time - (this.staUsedAt || 0) > S.delay ? 1 : S.activeMul;
      App.sta = Math.min(max, App.sta + S.regen * rate * delta / 1000);
    }
    if (App.staLocked && App.sta >= max * S.unlock) App.staLocked = false;
  }

  // Hiệu ứng biến hình: lưỡi lửa bốc lên quanh người (hạt), quầng sáng sau lưng (vẽ trong drawAura)
  formStart() {
    const aw = GameData.awakenOf(App.player);
    if (!aw || !this.player) return;
    this.formStop();
    this.formOn = true;
    const t2 = aw.tier >= 2;
    // Đổi hình dạng: bộ hình tô màu ấn + to hơn (tạo luôn lớp màng hào quang cùng khung hình)
    this.applyFormLook();
    // Lớp màng hào quang: hình riêng nằm NGAY SAU nhân vật, mỗi khung hình chép đúng khung của nhân vật (drawAura)
    this.formShell = this.add.sprite(this.player.x, this.player.y, '__DEFAULT').setDepth(3.9).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    // Quầng sáng mềm tỏa ra NGOÀI lớp màng (WebGL), không chạm vào người
    if (this.webgl && this.formShell.preFX && !Quality.low) {
      try {
        this.formShell.preFX.setPadding(16);
        this.formGlow = this.formShell.preFX.addGlow(aw.aura, t2 ? 2.5 : 1.8, 0, false, 0.1, t2 ? 12 : 9);
      } catch { this.formGlow = null; }
    }
    // Vài đốm sáng nhỏ bay lên từ mép màng (xuất phát quanh viền ngoài, không bay ngang qua người)
    if (!Quality.low) {
      this.formEms = [this.add.particles(0, 0, 'fx_spark', {
        emitZone: { type: 'edge', source: new Phaser.Geom.Ellipse(0, -2, t2 ? 62 : 54, t2 ? 92 : 82), quantity: 24 },
        speedY: { min: -40, max: -90 }, speedX: { min: -8, max: 8 }, scale: { start: t2 ? 0.8 : 0.6, end: 0 },
        alpha: { start: 0.6, end: 0 }, lifespan: { min: 380, max: 700 }, frequency: t2 ? 70 : 110,
        tint: [aw.aura, aw.aura2], blendMode: 'ADD', maxParticles: 24,
      }).setDepth(3.8).startFollow(this.player)];
    }
  }
  formStop() {
    this.formOn = false;
    for (const em of this.formEms || []) em.destroy();
    this.formEms = [];
    if (this.formShell) { this.formShell.destroy(); this.formShell = null; }
    this.formGlow = null;
    if (!App.form && this.formTier) this.applyFormLook();   // trở về bộ hình thường, kích thước thường
  }

  drawAura(time) {
    const g = this.aura, pl = this.player;
    g.clear();
    if (App.form && !this.formOn) this.formStart();   // vừa đổi bản đồ khi đang biến hình
    const sh = this.formShell;
    if (sh) {
      // Chép đúng khung hình, hướng, gốc tọa độ, kích thước của nhân vật → màng luôn ôm sát dáng người
      const key = pl.texture && pl.texture.key.replace(/^chf/, 'cha');
      if (this.formTier && key !== pl.texture.key && this.textures.exists(key)) {
        if (sh.texture.key !== key || sh.frame.name !== pl.frame.name) sh.setTexture(key, pl.frame.name);
        const breathe = 1 + Math.sin(time / 140) * 0.012;           // màng khẽ phập phồng
        sh.setVisible(true).setPosition(pl.x, pl.y).setOrigin(pl.originX, pl.originY)
          .setScale(pl.scaleX * breathe, pl.scaleY * breathe).setFlipX(pl.flipX)
          .setAlpha((0.55 + Math.sin(time / 90) * 0.12) * pl.alpha);   // nhạt, khẽ nhấp nháy
        if (pl.isCropped) { const cr = pl._crop; sh.setCrop(cr.x, cr.y, cr.width, cr.height); } else if (sh.isCropped) sh.setCrop();
      } else sh.setVisible(false);
    }
    const guard = this.buffOn('guard', time), shield = this.buffOn('manashield', time);
    if (guard) { g.lineStyle(3, 0xffb36b, 0.6 + Math.sin(time / 120) * 0.2).strokeEllipse(pl.x, pl.y + 2, 54, 70); }
    if (shield) { g.fillStyle(0x8fb4ff, 0.12).fillCircle(pl.x, pl.y, 38); g.lineStyle(2, 0xbfd2ff, 0.7).strokeCircle(pl.x, pl.y, 38); }
    // Buff awaken tạm thời (skill vn1 Toàn Năng)
    if (this.buffOn('awaken', time)) { g.lineStyle(2, 0xffd54f, 0.5 + Math.sin(time / 90) * 0.3).strokeEllipse(pl.x, pl.y + 28, 60, 14); }
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
