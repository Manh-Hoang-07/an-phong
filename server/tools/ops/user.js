'use strict';
/*
 * Tra cứu và quản lý tài khoản.
 *
 *   node server/tools/ops/user.js info <tên>                 thông tin + 20 dòng nhật ký gần nhất
 *   node server/tools/ops/user.js log <tên> [số dòng]         nhật ký đăng nhập / đăng xuất / đổi mật khẩu
 *   node server/tools/ops/user.js ban <tên> [lý do]           khóa tài khoản, đăng xuất mọi phiên
 *   node server/tools/ops/user.js unban <tên>                 mở khóa
 *   node server/tools/ops/user.js snapshots <tên>             danh sách bản chụp nhân vật
 *   node server/tools/ops/user.js restore <tên> <id bản chụp> khôi phục nhân vật từ bản chụp
 *
 * Khóa tài khoản có hiệu lực với server đang chạy sau tối đa 60 giây.
 * restore: PHẢI TẮT SERVER TRƯỚC, nếu không bản trong bộ nhớ của server sẽ ghi đè lên.
 */
const store = require('../../storage/db');

const fmtTime = (ms) => (ms ? new Date(Number(ms)).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—');

function usage() {
  console.log('Cách dùng:');
  console.log('  node server/tools/ops/user.js info <tên>');
  console.log('  node server/tools/ops/user.js log <tên> [số dòng]');
  console.log('  node server/tools/ops/user.js ban <tên> [lý do]');
  console.log('  node server/tools/ops/user.js unban <tên>');
  console.log('  node server/tools/ops/user.js snapshots <tên>');
  console.log('  node server/tools/ops/user.js restore <tên> <id bản chụp>   (tắt server trước)');
}

function printLog(rows) {
  if (!rows.length) { console.log('  (chưa có nhật ký)'); return; }
  for (const r of rows) {
    console.log(`  ${fmtTime(r.at).padEnd(22)} ${r.event.padEnd(14)} ${(r.ip || '').padEnd(16)} ${r.detail || ''} ${r.user_agent ? '| ' + r.user_agent.slice(0, 60) : ''}`);
  }
}

(async () => {
  const [cmd, name, ...rest] = process.argv.slice(2);
  if (!cmd || !name) { usage(); process.exit(cmd ? 1 : 0); }
  const u = await store.userByName(name);
  if (!u) { console.error('Không có tài khoản:', name); process.exit(1); }

  if (cmd === 'info') {
    console.log(`Tài khoản #${u.id}: ${u.username}`);
    console.log(`  Tạo lúc:          ${fmtTime(u.created)}`);
    console.log(`  Đăng nhập cuối:   ${fmtTime(u.last_login)} ${u.last_ip ? '(' + u.last_ip + ')' : ''}`);
    console.log(`  Trạng thái:       ${u.banned ? 'ĐANG BỊ KHÓA' + (u.ban_reason ? ' — ' + u.ban_reason : '') : 'bình thường'}`);
    console.log('Nhật ký gần nhất:');
    printLog(await store.authLog(u.id, 20));
  } else if (cmd === 'log') {
    printLog(await store.authLog(u.id, Number(rest[0]) || 50));
  } else if (cmd === 'ban') {
    const reason = rest.join(' ') || null;
    await store.setBanned(u.id, true, reason);
    await store.deleteUserSessions(u.id);
    await store.logAuth({ userId: u.id, username: u.username, event: 'ban', detail: reason });
    console.log('Đã khóa', u.username + (reason ? ' (' + reason + ')' : '') + '. Các phiên đăng nhập đã bị xóa.');
  } else if (cmd === 'unban') {
    await store.setBanned(u.id, false);
    await store.logAuth({ userId: u.id, username: u.username, event: 'unban' });
    console.log('Đã mở khóa', u.username + '.');
  } else if (cmd === 'snapshots') {
    const rows = await store.listSnapshots(u.id);
    if (!rows.length) console.log('Chưa có bản chụp nào.');
    for (const r of rows) console.log(`  #${String(r.id).padEnd(6)} ${fmtTime(r.at).padEnd(22)} ${r.reason.padEnd(10)} cấp ${r.level ?? '?'}  vàng ${r.gold ?? '?'}  bản đồ ${r.map ?? '?'}`);
  } else if (cmd === 'restore') {
    const id = Number(rest[0]);
    const snap = Number.isInteger(id) ? await store.snapshotById(u.id, id) : null;
    if (!snap) { console.error('Không có bản chụp', rest[0], 'của', u.username); process.exit(1); }
    // Chụp lại trạng thái hiện tại trước khi ghi đè, để còn quay lại được
    const current = await store.loadPlayer(u.id);
    if (current) await store.savePlayerFull(u.id, current, 'before_restore');
    await store.savePlayerFull(u.id, snap.data);
    await store.logAuth({ userId: u.id, username: u.username, event: 'restore', detail: `bản chụp #${id} lúc ${fmtTime(snap.at)}` });
    console.log(`Đã khôi phục ${u.username} về bản chụp #${id} (${fmtTime(snap.at)}).`);
    console.log('Trạng thái trước đó được lưu thành bản chụp "before_restore".');
  } else {
    usage();
    process.exit(1);
  }
  await store.close();
})().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
