# Kế hoạch tối ưu FE / mạng — AnPhong

> **TRẠNG THÁI (2026-11-18): ĐÃ THỰC HIỆN.** A1–A4, B1–B3, C1, C3, D1–D2 xong + verify.
> B4 bỏ qua (không có terser, lợi ích ~2ms không đáng rủi ro strip comment bằng regex).
> C2 (WebP) bỏ qua (máy không có cwebp/PIL/sharp/ImageMagick; plan cấm cài package).
> Kết quả đo: bundle raw 1.29MB → 1.149MB (−176KB MAP_TEXT); BUILD.groups 6 hash riêng;
> smoke test server sạch, event loop 80 ảnh vẫn 11ms lag. Chưa restart server đang chạy / chưa deploy.
> C1 (chuyển nền mồ côi) ĐÃ ĐẢO NGƯỢC theo yêu cầu người dùng: 35 pack được chuyển ngược về
> public/assets/bg (vì sẽ thêm map dùng lại chúng, và không muốn sửa .gitignore). bg lại 46.5MB / 67 pack,
> git không còn dòng D. C2 WebP vẫn bỏ qua (thiếu tool chuyển ảnh).

## Kết luận ngắn

BE đã xong (bundle async, cache LRU 2MB/128MB, fs.watch, HTTP/2, DB index). FE đang **chạy tốt về kiến trúc** (mọi script đã gộp thành 1 bundle 1.29MB / 244KB brotli, SW cache theo request, font `swap`, âm thanh Web Audio không tải file). Nhưng có 4 chỗ đáng tiền, đo được bằng mã nguồn + benchmark có sẵn:

| Vấn đề | Bằng chứng | Tác động | Rủi ro |
|---|---|---|---|
| `MAP_TEXT` nhúng 59 file map (~175KB raw) vào bundle, chỉ 1 map dùng lúc đầu | `static.js:219-221`; `world.js:15-21` | −175KB parse, ~10–25ms mobile | TB |
| `Realtime.ready(2500)` chặn `new Phaser.Game` | `main.js:127`, `realtime.js:71` | tiết kiệm 200–600ms, worst 2.5s vào game | TB |
| ~28–33MB ảnh nền không map nào dùng (50 pack mồ côi theo tool, 35 pack theo đếm thủ công) | `bench-bg-usage.js` (33.2MB, tool báo hơi cao do `PACKS` động + `still('lr_*')`); đếm tay 28.4MB | giảm 50% repo/CDN, không đổi trải nghiệm | Thấp (nhưng là quyết định nội dung) |
| Mọi ảnh dùng 1 mã `BUILD.assets` → đổi 1 dòng JS invalidate cả 56MB ảnh | `static.js:198-218`, `sprites.js:217`, `world.js:24` | tiết kiệm tới 56MB/deploy nhỏ | TB |
| Preload 15 sprite thú mỗi lần vào map dù chỉ có 1 thú | `world.js:29`, `pets.js:16-19` | −15 request / ~1MB mỗi lần vào map | Thấp–TB |
| `await font` 600ms + SW đăng ký ở `window.load` | `main.js:109`, `main.js:44-49` | −100–600ms vào game; SW có tác dụng từ lần 2 | Thấp |

## Nguyên tắc

- Không đụng logic combat/anti-cheat, thứ tự script, hay dữ liệu `shared` (client và server dùng chung).
- Mỗi thay đổi đo lại bằng `bench-*` có sẵn + DevTools (4× CPU throttle) trước/khi sau.
- Không xóa asset vĩnh viễn: chuyển ra `assets_raw/unused-bg/` (ngoài `public/`) để còn khôi phục.
- Làm rủi ro thấp trước, đo xong mới chuyển phần lớn.

## Giai đoạn A — Quick wins, rủi ro thấp (làm đầu, ~1 lần đo)

1. **Bỏ `await` font trong `startGame()`** (`main.js:109`): `font-display: swap` đã cho chữ hiện ngay; giữ preload 2 font 400 trong `<head>` rồi xóa dòng chờ 600ms. Đo: thời gian `startGame → UI.init()`.
2. **Đăng ký SW sớm**: chuyển `navigator.serviceWorker.register` từ `window.load` (`main.js:44-49`) sang `early.js` (đang chạy trong `<head>`). Đo: Application → SW controller lúc nào khác `null`.
3. **Không preload `mid` khi `Quality.low`** (`world.js:32-35` + `map.js:176-188`): vẫn nạp khi đổi sang Cao trong phiên. Đo: Network filter `/assets/bg/`, vào map 4 lớp với low=true.
4. **Gộp 16 nhóm ảnh trùng** (~0.52MB): trỏ `pets/dragon-*.png`, `pets/bat-*.png` về file trong `mobs/` (`pets.js:16-19`), giữ nguyên texture key. Đo: hash SHA-256 + Network đếm request trùng.

**Nghiệm thu:** vào game nhanh hơn đo được; không tăng request; ảnh hiển thị đúng ở chế độ Thấp và Cao.

## Giai đoạn B — Giảm parse / vào game nhanh hơn

1. **MAP_TEXT theo yêu cầu** (`static.js:219-221`, `world.js`, `map.js`): thay vì nhúng 59 map vào `window.MAP_TEXT`, chỉ nhúng map mặc định + phục vụ phần còn lại qua endpoint `/api/maps?ids=...` (hoặc file `/maps/<id>.txt` đã có trong `shared/maps`, cache immutable). Giữ API `MAP_TEXT` tương thích để không sửa logic đọc map. Đo: bundle raw/brotli, `Evaluate Script` trên DevTools 4× throttle.
2. **Bỏ chặn `Realtime.ready()`** (`main.js:127`): dựng `Phaser.Game` ngay; khi nhận `hello` thì set cờ "quái do server quản lý". Giữ timeout 2.5s làm fallback cho chế độ đơn. Đo: thời gian tới frame đầu với WS bị chặn / WS nhanh.
3. **Dọn IIFE `O(QUESTS×MONSTERS)`** ở `shared/logic/quests.js:211-226` (~7,400 lần scan lúc load): tính `questMinLevel` lazily khi render panel. Đo: `Evaluate Script` giảm 5–15ms mobile.
4. **Strip comment lúc gộp bundle** (`static.js:222`): dùng `terser` với `compress:false, mangle:false, format:{comments:false}` (đã có sẵn? kiểm tra `node_modules`; nếu không có thì viết bộ lọc comment đơn giản cho đầu dòng). −~167KB raw. Đo: kích thước bundle + verify game chạy.

**Nghiệm thu:** bundle raw giảm ≥180KB; thời gian vào game (frame đầu) giảm đo được; không lỗi map/panel.

## Giai đoạn C — Ảnh nền (quyết định nội dung, làm sau khi A/B xong)

1. **Chuyển ~28–33MB nền mồ côi ra `assets_raw/unused-bg/`**: dùng `bench-bg-usage.js` làm danh sách, nhưng **hiệu chỉnh tay** 2 lỗi của tool: (a) các pack khai báo bằng `.forEach` trong `map_looks.js:195-219` vẫn là "có sẵn để dùng", (b) `still('lr_rn14')` trong `map_scenes.js` là tham chiếu thật. Danh sách chuyển = mồ côi tool TRỪ `night`, `space1-4`, `lr_*`, cộng thêm các pack `bch1-4/cfr*/...` theo đếm tay. Giữ lại `PACKS` registration (rẻ, vài dòng) nếu còn định dùng sau. Đo: `du -sh public/assets/bg` trước/sau.
2. **WebP cho nền đang dùng** (18.1MB → dự kiến 5–7MB tiết kiệm): chuyển thử 1 pack `vamp4` (2 file sky/near nặng nhất), đổi `ext` tại `map_looks.js:211`, so sánh bằng mắt (alpha + `filter:'nearest'` ở `bcn`/`brl` → **không** chuyển lossy 2 pack này). Giữ PNG làm fallback. Đo: `bench-requests.js` bytes/map `cau_dan`, `bench-payload.js`.
3. **Chỉ preload thú đang sở hữu** (`world.js:29`): đọc `App.player.mounts/summons`, phần còn lại để `loadRestAssets()`. Đo: request `/assets/pets/` khi đổi map.

**Nghiệm thu:** repo giảm ~30MB; bytes/map giảm đo được; chất lượng ảnh acceptable bằng mắt.

## Giai đoạn D — Cache theo từng file (lớn nhất, làm cuối)

1. Thay `BUILD.assets` (hash của mọi script + mọi ảnh) bằng **hash riêng cho từng nhóm asset**: `BUILD.assetVer = { bg: <hash mtime bg/>, chars: ..., mobs: ..., pets: ..., props: ... }`. Client (`sprites.js`, `world.js`, `pets.js`) gắn `?v=` theo nhóm tương ứng. Đổi 1 dòng JS không còn invalidate ảnh. Đo: deploy thử 1 thay đổi JS, đếm request `/assets/**?v=` trên client đã cache.
2. Cân nhắc precache shell (bundle + nền map đầu) trong `sw.js:install` sau khi A.1/A.2 xong. Đo: lần mở thứ 2 có `?nosw` so sánh.

**Nghiệm thu:** sau deploy nhỏ, số request ảnh trên client cũ ≈ 0 (thay vì tới 57MB).

## Thứ tự đề xuất

A (1 ngày) → B (1 ngày) → đo lại → C (cần bạn duyệt vì đụng asset) → D (cần đổi cả server + client, làm cuối).

## Phạm vi không đụng

- Logic combat, anti-cheat, cân bằng skill, thứ tự nạp script trong `index.html`.
- Dữ liệu `shared/` (dùng chung server/client) trừ phần tối ưu IIFE ở B.3.
- Không xóa vĩnh viễn asset; không restart server đang chạy; không đẩy production.