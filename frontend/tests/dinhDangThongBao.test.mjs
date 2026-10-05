import assert from "node:assert/strict";
import { dinhDangSoThongBao } from "../src/lib/dinhDangThongBao.js";

// Nội dung thật lấy từ bảng thong_bao staging 05/10/2026 (đọc, không ghi).
assert.equal(
  dinhDangSoThongBao('Tổng 40259 đơn vị nằm trong giỏ đợt bổ sung tháng 1/2027, số lượng mới là GỢI Ý.', { tong: 40259, so_ma: 2, ma_hang: ["66330", "66349"] }),
  'Tổng 40.259 đơn vị nằm trong giỏ đợt bổ sung tháng 1/2027, số lượng mới là GỢI Ý.',
);
assert.equal(
  dinhDangSoThongBao("284156 Cái đã được chuyển sang mã 66142 (Bơm tiêm đầu thẳng, 10ml). Số đề xuất mã 66326 của khoa nay là 0.", { so_luong: 284156, ma_hang_rot: "66326", ma_hang_nhan: "66142" }),
  "284.156 Cái đã được chuyển sang mã 66142 (Bơm tiêm đầu thẳng, 10ml). Số đề xuất mã 66326 của khoa nay là 0.",
);
// Số < 1000 giữ nguyên; không có du_lieu thì giữ nguyên câu.
assert.equal(dinhDangSoThongBao("Tổng 173 đơn vị", { tong: 173 }), "Tổng 173 đơn vị");
assert.equal(dinhDangSoThongBao("Tổng 40259 đơn vị", null), "Tổng 40259 đơn vị");
// Mã hàng trùng giá trị số lượng nhưng không ở chỗ số lượng → không đụng.
assert.equal(dinhDangSoThongBao("Mã 66326 rớt, số 5000", { so_luong: 66326 }), "Mã 66326 rớt, số 5000");
// Không đổi số dài hơn chỉ vì chứa số ngắn (40259 vs 402591).
assert.equal(dinhDangSoThongBao("Tổng 402591 đơn vị", { tong: 40259 }), "Tổng 402591 đơn vị");
console.log("dinhDangThongBao.test.mjs: OK");
