'use strict';
/*
 * Quái do server quản lý (Giai đoạn 3, xem docs/KE_HOACH_DA_NGUOI_CHOI.md).
 *
 * Mỗi bản đồ có người chơi thì có một "thế giới quái" (World): danh sách quái, máu, hồi sinh và AI
 * (đi tuần → phát hiện → đuổi → gồng đòn → lao tới → nghỉ). AI mô phỏng lại logic cũ của client
 * (public/js/scene/monsters.js) nhưng chỉ tính vị trí; client chỉ vẽ theo gói `msnap`.
 *
 * Server làm chủ: vị trí, máu, sống/chết, hồi sinh, thời điểm đòn đặc biệt của trùm, quái phụ khi trùm nổi giận.
 * Client vẫn tự tính: sát thương của MÌNH lên quái (gửi lên bằng gói `hit`, server kiểm tra trần), sát thương
 * quái lên MÌNH (kiểm tra va chạm ngay trên máy mình trong lúc quái lao tới), hiệu ứng.
 */
const G = require('../../shared');
const mapgrid = require('./mapgrid');

const STEP_MS = 50;
const GRAVITY = 1300;
const FLAG_SLOW = 1, FLAG_FREEZE = 2, FLAG_ENRAGE = 4;
const ST = { move: 0, windup: 1, lunge: 2 };
const IDLE_DROP_MS = 30000;      // bản đồ không còn ai: giữ thêm chừng này rồi bỏ (quái hồi sinh đầy)
const CONTRIB_SHARE = 0.1;       // đánh được từ 10% máu quái trở lên thì được tính điểm kết liễu (nhận thưởng như người hạ)
const MAX_MOBS = 300;
const LEASH = 600;               // xa hơn thế (hoặc chết / rời map) thì quái bỏ mục tiêu
const SWITCH_THREAT = 1.3;       // đổi mục tiêu khi có người gây nhiều hơn mục tiêu hiện tại 30% sát thương
const BIG_SCALE_STEP = 0.5;      // trùm / thủ lĩnh: mỗi người chơi gần thêm 50% máu tối đa
const BIG_SCALE_MAX = 3;
const BIG_RANGE = 700;
const REGEN_AFTER_MS = 10000;    // trùm / thủ lĩnh không ai đánh 10 giây thì hồi máu 10%/giây (chống đánh lén rồi bỏ chạy)

class World {
  constructor(mapId, hooks) {
    this.mapId = mapId;
    this.hooks = hooks;          // { emit(obj), kill(mob, killerId, contrib) → assistIds }
    this.map = mapgrid.load(mapId);
    this.mobs = [];
    this.byUid = new Map();
    this.nextUid = 0;
    this.emptySince = 0;
    this.stepCount = 0;
    if (!this.map) return;
    for (const sp of this.map.spawns) this.add(sp.id, sp.r, sp.c);
  }

  add(id, r, c, opts = {}) {
    const def = G.MONSTERS[id];
    if (!def || this.mobs.length >= MAX_MOBS) return null;
    const map = this.map, T = mapgrid.T;
    const x = c * T + T / 2;
    const fly = !!def.fly;
    const y = fly ? r * T + T / 2 : map.groundY(r, c);
    const span = fly ? [x - 220, x + 220] : map.spanAt(Math.floor(y / T), c);
    for (const pt of map.portals) {
      if (pt.x < span[0] - 160 || pt.x > span[1] + 160) continue;
      if (pt.x <= x) span[0] = Math.max(span[0], pt.x + 160);
      else span[1] = Math.min(span[1], pt.x - 160);
    }
    if (span[0] > span[1]) span[0] = span[1] = x;
    const maxHp = G.monHp(def);
    const m = {
      uid: this.nextUid++, id, def, x, y, vy: 0, f: Math.random() < 0.5 ? -1 : 1, hp: maxHp, maxHp, alive: true,
      baseHp: maxHp, scale: 1, threat: new Map(), target: null, lastHitAt: 0, lastHpSent: 0,
      homeX: x, homeY: y, span, minion: !!opts.minion, deaths: 0, respawnAt: 0,
      aggro: false, state: 'move', stateUntil: 0, lungeDir: 1, lvx: 0, lvy: 0,
      nextAttack: 0, nextTurn: 0, nextJump: 0, nextSlam: 0, nextSpecial: 0, patrol: 0,
      slowUntil: 0, freezeUntil: 0, knockUntil: 0, enraged: false, fled: false,
      contrib: new Map(), lastSent: '',
    };
    if (opts.minion) m.aggro = true;
    this.mobs.push(m);
    this.byUid.set(m.uid, m);
    return m;
  }

  flags(m, now) {
    return (now < m.slowUntil ? FLAG_SLOW : 0) | (now < m.freezeUntil ? FLAG_FREEZE : 0) | (m.enraged ? FLAG_ENRAGE : 0);
  }

  // Dữ liệu đầy đủ của một con, gửi khi người chơi vào bản đồ / quái hồi sinh / quái phụ xuất hiện
  full(m, now = Date.now()) {
    return {
      u: m.uid, id: m.id, x: Math.round(m.x), y: Math.round(m.y), f: m.f, hp: m.hp, mh: m.maxHp,
      al: m.alive ? 1 : 0, st: ST[m.state], fl: this.flags(m, now), mn: m.minion ? 1 : 0, k: m.deaths,
    };
  }
  fullList() {
    const now = Date.now();
    return this.mobs.map((m) => this.full(m, now));
  }

  // Gói vị trí chỉ gồm con đã thay đổi từ lần gửi trước
  snapshot(now) {
    const out = [];
    for (const m of this.mobs) {
      if (!m.alive) continue;
      const row = [m.uid, Math.round(m.x), Math.round(m.y), m.f, ST[m.state], this.flags(m, now)];
      const key = row.join(',');
      if (key === m.lastSent) continue;
      m.lastSent = key;
      out.push(row);
    }
    return out;
  }

  // ---------------------------------------------------------------- Nhận đòn đánh từ người chơi
  // hit: { dmg, crit, src, dir, slow, freeze, knock, shred }. Trả về true nếu đòn được tính.
  applyHit(m, connId, hit, now) {
    if (!m || !m.alive) return false;
    const d = m.def;
    const dmg = Math.max(1, Math.round(hit.dmg));
    // Phần sát thương tính cho hận thù / chia thưởng không vượt quá máu còn lại (đòn thừa không được cộng)
    const eff = Math.min(dmg, m.hp);
    m.hp -= dmg;
    m.lastHitAt = now;
    m.threat.set(connId, (m.threat.get(connId) || 0) + eff);
    m.contrib.set(connId, (m.contrib.get(connId) || 0) + eff);
    if (!m.contribSrc) m.contribSrc = new Map();
    m.contribSrc.set(connId, hit.src);
    if (!d.passive) m.aggro = true;
    if (hit.slow > 0) m.slowUntil = Math.max(m.slowUntil, now + Math.min(hit.slow, 6) * 1000);
    if (hit.freeze > 0) {
      const ms = Math.min(hit.freeze, 4) * 1000;
      if (d.boss || d.leader || d.finalBoss) m.slowUntil = Math.max(m.slowUntil, now + ms);
      else m.freezeUntil = Math.max(m.freezeUntil, now + ms);
    }
    if (hit.knock > 0 && !d.boss && !d.leader && !d.passive) {
      const dir = hit.dir === -1 ? -1 : 1;
      m.x += dir * Math.min(hit.knock, 400) * 0.15;
      m.knockUntil = now + 150;
      if (!d.fly) m.x = Math.max(m.span[0] - 4, Math.min(m.span[1] + 4, m.x));
    }
    this.hooks.emit({ t: 'mhit', u: m.uid, hp: Math.max(0, m.hp), d: dmg, c: hit.crit ? 1 : 0, by: connId, dir: hit.dir === -1 ? -1 : 1, src: hit.src });
    // Trùm phụ bỏ chạy khi còn ít máu: tính là hạ gục
    if (m.hp > 0 && d.fleeAt && m.hp <= m.maxHp * d.fleeAt) { m.fled = true; this.die(m, connId, now); return true; }
    if (m.hp <= 0) this.die(m, connId, now);
    return true;
  }

  die(m, killerId, now) {
    m.alive = false;
    m.hp = 0;
    m.deaths++;
    m.aggro = false; m.state = 'move'; m.lastSent = ''; m.threat.clear(); m.target = null;
    const kid = `${this.mapId}.${m.uid}.${m.deaths}`;
    const assist = m.minion ? [] : this.hooks.kill(m, killerId, m.contrib, CONTRIB_SHARE, kid) || [];
    this.hooks.emit({ t: 'mdie', u: m.uid, by: killerId, as: assist, kid: m.minion ? undefined : kid, fled: m.fled ? 1 : 0, x: Math.round(m.x), y: Math.round(m.y) });
    m.contrib = new Map(); m.contribSrc = null;
    if (m.minion) {
      setTimeout(() => { this.byUid.delete(m.uid); this.mobs = this.mobs.filter((o) => o !== m); this.hooks.emit({ t: 'mdel', u: m.uid }); }, 600);
    } else m.respawnAt = now + (m.def.respawn || 10) * 1000;
  }

  respawn(m) {
    m.maxHp = m.baseHp; m.scale = 1; m.threat.clear(); m.target = null;
    m.hp = m.maxHp; m.alive = true; m.aggro = false; m.state = 'move'; m.enraged = false; m.fled = false;
    m.slowUntil = m.freezeUntil = m.knockUntil = 0; m.nextSpecial = m.nextSlam = 0; m.vy = 0;
    m.x = m.homeX; m.y = m.homeY; m.lastSent = '';
    this.hooks.emit({ t: 'mresp', m: this.full(m) });
  }

  // ---------------------------------------------------------------- AI
  step(now, players) {
    this.stepCount++;
    const dt = STEP_MS / 1000;
    for (const m of this.mobs.slice()) {
      if (!m.alive) { if (!m.minion && now >= m.respawnAt) this.respawn(m); continue; }
      this.stepMob(m, now, dt, players);
    }
  }

  // Chọn mục tiêu. Có người đã đánh quái (hận thù) thì đánh người gây nhiều sát thương nhất trong tầm 600 px
  // (đổi mục tiêu khi người khác vượt 30%); chưa ai đánh thì người sống gần nhất lọt vào tầm phát hiện, rồi bám theo tới khi họ chết / đi xa.
  pickTarget(m, living, fly, big) {
    const cy = fly ? m.y : m.y - 20;
    let near = null;
    const cand = [];
    for (const p of living) {
      const dist = Math.hypot(p.x - m.x, p.y - cy);
      if (!near || dist < near.dist) near = { p, dist };
      if (dist <= LEASH) cand.push({ p, dist });
    }
    for (const id of m.threat.keys()) if (!living.some((p) => p.id === id)) m.threat.delete(id);
    if (!cand.length) { m.threat.clear(); return { target: null, near }; }
    const cur = m.target != null ? cand.find((c) => c.p.id === m.target) : null;
    let target = null;
    if (m.threat.size) {
      let top = null, tv = 0;
      for (const c of cand) { const v = m.threat.get(c.p.id) || 0; if (v > tv) { tv = v; top = c; } }
      if (top) target = cur && (m.threat.get(cur.p.id) || 0) * SWITCH_THREAT >= tv ? cur : top;
    }
    if (!target && m.aggro && cur) target = cur;
    if (!target) {
      for (const c of cand) {
        if (c.dist < (big ? 380 : 220) && Math.abs(c.p.y - cy) < 160 && (!target || c.dist < target.dist)) target = c;
      }
    }
    return { target, near };
  }

  // Trùm / thủ lĩnh: nhiều người đánh cùng lúc thì máu tối đa tăng (giữ nguyên tỉ lệ máu hiện tại), không ai đánh thì hồi máu
  stepBigHp(m, now, living) {
    const inFight = m.aggro || m.hp < m.maxHp;
    if (inFight) {
      const n = living.filter((p) => Math.abs(p.x - m.x) < BIG_RANGE && Math.abs(p.y - m.y) < 400).length;
      const scale = Math.min(BIG_SCALE_MAX, 1 + BIG_SCALE_STEP * Math.max(0, n - 1));
      if (scale > m.scale + 0.01) {
        const ratio = m.hp / m.maxHp;
        m.scale = scale;
        m.maxHp = Math.round(m.baseHp * scale);
        m.hp = Math.max(1, Math.round(ratio * m.maxHp));
        this.hooks.emit({ t: 'mhp', u: m.uid, hp: m.hp, mh: m.maxHp });
      }
    }
    if (!m.aggro && m.hp < m.maxHp && now - m.lastHitAt > REGEN_AFTER_MS) {
      m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.1 * (STEP_MS / 1000));
      if (m.hp >= m.maxHp) {
        // Hồi đầy: trở về như mới (hết giận, bỏ quái phụ, máu tối đa gốc)
        m.maxHp = m.baseHp; m.hp = m.maxHp; m.scale = 1; m.enraged = false; m.contrib = new Map(); m.threat.clear();
        for (const o of this.mobs.slice()) if (o.minion && o.alive) { o.alive = false; this.byUid.delete(o.uid); this.mobs = this.mobs.filter((x) => x !== o); this.hooks.emit({ t: 'mdel', u: o.uid }); }
        this.hooks.emit({ t: 'mhp', u: m.uid, hp: m.hp, mh: m.maxHp });
      } else if (now - m.lastHpSent > 500) {
        m.lastHpSent = now;
        this.hooks.emit({ t: 'mhp', u: m.uid, hp: Math.round(m.hp), mh: m.maxHp });
      }
    }
  }

  endAttack(m, now) {
    m.state = 'move';
    m.nextAttack = now + (m.def.boss || m.def.leader ? (m.enraged ? 900 : 1300) : 1000 + Math.random() * 500);
  }

  stepMob(m, now, dt, players) {
    const d = m.def;
    if (d.passive) return;
    const fly = !!d.fly;
    const big = d.boss || d.leader;
    // Chỉ người còn sống mới là mục tiêu: chết thì quái chuyển sang người khác, không còn ai thì bỏ cuộc và về chỗ cũ
    const living = players.filter((p) => !p.dead);
    const { target, near } = this.pickTarget(m, living, fly, big);
    m.aggro = !!target;
    m.target = target ? target.p.id : null;
    if (!target && m.state !== 'move') this.endAttack(m, now);
    const best = target ? target.p : near ? near.p : null;
    const bd = target ? target.dist : near ? near.dist : 1e9;
    if (big) this.stepBigHp(m, now, living);

    if (big && !m.enraged && m.hp < m.maxHp * 0.5) this.enrage(m, now);

    if (now < m.freezeUntil) { if (m.state !== 'move') this.endAttack(m, now); this.fall(m, dt); return; }

    let spd = d.speed * (now < m.slowUntil ? 0.5 : 1);
    if (m.enraged) spd *= 1.35;
    const dx = best ? best.x - m.x : 0;

    if (m.state === 'windup') {
      if (now >= m.stateUntil) {
        m.state = 'lunge';
        m.stateUntil = now + (d.boss ? 320 : 240);
        if (fly && best) {
          const ang = Math.atan2(best.y - m.y, best.x - m.x);
          m.lvx = Math.cos(ang) * 520; m.lvy = Math.sin(ang) * 520;
        } else {
          m.lvx = m.lungeDir * (d.boss ? 420 : 340); m.lvy = 0;
          if (d.jumper) m.vy = -300;
        }
      }
      return;
    }
    if (m.state === 'lunge') {
      m.x += m.lvx * dt;
      if (fly) m.y += m.lvy * dt;
      else { m.x = Math.max(m.span[0] - 4, Math.min(m.span[1] + 4, m.x)); this.fall(m, dt); }
      if (now >= m.stateUntil) this.endAttack(m, now);
      return;
    }

    // ---- Di chuyển
    if (fly) {
      let tx, ty;
      if (m.aggro && best) { tx = best.x - Math.sign(dx || 1) * 50; ty = best.y - 40; }
      else { tx = m.homeX + Math.sin(now / 900 + m.homeX) * 80; ty = m.homeY + Math.sin(now / 500 + m.homeX) * 20; }
      if (Math.abs(tx - m.homeX) > 350) tx = m.homeX + Math.sign(tx - m.homeX) * 350;
      for (const pt of this.map.portals) if (Math.abs(tx - pt.x) < 160) tx = pt.x + (tx >= pt.x ? 160 : -160);
      const dist = Math.hypot(tx - m.x, ty - m.y);
      if (dist >= 6) { const step = Math.min(dist, spd * dt); m.x += (tx - m.x) / dist * step; m.y += (ty - m.y) / dist * step; }
      if (best) m.f = dx < 0 ? -1 : 1;
    } else {
      if (now >= m.knockUntil) {
        let vx;
        if (m.aggro && best) vx = Math.abs(dx) > this.reach(m) * 0.8 ? Math.sign(dx) * spd * 1.25 : 0;
        else {
          if (now > m.nextTurn) { m.patrol = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1); m.nextTurn = now + 1500 + Math.random() * 2000; }
          vx = m.patrol * spd * 0.6;
          if (Math.abs(m.x - m.homeX) > 120) vx = Math.sign(m.homeX - m.x) * spd * 0.6;
        }
        if ((m.x <= m.span[0] && vx < 0) || (m.x >= m.span[1] && vx > 0)) vx = 0;
        m.x += vx * dt;
        if (vx) m.f = vx < 0 ? -1 : 1;
        else if (m.aggro && best) m.f = dx < 0 ? -1 : 1;
      }
      m.x = Math.max(m.span[0] - 4, Math.min(m.span[1] + 4, m.x));
      if (d.jumper && m.aggro && now > m.nextJump && m.y >= m.homeY) { m.vy = -420; m.nextJump = now + 1600; }
      this.fall(m, dt);
    }

    // Đòn đặc biệt của trùm: server quyết định lúc nào, client tự diễn và tự tính trúng mình
    if (d.boss && m.aggro) {
      if ((!d.style || d.style === 'slam') && now > m.nextSlam) {
        m.nextSlam = now + (m.enraged ? 3200 : 4500);
        this.hooks.emit({ t: 'mact', u: m.uid, a: 'slam' });
      }
      if (d.style && d.style !== 'slam' && now > m.nextSpecial) {
        m.nextSpecial = now + (m.enraged ? 4800 : 6200);
        this.hooks.emit({ t: 'mact', u: m.uid, a: 'special' });
      }
    }

    // Đủ gần thì gồng đòn
    if (m.aggro && best && d.atk > 0 && now > m.nextAttack) {
      const feet = best.y + 30;
      const inRange = fly ? bd < 90 : Math.abs(dx) < this.reach(m) + 30 && Math.abs(feet - m.y) < 70;
      if (inRange) {
        m.state = 'windup';
        m.stateUntil = now + (big ? (m.enraged ? 450 : 600) : fly ? 420 : 380);
        m.lungeDir = Math.sign(dx) || 1;
        if (!fly) m.f = m.lungeDir;
      }
    }
  }

  // Tầm đánh: client tính theo bề rộng hình quái; server không có số này nên dùng giá trị trung bình
  reach(m) { return m.def.boss || m.def.leader ? 100 : 52; }

  // Quái đi bộ: rơi/nhảy theo trọng lực về mặt đất xuất hiện
  fall(m, dt) {
    if (m.def.fly) return;
    if (m.vy !== 0 || m.y < m.homeY) {
      m.vy += GRAVITY * dt;
      m.y += m.vy * dt;
      if (m.y >= m.homeY) { m.y = m.homeY; m.vy = 0; }
    }
  }

  // Trùm/thủ lĩnh nổi giận ở 50% máu: gọi thêm 2 quái phụ
  enrage(m, now) {
    m.enraged = true;
    this.hooks.emit({ t: 'mact', u: m.uid, a: 'enrage' });
    const minion = m.def.minion || 'nhen_da';
    if (!G.MONSTERS[minion]) return;
    const T = mapgrid.T;
    for (const off of [-170, 170]) {
      const x = Math.max(m.span[0], Math.min(m.span[1], m.x + off));
      const mm = this.add(minion, Math.floor((m.y - 4) / T), Math.floor(x / T), { minion: true });
      if (mm) { mm.x = x; mm.y = m.y; mm.homeX = x; mm.homeY = m.y; this.hooks.emit({ t: 'mspawn', m: this.full(mm, now) }); }
    }
  }
}

module.exports = { World, STEP_MS, IDLE_DROP_MS };
