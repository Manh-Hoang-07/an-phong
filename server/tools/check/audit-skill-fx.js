'use strict';
/*
 * Kiểm tra: mỗi trường dữ liệu của kỹ năng có được engine vẽ ra không.
 *
 * Vấn đề gốc: dữ liệu khai báo `hits`, `finisher`, `knock`, `distance`… nhưng
 * public/js/scene/skills.js chỉ đọc một phần. Trường không ai đọc = mô tả nói dối.
 *
 * Script đối chiếu 3 nguồn:
 *   1. trường khai báo trong shared/data/skills/**
 *   2. trường mà renderer thực sự đọc (CONSUMED, khớp với skills.js)
 *   3. mô tả (desc / t5 / t10) có nhắc tới khái niệm mà engine không làm được
 *
 * Chạy: node server/tools/check/audit-skill-fx.js
 */
const G = require('../../../shared');

// Trường mà public/js/scene/skills.js thực sự dùng, theo từng `type`.
// Đây là hợp đồng: thêm trường vào dữ liệu thì phải thêm vào đây VÀ vào renderer.
const CONSUMED = {
  melee: ['power', 'hits', 'range', 'finisher', 'vsSlowed', 'knock', 'stun', 'slow', 'freeze', 'shred'],
  dash: ['power', 'distance', 'after', 'knock', 'stun', 'slow', 'freeze', 'shred'],
  projectile: ['power', 'range', 'count', 'pierce', 'slow', 'freeze', 'shred', 'knock', 'stun', 'school'],
  spread: ['power', 'range', 'count', 'slow', 'freeze', 'shred', 'knock', 'stun', 'pierce'],
  aoe: ['power', 'radius', 'freeze', 'slow', 'chain', 'heal', 'knock', 'stun', 'shred'],
  heal: ['heal', 'mpHeal'],
  buff: ['buff', 'duration', 'atkBuff', 'critBuff', 'speedBuff', 'regen', 'exec'],
  guard: ['duration', 'reduce', 'reflect', 'atkBuff', 'critBuff', 'speedBuff'],
  manashield: ['duration', 'absorb'],
  backstep: ['power', 'distance', 'count', 'slow', 'freeze', 'knock', 'stun'],
  sword_fall: ['power', 'radius', 'count', 'knock', 'stun'],
  arrow_rain: ['power', 'arrows', 'width', 'slow', 'knock', 'stun'],
  meteor: ['power', 'radius', 'count', 'knock', 'chain', 'stun', 'heal'],
  summon: [],
  shadow_toggle: [],
  shadow_command: ['power', 'radius', 'freeze'],
  execute: ['selfZero', 'buaSaves', 'range', 'reach', 'execPvp', 'execOverLevel', 'execOverHp'],
  // Tử Linh Dung Hợp: cộng dồn chỉ số bóng ma (shared/data/pets/shadow.js) trong fusionSec giây
  fusion: ['fusionSec', 'fusionCost'],
  // Cấm Chú Giải Phóng: đốt toàn bộ MP, sát thương = MP × mpPower, phong ấn hồi MP lockSec giây
  manaburst: ['radius', 'mpPower', 'lockSec', 'knock'],
  // Vạn Pháp Quy Nhất: tung cả ba tuyệt kỹ chung, power riêng cho vụ nổ, phong ấn kỹ năng lockSec giây
  allin: ['power', 'radius', 'lockSec', 'knock'],
};

// Trường chung luôn được đọc ở mọi kỹ năng
const COMMON = ['school', 'evolutionKey', 'icon', 'name', 'level', 'mp', 'cd', 'type', 'desc',
  'm5', 't5', 'm10', 't10', 'ult', 'ultSchools', 'ultAny', 'lv', 'shopNgoc', 'superUlt', 'cost',
  // priceLevel: không phải trường của engine chiến đấu, nhưng shared/data/items/index.js:88 đọc nó
  // để tính giá Linh Ngọc của sách tuyệt kỹ (tách "cấp học" khỏi "mốc giá").
  'priceLevel'];

// Type mà bản thân nó đã đánh trúng MỌI quái trong vùng quét → "xuyên" là đúng sẵn,
// không cần trường `pierce` (hitBox/hitCircle không dừng ở mục tiêu đầu tiên).
const AREA_TYPES = new Set(['melee', 'dash', 'aoe', 'sword_fall', 'meteor', 'arrow_rain', 'shadow_command']);

// Mô tả nhắc tới khái niệm này thì engine phải làm được.
// `any`: có MỘT trong các trường này là đủ (nhiều cách diễn đạt cùng một ý).
// `except`: type mà khái niệm đó không áp dụng (tránh báo nhầm).
const DESC_CLAIMS = [
  { re: /hất văng|đẩy lùi|đánh bật/i, any: ['knock'], label: 'hất văng / đẩy lùi' },
  { re: /choáng/i, any: ['stun'], label: 'choáng' },
  { re: /xuyên/i, any: ['pierce'], areaOk: true, label: 'xuyên' },
  { re: /làm chậm/i, any: ['slow'], label: 'làm chậm' },
  { re: /đóng băng/i, any: ['freeze'], label: 'đóng băng' },
  { re: /hồi .*máu|hồi phục sinh lực|hút.*sinh lực/i, any: ['heal', 'regen'], label: 'hồi máu' },
  // "năng lượng" trong kỹ năng khiên là chuyện LẤY năng lượng ra đỡ đòn, không phải hồi năng lượng.
  // Cấm Chú Giải Phóng thì nói ngược lại: nó CHẶN hồi năng lượng — cũng không cần mpHeal.
  { re: /hồi .*năng lượng/i, any: ['mpHeal'], except: ['manashield', 'manaburst'], label: 'hồi năng lượng' },
  { re: /nhát cuối|đòn cuối|kết liễu/i, any: ['finisher'], label: 'nhát cuối mạnh hơn' },
  // Nhiều nhát: hits, hoặc count (nhiều đợt/nhiều thanh), hoặc arrows, hoặc after (chém bồi)
  { re: /liên tiếp|liên hoàn|dồn dập|nhiều nhát|\d+ nhát|hai nhát|ba nhát/i, any: ['hits', 'count', 'arrows', 'after'], label: 'nhiều nhát' },
  { re: /phản lại|phản \d|chém trả|phản chấn|phản một phần/i, any: ['reflect'], label: 'phản sát thương' },
  { re: /giảm .*sát thương/i, any: ['reduce'], label: 'giảm sát thương' },
  { re: /nổ lan|dây chuyền/i, any: ['chain'], label: 'nổ lan' },
  { re: /chịu thêm .*sát thương/i, any: ['shred'], label: 'tăng sát thương nhận' },
];

const problems = [];

function fieldsOf(sk) {
  const out = new Set();
  for (const k of Object.keys(sk)) {
    if (k === 'm5' || k === 'm10') { for (const kk of Object.keys(sk[k] || {})) out.add(kk); continue; }
    out.add(k);
  }
  return out;
}

function descText(sk) {
  return [sk.desc, sk.t5, sk.t10].filter(Boolean).join(' ');
}

for (const [id, sk] of Object.entries(G.SKILLS)) {
  const type = sk.type;
  const consumed = new Set([...(CONSUMED[type] || []), ...COMMON]);
  const declared = fieldsOf(sk);
  const ignored = [...declared].filter(f => !consumed.has(f));

  // 1. Trường khai báo mà renderer không đọc
  if (ignored.length) problems.push({ id, name: sk.name, type, kind: 'trường bị bỏ qua', detail: ignored.join(', ') });

  // 2. Mô tả hứa điều engine không làm
  const text = descText(sk);
  for (const c of DESC_CLAIMS) {
    if (!c.re.test(text)) continue;
    if (c.except && c.except.includes(type)) continue;
    if (c.areaOk && AREA_TYPES.has(type)) continue;
    const ok = c.any.some(f => declared.has(f) && consumed.has(f));
    if (!ok) problems.push({ id, name: sk.name, type, kind: 'mô tả không khớp', detail: `nhắc "${c.label}" nhưng không có ${c.any.join(' / ')} được engine đọc` });
  }

  // 3. type không có trong bảng = renderer không có case
  if (!CONSUMED[type]) problems.push({ id, name: sk.name, type, kind: 'type lạ', detail: `renderer không có case '${type}'` });
}

// 4. Trường có trong dữ liệu nhưng KHÔNG type nào đọc (chết hoàn toàn)
const allConsumed = new Set([...Object.values(CONSUMED).flat(), ...COMMON]);
const allDeclared = new Set();
for (const sk of Object.values(G.SKILLS)) for (const f of fieldsOf(sk)) allDeclared.add(f);
const dead = [...allDeclared].filter(f => !allConsumed.has(f));

console.log('=== TỔNG QUAN ===');
console.log('Số kỹ năng:', Object.keys(G.SKILLS).length);
console.log('Trường chết (không type nào đọc):', dead.length ? dead.join(', ') : 'không có');
console.log('');

if (problems.length) {
  console.log('=== VẤN ĐỀ (' + problems.length + ') ===');
  const byKind = {};
  for (const p of problems) (byKind[p.kind] = byKind[p.kind] || []).push(p);
  for (const [kind, list] of Object.entries(byKind)) {
    console.log('\n-- ' + kind + ' (' + list.length + ') --');
    for (const p of list) console.log(`  [${p.id}] ${p.name} (${p.type}): ${p.detail}`);
  }
} else {
  console.log('Không có vấn đề.');
}

process.exitCode = problems.length ? 1 : 0;
