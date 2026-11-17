# Siêu tuyệt kỹ không cộng cấp · Thiết kế lại trần sát thương · Chống spam

## Kết luận điều tra: bạn nghi đúng

Server **không biết** hồi chiêu, năng lượng, hay thể lực. Gói `hit` client gửi lên chỉ có uid quái, sát thương, chí mạng, hiệu ứng và cờ `sk: 0/1` — **không có id kỹ năng, không có mốc hồi chiêu**. Nên server không thể kiểm lại "chiêu này có đang hồi không".

Hiện chỉ siêu tuyệt kỹ được server kiểm (`p.execCd`, `p.buaCd`, `p.manaBurstCd`, `p.allinCd`). Kỹ năng thường và tuyệt kỹ thì hoàn toàn ở client.

## Trần hiện tại cắt oan cả ba loại

Đo thật ở cấp 100, dùng một mức `CAP_MUL_SKILL = 90` cho mọi kỹ năng:

| Loại | Sát thương thô tối đa | Trần hiện tại | Kết quả |
|---|---|---|---|
| Đánh thường | 12.618 | 9.306 | lọt |
| Kỹ năng thường | 158.883 | 104.630 | **cắt 34%** |
| Tuyệt kỹ | 149.356 | 104.630 | **cắt 30%** |
| Siêu tuyệt kỹ | 780.912 | 104.630 | **cắt 87%** |

Ba loại dùng chung một trần trong khi sát thương thật chênh nhau tới 62 lần.

## Phát hiện phụ

`st10` Tử Huyệt (Sát Thủ, kỹ năng **thường**, hồi chiêu 14 giây) là đòn mạnh nhất nhóm kỹ năng thường: mult 21,75, cao hơn tuyệt kỹ mạnh nhất (18,16). Không phải lỗi — `finisher` thay thế `power` ở nhát cuối — nhưng nó khiến "kỹ năng thường" không còn yếu hơn "tuyệt kỹ" như thiết kế ban đầu.

## 1. Bỏ cộng cấp cho siêu tuyệt kỹ

Trong `skillAt()`: nếu `base.superUlt` thì trả về chỉ số gốc, không nhân `mul`.

Gộp `m5`/`m10` vào chỉ số gốc và xoá hai mốc, vì bỏ cộng cấp thì mốc nâng cấp thành vô nghĩa. Chặn nâng cấp ở `learn_skill` với thông báo rõ, ẩn dòng "cấp 5 / cấp 10" ở bảng kỹ năng.

Ảnh hưởng 5 siêu tuyệt kỹ đã có (Sinh Tử Đồng Quy, Tử Linh Dung Hợp, Cấm Chú Giải Phóng, Thiết Bích Vĩnh Cửu, Vạn Pháp Quy Nhất) — mỗi cái mất bậc nâng cấp, giữ một bộ số cố định.

## 2. Bốn mức trần riêng

```js
const CAP = {
  basic:    16,    // đo 1,25
  skill:    26,    // đo 21,75 (Tử Huyệt)
  ult:      22,    // đo 18,16 (Địa Chấn Thiên Hạ)
  superUlt: 210,   // đo 176,30 (Vạn Pháp Quy Nhất)
};
```

Mỗi mức = mult tối đa đo được + biên an toàn ~19%. Sát thương tối đa một đòn: đánh thường 18.512, kỹ năng 30.082, tuyệt kỹ 25.454, siêu tuyệt kỹ 242.970 (ở ATK 1.157).

Client phải gửi thêm cờ `k: 0/1/2/3` để server chọn mức trần. Cờ này vẫn do client gửi nên **không tin được** — vì vậy ngân sách sát thương mỗi giây vẫn giữ nguyên làm lớp chặn thật.

## 3. Chống spam: ba tầng

**Tầng 1 — server giữ hồi chiêu.** Client gửi gói `cast` kèm id kỹ năng; server kiểm kỹ năng đã học, đang gắn trên thanh, và `now >= p.cds[id]`. Sai thì không trả gì và bỏ qua các đòn tiếp theo trong ~1 giây.

Đề xuất thực dụng: tầng 1 **chỉ kiểm hồi chiêu**, không kiểm MP/thể lực. MP và thể lực chỉ có ở client và tự hồi theo thời gian; muốn server giữ thì phải chuyển cả hệ hồi năng lượng về server, việc lớn gấp ba mà không giải quyết vector spam chính.

**Tầng 2 — gói `hit` khai id kỹ năng.** Server đối chiếu đòn này có thuộc một lần dùng chiêu hợp lệ trong 2 giây qua không. Đây là thứ biến "số đòn/giây" thành "số lần dùng chiêu/giây".

**Tầng 3 — giới hạn số lần dùng chiêu mỗi phút** (`skill: 30, ult: 8, superUlt: 2`). Chặn tuyệt đối trường hợp client bị sửa để bỏ qua hồi chiêu.

## 4. Thứ tự thực hiện

| Bước | Việc | Rủi ro |
|---|---|---|
| 1 | Bỏ cộng cấp siêu tuyệt kỹ, gộp m5/m10 vào gốc | Thấp |
| 2 | Chặn nâng cấp + ẩn mốc cấp ở bảng kỹ năng | Thấp |
| 3 | Bốn mức trần + cờ `k` | Trung bình |
| 4 | Ngân sách riêng cho siêu tuyệt kỹ | Trung bình |
| 5 | Tầng 1: gói `cast`, server giữ hồi chiêu | **Cao** |
| 6 | Tầng 2: `hit` khai id kỹ năng | **Cao** |
| 7 | Script kiểm chứng 4 loại đòn ở cấp 70 và 100 | — |

Bước 1–4 làm ngay được, không đụng luồng mạng. Bước 5–6 đổi giao thức client–server, phải làm đồng thời cả hai phía.

## 5. Ba điều cần bạn quyết

1. **Siêu tuyệt kỹ giữ số gốc (cấp 1) hay lấy cấp 10 làm chuẩn?** Đề xuất: lấy cấp 10, vì đó là con số đã cân theo trùm (Vạn Pháp 28.058 dmg = 4,19× máu trùm). Lấy cấp 1 thì Vạn Pháp tụt còn 19.350, lệch so với các cái khác.
2. **Tầng 1 có kiểm MP/thể lực ở server không?** Đề xuất: không, chỉ kiểm hồi chiêu.
3. **Làm hết 7 bước hay dừng ở bước 4?** Bước 1–4 sửa trần và bỏ cộng cấp. Bước 5–6 mới thật sự đóng lỗ hổng spam.