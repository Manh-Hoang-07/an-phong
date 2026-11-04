# Thức Tỉnh

Game nhập vai thợ săn 2D màn hình ngang, chơi trên trình duyệt (máy tính và điện thoại). Thợ săn thức tỉnh, vào các cổng dịch chuyển, chọn class và lên hạng.
Game tự lưu mọi thứ (tiền, vật phẩm, cấp, nhiệm vụ, vị trí) vào file SQLite trên server, không cần bấm lưu.

## Chạy trên máy

Cần Node.js **22.13 trở lên** (khuyên dùng bản 24 LTS).

```bash
npm install
npm start
```

Mở http://127.0.0.1:3100. Lần đầu vào, bạn tạo tài khoản. Sau đó trang đăng ký tự đóng, người khác không tạo thêm tài khoản được.

- Muốn điện thoại cùng wifi vào chơi: chạy `HOST=0.0.0.0 npm start` (trên Windows PowerShell: `$env:HOST='0.0.0.0'; npm start`) rồi mở `http://<IP máy tính>:3100` trên điện thoại.
- Dữ liệu nằm ở `data/anphong.db`. Sao lưu: `npm run backup`. File sao lưu nằm trong thư mục `backups/`.
- Quên mật khẩu: `node server/reset-password.js <tên đăng nhập> <mật khẩu mới>`.

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
- Toàn Năng: máu, tấn công, năng lượng +200% (gấp 3), dùng mọi vũ khí, học cả 15 kỹ năng của 3 class cùng tuyệt kỹ riêng **Thức Tỉnh Tối Thượng**, có cả 3 nội tại và thêm 1 ô kỹ năng. Muốn giảm sức mạnh thì sửa `bonus` của `toan_nang` trong `shared/data.js`.
- **Mật mã nằm trong file `data/giftcodes.json`** (tự tạo lần đầu chạy server, mã cũng được in ra màn hình console). Trên Ubuntu là `/var/lib/anphong/giftcodes.json`.
- Có thể thêm mã quà tặng khác vào file này, sửa xong có hiệu lực ngay, không cần khởi động lại server. Mỗi tài khoản dùng mỗi mã một lần. Ví dụ:

```json
{ "code": "QUA-TET", "note": "Quà Tết", "rewards": { "gold": 1000, "skillPoints": 2, "items": [["da_cuong_hoa", 5]] } }
```

## Nội dung hiện có (chương 1)

- 4 bản đồ: Cổng đỏ chưa phân hạng (màn mở đầu), Tân Đô – Khu Hiệp Hội, Cổng hạng E – Rừng Sương, Cổng hạng D – Hang Pha Lê.
- **Chương 1 "Cổng đỏ" có 11 nhiệm vụ:**
  - Mở đầu: tỉnh dậy kẹt trong Cổng đỏ, Hệ thống giao nhiệm vụ đầu tiên.
  - Đồng đội: Vy, thợ săn hạng C, đi cùng qua Rừng Sương và Hang Pha Lê.
  - Phản diện: nhóm Hắc Nguyệt và Kẻ Đeo Mặt Nạ Trăng.
  - Kết thúc bằng trận đánh trùm Thạch Vương.
- **Nhiệm vụ hằng ngày** ở Bảng nhiệm vụ trong Tân Đô: mỗi ngày 3 nhiệm vụ (hạ quái, thu thập Lõi năng lượng, hạ trùm), làm mới lúc 0 giờ (giờ Việt Nam). Xong cả 3 nhận thêm đá cường hóa và 1 Sách kỹ năng.
- **Quái báo trước đòn đánh:** đứng lại nháy đỏ rồi mới lao tới, chỉ gây sát thương lúc lao, nên luôn né kịp.
- **Trùm 2 giai đoạn:** dưới 50% máu, Thạch Vương nổi giận, gọi thêm Bộ Xương Pha Lê và tung sóng đá chạy dọc mặt đất (phải nhảy qua).
- **Âm thanh và nhạc nền** tạo bằng code, mỗi bản đồ một bản nhạc. Bật tắt ở tab Nhân vật.
- Mỗi lần lên cấp được 3 điểm tiềm năng.
- **10 ô trang bị:** vũ khí, mũ, áo, găng tay, đai lưng, quần, giày, nhẫn, dây chuyền, ngọc bội.
- **Trang bị chia bộ theo cấp:** cứ 10 cấp là một bộ – Bộ Tân Binh (cấp 1–10) và Bộ Thạch Vương (cấp 11–20). Trong mỗi bộ, từng món có cấp sử dụng riêng nên mở dần khi lên cấp, và bộ nào cũng phủ đủ 10 ô.
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
- Có cửa hàng (bán đồ Thường, chỉ số chuẩn) và kho đồ. Túi đồ có 40 ô.

## Tự sửa game

- **Cân chỉnh** (máu quái, giá đồ, phần thưởng, kỹ năng, nhiệm vụ): sửa `shared/data.js`.
- **Bản đồ**: sửa file chữ trong `shared/maps/`. Ký hiệu:

```
.  trống            #  đất              =  bục gỗ (nhảy lên từ dưới được)
S  điểm xuất hiện   < >  cổng chuyển bản đồ
a-z  quái (xem "spawns" của bản đồ trong data.js)
A-Z  NPC  (xem "npcs" của bản đồ trong data.js)
&  cây/tre   $  nhà   !  đèn lồng   ^  nhũ đá
```

Nhân vật nhảy cao được khoảng 3 ô, nên đặt các bục cách nhau tối đa 3 hàng.
Sửa xong thì tải lại trang là thấy bản đồ mới. Riêng file `shared/data.js` thì phải khởi động lại server.

## Đưa lên server Ubuntu

Các lệnh dưới dùng tên miền ví dụ `game.ten-mien-cua-ban.vn`, hãy thay bằng tên miền của bạn.

```bash
# 1. Cài Node.js 24 và Nginx
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs nginx

# 2. Tạo user riêng, thư mục dữ liệu và thư mục sao lưu
sudo useradd --system --home /opt/anphong --shell /usr/sbin/nologin anphong
sudo mkdir -p /opt/anphong /var/lib/anphong /var/backups/anphong
sudo chown anphong:anphong /var/lib/anphong /var/backups/anphong

# 3. Chép mã nguồn lên /opt/anphong (git clone hoặc scp), rồi cài thư viện
cd /opt/anphong && sudo npm ci --omit=dev

# 4. Chạy như một dịch vụ (tự khởi động lại khi lỗi hoặc khi server reboot)
sudo cp deploy/anphong.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now anphong
sudo systemctl status anphong

# 5. Nginx và HTTPS (sửa server_name trong file trước)
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
0 3 * * * cd /opt/anphong && DATA_DIR=/var/lib/anphong BACKUP_DIR=/var/backups/anphong /usr/bin/node server/backup.js
```

**Cập nhật game về sau:** chép mã mới lên, rồi chạy:

```bash
sudo systemctl restart anphong
```

Dữ liệu trong `/var/lib/anphong` được giữ nguyên.

Mở trang game, tạo tài khoản đầu tiên là xong. Nhớ vào game và tạo tài khoản **ngay** sau khi đưa lên, trước khi người khác kịp vào.

## Hình ảnh

- Nhân vật và quái dùng sprite sheet của **LuizMelo** (giấy phép CC0, xem `public/assets/CREDITS.txt`): Fantasy Warrior (chưa thức tỉnh), Martial Hero 3 (Kiếm Sĩ), Huntress 2 (Cung Thủ), Wizard Pack (Pháp Sư), EVil Wizard 2 (Toàn Năng), Monsters Creatures Fantasy 1 và 2 (Nấm Độc, Yêu Tinh, Slime Sương, Dơi Hang, Bộ Xương Pha Lê, Mắt Đỏ).
- Cỡ và vị trí chân của từng bộ chỉnh trong `public/js/sprites.js`. Thiếu ảnh nào thì game tự dùng lại hình vẽ bằng code (`public/js/art.js`).
- Hiệu ứng (tia lửa, bụi bước chân, phát sáng, thời tiết, quay chậm) nằm trong `public/js/juice.js`.
