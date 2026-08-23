import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowRightLeft, Check, ChevronDown, ChevronRight,
  RefreshCw, RotateCcw, Search,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";

/*
 * TheoDoiCuonChieu — màn theo dõi của PĐD sau khi xác nhận rớt (QĐ B3/B8).
 *
 * Đọc theo TỪNG MÃ HÀNG RỚT, không theo khoa: một mã rớt thì cả loạt khoa
 * cùng chịu, nên câu hỏi thật của PĐD là "mã này đã về tay đủ các khoa chưa",
 * chứ không phải "khoa này còn nợ gì".
 *
 * Luật đọc quan trọng nhất — chép nguyên từ QĐ B8:
 *   Ô TRỐNG ở cột "Đợt bổ sung" = CUỐN CHIẾU HỎNG, không phải đang chờ khoa.
 * Vì cuốn chiếu là việc của hệ, không phải việc của người. Trống nghĩa là hệ
 * chưa làm được, phải bấm lại "Xác nhận rớt".
 */

const NHAN_TRANG_THAI = {
  con_no_xu_ly: { nhan: "Còn nợ xử lý", mau: "bg-amber-100 text-amber-800", icon: AlertTriangle },
  da_do_sang_ma: { nhan: "Đã đổ sang mã khác", mau: "bg-sky-100 text-sky-800", icon: ArrowRightLeft },
  cuon_chieu_hong: { nhan: "CUỐN CHIẾU HỎNG", mau: "bg-red-600 text-white", icon: AlertTriangle },
  da_cuon_chieu: { nhan: "Đã vào đợt bổ sung", mau: "bg-emerald-100 text-emerald-800", icon: Check },
};

export default function TheoDoiCuonChieu({ profile, dotGoiId = null }) {
  const [rows, setRows] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [tim, setTim] = useState("");
  const [locTrangThai, setLocTrangThai] = useState("tat_ca");
  const [moMa, setMoMa] = useState(() => new Set());
  const [dangChay, setDangChay] = useState("");

  const laPdd = profile?.role === "dieu_duong" || profile?.role === "admin";

  const tai = useCallback(async () => {
    setDangTai(true); setLoi("");
    let q = supabase.from("v_theo_doi_cuon_chieu_v3").select("*");
    if (dotGoiId) q = q.eq("dot_goi_id", dotGoiId);
    const { data, error } = await q;
    if (error) setLoi(error.message);
    setRows(data || []);
    setDangTai(false);
  }, [dotGoiId]);

  useEffect(() => { tai(); }, [tai]);

  // Gom theo mã hàng — mỗi mã một dòng mẹ, sổ ra danh sách khoa.
  const theoMa = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      if (!m.has(r.ma_hang)) {
        m.set(r.ma_hang, {
          ma_hang: r.ma_hang, ten_vat_tu: r.ten_vat_tu, dvt: r.dvt,
          ma_quan_ly: r.ma_quan_ly, khoa: [],
        });
      }
      m.get(r.ma_hang).khoa.push(r);
    });
    return [...m.values()].map((g) => {
      const hong = g.khoa.filter((k) => k.trang_thai === "cuon_chieu_hong").length;
      const no = g.khoa.filter((k) => k.trang_thai === "con_no_xu_ly").length;
      const doMa = g.khoa.filter((k) => k.trang_thai === "da_do_sang_ma").length;
      const xong = g.khoa.filter((k) => k.trang_thai === "da_cuon_chieu").length;
      return {
        ...g, hong, no, doMa, xong,
        tongRot: g.khoa.reduce((s, k) => s + (Number(k.so_rot) || 0), 0),
        daXacNhan: g.khoa.filter((k) => k.khoa_da_xac_nhan).length,
        daSuaSo: g.khoa.filter((k) => k.khoa_da_sua_so).length,
        trangThai: hong > 0 ? "cuon_chieu_hong" : no > 0 ? "con_no_xu_ly"
          : xong > 0 ? "da_cuon_chieu" : "da_do_sang_ma",
      };
    }).sort((a, b) => (b.hong + b.no) - (a.hong + a.no)
      || a.ma_hang.localeCompare(b.ma_hang));
  }, [rows]);

  const hienThi = useMemo(() => theoMa.filter((g) => {
    if (locTrangThai !== "tat_ca" && g.trangThai !== locTrangThai) return false;
    if (!tim.trim()) return true;
    const t = tim.trim().toLowerCase();
    return g.ma_hang.toLowerCase().includes(t)
      || (g.ten_vat_tu || "").toLowerCase().includes(t)
      || (g.ma_quan_ly || "").toLowerCase().includes(t);
  }), [theoMa, locTrangThai, tim]);

  const tong = useMemo(() => ({
    ma: theoMa.length,
    hong: theoMa.filter((g) => g.hong > 0).length,
    no: theoMa.filter((g) => g.no > 0).length,
  }), [theoMa]);

  const chayLaiCuonChieu = async (maHang) => {
    const dgId = rows.find((r) => r.ma_hang === maHang)?.dot_goi_id;
    if (!dgId) return;
    setDangChay(maHang); setLoi("");
    const { error } = await supabase.rpc("xac_nhan_rot_v3", {
      p_dot_goi_id: dgId, p_giai_doan: null, p_ma_hang: maHang,
    });
    setDangChay("");
    if (error) { setLoi(error.message); return; }
    await tai();
  };

  const doiMo = (ma) => setMoMa((p) => {
    const n = new Set(p);
    n.has(ma) ? n.delete(ma) : n.add(ma);
    return n;
  });

  if (!laPdd) {
    return <div className="p-6 text-sm text-slate-500">Màn này dành cho Phòng Điều dưỡng.</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-900">Theo dõi cuốn chiếu mã rớt</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Đọc theo từng mã hàng rớt. <b className="text-red-700">Ô trống ở cột “Đợt bổ sung”
          nghĩa là cuốn chiếu hỏng</b> — không phải đang chờ khoa. Bấm “Chạy lại” để hệ đẩy lại.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
            {tong.ma} mã rớt
          </span>
          {tong.hong > 0 && (
            <span className="rounded bg-red-600 px-2 py-1 text-[11px] font-semibold text-white">
              {tong.hong} mã cuốn chiếu hỏng
            </span>
          )}
          {tong.no > 0 && (
            <span className="rounded bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-800">
              {tong.no} mã còn nợ xử lý
            </span>
          )}
          <div className="relative">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={tim} onChange={(e) => setTim(e.target.value)}
              placeholder="Tìm mã hàng, tên, mã quản lý"
              className="w-64 rounded border border-slate-300 py-1 pl-7 pr-2 text-xs" />
          </div>
          <select value={locTrangThai} onChange={(e) => setLocTrangThai(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs">
            <option value="tat_ca">Mọi trạng thái</option>
            <option value="cuon_chieu_hong">Cuốn chiếu hỏng</option>
            <option value="con_no_xu_ly">Còn nợ xử lý</option>
            <option value="da_do_sang_ma">Đã đổ sang mã khác</option>
            <option value="da_cuon_chieu">Đã vào đợt bổ sung</option>
          </select>
          <button type="button" onClick={tai} className="qtdx-tb"><RefreshCw size={13} /> Tải lại</button>
        </div>
        {loi && <div className="mt-2 rounded bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{loi}</div>}
      </div>

      <div className="flex-1 overflow-auto px-4 py-3">
        {dangTai ? (
          <p className="text-xs text-slate-400">Đang tải…</p>
        ) : hienThi.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-600">Chưa có mã nào rớt</p>
            <p className="mt-1 text-xs text-slate-500">
              Màn này chỉ có nội dung sau khi đợt đã <b>chốt số đi thầu</b>, PĐD đã gõ số rớt
              trên bảng Tổng hợp và bấm <b>Xác nhận rớt</b>. Trống ở đây khi chưa chốt Q là bình thường.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase text-slate-500">
                <th className="py-2 pr-3">Mã hàng</th>
                <th className="px-3 py-2 text-right">Tổng rớt</th>
                <th className="px-3 py-2 text-right">Số khoa</th>
                <th className="px-3 py-2">Đợt bổ sung</th>
                <th className="px-3 py-2">Khoa đã sửa số</th>
                <th className="px-3 py-2">Khoa đã xác nhận</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {hienThi.map((g) => {
                const mo = moMa.has(g.ma_hang);
                const tt = NHAN_TRANG_THAI[g.trangThai];
                const Icon = tt.icon;
                const dot = g.khoa.find((k) => k.goi_bo_sung);
                return (
                  <FragmentRow key={g.ma_hang}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 pr-3">
                        <button type="button" onClick={() => doiMo(g.ma_hang)}
                          className="inline-flex items-start gap-1.5 text-left">
                          {mo ? <ChevronDown size={13} className="mt-1 text-slate-400" />
                              : <ChevronRight size={13} className="mt-1 text-slate-400" />}
                          <span>
                            <span className="block font-mono text-xs text-slate-500">{g.ma_hang}</span>
                            <span className="block text-slate-800">{g.ten_vat_tu}</span>
                            <span className="block text-[11px] text-slate-400">{g.ma_quan_ly}</span>
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{fmt(g.tongRot)} {g.dvt}</td>
                      <td className="px-3 py-2 text-right font-mono">{g.khoa.length}</td>
                      <td className="px-3 py-2 text-xs">
                        {dot ? (
                          <span className="text-slate-700">
                            {dot.goi_bo_sung} · T{dot.thang_bo_sung}/{dot.nam_bo_sung}
                          </span>
                        ) : g.doMa === g.khoa.length ? (
                          <span className="text-slate-400">— (đã đổ sang mã khác)</span>
                        ) : (
                          <span className="font-semibold text-red-700">— TRỐNG</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs font-mono">{g.daSuaSo}/{g.khoa.length}</td>
                      <td className="px-3 py-2 text-xs font-mono">{g.daXacNhan}/{g.khoa.length}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium ${tt.mau}`}>
                          <Icon size={11} /> {tt.nhan}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {(g.hong > 0 || g.no > 0) && (
                          <button type="button" disabled={dangChay === g.ma_hang}
                            onClick={() => chayLaiCuonChieu(g.ma_hang)}
                            className="inline-flex items-center gap-1 rounded border border-red-300 bg-white px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
                            <RotateCcw size={11} />
                            {dangChay === g.ma_hang ? "Đang chạy…" : "Chạy lại"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {mo && g.khoa.map((k) => {
                      const ktt = NHAN_TRANG_THAI[k.trang_thai];
                      return (
                        <tr key={`${g.ma_hang}-${k.khoa}`} className="border-b border-slate-50 bg-slate-50/50 text-xs">
                          <td className="py-1.5 pl-8 pr-3 text-slate-600">{k.khoa}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{fmt(k.so_rot)}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-400">
                            {Number(k.con_lai) > 0 ? `còn ${fmt(k.con_lai)}` : "—"}
                          </td>
                          <td className="px-3 py-1.5">
                            {k.goi_bo_sung
                              ? <span>{k.goi_bo_sung} · số {fmt(k.so_khoa_dang_de_xuat ?? k.da_cuon_chieu)}</span>
                              : k.ma_hang_nhan
                                ? <span className="text-sky-700">→ {k.ma_hang_nhan}
                                    {k.khoa_chua_tung_dung && <b className="text-amber-700"> (khoa chưa từng dùng)</b>}
                                  </span>
                                : <span className="font-semibold text-red-700">— TRỐNG</span>}
                          </td>
                          <td className="px-3 py-1.5">{k.khoa_da_sua_so ? "có" : "chưa"}</td>
                          <td className="px-3 py-1.5">{k.khoa_da_xac_nhan ? "rồi" : "chưa"}</td>
                          <td className="px-3 py-1.5">
                            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ${ktt.mau}`}>
                              {ktt.nhan}
                            </span>
                          </td>
                          <td></td>
                        </tr>
                      );
                    })}
                  </FragmentRow>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FragmentRow({ children }) { return <>{children}</>; }
