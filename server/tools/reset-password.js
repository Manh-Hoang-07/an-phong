'use strict';
// Đặt lại mật khẩu khi quên:  node server/tools/reset-password.js <tên đăng nhập> <mật khẩu mới>
const store = require('../db');
const auth = require('../auth');

const [user, pass] = process.argv.slice(2);
if (!user || !pass || pass.length < 6) {
  console.log('Cách dùng: node server/tools/reset-password.js <tên đăng nhập> <mật khẩu mới (>= 6 ký tự)>');
  process.exit(1);
}
const row = store.userByName(user);
if (!row) { console.error('Không có tài khoản:', user); process.exit(1); }
store.db.prepare('UPDATE users SET pass = ? WHERE id = ?').run(auth.hashPassword(pass), row.id);
store.db.prepare('DELETE FROM sessions WHERE user_id = ?').run(row.id);
console.log('Đã đổi mật khẩu cho', row.username, '(các phiên đăng nhập cũ đã bị đăng xuất).');
