# Sửa toàn bộ map: bục gỗ chết và thác nước lơ lửng

## Kết luận sau khi soi mã và dữ liệu

Đây là lỗi hệ thống, không phải một map đơn lẻ.

- `=` (bục gỗ) do `Grid.ledge()` ở `server/tools/gen/gen-maps.js:29` sinh ra ngay trên `#`. Runtime client (`public/js/scene/map.js:32-39`), server AI (`server/realtime/mapgrid.js:34-39`) và checker (`server/tools/check/check-maps.js:21-22`) đều âm thầm xóa các ô đó. File `.txt` thì còn bục, game thì bỏ qua → bục vô tác dụng; generator còn dùng bục ảo này để tính đường đi.
- `%` (thác) bị cụt trước mặt đất: `addWater()` ở `gen-maps.js:225-244` chỉ ghi tới `G-2`. Renderer `map.js:495-515` kéo sprite đúng bằng số ô `%`, nên chân thác cách mặt đất/hồ khoảng 32px. Foam đặt ở `fy=(e+1)*T` rồi tween đi lên (`map.js:509-512`), lại chỉ có cột chẵn và tắt ở `Quality.low` → càng trông lơ lửng.
- `npm run check:maps` hiện **không** phát hiện nhóm lỗi này vì xóa `=` trước khi kiểm tra và không có rule nào cho `%` / `"`.

## Việc sẽ làm

1. **Backup trước khi đụng file**
   - Tạo `backups/maps-water-ledge-fix-<timestamp>/`, sao chép toàn bộ `shared/maps/*.txt` cùng các file mã sẽ sửa.
   - Ghi baseline số lượng quái / NPC / cổng / ký tự chức năng của từng map để đối chiếu sau khi sửa.

2. **Sửa renderer nước cho chạm mặt tiếp xúc thật**
   - Trong `public/js/scene/map.js`, hàm `buildWater()`: sau khi tìm một đoạn `%`, dò tiếp xuống cùng cột tới ô đứng (`#` hoặc `=`) hoặc hồ (`"`) đầu tiên.
   - Kéo dài `fx_fall` tới mép trên của mặt đó thay vì dừng ở ô `%` cuối.
   - Đặt bọt nước đúng tại mặt tiếp xúc, bỏ điều kiện chỉ cột chẵn; giữ chi phí thấp bằng cách chỉ tạo foam khi `Quality.low` tắt.
   - `server/realtime/mapgrid.js` giữ nguyên logic nước vì `%`/`"` là ô khí, không ảnh hưởng AI.

3. **Dọn dữ liệu 60 map**
   - Với mọi `shared/maps/*.txt`: đổi `=` thành `.` **chỉ khi** ô ngay dưới là `#`. Đây là các bục mà runtime đã bỏ qua nên không đổi gameplay.
   - Chuẩn hóa cột thác: nối `%` tới mặt đứng/hồ đầu tiên; nếu giữa có bục hợp lệ thì giữ bục và nối `%` ở dưới nó. Không ghi đè lên `S`, quái, NPC, cổng hay ký tự trang trí.
   - Không đổi số lượng `[A-Za-z]`, `S`, `<`, `>`, `(`, `)`, `[`, `]`; nếu count lệch thì hủy ghi file và báo lỗi.

4. **Sửa gốc generator để không tái phạm**
   - `gen-maps.js:29`: `ledge()` không tạo `=` khi ô dưới là `#`, không ghi đè `%` làm đứt thác.
   - `gen-maps.js:230-233`: `safeFallCols` phải kiểm tra cả hàng `G-1`, tránh thác đè vào răng/bậc.
   - `gen-maps.js:83-86`: nhánh `towers/gapMode:'falls'` cũ ghi `%` tới `G-2` thay vì `G-1`.
   - Cập nhật legend trong `shared/README.md` để bổ sung `%` và `"`.

5. **Thêm validator chuyên map tile**
   - Tạo `server/tools/check/check-map-tiles.js`: báo `BUC-THUA`, `THAC-HO`, `HO-KHONG-CO-DAY`, `KY-TU-CHUC-NANG-BI-DE`, và so sánh count ký tự chức năng trước/sau.
   - Thêm script `check:map-tiles` vào `package.json`.
   - Giữ `check-maps.js` cho phần kiểm trareachability; validator mới lo phần bục/nước.

6. **Kiểm chứng**
   - Chạy `node server/tools/check/check-map-tiles.js`, `npm run check:maps`, `npm run check:shared-order`.
   - So sánh `git diff --stat` và đảm bảo diff chỉ nằm ở map tile, renderer nước, generator, validator, README và package script.
   - Mở app, screenshot các map đại diện: `sang_the_2`, `than_mong_1`, `long_mach_4`, `rung`, `d_lay_muc` — kiểm tra thác chạm đất, bục không còn tường ảo, quái/NPC/cổng vẫn đứng đúng.
   - Báo số map bị sửa, số bục thừa bị xóa, số cột thác được nối, và kết quả các lệnh check.

## Nguyên tắc giữ an toàn

- Không regenerate toàn bộ map từ đầu; chỉ sửa tile lỗi trên file hiện có.
- Không đụng số lượng quái, NPC, cổng, nhiệm vụ hay tiến độ người chơi.
- Mọi thay đổi có backup và diff review trước khi coi là xong.