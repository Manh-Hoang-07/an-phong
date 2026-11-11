'use strict';
/* Icon vật phẩm vẽ bằng code (SVG, nét theo mọi cỡ). Mỗi món có hình RIÊNG:
 *   - trang bị: dáng theo ô / loại vũ khí, thêm biến thể dáng theo thứ tự cấp trong cùng bộ (4 dáng mỗi loại),
 *     màu theo bộ (set), tô chuyển sắc + ánh sáng cho có khối
 *   - thuốc, đá, sách, vật phẩm nhiệm vụ: bảng hình riêng theo mã (ICONS bên dưới)
 * Dùng: ItemArt.html(id, cls) → thẻ <img> cho giao diện; ItemArt.url(id) → data URI (dùng cho texture Phaser).
 * Món lạ chưa khai báo → hộp quà đổi màu theo mã (vẫn khác nhau). Kiểm tra trùng: ItemArt.audit(). */
const ItemArt = (() => {
  const OUT = '#17121c';

  // [màu nền, màu phụ nhấn] theo bộ trang bị (G.setOfItem(d).id)
  const SETS = {
    0: ['#9aa3b5', '#d8b45a'], 1: ['#8f9bb0', '#d6b25a'], 2: ['#a98258', '#e8a84c'], 3: ['#6fc6f0', '#eafaff'],
    4: ['#a48ad8', '#f2d98a'], 5: ['#5d63d6', '#dfe2ff'], 6: ['#ef7a3c', '#ffd47a'], 7: ['#3fc9a0', '#d0ffeb'],
    8: ['#b45cf0', '#ffd6ff'], 9: ['#ee6aa8', '#ffe2f2'], 10: ['#f2e6a0', '#ffc83a'],
  };

  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  const isHex = (c) => /^#[0-9a-f]{6}$/i.test(c);
  function mix(hex, amt) {   // amt > 0: sáng hơn (pha trắng), < 0: tối hơn (pha đen)
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, t = amt > 0 ? 255 : 0, a = Math.abs(amt);
    return '#' + [r, g, b].map(v => clamp(v + (t - v) * a).toString(16).padStart(2, '0')).join('');
  }

  // Tô chuyển sắc (sáng trên, tối dưới): mỗi màu hex một gradient, gom vào <defs> của icon đang dựng
  let DEFS = [], GIDS = {};
  const fillOf = (col) => {
    if (!isHex(col)) return col;
    const id = 'q' + col.slice(1);
    if (!GIDS[id]) { GIDS[id] = 1; DEFS.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${mix(col, 0.34)}"/><stop offset="0.5" stop-color="${col}"/><stop offset="1" stop-color="${mix(col, -0.3)}"/></linearGradient>`); }
    return `url(#${id})`;
  };
  const path = (d, fill, sw = 2) => `<path d="${d}" fill="${fillOf(fill)}" stroke="${OUT}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const rect = (x, y, w, h, fill, r = 2, sw = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fillOf(fill)}" stroke="${OUT}" stroke-width="${sw}"/>`;
  const circ = (x, y, r, fill, sw = 2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fillOf(fill)}" stroke="${OUT}" stroke-width="${sw}"/>`;
  const line = (x1, y1, x2, y2, col, w = 2.5) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  const shine = (d, o = 0.5, w = 2) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`;
  const gem = (x, y, r, col) => circ(x, y, r, col, 1.6) + `<circle cx="${x - r * 0.32}" cy="${y - r * 0.32}" r="${r * 0.32}" fill="#fff" opacity="0.75"/>`;
  const wrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="128" height="128"><defs>${DEFS.join('')}</defs><ellipse cx="32" cy="60.5" rx="17" ry="2.6" fill="#000" opacity="0.28"/>${inner}</svg>`;
  // Quầng sáng mềm (gradient tròn mờ dần ra ngoài)
  const glow = (col, r = 24) => {
    const id = 'g' + col.replace(/[^0-9a-z]/gi, '');
    if (!GIDS[id]) { GIDS[id] = 1; DEFS.push(`<radialGradient id="${id}"><stop offset="0.35" stop-color="${col}" stop-opacity="0.55"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`); }
    return `<circle cx="32" cy="32" r="${r + 5}" fill="url(#${id})"/>`;
  };
  const rot = (inner, deg = 45) => `<g transform="rotate(${deg} 32 32)">${inner}</g>`;
  const tri = (x, y, w, h, col, sw = 1.4) => path(`M${x - w / 2} ${y} L${x} ${y - h} L${x + w / 2} ${y} Z`, col, sw);

  // ------------------------------------------------------------------ Vũ khí: 4 dáng mỗi loại (k = thứ tự trong bộ)
  const bowArc = (d, c, a, b) => `<path d="${d}" fill="none" stroke="${OUT}" stroke-width="6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c.base}" stroke-width="3.4" stroke-linecap="round"/>` + shine(d, 0.35, 1.2) + line(a[0], a[1], b[0], b[1], mix(c.light, 0.5), 1.3);
  const arrow = (c, x0, x1) => line(x0, 32, x1, 32, c.dark, 2.4) + path(`M${x1 + 6} 32 L${x1 - 1} 27.5 L${x1 - 1} 36.5 Z`, c.light, 1.6) + path(`M${x0} 32 L${x0 - 4} 28 H${x0 + 3}Z M${x0} 32 L${x0 - 4} 36 H${x0 + 3}Z`, c.acc, 1.1);
  const WEAPON = {
    kiem: (c, k) => {
      const blade = ['M32 3 L38 11 V37 H26 V11 Z', 'M32 2 L36 10 V38 H28 V10 Z', 'M29 3 Q43 12 39 38 H27 Q33 20 29 3 Z', 'M32 3 L42 14 V36 H22 V14 Z'][k];
      const guard = [rect(19, 37, 26, 5, c.acc, 2), path('M17 41 Q32 30 47 41 L42 44 Q32 38 22 44Z', c.acc), circ(32, 39.5, 8.5, c.acc), rect(15, 36, 34, 6, c.acc, 2) + gem(18, 39, 2, c.gem) + gem(46, 39, 2, c.gem)][k];
      return rot(path(blade, c.light) + (k === 2 ? shine('M31 8 Q38 20 36 34', 0.6) : line(32, 8, 32, 35, mix(c.light, 0.7), 1.6) + shine('M29.5 12 V33', 0.45, 1.2)) + guard + rect(29, 42, 6, 12, c.dark, 2) + `<path d="M30 45 H34 M30 48 H34 M30 51 H34" stroke="${c.acc}" stroke-width="1" opacity="0.7"/>` + circ(32, 57, 3.2, c.acc) + gem(32, 39.5, 2.2, c.gem));
    },
    cung: (c, k) => {
      const arcs = ['M18 6 Q60 32 18 58', 'M26 3 Q46 32 26 61', 'M20 6 Q8 14 16 22 Q50 32 16 42 Q8 50 20 58', 'M16 8 Q54 32 16 56'][k];
      const ends = [[18, 6, 18, 58], [26, 3, 26, 61], [20, 6, 20, 58], [16, 8, 16, 56]][k];
      return bowArc(arcs, c, [ends[0], ends[1]], [ends[2], ends[3]]) + (k === 3 ? bowArc('M22 14 Q46 32 22 50', { base: c.acc, light: c.light }, [22, 14], [22, 50]) : '') + arrow(c, 8, 44) + (k >= 2 ? gem(34, 32, 2.4, c.gem) : '');
    },
    truong: (c, k) => {
      const top = [circ(32, 11, 8, c.gem) + `<circle cx="29" cy="8" r="2.4" fill="#fff" opacity="0.75"/>`,
        path('M32 1 L41 12 L32 23 L23 12 Z', c.gem) + shine('M28 10 L31 5', 0.7, 1.4),
        path('M41 5 a11 11 0 1 0 0 18 a8 8 0 1 1 0-18z', c.acc),
        path('M32 1 C46 9 43 20 32 25 C21 20 18 9 32 1Z', c.gem) + path('M32 8 C37 12 36 17 32 19 C28 17 27 12 32 8Z', mix(c.gem, 0.55), 1)][k];
      return rot(rect(29.5, 14, 5, 44, c.dark, 2.4) + top + rect(26, 28, 12, 4, c.acc, 2) + (k % 2 ? rect(27, 36, 10, 3, c.acc, 1.5) : ''));
    },
    song_dao: (c, k) => {
      const blade = ['M32 6 L36 14 V34 H28 V14 Z', 'M33 4 Q47 18 36 36 L29 35 Q39 20 29 12Z', 'M32 3 L38 19 L32 33 L26 19Z', 'M32 2 L35 12 V36 H29 V12 Z'][k];
      const hilt = k === 2 ? `<circle cx="32" cy="45" r="6.5" fill="none" stroke="${OUT}" stroke-width="5"/><circle cx="32" cy="45" r="6.5" fill="none" stroke="${c.acc}" stroke-width="2.6"/>` + rect(30, 33, 4, 6, c.dark, 1.2, 1.4) : rect(24, 34, 16, 4, c.acc, 1.5) + rect(30, 38, 4, 12, c.dark, 1.5);
      const one = (col) => path(blade, col) + shine('M31 12 V30', 0.4, 1.1) + hilt;
      const ang = k === 3 ? 38 : 28;
      return rot(one(c.light), ang) + rot(one(mix(c.light, -0.1)), -ang);
    },
    chuy: (c, k) => {
      const head = [rect(16, 6, 32, 18, c.base, 3) + rect(16, 6, 32, 5, c.light, 2, 1.4) + rect(22, 12, 20, 4, c.acc, 1.5, 1.2),
        [0, 1, 2, 3, 4, 5].map(i => tri(32 + Math.cos(i * 1.05) * 12, 14 + Math.sin(i * 1.05) * 12, 6, 6, c.acc).replace('<path', `<path transform="rotate(${i * 60 + 90} ${32 + Math.cos(i * 1.05) * 12} ${14 + Math.sin(i * 1.05) * 12})"`)).join('') + circ(32, 14, 10, c.base, 2.4) + gem(32, 14, 3, c.gem),
        rect(8, 8, 18, 16, c.base, 3) + rect(38, 8, 18, 16, c.base, 3) + rect(26, 12, 12, 8, c.acc, 2),
        circ(32, 15, 13, c.base, 2.6) + `<ellipse cx="32" cy="15" rx="13" ry="4" fill="none" stroke="${c.acc}" stroke-width="2.4"/>` + shine('M24 9 Q32 4 40 9', 0.5)][k];
      return rot(rect(29.5, 20, 5, 38, c.dark, 2.2) + head + rect(28, 52, 8, 4, c.acc, 1.5, 1.4));
    },
    thanh_truong: (c, k) => {
      const top = [`<circle cx="32" cy="14" r="10" fill="none" stroke="${OUT}" stroke-width="6"/><circle cx="32" cy="14" r="10" fill="none" stroke="${c.acc}" stroke-width="3.4"/>` + line(32, 7, 32, 21, c.light, 2.6) + line(25, 14, 39, 14, c.light, 2.6),
        path('M32 4 Q20 2 10 10 Q20 12 28 14Z M32 4 Q44 2 54 10 Q44 12 36 14Z', c.acc, 1.6) + circ(32, 12, 7, c.gem),
        `<path d="M32 58 V14 Q32 2 44 4 Q54 8 50 20" fill="none" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/><path d="M32 58 V14 Q32 2 44 4 Q54 8 50 20" fill="none" stroke="${c.acc}" stroke-width="3.6" stroke-linecap="round"/>`,
        circ(32, 14, 8, c.gem) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<line x1="${32 + Math.cos(i * 0.785) * 10}" y1="${14 + Math.sin(i * 0.785) * 10}" x2="${32 + Math.cos(i * 0.785) * 15}" y2="${14 + Math.sin(i * 0.785) * 15}" stroke="${c.acc}" stroke-width="2.4" stroke-linecap="round"/>`).join('')][k];
      return rot((k === 2 ? '' : rect(29.5, 20, 5, 40, c.dark, 2.2)) + top + (k === 2 ? '' : ''));
    },
    linh_chau: (c, k) => {
      const orbc = circ(32, k === 1 ? 32 : 30, 17, c.gem, 2.4) + `<path d="M21 28 Q32 16 43 28 Q35 24 29 34 Q24 34 21 28Z" fill="#fff" opacity="0.4"/><circle cx="26" cy="22" r="3" fill="#fff" opacity="0.8"/>`;
      return glow(c.gem, 26) + [
        orbc + path('M20 50 H44 L40 56 H24 Z', c.acc, 2) + rect(26, 46, 12, 5, c.dark, 2),
        orbc + `<ellipse cx="32" cy="32" rx="26" ry="7" fill="none" stroke="${OUT}" stroke-width="5" transform="rotate(-22 32 32)"/><ellipse cx="32" cy="32" rx="26" ry="7" fill="none" stroke="${c.acc}" stroke-width="2.6" transform="rotate(-22 32 32)"/>`,
        orbc + [[26, 34], [38, 26], [34, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff"/>`).join('') + path('M22 52 H42 L38 58 H26 Z', c.dark, 2),
        orbc + path('M32 2 C42 9 40 16 32 13 C24 16 22 9 32 2Z', c.acc, 1.6) + path('M22 50 H42 L38 56 H26 Z', c.acc, 2)][k];
    },
    than_binh: (c, k) => {
      const grip = rect(29, 39, 6, 14, c.dark, 2) + circ(32, 56, 3.4, c.acc);
      return rot([
        path('M32 2 L38 10 V34 H26 V10 Z', c.light) + path('M26 22 Q12 20 10 8 Q20 12 26 18Z M38 22 Q52 20 54 8 Q44 12 38 18Z', c.acc, 1.8) + rect(20, 34, 24, 5, c.acc, 2) + gem(32, 36.5, 2.6, c.gem) + grip,
        rect(29.5, 14, 5, 44, c.dark, 2.2) + path('M32 2 L36 12 H28Z', c.light, 1.6) + path('M18 10 Q18 24 32 26 Q46 24 46 10 L42 10 Q42 20 32 22 Q22 20 22 10Z', c.light, 1.6) + path('M18 10 L16 3 L22 8Z M46 10 L48 3 L42 8Z', c.light, 1.4),
        rect(29.5, 20, 5, 38, c.dark, 2.2) + path('M32 2 L38 12 H26Z', c.light, 1.6) + path('M34 14 Q52 10 54 24 Q46 20 34 26Z', c.light, 1.8) + rect(27, 24, 10, 4, c.acc, 1.5),
        rect(29.5, 20, 5, 38, c.dark, 2.2) + circ(32, 14, 9, c.acc, 2.2) + gem(32, 14, 4, c.gem) + path('M22 8 L24 0 L28 5 L32 -1 L36 5 L40 0 L42 8Z', c.acc, 1.4)][k]);
    },
    tay: (c, k) => {
      const knuckles = [0, 1, 2, 3].map(i => circ(21 + i * 7.4, 25, 4.6, c.light, 1.8) + path(`M${18.4 + i * 7.4} 21 L${21 + i * 7.4} 14 L${23.6 + i * 7.4} 21Z`, c.acc, 1.4)).join('');
      return [
        rect(14, 26, 36, 22, c.base, 8, 2.4) + knuckles + rect(18, 46, 28, 9, c.dark, 3, 2) + gem(32, 38, 2.6, c.gem),
        rect(16, 30, 32, 20, c.base, 7, 2.4) + [0, 1, 2].map(i => path(`M${20 + i * 11} 30 Q${24 + i * 11} 8 ${28 + i * 11} 4 Q${28 + i * 11} 18 ${27 + i * 11} 30Z`, c.light, 1.8)).join('') + rect(18, 48, 28, 8, c.dark, 3, 2),
        path('M12 30 Q12 16 32 16 Q52 16 52 30 V42 Q52 52 42 52 H22 Q12 52 12 42Z', c.base) + rect(12, 40, 40, 12, c.dark, 4) + [0, 1, 2].map(i => line(20 + i * 12, 22, 20 + i * 12, 34, mix(c.base, -0.35), 2)).join('') + gem(32, 46, 3, c.gem) + shine('M18 24 Q32 14 46 24', 0.4),
        rect(14, 26, 36, 24, c.base, 8, 2.4) + [0, 1, 2, 3].map(i => line(14, 30 + i * 5, 50, 26 + i * 5, c.acc, 2.4)).join('') + rect(18, 48, 28, 8, c.dark, 3, 2) + circ(32, 22, 4, c.light, 1.6)][k];
    },
  };

  // ------------------------------------------------------------------ Giáp: 4 dáng mỗi ô
  const ARMOR = {
    mu: (c, k) => [
      path('M12 40 Q12 10 32 10 Q52 10 52 40 V50 H42 V42 H22 V50 H12 Z', c.base) + rect(20, 30, 24, 7, c.dark, 2) + line(32, 10, 32, 30, c.acc, 3) + shine('M20 16 Q32 8 44 16', 0.5, 2) + gem(32, 22, 2.6, c.gem),
      path('M14 24 Q4 20 6 4 Q16 6 20 18Z M50 24 Q60 20 58 4 Q48 6 44 18Z', c.light, 1.8) + path('M14 44 Q14 14 32 14 Q50 14 50 44 V52 H40 V44 H24 V52 H14 Z', c.base) + rect(20, 32, 24, 6, c.dark, 2) + line(32, 14, 32, 32, c.acc, 2.6),
      path('M10 52 Q8 14 32 8 Q56 14 54 52 L42 46 Q32 28 22 46Z', c.base) + `<ellipse cx="32" cy="34" rx="9" ry="10" fill="#1b1626"/>` + `<circle cx="28" cy="33" r="1.6" fill="${c.acc}"/><circle cx="36" cy="33" r="1.6" fill="${c.acc}"/>` + shine('M18 22 Q32 8 46 22', 0.4, 1.6),
      path('M12 42 Q12 18 32 18 Q52 18 52 42 V50 H42 V44 H22 V50 H12 Z', c.base) + rect(20, 34, 24, 6, c.dark, 2) + [18, 25, 32, 39, 46].map((x, i) => tri(x, 18, 6, i % 2 ? 7 : 11, c.acc, 1.4)).join('') + gem(32, 27, 2.6, c.gem)][k],
    ao: (c, k) => [
      path('M16 10 L26 6 Q32 13 38 6 L48 10 L58 24 L48 30 L46 28 V56 H18 V28 L16 30 L6 24 Z', c.base) + path('M26 6 Q32 13 38 6 L36 22 H28 Z', c.dark, 1.6) + line(32, 22, 32, 54, c.acc, 2.6) + rect(18, 40, 28, 4, c.acc, 1.4, 1.4) + gem(32, 32, 3, c.gem),
      path('M18 10 L26 8 L32 16 L38 8 L46 10 L50 54 H14Z', c.base) + line(22, 14, 42, 48, c.dark, 3) + line(42, 14, 22, 48, c.dark, 3) + rect(28, 28, 8, 8, c.acc, 1.5) + line(14, 50, 50, 50, c.acc, 2),
      path('M20 8 L32 14 L44 8 L52 30 L46 32 L48 58 H16 L18 32 L12 30 Z', c.base) + path('M30 14 L34 14 L36 58 H28Z', c.dark, 1.4) + rect(16, 36, 32, 5, c.acc, 2) + circ(32, 38.5, 3, c.gem, 1.4),
      path('M18 12 L26 8 Q32 14 38 8 L46 12 L46 56 H18Z', c.base) + circ(12, 18, 9, c.light, 2.2) + circ(52, 18, 9, c.light, 2.2) + circ(12, 18, 4, c.acc, 1.4) + circ(52, 18, 4, c.acc, 1.4) + line(32, 14, 32, 54, c.acc, 2.4) + gem(32, 32, 3.4, c.gem)][k],
    gang_tay: (c, k) => [
      path('M18 28 V14 Q18 10 22 10 Q26 10 26 14 V26 V8 Q26 4 30 4 Q34 4 34 8 V26 V10 Q34 6 38 6 Q42 6 42 10 V28 V16 Q42 12 46 12 Q50 12 50 16 V38 Q50 48 40 50 H28 Q18 48 18 38 Z', c.base) + rect(16, 48, 36, 10, c.dark, 3) + line(20, 53, 48, 53, c.acc, 2.2) + gem(34, 38, 2.8, c.gem),
      rect(14, 14, 36, 26, c.base, 7, 2.4) + [0, 1, 2].map(i => line(20 + i * 12, 16, 20 + i * 12, 38, mix(c.base, -0.35), 2.2)).join('') + rect(12, 38, 40, 18, c.dark, 4) + [0, 1, 2, 3].map(i => tri(18 + i * 9.4, 38, 6, 8, c.acc, 1.2)).join('') + gem(32, 47, 3, c.gem),
      path('M16 30 V18 Q16 14 20 14 Q24 14 24 18 V28 V12 Q24 8 28 8 Q32 8 32 12 V28 V14 Q32 10 36 10 Q40 10 40 14 V30 V20 Q40 16 44 16 Q48 16 48 20 V42 Q48 52 38 54 H26 Q16 52 16 42Z', c.base) + [0, 1, 2].map(i => line(16, 40 + i * 5, 48, 36 + i * 5, c.acc, 2.4)).join(''),
      path('M20 4 H44 L48 56 H16 Z', c.base) + [0, 1, 2].map(i => rect(16 + i * 0.5, 14 + i * 14, 32 - i, 6, c.dark, 2)).join('') + [0, 1, 2].map(i => gem(32, 17 + i * 14, 2, c.acc)).join('')][k],
    dai_lung: (c, k) => [
      rect(4, 24, 56, 16, c.base, 4) + rect(23, 20, 18, 24, c.acc, 4) + rect(28, 26, 8, 12, c.dark, 2) + gem(32, 32, 2.4, c.gem),
      rect(4, 26, 56, 12, c.base, 4) + path('M32 32 L16 18 L22 38 Z M32 32 L48 18 L42 38 Z', c.acc, 1.8) + circ(32, 32, 5, c.dark, 2) + path('M28 38 L22 58 L30 52 L32 58 L34 52 L42 58 L36 38Z', c.acc, 1.6),
      [0, 1, 2, 3, 4, 5, 6].map(i => circ(8 + i * 8, 32, 5, c.light, 1.8)).join('') + circ(32, 32, 10, c.acc, 2.2) + gem(32, 32, 4, c.gem),
      rect(4, 24, 56, 16, c.dark, 4) + [0, 1, 2, 3, 4, 5, 6].map(i => circ(9 + i * 7.7, 32, 2, c.acc, 1)).join('') + path('M32 18 L44 32 L32 46 L20 32Z', c.acc, 2) + gem(32, 32, 4, c.gem)][k],
    quan: (c, k) => [
      path('M16 6 H48 L52 58 H36 L32 28 L28 58 H12 Z', c.base) + rect(16, 6, 32, 8, c.dark, 2) + line(32, 14, 32, 28, c.acc, 2) + rect(14, 44, 12, 4, c.acc, 1.4, 1.2) + rect(38, 44, 12, 4, c.acc, 1.4, 1.2),
      path('M16 6 H48 L50 58 H36 L32 28 L28 58 H14 Z', c.base) + rect(16, 6, 32, 8, c.dark, 2) + circ(23, 34, 7, c.light, 2) + circ(41, 34, 7, c.light, 2) + gem(23, 34, 2.4, c.gem) + gem(41, 34, 2.4, c.gem) + rect(14, 52, 14, 6, c.dark, 2) + rect(36, 52, 14, 6, c.dark, 2),
      path('M14 8 H50 L58 54 H6 Z', c.base) + rect(14, 8, 36, 8, c.dark, 2) + [0, 1, 2, 3].map(i => line(14 + i * 12, 18, 10 + i * 14, 52, mix(c.base, -0.35), 2)).join('') + line(8, 50, 56, 50, c.acc, 2.4),
      path('M16 6 H48 L50 34 H36 L32 22 L28 34 H14 Z', c.base) + rect(16, 6, 32, 8, c.dark, 2) + line(14, 30, 50, 30, c.acc, 2.4) + gem(32, 10, 2, c.gem)][k],
    giay: (c, k) => [
      path('M20 8 H38 V32 L54 38 Q58 52 50 56 H16 Q10 56 10 48 Q10 42 20 40 Z', c.base) + rect(18, 6, 22, 8, c.dark, 2) + path('M10 50 H54 V56 H12 Z', c.dark, 1.8) + line(24, 20, 34, 20, c.acc, 2.2) + line(24, 26, 34, 26, c.acc, 2.2),
      path('M20 8 H38 V32 L52 38 L60 50 H16 Q10 56 10 48 Q10 42 20 40 Z', c.base) + [0, 1, 2].map(i => line(20, 16 + i * 8, 38, 16 + i * 8, c.dark, 2.4)).join('') + tri(56, 50, 8, 10, c.acc, 1.4).replace('<path', '<path transform="rotate(90 56 46)"') + gem(30, 44, 2.6, c.gem),
      path('M12 52 H54 Q58 52 56 46 L46 40 H20 Q12 42 12 52Z', c.base) + [0, 1, 2].map(i => line(22 + i * 9, 40, 20 + i * 9, 52, c.acc, 2.4)).join('') + path('M20 40 Q32 20 44 40', 'none', 2.4).replace(OUT, c.acc) + rect(10, 52, 46, 5, c.dark, 2),
      path('M18 4 H40 V32 L54 38 Q58 52 50 56 H16 Q10 56 10 48 Q10 42 18 40 Z', c.base) + path('M14 4 H44 V14 H14Z', c.light, 2) + line(18, 22, 38, 22, c.acc, 2.2) + path('M10 50 H54 V56 H12 Z', c.dark, 1.8)][k],
    nhan: (c, k) => [
      `<ellipse cx="32" cy="38" rx="17" ry="15" fill="none" stroke="${OUT}" stroke-width="9"/><ellipse cx="32" cy="38" rx="17" ry="15" fill="none" stroke="${c.acc}" stroke-width="5.4"/>` + path('M24 22 L32 12 L40 22 L32 30 Z', c.gem, 2) + `<path d="M28 20 L32 16 L33 20 Z" fill="#fff" opacity="0.8"/>`,
      `<ellipse cx="32" cy="40" rx="16" ry="13" fill="none" stroke="${OUT}" stroke-width="9"/><ellipse cx="32" cy="40" rx="16" ry="13" fill="none" stroke="${c.acc}" stroke-width="5.4"/>` + rect(20, 10, 24, 18, c.acc, 5) + rect(25, 14, 14, 10, c.dark, 3) + circ(32, 19, 3, c.gem, 1.4),
      `<ellipse cx="32" cy="40" rx="16" ry="13" fill="none" stroke="${OUT}" stroke-width="9"/><ellipse cx="32" cy="40" rx="16" ry="13" fill="none" stroke="${c.acc}" stroke-width="5.4"/>` + gem(24, 22, 6, c.gem) + gem(40, 22, 6, mix(c.gem, 0.3)),
      `<ellipse cx="32" cy="38" rx="16" ry="14" fill="none" stroke="${OUT}" stroke-width="9"/><ellipse cx="32" cy="38" rx="16" ry="14" fill="none" stroke="${c.acc}" stroke-width="5.4"/>` + [0, 1, 2, 3, 4].map(i => tri(16 + i * 8, 28 - (i % 2 === 0 ? 0 : 0), 7, 12 - Math.abs(i - 2) * 2, c.light, 1.4)).join('') + gem(32, 22, 3, c.gem)][k],
    day_chuyen: (c, k) => {
      const chain = `<path d="M10 8 Q10 40 32 44 Q54 40 54 8" fill="none" stroke="${OUT}" stroke-width="5"/><path d="M10 8 Q10 40 32 44 Q54 40 54 8" fill="none" stroke="${c.acc}" stroke-width="2.4" stroke-dasharray="4 2.4"/>`;
      return chain + [
        path('M32 44 L40 52 L32 62 L24 52 Z', c.gem, 2) + `<path d="M28 50 L32 46 L33 50Z" fill="#fff" opacity="0.8"/>`,
        circ(32, 54, 8, c.acc, 2.2) + circ(32, 54, 4, c.gem, 1.4),
        path('M26 44 Q24 56 32 62 Q40 56 38 44Z', c.light, 2) + shine('M29 48 Q28 54 31 58', 0.6, 1.4),
        path('M29 44 H35 V50 H41 V56 H35 V62 H29 V56 H23 V50 H29Z', c.acc, 2) + gem(32, 53, 2.2, c.gem)][k];
    },
    ngoc_boi: (c, k) => line(32, 2, 32, 12, c.acc, 2.6) + [
      circ(32, 30, 17, c.base, 2.4) + circ(32, 30, 6.5, '#1b1626', 2) + shine('M20 24 Q32 14 44 24', 0.5, 2.4) + circ(32, 30, 11.5, 'none', 1.4),
      rect(15, 14, 34, 34, c.base, 6, 2.4) + rect(26, 25, 12, 12, '#1b1626', 2) + shine('M19 22 Q22 18 28 18', 0.55, 2.2),
      circ(32, 22, 9, c.base, 2.2) + circ(32, 40, 12, c.base, 2.4) + shine('M24 36 Q26 30 32 30', 0.5, 2) + rect(28, 12, 8, 5, c.acc, 1.6),
      path('M32 8 C50 16 52 38 32 52 C12 38 14 16 32 8Z', c.base) + line(32, 14, 32, 48, mix(c.base, -0.4), 2) + line(32, 28, 42, 22, mix(c.base, -0.4), 1.6) + line(32, 34, 22, 28, mix(c.base, -0.4), 1.6)][k] +
      path('M28 47 L26 60 M32 47 V62 M36 47 L38 60', 'none', 2).replace(OUT, c.acc),
  };

  // ------------------------------------------------------------------ Thuốc, đá, sách, vật phẩm nhiệm vụ (theo mã)
  // size: 0 nhỏ … 4 thần thoại
  const bottle = (col, size, extra = '') => {
    const s = 0.78 + size * 0.06, k = (v) => 32 + (v - 32) * s;
    return (size >= 4 ? glow(col, 27) : '') + `<g>` + path(`M${k(26)} ${k(6)} H${k(38)} V${k(16)} Q${k(52)} ${k(26)} ${k(50)} ${k(46)} Q${k(48)} ${k(58)} ${k(32)} ${k(58)} Q${k(16)} ${k(58)} ${k(14)} ${k(46)} Q${k(12)} ${k(26)} ${k(26)} ${k(16)} Z`, '#d8f0ff', 2) +
      path(`M${k(17)} ${k(34)} H${k(47)} Q${k(48)} ${k(55)} ${k(32)} ${k(56)} Q${k(16)} ${k(55)} ${k(17)} ${k(34)} Z`, col, 1.4) +
      rect(k(25), k(2), (k(39) - k(25)), 8 * s, size >= 4 ? '#ffd24a' : size >= 2 ? '#c8a46a' : '#a07848', 2) + `<ellipse cx="${k(22)}" cy="${k(36)}" rx="${3 * s}" ry="${7 * s}" fill="#fff" opacity="0.5"/>` + extra + `</g>`;
  };
  const crystal = (col, big = 1) => `<g transform="translate(32 32) scale(${big}) translate(-32 -32)">` + path('M32 4 L48 22 L40 58 H24 L16 22 Z', col, 2) + path('M32 4 L40 22 L32 58 L24 22 Z', mix(col, 0.35), 1.4) + `<path d="M22 22 L32 8 L28 22Z" fill="#fff" opacity="0.5"/></g>`;
  const orb = (col, ring) => glow(col, 26) + circ(32, 32, 16, col, 2.4) + `<path d="M22 28 Q32 18 42 28 Q35 25 30 35 Q25 35 22 28Z" fill="#fff" opacity="0.45"/>` + (ring ? `<ellipse cx="32" cy="32" rx="24" ry="7" fill="none" stroke="${ring}" stroke-width="2.4" transform="rotate(-20 32 32)"/>` : '');
  const book = (cover, deco, trim = '#e8c86a') => path('M12 8 H46 Q52 8 52 14 V54 H18 Q12 54 12 48 Z', cover, 2.2) + path('M16 50 H52 V54 H18 Q14 54 14 50Z', '#f3ead2', 1.6) + rect(12, 8, 7, 46, mix(cover, -0.25), 2) + deco + line(24, 14, 46, 14, trim, 1.8);
  const key = (col) => `<g transform="rotate(-35 32 32)">` + circ(32, 14, 9, col, 2.4) + circ(32, 14, 3.4, '#1b1626', 1.4) + rect(29, 22, 6, 34, col, 2) + rect(35, 44, 8, 5, col, 1.6) + rect(35, 52, 6, 4, col, 1.6) + `</g>`;
  const scroll = (col, seal) => path('M14 10 H50 V50 H14 Z', col, 2) + rect(10, 6, 44, 8, mix(col, -0.2), 4) + rect(10, 46, 44, 8, mix(col, -0.2), 4) + [0, 1, 2].map(i => line(20, 22 + i * 8, 44, 22 + i * 8, mix(col, -0.35), 1.6)).join('') + (seal ? circ(44, 40, 5, seal, 1.6) : '');
  const card = (col, accent) => path('M16 6 H48 V58 H16 Z', col, 2.2) + rect(21, 11, 22, 18, accent, 2) + line(22, 36, 42, 36, mix(col, -0.4), 2) + line(22, 42, 38, 42, mix(col, -0.4), 2) + circ(32, 20, 5, mix(accent, 0.5), 1.4);
  const shard = (col, glowC) => (glowC ? glow(glowC, 24) : '') + path('M30 4 L46 20 L40 38 L50 54 L24 60 L12 40 L18 18 Z', col, 2.2) + path('M30 4 L36 26 L24 60 L12 40 Z', mix(col, 0.3), 1.2) + `<path d="M28 14 L34 20 L28 30Z" fill="#fff" opacity="0.5"/>`;
  const herb = (leaf, flower) => line(32, 58, 32, 26, '#4a7a3a', 3) + path('M32 44 Q16 44 12 30 Q28 30 32 44Z', leaf, 1.8) + path('M32 36 Q48 36 52 22 Q36 22 32 36Z', leaf, 1.8) + circ(32, 22, 8, flower, 2) + circ(32, 22, 3, '#ffe27a', 1.2);
  const mask = (col) => path('M10 18 Q32 8 54 18 Q54 46 32 58 Q10 46 10 18Z', col, 2.2) + path('M16 26 Q24 22 28 30 Q22 34 16 26Z M48 26 Q40 22 36 30 Q42 34 48 26Z', '#17121c', 1) + path('M30 40 Q32 44 34 40', 'none', 1.8);
  const core = (col, ring) => glow(col, 25) + path('M32 6 L50 20 V44 L32 58 L14 44 V20 Z', mix(col, -0.15), 2.4) + path('M32 14 L43 23 V41 L32 50 L21 41 V23 Z', col, 1.6) + circ(32, 32, 6, mix(col, 0.6), 1.2) + (ring || '');
  const crate = (col, band) => path('M8 22 L32 12 L56 22 V48 L32 58 L8 48 Z', col, 2.2) + path('M8 22 L32 32 L56 22', 'none', 2) + line(32, 32, 32, 58, mix(col, -0.35), 2) + rect(26, 28, 12, 8, band, 2);
  const heart = (col) => glow(col, 24) + path('M32 56 C6 38 8 14 22 14 C28 14 32 20 32 22 C32 20 36 14 42 14 C56 14 58 38 32 56Z', col, 2.4) + `<path d="M18 22 Q22 18 26 22" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="0.7"/>`;

  const ICONS = {
    // thuốc
    binh_mau_nho: () => bottle('#ef4a5a', 0), binh_mau_vua: () => bottle('#ef4a5a', 1), binh_mau_lon: () => bottle('#ef4a5a', 2),
    binh_mau_dac: () => bottle('#ff2e5e', 3, circ(32, 44, 4, '#ffffff', 1)), binh_mau_than_thoai: () => bottle('#ff9fb0', 4, `<path d="M32 36 l2.4 5 5.6.6-4.2 3.8 1.2 5.6-5-3-5 3 1.2-5.6-4.2-3.8 5.6-.6z" fill="#ffd24a"/>`),
    binh_nl_nho: () => bottle('#3f8cff', 0), binh_nl_vua: () => bottle('#3f8cff', 1), binh_nl_lon: () => bottle('#3f8cff', 2),
    binh_nl_dac: () => bottle('#2ec8ff', 3, circ(32, 44, 4, '#ffffff', 1)), binh_nl_than_thoai: () => bottle('#9fe8ff', 4, `<path d="M32 36 l2.4 5 5.6.6-4.2 3.8 1.2 5.6-5-3-5 3 1.2-5.6-4.2-3.8 5.6-.6z" fill="#ffd24a"/>`),
    thuoc_nhiem_do: () => bottle('#5fd06a', 2, path('M32 38 Q38 46 32 52 Q26 46 32 38Z', '#e0384a', 1.2)),
    // đá cường hóa, lõi
    da_cuong_hoa: () => crystal('#9fb0c8', 0.9), da_cuong_hoa_trung: () => crystal('#5aa0ff', 0.95), da_cuong_hoa_cao: () => crystal('#b068f0', 1),
    da_cuong_hoa_than_thoai: () => glow('#ffd24a', 26) + crystal('#ffc83a', 1.02),
    loi_tinh_van: () => orb('#b45cf0', '#ffd6ff'),
    // sách
    sach_ky_nang: () => book('#3b78d8', circ(32, 32, 6, '#f2d98a', 1.6)), sach_ky_nang_vo_dinh: () => book('#2a2236', `<ellipse cx="32" cy="32" rx="10" ry="6" fill="#e8c86a" stroke="${OUT}" stroke-width="1.4"/><circle cx="32" cy="32" r="3" fill="#2a2236"/>`),
    sach_tuyet_ky: () => book('#b8323c', `<path d="M32 22 l3 7 7.6.7-5.8 5 1.8 7.6-6.6-4-6.6 4 1.8-7.6-5.8-5 7.6-.7z" fill="#ffd24a" stroke="${OUT}" stroke-width="1.2"/>`),
    sach_bien_hinh_1: () => book('#3da05a', path('M24 36 Q32 20 40 36 Q32 32 24 36Z', '#f2d98a', 1.4)), sach_bien_hinh_2: () => book('#2a8d9e', path('M22 38 Q32 16 42 38 Q32 32 22 38Z', '#f2d98a', 1.4) + circ(32, 24, 3, '#ffffff', 1)),
    sach_tien_hoa_chuc_nghiep: () => book('#c8402a', path('M22 38 L32 18 L42 38 L32 33Z', '#ffd24a', 1.4)),
    bua_x2_kinh_nghiem: () => path('M18 4 H46 V60 H18 Z', '#f6e8a8', 2.2) + rect(18, 4, 28, 8, '#c8402a', 2) + `<text x="32" y="42" text-anchor="middle" font-size="20" font-weight="900" fill="#c8402a" font-family="Arial,sans-serif">x2</text>` + line(22, 50, 42, 50, '#c8402a', 2),
    // nhiệm vụ
    manh_vai_den: () => shard('#2c2a36') + `<path d="M36 26 a8 8 0 1 0 0 14 a6 6 0 1 1 0-14z" fill="#e8d56a"/>`,
    tinh_the_xanh: () => crystal('#4ac8ff', 0.95), loi_nang_luong: () => core('#ff9a3c'), manh_an_1: () => core('#e8384a', ''),
    the_bai_minh: () => card('#e8d8b0', '#e07a4a'), doan_kiem_ga: () => rot(path('M32 6 L38 14 L34 24 L38 32 L26 32 L30 22 L26 14Z', '#c8d0dc', 2) + rect(20, 32, 24, 5, '#c8a45a', 2) + rect(29, 37, 6, 14, '#6b4a2f', 2), 35),
    khan_binh_minh: () => path('M8 20 Q24 8 40 18 Q52 26 56 18 V34 Q50 42 38 34 Q24 26 10 38 Z', '#e8603a', 2.2) + path('M10 38 L6 54 L18 48 L16 40Z', '#c8402a', 1.8),
    thao_duoc_do: () => herb('#58b848', '#e0384a'), doc_to_dac: () => bottle('#3a2a50', 1, circ(32, 44, 5, '#7be05a', 1.4)),
    hang_that_lac: () => crate('#b98c5a', '#e0384a'), chia_khoa_kho: () => key('#d8b45a'), manh_ao_tho_san: () => path('M10 14 L30 8 L54 16 L50 36 L56 52 L28 56 L12 44 Z', '#7a8a58', 2.2) + path('M16 20 L48 22 M18 34 L44 36', 'none', 1.4).replace(OUT, '#4a5a38'),
    chia_khoa_long_giam: () => key('#8fa0b8'), thu_lam_suong: () => path('M8 14 H56 V50 H8 Z', '#efe4c8', 2.2) + path('M8 14 L32 36 L56 14', 'none', 2) + circ(32, 38, 6, '#8a4ad8', 1.8) + `<path d="M30 36 a3.4 3.4 0 1 0 0 5 a2.6 2.6 0 1 1 0-5z" fill="#f2e6a0"/>`,
    valy_thuy_xa: () => path('M32 6 C54 12 56 40 32 58 C8 40 10 12 32 6Z', '#2fb8a8', 2.2) + path('M32 12 Q44 26 32 52 Q20 26 32 12Z', '#7ff0d8', 1.2) + `<path d="M22 18 Q28 12 34 16" fill="none" stroke="#fff" stroke-width="2.2" opacity="0.6" stroke-linecap="round"/>`,
    loi_cong_xanh: () => core('#3fb8ff'), bang_tinh: () => shard('#9fe0ff', '#9fe0ff'), than_co: () => path('M10 44 L20 28 L32 36 L44 24 L54 42 L46 56 H18 Z', '#3a3438', 2.2) + path('M20 28 L32 36 L26 52 L14 46Z', '#554a50', 1.2) + `<circle cx="38" cy="46" r="3" fill="#ff7a3c"/><circle cx="24" cy="48" r="2" fill="#ffb347"/>`,
    trai_tim_bang_long: () => heart('#6fd0ff'), manh_loi_do_co_dai: () => shard('#c8303c', '#e8384a'),
    nhat_ky_nguoi_choi: () => book('#5a4630', line(26, 28, 42, 28, '#e8c86a', 1.6) + line(26, 34, 42, 34, '#e8c86a', 1.6) + circ(32, 44, 3.4, '#e8c86a', 1.2), '#c8a45a'),
    manh_luu_tru: () => path('M14 6 H42 L52 16 V58 H14 Z', '#efe4c8', 2.2) + path('M42 6 V16 H52', 'none', 1.8) + [0, 1, 2, 3].map(i => line(20, 24 + i * 8, 46, 24 + i * 8, '#8a7a58', 1.6)).join(''),
    tri_thuc_co_dai: () => glow('#b49aff', 25) + scroll('#e8d8f8', '#8a4ad8'),
    mat_na_trang_khuyet: () => mask('#e8e2d0') + `<path d="M42 12 a8 8 0 1 0 0 14 a6 6 0 1 1 0-14z" fill="#17121c" opacity="0.8"/>`,
    manh_khoi: () => shard('#ff7a3c', '#ff9a60'), manh_ngoc_mach: () => shard('#3fc9a0', '#6fe0c0'), manh_tinh_van: () => shard('#b45cf0', '#d6a0ff'),
    canh_buom_mong: () => glow('#ffb0e0', 24) + path('M32 34 C10 8 4 38 24 44 C14 52 28 62 32 46 C36 62 50 52 40 44 C60 38 54 8 32 34Z', '#ffb0e0', 2.2) + path('M32 34 C20 18 14 36 26 42 M32 34 C44 18 50 36 38 42', 'none', 1.4).replace(OUT, '#fff0fa') + line(32, 30, 32, 52, '#4a2a44', 2.4),
    manh_ky_uc: () => shard('#ffe08a', '#fff0b0'),
    manh_he_thong: () => glow('#4af0ff', 26) + path('M32 4 L54 18 V46 L32 60 L10 46 V18 Z', '#12363e', 2.4) + path('M32 14 L46 22 V42 L32 52 L18 42 V22 Z', '#4af0ff', 1.6) + path('M32 22 V42 M24 27 L40 37 M40 27 L24 37', 'none', 1.6).replace(OUT, '#0a2830'),
  };

  // ------------------------------------------------------------------ Dựng icon theo mã
  let rankCache = null;   // thứ tự (theo cấp) của từng món trong nhóm bộ|ô|loại → v = 0,1,2…
  function ranks() {
    if (rankCache) return rankCache;
    const G = window.GameData, groups = {}, out = {};
    for (const [id, d] of Object.entries(G.ITEMS)) {
      if (!d.slot) continue;
      const set = (G.setOfItem(d) || { id: 0 }).id, key = set + '|' + d.slot + '|' + (d.wtype || '');
      (groups[key] = groups[key] || []).push(id);
    }
    for (const k in groups) groups[k].sort((a, b) => (G.ITEMS[a].level || 0) - (G.ITEMS[b].level || 0) || (a < b ? -1 : 1)).forEach((id, i) => { out[id] = { v: i, n: groups[k].length, set: +k.split('|')[0] }; });
    return (rankCache = out);
  }
  function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

  function build(id) {
    DEFS = []; GIDS = {};
    const G = window.GameData, d = G.ITEMS[id];
    if (!d) return wrap(crate('#9a8a6a', '#c8a45a'));
    if (ICONS[id]) return wrap(ICONS[id]());
    if (d.kind === 'ult_book' && d.skill) {   // sách tuyệt kỹ: bìa theo màu class, sách dùng chung màu vàng nâu
      const sk = G.SKILLS[d.skill], col = sk && !sk.ultAny && G.SCHOOLS[sk.school] ? '#' + G.SCHOOLS[sk.school].color.toString(16).padStart(6, '0') : '#a8742c';
      return wrap(book(col, `<path d="M32 22 l3 7 7.6.7-5.8 5 1.8 7.6-6.6-4-6.6 4 1.8-7.6-5.8-5 7.6-.7z" fill="#ffd24a" stroke="${OUT}" stroke-width="1.2"/>`));
    }
    if (d.slot) {
      const r = ranks()[id] || { v: 0, set: 0 }, pal = SETS[r.set] || SETS[0], k = (r.v + r.set) % 4;   // dáng đổi theo cả thứ tự trong bộ lẫn bộ, nên các bộ khác nhau cũng khác dáng
      const c = { base: mix(pal[0], r.v * 0.06 - 0.03), dark: mix(pal[0], -0.45), light: mix(pal[0], 0.42), acc: pal[1], gem: mix(pal[1], -0.08), v: r.v };
      const halo = r.set >= 6 || r.v >= 2 ? glow(pal[1], 27) : '';
      if (d.slot === 'weapon') return wrap(halo + (WEAPON[d.wtype] || WEAPON.kiem)(c, k));
      if (ARMOR[d.slot]) return wrap(halo + ARMOR[d.slot](c, k));
    }
    // món chưa khai báo: hộp màu theo mã để vẫn phân biệt được
    const hue = hashStr(id) % 360;
    return wrap(crate(`hsl(${hue} 45% 52%)`, `hsl(${(hue + 40) % 360} 60% 70%)`));
  }

  const cache = {};
  const url = (id) => cache[id] || (cache[id] = 'data:image/svg+xml;utf8,' + encodeURIComponent(build(id)));
  const html = (id, cls = '') => `<img class="ico ${cls}" src="${url(id)}" alt="" draggable="false">`;
  // Kiểm tra: trả về các cặp món có hình giống hệt nhau
  function audit() {
    const seen = {}, dup = [];
    for (const id of Object.keys(window.GameData.ITEMS)) { const s = build(id); if (seen[s]) dup.push([seen[s], id]); else seen[s] = id; }
    return dup;
  }
  return { url, html, svg: build, audit };
})();
