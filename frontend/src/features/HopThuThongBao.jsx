import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import { dinhDangSoThongBao } from "../lib/dinhDangThongBao";

/*
 * HopThuThongBao — hộp thư hai chiều PĐD ↔ khoa (QĐ D5, 23/08/2026).
 *
 * Vì sao có: triết lý nền 17/08 nói "web là sổ ghi, không nhắc, không thông
 * báo tự động". Chủ dự án đảo lại ngày 23/08 vì hai vai trò sửa đè lên nhau
 * theo luật "ai sửa sau đè" — không có chỗ nào nhìn thấy phía kia vừa làm gì.
 *
 * Hai luật giữ cho hộp thư không phình:
 *   1. Chỉ ghi VIỆC LỚN. Sửa vặt gộp một dòng mỗi ngày, đếm bằng `so_lan`
 *      (làm ở server, xem fn_ghi_thong_bao trong patch_zzzzz).
 *   2. Xác nhận đã xem là XOÁ hẳn. Dấu vết thật nằm ở audit của từng bảng,
 *      không nằm ở đây.
 */

// V11/V31 (05/10/2026, G10): giờ hiện "10:24 5/10/2026" (không giây); giờ-phút-giây
// đầy đủ nằm ở rê chuột.
const gioNgan = (x) => new Date(x).toLocaleString("vi-VN", {
  hour: "2-digit", minute: "2-digit", day: "numeric", month: "numeric", year: "numeric",
});

export default function HopThuThongBao({ profile }) {
  const [rows, setRows] = useState([]);
  const [mo, setMo] = useState(false);
  const [dangXoa, setDangXoa] = useState(false);
  const hopRef = useRef(null);

  const laPdd = profile?.role === "dieu_duong" || profile?.role === "admin";

  const tai = useCallback(async () => {
    if (!profile) return;
    let q = supabase.from("thong_bao")
      .select("id, loai, tieu_de, noi_dung, du_lieu, so_lan, mau, created_at, updated_at")
      .order("updated_at", { ascending: false }).limit(100);
    q = laPdd ? q.eq("pham_vi", "pdd") : q.eq("pham_vi", "khoa").eq("khoa", profile.khoa);
    const { data } = await q;
    setRows(data || []);
  }, [profile, laPdd]);

  useEffect(() => { tai(); }, [tai]);

  // Nhịp 60 giây là đủ: đây là sổ ghi, không phải chat.
  useEffect(() => {
    const t = setInterval(tai, 60000);
    return () => clearInterval(t);
  }, [tai]);

  useEffect(() => {
    if (!mo) return;
    const ngoai = (e) => { if (hopRef.current && !hopRef.current.contains(e.target)) setMo(false); };
    // Esc đóng hộp thư (QA3 18/09), giống mọi lớp nổi khác.
    const phim = (e) => { if (e.key === "Escape") setMo(false); };
    document.addEventListener("mousedown", ngoai);
    document.addEventListener("keydown", phim);
    return () => {
      document.removeEventListener("mousedown", ngoai);
      document.removeEventListener("keydown", phim);
    };
  }, [mo]);

  const daXem = async (ids) => {
    setDangXoa(true);
    await supabase.rpc("danh_dau_da_xem_thong_bao", { p_ids: ids || null });
    setDangXoa(false);
    await tai();
  };

  if (!profile) return null;
  const soDo = rows.filter((r) => r.mau === "do").length;

  return (
    <div className="relative" ref={hopRef}>
      <button type="button" onClick={() => setMo((v) => !v)}
        aria-haspopup="dialog" aria-expanded={mo}
        className="umc-icon-button relative" title="Hộp thư thông báo" aria-label="Hộp thư thông báo">
        <Bell size={17} />
        {rows.length > 0 && (
          <span className={`umc-count-badge ${soDo > 0 ? "!bg-red-600" : ""}`}>{rows.length}</span>
        )}
      </button>

      {mo && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[26rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="text-sm font-semibold text-slate-800">
              Hộp thư {laPdd ? "Phòng Điều dưỡng" : profile.khoa}
            </span>
            <div className="flex items-center gap-2">
              {rows.length > 0 && (
                <button type="button" disabled={dangXoa} onClick={() => daXem(null)}
                  className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-umc-700 hover:bg-umc-50 disabled:opacity-50">
                  <Check size={12} /> Đã xem tất cả
                </button>
              )}
              <button type="button" onClick={() => setMo(false)} aria-label="Đóng hộp thư"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-auto">
            {rows.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">Không có thông báo nào.</p>
            ) : rows.map((r) => (
              <div key={r.id}
                className={`border-b border-slate-100 border-l-[3px] px-3 py-2.5 ${r.mau === "do" ? "border-l-red-500" : "border-l-transparent"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800">
                      {r.tieu_de}
                      {r.so_lan > 1 && (
                        <span className="ml-1.5 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                          ×{r.so_lan}
                        </span>
                      )}
                    </p>
                    {r.noi_dung && <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{dinhDangSoThongBao(r.noi_dung, r.du_lieu)}</p>}
                    <p className="mt-0.5 text-xs text-slate-500"
                      title={new Date(r.updated_at || r.created_at).toLocaleString("vi-VN")}>
                      {gioNgan(r.updated_at || r.created_at)}
                    </p>
                  </div>
                  <button type="button" onClick={() => daXem([r.id])}
                    title="Đã xem — xoá dòng này"
                    className="-mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"><Check size={16} /></button>
                </div>
              </div>
            ))}
          </div>

          {rows.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Xác nhận đã xem là xoá hẳn. Dấu vết đầy đủ vẫn nằm ở lịch sử sửa của từng ô.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
