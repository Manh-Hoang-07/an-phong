'use strict';
/*
 * Kiểm tra vị trí nhân vật được giữ khi thoát game và vào lại.
 * Chạy offline (không cần server): node server/tools/check/check-player-pos.js
 *
 * Lỗi cũ: server lưu đúng x/y nhưng KHÔNG xoá cờ `arrive` (điểm tới của lần đổi bản đồ).
 * Lúc mở lại game, client (public/js/scene/player.js buildPlayer) thấy arrive khác null nên
 * bỏ qua x/y và ném nhân vật về cổng → "vào lại không ở vị trí cũ".
 */
const path = require('path');
const G = require(path.join(__dirname, '..', '..', '..', 'shared'));
const actions = require(path.join(__dirname, '..', '..', 'game', 'actions', 'world'));
const { migrate } = require(path.join(__dirname, '..', '..', 'game', 'index'));

let fails = 0, checks = 0;
function ok(cond, label, extra) {
  checks++;
  if (cond) { console.log(`  ✓ ${label}`); return true; }
  fails++; console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`); return false;
}

// Đúng logic public/js/scene/player.js buildPlayer: có dùng vị trí đã lưu hay không
function clientUsesSavedPos(p) {
  return p.x != null && p.y != null && !p.arrive;
}

function newChar(map) {
  const p = G.newPlayer('Test');
  p.map = map || 'lang';
  p.x = null; p.y = null;
  return p;
}

console.log('1. Lưu vị trí khi đang có cờ arrive (đúng tình huống gây lỗi)');
{
  const p = newChar();
  p.arrive = 'S';               // server đặt khi đổi bản đồ
  actions.save(p, { map: p.map, x: 1500, y: 610, hp: 100, mp: 50 });
  ok(p.x === 1500 && p.y === 610, 'lưu đúng vị trí', `x=${p.x} y=${p.y}`);
  ok(!p.arrive, 'cờ arrive được xoá sau khi lưu vị trí', JSON.stringify(p.arrive));
  ok(clientUsesSavedPos(p), 'client sẽ dùng vị trí đã lưu, không ném về cổng');
}

console.log('\n2. Cờ arrive kiểu khác (">", "<") cũng phải bị xoá');
for (const flag of ['>', '<', 'S', 'E']) {
  const p = newChar();
  p.arrive = flag;
  actions.save(p, { map: p.map, x: 800, y: 500 });
  ok(!p.arrive && p.x === 800, `arrive="${flag}" → đã xoá, giữ vị trí`, JSON.stringify(p.arrive));
}

console.log('\n3. Lưu nhiều lần liên tiếp (autoSave mỗi 10 giây) vẫn giữ vị trí');
{
  const p = newChar();
  p.arrive = 'S';
  for (const x of [1000, 1100, 1200, 1300]) actions.save(p, { map: p.map, x, y: 610 });
  ok(p.x === 1300 && !p.arrive, 'vị trí cuối đúng, không còn cờ arrive', `x=${p.x} arrive=${JSON.stringify(p.arrive)}`);
}

console.log('\n4. Lưu khi đang nhảy (không có x/y) KHÔNG được xoá vị trí cũ');
{
  const p = newChar();
  actions.save(p, { map: p.map, x: 2000, y: 610 });
  actions.save(p, { map: p.map, hp: 90 });   // autoSave lúc đang nhảy: bỏ x/y
  ok(p.x === 2000 && p.y === 610, 'vị trí cũ được giữ nguyên', `x=${p.x} y=${p.y}`);
}

console.log('\n5. Lưu sai bản đồ bị bỏ qua (không ghi vị trí của map khác)');
{
  const p = newChar('lang');
  p.arrive = 'S';
  actions.save(p, { map: 'cong_do', x: 999, y: 999 });
  ok(p.x === null && p.arrive === 'S', 'không ghi vị trí của bản đồ khác', `x=${p.x} arrive=${JSON.stringify(p.arrive)}`);
}

console.log('\n6. Dữ liệu người chơi cũ: migrate dọn cờ arrive còn sót');
{
  const p = newChar();
  p.x = 4830; p.y = 610; p.arrive = '>';   // đúng trạng thái user 1 trong DB thật
  migrate(p);
  ok(!p.arrive, 'migrate xoá cờ arrive khi đã có vị trí', JSON.stringify(p.arrive));
  ok(p.x === 4830 && p.y === 610, 'migrate giữ nguyên vị trí', `x=${p.x} y=${p.y}`);
  ok(clientUsesSavedPos(p), 'client dùng vị trí đã lưu');
}

console.log('\n7. migrate không xoá arrive khi chưa có vị trí (lần đầu vào map mới)');
{
  const p = newChar();
  p.x = null; p.y = null; p.arrive = 'S';
  migrate(p);
  ok(p.arrive === 'S', 'giữ cờ arrive để client đặt đúng điểm tới', JSON.stringify(p.arrive));
}

console.log('\n8. Đổi bản đồ: server vẫn đặt arrive và xoá vị trí (dùng cho lần dựng cảnh ngay sau đó)');
{
  const p = newChar('lang');
  const map = G.MAPS['lang'];
  const portalCh = Object.keys(map.portals)[0];
  const st = G.portalStatus(p, 'lang', portalCh);
  if (!st.ok) {
    console.log(`  (bỏ qua: chưa đủ điều kiện qua cổng "${portalCh}" — ${st.reason})`);
  } else {
    const ev = [];
    actions.change_map(p, { portal: portalCh, hp: 100, mp: 50 }, ev);
    ok(p.map === map.portals[portalCh].to, 'đã đổi bản đồ', p.map);
    ok(p.x === null && p.y === null, 'vị trí được xoá để client đặt theo cổng');
    ok(!!p.arrive, 'có cờ arrive cho lần dựng cảnh', JSON.stringify(p.arrive));
  }
}

console.log(`\n${fails ? '✗' : '✓'} ${checks - fails}/${checks} kiểm tra đạt.`);
process.exit(fails ? 1 : 0);
