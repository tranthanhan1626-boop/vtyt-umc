import assert from "node:assert/strict";
import {
  dvtChuanCuaNhom,
  gopLichSuTheoMaQuanLy,
  heSoHieuLuc,
  kiemTraQuyDoi,
  tongPhanBoQuyDoi,
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

console.log("✓ Quy đổi và cộng lịch sử theo mã quản lý");
