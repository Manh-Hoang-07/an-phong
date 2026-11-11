# Kế hoạch: nâng đồ họa bằng code (không cần tư liệu ngoài)

*Nguyên tắc: chỉ dùng code + canvas chạy ngay trong game, **không tải pack ảnh mới, không cần vẽ tay bên ngoài**; làm từng giai đoạn, giai đoạn sau chỉ làm khi giai đoạn trước đã duyệt (bằng mắt + số liệu overlay); mọi thay đổi đều có cờ rollback.*

Khác với kế hoạch nền parallax (`KE_HOACH_NEN_MAP_PARALLAX.md`) — kế hoạch đó cải thiện *nền*, kế hoạch này cải thiện *ánh sáng, chiều sâu, cảm giác đánh trúng và hiệu năng render* cho phần đã có sẵn.

## 0. Bảng giai đoạn

| Giai đoạn | Nội dung | Rủi ro | Tác động nhìn thấy | Trạng thái |
|---|---|---|---|---|
| **M0** | Overlay đo hiệu năng (FPS, draw call, particle…) | Rất thấp | Không (chỉ để đo) | Chờ duyệt |
| **M1** | PostFX toàn màn hình: bloom nhẹ + chỉnh màu theo map | Thấp | Lớn nhất | Chờ duyệt |
| **M2** | Đèn giả (quầng sáng ADD) cho đèn/cổng/tinh thể/nhà | Rất thấp | Lớn | Chờ duyệt |
| **M3** | Bóng đổ động theo độ cao nhảy | Rất thấp | Trung bình | Chờ duyệt |
| **M4** | Viền (outline) tự sinh cho nhân vật/quái | Trung bình (vòng lặp pixel) | Trung bình | Làm sau |
| **M5** | Gộp atlas texture lúc chạy | Trung bình (bộ nhớ) | Không nhìn thấy, tăng fps | Làm sau |
| **M6** | Hiệu ứng bổ sung: hit-stop, vệt dash, tia nắng, bóng nước | Thấp | Trung bình | Làm sau |

M0 làm trước vì mọi nghiệm thu về sau đều dựa vào số liệu của nó.

## 1. Hiện trạng (đã đối chiếu code)

- Render: Phaser 3.90 WebGL (`public/js/core/main.js`), khung logic cao 540, canvas vẽ k = 2.5–3.5× (chế độ Cao), có trần điểm ảnh cho điện thoại (iPhone 2,6 triệu px) — `View` trong `public/js/scene/juice.js`.
- Chất lượng: Cao / Tự động / Thấp (`Quality`, cùng file). Tự động hạ khi trung bình > 24ms trong ~3s; chế độ Thấp tắt thời tiết, sương, hạt sáng, lay cỏ.
- Đã có sẵn: tia lửa/bụi/tuyết/sương/lá/ember, camera punch khi chí mạng, slow-mo, glow preFX cho cổng, `setTintFill` flash khi quái trúng đòn, bóng blob tĩnh dưới chân NPC.
- Nền: 3–4 lớp tileSprite parallax + lớp grade MULTIPLY + sương + vignette (≈ 4 lớp vẽ phủ toàn màn hình mỗi khung → chi phí fill-rate lớn nhất của game trên điện thoại).
- Điểm yếu nhìn thấy: cảnh "phẳng" — không có nguồn sáng rõ, bóng tĩnh, không bloom; nhân vật/quái đôi khi chìm vào nền cùng tông.

## 2. M0 — Overlay đo hiệu năng (nền tảng)

Mục tiêu: có số thật trước và sau mỗi giai đoạn, không đoán mò.

- Bật bằng `?debug=1` hoặc phím **F3** (chỉ dev; không vào bản build người chơi).
- Nội dung hiển thị góc trái trên (vẽ bằng text Phaser, không ảnh hưởng gameplay):
  - FPS thực (`game.loop.actualFps`) + ms/khung trung bình 1s.
  - Số draw call / khung (đọc từ `game.renderer` khi WebGL: `renderer.drawCount` hiện chưa có sẵn → đếm qua `renderer.onPreRender/onPostRender` hoặc dùng `scene.renderer.pipelines` nếu không lấy được thì ghi chú trong code).
  - Số particle đang sống, số tween đang chạy (`tweens.getTweens().length`), số texture đang nạp (`textures.getTextureKeys().length`).
  - Ước lượng RAM GPU texture: tổng `width×height×4` của các texture đã nạp.
- Ghi nhận baseline vào cuối file này (mục 7) trước khi làm M1: máy tính + 1 điện thoại thật, chế độ Cao và Thấp, 3 map nặng nhất (nhiều quái + thời tiết).
- Ngân sách mục tiêu ghi sẵn: **60fps máy tính** (khung ≤ 16,6ms), **≥ 45fps điện thoại tầm trung**, draw call < 100, particle sống < 400.

## 3. M1 — PostFX toàn màn hình (bloom + màu)

- Dùng filter có sẵn của Phaser 3.90: `cameras.main.postFX.addBloom(...)` + `postFX.addColorMatrix(...)`.
- Bloom **rất nhẹ** (strength ≈ 0,35–0,5, threshold cao) để đèn, cổng, tinh thể, đạn phát sáng tự nhiên — thứ hiện tại chỉ có glow preFX cho vài vật.
- Chỉnh màu theo `MapLooks` hiện có: mỗi map thêm `contrast` / `saturation` / `brightness` (dùng `ColorMatrix` sẵn, không cần LUT). Map tối (hang, dị giới) tăng tương phản nhẹ; map sáng giữ nguyên.
- Điều kiện bật (mọi điều kiện phải thỏa):
  1. WebGL (`this.webgl` đã có trong `setupJuice`);
  2. `Quality.mode === 'high'` — chế độ Tự động/Thấp không bật;
  3. không vượt trần điểm ảnh mobile đã có (`View.pw × View.ph ≤ 4 triệu`) — PostFX nhân chi phí fill-rate;
  4. cờ toàn cục `MapLooks.usePostFx` (mặc định bật, đổi `false` = rollback 1 dòng).
- Auto-hạ chất lượng hiện tại (`applyLowQuality`) phải destroy postFX khi chuyển xuống Thấp.
- NGHIÊM CẤM bật bloom trên máy pixel budget thấp (iPhone) — kiểm trên máy thật trước khi duyệt.

## 4. M2 — Đèn giả (không dùng LightPipeline)

Không dùng hệ đèn 2D thật của Phaser (cần normal map cho từng sprite — không tự làm được và nặng). Thay bằng quầng sáng giả, rẻ và hợp phong cách hiện tại:

- Texture mới `fx_light` vẽ code (radial gradient trắng mờ, như `fx_dust` đang làm trong `makeJuiceTextures`).
- Đặt tại: đèn đường (`d_lamp`), cổng (`d_portal` — có sẵn ADD nên thêm quầng nền), tinh thể (`d_crystal`/`d_redcrystal`), cửa tiệm `$`, nhũ đá map hang. Màu theo theme/look (thêm 1 trường `light` vào `MapLooks` nếu cần, mặc định theo theme).
- Blend ADD, depth ngay trên grade layer (≈ 5.6), scrollFactor 0.5–0.7 để có chiều sâu, alpha nhấp nháy rất nhẹ (tween có sẵn).
- Tốn ~1 image mỗi nguồn sáng (vài chục nguồn/map, mỗi cái 1 lượt vẽ — chấp nhận được, vẫn nằm trong ngân sách draw call).
- Chế độ Thấp: không đặt (giống thời tiết).

## 5. M3 — Bóng đổ động

- Nhân vật + quái + pet đang có bóng tĩnh; đổi thành: scale = giảm dần và alpha = nhạt dần theo khoảng cách từ chân sprite tới mặt đất (`groundY` đã có sẵn trong `map.js`).
- Cực rẻ: chỉ 2 phép tính mỗi khung mỗi vật, không thêm lượt vẽ.
- Khi rơi từ trên cao, bóng nhỏ dần rồi nở to khi chạm đất — tăng cảm giác "trọng lượng" cho đòn nhảy/đá bay, khớp với hiệu ứng bụi tiếp đất đã có.

## 6. M4–M6 — làm sau khi M0–M3 đạt

- **M4 outline tự sinh**: quét alpha của frame đầu mỗi sheet, nở 1–2px, tạo viền tối bán trong suốt vẽ ngay trong texture (canvas). Nhân vật/quái nổi rõ trên nền cùng tông. Rủi ro: thời gian quét lúc nạp map (đo bằng M0, phải < 50ms/sheet trên máy yếu) và tăng bộ nhớ texture ~15%. Chỉ bật chế độ Cao.
- **M5 atlas lúc chạy**: vẽ các sheet của map vào 1–2 canvas texture lớn, đăng ký frame bằng `texture.add(...)`, giảm số lần bind texture. Chỉ làm nếu M0 cho thấy texture bind là điểm nghẽn thật.
- **M6 hiệu ứng**: hit-stop 40–60ms khi đánh trúng đòn lớn (dừng `physics.world.isPaused` chốc lát, khớp slow-mo đã có), vệt sáng khi dash, tia nắng xuyên tán lá cho map rừng (nhiphen nghiêng vẽ code, ADD), gợn sáng mặt hồ cho ô nước `"`.

## 7. Baseline đo được (điền sau M0)

| Máy | Chế độ | FPS | ms/khung | Draw call | Particle | Ghi chú |
|---|---|---|---|---|---|---|
| *(điền khi chạy M0)* | | | | | | |

## 8. Quy trình nghiệm thu từng giai đoạn

1. Đo M0 trước và sau khi bật, chép số vào mục 7 — không được chậm hơn đáng kể (≤ 1ms/khung máy tính, ≤ 2ms điện thoại).
2. Xem bằng mắt: 3 map cùng theme đặt cạnh nhau phải khác nhau rõ hơn trước; chế độ Thấp phải **giống hệt trước khi nâng** (mọi hiệu ứng mới đều tắt ở Thấp).
3. Rollback: mỗi giai đoạn 1 cờ (`MapLooks.usePostFx`, `MapLooks.useLights`, `dynamicShadow`…) — đổi 1 dòng là về trạng thái cũ.
4. Điện thoại thật bắt buộc kiểm với M1 (bloom) trước khi duyệt giai đoạn đó.
