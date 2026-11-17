# Đổi 5 món trang bị đặc biệt thành 5 danh hiệu, tách hẳn khỏi hệ thống trang bị

Ngày lập: 2026-11-17. Phạm vi: `D:\Source\AnPhong`.
Kế hoạch này **thay thế** bản "Bỏ nâng bậc, giữ 5 món trang bị" đang chờ duyệt.

## 1. Mục tiêu và đánh giá

`p.titles` hiện chỉ là `string[]` để hiển thị (quest ghi vào, `char.js` in ra), không có stats/effect.
5 món đặc biệt thì bị dệt vào 9 chỗ: `SLOTS` (15 ô), `calcStats`, `specialFx`, `skillMul`,
`staRegen`, migrate, shop, UI trang bị, icon + Huyền Tinh Thạch rơi từ trùm.

Tách thành danh hiệu → xóa sạch coupling với trang bị (bộ, Thợ rèn, ô mặc, phẩm chất, nâng bậc, đá).
Đây là refactor lớn hơn bản chỉ xóa bậc, nhưng làm một lần và sạch về sau.

## 2. Quyết định thiết kế

- **5 danh hiệu, cộng dồn vĩnh viễn** sau khi mua (giữ hành vi 5 ô mặc cùng lúc hiện nay). Không chọn 1 active.
- Cấp mở khóa, theo thứ tự người dùng đưa, sắp theo tiến trình:

  | Danh hiệu | Cấp | Nguồn stats/fx cũ |
  |---|---|---|
  | Bùa Hộ Mệnh | 10 | `bua_db_1` (Hộ Mệnh 5s) |
  | Ấn | 30 | `an_db_2` (Ấn Sát +35%) |
  | Cánh | 50 | `canh_db_3` (né 10%, +120 thể lực) |
  | Linh Đan | 70 | `linh_dan_db_4` (Tụ Linh +14%) |
  | Chuông Trấn Hồn | 90 | `chuong_db_5` (hồi 4%/4% khi hạ quái) |

- Mua bằng Linh Ngọc tại Lầu Trân Bảo, **cần đủ cấp ngay khi mua** (không còn "cất túi").
- Không còn bậc, không còn Huyền Tinh Thạch, không còn ô trang bị.
- `p.titles` (danh hiệu cốt truyện, chuỗi để hiển thị) giữ nguyên; thêm field riêng `p.passives: []`
  chứa id danh hiệu có stats. UI gộp hiển thị chung nhãn "Danh hiệu" nhưng tách nguồn.

## 3. Thay đổi theo file

### Dữ liệu
- `shared/data/items/special.js` → viết lại thành `shared/data/titles.js`: 5 entry
  `{ id: 'dh_bua'..., name, level, priceNgoc, stats, fx, fxText, desc, icon }`.
  Giữ nguyên khối `stats`/`fx`/`fxText` từ ROWS cũ, chọn index theo bảng trên.
- `shared/index.js`: require file mới thay `items/special`.
- `shared/data/items/sets.js`: bỏ 5 slot khỏi `SLOTS` (về 10 ô), bỏ `SLOT_NAMES` của chúng,
  bỏ/sửa `SPECIAL_SLOTS`, sửa comment.
- `shared/data/items/materials.js`: xóa `huyen_tinh_thach`.
- `shared/data/monsters/index.js`: xóa khối `STONE_DROPS`注入 vào drops.
- `shared/data/items/index.js`: kiểm tra và bỏ phần gộp special nếu có.

### Logic
- `shared/logic/items.js`: xóa `SPECIAL_TIER_MAX`, `specialStoneCost`, `specialNextId`,
  `specialUpgradeCost` + export; bỏ special-case trong `setOfItem`.
- `shared/logic/player.js`: `newPlayer` thêm `passives: []`; `calcStats` cộng stats từ
  `p.passives`; `specialFx` quét `p.passives`; `skillMul` đọc `stats.skill` từ passives;
  `staRegen` đọc từ passives (Cánh). Giữ comment giải thích nguồn mới.
- `shared/logic/shop.js`: `ngocShopItems` lấy 5 danh hiệu từ catalog TITLES (thay vì lọc
  `ITEMS.special`), thêm nhóm `'Danh hiệu'` vào `NGOC_GROUPS`, sort theo cấp.

### Server
- `server/game/actions/items.js`: xóa action `upgrade_special`; `buy_ngoc` nhánh mua danh hiệu
  → kiểm cấp, trừ Linh Ngọc, đẩy id vào `p.passives`, không đụng túi; chặn mua trùng.
- `server/game/index.js` (`migrate`): thay khối dedup cũ bằng migration — mọi `*_db_N` trong
  bag/equip/storage/loot → cấp id `dh_<slot>` tương ứng vào `p.passives` (theo cấp hiện tại,
  nếu chưa đủ cấp thì vẫn cấp để không mất quyền lợi), xóa item cũ + xóa `huyen_tinh_thach`.
- `server/storage/sections.js`: thêm `passives` vào section `world`.
- `server/game/actions/smith.js`: dọn 4 nhánh `def.special` đã chết (tuỳ chọn, để comment rõ).

### UI
- `public/js/ui/panels/equip.js`: bỏ hàng 5 ô đặc biệt.
- `public/js/ui/ui.js`: xóa `specialUpgradeBox` + lời gọi trong `itemInfo`; sửa tag "Đặc biệt".
- `public/js/ui/actions.js`: xóa case `upgrade_special`.
- `public/js/core/net.js`: xóa event `upgrade_special` nếu có.
- `public/js/ui/panels/char.js`: thêm khối "Danh hiệu" liệt kê `p.passives` kèm `fxText`.
- `public/js/art/itemicons.js`: icon cho 5 id mới, bỏ logic màu theo `tier`.
- `public/css/style.css`: bỏ `.eq-future*`, thêm style cho khối danh hiệu nếu cần.

### Kiểm tra
- `server/tools/check/check-special-gear.js` → viết lại thành `check-titles.js`: 5 danh hiệu,
  cấp 10/30/50/70/90, stats/fx đi qua `calcStats`/`specialFx` thật, quầy bán 5, mua đúng trừ
  ngọc + chặn trùng + chặn thiếu cấp, migrate item cũ → passive. Bỏ test bậc/đá.
- `server/tools/check/check-gear-systems.js`: 3 chỗ dùng `bua_db_5` → `dh_bua`.
- `server/tools/ops/grant-skill.js`: bỏ/sửa `--gear bua_db_5`, thêm `--title <id>` nếu cần.

## 4. Thứ tự thực hiện

1. Dữ liệu + logic shared (titles, sets, player, shop, items, monsters, materials).
2. Server action + migrate + sections.
3. UI + icon + CSS.
4. Viết lại check script, chạy `check-titles.js` + `check-gear-systems.js`, sửa lỗi.
5. Smoke test: cấp 1/10/30/50/70/90 mua và cộng stats đúng; save cũ có `*_db_N` migrate sạch.

## 5. Verification

- `node server/tools/check/check-titles.js` — all pass.
- `node server/tools/check/check-gear-systems.js` — không regression.
- `grep -r "bua_db_\|huyen_tinh_thach\|upgrade_special\|SPECIAL_SLOTS"` → chỉ còn trong migrate.
- `git status` — chỉ các file thuộc task này thay đổi; giữ nguyên 10 file đang dirty của task siêu tuyệt kỹ.