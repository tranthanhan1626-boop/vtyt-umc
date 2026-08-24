import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EyeOff, ChevronLeft, ChevronDown as ChevronDownIcon, Download, Search, ExternalLink, XCircle, PackagePlus, RefreshCw, AlertTriangle, Lock, LockOpen, Pin, CheckCircle2, Unlock, History, AlignLeft } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";
import { tinhTuyChonMuaThem30 } from "../lib/tuyChonMuaThem";
import { daiP50P75, doDaiKyMacDinh } from "../lib/congThucSoLuong";
import {
  COT_KHOA, NHOM_COT_KHOA, GOI_ID_MAP, sapXepFreezeTruoc, tinhLeftFreeze,
  tinhSegmentsGroup, taoCotLichSu, thayCotLichSu, suyRaNamCoDuLieu,
  taoCotLichSuNhom, chenCotLichSuNhom, cotKhoaSangPdd, cotPddSangKhoa,
} from "../lib/cotChuan";
import { xuatExcelDong, tenFileAnToan } from "../lib/xuatExcelDong";
import { docTenCotTuMau, ganTenMau } from "../lib/tenCotBieuMau";
import { gomTheoThang } from "../lib/lichSuSuDung";
import { taiDotIdCuaGoi, locTheoDot } from "../lib/dotBoSung";

/*
 * DanhMucDeXuatKhoa — Bản chính thức 34 cột của MỘT khoa (mục 3.2 tài liệu
 * nghiệp vụ). Cấu trúc cột y chang file mẫu bệnh viện "Danh mục đề xuất khoa
 * chuẩn.xlsx", chỉ hiển thị số của khoa đang xem (`sl_de_xuat_18t`).
 *
 * DỮ LIỆU 06/08/2026 — nối THẬT (trước đó 100% MOCK_ROWS):
 *   proposals (đúng khoa) + vat_tu + nhom_ky_thuat + usage_history_current
 *   (lọc đúng khoa) + goi_thau_ket_qua_ma (kết quả thầu, mục 6 "kết quả
 *   trúng/rớt chảy ngược về khoa").
 *
 * MỚI: mục 4.3 "rớt 1 phần" — ĐVSD đẩy SL của mã rớt sang mã hàng tương
 * đương CÙNG mã quản lý CÒN TRÚNG, tổng mã quản lý giữ nguyên (chặn cứng ở
 * RPC day_so_luong_rot, xem patch_ze). "Rớt hoàn toàn" / thêm vào giỏ bổ
 * sung vẫn xử lý ở Tiến độ gói thầu (TienDoGoiThau.jsx) — không lặp lại ở
 * đây, chỉ hiển thị dấu rớt + link sang đó.
 *
 * CHƯA LÀM (để sau, ghi rõ để không quên):
 *   - sl_de_xuat_18t để READONLY ở đây — sửa số lượng TRƯỚC đấu thầu vẫn làm
 *     ở Function1.jsx (đã thật). Sau đấu thầu, đường sửa số DUY NHẤT là đẩy
 *     SL (RPC, có chặn tổng mã quản lý), không mở lại ô số tự do ở đây.
 *   - (LỖI THỜI, sửa 19/08/2026) Hai gạch đầu dòng cũ ở đây viết rằng cột chữ
 *     của khoa "chỉ lưu state cục bộ, CHƯA có bảng lưu thật" và "live sync giá
 *     trị PĐD chưa nối". Cả hai đều đã xong: `danh_muc_khoa_o` lưu thật từ
 *     patch_zm, và từ 19/08/2026 giá trị PĐD duyệt trên bản Tổng hợp trở
 *     thành GIÁ TRỊ CHÍNH của ô bên khoa (patch_zzzzp), ô đó thành chỉ đọc.
 *     Ngoại lệ: `giai_trinh_2627` không nhận giá trị duyệt — giải trình là
 *     tiếng nói của từng khoa.
 *   - Cột KHÔNG CÓ NGUỒN DỮ LIỆU THẬT (mã HIS cũ, Thông tư 04, mã kỹ thuật,
 *     lý do rớt DC2025, thương mại tham khảo 2025-2026...) — để trống thay
 *     vì bịa, xem NGUON_KHONG_CO_KHOA.
 */

// Cột KHÔNG nhận giá trị duyệt của PĐD — khoa giữ bản của mình.
// Khớp với `cot_khong_link_xuong_khoa()` bên SQL (patch_zzzzp); sửa một bên
// thì phải sửa cả bên kia.
const COT_KHONG_NHAN_DUYET = new Set(["giai_trinh_2627", "sl_de_xuat_18t"]);


/** Ô PĐD nào được ưu tiên khi một mã có bản ghi ở nhiều đợt: đợt đang mở
 *  thắng, sau đó tới bản mới nhất. */
function thangTruoc(r, cu, goiScope) {
  if (r.goi_id === goiScope) return true;
  if (cu.goi_id === goiScope) return false;
  return String(r.updated_at) > String(cu.updated_at);
}

const NGUON_KHONG_CO_KHOA = new Set([
  "his_1599", "his_957", "ma_tt04", "ten_tt04", "ma_his_2023",
  "ten_vt_2526", "tskt_2526", "ly_do_rot_2025", "ly_do_rot_ct",
  "ten_tm_2526", "ma_sp_2526", "hang_sx_2526", "nuoc_sx_2526", "ma_kt",
]);

// V2 (19/08/2026) — cột số KHÔNG còn chỉ đọc ở màn này. Chủ dự án: khoa sửa
// số ngay trên Danh mục đề xuất của khoa, tổng đi thầu là phép cộng của các
// khoa. Vẫn phải có `dot_goi_id` mới sửa được: chỉ đường v3 (`phan_bo_khoa`)
// mới có RPC ghi số; đợt cũ đọc từ `proposals` thì không có chỗ ghi.
const COT_SO_KHOA = "sl_de_xuat_18t";

const NHAN_GIAI_DOAN = { chao_gia: "Chào giá", mo_thau: "Mở thầu", danh_gia: "Đánh giá" };

function monthId(nam, thang) { return nam * 12 + thang - 1; }
function tongKhoang(theoThang, dau, cuoi) {
  let s = 0;
  for (let m = dau; m <= cuoi; m += 1) s += theoThang.get(m) || 0;
  return s;
}

const NAM_DE_XUAT = new Date().getFullYear() + 1;

/** Tải dữ liệu thật cho 1 khoa + 1 gói con: proposals (đúng khoa) + vat_tu +
 * nhom_ky_thuat + usage_history_current (lọc đúng khoa). */
async function taiDuLieuKhoa(goiId, khoa, dotId = null) {
  const bo = GOI_ID_MAP[goiId] || GOI_ID_MAP["18t-dung-chung"];
  if (!khoa) return { bo, rows: [] };
  let dotGoiId = null;
  if (dotId) {
    const { data: dg, error: loiDotGoi } = await supabase.from("dot_goi")
      .select("id").eq("dot_id", Number(dotId)).eq("goi_id", goiId).maybeSingle();
    if (loiDotGoi) throw loiDotGoi;
    dotGoiId = dg?.id || null;
  }

  // Xem chú thích cùng chỗ ở TongHopPdd.jsx — lọc đúng đợt bổ sung (patch_zt).
  const dsDotId = await taiDotIdCuaGoi(bo);
  let qProposals;
  let laPhanBoV3 = false;
  if (dotGoiId) {
    laPhanBoV3 = true;
    qProposals = supabase.from("phan_bo_khoa")
      .select("proposal_id, ma_hang, so_luong_hien_hanh, so_luong_goc")
      .eq("dot_goi_id", dotGoiId).eq("khoa", khoa);
  } else {
    qProposals = supabase.from("proposals")
      .select("id, ma_hang, so_luong, dot_id")
      .eq("nam_de_xuat", NAM_DE_XUAT).eq("is_current", true)
      .eq("loai_mua_sam", bo.loai_mua_sam).eq("don_vi", khoa);
    if (bo.goi) qProposals = qProposals.eq("goi", bo.goi);
  }
  // `dot_id` là ranh giới nghiệp vụ cuối cùng. Một gói 18 tháng có thể có
  // nhiều kỳ kế tiếp nhau và ba đợt bổ sung cùng loại cũng phải tuyệt đối tách
  // nhau; không được chỉ lọc theo `loai_mua_sam` rồi để kết quả rớt lẫn kỳ.
  if (!laPhanBoV3) qProposals = dotId ? qProposals.eq("dot_id", Number(dotId)) : locTheoDot(qProposals, dsDotId);
  const { data: propRows, error: loiProposals } = await fetchAllRows((f, t) => qProposals.range(f, t), { order: "id" });
  if (loiProposals) throw loiProposals;
  if (!propRows?.length) return { bo, rows: [], dotGoiId };

  const propTheoMa = new Map(propRows.map((r) => [r.ma_hang, r]));
  const dsMaHang = [...propTheoMa.keys()];

  const { data: vatTuRows, error: loiVatTu } = await fetchAllRows((f, t) =>
    supabase.from("vat_tu")
      .select("ma_hang, ten_vat_tu, dvt, ma_quan_ly, tieu_chi_ky_thuat, ten_thuong_mai, ky_ma_hieu, hang, nuoc_san_xuat")
      .in("ma_hang", dsMaHang).range(f, t), { order: "ma_hang" });
  if (loiVatTu) throw loiVatTu;
  const vatTuTheoMa = new Map((vatTuRows || []).map((v) => [v.ma_hang, v]));

  const dsMaQuanLy = [...new Set((vatTuRows || []).map((v) => v.ma_quan_ly).filter(Boolean))];

  // Ba truy vấn độc lập nhau — chạy song song thay vì cộng dồn 3 lượt chờ mạng.
  const [nhomRes, usageRes, nhomNamRes] = await Promise.all([
    dsMaQuanLy.length
      ? fetchAllRows((f, t) => supabase.from("nhom_ky_thuat")
          .select("ma_quan_ly, ten_quan_ly").in("ma_quan_ly", dsMaQuanLy).range(f, t), { order: "ma_quan_ly" })
      : Promise.resolve({ data: [] }),
    // Màn này CÓ lọc theo khoa nên vẫn đọc thẳng bảng gốc (không dùng view gộp
    // toàn viện của patch_zr — view đó bỏ mất chiều khoa).
    fetchAllRows((f, t) => supabase.from("usage_history_current")
      .select("ma_hang, nam, thang, so_luong")
      .in("ma_hang", dsMaHang).eq("don_vi", khoa).range(f, t), { order: "id" }),
    // Lịch sử tổng CẢ NHÓM mã quản lý, vẫn chỉ tính phần của KHOA này (cột lịch
    // sử ở màn này là "của khoa"). Vì sao cần: các mã hàng trong cùng mã quản lý
    // thay thế nhau qua từng kỳ hợp đồng, nhìn riêng 1 mã sẽ tưởng nhu cầu tụt —
    // xem ví dụ mã 62993 trong patch_zp. Chưa chạy patch thì để trống, không vỡ.
    dsMaQuanLy.length
      ? fetchAllRows((f, t) => supabase.from("v_lich_su_nhom_nam_khoa")
          .select("ma_quan_ly, nam, so_luong")
          .eq("don_vi", khoa).in("ma_quan_ly", dsMaQuanLy).range(f, t), { order: ["ma_quan_ly", "nam"] })
      : Promise.resolve({ data: [] }),
  ]);

  const tenNhomTheoMa = new Map((nhomRes.data || []).map((n) => [n.ma_quan_ly, n.ten_quan_ly]));

  if (usageRes.error) throw usageRes.error;
  const usageRows = usageRes.data;
  const usageTheoMa = gomTheoThang(usageRows, monthId);

  // Năm nào ĐANG CÓ dữ liệu thì có cột đó — không đóng đinh 2022..2025 theo
  // biểu mẫu kỳ 2026-2027 nữa (xem taoCotLichSu trong cotChuan.js).
  const dsNamCoDuLieu = suyRaNamCoDuLieu(usageRows);
  // Mốc cuối cửa sổ phải là tháng HIS MỚI NHẤT CHUNG, không phải tháng gần
  // nhất của riêng từng mã — bẫy đã đo trên mã 67340, xem chuoiNhuCau().
  const namCuoi = dsNamCoDuLieu[dsNamCoDuLieu.length - 1];
  const thangCuoiHIS = namCuoi ? monthId(namCuoi.nam, namCuoi.thangCuoi) : null;
  const soThangKy = doDaiKyMacDinh(bo.loai_mua_sam);

  const nhomNamTheoMa = new Map();
  (nhomNamRes.data || []).forEach((r) => {
    if (!nhomNamTheoMa.has(r.ma_quan_ly)) nhomNamTheoMa.set(r.ma_quan_ly, new Map());
    nhomNamTheoMa.get(r.ma_quan_ly).set(Number(r.nam), Number(r.so_luong) || 0);
  });

  const rows = dsMaHang.map((maHang) => {
    const vt = vatTuTheoMa.get(maHang) || {};
    const prop = propTheoMa.get(maHang);
    const theoThang = usageTheoMa.get(maHang) || new Map();
    const tongNam = (nam) => tongKhoang(theoThang, monthId(nam, 1), monthId(nam, 12));
    const slDeXuat = Number(laPhanBoV3 ? prop.so_luong_hien_hanh : prop.so_luong) || 0;
    // Giai đoạn 4 của workflow: "Khoa thấy số cũ, số mới, người sửa và lý do
    // ngay trên bảng của mình." `so_luong_goc` là số khoa đã gửi, không bao
    // giờ bị ghi đè; lệch với số hiện hành nghĩa là PĐD đã điều chỉnh.
    const slGoc = laPhanBoV3 ? Number(prop.so_luong_goc) || 0 : slDeXuat;
    const row = {
      stt: 0, stt_co_dinh: 0,
      ma_nhom: vt.ma_quan_ly || null,
      ten_nhom_ql: vt.ma_quan_ly ? (tenNhomTheoMa.get(vt.ma_quan_ly) || null) : null,
      ten_vt_2627: vt.ten_vat_tu || maHang,
      tskt_2627: vt.tieu_chi_ky_thuat || null,
      quy_cach: null,
      dvt: vt.dvt || null,
      // Cột lịch sử theo đúng các năm đang có dữ liệu; năm còn dở chỉ cộng
      // tới tháng cuối THẬT của năm đó.
      ...Object.fromEntries(dsNamCoDuLieu.map(({ nam, thangCuoi }) => [
        `sl_${nam}`,
        tongKhoang(theoThang, monthId(nam, 1), monthId(nam, thangCuoi)) || null,
      ])),
      ...Object.fromEntries(dsNamCoDuLieu.map(({ nam }) => [
        `sl_nhom_${nam}`,
        (vt.ma_quan_ly ? nhomNamTheoMa.get(vt.ma_quan_ly)?.get(nam) : null) || null,
      ])),
      sl_de_xuat_18t: slDeXuat,
      // Dải P50–P75 của CHÍNH KHOA NÀY (chuỗi dùng đã lọc theo khoa từ đầu
      // hàm). Giữ hai đầu dải dạng số chứ không dựng sẵn chuỗi: số đề xuất sửa
      // được ngay trên bảng, cờ vượt dải phải tính lại theo số đang gõ.
      ...(() => {
        const d = daiP50P75(theoThang, soThangKy, slDeXuat, thangCuoiHIS);
        return { _daiTu: d?.tu ?? null, _daiDen: d?.den ?? null };
      })(),
      _sl_goc: slGoc,
      _pdd_da_sua: laPhanBoV3 && slGoc !== slDeXuat,
      mua_them_30: tinhTuyChonMuaThem30(slDeXuat),
      giai_trinh_2627: "",
      ten_tm_2627: vt.ten_thuong_mai || null,
      ma_sp_2627: vt.ky_ma_hieu || null,
      hang_sx_2627: vt.hang || null,
      nuoc_sx_2627: vt.nuoc_san_xuat || null,
      ma_hang: maHang,
      proposalId: laPhanBoV3 ? prop.proposal_id : prop.id,
      dotId: dotId ? Number(dotId) : prop.dot_id,
      rot: null,
    };
    NGUON_KHONG_CO_KHOA.forEach((k) => { row[k] = null; });
    return row;
  });

  rows.sort((a, b) =>
    (a.ma_nhom || "zzz").localeCompare(b.ma_nhom || "zzz", "vi")
    || a.ten_vt_2627.localeCompare(b.ten_vt_2627, "vi"));
  rows.forEach((r, i) => { r.stt = i + 1; r.stt_co_dinh = i + 1; });

  return { bo, rows, dsMaHang, dsNamCoDuLieu, dotGoiId };
}

/** Tải kết quả thầu (mục 6) — chỉ dòng của đúng khoa (RLS tự giới hạn). */
async function taiKetQuaThau(loaiMuaSam, khoa, dsMaHang, dotId = null) {
  if (!dsMaHang?.length) return new Map();
  const { data, error } = await fetchAllRows((f, t) => {
    let q = supabase.from("v_ket_qua_thau_theo_khoa")
      .select("goi_id, ten_goi, ma_hang, ket_qua, ma_moc_rot, ly_do_khong_trung, so_luong_de_xuat, so_luong_thieu, da_xu_ly, ket_qua_id")
      .eq("don_vi", khoa).eq("loai_mua_sam", loaiMuaSam).eq("ket_qua", "khong_trung")
      .in("ma_hang", dsMaHang);
    if (dotId) q = q.eq("dot_id", Number(dotId));
    return q.range(f, t);
  }, { order: "ket_qua_id" });
  if (error) throw error;
  const m = new Map();
  (data || []).forEach((r) => m.set(r.ma_hang, r));
  return m;
}

export default function DanhMucDeXuatKhoa({ goiId = "18t-dung-chung", khoa, profile, dotId = null }) {
  const khoaHienTai = khoa || profile?.khoa || "";
  const laPdd = profile?.role === "dieu_duong" || profile?.role === "admin";

  const [boThau, setBoThau] = useState(GOI_ID_MAP[goiId] || GOI_ID_MAP["18t-dung-chung"]);
  const [rows, setRows] = useState([]);
  // Giai đoạn 4 — minh bạch PĐD ↔ khoa. `phan_bo_khoa_audit` giữ số cũ, số
  // mới, người sửa và lý do; khoa phải đọc được ngay trên bảng của mình chứ
  // không phải hỏi qua Teams.
  const [dieuChinhPdd, setDieuChinhPdd] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [dangChonMaDay, setDangChonMaDay] = useState(null); // ma_hang đang mở form đẩy SL
  const [ungVienDay, setUngVienDay] = useState({ dangTai: false, ds: [] });
  const [formDay, setFormDay] = useState({ maHangNhan: "", soLuong: "" });
  const [dangLuuDay, setDangLuuDay] = useState(false);
  const [thongBaoDay, setThongBaoDay] = useState("");
  const [dangXuatExcel, setDangXuatExcel] = useState(false);
  const [loiXuatExcel, setLoiXuatExcel] = useState("");
  const [dsNamCoDuLieu, setDsNamCoDuLieu] = useState([]);
  const [loiLuuO, setLoiLuuO] = useState("");
  const [oDaSua, setODaSua] = useState(new Map()); // "maHang|cot" -> true
  const [trangThaiChot, setTrangThaiChot] = useState(null); // {chot_boi, chot_luc} | null
  const [dangChot, setDangChot] = useState(false);
  const [loiChot, setLoiChot] = useState("");
  const [dotGoiId, setDotGoiId] = useState(null);

  const [oDangChon, setODangChon] = useState(null);
  const [openMenuCot, setOpenMenuCot] = useState(false);
  // Lịch sử sửa từng ô — giống Danh mục tổng hợp PĐD (TongHopPdd.jsx). Bảng
  // audit `danh_muc_khoa_o_audit` đã có sẵn từ patch_zm (trigger tự ghi mỗi
  // lần giá trị một ô THỰC SỰ đổi), trước giờ chỉ chưa có chỗ nào xem được.
  const [audit, setAudit] = useState(null); // { maHang, cot, dsAudit, dangTai, loi }
  // Ô PĐD đã sửa đè trên bản tổng hợp: Map<ma_hang, Map<cot_pdd, {gia_tri,...}>>
  const [suaDeCuaPdd, setSuaDeCuaPdd] = useState(new Map());
  // Mặc định hiện ĐẦY ĐỦ nội dung mọi ô (wraptext) — xem StyleTable.
  // Mặc định ĐẦY ĐỦ — chủ dự án chốt: mọi thông tin phải hiện đủ, wraptext
  // nguyên vẹn, không cắt dòng. Hàng cao thấp không đều là chấp nhận được;
  // đọc thiếu nội dung thì không. Nút "Nội dung ô" trên thanh công cụ vẫn cho
  // chuyển sang GỌN khi cần lướt nhanh qua nhiều mã.
  const [dongGon, setDongGon] = useState(false);
  // Cấu hình cột dùng CHUNG theo (goiId, năm, khoa), lưu server qua
  // danh_muc_khoa_cot_cau_hinh (patch_zh + patch_zi). Cả ĐVSD và PĐD tick
  // được; { [colKey]: { an, khoa_cot, khoa_sua } }.
  //   an       = ẩn cột khỏi bảng
  //   khoa_cot = GHIM cột khi cuộn ngang (freeze) — vẫn sửa được nội dung
  //   khoa_sua = KHÓA SỬA — không ai sửa ô trong cột, phải mở khóa trước
  // Không có dòng cho cột nào -> dùng mặc định của COT_KHOA.
  const [cauHinhCot, setCauHinhCot] = useState({});
  const [loiCauHinhCot, setLoiCauHinhCot] = useState("");
  // Staging chưa chạy patch_zi -> cột khoa_sua chưa tồn tại. Không để app vỡ:
  // lùi về đọc/ghi không có cột này (giống pattern he_so_quy_doi ở Function1).
  const [coCotKhoaSua, setCoCotKhoaSua] = useState(true);

  const thongBaoLoiCauHinhCot = (error) => {
    if (error.code === "42P01" || /danh_muc_khoa_cot_cau_hinh/i.test(error.message || "")) {
      return "Staging chưa có bảng ẩn/khóa cột dùng chung. Cần chạy backend/sql/patch_zh_danh_muc_khoa_cot_cau_hinh.sql.";
    }
    if (/khoa_sua/i.test(error.message || "")) {
      return "Staging chưa có chức năng khóa sửa cột. Cần chạy backend/sql/patch_zi_khoa_sua_cot.sql.";
    }
    return error.message;
  };

  const taiCauHinhCot = useCallback(async () => {
    if (!goiId || !khoaHienTai) return;
    const doc = (cot) => supabase.from("danh_muc_khoa_cot_cau_hinh").select(cot)
      .eq("goi_id", goiId).eq("nam_de_xuat", NAM_DE_XUAT).eq("khoa", khoaHienTai);
    let coKhoaSua = true;
    let { data, error } = await doc("cot, an, khoa_cot, khoa_sua");
    if (error && /khoa_sua/i.test(error.message || "")) {
      coKhoaSua = false;
      ({ data, error } = await doc("cot, an, khoa_cot"));
    }
    setCoCotKhoaSua(coKhoaSua);
    if (error) {
      setLoiCauHinhCot(thongBaoLoiCauHinhCot(error));
      return;
    }
    setLoiCauHinhCot("");
    const map = {};
    (data || []).forEach((r) => {
      map[r.cot] = { an: r.an, khoa_cot: r.khoa_cot, khoa_sua: r.khoa_sua ?? false };
    });
    setCauHinhCot(map);
  }, [goiId, khoaHienTai]);

  useEffect(() => { taiCauHinhCot(); }, [taiCauHinhCot]);

  const luuCauHinhCot = async (colKey, patch) => {
    // Chưa chạy patch_zi mà bấm khóa sửa: KHÔNG âm thầm bỏ qua (người dùng
    // thấy ô đổi màu, tưởng đã khóa, F5 lại mất) — báo rõ và không đụng state.
    if (patch.khoa_sua !== undefined && !coCotKhoaSua) {
      setLoiCauHinhCot("Staging chưa có chức năng khóa sửa cột. Cần chạy backend/sql/patch_zi_khoa_sua_cot.sql.");
      return;
    }
    const hienTai = cauHinhCot[colKey] || {};
    const macDinhFreeze = cotDayDu.find((c) => c.key === colKey)?.freeze || false;
    const an = patch.an ?? hienTai.an ?? false;
    const khoa_cot = patch.khoa_cot ?? hienTai.khoa_cot ?? macDinhFreeze;
    const khoa_sua = patch.khoa_sua ?? hienTai.khoa_sua ?? false;
    setCauHinhCot((prev) => ({ ...prev, [colKey]: { an, khoa_cot, khoa_sua } })); // optimistic
    const { error } = await supabase.from("danh_muc_khoa_cot_cau_hinh")
      .upsert({
        goi_id: goiId, nam_de_xuat: NAM_DE_XUAT, khoa: khoaHienTai, cot: colKey,
        an, khoa_cot, updated_by: profile?.email || khoaHienTai,
        ...(coCotKhoaSua ? { khoa_sua } : {}),
      }, { onConflict: "goi_id,nam_de_xuat,khoa,cot" });
    if (error) {
      setLoiCauHinhCot(thongBaoLoiCauHinhCot(error));
      setCauHinhCot((prev) => ({ ...prev, [colKey]: hienTai })); // rollback
    }
  };

  const anCot = (colKey) => luuCauHinhCot(colKey, { an: true });
  const daKhoaSua = (colKey) => cauHinhCot[colKey]?.khoa_sua ?? false;
  const doiKhoaSua = (colKey) => luuCauHinhCot(colKey, { khoa_sua: !daKhoaSua(colKey) });
  const hienTatCaCot = () => {
    Object.entries(cauHinhCot)
      .filter(([, v]) => v.an)
      .forEach(([colKey]) => luuCauHinhCot(colKey, { an: false }));
  };

  // ---- VÒNG XÁC NHẬN (V2, 19/08/2026) --------------------------------------
  // Thay cho "khoa chốt danh mục". Khác ở chỗ căn bản: xác nhận KHÔNG khoá ô
  // nào, nó chỉ trả lời "khoa đã ngó qua bản hiện tại chưa". Ai sửa dữ liệu
  // của mã khoa đó đề xuất — kể cả chính khoa — thì xác nhận mất hiệu lực và
  // lần sau bấm là lần N+1. PĐD không chốt số đi thầu được khi còn khoa chưa
  // xác nhận (chặn cứng ở DB, patch_zzzzu).
  const taiTrangThaiChot = useCallback(async () => {
    if (!goiId || !khoaHienTai) return;
    let q = supabase.from("danh_muc_khoa_chot")
      .select("chot_boi, chot_luc, khong_phat_sinh, lan, hieu_luc, huy_luc, huy_do")
      .eq("khoa", khoaHienTai);
    q = dotGoiId
      ? q.eq("dot_goi_id", dotGoiId)
      : q.eq("goi_id", goiId).eq("nam_de_xuat", NAM_DE_XUAT);
    const { data, error } = await q.maybeSingle();
    if (error) {
      const chuaCoBang = error.code === "42P01" || /danh_muc_khoa_chot/i.test(error.message || "");
      setLoiChot(chuaCoBang
        ? "Staging chưa có chức năng chốt danh mục v3. Cần chạy patch_zzzzb_v3_chot_q.sql."
        : error.message);
      return;
    }
    setLoiChot("");
    setTrangThaiChot(data || null);
  }, [goiId, khoaHienTai, dotGoiId]);

  useEffect(() => { taiTrangThaiChot(); }, [taiTrangThaiChot]);

  const xacNhanDeXuat = async (khongPhatSinh = false) => {
    setDangChot(true);
    setLoiChot("");
    if (!dotGoiId) {
      setLoiChot("Chưa xác định được DOT_GOI của danh mục này.");
      setDangChot(false);
      return;
    }
    const { error } = await supabase.rpc("chot_danh_muc_khoa_v3", {
      p_dot_goi_id: dotGoiId, p_khong_phat_sinh: khongPhatSinh,
      ...(laPdd ? { p_khoa: khoaHienTai } : {}),
    });
    if (error) {
      const chuaCoBang = error.code === "42P01" || /danh_muc_khoa_chot/i.test(error.message || "");
      setLoiChot(chuaCoBang
        ? "Staging chưa có chức năng xác nhận. Cần chạy patch_zzzzu_v2_vong_xac_nhan.sql."
        : error.message);
    } else {
      await taiTrangThaiChot();
    }
    setDangChot(false);
  };

  // Đã xác nhận và xác nhận đó CÒN hiệu lực. Có dòng mà `hieu_luc` false nghĩa
  // là dữ liệu đã đổi sau lần bấm trước — phải bấm lại.
  const daXacNhan = !!trangThaiChot?.hieu_luc;
  const lanKe = trangThaiChot ? (trangThaiChot.hieu_luc ? trangThaiChot.lan : trangThaiChot.lan + 1) : 1;

  // Bộ cột thật của màn này = COT_KHOA nhưng khối "lịch sử sử dụng" được thay
  // bằng đúng những năm đang có dữ liệu.
  const cotDayDu = useMemo(
    () => chenCotLichSuNhom(
      thayCotLichSu(COT_KHOA, taoCotLichSu(dsNamCoDuLieu)),
      taoCotLichSuNhom(dsNamCoDuLieu)
    ),
    [dsNamCoDuLieu]
  );

  const cotHienThi = useMemo(
    () => sapXepFreezeTruoc(
      cotDayDu
        .filter((c) => !(cauHinhCot[c.key]?.an ?? false))
        .map((c) => ({ ...c, freeze: cauHinhCot[c.key]?.khoa_cot ?? c.freeze }))
    ),
    [cauHinhCot, cotDayDu]
  );
  const groupSegments = useMemo(
    () => tinhSegmentsGroup(cotHienThi, NHOM_COT_KHOA),
    [cotHienThi]
  );

  // ---- Lưu THẬT giá trị ô (patch_zm) --------------------------------------
  // Trước 07/08/2026 các ô chữ ở màn này chỉ nằm trong state trình duyệt —
  // đóng tab là mất trắng. Giờ lưu server, 1 dòng cho mỗi (khoa, mã hàng) với
  // cột JSONB gom mọi ô đã sửa (xem lý do chọn JSONB thay vì mỗi-ô-một-dòng
  // trong patch_zm: rẻ hơn ~15 lần, cần thiết để ở lại gói Supabase free).
  const taiODaLuu = useCallback(async () => {
    if (!goiId || !khoaHienTai) return new Map();
    // patch_zzzzw — PHẢI lọc theo `dot_goi_id`. Trước đây khoá đọc chỉ có
    // (goi_id, nam, khoa) nên đợt MỚI đọc trúng giải trình của đợt CŨ; với gói
    // bổ sung thì cả 3 đợt/năm dùng chung goi_id 'bo-sung' và cùng năm, tức ba
    // đợt xài chung một dòng. Chưa có DOT_GOI thì không đọc gì, hơn là đọc bừa.
    if (!dotGoiId) return new Map();
    const { data, error } = await supabase.from("danh_muc_khoa_o")
      .select("ma_hang, gia_tri")
      .eq("dot_goi_id", dotGoiId).eq("khoa", khoaHienTai);
    if (error) {
      const chuaCoBang = error.code === "42P01" || /danh_muc_khoa_o/i.test(error.message || "");
      setLoiLuuO(chuaCoBang
        ? "Staging chưa có chức năng lưu ô. Cần chạy backend/sql/patch_zm_luu_o_danh_muc_khoa.sql — sửa ô lúc này sẽ MẤT khi đóng tab."
        : error.message);
      return new Map();
    }
    setLoiLuuO("");
    return new Map((data || []).map((r) => [r.ma_hang, r.gia_tri || {}]));
  }, [goiId, khoaHienTai, dotGoiId]);

  // ---- Minh bạch: PĐD sửa gì trên bản tổng hợp, khoa thấy hết (patch_zs) ---
  // QĐ 08/08/2026 của chủ dự án. Trước patch_zs, dvsd không có policy nào trên
  // danh_muc_tong_hop_o nên đọc ra rỗng — khoa nộp số này, đi thầu số khác mà
  // không biết. Giờ mở ĐỌC (vẫn không cho ghi).
  //
  // LỖI 24 (19/08/2026): bản TỔNG HỢP ghi `goi_id` có hậu tố ':dot:N'
  // (`goiScope` ở TongHopPdd.jsx:304), bản KHOA thì không. So `.eq(goi_id,
  // goiId)` ở đây nên KHÔNG BAO GIỜ khớp — PĐD duyệt TSKT trên Tổng hợp mà
  // bên khoa vẫn hiện giá trị cũ, không viền tím, không khoá ô. Trigger
  // `fn_khoa_o_khoa_khi_pdd_da_duyet` thì so bằng `split_part(goi_id,
  // ':dot:', 1)` nên vẫn CHẶN — khoa thấy ô sửa được, gõ vào lại bị báo lỗi
  // "đã được Phòng Điều dưỡng duyệt". Đúng mẫu lỗi số 6 của dự án: tầng DB
  // đúng, tầng giao diện chưa nối.
  //
  // Lấy theo đúng cách trigger lấy: mọi bản ghi cùng gói con, bất kể đợt.
  // Ưu tiên đợt đang mở, sau đó tới bản mới nhất — khớp với ghi chú phạm vi
  // trong patch_zzzzp (ô khoa chưa neo theo `dot_goi_id`, xem mục E3).
  // Một chỗ duy nhất dựng khoá phạm vi của bản tổng hợp. Trước đây mỗi nơi tự
  // ghép một kiểu, và đó chính là Lỗi 24.
  const goiScopeTongHop = dotId ? `${goiId}:dot:${dotId}` : goiId;

  const taiSuaDeCuaPdd = useCallback(async () => {
    if (!goiId) return new Map();
    const { data, error } = await supabase.from("danh_muc_tong_hop_o")
      .select("goi_id, ma_hang, cot, gia_tri, updated_by, updated_at")
      .like("goi_id", `${goiId}%`).eq("nam_de_xuat", NAM_DE_XUAT);
    // Chưa chạy patch_zs -> RLS trả rỗng chứ không lỗi. Không cản trở gì, chỉ
    // là chưa thấy được phần PĐD sửa.
    if (error) return new Map();
    const goiScope = goiScopeTongHop;
    const m = new Map();
    (data || [])
      // `like` bắt cả gói con khác có cùng tiền tố tên; lọc lại cho chắc.
      .filter((r) => String(r.goi_id).split(":dot:")[0] === goiId)
      .forEach((r) => {
        if (!m.has(r.ma_hang)) m.set(r.ma_hang, new Map());
        const cua = m.get(r.ma_hang);
        const cu = cua.get(r.cot);
        if (cu && !thangTruoc(r, cu, goiScope)) return;
        cua.set(r.cot, r);
      });
    return m;
  }, [goiId, dotId]);

  const taiLai = useCallback(async () => {
    setDangTai(true);
    setLoi("");
    try {
      const { bo, rows: rowsGoc, dsMaHang, dsNamCoDuLieu: dsNam, dotGoiId: dgId } =
        await taiDuLieuKhoa(goiId, khoaHienTai, dotId);
      // 24/08/2026 — BẬT LẠI phần HIỂN THỊ kết quả thầu cho khoa.
      // `v_ket_qua_thau_theo_khoa` đã được viết lại trên nền v3 (patch_zzzzza)
      // nên đọc được thật. Chủ dự án yêu cầu: mọi thứ PĐD chỉnh trên Danh mục
      // tổng hợp đều phải thấy được ở Danh mục đề xuất của khoa.
      // Chỉ bật phần XEM. Nút "Đẩy SL" vẫn tắt — việc đó là của PĐD (QĐ D1/D3).
      // Ghi chú cũ (23/08) giữ lại để hiểu vì sao từng tắt:
      // `taiKetQuaThau` đọc `goi_thau_ket_qua_ma`, bảng của mô hình TRƯỚC v3:
      // 0 dòng và không có gì trong v3 ghi vào nữa, nên mọi thứ nó nuôi (dấu
      // rớt trên dòng, nút "Đẩy SL") là cửa dẫn vào ngõ cụt — khoa bấm là ăn
      // lỗi. Theo QĐ D1/D3, việc đổ số rớt sang mã tương đương nay là của PĐD
      // và làm trên bảng Tổng hợp. Khoa nhận mã rớt qua ĐỢT BỔ SUNG (cuốn
      // chiếu tự động) cộng thông báo trong hộp thư.
      // Giữ `taiKetQuaThau` lại, chưa xoá: nhánh sau (tiến độ gói thầu theo số
      // quyết định / số hợp đồng, QĐ D6) sẽ viết lại trên nền v3.
      const ketQuaTheoMa = dsMaHang?.length
        ? await taiKetQuaThau(bo.loai_mua_sam, khoaHienTai, dsMaHang, dotId)
        : new Map();
      const [oDaLuu, suaDePdd] = await Promise.all([taiODaLuu(), taiSuaDeCuaPdd()]);
      // V2: giá trị chung là giá trị DUY NHẤT, nên áp thẳng lên dòng thay vì
      // giữ song song rồi chọn lúc vẽ. Nhờ vậy ô gõ được như mọi ô khác —
      // bản cũ lấy giá trị PĐD lúc vẽ nên gõ vào không thấy chữ đổi.
      const apGiaTriChung = (dong) => {
        const cua = suaDePdd.get(dong.ma_hang);
        if (!cua) return;
        cua.forEach((o, cotPdd) => {
          const cotKhoa = cotPddSangKhoa(cotPdd);
          if (COT_KHONG_NHAN_DUYET.has(cotKhoa)) return;
          dong[cotKhoa] = o.gia_tri;
        });
      };
      setSuaDeCuaPdd(suaDePdd);
      setBoThau(bo);
      setDotGoiId(dgId || null);
      setDsNamCoDuLieu(dsNam || []);
      // Áp giá trị đã lưu ĐÈ lên số gốc hệ thống dựng ra.
      const daSua = new Map();
      // Khi khoa đã chuyển xong số lượng của một mã rớt sang mã tương đương,
      // mã nguồn không còn thuộc danh mục làm việc. Dấu vết rớt vẫn nằm ở
      // Tiến độ gói thầu; không giữ một dòng 0 gây hiểu nhầm là còn phải xử lý.
      const rowsDangHien = rowsGoc
        .filter((r) => !ketQuaTheoMa.get(r.ma_hang)?.da_xu_ly)
        .map((r) => {
        const ov = oDaLuu.get(r.ma_hang);
        const dong = { ...r, rot: ketQuaTheoMa.get(r.ma_hang) || null };
        if (ov) {
          Object.entries(ov).forEach(([cot, giaTri]) => {
            dong[cot] = giaTri;
            daSua.set(`${r.ma_hang}|${cot}`, true);
          });
        }
        apGiaTriChung(dong);
        return dong;
      });
      // Mã nguồn đã được xử lý không còn hiện trong danh mục làm việc. Đánh
      // lại STT sau khi lọc để Excel/web không bị 1, 2, 4, 5…; STT chỉ là số
      // thứ tự trình bày, không phải mã định danh hay dấu vết nghiệp vụ.
      rowsDangHien.forEach((r, i) => {
        r.stt = i + 1;
        r.stt_co_dinh = i + 1;
      });
      setRows(rowsDangHien);
      if (dotGoiId) {
        const { data: dsAudit } = await supabase
          .from("phan_bo_khoa_audit")
          .select("ma_hang, truoc, sau, tong_truoc, tong_sau, ly_do, nguoi_sua, thoi_gian")
          .eq("dot_goi_id", dotGoiId)
          .order("thoi_gian", { ascending: false });
        // Audit ghi theo MÃ HÀNG cho cả đợt; lọc lại còn đúng lần sửa có động
        // tới khoa đang xem.
        setDieuChinhPdd((dsAudit || []).filter((a) => (a.sau || {})[khoa] !== undefined));
      }
      setODaSua(daSua);
    } catch (e) {
      setLoi(e.message || "Không tải được dữ liệu.");
    } finally {
      setDangTai(false);
    }
  }, [goiId, khoaHienTai, dotId, taiODaLuu, taiSuaDeCuaPdd]);

  useEffect(() => { taiLai(); }, [taiLai]);


  // V2 (19/08/2026) — cột chữ là MỘT giá trị chung toàn viện, nên ghi thẳng
  // vào `danh_muc_tong_hop_o` chứ không còn bản riêng của khoa. Chỉ
  // `giai_trinh_2627` còn đi đường cũ: giải trình là tiếng nói của từng khoa.
  // patch_zzzzr mở RLS cho dvsd ghi bảng tổng hợp, giới hạn ở mã hàng khoa
  // thật sự có đề xuất trong đợt.
  const luuOLenServer = async (maHang, colKey, giaTri) => {
    const gt = giaTri == null ? "" : String(giaTri);
    const laGiaiTrinh = colKey === "giai_trinh_2627";

    // Cột SỐ đi đường riêng: `phan_bo_khoa` chứ không phải bảng ô sửa tay.
    // Qua RPC chứ không update thẳng — tổng là phép cộng nên hai khoa bấm cùng
    // lúc phải tuần tự hoá, và audit phải ghi trong cùng giao dịch.
    if (colKey === COT_SO_KHOA) {
      const soMoi = Number(String(gt).replace(/[^\d-]/g, ""));
      if (!Number.isInteger(soMoi) || soMoi < 0) {
        setLoiLuuO("Số lượng đề xuất phải là số nguyên không âm.");
        return;
      }
      const { error: loiSo } = await supabase.rpc("sua_so_luong_khoa_v3", {
        p_dot_goi_id: dotGoiId, p_ma_hang: maHang, p_so_moi: soMoi,
        ...(laPdd ? { p_khoa: khoaHienTai } : {}),
      });
      if (loiSo) {
        setLoiLuuO(loiSo.code === "PGRST202"
          ? "Staging chưa có chức năng khoa sửa số. Cần chạy backend/sql/patch_zzzzs_v2_khoa_sua_so.sql."
          : `Không lưu được số: ${loiSo.message}`);
        return;
      }
      setLoiLuuO("");
      // `mua_them_30` là số dẫn xuất từ số đề xuất — không tính lại thì bảng
      // hiện hai con số không khớp nhau cho tới lần tải sau.
      setRows((prev) => prev.map((r) => (r.ma_hang === maHang
        ? { ...r, [COT_SO_KHOA]: soMoi, mua_them_30: tinhTuyChonMuaThem30(soMoi) }
        : r)));
      setODaSua((prev) => new Map(prev).set(`${maHang}|${colKey}`, true));
      return;
    }

    const { error } = laGiaiTrinh
      ? await supabase.rpc("luu_o_danh_muc_khoa", {
        p_goi_id: goiId, p_nam_de_xuat: NAM_DE_XUAT, p_khoa: khoaHienTai,
        p_ma_hang: maHang, p_cot: colKey, p_gia_tri: gt,
        // patch_zzzzw — hàm từ chối ghi nếu thiếu DOT_GOI.
        p_dot_goi_id: dotGoiId,
      })
      : await supabase.from("danh_muc_tong_hop_o").upsert({
        goi_id: goiScopeTongHop, nam_de_xuat: NAM_DE_XUAT, ma_hang: maHang,
        cot: cotKhoaSangPdd(colKey), gia_tri: gt === "" ? null : gt,
        updated_by: profile?.email || khoaHienTai,
      }, { onConflict: "goi_id,nam_de_xuat,ma_hang,cot" });

    if (error) {
      const chuaPatch = error.code === "PGRST202" || /luu_o_danh_muc_khoa/i.test(error.message || "");
      setLoiLuuO(chuaPatch
        ? "Staging chưa có chức năng lưu ô. Cần chạy backend/sql/patch_zm_luu_o_danh_muc_khoa.sql — thay đổi vừa rồi CHƯA được lưu."
        : `Không lưu được ô: ${error.message}`);
      return;
    }
    setLoiLuuO("");
    setODaSua((prev) => {
      const next = new Map(prev);
      next.set(`${maHang}|${colKey}`, true);
      return next;
    });
    // Giữ bản đồ giá trị chung khớp ngay, không chờ tải lại: nhãn "đã sửa" và
    // tên người sửa phải đổi cùng lúc với con chữ trong ô.
    if (!laGiaiTrinh) {
      setSuaDeCuaPdd((prev) => {
        const next = new Map(prev);
        const cua = new Map(next.get(maHang) || []);
        cua.set(cotKhoaSangPdd(colKey), {
          gia_tri: gt === "" ? null : gt,
          updated_by: profile?.email || khoaHienTai,
          updated_at: new Date().toISOString(),
          goi_id: goiScopeTongHop,
        });
        next.set(maHang, cua);
        return next;
      });
    }
  };

  const capNhatO = (maHang, colKey, giaTri) => {
    if (colKey === COT_SO_KHOA && !dotGoiId) return; // đợt cũ: không có đường ghi số
    if (daKhoaSua(colKey)) return;            // cột đang khóa sửa (patch_zi)
    // V2: xác nhận KHÔNG khoá ô. Việc đóng băng do chốt Q (cột số) và chốt
    // trình ký (cột chữ) lo, và cả hai đều chặn ở DB.
    setRows((prev) => prev.map((r) => (r.ma_hang === maHang ? { ...r, [colKey]: giaTri } : r)));
  };

  // Lưu khi RỜI ô, không lưu theo từng phím: gõ một đoạn tiêu chí kỹ thuật dài
  // mà bắn mỗi ký tự một request thì vừa nặng vừa đầy audit vô ích.
  const ketThucSuaO = async (maHang, colKey) => {
    setODangChon(null);
    if (colKey === COT_SO_KHOA && !dotGoiId) return;
    if (daKhoaSua(colKey)) return;
    const giaTri = rows.find((r) => r.ma_hang === maHang)?.[colKey];
    await luuOLenServer(maHang, colKey, giaTri);
  };

  /** Ô này PĐD đã sửa đè trên bản tổng hợp chưa? (minh bạch, QĐ 08/08/2026) */
  const oPddSuaDe = (maHang, colKey) =>
    suaDeCuaPdd.get(maHang)?.get(cotKhoaSangPdd(colKey)) || null;

  // Chỉ đếm ô PĐD sửa mà khoa này THỰC SỰ NHÌN THẤY. `suaDeCuaPdd` chứa cả mã
  // của khoa khác trong cùng gói con (bản tổng hợp là toàn viện), đếm thẳng nó
  // sẽ báo "PĐD sửa 3 ô" trong khi trên bảng chỉ có 1 ô viền tím — người dùng
  // sẽ đi tìm 2 ô không tồn tại.
  const soOPddSuaDe = useMemo(() => {
    const cotDangHien = new Set(cotHienThi.map((c) => cotKhoaSangPdd(c.key)));
    return rows.reduce((n, r) => {
      const cua = suaDeCuaPdd.get(r.ma_hang);
      if (!cua) return n;
      return n + [...cua.keys()].filter((k) => cotDangHien.has(k)).length;
    }, 0);
  }, [rows, suaDeCuaPdd, cotHienThi]);

  // Lịch sử một ô = lịch sử khoa sửa + lịch sử PĐD sửa đè ô tương ứng trên bản
  // tổng hợp, trộn theo thời gian. Tách hai bảng ra hai panel thì khoa phải tự
  // ghép mốc thời gian trong đầu mới hiểu ai đổi sau ai (QĐ minh bạch
  // 08/08/2026).
  const xemAudit = async (maHang, colKey) => {
    setAudit({ maHang, cot: colKey, dsAudit: [], dangTai: true });
    const [khoaRes, pddRes] = await Promise.all([
      supabase.from("danh_muc_khoa_o_audit")
        .select("gia_tri_cu, gia_tri_moi, nguoi_sua, thoi_gian")
        .eq("dot_goi_id", dotGoiId).eq("khoa", khoaHienTai)
        .eq("ma_hang", maHang).eq("cot", colKey)
        .order("thoi_gian", { ascending: false }).limit(20),
      // Cùng lỗi phạm vi ':dot:N' như `taiSuaDeCuaPdd` — `.eq` ở đây làm phần
      // lịch sử bên PĐD luôn rỗng, khoa không tra được ai duyệt ô của mình.
      supabase.from("danh_muc_tong_hop_o_audit")
        .select("gia_tri_cu, gia_tri_moi, nguoi_sua, thoi_gian")
        .like("goi_id", `${goiId}%`).eq("nam_de_xuat", NAM_DE_XUAT)
        .eq("ma_hang", maHang).eq("cot", cotKhoaSangPdd(colKey))
        .order("thoi_gian", { ascending: false }).limit(20),
    ]);
    const chuaCoBang = khoaRes.error && (khoaRes.error.code === "42P01"
      || /danh_muc_khoa_o_audit/i.test(khoaRes.error.message || ""));
    // Lỗi/RLS chặn bên PĐD thì bỏ qua phần đó, đừng làm mất luôn lịch sử khoa.
    const ds = [
      ...(khoaRes.data || []).map((a) => ({ ...a, ben: "khoa" })),
      ...(pddRes.data || []).map((a) => ({ ...a, ben: "pdd" })),
    ].sort((a, b) => String(b.thoi_gian).localeCompare(String(a.thoi_gian)));
    setAudit({
      maHang, cot: colKey, dangTai: false,
      dsAudit: khoaRes.error ? [] : ds,
      loi: chuaCoBang
        ? "Staging chưa có bảng lịch sử sửa ô. Cần chạy backend/sql/patch_zm_luu_o_danh_muc_khoa.sql."
        : khoaRes.error?.message,
    });
  };

  // Cột khóa sửa: KHÔNG AI sửa được (kể cả PĐD), phải mở khóa trước — đúng
  // "cột đã lock: không ai sửa" mục 3.1 tài liệu nghiệp vụ.
  // Thêm 08/08/2026: đã CHỐT danh sách thì khoá luôn mọi ô. Server cũng chặn
  // độc lập bằng trigger (patch_zs) — đây chỉ là lớp cho người dùng thấy sớm,
  // không phải lớp bảo vệ.
  const oCoTheSua = (col) =>
    !col.readonly && !daKhoaSua(col.key)
    && (col.key !== COT_SO_KHOA || !!dotGoiId);

  // ---- Đẩy SL rớt 1 phần (mục 4.3) — mở form, tải ứng viên mã tương đương
  // cùng mã quản lý CÒN TRÚNG (kể cả mã khoa mình chưa từng đề xuất). ----
  const moFormDay = async (r) => {
    setDangChonMaDay(r.ma_hang);
    setFormDay({ maHangNhan: "", soLuong: String(r.rot?.so_luong_de_xuat ?? "") });
    setThongBaoDay("");
    setUngVienDay({ dangTai: true, ds: [] });
    if (!r.ma_nhom) { setUngVienDay({ dangTai: false, ds: [] }); return; }
    const [{ data: siblings }, { data: maRotCaGoi }] = await Promise.all([
      supabase.from("vat_tu").select("ma_hang, ten_vat_tu, dvt").eq("ma_quan_ly", r.ma_nhom),
      supabase.from("v_ma_rot_theo_goi").select("ma_hang").eq("goi_id", r.rot.goi_id),
    ]);
    const dangRot = new Set((maRotCaGoi || []).map((x) => x.ma_hang));
    const ds = (siblings || []).filter((s) => s.ma_hang !== r.ma_hang && !dangRot.has(s.ma_hang));
    setUngVienDay({ dangTai: false, ds });
  };

  const luuDaySL = async (r) => {
    if (!formDay.maHangNhan) { setThongBaoDay("Chưa chọn mã hàng nhận."); return; }
    const soLuong = Number(formDay.soLuong);
    if (!soLuong || soLuong <= 0) { setThongBaoDay("Số lượng đẩy phải lớn hơn 0."); return; }
    setDangLuuDay(true);
    setThongBaoDay("");
    // Đường cũ gọi RPC `day_so_luong_rot` (patch_ze) — RPC đó đọc
    // `goi_thau_ket_qua_ma` của mô hình trước v3 và không còn chạy được.
    // Không gọi nữa: việc này đã chuyển sang PĐD trên bảng Tổng hợp (D3).
    setDangLuuDay(false);
    setThongBaoDay(
      "Chức năng này đã chuyển cho Phòng Điều dưỡng, làm trên bảng Tổng hợp "
      + "danh mục. Mã rớt của khoa sẽ tự vào đợt bổ sung gần nhất — xem hộp thư "
      + "thông báo."
    );
    return;
    setDangChonMaDay(null);
    await taiLai();
  };

  const soMaRot = rows.filter((r) => r.rot).length;

  // Xuất ĐÚNG các cột đang hiện: ẩn cột trên web thì Excel cũng không có cột
  // đó (chốt 07/08/2026, áp cho cả màn này lẫn Danh mục tổng hợp PĐD). Vì số
  // cột đổi theo lúc xuất nên không đổ vào file mẫu 34 cột cố định được nữa —
  // dựng workbook mới, xem lib/xuatExcelDong.js. Nội dung lấy từ `rows` trên
  // màn hình nên giữ nguyên những gì vừa sửa tay.
  const xuatExcel = async () => {
    setDangXuatExcel(true);
    setLoiXuatExcel("");
    try {
      let phienChinhThuc = null;
      let rowsXuat = rows;
      if (dotGoiId) {
        const { data: phien, error: loiPhien } = await supabase
          .from("chot_trinh_ky_phien_v3")
          .select("id,revision,chot_luc").eq("dot_goi_id", dotGoiId)
          .eq("hieu_luc", true).maybeSingle();
        if (loiPhien) throw loiPhien;
        phienChinhThuc = phien || null;
        if (phienChinhThuc) {
          const { data: dong, error: loiDong } = await fetchAllRows((f, t) => supabase
            .from("chot_trinh_ky_dong_v3").select("ma_hang,so_luong_trung")
            .eq("phien_id", phienChinhThuc.id).eq("khoa", khoaHienTai)
            .range(f, t), { order: "ma_hang" });
          if (loiDong) throw loiDong;
          const soTheoMa = new Map((dong || []).map((d) => [d.ma_hang, Number(d.so_luong_trung) || 0]));
          rowsXuat = rows.map((r) => {
            const so = soTheoMa.get(r.ma_hang) || 0;
            return { ...r, sl_de_xuat_18t: so, mua_them_30: Math.floor(so * 0.30) };
          });
        }
      }
      await xuatExcelDong({
        tieuDe: [
          "BỆNH VIỆN ĐẠI HỌC Y DƯỢC TP HỒ CHÍ MINH",
          (khoaHienTai || "").toUpperCase(),
          `ĐỀ XUẤT DANH MỤC, SỐ LƯỢNG, YÊU CẦU KỸ THUẬT GÓI THẦU CUNG CẤP VẬT TƯ Y TẾ NĂM ${NAM_DE_XUAT}-${NAM_DE_XUAT + 1} (${boThau.nhan})`,
          phienChinhThuc
            ? `BẢN CHÍNH THỨC · REVISION ${phienChinhThuc.revision} · ${new Date(phienChinhThuc.chot_luc).toLocaleString("vi-VN")}`
            : "BẢN NHÁP · CHƯA CHỐT TRÌNH KÝ TOÀN BỘ",
        ],
        // Tên cột lấy từ chính file biểu mẫu bệnh viện (chủ dự án sửa được
        // trong file .xlsx, không cần đụng code). Cột năm sinh động không có
        // trong mẫu nên dùng tên tự sinh — xem ganTenMau.
        // cotGoc phải là COT_KHOA (thứ tự khớp 1-1 theo VỊ TRÍ với file mẫu),
        // KHÔNG phải cotDayDu — cotDayDu đã thay khối lịch sử nên vị trí các
        // cột phía sau bị lệch so với mẫu.
        cot: ganTenMau(
          cotHienThi.map((c) => ({ key: c.key, nhan: c.nhan, nhanMau: c.nhanMau, width: c.width })),
          COT_KHOA,
          await docTenCotTuMau(`${import.meta.env.BASE_URL}form-bieu-mau/danh-muc-de-xuat-khoa.xlsx`)
            .catch(() => []),
        ),
        rows: rowsXuat,
        tenFile: `danh-muc-de-xuat-${tenFileAnToan(khoaHienTai)}-${tenFileAnToan(boThau.nhan)}-${NAM_DE_XUAT}-${
          phienChinhThuc ? `chinh-thuc-rev-${phienChinhThuc.revision}` : "ban-nhap"}.xlsx`,
        tenSheet: "Danh mục đề xuất",
      });
    } catch (e) {
      setLoiXuatExcel(e.message || "Không xuất được Excel.");
    } finally {
      setDangXuatExcel(false);
    }
  };

  if (dangTai) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Đang tải Danh mục đề xuất...</p>
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
          <span className="font-semibold text-slate-800">{khoaHienTai || "Danh mục đề xuất"}</span>
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
              Danh mục đề xuất — {khoaHienTai || "(chưa rõ khoa)"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              34 cột chuẩn bệnh viện · Gói {boThau.nhan} · {rows.length} mã hàng
              {soMaRot > 0 && <> · <span className="text-red-700 font-medium">{soMaRot} mã đang rớt thầu</span></>}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button className="qtdx-tb" onClick={taiLai}><RefreshCw size={13} /> Tải lại</button>
            <button className="qtdx-tb"><Search size={13} /> Tìm / Lọc</button>
            <div className="relative">
              <button className="qtdx-tb" onClick={() => setOpenMenuCot((v) => !v)}>
                <EyeOff size={13} /> Ẩn/khóa cột ({cotHienThi.length}/{cotDayDu.length})
                <ChevronDownIcon size={11} />
              </button>
              {openMenuCot && (
                <div className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg z-40">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Ẩn/khóa cột — dùng chung cho khoa này</span>
                    <button className="text-xs text-umc-700 hover:underline" onClick={hienTatCaCot}>Hiện tất cả</button>
                  </div>
                  {loiCauHinhCot && (
                    <p className="px-3 py-2 text-[11px] text-red-600 border-b border-slate-100">{loiCauHinhCot}</p>
                  )}
                  {NHOM_COT_KHOA.map((n) => {
                    const dsCot = cotDayDu.filter((c) => c.group === n.key);
                    if (!dsCot.length) return null;
                    return (
                      <div key={n.key} className="border-b border-slate-100 last:border-0">
                        <div className="px-3 py-1 text-[10.5px] uppercase tracking-wide text-slate-400 bg-slate-50">{n.nhan}</div>
                        {dsCot.map((c) => {
                          const anCotNay = cauHinhCot[c.key]?.an ?? false;
                          const khoaCotNay = cauHinhCot[c.key]?.khoa_cot ?? c.freeze;
                          const khoaSuaNay = cauHinhCot[c.key]?.khoa_sua ?? false;
                          return (
                            <div key={c.key} className="flex items-center gap-2 px-3 py-1 hover:bg-slate-50 text-xs">
                              <label className="flex flex-1 items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={!anCotNay}
                                  onChange={() => luuCauHinhCot(c.key, { an: !anCotNay })} />
                                <span className={anCotNay ? "text-slate-400" : "text-slate-700"}>{c.nhan}</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer text-slate-500" title="Khóa sửa — không ai sửa được ô trong cột này">
                                <input type="checkbox" checked={khoaSuaNay}
                                  onChange={() => luuCauHinhCot(c.key, { khoa_sua: !khoaSuaNay })} />
                                {khoaSuaNay
                                  ? <Lock size={11} className="text-amber-600" />
                                  : <LockOpen size={11} className="text-slate-300" />}
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer text-slate-500" title="Ghim cột khi cuộn ngang (vẫn sửa được)">
                                <input type="checkbox" checked={khoaCotNay}
                                  onChange={() => luuCauHinhCot(c.key, { khoa_cot: !khoaCotNay })} />
                                <Pin size={11} className={khoaCotNay ? "text-amber-600" : "text-slate-300"} />
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button className="qtdx-tb" onClick={() => setDongGon((v) => !v)}
              title="Đầy đủ = mọi ô hiện trọn nội dung (dòng cao). Gọn = cắt còn 4 dòng cho dễ cuộn; bấm vào ô vẫn xem/sửa được đủ.">
              <AlignLeft size={13} /> Nội dung ô: {dongGon ? "GỌN" : "ĐẦY ĐỦ"}
            </button>
            <button className="qtdx-tb" onClick={xuatExcel} disabled={dangXuatExcel || !rows.length}>
              <Download size={13} /> {dangXuatExcel ? "Đang xuất…" : "Xuất Excel in trình ký"}
            </button>
            <button className={`qtdx-tb ${daXacNhan ? "" : "primary"}`}
              onClick={() => xacNhanDeXuat(false)}
              disabled={dangChot || daXacNhan || !rows.length}
              title={daXacNhan
                ? "Bản hiện tại đã được khoa xác nhận. Ai sửa gì thì nút này sáng lại."
                : "Xác nhận rằng khoa đã xem và đồng ý với bản đang hiển thị. Không khoá ô nào."}>
              <CheckCircle2 size={13} />
              {dangChot ? "Đang lưu…" : daXacNhan
                ? `Đã xác nhận lần ${trangThaiChot.lan}`
                : `Xác nhận thông tin đề xuất lần ${lanKe}`}
            </button>
            {!daXacNhan && !rows.length && !laPdd && (
              <button className="qtdx-tb primary" onClick={() => xacNhanDeXuat(true)} disabled={dangChot}>
                <CheckCircle2 size={13} /> Không phát sinh nhu cầu
              </button>
            )}
            <a href="#tien-do-goi-thau" onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}
              className="qtdx-tb primary">
              <ExternalLink size={13} /> Xử lý mã rớt ở Tiến độ gói thầu
            </a>
          </div>
        </div>
        {loiXuatExcel && <p className="mt-2 text-xs text-red-600">{loiXuatExcel}</p>}
        {/* Cũng hiện ngoài đây, không chỉ trong menu — nút ẩn/khóa nằm ngay
            trên đầu mỗi cột, bấm ở đó mà lỗi chỉ nằm trong menu thì không ai
            thấy. */}
        {loiCauHinhCot && <p className="mt-2 text-xs text-red-600">{loiCauHinhCot}</p>}
        {loiChot && <p className="mt-2 text-xs text-red-600">{loiChot}</p>}
        {loiLuuO && <p className="mt-2 text-xs text-red-600">{loiLuuO}</p>}
        <div className="mt-2 flex items-center gap-1.5 text-[11px] flex-wrap">
          {daXacNhan && (
            <span className="qtdx-badge green">
              <CheckCircle2 size={11} className="mr-1" />
              Đã xác nhận lần {trangThaiChot.lan} · {trangThaiChot.chot_boi}
              {" · "}{new Date(trangThaiChot.chot_luc).toLocaleString("vi-VN")}
              {trangThaiChot.khong_phat_sinh ? " · Không phát sinh nhu cầu" : ""}
              {" · ô vẫn sửa được, sửa thì phải xác nhận lại"}
            </span>
          )}
          {/* Xác nhận bị huỷ: nói rõ VÌ SAO, nếu không khoa mở ra thấy nút
              nhảy từ "lần 1" sang "lần 2" mà không hiểu chuyện gì xảy ra. */}
          {trangThaiChot && !trangThaiChot.hieu_luc && (
            <span className="qtdx-badge amber">
              <AlertTriangle size={11} className="mr-1" />
              Xác nhận lần {trangThaiChot.lan} đã hết hiệu lực
              {trangThaiChot.huy_do ? ` — ${trangThaiChot.huy_do}` : ""}
              {trangThaiChot.huy_luc ? ` (${new Date(trangThaiChot.huy_luc).toLocaleString("vi-VN")})` : ""}
              {" "}· kiểm lại rồi bấm “Xác nhận thông tin đề xuất lần {trangThaiChot.lan + 1}”
            </span>
          )}
          {dieuChinhPdd.length > 0 && (
            <span className="qtdx-badge violet">
              Phòng Điều dưỡng đã điều chỉnh số lượng {dieuChinhPdd.length} lần
              {" "}— xem chi tiết bên dưới
            </span>
          )}
          {soOPddSuaDe > 0 && (
            <span className="qtdx-badge violet">
              {soOPddSuaDe} ô đang mang giá trị DÙNG CHUNG toàn viện
              {" "}— ô viền tím sửa được, nhưng sửa là mọi khoa đổi theo
            </span>
          )}
          <span className="qtdx-badge green">
            {dotGoiId
              ? "Số lượng khoa đề xuất: sửa được tại đây — tổng đi thầu là tổng của các khoa, sửa là tổng đổi theo"
              : "Số lượng khoa đề xuất: đợt này chưa đi đường v3, chỉ sửa được ở màn Nhập đề xuất"}
          </span>
          {soMaRot > 0 && <span className="qtdx-badge red">{soMaRot} mã rớt — bấm "Đẩy SL" ở dòng mã để chuyển sang mã tương đương còn trúng</span>}
          {laPdd && <span className="qtdx-badge blue">Đang xem với quyền PĐD</span>}
        </div>

        {/* Giai đoạn 4 — "Khoa thấy số cũ, số mới, người sửa và lý do ngay
            trên bảng của mình. Khoa không cần xác nhận lại." Bảng này chỉ
            hiển thị, không có nút nào; trao đổi chi tiết vẫn qua Teams. */}
        {dieuChinhPdd.length > 0 && (
          <div className="mt-2 rounded-md border border-violet-200 bg-violet-50/60 px-3 py-2">
            <p className="text-[11px] font-semibold text-violet-900">
              Phòng Điều dưỡng đã điều chỉnh số lượng của khoa
            </p>
            <table className="mt-1.5 w-auto text-[11px]">
              <thead>
                <tr className="text-violet-700">
                  <th className="px-2 py-0.5 text-left font-medium">Mã hàng</th>
                  <th className="px-2 py-0.5 text-right font-medium">Số cũ</th>
                  <th className="px-2 py-0.5 text-right font-medium">Số mới</th>
                  <th className="px-2 py-0.5 text-left font-medium">Người sửa</th>
                  <th className="px-2 py-0.5 text-left font-medium">Thời điểm</th>
                  <th className="px-2 py-0.5 text-left font-medium">Lý do</th>
                </tr>
              </thead>
              <tbody>
                {dieuChinhPdd.map((a, i) => (
                  <tr key={`${a.ma_hang}-${a.thoi_gian}-${i}`} className="border-t border-violet-100">
                    <td className="px-2 py-0.5 font-mono">{a.ma_hang}</td>
                    <td className="px-2 py-0.5 text-right font-mono text-slate-500 line-through">
                      {(a.truoc || {})[khoa] ?? "—"}
                    </td>
                    <td className="px-2 py-0.5 text-right font-mono font-semibold text-violet-900">
                      {(a.sau || {})[khoa] ?? "—"}
                    </td>
                    <td className="px-2 py-0.5">{a.nguoi_sua || "—"}</td>
                    <td className="px-2 py-0.5">
                      {a.thoi_gian ? new Date(a.thoi_gian).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td className="px-2 py-0.5 max-w-[26rem]">{a.ly_do || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className={`qtdx-table border-collapse w-max ${dongGon ? "dong-gon" : ""}`}>
          <colgroup>
            {cotHienThi.map((c) => <col key={c.key} style={{ width: c.width }} />)}
          </colgroup>
          <thead>
            <tr className="group-row">
              {groupSegments.map((s, idx) => {
                let leftOffset = 0;
                if (s.freeze) {
                  let acc = 0;
                  for (let i = 0; i < idx; i++) {
                    const prev = groupSegments[i];
                    if (!prev.freeze) break;
                    let colIdx = groupSegments.slice(0, i).reduce((a, x) => a + x.span, 0);
                    for (let k = 0; k < prev.span; k++) acc += cotHienThi[colIdx + k].width;
                  }
                  leftOffset = acc;
                }
                return (
                  <th key={s.keyId} colSpan={s.span}
                    className={`${s.mau} ${s.freeze ? "freeze" : ""}`}
                    style={s.freeze ? { left: leftOffset } : {}}>
                    {s.nhan}
                  </th>
                );
              })}
            </tr>
            <tr className="col-row">
              {cotHienThi.map((c) => (
                <th key={c.key}
                  className={c.freeze ? "freeze" : ""}
                  style={c.freeze ? { left: tinhLeftFreeze(cotHienThi, c.key) } : {}}>
                  <span className="inline-flex items-center gap-1">
                    {c.nhan}
                    {c.freeze && <span title="Cột đang được cố định (freeze)" className="text-amber-300">📌</span>}
                    <button onClick={() => anCot(c.key)}
                      className="opacity-50 hover:opacity-100 hover:text-rose-300"
                      title="Ẩn cột này">
                      <EyeOff size={10} />
                    </button>
                    <button onClick={() => doiKhoaSua(c.key)}
                      className={daKhoaSua(c.key)
                        ? "text-amber-300 hover:text-amber-200"
                        : "opacity-50 hover:opacity-100 hover:text-amber-300"}
                      title={daKhoaSua(c.key)
                        ? "Cột đang KHÓA — bấm để mở cho sửa lại"
                        : "Khóa cột này, không ai sửa được nội dung"}>
                      {daKhoaSua(c.key) ? <Lock size={10} /> : <LockOpen size={10} />}
                    </button>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={cotHienThi.length} className="qtdx-cell text-center text-slate-400 py-8">
                {khoaHienTai ? "Khoa chưa đề xuất mã nào trong gói này." : "Chưa xác định được khoa để tải dữ liệu."}
              </td></tr>
            ) : rows.map((r) => (
              <RowKhoa key={r.ma_hang} r={r} cotHienThi={cotHienThi} oDangChon={oDangChon}
                setODangChon={setODangChon} oCoTheSua={oCoTheSua} capNhatO={capNhatO}
                daKhoaSua={daKhoaSua} ketThucSuaO={ketThucSuaO} oDaSua={oDaSua}
                xemAudit={xemAudit} oPddSuaDe={oPddSuaDe}
                dangChonMaDay={dangChonMaDay} moFormDay={moFormDay} setDangChonMaDay={setDangChonMaDay}
                ungVienDay={ungVienDay} formDay={formDay} setFormDay={setFormDay}
                luuDaySL={luuDaySL} dangLuuDay={dangLuuDay} thongBaoDay={thongBaoDay} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-800 text-slate-300 text-xs px-4 py-1.5 flex items-center justify-between shrink-0">
        <div>{rows.length} mã hàng · {soMaRot} mã rớt</div>
        <div>SL đề xuất + kết quả thầu: dữ liệu thật (Supabase) · Cột theo file "Danh mục đề xuất khoa chuẩn.xlsx"</div>
      </div>

      <StyleToolbar />

      {/* Panel lịch sử sửa 1 ô — giống hệt Danh mục tổng hợp PĐD */}
      <AnimatePresence>
        {audit && (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="fixed right-4 top-20 bottom-4 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
              <div className="text-xs">
                <div className="font-semibold text-slate-800">Lịch sử sửa ô</div>
                <div className="text-slate-400">
                  {audit.maHang} · {cotDayDu.find((c) => c.key === audit.cot)?.nhan || audit.cot}
                </div>
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
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className={`rounded px-1 py-0.5 text-[10px] font-semibold ${
                        a.ben === "pdd" ? "bg-violet-100 text-violet-800" : "bg-slate-100 text-slate-600"
                      }`}>
                        {a.ben === "pdd" ? "PĐD" : "Khoa"}
                      </span>
                      {new Date(a.thoi_gian).toLocaleString("vi-VN")} · {a.nguoi_sua}
                    </div>
                    <div className="mt-0.5 whitespace-pre-wrap break-words">
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
    </div>
  );
}

function RowKhoa({
  r, cotHienThi, oDangChon, setODangChon, oCoTheSua, capNhatO, daKhoaSua,
  ketThucSuaO, oDaSua, xemAudit, oPddSuaDe,
  dangChonMaDay, moFormDay, setDangChonMaDay, ungVienDay, formDay, setFormDay,
  luuDaySL, dangLuuDay, thongBaoDay,
}) {
  const dangRot = !!r.rot;
  const dangMoForm = dangChonMaDay === r.ma_hang;
  return (
    <>
      <tr className={dangRot ? "row-failed" : ""}>
        {cotHienThi.map((c) => {
          const isEditing = oDangChon?.maHang === r.ma_hang && oDangChon?.colKey === c.key;
          const canSua = oCoTheSua(c);
          const pdd = oPddSuaDe(r.ma_hang, c.key);
          // V2 (19/08/2026 chiều) — cột chữ là MỘT giá trị chung toàn viện.
          // Giá trị đã được áp thẳng lên `r` lúc tải, nên ở đây chỉ đọc `r`
          // như mọi ô khác. `oChung` chỉ còn dùng để hiện ai sửa lần cuối.
          //
          // Ô KHÔNG còn chỉ đọc: bản sáng cùng ngày khoá ô ngay khi PĐD gõ,
          // chủ dự án bỏ luật đó — "PĐD chỉnh sửa rồi khoa chỉnh sửa nữa,
          // đừng có PĐD xong là khoá ô". Việc đóng băng dời sang chốt trình ký.
          //
          // Ngoại lệ `giai_trinh_2627`: giải trình là tiếng nói của từng khoa,
          // vẫn lưu riêng theo khoa.
          const oChung = pdd && !COT_KHONG_NHAN_DUYET.has(c.key) ? pdd : null;
          // V2 — dải thông thường P50–P75. Vượt P75 thì tô nổi bật ô SỐ và ô
          // DẢI; dưới P50 không sao (chốt 19/08/2026: chỉ tô, không chặn,
          // không bắt nhập lý do). Chưa đủ dữ liệu để dựng dải thì KHÔNG được
          // coi là ngoài khoảng — không có khoảng nào để đối chiếu.
          const coDai = r._daiTu != null && r._daiDen != null;
          const vuotP75 = coDai && Number(r[COT_SO_KHOA]) > r._daiDen;
          const value = c.key === "dai_p50_p75"
            ? (coDai ? `${fmt(r._daiTu)} – ${fmt(r._daiDen)}` : "—")
            : r[c.key];
          const cn = [
            "qtdx-cell",
            c.readonly || !canSua ? "readonly" : "",
            daKhoaSua(c.key) ? "col-locked" : "",
            oDaSua.has(`${r.ma_hang}|${c.key}`) ? "sua-de" : "",
            oChung ? "pdd-sua" : "",
            vuotP75 && (c.key === COT_SO_KHOA || c.key === "dai_p50_p75") ? "vuot-p75" : "",
            isEditing ? "editing" : "",
            c.kieu === "num" ? "num" : "",
            c.freeze ? "freeze" : "",
          ].filter(Boolean).join(" ");
          return (
            <td key={c.key} className={cn}
              // Không còn nhánh riêng cho kieu="wide": .qtdx-cell đã wraptext
              // cho MỌI ô, đặt whiteSpace:"normal" ở đây sẽ ghi đè pre-wrap và
              // nuốt mất các dòng người dùng tự xuống trong textarea.
              style={{
                minWidth: c.width, maxWidth: c.width * 1.3,
                ...(c.freeze ? { left: tinhLeftFreeze(cotHienThi, c.key) } : {}),
              }}
              onClick={() => canSua && setODangChon({ maHang: r.ma_hang, colKey: c.key })}
            >
              {c.key === "dai_p50_p75" ? (
                <span title={coDai
                  ? `Dải thông thường của riêng khoa này: ${fmt(r._daiTu)}–${fmt(r._daiDen)}. `
                    + `Số đang đề xuất ${fmt(r[COT_SO_KHOA])}. `
                    + (vuotP75 ? "VƯỢT P75 — cần theo dõi lý do." : "Nằm trong dải hoặc dưới P50 — không sao.")
                    + " Dải tính theo kỳ mặc định của gói; ở màn Nhập đề xuất khoa có thể đã đổi mốc từ/đến nên dải bên đó có thể khác."
                  : "Chưa đủ lịch sử sử dụng để dựng dải cho mã này."}>
                  {value}
                </span>
              ) : isEditing ? (
                c.kieu === "wide" ? (
                  <textarea value={value ?? ""} rows={3}
                    style={{ resize: "vertical", width: "100%", minHeight: 52 }}
                    onChange={(e) => capNhatO(r.ma_hang, c.key, e.target.value)}
                    onBlur={() => ketThucSuaO(r.ma_hang, c.key)} autoFocus />
                ) : (
                  <input value={value ?? ""}
                    onChange={(e) => capNhatO(r.ma_hang, c.key, e.target.value)}
                    onBlur={() => ketThucSuaO(r.ma_hang, c.key)} autoFocus />
                )
              ) : (
                <span>
                  {formatCell(value, c.kieu)}
                  {c.key === "ten_vt_2627" && dangRot && (
                    // CHỈ ĐỂ XEM. Việc đổ số rớt sang mã tương đương là của
                    // Phòng Điều dưỡng, làm trên Danh mục tổng hợp (QĐ D1/D3).
                    <span title={`Kết quả thầu: mang đi thầu ${fmt(r.rot.so_luong_de_xuat)}, `
                        + `trúng ${fmt(r.rot.so_luong_trung)}, thiếu ${fmt(r.rot.so_luong_thieu)}`
                        + (r.rot.ly_do_khong_trung ? ` · ${r.rot.ly_do_khong_trung}` : "")}
                      className={`ml-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium align-middle ${
                        Number(r.rot.so_luong_trung) > 0
                          ? "bg-amber-100 text-amber-900" : "bg-red-600 text-white"}`}>
                      <XCircle size={10} />
                      {Number(r.rot.so_luong_trung) > 0
                        ? `Rớt ${fmt(r.rot.so_luong_thieu)} ở ${NHAN_GIAI_DOAN[r.rot.ma_moc_rot] || r.rot.ma_moc_rot} · trúng ${fmt(r.rot.so_luong_trung)}`
                        : `Rớt toàn bộ ở ${NHAN_GIAI_DOAN[r.rot.ma_moc_rot] || r.rot.ma_moc_rot}`}
                    </span>
                  )}
                  {/* Lịch sử sửa ô — hiện ở MỌI ô như bên Tổng hợp PĐD, kể cả
                      ô chưa từng sửa (bấm vào thì panel báo "chưa có lần sửa
                      nào"), để không phải đoán ô nào có lịch sử. */}
                  {/* V2: ô này đang mang giá trị CHUNG toàn viện. Nhãn cho
                      biết ai chạm sau cùng — sửa được, không phải chỉ đọc.
                      20/08/2026 — đổi nhãn cố định "Dùng chung" thành dấu vết
                      "AI SỬA CUỐI · lúc mấy giờ". Nhãn cũ nói đúng nhưng nói
                      thứ giống hệt nhau ở mọi ô, nên nhìn cả bảng không phân
                      biệt được ô nào vừa bị đổi; thông tin "ai sửa" thì nằm
                      trong tooltip, phải rê chuột từng ô mới thấy. Phần "giá
                      trị dùng chung, sửa là cả viện đổi theo" chuyển hết vào
                      tooltip qua `moTaThem` — vẫn còn nguyên, chỉ đổi chỗ. */}
                  {oChung && (
                    <DauVetSuaCuoi
                      updatedBy={oChung.updated_by} updatedAt={oChung.updated_at}
                      moTaThem={"Cột chữ là giá trị dùng chung toàn viện cho mã hàng này — "
                        + "sửa ở đây thì mọi khoa và bản Tổng hợp đều đổi theo. "
                        + "Bấm biểu tượng lịch sử để xem các lần sửa trước."} />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); xemAudit(r.ma_hang, c.key); }}
                    className="ml-1 opacity-40 hover:opacity-100"
                    title="Xem lịch sử sửa ô này (cả khoa và PĐD)">
                    <History size={9} className="inline text-slate-400" />
                  </button>
                </span>
              )}
            </td>
          );
        })}
      </tr>
      {dangMoForm && (
        <tr className="row-expand">
          <td colSpan={cotHienThi.length} className="qtdx-cell" style={{ background: "#fff7ed" }}>
            <div className="py-2 space-y-2">
              <div className="text-xs text-red-800">
                <b>{r.ma_hang}</b> rớt ở {NHAN_GIAI_DOAN[r.rot.ma_moc_rot] || r.rot.ma_moc_rot}
                {r.rot.ly_do_khong_trung ? ` · ${r.rot.ly_do_khong_trung}` : ""}
                {" · còn lại "}{fmt(r.rot.so_luong_de_xuat)} {r.dvt}
              </div>
              {ungVienDay.dangTai ? (
                <p className="text-xs text-slate-400">Đang tìm mã tương đương còn trúng...</p>
              ) : ungVienDay.ds.length === 0 ? (
                <p className="text-xs text-slate-400">Không có mã tương đương còn trúng trong mã quản lý {r.ma_nhom}. Dùng "Xử lý mã rớt ở Tiến độ gói thầu" để chuyển sang đợt bổ sung.</p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <select value={formDay.maHangNhan}
                    onChange={(e) => setFormDay((p) => ({ ...p, maHangNhan: e.target.value }))}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-xs">
                    <option value="">— Chọn mã hàng nhận —</option>
                    {ungVienDay.ds.map((s) => (
                      <option key={s.ma_hang} value={s.ma_hang}>{s.ma_hang} · {s.ten_vat_tu}</option>
                    ))}
                  </select>
                  <input value={formDay.soLuong}
                    onChange={(e) => setFormDay((p) => ({ ...p, soLuong: e.target.value }))}
                    type="number" min="0" placeholder="Số lượng"
                    className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-xs" />
                  <button onClick={() => luuDaySL(r)} disabled={dangLuuDay}
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40">
                    <PackagePlus size={13} />
                    {dangLuuDay ? "Đang đẩy..." : "Xác nhận đẩy SL"}
                  </button>
                  <button onClick={() => setDangChonMaDay(null)} className="text-xs text-slate-500">Đóng</button>
                </div>
              )}
              {thongBaoDay && (
                <div className="flex items-center gap-1.5 text-xs text-red-700">
                  <AlertTriangle size={12} /> {thongBaoDay}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// -------- helpers dùng chung -----------------------------------------------

/* DẤU VẾT "AI SỬA CUỐI" TRÊN Ô DÙNG CHUNG (chốt 20/08/2026 của chủ dự án).
 *
 * Luật V2 (19/08/2026) GIỮ NGUYÊN: cột chữ là MỘT giá trị chung toàn viện,
 * ai sửa sau đè, khoa đè được lên PĐD. Cái được thêm chỉ là dấu vết: ô phải
 * tự nói ai chạm sau cùng và lúc nào. Vì sao cần: chính vì khoa đè được lên
 * PĐD nên PĐD duyệt xong quay lại vẫn có thể đang đọc chữ của khoa mà không
 * hay — trước 20/08 muốn biết phải bấm biểu tượng lịch sử từng ô một, tức là
 * phải NGHI NGỜ trước mới tra ra, mà ô đáng nghi thì lại không có gì báo.
 *
 * VÌ SAO RÚT GỌN TỪ EMAIL, KHÔNG TRA BẢNG `users` LẤY TÊN KHOA:
 * RLS của `users` chỉ cho admin/dieu_duong đọc dòng của người khác (policy
 * "user xem chính mình, PĐD xem tất cả", patch_zzzzj_v3_chuan_bi_dot.sql).
 * Người dùng màn Danh mục đề xuất khoa là dvsd, nên truy vấn đó trả về đúng
 * một dòng của chính họ — nhãn sẽ trống ở ĐÚNG chỗ cần nó. Mà để hai màn
 * hiện hai kiểu tên khác nhau cho cùng một người thì còn khó đối chiếu hơn là
 * cả hai cùng hiện phần trước @. Tooltip luôn mang email ĐẦY ĐỦ nên không
 * mất thông tin, chỉ là nhãn ngắn phải chấp nhận thô.
 */

// SUY ĐOÁN THEO QUY ƯỚC ĐẶT TÊN, không phải tra role thật trong `users`:
// staging đang dùng pdd@ và admin@ cho Phòng Điều dưỡng. Người PĐD dùng email
// tên riêng sẽ ra nhãn tên riêng chứ không ra "PĐD" — chấp nhận được vì
// tooltip vẫn hiện email đầy đủ để đối chiếu. Thêm tài khoản PĐD kiểu khác
// thì bổ sung vào đây.
const TAI_KHOAN_PDD = new Set(["pdd", "admin", "dieuduong", "dieu_duong", "phongdieuduong"]);

/** Tên người sửa rút gọn cho vừa một ô bảng: "PĐD", "GMHS", "PHONGMO"... */
export function tenNguoiSuaNgan(email) {
  if (!email) return "?";
  const dau = String(email).split("@")[0].trim();
  if (!dau) return "?";
  if (TAI_KHOAN_PDD.has(dau.toLowerCase())) return "PĐD";
  // Cắt 10 ký tự: cột hẹp nhất của bảng chỉ ~90px, nhãn dài hơn sẽ xuống dòng
  // và đội chiều cao CẢ HÀNG lên (mọi ô đã wraptext, xem StyleTable).
  return dau.length > 10 ? `${dau.slice(0, 10).toUpperCase()}…` : dau.toUpperCase();
}

/** Mốc thời gian rút gọn: cùng ngày thì "15:10", khác ngày thì "19/08".
 *  Phần lớn tranh chấp "ai đè ai" xảy ra trong cùng buổi làm việc, nên giờ:phút
 *  là thứ phân định được; ô sửa từ tuần trước chỉ cần biết là đã cũ. */
export function mocThoiGianNgan(iso) {
  if (!iso) return "";
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "";
  const cungNgay = t.toDateString() === new Date().toDateString();
  return cungNgay
    ? t.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : t.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

/** Nhãn nhỏ "PĐD · 15:10" gắn vào ô đã bị sửa đè. Dùng CHUNG cho cả bản Tổng
 *  hợp của PĐD lẫn Danh mục đề xuất của khoa — hai màn nhìn cùng một ô nên
 *  phải đọc ra cùng một dòng chữ, nếu không thì hai bên gọi tên khác nhau cho
 *  cùng một lần sửa. `moTaThem` để mỗi màn nói thêm phần nghiệp vụ riêng. */
export function DauVetSuaCuoi({ updatedBy, updatedAt, moTaThem = "" }) {
  if (!updatedBy && !updatedAt) return null;
  const gio = mocThoiGianNgan(updatedAt);
  const dayDu = updatedAt
    ? new Date(updatedAt).toLocaleString("vi-VN")
    : "không rõ thời điểm";
  return (
    <span
      className="ml-1.5 inline-flex items-center whitespace-nowrap rounded bg-violet-100 px-1 py-0.5 align-middle text-[10px] font-semibold text-violet-800"
      title={`Sửa cuối bởi ${updatedBy || "không rõ"} lúc ${dayDu}.`
        + (moTaThem ? ` ${moTaThem}` : "")}>
      {gio ? `${tenNguoiSuaNgan(updatedBy)} · ${gio}` : tenNguoiSuaNgan(updatedBy)}
    </span>
  );
}

export function StyleTable() {
  return (
    <style>{`
      /* table-layout: fixed BẮT BUỘC đi cùng <colgroup> ở mỗi bảng dùng class
         này (TongHopPdd.jsx, DanhMucDeXuatKhoa.jsx). Không có nó, độ rộng cột
         auto-layout theo nội dung dài nhất ở BẤT KỲ dòng nào trong cột đó
         (quy tắc bảng HTML: 1 cột chia sẻ đúng 1 độ rộng cho mọi dòng), lệch
         khỏi độ rộng tĩnh mà tinhLeftFreeze() dùng để tính "left" của cột
         freeze — hậu quả đo được: cột freeze che mất 1-2 cột liền sau nó khi
         cuộn ngang, dữ liệu ẩn và không bấm sửa được (phát hiện 06/08/2026 khi
         test PĐD sửa ô trên Danh mục tổng hợp).
         width:100% + colgroup mới thật sự chốt độ rộng; w-max trên table không
         đủ vì fixed-layout không tự co giãn theo nội dung. */
      table.qtdx-table { table-layout: fixed; width: 100%; }
      /* WRAPTEXT MỌI Ô (chốt 08/08/2026). Trước đây mặc định là 1 dòng +
         ellipsis, chỉ cột kieu="wide" mới xuống dòng — hậu quả: TSKT, tên vật
         tư, tên thương mại dài bị cắt "..." và người dùng phải bấm vào ô mới
         đọc được hết. Giờ mọi ô đều xuống dòng và hiện ĐỦ nội dung.
         Vẫn giữ table-layout:fixed + colgroup: wrap chỉ làm dòng CAO lên, độ
         rộng cột không đổi, nên tinhLeftFreeze() vẫn tính đúng left của cột
         freeze (xem lý do dài ở trên).
         pre-wrap giữ nguyên xuống dòng người dùng gõ trong textarea; break-word
         + anywhere xử lý chuỗi dài không có khoảng trắng (mã, ký mã hiệu).
         vertical-align: top để ô ngắn không bị "trôi" xuống giữa dòng cao. */
      .qtdx-cell { padding: 6px 10px; font-size: 12.5px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; vertical-align: top; overflow: hidden; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; }
      .qtdx-cell input, .qtdx-cell textarea { background: transparent; outline: none; width: 100%; border: 0; font-size: 12.5px; font-family: inherit; resize: vertical; }
      .qtdx-cell:hover { background: #fefce8; }
      .qtdx-cell.editing { outline: 2px solid var(--umc-blue); outline-offset: -2px; background: #eff6fd !important; }
      .qtdx-cell.readonly { background: #f8fafc; color: #475569; }
      .qtdx-cell.locked { background: #eef2ff; }
      /* Ô PĐD đã sửa đè lên số gốc (Danh mục tổng hợp) — phải phân biệt được
         với số máy tính ra, vì bản này dùng để đi thầu. Số gốc xem ở tooltip,
         lịch sử sửa xem ở icon đồng hồ. */
      .qtdx-cell.sua-de { background: #fffbeb; box-shadow: inset 2px 0 0 #d97706; }
      .qtdx-cell.num { text-align: right; font-variant-numeric: tabular-nums; }
      tr.row-locked td.qtdx-cell { background: #fffbeb; }
      tr.row-failed td.qtdx-cell { background: #fef2f2; }
      tr.row-partial td.qtdx-cell { background: #fff7ed; }
      tr.row-expand td.qtdx-cell { background: #f8fafc; font-size: 11.5px; }
      thead th { position: sticky; top: 0; background: var(--umc-navy); color: #f1f7fd; z-index: 20; font-weight: 600; font-size: 11.5px; padding: 6px 10px; border-right: 1px solid rgba(255,255,255,0.13); border-bottom: 1px solid rgba(255,255,255,0.13); text-align: left; }
      /* Dải nhóm cột dùng navy đậm hơn 1 bậc để phân tầng header 2 dòng mà
         không cần thêm đường kẻ — mắt đọc theo mảng màu, đỡ rối. */
      thead tr.group-row th { background: #0f3364; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10.5px; top: 0; }
      thead tr.col-row th { top: 30px; z-index: 22; }
      /* Cột đang KHÓA SỬA (patch_zi) — nền vàng nhạt để phân biệt với ô chỉ
         đọc do bản chất dữ liệu (readonly, nền xám). */
      td.qtdx-cell.col-locked { background: #fffbeb; cursor: not-allowed; }
      /* Ô Phòng Điều dưỡng đã sửa đè trên bản tổng hợp — số này mới là số đi
         thầu, phải phân biệt được với số khoa tự nộp. Viền tím ở mép phải để
         không đụng vạch cam của "khoa đã sửa" bên mép trái. */
      td.qtdx-cell.pdd-sua { box-shadow: inset -3px 0 0 #7c3aed; }
      /* V2 — số đề xuất vượt P75. Chỉ tô nổi bật, không chặn: chốt 19/08/2026.
         Dùng nền đỏ nhạt + chữ đậm để đọc được cả khi ô đang có viền tím của
         giá trị dùng chung. */
      td.qtdx-cell.vuot-p75 { background: #fef2f2; color: #991b1b; font-weight: 700; }
      th.freeze, td.freeze { position: sticky; z-index: 15; }
      th.freeze { background: var(--umc-navy); color: #f1f7fd; z-index: 30; }
      /* Cột ghim: nền xanh rất nhạt + vạch phải để người dùng thấy rõ ranh
         giới "vùng đứng yên" khi cuộn ngang qua vài chục cột. */
      td.freeze { background: #eef5fb; color: var(--umc-ink); z-index: 10; }
      table.qtdx-table td.freeze:last-of-type, table.qtdx-table th.freeze:last-of-type { box-shadow: inset -1px 0 0 #c3d9ee, 6px 0 12px -6px rgba(18,61,121,0.16); }
      /* "thead tr.col-row th" (3 phần tử) đặc hiệu hơn "th.freeze" (1 phần
         tử + 1 lớp) nên z-index:22 của nó thắng z-index:30 của freeze —
         cột freeze thứ 2/3 trở đi bị cột thường cuộn qua đè lên header.
         Đặc hiệu hoá riêng cho .col-row.freeze để luôn thắng, không phụ
         thuộc thứ tự khai báo. */
      thead tr.col-row th.freeze { z-index: 32; }
      /* Chế độ GỌN (tùy chọn, mặc định TẮT). Wraptext đầy đủ là đúng yêu cầu,
         nhưng TSKT thật dài 15-20 dòng nên 1 dòng bảng có thể chiếm trọn màn
         hình — cuộn qua 200 mã thành cực hình. Bật "Gọn" thì mỗi ô cắt còn 4
         dòng; nội dung KHÔNG mất, bấm vào ô là mở textarea thấy đủ, và file
         Excel xuất ra luôn có nguyên văn bất kể đang ở chế độ nào. */
      table.qtdx-table.dong-gon td.qtdx-cell > span {
        display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `}</style>
  );
}

export function StyleToolbar() {
  return (
    <style>{`
      .qtdx-tb { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; border: 1px solid #cbd9e8; background: white; color: var(--umc-ink); transition: background-color 150ms ease, border-color 150ms ease; }
      .qtdx-tb:hover { background: #eff5fb; border-color: #a9c6e2; }
      .qtdx-tb:focus-visible { outline: 2px solid var(--umc-cyan); outline-offset: 1px; }
      /* Nút chính đổi từ teal #0f766e (không thuộc bộ nhận diện) sang xanh UMC. */
      .qtdx-tb.primary { background: var(--umc-blue); color: white; border-color: var(--umc-blue); }
      .qtdx-tb.primary:hover { background: var(--umc-blue-dark); border-color: var(--umc-blue-dark); }
      .qtdx-badge { display: inline-flex; align-items: center; padding: 1px 7px; border-radius: 9999px; font-weight: 500; }
      .qtdx-badge.green { background: #d1fae5; color: #065f46; }
      .qtdx-badge.amber { background: #fef3c7; color: #92400e; }
      .qtdx-badge.blue { background: #dbeafe; color: #1e40af; }
      .qtdx-badge.red { background: #fee2e2; color: #991b1b; }
      .qtdx-badge.violet { background: #ede9fe; color: #5b21b6; }
    `}</style>
  );
}

export function formatCell(v, kieu) {
  if (v == null || v === "") return <span className="text-slate-300">—</span>;
  if (kieu === "num" && typeof v === "number") return fmt(v);
  if (typeof v === "string" && v.includes("\n")) {
    return v.split("\n").map((line, i) => (
      <div key={i} className={i > 0 ? "mt-0.5" : ""}>{line}</div>
    ));
  }
  return v;
}
