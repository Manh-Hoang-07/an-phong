/*
 * Chuyển gói hình "Free Foes" (Robert Pinero, https://robertpinero.itch.io/free-animated-enemy-sprites) thành bộ hình quái của game
 * (public/assets/mobs/ff_<tên>/<hoạt ảnh>.png) và ghi cấu hình vào Sprites.MOBS (public/js/art/sprites.js, khối "Free Foes").
 *
 *   node server/tools/free-foes.js --dry     → chỉ in số đo, không ghi gì
 *   node server/tools/free-foes.js           → chuyển mọi bộ trong JOBS
 *   node server/tools/free-foes.js ff_crab   → chỉ bộ được nêu
 *
 * Nguồn: assets_raw/free-foes/Free Sprites/*.png (giải nén gói gốc vào đó). Mỗi sheet theo bố cục chuẩn RPG Maker SV: lưới 9 cột × 6 hàng,
 * mỗi chuyển động 3 khung, các chuyển động xếp THEO CỘT (đi, đứng, niệm, đỡ, bị đánh, né | đâm, chém, bắn, kỹ năng, phép, vật phẩm | chạy trốn,
 * thắng, hấp hối, bất thường, ngủ, chết). Khung nguồn quay mặt sang TRÁI (faceLeft).
 * Ghi công tác giả: "Robert Pinero" bắt buộc trong game (public/assets/CREDITS.txt và màn hình đăng nhập).
 *
 * Mỗi hoạt ảnh là một dải ngang các khung. Khung được cắt đối xứng quanh tâm ô nguồn (Phaser lật ngang quanh tâm khung nên tâm thân = tâm khung),
 * hộp cắt chung cho mọi hoạt ảnh của bộ. Hình giữ nguyên độ phân giải gốc (đánh dấu hd → lọc mượt khi thu nhỏ).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./lib-png');

const ROOT = path.join(__dirname, '..', '..');
const PACK = path.join(ROOT, 'assets_raw', 'free-foes', 'Free Sprites');
const OUT = path.join(ROOT, 'public', 'assets', 'mobs');
const SPRITES = path.join(ROOT, 'public', 'js', 'art', 'sprites.js');
const BEGIN = '    // ---- Free Foes (Robert Pinero; tool: server/tools/free-foes.js; xem public/assets/CREDITS.txt)';

// Khung nguồn (0–53, hàng trước cột sau) của từng hoạt ảnh + tốc độ khung/giây
const ANIMS = {
  idle: { frames: [9, 10, 11, 10], rate: 7 },
  run: { frames: [0, 1, 2, 1], rate: 12 },
  attack: { frames: [3, 4, 5], rate: 16 },
  hit: { frames: [36, 37, 38], rate: 12 },
  death: { frames: [24, 25, 26, 51, 52, 53], rate: 9 },
};
// h: chiều cao thân khi đứng trong game (px logic); rw, bw, bh: giữ số của bộ hình cũ để lối chơi không đổi
// recolor: đổi tông màu ('snow' trắng bạc, 'ice' xanh băng)
const JOBS = {
  ff_crab: { file: 'crab sheet.png', h: 34, rw: 32, bw: 40, bh: 28 },
  ff_wolf: { file: 'wolf_0001_brown.png', h: 44, rw: 64, bw: 44, bh: 36, recolor: 'snow' },
  ff_rat: { file: 'Rat_0004_dark.png', h: 30, rw: 70, bw: 40, bh: 28 },
  ff_sahuagin: { file: 'sahuagin sheet.png', h: 54, rw: 150, bw: 28, bh: 44 },
  ff_kobold: { file: 'kobold_0000_red.png', h: 42, rw: 34, bw: 26, bh: 36, recolor: 'ice' },
  ff_zombie: { file: 'Zombies/zombie battler/zombie1 battler.png', h: 58, rw: 34, bw: 30, bh: 50 },
  ff_skeleton: { file: 'skelleton sheet.png', h: 58, rw: 150, bw: 30, bh: 54 },
  ff_troll: { file: 'troll_0000_green.png', h: 62, rw: 66, bw: 40, bh: 53, recolor: 'ice' },
  ff_gnoll: { file: 'gnoll sheet.png', h: 58, rw: 64, bw: 32, bh: 52 },
  ff_slime: { file: 'slime waterB sheet.png', h: 28, rw: 156, bw: 40, bh: 28 },
};

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const only = args.filter(a => !a.startsWith('--'));

// Đổi tông màu giữ khối sáng tối: lấy độ sáng rồi tô lại theo bảng màu
function recolor(px, kind) {
  const ramp = {
    snow: (l) => [l * 0.85 + 38, l * 0.9 + 46, l * 0.98 + 62],     // lông trắng bạc ánh lam
    ice: (l, r, g, b) => [l * 0.6 + 14 + r * 0.04, l * 0.8 + 42 + g * 0.04, l * 1.0 + 70 + b * 0.04],   // da xanh băng
  }[kind];
  for (let i = 0; i < px.length; i += 4) {
    if (!px[i + 3]) continue;
    const r = px[i], g = px[i + 1], b = px[i + 2], l = 0.3 * r + 0.59 * g + 0.11 * b;
    const [nr, ng, nb] = ramp(l, r, g, b);
    px[i] = Math.max(0, Math.min(255, Math.round(nr))); px[i + 1] = Math.max(0, Math.min(255, Math.round(ng))); px[i + 2] = Math.max(0, Math.min(255, Math.round(nb)));
  }
}

function convert(id, job) {
  const im = decode(path.join(PACK, job.file));
  if (job.recolor) recolor(im.px, job.recolor);
  const cw = Math.floor(im.W / 9), ch = Math.floor(im.H / 6);       // ô nguồn (lấy phần nguyên)
  const rect = (fr) => ({ x: Math.round((fr % 9) * im.W / 9), y: Math.round(Math.floor(fr / 9) * im.H / 6) });
  const alphaAt = (fr, x, y) => { const r = rect(fr); return im.px[((r.y + y) * im.W + r.x + x) * 4 + 3]; };
  const box = (frames, thr) => {
    let x0 = cw, x1 = -1, y0 = ch, y1 = -1;
    for (const fr of frames) for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (alphaAt(fr, x, y) > thr) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return { x0, x1, y0, y1 };
  };
  const all = [...new Set(Object.values(ANIMS).flatMap(a => a.frames))];
  const full = box(all, 8), idle = box(ANIMS.idle.frames, 40);
  if (full.x1 < 0 || idle.x1 < 0) throw new Error(id + ': ảnh trống');
  const mid = Math.floor(cw / 2);
  const half = Math.min(mid, Math.max(mid - full.x0, full.x1 + 1 - mid) + 1);     // nửa bề rộng khung cắt (chừa 1 điểm ảnh)
  const top = Math.max(0, full.y0 - 1), bottom = Math.min(ch, full.y1 + 2);
  const fw = half * 2, fh = bottom - top;
  const cx = half, fy = idle.y1 + 1 - top;                                         // tâm thân; mép chân (đường mặt đất)
  const bodyW = idle.x1 - idle.x0 + 1, bodyH = idle.y1 - idle.y0 + 1;
  const s = Math.round(job.h / bodyH * 1000) / 1000;
  const sheets = {}, anims = {};
  let pixels = 0;
  for (const [name, a] of Object.entries(ANIMS)) {
    const W = fw * a.frames.length, px = Buffer.alloc(W * fh * 4);
    a.frames.forEach((fr, k) => {
      const r = rect(fr);
      for (let y = 0; y < fh; y++) {
        const sx = r.x + mid - half, sy = r.y + top + y;
        im.px.copy(px, (y * W + k * fw) * 4, (sy * im.W + sx) * 4, (sy * im.W + sx + fw) * 4);
      }
    });
    sheets[name] = { W, H: fh, px }; anims[name] = [a.frames.length, a.rate]; pixels += W * fh;
  }
  return { id, fw, fh, cx, fy, s, bodyW, bodyH, sheets, anims, pixels, job };
}

const ids = Object.keys(JOBS).filter(id => !only.length || only.includes(id));
const results = ids.map(id => convert(id, JOBS[id]));
console.table(results.map(r => ({ bộ: r.id, khung: `${r.fw}x${r.fh}`, cx: r.cx, fy: r.fy, 'thân gốc': `${r.bodyW}x${r.bodyH}`, s: r.s, 'cao trong game': Math.round(r.bodyH * r.s), 'ảnh giải nén MB': +(r.pixels * 4 / 1048576).toFixed(2) })));
if (dry) { console.log('(--dry: chưa ghi gì)'); process.exit(0); }

let disk = 0;
for (const r of results) {
  fs.mkdirSync(path.join(OUT, r.id), { recursive: true });
  for (const [name, sh] of Object.entries(r.sheets)) {
    const buf = encode(sh.W, sh.H, sh.px);
    disk += buf.length;
    fs.writeFileSync(path.join(OUT, r.id, name + '.png'), buf);
  }
}

// Ghi khối cấu hình vào sprites.js (thay khối cũ nếu đã có; đặt cuối bảng MOBS)
const bw = (r) => r.job.bw, bh = (r) => r.job.bh;
const entry = (r) => `    ${r.id}: { fw: ${r.fw}, fh: ${r.fh}, rw: ${r.job.rw}, cx: ${r.cx}, fy: ${r.fy}, hd: true, s: ${r.s}, bw: ${bw(r)}, bh: ${bh(r)}, faceLeft: true,\n`
  + `      anims: { ${Object.entries(r.anims).map(([k, v]) => `${k}: [${v[0]}, ${v[1]}]`).join(', ')} } },`;
const lines = fs.readFileSync(SPRITES, 'utf8').split('\n');
const start = lines.indexOf(BEGIN);
const existing = new Map();
if (start >= 0) {
  let i = start + 1;
  while (i < lines.length && !/^\s*\};\s*$/.test(lines[i])) { const m = /^\s+(ff_\w+): \{/.exec(lines[i]); if (m) existing.set(m[1], [lines[i], lines[i + 1]]); i += m ? 2 : 1; }
  lines.splice(start, i - start);
}
for (const r of results) existing.set(r.id, entry(r).split('\n'));
const block = [BEGIN, ...[...existing.keys()].sort().flatMap(k => existing.get(k))];
const cult = lines.findIndex(l => /^\s+cultist: \{/.test(l));
let end = cult; while (end < lines.length && !/^\s*\};\s*$/.test(lines[end])) end++;
lines.splice(end, 0, ...block);
fs.writeFileSync(SPRITES, lines.join('\n'));
console.log(`Đã ghi ${results.length} bộ hình (${(disk / 1048576).toFixed(2)} MB file) và cập nhật khối Free Foes trong sprites.js.`);
