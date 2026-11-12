/*
 * Làm mịn sprite pixel art nhỏ bằng xBRZ (edge-aware blending, chất lượng cao hơn Scale2x/EPX), lặp 1–2 lần (×2 hoặc ×4), rồi chỉnh cấu hình trong public/js/art/sprites.js
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

// Bộ cần làm mịn: [loại/id, hệ số]. Rất kém (khung ≤ 45px) ×4; kém ×2.
// LƯU Ý: cyclops, axe_demon, skull_wolf đã được THAY bằng sprite HD (Ansimuz Ogre/Demon, Werewolf)
// nên không nằm trong danh sách nữa — chạy lại từ pixel_orig sẽ ghi đè sprite mới.
const LIST = [
  ['mobs/worm', 4],
  ['mobs/nightborne', 2], ['mobs/mimic', 2], ['mobs/hero_knight', 2], ['mobs/tooth_walker', 2], ['mobs/reaper_boss', 2],
  ['mobs/knight_silver', 2], ['mobs/ronin', 2], ['mobs/huntress', 2], ['mobs/goblin', 2], ['mobs/fantasy_warrior', 2],
  ['mobs/eye', 2], ['mobs/imp', 2], ['mobs/mushroom', 2], ['mobs/witch', 2], ['mobs/samurai', 2],
  ['chars/tu_linh_thuat_su', 2],
];

// xBRZ: so khớp cạnh theo 4 hướng chéo, pha trộn có trọng số (giữ cạnh sắc, mượt đường chéo).
// Dùng ngưỡng Y (độ chênh độ sáng) + ngưỡng C (độ chênh màu) như bản gốc xBRZ.
const Y_THRESHOLD = 48, C_THRESHOLD = 120;
const ALPHA_THRESHOLD = 24;
function yv(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }
function colorDist(a, b, i, j) {
  const dy = Math.abs(yv(a[i], a[i + 1], a[i + 2]) - yv(b[j], b[j + 1], b[j + 2]));
  const dr = a[i] - b[j], dg = a[i + 1] - b[j + 1], db = a[i + 2] - b[j + 2];
  const dc = Math.sqrt(dr * dr + dg * dg + db * db);
  return { dy, dc };
}
function xbrz2x(px, W, H) {
  const out = Buffer.alloc(W * 2 * H * 2 * 4), W2 = W * 2;
  const at = (x, y) => (Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 4;
  const get = (x, y) => { const i = at(x, y); return [px[i], px[i + 1], px[i + 2], px[i + 3]]; };
  const put = (x, y, c) => { const o = (y * W2 + x) * 4; out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = c[3]; };
  const blend = (c1, c2, w1, w2) => {
    const a1 = c1[3] / 255 * w1, a2 = c2[3] / 255 * w2, s = a1 + a2;
    if (s <= 0) return [0, 0, 0, 0];
    return [Math.round((c1[0] * a1 + c2[0] * a2) / s), Math.round((c1[1] * a1 + c2[1] * a2) / s), Math.round((c1[2] * a1 + c2[2] * a2) / s), Math.round((a1 + a2) / (w1 + w2) * 255)];
  };
  const eq = (c1, c2) => {
    if (c1[3] < ALPHA_THRESHOLD && c2[3] < ALPHA_THRESHOLD) return true;
    if (Math.abs(c1[3] - c2[3]) > 48) return false;
    const { dy, dc } = colorDist(c1, c2, 0, 0);
    return dy <= Y_THRESHOLD && dc <= C_THRESHOLD;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const A = get(x - 1, y - 1), B = get(x, y - 1), C = get(x + 1, y - 1);
    const D = get(x - 1, y),     E = get(x, y),     F = get(x + 1, y);
    const G = get(x - 1, y + 1), H2 = get(x, y + 1), I = get(x + 1, y + 1);
    // 4 điểm con: TL, TR, BL, BR
    // TL: nếu D==B và E khác C và E khác G → pha D/B
    let tl = E, tr = E, bl = E, br = E;
    if (eq(D, B) && !eq(E, C) && !eq(E, G)) tl = blend(D, B, 1, 1);
    if (eq(B, F) && !eq(E, A) && !eq(E, I)) tr = blend(B, F, 1, 1);
    if (eq(D, H2) && !eq(E, A) && !eq(E, I)) bl = blend(D, H2, 1, 1);
    if (eq(F, H2) && !eq(E, C) && !eq(E, G)) br = blend(F, H2, 1, 1);
    // tinh chỉnh: nếu E giống hệt 2 lân cận chéo thì giữ E
    if (eq(E, A) && eq(E, I)) { tl = E; br = E; }
    if (eq(E, C) && eq(E, G)) { tr = E; bl = E; }
    put(2 * x, 2 * y, tl); put(2 * x + 1, 2 * y, tr); put(2 * x, 2 * y + 1, bl); put(2 * x + 1, 2 * y + 1, br);
  }
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
    for (let t = 1; t < f; t *= 2) { cur = xbrz2x(cur, W, H); W *= 2; H *= 2; }
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
