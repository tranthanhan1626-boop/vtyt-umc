import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Layers, RotateCcw, Search } from "lucide-react";
import { fetchAllRows, supabase } from "../supabaseClient";
import { GOI_CON } from "./KhungGoiThau";

// Giai đoạn 1, bước 3 của workflow v3 — "PĐD phân mã quản lý vào từng gói con".
//
// Cấp thao tác là MÃ QUẢN LÝ chứ không phải mã hàng. Quy tắc phân gói nói
// "tất cả mã hàng thuộc mã quản lý phải nằm cùng gói con" (invariant 2), nên
// nếu để sửa lẻ từng mã hàng thì invariant vỡ ngay ở lần sửa đầu tiên. RPC
// `gan_goi_con_ma_quan_ly_v3` ghi cả cụm trong một lệnh và chặn ở server khi
// mã đã nằm trong snapshot Q đang hiệu lực (sau chốt Q thì phạm vi đã khóa).

// Nhãn gói con lấy từ `goi_con.goi` của gói 18 tháng — cùng chuỗi đang lưu ở
// `vat_tu.goi`, không phải goi_id.
const NHAN_GOI = {
  "18t-dung-chung": "Dùng chung",
  "18t-gmhs": "GMHS",
  "18t-rhm": "Răng Hàm Mặt",
  "18t-tim-mach": "Tim mạch",
  "18t-ctch-ntk": "CTCH-NTK",
};
const DS_GOI = (GOI_CON.dau_thau_rong_rai || []).map((g) => NHAN_GOI[g.ma]).filter(Boolean);

const LOC = [
  { ma: "can_xu_ly", nhan: "Cần xử lý" },
  { ma: "chua_phan", nhan: "Chưa phân gói" },
  { ma: "vat_ngang", nhan: "Vắt ngang nhiều gói" },
  { ma: "tat_ca", nhan: "Tất cả" },
];

export default function PhanGoiConMaQuanLy() {
  const [rows, setRows] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [loc, setLoc] = useState("can_xu_ly");
  const [tim, setTim] = useState("");
  const [dangLuu, setDangLuu] = useState("");
  const [vuaLuu, setVuaLuu] = useState({});

  const tai = useCallback(async () => {
    setDangTai(true);
    setLoi("");
    // View gom sẵn theo mã quản lý; đọc thẳng bảng vat_tu 3.327 dòng rồi gom ở
    // trình duyệt vừa tốn băng thông vừa lệch với cờ can_xu_ly của server.
    //
    // Phải phân trang: PostgREST cắt cứng ở 1.000 dòng bất kể `.limit()` lớn
    // hơn, mà danh mục có hơn 1.000 mã quản lý — không phân trang thì ba ô
    // đếm ở đầu màn đếm thiếu một cách âm thầm.
    const { data, error } = await fetchAllRows(
      (f, t) => supabase.from("v_phan_goi_ma_quan_ly").select("*").range(f, t),
      { order: "ma_quan_ly" },
    );
    if (error) setLoi(error.message);
    else setRows(data || []);
    setDangTai(false);
  }, []);

  useEffect(() => { tai(); }, [tai]);

  const thongKe = useMemo(() => ({
    tong: rows.length,
    chuaPhan: rows.filter((r) => Number(r.so_ma_chua_phan) > 0).length,
    vatNgang: rows.filter((r) => Number(r.so_goi_khac_nhau) > 1).length,
  }), [rows]);

  const hienThi = useMemo(() => {
    const tuKhoa = tim.trim().toLowerCase();
    return rows.filter((r) => {
      // Dòng vừa lưu xong được giữ lại vài giây dù đã hết khớp bộ lọc —
      // nếu không, bấm xong là dòng biến mất và người dùng không kịp thấy
      // dấu tích xác nhận, không biết lệnh đã ăn hay chưa.
      if (vuaLuu[r.ma_quan_ly]) return true;
      if (loc === "can_xu_ly" && !r.can_xu_ly) return false;
      if (loc === "chua_phan" && !(Number(r.so_ma_chua_phan) > 0)) return false;
      if (loc === "vat_ngang" && !(Number(r.so_goi_khac_nhau) > 1)) return false;
      if (!tuKhoa) return true;
      return `${r.ma_quan_ly} ${r.ten_quan_ly || ""}`.toLowerCase().includes(tuKhoa);
    });
  }, [rows, loc, tim, vuaLuu]);

  const gan = async (ma, goi) => {
    setLoi("");
    setDangLuu(ma);
    const { error } = await supabase.rpc("gan_goi_con_ma_quan_ly_v3", {
      p_ma_quan_ly: ma,
      p_goi: goi || null,
    });
    setDangLuu("");
    if (error) { setLoi(`${ma}: ${error.message}`); return; }
    // Cập nhật tại chỗ để dòng không nhảy khỏi bộ lọc ngay khi vừa bấm —
    // người dùng cần thấy dấu tích xác nhận trước khi dòng biến mất.
    setRows((p) => p.map((r) => r.ma_quan_ly === ma
      ? { ...r, goi_dai_dien: goi || null, so_goi_khac_nhau: goi ? 1 : 0,
          so_ma_chua_phan: goi ? 0 : Number(r.so_ma_hang) }
      : r));
    setVuaLuu((p) => ({ ...p, [ma]: true }));
    setTimeout(() => setVuaLuu((p) => { const q = { ...p }; delete q[ma]; return q; }), 2500);
  };

  if (dangTai) return <p className="text-sm text-slate-500">Đang tải danh mục mã quản lý…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Phân gói con cho mã quản lý</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Mỗi mã quản lý chỉ thuộc <b>một</b> gói con của đợt 18 tháng, và mọi mã hàng
          bên trong đi theo. Gói bổ sung và chỉ định thầu là gói phẳng — không chia gói con.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { nhan: "Tổng mã quản lý", so: thongKe.tong, mau: "bg-slate-50 text-slate-700 border-slate-200" },
          { nhan: "Chưa phân gói", so: thongKe.chuaPhan, mau: "bg-amber-50 text-amber-800 border-amber-200" },
          { nhan: "Vắt ngang nhiều gói", so: thongKe.vatNgang, mau: "bg-red-50 text-red-800 border-red-200" },
        ].map((t) => (
          <div key={t.nhan} className={`border rounded-lg px-3 py-2 ${t.mau}`}>
            <p className="text-lg font-semibold leading-none">{t.so.toLocaleString("vi-VN")}</p>
            <p className="text-[11px] mt-1">{t.nhan}</p>
          </div>
        ))}
      </div>

      {thongKe.vatNgang > 0 && (
        <p className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2.5 py-2">
          <AlertTriangle size={14} className="shrink-0 mt-px" />
          <span>
            {thongKe.vatNgang} mã quản lý đang có mã hàng nằm ở nhiều gói con khác nhau —
            vi phạm invariant 2. Chọn lại một gói cho cả cụm để dồn về đúng một gói.
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {LOC.map((l) => (
          <button key={l.ma} type="button" onClick={() => setLoc(l.ma)}
            className={`px-2.5 py-1 text-xs rounded-md border ${
              loc === l.ma ? "border-umc-400 bg-umc-50 text-umc-800 font-medium"
                           : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
            {l.nhan}
          </button>
        ))}
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={tim} onChange={(e) => setTim(e.target.value)}
            placeholder="Tìm mã hoặc tên…"
            className="border border-slate-300 rounded-md pl-7 pr-2 py-1 text-xs w-56" />
        </div>
        <button type="button" onClick={tai}
          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50">
          <RotateCcw size={12} /> Tải lại
        </button>
        <span className="text-xs text-slate-500">{hienThi.length.toLocaleString("vi-VN")} dòng</span>
      </div>

      {loi && <p className="text-sm text-red-600">{loi}</p>}

      {hienThi.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-sm text-slate-500">
          <Layers size={20} className="mx-auto mb-2 text-slate-300" />
          Không còn mã quản lý nào ở bộ lọc này.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Mã quản lý</th>
                <th className="text-left px-3 py-2 font-semibold">Tên</th>
                <th className="text-right px-3 py-2 font-semibold">Mã hàng</th>
                <th className="text-left px-3 py-2 font-semibold">Hiện ở gói</th>
                <th className="text-left px-3 py-2 font-semibold">Gán gói con</th>
              </tr>
            </thead>
            <tbody>
              {hienThi.slice(0, 400).map((r) => {
                const vatNgang = Number(r.so_goi_khac_nhau) > 1;
                const chuaPhan = Number(r.so_ma_chua_phan) > 0;
                return (
                  <tr key={r.ma_quan_ly} className="border-t border-slate-100">
                    <td className="px-3 py-1.5 font-mono text-xs text-slate-700">{r.ma_quan_ly}</td>
                    <td className="px-3 py-1.5 text-xs text-slate-600 max-w-[22rem] truncate"
                        title={r.ten_quan_ly || ""}>{r.ten_quan_ly || "—"}</td>
                    <td className="px-3 py-1.5 text-right text-xs text-slate-600">{r.so_ma_hang}</td>
                    <td className="px-3 py-1.5 text-xs">
                      {vatNgang ? (
                        <span className="text-red-700 font-medium">
                          {r.so_goi_khac_nhau} gói khác nhau
                          {chuaPhan ? ` · ${r.so_ma_chua_phan} mã chưa phân` : ""}
                        </span>
                      ) : chuaPhan ? (
                        <span className="text-amber-700">Chưa phân gói</span>
                      ) : (
                        <span className="text-slate-700">{r.goi_dai_dien}</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={vatNgang || chuaPhan ? "" : (r.goi_dai_dien || "")}
                          disabled={dangLuu === r.ma_quan_ly}
                          onChange={(e) => gan(r.ma_quan_ly, e.target.value)}
                          className="border border-slate-300 rounded-md px-2 py-1 text-xs">
                          <option value="">— chọn gói con —</option>
                          {DS_GOI.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                        {vuaLuu[r.ma_quan_ly] && (
                          <Check size={14} className="text-emerald-600" aria-label="Đã lưu" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {hienThi.length > 400 && (
            <p className="px-3 py-2 text-xs text-slate-500 border-t border-slate-100">
              Hiện 400/{hienThi.length.toLocaleString("vi-VN")} dòng — thu hẹp bằng ô tìm kiếm.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
