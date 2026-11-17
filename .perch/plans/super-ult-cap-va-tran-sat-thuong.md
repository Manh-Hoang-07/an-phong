# Siêu tuyệt kỹ không cộng cấp · Thiết kế lại trần sát thương · Chống spam

Ngày lập: 2026-11-17. Phạm vi: `D:\Source\AnPhong`.

---

## 0. Kết luận điều tra trước khi lập kế hoạch

> **CẬP NHẬT 2026-11-17 — bước 1–4 đã làm xong.** Số liệu trong mục 0.2 dưới đây là bản ĐẦU, tính
> thiếu hệ số nhân. Con số đúng ở mục 0.5. Giữ lại mục 0.2 để thấy sai số đã sửa.

### 0.5 Số liệu ĐÚNG (đã dùng để đặt trần)

Hệ số nhân thực tế áp lên một đòn: chí mạng 2,5 × ngẫu nhiên 1,1 × sát thương trùm 1,8 = **4,95**.
Không tính atkBuff 1,87 / shred 1,4 / exec 1,6 vì không ai bật được cùng lúc ổn định (cộng dồn thành 51,84).

mult thực tế lớn nhất (đã gồm skillMul và vsSlowed, mọi class ở cấp 70 và 100):

| Loại | mult | × 4,95 | Trần đặt | Chừa |
|---|---|---|---|---|
| Đánh thường | 1,25 | 6 | **8** | 33% |
| Kỹ năng thường | 19,42 (Sát Thủ `st10` Tử Huyệt) | 96 | **111** | 15% |
| Tuyệt kỹ | 16,57 (Tử Linh Thuật Sư `ulChung1`) | 82 | **95** | 15% |
| Siêu tuyệt kỹ | 125,89 (Toàn Năng `ulToanNangSuper`) | 623 | **717** | 15% |

`st10` là kỹ năng THƯỜNG nhưng mạnh hơn mọi tuyệt kỹ (finisher 5,51 × vsSlowed 2,5), nên trần kỹ năng
cao hơn trần tuyệt kỹ. Phản ánh thực tế, không sửa dữ liệu.

Kiểm chứng: cả 4 loại ở cấp 70 và 100 đều lọt, dùng 77–87% trần. Không cắt oan.

### 0.6 Sinh Tử Đồng Quy — ngoại lệ có chủ đích

Nó KHÔNG đi qua `onHit`. `server/realtime/index.js` gọi thẳng `w.applyHit(mob, conn.id, { dmg: mob.hp })`.
Nên trần, ngân sách, số đòn/giây đều không áp dụng. Bội số thật là **∞** (= máu quái), không phải một
con số trong bảng nào. Đó là thiết kế đúng (cái giá là mạng mình), nhưng phải ghi rõ để sau này không
ai "sửa lỗi" bằng cách bắt nó đi qua `onHit` — làm vậy là phá hỏng nó.


### 0.1 Bạn nghi đúng: chống spam đang nằm ở client

Server (`server/realtime/index.js`) **không biết** ba thứ quyết định người chơi có được dùng chiêu hay không:

| Thứ chặn spam | Nằm ở đâu | Server có biết? |
|---|---|---|
| Hồi chiêu (`this.cooldowns[id]`) | `public/js/scene/skills.js` | **Không** |
| Năng lượng (`App.mp`) | client | **Không** |
| Thể lực (`App.sta`) | client | **Không** |

Gói `hit` client gửi lên chỉ có: `u` (uid quái), `d` (sát thương), `c` (chí mạng), `src`, `dir`, `slow`, `freeze`, `stun`, `knock`, `sk` (0/1).
**Không có id kỹ năng, không có mốc hồi chiêu, không có MP đã tiêu.** Nên server không thể kiểm lại "chiêu này có đang hồi không".

Hiện chỉ có hai thứ server tự giữ: `p.execCd` (Đồng Sinh Cộng Tử), `p.buaCd`, `p.manaBurstCd`, `p.allinCd`. Tức là **chỉ siêu tuyệt kỹ được kiểm**, kỹ năng thường và tuyệt kỹ thì không.

Cái server đang chặn được chỉ là **số đòn/giây** và **tổng sát thương/giây**, không phải **số lần dùng chiêu**.

### 0.2 Trần hiện tại cắt oan

`server/realtime/index.js` dùng **một** mức cho mọi kỹ năng: `CAP_MUL_SKILL = 90` (× ATK + 500). Đo thật ở cấp 100:

| Loại | mult tối đa | Sát thương thô tối đa | Trần hiện tại | Kết quả |
|---|---|---|---|---|
| Đánh thường | 1,25 | 12.618 | 9.306 | lọt |
| Kỹ năng thường | 21,75 | 158.883 | 104.630 | **cắt 34%** |
| Tuyệt kỹ | 18,16 | 149.356 | 104.630 | **cắt 30%** |
| Siêu tuyệt kỹ | 176,30 | 780.912 | 104.630 | **cắt 87%** |

Ba loại dùng chung một trần, trong khi sát thương thật chênh nhau **12 lần** (kỹ năng thường) đến **62 lần** (siêu tuyệt kỹ).

### 0.3 Một phát hiện phụ, cần bạn biết

`st10` **Tử Huyệt** (Sát Thủ, kỹ năng **thường**, cấp 30, hồi chiêu 14 giây) là đòn mạnh nhất trong nhóm kỹ năng thường: `finisher` 5,51 × `vsSlowed` 2,5 = mult 21,75. Cao hơn tuyệt kỹ mạnh nhất (18,16).

Không phải lỗi: `finisher` **thay thế** `power` ở nhát cuối (đã đọc `public/js/scene/skills.js:432-447`), không cộng dồn. Nhưng nó khiến "kỹ năng thường" không còn yếu hơn "tuyệt kỹ" như thiết kế ban đầu. Trần mới sẽ phản ánh đúng thực tế này thay vì che nó đi.

### 0.4 Về "siêu tuyệt kỹ không cộng cấp"

Cơ chế cộng cấp hiện tại (`shared/logic/skills.js:20-30`): mỗi cấp +5% power, cấp 10 +45% power và −15% hồi chiêu.

Với siêu tuyệt kỹ, hệ số nhân này **không có ý nghĩa cân bằng**: chúng đã ở tầm "giết trùm một đòn" hoặc "×28 HP". Cộng thêm 45% chỉ làm con số to hơn, không làm trò chơi hay hơn. Và vì điểm kỹ năng = cấp − 1 (cấp 100 có 99 điểm, nâng một chiêu lên 10 tốn 9 điểm), việc nâng cấp siêu tuyệt kỹ gần như miễn phí.

**Đồng ý bỏ.** Đề xuất cụ thể ở mục 1.

---

## 1. Siêu tuyệt kỹ: bỏ cộng cấp

### Cách làm
Trong `shared/logic/skills.js`, hàm `skillAt(id, lv)`:

```js
// Siêu tuyệt kỹ: chỉ số CỐ ĐỊNH, không nhân theo cấp.
// Lý do: chúng đã ở tầm giết-trùm-một-đòn; +45% không đổi được lối chơi, chỉ phá cân bằng.
// Vẫn giữ cấp 1–10 như một mốc sở hữu, nhưng cấp không nhân gì cả.
if (base.superUlt) { s.lv = lv; return s; }
```

Đặt ngay sau khi áp `m5` / `m10`, trước khối nhân `mul`.

### Hệ quả cần xử lý
- `m5` / `m10` của siêu tuyệt kỹ hiện đang là **mốc nâng cấp** (`cd` giảm, `duration` tăng). Nếu bỏ cộng cấp thì các mốc này thành vô nghĩa.
- **Đề xuất:** gộp `m5`/`m10` vào chỉ số gốc, xoá hai mốc. Ví dụ Thiết Bích Vĩnh Cửu: `duration: 60` cố định, `cd: 180` cố định, bỏ `m5: {duration: 70}` và `m10: {cd: 211.8}`.
- Như vậy sách siêu tuyệt kỹ = học được là dùng đúng như mô tả, không có bậc trung gian. Đúng tinh thần "có thế nào thì như thế thôi".
- Bảng kỹ năng (`public/js/ui/panels/skills.js`) phải ẩn dòng "cấp 5 / cấp 10" cho siêu tuyệt kỹ, nếu không người chơi sẽ đi tìm nút nâng cấp không tồn tại.
- `server/game/actions/character.js:51` `learn_skill` phải chặn nâng cấp siêu tuyệt kỹ kèm thông báo rõ, thay vì để người chơi tiêu điểm vô ích.

### Ảnh hưởng tới 5 siêu tuyệt kỹ đã có
| Siêu tuyệt kỹ | Hiện tại | Sau khi bỏ cộng cấp |
|---|---|---|
| Sinh Tử Đồng Quy | cd 180 → 150 ở cấp 10 | cd 180 cố định |
| Tử Linh Dung Hợp | cd 240 → 200 | cd 240 cố định |
| Cấm Chú Giải Phóng | mpPower 5,5 → 6,6; cd 90 | mpPower 5,5; cd 90 cố định |
| Thiết Bích Vĩnh Cửu | 60s → 70s; cd 180 | 60s; cd 180 cố định |
| Vạn Pháp Quy Nhất | power 77 → 111,65; cd 180 | power 77; cd 180 cố định |

**Cần bạn quyết:** giữ con số **gốc** (cấp 1) hay lấy con số **cấp 10** làm chuẩn? Đề xuất của tôi: lấy **cấp 10** làm chuẩn, vì đó là con số đã được cân theo trùm (Vạn Pháp 28.058 dmg = 4,19× máu trùm). Lấy cấp 1 thì Vạn Pháp tụt còn 19.350 dmg, mất cân bằng so với các cái khác.

---

## 2. Thiết kế lại trần sát thương: 4 mức riêng

### Nguyên tắc
Trần phải tính từ **ATK của chính nhân vật** (server tự đọc, client không sửa được) và **đủ rộng cho trường hợp thật mạnh nhất**, nhưng đủ hẹp để client bị sửa cũng không phá được game.

### Bốn mức đề xuất

```js
// server/realtime/index.js
// Trần tính từ ATK thật của nhân vật. Bốn mức vì bốn loại đòn chênh nhau tới 62 lần.
// Hệ số = mult tối đa đo được × biên an toàn 1,15 (làm tròn lên).
const CAP = {
  basic:    16,    // đo 1,25  → chừa cho vũ khí/buff tương lai
  skill:    26,    // đo 21,75 (Tử Huyệt) → +20%
  ult:      22,    // đo 18,16 (Địa Chấn Thiên Hạ) → +21%
  superUlt: 210,   // đo 176,30 (Vạn Pháp Quy Nhất) → +19%
};
```

Sát thương tối đa một đòn server cho lọt:

| Loại | ATK 1.157 (cấp 100) | ATK 561 (cấp 70) |
|---|---|---|
| Đánh thường | 18.512 | 8.976 |
| Kỹ năng thường | 30.082 | 14.586 |
| Tuyệt kỹ | 25.454 | 12.342 |
| Siêu tuyệt kỹ | 242.970 | 117.810 |

### Cách server biết đòn thuộc loại nào
Hiện client chỉ gửi `sk: 0/1`. Phải mở rộng thành `k`: mã loại đòn.

```js
// client: public/js/scene/combat.js, chỗ gửi gói hit
k: extra.superUlt ? 3 : extra.ult ? 2 : extra.sk ? 1 : 0,
```

Và trong `skills.js`, chỗ dựng `fx()` phải truyền thêm `ult` / `superUlt`:
```js
const fx = (over = {}) => {
  const o = {};
  if (sk.ult) o.ult = 1;
  if (sk.superUlt) o.superUlt = 1;
  ...
};
```

**Quan trọng:** cờ này vẫn do client gửi, nên **không tin được**. Vì vậy server phải kẹp thêm một lớp nữa: **trần theo loại không bao giờ vượt trần tổng**, và **ngân sách sát thương mỗi giây** vẫn giữ như hiện tại. Nói cách khác: cờ `k` chỉ để chọn mức trần, còn chặn thật vẫn là ngân sách.

### Ngân sách mỗi giây phải sửa theo
Hiện tại: `rate = atk × 90 × 6 = atk × 540/giây`, tích tối đa 2 giây → `atk × 1.080`.
Với trần siêu tuyệt kỹ 210× thì một đòn 210× vẫn lọt ngân sách (210 < 1.080), nhưng **hai siêu tuyệt kỹ liên tiếp** thì không. Đó là hành vi đúng.

Đề xuất tách ngân sách theo loại:
```js
// Ngân sách riêng cho siêu tuyệt kỹ: mỗi 60 giây chỉ cho lọt tổng cộng 2 lần trần siêu tuyệt kỹ.
// Đây là lớp chặn CUỐI, không phụ thuộc client: dù sửa đồng hồ hồi chiêu cũng không spam được.
const SUPERULT_BUDGET = { max: 2, windowMs: 60000 };
```

---

## 3. Chống spam: đưa quyết định về server

Đây là phần nặng nhất, và là phần bạn nghi đúng nhất. Ba tầng, làm từ rẻ đến đắt.

### Tầng 1 — Server giữ hồi chiêu (bắt buộc)
Thêm gói `cast` client gửi khi dùng chiêu:
```js
Realtime.send({ t: 'cast', id: 'st10' });
```
Server kiểm:
- kỹ năng có trong `p.skills` và đang gắn trên `p.skillSlots`
- `now >= p.cds[id]` (mốc hồi chiêu server giữ, lưu trong `misc` nên tự được persist)
- đủ MP: `p.mp >= cost` → trừ MP thật
- đủ thể lực: `p.sta >= cost` → trừ thể lực thật

Nếu sai: **không gửi gì về**, và đánh dấu `conn.castDenied` để `onHit` bỏ qua các đòn tiếp theo trong ~1 giây.

**Vấn đề:** MP và thể lực hiện **chỉ có ở client**, server không mô phỏng hồi. Muốn server giữ MP thật thì phải chuyển cả hệ hồi MP/ST về server, hoặc chấp nhận server chỉ kiểm **hồi chiêu** (thứ không cần mô phỏng, chỉ cần một mốc thời gian).

**Đề xuất thực dụng:** tầng 1 chỉ kiểm **hồi chiêu**. MP và thể lực để client, vì chúng tự hồi theo thời gian và không phải vector spam chính (hồi chiêu mới là thứ chặn spam). Ghi rõ đánh đổi này.

### Tầng 2 — Gói `hit` phải khai id kỹ năng (bắt buộc)
Thêm `id` vào gói hit. Server đối chiếu: đòn này có thuộc một lần dùng chiêu hợp lệ trong 2 giây qua không. Nếu không → bỏ.

Đây là thứ biến "số đòn/giây" thành "số lần dùng chiêu/giây" — đúng thứ bạn muốn.

### Tầng 3 — Giới hạn số lần dùng chiêu mỗi phút (tuỳ chọn)
```js
const CASTS_PER_MIN = { skill: 30, ult: 8, superUlt: 2 };
```
Chặn tuyệt đối trường hợp client bị sửa để bỏ qua hồi chiêu.

---

## 4. Thứ tự thực hiện

| Bước | Việc | File | Rủi ro |
|---|---|---|---|
| 1 | Bỏ cộng cấp cho siêu tuyệt kỹ, gộp m5/m10 vào gốc | `shared/logic/skills.js` + 2 file dữ liệu ult | Thấp |
| 2 | Chặn nâng cấp siêu tuyệt kỹ + ẩn mốc cấp ở bảng kỹ năng | `server/game/actions/character.js`, `public/js/ui/panels/skills.js` | Thấp |
| 3 | Bốn mức trần + cờ `k` | `server/realtime/index.js`, `public/js/scene/combat.js`, `public/js/scene/skills.js` | Trung bình |
| 4 | Ngân sách riêng cho siêu tuyệt kỹ | `server/realtime/index.js` | Trung bình |
| 5 | Tầng 1: gói `cast`, server giữ hồi chiêu | `server/realtime/index.js`, `public/js/scene/skills.js` | **Cao** |
| 6 | Tầng 2: `hit` khai id kỹ năng | cả hai phía | **Cao** |
| 7 | Kiểm chứng: script đo 4 loại đòn ở cấp 70 và 100, xác nhận không cái nào bị cắt oan | `server/tools/check/` | — |

Bước 1–4 làm được ngay, không đụng luồng mạng. Bước 5–6 đổi giao thức client–server, phải làm cùng lúc cả hai phía và test kỹ, nếu không người chơi cũ sẽ không đánh được.

---

## 5. Ba điều cần bạn quyết trước khi tôi bắt tay

1. **Siêu tuyệt kỹ giữ con số gốc (cấp 1) hay lấy cấp 10 làm chuẩn?** Đề xuất: lấy cấp 10.
2. **Tầng 1 có kiểm MP/thể lực ở server không?** Đề xuất: không, chỉ kiểm hồi chiêu. Kiểm MP đòi chuyển cả hệ hồi năng lượng về server, việc lớn gấp ba.
3. **Làm hết 7 bước hay dừng ở bước 4?** Bước 1–4 sửa được trần và bỏ cộng cấp. Bước 5–6 mới thật sự đóng lỗ hổng spam, nhưng đổi giao thức.
