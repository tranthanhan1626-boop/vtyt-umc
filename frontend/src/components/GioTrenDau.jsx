import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, ShoppingCart, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import { GOI_ID_MAP } from "../lib/cotChuan";

/*
 * BIỂU TƯỢNG GIỎ TRÊN THANH ĐẦU (em chốt 16/10/2026) — chỉ vai khoa.
 *   - Số đỏ = số GÓI CON còn giỏ CHƯA GỬI (mọi đợt đang mở). Ví dụ giỏ đang
 *     soạn có món của Dùng chung, GMHS, CTCH-NTK → 3. Giỏ trống thì không hiện số.
 *   - Bấm → khung bật lên, mỗi gói con một dòng "Dùng chung · 3 nhóm · 4 mã";
 *     bấm một dòng → mở màn Đề xuất của gói con đó với ngăn giỏ mở sẵn (giỏ
 *     chia phần theo gói con, xem chi tiết rồi Gửi ở đó).
 * Giỏ nháp là MỘT dòng gio_nhap cho mỗi khoa × đợt, chung mọi gói con (cách A);
 * gói con của từng nhóm lấy theo gói đã ghi của các mã trong nhóm.
 * Function1 bắn sự kiện SU_KIEN_GIO_DOI mỗi khi ghi/xoá giỏ hoặc gửi xong.
 */
export const SU_KIEN_GIO_DOI = "vtyt-gio-doi";

const TEN_LOAI = {
  dau_thau_rong_rai: "Gói 18 tháng",
  mua_sam_bo_sung: "Gói bổ sung",
  chi_dinh_thau: "Gói chỉ định thầu",
};
const tenPhanGoi = (loai, goi) => (loai === "dau_thau_rong_rai" && goi ? goi : TEN_LOAI[loai] || "Khác");
const goiConTuTen = (ten) => Object.entries(GOI_ID_MAP)
  .find(([k, v]) => k.startsWith("18t-") && v.goi === ten)?.[0] || null;

export default function GioTrenDau({ khoa, dsDotMo = [], onMoGio }) {
  const [mo, setMo] = useState(false);
  const [phan, setPhan] = useState(null); // [{tenGoi, loai, dotId, soNhom, soMa}]
  const [loi, setLoi] = useState("");
  const ref = useRef(null);
  const khoaDot = dsDotMo.join(",");

  const tai = useCallback(async () => {
    if (!khoa || !dsDotMo.length) { setPhan([]); return; }
    const { data, error } = await supabase.from("gio_nhap")
      .select("dot_id, loai_mua_sam, noi_dung").eq("don_vi", khoa).in("dot_id", dsDotMo);
    if (error) { setLoi("Không đọc được giỏ."); return; }
    setLoi("");
    const theoPhan = new Map();
    (data || []).forEach((g) => {
      const theoNhom = new Map();
      Object.values(g.noi_dung || {}).forEach((n) => {
        if (!(Number(n?.soLuong) > 0)) return;
        const ma = n.ma_quan_ly || n.ma_hang;
        if (!theoNhom.has(ma)) theoNhom.set(ma, { soMa: 0, goi: null, goiGio: null });
        const x = theoNhom.get(ma);
        x.soMa += 1;
        if (n.goi && !x.goi) x.goi = n.goi;
        if (n.goiGio && !x.goiGio) x.goiGio = n.goiGio; // gói con lúc bỏ vào giỏ
      });
      theoNhom.forEach((x) => {
        const ten = tenPhanGoi(g.loai_mua_sam, x.goi || x.goiGio);
        const k = `${g.dot_id}|${ten}`;
        if (!theoPhan.has(k)) theoPhan.set(k, { tenGoi: ten, loai: g.loai_mua_sam, dotId: g.dot_id, soNhom: 0, soMa: 0 });
        const p = theoPhan.get(k);
        p.soNhom += 1;
        p.soMa += x.soMa;
      });
    });
    setPhan([...theoPhan.values()]);
  }, [khoa, khoaDot]); // eslint-disable-line react-hooks/exhaustive-deps

  // Số đỏ: đọc khi vào, khi quay lại tab, mỗi 30 giây, và khi giỏ vừa đổi.
  useEffect(() => {
    tai();
    const t = setInterval(tai, 30_000);
    const khiDoi = () => setTimeout(tai, 1200); // chờ lượt ghi giỏ hoãn 800ms
    window.addEventListener(SU_KIEN_GIO_DOI, khiDoi);
    window.addEventListener("focus", tai);
    return () => {
      clearInterval(t);
      window.removeEventListener(SU_KIEN_GIO_DOI, khiDoi);
      window.removeEventListener("focus", tai);
    };
  }, [tai]);

  useEffect(() => {
    if (!mo) return undefined;
    tai();
    const ngoai = (e) => { if (!ref.current?.contains(e.target)) setMo(false); };
    const phim = (e) => { if (e.key === "Escape") setMo(false); };
    document.addEventListener("mousedown", ngoai);
    document.addEventListener("keydown", phim);
    return () => {
      document.removeEventListener("mousedown", ngoai);
      document.removeEventListener("keydown", phim);
    };
  }, [mo, tai]);

  const soPhan = phan?.length || 0;

  const moChiTiet = (p) => {
    setMo(false);
    onMoGio?.({
      goi: p.loai,
      goiCon: p.loai === "dau_thau_rong_rai" ? goiConTuTen(p.tenGoi) : null,
      dotId: p.dotId,
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setMo((v) => !v)} className="umc-icon-button relative"
        title={soPhan ? `${soPhan} giỏ chưa gửi` : "Giỏ đề xuất"}
        aria-label={soPhan ? `Giỏ đề xuất, ${soPhan} giỏ chưa gửi` : "Giỏ đề xuất"}
        aria-haspopup="dialog" aria-expanded={mo}>
        <ShoppingCart size={18} />
        {soPhan > 0 && (
          <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[1.2rem] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-[1.2rem] text-white ring-2 ring-white">
            {soPhan > 99 ? "99+" : soPhan}
          </span>
        )}
      </button>

      {mo && (
        <div role="dialog" aria-label="Giỏ chưa gửi"
          className="absolute right-0 top-full z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-[0_18px_44px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-umc-900">
              Giỏ chưa gửi{soPhan ? ` (${soPhan})` : ""}
            </p>
            <button type="button" onClick={() => setMo(false)} className="umc-icon-button !h-8 !w-8" aria-label="Đóng">
              <X size={16} />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-2 text-sm">
            {loi ? <p className="px-2 py-2 text-red-600">{loi}</p>
              : !phan ? <p className="px-2 py-2 text-slate-500">Đang tải…</p>
              : !phan.length ? <p className="px-2 py-2 text-slate-500">Không còn giỏ nào chưa gửi.</p>
              : phan.map((p) => (
                <button key={`${p.dotId}|${p.tenGoi}`} type="button" onClick={() => moChiTiet(p)}
                  title={`Mở giỏ ${p.tenGoi} để xem chi tiết và gửi`}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-red-50">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-900">{p.tenGoi}</span>
                    <span className="block text-[13px] text-slate-600">{p.soNhom} nhóm · {p.soMa} mã hàng</span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-slate-400" />
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
