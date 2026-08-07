/*
 * Xuất Excel với SỐ CỘT ĐỘNG.
 *
 * Vì sao không dùng `xuatExcelTheoMau` (lib/xuatTheoMau.js): hàm đó đổ dữ liệu
 * vào file mẫu có sẵn với số cột CỐ ĐỊNH theo vị trí. Từ 07/08/2026 người dùng
 * chốt hai điều làm số cột thay đổi theo lúc xuất:
 *   - ẩn cột nào trên web thì Excel cũng không có cột đó;
 *   - Danh mục tổng hợp thêm MỖI KHOA MỘT CỘT (đúng như file mẫu bệnh viện
 *     vốn có 49 cột đánh số cho 49 khoa).
 * Đổ vào mẫu cố định rồi cắt/chèn cột sẽ phá merge của 4 dòng tiêu đề, nên ở
 * đây dựng workbook mới và tự kẻ lại phần đầu cho giống mẫu.
 *
 * Tách khỏi component để test được bằng node — phần dựng dữ liệu (`dungBang`)
 * thuần tuý, không đụng ExcelJS/DOM.
 */

/**
 * Dựng ma trận dữ liệu sẽ ghi ra Excel.
 *
 * @param {Array} cot   cột ĐANG HIỆN, dạng { key, nhan }
 * @param {Array} rows  dòng dữ liệu (object theo key cột)
 * @param {Array} cotKhoa  cột khoa động: [{ key, nhan }] — rỗng nếu tắt chi tiết
 * @returns {{ headers: string[], rows: (string|number)[][] }}
 */
export function dungBang(cot = [], rows = [], cotKhoa = []) {
  const tatCaCot = [...cot, ...cotKhoa];
  return {
    headers: tatCaCot.map((c) => c.nhan),
    rows: rows.map((r) => tatCaCot.map((c) => {
      const v = r[c.key];
      if (v == null || v === "") return "";
      // Giữ số là SỐ để Excel cộng/lọc được, chứ không đổi hết thành chuỗi.
      return typeof v === "number" ? v : String(v);
    })),
  };
}

/** Bỏ dấu tiếng Việt + ký tự lạ để đặt tên file tải về cho an toàn. */
export function tenFileAnToan(s) {
  return String(s)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/\s+/g, "-").replace(/[^\w.-]/g, "");
}

function taiXuong(blob, ten) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = ten;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Xuất một sheet với tiêu đề nhiều dòng + header + dữ liệu.
 *
 * @param {Object} o
 * @param {string[]} o.tieuDe   các dòng tiêu đề trên cùng (merge ngang)
 * @param {Array} o.cot         cột đang hiện [{ key, nhan, width }]
 * @param {Array} o.cotKhoa     cột khoa động [{ key, nhan, width }]
 * @param {Array} o.rows        dữ liệu
 * @param {string} o.tenFile
 * @param {string} [o.tenSheet]
 */
export async function xuatExcelDong({ tieuDe = [], cot = [], cotKhoa = [], rows = [], tenFile, tenSheet = "Danh mục" }) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();
  const ws = wb.addWorksheet(tenSheet, {
    views: [{ state: "frozen", xSplit: 0, ySplit: tieuDe.length + 1 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  const tatCaCot = [...cot, ...cotKhoa];
  const soCot = Math.max(tatCaCot.length, 1);

  ws.columns = tatCaCot.map((c) => ({
    // ExcelJS tính width theo ký tự, width trên web là pixel -> chia ~7.
    width: Math.min(Math.max(Math.round((c.width || 100) / 7), 8), 60),
  }));

  tieuDe.forEach((dong, i) => {
    const r = ws.getRow(i + 1);
    r.getCell(1).value = dong;
    r.getCell(1).font = { name: "Times New Roman", size: i === tieuDe.length - 1 ? 13 : 11, bold: i === tieuDe.length - 1 };
    r.getCell(1).alignment = { vertical: "middle", horizontal: i === tieuDe.length - 1 ? "center" : "left", wrapText: true };
    if (soCot > 1) ws.mergeCells(i + 1, 1, i + 1, soCot);
  });

  const dongHeader = tieuDe.length + 1;
  const header = ws.getRow(dongHeader);
  tatCaCot.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.nhan;
    cell.font = { name: "Times New Roman", size: 10, bold: true };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
    cell.border = {
      top: { style: "thin" }, left: { style: "thin" },
      bottom: { style: "thin" }, right: { style: "thin" },
    };
  });
  header.height = 46;

  const { rows: duLieu } = dungBang(cot, rows, cotKhoa);
  duLieu.forEach((giaTri, i) => {
    const r = ws.getRow(dongHeader + 1 + i);
    giaTri.forEach((v, j) => {
      const cell = r.getCell(j + 1);
      cell.value = v === "" ? null : v;
      cell.font = { name: "Times New Roman", size: 10 };
      cell.alignment = {
        vertical: "middle",
        horizontal: typeof v === "number" ? "right" : "left",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" },
      };
    });
    r.commit();
  });

  ws.autoFilter = {
    from: { row: dongHeader, column: 1 },
    to: { row: dongHeader + duLieu.length, column: soCot },
  };

  const buffer = await wb.xlsx.writeBuffer();
  taiXuong(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    tenFile
  );
}
