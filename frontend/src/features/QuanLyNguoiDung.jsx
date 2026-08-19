import { useCallback, useEffect, useMemo, useState } from "react";
import { Save, Search, ShieldCheck, UserCog } from "lucide-react";
import { supabase } from "../supabaseClient";

const NHAN_QUYEN = { dvsd: "Đơn vị sử dụng", dieu_duong: "Phòng Điều dưỡng", admin: "Quản trị" };

export default function QuanLyNguoiDung({ profile }) {
  const [rows, setRows] = useState([]);
  const [dsKhoa, setDsKhoa] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [tim, setTim] = useState("");
  const [dangSua, setDangSua] = useState(null);
  const [form, setForm] = useState(null);
  const [loi, setLoi] = useState("");
  const [thongBao, setThongBao] = useState("");

  const tai = useCallback(async () => {
    setDangTai(true); setLoi("");
    const [u, k] = await Promise.all([
      supabase.from("users").select("id,email,ho_ten,role,khoa,created_at").order("email"),
      supabase.from("v_don_vi").select("don_vi").order("don_vi"),
    ]);
    if (u.error) setLoi(u.error.message); else setRows(u.data || []);
    setDsKhoa((k.data || []).map((x) => x.don_vi));
    setDangTai(false);
  }, []);
  useEffect(() => { tai(); }, [tai]);

  const hien = useMemo(() => {
    const q = tim.trim().toLowerCase();
    return rows.filter((r) => !q || `${r.email} ${r.ho_ten || ""} ${r.khoa || ""}`.toLowerCase().includes(q));
  }, [rows, tim]);

  const moSua = (r) => {
    setDangSua(r.email); setForm({ ho_ten: r.ho_ten || "", role: r.role, khoa: r.khoa || "" });
    setLoi(""); setThongBao("");
  };
  const luu = async (r) => {
    if (form.role === "dvsd" && !form.khoa) { setLoi("Tài khoản ĐVSD phải có khoa."); return; }
    if (r.email === profile.email && form.role !== r.role) {
      setLoi("Không được tự đổi quyền tài khoản đang đăng nhập."); return;
    }
    const { error, count } = await supabase.from("users").update({
      ho_ten: form.ho_ten.trim() || null, role: form.role,
      khoa: form.role === "dvsd" ? form.khoa : null,
    }, { count: "exact" }).eq("id", r.id);
    if (error || !count) { setLoi(error?.message || "Không cập nhật được tài khoản."); return; }
    setThongBao(`Đã cập nhật ${r.email}.`); setDangSua(null); setForm(null); await tai();
  };

  // QĐ 15 (17/08/2026): PĐD = admin, cùng quyền. Chặn theo đúng tập vai trò
  // mà RLS `users` cho phép, nếu không màn này khoá người PĐD ra ngoài dù
  // database đã mở.
  if (!["admin", "dieu_duong"].includes(profile.role)) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Chỉ Phòng Điều dưỡng và quản trị hệ thống được phân quyền tài khoản.</div>;
  if (dangTai) return <p className="text-sm text-slate-500">Đang tải người dùng…</p>;

  return <div className="space-y-4">
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start gap-3"><span className="rounded-lg bg-umc-700 p-2 text-white"><UserCog size={18} /></span>
        <div className="mr-auto"><h2 className="font-semibold text-slate-800">Quản trị người dùng</h2>
          <p className="mt-1 text-xs text-slate-500">Gán họ tên, khoa và vai trò cho tài khoản đã tồn tại. Việc tạo/xóa tài khoản đăng nhập vẫn thực hiện qua Supabase Auth.</p></div>
        <label className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm email, tên, khoa"
            className="w-64 rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs" /></label>
      </div>
      {loi && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700">{loi}</p>}
      {thongBao && <p className="mt-3 rounded bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{thongBao}</p>}
    </div>

    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[850px] text-sm">
      <thead className="bg-slate-100 text-xs text-slate-500"><tr><th className="px-4 py-2 text-left">Email</th><th className="px-3 py-2 text-left">Họ tên</th>
        <th className="px-3 py-2 text-left">Vai trò</th><th className="px-3 py-2 text-left">Khoa</th><th className="px-4 py-2 text-right">Thao tác</th></tr></thead>
      <tbody>{hien.map((r) => { const sua = dangSua === r.email; return <tr key={r.id} className="border-t border-slate-100">
        <td className="px-4 py-2"><span className="font-medium text-slate-800">{r.email}</span>{r.email === profile.email && <span className="ml-2 rounded bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">Bạn</span>}</td>
        <td className="px-3 py-2">{sua ? <input value={form.ho_ten} onChange={(e) => setForm((p) => ({ ...p, ho_ten: e.target.value }))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs" /> : (r.ho_ten || "—")}</td>
        <td className="px-3 py-2">{sua ? <select value={form.role} disabled={r.email === profile.email}
          onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="rounded border border-slate-300 bg-white px-2 py-1.5 text-xs">
          {Object.entries(NHAN_QUYEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          : <span className="inline-flex items-center gap-1"><ShieldCheck size={13} className="text-umc-600" />{NHAN_QUYEN[r.role] || r.role}</span>}</td>
        <td className="px-3 py-2">{sua && form.role === "dvsd" ? <select value={form.khoa} onChange={(e) => setForm((p) => ({ ...p, khoa: e.target.value }))}
          className="max-w-64 rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"><option value="">— chọn khoa —</option>{dsKhoa.map((k) => <option key={k}>{k}</option>)}</select> : (r.khoa || "—")}</td>
        <td className="px-4 py-2 text-right">{sua ? <div className="flex justify-end gap-2"><button onClick={() => { setDangSua(null); setForm(null); }} className="rounded border border-slate-300 px-2 py-1 text-xs">Hủy</button>
          <button onClick={() => luu(r)} className="inline-flex items-center gap-1 rounded bg-umc-700 px-2 py-1 text-xs text-white"><Save size={12} />Lưu</button></div>
          : <button onClick={() => moSua(r)} className="rounded border border-umc-300 px-2 py-1 text-xs text-umc-700">Chỉnh sửa</button>}</td>
      </tr>; })}</tbody>
    </table></div>
  </div>;
}
