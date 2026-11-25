# Tách từng skill trong web + tạo project app Godot

Dựa trên `D:\Source\AnPhong\Tab 1.md` (mục *Hiệu ứng kỹ năng* và *Cấu trúc project app*).

## Hiện trạng đã khảo sát

- `public/js/scene/skillfx.js` (1122 dòng): bảng `SK` gán ~175 skill → `chủ_đề:kiểu` (dòng 56–83), 19 hàm vẽ `R.*`, điểm vào duy nhất `this.sfx(kind, id, sk, ...)` (dòng 1085). `skills.js` là luật chơi, **không đụng**.
- Dữ liệu skill: `shared/data/skills/**`, mỗi skill có `id, school, type, icon, name, desc`. Web nạp qua `<script src>` trong `public/index.html`; server phục vụ static từ ROOT (`server/http/static.js`).
- Chưa có `server/tools/export-gamedata.js` và `docs/protocol.md` (đúng như kế hoạch ghi "cần làm").
- Server đang chạy: **không restart, không deploy, không đụng production**.

## Phạm vi lần này

Làm phần nền móng chạy được, đúng kiến trúc kế hoạch. **Không** làm 175 hiệu ứng vẽ lại từ đầu, 305 hình ảnh, hệ thống game đầy đủ hay phát hành — đó là các đầu việc chạy song song nhiều tháng. Mỗi skill sẽ có file riêng ngay từ đầu (nội dung khởi tạo lấy từ `SK` hiện tại), rồi tinh chỉnh dần mà game không hỏng.

Tên thư mục app: `D:\Source\AnPhong-App` (ngang cấp `AnPhong`, đúng `an-phong-app/` trong kế hoạch).

## A. Chia riêng từng skill trong web

1. **Định dạng JSON** `shared/data/skillfx/<id>.json`: `{ id, name, school, type, theme, sig, layers: [{ kind, t, dur, color, shape, params }] }` — layers theo thời gian (hạt, vệt chém, chớp sáng, hình khối, rung camera, âm thanh). Kèm `shared/data/skillfx/manifest.json` (id → file + hash) và `version`.
2. **Công cụ sinh** `server/tools/gen-skillfx.js`: đọc `GameData.SKILLS` + bảng `SK` → ghi 175 file, mỗi skill một file; tự suy `theme/sig` từ `SK` (fallback class/type như `look()` hiện tại). Chạy lại được, không ghi đè file đã tinh chỉnh (`--force` mới ghi đè).
3. **Bộ vẽ web** `public/js/scene/skillfx-json.js`: đọc manifest + JSON, dịch layers sang primitive có sẵn trong `skillfx.js`; giới hạn hạt, pool, tôn trọng `Quality.low`. Skill thiếu JSON → fallback `SK` cũ. Hook vào `sfx()` hiện tại, không sửa luật chơi.
4. **Tích hợp & kiểm tra**: thêm script vào `public/index.html` đúng thứ tự, cập nhật check thứ tự nếu cần; chạy `check-shared-order`, `check:skill-fx`, `check:skills-panel`; mở web kiểm tra console với vài skill đại diện (Kiếm Sĩ, tuyệt kỹ, siêu tuyệt kỹ).
5. **Tài liệu** `docs/skillfx-format.md`: định dạng, cách thêm skill, cách tinh chỉnh từng file.

## B. Project app Godot ngang cấp

6. Tạo `D:\Source\AnPhong-App`: `project.godot` (Compatibility, Nearest, snap pixel, landscape, safe area), `export_presets.cfg` (Android + iOS), `.gitignore`, `README.md`.
7. Autoload theo kế hoạch: `Net.gd` (HTTPRequest, `Authorization: Bearer`, retry theo `rid`), `Socket.gd` (WebSocketPeer + hàng đợi), `Game.gd` (`rev` + patch), `Data.gd` (nạp `gamedata.json`, so hash), `Settings.gd`, `Audio.gd`.
8. `server/tools/export-gamedata.js` (trong AnPhong) xuất `gamedata.json` + hash; copy sang `AnPhong-App/data/`. Script sync assets từ `public/assets`.
9. Scenes khung: `Boot` (so `/api/version` + hash), `Login`, `World` (nạp map `.txt`, player, remote player, HUD tối thiểu). Port công thức `interp`, `mitigate`, `expToNext` từ `shared/core.js` + test so sánh hai bên.
10. Bộ vẽ `src/world/SkillFx.gd` đọc **cùng file JSON** ở mục A, dùng primitive tương đương, có pool và giới hạn hạt.
11. Kiểm tra: nếu máy có Godot 4 thì import headless + thử export Android; nếu không, để lại lệnh và hướng dẫn cài. Không đụng server đang chạy.

## Xong khi

- Web chạy bình thường, 175 file skill tồn tại riêng biệt, bộ vẽ JSON được dùng có fallback.
- `D:\Source\AnPhong-App` mở được trong Godot 4, cấu trúc autoload/scene/tool đúng kế hoạch, script không lỗi cú pháp cơ bản.
