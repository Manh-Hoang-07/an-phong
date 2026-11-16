# Bộ trang bị đặc biệt — chỉ mua bằng Linh Ngọc

## Hiện trạng

`public/js/ui/panels/equip.js` có 5 ô chờ: `linh_vat` (Linh vật), `bua` (Bùa), `an` (Ấn), `canh` (Cánh), `ho_menh` (Hộ mệnh). Chưa ô nào có dữ liệu, chưa ô nào trang bị được.

Để căn chỉnh, một bộ trang bị thường đầy đủ ở cấp 50 cho: **def 148, hp 2410, mp 475, crit 23, atk 146** (đã tính vũ khí). Đồ đặc biệt nên nằm quanh 15–25% con số đó, cộng thêm một hiệu ứng riêng không bộ nào có.

## 5 ô sau khi làm

Bỏ `linh_vat` (Linh vật) và gộp `ho_menh` vào Bùa Hộ Mệnh. Còn 5 ô, mỗi ô một vai trò riêng:

| Ô | Tên | Icon | Vai trò |
|---|---|---|---|
| `bua` | Bùa Hộ Mệnh | 🧿 | Sống sót |
| `an` | Ấn | 🔱 | Sát thương |
| `canh` | Cánh | 🪽 | Cơ động |
| `linh_dan` | Linh Đan | 💠 | Kỹ năng / năng lượng (thay Linh vật) |
| `chuong` | Chuông Trấn Hồn | 🔔 | Cày cuốc / hồi phục |

## 5 bậc, giá Linh Ngọc

| Bậc | Cấp | Giá |
|---|---|---|
| I | 10 | 40 💎 |
| II | 30 | 90 💎 |
| III | 50 | 180 💎 |
| IV | 70 | 320 💎 |
| V | 90 | 500 💎 |

Mua ở **Lầu Trân Bảo** (Tân Đô I), thêm nhóm "Trang bị" vào `NGOC_GROUPS`. Không bán bằng xu, không bán lại được (giá xu = 0) để khỏi thành lỗ hổng đổi ngọc ra xu.

---

## Chi tiết từng món

### 1. Bùa Hộ Mệnh 🧿 — `bua`

Chỉ số: **máu + phòng thủ**

| Bậc | Máu | Phòng thủ |
|---|---|---|
| I | 120 | 8 |
| II | 320 | 20 |
| III | 620 | 36 |
| IV | 1050 | 58 |
| V | 1650 | 88 |

**Hiệu ứng: Hộ Mệnh.** Khi máu tụt xuống ≤ 30%, lập tức nhận một lớp khiên chắn sát thương bằng 15 / 20 / 25 / 30 / 35% máu tối đa, giữ 6 giây. Hồi lại sau 60 giây.

Đây là thứ duy nhất trong game cứu người chơi khỏi đòn chí tử mà không cần bấm gì. Chỗ móc: `combat.js` → `hurtPlayer`, sau khi trừ máu.

### 2. Ấn 🔱 — `an`

Chỉ số: **tấn công + chí mạng**

| Bậc | Tấn công | Chí mạng |
|---|---|---|
| I | 10 | 3% |
| II | 22 | 5% |
| III | 38 | 7% |
| IV | 60 | 9% |
| V | 92 | 12% |

**Hiệu ứng: Ấn Sát.** Cứ 5 đòn đánh trúng thì đòn thứ 5 gây thêm 25 / 35 / 45 / 55 / 70% sát thương. Đếm riêng theo từng mục tiêu, đổi mục tiêu thì đếm lại từ đầu.

Chỗ móc: `combat.js` → `hitMonster`, thêm bộ đếm vào quái.

### 3. Cánh 🪽 — `canh`

Chỉ số: **tốc chạy + phòng thủ**

| Bậc | Tốc chạy | Phòng thủ |
|---|---|---|
| I | 6 | 3 |
| II | 12 | 7 |
| III | 20 | 12 |
| IV | 30 | 18 |
| V | 44 | 26 |

**Hiệu ứng: Phiêu Diêu.** 6 / 8 / 10 / 12 / 15% cơ hội né hoàn toàn một đòn đánh. Né được thì không mất máu, không mất khiên, hiện chữ "Né".

Chỗ móc: `combat.js` → `hurtPlayer`, trước khi tính sát thương.

### 4. Linh Đan 💠 — `linh_dan`

Chỉ số: **năng lượng + giảm hồi chiêu**

| Bậc | Năng lượng | Giảm hồi chiêu |
|---|---|---|
| I | 40 | 1% |
| II | 95 | 2% |
| III | 170 | 3% |
| IV | 270 | 4% |
| V | 400 | 6% |

**Hiệu ứng: Tụ Linh.** Kỹ năng gây thêm 5 / 8 / 11 / 14 / 18% sát thương.

Đây là món duy nhất cộng thẳng vào sát thương kỹ năng ngoài điểm Tinh thần, nên nó là món "phải có" cho người chơi theo đường kỹ năng.

Chỗ móc: `shared/logic/player.js` → `calcStats`, cộng vào `skillMul`.

### 5. Chuông Trấn Hồn 🔔 — `chuong`

Chỉ số: **xu rơi thêm + kinh nghiệm thêm + hút máu**

| Bậc | Xu | Kinh nghiệm | Hút máu |
|---|---|---|---|
| I | 4% | 2% | 1% |
| II | 7% | 4% | 1% |
| III | 11% | 6% | 2% |
| IV | 16% | 9% | 2% |
| V | 22% | 12% | 3% |

**Hiệu ứng: Trấn Hồn.** Mỗi khi hạ quái, hồi 1.5 / 2 / 2.5 / 3 / 4% máu tối đa và năng lượng tối đa.

Món cày cuốc: không mạnh trong giao chiến, nhưng đi đường dài tiết kiệm cực nhiều thuốc.

Chỗ móc: `monsters.js` → chỗ xử lý quái chết.

---

## Các bước làm

1. **Dữ liệu** — tạo `shared/data/items/special.js`, khai 25 món (5 ô × 5 bậc) với `slot`, `level`, `stats`, `priceNgoc`, `ngocGroup: 'gear'`, `desc` ghi rõ hiệu ứng, và trường `fx` chứa thông số hiệu ứng để engine đọc.
2. **Ô trang bị** — sửa `SLOTS` và `SLOT_NAMES` trong `shared/data/items/sets.js`: bỏ `linh_vat`, `ho_menh`; thêm `linh_dan`, `chuong`.
3. **Chỉ số** — `calcStats` cộng thêm `skillMul` từ Linh Đan.
4. **Hiệu ứng** — thêm 5 chỗ móc: Hộ Mệnh và Phiêu Diêu trong `hurtPlayer`, Ấn Sát trong `hitMonster`, Trấn Hồn ở chỗ quái chết, Tụ Linh trong `calcStats`.
5. **Cửa hàng** — thêm nhóm `gear` vào `NGOC_GROUPS`, để `ngocShopItems` tự bày 25 món này.
6. **Giao diện** — `equip.js`: thay `FUTURE_SLOTS` bằng 5 ô thật, bỏ khối "sẽ mở ở bản cập nhật sau". `ui.js`: thêm 5 icon vào `SLOT_ICONS`. `itemicons.js`: thêm hình cho 5 ô mới.
7. **Kiểm tra** — viết `check-special-gear.js`: mọi món trang bị được, chỉ số đúng bậc, hiệu ứng kích hoạt đúng, không món nào lọt vào quầy xu, giá ngọc tăng theo bậc. Chạy lại toàn bộ 8 script cũ.

## Ghi chú

- Người chơi cũ không cần migrate: `calcStats` bỏ qua ô trống, `newPlayer` tự tạo 5 ô mới.
- Đồ đặc biệt **không** cường hóa được ở Thợ rèn (chỉ số cố định), để giữ giá trị của việc mua bằng ngọc và tránh phải cân bằng thêm 12 cấp cường hóa.
- Không stack: mỗi ô một món, mua bậc cao hơn thì thay bậc thấp.