# Đề xuất thiết kế lại chỉ số: nghề, quái, thú triệu hồi, bóng ma

*Bản nháp để duyệt. Chưa sửa code. Số liệu "cũ" lấy trực tiếp từ code hiện tại; số liệu "mới" là đề xuất.*

## Đã triển khai (bản chốt sau khi duyệt)

Các mục dưới đây (0–7) là bản đề xuất ban đầu. **Bản đã code khác đề xuất ở những điểm sau** (theo quyết định của bạn):

| Hạng mục | Bản đã code |
|---|---|
| Công thức giảm sát thương | `GameData.defReduce(def, cấp)` = DEF / (DEF + 60 + 12 × cấp), tối đa 75%. Dùng cho người đánh quái, quái đánh người, thú, bóng (`public/js/scene/combat.js`) |
| Chỉ số nghề | Đường cong riêng mỗi nghề (`SCHOOLS[...].curve = [cơ bản, mỗi cấp]`), **mỗi cấp gấp 2.5 lần bản đề xuất ban đầu** để cấp và nghề có trọng lượng. VD Kiếm Sĩ: HP 120 + 60/cấp, ATK 10 + 6/cấp, DEF 4 + 3.25/cấp. Bỏ hết hệ số % nhân. Chưa chọn nghề: `NOVICE_CURVE` |
| Trọng lượng cấp + nghề | Cấp + nghề chiếm khoảng 31–56% chỉ số (trước đây 10–46%); xem bảng đo bên dưới |
| Quái | Đường cong `MON_CURVE` (HP, ATK theo cấp, DEF = 2 + 1.6 × cấp), ATK ≈ gấp 2 bản đầu: quái thường chết sau ~5 đòn, mỗi đòn quái gây ~6–7% máu người, trùm ~11–12% |
| Hạng quái | **Đã đổi:** HP tinh anh ×10, thủ lĩnh ×100, trùm ×200 là mức TRẦN (trùm cuối thêm ×1.67); thủ lĩnh / trùm dốc theo cấp quái (×0.25 ở cấp ≤15 → ×1 ở cấp ≥70, xem GRADE_RAMP) để trùm đầu game đánh được. EXP: tinh anh ×6, thủ lĩnh ×20, trùm ×25. Bản cũ:  HP/EXP tinh anh ×2.5/×3, thủ lĩnh ×5/×8, trùm ×12/×25, trùm cuối thêm ×1.67/×1.6. `atk`/`def` trong dữ liệu là giá trị CUỐI đã nhân hệ số hạng |
| EXP quái thường | `expToNext(cấp) / (10 + 0.2 × cấp)` (cần 10 con ở cấp 1, 20 con cấp 50, 30 con cấp 100). Trùm hết lỗi 2.4 triệu EXP |
| Trang bị cấp 51+ | Hạ sâu hơn bản đầu: HP Áo 900/1290/1680/2070/2460 → **650/800/950/1100/1250**, DEF Áo 57/80/102/125/147 → **52/62/72/84/96**, ATK Kiếm 145/200/255/310/365 → **145/165/185/205/225**; MP trên đồ nhân cùng tỉ lệ HP. Cường hóa giữ +8% |
| Thú triệu hồi | **Độc lập với chủ**: chỉ số theo cấp thú (`PET_CURVE`: HP, ATK, DEF), không cộng gì từ chỉ số chủ. Cấp thú vẫn bị kẹp tối đa bằng cấp chủ. Linh thú có hệ số loài HP/DEF/ATK/tốc đánh (Linh Phong đánh nhanh hơn 15%) |
| Bóng ma | **Gọi 7 cùng lúc, lưu 20.** Chỉ số = chỉ số hiện tại của loài quái gốc × (đường cong quái ở cấp bóng ÷ ở cấp quái) × hệ số hạng: HP ×0.8/0.6/0.5/0.3, ATK ×0.13/0.15/0.17/0.19 (thường/tinh anh/thủ lĩnh/trùm). 7 bóng thường ≈ 1 người cùng cấp |
| Nhánh tiến hóa (chức nghiệp 2) | Thêm `EVOLUTION_FORMS`: hình thái chức nghiệp 2 nhân chỉ số riêng từng nhánh (bảng dưới). Toàn Năng Tinh Thông: HP/MP/ATK/thể lực ×2 (cũ ×3), DEF ×1.3 |

> **Đã thay thế:** chức nghiệp 2 không còn nhân chỉ số. Sức mạnh nằm ở bộ 4 kỹ năng riêng của nhánh (xem `shared/data/skills.js`, các kỹ năng có `evolutionKey`); Ấn thức tỉnh dùng chung mọi class và chồng được lên chức nghiệp 2. Bảng dưới là bản cũ, giữ để tham khảo.

### (Bản cũ) Chỉ số nhánh tiến hóa

| Nhánh | HP | MP | ATK | DEF | Chí mạng |
|---|---|---|---|---|---|
| Kiếm Thánh | ×1.35 | ×1.15 | ×1.45 | ×1.25 | +3 |
| Thần Xạ | ×1.2 | ×1.2 | ×1.55 | ×1.1 | +8 |
| Đại Pháp Sư | ×1.25 | ×1.6 | ×1.5 | ×1.15 | +3 |
| Ảnh Vương | ×1.2 | ×1.2 | ×1.55 | ×1.1 | +10 |
| Hộ Vệ Bất Khuất | ×1.6 | ×1.2 | ×1.2 | ×1.5 | 0 |
| Thánh Linh | ×1.4 | ×1.6 | ×1.2 | ×1.2 | 0 |
| Tử Linh Thuật Sư | ×1.3 | ×1.5 | ×1.3 | ×1.2 | 0 (còn chồng ấn thức tỉnh) |
| Toàn Năng Tinh Thông | ×2 | ×2 | ×2 | ×1.3 | 0 |

### Số đo sau khi code (Kiếm Sĩ, trang bị tốt nhất theo cấp)

| Cấp | 10 | 30 | 50 |
|---|---|---|---|
| HP | 1.336 | 4.162 | 9.047 |
| ATK | 139 | 431 | 834 |
| DEF | 91 | 270 | 602 |

Quái thường cấp 50 (HP 3.700 sau hạng): ~5 đòn để hạ, ~6% máu mỗi đòn quái trúng. Trùm cấp 60: ~64 đòn để hạ, ~11% máu mỗi đòn.

---

## 0. Vấn đề cốt lõi tìm thấy

1. **Quái gần như vô hại từ cấp ~6 trở đi.** Công thức đòn quái: `sát thương = ATK quái − DEF người × 0.5` (tối thiểu 1). DEF người (cộng từ trang bị) tăng nhanh hơn ATK quái nên: ở cấp 30 một con quái thường cần ~**2.900** đòn mới giết được người; ở cấp 50 là ~**10.000** đòn. Chỉ trùm/tinh anh mới gây đau.
2. **Nghề dùng hệ số % nhân lên chỉ số chung** (Kiếm Sĩ +10% ATK, Tanker +40% máu...) nên nghề không có đường cong riêng, và trang bị lấn át hết khác biệt nghề.
3. **Quái từ cấp 51 đến 100 gần như phẳng:** HP 2.500 → 5.300, trong khi người chơi lên 7.000 → 33.000 máu. Cặp "Tàn Dư"/"Hộ Vệ" cùng cấp bậc có chỉ số **y hệt nhau** (vd Tàn Dư Thiên Khôi cấp 51 và Hộ Vệ Thiên Khôi cấp 55).
4. **Lỗi dữ liệu EXP trùm:** Trùm Thiên Khôi cấp 60 cho **2.400.000** EXP (cần ~42.000 để lên cấp 60). Do `exp 12000 × hệ số trùm 200`.
5. **Bóng ma lên cấp 8%/cấp, cộng dồn:** bóng cấp 10 được kẹp lên cấp 50 sẽ mạnh gấp ~21 lần. Mô tả nghề ghi "gọi tối đa 3 bóng" nhưng code `SHADOW_PARTY = 5`.
6. **Linh thú yếu dần so với chủ:** ATK linh thú cấp 50 ≈ 99, ATK chủ ≈ 690 (do trang bị), vì linh thú không hưởng trang bị.

## 1. Công thức chung (đề xuất đổi)

| Hạng mục | Cũ | Mới |
|---|---|---|
| Giảm sát thương nhận | `dmg = ATK − DEF × 0.5` | `dmg = ATK × (1 − giảm)`; `giảm = DEF / (DEF + 60 + 12 × cấp người bị đánh)`, **tối đa 75%** |
| Sát thương người đánh quái | `ATK × mult − DEF quái × 0.5` | cùng công thức giảm ở trên (cấp quái) |

Lý do: DEF tăng đều sẽ luôn có tác dụng nhưng không bao giờ miễn nhiễm. Cần sửa ở `public/js/scene/combat.js:9,121-123,164` và chỗ quái đánh bóng/thú.

Các hằng số giữ nguyên: 3 điểm tiềm năng/cấp (STR→ATK ×2, VIT→HP ×10 và DEF ×0.8, SPI→MP ×6, AGI→chí mạng ×0.4), trần chí mạng 60%, hút máu 15%, giảm hồi chiêu 30%.

## 2. Chỉ số nghề

**Cấu trúc mới:** `chỉ số gốc = cơ bản + mỗi cấp × (cấp − 1)`, riêng từng nghề. **Bỏ các hệ số % nhân** (atk ×1.10, hp ×1.40...). Cộng thêm điểm tiềm năng và trang bị như cũ. Cũ: HP 80 + 18/cấp, MP 30 + 6/cấp, ATK 5 + 2/cấp, DEF 1 + 1/cấp (chung cho mọi nghề rồi nhân %).

### 2.1 Chỉ số gốc theo cấp (chưa tính điểm tiềm năng và trang bị)

Định dạng `cơ bản + mỗi cấp`:

| Nghề | HP | MP | ATK | DEF | Chí mạng gốc | Đặc tính khác |
|---|---|---|---|---|---|---|
| Tân thủ (cấp 1–4) | 100 + 20 | 40 + 6 | 8 + 2.0 | 2 + 1.0 | 3% | |
| Kiếm Sĩ | 120 + 24 | 40 + 5 | 10 + 2.4 | 4 + 1.3 | 5% | Cân bằng, tiền tuyến |
| Cung Thủ | 95 + 18 | 45 + 6 | 11 + 2.7 | 2 + 0.8 | 8% | Tầm xa, chí mạng cao |
| Pháp Sư | 100 + 19 | 70 + 11 | 10 + 2.5 | 2 + 0.9 | 5% | MP nhiều, hồi MP gấp đôi (nội tại) |
| Sát Thủ | 90 + 17 | 40 + 5 | 12 + 2.9 | 2 + 0.7 | 10% | Tốc chạy ×1.15 |
| Tanker | 150 + 32 | 40 + 5 | 8 + 1.8 | 6 + 1.9 | 3% | Hút máu +3% |
| Trị Liệu Sư | 110 + 21 | 80 + 13 | 7 + 1.9 | 3 + 1.1 | 3% | Hồi chiêu −10% |
| Triệu Hồi Sư | 100 + 19 | 70 + 11 | 8 + 2.0 | 2 + 0.9 | 4% | Sức mạnh kỹ năng ×1.08 |
| Tử Linh Thuật Sư | 105 + 20 | 80 + 12 | 8 + 2.1 | 3 + 1.0 | 4% | Sức mạnh kỹ năng ×1.12 |
| Toàn Năng (đặc biệt) | 110 + 21 | 60 + 8 | 10 + 2.4 | 3 + 1.1 | 5% | Kỹ năng ×0.8 sức mạnh, tốn MP ×1.2 (giữ nguyên) |

### 2.2 Giá trị gốc tại các mốc cấp (HP / MP / ATK / DEF)

| Nghề | Cấp 1 | Cấp 10 | Cấp 30 | Cấp 50 | Cấp 100 |
|---|---|---|---|---|---|
| Kiếm Sĩ | 120/40/10/4 | 336/85/32/16 | 816/185/80/42 | 1296/285/128/68 | 2496/535/248/133 |
| Cung Thủ | 95/45/11/2 | 257/99/35/9 | 617/219/89/25 | 977/339/143/41 | 1877/639/278/81 |
| Pháp Sư | 100/70/10/2 | 271/169/33/10 | 651/389/83/28 | 1031/609/133/46 | 1981/1159/258/91 |
| Sát Thủ | 90/40/12/2 | 243/85/38/8 | 583/185/96/22 | 923/285/154/36 | 1773/535/299/71 |
| Tanker | 150/40/8/6 | 438/85/24/23 | 1078/185/60/61 | 1718/285/96/99 | 3318/535/186/194 |
| Trị Liệu Sư | 110/80/7/3 | 299/197/24/13 | 719/457/62/35 | 1139/717/100/57 | 2189/1367/195/112 |
| Triệu Hồi Sư | 100/70/8/2 | 271/169/26/10 | 651/389/66/28 | 1031/609/106/46 | 1981/1159/206/91 |
| Tử Linh Thuật Sư | 105/80/8/3 | 285/188/27/12 | 685/428/69/32 | 1085/668/111/52 | 2085/1268/216/102 |
| Toàn Năng | 110/60/10/3 | 299/132/32/13 | 719/292/80/35 | 1139/452/128/57 | 2189/852/248/112 |

### 2.3 Biến hình (thức tỉnh)

| Bậc | Cũ | Đề xuất |
|---|---|---|
| Ấn 1 (cấp 20) | HP ×1.3, MP ×1.2, ATK ×1.3, DEF ×1.15 | Giữ nguyên |
| Ấn 2 (cấp 45) | HP ×1.6, MP ×1.5, ATK ×1.6, DEF ×1.3 | Giữ nguyên |
| Toàn Năng tiến hóa | HP, MP, ATK, thể lực **×3** | **×2** (×3 là quá lệch so với Ấn 2 ×1.6) |

### 2.4 Thể lực
Giữ nguyên (100 + 2/cấp + 1/điểm Nhanh nhẹn).

## 3. Chỉ số quái

### 3.1 Đường cong cơ sở cho quái **thường** theo cấp (nội suy tuyến tính giữa các mốc)

Căn theo "người chơi tham chiếu" (Kiếm Sĩ, trang bị tốt nhất theo cấp, phẩm chất Tốt, cường hóa theo cấp, **đã áp dụng bảng trang bị mới ở mục 7**). Mục tiêu: **quái thường chết sau ~5 đòn thường**, mỗi đòn quái trúng gây **~7% máu** người (sau giảm sát thương). Trùm ×1.7 ATK nên khoảng 12% máu mỗi đòn.

*(Bản trước đặt ~3% máu mỗi đòn; theo yêu cầu đã tăng ATK quái khoảng gấp 2.)*

| Cấp | 1 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| HP | 130 | 500 | 950 | 1.500 | 2.000 | 3.000 | 3.500 | 4.100 | 4.700 | 5.300 | 5.900 |
| ATK (cũ ×~2) | 17 | 100 | 200 | 350 | 560 | 900 | 1.300 | 1.750 | 2.250 | 2.800 | 3.400 |

- DEF = `2 + 1.6 × cấp` (cấp 50 = 82, cấp 100 = 162).
- EXP = `expToNext(cấp) / (10 + 0.2 × cấp)`, tức cần 10 con ở cấp 1, 20 con ở cấp 50, 30 con ở cấp 100 để lên 1 cấp.
- Tốc độ di chuyển, vàng, rơi đồ, hồi sinh: **giữ nguyên từng con**.

### 3.2 Hệ số theo hạng (đề xuất)

| Hạng | HP | ATK | DEF | EXP | Mục tiêu số đòn |
|---|---|---|---|---|---|
| Thường | ×1 | ×1 | ×1 | ×1 | ~5 |
| Tinh anh | ×2.5 | ×1.2 | ×1.2 | ×3 | ~12 |
| Thủ lĩnh | ×5 | ×1.4 | ×1.3 | ×8 | ~25 |
| Trùm | ×12 | ×1.7 | ×1.5 | ×25 | ~60 |
| Trùm cuối (Thực Thể Bên Kia Cổng) | ×20 | ×2.0 | ×1.7 | ×40 | ~100 |

Cũ: HP ×1/×10/×100/×200 (nhưng dữ liệu đã chia ngược), **ATK không nhân theo hạng**, EXP cùng hệ số HP (nguồn lỗi EXP trùm). Mới: trường `hp`/`atk`/`def`/`exp` trong `MONSTERS` lưu **giá trị gốc theo đường cong**, hạng chỉ là hệ số.

### 3.3 Danh sách quái cũ → mới (đã gồm hệ số hạng)

| Quái | Cấp | Hạng | HP cũ→mới | ATK cũ→mới | DEF cũ→mới | EXP cũ→mới |
|---|---|---|---|---|---|---|
| Mắt Đỏ | 1 | thường | 26→**130** | 5→**17** | 0→**4** | 8→**4** |
| Nấm Độc | 2 | thường | 60→**171** | 9→**26** | 1→**5** | 10→**12** |
| Yêu Tinh | 4 | thường | 120→**253** | 15→**45** | 3→**8** | 22→**39** |
| Slime Sương | 6 | thường | 190→**336** | 20→**63** | 5→**12** | 35→**75** |
| Dơi Hang | 7 | thường | 170→**377** | 24→**72** | 4→**13** | 50→**96** |
| Bộ Xương Pha Lê | 9 | thường | 320→**459** | 30→**91** | 10→**16** | 80→**142** |
| Thằn Lằn Đầm | 11 | thường | 350→**545** | 35→**110** | 12→**20** | 120→**193** |
| Thạch Vương | 12 | trùm | 4200→**7080** | 46→**204** | 15→**32** | 1600→**5510** |
| Ếch Độc Khổng Lồ | 13 | thường | 500→**635** | 45→**130** | 15→**23** | 180→**248** |
| Lính Giáo Hắc Nguyệt | 14 | tinh anh | 700→**1700** | 65→**168** | 20→**29** | 350→**833** |
| Lính Thủy Cổ | 15 | thường | 650→**725** | 55→**150** | 18→**26** | 250→**307** |
| Lam Sương | 15 | trùm | 2800→**8700** | 70→**255** | 22→**39** | 1200→**7681** |
| Nhện Cống Ngầm | 16 | thường | 580→**770** | 58→**160** | 16→**28** | 280→**338** |
| Sát Thủ Bóng Tối | 17 | tinh anh | 750→**2038** | 80→**204** | 18→**35** | 450→**1106** |
| Thủy Xà Vương | 18 | trùm | 8000→**10320** | 85→**306** | 30→**46** | 3000→**10009** |
| Sói Tuyết | 21 | thường | 750→**1005** | 75→**215** | 22→**36** | 400→**498** |
| Quái Rác Tân Đô | 22 | thường | 680→**1060** | 70→**230** | 18→**37** | 350→**532** |
| Người Tuyết | 23 | thường | 900→**1115** | 85→**245** | 28→**39** | 500→**566** |
| Yêu Tinh Băng | 25 | thường | 1000→**1225** | 95→**275** | 25→**42** | 650→**635** |
| Lam Sương (Lần 2) | 25 | trùm | 4600→**14700** | 105→**468** | 35→**63** | 2600→**15863** |
| Sói Đầu Đàn Băng Giá · Thủ Lĩnh | 26 | thủ lĩnh | 1400→**6400** | 115→**406** | 30→**57** | 900→**5355** |
| Quỷ Búa Băng | 28 | tinh anh | 2000→**3475** | 110→**384** | 40→**56** | 1200→**2219** |
| Băng Long | 28 | trùm | 14000→**16680** | 120→**544** | 42→**70** | 5000→**18494** |
| Hộ Vệ Mây Đá | 31 | thường | 1200→**1550** | 115→**371** | 35→**52** | 800→**847** |
| Cua Giáp | 33 | thường | 1400→**1650** | 130→**413** | 32→**55** | 1000→**919** |
| Tri Thức Ma Thần | 35 | thường | 1600→**1750** | 145→**455** | 38→**58** | 1300→**992** |
| Hộ Vệ Sát Thủ Cánh Bạc | 35 | tinh anh | 2200→**4375** | 170→**546** | 35→**70** | 2000→**2976** |
| Linh Hồn Ký Ức | 37 | thường | 1500→**1850** | 155→**497** | 30→**61** | 1500→**1065** |
| Thủ Thư Vô Diện | 38 | tinh anh | 2500→**4750** | 185→**622** | 40→**75** | 2500→**3306** |
| Người Gác Lưu Trữ | 38 | trùm | 22000→**22800** | 175→**881** | 55→**94** | 8000→**27550** |
| Quái Hư Không | 41 | thường | 2000→**2100** | 170→**594** | 45→**68** | 1800→**1213** |
| Quỷ Trăng Đen | 43 | thường | 2400→**2300** | 190→**662** | 42→**71** | 2200→**1287** |
| Ký Sinh Hư Không | 45 | thường | 2600→**2500** | 210→**730** | 48→**74** | 2800→**1361** |
| Kẻ Đeo Mặt Nạ Trăng | 45 | trùm | 35000→**30000** | 240→**1241** | 70→**111** | 15000→**34017** |
| Kỵ Sĩ Hư Không | 46 | tinh anh | 3500→**6500** | 240→**917** | 45→**91** | 4000→**4193** |
| Ma Thần Trăng Tròn · Thủ Lĩnh | 48 | thủ lĩnh | 4200→**14000** | 260→**1165** | 55→**102** | 5000→**11776** |
| Thực Thể Bên Kia Cổng | 50 | trùm(cuối) | 60000→**60000** | 280→**1800** | 90→**139** | 30000→**61848** |
| Tàn Dư Thiên Khôi | 51 | thường | 2500→**3050** | 285→**940** | 73→**84** | 3800→**1583** |
| Hộ Vệ Thiên Khôi | 55 | thường | 2500→**3250** | 285→**1100** | 73→**90** | 3800→**1732** |
| Trùm Thiên Khôi | 60 | trùm | 36000→**42000** | 495→**2210** | 120→**147** | 2400000→**47910** |
| Tàn Dư Long Mạch | 61 | thường | 3200→**3560** | 350→**1345** | 91→**100** | 5600→**1953** |
| Hộ Vệ Long Mạch | 65 | thường | 3200→**3800** | 350→**1525** | 91→**106** | 5600→**2100** |
| Trùm Long Mạch | 70 | trùm | 36000→**49200** | 570→**2975** | 140→**171** | 3000000→**57076** |
| Tàn Dư Tinh Vân | 71 | thường | 3900→**4160** | 415→**1800** | 109→**116** | 7400→**2319** |
| Hộ Vệ Tinh Vân | 75 | thường | 3900→**4400** | 415→**2000** | 109→**122** | 7400→**2464** |
| Trùm Tinh Vân | 80 | trùm | 36000→**56400** | 645→**3825** | 160→**195** | 3600000→**66112** |
| Tàn Dư Thần Mộng | 81 | thường | 4600→**4760** | 480→**2305** | 127→**132** | 9200→**2680** |
| Hộ Vệ Thần Mộng | 85 | thường | 4600→**5000** | 480→**2525** | 127→**138** | 9200→**2823** |
| Trùm Thần Mộng | 90 | trùm | 36000→**63600** | 720→**4760** | 180→**219** | 4200000→**74998** |
| Tàn Dư Sáng Thế | 91 | thường | 5300→**5360** | 545→**2860** | 145→**148** | 11000→**3035** |
| Hộ Vệ Sáng Thế | 95 | thường | 5300→**5600** | 545→**3100** | 145→**154** | 11000→**3175** |
| Trùm Sáng Thế | 100 | trùm | 36000→**70800** | 795→**5780** | 200→**243** | 4800000→**83729** |

*Ghi chú:* EXP quái thường cấp cao **giảm** (vd cấp 81: 9.200 → 2.680) vì cũ chỉ cần ~8 con để lên cấp, mới cần ~26 con. Đây là quyết định cần bạn duyệt (mục 6). HP/ATK quái cấp thấp (1–20) **tăng** vì cũ quá yếu so với người chơi (cấp 6: 190 HP, một đòn người đánh ~130 sát thương).

## 4. Thú triệu hồi (Triệu Hồi Sư)

Cũ (`shared/data/mounts.js:29`): `HP = 60 + 14(lv−1)`, `MP = 24 + 4(lv−1)`, `ATK = 6 + 1.9(lv−1)`, `DEF = 1 + 0.7(lv−1)`, nhân `1 + 0.12 × (cấp kỹ năng th5 − 1)`; hệ số ATK loài 1.0–1.2. Cấp thú ≤ cấp chủ.

**Đề xuất:** thú nhận **chỉ số riêng theo cấp thú + một phần chỉ số của chủ** (để thú hưởng trang bị chủ, không tụt lại phía sau).

| Chỉ số | Công thức mới |
|---|---|
| HP | `(80 + 17 × (lv−1)) × hệ số loài + 15% HP tối đa của chủ` |
| ATK | `(8 + 2.0 × (lv−1)) × hệ số loài + 20% ATK của chủ` |
| DEF | `(2 + 0.9 × (lv−1)) × hệ số loài + 15% DEF của chủ` |
| MP / thể lực | giữ nguyên công thức cũ |
| Cấp kỹ năng th5 | +8% mỗi cấp (cũ 12%) vì đã có phần cộng từ chủ |

### Loài (linh thú mặc định)

| Loài | HP | ATK | DEF | Tốc đánh | Vai trò |
|---|---|---|---|---|---|
| Linh Sói | ×1.0 | ×1.0 | ×1.0 | 1.0 | Cân bằng, tốc chạy nhanh |
| Linh Phong | ×0.85 | ×1.05 | ×0.8 | nhanh hơn 15% | Đánh nhanh, mỏng máu |
| Linh Thằn | ×1.25 | ×0.95 | ×1.25 | 1.0 | Đỡ đòn |
| Linh Hồ | ×0.9 | ×1.2 | ×0.9 | 1.0 | Sát thương cao nhất |

Ví dụ (chủ Triệu Hồi Sư cấp 50 với ATK 560, HP 6.900, DEF 400; Linh Sói cấp 50, kỹ năng th5 cấp 1): HP ≈ 913 + 1.035 = **1.950**, ATK ≈ 106 + 112 = **218**, DEF ≈ 46 + 60 = **106**. (Cũ: HP 746, ATK 99, DEF 35.)

Thú đồng hành từ mã quà tặng (`petStats`, `MOUNTS`): dùng chung công thức này, hệ số `atk` của `MOUNTS` thành hệ số loài.

## 5. Bóng ma (Tử Linh Thuật Sư)

Cũ: chụp HP/ATK/DEF quái lúc chết, nhân `1.08^(cấp bóng − cấp quái)` (cộng dồn), ATK ×1.4.

**Đề xuất:** bóng lớn lên **đi theo đường cong quái** thay vì cộng dồn:

```
chỉ số bóng (cấp x) = chỉ số quái gốc (bảng 3.3) × [đường cong(x) / đường cong(cấp quái)] × hệ số bóng
```

Nghĩa là bóng cấp 50 từ quái cấp 10 mạnh bằng "quái đó nếu nó ở cấp 50", không phình vô hạn.

| Hạng quái gốc | HP bóng | ATK bóng | DEF bóng |
|---|---|---|---|
| Thường | ×0.8 | ×0.30 | ×1.0 |
| Tinh anh | ×0.6 | ×0.35 | ×1.0 |
| Thủ lĩnh | ×0.5 | ×0.40 | ×1.0 |
| Trùm | ×0.3 | ×0.45 | ×1.0 |

(Hệ số tính trên chỉ số **đã gồm hệ số hạng ở 3.2**. ATK bóng thấp hơn bản trước vì ATK quái đã tăng gấp ~2: bóng thường cấp 50 đánh khoảng 30% người chơi, 3 bóng cộng lại xấp xỉ 1 người. Bóng trùm: HP ≈ 12 × 0.3 = 3.6 lần quái thường, ATK ≈ 1.7 × 0.45 ≈ 0.77 lần ATK quái thường.)

- **Cấp bóng ≤ cấp chủ** (giữ quy tắc hiện tại). Tốc độ di chuyển giữ như quái gốc.
- **Số bóng gọi cùng lúc:** mô tả nghề ghi 3, code `SHADOW_PARTY = 5`. Đề xuất **3**. Nếu giữ 5 thì hạ hệ số ATK thường xuống ×0.18.
- Ví dụ: bóng Sói Tuyết (cấp 21, thường) lên cấp 50: quái thường cấp 50 ≈ HP 3.000, ATK 900, nên bóng có HP khoảng **2.400**, ATK khoảng **270**.
- EXP lên cấp bóng giữ nguyên `55 × lv^1.5`.

## 6. Cần bạn duyệt / quyết định

1. **Đổi công thức giảm sát thương** (mục 1) hay giữ `ATK − DEF×0.5` và hạ DEF trang bị? Tôi đề xuất đổi công thức, vì đây là nguyên nhân gốc.
2. **Bỏ hệ số % của nghề**, dùng đường cong riêng (mục 2): đồng ý không?
3. **Quái cấp 1–20 mạnh lên rõ rệt** (HP gấp 2–4 lần, ATK gấp ~1.6 lần). Chấp nhận được không?
4. **EXP quái thường cấp cao giảm** (khoảng 3–4 lần ở cấp 80+) và EXP trùm sửa về mức hợp lý. Có muốn giữ tốc độ lên cấp cũ ở cấp cao không?
5. **Số bóng gọi cùng lúc: 3 hay 5?**
6. **Thú triệu hồi hưởng 15–20% chỉ số chủ:** chấp nhận hay muốn thú hoàn toàn độc lập?
7. **Trang bị (mục 7):** đồng ý hạ chỉ số bậc đồ cấp 51+ như bảng đề xuất? Có muốn giảm cường hóa từ +8% xuống +6% mỗi cấp không?
8. **Nhánh tiến hóa nghề cấp 2** (Kiếm Thánh, Thần Xạ...): chưa đọc phần chỉ số riêng. Có cần thiết kế thêm không?

*Lưu ý:* "mục tiêu số đòn" và "% máu mỗi đòn quái" là giả định dựa trên người chơi tham chiếu (Kiếm Sĩ, chưa tính kỹ năng), nên cần chơi thử và chỉnh sau khi triển khai.

## 7. Chỉ số trang bị

### 7.1 Đánh giá hiện trạng

Mô phỏng Kiếm Sĩ mặc đủ 10 ô đồ tốt nhất theo cấp (phẩm chất Tốt, cường hóa +1 mỗi 8 cấp, tối đa +6):

| Cấp | 10 | 30 | 50 | 70 | 100 |
|---|---|---|---|---|---|
| Trang bị chiếm % HP tổng | 54% | 64% | 75% | 87% | **90%** |
| Trang bị chiếm % ATK tổng | 39% | 49% | 58% | 59% | 65% |

Nghĩa là ở cấp cao, **cấp và nghề gần như không đóng góp gì**, chỉ số do đồ quyết định. Các điểm cần sửa:

1. **Bậc đồ 51+ nhảy vọt.** Máu của Áo đi 20 → 55 → 90 → 140 → 230 → 360 → 520 (tăng ×1.4–1.5 mỗi bậc), rồi **900** (+73%) ở bậc cấp 51, sau đó +390 đều mỗi bậc. Hậu quả: HP người ở cấp 45 → 55 tăng từ 6.800 lên 13.000.
2. **Cường hóa +12 cho +96% chỉ số** (`+8%` mỗi cấp, `shared/data/equipment.js` và `shared/logic/items.js:46`). Cộng phẩm chất Huyền thoại ×1.35 thì một món tối đa mạnh gấp **2.65 lần** món gốc, lớn hơn một bậc đồ.
3. **Bậc đồ cách nhau 10 cấp**, cấp 16–20 và 46–50 không có bậc mới, nên chỉ số đứng yên rồi nhảy theo bậc (bình thường với game kiểu này, nhưng bước nhảy nên đều).
4. **Vũ khí:** ATK tăng 110 (cấp 42) → 145 (55) → 200 (65) → 255 → 310 → 365 (+55 mỗi bậc, gấp 2–3 lần mức tăng các bậc trước).

### 7.2 Đề xuất chỉnh bậc đồ 51+ (bậc ≤ 41 giữ nguyên)

Giá trị theo cấp đồ, tính cho món Áo (HP, DEF) và Vũ khí Kiếm (ATK). Các ô khác và các loại vũ khí khác nhân cùng tỷ lệ (Song Đao, Chùy, Linh Châu... đã sinh tự động từ Kiếm/Trượng nên sẽ tự theo). MP trên đồ nhân cùng tỷ lệ với HP.

| Bậc (cấp đồ) | HP Áo cũ → mới | DEF Áo cũ → mới | Bậc vũ khí (cấp) | ATK Kiếm cũ → mới |
|---|---|---|---|---|
| 41 | 520 (giữ) | 46 (giữ) | 42 | 110 (giữ) |
| 51 | 900 → **700** | 57 → **58** | 55 | 145 (giữ) |
| 61 | 1.290 → **920** | 80 → **72** | 65 | 200 → **175** |
| 71 | 1.680 → **1.150** | 102 → **88** | 75 | 255 → **205** |
| 81 | 2.070 → **1.400** | 125 → **106** | 85 | 310 → **235** |
| 91 | 2.460 → **1.700** | 147 → **126** | 95 | 365 → **265** |

Tăng đều dần (HP +220 → +300, DEF +14 → +20, ATK +30), không còn bước nhảy.

Tác động lên người chơi tham chiếu (Kiếm Sĩ):

| Cấp | 55 | 65 | 75 | 85 | 100 |
|---|---|---|---|---|---|
| HP cũ → mới | 13.041 → 10.577 | 18.176 → 13.617 | 23.311 → 16.781 | 28.446 → 20.191 | 33.747 → 24.383 |
| ATK cũ → mới | 740 → 740 | 956 → 904 | 1.172 → 1.037 | 1.388 → 1.173 | 1.630 → 1.337 |
| DEF cũ → mới | 883 → 896 | 1.202 → 1.097 | 1.518 → 1.334 | 1.839 → 1.590 | 2.169 → 1.892 |

Bảng quái ở mục 3 đã tính theo trang bị **mới**. Nếu bạn giữ trang bị cũ, ATK quái cấp 55+ phải tăng thêm (cấp 100 khoảng 4.700 thay vì 3.400) và HP quái cấp 55+ tăng ~15–25%.

### 7.3 Tùy chọn cần quyết

- **Cường hóa:** giảm từ +8% xuống **+6%** mỗi cấp (tối đa +72% thay vì +96%) để đồ gốc có giá trị hơn. Không đổi tỷ lệ thành công.
- **Muốn cấp và nghề có trọng lượng hơn?** Hiện nghề chỉ chiếm 8–25% chỉ số ở cấp cao. Nếu muốn khác biệt nghề rõ hơn, nâng hệ số mỗi cấp ở mục 2 lên ×1.5 (vd Kiếm Sĩ HP 36 mỗi cấp, ATK 3.6 mỗi cấp) rồi hạ nhẹ bậc đồ tương ứng. Tôi chưa đổi mục này, chờ bạn quyết.
- **Phạm vi:** bảng trên chỉ gồm cột Áo và Kiếm; nếu duyệt, tôi sẽ sinh bảng đầy đủ 10 ô × 12 bậc từ dữ liệu `items.js` để bạn xem trước khi sửa code.
