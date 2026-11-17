'use strict';
// Kiểm tra panel kỹ năng render được và TUYỆT PHẨM hiện đúng dạng trụ riêng.
const fs = require('fs');
const vm = require('vm');
const G = require('../../../shared');

const src = fs.readFileSync('public/js/ui/panels/skills.js', 'utf8');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const UI = { _: { G, esc, S: {}, PANELS: {} }, refresh() {}, log() {} };
const sandbox = { UI, GameData: G, App: { stats: { costMul: 1 }, player: null }, console, document: { addEventListener() {} } };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
console.log('panel nap OK');

const p = G.newPlayer('test');
p.school = 'phap_su';
p.level = 80;
p.skills = { ulChung1: 3, ps1: 2 };
p.superUlts = { ulPhapSuper: true, ulTankSuper: true };
p.skillSlots[G.ULT_SLOT] = 'ulPhapSuper';
sandbox.App.player = p;

const raw = UI._.PANELS.skills();
const html = Array.isArray(raw) ? raw.join('') : String(raw);
console.log('render OK, do dai =', html.length);

let bad = 0;
const ok = (c, label) => { console.log(`  ${c ? '✓' : '✗'} ${label}`); if (!c) bad++; };

ok(/sk-section-superult/.test(html), 'có section TUYỆT PHẨM riêng');
ok(/is-superult/.test(html), 'có thẻ TUYỆT PHẨM');
ok(/Cái giá/.test(html), 'hiện cái giá của chiêu');
ok(/2 lần mỗi 60 giây/.test(html), 'hiện giới hạn 2 lần/60 giây');
ok(/TUYỆT PHẨM/.test(html), 'có nhãn TUYỆT PHẨM');

// Cắt riêng phần TUYỆT PHẨM để kiểm nó KHÔNG có pips/cấp/nút nâng.
const start = html.indexOf('sk-section-superult');
const superPart = start >= 0 ? html.slice(start) : '';
ok(superPart.length > 0, 'tách được phần TUYỆT PHẨM để kiểm');
ok(!/sk-pips/.test(superPart), 'phần TUYỆT PHẨM KHÔNG có pips');
ok(!/Cấp \d+\/\d+/.test(superPart), 'phần TUYỆT PHẨM KHÔNG hiện "Cấp x/10"');
ok(!/\+1 cấp/.test(superPart), 'phần TUYỆT PHẨM KHÔNG có nút +1 cấp');
ok(!/CỐ ĐỊNH/.test(superPart), 'không còn nhãn "CỐ ĐỊNH" giả làm nút');
ok(/data-act="set_skill"/.test(superPart), 'vẫn gắn được vào ô R/X/Z');

// Kỹ năng thật vẫn giữ nguyên hành vi cũ.
const beforeSuper = start >= 0 ? html.slice(0, start) : html;
ok(/sk-pips/.test(beforeSuper), 'tuyệt kỹ thường vẫn có pips');
ok(/\+1 cấp/.test(beforeSuper), 'kỹ năng thường vẫn có nút +1 cấp');

console.log(bad ? `\n✗ ${bad} kiểm tra không đạt.` : '\n✓ Panel render đúng.');
process.exitCode = bad ? 1 : 0;
