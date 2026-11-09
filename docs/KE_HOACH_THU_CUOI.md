# Thú triệu hồi

Thú trong game được triệu hồi để đi theo người chơi, tự tìm quái ở gần và hỗ trợ chiến đấu. Người chơi không cưỡi thú và có thể gọi nhiều thú cùng lúc.

- Mỗi thú có HP, MP, thể lực và cấp đồng bộ với nhân vật; các chỉ số hiển thị dưới HUD người chơi và được lưu riêng.
- **Linh thú của Triệu Hồi Sư** (kỹ năng Triệu Hồi Linh Thú) và **bóng ma của Tử Linh Thuật Sư** có cấp và kinh nghiệm riêng, không còn theo cấp nhân vật: linh thú bắt đầu từ cấp 1 và lên cấp khi đánh quái; bóng ma có cấp bằng cấp quái lúc bị hạ, sau đó cũng lên cấp bằng đánh quái. Cấp của thú/bóng tối đa bằng cấp người chơi; tự kết liễu quái nhận 100% kinh nghiệm, chủ kết liễu nhận 50% (bóng chia đều cho đội đang hoạt động). Chi tiết trong `KE_HOACH_CAP_DO_THU_TRIEU_HOI.md`.
- Thú đánh thường tự động, đồng thời dùng kỹ năng trong ô kỹ năng. Khi gục, thú hồi sinh sau 15 giây.
- Mã quà tặng `--mount <id>` vẫn hoạt động để giữ tương thích với các mã và dữ liệu sở hữu đã phát trước đó.
- Ảnh thú dùng các sprite CC0 từ **Animated Wild Animals**, **pixel horse**, **pixel wolf**, cùng ảnh hạc và thằn lằn. Nguồn và giấy phép nằm trong `public/assets/CREDITS.txt`.

Mã liên quan: `shared/data/mounts.js`, `public/js/art/pets.js`, `public/js/scene/player.js`, `public/js/scene/combat.js`, `public/js/ui/panels/mount.js`.
