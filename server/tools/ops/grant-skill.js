'use strict';
/*
 * Gắn một kỹ năng vào nhân vật để thử nghiệm (bỏ qua điều kiện cấp / sách / ô học).
 *
 *   node server/tools/ops/grant-skill.js <tên đăng nhập> <id kỹ năng> [cấp]
 *   node server/tools/ops/grant-skill.js <tên đăng nhập> --list
 *
 * Ví dụ:
 *   node server/tools/ops/grant-skill.js test01 ulSinhTu
 *   node server/tools/ops/grant-skill.js test01 ulSinhTu 10
 *
 * Việc nó làm:
 *   1. Học kỹ năng ở cấp chỉ định (mặc định 1) — ghi p.skills[id].
 *   2. Gắn vào ô trống đầu tiên của đúng loại (tuyệt kỹ → ô R/X/Z, thường → ô 1–4).
 *      Không còn ô trống thì ghi đè ô CUỐI của loại đó.
 *   3. Nếu là trang bị đặc biệt cần thử kèm (Bùa Hộ Mệnh), dùng --gear <id> để mặc luôn.
 *
 * KHÔNG kiểm tra cấp nhân vật, không kiểm tra ô học, không trừ điểm kỹ năng.
 * Đây là công cụ test — đừng chạy trên tài khoản thật.
 *
 * PHẢI TẮT SERVER TRƯỚC khi chạy: nếu không, bản nhân vật trong bộ nhớ server sẽ ghi đè
 * lên thay đổi này ở lần lưu kế tiếp.
 */
const store = require('../../storage/db');
const G = require('../../../shared');

function usage() {
  console.log('Cách dùng:');
  console.log('  node server/tools/ops/grant-skill.js <tên đăng nhập> <id kỹ năng> [cấp] [--gear <id trang bị>]');
  console.log('  node server/tools/ops/grant-skill.js <tên đăng nhập> --list        liệt kê kỹ năng đang có');
  console.log('');
  console.log('Ví dụ:');
  console.log('  node server/tools/ops/grant-skill.js test01 ulSinhTu');
  console.log('  node server/tools/ops/grant-skill.js test01 ulSinhTu 10 --gear bua_db_5');
  console.log('  node server/tools/ops/grant-skill.js test01 ulTuLinhDungHop 10   (chỉ Tử Linh Thuật Sư)');
  console.log('');
  console.log('Tắt server trước khi chạy, nếu không thay đổi sẽ bị ghi đè.');
}

(async () => {
  const argv = process.argv.slice(2);
  const name = argv[0];
  if (!name) { usage(); process.exit(0); }

  await store.init();
  const u = await store.userByName(name);
  if (!u) { console.error('Không có tài khoản:', name); await store.close(); process.exit(1); }

  const p = await store.loadPlayer(u.id);
  if (!p) { console.error('Tài khoản', name, 'chưa có nhân vật.'); await store.close(); process.exit(1); }

  // --list: xem đang có gì
  if (argv.includes('--list')) {
    console.log(`Nhân vật: ${p.name} · cấp ${p.level} · class ${p.school || '(chưa)'}`);
    console.log('Kỹ năng đã học:');
    const ids = Object.keys(p.skills || {}).filter(id => p.skills[id] > 0);
    if (!ids.length) console.log('  (chưa học kỹ năng nào)');
    for (const id of ids) {
      const sk = G.SKILLS[id];
      if (!sk) { console.log(`  ${id} — KHÔNG CÒN TRONG DỮ LIỆU`); continue; }
      const slot = (p.skillSlots || []).indexOf(id);
      console.log(`  ${sk.ult ? '★' : '·'} ${id.padEnd(22)} cấp ${String(p.skills[id]).padEnd(3)} ${sk.name}${slot >= 0 ? ` — gắn ô ${G.isUltSlot(slot) ? G.ultKeyLabel(slot) : slot + 1}` : ''}`);
    }
    console.log('Trang bị đặc biệt đang mặc:');
    let any = false;
    for (const sl of G.SPECIAL_SLOTS) {
      const it = p.equip && p.equip[sl];
      if (!it) continue;
      any = true;
      console.log(`  ${sl}: ${G.ITEMS[it.id]?.name || it.id} (bậc ${G.ITEMS[it.id]?.tier || 1})`);
    }
    if (!any) console.log('  (không mặc món đặc biệt nào)');
    await store.close();
    return;
  }

  const id = argv[1];
  if (!id) { usage(); await store.close(); process.exit(1); }
  const sk = G.SKILLS[id];
  if (!sk) { console.error('Không có kỹ năng:', id); await store.close(); process.exit(1); }

  const lvArg = argv[2] && !argv[2].startsWith('--') ? Number(argv[2]) : 1;
  const lv = Math.max(1, Math.min(G.SKILL_MAX, Number.isFinite(lvArg) ? lvArg : 1));

  // --gear <id>: mặc luôn một món trang bị đặc biệt (để thử combo với Bùa Hộ Mệnh)
  const gearIdx = argv.indexOf('--gear');
  const gearId = gearIdx >= 0 ? argv[gearIdx + 1] : null;
  if (gearId && !G.ITEMS[gearId]) { console.error('Không có trang bị:', gearId); await store.close(); process.exit(1); }

  if (!p.skills || typeof p.skills !== 'object') p.skills = {};
  const had = p.skills[id] || 0;
  p.skills[id] = lv;

  // Gắn vào thanh: ô trống đầu tiên của đúng loại, không có thì ghi đè ô cuối
  if (!Array.isArray(p.skillSlots)) p.skillSlots = Array(G.SKILL_SLOTS).fill(null);
  while (p.skillSlots.length < G.SKILL_SLOTS) p.skillSlots.push(null);
  const slots = sk.ult ? G.ultSlotsOf(p) : G.normalSlotsOf(p);
  let slot = slots.find(i => !p.skillSlots[i]);
  if (slot === undefined) slot = slots[slots.length - 1];
  const replaced = p.skillSlots[slot];
  p.skillSlots[slot] = id;

  if (gearId) {
    const def = G.ITEMS[gearId];
    if (!p.equip) p.equip = {};
    p.equip[def.slot] = { id: gearId };
  }

  await store.savePlayerFull(u.id, p, 'grant_skill');
  await store.logAuth({ userId: u.id, username: u.username, event: 'grant_skill', detail: `${id} cấp ${lv}${gearId ? ' + ' + gearId : ''}` });

  console.log(`Nhân vật: ${p.name} (cấp ${p.level}, class ${p.school || 'chưa thức tỉnh'})`);
  console.log(`  Học:      ${sk.name} (${id}) cấp ${lv}${had ? ` — trước đó cấp ${had}` : ''}`);
  console.log(`  Gắn vào:  ô ${G.isUltSlot(slot) ? G.ultKeyLabel(slot) : slot + 1}${replaced ? ` (thay ${G.SKILLS[replaced]?.name || replaced})` : ''}`);
  if (gearId) console.log(`  Mặc:      ${G.ITEMS[gearId].name} (bậc ${G.ITEMS[gearId].tier || 1}) ở ô ${G.ITEMS[gearId].slot}`);
  if (sk.level > p.level) console.log(`  ⚠ Kỹ năng cần cấp ${sk.level}, nhân vật mới cấp ${p.level} — dùng được để test nhưng người chơi thật sẽ không học được.`);
  if (!p.school) console.log('  ⚠ Nhân vật chưa thức tỉnh class: không dùng được kỹ năng nào cho tới khi có class.');

  await store.close();
})().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
