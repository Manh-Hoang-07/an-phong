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

  // ---------------------------------------------------------------- Lấy Mạng Đổi Mạng
  // Mục tiêu gần nhất trong tầm, cùng quy tắc với shadow_command: quái sống, không thụ động.
  // Tìm theo trục x (bản đồ chạy ngang) nhưng chặn thêm trục y bằng `reach`.
  executeTarget(range, reach) {
    const pl = this.player;
    return this.monsters.filter(m => m.alive && m.sprite?.body?.enable && !m.def.passive
      && Math.abs(m.sprite.x - pl.x) < range && Math.abs(m.sprite.y - pl.y) < reach)
      .sort((a, b) => Math.abs(a.sprite.x - pl.x) - Math.abs(b.sprite.x - pl.x))[0] || null;
  }

  // Bùa Hộ Mệnh còn dùng được? Đọc hiệu ứng đang mặc + hồi chiêu client.
  // Server kiểm lại lần nữa bằng p.buaCd (server/realtime/index.js onExec) — client không phải nguồn sự thật.
  buaReady() {
    const fx = GameData.specialFx(App.player).undying;
    if (!fx) return null;
    return this.time.now >= (this.lastStandCd || 0) ? fx : null;
  }

  castExecute(id, sk, time) {
    const target = this.executeTarget(sk.range || 520, sk.reach || 320);
    if (!target) { UI.log('Không có mục tiêu trong tầm.', '#bdbdbd'); return; }
    const bua = this.buaReady();
    const cdMs = sk.cd * 1000 * (1 - (App.stats.cdr || 0) / 100);
    this.cooldowns[id] = time + cdMs;
    this.cooldownLen[id] = cdMs;
    const pl = this.player;
    this.floatText(pl.x, pl.y - 52, sk.name, '#ffd54f', 17);
    this.attackAnim(time, 520, 'skill');
    Sound.play('ult');
    this.cameras.main.flash(200, 255, 255, 255);
    this.cameras.main.shake(260, 0.012);
    this.hitstop(140);
    // Vệt chém trắng nối thẳng tới mục tiêu: đòn này phải thấy rõ nó đi đâu
    const tx = target.sprite.x, ty = target.sprite.y;
    const line = this.add.rectangle((pl.x + tx) / 2, (pl.y + ty) / 2, Math.abs(tx - pl.x) + 40, 6, 0xffffff, 0.95)
      .setDepth(9).setBlendMode(Phaser.BlendModes.ADD).setAngle(Math.atan2(ty - pl.y, tx - pl.x) * 57.2958);
    this.tweens.add({ targets: line, alpha: 0, scaleY: 3, duration: 420, onComplete: () => line.destroy() });
    this.ringFx(tx, ty, 0xffffff, 3.4);
    // Mục tiêu cao hơn nhân vật TRÊN 20 cấp thì không gục ngay: chỉ mất 50% sinh lực tối đa.
    // Cái giá của người dùng chiêu không đổi — vẫn về 0 máu (Bùa giữ 1 máu).
    const overLevel = !!sk.execOverLevel
      && ((target.def && target.def.level) || 1) - (App.player.level || 1) > sk.execOverLevel;
    // Mục tiêu chết. Quái do server quản lý thì để server giết: thưởng chảy đúng đường mdie/kid.
    if (target.net) Realtime.send({ t: 'exec', u: target.uid, bua: bua ? 1 : 0 });
    else if (overLevel) {
      const dmg = Math.min(target.hp, Math.round((target.maxHp || target.hp) * (sk.execOverHp || 0.5)));
      target.hp -= dmg;
      this.floatText(tx, ty - 26, '💀 ' + dmg, '#ff8a80', 18);
      if (target.hp > 0) this.drawMonsterBar(target);
      else this.killMonster(target);
    } else { target.hp = 0; this.killMonster(target); }
    // Trả giá: bùa cứu thì 1 máu + bất tử, không bùa thì chết theo.
    if (sk.buaSaves && bua) {
      App.hp = 1;
      this.lastStandUntil = time + (bua.dur || 5) * 1000;
      this.lastStandCd = time + 60000;
      this.floatText(pl.x, pl.y - 70, '🪬 Đổi mạng', '#ffe082', 16);
    } else {
      this.floatText(pl.x, pl.y - 70, '💀 Đổi mạng', '#ff5252', 18);
      this.dieByExec();
    }
  }

  // ---------------------------------------------------------------- Tử Linh Dung Hợp
  // Dung hợp toàn bộ bộ sưu tập bóng ma vào bản thân trong `fusionSec` giây; đổi lại roster mất trắng.
  // Client KHÔNG tự tính chỉ số: server là nguồn sự thật, client chỉ kiểm điều kiện, gửi lệnh và vẽ hiệu ứng.
  castFusion(id, sk, time) {
    const p = App.player;
    if (p.school !== 'tu_linh_thuat_su') { UI.log('Chỉ Tử Linh Thuật Sư mới dùng được dung hợp.', '#bdbdbd'); return; }
    const roster = (p.shadows && p.shadows.roster) || [];
    if (!roster.length) { UI.log('Không có bóng ma nào để dung hợp.', '#bdbdbd'); return; }
    if (p.fusion && p.fusion.until > Date.now()) { UI.log('Đang trong thời gian dung hợp.', '#bdbdbd'); return; }
    const cost = Math.round(sk.mp * (App.stats.costMul || 1));
    if (App.mp < cost) { UI.log('Không đủ năng lượng!', '#64b5f6'); return; }
    const cdMs = sk.cd * 1000 * (1 - (App.stats.cdr || 0) / 100);
    this.cooldowns[id] = time + cdMs;
    this.cooldownLen[id] = cdMs;
    const pl = this.player;
    this.floatText(pl.x, pl.y - 52, sk.name, '#c6a7ff', 17);
    this.attackAnim(time, 480, 'skill');
    Sound.play('ult');
    this.cameras.main.flash(260, 180, 140, 255);
    this.cameras.main.shake(300, 0.010);
    this.hitstop(120);
    // Hiệu ứng: vòng xoáy tím dưới chân + các chấm sáng bay từ bốn phía vào người (bóng ma bị hút vào)
    const ring = this.add.circle(pl.x, pl.y, 18, 0x9b6bff, 0.35).setDepth(8.5).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: ring, radius: 130, alpha: 0, duration: 620, onComplete: () => ring.destroy() });
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12, d = 120 + Math.random() * 60;
      const dot = this.add.circle(pl.x + Math.cos(a) * d, pl.y + Math.sin(a) * d, 4, 0xd9c2ff, 0.95)
        .setDepth(8.6).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: dot, x: pl.x, y: pl.y - 20, alpha: 0, duration: 420 + i * 18, onComplete: () => dot.destroy() });
    }
    // Server kiểm lại class / bóng / hồi chiêu / MP rồi mới ghi p.fusion và xoá roster.
    Realtime.send({ t: 'fusion' });
  }

  // ---------------------------------------------------------------- Cấm Chú Giải Phóng
  // Đốt TOÀN BỘ năng lượng thành một vụ nổ. Sát thương = MP đã đốt × mpPower, KHÔNG nhân skillMul
  // (vì đã nhân theo lượng MP thật của người chơi — nhân thêm skillMul là tính hai lần cùng một nguồn sức mạnh).
  // Cái giá: về 0 MP + `lockSec` giây không hồi năng lượng, vô hiệu luôn nội tại Dòng Chảy.
  // Server giữ hồi chiêu và khoá MP (server/realtime/index.js onManaBurst) — client chỉ kiểm và vẽ.
  castManaBurst(id, sk, time) {
    const p = App.player;
    if (this.mpLockUntil && time < this.mpLockUntil) {
      UI.log(`Cấm chú đang phong ấn năng lượng (còn ${Math.ceil((this.mpLockUntil - time) / 1000)} giây).`, '#bdbdbd');
      return;
    }
    const spend = Math.floor(App.mp || 0);
    if (spend < 50) { UI.log('Cần ít nhất 50 năng lượng để giải phóng.', '#64b5f6'); return; }
    const sta = this.skillStaminaCost(sk);
    if (!this.canSpendStamina(sta)) return;
    this.spendStamina(sta);
    const cdMs = sk.cd * 1000 * (1 - (App.stats.cdr || 0) / 100);
    this.cooldowns[id] = time + cdMs;
    this.cooldownLen[id] = cdMs;
    const pl = this.player;
    const power = sk.mpPower || 5.5;
    // Sát thương tính từ MP đã đốt; trừ giảm trừ phòng thủ của từng quái do damageMonster lo (mult là bội số ATK).
    // Nên quy đổi: mult = MP × mpPower / ATK, để damageMonster ra đúng con số đã thiết kế.
    const atk = Math.max(1, App.stats.atk || 1);
    const mult = (spend * power) / atk;
    App.mp = 0;
    this.mpLockUntil = time + (sk.lockSec || 10) * 1000;
    this.floatText(pl.x, pl.y - 52, sk.name, '#ff8a80', 18);
    this.attackAnim(time, 560, 'skill');
    Sound.play('ult');
    this.cameras.main.flash(300, 255, 120, 90);
    this.cameras.main.shake(340, 0.016);
    this.hitstop(160);
    // Hiệu ứng: vòng đỏ-cam bùng ra theo bán kính thật của đòn
    const g = this.add.graphics().setDepth(7.5);
    let t = 0;
    this.time.addEvent({ delay: 16, repeat: 24, callback: () => {
      t++; g.clear();
      const r = sk.radius * (t / 25);
      g.fillStyle(0xff7043, 0.30 * (1 - t / 25)).fillCircle(pl.x, pl.y, r);
      g.lineStyle(5, 0xffd180, 1 - t / 25).strokeCircle(pl.x, pl.y, r);
      if (t >= 25) g.destroy();
    } });
    this.floatText(pl.x, pl.y - 78, `-${Math.round(spend)} MP`, '#64b5f6', 15);
    this.hitCircle(pl.x, pl.y, sk.radius || 300, mult, { sk: 1, superUlt: 1, id, knock: 260 });
    // Server kiểm lại class / đã học / hồi chiêu / MP rồi mới ghi p.mp = 0 và p.mpLock.
    // Gói `cast` mở cửa sổ đòn cho onHit (đòn k=3 ở trên phải có cast hợp lệ).
    Realtime.send({ t: 'cast', id });
    Realtime.send({ t: 'manaburst' });
  }

  // Chết vì cái giá của Lấy Mạng Đổi Mạng.
  // KHÁC die() ở một điểm quan trọng: KHÔNG gọi Net.action('die').
  // Server đã tự chạy luật chết (mất 5% kinh nghiệm, hồi sinh ở làng) ngay trong onExec, và đẩy bản vá
  // về đây. Gọi thêm action 'die' là chết hai lần: mất 10% kinh nghiệm và tranh nhau ghi p.hp.
  // Nếu người chơi chọn "Ở lại", chỉ gọi respawn_choice (dời chỗ đứng dậy, KHÔNG trừ EXP nữa).
  async dieByExec() {
    if (this.dead) return;
    this.dead = true;
    App.hp = 0;
    this.freeCastUsed = false;
    try {
      this.endForm();
      if (this.sheetId) { this.attackUntil = 0; this.player.setAngle(0); this.player.play(this.charAnim('death')); }
      else this.player.setTint(0x555555).setAngle(this.facing * -90);
      this.player.body.setVelocity(0, 0);
    } catch (e) { /* bỏ qua hiệu ứng chết */ }
    UI.banner('ĐỔI MẠNG · BẠN ĐÃ GỤC', 1200);
    Sound.play('death');
    const where = await UI.askRespawn();
    if (where === 'stay') {
      try { await Net.action('respawn_choice', { where: 'stay' }); }
      catch (e) { /* mất mạng: server giữ chỗ làng, đồng bộ khi lưu */ }
    }
    if (!this.sys || !this.sys.isActive()) return;
    App.sta = App.stats.maxSta; App.staLocked = false;
    try { this.cameras.main.fadeOut(300); } catch (e) { /* bỏ qua */ }
    setTimeout(() => {
      if (!this.sys || !this.sys.isActive()) return;
      this.scene.restart({ map: (App.player && App.player.map) || GameData.START_MAP, arrive: (App.player && App.player.arrive) || null });
    }, 340);
  }

  // ---------------------------------------------------------------- Vạn Pháp Quy Nhất
  // Tung CẢ BA tuyệt kỹ chung cùng một nhịp, mỗi cái chạy nguyên hiệu ứng gốc của nó, cộng thêm
  // một vụ nổ tổng hợp có power riêng (sk.power). Sau đó tự phong ấn toàn bộ kỹ năng `lockSec` giây.
  //
  // Không gọi lại useSkill cho từng kỹ năng: useSkill sẽ tự trừ MP / thể lực / hồi chiêu của từng cái,
  // và ba kỹ năng đó có thể chưa được học. Ở đây đọc thẳng dữ liệu cấp 10 của chúng và tự vẽ hiệu ứng.
  castAllIn(id, sk, time) {
    const cost = Math.round(sk.mp * App.stats.costMul);
    if (App.mp < cost) { UI.log('Không đủ năng lượng!', '#64b5f6'); return; }
    const sta = this.skillStaminaCost(sk);
    if (!this.canSpendStamina(sta)) return;
    App.mp -= cost;
    this.spendStamina(sta);
    const cdMs = sk.cd * 1000 * (1 - (App.stats.cdr || 0) / 100);
    this.cooldowns[id] = time + cdMs;
    this.cooldownLen[id] = cdMs;
    const pl = this.player, f = this.facing;
    const pw = sk.power * App.stats.skillMul;
    this.floatText(pl.x, pl.y - 52, sk.name, '#b388ff', 19);
    this.attackAnim(time, 700, 'skill');
    Sound.play('ult');
    this.cameras.main.flash(340, 200, 160, 255);
    this.cameras.main.shake(420, 0.020);
    this.hitstop(200);
    // --- 1. Vụ nổ tổng hợp ở giữa (power riêng của TUYỆT PHẨM)
    const g = this.add.graphics().setDepth(7.5);
    let t = 0;
    this.time.addEvent({ delay: 16, repeat: 26, callback: () => {
      t++; g.clear();
      const r = sk.radius * (t / 27);
      g.fillStyle(0xb388ff, 0.32 * (1 - t / 27)).fillCircle(pl.x, pl.y, r);
      g.lineStyle(5, 0xe1d4ff, 1 - t / 27).strokeCircle(pl.x, pl.y, r);
      if (t >= 27) g.destroy();
    } });
    this.hitCircle(pl.x, pl.y, sk.radius, pw, { sk: 1, superUlt: 1, id, knock: 300 });
    // --- 2. Thiên Địa Chấn Động: nổ lan quanh người
    const chung1 = GameData.skillAt('ulChung1', 10);
    this.time.delayedCall(90, () => {
      if (!this.sys || !this.sys.isActive()) return;
      const p1 = chung1.power * App.stats.skillMul;
      this.hitCircle(pl.x, pl.y, chung1.radius, p1, { sk: 1, superUlt: 1, id, knock: 260 });
      this.ringFx(pl.x, pl.y, 0xff7043, 3);
    });
    // --- 3. Hư Không Tuyệt Trảm: ba nhát chém hư không đánh xuống phía trước
    const chung3 = GameData.skillAt('ulChung3', 10);
    const gy = pl.body.bottom;
    for (let k = 0; k < (chung3.count || 3); k++) {
      this.time.delayedCall(180 + k * 200, () => {
        if (!this.sys || !this.sys.isActive()) return;
        const x = Phaser.Math.Clamp(pl.x + f * (140 + k * 130), 30, this.worldW - 30);
        this.telegraph(x, gy, chung3.radius, 0xb388ff, 260);
        const sw = this.add.image(x, gy - 420, 'fx_bigsword').setOrigin(0.5, 1).setDepth(8).setAlpha(0.95).setTint(0xd9c2ff);
        this.tweens.add({ targets: sw, y: gy + 20, duration: 280, ease: 'Quad.in', onComplete: () => {
          this.cameras.main.shake(180, 0.010);
          this.hitCircle(x, gy - 30, chung3.radius, chung3.power * App.stats.skillMul, { sk: 1, superUlt: 1, id, knock: 300 });
          this.tweens.add({ targets: sw, alpha: 0, duration: 420, delay: 200, onComplete: () => sw.destroy() });
        } });
      });
    }
    // --- 4. Ý Chí Bất Diệt: buff tấn công / chí mạng / tốc đánh, cùng ô riêng như dùng bình thường
    const chung2 = GameData.skillAt('ulChung2', 10);
    this.buffs['ulChung2'] = { name: 'awaken', until: time + chung2.duration * 1000, dur: chung2.duration * 1000,
      skill: 'ulChung2', atk: chung2.atkBuff || 0, crit: chung2.critBuff || 0, speed: chung2.speedBuff || 0,
      regen: chung2.regen || 0, exec: chung2.exec || null };
    this.floatText(pl.x, pl.y - 78, 'Ý Chí Bất Diệt', '#ffd54f', 15);
    // --- 5. Cái giá: phong ấn toàn bộ kỹ năng
    this.skillLockUntil = time + (sk.lockSec || 60) * 1000;
    this.floatText(pl.x, pl.y - 100, `🔒 Phong ấn ${sk.lockSec || 60}s`, '#bdbdbd', 15);
    // Server giữ mốc phong ấn (p.skillLock) và hồi chiêu — client không được quyết.
    // `cast` mở cửa sổ đòn cho onHit (các đòn k=3 ở trên phải có cast hợp lệ).
    Realtime.send({ t: 'cast', id });
    Realtime.send({ t: 'allin' });
  }

  useSkill(slot, time) {
    const p = App.player;
    // Vạn Pháp Quy Nhất: đang phong ấn kỹ năng thì không dùng được ô nào (kể cả ô trang bị).
    // Mốc do SERVER giữ (p.skillLock) nên đổi bản đồ hay hồi sinh cũng không xoá được.
    const lockUntil = Math.max(this.skillLockUntil || 0, (p && p.skillLock) || 0);
    if (time < lockUntil) {
      UI.log(`Kỹ năng đang bị phong ấn (còn ${Math.ceil((lockUntil - time) / 1000)} giây).`, '#bdbdbd');
      return;
    }
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
    // Lấy Mạng Đổi Mạng: tìm mục tiêu TRƯỚC rồi mới trả giá — không có mục tiêu thì không mất gì.
    // Không tốn MP, không tốn thể lực: cái giá là MÁU (xem shared/data/skills/ult/ult-dac-biet.js).
    if (sk.type === 'execute') { this.castExecute(id, sk, time); return; }
    // Tử Linh Dung Hợp: cần có bóng ma trong bộ sưu tập, không có thì không mất gì (không tốn MP, không hồi chiêu).
    if (sk.type === 'fusion') { this.castFusion(id, sk, time); return; }
    // Cấm Chú Giải Phóng: cái giá là TOÀN BỘ năng lượng, nên phải tự kiểm MP tối thiểu
    // (không dùng bảng giá `sk.mp` như kỹ năng khác — xem castManaBurst).
    if (sk.type === 'manaburst') { this.castManaBurst(id, sk, time); return; }
    // Vạn Pháp Quy Nhất: tung cả ba tuyệt kỹ chung cùng lúc rồi tự phong ấn kỹ năng.
    if (sk.type === 'allin') { this.castAllIn(id, sk, time); return; }
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
    // Báo server lần dùng chiêu hợp lệ để nó giữ hồi chiêu + đếm số lần (chống spam). Gửi TRƯỚC khi bắn đòn.
    Realtime.send({ t: 'cast', id });
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
      // Loại đòn để server chọn đúng trần sát thương: 1 kỹ năng, 2 tuyệt kỹ, 3 TUYỆT PHẨM.
      // Server KHÔNG tin cờ này (client sửa được) — nó chỉ chọn trần, còn chặn thật là ngân sách mỗi giây.
      o.sk = 1;
      o.id = id;                       // server đối chiếu đòn với lần cast hợp lệ
      if (sk.ult) o.ult = 1;
      if (sk.superUlt) o.superUlt = 1;
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
        // Hồi máu MỘT LẦN mỗi lần tung (không phải mỗi đợt): Vạn Linh Quy Tụ hồi 12% ở m5.
        if (sk.heal) this.skillHeal(sk.heal);
        break;
      }
    }
  }
});
