# Báo cáo kiểm tra kỹ thuật — Ẩn Phong

**Ngày gốc:** 2026-11-16 · **Cập nhật:** 2026-11-16 (sau đợt sửa)
**Phạm vi:** `shared/`, `server/`, `public/js/` — logic, nhiệm vụ, trang bị, vật phẩm, kỹ năng, kinh tế, bảo mật
**Trạng thái:** 8/12 vấn đề đã xử lý. Báo cáo này giữ lại **những việc còn mở**.

Quy mô dữ liệu hiện tại: **449 vật phẩm, 170 kỹ năng, 100 nhiệm vụ chính, 28 phụ tuyến, 59 bản đồ, 74 quái, 76 NPC.**

---

## 1. Đã sửa (ghi lại để tra cứu, không cần làm lại)

| # | Vấn đề | Cách xử lý | File |
|---|---|---|---|
| 2.3 | `sach_ky_nang_vo_dinh` mô tả sai cơ chế | **Xoá vật phẩm.** Bỏ khỏi `books.js`, bỏ icon, bỏ phần thưởng ở `c5q6`, `c5q9`, `c10q8`, hậu truyện | `shared/data/items/books.js`, `public/js/art/itemicons.js`, `shared/data/quests/*` |
| 2.4 | `sach_tuyet_ky` mồ côi | **Xoá vật phẩm** cùng icon | như trên |
| 3.1 | Bán lại đồ rơi át vàng rơi 40–150× | `QUALITY_PRICE` → `{1:1, 2:1.5, 3:2, 4:3}`. Bán lại q4 còn 75% giá shop (trước 200%) | `shared/data/equipment.js` |
| 3.2 | Giá shop phi lý (29.782 quái/bộ) | Đặt lại 120 giá theo thu nhập thật: **500 quái/bộ ở mọi tầng** | `shared/data/items/**` |
| 3.3 | Bước nhảy vàng rơi ×10,9 ở cấp 45→51 | Nội suy log-tuyến tính vàng rơi cấp 31–50. Bước nhảy lớn nhất còn lại: 1,9× | `shared/data/monsters/**` |
| 4.2 | `trieu_hoi_su` không có tuyệt kỹ đặc trưng | Thêm `th11` **Vạn Linh Quy Tụ** (meteor, 320% × 2 đợt, hồi máu). Sách `sach_tk_th11` tự sinh ở Lầu Trân Bảo (50 ngọc) | `shared/data/skills/classes/trieu-hoi-su.js` |
| 4.4 | Sách Tẩy xoá trắng điểm đã cộng | **Bỏ hẳn `erase_skill`.** Sách Tẩy giờ là điều kiện bắt buộc để Hội trưởng Khải tẩy điểm (1 sách + `100 × cấp` xu, hoàn đủ điểm). Nút ở NPC báo rõ khi thiếu sách | `server/game/actions/character.js`, `public/js/ui/panels/npc.js`, `skills.js` |
| 4.5 | Typo `"ncp an"` | Sửa thành `"npc an"` | `server/game/actions/advancement.js:26` |
| 4.6 | `mitigate()` chết | Xoá hàm và export | `shared/core.js` |
| 2.1 | Gói `kills` tin client (167 quái/giây) | Trần theo `cooldown` vũ khí: 8,3–14,8 quái/giây | `server/game/actions/combat.js` |

**Kiểm chứng sau khi sửa** — tất cả đạt:

- `check-shared-order.js` — 102 file khớp giữa `shared/index.js` và `public/index.html`
- `check-quests.js` — chuỗi nhiệm vụ chạy được từ đầu tới cuối, 28 phụ tuyến đều làm được
- `check-skill-books.js` — trần 7 cuốn, nhiệm vụ tuần đúng 1 cuốn
- `check-special-gear.js` — 25 món đặc biệt, toàn bộ hiệu ứng chạy đúng
- `check-maps.js` — 0 vấn đề
- `node --check` — 14 file đã sửa đều sạch cú pháp

**Kinh tế trước/sau:**

| Cấp | Quái để mua 1 bộ (trước) | Sau | Bán lại/vàng rơi (trước) | Sau |
|---|---|---|---|---|
| 30 | 2.270 | 235 | 17,2× | 0,8× |
| 50 | 1.512 | 118 | 10,7× | 1,2× |
| 70 | 6.510 | 269 | 69,4× | 1,2× |
| 90 | 20.317 | 275 | 150,5× | 1,1× |
| 100 | 29.782 | 288 | 141,2× | 1,1× |

---

## 2. Còn mở — Nghiêm trọng

### 2.1. ~~Gói `kills` tin client hoàn toàn khi offline realtime~~ — ĐÃ SỬA

**Vị trí:** `server/game/actions/combat.js`

**Cách sửa:** thay cửa sổ 90ms bằng **ngân sách quái theo nhịp đánh thật của vũ khí đang cầm** (token bucket).

```js
const MAX_KILLS_PER_SWING = 4;
const KILL_BURST_SEC = 3;

const wtype = G.calcStats(p).wtype;                    // server tự đọc p.equip
const cd = G.WEAPON_TYPES[wtype]?.cooldown || 400;
const rate = (1000 / cd) * MAX_KILLS_PER_SWING;        // quái/giây
const cap = rate * KILL_BURST_SEC;                     // tích tối đa
lk.tokens = Math.min(cap, (lk.tokens || 0) + ((now - lk.t) / 1000) * rate);
```

`wtype` đọc từ `p.equip` phía server, client không sửa được. Hết ngân sách thì vòng lặp `break`, không `fail` — lag mạng không bị phạt.

**Trần mới theo vũ khí:**

| Vũ khí | Cooldown | Đòn/giây | Trần quái/giây | Giảm so với 167 |
|---|---|---|---|---|
| Trường | 480ms | 2,08 | 8,3 | 20× |
| Cung | 430ms | 2,33 | 9,3 | 18× |
| Tay không | 400ms | 2,50 | 10,0 | 17× |
| Kiếm | 360ms | 2,78 | 11,1 | 15× |
| Song đao | 270ms | 3,70 | 14,8 | 11× |

**Kiểm chứng** (đồng hồ ảo, 10 giây mỗi ca):

| Ca | Gửi | Nhận | Kết luận |
|---|---|---|---|
| Kiếm · 1 quái/đòn · 2,78 đòn/s | 30 | 30 | qua hết |
| Kiếm · 3 quái/đòn · 2,78 đòn/s | 90 | 90 | qua hết |
| Song đao · 4 quái/đòn · 3,7 đòn/s | 160 | 123 | chặn phần vượt |
| Burst 15 quái sau 3s nghỉ | 15 | 15 | qua hết |
| Gian: gói 15 quái × 11 gói/s (kiếm) | 1.650 | **117** | chặn 93% |
| Gian: gói 15 quái × 11 gói/s (song đao) | 1.650 | **136** | chặn 92% |

**Chi phí:** `calcStats` 2.017 ns/lần. Ở 11 gói/giây: 0,022 ms/giây mỗi người. 100 người cùng farm: 2,2 ms/giây (0,2% CPU).

**Còn lại:** trần này chặn tốc độ, không chặn việc client tự khai đã hạ con quái nào. Người chơi vẫn có thể hạ quái ở xa hoặc bỏ qua thời gian hồi sinh nếu biết rõ `respawn`. Muốn bịt hẳn thì phải bắt buộc realtime — nhưng phương án đó chặn cả người chơi thật có mạng yếu, nên đã cân nhắc và loại.

---

### 2.2. Trần sát thương `dmgCap` quá rộng

**Vị trí:** `server/realtime/index.js:77`

```js
conn.dmgCap = Math.max(st.atk, 30) * 60 + 500;
```

Client tự tính sát thương của mình lên quái và gửi bằng gói `hit`. Server chỉ kẹp ở trần trên. `mobs.js:11` nói thẳng: *"Client vẫn tự tính: sát thương của MÌNH lên quái (gửi lên bằng gói `hit`, server kiểm tra trần)."*

Trần đó là **60 lần ATK + 500**. So với đòn thật:

| Cấp | ATK | Đòn thường | Đòn chí mạng | Trần/đòn | Trần gấp |
|---|---|---|---|---|---|
| 10 | 110 | 110 | 176 | 7.100 | 40× |
| 30 | 335 | 335 | 536 | 20.600 | 38× |
| 50 | 592 | 592 | 947 | 36.020 | 38× |
| 100 | 1.164 | 1.164 | 1.862 | 70.340 | 38× |

Quái thường cao nhất (`thien_than_rong`, cấp 94) có 6.340 máu. Một đòn ở trần giết **11 con**. Kèm `MAX_HITS_PER_SEC = 80` (so với 2,78 đòn/giây thật của kiếm) — gấp 29 lần tốc độ thật.

**Sửa:** hạ trần xuống khoảng `atk * 3 + 50` (đủ cho chí mạng + buff + tuyệt kỹ mạnh nhất), và hạ `MAX_HITS_PER_SEC` xuống ~12. Tốt hơn nữa: tính sát thương phía server từ `calcStats` — server đã có đủ chỉ số, không có lý do gì tin client.

---

## 3. Còn mở — Trung bình

### 3.1. Ba nhiệm vụ yêu cầu cấp cao hơn cấp quái phải hạ

| Nhiệm vụ | Tên | minLevel | Quái cao nhất | Chênh |
|---|---|---|---|---|
| `c3q6` | Báo động đỏ Tân Đô | 25 | 22 (`quai_rac_td`) | +3 |
| `c5q7` | Tàn dư trong Vực Không Cùng | 47 | 41 (`quai_hu_khong`) | +6 |
| `c5q8` | Dư ảnh của Thiên | 47 | 46 (`ky_si_hu_khong`) | +1 |

Không chặn tiến trình, nhưng exp bị phạt theo `combat.js:88-89`:

```js
const expMul = diff >= 8 ? 0.1 : diff >= 5 ? 0.4 : 1;
```

`c5q7` lệch 6 cấp → chỉ nhận **40% exp**. Người chơi phải grind lâu hơn dự kiến mà không hiểu tại sao. `c5q8` lệch 1 cấp, không đáng lo.

**Sửa:** hạ `minLevel` xuống bằng hoặc dưới cấp quái cao nhất của mục tiêu.

---

### 3.2. Số ô gắn kỹ năng ít hơn số kỹ năng học được

| Class | Ô thường | Ô tuyệt kỹ | Học được thường | Học được tuyệt kỹ |
|---|---|---|---|---|
| Thường | 4 | 2 | 5 (7 khi mở rộng) | 5 (7 khi mở rộng) |
| Toàn Năng | 5 | 3 | 5 | 5 |

Học được 10 kỹ năng nhưng chỉ gắn được 6. Đây gần như chắc chắn là chủ đích ("học nhiều, chọn ít") và hợp lý cho RPG. Nhưng UI nên nói rõ, kẻo người chơi tưởng lỗi khi học xong không thấy xuất hiện trên thanh.

**Sửa:** thêm một dòng ghi chú trong bảng Kỹ năng: *"Học được nhiều hơn số ô gắn — chọn bộ kỹ năng cho lối chơi của bạn."*

---

## 4. Đề xuất ưu tiên

**Trước khi mở cho người chơi thật:**

1. ~~**Bịt cửa sau `kills`**~~ — **đã sửa** (mục 2.1): trần theo `cooldown` vũ khí, 167 → 8,3–14,8 quái/giây.
2. **Hạ `dmgCap`** (2.2) xuống `atk * 3 + 50`, và `MAX_HITS_PER_SEC` xuống ~12. Hoặc tốt hơn: tính sát thương phía server.

**Dọn dẹp:**

3. Sửa `minLevel` của `c3q6`, `c5q7`, `c5q8` (3.1).
4. Thêm ghi chú UI về số ô gắn kỹ năng (3.2).

---

## 5. Phụ lục — những nghi vấn đã kiểm và loại bỏ

| Nghi vấn | Kết luận |
|---|---|
| Tag `p2`/`p3` trong drop không tồn tại | **Dương tính giả.** `sideDropActive` hỗ trợ tag nhóm có chủ đích |
| 157 món bán lại ≥ 90% giá shop | **Đã hết sau khi sửa `QUALITY_PRICE`.** Bán lại cao nhất giờ là 75% giá shop |
| 2 món bán lại > giá shop | **Đã hết.** `thuong_bang_suong` và `vuong_mien_tri_thuc` giờ bán q4 = 75% giá shop |
| 30 vật phẩm "không lấy được" | **Sai 28 món.** Script bỏ sót nguồn `advancement_complete` và `shopKind === 'gear'`. Hai món mồ côi thật đã xoá |
| `sideDropNeed` dùng `Math.max` thay vì cộng | **Không phải lỗi.** `req` là chuỗi tuần tự, không nhận song song được |
| Sách trỏ tuyệt kỹ `undefined` | **Không tái hiện.** Mọi `skill_book`/`ult_book` đều trỏ tới skill tồn tại |
| Nhiệm vụ trỏ quái/vật phẩm không tồn tại | **Không có.** Toàn bộ 128 nhiệm vụ sạch |

---

## 6. Những gì đã tốt (không cần đụng)

- **Không có tham chiếu gãy.** Toàn bộ mục tiêu `kill`/`collect` trong 128 nhiệm vụ đều trỏ tới quái/vật phẩm tồn tại. Không có NPC ma, không có phần thưởng trỏ item không tồn tại.
- **Tag nhóm phụ tuyến hoạt động đúng.** `sideDropActive`/`sideDropNeed` (`server/game/core/quests.js:48-61`) hỗ trợ tag nhóm `p2`/`p3` cho cả `p2-1`, `p2-2`.
- **Không có arbitrage mua-bán.** Đồ shop luôn q1; bán lại 25%. Nâng cấp rồi bán vẫn lỗ.
- **Phân quyền server/client sạch.** Mọi hành động thay đổi trạng thái đều qua `server/game/actions/`, client không tự sửa túi/vàng/kỹ năng.
- **Cân bằng DPS/máu quái rất ổn định.** Thời gian hạ một quái thường cùng cấp dao động 1,4–1,8 giây suốt từ cấp 1 đến 100. Số quái để lên cấp khớp thiết kế (`10 + 0,2 × cấp`).
- **Sát thương quái lên người chơi hợp lý.** Người chơi chịu 8–14 đòn trước khi chết, giảm dần theo cấp.
- **Vật phẩm đặc biệt chống mua trùng.** `buy_ngoc` chặn mua lại khi đã có món cùng ô (`items.js:39-46`).
- **Mật mã có rate limit và hoàn lượt.** `character.js:206-229` — 8 lần sai/10 phút, hoàn lượt mã nếu túi đầy.
- **`sach_bien_hinh_1..5` và `sach_tien_hoa_chuc_nghiep` có nguồn đúng** — phát qua `advancement_complete`.
- **20 món trang bị thú (`pet_gear`) có nguồn đúng** — bán ở shop có `shopKind === 'gear'`.
- **`loi_nang_luong` có nguồn đúng** — sinh riêng trong `combat.js:185` khi có nhiệm vụ ngày dạng thu thập.

---

*Mọi con số trong báo cáo đều tính từ `shared/index.js` tại thời điểm 2026-11-16, không có số ước lượng ngoài các bảng ghi rõ "ước".*
