'use strict';
/* Luật chơi phía server · Hành động nhân vật: chọn class, cộng điểm, kỹ năng, thức tỉnh, mật mã. */
const G = require('../../../shared');
const codes = require('../../codes');
const { fail, fmt } = require('../util');
const { bagFree, slotsNeeded, giveItem } = require('../inventory');
const { gainGold, gainExp, setSchool, resetCost } = require('../progress');
const { questActive, onCurrentMapNpc } = require('../quests');

const redeemTries = new Map();

const actions = {
  choose_school(p, a, ev) {
    if (p.school) fail('Bạn đã thức tỉnh class rồi.');
    if (p.level < 5) fail('Cần đạt cấp 5.');
    if (!questActive(p, 'q6')) fail('Hãy nhận nhiệm vụ "Thức tỉnh lần hai" từ Hội trưởng Khải.');
    const sc = G.SCHOOLS[a.school];
    if (!sc) fail('Class không hợp lệ.');
    if (sc.special && !p.unlocks[a.school]) fail('Class này chỉ thức tỉnh được bằng mật mã.');
    setSchool(p, a.school, ev);
  },

  add_stat(p, a) {
    const n = Math.max(1, Math.min(p.freePoints, Math.floor(Number(a.n) || 1)));
    if (!['str', 'vit', 'agi', 'spi'].includes(a.stat)) fail('Chỉ số không hợp lệ.');
    if (p.freePoints < 1) fail('Không còn điểm tiềm năng.');
    p.points[a.stat] += n;
    p.freePoints -= n;
  },

  set_skill(p, a) {
    const slot = Number(a.slot);
    if (!Number.isInteger(slot) || slot < 0 || slot >= G.SKILL_SLOTS) fail('Ô kỹ năng không hợp lệ.');
    if (slot === G.EXTRA_SLOT && p.school !== 'toan_nang') fail('Ô này chỉ dành cho Toàn Năng.');
    if (!a.skill) { p.skillSlots[slot] = null; return; }
    const sk = G.SKILLS[a.skill];
    if (!sk || !G.availableSkills(p).includes(a.skill)) fail('Kỹ năng không thuộc class của bạn.');
    if (!G.skillLevel(p, a.skill)) fail('Hãy học kỹ năng này trước.');
    if (sk.ult && slot !== G.ULT_SLOT) fail('Tuyệt kỹ chỉ đặt được ở ô tuyệt kỹ.');
    if (!sk.ult && slot === G.ULT_SLOT) fail('Ô tuyệt kỹ chỉ dành cho tuyệt kỹ.');
    const other = p.skillSlots.indexOf(a.skill);
    if (other >= 0) p.skillSlots[other] = null;
    p.skillSlots[slot] = a.skill;
  },

  // Học hoặc nâng cấp kỹ năng bằng điểm kỹ năng
  learn_skill(p, a, ev) {
    const sk = G.SKILLS[a.skill];
    if (!sk || !G.availableSkills(p).includes(a.skill)) fail('Kỹ năng không thuộc class của bạn.');
    if (sk.level > p.level) fail(`Cần đạt cấp ${sk.level}.`);
    const lv = G.skillLevel(p, a.skill);
    if (lv >= G.SKILL_MAX) fail('Kỹ năng đã đạt cấp tối đa.');
    if (p.skillPoints < 1) fail('Không còn điểm kỹ năng.');
    p.skillPoints -= 1;
    p.skills[a.skill] = lv + 1;
    if (lv === 0) {
      // Học lần đầu thì tự đặt vào ô trống
      const slots = sk.ult ? [G.ULT_SLOT] : [0, 1, 2, 3].concat(p.school === 'toan_nang' ? [G.EXTRA_SLOT] : []);
      const free = slots.find(i => !p.skillSlots[i]);
      if (free !== undefined) p.skillSlots[free] = a.skill;
      ev.push({ t: 'msg', text: `Đã học ${sk.name}.`, color: '#4fc3f7' });
    } else {
      const milestone = (lv + 1 === 5 && sk.t5) || (lv + 1 === 10 && sk.t10);
      ev.push({ t: 'msg', text: `${sk.name} lên cấp ${lv + 1}.${milestone ? ' Mở hiệu ứng: ' + milestone : ''}`, color: '#4fc3f7' });
    }
  },

  // Tẩy điểm kỹ năng ở Hội trưởng
  reset_skills(p, a, ev) {
    if (!onCurrentMapNpc(p, 'lao_su')) fail('Hãy đến gặp Hội trưởng Khải.');
    const spent = Object.values(p.skills).reduce((x, y) => x + y, 0);
    if (!spent) fail('Bạn chưa cộng điểm kỹ năng nào.');
    const cost = resetCost(p);
    if (p.gold < cost) fail('Không đủ xu.');
    p.gold -= cost;
    p.skillPoints += spent;
    p.skills = {};
    p.skillSlots = Array(G.SKILL_SLOTS).fill(null);
    ev.push({ t: 'msg', text: `Đã tẩy điểm kỹ năng, nhận lại ${spent} điểm (-${fmt(cost)} xu).`, color: '#ffd54f' });
  },

  // Thức tỉnh class đặc biệt ở Lữ khách bí ẩn (đổi được cả khi đã có class khác)
  awaken_special(p, a, ev) {
    if (!onCurrentMapNpc(p, 'lu_khach')) fail('Hãy đến gặp Lữ khách bí ẩn.');
    const sc = G.SCHOOLS[a.school];
    if (!sc || !sc.special || !p.unlocks[a.school]) fail('Bạn chưa mở khóa class này.');
    if (p.school === a.school) fail('Bạn đã là ' + sc.name + ' rồi.');
    if (p.level < 5) fail('Cần đạt cấp 5.');
    setSchool(p, a.school, ev);
  },

  // Chọn thú cưỡi đang dùng (chỉ thú đã sở hữu)
  mount_set(p, a) {
    const id = a.id || null;
    if (id && !G.MOUNTS[id]) fail('Không có thú cưỡi này.');
    if (id && !p.mounts.owned.includes(id)) fail('Bạn chưa có thú cưỡi này. Nhận qua mã quà tặng ở Lữ khách bí ẩn.');
    if (id && p.level < (G.MOUNTS[id].level || 1)) fail(`Cần đạt cấp ${G.MOUNTS[id].level} để cưỡi.`);
    p.mounts.active = id;
  },

  // Đánh giá hạng thợ săn ở Hội trưởng Khải: đủ cấp thì lên đúng MỘT hạng (người chơi tự chọn lúc nào đi đánh giá)
  rank_eval(p, a, ev) {
    if (!onCurrentMapNpc(p, 'lao_su')) fail('Hãy đến gặp Hội trưởng Khải ở Hiệp Hội để được đánh giá.');
    const next = G.nextRank(p);
    if (!next) fail('Bạn đã đạt hạng cao nhất.');
    if (p.level < next.level) fail(`Cần đạt cấp ${next.level} mới được đánh giá hạng ${next.rank}.`);
    const from = G.playerRank(p);
    p.rank = next.rank;
    ev.push({ t: 'rank', rank: next.rank });
    ev.push({ t: 'msg', text: `[Hiệp Hội] Đánh giá hoàn tất: thợ săn hạng ${from} → hạng ${next.rank}.`, color: '#ffd54f' });
  },

  // Thức tỉnh (biến hình) bậc kế tiếp: ấn 1 ở Hội trưởng Khải (cấp 25), ấn 2 ở Lữ khách (cấp 45)
  awaken_next(p, a, ev) {
    const aw = G.nextAwaken(p);
    if (!aw) fail('Bạn đã thức tỉnh tối đa.');
    if (!p.school) fail('Hãy chọn class trước khi thức tỉnh.');
    if (!onCurrentMapNpc(p, aw.npc)) fail(`Hãy đến gặp ${G.NPCS[aw.npc].name}.`);
    if (p.level < aw.level) fail(`Cần đạt cấp ${aw.level}.`);
    p.awakenTier = aw.tier;
    const st = G.calcStats(p);
    p.hp = st.maxHp; p.mp = st.maxMp;
    ev.push({ t: 'msg', text: `[Hệ thống] ${aw.name} thành công! ${aw.desc}`, color: '#ffd54f' });
    ev.push({ t: 'awaken', tier: aw.tier });
  },

  // Nhập mật mã ở Lữ khách bí ẩn. Mã nằm trong PostgreSQL: mỗi tài khoản một lần,
  // và mã có thể bị giới hạn tổng số lượt hoặc có hạn dùng.
  async redeem(p, a, ev, userId) {
    if (!onCurrentMapNpc(p, 'lu_khach')) fail('Hãy đến gặp Lữ khách bí ẩn.');
    const now = Date.now();
    const tr = redeemTries.get(userId) || { start: now, n: 0 };
    if (now - tr.start > 10 * 60 * 1000) { tr.start = now; tr.n = 0; }
    if (tr.n >= 8) fail('Sai quá nhiều lần, thử lại sau 10 phút.');
    const key = codes.normalize(a.code);
    if (p.redeemed.includes(key)) fail('Bạn đã dùng mật mã này rồi.');
    const claim = await codes.redeem(userId, key);
    if (!claim.ok) {
      if (claim.error === 'not_found') { tr.n++; redeemTries.set(userId, tr); }
      fail(claim.message);
    }
    try {
      const r = claim.rewards || {};
      const items = Array.isArray(r.items) ? r.items.filter(([id]) => G.ITEMS[id]) : [];
      const need = items.reduce((s2, [id, n]) => s2 + slotsNeeded(p, id, n), 0);
      if (bagFree(p) < need) fail(`Túi cần trống ít nhất ${need} ô.`);
      // Thú cưỡi: mã chỉ toàn thú đã có → báo lỗi và trả lại lượt (không mất mã)
      const mounts = (Array.isArray(r.mounts) ? r.mounts : []).filter(id => G.MOUNTS[id]);
      const newMounts = mounts.filter(id => !p.mounts.owned.includes(id));
      const onlyMounts = !r.unlockClass && !r.gold && !r.exp && !r.skillPoints && !items.length;
      if (mounts.length && !newMounts.length && onlyMounts) fail(`Bạn đã có ${mounts.map(id => G.MOUNTS[id].name).join(', ')} rồi.`);
      p.redeemed.push(key);
      ev.push({ t: 'msg', text: '[Hệ thống] Mật mã hợp lệ.', color: '#ffd54f' });
      if (r.unlockClass && G.SCHOOLS[r.unlockClass]) {
        p.unlocks[r.unlockClass] = true;
        ev.push({ t: 'unlock', school: r.unlockClass });
        ev.push({ t: 'msg', text: `[Hệ thống] Đã mở khóa class đặc biệt: ${G.SCHOOLS[r.unlockClass].name}.`, color: '#ffc94a' });
      }
      if (r.gold) gainGold(p, Math.max(0, Math.floor(r.gold)), ev);
      if (r.exp) gainExp(p, Math.max(0, Math.floor(r.exp)), ev);
      if (r.skillPoints) p.skillPoints += Math.max(0, Math.floor(r.skillPoints));
      for (const [id, n] of items) giveItem(p, id, Math.max(1, Math.floor(n)), ev);
      for (const id of newMounts) {
        p.mounts.owned.push(id);
        if (!p.mounts.active) p.mounts.active = id;   // thú đầu tiên: chọn luôn
        ev.push({ t: 'mount_new', id });
        ev.push({ t: 'msg', text: `[Hệ thống] Nhận thú cưỡi: ${G.MOUNTS[id].icon} ${G.MOUNTS[id].name}! Bấm phím M hoặc nút 🐎 để cưỡi.`, color: '#ffc94a' });
      }
    } catch (e) {
      // Không phát được quà (ví dụ túi đầy) thì trả lại lượt cho mã
      await codes.release(userId, key);
      throw e;
    }
  },
};

module.exports = actions;
