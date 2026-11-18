'use strict';
/*
 * Phục vụ file tĩnh cho nhanh:
 *  - Gộp toàn bộ file JS của game (theo thứ tự trong public/index.html) và 32 file bản đồ thành MỘT file
 *    /app.<mã>.js. Mã đổi khi nội dung đổi → trình duyệt lưu lâu dài, chỉ tải lại khi có bản mới.
 *    Tự gộp lại khi file nguồn thay đổi (không cần khởi động lại server, không cần công cụ build).
 *  - Nén brotli/gzip sẵn trong bộ nhớ (nén một lần, dùng lại cho mọi lượt tải). Nén BẤT ĐỒNG BỘ
 *    để không chặn event loop; nhiều request cùng lúc chỉ nén một lần (inflight promise).
 *  - ETag: file không có mã phiên bản thì trình duyệt hỏi lại và nhận 304 "vẫn như cũ" (không tải lại).
 *  - URL có ?v=... hoặc /app.<mã>.js: cho lưu 1 năm (immutable).
 *  - Cache file: ảnh nhỏ giữ raw trong RAM; ảnh lớn chỉ giữ metadata, đọc lại khi gửi. Tổng raw
 *    bị giới hạn (LRU) nên RAM không phình theo số bản đồ đã đi qua.
 *  - Signature phát đổi file qua fs.watch (fallback: quét định kỳ nếu watch không bật).
 * Đặt NO_BUNDLE=1 để phục vụ từng file riêng như cũ (tiện gỡ lỗi).
 */
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.txt', '.json', '.svg', '.webmanifest']);
const YEAR = 'public, max-age=31536000, immutable';
const hash = (buf) => crypto.createHash('sha1').update(buf).digest('base64url').slice(0, 12);

// Nén: brotli q5 / gzip 6 — rẻ hơn q9/9 khoảng 2 lần, chỉ to hơn ~9KB / ~2KB (bench-compress.js).
const BROTLI_OPTS = { params: {
  [zlib.constants.BROTLI_PARAM_QUALITY]: Number(process.env.BROTLI_QUALITY) || 5,
  [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0,
} };
const GZIP_OPTS = { level: Number(process.env.GZIP_LEVEL) || 6 };
// Giữ raw của file nhỏ trong RAM; file lớn hơn chỉ lưu metadata + đọc lại khi cần gửi.
// 2MB: gần như mọi ảnh thường gặp đều được giữ raw (chỉ vài ảnh nền >2MB là đọc lại).
// Đo thực tế (bench-memory.js): 2MB/128MB → lượt hai ~18ms; 1MB/128MB → 22ms.
const RAW_MAX_BYTES = Number(process.env.STATIC_RAW_MAX) || 2 * 1024 * 1024;
// Tổng raw tối đa trong cache (LRU). 0 = không giới hạn (chế độ cũ).
// 128MB đủ cao để LRU hầu như không bao giờ phải đuổi ảnh trong một phiên chơi bình thường.
const CACHE_MAX_BYTES = Number(process.env.STATIC_CACHE_MAX) || 128 * 1024 * 1024;
const WATCH = process.env.STATIC_NO_WATCH !== '1';

module.exports = function createStatic(ROOT) {
  const PUBLIC = path.join(ROOT, 'public');
  const SHARED = path.join(ROOT, 'shared');
  const FONTS = path.join(ROOT, 'node_modules', '@fontsource', 'be-vietnam-pro', 'files');
  const PHASER = path.join(ROOT, 'node_modules', 'phaser', 'dist', 'phaser.min.js');
  const PHASER_V = (() => { try { return require(path.join(ROOT, 'node_modules', 'phaser', 'package.json')).version; } catch { return '1'; } })();
  const NO_BUNDLE = process.env.NO_BUNDLE === '1';
  const DIRS = [['/shared/', SHARED], ['/fonts/', FONTS], ['/', PUBLIC]];

  // ------------------------------------------------------------ Bộ nhớ đệm file (đọc + nén một lần)
  // entry: { mtime, size, etag, type, raw, gz, br, zip, pinned, last, gzJob, brJob }
  //   raw  = Buffer hoặc null (ảnh lớn). gz/br = Buffer hoặc null. gzJob/brJob = promise nén đang chạy.
  const files = new Map();
  let cacheBytes = 0;

  function touch(e) { e.last = Date.now(); }

  function evict() {
    if (!CACHE_MAX_BYTES || cacheBytes <= CACHE_MAX_BYTES) return;
    // LRU thật: xoá raw của những entry lâu chưa dùng nhất trước.
    const victims = [];
    for (const e of files.values()) if (e.raw && !e.pinned) victims.push(e);
    victims.sort((a, b) => a.last - b.last);
    for (const e of victims) {
      if (cacheBytes <= CACHE_MAX_BYTES) break;
      cacheBytes -= e.raw.length;
      e.raw = null;
      e.gz = null;
      e.br = null;
    }
  }

  function makeEntry(file, st, buf, keepRaw) {
    const ext = path.extname(file);
    const raw = buf && (keepRaw || buf.length <= RAW_MAX_BYTES) ? buf : null;
    const e = {
      mtime: st.mtimeMs, size: st.size,
      // Ảnh lớn không giữ raw → ETag lấy từ mtime+size (đủ để trả 304 mà không đọc file).
      etag: raw ? `"${hash(buf)}"` : `"s${st.size.toString(36)}m${Math.round(st.mtimeMs).toString(36)}"`,
      type: MIME[ext] || 'application/octet-stream',
      raw, gz: null, br: null,
      zip: COMPRESSIBLE.has(ext) && st.size > 512,
      pinned: !!keepRaw, last: Date.now(), gzJob: null, brJob: null,
    };
    if (raw) { cacheBytes += raw.length; evict(); }
    files.set(file, e);
    return e;
  }

  // Sync. Có buf → entry ảo (bundle/index), luôn giữ raw. Không có buf → đọc file từ đĩa
  // (dùng cho CSS lúc rebuild), giữ raw nếu nhỏ, và trả entry cũ nếu mtime/size không đổi.
  function entry(file, buf) {
    if (buf) return makeEntry(file, { mtimeMs: Date.now(), size: buf.length }, buf, true);
    let st;
    try { st = fs.statSync(file); } catch { return null; }
    if (!st.isFile()) return null;
    const old = files.get(file);
    if (old && old.mtime === st.mtimeMs && old.size === st.size) return old;
    return makeEntry(file, st, fs.readFileSync(file), false);
  }

  // Async: đọc file lần đầu không chặn event loop (Giai đoạn 3). Ảnh lớn chỉ lưu metadata.
  async function entryAsync(file) {
    let st;
    try { st = await fsp.stat(file); } catch { return null; }
    if (!st.isFile()) return null;
    const old = files.get(file);
    if (old && old.mtime === st.mtimeMs && old.size === st.size) return old;
    const buf = await fsp.readFile(file);
    return makeEntry(file, st, buf, false);
  }

  async function rawOf(e, file) {
    if (e.raw) { touch(e); return e.raw; }
    const buf = await fsp.readFile(file);
    return buf;
  }

  // Nén async, dedup theo promise: nhiều request cùng lúc chỉ nén một lần cho mỗi encoding.
  function compress(e, enc) {
    if (enc === 'br') {
      if (e.br) return Promise.resolve(e.br);
      if (!e.brJob) e.brJob = Promise.resolve()
        .then(() => {
          const opts = { ...BROTLI_OPTS, params: { ...BROTLI_OPTS.params, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: e.raw ? e.raw.length : e.size } };
          return new Promise((resolve, reject) => zlib.brotliCompress(e.raw, opts, (err, out) => err ? reject(err) : resolve(out)));
        })
        .then((out) => { e.br = out; return out; })
        .finally(() => { e.brJob = null; });
      return e.brJob;
    }
    if (e.gz) return Promise.resolve(e.gz);
    if (!e.gzJob) e.gzJob = Promise.resolve()
      .then(() => new Promise((resolve, reject) => zlib.gzip(e.raw, GZIP_OPTS, (err, out) => err ? reject(err) : resolve(out))))
      .then((out) => { e.gz = out; return out; })
      .finally(() => { e.gzJob = null; });
    return e.gzJob;
  }

  // Trả [buffer, encoding]. Entry có raw → nén qua compress() (dedup, lưu lại).
  // Ảnh lớn (raw=null) → đọc tạm rồi nén vào biến local, KHÔNG lưu raw (giữ RAM thấp).
  async function body(e, file, accept) {
    const wantBr = /\bbr\b/.test(accept);
    const wantGz = !wantBr && /\bgzip\b/.test(accept);
    if (!e.zip) return [await rawOf(e, file), null];
    if (e.raw) {
      if (wantBr) return [await compress(e, 'br'), 'br'];
      if (wantGz) return [await compress(e, 'gzip'), 'gzip'];
      touch(e);
      return [e.raw, null];
    }
    const src = await fsp.readFile(file);
    if (wantBr) {
      const opts = { ...BROTLI_OPTS, params: { ...BROTLI_OPTS.params, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: src.length } };
      return [await new Promise((resolve, reject) => zlib.brotliCompress(src, opts, (err, out) => err ? reject(err) : resolve(out))), 'br'];
    }
    if (wantGz) return [await new Promise((resolve, reject) => zlib.gzip(src, GZIP_OPTS, (err, out) => err ? reject(err) : resolve(out))), 'gzip'];
    return [src, null];
  }

  // ------------------------------------------------------------ Gộp file JS + bản đồ
  const INDEX = path.join(PUBLIC, 'index.html');
  const MAPS_DIR = path.join(SHARED, 'maps');
  let build = null;          // { sig, appUrl, app, index }
  let lastCheck = 0;
  let dirty = true;          // fs.watch gắn cờ này khi có file đổi; không đổi thì không quét signature
  let lastSigScan = 0;
  const WATCH_DIRS = [MAPS_DIR, path.join(PUBLIC, 'js'), path.join(PUBLIC, 'css'), path.join(PUBLIC, 'assets'), path.join(PUBLIC, 'index.html')];

  function markDirty() { dirty = true; }
  if (WATCH) {
    for (const target of WATCH_DIRS) {
      try {
        const w = fs.watch(target, { recursive: true }, () => markDirty());
        w.on('error', () => { try { w.close(); } catch { /* bỏ qua */ } });
        w.unref();   // không giữ tiến trình sống (server có listener khác; benchmark thoát được)
      } catch { /* nền tảng không hỗ trợ recursive → fallback quét định kỳ */ }
    }
  }

  function sources() {
    const html = fs.readFileSync(INDEX, 'utf8');
    // Chỉ gộp các script cuối trang (sau Phaser); early.js ở <head> chạy riêng từ sớm nên không gộp
    const body = html.slice(html.indexOf('<script src="/lib/'));
    const scripts = [...body.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]).filter(s => !s.startsWith('/lib/'));
    const maps = fs.readdirSync(MAPS_DIR).filter(f => f.endsWith('.txt')).sort();
    return { html, scripts, maps };
  }
  const resolve = (url) => {
    for (const [prefix, dir] of DIRS) if (url.startsWith(prefix)) return path.join(dir, url.slice(prefix.length));
    return null;
  };
  function signature(src) {
    const parts = [INDEX, path.join(PUBLIC, 'css', 'style.css'), ...src.scripts.map(resolve), ...src.maps.map(m => path.join(MAPS_DIR, m))];
    let assets = 0;
    const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else { const s = fs.statSync(p); assets += s.mtimeMs + s.size; } } };
    try { walk(path.join(PUBLIC, 'assets')); } catch { /* chưa có thư mục ảnh */ }
    return parts.map(p => { try { const s = fs.statSync(p); return s.mtimeMs + ':' + s.size; } catch { return '-'; } }).join('|') + '|' + assets;
  }
  function rebuild() {
    const now = Date.now();
    if (build && now - lastCheck < 1000) return build;
    lastCheck = now;
    // Không có watch (hoặc watch chưa báo đổi) thì thỉnh thoảng vẫn quét để an toàn.
    const needScan = dirty || !WATCH || now - lastSigScan >= 30000;
    if (build && !needScan) return build;
    const src = sources();
    const sig = signature(src);
    lastSigScan = now;
    dirty = false;
    if (build && build.sig === sig) return build;

    const assetV = hash(sig);
    const mapText = {};
    for (const m of src.maps) mapText[m.replace(/\.txt$/, '')] = fs.readFileSync(path.join(MAPS_DIR, m), 'utf8');
    const chunks = [`window.BUILD = ${JSON.stringify({ assets: assetV })};\nwindow.MAP_TEXT = ${JSON.stringify(mapText)};\n`];
    for (const s of src.scripts) chunks.push(`\n/* ${s} */\n` + fs.readFileSync(resolve(s), 'utf8').replace(/^﻿/, '') + '\n;');
    const app = Buffer.from(chunks.join(''), 'utf8');
    const appUrl = `/app.${hash(app)}.js`;
    const css = entry(path.join(PUBLIC, 'css', 'style.css'));
    const cssV = css ? css.etag.slice(1, 9) : '1';

    // Bundle/index là tài sản "pinned": luôn giữ raw để nén lại ngay khi cần (đỡ đọc đĩa).
    let html = src.html.replace(/^﻿/, '');
    const first = html.indexOf('<script src="/lib/');
    const last = html.lastIndexOf('</script>') + '</script>'.length;
    html = html.slice(0, first) + `<script src="/lib/phaser.min.js?v=${PHASER_V}"></script>\n  <script src="${appUrl}"></script>` + html.slice(last);
    html = html.replace('href="/css/style.css"', `href="/css/style.css?v=${cssV}"`);
    html = html.replace(/(src|href)="(\/js\/core\/early\.js)"/, `$1="$2?v=${assetV}"`);

    const appEntry = entry(appUrl + '.virtual.js', app);
    const indexEntry = entry('index.virtual.html', Buffer.from(html, 'utf8'));
    build = { sig, assetV, appUrl, app: appEntry, index: indexEntry };
    return build;
  }

  // ------------------------------------------------------------ Trả file
  async function sendEntry(req, res, e, file, cacheControl) {
    if (req.headers['if-none-match'] === e.etag) {
      res.writeHead(304, { ETag: e.etag, 'Cache-Control': cacheControl });
      return res.end();
    }
    const [buf, enc] = await body(e, file, String(req.headers['accept-encoding'] || ''));
    const h = { 'Content-Type': e.type, 'Content-Length': buf.length, 'Cache-Control': cacheControl, ETag: e.etag };
    if (e.zip) h.Vary = 'Accept-Encoding';
    if (enc) h['Content-Encoding'] = enc;
    res.writeHead(200, h);
    res.end(req.method === 'HEAD' ? undefined : buf);
  }
  const notFound = (res) => { res.writeHead(404); res.end('Not found'); };

  return async function serveStatic(req, res, url, query) {
    const versioned = /(^|&)v=/.test(query || '');
    try {
      if (!NO_BUNDLE && (url === '/' || url === '/index.html')) {
        const b = rebuild();
        return await sendEntry(req, res, b.index, 'index.virtual.html', 'no-cache');
      }
      if (!NO_BUNDLE && /^\/app\.[\w-]+\.js$/.test(url)) {
        const b = rebuild();
        if (url !== b.appUrl) { res.writeHead(302, { Location: b.appUrl, 'Cache-Control': 'no-store' }); return res.end(); }
        return await sendEntry(req, res, b.app, b.appUrl + '.virtual.js', YEAR);
      }
    } catch (err) {
      console.error('Lỗi gộp file:', err);
      res.writeHead(500); return res.end('Build error');
    }
    let file = url === '/lib/phaser.min.js' ? PHASER : null;
    if (!file) {
      for (const [prefix, dir] of DIRS) {
        if (!url.startsWith(prefix)) continue;
        let rel;
        try { rel = decodeURIComponent(url.slice(prefix.length)) || 'index.html'; } catch { return notFound(res); }
        const full = path.normalize(path.join(dir, rel));
        if (!full.startsWith(dir + path.sep) && full !== dir) return notFound(res);
        file = full;
        break;
      }
    }
    if (!file) return notFound(res);
    const e = await entryAsync(file);
    if (!e) return notFound(res);
    const fixed = file.startsWith(FONTS + path.sep);   // font cố định theo phiên bản gói npm
    await sendEntry(req, res, e, file, versioned || fixed ? YEAR : 'no-cache');
  };
};

module.exports.MIME = MIME;
