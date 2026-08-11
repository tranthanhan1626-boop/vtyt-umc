import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EyeOff, ChevronLeft, ChevronDown as ChevronDownIcon, Download, Search, ExternalLink, XCircle, PackagePlus, RefreshCw, AlertTriangle, Lock, LockOpen, Pin, CheckCircle2, Unlock, History, AlignLeft } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";
import { tinhTuyChonMuaThem30 } from "../lib/tuyChonMuaThem";
import {
  COT_KHOA, NHOM_COT_KHOA, GOI_ID_MAP, sapXepFreezeTruoc, tinhLeftFreeze,
  tinhSegmentsGroup, taoCotLichSu, thayCotLichSu, suyRaNamCoDuLieu,
  taoCotLichSuNhom, chenCotLichSuNhom, cotKhoaSangPdd,
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
 *   - Các cột chữ còn lại (tskt_2627, quy_cach, giai_trinh_2627, thương mại
 *     2026-2027...) vẫn sửa được nhưng CHỈ lưu state cục bộ trong phiên —
 *     y hệt hành vi bản mock cũ, CHƯA có bảng lưu thật (khác Tổng hợp PĐD đã
 *     có danh_muc_tong_hop_o). Không phải regression, chỉ chưa nối tiếp.
 *   - "Live sync" giá trị PĐD sửa trên Tổng hợp xuống đúng ô này (mục 4.1)
 *     chưa nối — cần ánh xạ khoá COT_KHOA<->COT_PDD + mở RLS đọc có kiểm
 *     soát cho danh_muc_tong_hop_o, để bàn riêng.
 *   - Cột KHÔNG CÓ NGUỒN DỮ LIỆU THẬT (mã HIS cũ, Thông tư 04, mã kỹ thuật,
 *     lý do rớt DC2025, thương mại tham khảo 2025-2026...) — để trống thay
 *     vì bịa, xem NGUON_KHONG_CO_KHOA.
 */

const NGUON_KHONG_CO_KHOA = new Set([
  "his_1599", "his_957", "ma_tt04", "ten_tt04", "ma_his_2023",
  "ten_vt_2526", "tskt_2526", "ly_do_rot_2025", "ly_do_rot_ct",
  "ten_tm_2526", "ma_sp_2526", "hang_sx_2526", "nuoc_sx_2526", "ma_kt",
]);

const COT_CHI_DOC_THEM = new Set(["sl_de_xuat_18t"]);

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

  // Xem chú thích cùng chỗ ở TongHopPdd.jsx — lọc đúng đợt bổ sung (patch_zt).
  const dsDotId = await taiDotIdCuaGoi(bo);
  let qProposals = supabase.from("proposals")
    .select("id, ma_hang, so_luong, dot_id")
    .eq("nam_de_xuat", NAM_DE_XUAT).eq("is_current", true)
    .eq("loai_mua_sam", bo.loai_mua_sam).eq("don_vi", khoa);
  if (bo.goi) qProposals = qProposals.eq("goi", bo.goi);
  // `dot_id` là ranh giới nghiệp vụ cuối cùng. Một gói 18 tháng có thể có
  // nhiều kỳ kế tiếp nhau và ba đợt bổ sung cùng loại cũng phải tuyệt đối tách
  // nhau; không được chỉ lọc theo `loai_mua_sam` rồi để kết quả rớt lẫn kỳ.
  qProposals = dotId ? qProposals.eq("dot_id", Number(dotId)) : locTheoDot(qProposals, dsDotId);
  const { data: propRows, error: loiProposals } = await fetchAllRows((f, t) => qProposals.range(f, t), { order: "id" });
  if (loiProposals) throw loiProposals;
  if (!propRows?.length) return { bo, rows: [] };

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
    const slDeXuat = Number(prop.so_luong) || 0;
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
      mua_them_30: tinhTuyChonMuaThem30(slDeXuat),
      giai_trinh_2627: "",
      ten_tm_2627: vt.ten_thuong_mai || null,
      ma_sp_2627: vt.ky_ma_hieu || null,
      hang_sx_2627: vt.hang || null,
      nuoc_sx_2627: vt.nuoc_san_xuat || null,
      ma_hang: maHang,
      proposalId: prop.id,
      dotId: prop.dot_id,
      rot: null,
    };
    NGUON_KHONG_CO_KHOA.forEach((k) => { row[k] = null; });
    return row;
  });

  rows.sort((a, b) =>
    (a.ma_nhom || "zzz").localeCompare(b.ma_nhom || "zzz", "vi")
    || a.ten_vt_2627.localeCompare(b.ten_vt_2627, "vi"));
  rows.forEach((r, i) => { r.stt = i + 1; r.stt_co_dinh = i + 1; });

  return { bo, rows, dsMaHang, dsNamCoDuLieu };
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

  // ---- Chốt Danh mục đề xuất (patch_zj) -----------------------------------
  // "Khoa đã nộp xong chưa" là câu hỏi PĐD cần trả lời được ở Bàn điều hành.
  // Chỉ dựa vào "có dữ liệu" thì không phân biệt được khoa đang sửa dở với
  // khoa đã làm xong, nên khoa phải CHỦ ĐỘNG bấm chốt (chốt 07/08/2026).
  const taiTrangThaiChot = useCallback(async () => {
    if (!goiId || !khoaHienTai) return;
    const { data, error } = await supabase.from("danh_muc_khoa_chot")
      .select("chot_boi, chot_luc")
      .eq("goi_id", goiId).eq("nam_de_xuat", NAM_DE_XUAT).eq("khoa", khoaHienTai)
      .maybeSingle();
    if (error) {
      const chuaCoBang = error.code === "42P01" || /danh_muc_khoa_chot/i.test(error.message || "");
      setLoiChot(chuaCoBang
        ? "Staging chưa có chức năng chốt danh mục. Cần chạy backend/sql/patch_zj_ban_dieu_hanh_pdd.sql."
        : error.message);
      return;
    }
    setLoiChot("");
    setTrangThaiChot(data || null);
  }, [goiId, khoaHienTai]);

  useEffect(() => { taiTrangThaiChot(); }, [taiTrangThaiChot]);

  const doiChot = async () => {
    setDangChot(true);
    setLoiChot("");
    const dangChot = !!trangThaiChot;
    const { error } = dangChot
      ? await supabase.from("danh_muc_khoa_chot").delete()
          .eq("goi_id", goiId).eq("nam_de_xuat", NAM_DE_XUAT).eq("khoa", khoaHienTai)
      : await supabase.from("danh_muc_khoa_chot").insert({
          goi_id: goiId, nam_de_xuat: NAM_DE_XUAT, khoa: khoaHienTai,
          chot_boi: profile?.email || khoaHienTai,
        });
    if (error) {
      const chuaCoBang = error.code === "42P01" || /danh_muc_khoa_chot/i.test(error.message || "");
      setLoiChot(chuaCoBang
        ? "Staging chưa có chức năng chốt danh mục. Cần chạy backend/sql/patch_zj_ban_dieu_hanh_pdd.sql."
        : error.message);
    } else {
      await taiTrangThaiChot();
    }
    setDangChot(false);
  };

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
    const { data, error } = await supabase.from("danh_muc_khoa_o")
      .select("ma_hang, gia_tri")
      .eq("goi_id", goiId).eq("nam_de_xuat", NAM_DE_XUAT).eq("khoa", khoaHienTai);
    if (error) {
      const chuaCoBang = error.code === "42P01" || /danh_muc_khoa_o/i.test(error.message || "");
      setLoiLuuO(chuaCoBang
        ? "Staging chưa có chức năng lưu ô. Cần chạy backend/sql/patch_zm_luu_o_danh_muc_khoa.sql — sửa ô lúc này sẽ MẤT khi đóng tab."
        : error.message);
      return new Map();
    }
    setLoiLuuO("");
    return new Map((data || []).map((r) => [r.ma_hang, r.gia_tri || {}]));
  }, [goiId, khoaHienTai]);

  // ---- Minh bạch: PĐD sửa gì trên bản tổng hợp, khoa thấy hết (patch_zs) ---
  // QĐ 08/08/2026 của chủ dự án. Trước patch_zs, dvsd không có policy nào trên
  // danh_muc_tong_hop_o nên đọc ra rỗng — khoa nộp số này, đi thầu số khác mà
  // không biết. Giờ mở ĐỌC (vẫn không cho ghi).
  const taiSuaDeCuaPdd = useCallback(async () => {
    if (!goiId) return new Map();
    const { data, error } = await supabase.from("danh_muc_tong_hop_o")
      .select("ma_hang, cot, gia_tri, updated_by, updated_at")
      .eq("goi_id", goiId).eq("nam_de_xuat", NAM_DE_XUAT);
    // Chưa chạy patch_zs -> RLS trả rỗng chứ không lỗi. Không cản trở gì, chỉ
    // là chưa thấy được phần PĐD sửa.
    if (error) return new Map();
    const m = new Map();
    (data || []).forEach((r) => {
      if (!m.has(r.ma_hang)) m.set(r.ma_hang, new Map());
      m.get(r.ma_hang).set(r.cot, r);
    });
    return m;
  }, [goiId]);

  const taiLai = useCallback(async () => {
    setDangTai(true);
    setLoi("");
    try {
      const { bo, rows: rowsGoc, dsMaHang, dsNamCoDuLieu: dsNam } =
        await taiDuLieuKhoa(goiId, khoaHienTai, dotId);
      const ketQuaTheoMa = dsMaHang?.length
        ? await taiKetQuaThau(bo.loai_mua_sam, khoaHienTai, dsMaHang, dotId)
        : new Map();
      const [oDaLuu, suaDePdd] = await Promise.all([taiODaLuu(), taiSuaDeCuaPdd()]);
      setSuaDeCuaPdd(suaDePdd);
      setBoThau(bo);
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
      setODaSua(daSua);
    } catch (e) {
      setLoi(e.message || "Không tải được dữ liệu.");
    } finally {
      setDangTai(false);
    }
  }, [goiId, khoaHienTai, dotId, taiODaLuu, taiSuaDeCuaPdd]);

  useEffect(() => { taiLai(); }, [taiLai]);


  const luuOLenServer = async (maHang, colKey, giaTri) => {
    const { error } = await supabase.rpc("luu_o_danh_muc_khoa", {
      p_goi_id: goiId, p_nam_de_xuat: NAM_DE_XUAT, p_khoa: khoaHienTai,
      p_ma_hang: maHang, p_cot: colKey,
      p_gia_tri: giaTri == null ? "" : String(giaTri),
    });
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
  };

  const capNhatO = (maHang, colKey, giaTri) => {
    if (COT_CHI_DOC_THEM.has(colKey)) return; // sl_de_xuat_18t: chỉ đọc, xem comment đầu file
    if (daKhoaSua(colKey)) return;            // cột đang khóa sửa (patch_zi)
    if (trangThaiChot) return;                // đã chốt danh sách (patch_zs)
    setRows((prev) => prev.map((r) => (r.ma_hang === maHang ? { ...r, [colKey]: giaTri } : r)));
  };

  // Lưu khi RỜI ô, không lưu theo từng phím: gõ một đoạn tiêu chí kỹ thuật dài
  // mà bắn mỗi ký tự một request thì vừa nặng vừa đầy audit vô ích.
  const ketThucSuaO = async (maHang, colKey) => {
    setODangChon(null);
    if (COT_CHI_DOC_THEM.has(colKey) || daKhoaSua(colKey) || trangThaiChot) return;
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
        .eq("goi_id", goiId).eq("nam_de_xuat", NAM_DE_XUAT).eq("khoa", khoaHienTai)
        .eq("ma_hang", maHang).eq("cot", colKey)
        .order("thoi_gian", { ascending: false }).limit(20),
      supabase.from("danh_muc_tong_hop_o_audit")
        .select("gia_tri_cu, gia_tri_moi, nguoi_sua, thoi_gian")
        .eq("goi_id", goiId).eq("nam_de_xuat", NAM_DE_XUAT)
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
    !col.readonly && !COT_CHI_DOC_THEM.has(col.key) && !daKhoaSua(col.key)
    && !trangThaiChot;

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
    const { error } = await supabase.rpc("day_so_luong_rot", {
      p_goi_id: r.rot.goi_id,
      p_ma_hang_rot: r.ma_hang,
      p_ma_hang_nhan: formDay.maHangNhan,
      p_so_luong: soLuong,
    });
    setDangLuuDay(false);
    if (error) { setThongBaoDay(error.message); return; }
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
      await xuatExcelDong({
        tieuDe: [
          "BỆNH VIỆN ĐẠI HỌC Y DƯỢC TP HỒ CHÍ MINH",
          (khoaHienTai || "").toUpperCase(),
          `ĐỀ XUẤT DANH MỤC, SỐ LƯỢNG, YÊU CẦU KỸ THUẬT GÓI THẦU CUNG CẤP VẬT TƯ Y TẾ NĂM ${NAM_DE_XUAT}-${NAM_DE_XUAT + 1} (${boThau.nhan})`,
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
        rows,
        tenFile: `danh-muc-de-xuat-${tenFileAnToan(khoaHienTai)}-${tenFileAnToan(boThau.nhan)}-${NAM_DE_XUAT}.xlsx`,
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
            <button className={`qtdx-tb ${trangThaiChot ? "" : "primary"}`}
              onClick={doiChot} disabled={dangChot || !rows.length}>
              {trangThaiChot ? <Unlock size={13} /> : <CheckCircle2 size={13} />}
              {dangChot ? "Đang lưu…" : trangThaiChot ? "Mở lại để sửa" : "Chốt danh mục"}
            </button>
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
          {trangThaiChot && (
            <span className="qtdx-badge amber">
              <Lock size={11} className="mr-1" />
              ĐÃ CHỐT — mọi ô đang khoá · {trangThaiChot.chot_boi} · {new Date(trangThaiChot.chot_luc).toLocaleString("vi-VN")}
              {" · bấm \"Mở lại để sửa\" nếu cần chỉnh"}
            </span>
          )}
          {soOPddSuaDe > 0 && (
            <span className="qtdx-badge violet">
              Phòng Điều dưỡng đã sửa {soOPddSuaDe} ô của khoa này
              {" "}— ô có viền tím là số ĐI THẦU, không phải số khoa nộp
            </span>
          )}
          <span className="qtdx-badge green">Số lượng khoa đề xuất: chỉ sửa được ở màn Nhập đề xuất trước đấu thầu</span>
          {soMaRot > 0 && <span className="qtdx-badge red">{soMaRot} mã rớt — bấm "Đẩy SL" ở dòng mã để chuyển sang mã tương đương còn trúng</span>}
          {laPdd && <span className="qtdx-badge blue">Đang xem với quyền PĐD</span>}
        </div>
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
          const value = r[c.key];
          const pdd = oPddSuaDe(r.ma_hang, c.key);
          const cn = [
            "qtdx-cell",
            c.readonly || !canSua ? "readonly" : "",
            daKhoaSua(c.key) ? "col-locked" : "",
            oDaSua.has(`${r.ma_hang}|${c.key}`) ? "sua-de" : "",
            pdd ? "pdd-sua" : "",
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
              {isEditing ? (
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
                    <button onClick={(e) => { e.stopPropagation(); dangMoForm ? setDangChonMaDay(null) : moFormDay(r); }}
                      className="ml-1.5 inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-medium text-white align-middle">
                      <XCircle size={10} /> Rớt ở {NHAN_GIAI_DOAN[r.rot.ma_moc_rot] || r.rot.ma_moc_rot} — Đẩy SL
                    </button>
                  )}
                  {/* Lịch sử sửa ô — hiện ở MỌI ô như bên Tổng hợp PĐD, kể cả
                      ô chưa từng sửa (bấm vào thì panel báo "chưa có lần sửa
                      nào"), để không phải đoán ô nào có lịch sử. */}
                  {/* PĐD sửa gì khoa thấy hết (QĐ 08/08/2026). Số của PĐD là
                      số ĐI THẦU nên phải hiện ngay cạnh số khoa nộp, không
                      giấu trong tooltip. Khoa KHÔNG sửa được ô của PĐD. */}
                  {pdd && (
                    <span
                      className="ml-1.5 inline-flex items-center rounded bg-violet-100 px-1 py-0.5 align-middle text-[10px] font-semibold text-violet-800"
                      title={`Phòng Điều dưỡng đã sửa thành "${pdd.gia_tri ?? "(trống)"}" `
                        + `· ${pdd.updated_by} · ${new Date(pdd.updated_at).toLocaleString("vi-VN")}`}>
                      PĐD: {pdd.gia_tri === null || pdd.gia_tri === "" ? "(trống)" : pdd.gia_tri}
                    </span>
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
