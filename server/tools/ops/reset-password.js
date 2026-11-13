'use strict';
// Đặt lại mật khẩu khi quên:  node server/tools/ops/reset-password.js <tên đăng nhập> <mật khẩu mới>
// Server đang chạy sẽ đăng xuất các phiên cũ sau tối đa 60 giây (thời gian giữ phiên trong bộ nhớ).
const store = require('../../storage/db');
const auth = require('../../accounts/auth');

const [user, pass] = process.argv.slice(2);
if (!user || !pass || pass.length < 6) {
  console.log('Cách dùng: node server/tools/ops/reset-password.js <tên đăng nhập> <mật khẩu mới (>= 6 ký tự)>');
  process.exit(1);
}

(async () => {
  const row = await store.userByName(user);
  if (!row) { console.error('Không có tài khoản:', user); process.exit(1); }
  await store.setPassword(row.id, await auth.hashPassword(pass));
  await store.deleteUserSessions(row.id);
  await store.logAuth({ userId: row.id, username: row.username, event: 'password_reset', detail: 'công cụ dòng lệnh' });
  console.log('Đã đổi mật khẩu cho', row.username, '(các phiên đăng nhập cũ đã bị đăng xuất).');
  await store.close();
})().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
