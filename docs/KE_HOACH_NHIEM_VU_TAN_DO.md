# Kế hoạch tổng: bản đồ, Tân Đô, quái vật và nhiệm vụ (cấp 1–100)

Trạng thái: **đã duyệt, đang thực hiện**.

**Tiến độ**
- [x] Mạng đường đi: 37 map nối theo sơ đồ mục 2.1, mọi cổng hai chiều, tới được từ Cổng đỏ.
- [x] 5 Tân Đô mới (II, III, IV, VI, VII) + Tân Đô I và V nâng cấp thành làng; NPC dịch vụ; NPC mới Hạ Phong, Minh Triết.
- [x] Trạm dịch chuyển (300 xu, chỉ tới làng đã ghé) và hồi sinh về làng gần nhất.
- [x] Cửa hàng giới hạn theo trần làng (không theo cấp người chơi).
- [x] Bảng Bản đồ vẽ theo mạng đường đi mới.
- [x] Gộp trang bị thành 10 bộ: mỗi ô một món, mỗi món một cấp riêng trải đều 10 cấp của bộ (bộ 1: cấp 1 tới 10; bộ 2: 11 tới 20…). Đồ độc nhất (đồ trùm, thưởng) giữ cấp riêng.
- [x] Hầm Ngầm Tàu Điện (map + quái Chuột Cống Đỏ, dùng cho c1q5 / q5).
- [ ] Quận Thương Mại (map sự kiện), 20 map Chương 6–10 và quái mới.
- [x] Chương 1–2 theo địa lý mới: Hầm Ngầm cho nhiệm vụ Dấu vết Hắc Nguyệt; Tân Đô II là nơi trả nhiệm vụ Chương 2 (Hạ Phong thay Khải ở c2q6, c2q7); **Giải cứu** thật ở c2q10 (nói chuyện với 5 thợ săn bị nhốt trong Cống Ngầm). Giữ mã nhiệm vụ cũ (q0–q10, c2q1–c2q12) để không phải đổi điều kiện mở map; Vy vẫn giao nhiệm vụ ngay trên map như NPC ngoài làng.
- [x] Chương 3–5 (56 nhiệm vụ chính tuyến cho cấp 1–50): thêm 7 nhiệm vụ (c3q11, c4q3b, c4q4b, c4q8, c5q2b, c5q2c, c5q3b); Lữ khách đứng đúng làng theo từng nhiệm vụ; Vy và Lam Sương dời sang Tân Đô IV, V, VI. **Quận Thương Mại** là map sự kiện vào từ Tân Đô I sau c3q5; c3q6 là **Phòng thủ** (bản đơn giản: hạ 24 Quái Rác tràn vào, chưa có đợt theo thời gian). **Chọn thoại** thật ở c4q7 và c5q3b: chọn câu đáp để nhận danh hiệu (hiện ở bảng Nhân vật). NPC xuất hiện giờ theo **mã nhiệm vụ**, chèn nhiệm vụ không làm lệch.
- [x] Chương 6–10 "Năm Trụ Mộng": 20 map mới (mỗi chương 4 map săn + hang trùm cũ), 35 quái, 5 nguyên liệu rèn, 44 nhiệm vụ (`shared/data/quests/chapter6.js`), 5 trùm là Triệu Cương, Diệp Tâm, Quan Tinh, Mộng Điệp, Lăng; 3 kết thúc qua Chọn thoại. Cơ chế: Phòng thủ (c6q5) bản đơn giản là hạ quái; Hộ tống (c7q5) bản đơn giản là chạm 3 điểm dẫn mạch; Giải cứu (c8q5) nói chuyện với 4 trợ lý bị kẹt; Chọn thoại (c9q5, c10q8); c10q4 tổng hợp chạm cửa và hạ quái. Chính tuyến hiện có 100 nhiệm vụ.
- [x] Phụ tuyến 25/25: thêm 14 (Rèn đồ cổ p6-1..3, Truy nã p7-1..2, Nhật ký người Số 3 p8-1..2, Lam Sương ở lại p9-1..2, và mỗi chương 6–10 một nhiệm vụ p10-1, p11-1, p12-1, p13-1, p14-1). Phần thưởng có **danh hiệu** (hiện ở bảng Nhân vật). Công cụ `check-quests.js` kiểm tra cả phụ tuyến.
- [ ] Còn lại: cơ chế Hộ tống và Phòng thủ theo đợt thật (hiện là bản đơn giản).
- Công cụ: `node server/tools/check-quests.js` kiểm tra chuỗi nhiệm vụ làm được từ đầu tới cuối và báo các nhiệm vụ buộc đi bộ rất xa.
- [ ] Cơ chế Phòng thủ, Hộ tống, Giải cứu, Chọn thoại, Rèn bậc mới.

Bản này **gộp** hai phần: thiết kế Tân Đô và đường đi (kiểu Ninja School) và bản mở rộng bản đồ, quái vật, nhiệm vụ đã viết trong `KE_HOACH_COT_TRUYEN.md` / `COT_TRUYEN.md` (cấp 1–50). Cốt truyện (nhân vật, Hệ thống, Thiên, Lam Sương, Số 3) trong `COT_TRUYEN.md` giữ nguyên; tài liệu này lo **bản đồ, quái, nhiệm vụ, cửa hàng**.

## 0. Các quyết định đã chốt

1. **Không cần tương thích dữ liệu cũ.** Nhân vật đang chơi sẽ bị đặt lại tiến độ nhiệm vụ (hoặc xóa DB làm lại). Không viết bước chuyển đổi tiến độ.
2. **Có Trạm dịch chuyển** giữa các Tân Đô. **Mất phí cố định**, không theo cấp. Đi bộ giữa các làng thì **miễn phí**. **Phí đã chốt: 300 xu.**
3. **Cửa hàng chỉ giới hạn theo trần của Tân Đô**, không xét cấp người chơi. Ở làng nào mua được mọi món có cấp ≤ trần của làng đó.
4. **Phụ tuyến mục 5 đã duyệt** (20 nhiệm vụ). Giữ tỉ lệ phụ tuyến = 1/4 chính tuyến: chính tuyến tăng lên 100 nên thêm 5 phụ tuyến cho cấp 51–100, tổng **25**.
5. Nơi nhận nhiệm vụ đổi theo từng làng; làng không còn là tâm của mọi đường đi.
6. **Trang bị: mỗi 10 cấp một bộ** (10, 20, 30, … 100), không có bậc đồ lẻ xen giữa. Cửa hàng bán theo bộ; trần của làng là cấp bộ cao nhất bán được.
7. Tên NPC mới do tôi đặt: **Hạ Phong** (Trưởng bến, Tân Đô II) và **Viện trưởng Minh Triết** (Tân Đô VII).
8. Cốt truyện cấp 51–100 "Năm Trụ Mộng" **đã duyệt**.
9. **Quận Thương Mại** (c3q6) giữ là map sự kiện ở Tân Đô I.
10. **Trang bị**: mỗi 10 cấp **một bộ**, mỗi ô trang bị chỉ có **một món**, và **mỗi món một cấp riêng trải đều trên 10 cấp** (vũ khí +0, áo +1, găng +2, giày +3, mũ +4, quần +5, đai +6, nhẫn +7, dây chuyền +8, ngọc bội +9, tính từ cấp đầu bộ 1, 11, 21 … 91). Không còn món cấp lẻ xen giữa.
11. **Vật phẩm nhiệm vụ**: nhiệm vụ Thu phải **trả về người giao** (nhận ở đâu thì trả ở đó); vật phẩm nhiệm vụ **chỉ rơi khi đang làm nhiệm vụ** và **hết rơi khi đã đủ số lượng** hoặc **đã trả nhiệm vụ** (mục 6).

## 1. Hiện trạng cần sửa

| Vấn đề | Hiện tại |
|---|---|
| Đường đi | Cả 31 map còn lại đều đi ra từ `lang` (Tân Đô I). Muốn sang map nào cũng phải về Hiệp Hội |
| Cửa hàng | Tạp hóa bán đủ trang bị cấp 1 tới 100 ngay từ đầu |
| Cấp 51–100 | Chỉ 5 map, mỗi map một cặp quái "Tàn Dư / Hộ Vệ" gần như giống hệt nhau. Chương 6 có 15 nhiệm vụ lặp mẫu "giết 15, giết 12, đánh trùm" |
| Cấp 1–50 | Có 28 map, nhưng GDD cũ còn nhiều chỗ chưa làm: Hầm Ngầm Tàu Điện, Quận Thương Mại bị tấn công, nhiệm vụ Phòng thủ / Giải cứu / Lựa chọn thoại |
| Nhận nhiệm vụ | Gần như mọi nhiệm vụ nhận và trả ở Hội trưởng Khải hoặc Vy tại Tân Đô I |
| Phụ tuyến | 11 nhiệm vụ, chỉ 17% chính tuyến |

## 2. Thế giới: 7 Tân Đô và mạng đường đi

Mỗi **Tân Đô** là một làng an toàn nằm **giữa đường**. Các map săn nối với nhau **theo chuỗi**, hoặc **cụt** ở trùm. Chỉ vài map đặc biệt mới vào từ một điểm duy nhất.

Cấu trúc theo cấp: **mỗi 10 cấp có một chương, mỗi chương 5–6 map** (như GDD cũ). Cấp 1–50 giữ 5 chương như cốt truyện cũ; cấp 51–100 mở thành **5 chương nữa** (Chương 6–10) thay cho 5 map đơn.

### 2.1 Sơ đồ đường đi

```
Cổng đỏ ─▶ TÂN ĐÔ I · Hiệp Hội (Lv 1–10)
              ├─▶ Hầm Ngầm Tàu Điện (cụt, mới)
              ├─▶ Kho Bạc Ngầm (cụt, trùm, đặc biệt, mở bằng nhiệm vụ)
              ├─▶ Quận Thương Mại bị tấn công (map sự kiện, chỉ mở khi đang làm nhiệm vụ)
              └─▶ Rừng Sương ─▶ Hang Pha Lê (cụt, trùm Thạch Vương)
                       └─▶ Bến Phà ─▶ Đầm Lầy Mục ─▶ TÂN ĐÔ II · Hải Cảng (Lv 11–20)
                                                        ├─▶ Làng Chài ─▶ Căn Cứ Hắc Nguyệt (cụt, trùm Lam Sương)
                                                        ├─▶ Thành Phố Chìm (Thượng) ─▶ Cống Ngầm (cụt, trùm Thủy Xà Vương)
                                                        └─▶ Chân Núi Tuyết Lặng ─▶ TÂN ĐÔ III · Lò Rèn Băng (Lv 21–30)
                                                                 ├─▶ Hẻm Núi Gió Hú ─▶ Lò Rèn Cổ ─▶ Đỉnh Núi Sương Giá (cụt, trùm Băng Long)
                                                                 └─▶ Vách Đá Gió Thần ─▶ Cổng Khải Hoàn ─▶ TÂN ĐÔ IV · Phù Đảo (Lv 31–40)
                                                                          ├─▶ Quảng Trường Ánh Sáng (cụt)
                                                                          ├─▶ Thư Viện Sảnh Lớn ─▶ Phòng Lưu Trữ Cấm ─▶ Đỉnh Tháp (cụt, trùm)
                                                                          └─▶ Bầu Trời Rách = TÂN ĐÔ V · Hư Không (Lv 41–50)
                                                                                   ├─▶ Cầu Dẫn ─▶ Sảnh Chờ ─▶ Đỉnh Cổng ─▶ Tâm Điểm (cụt, 2 trùm)
                                                                                   └─▶ Cổng SS · Vực Không Cùng (đặc biệt)
                                                                                           └─▶ TÂN ĐÔ VI · Thiên Đô (Lv 51–70)
                                                                                                ├─▶ Chương 6 · Thiên Khôi (5 map, cụt ở trùm)
                                                                                                └─▶ Chương 7 · Long Mạch (5 map) ── map thứ 3 ─▶ TÂN ĐÔ VII · Tinh Hà (Lv 71–100)
                                                                                                                                         ├─▶ Chương 8 · Tinh Vân (5 map, cụt ở trùm)
                                                                                                                                         └─▶ Chương 9 · Thần Mộng (5 map) ── map thứ 4 ─▶ Chương 10 · Sáng Thế (5 map, trùm cuối)
```

Quy tắc đường đi:
- Mỗi làng có 2–4 cổng: **về**, **tiến**, và 1–2 cổng nhánh sang map săn quanh làng.
- Cổng về của mọi map săn trỏ về **làng gần nhất theo đường bộ**, không còn luôn về Tân Đô I.
- Map đặc biệt: Cổng đỏ (mở đầu, chỉ ra Tân Đô I), Kho Bạc (từ Tân Đô I qua nhiệm vụ), Quận Thương Mại (sự kiện), Cổng SS (mở sau Chương 5).
- Số map: **hiện 32** (gồm Tân Đô I). Kế hoạch có **60 map** (xem 2.3): 5 làng mới, 2 map cấp 1–50 mới, 20 map mới cho Chương 6–10, thêm Không Gian Tự Do để kết truyện.

### 2.2 Bảng Tân Đô

| Tân Đô | Cấp | Bản đồ | Mở khi | Trần bộ đồ bán | Cổng |
|---|---|---|---|---|---|
| **I – Hiệp Hội** | 1–10 | `lang` (có sẵn) | Từ đầu | **bộ ≤ 10** | Cổng đỏ, Hầm Ngầm, Kho Bạc, Rừng Sương |
| **II – Hải Cảng** | 11–20 | `tan_do_2` (mới) | Tới từ Đầm Lầy | bộ ≤ 20 | Đầm Lầy, Làng Chài, Thành Phố Chìm, Chân Núi |
| **III – Lò Rèn Băng** | 21–30 | `tan_do_3` (mới) | Tới từ Chân Núi | bộ ≤ 30 | Chân Núi, Hẻm Núi, Vách Đá |
| **IV – Phù Đảo** | 31–40 | `tan_do_4` (mới) | Tới từ Cổng Khải Hoàn | bộ ≤ 40 | Cổng Khải Hoàn, Quảng Trường, Thư Viện, Bầu Trời Rách |
| **V – Hư Không** | 41–50 | `tan_do_bt` (có sẵn) | Tới từ Phù Đảo | bộ ≤ 50 | Phù Đảo, Cầu Dẫn, Cổng SS |
| **VI – Thiên Đô** | 51–70 | `tan_do_6` (mới) | Tới từ Cổng SS | bộ ≤ 70 | Cổng SS, Thiên Khôi, Long Mạch |
| **VII – Tinh Hà** | 71–100 | `tan_do_7` (mới) | Tới từ Long Mạch | bộ ≤ 100 | Long Mạch, Tinh Vân, Thần Mộng |

Mỗi làng: **Trưởng làng** (giao nhiệm vụ chính tuyến), Bảng nhiệm vụ ngày, Thợ rèn, Dược sư, Tạp hóa, Quản kho (kho dùng chung giữa các làng), **Trạm dịch chuyển**.

Quy tắc:
- **Cửa hàng**: tiệm chỉ bán bộ đồ có cấp ≤ trần của làng, **không xét cấp người chơi**. Món vẫn có điều kiện cấp khi mặc.
- **Mỗi 10 cấp một bộ trang bị** (bộ 10, 20, 30, … 100), mỗi bộ đủ các ô, **mỗi ô đúng một món, cùng một cấp** của bộ. Dữ liệu hiện có nhiều bậc lẻ (cấp 1, 2, 3, 5, 6, 7, 9, 10, 11–14, 21–23…) sẽ **gộp lại thành 10 bộ**; đồ trùm và đồ thưởng nhiệm vụ giữ nguyên. Nhờ vậy người chơi không phải đổi đồ liên tục.
- Mua được mọi bộ có cấp ≤ trần làng. Ví dụ ở Tân Đô II mua được bộ 10 và bộ 20.
- **Trạm dịch chuyển**: chọn một làng **đã từng tới** → trả phí cố định → tới ngay. Không dịch chuyển vào map săn quái.
- Thợ rèn mỗi làng giới hạn cấp cường hóa theo trần làng (ví dụ Tân Đô I tối đa +5).

### 2.3 Bản đồ và quái vật theo chương

Ký hiệu: **T** quái thường · **TA** tinh anh · **TL** thủ lĩnh · **B** trùm. *Nghiêng* = mới so với game hiện tại.

**Chương 1 – Cổng đỏ (cấp 1–10, Tân Đô I)**: 5 map

| Map | Cấp | Quái |
|---|---|---|
| Cổng đỏ | 1 | T: Mắt Đỏ |
| Tân Đô I (bãi tập) | 1 | Hình nhân |
| Rừng Sương | 2–6 | T: Nấm Độc, Yêu Tinh, Slime Sương |
| *Hầm Ngầm Tàu Điện* | 4–6 | T: Chuột Cống Đỏ *(mới, dùng lại hình quái cũ nhuộm màu)*, Mắt Đỏ |
| Hang Pha Lê | 7–12 | T: Dơi Hang, Bộ Xương Pha Lê · B: Thạch Vương |

**Chương 2 – Bóng Trăng Khuyết (11–20, Tân Đô II)**: 6 map

| Map | Cấp | Quái |
|---|---|---|
| Bến Phà Hoang | 11 | T: Thằn Lằn Đầm |
| Đầm Lầy Mục | 11–13 | T: Thằn Lằn Đầm, Ếch Độc Khổng Lồ |
| Làng Chài Vùng Ven | 14–17 | TA: Lính Giáo Hắc Nguyệt, Sát Thủ Bóng Tối |
| Căn Cứ Hắc Nguyệt | 14–17 | TA: như trên · B: Lam Sương |
| Thành Phố Chìm – Thượng | 15 | T: Lính Thủy Cổ |
| Thành Phố Chìm – Cống Ngầm | 15–18 | T: Lính Thủy Cổ, Nhện Cống Ngầm · B: Thủy Xà Vương |

**Chương 3 – Lò Rèn Cổ (21–30, Tân Đô III)**: 6 map

| Map | Cấp | Quái |
|---|---|---|
| Chân Núi Tuyết Lặng | 21 | T: Sói Tuyết |
| Hẻm Núi Gió Hú | 21–23 | T: Sói Tuyết, Người Tuyết |
| Lò Rèn Cổ Dưới Băng | 23–25 | T: Người Tuyết, Yêu Tinh Băng |
| Đỉnh Núi Sương Giá | 25–28 | TA: Quỷ Búa Băng · B: Băng Long |
| Kho Bạc Ngầm | 17–25 | TA: Sát Thủ Bóng Tối · B: Lam Sương lần 2 |
| *Quận Thương Mại bị tấn công* (sự kiện, Tân Đô I) | 22–25 | T: *Quái Rác Tân Đô* (mới, dùng lại hình quái cũ nhuộm màu) |

**Chương 4 – Tầng Trời Thứ Bảy (31–40, Tân Đô IV)**: 6 map

| Map | Cấp | Quái |
|---|---|---|
| Vách Đá Gió Thần | 31 | T: Hộ Vệ Mây Đá |
| Cổng Khải Hoàn | 31–33 | T: Hộ Vệ Mây Đá, Cua Giáp |
| Quảng Trường Ánh Sáng | 31–33 | T: như trên |
| Thư Viện – Sảnh Lớn | 35–37 | T: Tri Thức Ma Thần, Linh Hồn Ký Ức |
| Phòng Lưu Trữ Cấm | 35–37 | TA: Hộ Vệ Sát Thủ Cánh Bạc |
| Đỉnh Tháp Lưu Trữ | 38 | TA: Thủ Thư Vô Diện · B: Người Gác Lưu Trữ |

**Chương 5 – Cổng Vĩnh Hằng (41–50, Tân Đô V)**: 6 map

| Map | Cấp | Quái |
|---|---|---|
| Tân Đô – Bầu Trời Rách (làng V) | 41 | an toàn |
| Cầu Dẫn Lên Cổng | 41–43 | T: Quái Hư Không, Quỷ Trăng Đen |
| Sảnh Chờ Không Gian | 43–45 | T: Quỷ Trăng Đen, Ký Sinh Hư Không |
| Đỉnh Cổng Vĩnh Hằng | 45–46 | TA: Kỵ Sĩ Hư Không · B: Kẻ Đeo Mặt Nạ Trăng (Thiên) |
| Tâm Điểm Dị Giới | 45–50 | TL: Ma Thần Trăng Tròn · B: Thực Thể Bên Kia Cổng |
| Cổng SS · Vực Không Cùng | 41–50 | đặc biệt, mở sau cốt truyện (chế độ sau game) |

**Chương 6–10 (cấp 51–100)**: mỗi chương **5 map** (mỗi map hai cấp), mẫu giống nhau: **2 map đầu thường, map 3 có tinh anh, map 4 có thủ lĩnh, map 5 là hang trùm (cụt)**. Mỗi chương 3 quái thường, 2 tinh anh, 1 thủ lĩnh, 1 trùm. Trùm giữ tên đã có trong game.

| Chương | Cấp | Chủ đề | 5 map (đề xuất) | Trùm (có sẵn) |
|---|---|---|---|---|
| 6 – Thiên Khôi | 51–60 | Sa mạc lửa, thiên thạch | *Bãi Thiên Thạch*, *Đồi Khôi Đỏ*, *Mỏ Lửa Cổ*, *Thành Khôi Sụp*, Vùng Thiên Khôi (hang trùm) | Trùm Thiên Khôi |
| 7 – Long Mạch | 61–70 | Mạch rồng, hang ngọc | *Cửa Long Mạch*, *Suối Long Cốt*, *Mạch Ngầm Lam* (có đường tới Tân Đô VII), *Điện Vảy Rồng*, Vùng Long Mạch | Trùm Long Mạch |
| 8 – Tinh Vân | 71–80 | Không gian sao | *Bến Sao Rơi*, *Dải Tinh Vân Tím*, *Trạm Quan Trắc Hỏng*, *Vành Đai Thiên Thạch*, Vùng Tinh Vân | Trùm Tinh Vân |
| 9 – Thần Mộng | 81–90 | Cõi mộng, gương | *Cổng Mộng*, *Vườn Hoa Ảo*, *Mê Cung Gương*, *Tháp Mộng Đảo* (có đường tới Chương 10), Vùng Thần Mộng | Trùm Thần Mộng |
| 10 – Sáng Thế | 91–100 | Khởi nguyên | *Đồng Bằng Khởi Nguyên*, *Rừng Ánh Sáng*, *Biển Ký Ức*, *Ngai Sáng Thế*, Vùng Sáng Thế | Trùm Sáng Thế |

Quái mới: khoảng **6 loại mỗi chương** (30 loại). Nên **dùng lại hình quái hiện có + đổi màu (tint) và đổi tên** để vào game nhanh; hình riêng cho mỗi trùm. Kế hoạch hình quái nằm ở `KE_HOACH_HINH_QUAI.md`, không làm lại ở đây.

## 3. Nhiệm vụ chính tuyến (100 nhiệm vụ)

| Chương | Cấp | Làng | Số nhiệm vụ |
|---|---|---|---|
| 1 | 1–10 | I | 11 |
| 2 | 11–20 | II | 12 |
| 3 | 21–30 | III | 11 |
| 4 | 31–40 | IV | 10 |
| 5 | 41–50 | V | 12 |
| 6–9 | 51–90 | VI, VII | 9 × 4 = 36 |
| 10 | 91–100 | VII | 8 |
| **Tổng** | | | **100** |

Loại: **Hạ** (diệt quái), **Thu** (thu thập), **Gặp** (nói chuyện), **Đạt** (đạt cấp), **Truyện**, **Trùm**, **Giải cứu**, **Phòng thủ**, **Chọn** (lựa chọn thoại), **Rèn** (chế tạo).
Người giao: **Khải** (Hội trưởng, Tân Đô I và VI), **Hạ Phong** (Trưởng bến, Tân Đô II, NPC mới), **Thiết** (Tân Đô III), **Lữ khách** (Tân Đô IV), **Lam Sương** (Tân Đô V), **Minh Triết** (Viện trưởng, Tân Đô VII, NPC mới). **Vy** đi cùng, chủ yếu nói chuyện cốt truyện, vẫn giao một số nhiệm vụ cá nhân.

### Chương 1 – Cổng đỏ (11)

| ID | Tên | Giao / trả | Loại | Mục tiêu |
|---|---|---|---|---|
| c1q1 | Tỉnh dậy trong Cổng đỏ | Hệ thống | Hạ | 3 Mắt Đỏ |
| c1q2 | Bài kiểm tra thức tỉnh | Khải @I | Hạ | 3 Hình nhân |
| c1q3 | Làm quen Hiệp Hội | Khải | Gặp | Thiết, Lan, Vy |
| c1q4 | Cổng đỏ | Khải | Truyện | Mở Rừng Sương |
| c1q5 | Dọn đường rừng mù | Khải | Hạ | 10 Nấm Độc |
| c1q6 | Dấu vết Hắc Nguyệt | Khải | Thu | 5 Mảnh huy hiệu đen (*Hầm Ngầm*) |
| c1q7 | Thức tỉnh lần hai | Khải | Đạt | Cấp 5, chọn class, mở Hang Pha Lê |
| c1q8 | Cổng hạng D | Khải | Hạ | 15 Dơi Hang |
| c1q9 | Vết thương của Vy | Vy @I | Thu | 5 Tinh thể xanh |
| c1q10 | Chủ nhân của cổng | Khải | Trùm | Thạch Vương |
| c1q11 | Báo cáo Hiệp Hội | Khải | Truyện | Mở Bến Phà |

### Chương 2 – Bóng Trăng Khuyết (12)

| ID | Tên | Giao / trả | Loại | Mục tiêu |
|---|---|---|---|---|
| c2q1 | Những người không trở về | Lính gác bến phà (NPC trong map) | Truyện | Mở Đầm Lầy; mở làng II |
| c2q2 | Bùn rác và xương | Hạ Phong @II | Hạ | 20 Thằn Lằn Đầm |
| c2q3 | Dấu chân bị bỏ quên | Hạ Phong | Thu | 6 Mảnh áo thợ săn (Ếch Độc) |
| c2q4 | Trạm thu thập ẩn | Hạ Phong | Hạ | 5 Lính Hắc Nguyệt (Làng Chài) |
| c2q5 | Người quen cũ | Hạ Phong | Trùm | Lam Sương (bỏ chạy ở 30% máu) |
| c2q6 | Vy im lặng | Vy @II | Gặp | Nói chuyện với Vy và Hạ Phong |
| c2q7 | Thử thách hạng C | Hạ Phong | Đạt | Cấp 15, mở Thành Phố Chìm |
| c2q8 | Thành phố dưới nước | Hạ Phong | Hạ | 25 Lính Thủy Cổ |
| c2q9 | Mồi nhử Hắc Nguyệt | Hạ Phong | Thu | 5 Chìa khóa lồng giam |
| c2q10 | Giải cứu trong đêm | Hạ Phong | **Giải cứu** | Thả 5 thợ săn bị giam (Cống Ngầm) |
| c2q11 | Chủ nhân thủy cung | Hạ Phong | Trùm | Thủy Xà Vương |
| c2q12 | Mảnh giấy để lại | Hạ Phong | Truyện | Thư Lam Sương; mở Chân Núi |

### Chương 3 – Lò Rèn Cổ (11)

| ID | Tên | Giao / trả | Loại | Mục tiêu |
|---|---|---|---|---|
| c3q1 | Lưỡi kiếm không xuyên | Thiết @III | Truyện | Kể về Lò Rèn Dưới Băng |
| c3q2 | Đường lên núi băng | Thiết | Hạ | 25 Sói Tuyết |
| c3q3 | Thu thập băng tinh | Thiết | Thu | 8 Băng Tinh (Hẻm Núi) |
| c3q4 | Mồi lửa than cổ | Thiết | Thu | 6 Than Cổ (Lò Rèn) |
| c3q5 | Thức tỉnh Lò Rèn | Thiết | Trùm | Băng Long |
| c3q6 | Báo động đỏ Tân Đô | Khải @I | **Phòng thủ** | Giữ Quận Thương Mại qua 3 đợt (đi bộ hoặc dịch chuyển về I) |
| c3q7 | Kho bạc bị đột kích | Khải | Trùm | Lam Sương lần 2 |
| c3q8 | Quyết định của Vy | Vy | Truyện | Vy tha cho Lam Sương |
| c3q9 | Bí mật của thầy | Khải | Truyện | Sự thật về Thiên |
| c3q10 | Vũ khí từ lõi cổng | Thiết @III | Rèn | Rèn vũ khí Lõi Cổng đầu tiên |
| c3q11 | Cổng thành cổ | Thiết | Truyện | Mở Vách Đá (giới thiệu đường tới làng IV) |

### Chương 4 – Tầng Trời Thứ Bảy (10)

| ID | Tên | Giao / trả | Loại | Mục tiêu |
|---|---|---|---|---|
| c4q1 | Lời nói của người Số 3 | Lữ khách @IV | Truyện | Nghe chuyện cũ |
| c4q2 | Cánh cổng bị cấm | Lữ khách | Đạt | Cấp 30, 6 Nhật ký người chơi |
| c4q3 | Thảm đá phù đảo | Lữ khách | Hạ | 30 Hộ Vệ Mây Đá |
| c4q4 | Cua giáp trên quảng trường | Lữ khách | Hạ | 20 Cua Giáp |
| c4q5 | Thư Viện Hệ Thống | Lữ khách | Thu | 7 Mảnh trang lưu trữ |
| c4q6 | Phòng cấm | Lữ khách | Hạ | 6 Hộ Vệ Sát Thủ Cánh Bạc (tinh anh) |
| c4q7 | Trang nhật ký thứ sáu | Lữ khách | Truyện | Nhật ký của Thiên |
| c4q8 | Kẻ gác đỉnh tháp | Lữ khách | Trùm | Người Gác Lưu Trữ |
| c4q9 | Giọng nói từ hư không | Hệ thống | **Chọn** | Cây lời thoại, ảnh hưởng danh hiệu |
| c4q10 | Bầu trời rách | Lữ khách | Truyện | Mở đường tới Tân Đô V |

### Chương 5 – Cổng Vĩnh Hằng (12)

| ID | Tên | Giao / trả | Loại | Mục tiêu |
|---|---|---|---|---|
| c5q1 | Bầu trời rách tạc | Lam Sương @V | Truyện | Cổng Vĩnh Hằng giội năng lượng |
| c5q2 | Leo lên đỉnh cổng | Lam Sương | Hạ | 40 Quái Hư Không |
| c5q3 | Quỷ trăng đen | Lam Sương | Hạ | 25 Quỷ Trăng Đen |
| c5q4 | Tập hợp liên minh | Lam Sương | Gặp | Vy, Lam Sương, Lữ khách, Thiết |
| c5q5 | Ký sinh | Lam Sương | Thu | 6 Mảnh ký sinh (Sảnh Chờ) |
| c5q6 | Chuẩn bị trận chiến | Khải @V | Chọn | Chọn đội hình và buff liên minh |
| c5q7 | Thầy và trò | Lam Sương | Trùm | Kẻ Đeo Mặt Nạ Trăng (3 giai đoạn) |
| c5q8 | Thực thể bên kia cổng | Lam Sương | Trùm | Thực Thể Bên Kia Cổng |
| c5q9 | Người chơi số 7 | Hệ thống | Truyện | Kết truyện, trạng thái Tự do |
| c5q10 | Tàn dư trong Vực Không Cùng | Khải | Hạ | 30 Quái Hư Không (Cổng SS) |
| c5q11 | Dư ảnh của Thiên | Khải | Hạ | 20 Kỵ Sĩ Hư Không |
| c5q12 | Bình minh sau cánh cổng | Khải | Hạ | 15 Ma Thần Trăng Tròn · Thủ Lĩnh; mở Tân Đô VI |

### Chương 6–10 · Cốt truyện cấp 51–100: "Năm Trụ Mộng"

**Nhân vật mới**
- **Hạ Phong** (Trưởng bến, Tân Đô II): cựu thợ săn cụt tay, biết mọi đường sông. Ít nói, hay trêu.
- **Viện trưởng Minh Triết** (Tân Đô VII): nhà nghiên cứu cổng của Hiệp Hội, hay quên ăn quên ngủ, đã theo dấu Hệ thống suốt mười năm.
- **Bốn người chơi cũ bị giam trong Trụ**: **Triệu Cương** (Số 1, chiến binh), **Diệp Tâm** (Số 2, y sư), **Quan Tinh** (Số 4, nhà thiên văn), **Mộng Điệp** (Số 5, họa sĩ).
- **Lăng** (người thức tỉnh đầu tiên, nguồn gốc của Hệ thống): bí mật cuối của cả game.

**Tiền đề (sau Chương 5).** Cổng Vĩnh Hằng đã đóng, Thiên ở lại bên kia để giữ nó. Hệ thống im lặng ba tháng, Tân Đô yên ổn. Rồi bầu trời quanh Cổng SS nứt thành **năm vết sáng**, và năm **Vùng** rơi xuống như năm hòn đảo: Thiên Khôi, Long Mạch, Tinh Vân, Thần Mộng, Sáng Thế. Đó là mảnh còn lại của thế giới bên kia cổng, lọt qua lúc cổng khép. Hiệp Hội dựng **Thiên Đô** ngay bên Cổng SS làm tiền đồn. "Mảnh Hệ thống cuối cùng" trong túi người chơi bắt đầu rung theo nhịp của từng Vùng.

**Sự thật (lộ dần qua 5 chương).** Mỗi Vùng có một **Trụ Mộng**: cột trụ giam ý thức của một người chơi cũ. Các "người chơi" trước không biến mất khi chạm hạng S. Họ bị Hệ thống **cắm vào trụ** để giữ các cổng khỏi vỡ ra, rồi gọi việc đó là "đạt thành". Người thứ năm không ai biết là ai. Cuối cùng, trụ thứ năm giữ **Lăng**, người thức tỉnh đầu tiên cách đây ba trăm năm. Khi **Thực Thể** (kẻ nuốt thế giới) tìm tới, Lăng đã biến chính ý thức của mình thành Hệ thống để làm **ổ khóa**. Các cổng là kẽ nứt của ổ khóa đó. Hệ thống tuyển thợ săn mạnh làm "chìa" để **gia cố** nó, không phải để mở nó. Ba trăm năm qua, ổ khóa tự ăn mòn thành cơn đói, nên mỗi chìa đều bị nuốt. Thiên đoán đúng là có Thực Thể, nhưng đoán sai rằng Hệ thống là kẻ thù. Giết nửa Thực Thể ở Chương 5 làm vỡ ổ khóa ra năm Vùng.

**Cách nối với các nhân vật cũ**
- **Khải**: chỉ huy Thiên Đô, kể sự thật dần dần. Ông từng nghi Hệ thống mà không dám nói.
- **Vy**: Chương 7 và 9 là chuyện của cô. Diệp Tâm giống y sư của đội Bình Minh; giấc mơ ở Chương 9 cho Vy chia tay đội cũ.
- **Lam Sương**: thợ săn trinh sát tiền tuyến, đi trước dò đường các Vùng.
- **Thiết**: rèn "Đồ Vùng" từ nguyên liệu của từng chương (mỗi 10 cấp một bộ).
- **Lữ khách (Số 3)**: dẫn người chơi vào từng trụ. Ông là người chơi duy nhất thoát khỏi Hệ thống còn sống, nên biết trụ nào giam ai.
- **Thiên**: nghe được qua Mảnh Hệ thống, nhắc người chơi từ bên kia cổng. Trở lại ở đoạn kết.

---

#### Chương 6 – Thiên Khôi (cấp 51–60) · Làng VI Thiên Đô · giao: Khải
Vùng lửa và thiên thạch. **Trụ Mộng Thiên Khôi** giam **Triệu Cương**, chiến binh thứ nhất, kẻ từng muốn mạnh nhất; Hệ thống thưởng sức mạnh cho tới khi chỉ còn cơn giận.

| ID | Tên | Loại | Mục tiêu |
|---|---|---|---|
| c6q1 | Năm vết nứt trên trời | Truyện | Khải kể về năm Vùng, giao nhiệm vụ khảo sát |
| c6q2 | Khảo sát Thiên Khôi | Hạ | 20 quái thường (Bãi Thiên Thạch, Đồi Khôi Đỏ), yêu cầu cấp 51 |
| c6q3 | Tro thiên thạch | Thu | 8 Mảnh Khôi cho Thiết rèn bộ cấp 60 |
| c6q4 | Đường vào mỏ | Hạ | 20 quái thường (Mỏ Lửa Cổ), yêu cầu cấp 55 |
| c6q5 | Giữ trạm khai thác | Phòng thủ | 3 đợt quái tràn vào trạm của thợ mỏ |
| c6q6 | Hộ vệ lửa | Hạ | 8 tinh anh |
| c6q7 | Lá thư của Số 1 | Truyện | Đọc nhật ký Triệu Cương trong Thành Khôi Sụp; hạ Thủ Lĩnh Khôi Tàn |
| c6q8 | Trụ Mộng Thiên Khôi | Trùm | **Triệu Cương** |
| c6q9 | Điều Hệ thống không nói | Truyện | Lữ khách giải thích trụ giam người; mở Long Mạch |

*Cảnh then chốt:* khi hạ trụ, Triệu Cương tỉnh lại một khắc và nói: *"Đừng trở thành người thứ tám."* Mảnh Hệ thống trong túi người chơi nóng lên.

#### Chương 7 – Long Mạch (cấp 61–70) · Làng VI Thiên Đô · giao: Khải, Vy
Mạch ngầm như dòng máu của thế giới, hang đầy ngọc sáng. **Trụ Mộng Long Mạch** giam **Diệp Tâm**, y sư muốn cứu mọi người. Hệ thống dùng chính phép chữa của cô để nuôi các cổng: thương tích của người khác chảy vào cô.

| ID | Tên | Loại | Mục tiêu |
|---|---|---|---|
| c7q1 | Vết thương của đất | Truyện | Khải báo mạch long đang chảy ngược; Vy xin đi cùng |
| c7q2 | Cửa Long Mạch | Hạ | 22 quái thường, yêu cầu cấp 61 |
| c7q3 | Nước ngọc | Thu | 8 Mảnh Ngọc Mạch cho Thiết rèn bộ cấp 70 |
| c7q4 | Suối Long Cốt | Hạ | 22 quái thường, yêu cầu cấp 65 |
| c7q5 | Hộ tống hạt giống mạch | Hộ tống | Đưa Hạt Mạch qua Mạch Ngầm Lam nguyên vẹn |
| c7q6 | Giáp vảy | Hạ | 8 tinh anh (Điện Vảy Rồng) |
| c7q7 | Tiếng gọi người y sư | Truyện | Vy nhận ra phép chữa quen thuộc; hạ Thủ Lĩnh Mạch Vỡ |
| c7q8 | Trụ Mộng Long Mạch | Trùm | **Diệp Tâm** |
| c7q9 | Đường tới Tinh Hà | Truyện | Khải mở Tân Đô VII; Minh Triết xin gặp |

*Cảnh then chốt:* Vy cầm tay Diệp Tâm lúc cô tan đi: *"Chữa cho người khác xong thì tự chữa cho mình nữa nhé."* Vy lần đầu khóc trước mặt người chơi.

#### Chương 8 – Tinh Vân (cấp 71–80) · Làng VII Tinh Hà · giao: Minh Triết
Vùng sao, bến tàu bỏ hoang, trạm quan trắc hỏng. **Trụ Mộng Tinh Vân** giam **Quan Tinh**, nhà thiên văn đầu tiên tính ra rằng các cổng nằm theo một hình, và hình đó là **một ổ khóa**.

| ID | Tên | Loại | Mục tiêu |
|---|---|---|---|
| c8q1 | Viện trưởng Minh Triết | Truyện | Minh Triết đưa bản vẽ các cổng, kể mười năm tìm Hệ thống |
| c8q2 | Bến Sao Rơi | Hạ | 24 quái thường, yêu cầu cấp 71 |
| c8q3 | Mảnh sao | Thu | 8 Mảnh Tinh Vân cho Thiết rèn bộ cấp 80 |
| c8q4 | Dải Tinh Vân Tím | Hạ | 24 quái thường, yêu cầu cấp 75 |
| c8q5 | Giải cứu người đo sao | Giải cứu | Cứu 4 trợ lý bị kẹt ở Trạm Quan Trắc |
| c8q6 | Máy đo điên | Hạ | 8 tinh anh (Vành Đai Thiên Thạch) |
| c8q7 | Hình của ổ khóa | Truyện | Ghép bản vẽ của Quan Tinh; hạ Thủ Lĩnh Vành Đai |
| c8q8 | Trụ Mộng Tinh Vân | Trùm | **Quan Tinh** |
| c8q9 | Con số bảy | Truyện | Bản vẽ chỉ ra: Hệ thống không mở cổng, mà **giữ** cổng |

*Cảnh then chốt:* người chơi nhận ra Hệ thống có thể không phải kẻ thù. Lữ khách im lặng rất lâu rồi nói: *"Ta đã nghi từ lâu. Ta không muốn tin."*

#### Chương 9 – Thần Mộng (cấp 81–90) · Làng VII Tinh Hà · giao: Minh Triết
Vùng giấc mơ, vườn hoa và mê cung gương. **Trụ Mộng Thần Mộng** giam **Mộng Điệp**, họa sĩ vẽ một thế giới không có cổng. Hệ thống cho cô quyền biến mơ thành thật; giấc mơ của cô nuốt dần cả cô lẫn những người lạc vào.

| ID | Tên | Loại | Mục tiêu |
|---|---|---|---|
| c9q1 | Cổng Mộng | Truyện | Mỗi người nhìn thấy điều mình mong nhất; người chơi thấy một cánh cổng đã đóng |
| c9q2 | Vườn hoa không có mùi | Hạ | 26 quái thường, yêu cầu cấp 81 |
| c9q3 | Cánh bướm mộng | Thu | 8 Cánh Bướm Mộng cho Thiết rèn bộ cấp 90 |
| c9q4 | Mê cung gương | Hạ | 26 quái thường, yêu cầu cấp 85 |
| c9q5 | Giấc mơ của Vy | **Chọn** | Vào giấc mơ Bình Minh; chọn nói lời tạm biệt hay ở lại, kết quả đổi danh hiệu |
| c9q6 | Quản gia giấc mơ | Hạ | 8 tinh anh (Tháp Mộng Đảo) |
| c9q7 | Bức tranh cuối | Truyện | Tìm bức tranh Mộng Điệp để lại; hạ Thủ Lĩnh Mê Cung |
| c9q8 | Trụ Mộng Thần Mộng | Trùm | **Mộng Điệp** |
| c9q9 | Một Trụ nữa | Truyện | Bốn Trụ đã giải. Trụ thứ năm hiện lên ở Sáng Thế |

*Cảnh then chốt:* Vy chia tay đội Bình Minh trong mơ, và chỉ cô nghe được những lời cuối. Lam Sương đứng ngoài giấc mơ, cô không có phần trong đó.

#### Chương 10 – Sáng Thế (cấp 91–100) · Làng VII Tinh Hà · giao: Minh Triết
Vùng khởi nguyên, nơi mọi thứ bắt đầu. **Trụ Mộng Sáng Thế** giam **Lăng**, người thức tỉnh đầu tiên, cũng là **Hệ thống**. Bà biến ý thức của mình thành ổ khóa để giam Thực Thể ba trăm năm trước. Giờ ổ khóa đã mục, và bà vẫn đang tự bảo vệ bằng cách nuốt người.

| ID | Tên | Loại | Mục tiêu |
|---|---|---|---|
| c10q1 | Biên giới khởi nguyên | Truyện | Minh Triết dẫn qua cổng cuối cùng; Mảnh Hệ thống phát sáng |
| c10q2 | Đồng bằng khởi nguyên | Hạ | 30 quái thường, yêu cầu cấp 91 |
| c10q3 | Biển ký ức | Thu | 10 Mảnh Ký Ức cho Thiết rèn bộ cấp 100 |
| c10q4 | Ba cánh cửa | Giải cứu, Phòng thủ, Hộ tống | Trận tổng hợp ở Rừng Ánh Sáng |
| c10q5 | Người gác ngai | Hạ | 8 tinh anh (Ngai Sáng Thế) |
| c10q6 | Lăng | Truyện | Nói chuyện với Lăng: bà kể sự thật, xin người chơi giải thoát |
| c10q7 | Trụ Mộng Sáng Thế | Trùm | **Lăng** (hệ thống tự vệ, 3 giai đoạn) |
| c10q8 | Lựa chọn của Số 7 | **Chọn** | Chọn kết thúc, nhận danh hiệu tương ứng |

**Ba kết thúc** (chỉ khác danh hiệu và đoạn phim, không chia nhánh game):
- **Phá Chuỗi**: giải thoát Lăng, ổ khóa tan. Các cổng đóng dần; thợ săn mất sức mạnh Hệ thống nhưng không ai phải trả giá nữa. Danh hiệu "Người Phá Chuỗi".
- **Giữ Lời**: giữ Hệ thống nhưng cho phép từ chối. Thợ săn tự quyết có nhận sức mạnh hay không. Danh hiệu "Người Giữ Lời".
- **Viết Lại**: người chơi làm người giữ ổ khóa mới theo cách không nuốt ai. Thiên bước ra từ bên kia cổng, nhận phần giữ cổng. Danh hiệu "Người Viết Lại".

Dù chọn kết thúc nào, người chơi vẫn chơi tiếp được (cổng ngẫu nhiên, chế độ sau game).

#### Quái vật từng chương
| Chương | Quái thường | Tinh anh | Thủ lĩnh | Trùm (đổi tên từ "Trùm …") |
|---|---|---|---|---|
| 6 Thiên Khôi | Quỷ Tro, Bọ Thiên Thạch, Sói Lửa Khôi | Hộ Vệ Khôi Đỏ, Thợ Mỏ Cháy | Thủ Lĩnh Khôi Tàn | Trụ Mộng Thiên Khôi (**Triệu Cương**) |
| 7 Long Mạch | Rắn Mạch Ngọc, Rùa Đá Mạch, Linh Thủy Mạch | Hộ Mạch Giáp Vảy, Rồng Con Mất Mẹ | Thủ Lĩnh Mạch Vỡ | Trụ Mộng Long Mạch (**Diệp Tâm**) |
| 8 Tinh Vân | Sao Băng Sống, Nhện Tinh Vân, Thợ Quan Trắc Méo | Kỵ Sĩ Sao Tím, Máy Đo Điên | Thủ Lĩnh Vành Đai | Trụ Mộng Tinh Vân (**Quan Tinh**) |
| 9 Thần Mộng | Bướm Mộng, Bóng Gương, Hoa Ảo Ăn Thịt | Nghệ Nhân Gương, Quản Gia Giấc Mơ | Thủ Lĩnh Mê Cung | Trụ Mộng Thần Mộng (**Mộng Điệp**) |
| 10 Sáng Thế | Hạt Giống Ánh Sáng, Cá Ký Ức, Thiên Thần Rỗng | Người Gác Ngai, Bản Sao Số 7 | Thủ Lĩnh Khởi Nguyên | Trụ Mộng Sáng Thế (**Lăng**) |

Quái mới dùng lại hình sẵn có, đổi màu và đổi tên; mỗi trùm có hình người riêng (Triệu Cương, Diệp Tâm, Quan Tinh, Mộng Điệp, Lăng) để nhìn ra "người bị giam".

#### Cơ chế đặc trưng mỗi chương
| Chương | Cơ chế ở nhiệm vụ 5 |
|---|---|
| 6 | Phòng thủ trạm khai thác |
| 7 | Hộ tống Hạt Mạch |
| 8 | Giải cứu người đo sao |
| 9 | Chọn thoại trong giấc mơ (đổi danh hiệu) |
| 10 | Tổng hợp cả ba cơ chế |

## 4. Vật phẩm hiếm và đồ rơi theo chương

Giữ các món GDD cũ: Nhẫn Thạch Vương, Song Đao Lam Sương, Huy Hiệu Bình Minh, Trái Tim Băng Long, Vương Miện Tri Thức, Mảnh Hệ Thống Cuối Cùng, Thần Kiếm Vĩnh Hằng, Mặt Nạ Trăng Khuyết. Thêm mỗi chương 6–10 **1 món trùm** và **1 nguyên liệu rèn bậc mới** (rơi từ tinh anh, dùng ở nhiệm vụ "Rèn"). Số liệu chỉ số làm theo `DE_XUAT_CHI_SO_CAN_BANG.md`.

## 5. Phụ tuyến (25 nhiệm vụ, 1/4 chính tuyến)

**Đã duyệt (20):**

| Nhóm | Giao | Làng | Số | Mở sau | Thưởng chính |
|---|---|---|---|---|---|
| Đội Bình Minh | Vy | II (nhận) | 4 | c2q6 | Huy hiệu Bình Minh, nội tại |
| Hàng thất lạc | Chủ tiệm Tư | I | 2 | c1q11 | Giảm giá, mở hàng |
| Kho chật quá | Quản kho Bảo | I | 3 | c2q2 | +10 ô túi mỗi bậc |
| Thảo dược đỏ | Dược sư Lan | I → II | 2 | c2q2 | Thuốc chữa nhiễm đỏ |
| Rèn đồ cổ | Thiết | III | 3 | Chương 3 | Công thức rèn bậc mới, giảm phí cường hóa |
| Bảng truy nã | Khải | I → III | 2 | Chương 2 | Danh hiệu, xu |
| Nhật ký người Số 3 | Lữ khách | IV | 2 | Chương 4 | Vật phẩm hiếm, thêm ô túi |
| Lam Sương ở lại | Lam Sương | V | 2 | Chương 5 | Nội tại, thú đồng hành |

**Thêm mới cho cấp 51–100 (5)**, mỗi chương 6–10 một phụ tuyến **một nhiệm vụ**, nhẹ, không chặn chính tuyến:

| ID | Giao | Làng | Nội dung | Thưởng |
|---|---|---|---|---|
| p6-1 | Thiết | VI | Mài lại lưỡi kiếm bằng mảnh Thiên Khôi | Công thức rèn đồ cấp 51–60 |
| p7-1 | Lan | VI | Nước long mạch chữa bệnh | Thuốc hồi cao cấp |
| p8-1 | Minh Triết | VII | Đo sao ở Trạm Quan Trắc | Danh hiệu "Người Đo Sao" |
| p9-1 | Vy | VII | Giấc mơ về đội Bình Minh | Cải trang Bình Minh |
| p10-1 | Lam Sương | VII | Lời hứa cuối cùng | Huy hiệu cuối cùng |

## 6. Cơ chế mới cần làm

| Cơ chế | Dùng ở | Ghi chú |
|---|---|---|
| **Làng + Trạm dịch chuyển** | Mọi chương | Bản đồ an toàn, NPC dịch vụ, phí cố định, lưu "làng đã tới" |
| **Cửa hàng theo trần làng** | Mọi chương | Lọc theo cấp đồ ≤ trần của bản đồ, không theo cấp người chơi |
| **Nhận nhiệm vụ theo làng** | Mọi chương | NPC xuất hiện theo mã nhiệm vụ, không theo chỉ số |
| **Giải cứu** | c2q10, Chương 8 | Mở lồng và thả NPC trong map |
| **Phòng thủ** | c3q6, Chương 6 | Các đợt quái theo thời gian, map sự kiện |
| **Hộ tống** | Chương 7 | NPC đi theo, bảo vệ không để chết |
| **Chọn thoại** | c4q9, c5q6, Chương 9 | Lựa chọn ảnh hưởng danh hiệu |
| **Rèn bậc mới** | c3q10, Chương 6–10 | Thợ rèn đổi nguyên liệu lấy đồ |
| **Quái hình người** | Lam Sương, Thiên, lính Hắc Nguyệt | AI di chuyển, lướt, combo (đã có một phần) |

**Quy tắc vật phẩm nhiệm vụ** (đã đúng ở game hiện tại, giữ làm quy chuẩn cho nhiệm vụ mới):
- Nhiệm vụ **Thu** nhận và trả ở **cùng một NPC** (đứng ngay cạnh NPC mới nhận / trả được). Khi trả, server **trừ vật phẩm** khỏi túi.
- Vật phẩm nhiệm vụ chỉ rơi khi nhiệm vụ đó **đang làm** (đồ chính tuyến gắn mã nhiệm vụ trong bảng rơi của quái; đồ phụ tuyến gắn mã phụ tuyến).
- Đã đủ số lượng (trong túi cộng số còn nằm dưới đất) thì quái **ngừng rơi** thêm; trả xong nhiệm vụ thì **không rơi nữa**.
- Mỗi nhiệm vụ Thu mới bắt buộc khai báo mã nhiệm vụ trong `drops` của quái; không có mã nghĩa là rơi vô điều kiện (chỉ dùng cho đồ thường).

Cơ chế **Phòng thủ / Hộ tống / Giải cứu** là loại nhiệm vụ mới, cần chỉnh cả server lẫn client; làm từng cơ chế một khi tới chương cần dùng.

## 7. Thứ tự làm đề xuất

Mỗi bước độc lập, làm xong là chơi thử được.

1. **Mạng đường đi + làng**: sửa `portals` của các map theo sơ đồ 2.1, thêm 5 làng, Trạm dịch chuyển, bảng Bản đồ cập nhật theo đồ thị mới.
2. **Cửa hàng theo trần làng**.
3. **Chương 1–2**: viết lại nhiệm vụ theo bảng, thêm Hầm Ngầm Tàu Điện, Giải cứu.
4. **Chương 3–5**: Quận Thương Mại (Phòng thủ), Chọn thoại, Rèn.
5. **Chương 6–10**: 20 map mới (dùng bộ sinh `gen-maps.js`), quái mới đổi màu, nhiệm vụ.
6. **Phụ tuyến 25 nhiệm vụ** (xen theo từng chương).
7. **Cân lại EXP, vàng, rơi đồ** theo từng chương bằng script mô phỏng.

## 8. Rủi ro

- **Khối lượng hình quái**: 30 loại quái mới. Dùng đổi màu và đổi tên từ hình có sẵn để giảm; trùm cần hình riêng.
- **Khối lượng lời thoại**: 100 chính tuyến và 25 phụ tuyến. Đề xuất viết theo từng chương, mỗi chương một lần duyệt.
- **Gộp trang bị**: đưa nhiều bậc đồ hiện có về 10 bộ (mỗi 10 cấp). Cần cập nhật `equipment.js`, `items.js`, bảng bộ (`TIER_WEAPONS`) và đồ thưởng nhiệm vụ cho khớp, rồi cân lại chỉ số theo `DE_XUAT_CHI_SO_CAN_BANG.md`.
- **Xóa dữ liệu cũ**: không còn đường lui cho nhân vật đang chơi; nên sao lưu DB trước khi áp dụng (`npm run backup`).

## 9. Còn cần bạn quyết

Các câu trước đã chốt hết (phí, bộ trang bị mỗi 10 cấp, tên NPC, cốt truyện, Quận Thương Mại, quy tắc vật phẩm nhiệm vụ). **Hiện không còn câu hỏi mở.** Bước tiếp theo là bắt đầu làm theo thứ tự ở mục 7, bạn báo để tôi bắt đầu từ bước 1 (dựng lại mạng đường đi và các Tân Đô).
