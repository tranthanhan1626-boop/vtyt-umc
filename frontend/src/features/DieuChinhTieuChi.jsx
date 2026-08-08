import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, ChevronDown, Search, Check, X, Clock } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import NutXoaDuLieuTest from "../components/NutXoaDuLieuTest";

// Điều chỉnh tiêu chí kỹ thuật — màn hình 2 CỘT.
//   TRÁI  = nội dung hiện tại trong danh mục (chỉ đọc)
//   PHẢI  = ô sửa của ĐVSD
//
// ĐVSD KHÔNG sửa thẳng danh mục: `vat_tu`/`nhom_ky_thuat` là nguồn dùng chung
// cho hồ sơ thầu của cả 66 khoa. Một khoa sửa sai là đổi luôn hồ sơ của mọi
// khoa khác đang dùng mã đó mà họ không biết. Nên phải qua bảng đề nghị, PĐD
// duyệt rồi RPC mới ghi vào danh mục thật.

const TRUONG_MA_HANG = [
  { k: "ten_vat_tu", n: "Tên vật tư" },
  { k: "dvt", n: "Đơn vị tính" },
  { k: "tieu_chi_ky_thuat", n: "Tiêu chí kỹ thuật", dai: true },
  { k: "ten_thuong_mai", n: "Tên thương mại" },
  { k: "ky_ma_hieu", n: "Ký mã hiệu" },
  { k: "hang", n: "Hãng sản xuất" },
  { k: "nuoc_san_xuat", n: "Nước sản xuất" },
];
const TRUONG_NHOM = [{ k: "ten_quan_ly", n: "Tên mã quản lý", dai: true }];
const NHAN_TT = {
  cho_duyet: ["Chờ PĐD duyệt", "bg-amber-100 text-amber-800"],
  da_duyet: ["Đã duyệt", "bg-teal-100 text-teal-800"],
  tu_choi: ["Bị từ chối", "bg-red-100 text-red-700"],
};

export default function DieuChinhTieuChi({ profile }) {
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";
  const [nhom, setNhom] = useState([]);
  const [deNghi, setDeNghi] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [tuKhoa, setTuKhoa] = useState("");
  const [bung, setBung] = useState(null);
  const [maHang, setMaHang] = useState([]);
  const [sua, setSua] = useState(null);     // {cap, ma_hang, ma_quan_ly}
  const [form, setForm] = useState({});
  const [lyDo, setLyDo] = useState("");
  const [loi, setLoi] = useState("");
  const [tuChoi, setTuChoi] = useState(null);

  const tai = useCallback(async () => {
    setDangTai(true);
    // ĐVSD chỉ thấy nhóm khoa mình ĐÃ/ĐANG dùng; PĐD thấy toàn bộ danh mục.
    let dsNhom = [];
    if (laPdd) {
      const r = await fetchAllRows((f, t) => supabase.from("v_nhom_co_ma_hang")
        .select("ma_quan_ly, ten_quan_ly, so_ma_hang").order("ma_quan_ly").range(f, t));
      dsNhom = r.data || [];
    } else {
      const [cua, tatCa] = await Promise.all([
        fetchAllRows((f, t) => supabase.from("v_don_vi_nhom").select("ma_quan_ly")
          .eq("don_vi", profile.khoa).range(f, t), { order: "ma_quan_ly" }),
        fetchAllRows((f, t) => supabase.from("v_nhom_co_ma_hang")
          .select("ma_quan_ly, ten_quan_ly, so_ma_hang").order("ma_quan_ly").range(f, t)),
      ]);
      const co = new Set((cua.data || []).map((x) => x.ma_quan_ly));
      dsNhom = (tatCa.data || []).filter((x) => co.has(x.ma_quan_ly));
    }
    const dn = await supabase.from("de_nghi_sua_tieu_chi").select("*")
      .order("ngay_de_nghi", { ascending: false });
    setNhom(dsNhom);
    setDeNghi(dn.data || []);
    setDangTai(false);
  }, [laPdd, profile.khoa]);
  useEffect(() => { tai(); }, [tai]);

  const moNhom = async (ma) => {
    if (bung === ma) { setBung(null); return; }
    setBung(ma); setSua(null); setMaHang([]);
    const r = await fetchAllRows((f, t) => supabase.from("vat_tu")
      .select("ma_hang, ten_vat_tu, dvt, tieu_chi_ky_thuat, ten_thuong_mai, ky_ma_hieu, hang, nuoc_san_xuat")
      .eq("ma_quan_ly", ma).order("ma_hang").range(f, t));
    setMaHang(r.data || []);
  };

  const nhomLoc = useMemo(() => {
    const q = tuKhoa.trim().toLowerCase();
    if (!q) return nhom.slice(0, 60);
    return nhom.filter((n) => n.ma_quan_ly.toLowerCase().includes(q)
      || (n.ten_quan_ly || "").toLowerCase().includes(q)).slice(0, 60);
  }, [nhom, tuKhoa]);

  const choDuyetCua = (ma_quan_ly, ma_hang) =>
    deNghi.find((d) => d.trang_thai === "cho_duyet" && d.ma_quan_ly === ma_quan_ly
      && (ma_hang ? d.ma_hang === ma_hang : d.cap === "ma_quan_ly"));

  const moSua = (cap, cu, ma_quan_ly) => {
    setSua({ cap, ma_hang: cap === "ma_hang" ? cu.ma_hang : null, ma_quan_ly });
    const truong = cap === "ma_hang" ? TRUONG_MA_HANG : TRUONG_NHOM;
    setForm(Object.fromEntries(truong.map((t) => [t.k, cu[t.k] ?? ""])));
    setLyDo(""); setLoi("");
  };

  const guiDeNghi = async (cu) => {
    setLoi("");
    const truong = sua.cap === "ma_hang" ? TRUONG_MA_HANG : TRUONG_NHOM;
    const doi = truong.filter((t) => (form[t.k] ?? "") !== (cu[t.k] ?? ""));
    if (!doi.length) { setLoi("Chưa sửa gì so với nội dung hiện tại."); return; }
    const { error } = await supabase.from("de_nghi_sua_tieu_chi").insert({
      cap: sua.cap, ma_hang: sua.ma_hang, ma_quan_ly: sua.ma_quan_ly,
      don_vi: profile.khoa,
      noi_dung_cu: Object.fromEntries(truong.map((t) => [t.k, cu[t.k] ?? ""])),
      noi_dung_moi: form,
      ly_do: lyDo.trim() || null,
    });
    if (error) { setLoi(error.message); return; }
    setSua(null); await tai();
  };

  const duyet = async (d) => {
    setLoi("");
    const { error } = await supabase.rpc("duyet_sua_tieu_chi", { p_id: d.id });
    if (error) { setLoi(error.message); return; }
    await tai(); if (bung) await moNhom(bung), setBung(d.ma_quan_ly);
  };

  const tuChoiDeNghi = async (d, ly) => {
    const { error, count } = await supabase.from("de_nghi_sua_tieu_chi")
      .update({ trang_thai: "tu_choi", ly_do_tu_choi: ly }, { count: "exact" }).eq("id", d.id);
    if (error) setLoi(error.message);
    else if (!count) setLoi("Không đổi được — kiểm tra quyền.");
    else { setTuChoi(null); await tai(); }
  };

  // Khối 2 cột: trái nội dung hiện tại, phải ô sửa.
  const HaiCot = ({ cap, cu, ma_quan_ly, nhan }) => {
    const truong = cap === "ma_hang" ? TRUONG_MA_HANG : TRUONG_NHOM;
    const cho = choDuyetCua(ma_quan_ly, cap === "ma_hang" ? cu.ma_hang : null);
    const dangSua = sua && sua.cap === cap
      && (cap === "ma_hang" ? sua.ma_hang === cu.ma_hang : sua.ma_quan_ly === ma_quan_ly);
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-800">{nhan}</span>
          {cho && (
            <span className={`rounded px-2 py-0.5 text-xs ${NHAN_TT.cho_duyet[1]}`}>
              {NHAN_TT.cho_duyet[0]} · {cho.don_vi}
            </span>
          )}
          {cho && (
            <NutXoaDuLieuTest
              loai="de_nghi_sua_tieu_chi"
              id={cho.id}
              compact
              nhan="Xóa đề nghị sửa tiêu chí test"
              moTa={`đề nghị sửa ${cho.ma_hang || cho.ma_quan_ly} của ${cho.don_vi}`}
              onDaXoa={() => setDeNghi((cu) => cu.filter((x) => x.id !== cho.id))}
            />
          )}
          {!dangSua && !cho && (
            <button onClick={() => moSua(cap, cu, ma_quan_ly)}
              className="ml-auto rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
              Đề nghị sửa
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-slate-400">Hiện tại</p>
            <dl className="space-y-1.5">
              {truong.map((t) => (
                <div key={t.k}>
                  <dt className="text-xs text-slate-500">{t.n}</dt>
                  <dd className="whitespace-pre-line text-sm text-slate-800">{cu[t.k] || "—"}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase text-teal-700">
              {dangSua ? "Bản sửa của khoa" : cho ? "Đang chờ duyệt" : "Chưa đề nghị sửa"}
            </p>
            {dangSua ? (
              <div className="space-y-1.5">
                {truong.map((t) => (
                  <div key={t.k}>
                    <label className="text-xs text-slate-500">{t.n}</label>
                    {t.dai
                      ? <textarea rows={3} value={form[t.k] ?? ""}
                          onChange={(e) => setForm((p) => ({ ...p, [t.k]: e.target.value }))}
                          className="w-full rounded-md border border-teal-300 px-2 py-1 text-sm" />
                      : <input value={form[t.k] ?? ""}
                          onChange={(e) => setForm((p) => ({ ...p, [t.k]: e.target.value }))}
                          className="w-full rounded-md border border-teal-300 px-2 py-1 text-sm" />}
                  </div>
                ))}
                <input value={lyDo} onChange={(e) => setLyDo(e.target.value)}
                  placeholder="Lý do đề nghị sửa (nên ghi)"
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
                <div className="flex gap-2 pt-1">
                  <button onClick={() => guiDeNghi(cu)}
                    className="rounded-md bg-teal-700 px-3 py-1 text-xs font-medium text-white">Gửi PĐD duyệt</button>
                  <button onClick={() => setSua(null)}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600">Huỷ</button>
                </div>
              </div>
            ) : cho ? (
              <>
                <dl className="space-y-1.5">
                  {truong.map((t) => {
                    const doi = (cho.noi_dung_moi?.[t.k] ?? "") !== (cho.noi_dung_cu?.[t.k] ?? "");
                    return (
                      <div key={t.k}>
                        <dt className="text-xs text-slate-500">{t.n}</dt>
                        <dd className={`whitespace-pre-line text-sm ${doi ? "bg-amber-50 font-medium text-amber-900" : "text-slate-500"}`}>
                          {cho.noi_dung_moi?.[t.k] || "—"}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
                {cho.ly_do && <p className="mt-1 text-xs text-slate-500">Lý do: {cho.ly_do}</p>}
                {laPdd && (
                  tuChoi === cho.id ? (
                    <div className="mt-2 flex gap-1">
                      <input value={lyDo} onChange={(e) => setLyDo(e.target.value)}
                        placeholder="Lý do từ chối" className="flex-1 rounded border border-red-300 px-2 py-1 text-xs" />
                      <button onClick={() => tuChoiDeNghi(cho, lyDo.trim())} disabled={!lyDo.trim()}
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-40">Lưu</button>
                      <button onClick={() => setTuChoi(null)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600">Huỷ</button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => duyet(cho)}
                        className="flex items-center gap-1 rounded-md bg-teal-700 px-3 py-1 text-xs font-medium text-white">
                        <Check size={11} /> Duyệt, ghi vào danh mục
                      </button>
                      <button onClick={() => { setTuChoi(cho.id); setLyDo(""); }}
                        className="flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-xs text-red-700">
                        <X size={11} /> Từ chối
                      </button>
                    </div>
                  )
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">Bấm “Đề nghị sửa” để soạn bản mới.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (dangTai) return <p className="text-sm text-slate-500">Đang tải...</p>;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Điều chỉnh tiêu chí kỹ thuật</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {laPdd
            ? "Xem toàn bộ danh mục và duyệt đề nghị sửa của các khoa."
            : "Chỉ hiện nhóm khoa bạn đang dùng. Sửa xong chờ Phòng Điều dưỡng duyệt mới vào danh mục."}
        </p>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)}
          placeholder="Tìm mã quản lý hoặc tên nhóm"
          className="w-full rounded-md border border-slate-300 py-2 pl-8 pr-2 text-sm" />
      </div>
      <p className="text-xs text-slate-500">{nhom.length} nhóm · hiện {nhomLoc.length}</p>

      {loi && <p className="text-sm text-red-600">{loi}</p>}

      {nhomLoc.map((n) => {
        const mo = bung === n.ma_quan_ly;
        const cho = deNghi.some((d) => d.trang_thai === "cho_duyet" && d.ma_quan_ly === n.ma_quan_ly);
        return (
          <div key={n.ma_quan_ly} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button onClick={() => moNhom(n.ma_quan_ly)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50">
              {mo ? <ChevronDown size={14} className="shrink-0 text-slate-400" />
                  : <ChevronRight size={14} className="shrink-0 text-slate-400" />}
              <span className="font-mono text-xs text-slate-500">{n.ma_quan_ly}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{n.ten_quan_ly}</span>
              {cho && <Clock size={13} className="shrink-0 text-amber-600" />}
              <span className="shrink-0 text-xs text-slate-400">{n.so_ma_hang} mã hàng</span>
            </button>

            {mo && (
              <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 p-2">
                <HaiCot cap="ma_quan_ly" cu={n} ma_quan_ly={n.ma_quan_ly}
                  nhan={`Mã quản lý ${n.ma_quan_ly}`} />
                {maHang.map((m) => (
                  <HaiCot key={m.ma_hang} cap="ma_hang" cu={m} ma_quan_ly={n.ma_quan_ly}
                    nhan={`Mã hàng ${m.ma_hang}`} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
