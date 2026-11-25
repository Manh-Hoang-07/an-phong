/*
 * Chỗ đứng của "Người dẫn khu" (NPC chọn khu): mỗi bản đồ 2 người, bản đồ rộng (từ 156 cột) 3 người.
 *
 * CLIENT VÀ SERVER DÙNG CHUNG hàm này để ra CÙNG một kết quả:
 *   - client (public/js/scene/map.js buildZoneNpcs) dựng NPC tại các chỗ này;
 *   - server (server/realtime/mapgrid.js) coi các chỗ này như cổng: quái không đi / không đuổi tới sát (cách 160px, xem mobs.js),
 *     nên đứng chọn khu không bị quái đánh.
 * Sửa thuật toán ở đây là sửa cả hai bên cùng lúc.
 *
 * g: { cols, rows, cell(r, c), isStand(r, c), used: [x của cổng và NPC khác], spawnX: [x các chỗ quái xuất hiện], T }
 * Tránh chỗ quái xuất hiện (một con quái bị kẹt giữa vùng tránh sẽ đứng yên ngay cạnh NPC): ưu tiên cách 200px, nếu không có chỗ thì hạ còn 120px.
 * Trả về [{ c, r, x, y }] (x, y: tọa độ thế giới, chân NPC; y là mặt đất).
 */
(function (G) {
  'use strict';

  const WIDE_COLS = 156;
  const MIN_GAP = 120;   // cách cổng / NPC khác ít nhất chừng này (px)

  function zoneNpcSpots(g) {
    const { cols, rows, cell, isStand, T } = g;
    // Đầu map và cuối map; map rộng thêm một người ở giữa
    const marks = cols >= WIDE_COLS ? [0.06, 0.5, 0.94] : [0.06, 0.94];
    // có chỗ đứng (đất / bục) với 3 ô phía trên thoáng, không nước / thác
    const free = (r, c) => {
      if (!isStand(r, c)) return false;
      for (let k = 1; k <= 3; k++) { const ch = cell(r - k, c); if (ch === '#' || ch === '%' || ch === '"') return false; }
      return true;
    };
    const floorRow = (c) => { for (let r = rows - 1; r >= 3; r--) if (free(r, c)) return r; return -1; };
    const used = g.used.slice();
    const spawnX = g.spawnX || [];
    const out = [];
    for (const f of marks) {
      const c0 = Math.round(cols * f);
      const edge = f !== 0.5;
      // Người ở đầu / cuối map chỉ tìm trong 22% bề rộng gần mép (không để trôi vào giữa map); người giữa tìm rộng như cũ
      const reach = edge ? Math.max(12, Math.round(cols * 0.22)) : 60;
      // Thử lần lượt từ chặt tới lỏng: (cách quái xuất hiện, đất bằng mỗi bên, cách cổng / NPC khác)
      const tiers = [[200, 2, MIN_GAP], [120, 2, MIN_GAP], [0, 2, MIN_GAP], [0, 1, 80], [0, 0, 56]];
      let done = false;
      for (const [spawnGap, flat, minGap] of tiers) {
        for (let d = 0; d < reach && !done; d++) {
          for (const c of d ? (edge && f < 0.5 ? [c0 + d] : edge ? [c0 - d] : [c0 - d, c0 + d]) : [c0]) {
            if (c < 5 || c > cols - 6) continue;
            const r = floorRow(c);
            if (r < 0) continue;
            // đất bằng các ô liền kề cùng độ cao
            let ok = true;
            for (let k = 1; k <= flat && ok; k++) if (floorRow(c - k) !== r || floorRow(c + k) !== r) ok = false;
            if (!ok) continue;
            const x = c * T + T / 2;
            if (used.some(u => Math.abs(u - x) < minGap)) continue;
            if (spawnX.some(u => Math.abs(u - x) < spawnGap)) continue;
            used.push(x);
            out.push({ c, r, x, y: r * T });
            done = true;
            break;
          }
        }
        if (done) break;
      }
    }
    return out;
  }

  G.zoneNpcSpots = zoneNpcSpots;
})(typeof module === 'object' && module.exports ? require('../core') : self.GameData);
