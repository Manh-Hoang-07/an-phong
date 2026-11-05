'use strict';
/* Luật chơi phía server · Nhiệm vụ hằng ngày / hằng tuần. */
const G = require('../../shared');
const { countItem } = require('./inventory');

// Tạo 3 nhiệm vụ ngày theo các cổng người chơi đã vào được
function ensureWeekly(p) {
  const wk = G.weekKey();
  if (!p.weekly || p.weekly.week !== wk) {
    p.weekly = { week: wk, kills: 0, bosses: 0, claimedKills: false, claimedBosses: false };
  }
}

function ensureDaily(p) {
  ensureWeekly(p);
  const today = G.dailyDate();
  // Danh sách rỗng (tạo lúc chưa mở cổng nào) thì tạo lại khi đã có bản đồ
  if (p.daily && p.daily.date === today && p.daily.list && p.daily.list.length) return;
  const maps = ['rung', 'hang', 'd_lay_muc', 'lang_chai', 'cc_hac_nguyet', 'tp_chim_t', 'tp_chim_c',
    'hem_nui', 'lo_ren_bang', 'dinh_nui', 'kho_bac',
    'vac_da', 'cong_khai_hoan', 'quang_truong', 'thu_vien', 'phong_luu_tru', 'dinh_thap',
    'cau_dan', 'sanh_cho', 'dinh_cong_vh', 'tam_diem', 'cong_ss']
    .filter(id => { const req = G.MAPS[id].require; return !req || G.questDone(p, req); });
  const list = [];
  if (maps.length) {
    const mons = [...new Set(maps.flatMap(id => Object.values(G.MAPS[id].spawns)))]
      .filter(id => !G.MONSTERS[id].boss && !G.MONSTERS[id].passive)
      .sort((a, b) => Math.abs(G.MONSTERS[a].level - p.level) - Math.abs(G.MONSTERS[b].level - p.level));
    const pick = mons.slice(0, 3).sort(() => Math.random() - 0.5);
    list.push({ type: 'kill', target: pick[0], need: 15 + Math.floor(Math.random() * 3) * 5, have: 0, claimed: false });
    list.push({ type: 'collect', target: 'loi_nang_luong', need: 6 + Math.floor(Math.random() * 3) * 2, have: 0, claimed: false });
    const bossMaps = [
      { map: 'hang', boss: 'thach_quy', minLv: 10 },
      { map: 'cc_hac_nguyet', boss: 'lam_suong', minLv: 15 },
      { map: 'tp_chim_c', boss: 'thuy_xa_vuong', minLv: 18 },
      { map: 'dinh_nui', boss: 'bang_long', minLv: 28 },
      { map: 'kho_bac', boss: 'lam_suong_2', minLv: 28 },
      { map: 'dinh_thap', boss: 'nguoi_gac_luu_tru', minLv: 38 },
      { map: 'dinh_cong_vh', boss: 'kieu_deo_mat_na', minLv: 45 },
      { map: 'tam_diem', boss: 'thuc_the_bkc', minLv: 50 },
    ];
    const availBosses = bossMaps.filter(b => maps.includes(b.map) && p.level >= b.minLv);
    if (availBosses.length) {
      const b = availBosses[Math.floor(Math.random() * availBosses.length)];
      list.push({ type: 'boss', target: b.boss, need: 1, have: 0, claimed: false });
    } else list.push({ type: 'kill', target: pick[1] || pick[0], need: 20 + Math.floor(Math.random() * 3) * 5, have: 0, claimed: false });
  }
  p.daily = { date: today, list, bonus: false };
}

function dailyDone(p, d) {
  if (d.type === 'collect') return countItem(p, d.target) >= d.need;
  return d.have >= d.need;
}

module.exports = { ensureWeekly, ensureDaily, dailyDone };
