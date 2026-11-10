# Kế hoạch: nền bản đồ — mỗi map một diện mạo (bản 2, ít rủi ro)

*Cập nhật sau khi rà soát. Nguyên tắc: **làm từng giai đoạn, giai đoạn sau chỉ làm khi giai đoạn trước đã duyệt bằng mắt**; mọi thay đổi đều có đường lui về hành vi cũ.*

## 1. Mục tiêu và thay đổi so với bản 1

- Mỗi map nhận ra được bằng mắt: tông màu + khí quyển + (sau này) nền ảnh riêng.
- Nét, đẹp trên màn hình độ phân giải cao; không làm chậm game, nhất là điện thoại.
- **Tách 3 việc rủi ro khác nhau** (bản 1 gộp chung):

| Giai đoạn | Nội dung | Rủi ro | Trạng thái |
|---|---|---|---|
| **A1** | Tông màu + hạt sáng + thời tiết riêng từng map (chỉ code, không cần ảnh) | Rất thấp | **Đã làm** (mục 3) |
| **A2** | Nền parallax bằng ảnh từ pack miễn phí, thay lớp nền vẽ code | Trung bình (giấy phép, phong cách, bộ nhớ) | Chờ pilot 1 map (mục 4) |
| **B** | Thay cảnh trí gần (cây, nhà, đèn…) bằng sprite ảnh | **Cao** (lệch phong cách) | Chỉ làm nếu A2 thành công |
| **C** | Hoạt ảnh cảnh trí (cỏ lay, đèn lắc…), biến thể ô đất | Thấp, độc lập | Làm được cả với hình code hiện tại |

Lý do tách: A1 đã cho phần lớn hiệu quả "map nào ra map đó" mà không phụ thuộc vào việc tìm pack. 19/33 map trong bản 1 dựa vào pack chưa tìm thấy, nên không thể đặt cả kế hoạch lên đó.

## 2. Hiện trạng kỹ thuật (đã đối chiếu code)

- 32 bản đồ (không phải 33) trong `shared/data/maps.js`, chỉ 4 theme: city / forest / cave / redgate — nên trước đây nhiều map trông giống nhau.
- Nền 4 lớp vẽ code `public/js/art/backgrounds.js`, xếp bằng tileSprite trong `buildBackground` (`public/js/scene/map.js`), parallax sẵn.
- Khung logic cao 540, canvas vẽ ở k = 2.5–3.5× (`View`, `juice.js`); điện thoại bị giới hạn tổng điểm ảnh (iPhone 2,6 triệu).
- Thiếu ảnh → hình vẽ code (`loaderror` ở `world.js`). Server tự gộp script trong `index.html` thành một file (`server/static.js`), nên thêm file mới chỉ cần thêm thẻ script.

## 3. Giai đoạn A1 — đã triển khai

- **File mới** `public/js/scene/map_looks.js`: bảng `MapLooks` — mặc định theo theme (đúng giá trị cũ) + 32 dòng riêng từng map gồm `haze` (sương sát nền), `grade` (ánh sáng phủ), `mote` / `moteN` (hạt sáng), `bg` (màu nền camera), `weather` (`rain` / `fog` / `snow` / `ember` / `none`), `fog` (màu sương).
- `buildBackground` (`map.js`) đọc từ `this.look` thay cho 3 bảng theo theme; `setupWeather` (`juice.js`) chọn thời tiết theo `look.weather`, **thêm tuyết** (`fx_snow`).
- **An toàn**: map nào không khai báo trường nào thì giữ đúng giá trị cũ của theme; chế độ đồ họa Thấp vẫn tắt sương/hạt/thời tiết như trước; không đụng logic ô đất, va chạm, NPC, cổng.
- Chỉnh tông chỉ là sửa số trong một file dữ liệu — dễ duyệt, dễ hoàn tác (`git checkout` file đó).

**Cần xem bằng mắt**: vào lần lượt các map, chỉnh màu `MAPS` nếu chưa ưng. Màu `grade` là *nhân màu* nên giữ sáng (đừng xuống quá tối).

## 4. Giai đoạn A2 — nền ảnh (làm sau khi duyệt A1)

### 4.1 Cổng quyết định (làm trước khi tải hàng loạt)
1. **Pilot 1 map** (Rừng Sương, Ansimuz Parallax Forest hoặc Admurin): tải 1 pack, chuẩn hóa, gắn vào đúng 1 map, xem trên máy tính + điện thoại.
2. Chỉ khi pilot **đẹp, đúng tông với nhân vật/quái/ô đất hiện có**, mới tải các pack còn lại. Không đạt → dừng ở A1, chi phí gần như bằng 0.
3. **Tải file cần người dùng đồng ý từng pack** (tên file, nguồn, dung lượng); nhiều pack itch.io phải tải bằng tay qua trình duyệt.

### 4.2 Giấy phép (kiểm trước khi tải)
- Mỗi pack: đọc giấy phép, **lưu file/ảnh chụp trang giấy phép vào `assets_raw/<pack>/LICENSE`**; xác nhận được dùng thương mại và được phát qua web trong game.
- Ưu tiên CC0 (Kenney, OpenGameArt CC0). Pack ghi công bắt buộc → `CREDITS.txt` (+ màn hình đăng nhập nếu yêu cầu).
- Không rõ giấy phép → không dùng.

### 4.3 Quy cách ảnh (đã sửa mâu thuẫn bản 1)
- Game vẽ ở k = 2.5–3.5× lên khung 540, nên **không thể giữ NEAREST ở mọi tỉ lệ**. Quy ước mới:
  - **Nền xa (sky/far/mid/near)**: lọc **LINEAR**; pixel art phóng trước 3–4× bằng NEAREST ở tool rồi để LINEAR làm mượt phần dư (tránh pixel to nhỏ không đều).
  - **Props/ô đất pixel art**: chỉ dùng khi ô gốc 32×32 (hoặc 16×16 phóng đúng 2×); thử ở các k thực tế trước khi chốt.
- Ảnh nguồn nền tối thiểu cao 270px (pixel art) hoặc 1080px (HD); nhỏ hơn thì duyệt bằng mắt.
- **Gộp lớp**: pack 5–8 lớp phải gộp về 4 lớp của game (sky / far / mid / near). Tool bắt buộc có bước gộp + cấu hình lớp nào vào đâu + căn lề dọc (nền cao 1080 so với khung 540).
- Seamless ngang: tool kiểm cột đầu–cuối, lệch thì vá hoặc loại pack. **Phải thử thực tế tileSprite với texture không phải lũy thừa của 2 có lặp đúng không** (một số trình duyệt/WebGL1 cần POT).

### 4.4 Ngân sách bộ nhớ (không chỉ dung lượng file)
- Một lớp 1440×810 RGBA giải nén ≈ 4,6MB GPU; pack 8 lớp ≈ 37MB/map — nặng trên iPhone.
- Quy tắc: tối đa **4 lớp ảnh/map**, mỗi lớp ≤ ~250KB file; ưu tiên **WebP** (nhỏ hơn PNG); **gỡ texture khi rời map** (`textures.remove`); ngân sách GPU nền ≤ ~20MB/map.
- Tải lazy theo map; **prefetch ngầm map kế cận qua cổng** + màn hình chờ nếu chưa tải xong. Tên file kèm phiên bản/hash để cache không giữ ảnh cũ.

### 4.5 Quy trình
1. `assets_raw/bg/<pack>/` giữ nguyên gói gốc + LICENSE.
2. Tool `server/tools/bg-normalize.js` (mẫu `mob-sheets.js`): cắt/gộp lớp, kiểm seamless, phóng nguyên bội, nén, in báo cáo dung lượng, xuất `public/assets/bg/<pack>/{sky,far,mid,near}.webp`.
3. Contact sheet cho người dùng duyệt từng pack **trước khi** vào game.
4. Gắn vào game: thêm `pack` vào dòng map trong `MapLooks`; `world.js preload` nạp ảnh của map hiện tại (thất bại → nền code, đã có sẵn cơ chế); `buildBackground` dùng ảnh nếu texture tồn tại. Có cờ bật/tắt toàn cục (`MapLooks.useImages`) để rollback nhanh.

### 4.6 Phân pack (dự kiến, chốt sau pilot)
Nhóm đã có nguồn rõ: rừng/bến phà/đầm lầy/làng chài/chân núi → Admurin Plains / Dead Forest / Dock / Snowy Mountains + Ansimuz Parallax Forest; hang → Admurin Caves; Tân Đô → LyniaDesign Tiny Pixel Japan. Các nhóm hang 2–3, thành phố đá, dị giới (hell/void/cosmic) **chưa có nguồn xác nhận**: tìm ở itch.io / OpenGameArt / Craftpix; không tìm được pack đạt thì **giữ nền code + A1**, không ép dùng pack lệch tông. Chấp nhận nhiều map dùng chung một pack khác nhau về tint/thời tiết (A1).

## 5. Giai đoạn B và C (sau A2)

- **B — props ảnh**: chỉ làm nếu pilot cho thấy phong cách ảnh hợp. Làm từng nhóm map; bảng `PROPS[look]` thay `d_tree/d_shop/d_lamp/d_crystal…`, thiếu sprite thì giữ hình code. Giữ tọa độ ô → va chạm/NPC/cổng không đổi. Kenney (cartoon phẳng) chỉ dùng nếu hợp tông.
- **C — hoạt ảnh & ô đất** (độc lập): đèn lồng lắc, tinh thể nhấp nháy, lá rơi quanh cây, khói; thêm bảng màu ô đất `snow/swamp/dock/hell/void` (chỉ màu, `terrain.js`) và 2–3 frame đỉnh ngẫu nhiên. Cả hai làm được với hình code hiện tại.

## 6. Nghiệm thu từng map

1. Khác biệt: đặt cạnh map cùng theme — nhận ra ngay.
2. Nét: zoom chế độ Cao trên màn DPR 2–3; ảnh/nền không bệt.
3. Seamless: đi hết chiều ngang map, không thấy đường nối (với nền ảnh).
4. Đọc được gameplay: ô đất đi được, nhân vật, quái nổi rõ trên nền; props không bị nhầm với vật thể va chạm; thời tiết không che tầm nhìn.
5. Hiệu năng: **đo FPS và bộ nhớ trước/sau cùng một chỗ** (baseline ghi trước khi làm A2); điện thoại không giật, chế độ Thấp không hiện hiệu ứng.
6. Giấy phép + CREDITS đầy đủ (với nền ảnh).

## 7. Rủi ro còn lại

| Rủi ro | Xử lý |
|---|---|
| Pack ảnh lệch phong cách với nhân vật/quái | Pilot 1 map làm cổng quyết định; không đạt thì dừng ở A1 |
| Không tìm đủ pack cho hang/dị giới | Giữ nền code + A1; không ép |
| Giấy phép | Lưu LICENSE từng pack; không rõ thì bỏ |
| Hết bộ nhớ trên iPhone | ≤4 lớp/map, WebP, gỡ texture khi rời map, đo trước/sau |
| Hiệu ứng thời tiết nặng trên mobile | Số hạt giới hạn; chế độ Thấp tắt hẳn |
| Mất đồng bộ khi cập nhật ảnh | Tên file có hash/phiên bản |

---

## 8. Cập nhật: công thức nền cho mọi map (đã triển khai)

Mỗi map có **công thức nền riêng** trong [map_scenes.js](../public/js/scene/map_scenes.js): chọn từng lớp (`sky | far | mid | near`) từ **bất kỳ bộ ảnh HD nào** đã có, kèm chỉnh màu lúc vào map. Không cần tải thêm ảnh cho mỗi map mới.

Bộ ảnh HD hiện có (`public/assets/bg/`): `misty` (rừng sương), `night` (trời đêm trăng + mây + núi), `sunset` (hoàng hôn núi + rừng thông + đồng cỏ), `space1..4` (trời sao, chỉ lớp sky), và 16 bộ vector Craftpix: `uw1..4` (dưới nước: phế tích, rạn, hang xương + tinh thể, nước sâu), `hal1..4` (nhà ma, rừng nhện đỏ, nghĩa địa trăng khuyết, phòng lò sưởi), `fai1..4` (rừng tre thác nước, rừng tím bướm, cây chết trên nước, rừng nấm), `bch1..4` (biển nắng, đảo thuyền, quán biển, hoàng hôn). Các bộ `hal4`, `fai4`, `uw4`, `bch1`, `bch3` chưa gán map nào, dành cho map mới.

Cú pháp:

```js
ten_map_moi: {
  all: { hue: -40, lum: 0.8 },                       // áp cho cả 4 lớp (tùy chọn)
  sky: { src: 'space2', gamma: 1.9 },               // 'bộ' hoặc 'bộ/lớp'
  far: { src: 'night/mid', hue: 60, flip: true },
  mid: 'misty/mid',                                  // chuỗi = lấy nguyên, không chỉnh
  near: { src: 'sunset/near', sat: 0.5 },
}
```

Tham số chỉnh màu: `hue` (xoay màu, độ), `sat` (bão hòa), `lum` (độ sáng), `gamma` (>1 nâng vùng tối), `tint` (0xRRGGBB nhân màu), `mix: [0xRRGGBB, 0..1]` (trộn về một màu), `flip` (lật gương). Lớp không khai báo → dùng hình vẽ code của theme (phố, hang…).

**Thêm map mới**: (1) thêm map vào `shared/data/maps.js`, (2) thêm một dòng vào `MapLooks.MAPS` (haze/grade/mote/weather) trong `map_looks.js`, (3) thêm công thức vào `map_scenes.js`. Muốn đổi bố cục thật sự (không chỉ đổi màu), thêm bộ ảnh HD mới bằng `server/tools/bg-normalize.js` rồi khai báo trong `MapLooks.PACKS`.

Trang xem trước tất cả nền (cùng mã với game): xem `scratchpad/harness2` trong phiên làm việc; có thể dựng lại bằng một trang HTML nạp `map_scenes.js` + `map_looks.js` và gọi `MapLooks.layerDefs` / `MapLooks.gradeCanvas`.

**Giới hạn đã biết**: hiện chỉ có 3 bố cục nền HD đầy đủ (rừng thân cây, núi đêm, hoàng hôn) + 4 trời sao; các map khác nhau chủ yếu bằng ghép lớp và màu. Muốn nhiều bố cục khác hẳn (hang thật sự, thành phố, bến, đầm) cần thêm bộ ảnh HD có giấy phép rõ ràng (miễn phí hoặc mua).

**Đợt 2 (đã thêm)**: `win1..4` (Winter Holiday), `cfr1..4` (Cartoon Forest 4K), `des1..4` (Desert), `elv2..4` (Elven Land), `hor1,3,4` (Horizontal). Chưa gán map: `win4`, `cfr1..3`, `des2`, `des4`, `hor3`, `hor4` — dành cho map mới. Bộ Elven có mảng sàn phẳng lớn (đã tối bớt khi dùng); `hor2`/`elv1` chưa ghép (cần dò thứ tự lớp bằng thử hoán vị).

**Đợt 3 (đã thêm)**: `vamp1..4` (Craftpix Vampire Battle 4K, ảnh tổng hợp cố định, lớp far/mid/near rỗng), `bcn` (thành phố đêm), `brl` (đồng quê) của Bongseng (pixel art, lọc NEAREST). Chưa gán: `vamp1`, `brl` dùng cho Làng Chài; thành phố đổ nát (`bcd`) bị bỏ vì ghép lớp lỗi. Tân Đô dùng `bcn`; Tân Đô Bầu Trời Rách là `bcn` xoay sang đỏ cháy.

**Đợt 4 (đã thêm) – cảnh tĩnh `lr_*`**: 18 ảnh trong bộ Lornn (tranh AI vẽ lại, dùng thương mại được) làm cảnh tĩnh qua `still('lr_xxx')` trong `map_scenes.js`: ảnh phủ kín bề ngang, ghép gương lúc chạy cho cuộn lặp, lớp sky/mid/near rỗng (`blank`). Còn ~60 ảnh nữa trong `assets_raw/bg/lornn_dungeons` (12 hang, 22 tàn tích, 8 điện thờ, 7 cầu thang, 30 hầm) cho map mới: chạy `powershell -File server/tools/bg-sky-jpg.ps1 -Src <ảnh> -Pack lr_<tên> -Width 1215 -Quality 90 -Layer far` rồi thêm tên vào danh sách `lr_` trong `map_looks.js`. Cũng đã tải nhưng CHƯA dùng: `outlander_ruins` (4 tàn tích AI, CC0), `gleolite_crystalmoon` (6 lớp vector 1920×1080).

---

## 9. Cảnh trí, ô đất, hoạt ảnh (giai đoạn B/C – đã triển khai)

- **Biến thể ô đất** (`MapDecor[map].tile` trong `map_scenes.js`): 13 biến thể (snow sand redsand stone gold ash wet purple void voidg swamp pink teal) tạo lúc vào map bằng chỉnh màu từ ô đất gốc (`MapLooks.TILE_VARIANTS`), không thêm ảnh.
- **Cảnh trí ảnh**: `server/tools/props-extract.js` cắt vật thể rời từ các lớp nền Craftpix thành `public/assets/props/<bộ>/` (cactus, pine, palm, hands, stal, vine, rock; danh sách sinh ra `map_props_data.js`). `MapDecor` chọn bộ cho cây `tree` (&), nhũ đá trần `ceil` (^ dưới trần), vật trên nền `floor` (^), đá/cỏ rải `bits`, và `tint` để hợp tông nền. `ceil: 'none'` bỏ nhũ đá ở map ngoài trời.
- **Hoạt ảnh**: cảnh trí ảnh (tree/floor) lay nhẹ quanh gốc (`sway: false` để tắt; đồ họa Thấp bỏ qua).
- **Chưa tốt**: bộ `pine` (tam giác phẳng tối) và `palm` (cọ đen) lạc điệu với nền nên đang không dùng cho map nào; mới xem trong game một phần map (Chân Núi, Hang Pha Lê, Hắc Nguyệt). Bộ `sunset` (oleekconder, giấy phép chưa rõ) đã gỡ; Quảng Trường dùng ảnh Lornn.

