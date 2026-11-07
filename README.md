# Thức Tỉnh

Game nhập vai thợ săn 2D màn hình ngang, chơi trên trình duyệt (máy tính và điện thoại). Thợ săn thức tỉnh, vào các cổng dịch chuyển, chọn class và lên hạng.
Game tự lưu mọi thứ (tiền, vật phẩm, cấp, nhiệm vụ, vị trí) vào PostgreSQL trên server, không cần bấm lưu.

## Chạy trên máy

Cần Node.js **22.13 trở lên** (khuyên dùng bản 24 LTS) và **PostgreSQL 14 trở lên** đang chạy.

```bash
# 1. Tạo database (một lần)
psql -U postgres -c "CREATE DATABASE anphong ENCODING 'UTF8';"

# 2. Cài thư viện và chạy
npm install
npm start
```

Thông tin kết nối đặt trong file `.env` ở thư mục gốc (file này không được commit):

```
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=postgres
PGPASSWORD=mật_khẩu_của_bạn
PGDATABASE=anphong
```

Muốn dùng một chuỗi kết nối duy nhất thì thay cả 5 dòng trên bằng `DATABASE_URL=postgres://user:pass@127.0.0.1:5432/anphong`.

Mở http://127.0.0.1:3100. Đăng ký luôn mở: bấm "Chưa có tài khoản? Đăng ký" để tạo tài khoản mới bất cứ lúc nào. Muốn đóng đăng ký thì đặt `ALLOW_REGISTER=0` khi chạy server.

- Muốn điện thoại cùng wifi vào chơi: chạy `HOST=0.0.0.0 npm start` (trên Windows PowerShell: `$env:HOST='0.0.0.0'; npm start`) rồi mở `http://<IP máy tính>:3100` trên điện thoại.
- Dữ liệu nằm trong **một** database PostgreSQL. Sao lưu: `npm run backup` (dùng `pg_dump`, file `.dump` trong `backups/`; phục hồi bằng `pg_restore --clean --no-owner -d anphong backups/anphong-....dump`).
- Quên mật khẩu: `node server/tools/reset-password.js <tên đăng nhập> <mật khẩu mới>`.
- Tra cứu / khóa tài khoản, khôi phục nhân vật: `node server/tools/user.js` (xem mục *Database* bên dưới).

### Database

| Bảng | Nội dung |
|---|---|
| `users` | tài khoản, lần đăng nhập cuối (`last_login`, `last_ip`), khóa (`banned`, `ban_reason`) |
| `sessions` | phiên đăng nhập (lưu hash của token) kèm thời điểm tạo, IP, trình duyệt |
| `players` | nhân vật (kiểu `JSON`, tra cứu được bằng `data->>'level'`) |
| `auth_log` | nhật ký: `register`, `login`, `login_fail`, `login_banned`, `logout`, `password_reset`, `ban`, `unban`, `restore`. Giữ 90 ngày (`AUTH_LOG_DAYS`) |
| `player_snapshots` | bản chụp nhân vật, cứ 30 phút chơi một bản, giữ 20 bản mới nhất mỗi tài khoản (`SNAPSHOT_KEEP`) |
| `gift_codes`, `gift_redemptions` | mã quà tặng và ai đã dùng |
| `schema_migrations` | bước nâng cấp cấu trúc đã chạy |

Cấu trúc bảng tự nâng cấp khi server khởi động (danh sách `MIGRATIONS` trong `server/db.js`). Muốn đổi cấu trúc thì **thêm** bước mới vào cuối danh sách, không sửa bước cũ.

```bash
node server/tools/user.js info <tên>                 # thông tin + nhật ký gần nhất
node server/tools/user.js log <tên> 100              # 100 dòng nhật ký
node server/tools/user.js ban <tên> "gian lận"       # khóa + đăng xuất mọi phiên
node server/tools/user.js unban <tên>
node server/tools/user.js snapshots <tên>            # danh sách bản chụp
node server/tools/user.js restore <tên> <id>         # TẮT SERVER TRƯỚC khi khôi phục
```

Khóa tài khoản hay đổi mật khẩu bằng công cụ sẽ có hiệu lực với server đang chạy sau tối đa 60 giây.

**Cách server ghi dữ liệu** (`server/cache.js`): nhân vật đang chơi và phiên đăng nhập được giữ trong bộ nhớ.
Hạ quái và lưu vị trí được ghi gộp mỗi 4 giây (`FLUSH_MS`); mọi hành động khác (mua bán, nâng cấp, nhận quà, nhiệm vụ...) ghi ngay.
Tắt server bình thường (`systemctl stop/restart`, Ctrl+C) thì phần còn chờ được ghi hết trước khi thoát; chỉ khi server sập đột ngột mới mất tối đa vài giây tiến trình đánh quái.
Nếu sau này chạy nhiều tiến trình / nhiều máy, thay phần bên trong `server/cache.js` bằng Redis.
- Server tự gộp toàn bộ code game và bản đồ thành một file, tự nén và gắn mã phiên bản (xem `server/static.js`). Sửa file trong `public/` hay `shared/` là có hiệu lực ngay khi tải lại trang, không cần build. Muốn gỡ lỗi từng file riêng thì chạy với `NO_BUNDLE=1`.

## Điều khiển

| Phím | Tác dụng |
|---|---|
| ← → hoặc A D | Di chuyển |
| Space / ↑ / W | Nhảy (giữ ↓ rồi nhảy để xuống khỏi bục) |
| J (giữ được) | Đánh thường |
| 1 2 3 4 | Kỹ năng (Toàn Năng có thêm phím 5) |
| R | Tuyệt kỹ |
| Q / E | Bình máu / bình năng lượng |
| F hoặc Enter | Nói chuyện với NPC |
| I · C · K · L | Mở menu ở tab Túi đồ · Nhân vật · Kỹ năng · Nhiệm vụ |
| Esc | Đóng bảng |

**Trên điện thoại** (xoay ngang màn hình):
- Nửa trái màn hình là cần điều khiển: chạm vào đâu cũng được rồi kéo để chạy, kéo lên để nhảy, kéo xuống rồi nhảy để xuống khỏi bục.
- Bên phải là nút ⚔ đánh (giữ để đánh liên tục), ⤒ nhảy, 4 nút kỹ năng, nút ★ tuyệt kỹ, 🧪 bình máu và 💧 bình năng lượng.
- Đi tới gần NPC sẽ hiện nút 💬 để nói chuyện.
- Nút ☰ ở góc trên mở menu có các tab: Túi đồ, Nhân vật, Kỹ năng, Nhiệm vụ. Nút toàn màn hình và đăng xuất nằm trong tab Nhân vật.

Mở bằng Chrome, chọn "Thêm vào màn hình chính" là game mở toàn màn hình như một app.
Trên máy tính, muốn thử giao diện điện thoại thì thêm `?touch=1` vào cuối địa chỉ.

## Class và kỹ năng

- Thức tỉnh class ở cấp 5 tại Hội trưởng Khải: **Kiếm Sĩ** (kiếm), **Cung Thủ** (cung), **Pháp Sư** (trượng).
- Mỗi class có **5 kỹ năng chủ động** (1 trong số đó là tuyệt kỹ, mở ở cấp 20) và **1 nội tại**.
- **Điểm kỹ năng:** mỗi lần lên cấp +1 điểm, xong chương 1 thưởng +2, **Sách kỹ năng** (trùm rơi) +1.
  - Học kỹ năng tốn 1 điểm, mỗi cấp sau tốn thêm 1 điểm, tối đa cấp 10.
  - Mỗi cấp: sức mạnh +10%. Cấp 10: hồi chiêu -15%.
  - Cấp 5 và cấp 10 mở thêm hiệu ứng riêng của từng kỹ năng.
  - Tẩy điểm ở Hội trưởng Khải (tốn 100 xu × cấp nhân vật).
- Thanh kỹ năng có 4 ô thường và 1 ô tuyệt kỹ, tự chọn kỹ năng đặt vào ô trong tab Kỹ năng.

### Class đặc biệt Toàn Năng và mật mã

- Toàn Năng **không có trong danh sách chọn**. Phải nói mật mã với **Lữ khách bí ẩn** (đứng cạnh cổng ở Tân Đô), rồi thức tỉnh ở chính NPC đó (cần cấp 5). Đang có class khác vẫn đổi được, điểm kỹ năng được trả lại.
- Toàn Năng: máu, tấn công, năng lượng +200% (gấp 3), dùng mọi vũ khí, học cả 15 kỹ năng của 3 class cùng tuyệt kỹ riêng **Thức Tỉnh Tối Thượng**, có cả 3 nội tại và thêm 1 ô kỹ năng. Muốn giảm sức mạnh thì sửa `bonus` của `toan_nang` trong `shared/data/classes.js`.
- **Mật mã lưu trong PostgreSQL** (bảng `gift_codes`).
- Mỗi tài khoản dùng mỗi mã một lần. Ngoài ra mỗi mã có thể **giới hạn tổng số lượt** (`--max-uses`) và **hạn dùng** (`--expires`), hoặc để trống cho không giới hạn.
- Tạo mã bằng lệnh, có hiệu lực ngay không cần khởi động lại server:

```bash
# mã tự sinh dạng QUA-XXXXXX: 1000 xu, 2 điểm kỹ năng, 5 đá cường hóa, tối đa 20 lượt, hết hạn 31/12
npm run giftcode -- add --note "Quà Tết" --gold 1000 --skill-points 2 --item da_cuong_hoa 5 --max-uses 20 --expires 2026-12-31

# mã tự đặt tên, không giới hạn lượt
npm run giftcode -- add QUA-TET --gold 1000

# mở class Toàn Năng cho người nhận mã
npm run giftcode -- add TOANNANG-MOI --unlock-class toan_nang

# xem tất cả mã (đã dùng bao nhiêu lượt, còn hạn không)
npm run giftcode -- list

# xoá mã (kèm danh sách người đã dùng)
npm run giftcode -- remove QUA-TET
```

## Nội dung hiện có (chương 1–5 và end-game)

- **27 bản đồ** từ Cổng đỏ, Tân Đô, các cổng hạng E–SS đến Cổng SS – Vực Không Cùng.
- **46 nhiệm vụ chính** qua 5 chương, kết thúc ở Thực Thể Bên Kia Cổng; sau đó mở Cổng SS để chơi tiếp.
- **Nội tại cốt truyện** nhận theo nhiệm vụ: Ý Chí Thầy Truyền, Nhận Thức Ký Sinh, Liên Minh, Trạng Thái Tự Do, Đồng Đội Bình Minh.
- **Phụ tuyến:** Đội Bình Minh của Vy, hàng thất lạc của Chủ tiệm Tư (giảm giá và mở thêm hàng), mở rộng túi của Quản kho Bảo (+10 ô × 3 bậc) và thuốc chữa nhiễm đỏ của Dược sư Lan.
- **Nhiệm vụ hằng ngày** ở Bảng nhiệm vụ trong Tân Đô: mỗi ngày 3 nhiệm vụ (hạ quái, thu thập Lõi năng lượng, hạ trùm), làm mới lúc 0 giờ (giờ Việt Nam). Xong cả 3 nhận thêm đá cường hóa và 1 Sách kỹ năng.
- **Nhiệm vụ hằng tuần:** hạ 200 quái và 5 trùm, nhận đá cường hóa, đá cường hóa cao, xu, kinh nghiệm và Sách kỹ năng; làm mới vào thứ Hai.
- **Quái báo trước đòn đánh:** đứng lại nháy đỏ rồi mới lao tới, chỉ gây sát thương lúc lao, nên luôn né kịp.
- **Trùm 2 giai đoạn:** dưới 50% máu, Thạch Vương nổi giận, gọi thêm Bộ Xương Pha Lê và tung sóng đá chạy dọc mặt đất (phải nhảy qua).
- **Âm thanh và nhạc nền** tạo bằng code, mỗi bản đồ một bản nhạc. Bật tắt ở tab Nhân vật.
- Mỗi lần lên cấp được 3 điểm tiềm năng.
- **10 ô trang bị:** vũ khí, mũ, áo, găng tay, đai lưng, quần, giày, nhẫn, dây chuyền, ngọc bội.
- **Trang bị chia bộ theo cấp:** cứ 10 cấp là một bộ – Tân Binh (1–10), Thạch Vương (11–20), Băng Long (21–30), Lưu Trữ (31–40), Vĩnh Hằng (41–50). Trong mỗi bộ, từng món có cấp sử dụng riêng nên mở dần khi lên cấp, và bộ nào cũng phủ đủ 10 ô.
- **Đồ rơi từ quái là ngẫu nhiên:**
  - Chỉ số chính dao động 80–120%.
  - Phẩm chất: Thường (trắng), Tốt (xanh), Hiếm (tím), Huyền thoại (vàng), tỉ lệ khoảng 62% / 30% / 7% / 1%. Trùm luôn rơi đồ Hiếm hoặc Huyền thoại.
  - Phẩm chất càng cao thì chỉ số chính càng mạnh và có thêm 1–3 dòng phụ ngẫu nhiên: máu, năng lượng, tấn công, phòng thủ, chí mạng, hút máu, giảm hồi chiêu, tốc chạy, sát thương lên trùm, xu rơi thêm, kinh nghiệm thêm.
  - Mỗi món có **độ hoàn hảo** (0–100%) cho biết chỉ số ra cao hay thấp.
  - Đồ rơi nằm trên đất, đi qua là tự nhặt, tồn tại 3 phút. Xem đồ trong túi sẽ thấy so sánh với món đang mặc (▲ ▼).
- **Thợ rèn:**
  - Nâng cấp tới +12; từ +8 trở đi, thất bại sẽ bị giảm 1 cấp.
  - Tẩy luyện: gieo lại dòng phụ.
  - Phân rã: đổi đồ thừa lấy đá cường hóa.
- Có cửa hàng (bán đồ Thường, chỉ số chuẩn) và kho đồ. Túi đồ có 40 ô, mở rộng tối đa lên 70 ô bằng phụ tuyến Kho chật quá.

## Tự sửa game

- **Cân chỉnh**: sửa các file trong `shared/data/` (xem bảng *Cấu trúc thư mục* bên dưới): class ở `classes.js`, kỹ năng ở `skills.js`, vật phẩm ở `items.js`, phẩm chất / nâng cấp ở `equipment.js`, quái ở `monsters.js`, NPC ở `npcs.js`, nhiệm vụ trong `quests/`.
- **Bản đồ**: sửa file chữ trong `shared/maps/`. Ký hiệu:

```
.  trống            #  đất              =  bục gỗ (nhảy lên từ dưới được)
S  điểm xuất hiện   < >  cổng chuyển bản đồ
a-z  quái (xem "spawns" của bản đồ trong shared/data/maps.js)
A-Z  NPC  (xem "npcs" của bản đồ trong shared/data/maps.js)
&  cây/tre   $  nhà   !  đèn lồng   ^  nhũ đá
```

Nhân vật nhảy cao được khoảng 3 ô, nên đặt các bục cách nhau tối đa 3 hàng.
Sửa xong thì tải lại trang là thấy bản đồ mới. Riêng các file `.js` trong `shared/` thì phải khởi động lại server.

## Cấu trúc thư mục

```
shared/                 Dữ liệu + luật tính toán dùng chung cho server và trình duyệt (biến GameData)
  core.js               Hằng số chung, công thức kinh nghiệm, hạng thợ săn
  index.js              Server nạp file này (danh sách file theo đúng thứ tự)
  data/                 Bảng dữ liệu để cân chỉnh game
    classes.js skills.js items.js equipment.js monsters.js npcs.js maps.js
    quests/             chapter1.js (chính tuyến), side.js (phụ tuyến), periodic.js (ngày/tuần), legacy.js
  logic/                Hàm tính toán: player.js (calcStats...), items.js, skills.js, monsters.js, quests.js, shop.js
  maps/                 Bố cục ô của từng bản đồ (*.txt)
server/
  index.js              Máy chủ HTTP, đăng nhập, API
  db.js                 PostgreSQL: kết nối, migration, truy vấn
  cache.js              Phiên đăng nhập + nhân vật đang chơi trong bộ nhớ, ghi gộp
  auth.js codes.js backup.js static.js
  game/                 Luật chơi phía server
    index.js            handle() + migrate() (sửa save cũ)
    inventory.js progress.js quests.js periodic.js util.js
    actions/            Từng nhóm hành động: world, combat, quests, items, smith, character
  tools/                reset-password.js, user.js (tra cứu / khóa / khôi phục), giftcode.js
public/
  index.html            Nạp các file JS theo đúng thứ tự (có chú thích từng nhóm)
  js/core/              sound.js, net.js, main.js (khởi động)
  js/art/               art.js (bút vẽ) + hình vẽ bằng code từng nhóm, fx.js, sprites.js
  js/ui/                ui.js (HUD + khung bảng), panels/*.js (từng bảng), actions.js (bấm nút)
  js/scene/             world.js (WorldScene) + map, player, monsters, combat, boss, skills, loot, juice
```

**Thêm file JS mới:** trình duyệt không có bundler, nên phải thêm thẻ `<script>` vào `public/index.html` đúng thứ tự;
file trong `shared/` thì thêm cả vào `shared/index.js`. Mỗi file tự gắn phần của mình vào biến chung
(`GameData`, `UI`, `Art`, `WorldScene.prototype`).

## Đưa lên server Ubuntu

### Cách nhanh: một lệnh trên VPS

Chép mã nguồn lên VPS (ví dụ `/opt/anphong`), rồi chạy:

```bash
cd /opt/anphong
sudo bash deploy/setup-vps.sh --domain game.ten-mien-cua-ban.vn
```

Script [deploy/setup-vps.sh](deploy/setup-vps.sh) cài Node.js 24, PostgreSQL 18 và Nginx. Nó tạo role và database `anphong` với mật khẩu ngẫu nhiên, lưu trong `/etc/anphong.env`, tạo bảng, cài dịch vụ systemd, đặt lịch sao lưu lúc 3 giờ sáng và cấu hình Nginx. Chạy lại script nhiều lần cũng an toàn: dữ liệu và mật khẩu cũ được giữ nguyên. Không có tên miền thì bỏ `--domain` và vào game bằng IP.

**Mang dữ liệu từ máy đang chạy lên VPS:** trên máy cũ chạy `npm run backup`, chép file `.dump` lên VPS, rồi chạy script kèm `--restore`:

```bash
sudo bash deploy/setup-vps.sh --domain game.ten-mien-cua-ban.vn --restore /tmp/anphong-2026-....dump
```

Script chỉ phục hồi khi database trên VPS chưa có tài khoản nào, để không ghi đè dữ liệu thật.

### Cách làm tay

Các lệnh dưới dùng tên miền ví dụ `game.ten-mien-cua-ban.vn`, hãy thay bằng tên miền của bạn.

```bash
# 1. Cài Node.js 24, Nginx và PostgreSQL
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs nginx postgresql

# 2. Tạo database cho game (đổi mật khẩu bên dưới)
sudo -u postgres psql -c "CREATE USER anphong WITH PASSWORD 'doi-mat-khau-nay';"
sudo -u postgres psql -c "CREATE DATABASE anphong OWNER anphong ENCODING 'UTF8';"

# 3. Tạo user riêng, thư mục dữ liệu và thư mục sao lưu
sudo useradd --system --home /opt/anphong --shell /usr/sbin/nologin anphong
sudo mkdir -p /opt/anphong /var/backups/anphong
sudo chown anphong:anphong /var/backups/anphong

# 4. Chép mã nguồn lên /opt/anphong (git clone hoặc scp), rồi cài thư viện
cd /opt/anphong && sudo npm ci --omit=dev

# 5. Cấu hình kết nối PostgreSQL cho dịch vụ
sudo tee /etc/anphong.env >/dev/null <<'EOF'
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=anphong
PGPASSWORD=doi-mat-khau-nay
PGDATABASE=anphong
EOF
sudo chown root:anphong /etc/anphong.env && sudo chmod 640 /etc/anphong.env

# 6. Chạy như một dịch vụ (tự khởi động lại khi lỗi hoặc khi server reboot)
sudo cp deploy/anphong.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now anphong
sudo systemctl status anphong

# 7. Nginx và HTTPS (sửa server_name trong file trước)
sudo cp deploy/nginx-anphong.conf /etc/nginx/sites-available/anphong
sudo ln -s /etc/nginx/sites-available/anphong /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d game.ten-mien-cua-ban.vn
```

Sau khi có HTTPS, mở `/etc/systemd/system/anphong.service`, bỏ dấu `#` ở dòng `COOKIE_SECURE=1`, rồi chạy:

```bash
sudo systemctl daemon-reload && sudo systemctl restart anphong
```

**Sao lưu tự động mỗi ngày lúc 3 giờ sáng.** Chạy `sudo crontab -u anphong -e` rồi thêm dòng:

```
0 3 * * * cd /opt/anphong && BACKUP_DIR=/var/backups/anphong /usr/bin/node --env-file=/etc/anphong.env server/backup.js
```

**Cập nhật game về sau:** chép mã mới lên, rồi chạy:

```bash
sudo systemctl restart anphong
```

Dữ liệu trong PostgreSQL được giữ nguyên; nếu bản mới có thay đổi cấu trúc bảng thì server tự nâng cấp khi khởi động. Nên `npm run backup` trước khi cập nhật.

Mở trang game, tạo tài khoản đầu tiên là xong. Nhớ vào game và tạo tài khoản **ngay** sau khi đưa lên, trước khi người khác kịp vào.

## Hình ảnh

- Nhân vật và quái dùng sprite sheet của **LuizMelo** (giấy phép CC0, xem `public/assets/CREDITS.txt`): Fantasy Warrior (chưa thức tỉnh), Martial Hero 3 (Kiếm Sĩ), Huntress 2 (Cung Thủ), Wizard Pack (Pháp Sư), EVil Wizard 2 (Toàn Năng), Monsters Creatures Fantasy 1 và 2 (Nấm Độc, Yêu Tinh, Slime Sương, Dơi Hang, Bộ Xương Pha Lê, Mắt Đỏ).
- Thú triệu hồi dùng sprite từ các bộ CC0: **Animated Wild Animals** (ScratchIO), **pixel horse** (alizard), ảnh hạc của rmazanek và ảnh thằn lằn của Karmabub. Có thể gọi nhiều thú cùng lúc; nguồn trong `public/assets/CREDITS.txt`.
- Cỡ và vị trí chân của từng bộ chỉnh trong `public/js/sprites.js`. Thiếu ảnh nào thì game tự dùng lại hình vẽ bằng code (`public/js/art.js`).
- Hiệu ứng (tia lửa, bụi bước chân, phát sáng, thời tiết, quay chậm) nằm trong `public/js/juice.js`.
