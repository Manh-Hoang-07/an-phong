'use strict';
/*
 * Sinh hiệu ứng RIÊNG cho từng kỹ năng: shared/data/skillfx/<id>.json
 *
 * Vì sao có công cụ này
 *   public/js/scene/skillfx.js đang gán ~175 kỹ năng vào một bảng SK dạng 'chủ_đề:kiểu',
 *   nên nhiều kỹ năng trông giống nhau và không tinh chỉnh riêng được. Công cụ này tách
 *   mỗi kỹ năng ra một file JSON riêng: cùng một file dùng cho web (Phaser) và app (Godot).
 *
 * Cách dùng
 *   node server/tools/gen-skillfx.js            # chỉ tạo file còn thiếu, KHÔNG ghi đè file đã sửa tay
 *   node server/tools/gen-skillfx.js --force    # ghi đè tất cả (mất chỉnh tay, cẩn thận)
 *   node server/tools/gen-skillfx.js --dry      # chỉ in ra sẽ làm gì, không ghi file
 *   node server/tools/gen-skillfx.js --only pa1,ks35
 *
 * Nguồn dữ liệu
 *   - Danh sách kỹ năng: GameData.SKILLS (shared/) — id, school, type, name, ult, superUlt
 *   - Chủ đề màu + kiểu: đọc thẳng bảng TH / SK / SCHOOL_TH / TYPE_SIG trong public/js/scene/skillfx.js
 *     để file sinh ra khớp đúng hình ảnh hiện tại (không bịa màu mới).
 *
 * Nguyên tắc
 *   - Không ghi đè file đã có trừ khi --force: file JSON là nơi con người tinh chỉnh.
 *   - Mọi kỹ năng đều có file riêng, không kỹ năng nào dùng chung file.
 *   - manifest.json ghi id -> file + hash để app so lệch dữ liệu.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', '..');
const SKILLFX_JS = path.join(ROOT, 'public', 'js', 'scene', 'skillfx.js');
const OUT_DIR = path.join(ROOT, 'shared', 'data', 'skillfx');

const ARGV = process.argv.slice(2);
const FORCE = ARGV.includes('--force');
const DRY = ARGV.includes('--dry');
const ONLY = (() => {
  const i = ARGV.indexOf('--only');
  if (i < 0) return null;
  const v = ARGV[i + 1] || '';
  return new Set(v.split(',').map((s) => s.trim()).filter(Boolean));
})();

const G = require(path.join(ROOT, 'shared'));
const SKILLS = G.SKILLS || {};

// ------------------------------------------------------------------ Đọc bảng trong skillfx.js
const src = fs.readFileSync(SKILLFX_JS, 'utf8');

function sliceBetween(text, from, to, fromIndex) {
  const a = text.indexOf(from, fromIndex || 0);
  if (a < 0) return '';
  const b = text.indexOf(to, a + from.length);
  if (b < 0) return '';
  return text.slice(a + from.length, b);
}

// TH: sword: { c: [0xffffff, 0xbcd6ff, 0x5b8cff], tex: 'fx_spark' },
function parseThemes(text) {
  const block = sliceBetween(text, 'const TH = {', '\n  };');
  const out = {};
  const re = /([a-z_]+)\s*:\s*\{\s*c:\s*\[([^\]]+)\]\s*,\s*tex:\s*'([^']+)'(?:\s*,\s*dark:\s*true)?\s*\}/g;
  let m;
  while ((m = re.exec(block))) {
    const colors = m[2].split(',').map((s) => s.trim()).filter(Boolean);
    out[m[1]] = {
      colors,
      texture: m[3],
      dark: /dark:\s*true/.test(m[0]),
    };
  }
  return out;
}

// SK: khối template literal 'pa1 sword:streak|pa2 sword:slash|...'
function parseSkillTable(text) {
  const start = text.indexOf('const SK = {};');
  if (start < 0) return {};
  const end = text.indexOf('.split(', start);
  const raw = text.slice(start, end);
  const open = raw.indexOf('`');
  const close = raw.lastIndexOf('`');
  if (open < 0 || close <= open) return {};
  const body = raw.slice(open + 1, close);
  const out = {};
  for (const entry of body.split(/[|\n]/)) {
    const parts = entry.trim().split(/\s+/);
    if (parts.length < 2) continue;
    const [id, v] = parts;
    const [theme, sig] = v.split(':');
    out[id] = { theme, sig };
  }
  return out;
}

function parseSimpleMap(text, name) {
  const block = sliceBetween(text, 'const ' + name + ' = {', '};');
  const out = {};
  const re = /([a-z_]+)\s*:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(block))) out[m[1]] = m[2];
  return out;
}

const THEMES = parseThemes(src);
const SK_TABLE = parseSkillTable(src);
const SCHOOL_TH = parseSimpleMap(src, 'SCHOOL_TH');
const TYPE_SIG = parseSimpleMap(src, 'TYPE_SIG');

// ------------------------------------------------------------------ Khuôn lớp hiệu ứng
// Mỗi lớp: kind (bộ vẽ dùng), t (ms bắt đầu), dur (ms), color ('core'|'main'|'dark'|'#rrggbb'),
// params tuỳ kind. Bộ vẽ web và Godot đọc đúng cấu trúc này.
const C = { core: 'core', main: 'main', dark: 'dark' };

// Lớp mở màn: mọi kỹ năng đều có, độ lớn theo bậc (thường / tuyệt kỹ / tuyệt phẩm)
function castLayers(tier) {
  const big = tier === 'superUlt' ? 2.6 : tier === 'ult' ? 1.8 : 1;
  return [
    { kind: 'sigil', t: 0, dur: Math.round(380 * big), color: C.main, params: { r: Math.round(58 * big), y: 'ground' } },
    { kind: 'glow', t: 0, dur: Math.round(300 * big), color: C.main, params: { scale: 1.7 * big, alpha: 0.6 } },
    { kind: 'burst', t: 0, dur: 560, color: C.main, params: { n: Math.round(8 * big), d0: 20, d1: Math.round(60 * big), grav: -26, a0: -3.14159, a1: 0, size: 0.8 } },
  ];
}

function ultLayers() {
  return [
    { kind: 'pillar', t: 0, dur: 700, color: C.main, params: { w: 80, h: 320 } },
    { kind: 'runeDisc', t: 0, dur: 760, color: C.main, params: { r: 84, spin: 200 } },
    { kind: 'flash', t: 0, dur: 180, color: C.main, params: {} },
  ];
}

function superUltLayers() {
  return [
    { kind: 'pillar', t: 0, dur: 900, color: C.main, params: { w: 120, h: 420 } },
    { kind: 'runeDisc', t: 0, dur: 900, color: C.main, params: { r: 120, spin: 260 } },
    { kind: 'flash', t: 0, dur: 260, color: C.main, params: {} },
    { kind: 'shake', t: 0, dur: 320, color: C.main, params: { intensity: 0.014 } },
  ];
}

// Lớp đặc trưng theo "kiểu" (sig) — đây là phần làm mỗi kỹ năng khác nhau
const SIG_LAYERS = {
  // cận chiến
  slash: [{ kind: 'arc', t: 0, dur: 240, color: C.main, params: { r: 70, a0: -0.35, a1: 1.25, thick: 24 } },
    { kind: 'burst', t: 0, dur: 320, color: C.main, params: { n: 4, d1: 40, size: 0.7 } }],
  sweep: [{ kind: 'arc', t: 0, dur: 300, color: C.main, params: { r: 72, a0: -1.5, a1: 1.5, thick: 34 } },
    { kind: 'stream', t: 0, dur: 120, color: C.main, params: { n: 5, w: 30, hh: 40, dx: 60, dy: 0, size: 0.8, life: 340 } }],
  whirl: [{ kind: 'arc', t: 0, dur: 280, color: C.main, params: { r: 55, a0: 0, a1: 2.5, thick: 26, abs: true } },
    { kind: 'arc', t: 0, dur: 280, color: C.main, params: { r: 55, a0: 3.14159, a1: 5.64159, thick: 26, abs: true } },
    { kind: 'ring', t: 0, dur: 360, color: C.main, params: { r1: 66, sy: 0.25, alpha: 0.7 } }],
  cross: [{ kind: 'beam', t: 0, dur: 300, color: C.main, params: { dx: 38, dy: 38, w: 20 } },
    { kind: 'beam', t: 0, dur: 300, color: C.main, params: { dx: 38, dy: -38, w: 20 } },
    { kind: 'glow', t: 0, dur: 260, color: C.core, params: { scale: 1.6 } }],
  thrust: [{ kind: 'beam', t: 0, dur: 260, color: C.main, params: { dx: 100, dy: 0, w: 16 } },
    { kind: 'glow', t: 0, dur: 240, color: C.core, params: { scale: 1.5 } },
    { kind: 'ring', t: 0, dur: 300, color: C.main, params: { r1: 36 } }],
  stab: [{ kind: 'beam', t: 0, dur: 240, color: C.main, params: { dx: 46, dy: 0, w: 9, angle: 'random' } },
    { kind: 'burst', t: 0, dur: 360, color: C.main, params: { n: 5, d1: 40, grav: 30, size: 0.7 } }],
  claw: [{ kind: 'beam', t: 0, dur: 320, color: C.main, params: { dx: 40, dy: 44, w: 12, count: 3, spread: 20 } },
    { kind: 'burst', t: 0, dur: 460, color: C.main, params: { n: 8, d1: 50, grav: 40, size: 0.8 } }],
  bash: [{ kind: 'arc', t: 0, dur: 280, color: C.main, params: { r: 60, a0: -0.95, a1: 0.95, thick: 38 } },
    { kind: 'ring', t: 0, dur: 380, color: C.main, params: { r1: 70, sy: 0.3 } },
    { kind: 'debris', t: 0, dur: 600, color: C.main, params: { n: 6, spread: 50 } }],
  // lướt
  streak: [{ kind: 'ghost', t: 0, dur: 260, color: C.main, params: { alpha: 0.45 } },
    { kind: 'beam', t: 0, dur: 220, color: C.core, params: { dx: -70, dy: 0, w: 3 } }],
  shadow: [{ kind: 'ghost', t: 0, dur: 360, color: C.dark, params: { alpha: 0.7, normal: true } },
    { kind: 'burst', t: 0, dur: 420, color: C.dark, params: { n: 2, d1: 26, size: 1.4, tex: 'fx_dust' } }],
  blood: [{ kind: 'ghost', t: 0, dur: 300, color: C.main, params: { alpha: 0.5 } },
    { kind: 'burst', t: 0, dur: 420, color: C.main, params: { n: 2, d1: 30, grav: 50, size: 0.9 } }],
  charge: [{ kind: 'ghost', t: 0, dur: 200, color: C.main, params: { alpha: 0.25 } },
    { kind: 'burst', t: 0, dur: 440, color: C.main, params: { n: 3, d1: 40, grav: -10, size: 1.6, tex: 'fx_dust' } }],
  dragon: [{ kind: 'ghost', t: 0, dur: 300, color: C.main, params: { alpha: 0.4 } },
    { kind: 'glow', t: 0, dur: 360, color: C.main, params: { scale: 0.9 } },
    { kind: 'glow', t: 60, dur: 360, color: C.dark, params: { scale: 0.9 } }],
  // đạn / tầm xa
  bolt: [{ kind: 'bolt', t: 0, dur: 260, color: C.main, params: { jag: 18, w: 5 } }],
  lance: [{ kind: 'beam', t: 0, dur: 300, color: C.main, params: { dx: 180, dy: 0, w: 14, key: 'fx_lance' } },
    { kind: 'glow', t: 0, dur: 260, color: C.core, params: { scale: 1.2 } }],
  arrow: [{ kind: 'beam', t: 0, dur: 240, color: C.main, params: { dx: 120, dy: 0, w: 8 } },
    { kind: 'burst', t: 0, dur: 300, color: C.main, params: { n: 4, d1: 40, size: 0.7 } }],
  fan: [{ kind: 'beam', t: 0, dur: 260, color: C.main, params: { dx: 110, dy: 0, w: 7, count: 5, spread: 0.22 } }],
  shard: [{ kind: 'burst', t: 0, dur: 440, color: C.main, params: { n: 12, d1: 76, rot: true, tex: 'fx_shard', size: 1 } },
    { kind: 'glow', t: 0, dur: 240, color: C.core, params: { scale: 1.3 } }],
  lightning: [{ kind: 'bolt', t: 0, dur: 300, color: C.main, params: { jag: 26, w: 6, segs: 8 } },
    { kind: 'flash', t: 0, dur: 140, color: C.core, params: {} }],
  dagger: [{ kind: 'beam', t: 0, dur: 240, color: C.main, params: { dx: 90, dy: 0, w: 6, key: 'fx_dagger' } }],
  bird: [{ kind: 'swirl', t: 0, dur: 700, color: C.main, params: { n: 3, r0: 70, r1: 10, turns: 1.4 } }],
  cursed: [{ kind: 'sigil', t: 0, dur: 700, color: C.dark, params: { r: 70, y: 'ground' } },
    { kind: 'burst', t: 0, dur: 520, color: C.dark, params: { n: 10, d1: 70, size: 1 } }],
  holy: [{ kind: 'pillar', t: 0, dur: 640, color: C.main, params: { w: 60, h: 260 } },
    { kind: 'glow', t: 0, dur: 420, color: C.core, params: { scale: 1.6 } }],
  star: [{ kind: 'beam', t: 0, dur: 280, color: C.main, params: { dx: 36, dy: 36, w: 5, count: 4, spread: 1.5708 } },
    { kind: 'glow', t: 0, dur: 260, color: C.core, params: { scale: 1.4 } }],
  disc: [{ kind: 'ring', t: 0, dur: 420, color: C.main, params: { r1: 64 } },
    { kind: 'glow', t: 0, dur: 300, color: C.core, params: { scale: 1.2 } }],
  // vùng
  nova: [{ kind: 'ring', t: 0, dur: 460, color: C.main, params: { r1: 120 } },
    { kind: 'burst', t: 0, dur: 520, color: C.main, params: { n: 14, d1: 110, size: 1 } }],
  frost: [{ kind: 'ring', t: 0, dur: 480, color: C.main, params: { r1: 110, sy: 0.4 } },
    { kind: 'burst', t: 0, dur: 520, color: C.main, params: { n: 12, d1: 90, rot: true, tex: 'fx_snow' } }],
  blizzard: [{ kind: 'stream', t: 0, dur: 600, color: C.main, params: { n: 18, w: 220, hh: 60, dy: 120, size: 1, life: 800 } },
    { kind: 'ring', t: 0, dur: 520, color: C.main, params: { r1: 130, sy: 0.35 } }],
  quake: [{ kind: 'cracks', t: 0, dur: 700, color: C.main, params: { span: 160 } },
    { kind: 'debris', t: 0, dur: 700, color: C.main, params: { n: 10, spread: 90 } },
    { kind: 'shake', t: 0, dur: 400, color: C.main, params: { intensity: 0.012 } }],
  vortex: [{ kind: 'swirl', t: 0, dur: 720, color: C.main, params: { n: 6, r0: 110, r1: 12, turns: 2 } }],
  flame: [{ kind: 'stream', t: 0, dur: 560, color: C.main, params: { n: 16, w: 120, hh: 30, dy: -140, size: 1.1, life: 700 } },
    { kind: 'glow', t: 0, dur: 400, color: C.main, params: { scale: 1.8 } }],
  drain: [{ kind: 'swirl', t: 0, dur: 700, color: C.main, params: { n: 5, r0: 90, r1: 6, turns: 1.6 } },
    { kind: 'glow', t: 0, dur: 380, color: C.core, params: { scale: 1.2 } }],
  miasma: [{ kind: 'sigil', t: 0, dur: 900, color: C.dark, params: { r: 100, y: 'ground' } },
    { kind: 'stream', t: 0, dur: 700, color: C.dark, params: { n: 14, w: 180, hh: 40, dy: -90, size: 1.2, life: 900 } }],
  roar: [{ kind: 'ring', t: 0, dur: 460, color: C.main, params: { r1: 130, sy: 0.3 } },
    { kind: 'shake', t: 0, dur: 320, color: C.main, params: { intensity: 0.01 } }],
  garden: [{ kind: 'sigil', t: 0, dur: 900, color: C.main, params: { r: 90, y: 'ground' } },
    { kind: 'stream', t: 0, dur: 700, color: C.main, params: { n: 12, w: 120, hh: 20, dy: -80, size: 0.9, life: 800 } }],
  blades: [{ kind: 'arc', t: 0, dur: 300, color: C.main, params: { r: 80, a0: -1.2, a1: 1.2, thick: 20 } },
    { kind: 'arc', t: 120, dur: 300, color: C.main, params: { r: 60, a0: 1.9, a1: 4.4, thick: 20, abs: true } }],
  trap: [{ kind: 'sigil', t: 0, dur: 800, color: C.main, params: { r: 80, y: 'ground' } }],
  chain: [{ kind: 'bolt', t: 0, dur: 320, color: C.main, params: { jag: 14, w: 4, segs: 6 } },
    { kind: 'bolt', t: 120, dur: 300, color: C.main, params: { jag: 14, w: 4, segs: 6 } }],
  veil: [{ kind: 'glow', t: 0, dur: 520, color: C.dark, params: { scale: 2.2, alpha: 0.7 } },
    { kind: 'burst', t: 0, dur: 600, color: C.dark, params: { n: 12, d1: 90, tex: 'fx_dust' } }],
  judge: [{ kind: 'pillar', t: 0, dur: 700, color: C.main, params: { w: 90, h: 380 } },
    { kind: 'flash', t: 0, dur: 200, color: C.core, params: {} }],
  dawn: [{ kind: 'glow', t: 0, dur: 620, color: C.main, params: { scale: 2.6, alpha: 0.8 } },
    { kind: 'ring', t: 0, dur: 520, color: C.main, params: { r1: 120 } }],
  elem: [{ kind: 'burst', t: 0, dur: 560, color: C.main, params: { n: 16, d1: 100, rot: true } },
    { kind: 'ring', t: 0, dur: 460, color: C.main, params: { r1: 100 } }],
  // hồi phục / tăng cường
  moon: [{ kind: 'glow', t: 0, dur: 560, color: C.main, params: { scale: 2, alpha: 0.7 } },
    { kind: 'stream', t: 0, dur: 500, color: C.main, params: { n: 10, w: 60, dy: -70, size: 0.9, life: 700 } }],
  drop: [{ kind: 'stream', t: 0, dur: 520, color: C.main, params: { n: 12, w: 70, dy: -60, size: 0.8, life: 700 } }],
  phoenix: [{ kind: 'swirl', t: 0, dur: 800, color: C.main, params: { n: 5, r0: 90, r1: 8, turns: 1.8 } },
    { kind: 'pillar', t: 0, dur: 700, color: C.main, params: { w: 70, h: 300 } }],
  spirit: [{ kind: 'glow', t: 0, dur: 520, color: C.main, params: { scale: 1.8 } },
    { kind: 'swirl', t: 0, dur: 700, color: C.main, params: { n: 4, r0: 70, r1: 10, turns: 1.2 } }],
  rage: [{ kind: 'glow', t: 0, dur: 460, color: C.main, params: { scale: 2, alpha: 0.8 } },
    { kind: 'burst', t: 0, dur: 480, color: C.main, params: { n: 10, d1: 70, grav: -30 } }],
  eye: [{ kind: 'ring', t: 0, dur: 460, color: C.main, params: { r1: 60 } },
    { kind: 'glow', t: 0, dur: 400, color: C.core, params: { scale: 1.4 } }],
  rune: [{ kind: 'runeDisc', t: 0, dur: 760, color: C.main, params: { r: 70, spin: 180 } }],
  bless: [{ kind: 'pillar', t: 0, dur: 640, color: C.main, params: { w: 50, h: 240 } },
    { kind: 'glow', t: 0, dur: 420, color: C.core, params: { scale: 1.5 } }],
  clones: [{ kind: 'ghost', t: 0, dur: 420, color: C.main, params: { alpha: 0.5 } },
    { kind: 'ghost', t: 90, dur: 420, color: C.dark, params: { alpha: 0.4 } }],
  wings: [{ kind: 'beam', t: 0, dur: 420, color: C.main, params: { dx: 40, dy: -40, w: 10, count: 2, spread: 1.5708 } },
    { kind: 'glow', t: 0, dur: 400, color: C.core, params: { scale: 1.6 } }],
  bloodlust: [{ kind: 'glow', t: 0, dur: 520, color: C.main, params: { scale: 1.9 } },
    { kind: 'burst', t: 0, dur: 520, color: C.main, params: { n: 12, d1: 70, grav: 40 } }],
  awaken: [{ kind: 'pillar', t: 0, dur: 760, color: C.main, params: { w: 80, h: 320 } },
    { kind: 'runeDisc', t: 0, dur: 800, color: C.main, params: { r: 90, spin: 220 } },
    { kind: 'flash', t: 0, dur: 200, color: C.main, params: {} }],
  orbit: [{ kind: 'swirl', t: 0, dur: 760, color: C.main, params: { n: 5, r0: 80, r1: 20, turns: 1.5 } }],
  // thủ thế / khiên
  shield: [{ kind: 'ring', t: 0, dur: 460, color: C.main, params: { r1: 56 } },
    { kind: 'glow', t: 0, dur: 400, color: C.main, params: { scale: 1.6 } }],
  counter: [{ kind: 'arc', t: 0, dur: 280, color: C.main, params: { r: 60, a0: -1.2, a1: 1.2, thick: 26 } },
    { kind: 'glow', t: 0, dur: 300, color: C.core, params: { scale: 1.3 } }],
  fortress: [{ kind: 'sigil', t: 0, dur: 900, color: C.main, params: { r: 100, y: 'ground' } },
    { kind: 'ring', t: 0, dur: 520, color: C.main, params: { r1: 100, sy: 0.3 } }],
  thorn: [{ kind: 'burst', t: 0, dur: 520, color: C.main, params: { n: 14, d1: 80, rot: true, tex: 'fx_shard' } }],
  cloak: [{ kind: 'glow', t: 0, dur: 520, color: C.dark, params: { scale: 2, alpha: 0.75 } }],
  angel: [{ kind: 'pillar', t: 0, dur: 700, color: C.main, params: { w: 70, h: 300 } },
    { kind: 'glow', t: 0, dur: 460, color: C.core, params: { scale: 1.8 } }],
  dome: [{ kind: 'ring', t: 0, dur: 560, color: C.main, params: { r1: 110 } },
    { kind: 'sigil', t: 0, dur: 800, color: C.main, params: { r: 90, y: 'ground' } }],
  crystal: [{ kind: 'burst', t: 0, dur: 520, color: C.main, params: { n: 10, d1: 70, rot: true, tex: 'fx_shard' } },
    { kind: 'glow', t: 0, dur: 400, color: C.core, params: { scale: 1.4 } }],
  soul: [{ kind: 'swirl', t: 0, dur: 760, color: C.main, params: { n: 5, r0: 80, r1: 8, turns: 1.6 } },
    { kind: 'glow', t: 0, dur: 460, color: C.main, params: { scale: 1.5 } }],
  // vật nặng rơi
  sword: [{ kind: 'fall', t: 0, dur: 300, color: C.main, params: { shape: 'sword', r: 180 } }],
  blade: [{ kind: 'fall', t: 0, dur: 300, color: C.main, params: { shape: 'blade', r: 180 } }],
  hammer: [{ kind: 'fall', t: 0, dur: 300, color: C.main, params: { shape: 'hammer', r: 180 } }],
  steel: [{ kind: 'fall', t: 0, dur: 300, color: C.main, params: { shape: 'steel', r: 180 } }],
  void: [{ kind: 'fall', t: 0, dur: 300, color: C.dark, params: { shape: 'void', r: 200 } }],
  // mưa tên / thiên thạch
  storm: [{ kind: 'arrowZone', t: 0, dur: 1300, color: C.main, params: { halfW: 160 } }],
  net: [{ kind: 'arrowZone', t: 0, dur: 1300, color: C.main, params: { halfW: 160 } },
    { kind: 'swirl', t: 0, dur: 700, color: C.main, params: { n: 5, r0: 140, r1: 60, turns: 2 } }],
  fire: [{ kind: 'meteor', t: 0, dur: 600, color: C.main, params: { r: 200 } }],
  hell: [{ kind: 'meteor', t: 0, dur: 600, color: C.main, params: { r: 220 } },
    { kind: 'sigil', t: 0, dur: 900, color: C.dark, params: { r: 120, y: 'ground' } }],
  // tuyệt phẩm
  execute: [{ kind: 'arc', t: 0, dur: 520, color: C.core, params: { r: 70, a0: -2.827, a1: 0.471, thick: 42, abs: true } },
    { kind: 'flash', t: 0, dur: 200, color: C.core, params: {} }],
  fusion: [{ kind: 'sigil', t: 0, dur: 1100, color: C.main, params: { r: 128, y: 'ground' } },
    { kind: 'pillar', t: 0, dur: 900, color: C.main, params: { w: 90, h: 380 } },
    { kind: 'runeDisc', t: 0, dur: 900, color: C.main, params: { r: 96, spin: 240 } }],
  manaburst: [{ kind: 'sigil', t: 0, dur: 1000, color: C.main, params: { r: 300, y: 'ground' } },
    { kind: 'pillar', t: 0, dur: 800, color: C.main, params: { w: 120, h: 460 } },
    { kind: 'stream', t: 0, dur: 600, color: C.main, params: { n: 26, w: 420, dy: -170, size: 1.3, life: 900 } }],
  allin: [{ kind: 'burst', t: 0, dur: 700, color: C.main, params: { n: 24, d1: 160, rot: true, size: 1.3 } },
    { kind: 'ring', t: 0, dur: 600, color: C.main, params: { r1: 200 } },
    { kind: 'flash', t: 0, dur: 260, color: C.core, params: {} }],
  // khác
  hop: [{ kind: 'ring', t: 0, dur: 360, color: C.main, params: { r1: 70, sy: 0.25 } },
    { kind: 'ghost', t: 0, dur: 300, color: C.main, params: { alpha: 0.4 } }],
  blink: [{ kind: 'glow', t: 0, dur: 340, color: C.main, params: { scale: 2.4 } },
    { kind: 'ring', t: 0, dur: 360, color: C.main, params: { r1: 60 } },
    { kind: 'sigil', t: 0, dur: 420, color: C.main, params: { r: 50, y: 'ground' } }],
  smoke: [{ kind: 'burst', t: 0, dur: 560, color: C.dark, params: { n: 14, d1: 70, size: 1.8, tex: 'fx_dust' } },
    { kind: 'ghost', t: 0, dur: 320, color: C.dark, params: { alpha: 0.6, normal: true } }],
  summon: [{ kind: 'sigil', t: 0, dur: 900, color: C.main, params: { r: 78, y: 'ground' } },
    { kind: 'pillar', t: 0, dur: 640, color: C.main, params: { w: 60, h: 260 } }],
  // mặc định
  default: [{ kind: 'burst', t: 0, dur: 480, color: C.main, params: { n: 10, d1: 70 } },
    { kind: 'glow', t: 0, dur: 320, color: C.core, params: { scale: 1.2 } }],
};

// Layer nào vẽ ở thời điểm nào. skills.js gọi sfx() với nhiều "kind" khác nhau trong một chiêu
// (cast, melee, dashStep, aoe...). Trường trigger giúp bộ vẽ chỉ vẽ đúng nhóm layer ứng với lần gọi,
// không vẽ lại toàn bộ chiêu ở mỗi lần gọi.
function triggerOfSig(sig, skill, id) {
  if (id === 'ulSinhTu') return 'execute';
  if (id === 'ulTuLinhDungHop') return 'fusion';
  if (id === 'ulPhapSuper') return 'manaburst';
  if (id === 'ulToanNangSuper') return 'allin';
  switch (skill.type) {
    case 'melee': return 'melee';
    case 'dash': return 'dashStep';
    case 'backstep': return 'backstep';
    case 'aoe': case 'shadow_command': return 'aoe';
    case 'heal': return 'heal';
    case 'buff': return 'buff';
    case 'guard': return 'guard';
    case 'manashield': return 'shield';
    case 'summon': case 'shadow_toggle': return 'summon';
    case 'sword_fall': return 'fall';
    case 'arrow_rain': return 'arrowZone';
    case 'meteor': return 'meteor';
    case 'projectile': case 'spread': return 'cast';
    default: return sig;
  }
}

function layersFor(skill, theme, sig, id) {
  const tier = skill.superUlt ? 'superUlt' : skill.ult ? 'ult' : 'normal';
  const trigger = triggerOfSig(sig, skill, id);
  const out = castLayers(tier).map((l) => ({ ...l, trigger: 'cast' }));
  const sigLayers = SIG_LAYERS[sig] || SIG_LAYERS.default;
  for (const l of sigLayers) out.push({ ...JSON.parse(JSON.stringify(l)), trigger });
  if (tier === 'ult') for (const l of ultLayers()) out.push({ ...l, trigger: 'cast' });
  if (tier === 'superUlt') for (const l of superUltLayers()) out.push({ ...l, trigger: 'cast' });
  return out;
}

// ------------------------------------------------------------------ Sinh file
function themeOf(id, skill) {
  const entry = SK_TABLE[id];
  const key = (entry && THEMES[entry.theme] && entry.theme) || SCHOOL_TH[skill.school] || 'arcane';
  return THEMES[key] ? key : 'arcane';
}

function sigOf(id, skill) {
  const entry = SK_TABLE[id];
  return (entry && entry.sig) || TYPE_SIG[skill.type] || 'nova';
}

function buildRecipe(id, skill) {
  const theme = themeOf(id, skill);
  const th = THEMES[theme] || { colors: ['0xffffff', '0xe0b3ff', '0x9b4dff'], texture: 'fx_star', dark: false };
  const sig = sigOf(id, skill);
  return {
    id,
    name: skill.name || id,
    school: skill.school || '',
    type: skill.type || '',
    tier: skill.superUlt ? 'superUlt' : skill.ult ? 'ult' : 'normal',
    theme,
    sig,
    colors: th.colors,
    texture: th.texture,
    dark: !!th.dark,
    layers: layersFor(skill, theme, sig, id),
  };
}

function sha16(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
}

function main() {
  if (!fs.existsSync(OUT_DIR) && !DRY) fs.mkdirSync(OUT_DIR, { recursive: true });

  const ids = Object.keys(SKILLS).sort();
  if (!ids.length) {
    console.error('Không đọc được GameData.SKILLS — kiểm tra shared/index.js');
    process.exit(1);
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    count: 0,
    skills: {},
  };

  let created = 0;
  let skipped = 0;
  let overwritten = 0;

  for (const id of ids) {
    if (ONLY && !ONLY.has(id)) continue;
    const skill = SKILLS[id] || {};
    const file = id + '.json';
    const abs = path.join(OUT_DIR, file);
    const exists = fs.existsSync(abs);

    if (exists && !FORCE) {
      // Giữ nguyên file đã tinh chỉnh, nhưng vẫn ghi vào manifest (đọc lại để lấy hash thật)
      const text = fs.readFileSync(abs, 'utf8');
      let parsed = {};
      try { parsed = JSON.parse(text); } catch (err) {
        console.warn(`  ! ${file} không phải JSON hợp lệ, bỏ qua trong manifest: ${err.message}`);
        skipped++;
        continue;
      }
      manifest.skills[id] = {
        file,
        hash: sha16(text),
        name: parsed.name || skill.name || id,
        school: parsed.school || skill.school || '',
        type: parsed.type || skill.type || '',
        tier: parsed.tier || (skill.superUlt ? 'superUlt' : skill.ult ? 'ult' : 'normal'),
        theme: parsed.theme || themeOf(id, skill),
        sig: parsed.sig || sigOf(id, skill),
      };
      skipped++;
      continue;
    }

    const recipe = buildRecipe(id, skill);
    const text = JSON.stringify(recipe, null, 2) + '\n';
    if (!DRY) fs.writeFileSync(abs, text, 'utf8');
    manifest.skills[id] = {
      file,
      hash: sha16(text),
      name: recipe.name,
      school: recipe.school,
      type: recipe.type,
      tier: recipe.tier,
      theme: recipe.theme,
      sig: recipe.sig,
    };
    if (exists) overwritten++; else created++;
  }

  manifest.count = Object.keys(manifest.skills).length;

  if (!DRY) {
    fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  }

  console.log(`skillfx: ${manifest.count} kỹ năng`);
  console.log(`  tạo mới: ${created} · giữ nguyên (đã có): ${skipped} · ghi đè: ${overwritten}`);
  console.log(`  thư mục: ${OUT_DIR}${DRY ? '  (--dry: không ghi gì)' : ''}`);
  if (DRY) console.log('  (chạy lại không có --dry để ghi thật)');
}

main();
