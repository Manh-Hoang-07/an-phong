# Kế hoạch: Trang Admin

Trạng thái: **kế hoạch, chưa thực hiện**. Làm đơn giản: một trang, vài ô nhập, không phụ thuộc thư viện ngoài.

## 1. Mục tiêu

Admin đăng nhập bằng tài khoản game bình thường, mở `/admin.html` và làm được:

1. **Tặng cho nhân vật:** xu, kinh nghiệm, Linh Ngọc, điểm kỹ năng, vật phẩm (kể cả sách kỹ năng / tuyệt kỹ), mở khóa class, thú đồng hành.
2. **Quản lý mật mã:** xem danh sách, tạo, xóa (thay cho lệnh `npm run giftcode`).
3. **Quản lý tài khoản:** tìm người chơi, khóa / mở khóa.
4. **Nhật ký:** mọi thao tác admin đều ghi lại, để tra khi có tranh chấp.

Không làm ở đợt này: sửa chỉ số tùy ý, xóa nhân vật, xem bản đồ trực tiếp, chat với người chơi, đổi mật khẩu (đã có `reset-password.js`).

## 2. Cách hoạt động ở mức tổng quát

```
Trình duyệt (admin.html + admin.js)
   │  POST /api/admin/<hành động>   (JSON, cùng cookie phiên của game)
   ▼
server/http/admin.js  ── kiểm tra is_admin ──► làm việc ──► ghi admin_log
```

Không có hệ đăng nhập thứ hai. Admin là một tài khoản game có cờ `is_admin = true`.

## 3. Quyền admin

- Thêm cột `users.is_admin BOOLEAN NOT NULL DEFAULT false` bằng **một migration mới** trong `server/storage/db.js` (thêm vào cuối mảng `MIGRATIONS`, không sửa migration cũ).
- Cấp quyền chỉ bằng dòng lệnh, **không có nút cấp admin trên web**:
  ```
  node server/tools/ops/user.js admin <tên> on
  node server/tools/ops/user.js admin <tên> off
  ```
- `cache.getSession` đang trả `{ userId, username, expires }`: thêm `isAdmin` từ câu truy vấn `sessionByHash`. Cờ này nằm trong cache phiên 60 giây như `banned`, nên gỡ quyền có hiệu lực sau tối đa 60 giây.
- Mọi route `/api/admin/*` đều kiểm tra: có phiên, `isAdmin` đúng, không thì trả **404** (không lộ rằng trang admin tồn tại).

## 4. API (tất cả POST, JSON)

| Đường dẫn | Việc |
|---|---|
| `/api/admin/find` | Tìm theo tên đăng nhập hoặc tên nhân vật, trả vài kết quả: id, tên, cấp, class, xu, ngọc, đang online hay không, bị khóa không |
| `/api/admin/grant` | Tặng cho 1 nhân vật: `{ user, gold, exp, linhNgoc, skillPoints, items: [[id, n]], unlockClass, mounts }` |
| `/api/admin/codes/list` | Danh sách mật mã + số lượt đã dùng |
| `/api/admin/codes/add` | Tạo mã: `{ code, note, maxUses, expires, rewards }` (cùng dạng `rewards` của mã hiện tại) |
| `/api/admin/codes/remove` | Xóa mã |
| `/api/admin/ban` | Khóa / mở khóa tài khoản, kèm lý do |
| `/api/admin/log` | 50 dòng nhật ký admin gần nhất |

Danh sách vật phẩm, kỹ năng, class để chọn trên trang lấy từ `shared` (đã có `G.ITEMS`, `G.SKILLS`, `G.SCHOOLS`, `G.MOUNTS`). Trang chỉ cần nạp các file `shared` sẵn có hoặc một route `/api/admin/catalog` trả về `{id, name}` gọn.

## 5. Điểm kỹ thuật quan trọng

### 5.1 Dùng chung logic tặng quà với mật mã

Khối phát thưởng trong `redeem` (`server/game/actions/character.js`, dòng ~220–250) hiện nằm thẳng trong hành động. Tách nó ra thành một hàm duy nhất, ví dụ `applyRewards(p, rewards, ev, src)` trong `server/game/core/rewards.js`. Mật mã và admin cùng gọi hàm này:

- Một chỗ sửa khi có loại phần thưởng mới, hai nơi tự đúng.
- Linh Ngọc vẫn đi qua `grantNgoc` với `src = 'admin:<tên admin>'`, nên `ngocLog` đối soát được.
- Kiểm tra túi trống, mở khóa class, thú đã có... đều được hưởng lại, không viết lại.

### 5.2 Ghi vào nhân vật đang online

Nhân vật đang chơi nằm trong bộ nhớ (`server/storage/cache.js`), nếu ghi thẳng vào database thì bản trong bộ nhớ sẽ đè lại (đúng là lý do `user.js restore` yêu cầu tắt server). Vì vậy admin **không** ghi database trực tiếp mà đi qua cache giống một hành động bình thường:

```
p = await cache.getPlayer(userId)     // nạp vào bộ nhớ nếu chưa có
token = cache.begin(userId)
applyRewards(p, ...)
cache.commit(userId); cache.saveNow(userId)
```

Cần đọc kỹ `cache.begin / commit / rollback / isBusy` khi làm, để xử lý đúng trường hợp nhân vật đang bận một hành động khác (báo "thử lại" thay vì ghi đè).

Người chơi đang online sẽ thấy thay đổi ở lần đồng bộ kế tiếp (`rev` của cache). Việc đẩy thông báo "Bạn nhận được quà từ admin" lên màn hình họ là tùy chọn, để sau.

### 5.3 Giới hạn an toàn

- Trần mỗi lần tặng (ví dụ xu ≤ 1 tỷ, ngọc ≤ 100.000, mỗi vật phẩm ≤ 999) để gõ nhầm thêm một số 0 không phá nền kinh tế.
- Chỉ nhận `id` vật phẩm / class / thú có thật trong `shared`, từ chối id lạ.
- Giữ cơ chế chỉ nhận JSON (đã chặn CSRF ở `server/index.js`), thêm giới hạn tốc độ nhẹ cho `/api/admin/*`.
- Trang admin hiện bước **xác nhận** trước mỗi lần tặng ("Tặng 500 💎 cho Hoang?").

### 5.4 Nhật ký

Bảng mới (cùng migration):

```
CREATE TABLE IF NOT EXISTS admin_log (
  id BIGSERIAL PRIMARY KEY,
  at BIGINT NOT NULL,
  admin_id BIGINT NOT NULL REFERENCES users(id),
  target_id BIGINT,
  action TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS admin_log_at_idx ON admin_log (at DESC);
```

Ghi cho mọi hành động: tặng, tạo / xóa mã, khóa / mở khóa. `detail` chứa nội dung đã tặng.

## 6. Giao diện (`public/admin.html` + `public/js/admin.js`)

Một trang, ba khu, dùng lại `css/style.css` cho nhất quán:

1. **Người chơi:** ô tìm kiếm, chọn một người, hiện thẻ tóm tắt (cấp, class, xu, ngọc) và khung "Tặng": ô số cho xu / kinh nghiệm / ngọc / điểm kỹ năng, ô chọn vật phẩm + số lượng (thêm được nhiều dòng), chọn class mở khóa, nút **Tặng**. Cạnh đó nút Khóa / Mở khóa.
2. **Mật mã:** bảng các mã (mã, quà, lượt dùng / tối đa, hạn), form tạo mã dùng đúng khung phần thưởng ở mục 1, nút xóa.
3. **Nhật ký:** bảng 50 dòng gần nhất.

Không dùng script nội tuyến (CSP của server chỉ cho `'self'`), chỉ file `admin.js`. Trang tự kiểm tra `/api/me`; không phải admin thì chuyển về trang chủ.

## 7. Các file dự kiến

| File | Việc |
|---|---|
| `server/storage/db.js` | migration `is_admin` + `admin_log`; hàm `setAdmin`, `adminLog`, `findUsers`; `sessionByHash` trả thêm `is_admin` |
| `server/storage/cache.js` | phiên mang theo `isAdmin` |
| `server/game/core/rewards.js` (mới) | `applyRewards`, tách từ `redeem` |
| `server/game/actions/character.js` | `redeem` gọi `applyRewards` |
| `server/http/admin.js` (mới) | các route `/api/admin/*` |
| `server/index.js` | gắn route admin vào `api()` |
| `server/tools/ops/user.js` | thêm lệnh `admin <tên> on|off` |
| `public/admin.html`, `public/js/admin.js` (mới) | giao diện |

## 8. Thứ tự thực hiện

1. **Nền:** migration (`is_admin`, `admin_log`), lệnh `user.js admin`, phiên mang `isAdmin`, route khung `/api/admin/*` trả 404 cho người thường.
2. **Tách `applyRewards`** khỏi `redeem`, chạy lại mã quà tặng cũ để chắc không hỏng.
3. **`/api/admin/find` và `/grant`** + ghi nhật ký. Thử bằng `curl`/script trước khi có giao diện.
4. **Mật mã:** `/codes/list|add|remove`.
5. **Khóa / mở khóa**, `/log`.
6. **Giao diện** `admin.html` + `admin.js`.
7. **Kiểm thử** theo bảng dưới.

Bước 1–3 là phần cốt lõi; làm đến đây là đã tặng đồ được qua API, giao diện làm sau.

## 9. Kiểm thử

| Bước | Kỳ vọng |
|---|---|
| Người chơi thường gọi `/api/admin/grant` | 404, không có gì thay đổi |
| Không đăng nhập mở `/admin.html` | chuyển về trang chủ |
| Cấp quyền bằng `user.js admin`, đăng nhập lại | vào được trang admin |
| Gỡ quyền | vào không được sau tối đa 60 giây |
| Tặng 500 ngọc cho người **đang online** | họ thấy 500 ngọc sau lần đồng bộ kế; đăng xuất đăng nhập lại vẫn còn (không bị cache đè) |
| Tặng cho người **offline** | đăng nhập thấy đủ |
| Tặng vật phẩm khi túi đầy | báo lỗi, không mất gì |
| Gõ id vật phẩm không có | từ chối |
| Tặng vượt trần | từ chối |
| Tạo mã trên trang rồi nhập trong game | nhận đúng quà, như mã tạo bằng lệnh |
| Mọi thao tác | có dòng trong `admin_log` |
| Mã quà tặng cũ sau khi tách `applyRewards` | vẫn nhận đúng xu, kinh nghiệm, ngọc, vật phẩm, thú, class |

## 10. Rủi ro và điểm cần chốt

1. **Tài khoản admin bị lộ mật khẩu = mất kiểm soát nền kinh tế.** Khuyến nghị dùng mật khẩu riêng, mạnh; trang admin chỉ nên mở qua HTTPS (`COOKIE_SECURE=1`). Có thể giới hạn thêm theo IP bằng biến môi trường `ADMIN_IPS` nếu muốn (không làm mặc định).
2. **Tặng cho nhân vật đang bận một hành động:** xem mục 5.2, phải xử lý, không được ghi mù.
3. **Phần "kỹ năng":** tặng điểm kỹ năng và tặng **sách** (sách kỹ năng / tuyệt kỹ là vật phẩm) đã đủ nhu cầu, dùng được ngay với logic hiện có. Cho học thẳng một kỹ năng không qua sách cần thêm một nhánh riêng, bỏ qua `ultFits` và giới hạn ô học; chỉ làm khi bạn thật sự cần.
4. **Chưa có kênh báo cho người chơi** khi nhận quà từ admin. Đợt đầu chỉ thấy số đổi; muốn có thông báo thì thêm một hàng đợi `p.inbox` ở đợt sau.
5. **Nhiều admin:** thiết kế đã hỗ trợ (`admin_id` trong nhật ký), chỉ cần cấp quyền cho nhiều tài khoản.
