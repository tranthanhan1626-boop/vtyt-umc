import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ClipboardCopy, RotateCcw, Users } from "lucide-react";
import { supabase } from "../supabaseClient";
import { DA_XU_LY, NHAN_TRANG_THAI, soNgayCho, templateNhac } from "./GioRotCuaKhoa";

// Mục VII.3 — "PĐD có tab Giỏ rớt toàn viện: theo dõi khoa nào chưa xử lý, bao
// nhiêu ngày. Nút Nhắc nhở sinh template tin nhắn để copy sang Teams."
//
// Web KHÔNG gửi tin nhắn thay ai (nguyên tắc nền: Teams là nơi thương lượng),
// nên nút Nhắc chỉ sinh nội dung và copy vào clipboard.
//
// "PĐD được thao tác thay khoa nhưng phải có audit" — RPC
// `cap_nhat_xu_ly_gio_rot_v3` tự ghi `xu_ly_gio_rot_v3_audit` với `nguoi_lam`,
// nên thao tác thay khoa ở đây luôn để lại dấu vết đúng người.

const LOC = [
  { ma: "chua_xu_ly", nhan: "Chưa xử lý" },
  { ma: "tat_ca", nhan: "Tất cả" },
];

export default function GioRotToanVien({ dotGoiIds = [] }) {
  const [rows, setRows] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [loc, setLoc] = useState("chua_xu_ly");
  const [daCopy, setDaCopy] = useState("");
  const [dangLuu, setDangLuu] = useState("");
  const [nhacDangXem, setNhacDangXem] = useState(null);

  const tai = useCallback(async () => {
    setDangTai(true);
    setLoi("");
    let q = supabase.from("v_gio_rot_v3").select("*").order("khoa").order("ma_quan_ly");
    if (dotGoiIds.length) q = q.in("dot_goi_id", dotGoiIds);
    const { data, error } = await q;
    if (error) setLoi(error.message);
    else setRows((data || []).filter((r) => Number(r.so_luong_thieu) > 0));
    setDangTai(false);
  }, [dotGoiIds]);

  useEffect(() => { tai(); }, [tai]);

  // Gom theo khoa — PĐD điều hành theo ĐƠN VỊ, không theo từng mã.
  const theoKhoa = useMemo(() => {
    const m = new Map();
    for (const r of rows) {
      if (!m.has(r.khoa)) m.set(r.khoa, []);
      m.get(r.khoa).push(r);
    }
    return [...m.entries()]
      .map(([khoa, muc]) => {
        const chuaXuLy = muc.filter((x) => !DA_XU_LY.has(x.trang_thai));
        const ngay = chuaXuLy
          .map((x) => soNgayCho(x.updated_at))
          .filter((n) => n !== null);
        return {
          khoa,
          muc,
          chuaXuLy,
          tongThieu: muc.reduce((s, x) => s + Number(x.so_luong_thieu || 0), 0),
          ngayLauNhat: ngay.length ? Math.max(...ngay) : null,
        };
      })
      .filter((k) => (loc === "chua_xu_ly" ? k.chuaXuLy.length > 0 : true))
      .sort((a, b) => b.chuaXuLy.length - a.chuaXuLy.length || a.khoa.localeCompare(b.khoa));
  }, [rows, loc]);

  const tongQuan = useMemo(() => ({
    khoaConNo: new Set(rows.filter((r) => !DA_XU_LY.has(r.trang_thai)).map((r) => r.khoa)).size,
    mucChuaXuLy: rows.filter((r) => !DA_XU_LY.has(r.trang_thai)).length,
    tongThieu: rows.reduce((s, r) => s + Number(r.so_luong_thieu || 0), 0),
  }), [rows]);

  // Luôn HIỆN nội dung nhắc ra màn, rồi mới thử copy. Nếu chỉ dựa vào
  // `navigator.clipboard.writeText`, khi trình duyệt chặn hoặc treo chờ quyền
  // thì người dùng bấm xong không thấy gì — không copy được mà cũng không biết
  // vì sao. Hiện sẵn nội dung thì copy tay lúc nào cũng được.
  const copyNhac = (k) => {
    const noiDung = templateNhac(k.khoa, k.chuaXuLy);
    setNhacDangXem({ khoa: k.khoa, noiDung });
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(noiDung)
        .then(() => {
          setDaCopy(k.khoa);
          setTimeout(() => setDaCopy(""), 2500);
        })
        .catch(() => {});
    }
  };

  const thayKhoa = async (r, trangThai) => {
    const key = `${r.phien_q_id}|${r.ma_quan_ly}|${r.khoa}`;
    setLoi("");
    setDangLuu(key);
    const { error } = await supabase.rpc("cap_nhat_xu_ly_gio_rot_v3", {
      p_phien_q_id: r.phien_q_id,
      p_ma_quan_ly: r.ma_quan_ly,
      p_khoa: r.khoa,
      p_trang_thai: trangThai,
      p_ghi_chu: "PĐD thao tác thay khoa",
    });
    setDangLuu("");
    if (error) { setLoi(error.message); return; }
    await tai();
  };

  if (dangTai) return <p className="text-sm text-slate-500">Đang tải giỏ rớt toàn viện…</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {[
          { nhan: "Khoa còn nợ xử lý", so: tongQuan.khoaConNo, mau: "bg-amber-50 text-amber-800 border-amber-200" },
          { nhan: "Mục chưa xử lý", so: tongQuan.mucChuaXuLy, mau: "bg-slate-50 text-slate-700 border-slate-200" },
          { nhan: "Tổng số lượng thiếu", so: tongQuan.tongThieu, mau: "bg-red-50 text-red-800 border-red-200" },
        ].map((t) => (
          <div key={t.nhan} className={`border rounded-lg px-3 py-2 ${t.mau}`}>
            <p className="text-lg font-semibold leading-none">{t.so.toLocaleString("vi-VN")}</p>
            <p className="text-[11px] mt-1">{t.nhan}</p>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          {LOC.map((l) => (
            <button key={l.ma} type="button" onClick={() => setLoc(l.ma)}
              className={`px-2.5 py-1 text-xs rounded-md border ${
                loc === l.ma ? "border-umc-400 bg-umc-50 text-umc-800 font-medium"
                             : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
              {l.nhan}
            </button>
          ))}
          <button type="button" onClick={tai}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50">
            <RotateCcw size={12} /> Tải lại
          </button>
        </div>
      </div>

      {loi && <p className="text-xs text-red-600 whitespace-pre-wrap">{loi}</p>}

      {nhacDangXem && (
        <div className="rounded-md border border-umc-200 bg-umc-50/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <p className="flex-1 text-[11px] font-semibold text-umc-900">
              Nội dung nhắc — {nhacDangXem.khoa}
              {daCopy === nhacDangXem.khoa && <span className="ml-2 font-normal text-emerald-700">đã copy vào clipboard</span>}
            </p>
            <button type="button" onClick={() => setNhacDangXem(null)}
              className="px-2 py-0.5 text-[11px] rounded border border-slate-300 text-slate-600 hover:bg-white">
              Đóng
            </button>
          </div>
          <textarea readOnly rows={8} value={nhacDangXem.noiDung}
            onFocus={(e) => e.target.select()}
            className="mt-1.5 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-mono" />
          <p className="mt-1 text-[10px] text-slate-500">
            Web không gửi tin nhắn thay ai — copy nội dung này sang Teams.
          </p>
        </div>
      )}

      {theoKhoa.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-sm text-slate-500">
          <Users size={20} className="mx-auto mb-2 text-slate-300" />
          {loc === "chua_xu_ly" ? "Không còn khoa nào nợ xử lý giỏ rớt." : "Chưa có mục giỏ rớt nào."}
        </div>
      ) : theoKhoa.map((k) => (
        <div key={k.khoa} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">{k.khoa}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {k.muc.length} mã quản lý · thiếu tổng <b>{k.tongThieu.toLocaleString("vi-VN")}</b>
                {k.chuaXuLy.length > 0 && (
                  <> · <span className="text-amber-800 font-semibold">{k.chuaXuLy.length} chưa xử lý</span></>
                )}
                {k.ngayLauNhat ? ` · chờ ${k.ngayLauNhat} ngày` : ""}
              </p>
            </div>
            {k.chuaXuLy.length > 0 && (
              <button type="button" onClick={() => copyNhac(k)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-md border border-umc-300 text-umc-800 hover:bg-umc-50">
                {daCopy === k.khoa ? <><Check size={11} /> Đã copy</> : <><ClipboardCopy size={11} /> Nhắc</>}
              </button>
            )}
          </div>

          <table className="mt-2 w-auto text-[11px]">
            <thead>
              <tr className="text-slate-500">
                <th className="px-2 py-0.5 text-left font-medium">Mã quản lý</th>
                <th className="px-2 py-0.5 text-right font-medium">Đi thầu</th>
                <th className="px-2 py-0.5 text-right font-medium">Trúng</th>
                <th className="px-2 py-0.5 text-right font-medium">Thiếu</th>
                <th className="px-2 py-0.5 text-left font-medium">Trạng thái</th>
                <th className="px-2 py-0.5 text-left font-medium">Thao tác thay khoa</th>
              </tr>
            </thead>
            <tbody>
              {k.muc.map((r) => {
                const key = `${r.phien_q_id}|${r.ma_quan_ly}|${r.khoa}`;
                const tt = NHAN_TRANG_THAI[r.trang_thai] || NHAN_TRANG_THAI.cho_xu_ly;
                const daXong = DA_XU_LY.has(r.trang_thai);
                return (
                  <tr key={key} className="border-t border-slate-100">
                    <td className="px-2 py-0.5 font-mono">{r.ma_quan_ly}</td>
                    <td className="px-2 py-0.5 text-right font-mono">{Number(r.so_luong_q).toLocaleString("vi-VN")}</td>
                    <td className="px-2 py-0.5 text-right font-mono">{Number(r.so_luong_trung).toLocaleString("vi-VN")}</td>
                    <td className="px-2 py-0.5 text-right font-mono font-semibold text-red-700">
                      {Number(r.so_luong_thieu).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-2 py-0.5">
                      <span className={`px-1.5 py-0.5 rounded border ${tt.mau}`}>{tt.nhan}</span>
                    </td>
                    <td className="px-2 py-0.5">
                      {daXong ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <button type="button" disabled={dangLuu === key}
                          onClick={() => thayKhoa(r, "khong_con_nhu_cau")}
                          className="px-2 py-0.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                          Đánh dấu không còn nhu cầu
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
