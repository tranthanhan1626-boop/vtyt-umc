/*
 * Giỏ rớt của khoa — phần ĐỌC dùng chung cho màn ③ "Mã rớt"
 * (features/GioRotCuaKhoa.jsx), nhãn đỏ ở menu "Gói bổ sung"
 * (features/KhungGoiThau.jsx) và thẻ "Mã rớt cần xử lý" ở trang chính khoa
 * (lib/useTienTrinh.js → components/ManChaoKhoa.jsx).
 *
 * Vì sao tách ra (L10/L14/L15, test 10/10/2026): màn ③ coi một mục là "ĐÃ XỬ
 * LÝ" khi (a) `trang_thai` thuộc DA_XU_LY, HOẶC (b) khoa đã thật sự GỬI đề xuất
 * ở đúng đợt bổ sung mà mục được chuyển tiếp sang (Q04, QĐ chủ dự án 28/09 —
 * suy ra lúc đọc từ `chuyen_tiep_rot_v3` + `proposals`, không ghi vào
 * `xu_ly_gio_rot_v3`). Nhãn đỏ trước đây chỉ xét (a) nên không bao giờ khớp
 * màn ③ ("5 mã rớt" trong khi màn ③ "Chưa xử lý 1"). Gom luật về MỘT chỗ để
 * hai nơi không lệch nhau nữa. Chỉ đọc, không đổi luật.
 */
import { supabase } from "../supabaseClient";

// "Đã xử lý" theo đúng định nghĩa của mục VII.3 — giỏ nháp KHÔNG tính.
export const DA_XU_LY = new Set(["da_submit_bo_sung", "khong_con_nhu_cau"]);

/** Khoá của một mục giỏ rớt (một khoa × một mã quản lý × một phiên Q). */
export const khoaMucRot = (r) => `${r.phien_q_id}|${r.ma_quan_ly}`;

/** Mục còn CHỜ khoa xử lý — cùng luật với ô "Chưa xử lý" của màn ③. */
export function laMucChoXuLy(r, daGuiByKey = {}) {
  return !DA_XU_LY.has(r.trang_thai) && !daGuiByKey[khoaMucRot(r)];
}

/**
 * Đọc đợt bổ sung ĐÍCH của từng mục và mục nào khoa đã gửi ở đợt đó.
 * Chuyển nguyên văn từ GioRotCuaKhoa.jsx (L08b, N3, N4, Q04) — xem chú thích
 * gốc ở đó. `muc` là các dòng `v_gio_rot_v3` (đã lọc so_luong_thieu > 0) của
 * MỘT khoa.
 * @returns {Promise<{ tenDotById: object, chuyenTiep: object, daGui: object }>}
 */
export async function docChuyenTiepVaDaGui(khoaXem, muc) {
  if (!muc?.length) return { tenDotById: {}, chuyenTiep: {}, daGui: {} };
  const dsMa = [...new Set(muc.map((r) => r.ma_quan_ly))];
  const dsPhien = [...new Set(muc.map((r) => r.phien_q_id))];

  // L08b — đợt thật mà `xac_nhan_rot_v3` đã ghi vào `chuyen_tiep_rot_v3`.
  // N3 — cần `created_at` để so với thời điểm gửi đề xuất.
  const { data: dsChuyen } = await supabase
    .from("chuyen_tiep_rot_v3")
    .select("phien_q_id, dot_goi_bo_sung_id, so_luong, created_at, vat_tu!inner(ma_quan_ly)")
    .eq("khoa", khoaXem)
    .in("phien_q_id", dsPhien)
    .in("vat_tu.ma_quan_ly", dsMa);

  // N4 — tên/đợt của cả đợt bổ sung ĐÍCH lẫn đợt GỐC của mỗi mục.
  const dotGoiIds = [...new Set([
    ...(dsChuyen || []).map((c) => c.dot_goi_bo_sung_id),
    ...muc.map((r) => r.dot_goi_id),
  ].filter((v) => v != null))];

  const tenDotById = {};
  if (dotGoiIds.length) {
    const { data: dsDotGoi } = await supabase
      .from("dot_goi")
      .select("id, dot_id, dot_de_xuat!inner(ten, nam, thang_moc)")
      .in("id", dotGoiIds);
    for (const dg of dsDotGoi || []) {
      // M10 — `ten` của đợt bổ sung đã có sẵn tháng, không ghép thêm.
      const dd = dg.dot_de_xuat;
      tenDotById[dg.id] = { dotId: dg.dot_id, nhan: dd?.ten || "" };
    }
  }

  const chuyenTiep = {};
  for (const c of dsChuyen || []) {
    const ma = c.vat_tu?.ma_quan_ly;
    if (!ma || c.dot_goi_bo_sung_id == null) continue;
    const thongTin = tenDotById[c.dot_goi_bo_sung_id];
    if (!thongTin) continue;
    const key = `${c.phien_q_id}|${ma}`;
    if (!chuyenTiep[key]) chuyenTiep[key] = { ...thongTin, createdAt: c.created_at };
  }

  // Q04 + N3 — "đã gửi" chỉ khi đề xuất ở đúng đợt đích được tạo SAU lúc mục
  // được chuyển tiếp vào giỏ.
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
    const guiMoiNhatByKey = {};
    for (const p of dsPropGui || []) {
      const ma = p.vat_tu?.ma_quan_ly;
      if (!ma || !p.created_at) continue;
      const k = `${p.dot_id}|${ma}`;
      const t = new Date(p.created_at).getTime();
      if (!(k in guiMoiNhatByKey) || t > guiMoiNhatByKey[k]) guiMoiNhatByKey[k] = t;
    }
    for (const r of muc) {
      const key = khoaMucRot(r);
      const tt = chuyenTiep[key];
      if (!tt) continue;
      const tGui = guiMoiNhatByKey[`${tt.dotId}|${r.ma_quan_ly}`];
      const tChuyen = tt.createdAt ? new Date(tt.createdAt).getTime() : null;
      if (tGui !== undefined && tChuyen !== null && tGui > tChuyen) {
        daGui[key] = { nhan: tt.nhan };
      }
    }
  }
  return { tenDotById, chuyenTiep, daGui };
}

/**
 * Đếm mục giỏ rớt của khoa: `tong` = mục còn thiếu (> 0), `cho` = mục còn chờ
 * xử lý (luật như màn ③). `dotGoiId` có thì chỉ đếm mục của gói con đó.
 * Lỗi đọc → null (nơi gọi tự hiện "chưa rõ" hoặc ẩn nhãn).
 */
export async function demMucGioRot({ khoa, dotGoiId = null }) {
  if (!khoa) return null;
  let q = supabase.from("v_gio_rot_v3")
    .select("phien_q_id, dot_goi_id, ma_quan_ly, trang_thai")
    .eq("khoa", khoa).gt("so_luong_thieu", 0);
  if (dotGoiId) q = q.eq("dot_goi_id", dotGoiId);
  const { data, error } = await q;
  if (error) return null;
  const muc = data || [];
  // Chỉ những mục chưa có trạng thái xử lý mới cần tra "đã gửi" — đỡ ba lượt
  // đọc khi khoa đã xử lý hết hoặc không có mục nào.
  const conMo = muc.filter((r) => !DA_XU_LY.has(r.trang_thai));
  if (!conMo.length) return { tong: muc.length, cho: 0 };
  const { daGui } = await docChuyenTiepVaDaGui(khoa, conMo);
  return { tong: muc.length, cho: conMo.filter((r) => laMucChoXuLy(r, daGui)).length };
}

/** Tên sự kiện báo "giỏ rớt vừa đổi" — màn ③ / gửi giỏ bổ sung phát, nhãn đỏ
 *  và trang chính nghe để đếm lại ngay (L14), không chờ lượt định kỳ. */
export const SU_KIEN_GIO_ROT_DOI = "vtyt:gio-rot-doi";
export function baoGioRotDoi() {
  try { window.dispatchEvent(new Event(SU_KIEN_GIO_ROT_DOI)); } catch { /* bỏ qua */ }
}
