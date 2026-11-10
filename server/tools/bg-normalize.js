/*
 * Chuyển gói nền parallax tải về (assets_raw/bg/<pack>/src) thành 4 lớp game dùng
 * (public/assets/bg/<pack>/{sky,far,mid,near}.png), tương ứng bg_<theme>_<lớp> vẽ bằng code.
 *
 *   node server/tools/bg-normalize.js            → mọi pack trong JOBS
 *   node server/tools/bg-normalize.js plains ... → chỉ các pack được nêu
 *
 * Mỗi lớp game = ghép nhiều file nguồn (dưới → trên). Công cụ:
 *   - kiểm tra nối ngang (cột cuối ↔ cột đầu); lệch nhiều thì in cảnh báo để loại pack hoặc vá tay
 *   - phóng nguyên bội NEAREST (scale) cho pixel art, để game lọc LINEAR cho mượt
 *   - ghi PNG (bảng màu nếu ≤ 256 màu) và in dung lượng từng lớp
 * Xong thì khai báo `pack: '<tên>'` cho map trong public/js/scene/map_looks.js.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./lib-png');

const ROOT = path.join(__dirname, '..', '..');
const RAW = path.join(ROOT, 'assets_raw', 'bg');
const OUT = path.join(ROOT, 'public', 'assets', 'bg');

const JOBS = {
  // Digital Moons "Parallax Forest Background (Seamless)" – tranh vẽ tay HD 1920×1080, rừng sương xanh.
  // Thu 0,75× (1440×810) để nhẹ bộ nhớ GPU; layer có thể kèm độ mờ: { f, a }.
  misty: {
    dir: 'digitalmoons_forest/src/Parallax Forest Background (Seamless)/Parallax Forest Background - Blue',
    resize: 0.75,
    layers: {
      sky: ['10_Sky.png'],
      far: ['09_Forest.png', '08_Forest.png', '07_Forest.png'],
      mid: ['06_Forest.png', '05_Particles.png'],
      near: ['04_Forest.png', '03_Particles.png', '02_Bushes.png', { f: '01_Mist.png', a: 0.5 }],
    },
  },

  // Digital Moons "Parallax Desert Background (Seamless)" – tranh vẽ tay HD 1920×1080: núi tím đêm, trăng, mây (đặt tên 'night').
  night: {
    dir: 'digitalmoons_desert/src/Parallax Desert Background (Seamless)/Parallax Desert Background (Seamless)',
    resize: 0.75,
    layers: {
      sky: ['01_Sky.png', '02_Stars.png', '03_Moon.png'],
      far: [{ f: '04_Cloud.png', a: 0.9 }, { f: '05_Cloud.png', a: 0.9 }, { f: '06_Cloud.png', a: 0.9 }, { f: '07_Cloud.png', a: 0.9 },
        { f: '08_Cloud.png', a: 0.9 }, '09_Cloudsmall.png', '10_Cloudsmall.png'],
      mid: ['11_Mountains.png'],
      near: ['12_Desert.png'],
    },
  },

  // oleekconder "Hand painted – Parallax 1" – tranh vẽ tay, hoàng hôn núi xanh + rừng thông + đồng cỏ.
  // Các dải rộng 5000 nhưng cao khác nhau, đặt vào khung 5000×2160 (căn đáy; trời căn đỉnh), thu 0,4× → 2000×864.
  sunset: {
    dir: 'oleekconder_parallax1/src',
    canvas: [5000, 2160],
    resize: 0.4,
    layers: {
      sky: [{ f: 'Layer0.png', at: 'top', fillDown: true }],
      far: [{ f: 'Clouds.png', at: 500, a: 0.95 }, 'Layer1.png'],
      mid: ['Layer2.png', { f: 'Fog.png', a: 0.5 }],
      near: ['Layer3.png', 'Layer4.png'],
    },
  },

  // Admurin "Parallax Backgrounds: Plains" 384×216 (0 = ảnh ghép sẵn, bỏ). Dưới → trên.
  plains: {
    scale: 3,
    layers: {
      sky: ['8.png'],
      far: ['7.png', '6.png'],            // núi sau, núi trước
      mid: ['5.png', '4.png'],            // rừng thông đen, rừng thông xanh thẫm
      near: ['3.png', '2.png', '1.png'],  // rừng thông xanh, đồi cỏ, cỏ rìa
    },
  },
};

function over(dst, src) {   // vẽ src lên dst (cùng cỡ, alpha thường)
  for (let i = 0; i < dst.length; i += 4) {
    const a = src[i + 3] / 255; if (!a) continue;
    const ba = dst[i + 3] / 255, oa = a + ba * (1 - a);
    for (let c = 0; c < 3; c++) dst[i + c] = Math.round((src[i + c] * a + dst[i + c] * ba * (1 - a)) / oa);
    dst[i + 3] = Math.round(oa * 255);
  }
}
// Độ lệch trung bình giữa 2 cột liền kề trong ảnh, so với độ lệch ở chỗ nối cột cuối → cột đầu
function seam(W, H, px) {
  const diff = (x1, x2) => { let s = 0; for (let y = 0; y < H; y++) for (let c = 0; c < 4; c++) s += Math.abs(px[(y * W + x1) * 4 + c] - px[(y * W + x2) * 4 + c]); return s / (H * 4); };
  let inner = 0; for (let x = 0; x < W - 1; x++) inner += diff(x, x + 1); inner /= W - 1;
  return { inner, wrap: diff(W - 1, 0) };
}
function upscale(W, H, px, k) {
  if (k === 1) return { W, H, px };
  const out = Buffer.alloc(W * k * H * k * 4);
  for (let y = 0; y < H * k; y++) for (let x = 0; x < W * k; x++) px.copy(out, (y * W * k + x) * 4, ((y / k | 0) * W + (x / k | 0)) * 4, ((y / k | 0) * W + (x / k | 0)) * 4 + 4);
  return { W: W * k, H: H * k, px: out };
}

// Craftpix "Free Crystal Cave Pixel Backgrounds" 576×324: mỗi nền là MỘT cảnh nhiều lớp (Plan N = sau cùng … Plan 1 = trước nhất),
// không phải họa tiết lặp → ghép thêm bản lật gương cho lặp ngang liền mạch (mirror). Pixel art giữ nguyên cỡ, game lọc NEAREST.
for (const [i, n] of [[1, 5], [2, 4], [3, 4], [4, 5]]) {
  const plan = (k) => `Plan ${k}.png`;
  JOBS['cave' + i] = {
    dir: `craftpix_crystal_cave/src/PNG/background ${i}`,
    mirror: true,
    layers: {
      sky: [plan(n)],
      far: [plan(n - 1)],
      mid: [plan(n - 2)],
      near: n === 5 ? [plan(2), plan(1)] : [plan(1)],
    },
  };
}
// Craftpix freebies vector HD 1920×1080 (mỗi nền gồm nhiều lớp Plan): ghép về 4 lớp game.
// files = thứ tự từ SAU ra TRƯỚC. Quy tắc chia: sky = lớp sau cùng; near = 1–3 lớp trước nhất (nền đất, vật gần); còn lại chia đôi far / mid.
function craftpixJob(dir, files) {
  const n = files.length, k = n >= 8 ? 3 : n >= 6 ? 2 : 1;
  const mid_all = files.slice(1, n - k), half = Math.ceil(mid_all.length / 2);
  return { dir, resize: 0.75, layers: { sky: [files[0]], far: mid_all.slice(0, half), mid: mid_all.slice(half), near: files.slice(n - k) } };
}
const seq = (n, desc) => Array.from({ length: n }, (_, i) => (desc ? n - i : i + 1) + '.png');
// Underwater (uw1..4), Halloween (hal1..4): lớp 1 = sau; Fairy-Tale (fai1..4): lớp 7 = sau
[[1, 8], [2, 6], [3, 6], [4, 6]].forEach(([i, n]) => { JOBS['uw' + i] = craftpixJob(`craftpix_underwater/src/PNG/${i}_game_background/layers`, seq(n)); });
[[1, 7], [2, 6], [3, 9], [4, 7]].forEach(([i, n]) => { JOBS['hal' + i] = craftpixJob(`craftpix_halloween/src/PNG/${i}_game_background/layers`, seq(n)); });
[1, 2, 3, 4].forEach((i) => { JOBS['fai' + i] = craftpixJob(`craftpix_fairytale/src/_PNG/${i}`, seq(7, true)); });
// Beach (bch1..4): lớp đặt tên; thứ tự sau→trước: sky, sun, sea, cloud, island, land, decor (lớp nào thiếu thì bỏ)
[1, 2, 3, 4].forEach((i) => {
  const dir = `craftpix_beach/src/PNG/game_background_${i}/layers`;
  const files = ['sky', 'sun', 'sea', 'cloud', 'island', 'land', 'decor'].map(n => n + '.png').filter(f => fs.existsSync(path.join(RAW, dir, f)));
  JOBS['bch' + i] = craftpixJob(dir, files);
});

// Craftpix freebies đợt 2 (thứ tự lớp đã dò bằng cách thử hoán vị so với ảnh tổng hợp):
//   win1..4  Winter Holiday (1920×1080): rừng thông tuyết ngày / làng tuyết ngày / làng tuyết đêm có núi / cây thông Giáng sinh đêm
//   cfr1..4  Cartoon Forest (3840×2160 → 1440×810): rừng xanh / rừng huyền ảo đom đóm / rừng nắng / rừng thu đèn lồng nấm sáng
//   des1..4  Scrolling Desert: hẻm đá tím / ốc đảo xương rồng / cồn cát xương hóa thạch / cồn cát xương rồng
//   elv3,elv4  Elven Land (3840×2160): tàn tích vòm đá / tường thành bên sông có làng
//   hor1,3,4 Horizontal: núi hồ / rừng thông đêm sao / thác nước hồ pastel
const lay = (dir, resize, sky, far, mid, near) => ({ dir, resize, layers: { sky, far, mid, near } });
[1, 2, 3, 4].forEach((i) => {
  JOBS['win' + i] = lay(`craftpix_winter/src/PNG/BG_0${i}/Layers`, 0.75, i === 4 ? ['Sky.png', 'Moon.png'] : ['Sky.png'], ['BG.png'], ['Middle.png'], ['Foreground.png', 'Ground_01.png', 'Snow.png', 'Ground_02.png']);
  JOBS['cfr' + i] = lay(`craftpix_cartoonforest/src/PNG/Cartoon_Forest_BG_0${i}/Layers`, 0.375, ['Sky.png'], ['BG_Decor.png'], ['Middle_Decor.png'], ['Foreground.png', 'Ground.png']);
  JOBS['des' + i] = lay(`craftpix_desert/src/${i}`, 0.75, ['1.png'], ['2.png', '3.png'], ['4.png'], ['5.png']);
});
[3, 4].forEach((i) => {
  JOBS['elv' + i] = lay(`craftpix_elven/src/PNG/game_background_${i}/layers`, 0.375, ['battleground.png', 'back_land.png'], ['back_decor.png'], ['ground_decor.png'], ['front_decor.png']);
});
// Vampire Battle (3840×2160): các lớp là dải có vị trí riêng (không có PSD) → dùng ảnh tổng hợp làm nền cố định, lật gương, 3 lớp còn lại rỗng
//   vamp1 ban công lâu đài / vamp2 sảnh ngai kính màu / vamp3 cổng lâu đài trăng dơi / vamp4 nghĩa địa trăng đỏ
[['1', 'terrace.png'], ['2', 'throne room.png'], ['3', 'castle.png'], ['4', 'dead forest.png']].forEach(([i, f]) => {
  JOBS['vamp' + i] = Object.assign(lay('craftpix_vampire/src/PNG/' + i, 0.375, [f], [], [], []), { mirror: true });
});
// Bongseng (3800×1200 pixel art, CC: dùng/sửa được trong dự án thương mại, cấm bán lại): thành phố đêm / đổ nát / đồng quê; lọc NEAREST
JOBS.bcn = lay('bongseng_city/src/parallax/city night', 0.5, ['parallaxcitywater.png', 'parallaxcitysky.png'], ['parallaxcitybackgroundmountain2.png', 'parallaxcitybackgroundmountain.png'],
  ['parallaxcitywaterreflexion.png', 'parallaxcitybuildings.png'], ['parallaxcityfront.png']);   // 'water' là mảng nền navy toàn khung, nằm SAU lớp trời
JOBS.bcd = lay('bongseng_city/src/parallax/city destroyed', 0.5, ['parallaxcitydestroyedsky.png'], ['parallaxcitydestroyedbuildings.png', 'parallaxcitydestroyedbuildingssmoke.png'],
  ['parallaxcitydestroyedwater.png', 'parallaxcitydestroyedbuildingreflexion.png'], ['parallaxcitydestroyedfrontsmoke.png']);
JOBS.bcd.mirror = true;   // thành phố đổ nát không lặp liền → ghép gương
JOBS.brl = lay('bongseng_city/src/parallax/rural area', 0.5, ['ruralparallaxsky.png', 'ruralparallaxclouds.png'],
  ['ruralparallaxmountainback2.png', 'ruralparallaxmountainback.png', 'ruralparallaxmountain.png'], ['ruralparallaxvillage.png'],
  ['ruralparallaxriverskyredlex.png', 'ruralparallaxriver.png', 'ruralparallaxriverfront.png']);
JOBS.elv2 = lay('craftpix_elven/src/PNG/game_background_2/layers', 0.375, ['back_land.png'], ['back_decor.png'], ['battleground.png'], ['front_decor.png', 'ground_decor.png']);   // đảo nổi có tháp (thứ tự khớp 0,33)
JOBS.elv2.mirror = true;
JOBS.elv4.mirror = true;   // không lặp liền mạch → ghép gương
JOBS.des3.mirror = true;
JOBS.hor1 = lay('craftpix_horizontal/src/PNG/game_background_1/layers', 0.75, ['sky.png'], ['clouds_1.png', 'clouds_2.png', 'rocks_1.png', 'clouds_3.png'], ['rocks_2.png'], ['clouds_4.png']);
JOBS.hor3 = lay('craftpix_horizontal/src/PNG/game_background_3/layers', 0.75, ['sky.png'], ['clouds_1.png', 'rocks.png', 'clouds_2.png'], ['ground_1.png', 'ground_2.png'], ['ground_3.png', 'plant.png']);
JOBS.hor4 = lay('craftpix_horizontal/src/PNG/game_background_4/layers', 0.75, ['sky.png'], ['clouds_1.png', 'rocks.png'], ['clouds_2.png'], ['ground.png']);

// Nối bản lật gương bên phải ảnh: ảnh rộng gấp đôi, cột cuối khớp cột đầu
function mirrorX(W, H, px) {
  const out = Buffer.alloc(W * 2 * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = (y * W + x) * 4;
    px.copy(out, (y * W * 2 + x) * 4, s, s + 4);
    px.copy(out, (y * W * 2 + (2 * W - 1 - x)) * 4, s, s + 4);
  }
  return { W: W * 2, H, px: out };
}

// Thu nhỏ bằng trung bình theo diện tích (alpha nhân sẵn, tránh viền đen ở mép trong suốt)
function downscale(W, H, px, f) {
  const w = Math.round(W * f), h = Math.round(H * f), out = Buffer.alloc(w * h * 4), sx = W / w, sy = H / h;
  for (let y = 0; y < h; y++) {
    const y0 = y * sy, y1 = (y + 1) * sy;
    for (let x = 0; x < w; x++) {
      const x0 = x * sx, x1 = (x + 1) * sx;
      let r = 0, g = 0, b = 0, a = 0, wt = 0;
      for (let yy = Math.floor(y0); yy < Math.min(H, Math.ceil(y1)); yy++) {
        const wy = Math.min(yy + 1, y1) - Math.max(yy, y0);
        for (let xx = Math.floor(x0); xx < Math.min(W, Math.ceil(x1)); xx++) {
          const ww = wy * (Math.min(xx + 1, x1) - Math.max(xx, x0)), i = (yy * W + xx) * 4, al = px[i + 3] / 255;
          r += px[i] * al * ww; g += px[i + 1] * al * ww; b += px[i + 2] * al * ww; a += al * ww; wt += ww;
        }
      }
      const o = (y * w + x) * 4;
      if (a > 0) { out[o] = Math.round(r / a); out[o + 1] = Math.round(g / a); out[o + 2] = Math.round(b / a); }
      out[o + 3] = Math.round(a / wt * 255);
    }
  }
  return { W: w, H: h, px: out };
}

let total = 0;
const want = process.argv.slice(2);
for (const [pack, job] of Object.entries(JOBS)) {
  if (want.length && !want.includes(pack)) continue;
  const src = path.join(RAW, job.dir || ('admurin_' + pack + '/src'));
  const dir = path.join(OUT, pack); fs.mkdirSync(dir, { recursive: true });
  for (const [layer, files] of Object.entries(job.layers)) {
    if (!files.length) {   // lớp rỗng: PNG trong suốt 2×2 (che hình vẽ code của lớp này)
      fs.writeFileSync(path.join(dir, layer + '.png'), encode(2, 2, Buffer.alloc(16))); console.log(pack + '/' + layer + '.png  (rỗng)'); continue;
    }
    let base = null;
    for (const item of files) {
      const f = typeof item === 'string' ? item : item.f, alpha = typeof item === 'string' || item.a == null ? 1 : item.a;
      const img = decode(path.join(src, f));
      if (alpha < 1) for (let i = 3; i < img.px.length; i += 4) img.px[i] = Math.round(img.px[i] * alpha);
      if (!base) base = job.canvas ? { W: job.canvas[0], H: job.canvas[1], px: Buffer.alloc(job.canvas[0] * job.canvas[1] * 4) }
        : { W: img.W, H: img.H, px: Buffer.alloc(img.W * img.H * 4) };
      if (img.W !== base.W) throw new Error(`${f}: khác chiều rộng các lớp còn lại`);
      if (img.H === base.H) over(base.px, img.px);
      else {
        // Dải thấp hơn khung (job.canvas): đặt theo item.at = 'top' | 'bottom' | số px từ trên
        const at = typeof item === 'string' ? 'bottom' : (item.at ?? 'bottom');
        const y0 = at === 'top' ? 0 : at === 'bottom' ? base.H - img.H : at;
        const strip = Buffer.alloc(base.W * base.H * 4);
        img.px.copy(strip, y0 * base.W * 4);
        // fillDown: lặp dòng cuối của dải xuống tới đáy khung (lấp khoảng trống dưới lớp trời)
        if (typeof item !== 'string' && item.fillDown) for (let y = y0 + img.H; y < base.H; y++) strip.copy(strip, y * base.W * 4, (y0 + img.H - 1) * base.W * 4, (y0 + img.H) * base.W * 4);
        over(base.px, strip);
      }
    }
    if (job.mirror) base = mirrorX(base.W, base.H, base.px);
    const s = seam(base.W, base.H, base.px);
    const big = job.resize ? downscale(base.W, base.H, base.px, job.resize) : upscale(base.W, base.H, base.px, job.scale || 1);
    const buf = encode(big.W, big.H, big.px);
    fs.writeFileSync(path.join(dir, layer + '.png'), buf);
    total += buf.length;
    console.log(`${pack}/${layer}.png  ${big.W}x${big.H}  ${(buf.length / 1024).toFixed(0)}KB  nối ngang: nối ${s.wrap.toFixed(1)} vs thường ${s.inner.toFixed(1)}${s.wrap > Math.max(6, s.inner * 6) ? '  ⚠ CÓ THỂ LỘ ĐƯỜNG NỐI' : '  ok'}`);
  }
}
console.log(`Tổng: ${(total / 1024).toFixed(0)}KB`);
