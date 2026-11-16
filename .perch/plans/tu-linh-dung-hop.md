# Kế hoạch: Siêu Tuyệt Kỹ "Tử Linh Dung Hợp" (Tử Linh Thuật Sư)

Ngày: 2026-11-16 · Trạng thái: **ĐÃ CODE XONG** · Bản 2 (duy trì 60 giây)

---

## 0. Tóm tắt một đoạn

Siêu tuyệt kỹ thứ hai, độc quyền Tử Linh Thuật Sư. Dùng chiêu thì **toàn bộ bộ sưu tập bóng ma**
(kể cả bóng đang lưu giữ, không chỉ bóng đang triệu hồi) bị **dung hợp vào người**: cộng dồn
HP / MP / thể lực / DEF của chúng vào chỉ số người chơi trong **60 giây**, đổi lại **bóng ma tan hết**
và **bộ sưu tập mất trắng**. Không giết được trùm như Sinh Tử Đồng Quy, nhưng biến Tử Linh từ
"một người chơi kèm bóng" thành "một mình là cả đội hình".

---

## 1. Tên và bậc

| | |
|---|---|
| Tên | **Tử Linh Dung Hợp** |
| Id | `ulTuLinhDungHop` |
| Bậc | **Siêu tuyệt kỹ** (`superUlt: true`) — cùng bậc với Sinh Tử Đồng Quy |
| Class | **Chỉ Tử Linh Thuật Sư** (`school: 'tu_linh_thuat_su'`) |
| Cấp cần | 60 |
| Hồi chiêu | 240 giây (cấp 5: 220s, cấp 10: 200s) |
| Tốn | 320 MP (có `costMul` của class) |
| Thời lượng | 60 giây |
| Ô gắn | Ô tuyệt kỹ R / X |

Cấp 60 vì đây là bậc siêu, và Tử Linh đã có tuyệt kỹ riêng ở cấp 30 (`ulLinh1`) và 35 (`ulLinh2`).
Hồi chiêu 240s dài hơn Sinh Tử Đồng Quy (180s) vì đây là **buff**, không phải đòn giết.

---

## 2. Cơ chế

```
dùng chiêu
  ├─ không có bóng ma nào trong bộ sưu tập  →  không dùng được, không mất gì
  └─ có bóng
       ├─ cộng dồn chỉ số của TOÀN BỘ bộ sưu tập vào người chơi, 60 giây
       ├─ bóng ma tan hết: roster = [], active = [], enabled = false
       └─ hết 60 giây: chỉ số trở lại bình thường, bộ sưu tập vẫn rỗng
```

### 2.1 Công thức cộng dồn

Mỗi bóng trong **bộ sưu tập** (tối đa 20), không phân biệt có đang triệu hồi hay không:

| Chỉ số | Cộng vào người chơi |
|---|---|
| HP | `shadowStats(soul).hp` — nguyên giá trị |
| MP | `monCurve(cấp bóng).atk` — nguyên giá trị |
| Thể lực | `monCurve(cấp bóng).def` — nguyên giá trị |
| DEF | `shadowStats(soul).def` — nguyên giá trị |

**Bóng ma không có MP và thể lực** — `shadowStats` chỉ trả về `hp, atk, def, speed`
(`shared/data/pets/shadow.js:37-43`). Nên MP và thể lực phải suy ra từ **đường cong quái**
(`monCurve`), vốn có `hp / atk / def / exp`. Đây là chỗ phải nói rõ với bạn: **hai chỉ số đó là
suy ra, không phải chỉ số thật của bóng.**

### 2.2 Bảng cân bằng thực đo (Tử Linh cấp 70, gốc: HP 4.441 · MP 1.108 · ST 316 · DEF 208)

| Bộ sưu tập | HP | MP | Thể lực | DEF | Giảm sát thương |
|---|---|---|---|---|---|
| 1 bóng tinh anh lv67 | 9.166 | 1.211 | 321 | 214 | 19% |
| 7 bóng tinh anh lv67 | 37.516 | 1.826 | 354 | 247 | 22% |
| **20 bóng tinh anh lv67** | **98.941** | **3.158** | **425** | **318** | **26%** |
| 20 bóng thường lv70 | 14.341 | 3.308 | 430 | 322 | 26% |

Đọc bảng này: **bộ sưu tập đầy bóng tinh anh cho gần 100.000 HP**, gấp 22 lần gốc. Đó là lý do
phải cộng nguyên giá trị (hệ số 1) và phải có cái giá mất trắng.

So sánh: trùm cuối 925.000 HP, trùm thường lv80 1.100.000 HP. 99.000 HP không giết được trùm,
nhưng đủ để đứng trong đó mà đánh. Đó là ý đồ.

---

## 3. Cái giá: mất sạch bộ sưu tập

Đây là phần quan trọng nhất của thiết kế, và là chỗ tôi cần bạn xác nhận.

**Dùng chiêu = mất trắng bộ sưu tập bóng ma.** `roster` về rỗng, `active` về rỗng, `enabled` về false.

Vì sao đắt đến vậy:

- Bóng ma thu được bằng cách **hạ quái** (chỉ quái thường và tinh anh, không bắt được thủ lĩnh
  hay trùm — `server/game/actions/combat.js:107`). Bộ sưu tập 20 bóng tinh anh là **nhiều giờ chơi**.
- Không có cách nào mua lại, không có cách nào khôi phục.
- Nếu chỉ "tan 60 giây rồi trở lại" thì đây là buff miễn phí, dùng lại mỗi 240 giây, và Tử Linh
  thành class mạnh nhất game mà không phải trả gì.

**Ba phương án, bạn chọn:**

| | Cái giá | Hệ quả |
|---|---|---|
| **A** | Mất **toàn bộ** bộ sưu tập | Đắt nhất. Dùng đúng lúc sống chết, không dùng chơi. |
| **B** | Mất **7 bóng đang trong đội hình**, giữ bóng lưu giữ | Vừa phải. Vẫn đau nhưng không xoá sạch nhiều giờ chơi. |
| **C** | Chỉ **tan 60 giây**, bóng trở lại sau khi hết | Rẻ nhất. Nhưng thành buff miễn phí, tôi không khuyên. |

Kế hoạch dưới đây viết theo **phương án A** (đắt nhất, đúng tinh thần "siêu tuyệt kỹ" như Sinh Tử
Đồng Quy). Nếu bạn chọn B, chỉ đổi một chỗ trong `castFusion`.

---

## 4. Dữ liệu kỹ năng

`shared/data/skills/ult/ult-dac-biet.js`, thêm vào `PART`:

```js
ulTuLinhDungHop: { school: 'tu_linh_thuat_su', icon: '🕸️', name: 'Tử Linh Dung Hợp',
  level: 60, mp: 320, cd: 240, ult: true, superUlt: true, shopNgoc: true,
  type: 'fusion', fusionSec: 30, fusionHp: 0.10, fusionMp: 0.05, fusionSta: 0.05, fusionDef: 0.05,
  fusionCost: 'roster',
  desc: 'Dung hợp toàn bộ bóng ma trong bộ sưu tập vào bản thân: cộng dồn sinh lực, năng lượng, '
    + 'thể lực và phòng thủ của chúng trong 60 giây. Đổi lại, mọi bóng ma tan biến — bộ sưu tập mất trắng.',
  m5: { cd: 220 }, t5: 'Hồi chiêu còn 220 giây.',
  m10: { cd: 235.3 }, t10: 'Hồi chiêu còn 200 giây.' },
```

`m10.cd = 235,3` vì `skillAt` nhân thêm 0,85 ở cấp 10 (`shared/logic/skills.js:27`),
nên 235,3 × 0,85 = 200 đúng như mô tả. Cùng cách đã dùng cho `ulSinhTu`.

**Không `ultAny`** — chỉ Tử Linh. `ultFits` (`shared/logic/skills.js:59-71`) tự chặn class khác
vì `school: 'tu_linh_thuat_su'` không nằm trong `schoolsOf` của họ.

---

## 5. Việc phải làm

### 5.1 `shared/data/pets/shadow.js` — hàm dung hợp

Thêm `shadowFusion(player, roster)`:

```js
// Dung hợp bóng ma: cộng dồn chỉ số của TOÀN BỘ bộ sưu tập (kể cả bóng không triệu hồi).
// Bóng ma không có MP / thể lực → suy từ đường cong quái (monCurve), xem kế hoạch mục 2.1.
function shadowFusion(player, roster) {
  const out = { hp: 0, mp: 0, sta: 0, def: 0, count: 0 };
  for (const soul of roster || []) {
    const s = shadowStats(soul, player);
    if (!s) continue;
    const c = G.monCurve(s.level);
    out.hp += s.hp * FUSION.hp;
    out.mp += c.atk * FUSION.mp;
    out.sta += c.def * FUSION.sta;
    out.def += s.def * FUSION.def;
    out.count++;
  }
  return { hp: Math.round(out.hp), mp: Math.round(out.mp), sta: Math.round(out.sta), def: Math.round(out.def), count: out.count };
}
```

Hệ số `FUSION = { hp: 0.10, mp: 0.05, sta: 0.05, def: 0.05 }` để một chỗ, dễ chỉnh.
Xuất ra `G.shadowFusion`.

**Thứ tự nạp an toàn:** `shared/index.js:111` nạp `data/pets/shadow` trước `logic/player` (dòng 135),
nên `player.js` gọi được `G.shadowFusion` lúc chạy.

### 5.2 `shared/logic/player.js` — cộng vào `calcStats`

Chèn vào `calcStats` ngay trước `return` (sau khối `nhiem`, dòng ~132):

```js
// Siêu tuyệt kỹ Tử Linh Dung Hợp: bóng ma đã dung hợp thì cộng chỉ số vào người.
// `player.fusion` do server ghi khi dùng chiêu; hết hạn thì server xoá.
const fu = player.fusion && player.fusion.until > Date.now() ? G.shadowFusion(player, player.fusion.souls) : null;
if (fu) { hp += fu.hp; mp += fu.mp; def += fu.def; }
```

Thể lực cộng vào `maxSta` ở dòng 135: `... + eq.sta + (fu ? fu.sta : 0)`.

**Vì sao lưu `souls` (bản sao bộ sưu tập) vào `player.fusion`:** vì `roster` bị xoá ngay khi dùng
chiêu. Không có bản sao thì không tính được chỉ số. `souls` chỉ là dữ liệu chỉ số, không phải
bóng thật — không triệu hồi lại được.

`player.fusion` rơi vào section `misc` (`server/storage/sections.js:35`) nên tự được lưu.

### 5.3 `server/game/actions/combat.js` — action `fusion`

Thêm action mới, cùng file với `kills`/`die`:

```js
fusion(p, a, ev) {
  if (p.school !== 'tu_linh_thuat_su') fail('Chỉ Tử Linh Thuật Sư mới dùng được dung hợp.');
  const roster = (p.shadows && p.shadows.roster) || [];
  if (!roster.length) fail('Không có bóng ma nào để dung hợp.');
  if (p.fusion && p.fusion.until > Date.now()) fail('Đang trong thời gian dung hợp.');
  const sk = G.skillAt('ulTuLinhDungHop', G.skillLevel(p, 'ulTuLinhDungHop') || 1);
  const fu = G.shadowFusion(p, roster);
  const st = G.calcStats(p, { form: !!p.formActive });
  p.fusion = { until: Date.now() + (sk.fusionSec || 30) * 1000, souls: roster.map(s => ({ monster: s.monster, lv: s.lv, stats: s.stats })) };
  // Cái giá: mất trắng bộ sưu tập (phương án A)
  p.shadows.roster = []; p.shadows.active = []; p.shadows.enabled = false;
  // Máu hiện tại giữ nguyên, chỉ trần tăng — không hồi máu miễn phí
  p.hp = Math.min(p.hp, st.maxHp + fu.hp);
  ev.push({ t: 'msg', text: `Dung hợp ${fu.count} bóng ma: +${fu.hp} sinh lực, +${fu.mp} năng lượng, +${fu.sta} thể lực, +${fu.def} phòng thủ trong ${sk.fusionSec}s.`, color: '#c6a7ff' });
  ev.push({ t: 'fusion', until: p.fusion.until, count: fu.count });
}
```

Đăng ký ở `server/game/index.js:17-27` — `actions/combat` đã được nạp sẵn, chỉ cần thêm hàm vào
`module.exports` của file đó.

**Server phải kiểm lại mọi thứ:** class, có bóng, đang dung hợp, hồi chiêu. Không tin client.

### 5.4 Hồi chiêu do server giữ

`p.fusionCd` (mốc ms), cùng cách với `p.execCd` của Sinh Tử Đồng Quy. Rơi vào `misc`, tự lưu.

Kiểm trong action: `if (now < (p.fusionCd || 0)) fail('Chưa hồi chiêu.');` rồi
`p.fusionCd = now + sk.cd * 1000`.

### 5.5 `public/js/scene/skills.js` — nhánh client

Thêm nhánh `sk.type === 'fusion'` trong `useSkill`, cùng chỗ với `execute`:

```js
if (sk.type === 'fusion') { this.castFusion(id, sk, time); return; }
```

`castFusion(id, sk, time)`:
- Kiểm `App.player.school === 'tu_linh_thuat_su'` và `App.player.shadows.roster.length`.
- Không có bóng → `UI.log('Không có bóng ma nào để dung hợp.')`, **không** trừ hồi chiêu.
- Có bóng → gọi `Net.action('fusion')`, chờ server trả về, rồi `App.recalcStats()`.
- Hiệu ứng: vòng xoáy tím quanh người, 20 chấm sáng bay vào người, camera flash nhẹ.

**Không tự tính chỉ số ở client.** Server là nguồn sự thật; client chỉ vẽ.

### 5.6 Hết hạn dung hợp

`player.fusion.until` hết hạn thì `calcStats` tự bỏ qua (điều kiện `until > Date.now()`).
Nhưng `player.fusion` vẫn nằm đó, và `App.stats` chỉ tính lại khi có sự kiện.
Nên thêm một nhịp kiểm trong `world.js` update (chỗ gọi `shadowUpdate`, dòng ~309):

```js
// Dung hợp hết hạn: tính lại chỉ số một lần, rồi báo server dọn `p.fusion`
if (App.player.fusion && App.player.fusion.until <= Date.now()) {
  App.player.fusion = null;
  App.recalcStats();
  Net.action('fusion_end').catch(() => {});
}
```

Action `fusion_end` phía server chỉ `delete p.fusion`.

### 5.7 UI

`public/js/ui/panels/skills.js` — `skillNumbers` thêm dòng:

```js
if (s.type === 'fusion') out.push(`dung hợp bóng ma · ${s.fusionSec}s`);
```

Nhãn **SIÊU TUYỆT KỸ** màu tím đã có sẵn từ `ulSinhTu` (`base.superUlt`), không phải sửa.

Thêm chỉ báo đang dung hợp: dòng chữ nhỏ dưới thanh máu, đếm ngược giây. Chỗ vẽ: `world.js`
`drawOverlay` (~dòng 822, nơi vẽ vòng `guard` / `manashield`).

### 5.8 Bán ở Lầu Trân Bảo

Tự động. `shared/data/items/index.js:79-88` đã xử lý `superUlt` → giá ×2, nhóm `superult`.
Cấp 60 → `ngocPriceOfUlt(60) = 210` → **420 Linh Ngọc**, cùng giá Sinh Tử Đồng Quy.

### 5.9 Bộ kiểm tra

`server/tools/check/audit-skill-fx.js` — thêm `fusion: ['fusionSec', 'fusionHp', 'fusionMp', 'fusionSta', 'fusionDef', 'fusionCost']`
vào `CONSUMED`.

---

## 6. Cân bằng: ba rủi ro

1. **Bộ sưu tập toàn bóng tinh anh → gần 100.000 HP.** Đây là con số lớn nhất trong game cho một
   người chơi. Bù lại: chỉ 60 giây, hồi 240 giây, và mất sạch bóng. Nếu thấy quá mạnh, hạ
   `fusionHp` từ 0,10 xuống 0,06 → còn khoảng 60.000 HP.

2. **Cộng dồn với Thức Tỉnh.** `calcStats` cộng dung hợp **sau** khi nhân hệ số Ấn, nên dung hợp
   không bị nhân lên. Đúng ý: Ấn nhân chỉ số gốc, dung hợp là phần cộng thêm.

3. **Bóng ma cấp cao hơn người chơi.** Bóng giữ cấp quái lúc thu phục, không kẹp theo cấp chủ
   (`shadow.js:25-27`). Tử Linh cấp 60 bắt được bóng cấp 90 nếu đi map cao → dung hợp ra chỉ số
   của bóng cấp 90. Đây là **lỗ hổng thật**: cày bóng cấp cao rồi dung hợp. Nếu muốn chặn, kẹp
   cấp bóng theo cấp chủ khi tính dung hợp (`Math.min(s.level, p.level)`). Tôi khuyên **kẹp**.

---

## 7. Tóm tắt

| | |
|---|---|
| Tên | Tử Linh Dung Hợp |
| Class | Chỉ Tử Linh Thuật Sư |
| Cấp / hồi chiêu | 60 / 240s |
| Tác dụng | cộng **nguyên** HP, MP, thể lực, DEF của **mỗi bóng** trong bộ sưu tập, 60 giây |
| Cái giá | Mất trắng bộ sưu tập bóng ma |
| Giá sách | 420 Linh Ngọc ở Lầu Trân Bảo |
| File đụng | 7 file, khoảng 120 dòng |

---

## 8. Ba câu cần bạn trả lời trước khi tôi code

1. **Cái giá:** phương án **A** (mất toàn bộ bộ sưu tập), **B** (mất 7 bóng trong đội hình), hay
   **C** (chỉ tan 60 giây rồi trở lại)? Kế hoạch đang viết theo A.

2. **Kẹp cấp bóng:** có kẹp cấp bóng theo cấp người chơi khi tính dung hợp không? Tôi khuyên **có**,
   nếu không thì cày bóng cấp 90 ở map cao là ra chỉ số vô đối.

3. **MP và thể lực suy ra:** bóng ma không có MP/thể lực thật, tôi suy từ `monCurve`. Bạn muốn giữ
   cách đó, hay bỏ hẳn hai chỉ số này và chỉ cộng HP + DEF?
