import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  PackagePlus,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";
import { docGioDeXuat, ghiGioDeXuat } from "../lib/gioDeXuat";
import NutXoaDuLieuTest from "../components/NutXoaDuLieuTest";

// Chỉ ba giai đoạn có thể làm mã rớt. Ký hợp đồng và hàng về đợt đầu không
// còn xuất hiện trên màn ĐVSD.
const GIAI_DOAN = [
  { ma: "chao_gia", ten: "Chào giá" },
  { ma: "mo_thau", ten: "Mở thầu" },
  { ma: "danh_gia", ten: "Đánh giá" },
];
const NHAN_GIAI_DOAN = Object.fromEntries(GIAI_DOAN.map((x) => [x.ma, x.ten]));
const NHAN_LOAI_GOI = {
  dau_thau_rong_rai: "Gói 18 tháng",
  mua_sam_bo_sung: "Gói bổ sung",
  chi_dinh_thau: "Gói chỉ định thầu",
};

const nhanDot = (d) => [
  d.ten,
  d.thang_moc ? `T${d.thang_moc}/${d.nam}` : d.nam,
].filter(Boolean).join(" · ");

const keyMa = (goiId, maHang) => `${goiId}:${maHang}`;

export default function TienDoGoiThau({ profile, onChuyenGoiBoSung }) {
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";
  const [goi, setGoi] = useState([]);
  const [ketQua, setKetQua] = useState([]);
  const [deXuat, setDeXuat] = useState([]);
  const [dot, setDot] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [thongBao, setThongBao] = useState("");
  const [goiMo, setGoiMo] = useState(null);
  const [moTao, setMoTao] = useState(false);
  const [formGoi, setFormGoi] = useState({
    ten: "",
    loai: "dau_thau_rong_rai",
    nam: new Date().getFullYear(),
    dotId: "",
  });
  const [dangChonMa, setDangChonMa] = useState(null);
  const [timMa, setTimMa] = useState("");
  const [formRot, setFormRot] = useState({ maHang: "", moc: "chao_gia", lyDo: "" });
  const [dangLuuRot, setDangLuuRot] = useState(false);
  const [dotBoSungChon, setDotBoSungChon] = useState({});
  const [dangChuyen, setDangChuyen] = useState(null);

  const tai = useCallback(async () => {
    setDangTai(true);
    setLoi("");
    const tacVu = [
      supabase.from("goi_thau_tien_do").select("*")
        .order("nam", { ascending: false }).order("created_at", { ascending: false }),
      fetchAllRows((f, t) => supabase.from("v_ket_qua_thau_theo_khoa")
        .select("*").eq("ket_qua", "khong_trung").order("ma_hang").range(f, t)),
      supabase.from("dot_de_xuat").select("*")
        .order("nam", { ascending: false }).order("thang_moc", { ascending: false }),
    ];
    if (laPdd) {
      tacVu.push(fetchAllRows((f, t) => supabase.from("v_de_xuat_tong_hop")
        .select("*").eq("trang_thai", "hoan_thanh")
        .order("ma_hang").range(f, t)));
    }
    const [g, k, d, p] = await Promise.all(tacVu);
    if (g.error) setLoi(`Không đọc được danh sách gói thầu: ${g.error.message}`);
    setGoi(g.data || []);
    setKetQua(k.error ? [] : k.data || []);
    setDot(d.data || []);
    setDeXuat(laPdd && !p?.error ? p.data || [] : []);
    setDangTai(false);
  }, [laPdd]);

  useEffect(() => { tai(); }, [tai]);

  const dotTheoLoai = useMemo(
    () => dot.filter((d) => d.loai_mua_sam === formGoi.loai),
    [dot, formGoi.loai]
  );
  const dotBoSungMo = useMemo(
    () => dot.filter((d) => d.loai_mua_sam === "mua_sam_bo_sung" && d.trang_thai === "mo"),
    [dot]
  );

  const kqTheoGoi = useMemo(() => {
    const m = new Map();
    ketQua.forEach((r) => {
      if (!m.has(r.goi_id)) m.set(r.goi_id, []);
      m.get(r.goi_id).push(r);
    });
    return m;
  }, [ketQua]);

  // Account ĐVSD chỉ thấy gói có mã rớt của chính khoa (RLS đã lọc dòng).
  const goiHienThi = useMemo(
    () => laPdd ? goi : goi.filter((g) => (kqTheoGoi.get(g.id) || []).length > 0),
    [goi, kqTheoGoi, laPdd]
  );

  const taoGoi = async () => {
    setLoi("");
    if (!formGoi.ten.trim()) { setLoi("Chưa nhập tên gói."); return; }
    if (!formGoi.dotId) { setLoi("Phải chọn đợt đề xuất nguồn của gói."); return; }
    const dotNguon = dot.find((d) => String(d.id) === String(formGoi.dotId));
    const { error } = await supabase.rpc("tao_goi_thau", {
      p_ten: formGoi.ten.trim(),
      p_loai: formGoi.loai,
      p_nam: Number(dotNguon?.nam || formGoi.nam),
      p_dot_id: Number(formGoi.dotId),
    });
    if (error) { setLoi(error.message); return; }
    setMoTao(false);
    setFormGoi((p) => ({ ...p, ten: "", dotId: "" }));
    await tai();
  };

  const deXuatCuaGoi = useCallback((g) => {
    const ds = deXuat.filter((r) =>
      r.loai_mua_sam === g.loai_mua_sam
      && (g.dot_id ? Number(r.dot_id) === Number(g.dot_id) : Number(r.nam_de_xuat) === Number(g.nam))
    );
    const m = new Map();
    ds.forEach((r) => {
      if (!m.has(r.ma_hang)) {
        m.set(r.ma_hang, {
          ma_hang: r.ma_hang,
          ten_vat_tu: r.ten_vat_tu,
          dvt: r.dvt,
          ma_quan_ly: r.ma_quan_ly,
          ten_quan_ly: r.ten_quan_ly,
          soKhoa: new Set(),
          tongSoLuong: 0,
        });
      }
      const x = m.get(r.ma_hang);
      x.soKhoa.add(r.don_vi);
      x.tongSoLuong += Number(r.so_luong) || 0;
    });
    return [...m.values()].map((x) => ({ ...x, soKhoa: x.soKhoa.size }));
  }, [deXuat]);

  const ungVien = useMemo(() => {
    if (!dangChonMa) return [];
    const g = goi.find((x) => x.id === dangChonMa);
    if (!g) return [];
    const q = timMa.trim().toLowerCase();
    const daRot = new Set((kqTheoGoi.get(g.id) || []).map((r) => r.ma_hang));
    return deXuatCuaGoi(g)
      .filter((x) => !daRot.has(x.ma_hang))
      .filter((x) => !q || `${x.ma_hang} ${x.ten_vat_tu} ${x.ma_quan_ly} ${x.ten_quan_ly}`
        .toLowerCase().includes(q))
      .slice(0, 30);
  }, [dangChonMa, goi, timMa, kqTheoGoi, deXuatCuaGoi]);

  const luuMaRot = async (g) => {
    if (!formRot.maHang) { setLoi("Chưa chọn mã hàng bị rớt."); return; }
    if (!formRot.lyDo.trim()) { setLoi("Phải nhập lý do rớt thầu."); return; }
    setDangLuuRot(true);
    setLoi("");
    const { data, error } = await supabase.rpc("danh_dau_ma_rot_thau", {
      p_goi_id: g.id,
      p_ma_hang: formRot.maHang,
      p_ma_moc_rot: formRot.moc,
      p_ly_do: formRot.lyDo.trim(),
    });
    if (error) {
      setLoi(error.message);
      setDangLuuRot(false);
      return;
    }
    setThongBao(`Đã chuyển mã ${formRot.maHang} về ${Number(data) || 0} ĐVSD đã đề xuất mã này.`);
    setDangChonMa(null);
    setFormRot({ maHang: "", moc: "chao_gia", lyDo: "" });
    setTimMa("");
    await tai();
    setDangLuuRot(false);
  };

  const chuyenVaoGioBoSung = async (r) => {
    const khoa = profile.khoa;
    const chon = dotBoSungChon[keyMa(r.goi_id, r.ma_hang)] || dotBoSungMo[0]?.id;
    const dotDich = dotBoSungMo.find((d) => Number(d.id) === Number(chon));
    if (!khoa || !dotDich) {
      setLoi("Chưa có đợt gói bổ sung đang mở để nhận mã rớt.");
      return;
    }
    setDangChuyen(keyMa(r.goi_id, r.ma_hang));
    setLoi("");
    const { data: trenServer, error: loiDoc } = await supabase.from("gio_nhap")
      .select("noi_dung")
      .eq("don_vi", khoa)
      .eq("dot_id", dotDich.id)
      .maybeSingle();
    if (loiDoc) {
      setLoi(`Không đọc được giỏ gói bổ sung: ${loiDoc.message}`);
      setDangChuyen(null);
      return;
    }

    const local = docGioDeXuat(khoa, dotDich.id);
    const gio = { ...(trenServer?.noi_dung || {}), ...local };
    const tuThang = Number(dotDich.thang_moc) || 1;
    gio[r.ma_hang] = {
      soLuong: String(Math.round(Number(r.so_luong_de_xuat) || 0)),
      tuThang,
      tuNam: Number(dotDich.nam),
      denThang: 12,
      denNam: Number(dotDich.nam),
      loaiLyDo: "khac",
      tenKyThuatMoi: "",
      uocCaThang: "",
      ghiChu: `[RỚT THẦU] Chuyển từ ${r.ten_goi}; rớt ở ${NHAN_GIAI_DOAN[r.ma_moc_rot] || r.ma_moc_rot}. ${r.ly_do_khong_trung || ""}`.trim(),
      noiDungChiDinh: "",
      ma_hang: r.ma_hang,
      ten_vat_tu: r.ten_vat_tu,
      dvt: r.dvt,
      ma_quan_ly: r.ma_quan_ly,
      ten_quan_ly: r.ten_quan_ly || "",
      goi: r.goi || null,
      goiYTu: null,
      goiYDen: null,
      ngoaiKhoang: false,
    };

    const { error } = await supabase.from("gio_nhap").upsert({
      don_vi: khoa,
      dot_id: dotDich.id,
      loai_mua_sam: "mua_sam_bo_sung",
      noi_dung: gio,
    }, { onConflict: "don_vi,dot_id" });
    if (error) {
      setLoi(`Không chuyển được vào giỏ: ${error.message}`);
      setDangChuyen(null);
      return;
    }
    ghiGioDeXuat(khoa, dotDich.id, gio);
    setDangChuyen(null);
    onChuyenGoiBoSung?.(dotDich.id);
  };

  const gomMaRot = (rows) => {
    const nhom = new Map();
    rows.forEach((r) => {
      const maNhom = r.ma_quan_ly || "—";
      if (!nhom.has(maNhom)) nhom.set(maNhom, {
        ma: maNhom,
        ten: r.ten_quan_ly || "Chưa có tên nhóm quản lý",
        maHang: new Map(),
      });
      const dsMa = nhom.get(maNhom).maHang;
      if (!dsMa.has(r.ma_hang)) dsMa.set(r.ma_hang, {
        ...r,
        donVi: new Set(),
        tongSoLuong: 0,
      });
      const x = dsMa.get(r.ma_hang);
      x.donVi.add(r.don_vi);
      x.tongSoLuong += Number(r.so_luong_de_xuat) || 0;
    });
    return [...nhom.values()]
      .map((n) => ({
        ...n,
        maHang: [...n.maHang.values()]
          .map((x) => ({ ...x, donVi: [...x.donVi] }))
          .sort((a, b) => a.ma_hang.localeCompare(b.ma_hang, "vi")),
      }))
      .sort((a, b) => a.ma.localeCompare(b.ma, "vi"));
  };

  if (dangTai) return <p className="p-4 text-sm text-slate-500">Đang tải mã rớt thầu…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Tiến độ gói thầu — mã rớt</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Chỉ hiển thị mã không trúng thầu, xếp theo gói và nhóm theo mã quản lý.
          Mã trúng thầu không xuất hiện ở màn hình này.
        </p>
      </div>

      {laPdd && (
        moTao ? (
          <div className="space-y-3 rounded-lg border border-teal-200 bg-white p-3">
            <div className="grid gap-2 md:grid-cols-2">
              <input value={formGoi.ten}
                onChange={(e) => setFormGoi((p) => ({ ...p, ten: e.target.value }))}
                placeholder="Tên gói thầu"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <select value={formGoi.loai}
                onChange={(e) => setFormGoi((p) => ({ ...p, loai: e.target.value, dotId: "" }))}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="dau_thau_rong_rai">Gói 18 tháng</option>
                <option value="mua_sam_bo_sung">Gói bổ sung</option>
                <option value="chi_dinh_thau">Gói chỉ định thầu</option>
              </select>
              <select value={formGoi.dotId}
                onChange={(e) => setFormGoi((p) => ({ ...p, dotId: e.target.value }))}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2">
                <option value="">— Chọn đợt đề xuất nguồn —</option>
                {dotTheoLoai.map((d) => <option key={d.id} value={d.id}>{nhanDot(d)}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={taoGoi} className="rounded-md bg-teal-700 px-3 py-1.5 text-xs font-medium text-white">Tạo gói</button>
              <button onClick={() => setMoTao(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600">Hủy</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setMoTao(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-teal-300 px-3 py-1.5 text-xs text-teal-800 hover:bg-teal-50">
            <Plus size={13} /> Tạo gói theo dõi
          </button>
        )
      )}

      {loi && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {loi}
        </div>
      )}
      {thongBao && (
        <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">
          <CheckCircle2 size={15} /> {thongBao}
        </div>
      )}

      {goiHienThi.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
          {laPdd ? "Chưa có gói thầu nào để theo dõi." : "Khoa chưa có mã nào bị rớt thầu."}
        </div>
      ) : goiHienThi.map((g) => {
        const rows = kqTheoGoi.get(g.id) || [];
        const nhomRot = gomMaRot(rows);
        const dangMo = goiMo === g.id;
        const demTheoMoc = Object.fromEntries(GIAI_DOAN.map((m) => [
          m.ma,
          new Set(rows.filter((r) => r.ma_moc_rot === m.ma).map((r) => r.ma_hang)).size,
        ]));
        return (
          <section key={g.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-start">
              <button type="button" onClick={() => setGoiMo(dangMo ? null : g.id)}
                className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left hover:bg-slate-50">
                {dangMo ? <ChevronDown size={16} className="mt-0.5 text-slate-400" />
                         : <ChevronRight size={16} className="mt-0.5 text-slate-400" />}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium uppercase tracking-wide text-sky-700">{NHAN_LOAI_GOI[g.loai_mua_sam]}</div>
                  <div className="truncate text-sm font-semibold text-slate-800">{g.ten_goi}</div>
                  <div className="mt-0.5 text-xs text-slate-400">năm {g.nam} · {new Set(rows.map((r) => r.ma_hang)).size} mã rớt</div>
                </div>
                <XCircle size={18} className="mt-1 shrink-0 text-red-500" />
              </button>
              {laPdd && (
                <NutXoaDuLieuTest
                  loai="goi_thau_tien_do"
                  id={g.id}
                  compact
                  className="mr-3 mt-3 shrink-0"
                  nhan="Xóa gói thầu test"
                  moTa={`gói ${g.ten_goi}, gồm toàn bộ mốc và kết quả mã hàng trong gói`}
                  onDaXoa={() => {
                    setGoi((cu) => cu.filter((x) => x.id !== g.id));
                    setKetQua((cu) => cu.filter((x) => x.goi_id !== g.id));
                    if (goiMo === g.id) setGoiMo(null);
                  }}
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-px border-y border-slate-100 bg-slate-100">
              {GIAI_DOAN.map((m) => (
                <div key={m.ma} className="bg-white px-3 py-2 text-center">
                  <div className={`mx-auto mb-1 h-1.5 max-w-24 rounded-full ${demTheoMoc[m.ma] ? "bg-red-500" : "bg-slate-200"}`} />
                  <div className="text-xs font-medium text-slate-700">{m.ten}</div>
                  <div className="text-[11px] text-slate-400">{demTheoMoc[m.ma]} mã rớt</div>
                </div>
              ))}
            </div>

            {dangMo && (
              <div>
                {laPdd && (
                  <div className="border-b border-slate-100 p-3">
                    {dangChonMa === g.id ? (
                      <div className="space-y-2 rounded-lg border border-red-200 bg-red-50/40 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-red-800">Chọn mã hàng bị rớt</p>
                          <button onClick={() => setDangChonMa(null)} className="text-xs text-slate-500">Đóng</button>
                        </div>
                        {!formRot.maHang ? (
                          <>
                            <div className="relative">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input value={timMa} onChange={(e) => setTimMa(e.target.value)}
                                placeholder="Tìm mã hàng, tên vật tư hoặc mã quản lý"
                                className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm" />
                            </div>
                            <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-200 bg-white">
                              {ungVien.map((x) => (
                                <button key={x.ma_hang} type="button"
                                  onClick={() => setFormRot((p) => ({ ...p, maHang: x.ma_hang }))}
                                  className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-slate-50">
                                  <span className="font-mono text-xs text-blue-700">{x.ma_hang}</span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-xs text-slate-700">{x.ten_vat_tu}</span>
                                    <span className="block text-[11px] text-slate-400">{x.ma_quan_ly} · {x.soKhoa} ĐVSD · tổng {fmt(x.tongSoLuong)} {x.dvt}</span>
                                  </span>
                                </button>
                              ))}
                              {ungVien.length === 0 && <p className="p-3 text-xs text-slate-400">Không có mã đề xuất phù hợp hoặc các mã đã được đánh dấu rớt.</p>}
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm">
                              <span className="font-mono text-blue-700">{formRot.maHang}</span>
                              <button onClick={() => setFormRot((p) => ({ ...p, maHang: "" }))}
                                className="ml-auto text-xs text-slate-400">Chọn lại</button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {GIAI_DOAN.map((m) => (
                                <button key={m.ma} onClick={() => setFormRot((p) => ({ ...p, moc: m.ma }))}
                                  className={`rounded-md border px-3 py-1.5 text-xs ${
                                    formRot.moc === m.ma ? "border-red-600 bg-red-600 text-white" : "border-slate-300 bg-white text-slate-600"
                                  }`}>
                                  Rớt ở {m.ten}
                                </button>
                              ))}
                            </div>
                            <textarea rows={2} value={formRot.lyDo}
                              onChange={(e) => setFormRot((p) => ({ ...p, lyDo: e.target.value }))}
                              placeholder="Lý do rớt thầu (bắt buộc)"
                              className="w-full rounded-md border border-red-300 px-3 py-2 text-sm" />
                            <button onClick={() => luuMaRot(g)} disabled={dangLuuRot}
                              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40">
                              {dangLuuRot ? "Đang chuyển về các ĐVSD…" : "Xác nhận mã rớt"}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => {
                        setDangChonMa(g.id);
                        setFormRot({ maHang: "", moc: "chao_gia", lyDo: "" });
                        setTimMa("");
                      }} className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50">
                        <Plus size={13} /> Chọn mã rớt thầu
                      </button>
                    )}
                  </div>
                )}

                {nhomRot.length === 0 ? (
                  <p className="p-5 text-center text-sm text-slate-400">
                    Chưa có mã nào được PĐD đánh dấu rớt trong gói này.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {nhomRot.map((n) => (
                      <div key={n.ma}>
                        <div className="bg-slate-50 px-4 py-2">
                          <span className="font-mono text-xs font-semibold text-blue-700">{n.ma}</span>
                          <span className="ml-2 text-xs text-slate-600">{n.ten}</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {n.maHang.map((r) => {
                            const k = keyMa(r.goi_id, r.ma_hang);
                            const dotId = dotBoSungChon[k] || dotBoSungMo[0]?.id || "";
                            return (
                              <div key={r.ma_hang} className="flex flex-wrap items-start gap-3 px-4 py-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-semibold text-red-700">{r.ma_hang}</span>
                                    <span className="text-sm text-slate-800">{r.ten_vat_tu}</span>
                                  </div>
                                  <p className="mt-1 text-xs text-red-700">
                                    Rớt ở {NHAN_GIAI_DOAN[r.ma_moc_rot] || r.ma_moc_rot}
                                    {r.ly_do_khong_trung ? ` · ${r.ly_do_khong_trung}` : ""}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-slate-400">
                                    {laPdd
                                      ? `${r.donVi.length} ĐVSD · tổng đề xuất ${fmt(r.tongSoLuong)} ${r.dvt}`
                                      : `Số lượng khoa đã đề xuất: ${fmt(r.so_luong_de_xuat)} ${r.dvt}`}
                                  </p>
                                </div>

                                {!laPdd && (
                                  <div className="flex flex-wrap items-center justify-end gap-2">
                                    <select value={dotId}
                                      onChange={(e) => setDotBoSungChon((p) => ({ ...p, [k]: Number(e.target.value) }))}
                                      disabled={dotBoSungMo.length === 0}
                                      className="rounded-md border border-slate-300 px-2 py-1.5 text-xs disabled:bg-slate-50">
                                      {dotBoSungMo.length === 0
                                        ? <option value="">Chưa có gói bổ sung đang mở</option>
                                        : dotBoSungMo.map((d) => <option key={d.id} value={d.id}>{nhanDot(d)}</option>)}
                                    </select>
                                    <button onClick={() => chuyenVaoGioBoSung(r)}
                                      disabled={!dotId || dangChuyen === k}
                                      className="inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-800 disabled:opacity-40">
                                      <PackagePlus size={13} />
                                      {dangChuyen === k ? "Đang chuyển…" : "Thêm vào gói bổ sung"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
