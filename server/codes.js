'use strict';
/*
 * Mã quà tặng (giftcode). Danh sách mã nằm trong file <DATA_DIR>/giftcodes.json,
 * sửa file là có hiệu lực ngay, không cần khởi động lại server.
 *
 * Mỗi mã:
 *   { "code": "ABC-123", "note": "ghi chú", "rewards": {
 *       "unlockClass": "toan_nang",      // mở class đặc biệt
 *       "gold": 1000,                    // xu
 *       "skillPoints": 2,                // điểm kỹ năng
 *       "items": [["da_cuong_hoa", 5]]   // vật phẩm
 *   } }
 * Mỗi tài khoản dùng mỗi mã được một lần.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DATA_DIR } = require('./db');

const FILE = path.join(DATA_DIR, 'giftcodes.json');

function ensureFile() {
  if (fs.existsSync(FILE)) return;
  const code = 'TOANNANG-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  const data = {
    codes: [
      { code, note: 'Mở class đặc biệt Toàn Năng', rewards: { unlockClass: 'toan_nang' } },
    ],
  };
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  console.log('Đã tạo file mã quà tặng:', FILE);
  console.log('Mã mở class Toàn Năng:', code);
}

function normalize(c) { return String(c || '').trim().toUpperCase(); }

function find(code) {
  ensureFile();
  let data;
  try { data = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return null; }
  const want = normalize(code);
  if (!want) return null;
  return (data.codes || []).find(c => normalize(c.code) === want) || null;
}

module.exports = { find, ensureFile, normalize, FILE };
