import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  FolderOpen,
  Plus,
  Sheet,
  Workflow,
  X,
} from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import HoSoTrucTuyen from "./HoSoTrucTuyen";
import { HO_SO, taoBanThaoHoSo } from "../lib/xuatHoSo";

const NHAN_TRANG_THAI = {
  ban_nhap: "Bản nháp",
  cho_pdd: "Chờ PĐD",
  dang_xet_duyet: "Đang xét duyệt",
  pdd_da_sua: "PĐD đang sửa",
  tu_choi: "PĐD trả lại",
  da_duyet: "Đã duyệt",
  da_di_thau: "Đã đi thầu · đã khóa",
};

// Không gian hồ sơ của ĐVSD:
// - Gói 18 tháng/bổ sung: 2 tab Word cam kết + Excel danh mục.
// - Chỉ định thầu: 1 tab Word theo đúng biểu mẫu riêng.
// Mỗi lần tạo mới sinh một bộ hồ sơ riêng từ danh mục khoa đã gửi trong đợt.
// Phần chỉnh trực tiếp được lưu ở ho_so_cong_tac, tách khỏi proposals để
// không sửa đè sổ đề xuất gốc hoặc các bộ hồ sơ đã tạo trước đó.

export default function XuatHoSo({
  profile,
  goi,
  dot,
  dotIdKhoiTao = "",
  donViKhoiTao = "",
  nhomKhoiTao = null,
  proposalIdKhoiTao = null,
  maHoSoKhoiTao = "",
  nguonKeyKhoiTao = "",
}) {
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";
  const [rows, setRows] = useState([]);
  const [dots, setDots] = useState([]);
  const [dotId, setDotId] = useState(dotIdKhoiTao ? String(dotIdKhoiTao) : (dot?.id ? String(dot.id) : ""));
  const [usage, setUsage] = useState({});
  const [donVi, setDonVi] = useState(laPdd ? donViKhoiTao : profile.khoa);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [dsHoSo, setDsHoSo] = useState([]);
  const [loaiTaiLieu, setLoaiTaiLieu] = useState("word");
  const [nguonDangMo, setNguonDangMo] = useState("");
  const [maDangMo, setMaDangMo] = useState("");
  const [moChonMau, setMoChonMau] = useState(false);
  const [dangTao, setDangTao] = useState(false);
  const [loiHoSo, setLoiHoSo] = useState("");
  const [daTaiDanhSach, setDaTaiDanhSach] = useState(false);
  const [gioDaThuTao, setGioDaThuTao] = useState("");

  const khoaGioKhoiTao = nhomKhoiTao
    ? `nhom:${nhomKhoiTao}`
    : proposalIdKhoiTao ? `le:${proposalIdKhoiTao}` : "";
  const nguonGioKhoiTao = nhomKhoiTao
    ? `gio:${nhomKhoiTao}`
    : proposalIdKhoiTao ? `gio:le-${proposalIdKhoiTao}` : "";
  const nguonMoKhoiTao = nguonKeyKhoiTao || nguonGioKhoiTao;

  const tai = useCallback(async () => {
    setDangTai(true);
    setLoi("");
    const [deXuat, dotRes] = await Promise.all([
      fetchAllRows((f, t) =>
        supabase.from("v_de_xuat_tong_hop").select("*")
          .eq("loai_mua_sam", goi)
          .order("created_at", { ascending: false }).range(f, t)),
      supabase.from("dot_de_xuat").select("*")
        .eq("loai_mua_sam", goi)
        .order("nam", { ascending: false }).order("thang_moc", { ascending: false }),
    ]);
    if (deXuat.error) setLoi(`Không đọc được đề xuất: ${deXuat.error.message}`);
    let ds = deXuat.data || [];
    const dsDot = dotRes.data || [];
    setDots(dsDot);
    setDotId((cu) => {
      if (cu && dsDot.some((x) => String(x.id) === cu)) return cu;
      if (dotIdKhoiTao && dsDot.some((x) => String(x.id) === String(dotIdKhoiTao))) return String(dotIdKhoiTao);
      if (dot?.id && dsDot.some((x) => x.id === dot.id)) return String(dot.id);
      return dsDot[0]?.id ? String(dsDot[0].id) : "";
    });

    const codes = [...new Set(ds.map((x) => x.ma_hang).filter(Boolean))];
    if (codes.length) {
      const [u, vt] = await Promise.all([
        fetchAllRows((f, t) => supabase.from("v_usage_monthly")
          .select("ma_hang, nam, so_luong").in("ma_hang", codes).range(f, t)),
        fetchAllRows((f, t) => supabase.from("vat_tu")
          .select("ma_hang,ten_thuong_mai,ky_ma_hieu,hang,nuoc_san_xuat,tieu_chi_ky_thuat")
          .in("ma_hang", codes).range(f, t)),
      ]);
      const thongTin = Object.fromEntries((vt.data || []).map((x) => [x.ma_hang, x]));
      ds = ds.map((x) => ({ ...x, ...(thongTin[x.ma_hang] || {}) }));
      const acc = {};
      (u.data || []).forEach((x) => {
        acc[x.ma_hang] = acc[x.ma_hang] || {};
        acc[x.ma_hang][x.nam] = (acc[x.ma_hang][x.nam] || 0) + Number(x.so_luong);
      });
      setUsage(acc);
    } else {
      setUsage({});
    }
    setRows(ds);
    setDangTai(false);
  }, [goi, dot?.id, dotIdKhoiTao]);

  useEffect(() => { tai(); }, [tai]);

  const rowsTrongDot = useMemo(() => rows.filter((r) =>
    r.loai_mua_sam === goi
      && dotId
      && String(r.dot_id) === dotId
  ), [rows, goi, dotId]);
  const khoaTrongDot = useMemo(
    () => [...new Set(rowsTrongDot.map((r) => r.don_vi).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "vi")),
    [rowsTrongDot]
  );
  useEffect(() => {
    if (!laPdd) {
      setDonVi(profile.khoa);
      return;
    }
    setDonVi((cu) => {
      if (cu && khoaTrongDot.includes(cu)) return cu;
      if (donViKhoiTao && khoaTrongDot.includes(donViKhoiTao)) return donViKhoiTao;
      return khoaTrongDot[0] || "";
    });
  }, [laPdd, profile.khoa, khoaTrongDot.join("|"), donViKhoiTao]);
  const rowsLoc = useMemo(
    () => rowsTrongDot.filter((r) => {
      if (donVi && r.don_vi !== donVi) return false;
      if (nhomKhoiTao) return r.nhom_de_xuat === nhomKhoiTao;
      if (proposalIdKhoiTao) return Number(r.id) === Number(proposalIdKhoiTao);
      return true;
    }),
    [rowsTrongDot, donVi, nhomKhoiTao, proposalIdKhoiTao]
  );

  // Chỉ còn Word — "Danh mục đề xuất của khoa" (Excel) đã dời sang tab riêng
  // (DanhMucDeXuatKhoa.jsx, #danh-muc-de-xuat/...), không tạo/dùng ở đây nữa
  // (chốt 07/08/2026).
  const taiLieu = useMemo(() => goi === "chi_dinh_thau"
    ? [{ ma: "chi_dinh_thau", ten: "Đề xuất mua chỉ định thầu" }]
    : [{ ma: "cam_ket_sl", ten: "Bản cam kết số lượng" }], [goi]);
  const mauTheoLoai = useMemo(
    () => taiLieu.filter((t) => HO_SO[t.ma]?.loai === loaiTaiLieu),
    [taiLieu, loaiTaiLieu]
  );
  const hoSoTheoLoai = useMemo(
    () => dsHoSo.filter((h) => h.loai_tai_lieu === loaiTaiLieu),
    [dsHoSo, loaiTaiLieu]
  );

  const taiDanhSachHoSo = useCallback(async () => {
    setLoiHoSo("");
    setDaTaiDanhSach(false);
    if (!dotId || !donVi) {
      setDsHoSo([]);
      setDaTaiDanhSach(true);
      return [];
    }
    const r = await fetchAllRows((f, t) => supabase.from("ho_so_cong_tac")
      .select("id,nguon_key,ma_ho_so,loai_tai_lieu,trang_thai,revision,created_by,created_at,updated_by,updated_at,noi_dung")
      .eq("dot_id", Number(dotId))
      .eq("loai_mua_sam", goi)
      .eq("don_vi", donVi)
      .order("updated_at", { ascending: false })
      .range(f, t));
    if (r.error) {
      setLoiHoSo(r.error.message);
      setDsHoSo([]);
      setDaTaiDanhSach(true);
      return [];
    }
    const data = r.data || [];
    setDsHoSo(data);
    setDaTaiDanhSach(true);
    return data;
  }, [dotId, donVi, goi]);

  useEffect(() => {
    setNguonDangMo("");
    setMaDangMo("");
    setMoChonMau(false);
    taiDanhSachHoSo().then((data) => {
      if (nguonMoKhoiTao) {
        const hoSoGio = data.find((h) =>
          h.nguon_key === nguonMoKhoiTao
          && (!maHoSoKhoiTao || h.ma_ho_so === maHoSoKhoiTao)
        );
        if (hoSoGio) {
          setLoaiTaiLieu(hoSoGio.loai_tai_lieu);
          setNguonDangMo(hoSoGio.nguon_key);
          setMaDangMo(maHoSoKhoiTao || hoSoGio.ma_ho_so);
          return;
        }
      }
      if (!laPdd) return;
      const cho = data.find((h) => h.trang_thai === "cho_pdd");
      if (cho) {
        setLoaiTaiLieu(cho.loai_tai_lieu);
        setNguonDangMo(cho.nguon_key);
        setMaDangMo(cho.ma_ho_so);
      }
    });
  }, [taiDanhSachHoSo, laPdd, nguonMoKhoiTao, maHoSoKhoiTao]);

  useEffect(() => {
    setGioDaThuTao("");
  }, [khoaGioKhoiTao, goi]);

  // Hai nút trên thẻ đề xuất đi thẳng vào đúng bộ hồ sơ của CHÍNH giỏ đó.
  // Nếu đây là lần mở đầu tiên, RPC tạo bản cam kết Word; từ lần sau chỉ mở
  // lại cùng nguon_key nên hồ sơ luôn có trong kho của khoa.
  useEffect(() => {
    if (!khoaGioKhoiTao || !nguonGioKhoiTao || !daTaiDanhSach || dangTai
        || dangTao || gioDaThuTao === khoaGioKhoiTao || !dotId || !donVi
        || !rowsLoc.length || goi === "chi_dinh_thau") return;

    const daCo = dsHoSo.some((h) => h.nguon_key === nguonGioKhoiTao);
    if (daCo) {
      setNguonDangMo(nguonGioKhoiTao);
      setMaDangMo(maHoSoKhoiTao || "cam_ket_sl");
      setLoaiTaiLieu(HO_SO[maHoSoKhoiTao || "cam_ket_sl"].loai);
      setGioDaThuTao(khoaGioKhoiTao);
      return;
    }
    if (!rowsLoc.every((r) => r.trang_thai === "hoan_thanh")) {
      setLoiHoSo("Chỉ tạo bản cam kết Word sau khi Phòng Điều dưỡng đã hoàn thành duyệt cả giỏ.");
      setGioDaThuTao(khoaGioKhoiTao);
      return;
    }

    setGioDaThuTao(khoaGioKhoiTao);
    setDangTao(true);
    setLoiHoSo("");
    const meta = {
      don_vi: donVi,
      nguoi_lap: rowsLoc[0]?.created_by_ho_ten || rowsLoc[0]?.created_by || donVi,
    };
    const pTaiLieu = taiLieu.map((t) => ({
      ma_ho_so: t.ma,
      loai_tai_lieu: HO_SO[t.ma].loai,
      noi_dung: {
        ban_thao: taoBanThaoHoSo(t.ma, rowsLoc, meta, usage),
        rows: rowsLoc,
        meta,
        usage,
        source_ids: rowsLoc.map((r) => r.id).filter(Boolean),
      },
    }));

    supabase.rpc("tao_ho_so_tu_gio_da_duyet", {
      p_nhom: nhomKhoiTao || null,
      p_proposal_id: nhomKhoiTao ? null : Number(proposalIdKhoiTao),
      p_tai_lieu: pTaiLieu,
    }).then(async ({ error }) => {
      if (error) {
        const canPatch = error.code === "PGRST202" || /tao_ho_so_tu_gio_da_duyet/i.test(error.message || "");
        setLoiHoSo(canPatch
          ? "Staging chưa có chức năng tạo cam kết Word theo giỏ. Cần chạy backend/sql/patch_x_quyen_khoa_va_ho_so_theo_gio.sql."
          : error.message);
        setDangTao(false);
        return;
      }
      await taiDanhSachHoSo();
      setNguonDangMo(nguonGioKhoiTao);
      setMaDangMo(maHoSoKhoiTao || "cam_ket_sl");
      setLoaiTaiLieu(HO_SO[maHoSoKhoiTao || "cam_ket_sl"].loai);
      setDangTao(false);
    });
  }, [
    khoaGioKhoiTao, nguonGioKhoiTao, daTaiDanhSach, dangTai, dangTao,
    gioDaThuTao, dotId, donVi, rowsLoc, goi, dsHoSo, maHoSoKhoiTao,
    taiLieu, usage, nhomKhoiTao, proposalIdKhoiTao, taiDanhSachHoSo,
  ]);

  const taoBoHoSoMoi = async (maMau) => {
    if (!dotId || !donVi || !rowsLoc.length || dangTao) return;
    setDangTao(true);
    setLoiHoSo("");
    const meta = {
      don_vi: donVi,
      nguoi_lap: laPdd
        ? rowsLoc[0]?.created_by_ho_ten || rowsLoc[0]?.created_by || donVi
        : profile.ho_ten || profile.email,
    };
    const pTaiLieu = taiLieu.map((t) => ({
      ma_ho_so: t.ma,
      loai_tai_lieu: HO_SO[t.ma].loai,
      noi_dung: {
        ban_thao: taoBanThaoHoSo(t.ma, rowsLoc, meta, usage),
        rows: rowsLoc,
        meta,
        usage,
        source_ids: rowsLoc.map((r) => r.id).filter(Boolean),
      },
    }));
    const { data, error } = await supabase.rpc("tao_bo_ho_so_moi", {
      p_dot_id: Number(dotId),
      p_loai_mua_sam: goi,
      p_don_vi: donVi,
      p_tai_lieu: pTaiLieu,
    });
    if (error) {
      const canPatch = error.code === "PGRST202" || /tao_bo_ho_so_moi/i.test(error.message || "");
      setLoiHoSo(canPatch
        ? "Staging chưa có chức năng tạo nhiều bộ hồ sơ. Cần chạy backend/sql/patch_t_tao_nhieu_bo_ho_so.sql."
        : error.message);
      setDangTao(false);
      return;
    }
    await taiDanhSachHoSo();
    setNguonDangMo(data.nguon_key);
    setMaDangMo(maMau);
    setLoaiTaiLieu(HO_SO[maMau].loai);
    setMoChonMau(false);
    setDangTao(false);
  };

  const hoSoDangMo = useMemo(
    () => dsHoSo.find((h) => h.nguon_key === nguonDangMo && h.ma_ho_so === maDangMo),
    [dsHoSo, nguonDangMo, maDangMo]
  );
  const rowsDangMo = useMemo(() => {
    const ids = hoSoDangMo?.noi_dung?.source_ids || [];
    if (!ids.length) return rowsLoc;
    const tapId = new Set(ids.map(Number));
    return rowsTrongDot.filter((r) => r.don_vi === donVi && tapId.has(Number(r.id)));
  }, [hoSoDangMo, rowsLoc, rowsTrongDot, donVi]);
  const laDanhMucGop = nguonDangMo.startsWith("gop:");
  const taiLieuDangMo = laDanhMucGop
    ? [{ ma: "danh_muc_dvsd", ten: "Danh mục Excel gộp của khoa" }]
    : taiLieu;

  if (dangTai) return <p className="text-sm text-slate-500">Đang mở hồ sơ của khoa…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-2">
          <span className="rounded-lg bg-sky-50 p-2 text-[var(--umc-blue)]">
            <Workflow size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-900">
              {goi === "chi_dinh_thau" ? "Hồ sơ chỉ định thầu" : "Cam kết của khoa"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {laPdd
                ? "Chọn khoa, sửa trực tiếp và duyệt trên đúng bản khoa đang xem."
                : "Khoa và Phòng Điều dưỡng cùng làm việc trên một bản trực tuyến, không cần gửi file qua Zalo."}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-slate-600" htmlFor="dot-ho-so-khoa">Đợt lập hồ sơ</label>
          <select id="dot-ho-so-khoa" value={dotId} onChange={(e) => setDotId(e.target.value)}
            className="min-w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">— chọn đợt —</option>
            {dots.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ten} · {d.trang_thai === "mo" ? "đang mở" : "đã đóng"}
              </option>
            ))}
          </select>
          <span className="inline-flex items-center gap-1 text-xs text-teal-700">
            <CheckCircle2 size={13} />
            {rowsLoc.length} mã hàng đã gửi trong đợt
          </span>
          {laPdd && (
            <>
              <label className="ml-0 text-xs font-medium text-slate-600 sm:ml-2" htmlFor="khoa-ho-so-pdd">Khoa lập hồ sơ</label>
              <select id="khoa-ho-so-pdd" value={donVi} onChange={(e) => setDonVi(e.target.value)}
                className="min-w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">— chọn khoa —</option>
                {khoaTrongDot.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </>
          )}
        </div>

        {rows.some((r) => r.dot_id === undefined) && (
          <p className="mt-2 flex items-start gap-1 text-xs text-amber-700">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            View staging chưa trả dot_id. Cần chạy patch_i_rut_va_tong_hop.sql.
          </p>
        )}
        {loi && <p className="mt-2 text-sm text-red-600">{loi}</p>}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Kho cam kết của khoa</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Chọn để mở bản cam kết đã tạo, hoặc nhấn dấu + để tạo bộ mới.
            </p>
          </div>
          <button type="button" onClick={() => setMoChonMau((x) => !x)}
            disabled={!dotId || !donVi || !rowsLoc.length}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--umc-blue)] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-35">
            {moChonMau ? <X size={15} /> : <Plus size={15} />}
            {moChonMau ? "Đóng chọn mẫu" : "Tạo hồ sơ mới"}
          </button>
        </div>

        {loiHoSo && (
          <p className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loiHoSo}</p>
        )}

        {moChonMau && (
          <div className="border-b border-sky-200 bg-sky-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">
              Chọn biểu mẫu {loaiTaiLieu === "word" ? "Word" : "Excel"}
            </p>
            {mauTheoLoai.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {mauTheoLoai.map((m) => {
                  const Icon = loaiTaiLieu === "word" ? FileText : Sheet;
                  return (
                    <button key={m.ma} type="button" onClick={() => taoBoHoSoMoi(m.ma)} disabled={dangTao}
                      className="flex items-center gap-3 rounded-xl border border-sky-200 bg-white p-3 text-left hover:border-sky-400 disabled:opacity-40">
                      <span className={`rounded-lg p-2 ${loaiTaiLieu === "word" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                        <Icon size={18} />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">{m.ten}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {dangTao ? "Đang tạo bộ hồ sơ…" : "Tạo từ dữ liệu đề xuất của đợt đang chọn"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Gói này không có biểu mẫu {loaiTaiLieu === "word" ? "Word" : "Excel"}.</p>
            )}
            {taiLieu.length > 1 && (
              <p className="mt-3 text-xs text-sky-800">
                Khi tạo mới, hệ thống sinh cùng một bộ gồm Word và Excel để hai file đi chung một vòng xét duyệt.
              </p>
            )}
          </div>
        )}

        <div className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Hồ sơ {loaiTaiLieu === "word" ? "Word" : "Excel"} đã tạo
            </p>
            {nguonDangMo && (
              <button type="button" onClick={() => { setNguonDangMo(""); setMaDangMo(""); }}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
                <X size={13} /> Đóng hồ sơ đang mở
              </button>
            )}
          </div>

          {hoSoTheoLoai.length ? (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {hoSoTheoLoai.map((h) => {
                const dangMo = nguonDangMo === h.nguon_key && maDangMo === h.ma_ho_so;
                const Icon = h.loai_tai_lieu === "word" ? FileText : Sheet;
                return (
                  <button key={h.id} type="button"
                    onClick={() => {
                      setNguonDangMo(h.nguon_key);
                      setMaDangMo(h.ma_ho_so);
                      setMoChonMau(false);
                    }}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left ${
                      dangMo ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}>
                    <span className={`rounded-lg p-2 ${h.loai_tai_lieu === "word" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-800">
                        {HO_SO[h.ma_ho_so]?.ten || h.ma_ho_so}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-500">
                        {NHAN_TRANG_THAI[h.trang_thai] || h.trang_thai} · revision #{h.revision}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {new Date(h.updated_at).toLocaleString("vi-VN")} · {h.updated_by}
                      </span>
                    </span>
                    <FolderOpen size={14} className="mt-1 shrink-0 text-slate-400" />
                  </button>
                );
              })}
            </div>
          ) : (
            <button type="button" onClick={() => setMoChonMau(true)}
              disabled={!mauTheoLoai.length || !rowsLoc.length}
              className="flex w-full flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-9 text-center disabled:opacity-50">
              <Plus size={25} className="text-slate-400" />
              <span className="mt-2 text-sm font-medium text-slate-600">Chưa có hồ sơ {loaiTaiLieu === "word" ? "Word" : "Excel"}</span>
              <span className="mt-1 text-xs text-slate-400">Nhấn để chọn biểu mẫu và tạo hồ sơ đầu tiên.</span>
            </button>
          )}
        </div>
      </section>

      {nguonDangMo && maDangMo && (
        <HoSoTrucTuyen
          key={`${goi}-${dotId}-${donVi}-${nguonDangMo}-${maDangMo}`}
          profile={profile}
          goi={goi}
          dotId={dotId}
          donVi={donVi}
          nguonKey={nguonDangMo}
          maKhoiTao={maDangMo}
          anThanhTaiLieu
          rows={rowsDangMo}
          usage={usage}
          taiLieu={taiLieuDangMo}
          chiKhoaDiThau={laDanhMucGop}
          onSaved={taiDanhSachHoSo}
          meta={{
            don_vi: donVi,
            nguoi_lap: laPdd
              ? rowsDangMo[0]?.created_by_ho_ten || rowsDangMo[0]?.created_by || donVi
              : profile.ho_ten || profile.email,
          }}
          tieuDe={HO_SO[maDangMo]?.ten || "Hồ sơ trực tuyến"}
          moTa={`Bộ hồ sơ ${nguonDangMo}. Nội dung hiển thị đồng thời cho khoa và Phòng Điều dưỡng; bản đã duyệt được khóa.`}
        />
      )}
    </div>
  );
}
