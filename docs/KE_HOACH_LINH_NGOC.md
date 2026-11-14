# Kế hoạch: Linh Ngọc — tiền tệ trân bảo

Trạng thái: **kế hoạch, chưa thực hiện**. Các quyết định đã chốt:

- NPC riêng chỉ bán bằng ngọc (không mua/bán bằng xu), gỡ vật phẩm khỏi quầy xu.
- Sách tuyệt kỹ bán cho mọi class (không lọc), **loại 3 tuyệt kỹ dùng chung `ulChung1–3`** (còn 20 cuốn). Giá tính theo sức mạnh (cấp) tuyệt kỹ.
- Vật phẩm mua bằng ngọc là **vật phẩm bình thường**: giao dịch người-với-người và đăng chợ được như mọi món khác. Chỉ khác ở chỗ nguồn mua duy nhất là Linh Ngọc. Bản thân Linh Ngọc thì không chuyển nhượng được.

## 1. Mục tiêu và ràng buộc

Thêm loại tiền tệ thứ hai bên cạnh **xu**, dùng riêng cho vật phẩm hiếm. Ràng buộc gốc:

- **Chỉ một nguồn sinh ra Linh Ngọc ở giai đoạn này: nhập mật mã.** Không rơi từ quái, không thưởng nhiệm vụ, không bán đồ lấy ngọc. Số dư ngọc không chuyển cho người khác, không đăng chợ.
- **Một NPC mới chuyên bán bằng ngọc, chỉ nhận ngọc.** Vật phẩm nào chuyển sang ngọc thì **gỡ khỏi quầy xu hiện tại**, không bán song song hai nơi.
- Không đụng vào kinh tế xu hiện có. Xu vẫn là tiền chính; Linh Ngọc là tầng trên.
- Vật phẩm trân bảo **không bán cho tiệm NPC lấy xu** (giá xu = 0) nên không có đường quy đổi trực tiếp ngọc → xu qua tiệm.
- Vật phẩm trân bảo **giao dịch và đăng chợ như vật phẩm thường** (code hiện tại chỉ chặn `kind: 'quest'`, nên không phải sửa `exchange.js` / `market.js`). Hệ quả: có đường quy đổi gián tiếp ngọc → vật phẩm → xu giữa người chơi. Xem mục 14.
- **Để ngỏ đường nạp bằng tiền thật.** Chưa làm ở giai đoạn này, nhưng mọi thay đổi số dư phải đi qua một hàm duy nhất để sau này cắm cổng thanh toán vào mà không phải refactor (mục 9).

## 2. Tên và biểu tượng

| | |
|---|---|
| Tên | **Linh Ngọc** |
| Biểu tượng | 💎 |
| Khóa dữ liệu | `p.linhNgoc` (số nguyên, mặc định 0) |
| Nhãn ngắn trong UI | "ngọc" |

## 3. NPC mới: Lầu Trân Bảo

Một NPC riêng, không dùng chung quầy với Chủ tiệm Tư. Nó là điểm đến, không phải quầy tiện. **Chỉ bán bằng ngọc**: không có tab mua xu, không có tab bán.

```
tran_bao: { name: 'Lầu Trân Bảo', role: 'shop', color: 0x8a6a2f, ngocShop: true,
  greet: 'Xu mua được đồ thường. Ngọc thì mua được thứ người ta không bán cho ai.',
  shop: ['bua_x2_kinh_nghiem', 'sach_ky_nang', 'sach_tay_ky_nang',
         'sach_mo_rong_thuong', 'sach_mo_rong_tuyet_ky'] }
```

Sách tuyệt kỹ (`sach_tk_*`) **không liệt kê tay** — `ngocShopItems` tự sinh 20 cuốn tuyệt kỹ class từ `G.SKILLS` (có `sk.ult`, **không** có `sk.ultAny`; mục 7.2). Thêm tuyệt kỹ class mới sau này là nó tự có mặt, không phải sửa danh sách. Ba tuyệt kỹ dùng chung `ulChung1–3` không bán: chúng đã có đường kiếm miễn phí qua chuỗi nhiệm vụ Khảo hạch Tuyệt Kỹ (`side.js`).

Chỉ đứng ở Tân Đô I. `villages.js` nhân bản NPC theo danh sách `STAFF`; không thêm `tran_bao` vào đó.

## 4. Bảng giá khởi điểm

Đơn vị: Linh Ngọc. Sửa được ở đúng một nơi (`priceNgoc` trên từng vật phẩm).

| Vật phẩm | id | Giá ngọc | Ghi chú |
|---|---|---|---|
| Bùa nhân đôi kinh nghiệm (60 phút) | `bua_x2_kinh_nghiem` | 8 | đồ tiêu hao, dùng lặp lại |
| Sách Tẩy Kỹ Năng | `sach_tay_ky_nang` | 15 | xóa cả kỹ năng thường lẫn tuyệt kỹ, như hành vi hiện tại |
| Sách Kỹ Năng (+1 điểm) | `sach_ky_nang` | 20 | |
| Sách Mở Rộng Ô Kỹ Năng | `sach_mo_rong_thuong` | 35 | bậc quyền lực cao nhất |
| Sách Mở Rộng Ô Tuyệt Kỹ | `sach_mo_rong_tuyet_ky` | 45 | |
| **Sách Tuyệt Kỹ (20 chiêu class, mọi class thấy hết)** | `sach_tk_<id>` | **50–120 theo cấp** | sinh tự động, **không lọc theo class**, xem bảng dưới |

**Giá tuyệt kỹ theo sức mạnh.** Một công thức, đặt ở một nơi: `ngocPriceOfUlt(level) = round((4 × level − 30) / 5) × 5`.

| Cấp tuyệt kỹ | Giá | Số cuốn | Id |
|---|---|---|---|
| 20 | 50 | 8 | `pa5` `hl5` `tn5` `vn1` `st5` `tk5` `tl5` `nl5` (tuyệt kỹ gốc mỗi class) |
| 30 | 90 | 7 | `ulKiem1` `ulSat1` `ulTank1` `ulCung1` `ulPhap1` `ulTri1` `ulLinh1` |
| 35 | 110 | 4 | `ulKiem2` `ulTank2` `ulPhap2` `ulLinh2` |
| 38 | 120 | 1 | `ulCung2` |

Trọn bộ 20 cuốn = 400 + 630 + 440 + 120 = **1.590 ngọc**. Giá chỉ là điểm khởi đầu; chỉnh công thức hoặc ghi đè `priceNgoc` từng cuốn nếu cần.

Tùy chọn: `sach_ky_nang_vo_dinh` (25 ngọc) — hiện là vật phẩm chết, chỉ có từ 2 nhiệm vụ cốt truyện. Bán được thì nó có nguồn thứ hai; không bán cũng không sao.

**Vì sao giá này:** sách mở rộng ô là bước nhảy vĩnh viễn (mỗi loại tối đa +2 ô, xem `SKILL_EXPAND_MAX`), nên đắt. Sách tẩy là tiện ích dùng lại nhiều lần. Bùa x2 là đồ tiêu hao nên rẻ nhất. Tuyệt kỹ đắt nhất vì nó là nội dung cuối game, và giá tăng theo cấp để cuốn mạnh không rẻ ngang cuốn yếu.

**Về trần điểm kỹ năng:** không cần đặt trần cho Sách Kỹ Năng. Điểm bị chặn tự nhiên bởi số ô học (5 + tối đa 2 mỗi loại) nhân `SKILL_MAX`. Mua thêm chỉ đốt ngọc chứ không phá cân bằng.

## 5. Gỡ khỏi quầy xu

Đây là yêu cầu riêng, nên phải làm dứt khoát chứ không để hai đường mua.

### 5.1 `shared/logic/shop.js`

- **Xóa hẳn dòng 32**: `add(['sach_mo_rong_thuong', 'sach_mo_rong_tuyet_ky', 'sach_tay_ky_nang']);` trong nhánh `shopKind === 'gear'`. Đây là chỗ duy nhất ba cuốn sách đó lọt vào quầy Chủ tiệm Tư.
- **`shopItems`** thêm một dòng lọc đầu ra: bỏ mọi món có `priceNgoc`. Chốt chặn để món ngọc không bao giờ lọt sang quầy xu dù sau này ai thêm id vào `n.shop`.
- `sach_ky_nang` và `bua_x2_kinh_nghiem` hiện **không** bán ở đâu cả (price 0, chỉ có từ nhiệm vụ / mã), nên không phải gỡ — chỉ thêm `priceNgoc` là chúng xuất hiện ở Lầu Trân Bảo.

### 5.2 Những gì KHÔNG đổi

- Quầy xu của Chủ tiệm Tư: trang bị, đá cường hóa — nguyên vẹn.
- Quầy Dược sư: thuốc, đá cường hóa — nguyên vẹn.
- **Sách kỹ năng thường** (`sach_kn_*`, sinh theo class, giá `60 × level²`) vẫn bán bằng xu ở Chủ tiệm Tư. Chỉ tuyệt kỹ mới lên ngọc.
- Thưởng nhiệm vụ, thưởng tuần, rơi đồ: không đụng. `sach_ky_nang` vẫn rơi từ nhiệm vụ như cũ.

## 6. Thay đổi dữ liệu vật phẩm

### 6.1 `shared/data/items/books.js`

- `sach_mo_rong_thuong`: `price: 250000` → `price: 0`, thêm `priceNgoc: 35`.
- `sach_mo_rong_tuyet_ky`: `price: 250000` → `price: 0`, thêm `priceNgoc: 45`.
- `sach_tay_ky_nang`: `price: 60000` → `price: 0`, thêm `priceNgoc: 15`. Giữ nguyên `kind: 'erase_book'` không có `ult` — nó xóa được cả hai loại như `erase_skill` đang làm, không tách thành hai cuốn.
- `sach_ky_nang`: `price: 0` giữ nguyên, thêm `priceNgoc: 20`.
- `sach_tuyet_ky` (Sách Tuyệt Kỹ Chức Nghiệp): **giữ nguyên định nghĩa, không thêm `priceNgoc`, không bán**. Xem 6.3.

`price: 0` là thay đổi có chủ ý: `sellPrice` trả 0 khi `!def.price`, và action `sell` chặn món có `price` 0, nên sách trân bảo không bán lại được cho tiệm NPC. Giao dịch giữa người chơi và chợ thì **không** phụ thuộc `price` (chỉ chặn `kind: 'quest'`), nên các món này vẫn trao đổi như vật phẩm thường.

### 6.2 `shared/data/items/materials.js`

`bua_x2_kinh_nghiem`: thêm `priceNgoc: 8`, giữ `price: 0`. Sửa chú thích đầu file — đang ghi "chỉ có qua mã quà tặng", đổi thành "mã quà tặng hoặc Lầu Trân Bảo".

### 6.3 `shared/data/items/index.js` — sách tuyệt kỹ

`sach_tuyet_ky` và `sach_tk_<id>` bản chất là một. `sach_tuyet_ky` không có trường `skill`, nên lúc đọc nó mới gọi `G.signatureUlt(p)` để chọn tuyệt kỹ chữ ký của class hiện tại — tức nó chỉ là một cuốn `sach_tk_*` biết tự chọn. Không có lý do bán hai giá cho cùng một thứ.

Quyết định:

- **Bán 20 cuốn tuyệt kỹ class, giá theo cấp.** Vòng lặp dòng 78–83: với `!sk.ultAny` thì thêm `priceNgoc: ngocPriceOfUlt(sk.level)` và `ngocGroup: 'ult'`; đổi desc thành `Mua ở Lầu Trân Bảo hoặc nhận qua mật mã.` Với `sk.ultAny` (`ulChung1–3`) **giữ nguyên**: không `priceNgoc`, desc cũ.
- Cập nhật chú thích dòng 75–77 ("Không bán ở cửa hàng", "chỉ có qua mã quà tặng") cho khớp. Cả ba file `ult-*.js` cũng có dòng "không bán ở cửa hàng" ở đầu; sửa thành "bán ở Lầu Trân Bảo bằng Linh Ngọc".
- **`sach_tuyet_ky` không bán nữa.** Giữ định nghĩa để mã quà tặng cũ và túi đồ cũ vẫn dùng được (nó vẫn hoạt động đúng: tự chọn tuyệt kỹ chữ ký). Không xóa item — xóa là mất đồ của người đang giữ.
- **Không lọc theo class.** `ngocShopItems` bày cả 23 cuốn bất kể người chơi là class nào. Mua nhầm là chuyện của người mua.

**Cảnh báo ở tab ngọc:** `ui.js:610` đã tính sẵn `fits` cho sách tuyệt kỹ. Với cuốn không hợp class thì hiện nhãn đỏ "Không hợp class của bạn" và hỏi xác nhận trước khi mua. Vẫn **không chặn** (người mua có thể mua để tặng/bán lại, vì giờ sách giao dịch được). Toàn Năng đọc được mọi tuyệt kỹ (`ultFits`) nên không bao giờ thấy cảnh báo.

**Hệ quả cần biết trước:** mua `sach_tk_pa5` (tuyệt kỹ Kiếm Sĩ) khi đang là Pháp Sư thì mua được, nhưng **đọc vẫn bị chặn** — `use` trong `items.js` dòng 114 gọi `G.ultFits(p, sk)` và báo "Tuyệt kỹ này không phù hợp với class của bạn." Ngọc vẫn mất. Đó đúng là "mua nhầm thì kệ", nhưng nếu muốn cho **học chéo class** thì phải bỏ kiểm tra `ultFits` ở dòng 114 — việc đó phá cân bằng class, không đề xuất làm trong đợt này. Nói rõ để quyết.

## 7. Logic dùng chung

### 7.1 `shared/logic/player.js`

`newPlayer()`: thêm `linhNgoc: 0` cạnh `gold: 50`.

### 7.2 `shared/logic/shop.js`

Ba hàm mới, xuất trong `Object.assign(G, ...)`:

1. **`ngocShopItems(player, npcId)`** — danh sách id bán bằng ngọc:
   - lấy `n.shop` lọc `ITEMS[id].priceNgoc > 0`;
   - cộng toàn bộ `sach_tk_*` từ `Object.keys(G.SKILLS)` có `sk.ult && !sk.ultAny` (20 cuốn), **không** lọc `ultFits`. Thực chất đã tự có mặt qua `priceNgoc` nếu lọc theo `ITEMS`; chọn cách nào cũng phải loại `ulChung`;
   - **không** qua `capByVillage` (NPC chỉ đứng ở Tân Đô I, và lọc cap theo bậc làng không áp cho sách);
   - sắp xếp: bùa/tiện ích trước, sách sau, tuyệt kỹ cuối, trong nhóm tuyệt kỹ thì theo `sk.level` rồi tên.
2. **`ngocPrice(def, qty = 1)`** — `def.priceNgoc * qty`. **Không** áp `shopDiscount` (khách quen chỉ giảm giá xu).
   Công thức `ngocPriceOfUlt(level)` đặt trong `items/index.js` (nơi sinh `sach_tk_*`, nạp trước `logic/shop.js`) và xuất qua `G`, để giá có đúng một nguồn.
3. **`ngocShopGroups(player, npcId)`** — gom theo `ngocGroup` của vật phẩm (`'util'`, `'book'`, `'ult'`) để tab ngọc không dồn 28 món vào một lưới. Dùng lại đúng cơ chế `shopGroups` đang có.

`ngocGroup` gán trong `books.js` / `materials.js` / `items/index.js`: `bua_x2_kinh_nghiem` → `util`; `sach_ky_nang`, `sach_tay_ky_nang` → `util`; `sach_mo_rong_*` → `book`; `sach_tk_*` → `ult`.

## 8. Server

### 8.1 `server/storage/sections.js`

Thêm `'linhNgoc'` vào mảng `core` của `SECTION_KEYS` (dòng 18). Không cần cột mới trong bảng `players` — ngọc không dùng để xếp hạng hay tra cứu, nằm trong JSON `core` là đủ, và không phải sửa `coreColumns`.

### 8.2 `server/game/index.js`

Không cần sửa. `migrate()` đã có vòng `for (const k in base) if (p[k] === undefined) p[k] = base[k]` (dòng 44), nên mọi nhân vật cũ tự nhận `linhNgoc: 0` ở lần nạp kế tiếp.

### 8.3 `server/game/core/progress.js` — hàm phát ngọc duy nhất

Đây là chỗ chuẩn bị cho việc nạp bằng tiền sau này. **Mọi** thay đổi số dư ngọc phải đi qua một hàm:

```
// Nguồn duy nhất sinh ra Linh Ngọc. src dùng để đối soát: 'code:<MÃ>' hôm nay, 'topup:<ORDER>' sau này.
function grantNgoc(p, amount, src, ev) {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (!n) return 0;
  p.linhNgoc = (p.linhNgoc || 0) + n;
  p.ngocLog = (Array.isArray(p.ngocLog) ? p.ngocLog : []).concat([{ t: Date.now(), n, src }]).slice(-50);
  if (ev) ev.push({ t: 'msg', text: `[Hệ thống] Nhận ${fmt(n)} Linh Ngọc.`, color: '#b388ff' });
  return n;
}
```

Xuất thêm `grantNgoc` trong `module.exports`. `p.ngocLog` rơi vào section `misc` (không khai báo trong `SECTION_KEYS`) nên tự được lưu, không phải sửa gì thêm.

Lý do có `ngocLog`: khi mở nạp tiền, mỗi giao dịch phải đối soát được. Không có log thì tranh chấp "tôi nạp rồi mà không có ngọc" không có gì để tra.

### 8.4 `server/game/actions/items.js` — action `buy_ngoc`

```
buy_ngoc(p, a, ev) {
  const npc = G.NPCS[a.npc];
  if (!npc || !npc.ngocShop || !onCurrentMapNpc(p, a.npc)) fail('Lầu Trân Bảo không ở đây.');
  if (!G.ngocShopItems(p, a.npc).includes(a.item)) fail('Lầu Trân Bảo không bán món này.');
  const def = G.ITEMS[a.item];
  const qty = Math.max(1, Math.min(99, Math.floor(Number(a.qty) || 1)));
  if (!def.stack && qty > 1) fail('Món này chỉ mua từng cái.');
  const cost = G.ngocPrice(def, qty);
  if ((p.linhNgoc || 0) < cost) fail('Không đủ Linh Ngọc.');
  if (bagFree(p) < slotsNeeded(p, a.item, qty)) fail('Túi đã đầy.');
  p.linhNgoc -= cost;
  addItem(p, a.item, qty, { shop: true });
  ev.push({ t: 'msg', text: `Đã mua ${def.name}${qty > 1 ? ' ×' + qty : ''} (-${fmt(cost)} Linh Ngọc).`, color: '#b388ff' });
}
```

Thứ tự kiểm tra quan trọng: kiểm tra túi **trước** khi trừ ngọc, đúng như `buy` đang làm. Sai thứ tự là mất ngọc mà không nhận được đồ.

Action `buy` cũ giữ nguyên và tự động từ chối món ngọc vì chúng không còn trong `shopItems`.

### 8.5 `server/game/actions/character.js` — `redeem`

Trong khối áp dụng phần thưởng (dòng 240–243), thay vì cộng tay:

```
if (r.linhNgoc) grantNgoc(p, r.linhNgoc, 'code:' + key, ev);
```

Đồng thời sửa dòng 226: `onlyMounts` phải tính cả `!r.linhNgoc`, nếu không một mã chỉ tặng ngọc sẽ bị hiểu nhầm là mã chỉ tặng thú đã có và bị từ chối:

```
const onlyMounts = !r.unlockClass && !r.gold && !r.exp && !r.skillPoints && !r.linhNgoc && !items.length;
```

### 8.6 `server/accounts/codes.js`

Cập nhật chú thích `rewards` ở đầu file, thêm `linhNgoc` vào ví dụ.

### 8.7 `server/tools/ops/giftcode.js`

Thêm nhánh `--ngoc <số>` cạnh `--gold`, `--exp`, `--skill-points`. Đây là công cụ duy nhất phát ngọc ra ở giai đoạn này, nên nó phải chạy đúng ngay từ đầu.

## 9. Đường nạp bằng tiền (chưa làm, chỉ chừa chỗ)

Không viết code ở đợt này. Ghi lại để đợt sau không phải đập đi làm lại:

- Mọi cộng ngọc đã đi qua `grantNgoc(p, n, src, ev)` — cổng thanh toán chỉ cần gọi hàm này với `src = 'topup:<mã đơn>'`.
- Cần một bảng riêng trong `db.js`:

  ```
  CREATE TABLE IF NOT EXISTS ngoc_topups (
    order_id TEXT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_vnd BIGINT NOT NULL,
    ngoc INTEGER NOT NULL,
    status TEXT NOT NULL,
    created BIGINT NOT NULL
  );
  ```

  `order_id` là khóa chính, không phải chỉ UNIQUE — đó là chốt chống cộng hai lần khi cổng gọi webhook lặp.
- Webhook phải **idempotent**: tra `order_id`, có rồi thì trả 200 và không cộng lại. Đây là lỗi phổ biến nhất khi làm nạp tiền, và nó cộng ngọc miễn phí cho người biết chọc.
- Không đổi gì ở `exchange.js` / `market.js`: giao dịch và chợ chỉ biết `gold` và vật phẩm, nên **số dư ngọc** không thể chuyển nhượng. Giữ nguyên như vậy — ngọc mà chuyển nhượng được là mở đường cho bán ngọc lấy tiền thật ngoài luồng. Lưu ý: vật phẩm mua bằng ngọc thì giao dịch được (mục 14.8), nên đây chỉ chặn đường trực tiếp.
- Chưa cần làm bây giờ: giá quy đổi, khuyến mãi, hoàn tiền, cổng nào (VNPay / Momo / Stripe). Những thứ đó là quyết định kinh doanh, không phải kỹ thuật.

## 10. Client

### 10.1 `public/js/ui/panels/shop.js` — tab thứ ba

`panelShop` hiện có hai tab Mua/Bán. Với NPC có `n.ngocShop` (Lầu Trân Bảo) thì **không có tab Mua/Bán bằng xu**: panel chỉ có giao diện ngọc, không hiện thanh tab. (Nếu để nguyên, tab Mua sẽ rỗng vì `shopItems` đã lọc hết món `priceNgoc`, còn tab Bán vô nghĩa vì NPC không thu mua.) Các NPC shop khác giữ nguyên hai tab.

- Khi `n.ngocShop`: ép `S.shopTab = 'ngoc'`, `where = 'ngoc'`, bỏ qua giá trị đã lưu của tab trước.
- Lưới hàng dùng `G.ngocShopGroups(p, npc)` thay `shopGroups`, chip nhóm hiện "Tiện ích / Sách / Tuyệt kỹ".
- `shopButtons` thêm nhánh `where === 'ngoc'`: nút "Mua 1" và ô "Mua nhiều" gọi `buy_ngoc`, giá lấy từ `G.ngocPrice`.
- Điều kiện mờ ô (`dim`) dùng `p.linhNgoc` thay `p.gold`.
- `sideHead`: với `where === 'ngoc'` đổi dòng giá thành `Giá: N 💎`, và không hiện dòng "Bán được ... xu".
- Ví đầu bảng: thêm `💎 <b>${fmt(p.linhNgoc || 0)}</b> ngọc` cạnh ví xu.
- Cuốn tuyệt kỹ không hợp class: nhãn đỏ + hỏi xác nhận (mục 6.3).
- Tab Bán của các NPC xu giữ nguyên, không đổi.

Không tạo file panel mới, không phải thêm `<script>` vào `index.html`.

### 10.2 `public/js/ui/actions.js`

Thêm hai case `buy_ngoc` và `buy_ngoc_many`, chuyển tiếp `act('buy_ngoc', { npc, item, qty })`. Theo đúng mẫu `buy` / `buy_many` đang có.

### 10.3 `public/js/ui/panels/bag.js`

Dòng 140 — ví trong Túi đồ: thêm `💎 <b>${fmt(p.linhNgoc || 0)}</b>`.

### 10.4 `public/js/ui/ui.js`

- `NPC_ICONS` (dòng 84): thêm `tran_bao: '💎'`.
- `itemInfo`: khi `d.priceNgoc` thì hiện dòng giá ngọc, và **không** hiện dòng "Bán được: ... xu" (vì `sellPrice` = 0).

### 10.5 `public/js/core/net.js`

Dòng 190 — âm thanh khi có float text: hiện bắt `/xu$/`. Thêm nhánh cho `/ngọc$/` dùng `Sound.play('coin')`.

### 10.6 `public/css/style.css`

Thêm lớp `.wallet-ngoc` cạnh `.bag-wallet` (dòng 913) với tông tím `#b388ff`, để hai loại tiền nhìn khác nhau ngay.

## 11. NPC và bản đồ

- `shared/data/npcs/services.js`: thêm `tran_bao` như mục 3.
- `shared/data/maps/chapter1.js` dòng 19: thêm `J: 'tran_bao'` vào `npcs` của map `lang`.
- `shared/maps/lang.txt` hàng 20: đặt ký tự `J` vào **cột 81**. Hàng này đã kiểm: cột 81, 82, 83, 84 đều là ô trống, cột 79 là quái `d`, cột 77 là `C` (Chợ), cột 102 là cổng.
- Chạy `npm run check:maps` để xác nhận ô đó đi tới được. Nếu báo không tới được, dời sang cột 83.
- **Lưu ý:** `server/tools/gen/gen-maps.js` sẽ ghi đè `lang.txt` nếu ai đó chạy lại. Sau khi sửa tay phải ghi lại việc này, hoặc thêm ký tự vào spec của generator.

## 12. Nguồn thu: chỉ mật mã

Ràng buộc chính là: **Linh Ngọc (số dư) chỉ sinh ra từ mật mã**. Phải kiểm bằng danh sách chứ không bằng trí nhớ. (Vật phẩm mua bằng ngọc thì giao dịch tự do, đó là chủ ý; việc kiểm này chỉ nhắm vào số dư `linhNgoc`.) Sau khi làm xong, chạy:

```
Select-String -Path (Get-ChildItem -Recurse -Include *.js -Path shared,server | % FullName) -Pattern 'linhNgoc'
```

Mọi dòng chứa `linhNgoc` phải rơi vào một trong bốn nhóm: khởi tạo (`newPlayer`), lưu trữ (`sections.js`), chi tiêu (`buy_ngoc`), hoặc cộng qua `grantNgoc` từ `redeem`. Có dòng nào nằm ở chỗ khác — thưởng nhiệm vụ, rơi đồ, bán đồ, chợ, giao dịch — là sai yêu cầu, phải gỡ.

Cụ thể những chỗ **không được** đụng: `server/game/actions/quests.js`, `server/game/core/quests.js`, `server/game/actions/combat.js`, `server/game/actions/market.js`, `server/game/core/exchange.js`.

## 13. Kiểm thử

| Bước | Lệnh / thao tác | Kỳ vọng |
|---|---|---|
| Thứ tự nạp shared | `node server/tools/check/check-shared-order.js` | OK, không thiếu file |
| Bản đồ | `npm run check:maps` | Không báo "KHÔNG TỚI ĐƯỢC" cho `lang` |
| Tạo mã | `npm run giftcode -- add TESTNGOC --ngoc 100 --max-uses 1` | Tạo thành công |
| Nhập mã | Vào Lữ khách bí ẩn, nhập `TESTNGOC` | Nhận 100 ngọc, log hiện đúng |
| Nhập lại | Nhập `TESTNGOC` lần hai | "Bạn đã dùng mật mã này rồi." |
| Mã chỉ tặng ngọc | Mã chỉ có `--ngoc`, không có gì khác | Không bị từ chối nhầm là "mã chỉ tặng thú đã có" |
| Mua đủ ngọc | Mua Sách Mở Rộng Ô Kỹ Năng | Trừ 35 ngọc, sách vào túi |
| Mua thiếu ngọc | Đặt ngọc về 0, mua lại | "Không đủ Linh Ngọc.", không mất gì |
| Túi đầy | Làm đầy túi rồi mua | "Túi đã đầy.", **ngọc không bị trừ** |
| Quầy xu | Mở tiệm Chủ tiệm Tư | Không còn 3 cuốn sách cũ |
| Giao diện Lầu Trân Bảo | Mở NPC | Không có tab Mua/Bán xu; chỉ lưới ngọc |
| Tuyệt kỹ chéo class | Đang Pháp Sư, mở Lầu Trân Bảo | Thấy đúng 20 cuốn, kể cả `sach_tk_pa5`, **không** có `ulChung1–3` |
| Giá theo cấp | Xem giá các cuốn | Cấp 20 = 50, cấp 30 = 90, cấp 35 = 110, `ulCung2` (38) = 120 |
| Cảnh báo class | Chọn `sach_tk_pa5` khi là Pháp Sư | Hiện nhãn "Không hợp class", hỏi xác nhận trước khi mua |
| Mua chéo class | Xác nhận mua `sach_tk_pa5` | Mua được, trừ 50 ngọc |
| Đọc chéo class | Đọc cuốn vừa mua | "Tuyệt kỹ này không phù hợp với class của bạn." (ngọc đã mất — đúng thiết kế) |
| Bán cho tiệm | Chọn sách trân bảo ở tab Bán của Chủ tiệm Tư | "Không bán được vật phẩm này." (`price` 0) |
| Giao dịch | Tặng/đổi sách trân bảo cho người chơi khác, và đăng chợ | Thành công như vật phẩm thường |
| `ulChung` vẫn là quà nhiệm vụ | Hoàn thành Khảo hạch Tuyệt Kỹ | Vẫn nhận `sach_tk_ulChung1` như cũ |
| Nhân vật cũ | Đăng nhập tài khoản tạo trước khi sửa | `linhNgoc` = 0, không lỗi |

## 14. Rủi ro và điểm cần chốt

1. **Tên "Linh Ngọc" lẫn với ô trang bị "ngọc bội".** Nếu thấy khó chịu, đổi thành "Ấn Ngọc" hoặc "Tinh Ngọc" — chỉ sửa nhãn, không sửa khóa dữ liệu.
2. **Bỏ giá xu của 3 cuốn sách là thay đổi kinh tế thật.** Người đang có 250.000 xu chờ mua sách mở rộng sẽ mất đường đó. Đã chốt gỡ khỏi quầy xu, nên đây là chấp nhận có ý thức — nhưng nên báo trước cho người chơi.
3. **Mua chéo class được nhưng đọc thì không.** Đã có cảnh báo + xác nhận ở UI. Vì sách giờ giao dịch được nên mua chéo class có thể là chủ ý (mua để bán/tặng). Nếu muốn học chéo class thật, phải bỏ `G.ultFits` ở `items.js` dòng 114 — không đề xuất.
8. **Ngọc chảy sang xu qua giao dịch/chợ.** Vì vật phẩm trân bảo giao dịch được, người có ngọc bán sách lấy xu, người có xu mua sách của họ. Số dư ngọc vẫn không chuyển được, nhưng giá trị thì chuyển được. Nếu sau này mở nạp tiền thật, đây thành đường mua xu bằng tiền thật (và pay-to-win). Chấp nhận ở giai đoạn mật mã (số ngọc do bạn phát có kiểm soát); **phải quyết lại trước khi mở nạp tiền** — ví dụ khóa giao dịch cho vật phẩm mua từ nạp, hoặc áp giá sàn chợ.
9. **Chợ không biết giá trị ngọc của món.** Người bán tự đặt giá xu từ 1 trở lên, không có gợi ý. Sách trân bảo có thể bị đăng giá bất thường. Không cần xử lý ngay.
4. **Sách đã mua trước đây vẫn dùng được** — không cần migrate túi đồ, chỉ đổi giá và chỗ bán.
5. **`sach_tuyet_ky` thành vật phẩm không nguồn.** Vẫn dùng được, vẫn có trong túi người cũ, nhưng không mua được nữa. Nếu thấy lãng phí thì bỏ hẳn khỏi `books.js` — nhưng ai đang giữ sẽ mất, nên để lại.
6. **`gen-maps.js` ghi đè `lang.txt`.** Ghi lại vào tài liệu dự án, hoặc thêm ký tự NPC vào spec generator.
7. **Chưa có nơi tiêu ngọc thứ hai.** 28 món nghe nhiều, nhưng chỉ 5 món mua lặp lại được; còn lại là mua một lần. Khi người chơi mua hết, ngọc tích lại không có chỗ dùng. Đây là lý do nên tính chuyện mở thêm hàng (ngoại trang, đổi tên, đá quý) ở giai đoạn sau.

## 15. Thứ tự thực hiện đề xuất

1. Dữ liệu: `books.js`, `materials.js`, `items/index.js` (thêm `priceNgoc`, `ngocGroup`, bỏ giá xu).
2. Logic dùng chung: `player.js`, `shop.js` (ba hàm ngọc + lọc khỏi quầy xu).
3. Lưu trữ: `sections.js`.
4. Server: `grantNgoc`, `buy_ngoc`, `redeem`, `giftcode.js`.
5. NPC và bản đồ: `services.js`, `chapter1.js`, `lang.txt`, chạy `check:maps`.
6. Client: `shop.js`, `actions.js`, `bag.js`, `ui.js`, `net.js`, `style.css`.
7. Kiểm thử theo bảng mục 13, rồi chạy lệnh rà `linhNgoc` ở mục 12.

Bước 1–4 chạy được độc lập và đã kiểm được bằng mật mã + lệnh console trước khi đụng vào giao diện. Nếu muốn thấy kết quả sớm, dừng ở bước 4 rồi mới làm UI.
