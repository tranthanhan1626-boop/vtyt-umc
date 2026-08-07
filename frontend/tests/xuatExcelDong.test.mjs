import assert from "node:assert/strict";
import { dungBang, tenFileAnToan } from "../src/lib/xuatExcelDong.js";

const cot = [
  { key: "ma_hang", nhan: "Mã hàng" },
  { key: "ten", nhan: "Tên vật tư" },
  { key: "tong", nhan: "Tổng SL" },
];
const cotKhoa = [
  { key: "khoa::Khoa A", nhan: "Khoa A" },
  { key: "khoa::Khoa B", nhan: "Khoa B" },
];
const rows = [
  { ma_hang: "66159", ten: "Khẩu trang", tong: 4000, "khoa::Khoa A": 3000, "khoa::Khoa B": 1000 },
  { ma_hang: "74372", ten: "Khẩu trang 4 lớp", tong: 500, "khoa::Khoa B": 500 },
];

// --- Cột động: đủ cột chuẩn + cột khoa ------------------------------------
const bang = dungBang(cot, rows, cotKhoa);
assert.deepEqual(bang.headers, ["Mã hàng", "Tên vật tư", "Tổng SL", "Khoa A", "Khoa B"]);
assert.deepEqual(bang.rows[0], ["66159", "Khẩu trang", 4000, 3000, 1000]);
assert.equal(typeof bang.rows[0][2], "number", "số phải giữ kiểu SỐ để Excel cộng được");
assert.deepEqual(bang.rows[1], ["74372", "Khẩu trang 4 lớp", 500, "", 500],
  "khoa không đề xuất mã đó thì ô để TRỐNG, không phải 0 — 0 nghĩa là đề xuất 0");

// --- Ẩn cột thì Excel cũng mất cột đó -------------------------------------
const cotSauKhiAn = cot.filter((c) => c.key !== "ten");
const bangAn = dungBang(cotSauKhiAn, rows, cotKhoa);
assert.deepEqual(bangAn.headers, ["Mã hàng", "Tổng SL", "Khoa A", "Khoa B"]);
assert.deepEqual(bangAn.rows[0], ["66159", 4000, 3000, 1000]);
assert.ok(!bangAn.headers.includes("Tên vật tư"), "cột đã ẩn KHÔNG được xuất hiện trong Excel");

// --- Tắt chi tiết theo khoa thì không có cột khoa nào ---------------------
const bangKhongKhoa = dungBang(cot, rows, []);
assert.deepEqual(bangKhongKhoa.headers, ["Mã hàng", "Tên vật tư", "Tổng SL"]);
assert.equal(bangKhongKhoa.rows[0].length, 3);

// --- Tổng theo khoa phải khớp cột Tổng SL --------------------------------
const iA = bang.headers.indexOf("Khoa A");
const iB = bang.headers.indexOf("Khoa B");
const iTong = bang.headers.indexOf("Tổng SL");
bang.rows.forEach((r, i) => {
  const congKhoa = (Number(r[iA]) || 0) + (Number(r[iB]) || 0);
  assert.equal(congKhoa, r[iTong], `dòng ${i}: cộng các cột khoa phải bằng cột Tổng SL`);
});

// --- Tên file --------------------------------------------------------------
assert.equal(
  tenFileAnToan("Khoa Phẫu thuật hàm mặt răng hàm mặt"),
  "Khoa-Phau-thuat-ham-mat-rang-ham-mat",
);
assert.equal(tenFileAnToan("18T / Dùng chung"), "18T--Dung-chung");

console.log("xuatExcelDong: OK");
