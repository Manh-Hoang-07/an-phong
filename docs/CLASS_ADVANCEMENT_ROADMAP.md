# Kế hoạch lộ trình nâng cấp chức nghiệp

*Tài liệu thiết kế để duyệt trước khi triển khai. Phạm vi: các nhánh ngoài Triệu Hồi Sư → Tử Linh Thuật Sư đã chốt.*

## 1. Mục tiêu thiết kế

Mỗi nhánh tiến hóa cần làm rõ ba điều: nhân vật đánh theo cách nào, điểm mạnh riêng là gì, và người chơi cần học kỹ năng nào để dùng điểm mạnh đó. Chuyển chức không xóa kỹ năng cũ; kỹ năng mới bổ sung lựa chọn cho build đã có.

Các nhánh không chỉ tăng chỉ số. Sức mạnh mới chủ yếu đến từ nội tại, tương tác kỹ năng và công cụ chiến đấu. Điều này giúp class có bản sắc mà không làm chỉ số quái/boss hiện tại mất cân bằng.

## 2. Quy tắc tiến trình chung

| Giai đoạn | Cấp đề xuất | Nội dung |
| --- | ---: | --- |
| Chọn class nền | 5 | Giữ hệ thống thức tỉnh class đang có. Người chơi chọn một class thường. |
| Biến hình lần 1 | 20 | Đủ cấp mới nhận nhiệm vụ từ NPC ẩn. Hoàn thành nhiệm vụ nhận Sách Biến Hình I; dùng sách để mở khóa hình thái. |
| Tiến hóa chức nghiệp | 25 | Đủ cấp mới nhận nhiệm vụ nhánh từ NPC ẩn. Hoàn thành nhận Sách Tiến Hóa Chức Nghiệp; dùng sách để mở khóa hình thái tiến hóa riêng của class. |
| Biến hình lần 2 | 45 | Đủ cấp mới nhận nhiệm vụ từ NPC ẩn. Hoàn thành nhận Sách Biến Hình II; với Toàn Năng, sách này mở hình thái Tinh Thông và thuộc tính ×3. |
| Kỹ năng nhánh | 25, 30, 35, 40 | Mở dần kỹ năng đặc trưng của class tiến hóa. Kỹ năng nền đã học vẫn dùng được. |
| Tuyệt kỹ | Sách Tuyệt Kỹ | Mỗi nhánh dùng một tuyệt kỹ của cả dòng class. Chỉ học bằng Sách Tuyệt Kỹ và vẫn đặt ở ô cuối. Tuyệt kỹ tiếp tục là kỹ năng mạnh nhất. |

Khi chuyển map khỏi Tân Đô, NPC ẩn biến mất. Muốn gặp lại, người chơi phải quay lại map `lang` và nhập lại `ncp an`. Nhập câu đó ở map khác không có tác dụng. Cụm lệnh phải khớp chính xác `ncp an` sau khi bỏ khoảng trắng đầu/cuối; chữ hoa/thường không được đổi.

Ba mốc đều là nhiệm vụ riêng của NPC ẩn; chỉ nhận được khi đạt đúng cấp. Nếu người chơi rời Tân Đô giữa chừng, tiến độ nhiệm vụ vẫn lưu, nhưng phải gọi lại NPC bằng `ncp an` để tiếp tục/trả nhiệm vụ. Sách được tiêu hao lúc xác nhận mở khóa hình thái; hủy xác nhận thì sách vẫn còn. Mỗi sách chỉ cần dùng một lần, sau đó có thể bật/tắt hình thái mà không tiêu hao lại sách.

**Tiến hóa chức nghiệp là một hình thái biến hình, không thay class nền vĩnh viễn.** Khi kích hoạt, nhân vật đổi sang tạo hình chức nghiệp tiến hóa và dùng được bộ kỹ năng nhánh; khi giải trừ, trở về tạo hình/class nền. Kỹ năng và cấp kỹ năng đã học vẫn được giữ. Biến hình lần 1 và lần 2 cũng là hình thái có tạo hình riêng, được mở khóa bằng nhiệm vụ và sách tương ứng.

Để tránh cộng dồn chỉ số quá mạnh, chỉ một hình thái được bật tại một thời điểm. Biến hình II là bản nâng cao của biến hình I; hình thái chức nghiệp là nhánh tạo hình riêng. Đề xuất nút biến hình mở chọn hình thái đã mở khóa; nếu người chơi chỉ có một hình thái thì nút bật/tắt trực tiếp.

## 3. Các nhánh tiến hóa

### 3.1 Kiếm Sĩ → Kiếm Thánh

**Vai trò:** đấu sĩ áp sát, chém nhiều mục tiêu và kết liễu mục tiêu đơn. Kiếm Thánh mạnh khi giữ nhịp tấn công; không tăng phòng thủ đến mức thay thế Tanker.

**Hình ảnh:** giáp đỏ sẫm chuyển sang đỏ trắng, đường sáng vàng chạy dọc lưỡi kiếm, hào quang dạng vòng kiếm mảnh. Giữ silhouette kiếm sĩ hiện tại để người chơi nhận ra class nền.

**Nội tại nhánh – Kiếm Ý:** đánh thường trúng mục tiêu liên tiếp tích Kiếm Ý; dùng kỹ năng sẽ tiêu hao điểm để tăng nhẹ sát thương nhát cuối. Tích điểm có giới hạn để tránh sát thương tăng vô hạn.

**Kỹ năng mới dự kiến:**

| Mốc | Kỹ năng | Hiệu ứng |
| ---: | --- | --- |
| 25 | **Kiếm Khí Hoành Tảo** | Chém một đường kiếm rộng phía trước, xuyên qua nhiều quái. Cấp cao tăng tầm và thêm nhát chém cuối. |
| 30 | **Kiếm Tâm Phản Kích** | Tạm giảm sát thương; nếu bị đánh trong thời gian đó, tự tung một nhát phản kích. Hồi chiêu đủ dài để không thành khiên thường trực. |
| 35 | **Long Ảnh Liên Trảm** | Lướt ngắn đến trước mặt mục tiêu rồi chém liên tiếp. Khác kỹ năng lướt nền ở chỗ dồn sát thương lên mục tiêu đơn. |
| 40 | **Vạn Kiếm Quy Tông** | Kỹ năng chủ động diện rộng, gom nhịp kiếm ý thành một đợt chém nhiều hướng. Đây là kỹ năng thường mạnh nhất của nhánh; tuyệt kỹ dòng Kiếm Sĩ vẫn mạnh hơn. |

**Thử thách:** hạ một tinh anh bằng đòn cận chiến và hoàn thành một lượt đánh liên hoàn tại sân tập của Hội Hiệp Hội. Điều kiện khuyến khích học lối đánh, không buộc dùng vật phẩm hiếm.

### 3.2 Cung Thủ → Thần Xạ

**Vai trò:** sát thương tầm xa, đánh dấu mục tiêu và thưởng cho việc giữ khoảng cách. Máu vẫn thấp; không thêm lướt hoặc phòng thủ mạnh hơn Sát Thủ.

**Hình ảnh:** áo xanh lục đậm, cung phát sáng xanh ngọc, vệt tên mảnh và rõ. Tránh hiệu ứng mưa tên phủ kín màn hình trên điện thoại.

**Nội tại nhánh – Tâm Nhãn:** bắn trúng cùng một quái liên tiếp tạo dấu ngắm; đòn tiếp theo lên mục tiêu có dấu gây thêm sát thương giới hạn. Dấu mất khi đổi mục tiêu hoặc hết thời gian.

**Kỹ năng mới dự kiến:**

| Mốc | Kỹ năng | Hiệu ứng |
| ---: | --- | --- |
| 25 | **Ấn Tâm Tiễn** | Bắn tên xuyên giáp, đánh dấu mục tiêu; các bóng/thú đồng hành cũng ưu tiên mục tiêu này nếu phù hợp. |
| 30 | **Bước Lùi Liên Xạ** | Lùi khỏi quái gần nhất và bắn loạt tên về phía trước. Có khoảng cách an toàn nhưng sát thương mỗi tên thấp hơn kỹ năng đơn mục tiêu. |
| 35 | **Tên Nảy Liên Hoàn** | Một mũi tên nảy qua tối đa ba mục tiêu gần nhau. Nếu chỉ có một mục tiêu, không nhân sát thương thành ba lần. |
| 40 | **Thiên Võng Xạ Kích** | Đặt vùng tên xuống một khu vực đã nhắm; hiệu quả cao khi quái bị làm chậm hoặc đứng gần nhau. |

**Thử thách:** hạ nhóm quái bằng đòn tầm xa và đánh trúng mục tiêu di chuyển mà không nhận sát thương trong khoảng ngắn.

### 3.3 Pháp Sư → Đại Pháp Sư

**Vai trò:** pháp sư kiểm soát chiến trường bằng các nguyên tố, có sát thương diện rộng cao nhưng tiêu hao năng lượng lớn. Giữ khả năng hồi phục/khiên nền nhưng nhánh mới tập trung vào phép thuật.

**Hình ảnh:** áo chàm sáng, phù văn xanh lam và tím; kỹ năng nguyên tố dùng màu riêng, giới hạn độ phủ màn hình và số hiệu ứng cùng lúc.

**Nội tại nhánh – Cộng Hưởng Nguyên Tố:** dùng hai kỹ năng nguyên tố khác nhau liên tiếp tạo Cộng Hưởng; lần kế tiếp được tăng hiệu ứng khống chế hoặc bán kính, không tăng đồng thời toàn bộ sát thương.

**Kỹ năng mới dự kiến:**

| Mốc | Kỹ năng | Hiệu ứng |
| ---: | --- | --- |
| 25 | **Lôi Xà** | Tia sét truyền giữa một số mục tiêu gần nhau; sát thương giảm theo mỗi lần nảy. |
| 30 | **Hỏa Tường** | Dựng một dải lửa tồn tại ngắn, gây sát thương khi quái đi qua. |
| 35 | **Tinh Thạch Hộ Thể** | Tạo khiên có giới hạn hấp thụ, mạnh hơn khi vừa kích hoạt Cộng Hưởng. |
| 40 | **Bão Nguyên Tố** | Gọi nhiều đợt nguyên tố vào vùng mục tiêu; mỗi đợt có dấu hiệu báo trước để người chơi chủ động căn thời điểm. |

**Thử thách:** đóng băng một nhóm quái rồi hạ chúng bằng một nguyên tố khác; mục tiêu thể hiện việc luân phiên kỹ năng.

### 3.4 Sát Thủ → Ảnh Vương

**Vai trò:** áp sát nhanh, đánh dấu một mục tiêu và dồn sát thương ngắn. Máu thấp và phải canh thời điểm; không biến thành đấu sĩ đứng chịu đòn.

**Hình ảnh:** áo đen tím, viền bóng phân thân xuất hiện khi lướt, hiệu ứng đòn chí mạng ngắn gọn.

**Nội tại nhánh – Ấn Tử:** kỹ năng lướt đặt Ấn Tử lên một mục tiêu; đòn kế tiếp lên mục tiêu đó gây sát thương cộng thêm một lần. Ấn không cộng dồn.

**Kỹ năng mới dự kiến:**

| Mốc | Kỹ năng | Hiệu ứng |
| ---: | --- | --- |
| 25 | **Ảnh Bộ Đoạt Mệnh** | Lướt xuyên mục tiêu được đánh dấu và gây thêm một nhát ở điểm kết thúc. |
| 30 | **Phi Đao U Ảnh** | Phóng dao tầm trung; trúng mục tiêu đang mang Ấn Tử sẽ làm mới thời gian dấu, không cộng dồn sát thương. |
| 35 | **Thế Thân Bóng Tối** | Tạo một bóng thế thân ngắn để né đòn kế tiếp; không cho bất tử kéo dài. |
| 40 | **Bách Ảnh Sát** | Tập trung loạt đòn lên mục tiêu trước mặt; nếu không có mục tiêu gần, chỉ gây một phần sát thương để tránh đánh trúng quái ngoài màn hình. |

**Thử thách:** hạ tinh anh sau khi mở đầu bằng kỹ năng lướt và kết thúc bằng đòn chí mạng hoặc đòn kết liễu.

### 3.5 Tanker → Hộ Vệ Bất Khuất

**Vai trò:** sống sót, giữ quái chú ý và tạo khoảng trống cho thú/bóng đồng hành đánh. Sát thương thấp hơn các nhánh khác; sức mạnh nằm ở kiểm soát và phòng thủ.

**Hình ảnh:** giáp xanh thép lớn hơn một chút, khiên phát sáng lam; hiệu ứng phòng thủ có viền rõ nhưng không che quái.

**Nội tại nhánh – Thành Lũy:** đỡ sát thương tích điểm Thành Lũy; khi đạt ngưỡng, kỹ năng phòng thủ kế tiếp tạo xung chấn nhẹ. Điểm tự giảm nếu không giao chiến.

**Kỹ năng mới dự kiến:**

| Mốc | Kỹ năng | Hiệu ứng |
| ---: | --- | --- |
| 25 | **Khiêu Chiến** | Khiến quái thường gần đó chuyển mục tiêu sang người chơi trong thời gian ngắn. Không kéo boss qua địa hình hoặc khỏi khu vực chiến đấu. |
| 30 | **Thuẫn Trận** | Giảm sát thương và chống đẩy lùi; khiên không phản sát thương lớn ở cấp thấp. |
| 35 | **Chấn Địa** | Dậm đất gây sát thương vừa, làm chậm quái xung quanh và tạo thời gian hồi sức. |
| 40 | **Pháo Đài Tiến Quân** | Tiến chậm về phía trước trong tư thế phòng thủ; quái chạm khiên bị đẩy lùi. |

**Thử thách:** giữ Khiêu Chiến lên nhóm quái và sống sót qua vài đợt tấn công. Mục tiêu dựa vào sống sót, không kiểm tra DPS.

### 3.6 Trị Liệu Sư → Thánh Linh

**Vai trò:** duy trì sinh tồn bằng hồi máu, khiên và vùng thánh quang; sát thương vừa phải. Trong game chơi đơn, kỹ năng hỗ trợ có thể tác động lên người chơi và thú/bóng đồng hành đang ở gần.

**Hình ảnh:** áo trắng xanh ngọc, vòng sáng mảnh và biểu tượng thảo mộc/ánh sáng. Hồi máu dùng màu xanh lá; khiên dùng màu lam để người chơi phân biệt hiệu ứng.

**Nội tại nhánh – Dư Ân:** hồi máu vượt quá lượng máu thiếu chuyển thành khiên nhỏ, có giới hạn và tự tan sau vài giây. Không cho tích khiên vô hạn.

**Kỹ năng mới dự kiến:**

| Mốc | Kỹ năng | Hiệu ứng |
| ---: | --- | --- |
| 25 | **Thánh Vực** | Tạo vùng hồi máu theo nhịp; thú/bóng đồng hành trong vùng cũng hồi lượng nhỏ. |
| 30 | **Quang Tiễn** | Bắn đạn thánh xuyên quái; trúng quái đang bị nguyền gây thêm hiệu ứng làm chậm ngắn. |
| 35 | **Kết Giới Sinh Mệnh** | Tạo khiên cho bản thân và đồng hành quanh đó; lượng hấp thụ chia theo số mục tiêu. |
| 40 | **Bình Minh Tái Sinh** | Hồi lượng máu lớn cho bản thân, giải một hiệu ứng xấu và hồi một phần cho đồng hành; hồi chiêu dài. |

**Thử thách:** hoàn thành trận đánh với lượng máu thấp rồi tự hồi phục và hạ mục tiêu bằng kỹ năng Thánh Linh.

## 4. Toàn Năng: nhánh tinh thông đặc biệt

Toàn Năng vẫn là class đặc biệt, dùng mọi vũ khí và học được kỹ năng của các class. Chỉ số hiện tại nhân ba sẽ được gỡ khỏi class nền: Toàn Năng thường không có hệ số HP/ATK/MP/STA ×3.

Để cân bằng độ linh hoạt, sát thương kỹ năng của Toàn Năng bằng **80% sát thương của class gốc** cho kỹ năng được mượn, còn MP tiêu hao tăng **20%** (hệ số 1.2). Hai điều chỉnh này có hiệu lực từ lúc nhận class và vẫn giữ nguyên sau khi tinh thông.

Ở cấp 45, Toàn Năng nhận nhiệm vụ **Tinh Thông Toàn Năng** từ NPC ẩn. Hoàn thành nhiệm vụ sẽ nhận Sách Biến Hình II; dùng sách để mở hình thái Toàn Năng Tinh Thông. Chỉ hình thái này mới kích hoạt lại chỉ số ×3 theo bộ chỉ số hiện tại của Toàn Năng: HP, ATK, MP và STA. Đây là một biến hình, không cộng dồn thêm với hình thái chức nghiệp/hình thái biến hình khác.

Trong hình thái tinh thông, người chơi chọn một **Tinh Thông** làm nội tại chiến đấu; có thể đổi lựa chọn tại NPC bằng chi phí trong game.

| Tinh thông | Phong cách | Nội tại đề xuất |
| --- | --- | --- |
| **Võ Thần** | Cận chiến và đòn kết liễu | Sau khi dùng kỹ năng cận chiến, đòn đánh thường kế tiếp có tầm rộng hơn. |
| **Thần Xạ** | Tầm xa và chí mạng | Đánh dấu một mục tiêu; kỹ năng tầm xa đầu tiên trúng mục tiêu được thêm sát thương giới hạn. |
| **Nguyên Linh** | Phép thuật và khống chế | Luân phiên hai kỹ năng phép khác nhau tạo một lần giảm hồi chiêu nhỏ, có thời gian chờ nội tại. |

Toàn Năng giữ danh sách kỹ năng toàn class và tuyệt kỹ riêng hiện tại. Tinh Thông chỉ đổi một nội tại nhỏ; không tạo thêm ô kỹ năng và không cho học thêm tuyệt kỹ. Hệ số ×3 chỉ có khi bật hình thái Tinh Thông ở cấp 45; tắt biến hình thì trở lại chỉ số nền không nhân ba.

## 5. Tuyệt kỹ và kỹ năng nền

Mỗi dòng class tiếp tục có **một tuyệt kỹ**, nằm cuối danh sách và chỉ học bằng Sách Tuyệt Kỹ. Khi tiến hóa, người chơi giữ tuyệt kỹ đã học của class nền; tuyệt kỹ đó vẫn là kỹ năng mạnh nhất của cả dòng class. Không thêm tuyệt kỹ thứ hai vào cùng một ô.

Các kỹ năng mới cấp 25–40 là kỹ năng thường. Từng nhánh nhận một nội tại tiến hóa và 3–4 kỹ năng chủ động; không phải kỹ năng nào cũng cần tăng sát thương, một số mở thêm cách chơi như phản kích, đặt vùng hoặc đánh dấu mục tiêu.

## 6. NPC ẩn, nhiệm vụ và Sách Tiến Hóa Chức Nghiệp

Hiện game chưa có kênh chat người chơi. Kế hoạch cần thêm ô chat/lệnh gọn, dùng được cả bàn phím lẫn điện thoại. Ô chat chỉ gửi lệnh trong game; không cần tạo chat giữa người chơi.

### Gặp NPC ẩn

1. Người chơi vào `lang` — map **Tân Đô – Khu Hiệp Hội**.
2. Nhập `ncp an` rồi gửi.
3. Server xác nhận map hiện tại và cụm lệnh; nếu hợp lệ, bật NPC ẩn trên map và phát một dòng gợi ý trong nhật ký.
4. NPC xuất hiện tại một điểm cố định gần khu Hiệp Hội, dùng tên đề xuất **Ẩn Sĩ Chức Nghiệp**. Có thể tương tác như NPC thường để nhận nhiệm vụ.
5. Khi đổi khỏi `lang`, trạng thái hiện diện bị xóa. Đổi map quay lại không tự hiện NPC; người chơi phải chat lại.

NPC chỉ mở cho đúng nhân vật/map hiện tại; không hiển thị bằng cách mở trực tiếp panel hoặc gọi action giả. Server kiểm tra trạng thái NPC đã được gọi trước khi nhận/trả nhiệm vụ. Nếu chat sai map, nhật ký báo ngắn: “Không có hồi đáp.”

### Nhiệm vụ theo từng mốc và sách

Mỗi mốc là một nhiệm vụ riêng, chỉ mở ở đúng cấp:

| Cấp mở | Nhiệm vụ/NPC ẩn | Sách thưởng | Hiệu quả khi dùng |
| ---: | --- | --- | --- |
| 20 | Thử Thách Thức Tỉnh | **Sách Biến Hình I** | Mở khóa hình thái biến hình lần 1. |
| 25 | Thử Thách Chức Nghiệp theo class nền | **Sách Tiến Hóa Chức Nghiệp** | Mở hình thái tiến hóa riêng của nhánh class. |
| 45 | Thử Thách Thức Tỉnh Bậc Hai; Toàn Năng làm nhiệm vụ Tinh Thông | **Sách Biến Hình II** | Mở biến hình lần 2; với Toàn Năng, mở hình thái Tinh Thông và hệ số thuộc tính ×3. |

- Nhiệm vụ gồm mục tiêu nhận diện lối chơi, thử thách chiến đấu phù hợp cấp, rồi quay lại NPC ẩn để hoàn tất. Không yêu cầu vật phẩm rơi ngẫu nhiên hiếm.
- Ba loại sách là vật phẩm riêng, không thay thế cho Sách Kỹ Năng hay Sách Tuyệt Kỹ.
- Khi dùng sách, server kiểm tra cấp, nhiệm vụ đã hoàn thành, class nền và hình thái đích hợp lệ. Nếu thiếu điều kiện, sách không bị tiêu hao.
- Dùng sách thành công sẽ lưu quyền bật hình thái; bật/tắt về sau không tiêu hao sách thêm.
- Nhiệm vụ được hoàn thành một lần cho mỗi mốc của nhân vật; nói chuyện lại không phát thêm sách. Nếu đổi class qua hệ thống đặc biệt, chỉ nhiệm vụ chuyển chức phù hợp mới có thể mở lại.
- Luồng sách áp dụng cả lộ trình **Triệu Hồi Sư → Tử Linh Thuật Sư**. Bản hiện tại đang cho phép tiến hóa trực tiếp ở cấp 25; cần đổi sang nhiệm vụ NPC ẩn và Sách Tiến Hóa Chức Nghiệp khi triển khai hệ thống chung.

**Luồng mẫu:** Kiếm Sĩ cấp 20 → vào Tân Đô → chat `ncp an` → nhận Thử Thách Thức Tỉnh → hoàn thành → nhận và dùng Sách Biến Hình I → bật/tắt hình thái I. Đến cấp 25, người chơi làm nhiệm vụ class tương tự để nhận Sách Tiến Hóa Chức Nghiệp. Nếu rời Tân Đô giữa chừng, tiến độ lưu; phải gọi NPC lại bằng lệnh để tiếp tục hoặc nhận sách.

Sách Biến Hình II ở cấp 45 là nhánh nâng cấp tiếp theo của hệ biến hình. Với Toàn Năng, cùng mốc này mở Tinh Thông Toàn Năng; chỉ trạng thái Tinh Thông đang bật mới nhân ba HP/ATK/MP/STA.

## 7. Hướng tìm và dùng bộ ảnh

Các hình thái tiến hóa cần có sprite khác hình dạng rõ ràng khi bật biến hình và trở lại sprite nền khi giải trừ. Nên dùng cùng chiều cao hiển thị, điểm đặt chân, hướng nhìn và bảng màu theo class; hoạt ảnh tối thiểu gồm đứng, chạy, nhảy/rơi, đánh, trúng đòn và chết. Ở khung game hiện tại, nhân vật cao khoảng 56 px trong thế giới game; ảnh gốc có thể lớn hơn nhưng cần giữ cạnh pixel sắc khi thu nhỏ.

**Ứng viên để xem trước, chưa chọn/tải vào game:**

| Bộ ảnh | Điểm phù hợp | Điểm cần kiểm tra |
| --- | --- | --- |
| [Platformer Explorer Assets](https://thisbutdragons.itch.io/platformer-explorer) | Miễn phí, CC0, vẽ tay; có idle/run/jump/hit/attack và file Aseprite, gần với game đi cảnh ngang hiện tại. | Số mẫu nhân vật có hạn; cần kiểm tra có đủ dáng cho Tanker, Pháp Sư, Trị Liệu Sư và các biến thể tiến hóa không. |
| [Free CC0 Fantasy Sprite Sheets](https://spritecanvas.itch.io/free-cc0-fantasy-sprite-sheets) | Bộ fantasy có nhân vật kiếm sĩ, hiệp sĩ rêu, hoạt ảnh chiến đấu và hiệu ứng phép; CC0. | Trang ghi rõ ảnh có AI hỗ trợ; ô sprite khá lớn và phong cách có thể lệch với nhân vật hiện có, cần xem sprite sheet và thử thu nhỏ trước. |
| [Micro Character Bases](https://thkaspar.itch.io/micro-character-bases) | Sáu nhân vật pixel, sprite sheet gọn, có idle/walk/punch/hit/death; CC0. | Cần bổ sung động tác đánh kiếm/cung/phép và hình thái tiến hóa; phù hợp làm nền tham khảo hơn là dùng nguyên bản. |

**Hướng đề xuất:** trước tiên lấy các bộ CC0 làm mẫu so sánh trong tài liệu/preview, sau đó chọn một họ hình thống nhất hoặc chỉnh sprite nhân vật hiện tại thành các biến thể tiến hóa. Không trộn một bộ ảnh khác phong cách cho từng class. Các gói có AI disclosure hoặc thiếu animation phải được ghi rõ; chưa tải asset hay đưa vào game trong giai đoạn lập kế hoạch.

## 8. Thứ tự triển khai đề xuất

1. **NPC ẩn, ba nhiệm vụ và ba sách hình thái:** làm trước để mọi class dùng chung luồng nhận nhiệm vụ, kiểm tra cấp, phát sách và bật hình thái.
2. **Kiếm Sĩ → Kiếm Thánh** và **Tanker → Hộ Vệ Bất Khuất**: kiểm tra hai lối cận chiến khác biệt rõ nhất.
3. **Cung Thủ → Thần Xạ** và **Sát Thủ → Ảnh Vương**: hoàn thiện hai nhánh sát thương nhanh, bảo đảm vai trò tầm xa và áp sát không trùng nhau.
4. **Pháp Sư → Đại Pháp Sư** và **Trị Liệu Sư → Thánh Linh**: thêm trạng thái nguyên tố, khiên và hồi phục đồng hành.
5. **Toàn Năng Tinh Thông**: làm sau cùng, gỡ hệ số ×3 khỏi class nền và chỉ kích hoạt trong hình thái cấp 45.
6. Chọn/chuẩn hóa sprite, sau đó tích hợp hoạt ảnh cho từng hình thái. Giữ chất lượng hình ảnh; tối ưu bằng cách tải sprite theo class/hình thái cần dùng.
7. Sau mỗi đợt, kiểm tra kỹ năng mới trên điện thoại, vùng hiệu ứng, số quái trên màn hình và thời gian tải sprite.

## 9. Những nguyên tắc cân bằng cần giữ

- Tiến hóa không xóa kỹ năng đã học, khôngkhi  tự học tuyệt kỹ và không chuyển tuyệt kỹ ra khỏi ô cuối.
- Không cộng nhiều hệ số chỉ số cùng lúc; nhánh mạnh nhờ cơ chế riêng.
- Mỗi kỹ năng diện rộng có giới hạn số lần trúng/nhịp hoặc hồi chiêu tương xứng.
- Không tạo quái đồng hành có thể rơi vật phẩm/kinh nghiệm; bóng ma thuộc riêng nhánh Tử Linh Thuật Sư.
- Boss không bị kéo mục tiêu, đóng băng hoặc đẩy lùi vô hạn.
- Kỹ năng hỗ trợ thú/bóng phải có giới hạn và chỉ tác động lên đồng hành đang được triệu hồi.
- Tuyệt kỹ luôn có tổng sức mạnh/giá trị chiến đấu cao hơn kỹ năng thường cấp 40.

## 10. Các đề xuất cần bạn duyệt

1. Tên các nhánh: **Kiếm Thánh, Thần Xạ, Đại Pháp Sư, Ảnh Vương, Hộ Vệ Bất Khuất, Thánh Linh**.
2. NPC ẩn chỉ được gọi ở Tân Đô bằng chính xác `ncp an`, và phải gọi lại sau mỗi lần đổi map.
3. Biến hình I cấp 20, hình thái tiến hóa cấp 25, biến hình II cấp 45; mỗi hình thái có nhiệm vụ và sách riêng.
4. Hình thái tiến hóa là biến hình có thể bật/tắt, không xóa class nền; chỉ một hình thái hoạt động tại một thời điểm.
5. Toàn Năng cơ bản gây 80% sát thương kỹ năng class gốc và tốn thêm 20% MP; chỉ Toàn Năng Tinh Thông cấp 45 mới có HP/ATK/MP/STA ×3.
6. Mỗi dòng class giữ một tuyệt kỹ duy nhất; tuyệt kỹ nền được giữ lại sau tiến hóa.
7. Bộ kỹ năng mới cấp 25, 30, 35, 40 như các bảng trên.
