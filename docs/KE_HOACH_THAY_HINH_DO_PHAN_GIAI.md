# Kế hoạch: thay các bộ hình độ phân giải thấp (nhân vật, quái, map)

*Ngày lập: 11/11/2026. Mới là kế hoạch, **chưa tải hay sửa gì**. Số đo đo thật từ file trong `public/assets/`; danh sách nguồn lấy từ tìm kiếm web, **chưa mở từng trang xác nhận giấy phép** (ghi rõ ở từng dòng).*

## 1. Cách đo

Game vẽ trên khung logic cao 540, canvas phóng k = 2.5–3.5×. Mỗi bộ hình có hệ số `s` trong `public/js/art/sprites.js`. **Độ phóng thực tế = `s` × k** (lấy k = 3). Lớn hơn 1 nghĩa là hình bị kéo giãn (mờ/vỡ hạt); càng cao càng kém. Chiều cao khung (`fh`) tính cả khoảng trống nên thân nhân vật còn nhỏ hơn số này.

| Mức | Độ phóng @k3 | Ý nghĩa |
|---|---|---|
| Rất kém | ≥ 6× | Khung cao ≤ 45px, thay trước |
| Kém | 3,3 – 5,1× | Pixel art nhỏ, nên thay nếu có bản tốt hơn cùng phong cách |
| Chấp nhận | 2 – 3,3× | Giữ, xem lại sau |
| Tốt | ≤ 2× | Giữ |

Tông chung của game hiện là **tranh vẽ tay HD** (Engvee cho 4 class + nhiều quái ff_*, LuizMelo, v.v.), nên bản thay thế ưu tiên cùng tông HD, không chỉ "to hơn".

## 2. Kết quả rà soát

### 2.1 Nhân vật (10 bộ)
Chỉ **1 bộ kém**: `tu_linh_thuat_su` (khung 92×111, phóng 3,3×, Necromancer của creativekind). `kiem_si`, `tanker`, `sat_thu`, `toan_nang`, `trieu_hoi_su`, `tri_lieu_su`, `phap_su`, `cung_thu` đều phóng ≤ 2,3× → giữ. `kiem_thanh` phóng 0,8× (thừa độ phân giải, có thể nén nhỏ — việc phụ).

### 2.2 Quái (≈ 50 bộ)
**Rất kém (≥ 6×):**
| Bộ | Khung | Phóng | Quái dùng |
|---|---|---|---|
| `ice_sprite` | 13px | 14,2× | Elthen "Ice Elemental" |
| `spider` | 10px | 10× | Elthen |
| `worm` | 23px | 8,6× | Elthen |
| `rock_golem` | 34px | 6,2× | Admurin FREE Golem |
| `cyclops` | 45px | 6× | Elthen |

**Kém (3,3–5,1×):** `nightborne` 5,1×, `axe_demon` 4,7×, `mimic` 4,5×, `hero_knight` 4,5×, `tooth_walker` 4,4×, `reaper_boss` 4,3×, `knight_silver` 4,3×, `stone_golem` 4,2×, `spearman` 4,1×, `ronin` 4,05×, `huntress` 4×, `goblin` 3,9×, `fantasy_warrior` 3,9×, `eye` 3,6×, `reaper` 3,4×, `imp` 3,4×, `mushroom` 3,3×, `witch` 3,3×, `samurai` 3,2×, `skull_wolf` 3,2×.
Nhóm này là pixel art nhất quán phong cách với nhau và đã được phóng nguyên số nguyên → **không bắt buộc thay**; chỉ thay khi tìm được bản HD cùng nhân vật. Mặc định: giữ, xếp vào "nâng cấp tùy chọn".

**Tốt (≤ 2×):** `ff_*` (11 bộ), `dragon`, `troll`, `beast`, `hydra`, `werewolf`, `void_beast`, `dummy`, `evil_wizard`, `warrior`, `cultist`, `frog_boss`… → giữ.

### 2.3 Thú triệu hồi (`pets/`)
`wolf-*` (cao 98px), `horse-walk` (66px), `bird` (256px/8 hoạt ảnh), `fox/lizard/insect` (117–128px). **Ngựa (66px) là bộ kém nhất**; sói 98px kém vừa. Phụ, làm sau.

### 2.4 Map (`public/assets/bg/`)
Game dùng nền cao ~540×k = 1350–1900px; nền hiện có cao 405–810px nên đều bị phóng 1,7–4×, nhưng là tranh vẽ/vector nên mờ nhẹ, chấp nhận được.
- **Đang dùng và thấp nhất:** `bcn`, `brl` (pixel art 1900×600, phóng 2,3–3,2×; Bongseng). Là pixel art phóng bằng LINEAR nên dễ thấy mờ.
- **Đang dùng, 810px:** `misty`, `night`, `des3`, `fai1–3`, `hal2`, `vamp3–4`, `win1`, 18 cảnh `lr_*` (AI, 1215×810). Phóng 1,7–2,3× — ổn.
- **Chưa dùng:** `cfr1–4` (720×405, thấp nhất!), `uw1–4`, `bch1–4`, `elv*`, `hor*`, `des1,2,4`, `win2–4`, `hal1,3,4`, `fai4`, `vamp1,2`. Không ảnh hưởng game; nếu muốn dùng, `cfr*` phải làm lại từ gói gốc.
- **Việc rẻ nhất:** nguồn gốc của craftpix/Digital Moons là 1920×1080 vector nhưng đã thu 0,75× (hoặc 0,375× với `cfr`, `vamp`) để tiết kiệm bộ nhớ. Chạy lại `server/tools/bg-normalize.js` với hệ số lớn hơn cho **vài map chính** (không phải tất cả) sẽ nét hơn mà không cần tải gì mới, miễn tôn trọng ngân sách GPU ≤ ~20MB/map (kế hoạch nền parallax, mục 4.4).

## 3. Nguồn thay thế tìm được

Tất cả đều là **tìm kiếm web, chưa tải**; cột "việc cần làm" là kiểm tra bắt buộc trước khi tải (đúng quy trình mục 4.2 của `KE_HOACH_NEN_MAP_PARALLAX.md`: lưu trang giấy phép vào `assets_raw/<pack>/LICENSE`, hỏi bạn đồng ý từng gói).

| Thay cho | Gói ứng viên | Cùng tông? | Giấy phép theo trang | Việc cần làm |
|---|---|---|---|---|
| `spider` (10px) | [Engvee – FREE 2D Sideview Spider](https://engvee.itch.io/free-2d-sideview-spider): 18 hoạt ảnh, sheet cao 256–640px | Có (cùng tác giả với 4 class đang dùng) | Dùng thương mại được, không giới hạn số lượng (trang ghi "name your own price") | Tải bản Platformer_Spritesheets (21 MB); xem hoạt ảnh attack/hit/death có đủ |
| `ff_skeleton`… (nếu cần thêm) | [Engvee – FREE 2D Sideview Skeleton](https://engvee.itch.io/free-2d-side-skeleton) | Có | như trên (chưa mở trang) | xác nhận khi tải |
| `ff_crab` / quái mới | [Engvee – Crab Monster](https://engvee.itch.io/free-2d-crab-monster), [Medusa](https://engvee.itch.io/free-animated-sidefront-view-medusa), [Female Orc](https://engvee.itch.io/free-2d-female-orc) (18+) | Có | chưa mở trang | chỉ dùng nếu cần thêm quái; Orc ghi 18+ → bỏ |
| `ice_sprite` (13px) | Chưa có bản HD miễn phí rõ ràng. Ứng viên: [Engvee Stone Golem có skin băng](https://engvee.itch.io/animated-isometric-stone-golem) (nhưng **isometric 16 hướng, $3+**), [Monopixelart Golems (bản free)](https://monopixelart.itch.io/golems-pack) | Không chắc | Chưa rõ | Phương án dự phòng: **thay bằng chính `ff_*` / skin băng đổi màu** (cách game đang làm với ff_wolf), hoặc dùng `ghost` của Engvee/Craftpix nếu tìm được |
| `worm`, `cyclops`, `rock_golem` | Chưa có bản HD miễn phí xác nhận. Craftpix có [Cyclops](https://free-game-assets.itch.io/cyclops-2d-game-character-sprite-sheet) (pay-what-you-want từ $0,55, 128 MB, **chưa rõ có tay vẽ HD không**) | Có thể | craftpix: dùng thương mại được, không phân phối lại gói | Mở trang xem ảnh mẫu; nếu không đạt → giữ pixel art |
| `tu_linh_thuat_su` | [Dreamir Undead Pack](https://dreamir.itch.io/undead-pack) (có Necromancer, đủ idle/run/attack/death), [Robert Pinero Necromancer](https://robertpinero.itch.io/necromancer-sprites) (dùng được trong game miễn phí/thương mại; Pinero đã là nguồn `ff_*` nên đã có dòng ghi công) | Chưa biết độ phân giải | Dreamir: chưa rõ. Pinero: có | Xem ảnh mẫu từng gói; chọn gói có khung cao ≥ ~150px |
| Sói/ngựa (pets) | [Great Gaming Life – Wolf](https://greatgaminglife.itch.io/2dcharacterspritesheetwolf) (CC-BY 4.0, **bắt buộc ghi công**), [Dead Pixelsz Wolf](https://dead-pixelsz.itch.io/wolf) (giấy phép chưa rõ) | Pixel art | CC-BY / chưa rõ | Làm sau cùng; ngựa chưa tìm thấy ứng viên |

**Kết luận về nguồn:** chỉ **spider** có ứng viên rõ ràng (cùng tác giả, cùng tông, giấy phép thoáng). Ba hạng mục khác (ice_sprite, worm, rock_golem, cyclops) **chưa có bản thay thế miễn phí chắc chắn**; tôi không muốn hứa trước. Phương án thực tế cho chúng: giữ hình cũ nhưng giảm `s` (nhỏ lại trên màn hình) nếu bạn chấp nhận quái nhỏ hơn, hoặc thay bằng bộ ff_*/Engvee khác cho cùng vai trò (cùng tên quái, đổi `sprite:`).

## 4. Các bước thực hiện (sau khi bạn duyệt)

1. **Tạo bảng xem nhanh (contact sheet)** cho cả 60 bộ, mỗi bộ một ảnh idle ở đúng độ phóng thực tế, để *bạn* chọn bằng mắt bộ nào thật sự cần thay (số đo chỉ là gợi ý). Đồng thời đối chiếu **tên ↔ hình**: so `name`/`sprite` của từng quái trong `shared/data/monsters.js` với hình thật để phát hiện bộ sai tên (ví dụ thư mục `goblin` có đúng goblin không; `eye`, `reaper` vs `reaper_boss`, `mimic`, v.v.). Chưa đổi gì ở bước này.
2. **Chốt danh sách thay** (dự kiến: `spider`, `tu_linh_thuat_su` + 1–3 bộ khác nếu có gói đạt).
3. **Từng gói một:** mở trang gói → lưu giấy phép vào `assets_raw/<gói>/LICENSE` → *bạn xác nhận cho tải* → tải vào `assets_raw/` (thư mục riêng) → xem mẫu.
4. **Chuyển đổi:** dùng/viết tool trong `server/tools/` (theo mẫu `engvee-halberd.js`, `mob-sheets.js`) để ghép sheet về cấu trúc `public/assets/mobs/<tên>/{idle,run,attack,hit,death}.png`; giữ tổng ≤ ~300 KB/bộ quái.
5. **Đổi tên nếu đúng hình sai tên:** đổi thư mục + khóa trong `MOBS`/`CHARS` (`sprites.js`) + trường `sprite:` trong `monsters.js` + dòng `CREDITS.txt`; tìm toàn bộ tham chiếu bằng grep trước khi đổi để không vỡ.
6. **Cấu hình khung:** thêm/sửa dòng `fw, fh, cx, fy, s, bw, bh, anims` trong `sprites.js` sao cho độ phóng ≤ ~2×, hộp va chạm `bw/bh` giữ nguyên nếu có thể để không lệch cân bằng.
7. **Map (tùy chọn, rẻ):** chạy lại `bg-normalize.js` với hệ số cao hơn cho các map chính đang dùng; kiểm bộ nhớ trên điện thoại (ngân sách ≤ ~20MB/map). `bcn`/`brl`: nếu muốn thay hẳn thì tìm pixel art phóng 2× sẵn; chưa có ứng viên.
8. **Kiểm tra:** chạy game, vào từng map có quái đã đổi, xem idle/chạy/đánh/chết, lật hướng (`faceLeft`), neo chân (`fy`), thanh máu; commit từng nhóm nhỏ.
9. **Ghi công:** cập nhật `public/assets/CREDITS.txt` (và màn hình đăng nhập nếu tác giả bắt buộc, như Pinero, Digital Moons, Great Gaming Life CC-BY).

## 5. Rủi ro / điều cần bạn quyết

- **Lệch phong cách:** thay vài quái HD vào giữa dàn pixel art có thể trông lạc quẻ; bước 1 (xem bằng mắt) để chặn việc này.
- **Giấy phép:** itch.io "name your own price" nghĩa là tải được giá 0 nhưng phải đọc kỹ điều khoản; không rõ giấy phép → không dùng.
- **Tải file cần bạn đồng ý từng gói** (tên, nguồn, dung lượng); gói Engvee lớn (spritesheet 21–25 MB, frames 131–217 MB — chỉ cần spritesheet).
- **Quyết định cho bạn:** (a) mức nào coi là "kém" — chỉ nhóm rất kém (5 quái + necromancer) hay cả nhóm kém pixel art? (b) với quái chưa tìm được thay thế, chọn giữ hình cũ hay thu nhỏ `s`?

---

## 6. Cập nhật 11/11/2026: quyết định "thay cả nhóm rất kém và kém" (≈ 25 quái + Necromancer)

**Kết quả tìm thêm (4 đợt tìm web):** gói miễn phí **tay vẽ HD, nhìn ngang, có đủ idle/run/attack/hit/death** rất hiếm. Hầu hết gói tìm được là pixel art 32×32 hoặc 64×64 — *thay bằng chúng không làm hình nét hơn*, chỉ đổi kiểu. Vì vậy chia 3 cách xử lý:

### Cách A — Thay bằng gói HD mới (có ứng viên)
| Quái hiện tại | Ứng viên | Ghi chú |
|---|---|---|
| `spider` | [Engvee Spider](https://engvee.itch.io/free-2d-sideview-spider) | sheet cao 256–640px, dùng thương mại được; **bỏ qua** gói Frames nặng, chỉ tải Platformer_Spritesheets (21 MB) |
| `reaper`, `skull_wolf`, bộ xương/xác (nếu cần thêm) | [Engvee Skeleton](https://engvee.itch.io/free-2d-side-skeleton) | cùng tác giả/tông; có thể dùng cho `reaper` hoặc đổi vai quái bộ xương |
| `spearman`, `knight_silver`, `hero_knight`, `warrior` (lính người) | [Free Game Assets – Free Knight Sprite](https://free-game-assets.itch.io/free-knight-sprite) (3 bản: Halberdier / Spearman / Swordsman, vai quái được) hoặc [Free 2D Knight Sprite Sheets](https://free-game-assets.itch.io/free-2d-knight-sprite-sheets) | giấy phép craftpix (đã dùng trong game); **phải xem ảnh mẫu** xem HD hay chibi; 1 gói → 3 quái nhờ 3 bản + đổi màu |
| `ice_sprite` | [Elthen Ice Elemental](https://elthen.itch.io/ice-elemental) là chính bộ đang dùng (13px) → **không đổi nguồn**, xem Cách B | |
| `imp`, `axe_demon` | [Gilt – Bladed Demon](https://gi7t.itch.io/bladed-demon) (ghi dùng được dự án miễn phí/thương mại; **giá chưa rõ**) | cần mở trang kiểm tra giá/độ phân giải |
| `eye` | [Goncharov-Denis Eye Boss](https://goncharov-denis.itch.io/eye-boss-sprite) (ghi dùng tự do) hoặc [Floating Eye](https://epiconewon.itch.io/floating-eye-spritesheet) | cần xem độ phân giải |
| `tu_linh_thuat_su` | [Robert Pinero Necromancer](https://robertpinero.itch.io/necromancer-sprites) | đã có ghi công Pinero; cần xem khung cao |

### Cách B — Giữ hình, **làm mịn trước 2–4× ở tool** (không cần tải gì)
Game đã làm thế với `trieu_hoi_su` ("làm mịn 2× bằng Scale2x"). Phóng pixel art bằng thuật toán giữ biên (Scale2x/Scale3x/xBR) rồi mới đưa vào game cho hình sắc nét hơn hẳn việc để trình duyệt phóng mờ 3–14×. Áp dụng cho phần lớn nhóm kém đã nhất quán phong cách: `nightborne`, `mimic`, `tooth_walker`, `reaper_boss`, `stone_golem`, `ronin`, `huntress`, `goblin`, `fantasy_warrior`, `mushroom`, `witch`, `samurai`, `rock_golem`, `ice_sprite`, `worm`, `cyclops`. Rủi ro: tăng dung lượng (2× → ~4× số điểm ảnh; vẫn nhỏ vì sheet gốc 2–20 KB), và Scale2x làm pixel art "mềm" hơn, cần xem bằng mắt từng bộ.

### Cách C — Không có ứng viên, hoặc nên bỏ
`worm`, `cyclops`, `rock_golem`, `stone_golem`: chưa tìm được gói HD miễn phí; dùng Cách B. Gói pixel art khác (Elthen golem/mushroom/imp: pay-what-you-want từ $3, ô 32×32) **không** nét hơn nên không đề xuất.

### Thứ tự đề xuất
1. Cách B trước (miễn phí, không giấy phép, làm ngay được trên bản `public/assets/mobs/*`; giữ nguyên bản gốc ở `assets_raw/`).
2. Sau đó mới cân nhắc Cách A cho từng bộ *còn xấu sau khi làm mịn*: ưu tiên `spider` (Engvee), `tu_linh_thuat_su` (Pinero), 3 lính người (Free Knight).
3. Mỗi gói Cách A cần bạn đồng ý tải riêng (tên file, nguồn, dung lượng).

### 6.1 Kết quả kiểm tra gói HD (11/11/2026)
| Gói | Kết quả |
|---|---|
| Engvee Spider (spritesheet 21 MB) | **ĐẠT.** Đã tải, giải nén ở `assets_raw/engvee_spider/x/` (5 cỡ x256…x640; khung 256×144 ở x256). Hình 3D dựng sẵn, nét, đủ idle/walk/run/attack×4/hit/die×2. Dùng thương mại được (trang ghi). Chưa đưa vào game |
| Free Knight (Free Game Assets, 4,8 MB) | **LOẠI.** Đã tải xem mẫu rồi xóa: phong cách hoạt hình chibi, lệch tông game; trang không ghi giấy phép |
| Robert Pinero Necromancer | **LOẠI.** Giá tối thiểu **$15**, 317 MB |
| Gilt Bladed Demon | **LOẠI.** Giá tối thiểu **$5,25**, pixel art 16-bit |
| Goncharov-Denis Eye Boss | **LOẠI.** Pixel 64×64, không HD |
| Engvee Skeleton | Chưa tải (bản nhỏ 5,9 MB / 12 MB); chỉ cần nếu muốn thêm quái bộ xương HD |

**Kết luận:** trong nhóm cần thay chỉ `spider` có gói HD phù hợp. Phần còn lại (~24 quái + Necromancer) dùng Cách B (làm mịn pixel art) hoặc tìm thêm nguồn.

### 6.2 Tìm thêm nguồn miễn phí (11/11/2026, đợt 2) — chưa tải gì
Đã tìm lại ở itch.io, CraftPix, OpenGameArt. (itch.io chặn trình duyệt trong app bằng Cloudflare nên không xem được ảnh mẫu; chỉ đọc được mô tả.)

| Ứng viên | Giá / giấy phép | Cỡ / phong cách | Đánh giá |
|---|---|---|---|
| [Geravolva – Dark Fantasy Enemy #1](https://geravolva.itch.io/dark-fantasy-enemy-1-animations) | Miễn phí (name-your-price); dùng thương mại và chỉnh sửa được, **không** phân phối lại; ghi công không bắt buộc. 298 kB | **384×384**, pixel art tối; chưa rõ nhân vật là gì, góc nhìn, danh sách hoạt ảnh | **Đáng xem thử**: cỡ lớn gấp nhiều lần quái pixel hiện tại. Chưa biết có hợp tông / đủ hoạt ảnh |
| [Studioartistix – Melee Skeleton](https://studioartistix.itch.io/darkfantasy-melee-skeleton) | Name-your-price; **giấy phép không ghi** (có người hỏi, chưa trả lời). 5,2 MB | Phong cách tranh vẽ kiểu Darkest Dungeon; chỉ 4 hoạt ảnh (idle, attack, dodge, hurt), **không có chạy / chết** | Không đủ hoạt ảnh + giấy phép không rõ → không dùng |
| CraftPix Fantasy Orcs / Trolls (freebie) | Dùng không giới hạn dự án (theo trang) | Vector, 147 PNG, 7 hoạt ảnh (hurt, run, idle, jump, attack, walk, die) | Có thể, nhưng cùng hãng với gói Knight bị loại vì phong cách hoạt hình chibi; cần ảnh mẫu trước |
| Admurin – Golem Reinforced / Large | Dùng thương mại được, không bán lại gói, cấm huấn luyện AI | **64×64** pixel art | Không nét hơn bộ đang dùng → không đề xuất |
| Batareya – Golems & Elementals | Chỉ "Yes, sure" trong bình luận | 64×96, **tạo bằng Stable Diffusion** | Loại (nguồn AI + giấy phép không chính thức) |
| Elthen (Golem/Imp/Yeti/Cyclops…), Kalponic Golem 256×256 | Có phí ($3–$5 trở lên) | pixel art | Không miễn phí → loại |
| OpenGameArt: Red Horn Land Monster (CC0, vector), LPC Golem (CC-BY) | CC0 / CC-BY | vector / LPC pixel | Red Horn là 1 quái tĩnh, chưa rõ hoạt ảnh; LPC phong cách khác. Chưa đề xuất |

**Kết luận đợt 2:** chưa có gói nào chắc chắn thay được các quái còn lại. Duy nhất ứng viên đáng thử là **Geravolva Dark Fantasy Enemy #1 (384×384, 298 kB)**. Phần còn lại của nhóm "kém" vẫn nên dùng Cách B (làm mịn pixel art).

### 6.3 Đã tải Geravolva Dark Fantasy Enemy #1 (11/11/2026) + tìm thêm (dùng cá nhân)
- **Geravolva** (298 kB, ở `assets_raw/geravolva_enemy1/x/Spritesheets/`): nhân vật là **chiến binh cầm giáo dài** (áo đen, giáp nhẹ, dáng thấp), ô 384×384 nhưng thân chỉ cao ≈ 110px (giáo dài chiếm chỗ). Có Walk, Light/Heavy Attack, Magic, Jump, Stun (dùng làm hit), Death (ngã nằm), **không có idle riêng** (dùng khung đứng đầu mỗi sheet). Hợp làm thay `spearman` (Lính Giáo Hắc Nguyệt; hiện khung cao 43px). Cải thiện vừa phải (~2,5× cao hơn), tông tối, nét pixel sắc.
- **Dùng cá nhân (không thương mại)** mở thêm nguồn nhưng không thay đổi kết luận chính: gói HD chất lượng vẫn hiếm. Ứng viên mới: [Engvee Skeleton](https://engvee.itch.io/free-2d-side-skeleton) (25 hoạt ảnh gồm idle/run/death, sheet cao 384–480px, bản x384 12 MB / x240 5,9 MB; dùng được cho nhiều quái bộ xương HD), [CraftPix Free 2D Monster Sprites](https://craftpix.net/freebies/free-2d-monster-sprites/) (10 quái vector, walk/attack/hurt/jump/death, cần xem ảnh mẫu), Free Game Assets Enemy (chỉ cao 48px → không), Skyflakes Monster (64×64, có AI hỗ trợ → không).

### 6.4 Đã làm (11/11/2026)
- **`spearman` đã thay** bằng Geravolva (xem `server/tools/geravolva-spearman.js`, dòng cấu hình trong `sprites.js`, ghi công trong `CREDITS.txt`). Hình cao ≈ 60px logic, phóng ~1,65× (trước 4,1×). Thiếu idle riêng nên idle = Walk chạy chậm. **Chưa thử trong game.**
- **Engvee Skeleton đã tải** (x384p, 12 MB) vào `assets_raw/engvee_skeleton/x/x384p_Spritesheets/` (50 sheet, có bản Left/Right; Idle, Death, Impact, Attack…). Chưa gắn quái nào; có thể thay cho `reaper` hoặc thêm quái bộ xương.
- **Tìm thêm nhiều nguồn:** OpenGameArt (Golem animations CC-BY 3.0 hoạt hình; Knight CC0 — trang chặn đọc 403, cần xem ảnh mẫu bằng tay), itch "Free Mythic Monsters" (8-bit tĩnh → loại), Willosuna Pixel Monsters (32×32 → loại), CraftPix Free 2D Monster Sprites (vector, chưa xem mẫu), dodoillustra Hand-drawn Monster Pack (tranh vẽ tay 720×1280 nhưng **tĩnh, không hoạt ảnh**). Chưa có thêm gói đạt.

### 6.5 Báo cáo tiến độ (11/11/2026)
**Đã thay (3 bộ):** `spider` → Engvee Spider; `spearman` → Geravolva; `reaper` (Người Gác Lưu Trữ) → Engvee Skeleton, đổi tên bộ hình thành `skeleton_knight` (bộ `reaper` cũ đã xóa; `LOOK.reaper` trỏ sang `skeleton_knight`). Chưa thử trong game.

**Chưa tìm được bộ thay: 22 bộ hình quái = 23 quái, + 1 nhân vật (Necromancer).**
| Mức | Bộ hình | Quái dùng |
|---|---|---|
| Rất kém (3) | `ice_sprite`, `worm`, `rock_golem`, `cyclops` (4) | Người Tuyết; Ký Sinh Hư Không; Thạch Vương; Trùm Tinh Vân |
| Kém (18) | `eye` Mắt Đỏ · `mushroom` Nấm Độc · `goblin` Yêu Tinh · `ronin` Sát Thủ Bóng Tối · `samurai` Lam Sương ×2 · `skull_wolf` Sói Đầu Đàn · `stone_golem` Hộ Vệ Mây Đá · `mimic` Thủ Thư Vô Diện · `tooth_walker` Quái Hư Không · `hero_knight` Kỵ Sĩ Hư Không · `witch` Kẻ Đeo Mặt Nạ Trăng · `knight_silver` Tàn Dư Thiên Khôi · `nightborne` Hộ Vệ Thiên Khôi · `axe_demon` Hộ Vệ Long Mạch · `huntress` Tàn Dư Tinh Vân · `fantasy_warrior` Hộ Vệ Tinh Vân · `reaper_boss` Hộ Vệ Thần Mộng/Trùm Thần Mộng · `imp` Tàn Dư Sáng Thế | |
| Nhân vật (1) | `tu_linh_thuat_su` | Tử Linh Thuật Sư |

**Map:** 62 cảnh trong `map_scenes.js`; không có nền nào quá kém. Chỉ 3 map dùng nền pixel art thấp nhất (`bcn` ×2: map `lang`…; `brl` ×1: `lang_chai`, 1900×600, phóng 2,3–3,2×) **chưa tìm nguồn thay**; còn lại nền 810px (phóng 1,7–2,3×) chấp nhận được. Chưa tìm nguồn nền pixel art mới cho `bcn`/`brl`.

### 6.6 Đã làm mịn (11/11/2026, Cách B)
Tool `server/tools/smooth-sprites.js` (Scale2x/EPX có dung sai màu): ×4 cho `ice_sprite`, `worm`, `rock_golem`, `cyclops`; ×2 cho 18 bộ kém còn lại và `tu_linh_thuat_su`. Tự sửa `fw, fh, cx, cy, fy` (nhân hệ số), `s` (chia hệ số) và thêm `hd: true` trong `sprites.js`; kích thước hiển thị và hộp va chạm không đổi. Bản gốc lưu ở `assets_raw/pixel_orig/` (chạy lại không làm mịn chồng); hoàn nguyên bằng `git checkout public/assets public/js/art/sprites.js`.
Chưa thử trong game. Bộ nặng nhất sau làm mịn: `reaper_boss` ≈ 10,7 MB, `tu_linh_thuat_su` ≈ 10 MB giải nén. Cần xem bằng mắt các bộ: lưu ý `hd: true` đổi cách vẽ từ NEAREST (cạnh vuông) sang LINEAR (mượt).
