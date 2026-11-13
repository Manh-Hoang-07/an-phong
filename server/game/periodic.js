'use strict';
/*
 * Luật chơi phía server · Nhiệm vụ hằng ngày / hằng tuần, riêng từng làng.
 *
 * Mỗi Tân Đô (làng) có bảng riêng: p.dailyByMap[làng] và p.weeklyByMap[làng], sinh theo quái của vùng thuộc làng đó
 * (bản đồ có `home` = làng). Thưởng nhân hệ số theo làng (G.villageRewardMult). Nhận thưởng phải đứng ở bảng của làng đó.
 *   - Nhiệm vụ ngày: tiến độ tính cho mọi bảng có mục tiêu khớp con quái vừa hạ (mục tiêu mỗi bảng thuộc vùng riêng).
 *   - Nhiệm vụ tuần: chỉ tính cho bảng của làng nơi đang săn, để 7 bảng không cùng nhận thưởng cho cùng một lượt hạ quái.
 */
const G = require('../../shared');
const { countItem } = require('./inventory');

const BOSS_MAPS = [
  { map: 'hang', boss: 'thach_quy', minLv: 10 },
  { map: 'cc_hac_nguyet', boss: 'lam_suong', minLv: 15 },
  { map: 'tp_chim_c', boss: 'thuy_xa_vuong', minLv: 18 },
  { map: 'dinh_nui', boss: 'bang_long', minLv: 28 },
  { map: 'kho_bac', boss: 'lam_suong_2', minLv: 28 },
  { map: 'dinh_thap', boss: 'nguoi_gac_luu_tru', minLv: 38 },
  { map: 'dinh_cong_vh', boss: 'kieu_deo_mat_na', minLv: 45 },
  { map: 'tam_diem', boss: 'thuc_the_bkc', minLv: 50 },
];

// Bản đồ săn của vùng (đã mở với người chơi này) thuộc làng v
function regionMaps(p, v) {
  return Object.keys(G.MAPS).filter((id) => {
    const m = G.MAPS[id];
    if (m.village || m.home !== v || !Object.keys(m.spawns || {}).length) return false;
    return !m.require || G.questDone(p, m.require);
  });
}

function ensureWeekly(p, v) {
  const wk = G.weekKey();
  const by = p.weeklyByMap || (p.weeklyByMap = {});
  if (!by[v] || by[v].week !== wk) by[v] = { week: wk, kills: 0, bosses: 0, claimedKills: false, claimedBosses: false };
  return by[v];
}

// Bảng ngày của làng v (tạo nếu chưa có hoặc đã sang ngày mới)
function ensureDaily(p, v) {
  ensureWeekly(p, v);
  const by = p.dailyByMap || (p.dailyByMap = {});
  const today = G.dailyDate();
  const cur = by[v];
  // Danh sách rỗng (tạo lúc chưa mở bản đồ nào của vùng) thì tạo lại khi đã có bản đồ
  if (cur && cur.date === today && cur.list && cur.list.length) return cur;
  const maps = regionMaps(p, v);
  const list = [];
  const mons = [...new Set(maps.flatMap(id => Object.values(G.MAPS[id].spawns)))]
    .filter(id => G.MONSTERS[id] && !G.MONSTERS[id].boss && !G.MONSTERS[id].passive && G.gradeOf(G.MONSTERS[id]) === 'normal')   // tinh anh / thủ lĩnh hiếm: không giao làm nhiệm vụ ngày
    .sort((a, b) => Math.abs(G.MONSTERS[a].level - p.level) - Math.abs(G.MONSTERS[b].level - p.level));
  if (mons.length) {
    const pick = mons.slice(0, 3).sort(() => Math.random() - 0.5);
    list.push({ type: 'kill', target: pick[0], need: 15 + Math.floor(Math.random() * 3) * 5, have: 0, claimed: false });
    list.push({ type: 'collect', target: 'loi_nang_luong', need: 6 + Math.floor(Math.random() * 3) * 2, have: 0, claimed: false });
    const availBosses = BOSS_MAPS.filter(b => maps.includes(b.map) && p.level >= b.minLv);
    if (availBosses.length) {
      const b = availBosses[Math.floor(Math.random() * availBosses.length)];
      list.push({ type: 'boss', target: b.boss, need: 1, have: 0, claimed: false });
    } else list.push({ type: 'kill', target: pick[1] || pick[0], need: 20 + Math.floor(Math.random() * 3) * 5, have: 0, claimed: false });
  }
  return (by[v] = { date: today, list, bonus: false });
}

// Mọi làng người chơi đã tới đều có bảng của ngày hôm nay
function ensureBoards(p) {
  for (const v of p.villages || []) if (G.MAPS[v] && G.MAPS[v].village) ensureDaily(p, v);
}

function dailyDone(p, d) {
  if (d.type === 'collect') return countItem(p, d.target) >= d.need;
  return d.have >= d.need;
}

module.exports = { ensureWeekly, ensureDaily, ensureBoards, dailyDone, regionMaps };
