import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, PackagePlus, Search } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";

const NHAN_LOAI = {
  dau_thau_rong_rai: "Gói 18 tháng",
  mua_sam_bo_sung: "Gói bổ sung",
};

const khoaDong = (r) => `${r.phien_trinh_ky_id}|${r.khoa}|${r.ma_quan_ly}`;
const khoaGoi = (r) => `${r.phien_trinh_ky_id}|${r.dot_goi_id}`;
const nhanThoiGian = (g) => g.thang_moc ? `tháng ${g.thang_moc}/${g.nam}` : `năm ${g.nam}`;

/**
 * Quyền mua thêm V3 chỉ hình thành từ revision trình ký chính thức. Một dòng
 * là một khoa × mã quản lý; trần = floor(30% tổng số trúng đã phân bổ).
 */
export default function GoiTuyChonMuaThem({ profile }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState("");
  const [loaiLoc, setLoaiLoc] = useState("");
  const [timGoi, setTimGoi] = useState("");
  const [goiChon, setGoiChon] = useState("");
  const [timMa, setTimMa] = useState("");
  const [khoaLoc, setKhoaLoc] = useState("");
  const [soNhap, setSoNhap] = useState({});
  const [loiDong, setLoiDong] = useState({});
  const [dangLuu, setDangLuu] = useState("");
  const [thongBao, setThongBao] = useState("");
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";

  const tai = useCallback(async () => {
    setLoading(true); setLoi("");
    const res = await fetchAllRows((f, t) => supabase
      .from("v_tuy_chon_mua_them_30_v3").select("*")
      .order("nam", { ascending: false }).order("thang_moc", { ascending: false })
      .range(f, t), { order: ["phien_trinh_ky_id", "khoa", "ma_quan_ly"] });
    if (res.error) {
      setLoi(`Không đọc được hạn mức mua thêm từ revision trình ký: ${res.error.message}`);
      setRows([]);
    } else {
      // Chỉ hai loại gói này có điều khoản tùy chọn mua thêm 30%.
      setRows((res.data || []).filter((r) =>
        r.loai_mua_sam === "dau_thau_rong_rai" || r.loai_mua_sam === "mua_sam_bo_sung"));
    }
    setLoading(false);
  }, []);
  useEffect(() => { tai(); }, [tai]);

  const goi = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      const key = khoaGoi(r);
      if (!m.has(key)) m.set(key, {
        key, phien: r.phien_trinh_ky_id, revision: r.revision,
        ten: r.ten_dot, goiId: r.goi_id, loai: r.loai_mua_sam,
        nam: r.nam, thang_moc: r.thang_moc, chot_luc: r.chot_luc, rows: [],
      });
      m.get(key).rows.push(r);
    });
    return [...m.values()];
  }, [rows]);

  const goiLoc = useMemo(() => {
    const q = timGoi.trim().toLowerCase();
    return goi.filter((g) => (!loaiLoc || g.loai === loaiLoc)
      && (!q || `${g.ten} ${g.goiId} ${nhanThoiGian(g)}`.toLowerCase().includes(q)));
  }, [goi, loaiLoc, timGoi]);
  const dangChon = goi.find((g) => g.key === goiChon) || null;
  const dsKhoa = useMemo(() => [...new Set((dangChon?.rows || []).map((r) => r.khoa))]
    .sort((a, b) => a.localeCompare(b, "vi")), [dangChon]);
  const chiTiet = useMemo(() => {
    const q = timMa.trim().toLowerCase();
    return (dangChon?.rows || []).filter((r) => (!khoaLoc || r.khoa === khoaLoc)
      && (!q || `${r.ma_quan_ly} ${r.ten_quan_ly || ""} ${r.ten_dai_dien || ""}`
        .toLowerCase().includes(q)))
      .sort((a, b) => a.khoa.localeCompare(b.khoa, "vi")
        || a.ma_quan_ly.localeCompare(b.ma_quan_ly, "vi"));
  }, [dangChon, khoaLoc, timMa]);

  const kichHoat = async (r) => {
    const key = khoaDong(r); const so = Number(soNhap[key]); const con = Number(r.con_lai) || 0;
    if (!Number.isInteger(so) || so <= 0) {
      setLoiDong((p) => ({ ...p, [key]: "Nhập số nguyên lớn hơn 0." })); return;
    }
    if (so > con) {
      setLoiDong((p) => ({ ...p, [key]: `Không được vượt số còn lại ${fmt(con)}.` })); return;
    }
    setDangLuu(key); setThongBao(""); setLoiDong((p) => ({ ...p, [key]: "" }));
    const { error } = await supabase.rpc("kich_hoat_tuy_chon_mua_them_30_v3", {
      p_phien_trinh_ky_id: r.phien_trinh_ky_id,
      p_khoa: r.khoa, p_ma_quan_ly: r.ma_quan_ly, p_so_luong: so,
    });
    setDangLuu("");
    if (error) { setLoiDong((p) => ({ ...p, [key]: error.message })); return; }
    setSoNhap((p) => ({ ...p, [key]: "" }));
    setThongBao(`Đã kích hoạt ${fmt(so)} cho ${r.khoa} · mã quản lý ${r.ma_quan_ly}.`);
    await tai();
  };

  if (loading) return <div className="p-4 text-sm text-slate-400">Đang tải hạn mức từ revision trình ký…</div>;
  if (loi) return <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loi}</div>;

  return <div className="space-y-5">
    <div className="rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-white p-4">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-sky-700 p-2 text-white"><PackagePlus size={19} /></span>
        <div>
          <h2 className="font-semibold text-slate-800">Gói tùy chọn mua thêm</h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">
            Chỉ hiển thị gói đã có revision trình ký chính thức. Trần mỗi khoa × mã quản lý bằng
            <b> 30% tổng số trúng đã phân bổ, luôn làm tròn xuống</b>. Số đã kích hoạt được giữ xuyên các revision.
          </p>
        </div>
      </div>
    </div>

    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="text-xs text-slate-500">Loại gói
          <select value={loaiLoc} onChange={(e) => setLoaiLoc(e.target.value)}
            className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">Tất cả</option><option value="dau_thau_rong_rai">Gói 18 tháng</option>
            <option value="mua_sam_bo_sung">Gói bổ sung</option>
          </select>
        </label>
        <label className="min-w-64 flex-1 text-xs text-slate-500">Tìm gói
          <span className="relative mt-1 block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={timGoi} onChange={(e) => setTimGoi(e.target.value)} placeholder="Tên đợt hoặc gói con"
              className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm" /></span>
        </label>
      </div>
      {goiLoc.length === 0 ? <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
        Chưa có revision trình ký chính thức nào phát sinh hạn mức mua thêm.
      </p> : <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{goiLoc.map((g) => {
        const mo = g.key === goiChon;
        const tran = g.rows.reduce((s, r) => s + Number(r.tran_mua_them_30 || 0), 0);
        const da = g.rows.reduce((s, r) => s + Number(r.da_kich_hoat || 0), 0);
        return <button key={g.key} onClick={() => setGoiChon(mo ? "" : g.key)}
          className={`rounded-lg border p-3 text-left ${mo ? "border-sky-500 bg-sky-50 ring-1 ring-sky-500" : "border-slate-200 hover:bg-slate-50"}`}>
          <div className="flex gap-2"><ChevronRight size={15} className={`mt-0.5 text-sky-700 ${mo ? "rotate-90" : ""}`} />
            <div className="min-w-0"><p className="text-[10px] font-bold uppercase text-sky-700">{NHAN_LOAI[g.loai]} · REVISION {g.revision}</p>
              <p className="truncate text-sm font-semibold text-slate-800">{g.ten} · {g.goiId}</p>
              <p className="text-xs text-slate-500">{nhanThoiGian(g)} · {g.rows.length} hạn mức</p>
              <p className="mt-2 text-[11px] text-slate-600">Trần <b>{fmt(tran)}</b> · Đã kích hoạt <b className="text-emerald-700">{fmt(da)}</b></p>
            </div></div>
        </button>;
      })}</div>}
    </section>

    {dangChon && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 bg-slate-50 p-4">
        <div className="mr-auto"><p className="text-[10px] font-bold uppercase text-sky-700">Bản chính thức · Revision {dangChon.revision}</p>
          <h3 className="font-semibold text-slate-800">{dangChon.ten} · {dangChon.goiId}</h3></div>
        {laPdd && <select value={khoaLoc} onChange={(e) => setKhoaLoc(e.target.value)} className="rounded border border-slate-300 bg-white px-3 py-2 text-xs">
          <option value="">Tất cả khoa</option>{dsKhoa.map((k) => <option key={k}>{k}</option>)}</select>}
        <span className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={timMa} onChange={(e) => setTimMa(e.target.value)} placeholder="Mã quản lý / tên nhóm"
            className="w-64 rounded border border-slate-300 py-2 pl-9 pr-3 text-xs" /></span>
      </div>
      {thongBao && <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800"><CheckCircle2 size={15} />{thongBao}</div>}
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm">
        <thead className="bg-slate-100 text-xs text-slate-500"><tr><th className="px-4 py-2 text-left">Khoa</th>
          <th className="px-3 py-2 text-left">Mã quản lý</th><th className="px-3 py-2 text-right">Số trúng</th>
          <th className="px-3 py-2 text-right">Trần 30%</th><th className="px-3 py-2 text-right">Đã dùng</th>
          <th className="px-3 py-2 text-right">Còn lại</th><th className="px-4 py-2 text-left">Kích hoạt</th></tr></thead>
        <tbody>{chiTiet.map((r) => { const key = khoaDong(r); const con = Number(r.con_lai) || 0; return <tr key={key} className="border-t border-slate-100">
          <td className="px-4 py-2 text-xs font-medium text-slate-700">{r.khoa}</td>
          <td className="px-3 py-2"><p className="font-mono text-xs font-semibold text-blue-700">{r.ma_quan_ly}</p>
            <p className="max-w-sm text-xs text-slate-500">{r.ten_quan_ly || r.ten_dai_dien}</p></td>
          <td className="px-3 py-2 text-right font-mono">{fmt(r.so_luong_trung)}</td>
          <td className="px-3 py-2 text-right font-mono font-semibold text-sky-800">{fmt(r.tran_mua_them_30)}</td>
          <td className="px-3 py-2 text-right font-mono text-emerald-700">{fmt(r.da_kich_hoat)}</td>
          <td className="px-3 py-2 text-right font-mono">{fmt(con)}</td>
          <td className="px-4 py-2"><div className="flex gap-2"><input type="number" min="1" max={con} step="1"
            value={soNhap[key] || ""} onChange={(e) => setSoNhap((p) => ({ ...p, [key]: e.target.value }))}
            disabled={con <= 0} placeholder={con > 0 ? `tối đa ${fmt(con)}` : "đã dùng hết"}
            className="w-32 rounded border border-slate-300 px-2 py-1.5 text-right font-mono text-xs disabled:bg-slate-50" />
            <button onClick={() => kichHoat(r)} disabled={con <= 0 || dangLuu === key}
              className="rounded bg-sky-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-35">{dangLuu === key ? "Đang lưu…" : "Kích hoạt"}</button></div>
            {loiDong[key] && <p className="mt-1 text-[10px] text-red-600">{loiDong[key]}</p>}
            {r.kich_hoat_gan_nhat && <p className="mt-1 text-[10px] text-slate-400">Gần nhất: {new Date(r.kich_hoat_gan_nhat).toLocaleString("vi-VN")}</p>}
          </td></tr>; })}</tbody>
      </table></div>
    </section>}
  </div>;
}
