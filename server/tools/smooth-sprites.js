/*
 * Làm mịn sprite pixel art nhỏ bằng Scale2x (EPX có dung sai màu), lặp 1–2 lần (×2 hoặc ×4), rồi chỉnh cấu hình trong public/js/art/sprites.js
 * (fw, fh, cx, cy, fy nhân hệ số; s chia hệ số; thêm hd: true → game lọc mượt thay vì NEAREST). Kích thước hiển thị trong game không đổi.
 *
 *   node server/tools/smooth-sprites.js --dry             → in danh sách + dung lượng ảnh giải nén dự kiến
 *   node server/tools/smooth-sprites.js                   → làm mịn toàn bộ danh sách LIST
 *   node server/tools/smooth-sprites.js mobs/worm:4 ...   → chỉ các bộ nêu tên (kèm hệ số 2 hoặc 4)
 *
 * Chạy lại được: bản gốc chưa làm mịn được sao lưu ở assets_raw/pixel_orig/<loại>/<id>/ (ảnh + cfg.json) trong lần chạy đầu và luôn dùng lại bản đó,
 * nên đổi hệ số hay thuật toán rồi chạy lại không bị làm mịn chồng lên nhau. Muốn hoàn nguyên: git checkout public/assets public/js/art/sprites.js.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./lib-png');

const ROOT = path.join(__dirname, '..', '..');
const ASSETS = path.join(ROOT, 'public', 'assets');
const BACKUP = path.join(ROOT, 'assets_raw', 'pixel_orig');
const SPRITES_JS = path.join(ROOT, 'public', 'js', 'art', 'sprites.js');
const TOL = 36;                        // dung sai màu (tổng chênh lệch R+G+B) coi là "cùng màu"

// Bộ cần làm mịn: [loại/id, hệ số]. Rất kém (khung ≤ 45px) ×4; kém ×2.
const LIST = [
  ['mobs/ice_sprite', 4], ['mobs/worm', 4], ['mobs/rock_golem', 4], ['mobs/cyclops', 4],
  ['mobs/nightborne', 2], ['mobs/axe_demon', 2], ['mobs/mimic', 2], ['mobs/hero_knight', 2], ['mobs/tooth_walker', 2], ['mobs/reaper_boss', 2],
  ['mobs/knight_silver', 2], ['mobs/stone_golem', 2], ['mobs/ronin', 2], ['mobs/huntress', 2], ['mobs/goblin', 2], ['mobs/fantasy_warrior', 2],
  ['mobs/eye', 2], ['mobs/imp', 2], ['mobs/mushroom', 2], ['mobs/witch', 2], ['mobs/samurai', 2], ['mobs/skull_wolf', 2],
  ['chars/tu_linh_thuat_su', 2],
];

const same = (a, b, i, j) => {
  const aa = a[i + 3], ab = b[j + 3];
  if (aa < 24 && ab < 24) return true;
  if (Math.abs(aa - ab) > 48) return false;
  return Math.abs(a[i] - b[j]) + Math.abs(a[i + 1] - b[j + 1]) + Math.abs(a[i + 2] - b[j + 2]) <= TOL;
};
// Scale2x / EPX: mỗi điểm ảnh P (trên A, phải B, trái C, dưới D) thành 4 điểm ảnh
function scale2x(px, W, H) {
  const out = Buffer.alloc(W * 2 * H * 2 * 4), W2 = W * 2;
  const at = (x, y) => (Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 4;
  const put = (x, y, src) => { const o = (y * W2 + x) * 4; out[o] = px[src]; out[o + 1] = px[src + 1]; out[o + 2] = px[src + 2]; out[o + 3] = px[src + 3]; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
    const cA = same(px, px, C, A), aB = same(px, px, A, B), dC = same(px, px, D, C), bD = same(px, px, B, D);
    const cD = same(px, px, C, D), aB2 = same(px, px, A, B);
    put(2 * x, 2 * y, cA && !cD && !aB2 ? A : P);
    put(2 * x + 1, 2 * y, aB && !cA && !bD ? B : P);
    put(2 * x, 2 * y + 1, dC && !bD && !cA ? C : P);
    put(2 * x + 1, 2 * y + 1, bD && !aB && !dC ? D : P);
  }
  // điểm ảnh trong suốt hẳn: đưa RGB về 0 để lọc mượt không viền màu
  for (let i = 0; i < out.length; i += 4) if (out[i + 3] === 0) out[i] = out[i + 1] = out[i + 2] = 0;
  return out;
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const picked = args.filter(a => !a.startsWith('--')).map(a => { const [k, f] = a.split(':'); return [k, +f || 2]; });
const jobs = picked.length ? picked : LIST;

let js = fs.readFileSync(SPRITES_JS, 'utf8');
let totalMB = 0;
for (const [key, f] of jobs) {
  const [kind, id] = key.split('/');
  const dir = path.join(ASSETS, kind, id), bak = path.join(BACKUP, kind, id);
  const re = new RegExp(`^(\\s{4}${id}: \\{ )([^}]*?)(\\s*\\n?\\s*anims: \\{[^\\n]*\\} \\},?)`, 'm');
  const m = re.exec(js);
  if (!fs.existsSync(path.join(bak, 'cfg.json'))) {
    if (!m) { console.log(`${key}: không tìm thấy cấu hình trong sprites.js, bỏ qua`); continue; }
    if (!dry) { fs.mkdirSync(bak, { recursive: true }); for (const fn of fs.readdirSync(dir)) fs.copyFileSync(path.join(dir, fn), path.join(bak, fn)); fs.writeFileSync(path.join(bak, 'cfg.json'), JSON.stringify({ props: m[2] })); }
  }
  const props = fs.existsSync(path.join(bak, 'cfg.json')) ? JSON.parse(fs.readFileSync(path.join(bak, 'cfg.json'), 'utf8')).props : m[2];
  const num = (n) => { const r = new RegExp(`\\b${n}: ([\\d.]+)`).exec(props); return r ? +r[1] : null; };
  const fw = num('fw'), fh = num('fh');
  const files = fs.existsSync(bak) ? fs.readdirSync(bak).filter(n => n.endsWith('.png')) : fs.readdirSync(dir).filter(n => n.endsWith('.png'));
  let px = 0;
  for (const fn of files) {
    const src = fs.existsSync(path.join(bak, fn)) ? path.join(bak, fn) : path.join(dir, fn);
    const im = decode(src);
    px += im.W * im.H * f * f * 4;
    if (dry) continue;
    let cur = im.px, W = im.W, H = im.H;
    for (let t = 1; t < f; t *= 2) { cur = scale2x(cur, W, H); W *= 2; H *= 2; }
    fs.writeFileSync(path.join(dir, fn), encode(W, H, cur));
  }
  const mb = px / 1048576; totalMB += mb;
  const scaled = props.replace(/\b(fw|fh|cx|cy|fy): ([\d.]+)/g, (_, k, v) => `${k}: ${+v * f}`)
    .replace(/\bs: ([\d.]+)/, (_, v) => `s: ${Math.round(+v / f * 10000) / 10000}`);
  const withHd = /\bhd: true/.test(scaled) ? scaled : scaled.replace(/\bs: /, 'hd: true, s: ');
  console.log(`${key} ×${f}: khung ${fw}x${fh} → ${fw * f}x${fh * f}, ${files.length} ảnh, giải nén ${mb.toFixed(1)} MB`);
  if (!dry && m) js = js.replace(re, (_, a, _b, c) => a + withHd + c);
}
console.log(`Tổng giải nén ${totalMB.toFixed(1)} MB (cả danh sách; mỗi bản đồ chỉ tải bộ của quái trên đó)`);
if (!dry) fs.writeFileSync(SPRITES_JS, js);
