# Thú triệu hồi

Thú trong game được triệu hồi để đi theo người chơi, tự tìm quái ở gần và hỗ trợ chiến đấu. Người chơi không cưỡi thú và có thể gọi nhiều thú cùng lúc.

- Mỗi thú có HP, MP, thể lực và cấp đồng bộ với nhân vật; các chỉ số hiển thị dưới HUD người chơi và được lưu riêng.
- Thú đánh thường tự động, đồng thời dùng kỹ năng trong ô kỹ năng. Khi gục, thú hồi sinh sau 15 giây.
- Mã quà tặng `--mount <id>` vẫn hoạt động để giữ tương thích với các mã và dữ liệu sở hữu đã phát trước đó.
- Ảnh thú dùng các sprite CC0 từ **Animated Wild Animals**, **pixel horse**, **pixel wolf**, cùng ảnh hạc và thằn lằn. Nguồn và giấy phép nằm trong `public/assets/CREDITS.txt`.

Mã liên quan: `shared/data/mounts.js`, `public/js/art/pets.js`, `public/js/scene/player.js`, `public/js/scene/combat.js`, `public/js/ui/panels/mount.js`.
