'use strict';
/*
 * Sao lưu dữ liệu game bằng pg_dump (định dạng custom, phục hồi bằng pg_restore).
 *   node server/tools/ops/backup.js            -> lưu vào ./backups
 *   BACKUP_DIR=/var/backups/anphong KEEP=14 node server/tools/ops/backup.js
 * Giữ lại KEEP bản mới nhất (mặc định 14).
 *
 * Nếu pg_dump không nằm trong PATH, đặt PG_DUMP=/đường/dẫn/pg_dump.
 * Kết nối lấy từ DATABASE_URL hoặc PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE (giống server).
 */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', '..', '..', 'backups');
const KEEP = Number(process.env.KEEP) || 14;
const DB_NAME = process.env.PGDATABASE || 'anphong';

function resolvePgDump() {
  if (process.env.PG_DUMP) return process.env.PG_DUMP;
  if (!spawnSync('pg_dump', ['--version'], { encoding: 'utf8' }).error) return 'pg_dump';
  const exe = process.platform === 'win32' ? 'pg_dump.exe' : 'pg_dump';
  for (const root of ['C:\\Program Files\\PostgreSQL', '/usr/lib/postgresql']) {
    if (!fs.existsSync(root)) continue;
    for (const version of fs.readdirSync(root).sort().reverse()) {
      const candidate = path.join(root, version, 'bin', exe);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

const pgDump = resolvePgDump();
if (!pgDump) {
  console.error('Không tìm thấy pg_dump. Cài PostgreSQL client hoặc đặt biến PG_DUMP=/đường/dẫn/pg_dump.');
  process.exit(1);
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
const dest = path.join(BACKUP_DIR, `anphong-${stamp}.dump`);

const args = ['--format=custom', '--no-owner'];
if (process.env.DATABASE_URL) args.push('--dbname', process.env.DATABASE_URL);
else args.push('--dbname', DB_NAME);
args.push('--file', dest);

const run = spawnSync(pgDump, args, { encoding: 'utf8', env: process.env });
if (run.status !== 0) {
  console.error('Sao lưu thất bại:', (run.stderr || run.error?.message || '').trim());
  process.exit(1);
}
console.log('Đã sao lưu:', dest);
console.log('Phục hồi: pg_restore --clean --no-owner -d <database> "' + dest + '"');

const files = fs.readdirSync(BACKUP_DIR).filter(f => /^anphong-.*\.dump$/.test(f)).sort();
for (const f of files.slice(0, Math.max(0, files.length - KEEP))) {
  fs.unlinkSync(path.join(BACKUP_DIR, f));
  console.log('Xóa bản cũ:', f);
}
