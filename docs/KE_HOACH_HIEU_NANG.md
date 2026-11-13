# Kế hoạch hiệu năng (mục tiêu 100 → 1000 người chơi)

Ngày: 2026-11-13 · Trạng thái: **đã triển khai bước 1–3 (DB theo section, ghi 6 giây, trả bản vá)**, còn bước 4 (giám sát, tải thử sâu hơn) · Làm **trước** `KE_HOACH_NPC_THEO_MAP.md`

## 0. Đã làm (khác so với bản kế hoạch ban đầu)

- **15 section** (`server/sections.js`): `core` (bảng `players`) + `kills`, `daily`, `loot`, `bag`, `equip`, `storage`, `quest`, `skills`, `pets`, `summons`, `shadows`, `advancement`, `world`, `misc` (bảng `player_data`). Khóa lạ tự rơi vào `misc`, không mất dữ liệu.
- **Phát hiện section đổi bằng so sánh nội dung** (không để action tự khai báo): không thể quên đánh dấu dirty. Chi phí là một lần stringify các section sau mỗi action (đã bù bằng việc bỏ backup + bỏ gửi cả nhân vật).
- Migration 3 (bảng mới) → 4 (chuyển dữ liệu, kiểm tra tách/ghép giống hệt gốc) → 5 (xóa cột `players.data`). Dữ liệu cũ đã chuyển, không còn đường đọc kiểu cũ; quay lại bản trước = khôi phục từ `npm run backup`.
- **Ghi định kỳ 6 giây** (quét mỗi 1,5 giây, tối đa 8 ghi đồng thời) qua nhóm kết nối riêng `synchronous_commit = off`; `saveNow` / tắt server commit đồng bộ.
- **Ghi từng người** (mỗi người một câu lệnh gồm mọi section đổi), chưa gộp nhiều người.
- **Hoàn tác khi action lỗi** bằng JSON từng section lần trước (bỏ `JSON.stringify` toàn bộ mỗi action).
- **Trả bản vá** `{ set, del }` + số thứ tự `rev`/`base`; lệch số thứ tự (lỡ bản vá, mở nhiều tab) thì client tải lại cả nhân vật. Gửi lại cùng `rid` trả nhân vật đầy đủ.
- Snapshot: vẫn chụp cả nhân vật mỗi 30 phút khi có đổi + khi bị đẩy khỏi RAM (`logout`).
- Đã có sẵn từ trước: server nén gzip phản hồi ≥ 1 KB ([server/index.js](../server/index.js)), nên mục "nén ở Nginx" không còn cấp thiết.

### Kết quả đo (bot giả lập cùng máy với server + Postgres, mỗi người chơi có túi 40 + kho 60 món)

| | Code cũ | Code mới |
|---|---|---|
| Dung lượng mỗi phản hồi | 10,9 KB | 0,48 KB (giảm ~22 lần) |
| Băng thông ra, 300 bot (245 req/s) | 2,6 MB/s | 0,12 MB/s |
| CPU Node, 300 bot | 13,5 % một lõi | 8,4 % một lõi |
| Băng thông ra, 900 bot (~720 req/s) | 7,8 MB/s | 0,34 MB/s |
| CPU Node, 900 bot | 27 % | 27 % (không đổi) |
| Latency p99, 900 bot | 56 ms | 109 ms (một lần đo, cần đo lại) |

Kết luận trung thực: **băng thông giảm rõ rệt; CPU của Node chỉ giảm ở mức tải vừa, ở 900 bot không đổi; latency p99 chưa cải thiện** (có thể là nhiễu vì bot, server và Postgres cùng một máy). Chưa đo tải ghi của Postgres. Việc tìm chỗ tốn CPU còn lại (nghi ngờ `calcStats` mỗi lần hạ quái, stringify các section) chưa làm.

## Bản kế hoạch ban đầu (để đối chiếu)

## 1. Hiện trạng (đã đọc code)

- Dữ liệu ít đổi (map, NPC, quái, vật phẩm) nằm trong code `shared/data`, không nằm DB. Bảng `players` chỉ giữ trạng thái người chơi.
- Đã có cache RAM + ghi trễ ([server/cache.js](../server/cache.js)): `kill`/`kills`/`save` chỉ đánh dấu dirty, flush mỗi 4 giây; hành động khác `saveNow`.
- Client đã gộp `kills` (chờ 120 ms, tối đa 15 con/request), không cần gộp thêm.
- Ba chỗ tốn:
  1. Mỗi lần ghi là ghi lại **cả cột JSON** `players.data` (Postgres tạo bản ghi mới + TOAST + WAL).
  2. Mỗi action ([server/index.js:186](../server/index.js:186)) `JSON.stringify(p)` backup, `saveNow` stringify lần nữa, rồi trả **cả player** cho client.
  3. Kế hoạch NPC theo map làm player phình (7 kho × 30 ô + 7 bảng nhiệm vụ). Đo: `newPlayer` 1,1 KB, player ~120 món đồ ~12 KB, cuối game có thể 30–40 KB (ước lượng).
- Nút thắt chính là **payload và serialize**, không phải DB. Một tiến trình Node, 1000 người trong RAM ≈ 50 MB, không cần Redis.

## 2. Đã chốt

| Việc | Quyết định |
|---|---|
| Chu kỳ ghi trễ phần nóng | **6 giây** (hiện 4 giây). Server sập: mất tối đa ~6 giây tiến độ hạ quái / vị trí |
| Hạ trùm / đồ rơi giá trị | **Không** `saveNow` (đồ rơi nằm ở `p.loot`, ghi trễ như quái thường) |
| Ghi gộp | Có, nhưng không phụ thuộc: nếu vẫn ghi từng người thì cũng chạy được. Gộp giúp giảm số lần gọi DB |
| Token bucket giới hạn tốc độ | **Không làm** |
| Gom `kill` lâu hơn (2–3 giây) | **Không làm** (làm trễ đồ rơi / kinh nghiệm). Có thể dọn mã `kill` đơn cũ |

## 3. Thiết kế DB: chia theo "mức nóng"

| Nhóm | Nội dung | Tần suất đổi | Cách lưu |
|---|---|---|---|
| Nóng | hp/mp, exp, vàng, `map`, x, y, tiến độ hạ quái, đếm bảng ngày/tuần | vài giây | RAM, ghi DB mỗi 6 giây |
| Ấm | túi đồ, trang bị, nhiệm vụ đang làm, linh thú, bóng ma | vài phút | RAM, ghi ngay khi đổi |
| Lạnh | kho từng làng, kỹ năng, danh hiệu, villages, nhiệm vụ đã xong | vài lần/giờ | RAM, ghi khi đổi |

Bảng:
- `players`: `user_id`, `level`, `exp`, `gold`, `map`, `school`, `rank`, `updated` là **cột thật** + `core JSON` nhỏ cho phần nóng. **Chỉ index `level`** (đổi hiếm). Không index `exp` / `gold` / `map` (đổi mỗi lần hạ quái, index sẽ chặn cập nhật tại chỗ HOT và làm bảng phình). Bảng xếp hạng tính định kỳ (~5 phút), không truy vấn trực tiếp.
- Ước lượng tải 1000 người: ~170 ghi/s phần nóng (<2 KB) + vài trăm ghi/s phần ấm (2–5 KB) ≈ 300–500 ghi/s, 15.000 dòng. Cần đo thật ở bước 1.
- `player_data (user_id, section, ver, data JSON, updated)`, khóa chính `(user_id, section)`. Các `section`: `bag`, `equip`, `quest`, `skills`, `pets`, **`storage:<mapId>`** (mỗi kho một dòng), `daily:<mapId>`.
- Chỉ ghi section dirty: kho 30 ô nằm yên không bị ghi lại mỗi 6 giây.
- Các section dirty của **cùng một người ghi trong một giao dịch** (mua bán / nâng cấp đổi túi + trang bị + vàng).
- **Rủi ro quên đánh dấu dirty → mất dữ liệu âm thầm.** Mỗi action khai báo section nó chạm tới; chế độ test so sánh toàn bộ player trước / sau action để bắt khai báo thiếu.
- Đọc: lúc đăng nhập / chưa có trong RAM, `SELECT section, data, ver FROM player_data WHERE user_id = $1` + dòng `players`; sau đó chạy từ RAM.
- Không tách từng món đồ thành bảng (chỉ cần nếu sau này có sàn đấu giá / giao dịch).
- Migration bằng bước mới trong `MIGRATIONS` ([server/db.js](../server/db.js)), dữ liệu cũ tách từ `players.data`. **Bắt buộc `npm run backup` trước.**

## 4. Cách ghi

- Quét mỗi 1–2 giây, chỉ ghi người đã quá 6 giây kể từ lần ghi trước (tải dàn đều, không dồn cục).
- **Bắt đầu bằng ghi đơn lẻ**: mỗi người một câu lệnh ghi mọi section dirty của họ (`INSERT ... SELECT FROM unnest($1::bigint[], $2::text[], $3::text[]) ... ON CONFLICT (user_id, section) DO UPDATE SET data = excluded.data, ver = player_data.ver + 1`). Vì flush đã `synchronous_commit = off`, gộp nhiều người chỉ còn tiết kiệm lượt gọi mạng. **Chỉ thêm ghi gộp nhiều người** (lô ≤ 50) nếu đo thấy DB / pool kết nối nghẽn.
- Nếu có gộp: mỗi lô một dòng/(người, section) (dùng `Map`), sắp theo `user_id` (tránh deadlock với `saveNow`). Lô lỗi → ghi lại từng người để biết ai lỗi.
- `SET LOCAL synchronous_commit = off` **chỉ trong giao dịch flush định kỳ**; `saveNow` vẫn commit đồng bộ.
- Giữ chuỗi `e.writing` của từng người để lô ghi trễ không đè lên một `saveNow` đang chạy.
- `statement_timeout` 5 giây: giữ nguyên, lô ≤ 50 là đủ.

## 5. Ngoài DB (xếp theo hiệu quả / công sức)

1. **Trả phần thay đổi thay vì cả player**: mỗi section có `ver`, server chỉ gửi section đã đổi, client hợp nhất trong `App.setPlayer` ([public/js/core/net.js](../public/js/core/net.js)). Giảm băng thông và stringify nhiều nhất.
2. **Bỏ backup `JSON.stringify(p)` mỗi action**: chỉ chụp section action đó chạm tới; `kills` / `save` không cần chụp. `ensureDaily` chỉ so ngày một lần mỗi người.
3. **Nén response `/api/` ở Nginx** (gzip/brotli).
4. **Snapshot** vẫn chụp cả player (công cụ khôi phục [server/tools/user.js](../server/tools/user.js) giữ nguyên), nhưng: chụp thêm khi người chơi thoát / bị đẩy khỏi RAM, và bỏ qua nếu nội dung chưa đổi so với lần chụp trước. Snapshot dùng để khôi phục khi người chơi báo mất đồ, **không** phải cơ chế chống sập: server sập thì DB giữ lần ghi cuối (mất tối đa ~6 giây tiến độ hạ quái), kèm `npm run backup` hằng ngày.
5. **Giám sát**: `monitorEventLoopDelay`, log action chậm (> 50 ms), bật `pg_stat_statements`.
6. **Chạy thử tải** 100 / 500 / 1000 bot giả lập trước và sau khi sửa.
7. Kiểm tra cache dài hạn (`immutable`) + nén cho sprite / `BG_HD` (có thể là tải lớn nhất lúc vào game).
8. Chỉ khi vượt khoảng 1500–2000 người: nhiều tiến trình Node chia theo hash `user_id` (sticky ở Nginx), WebSocket, mới tính tới Redis.

## 6. Thứ tự làm

1. Backup DB + đo cơ sở (kích thước player thực tế, thời gian action, số dòng ghi/giây).
2. Chia `section` + migration DB (mục 3) + ghi gộp 6 giây (mục 4).
3. Trả phần thay đổi + bỏ backup toàn bộ (mục 5.1, 5.2) + sửa client.
4. Nginx nén, snapshot, giám sát, chạy thử tải (5.3–5.7).
5. Sau đó mới làm `KE_HOACH_NPC_THEO_MAP.md` (kho / bảng theo map là các section có sẵn).

## 7. Rủi ro

- **Migration tách section** đụng toàn bộ dữ liệu người chơi → backup bắt buộc, chạy thử trên bản sao.
- **Client hợp nhất delta** sai có thể làm UI lệch trạng thái server → kiểm thử từng panel (túi, kho, nhiệm vụ).
- **Mất tối đa ~6 giây** tiến độ khi server sập đột ngột (tắt bình thường `flushAll()` ghi hết).
