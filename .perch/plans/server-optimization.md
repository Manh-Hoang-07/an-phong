# Kế hoạch tối ưu `D:\Source\AnPhong\server`

## Kết luận ngắn

Server **đã tối ưu tốt ở phần lõi**: bundle JS gộp + hash + immutable cache + ETag (`http/static.js`), đồng bộ nhân vật dạng patch/section và ghi trễ (`storage/cache.js`, `storage/db.js`), session cache, idempotency `rid`, chống spam nhiều lớp (`realtime/index.js`). AI quái chỉ dùng 0.05% một lõi (`bench-mob-step.js`).

Vẫn còn chỗ để cải thiện, theo số đo thực chạy hôm 2026-11-18:

| Vấn đề | Số đo hiện tại | Tác động |
|---|---|---|
| Nén bundle đồng bộ trên event loop | brotli q9 **48ms**, gzip 9 **42ms** | Lần đầu tải / sau đổi file: mọi người chơi đứng hình ~48ms |
| Cache ảnh không bao giờ xoá | 579 ảnh, RSS **+74.9MB**, heap +4.2MB | VPS 1GB dễ vào swap → lag toàn hệ thống |
| `signature()` quét 576 file | **5.2ms** mỗi lần rebuild-check | Trên VPS đĩa chậm có thể gấp 5–10 lần |
| `readFileSync` ảnh lần đầu | 20 ảnh **12ms**, 80 ảnh **67ms** event loop delay | Giật khi vào bản đồ mới |
| `maintain()` xử lý mọi conn cùng tick | `refreshLook` gọi `calcStats` cho tất cả mỗi 5s | Spike khi nhiều người online |
| Ảnh nền chiếm 46.5MB / tổng 56.2MB | ~83% dung lượng tải lần đầu | 5Mbps mất ~95s chỉ để tải ảnh |

## Nguyên tắc làm việc

- Giữ nguyên hành vi game và API; không đụng logic combat/anti-cheat.
- Mỗi thay đổi đo lại bằng bộ `bench-*` có sẵn, so với baseline ở bảng trên.
- Thay đổi cấu trúc DB (nếu có) chỉ thêm migration mới, không sửa migration cũ.
- Ưu tiên rủi ro thấp trước, đo xong mới chuyển sang phần lớn.

## Giai đoạn 1 — Nén không chặn event loop (làm đầu)

1. Trong `server/http/static.js`, thay `zlib.brotliCompressSync` / `gzipSync` bằng phiên bản async (`zlib.brotliCompress` / `zlib.gzip`) trong `body()`, giống cách `send()` ở `server/index.js` đã làm cho API.
2. Giữ nội dung đã nén trong cache như hiện tại (nén một lần, dùng lại).
3. Hạ brotli từ quality 9 xuống 5 và gzip từ level 9 xuống 6 nếu vẫn muốn đường sync dự phòng: `bench-compress.js` cho thấy 48ms → 21ms và 42ms → 19ms, chỉ tốn thêm 9KB / 2KB.
4. Xử lý trường hợp rebuild nhiều request cùng lúc: chỉ một lượt nén cho mỗi phiên bản bundle (`inflight` promise), không nén trùng.

**Nghiệm thu:** `bench-compress.js` và `bench-eventloop.js` — độ trễ tối đa khi tải bundle từ 48ms xuống dưới 10ms; kích thước nén tăng không quá 10KB.

## Giai đoạn 2 — Giới hạn bộ nhớ đệm file tĩnh

1. Trong `entry()`, không giữ raw buffer của ảnh lớn vĩnh viễn. Đặt ngưỡng (đề xuất 256KB): file nhỏ vẫn cache raw như cũ, file lớn chỉ lưu metadata (`mtime`, `size`, `etag`, `type`) và đọc lại khi cần gửi.
2. Tính ETag cho ảnh lớn từ `mtime + size` thay vì băm nội dung, để tránh phải đọc file chỉ để phục vụ `If-None-Match` → 304.
3. Thêm giới hạn tổng dung lượng cache (đề xuất 64MB) với chiến lược evict cũ nhất; log số entry khi vượt ngưỡng để theo dõi.
4. Cân nhắc dùng `fs.createReadStream` cho ảnh lớn thay vì `res.end(buf)` để không giữ cả buffer trong heap.

**Nghiệm thu:** `bench-memory.js` — RSS sau 579 ảnh không vượt quá ~40MB so với lúc đầu (hiện +74.9MB); `bench-static.js` — lượt hai vẫn nhanh.

## Giai đoạn 3 — Giảm chi phí quét signature và đọc file

1. Thay `signature()` quét全 576 file bằng một trong hai cách:
   - `fs.watch` trên `public/assets`, `public/js`, `shared/maps` để đánh dấu `dirty` khi có file đổi, hoặc
   - cache signature theo `mtime` của thư mục + số file, chỉ quét sâu khi có thay đổi.
2. Giữ guard 1000ms hiện tại nhưng chỉ tính lại khi có request sau khi `dirty`.
3. Chuyển `fs.readFileSync` lần đầu trong `entry()` sang `fs.promises.readFile` (async), hoặc preload ảnh của bản đồ mặc định lúc `start()`.

**Nghiệm thu:** `bench-static.js` — signature dưới 1ms khi không đổi file; `bench-eventloop.js` — độ trễ khi vào 4 bản đồ liên tiếp từ 73ms xuống dưới 20ms.

## Giai đoạn 4 — Dàn đều công việc realtime

1. Trong `maintain()` (`server/realtime/index.js`), chia danh sách conn thành các nhóm nhỏ xử lý luân phiên mỗi tick thay vì duyệt toàn bộ; đảm bảo mỗi conn vẫn được kiểm tra session đúng chu kỳ 30s và làm mới look đúng 5s.
2. `refreshLook()` chỉ gọi `G.calcStats` khi các trường ảnh hưởng đến chỉ số thực sự đổi; nếu không có cách phát hiện rẻ, cache kết quả theo `rev` của nhân vật trong `storage/cache.js`.
3. Xem xét giảm tần số `msnap` (hiện mỗi 2 bước × 50ms = 100ms) xuống 150–200ms nếu `bench-net-2p.js` cho thấy lưu lượng là nút thắt; không đổi nếu độ mượt bị ảnh hưởng.

**Nghiệm thu:** đo spike event loop với số conn giả lập; `bench-net-2p.js` — không tăng lưu lượng; kiểm tra thủ công 2 người cùng đánh quái vẫn mượt.

## Giai đoạn 5 — Đánh giá phần lớn (chỉ làm sau khi 1–4 xong)

1. Chuyển ảnh nền PNG sang WebP/AVIF (46.5MB → dự kiến giảm 50–70%), cập nhật MIME trong `static.js` và loader phía client. Cần kiểm tra chất lượng bằng mắt trước khi áp dụng.
2. Bật HTTP/2 và nén sẵn trong nginx (hiện HTTP/1.1, tối đa 6 kết nối song song) — `bench-requests.js` đã chỉ ra điểm này.
3. Rà soát `maintenance()` trong `db.js`: câu `DELETE ... row_number()` trên `player_snapshots` có thể tối ưu nếu bảng phình; đo số dòng thực tế trước khi sửa.

**Nghiệm thu:** `bench-payload.js` — tổng dung lượng tải lần đầu giảm đáng kể; so sánh thời gian tải thực tế trên mạng 5Mbps.

## Thứ tự ưu tiên đề xuất

1 → 2 → 3 → 4 là chuỗi rủi ro thấp, làm trong một lần rồi đo lại. Giai đoạn 5 là dự án riêng, cần quyết định riêng vì đụng asset và hạ tầng.

## Phạm vi không đụng

- Logic combat, anti-cheat, cân bằng skill trong `realtime/index.js` và `game/`.
- Cấu trúc bảng đã có trong `MIGRATIONS`; nếu cần đổi thì thêm migration mới.
- Không tự ý restart server đang chạy hoặc đẩy code lên production.