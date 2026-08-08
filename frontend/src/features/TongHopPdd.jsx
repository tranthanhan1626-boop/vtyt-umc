import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Unlock, RefreshCw, Download, ChevronLeft, ChevronRight, ChevronDown, History, Users, EyeOff, AlertTriangle, AlignLeft } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";
import { tinhTuyChonMuaThem30 } from "../lib/tuyChonMuaThem";
import {
  COT_PDD, NHOM_COT_PDD, GOI_ID_MAP, sapXepFreezeTruoc, tinhLeftFreeze,
  tinhSegmentsGroup, taoCotLichSu, thayCotLichSu, suyRaNamCoDuLieu,
  taoCotLichSuNhom, chenCotLichSuNhom,
} from "../lib/cotChuan";
import { docTenCotTuMau, ganTenMau } from "../lib/tenCotBieuMau";
import { taiLichSuTheoThang, gomTheoThang } from "../lib/lichSuSuDung";
import { StyleTable, StyleToolbar, formatCell } from "./DanhMucDeXuatKhoa";
import { xuatExcelDong, tenFileAnToan } from "../lib/xuatExcelDong";

/*
 * TongHopPdd — Excel Tổng hợp Danh mục đề xuất cấp PĐD.
 *
 * Cấu trúc cột y chang file mẫu bệnh viện "Tổng hợp danh mục đề xuất chuẩn
 * pdd.xlsx" (30 cột data), NHƯNG bỏ 49 cột đánh số 1-49 tĩnh. Thay bằng cơ
 * chế "expand row" — mỗi mã hàng có thể sổ xuống thấy danh sách khoa CÓ đề
 * xuất mã đó với số lượng chi tiết, cùng tổng.
 *
 * DỮ LIỆU 06/08/2026:
 *   1. Phần ĐỌC gốc (số lịch sử, SL đề xuất thật) — nối proposals + vat_tu +
 *      nhom_ky_thuat + usage_history_current.
 *   2. Phần SỬA/KHOÁ — nối THẬT tiếp, dùng patch_zd_danh_muc_tong_hop_o.sql:
 *      bảng `danh_muc_tong_hop_o` (giá trị đã PĐD ghi đè), audit append-only
 *      qua trigger (`danh_muc_tong_hop_o_audit`), khoá cột/dòng
 *      (`danh_muc_tong_hop_khoa`). Sửa 1 ô = upsert; server tự chặn nếu cột
 *      hoặc dòng đang khoá (trigger fn_chan_o_da_lock, báo lỗi rõ ràng).
 *
 *   ⚠️ CHƯA LÀM: sửa `sl_de_xuat_2627` ở đây CHỈ ghi đè giá trị hiển thị trên
 *   Tổng hợp, KHÔNG tự "sync ngược" chia lại cho từng khoa trong `proposals`
 *   như tài liệu nghiệp vụ mô tả (mục 4.1) — thuật toán chia lại khi nhiều
 *   khoa cùng đề xuất 1 mã chưa được thiết kế, cần bàn trước khi làm tiếp.
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
async function taiDuLieuGoc(goiId) {
  const bo = GOI_ID_MAP[goiId] || GOI_ID_MAP["18t-dung-chung"];

  let qProposals = supabase.from("proposals")
    .select("ma_hang, don_vi, so_luong")
    .eq("nam_de_xuat", NAM_DE_XUAT)
    .eq("is_current", true)
    .eq("loai_mua_sam", bo.loai_mua_sam);
  if (bo.goi) qProposals = qProposals.eq("goi", bo.goi);
  const { data: propRows, error: loiProposals } = await fetchAllRows((f, t) =>
    qProposals.range(f, t), { order: "id" });
  if (loiProposals) throw loiProposals;

  const theoMa = new Map();
  (propRows || []).forEach((r) => {
    if (!theoMa.has(r.ma_hang)) theoMa.set(r.ma_hang, []);
    theoMa.get(r.ma_hang).push({ don_vi: r.don_vi, so_luong: Number(r.so_luong) || 0 });
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
      khoaDeXuat: khoaDeXuat.map((k) => ({ khoaMa: k.don_vi, khoaTen: k.don_vi, soLuong: k.so_luong })),
      tongToanVien: slDeXuat,
    };
    NGUON_KHONG_CO.forEach((k) => { row[k] = null; });
    return row;
  });

  rows.sort((a, b) =>
    (a.ma_nhom || "zzz").localeCompare(b.ma_nhom || "zzz", "vi")
    || a.ten_vt_2627.localeCompare(b.ten_vt_2627, "vi"));
  rows.forEach((r, i) => { r.stt = i + 1; });

  return { bo, rows, dsNamCoDuLieu };
}

/** Tải ô đã PĐD sửa (ghi đè) + trạng thái khoá cột/dòng cho đúng gói+năm. */
async function taiOverrideVaKhoa(goiId, namDeXuat) {
  const [{ data: oRows, error: loiO }, { data: khoaRows, error: loiKhoa }] = await Promise.all([
    fetchAllRows((f, t) => supabase.from("danh_muc_tong_hop_o")
      .select("ma_hang, cot, gia_tri")
      .eq("goi_id", goiId).eq("nam_de_xuat", namDeXuat).range(f, t), { order: "id" }),
    fetchAllRows((f, t) => supabase.from("danh_muc_tong_hop_khoa")
      .select("loai, khoa_key")
      .eq("goi_id", goiId).eq("nam_de_xuat", namDeXuat).range(f, t), { order: "id" }),
  ]);
  if (loiO) throw loiO;
  if (loiKhoa) throw loiKhoa;

  const overrideTheoMa = new Map();
  (oRows || []).forEach((r) => {
    if (!overrideTheoMa.has(r.ma_hang)) overrideTheoMa.set(r.ma_hang, new Map());
    overrideTheoMa.get(r.ma_hang).set(r.cot, r.gia_tri);
  });
  const cotLocked = new Set((khoaRows || []).filter((k) => k.loai === "cot").map((k) => k.khoa_key));
  const dongLocked = new Set((khoaRows || []).filter((k) => k.loai === "dong").map((k) => k.khoa_key));
  // loai='an_cot' (patch_zk) — ẩn cột, dùng chung cho mọi người và ảnh hưởng
  // cả file Excel xuất ra, nên phải lưu server chứ không để state cục bộ.
  const cotAn = new Set((khoaRows || []).filter((k) => k.loai === "an_cot").map((k) => k.khoa_key));
  return { overrideTheoMa, cotLocked, dongLocked, cotAn };
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

export default function TongHopPdd({ goiId = "18t-dung-chung", profile }) {
  const [rowsGoc, setRowsGoc] = useState([]);
  const [overrideTheoMa, setOverrideTheoMa] = useState(new Map());
  const [boThau, setBoThau] = useState(GOI_ID_MAP[goiId] || GOI_ID_MAP["18t-dung-chung"]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [cotLocked, setCotLocked] = useState(new Set());
  const [dongLocked, setDongLocked] = useState(new Set());
  // Chốt CẢ BẢN tổng hợp (patch_zs). Khác khoá cột/dòng: chốt là khoá tất,
  // dùng khi số đã xong và sắp mang đi thầu. Server chặn độc lập bằng trigger.
  const [chot, setChot] = useState(null);   // { chot_boi, chot_luc } | null
  const [dangChot, setDangChot] = useState(false);

  const taiLai = useCallback(async () => {
    setDangTai(true);
    setLoi("");
    try {
      const [{ bo, rows, dsNamCoDuLieu: dsNam }, khoaVaOverride, chotRes] = await Promise.all([
        taiDuLieuGoc(goiId),
        taiOverrideVaKhoa(goiId, NAM_DE_XUAT),
        supabase.from("danh_muc_tong_hop_chot")
          .select("chot_boi, chot_luc")
          .eq("goi_id", goiId).eq("nam_de_xuat", NAM_DE_XUAT).maybeSingle(),
      ]);
      const { overrideTheoMa: ov, cotLocked: cl, dongLocked: dl, cotAn: ca } = khoaVaOverride;
      // Chưa chạy patch_zs -> bảng chưa có; coi như chưa chốt, không làm vỡ màn.
      setChot(chotRes.error ? null : (chotRes.data || null));
      setBoThau(bo);
      setRowsGoc(rows);
      setDsNamCoDuLieu(dsNam || []);
      setOverrideTheoMa(ov);
      setCotLocked(cl);
      setDongLocked(dl);
      setCotAn(ca);
    } catch (e) {
      setLoi(e.message || "Không tải được dữ liệu.");
    } finally {
      setDangTai(false);
    }
  }, [goiId]);

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

  const cotHienThi = useMemo(
    () => sapXepFreezeTruoc(cotDayDu.filter((c) => !cotAn.has(c.key))),
    [cotAn, cotDayDu]
  );
  const groupSegments = useMemo(
    () => tinhSegmentsGroup(cotHienThi, NHOM_COT_PDD),
    [cotHienThi]
  );
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
        .eq("goi_id", goiId).eq("nam_de_xuat", NAM_DE_XUAT).eq("loai", loai).eq("khoa_key", khoaKey);
      if (error) { setLoiO(thongBaoLoiKhoa(error, loai)); return; }
      setStateTheoLoai(loai)((prev) => { const n = new Set(prev); n.delete(khoaKey); return n; });
    } else {
      const { error } = await supabase.from("danh_muc_tong_hop_khoa").insert({
        goi_id: goiId, nam_de_xuat: NAM_DE_XUAT, loai, khoa_key: khoaKey,
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

  // ---- Xuất Excel -------------------------------------------------------
  // Chỉ xuất CỘT ĐANG HIỆN (ẩn cột thì Excel cũng mất cột đó) và, nếu đang
  // bật chi tiết, thêm MỖI KHOA MỘT CỘT — đúng như file mẫu bệnh viện vốn có
  // 49 cột đánh số cho 49 khoa. Không dùng file mẫu cố định được vì số cột
  // thay đổi theo lúc xuất, xem lib/xuatExcelDong.js.
  const xuatExcel = async () => {
    setDangXuat(true);
    setLoiO("");
    try {
      const tenKhoa = hienChiTietKhoa
        ? [...new Set(rows.flatMap((r) => r.khoaDeXuat.map((k) => k.khoaTen)))]
            .sort((a, b) => a.localeCompare(b, "vi"))
        : [];
      const cotKhoa = tenKhoa.map((ten) => ({ key: `khoa::${ten}`, nhan: ten, width: 90 }));

      const duLieu = rows.map((r) => {
        const dong = { ...r };
        if (hienChiTietKhoa) {
          r.khoaDeXuat.forEach((k) => { dong[`khoa::${k.khoaTen}`] = k.soLuong; });
          dong["khoa::__tong"] = r.tongToanVien;
        }
        return dong;
      });

      const cotXuat = [
        ...cotHienThi.map((c) => ({ key: c.key, nhan: c.nhan, nhanMau: c.nhanMau, width: c.width })),
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
        ],
        // Tên cột lấy từ file biểu mẫu (cotGoc = COT_PDD vì thứ tự của nó
        // khớp vị trí với mẫu; cột năm động rơi xuống nhanMau tự sinh).
        cot: ganTenMau(cotXuat, COT_PDD, tenMau),
        cotKhoa,
        rows: duLieu,
        tenFile: `tong-hop-di-thau-${tenFileAnToan(boThau.nhan)}-${NAM_DE_XUAT}.xlsx`,
        tenSheet: "Tổng hợp",
      });
    } catch (e) {
      setLoiO(e.message || "Không xuất được Excel.");
    } finally {
      setDangXuat(false);
    }
  };

  // Chốt / mở chốt cả bản tổng hợp (patch_zs). Xoá dòng = mở chốt; trigger tự
  // ghi audit nên không mất dấu vết ai chốt, ai mở, lúc nào.
  const doiChot = async () => {
    setDangChot(true);
    setLoiO("");
    const dangChot = !!chot;
    const { data, error } = dangChot
      ? await supabase.from("danh_muc_tong_hop_chot").delete()
          .eq("goi_id", goiId).eq("nam_de_xuat", NAM_DE_XUAT).select()
      : await supabase.from("danh_muc_tong_hop_chot")
          .insert({ goi_id: goiId, nam_de_xuat: NAM_DE_XUAT, chot_boi: profile.email })
          .select();
    setDangChot(false);
    if (error) {
      const chuaCoBang = error.code === "42P01"
        || /danh_muc_tong_hop_chot/i.test(error.message || "");
      setLoiO(chuaCoBang
        ? "Staging chưa có chức năng chốt bản tổng hợp. Cần chạy backend/sql/patch_zs_so_chot_va_khoa_sau_chot.sql."
        : error.message);
      return;
    }
    // Bẫy 18: xoá trả 200 kèm mảng rỗng khi RLS chặn — phải đếm dòng thật.
    if (!data?.length) {
      setLoiO(dangChot
        ? "Không mở được chốt — tài khoản không có quyền, hoặc chưa chạy patch_zs."
        : "Không chốt được — tài khoản không có quyền, hoặc chưa chạy patch_zs.");
      return;
    }
    setChot(dangChot ? null : data[0]);
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
    const { error } = await supabase.from("danh_muc_tong_hop_o").upsert({
      goi_id: goiId, nam_de_xuat: NAM_DE_XUAT, ma_hang: maHang, cot: colKey,
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
    setODangChon(null);
  };

  // Bỏ sửa đè: xoá dòng override -> ô trở lại đúng giá trị hệ thống tính.
  // Cần patch_zl (patch_zd thiếu policy DELETE nên xoá bị RLS chặn ÂM THẦM —
  // trả 200 nhưng không xoá dòng nào, đúng bẫy số 5 trong tài liệu vận hành).
  const khoiPhucOGoc = async (maHang, colKey) => {
    setLoiO("");
    const { data, error } = await supabase.from("danh_muc_tong_hop_o")
      .delete()
      .eq("goi_id", goiId).eq("nam_de_xuat", NAM_DE_XUAT)
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
    setODangChon(null);
  };

  const xemAudit = async (maHang, colKey) => {
    setAudit({ maHang, cot: colKey, dsAudit: [], dangTai: true });
    const { data, error } = await supabase.from("danh_muc_tong_hop_o_audit")
      .select("gia_tri_cu, gia_tri_moi, nguoi_sua, thoi_gian")
      .eq("goi_id", goiId).eq("nam_de_xuat", NAM_DE_XUAT).eq("ma_hang", maHang).eq("cot", colKey)
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
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-teal-700">
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
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button className="qtdx-tb" onClick={taiLai}><RefreshCw size={13} /> Tải lại</button>
            <button className="qtdx-tb"><Users size={13} /> Xem theo khoa ▾</button>
            <div className="relative">
              <button className="qtdx-tb" onClick={() => setOpenMenuCot((v) => !v)}>
                <EyeOff size={13} /> Cột hiển thị ({cotHienThi.length}/{cotDayDu.length})
              </button>
              {openMenuCot && (
                <div className="absolute right-0 top-full mt-1 w-72 max-h-96 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg z-40">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Chọn cột hiển thị</span>
                    <button className="text-xs text-teal-700 hover:underline" onClick={() => setCotAn(new Set())}>Hiện tất cả</button>
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
              onClick={doiChot} disabled={dangChot || !rows.length}
              title={chot
                ? "Bản tổng hợp đang KHOÁ. Mở chốt để sửa tiếp."
                : "Chốt số để mang đi thầu — khoá mọi ô, không ai sửa được nữa."}>
              {chot ? <Unlock size={13} /> : <Lock size={13} />}
              {dangChot ? "Đang lưu…" : chot ? "Mở chốt để sửa" : "Chốt số đi thầu"}
            </button>
            <button className="qtdx-tb" onClick={xuatExcel} disabled={dangXuat || !rows.length}>
              <Download size={13} /> {dangXuat ? "Đang xuất…" : "Xuất Excel đi thầu"}
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] flex-wrap">
          <span className="qtdx-badge blue">Tổng mã hàng: {tongMaHang}</span>
          <span className="qtdx-badge green">{tongKhoaThamGia} khoa đã đề xuất</span>
          {chot && (
            <span className="qtdx-badge amber">
              ĐÃ CHỐT SỐ ĐI THẦU — mọi ô đang khoá · {chot.chot_boi}
              {" · "}{new Date(chot.chot_luc).toLocaleString("vi-VN")}
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
            <col style={{ width: 160 }} />
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
              <th style={{ minWidth: 160 }}>Số khoa · sổ chi tiết</th>
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
                        className="text-slate-500 hover:text-teal-700 p-1"
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
                    const value = r[c.key];
                    const daSuaDe = oBiSuaDe(r.ma_hang, c.key);
                    const cn = [
                      "qtdx-cell",
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
                        title={daSuaDe
                          ? `Đã sửa đè — số gốc: ${formatCell(giaTriGoc(r.ma_hang, c.key), c.kieu) || "(trống)"}`
                          : undefined}
                        onClick={() => canSua && !isEditing && batDauSua(r.ma_hang, c.key, value)}
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
                                className="text-[10px] rounded bg-teal-700 text-white px-1.5 py-0.5">
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
                  <td className="qtdx-cell readonly" style={{ minWidth: 160 }}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-mono text-emerald-800 font-semibold">{r.khoaDeXuat.length}</span>
                      <span className="text-slate-500">khoa · tổng</span>
                      <span className="font-mono font-semibold">{fmt(r.tongToanVien)}</span>
                    </span>
                  </td>
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
                      <td colSpan={cotHienThi.length + 1} className="qtdx-cell" style={{ background: "#f8fafc" }}>
                        <div className="pl-4 py-1">
                          <div className="text-[11px] text-slate-500 mb-1.5">
                            Số lượng đề xuất chi tiết từ {r.khoaDeXuat.length} khoa cho mã <b>{r.ma_hang}</b> · <em>{r.ten_vt_2627?.slice(0, 60)}...</em>
                          </div>
                          <table className="w-auto">
                            <thead>
                              <tr>
                                <th className="text-left text-[10.5px] font-normal text-slate-500 px-3 py-1.5" style={{ background: "transparent", color: "#64748b", position: "static" }}>Khoa</th>
                                <th className="text-right text-[10.5px] font-normal text-slate-500 px-3 py-1.5" style={{ background: "transparent", color: "#64748b", position: "static" }}>SL đề xuất</th>
                                <th className="text-right text-[10.5px] font-normal text-slate-500 px-3 py-1.5" style={{ background: "transparent", color: "#64748b", position: "static" }}>Tỉ trọng</th>
                                <th className="text-left text-[10.5px] font-normal text-slate-500 px-3 py-1.5" style={{ background: "transparent", color: "#64748b", position: "static" }}>Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.khoaDeXuat.map((k) => (
                                <tr key={k.khoaMa}>
                                  <td className="px-3 py-1 text-xs">{k.khoaTen}</td>
                                  <td className="px-3 py-1 text-xs text-right font-mono">{fmt(k.soLuong)}</td>
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
                                <td className="px-3 py-1 text-xs text-right font-mono font-semibold border-t border-slate-200">{fmt(r.tongToanVien)}</td>
                                <td className="px-3 py-1 border-t border-slate-200"></td>
                                <td className="px-3 py-1 border-t border-slate-200"></td>
                              </tr>
                            </tbody>
                          </table>
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
    </div>
  );
}

// Fragment mà chấp nhận key — Motion cần key để animate. Dùng React Fragment
// bình thường trả về array 2 <tr>.
function FragmentRow({ children }) {
  return <>{children}</>;
}
