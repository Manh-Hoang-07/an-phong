# Kế hoạch: Độ bền trang bị (bản 2)

Ngày: 2026-11-27 · Trạng thái: **đã cài đặt (chưa chạy thử trong game thật)** — kiểm thử: `node server/tools/check/check-durability.js`

Chốt từ người dùng:
- Độ bền **tối đa cố định theo cấp của bộ đồ**; giao diện chỉ hiện **%**.
- Quái cấp cao đánh trừ độ bền **nhiều hơn** quái cấp thấp.
- **Đánh** → hao **vũ khí**. **Bị đánh** → hao **các trang bị còn lại** (9 ô, không gồm vũ khí).
- Về 0% = **hỏng**: không dùng được, nhưng **vẫn sửa được**. Sửa = xu + Đá cường hóa.
- Đồ Linh Ngọc / đồ đặc biệt (`def.special`): độ bền **vô hạn**, không hao, không hiện thanh.
- Món hỏng bán được **25%** giá.
- Đòn trùm vẫn gắn quái (biết quái nào đánh). Thú cưỡi / trang bị thú **ngoài phạm vi**.

---

## 1. Hiện trạng liên quan

- Bộ đồ = `setOfLevel(level)`, mỗi bộ 10 cấp (`SET_LEVELS = 10`, `shared/data/items/sets.js`). Món nào cũng có `def.level`.
- Món là instance `{ uid, id, plus, q, roll, aff, ... }` (`shared/logic/items.js`). Thêm `dur` vào đây thì tự đi theo
  món qua túi/kho/mặc/tháo (các action đều copy `{ ...e }`).
- Chỉ số tính tại `calcStats` / `specialFx` (`shared/logic/player.js`) và `setCounts` (`items.js:20`): bỏ món hỏng ở 3 chỗ này là đủ.
- Đánh: server thấy mọi đòn ở `onHit` (`server/realtime/index.js:387`) → hao vũ khí làm chắc được.
- **Bị đánh: server KHÔNG thấy.** Quái do server điều khiển nhưng client tự diễn đòn và tự tính trúng
  (`server/realtime/mobs.js:387`, `public/js/scene/combat.js:280 hurtPlayer`). Cần thêm kênh báo (mục 3.2).

---

## 2. Luật chơi

### 2.1 Độ bền tối đa theo cấp

Lưu **điểm** nội bộ, hiển thị `%` = `dur / durMax`.

**Đặt mục tiêu theo số đòn, không theo điểm.** Bản trước chọn 200 điểm là quá thấp (≈ vài trăm đòn → vài phút). Bản này
chọn thẳng "đánh bao nhiêu đòn thì hỏng", rồi suy ra điểm:

```
durMax(def) = HITS_TO_BREAK_WEAPON_OR_ARMOR * mobFactor(cấp giữa của bộ đồ)
```

Vì quái cấp cao hao nặng hơn (`mobFactor`), `durMax` nhân theo cùng hệ số → **số đòn để hỏng gần như bằng nhau ở mọi tầng**
khi đánh quái đúng tầng. Chỉ cần chỉnh **hai con số**, không phải chỉnh từng bộ.

| Món | Hằng số | Gợi ý | Tương đương |
|---|---|---|---|
| Vũ khí | `HITS_WEAPON` = số đòn thường để 100% → 0% | **25.000** | kiếm 360ms ≈ 2,8 đòn/giây → ~2,5 giờ đánh liên tục |
| 9 ô còn lại | `HITS_ARMOR` = số cú bị đánh mỗi ô | **400** | bị đánh ~1 cú/3 giây, hao ngẫu nhiên đều 9 ô → ~3 giờ |

Chỉnh sau khi chạy thử; mục tiêu: một buổi chơi vài giờ thì thấy rõ hao mòn nhưng **không hỏng giữa buổi**.

Lưu `dur` (điểm hiện tại) trên instance; `durMax` tính từ `def.level` nên không lưu → đổi công thức là áp cho mọi món cũ.
Món cũ không có `dur` → coi là đầy.

### 2.2 Hao mòn

**Vũ khí (khi đánh)** — mỗi đòn trúng quái ở `onHit`:

```
wear = WEAPON_WEAR[kind] * mobFactor(mob.level)    // kind: đánh thường 1 · kỹ năng 3 · tuyệt kỹ 8 · siêu 15
```
Đánh thường = 1 điểm gốc nên `durMax` ở trên chính là "số đòn thường để hỏng" (nhân `mobFactor`). Kỹ năng/tuyệt kỹ hao
nhiều hơn vì mỗi lần dùng ăn nhiều đòn trúng hơn, nhưng dùng thưa nên vũ khí vẫn bền cỡ giờ.
Đòn lan trúng nhiều quái: **tính một lần cho mỗi đòn**, không nhân theo số quái trúng (khỏi phạt đánh bầy).
Cộng dồn số lẻ trong bộ nhớ, chỉ ghi `weapon.dur` khi tích đủ ≥ 1 điểm (không ghi mỗi đòn).

**Trang bị còn lại (khi bị đánh)** — mỗi lần quái trúng người:

```
wear = ARMOR_WEAR * mobFactor(mob.level) * (boss/leader/elite hệ số)   // ARMOR_WEAR = 1 điểm gốc / cú; trừ vào 1 ô
```
Mỗi cú trúng chọn **một ô ngẫu nhiên** trong các ô đang mặc (trừ vũ khí) để trừ; ô trống thì bỏ qua.
Hệ số hạng quái: thường ×1, tinh anh ×1.5, thủ lĩnh ×2, trùm ×3 (có sẵn khái niệm hạng ở `G.monExp`).

**Quái cấp cao đánh nặng hơn:**

```
mobFactor(lv) = 1 + lv / 20          // lv 1 ≈ 1.05, lv 60 = 4, lv 100 = 6
```
(Chỉnh được; chỉ cần đơn điệu tăng theo cấp quái.)

**Chết:** trừ thêm một lượng cố định theo % `durMax` cho mọi ô đang mặc (gợi ý 3%).

### 2.3 Hỏng (0%)

- Món bị bỏ khỏi `calcStats`, `specialFx`, `setCounts`: không cộng chỉ số, không tính bộ, mất `fx`.
- Vũ khí hỏng = đánh bằng tay không / vũ khí luyện tập (đã có đường này cho người chưa chọn class).
- Không `equip` món hỏng (phải sửa trước). Tháo được. Phân rã được.
- Bán món hỏng = **25%** giá bán thường (`sellPrice` nhân 0.25 khi `dur <= 0`).
- Món hỏng **vẫn sửa được** ở Thợ rèn.
- **Đồ Linh Ngọc / đặc biệt (`def.special`)**: độ bền vô hạn — `durMax = Infinity`, mọi hàm hao bỏ qua, UI không hiện thanh,
  `isBroken` luôn false. Không lưu `dur` cho món này.

### 2.4 Sửa

Thợ rèn (`roleHere(p,'smith')`): trả **xu + Đá cường hóa**, tỉ lệ theo **độ bền thiếu** × cấp bộ × phẩm chất.
Đá = `ceil(thiếu% × hệ số bộ)`, tối thiểu 1 khi sửa. Có "Sửa tất cả đang mặc". Món 0% sửa đầy được (tốn nhất).

---

## 3. Việc cần làm

### 3.1 `shared/`
| File | Việc |
|---|---|
| `shared/data/equipment.js` | hằng số: `HITS_WEAPON`, `HITS_ARMOR`, `WEAPON_WEAR`, `ARMOR_WEAR`, `DEATH_WEAR`, ngưỡng cảnh báo 20% |
| `shared/logic/items.js` | `durMax(def)`, `durPct(inst)`, `isBroken(inst)`, `mobFactor(lv)`, `repairCost(inst)`; `normalizeInst` điền `dur`; `setCounts` bỏ món hỏng; `sellPrice` ×0.25 khi hỏng; mọi hàm trên trả "vô hạn / không hỏng" cho `def.special` |
| `shared/logic/player.js` | `calcStats`, `specialFx` bỏ món hỏng |

### 3.2 Server
| File | Việc |
|---|---|
| `server/realtime/index.js` `onHit` | hao vũ khí theo loại đòn × `mobFactor(mob.level)`; chạm 0 thì gửi event `gear_broke` + `clampHpMp` |
| `server/realtime/index.js` (mới) | message `t:'hurt'` từ client: `{ u: mobUid }`. Server **tự tra** cấp/hạng quái từ `w.byUid`, kiểm quái còn sống, gần người chơi (như `onHit`), giới hạn tần suất (≈ 1 cú/quái/0.4s, trần số cú/giây). Rồi hao 1 ô ngẫu nhiên. Client **không** gửi lượng hao hay cấp quái. |
| `server/game/actions/smith.js` | action `repair` (slot hoặc uid, `roleHere(p,'smith')`, xu + `da_cuong_hoa`; sửa được cả món 0%; từ chối món `special` và món đã đầy) |
| `server/game/actions/items.js` | `equip` từ chối món hỏng |
| `server/game/actions/world.js` `die` | hao khi chết |
| `server/game/index.js` (~125) | migration: `normalizeInst` túi + kho |

### 3.3 Client
| File | Việc |
|---|---|
| `public/js/scene/combat.js` `hurtPlayer` | gửi `t:'hurt'` kèm uid quái gây sát thương (luôn có: đạn/đòn vùng của trùm phải mang `owner` — xem 4.2) |
| `public/js/scene/boss.js`, `monsters.js` | truyền uid quái vào mọi lần gọi `hurtPlayer` |
| `public/js/ui/panels/equip.js`, `bag.js`, `ui.js` tooltip | thanh + `%`, xanh→vàng→đỏ, nhãn **HỎNG** |
| `public/js/ui/panels/smith.js` | tab **Sửa chữa** |
| `public/css/style.css` | style thanh độ bền |
| `public/js/admin.js` + `server/http/admin.js` | đặt được `dur` khi tặng đồ test |

### 3.4 Kiểm thử
`server/tools/check/check-durability.js` (theo mẫu `check-gear-systems.js`): `durMax` tăng theo bộ; quái cấp cao hao nhiều
hơn cấp thấp; đánh chỉ hao vũ khí, bị đánh chỉ hao 9 ô còn lại; về 0 thì chỉ số rơi về như không mặc + mất bộ; sửa đầy;
sửa được cả món 0% (trừ xu + đá); đồ `special` không hao; bán món hỏng = 25%; `equip` món hỏng bị từ chối; client không ép được hao (gửi `hurt` sai uid / dồn dập). Chạy lại
`check-gear-systems.js`, `check-special-gear.js`.

---

## 4. Rủi ro

1. **`t:'hurt'` do client báo.** Client giấu thì không hao giáp (không hại ai ngoài chính nó, vì nó chỉ lợi). Nhưng server
   kiểm uid, tầm, tần suất để **không bị lợi dụng chiều ngược lại** và không gian lận quá nhẹ. Chặn tuyệt đối thì phải
   chuyển tính trúng sang server — việc lớn hơn nhiều, không đề xuất.
2. **Đòn trùm phải gắn quái.** Một số đòn gọi `hurtPlayer` không truyền quái (`boss.js:88` đạn bay `p.dmg`; một số
   đòn vùng). Cần sửa tại chỗ tạo đạn/đòn để mang theo `owner = m` (uid quái bắn), rồi `hurtPlayer` luôn có uid
   để gửi `t:'hurt'`. Phải rà hết các chỗ gọi `hurtPlayer` (boss.js 43/88/132/150/201/221/234, monsters.js 353/441) — đòn nào
   chưa có uid thì không hao (và coi là lỗi cần sửa).
3. **Cân bằng:** phải chạy thử để chọn `HITS_WEAPON`, `HITS_ARMOR`, hệ số kỹ năng, giá sửa. Mục tiêu: vũ khí hỏng sau ~2–3 giờ đánh liên tục, giáp tương tự.
   Thêm script mô phỏng nhỏ (số đòn/giây theo `WEAPON_TYPES[...].cooldown`) để in ra "mất bao lâu thì hỏng" cho từng loại vũ khí.
4. **Sửa món hỏng rẻ hay đắt** quyết định hỏng có đáng sợ không: giá sửa tính theo độ bền thiếu nên món 0% là đắt nhất.
   Chỉnh khi cân bằng.

---

## 5. Đã chốt hết, không còn câu hỏi mở

Phạm vi ngoài: thú cưỡi, trang bị thú (`pet-gear.js`), Kỳ Nguyên (không phải trang bị).

Thứ tự làm: 3.1 → onHit + smith → `t:'hurt'` + client → UI → 3.4 → cân bằng.
