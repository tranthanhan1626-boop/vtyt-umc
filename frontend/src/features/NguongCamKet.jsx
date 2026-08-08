import { useMemo, useState } from "react";
import { Plus, Trash2, SlidersHorizontal, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "../supabaseClient";

// PĐD chỉnh ngưỡng cam kết ngay trên web (bảng `moc_cam_ket_su_dung`).
//
// Vì sao để sửa được: 20/50/80 là con số THƯƠNG LƯỢNG trong Bản cam kết, không
// phải hằng số kỹ thuật. Kỳ sau đổi thành 25/55/85 thì phải đổi được trong 30
// giây, không phải chờ sửa code.
//
// Đổi ngưỡng KHÔNG sửa gì trong dữ liệu tiến độ — `v_tien_do_su_dung` tính lại
// từ đầu mỗi lần đọc. Vì vậy đổi rồi là mọi mã tự chấm lại ngay, và đổi nhầm
// thì sửa lại là xong, không mất gì.
//
// Chặn thật ở DB: policy "PĐD sửa mốc cam kết" — ĐVSD gọi thẳng API cũng bị RLS
// chặn, không chỉ ẩn nút.

const trong = () => ({ thang_thu: "", ty_le: "", ghi_chu: "", moi: true });

export default function NguongCamKet({ moc, onLuuXong }) {
  const [mo, setMo] = useState(false);
  const [nhap, setNhap] = useState([]);
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState("");

  const batDauSua = () => {
    setNhap(moc.map((m) => ({
      thang_thu: String(m.thang_thu),
      ty_le: String(Math.round(Number(m.ty_le_toi_thieu) * 1000) / 10),
      ghi_chu: m.ghi_chu || "",
      goc: m.thang_thu,
    })));
    setLoi("");
    setMo(true);
  };

  const doi = (i, k, v) => setNhap((p) => p.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  const thayDoi = useMemo(() => {
    if (nhap.length !== moc.length) return true;
    return nhap.some((r) => {
      const g = moc.find((m) => m.thang_thu === r.goc);
      if (!g) return true;
      return Number(r.thang_thu) !== g.thang_thu
        || Math.abs(Number(r.ty_le) / 100 - Number(g.ty_le_toi_thieu)) > 1e-9
        || (r.ghi_chu || "") !== (g.ghi_chu || "");
    });
  }, [nhap, moc]);

  const luu = async () => {
    const ds = nhap.map((r) => ({
      thang_thu: Number(r.thang_thu),
      ty_le_toi_thieu: Number(r.ty_le) / 100,
      ghi_chu: r.ghi_chu?.trim() || null,
    }));

    for (const r of ds) {
      if (!Number.isInteger(r.thang_thu) || r.thang_thu < 1 || r.thang_thu > 120) {
        return setLoi("Tháng thứ phải là số nguyên từ 1 đến 120.");
      }
      if (!(r.ty_le_toi_thieu > 0) || r.ty_le_toi_thieu > 1) {
        return setLoi("Tỷ lệ phải lớn hơn 0 và không quá 100%.");
      }
    }
    if (new Set(ds.map((r) => r.thang_thu)).size !== ds.length) {
      return setLoi("Có hai mốc trùng cùng một tháng.");
    }
    // Mốc sau phải cao hơn mốc trước — nếu không, mã đạt mốc 12 tháng lại bị
    // chấm là chậm khi tới mốc 18 tháng thấp hơn, người dùng không hiểu nổi.
    const sap = [...ds].sort((a, b) => a.thang_thu - b.thang_thu);
    for (let i = 1; i < sap.length; i++) {
      if (sap[i].ty_le_toi_thieu <= sap[i - 1].ty_le_toi_thieu) {
        return setLoi(`Mốc tháng ${sap[i].thang_thu} phải cao hơn mốc tháng ${sap[i - 1].thang_thu}.`);
      }
    }

    setDangLuu(true);
    setLoi("");
    // Xoá trước: mốc bị bỏ hoặc bị đổi số tháng (đổi số tháng = đổi khoá chính).
    const giu = ds.map((r) => r.thang_thu);
    const boDi = moc.map((m) => m.thang_thu).filter((t) => !giu.includes(t));
    // RLS chặn ÂM THẦM: không đủ quyền thì trả 200/204 với 0 dòng, không báo lỗi
    // (CLAUDE.md bẫy 5.5). Phải kiểm `count`, đừng tin mỗi error === null.
    const hong = (m) => { setDangLuu(false); setLoi(m); };
    if (boDi.length) {
      const { error, count } = await supabase.from("moc_cam_ket_su_dung")
        .delete({ count: "exact" }).in("thang_thu", boDi);
      if (error) return hong(error.message);
      if (!count) return hong("Không xoá được mốc nào — tài khoản này không có quyền sửa ngưỡng.");
    }
    if (ds.length) {
      const { error, count } = await supabase.from("moc_cam_ket_su_dung")
        .upsert(ds, { onConflict: "thang_thu", count: "exact" });
      if (error) return hong(error.message);
      if (!count) return hong("Không lưu được — tài khoản này không có quyền sửa ngưỡng.");
    }
    setDangLuu(false);
    setMo(false);
    await onLuuXong?.();
  };

  if (!mo) {
    return (
      <button onClick={batDauSua}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50">
        <SlidersHorizontal size={14} />
        Chỉnh ngưỡng cam kết
        <ChevronRight size={13} className="text-slate-400" />
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <ChevronDown size={14} className="text-slate-400" />
        <p className="text-sm font-semibold text-slate-800">Ngưỡng cam kết sử dụng</p>
      </div>
      <p className="mb-2.5 text-xs text-slate-500">
        Đổi ở đây là mọi mã được chấm lại ngay — không sửa dữ liệu nào, chỉ đổi thước đo.
        Ngưỡng của mốc sau phải cao hơn mốc trước.
      </p>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="w-28 pb-1 font-medium">Tháng thứ</th>
            <th className="w-28 pb-1 font-medium">Phải đạt</th>
            <th className="pb-1 font-medium">Ghi chú</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {nhap.map((r, i) => (
            <tr key={i}>
              <td className="py-1 pr-2">
                <input type="number" min="1" max="120" value={r.thang_thu}
                  onChange={(e) => doi(i, "thang_thu", e.target.value)}
                  className="w-24 rounded-md border border-slate-300 px-2 py-1 tabular-nums" />
              </td>
              <td className="py-1 pr-2">
                <div className="flex items-center gap-1">
                  <input type="number" min="1" max="100" step="1" value={r.ty_le}
                    onChange={(e) => doi(i, "ty_le", e.target.value)}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1 tabular-nums" />
                  <span className="text-slate-500">%</span>
                </div>
              </td>
              <td className="py-1 pr-2">
                <input type="text" value={r.ghi_chu} placeholder="Không bắt buộc"
                  onChange={(e) => doi(i, "ghi_chu", e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2 py-1" />
              </td>
              <td className="py-1">
                <button onClick={() => setNhap((p) => p.filter((_, j) => j !== i))}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Bỏ mốc này">
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={() => setNhap((p) => [...p, trong()])}
        className="mt-2 inline-flex items-center gap-1 text-sm text-umc-800 hover:underline">
        <Plus size={14} /> Thêm mốc
      </button>

      {nhap.length === 0 && (
        <p className="mt-2 text-xs text-amber-700">
          Không còn mốc nào — lưu như vậy là <b>tắt hẳn việc chấm tiến độ</b>, không mã nào bị
          báo chậm nữa.
        </p>
      )}
      {loi && <p className="mt-2 text-xs font-medium text-red-700">{loi}</p>}

      <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
        <button onClick={luu} disabled={dangLuu || !thayDoi}
          className="rounded-md bg-umc-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-umc-800 disabled:opacity-40">
          {dangLuu ? "Đang lưu..." : "Lưu ngưỡng"}
        </button>
        <button onClick={() => { setMo(false); setLoi(""); }} disabled={dangLuu}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
          Huỷ
        </button>
      </div>
    </div>
  );
}
