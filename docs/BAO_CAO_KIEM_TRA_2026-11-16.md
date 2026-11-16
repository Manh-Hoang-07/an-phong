# Báo cáo kiểm tra kỹ thuật — Ẩn Phong

**Ngày gốc:** 2026-11-16 · **Cập nhật:** 2026-11-16 (sau đợt sửa)
**Phạm vi:** `shared/`, `server/`, `public/js/` — logic, nhiệm vụ, trang bị, vật phẩm, kỹ năng, kinh tế, bảo mật
**Trạng thái:** 9/12 vấn đề đã xử lý. Báo cáo này giữ lại **những việc còn mở**.
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
| 2.2 | `dmgCap` 60× (rộng 38×, cắt oan tuyệt kỹ) | Hai trần 8×/90× + ngân sách sát thương kỹ năng | `server/realtime/index.js`, `public/js/scene/skills.js`, `public/js/scene/combat.js` |

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

### 2.2. ~~Trần sát thương `dmgCap` quá rộng~~ — ĐÃ SỬA

**Vị trí:** `server/realtime/index.js`

**Trước:** một trần duy nhất `atk × 60 + 500`. Nó vừa quá rộng cho đánh thường (38×) vừa quá hẹp cho tuyệt kỹ (cắt 28% sát thương thật ở cấp 100). Một con số không thể phục vụ cả hai.

**Sau:** hai trần, phân biệt bằng cờ `sk` trong gói `hit`.

```js
const CAP_MUL_BASIC = 8;    // đánh thường
const CAP_MUL_SKILL = 90;   // kỹ năng
const MAX_HITS_PER_SEC = 16;
const MAX_SKILL_HITS_PER_SEC = 20;
const SKILL_DMG_RATE_MUL = 6;      // ngân sách sát thương kỹ năng/giây = 6 × trần kỹ năng
const SKILL_DMG_BURST_SEC = 2;     // tích tối đa 2 giây

conn.atk = Math.max(st.atk, 30);
conn.capBasic = conn.atk * CAP_MUL_BASIC + 50;
conn.capSkill = conn.atk * CAP_MUL_SKILL + 500;
```

**Vì sao 8× và 90×.** Đây là hệ số nhân thật lớn nhất của mỗi loại, tính từ dữ liệu:

| Loại | Thành phần | Tích |
|---|---|---|
| Đánh thường | vũ khí `mult` 1,25 × chí mạng 2,5 × ngẫu nhiên 1,1 × buff ATK 1,41 × shred 1,25 | **6,1** |
| Kỹ năng | `power` 7,93 × `skillMul` 1,13 × chí mạng 2,5 × ngẫu nhiên 1,1 × buff 1,41 × `vsSlowed` 2 × shred 1,25 | **87** |

**Kiểm chứng: không cắt oan ở cấp nào.**

| Cấp | ATK tối đa | Trần thường | Đòn thật max | Trần kỹ năng | Tuyệt kỹ max |
|---|---|---|---|---|---|
| 10 | 378 | 3.074 | 2.290 ✓ | 34.520 | 32.835 ✓ |
| 30 | 729 | 5.882 | 4.417 ✓ | 66.110 | 63.324 ✓ |
| 50 | 1.128 | 9.074 | 6.834 ✓ | 102.020 | 97.983 ✓ |
| 70 | 1.414 | 11.362 | 8.567 ✓ | 127.760 | 122.827 ✓ |
| 100 | 1.856 | 14.898 | 11.245 ✓ | 167.540 | 161.221 ✓ |

**Ngân sách sát thương kỹ năng.** Cờ `sk` do client gửi nên không đáng tin: kẻ gian giả `sk=1` cho đánh thường sẽ lấy trần 90×. Ngân sách này chặn tổng sát thương kỹ năng mỗi giây, không chỉ số đòn:

```js
const rate = atk * CAP_MUL_SKILL * SKILL_DMG_RATE_MUL;   // 1.002.240/giây ở ATK 1.856
const pool = rate * SKILL_DMG_BURST_SEC;                  // tích tối đa 2.004.480
```

Một lần AoE trúng 6 quái ≈ 967.000, lọt. Hai lần liên tiếp ≈ 1.935.000, vẫn lọt (nhờ burst 2 giây). Spam liên tục thì bị ghì ở 1.002.240/giây.

**Kết quả mô phỏng:**

| Ca | Kết quả |
|---|---|
| Đánh thường thật, song đao 3,7 đòn/s × 4 quái | 80/80 lọt |
| Tuyệt kỹ 9 nhát (`ulKiem2`), 1 lần/giây | 45/45 lọt |
| AoE 6 quái cùng lúc | 6/6 lọt, 967.326 |
| 2 tuyệt kỹ AoE liên tiếp | 12/12 lọt, 1.934.652 |
| Gian gửi `d = 999999` (thường) | cắt còn 14.898 (67×) |
| Gian spam 80 đòn/giây | còn 16 đòn/giây (giảm 5×) |
| Gian giả `sk=1` + `d = 999999` | 1.279.492 sát thương/giây (giảm 7×) |

**Còn lại:** sát thương vẫn do client tính. Trần và ngân sách chặn được khai thác quy mô lớn, nhưng một client sửa được mã vẫn có thể gây sát thương tối đa mỗi đòn. Muốn bịt hẳn thì phải tính sát thương phía server từ `calcStats` — server đã có đủ chỉ số. Đó là việc lớn hơn, nên ghi lại đây.

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

### 3.3. `soi_dau_do` — quái mồ côi, không spawn ở đâu

**Vị trí:** `shared/data/monsters/chapter3.js:27`

```js
soi_dau_do: { name: 'Sói Đầu Đàn Băng Giá · Thủ Lĩnh', level: 26, hp: 1620, atk: 560,
  gold: [40, 80], respawn: 90, leader: true,
  drops: [['bang_tinh', 0.3, 'c3q3'], ['binh_nl_lon', 0.12], ['da_cuong_hoa_trung', 0.08]], ... }
```

Đã kiểm ba đường:

- Không map nào có `soi_dau_do` trong `spawns` (quét toàn bộ 59 map).
- Không nhiệm vụ nào có `soi_dau_do` trong `obj.kill` (quét 128 nhiệm vụ + 28 phụ tuyến).
- Không có code nào dựng động nó.

Đây là **thủ lĩnh duy nhất trong game không xuất hiện**. Nó mang drop `bang_tinh` gắn tag `c3q3`, nhưng `bang_tinh` còn rơi từ `soi_tuyet` và `yeu_tinh_bang` nên nhiệm vụ `c3q3` vẫn làm được. Không chặn tiến trình, chỉ là nội dung chết.

**Sửa:** hoặc thêm vào `spawns` của một map băng (`lo_ren_bang` hoặc `dinh_nui`, cấp 26 hợp lý), hoặc xoá hẳn. Tôi nghiêng về thêm vào map — một thủ lĩnh 1.620 máu với 40–80 vàng là nội dung tốt bị bỏ phí.

---

### 3.4. README lệch số kỹ năng so với dữ liệu

**Vị trí:** `README.md:101`

> *"Mỗi class có **5 kỹ năng chủ động** (1 trong số đó là tuyệt kỹ, mở ở cấp 20) và **1 nội tại**."*

Thực tế trong `shared/data/skills/classes/`:

| Class | Kỹ năng thường | Tuyệt kỹ riêng |
|---|---|---|
| `kiem_si` | 10 | 4 |
| `cung_thu` | 10 | 3 |
| `phap_su` | 10 | 3 |
| `sat_thu` | 10 | 4 |
| `tanker` | 10 | 4 |
| `tri_lieu_su` | 10 | 3 |
| `trieu_hoi_su` | 10 | 3 |
| `toan_nang` | 6 | — |

Không phải lỗi game, chỉ là tài liệu cũ. Nhưng người chơi mới đọc README sẽ tưởng mỗi class chỉ có 5 kỹ năng, rồi bất ngờ khi thấy 10.

**Sửa:** cập nhật con số trong README.

---

## 4. Đề xuất ưu tiên

**Trước khi mở cho người chơi thật:**

1. ~~**Bịt cửa sau `kills`**~~ — **đã sửa** (mục 2.1): trần theo `cooldown` vũ khí, 167 → 8,3–14,8 quái/giây.
2. ~~**Hạ `dmgCap`**~~ — **đã sửa** (mục 2.2): hai trần 8×/90×, `MAX_HITS_PER_SEC` 80 → 16.
3. **Tính sát thương phía server** (mục 2.2, phần "còn lại"). Trần và ngân sách đã chặn khai thác quy mô lớn, nhưng client sửa được mã vẫn gây được sát thương tối đa mỗi đòn. Đây là việc lớn, không gấp.

**Dọn dẹp:**

3. Sửa `minLevel` của `c3q6`, `c5q7`, `c5q8` (3.1).
4. Thêm ghi chú UI về số ô gắn kỹ năng (3.2).
5. Cho `soi_dau_do` vào `spawns` một map băng, hoặc xoá (3.3).
6. Cập nhật số kỹ năng trong README (3.4).

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
| `cong_do` không có portal nào dẫn tới | **Không phải lỗi.** Đây là map khởi đầu (`NEW_PLAYER_MAP`), người chơi spawn thẳng vào |
| `npc_an` không đứng ở map nào | **Không phải lỗi.** NPC ẩn, hiện ra khi chat `"npc an"` ở Tân Đô (`advancement.js:33`) |
| 3 sách tuyệt kỹ `ulChung*` có `priceNgoc = undefined` | **Không phải lỗi.** Thưởng nhiệm vụ phụ của Hội trưởng Khải (`side.js:194-202`), không bán ở shop |
| 15 sách tuyệt kỹ `price = 0` | **Không phải lỗi.** Bán bằng Linh Ngọc (`priceNgoc`), không bán bằng xu |
| `than_kiem_vinh_hang` `price = 0` | **Không phải lỗi.** Vũ khí cuối, nhận từ nhiệm vụ, không bán |

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
