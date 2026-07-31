import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

// QĐ-20 — Khung tổ chức theo GÓI THẦU. Gói là cấp trên cùng, không phải chức năng.
//
// Vì sao: một đề xuất luôn thuộc ĐÚNG MỘT gói, và mỗi gói có biểu mẫu riêng.
// Tổ chức theo chức năng làm màn hình xuất gom lẫn mã của nhiều gói vào một
// file — sai nghiệp vụ, đó là lý do phải đảo lại.

export const GOI = [
  { ma: "dau_thau_rong_rai", ten: "Gói 18 tháng",     mo_ta: "Đấu thầu rộng rãi" },
  { ma: "mua_sam_bo_sung",   ten: "Gói bổ sung",      mo_ta: "3 đợt/năm — T1, T5, T9" },
  { ma: "chi_dinh_thau",     ten: "Gói chỉ định thầu", mo_ta: "Mua nhanh, hạn chế dùng" },
];

export const MAN_HINH_GOI = [
  { ma: "de_xuat",  ten: "Đề xuất số lượng" },
  { ma: "cua_toi",  ten: "Đề xuất của tôi" },
  { ma: "bieu_mau", ten: "Kiểm tra biểu mẫu" },
];

export const MUC_CHUNG = [
  { ma: "thieuhang", ten: "Sổ thiếu hàng" },
  { ma: "sukien",    ten: "Sự kiện nhu cầu" },
  { ma: "tiendo",    ten: "Tiến độ gói thầu" },
  { ma: "lichsu",    ten: "Lịch sử xuất hồ sơ" },
];

/** Đợt đang MỞ của từng gói — khoa chỉ gửi được khi có đợt mở (QĐ-20). */
export function useDotDangMo() {
  const [dot, setDot] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const tai = useCallback(async () => {
    const { data } = await supabase.from("dot_de_xuat").select("*")
      .order("nam", { ascending: false }).order("thang_moc");
    setDot(data || []); setDangTai(false);
  }, []);
  useEffect(() => { tai(); }, [tai]);
  const theoGoi = useMemo(() => {
    const m = {};
    dot.forEach((d) => {
      if (d.trang_thai === "mo" && !m[d.loai_mua_sam]) m[d.loai_mua_sam] = d;
    });
    return m;
  }, [dot]);
  return { dot, theoGoi, dangTai, taiLai: tai };
}

export default function KhungGoiThau({ chon, doiChon, dotTheoGoi, laPdd, children }) {
  const nutGoi = (g) => {
    const dangChon = chon.nhom === "goi" && chon.goi === g.ma;
    const dotMo = dotTheoGoi?.[g.ma];
    return (
      <div key={g.ma}>
        <button onClick={() => doiChon({ nhom: "goi", goi: g.ma, man: chon.man || "de_xuat" })}
          className={`w-full text-left px-3 py-2 rounded-md transition ${
            dangChon ? "bg-teal-700 text-white" : "text-slate-700 hover:bg-slate-100"}`}>
          <span className="block text-sm font-medium leading-tight">{g.ten}</span>
          <span className={`block text-xs leading-tight mt-0.5 ${dangChon ? "text-teal-100" : "text-slate-500"}`}>
            {g.mo_ta}
          </span>
          {/* Trạng thái đợt hiện NGAY trên menu — khoa biết trước có gửi được không,
              thay vì bấm vào rồi mới thấy nút gửi bị khoá. */}
          <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded ${
            dotMo ? (dangChon ? "bg-teal-600 text-white" : "bg-teal-100 text-teal-800")
                  : (dangChon ? "bg-teal-800 text-teal-200" : "bg-slate-200 text-slate-600")}`}>
            {dotMo ? `Đang mở: ${dotMo.ten}` : "Chưa mở đợt"}
          </span>
        </button>

        {dangChon && (
          <div className="ml-3 mt-1 mb-1 border-l-2 border-teal-200 pl-2 space-y-0.5">
            {MAN_HINH_GOI.map((m) => (
              <button key={m.ma} onClick={() => doiChon({ nhom: "goi", goi: g.ma, man: m.ma })}
                className={`w-full text-left px-2 py-1.5 rounded text-sm ${
                  chon.man === m.ma ? "bg-teal-50 text-teal-800 font-medium"
                                    : "text-slate-600 hover:bg-slate-50"}`}>
                {m.ten}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex gap-5 items-start">
      <nav className="w-56 shrink-0 sticky top-4">
        <p className="text-xs font-medium text-slate-400 uppercase px-3 mb-1.5">Theo gói thầu</p>
        <div className="space-y-1">{GOI.map(nutGoi)}</div>

        <p className="text-xs font-medium text-slate-400 uppercase px-3 mt-5 mb-1.5">Dùng chung</p>
        <div className="space-y-0.5">
          {MUC_CHUNG.map((m) => (
            <button key={m.ma} onClick={() => doiChon({ nhom: "chung", man: m.ma })}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                chon.nhom === "chung" && chon.man === m.ma
                  ? "bg-teal-700 text-white font-medium" : "text-slate-700 hover:bg-slate-100"}`}>
              {m.ten}
            </button>
          ))}
          {laPdd && (
            <button onClick={() => doiChon({ nhom: "chung", man: "quanlydot" })}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                chon.man === "quanlydot" ? "bg-teal-700 text-white font-medium"
                                         : "text-slate-700 hover:bg-slate-100"}`}>
              Quản lý đợt đề xuất
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
