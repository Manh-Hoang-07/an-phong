# Kế hoạch app iOS/Android cho Thức Tỉnh (an-phong)

Nov 22, 2026 · @Hoang

## Tổng quan

Giữ nguyên server, viết lại phần client bằng Godot 4 cho iOS và Android; bản web cũ vẫn chạy chung server, chung tài khoản và nhân vật.

- **Mục tiêu:** app đẹp và mượt hơn web, giao diện thiết kế riêng cho điện thoại (không theo bản web), ảnh và âm thanh đóng sẵn trong app (không tải qua mạng), web và app chơi chung một thế giới.
- **Công nghệ client:** Godot 4 với GDScript. Miễn phí, mạnh về 2D, một project xuất ra được cả iOS và Android.
- **Giữ nguyên:** server Node.js, PostgreSQL, WebSocket `/ws`, các API `/api/*`, trang admin và bản web.
- **Chi phí:** Game chỉ chơi nội bộ với đồng nghiệp, server trên VPS đã có HTTPS; Android miễn phí; iPhone miễn phí nếu ký bằng Apple ID thường hoặc chơi bản web, 99 USD/năm nếu dùng TestFlight. Với khoảng 50 người chơi, cách cài cho iPhone cần chốt lại (xem phần Phân phối).
- **Làm trước, song song:** đo và sửa lag của bản web (Lộ trình, giai đoạn 0), vì web vẫn là bản chơi chính trong lúc app chưa xong.

**Chi tiết từng phần** nằm ở các tab riêng; bắt đầu từ tab Việc cần làm: Việc cần làm · Cấu trúc thư mục · Giao thức server · Giao diện mobile · Nguồn hình ảnh và âm thanh · Hiệu ứng kỹ năng · Danh sách kỹ năng · Build và phát hành

## Kiến trúc tổng thể

&#91;embedded content: kiến trúc · 2 client, 1 server\]

Web và app cùng gọi một server qua HTTP và WebSocket, nên chung tài khoản, nhân vật và thế giới; chỉ phần client là làm mới.

## Việc cần sửa ở web/server

Web chỉ cần sửa ít: thêm xác thực bằng token, số phiên bản giao thức, xuất dữ liệu game ra JSON và viết tài liệu giao thức; HTTP và WebSocket hiện có giữ nguyên.

1. **Xác thực bằng token.** Hiện `/api/login` và `/api/register` đặt cookie `ap_session` (HttpOnly, SameSite=Strict) và không trả token trong nội dung. App Godot vẫn đọc được header `Set-Cookie` rồi gửi lại nên chạy được ngay, nhưng sạch hơn là trả thêm `token` trong JSON và nhận `Authorization: Bearer` ở cả HTTP lẫn lúc bắt tay WebSocket.
2. **Kiểm tra Origin của WebSocket.** Server từ chối khi header `Origin` có mà khác host. App Godot không gửi Origin nên qua được, không cần sửa. Chỉ khi phải dùng phương án dự phòng Capacitor (xem Lộ trình) mới cần cho phép thêm `capacitor://localhost`.
3. **Số phiên bản giao thức.** Chưa thấy cơ chế này. Thêm `GET /api/version` trả `{proto, minClient, dataHash}` và để client gửi `proto` khi vào, để chặn bản app quá cũ thay vì chạy sai.
4. **Xuất dữ liệu game ra JSON.** `shared/` (vật phẩm, kỹ năng, nhiệm vụ, NPC, quái, bản đồ `.txt`) đang nạp bằng `require` và thẻ `<script>`. Viết `server/tools/export-gamedata.js` ghi ra `gamedata.json` kèm hash; app đóng sẵn file này và so hash khi vào game.
5. **Công thức dùng chung.** Các hàm như `interp`, `mitigate`, `expToNext` trong `shared/core.js` phải port sang GDScript để app hiển thị chỉ số đúng. Server vẫn là nơi tính thật; thêm bộ test so kết quả hai bên trên vài giá trị mẫu để không bị lệch.
6. **Di chuyển và đòn đánh do client báo.** Client gửi `pos`, `cast`, `hit`. `pos` chỉ dùng để hiển thị cho người khác, server không từ chối vị trí. Server chỉ chặn đòn đánh bằng khoảng cách tới quái (≤1100 ngang, ≤700 dọc), trần sát thương và ngân sách tốc độ (`onHit`, `onCast` trong `server/realtime/index.js`). App phải tính sát thương đúng công thức web và gửi đúng nhịp; các ngưỡng đã ghi trong tab Giao thức server.
7. **Tài liệu giao thức `docs/protocol.md`.** Chốt danh sách tin nhắn và định dạng từng tin (bảng dưới là bản quét nhanh từ mã nguồn, cần rà lại khi viết).
8. **HTTPS/WSS.** Đã có: VPS chạy HTTPS. Cần kiểm lại trên VPS: block 443 của Nginx có `location /ws` kèm `Upgrade` và `Connection "upgrade"` (mẫu trong `deploy/nginx-anphong.conf` đang để dạng comment), và đã đặt `COOKIE_SECURE=1`. App gọi thẳng `https://` và `wss://` của tên miền đó.

| Kênh | Tin nhắn |
| --- | --- |
| HTTP | `GET /api/me` · `POST /api/register`, `/api/login`, `/api/logout` · `POST /api/action` (gửi `{type, rid, …}`, nhận `{ok, events, patch, base, rev}`) |
| WS client → server | `pos`, `chat`, `who`, `chlist`, `ch`, `hit`, `cast`, `exec`, `fusion`, `manaburst`, `allin`, `fusion_end`, `party_*`, `trade_*` |
| WS server → client | `hello`, `room`, `mobs`, `join`, `leave`, `snap`, `msnap`, `batch`, `patch`, `look`, `chat`, `sys`, `who`, `chlist`, `mspawn`, `mhit`, `mhp`, `mdie`, `mdel`, `mresp`, `mact`, `party`, `party_inv`, `trade`, `trade_inv`, `trade_end` |

## Hiệu năng bản web: kết quả kiểm tra code

Code đã tối ưu khá tốt, nhưng có một nghi phạm rõ cho kiểu lag tăng dần trên iPhone: canvas lớn được tạo mỗi lần vào map mà không bao giờ được giải phóng. Đây là kết quả đọc code, chưa đo trên máy thật.

**Đã làm tốt:** tự giảm hiệu ứng khi FPS thấp; pool cho chữ bay và bóng; gỡ texture quái, nhân vật, nền, cảnh trí của map cũ khi đổi map; hiệu ứng kỹ năng tự hủy sau tween; log giới hạn 8 dòng; HUD cập nhật 80ms một lần; server gộp gói tin quái (`batch`).

| # | Vấn đề | Chỗ | Ảnh hưởng | Cách sửa |
| --- | --- | --- | --- | --- |
| 1 | Canvas không được giải phóng. `textures.remove` chỉ bỏ khỏi Phaser, không chỗ nào đặt `canvas.width = 0`. Nền chỉnh màu tới 5760×810 (khoảng 19MB mỗi lớp khi lật gương); đổi màu nhân vật tạo 2 canvas cho mỗi animation mỗi cấp | `scene/map_looks.js` (`gradeCanvas`), `art/sprites.js` (`formJob`), `scene/world.js` | Lag tăng dần sau vài lần đổi map; Safari iOS giới hạn tổng bộ nhớ canvas và trả bộ nhớ chậm | Một hàm `dropTexture` dùng chung: lấy canvas nguồn, `remove`, rồi đặt `width = height = 0` |
| 2 | Chỉnh màu nền và đổi màu nhân vật bằng `getImageData` trên CPU lúc vào map | như trên | Khựng khi đổi map, tốn pin | Làm sẵn lúc build (xuất ảnh đã chỉnh màu) hoặc đổi màu bằng shader |
| 3 | Canvas lớn tạo với `willReadFrequently: true` dù chỉ đọc một lần | `gradeCanvas`, `formJob` | Canvas bị giữ ở CPU, đưa lên GPU chậm hơn | Đọc bằng canvas tạm, vẽ kết quả sang canvas thường; bỏ khi chuyển sang cách 2 |
| 4 | Hiệu ứng kỹ năng tạo mới Graphics và Image mỗi lần dùng rồi hủy | `scene/skillfx.js` | Rác bộ nhớ, dọn rác gây khựng khi đánh liên tục | Pool cho các loại dùng nhiều; vẽ sẵn thành texture thay vì Graphics |
| 5 | HUD ghi khoảng 30 thuộc tính DOM và gọi `querySelector` nhiều lần mỗi 80ms dù giá trị không đổi | `ui/ui.js` (`tick`) | Tốn CPU đều đặn trên điện thoại | Giữ sẵn phần tử, chỉ ghi khi giá trị đổi |

**Đo trên iPhone không cần Mac:** thêm lớp chỉ số bật bằng `?debug=1`, hiện FPS, số texture, số object, số tween và tổng diện tích canvas đang giữ. Đổi map 10 lần: nếu các số này chỉ tăng thì đúng là rò rỉ. Sửa mục 1 trước vì rẻ nhất, rồi đo lại.

## Cấu trúc project app (Godot)

Tách ba lớp: mạng (HTTP và WebSocket), trạng thái nhân vật, và giao diện cùng thế giới; mọi thứ chạm vào server đi qua một chỗ.

```
an-phong-app/
  project.godot, export_presets.cfg
  assets/               sprite, tile, âm thanh (đồng bộ từ public/assets)
  data/gamedata.json    xuất từ server (vật phẩm, kỹ năng, nhiệm vụ, bản đồ)
  src/
    autoload/           singleton dùng toàn app
      Net.gd            HTTPRequest, token, /api/*, gửi lại theo rid
      Socket.gd         WebSocketPeer, /ws, hàng đợi tin nhắn
      Game.gd           nhân vật hiện tại, rev, áp bản vá (patch)
      Data.gd           nạp gamedata.json, kiểm hash
      Settings.gd, Audio.gd
    scenes/             Boot, Login, World
    world/              Player, Mob, RemotePlayer, TileMapLoader, SkillFx
    ui/                 Hud, Inventory, Skills, Quests, Shop, Chat, Party, Trade
    logic/              công thức port từ shared/core.js (chỉ số, giảm sát thương)
  tools/                sync_assets, kiểm tra lệch dữ liệu
```

- **Server là nguồn đúng.** Nhân vật chỉ đổi qua `/api/action`; app giữ `rev` và áp `patch`, lệch thì tải lại cả nhân vật (đúng cách bản web đang làm).
- **Gửi lại an toàn.** Mỗi hành động kèm `rid` để mất mạng gửi lại không bị làm hai lần.
- **Bản đồ từ file `.txt`.** `TileMapLoader` đọc bản đồ trong `shared/maps` và dựng TileMap theo từng mảng nhỏ, không tạo canvas mới mỗi lần đổi map.
- **Chống lag từ đầu.** Dùng object pool cho hiệu ứng và chữ bay, giới hạn hạt, giải phóng tài nguyên khi rời map, và có chế độ giảm hiệu ứng.
- **Mobile.** Khóa xoay ngang, tôn trọng vùng an toàn (tai thỏ), nút cảm ứng, tạm dừng khi app xuống nền.

## Đồ hoạ và hiệu năng app

Mục tiêu của app là giao diện đẹp, hài hoà và chạy mượt: mọi thứ trên màn hình, từ nhân vật, quái, bản đồ đến khung giao diện và biểu tượng vật phẩm, phải cùng một phong cách. Mục tiêu đo được và cấu hình đồ hoạ chốt ngay từ giai đoạn 1, trước khi viết client.

**Giao diện đẹp và hài hoà (yêu cầu bắt buộc)**

- **Một phong cách thống nhất:** pixel art cùng kích thước điểm ảnh, cùng bảng màu, cùng kiểu viền và đổ bóng cho nhân vật, quái, cảnh, khung giao diện và biểu tượng. Chốt thành một trang hướng dẫn phong cách (bảng màu, kích thước ô, font, màu theo độ hiếm) trước khi vẽ hay tìm thêm tài nguyên.
- **Biểu tượng vật phẩm hợp với game:** hiện biểu tượng vật phẩm là SVG vẽ bằng code (`public/js/art/itemicons.js`), dự phòng bằng emoji, nên không cùng phong cách với sprite pixel art. App thay bằng bộ biểu tượng pixel art, ưu tiên tìm gói có sẵn rồi chỉnh màu cho hợp, thiếu thì tự vẽ theo trang phong cách.
- **Nguồn tài nguyên:** giống cách game đang làm (`public/assets/CREDITS.txt`): lấy gói miễn phí trên itch.io và OpenGameArt. Game chỉ chơi nội bộ với đồng nghiệp, không bán, nên không cần cân nhắc giấy phép thương mại; chỉ cần ghi tên tác giả vào CREDITS với gói yêu cầu ghi công.
- **Phân biệt độ hiếm bằng hình:** khung và ánh sáng quanh biểu tượng theo độ hiếm, nhất quán giữa túi đồ, shop, lò rèn và giao dịch.
- **Kiểm tra bằng mắt:** mỗi giai đoạn chụp màn hình các bảng chính, đặt cạnh nhau để soi chỗ lệch màu, lệch kích thước, lệch phong cách.
- **Khối lượng (làm một mình, không có người vẽ):** game có 433 vật phẩm và 175 kỹ năng, nên chỉ dùng gói hình có sẵn và giảm số hình cần tìm. Vũ khí (84 món) chỉ có 8 loại và giáp (92 món) chỉ có 9 ô, mỗi loại khoảng 10 bậc: chọn vài hình cho mỗi loại rồi đổi màu và khung theo bậc. 175 sách kỹ năng và sách tuyệt kỹ ghép tự động từ khung sách và biểu tượng kỹ năng. Chọn trước một đến hai gói biểu tượng lớn cùng tác giả để phong cách đồng bộ. Đây là đầu việc riêng, chạy song song các giai đoạn 2 đến 5.

**Mục tiêu (chốt ở giai đoạn 1)**

- Máy thấp nhất phải chạy được, ví dụ iPhone 11 và một máy Android tầm trung.
- 60 FPS khi đánh nhau đông người, có tùy chọn khóa 30 FPS để máy đỡ nóng khi chơi lâu.
- Giới hạn bộ nhớ texture cho mỗi map và số hạt tối đa trên màn hình. Hiện `public/assets` 59MB dạng PNG nhưng giải nén ra khoảng 1,2GB nếu nạp hết; riêng nền map `elv4` khoảng 37MB.
- Chơi 30 phút và đổi map 20 lần mà bộ nhớ không tăng dần.

**Đồ hoạ**

- **Renderer:** thử renderer Compatibility trước (nhẹ, hợp 2D, hỗ trợ nhiều máy), đo so với Mobile rồi chọn.
- **Pixel art:** game đang dùng `pixelArt` và `roundPixels`, nên đặt lọc Nearest, snap pixel và scale nguyên lần để hình không mờ, không rung.
- **Texture:** gộp sprite thành atlas, nén VRAM (ASTC cho iOS), dùng bản nền nhỏ hơn cho điện thoại thay vì 2880px mỗi lớp.
- **Đổi màu bằng shader:** thay việc chép sprite ra canvas để đổi màu theo cấp và chỉnh màu nền theo map; không tốn thêm bộ nhớ.
- **Hiệu ứng:** dùng GPUParticles2D/CPUParticles2D có pool, ánh sáng và phát sáng bằng chế độ hòa màu cộng thay vì hiệu ứng toàn màn hình tốn kém.

**Giao diện thiết kế riêng cho mobile (không theo web)**

- **Thiết kế từ đầu cho điện thoại cầm ngang,** không bê bố cục bảng của web. Dữ liệu và luật chơi giữ nguyên, chỉ cách trình bày là mới.
- **Phác các màn chính trước khi code:** đăng nhập, HUD chiến đấu, túi đồ và trang bị, kỹ năng, nhiệm vụ, shop và lò rèn, thú, chat, party và giao dịch.
- **Chiến đấu:** cần điều khiển ảo bên trái, nút đánh và kỹ năng bên phải trong tầm ngón cái, nút không nhỏ hơn khoảng 44pt.
- **Bảng chức năng:** mở toàn màn hình hoặc dạng ngăn kéo, có tab; chạm giữ để xem chi tiết thay cho di chuột.
- **Biểu tượng kỹ năng:** hiện cả 175 kỹ năng dùng emoji làm biểu tượng; app cần biểu tượng pixel art riêng cho từng kỹ năng, đi cùng hiệu ứng riêng của kỹ năng đó.
- **Chung:** tôn trọng vùng an toàn (tai thỏ), một Theme chung cho màu, font và khung, font Be Vietnam Pro đủ dấu tiếng Việt, HUD chỉ cập nhật khi giá trị đổi.

**Khác**

- Âm thanh hiện tạo bằng oscillator trong code; sang app thì xuất sẵn thành file để nhẹ hơn.
- Có lớp chỉ số trong app (FPS, bộ nhớ texture, số node, số hạt) và ghi log, vì không có Mac để dùng công cụ đo của Xcode.

## Hiệu ứng kỹ năng: mỗi kỹ năng một file

Mỗi kỹ năng có hiệu ứng riêng khớp với tên, mô tả bằng dữ liệu JSON thay vì code, để cả web và app dùng chung mà không phải viết hai lần. Hiện `public/js/scene/skillfx.js` ghép `chủ_đề:kiểu` (một bảng `SK` trỏ tới khoảng 19 hàm vẽ chung), nên nhiều kỹ năng trông giống nhau.

1. **Mỗi kỹ năng một file JSON**, ví dụ `shared/data/skillfx/ks35.json`: danh sách lớp theo thời gian (hạt, vệt chém, chớp sáng, hình khối, rung camera, âm thanh), mỗi lớp có màu, hình, thời điểm bắt đầu, thời lượng.
2. **Mỗi nền tảng một bộ vẽ.** Web: một file JS đọc JSON và vẽ bằng Phaser. App: một script GDScript đọc cùng file đó. Bộ vẽ tự áp giới hạn số hạt, pool và chế độ giảm hiệu ứng.
3. **Đường lùi.** Kỹ năng chưa có file JSON thì vẫn dùng `chủ_đề:kiểu` như bây giờ, nên làm dần mà game không hỏng. Đường lùi chỉ dùng tạm trong lúc chuyển; đích là 100% kỹ năng có hiệu ứng riêng, xong thì xóa bảng SK cũ.
4. **Không có ngoại lệ.** Mọi kỹ năng đều có file hiệu ứng riêng, không kỹ năng nào dùng chung hiệu ứng với kỹ năng khác. Kỹ năng cần chuyển động mà bộ vẽ chưa làm được (ví dụ rồng bay theo đường cong) thì thêm loại lớp mới vào bộ vẽ, rồi kỹ năng đó vẫn khai báo trong file riêng của nó.
5. **Thứ tự.** Làm thử Kiếm Sĩ để chốt định dạng JSON, rồi tuyệt kỹ và siêu tuyệt kỹ, cuối cùng là kỹ năng thường.

- **Vì sao JSON:** 175 kỹ năng; viết code riêng cho từng cái rồi port sang Godot là làm hai lần. JSON thì port gần như miễn phí, và có thể viết công cụ xem trước hiệu ứng để chỉnh nhanh.
- **Chống lag:** giới hạn hạt nằm trong bộ vẽ, không phụ thuộc người viết từng hiệu ứng. Đo lại bằng lớp chỉ số sau mỗi nhóm hiệu ứng.
- **Khối lượng:** bộ vẽ và định dạng khoảng 2–3 tuần; sau đó là 175 hiệu ứng, ước lượng thô 1 đến 3 giờ mỗi cái (tổng khoảng 175 đến 525 giờ khi làm một mình); mỗi file bắt đầu từ một mẫu theo nhóm kỹ năng rồi chỉnh thành hiệu ứng riêng, làm dần song song với các giai đoạn khác.
- **Làm khi nào:** sau khi sửa xong lag của bản web; bộ vẽ bản Godot làm ở giai đoạn 3 (chiến đấu).

## Lộ trình theo giai đoạn

Phần client khoảng 5 đến 8 tháng nếu làm một mình bán thời gian; cộng thêm hình ảnh (khoảng 130 hình vật phẩm và 175 biểu tượng kỹ năng) và 175 hiệu ứng kỹ năng chạy song song, tổng có thể lên 8 đến 12 tháng. Giai đoạn 1 là cổng quyết định có đi tiếp với Godot hay không. Đây là ước lượng thô, dựa trên khoảng 12.000 dòng JavaScript của client hiện tại, chưa đo thực tế.

| Giai đoạn | Làm gì | Ước tính | Đạt khi |
| --- | --- | --- | --- |
| 0. Song song | Thêm lớp chỉ số (?debug=1), giải phóng canvas, đo lại; sửa các mục còn lại trong phần hiệu năng web. Làm song song với giai đoạn 1, không chặn việc làm app | 1–2 tuần | Chơi 30 phút không giật |
| 1. Nền móng (cổng) | Tài liệu giao thức, xuất `gamedata.json`, token, số phiên bản; project Godot trống build ra Android và iOS qua CI; trang hướng dẫn phong cách và bản phác các màn hình mobile | 2–3 tuần | `.ipa` Godot trống cài được lên iPhone |
| 2. MVP | Đăng nhập, nạp map, di chuyển, thấy người chơi khác, chat | 4–6 tuần | Hai máy cùng thấy nhau di chuyển mượt, đòn đánh từ app được server tính đủ sát thương (không bị cắt trần, không bị loại vì xa) |
| 3. Chiến đấu | Quái, đánh thường, kỹ năng, hiệu ứng, chết và hồi sinh | 6–8 tuần | Hạ quái, nhận exp đúng như bản web |
| 4. Hệ thống game | Túi đồ, trang bị, shop, nhiệm vụ, thú, party, giao dịch | 8–12 tuần | Chơi được hết chương 1 |
| 5. Hoàn thiện | Tối ưu, âm thanh, thử trên máy thật, đưa .ipa và .apk lên trang tải trên VPS | 3–4 tuần | Đồng nghiệp chơi 1 giờ không lỗi nặng |

Nếu ở giai đoạn 1 build iOS từ Godot trên CI không chạy được, phương án dự phòng là giữ Capacitor cho iOS và chỉ dùng Godot cho Android.

**Chạy song song giai đoạn 2 đến 5** (không nằm trong ước tính của bảng):

- **Hình ảnh và giao diện:** khoảng 130 hình vật phẩm, 175 biểu tượng kỹ năng, khung và nút giao diện theo trang phong cách.
- **Hiệu ứng kỹ năng:** bộ vẽ JSON (2–3 tuần) rồi 175 hiệu ứng riêng; bộ vẽ bản Godot cần xong trước giai đoạn 3.

## Build và phát hành miễn phí từ Windows

Android build thẳng trên Windows; iOS build trên máy macOS của GitHub Actions rồi cài vào iPhone bằng Sideloadly.

- **Android:** cài Godot 4, JDK và Android SDK trên Windows; xuất `.apk` ký bằng **một keystore cố định** và cất kỹ file này. Đổi keystore thì máy đồng nghiệp phải gỡ app cũ mới cài được bản mới. Đồng nghiệp tải `.apk` từ VPS và bật cho phép cài từ nguồn không xác định.
- **iOS:** Godot xuất project Xcode; GitHub Actions (runner macOS) build không ký và xuất `.ipa`. Mỗi đồng nghiệp tự ký bằng Apple ID của mình: Sideloadly trên máy tính (Windows cần iTunes và iCloud bản từ trang Apple), hoặc SideStore trên iPhone (cần máy tính cho lần cài đầu, sau đó tự làm mới trên máy).
- **Ký lại mỗi 7 ngày (đã chấp nhận):** Apple ID miễn phí cho tối đa 3 app cùng lúc. Nhân vật và đồ nằm trên server nên app hết hạn hay cài lại cũng không mất gì.
- **Không có Mac:** không dùng được Xcode simulator, nên kiểm tra trực tiếp trên iPhone thật và ghi log để đọc lại.
- **GitHub Actions:** repo public dùng runner macOS miễn phí; repo private có hạn mức phút miễn phí và phút macOS bị tính nhiều hơn, nên đặt project app trong repo an-phong (đang public) hoặc một repo public khác.
- **Web và trang tải trên VPS:** web triển khai như hiện tại (`deploy/`). Thêm một trang tải trên cùng tên miền, đặt bản `.ipa` và `.apk` mới nhất kèm ghi chú phiên bản. App so `minClient` từ `/api/version` để báo khi cần tải bản mới; lần ký lại 7 ngày là dịp để cài luôn bản mới nhất.

## Phân phối cho khoảng 50 đồng nghiệp

Android dễ (tải `.apk` từ VPS); iPhone là điểm khó nhất, vì ký miễn phí phải làm trên từng máy và lặp lại mỗi 7 ngày. Cần chốt một trong ba cách cho iPhone, sau khi đếm số đồng nghiệp dùng iPhone.

| Cách cho iPhone | Chi phí | Đồng nghiệp phải làm | Hợp khi |
| --- | --- | --- | --- |
| A. Ký miễn phí (Sideloadly, SideStore) | 0đ | Cài Sideloadly cùng iTunes và iCloud trên máy Windows, cắm iPhone, đăng nhập Apple ID; lặp lại mỗi 7 ngày (SideStore tự làm mới sau lần đầu) | Chỉ vài người dùng iPhone |
| B. TestFlight (Apple Developer) | 99 USD/năm | Cài app TestFlight, bấm link mời; app tự cập nhật | Nhiều người dùng iPhone |
| C. iPhone chơi bản web | 0đ | Mở trang, thêm vào Màn hình chính | Chấp nhận iPhone dùng giao diện web, không có giao diện mobile mới |

- **Về cách A:** bạn sẽ thành người hỗ trợ cài đặt cho từng người; cần một trang hướng dẫn có ảnh trên VPS.
- **Về cách B:** mỗi bản build dùng được 90 ngày, hỗ trợ tới 10.000 người thử bên ngoài qua email hoặc link chung, và bản đầu tiên gửi cho nhóm bên ngoài phải qua Apple duyệt ([Apple](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview), [Kodeco](https://kodeco.com/books/ios-app-distribution-best-practices/v1.0/chapters/6-testflight)). Upload lên từ GitHub Actions nên vẫn không cần Mac. Tháng 9/2026 có báo cáo trên diễn đàn Apple về build TestFlight hết hạn sớm hơn 90 ngày ([diễn đàn Apple](https://developer.apple.com/forums/thread/813703?page=3)).
- **Đề xuất:** đếm số người dùng iPhone trước. Nhiều thì chọn B, hoặc C nếu không muốn trả phí; A chỉ hợp khi vài người.

## Rủi ro và câu hỏi còn mở

Rủi ro lớn nhất là viết lại xong mà đòn đánh của app bị server cắt sát thương hoặc loại vì sai khoảng cách, sai nhịp; các giai đoạn 1 và 2 được thiết kế để lộ rủi ro này sớm.

**Rủi ro**

1. **Phân phối cho iPhone.** Ký miễn phí cho hàng chục người, mỗi 7 ngày, rất tốn công hỗ trợ. Chốt cách cài ở giai đoạn 1 (xem phần Phân phối).
2. **Làm một mình, không có người vẽ.** Khoảng 305 hình (130 vật phẩm, 175 kỹ năng) cần tìm và 175 hiệu ứng là phần tốn công nhất và dễ lệch phong cách. Chốt trang phong cách trước, chỉ dùng gói có sẵn, ghép tự động hình nào ghép được.
3. **Vật lý và ngưỡng chống gian lận.** Server không kiểm `pos`, nhưng kiểm `hit` và `cast` bằng khoảng cách, trần sát thương và ngân sách tốc độ. Vật lý Godot lệch Phaser (nhảy cao hơn, rơi nhanh hơn) sẽ làm người web thấy nhân vật app di chuyển lạ. Dùng đúng GRAVITY 1300, JUMP\_V 560, TILE 32 và kiểm ngay ở giai đoạn 2.
4. **Dữ liệu game đổi liên tục.** `shared/` sửa thì app có thể lệch; cần `dataHash` và test so sánh công thức.
5. **Build iOS từ Godot trên CI chưa được thử.** Đây là cổng ở giai đoạn 1, trước khi tốn công viết client.
6. **Lag chưa đo trên máy thật.** Mới đọc mã. Nếu lag chủ yếu do server hay mạng thì viết lại client không cứu được; đo ở giai đoạn 0. Server cũng cần thử tải với khoảng 50 người cùng lúc.

**Đã chốt và câu hỏi còn mở**

- Đã chốt: server trên VPS, đã có HTTPS.
- Đã chốt: chơi nội bộ với khoảng 50 đồng nghiệp, không bán; đồng nghiệp không có Mac.
- Đã chốt: giao diện app thiết kế riêng cho mobile, không theo bản web.
- Đã chốt: làm một mình, không có người vẽ, chỉ dùng gói hình có sẵn.
- Còn mở: bao nhiêu người dùng iPhone, bao nhiêu dùng Android?
- Còn mở: iPhone cài theo cách nào (ký miễn phí, TestFlight 99 USD/năm, hay chơi bản web)?
