import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";

// Nhắc khoa khi mã chậm so với cam kết 20/50/80.
//
// CỐ Ý chỉ nhắc, không phạt và không tự đề xuất điều chuyển — dùng ít hơn cam
// kết có thể vì bệnh nhân giảm thật, đó là thông tin cho lần dự trù sau chứ
// không phải lỗi của khoa.
//
// Không lưu "đã xem" xuống DB như thông báo rớt thầu: rớt thầu là SỰ KIỆN xảy
// ra một lần, còn chậm tiến độ là TRẠNG THÁI kéo dài — đóng hôm nay mà tháng
// sau vẫn chậm thì vẫn phải nhắc lại. Đóng chỉ có tác dụng trong phiên.

const themThang = (d, n) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
};
const thangNam = (d) => {
  const x = new Date(d);
  return `T${x.getMonth() + 1}/${x.getFullYear()}`;
};

export default function ThongBaoChamTienDo({ profile, onXemChiTiet }) {
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";
  const [cham, setCham] = useState([]);
  const [som, setSom] = useState([]);
  const [an, setAn] = useState(false);

  useEffect(() => {
    if (laPdd || !profile.khoa) return;
    let huy = false;
    (async () => {
      const [r, m] = await Promise.all([
        fetchAllRows((f, t) => supabase.from("v_tien_do_su_dung")
          .select("goi_id, ma_hang, ten_vat_tu, dvt, sl_trung, da_dung, phan_tram_da_dung,"
                + " nguong_phai_dat, thang_da_qua, ngay_bat_dau, con_lai, ngay_du_kien_het")
          .eq("don_vi", profile.khoa).range(f, t), { order: ["goi_id", "ma_hang", "don_vi"] }),
        supabase.from("moc_cam_ket_su_dung").select("thang_thu"),
      ]);
      if (huy || r.error) return;
      const ds = r.data || [];
      const soThangKy = m.error || !m.data?.length
        ? null : Math.max(...m.data.map((x) => x.thang_thu));
      setCham(ds.filter((x) => x.nguong_phai_dat != null
        && Number(x.phan_tram_da_dung ?? 0) < Number(x.nguong_phai_dat) * 100));
      setSom(soThangKy ? ds.filter((x) => x.ngay_du_kien_het && x.ngay_bat_dau
        && new Date(x.ngay_du_kien_het) < themThang(x.ngay_bat_dau, soThangKy)) : []);
    })();
    return () => { huy = true; };
  }, [laPdd, profile.khoa]);

  if (laPdd || an || (cham.length === 0 && som.length === 0)) return null;

  const nhan = [
    cham.length ? `${cham.length} mã chậm cam kết` : null,
    som.length ? `${som.length} mã sắp hết sớm` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="pointer-events-auto w-full rounded-lg border border-orange-300 bg-white shadow-lg">
      <div className="flex items-start gap-2 border-b border-orange-200 bg-orange-50 px-3 py-2">
        <Clock size={15} className="mt-0.5 shrink-0 text-orange-700" />
        <p className="flex-1 text-sm font-medium text-orange-900">{nhan}</p>
        <button onClick={() => setAn(true)} className="shrink-0 text-orange-700 hover:text-orange-900" aria-label="Đóng">
          <X size={14} />
        </button>
      </div>

      <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto">
        {/* Mã sắp hết đứng TRƯỚC: nó có hạn chót thật (kịp làm thầu bổ sung
            hay không), còn chậm cam kết thì còn thời gian đuổi kịp. */}
        {som.slice(0, 4).map((r) => (
          <li key={`s${r.goi_id}-${r.ma_hang}`} className="px-3 py-2">
            <p className="text-xs font-medium text-slate-800">
              <span className="font-mono text-slate-500">{r.ma_hang}</span> {r.ten_vat_tu}
            </p>
            <p className="text-xs text-orange-700">
              Dự kiến hết {thangNam(r.ngay_du_kien_het)} — còn {Number(r.con_lai).toLocaleString("vi-VN")} {r.dvt},
              nên chuẩn bị thầu bổ sung
            </p>
          </li>
        ))}
        {cham.slice(0, 4).map((r) => (
          <li key={`c${r.goi_id}-${r.ma_hang}`} className="px-3 py-2">
            <p className="text-xs font-medium text-slate-800">
              <span className="font-mono text-slate-500">{r.ma_hang}</span> {r.ten_vat_tu}
            </p>
            <p className="text-xs text-red-700">
              Đã dùng {Number(r.phan_tram_da_dung ?? 0).toFixed(1)}% ·
              tháng {r.thang_da_qua} phải đạt {(Number(r.nguong_phai_dat) * 100).toFixed(0)}%
            </p>
          </li>
        ))}
        {cham.length + som.length > 8 && (
          <li className="px-3 py-1.5 text-xs text-slate-400">
            và {cham.length + som.length - 8} mã nữa…
          </li>
        )}
      </ul>

      <div className="border-t border-slate-100 px-3 py-2">
        <button onClick={() => { onXemChiTiet?.(); setAn(true); }}
          className="w-full rounded-md bg-umc-700 px-2 py-1.5 text-xs font-medium text-white hover:bg-umc-800">
          Xem timeline tiến độ sử dụng
        </button>
      </div>
    </div>
  );
}
