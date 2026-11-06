# THỨC TỈNH — KẾ HOẠCH BỔ SUNG THÚ CƯỠI

> **Loại tài liệu:** Kế hoạch tính năng (chưa làm)
> **Phạm vi:** Thú cưỡi cho cấp 10 – 50, chơi được cả máy tính và điện thoại
> **Trạng thái:** Đề xuất, chờ duyệt

---

## I. MỤC TIÊU

1. **Đi lại nhanh hơn** giữa các khu vực khi bản đồ ngày càng dài (Làng ~100 ô, các cổng ở đầu/cuối bản đồ).
2. **Phần thưởng qua mã quà tặng**: thú cưỡi **chỉ lấy được bằng mã** (người quản lý tạo mã và phát), không có nhiệm vụ, không rơi từ quái, không bán ở tiệm.
3. **Không phá cân bằng chiến đấu**: thú cưỡi giúp di chuyển, không làm nhân vật mạnh hơn khi đánh.

## II. CƠ CHẾ CHƠI

| Hạng mục | Đề xuất |
| :--- | :--- |
| Gọi / xuống thú | Phím **M** (máy tính), nút **🐎** trên điện thoại (cạnh nút ⚡ Biến hình). Gọi mất 0,8 giây (có hiệu ứng khói), không gọi được khi đang bị đánh. |
| Tốc chạy | +30% đến +70% tùy thú (cộng sau giới hạn tốc chạy hiện tại 290). |
| Nhảy | Thú có chỉ số **nhảy** riêng (cao hơn hoặc thấp hơn đi bộ) — có thú nhảy cao để lên bục khó. |
| Chiến đấu | **Không** đánh thường / dùng kỹ năng khi đang cưỡi. Bấm đánh hoặc kỹ năng → tự xuống thú rồi ra đòn ngay (không mất lượt). |
| Bị đánh | Bị trúng đòn mạnh (≥ 10% máu) → ngã khỏi thú, 3 giây sau mới gọi lại được. |
| Thể lực | Cưỡi thú **không tốn** thể lực, và thể lực hồi như đứng yên (khuyến khích cưỡi khi đi đường). |
| Máu / năng lượng | Vẫn tự hồi khi cưỡi (tính là không giao chiến). |
| Biến hình | Đang biến hình vẫn cưỡi được; lớp màng hào quang bao cả người lẫn thú. |
| Cổng / NPC / nhặt đồ | Hoạt động bình thường khi cưỡi. Chuyển bản đồ vẫn giữ trạng thái cưỡi. |

## III. DANH SÁCH THÚ CƯỠI ĐỀ XUẤT

**Cách lấy duy nhất: mã quà tặng.** Mã tặng thẳng thú cưỡi (tùy chọn mới `--mount <id>`), ví dụ:

```bash
npm run giftcode -- add QUA-SOI --mount soi_xam --max-uses 1
npm run giftcode -- add SU-KIEN-TET --mount ky_lan --expires 2027-02-20
```

Nhập mã ở Lữ khách bí ẩn như hiện nay → thú vào thẳng danh sách sở hữu, không cần vật phẩm trung gian. Đã có thú đó rồi thì mã báo "đã sở hữu" và **không** tính lượt dùng.

| Thú | Cấp tối thiểu để cưỡi | Tốc chạy | Nhảy |
| :--- | :--- | :--- | :--- |
| **Sói Xám** | Cấp 1 | +30% | Như đi bộ |
| **Thằn Lằn Đầm** | Cấp 1 | +35% | Thấp hơn, **không bị chậm** khi lội nước (trùm Thủy Xà) |
| **Sói Tuyết Bạc** | Cấp 1 | +45% | +15% |
| **Hạc Mây Đá** | Cấp 1 | +50% | +40%, **lướt chậm** khi rơi |
| **Kỳ Lân** | Cấp 1 | +70% | +25% |

Cấp tối thiểu để mặc định là 1 (ai có mã là cưỡi được ngay); muốn giới hạn thì đặt `level` trong dữ liệu thú.

**Nâng cấp thú (giai đoạn 3, tùy chọn):** cho thú ăn "Cỏ linh" — cũng **chỉ phát qua mã** (`--item co_linh 10`) → mỗi cấp +2% tốc chạy, tối đa 10 cấp. Có thể bỏ hẳn nếu chỉ cần thú cưỡi cố định.

## IV. HÌNH ẢNH

- **Cách nhanh, đồng bộ phong cách hiện tại:** vẽ bằng code như quái/NPC (`public/js/art/`), mỗi thú 4 khung chạy + 1 khung đứng + 1 khung nhảy. Không cần thêm file ảnh.
- **Cách đẹp hơn:** bộ hình pixel CC0 (cùng nguồn LuizMelo hoặc tương đương), đặt trong `public/assets/mounts/<id>/` giống quái. Cần chọn bộ có ngựa/sói nhìn ngang.
- **Ghép người lên thú:** vẽ thú ở dưới, nhân vật ở trên, dời nhân vật lên theo `saddleY` của từng thú; dùng hoạt ảnh "idle" của nhân vật khi đang chạy (người ngồi yên, thú chạy). Kiểm tra lại với cả 8 class vì kích thước bộ hình mỗi class khác nhau.
- Khi biến hình: tô màu ấn cho cả thú (dùng lại `makeFormSheets`).

## V. DỮ LIỆU VÀ CODE

| Phần | Nội dung |
| :--- | :--- |
| `shared/data/mounts.js` (mới) | Danh sách thú: `{ id, name, level, speed, jump, glide, look, saddleY, desc }` |
| Nhân vật (`newPlayer`) | `mounts: { owned: [], active: null, levels: {} }` + sửa `migrate` cho nhân vật cũ |
| Mã quà tặng | `server/tools/giftcode.js` thêm `--mount <id>` (lặp được); `redeem` trong `actions/character.js` thêm thú vào `mounts.owned`; mã chỉ chứa thú đã sở hữu → báo lỗi, trả lại lượt (giống khi túi đầy) |
| Server (`actions/character.js`) | `mount_set` (chọn thú đang dùng), `mount_feed` (giai đoạn 3) |
| Client (`scene/player.js`) | `toggleMount()`, cập nhật tốc chạy / độ nhảy khi cưỡi, tự xuống khi đánh hoặc bị trúng đòn mạnh |
| Giao diện | Tab **"Thú cưỡi"** trong Menu (danh sách đã có / chưa có, nút "Chọn"); nút 🐎 trên điện thoại; phím M |
| Chống gian lận | Tốc chạy do client tính (như hiện tại), nên server chỉ kiểm tra **có sở hữu thú** khi chọn |

## VI. LỘ TRÌNH

| Giai đoạn | Nội dung | Ước lượng |
| :--- | :--- | :--- |
| **1. Cưỡi được** | Dữ liệu 1 thú (Sói Xám), `--mount` cho mã quà tặng, vẽ bằng code, gọi/xuống, tốc chạy, tự xuống khi đánh, nút 🐎 + phím M, lưu thú đang dùng | 1 – 2 ngày |
| **2. Đủ bộ** | Đủ 5 thú, tab Thú cưỡi (chọn thú đang dùng), nhảy/lướt riêng từng thú | 1 – 2 ngày |
| **3. Nâng cấp & hiệu ứng** | Cho ăn tăng cấp, tô màu khi biến hình, bụi chân thú, âm thanh vó | 1 – 2 ngày |

## VII. RỦI RO CẦN LƯU Ý

1. **Căn chỉnh hình**: mỗi class có khung hình và tỉ lệ khác nhau → cần `saddleY` riêng hoặc tính theo `CHARS[id].fy`.
2. **Va chạm**: khung va chạm nên giữ như đi bộ (18×46) để không kẹt bục, chỉ phần hình to hơn.
3. **Hiệu năng điện thoại**: thêm 1 sprite + hoạt ảnh, không đáng kể; tránh hiệu ứng hạt dày khi cưỡi.
4. **Cân bằng**: tốc chạy quá cao có thể chạy vượt quái để lấy đồ / đi xuyên bản đồ — giới hạn tổng tốc chạy (ví dụ tối đa 450).
5. **Chỉ có qua mã**: người chơi không có mã sẽ không có thú cưỡi — chênh lệch tốc độ đi lại giữa người có và không có mã. Chấp nhận được vì thú không tăng sức mạnh chiến đấu.

---

**Cần bạn quyết trước khi làm:** (1) vẽ bằng code hay dùng bộ hình pixel; (2) có cho cưỡi khi đang biến hình không; (3) có cần nâng cấp thú (giai đoạn 3) không.
