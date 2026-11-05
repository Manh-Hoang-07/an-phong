'use strict';
/* UI · Bảng nhiệm vụ hằng ngày / hằng tuần. */
(() => {
  const { G, $, esc, fmt, dailyLines, resetIn } = UI._;

  // ------------------------------------------------------------ Nhiệm vụ hằng ngày

  function panelDaily() {
    const p = App.player;
    const lines = dailyLines(p);
    if (!lines.length) return ['Bảng nhiệm vụ', '<p>Chưa có nhiệm vụ cho bạn. Hãy hoàn thành nhiệm vụ <b>Cổng đỏ</b> của Hội trưởng Khải để được vào cổng.</p>'];
    const r = G.dailyReward(p.level);
    let html = `<p class="muted" style="margin-top:0">Mỗi ngày 3 nhiệm vụ mới. Làm mới sau <b>${resetIn()}</b>.</p><div class="list">`;
    for (const l of lines) {
      const mul = l.x.type === 'boss' ? 2 : 1;
      const btn = l.x.claimed ? '<span class="okc">✓ Đã nhận</span>'
        : `<button class="btn small ${l.done ? 'primary' : ''}" data-act="daily_claim" data-i="${l.i}" ${l.done ? '' : 'disabled'}>Nhận thưởng</button>`;
      html += `<div class="li"><div class="ic">${l.icon}</div><div class="main"><b>${esc(l.text)}</b>
        <small>Tiến độ: <b class="${l.done ? 'okc' : ''}">${l.have}/${l.x.need}</b>${l.x.type === 'collect' ? ' · rơi từ quái trong cổng' : ''}</small>
        <small class="gold">Thưởng: ${fmt(r.exp * mul)} kinh nghiệm, ${fmt(r.gold * mul)} xu, ${r.stones * mul} đá cường hóa</small></div>${btn}</div>`;
    }
    html += '</div>';
    const all = lines.every(l => l.x.claimed);
    const b = G.DAILY_BONUS;
    html += `<div class="detail" style="margin-top:10px"><b>🎁 Thưởng hoàn thành cả 3:</b> ${b.stones} đá cường hóa${b.items.map(([id, n]) => ', ' + G.ITEMS[id].name + (n > 1 ? ' ×' + n : '')).join('')}
      <div class="row" style="margin-top:8px">${p.daily.bonus ? '<span class="okc">✓ Đã nhận hôm nay</span>'
        : `<button class="btn ${all ? 'primary' : ''}" data-act="daily_bonus" ${all ? '' : 'disabled'}>Nhận thưởng thêm</button>`}</div></div>`;
    if (p.weekly) {
      const w = p.weekly, wr = G.weeklyReward(p.level);
      const rows = [
        { kind: 'kills', label: `Hạ ${G.WEEKLY_KILLS} quái`, have: w.kills, need: G.WEEKLY_KILLS, claimed: w.claimedKills,
          reward: `${fmt(wr.kills.exp)} kinh nghiệm, ${fmt(wr.kills.gold)} xu, ${wr.kills.stones} đá cường hóa` },
        { kind: 'bosses', label: `Hạ ${G.WEEKLY_BOSSES} trùm`, have: w.bosses, need: G.WEEKLY_BOSSES, claimed: w.claimedBosses,
          reward: `${fmt(wr.bosses.exp)} kinh nghiệm, ${fmt(wr.bosses.gold)} xu, ${wr.bosses.stones} đá cường hóa cao, 1 sách kỹ năng` },
      ];
      html += `<hr style="border-color:#333"><div class="muted">Nhiệm vụ tuần · ${esc(w.week)} · làm mới vào thứ Hai</div><div class="list">`;
      for (const l of rows) {
        const done = l.have >= l.need;
        html += `<div class="li"><div class="ic">${l.kind === 'bosses' ? '👑' : '⚔️'}</div><div class="main"><b>${esc(l.label)}</b>
          <small>Tiến độ: <b class="${done ? 'okc' : ''}">${Math.min(l.have, l.need)}/${l.need}</b></small>
          <small class="gold">Thưởng: ${l.reward}</small></div>` +
          (l.claimed ? '<span class="okc">✓ Đã nhận</span>'
            : `<button class="btn small ${done ? 'primary' : ''}" data-act="weekly_claim" data-kind="${l.kind}" ${done ? '' : 'disabled'}>Nhận</button>`) + '</div>';
      }
      html += '</div>';
    }
    return ['Bảng nhiệm vụ', html];
  }

  Object.assign(UI._, { panelDaily });
  Object.assign(UI._.PANELS, { daily: panelDaily });
})();
