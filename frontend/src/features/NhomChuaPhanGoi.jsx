import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { useNhomChuaPhanGoi } from "../lib/nhomChuaPhanGoi";
import { xuatExcelDong } from "../lib/xuatExcelDong";

/*
 * GÓI CHƯA PHÂN (em chốt 16/10/2026) — trang CHỈ XEM.
 * Khoa: nhóm chưa phân gói mà khoa đã dùng; không nhập số, không gửi — chờ
 * phân gói xong mới đề xuất ở gói con thật. PĐD: cả viện, kèm khoa đã dùng.
 * Cả hai tải được Excel (cột "Gói" để trống cho tổ VTYT điền).
 * Luật "chưa phân gói" ở lib/nhomChuaPhanGoi.js.
 */
export default function NhomChuaPhanGoi({ profile, laPdd }) {
  const khoa = laPdd ? null : profile?.khoa || null;
  const { ds, dangTai, loi } = useNhomChuaPhanGoi(khoa);
  const [tuKhoa, setTuKhoa] = useState("");
  const [dangXuat, setDangXuat] = useState(false);

  const dsLoc = useMemo(() => {
    const q = tuKhoa.trim().toLowerCase();
    if (!ds || !q) return ds || [];
    return ds.filter((n) => n.ma_quan_ly.toLowerCase().includes(q)
      || (n.ten_quan_ly || "").toLowerCase().includes(q)
      || n.maHang.some((m) => String(m.ma_hang).includes(q) || (m.ten_vat_tu || "").toLowerCase().includes(q)));
  }, [ds, tuKhoa]);
  const soMa = (ds || []).reduce((t, n) => t + n.maHang.length, 0);

  const xuatExcel = async () => {
    if (!ds?.length) return;
    setDangXuat(true);
    try {
      const rows = [];
      ds.forEach((n) => n.maHang.forEach((m) => rows.push({
        stt: rows.length + 1,
        ma_quan_ly: n.ma_quan_ly,
        ten_quan_ly: n.ten_quan_ly,
        ma_hang: m.ma_hang,
        ten_vat_tu: m.ten_vat_tu,
        dvt: m.dvt,
        khoa: n.khoaDaDung.join("; "),
        goi: "",
      })));
      const ngay = new Date().toLocaleDateString("vi-VN");
      await xuatExcelDong({
        tieuDe: [
          "BỆNH VIỆN ĐẠI HỌC Y DƯỢC TP. HỒ CHÍ MINH",
          khoa ? `Khoa: ${khoa}` : "Phòng Điều dưỡng",
          `DANH SÁCH NHÓM VẬT TƯ CHƯA PHÂN GÓI (${ngay}) — nhờ tổ VTYT điền cột "Gói"`,
        ],
        cot: [
          { key: "stt", nhan: "STT", width: 50 },
          { key: "ma_quan_ly", nhan: "Mã quản lý", width: 110 },
          { key: "ten_quan_ly", nhan: "Tên nhóm", width: 220 },
          { key: "ma_hang", nhan: "Mã hàng", width: 70 },
          { key: "ten_vat_tu", nhan: "Tên vật tư", width: 320 },
          { key: "dvt", nhan: "ĐVT", width: 60 },
          { key: "khoa", nhan: "Khoa đã dùng", width: 260 },
          { key: "goi", nhan: "Gói (Dùng chung / GMHS / Răng Hàm Mặt / Tim mạch / CTCH-NTK)", width: 180 },
        ],
        rows,
        tenFile: `Nhom-chua-phan-goi-${new Date().toISOString().slice(0, 10)}.xlsx`,
        tenSheet: "Chưa phân gói",
      });
    } finally {
      setDangXuat(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border-2 border-dashed border-slate-300 bg-white px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-umc-900">Gói chưa phân</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-700">
              {khoa
                ? <>Các nhóm khoa đã dùng nhưng <b>chưa được xếp vào gói con nào</b>. Khoa <b>chỉ xem</b>, chưa nhập số và chưa gửi được. Phòng Điều dưỡng đang nhờ tổ VTYT phân gói; phân xong, nhóm tự chuyển về đúng gói con để khoa đề xuất.</>
                : <>Các nhóm có mã hàng <b>chưa ghi gói</b> (không có trong tệp danh mục gốc). Khoa chỉ xem được, chưa đề xuất được. Tải Excel nhờ tổ VTYT điền cột &quot;Gói&quot;, có kết quả thì ghi vào danh mục để nhóm tự về đúng gói con.</>}
            </p>
          </div>
          <button type="button" onClick={xuatExcel} disabled={!ds?.length || dangXuat}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-umc-600 px-4 text-sm font-semibold text-white hover:bg-umc-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Download size={16} />
            {dangXuat ? "Đang tạo tệp…" : "Tải Excel"}
          </button>
        </div>
        {ds && (
          <p className="mt-3 text-sm text-slate-600">
            <b className="text-slate-900">{ds.length}</b> nhóm · <b className="text-slate-900">{soMa}</b> mã hàng chưa phân gói
            {khoa ? " mà khoa đã dùng" : " (cả viện)"}
          </p>
        )}
      </section>

      {dangTai ? (
        <p className="text-sm text-slate-500">Đang tải danh sách…</p>
      ) : loi ? (
        <p className="text-sm text-red-600">{loi}</p>
      ) : !ds?.length ? (
        <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          ✓ Không còn nhóm nào chưa phân gói{khoa ? " trong số nhóm khoa đã dùng" : ""}.
        </p>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-3">
            <div className="relative max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Tìm theo tên hoặc mã"
                className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-umc-500" />
            </div>
          </div>
          <div className="max-h-[calc(100vh-20rem)] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-3 py-2">Nhóm</th>
                  <th className="px-3 py-2">Mã hàng trong nhóm</th>
                  {!khoa && <th className="px-3 py-2">Khoa đã dùng</th>}
                </tr>
              </thead>
              <tbody>
                {dsLoc.map((n) => (
                  <tr key={n.ma_quan_ly} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-slate-900">{n.ten_quan_ly || "—"}</p>
                      <p className="font-mono text-xs text-slate-500">{n.ma_quan_ly}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      {n.maHang.map((m) => (
                        <p key={m.ma_hang} className="text-slate-700">
                          <span className="font-mono text-xs text-slate-500">{m.ma_hang}</span> · {m.ten_vat_tu}
                          {m.dvt ? <span className="text-slate-500"> ({m.dvt})</span> : null}
                        </p>
                      ))}
                    </td>
                    {!khoa && (
                      <td className="px-3 py-2.5 text-xs text-slate-600">
                        {n.khoaDaDung.length ? n.khoaDaDung.join(", ") : <span className="text-slate-500">Chưa khoa nào dùng</span>}
                      </td>
                    )}
                  </tr>
                ))}
                {!dsLoc.length && (
                  <tr><td colSpan={khoa ? 2 : 3} className="px-3 py-4 text-slate-500">Không có nhóm nào khớp.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
