# Bậc I–V: nâng cấp tại chỗ bằng Huyền Tinh Thạch + Linh Ngọc

## Vấn đề hiện tại

Bậc I→V đang là **5 món riêng biệt** cho mỗi ô (25 món cho 5 ô):

- Muốn lên bậc phải mua món mới toanh ở Lầu Trân Bảo.
- Món bậc cũ nằm lại túi vĩnh viễn: `price: 0` nên không bán được, `special` nên Thợ rèn chặn cường hóa / tẩy luyện / phân rã. Không có đường thoát.
- Tên hiện tại có số La Mã (`Bùa Hộ Mệnh III`) — sai, tên phải cố định.

## Thiết kế mới

### Tên

Mỗi ô **một cái tên duy nhất, không đổi theo bậc**: Bùa Hộ Mệnh, Ấn, Cánh, Linh Đan, Chuông Trấn Hồn. Bậc là thuộc tính của món, hiện thành nhãn riêng `Bậc III`.

### Vật liệu nâng bậc: Huyền Tinh Thạch

Vật liệu mới `huyen_tinh_thach`, tên **Huyền Tinh Thạch**, đi cặp với Linh Ngọc (ngọc để mua, thạch để nâng). Không bán bằng xu, không bán lại được, không bày ở Lầu Trân Bảo — chỉ rơi từ trùm và tinh anh.

Chi phí đá theo bậc, đúng như bạn chốt (mỗi bậc gấp đôi bậc trước):

| Bậc | I | II | III | IV | V |
|---|---|---|---|---|---|
| Đá | 1 | 2 | 4 | 8 | 16 |
| Linh Ngọc | 40 | 90 | 180 | 320 | 500 |

Tổng leo hết một ô: **31 đá + 1.130💎**. Cả 5 ô: 155 đá + 5.650💎.

### Luồng chơi

1. **Mua bậc I** ở Lầu Trân Bảo: 40💎 + 1 Huyền Tinh Thạch → nhận món bậc I.
2. **Nâng bậc**: bấm "Nâng bậc" trong bảng chi tiết món. Trả đá + ngọc của bậc kế tiếp. Món **giữ nguyên uid**, chỉ đổi bậc. Không tạo món mới, không rác trong túi.
3. Bậc V là trần, nút nâng bậc biến mất.

Nâng bậc làm được ở bất kỳ đâu (không cần về Lầu Trân Bảo, không cần Thợ rèn) — đây là hệ riêng của trang bị đặc biệt, không phải cường hóa.

### Nguồn Huyền Tinh Thạch

Rơi từ trùm và tinh anh, mỗi con 1 viên/lần rơi, nhiều dòng để trùm rơi 2–3 viên:

- **Trùm** (`boss: true`): 3 dòng, tỉ lệ 0.6 / 0.4 / 0.2 → trung bình 1,2 viên/lần hạ.
- **Tinh anh** (`elite: true`): 2 dòng, tỉ lệ 0.35 / 0.15 → trung bình 0,5 viên.
- Thêm vào mốc thưởng tuần để có nguồn chắc chắn không phụ thuộc may mắn.

## Cách làm, ít rủi ro nhất

Giữ nguyên 25 mã item cũ (`bua_db_1`…`bua_db_5`) để **không phải migrate dữ liệu người chơi cũ**. Chỉ đổi `name` bỏ số La Mã, giữ `tier`.

### Dữ liệu

- `shared/data/items/materials.js`: thêm `huyen_tinh_thach` (`kind: 'material'`, `stack: true`, `price: 0`).
- `shared/data/items/special.js`: `name` bỏ hậu tố La Mã; `desc` nêu rõ đường nâng bậc.
- `shared/logic/items.js`: thêm `specialStoneCost(tier)` = 2^(tier−1), `specialNextTier(def)`, xuất qua `G`.
- `shared/data/monsters/chapter*.js`: thêm `huyen_tinh_thach` vào `drops` của trùm và tinh anh.

### Server

- `shared/logic/shop.js`: `ngocShopItems` chỉ bày **bậc I** của mỗi ô (5 món thay vì 25).
- `server/game/actions/items.js`:
  - `buy_ngoc`: món đặc biệt phải có đủ đá của bậc đó, kiểm **trước** khi trừ ngọc; thiếu thì `fail('Cần N Huyền Tinh Thạch.')`.
  - Action mới **`upgrade_special`** `{ uid }` hoặc `{ slot }`:
    - Tìm món ở ô đang mặc hoặc trong túi.
    - `tier >= 5` → `fail('Đã đạt bậc V.')`.
    - Thiếu đá → `fail('Cần N Huyền Tinh Thạch.')`; thiếu ngọc → `fail('Không đủ Linh Ngọc.')`.
    - Trừ đá + ngọc, đổi `entry.id` sang mã bậc kế, **giữ uid**.
    - Event `{ t: 'msg' }` + `{ t: 'upgrade_special', tier }`.
- `server/game/index.js` `migrate()`: dọn dữ liệu cũ — nếu một ô có nhiều bậc (từ phiên bản trước), giữ bậc cao nhất, bỏ phần còn lại.

### Client

- `public/js/ui/ui.js` `itemInfo`: dòng `Bậc III / V`, xem trước bậc kế (chỉ số + hiệu ứng), nút **Nâng bậc — 8 đá · 320💎**; mờ nếu thiếu, ẩn nếu đã V.
- `public/js/ui/actions.js`: thêm `case 'upgrade_special'`.
- `public/js/ui/panels/shop.js`: món đặc biệt ở quầy ngọc hiện thêm dòng "Cần 1 Huyền Tinh Thạch".
- `public/js/ui/panels/equip.js`: dòng phụ `Đặc biệt · Bậc III` (đã có).
- `public/js/art/itemicons.js`: vẽ icon Huyền Tinh Thạch.
- `public/js/ui/ui.js`: icon ô vật liệu cho Huyền Tinh Thạch.

### Kiểm chứng

`check-special-gear.js` viết lại phần mua/nâng bậc:

- Quầy chỉ bày 5 món bậc I.
- Mua bậc I: trừ 40💎 + 1 đá; thiếu đá thì chặn, không trừ ngọc.
- Nâng I→II→III→IV→V: trừ đá đúng 2/4/8/16, trừ ngọc đúng 90/180/320/500, **uid không đổi**, chỉ số và hiệu ứng đổi đúng theo bậc.
- Chặn ở bậc V; chặn khi thiếu đá; chặn khi thiếu ngọc.
- Tên không còn số La Mã ở cả 25 mã.
- Đá không bán được, không bán lại được.

Chạy lại full suite 9 script, rồi thử trên game thật: mua Bùa I, nâng lên III, xác nhận chỉ số + Hộ Mệnh đổi theo bậc, túi không sinh thêm món.

## Không đụng tới

- 5 hiệu ứng chiến đấu (Hộ Mệnh bất tử 5s, Ấn Sát, Phiêu Diêu, Tụ Linh, Trấn Hồn).
- Chỉ số từng bậc, giá Linh Ngọc từng bậc.
- Thợ rèn vẫn chặn đồ đặc biệt.
- Không có cấp sử dụng (đã bỏ ở bước trước).
