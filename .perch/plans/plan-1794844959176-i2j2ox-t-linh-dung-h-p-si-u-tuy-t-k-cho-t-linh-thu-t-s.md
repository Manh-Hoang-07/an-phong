## Tử Linh Dung Hợp — siêu tuyệt kỹ thứ hai

**Cơ chế:** dùng chiêu thì toàn bộ bộ sưu tập bóng ma (kể cả bóng không triệu hồi) dung hợp vào người: cộng dồn HP / MP / thể lực / DEF trong **30 giây**. Đổi lại **bóng ma tan hết**.

| | |
|---|---|
| Class | Chỉ Tử Linh Thuật Sư |
| Cấp / hồi chiêu | 60 / 240s |
| Tốn | 320 MP |
| Giá sách | 420 Linh Ngọc (Lầu Trân Bảo, nhóm Siêu tuyệt kỹ) |

### Công thức (mỗi bóng trong bộ sưu tập)

- HP: `shadowStats.hp × 10%`
- MP: `monCurve.atk × 5%` — **suy ra**, bóng ma không có MP thật
- Thể lực: `monCurve.def × 5%` — **suy ra**, bóng ma không có thể lực thật
- DEF: `shadowStats.def × 5%`

### Cân bằng thực đo (Tử Linh lv70, gốc HP 4.441)

| Bộ sưu tập | HP | DEF | Giảm sát thương |
|---|---|---|---|
| 7 bóng tinh anh | 37.516 | 247 | 22% |
| **20 bóng tinh anh** | **98.941** | **318** | **26%** |
| 20 bóng thường | 14.341 | 322 | 26% |

Bộ sưu tập đầy bóng tinh anh cho gần 100.000 HP, gấp 22 lần gốc. Không giết được trùm (925.000 HP) nhưng đủ đứng trong đó mà đánh.

### Việc phải làm — 7 file, ~120 dòng

1. `shared/data/pets/shadow.js` — thêm `shadowFusion(player, roster)`
2. `shared/logic/player.js` — cộng dung hợp vào `calcStats`
3. `server/game/actions/combat.js` — action `fusion` + `fusion_end`
4. `server/game/index.js` — đăng ký
5. `public/js/scene/skills.js` — nhánh `castFusion`
6. `public/js/scene/world.js` — kiểm hết hạn + chỉ báo đếm ngược
7. `public/js/ui/panels/skills.js` + `audit-skill-fx.js` — mô tả và kiểm tra

Hồi chiêu do **server** giữ (`p.fusionCd`), cùng cách với Sinh Tử Đồng Quy. Server kiểm lại class, có bóng, đang dung hợp — không tin client.

### Ba rủi ro đã thấy

1. **~100.000 HP** là con số lớn nhất game cho một người chơi. Hạ `fusionHp` xuống 0,06 nếu thấy quá mạnh.
2. **Cày bóng cấp cao:** bóng giữ cấp quái lúc thu phục, không kẹp theo cấp chủ. Tử Linh cấp 60 bắt bóng cấp 90 ở map cao → dung hợp ra chỉ số vô đối. Tôi khuyên kẹp `Math.min(s.level, p.level)`.
3. **Cộng dồn với Thức Tỉnh:** dung hợp cộng **sau** hệ số Ấn nên không bị nhân lên. Đúng ý.

### Ba câu cần bạn chốt

1. **Cái giá:** A — mất toàn bộ bộ sưu tập / B — mất 7 bóng đội hình / C — chỉ tan 30s rồi trở lại. Kế hoạch đang theo **A**.
2. **Kẹp cấp bóng** theo cấp người chơi? Tôi khuyên **có**.
3. **MP và thể lực** suy từ `monCurve`, hay bỏ hẳn chỉ cộng HP + DEF?

Kế hoạch đầy đủ ở `.perch/plans/tu-linh-dung-hop.md` (313 dòng).