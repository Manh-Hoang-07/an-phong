# Ẩn Phong

Game nhập vai ninja 2D màn hình ngang, chơi trên trình duyệt (máy tính và điện thoại).
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
| Space / ↑ / W | Nhảy (giữ ↓ rồi nhảy để xuống khỏi bục gỗ) |
| J (giữ được) | Đánh thường |
| 1 2 3 | Kỹ năng |
| Q / E | Bình máu / bình nội lực |
| F hoặc Enter | Nói chuyện với NPC |
| I · C · K · L | Túi đồ · Nhân vật · Kỹ năng · Nhiệm vụ |
| Esc | Đóng bảng |

**Trên điện thoại** (xoay ngang màn hình):
- Nửa trái màn hình là cần điều khiển: chạm vào đâu cũng được rồi kéo để chạy, kéo lên để nhảy, kéo xuống rồi nhảy để xuống khỏi bục gỗ.
- Bên phải là nút ⚔ đánh (giữ để đánh liên tục), ⤒ nhảy, 3 nút kỹ năng, 🧪 bình máu và 💧 bình nội lực.
- Đi tới gần NPC sẽ hiện nút 💬 để nói chuyện.
- Nút ⛶ ở góc trên để bật toàn màn hình.

Mở bằng Chrome, chọn "Thêm vào màn hình chính" là game mở toàn màn hình như một app.
Trên máy tính, muốn thử giao diện điện thoại thì thêm `?touch=1` vào cuối địa chỉ.

## Nội dung hiện có (chương 1–3)

- 3 bản đồ: Làng Trúc Khê, Rừng Tre Sương, Hang Đá Ngầm.
- 8 nhiệm vụ chính tuyến, kết thúc bằng trận đánh trùm Thạch Quỷ.
- 4 trường phái, chọn ở cấp 5:
  - **Phong Ảnh** (kiếm)
  - **Hỏa Liên** (phi tiêu)
  - **Thủy Nguyệt** (quạt)
  - **Vạn Pháp** (toàn năng): dùng mọi vũ khí, tự chọn 3 kỹ năng bất kỳ trong 9 kỹ năng. Đổi lại kỹ năng chỉ gây 80% sức mạnh và tốn thêm 20% nội lực.
- Mỗi lần lên cấp được 3 điểm tiềm năng.
- **10 ô trang bị:** vũ khí, mũ, áo, găng tay, đai lưng, quần, giày, nhẫn, dây chuyền, ngọc bội.
- **Đồ rơi từ quái là ngẫu nhiên:**
  - Chỉ số chính dao động 80–120%.
  - Phẩm chất: Thường (trắng), Tốt (xanh), Hiếm (tím), Huyền thoại (vàng), tỉ lệ khoảng 62% / 30% / 7% / 1%. Trùm luôn rơi đồ Hiếm hoặc Huyền thoại.
  - Phẩm chất càng cao thì chỉ số chính càng mạnh và có thêm 1–3 dòng phụ ngẫu nhiên: máu, nội lực, tấn công, phòng thủ, chí mạng, hút máu, giảm hồi chiêu, tốc chạy, sát thương lên trùm, xu rơi thêm, kinh nghiệm thêm.
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
