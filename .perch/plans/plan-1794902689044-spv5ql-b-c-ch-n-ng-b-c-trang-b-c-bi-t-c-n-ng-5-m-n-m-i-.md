# 5 Kỳ Nguyên thay cho trang bị đặc biệt — tách hẳn khỏi hệ thống trang bị

Xem chi tiết: `.perch/plans/ky-nguyen-thay-trang-bi-dac-biet.md`

## Quyết định thiết kế (chốt)
- Tên hệ thống: **Kỳ Nguyên** (không trùng `p.titles`).
- Có bật/tắt: mua → sở hữu + tự bật; tháo = tắt, bật lại được, không mất quyền.
- Không giới hạn số cái bật cùng lúc. Mua bằng Linh Ngọc tại Lầu Trân Bảo, cần đủ cấp ngay khi mua.
- Xóa sạch: bậc I→V, Huyền Tinh Thạch, ô trang bị, phẩm chất, dòng phụ, cường hóa, khắc ấn, nhiễm, bộ.

| Kỳ Nguyên | Cấp | Nguồn cũ | Hiệu ứng |
|---|---|---|---|
| Kỳ Nguyên · Bất Tử | 10 | `bua_db_1` | giữ 1 máu 5s, hồi 60s |
| Kỳ Nguyên · Sát Kiếp | 30 | `an_db_2` | đòn thứ 5 +35% |
| Kỳ Nguyên · Phiêu Diêu | 50 | `canh_db_3` | né 10%, +120 thể lực |
| Kỳ Nguyên · Tụ Linh | 70 | `linh_dan_db_4` | kỹ năng +14% |
| Kỳ Nguyên · Trấn Hồn | 90 | `chuong_db_5` | hạ quái hồi 4% máu + năng lượng |

## Thứ tự thực hiện
1. Dữ liệu + logic shared (ky-nguyen, sets, player, shop, items, monsters, materials).
2. Server action + migrate + sections.
3. UI + icon + CSS.
4. Viết lại check script, chạy `check-ky-nguyen.js` + `check-gear-systems.js`, sửa lỗi.
5. Smoke test mua/bật/tắt/migrate.
