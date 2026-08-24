import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Bell, Building2, CheckCircle2, ChevronDown, ChevronRight,
  Copy, Database, ExternalLink, FileSignature, Layers3, RefreshCw, Search,
  Trash2, XCircle,
} from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";
import { GOI_ID_MAP } from "../lib/cotChuan";
import { gomTheoMaQuanLy, tinhTinhHinhKhoa, tinhTongQuan } from "../lib/tongHopDeXuat";
import HoSoTrucTuyen from "./HoSoTrucTuyen";
import GioRotToanVien from "./GioRotToanVien";

/*
 * BanDieuHanhPdd — màn hình làm việc chính của Phòng Điều dưỡng
 * (mục 14 / 3.4 "Màn PĐD chính mới", Tổng quan/05_TIEN_DO_VA_VIEC_TIEP_THEO.md).
 *
 * Trước đây PĐD dùng đúng khung màn hình của khoa, chỉ thêm vài tab, nên
 * không trả lời được 3 câu hỏi điều hành: khoa nào chưa đề xuất, khoa nào
 * chưa đủ hồ sơ, và toàn viện đang đề xuất bao nhiêu. Màn này gom cả ba vào
 * một chỗ, chọn ĐỢT + GÓI CON ở đầu rồi xem theo 3 tab.
 *
 * Gom nhóm/tính tỉ trọng nằm ở `lib/tongHopDeXuat.js` để test được bằng node
 * (số trình hội đồng phải tái lập được, không chỉ tin màn hình).
 */

const GIAI_DOAN = [
  { ma: "chao_gia", ten: "Chào giá" },
  { ma: "mo_thau", ten: "Mở thầu" },
  { ma: "danh_gia", ten: "Đánh giá" },
];

const NAM_DE_XUAT = new Date().getFullYear() + 1;

// goiId (khoá GOI_ID_MAP) của các gói con thuộc một loại mua sắm.
const goiConCuaLoai = (loai) =>
  Object.entries(GOI_ID_MAP)
    .filter(([, v]) => v.loai_mua_sam === loai)
    .map(([k, v]) => ({ goiId: k, ...v }));

const fmtNgay = (s) => (s ? new Date(s).toLocaleDateString("vi-VN") : "—");
const soNgayTu = (s) => (s ? Math.floor((Date.now() - new Date(s).getTime()) / 86400000) : null);

// Ngưỡng khớp với hàm do_dung_luong (patch_zu): 70% để ý · 85% chạy nén
// patch_zn trong quý này · 95% xử lý ngay.
const MAU_DUNG_LUONG = {
  on:        "border-slate-200 bg-slate-50 text-slate-600",
  de_y:      "border-sky-200 bg-sky-50 text-sky-800",
  canh_bao:  "border-amber-300 bg-amber-50 text-amber-900",
  nguy_hiem: "border-red-300 bg-red-50 text-red-800",
};
const NHAN_DUNG_LUONG = {
  de_y:      "— bắt đầu để ý",
  canh_bao:  "— nên chạy nén lịch sử (patch_zn) trong quý này",
  nguy_hiem: "— SẮP KHOÁ GHI, xử lý ngay",
};

export default function BanDieuHanhPdd({ profile, onMoManKhac }) {
  const [dsDot, setDsDot] = useState([]);
  const [dotId, setDotId] = useState("");
  const [goiConId, setGoiConId] = useState("");   // "" = tất cả gói con
  const [tab, setTab] = useState("khoa");          // khoa | tong_hop | ket_qua

  const [rows, setRows] = useState([]);
  const [dsKhoa, setDsKhoa] = useState([]);
  const [khoaCoWord, setKhoaCoWord] = useState(new Set());
  const [khoaDaChot, setKhoaDaChot] = useState(new Set());
  const [ketQuaRot, setKetQuaRot] = useState([]);
  const [dsDotGoi, setDsDotGoi] = useState([]);
  const [giaiDoanThau, setGiaiDoanThau] = useState([]);
  const [gioRotV3, setGioRotV3] = useState([]);
  const [phanBoTrungV3, setPhanBoTrungV3] = useState([]);
  const [khoaThamGiaV3, setKhoaThamGiaV3] = useState([]);
  const [chotDanhMucV3, setChotDanhMucV3] = useState([]);
  const [chotTrinhKyKhoaV3, setChotTrinhKyKhoaV3] = useState([]);
  const [phienTrinhKyV3, setPhienTrinhKyV3] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [canhBaoChot, setCanhBaoChot] = useState("");
  const [mocHis, setMocHis] = useState(null); // { nam, thang } mới nhất
  // Dung lượng Supabase (patch_zu). Dự án chốt chỉ dùng gói FREE 500MB và
  // lịch sử HIS tăng ~96.000 dòng/năm — đụng trần là Supabase KHOÁ GHI, giữa
  // mùa đấu thầu thì hỏng việc thật. Không ai nhớ vào Dashboard đo tay, nên
  // để app tự báo.
  const [dungLuong, setDungLuong] = useState(null);
  const [formDon, setFormDon] = useState(null); // số dòng sẽ xoá, chờ xác nhận
  const [dangDon, setDangDon] = useState(false);
  const [thongBao, setThongBao] = useState("");

  const [locKhoa, setLocKhoa] = useState("tat_ca"); // tat_ca | chua | thieu_ho_so | du
  const [tuKhoa, setTuKhoa] = useState("");
  const [mqMo, setMqMo] = useState(new Set());
  const [mhMo, setMhMo] = useState(new Set());
  const [khoaDaCopy, setKhoaDaCopy] = useState(null);

  // Hộp thoại tích rớt: { maHang: string[], nhan: string, laCaNhom: bool }
  const [formRot, setFormRot] = useState(null);
  const [mocRot, setMocRot] = useState("chao_gia");
  const [lyDoRot, setLyDoRot] = useState("");
  const [soLuongRot, setSoLuongRot] = useState("");
  const [dangLuuRot, setDangLuuRot] = useState(false);
  const [loiRot, setLoiRot] = useState("");

  // ---- Đợt ---------------------------------------------------------------
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("dot_de_xuat").select("*")
        .neq("loai_mua_sam", "chi_dinh_thau")
        .order("nam", { ascending: false }).order("thang_moc", { ascending: false });
      if (error) { setLoi(`Không đọc được danh sách đợt: ${error.message}`); setDangTai(false); return; }
      setDsDot(data || []);
      setDotId((cu) => cu || String(data?.find((d) => d.trang_thai === "mo")?.id || data?.[0]?.id || ""));
    })();
  }, []);

  const dot = useMemo(() => dsDot.find((d) => String(d.id) === dotId) || null, [dsDot, dotId]);
  const dsGoiCon = useMemo(() => (dot ? goiConCuaLoai(dot.loai_mua_sam) : []), [dot]);

  // Đổi đợt sang loại khác thì gói con cũ không còn hợp lệ.
  useEffect(() => {
    setGoiConId((cu) => (cu && dsGoiCon.some((g) => g.goiId === cu) ? cu : ""));
  }, [dsGoiCon]);

  // goiId dùng cho danh_muc_khoa_chot / link Danh mục đề xuất. Gói bổ sung chỉ
  // có một khoá "bo-sung" (xem bẫy 16, Tổng quan/04_VAN_HANH_KY_THUAT.md).
  const goiIdHienTai = goiConId || (dot?.loai_mua_sam === "mua_sam_bo_sung" ? "bo-sung" : "");
  const dotGoiHienTai = useMemo(
    () => (goiConId ? dsDotGoi.find((dg) => dg.goi_id === goiConId) || null : null),
    [dsDotGoi, goiConId]
  );

  // ---- Dữ liệu chính ------------------------------------------------------
  const tai = useCallback(async () => {
    if (!dot) return;
    setDangTai(true);
    setLoi("");
    setCanhBaoChot("");

    const { data: dotGoiData, error: loiDotGoi } = await supabase.from("dot_goi")
      .select("id, goi_id").eq("dot_id", dot.id).order("id");
    if (loiDotGoi) {
      setLoi(`Không đọc được DOT_GOI: ${loiDotGoi.message}`);
      setDangTai(false);
      return;
    }
    const dotGoiDangXem = (dotGoiData || []).filter((dg) => !goiConId || dg.goi_id === goiConId);
    const dotGoiIds = dotGoiDangXem.map((dg) => dg.id);
    setDsDotGoi(dotGoiData || []);

    const [rDeXuat, rKhoa, rHoSo, rKetQua, rGiaiDoan, rGioRot, rPhanBoTrung,
      rKhoaThamGia, rSoHienHanh, rChotTrinhKyKhoa, rPhienTrinhKy] = await Promise.all([
      fetchAllRows((f, t) => supabase.from("v_de_xuat_tong_hop").select("*")
        .eq("loai_mua_sam", dot.loai_mua_sam).eq("dot_id", dot.id).range(f, t), { order: "id" }),
      supabase.from("v_don_vi").select("don_vi"),
      fetchAllRows((f, t) => supabase.from("ho_so_cong_tac")
        .select("don_vi, loai_tai_lieu, ma_ho_so")
        .eq("dot_id", dot.id).eq("loai_tai_lieu", "word").range(f, t), { order: "id" }),
      dotGoiIds.length
        ? fetchAllRows((f, t) => supabase.from("v_ket_qua_thau_v3").select("*")
          .in("dot_goi_id", dotGoiIds).range(f, t), { order: "ma_hang" })
        : Promise.resolve({ data: [] }),
      dotGoiIds.length
        ? fetchAllRows((f, t) => supabase.from("giai_doan_thau_v3").select("*")
          .in("dot_goi_id", dotGoiIds).range(f, t), { order: ["dot_goi_id", "thu_tu"] })
        : Promise.resolve({ data: [] }),
      dotGoiIds.length
        ? fetchAllRows((f, t) => supabase.from("v_gio_rot_v3").select("*")
          .in("dot_goi_id", dotGoiIds).range(f, t), { order: ["khoa", "ma_quan_ly"] })
        : Promise.resolve({ data: [] }),
      dotGoiIds.length
        ? fetchAllRows((f, t) => supabase.from("phan_bo_trung_v3").select("*")
          .in("dot_goi_id", dotGoiIds).range(f, t), { order: ["ma_hang", "khoa"] })
        : Promise.resolve({ data: [] }),
      dotGoiIds.length
        ? fetchAllRows((f, t) => supabase.from("dot_goi_khoa")
          .select("dot_goi_id,khoa,tham_gia").in("dot_goi_id", dotGoiIds)
          .eq("tham_gia", true).range(f, t), { order: ["dot_goi_id", "khoa"] })
        : Promise.resolve({ data: [] }),
      // Số HIỆN HÀNH theo (mã hàng × khoa). `v_de_xuat_tong_hop` đọc
      // `proposals.so_luong` — đó là dấu vết GỐC, bất biến, KHÔNG phải số đang
      // dùng. Mục III: `phan_bo_khoa` là nguồn duy nhất của số hiện hành.
      // Thiếu lớp phủ này thì Bàn điều hành và Danh mục tổng hợp cho hai con
      // số khác nhau cho cùng một mã (đo được: 286 so với 246).
      dotGoiIds.length
        ? fetchAllRows((f, t) => supabase.from("phan_bo_khoa")
          .select("ma_hang,khoa,so_luong_hien_hanh").in("dot_goi_id", dotGoiIds)
          .range(f, t), { order: ["ma_hang", "khoa"] })
        : Promise.resolve({ data: [] }),
      dotGoiIds.length
        ? fetchAllRows((f, t) => supabase.from("chot_trinh_ky_khoa_v3").select("*")
          .in("dot_goi_id", dotGoiIds).range(f, t), { order: ["dot_goi_id", "khoa"] })
        : Promise.resolve({ data: [] }),
      dotGoiIds.length
        ? fetchAllRows((f, t) => supabase.from("chot_trinh_ky_phien_v3").select("*")
          .in("dot_goi_id", dotGoiIds).eq("hieu_luc", true).range(f, t), { order: "id" })
        : Promise.resolve({ data: [] }),
    ]);

    if (rDeXuat.error) {
      setLoi(`Không đọc được đề xuất: ${rDeXuat.error.message}`);
      setDangTai(false);
      return;
    }
    // Mã rớt đã chuyển hết SL sang mã tương đương chỉ còn lưu ở Tiến độ gói
    // thầu. Loại khỏi danh mục điều hành để khoa/PĐD cùng nhìn một danh mục.
    // Phủ số hiện hành lên dấu vết gốc trước khi mọi thứ khác tính trên `rows`.
    const soHienHanh = new Map(
      (rSoHienHanh.error ? [] : (rSoHienHanh.data || []))
        .map((x) => [`${x.ma_hang}|${x.khoa}`, Number(x.so_luong_hien_hanh)]),
    );
    setRows((rDeXuat.data || [])
      .map((r) => {
        const hh = soHienHanh.get(`${r.ma_hang}|${r.don_vi}`);
        return hh === undefined ? r : { ...r, so_luong: hh };
      })
      .filter((r) => Number(r.so_luong) > 0));
    setDsKhoa((rKhoa.data || []).map((x) => x.don_vi));
    setKhoaCoWord(new Set((rHoSo.data || []).map((x) => x.don_vi)));
    setKetQuaRot(rKetQua.error ? [] : (rKetQua.data || []));
    setGiaiDoanThau(rGiaiDoan.error ? [] : (rGiaiDoan.data || []));
    setGioRotV3(rGioRot.error ? [] : (rGioRot.data || []));
    setPhanBoTrungV3(rPhanBoTrung.error ? [] : (rPhanBoTrung.data || []));
    setKhoaThamGiaV3(rKhoaThamGia.error ? [] : (rKhoaThamGia.data || []));
    setChotTrinhKyKhoaV3(rChotTrinhKyKhoa.error ? [] : (rChotTrinhKyKhoa.data || []));
    setPhienTrinhKyV3(rPhienTrinhKy.error ? [] : (rPhienTrinhKy.data || []));

    // Mốc dữ liệu HIS mới nhất — PĐD nạp file 2 lần/tuần nên cần biết ngay
    // "số đang dùng để tính là tới tháng mấy", không phải tự nhớ.
    // Chỉ số dung lượng: thiếu patch_zu thì bỏ qua, không làm hỏng Bàn điều hành.
    supabase.rpc("do_dung_luong").then(({ data, error }) => {
      if (!error) setDungLuong(data);
    });

    const { data: hisMoi } = await supabase.from("usage_history_current")
      .select("nam, thang").order("nam", { ascending: false })
      .order("thang", { ascending: false }).limit(1);
    setMocHis(hisMoi?.[0] || null);

    // Bảng chốt danh mục là patch mới — thiếu thì chỉ mất một cột, không được
    // làm hỏng cả màn hình.
    // V2 (19/08/2026): bảng này giờ là VÒNG XÁC NHẬN. Chỉ dòng còn `hieu_luc`
    // mới tính là "khoa đã xác nhận bản hiện tại" — dòng bị huỷ vẫn nằm đó để
    // giữ số lần, đếm cả nó thì màn này báo xanh trong khi PĐD không chốt được.
    let qChot = supabase.from("danh_muc_khoa_chot")
      .select("khoa, dot_goi_id, lan, hieu_luc").eq("hieu_luc", true);
    if (dotGoiIds.length) qChot = qChot.in("dot_goi_id", dotGoiIds);
    const { data: chotData, error: loiChot } = await qChot;
    if (loiChot) {
      setKhoaDaChot(new Set());
      setChotDanhMucV3([]);
      setCanhBaoChot(
        loiChot.code === "42P01" || /danh_muc_khoa_chot/i.test(loiChot.message || "")
          ? "Chưa chạy backend/sql/patch_zj_ban_dieu_hanh_pdd.sql — cột \"Đã xác nhận\" tạm để trống."
          : loiChot.message
      );
    } else {
      setKhoaDaChot(new Set((chotData || []).map((x) => x.khoa)));
      setChotDanhMucV3(chotData || []);
    }
    setDangTai(false);
  }, [dot, goiConId]);

  useEffect(() => { tai(); }, [tai]);

  // ---- Lọc theo gói con ---------------------------------------------------
  const rowsLoc = useMemo(() => {
    if (!goiConId) return rows;
    const nhanGoi = GOI_ID_MAP[goiConId]?.goi;
    return nhanGoi ? rows.filter((r) => r.goi === nhanGoi) : rows;
  }, [rows, goiConId]);

  const cay = useMemo(() => gomTheoMaQuanLy(rowsLoc), [rowsLoc]);

  // Khi đang đứng ở một gói con cụ thể, bảng theo dõi chỉ được đếm những khoa
  // THAM GIA gói con đó (dot_goi_khoa). Trước 18/08/2026 màn này luôn đếm 62
  // khoa toàn viện, nên "Chưa đề xuất: 61" gồm cả những khoa vốn không thuộc
  // gói — và chính con số đó là thứ PĐD nhìn để quyết định thời điểm bấm
  // "Chốt số tham gia đấu thầu" ở Giai đoạn 6.
  const dsKhoaTheoGoi = useMemo(() => {
    if (!goiConId || !dotGoiHienTai) return dsKhoa;
    const thamGia = new Set(
      khoaThamGiaV3.filter((x) => x.dot_goi_id === dotGoiHienTai.id).map((x) => x.khoa)
    );
    // Chưa đọc được bảng tham gia thì giữ nguyên danh sách toàn viện — thà
    // đếm rộng còn hơn giấu mất khoa đang nợ đề xuất.
    return thamGia.size ? dsKhoa.filter((k) => thamGia.has(k)) : dsKhoa;
  }, [dsKhoa, khoaThamGiaV3, goiConId, dotGoiHienTai]);

  const tinhHinhKhoa = useMemo(
    () => tinhTinhHinhKhoa(dsKhoaTheoGoi, rowsLoc, khoaCoWord, khoaDaChot),
    [dsKhoaTheoGoi, rowsLoc, khoaCoWord, khoaDaChot]
  );
  const tongQuan = useMemo(() => tinhTongQuan(tinhHinhKhoa, cay), [tinhHinhKhoa, cay]);

  const maDangRot = useMemo(() => {
    const m = new Map();
    ketQuaRot.filter((r) => r.co_rot).forEach((r) => { if (!m.has(r.ma_hang)) m.set(r.ma_hang, r); });
    return m;
  }, [ketQuaRot]);

  // ---- Tab 1: bảng khoa ---------------------------------------------------
  const khoaHienThi = useMemo(() => {
    const q = tuKhoa.trim().toLowerCase();
    return tinhHinhKhoa.filter((k) => {
      if (q && !k.don_vi.toLowerCase().includes(q)) return false;
      if (locKhoa === "chua") return !k.daDeXuat;
      if (locKhoa === "thieu_ho_so") return k.daDeXuat && !k.duHoSo;
      if (locKhoa === "du") return k.duHoSo;
      return true;
    });
  }, [tinhHinhKhoa, tuKhoa, locKhoa]);

  // ---- Tab 2: cây tổng hợp ------------------------------------------------
  const cayHienThi = useMemo(() => {
    const q = tuKhoa.trim().toLowerCase();
    if (!q) return cay;
    return cay
      .map((mq) => {
        const khopNhom = `${mq.ma_quan_ly} ${mq.ten_quan_ly}`.toLowerCase().includes(q);
        if (khopNhom) return mq;
        const maHang = mq.maHang.filter((mh) =>
          `${mh.ma_hang} ${mh.ten_vat_tu}`.toLowerCase().includes(q));
        return maHang.length ? { ...mq, maHang } : null;
      })
      .filter(Boolean);
  }, [cay, tuKhoa]);

  const doiMo = (setFn, key) => setFn((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  // ---- Tích rớt -----------------------------------------------------------
  const moFormRot = (maHang, nhan, laCaNhom, maQuanLy = null) => {
    if (!dotGoiHienTai) {
      setLoi("Chọn đúng một gói con trước khi nhập kết quả đấu thầu.");
      return;
    }
    setFormRot({ maHang, nhan, laCaNhom, maQuanLy, rotToanBo: laCaNhom });
    // Ngoại lệ rớt chỉ ghi được khi giai đoạn ĐANG THỰC HIỆN, nên chọn sẵn
    // đúng giai đoạn đó. Mặc định cũ luôn là "chao_gia", nên khi đang ở Mở
    // thầu/Đánh giá thì PĐD bấm Xác nhận là ăn ngay "Giai đoạn phải ở trạng
    // thái đang thực hiện" mà không hiểu vì sao.
    const dangChay = giaiDoanThau.find(
      (x) => x.dot_goi_id === dotGoiHienTai.id && x.trang_thai === "dang_thuc_hien");
    setMocRot(dangChay?.giai_doan || "chao_gia");
    setSoLuongRot("");
    setLyDoRot("");
    setLoiRot("");
  };

  const luuRot = async () => {
    if (!lyDoRot.trim()) { setLoiRot("Phải nhập lý do rớt thầu."); return; }
    setDangLuuRot(true);
    setLoiRot("");
    // Ba nhánh thoát sớm này PHẢI tắt cờ đang lưu, nếu không nút kẹt ở
    // "Đang lưu…" vĩnh viễn và chỉ F5 mới thoát được.
    if (!dotGoiHienTai) { setDangLuuRot(false); setLoiRot("Chưa chọn gói con."); return; }
    if (!formRot.rotToanBo && (!soLuongRot || Number(soLuongRot) <= 0)) {
      setDangLuuRot(false);
      setLoiRot("Nhập số lượng rớt một phần, hoặc chọn Rớt toàn bộ.");
      return;
    }
    const { data, error } = formRot.laCaNhom
      ? await supabase.rpc("rot_toan_bo_ma_quan_ly_v3", {
        p_dot_goi_id: dotGoiHienTai.id, p_ma_quan_ly: formRot.maQuanLy,
        p_giai_doan: mocRot, p_ly_do: lyDoRot.trim(),
      })
      : await supabase.rpc("ghi_ngoai_le_rot_v3", {
        p_dot_goi_id: dotGoiHienTai.id, p_ma_hang: formRot.maHang[0],
        p_giai_doan: mocRot,
        p_so_luong_rot: formRot.rotToanBo ? null : Number(soLuongRot),
        p_rot_toan_bo: !!formRot.rotToanBo, p_ly_do: lyDoRot.trim(),
      });
    setDangLuuRot(false);
    if (error) {
      const chuaPatch = error.code === "PGRST202" || /ngoai_le_rot_v3|rot_toan_bo_ma_quan_ly_v3/i.test(error.message || "");
      setLoiRot(chuaPatch
        ? "Staging chưa có pipeline kết quả v3. Cần chạy patch_zzzzc_v3_ket_qua_thau.sql."
        : error.message);
      return;
    }
    setThongBao(formRot.laCaNhom
      ? `Đã ghi rớt toàn bộ ${Number(data) || 0} mã hàng trong mã quản lý.`
      : `Đã ghi ngoại lệ rớt cho mã ${formRot.maHang[0]}.`);
    setFormRot(null);
    await tai();
  };

  const boRot = async (maHang, giaiDoan) => {
    setThongBao("");
    if (!dotGoiHienTai) { setLoi("Chọn một gói con trước."); return; }
    const lyDo = window.prompt("Lý do bỏ ngoại lệ rớt:", "") || "";
    if (!lyDo.trim()) return;
    const { data, error } = await supabase.rpc("bo_ngoai_le_rot_v3", {
      p_dot_goi_id: dotGoiHienTai.id,
      p_ma_hang: maHang,
      p_giai_doan: giaiDoan,
      p_ly_do: lyDo,
    });
    if (error) {
      const chuaPatch = error.code === "PGRST202" || /bo_ngoai_le_rot_v3/i.test(error.message || "");
      setLoi(chuaPatch
        ? "Staging chưa có pipeline kết quả v3. Cần chạy patch_zzzzc_v3_ket_qua_thau.sql."
        : error.message);
      return;
    }
    setThongBao(data ? "Đã bỏ ngoại lệ; số trúng và phân bổ đã tự tính lại." : "Không tìm thấy ngoại lệ hiệu lực.");
    await tai();
  };

  const doiGiaiDoan = async (giaiDoan, trangThai, dangMoLai = false) => {
    if (!dotGoiHienTai) { setLoi("Chọn một gói con trước."); return; }
    let lyDo = null;
    if (dangMoLai) {
      lyDo = window.prompt("Lý do mở lại giai đoạn (kết quả giai đoạn này và phía sau sẽ hết hiệu lực):", "") || "";
      if (!lyDo.trim()) return;
    }
    const { error } = await supabase.rpc("cap_nhat_giai_doan_thau_v3", {
      p_dot_goi_id: dotGoiHienTai.id, p_giai_doan: giaiDoan,
      p_trang_thai: trangThai, p_ly_do: lyDo,
    });
    if (error) { setLoi(error.message); return; }
    setThongBao(dangMoLai
      ? "Đã mở lại giai đoạn; kết quả từ checkpoint này trở đi đã hết hiệu lực."
      : `Đã chuyển giai đoạn sang ${trangThai === "hoan_thanh" ? "hoàn thành" : "đang thực hiện"}.`);
    await tai();
  };

  const luuPhanBoTrung = async (maHang, giaTri, lyDo) => {
    if (!dotGoiHienTai) return { error: new Error("Chưa chọn gói con.") };
    const { error } = await supabase.rpc("cap_nhat_phan_bo_trung_v3", {
      p_dot_goi_id: dotGoiHienTai.id, p_ma_hang: maHang,
      p_phan_bo: Object.fromEntries(Object.entries(giaTri).map(([k, v]) => [k, Number(v)])),
      p_ly_do: lyDo || null,
    });
    if (!error) {
      setThongBao("Đã lưu phân bổ số trúng; tổng đã được kiểm ở server.");
      await tai();
    }
    return { error };
  };

  // ---- Dọn dữ liệu làm việc cuối đợt (patch_zm) ---------------------------
  // Chốt 07/08/2026: xuất Excel KHÔNG xoá gì. Chỉ khi đợt xong hẳn mới dọn,
  // và phải xem trước sẽ xoá bao nhiêu dòng rồi mới xác nhận — xoá nhầm là
  // mất công cả khoa gõ tay, không hoàn tác được.
  const moDonDuLieu = async () => {
    // patch_zzzzx (20/08/2026) — PHẢI truyền DOT_GOI. Trước đây chỉ truyền
    // (goi_id, nam), mà với gói bổ sung `goiIdHienTai` là hằng "bo-sung" cho
    // MỌI đợt: bấm dọn ở đợt T1 là xoá luôn ô sửa tay và xác nhận của T5, T9
    // cùng năm. Hộp xác nhận cũng đếm theo (gói, năm) nên đếm cả phần của đợt
    // khác — người bấm không hề biết mình xoá gì.
    if (!goiIdHienTai || !dotGoiHienTai) {
      setLoi("Chọn một gói con cụ thể trước khi dọn — mỗi ĐỢT × GÓI CON có bộ dữ liệu làm việc riêng.");
      return;
    }
    setLoi("");
    const { data, error } = await supabase.rpc("dem_du_lieu_lam_viec", {
      p_goi_id: goiIdHienTai, p_nam_de_xuat: NAM_DE_XUAT,
      p_dot_goi_id: dotGoiHienTai.id,
    });
    if (error) {
      const chuaPatch = error.code === "PGRST202" || /dem_du_lieu_lam_viec/i.test(error.message || "");
      setLoi(chuaPatch
        ? "Staging chưa có chức năng dọn dữ liệu. Cần chạy backend/sql/patch_zm_luu_o_danh_muc_khoa.sql."
        : error.message);
      return;
    }
    setFormDon(data || {});
  };

  const donDuLieu = async () => {
    setDangDon(true);
    const { data, error } = await supabase.rpc("don_du_lieu_lam_viec", {
      p_goi_id: goiIdHienTai, p_nam_de_xuat: NAM_DE_XUAT,
      // Hàm ném lỗi nếu thiếu — thà từ chối còn hơn xoá xuyên đợt như trước.
      p_dot_goi_id: dotGoiHienTai?.id ?? null,
    });
    setDangDon(false);
    if (error) { setLoi(error.message); return; }
    setFormDon(null);
    setThongBao(`Đã dọn: ${data?.o_danh_muc_khoa || 0} ô danh mục khoa · `
      + `${data?.o_tong_hop_pdd || 0} ô tổng hợp · ${data?.cau_hinh_cot || 0} cấu hình cột. `
      + "Đề xuất, lịch sử HIS và bản Word/Excel đã xuất KHÔNG bị đụng.");
    await tai();
  };

  // ---- Nhắc khoa ----------------------------------------------------------
  const copyNhac = async (k) => {
    const thieu = [
      !k.daDeXuat && "chưa gửi đề xuất",
      k.daDeXuat && !k.coWord && "chưa tạo bản cam kết Word",
      k.daDeXuat && !k.daChot && "chưa xác nhận Danh mục đề xuất (bản hiện tại)",
    ].filter(Boolean).join(", ");
    const tin = `Kính gửi ${k.don_vi},\nĐợt "${dot?.ten}" hiện ${thieu || "đã đủ hồ sơ"}. `
      + `Kính đề nghị khoa hoàn tất trên phần mềm VTYT giúp Phòng Điều dưỡng tổng hợp đúng hạn. Trân trọng.`;
    try {
      await navigator.clipboard.writeText(tin);
      setKhoaDaCopy(k.don_vi);
      setTimeout(() => setKhoaDaCopy(null), 2500);
    } catch {
      setLoi("Trình duyệt không cho copy tự động — hãy copy tay nội dung nhắc.");
    }
  };

  // Danh mục đề xuất luôn thuộc về ĐÚNG MỘT gói con. Khi PĐD đang xem "Tất cả
  // gói con" thì phải tự suy ra gói của chính khoa đó, chứ không bắt họ quay
  // lên chọn chip rồi bấm lại — khoa thường chỉ đề xuất ở 1-2 gói con.
  const goiConCuaKhoa = useCallback((khoa) => {
    if (goiIdHienTai) return [goiIdHienTai];
    const nhan = new Set(rows.filter((r) => r.don_vi === khoa).map((r) => r.goi).filter(Boolean));
    return Object.entries(GOI_ID_MAP)
      .filter(([, v]) => v.loai_mua_sam === dot?.loai_mua_sam && nhan.has(v.goi))
      .map(([k]) => k);
  }, [goiIdHienTai, rows, dot]);

  const moDanhMucKhoa = (khoa) => {
    const ds = goiConCuaKhoa(khoa);
    if (ds.length === 1) {
      window.location.hash = `#danh-muc-de-xuat/${ds[0]}/${encodeURIComponent(khoa)}/${dot.id}`;
      return;
    }
    setLoi(ds.length === 0
      ? `Không xác định được gói con của ${khoa} — kiểm tra lại dữ liệu đề xuất.`
      : `${khoa} có đề xuất ở ${ds.length} gói con. Chọn một gói con ở trên rồi bấm lại để mở đúng danh mục.`);
  };

  // ---- Render -------------------------------------------------------------
  // QĐ A2 (21/08/2026) + phản hồi 24/08: Bàn điều hành CHỈ CÒN ĐỂ XEM. Mọi thao
  // tác sửa của PĐD — tích rớt, gõ số trúng, chia về khoa, xác nhận rớt — làm
  // trên bảng Tổng hợp danh mục đề xuất. Gỡ hai tab "Danh mục tổng hợp" và
  // "Kết quả thầu & giỏ rớt" để không còn hai đường làm cùng một việc.
  // Mã của hai tab đó giữ nguyên bên dưới, chỉ không vào menu nữa.
  const TAB = [
    { ma: "khoa", ten: "Theo dõi khoa", Icon: Building2 },
    { ma: "ho_so", ten: "Phiếu đề nghị mua thầu", Icon: FileSignature },
  ];

  return (
    <div className="space-y-4">
      {/* Chọn đợt + gói con */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-base font-semibold text-slate-900">Bàn điều hành</h2>
          <select value={dotId} onChange={(e) => setDotId(e.target.value)}
            className="min-w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {dsDot.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ten} · {d.trang_thai === "mo" ? "đang mở" : "đã đóng"}
              </option>
            ))}
          </select>
          <button type="button" onClick={tai}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">
            <RefreshCw size={13} /> Tải lại
          </button>
          <button type="button" onClick={moDonDuLieu}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-2 text-xs text-amber-800 hover:bg-amber-50"
            title="Xoá dữ liệu làm việc (ô đã sửa tay, cấu hình cột) khi đợt thầu đã xong hẳn">
            <Trash2 size={13} /> Kết thúc đợt & dọn
          </button>
        </div>

        {dsGoiCon.length > 1 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-slate-500">Gói con:</span>
            <button type="button" onClick={() => setGoiConId("")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                !goiConId ? "bg-[var(--umc-blue)] text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
              Tất cả
            </button>
            {dsGoiCon.map((g) => (
              <button key={g.goiId} type="button" onClick={() => setGoiConId(g.goiId)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  goiConId === g.goiId ? "bg-[var(--umc-blue)] text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                {g.goi}
              </button>
            ))}
          </div>
        )}

        {/* Đường vào MẶT BÀN DUY NHẤT của PĐD. Bàn điều hành chỉ để xem; mọi
            thao tác sửa nằm ở bảng Tổng hợp (QĐ A2 21/08 + phản hồi 24/08). */}
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-umc-200 bg-umc-50 px-3 py-2">
          <span className="text-xs font-medium text-umc-900">
            Sửa số, tích rớt, chia số trúng, xác nhận rớt — làm trên bảng Tổng hợp:
          </span>
          {dsGoiCon.map((g) => (
            <button key={g.goiId} type="button"
              onClick={() => { window.location.hash = `#tong-hop-pdd/${g.goiId}/${dot.id}`; }}
              className="inline-flex items-center gap-1 rounded bg-umc-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-umc-800">
              <Layers3 size={13} /> {g.goi}
            </button>
          ))}
          {dsGoiCon.length === 0 && (
            <span className="text-xs text-slate-500">Đợt này chưa có gói con nào.</span>
          )}
        </div>

        {/* Thanh tổng quan */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <ONhanh nhan="Khoa toàn viện" so={tongQuan.soKhoaToanVien} vach="bg-slate-300" />
          <ONhanh nhan="Đã đề xuất" so={tongQuan.soKhoaDaDeXuat} mau="text-emerald-600" vach="bg-emerald-500" />
          <ONhanh nhan="Chưa đề xuất" so={tongQuan.soKhoaChuaDeXuat}
            mau={tongQuan.soKhoaChuaDeXuat > 0 ? "text-red-600" : "text-slate-800"}
            vach={tongQuan.soKhoaChuaDeXuat > 0 ? "bg-red-500" : "bg-emerald-500"} />
          <ONhanh nhan="Đủ Word cam kết" so={`${tongQuan.soKhoaCoWord}/${tongQuan.soKhoaDaDeXuat}`} vach="bg-cyan-400" />
          <ONhanh nhan="Đã xác nhận bản hiện tại" so={`${tongQuan.soKhoaDaChot}/${tongQuan.soKhoaCanChot}`} vach="bg-cyan-400" />
          <ONhanh nhan="Tổng SL toàn viện" so={fmt(tongQuan.tongSoLuong)} mau="text-umc-600" vach="bg-umc-600" />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>
            {fmt(tongQuan.soMaQuanLy)} mã quản lý · {fmt(tongQuan.soMaHang)} mã hàng
            {goiConId ? ` · lọc theo gói ${GOI_ID_MAP[goiConId]?.goi}` : " · tất cả gói con"}
          </span>
          {/* Mọi số lịch sử trên màn này đều tính từ dữ liệu HIS đã nạp — nên
              hiện thẳng mốc mới nhất cạnh nút nạp, thay vì bắt PĐD tự nhớ. */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
            <Database size={12} className="text-slate-400" />
            Dữ liệu HIS mới nhất:
            <b className="text-slate-700">
              {mocHis ? `T${mocHis.thang}/${mocHis.nam}` : "chưa có"}
            </b>
            <button type="button" onClick={() => onMoManKhac?.({ nhom: "chung", man: "napdulieu" })}
              className="ml-1 rounded border border-umc-200 bg-white px-2 py-0.5 font-medium text-umc-700 hover:bg-umc-50">
              Nạp thêm dữ liệu
            </button>
          </span>
          {dungLuong && (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
              MAU_DUNG_LUONG[dungLuong.muc] || MAU_DUNG_LUONG.on}`}>
              <Database size={12} />
              Dung lượng: <b>{dungLuong.phan_tram}%</b>
              <span className="opacity-70">
                ({Math.round(dungLuong.bytes / 1048576)}/{Math.round(dungLuong.gioi_han_bytes / 1048576)}MB)
              </span>
              {dungLuong.muc !== "on" && (
                <b className="ml-0.5">{NHAN_DUNG_LUONG[dungLuong.muc]}</b>
              )}
            </span>
          )}
        </div>

        {loi && <p className="mt-2 text-sm text-red-600">{loi}</p>}
        {canhBaoChot && (
          <p className="mt-2 flex items-start gap-1 text-xs text-amber-700">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {canhBaoChot}
          </p>
        )}
        {thongBao && <p className="mt-2 text-sm text-emerald-700">{thongBao}</p>}
      </div>

      {/* Tab */}
      <div role="tablist" className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-4">
        {TAB.map(({ ma, ten, Icon }) => (
          <button key={ma} type="button" role="tab" aria-selected={tab === ma}
            onClick={() => { setTab(ma); setTuKhoa(""); }}
            className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold ${
              tab === ma ? "border-b-2 border-umc-600 bg-white text-umc-800" : "bg-slate-50 text-slate-500 hover:bg-white"}`}>
            <Icon size={16} /> {ten}
          </button>
        ))}
      </div>

      {dangTai ? (
        <p className="p-4 text-sm text-slate-500">Đang tải dữ liệu toàn viện…</p>
      ) : tab === "khoa" ? (
        <TabKhoa
          khoaHienThi={khoaHienThi} locKhoa={locKhoa} setLocKhoa={setLocKhoa}
          tuKhoa={tuKhoa} setTuKhoa={setTuKhoa} tongQuan={tongQuan}
          moDanhMucKhoa={moDanhMucKhoa} copyNhac={copyNhac} khoaDaCopy={khoaDaCopy}
          onMoCamKet={(khoa) => onMoManKhac?.({
            man: "bieu_mau", goi: dot.loai_mua_sam, dotId: dot.id, donVi: khoa,
          })}
        />
      ) : tab === "tong_hop" ? (
        <TabTongHop
          cay={cayHienThi} tuKhoa={tuKhoa} setTuKhoa={setTuKhoa}
          mqMo={mqMo} mhMo={mhMo} doiMo={doiMo} setMqMo={setMqMo} setMhMo={setMhMo}
          maDangRot={maDangRot} moFormRot={moFormRot} boRot={boRot}
          goiIdHienTai={goiIdHienTai}
          onMoExcel={() => {
            if (!goiIdHienTai) {
              setLoi("Chọn một gói con ở trên rồi mới mở được bản Excel tổng hợp — mỗi gói con đi thầu riêng nên có một bản riêng.");
              return;
            }
            window.location.hash = `#tong-hop-pdd/${goiIdHienTai}/${dot.id}`;
          }}
        />
      ) : tab === "ket_qua" ? (
        <TabKetQua ketQuaRot={ketQuaRot} dot={dot} boRot={boRot}
          giaiDoanThau={giaiDoanThau} gioRot={gioRotV3}
          dotGoiIds={dsDotGoi.filter((dg) => !goiConId || dg.goi_id === goiConId).map((dg) => dg.id)}
          phanBoTrung={phanBoTrungV3} onLuuPhanBoTrung={luuPhanBoTrung}
          dotGoiHienTai={dotGoiHienTai} doiGiaiDoan={doiGiaiDoan}
          khoaThamGia={khoaThamGiaV3} chotDanhMuc={chotDanhMucV3}
          chotTrinhKyKhoa={chotTrinhKyKhoaV3} phienTrinhKy={phienTrinhKyV3}
          onTaiLai={tai} />
      ) : (
        // "Phiếu đề nghị mua thầu" (Word `de_nghi_mua`) — 1 trong 5 biểu mẫu
        // chính thức. Trước 09/08/2026 nó chỉ tạo được ở màn "Tổng hợp & xuất
        // hồ sơ", tức là phải chốt một snapshot `phien_tong_hop` trước. Màn đó
        // thuộc workflow cũ và đã gỡ, nên biểu mẫu dời về đây.
        //
        // `DE_NGHI_MUA` trong coCauBieuMau.js là văn bản thuần, KHÔNG chứa
        // dòng dữ liệu nào (danh mục đi kèm là bản Excel tổng hợp riêng). Vẫn
        // truyền `rowsLoc` vì HoSoTrucTuyen dùng số dòng để biết đợt đã có đề
        // xuất hay chưa — không có dòng nào thì tạo phiếu trình ký là vô nghĩa.
        // Neo vào (đợt, gói con) chứ không vào một snapshot số lượng, nên phiếu
        // luôn khớp bản tổng hợp live đang xem.
        <div className="space-y-3">
          {!goiIdHienTai ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <FileSignature size={26} className="mx-auto text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-600">Chọn một gói con ở trên</p>
              <p className="mt-1 text-xs text-slate-400">
                Mỗi gói con đi thầu riêng nên có phiếu đề nghị riêng.
              </p>
            </div>
          ) : (
            <HoSoTrucTuyen
              key={`pdd-${dot.id}-${goiIdHienTai}`}
              profile={profile}
              goi={dot.loai_mua_sam}
              dotId={dot.id}
              donVi="Phòng Điều dưỡng"
              nguonKey={`goi-con:${goiIdHienTai}`}
              rows={rowsLoc}
              usage={{}}
              taiLieu={[{ ma: "de_nghi_mua", ten: "Phiếu đề nghị mua thầu" }]}
              meta={{
                don_vi: "Phòng Điều dưỡng",
                nguoi_lap: profile.ho_ten || profile.email,
                goi_con: GOI_ID_MAP[goiIdHienTai]?.goi || goiIdHienTai,
              }}
              tieuDe="Phiếu đề nghị mua thầu — Phòng Điều dưỡng"
              moTa="Danh mục đi kèm là bản Excel ở tab Danh mục tổng hợp; phiếu này chỉ là phần văn bản trình ký."
            />
          )}
        </div>
      )}

      {formDon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onMouseDown={() => setFormDon(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900">
              Kết thúc đợt &amp; dọn dữ liệu làm việc
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Chỉ làm việc này khi gói <b>{GOI_ID_MAP[goiIdHienTai]?.nhan}</b> của đợt{" "}
              <b>{dot?.ten}</b> đã đấu thầu xong hẳn và đã xuất/lưu file trình ký.{" "}
              <b>Không hoàn tác được.</b>
            </p>
            <ul className="mt-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <li>{fmt(formDon.o_danh_muc_khoa || 0)} ô các khoa đã sửa tay trên Danh mục đề xuất</li>
              <li>{fmt(formDon.o_tong_hop_pdd || 0)} ô PĐD đã sửa đè trên Danh mục tổng hợp</li>
              <li>{fmt(formDon.xac_nhan_khoa || 0)} lượt khoa xác nhận thông tin đề xuất</li>
              <li>{fmt(formDon.cau_hinh_cot || 0)} cấu hình ẩn/khoá cột</li>
            </ul>
            {/* patch_zzzzx — ba dòng đầu đã đếm theo ĐÚNG đợt đang chọn. Dòng
                cấu hình cột thì chưa: bảng đó không có neo đợt nên vẫn tính
                theo (gói con, năm). Nói thẳng ra để người bấm biết. */}
            <p className="mt-2 text-[11px] text-amber-800">
              Ba dòng đầu chỉ thuộc <b>đợt đang chọn</b>. Riêng <b>cấu hình ẩn/khoá cột</b>{" "}
              chưa neo theo đợt nên tính chung cho cả gói con trong năm {NAM_DE_XUAT}.
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              <b>KHÔNG</b> đụng tới: đề xuất của khoa, lịch sử HIS, bản Word cam kết,
              kết quả thầu và toàn bộ lịch sử chỉnh sửa (audit).
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setFormDon(null)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Huỷ
              </button>
              <button type="button" onClick={donDuLieu} disabled={dangDon}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
                {dangDon ? "Đang dọn…" : "Xác nhận dọn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {formRot && (
        <HopThoaiRot
          formRot={formRot} mocRot={mocRot} setMocRot={setMocRot}
          setFormRot={setFormRot} soLuongRot={soLuongRot} setSoLuongRot={setSoLuongRot}
          lyDoRot={lyDoRot} setLyDoRot={setLyDoRot} loiRot={loiRot}
          dangLuuRot={dangLuuRot} onHuy={() => setFormRot(null)} onLuu={luuRot}
        />
      )}
    </div>
  );
}

// 6 ô tổng quan trước đây có trọng số thị giác bằng nhau, nhưng ý nghĩa thì
// không: "Chưa đề xuất" là con số PHẢI hành động, "Khoa toàn viện" chỉ là mẫu
// số. `vach` thêm một vạch màu mảnh bên trái để mắt bắt ngay ô cần chú ý mà
// không phải đọc hết 6 nhãn. tabular-nums giữ các chữ số thẳng cột khi số đổi.
function ONhanh({ nhan, so, mau = "text-slate-800", vach = "bg-slate-200" }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 pl-3.5 transition-colors hover:border-umc-200">
      <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] ${vach}`} />
      <p className="text-[11px] leading-tight text-slate-500">{nhan}</p>
      <p className={`mt-0.5 text-lg font-semibold leading-tight tabular-nums ${mau}`}>{so}</p>
    </div>
  );
}

// ---------------------------------------------------------------- TAB 1
function TabKhoa({
  khoaHienThi, locKhoa, setLocKhoa, tuKhoa, setTuKhoa, tongQuan,
  moDanhMucKhoa, copyNhac, khoaDaCopy, onMoCamKet,
}) {
  const BO_LOC = [
    { ma: "tat_ca", ten: `Tất cả (${tongQuan.soKhoaToanVien})` },
    { ma: "chua", ten: `Chưa đề xuất (${tongQuan.soKhoaChuaDeXuat})` },
    { ma: "thieu_ho_so", ten: "Thiếu hồ sơ" },
    { ma: "du", ten: "Đã đủ" },
  ];
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        {BO_LOC.map((b) => (
          <button key={b.ma} type="button" onClick={() => setLocKhoa(b.ma)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              locKhoa === b.ma ? "bg-umc-800 text-white" : "border border-slate-300 text-slate-600 hover:bg-white"}`}>
            {b.ten}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)} placeholder="Tìm khoa…"
            className="rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-umc-50 text-xs uppercase tracking-wide text-umc-800 [&_th]:font-semibold">
            <tr className="border-b border-umc-200">
              <th className="px-4 py-2 text-left">Khoa</th>
              <th className="px-3 py-2 text-center">Đề xuất</th>
              <th className="px-3 py-2 text-right">Mã QL</th>
              <th className="px-3 py-2 text-right">Mã hàng</th>
              <th className="px-3 py-2 text-center">Word cam kết</th>
              <th className="px-3 py-2 text-center">Xác nhận đề xuất</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {khoaHienThi.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">Không có khoa nào khớp bộ lọc.</td></tr>
            ) : khoaHienThi.map((k) => (
              // Sọc ngựa vằn + đổi nền khi rê chuột: bảng 7 cột × 62 khoa, mắt
              // phải dò ngang từ tên khoa sang cột "Xác nhận đề xuất" tận bên phải.
              // Hàng khoa CHƯA đề xuất vẫn giữ nền đỏ nhạt, đè lên sọc.
              <tr key={k.don_vi} className={`border-b border-slate-100 transition-colors last:border-0 hover:bg-umc-50/70 ${
                !k.daDeXuat ? "bg-red-50/40" : "even:bg-slate-50/60"}`}>
                <td className="px-4 py-2 font-medium text-slate-800">{k.don_vi}</td>
                <td className="px-3 py-2 text-center">
                  {k.daDeXuat
                    ? <CheckCircle2 size={15} className="mx-auto text-emerald-600" />
                    : <span className="text-xs font-medium text-red-600">Chưa</span>}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">{k.daDeXuat ? fmt(k.soMaQuanLy) : "—"}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{k.daDeXuat ? fmt(k.soMaHang) : "—"}</td>
                <td className="px-3 py-2 text-center">
                  {k.coWord ? <CheckCircle2 size={15} className="mx-auto text-emerald-600" />
                    : <span className="text-xs text-slate-300">—</span>}
                </td>
                <td className="px-3 py-2 text-center">
                  {k.daChot ? <CheckCircle2 size={15} className="mx-auto text-emerald-600" />
                    : <span className="text-xs text-slate-300">—</span>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {k.daDeXuat && (
                      <>
                        <button type="button" onClick={() => moDanhMucKhoa(k.don_vi)}
                          className="inline-flex items-center gap-1 rounded border border-umc-200 bg-umc-50 px-2 py-1 text-[11px] font-medium text-umc-700 hover:bg-umc-100">
                          <ExternalLink size={11} /> Danh mục
                        </button>
                        <button type="button" onClick={() => onMoCamKet(k.don_vi)}
                          className="inline-flex items-center gap-1 rounded border border-blue-200 bg-white px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50">
                          Cam kết
                        </button>
                      </>
                    )}
                    {!k.duHoSo && (
                      <button type="button" onClick={() => copyNhac(k)}
                        className="inline-flex items-center gap-1 rounded border border-amber-200 bg-white px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-50">
                        {khoaDaCopy === k.don_vi ? <Copy size={11} /> : <Bell size={11} />}
                        {khoaDaCopy === k.don_vi ? "Đã copy" : "Nhắc"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- TAB 2
function TabTongHop({
  cay, tuKhoa, setTuKhoa, mqMo, mhMo, doiMo, setMqMo, setMhMo, maDangRot, moFormRot, boRot,
  goiIdHienTai, onMoExcel,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">
          Bung mã quản lý để xem mã hàng, bung tiếp để xem từng khoa và tỉ trọng.
        </p>
        <button type="button" onClick={onMoExcel}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--umc-blue)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          title={goiIdHienTai ? "Mở bản Excel tổng hợp toàn màn hình" : "Chọn một gói con trước"}>
          <ExternalLink size={13} /> Mở Excel tổng hợp
        </button>
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)} placeholder="Tìm mã / tên vật tư…"
            className="w-56 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left">Mã quản lý / mã hàng / khoa</th>
              <th className="px-3 py-2 text-right">Số khoa</th>
              <th className="px-3 py-2 text-right">Tổng SL</th>
              <th className="px-3 py-2 text-right">Tỉ trọng</th>
              <th className="px-3 py-2 text-right">Rớt thầu</th>
            </tr>
          </thead>
          <tbody>
            {cay.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">Chưa có đề xuất nào trong đợt/gói con này.</td></tr>
            ) : cay.map((mq) => {
              const moNhom = mqMo.has(mq.ma_quan_ly);
              const maRotTrongNhom = mq.maHang.filter((mh) => maDangRot.has(mh.ma_hang)).length;
              const caNhomRot = maRotTrongNhom === mq.maHang.length && mq.maHang.length > 0;
              return (
                <FragmentNhom key={mq.ma_quan_ly}
                  mq={mq} moNhom={moNhom} maRotTrongNhom={maRotTrongNhom} caNhomRot={caNhomRot}
                  mhMo={mhMo} doiMo={doiMo} setMqMo={setMqMo} setMhMo={setMhMo}
                  maDangRot={maDangRot} moFormRot={moFormRot} boRot={boRot} />
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FragmentNhom({
  mq, moNhom, maRotTrongNhom, caNhomRot, mhMo, doiMo, setMqMo, setMhMo,
  maDangRot, moFormRot, boRot,
}) {
  return (
    <>
      <tr className="border-b border-slate-100 bg-slate-50/70">
        <td className="px-4 py-2">
          <button type="button" onClick={() => doiMo(setMqMo, mq.ma_quan_ly)}
            className="inline-flex items-center gap-1.5 text-left font-medium text-slate-800">
            {moNhom ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="font-mono text-xs text-slate-500">{mq.ma_quan_ly}</span>
            <span className="text-sm">{mq.ten_quan_ly}</span>
            <span className="text-xs text-slate-400">({mq.soMaHang} mã hàng)</span>
          </button>
        </td>
        <td className="px-3 py-2 text-right font-mono text-xs">{mq.soKhoa}</td>
        <td className="px-3 py-2 text-right font-mono text-sm font-semibold">{fmt(mq.tongSoLuong)}</td>
        <td className="px-3 py-2 text-right text-xs text-slate-400">100%</td>
        <td className="px-3 py-2 text-right">
          {caNhomRot ? (
            <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">
              <XCircle size={11} /> Rớt hoàn toàn
            </span>
          ) : (
            <button type="button"
              onClick={() => moFormRot(mq.maHang.map((mh) => mh.ma_hang), `cả nhóm ${mq.ma_quan_ly}`, true, mq.ma_quan_ly)}
              className="rounded border border-red-200 bg-white px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50">
              Cả nhóm rớt
            </button>
          )}
          {maRotTrongNhom > 0 && !caNhomRot && (
            <span className="ml-1 text-[11px] text-amber-700">{maRotTrongNhom}/{mq.maHang.length} rớt</span>
          )}
        </td>
      </tr>

      {moNhom && mq.maHang.map((mh) => {
        const moMa = mhMo.has(mh.ma_hang);
        const rot = maDangRot.get(mh.ma_hang);
        return (
          // key phải nằm ở phần tử NGOÀI CÙNG của mỗi lượt map — dùng Fragment
          // dạng đầy đủ vì cú pháp <> không nhận key.
          <Fragment key={`${mq.ma_quan_ly}-${mh.ma_hang}`}>
            <tr className="border-b border-slate-100">
              <td className="py-2 pl-10 pr-4">
                <button type="button" onClick={() => doiMo(setMhMo, mh.ma_hang)}
                  className="inline-flex items-center gap-1.5 text-left">
                  {moMa ? <ChevronDown size={13} className="text-slate-400" /> : <ChevronRight size={13} className="text-slate-400" />}
                  <span className="font-mono text-xs text-slate-500">{mh.ma_hang}</span>
                  <span className="text-sm text-slate-700">{mh.ten_vat_tu}</span>
                  <span className="text-xs text-slate-400">{mh.dvt}</span>
                </button>
              </td>
              <td className="px-3 py-2 text-right font-mono text-xs">{mh.soKhoa}</td>
              <td className="px-3 py-2 text-right font-mono text-sm">{fmt(mh.tongSoLuong)}</td>
              <td className="px-3 py-2 text-right text-xs text-slate-400">—</td>
              <td className="px-3 py-2 text-right">
                {rot ? (
                  <div className="inline-flex items-center gap-1">
                    <span className="rounded bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">
                      Rớt {fmt(Number(rot.r1 || 0) + Number(rot.r2 || 0) + Number(rot.r3 || 0))} · Trúng {fmt(rot.so_luong_trung)}
                    </span>
                    {/* Một mã được rớt một phần ở NHIỀU giai đoạn: tổng rớt =
                        R1+R2+R3 (mục V.3). Trước 20/08/2026 ô này chỉ render
                        "Bỏ tích" khi đã có rớt, nên mã rớt một phần ở Chào giá
                        là mất luôn đường nhập rớt ở Mở thầu / Đánh giá — dù DB
                        nhận đúng (đo thật: 40.000 + 20.000 -> trúng 101.000).
                        Còn số trúng thì còn rớt thêm được. */}
                    {Number(rot.so_luong_trung) > 0 && (
                      <button type="button"
                        onClick={() => moFormRot([mh.ma_hang], `mã ${mh.ma_hang}`, false)}
                        title={`Còn trúng ${fmt(rot.so_luong_trung)} — ghi thêm ngoại lệ rớt ở giai đoạn sau`}
                        className="rounded border border-red-200 bg-white px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50">
                        Rớt thêm
                      </button>
                    )}
                    <button type="button" onClick={() => boRot(mh.ma_hang,
                      Number(rot.r3) > 0 ? "danh_gia" : Number(rot.r2) > 0 ? "mo_thau" : "chao_gia")}
                      title="Bỏ ngoại lệ rớt của giai đoạn muộn nhất"
                      className="rounded border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50">
                      Bỏ tích
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => moFormRot([mh.ma_hang], `mã ${mh.ma_hang}`, false)}
                    className="rounded border border-red-200 bg-white px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50">
                    Tích rớt
                  </button>
                )}
              </td>
            </tr>
            {moMa && mh.khoa.map((k) => (
              <tr key={`${mh.ma_hang}-${k.don_vi}`} className="border-b border-slate-50 bg-slate-50/40 text-xs">
                <td className="py-1.5 pl-16 pr-4 text-slate-600">{k.don_vi}</td>
                <td className="px-3 py-1.5"></td>
                <td className="px-3 py-1.5 text-right font-mono">{fmt(k.soLuong)}</td>
                <td className="px-3 py-1.5 text-right">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-12 overflow-hidden rounded-full bg-slate-200">
                      <span className="block h-full bg-[var(--umc-blue)]" style={{ width: `${k.tiTrong}%` }} />
                    </span>
                    {k.tiTrong.toFixed(1)}%
                  </span>
                </td>
                <td className="px-3 py-1.5"></td>
              </tr>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------- TAB 3
function TabKetQua({ ketQuaRot, dot, boRot, giaiDoanThau, gioRot, phanBoTrung, dotGoiIds = [],
  onLuuPhanBoTrung, dotGoiHienTai, doiGiaiDoan, khoaThamGia, chotDanhMuc,
  chotTrinhKyKhoa, phienTrinhKy, onTaiLai }) {
  const [suaPhanBo, setSuaPhanBo] = useState(null);
  const [loiPhanBo, setLoiPhanBo] = useState("");
  const [dangLuuPhanBo, setDangLuuPhanBo] = useState(false);
  const [dangTrinhKy, setDangTrinhKy] = useState("");
  const [loiTrinhKy, setLoiTrinhKy] = useState("");

  // ---- CỔNG "Chốt trình ký toàn bộ" — hỏi thẳng server, không tự suy -------
  // QĐ 20/08/2026 nới cổng này: chỉ khoa ĐÃ GỬI đề xuất mới tính vào mẫu số
  // (gói Dùng chung có 49 khoa tham gia nhưng chỉ 2 khoa gửi — đòi đủ 49 thì
  // nút không bao giờ sáng). Bản vá hôm đó để lại HAI định nghĩa cho cùng một
  // cổng: server có hàm `khoa_chua_du_chot_trinh_ky(p_dot_goi_id)`, còn màn
  // này tự suy danh sách "khoa đã gửi" từ `phanBoTrung` (view
  // `phan_bo_trung_v3`, điều kiện `q_khoa > 0`).
  //
  // Hai định nghĩa đó KHÔNG bằng nhau. Server hỏi `phan_bo_khoa` (đề xuất khoa
  // gửi), còn `phan_bo_trung_v3` chỉ có dòng cho mã TRÚNG thầu — khoa gửi đề
  // xuất rồi rớt sạch sẽ biến mất khỏi view, màn này coi là "chưa gửi", bỏ ra
  // khỏi mẫu số, cho nút sáng, và server ném exception ngay lúc bấm. Không có
  // lỗi đỏ nào cho tới lúc đó — đúng cái bẫy của Lỗi 24 (khoá phạm vi đặt khác
  // nhau giữa hai màn, số chỉ đơn giản là không bao giờ khớp). Từ 20/08/2026
  // cổng này đọc THẲNG kết quả RPC; màn hình chỉ còn việc đếm và hiển thị.
  //
  // `trangThai`: dang_tai | xong | loi. Chỉ `xong` mới được phép mở nút —
  // chưa biết chắc thì để nút mờ, vì bấm bừa là ăn exception từ server.
  const [congChot, setCongChot] = useState({ trangThai: "dang_tai", khoaThieu: [], loi: "" });
  // Mẫu số "khoa đã gửi đề xuất" cho các nhãn đếm. RPC chỉ trả về danh sách
  // khoa CÒN THIẾU nên không suy ngược ra mẫu số được: lấy "số khoa đã đủ chốt"
  // cộng vào sẽ đếm nhầm nhóm khoa xác nhận "không phát sinh" rồi được chốt
  // trình ký — nhóm đó đủ chốt nhưng KHÔNG gửi gì cả. Nên đọc thẳng
  // `phan_bo_khoa` với ĐÚNG vị từ mà hàm SQL dùng (`so_luong_hien_hanh > 0`),
  // tuyệt đối không quay lại `phan_bo_trung_v3`. null = chưa đọc được.
  const [khoaDaGuiServer, setKhoaDaGuiServer] = useState(null);
  // `onTaiLai()` chỉ nạp lại state của component cha; `dotGoiHienTai.id` không
  // đổi nên effect dưới đây sẽ không tự chạy sau khi chốt/mở chốt một bảng
  // khoa. Phải đá nhịp bằng tay, nếu không cổng giữ nguyên số cũ.
  const [nhipNapCong, setNhipNapCong] = useState(0);
  const dotGoiId = dotGoiHienTai?.id ?? null;

  useEffect(() => {
    if (!dotGoiId) {
      setCongChot({ trangThai: "dang_tai", khoaThieu: [], loi: "" });
      setKhoaDaGuiServer(null);
      return undefined;
    }
    let boQua = false;
    setCongChot({ trangThai: "dang_tai", khoaThieu: [], loi: "" });
    (async () => {
      const [rThieu, rDaGui] = await Promise.all([
        supabase.rpc("khoa_chua_du_chot_trinh_ky", { p_dot_goi_id: dotGoiId }),
        supabase.from("phan_bo_khoa").select("khoa")
          .eq("dot_goi_id", dotGoiId).gt("so_luong_hien_hanh", 0),
      ]);
      if (boQua) return; // đổi gói con giữa chừng: bỏ kết quả cũ, khỏi nhấp nháy
      if (rThieu.error) {
        // PGRST202 = PostgREST không thấy hàm ⇒ database chưa chạy patch_zzzzv.
        // Không được đoán thay server: khoá nút, nói rõ thiếu patch nào. Chốt
        // trình ký tạo revision chính thức bất biến, bấm nhầm là phải mở chốt
        // và huỷ revision — thà mờ nút.
        setCongChot({
          trangThai: "loi", khoaThieu: [],
          loi: rThieu.error.code === "PGRST202"
            ? "Database chưa có hàm khoa_chua_du_chot_trinh_ky — chạy backend/sql/patch_zzzzv_noi_chot_trinh_ky_va_don_o_sua_tay.sql rồi tải lại trang. Cổng chốt trình ký tạm khoá."
            : `Không kiểm tra được cổng chốt trình ký: ${rThieu.error.message}`,
        });
        setKhoaDaGuiServer(null);
        return;
      }
      // Hàm trả `returns table(khoa text)` ⇒ PostgREST cho mảng {khoa}. Vẫn
      // chịu được dạng mảng chuỗi phòng khi chữ ký hàm đổi.
      setCongChot({
        trangThai: "xong", loi: "",
        khoaThieu: (rThieu.data || []).map((x) => (typeof x === "string" ? x : x.khoa)),
      });
      setKhoaDaGuiServer(rDaGui.error ? null
        : new Set((rDaGui.data || []).map((x) => x.khoa)));
    })();
    return () => { boQua = true; };
  }, [dotGoiId, nhipNapCong]);
  const moSuaPhanBo = (r) => {
    const ds = phanBoTrung.filter((p) => p.ma_hang === r.ma_hang);
    setLoiPhanBo("");
    setSuaPhanBo({ maHang: r.ma_hang, tong: Number(r.so_luong_trung), lyDo: "",
      giaTri: Object.fromEntries(ds.map((p) => [p.khoa, Number(p.so_luong_trung)])),
      qTheoKhoa: Object.fromEntries(ds.map((p) => [p.khoa, Number(p.q_khoa)])),
    });
  };
  const luuPhanBo = async () => {
    const tong = Object.values(suaPhanBo.giaTri).reduce((s, n) => s + (Number(n) || 0), 0);
    if (tong !== suaPhanBo.tong) { setLoiPhanBo(`Tổng ${fmt(tong)} chưa khớp số trúng ${fmt(suaPhanBo.tong)}.`); return; }
    setDangLuuPhanBo(true);
    const { error } = await onLuuPhanBoTrung(suaPhanBo.maHang, suaPhanBo.giaTri, suaPhanBo.lyDo);
    setDangLuuPhanBo(false);
    if (error) { setLoiPhanBo(error.message); return; }
    setSuaPhanBo(null);
  };
  if (!dotGoiHienTai) {
    return <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
      Chọn một gói con để làm việc với ba giai đoạn và kết quả riêng của gói đó.
    </section>;
  }
  const coRot = ketQuaRot.filter((r) => r.co_rot);
  const dsKhoa = khoaThamGia
    .filter((x) => x.dot_goi_id === dotGoiHienTai.id)
    .sort((a, b) => a.khoa.localeCompare(b.khoa, "vi"));
  const chotDau = new Set(chotDanhMuc
    .filter((x) => x.dot_goi_id === dotGoiHienTai.id).map((x) => x.khoa));
  const chotCuoi = new Map(chotTrinhKyKhoa
    .filter((x) => x.dot_goi_id === dotGoiHienTai.id).map((x) => [x.khoa, x]));
  const phienChinhThuc = phienTrinhKy.find((x) => x.dot_goi_id === dotGoiHienTai.id) || null;
  const duBaGiaiDoan = GIAI_DOAN.every((g) => giaiDoanThau
    .find((x) => x.dot_goi_id === dotGoiHienTai.id && x.giai_doan === g.ma)?.trang_thai === "hoan_thanh");
  // QĐ 20/08/2026 — cổng chốt trình ký chỉ tính khoa ĐÃ GỬI ĐỀ XUẤT, giống hệt
  // cổng chốt Q đã nới ngày 19/08. Trước đó mẫu số là MỌI khoa tham gia, nên
  // gói Dùng chung (49 khoa tham gia, 2 khoa gửi) không bao giờ bấm được nút:
  // 47 khoa im lặng vĩnh viễn thiếu vế "đã xác nhận danh mục".
  //
  // Danh sách khoa còn thiếu KHÔNG còn tính ở đây nữa — nó là của server, nạp
  // trong effect `congChot` ở đầu component (xem lý do dài ở đó). Dưới đây chỉ
  // là phép đếm để hiển thị.
  const khoaThieu = congChot.khoaThieu;
  const soThieu = khoaThieu.length;
  // Mẫu số = khoa THAM GIA (dsKhoa đọc từ `dot_goi_khoa.tham_gia`) ∩ khoa ĐÃ
  // GỬI — đúng hai điều kiện hàm SQL dùng, không thêm không bớt. null = chưa
  // đọc được `phan_bo_khoa`, khi đó không đoán bừa con số nào.
  const dsKhoaTinhCong = khoaDaGuiServer
    ? dsKhoa.filter((x) => khoaDaGuiServer.has(x.khoa)) : null;
  const soDaGui = dsKhoaTinhCong ? dsKhoaTinhCong.length : null;
  const soDuChot = soDaGui === null ? null : Math.max(0, soDaGui - soThieu);
  const soKhoaImLang = soDaGui === null ? 0 : dsKhoa.length - soDaGui;
  // Nút chỉ sáng khi server nói "không còn khoa nào thiếu" VÀ có ít nhất một
  // khoa đã gửi. Vế sau là hành vi cũ giữ nguyên: server cho phép chốt gói
  // rỗng (v_thieu rỗng thì đi tiếp), nhưng snapshot rỗng thì vô nghĩa nên màn
  // này vẫn chặn. Chưa đọc được mẫu số ⇒ coi như chưa biết ⇒ khoá nút.
  const congSanSang = congChot.trangThai === "xong" && soThieu === 0 && (soDaGui ?? 0) > 0;

  // Mọi thao tác chốt/mở chốt đều đổi kết quả `khoa_chua_du_chot_trinh_ky`,
  // nên nạp lại cha xong là hỏi lại server luôn.
  const taiLaiTatCa = async () => {
    await onTaiLai();
    setNhipNapCong((n) => n + 1);
  };

  const chotKhoa = async (khoa) => {
    setDangTrinhKy(`chot:${khoa}`); setLoiTrinhKy("");
    const { error } = await supabase.rpc("chot_trinh_ky_khoa_v3", {
      p_dot_goi_id: dotGoiHienTai.id, p_khoa: khoa,
    });
    setDangTrinhKy("");
    if (error) { setLoiTrinhKy(error.message); return; }
    await taiLaiTatCa();
  };
  const moChotKhoa = async (khoa) => {
    const lyDo = window.prompt("Lý do mở lại bảng trình ký khoa (revision chính thức hiện tại sẽ hết hiệu lực):", "") || "";
    if (!lyDo.trim()) return;
    setDangTrinhKy(`mo:${khoa}`); setLoiTrinhKy("");
    const { error } = await supabase.rpc("mo_chot_trinh_ky_khoa_v3", {
      p_dot_goi_id: dotGoiHienTai.id, p_khoa: khoa, p_ly_do: lyDo.trim(),
    });
    setDangTrinhKy("");
    if (error) { setLoiTrinhKy(error.message); return; }
    await taiLaiTatCa();
  };
  const chotToanBo = async () => {
    setDangTrinhKy("toan_bo"); setLoiTrinhKy("");
    const { error } = await supabase.rpc("chot_trinh_ky_toan_bo_v3", {
      p_dot_goi_id: dotGoiHienTai.id,
    });
    setDangTrinhKy("");
    if (error) { setLoiTrinhKy(error.message); return; }
    await taiLaiTatCa();
  };
  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-800">Ba giai đoạn đấu thầu</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {GIAI_DOAN.map((g, i) => {
            const gd = giaiDoanThau.find((x) => x.giai_doan === g.ma);
            const tt = gd?.trang_thai || "chua_bat_dau";
            return <div key={g.ma} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{i + 1}. {g.ten}</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                  tt === "hoan_thanh" ? "bg-emerald-100 text-emerald-700" :
                  tt === "dang_thuc_hien" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                  {tt === "hoan_thanh" ? "HOÀN THÀNH" : tt === "dang_thuc_hien" ? "ĐANG THỰC HIỆN" : "CHƯA BẮT ĐẦU"}
                </span>
              </div>
              <div className="mt-3 flex gap-1.5">
                {tt === "chua_bat_dau" && <button onClick={() => doiGiaiDoan(g.ma, "dang_thuc_hien")}
                  className="rounded bg-umc-700 px-2 py-1 text-xs text-white">Bắt đầu</button>}
                {tt === "dang_thuc_hien" && <button onClick={() => doiGiaiDoan(g.ma, "hoan_thanh")}
                  className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Hoàn thành</button>}
                {tt === "hoan_thanh" && <button onClick={() => doiGiaiDoan(g.ma, "dang_thuc_hien", true)}
                  className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700">Mở lại</button>}
              </div>
            </div>;
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileSignature size={17} className="text-umc-700" />
              <h3 className="text-sm font-semibold text-slate-800">Chốt bảng trình ký cuối</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              PĐD chốt từng khoa sau ba giai đoạn, rồi chốt toàn bộ để tạo snapshot chính thức bất biến.
            </p>
          </div>
          {phienChinhThuc ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-right">
              <p className="text-xs font-bold text-emerald-800">BẢN CHÍNH THỨC · REVISION {phienChinhThuc.revision}</p>
              <p className="text-[11px] text-emerald-700">Chốt {new Date(phienChinhThuc.chot_luc).toLocaleString("vi-VN")}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              BẢN NHÁP · chưa có revision chính thức
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-medium ${duBaGiaiDoan ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {duBaGiaiDoan ? "Đã hoàn thành 3/3 giai đoạn" : "Chưa hoàn thành đủ 3 giai đoạn"}
          </span>
          {/* Nhãn này phải nói đúng cái server nghĩ, nếu không PĐD lại nhìn một
              con số rồi bấm phải một luật khác. Số "còn thiếu" là của RPC. */}
          <span className={`rounded-full px-2.5 py-1 font-medium ${
            congChot.trangThai === "loi" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}
            title="Số khoa còn thiếu lấy thẳng từ hàm SQL khoa_chua_du_chot_trinh_ky — đúng luật server dùng để chặn. Khoa tham gia mà không gửi gì không làm kẹt cổng.">
            {congChot.trangThai === "dang_tai" ? "Đang hỏi server cổng chốt…"
              : congChot.trangThai === "loi" ? "Chưa kiểm tra được cổng chốt"
              : soDaGui === null ? `Còn ${soThieu} khoa chưa đủ chốt · không đọc được mẫu số`
              : `Đủ chốt ${soDuChot}/${soDaGui} khoa đã gửi đề xuất`}
          </span>
          {soKhoaImLang > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-500"
              title="Các khoa này tham gia gói nhưng chưa gửi đề xuất nào — chỉ ghi vào audit, không chặn chốt.">
              {soKhoaImLang} khoa chưa gửi đề xuất · không chặn
            </span>
          )}
          <button type="button" onClick={chotToanBo}
            disabled={!duBaGiaiDoan || !congSanSang || !!phienChinhThuc || !!dangTrinhKy}
            title={!duBaGiaiDoan ? "Phải hoàn thành đủ ba giai đoạn đấu thầu trước."
              : congChot.trangThai === "dang_tai" ? "Đang hỏi server xem còn khoa nào chưa đủ chốt."
              : congChot.trangThai === "loi" ? congChot.loi
              : soDaGui === null ? "Không đọc được danh sách khoa đã gửi đề xuất — cổng tạm khoá cho khỏi bấm bừa."
              : soDaGui === 0 ? "Chưa khoa nào gửi đề xuất cho gói con này."
              : soThieu > 0 ? `Còn ${soThieu} khoa đã gửi đề xuất nhưng chưa đủ chốt danh mục và chốt trình ký: ${khoaThieu.join(", ")}.`
              : phienChinhThuc ? "Gói con này đã có revision chính thức." : ""}
            className="ml-auto rounded-lg bg-umc-700 px-3 py-1.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35">
            {dangTrinhKy === "toan_bo" ? "Đang tạo snapshot…" : "Chốt trình ký toàn bộ"}
          </button>
        </div>

        {congChot.trangThai === "loi" && (
          <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-700">{congChot.loi}</p>
        )}
        {loiTrinhKy && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-700">{loiTrinhKy}</p>}
        <div className="mt-3 max-h-72 overflow-auto rounded-lg border border-slate-200">
          {dsKhoa.length === 0 ? <p className="p-4 text-center text-xs text-slate-500">Chưa có danh sách khoa tham gia.</p> : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-100 text-slate-500"><tr>
                <th className="px-3 py-2 text-left">Khoa</th>
                <th className="px-3 py-2 text-center">Danh mục đầu</th>
                <th className="px-3 py-2 text-center">Trình ký cuối</th>
                <th className="px-3 py-2 text-right">Thao tác PĐD</th>
              </tr></thead>
              <tbody>{dsKhoa.map(({ khoa }) => {
                const daDau = chotDau.has(khoa); const daCuoi = chotCuoi.get(khoa);
                return <tr key={khoa} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-700">{khoa}</td>
                  <td className="px-3 py-2 text-center">{daDau ? <CheckCircle2 size={14} className="mx-auto text-emerald-600" /> : <span className="text-amber-600">Chưa chốt</span>}</td>
                  <td className="px-3 py-2 text-center">{daCuoi ? <span className="font-semibold text-emerald-700">Rev khoa {daCuoi.revision}</span> : "—"}</td>
                  <td className="px-3 py-2 text-right">{daCuoi ? (
                    <button onClick={() => moChotKhoa(khoa)} disabled={!!dangTrinhKy}
                      className="rounded border border-amber-300 px-2 py-1 text-amber-700 disabled:opacity-40">Mở lại</button>
                  ) : (
                    <button onClick={() => chotKhoa(khoa)} disabled={!duBaGiaiDoan || !daDau || !!dangTrinhKy}
                      className="rounded bg-umc-700 px-2 py-1 text-white disabled:opacity-35">Chốt bảng khoa</button>
                  )}</td>
                </tr>;
              })}</tbody>
            </table>
          )}
        </div>
      </section>

      {/* Mục VII.3 — "PĐD có tab Giỏ rớt toàn viện: theo dõi khoa nào chưa xử
          lý, bao nhiêu ngày. Nút Nhắc nhở sinh template tin nhắn để copy sang
          Teams." Trước 19/08/2026 chỗ này chỉ ĐẾM `{n} mục giỏ rớt`, không cho
          nhìn ai đang nợ và không thao tác thay khoa được. */}
      {gioRot.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Giỏ rớt toàn viện</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Chỉ tính là đã xử lý khi khoa đã submit đề xuất bổ sung, hoặc khoa/PĐD
              chọn “Không còn nhu cầu”. Vào giỏ nháp chưa được coi là xong.
            </p>
          </div>
          <div className="p-3">
            <GioRotToanVien dotGoiIds={dotGoiIds} />
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            {ketQuaRot.length} mã trong Q · {coRot.length} mã có ngoại lệ rớt · {gioRot.length} mục giỏ rớt
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Mã không có ngoại lệ mặc định trúng toàn bộ. Số trúng = Q − R1 − R2 − R3.</p>
        </div>
        {ketQuaRot.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">
          Chưa có snapshot Q hiệu lực cho gói “{dot?.ten}”.
        </p> : <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-100 text-xs text-slate-500"><tr>
            <th className="px-3 py-2 text-left">Mã hàng</th><th className="px-3 py-2 text-right">Q</th>
            <th className="px-3 py-2 text-right">R1</th><th className="px-3 py-2 text-right">R2</th>
            <th className="px-3 py-2 text-right">R3</th><th className="px-3 py-2 text-right">Số trúng</th><th></th>
          </tr></thead><tbody>{ketQuaRot.map((r) => <tr key={`${r.dot_goi_id}-${r.ma_hang}`} className="border-t border-slate-100">
            <td className="px-3 py-2 font-mono text-xs">{r.ma_hang}</td><td className="px-3 py-2 text-right font-mono">{fmt(r.q)}</td>
            <td className="px-3 py-2 text-right font-mono">{fmt(r.r1)}</td><td className="px-3 py-2 text-right font-mono">{fmt(r.r2)}</td>
            <td className="px-3 py-2 text-right font-mono">{fmt(r.r3)}</td><td className="px-3 py-2 text-right font-mono font-semibold">{fmt(r.so_luong_trung)}</td>
            <td className="px-3 py-2 text-right"><button onClick={() => moSuaPhanBo(r)}
              className="mr-2 text-xs text-umc-700 hover:underline">Phân bổ về khoa</button>{r.co_rot && <button onClick={() => boRot(r.ma_hang, Number(r.r3)>0?"danh_gia":Number(r.r2)>0?"mo_thau":"chao_gia")}
              className="text-xs text-amber-700 hover:underline">Bỏ ngoại lệ cuối</button>}</td>
          </tr>)}</tbody>
        </table></div>}
        {suaPhanBo && <div className="border-t border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between"><p className="text-sm font-semibold">Phân bổ số trúng mã {suaPhanBo.maHang} · tổng {fmt(suaPhanBo.tong)}</p>
            <button onClick={() => setSuaPhanBo(null)} className="text-xs text-slate-500">Đóng</button></div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{Object.entries(suaPhanBo.giaTri).map(([khoa, so]) => <label key={khoa} className="rounded border border-slate-200 bg-white p-2 text-xs">
            <span className="block truncate text-slate-600" title={khoa}>{khoa} · Q {fmt(suaPhanBo.qTheoKhoa[khoa])}</span>
            <input type="number" min="0" step="1" value={so} onChange={(e) => setSuaPhanBo((p) => ({ ...p, giaTri: { ...p.giaTri, [khoa]: e.target.value } }))}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-right font-mono" />
          </label>)}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input value={suaPhanBo.lyDo} onChange={(e) => setSuaPhanBo((p) => ({ ...p, lyDo: e.target.value }))}
              placeholder="Lý do nếu phân bổ khoa vượt Q" className="min-w-80 rounded border border-slate-300 px-2 py-1.5 text-xs" />
            <button disabled={dangLuuPhanBo} onClick={luuPhanBo} className="rounded bg-umc-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{dangLuuPhanBo ? "Đang lưu…" : "Lưu phân bổ"}</button>
            {loiPhanBo && <span className="text-xs text-red-600">{loiPhanBo}</span>}
          </div>
        </div>}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- Hộp thoại
function HopThoaiRot({
  formRot, setFormRot, mocRot, setMocRot, soLuongRot, setSoLuongRot,
  lyDoRot, setLyDoRot, loiRot, dangLuuRot, onHuy, onLuu,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={onHuy}>
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-slate-900">
          Đánh dấu rớt thầu — {formRot.nhan}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {formRot.laCaNhom
            ? `Rớt hoàn toàn: cả ${formRot.maHang.length} mã hàng trong nhóm sẽ được đánh dấu rớt.`
            : "Rớt 1 phần: chỉ mã hàng này bị đánh dấu, các mã tương đương khác trong nhóm vẫn trúng."}
          {" "}Kết quả tự chảy về mọi khoa đã đề xuất mã này.
        </p>

        <label className="mt-4 block text-xs font-medium text-slate-600">Rớt ở giai đoạn</label>
        <div className="mt-1.5 flex gap-1.5">
          {GIAI_DOAN.map((g) => (
            <button key={g.ma} type="button" onClick={() => setMocRot(g.ma)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                mocRot === g.ma ? "bg-umc-800 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
              {g.ten}
            </button>
          ))}
        </div>

        {!formRot.laCaNhom && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">
              <input type="checkbox" checked={!!formRot.rotToanBo}
                onChange={(e) => setFormRot((p) => ({ ...p, rotToanBo: e.target.checked }))} />
              Rớt toàn bộ số còn lại
            </label>
            <label className="text-xs font-medium text-slate-600">
              Số lượng rớt một phần
              <input type="number" min="1" step="1" value={soLuongRot}
                disabled={!!formRot.rotToanBo}
                onChange={(e) => setSoLuongRot(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" />
            </label>
          </div>
        )}

        <label className="mt-4 block text-xs font-medium text-slate-600">
          Lý do rớt <span className="text-red-500">*</span>
        </label>
        <textarea value={lyDoRot} onChange={(e) => setLyDoRot(e.target.value)} rows={3}
          placeholder="Vd: không có nhà thầu tham dự / giá vượt dự toán / không đạt tiêu chí kỹ thuật…"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-umc-500 focus:outline-none" />
        <p className="mt-1 text-[11px] text-slate-400">
          Lý do là dữ liệu để trình hội đồng và giải thích vì sao phát sinh gói bổ sung — bắt buộc nhập.
        </p>

        {loiRot && <p className="mt-2 text-sm text-red-600">{loiRot}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onHuy}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            Huỷ
          </button>
          <button type="button" onClick={onLuu} disabled={dangLuuRot}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
            {dangLuuRot ? "Đang lưu…" : "Xác nhận rớt"}
          </button>
        </div>
      </div>
    </div>
  );
}
