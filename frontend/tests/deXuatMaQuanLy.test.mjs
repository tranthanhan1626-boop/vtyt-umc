import assert from "node:assert/strict";
import {
  dvtChuanCuaNhom,
  gopLichSuTheoMaQuanLy,
  heSoHieuLuc,
  kiemTraQuyDoi,
  tongPhanBoQuyDoi,
  tuDienPhanBoMotMaHang,
} from "../src/lib/deXuatMaQuanLy.js";

const items = [
  { ma_hang: "A", dvt: "Hộp", he_so_quy_doi: 10 },
  { ma_hang: "B", dvt: "Cái", he_so_quy_doi: 1 },
];
assert.equal(dvtChuanCuaNhom(items, "Cái"), "Cái");
assert.equal(heSoHieuLuc(items[0], "Cái"), 10);
assert.equal(kiemTraQuyDoi(items, "Cái").hopLe, true);
assert.equal(tongPhanBoQuyDoi(items, { A: 2, B: 5 }, "Cái"), 25);

const lichSu = gopLichSuTheoMaQuanLy(items, {
  A: { 2026: [1, ...Array(11).fill(0)] },
  B: { 2026: [5, ...Array(11).fill(0)] },
}, "Cái");
assert.equal(lichSu[2026][0], 15);

const cungDvt = [{ ma_hang: "C", dvt: "Que", he_so_quy_doi: null }];
assert.equal(dvtChuanCuaNhom(cungDvt, null), "Que");
assert.equal(heSoHieuLuc(cungDvt[0], "Que"), 1);

// ĐVSD nhập một hệ số theo ĐVT; mọi mã hàng dùng cùng ĐVT nhận cùng tỷ lệ.
const heSoTheoDvt = { Cái: 1, Hộp: 20 };
const theoLuaChonDvsd = [
  { ma_hang: "D", dvt: "Hộp" },
  { ma_hang: "E", dvt: "Hộp" },
  { ma_hang: "F", dvt: "Cái" },
].map((m) => ({ ...m, he_so_quy_doi: heSoTheoDvt[m.dvt] }));
assert.equal(kiemTraQuyDoi(theoLuaChonDvsd, "Cái").hopLe, true);
assert.equal(tongPhanBoQuyDoi(
  theoLuaChonDvsd,
  { D: 1, E: 2, F: 10 },
  "Cái",
), 70);

// Q02 28/09/2026 — nhóm chỉ có MỘT mã hàng: tự điền ô mã hàng từ tổng mã quản
// lý, đã quy đổi đúng theo hệ số hiệu lực; giữ nguyên hành vi khi ≥2 mã hàng.
const motMaCungDvt = [{ ma_hang: "G", dvt: "Cái", he_so_quy_doi: 1 }];
assert.deepEqual(
  tuDienPhanBoMotMaHang(motMaCungDvt, "25", "Cái"),
  { ma_hang: "G", giaTri: "25" },
);

const motMaKhacDvt = [{ ma_hang: "H", dvt: "Hộp", he_so_quy_doi: 10 }];
assert.deepEqual(
  tuDienPhanBoMotMaHang(motMaKhacDvt, "250", "Cái"),
  { ma_hang: "H", giaTri: "25" },
);

// Tổng chưa hợp lệ (rỗng/0/âm) hoặc thiếu hệ số quy đổi -> trả ô trống, không
// để lại số cũ sai lệch.
assert.deepEqual(tuDienPhanBoMotMaHang(motMaCungDvt, "", "Cái"), { ma_hang: "G", giaTri: "" });
assert.deepEqual(tuDienPhanBoMotMaHang(motMaCungDvt, "0", "Cái"), { ma_hang: "G", giaTri: "" });
assert.deepEqual(
  tuDienPhanBoMotMaHang([{ ma_hang: "K", dvt: "Hộp", he_so_quy_doi: null }], "10", "Cái"),
  { ma_hang: "K", giaTri: "" },
);

// Nhóm ≥2 mã hàng: KHÔNG tự điền gì cả — giữ nguyên hành vi cũ, khoa tự chia.
assert.equal(tuDienPhanBoMotMaHang(items, "25", "Cái"), null);
assert.equal(tuDienPhanBoMotMaHang([], "25", "Cái"), null);

console.log("✓ Quy đổi và cộng lịch sử theo mã quản lý");
