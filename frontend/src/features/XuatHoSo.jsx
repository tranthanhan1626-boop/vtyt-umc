import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, Sheet, AlertTriangle } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { HO_SO, xuatHoSo } from "../lib/xuatHoSo";

// Tab "Xuất hồ sơ" (A.3) — dùng chung ĐVSD và PĐD, khác ở PHẠM VI dữ liệu:
// RLS tự lọc, dvsd chỉ đọc được đề xuất khoa mình nên không cần lọc thêm ở FE.
//
// 4/5 hồ sơ chưa có mẫu chính thức -> file tải về đóng dấu "BẢN NHÁP".
// Dữ liệu bên trong đã ĐÚNG; chỉ bố cục là tạm.

const NHAN_TT = {
  de_xuat: "Mới gửi", xet_duyet: "Đã duyệt", hoan_thanh: "Hoàn thành", tu_choi: "Bị trả lại",
};

export default function XuatHoSo({ profile, goi, dot }) {
  const [rows, setRows] = useState([]);
  const [usage, setUsage] = useState({});   // {ma_hang: {nam: tổng}} cho cột lịch sử
  const [dangTai, setDangTai] = useState(true);
  const [locTrangThai, setLocTrangThai] = useState("xet_duyet");
  const [dangXuat, setDangXuat] = useState(null);
  const [loi, setLoi] = useState("");
  const [daGhi, setDaGhi] = useState(null);

  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";

  const tai = useCallback(async () => {
    setDangTai(true);
    const r = await fetchAllRows((f, t) =>
      supabase.from("v_de_xuat_tong_hop").select("*").order("created_at", { ascending: false }).range(f, t));
    const ds = r.error ? [] : r.data || [];
    setRows(ds);
    const codes = [...new Set(ds.map((x) => x.ma_hang))];
    if (codes.length) {
      const u = await fetchAllRows((f, t) => supabase.from("v_usage_monthly")
        .select("ma_hang, nam, so_luong").in("ma_hang", codes).range(f, t));
      const acc = {};
      (u.data || []).forEach((x) => {
        acc[x.ma_hang] = acc[x.ma_hang] || {};
        acc[x.ma_hang][x.nam] = (acc[x.ma_hang][x.nam] || 0) + Number(x.so_luong);
      });
      setUsage(acc);
    }
    setDangTai(false);
  }, []);
  useEffect(() => { tai(); }, [tai]);

  // Chỉ lấy mã CỦA GÓI ĐANG MỞ TAB — không gom lẫn gói khác (QĐ-20).
  const rowsLoc = useMemo(() => rows.filter((r) =>
    r.loai_mua_sam === goi && (!locTrangThai || r.trang_thai === locTrangThai)
  ), [rows, goi, locTrangThai]);

  const chay = async (ma) => {
    setDangXuat(ma); setLoi("");
    const meta = {
      don_vi: laPdd ? "Toàn viện" : profile.khoa,
      nguoi_lap: profile.ho_ten || profile.email,
    };
    try {
      await xuatHoSo(ma, rowsLoc, meta, usage);
      // Ghi lịch sử kèm SNAPSHOT danh sách mã — để tải lại ra đúng file này,
      // kể cả khi đề xuất sau đó bị sửa (QĐ-20).
      const { error } = await supabase.from("lan_xuat_ho_so").insert({
        ma_ho_so: ma, ten_ho_so: HO_SO[ma].ten,
        dot_id: dot?.id ?? null, loai_mua_sam: goi,
        don_vi: laPdd ? null : profile.khoa,
        so_dong: rowsLoc.length,
        noi_dung: { rows: rowsLoc, meta, usage },
      });
      if (error) setLoi(`Đã tải file nhưng KHÔNG ghi được lịch sử: ${error.message}`);
      else setDaGhi(ma);
    } catch (e) { setLoi(e.message); }
    setDangXuat(null);
  };

  // File 5 là việc của PĐD (tổng hợp mọi khoa), khoa không xuất được.
  const dsHoSo = Object.values(HO_SO).filter((h) => laPdd || h.ai === "dvsd");

  if (dangTai) return <p className="text-sm text-slate-500">Đang tải...</p>;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-3">
        <p className="text-xs text-slate-500 mb-2">Chọn dữ liệu đưa vào hồ sơ</p>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={locTrangThai} onChange={(e) => setLocTrangThai(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm">
            <option value="">Mọi trạng thái</option>
            {Object.entries(NHAN_TT).map(([v, n]) => <option key={v} value={v}>{n}</option>)}
          </select>
          <span className="text-sm text-slate-600">
            → <span className="font-semibold text-teal-800">{rowsLoc.length}</span> mã hàng sẽ vào hồ sơ
          </span>
        </div>
        {locTrangThai === "de_xuat" && (
          <p className="text-xs text-amber-700 mt-2 flex items-start gap-1">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            Đang chọn đề xuất <b>chưa qua duyệt</b> của Phòng Điều dưỡng.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dsHoSo.map((h) => (
          <div key={h.ma} className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col">
            <div className="flex items-start gap-2 mb-1">
              {h.loai === "word"
                ? <FileText size={15} className="text-blue-700 mt-0.5 shrink-0" />
                : <Sheet size={15} className="text-green-700 mt-0.5 shrink-0" />}
              <span className="text-sm font-medium text-slate-800 leading-snug">{h.ten}</span>
            </div>
            <span className="text-xs text-teal-700 mb-2">
              Theo khung cột biểu mẫu chính thức
            </span>
            <button onClick={() => chay(h.ma)} disabled={dangXuat === h.ma || rowsLoc.length === 0}
              className="mt-auto flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40 font-medium">
              <Download size={13} />
              {dangXuat === h.ma ? "Đang tạo..." : `Tải ${h.loai === "word" ? "Word" : "Excel"}`}
            </button>
          </div>
        ))}
      </div>

      {loi && <p className="text-sm text-red-600">{loi}</p>}
      {daGhi && !loi && (
        <p className="text-sm text-teal-800 bg-teal-50 border border-teal-200 rounded-md px-3 py-2">
          Đã tải <b>{HO_SO[daGhi].ten}</b> và ghi vào <b>Lịch sử xuất hồ sơ</b>.
          Tải lại từ đó sẽ ra đúng file này.
        </p>
      )}

      <p className="text-xs text-slate-400">
        File xuất theo đúng khung cột biểu mẫu bệnh viện. Cột nào hệ thống chưa có dữ
        liệu (mã thông tư, quy cách đóng gói, mã kỹ thuật…) để <b>trống đúng vị trí</b>
        cho điền tay — không bỏ cột, tránh sai bố cục.
      </p>
    </div>
  );
}
