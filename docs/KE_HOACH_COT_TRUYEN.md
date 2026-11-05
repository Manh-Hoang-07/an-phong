# THỨC TỈNH — TÀI LIỆU THIẾT KẾ CỐT TRUYỆN, BẢN ĐỒ VÀ NHIỆM VỤ (CẤP 1 – 50)

> **Loại tài liệu:** Game Design Document (GDD) - Chi tiết Cốt truyện & Gameplay  
> **Phạm vi cấp độ:** Cấp 1 đến Cấp 50 (Mở rộng bản đồ & Nhiệm vụ)  
> **Trạng thái:** Bản hoàn thiện chi tiết

---

## I. TỔNG QUAN HỆ THỐNG CHƯƠNG VÀ BẢN ĐỒ

Mỗi 10 cấp độ được thiết kế gồm **5 đến 6 khu vực/bản đồ riêng biệt**, bao gồm bản đồ dã ngoại, ngục tối (dungeon), khu vực giải đố và chiến trường động.

| Chương | Khoảng Cấp | Danh sách Bản đồ | Trùm chính |
| :--- | :--- | :--- | :--- |
| **Chương 1: Cổng Đỏ & Khởi Đầu** | Cấp 1–10 | 1. Khu Dân Cư Phóng Tỏa<br>2. Trạm Kiểm Soát Số 3<br>3. Rừng Sương Mù (E)<br>4. Hầm Ngầm Tàu Điện Ngầm<br>5. Hang Pha Lê (D) | **Thạch Vương** |
| **Chương 2: Bóng Trăng Khuyết** | Cấp 11–20 | 1. Bến Phà Hoang Tân Đô<br>2. Đầm Lầy Mục (C)<br>3. Làng Chài Vùng Ven<br>4. Thành Phố Chìm - Tầng Thượng<br>5. Thành Phố Chìm - Cống Ngầm<br>6. Căn Cứ Tiền Tiêu Hắc Nguyệt | **Thủy Xà Vương**<br>*(Trùm phụ: Lam Sương)* |
| **Chương 3: Lò Rèn Cổ** | Cấp 21–30 | 1. Chân Núi Tuyết Lặng<br>2. Hẻm Núi Gió Hú (B)<br>3. Lò Rèn Cổ Dưới Băng<br>4. Đỉnh Núi Sương Giá<br>5. Tân Đô - Quận Thương Mại *(Bị Tấn Công)*<br>6. Kho Bạc Ngầm Hiệp Hội | **Băng Long**<br>*(Trùm phụ: Lam Sương Lần 2)* |
| **Chương 4: Tầng Trời Thứ Bảy** | Cấp 31–40 | 1. Vách Đá Gió Thần<br>2. Cổng Khải Hoàn Thành Cổ<br>3. Quảng Trường Ánh Sáng<br>4. Thư Viện Hệ Thống - Sảnh Lớn<br>5. Phòng Lưu Trữ Cấm<br>6. Đỉnh Tháp Lưu Trữ | **Người Gác Lưu Trữ** |
| **Chương 5: Cổng Vĩnh Hằng** | Cấp 41–50 | 1. Tân Đô - Bầu Trời Rách<br>2. Cầu Dẫn Lên Cổng Vĩnh Hằng<br>3. Sảnh Chờ Không Gian<br>4. Đỉnh Cổng Vĩnh Hằng<br>5. Tâm Điểm Dị Giới | **Kẻ Đeo Mặt Nạ Trăng (Thiên)**<br>*(Trùm cuối: Thực Thể Bên Kia Cổng)* |

---

## II. DANH SÁCH NHÂN VẬT (NPC)

### 1. Phe Liên Minh / Hiệp Hội
- **Người chơi (Số 7):** Thợ săn vừa thức tỉnh trong Cổng đỏ, được Hệ thống chọn. Là "Người chơi thứ 7" (6 người trước đều đã mất tích).
- **Vy (Thợ săn hạng C):** Tóc đỏ, cứng rắn, ít nói. Đồng đội chính đồng hành qua các chương. Người duy nhất sống sót sau thảm kịch đội Bình Minh 3 năm trước.
- **Hội trưởng Khải:** Người đứng đầu Hiệp Hội Thợ săn Tân Đô. Thầy của người chơi và từng là thầy của Thiên.
- **Thợ chế tác Thiết:** Thợ rèn của Hiệp Hội. Hậu duệ dòng họ thợ rèn cổ đại, mở tính năng chế tạo trang bị từ Lõi Cổng.
- **Dược sư Lan:** Bán thuốc và nguyên liệu phục hồi. Đang tìm kiếm thảo dược quý để chữa bệnh "Nhiễm đỏ" cho em trai.
- **Lữ khách bí ẩn (Số 3):** Người khoác áo choàng tím đứng cạnh cổng Tân Đô. Là "Người chơi thứ 3" đã từ bỏ Hệ thống, nắm giữ bí mật về các trang nhật ký cổ.
- **Chủ tiệm Tư & Quản kho Bảo:** NPC quản lý cửa hàng, mở rộng kho đồ và giao các nhiệm vụ phụ đời sống.

### 2. Phe Hắc Nguyệt & Phản Diện
- **Kẻ Đeo Mặt Nạ Trăng (Thiên - Thợ săn hạng S):** Phản diện chính. Từng là "Người chơi thứ 6". Phát hiện Hệ thống là ký sinh trùng không gian nên gom Lõi Đỏ để mở Cổng Vĩnh Hằng tiêu diệt nguồn gốc Hệ thống bất chấp hậu quả.
- **Lam Sương:** Sát thủ của Hắc Nguyệt, sử dụng song đao. Đồng đội cũ trong đội Bình Minh tưởng đã chết của Vy. Được Thiên cứu sống nên trung thành với gã, về sau đổi phe.
- **Thực Thể Bên Kia Cổng:** Bản thể ý thức tối cao đứng sau Hệ thống và các Cổng dịch chuyển.

---

## III. CHI TIẾT CÁC CHƯƠNG NHIỆM VỤ, QUÁI VẬT VÀ VẬT PHẨM HIẾM

---

### CHƯƠNG 1: CỔNG ĐỎ (CẤP 1 – 10)

#### 1. Quái vật
- **Quái thường:** Mắt Đỏ Phố Cổ, Yêu Tinh Rừng Sương, Dơi Hang Pha Lê, Bộ Xương Pha Lê.
- **Quái Tinh Anh:** Yêu Tinh Đại Chiến, Thủ Lĩnh Dơi Đêm.
- **Trùm (Boss):** **Thạch Vương** *(Kháng sát thương vật lý, đập đất gây choáng diện rộng)*.

#### 2. Danh sách nhiệm vụ

| ID | Tên Nhiệm Vụ | Loại | Bản đồ | Mục tiêu | Thưởng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **c1q1** | Tỉnh Dậy Trong Cổng Đỏ | Hạ | Khu Dân Cư Phóng Tỏa | Diệt 5 Mắt Đỏ Phố Cổ | 30 KN, 30 Xu, 3 Bình Máu Nhỏ |
| **c1q2** | Bài Kiểm Tra Thức Tỉnh | Hạ | Trạm Kiểm Soát Số 3 | Diệt 3 Hình Nhân Gỗ | Kiếm Luyện Tập, Huy Hiệu E |
| **c1q3** | Lệnh Điêu Phối | Truyện | Trạm Kiểm Soát Số 3 | Gặp Hội trưởng Khải & Vy | Mở bản đồ Rừng Sương Mù |
| **c1q4** | Dọn Đường Rừng Mù | Hạ | Rừng Sương Mù | Diệt 10 Yêu Tinh Rừng Sương | 150 KN, 100 Xu |
| **c1q5** | Dấu Vết Hắc Nguyệt | Thu | Hầm Ngầm Metro | Thu 5 Mảnh Huy Hiệu Đen | Áo Khoác Vải Thợ Săn |
| **c1q6** | Thức Tỉnh Lần Hai | Đạt | Tân Đô | Đạt Cấp 5 + Chọn Class | Vũ Khí Class, Mở Hang Pha Lê |
| **c1q7** | Cổng Hạng D | Hạ | Hang Pha Lê | Diệt 15 Dơi Hang, 10 Bộ Xương | 3 Đá Cường Hóa Sơ Cấp |
| **c1q8** | Vết Thương Của Vy | Thu | Hang Pha Lê | Thu 5 Tinh Thể Xanh | 5 Bình Máu Vừa |
| **c1q9** | **Chủ Nhân Cổng Đỏ** | Trùm | Hang Pha Lê | Hạ **Thạch Vương** | **Nhẫn Thạch Vương**, Lõi Cổng Đỏ |
| **c1q10**| Báo Cáo Hiệp Hội | Truyện | Tân Đô | Trả nhiệm vụ cho Hội trưởng | +2 Điểm Kỹ Năng, Sách Kỹ Năng Sơ Cấp |

- **Nhiệm vụ phụ:**
  - *p-c1-1 (Quản kho Bảo):* Thu thập 10 Da Quái Cổ → Thưởng: **+5 Ô Túi Đồ**.
  - *p-c1-2 (Chủ tiệm Tư):* Giao 3 Kiếm Cũ cho lính gác → Thưởng: Giảm 5% giá mua vật phẩm.

#### 3. Vật phẩm hiếm
- **[Trang sức Hiếm]:** *Nhẫn Thạch Vương* (+15% Giáp, tự động kích hoạt giáp đá khi máu dưới 20%).
- **[Nguyên liệu]:** *Lõi Cổng Đỏ Đục* (Nguyên liệu rèn trang bị hạng D).

---

### CHƯƠNG 2: BÓNG TRĂNG KHUYẾT (CẤP 11 – 20)

#### 1. Quái vật
- **Quái thường:** Thằn Lằn Đầm Mục, Ếch Độc Khổng Lồ, Lính Thuỷ Cổ Độc, Nhện Cống Ngầm.
- **Quái Tinh Anh:** Lính Giáo Hắc Nguyệt, Sát Thủ Bóng Tối Hắc Nguyệt.
- **Trùm Phụ:** **Lam Sương** *(Dùng song đao, lướt nhanh, bỏ chạy ở 30% HP)*.
- **Trùm (Boss):** **Thủy Xà Vương** *(2 Giai đoạn: Dâng nước gây chậm, gọi rắn con)*.

#### 2. Danh sách nhiệm vụ

| ID | Tên Nhiệm Vụ | Loại | Bản đồ | Mục tiêu | Thưởng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **c2q1** | Những Người Không Trở Về | Truyện | Bến Phà Hoang | Nghe tin thợ săn mất tích | Mở Đầm Lầy Mục |
| **c2q2** | Bùn Rác Và Xương | Hạ | Đầm Lầy Mục | Diệt 20 Thằn Lằn Đầm | 600 KN |
| **c2q3** | Dấu Chân Bị Bỏ Quên | Thu | Làng Chài Vùng Ven | Thu 6 Mảnh Áo Thợ Săn | Giày Bộ Đầm Lầy |
| **c2q4** | Trạm Thu Thập Ẩn | Hạ | Làng Chài Vùng Ven | Hạ 5 Lính Hắc Nguyệt | 3 Đá Cường Hóa Trung |
| **c2q5** | **Người Quen Cũ** | Trùm | Căn Cứ Tiền Tiêu | Đánh **Lam Sương** (đến 30% HP) | **Song Đao Lam Sương** |
| **c2q6** | Vy Im Lặng | Gặp | Tân Đô | Nói chuyện với Vy & Hội trưởng | Mở phụ tuyến "Đội Bình Minh" |
| **c2q7** | Thử Thách Hạng C | Đạt | Tân Đô | Đạt Cấp 15 | Thẻ Hạng C, Mở Thành Phố Chìm |
| **c2q8** | Thành Phố Dưới Nước | Hạ | Thành Phố Chìm - Tầng Thượng | Diệt 25 Lính Thủy Cổ | 1.500 KN |
| **c2q9** | Mồi Nhử Hắc Nguyệt | Thu | Thành Phố Chìm - Cống Ngầm | Thu 5 Chìa Khóa Lồng Giam | Đá Cường Hóa ×5 |
| **c2q10**| Giải Cứu Trong Đêm | Gặp | Thành Phố Chìm - Cống Ngầm | Giải cứu 5 NPC Thợ Săn | Danh hiệu "Người Giải Cứu" |
| **c2q11**| **Chủ Nhân Thủy Cung** | Trùm | Thành Phố Chìm | Hạ **Thủy Xà Vương** | **Vảy Thủy Xà Vương**, Lõi Cổng Xanh |
| **c2q12**| Mảnh Giấy Để Lại | Truyện | Tân Đô | Đọc thư Lam Sương để lại | +2 Điểm Kỹ Năng, Mở Max Cấp 30 |

- **Nhiệm vụ phụ:**
  - *p1-1 (Phụ tuyến Đội Bình Minh):* Tìm *Thẻ Bài Của Minh* ở Rừng Sương (Tỷ lệ 10%) → Thưởng: Huy Hiệu Bình Minh I.
  - *p-c2-1 (Dược sĩ Lan):* Thu thập 8 *Cỏ Bốc Hơi* ở Đầm Lầy Mục → Thưởng: Công thức Thuốc Giải Độc Nhiễm Đỏ.

#### 3. Vật phẩm hiếm
- **[Vũ khí Hiếm]:** *Song Đao Lam Sương* (Tốc độ đánh +20%, kích hoạt hiệu ứng Băng Hoại).
- **[Trang sức Hiếm]:** *Huy Hiệu Bình Minh* (Tăng 10% Tấn công khi đi cùng Vy).

---

### CHƯƠNG 3: LÒ RÈN CỔ (CẤP 21 – 30)

#### 1. Quái vật
- **Quái thường:** Sói Tuyết Băng Giá, Người Tuyết Băng Nhọn, Yêu Tinh Băng, Quái Vật Rác Tân Đô.
- **Quái Tinh Anh:** Sói Đầu Đàn Băng Giá, Đại Thạch Nhân Băng.
- **Trùm Phụ:** **Lam Sương (Lần 2)** *(Kết hợp phân thân bóng tối)*.
- **Trùm (Boss):** **Băng Long** *(Phun băng diện rộng, đóng băng toàn sàn đấu)*.

#### 2. Danh sách nhiệm vụ

| ID | Tên Nhiệm Vụ | Loại | Bản đồ | Mục tiêu | Thưởng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **c3q1** | Lưỡi Kiếm Không Xuyên | Truyện | Tân Đô | Thợ rèn Thiết kể về Lò Rèn Cổ | Mở Chân Núi Tuyết Lặng |
| **c3q2** | Đường Up Núi Băng | Hạ | Chân Núi Tuyết Lặng | Diệt 25 Sói Tuyết | 2.500 KN |
| **c3q3** | Thu Thập Băng Tinh | Thu | Hẻm Núi Gió Hú | Thu 8 Băng Tinh Thượng Thừa | Đá Cường Hóa Cao Cấp ×2 |
| **c3q4** | Mồi Lửa Than Cổ | Thu | Lò Rèn Cổ Dưới Băng | Thu 6 Than Cổ từ Người Tuyết | Quần Kháng Băng |
| **c3q5** | **Thức Tỉnh Lò Rèn** | Trùm | Đỉnh Núi Sương Giá | Hạ **Băng Long** | **Trái Tim Băng Long**, Lõi Lò Rèn |
| **c3q6** | Báo Động Đỏ Tân Đô | Phòng thủ | Quận Thương Mại | Bảo vệ Tân Đô qua 3 đợt quái | Giáp Ngực Vệ Binh Tân Đô |
| **c3q7** | Kho Bạc Bị Đột Kích | Trùm | Kho Bạc Ngầm Hiệp Hội | Đánh bại **Lam Sương (Lần 2)** | Mảnh Lõi Đỏ Cổ Đại |
| **c3q8** | Quyết Định Của Vy | Truyện | Kho Bạc Ngầm | Xem phân cảnh Vy tha cho Lam Sương | Nâng cấp Kỹ Năng Đồng Đội (Vy) |
| **c3q9** | Bí Mật Của Thầy | Truyện | Tân Đô | Nghe Hội trưởng Khải kể về Thiên | Nội tại "Ý Chí Thầy Truyền" |
| **c3q10**| Vũ Khí Từ Lõi Cổng | Chế tạo | Lò Rèn Cổ | Rèn vũ khí Lõi Cổng đầu tiên | **Vũ Khí Hạng B (Tự chọn)** |

- **Nhiệm vụ phụ:**
  - *p2-1 (Thợ rèn Thiết):* Tìm 3 Mảnh Sắt Cổ tại Lò Rèn Băng → Thưởng: Mở tính năng **Chế Tạo Bộ Trang Bị Lõi Cổng**.
  - *p-c3-1 (Quản kho Bảo):* Dọn dẹp 20 Quái Rác Tân Đô → Thưởng: **+10 Ô Túi Đồ** (Bậc 2).

#### 3. Vật phẩm hiếm
- **[Nguyên liệu Thần Thoại]:** *Trái Tim Băng Long* (Dùng rèn vũ khí hệ Băng tối thượng).
- **[Vũ khí Hiếm]:** *Thượng Băng Sương* (Tạo vùng làm chậm 40% xung quanh nhân vật).

---

### CHƯƠNG 4: TẦNG TRỜI THỨ BẢY (CẤP 31 – 40)

#### 1. Quái vật
- **Quái thường:** Hộ Vệ Mây Đá, Bọ Cánh Cứng Vũ Truyền, Tri Thức Ma Thần, Linh Hồn Ký Ức.
- **Quái Tinh Anh:** Hộ Vệ Sát Thủ Cánh Bạc, Thủ Thư Vô Diện.
- **Trùm (Boss):** **Người Gác Lưu Trữ** *(Sử dụng kỹ năng sao chép chiêu thức của Người chơi)*.

#### 2. Danh sách nhiệm vụ

| ID | Tên Nhiệm Vụ | Loại | Bản đồ | Mục tiêu | Thưởng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **c4q1** | Lời Nói Của Người Số 3 | Truyện | Tân Đô | Nghe Lữ Khách kể câu chuyện cũ | Mở Vách Đá Gió Thần |
| **c4q2** | Cánh Cổng Bị Cấm | Đạt | Cổng Khải Hoàn | Cấp 30 + Thu 6 Nhật ký người chơi | Vé Vào Thư Viện Hệ Thống |
| **c4q3** | Thảm Đá Phù Đảo | Hạ | Quảng Trường Ánh Sáng | Diệt 30 Hộ Vệ Mây | 5.000 KN |
| **c4q4** | Thư Viện Hệ Thống | Thu | Sảnh Thư Viện | Thu thập 7 Mảnh Trang Lưu Trữ | Mảnh Tri Thức Cổ Đại |
| **c4q5** | Trang Nhật Ký Thứ 6 | Truyện | Phòng Lưu Trữ Cấm | Đọc nhật ký của Thiên | Nội tại "Nhận Thức Ký Sinh" |
| **c4q6** | **Kẻ Gác Đỉnh Tháp** | Trùm | Đỉnh Tháp Lưu Trữ | Hạ **Người Gác Lưu Trữ** | **Vương Miện Tri Thức**, Chìa Khóa |
| **c4q7** | Giọng Nói Từ Hư Không | Truyện | Không Gian Ảo | Lựa chọn thoại tương tác Hệ thống | +5 Điểm Kỹ Năng, Max Cấp 50 |

- **Nhiệm vụ phụ:**
  - *p4-1..6 (Lữ khách bí ẩn):* Thu thập đủ 6 Nhật ký người chơi rơi ngẫu nhiên từ Boss Cổng → Thưởng: Danh hiệu **"Người Đọc Ký Ức"** (+5% Tỷ lệ Bạo kích).

#### 3. Vật phẩm hiếm
- **[Trang sức Hiếm]:** *Vương Miện Tri Thức* (Giảm 15% thời gian hồi chiêu toàn bộ kỹ năng).
- **[Vật phẩm Đặc Biệt]:** *Sách Kỹ Năng Vô Định* (Cho phép cộng tối đa 1 kỹ năng vượt cấp giới hạn).

---

### CHƯƠNG 5: CỔNG VĨNH HẰNG (CẤP 41 – 50)

#### 1. Quái vật
- **Quái thường:** Quái Hư Không Dị Dạng, Quỷ Trăng Đen, Sinh Vật Ký Sinh Hư Không.
- **Quái Tinh Anh:** Kỵ Sĩ Hư Không, Ma Thần Trăng Tròn.
- **Trùm 1:** **Kẻ Đeo Mặt Nạ Trăng (Thiên)** *(3 Giai đoạn: Tráo đổi vũ khí, Tạo vùng không trọng lực, Bùng nổ Lõi Đỏ)*.
- **Trùm Cuối (Final Boss):** **Thực Thể Bên Kia Cổng** *(Bàn tay khổng lồ xé nứt không gian, bắn chùm laser hư không quét toàn sàn đấu)*.

#### 2. Danh sách nhiệm vụ

| ID | Tên Nhiệm Vụ | Loại | Bản đồ | Mục tiêu | Thưởng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **c5q1** | Bầu Trời Rách Tạc | Truyện | Tân Đô - Bầu Trời Rách | Cổng Vĩnh Hằng giội năng lượng xuống | Mở Cầu Dẫn Lên Cổng |
| **c5q2** | Tập Hợp Liên Minh | Gặp | Sảnh Chờ Không Gian | Tập hợp Vy, Lam Sương, Lữ Khách, Thiết | Buff Liên Minh (+20% Chỉ số) |
| **c5q3** | Leo Lên Đỉnh Cổng | Hạ | Cầu Dẫn | Diệt 40 Quái Hư Không | 10.000 KN |
| **c5q4** | **Thầy Và Trò** | Trùm | Đỉnh Cổng Vĩnh Hằng | Đánh bại **Kẻ Đeo Mặt Nạ Trăng (Thiên)** | **Mặt Nạ Trăng Khuyết** |
| **c5q5** | **Thực Thể Bên Kia Cổng**| Trùm | Tâm Điểm Dị Giới | Tiêu diệt **Thực Thể Bên Kia Cổng** | **Mảnh Hệ Thống Cuối Cùng** |
| **c5q6** | Người Chơi Số 7 | Truyện | Không Gian Tự Do | Xem kết phim, nhận Trạng thái Tự Do | Mở Chế Độ End-game (Cổng SS) |

- **Nhiệm vụ phụ:**
  - *p-c5-1 (Quản kho Bảo):* Hoàn thành dọn dẹp vật phẩm Hư Không → Thưởng: **+10 Ô Túi Đồ** (Bậc Tối Đa).
  - *p-c5-2 (Bảng Nhiệm Vụ Hằng Tuần):* Diệt 5 Boss Cổng & 200 Quái Hư Không → Thưởng: Đá Cường Hóa Thần Thoại, Xu Hệ Thống.

#### 3. Vật phẩm hiếm tối thượng
- **[Vật phẩm Thần Thoại]:** *Mảnh Hệ Thống Cuối Cùng* (Cho phép tái phân phối và tùy chỉnh thuộc tính nhân vật không giới hạn).
- **[Vũ Khí Thần Thoại]:** *Thần Kiếm Vĩnh Hằng* (Gây sát thương chuẩn xuyên giáp quái Hư Không).
- **[Trang sức Độc Bản]:** *Mặt Nạ Trăng Khuyết* (Đổi hiệu ứng hình ảnh chiêu thức sang sắc đen Trăng Đen).

---

## IV. CÁC TÍNH NĂNG KỸ THUẬT CẦN PHÁT TRIỂN

1. **AI Quái Hình Người:** Phát triển bộ kỹ năng di chuyển, né tránh, lướt và dùng combo cho NPC Boss hình người (Lam Sương, Thiên, Lính Hắc Nguyệt).
2. **Hệ thống Chế Tạo Lõi Cổng:** Cho phép thợ rèn Thiết phân giải Lõi Cổng thu được từ Boss để rèn trang bị Bộ (Set Items) từ Hạng D đến Hạng S.
3. **Cơ chế Nhiệm vụ Mới:**
   - **Phòng Thủ Thành Phố:** Chống các đợt quái tràn vào theo thời gian thực (Chương 3).
   - **Giải Cứu & Hộ Tống:** Mở lồng giam và bảo vệ NPC di chuyển trong cống ngầm (Chương 2).
   - **Cây Lựa Chọn Lời Thoại (Dialogue Tree):** Đoạn thoại lựa chọn thái độ với Hệ thống ảnh hưởng đến danh hiệu nhận được (Chương 4).