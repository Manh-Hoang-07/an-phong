# Kế hoạch: Tuyệt kỹ "Lấy Mạng Đổi Mạng" — bản 3

Đã viết đầy đủ tại `.perch/plans/nhat-kich-tat-sat.md` (311 dòng, 9 mục).

## Cơ chế

Dùng chiêu lên một mục tiêu trong tầm. Cả hai cùng bị rút về 0 máu.

- **Không có Bùa Hộ Mệnh:** quái chết, bạn chết. Mất 5% exp cấp hiện tại, hồi sinh ở làng. Đổi mạng thật.
- **Có Bùa Hộ Mệnh đang sẵn sàng:** quái chết (không có bùa, không ai cứu), bạn giữ 1 máu và bất tử 5–9 giây. Bùa vào hồi chiêu 60 giây.

Không tốn MP, không tốn thể lực. Hồi chiêu 180 giây (165 ở cấp 5, 150 ở cấp 10).

**Không chặn trùm.** Trùm thường, thủ lĩnh, và cả trùm cuối `Thực Thể Bên Kia Cổng` (925.000 máu) đều chết ngay — nếu bạn dám chết theo.

## Hai điểm tôi phải quyết thay bạn, ghi rõ để bạn chỉnh

1. **Quái chết hẳn, không còn 1 máu.** Cả hai cùng chạm 0, bùa cứu bạn, quái không có bùa nên chết. Đây là cách duy nhất để câu "quái thì không bất tử" có tác dụng — nếu quái còn 1 máu và không bất tử thì nó vẫn sống. Muốn cách khác thì đổi một dòng.

2. **Server phải tự giữ hồi chiêu Bùa.** Hồi chiêu bùa hiện là biến client (`combat.js:324`), server không biết. Nếu không xử, người chơi spam chiêu miễn phí: bùa hồi 60s, chiêu hồi 180s nên bùa luôn sẵn sàng. Giải pháp: thêm `p.buaCd` ở server, tự lưu vào section `misc`.

## Giá

- Sách: **210 Linh Ngọc** (đắt nhất game; cao nhất hiện tại 120).
- Bùa Hộ Mệnh: **giữ nguyên giá** 40/90/180/320/500. Không sửa `special.js`. Bản 3 làm nó đắt hơn về giá trị sử dụng: giờ là thứ duy nhất cho bạn giết trùm cuối mà không chết theo.

Lưu ý: trong `shared/` không có nguồn Linh Ngọc nào — chỉ mật mã và admin phát. 210 ngọc hiện không kiếm được bằng cách chơi.

## Thay đổi

| File | Cỡ |
|---|---|
| `shared/data/skills/ult/ult-dac-biet.js` | +16 dòng |
| `shared/data/items/index.js` | 1 dòng |
| `shared/logic/shop.js` | 1 dòng |
| `public/js/scene/skills.js` | ~55 dòng |
| `server/realtime/index.js` | ~45 dòng |
| `public/js/ui/panels/skills.js` | 3 dòng |
| `server/tools/check/audit-skill-fx.js` | 2 dòng |

Không đụng `special.js`, `sections.js`, `combat.js`, `shared/index.js`, `public/index.html`.

## Một hệ quả bạn nên biết

Bỏ chặn trùm nghĩa là người chơi có Bùa bậc cao giết được trùm cuối mỗi 300 giây hồi sinh, với giá 1 máu. Trùm rơi `loi_tinh_van` ×1, `da_cuong_hoa_than_thoai` ×5, và 60.000–100.000 xu. Đó là dòng thu nhập rất lớn.

Ba cách xử: để nguyên (đúng yêu cầu hiện tại), chặn riêng trùm cuối (một dòng), hoặc giết được nhưng không nhận thưởng (phức tạp hơn). Kế hoạch đang viết theo cách thứ nhất.