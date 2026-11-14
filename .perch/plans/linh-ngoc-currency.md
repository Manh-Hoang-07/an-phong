# Linh Ngọc — tiền tệ trân bảo + NPC Lầu Trân Bảo

## Đã sửa theo 3 điểm bạn chốt

**1. NPC mới chuyên bán bằng ngọc.** `tran_bao` (Lầu Trân Bảo) đứng riêng ở Tân Đô I, cột 81 hàng 20 của `lang.txt` (đã kiểm: ô trống, cạnh Chợ ở cột 77). Không dùng chung quầy Chủ tiệm Tư.

**2. Gỡ khỏi quầy xu.** Xóa dòng 32 trong `shared/logic/shop.js` — chỗ duy nhất ba cuốn sách lọt vào quầy Chủ tiệm Tư. Cộng thêm một dòng lọc: `shopItems` bỏ mọi món có `priceNgoc`, để sau này ai thêm id cũng không lọt sang quầy xu. Sách kỹ năng thường (`sach_kn_*`) vẫn bán bằng xu, không đụng.

**3. `sach_tuyet_ky` và `sach_tk_<id>` là một — bạn đúng.** `sach_tuyet_ky` không có trường `skill`, lúc đọc mới gọi `signatureUlt(p)` để tự chọn tuyệt kỹ chữ ký. Nó chỉ là một cuốn `sach_tk_*` biết tự chọn. Nên: bán đủ **23 cuốn `sach_tk_*` ở một giá 70**, không bán `sach_tuyet_ky` nữa (giữ định nghĩa để mã cũ và túi đồ cũ vẫn dùng được). Và **không lọc theo class** — bày cả 23 cuốn, mua nhầm thì kệ.

## Bảng giá

| Vật phẩm | id | Ngọc |
|---|---|---|
| Bùa nhân đôi kinh nghiệm | `bua_x2_kinh_nghiem` | 8 |
| Sách Tẩy Kỹ Năng | `sach_tay_ky_nang` | 15 |
| Sách Kỹ Năng (+1 điểm) | `sach_ky_nang` | 20 |
| Sách Mở Rộng Ô Kỹ Năng | `sach_mo_rong_thuong` | 35 |
| Sách Mở Rộng Ô Tuyệt Kỹ | `sach_mo_rong_tuyet_ky` | 45 |
| Sách Tuyệt Kỹ (mọi chiêu, mọi class) | `sach_tk_<id>` | 70 |

Sách tẩy giữ nguyên hành vi hiện tại: xóa được cả kỹ năng thường lẫn tuyệt kỹ, không tách hai cuốn.

## Hai điều bạn cần biết trước

**Mua chéo class được, đọc thì không.** Mua `sach_tk_pa5` khi đang là Pháp Sư thì mua được, trừ 70 ngọc, nhưng lúc đọc `use` gọi `G.ultFits` (items.js dòng 114) và chặn: "Tuyệt kỹ này không phù hợp với class của bạn." Ngọc vẫn mất. Đúng nghĩa "mua nhầm thì kệ" — nhưng nếu bạn muốn **học chéo class thật** thì phải bỏ kiểm tra đó, và việc đó phá cân bằng class. Tôi không đề xuất làm trong đợt này.

**Chừa đường nạp tiền.** Mọi cộng ngọc đi qua một hàm duy nhất `grantNgoc(p, n, src, ev)` trong `progress.js`, có `p.ngocLog` ghi lại 50 lần gần nhất kèm nguồn (`code:TESTNGOC` hôm nay, `topup:<mã đơn>` sau này). Cổng thanh toán sau này chỉ cần gọi hàm đó. Kèm ghi chú bảng `ngoc_topups` với `order_id UNIQUE` để webhook lặp không cộng hai lần.

## Phạm vi thay đổi

**Dữ liệu:** `books.js` (4 mục + `priceNgoc`, `price: 0`), `materials.js` (bùa), `items/index.js` (23 cuốn tuyệt kỹ, `priceNgoc: 70`).

**Logic:** `player.js` (`linhNgoc: 0`), `shop.js` (`ngocShopItems`, `ngocPrice`, `ngocShopGroups` + lọc khỏi quầy xu).

**Lưu trữ:** `sections.js` — thêm `'linhNgoc'` vào section `core`. Không cần cột DB mới, không sửa `coreColumns`. Nhân vật cũ tự nhận 0 qua vòng migrate có sẵn.

**Server:** `progress.js` (`grantNgoc`), `items.js` (`buy_ngoc`, kiểm túi trước khi trừ ngọc), `character.js` (`redeem` + sửa `onlyMounts` để mã chỉ tặng ngọc không bị từ chối nhầm), `codes.js`, `giftcode.js` (`--ngoc`).

**NPC/bản đồ:** `services.js`, `chapter1.js`, `lang.txt` cột 81.

**Client:** tab thứ ba `💎 Trân bảo` trong `shop.js` (3 nhóm: Tiện ích / Sách / Tuyệt kỹ), `actions.js`, ví ngọc trong `bag.js`, `NPC_ICONS` + `itemInfo` trong `ui.js`, âm thanh `net.js`, tông tím `.wallet-ngoc` trong `style.css`.

## Kiểm chứng

`check-shared-order.js`, `check:maps`, rồi bảng 14 bước thử: mã chỉ tặng ngọc, mua đủ/thiếu ngọc, túi đầy (ngọc không bị trừ), quầy xu sạch sách, mua chéo class, bán ngược bị chặn, nhân vật cũ không lỗi. Cuối cùng rà `linhNgoc` toàn bộ `shared/` + `server/` — mọi dòng phải rơi vào 4 nhóm: khởi tạo, lưu trữ, chi tiêu, cộng qua `grantNgoc`.

## Rủi ro đáng nói

Bỏ giá xu của 3 cuốn sách là thay đổi kinh tế thật — người đang giữ 250.000 xu chờ mua sách mở rộng sẽ mất đường đó. Bạn đã chốt gỡ, nên đây là chấp nhận có ý thức, nhưng nên báo trước cho người chơi. Ngoài ra `gen-maps.js` sẽ ghi đè `lang.txt` nếu ai chạy lại, nên phải ghi lại việc sửa tay.