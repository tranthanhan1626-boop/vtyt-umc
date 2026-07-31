// A.3 — 5 file hồ sơ, dựng theo ĐÚNG khung cột của biểu mẫu thật
// (trích từ `Form biểu mẫu/`, xem `coCauBieuMau.js`).
//
// KIẾN TRÚC 2 LỚP, đừng trộn:
//   LỚP 1 (file này, phần trên): GOM DỮ LIỆU — chọn dòng nào, gom nhóm gì.
//   LỚP 2 (phần dưới):           DỰNG FILE  — bố cục Word/Excel.
//
// Cột nào hệ thống chưa có dữ liệu (`lay: null`) thì xuất ra Ô TRỐNG đúng vị
// trí để điền tay — KHÔNG bỏ cột, vì bỏ là sai bố cục mẫu.

import { CHI_DINH_THAU, DANH_MUC_DVSD, TONG_HOP_PDD, CAM_KET, DE_NGHI_MUA } from "./coCauBieuMau.js";

export const HO_SO = {
  chi_dinh_thau: { ma: "chi_dinh_thau", ten: "Đề xuất mua chỉ định thầu", loai: "word", ai: "dvsd" },
  cam_ket_sl:    { ma: "cam_ket_sl",    ten: "Bản cam kết số lượng",      loai: "word", ai: "dvsd" },
  danh_muc_dvsd: { ma: "danh_muc_dvsd", ten: "Danh mục đề xuất của đơn vị", loai: "excel", ai: "dvsd" },
  de_nghi_mua:   { ma: "de_nghi_mua",   ten: "Phiếu đề nghị mua thầu",    loai: "word", ai: "pdd" },
  tong_hop_thau: { ma: "tong_hop_thau", ten: "Danh mục tổng hợp đi thầu", loai: "excel", ai: "pdd" },
};

// ---------------------------------------------------------------- LỚP 1: DỮ LIỆU

const NHAN_MUA_SAM = {
  mua_sam_bo_sung: "Mua sắm bổ sung",
  chi_dinh_thau: "Chỉ định thầu",
  dau_thau_rong_rai: "Mua sắm rộng rãi",
};

/** 1 dòng v_de_xuat_tong_hop -> dữ liệu hồ sơ. `usage` = {ma_hang: {nam: tổng}}. */
export function chuanHoaDong(r, usage = {}) {
  const gc = r.ghi_chu || "";
  return {
    ma_hang: r.ma_hang, ten_vat_tu: r.ten_vat_tu || "", dvt: r.dvt || "",
    ma_quan_ly: r.ma_quan_ly || "", ten_quan_ly: r.ten_quan_ly || "",
    so_luong: Number(r.so_luong) || 0, goi: r.goi || "",
    phuong_thuc: NHAN_MUA_SAM[r.loai_mua_sam] || r.loai_mua_sam || "",
    ky: r.tu_thang ? `${r.tu_thang}/${r.tu_nam} – ${r.den_thang}/${r.den_nam}` : "",
    don_vi: r.don_vi || "", trang_thai: r.trang_thai || "",
    ten_thuong_mai: r.ten_thuong_mai || "", ky_ma_hieu: r.ky_ma_hieu || "",
    hang: r.hang || "", nuoc_san_xuat: r.nuoc_san_xuat || "",
    tieu_chi_ky_thuat: r.tieu_chi_ky_thuat || "",
    theoNam: usage[r.ma_hang] || {},
    // Giải trình chỉ định thầu được gắn nhãn lúc gửi (A.1c) — tách lại ở đây.
    can_cu_chi_dinh: gc.includes("[CHỈ ĐỊNH THẦU]")
      ? gc.split("[CHỈ ĐỊNH THẦU]")[1].split("\n")[0].trim() : "",
    ghi_chu: gc.replace(/\[CHỈ ĐỊNH THẦU\][^\n]*\n?/, "").trim(),
  };
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

/** Excel SpreadsheetML 2003 — mở được bằng Excel/LibreOffice, không cần thư viện. */
function dungExcel(sheets, tenFile) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheets.map((s) => `<Worksheet ss:Name="${esc(s.ten.slice(0, 31))}"><Table>${
  s.hang.map((h) => `<Row>${h.map((c) =>
    `<Cell><Data ss:Type="String">${esc(c)}</Data></Cell>`).join("")}</Row>`).join("")
}</Table></Worksheet>`).join("\n")}
</Workbook>`;
  taiXuong(new Blob(["﻿" + xml], { type: "application/vnd.ms-excel" }), tenFile);
}

/** Word từ danh sách đoạn văn (biểu mẫu dạng văn bản). */
async function dungWordVanBan(doan, bang, cot, tenFile) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
          AlignmentType, WidthType } = await import("docx");
  const CANH = { giua: AlignmentType.CENTER, phai: AlignmentType.RIGHT };
  const out = doan.map((p) => new Paragraph({
    alignment: CANH[p.canh] || AlignmentType.LEFT,
    children: [new TextRun({ text: p.chu, bold: !!p.dam, size: p.co || 24 })],
  }));
  if (bang?.length) {
    const w = Math.floor(14000 / cot.length);
    const o = (t, b) => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: String(t ?? ""), bold: b, size: 18 })] })],
      width: { size: w, type: WidthType.DXA },
    });
    out.push(new Paragraph({ children: [new TextRun("")] }));
    out.push(new Table({
      rows: [
        new TableRow({ children: cot.map((c) => o(c.ten, true)) }),
        ...bang.map((d, i) => new TableRow({
          children: cot.map((c) => o(c.lay ? c.lay(d, i) : "", false)) })),
      ],
      width: { size: 14000, type: WidthType.DXA },
    }));
  }
  const doc = new Document({
    sections: [{
      properties: { page: { size: { orientation: bang?.length ? "landscape" : "portrait" } } },
      children: out,
    }],
  });
  taiXuong(await Packer.toBlob(doc), tenFile);
}

/** Word từ nội dung đã được người dùng chỉnh trực tiếp trên web. */
async function dungWordDaChinhSua(banThao, tenFile) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
          AlignmentType, WidthType } = await import("docx");
  const CANH = { giua: AlignmentType.CENTER, phai: AlignmentType.RIGHT };
  const out = (banThao.doan || []).map((p) => new Paragraph({
    alignment: CANH[p.canh] || AlignmentType.LEFT,
    children: [new TextRun({ text: String(p.chu || ""), bold: !!p.dam, size: p.co || 24 })],
  }));
  const bang = banThao.bang;
  if (bang?.rows?.length || bang?.headers?.length) {
    const soCot = Math.max(1, bang.headers?.length || bang.rows?.[0]?.length || 1);
    const w = Math.floor(14000 / soCot);
    const o = (t, dam) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: String(t ?? ""), bold: dam, size: 18 })],
      })],
      width: { size: w, type: WidthType.DXA },
    });
    out.push(new Paragraph({ children: [new TextRun("")] }));
    out.push(new Table({
      rows: [
        new TableRow({ children: (bang.headers || []).map((c) => o(c, true)) }),
        ...(bang.rows || []).map((row) => new TableRow({
          children: row.map((c) => o(c, false)),
        })),
      ],
      width: { size: 14000, type: WidthType.DXA },
    }));
  }
  const doc = new Document({
    sections: [{
      properties: { page: { size: { orientation: bang ? "landscape" : "portrait" } } },
      children: out,
    }],
  });
  taiXuong(await Packer.toBlob(doc), tenFile);
}

/** Dựng 1 sheet Excel theo khung cột: 3 dòng tiêu đề + hàng cột + dữ liệu. */
function sheetTheoCot(tieuDe, cot, dong) {
  return {
    ten: "Danh muc",
    hang: [
      ["BỆNH VIỆN ĐẠI HỌC Y DƯỢC TP HỒ CHÍ MINH"],
      [tieuDe.donVi],
      [tieuDe.ten],
      [],
      cot.map((c) => c.ten),
      ...dong.map((d, i) => cot.map((c) => (c.lay ? String(c.lay(d, i) ?? "") : ""))),
    ],
  };
}

export function tenFileHoSo(maHoSo) {
  const hau = new Date().toISOString().slice(0, 10);
  return {
    chi_dinh_thau: `chi-dinh-thau-${hau}.docx`,
    cam_ket_sl: `ban-cam-ket-${hau}.docx`,
    danh_muc_dvsd: `danh-muc-de-xuat-${hau}.xls`,
    de_nghi_mua: `de-nghi-mua-thau-${hau}.docx`,
    tong_hop_thau: `tong-hop-di-thau-${hau}.xls`,
  }[maHoSo] || `ho-so-${hau}`;
}

/**
 * Dựng mô hình tài liệu có thể sửa trên web. Mô hình giữ nguyên từng đoạn Word
 * và từng ô Excel, kể cả các cột hiện chưa có dữ liệu từ hệ thống.
 */
export function taoBanThaoHoSo(maHoSo, rows, meta = {}, usage = {}) {
  const dong = rows.map((r) => chuanHoaDong(r, usage));
  const m = {
    ...meta,
    so_dong: dong.length,
    so_khoa: meta.so_khoa ?? new Set(dong.map((d) => d.don_vi).filter(Boolean)).size,
  };
  const nen = {
    phien_ban_cau_truc: 1,
    ma_ho_so: maHoSo,
    loai: HO_SO[maHoSo]?.loai,
  };

  if (maHoSo === "chi_dinh_thau") {
    const ds = dong.filter((d) => d.phuong_thuc === "Chỉ định thầu");
    return {
      ...nen,
      doan: [
        { chu: "BỆNH VIỆN ĐẠI HỌC Y DƯỢC TP HỒ CHÍ MINH" },
        { dam: true, chu: (m.don_vi || "").toUpperCase() },
        { chu: "Số:        /ĐN-" },
        { canh: "phai", chu: `Ngày ...... tháng ...... năm ${new Date().getFullYear()}` },
        { chu: "" },
        { canh: "giua", dam: true, co: 30, chu: "PHIẾU ĐỀ NGHỊ" },
        { canh: "giua", chu: "Về việc mua sắm vật tư y tế tiêu hao theo hình thức chỉ định thầu" },
        { chu: "" },
      ],
      bang: {
        headers: CHI_DINH_THAU.map((c) => c.ten),
        rows: ds.map((d, i) => CHI_DINH_THAU.map((c) => c.lay ? String(c.lay(d, i) ?? "") : "")),
      },
    };
  }

  if (maHoSo === "cam_ket_sl") return { ...nen, doan: CAM_KET(m) };
  if (maHoSo === "de_nghi_mua") return { ...nen, doan: DE_NGHI_MUA(m) };

  if (maHoSo === "danh_muc_dvsd") {
    return {
      ...nen,
      bang_tinh: {
        tieu_de: [
          "BỆNH VIỆN ĐẠI HỌC Y DƯỢC TP HỒ CHÍ MINH",
          (m.don_vi || "").toUpperCase(),
          "ĐỀ XUẤT DANH MỤC, SỐ LƯỢNG VẬT TƯ Y TẾ TIÊU HAO",
        ],
        headers: DANH_MUC_DVSD.map((c) => c.ten),
        rows: dong.map((d, i) => DANH_MUC_DVSD.map((c) => c.lay ? String(c.lay(d, i) ?? "") : "")),
      },
    };
  }

  if (maHoSo === "tong_hop_thau") {
    return {
      ...nen,
      bang_tinh: {
        tieu_de: [
          "BỆNH VIỆN ĐẠI HỌC Y DƯỢC TP HỒ CHÍ MINH",
          "PHÒNG ĐIỀU DƯỠNG",
          "DANH MỤC, SỐ LƯỢNG VẬT TƯ Y TẾ TIÊU HAO ĐỀ XUẤT MUA SẮM",
        ],
        headers: TONG_HOP_PDD.map((c) => c.ten),
        rows: dong.map((d, i) => TONG_HOP_PDD.map((c) => c.lay ? String(c.lay(d, i) ?? "") : "")),
      },
    };
  }

  throw new Error(`Chưa có mô hình chỉnh sửa cho hồ sơ ${maHoSo}`);
}

/** Xuất đúng nội dung đang thấy trong trình chỉnh sửa trực tuyến. */
export async function xuatBanThaoHoSo(maHoSo, banThao) {
  const tenFile = tenFileHoSo(maHoSo);
  if (HO_SO[maHoSo]?.loai === "word") {
    return dungWordDaChinhSua(banThao, tenFile);
  }
  const bang = banThao.bang_tinh || {};
  return dungExcel([{
    ten: "Danh muc",
    hang: [
      ...(bang.tieu_de || []).map((x) => [x]),
      [],
      bang.headers || [],
      ...(bang.rows || []),
    ],
  }], tenFile);
}

/** Xuất 1 hồ sơ. rows = v_de_xuat_tong_hop đã lọc; usage = lịch sử theo năm. */
export async function xuatHoSo(maHoSo, rows, meta = {}, usage = {}) {
  const banThao = taoBanThaoHoSo(maHoSo, rows, meta, usage);
  if (maHoSo === "chi_dinh_thau" && !banThao.bang?.rows?.length) {
    throw new Error("Không có mã hàng nào dùng phương thức Chỉ định thầu trong lựa chọn hiện tại.");
  }
  return xuatBanThaoHoSo(maHoSo, banThao);
}
