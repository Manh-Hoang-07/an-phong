# Độ bền trang bị: hướng dẫn tích hợp

Tài liệu cho người nối client / công cụ vào hệ thống độ bền. Thiết kế và lý do nằm ở
`.perch/plans/do-ben-trang-bi.md`; file này chỉ nói **cái gì có, ở đâu, gọi thế nào**.

Kiểm thử: `node server/tools/check/check-durability.js`

---

## 1. Dữ liệu

Mỗi món trang bị (trong `p.bag`, `p.equip[slot]`, kho) có thêm trường tùy chọn:

| Trường | Ý nghĩa |
|---|---|
| `dur` | Điểm độ bền **hiện tại**. **Thiếu trường = đầy.** `0` = hỏng. |
| `warned` | Cờ nội bộ server (đã báo "sắp hỏng"). Client bỏ qua. |

**Không lưu độ bền tối đa.** Nó tính từ cấp món: `G.durMax(def)`. Đổi công thức là áp cho mọi món cũ,
không cần migration. Món cũ không có `dur` coi là đầy.

Đồ có `def.special` hoặc `def.priceNgoc` có độ bền **vô hạn**: không hao, không hỏng, không lưu `dur`.

## 2. API dùng chung (`GameData` / `G`, file `shared/logic/items.js`)

Chạy y hệt ở server và trình duyệt. Client **chỉ đọc**, không tự ghi `dur`.

| Hàm | Trả về |
|---|---|
| `G.durPct(inst)` | % hiển thị 0–100 (còn chút ít hiện tối thiểu 1). `null` nếu vô hạn. |
| `G.isBroken(inst)` | `true` khi `dur <= 0`. Vô hạn luôn `false`. |
| `G.durMax(def)` / `G.durCur(inst)` | Điểm tối đa / hiện tại (`Infinity` nếu vô hạn). |
| `G.durInfinite(def)` | Món có độ bền vô hạn. |
| `G.repairCost(inst)` | `{ gold, stones, pct }`, hoặc `null` nếu không cần sửa / vô hạn. |
| `G.weaponWearPts(kind, mobDef)`, `G.armorWearPts(mobDef)` | Điểm hao một đòn (server dùng). |
| `G.applyWear(inst, pts)`, `G.applyDeathWear(player)`, `G.repairFull(inst)` | Ghi hao / sửa (**chỉ server gọi**). |

Hằng số: `G.DURABILITY` (`shared/data/equipment.js`): `HITS_WEAPON`, `HITS_ARMOR`, `WEAPON_WEAR`, `ARMOR_WEAR`,
`MOB_LEVEL_DIV`, `GRADE_WEAR`, `DEATH_PCT`, `WARN_PCT`, `BROKEN_SELL`, `FLUSH_MS`, `HURT_GAP_MS`.
Muốn đổi cân bằng thì sửa đúng file này.

Hiệu lực của món hỏng đã nằm sẵn ở `calcStats`, `specialFx`, `setCounts`, `nhiemLoad`, `gearSkill`: client chỉ cần
tính lại chỉ số khi nhận patch (đã tự làm trong `App.setPlayer`).

## 3. Giao thức

### 3.1 Client → server (WebSocket `/ws`)

```json
{ "t": "hurt", "u": 123 }
```

Gửi **mỗi khi quái đánh trúng người chơi** (sau khi đã trừ máu, tức đòn thật sự gây sát thương, không phải đòn bị né/đỡ).
`u` = `uid` quái do server quản lý (`monster.uid`). Client **không gửi lượng hao hay cấp quái**.

Server kiểm: quái phải tồn tại trong phòng, ở gần (|dx| ≤ 1500, |dy| ≤ 1000), hai cú cách nhau ≥ 300 ms
(`HURT_GAP_MS`), người chơi không đang chết. Sai thì bỏ qua im lặng.

Đã nối ở: `public/js/scene/combat.js` (`hurtPlayer`). Đòn nào gọi `hurtPlayer` phải truyền được quái:

```js
this.hurtPlayer(atk, dir, push, mon);          // đòn trực tiếp: mon = quái
this.hurtPlayer(dmg, dir, push, null, owner);  // đạn / đòn không phản sát thương: owner = quái bắn
```

Tham số thứ 5 (`src`) mặc định bằng `mon`. Đạn của trùm lưu `owner` ở `enemyShots` (`public/js/scene/boss.js`).
**Thêm đòn quái mới thì phải truyền quái vào `hurtPlayer`**, nếu không đòn đó không hao giáp.

Hao vũ khí **không cần gói mới**: server tự cộng khi nhận `{t:'hit'}` (`onHit`), chỉ với đòn của chính người chơi
(không tính thú / bóng ma).

### 3.2 Server → client

Không có gói realtime riêng. Hao mòn được ghi bằng `xplayer.mutate`, server đẩy **patch nhân vật** như mọi thay đổi
khác (`pushPatch` → `App.applyPatch` → `App.setPlayer`), kèm sự kiện `{ t: 'msg', text, color }`:

- "… sắp hỏng (còn X%)" (màu cam) khi xuống dưới `WARN_PCT` (20%).
- "… đã hỏng! Đến Thợ rèn để sửa." (màu đỏ) khi về 0.

Hao mòn được **gom và ghi mỗi 8 giây** (`FLUSH_MS`) hoặc khi ngắt kết nối, nên thanh độ bền nhảy theo bước,
không giảm từng đòn.

### 3.3 Hành động HTTP (`Net.action(type, data)`)

| Action | Dữ liệu | Ghi chú |
|---|---|---|
| `repair` | `{ slot }` (đang mặc) hoặc `{ uid }` (trong túi) | Đứng gần Thợ rèn. Trừ xu + `da_cuong_hoa` theo `G.repairCost`. Sửa được cả món 0%. Từ chối nếu đã đầy / vô hạn / thiếu xu / thiếu đá. |
| `repair_all` | `{}` | Sửa mọi món **đang mặc** cần sửa. Món nào thiếu tiền thì bỏ qua và báo số món còn lại. |
| `equip` | `{ uid }` | **Từ chối món hỏng** (phải sửa trước). Tháo (`unequip`) vẫn được. |
| `die` | như cũ | Giờ hao thêm `DEATH_PCT` cho mọi ô đang mặc. |
| `sell` | như cũ | `G.sellPrice` tự giảm còn 25% khi hỏng. |

## 4. UI đã có

| Chỗ | File | Việc |
|---|---|---|
| Chi tiết món (túi, tooltip, bảng trang bị) | `public/js/ui/ui.js` `durBar` | Thanh + %, nhãn HỎNG kèm lời nhắc đến Thợ rèn |
| Dòng ô trang bị | `public/js/ui/panels/equip.js` | `durTag`, viền đỏ khi hỏng (`.eq-slot.broken`) |
| Thợ rèn | `public/js/ui/panels/smith.js` | Tab **🔧 Sửa chữa**, nút "Sửa tất cả đang mặc" |
| Xử lý nút | `public/js/ui/actions.js` | `repair`, `repair_all` |
| Style | `public/css/style.css` | `.dur*`, `.dur-bar` |

Helper dùng lại được: `UI._.durTag(entry)` (nhãn ngắn) và `UI._.durBar(entry)` (thanh đầy đủ).
Ngưỡng màu: ≥ 50% xanh, 20–49% vàng, < 20% cam, 0% đỏ.

## 5. Server

| File | Vai trò |
|---|---|
| `server/game/core/durability.js` | Gom hao theo kết nối, ghi mỗi `FLUSH_MS` qua `xplayer.mutate`; `applyPending` (đồng bộ, dễ test) |
| `server/realtime/index.js` | `onHit` gọi `addWeaponWear`; `onHurt` nhận `t:'hurt'`; `close` ghi nốt phần còn gom |
| `server/game/actions/smith.js` | `repair`, `repair_all` |
| `server/game/actions/items.js` | `equip` từ chối món hỏng |
| `server/game/actions/world.js` | `die` hao thêm |

Mỗi cú bị đánh chọn **ô giáp ngẫu nhiên tại lúc ghi** (lúc đó mới biết ô nào đang mặc). Vũ khí không bị trừ khi bị đánh,
giáp không bị trừ khi đánh.

## 6. Cách tích hợp thêm

- **Hiển thị ở chỗ mới** (ô túi, shop, giao dịch): gọi `G.durPct(entry)` / `UI._.durTag(entry)`. Nhớ xử lý `null` (vô hạn).
- **Bán / giao dịch / chợ:** món hỏng đi qua được; chỉ `sellPrice` bị giảm. Nếu muốn chặn hoặc cảnh báo người mua
  món hỏng, đặt ở `server/game/actions/market.js` và `server/game/core/exchange.js` (chưa làm).
- **Tặng đồ test / admin:** chưa có ô nhập `dur`. Đặt thẳng `dur: 0` vào instance để thử món hỏng.
- **Nguồn hao mới** (bẫy, đòn môi trường): server phải có đường tra quái/nguồn gây hại; tái dùng
  `durability.addArmorWear(conn, mdef, now)`.
- **Đổi tốc độ hao:** chỉ sửa `G.DURABILITY`. `durMax` nhân cùng hệ số cấp quái nên số đòn để hỏng gần như đều ở mọi tầng.
- **Triển khai:** `public/index.html` và `shared/index.js` **không đổi** (không thêm file shared mới), nên
  `check-shared-order.js` giữ nguyên. Service worker (`public/sw.js`) cache tên `thuc-tinh-v1`:
  người chơi đang mở trang có thể giữ JS cũ tới khi tải lại; client cũ không gửi `hurt` nên chỉ không hao giáp,
  không lỗi.

## 7. Giới hạn đã biết

1. `hurt` do client báo: client giấu thì giáp không hao (chỉ lợi cho chính họ). Chặn tuyệt đối cần chuyển tính trúng sang server.
2. Loại đòn (`k`) do client khai nên khai thấp thì vũ khí hao ít hơn.
3. Hao chưa ghi kịp khi rớt mạng đột ngột: mất tối đa vài giây.
4. Đổi `HITS_WEAPON` / `HITS_ARMOR` sau khi người chơi đã có đồ hao dở: `dur` là điểm tuyệt đối nên **% của món đang hao sẽ đổi theo** (tăng hằng số thì % tụt, giảm thì bị kẹp về 100%). Món chưa hao không bị ảnh hưởng.
5. Mỗi lần ghi hao (8 giây một lần khi đang đánh nhau) là một lần lưu nhân vật. Nếu DB bị nặng thì tăng `FLUSH_MS`.
6. Chưa chạy thử trong game thật; mới kiểm bằng `check-durability.js` và các check cũ.
