'use strict';
/*
 * Phục vụ file tĩnh cho nhanh:
 *  - Gộp toàn bộ file JS của game (theo thứ tự trong public/index.html) và 32 file bản đồ thành MỘT file
 *    /app.<mã>.js. Mã đổi khi nội dung đổi → trình duyệt lưu lâu dài, chỉ tải lại khi có bản mới.
 *    Tự gộp lại khi file nguồn thay đổi (không cần khởi động lại server, không cần công cụ build).
 *  - Nén brotli/gzip sẵn trong bộ nhớ (nén một lần, dùng lại cho mọi lượt tải).
 *  - ETag: file không có mã phiên bản thì trình duyệt hỏi lại và nhận 304 "vẫn như cũ" (không tải lại).
 *  - URL có ?v=... hoặc /app.<mã>.js: cho lưu 1 năm (immutable).
 * Đặt NO_BUNDLE=1 để phục vụ từng file riêng như cũ (tiện gỡ lỗi).
 */
const fs = require('fs');
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

module.exports = function createStatic(ROOT) {
  const PUBLIC = path.join(ROOT, 'public');
  const SHARED = path.join(ROOT, 'shared');
  const FONTS = path.join(ROOT, 'node_modules', '@fontsource', 'be-vietnam-pro', 'files');
  const PHASER = path.join(ROOT, 'node_modules', 'phaser', 'dist', 'phaser.min.js');
  const PHASER_V = (() => { try { return require(path.join(ROOT, 'node_modules', 'phaser', 'package.json')).version; } catch { return '1'; } })();
  const NO_BUNDLE = process.env.NO_BUNDLE === '1';
  const DIRS = [['/shared/', SHARED], ['/fonts/', FONTS], ['/', PUBLIC]];

  // ------------------------------------------------------------ Bộ nhớ đệm file (đọc + nén một lần)
  const files = new Map();   // đường dẫn → { mtime, size, etag, type, raw, gz, br }
  function entry(file, buf) {
    let st;
    if (!buf) {
      try { st = fs.statSync(file); } catch { return null; }
      if (!st.isFile()) return null;
      const old = files.get(file);
      if (old && old.mtime === st.mtimeMs && old.size === st.size) return old;
      buf = fs.readFileSync(file);
    }
    const ext = path.extname(file);
    const e = { mtime: st ? st.mtimeMs : 0, size: st ? st.size : buf.length, etag: `"${hash(buf)}"`, type: MIME[ext] || 'application/octet-stream', raw: buf, gz: null, br: null, zip: COMPRESSIBLE.has(ext) && buf.length > 512 };
    files.set(file, e);
    return e;
  }
  function body(e, accept) {
    if (!e.zip) return [e.raw, null];
    if (/\bbr\b/.test(accept)) {
      if (!e.br) e.br = zlib.brotliCompressSync(e.raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: e.raw.length } });
      return [e.br, 'br'];
    }
    if (/\bgzip\b/.test(accept)) {
      if (!e.gz) e.gz = zlib.gzipSync(e.raw, { level: 9 });
      return [e.gz, 'gzip'];
    }
    return [e.raw, null];
  }

  // ------------------------------------------------------------ Gộp file JS + bản đồ
  const INDEX = path.join(PUBLIC, 'index.html');
  const MAPS_DIR = path.join(SHARED, 'maps');
  let build = null;          // { sig, appUrl, app, index }
  let lastCheck = 0;
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
    const src = sources();
    const sig = signature(src);
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

    // Trang chính: thay hàng chục thẻ <script> bằng 2 thẻ, thêm mã phiên bản cho CSS
    let html = src.html.replace(/^﻿/, '');
    const first = html.indexOf('<script src="/lib/');
    const last = html.lastIndexOf('</script>') + '</script>'.length;
    html = html.slice(0, first) + `<script src="/lib/phaser.min.js?v=${PHASER_V}"></script>\n  <script src="${appUrl}"></script>` + html.slice(last);
    html = html.replace('href="/css/style.css"', `href="/css/style.css?v=${cssV}"`);
    html = html.replace(/(src|href)="(\/js\/core\/early\.js)"/, `$1="$2?v=${assetV}"`);

    build = { sig, assetV, appUrl, app: entry(appUrl + '.virtual.js', app), index: entry('index.virtual.html', Buffer.from(html, 'utf8')) };
    return build;
  }

  // ------------------------------------------------------------ Trả file
  function sendEntry(req, res, e, cache) {
    if (req.headers['if-none-match'] === e.etag) {
      res.writeHead(304, { ETag: e.etag, 'Cache-Control': cache });
      return res.end();
    }
    const [buf, enc] = body(e, String(req.headers['accept-encoding'] || ''));
    const h = { 'Content-Type': e.type, 'Content-Length': buf.length, 'Cache-Control': cache, ETag: e.etag };
    if (e.zip) h.Vary = 'Accept-Encoding';
    if (enc) h['Content-Encoding'] = enc;
    res.writeHead(200, h);
    res.end(req.method === 'HEAD' ? undefined : buf);
  }
  const notFound = (res) => { res.writeHead(404); res.end('Not found'); };

  return function serveStatic(req, res, url, query) {
    const versioned = /(^|&)v=/.test(query || '');
    try {
      if (!NO_BUNDLE && (url === '/' || url === '/index.html')) return sendEntry(req, res, rebuild().index, 'no-cache');
      if (!NO_BUNDLE && /^\/app\.[\w-]+\.js$/.test(url)) {
        const b = rebuild();
        if (url !== b.appUrl) { res.writeHead(302, { Location: b.appUrl, 'Cache-Control': 'no-store' }); return res.end(); }
        return sendEntry(req, res, b.app, YEAR);
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
    const e = entry(file);
    if (!e) return notFound(res);
    const fixed = file.startsWith(FONTS + path.sep);   // font cố định theo phiên bản gói npm
    sendEntry(req, res, e, versioned || fixed ? YEAR : 'no-cache');
  };
};

module.exports.MIME = MIME;
