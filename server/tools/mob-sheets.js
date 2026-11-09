/*
 * Chuyển gói hình quái tải về (assets_raw/) thành bộ hình game (public/assets/mobs/<id>/<hoạt ảnh>.png)
 * và in ra dòng cấu hình để dán vào Sprites.MOBS (public/js/art/sprites.js).
 *
 *   node server/tools/mob-sheets.js            → xử lý mọi bộ trong JOBS
 *   node server/tools/mob-sheets.js spider ... → chỉ các bộ được nêu
 *
 * Mỗi hoạt ảnh lấy từ một nguồn:
 *   { file, fw, fh }                     dải ngang các khung fw×fh (mặc định khung vuông theo chiều cao ảnh)
 *   { file, fw, fh, row, n, start }      lưới: hàng row (từ 0), n khung, bắt đầu từ cột start
 *   { files: [...] }                     mỗi file một khung
 * Mọi hoạt ảnh của một bộ phải cùng cỡ khung (fw×fh) để Sprites đọc chung số đo.
 * Tham số bộ: h = chiều cao mong muốn trong game (px), faceLeft, fakeDeath, fly.
 * Xong thì dán dòng cấu hình vào Sprites.MOBS rồi chạy `node server/tools/trim-mob-sheets.js` để cắt viền trong suốt thừa.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..', '..');
const RAW = path.join(ROOT, 'assets_raw');
const OUT = path.join(ROOT, 'public', 'assets', 'mobs');

// ---------------------------------------------------------------- PNG đọc / ghi (RGBA 8 bit)
function decode(file) {
  const b = fs.readFileSync(file);
  let p = 8, W, H, depth, ctype, pal = null, trns = null; const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), type = b.toString('ascii', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { W = d.readUInt32BE(0); H = d.readUInt32BE(4); depth = d[8]; ctype = d[9]; if (d[12]) throw new Error('PNG xen kẽ (interlaced) chưa hỗ trợ: ' + file); }
    else if (type === 'PLTE') pal = d; else if (type === 'tRNS') trns = d; else if (type === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  if (depth === 16) throw new Error('PNG 16 bit chưa hỗ trợ: ' + file);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ctype];
  const bpp = Math.max(1, ch * depth / 8), stride = Math.ceil(W * ch * depth / 8);
  const px = Buffer.alloc(W * H * 4); let prev = Buffer.alloc(stride), q = 0;
  for (let y = 0; y < H; y++) {
    const f = raw[q++], line = Buffer.from(raw.subarray(q, q + stride)); q += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0, up = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const pp = a + up - c, pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      line[i] = v & 255;
    }
    for (let x = 0; x < W; x++) {
      let r, g, bl, al = 255;
      if (ctype === 6) { r = line[x * 4]; g = line[x * 4 + 1]; bl = line[x * 4 + 2]; al = line[x * 4 + 3]; }
      else if (ctype === 2) { r = line[x * 3]; g = line[x * 3 + 1]; bl = line[x * 3 + 2]; }
      else if (ctype === 4) { r = g = bl = line[x * 2]; al = line[x * 2 + 1]; }
      else if (ctype === 3) {
        const idx = depth === 8 ? line[x] : (line[(x * depth) >> 3] >> (8 - depth - ((x * depth) & 7))) & ((1 << depth) - 1);
        r = pal[idx * 3]; g = pal[idx * 3 + 1]; bl = pal[idx * 3 + 2]; al = trns && idx < trns.length ? trns[idx] : 255;
      } else { r = g = bl = depth === 8 ? line[x] : ((line[(x * depth) >> 3] >> (8 - depth - ((x * depth) & 7))) & ((1 << depth) - 1)) * (255 / ((1 << depth) - 1)); }
      px.set([r, g, bl, al], (y * W + x) * 4);
    }
    prev = line;
  }
  return { W, H, px };
}
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (b) => { let c = 0xffffffff; for (const v of b) c = CRC[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function encode(W, H, px) {
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; px.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4); }
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ---------------------------------------------------------------- Khung hình
// Lấy danh sách khung (mỗi khung: Buffer RGBA fw×fh) từ một nguồn
function frames(src) {
  let fw, fh, list = [];
  if (src.seq) {
    // seq: 'thư/mục/tiền_tố_' → mọi file tiền_tố_<số>.png, theo thứ tự số
    const dir = path.join(RAW, path.dirname(src.seq)), pre = path.basename(src.seq);
    src = { ...src, files: fs.readdirSync(dir).filter(f => f.startsWith(pre) && /^\d+\.png$/i.test(f.slice(pre.length)))
      .sort((a, b) => parseInt(a.slice(pre.length)) - parseInt(b.slice(pre.length))).map(f => path.join(path.dirname(src.seq), f)) };
    if (!src.files.length) throw new Error('không thấy file ' + src.seq + '*');
  }
  if (src.files) {
    const imgs = src.files.map(f => decode(path.join(RAW, f)));
    fw = imgs[0].W; fh = imgs[0].H;
    list = imgs.map(im => crop(im, 0, 0, fw, fh));
  } else {
    const im = decode(path.join(RAW, src.file));
    fh = src.fh || im.H; fw = src.fw || fh;
    const cols = Math.floor(im.W / fw), rows = Math.floor(im.H / fh), row = src.row || 0, start = src.start || 0;
    const n = src.n || cols * (src.n === undefined && src.row === undefined ? rows : 1) - start;
    for (let k = start; k < start + n; k++) list.push(crop(im, (k % cols) * fw, (row + Math.floor(k / cols)) * fh, fw, fh));
  }
  // place: đặt khung vào khung lớn hơn (w×h), lệch ngang x, chân chạm đáy — để các hoạt ảnh khác cỡ dùng chung số đo
  if (src.place) {
    const { w, h, x = 0 } = src.place;
    list = list.map(f => { const out = Buffer.alloc(w * h * 4); for (let y = 0; y < fh; y++) f.copy(out, ((h - fh + y) * w + x) * 4, y * fw * 4, (y + 1) * fw * 4); return out; });
    fw = w; fh = h;
  }
  // step: chỉ lấy 1 trong mỗi `step` khung (bộ HD nhiều khung → giữ dải ảnh ≤ 4096 px cho máy yếu)
  // blankRows: xóa các hàng điểm ảnh (vd. vạch "mặt đất" vẽ sẵn trong hình gốc)
  if (src.blankRows) for (const f of list) for (const y of src.blankRows) f.fill(0, y * fw * 4, (y + 1) * fw * 4);
  if (src.step) list = list.filter((_, i) => i % src.step === 0);
  if (src.take) list = list.slice(0, src.take);
  return { fw, fh, list };
}
function crop(im, x0, y0, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = x0 + x, sy = y0 + y;
    if (sx < im.W && sy < im.H) im.px.copy(out, (y * w + x) * 4, (sy * im.W + sx) * 4, (sy * im.W + sx) * 4 + 4);
  }
  return out;
}
// Lật ngang một khung (để bộ hình quay trái thành quay phải khi cần)
function flipFrame(buf, w, h) {
  const out = Buffer.alloc(buf.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) buf.copy(out, (y * w + (w - 1 - x)) * 4, (y * w + x) * 4, (y * w + x) * 4 + 4);
  return out;
}
const empty = (buf) => { for (let i = 3; i < buf.length; i += 4) if (buf[i] > 40) return false; return true; };
function bbox(buf, w, h, box) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (buf[(y * w + x) * 4 + 3] > 40) {
    box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y);
  }
  return box;
}

// ---------------------------------------------------------------- Danh sách bộ hình (đường dẫn tính từ assets_raw/)
const I = 'itch/';
const LM = (pack, sub = 'Sprites/') => (f) => `${I}${pack}/${pack}/${sub}${f}`;
const JOBS = {
  // --- LuizMelo (CC0)
  fantasy_warrior: { h: 58, bw: 30, src: (f) => `extracted/fantasy-warrior/Fantasy Warrior/Sprites/${f}`, fw: 162,
    anims: { idle: 'Idle.png', run: 'Run.png', attack: 'Attack1.png', hit: 'Take hit.png', death: 'Death.png' } },
  warrior: { h: 56, src: LM('Medieval Warrior Pack', ''), fw: 184,
    anims: { idle: 'Idle.png', run: 'Run.png', attack: 'Attack1.png', hit: 'Hit.png', death: 'Death.png' } },
  spearman: { h: 56, src: LM('Medieval Warrior Pack 2'),
    anims: { idle: 'Idle.png', run: 'Run.png', attack: 'Attack3.png', hit: 'Take Hit.png', death: 'Death.png' } },
  knight_silver: { h: 54, src: LM('Medieval Warrior Pack 3'),
    anims: { idle: 'Idle.png', run: 'Run.png', attack: 'Attack1.png', hit: 'Get Hit.png', death: 'Death.png' } },
  hero_knight: { h: 58, src: LM('Hero Knight 2'),
    anims: { idle: 'Idle.png', run: 'Run.png', attack: 'Attack.png', hit: 'Take Hit.png', death: 'Death.png' } },
  samurai: { h: 56, src: LM('Martial Hero'),
    anims: { idle: 'Idle.png', run: 'Run.png', attack: 'Attack1.png', hit: 'Take Hit.png', death: 'Death.png' } },
  swordsman: { h: 56, src: LM('Martial Hero 2'),
    anims: { idle: 'Idle.png', run: 'Run.png', attack: 'Attack1.png', hit: 'Take hit.png', death: 'Death.png' } },
  witch: { h: 58, src: LM('Evil Wizard 3'),
    anims: { idle: 'Idle.png', run: 'Walk.png', attack: 'Attack.png', hit: 'Get hit.png', death: 'Death.png' } },
  fire_worm: { h: 44, src: LM('Fire Worm', 'Sprites/Worm/'),
    anims: { idle: 'Idle.png', run: 'Walk.png', attack: 'Attack.png', hit: 'Get Hit.png', death: 'Death.png' } },
  huntress: { h: 56, src: LM('Huntress'),
    anims: { idle: 'Idle.png', run: 'Run.png', attack: 'Attack1.png', hit: 'Take hit.png', death: 'Death.png' } },
  king: { h: 60, src: LM('Medieval King Pack', ''),
    anims: { idle: 'Idle.png', run: 'Run.png', attack: 'Attack_1.png', hit: 'Hit.png', death: 'Death.png' } },

  // --- Elthen (lưới ô 32/64 px; nhiều bộ quay trái → lật)
  spider: { h: 30, flip: true, bw: 40, anims: (() => { const f = I + 'elthen/Spider Sprite Sheet.png', g = (row, n) => ({ file: f, fw: 32, fh: 32, row, n });
    return { idle: g(0, 5), run: g(1, 6), attack: g(4, 4), hit: g(5, 3), death: g(6, 9) }; })() },
  worm: { h: 40, bw: 26, anims: (() => { const f = I + 'elthen/Worm Sprite Sheet.png', g = (row, n) => ({ file: f, fw: 32, fh: 32, row, n });
    return { idle: g(0, 8), run: g(0, 8), attack: g(1, 8), hit: g(2, 4), death: g(3, 6) }; })() },
  ice_sprite: { h: 52, bw: 34, anims: (() => { const f = I + 'elthen/Ice Elemental Sprite Sheet.png', g = (row, n) => ({ file: f, fw: 32, fh: 32, row, n });
    return { idle: g(0, 6), run: g(1, 4), attack: g(4, 5), hit: g(5, 3), death: g(6, 9) }; })() },
  ghoul: { h: 54, flip: true, bw: 30, anims: (() => { const f = I + 'elthen/Ghoul Sprite Sheet.png', g = (row, n) => ({ file: f, fw: 32, fh: 32, row, n });
    return { idle: g(0, 4), run: g(1, 8), attack: g(2, 6), hit: g(3, 4), death: g(4, 6) }; })() },
  cyclops: { h: 80, bw: 40, anims: (() => { const f = I + 'elthen/Cyclops Sprite Sheet.png', g = (row, n) => ({ file: f, fw: 64, fh: 64, row, n });
    return { idle: g(0, 15), run: g(1, 12), attack: g(3, 13), hit: g(4, 3), death: g(6, 9) }; })() },

  // --- Penusbmic (ô 64 px, thứ tự khung chạy liền qua các hàng)
  tooth_walker: { h: 58, bw: 22, anims: (() => { const f = I + 'tooth walker/tooth walker/tooth walker sprite-Sheet.png', g = (start, n) => ({ file: f, fw: 64, fh: 64, row: 0, start, n, blankRows: [58] });
    return { idle: g(0, 6), run: g(0, 6), attack: g(20, 6), hit: g(10, 2), death: g(12, 8) }; })() },

  // --- Clembod Bringer of Death (mỗi file một khung 140×93, quay trái)
  reaper_boss: { h: 80, flip: true, bw: 36, anims: (() => { const d = I + 'Bringer-Of-Death/Bringer-Of-Death/Individual Sprite/', q = (a) => ({ seq: `${d}${a}/Bringer-of-Death_${a}_` });
    return { idle: q('Idle'), run: q('Walk'), attack: q('Attack'), hit: q('Hurt'), death: q('Death') }; })() },

  // --- Admurin Golem (ô 64 px, mỗi file một hoạt ảnh xếp lưới 4 cột)
  rock_golem: { h: 58, bw: 40, anims: (() => { const d = I + 'Enemy_Single_Golem/Golem/Golem_', g = (f) => ({ file: d + f + '.png', fw: 64, fh: 64 });
    return { idle: g('IdleA'), run: g('Run'), attack: g('AttackA'), hit: g('HitA'), death: g('DeathA') }; })() },

  // --- Atari Boy Skull Wolf (ô 64 px, 7 cột; quay trái)
  skull_wolf: { h: 44, flip: true, bw: 48, anims: (() => { const f = I + 'Skullwolf/Massacre Sprite Sheet.png', g = (row, n) => ({ file: f, fw: 64, fh: 64, row, n });
    return { idle: g(0, 6), run: g(1, 5), attack: g(1, 5), hit: g(2, 4), death: g(3, 7) }; })() },

  // --- Admurin Frogger (khung đứng 128 px, các khung khác 384 px với ếch ở ô giữa) — không có hoạt ảnh chết
  frog_boss: { h: 64, bw: 60, fakeDeath: true, anims: (() => { const d = I + 'Bosses_Frogger/Frogger/';
    return { idle: { file: d + 'frogger_idle.png', fw: 128, fh: 128, place: { w: 384, h: 128, x: 128 } },
      run: { file: d + 'frogger_move.png', fw: 384, fh: 128 }, attack: { file: d + 'frogger_tongue.png', fw: 384, fh: 128 },
      hit: { file: d + 'frogger_hurt.png', fw: 384, fh: 128 }, death: { file: d + 'frogger_hurt.png', fw: 384, fh: 128, take: 1 } }; })() },

  // --- Kronovi Mecha-Stone Golem (lưới ô 100 px, 10 cột)
  stone_golem: { h: 66, bw: 40, anims: (() => { const f = I + 'Mecha-stone Golem 0.1/Mecha-stone Golem 0.1/PNG sheet/Character_sheet.png', g = (row, n, start = 0) => ({ file: f, fw: 100, fh: 100, row, n, start });
    return { idle: g(0, 4), run: g(0, 4), attack: g(4, 7), hit: g(1, 3), death: g(7, 14) }; })() },

  // --- engvee Boss Creature (HD, lưới 256×192, quay trái; bỏ bớt 1/2 khung)
  void_beast: { h: 96, flip: true, bw: 60, anims: (() => { const d = I + 'x192p_Spritesheets/x192p_Spritesheets/', g = (f) => ({ file: d + f, fw: 256, fh: 192, step: 2, take: 14 });
    return { idle: g('Idle.png'), run: g('Walk.png'), attack: g('Attack_01.png'), hit: g('Hit.png'), death: g('Death.png') }; })() },

  // --- sanctumpixel (mỗi file một khung)
  imp: { h: 36, bw: 26, anims: (() => { const d = I + 'imp_axe_demon/imp_axe_demon/imp_red/';
    return { idle: { seq: d + 'ready_' }, run: { seq: d + 'run_' }, attack: { seq: d + 'walk_' }, hit: { seq: d + 'hit_' }, death: { seq: d + 'fall_back_' } }; })() },
  axe_demon: { h: 64, bw: 34, anims: (() => { const d = I + 'imp_axe_demon/imp_axe_demon/demon_axe_red/';
    return { idle: { seq: d + 'ready_' }, run: { seq: d + 'run_' }, attack: { seq: d + 'attack1_' }, hit: { seq: d + 'hit_' }, death: { seq: d + 'dead_' } }; })() },

  // --- RiLi Cultist Priest (mỗi file một khung 200×200)
  cultist: { h: 60, bw: 30, anims: (() => { const d = I + 'cultist_priest_sprite_pack/cultist_priest_';
    return { idle: { seq: d + 'idle_' }, run: { seq: d + 'walk_' }, attack: { seq: d + 'attack_' }, hit: { seq: d + 'takehit_' }, death: { seq: d + 'die_' } }; })() },
};
// Người: khung va chạm hẹp, bỏ qua vũ khí dang rộng
for (const id of ['warrior', 'spearman', 'knight_silver', 'hero_knight', 'samurai', 'swordsman', 'witch', 'huntress', 'king']) JOBS[id].bw = 30;

// Số đo hiện tại trong sprites.js không cần đoán: tính từ khung bao điểm ảnh của đứng + chạy
function run(id, job) {
  const anims = {};
  let fw0, fh0;
  for (const [name, spec] of Object.entries(job.anims)) {
    const src = typeof spec === 'string' ? { file: job.src(spec), fw: job.fw, fh: job.fh } : { ...spec, file: spec.file && (job.src ? job.src(spec.file) : spec.file) };
    let { fw, fh, list } = frames(src);
    list = list.filter(f => !empty(f));
    if (job.flip) list = list.map(f => flipFrame(f, fw, fh));
    if (fw0 && (fw !== fw0 || fh !== fh0)) throw new Error(`${id}/${name}: khung ${fw}x${fh} khác các hoạt ảnh khác (${fw0}x${fh0})`);
    fw0 = fw; fh0 = fh;
    anims[name] = { list, rate: spec.rate };
  }
  let box = [1e9, 1e9, -1, -1];
  for (const a of ['idle', 'run']) for (const f of anims[a].list) bbox(f, fw0, fh0, box);
  // Canh thân vào giữa khung (nới rộng khung nếu cần): Phaser lật hình quanh giữa khung,
  // thân lệch tâm thì khi quay trái hình sẽ trượt khỏi khung va chạm
  const d = Math.round(fw0 / 2 - (box[0] + box[2] + 1) / 2);
  if (d) {
    const nw = fw0 + 2 * Math.abs(d), off = Math.abs(d) + d;
    for (const a of Object.values(anims)) a.list = a.list.map(f => {
      const out = Buffer.alloc(nw * fh0 * 4);
      for (let y = 0; y < fh0; y++) f.copy(out, (y * nw + off) * 4, y * fw0 * 4, (y + 1) * fw0 * 4);
      return out;
    });
    box = [box[0] + off, box[1], box[2] + off, box[3]];
    fw0 = nw;
  }
  const w = box[2] - box[0] + 1, h = box[3] - box[1] + 1;
  const s = +(job.h / h).toFixed(3);
  const cx = fw0 / 2, fy = box[3] + 1;
  const dir = path.join(OUT, id);
  fs.mkdirSync(dir, { recursive: true });
  const RATE = { idle: 10, run: 12, attack: 16, hit: 12, death: 10 };
  const counts = [];
  for (const [name, { list, rate }] of Object.entries(anims)) {
    const W = fw0 * list.length, px = Buffer.alloc(W * fh0 * 4);
    list.forEach((f, k) => { for (let y = 0; y < fh0; y++) f.copy(px, (y * W + k * fw0) * 4, y * fw0 * 4, (y + 1) * fw0 * 4); });
    fs.writeFileSync(path.join(dir, name + '.png'), encode(W, fh0, px));
    counts.push(`${name}: [${list.length}, ${rate || RATE[name]}]`);
  }
  const bw = Math.round(Math.min(w * s * 0.8, job.bw || 999)), bh = Math.round(job.h * 0.92);
  const extra = (job.faceLeft ? ', faceLeft: true' : '') + (job.fakeDeath ? ', fakeDeath: true' : '');
  const flyPart = job.fly ? `cx: ${cx}, cy: ${Math.round((box[1] + box[3]) / 2)}, fly: true` : `cx: ${cx}, fy: ${fy}`;
  console.log(`    ${id}: { fw: ${fw0}, fh: ${fh0}, ${flyPart}, s: ${s}, bw: ${job.bw || bw}, bh: ${job.bh || bh}${extra},\n      anims: { ${counts.join(', ')} } },`);
}

const only = process.argv.slice(2);
for (const [id, job] of Object.entries(JOBS)) if (!only.length || only.includes(id)) {
  try { run(id, job); } catch (e) { console.log(`✗ ${id}: ${e.message}`); }
}
