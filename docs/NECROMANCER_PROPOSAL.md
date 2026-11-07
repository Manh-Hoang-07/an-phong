# Đề xuất thiết kế class Necromancer

*Tài liệu đề xuất để duyệt trước khi triển khai.*

## Định hướng

**Necromancer (Tử Linh Thuật Sư)** là hướng tiến hóa của **Triệu Hồi Sư**: chiến đấu tầm trung bằng phép bóng tối, sau đó biến quái bị hạ thành bóng ma đồng hành. Điểm nhận diện là đội quân nhỏ hình thành ngay trong trận đánh, thay vì triệu hồi thú cố định từ bộ sưu tập.

Trong mã nguồn hiện tại chưa có class Triệu Hồi Sư. Vì vậy, đề xuất này chọn hướng thiết kế thành một nhánh tiến hóa: bổ sung Triệu Hồi Sư làm class nền, rồi mở Necromancer qua nhiệm vụ thức tỉnh. Hai giai đoạn dùng chung nền tảng kỹ năng triệu hồi; khi tiến hóa, người chơi giữ kỹ năng đã học và mở bộ kỹ năng Necromancer. Cách này thể hiện đúng ý “bản nâng cấp” hơn là thêm một class độc lập không có đường tiến hóa.

## Nhân vật và hình ảnh

- **Vũ khí:** trượng linh hồn; đòn đánh thường bắn một tia linh lực tầm trung.
- **Ngoại hình:** áo choàng xanh đen, mặt nạ xương gọn, phù văn tím lam phát sáng và một ngọn lửa ma nhỏ bay cạnh vai.
- **Biến hình:** áo choàng mở rộng thành bóng khói, phù văn chuyển sang tím sáng; bóng ma theo sau cũng có viền sáng để dễ phân biệt với quái địch.
- **Phong cách sprite:** giữ tỉ lệ và nét pixel của nhân vật hiện có; hiệu ứng ưu tiên những đốm linh hồn nhỏ để tránh che nhân vật hoặc làm nặng khung hình trên điện thoại.

## Cơ chế đặc trưng: lưu giữ bóng ma

Khi người chơi trực tiếp kết liễu một quái đủ điều kiện, quái hóa thành bóng ma và được **lưu vào bộ sưu tập**. Bóng giữ dáng/loài của quái gốc nhưng đổi màu sang xanh tím. Bóng đã thu phục không tự mất theo thời gian và không tự bị thay thế; người chơi quyết định khi nào đổi đội.

| Quy tắc | Đề xuất ban đầu |
| --- | --- |
| Số bóng lưu giữ | Tối đa 12 loại/cá thể; khi đầy, không tự xóa bóng cũ và báo cần giải phóng chỗ |
| Số bóng theo cùng lúc | 3 |
| Thay đội | Chọn bóng trong bảng Necromancer; chỉ bóng được chọn mới theo và chiến đấu |
| Giải trừ kỹ năng | Bóng đang theo biến mất khỏi bản đồ nhưng vẫn được lưu trong bộ sưu tập |
| Bật lại kỹ năng | Đội bóng đã chọn hiện ra trở lại, kể cả sau khi qua map hoặc đăng nhập lại |
| Đổi bản đồ / đăng xuất | Không làm mất bộ sưu tập hoặc đội đã chọn |
| Sức khỏe bóng ma | Không nhận sát thương; chỉ mất khỏi bộ sưu tập khi người chơi chủ động giải phóng |
| Mục tiêu có thể hóa bóng | Quái thường và tinh anh |
| Không thể hóa bóng | Boss, NPC, quái nhiệm vụ đặc biệt và quái có kích thước quá lớn |
| Kết liễu bởi thú đồng hành | Không tạo bóng, để tránh nhân số lượng ngoài ý muốn |

Kỹ năng **Triệu Hồi Bóng** hoạt động như nút bật/tắt đội hình: bật thì các bóng đã chọn xuất hiện và hỗ trợ đánh; giải trừ thì chúng ẩn đi nhưng vẫn được lưu. Bóng mới thu phục được thêm vào bộ sưu tập, không thay thế thành viên cũ. Nếu đội 3/3, người chơi vào bảng Necromancer để chủ động thay một thành viên.

Bóng ma không chiếm ô thú triệu hồi hiện tại, không nhận sát thương thay người chơi và không tự tạo vật phẩm/kinh nghiệm. Hai hệ thống giữ vai trò riêng: thú là đồng hành cố định từ bộ sưu tập thú, bóng ma là quái đã được thu phục bằng chiến đấu.

## Bộ kỹ năng đề xuất

Các con số dưới đây là mốc cân bằng ban đầu, cần tinh chỉnh khi chơi thử. Kỹ năng thường mở theo cấp và điểm kỹ năng; **tuyệt kỹ chỉ học bằng Sách Tuyệt Kỹ**, đặt ở ô cuối theo quy tắc hiện tại.

| Kỹ năng | Mốc | Hiệu ứng |
| --- | ---: | --- |
| **Linh Tiễn** | 5 | Bắn linh tiễn xuyên mục tiêu. Kỹ năng đánh xa cơ bản; cấp cao tăng tầm và bắn thêm một tia. |
| **Linh Thể Hộ Vệ** | 8 | Gọi linh thể che chắn, giảm sát thương nhận vào. |
| **Nổ Linh Lực** | 12 | Giải phóng linh lực thành vụ nổ quanh người. |
| **Hiệu Lệnh Triệu Hồi** | 18 | Cường hóa thực thể được triệu hồi. |
| **Lời Nguyền Tàn Lụi** | 25 | Nguyền mục tiêu, gây sát thương và làm chậm. |
| **Triệu Hồi Bóng** | 25 | Bật/tắt đội bóng ma đã chọn. Giải trừ chỉ làm bóng ẩn đi; bật lại sẽ gọi đúng đội hình được lưu. |
| **Hút Linh** | 30 | Hút sinh lực của quái trong vùng nhỏ, gây sát thương và hồi một phần máu cho người chơi. |
| **Cổng Âm Giới** | Sách | **Tuyệt kỹ.** Mở cổng âm giới, giáng thiên thạch và cường hóa bóng ma đang theo. Chỉ học bằng Sách Tuyệt Kỹ. |
| **Đội Quân U Ảnh** | 35 | Tăng tốc đánh và sức mạnh cho bóng ma đang chiến đấu. |
| **Phân Hồn** | 40 | Phóng xung kích bóng tối, khiến đội bóng ma tập trung tấn công mục tiêu gần nhất. |

### Nội tại class

**Thu Hồn:** quái đủ điều kiện bị người chơi kết liễu sẽ được lưu thành bóng ma. Nếu đội hình đang bật và còn chỗ, bóng mới có thể nhập đội ngay; nếu đội đã đủ, bóng được lưu vào bộ sưu tập chờ người chơi đổi đội.

### Tuyệt kỹ và vai trò sức mạnh

**Cổng Âm Giới** là đòn mạnh nhất của class: phần nổ gây sát thương lớn, đồng thời tạo lợi thế triệu hồi trong giao tranh. Sức mạnh tổng tăng theo số bóng còn sống, nhưng có giới hạn rõ để tránh tạo đội quân không kiểm soát. Đây là kỹ năng tuyệt kỹ duy nhất của Necromancer, nằm cuối danh sách và chỉ mở bằng sách.

## Nhịp chơi dự kiến

1. Dùng phép tầm trung để hạ quái đầu tiên.
2. Thu Hồn tạo bóng ma đầu tiên, bóng bắt đầu hỗ trợ đánh.
3. Dùng nguyền để bóng tập trung vào mục tiêu nguy hiểm.
4. Dùng Hút Linh để hồi phục khi áp sát nhiều quái.
5. Dùng tuyệt kỹ khi có nhiều bóng hoặc gặp nhóm quái khó.

Class mạnh dần khi thu thập được nhiều bóng và chơi tốt khi chọn đội phù hợp. Người chơi có thể giải trừ để ẩn cả đội rồi bật lại bất cứ lúc nào; qua map và đăng nhập lại vẫn giữ nguyên. Điểm yếu là khởi đầu trận/boss ít mục tiêu yếu sẽ chưa có nhiều lựa chọn, sát thương trực tiếp vừa phải và số bóng hoạt động bị giới hạn.

## Mở khóa tiến hóa

Người chơi chọn Triệu Hồi Sư ở cấp 5; từ cấp 25, có thể đến gặp Lữ khách bí ẩn để tiến hóa thành Tử Linh Thuật Sư. Việc đổi nhánh giữ kỹ năng Triệu Hồi Sư đã học và mở bộ kỹ năng tiến hóa.

## Quyết định đã chốt

- Lộ trình: **Triệu Hồi Sư → Necromancer**.
- Tên hiển thị: **Tử Linh Thuật Sư** (tên tiếng Anh: Necromancer).
- Bộ sưu tập lưu tối đa **12 bóng**, hoạt động cùng lúc tối đa **3 bóng**.
- Khi bộ sưu tập đầy, giữ nguyên các bóng cũ; người chơi phải tự giải phóng chỗ trước khi thu thêm.
- Giải trừ kỹ năng chỉ ẩn đội đang theo. Bóng và đội hình được lưu qua map/đăng nhập; người chơi bật lại để gọi đúng đội đã chọn.
