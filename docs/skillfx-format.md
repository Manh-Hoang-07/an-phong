# Định dạng hiệu ứng kỹ năng riêng (skillfx JSON)

Mỗi kỹ năng có **một file riêng** tại `shared/data/skillfx/<id>.json`. Cùng một bộ file này dùng cho bản web (Phaser) và bản app (Godot), nên chỉnh một chiêu ở một chỗ là cả hai nền tảng thấy nhau.

## Tại sao tách

Trước đây `public/js/scene/skillfx.js` gán ~175 kỹ năng vào một bảng `SK` dạng `chủ_đề:kiểu`, nên nhiều chiêu dùng chung một hiệu ứng. Tách ra JSON giúp:

- Mỗi kỹ năng có hiệu ứng riêng, sửa chiêu này không ảnh hưởng chiêu khác.
- Không phải viết hiệu ứng hai lần: web và app cùng đọc một file.
- Có thể làm công cụ xem trước để chỉnh nhanh.

## Cấu trúc file

```json
{
  "id": "pa1",
  "name": "Trảm Kích Lướt",
  "school": "kiem_si",
  "type": "dash",
  "tier": "normal",
  "theme": "sword",
  "sig": "streak",
  "colors": ["0xffffff", "0xbcd6ff", "0x5b8cff"],
  "texture": "fx_spark",
  "dark": false,
  "layers": [
    { "kind": "sigil", "t": 0, "dur": 380, "color": "main", "trigger": "cast", "params": { "r": 58, "y": "ground" } },
    { "kind": "ghost", "t": 0, "dur": 260, "color": "main", "trigger": "dashStep", "params": { "alpha": 0.45 } }
  ]
}
```

### Trường cấp cao

| Trường | Ý nghĩa |
| --- | --- |
| `id` | Id kỹ năng, trùng khoá trong `GameData.SKILLS`. Tên file = `<id>.json`. |
| `name`, `school`, `type` | Thông tin kỹ năng, lấy từ dữ liệu game để dễ đọc. |
| `tier` | `normal` / `ult` / `superUlt` — quyết định độ lớn của nhóm layer mở màn. |
| `theme` | Chủ đề màu, một khoá trong bảng `TH` của `skillfx.js`. |
| `sig` | Kiểu chuyển động (`slash`, `nova`, `meteor`…). Là "chủ_đề:kiểu" cũ tách ra. |
| `colors` | Ba màu `[lõi sáng, màu chính, màu tối]`, dạng `0xRRGGBB`. |
| `texture` | Texture hạt mặc định của chủ đề. |
| `dark` | Có dùng chế độ hòa màu thường cho màu tối không. |
| `layers` | Danh sách lớp hiệu ứng, xem bên dưới. |

### Trường layer

| Trường | Ý nghĩa |
| --- | --- |
| `kind` | Tên primitive: `glow`, `ring`, `burst`, `stream`, `beam`, `bolt`, `arc`, `pillar`, `sigil`, `runeDisc`, `cracks`, `debris`, `swirl`, `ghost`, `flash`, `shake`, `fall`, `arrowZone`, `meteor`. |
| `t` | Thời điểm bắt đầu, mili-giây tính từ lúc gọi. |
| `dur` | Thời lượng, mili-giây. |
| `color` | `core` / `main` / `dark`, hoặc màu cụ thể `#rrggbb` / `0xRRGGBB`. |
| `trigger` | Lần gọi `sfx()` nào vẽ layer này: `cast`, `melee`, `dashStep`, `dashEnd`, `aoe`, `heal`, `buff`, `guard`, `shield`, `summon`, `backstep`, `fall`, `arrowZone`, `meteor`, `execute`, `fusion`, `manaburst`, `allin`. |
| `params` | Tham số riêng của từng `kind` (bán kính, số hạt, góc, độ dày…). |

`trigger` quan trọng: một chiêu được gọi `sfx()` nhiều lần trong đời (`cast` lúc tung, `melee` mỗi nhát, `dashStep` mỗi nhịp…). Layer chỉ vẽ đúng lần tương ứng; nếu không có layer cho `trigger` đó, bộ vẽ gọi lại `skillfx.js` (fallback).

## Sinh file và chỉnh tay

```bash
# Tạo file cho mọi kỹ năng còn thiếu, KHÔNG ghi đè file đã có
node server/tools/gen-skillfx.js

# Xem trước không ghi file
node server/tools/gen-skillfx.js --dry

# Chỉ sinh một vài kỹ năng
node server/tools/gen-skillfx.js --only pa1,ks35

# Ghi đè tất cả (MẤT chỉnh tay, cẩn thận)
node server/tools/gen-skillfx.js --force
```

Luồng làm việc:

1. Chạy `gen-skillfx.js` để có file khởi tạo cho mọi kỹ năng. Nội dung ban đầu lấy từ bảng `SK` hiện tại nên hình ảnh không đổi.
2. Mở `shared/data/skillfx/<id>.json`, sửa `layers` cho chiêu đó. Thêm layer mới nếu cần; nếu primitive hiện chưa vẽ được, thêm `kind` mới vào **cả hai** bộ vẽ (`public/js/scene/skillfx-json.js` và app `src/world/SkillFx.gd`).
3. Chạy lại `gen-skillfx.js` (không `--force`): file đã sửa được giữ nguyên, chỉ cập nhật `manifest.json`.
4. Kiểm tra: `node server/tools/check/audit-skill-fx.js`, mở web xem thử chiêu đó.

## Fallback và an toàn

- Web: `public/js/scene/skillfx-json.js` bọc `WorldScene.prototype.sfx`. Nếu manifest chưa nạp, file JSON lỗi, hoặc `trigger` không có layer → gọi ngay `sfx()` cũ của `skillfx.js`. Lỗi vẽ luôn được nuốt, không làm hỏng đòn đánh.
- App: `src/world/SkillFx.gd` đọc cùng file; nếu thiếu thì bỏ qua layer đó, không crash.
- Số hạt bị giới hạn (`MAX_PARTICLES = 40` trên web, tương đương trong app) và giảm một nửa khi bật chế độ hiệu ứng thấp (`Quality.low` / `Settings.quality_low`).
- `manifest.json` ghi `id → file + hash`, dùng để so lệch dữ liệu giữa web và app.

## Thứ tự ưu tiên khi làm 175 hiệu ứng

Theo kế hoạch: làm thử Kiếm Sĩ để chốt định dạng → tuyệt kỹ → siêu tuyệt kỹ → kỹ năng thường. Mỗi file bắt đầu từ mẫu theo nhóm rồi chỉnh thành hiệu ứng riêng. Đích là 100% kỹ năng có file riêng, xong thì xoá bảng `SK` cũ trong `skillfx.js`.
