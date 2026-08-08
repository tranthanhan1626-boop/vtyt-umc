import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "../supabaseClient";

// QĐ-23 — Thông báo góc màn hình khi mã của khoa bị rớt thầu.
//
// Vì sao có màn này: giá trị của cả vòng khép kín nằm ở chỗ KHOA BIẾT SỚM.
// Phát hiện lúc kho báo hết hàng là đã muộn 3–4 tháng.
//
// Bấm xem chi tiết dẫn tới tab Tiến độ gói thầu, nơi khoa chủ động chọn đợt
// bổ sung rồi đưa mã + số lượng đề xuất gốc vào giỏ để chỉnh sửa.

const NHAN_MOC = {
  chao_gia: "chào giá", mo_thau: "mở thầu", danh_gia: "đánh giá",
};

export default function ThongBaoRotThau({ profile, onXemChiTiet }) {
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";
  const [rows, setRows] = useState([]);
  const [an, setAn] = useState(false);

  const tai = useCallback(async () => {
    if (laPdd || !profile.khoa) return;
    const { data } = await supabase.from("v_ket_qua_thau_theo_khoa")
      .select("ma_hang, ten_vat_tu, dvt, ma_moc_rot, so_luong_thieu, ten_goi, goi_id")
      .eq("don_vi", profile.khoa).eq("khoa_da_xem", false)
      .gt("so_luong_thieu", 0);
    setRows(data || []);
  }, [laPdd, profile.khoa]);
  useEffect(() => { tai(); }, [tai]);

  const danhDauDaXem = async () => {
    // Khoa CHỈ đổi được cột này — trigger chặn mọi cột kết quả khác.
    await supabase.from("goi_thau_ket_qua_ma").update({ khoa_da_xem: true })
      .eq("don_vi", profile.khoa).eq("khoa_da_xem", false);
    setRows([]);
  };

  if (laPdd || an || rows.length === 0) return null;

  return (
    <div className="pointer-events-auto w-full rounded-lg border border-amber-300 bg-white shadow-lg">
      <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2">
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-700" />
        <p className="flex-1 text-sm font-medium text-amber-900">
          {rows.length} mã của khoa bị rớt thầu
        </p>
        <button onClick={() => setAn(true)} className="shrink-0 text-amber-700 hover:text-amber-900" aria-label="Đóng">
          <X size={14} />
        </button>
      </div>

      <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto">
        {rows.slice(0, 6).map((r) => (
          <li key={`${r.goi_id}-${r.ma_hang}`} className="px-3 py-2">
            <p className="text-xs font-medium text-slate-800">
              <span className="font-mono text-slate-500">{r.ma_hang}</span> {r.ten_vat_tu}
            </p>
            <p className="text-xs text-red-700">
              Thiếu {Number(r.so_luong_thieu).toLocaleString("vi-VN")} {r.dvt}
              {r.ma_moc_rot ? ` · rớt ở ${NHAN_MOC[r.ma_moc_rot]}` : ""}
            </p>
          </li>
        ))}
        {rows.length > 6 && (
          <li className="px-3 py-1.5 text-xs text-slate-400">và {rows.length - 6} mã nữa…</li>
        )}
      </ul>

      <div className="flex gap-2 border-t border-slate-100 px-3 py-2">
        <button onClick={() => { onXemChiTiet?.(); setAn(true); }}
          className="flex-1 rounded-md bg-umc-700 px-2 py-1.5 text-xs font-medium text-white hover:bg-umc-800">
          Xem mã rớt thầu
        </button>
        <button onClick={danhDauDaXem}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          Đã xem
        </button>
      </div>
    </div>
  );
}
