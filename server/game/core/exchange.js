'use strict';
/*
 * Luật chuyển vật phẩm / xu giữa hai nhân vật (giao dịch trực tiếp). Chạy ĐỒNG BỘ bên trong xplayer.mutateTwo:
 * kiểm tra lại toàn bộ lúc thực hiện, lỗi thì ném GameError và cả hai nhân vật được hoàn tác.
 */
const G = require('../../../shared');
const { fail } = require('./util');
const { addItem, addInst } = require('./inventory');

const MAX_ITEMS = 8;
const MAX_GOLD = 999999999;

// Làm sạch dữ liệu client gửi lên (chưa kiểm tra theo nhân vật)
function normalizeOffer(raw) {
  const items = [];
  const seen = new Set();
  for (const it of Array.isArray(raw && raw.items) ? raw.items.slice(0, MAX_ITEMS) : []) {
    const uid = Number(it && it.uid), qty = Number(it && it.qty);
    if (!Number.isInteger(uid) || !Number.isInteger(qty) || qty < 1 || seen.has(uid)) continue;
    seen.add(uid);
    items.push({ uid, qty });
  }
  let gold = Number(raw && raw.gold);
  if (!Number.isFinite(gold) || gold < 0) gold = 0;
  gold = Math.min(MAX_GOLD, Math.floor(gold));
  return { items, gold };
}

// Đối chiếu với túi thật: trả về [{ entry, qty }]; sai thì GameError
function checkOffer(p, offer) {
  const out = [];
  for (const it of offer.items) {
    const entry = p.bag.find((e) => e.uid === it.uid);
    if (!entry) fail('Có vật phẩm không còn trong túi.');
    const def = G.ITEMS[entry.id];
    if (!def) fail('Vật phẩm không hợp lệ.');
    if (def.kind === 'quest') fail(`${def.name} là vật phẩm nhiệm vụ, không giao dịch được.`);
    const max = def.stack ? entry.qty : 1;
    if (it.qty > max) fail(`Không đủ số lượng ${def.name}.`);
    out.push({ entry, qty: it.qty });
  }
  if (offer.gold > p.gold) fail('Không đủ xu như đã đặt.');
  return out;
}

function take(p, resolved) {
  const out = [];
  for (const { entry, qty } of resolved) {
    const def = G.ITEMS[entry.id];
    if (def.stack) {
      entry.qty -= qty;
      if (entry.qty <= 0) p.bag.splice(p.bag.indexOf(entry), 1);
      out.push({ stack: true, id: entry.id, qty });
    } else {
      p.bag.splice(p.bag.indexOf(entry), 1);
      out.push({ stack: false, inst: { ...entry } });
    }
  }
  return out;
}

function give(p, parts, name) {
  for (const o of parts) {
    const ok = o.stack ? addItem(p, o.id, o.qty) : addInst(p, o.inst);
    if (!ok) fail(`Túi của ${name} không đủ chỗ.`);
  }
}

const brief = (parts, gold) => ({
  gold,
  items: parts.map((o) => (o.stack ? { id: o.id, qty: o.qty } : { id: o.inst.id, qty: 1, plus: o.inst.plus || 0, q: o.inst.q || 1 })),
});

// Thực hiện giao dịch. offA / offB đã qua normalizeOffer. Trả về bản tóm tắt để ghi nhật ký.
function executeTrade(pA, pB, offA, offB, nameA, nameB) {
  const ra = checkOffer(pA, offA), rb = checkOffer(pB, offB);
  const partsA = take(pA, ra), partsB = take(pB, rb);
  give(pB, partsA, nameB);
  give(pA, partsB, nameA);
  pA.gold = pA.gold - offA.gold + offB.gold;
  pB.gold = pB.gold - offB.gold + offA.gold;
  return { a: brief(partsA, offA.gold), b: brief(partsB, offB.gold) };
}

module.exports = { MAX_ITEMS, MAX_GOLD, normalizeOffer, checkOffer, executeTrade };
