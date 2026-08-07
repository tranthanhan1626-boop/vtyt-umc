import assert from "node:assert/strict";
import {
  chuoiNhuCau, khoangPhanVi, mucDuBaoTsb,
} from "../src/lib/congThucSoLuong.js";

// Dữ liệu thực đã gộp theo tháng của mã 57436 tại Khoa GMHS - Phòng mổ.
// Năm 2025 dùng 4.721; 12 tháng gần nhất (07/2025–06/2026) dùng 5.224.
const lichSu57436 = {
  2024: [341, 233, 370, 377, 391, 370, 284, 41, 0, 0, 74, 332],
  2025: [312, 310, 388, 370, 437, 504, 425, 435, 403, 399, 283, 455],
  2026: [435, 347, 549, 487, 534, 472, 0, 0, 0, 0, 0, 0],
};

assert.equal(
  lichSu57436[2025].reduce((tong, so) => tong + so, 0),
  4721,
  "đối chứng tổng năm 2025",
);

const chuoi = chuoiNhuCau(lichSu57436, {});
const duBao12Thang = khoangPhanVi(chuoi, 12);

assert.equal(chuoi.tong12, 5224, "phải lấy đúng 12 tháng gần nhất");
assert.equal(chuoi.soThang, 24, "công thức phải dùng đúng cửa sổ hai năm");
assert.equal(chuoi.soThangCoDung, 22, "phải đếm riêng tháng thực sự có phát sinh");
assert.equal(duBao12Thang.p50, 5702, "P50 phải dùng TSB α=0,30 trên 24 tháng");
assert.equal(duBao12Thang.heSoTang, 1);
assert.notEqual(duBao12Thang.p50, 6398, "chặn hồi quy công thức cũ");

assert.equal(mucDuBaoTsb(Array(24).fill(100)), 100, "mã dùng đều phải giữ đúng mức");

console.log("✓ P50 mã 57436 (12 tháng): 5.702 theo TSB, không còn bị đẩy lên 6.398");

// ---------------------------------------------------------------------------
// Mã 67340 (Vật liệu làm khô ống tủy, gói Răng Hàm Mặt) — dữ liệu thật
// database/so luong su dung full.xlsx, đã dùng để phát hiện hai lỗi công
// thức 08/2026. Chuỗi 2024-01 → 2026-06 gộp toàn viện.
const lichSu67340 = {
  2024: [457, 188, 363, 614, 509, 899, 1629, 888, 783, 1271, 0, 0],
  2025: [0, 0, 0, 0, 0, 0, 0, 1000, 0, 1000, 4149, 1861],
  2026: [1290, 881, 4156, 3473, 0, 0],
};

const thangCuoiHIS2026_06 = 2026 * 12 + (6 - 1);

// Lỗi 1 — mốc cuối cửa sổ: KHÔNG truyền thangCuoiHIS thì công thức tự suy mốc
// cuối = tháng gần nhất CÓ xuất (04/2026), đẩy cửa sổ lùi cho kết thúc đúng
// vào đợt dùng bù sau hết hàng -> P75 bị thổi lên rất cao.
const chuoiCu = chuoiNhuCau(lichSu67340, {});
const p75Cu = khoangPhanVi(chuoiCu, 18).muc.P75;

// Truyền đúng thangCuoiHIS (tháng HIS mới nhất TOÀN VIỆN, 06/2026) thì cửa sổ
// không còn bị đẩy lùi theo tháng cuối riêng của mã này.
const chuoiMoi = chuoiNhuCau(lichSu67340, {}, 24, thangCuoiHIS2026_06);
const p75Moi = khoangPhanVi(chuoiMoi, 18).muc.P75;

assert.ok(
  p75Moi < p75Cu * 0.7,
  `mốc cuối = tháng HIS mới nhất phải giảm P75 đáng kể (cũ ${p75Cu}, mới ${p75Moi})`,
);

// Lỗi 2 — khe nghi hết hàng: cửa sổ có dải 9 tháng liền =0 (2024-11→2025-07)
// nằm GIỮA hai giai đoạn có dùng -> phải bị loại khỏi thống kê.
assert.ok(
  chuoiMoi.soThangBiLoaiKhe >= 9,
  `phải loại được dải 9 tháng nghi hết hàng ở giữa (đếm được ${chuoiMoi.soThangBiLoaiKhe})`,
);
assert.equal(chuoiMoi.soThangBiLoaiBangChung, 0, "không có sổ thiếu hàng nên không loại theo bằng chứng");

console.log(
  `✓ Mã 67340: mốc cuối HIS chung đưa P75 từ ${p75Cu.toLocaleString("vi-VN")} `
  + `xuống ${p75Moi.toLocaleString("vi-VN")}; loại được ${chuoiMoi.soThangBiLoaiKhe} tháng nghi hết hàng`,
);

// ---------------------------------------------------------------------------
// Khe ngắn (< NGUONG_KHE=3 tháng) KHÔNG bị loại — chỉ dải đủ dài mới là dấu
// hiệu đáng tin của hết hàng, tháng 0 lẻ vẫn là tín hiệu nhu cầu thật.
const chuoiKheNgan = chuoiNhuCau(
  { 2024: [10, 0, 0, 10, 10, 10, 10, 10, 10, 10, 10, 10], 2025: Array(12).fill(10) },
  {}, 24, 2025 * 12 + 11,
);
assert.equal(chuoiKheNgan.soThangBiLoaiKhe, 0, "khe 2 tháng không đạt ngưỡng 3 thì phải giữ nguyên");

console.log("✓ Khe ngắn dưới ngưỡng (2 tháng) không bị loại");
