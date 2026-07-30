import { useEffect, useMemo, useState } from "react";
import { FileText, ExternalLink, Package } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";
import { NHAN_TRANG_THAI, fmtNgayGio, khoaNhom } from "./DeXuatTongHop";
import { NHAN_GOI_THAU } from "./Function1";

const NHAN_LY_DO = {
  theo_lich_su: "Theo lịch sử sử dụng",
  ky_thuat_moi: "Kỹ thuật mới",
  thay_doi_phac_do: "Thay đổi phác đồ điều trị",
  khac: "Khác",
};
const MAU_TRANG_THAI = {
  de_xuat: "bg-slate-100 text-slate-600",
  xet_duyet: "bg-amber-100 text-amber-800",
  hoan_thanh: "bg-teal-100 text-teal-800",
  tu_choi: "bg-red-100 text-red-700",
  hon_hop: "bg-slate-100 text-slate-500",
};

// Không lọc theo don_vi ở FE — RLS của proposals đã tự giới hạn dvsd chỉ thấy
// đúng khoa mình (policy "xem đề xuất theo phân quyền khoa"), không cần lặp
// lại điều kiện đó ở đây.
export default function DeXuatCuaToi() {
  const [rows, setRows] = useState([]);
  const [phieuTheoNhom, setPhieuTheoNhom] = useState({}); // {khoaNhom: phieu}
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await fetchAllRows((f, t) =>
        supabase.from("v_de_xuat_tong_hop").select("*").order("created_at", { ascending: false }).range(f, t)
      );
      if (error) { setLoi("Không đọc được v_de_xuat_tong_hop — kiểm tra view/RLS trong Supabase (schema hiện tại xem backend/sql/schema.sql)."); setLoading(false); return; }
      setRows(data);
      const { data: phieu } = await fetchAllRows((f, t) =>
        supabase.from("phieu_de_nghi").select("id, proposal_id, nhom_de_xuat, trang_thai").range(f, t)
      );
      setPhieuTheoNhom(Object.fromEntries(
        (phieu || []).map((p) => [p.nhom_de_xuat || `le:${p.proposal_id}`, p])
      ));
      setLoading(false);
    })();
  }, []);

  // Gom theo bản đề xuất (1 giỏ = 1 đề xuất chung), giữ thứ tự mới → cũ.
  const nhomLoc = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      const k = khoaNhom(r);
      if (!m.has(k)) m.set(k, {
        key: k, items: [], created_at: r.created_at, nam_de_xuat: r.nam_de_xuat, don_vi: r.don_vi,
      });
      m.get(k).items.push(r);
    });
    return [...m.values()].map((g) => {
      const tt = [...new Set(g.items.map((i) => i.trang_thai))];
      // Lý do PĐD trả lại — hiện NGAY trên thẻ, không bắt khoa bấm vào mới thấy.
      const lyDo = [...new Set(g.items.map((i) => i.ly_do_tra_lai).filter(Boolean))];
      return { ...g, trangThai: tt.length === 1 ? tt[0] : "hon_hop", lyDoTraLai: lyDo };
    });
  }, [rows]);

  if (loading) return <div className="text-sm text-slate-400 p-4">Đang tải đề xuất...</div>;
  if (loi) return <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 m-1">{loi}</div>;

  if (nhomLoc.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg text-sm text-slate-400 p-6 text-center">
        Chưa gửi đề xuất nào.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-500 px-1">
        {nhomLoc.length} đề xuất đã gửi <span className="text-slate-400">({rows.length} mã hàng)</span>
      </div>
      <div className="space-y-3">
        {nhomLoc.map((g) => {
          const phieu = phieuTheoNhom[g.key];
          return (
            <div key={g.key} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                  <Package size={13} className="text-teal-700" />
                  {g.items.length} mã hàng · năm {g.nam_de_xuat}
                </span>
                <span className="text-slate-400">{fmtNgayGio(g.created_at)}</span>
                <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${MAU_TRANG_THAI[g.trangThai]}`}>
                  {g.trangThai === "hon_hop" ? "Hỗn hợp" : NHAN_TRANG_THAI[g.trangThai]}
                </span>
                {phieu && (
                  <a href={`?phieu=${phieu.id}`} target="_blank" rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 hover:underline">
                    <FileText size={12} /> Mở phiếu <ExternalLink size={10} />
                  </a>
                )}
              </div>
              {g.lyDoTraLai?.length > 0 && (
                <div className="px-4 py-2.5 bg-red-50 border-b border-red-100">
                  <p className="text-xs font-medium text-red-800 mb-0.5">
                    Phòng Điều dưỡng trả lại — cần sửa rồi gửi lại
                  </p>
                  {g.lyDoTraLai.map((l, i) => (
                    <p key={i} className="text-xs text-red-700 whitespace-pre-line leading-snug">{l}</p>
                  ))}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {g.items.map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-2 align-top">
                          <div className="font-mono text-xs text-slate-600">{r.ma_hang}</div>
                          <div className="text-xs text-slate-500 leading-tight max-w-md">{r.ten_vat_tu}</div>
                          <div className="text-xs text-slate-300 font-mono mt-0.5">{r.ma_quan_ly}</div>
                        </td>
                        <td className="px-4 py-2 text-right font-mono align-top whitespace-nowrap">
                          {fmt(r.so_luong)} <span className="text-slate-400 text-xs">{r.dvt}</span>
                        </td>
                        <td className="px-4 py-2 align-top text-xs">
                          {NHAN_LY_DO[r.loai_ly_do] || r.loai_ly_do}
                          {r.ten_ky_thuat_moi && <div className="text-slate-500">KT mới: {r.ten_ky_thuat_moi}</div>}
                        </td>
                        <td className="px-4 py-2 align-top text-xs">
                          {r.loai_mua_sam ? (
                            <div>
                              <div className="text-slate-700">{NHAN_GOI_THAU[r.loai_mua_sam]}</div>
                              {r.tu_thang
                                ? <div className="text-slate-400">T{r.tu_thang}/{r.tu_nam} – T{r.den_thang}/{r.den_nam} ({r.so_thang_du_kien} tháng)</div>
                                : r.so_thang_du_kien ? <div className="text-slate-400">dự kiến {r.so_thang_du_kien} tháng</div> : null}
                            </div>
                          ) : (
                            <span className="text-slate-300 italic">— chưa chọn</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
