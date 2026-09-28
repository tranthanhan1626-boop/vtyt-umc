import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Check, Copy, PackageX, RotateCcw } from "lucide-react";
import { supabase } from "../supabaseClient";
import { dichLoi } from "../lib/dichLoi";

// Mục VII của workflow v3 — "Xử lý phần rớt".
//
// Sau đấu thầu, phần Q chưa được đáp ứng của mỗi (khoa × mã quản lý) tự sinh
// thành một mục giỏ rớt (view `v_gio_rot_v3`, KHÔNG phụ thuộc "Xác nhận rớt"
// — SO_CHUNG.md mục 5). Khi PĐD bấm "Xác nhận rớt", phần CHƯA đổ sang mã
// tương đương được hệ tự CHUYỂN TIẾP vào giỏ của khoa ở đợt bổ sung gần nhất
// (Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md mục 6.1), số điền sẵn =
// số rớt nhưng chỉ là GỢI Ý — khoa sửa số rồi tự bấm "Gửi đề xuất" mới thành
// đề xuất chính thức. Luật cũ "không tự tạo đề xuất, không tự điền số lượng"
// đã bị đảo 21/08/2026 (06_DUNG_LAM_LAI.md:43).
//
// Trước 19/08/2026 màn này không tồn tại: RPC `cap_nhat_xu_ly_gio_rot_v3` có
// đủ và đúng spec nhưng không được gọi ở bất kỳ đâu trong frontend, nên giỏ
// rớt sinh ra rồi nằm im mãi ở trạng thái "chờ khoa xử lý".
//
// 28/09/2026 (Q04, QĐ chủ dự án — KIEM_DINH_DOC_LAP.md #2) — "ĐÃ XỬ LÝ" gồm:
// khoa/PĐD chọn "Không còn nhu cầu" (cap_nhat_xu_ly_gio_rot_v3), HOẶC khoa đã
// thật sự GỬI đề xuất ở đúng đợt bổ sung mà mục đó được chuyển tiếp sang —
// đọc từ `chuyen_tiep_rot_v3` + `proposals` (chỉ đọc, không có nút riêng cho
// việc này).

export const NHAN_TRANG_THAI = {
  cho_xu_ly: { nhan: "Chờ xử lý", mau: "bg-amber-50 text-amber-800 border-amber-200" },
  da_vao_gio_nhap: { nhan: "Đã vào giỏ nháp", mau: "bg-sky-50 text-sky-800 border-sky-200" },
  da_submit_bo_sung: { nhan: "Đã gửi bổ sung", mau: "bg-emerald-50 text-emerald-800 border-emerald-200" },
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
  // L08b (KIEM_DINH_DOC_LAP.md #3) — ĐỢT THẬT của từng mục, đọc từ
  // `chuyen_tiep_rot_v3` (đợt mà "Xác nhận rớt" đã đưa mã của mục này vào),
  // không còn đoán "đợt sớm nhất đang mở". key = `${phien_q_id}|${ma_quan_ly}`.
  const [chuyenTiepByKey, setChuyenTiepByKey] = useState({});
  // Q04 (QĐ chủ dự án 28/09, lượt 2 — KIEM_DINH_DOC_LAP.md #2) — mục mà khoa
  // đã GỬI đề xuất chính thức ở đúng đợt bổ sung đích. key giống trên.
  const [daGuiByKey, setDaGuiByKey] = useState({});
  // N4 (KIEM_DINH_DOC_LAP_LUOT2.md) — thông tin đợt của mỗi dot_goi_id gặp
  // trong dữ liệu (đợt GỐC của mục lẫn đợt bổ sung ĐÍCH đã chuyển tiếp tới),
  // để vừa ghi "Rớt từ: …" vừa loại đợt gốc khỏi cảnh báo trùng (N4).
  const [dotGoiInfoById, setDotGoiInfoById] = useState({});
  const [dotChuaMa, setDotChuaMa] = useState({});   // ma_quan_ly -> [{dotId, ten}]

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
        ? "Hệ thống chưa được cập nhật đủ để làm việc này (mã patch_zzzzc_v3_ket_qua_thau). Vui lòng báo Phòng Điều dưỡng."
        : dichLoi(error));
    } else {
      // Chỉ hiện mục THỰC SỰ thiếu. Mã trúng đủ vẫn nằm trong view (thiếu = 0)
      // nhưng không phải việc của khoa.
      const muc = (data || []).filter((r) => Number(r.so_luong_thieu) > 0);
      setRows(muc);

      if (!muc.length) {
        setChuyenTiepByKey({});
        setDaGuiByKey({});
        setDotGoiInfoById({});
        setDotChuaMa({});
        setDangTai(false);
        return;
      }

      const dsMa = [...new Set(muc.map((r) => r.ma_quan_ly))];
      const dsPhien = [...new Set(muc.map((r) => r.phien_q_id))];

      // L08b (KIEM_DINH_DOC_LAP.md #3) — ĐỢT THẬT của từng mục, không đoán
      // "đợt sớm nhất đang mở". `xac_nhan_rot_v3` ghi đúng đợt đích vào
      // `chuyen_tiep_rot_v3.dot_goi_bo_sung_id` cho mỗi (phien_q_id, ma_hang,
      // khoa) — backend/sql/patch_zzzzzy_gio_rot_du_truong.sql:140-147. Nối
      // về mục của màn (theo ma_quan_ly, không phải ma_hang) qua vat_tu.
      // N3 (KIEM_DINH_DOC_LAP_LUOT2.md) — cần thêm `created_at` để biết mục
      // được chuyển tiếp vào giỏ LÚC NÀO (xem so sánh với `proposals.created_at`
      // ở dưới).
      const { data: dsChuyen } = await supabase
        .from("chuyen_tiep_rot_v3")
        .select("phien_q_id, dot_goi_bo_sung_id, so_luong, created_at, vat_tu!inner(ma_quan_ly)")
        .eq("khoa", khoaXem)
        .in("phien_q_id", dsPhien)
        .in("vat_tu.ma_quan_ly", dsMa);

      // N4 — cần tên/đợt của CẢ đợt bổ sung ĐÍCH (dot_goi_bo_sung_id, đã có
      // từ trước) LẪN đợt GỐC của mỗi mục (`r.dot_goi_id`, cột có sẵn trong
      // `v_gio_rot_v3`), để: (1) ghi "Rớt từ: …" trên mỗi mục, và (2) loại
      // đúng đợt gốc đó khỏi cảnh báo "đã có ở đợt bổ sung …" (N4).
      const dotGoiIds = [...new Set([
        ...(dsChuyen || []).map((c) => c.dot_goi_bo_sung_id),
        ...muc.map((r) => r.dot_goi_id),
      ].filter((v) => v != null))];

      // Tên đợt thật: dot_goi.id -> dot_goi.dot_id -> dot_de_xuat.
      let tenDotById = {};
      if (dotGoiIds.length) {
        const { data: dsDotGoi } = await supabase
          .from("dot_goi")
          .select("id, dot_id, dot_de_xuat!inner(ten, nam, thang_moc)")
          .in("id", dotGoiIds);
        for (const dg of dsDotGoi || []) {
          const dd = dg.dot_de_xuat;
          // M10 (kiểm định độc lập lượt 3) — trước đây khi có `thang_moc` thì
          // ghép thêm " (T{thang_moc}/{nam})" vào sau `ten`, ra "Mua sắm bổ
          // sung đợt tháng 1/2027 (T1/2027)": lặp tháng hai lần. Đợt bổ sung
          // là đợt DUY NHẤT có `thang_moc` (xem insert ở
          // patch_zzzzz_vong_khep_kin.sql dòng ~386, đặt tên bằng chính
          // format('Mua sắm bổ sung đợt tháng %s/%s', v_moc, v_nam) — cùng
          // `v_moc`/`v_nam` với `thang_moc`/`nam`), nên `ten` LUÔN đã có sẵn
          // tháng khi `thang_moc` khác null — không cần và không được ghép
          // thêm. Đợt 18 tháng không có `thang_moc` nên `ten` của nó (vd
          // "Gói 18 tháng 1/2028 - 6/2029") giữ nguyên, không đổi.
          tenDotById[dg.id] = { dotId: dg.dot_id, nhan: dd?.ten || "" };
        }
      }
      setDotGoiInfoById(tenDotById);

      const chuyenTiep = {};
      for (const c of dsChuyen || []) {
        const ma = c.vat_tu?.ma_quan_ly;
        if (!ma || c.dot_goi_bo_sung_id == null) continue;
        const thongTin = tenDotById[c.dot_goi_bo_sung_id];
        if (!thongTin) continue;
        const key = `${c.phien_q_id}|${ma}`;
        // Một mã quản lý gom nhiều mã hàng; nếu chúng lỡ rơi vào hai đợt bổ
        // sung khác nhau (chưa gặp trong dữ liệu đã kiểm — (c)) thì giữ đợt
        // (và thời điểm chuyển tiếp) gặp trước, không cố gộp.
        if (!chuyenTiep[key]) chuyenTiep[key] = { ...thongTin, createdAt: c.created_at };
      }
      setChuyenTiepByKey(chuyenTiep);

      // Q04 + N3 (QĐ chủ dự án — KIEM_DINH_DOC_LAP.md #2, kẽ hở N3 của
      // KIEM_DINH_DOC_LAP_LUOT2.md): mục coi là ĐÃ XỬ LÝ khi khoa đã GỬI mã
      // đó ở đúng đợt bổ sung đích VÀ đề xuất đó được tạo SAU khi mã rớt
      // được chuyển tiếp vào giỏ (`chuyen_tiep_rot_v3.created_at`) — nếu
      // không thì "Đã gửi" có thể là một đề xuất CŨ hơn (gửi trước khi mã
      // này rớt vào giỏ, hoặc một mã hàng KHÁC cùng nhóm), và phần rớt thật
      // vẫn còn nằm im trong giỏ nháp (chỉ đọc, không thêm nút).
      const dotIdCanKiem = [...new Set(
        Object.values(chuyenTiep).map((c) => c.dotId).filter((v) => v != null),
      )];
      const daGui = {};
      if (dotIdCanKiem.length) {
        const { data: dsPropGui } = await supabase
          .from("proposals")
          .select("dot_id, created_at, vat_tu!inner(ma_quan_ly)")
          .eq("don_vi", khoaXem).eq("is_current", true).eq("da_rut", false)
          .in("dot_id", dotIdCanKiem)
          .in("vat_tu.ma_quan_ly", dsMa);
        // Một (dot_id, ma_quan_ly) có thể có nhiều mã hàng/nhiều đề xuất —
        // giữ mốc GẦN NHẤT (mới nhất), vì chỉ cần MỘT đề xuất đủ mới là đã
        // gửi phần rớt.
        const guiMoiNhatByKey = {};
        for (const p of dsPropGui || []) {
          const ma = p.vat_tu?.ma_quan_ly;
          if (!ma || !p.created_at) continue;
          const k = `${p.dot_id}|${ma}`;
          const t = new Date(p.created_at).getTime();
          if (!(k in guiMoiNhatByKey) || t > guiMoiNhatByKey[k]) guiMoiNhatByKey[k] = t;
        }
        for (const r of muc) {
          const key = `${r.phien_q_id}|${r.ma_quan_ly}`;
          const tt = chuyenTiep[key];
          if (!tt) continue;
          const tGui = guiMoiNhatByKey[`${tt.dotId}|${r.ma_quan_ly}`];
          const tChuyen = tt.createdAt ? new Date(tt.createdAt).getTime() : null;
          // Không rõ thời điểm chuyển tiếp thì KHÔNG tính là đã gửi — an
          // toàn hơn là báo sai "Đã gửi" (N3).
          if (tGui !== undefined && tChuyen !== null && tGui > tChuyen) {
            daGui[key] = { nhan: tt.nhan };
          }
        }
      }
      setDaGuiByKey(daGui);

      // Các đợt bổ sung KHÁC mà khoa đã có cùng mã quản lý — để khoa không đề
      // xuất trùng mà không biết. (Mục đã "Đã gửi" ở trên thì màn không còn
      // hiện khối cảnh báo này nữa — xem nhánh render `daXong`.) N4 — giữ cả
      // `dot_id` để lúc hiện loại được đúng đợt GỐC của từng mục.
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
        if (!ma || !ten || x.dot_id == null) continue;
        (gom[ma] = gom[ma] || new Map()).set(x.dot_id, ten);
      }
      setDotChuaMa(Object.fromEntries(
        Object.entries(gom).map(([k, v]) => [k, [...v].map(([dotId, ten]) => ({ dotId, ten }))]),
      ));
    }
    setDangTai(false);
  }, [khoaXem]);

  useEffect(() => { tai(); }, [tai]);

  const thongKe = useMemo(() => ({
    tong: rows.length,
    // Q04 — mục "đã gửi ở đợt bổ sung" đếm vào đã xử lý, không phải chưa xử lý.
    choXuLy: rows.filter((r) => !DA_XU_LY.has(r.trang_thai)
      && !daGuiByKey[`${r.phien_q_id}|${r.ma_quan_ly}`]).length,
    tongThieu: rows.reduce((s, r) => s + Number(r.so_luong_thieu || 0), 0),
  }), [rows, daGuiByKey]);

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
    if (error) { setLoi(dichLoi(error)); return; }
    await tai();
  };

  if (dangTai) return <p className="text-sm text-slate-500">Đang tải giỏ rớt…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Giỏ rớt của khoa</h2>
        {/* L14 (KIEM_DINH_DOC_LAP.md #11) — viết có điều kiện theo
            01_NGHIEP_VU_HIEN_HANH.md mục 6.1 bước 1, 3, 4 và D11: mã rớt chỉ
            vào giỏ SAU khi PĐD bấm "Xác nhận rớt"; phần đã đổ sang mã tương
            đương thì không vào giỏ; số điền sẵn cộng thêm vào số khoa đã có,
            không ghi đè. */}
        <p className="text-sm text-slate-500 mt-0.5">
          Phần số lượng đã mang đi thầu nhưng <b>chưa được đáp ứng</b>. Sau khi Phòng Điều
          dưỡng bấm <b>"Xác nhận rớt"</b>, phần <b>chưa đổ sang mã tương đương</b> mới được
          đưa vào <b>giỏ</b> của khoa ở đợt bổ sung — số lượng điền sẵn chỉ là <b>gợi ý</b>{" "}
          (khoa đã có số ở đợt đó thì cộng thêm, không ghi đè); khoa tự sửa lại cho đúng nhu
          cầu rồi bấm <b>"Gửi đề xuất"</b> ở Gói bổ sung, chưa gửi thì chưa thành đề xuất
          chính thức.
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
              className="self-start flex items-center gap-1 px-3 py-1.5 mt-1 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
              <RotateCcw size={12} /> Tải lại
            </button>
          </div>

          <div className="space-y-2">
            {rows.map((r) => {
              const key = `${r.phien_q_id}|${r.ma_quan_ly}`;
              // Q04 — khoa đã gửi đề xuất ở đúng đợt đích thì coi là đã xử lý,
              // dù `xu_ly_gio_rot_v3` (trang_thai) chưa có dòng nào cho mục này.
              const daGui = daGuiByKey[key];
              const daXong = DA_XU_LY.has(r.trang_thai) || !!daGui;
              const tt = daGui
                ? { nhan: `Đã gửi ở đợt ${daGui.nhan}`, mau: NHAN_TRANG_THAI.da_submit_bo_sung.mau }
                : (NHAN_TRANG_THAI[r.trang_thai] || NHAN_TRANG_THAI.cho_xu_ly);
              const thongTinDot = chuyenTiepByKey[key];
              const ngay = soNgayCho(r.updated_at);
              // N4 (KIEM_DINH_DOC_LAP_LUOT2.md) — đợt GỐC của mục (nơi mã
              // này rớt ra, cột `dot_goi_id` của `v_gio_rot_v3`), để ghi
              // "Rớt từ: …" và loại đúng đợt này khỏi cảnh báo trùng bên dưới.
              const dotGoc = dotGoiInfoById[r.dot_goi_id];
              const canhBaoTrungDot = (dotChuaMa[r.ma_quan_ly] || [])
                .filter((d) => d.dotId !== dotGoc?.dotId)
                .map((d) => d.ten);
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
                      {dotGoc?.nhan && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Rớt từ: <b>{dotGoc.nhan}</b>
                        </p>
                      )}
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

                  {/* L08b (KIEM_DINH_DOC_LAP.md #3) — dẫn khoa sang ĐÚNG đợt
                      bổ sung thật mà "Xác nhận rớt" đã chuyển tiếp mục này
                      vào (chuyen_tiep_rot_v3), không đoán "đợt sớm nhất đang
                      mở". Luật "hệ tự điền số gợi ý, khoa tự sửa và tự bấm
                      'Gửi đề xuất'" — 06_DUNG_LAM_LAI.md:43. */}
                  {!daXong && (
                    <div className="mt-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                      {thongTinDot ? (
                        <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-700">
                          <CalendarClock size={12} className="shrink-0 text-umc-700" />
                          Đã chuyển tiếp vào đợt bổ sung: <b>{thongTinDot.nhan}</b>
                          <button type="button" onClick={() => moDotBoSung?.(thongTinDot.dotId)}
                            className="rounded-md bg-umc-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-umc-700">
                            Sang đợt này để đề xuất lại
                          </button>
                        </p>
                      ) : (
                        // N5 (KIEM_DINH_DOC_LAP_LUOT2.md) — KHÔNG dùng `flex`
                        // trên chính thẻ <p>: ở 1280×800, mỗi đoạn xen giữa
                        // các <b> từng thành một ô flex riêng và câu vỡ cột.
                        // Gói toàn bộ chữ vào một <span>, chỉ icon đứng ngoài.
                        <p className="text-[11px] text-amber-800">
                          <CalendarClock size={12} className="inline-block mr-1.5 -mt-px align-text-top shrink-0" />
                          <span>
                            <b>Chưa vào đợt bổ sung nào</b> — có thể do Phòng Điều dưỡng
                            <b> chưa bấm "Xác nhận rớt"</b> cho mục này, hoặc phần rớt đã được
                            <b> đổ hết sang mã tương đương</b> (không cần chuyển tiếp).
                          </span>
                        </p>
                      )}
                      {canhBaoTrungDot.length > 0 && (
                        <p className="mt-1 text-[11px] text-sky-800">
                          Mã này khoa đã có ở đợt bổ sung: <b>{canhBaoTrungDot.join(" · ")}</b>
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
                        className="flex-1 min-w-[12rem] rounded-md border border-slate-300 px-2 py-1.5 text-xs" />
                      <button type="button" disabled={dangLuu === key}
                        onClick={() => doiTrangThai(r, "khong_con_nhu_cau")}
                        className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                        Không còn nhu cầu
                      </button>
                    </div>
                  ) : daGui ? (
                    // N6a (KIEM_DINH_DOC_LAP_LUOT2.md) — không lặp lại "Đã gửi
                    // ở đợt …" lần hai; nhãn xanh ở góc phải phía trên đã ghi
                    // rõ tên đợt rồi.
                    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-700">
                      <Check size={12} /> Đã xử lý
                    </p>
                  ) : (
                    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-700">
                      <Check size={12} /> Đã xử lý
                      {r.ghi_chu ? ` — ${r.ghi_chu}` : ""}
                    </p>
                  )}

                  {/* L14 (KIEM_DINH_DOC_LAP.md #11) — tên nút thật là "Gửi đề
                      xuất" (Function1.jsx:2418), không phải tên luồng cũ đã
                      bỏ; mục đóng lại khi khoa bấm nút đó (Q04), không phải
                      khi thêm mã vào giỏ nháp. */}
                  {r.trang_thai === "da_vao_gio_nhap" && !daGui && (
                    <p className="mt-1.5 text-[11px] text-sky-800">
                      Mới là giỏ nháp — <b>chưa tính là đã xử lý</b>. Bấm <b>"Gửi đề xuất"</b> ở
                      Gói bổ sung thì mục này mới đóng lại.
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
