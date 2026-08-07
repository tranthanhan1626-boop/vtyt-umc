// Cổng kiểm dịch + nạp file HIS "SỐ LƯỢNG SỬ DỤNG THEO THÁNG.xlsx" — chạy
// TRÊN TRÌNH DUYỆT, không qua backend riêng (xem patch_zc_nap_du_lieu_su_dung.sql
// cho lý do và quyền RLS cần có).
//
// ⚠️ ĐÂY LÀ BẢN DỊCH của backend/app/ingest/validator.py — sửa bên nào cũng
// PHẢI sửa bên kia theo, hai file không tự đồng bộ. Bản gốc Python vẫn là
// nguồn tham chiếu (dùng khi cần nạp bằng backend/scripts/ingest_cli.py cho
// file rất lớn hoặc khi trình duyệt không xử lý nổi).
//
// 3 mức xử lý (giữ nguyên từ bản gốc, đừng gộp chung):
//   1. LỖI CHẶN CẤP FILE  -> từ chối toàn bộ, không nạp gì (thiếu cột, sai sheet).
//   2. LỖI CHẶN CẤP DÒNG  -> dòng đó bị loại, các dòng khác vẫn nạp bình thường.
//   3. CẢNH BÁO MỀM       -> vẫn nạp, chỉ ghi lại để xem sau (mã hàng lạ...).
//   Riêng CẢNH BÁO CẮT DỮ LIỆU (Power BI export limit) không chặn nhưng bắt
//   buộc người nạp tick xác nhận đã biết trước khi ghi thật.

export const HIS_COLUMN_MAP = {
  "Đơn vị": "don_vi",
  "Kho xuất": "kho_xuat",
  "Mã quản lý": "ma_quan_ly",
  "Tên quản lý": "ten_quan_ly",
  "Mã hàng": "ma_hang",
  "Tên vật tư": "ten_vat_tu",
  "ĐVT": "dvt",
  "Ngày": "ngay",
  "Tháng": "thang_text",
  "Ngày - Year": "nam",
  "Số lượng": "so_luong",
};

const TRUNCATION_WARNING_SIGNATURES = [
  "exported data exceeded the allowed volume",
  "some data may have been omitted",
];
const JUNK_DON_VI_VALUES = new Set(["total", "chưa áp dụng bộ lọc nào"]);
const MIN_VALID_YEAR = 2015;
const MAX_VALID_YEAR = 2035;
const THANG_TEXT_RE = /Tháng\s*0*(\d{1,2})/;

export class FileLevelRejection extends Error {}

function chuanHoaMaHang(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return String(Math.trunc(value));
  const s = String(value).trim();
  return s === "" ? null : s;
}

function docThang(thangText) {
  if (thangText == null) return null;
  const m = THANG_TEXT_RE.exec(String(thangText));
  if (!m) return null;
  const t = Number(m[1]);
  return t >= 1 && t <= 12 ? t : null;
}

/**
 * Đọc worksheet "Export" từ workbook ExcelJS đã `load()`, trả mảng dòng thô
 * (key = tên cột nội bộ theo HIS_COLUMN_MAP), CHƯA kiểm dịch.
 */
export function docWorksheetExport(workbook) {
  const ws = workbook.getWorksheet("Export");
  if (!ws) {
    throw new FileLevelRejection("Không tìm thấy sheet 'Export' trong file đã chọn.");
  }

  const headerRow = ws.getRow(1);
  const headerNames = new Set();
  const idxToKey = {};
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const raw = String(cell.value ?? "").trim();
    headerNames.add(raw);
    if (HIS_COLUMN_MAP[raw]) idxToKey[colNumber] = HIS_COLUMN_MAP[raw];
  });

  const missing = Object.keys(HIS_COLUMN_MAP).filter((name) => !headerNames.has(name));
  if (missing.length) {
    throw new FileLevelRejection(
      `File thiếu ${missing.length} cột bắt buộc: ${missing.join(", ")}. `
      + "Kiểm tra lại cấu trúc file HIS hiện tại có đổi tên/thứ tự cột không.",
    );
  }

  const rows = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = idxToKey[colNumber];
      if (key) obj[key] = cell.value;
    });
    rows.push(obj);
  });
  return rows;
}

/**
 * Kiểm dịch + làm sạch — dịch nguyên logic validate_and_clean() bản Python.
 * @param rows          mảng dòng thô từ docWorksheetExport()
 * @param knownMaHang   Set mã hàng đã có trong danh mục vat_tu, hoặc null
 */
export function kiemDichVaLamSach(rows, knownMaHang) {
  const rowCountRaw = rows.length;

  const textBlob = rows.map((r) => String(r.don_vi ?? "").toLowerCase()).join(" ");
  const hasTruncationWarning = TRUNCATION_WARNING_SIGNATURES.some((sig) => textBlob.includes(sig));

  let rowCountJunkStripped = 0;
  const afterJunk = rows.filter((r) => {
    const donVi = r.don_vi;
    if (donVi == null || String(donVi).trim() === "") { rowCountJunkStripped += 1; return false; }
    const dv = String(donVi).trim().toLowerCase();
    if (JUNK_DON_VI_VALUES.has(dv)) { rowCountJunkStripped += 1; return false; }
    if (TRUNCATION_WARNING_SIGNATURES.some((sig) => dv.includes(sig))) { rowCountJunkStripped += 1; return false; }
    return true;
  });

  const rejectedRowsSample = [];
  function noteRejected(row, reason) {
    if (rejectedRowsSample.length < 50) {
      rejectedRowsSample.push({
        reason, don_vi: row.don_vi, ma_hang: row.ma_hang, nam: row.nam, thang_text: row.thang_text,
      });
    }
  }

  const cleanRows = [];
  let nMismatchThangNgay = 0;
  for (const r of afterJunk) {
    const maHang = chuanHoaMaHang(r.ma_hang);
    const thang = docThang(r.thang_text);
    const namNum = Number(r.nam);
    const soLuongNum = Number(r.so_luong);

    if (maHang == null) { noteRejected(r, "thiếu mã hàng"); continue; }
    if (thang == null) { noteRejected(r, "tháng không đọc được (khác định dạng 'Tháng NN')"); continue; }
    if (!Number.isFinite(namNum) || namNum < MIN_VALID_YEAR || namNum > MAX_VALID_YEAR) {
      noteRejected(r, `năm ngoài khoảng hợp lệ [${MIN_VALID_YEAR}, ${MAX_VALID_YEAR}]`); continue;
    }
    if (!Number.isFinite(soLuongNum)) { noteRejected(r, "số lượng không phải số"); continue; }
    if (soLuongNum < 0) { noteRejected(r, "số lượng âm"); continue; }
    if (r.don_vi == null || String(r.don_vi).trim() === "") { noteRejected(r, "thiếu đơn vị"); continue; }

    // Đối chiếu chéo tháng suy từ "Ngày" (nếu đọc được dạng ngày) với "Tháng" text.
    if (r.ngay instanceof Date && !Number.isNaN(r.ngay.getTime())) {
      if (r.ngay.getMonth() + 1 !== thang) nMismatchThangNgay += 1;
    }

    cleanRows.push({
      don_vi: String(r.don_vi).trim(),
      kho_xuat: r.kho_xuat == null ? "" : String(r.kho_xuat).trim(),
      ma_hang: maHang,
      nam: namNum,
      thang,
      so_luong: soLuongNum,
    });
  }

  const rowCountRejected = afterJunk.length - cleanRows.length;

  const warnings = [];
  if (knownMaHang) {
    const laSet = new Set();
    for (const r of cleanRows) if (!knownMaHang.has(r.ma_hang)) laSet.add(r.ma_hang);
    if (laSet.size) {
      const vidu = [...laSet].slice(0, 10);
      const nLa = cleanRows.filter((r) => laSet.has(r.ma_hang)).length;
      warnings.push(
        `${nLa} dòng có mã hàng chưa có trong danh mục vat_tu (ví dụ: ${vidu.join(", ")}). `
        + "Vẫn nạp, nhưng cần bổ sung vào danh mục để không mất theo dõi nhóm kỹ thuật.",
      );
    }
  }
  if (nMismatchThangNgay > 0) {
    warnings.push(
      `${nMismatchThangNgay} dòng có cột 'Ngày' và cột 'Tháng' lệch nhau — `
      + "đã ưu tiên dùng cột 'Tháng' text, nhưng nên kiểm tra lại nguồn HIS.",
    );
  }
  if (hasTruncationWarning) {
    warnings.unshift(
      "⚠️ PHÁT HIỆN DẤU HIỆU FILE BỊ POWER BI CẮT BỚT DỮ LIỆU khi export "
      + "(dòng cảnh báo 'exported data exceeded the allowed volume'). Dữ liệu "
      + "trong file này CÓ THỂ KHÔNG ĐẦY ĐỦ. Cần xác nhận đã biết trước khi nạp.",
    );
  }

  return {
    cleanRows,
    rowCountRaw,
    rowCountJunkStripped,
    rowCountRejected,
    rowCountCommitted: cleanRows.length,
    hasTruncationWarning,
    warnings,
    rejectedRowsSample,
  };
}
