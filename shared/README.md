# `shared/` — bản đồ thư mục

Thư mục này là **nội dung game**, không phải dữ liệu người chơi. Server và trình duyệt nạp **cùng một bộ file**:
server qua `require()` trong `shared/index.js`, trình duyệt qua thẻ `<script>` trong `public/index.html`.

Hai danh sách đó **phải khớp nhau**. Kiểm tra bất cứ lúc nào:

```
node server/tools/check/check-shared-order.js
```

## Thêm nội dung thì thêm vào đâu

| Muốn thêm | Thêm vào file | Có phải sửa danh sách nạp? |
|---|---|---|
| Thuốc, nguyên liệu, sách, vật phẩm nhiệm vụ | `data/items/potions.js`, `materials.js`, `books.js`, `quest-items.js` | Không |
| Trang bị theo ô | `data/items/armor/<ô>.js` (mũ, áo, quần, giày, găng tay, đai lưng, nhẫn, dây chuyền, ngọc bội) | Không |
| Vũ khí viết tay | `data/items/weapons.js` | Không |
| Quái của chương đã có | `data/monsters/chapter<N>.js` | Không |
| **Quái của chương mới** | tạo `data/monsters/chapter<N+1>.js` | **Có** — thêm vào `shared/index.js` + `public/index.html` |
| Nhiệm vụ chính của chương đã có | `data/quests/chapter<N>.js` | Không |
| **Nhiệm vụ chính của chương mới** | tạo `data/quests/chapter<N+1>.js` | **Có** |
| Nhiệm vụ phụ | `data/quests/side.js` | Không |
| Bản đồ của chương đã có | `data/maps/chapter<N>.js` | Không |
| **Bản đồ của chương mới** | tạo `data/maps/chapter<N+1>.js` | **Có** |
| Kỹ năng của class đã có | `data/skills/classes/<class>.js` | Không |
| **Class mới** | tạo `data/skills/classes/<class>.js` | **Có** |
| Kỹ năng nhánh tiến hóa | `data/skills/evolution/evo-<tên>.js` | Không |
| Tuyệt kỹ | `data/skills/ult/ult-<nhóm>.js` | Không |
| Nội tại cốt truyện | `data/skills/perks.js` | Không |
| Thú đồng hành, kỹ năng thú | `data/pets/mounts.js` | Không |
| Linh thú Triệu Hồi Sư | `data/pets/summons.js` | Không |
| NPC | `data/npcs.js` | Không |

## Cây thư mục

```
shared/
  core.js                  GameData rỗng + công thức chung (expToNext, interp, mitigate...)
  index.js                 danh sách nạp cho server — ĐỐI CHIẾU với public/index.html
  data/
    classes.js             SCHOOLS, AWAKENS — tên class, nhánh tiến hóa
    equipment.js           phẩm chất, dòng phụ, tỉ lệ nâng cấp
    npcs.js                NPC + phần sinh NPC dịch vụ cho từng làng
    items/
      potions.js           thuốc
      materials.js         nguyên liệu, bùa tăng cường
      books.js             sách kỹ năng / tuyệt kỹ / biến hình
      quest-items.js       vật phẩm nhiệm vụ
      weapons.js           vũ khí viết tay
      armor/<ô>.js         trang bị theo ô: mu, ao, quan, giay, gang_tay, dai_lung, nhan, day_chuyen, ngoc_boi
      index.js             gộp các phần + SINH vũ khí theo bậc + sách tuyệt kỹ
      sets.js              ô trang bị và 10 bộ theo cấp
    monsters/
      chapter1..10.js      quái theo chương
      grades.js            hệ số theo hạng quái (tinh anh, thủ lĩnh, trùm)
      index.js             gộp thành MONSTERS
    maps/
      chapter1..10.js      bản đồ theo chương
      index.js             gộp thành MAPS + NEW_PLAYER_MAP, VILLAGES, TELEPORT_FEE
    quests/
      helpers.js           khung chung: rw(cấp, loại, items, extra) tính thưởng theo cấp
      chapter1..10.js      chính tuyến từng chương (cùng một khung)
      hau-truyen.js        hậu truyện
      index.js             gộp thành QUESTS, ĐÚNG THỨ TỰ cốt truyện
      side.js              phụ tuyến
      legacy.js            chuyển tiến độ phiên bản cũ
      periodic.js          hằng số nhiệm vụ ngày / tuần
    skills/
      classes/<class>.js   kỹ năng chức nghiệp 1
      evolution/evo-*.js   kỹ năng chức nghiệp 2 (nhánh tiến hóa)
      ult/ult-*.js         tuyệt kỹ học bằng sách
      index.js             gộp thành SKILLS + hằng số ô kỹ năng
      perks.js             nội tại cốt truyện
    pets/
      mounts.js            thú đồng hành + kỹ năng thú
      summons.js           linh thú của Triệu Hồi Sư
      curve.js             đường cong chỉ số thú theo cấp
      summon-stats.js      chỉ số linh thú đang gọi
      shadow.js            bóng ma của Tử Linh Thuật Sư
  logic/                   hàm suy ra từ dữ liệu trên, KHÔNG khai báo dữ liệu mới
    items.js  monsters.js  skills.js  player.js  quests.js  shop.js
```

## Ba quy tắc khi sửa

1. **Thứ tự nạp có lý do.** `core` trước (tạo `GameData`), rồi `classes`, rồi `skills`, rồi `items`
   (items sinh sách tuyệt kỹ từ `SKILLS`), rồi `monsters`, `npcs`, `maps`, `pets`, cuối là `quests`
   (cần map / NPC / quái / vật phẩm). `quests/helpers.js` nạp trước mọi `chapter*.js` vì các chương
   đọc `G.questReward`. `logic/*` sau cùng.

2. **Thứ tự trong `quests/index.js` là thứ tự cốt truyện, không được đổi.** Tiến độ người chơi lưu
   bằng chỉ số bước (`p.quest.step`). Chèn một nhiệm vụ vào giữa sẽ làm lệch tiến độ của người đang chơi.
   Thêm chương mới thì thêm file và thêm `require` ở **cuối** danh sách.

3. **Mỗi file là một IIFE gắn vào `GameData`.** File con đẩy phần của mình vào registry tạm
   (`G.QUEST_PARTS`, `G.MAP_PARTS`, `G.SKILL_PARTS`, `G.ITEM_PARTS`, `G.MON_PARTS`); file `index.js`
   gộp lại rồi `delete` registry đó. Nếu thấy `G.*_PARTS` còn sót trong console là có file `index.js`
   chưa chạy.

## Kiểm tra sau khi sửa

```
node server/tools/gen/snapshot-data.js --out before.json   # trước khi sửa
node server/tools/gen/snapshot-data.js --out after.json    # sau khi sửa
node server/tools/gen/snapshot-data.js --diff before.json after.json
node server/tools/check/check-shared-order.js
npm run check:mobs
npm run check:maps
node server/tools/check/check-quests.js
```

`--diff` in ra `GIỐNG HỆT` khi dữ liệu không đổi một byte nào. Đó là cách chứng minh một lần tách file
không làm hỏng gì.

## Lưu ý về encoding

Đừng dùng `Get-Content` / `Set-Content` / `>` của PowerShell để sửa file trong thư mục này.
Nó ghi UTF-16 và làm hỏng dấu tiếng Việt. Dùng `writeLocalFile`, `editLocalFile`, hoặc một script Node
(`fs.readFileSync` / `fs.writeFileSync` với `'utf8'`).
