import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Check, Copy, PackageX, RotateCcw } from "lucide-react";
import { supabase } from "../supabaseClient";

// Mục VII của workflow v3 — "Xử lý phần rớt".
//
// Sau đấu thầu, phần Q chưa được đáp ứng của mỗi (khoa × mã quản lý) tự sinh
// thành một mục giỏ rớt. Hệ thống KHÔNG tự tạo đề xuất và KHÔNG tự điền số
// lượng mới — khoa tự quyết đề xuất lại hay thôi.
//
// Trước 19/08/2026 màn này không tồn tại: RPC `cap_nhat_xu_ly_gio_rot_v3` có
// đủ và đúng spec nhưng không được gọi ở bất kỳ đâu trong frontend, nên giỏ
// rớt sinh ra rồi nằm im mãi ở trạng thái "chờ khoa xử lý".
//
// Chỉ coi là ĐÃ XỬ LÝ khi đề xuất bổ sung đã submit chính thức, hoặc khoa/PĐD
// chọn "Không còn nhu cầu". Thêm vào giỏ nháp CHƯA được coi là hoàn tất.

export const NHAN_TRANG_THAI = {
  cho_xu_ly: { nhan: "Chờ xử lý", mau: "bg-amber-50 text-amber-800 border-amber-200" },
  da_vao_gio_nhap: { nhan: "Đã vào giỏ nháp", mau: "bg-sky-50 text-sky-800 border-sky-200" },
  da_submit_bo_sung: { nhan: "Đã submit bổ sung", mau: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  khong_con_nhu_cau: { nhan: "Không còn nhu cầu", mau: "bg-slate-100 text-slate-600 border-slate-200" },
};

// "Đã xử lý" theo đúng định nghĩa của mục VII.3 — giỏ nháp KHÔNG tính.
export const DA_XU_LY = new Set(["da_submit_bo_sung", "khong_con_nhu_cau"]);

export function soNgayCho(updatedAt) {
  if (!updatedAt) return null;
  const ms = Date.now() - new Date(updatedAt).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export default function GioRotCuaKhoa({ profile, khoa, moDotBoSung }) {
  const khoaXem = khoa || profile?.khoa || "";
  const [rows, setRows] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [dangLuu, setDangLuu] = useState("");
  const [ghiChu, setGhiChu] = useState({});
  // Mục VIII.1 — "Hệ thống tìm đợt bổ sung gần nhất đang mở. Nếu chưa có, để
  // trạng thái Chờ mở đợt bổ sung. Khi có đợt mới, gợi ý lại. Hiển thị các đợt
  // bổ sung khác đang chứa cùng mã."
  const [dotBoSungMo, setDotBoSungMo] = useState(null);
  const [dotChuaMa, setDotChuaMa] = useState({});   // ma_quan_ly -> [tên đợt]

  const tai = useCallback(async () => {
    setDangTai(true);
    setLoi("");
    const { data, error } = await supabase
      .from("v_gio_rot_v3")
      .select("*")
      .eq("khoa", khoaXem)
      .order("ma_quan_ly");
    if (error) {
      setLoi(error.code === "42P01" || /gio_rot_v3/i.test(error.message || "")
        ? "Staging chưa có pipeline kết quả v3. Cần chạy backend/sql/patch_zzzzc_v3_ket_qua_thau.sql."
        : error.message);
    } else {
      // Chỉ hiện mục THỰC SỰ thiếu. Mã trúng đủ vẫn nằm trong view (thiếu = 0)
      // nhưng không phải việc của khoa.
      const muc = (data || []).filter((r) => Number(r.so_luong_thieu) > 0);
      setRows(muc);

      // Đợt bổ sung gần nhất ĐANG MỞ. Đọc lại mỗi lần tải nên khi PĐD mở đợt
      // mới thì gợi ý tự xuất hiện — đúng ý "khi có đợt mới, gợi ý lại".
      const { data: dsDot } = await supabase
        .from("dot_de_xuat")
        .select("id, ten, nam, thang_moc, trang_thai")
        .eq("loai_mua_sam", "mua_sam_bo_sung").eq("trang_thai", "mo")
        .order("nam", { ascending: false }).order("thang_moc", { ascending: false })
        .limit(1);
      setDotBoSungMo(dsDot?.[0] || null);

      // Các đợt bổ sung KHÁC mà khoa đã có cùng mã quản lý — để khoa không đề
      // xuất trùng mà không biết.
      const dsMa = [...new Set(muc.map((r) => r.ma_quan_ly))];
      if (dsMa.length) {
        const { data: dsProp } = await supabase
          .from("proposals")
          .select("dot_id, vat_tu!inner(ma_quan_ly), dot_de_xuat!inner(ten, loai_mua_sam)")
          .eq("don_vi", khoaXem).eq("is_current", true).eq("da_rut", false)
          .eq("dot_de_xuat.loai_mua_sam", "mua_sam_bo_sung")
          .in("vat_tu.ma_quan_ly", dsMa).limit(500);
        const gom = {};
        for (const x of dsProp || []) {
          const ma = x.vat_tu?.ma_quan_ly;
          const ten = x.dot_de_xuat?.ten;
          if (!ma || !ten) continue;
          (gom[ma] = gom[ma] || new Set()).add(ten);
        }
        setDotChuaMa(Object.fromEntries(Object.entries(gom).map(([k, v]) => [k, [...v]])));
      } else {
        setDotChuaMa({});
      }
    }
    setDangTai(false);
  }, [khoaXem]);

  useEffect(() => { tai(); }, [tai]);

  const thongKe = useMemo(() => ({
    tong: rows.length,
    choXuLy: rows.filter((r) => !DA_XU_LY.has(r.trang_thai)).length,
    tongThieu: rows.reduce((s, r) => s + Number(r.so_luong_thieu || 0), 0),
  }), [rows]);

  const doiTrangThai = async (r, trangThai) => {
    const khoa = `${r.phien_q_id}|${r.ma_quan_ly}`;
    setLoi("");
    setDangLuu(khoa);
    const { error } = await supabase.rpc("cap_nhat_xu_ly_gio_rot_v3", {
      p_phien_q_id: r.phien_q_id,
      p_ma_quan_ly: r.ma_quan_ly,
      p_khoa: r.khoa,
      p_trang_thai: trangThai,
      p_ghi_chu: (ghiChu[khoa] || "").trim() || null,
    });
    setDangLuu("");
    if (error) { setLoi(error.message); return; }
    await tai();
  };

  if (dangTai) return <p className="text-sm text-slate-500">Đang tải giỏ rớt…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Giỏ rớt của khoa</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Phần số lượng đã mang đi thầu nhưng <b>chưa được đáp ứng</b>. Hệ thống không tự
          tạo đề xuất và không tự điền số — khoa tự quyết có đề xuất lại ở đợt bổ sung hay không.
        </p>
      </div>

      {loi && <p className="text-sm text-red-600">{loi}</p>}

      {rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-sm text-slate-500">
          <PackageX size={20} className="mx-auto mb-2 text-slate-300" />
          Khoa không có mã nào bị thiếu sau đấu thầu.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {[
              { nhan: "Mục trong giỏ rớt", so: thongKe.tong, mau: "bg-slate-50 text-slate-700 border-slate-200" },
              { nhan: "Chưa xử lý", so: thongKe.choXuLy, mau: "bg-amber-50 text-amber-800 border-amber-200" },
              { nhan: "Tổng số lượng thiếu", so: thongKe.tongThieu, mau: "bg-red-50 text-red-800 border-red-200" },
            ].map((t) => (
              <div key={t.nhan} className={`border rounded-lg px-3 py-2 ${t.mau}`}>
                <p className="text-lg font-semibold leading-none">{t.so.toLocaleString("vi-VN")}</p>
                <p className="text-[11px] mt-1">{t.nhan}</p>
              </div>
            ))}
            <button type="button" onClick={tai}
              className="self-start flex items-center gap-1 px-2.5 py-1 mt-1 text-xs rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50">
              <RotateCcw size={12} /> Tải lại
            </button>
          </div>

          <div className="space-y-2">
            {rows.map((r) => {
              const key = `${r.phien_q_id}|${r.ma_quan_ly}`;
              const tt = NHAN_TRANG_THAI[r.trang_thai] || NHAN_TRANG_THAI.cho_xu_ly;
              const daXong = DA_XU_LY.has(r.trang_thai);
              const ngay = soNgayCho(r.updated_at);
              return (
                <div key={key} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 font-mono">{r.ma_quan_ly}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Mang đi thầu <b>{Number(r.so_luong_q).toLocaleString("vi-VN")}</b>
                        {" · "}trúng <b>{Number(r.so_luong_trung).toLocaleString("vi-VN")}</b>
                        {" · "}<span className="text-red-700 font-semibold">
                          thiếu {Number(r.so_luong_thieu).toLocaleString("vi-VN")}
                        </span>
                        {r.rot_toan_bo && " · rớt toàn bộ"}
                      </p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded border ${tt.mau}`}>
                      {tt.nhan}
                      {ngay !== null && !daXong && ngay > 0 ? ` · ${ngay} ngày` : ""}
                    </span>
                  </div>

                  {r.rot_toan_bo && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-red-700">
                      <AlertTriangle size={12} className="shrink-0 mt-px" />
                      Toàn bộ mã quản lý rớt — nếu còn nhu cầu thì phải đề xuất lại ở đợt bổ sung.
                    </p>
                  )}

                  {/* Mục VIII.1 — gợi ý đợt bổ sung. Chỉ GỢI Ý và dẫn đường;
                      hệ thống không tự tạo đề xuất, không tự điền số. */}
                  {!daXong && (
                    <div className="mt-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                      {dotBoSungMo ? (
                        <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-700">
                          <CalendarClock size={12} className="shrink-0 text-umc-700" />
                          Đợt bổ sung gần nhất đang mở: <b>{dotBoSungMo.ten}</b>
                          {dotBoSungMo.thang_moc ? ` (T${dotBoSungMo.thang_moc}/${dotBoSungMo.nam})` : ""}
                          <button type="button" onClick={() => moDotBoSung?.(dotBoSungMo.id)}
                            className="rounded border border-umc-300 bg-white px-1.5 py-0.5 font-medium text-umc-800 hover:bg-umc-50">
                            Sang đợt này để đề xuất lại
                          </button>
                        </p>
                      ) : (
                        <p className="flex items-center gap-1.5 text-[11px] text-amber-800">
                          <CalendarClock size={12} className="shrink-0" />
                          <b>Chờ mở đợt bổ sung</b> — chưa có đợt bổ sung nào đang mở.
                          Khi Phòng Điều dưỡng mở đợt mới, mục này sẽ tự gợi ý.
                        </p>
                      )}
                      {(dotChuaMa[r.ma_quan_ly] || []).length > 0 && (
                        <p className="mt-1 text-[11px] text-sky-800">
                          Mã này khoa đã có ở đợt bổ sung: <b>{dotChuaMa[r.ma_quan_ly].join(" · ")}</b>
                          {" "}— xem lại để khỏi đề xuất trùng (cảnh báo, không chặn).
                        </p>
                      )}
                    </div>
                  )}

                  {!daXong ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        value={ghiChu[key] || ""}
                        onChange={(e) => setGhiChu((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder="Ghi chú (không bắt buộc)"
                        className="flex-1 min-w-[12rem] rounded-md border border-slate-300 px-2 py-1 text-xs" />
                      <button type="button" disabled={dangLuu === key}
                        onClick={() => doiTrangThai(r, "da_vao_gio_nhap")}
                        className="px-2.5 py-1 text-[11px] rounded-md border border-sky-300 text-sky-800 hover:bg-sky-50 disabled:opacity-60">
                        Đang lập đề xuất bổ sung
                      </button>
                      <button type="button" disabled={dangLuu === key}
                        onClick={() => doiTrangThai(r, "khong_con_nhu_cau")}
                        className="px-2.5 py-1 text-[11px] rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                        Không còn nhu cầu
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-700">
                      <Check size={12} /> Đã xử lý
                      {r.ghi_chu ? ` — ${r.ghi_chu}` : ""}
                    </p>
                  )}

                  {r.trang_thai === "da_vao_gio_nhap" && (
                    <p className="mt-1.5 text-[11px] text-sky-800">
                      Mới là giỏ nháp — <b>chưa tính là đã xử lý</b>. Phải gửi giỏ ở đợt bổ sung
                      thì mục này mới đóng lại.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** Template nhắc để PĐD copy sang Teams — web không gửi tin nhắn thay ai. */
export function templateNhac(khoa, muc) {
  const dong = muc.map((m) => `- ${m.ma_quan_ly}: thiếu ${Number(m.so_luong_thieu).toLocaleString("vi-VN")}`);
  return [
    `Kính gửi ${khoa},`,
    "",
    `Sau khi có kết quả đấu thầu, khoa còn ${muc.length} mã quản lý chưa được đáp ứng đủ:`,
    ...dong,
    "",
    "Nhờ khoa vào mục Giỏ rớt của khoa để xác nhận: đề xuất lại ở đợt bổ sung,",
    "hoặc chọn Không còn nhu cầu. Trân trọng.",
  ].join("\n");
}

export { Copy };
