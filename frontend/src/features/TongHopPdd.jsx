import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Unlock, RefreshCw, Download, ChevronLeft, ChevronRight, ChevronDown, History, Users, EyeOff, AlertTriangle, AlignLeft, Columns3 } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";
import { tinhTuyChonMuaThem30 } from "../lib/tuyChonMuaThem";
import {
  COT_PDD, NHOM_COT_PDD, GOI_ID_MAP, sapXepFreezeTruoc, tinhLeftFreeze,
  tinhSegmentsGroup, taoCotLichSu, thayCotLichSu, suyRaNamCoDuLieu,
  taoCotLichSuNhom, chenCotLichSuNhom, cotKhoaSangPdd,
} from "../lib/cotChuan";
import { docTenCotTuMau, ganTenMau } from "../lib/tenCotBieuMau";
import { taiLichSuTheoThang, gomTheoThang } from "../lib/lichSuSuDung";
import { taiDotIdCuaGoi, locTheoDot } from "../lib/dotBoSung";
import { StyleTable, StyleToolbar, formatCell, DauVetSuaCuoi } from "./DanhMucDeXuatKhoa";
import { xuatExcelDong, tenFileAnToan } from "../lib/xuatExcelDong";
import { daiP50P75, doDaiKyMacDinh } from "../lib/congThucSoLuong";
import {
  useDuLieuThau, ThanhGiaiDoanThau, OThauCuaDong, HopNhapRot, HopDoSangMa,
} from "./CumThauTongHop";

/*
 * TongHopPdd — Excel Tổng hợp Danh mục đề xuất cấp PĐD.
 *
 * Cấu trúc cột y chang file mẫu bệnh viện "Tổng hợp danh mục đề xuất chuẩn
 * pdd.xlsx" (30 cột data), NHƯNG bỏ 49 cột đánh số 1-49 tĩnh. Thay bằng cơ
 * chế "expand row" — mỗi mã hàng có thể sổ xuống thấy danh sách khoa CÓ đề
 * xuất mã đó với số lượng chi tiết, cùng tổng.
 *
 * DỮ LIỆU 06/08/2026:
 *   1. Phần ĐỌC gốc (số lịch sử, SL hiện hành) — nối phan_bo_khoa + vat_tu +
 *      nhom_ky_thuat + usage_history_current.
 *   2. Phần SỬA/KHOÁ — nối THẬT tiếp, dùng patch_zd_danh_muc_tong_hop_o.sql:
 *      bảng `danh_muc_tong_hop_o` (giá trị đã PĐD ghi đè), audit append-only
 *      qua trigger (`danh_muc_tong_hop_o_audit`), khoá cột/dòng
 *      (`danh_muc_tong_hop_khoa`). Sửa 1 ô = upsert; server tự chặn nếu cột
 *      hoặc dòng đang khoá (trigger fn_chan_o_da_lock, báo lỗi rõ ràng).
 *
 *   Cột `sl_de_xuat_2627` là SUM từ `phan_bo_khoa`. Khi PĐD sửa tổng, RPC chia
 *   theo tỷ lệ số gốc; bảng con cho phép chỉnh tay và giữ tổng khớp tuyệt đối.
 *
 * Một số cột KHÔNG CÓ NGUỒN DỮ LIỆU THẬT trong schema hiện tại (mã HIS cũ,
 * Thông tư 04, mã kỹ thuật...) — để trống thay vì bịa, xem NGUON_KHONG_CO.
 */

// Cột trong COT_PDD chưa có nguồn dữ liệu thật trong schema hiện tại — để
// trống, KHÔNG bịa số. Vẫn có thể là cột PĐD tự gõ tay (vd phan_nhom_tt14) —
// việc đó vẫn đi qua cơ chế sửa ô + audit như mọi cột editable khác.
const NGUON_KHONG_CO = new Set([
  "co_dinh_276", "his_1599", "his_957", "ma_kt",
  "ma_tt04", "ten_tt04", "phan_nhom_tt14", "quy_cach",
]);

// (Trước 07/08/2026 ở đây có COT_CO_THE_SUA giới hạn theo cờ `readonly` của
// COT_PDD — chỉ 11/26 cột sửa và khoá được. Đã bỏ: chủ dự án chốt PĐD sửa
// được MỌI ô trên bản tổng hợp, kể cả cột lịch sử HIS và cột công thức, đổi
// lại ô sửa đè bị đánh dấu rõ + có audit theo ô. Xem `oCoTheSua`.)

const NAM_DE_XUAT = new Date().getFullYear() + 1;

// CHẾ ĐỘ GÕ RỚT (miếng 1d của bản MỘT MẶT BÀN, làm 24/08/2026).
//
// Vấn đề: cụm cột thầu (Q · R1 · R2 · R3 · Trúng · Đã chia · Xử lý rớt) bám đuôi
// bảng, tức nằm sau 30 cột chuẩn bệnh viện. PĐD phải cuộn ngang rất xa mới tới
// — phản hồi của chủ dự án 24/08: "tối ưu click, dễ dàng thao tác".
//
// Chế độ này chỉ là MỘT LĂNG KÍNH XEM: nó KHÔNG đụng `cotAn` (cấu hình ẩn cột
// lưu ở server) và KHÔNG đổi file Excel xuất ra. Luật "ẩn cột trên web thì Excel
// cũng không có cột đó" vẫn chỉ áp cho menu "Cột hiển thị".
// Bỏ cả `ma_nhom` — mã quản lý đã hiện sẵn trong hộp "Đổ sang mã tương đương",
// giữ trên bảng chỉ tốn 160px mà cụm cột thầu thì hụt chỗ.
// Bỏ luôn `his_1599`: cột đó nằm trong NGUON_KHONG_CO, chưa có nguồn dữ liệu
// nên luôn trống — giữ 100px cho một cột rỗng là phí đúng chỗ đang thiếu.
const COT_CHE_DO_GO_ROT = new Set([
  "stt", "ten_vt_2627", "dvt", "sl_de_xuat_2627", "dai_p50_p75",
]);

function monthId(nam, thang) { return nam * 12 + thang - 1; }

// Tổng số lượng trong khoảng [dau, cuoi] (month-id, inclusive) từ lịch sử đã
// gộp theo tháng {monthId: soLuong}.
function tongKhoang(theoThang, dau, cuoi) {
  let s = 0;
  for (let m = dau; m <= cuoi; m += 1) s += theoThang.get(m) || 0;
  return s;
}

function epGiaTri(giaTriText, kieu) {
  if (giaTriText == null) return null;
  if (kieu === "num") {
    const n = Number(giaTriText);
    return Number.isFinite(n) ? n : null;
  }
  return giaTriText;
}

/** Tải dữ liệu GỐC (chưa áp override PĐD) cho 1 gói con: proposals + vat_tu +
 * nhom_ky_thuat + usage_history_current, ráp thành đúng shape COT_PDD. */
async function taiDuLieuGoc(goiId, dotId = null) {
  const bo = GOI_ID_MAP[goiId] || GOI_ID_MAP["18t-dung-chung"];
  let dotGoiId = null;
  if (dotId) {
    const { data: dg, error: loiDotGoi } = await supabase.from("dot_goi")
      .select("id").eq("dot_id", Number(dotId)).eq("goi_id", goiId).maybeSingle();
    if (loiDotGoi) throw loiDotGoi;
    dotGoiId = dg?.id || null;
  }

  // Gói bổ sung: 3 đợt T1/T5/T9 chỉ khác nhau ở dot_de_xuat.thang_moc, không
  // khác ở cột `goi` — không lọc thêm thì cả 3 đợt ra cùng một rổ (patch_zt).
  const dsDotId = await taiDotIdCuaGoi(bo);
  let qProposals;
  let laPhanBoV3 = false;
  if (dotGoiId) {
    laPhanBoV3 = true;
    qProposals = supabase.from("phan_bo_khoa")
      .select("ma_hang, khoa, so_luong_hien_hanh, so_luong_goc, sua_boi_khoa")
      .eq("dot_goi_id", dotGoiId);
  } else {
    qProposals = supabase.from("proposals")
      .select("ma_hang, don_vi, so_luong")
      .eq("nam_de_xuat", NAM_DE_XUAT)
      .eq("is_current", true)
      .eq("loai_mua_sam", bo.loai_mua_sam);
    if (bo.goi) qProposals = qProposals.eq("goi", bo.goi);
    qProposals = dotId ? qProposals.eq("dot_id", Number(dotId)) : locTheoDot(qProposals, dsDotId);
  }
  const { data: propRows, error: loiProposals } = await fetchAllRows((f, t) =>
    qProposals.range(f, t), { order: "id" });
  if (loiProposals) throw loiProposals;

  const theoMa = new Map();
  // Dòng nguồn đã được khoa xử lý sau rớt 1 phần được RPC giảm về 0. Nó chỉ
  // còn là audit ở Tiến độ gói thầu, không được tiếp tục xuất hiện trong danh
  // mục tổng hợp PĐD hay làm tổng số giả.
  (propRows || []).filter((r) => Number(laPhanBoV3 ? r.so_luong_hien_hanh : r.so_luong) > 0).forEach((r) => {
    if (!theoMa.has(r.ma_hang)) theoMa.set(r.ma_hang, []);
    theoMa.get(r.ma_hang).push({
      don_vi: laPhanBoV3 ? r.khoa : r.don_vi,
      so_luong: Number(laPhanBoV3 ? r.so_luong_hien_hanh : r.so_luong) || 0,
      so_luong_goc: Number(laPhanBoV3 ? r.so_luong_goc : r.so_luong) || 0,
      // V2: khoa sửa được số của mình, nên tổng ở đây có thể đã đổi sau lần
      // PĐD chia gần nhất. Cờ do trigger `trg_phan_bo_danh_dau_ai_sua` đặt
      // ngay tại nguồn — không đoán từ email người sửa.
      suaBoiKhoa: laPhanBoV3 ? !!r.sua_boi_khoa : false,
    });
  });
  const dsMaHang = [...theoMa.keys()];
  if (dsMaHang.length === 0) return { bo, rows: [] };

  const { data: vatTuRows, error: loiVatTu } = await fetchAllRows((f, t) =>
    supabase.from("vat_tu")
      .select("ma_hang, ten_vat_tu, dvt, ma_quan_ly, tieu_chi_ky_thuat, ten_thuong_mai, ky_ma_hieu, hang, nuoc_san_xuat")
      .in("ma_hang", dsMaHang).range(f, t), { order: "ma_hang" });
  if (loiVatTu) throw loiVatTu;
  const vatTuTheoMa = new Map((vatTuRows || []).map((v) => [v.ma_hang, v]));

  const dsMaQuanLy = [...new Set((vatTuRows || []).map((v) => v.ma_quan_ly).filter(Boolean))];

  // Ba truy vấn này KHÔNG phụ thuộc nhau — trước đây chạy tuần tự nên cộng đủ
  // 3 lượt chờ mạng. Lịch sử là truy vấn nặng nhất nên để nó chạy song song
  // với 2 cái kia là bớt được gần trọn thời gian của chúng.
  const [nhomRes, usageRes, nhomNamRes] = await Promise.all([
    dsMaQuanLy.length
      ? fetchAllRows((f, t) => supabase.from("nhom_ky_thuat")
          .select("ma_quan_ly, ten_quan_ly").in("ma_quan_ly", dsMaQuanLy).range(f, t), { order: "ma_quan_ly" })
      : Promise.resolve({ data: [] }),
    // Gộp toàn viện sẵn ở DB (patch_zr) — ít hơn ~3 lần số dòng so với đọc
    // v_usage_monthly rồi tự cộng. Màn này không dùng cột don_vi.
    taiLichSuTheoThang(dsMaHang),
    // Lịch sử tổng CẢ NHÓM mã quản lý (mã tương đương thay thế nhau qua các kỳ
    // hợp đồng) — xem lý do đầy đủ trong patch_zp. Thiếu view (chưa chạy patch)
    // thì bỏ trống khối cột chứ không làm hỏng cả màn hình.
    dsMaQuanLy.length
      ? fetchAllRows((f, t) => supabase.from("v_lich_su_nhom_nam")
          .select("ma_quan_ly, nam, so_luong, so_ma_co_phat_sinh")
          .in("ma_quan_ly", dsMaQuanLy).range(f, t), { order: ["ma_quan_ly", "nam"] })
      : Promise.resolve({ data: [] }),
  ]);

  const tenNhomTheoMa = new Map((nhomRes.data || []).map((n) => [n.ma_quan_ly, n.ten_quan_ly]));

  if (usageRes.error) throw usageRes.error;
  const usageRows = usageRes.data;
  const usageTheoMa = gomTheoThang(usageRows, monthId);
  const dsNamCoDuLieu = suyRaNamCoDuLieu(usageRows);
  // Dải P50–P75 ở màn này tính trên lịch sử TOÀN VIỆN của mã (chốt 19/08/2026)
  // — `taiLichSuTheoThang` đã gộp sẵn toàn viện ở DB, không lọc theo khoa.
  const namCuoiTH = dsNamCoDuLieu[dsNamCoDuLieu.length - 1];
  const thangCuoiHIS = namCuoiTH ? monthId(namCuoiTH.nam, namCuoiTH.thangCuoi) : null;
  const soThangKy = doDaiKyMacDinh(bo.loai_mua_sam);

  const nhomNamTheoMa = new Map();
  (nhomNamRes.data || []).forEach((r) => {
    if (!nhomNamTheoMa.has(r.ma_quan_ly)) nhomNamTheoMa.set(r.ma_quan_ly, new Map());
    nhomNamTheoMa.get(r.ma_quan_ly).set(Number(r.nam), Number(r.so_luong) || 0);
  });

  const namNay = new Date().getFullYear();
  const rows = dsMaHang.map((maHang, idx) => {
    const vt = vatTuTheoMa.get(maHang) || {};
    const theoThang = usageTheoMa.get(maHang) || new Map();
    const tongNam = (nam) => tongKhoang(theoThang, monthId(nam, 1), monthId(nam, 12));
    // "Theo 18T/20XX" = tổng thực tế 18 tháng KẾT THÚC cuối năm đó — mốc so
    // sánh lịch sử, không phải dự báo. Ví dụ 2025: 07/2024 -> 12/2025.
    const theo18t = (nam) => tongKhoang(theoThang, monthId(nam - 1, 7), monthId(nam, 12));

    const khoaDeXuat = (theoMa.get(maHang) || [])
      .sort((a, b) => b.so_luong - a.so_luong);
    const slDeXuat = khoaDeXuat.reduce((s, k) => s + k.so_luong, 0);
    const thucTe18tGanNhat = theo18t(namNay);

    const row = {
      stt: idx + 1,
      ma_nhom: vt.ma_quan_ly || null,
      ten_nhom_ql: vt.ma_quan_ly ? (tenNhomTheoMa.get(vt.ma_quan_ly) || null) : null,
      ten_vt_2627: vt.ten_vat_tu || maHang,
      tskt_2627: vt.tieu_chi_ky_thuat || null,
      dvt: vt.dvt || null,
      // Cột năm sinh động theo dữ liệu thật (xem cotChuan.js) — không đóng
      // đinh 2019..2025 nữa, nếu không năm mới sẽ rơi mất khỏi bản tổng hợp.
      ...Object.fromEntries(dsNamCoDuLieu.map(({ nam, thangCuoi }) => [
        `sl_${nam}`,
        tongKhoang(theoThang, monthId(nam, 1), monthId(nam, thangCuoi)) || null,
      ])),
      ...Object.fromEntries(dsNamCoDuLieu.map(({ nam }) => [
        `sl_nhom_${nam}`,
        (vt.ma_quan_ly ? nhomNamTheoMa.get(vt.ma_quan_ly)?.get(nam) : null) || null,
      ])),
      theo_18t_2024: theo18t(2024) || null,
      theo_18t_2025: theo18t(2025) || null,
      sl_de_xuat_2627: slDeXuat,
      ...(() => {
        const d = daiP50P75(theoThang, soThangKy, slDeXuat, thangCuoiHIS);
        return { _daiTu: d?.tu ?? null, _daiDen: d?.den ?? null };
      })(),
      mua_them_30: tinhTuyChonMuaThem30(slDeXuat),
      giai_trinh: thucTe18tGanNhat > 0
        ? `Tổng đề xuất ${fmt(slDeXuat)} (18 tháng) / tổng sử dụng ${fmt(thucTe18tGanNhat)} `
          + `(18 tháng gần nhất) (${Math.round((slDeXuat / thucTe18tGanNhat) * 100)}%)`
        : `Tổng đề xuất ${fmt(slDeXuat)} (18 tháng) — chưa có đủ lịch sử sử dụng để so sánh.`,
      ten_tm_2627: vt.ten_thuong_mai || null,
      ma_sp: vt.ky_ma_hieu || null,
      hang_sx: vt.hang || null,
      nuoc_sx: vt.nuoc_san_xuat || null,
      ma_hang: maHang,
      khoaDeXuat: khoaDeXuat.map((k) => ({
        khoaMa: k.don_vi, khoaTen: k.don_vi, soLuong: k.so_luong,
        soLuongGoc: k.so_luong_goc, suaBoiKhoa: k.suaBoiKhoa,
      })),
      khoaTuSuaSo: khoaDeXuat.filter((k) => k.suaBoiKhoa).map((k) => k.don_vi),
      tongToanVien: slDeXuat,
    };
    NGUON_KHONG_CO.forEach((k) => { row[k] = null; });
    return row;
  });

  rows.sort((a, b) =>
    (a.ma_nhom || "zzz").localeCompare(b.ma_nhom || "zzz", "vi")
    || a.ten_vt_2627.localeCompare(b.ten_vt_2627, "vi"));
  rows.forEach((r, i) => { r.stt = i + 1; });

  return { bo, rows, dsNamCoDuLieu, dotGoiId };
}

/** Tải ô đã PĐD sửa (ghi đè) + trạng thái khoá cột/dòng cho đúng gói+năm. */
async function taiOverrideVaKhoa(goiId, namDeXuat) {
  // `goi_id` của bản khoa KHÔNG mang hậu tố ':dot:N' như bản tổng hợp.
  const goiIdKhoa = String(goiId).split(":dot:")[0];
  // patch_zzzzw — `danh_muc_khoa_o` giờ neo theo `dot_goi_id`. Hàm này chạy
  // song song với `taiDuLieuGoc` nên chưa có sẵn dotGoiId, phải tự tra lấy.
  // Tra từ chính hậu tố ':dot:N' của goiId bản tổng hợp.
  const dotIdTuGoi = String(goiId).includes(":dot:")
    ? Number(String(goiId).split(":dot:")[1]) : null;
  let dotGoiIdKhoa = null;
  if (dotIdTuGoi) {
    const { data: dg } = await supabase.from("dot_goi")
      .select("id").eq("dot_id", dotIdTuGoi).eq("goi_id", goiIdKhoa).maybeSingle();
    dotGoiIdKhoa = dg?.id || null;
  }
  const [{ data: oRows, error: loiO }, { data: khoaRows, error: loiKhoa },
    { data: oKhoaRows, error: loiOKhoa }] = await Promise.all([
    // `updated_by` + `updated_at` (20/08/2026): hai cột này đã có sẵn trong
    // bảng từ patch_zd, chỉ là trước giờ màn này không đọc. Phải đọc vì luật
    // "ai sửa sau đè" cho phép KHOA đè lên giá trị PĐD vừa duyệt — không có
    // hai cột này thì trên bảng, ô khoa vừa đổi và ô PĐD tự gõ trông y hệt
    // nhau. Không thêm cột, không đổi schema.
    fetchAllRows((f, t) => supabase.from("danh_muc_tong_hop_o")
      .select("ma_hang, cot, gia_tri, updated_by, updated_at")
      .eq("goi_id", goiId).eq("nam_de_xuat", namDeXuat).range(f, t), { order: "id" }),
    fetchAllRows((f, t) => supabase.from("danh_muc_tong_hop_khoa")
      .select("loai, khoa_key")
      .eq("goi_id", goiId).eq("nam_de_xuat", namDeXuat).range(f, t), { order: "id" }),
    // Ô do KHOA tự sửa. Trước 19/08/2026 màn này không hề đọc bảng đó, nên
    // PĐD mở Tổng hợp ra chỉ thấy giá trị gốc từ `vat_tu` — khoa gõ TSKT cả
    // buổi mà PĐD không thấy, rồi PĐD sửa đè, công của khoa mất im lặng.
    dotGoiIdKhoa
      ? fetchAllRows((f, t) => supabase.from("danh_muc_khoa_o")
        .select("khoa, ma_hang, gia_tri")
        .eq("dot_goi_id", dotGoiIdKhoa).range(f, t), { order: "id" })
      : Promise.resolve({ data: [] }),
  ]);
  if (loiO) throw loiO;
  if (loiKhoa) throw loiKhoa;

  const overrideTheoMa = new Map();
  // Dấu vết ai sửa cuối, tách RIÊNG khỏi `overrideTheoMa`. Vì sao không nhét
  // chung vào một map: `overrideTheoMa` được `apOverride` đọc để ĐẶT THẲNG giá
  // trị vào ô, và `oBiSuaDe`/`khoiPhucOGoc` cũng dựa vào nó — đổi kiểu phần tử
  // từ giá trị sang object là phải sờ vào cả ba chỗ đó, đúng loại thay đổi dễ
  // sót nhất. Map thứ hai cùng khoá (mã hàng -> cột) thì không đụng gì.
  const veSuaCuoiTheoMa = new Map();
  (oRows || []).forEach((r) => {
    if (!overrideTheoMa.has(r.ma_hang)) overrideTheoMa.set(r.ma_hang, new Map());
    overrideTheoMa.get(r.ma_hang).set(r.cot, r.gia_tri);
    if (!veSuaCuoiTheoMa.has(r.ma_hang)) veSuaCuoiTheoMa.set(r.ma_hang, new Map());
    veSuaCuoiTheoMa.get(r.ma_hang).set(r.cot,
      { updated_by: r.updated_by, updated_at: r.updated_at });
  });
  const cotLocked = new Set((khoaRows || []).filter((k) => k.loai === "cot").map((k) => k.khoa_key));
  const dongLocked = new Set((khoaRows || []).filter((k) => k.loai === "dong").map((k) => k.khoa_key));
  // loai='an_cot' (patch_zk) — ẩn cột, dùng chung cho mọi người và ảnh hưởng
  // cả file Excel xuất ra, nên phải lưu server chứ không để state cục bộ.
  const cotAn = new Set((khoaRows || []).filter((k) => k.loai === "an_cot").map((k) => k.khoa_key));

  // Gom ô khoa đã sửa theo (mã hàng -> cột PĐD -> [{khoa, giaTri}]).
  // Khoá cột hai bên đặt tên khác nhau, nên quy về tên bên PĐD ngay tại đây
  // bằng `cotKhoaSangPdd` — cùng bảng tra mà trigger `cot_pdd_sang_khoa` dùng
  // ở chiều ngược lại.
  const oKhoaTheoMa = new Map();
  (oKhoaRows || []).forEach((r) => {
    const giaTri = r.gia_tri || {};
    Object.entries(giaTri).forEach(([cotKhoa, v]) => {
      if (v === null || v === undefined || String(v).trim() === "") return;
      const cotPdd = cotKhoaSangPdd(cotKhoa);
      if (!oKhoaTheoMa.has(r.ma_hang)) oKhoaTheoMa.set(r.ma_hang, new Map());
      const cua = oKhoaTheoMa.get(r.ma_hang);
      if (!cua.has(cotPdd)) cua.set(cotPdd, []);
      cua.get(cotPdd).push({ khoa: r.khoa, giaTri: String(v) });
    });
  });

  return { overrideTheoMa, veSuaCuoiTheoMa, cotLocked, dongLocked, cotAn, oKhoaTheoMa };
}

// `danhSachCot` phải là bộ cột ĐANG DÙNG (đã thay khối năm động), không phải
// COT_PDD gốc — nếu không, override trên cột năm mới (sl_2026...) sẽ bị bỏ
// qua vì không tra được kiểu dữ liệu.
function apOverride(rows, overrideTheoMa, danhSachCot) {
  const cotTheoKey = new Map(danhSachCot.map((c) => [c.key, c]));
  return rows.map((r) => {
    const ov = overrideTheoMa.get(r.ma_hang);
    if (!ov || ov.size === 0) return r;
    const next = { ...r };
    ov.forEach((giaTri, cot) => {
      const c = cotTheoKey.get(cot);
      if (c) next[cot] = epGiaTri(giaTri, c.kieu);
    });
    return next;
  });
}

export default function TongHopPdd({ goiId = "18t-dung-chung", profile, dotId = null }) {
  // Cùng một biểu mẫu có thể tái diễn ở nhiều kỳ 18 tháng. Scope này được
  // dùng cho phần Excel web/ghi đè để kỳ sau không đọc hay khoá kỳ trước.
  const goiScope = dotId ? `${goiId}:dot:${dotId}` : goiId;
  const [rowsGoc, setRowsGoc] = useState([]);
  const [overrideTheoMa, setOverrideTheoMa] = useState(new Map());
  // (mã hàng -> cột -> {updated_by, updated_at}) — dấu vết AI SỬA CUỐI ô đó.
  // Chốt 20/08/2026: luật "ai sửa sau đè" giữ nguyên, chỉ bắt ô phải khai ra
  // người chạm sau cùng. Đi song song với `overrideTheoMa`, xem lý do tách hai
  // map ở `taiOverrideVaKhoa`.
  const [veSuaCuoi, setVeSuaCuoi] = useState(new Map());
  const [boThau, setBoThau] = useState(GOI_ID_MAP[goiId] || GOI_ID_MAP["18t-dung-chung"]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [cotLocked, setCotLocked] = useState(new Set());
  const [dongLocked, setDongLocked] = useState(new Set());
  // Chốt CẢ BẢN tổng hợp (patch_zs). Khác khoá cột/dòng: chốt là khoá tất,
  // dùng khi số đã xong và sắp mang đi thầu. Server chặn độc lập bằng trigger.
  const [chot, setChot] = useState(null);   // { chot_boi, chot_luc } | null
  // V2 — khoa nào đã gửi đề xuất mà chưa xác nhận bản hiện tại. DB chặn cứng
  // việc chốt khi danh sách này còn phần tử (patch_zzzzu); màn hình phải cho
  // thấy TRƯỚC, không để PĐD bấm rồi mới ăn lỗi.
  const [khoaChuaXacNhan, setKhoaChuaXacNhan] = useState([]);
  const [dangChot, setDangChot] = useState(false);
  const [dotGoiId, setDotGoiId] = useState(null);
  // VÒNG KHÉP KÍN (23/08/2026) — cụm thầu nằm ngay trên bảng này, PĐD không
  // còn phải sang Bàn điều hành để tích rớt và gõ số trúng nữa.
  const thau = useDuLieuThau(dotGoiId);
  const [formRot, setFormRot] = useState(null);
  const [formDoMa, setFormDoMa] = useState(null);
  const [thongBaoThau, setThongBaoThau] = useState("");
  const [dangChiaTiLe, setDangChiaTiLe] = useState("");
  const [cheDoGoRot, setCheDoGoRot] = useState(false);
  const [daTuBat, setDaTuBat] = useState(false);

  const taiLai = useCallback(async () => {
    setDangTai(true);
    setLoi("");
    try {
      const [{ bo, rows, dsNamCoDuLieu: dsNam, dotGoiId: dgId }, khoaVaOverride] = await Promise.all([
        taiDuLieuGoc(goiId, dotId),
        taiOverrideVaKhoa(goiScope, NAM_DE_XUAT),
      ]);
      const { overrideTheoMa: ov, veSuaCuoiTheoMa: vsc, cotLocked: cl,
        dongLocked: dl, cotAn: ca, oKhoaTheoMa: okm } = khoaVaOverride;
      // Danh sách khoa chưa xác nhận — tải cùng lúc với trạng thái chốt.
      if (dgId) {
        const { data: chuaXn } = await supabase.rpc("khoa_chua_xac_nhan", { p_dot_goi_id: dgId });
        setKhoaChuaXacNhan((chuaXn || []).map((x) => (typeof x === "string" ? x : x.khoa)));
      } else {
        setKhoaChuaXacNhan([]);
      }
      const [chotRes, trinhKyRes] = await Promise.all([
        dgId
          ? supabase.from("chot_q_phien")
            .select("id, revision, so_khoa_chua_chot, chot_boi, chot_luc")
            .eq("dot_goi_id", dgId).eq("hieu_luc", true).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        // Cần biết TRƯỚC khi bấm là sẽ ra bản nháp hay bản chính thức. Trước
        // 19/08/2026 chỉ có một nhãn "Xuất Excel đi thầu" cho cả hai trạng
        // thái, phải mở file ra mới biết mình vừa xuất bản nào — với hồ sơ đi
        // trình ký thì đó là chỗ dễ nhầm.
        dgId
          ? supabase.from("chot_trinh_ky_phien_v3")
            .select("revision").eq("dot_goi_id", dgId).eq("hieu_luc", true).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
      setChot(chotRes.error ? null : (chotRes.data || null));
      setRevTrinhKy(trinhKyRes.error ? null : (trinhKyRes.data?.revision ?? null));
      setBoThau(bo);
      setDotGoiId(dgId || null);
      setRowsGoc(rows);
      setDsNamCoDuLieu(dsNam || []);
      setOverrideTheoMa(ov);
      setVeSuaCuoi(vsc || new Map());
      setCotLocked(cl);
      setDongLocked(dl);
      setCotAn(ca);
      setOKhoaTheoMa(okm || new Map());
    } catch (e) {
      setLoi(e.message || "Không tải được dữ liệu.");
    } finally {
      setDangTai(false);
    }
  }, [goiId, dotId, goiScope]);

  useEffect(() => {
    let huy = false;
    (async () => {
      await taiLai();
      if (huy) return; // bỏ qua nếu unmount giữa chừng — state đã set ở taiLai vẫn vô hại
    })();
    return () => { huy = true; };
  }, [taiLai]);

  const [oDangChon, setODangChon] = useState(null);
  const [giaTriDangGo, setGiaTriDangGo] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const [loiO, setLoiO] = useState("");
  const [rowMoRong, setRowMoRong] = useState(new Set());
  const [cotAn, setCotAn] = useState(new Set());
  const [openMenuCot, setOpenMenuCot] = useState(false);
  // Công tắc chung cho "bảng con" (chi tiết từng khoa). Tắt thì không bung
  // được trên web VÀ Excel cũng không có các cột khoa — chốt 07/08/2026.
  const [hienChiTietKhoa, setHienChiTietKhoa] = useState(true);
  // Mặc định hiện ĐẦY ĐỦ nội dung mọi ô (wraptext) — xem StyleTable.
  const [dongGon, setDongGon] = useState(false);
  const [dangXuat, setDangXuat] = useState(false);
  const [audit, setAudit] = useState(null); // { maHang, cot, dsAudit, dangTai }
  const [dsNamCoDuLieu, setDsNamCoDuLieu] = useState([]);
  const [phanBoDangSua, setPhanBoDangSua] = useState(null);
  const [revTrinhKy, setRevTrinhKy] = useState(null);
  // Ô do KHOA sửa, gom theo (mã hàng -> cột PĐD -> [{khoa, giaTri}]).
  const [oKhoaTheoMa, setOKhoaTheoMa] = useState(new Map());
  const [khoaGhiDangXem, setKhoaGhiDangXem] = useState(null);

  // COT_PDD nhưng khối cột năm được thay bằng đúng năm đang có dữ liệu, rồi
  // chèn thêm khối "lịch sử cả nhóm mã quản lý" ngay cạnh để so sánh bằng mắt.
  const cotDayDu = useMemo(
    () => chenCotLichSuNhom(
      thayCotLichSu(COT_PDD, taoCotLichSu(dsNamCoDuLieu, { theoKhoa: false })),
      taoCotLichSuNhom(dsNamCoDuLieu, { theoKhoa: false })
    ),
    [dsNamCoDuLieu]
  );

  const rows = useMemo(
    () => apOverride(rowsGoc, overrideTheoMa, cotDayDu),
    [rowsGoc, overrideTheoMa, cotDayDu]
  );

  // Bản GỐC (chưa áp override) để đối chiếu — dùng cho việc đánh dấu ô đã bị
  // sửa đè và hiện số gốc trong tooltip.
  const rowGocTheoMa = useMemo(
    () => new Map(rowsGoc.map((r) => [r.ma_hang, r])),
    [rowsGoc]
  );

  // Đã chốt Q nghĩa là đang ở khúc làm việc với cụm cột thầu — tự bật chế độ
  // gõ rớt MỘT LẦN, sau đó tôn trọng lựa chọn của người dùng.
  useEffect(() => {
    if (thau.coPhienQ && !daTuBat) { setCheDoGoRot(true); setDaTuBat(true); }
  }, [thau.coPhienQ, daTuBat]);

  const cotHienThi = useMemo(
    () => sapXepFreezeTruoc(cotDayDu.filter((c) => !cotAn.has(c.key)
      && (!cheDoGoRot || COT_CHE_DO_GO_ROT.has(c.key)))),
    [cotAn, cotDayDu, cheDoGoRot]
  );
  const groupSegments = useMemo(
    () => tinhSegmentsGroup(cotHienThi, NHOM_COT_PDD),
    [cotHienThi]
  );
  // Mã "anh em" của mã đang mở hộp đổ: cùng mã quản lý, khác chính nó, và
  // phải CÒN TRÚNG mới gánh thêm được — mã cũng rớt sạch thì đổ sang vô nghĩa.
  const dsMaAnhEm = useMemo(() => {
    if (!formDoMa) return [];
    const mql = formDoMa.row.ma_nhom;
    if (!mql) return [];
    return rows.filter((x) => x.ma_nhom === mql && x.ma_hang !== formDoMa.row.ma_hang)
      .filter((x) => {
        const kq = thau.ketQua.get(x.ma_hang);
        return !kq || Number(kq.so_luong_trung) > 0;
      });
  }, [formDoMa, rows, thau.ketQua]);

  const leftFreezeCell = (colKey) => 30 + tinhLeftFreeze(cotHienThi, colKey);

  // Ẩn cột giờ lưu SERVER (patch_zk) vì nó dùng chung cho mọi người PĐD và
  // quyết định luôn cột nào có trong file Excel trình ký.
  const anCot = (colKey) => toggleKhoa("an_cot", colKey, false);
  const hienCot = (colKey) => toggleKhoa("an_cot", colKey, true);

  const toggleExpand = (maHang) => {
    if (!hienChiTietKhoa) return; // công tắc chi tiết theo khoa đang TẮT
    setRowMoRong((prev) => {
      const next = new Set(prev);
      if (next.has(maHang)) next.delete(maHang); else next.add(maHang);
      return next;
    });
  };

  // ---- Khoá / mở khoá cột hoặc dòng — ghi thật, chỉ dieu_duong/admin (RLS
  // chặn phần còn lại; patch_zd_danh_muc_tong_hop_o.sql). ----
  const toggleKhoa = async (loai, khoaKey, dangKhoa) => {
    if (dangKhoa) {
      const { error } = await supabase.from("danh_muc_tong_hop_khoa").delete()
        .eq("goi_id", goiScope).eq("nam_de_xuat", NAM_DE_XUAT).eq("loai", loai).eq("khoa_key", khoaKey);
      if (error) { setLoiO(thongBaoLoiKhoa(error, loai)); return; }
      setStateTheoLoai(loai)((prev) => { const n = new Set(prev); n.delete(khoaKey); return n; });
    } else {
      const { error } = await supabase.from("danh_muc_tong_hop_khoa").insert({
        goi_id: goiScope, nam_de_xuat: NAM_DE_XUAT, loai, khoa_key: khoaKey,
        locked_by: profile.email,
      });
      if (error) { setLoiO(thongBaoLoiKhoa(error, loai)); return; }
      setStateTheoLoai(loai)((prev) => new Set(prev).add(khoaKey));
    }
  };

  const setStateTheoLoai = (loai) =>
    loai === "cot" ? setCotLocked : loai === "dong" ? setDongLocked : setCotAn;

  // Ẩn cột cần patch_zk mở rộng ràng buộc `loai`; chưa chạy thì Postgres báo
  // lỗi check constraint khó hiểu — dịch sang câu người dùng làm được gì.
  const thongBaoLoiKhoa = (error, loai) => {
    if (loai === "an_cot" && /check constraint|loai_check|violates/i.test(error.message || "")) {
      return "Staging chưa cho phép lưu ẩn cột. Cần chạy backend/sql/patch_zk_an_cot_tong_hop.sql.";
    }
    return error.message;
  };

  // Chốt 07/08/2026: PĐD sửa được MỌI ô trên bản tổng hợp, kể cả cột lịch sử
  // HIS và cột công thức (tùy chọn mua thêm 30%) — đây là working document,
  // PĐD phải chỉnh được số sai mà không cần nhờ ai. Đổi lại, ô nào bị sửa đè
  // sẽ được ĐÁNH DẤU RÕ kèm số gốc, và mọi lần sửa đều vào audit theo ô
  // (danh_muc_tong_hop_o_audit). Chỉ còn khoá cột/khoá dòng là chặn sửa.
  // Đã CHỐT cả bản thì không sửa ô nào nữa (patch_zs) — server cũng chặn bằng
  // trigger, đây chỉ là lớp cho người dùng thấy sớm.
  const oCoTheSua = (col, maHang) =>
    !chot && !cotLocked.has(col.key) && !dongLocked.has(maHang);

  /** Ô này có đang bị PĐD sửa đè lên số gốc không? */
  const oBiSuaDe = (maHang, cot) => overrideTheoMa.get(maHang)?.has(cot) ?? false;
  const giaTriGoc = (maHang, cot) => rowGocTheoMa.get(maHang)?.[cot];
  /** Ai chạm ô này sau cùng, lúc nào — null nếu ô chưa từng bị sửa đè.
   *  Tên hàm cố ý KHÔNG gọi là "pddSuaCuoi": từ V2 người sửa cuối rất có thể
   *  là KHOA chứ không phải PĐD, đó chính là điều cái nhãn phải nói ra. */
  const veSuaCuoiCuaO = (maHang, cot) => veSuaCuoi.get(maHang)?.get(cot) || null;

  // ---- Xuất Excel -------------------------------------------------------
  // Chỉ xuất CỘT ĐANG HIỆN (ẩn cột thì Excel cũng mất cột đó) và, nếu đang
  // bật chi tiết, thêm MỖI KHOA MỘT CỘT — đúng như file mẫu bệnh viện vốn có
  // 49 cột đánh số cho 49 khoa. Không dùng file mẫu cố định được vì số cột
  // thay đổi theo lúc xuất, xem lib/xuatExcelDong.js.
  const xuatExcel = async () => {
    setDangXuat(true);
    setLoiO("");
    try {
      let phienChinhThuc = null;
      let soTrungTheoMa = new Map();
      if (dotGoiId) {
        const { data: phien, error: loiPhien } = await supabase
          .from("chot_trinh_ky_phien_v3")
          .select("id,revision,chot_luc").eq("dot_goi_id", dotGoiId)
          .eq("hieu_luc", true).maybeSingle();
        if (loiPhien) throw loiPhien;
        phienChinhThuc = phien || null;
        if (phienChinhThuc) {
          const { data: dong, error: loiDong } = await fetchAllRows((f, t) => supabase
            .from("chot_trinh_ky_dong_v3")
            .select("ma_hang,khoa,so_luong_trung")
            .eq("phien_id", phienChinhThuc.id).range(f, t), { order: ["ma_hang", "khoa"] });
          if (loiDong) throw loiDong;
          (dong || []).forEach((d) => {
            if (!soTrungTheoMa.has(d.ma_hang)) soTrungTheoMa.set(d.ma_hang, []);
            soTrungTheoMa.get(d.ma_hang).push({ khoaMa: d.khoa, khoaTen: d.khoa,
              soLuong: Number(d.so_luong_trung) || 0, soLuongGoc: Number(d.so_luong_trung) || 0 });
          });
        }
      }
      const rowsXuat = phienChinhThuc ? rows.map((r) => {
        const khoaDeXuat = soTrungTheoMa.get(r.ma_hang) || [];
        const tong = khoaDeXuat.reduce((s, k) => s + k.soLuong, 0);
        return { ...r, khoaDeXuat, tongToanVien: tong, sl_de_xuat_2627: tong,
          mua_them_30: Math.floor(tong * 0.30) };
      }) : rows;
      const tenKhoa = hienChiTietKhoa
        ? [...new Set(rowsXuat.flatMap((r) => r.khoaDeXuat.map((k) => k.khoaTen)))]
            .sort((a, b) => a.localeCompare(b, "vi"))
        : [];
      const cotKhoa = tenKhoa.map((ten) => ({ key: `khoa::${ten}`, nhan: ten, width: 90 }));

      const duLieu = rowsXuat.map((r) => {
        const dong = { ...r };
        if (hienChiTietKhoa) {
          r.khoaDeXuat.forEach((k) => { dong[`khoa::${k.khoaTen}`] = k.soLuong; });
          dong["khoa::__tong"] = r.tongToanVien;
        }
        return dong;
      });

      // Excel bám cấu hình ẩn cột (`cotAn`) chứ KHÔNG bám chế độ gõ rớt — chế
      // độ đó chỉ là lăng kính xem trên màn, bật/tắt không được đổi file xuất ra.
      const cotChoExcel = sapXepFreezeTruoc(cotDayDu.filter((c) => !cotAn.has(c.key)));
      const cotXuat = [
        ...cotChoExcel.map((c) => ({ key: c.key, nhan: c.nhan, nhanMau: c.nhanMau, width: c.width })),
        ...(hienChiTietKhoa
          ? [{ key: "khoa::__tong", nhan: "TỔNG TOÀN VIỆN", width: 110 }]
          : []),
      ];

      const tenMau = await docTenCotTuMau(
        `${import.meta.env.BASE_URL}form-bieu-mau/danh-muc-tong-hop-pdd.xlsx`
      ).catch(() => []);

      await xuatExcelDong({
        tieuDe: [
          "BỆNH VIỆN ĐẠI HỌC Y DƯỢC THÀNH PHỐ HỒ CHÍ MINH",
          "PHÒNG ĐIỀU DƯỠNG",
          `DANH MỤC, SỐ LƯỢNG, YÊU CẦU KỸ THUẬT VẬT TƯ Y TẾ NĂM ${NAM_DE_XUAT}-${NAM_DE_XUAT + 1} (${boThau.nhan})`,
          phienChinhThuc
            ? `BẢN CHÍNH THỨC · REVISION ${phienChinhThuc.revision} · ${new Date(phienChinhThuc.chot_luc).toLocaleString("vi-VN")}`
            : "BẢN NHÁP · CHƯA CHỐT TRÌNH KÝ TOÀN BỘ",
        ],
        // Tên cột lấy từ file biểu mẫu (cotGoc = COT_PDD vì thứ tự của nó
        // khớp vị trí với mẫu; cột năm động rơi xuống nhanMau tự sinh).
        cot: ganTenMau(cotXuat, COT_PDD, tenMau),
        cotKhoa,
        rows: duLieu,
        tenFile: `tong-hop-di-thau-${tenFileAnToan(boThau.nhan)}-${NAM_DE_XUAT}-${
          phienChinhThuc ? `chinh-thuc-rev-${phienChinhThuc.revision}` : "ban-nhap"}.xlsx`,
        tenSheet: "Tổng hợp",
      });
    } catch (e) {
      setLoiO(e.message || "Không xuất được Excel.");
    } finally {
      setDangXuat(false);
    }
  };

  // Snapshot Q theo DOT_GOI. Chốt là cổng mềm: server luôn cho chốt và ghi lại
  // còn bao nhiêu khoa chưa nộp. Mở lại bắt lý do và không sửa snapshot cũ.
  const doiChot = async () => {
    setDangChot(true);
    setLoiO("");
    const dangChot = !!chot;
    if (!dotGoiId) {
      setDangChot(false);
      setLoiO("Chưa xác định được DOT_GOI để tạo snapshot Q.");
      return;
    }
    let data;
    let error;
    if (dangChot) {
      const lyDo = window.prompt("Nhập lý do mở snapshot Q:", "") || "";
      if (!lyDo.trim()) { setDangChot(false); return; }
      ({ data, error } = await supabase.rpc("mo_chot_so_tham_gia_thau_v3", {
        p_dot_goi_id: dotGoiId, p_ly_do: lyDo,
      }));
    } else {
      ({ data, error } = await supabase.rpc("chot_so_tham_gia_thau_v3", {
        p_dot_goi_id: dotGoiId,
      }));
    }
    setDangChot(false);
    if (error) {
      setLoiO(error.message);
      return;
    }
    // Chốt/mở chốt Q đổi hẳn cụm cột thầu (Q · R1 · R2 · R3 · Trúng). Không tải
    // lại ở đây thì bảng đã hiện "đã chốt" mà dải giai đoạn vẫn nói "chưa chốt"
    // — đo thật bằng trình duyệt 23/08/2026.
    await Promise.all([taiLai(), thau.taiLaiThau()]);
  };

  const batDauSua = (maHang, colKey, giaTriHienTai) => {
    setLoiO("");
    setODangChon({ maHang, colKey });
    setGiaTriDangGo(giaTriHienTai ?? "");
  };

  // ---- Ghi 1 ô — upsert thật; trigger server tự chặn nếu cột/dòng đã khoá
  // (báo lỗi rõ trong error.message), tự ghi audit. ----
  const luuO = async () => {
    if (!oDangChon) return;
    const { maHang, colKey } = oDangChon;
    setDangLuu(true);
    setLoiO("");
    // Cột số không còn là override: đặt tổng mới sẽ chia xuống phan_bo_khoa
    // trong một transaction. Các cột chữ vẫn dùng cơ chế override/audit cũ.
    if (colKey === "sl_de_xuat_2627" && dotGoiId) {
      // Mục III của workflow: sửa tổng KHÔNG ghi thẳng. "Hệ thống mở màn phân
      // bổ và chia sẵn phần chênh lệch theo đúng tỉ lệ khoa đã đề xuất (làm
      // tròn xuống, phần dư dồn vào khoa có số lớn nhất)", PĐD sửa tay dòng
      // nào muốn, và không lưu được nếu tổng chưa khớp.
      //
      // Bản cũ gọi thẳng RPC với `p_ly_do: null`. Giai đoạn 4 luôn đứng SAU
      // Giai đoạn 3 nên luôn có khoa đã chốt danh mục, mà DB thì bắt buộc lý
      // do trong trường hợp đó — hậu quả là mọi lần sửa tổng đều chết với
      // "Phải nhập lý do vì có khoa đã chốt danh mục." và PĐD không còn đường
      // nào sửa được tổng.
      const tongMoi = Number(giaTriDangGo);
      setDangLuu(false);
      if (!Number.isInteger(tongMoi) || tongMoi < 0) {
        setLoiO("Tổng mới phải là số nguyên không âm.");
        return;
      }
      const row = rows.find((r) => r.ma_hang === maHang);
      if (!row || !row.khoaDeXuat?.length) {
        setLoiO("Mã hàng chưa có khoa nào đề xuất trong đợt này.");
        return;
      }
      setODangChon(null);
      setPhanBoDangSua({
        maHang,
        tongMoi,
        lyDo: "",
        giaTri: chiaTheoTiLe(row.khoaDeXuat, tongMoi),
      });
      // Màn phân bổ nằm trong hàng sổ xuống, nên phải bung hàng đó ra —
      // nếu không thì bảng chia sẵn hiện ở chỗ không ai nhìn thấy.
      setRowMoRong((p) => new Set(p).add(maHang));
      return;
    }

    const { error } = await supabase.from("danh_muc_tong_hop_o").upsert({
      goi_id: goiScope, nam_de_xuat: NAM_DE_XUAT, ma_hang: maHang, cot: colKey,
      gia_tri: giaTriDangGo === "" ? null : String(giaTriDangGo),
      updated_by: profile.email,
    }, { onConflict: "goi_id,nam_de_xuat,ma_hang,cot" });
    setDangLuu(false);
    if (error) {
      // Lỗi từ trigger fn_chan_o_da_lock (cột/dòng vừa bị khoá bởi người khác
      // trong lúc mình đang sửa) hiện nguyên văn — không cần dịch lại.
      setLoiO(error.message);
      return;
    }
    setOverrideTheoMa((prev) => {
      const next = new Map(prev);
      const conMa = new Map(next.get(maHang) || []);
      conMa.set(colKey, giaTriDangGo === "" ? null : String(giaTriDangGo));
      next.set(maHang, conMa);
      return next;
    });
    // Dấu vết phải đổi CÙNG LÚC với con chữ trong ô, không chờ lần tải lại kế
    // tiếp: nếu không, PĐD vừa gõ xong vẫn thấy nhãn mang tên khoa sửa trước
    // đó và tưởng mình chưa lưu được. `updated_at` lấy giờ máy chỉ để hiện
    // ngay; lần tải lại sau sẽ thay bằng giờ server (default now() của bảng).
    setVeSuaCuoi((prev) => {
      const next = new Map(prev);
      const conMa = new Map(next.get(maHang) || []);
      conMa.set(colKey, { updated_by: profile.email, updated_at: new Date().toISOString() });
      next.set(maHang, conMa);
      return next;
    });
    setODangChon(null);
  };

  // Chia sẵn tổng mới về các khoa theo đúng tỉ lệ đang có: làm tròn XUỐNG,
  // phần dư dồn vào khoa có số lớn nhất. Cùng quy tắc với
  // `cap_nhat_tong_phan_bo_khoa` để con số gợi ý trên màn khớp với số DB sẽ
  // tính nếu PĐD không sửa tay. Đây chỉ là gợi ý — PĐD luôn sửa được.
  const chiaTheoTiLe = (khoaDeXuat, tongMoi) => {
    // RPC chia theo `so_luong_goc` (số khoa gửi ban đầu), không theo số hiện
    // hành — dùng đúng cột đó thì gợi ý trên màn khớp số DB sẽ tính.
    const goc = (k) => Number(k.soLuongGoc ?? k.soLuong) || 0;
    const tongCu = khoaDeXuat.reduce((s, k) => s + goc(k), 0);
    const ra = {};
    if (tongCu <= 0) {
      khoaDeXuat.forEach((k) => { ra[k.khoaMa] = 0; });
      return ra;
    }
    khoaDeXuat.forEach((k) => {
      ra[k.khoaMa] = Math.floor(tongMoi * goc(k) / tongCu);
    });
    const conLai = tongMoi - Object.values(ra).reduce((s, n) => s + n, 0);
    if (conLai > 0) {
      const lonNhat = [...khoaDeXuat].sort(
        (a, b) => goc(b) - goc(a) || String(a.khoaMa).localeCompare(String(b.khoaMa)),
      )[0];
      ra[lonNhat.khoaMa] += conLai;
    }
    return ra;
  };

  const batDauSuaPhanBo = (row) => {
    setLoiO("");
    setPhanBoDangSua({
      maHang: row.ma_hang,
      tongMoi: row.tongToanVien,
      lyDo: "",
      giaTri: Object.fromEntries(row.khoaDeXuat.map((k) => [k.khoaMa, k.soLuong])),
    });
  };

  const luuPhanBoTay = async () => {
    if (!phanBoDangSua || !dotGoiId) return;
    const tongPhanBo = Object.values(phanBoDangSua.giaTri)
      .reduce((s, n) => s + (Number(n) || 0), 0);
    if (tongPhanBo !== Number(phanBoDangSua.tongMoi)) {
      setLoiO(`Tổng các khoa ${fmt(tongPhanBo)} chưa khớp tổng cần phân bổ ${fmt(phanBoDangSua.tongMoi)}.`);
      return;
    }
    setDangLuu(true);
    setLoiO("");
    const { error } = await supabase.rpc("cap_nhat_tong_phan_bo_khoa", {
      p_dot_goi_id: dotGoiId,
      p_ma_hang: phanBoDangSua.maHang,
      p_tong_moi: Number(phanBoDangSua.tongMoi),
      p_phan_bo: Object.fromEntries(Object.entries(phanBoDangSua.giaTri)
        .map(([k, v]) => [k, Number(v)])),
      p_ly_do: phanBoDangSua.lyDo || null,
    });
    setDangLuu(false);
    if (error) { setLoiO(error.message); return; }
    setPhanBoDangSua(null);
    await taiLai();
  };

  // Bỏ sửa đè: xoá dòng override -> ô trở lại đúng giá trị hệ thống tính.
  // Cần patch_zl (patch_zd thiếu policy DELETE nên xoá bị RLS chặn ÂM THẦM —
  // trả 200 nhưng không xoá dòng nào, đúng bẫy số 5 trong tài liệu vận hành).
  const khoiPhucOGoc = async (maHang, colKey) => {
    setLoiO("");
    const { data, error } = await supabase.from("danh_muc_tong_hop_o")
      .delete()
      .eq("goi_id", goiScope).eq("nam_de_xuat", NAM_DE_XUAT)
      .eq("ma_hang", maHang).eq("cot", colKey)
      .select();
    if (error) { setLoiO(error.message); return; }
    if (!data?.length) {
      setLoiO("Không bỏ được sửa đè — staging chưa có quyền xoá ô. Cần chạy backend/sql/patch_zl_khoi_phuc_o_goc.sql.");
      return;
    }
    setOverrideTheoMa((prev) => {
      const next = new Map(prev);
      const conMa = new Map(next.get(maHang) || []);
      conMa.delete(colKey);
      if (conMa.size) next.set(maHang, conMa); else next.delete(maHang);
      return next;
    });
    // Bỏ sửa đè là XOÁ hẳn dòng trong `danh_muc_tong_hop_o`, nên dấu vết cũng
    // phải biến mất theo — để lại nhãn "ai sửa cuối" trên một ô đã trả về giá
    // trị gốc là nói sai sự thật.
    setVeSuaCuoi((prev) => {
      const next = new Map(prev);
      const conMa = new Map(next.get(maHang) || []);
      conMa.delete(colKey);
      if (conMa.size) next.set(maHang, conMa); else next.delete(maHang);
      return next;
    });
    setODangChon(null);
  };

  const xemAudit = async (maHang, colKey) => {
    setAudit({ maHang, cot: colKey, dsAudit: [], dangTai: true });
    const { data, error } = await supabase.from("danh_muc_tong_hop_o_audit")
      .select("gia_tri_cu, gia_tri_moi, nguoi_sua, thoi_gian")
      .eq("goi_id", goiScope).eq("nam_de_xuat", NAM_DE_XUAT).eq("ma_hang", maHang).eq("cot", colKey)
      .order("thoi_gian", { ascending: false }).limit(20);
    setAudit({ maHang, cot: colKey, dsAudit: error ? [] : (data || []), dangTai: false, loi: error?.message });
  };

  const tongMaHang = rows.length;
  const tongKhoaThamGia = new Set(rows.flatMap((r) => r.khoaDeXuat.map((k) => k.khoaMa))).size;

  if (dangTai) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Đang tải dữ liệu tổng hợp...</p>
      </div>
    );
  }
  if (loi) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-100">
        <p className="text-sm text-red-600">Không tải được: {loi}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-100">
      <StyleTable />

      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>VTYT</span><span>›</span>
          <span>Năm đề xuất {NAM_DE_XUAT}</span><span>›</span>
          <span>{boThau.nhan}</span><span>›</span>
          <span className="font-semibold text-slate-800">Danh mục tổng hợp PĐD</span>
        </div>
        <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-umc-700">
          <ChevronLeft size={13} /> Về màn chính
        </a>
      </div>

      {/* Header + toolbar */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Danh mục tổng hợp — Gói {boThau.nhan}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              30 cột chuẩn bệnh viện · Tổng hợp {tongMaHang} mã hàng từ {tongKhoaThamGia} khoa đã đề xuất · Cột "Khoa đề xuất" sổ xuống để xem breakdown
            </p>
            <div className="mt-2">
              <ThanhGiaiDoanThau
                dotGoiId={dotGoiId}
                giaiDoan={thau.giaiDoan}
                giaiDoanDangChay={thau.giaiDoanDangChay}
                tongChuaXuLy={thau.tongChuaXuLy}
                coPhienQ={thau.coPhienQ}
                soChuaChia={thau.soChuaChia}
                onLoi={(m) => setLoi(m)}
                onXong={async (m) => {
                  setThongBaoThau(m || "");
                  await thau.taiLaiThau();
                  await taiLai();
                }}
              />
              {thongBaoThau && (
                <div className="mt-1.5 rounded bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-800">
                  {thongBaoThau}
                  <button type="button" onClick={() => setThongBaoThau("")}
                    className="ml-2 text-emerald-600 hover:underline">ẩn</button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button className="qtdx-tb" onClick={taiLai}><RefreshCw size={13} /> Tải lại</button>
            <button type="button"
              className={`qtdx-tb ${cheDoGoRot ? "!bg-umc-700 !text-white !border-umc-700" : ""}`}
              onClick={() => { setCheDoGoRot((v) => !v); setDaTuBat(true); }}
              title={cheDoGoRot
                ? "Đang ẩn các nhóm cột lịch sử · phân nhóm · thương mại để cụm cột thầu lọt màn hình. Bấm để hiện lại đủ 30 cột. Không ảnh hưởng file Excel xuất ra."
                : "Ẩn bớt cột để Q · R1 · R2 · R3 · Trúng · Đã chia · Xử lý rớt lọt màn hình, khỏi cuộn ngang"}>
              <Columns3 size={13} /> {cheDoGoRot ? "Chế độ gõ rớt: BẬT" : "Chế độ gõ rớt"}
            </button>
            <div className="relative">
              <button className="qtdx-tb" onClick={() => setOpenMenuCot((v) => !v)}>
                <EyeOff size={13} /> Cột hiển thị ({cotHienThi.length}/{cotDayDu.length})
              </button>
              {openMenuCot && (
                <div className="absolute right-0 top-full mt-1 w-72 max-h-96 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg z-40">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Chọn cột hiển thị</span>
                    <button className="text-xs text-umc-700 hover:underline" onClick={() => setCotAn(new Set())}>Hiện tất cả</button>
                  </div>
                  {NHOM_COT_PDD.map((n) => {
                    const dsCot = cotDayDu.filter((c) => c.group === n.key);
                    if (!dsCot.length) return null;
                    return (
                      <div key={n.key} className="border-b border-slate-100 last:border-0">
                        <div className="px-3 py-1 text-[10.5px] uppercase tracking-wide text-slate-400 bg-slate-50">{n.nhan}</div>
                        {dsCot.map((c) => (
                          <label key={c.key} className="flex items-center gap-2 px-3 py-1 hover:bg-slate-50 cursor-pointer text-xs">
                            <input type="checkbox" checked={!cotAn.has(c.key)}
                              onChange={() => cotAn.has(c.key) ? hienCot(c.key) : anCot(c.key)} />
                            <span className={cotAn.has(c.key) ? "text-slate-400" : "text-slate-700"}>{c.nhan}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button className="qtdx-tb" onClick={() => setHienChiTietKhoa((v) => !v)}
              title="Bật/tắt bảng con chi tiết theo khoa — tắt thì Excel cũng không có cột khoa">
              <Users size={13} /> Chi tiết theo khoa: {hienChiTietKhoa ? "BẬT" : "TẮT"}
            </button>
            <button className="qtdx-tb" onClick={() => setDongGon((v) => !v)}
              title="Đầy đủ = mọi ô hiện trọn nội dung (dòng cao). Gọn = cắt còn 4 dòng cho dễ cuộn; bấm vào ô vẫn xem/sửa được đủ.">
              <AlignLeft size={13} /> Nội dung ô: {dongGon ? "GỌN" : "ĐẦY ĐỦ"}
            </button>
            <button className={`qtdx-tb ${chot ? "" : "primary"}`}
              onClick={doiChot}
              disabled={dangChot || !rows.length || (!chot && khoaChuaXacNhan.length > 0)}
              title={chot
                ? "Bản tổng hợp đang KHOÁ. Mở chốt để sửa tiếp."
                : khoaChuaXacNhan.length > 0
                  ? `Còn ${khoaChuaXacNhan.length} khoa chưa xác nhận bản hiện tại: `
                    + `${khoaChuaXacNhan.join(", ")}. Nhắn Teams để khoa vào bấm xác nhận.`
                  : "Chốt số để mang đi thầu — khoá mọi ô, không ai sửa được nữa."}>
              {chot ? <Unlock size={13} /> : <Lock size={13} />}
              {dangChot ? "Đang lưu…" : chot ? "Mở chốt để sửa" : "Chốt số đi thầu"}
            </button>
            <button className="qtdx-tb" onClick={xuatExcel} disabled={dangXuat || !rows.length}
              title={revTrinhKy
                ? `Số lượng trong file là SỐ TRÚNG đã phân bổ sau thầu, theo revision ${revTrinhKy}.`
                : "Chưa chốt dữ liệu trình ký — file xuất ra là bản nháp, số lượng là số đi thầu."}>
              <Download size={13} />
              {dangXuat ? "Đang xuất…"
                : revTrinhKy ? `Xuất Excel CHÍNH THỨC (rev ${revTrinhKy})`
                : "Xuất Excel bản nháp"}
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] flex-wrap">
          <span className="qtdx-badge blue">Tổng mã hàng: {tongMaHang}</span>
          <span className="qtdx-badge green">{tongKhoaThamGia} khoa đã đề xuất</span>
          {/* V2 — điều kiện chốt, nên phải nằm ngay đầu bảng chứ không giấu
              trong tooltip của nút. Liệt kê tên để PĐD biết nhắn Teams cho ai. */}
          <span className={`qtdx-badge ${khoaChuaXacNhan.length ? "amber" : "green"}`}>
            {khoaChuaXacNhan.length
              ? `${khoaChuaXacNhan.length} khoa chưa xác nhận: ${khoaChuaXacNhan.join(", ")} — chưa chốt số đi thầu được`
              : "Mọi khoa đã xác nhận bản hiện tại"}
          </span>
          {chot && (
            <span className="qtdx-badge amber">
              ĐÃ CHỐT SỐ ĐI THẦU — mọi ô đang khoá · {chot.chot_boi}
              {" · "}{new Date(chot.chot_luc).toLocaleString("vi-VN")}
              {` · revision Q${chot.revision} · chốt khi còn ${chot.so_khoa_chua_chot} khoa chưa nộp`}
            </span>
          )}
          {cotLocked.size > 0 && <span className="qtdx-badge amber">{cotLocked.size} cột đang khoá</span>}
          {dongLocked.size > 0 && <span className="qtdx-badge amber">{dongLocked.size} dòng đang khoá</span>}
          {loiO && (
            <span className="qtdx-badge red inline-flex items-center gap-1">
              <AlertTriangle size={11} />{loiO}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className={`qtdx-table border-collapse w-max ${dongGon ? "dong-gon" : ""}`}>
          {/* Bắt buộc table-layout: fixed (xem StyleTable) mới ăn colgroup —
              không có colgroup, cột auto-layout theo nội dung DÀI NHẤT trong
              cột (bảng HTML dùng CHUNG 1 độ rộng cho mọi dòng của 1 cột), lệch
              khỏi độ rộng tĩnh mà tinhLeftFreeze() dùng để tính left của cột
              freeze — cột freeze khi đó che mất 1-2 cột liền sau nó. */}
          <colgroup>
            <col style={{ width: 30 }} />
            {cotHienThi.map((c) => <col key={c.key} style={{ width: c.width }} />)}
            <col style={{ width: cheDoGoRot ? 104 : 160 }} />
            {/* Sáu cột cụm thầu. Thiếu <col> ở đây thì bảng `w-max` bóp chúng
                còn ~16px và ô bên cạnh đè lên — đo thật bằng trình duyệt
                23/08/2026 (elementFromPoint trả về ô khác, không phải nút). */}
            <col style={{ width: 84 }} />
            <col style={{ width: 76 }} />
            <col style={{ width: 76 }} />
            <col style={{ width: 76 }} />
            <col style={{ width: 88 }} />
            <col style={{ width: 104 }} />
            <col style={{ width: cheDoGoRot ? 176 : 200 }} />
          </colgroup>
          <thead>
            <tr className="group-row">
              <th className="freeze" style={{ background: "#0f172a", width: 30, left: 0 }}></th>
              {groupSegments.map((s, idx) => {
                let leftOffset = 30;
                if (s.freeze) {
                  for (let i = 0; i < idx; i++) {
                    const prev = groupSegments[i];
                    if (!prev.freeze) break;
                    let colIdx = groupSegments.slice(0, i).reduce((a, x) => a + x.span, 0);
                    for (let k = 0; k < prev.span; k++) {
                      leftOffset += cotHienThi[colIdx + k].width;
                    }
                  }
                }
                return (
                  <th key={s.keyId} colSpan={s.span}
                    className={`${s.mau} ${s.freeze ? "freeze" : ""}`}
                    style={s.freeze ? { left: leftOffset } : {}}>
                    {s.nhan}
                  </th>
                );
              })}
              <th className="bg-emerald-800">Khoa đề xuất</th>
              <th className="bg-red-900" colSpan={7}>Kết quả đấu thầu</th>
            </tr>
            <tr className="col-row">
              <th className="freeze" style={{ width: 30, left: 0 }}></th>
              {cotHienThi.map((c) => {
                // Mọi cột đều khoá được, vì mọi cột đều sửa được.
                const coTheKhoa = true;
                return (
                  <th key={c.key}
                    className={c.freeze ? "freeze" : ""}
                    style={c.freeze ? { left: leftFreezeCell(c.key) } : {}}>
                    <span className="inline-flex items-center gap-1">
                      {c.nhan}
                      {c.freeze && <span title="Cột đang được cố định (freeze)" className="text-amber-300">📌</span>}
                      {coTheKhoa && (
                        <button onClick={() => toggleKhoa("cot", c.key, cotLocked.has(c.key))}
                          className="opacity-50 hover:opacity-100"
                          title={cotLocked.has(c.key) ? "Mở khoá cột" : "Khoá cột"}>
                          {cotLocked.has(c.key) ? <Lock size={10} /> : <Unlock size={10} />}
                        </button>
                      )}
                      <button onClick={() => anCot(c.key)}
                        className="opacity-50 hover:opacity-100 hover:text-rose-300"
                        title="Ẩn cột này">
                        <EyeOff size={10} />
                      </button>
                    </span>
                  </th>
                );
              })}
              <th style={{ minWidth: cheDoGoRot ? 104 : 160 }}>{cheDoGoRot ? "Khoa" : "Số khoa · sổ chi tiết"}</th>
              <th style={{ minWidth: 76 }} title="Số đã chốt đi thầu — bất biến">Q</th>
              <th style={{ minWidth: 68 }} title="Rớt ở giai đoạn Chào giá">R1</th>
              <th style={{ minWidth: 68 }} title="Rớt ở giai đoạn Mở thầu">R2</th>
              <th style={{ minWidth: 68 }} title="Rớt ở giai đoạn Đánh giá">R3</th>
              <th style={{ minWidth: 80 }} title="Q trừ R1 R2 R3">Trúng</th>
              <th style={{ minWidth: 96 }} title="Tổng đã chia về các khoa — phải bằng Trúng thì mới xác nhận rớt được">Đã chia</th>
              <th style={{ minWidth: cheDoGoRot ? 176 : 190 }}>Xử lý rớt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const dongKhoa = dongLocked.has(r.ma_hang);
              return (
              <FragmentRow key={r.ma_hang}>
                <tr>
                  <td className="freeze" style={{ width: 30, left: 0, background: "#f1f5f9", padding: 0, textAlign: "center", borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>
                    <span className="inline-flex items-center">
                      <button onClick={() => toggleExpand(r.ma_hang)}
                        className="text-slate-500 hover:text-umc-700 p-1"
                        title={rowMoRong.has(r.ma_hang) ? "Thu gọn" : "Sổ chi tiết"}>
                        {rowMoRong.has(r.ma_hang) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </button>
                      <button onClick={() => toggleKhoa("dong", r.ma_hang, dongKhoa)}
                        className={`p-0.5 ${dongKhoa ? "text-indigo-600" : "text-slate-300 hover:text-slate-500"}`}
                        title={dongKhoa ? "Mở khoá dòng" : "Khoá dòng"}>
                        {dongKhoa ? <Lock size={10} /> : <Unlock size={10} />}
                      </button>
                    </span>
                  </td>
                  {cotHienThi.map((c) => {
                    const isEditing = oDangChon?.maHang === r.ma_hang && oDangChon?.colKey === c.key;
                    const isLocked = cotLocked.has(c.key) || dongKhoa;
                    const canSua = oCoTheSua(c, r.ma_hang);
                    // V2 — dải thông thường P50–P75, tính trên lịch sử toàn
                    // viện. Vượt P75 tô nổi bật ô số và ô dải; dưới P50 không
                    // sao. Chỉ tô, không chặn (chốt 19/08/2026).
                    const coDai = r._daiTu != null && r._daiDen != null;
                    const vuotP75 = coDai && Number(r.sl_de_xuat_2627) > r._daiDen;
                    const value = c.key === "dai_p50_p75"
                      ? (coDai ? `${fmt(r._daiTu)} – ${fmt(r._daiDen)}` : "—")
                      : r[c.key];
                    const daSuaDe = oBiSuaDe(r.ma_hang, c.key);
                    const veSua = veSuaCuoiCuaO(r.ma_hang, c.key);
                    // Các khoa đã ghi gì vào ô này? Ô nào nhiều khoa ghi khác
                    // nhau thì PĐD phải biết ngay để duyệt, không phải mở từng
                    // bảng khoa đi tìm.
                    const dsKhoaGhi = oKhoaTheoMa.get(r.ma_hang)?.get(c.key) || [];
                    const soGiaTriKhac = new Set(dsKhoaGhi.map((x) => x.giaTri)).size;
                    const khoaLech = soGiaTriKhac > 1;
                    const cn = [
                      "qtdx-cell",
                      vuotP75 && (c.key === "sl_de_xuat_2627" || c.key === "dai_p50_p75")
                        ? "vuot-p75" : "",
                      // Mọi cột đều sửa được (chốt 07/08/2026) nên KHÔNG còn
                      // tô xám theo cờ `readonly` của định nghĩa cột nữa —
                      // để xám mà vẫn gõ được thì gây hiểu nhầm.
                      daSuaDe ? "sua-de" : "",
                      isLocked ? "locked" : "",
                      isEditing ? "editing" : "",
                      c.kieu === "num" ? "num" : "",
                      c.freeze ? "freeze" : "",
                    ].filter(Boolean).join(" ");
                    return (
                      <td key={c.key} className={cn}
                        // .qtdx-cell đã wraptext mọi ô — xem StyleTable. Đặt
                        // whiteSpace:"normal" ở đây sẽ ghi đè pre-wrap.
                        style={{
                          minWidth: c.width, maxWidth: c.width * 1.3,
                          ...(c.freeze ? { left: leftFreezeCell(c.key) } : {}),
                        }}
                        title={[
                          daSuaDe
                            ? `Đã sửa đè — số gốc: ${formatCell(giaTriGoc(r.ma_hang, c.key), c.kieu) || "(trống)"}`
                            : null,
                          // Nhắc lại dấu vết ở tooltip của CẢ Ô chứ không chỉ
                          // trên cái nhãn: nhãn cao 14px, rê trúng nó khó hơn
                          // rê vào ô, mà đây là thông tin PĐD cần nhất.
                          veSua
                            ? `Sửa cuối bởi ${veSua.updated_by || "không rõ"} lúc `
                              + `${veSua.updated_at ? new Date(veSua.updated_at).toLocaleString("vi-VN") : "không rõ thời điểm"}`
                            : null,
                          dsKhoaGhi.length
                            ? dsKhoaGhi.map((x) => `${x.khoa}: ${x.giaTri}`).join("\n")
                            : null,
                        ].filter(Boolean).join("\n") || undefined}
                        onClick={() => c.key !== "dai_p50_p75" && canSua && !isEditing
                          && batDauSua(r.ma_hang, c.key, value)}
                      >
                        {isEditing ? (
                          <div>
                            {c.kieu === "wide" ? (
                              <textarea value={giaTriDangGo ?? ""} rows={3}
                                style={{ resize: "vertical", width: "100%", minHeight: 52 }}
                                onChange={(e) => setGiaTriDangGo(e.target.value)}
                                autoFocus />
                            ) : (
                              <input value={giaTriDangGo ?? ""}
                                type={c.kieu === "num" ? "number" : "text"}
                                onChange={(e) => setGiaTriDangGo(e.target.value)}
                                autoFocus />
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <button type="button" disabled={dangLuu}
                                onClick={luuO}
                                className="text-[10px] rounded bg-umc-700 text-white px-1.5 py-0.5">
                                {dangLuu ? "Đang lưu..." : "Lưu"}
                              </button>
                              <button type="button" onClick={() => setODangChon(null)}
                                className="text-[10px] text-slate-500">Huỷ</button>
                            </div>
                          </div>
                        ) : (
                          <span>
                            {formatCell(value, c.kieu)}
                            {daSuaDe && (
                              <button
                                onClick={(e) => { e.stopPropagation(); khoiPhucOGoc(r.ma_hang, c.key); }}
                                className="ml-1 text-[9px] font-semibold text-amber-700 hover:text-amber-900"
                                title={`Đã sửa đè (số gốc: ${formatCell(giaTriGoc(r.ma_hang, c.key), c.kieu) || "trống"}) — bấm để bỏ sửa đè, trả về số gốc`}>
                                ✎
                              </button>
                            )}
                            {isLocked && <Lock size={9} className="inline-block ml-1 text-indigo-600" />}
                            {/* DẤU VẾT AI SỬA CUỐI (chốt 20/08/2026). Luật vẫn
                                là "ai sửa sau đè" — chủ dự án KHÔNG đổi luật,
                                chỉ yêu cầu ô phải khai ra ai chạm sau cùng.
                                Vì sao đặt ngay cạnh giá trị chứ không gom vào
                                một cột "người sửa" riêng: bảng này rộng vài
                                chục cột và cuộn ngang, cột phụ đặt ở đầu hay
                                cuối đều không nằm cùng tầm mắt với ô đang đọc.
                                Nhãn dùng chung với Danh mục đề xuất khoa
                                (DauVetSuaCuoi) để hai màn gọi tên cùng một lần
                                sửa giống hệt nhau. */}
                            {veSua && (
                              <DauVetSuaCuoi
                                updatedBy={veSua.updated_by} updatedAt={veSua.updated_at}
                                moTaThem="Bấm biểu tượng lịch sử để xem các lần sửa trước." />
                            )}
                            {/* Cờ khoa đã ghi. Lệch nhau thì báo số giá trị
                                khác nhau — PĐD nhìn một cái là biết ô nào cần
                                duyệt. Bấm để sổ danh sách từng khoa. */}
                            {dsKhoaGhi.length > 0 && !daSuaDe && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setKhoaGhiDangXem({ maHang: r.ma_hang, cot: c.key, nhan: c.nhan, ds: dsKhoaGhi }); }}
                                className={`ml-1 rounded px-1 text-[9px] font-semibold ${
                                  khoaLech ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}
                                title={khoaLech
                                  ? `${dsKhoaGhi.length} khoa ghi ${soGiaTriKhac} giá trị khác nhau — bấm để xem`
                                  : `${dsKhoaGhi.length} khoa đã ghi (cùng một giá trị) — bấm để xem`}>
                                {khoaLech ? `${soGiaTriKhac} giá trị` : `${dsKhoaGhi.length} khoa`}
                              </button>
                            )}
                            {/* V2 — tổng đi thầu là phép CỘNG số của các khoa,
                                và khoa sửa được số của mình. Nên tổng PĐD vừa
                                chia xong có thể đã đổi mà PĐD không hay. Cờ do
                                trigger đặt tại nguồn, không đoán từ email. */}
                            {c.key === "sl_de_xuat_2627" && r.khoaTuSuaSo?.length > 0 && (
                              <span
                                className="ml-1 rounded bg-amber-100 px-1 text-[9px] font-semibold text-amber-800"
                                title={`Tổng này đã đổi vì khoa tự sửa số: ${r.khoaTuSuaSo.join(", ")}. `
                                  + "Gõ lại tổng ở đây để chia lại theo tỉ lệ."}>
                                {r.khoaTuSuaSo.length} khoa tự sửa
                              </span>
                            )}
                            {(
                              <button
                                onClick={(e) => { e.stopPropagation(); xemAudit(r.ma_hang, c.key); }}
                                className="ml-1 opacity-40 hover:opacity-100"
                                title="Xem lịch sử sửa ô này">
                                <History size={9} className="inline text-slate-400" />
                              </button>
                            )}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="qtdx-cell readonly" style={{ minWidth: cheDoGoRot ? 104 : 160 }}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-mono text-emerald-800 font-semibold">{r.khoaDeXuat.length}</span>
                      <span className="text-slate-500">khoa · tổng</span>
                      <span className="font-mono font-semibold">{fmt(r.tongToanVien)}</span>
                    </span>
                  </td>
                  <OThauCuaDong
                    row={r} ketQua={thau.ketQua} chuaXuLy={thau.chuaXuLy}
                    daChuyen={thau.daChuyen} daChuyenTiep={thau.daChuyenTiep}
                    phanBo={thau.phanBo} daNhan={thau.daNhan}
                    giaiDoanDangChay={thau.giaiDoanDangChay}
                    dangChia={dangChiaTiLe}
                    onChiaTiLe={async (r) => {
                      // QĐ D14: hệ không tự chia nữa; đây là nút bấm khi PĐD
                      // không muốn gõ từng khoa.
                      setDangChiaTiLe(r.ma_hang);
                      const { error } = await supabase.rpc("chia_theo_ti_le_q_v3", {
                        p_dot_goi_id: dotGoiId, p_ma_hang: r.ma_hang,
                      });
                      setDangChiaTiLe("");
                      if (error) { setLoi(error.message); return; }
                      await thau.taiLaiThau();
                    }}
                    onSuaRot={(row, giaiDoan, giaTri) =>
                      setFormRot({ row, giaiDoan, giaTri, dotGoiId })}
                    onDoMa={(row, conLai) => setFormDoMa({ row, conLai, dotGoiId })}
                  />
                </tr>
                <AnimatePresence initial={false}>
                  {hienChiTietKhoa && rowMoRong.has(r.ma_hang) && (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="row-expand"
                    >
                      <td style={{ width: 30, background: "#f8fafc" }}></td>
                      <td colSpan={cotHienThi.length + 8} className="qtdx-cell" style={{ background: "#f8fafc" }}>
                        <div className="pl-4 py-1">
                          <div className="text-[11px] text-slate-500 mb-1.5">
                            Số lượng đề xuất chi tiết từ {r.khoaDeXuat.length} khoa cho mã <b>{r.ma_hang}</b> · <em>{r.ten_vt_2627?.slice(0, 60)}...</em>
                            {dotGoiId && !chot && (
                              <button type="button" onClick={() => batDauSuaPhanBo(r)}
                                className="ml-3 rounded border border-umc-300 bg-white px-2 py-0.5 font-semibold text-umc-700 hover:bg-umc-50">
                                Sửa phân bổ theo khoa
                              </button>
                            )}
                          </div>
                          <table className="w-auto">
                            <thead>
                              <tr>
                                <th className="text-left text-[10.5px] font-normal text-slate-500 px-3 py-1.5" style={{ background: "transparent", color: "#64748b", position: "static" }}>Khoa</th>
                                <th className="text-right text-[10.5px] font-normal text-slate-500 px-3 py-1.5" style={{ background: "transparent", color: "#64748b", position: "static" }}>SL gốc</th>
                                <th className="text-right text-[10.5px] font-normal text-slate-500 px-3 py-1.5" style={{ background: "transparent", color: "#64748b", position: "static" }}>SL hiện hành</th>
                                <th className="text-right text-[10.5px] font-normal text-slate-500 px-3 py-1.5" style={{ background: "transparent", color: "#64748b", position: "static" }}>Tỉ trọng</th>
                                <th className="text-left text-[10.5px] font-normal text-slate-500 px-3 py-1.5" style={{ background: "transparent", color: "#64748b", position: "static" }}>Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.khoaDeXuat.map((k) => (
                                <tr key={k.khoaMa}>
                                  <td className="px-3 py-1 text-xs">{k.khoaTen}</td>
                                  <td className="px-3 py-1 text-xs text-right font-mono text-slate-500">{fmt(k.soLuongGoc)}</td>
                                  <td className="px-3 py-1 text-xs text-right font-mono">
                                    {phanBoDangSua?.maHang === r.ma_hang ? (
                                      <input type="number" min="0" step="1"
                                        className="w-24 rounded border border-slate-300 px-1.5 py-1 text-right font-mono"
                                        value={phanBoDangSua.giaTri[k.khoaMa] ?? 0}
                                        onChange={(e) => setPhanBoDangSua((p) => ({
                                          ...p, giaTri: { ...p.giaTri, [k.khoaMa]: e.target.value },
                                        }))} />
                                    ) : fmt(k.soLuong)}
                                  </td>
                                  <td className="px-3 py-1 text-xs text-right font-mono text-slate-500">
                                    {r.tongToanVien > 0 ? Math.round((k.soLuong / r.tongToanVien) * 100) : 0}%
                                  </td>
                                  <td className="px-3 py-1 text-xs">
                                    <span className="qtdx-badge green">Đã submit</span>
                                  </td>
                                </tr>
                              ))}
                              <tr>
                                <td className="px-3 py-1 text-xs font-semibold text-slate-700 border-t border-slate-200">Tổng</td>
                                <td className="px-3 py-1 text-xs text-right font-mono border-t border-slate-200">
                                  {fmt(r.khoaDeXuat.reduce((s, k) => s + k.soLuongGoc, 0))}
                                </td>
                                <td className="px-3 py-1 text-xs text-right font-mono font-semibold border-t border-slate-200">{fmt(r.tongToanVien)}</td>
                                <td className="px-3 py-1 border-t border-slate-200"></td>
                                <td className="px-3 py-1 border-t border-slate-200"></td>
                              </tr>
                            </tbody>
                          </table>
                          {phanBoDangSua?.maHang === r.ma_hang && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                              <span>Tổng phải giữ: <b>{fmt(phanBoDangSua.tongMoi)}</b></span>
                              <input value={phanBoDangSua.lyDo}
                                onChange={(e) => setPhanBoDangSua((p) => ({ ...p, lyDo: e.target.value }))}
                                placeholder="Lý do (bắt buộc nếu khoa đã chốt)"
                                className="min-w-72 rounded border border-slate-300 px-2 py-1" />
                              <button type="button" disabled={dangLuu} onClick={luuPhanBoTay}
                                className="rounded bg-umc-700 px-2.5 py-1 font-semibold text-white disabled:opacity-50">
                                {dangLuu ? "Đang lưu…" : "Lưu phân bổ"}
                              </button>
                              <button type="button" onClick={() => setPhanBoDangSua(null)}
                                className="px-2 py-1 text-slate-500">Huỷ</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </FragmentRow>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-800 text-slate-300 text-xs px-4 py-1.5 flex items-center justify-between shrink-0">
        <div>{tongMaHang} mã hàng · {rowMoRong.size} dòng đang mở · {cotLocked.size} cột lock · {dongLocked.size} dòng lock</div>
        <div>Số liệu + sửa ô/khoá đều lưu thật (Supabase) · audit theo ô · Cột theo "Tổng hợp danh mục đề xuất chuẩn pdd.xlsx"</div>
      </div>

      <StyleToolbar />

      {/* Panel "các khoa đã ghi gì vào ô này".
          PĐD duyệt bằng cách GÕ TAY vào ô (quyết định 19/08/2026), panel này
          chỉ để nhìn — nhưng phải nhìn được thì mới gõ đúng. */}
      <AnimatePresence>
        {khoaGhiDangXem && (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="fixed right-4 top-20 w-96 max-h-[70vh] bg-white border border-slate-200 rounded-lg shadow-xl z-50 flex flex-col"
          >
            <div className="flex items-start justify-between gap-2 px-3 py-2 border-b border-slate-100">
              <div className="text-xs min-w-0">
                <div className="font-semibold text-slate-800">Các khoa đã ghi</div>
                <div className="text-slate-500 truncate">
                  Mã {khoaGhiDangXem.maHang} · {khoaGhiDangXem.nhan}
                </div>
              </div>
              <button type="button" onClick={() => setKhoaGhiDangXem(null)}
                className="shrink-0 text-[11px] rounded border border-slate-300 px-2 py-0.5 text-slate-600 hover:bg-slate-50">
                Đóng
              </button>
            </div>
            <div className="overflow-y-auto p-3 space-y-2">
              {khoaGhiDangXem.ds.map((x, i) => (
                <div key={`${x.khoa}-${i}`} className="rounded border border-slate-200 px-2 py-1.5">
                  <p className="text-[11px] font-medium text-slate-700">{x.khoa}</p>
                  <p className="mt-0.5 text-[11px] text-slate-900 whitespace-pre-wrap">{x.giaTri}</p>
                </div>
              ))}
              <p className="text-[10px] text-slate-500">
                Gõ giá trị duyệt thẳng vào ô trên bảng. Sau khi duyệt, mọi khoa
                nhận giá trị đó và ô bên khoa thành chỉ đọc.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel lịch sử sửa 1 ô */}
      <AnimatePresence>
        {audit && (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="fixed right-4 top-20 bottom-4 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
              <div className="text-xs">
                <div className="font-semibold text-slate-800">Lịch sử sửa ô</div>
                <div className="text-slate-400">{audit.maHang} · {cotDayDu.find((c) => c.key === audit.cot)?.nhan || audit.cot}</div>
              </div>
              <button onClick={() => setAudit(null)} className="text-slate-400 hover:text-slate-700 text-xs">Đóng</button>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {audit.dangTai ? (
                <p className="text-xs text-slate-400">Đang tải...</p>
              ) : audit.loi ? (
                <p className="text-xs text-red-600">{audit.loi}</p>
              ) : audit.dsAudit.length === 0 ? (
                <p className="text-xs text-slate-400">Chưa có lần sửa nào.</p>
              ) : (
                audit.dsAudit.map((a, i) => (
                  <div key={i} className="text-xs border-b border-slate-100 pb-2">
                    <div className="text-slate-400">{new Date(a.thoi_gian).toLocaleString("vi-VN")} · {a.nguoi_sua}</div>
                    <div className="mt-0.5">
                      <span className="text-slate-400 line-through">{a.gia_tri_cu ?? "(trống)"}</span>
                      {" → "}
                      <span className="text-slate-800 font-medium">{a.gia_tri_moi ?? "(trống)"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <HopNhapRot mo={formRot} onDong={() => setFormRot(null)}
        onXong={async () => { await thau.taiLaiThau(); await taiLai(); }} />
      <HopDoSangMa mo={formDoMa} dsAnhEm={dsMaAnhEm} onDong={() => setFormDoMa(null)}
        onXong={async () => { await thau.taiLaiThau(); await taiLai(); }} />
    </div>
  );
}

// Fragment mà chấp nhận key — Motion cần key để animate. Dùng React Fragment
// bình thường trả về array 2 <tr>.
function FragmentRow({ children }) {
  return <>{children}</>;
}
