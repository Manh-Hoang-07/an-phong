/*
 * Nhập bộ hình quái từ các gói tải về (assets_raw/_dl/...) thành public/assets/mobs/<id>/{idle,run,attack,hit,death}.png
 * và tự thay dòng cấu hình của <id> trong public/js/art/sprites.js (giữ rw, bw, bh cũ; fw, fh, cx, fy, s, hd tính lại).
 *
 *   node server/tools/import-frames.js --dry              → chỉ in số đo
 *   node server/tools/import-frames.js [id ...] [--dry]   → ghi (mặc định: mọi id trong SPECS)
 *
 * Nguồn (đều quay mặt sang PHẢI): Ansimuz "Legacy Collection" (Gothicvania: Ogre, Demon; https://ansimuz.itch.io/gothicvania-patreon-collection, dùng thương mại được),
 * Free Game Assets "Free Werewolf" (giấy phép craftpix), Yudemgoy "Golem Full Sprite" (https://yudemgoy.itch.io/golem-full-sprite).
 * Khung có cỡ khác nhau giữa các hoạt ảnh nên căn theo đáy-giữa ô; hộp cắt là hộp bao chung; s đưa thân cao ≈ height px logic.
 * Hoạt ảnh gói thiếu (hit, chết) → dùng khung đứng; death 1 khung + fakeDeath: true để game tự cho ngã.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./lib-png');

const ROOT = path.join(__dirname, '..', '..');
const DL = path.join(ROOT, 'assets_raw', '_dl');
const ANS = path.join(DL, 'ansimuz', 'x', 'legacy', 'Legacy Collection', 'Assets', 'Gothicvania', 'Characters');
const SPRITES_JS = path.join(ROOT, 'public', 'js', 'art', 'sprites.js');

const seq = (dir, fmt, n, from = 1) => Array.from({ length: n }, (_, i) => path.join(dir, fmt.replace('#', String(from + i))));
const dirFiles = (dir, idx) => { const all = fs.readdirSync(dir).filter(f => /\.png$/i.test(f)).sort(); return idx.map(i => path.join(dir, all[Math.min(i, all.length - 1)])); };
const sheet = (file, cw, idx, ch) => idx.map(i => ({ sheet: file, cw, ch, i }));
const pick = (n, k) => Array.from({ length: k }, (_, i) => Math.round(i * (n - 1) / (k - 1)));

const OGRE = path.join(ANS, 'Ogre', 'Sprites'), DEMON = path.join(ANS, 'demon-Files', 'Sprites');
const WW = path.join(DL, 'werewolf', 'x', 'werewolf', 'White_Werewolf'), GOL = path.join(DL, 'golem', 'x');
const ICE = path.join(DL, 'icebeast', 'x', 'x256p_Spritesheets');
const iceSheet = (dir, name, cols, rows, n) => sheet(path.join(ICE, dir, name + '_Body_090.png'), 256, pick(cols * rows, n), 256);
const SPECS = {
  // Ice Beast (Engvee, 3D render 16 hướng; lấy hướng 090 quay mặt phải, bỏ bóng đổ xám) thay ice_sprite (Người Tuyết) → đổi tên bộ hình thành ice_beast
  ice_beast: {
    from: 'ice_sprite', height: 78, dropShadow: true,
    anims: {
      idle: { frames: iceSheet('Idle', 'Idle', 5, 4, 8), rate: 8 },
      run: { frames: iceSheet('Run', 'Run', 5, 4, 8), rate: 14 },
      attack: { frames: iceSheet('Attack_01', 'Attack_01', 6, 5, 10), rate: 16 },
      hit: { frames: iceSheet('Hit', 'Hit', 4, 4, 4), rate: 12 },
      death: { frames: iceSheet('Death', 'Death', 6, 5, 8), rate: 10 },
    },
  },
  // Ogre (Ansimuz) thay cyclops (Trùm Tinh Vân); gói không có hit / chết → khung đứng + fakeDeath
  cyclops: {
    height: 90, fakeDeath: true,
    anims: {
      idle: { frames: seq(path.join(OGRE, 'Idle'), 'ogre-idle#.png', 4), rate: 8 },
      run: { frames: seq(path.join(OGRE, 'walk'), 'ogre-walk#.png', 6), rate: 12 },
      attack: { frames: seq(path.join(OGRE, 'Attack'), 'ogre-attack#.png', 7), rate: 14 },
      hit: { frames: seq(path.join(OGRE, 'Idle'), 'ogre-idle#.png', 2), rate: 12 },
      death: { frames: seq(path.join(OGRE, 'Idle'), 'ogre-idle#.png', 1), rate: 10 },
    },
  },
  // Demon (Ansimuz, quỷ cánh dơi + lửa xanh) thay axe_demon (Hộ Vệ Long Mạch)
  axe_demon: {
    height: 84, fakeDeath: true,
    anims: {
      idle: { frames: seq(path.join(DEMON, 'Idle'), 'idle#.png', 6), rate: 8 },
      run: { frames: seq(path.join(DEMON, 'Idle'), 'idle#.png', 6), rate: 12 },
      attack: { frames: seq(path.join(DEMON, 'DemonAttack'), 'frame#.png', 18), rate: 18 },
      hit: { frames: seq(path.join(DEMON, 'Idle'), 'idle#.png', 2), rate: 12 },
      death: { frames: seq(path.join(DEMON, 'Idle'), 'idle#.png', 1), rate: 10 },
    },
  },
  // Free Werewolf (bản trắng, hợp sói băng) thay skull_wolf (Sói Đầu Đàn Băng Giá)
  skull_wolf: {
    height: 64,
    anims: {
      idle: { frames: sheet(path.join(WW, 'Idle.png'), 128, [0, 1, 2, 3, 4, 5, 6, 7]), rate: 8 },
      run: { frames: sheet(path.join(WW, 'Run.png'), 128, [0, 1, 2, 3, 4, 5, 6, 7, 8]), rate: 14 },
      attack: { frames: sheet(path.join(WW, 'Attack_1.png'), 128, [0, 1, 2, 3, 4, 5]), rate: 16 },
      hit: { frames: sheet(path.join(WW, 'Hurt.png'), 128, [0, 1]), rate: 10 },
      death: { frames: sheet(path.join(WW, 'Dead.png'), 128, [0, 1]), rate: 5 },
    },
  },
  // Golem (Yudemgoy, vector HD 512px) thay rock_golem; stone_golem dùng chung (khác màu phủ)
  rock_golem: {
    height: 88, down: 0.75,
    anims: {
      idle: { frames: dirFiles(path.join(GOL, 'Idle'), pick(31, 8)), rate: 8 },
      run: { frames: dirFiles(path.join(GOL, 'Walk'), pick(29, 10)), rate: 12 },
      attack: { frames: dirFiles(path.join(GOL, 'Atk1'), pick(26, 10)), rate: 16 },
      hit: { frames: dirFiles(path.join(GOL, 'Idle'), [0, 3]), rate: 12 },
      death: { frames: dirFiles(path.join(GOL, 'Dead'), pick(26, 8)), rate: 10 },
    },
  },
};

const cache = {};
function load(ref) {
  if (typeof ref === 'string') {
    const im = cache[ref] || (cache[ref] = decode(ref));
    return { w: im.W, h: im.H, px: im.px };
  }
  const im = cache[ref.sheet] || (cache[ref.sheet] = decode(ref.sheet));
  const w = ref.cw, h = ref.ch || im.H, cols = Math.floor(im.W / w), cx0 = (ref.i % cols) * w, cy0 = Math.floor(ref.i / cols) * h, px = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) im.px.copy(px, y * w * 4, ((cy0 + y) * im.W + cx0) * 4, ((cy0 + y) * im.W + cx0 + w) * 4);
  return { w, h, px };
}
// Thu nhỏ trung bình theo diện tích (cộng gộp có trọng số alpha)
function shrink(f, factor) {
  const w = Math.max(1, Math.round(f.w * factor)), h = Math.max(1, Math.round(f.h * factor)), px = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const x0 = Math.floor(x / factor), x1 = Math.max(x0 + 1, Math.min(f.w, Math.ceil((x + 1) / factor)));
    const y0 = Math.floor(y / factor), y1 = Math.max(y0 + 1, Math.min(f.h, Math.ceil((y + 1) / factor)));
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const o = (yy * f.w + xx) * 4, al = f.px[o + 3]; r += f.px[o] * al; g += f.px[o + 1] * al; b += f.px[o + 2] * al; a += al; n++; }
    const o = (y * w + x) * 4;
    if (a > 0) { px[o] = Math.round(r / a); px[o + 1] = Math.round(g / a); px[o + 2] = Math.round(b / a); px[o + 3] = Math.round(a / n); }
  }
  return { w, h, px };
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const ids = args.filter(a => !a.startsWith('--'));
let js = fs.readFileSync(SPRITES_JS, 'utf8');

for (const id of ids.length ? ids : Object.keys(SPECS)) {
  const spec = SPECS[id];
  if (!spec) { console.log(`${id}: không có trong SPECS`); continue; }
  const anims = {};
  for (const [name, a] of Object.entries(spec.anims)) anims[name] = { rate: a.rate, frames: a.frames.map(r => { let f = load(r); if (spec.dropShadow) { f = { w: f.w, h: f.h, px: Buffer.from(f.px) }; for (let i = 0; i < f.px.length; i += 4) if (f.px[i + 3] < 200 && f.px[i] < 40 && f.px[i + 1] < 40 && f.px[i + 2] < 40) f.px[i + 3] = 0; } return spec.down ? shrink(f, spec.down) : f; }) };
  const all = Object.values(anims).flatMap(a => a.frames);
  const Wc = Math.max(...all.map(f => f.w)), Hc = Math.max(...all.map(f => f.h));
  // dán vào khung chung, căn đáy-giữa
  const paste = (f) => {
    const px = Buffer.alloc(Wc * Hc * 4), ox = (Wc - f.w) >> 1, oy = Hc - f.h;
    for (let y = 0; y < f.h; y++) f.px.copy(px, ((oy + y) * Wc + ox) * 4, y * f.w * 4, (y + 1) * f.w * 4);
    return px;
  };
  for (const a of Object.values(anims)) a.cells = a.frames.map(paste);
  const bbox = (cells, thr) => {
    let x0 = Wc, x1 = -1, y0 = Hc, y1 = -1;
    for (const px of cells) for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) if (px[(y * Wc + x) * 4 + 3] > thr) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return { x0, x1, y0, y1 };
  };
  const full = bbox(Object.values(anims).flatMap(a => a.cells), 8), idle = bbox(anims.idle.cells, 40);
  const x0 = Math.max(0, full.x0 - 1), y0 = Math.max(0, full.y0 - 1), x1 = Math.min(Wc, full.x1 + 2), y1 = Math.min(Hc, full.y1 + 2);
  const fw = x1 - x0, fh = y1 - y0;
  const cx = Math.round((idle.x0 + idle.x1 + 1) / 2 - x0), fy = idle.y1 + 1 - y0;
  const bodyH = idle.y1 - idle.y0 + 1, s = Math.round(spec.height / bodyH * 10000) / 10000;
  const nFrames = Object.values(anims).reduce((n, a) => n + a.cells.length, 0);
  console.log(`${id}: khung ${fw}x${fh} · cx ${cx} · fy ${fy} · thân ${idle.x1 - idle.x0 + 1}x${bodyH} · s ${s} · ${nFrames} khung · giải nén ${(nFrames * fw * fh * 4 / 1048576).toFixed(1)} MB`);
  if (dry) continue;
  const dir = path.join(ROOT, 'public', 'assets', 'mobs', id);
  fs.mkdirSync(dir, { recursive: true });
  let disk = 0;
  const outAnims = {};
  for (const [name, a] of Object.entries(anims)) {
    const W = fw * a.cells.length, px = Buffer.alloc(W * fh * 4);
    a.cells.forEach((cell, k) => { for (let yy = 0; yy < fh; yy++) cell.copy(px, (yy * W + k * fw) * 4, ((y0 + yy) * Wc + x0) * 4, ((y0 + yy) * Wc + x0 + fw) * 4); });
    const buf = encode(W, fh, px);
    disk += buf.length;
    fs.writeFileSync(path.join(dir, name + '.png'), buf);
    outAnims[name] = [a.cells.length, a.rate];
  }
  console.log(`  ghi 5 ảnh (${(disk / 1048576).toFixed(2)} MB file)`);
  // thay dòng cấu hình trong sprites.js, giữ rw / bw / bh cũ
  const re = new RegExp(`^(\\s{4}${spec.from || id}: \\{ )([^}]*?)(\\s*\\n?\\s*anims: \\{[^\\n]*\\} \\},?)`, 'm');
  const m = re.exec(js);
  if (!m) { console.log('  KHÔNG tìm thấy cấu hình cũ, hãy dán tay'); continue; }
  const old = (k) => { const r = new RegExp(`\\b${k}: ([\\d.]+)`).exec(m[2]); return r ? r[1] : null; };
  const keep = ['rw', 'bw', 'bh'].filter(k => old(k) != null).map(k => `${k}: ${old(k)}`);
  const props = `fw: ${fw}, fh: ${fh}, ${old('rw') != null ? `rw: ${old('rw')}, ` : ''}cx: ${cx}, fy: ${fy}, hd: true${spec.fakeDeath ? ', fakeDeath: true' : ''}, s: ${s}, bw: ${old('bw')}, bh: ${old('bh')},`;
  const an = `anims: { ${Object.entries(outAnims).map(([k, v]) => `${k}: [${v[0]}, ${v[1]}]`).join(', ')} } },`;
  js = js.replace(re, () => `    ${id}: { ${props}\n      ${an}`);
}
if (!dry) fs.writeFileSync(SPRITES_JS, js);
