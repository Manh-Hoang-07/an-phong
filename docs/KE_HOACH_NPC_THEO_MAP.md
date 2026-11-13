# Kế hoạch: mỗi map một bộ NPC (NPC theo làng)

Ngày: 2026-11-13 · Trạng thái: **đã triển khai (xem mục 0), chưa commit**

## 0. Đã làm, và chỗ khác so với bản kế hoạch dưới đây

Các mục 1–8 bên dưới là kế hoạch gốc. Thực tế triển khai:

- **NPC**: 2 trưởng làng (**Vực** làng V, **Thịnh** làng VI; đổi từ "Cương" vì trùng nhân vật Triệu Cương) + 36 NPC dịch vụ (`tho_ren_2..7`, `ba_thuoc_2..7`, `tap_hoa_2..7`, `thu_kho_2..7`, `bang_nv_2..7`, `tram_2..7`). Tân Đô I giữ id cũ. Khải chỉ ở Tân Đô I; Thợ rèn ở Sảnh Chờ (không phải làng) đã bỏ.
- **Quest đổi người giao**: c5q1, c5q3b, c5q7–c5q9 → Vực; c6q1–c6q9, c7q1–c7q6, c7q9 → Thịnh; c3q1 → Thợ chế tác Phong (Hải Cảng). Phụ tuyến giữ nguyên người giao ở Tân Đô I (Thiết, Lan, Tư, Bảo, Khải): lời thoại gắn với các nhân vật này.
- **Kiểm tra theo vai trò** (`G.npcByRole`, `roleHere`): `smith`, `storage`, `daily`, `teleport`. Tiệm dùng `shopKind` ('herb' / 'gear'); phụ tuyến mở khóa hàng ở **mọi** tiệm cùng loại.
- **Kho riêng từng làng**: `p.storageByMap[mapId]`, 30 ô (`G.STORAGE_SIZE`). Khác kế hoạch: kho mọi làng nằm chung **một** section `storage` trong DB (không tách `storage:<mapId>`), vì kho chỉ đổi khi gửi / lấy đồ. Kho cũ → kho Hiệp Hội (giữ nguyên dù vượt 30). Túi đầy khi tháo vũ khí → kho của làng gốc của bản đồ đang đứng.
- **Bảng ngày / tuần riêng từng làng**: `p.dailyByMap[làng]`, `p.weeklyByMap[làng]`, sinh theo quái của vùng (bản đồ có `home` = làng) nên tự bao cả chương 6–10. Thưởng = thưởng theo cấp × `0.4 + 0.1 × (n − 1)` (`G.villageRewardMult`). Nhiệm vụ ngày tính cho mọi bảng có mục tiêu khớp; **nhiệm vụ tuần chỉ tính cho bảng của làng nơi đang săn** (để 7 bảng không cùng nhận thưởng cho một lượt hạ quái). Vật phẩm "thu thập" rơi cho tới khi đủ tổng số cần của mọi bảng chưa nhận.
- **Nhận ở đâu trả ở đó**: `p.quest.map`, `p.side.active[id].map`; dữ liệu cũ gán theo bản đồ có NPC giao.
- **Trạm dịch chuyển**: về Tân Đô I miễn phí (`G.teleportFee`).
- **Hình NPC**: 4 NPC người đổi tông màu theo làng (xoay sắc độ, vẽ bằng code); bảng nhiệm vụ / trạm dùng hình gốc (`look`). Ảnh PNG riêng của Chủ tiệm Tư / Quản kho Bảo chỉ dùng cho Tân Đô I.
- **Kiểm thử đã chạy**: chuyển dữ liệu cũ, kho theo làng (30 ô, sai làng bị chặn), vai trò NPC, bảng ngày / tuần theo làng, hệ số thưởng, nhận / trả theo bản đồ, về Hiệp Hội miễn phí, `check-quests` và `check-maps` (không thêm quãng đường xa so với bản cũ), render panel và NPC trong trình duyệt.
- **Chưa làm / cần chơi thử**: thưởng tuần ×(0.4–1.0) và việc phụ tuyến Khải luôn phải về Tân Đô I chưa được cân bằng bằng chơi thật; bảng nhiệm vụ boss chỉ có boss của chương 1–5 (chương 6–10 dùng nhiệm vụ hạ quái).

## 1. Vấn đề hiện tại

- NPC định nghĩa một lần trong `shared/data/npcs.js`; các map chỉ tham chiếu id. `lao_su` (Hội trưởng Khải) không có `appear` nên đứng đồng thời ở `lang`, `tan_do_bt`, `tan_do_6`.
- Kho đồ là một mảng chung `p.storage` (60 ô) trên nhân vật → gửi ở làng này, lấy ở làng khác được.
- Bảng nhiệm vụ ngày/tuần là một bộ chung `p.daily` / `p.weekly` → làm ở làng nào cũng được, thưởng như nhau.
- Nhận/trả nhiệm vụ chỉ kiểm tra "NPC có mặt ở map hiện tại không" (`onCurrentMapNpc`), không nhớ đã nhận ở đâu → nhận ở Hiệp Hội, trả ở Thiên Đô được.
- NPC dịch vụ (Thợ rèn, Dược sư, Chủ tiệm, Quản kho, Bảng nhiệm vụ, Trạm) dùng chung một id ở mọi làng.

## 2. Quyết định đã chốt

| # | Quyết định |
|---|---|
| 1 | NPC dịch vụ: **mỗi làng một người riêng** (tên + hình riêng), đúng "mỗi map 1 bộ NPC" |
| 2 | Kho riêng theo map, **mỗi kho 30 ô** |
| 3 | Bảng nhiệm vụ ngày/tuần: **riêng từng làng**, thưởng riêng |
| 4 | NPC cốt truyện: **Khải luôn ở Hiệp Hội**; các làng khác có trưởng làng / người đại diện riêng |

## 3. Thiết kế

### 3.1 NPC cốt truyện — một người, một chỗ

- **Khải (`lao_su`): chỉ ở `lang` (Hiệp Hội).** Hiện không có `appear` nên đứng ở `lang`, `tan_do_bt`, `tan_do_6` cùng lúc. Thêm `appear: { lang: [['q0', 'c10q8']] }` (hoặc đơn giản gỡ khỏi `tan_do_bt` / `tan_do_6` trong `maps.js`).
- Vy, Lữ khách, Lam Sương, Minh Triết, Hạ Phong, Lăng: giữ `appear` theo cốt truyện (đã có), rà lại để không chồng map.
- **Rà soát quest theo người giao hiện tại** (đã đối chiếu `shared/data/quests/*.js`):

| Làng | Người giao hiện có | Quyết định |
|---|---|---|
| I Hiệp Hội | Khải: c3q6, c3q9, c5q1, c5q3b; Vy, Lữ khách | **Giữ Khải** |
| II Hải Cảng | Vy, Hạ Phong (c2q6, c2q7) | Không cần trưởng làng mới (đã có Hạ Phong) |
| III Lò Rèn Băng | Vy, Thợ rèn (c3q1, c3q10, c3q11) | Không cần trưởng làng mới |
| IV Phù Đảo | Vy, Lữ khách | Không cần trưởng làng mới (không có quest Khải nào ở IV) |
| V Bầu Trời Rách | Khải: c5q7, c5q8, c5q9 | **Thêm Trưởng làng Vực** (`truong_lang_5`) thay Khải |
| VI Thiên Đô | Khải: c6q1–c6q9 (c6), c7q1–c7q6, c7q9 | **Thêm Trưởng Cương** (`truong_lang_6`) thay Khải |
| VII Tinh Hà | Minh Triết (c8–c10), Lữ khách, Lăng | Không cần trưởng làng mới (Minh Triết là người đại diện) |

- → Chỉ **2 trưởng làng mới** (V và VI), không phải 4. Khải chỉ nhắn qua đường truyền ở làng V, VI.
- Lời thoại: đổi người nói sang trưởng làng, giữ nguyên nội dung; thêm câu dẫn *"Hội trưởng Khải nhắn qua đường truyền:"* khi cần (đúng văn phong đã có ở c2q6 / c2q12).
- Phụ tuyến của Khải (p7-1, p7-2, ut-1..3): giữ Khải ở Hiệp Hội; người chơi quay về Hiệp Hội làm. Trạm dịch chuyển **chiều về Hiệp Hội miễn phí** (cấp cao đi lại nhiều, 300 xu/lượt thành rào cản).
- `appear` của Khải: `lang` toàn bộ; không xuất hiện ở làng khác.

### 3.2 NPC dịch vụ — mỗi làng một người riêng

7 làng × 6 vai trò. 4 vai trò người (rèn / dược / tiệm / kho): **tên riêng + sprite đổi tông màu** theo làng (dùng `drawHunter` palette, không vẽ tay 28 hình). 2 vai trò vật thể (Bảng nhiệm vụ, Trạm): không cần tên riêng (giữ tên "Bảng nhiệm vụ" / "Trạm dịch chuyển"), chỉ là instance riêng mỗi làng, cùng hình, trạng thái riêng. Vì vậy bảng tên dưới chỉ có 4 hàng.

| Vai trò | I Hiệp Hội | II Hải Cảng | III Lò Rèn Băng | IV Phù Đảo | V Bầu Trời Rách | VI Thiên Đô | VII Tinh Hà |
|---|---|---|---|---|---|---|---|
| Thợ rèn | Thiết | Phong | Hàn | Kiều | Diệm | Khôi | Tinh |
| Dược sư | Lan | Đào | Băng | Mây | Hồng | Thảo | Sao |
| Chủ tiệm | Tư | Mận | Lạnh | Đá | Tú | Trụ | Hà |
| Quản kho | Bảo | Bến | Sương | Kiên | Nguyệt | Mạch | Ngân |

*(Đã đổi "Cảng" → "Bến" (trùng tên map Hải Cảng), "Tro" → "Thảo" (hợp vai dược sư). Sửa thoải mái.)* id: `tho_ren_2`…`tho_ren_7` (làng I giữ id cũ `tho_ren`), tương tự `ba_thuoc_2..7`, `tap_hoa_2..7`, `thu_kho_2..7`, `bang_nv_2..7`, `tram_2..7`.

- Server bỏ hardcode `'thu_kho'` / `'tho_ren'` / … → helper theo **role**: `npcHereRole(p, mapId, 'storage')` (hoặc `npcRoleHere`).
- Shop thêm `shopKind: 'herb' | 'gear'` để mở khóa phụ tuyến đúng tiệm (p5-2 → dược sư, p2-1/p2-2 → chủ tiệm) thay vì so id.
- `shopItems` / `shopPrice` nhận `npcId` như cũ nhưng tra `shopKind` thay vì `npcId === 'ba_thuoc'`.
- `sell` (bán đồ ở làng): kiểm tra có NPC `shop` ở map hiện tại (đã đúng), giữ nguyên.
- `shopHere()` (client): giữ nguyên logic (có NPC shop ở map hiện tại).

### 3.3 Kho riêng theo làng — 30 ô

- `p.storage` → `p.storageByMap[mapId]`, mỗi kho **30 ô** (`STORAGE_SIZE = 30`).
- Gửi / lấy / `unequipWrongWeapon` dùng kho của **map hiện tại**.
- UI kho hiện tên làng + `x/30`, chỉ thấy kho làng đang đứng.
- Migration: kho cũ → `storageByMap.lang` (cho vượt 30, không nhận thêm tới khi < 30); làng khác rỗng.
- Kho Hiệp Hội đang vượt 30 thì UI hiện `45/30` kèm dòng *"Kho đầy, hãy lấy bớt đồ ra để gửi thêm."* (tránh người chơi tưởng lỗi). Tối đa 30 là giới hạn **gửi thêm**, không xóa đồ.

### 3.4 Bảng ngày/tuần riêng từng làng

- `p.daily` / `p.weekly` → `p.dailyByMap[mapId]` / `p.weeklyByMap[mapId]`.
- Mỗi làng tự sinh 3 nhiệm vụ ngày + 2 tuần, **theo quái vùng đó** (lọc boss / tinh anh như hiện tại).
- Thưởng **vẫn theo cấp người chơi** (`dailyReward(level)` / `weeklyReward(level)` đã tăng theo level: exp ∝ `expToNext`, vàng ∝ level), **nhân hệ số làng** `mult = 0.4 + 0.1 × (n − 1)` (n = `village.n`): I = ×0.4, II = ×0.5, III = ×0.6, IV = ×0.7, V = ×0.8, VI = ×0.9, VII = ×1.0. Làm tròn, tối thiểu 1 cho từng loại.
  - Lý do: không dùng thêm `cap/10` vì thưởng đã scale theo level, nhân thêm sẽ nhân đôi hai lần và chênh 10×. Hệ số này vừa chống lạm phát 7 bảng, vừa khuyến khích đi làng mới (đứng ở làng cũ chỉ được ×0.4–0.6).
  - Người chơi tối đa 7 bảng mỗi ngày; nếu làm hết thì tổng ≈ ×4.9 một bảng cũ, nhưng mỗi bảng chỉ đếm quái vùng đó nên không thể "làm hết trong một chuyến".
  - Số hệ số nằm một chỗ (`G.villageRewardMult(n)`) để chỉnh nhanh sau khi thử.
- Hạ quái tính cho mọi bảng có nhiệm vụ khớp (mỗi bảng đếm riêng); **nhận thưởng phải đứng ở bảng làng đó**.
- Migration: `p.daily` / `p.weekly` cũ → `dailyByMap.lang` / `weeklyByMap.lang`.

### 3.5 Nhận ở đâu trả ở đó

- Nhận chính tuyến: `p.quest.map = p.map`; phụ tuyến: `p.side.active[id].map = p.map`. Khi nhận, người chơi đang đứng cạnh NPC giao nên `p.map` luôn là map của NPC giao (đã kiểm tra NPC có mặt ở `p.map` trước khi nhận). Chết / hồi sinh sang map khác chỉ ảnh hưởng vị trí, không đổi `map` đã lưu.
- Với quest chính tuyến, NPC giao = NPC trả (mỗi quest chỉ có một `npc`), nên quy tắc này chỉ chặn trường hợp NPC có mặt ở nhiều map (Khải, dịch vụ).
- Trả: bắt buộc `p.map === map đã nhận` + NPC có mặt; sai chỗ → *"Hãy quay về <map> để trả nhiệm vụ."*
- UI: guide hiện **"Nhận ở X · Trả ở X"** (cùng map); panel NPC / quest báo rõ khi sai chỗ.
- Migration: nhiệm vụ đang làm dở → `map` = map hiện tại.

## 4. File sẽ sửa

| File | Việc |
|---|---|
| `shared/core.js` | `STORAGE_SIZE = 30` |
| `shared/data/npcs.js` | thêm 2 trưởng làng (V, VI) + 36 NPC dịch vụ (6 vai trò × 6 làng); `appear` cho Khải = `lang`; `shopKind` |
| `shared/data/quests/chapter1.js`, `chapter6.js` | đổi `npc` của c5q7–c5q9 → `truong_lang_5`, c6q* / c7q1–c7q6 / c7q9 → `truong_lang_6`; lời thoại |
| `shared/logic/quests.js` (thưởng) | `villageRewardMult(n)`; `dailyReward` / `weeklyReward` nhận thêm làng |
| `server/game/actions/world.js` | miễn phí chiều về Hiệp Hội |
| `shared/data/maps.js` | gắn id NPC mới theo từng làng |
| `shared/logic/shop.js` | tra `shopKind` thay vì id |
| `shared/logic/quests.js` | `questGuide` hiện "Nhận ở X · Trả ở X"; helper role-based |
| `shared/logic/player.js` | `newPlayer`: `storageByMap`, `dailyByMap`, `weeklyByMap` |
| `server/game/index.js` | migration dữ liệu cũ |
| `server/game/actions/items.js` | kho theo map (`store`, `retrieve`) |
| `server/game/actions/smith.js` | role-based `tho_ren` |
| `server/game/actions/character.js` | role-based `lao_su` / `lu_khach` (rank_eval, reset_skills, awaken) |
| `server/game/actions/quests.js` | lưu/kiểm tra `map` khi nhận/trả (chính + phụ); daily/weekly theo map |
| `server/game/actions/world.js` | teleport: role-based `tram` |
| `server/game/periodic.js` | sinh bảng theo map |
| `server/game/actions/combat.js` | đếm tiến độ cho mọi bảng |
| `server/game/progress.js` | `unequipWrongWeapon` → kho map hiện tại |
| `public/js/ui/panels/storage.js` | hiện kho theo làng |
| `public/js/ui/panels/daily.js` | hiện bảng theo làng |
| `public/js/ui/panels/npc.js` | tên/hình NPC mới |
| `public/js/ui/panels/quest.js` | guide "Nhận ở X · Trả ở X" |
| `public/js/ui/ui.js` | `dailyLines`, `shopHere`, `selectedEntry` theo map |
| `public/js/art/characters.js` | palette variant cho NPC dịch vụ |
| `docs/KE_HOACH_NHIEM_VU_TAN_DO.md` | cập nhật mục "Nhận nhiệm vụ theo làng" |

## 5. Migration dữ liệu cũ (bắt buộc `npm run backup` trước)

1. `p.storage` (mảng cũ) → `p.storageByMap.lang` (giữ nguyên, cho vượt 30).
2. `p.daily` → `p.dailyByMap.lang`; `p.weekly` → `p.weeklyByMap.lang`.
3. `p.quest.state === 'active'` → `p.quest.map` = **map nơi NPC giao quest đứng theo cốt truyện** (tra `npcMaps(player, quest.npc)`; nếu nhiều map, ưu tiên `p.map` nếu nằm trong đó, không thì map đầu tiên). Không gán mù `p.map`, vì người chơi có thể đang ở map săn.
4. `p.side.active[id]` → thêm `map` theo cách tương tự (NPC giao của phụ tuyến, ưu tiên `p.map`).
5. `p.villages` giữ nguyên.

## 6. Thứ tự làm

0. **Làm trước:** chia `section` DB + trả phần thay đổi (xem `docs/KE_HOACH_HIEU_NANG.md`). Kho theo làng (`storage:<mapId>`) và bảng theo làng (`daily:<mapId>`) là các section riêng, nên không phải viết lại hai lần.
1. Backup DB + khung migration trong `server/game/index.js`
2. NPC data (`npcs.js`, `maps.js`) + palette art
3. Helper role-based + kho theo map (`items.js`, `progress.js`, `core.js`)
4. Ngày/tuần theo map (`periodic.js`, `combat.js`, `quests.js`)
5. Nhận/trả theo map (`quests.js` server + `questGuide`)
6. UI (storage, daily, npc, quest guide, `shopHere`)
7. Cập nhật `docs/KE_HOACH_NHIEM_VU_TAN_DO.md`
8. Test: migration (người chơi có kho > 30, quest dở dang ở chương 5/6/7, daily/weekly đang làm), gửi/lấy kho ở 2 làng, nhận ở làng A trả ở làng B bị chặn, thưởng bảng đúng hệ số, người chơi chưa mở khóa làng không thấy NPC làng đó

## 7. Rủi ro

- **~40 NPC mới** (2 trưởng làng + 36 NPC dịch vụ + Hiệp Hội giữ id cũ) → palette variant, không vẽ tay.
- **Kinh tế 7 bảng** → thưởng theo level × hệ số làng 0.4–1.0.
- **Khải ở Hiệp Hội** → p7 / ut phải quay về Hiệp Hội; trạm dịch chuyển chiều về miễn phí.
- **Dữ liệu cũ** → backup bắt buộc trước khi áp dụng.

## 8. Còn cần bạn quyết

- Tên 2 trưởng làng (Vực / Cương) và 24 tên NPC dịch vụ — sửa thoải mái.
- Hệ số thưởng làng `0.4 + 0.1 × (n − 1)` đã chọn mặc định; có thể chỉnh sau khi chạy thử (nằm trong `G.villageRewardMult`).
