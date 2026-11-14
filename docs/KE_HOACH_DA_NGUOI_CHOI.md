# Kế hoạch: nhiều người chơi thấy nhau (đa người chơi)

Trạng thái: **Giai đoạn 1, 2, 3 và 4 đã làm xong (chưa kiểm thử hết trên điện thoại / VPS)**. Giai đoạn 3 thiết kế ở mục 10, giai đoạn 4 ở mục 12. Xem mục 9 "Tiến độ".

## 1. Hiện trạng (trước khi làm)

- Nhiều người đăng nhập cùng lúc được, mỗi người một nhân vật lưu trong PostgreSQL.
- Client chỉ gọi HTTP (`POST /api/action`). Không có kết nối thời gian thực nên không ai thấy ai.
- Di chuyển, chiến đấu, quái, rơi đồ đều chạy ở **client**; server chỉ nhận `save` (vị trí, máu) và `kills`.
- Server là `http.createServer` thuần, phụ thuộc duy nhất ngoài `pg` là `phaser` (phía client).

## 2. Mục tiêu

Tối mọi người cùng vào chơi, **thấy nhau trên cùng bản đồ và chat với nhau**.
Quái vẫn là quái riêng của từng người (mỗi người thấy bộ quái của mình), nên chưa đánh chung.

## 3. Phạm vi các giai đoạn

| GĐ | Nội dung | Trạng thái |
|---|---|---|
| 1 | WebSocket, phòng theo map, đồng bộ vị trí, vẽ người chơi khác | **xong** |
| 2 | Chat theo map + thế giới, bong bóng chat, danh sách người trong map, chặn người | **xong** |
| 3 | Quái chung (server làm chủ quái, drop, respawn) | **xong** (mục 10) |
| 4 | Đội nhóm chia kinh nghiệm, giao dịch trực tiếp, chợ người chơi | **xong** (mục 12) |

## 4. Thiết kế Giai đoạn 1

### 4.1 Server (`server/realtime/index.js`)

- Thư viện `ws`, gắn vào `http.Server` qua sự kiện `upgrade`, đường dẫn `/ws`.
- **Xác thực**: dùng lại cookie `ap_session` (`auth.getSession`). Không có phiên → trả 401 và đóng.
  Kiểm tra thêm header `Origin` khớp `Host`.
- **Một kết nối cho mỗi tài khoản**: mở thêm tab/máy khác thì kết nối cũ bị đóng (mã 4001, client không tự nối lại).
- **Phòng theo map**: `rooms: Map<mapId, Map<connId, Conn>>`. Mỗi người có `connId` số tăng dần
  (không lộ `userId` ra ngoài).
- **Thông tin hiển thị** (tên, class, cấp, vũ khí) lấy từ nhân vật trong cache server, **không** tin client gửi lên.
- **Vòng phát 10 lần/giây** (`TICK_MS = 100`): mỗi phòng chỉ gửi những người có thay đổi, gộp một gói.
- **Chống lạm dụng**: giới hạn số gói/giây mỗi kết nối, kích thước gói tối đa, ép toạ độ về số hữu hạn
  trong khoảng cho phép, map phải có trong `GameData.MAPS`.
- Ping/pong 25 giây để dọn kết nối chết và giữ Nginx không cắt kết nối rảnh.
- Phiên bị khoá/hết hạn: kiểm tra lại định kỳ (dựa vào cache phiên 60 giây), đóng kết nối nếu không còn hợp lệ.

### 4.2 Giao thức (JSON)

Client → Server:

| Gói | Ý nghĩa |
|---|---|
| `{t:'pos', map, x, y, f, a}` | vị trí; `f` = hướng (1/-1); `a` = hoạt ảnh (`idle/run/jump/fall/atk/hit/dead`) |
| `{t:'chat', ch:'map'\|'world', text}` | gửi chat |
| `{t:'who'}` | xin danh sách người trong map |

Server → Client:

| Gói | Ý nghĩa |
|---|---|
| `{t:'hello', id}` | id kết nối của mình (để bỏ qua chính mình) |
| `{t:'room', map, list:[...]}` | danh sách người đang ở map khi vào phòng |
| `{t:'join', p}` / `{t:'leave', id}` | có người vào / ra |
| `{t:'snap', p:[[id,x,y,f,a],...]}` | cập nhật vị trí gộp |
| `{t:'look', p}` | đổi hình (lên cấp, đổi class, đổi vũ khí) |
| `{t:'chat', ch, id, name, text}` | tin chat |
| `{t:'who', map, list, online}` | trả lời danh sách |
| `{t:'sys', text}` | thông báo hệ thống (vượt tốc độ chat, v.v.) |

### 4.3 Client

- `public/js/core/realtime.js`: module `Realtime` — kết nối, tự nối lại (lùi dần 1→10 giây),
  tự vào phòng map hiện tại, phát vị trí 10 lần/giây khi có thay đổi (hoặc 1 lần/giây khi đứng yên).
- `public/js/scene/remote.js` (mixin của `WorldScene`): dựng/huỷ `RemotePlayer`
  (sprite theo hình class, tên + cấp trên đầu), **nội suy** vị trí giữa các gói, bong bóng chat.
- Chỉ hiển thị tối đa `MAX_REMOTE` (40) người gần nhất.
- Đổi map (`scene.restart`): dọn hết người cũ, `Realtime.enterMap` gửi vị trí map mới.
- Hình class chưa tải xong: dùng hình vẽ bằng code (`hunter_<class>_idle`), tải xong đổi sang hình đầy đủ.

### 4.4 Hạ tầng

- `deploy/nginx-anphong.conf`: thêm `location /ws` với `Upgrade`/`Connection upgrade`, `proxy_read_timeout 120s`.
- CSP: `connect-src` cho phép `ws(s)://<host>`.
- Chạy một tiến trình Node: đủ cho vài trăm người cùng lúc. Nhiều tiến trình/nhiều máy thì phải thay
  `rooms` bằng Redis pub/sub (module đã tách riêng nên chỉ sửa trong `server/realtime/`).

## 5. Thiết kế Giai đoạn 2 (chat)

- Hai kênh: **Map** (người cùng bản đồ) và **Thế giới** (mọi người online).
- Giới hạn: tối đa 100 ký tự; kênh map cách nhau ≥ 1,2 giây; kênh thế giới cách nhau ≥ 8 giây.
- Lọc cơ bản ở server: bỏ ký tự điều khiển, gộp khoảng trắng, chặn đường link (`http`, `www.`, `.com`...),
  rút ngắn chuỗi ký tự lặp dài (spam).
- **Chặn người** ở client (lưu `localStorage`): lệnh `/chan <tên>`, `/bochan <tên>`. Server không đổi.
- Lệnh: `/ds` (danh sách người trong map), `/t <nội dung>` (chat thế giới), `/chan`, `/bochan`.
- Giao diện: nút 💬 trên thanh menu và phím `/` để mở ô nhập (phím Enter vẫn là "nói chuyện NPC");
  tin hiển thị trong khung log hiện có (đã có sẵn bố cục cho cả máy tính và điện thoại);
  **bong bóng chat** hiện trên đầu nhân vật 5 giây.
- Bấm vào người chơi khác để xem tên / cấp / class.

## 6. Việc không làm trong đợt này (để các giai đoạn sau)

- Quái, drop, boss dùng chung (GĐ3).
- Party, giao dịch, kết bạn (GĐ4).
- Báo cáo vi phạm / công cụ quản trị mute-ban chat phía server.
- Hiển thị hình biến hình (thức tỉnh), thú cưỡi, thú triệu hồi của người khác.
- Hiển thị vũ khí cầm tay của người khác.

## 7. Rủi ro đã biết

- Combat và di chuyển nằm ở client nên vị trí do client báo; chỉ dùng để hiển thị, không tính thưởng nên
  rủi ro thấp. Từ GĐ3 trở đi phải kiểm tra phía server.
- Một phòng quá đông (hàng trăm người cùng map) sẽ tốn băng thông: gói gửi O(n²). Đã giới hạn số người vẽ ở
  client; nếu cần sẽ làm lọc theo khoảng cách ở server.
- Client cũ (đang mở trang chưa tải lại) không có WebSocket → vẫn chơi bình thường như trước.

## 8. Cách kiểm thử

1. `npm install` rồi `npm start`.
2. Mở hai trình duyệt (hoặc một cửa sổ ẩn danh) đăng nhập hai tài khoản khác nhau, vào cùng map.
3. Kiểm tra: thấy nhau, thấy chạy/nhảy mượt, tên và cấp đúng, một người thoát thì người kia thấy biến mất.
4. Đổi map ở một bên: biến mất ở map cũ, xuất hiện ở map mới.
5. Chat map / thế giới, `/ds`, `/chan`.
6. Mở thêm tab thứ hai cùng tài khoản: tab cũ bị ngắt realtime nhưng game vẫn chạy.
7. Tắt server rồi bật lại: client tự nối lại.

## 9. Tiến độ

### Đã làm (GĐ 1 + 2)

| Việc | File |
|---|---|
| Server WebSocket, phòng theo map, phát vị trí 10Hz, chat, `who` | `server/realtime/index.js` (mới), gắn vào `server/index.js` |
| CSP cho phép `ws(s)://<host>`, đóng realtime khi tắt server | `server/index.js` |
| Thư viện `ws` | `package.json` (`npm install` trên VPS sau khi kéo code) |
| Kết nối client, tự nối lại (1→10 giây), gửi vị trí | `public/js/core/realtime.js` (mới) |
| Vẽ người chơi khác, nội suy, tên + cấp, bong bóng chat, bấm vào để xem thông tin | `public/js/scene/remote.js` (mới, mixin của `WorldScene`), móc vào `scene/world.js` |
| Ô chat, lệnh, chặn người (lưu `localStorage`) | `public/js/ui/chat.js` (mới), `public/index.html`, `public/css/style.css`, phím `/` trong `core/main.js` |
| Hiện số người trong map cạnh tên bản đồ; `UI.log` nhận thêm thời gian hiển thị | `public/js/ui/ui.js` |
| Nginx cho WebSocket | `deploy/nginx-anphong.conf` (khối `location /ws`) |

Khác với thiết kế ban đầu:
- Phím mở chat là `/` (không dùng Enter vì Enter đang là "nói chuyện NPC").
- Lệnh có thêm `/m` (chat map) và `/help`.
- Giới hạn 40 người vẽ trên một map là "ai vào trước thì hiện trước", chưa ưu tiên theo khoảng cách.
- Bong bóng chat chỉ hiện cho kênh Map.

### Đã kiểm thử

- Giao thức bằng script `ws` (hai tài khoản): xác thực (cookie sai → 401), vào phòng, `join`/`snap`/`leave`,
  chat map và thế giới, chặn link, giới hạn tốc độ chat, `who`, mở kết nối thứ hai cùng tài khoản (kết nối cũ đóng mã 4001),
  toạ độ rác bị bỏ qua.
- Giao diện trên trình duyệt (máy tính): thấy người chơi thứ hai di chuyển, tên + cấp, đếm số người, gõ chat bằng nút 💬,
  tin hiện trong log và bong bóng trên đầu.
- Các tài khoản thử đã xoá khỏi database.

### Chưa kiểm thử / còn thiếu

- Bố cục ô chat trên điện thoại (`body.touch`, `html.compact`): đã viết CSS nhưng chưa nhìn thử.
- Tự nối lại sau khi tắt/bật server; chạy qua Nginx thật (cấu hình `/ws` chưa thử trên VPS).
- Hình từng class của người khác (mới thử class chưa chọn); hình biến hình, vũ khí cầm tay, thú đi theo của người khác chưa vẽ.
- Chưa có báo cáo vi phạm và công cụ khoá chat phía server (hiện chỉ có chặn ở client + khoá tài khoản như cũ).
- Chưa kiểm thử tải nhiều người cùng lúc.

### Đã làm (GĐ 3)

| Việc | File |
|---|---|
| Lưới bản đồ phía server (khớp client) | `server/realtime/mapgrid.js` (mới) |
| AI quái, máu, hồi sinh, trùm, quái phụ | `server/realtime/mobs.js` (mới) |
| Phiếu nhận thưởng | `server/realtime/claims.js` (mới), `server/game/actions/combat.js` (`kills` đổi phiếu) |
| Phòng giữ World, gói `hit`, vòng 50 ms | `server/realtime/index.js` |
| Quái vẽ theo server, gửi đòn lên server | `public/js/scene/monsters.js`, `combat.js`, `world.js`, `remote.js` |
| Chờ kết nối trước khi dựng game | `public/js/core/realtime.js`, `core/main.js` |

Kiểm thử GĐ 3:
- Script `ws` hai tài khoản: nhận danh sách quái, quái di chuyển, đòn của A và B tính chung vào máu, sát thương quá trần bị kẹp,
  quái chết → phiếu cho người kết liễu, nộp phiếu nhận exp/vàng, nộp lại cùng phiếu không nhận thêm, người góp dưới 10% không có phiếu,
  hành động `kills` không phiếu bị bỏ qua, quái hồi sinh đúng giờ, đổi map nhận danh sách quái map mới.
- Mô phỏng AI trên cả 59 bản đồ (400 bước, có/không có người): không lỗi, toạ độ không ra ngoài bản đồ, trùm phát đòn đặc biệt.
- Trên trình duyệt: quái dựng theo server, đánh thường làm giảm máu (từng đòn gửi lên), hạ quái nhận exp/vàng/tiến độ kill,
  quái đuổi → gồng → lao tới và trừ máu mình.
- Các tài khoản thử đã xoá khỏi database.

Chưa kiểm thử GĐ 3:
- Hai người thật cùng đánh một con quái trên trình duyệt (mới thử bằng script).
- Trùm thật (đòn đặc biệt, nổi giận gọi quái phụ) trên giao diện; kỹ năng, thú, bóng ma, linh thú đánh quái qua đường server.
- Chế độ riêng lẻ khi không có WebSocket (đường code cũ giữ nguyên nhưng chưa chạy lại sau khi sửa).
- Tự dựng lại cảnh khi kết nối được lại; điện thoại; tải nhiều người.

### Bước tiếp theo gợi ý

1. Thử với bạn bè trên VPS: cập nhật Nginx, `npm install`, khởi động lại service, hai người cùng vào một map.
2. Cho vài người đánh chung một trùm để xem độ mượt, rồi chỉnh tầm đánh / tốc độ nội suy nếu thấy lệch.
3. Giai đoạn 4: party chia kinh nghiệm, giao dịch trực tiếp, boss/sự kiện chung.

## 10. Giai đoạn 3: quái do server quản lý

### 10.1 Nguyên tắc chia việc

| Việc | Ai làm chủ |
|---|---|
| Danh sách quái từng map, vị trí, hướng, trạng thái (đi tuần / gồng / lao tới) | **Server** (`server/realtime/mobs.js`) |
| Máu, chết, hồi sinh, quái phụ khi trùm nổi giận, lúc trùm tung đòn đặc biệt | **Server** |
| Quyền nhận thưởng khi hạ quái (exp, vàng, đồ rơi, nhiệm vụ) | **Server** (phiếu `claims`) |
| Tính sát thương của MÌNH lên quái (chí mạng, buff, kỹ năng) | Client, gửi lên bằng gói `hit`; server kẹp theo trần sát thương |
| Sát thương quái lên MÌNH | Client: khi quái "lao tới" thì máy mình tự kiểm tra va chạm rồi trừ máu mình (như cũ) |
| Hiệu ứng, đạn, vùng báo trước của trùm | Client (mỗi người tự diễn đòn nhắm vào chính mình, theo lệnh `mact` của server) |

Máu người chơi vẫn do client giữ như trước (giữ nguyên cách lưu), nên đòn của quái lên người chơi chưa phải server tính.

### 10.2 Server

- `server/realtime/mapgrid.js`: đọc `shared/maps/*.txt` thành lưới giống hệt client (`WorldMap.parseMap`: kéo giãn cột 1,5 lần, thêm hàng đất), tính mặt đất, đoạn đi được (span), vị trí cổng, chỗ xuất hiện quái.
- `server/realtime/mobs.js`: lớp `World` — mỗi map có người thì có một World; chạy AI mỗi 50 ms
  (đi tuần → phát hiện người chơi gần nhất → đuổi → gồng 380 ms → lao tới → nghỉ), quái bay, quái nhảy, làm chậm / đóng băng,
  đẩy lùi, trùm nổi giận ở 50% máu (gọi 2 quái phụ), đòn đặc biệt của trùm theo chu kỳ, bỏ chạy (`fleeAt`), hồi sinh theo `def.respawn`.
  Phát gói vị trí 10 lần/giây, chỉ gửi con thay đổi. Map trống 30 giây thì bỏ World (quái hồi sinh đầy khi có người vào lại).
- `server/realtime/claims.js`: phiếu nhận thưởng. Khi quái chết, người kết liễu **và** người đã gây từ 10% máu quái trở lên đều được một phiếu.
- `server/game/actions/combat.js`: hành động `kills` — người chơi đang có kết nối realtime chỉ nhận thưởng khi nộp phiếu hợp lệ
  (loại quái, toạ độ rơi đồ, nguồn hạ lấy từ phiếu, không tin số client gửi; mỗi phiếu dùng một lần, hết hạn sau 3 phút).
  Người chơi không có kết nối realtime thì giữ cách cũ.

### 10.3 Giao thức bổ sung

Server → Client: `mobs` (toàn bộ quái khi vào map), `msnap` (vị trí gộp `[uid,x,y,f,trạng thái,cờ]`),
`mhit` (máu mới + số sát thương, để mọi người cùng thấy), `mdie` (kèm `by`, `as`, `kid` = phiếu), `mresp`, `mspawn`, `mdel`,
`mact` (`slam` / `special` / `enrage`).

Client → Server: `{t:'hit', u, d, c, src, dir, slow, freeze, knock}`.

Kiểm tra ở server khi nhận `hit`: quái còn sống, người chơi ở cùng map và không quá xa (1100 × 700), tối đa 80 đòn/giây,
sát thương bị kẹp theo `atk × 60 + 500` (tính từ nhân vật thật trong cache), làm chậm ≤ 6 s, đóng băng ≤ 4 s, đẩy lùi ≤ 400.

### 10.4 Client

- `scene/monsters.js`: `buildMonsters` quyết định chế độ lúc dựng cảnh: có kết nối realtime thì quái do server quản lý
  (`netMobs`), quái dựng theo gói `mobs`, nội suy vị trí (`updateNetMonster`), vẽ trạng thái / thanh máu như cũ.
  Không có kết nối thì chạy chế độ riêng lẻ (code cũ giữ nguyên).
- `scene/combat.js`: `damageMonster` với quái server chỉ tính sát thương rồi gửi `hit`, không tự trừ máu.
  Số sát thương, hiệu ứng trúng đòn, chết đều hiện theo gói server nên mọi người trong map thấy giống nhau.
- `core/main.js`: chờ kết nối realtime tối đa 2,5 giây trước khi dựng game để biết chọn chế độ nào.
- Mất kết nối giữa chừng: quái đứng yên và có thông báo; nối lại thì server gửi lại `mobs`.
  Nếu vào game khi chưa nối được (chế độ riêng lẻ) rồi nối được sau đó thì cảnh tự dựng lại để chuyển sang chế độ chung.

### 10.5 Hạn chế đã biết của Giai đoạn 3

- Server không có số đo hình ảnh của quái nên **tầm đánh** dùng giá trị trung bình (52 px, trùm 100 px): quái có thể bắt đầu gồng sớm/muộn hơn chút so với bản riêng lẻ. Va chạm thật (trúng mình hay không) vẫn kiểm tra theo hình thật ở client.
- Quái đi trên mặt đất cố định theo hàng xuất hiện (nhảy bằng trọng lực mô phỏng), chưa mô phỏng va chạm với bậc thang giữa chừng.
- Thưởng nhân đôi cho người góp ≥ 10% máu (không chia nhỏ): ai hạ cũng nhận đủ exp/vàng/đồ rơi riêng của mình; đồ rơi vẫn là đồ riêng từng người.
- Trần sát thương mỗi đòn là kiểm tra thô; chưa tính DPS tổng. Người chơi sửa client vẫn có thể gửi số lớn trong trần.
- Đòn đặc biệt của trùm do mỗi client tự diễn; ai sửa client có thể bỏ qua sát thương lên mình (máu người chơi do client giữ, như trước giờ).
- Hận thù đơn giản (theo tổng sát thương), chưa có kỹ năng khiêu khích riêng của Tanker.

## 11. Chiến đấu nhiều người: các trường hợp và cách xử lý

Người chơi mỗi người một chỉ số (công, thủ, máu, chí mạng, class), còn quái thì dùng chung. Quy tắc chung:
**mỗi bên dùng chỉ số của chính mình; con số dùng chung duy nhất là máu của quái.**

### 11.1 Sát thương

| Tình huống | Xử lý |
|---|---|
| Người A công 1000, người B công 100 cùng đánh một quái | Mỗi đòn dùng công / chí mạng / buff / kỹ năng **của người đánh** (tính ở client như trước), trừ vào máu quái chung. A đánh 10 đòn bằng B đánh 100 đòn. |
| Quái đánh người có thủ / máu khác nhau | Quái có `atk` cố định. Người bị đánh tự tính `atk × (1 − giảm thủ theo thủ và cấp CỦA MÌNH)` rồi trừ vào máu của mình (`hurtPlayer`). Thủ cao chịu ít hơn, máu thấp chết sớm hơn. |
| Một đòn lao tới / vùng nổ chạm nhiều người | Mỗi người tự kiểm tra va chạm trên máy mình, ai trúng người đó chịu (không chia sẻ sát thương). |
| Đòn cuối "thừa" sát thương | Phần vượt quá máu còn lại **không** được tính vào hận thù và phần chia thưởng, nên đánh một đòn khổng lồ vào quái gần chết không chiếm được phần của người khác. |
| Client gửi số sát thương vô lý | Bị kẹp ở `atk × 60 + 500` tính từ nhân vật thật trong cache server. |
| Trùm / thủ lĩnh khi có nhiều người | Máu tối đa **tăng 50% cho mỗi người sống thêm** đứng trong 700 px (tối đa ×3), giữ nguyên tỉ lệ máu đang có. Số người giảm sau đó thì máu tối đa **không** giảm lại trong trận (tránh lách luật), trừ khi trùm hồi đầy / hồi sinh. Quái thường không đổi. |

### 11.2 Người chơi chết khi đang đánh

Client báo trạng thái `dead` trong gói vị trí; người chết khoảng 2 giây rồi bị đưa về làng (đổi map nên rời phòng).

| Tình huống | Xử lý |
|---|---|
| Quái đang nhắm vào người vừa chết | Người chết **không còn là mục tiêu**. Quái chuyển ngay sang người **còn sống** trong tầm 600 px (ưu tiên người gây nhiều sát thương nhất, xem 11.3). Đòn đang gồng / lao tới dở thì để chạy hết rồi mới đổi. |
| Không còn ai sống trong tầm | Quái bỏ mục tiêu, xoá bảng hận thù, đứng lại / đi về chỗ cũ. |
| Người chết còn đánh được không | Chỉ trong 1,5 giây đầu sau khi chết (cho đạn đang bay kịp trúng). Sau đó server bỏ qua mọi đòn của người đó. |
| Người chết đã gây sát thương trước đó | Sát thương vẫn nằm trong máu quái (không hoàn lại). Nếu quái chết **khi người đó còn trong map** (trong ~2 giây trước khi về làng) thì vẫn có phiếu thưởng nếu đủ 10%. Đã về làng / rời map thì **không** có phiếu (không còn nhận được gói để đổi thưởng). |
| Người chết hồi sinh | Hồi sinh ở làng ở bản đồ khác (đã có sẵn trong game). Quay lại map cũ thì vào phòng như người mới, quái giữ nguyên máu hiện tại nếu trong 30 giây đó map vẫn còn người (map trống quá 30 giây thì quái hồi sinh đầy). |
| Cả nhóm chết | Quái bỏ cuộc. Trùm / thủ lĩnh không ai đánh trong 10 giây thì hồi 10% máu mỗi giây, đầy thì trở lại như mới (hết nổi giận, các quái phụ bị dọn). |

### 11.3 Chọn mục tiêu (hận thù)

1. Chưa ai đánh quái: quái nhắm **người sống gần nhất** lọt vào tầm phát hiện (220 px, trùm / thủ lĩnh 380 px, lệch độ cao < 160). Đã nhắm ai thì bám người đó tới khi họ chết / đi xa hơn 600 px.
2. Đã bị đánh: quái nhắm người có **tổng sát thương gây ra cao nhất** trong tầm 600 px. Người khác phải vượt 30% so với mục tiêu hiện tại mới kéo được quái sang (tránh đổi mục tiêu liên tục).
3. Người rời map / mất kết nối: bị loại khỏi bảng hận thù.

### 11.4 Rời map, mất kết nối, vào giữa trận

| Tình huống | Xử lý |
|---|---|
| Người chơi đang đánh thì rớt mạng | Rời phòng như người rời map, không còn phiếu cho trận này. Sát thương đã gây vẫn tính vào máu quái. |
| Vào map giữa lúc đang đánh trùm | Nhận toàn bộ danh sách quái kèm máu hiện tại, máu tối đa (đã tăng theo số người), cờ "nổi giận" / làm chậm / đóng băng. |
| Đòn đặc biệt của trùm | Server phát lệnh cho cả phòng; mỗi client tự diễn đòn nhắm vào **chính mình**, nên người chết hoặc ở xa không ảnh hưởng người khác. |
| Hai người cùng tung đòn kết liễu | Đòn tới server trước là đòn kết liễu; đòn sau bị bỏ qua nhưng sát thương trước đó vẫn tính cho phần chia thưởng. |

### 11.5 Chia thưởng

- Người kết liễu **và** mọi người gây ≥ 10% máu quái (máu tối đa lúc đó) **còn trong map** đều nhận **đủ** exp / vàng / đồ rơi / tiến độ nhiệm vụ của riêng mình (không chia nhỏ). Đồ rơi là đồ riêng từng người nên không tranh nhau.
- Exp vẫn giảm theo chênh lệch cấp giữa người chơi và quái như trước (quái thấp hơn 5 cấp trở lên còn 40%, 8 cấp trở lên còn 10%), nên người cấp cao kéo quái thấp để "ké" không lời.
- Dưới 10% thì không có phần (tránh đánh một đòn rồi hưởng).

### 11.6 Kiểm thử các trường hợp trên

Script mô phỏng trực tiếp lớp `World` (không cần client): A đánh trước → quái nhắm A; B gây nhiều hơn 30% → đổi sang B; B chết → quay lại A;
A chết → quái bỏ cuộc và xoá hận thù; đòn thừa không cộng vào phần chia thưởng; trùm có 4 người sống gần → máu tối đa ×2,5 giữ nguyên
tỉ lệ máu; không còn ai 25 giây → hồi đầy, hết nổi giận. Chạy lại script WebSocket hai tài khoản sau khi sửa: vẫn đúng (phiếu, nộp phiếu, hồi sinh, đổi map).
Chưa kiểm thử với hai người thật trên giao diện.

## 12. Giai đoạn 4: đội nhóm, giao dịch, chợ

### 12.1 Đánh giá tổng quan trước khi làm

**Đã có sẵn, dùng lại được**
- Server giữ nhân vật trong bộ nhớ (`cache.js`) và mọi thay đổi tiền / đồ đều đi qua `begin → sửa → commit → rollback nếu lỗi`, có số thứ tự `rev` và bản vá `patch` cho client.
- WebSocket đã nhận diện từng người (cookie phiên), biết ai ở map nào, vị trí, chết hay sống.
- Phiếu thưởng hạ quái (`claims`) cho phép thưởng cả người không tự nhận.

**Điểm nguy hiểm (đây mới là phần khó, không phải giao diện)**
1. **Sửa nhân vật của NGƯỜI KHÁC.** Trước giờ mỗi hành động chỉ sửa nhân vật của chính người gửi. Giao dịch / chợ sửa hai nhân vật cùng lúc (và người bán có thể đang offline). Cần một chỗ làm việc đó an toàn: đủ hai bên hoặc không bên nào, có hoàn tác.
2. **Client của người kia chưa biết mình vừa bị sửa.** Bản vá hiện chỉ trả về cho người gửi hành động. Phải đẩy bản vá qua WebSocket (có kiểm `rev`, lệch thì tự tải lại cả nhân vật).
3. **Nhân bản vật phẩm / tiền** (lỗi nghiêm trọng nhất của game có giao dịch): hai thao tác chạy xen kẽ, bấm đúp, rớt mạng giữa chừng, đổi map giữa lúc giao dịch. Cách chặn: mọi chuyển giao chạy **đồng bộ trong một lượt** của server, kiểm tra lại toàn bộ lúc thực hiện (không tin dữ liệu lúc đặt), mỗi tin chỉ có tác dụng một lần, chợ dùng điều kiện `status='active'` ngay trong câu lệnh SQL.
4. **Lừa đảo giữa người chơi** (đổi món vào phút chót, trả thiếu): khoá hai bước, **mọi thay đổi đều bỏ khoá cả hai bên** và có độ trễ 1,5 giây trước khi khoá lại, hiện đúng món đồ thật với chỉ số do server gửi.
5. **Kinh tế**: cần chỗ rút tiền khỏi game (thuế chợ 5%), giới hạn số tin đăng, giá hợp lệ.
6. **Cửa sổ lỗi khi sập máy giữa chừng**: hai nhân vật được lưu bằng hai lệnh ghi riêng. Giảm thiểu bằng ghi song song ngay lập tức + bảng nhật ký `trade_log` / `market_sales` để người quản trị đối soát. Vẫn còn cửa sổ nhỏ (xem 12.6).

### 12.2 Nền tảng chung

- `server/game/core/xplayer.js`: `mutate(userId, fn)` và `mutateTwo(a, b, fn)` — lấy nhân vật (từ cache hoặc DB nếu đang offline), `begin`, chạy `fn` **đồng bộ**, `commit`, lỗi thì `rollback` cả hai, rồi lưu ngay (`saveNow`) và **đẩy bản vá** cho client đang online qua WebSocket (gói `patch`).
- Client `Net.pushPatch`: nhận gói `patch`; `base` khớp `rev` hiện tại thì ghép, lệch thì tải lại cả nhân vật (cùng cơ chế với phản hồi HTTP).

### 12.3 Đội nhóm (`server/realtime/party.js`)
- Tối đa 5 người; mời người cùng map (bấm vào người chơi khác → "Mời vào đội"); lời mời hết hạn sau 30 giây; trưởng đội mời / đuổi / nhường; rời đội; chỉ còn 1 người thì tự giải tán.
- Đội giữ khi đổi map; mất kết nối được giữ chỗ 90 giây.
- **Chia kinh nghiệm**: thành viên cùng map, còn sống, trong 1200 px quanh quái được thưởng khi đồng đội hạ quái, dù không tự đánh: **50% kinh nghiệm + tiến độ nhiệm vụ / nhiệm vụ ngày**, không vàng, không đồ rơi. Người tự hạ được **+10% exp cho mỗi thành viên có mặt** (tối đa +40%).
- Kênh chat **Đội** (`/p`), thanh đội hình ở HUD (tên, cấp, thanh máu do client báo, chỉ để hiển thị), tên đồng đội màu xanh lá.

### 12.4 Giao dịch trực tiếp (`server/realtime/trade.js`)
- Hai người cùng map, cách nhau ≤ 600 px, đang sống, mỗi người chỉ một giao dịch.
- Mỗi bên đặt tối đa 8 món + xu. **Đổi bất kỳ thứ gì thì bỏ khoá cả hai bên.** Khoá chỉ bấm được sau 1,5 giây kể từ lần đổi gần nhất của **bất kỳ bên nào**. Cả hai khoá → server thực hiện.
- Không giao dịch được: vật phẩm nhiệm vụ, đồ đang mặc (phải tháo trước), vượt số xu đang có, túi người nhận không đủ chỗ.
- Tự huỷ khi: một bên huỷ, đổi map, chết, mất kết nối, đi xa quá 600 px, quá 3 phút.
- Ghi `trade_log` (hai tài khoản, danh sách đồ, xu, thời điểm).

### 12.5 Chợ người chơi (`server/game/actions/market.js`, bảng `market_listings`)
- Đăng bán ở làng: món bị **giữ trong DB** (rút khỏi túi), tối đa 10 tin đang bán, giá 1 – 999.999.999 xu, thời hạn 48 giờ.
- Mua: một câu lệnh SQL `UPDATE … WHERE status='active'` quyết định ai là người mua duy nhất; xu trừ người mua, đồ vào túi, **xu cộng người bán (đã trừ thuế 5%)** ngay cả khi người bán đang offline (cập nhật thẳng nhân vật của họ), người bán online nhận thông báo.
- Huỷ tin / lấy lại tin hết hạn về túi. Duyệt có tìm theo tên, loại, cấp, sắp xếp theo giá, 20 tin / trang.

### 12.6 Hạn chế đã biết
- Sập máy đúng lúc giữa hai lệnh lưu của một giao dịch / một lượt mua chợ có thể làm một bên nhận chưa kịp lưu. Có nhật ký để đối soát thủ công; chưa có cơ chế tự khôi phục.
- Chưa có thư / kho thư: tin hết hạn phải vào chợ lấy lại.
- Chưa có đấu giá, chưa có lịch sử giá, chưa chặn spam tin ảo giá cao (chỉ giới hạn 10 tin).
- Máu thành viên đội do client báo (chỉ hiển thị).

### 12.7 Đã làm (GĐ 4)

| Việc | File |
|---|---|
| Sửa nhân vật của người khác an toàn + đẩy bản vá qua WebSocket | `server/game/core/xplayer.js` (mới), `server/storage/cache.js` (`isBusy`), `server/realtime/index.js` (gói `patch`), `public/js/core/net.js` (`pushPatch`) |
| Luật chuyển đồ / xu giữa hai nhân vật | `server/game/core/exchange.js` (mới) |
| Đội nhóm (mời, rời, đuổi, nhường, chat đội, chia thưởng) | `server/realtime/party.js` (mới), phiếu thưởng `claims` có `party` / `bonus`, `server/game/actions/combat.js` |
| Giao dịch trực tiếp | `server/realtime/trade.js` (mới) |
| Chợ (đăng, duyệt, mua, huỷ / lấy lại, trả tiền người bán, thử lại) | `server/game/actions/market.js` (mới), bảng `market_listings` + `trade_log` (migration 6 trong `server/storage/db.js`) |
| Giao diện: thanh đội, lời mời, menu người chơi, cửa sổ giao dịch, chợ | `public/js/ui/social.js` (mới), `public/index.html`, `public/css/style.css`, `core/realtime.js`, `scene/remote.js`, `ui/chat.js` |

Ghi chú khi dùng:
- Bấm vào người chơi khác để mở menu: Mời vào đội / Giao dịch / Chặn chat. Nút 👥 mở bảng đội, nút 🛒 mở chợ (chỉ trong làng).
- Chat đội: `/p <nội dung>` hoặc nút đổi kênh (Map → Thế giới → Đội).
- Migration 6 tự chạy khi server khởi động (thêm bảng, không đổi dữ liệu cũ).

### 12.8 Đã kiểm thử (GĐ 4)

Script WebSocket + HTTP với 3 tài khoản (tất cả đạt):
- **Đội**: mời / đồng ý, chỉ trưởng mới mời và đuổi, không mời được người ở map khác, chat đội chỉ tới thành viên.
- **Chia thưởng đội**: người hạ nhận exp + xu (exp ×1,1 khi có 1 đồng đội), đồng đội đứng gần nhận ½ exp **không có xu**, người ngoài đội không nhận gì.
- **Giao dịch**: không mời được người ở xa; khoá ngay sau khi đổi bị từ chối (chờ 1,5 giây); đổi bất kỳ thứ gì thì bỏ khoá bên kia; đặt quá số xu đang có bị từ chối; hoàn tất đúng xu và đồ (stack + trang bị, `uid` cấp lại cho người nhận); cả hai nhận bản vá qua WebSocket; có `trade_log`; đổi map giữa chừng thì huỷ.
- **Đua với hành động HTTP**: vứt món đang đưa sau khi đã khoá thì giao dịch thất bại, xu và đồ không đổi, không ai nhận món; không có nhân bản hay mất đồ trong 5 vòng thử.
- **Chợ**: đăng / duyệt / mua / huỷ; không tự mua đồ của mình; **hai người mua cùng lúc chỉ một người thắng**; người bán nhận 95% giá (thuế 5%) cả khi **offline**, người bán online nhận thông báo + bản vá; huỷ lần hai bị từ chối; giá âm bị từ chối; ngoài làng không mở được chợ.
- **Giao diện** trên trình duyệt (máy tính): thanh đội hình, lời mời hiện đúng, đồng ý được; cửa sổ giao dịch hiện đồ hai bên, tooltip, đếm ngược nút Khoá, hoàn tất giao dịch và nhân vật cập nhật xu / túi ngay; cửa sổ chợ hiện tin của mình.
- Các tài khoản thử và dòng `trade_log` thử đã xoá khỏi database.

### 12.9 Chưa kiểm thử / còn thiếu (GĐ 4)
- Chưa thử giao dịch / chợ trên điện thoại (bố cục cửa sổ đã dùng co giãn nhưng chưa nhìn thử); nhập số lượng / giá dùng hộp thoại hệ thống của trình duyệt.
- Chưa thử với hai người thật; chưa thử mua / huỷ chợ qua giao diện (đã thử qua API).
- Cơ chế tự trả tiền lại cho người bán (`settleUnpaid`, chạy mỗi 60 giây) mới kiểm tra việc trả tiền bình thường, chưa mô phỏng lỗi để thấy nó thử lại.
- Cửa sổ lỗi khi sập máy đúng giữa hai lệnh lưu (xem 12.6) chưa được xử lý tự động.
- Chưa có thư, đấu giá, lịch sử giá, danh sách bạn bè; chưa chuyển bản vá khi đội thay đổi ở nhiều tiến trình (đội nằm trong bộ nhớ một tiến trình).
