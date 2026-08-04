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
import { xuatExcelTheoMau, xuatWordTheoMau } from "./xuatTheoMau.js";

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

/** Thứ tự hồ sơ: mã quản lý → mã hàng → thứ tự gửi trong cùng mã. */
export function sapXepDongHoSo(rows) {
  return [...rows].sort((a, b) =>
    (a.ma_quan_ly || "~~~~").localeCompare(b.ma_quan_ly || "~~~~", "vi")
    || (a.ma_hang || "").localeCompare(b.ma_hang || "", "vi")
    || (a.created_at || "").localeCompare(b.created_at || "")
    || Number(a.id || 0) - Number(b.id || 0)
  );
}

// ---------------------------------------------------------------- LỚP 2: DỰNG FILE

export function tenFileHoSo(maHoSo) {
  const hau = new Date().toISOString().slice(0, 10);
  return {
    chi_dinh_thau: `chi-dinh-thau-${hau}.docx`,
    cam_ket_sl: `ban-cam-ket-${hau}.docx`,
    danh_muc_dvsd: `danh-muc-de-xuat-${hau}.xlsx`,
    de_nghi_mua: `de-nghi-mua-thau-${hau}.docx`,
    tong_hop_thau: `tong-hop-di-thau-${hau}.xlsx`,
  }[maHoSo] || `ho-so-${hau}`;
}

/**
 * Dựng mô hình tài liệu có thể sửa trên web. Mô hình giữ nguyên từng đoạn Word
 * và từng ô Excel, kể cả các cột hiện chưa có dữ liệu từ hệ thống.
 */
export function taoBanThaoHoSo(maHoSo, rows, meta = {}, usage = {}) {
  const dong = sapXepDongHoSo(rows).map((r) => chuanHoaDong(r, usage));
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
        { dam: true, chu: (m.don_vi || "KHOA").toUpperCase() },
        { chu: `Số:          /ĐN-                                                   Ngày       tháng        năm ${new Date().getFullYear()}` },
        { canh: "giua", dam: true, co: 30, chu: "PHIẾU ĐỀ NGHỊ" },
        { canh: "giua", chu: "Về việc mua sắm vật tư y tế" },
        { dam: true, chu: "PHẦN I: NỘI DUNG" },
        { chu: "Nơi nhận:                                                                                                                                           TRƯỞNG KHOA" },
        { chu: "Phòng ĐD, KHTH (để xem xét)" },
        { chu: "Phòng VTTB (để thực hiện)" },
        { chu: `Lưu: ${m.don_vi || "Khoa"}.` },
        { dam: true, chu: "PHẦN II: Ý KIẾN" },
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
          "Số:",
          "ĐỀ XUẤT DANH MỤC, SỐ LƯỢNG, YÊU CẦU KỸ THUẬT GÓI THẦU CUNG CẤP VẬT TƯ Y TẾ NĂM 2026-2027 (VẬT TƯ DÙNG CHUNG)\n(Kèm Đề nghị số 190/ĐN-KCC Ngày 30/08/2025)",
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
          "BỆNH VIỆN ĐẠI HỌC Y DƯỢC THÀNH PHỐ HỒ CHÍ MINH",
          "PHÒNG ĐIỀU DƯỠNG",
          "DANH MỤC, SỐ LƯỢNG, YÊU CẦU KỸ THUẬT VẬT TƯ Y TẾ NĂM 2026-2027 (VẬT TƯ DÙNG CHUNG)\n(đính kèm Đề nghị số .../ĐN-ĐD ngày .../.../...)",
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
    return xuatWordTheoMau(maHoSo, banThao, tenFile);
  }
  return xuatExcelTheoMau(maHoSo, banThao, tenFile);
}

/** Xuất 1 hồ sơ. rows = v_de_xuat_tong_hop đã lọc; usage = lịch sử theo năm. */
export async function xuatHoSo(maHoSo, rows, meta = {}, usage = {}) {
  const banThao = taoBanThaoHoSo(maHoSo, rows, meta, usage);
  if (maHoSo === "chi_dinh_thau" && !banThao.bang?.rows?.length) {
    throw new Error("Không có mã hàng nào dùng phương thức Chỉ định thầu trong lựa chọn hiện tại.");
  }
  return xuatBanThaoHoSo(maHoSo, banThao);
}
