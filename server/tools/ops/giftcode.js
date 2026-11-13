'use strict';
/*
 * Quản lý mã quà tặng (lưu trong PostgreSQL).
 *
 *   node server/tools/giftcode.js list
 *   node server/tools/giftcode.js add [MÃ] [tuỳ chọn]
 *   node server/tools/giftcode.js remove MÃ
 *
 * Tuỳ chọn khi tạo mã:
 *   --note "Quà Tết"        ghi chú
 *   --max-uses 20           tổng số lượt dùng (bỏ trống = không giới hạn)
 *   --expires 2026-12-31    hết hạn cuối ngày (giờ Việt Nam)
 *   --gold 1000             tặng xu
 *   --exp 50000             tặng kinh nghiệm (tự lên cấp, cộng điểm như khi đánh quái)
 *   --skill-points 2        tặng điểm kỹ năng
 *   --item da_cuong_hoa 5   tặng vật phẩm (lặp lại được nhiều lần)
 *   --unlock-class toan_nang
 *   --mount soi_xam         tặng thú triệu hồi (tên cờ giữ tương thích): soi_xam, than_lan, soi_tuyet, hac_may, ky_lan
 *
 * Không đặt mã thì tự sinh dạng QUA-XXXXXX. Mỗi tài khoản dùng mỗi mã một lần.
 */
const crypto = require('crypto');
const store = require('../../storage/db');
const codes = require('../../accounts/codes');
const G = require('../../../shared');

function usage() {
  console.log('Cách dùng:');
  console.log('  node server/tools/giftcode.js list');
  console.log('  node server/tools/giftcode.js add [MÃ] [--note "..."] [--max-uses N] [--expires YYYY-MM-DD]');
  console.log('                                      [--gold N] [--exp N] [--skill-points N] [--unlock-class ten] [--mount id]');
  console.log('                                      [--item id_danh_muc so_luong]');
  console.log('  node server/tools/giftcode.js remove MÃ');
}

function parse(argv) {
  const out = { code: null, note: null, maxUses: null, expires: null, rewards: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--note') out.note = argv[++i];
    else if (a === '--max-uses') out.maxUses = Number(argv[++i]);
    else if (a === '--expires') out.expires = Date.parse(argv[++i] + 'T23:59:59+07:00');
    else if (a === '--gold') out.rewards.gold = Number(argv[++i]);
    else if (a === '--exp') out.rewards.exp = Number(argv[++i]);
    else if (a === '--skill-points') out.rewards.skillPoints = Number(argv[++i]);
    else if (a === '--unlock-class') {
      const id = argv[++i];
      if (!G.SCHOOLS[id]) { console.error('Không có class:', id, '— có:', Object.keys(G.SCHOOLS).join(', ')); process.exit(1); }
      if (G.SCHOOLS[id].evolved) { console.error('Chức nghiệp 2 (' + id + ') không mở bằng mã; chỉ qua Sách Tiến Hóa Chức Nghiệp ở NPC ẩn.'); process.exit(1); }
      out.rewards.unlockClass = id;
    }
    else if (a === '--mount') {
      const id = argv[++i];
      if (!G.MOUNTS[id]) { console.error('Không có thú triệu hồi:', id, '— có:', Object.keys(G.MOUNTS).join(', ')); process.exit(1); }
      (out.rewards.mounts || (out.rewards.mounts = [])).push(id);
    }
    else if (a === '--item') {
      const id = argv[++i];
      const n = Number(argv[++i]);
      if (!id || !Number.isFinite(n)) { console.error('--item cần: <id vật phẩm> <số lượng>'); process.exit(1); }
      (out.rewards.items || (out.rewards.items = [])).push([id, n]);
    } else if (!out.code) out.code = a;
    else { console.error('Tham số không hiểu:', a); process.exit(1); }
  }
  return out;
}

function describe(row) {
  const used = row.max_uses === null ? `${row.uses} lượt (không giới hạn)` : `${row.uses}/${row.max_uses} lượt`;
  const expiry = row.expires === null ? 'không hạn' : (Number(row.expires) < Date.now() ? 'ĐÃ HẾT HẠN' : 'đến ' + new Date(Number(row.expires)).toLocaleDateString('vi-VN'));
  return `${row.code.padEnd(18)} ${used.padEnd(26)} ${expiry.padEnd(20)} ${row.note || ''}`;
}

(async () => {
  const [cmd, ...rest] = process.argv.slice(2);
  await store.init();

  if (cmd === 'list') {
    const rows = await codes.list();
    if (!rows.length) console.log('Chưa có mã nào. Tạo bằng: npm run giftcode -- add --gold 1000');
    else {
      console.log('MÃ                 LƯỢT ĐÃ DÙNG                HẠN                  GHI CHÚ');
      for (const row of rows) console.log(describe(row));
    }
  } else if (cmd === 'add') {
    const opt = parse(rest);
    const code = codes.normalize(opt.code || 'QUA-' + crypto.randomBytes(3).toString('hex').toUpperCase());
    if (!/^[\p{L}\p{N}_-]{3,32}$/u.test(code)) {
      console.error('Mã chỉ gồm chữ, số, gạch dưới, gạch ngang (3–32 ký tự):', code);
      process.exit(1);
    }
    if (opt.maxUses !== null && (!Number.isInteger(opt.maxUses) || opt.maxUses < 1)) {
      console.error('--max-uses phải là số nguyên >= 1');
      process.exit(1);
    }
    if (opt.expires !== null && !Number.isFinite(opt.expires)) {
      console.error('--expires phải có dạng YYYY-MM-DD');
      process.exit(1);
    }
    const row = await codes.add({ code, note: opt.note, rewards: opt.rewards, maxUses: opt.maxUses, expires: opt.expires });
    console.log('Đã lưu mã:', row.code);
    console.log('  Quà:', JSON.stringify(row.rewards));
    console.log('  ', describe(row));
  } else if (cmd === 'remove') {
    const code = codes.normalize(rest[0]);
    if (!code) { usage(); process.exit(1); }
    const n = await codes.remove(code);
    console.log(n ? 'Đã xoá mã ' + code + ' (kèm danh sách người đã dùng).' : 'Không có mã ' + code + '.');
  } else {
    usage();
    await store.close();
    process.exit(cmd ? 1 : 0);
  }

  await store.close();
})().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
