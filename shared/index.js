/*
 * Điểm vào dữ liệu game cho server: nạp các file trong shared/ theo đúng thứ tự.
 *
 * QUAN TRỌNG: trình duyệt nạp CÙNG danh sách này bằng thẻ <script> trong public/index.html.
 * Hai danh sách phải khớp nhau. Sửa một bên thì sửa cả hai.
 * Kiểm tra: node server/tools/check/check-shared-order.js
 *
 * Thứ tự có lý do, không tùy tiện:
 *   1. core            tạo GameData rỗng + công thức chung (mọi file sau gắn vào đây)
 *   2. classes         SCHOOLS / AWAKENS — skills và items đọc tên class
 *   3. skills          SKILLS — items sinh sách tuyệt kỹ từ đây
 *   4. items           vật phẩm (nhiều file, xem bên dưới)
 *   5. equipment       phẩm chất, dòng phụ, tỉ lệ nâng cấp
 *   6. monsters        quái — cần items để khai báo đồ rơi
 *   7. npcs            NPC — cần items cho danh sách bán
 *   8. maps            bản đồ — cần npcs và monsters để đặt chỗ
 *   9. mounts          thú cưỡi, linh thú, bóng ma — cần monsters
 *  10. quests          nhiệm vụ — cần maps, npcs, monsters, items
 *  11. logic/*         hàm suy ra từ dữ liệu ở trên (không khai báo dữ liệu mới)
 */
require('./core');

// ---- Class: mỗi chủ đề một file. schools phải nạp trước vì skills / items đọc tên class
require('./data/classes/schools');
require('./data/classes/evolutions');
require('./data/classes/awakens');
require('./data/classes/weapons');
require('./data/classes/passives');
require('./data/classes/stamina');
require('./data/classes/index');
// ---- Kỹ năng: mỗi class một file, index.js gộp lại; ult/ là tuyệt kỹ, perks.js là nội tại
require('./data/skills/classes/kiem-si');
require('./data/skills/classes/cung-thu');
require('./data/skills/classes/phap-su');
require('./data/skills/classes/toan-nang');
require('./data/skills/classes/sat-thu');
require('./data/skills/classes/tanker');
require('./data/skills/classes/tri-lieu-su');
require('./data/skills/classes/trieu-hoi-su');
require('./data/skills/evolution/evo-kiem-thanh');
require('./data/skills/evolution/evo-than-xa');
require('./data/skills/evolution/evo-dai-phap-su');
require('./data/skills/evolution/evo-anh-vuong');
require('./data/skills/evolution/evo-ho-ve');
require('./data/skills/evolution/evo-thanh-linh');
require('./data/skills/ult/ult-can-chien');
require('./data/skills/ult/ult-tam-xa');
require('./data/skills/ult/ult-ho-tro');
require('./data/skills/ult/ult-dac-biet');
require('./data/skills/index');
require('./data/skills/perks');

// ---- Vật phẩm: mỗi file một nhóm. Thêm vật phẩm thì thêm vào file nhóm, không tạo file mới
//      trừ khi là nhóm mới hẳn. index.js gộp các phần lại và sinh vũ khí / sách bằng công thức.
require('./data/items/potions');       // thuốc
require('./data/items/materials');     // nguyên liệu, bùa tăng cường
require('./data/items/books');         // sách kỹ năng / tuyệt kỹ / biến hình
require('./data/items/pet-gear');      // trang bị cho thú (yên, dây cương, giáp, vòng cổ)
require('./data/items/quest-items');   // vật phẩm nhiệm vụ
require('./data/items/weapons');       // vũ khí viết tay
require('./data/items/armor/mu');      // trang bị: mũ
require('./data/items/armor/ao');      //          áo
require('./data/items/armor/quan');    //          quần
require('./data/items/armor/giay');    //          giày
require('./data/items/armor/gang_tay');//          găng tay
require('./data/items/armor/dai_lung');//          đai lưng
require('./data/items/armor/nhan');    //          nhẫn
require('./data/items/armor/day_chuyen'); //       dây chuyền
require('./data/items/armor/ngoc_boi');   //       ngọc bội
require('./data/items/index');         // gộp các phần + sinh vũ khí theo bậc + sách tuyệt kỹ
require('./data/items/sets');          // ô trang bị và 10 bộ theo cấp

require('./data/equipment');
// ---- Quái: mỗi chương một file, index.js gộp lại; grades.js là hệ số theo hạng
require('./data/monsters/chapter1');
require('./data/monsters/chapter2');
require('./data/monsters/chapter3');
require('./data/monsters/chapter4');
require('./data/monsters/chapter5');
require('./data/monsters/chapter6');
require('./data/monsters/chapter7');
require('./data/monsters/chapter8');
require('./data/monsters/chapter9');
require('./data/monsters/chapter10');
require('./data/monsters/index');
require('./data/monsters/grades');
// ---- NPC: story (cốt truyện) → services (dịch vụ Tân Đô I) → villages (nhân bản ra từng làng)
require('./data/npcs/story');
require('./data/npcs/services');
require('./data/npcs/villages');
require('./data/npcs/index');
// ---- Bản đồ: mỗi chương một file, index.js gộp lại; index.js giữ hằng số làng / phí dịch chuyển
require('./data/maps/chapter1');
require('./data/maps/chapter2');
require('./data/maps/chapter3');
require('./data/maps/chapter4');
require('./data/maps/chapter5');
require('./data/maps/chapter6');
require('./data/maps/chapter7');
require('./data/maps/chapter8');
require('./data/maps/chapter9');
require('./data/maps/chapter10');
require('./data/maps/index');
// ---- Thú cưỡi / linh thú / bóng ma. Thứ tự: dữ liệu loài trước, công thức sau
require('./data/pets/mounts');        // thú đồng hành + kỹ năng thú
require('./data/pets/summons');       // linh thú của Triệu Hồi Sư
require('./data/pets/curve');         // đường cong chỉ số thú theo cấp
require('./data/pets/gear');          // chỉ số thú đồng hành (cố định) + trang bị thú
require('./data/pets/summon-stats');  // chỉ số linh thú đang gọi
require('./data/pets/shadow');        // bóng ma của Tử Linh Thuật Sư

// ---- Nhiệm vụ chính tuyến: mỗi chương một file, index.js gộp lại ĐÚNG THỨ TỰ cốt truyện
//      (tiến độ người chơi lưu bằng chỉ số bước, nên thứ tự này không được đổi)
require('./data/quests/helpers');      // khung chung: rw() tính thưởng theo cấp
require('./data/quests/chapter1');     // chương 1 – Cổng Đỏ
require('./data/quests/chapter2');     // chương 2 – Bóng Trăng Khuyết
require('./data/quests/chapter3');     // chương 3 – Lò Rèn Cổ
require('./data/quests/chapter4');     // chương 4 – Tầng Trời Thứ Bảy
require('./data/quests/chapter5');     // chương 5 – Cổng Vĩnh Hằng
require('./data/quests/hau-truyen');   // hậu truyện – Tàn dư Cổng Vĩnh Hằng
require('./data/quests/chapter6');     // chương 6 – Thiên Khôi
require('./data/quests/chapter7');     // chương 7 – Long Mạch
require('./data/quests/chapter8');     // chương 8 – Tinh Vân
require('./data/quests/chapter9');     // chương 9 – Thần Mộng
require('./data/quests/chapter10');    // chương 10 – Sáng Thế
require('./data/quests/index');        // gộp thành QUESTS
require('./data/quests/side');         // phụ tuyến
require('./data/quests/legacy');       // chuyển tiến độ phiên bản cũ
require('./data/quests/periodic');     // hằng số nhiệm vụ ngày / tuần

require('./logic/items');
require('./logic/monsters');
require('./logic/skills');
require('./logic/player');
require('./logic/quests');
require('./logic/shop');

module.exports = require('./core');
