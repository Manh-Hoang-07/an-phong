'use strict';
/*
 * Sao lưu dữ liệu game an toàn (kể cả khi server đang chạy).
 *   node server/backup.js            -> lưu vào ./backups
 *   BACKUP_DIR=/var/backups/anphong KEEP=14 node server/backup.js
 * Giữ lại KEEP bản mới nhất (mặc định 14).
 */
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
const KEEP = Number(process.env.KEEP) || 14;
const src = path.join(DATA_DIR, 'anphong.db');

if (!fs.existsSync(src)) { console.error('Không thấy file dữ liệu:', src); process.exit(1); }
fs.mkdirSync(BACKUP_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
const dest = path.join(BACKUP_DIR, `anphong-${stamp}.db`);

const db = new DatabaseSync(src);
db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
db.close();
console.log('Đã sao lưu:', dest);

const files = fs.readdirSync(BACKUP_DIR).filter(f => /^anphong-.*\.db$/.test(f)).sort();
for (const f of files.slice(0, Math.max(0, files.length - KEEP))) {
  fs.unlinkSync(path.join(BACKUP_DIR, f));
  console.log('Xóa bản cũ:', f);
}
