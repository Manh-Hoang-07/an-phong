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
    const marks = cols >= WIDE_COLS ? [0.2, 0.5, 0.8] : [0.28, 0.72];
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
      let done = false;
      for (const spawnGap of [200, 120, 0]) {
        for (let d = 0; d < 60 && !done; d++) {
          for (const c of d ? [c0 - d, c0 + d] : [c0]) {
            if (c < 5 || c > cols - 6) continue;
            const r = floorRow(c);
            if (r < 0) continue;
            // đất bằng 5 ô liền nhau cùng độ cao
            if (![-2, -1, 1, 2].every(k => floorRow(c + k) === r)) continue;
            const x = c * T + T / 2;
            if (used.some(u => Math.abs(u - x) < MIN_GAP)) continue;
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
