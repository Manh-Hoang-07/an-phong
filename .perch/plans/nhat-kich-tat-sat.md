# Kế hoạch: Siêu Tuyệt Kỹ "Sinh Tử Đồng Quy"

Ngày: 2026-11-16 · Trạng thái: **đã thực hiện** · Bản 4 (đổi tên + tách bậc siêu tuyệt kỹ)

> Ghi chú: file này từng bị hỏng encoding do một lệnh PowerShell ghi đè sai bảng mã,
> và đã được viết lại. Nội dung dưới đây là bản đang áp dụng trong code.

---

## 1. Tên và bậc

| | |
|---|---|
| Tên | **Sinh Tử Đồng Quy** (sống chết cùng về một chỗ) |
| Id | `ulSinhTu` |
| Bậc | **Siêu tuyệt kỹ** (`superUlt: true`) — bậc trên tuyệt kỹ |
| Cấp cần | 60 |
| Hồi chiêu | 180 giây (cấp 5: 165s, cấp 10: 150s) |
| Tốn | **0 MP, 0 thể lực**. Cái giá là MÁU. |
| Ô gắn | Ô tuyệt kỹ R / X (dùng chung ô với tuyệt kỹ thường) |

Bản trước tên "Lấy Mạng Đổi Mạng" — nghe như tên chiêu game mobile. Đổi.

---

## 2. Cơ chế

Dùng chiêu lên **một** mục tiêu trong tầm. Cả hai bên cùng bị rút máu về 0.

```
dùng chiêu
  ├─ KHÔNG có Bùa Hộ Mệnh (hoặc bùa đang hồi chiêu)
  │    ├─ quái  → 0 máu  → chết
  │    └─ bạn   → 0 máu  → chết (mất 5% exp cấp hiện tại, hồi sinh ở làng)
  │
  └─ CÓ Bùa Hộ Mệnh và bùa đang sẵn sàng
       ├─ quái  → 0 máu  → chết (không có bùa, không ai cứu)
       └─ bạn   → 0 máu  → bùa giữ lại 1 máu + bất tử 5–9 giây
```

**Không chặn trùm nào.** Quái thường, tinh anh, thủ lĩnh, trùm cuối `Thực Thể Bên Kia Cổng`
(925.000 máu) đều chết. Nhưng muốn giết trùm mà không chết theo thì phải có Bùa.

### 2.1 Vì sao đây là "siêu" tuyệt kỹ

Ba lý do, không phải chỉ vì tên:

1. **Giết được thứ không gì khác giết được.** Trùm cuối 925.000 máu, trần sát thương một đòn
   của server (`CAP_MUL_SKILL = 90`) không bao giờ chạm tới. Chiêu này bỏ qua toàn bộ hệ sát thương.
2. **Không tốn tài nguyên thường.** Không MP, không thể lực — hai thứ mọi tuyệt kỹ khác đều ăn.
3. **Cái giá là mạng.** Không chiêu nào khác trong game bắt bạn trả bằng mạng mình.

---

## 3. Dữ liệu kỹ năng

`shared/data/skills/ult/ult-dac-biet.js`:

```js
ulSinhTu: { school: 'chung', ultAny: true, icon: '💀', name: 'Sinh Tử Đồng Quy', level: 60, mp: 0, cd: 180, ult: true,
  superUlt: true, type: 'execute', shopNgoc: true, selfZero: true, buaSaves: true, range: 520, reach: 320, execPvp: true,
  desc: '...',
  m5: { cd: 165 }, t5: 'Hồi chiêu còn 165 giây.',
  m10: { cd: 176.5 }, t10: 'Hồi chiêu còn 150 giây.' },
```

- Id bắt đầu bằng `ul` nên `signatureUlt` (`shared/logic/skills.js:82`) bỏ qua — không tranh chỗ
  tuyệt kỹ đặc trưng của class nào.
- `m10.cd = 176.5` vì `skillAt` nhân thêm 0,85 ở cấp 10 (`shared/logic/skills.js:27`), nên
  176,5 × 0,85 = 150 đúng như mô tả.
- Nâng cấp chỉ giảm hồi chiêu. Không nâng sát thương (sát thương vốn đã là "chết"), không nâng
  cái giá (cái giá là luật của chiêu, không phải tham số).

---

## 4. Bán ở Lầu Trân Bảo

| | |
|---|---|
| Tên sách | Sách Siêu Tuyệt Kỹ: Sinh Tử Đồng Quy |
| Giá | **420 Linh Ngọc** (210 × 2) |
| Nhóm trên quầy | **Siêu tuyệt kỹ** (nhóm riêng, xếp sau Tuyệt kỹ) |

Giá gấp đôi tuyệt kỹ cùng cấp vì nó là bậc trên, không phải một tuyệt kỹ ngang hàng.
Công thức: `ngocPriceOfUlt(60) = 210`, nhân 2 cho `superUlt` (`shared/data/items/index.js:79`).

Ba chỗ đã sửa để sách lên được quầy:

- `shared/data/items/index.js:85` — đặt giá ngọc khi `!sk.ultAny || sk.shopNgoc`, và
  `ngocGroup = sk.superUlt ? 'superult' : 'ult'`.
- `shared/logic/shop.js:85` — bỏ điều kiện `!sk.ultAny`, chỉ cần có giá ngọc.
- `shared/logic/shop.js:68` — thêm nhóm `['superult', 'Siêu tuyệt kỹ']` vào `NGOC_GROUPS`.

Ba tuyệt kỹ dùng chung cũ (`ulChung1/2/3`) không có `shopNgoc` nên vẫn **không** lên quầy.

### 4.1 Điều cần biết về Linh Ngọc

Trong `shared/` **không có nguồn Linh Ngọc nào**. `linhNgoc` khởi tạo bằng 0
(`shared/logic/player.js:188`), và `grantNgoc` chỉ được gọi từ `rewards.js:43` — tức là từ
**mật mã quà tặng** và **trang admin**. Nhiệm vụ, quái, nhiệm vụ tuần đều không phát ngọc.

Nghĩa là 420 Linh Ngọc hiện **không kiếm được bằng cách chơi**. Nếu ngọc là tiền nạp/quà tặng
thì giá nào cũng được. Muốn người chơi kiếm được thì phải thêm nguồn ngọc trước — việc riêng.

---

## 5. Hai món đắt

**Sách: 420 Linh Ngọc** (đắt nhất game; tuyệt kỹ cao nhất hiện tại là 120).

**Bùa Hộ Mệnh** (`shared/data/items/special.js:38-53`) — 5 bậc, giá **40 / 90 / 180 / 320 / 500**.
Hiệu ứng `undying`: máu về 0 thì giữ 1 máu trong **5 / 6 / 7 / 8 / 9** giây, hồi chiêu **60s**.
Mặc được từ cấp **10 / 30 / 50 / 70 / 90**. Cộng dồn I→V: **1.130 Linh Ngọc**.

Không đổi giá Bùa. Nó đã là món đắt nhất game, và bản này làm nó đắt hơn về giá trị sử dụng:
giờ nó là **thứ duy nhất** cho bạn giết trùm cuối mà không chết theo.

---

## 6. Việc đã làm

| File | Việc | Cỡ |
|---|---|---|
| `shared/data/skills/ult/ult-dac-biet.js` | object kỹ năng `ulSinhTu` | +14 dòng |
| `shared/data/items/index.js` | giá ngọc ×2 cho `superUlt`, nhóm `superult`, tên sách | ~8 dòng |
| `shared/logic/shop.js` | bày sách ở Lầu Trân Bảo + nhóm mới | 2 dòng |
| `public/js/scene/skills.js` | `castExecute`, `executeTarget`, `buaReady`, `dieByExec` | ~85 dòng |
| `server/realtime/index.js` | `onExec` + đăng ký `t: 'exec'` | ~55 dòng |
| `public/js/ui/panels/skills.js` | nhãn SIÊU TUYỆT KỸ, dòng mô tả cái giá | ~4 dòng |
| `public/css/style.css` | `.is-superult`, `.tag-superult` (tím) | 2 dòng |
| `server/tools/check/audit-skill-fx.js` | `CONSUMED.execute`, `superUlt` vào `COMMON` | 2 dòng |
| `server/tools/ops/grant-skill.js` | công cụ mới: gắn kỹ năng vào tài khoản test | 119 dòng |
| `package.json` | `npm run grant-skill` | 1 dòng |

Không đụng: `special.js` (Bùa giữ nguyên), `sections.js` (khóa lạ tự vào `misc`),
`shared/index.js`, `public/index.html` (không thêm file mới), hệ thống thưởng, hệ thống nhiệm vụ.

---

## 7. Ba quyết định kỹ thuật quan trọng

### 7.1 Hồi chiêu do server giữ

`p.execCd` (chiêu) và `p.buaCd` (bùa) đều do server ghi, không tin client. Cả hai rơi vào
section `misc` (`sections.js:35`) nên **tự động được lưu**, không phải sửa `sections.js`.

Vì sao: hồi chiêu bùa là biến client (`this.lastStandCd`, `public/js/scene/combat.js:324`).
Nếu server không giữ bộ đếm riêng thì người chơi spam được chiêu này miễn phí — chiêu hồi 180s,
bùa hồi 60s, nên bùa **luôn** sẵn sàng mỗi lần dùng chiêu.

**Đánh đổi đã biết:** nếu người chơi vừa được bùa cứu do quái đánh rồi dùng chiêu ngay, server
vẫn tưởng bùa sẵn sàng và cho giữ 1 máu lần nữa. Tối đa mỗi 180 giây. Chấp nhận được — chặn
tuyệt đối thì phải cho client làm nguồn sự thật về hồi chiêu, tức là mở lỗ lớn hơn.

### 7.2 Client không gọi `Net.action('die')`

Server đã chạy luật chết (`gameActions.die`) ngay trong `onExec`. Client dùng `dieByExec()`,
không phải `die()`. Gọi thêm action `die` là **chết hai lần**: mất 10% kinh nghiệm và hai bên
tranh nhau ghi `p.hp`.

### 7.3 Đường riêng `t: 'exec'`, không dùng `t: 'hit'`

`onHit` có trần sát thương (`CAP_MUL_SKILL = 90`) và ngân sách sát thương mỗi giây — trùm
925.000 máu không bao giờ lọt. Nên chiêu này đi đường riêng, server tự kiểm tầm, tự giết,
tự ghi cái giá.

---

## 8. Chỗ hở còn lại — nói thẳng

1. **"Ăn gian" 60 giây** ở mục 7.1. Tối đa mỗi 180 giây.
2. **Khiên / giảm sát thương không cứu được.** Cái giá này **không đi qua** `hurtPlayer` — nó
   gán thẳng `App.hp`. Nên `guard`, `manashield`, `reduce`, `absorb` đều vô hiệu. Đây là **cố ý**:
   nếu khiên đỡ được thì chiêu thành miễn phí.
3. **Thú đồng hành không hứng hộ.** `hurtPlayer` chia 18% sát thương cho thú
   (`combat.js:292-303`), nhưng chiêu này không đi qua `hurtPlayer`.
4. **Farm trùm cuối.** Người chơi có Bùa bậc cao (bất tử 9 giây) giết được trùm cuối mỗi 300
   giây hồi sinh, với giá 1 máu. Bùa hồi 60s, chiêu hồi 180s → chu kỳ thực tế 300s, khớp đúng
   hồi sinh trùm. Đây là hệ quả của việc không chặn trùm. Nếu thấy quá mạnh, cách xử gọn nhất là
   thêm `execBlock: ['finalBoss']` — một dòng, quay về như bản 2.

---

## 9. Kiểm chứng

```
node server/tools/check/audit-skill-fx.js
node server/tools/check/check-shared-order.js
node server/tools/check/check-skill-books.js
node server/tools/check/check-special-gear.js
node server/tools/check/check-buff-stacking.js
node server/tools/check/check-mob-death.js
```

Kết quả: tất cả đạt. `audit-skill-fx` còn một lỗi của `th11` (Vạn Linh Quy Tụ) — **có từ trước**,
đã xác nhận bằng `git stash`, không liên quan thay đổi này.

### 9.1 Gắn kỹ năng vào tài khoản test

```
npm run grant-skill -- <tên đăng nhập> ulSinhTu 10 --gear bua_db_5
```

Học cấp 10, gắn ô R, mặc Bùa bậc V. **Tắt server trước khi chạy**, nếu không bản trong bộ nhớ
server sẽ ghi đè.

### 9.2 Sáu tình huống chạy thật

1. Mua sách ở Lầu Trân Bảo (420 ngọc), đọc, gắn ô R.
2. **Không đeo Bùa**, quái thường → cả hai chết, mình về làng, mất 5% exp.
3. **Đeo Bùa**, quái thường → quái chết, mình **1 máu + bất tử 5–9 giây**.
4. **Đeo Bùa**, trùm thường (Thạch Vương) → trùm chết, mình 1 máu.
5. **Đeo Bùa**, trùm cuối (925.000 máu) → **chết ngay**, mình 1 máu.
6. Bấm lại lần hai trong 180s → không ăn, không mất máu.
