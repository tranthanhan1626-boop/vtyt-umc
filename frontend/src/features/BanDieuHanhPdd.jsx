import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Bell, Building2, CheckCircle2, ChevronDown, ChevronRight,
  Copy, Database, ExternalLink, Layers3, RefreshCw, Search, Trash2, XCircle,
} from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";
import { GOI_ID_MAP } from "../lib/cotChuan";
import { gomTheoMaQuanLy, tinhTinhHinhKhoa, tinhTongQuan } from "../lib/tongHopDeXuat";

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

  // ---- Dữ liệu chính ------------------------------------------------------
  const tai = useCallback(async () => {
    if (!dot) return;
    setDangTai(true);
    setLoi("");
    setCanhBaoChot("");

    const [rDeXuat, rKhoa, rHoSo, rKetQua] = await Promise.all([
      fetchAllRows((f, t) => supabase.from("v_de_xuat_tong_hop").select("*")
        .eq("loai_mua_sam", dot.loai_mua_sam).eq("dot_id", dot.id).range(f, t), { order: "id" }),
      supabase.from("v_don_vi").select("don_vi"),
      fetchAllRows((f, t) => supabase.from("ho_so_cong_tac")
        .select("don_vi, loai_tai_lieu, ma_ho_so")
        .eq("dot_id", dot.id).eq("loai_tai_lieu", "word").range(f, t), { order: "id" }),
      fetchAllRows((f, t) => supabase.from("v_ket_qua_thau_theo_khoa").select("*")
        .eq("loai_mua_sam", dot.loai_mua_sam).eq("ket_qua", "khong_trung").range(f, t), { order: "ket_qua_id" }),
    ]);

    if (rDeXuat.error) {
      setLoi(`Không đọc được đề xuất: ${rDeXuat.error.message}`);
      setDangTai(false);
      return;
    }
    setRows(rDeXuat.data || []);
    setDsKhoa((rKhoa.data || []).map((x) => x.don_vi));
    setKhoaCoWord(new Set((rHoSo.data || []).map((x) => x.don_vi)));
    setKetQuaRot(rKetQua.error ? [] : (rKetQua.data || []));

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
    let qChot = supabase.from("danh_muc_khoa_chot").select("khoa, goi_id")
      .eq("nam_de_xuat", NAM_DE_XUAT);
    const { data: chotData, error: loiChot } = await qChot;
    if (loiChot) {
      setKhoaDaChot(new Set());
      setCanhBaoChot(
        loiChot.code === "42P01" || /danh_muc_khoa_chot/i.test(loiChot.message || "")
          ? "Chưa chạy backend/sql/patch_zj_ban_dieu_hanh_pdd.sql — cột \"Đã chốt danh mục\" tạm để trống."
          : loiChot.message
      );
    } else {
      setKhoaDaChot(new Set((chotData || []).map((x) => x.khoa)));
    }
    setDangTai(false);
  }, [dot]);

  useEffect(() => { tai(); }, [tai]);

  // ---- Lọc theo gói con ---------------------------------------------------
  const rowsLoc = useMemo(() => {
    if (!goiConId) return rows;
    const nhanGoi = GOI_ID_MAP[goiConId]?.goi;
    return nhanGoi ? rows.filter((r) => r.goi === nhanGoi) : rows;
  }, [rows, goiConId]);

  const cay = useMemo(() => gomTheoMaQuanLy(rowsLoc), [rowsLoc]);
  const tinhHinhKhoa = useMemo(
    () => tinhTinhHinhKhoa(dsKhoa, rowsLoc, khoaCoWord, khoaDaChot),
    [dsKhoa, rowsLoc, khoaCoWord, khoaDaChot]
  );
  const tongQuan = useMemo(() => tinhTongQuan(tinhHinhKhoa, cay), [tinhHinhKhoa, cay]);

  const maDangRot = useMemo(() => {
    const m = new Map();
    ketQuaRot.forEach((r) => { if (!m.has(r.ma_hang)) m.set(r.ma_hang, r); });
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
  const moFormRot = (maHang, nhan, laCaNhom) => {
    setFormRot({ maHang, nhan, laCaNhom });
    setMocRot("chao_gia");
    setLyDoRot("");
    setLoiRot("");
  };

  const luuRot = async () => {
    if (!lyDoRot.trim()) { setLoiRot("Phải nhập lý do rớt thầu."); return; }
    setDangLuuRot(true);
    setLoiRot("");
    const { data, error } = await supabase.rpc("danh_dau_rot_theo_dot", {
      p_dot_id: Number(dotId),
      p_ma_hang: formRot.maHang,
      p_moc: mocRot,
      p_ly_do: lyDoRot.trim(),
    });
    setDangLuuRot(false);
    if (error) {
      const chuaPatch = error.code === "PGRST202" || /danh_dau_rot_theo_dot/i.test(error.message || "");
      setLoiRot(chuaPatch
        ? "Staging chưa có chức năng tích rớt trên Bàn điều hành. Cần chạy backend/sql/patch_zj_ban_dieu_hanh_pdd.sql."
        : error.message);
      return;
    }
    setThongBao(`Đã đánh dấu rớt ${formRot.maHang.length} mã hàng — ${Number(data) || 0} dòng đề xuất của các khoa được cập nhật.`);
    setFormRot(null);
    await tai();
  };

  const boRot = async (maHang) => {
    setThongBao("");
    const { data, error } = await supabase.rpc("bo_danh_dau_rot_theo_dot", {
      p_dot_id: Number(dotId),
      p_ma_hang: maHang,
    });
    if (error) {
      const chuaPatch = error.code === "PGRST202" || /bo_danh_dau_rot_theo_dot/i.test(error.message || "");
      setLoi(chuaPatch
        ? "Staging chưa có chức năng bỏ tích rớt. Cần chạy backend/sql/patch_zj_ban_dieu_hanh_pdd.sql."
        : error.message);
      return;
    }
    setThongBao(`Đã bỏ tích rớt, ${Number(data) || 0} dòng trở lại mặc định TRÚNG.`);
    await tai();
  };

  // ---- Dọn dữ liệu làm việc cuối đợt (patch_zm) ---------------------------
  // Chốt 07/08/2026: xuất Excel KHÔNG xoá gì. Chỉ khi đợt xong hẳn mới dọn,
  // và phải xem trước sẽ xoá bao nhiêu dòng rồi mới xác nhận — xoá nhầm là
  // mất công cả khoa gõ tay, không hoàn tác được.
  const moDonDuLieu = async () => {
    if (!goiIdHienTai) {
      setLoi("Chọn một gói con trước khi dọn — mỗi gói con có bộ dữ liệu làm việc riêng.");
      return;
    }
    setLoi("");
    const { data, error } = await supabase.rpc("dem_du_lieu_lam_viec", {
      p_goi_id: goiIdHienTai, p_nam_de_xuat: NAM_DE_XUAT,
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
      k.daDeXuat && !k.daChot && "chưa chốt Danh mục đề xuất",
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
      window.location.hash = `#danh-muc-de-xuat/${ds[0]}/${encodeURIComponent(khoa)}`;
      return;
    }
    setLoi(ds.length === 0
      ? `Không xác định được gói con của ${khoa} — kiểm tra lại dữ liệu đề xuất.`
      : `${khoa} có đề xuất ở ${ds.length} gói con. Chọn một gói con ở trên rồi bấm lại để mở đúng danh mục.`);
  };

  // ---- Render -------------------------------------------------------------
  const TAB = [
    { ma: "khoa", ten: "Theo dõi khoa", Icon: Building2 },
    { ma: "tong_hop", ten: "Danh mục tổng hợp", Icon: Layers3 },
    { ma: "ket_qua", ten: "Kết quả thầu & giỏ rớt", Icon: XCircle },
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

        {/* Thanh tổng quan */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <ONhanh nhan="Khoa toàn viện" so={tongQuan.soKhoaToanVien} />
          <ONhanh nhan="Đã đề xuất" so={tongQuan.soKhoaDaDeXuat} mau="text-teal-700" />
          <ONhanh nhan="Chưa đề xuất" so={tongQuan.soKhoaChuaDeXuat}
            mau={tongQuan.soKhoaChuaDeXuat > 0 ? "text-red-600" : "text-slate-800"} />
          <ONhanh nhan="Đủ Word cam kết" so={`${tongQuan.soKhoaCoWord}/${tongQuan.soKhoaDaDeXuat}`} />
          <ONhanh nhan="Đã chốt danh mục" so={`${tongQuan.soKhoaDaChot}/${tongQuan.soKhoaDaDeXuat}`} />
          <ONhanh nhan="Tổng SL toàn viện" so={fmt(tongQuan.tongSoLuong)} mau="text-[var(--umc-blue)]" />
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
              className="ml-1 rounded border border-teal-200 bg-white px-2 py-0.5 font-medium text-teal-700 hover:bg-teal-50">
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
        {thongBao && <p className="mt-2 text-sm text-teal-700">{thongBao}</p>}
      </div>

      {/* Tab */}
      <div role="tablist" className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {TAB.map(({ ma, ten, Icon }) => (
          <button key={ma} type="button" role="tab" aria-selected={tab === ma}
            onClick={() => { setTab(ma); setTuKhoa(""); }}
            className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold ${
              tab === ma ? "border-b-2 border-teal-600 bg-white text-slate-900" : "bg-slate-50 text-slate-500 hover:bg-white"}`}>
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
            window.location.hash = `#tong-hop-pdd/${goiIdHienTai}`;
          }}
        />
      ) : (
        <TabKetQua ketQuaRot={ketQuaRot} dot={dot} boRot={boRot} />
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
              Chỉ làm việc này khi gói <b>{GOI_ID_MAP[goiIdHienTai]?.nhan}</b> đã đấu thầu xong hẳn
              và đã xuất/lưu file trình ký. <b>Không hoàn tác được.</b>
            </p>
            <ul className="mt-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <li>{fmt(formDon.o_danh_muc_khoa || 0)} ô các khoa đã sửa tay trên Danh mục đề xuất</li>
              <li>{fmt(formDon.o_tong_hop_pdd || 0)} ô PĐD đã sửa đè trên Danh mục tổng hợp</li>
              <li>{fmt(formDon.cau_hinh_cot || 0)} cấu hình ẩn/khoá cột</li>
            </ul>
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
          lyDoRot={lyDoRot} setLyDoRot={setLyDoRot} loiRot={loiRot}
          dangLuuRot={dangLuuRot} onHuy={() => setFormRot(null)} onLuu={luuRot}
        />
      )}
    </div>
  );
}

function ONhanh({ nhan, so, mau = "text-slate-800" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
      <p className="text-[11px] leading-tight text-slate-500">{nhan}</p>
      <p className={`mt-0.5 text-lg font-semibold leading-tight ${mau}`}>{so}</p>
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
              locKhoa === b.ma ? "bg-slate-800 text-white" : "border border-slate-300 text-slate-600 hover:bg-white"}`}>
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
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left">Khoa</th>
              <th className="px-3 py-2 text-center">Đề xuất</th>
              <th className="px-3 py-2 text-right">Mã QL</th>
              <th className="px-3 py-2 text-right">Mã hàng</th>
              <th className="px-3 py-2 text-center">Word cam kết</th>
              <th className="px-3 py-2 text-center">Chốt danh mục</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {khoaHienThi.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">Không có khoa nào khớp bộ lọc.</td></tr>
            ) : khoaHienThi.map((k) => (
              <tr key={k.don_vi} className={`border-b border-slate-100 last:border-0 ${!k.daDeXuat ? "bg-red-50/40" : ""}`}>
                <td className="px-4 py-2">{k.don_vi}</td>
                <td className="px-3 py-2 text-center">
                  {k.daDeXuat
                    ? <CheckCircle2 size={15} className="mx-auto text-teal-600" />
                    : <span className="text-xs font-medium text-red-600">Chưa</span>}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">{k.daDeXuat ? fmt(k.soMaQuanLy) : "—"}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{k.daDeXuat ? fmt(k.soMaHang) : "—"}</td>
                <td className="px-3 py-2 text-center">
                  {k.coWord ? <CheckCircle2 size={15} className="mx-auto text-teal-600" />
                    : <span className="text-xs text-slate-300">—</span>}
                </td>
                <td className="px-3 py-2 text-center">
                  {k.daChot ? <CheckCircle2 size={15} className="mx-auto text-teal-600" />
                    : <span className="text-xs text-slate-300">—</span>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {k.daDeXuat && (
                      <>
                        <button type="button" onClick={() => moDanhMucKhoa(k.don_vi)}
                          className="inline-flex items-center gap-1 rounded border border-teal-200 bg-teal-50 px-2 py-1 text-[11px] font-medium text-teal-800 hover:bg-teal-100">
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
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">Chưa có đề xuất nào trong đợt/gói con này.</td></tr>
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
              onClick={() => moFormRot(mq.maHang.map((mh) => mh.ma_hang), `cả nhóm ${mq.ma_quan_ly}`, true)}
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
                    <span className="rounded bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">Rớt</span>
                    <button type="button" onClick={() => boRot([mh.ma_hang])}
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
function TabKetQua({ ketQuaRot, dot, boRot }) {
  const theoKhoa = useMemo(() => {
    const m = new Map();
    ketQuaRot.forEach((r) => {
      if (!m.has(r.don_vi)) m.set(r.don_vi, { don_vi: r.don_vi, ma: [], chuaXuLy: 0, cuNhat: null });
      const k = m.get(r.don_vi);
      k.ma.push(r);
      if (!r.da_xu_ly) k.chuaXuLy += 1;
      if (!k.cuNhat || (r.cap_nhat_luc && r.cap_nhat_luc < k.cuNhat)) k.cuNhat = r.cap_nhat_luc;
    });
    return [...m.values()].sort((a, b) => b.chuaXuLy - a.chuaXuLy);
  }, [ketQuaRot]);

  if (!ketQuaRot.length) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <CheckCircle2 size={28} className="mx-auto text-teal-600" />
        <p className="mt-2 text-sm text-slate-600">
          Chưa có mã nào bị tích rớt ở đợt "{dot?.ten}".
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Mã không tích mặc định là TRÚNG — không cần tích trúng cho hàng nghìn mã.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-800">
          {ketQuaRot.length} dòng mã rớt · {theoKhoa.length} khoa liên quan
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Khoa xử lý mã rớt bằng cách đẩy số lượng sang mã tương đương, hoặc chuyển sang gói bổ sung.
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {theoKhoa.map((k) => (
          <div key={k.don_vi} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-800">{k.don_vi}</span>
              <span className="text-xs text-slate-500">{k.ma.length} mã rớt</span>
              {k.chuaXuLy > 0 ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  {k.chuaXuLy} chưa xử lý
                  {soNgayTu(k.cuNhat) != null && ` · ${soNgayTu(k.cuNhat)} ngày`}
                </span>
              ) : (
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-800">Đã xử lý hết</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {k.ma.map((r) => (
                <span key={`${r.ma_hang}-${r.don_vi}`}
                  className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] ${
                    r.da_xu_ly ? "border-slate-200 bg-slate-50 text-slate-500" : "border-red-200 bg-red-50 text-red-700"}`}>
                  <span className="font-mono">{r.ma_hang}</span>
                  <span className="max-w-40 truncate">{r.ten_vat_tu}</span>
                  {r.cap_nhat_luc && <span className="text-slate-400">{fmtNgay(r.cap_nhat_luc)}</span>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Hộp thoại
function HopThoaiRot({
  formRot, mocRot, setMocRot, lyDoRot, setLyDoRot, loiRot, dangLuuRot, onHuy, onLuu,
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
                mocRot === g.ma ? "bg-slate-800 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
              {g.ten}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs font-medium text-slate-600">
          Lý do rớt <span className="text-red-500">*</span>
        </label>
        <textarea value={lyDoRot} onChange={(e) => setLyDoRot(e.target.value)} rows={3}
          placeholder="Vd: không có nhà thầu tham dự / giá vượt dự toán / không đạt tiêu chí kỹ thuật…"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" />
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
