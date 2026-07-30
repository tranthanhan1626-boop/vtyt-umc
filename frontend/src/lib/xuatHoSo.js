// A.3 — 5 file hồ sơ. KIẾN TRÚC 2 LỚP, đừng trộn:
//
//   LỚP 1 (file này, phần trên): GOM DỮ LIỆU — chọn dòng nào, gom nhóm gì.
//                                KHÔNG phụ thuộc mẫu giấy.
//   LỚP 2 (phần dưới):           DỰNG FILE — bố cục Word/Excel.
//
// 4/5 file CHƯA CÓ MẪU THẬT. Renderer nháp đóng dấu "BẢN NHÁP — CHƯA ĐÚNG MẪU"
// thật to ở đầu trang: dữ liệu đã đúng, chỉ bố cục là tạm. Có mẫu thật thì
// thay ĐÚNG hàm dựng tương ứng, KHÔNG đụng phần gom dữ liệu.
//
// Excel viết bằng SpreadsheetML 2003 (XML thuần) — Excel/LibreOffice mở được,
// không cần thêm thư viện nào. Word dùng docx (đã có sẵn cho phiếu đề nghị).

const CANH_BAO = "BẢN NHÁP — CHƯA ĐÚNG MẪU. Chờ biểu mẫu chính thức của bệnh viện.";

export const HO_SO = {
  chi_dinh_thau:  { ma: "chi_dinh_thau",  ten: "Đề xuất mua chỉ định thầu",        loai: "word",  coMau: true  },
  cam_ket_sl:     { ma: "cam_ket_sl",     ten: "Cam kết số lượng đề xuất thầu",    loai: "word",  coMau: false },
  danh_muc_dvsd:  { ma: "danh_muc_dvsd",  ten: "Danh mục đề xuất của đơn vị",      loai: "excel", coMau: false },
  de_nghi_mua:    { ma: "de_nghi_mua",    ten: "Đề nghị mua thầu",                 loai: "word",  coMau: false },
  tong_hop_thau:  { ma: "tong_hop_thau",  ten: "Danh mục tổng hợp đi thầu (PĐD)",  loai: "excel", coMau: false },
};

// ---------------------------------------------------------------- LỚP 1: DỮ LIỆU

const NHAN_MUA_SAM = {
  mua_sam_bo_sung: "Mua sắm bổ sung",
  chi_dinh_thau: "Chỉ định thầu",
  dau_thau_rong_rai: "Mua sắm rộng rãi",
};

/** Chuẩn hoá 1 dòng v_de_xuat_tong_hop thành dữ liệu hồ sơ — dùng chung cho CẢ 5 file. */
export function chuanHoaDong(r) {
  const ghiChu = r.ghi_chu || "";
  return {
    ma_hang: r.ma_hang,
    ten_vat_tu: r.ten_vat_tu || "",
    dvt: r.dvt || "",
    ma_quan_ly: r.ma_quan_ly || "",
    ten_quan_ly: r.ten_quan_ly || "",
    so_luong: Number(r.so_luong) || 0,
    goi: r.goi || "",
    phuong_thuc: NHAN_MUA_SAM[r.loai_mua_sam] || r.loai_mua_sam || "",
    ky: r.tu_thang ? `${r.tu_thang}/${r.tu_nam} – ${r.den_thang}/${r.den_nam}` : "",
    so_thang: r.so_thang_du_kien ?? "",
    don_vi: r.don_vi || "",
    trang_thai: r.trang_thai || "",
    // Giải trình chỉ định thầu được gắn nhãn lúc gửi (A.1c) — tách lại ở đây
    // để đưa vào đúng cột "căn cứ" của hồ sơ.
    can_cu_chi_dinh: ghiChu.includes("[CHỈ ĐỊNH THẦU]")
      ? ghiChu.split("[CHỈ ĐỊNH THẦU]")[1].split("\n")[0].trim() : "",
    ghi_chu: ghiChu.replace(/\[CHỈ ĐỊNH THẦU\][^\n]*\n?/, "").trim(),
  };
}

/** Gom dữ liệu cho 1 loại hồ sơ. rows = mảng v_de_xuat_tong_hop đã lọc sẵn. */
export function gomDuLieu(maHoSo, rows, meta = {}) {
  const dong = rows.map(chuanHoaDong);
  const chung = {
    tieu_de: HO_SO[maHoSo].ten,
    ngay: new Date().toLocaleDateString("vi-VN"),
    don_vi: meta.don_vi || [...new Set(dong.map((d) => d.don_vi))].join(", "),
    nguoi_lap: meta.nguoi_lap || "",
    canh_bao: HO_SO[maHoSo].coMau ? "" : CANH_BAO,
  };
  if (maHoSo === "chi_dinh_thau") {
    return { ...chung, dong: dong.filter((d) => d.phuong_thuc === "Chỉ định thầu") };
  }
  if (maHoSo === "tong_hop_thau") {
    // File 5 = tổng hợp từ file 2 + 3 (QĐ-14), gom theo GÓI THẦU rồi tới mã.
    const theoGoi = new Map();
    dong.forEach((d) => {
      const k = d.goi || "(chưa gán gói)";
      if (!theoGoi.has(k)) theoGoi.set(k, []);
      theoGoi.get(k).push(d);
    });
    return { ...chung, nhomTheoGoi: [...theoGoi.entries()], dong };
  }
  return { ...chung, dong };
}

// ---------------------------------------------------------------- LỚP 2: DỰNG FILE

const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function taiXuong(blob, ten) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = ten; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Excel SpreadsheetML 2003 — nhiều sheet, không cần thư viện ngoài. */
function dungExcel(sheets, tenFile) {
  const oSheet = (s) => `<Worksheet ss:Name="${esc(s.ten.slice(0, 31))}"><Table>${
    s.hang.map((h) => `<Row>${
      h.map((c) => {
        const so = typeof c === "number";
        return `<Cell><Data ss:Type="${so ? "Number" : "String"}">${esc(c)}</Data></Cell>`;
      }).join("")
    }</Row>`).join("")
  }</Table></Worksheet>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheets.map(oSheet).join("\n")}
</Workbook>`;
  taiXuong(new Blob(["﻿" + xml], { type: "application/vnd.ms-excel" }), tenFile);
}

async function dungWord(duLieu, cot, tenFile) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
          AlignmentType, WidthType } = await import("docx");
  const p = (t, o = {}) => new Paragraph({ children: [new TextRun({ text: t, ...o })], ...o });
  const o = [];
  if (duLieu.canh_bao) {
    o.push(p(duLieu.canh_bao, { bold: true, color: "C00000", size: 26,
                                alignment: AlignmentType.CENTER }));
    o.push(p(""));
  }
  o.push(p(duLieu.tieu_de.toUpperCase(), { bold: true, size: 30, alignment: AlignmentType.CENTER }));
  o.push(p(`Đơn vị: ${duLieu.don_vi}     Ngày lập: ${duLieu.ngay}`, { size: 22 }));
  o.push(p(""));
  const oCell = (t, b) => new TableCell({
    children: [p(String(t ?? ""), { bold: b, size: 20 })],
    width: { size: Math.floor(9000 / cot.length), type: WidthType.DXA },
  });
  o.push(new Table({
    rows: [
      new TableRow({ children: cot.map((c) => oCell(c.nhan, true)) }),
      ...duLieu.dong.map((d, i) =>
        new TableRow({ children: cot.map((c) => oCell(c.lay(d, i), false)) })),
    ],
    width: { size: 9000, type: WidthType.DXA },
  }));
  o.push(p(""));
  o.push(p(`Tổng cộng: ${duLieu.dong.length} mã hàng`, { size: 22, bold: true }));
  const doc = new Document({ sections: [{ children: o }] });
  taiXuong(await Packer.toBlob(doc), tenFile);
}

const COT_STT = { nhan: "STT", lay: (_d, i) => i + 1 };

/** Xuất 1 hồ sơ. rows = v_de_xuat_tong_hop đã lọc. */
export async function xuatHoSo(maHoSo, rows, meta = {}) {
  const d = gomDuLieu(maHoSo, rows, meta);
  const hau = new Date().toISOString().slice(0, 10);

  if (maHoSo === "chi_dinh_thau" || maHoSo === "de_nghi_mua") {
    return dungWord(d, [
      COT_STT,
      { nhan: "Tên vật tư", lay: (x) => x.ten_vat_tu },
      { nhan: "ĐVT", lay: (x) => x.dvt },
      { nhan: "Số lượng", lay: (x) => x.so_luong.toLocaleString("vi-VN") },
      { nhan: "Gói thầu", lay: (x) => x.goi },
      { nhan: "Kỳ sử dụng", lay: (x) => x.ky },
      { nhan: "Nội dung / căn cứ", lay: (x) => x.can_cu_chi_dinh || x.ghi_chu },
    ], `${maHoSo}-${hau}.docx`);
  }

  if (maHoSo === "cam_ket_sl") {
    return dungWord(d, [
      COT_STT,
      { nhan: "Mã hàng", lay: (x) => x.ma_hang },
      { nhan: "Tên vật tư", lay: (x) => x.ten_vat_tu },
      { nhan: "ĐVT", lay: (x) => x.dvt },
      { nhan: "SL cam kết", lay: (x) => x.so_luong.toLocaleString("vi-VN") },
      { nhan: "Kỳ sử dụng", lay: (x) => x.ky },
    ], `cam-ket-so-luong-${hau}.docx`);
  }

  if (maHoSo === "danh_muc_dvsd") {
    return dungExcel([{
      ten: "Danh mục đề xuất",
      hang: [
        [d.canh_bao || d.tieu_de],
        [`Đơn vị: ${d.don_vi}`, `Ngày lập: ${d.ngay}`],
        [],
        ["STT", "Mã hàng", "Tên vật tư", "ĐVT", "Mã quản lý", "Tên mã quản lý",
         "Số lượng", "Gói thầu", "Phương thức", "Kỳ sử dụng", "Số tháng", "Ghi chú"],
        ...d.dong.map((x, i) => [i + 1, x.ma_hang, x.ten_vat_tu, x.dvt, x.ma_quan_ly,
          x.ten_quan_ly, x.so_luong, x.goi, x.phuong_thuc, x.ky, x.so_thang,
          x.can_cu_chi_dinh || x.ghi_chu]),
      ],
    }], `danh-muc-de-xuat-${hau}.xls`);
  }

  if (maHoSo === "tong_hop_thau") {
    const sheets = [{
      ten: "Tổng hợp",
      hang: [
        [d.canh_bao || d.tieu_de],
        [`Ngày lập: ${d.ngay}`, `${d.dong.length} mã hàng`],
        [],
        ["STT", "Gói thầu", "Mã hàng", "Tên vật tư", "ĐVT", "Khoa đề xuất",
         "Số lượng", "Phương thức", "Kỳ sử dụng", "Trạng thái"],
        ...d.dong.map((x, i) => [i + 1, x.goi, x.ma_hang, x.ten_vat_tu, x.dvt,
          x.don_vi, x.so_luong, x.phuong_thuc, x.ky, x.trang_thai]),
      ],
    }];
    // Mỗi gói thầu 1 sheet riêng — Phòng Vật tư thường tách theo gói khi lập hồ sơ.
    d.nhomTheoGoi.forEach(([goi, ds]) => {
      sheets.push({
        ten: goi,
        hang: [
          [`Gói: ${goi}`, `${ds.length} mã`],
          [],
          ["STT", "Mã hàng", "Tên vật tư", "ĐVT", "Khoa", "Số lượng", "Kỳ sử dụng"],
          ...ds.map((x, i) => [i + 1, x.ma_hang, x.ten_vat_tu, x.dvt, x.don_vi,
            x.so_luong, x.ky]),
        ],
      });
    });
    return dungExcel(sheets, `tong-hop-di-thau-${hau}.xls`);
  }

  throw new Error(`Chưa có renderer cho hồ sơ ${maHoSo}`);
}
