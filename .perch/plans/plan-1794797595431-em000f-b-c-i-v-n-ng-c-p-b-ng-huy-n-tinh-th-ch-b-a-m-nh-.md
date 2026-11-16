# Bậc I–V: nâng cấp tại chỗ bằng Huyền Tinh Thạch + Linh Ngọc

## Vấn đề

Bậc I→V đang là 5 món riêng biệt mỗi ô (25 món). Muốn lên bậc phải mua món mới; món cũ nằm lại túi vĩnh viễn vì không bán, không phân rã, không cường hóa được. Tên lại có số La Mã (`Bùa Hộ Mệnh III`) — sai, tên phải cố định.

## Thiết kế

**Tên cố định:** mỗi ô một tên duy nhất — Bùa Hộ Mệnh, Ấn, Cánh, Linh Đan, Chuông Trấn Hồn. Bậc là thuộc tính, hiện thành nhãn `Bậc III`.

**Vật liệu mới: Huyền Tinh Thạch** (`huyen_tinh_thach`) — đi cặp với Linh Ngọc. Ngọc để mua, thạch để nâng. Không bán bằng xu, không bán lại, không bày ở Lầu Trân Bảo; chỉ rơi từ trùm và tinh anh.

| Bậc | I | II | III | IV | V |
|---|---|---|---|---|---|
| Huyền Tinh Thạch | 1 | 2 | 4 | 8 | 16 |
| Linh Ngọc | 40 | 90 | 180 | 320 | 500 |

Tổng leo hết một ô: 31 đá + 1.130💎. Cả 5 ô: 155 đá + 5.650💎.

**Luồng chơi:**
1. Mua bậc I ở Lầu Trân Bảo: 40💎 + 1 đá.
2. Nâng bậc trong bảng chi tiết món: trả đá + ngọc bậc kế, món giữ nguyên uid, chỉ đổi bậc. Không sinh món mới.
3. Bậc V là trần, nút nâng biến mất. Nâng được ở bất kỳ đâu, không cần về Lầu Trân Bảo hay Thợ rèn.

**Nguồn đá:** trùm 3 dòng tỉ lệ 0.6/0.4/0.2 (trung bình 1,2 viên/lần hạ); tinh anh 2 dòng 0.35/0.15. Thêm vào mốc thưởng tuần để có nguồn chắc chắn.

### Sửa lỗi: Bùa Hộ Mệnh phải mạnh lên theo bậc

Hiện 4 món kia đều tăng theo bậc, **riêng Bùa đứng yên** — 5 bậc cùng `{ dur: 5, cd: 60 }`. Nâng cấp mà hiệu ứng không đổi thì nâng làm gì. Sửa:

| Bậc | I | II | III | IV | V |
|---|---|---|---|---|---|
| Bất tử | 5s | 6s | 7s | 8s | 10s |
| Hồi chiêu | 60s | 55s | 50s | 45s | 40s |

Bậc V: 10 giây bất tử, hồi 40 giây → thời gian bất tử chiếm 25% trận đánh dài. Chỉ số máu/phòng thủ vẫn giữ nguyên như bảng cũ (120/320/620/1050/1650 máu).

Kèm theo: `lastStandCheck` đọc `fx.dur` và `fx.cd` từ chính món đang mặc (đã đúng), nên chỉ cần sửa dữ liệu `fx` của 5 bậc là chạy. Kiểm tra thêm trong `check-special-gear.js`: mỗi bậc cho đúng số giây và đúng hồi chiêu, và bậc V phải khác bậc I.

## Cách làm

Giữ nguyên 25 mã item cũ (`bua_db_1`…`bua_db_5`) để không phải migrate người chơi cũ. Chỉ bỏ số La Mã khỏi `name`, giữ `tier`.

**Dữ liệu:** thêm `huyen_tinh_thach` vào `materials.js`; sửa `name`/`desc` trong `special.js` và **đổi `fx` của Bùa theo bảng 5/6/7/8/10s · 60/55/50/45/40s**; thêm `specialStoneCost(tier)` = 2^(tier−1) vào `shared/logic/items.js`; thêm đá vào `drops` của trùm/tinh anh trong `shared/data/monsters/chapter*.js`.

**Server:** `ngocShopItems` chỉ bày bậc I (5 món thay vì 25); `buy_ngoc` kiểm đá trước khi trừ ngọc; action mới `upgrade_special` giữ uid, trừ đá + ngọc, chặn ở bậc V và khi thiếu; `migrate()` dọn trường hợp một ô có nhiều bậc (giữ bậc cao nhất).

**Client:** `itemInfo` hiện `Bậc III / V`, xem trước bậc kế, nút `Nâng bậc — 8 đá · 320💎` (mờ nếu thiếu, ẩn nếu V); `actions.js` thêm case; quầy ngọc hiện "Cần 1 Huyền Tinh Thạch"; vẽ icon đá.

**Kiểm chứng:** `check-special-gear.js` viết lại phần mua/nâng — quầy chỉ 5 món bậc I, mua trừ đúng đá + ngọc, thiếu đá thì chặn và không trừ ngọc, nâng đủ 5 bậc với uid không đổi, chỉ số đổi đúng, chặn ở V, tên không còn số La Mã, đá không bán lại được; **Bùa mỗi bậc cho đúng số giây bất tử và đúng hồi chiêu, bậc V khác bậc I**. Chạy lại full suite 9 script, thử trên game thật.

## Không đụng tới

5 hiệu ứng chiến đấu (Hộ Mệnh, Ấn Sát, Phiêu Diêu, Tụ Linh, Trấn Hồn) — chỉ đổi **thông số** của Bùa theo bậc, không đổi cơ chế; chỉ số và giá từng bậc; Thợ rèn vẫn chặn đồ đặc biệt; không có cấp sử dụng.