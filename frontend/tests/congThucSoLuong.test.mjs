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
