/*
 * Lấy TÊN CỘT ĐẦY ĐỦ từ chính file biểu mẫu bệnh viện, thay vì gõ lại trong
 * code.
 *
 * Vì sao: trên màn hình cột phải hẹp nên dùng tên ngắn ("SL 2022 (khoa)"),
 * nhưng file Excel trình ký phải mang đúng tên của biểu mẫu ("Số lượng đã sử
 * dụng năm 2022"). Trước đây bản xuất đổ dữ liệu vào file mẫu nên tên cột tự
 * đúng; từ khi chuyển sang dựng workbook mới (để ẩn cột / thêm cột khoa động)
 * thì tên bị lấy nhầm sang tên ngắn. Đọc ngược tên từ file mẫu vừa sửa được
 * lỗi đó, vừa để chủ dự án tự sửa tên cột trong file .xlsx mà không cần đụng
 * code.
 *
 * Cả hai file mẫu đều để header ở DÒNG 5 (đã đối chiếu bằng openpyxl).
 */

const DONG_HEADER = 5;

/**
 * Lấy chữ từ giá trị một ô ExcelJS.
 *
 * Ô trong biểu mẫu bệnh viện thường có định dạng HỖN HỢP (một phần in đậm,
 * một phần không) — ExcelJS trả về `{ richText: [{text}, ...] }` chứ không
 * phải chuỗi. `String(...)` trên object đó ra "[object Object]" và tên cột
 * trong file xuất sẽ hỏng (đã dính khi test). Cũng xử lý ô công thức
 * (`{ result }`) và ô có hyperlink (`{ text }`).
 */
export function docChuTrongO(giaTri) {
  if (giaTri == null) return "";
  if (typeof giaTri === "string") return giaTri.trim();
  if (typeof giaTri === "number" || typeof giaTri === "boolean") return String(giaTri);
  if (Array.isArray(giaTri.richText)) {
    return giaTri.richText.map((p) => p.text ?? "").join("").trim();
  }
  if (giaTri.result != null) return docChuTrongO(giaTri.result);
  if (giaTri.text != null) return docChuTrongO(giaTri.text);
  return "";
}

// Cache theo URL: một phiên làm việc mở/xuất nhiều lần, không cần tải lại
// file mẫu mỗi lần.
const boNho = new Map();

/**
 * @param {string} url đường dẫn file .xlsx trong public/form-bieu-mau
 * @returns {Promise<string[]>} tên cột theo thứ tự cột trong file mẫu
 */
export async function docTenCotTuMau(url) {
  if (boNho.has(url)) return boNho.get(url);
  const chay = (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Không tải được file mẫu ${url} (${res.status}).`);
    const { default: ExcelJS } = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await res.arrayBuffer());
    const ws = wb.worksheets[0];
    const ten = [];
    ws.getRow(DONG_HEADER).eachCell({ includeEmpty: true }, (cell, i) => {
      // Giữ nguyên xuống dòng trong tên (biểu mẫu dùng nhiều), chỉ bỏ khoảng
      // trắng thừa hai đầu — nhiều ô trong file mẫu có dấu cách đuôi.
      ten[i - 1] = docChuTrongO(cell.value);
    });
    return ten;
  })();
  boNho.set(url, chay);
  return chay;
}

/**
 * Gắn tên đầy đủ từ biểu mẫu vào danh sách cột sắp xuất.
 *
 * @param {Array} cot      cột đang hiện [{ key, nhan, nhanMau? }]
 * @param {Array} cotGoc   danh sách cột GỐC (COT_KHOA / COT_PDD) — thứ tự của
 *                         nó khớp 1-1 theo VỊ TRÍ với cột trong file mẫu
 * @param {string[]} tenMau kết quả docTenCotTuMau()
 * @returns {Array} cột đã thay `nhan` bằng tên biểu mẫu khi tra được
 */
export function ganTenMau(cot = [], cotGoc = [], tenMau = []) {
  const viTri = new Map(cotGoc.map((c, i) => [c.key, i]));
  return cot.map((c) => {
    const i = viTri.get(c.key);
    const tuMau = i != null ? tenMau[i] : null;
    // Ưu tiên: tên trong file mẫu > tên tự sinh cho cột động (nhanMau) > tên
    // ngắn trên màn hình. Cột động (sl_2026...) không có trong mẫu nên rơi
    // xuống nhanMau — đúng ý, vì mẫu không thể biết trước năm mới.
    return { ...c, nhan: tuMau || c.nhanMau || c.nhan };
  });
}
