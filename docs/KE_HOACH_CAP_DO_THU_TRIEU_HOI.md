# Đánh giá & kế hoạch: cấp độ và chỉ số riêng cho linh thú / bóng ma

*Tài liệu đánh giá và kế hoạch triển khai — **đã triển khai xong** (xem phần 6).*

## 1. Hiện trạng

### Linh thú của Triệu Hồi Sư
- 4 loại linh thú cố định (`linh_soi`, `linh_hac`, `linh_than`, `linh_ky`) chỉ khác hệ số `atk` (1 → 1.2) và ngoại hình.
- Chỉ số tính bằng `summonStats(player)` trong `shared/data/mounts.js:29`, **chỉ phụ thuộc cấp nhân vật + cấp kỹ năng th5**. Vì vậy mọi linh thú bất kỳ loại nào, bất kỳ người chơi nào cùng cấp đều có chỉ số y hệt nhau. Không có cấp riêng, không có kinh nghiệm, không có sự phát triển theo thời gian chơi.
- Trạng thái chỉ lưu HP/MP/thể lực (`p.summons.states`), không lưu cấp.

### Bóng ma của Tử Linh Thuật Sư
- Khi thu phục, server lưu `soul = { uid, monster, stats: monSnapshot(...) }` (`server/game/actions/combat.js:56`) — chụp nguyên thông số quái **tại thời điểm bị hạ** rồi đóng băng vĩnh viễn.
- Bóng ma không có cấp độ riêng, không lên cấp, chỉ số không bao giờ thay đổi: con bóng thu ở cấp 10 mãi là bóng cấp 10 dù người chơi đã lên cấp 40.
- Điểm đáng chú ý: sát thương bóng ma ở client là **hệ số cố định 0.32** nhân với buff (`public/js/scene/player.js:522`), thậm chí chưa dùng dữ liệu `soul.stats` đã lưu — tức là bóng mạnh/yếu như nhau bất kể quái gốc mạnh hay yếu.

### Cơ sở sẵn có (thuận lợi cho việc làm)
- `monSnapshot` (`shared/logic/monsters.js:16`) **đã lưu `level` của quái lúc chết** — đúng dữ liệu cần cho quy tắc "bóng ma có cấp bằng cấp quái khi bị hạ".
- Sự kiện hạ quái từ client đã mang `source` ('player' / 'pet' / 'shadow') — `public/js/scene/monsters.js:96`, server đã tin và dùng để phân biệt ai kết liễu (`server/game/actions/combat.js:22,52`). Đây là móc sẵn để cộng kinh nghiệm cho thú/bóng.

## 2. Đánh giá tính hợp lý

**Kết luận: hướng đề xuất hợp lý và đáng làm**, vì:

1. **Sửa đúng chỗ sai hiện tại**: hai hệ thống đang "giả cấp độ" — linh thú mượn cấp nhân vật, bóng ma đóng băng chỉ số. Cấp riêng + chỉ số riêng làm cho nuôi thú có ý nghĩa thật.
2. **Phân biệt rõ 2 class**: Triệu Hồi Sư nuôi một linh thú từ nhỏ (bắt đầu cấp 1, đồng hành lâu dài); Tử Linh Thuật Sư "chiêu mộ" quân ngay trong trận (bóng có cấp sẵn theo quái chết). Hai nhịp chơi khác nhau đúng tinh thần thiết kế trong `NECROMANCER_PROPOSAL.md`.
3. **Chi phí kỹ thuật thấp**: hạ tầng cần thiết (source kill, snapshot level, bảng panel) đã có sẵn; chủ yếu đổi công thức chỉ số và thêm luồng cộng kinh nghiệm.

### Các điểm cần cân nhắc trước khi chốt

| Vấn đề | Rủi ro nếu làm theo đề xuất thô | Đề xuất xử lý |
| --- | --- | --- |
| **Tăng chỉ số kép** | Nhân vật đã scale theo cấp; nếu linh thú/bóng cũng scale theo cấp riêng thì tổng sức mạnh tăng gấp đôi theo thời gian | Cấp thú/bóng **giới hạn bằng cấp nhân vật** (không vượt lv chủ); đồng thời hạ nhẹ hệ số skill th5 buff để tổng lực không vượt trội |
| **AFK nuôi cấp** | Linh thú tự đánh quái → người chơi treo máy để thú farm cấp | Kinh nghiệm thú/bóng nhân hệ số chênh lệch cấp quái như kinh nghiệm người chơi (`expMul` hiện có, quái thấp hơn 5+ cấp cho rất ít) |
| **Bóng mới quá mạnh** | Bóng cấp = cấp quái chết: hạ boss/bóng quái cấp cao sẽ ra quân vượt cấp chủ | Bóng vào đội bị **kẹp hiệu lực xuống tối đa bằng cấp chủ**; lưu nguyên cấp thật để khi chủ lên cấp thì bóng "mở khóa" lại |
| **Dữ liệu người chơi cũ** | Linh thú đang theo cấp 1 sẽ yếu đi đột ngột nếu reset | Migrate: linh thú cũ được sinh cấp bằng cấp nhân vật lúc migrate; bóng ma cũ giữ cấp từ snapshot đã lưu |
| **Chia kinh nghiệm đội bóng** | 5 bóng cùng đội sẽ lên cấp nhanh gấp 5 lần | Kinh nghiệm quái chia đều cho các bóng đang hoạt động (hoặc chỉ bóng kết liễu được cộng full) |

## 3. Thiết kế đề xuất

### 3.1 Linh thú (Triệu Hồi Sư)

| Quy tắc | Đề xuất |
| --- | --- |
| Cấp khởi điểm | Cấp 1 (migrate từ dữ liệu cũ: cấp bằng cấp nhân vật hiện tại) |
| Nguồn kinh nghiệm | Linh thú kết liễu quái: 100% kinh nghiệm quái; chủ tự kết liễu khi linh thú đang được gọi: 50% |
| Giới hạn cấp | Tối đa bằng cấp nhân vật |
| Chỉ số | Công thức riêng theo cấp linh thú (`60 + 14×(lv-1)`… như hiện nhưng thay `player.level` bằng `summon.lv`); hệ số buff kỹ năng th5 giữ nguyên |
| Dữ liệu lưu | `p.summons.units[id] = { lv, exp, hp, mp, sta }` cho từng loại linh thú; mỗi loại là một cá thể riêng, chỉ số không còn dùng chung |
| Lên cấp | Server cộng exp trong `killOne`, phát sự kiện `summon_levelup`; hồi đầy HP/MP khi lên cấp |

### 3.2 Bóng ma (Tử Linh Thuật Sư)

| Quy tắc | Đề xuất |
| --- | --- |
| Cấp khởi điểm | Cấp = cấp của quái tại thời điểm bị chết (đã có trong `monSnapshot`) |
| Nguồn kinh nghiệm | Bóng kết liễu quái: bóng đó nhận 100%; chủ kết liễu: chia đều cho các bóng đang trong đội hình hoạt động |
| Giới hạn cấp | Tối đa bằng cấp nhân vật (cấp thật vẫn lưu, vượt phần "khoá" hiện hiệu lực bằng cấp chủ) |
| Chỉ số | Tính từ chỉ số gốc của loại quái × hệ số tăng theo cấp bóng, **không còn đóng băng snapshot** (snapshot chỉ giữ để hiển thị tên/dáng/nguồn gốc, như mục đích ban đầu) |
| Dữ liệu lưu | Bổ sung `lv`, `exp` vào mỗi `soul` trong `p.shadows.roster` |
| Thu phục | Giữ nguyên quy tắc hiện có: chỉ quái do chính người chơi kết liễu mới hóa bóng; quái do thú/bóng hạ không tạo bóng |

### 3.3 Liên quan phải sửa kèm

- **Sát thương bóng ma** (`public/js/scene/player.js:522`): thay hệ số cố định 0.32 bằng công thức dùng `atk` của bóng theo cấp (hiện tại bóng quái mạnh/yếu đánh như nhau — sửa xong mới đúng nghĩa "chỉ số riêng").
- **HUD người chơi**: hiển thị `Lv` và thanh kinh nghiệm của linh thú đang theo cạnh HP/MP/thể lực hiện có.
- **Bảng Thú triệu hồi** (`public/js/ui/panels/mount.js`) và **Bảng Bóng Ma** (`public/js/ui/panels/shadows.js`): thêm cột cấp + kinh nghiệm từng con.

## 4. Kế hoạch triển khai

| Bước | Việc | File |
| --- | --- | --- |
| 1 | Thêm công thức: `summonLevelStats(lv, skLv)`, `shadowLevelStats(soul, ownerLv)`, bảng exp lên cấp thú/bóng, hàm kẹp cấp theo chủ | `shared/data/mounts.js` |
| 2 | Migrate dữ liệu cũ: tạo `p.summons.units` (cấp = cấp nhân vật), bổ sung `lv`/`exp` cho bóng từ snapshot | `server/game/index.js` |
| 3 | Cộng kinh nghiệm khi hạ quái: phân theo `source` ('pet'/'shadow'/'player'), nhân `expMul` chênh lệch cấp, xử lý lên cấp và kẹp cấp chủ, phát sự kiện thông báo | `server/game/actions/combat.js` |
| 4 | Triệu hồi/gọi đội dùng chỉ số theo cấp mới; reset max HP/MP khi lên cấp; kẹp giá trị state khi max giảm | `server/game/actions/character.js`, `server/game/actions/world.js` |
| 5 | Client dùng chỉ số theo cấp cho linh thú/bóng; thay hệ số 0.32 của bóng bằng atk theo cấp | `public/js/scene/player.js` |
| 6 | UI: hiển thị cấp + exp trên HUD và hai bảng thú/bóng | `public/js/ui/panels/mount.js`, `public/js/ui/panels/shadows.js` |
| 7 | Chơi thử kiểm tra cân bằng, chỉnh hệ số | — |

**Thứ tự làm**: bước 1–3 là lõi (server quyết định hết chỉ số và exp, client chỉ hiển thị theo — giữ đúng nguyên tắc server-authoritative hiện có); bước 4–6 làm sau để không hỏng dữ liệu giữa chừng.

## 5. Rủi ro cần theo dõi khi chơi thử

- Tốc độ lên cấp linh thú: nếu quá nhanh, tăng exp cần thiết theo cấp hoặc giảm phần exp khi chủ tự hạ (50% → 30%).
- Tổng sức mạnh 5 bóng cấp sàn của chủ: nếu vượt trội, giảm chỉ số bóng mỗi con còn ~60–70% quái gốc cùng cấp.
- Người chơi giữ bóng cấp thấp cố tình (bóng cấp 1 farm quái cấp 1 để lên cấp dễ) — hệ số `expMul` theo chênh lệch cấp sẽ tự chống lại trường hợp này.

## 6. Đã triển khai

- **Công thức** (`shared/data/mounts.js`): `summonLevelStats(lv, skLv)` tính chỉ số linh thú theo cấp riêng; `summonUnitLv`/`summonUnitStats` kẹp hiệu lực bằng cấp chủ (giữ `summonStats` làm bọc tương thích cho linh thú đang chọn); `shadowTrueLv`/`shadowLevelOf`/`shadowStats` — bóng tăng 8%/cấp so với snapshot lúc thu phục, hiệu lực kẹp bằng cấp chủ; `summonExpToNext` = 60×lv^1.5, `shadowExpToNext` = 55×lv^1.5.
- **Migrate** (`server/game/index.js`): `p.summons.units[id] = { lv, exp }` — thú cũ sinh cấp bằng cấp nhân vật lúc migrate; bóng cũ lấy `lv` từ snapshot đã lưu, `exp` = 0.
- **Kinh nghiệm** (`server/game/actions/combat.js`, hàm `grantCompanionExp`): nguồn exp = `monExp × expMul` (chênh lệch cấp như người chơi, chống AFK farm). Linh thú: tự kết liễu 100%, chủ kết liễu 50%; bóng ma: bóng trong đội chia đều, bóng kết liễu nhận 100% tổng, chủ kết liễu 50% tổng. Lên cấp thì hồi đầy HP/MP/thể lực và phát thông báo; chạm cấp chủ thì exp = 0.
- **Server khác**: `world.js` đồng bộ state theo max của từng linh thú; `character.js` thông báo cấp linh thú khi gọi/đổi.
- **Client** (`public/js/scene/player.js`, `combat.js`): linh thú dùng chỉ số theo cấp riêng cho mọi hành vi (hồi phục, sát thương — `ss.atk` giờ là atk của chính con đó); bóng ma thay hệ số cố định 0.32 bằng atk của bóng (`extra.shadowAtk`), nhân hệ số 0.82 như linh thú.
- **UI**: Bảng Thú triệu hồi và Bảng Bóng Ma hiển thị cấp, kinh nghiệm hiện tại; bóng bị kẹp cấp hiện dòng "cấp thật N, mở dần khi bạn lên cấp".
- Kiểm chứng: migrate giữ đúng cấp cũ, exp theo nguồn kill, chặn cấp chủ, lên cấp hồi đầy (smoke test qua `game.handle` với player thật).
