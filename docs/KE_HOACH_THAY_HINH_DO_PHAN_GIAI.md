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

### 6.7 Tìm thêm đợt 4 (11/11/2026) — chưa tải gì
Đã tìm ở itch.io, OpenGameArt, GameArt2D, GameDevMarket, DeviantArt, CraftPix và trang Engvee.
| Ứng viên | Thay cho | Giá / giấy phép | Ghi chú |
|---|---|---|---|
| [Engvee Medusa](https://engvee.itch.io/free-animated-sidefront-view-medusa) | `witch` (Kẻ Đeo Mặt Nạ Trăng) hoặc quái nữ | Miễn phí; dùng thương mại được | **Có bản nhìn ngang** (SideView_Spritesheets 4,4 MB); 9 hoạt ảnh (idle, attack, cast, hit, death). Cùng tác giả, hợp tông. Model 3D của Artcoding |
| [Engvee Ice Beast](https://engvee.itch.io/animated-isometric-ice-beast) | `ice_sprite` (Người Tuyết) hoặc `skull_wolf` | Miễn phí (name-your-price); trang không ghi giấy phép, có thẻ "No generative AI" | Quái băng, **16 hướng** (isometric) nên phải lấy hướng quay ngang làm bản nhìn ngang; 18 hoạt ảnh; sheet cao 180/256/320px; **bản nhẹ nhất ≈ 172 MB** |
| OpenGameArt Golem animations (CC-BY 3.0, hoạt hình), Ice Golem RPG sprite (rất nhỏ), DeviantArt Giant/Golem 144×144 (CC-BY 3.0, **tĩnh**) | golem | CC-BY | Không đạt (hoạt hình / tĩnh / quá nhỏ) |
| GameArt2D free (zombie, knight, ninja…), Karsiori City (CC0, ~250×158), VISTA najjar320 (CC0, 384×216), OGA Night City 576×324 | – | – | GameArt2D phong cách hoạt hình chibi; nền thành phố đều **nhỏ hơn** nền `bcn`/`brl` hiện tại (1900×600) → loại |
| Necromancer: Creativekind (đang dùng), Marco Brito (pixel thường), SPRITEARTS (không còn tải được), LPC (3/4, CC-BY-SA) | `tu_linh_thuat_su` | – | Không có bản HD miễn phí |
| Sói/werewolf: sovdigital Free Wolf (HD nhưng **top-down 8 hướng**), OGA Dog/Wolf (16×16), các gói còn lại có phí | `skull_wolf` | – | Không có sói nhìn ngang HD miễn phí |
| Samurai/ronin/knight: OGA Samurai Sprites (CC0, 48×48), itch Samurai 32×32… | `samurai`, `ronin` | – | Nhỏ hơn bộ hiện tại → loại |

### 6.8 Đợt tìm + tải một lần (11/11/2026)
Tìm ở itch.io, OpenGameArt, DeviantArt, CraftPix, GameDevMarket, GameArt2D, trang tác giả (Engvee, CSAF, Penusbmic, Ansimuz). itch.io chặn trang danh mục (403/429) nên chỉ đọc được từng trang gói. **Đã tải tất cả gói miễn phí đạt vào `assets_raw/_dl/`** (thư mục `_dl` không nằm trong git):
| Thư mục | Gói | Đánh giá sau khi xem mẫu | Dùng cho |
|---|---|---|---|
| `golem/` | Yudemgoy "Golem Full Sprite" (6,4 MB, giải nén từ .rar bằng WinRAR) | Vector HD, khung 512×512, đi/đánh×2/chết/idle; **phong cách hoạt hình phẳng** (sáng hơn tông game) | `rock_golem`, `stone_golem` |
| `werewolf/` | Free Game Assets "Free Werewolf" (3 bản đen/đỏ/trắng; giấy phép craftpix) | Pixel art ~130px, thiết kế tối đẹp; đủ idle/walk/run/attack×3/hurt/dead/jump | `skull_wolf` (Sói Đầu Đàn), `mushroom`? không |
| `icebeast/` | Engvee Ice Beast (đã trích riêng 16 hướng 090/270 ở 256p, bỏ phần còn lại) | Quái băng 3D hầm hố, **góc nhìn xiên isometric và có bóng đổ xám dính sẵn** → cần xử lý bóng; 18 hoạt ảnh | `ice_sprite` (Người Tuyết) |
| `medusa/` | Engvee Medusa (SideView 256/320/360p) | Bản nhìn ngang đẹp, 9 hoạt ảnh; **thân trên để trần** (3D) | `witch` — bạn quyết định có dùng không |
| `dungeonenemy1/` | Penusbmic Dungeon Enemy Pack 1 (Barrel Knight, Slime, Archer) | Pixel art **rất nhỏ** (cung thủ vài chục px) | không dùng |
| `deepwarren_sampler/` | CSAF Deepwarren Sampler (chuột 160px, dơi 176px; dùng tự do) | Pixel HD, 4 hướng; chuột/dơi — game đã có `ff_rat`, `ff_bat` | dự phòng |
| `ansimuz/` | Ansimuz Legacy Collection (20 MB, 40+ nhân vật 16-bit, miễn phí thương mại) | Chưa xem cỡ; có demon, hell beast, hell hound, flying-eye-demon, death, ghost, nightmare… | có thể thay `imp`, `eye`, `axe_demon`, `skull_wolf` nếu đủ lớn |
Đã bỏ: Wraith của CloneWards (ảnh có nền/nhãn, 8 hướng top-down), Deepwarren Side bản đầy đủ (có phí $8,99; bản demo xương 224px không có trên trang tải).

### 6.9 Tải hết các gói miễn phí còn lại (11/11/2026)
Đã tải vào `assets_raw/_dl/<tên>/` (giải nén ở `x/`; thư mục không nằm trong git). Bỏ qua file >60 MB (Sov Wolf 409 MB top-down; frames HQ của Engvee Crab) và xóa gói Engvee Crab (game đã có `ff_crab`).
| Thư mục | Nội dung thực tế | Đánh giá |
|---|---|---|
| `ansimuz/` (đã tải trước, nay đã khảo sát cỡ) | Gothicvania: **Ogre 80–240px**, **demon 96–220px**, Hell-Beast ~160px, Terrible Knight, Death 96px, Nightmare 96px, Fire-Skull 112px, Ghost 80px, WereWolf 76px, Hell-Hound 48px, flying-eye-demon 48px, mutant-toad 64px… | **Nguồn tốt nhất còn lại**, pixel 16-bit lớn hơn nhiều bộ hiện tại (ví dụ `imp` 35px, `cyclops` 45px). Hợp: Ogre → `cyclops`; demon → `axe_demon`/`imp`; Terrible Knight → `knight_silver`/`hero_knight`; Death → `reaper_boss`; Hell-Beast/Hell-Hound → `skull_wolf`. Dùng thương mại được (trang ghi) |
| `marco_necromancer/` | Necromancer 1024×1536/ô, **8 hướng kiểu RPG top-down, nhìn giống AI vẽ** (pixel nhòe) | Loại (không nhìn ngang) |
| `penusbmic_skeleton/`, `penusbmic_monsterpack1/`, `penusbmic_dark_hero/` | Pixel 46–48px, vài sheet 384px của Monster Pack I | Nhỏ; Monster Pack I đã là nguồn `tooth_walker` |
| `oliveiramiro_enemies/` | 7 quái 64×64 (slime, minotaur, mage, golem, goblin, winged eye, elf) | Cỡ ngang bộ hiện tại, không cải thiện |
| `monopixel_forest/`, `skyflakes_monster/`, `fga_enemies/`, `karsiori_city/`, `najjar_vista/`, `tehemlo_ghost/`, `originum_wraith/`, `kibbitz_knight/`, `creativekind_necro/`, `deadpixelsz_wolf/` | 48–128px hoặc nền 384×216 / 250×158; ghost 96×256 | Không đạt hoặc nhỏ hơn nền `bcn`/`brl` |

### 6.10 Đã gắn (11/11/2026) — Ansimuz + Werewolf + Golem
Tool `server/tools/import-frames.js` (tự thay dòng cấu hình trong `sprites.js`, căn đáy-giữa; chạy lại được). Đã thay: `cyclops` ← Ogre (Ansimuz, ×2 làm mịn), `axe_demon` ← Demon (Ansimuz, ×2), `skull_wolf` ← Werewolf trắng (×2), `rock_golem` ← Golem Yudemgoy (vector HD, thu 0,75×). `stone_golem` (Hộ Vệ Mây Đá) **dùng chung hình `rock_golem` với màu phủ xanh xám** (`tint: 0xb4c6e0` trong `monsters.js`); bộ `stone_golem` cũ đã xóa. Ogre / Demon thiếu hit và chết → dùng khung đứng + `fakeDeath: true` (game tự cho ngã); demon cỡ khung lớn (358×322 sau làm mịn, ≈14 MB giải nén). Giấy phép Golem không ghi trên trang (dùng cá nhân). **Chưa thử trong game.**
**Còn lại chưa thay:** `ice_sprite` (Ice Beast đã tải nhưng cần xử lý bóng/góc nhìn), `worm`, và các quái kém khác; Necromancer; 3 map nền pixel.

### 6.11 Đợt cuối (11/11/2026): Ice Beast + tìm thêm
- **`ice_sprite` → `ice_beast`** (đổi tên vì hình mới là quái băng 3D, không còn là "ice sprite"): Engvee Ice Beast, hướng nhìn ngang 090 ở 256p, bỏ bóng đổ xám bằng lọc pixel gần đen bán trong suốt; cao ≈ 78px logic. Đổi trong `sprites.js`, `monsters.js` (Người Tuyết, bỏ `tint` cũ), `smooth-sprites.js`, `CREDITS.txt`; bộ `ice_sprite` cũ đã xóa. Trang gói không ghi giấy phép → chỉ dùng cá nhân.
- **Đã tìm thêm, không có gói đạt cho:** `mimic`, `huntress`, `goblin`, `mushroom`, `nightborne`, `imp`, `witch`, `worm`, `hero_knight`, `knight_silver`, `ronin`, `samurai`, `reaper_boss`, `tooth_walker`, `eye`, `fantasy_warrior`. Các gói tìm được hoặc có phí (Elthen, Creativekind Fire Elemental…), hoặc nhỏ (32–70px), hoặc phong cách hoạt hình vector (OpenGameArt Worm Bevouliin, Golem, Knights; Free Game Assets Knight). TTMini Wizard (128px) có phí 3,49 đô. Engvee "Free sideview collection" chỉ có 5 nhân vật đã dùng (Knight Girl/Man, Thief, Insect, Fox). Các bộ này giữ bản đã làm mịn (Cách B).
- Kiểm tra tên ↔ hình: đã xem `worm`, `tooth_walker`, `imp`, `witch`, `goblin`, `eye`, `cyclops` — không có bộ nào sai tên rõ ràng ngoài `ice_sprite`.

### 6.12 NPC (11/11/2026)
**Hiện trạng:** 11 NPC trong `shared/data/npcs.js`; **toàn bộ vẽ bằng code** (Phaser Graphics) rồi hiển thị ở 40×60 px logic (texture 80×120, `HD_KEYS` trong `art.js`) → phóng ~1,5× lên màn hình nên mờ. 5 NPC dùng chung bộ vẽ "thợ săn" trong `characters.js` (`lao_su`, `tho_ren`, `ba_thuoc`, `tap_hoa`, `thu_kho`); 5 vẽ riêng trong `fx.js` (`lu_khach`, `he_thong`, `vy`, `lam_suong`, `bang_nv`); `npc_an` (Người Gác Màn, ẩn) vẽ trong `map.js`. NPC chỉ đứng yên + nhún nhẹ (không cần hoạt ảnh).
**Đã tải vào `assets_raw/_dl/npc/`:**
| Gói | Đánh giá | Dùng cho |
|---|---|---|
| **CSAF Hearthhands Sampler** (1,8 MB; dùng tự do, không ghi công) | Pixel art thực tế, **nhìn ngang, ô 200×200, thân cao ≈110px**, 4 hướng; 6 dân làng: nông dân, người bán cá (mũ đỏ + xô), người rao tin (áo dài đỏ, mũ ba góc), cô bé, người cào muối, bí ngô | Tốt nhất: `lao_su` (người rao tin áo đỏ), `tap_hoa` (người bán cá), `thu_kho` (nông dân / cào muối). Không có thợ rèn, nữ, thuốc sư |
| Free Game Assets Free NPC Pack (112 MB: Blacksmith, Jeweler, Sage, Warlord) | Vector **chibi hoạt hình** 700×700 | Lệch tông → loại |
| Nightsparrow VN Sprite Set (shopkeeper nữ, merchant, maid; CC-BY 4.0, ghi công bắt buộc) | Nửa người kiểu anime visual novel 583×1100 | Không hợp đứng trên map → loại |
| Penzilla Hooded Protagonist, FartFish Hooded Figure | Pixel nhỏ, có người trùm đầu | Có thể cho `lu_khach` (chưa xem kỹ) |
| Franuka, Tiny Questers, Larchrow, Kiddolink, Fexu Blacksmith | 16–64px top-down hoặc chân dung phác họa | Nhỏ hơn bản vẽ code hiện tại → loại |
**Chưa có ảnh cho:** `tho_ren` (thợ rèn), `ba_thuoc` (nữ), `vy`, `lam_suong`; `he_thong`, `bang_nv`, `npc_an` là vật thể / hiệu ứng nên giữ vẽ code (hoặc làm lại bằng code nét hơn).

### 6.13 NPC đã làm (11/11/2026)
- **Ảnh thật** cho `lao_su` (người rao tin áo đỏ), `tap_hoa` (người bán cá), `thu_kho` (nông dân), từ CSAF Hearthhands (`server/tools/npc-images.js` → `public/assets/npcs/<id>.png`, làm mịn Scale2x). Nối vào game: `world.js` nạp ảnh trước `Art.makeAll`; `Art.registerImage` (art.js) khai báo chiều cao hiển thị (`NPC_IMAGES` trong characters.js, 62–64px logic) để `artImage` thu về đúng cỡ. Ảnh không tải được thì tự quay về hình vẽ code.
- **Vẽ lại độ nét cao** cho NPC còn lại: mọi texture `npc_*` vẽ ở hệ số 4 (`NPC_HD = 4` trong art.js; trước là 2) → đã kiểm tra bằng trang thử Phaser: nét hẳn. Người Gác Màn (`npc_an`) trước là hình chữ nhật + biểu tượng ☠; nay là bóng áo choàng tím trùm đầu vẽ code (`npc_npc_an` trong fx.js), lơ lửng nhẹ (map.js).
- Chưa chạy game thật (máy chưa kết nối được PostgreSQL) — đã kiểm tra bằng trang thử riêng, không có lỗi JS.
