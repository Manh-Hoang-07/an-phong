'use strict';
/* Công thức nền ảnh từng bản đồ (xem MapLooks.layerDefs trong map_looks.js để biết cú pháp).
 *
 * Nguồn ảnh có sẵn (public/assets/bg/<bộ>/<lớp>), cả 4 lớp sky | far | mid | near trừ khi ghi chú:
 *   misty   rừng sương xanh lam: thân cây cao nhiều tầng + bụi + sương
 *   night   trời đêm có trăng/sao (sky), mây (far), núi tím (mid), đồi cát (near)
 *   (đã bỏ bộ 'sunset' do giấy phép chưa rõ; xem thêm các bộ win/cfr/des/elv/hor/uw/hal/fai/bch/vamp/bcn/brl/lr_ trong MapLooks.PACKS)
 *   space1..4  chỉ lớp sky: tinh vân (tím-xanh / xanh lục lam / tím hồng / xanh đậm)
 * Lớp không khai báo → dùng hình vẽ code của theme (thành phố, hang…). Muốn map mới khác biệt: chọn lớp từ các bộ trên + hue/sat/lum/tint/mix/flip.
 * Mẹo: hue xoay màu (xanh lam → lục: -120, → đỏ/cam: +150, → tím: +40); lum < 1 tối đi cho hang/đêm; lum > 1 cho tuyết/ánh sáng. */
// Cảnh TĨNH (một ảnh phủ kín): far = ảnh ghép gương cuộn chậm, sky/mid/near rỗng (che hình vẽ code). still('lr_rn6', { hue: 20 })
const still = (pack, g) => ({ sky: 'blank/sky', far: Object.assign({ src: pack + '/far', mirror: true }, g || {}), mid: 'blank/mid', near: 'blank/near' });
const MapScenes = {
  // ------------------------------------------------------------- Rừng & ven
  rung: { sky: 'misty/sky', far: 'misty/far', mid: 'misty/mid', near: 'misty/near' },
  b_en_pha: {
    ...still('lr_rn14'),
  },
  d_lay_muc: {
    all: { hue: -80, sat: 0.85, lum: 0.85, mix: [0x4a5a22, 0.18] },
    sky: 'fai3/sky', far: 'fai3/far', mid: 'fai3/mid', near: 'fai3/near',
  },
  lang_chai: {
    sky: 'brl/sky', far: 'brl/far', mid: 'brl/mid', near: 'brl/near',
  },
  chan_nui: {
    sky: 'win1/sky', far: 'win1/far', mid: 'win1/mid', near: 'win1/near',
  },

  // ------------------------------------------------------------- Hang & núi
  hang: {
    ...still('lr_cav9'),
  },
  kho_bac: {
    ...still('lr_cav10'),
  },
  hem_nui: {
    ...still('lr_str2'),
  },
  lo_ren_bang: {
    ...still('lr_shr8'),
  },
  dinh_nui: {
    ...still('lr_rn10'),
  },
  cc_hac_nguyet: {
    ...still('lr_rn7'),
  },
  tp_chim_t: {
    ...still('lr_rn22'),
  },
  tp_chim_c: {
    ...still('lr_tun7'),
  },
  thu_vien: {
    ...still('lr_shr5'),
  },
  phong_luu_tru: {
    ...still('lr_rune1'),
  },
  dinh_thap: {
    ...still('lr_rn6'),
  },

  // ------------------------------------------------------------- Thành phố (lớp không khai báo giữ hình vẽ code: nhà, đèn)
  lang: {
    sky: 'bcn/sky', far: 'bcn/far', mid: 'bcn/mid', near: 'bcn/near',
  },
  vac_da: {
    ...still('lr_rn19'),
  },
  cong_khai_hoan: {
    sky: 'vamp3/sky', far: 'vamp3/far', mid: 'vamp3/mid', near: 'vamp3/near',
  },
  quang_truong: {
    ...still('lr_rn15'),
  },

  // ------------------------------------------------------------- Dị giới
  cong_do: {
    sky: 'hal2/sky', far: 'hal2/far', mid: 'hal2/mid', near: 'hal2/near',
  },
  tan_do_bt: {
    all: { hue: 150, sat: 1.15, lum: 0.85, mix: [0x7a1a10, 0.12] },
    sky: 'bcn/sky', far: 'bcn/far', mid: 'bcn/mid', near: 'bcn/near',
  },
  cau_dan: {
    sky: 'vamp4/sky', far: 'vamp4/far', mid: 'vamp4/mid', near: 'vamp4/near',
  },
  sanh_cho: {
    ...still('lr_rn3'),
  },
  dinh_cong_vh: {
    ...still('lr_rn16'),
  },
  tam_diem: {
    ...still('lr_shr6'),
  },
  cong_ss: {
    ...still('lr_tun29'),
  },
  thien_khoi: {
    all: { sat: 1.1, lum: 0.9 },
    sky: 'des3/sky', far: 'des3/far', mid: 'des3/mid', near: 'des3/near',
  },
  long_mach: {
    all: { hue: -10, sat: 0.9, lum: 0.9 },
    sky: 'fai1/sky', far: 'fai1/far', mid: 'fai1/mid', near: 'fai1/near',
  },
  tinh_van: {
    ...still('lr_cav6'),
  },
  than_mong: {
    sky: 'fai2/sky', far: 'fai2/far', mid: 'fai2/mid', near: 'fai2/near',
  },
  sang_the: {
    ...still('lr_rn12'),
  },
};

/* Cảnh trí + ô đất riêng từng map (đọc trong WorldScene.buildDecorations / buildTiles). Mọi trường đều tùy chọn; map không khai báo giữ hình vẽ code và ô đất của theme.
 *   tile    biến thể ô đất (MapLooks.TILE_VARIANTS: snow sand redsand stone gold ash wet purple void voidg swamp pink teal)
 *   tree    bộ ảnh thay cây '&'      ceil  bộ ảnh nhũ đá treo trần '^' ('none' = bỏ, vd. map ngoài trời)      floor  bộ ảnh vật mọc trên nền '^' ('none' = bỏ)
 *   bits    bộ ảnh rải trên mặt đất (thay cỏ/sỏi vẽ code)      tint  nhân màu lên cảnh trí để hợp tông nền      sway  false = không lay
 * Bộ ảnh có sẵn (public/assets/props, MapProps.SETS): cactus, pine, palm, hands (tay trồi từ mộ), stal (nhũ đá rêu treo), vine (dây xoắn ngọc), rock (đá nhỏ).
 * Thêm bộ mới: sửa SETS trong server/tools/props-extract.js rồi chạy lại. */
const MapDecor = {
  rung: { tile: 'earth' },
  // Ngoài trời / tuyết / sa mạc / biển
  chan_nui: { tile: 'snow', tree: 'none', ceil: 'none', bits: 'rock', tint: 0xdce8ff },
  dinh_nui: { tile: 'snow', ceil: 'none', bits: 'rock', tint: 0xdce8ff },
  hem_nui: { tile: 'sand', ceil: 'none', bits: 'rock', tint: 0xe8d0b0 },
  vac_da: { tile: 'sand', tree: 'cactus', ceil: 'none', bits: 'rock' },
  thien_khoi: { tile: 'redsand', ceil: 'none', floor: 'cactus', tint: 0xe0a080 },
  b_en_pha: { tile: 'wet', tree: 'palm', ceil: 'none', bits: 'rock', tint: 0xc8d4d8 },
  lang_chai: { tile: 'sand', tree: 'none', ceil: 'none', bits: 'rock' },
  d_lay_muc: { tile: 'swamp', ceil: 'none', tint: 0xb8c890 },
  // Hang / ngục / dưới nước
  hang: { tile: 'purple', ceil: 'stal', bits: 'rock', tint: 0xc0b0e8 },
  kho_bac: { tile: 'gold', ceil: 'stal', bits: 'rock', tint: 0xe0b070 },
  lo_ren_bang: { tile: 'stone', ceil: 'stal', bits: 'rock', tint: 0xe0b080 },
  tp_chim_t: { tile: 'wet', ceil: 'none', floor: 'vine', bits: 'rock', tint: 0xa0e0d0 },
  tp_chim_c: { tile: 'wet', ceil: 'stal', bits: 'rock', tint: 0x90b0b0 },
  phong_luu_tru: { tile: 'stone', ceil: 'none', bits: 'rock', tint: 0x9890b0 },
  thu_vien: { tile: 'gold', ceil: 'none', bits: 'rock', tint: 0xd0b080 },
  // Tàn tích / thành phố
  cc_hac_nguyet: { tile: 'purple', ceil: 'none', floor: 'hands', tint: 0xb0a0d0 },
  dinh_thap: { tile: 'stone', ceil: 'none', floor: 'none', bits: 'rock' },
  cong_khai_hoan: { tile: 'stone', ceil: 'none', bits: 'rock' },
  quang_truong: { tile: 'stone', ceil: 'none', bits: 'rock' },
  tan_do_bt: { tile: 'ash', ceil: 'none', bits: 'rock' },
  // Dị giới
  cong_do: { ceil: 'none', bits: 'rock', tint: 0xffa0a0 },
  cau_dan: { ceil: 'none', floor: 'hands', bits: 'rock', tint: 0xd09090 },
  sanh_cho: { tile: 'void', ceil: 'none', floor: 'vine', tint: 0xc0a0ff },
  dinh_cong_vh: { tile: 'void', ceil: 'none', floor: 'cactus', tint: 0xd0a8f0 },
  tam_diem: { tile: 'voidg', ceil: 'none', floor: 'vine', tint: 0x90ffc0 },
  cong_ss: { tile: 'void', ceil: 'stal', floor: 'vine', tint: 0xb080e0 },
  sang_the: { tile: 'gold', ceil: 'none', floor: 'none', bits: 'rock' },
  long_mach: { tile: 'teal', ceil: 'none', floor: 'vine', tint: 0x90e8d0 },
  than_mong: { tile: 'pink', ceil: 'none', floor: 'vine', tint: 0xffb0e0 },
  tinh_van: { tile: 'void', ceil: 'none', floor: 'vine', tint: 0xb0c0ff },
};
