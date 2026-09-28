import assert from "node:assert/strict";
import { giaTriKhongDoi } from "../src/lib/oKhongDoi.js";

// L19 28/09/2026 — không lưu khi giá trị không đổi (bấm vào ô rồi bấm ra
// từng làm khoa mất xác nhận; audit bs-t9:dot:203/66355). Lib này KHÔNG đụng
// mạng, không đụng React nên test bằng node ở đây, dùng chung cho cả hai màn
// (DanhMucDeXuatKhoa.jsx, TongHopPdd.jsx).

// ---- Ô CHỮ (laSo = false, mặc định) ---------------------------------------

// Không gõ gì, chỉ bấm vào rồi bấm ra: giá trị mới === giá trị hiệu lực cũ.
assert.equal(giaTriKhongDoi("Panadol 500mg", "Panadol 500mg"), true);

// Gõ thêm khoảng trắng đầu/cuối rồi bấm ra mà không đổi chữ vẫn phải coi là
// không đổi — người dùng chỉ vô tình bấm vào ô, không cố ý sửa.
assert.equal(giaTriKhongDoi("  Panadol 500mg  ", "Panadol 500mg"), true);
assert.equal(giaTriKhongDoi("Panadol 500mg", "  Panadol 500mg  "), true);

// Gõ thêm chữ thật sự: phải lưu.
assert.equal(giaTriKhongDoi("Panadol 500mg mới", "Panadol 500mg"), false);

// null/undefined coi như chuỗi rỗng khi so — ô đang trống, bấm vào bấm ra vẫn
// không đổi.
assert.equal(giaTriKhongDoi(null, undefined), true);
assert.equal(giaTriKhongDoi("", null), true);
assert.equal(giaTriKhongDoi("   ", ""), true);

// Xoá trắng một ô ĐANG CÓ chữ (kể cả ô có ghi đè) là thay đổi thật — QĐ giao
// việc: "Trường hợp người dùng cố ý xoá trắng ô có ghi đè → vẫn lưu như cũ."
assert.equal(giaTriKhongDoi("", "Panadol 500mg"), false);
assert.equal(giaTriKhongDoi("   ", "Panadol 500mg"), false);

// ---- Ô SỐ (laSo = true) ----------------------------------------------------

// Không đổi số.
assert.equal(giaTriKhongDoi("120", "120", true), true);
assert.equal(giaTriKhongDoi(120, 120, true), true);

// Gõ lại cùng số nhưng khác cách viết (khoảng trắng, số 0 đầu) vẫn là KHÔNG
// đổi khi so theo giá trị số, không phải so chuỗi.
assert.equal(giaTriKhongDoi(" 120 ", "120", true), true);
assert.equal(giaTriKhongDoi("120", 120, true), true);

// Đổi số thật: phải lưu.
assert.equal(giaTriKhongDoi("121", "120", true), false);

// Xoá trắng ô số đang có giá trị: thay đổi thật, phải lưu (không được coi
// "0" và "" là cùng một số).
assert.equal(giaTriKhongDoi("", "120", true), false);
assert.equal(giaTriKhongDoi("0", "120", true), false);

// Ô số đang trống, bấm vào bấm ra không gõ gì: không đổi.
assert.equal(giaTriKhongDoi("", "", true), true);
assert.equal(giaTriKhongDoi(null, undefined, true), true);

console.log("oKhongDoi.test.mjs: OK");
