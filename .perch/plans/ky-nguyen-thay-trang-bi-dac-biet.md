# 5 Kỳ Nguyên thay cho trang bị đặc biệt — tách hẳn khỏi hệ thống trang bị

Ngày lập: 2026-11-17. Phạm vi: `D:\Source\AnPhong`.
Bản này **thay thế** cả hai bản cũ ("Bỏ nâng bậc, giữ 5 món" và "Đổi thành danh hiệu").
Cập nhật theo ý mới nhất của người dùng: tên **Kỳ Nguyên**, **có tháo ra**, đổi tên 5 món.

---

## 1. Quyết định thiết kế (chốt)

- **Tên hệ thống: Kỳ Nguyên** — không dùng "danh hiệu" để tránh trùng với `p.titles` (danh hiệu cốt truyện).
- **Có bật/tắt (tháo ra)**: mỗi Kỳ Nguyên có trạng thái `active`. Mua → sở hữu + tự bật. Tháo = tắt, bật lại được, không mất quyền, không mua lại.
- **Không giới hạn số Kỳ Nguyên bật cùng lúc** (giữ hành vi 5 ô cũ). Nếu sau này muốn giới hạn build, chỉ cần thêm một hằng số.
- Mua bằng **Linh Ngọc** tại Lầu Trân Bảo, **cần đủ cấp ngay khi mua** (không còn "mua trước cất túi").
- **Xóa sạch**: bậc I→V, Huyền Tinh Thạch, ô trang bị, phẩm chất, dòng phụ, cường hóa, khắc ấn, nhiễm, bộ.
- 5 tên mới (giữ nguyên stats/fx, chỉ đổi nhãn):

| Kỳ Nguyên | Cấp | Nguồn stats/fx cũ | Hiệu ứng |
|---|---|---|---|
| Kỳ Nguyên · Bất Tử | 10 | `bua_db_1` | Hộ Mệnh: giữ 1 máu 5s, hồi 60s |
| Kỳ Nguyên · Sát Kiếp | 30 | `an_db_2` | Ấn Sát: đòn thứ 5 +35% |
| Kỳ Nguyên · Phiêu Diêu | 50 | `canh_db_3` | né 10%, +120 thể lực, +35% hồi thể lực |
| Kỳ Nguyên · Tụ Linh | 70 | `linh_dan_db_4` | kỹ năng +14%, +4% hồi chiêu |
| Kỳ Nguyên · Trấn Hồn | 90 | `chuong_db_5` | hạ quái hồi 4% máu + 4% năng lượng |

---

## 2. Data model

- `newPlayer`: thêm `kyNguyen: { owned: [], active: [] }` (id dạng `kn_bat_tu`, `kn_sat_kiep`, `kn_phiu_dieu`, `kn_tu_linh`, `kn_tran_hon`).
- `owned` = đã mua (chặn mua trùng). `active` = đang có tác dụng. `active ⊆ owned`.
- `calcStats` / `specialFx` / `skillMul` / `staRegen` chỉ đọc `active`.
- Action mới `toggle_ky_nguyen { id }`: đảo trạng thái trong `active`, chỉ nhận id đã `owned`.
- `server/storage/sections.js`: thêm `kyNguyen` vào section `world`.

---

## 3. Thay đổi theo file

### Dữ liệu
- **Mới** `shared/data/ky-nguyen.js`: 5 entry `{ id, name, level, priceNgoc, stats, fx, fxText, desc, icon }`. Chép nguyên khối `stats`/`fx`/`fxText` từ `ROWS` của `special.js` theo index bảng mục 1.
- `shared/index.js`: `require('./data/ky-nguyen')` thay `require('./data/items/special')`.
- `shared/data/items/special.js`: xóa file (hoặc để comment trống — nhưng phải bỏ require).
- `shared/data/items/sets.js`: `SLOTS` về 10 ô, bỏ 5 `SLOT_NAMES`, bỏ `SPECIAL_SLOTS`, sửa comment.
- `shared/data/items/materials.js`: xóa `huyen_tinh_thach`.
- `shared/data/monsters/index.js`: xóa khối `STONE_DROPS` gán vào drops của trùm/tinh anh.
- `shared/data/items/index.js`: bỏ phần gộp `special` nếu có.

### Logic
- `shared/logic/items.js`: xóa `SPECIAL_TIER_MAX`, `specialStoneCost`, `specialNextId`, `specialUpgradeCost` + export; bỏ special-case trong `setOfItem`.
- `shared/logic/player.js`:
  - `newPlayer` thêm `kyNguyen`.
  - `calcStats`: cộng stats từ các Kỳ Nguyên `active` (thay vì quét `equip[slot]`).
  - `specialFx`: quét `p.kyNguyen.active` thay vì 15 ô; bỏ comment "ô đặc biệt nằm cuối SLOTS".
  - `skillMul`: đọc `stats.skill` từ Kỳ Nguyên active (Tụ Linh).
  - `staRegen`: đọc từ Kỳ Nguyên active (Phiêu Diêu).
- `shared/logic/shop.js`: `ngocShopItems` lấy 5 Kỳ Nguyên từ catalog mới, thêm nhóm `'Kỳ Nguyên'` vào `NGOC_GROUPS`, sort theo cấp; bỏ logic lọc `tier === 1`.

### Server
- `server/game/actions/items.js`:
  - Xóa action `upgrade_special`.
  - `buy_ngoc`: nhánh Kỳ Nguyên → kiểm đủ cấp, trừ Linh Ngọc, đẩy id vào `owned` + `active`, **không đụng túi**; chặn trùng.
  - Thêm action `toggle_ky_nguyen`.
- `server/game/index.js` (`migrate`): thay khối dedup cũ bằng migration — mọi `*_db_N` trong bag/equip/storage/loot → map theo slot về id `kn_*`, đưa vào `owned` + `active` (kể cả khi cấp chưa đủ, để không mất quyền lợi của người chơi cũ), xóa item cũ + xóa `huyen_tinh_thach`. Khởi tạo `kyNguyen` nếu thiếu.
- `server/game/actions/smith.js`: dọn 4 nhánh `def.special` đã chết (để comment rõ lý do).

### UI
- `public/js/ui/panels/equip.js`: bỏ hàng 5 ô đặc biệt (`.eq-future`).
- `public/js/ui/ui.js`: xóa `specialUpgradeBox` + lời gọi trong `itemInfo`; bỏ tag "Đặc biệt"/"Bậc".
- `public/js/ui/actions.js`: xóa case `upgrade_special`, thêm case `toggle_ky_nguyen`.
- `public/js/core/net.js`: xóa event `upgrade_special` nếu có; thêm event toggle nếu cần refresh.
- `public/js/ui/panels/char.js`: thêm khối **"Kỳ Nguyên"** — liệt kê 5 cái (đã mua thì hiện tên + `fxText` + nút **Bật/Tháo**; chưa mua thì hiện cấp mở khóa). Giữ nguyên dòng "Danh hiệu" cũ cho `p.titles`.
- `public/js/art/itemicons.js`: icon cho 5 id mới, bỏ `SPECIAL_TIERS` + logic màu theo `tier`.
- `public/css/style.css`: bỏ `.eq-future*`, thêm style cho khối Kỳ Nguyên + nút Bật/Tháo.

### Kiểm tra
- **Mới** `server/tools/check/check-ky-nguyen.js` (thay `check-special-gear.js`): 5 Kỳ Nguyên, cấp 10/30/50/70/90, stats/fx đi qua `calcStats`/`specialFx` thật, quầy bán 5, mua đúng trừ ngọc + chặn trùng + chặn thiếu cấp, **bật/tắt đổi stats đúng**, migrate item cũ → Kỳ Nguyên. Bỏ toàn bộ test bậc/đá.
- `server/tools/check/check-gear-systems.js`: 3 chỗ `bua_db_5` → `kn_bat_tu`.
- `server/tools/ops/grant-skill.js`: bỏ/sửa `--gear bua_db_5`, thêm `--ky-nguyen <id>` nếu cần.

---

## 4. Thứ tự thực hiện

1. Dữ liệu + logic shared (ky-nguyen, sets, player, shop, items, monsters, materials).
2. Server action + migrate + sections.
3. UI + icon + CSS.
4. Viết lại check script, chạy `check-ky-nguyen.js` + `check-gear-systems.js`, sửa lỗi.
5. Smoke test: cấp 1/10/30/50/70/90 mua → cộng stats đúng; tháo → stats mất; bật lại → stats về; save cũ có `*_db_N` migrate sạch.

## 5. Verification

- `node server/tools/check/check-ky-nguyen.js` — all pass.
- `node server/tools/check/check-gear-systems.js` — không regression.
- `grep -r "bua_db_\|huyen_tinh_thach\|upgrade_special\|SPECIAL_SLOTS"` → chỉ còn trong migrate.
- `git status` — chỉ file thuộc task này đổi; giữ nguyên 10 file đang dirty của task siêu tuyệt kỹ.