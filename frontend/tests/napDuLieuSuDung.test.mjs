import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { docWorksheetExport, kiemDichVaLamSach } from "../src/lib/napDuLieuSuDung.js";

// Đối chiếu với backend/app/ingest/validator.py chạy CÙNG file thật
// (database/so luong su dung full.xlsx) trong phiên 06/08/2026:
//   row_count_raw=141623, row_count_rejected=0, has_truncation_warning=false,
//   649 dòng mã hàng lạ (không biết known_ma_hang cụ thể lúc đó nên chỉ so
//   khớp cấu trúc, không so số 649 — known_ma_hang phụ thuộc trạng thái DB).

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile("../database/so luong su dung full.xlsx");
const rowsTho = docWorksheetExport(workbook);
assert.equal(rowsTho.length, 141623, "phải đọc đúng 141.623 dòng dữ liệu (không kể header)");

const ketQua = kiemDichVaLamSach(rowsTho, null);
assert.equal(ketQua.rowCountRaw, 141623);
assert.equal(ketQua.rowCountRejected, 0, "file thật không có dòng nào bị loại");
assert.equal(ketQua.hasTruncationWarning, false, "file full.xlsx không có dấu hiệu bị cắt");
assert.equal(ketQua.rowCountCommitted, 141623);

// Đối chứng nhanh 1 mã cụ thể đã biết chắc số liệu: 66431 / Khoa GMHS - Phòng
// mổ, 2024=103, 2025=76, 2026=38 (đã xác nhận qua Supabase sau khi nạp thật).
const dong66431 = ketQua.cleanRows.filter(
  (r) => r.ma_hang === "66431" && r.don_vi === "Khoa GMHS - Phòng mổ",
);
const theoNam = { 2024: 0, 2025: 0, 2026: 0 };
dong66431.forEach((r) => { theoNam[r.nam] = (theoNam[r.nam] || 0) + r.so_luong; });
assert.equal(theoNam[2024], 103);
assert.equal(theoNam[2025], 76);
assert.equal(theoNam[2026], 38);

console.log(`✓ Đọc + kiểm dịch ${ketQua.rowCountCommitted.toLocaleString("vi-VN")} dòng, khớp bản Python`);
console.log("✓ Mã 66431 / Khoa GMHS - Phòng mổ: 2024=103, 2025=76, 2026=38 — khớp dữ liệu đã nạp");
