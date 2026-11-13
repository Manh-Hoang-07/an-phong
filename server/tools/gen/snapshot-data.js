'use strict';
/*
 * Chụp toàn bộ dữ liệu game (GameData) ra một file JSON chuẩn hóa, để so sánh trước / sau khi
 * chia lại file trong shared/.
 *
 *   node server/tools/snapshot-data.js > before.json
 *   ... sửa shared/ ...
 *   node server/tools/snapshot-data.js > after.json
 *   node server/tools/snapshot-data.js --diff before.json after.json
 *
 * Mục đích: chứng minh việc chia file KHÔNG đổi nội dung. Chỉ đổi chỗ khai báo.
 *
 * Chuẩn hóa:
 *  - Khóa object sắp xếp theo alphabet (thứ tự khai báo không phải nội dung).
 *  - Hàm: lấy mã nguồn (toString) đã bỏ khoảng trắng thừa, để đổi chỗ mà không đổi logic thì không báo.
 *  - Mỗi khóa của GameData in một dòng: tên, loại, số mục, và băm nội dung.
 */
const crypto = require('crypto');
const fs = require('fs');
const G = require('../../../shared');

const squash = (s) => String(s).replace(/\s+/g, ' ').trim();

// JSON chuẩn hóa: khóa sắp xếp, hàm thay bằng mã nguồn đã squash
function canon(v, seen = new Set()) {
  if (v === null || v === undefined) return null;
  const t = typeof v;
  if (t === 'function') return { __fn: squash(v) };
  if (t === 'number') return Number.isFinite(v) ? v : { __num: String(v) };
  if (t !== 'object') return v;
  if (seen.has(v)) return { __cycle: true };
  seen.add(v);
  let out;
  if (Array.isArray(v)) out = v.map((x) => canon(x, seen));
  else {
    out = {};
    for (const k of Object.keys(v).sort()) out[k] = canon(v[k], seen);
  }
  seen.delete(v);
  return out;
}

const sha = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);

function snapshot() {
  const keys = Object.keys(G).sort();
  const out = {};
  for (const k of keys) {
    const v = G[k];
    const t = typeof v;
    const json = JSON.stringify(canon(v));
    let n = null;
    if (Array.isArray(v)) n = v.length;
    else if (v && t === 'object') n = Object.keys(v).length;
    out[k] = { type: t, size: n, sha: sha(json), json };
  }
  return out;
}

function diff(aPath, bPath) {
  const a = JSON.parse(fs.readFileSync(aPath, 'utf8'));
  const b = JSON.parse(fs.readFileSync(bPath, 'utf8'));
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  let bad = 0;
  for (const k of keys) {
    const x = a[k], y = b[k];
    if (!x) { console.log(`THÊM   ${k}`); bad++; continue; }
    if (!y) { console.log(`MẤT    ${k}`); bad++; continue; }
    if (x.sha === y.sha) continue;
    bad++;
    // Tìm mục cụ thể bị đổi để dễ sửa
    const xo = JSON.parse(x.json), yo = JSON.parse(y.json);
    const detail = [];
    if (xo && yo && typeof xo === 'object' && !Array.isArray(xo)) {
      const sub = [...new Set([...Object.keys(xo), ...Object.keys(yo)])].sort();
      for (const s of sub) {
        const sx = JSON.stringify(xo[s]), sy = JSON.stringify(yo[s]);
        if (sx !== sy) detail.push(s);
      }
    }
    console.log(`ĐỔI    ${k}  (${x.type}/${x.size} → ${y.type}/${y.size})` + (detail.length ? `  mục: ${detail.slice(0, 12).join(', ')}${detail.length > 12 ? ` … +${detail.length - 12}` : ''}` : ''));
  }
  if (!bad) { console.log(`GIỐNG HỆT — ${keys.length} khóa GameData, không đổi gì.`); return 0; }
  console.log(`\n${bad} khóa khác nhau.`);
  return 1;
}

const argv = process.argv.slice(2);
if (argv[0] === '--diff') process.exit(diff(argv[1], argv[2]));
const json = JSON.stringify(snapshot(), null, 1);
// --out <file>: tự ghi UTF-8 (chuyển hướng của PowerShell ghi UTF-16, không đọc lại được)
if (argv[0] === '--out') fs.writeFileSync(argv[1], json, 'utf8');
else process.stdout.write(json);
