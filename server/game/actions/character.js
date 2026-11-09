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
    if (sk.ult && !G.skillLevel(p, a.skill)) fail('Cần dùng Sách Tuyệt Kỹ để học tuyệt kỹ này.');
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
    const ultId = Object.keys(p.skills).find(id => G.SKILLS[id]?.ult && G.skillLevel(p, id) > 0);
    const totalLevels = Object.values(p.skills).reduce((x, y) => x + y, 0);
    const spent = totalLevels - (ultId ? 1 : 0);
    if (!spent) fail('Bạn chưa cộng điểm kỹ năng nào.');
    const cost = resetCost(p);
    if (p.gold < cost) fail('Không đủ xu.');
    p.gold -= cost;
    p.skillPoints += spent;
    p.skills = ultId ? { [ultId]: 1 } : {};
    p.skillSlots = Array(G.SKILL_SLOTS).fill(null);
    if (ultId) p.skillSlots[G.ULT_SLOT] = ultId;
    ev.push({ t: 'msg', text: `Đã tẩy điểm kỹ năng, nhận lại ${spent} điểm (-${fmt(cost)} xu).`, color: '#ffd54f' });
  },

  // Thức tỉnh class đặc biệt ở Lữ khách bí ẩn (đổi được cả khi đã có class khác)
  awaken_special(p, a, ev) {
    if (!onCurrentMapNpc(p, 'lu_khach')) fail('Hãy đến gặp Lữ khách bí ẩn.');
    const sc = G.SCHOOLS[a.school];
    if (!sc || !sc.special) fail('Class này chưa mở khóa.');
    if (a.school === 'tu_linh_thuat_su') {
      fail('Tiến hóa bằng Sách Tiến Hóa Chức Nghiệp từ NPC ẩn.');
    } else if (!p.unlocks[a.school]) fail('Bạn chưa mở khóa class này.');
    if (p.school === a.school) fail('Bạn đã là ' + sc.name + ' rồi.');
    if (p.level < 5) fail('Cần đạt cấp 5.');
    setSchool(p, a.school, ev);
  },

  // Bật / thu hồi một thú đồng hành (giữ tên hành động để tương thích client cũ)
  mount_set(p, a) {
    const id = a.id;
    if (!G.MOUNTS[id]) fail('Không có thú triệu hồi này.');
    if (!p.mounts.owned.includes(id)) fail('Bạn chưa có thú này. Nhận qua mã quà tặng ở Lữ khách bí ẩn.');
    if (p.level < (G.MOUNTS[id].level || 1)) fail(`Cần đạt cấp ${G.MOUNTS[id].level} để triệu hồi ${G.MOUNTS[id].name}.`);
    if (p.mounts.summoned.includes(id)) p.mounts.summoned = p.mounts.summoned.filter(petId => petId !== id);
    else {
      const summonCost = 10;
      if (p.mp < summonCost) fail(`Không đủ MP để triệu hồi (cần ${summonCost} MP).`);
      p.mp -= summonCost;
      p.mounts.summoned.push(id);
    }
    p.mounts.active = p.mounts.summoned[0] || null;
    if (p.mounts.active) p.pet = p.pets[p.mounts.active];
  },

  pet_skill_set(p, a) {
    if (!p.mounts.summoned.length) fail('Hãy triệu hồi ít nhất một thú trước.');
    if (!G.PET_SKILLS[a.skill]) fail('Kỹ năng thú đồng hành không hợp lệ.');
    p.mounts.skill = a.skill;
    const ids = a.id ? [a.id] : p.mounts.summoned;
    if (ids.some(id => !p.mounts.summoned.includes(id))) fail('Thú này chưa được triệu hồi.');
    for (const id of ids) p.mounts.skills[id] = a.skill;
  },

  // Bật / thu hồi linh thú mặc định của Triệu Hồi Sư (kỹ năng th5)
  summon_toggle(p, a, ev) {
    if (p.school !== 'trieu_hoi_su' && p.school !== 'tu_linh_thuat_su' && p.school !== 'toan_nang') fail('Chỉ Triệu Hồi Sư mới gọi được linh thú.');
    if (!G.skillLevel(p, 'th5')) fail('Hãy học kỹ năng "Triệu Hồi Linh Thú" trước.');
    p.summons = p.summons || { enabled: false, states: {} };
    p.summons.units = p.summons.units || {};
    p.summons.enabled = !p.summons.enabled;
    const cid = G.summonChoice(p), clv = G.summonUnitLv(p, cid);
    ev.push({ t: 'msg', text: p.summons.enabled ? `Đã gọi ${G.SUMMONS[cid].name} (cấp ${clv}).` : 'Đã thu hồi linh thú.', color: '#8be9ff' });
  },

  // Chọn linh thú sẽ gọi ra (mỗi lần chỉ 1 con); đang gọi thì đổi con ngay
  summon_pick(p, a, ev) {
    if (p.school !== 'trieu_hoi_su' && p.school !== 'tu_linh_thuat_su' && p.school !== 'toan_nang') fail('Chỉ Triệu Hồi Sư mới gọi được linh thú.');
    if (!G.SUMMONS[a.id]) fail('Không có linh thú này.');
    p.summons = p.summons || { enabled: false, states: {} };
    p.summons.units = p.summons.units || {};
    p.summons.choice = a.id;
    const lv = G.summonUnitLv(p, a.id);
    ev.push({ t: 'msg', text: p.summons.enabled ? `Đã đổi linh thú: ${G.SUMMONS[a.id].name} (cấp ${lv}) theo bạn.` : `Đã chọn ${G.SUMMONS[a.id].name} (cấp ${lv}). Dùng kỹ năng Triệu Hồi Linh Thú để gọi.`, color: '#8be9ff' });
  },

  shadow_toggle(p, a, ev) {
    if (p.school !== 'tu_linh_thuat_su' && !(p.school === 'trieu_hoi_su' && p.advancement?.unlocked?.tu_linh_thuat_su && p.formActive && p.formChoice === 'evolution')) fail('Chỉ Tử Linh Thuật Sư đang biến hình mới điều khiển được bóng ma.');
    p.shadows = p.shadows || { roster: [], active: [], enabled: false, nextId: 1 };
    if (!p.shadows.enabled) {
      p.shadows.enabled = true;
      if (!p.shadows.active.length) p.shadows.active = p.shadows.roster.slice(0, G.SHADOW_PARTY).map(x => x.uid);
      ev.push({ t: 'msg', text: p.shadows.active.length ? `Đã gọi ${p.shadows.active.length} bóng ma.` : 'Chưa có bóng ma trong đội hình.', color: '#c6a7ff' });
    } else {
      p.shadows.enabled = false;
      ev.push({ t: 'msg', text: 'Đã giải trừ bóng ma. Bộ sưu tập vẫn được lưu.', color: '#c6a7ff' });
    }
  },

  shadow_party(p, a, ev) {
    if (p.school !== 'tu_linh_thuat_su' && !(p.school === 'trieu_hoi_su' && p.advancement?.unlocked?.tu_linh_thuat_su && p.formChoice === 'evolution')) fail('Chỉ Tử Linh Thuật Sư mới quản lý được bóng ma.');
    const uid = Number(a.uid);
    const soul = p.shadows?.roster?.find(x => x.uid === uid);
    if (!soul) fail('Không tìm thấy bóng ma này.');
    const i = p.shadows.active.indexOf(uid);
    if (i >= 0) p.shadows.active.splice(i, 1);
    else {
      if (p.shadows.active.length >= G.SHADOW_PARTY) fail(`Đội đã đủ ${G.SHADOW_PARTY} bóng. Hãy bỏ chọn một bóng trước.`);
      p.shadows.active.push(uid);
    }
    ev.push({ t: 'msg', text: i >= 0 ? 'Đã đưa bóng ma về bộ sưu tập.' : 'Đã thêm bóng ma vào đội hình.', color: '#c6a7ff' });
  },

  shadow_release(p, a, ev) {
    if (p.school !== 'tu_linh_thuat_su' && !(p.school === 'trieu_hoi_su' && p.advancement?.unlocked?.tu_linh_thuat_su && p.formChoice === 'evolution')) fail('Chỉ Tử Linh Thuật Sư mới giải phóng được bóng ma.');
    const uid = Number(a.uid);
    const i = p.shadows?.roster?.findIndex(x => x.uid === uid) ?? -1;
    if (i < 0) fail('Không tìm thấy bóng ma này.');
    p.shadows.roster.splice(i, 1);
    p.shadows.active = p.shadows.active.filter(x => x !== uid);
    p.shadows.fullNotice = false;
    ev.push({ t: 'msg', text: 'Đã giải phóng bóng ma. Có thể thu phục bóng mới.', color: '#c6a7ff' });
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
    fail('Hoàn thành nhiệm vụ NPC ẩn và sử dụng Sách Biến Hình tương ứng.');
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
      // Thú đồng hành: mã chỉ toàn thú đã có → báo lỗi và trả lại lượt (không mất mã)
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
        const petStats = G.petStats(p);
        p.pets[id] = { hp: petStats.maxHp, mp: petStats.maxMp, sta: petStats.maxSta };
        p.mounts.skills[id] = p.mounts.skill || 'bite';
        p.mounts.active = p.mounts.summoned[0] || null;
        ev.push({ t: 'mount_new', id });
        ev.push({ t: 'msg', text: `[Hệ thống] Nhận thú triệu hồi: ${G.MOUNTS[id].icon} ${G.MOUNTS[id].name}! Mở Menu → Thú triệu hồi để gọi thú.`, color: '#ffc94a' });
      }
    } catch (e) {
      // Không phát được quà (ví dụ túi đầy) thì trả lại lượt cho mã
      await codes.release(userId, key);
      throw e;
    }
  },
};

module.exports = actions;
