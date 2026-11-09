# Kế hoạch: mỗi quái một bộ hình riêng

## 1. Hiện trạng

- Có **53 quái** trong `shared/data/monsters.js` nhưng chỉ có **14 bộ hình** trong `public/assets/mobs/`.
- Quái chọn hình qua trường `look` → bảng `LOOK` trong `public/js/art/sprites.js:106`. Khác biệt duy nhất giữa các quái chung hình là **tên + màu tint + kích thước theo hạng**.
- Một số ghép sai bản chất: lính, sát thủ, kỵ sĩ dùng **mắt bay** (`shade → eye`); sói dùng **goblin**; nhện dùng **bộ xương**; ếch và bọ cánh cứng dùng **slime**.

| Bộ hình | Số quái dùng | Quái |
|---|---|---|
| eye | **17** | Mắt Đỏ, Lính Thủy Cổ, Lính Giáo Hắc Nguyệt, Sát Thủ Bóng Tối, Lam Sương (×2), Quái Rác Tân Đô, Tri Thức Ma Thần, Thủ Thư Vô Diện, Quái Hư Không, Kỵ Sĩ Hư Không, Kẻ Đeo Mặt Nạ Trăng, 5 × Tàn Dư (Thiên Khôi → Sáng Thế) |
| goblin | **7** | Yêu Tinh, Thằn Lằn Đầm, Sói Tuyết, Yêu Tinh Băng, Sói Đầu Đàn, Hộ Vệ Sát Thủ Cánh Bạc, Quỷ Trăng Đen |
| nightborne | 5 | 5 × Hộ Vệ (Thiên Khôi → Sáng Thế) |
| troll | 4 | Thạch Vương, Người Tuyết, Đại Thạch Nhân Băng, Hộ Vệ Mây Đá |
| slime | 3 | Slime Sương, Ếch Độc Khổng Lồ, Bọ Cánh Cứng |
| skeleton | 3 | Bộ Xương Pha Lê, Nhện Cống Ngầm, Ký Sinh Hư Không |
| dragon | 3 | Băng Long, Thực Thể Bên Kia Cổng, Trùm Tinh Vân |
| bat, hydra, reaper, beast | 2 mỗi bộ | Dơi Hang / Linh Hồn Ký Ức; Thủy Xà Vương / Trùm Long Mạch; Người Gác Lưu Trữ / Trùm Thần Mộng; Trùm Thiên Khôi / Trùm Sáng Thế |
| dummy, mushroom, werewolf | 1 mỗi bộ | Hình nhân; Nấm Độc; Ma Thần Trăng Tròn |

**Mục tiêu:** 52 bộ hình khác nhau (Lam Sương lần 1 và lần 2 là cùng một nhân vật nên được dùng chung).
Đã có 14 bộ → **cần thêm khoảng 38 bộ**.

## 2. Thay đổi kỹ thuật (làm trước, không cần hình mới)

1. **Tách "hình" khỏi "kiểu hành vi".** Thêm trường `sprite` cho từng quái trong `monsters.js` (ví dụ `sprite: 'linh_giao'`). `look` chỉ còn quyết định hành vi (bay, nhảy, lật hướng…). `Sprites.mobOf()` / `hasMob()` / `fitMob()` đọc `def.sprite` trước, không có thì mới rơi về `LOOK[def.look]` → làm dần được, không vỡ quái cũ.
2. **Cấu hình khung hình theo từng bộ** vẫn nằm trong `MOBS` (`fw, fh, cx, fy, s, bw, bh, anims`), mỗi bộ hình mới thêm 1 dòng.
3. **Cho phép bộ hình thiếu hoạt ảnh.** Nhiều gói miễn phí (gói thú hoang) chỉ có idle/run/walk. Thêm cơ chế dự phòng: thiếu `attack` → dùng `run` + rung/lao tới; thiếu `hit` → nháy trắng; thiếu `death` → mờ dần + rơi (đã có sẵn hiệu ứng tương tự trong `scene/monsters.js`).
4. **Script kiểm tra trùng hình** `scripts/check-mob-sprites.js`: liệt kê bộ hình bị nhiều quái dùng chung, báo lỗi nếu trùng mà không nằm trong danh sách cho phép (`lam_suong` / `lam_suong_2`). Chạy mỗi lần thêm quái mới.
5. **Tải theo bản đồ**: `Sprites.needed()` hiện đã chỉ tải bộ hình của quái trên bản đồ hiện tại → 52 bộ không làm game nặng lúc vào, chỉ cần giữ mỗi bộ ≤ ~300 KB.
6. Bỏ `LOOK_TINT` / tint mặc định cho quái đã có hình riêng (tint chỉ còn dùng cho hạng tinh anh/trùm).

## 3. Phân bổ hình cho từng quái

Ký hiệu nguồn: **GIỮ** = giữ bộ hình hiện tại; **CÓ SẴN** = gói đã có trong `assets_raw/` nhưng chưa dùng cho quái; **MỚI** = cần tìm/mua gói hình.

### Chương 1 (cấp 1–12)
| Quái | Hình đề xuất | Nguồn |
|---|---|---|
| Mắt Đỏ | eye | GIỮ |
| Hình nhân | dummy | GIỮ |
| Nấm Độc | mushroom | GIỮ |
| Yêu Tinh | goblin | GIỮ |
| Slime Sương | slime | GIỮ |
| Dơi Hang | bat | GIỮ |
| Bộ Xương Pha Lê | skeleton | GIỮ |
| Thạch Vương (trùm) | troll | GIỮ |

### Chương 2 (cấp 11–20)
| Quái | Hình đề xuất | Nguồn |
|---|---|---|
| Thằn Lằn Đầm | thằn lằn bò 4 chân | MỚI |
| Ếch Độc Khổng Lồ | cóc độc | MỚI |
| Lính Thủy Cổ | xác lính chết đuối cầm giáo | MỚI |
| Nhện Cống Ngầm | nhện | MỚI |
| Lính Giáo Hắc Nguyệt | lính người cầm giáo | MỚI |
| Sát Thủ Bóng Tối | sát thủ đeo mặt nạ | MỚI |
| Lam Sương (trùm, 2 lần) | nữ kiếm khách song đao | MỚI (dùng chung 2 lần) |
| Thủy Xà Vương (trùm) | hydra | GIỮ |

### Chương 3 (cấp 21–30)
| Quái | Hình đề xuất | Nguồn |
|---|---|---|
| Sói Tuyết | sói (gói Wild Animals, đổi màu trắng) | CÓ SẴN* |
| Quái Rác Tân Đô | chuột cống (Rat – Monsters Creatures Fantasy 2) | CÓ SẴN |
| Người Tuyết | yeti | MỚI |
| Yêu Tinh Băng | tiểu quỷ băng (imp) | MỚI |
| Sói Đầu Đàn Băng Giá | sói lớn / sói tuyết đầu đàn | MỚI |
| Đại Thạch Nhân Băng | người đá băng (golem) | MỚI |
| Băng Long (trùm) | dragon | GIỮ |

### Chương 4 (cấp 31–40)
| Quái | Hình đề xuất | Nguồn |
|---|---|---|
| Hộ Vệ Mây Đá | gấu đá (Bear – Wild Animals) hoặc golem mây | CÓ SẴN / MỚI |
| Bọ Cánh Cứng | bọ cánh cứng | MỚI |
| Tri Thức Ma Thần | pháp sư tà (Evil Wizard 2 – nếu chưa dùng cho nhân vật) | CÓ SẴN / MỚI |
| Linh Hồn Ký Ức | hồn ma | MỚI |
| Hộ Vệ Sát Thủ Cánh Bạc | chiến binh có cánh | MỚI |
| Thủ Thư Vô Diện | rương sách biết cắn (Mimic – MCF2) | CÓ SẴN |
| Người Gác Lưu Trữ (trùm) | reaper | GIỮ |

### Chương 5 (cấp 41–50)
| Quái | Hình đề xuất | Nguồn |
|---|---|---|
| Quái Hư Không | sinh vật bóng tối dạng lỏng | MỚI |
| Quỷ Trăng Đen | heo rừng quỷ (Boar – Wild Animals, đổi màu tối) | CÓ SẴN |
| Ký Sinh Hư Không | ký sinh trùng / sâu xúc tu | MỚI |
| Kỵ Sĩ Hư Không | hiệp sĩ giáp đen | MỚI |
| Ma Thần Trăng Tròn | werewolf | GIỮ |
| Kẻ Đeo Mặt Nạ Trăng (trùm) | pháp sư mặt nạ | MỚI |
| Thực Thể Bên Kia Cổng (trùm) | quái vật xúc tu / mắt khổng lồ | MỚI |

### Hậu truyện (cấp 51–100) – 5 cõi × (Tàn Dư, Hộ Vệ, Trùm)
Mỗi cõi cần một **chủ đề riêng** để 3 quái trong cõi đồng bộ với nhau nhưng khác cõi khác:

| Cõi | Tàn Dư (thường) | Hộ Vệ | Trùm |
|---|---|---|---|
| Thiên Khôi (51–60) | lính giáp bạc | nightborne (GIỮ) | beast (GIỮ) |
| Long Mạch (61–70) | rắn/người rắn | chiến binh rồng | rồng vàng nhiều đầu |
| Tinh Vân (71–80) | tinh linh sao | golem pha lê | quái vũ trụ |
| Thần Mộng (81–90) | bóng ma ác mộng | hiệp sĩ ác mộng | quỷ ác mộng |
| Sáng Thế (91–100) | thiên thần sa ngã nhỏ | thiên sứ hộ vệ | thực thể ánh sáng |

→ 12 bộ MỚI (trừ nightborne + beast giữ lại; hydra/dragon/reaper đã nhường cho quái chương trước).

\* Gói Wild Animals đang dùng cho thú triệu hồi / thú cưỡi sói. Nếu không muốn quái giống thú của người chơi thì xếp Sói Tuyết vào nhóm MỚI.

**Tổng:** GIỮ 14 · CÓ SẴN 4–6 · MỚI ~32–34.

## 4. Nguồn hình mới

Theo thứ tự ưu tiên (cùng phong cách pixel 2D nhìn ngang như bộ hiện tại):
1. Các gói miễn phí cùng tác giả LuizMelo và các gói CC0 trên itch.io / OpenGameArt → không lo giấy phép, phong cách gần nhau nhất.
2. Gói trả phí rẻ (craftpix.net, itch.io): 1 gói thường có 3–10 quái cùng chủ đề → hợp cho 5 cõi hậu truyện.
3. Tự vẽ / thuê vẽ cho trùm cốt truyện (Lam Sương, Kẻ Đeo Mặt Nạ Trăng) vì đây là nhân vật có tên.

Mỗi gói đưa vào phải ghi vào `public/assets/CREDITS.txt` kèm giấy phép.

## 5. Các bước thực hiện

| Bước | Việc | Kết quả |
|---|---|---|
| 1 | Làm phần kỹ thuật mục 2 (trường `sprite`, dự phòng thiếu hoạt ảnh, script kiểm tra) | Có thể gán hình riêng từng quái |
| 2 | Đưa 4–6 gói CÓ SẴN vào (Rat, Mimic, Boar, Bear, Evil Wizard 2, Wolf) | eye và goblin giảm trùng ngay |
| 3 | Gỡ các ghép sai rõ nhất: lính/sát thủ/kỵ sĩ không còn dùng mắt bay, sói không dùng goblin, nhện không dùng bộ xương | Hết cảnh "lính là con mắt bay" |
| 4 | Thêm hình MỚI cho chương 2–5 (~20 bộ) | Mỗi quái cốt truyện có hình riêng |
| 5 | Thêm 12 bộ MỚI cho 5 cõi hậu truyện | Đạt mục tiêu 0 trùng |
| 6 | Chạy script kiểm tra + đi thử từng bản đồ (desktop và mobile) chỉnh `s`, `bw`, `bh` cho khớp | Không lệch chân, khung va chạm đúng |

Trong lúc chưa đủ hình, quái chưa có hình riêng vẫn rơi về bộ cũ như hiện nay — game không bị lỗi giữa chừng.

## 6. Tiến độ

**Đã xong bước 1–3:**
- Trường `sprite` trong `monsters.js`, `Sprites.sheetOf(def)`; `mobOf / hasMob / fitMob` nhận dữ liệu quái thay vì `look`.
- Cờ `faceLeft` (hình gốc quay trái) và `fakeDeath` (không có hoạt ảnh chết → tự ngã nghiêng, mờ dần) trong `Sprites.MOBS`.
- Script `npm run check:mobs` (thêm `--strict` để báo lỗi khi còn trùng).
- 7 bộ hình mới: `wolf`, `bear`, `boar`, `rat`, `mimic`, `evil_wizard`, `ronin`, gán cho:
  Sói Tuyết, Sói Đầu Đàn (wolf) · Quỷ Trăng Đen (boar) · Hộ Vệ Mây Đá (bear) · Quái Rác Tân Đô (rat) ·
  Thủ Thư Vô Diện (mimic) · Tri Thức Ma Thần (evil_wizard) · Sát Thủ Bóng Tối (ronin).
- Kết quả: `eye` 17 → 13 quái, `goblin` 7 → 4, `troll` 4 → 3. 21 bộ hình đang dùng.

## 7. Gói hình mới đã tìm (09/11/2026, chưa tải)

Thông tin lấy từ trang itch.io, chưa xem tận mắt hình xem trước — cần mở trang để chắc hình hợp với quái.

**Miễn phí, CC0 (LuizMelo, cùng phong cách bộ hình đang dùng):**
| Gói | Nội dung | Gán cho |
|---|---|---|
| [Medieval Warrior Pack 2](https://luizmelo.itch.io/medieval-warrior-pack-2) | lính, 4 loại vũ khí | Lính Giáo Hắc Nguyệt |
| [Medieval Warrior Pack](https://luizmelo.itch.io/medieval-warrior-pack) | lính râu mặc giáp, kiếm | Lính Thủy Cổ |
| [Medieval Warrior Pack 3](https://luizmelo.itch.io/medieval-warrior-pack-3) | hiệp sĩ giáp xám xanh, 26×38 | Tàn Dư Thiên Khôi (lính giáp bạc) |
| [Hero Knight 2](https://luizmelo.itch.io/hero-knight-2) | hiệp sĩ đội mũ giáp | Kỵ Sĩ Hư Không |
| [Martial Hero 2](https://luizmelo.itch.io/martial-hero-2) | kiếm khách, 33×56 | Hộ Vệ Sát Thủ Cánh Bạc |
| [Martial Hero](https://luizmelo.itch.io/martial-hero) | kiếm khách | Lam Sương (cả 2 lần) — cần xem hình |
| [Evil Wizard 3](https://luizmelo.itch.io/evil-wizard-3) | nữ pháp sư, 33×53 | Kẻ Đeo Mặt Nạ Trăng |
| [Fire Worm](https://luizmelo.itch.io/fire-worm) | sâu đầu lửa, có cầu lửa | Ký Sinh Hư Không |
| [Huntress](https://luizmelo.itch.io/huntress), [Medieval King Pack](https://luizmelo.itch.io/medieval-king-pack) | nữ thợ săn; vua | dự phòng cho 5 cõi hậu truyện |

**Miễn phí, cho dùng thương mại (không phải CC0, kiểu hình khác):**
| Gói | Ghi chú | Gán cho |
|---|---|---|
| [engvee – Spider](https://engvee.itch.io/free-2d-sideview-spider) | hình dựng từ 3D, có bản pixel hóa | Nhện Cống Ngầm |
| [engvee – Boss Creature](https://engvee.itch.io/free-2d-sideview-boss-creature) | 11 hoạt ảnh, có phun lửa | Thực Thể Bên Kia Cổng |
| [engvee – Skeleton](https://engvee.itch.io/free-2d-side-skeleton) | | dự phòng |
| [Elthen – Ice Elemental](https://elthen.itch.io/ice-elemental) | đủ hoạt ảnh kể cả chết | Yêu Tinh Băng |
| [xeveko – Frog](https://xeveko.itch.io/free-2d-pixel-art-character-frog) | không có bị đánh/chết → dùng `fakeDeath` | Ếch Độc Khổng Lồ |
| [SoulAres – General Baddies](https://soulares.itch.io/free-enemies) | **bắt buộc ghi công** | xem hình rồi chọn |

**Trả phí rẻ (nếu muốn đủ hơn):** [Elthen Yeti](https://elthen.itch.io/2d-pixel-art-yeti-sprites) ($5) → Người Tuyết ·
[Elthen Giant Toad](https://elthen.itch.io/2d-pixel-art-giant-toad-sprites) ($6) · [Ice Golem](https://viks.itch.io/ice-golem) ($2) → Đại Thạch Nhân Băng ·
LuizMelo [Ghost Warrior](https://luizmelo.itch.io/ghost-warrior) ($8) → Linh Hồn Ký Ức · [Dark Knight](https://luizmelo.itch.io/dark-knight) ($8) · [Fantasy Creatures](https://luizmelo.itch.io/fantasy-creatures) ($15, nhiều quái).

Dùng hết các gói miễn phí → giảm thêm khoảng 12 quái trùng (mắt bay 13 → ~6). Còn lại chủ yếu là 5 cõi hậu truyện,
Người Tuyết, Thằn Lằn Đầm, Bọ Cánh Cứng, Linh Hồn Ký Ức, Quái Hư Không → cần gói trả phí hoặc tìm tiếp.

## 8. Phân bổ đề xuất sau khi duyệt itch.io (gói miễn phí, tag 2D)

Đã duyệt 243 gói quái/nhân vật nhìn ngang trên trang free tag-2D và đọc trang chi tiết ~35 gói. Bảng dưới thay cho mục 7 ở các chỗ trùng.
Ghi chú giấy phép: **CC0** = tự do hoàn toàn · **TM** = cho dùng thương mại, không bán lại tài sản · **?** = trang không ghi rõ giấy phép, cần hỏi tác giả.

| Quái (đang trùng) | Gói đề xuất | Giấy phép | Ghi chú |
|---|---|---|---|
| Lính Thủy Cổ | [LuizMelo Medieval Warrior Pack](https://luizmelo.itch.io/medieval-warrior-pack) | CC0 | |
| Lính Giáo Hắc Nguyệt | [LuizMelo Medieval Warrior Pack 2](https://luizmelo.itch.io/medieval-warrior-pack-2) | CC0 | 4 loại vũ khí |
| Kỵ Sĩ Hư Không | [LuizMelo Hero Knight 2](https://luizmelo.itch.io/hero-knight-2) | CC0 | |
| Lam Sương (×2) | [LuizMelo Martial Hero](https://luizmelo.itch.io/martial-hero) | CC0 | cần xem hình |
| Hộ Vệ Sát Thủ Cánh Bạc | [LuizMelo Martial Hero 2](https://luizmelo.itch.io/martial-hero-2) | CC0 | |
| Kẻ Đeo Mặt Nạ Trăng (trùm) | [LuizMelo Evil Wizard 3](https://luizmelo.itch.io/evil-wizard-3) | CC0 | |
| Trùm Thần Mộng | [Clembod Bringer of Death](https://clembod.itch.io/bringer-of-death-free) | TM | hình nhân trùm mũ, cầm lưỡi hái, có đòn phép |
| Quái Hư Không | [Penusbmic Monster Pack I](https://penusbmic.itch.io/monster-pack-i) – Tooth Walker | TM, xin ghi công | |
| Linh Hồn Ký Ức | Penusbmic Monster Pack I – Eyeball Monster | TM, xin ghi công | |
| Nhện Cống Ngầm | [Elthen Spider](https://elthen.itch.io/2d-pixel-art-spider-sprites) | TM | có phun tơ |
| Ký Sinh Hư Không | [Elthen Worm Monster](https://elthen.itch.io/pixel-art-worm-monster-sprites) | TM | không có đòn đánh → mượn di chuyển |
| Ếch Độc Khổng Lồ | [Admurin Bosses – Frogger](https://admurin.itch.io/bosses-frogger) | TM | không có hoạt ảnh chết → `fakeDeath` |
| Đại Thạch Nhân Băng | [Admurin FREE Enemy: Golem](https://admurin.itch.io/enemy-golem) | TM | đổi màu băng |
| Yêu Tinh Băng | [Elthen Ice Elemental](https://elthen.itch.io/ice-elemental) | TM | |
| Sói Đầu Đàn Băng Giá | [Atari Boy Skull Wolf](https://atari-boy.itch.io/skull-wolf-pixel-art) | CC0 | sói xương |
| Thực Thể Bên Kia Cổng | [engvee Boss Creature](https://engvee.itch.io/free-2d-sideview-boss-creature) | TM | hình dựng từ 3D |
| Trùm Tinh Vân | [Elthen Cyclops](https://elthen.itch.io/2d-pixel-art-cyclops-sprites) | TM | có tia laser |
| Trùm Sáng Thế | [oliveiramiro2 Warrior Boss](https://oliveiramiro2.itch.io/warrior-boss-pixel-art-2d-boss-sprite-animations) | ? | 128×128, cần hỏi giấy phép |
| Tàn Dư Thiên Khôi | [LuizMelo Medieval Warrior Pack 3](https://luizmelo.itch.io/medieval-warrior-pack-3) | CC0 | |
| Tàn Dư Long Mạch | [LuizMelo Fire Worm](https://luizmelo.itch.io/fire-worm) | CC0 | |
| Tàn Dư Tinh Vân | [LuizMelo Huntress](https://luizmelo.itch.io/huntress) | CC0 | |
| Tàn Dư Thần Mộng | [Elthen Ghoul](https://elthen.itch.io/2d-pixel-art-ghoul-sprites) | TM | |
| Tàn Dư Sáng Thế | [sanctumpixel Imp & Axe Demon](https://sanctumpixel.itch.io/imp-axe-demon-pixel-art-character) – Imp | TM | |
| Hộ Vệ Long Mạch | sanctumpixel – Axe Demon | TM | |
| Hộ Vệ Tinh Vân | [Kronovi Mecha-Stone Golem](https://darkpixel-kronovi.itch.io/mecha-golem-free) | TM | mắt xanh phát sáng, có laser |
| Hộ Vệ Thần Mộng | [RiLi Cultist Priest](https://rili-xl.itch.io/cultist-priest-pack) | TM | 200×200 |
| Hộ Vệ Sáng Thế | [LuizMelo Medieval King Pack](https://luizmelo.itch.io/medieval-king-pack) | CC0 | |

Dự phòng tốt: [Admurin Enemy Galore I](https://admurin.itch.io/enemy-galore-1) (12 quái 32×32: chuột, cua, golem, sói…), [Admurin Bosses – Gollux](https://admurin.itch.io/bosses-gollux) (trùm đá),
[Elthen Minotaur](https://elthen.itch.io/2d-pixel-art-minotaur-sprites), [Penusbmic Dungeon Enemy 1](https://penusbmic.itch.io/dungeonenemy1) (hiệp sĩ thùng, cung thủ),
[sanctumpixel Sword Skeleton](https://sanctumpixel.itch.io/sword-skeleton-pixel-art-character).

**Không dùng:** MonoPixelArt (bản miễn phí chỉ có 1 con, cấm chỉnh sửa) · Elthen Giant Fly (giấy phép phi thương mại CC BY-NC) ·
escape-pixel Shadeflit / Duskclaw (bản miễn phí chỉ có đứng/chạy) · các gói nhìn từ trên xuống hoặc chỉ có hình tĩnh.

**Vẫn chưa có hình phù hợp (miễn phí):** Thằn Lằn Đầm, Bọ Cánh Cứng, Người Tuyết, Trùm Long Mạch.
Nếu dùng hết bảng trên: từ 12 bộ hình bị trùng còn khoảng 4 cặp.

**Lưu ý phong cách:** gói Admurin / Elthen / Skull Wolf vẽ ở 32–64 px, nhỏ hơn bộ LuizMelo (~150 px khung). Phóng to giữ cạnh rõ được, nhưng điểm ảnh sẽ to hơn các quái khác.

## 9. Đã tải và gán (09/11/2026)

- 19 gói tải về `assets_raw/itch/`, chuyển thành 22 bộ hình bằng `node server/tools/mob-sheets.js` (cắt khung, lật hình quay trái,
  canh thân vào giữa khung, giữ dải ảnh ≤ 4096 px, tự tính `cx / fy / s`).
- Sau `mob-sheets.js` luôn chạy `node server/tools/trim-mob-sheets.js` (thêm `--dry` để chỉ xem): cắt viền trong suốt thừa của từng bộ
  (giảm khoảng một nửa bộ nhớ ảnh quái), tự sửa `fw, fh, cx, cy/fy` trong `Sprites.MOBS` và ghi `rw` = bề rộng khung gốc
  (AI quái dùng `rw` để tính tầm đánh, nên không đổi lối chơi). Hình hiển thị giữ nguyên từng điểm ảnh; cắt ngang đối xứng vì Phaser
  lật ngang quanh tâm khung. Chạy lại tool là an toàn (bộ đã cắt thì bỏ qua). `--reencode` chỉ nén lại ảnh nhỏ hơn.
- 23 quái có hình riêng mới (Lam Sương ×2 dùng chung `samurai`). Kết quả `npm run check:mobs`: 53 quái · 43 bộ hình · 36 quái không trùng.
- Bổ sung sau: Bringer of Death → Trùm Thần Mộng (`reaper_boss`), Admurin Golem → Đại Thạch Nhân Băng (`rock_golem`),
  Skull Wolf → Sói Đầu Đàn (`skull_wolf`). Bỏ: Penusbmic Eyeball (quá nhỏ), Warrior Boss (chưa rõ giấy phép).
- Kết quả cuối: 53 quái · 46 bộ hình · 41 quái không trùng.
- Còn trùng (mỗi bộ ×2): goblin (Yêu Tinh / Thằn Lằn Đầm), slime (Slime Sương / Bọ Cánh Cứng), bat (Dơi Hang / Linh Hồn Ký Ức),
  troll (Thạch Vương / Người Tuyết), hydra (Thủy Xà Vương / Trùm Long Mạch), beast (Trùm Thiên Khôi / Trùm Sáng Thế).
- Cập nhật (09/11/2026): Hộ Vệ Mây Đá đổi từ `bear` sang `stone_golem` (không tint; Hộ Vệ Tinh Vân dùng chung nhưng tint xanh), bộ `bear`
  không còn quái nào dùng nên đã gỡ. Bọ Cánh Cứng đổi từ slime sang `spider` tint xanh ngọc (vẫn là hình tạm, chờ gói hình bọ cánh cứng thật).
  Kết quả `npm run check:mobs`: 53 quái · 45 bộ hình · 39 quái không trùng.
- Cập nhật (09/11/2026, độ phân giải cao): 10 quái đổi sang gói "Free Foes" của Robert Pinero (tranh vẽ tay, khung 150–430 px, giữ nguyên độ phân giải
  gốc, `hd: true`) bằng `node server/tools/free-foes.js` (gói gốc giải nén vào `assets_raw/free-foes/`, bố cục RPG Maker SV 9×6, ánh xạ khung trong
  `ANIMS`). Bộ mới `ff_*`: Slime Sương → ff_slime, Bộ Xương Pha Lê → ff_skeleton, Thằn Lằn Đầm → ff_sahuagin, Sói Tuyết → ff_wolf (tông trắng bạc),
  Quái Rác Tân Đô → ff_rat, Yêu Tinh Băng → ff_kobold (tông băng), Quỷ Trăng Đen → ff_gnoll, Tàn Dư Thần Mộng → ff_zombie.
  Đổi tên theo hình: **Bọ Cánh Cứng → Cua Giáp** (ff_crab), **Đại Thạch Nhân Băng → Quỷ Búa Băng** (ff_troll, tông băng).
  Hộp va chạm (`bw`, `bh`) và tầm đánh (`rw`) giữ theo bộ cũ để lối chơi không đổi. Bắt buộc ghi công "Robert Pinero" (CREDITS.txt + màn hình đăng nhập).
  Đã gỡ 8 bộ cũ không còn dùng: skeleton, slime, wolf, boar, rat, ice_sprite, ghoul, rock_golem. `npm run check:mobs`: 53 quái · 47 bộ hình · 43 quái không trùng.
  Nhân vật (10/11/2026): Toàn Năng đổi sang Engvee "Halberd Warrior" (HD, `node server/tools/engvee-halberd.js`; gói gốc giải nén vào
  `assets_raw/engvee/halberd/`, ô nguồn 320×240, thân 126 px). Các dạng còn lại mượn hình lớp gốc + màu phủ qua `EVO_ALIAS`: Toàn Năng Tinh Thông ← Toàn Năng (vàng),
  Hộ Vệ Bất Khuất ← Tanker, Đại Pháp Sư ← Pháp Sư, chưa chọn lớp ← Kiếm Sĩ. Gói Engvee "Animated Knight" đã thử nhưng thân chỉ cao 78 px (không nét hơn) nên không dùng.
  Vẫn là hình độ phân giải thấp, cần gói mới: Nhện Cống Ngầm (spider), Ký Sinh Hư Không (worm), Trùm Tinh Vân (cyclops), Hộ Vệ Thiên Khôi (nightborne),
  Hộ Vệ Long Mạch (axe_demon), Thủ Thư Vô Diện (mimic), Kỵ Sĩ Hư Không (hero_knight).

**Còn lại (cần hình mới):** lính/kỵ sĩ/Lam Sương vẫn dùng mắt bay vì chưa có bộ hình người nào còn trống;
Sói Tuyết và Sói Đầu Đàn tạm dùng chung `wolf`. Danh sách đầy đủ: chạy `npm run check:mobs`.

- Cập nhật (10/11/2026): gỡ 4 chỗ trùng bằng gói có sẵn trong `assets_raw/`: Dơi Hang → `ff_bat` (Free Foes, quái bay; `free-foes.js` hỗ trợ `fly`),
  Thạch Vương → `rock_golem` (Admurin Golem), Người Tuyết → `ice_sprite` (Elthen Ice Elemental, phóng to), Hộ Vệ Tinh Vân → `fantasy_warrior` (LuizMelo).
  Lưu ý: `troll` và `ff_troll` là CÙNG một hình troll (chỉ đổi màu) nên `check:mobs` không bắt được; nay `troll` không còn quái nào dùng.
  `npm run check:mobs`: 53 quái · 50 bộ hình · còn trùng: hydra (Thủy Xà Vương / Trùm Long Mạch), beast (Trùm Thiên Khôi / Trùm Sáng Thế) — cần tải gói mới.
