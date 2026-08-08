/*
 * Tải lịch sử sử dụng đã CỘNG SẴN Ở DATABASE.
 *
 * VÌ SAO CÓ FILE NÀY (08/08/2026)
 * Trước đây 4 màn hình đều tự tải `v_usage_monthly` rồi cộng bằng JavaScript,
 * mỗi màn một bản chép tay gần giống nhau. Đo thật trên staging:
 *
 *   v_usage_monthly (mã, KHOA, năm, tháng)  122.159 dòng
 *   gộp toàn viện   (mã, năm, tháng)         40.628 dòng
 *   gộp toàn viện   (mã, năm)                 6.684 dòng
 *
 * PostgREST cắt 1.000 dòng/lần ⇒ ở quy mô đủ mã hàng, màn Tổng hợp PĐD phải
 * chạy tới 123 vòng HTTP TUẦN TỰ chỉ để lấy lịch sử. Mà các màn đó **không
 * dùng cột `don_vi`** — chúng cộng toàn viện rồi vứt chi tiết khoa đi.
 * `patch_zr` thêm 2 view gộp sẵn; file này là chỗ duy nhất gọi chúng.
 *
 * PHẠM VI QUYỀN không đổi: 2 view mới đều `security_invoker = true` như
 * `v_usage_monthly`, nên ĐVSD vẫn chỉ cộng được phần khoa mình, PĐD vẫn thấy
 * toàn viện.
 *
 * LÙI VỀ BẢN CŨ: chưa chạy `patch_zr` thì view chưa tồn tại — tự động quay lại
 * `v_usage_monthly`. Số ra y hệt, chỉ chậm hơn. Không màn nào được vỡ chỉ vì
 * thiếu một patch tối ưu tốc độ.
 */
import { supabase, fetchAllRows } from "../supabaseClient";

// PostgREST: 404 + PGRST205 = "không tìm thấy bảng/view trong schema cache".
const thieuView = (error) =>
  !!error && (error.code === "PGRST205" || /Could not find the table/i.test(error.message || ""));

/**
 * Lịch sử theo NĂM.
 * @returns {Promise<{data: {[maHang: string]: {[nam: number]: number}}, error}>}
 */
export async function taiLichSuTheoNam(codes) {
  if (!codes?.length) return { data: {}, error: null };

  let r = await fetchAllRows((f, t) => supabase.from("v_usage_nam_toan_vien")
    .select("ma_hang, nam, so_luong").in("ma_hang", codes).range(f, t),
  { order: ["ma_hang", "nam"] });

  if (thieuView(r.error)) {
    r = await fetchAllRows((f, t) => supabase.from("v_usage_monthly")
      .select("ma_hang, nam, so_luong").in("ma_hang", codes).range(f, t),
    { order: ["don_vi", "ma_hang", "nam", "thang"] });
  }
  if (r.error) return { data: {}, error: r.error };

  // Vẫn cộng dồn ở đây: bản lùi (v_usage_monthly) trả nhiều dòng cho cùng một
  // (mã, năm), bản mới trả đúng một dòng — cộng dồn đúng cho cả hai.
  const acc = {};
  r.data.forEach((x) => {
    acc[x.ma_hang] = acc[x.ma_hang] || {};
    acc[x.ma_hang][x.nam] = (acc[x.ma_hang][x.nam] || 0) + Number(x.so_luong);
  });
  return { data: acc, error: null };
}

/**
 * Lịch sử theo THÁNG (vẫn cần cho tổng trượt 18 tháng).
 * @returns {Promise<{data: Array<{ma_hang, nam, thang, so_luong}>, error}>}
 */
export async function taiLichSuTheoThang(codes) {
  if (!codes?.length) return { data: [], error: null };

  let r = await fetchAllRows((f, t) => supabase.from("v_usage_thang_toan_vien")
    .select("ma_hang, nam, thang, so_luong").in("ma_hang", codes).range(f, t),
  { order: ["ma_hang", "nam", "thang"] });

  if (thieuView(r.error)) {
    r = await fetchAllRows((f, t) => supabase.from("v_usage_monthly")
      .select("ma_hang, nam, thang, so_luong").in("ma_hang", codes).range(f, t),
    { order: ["don_vi", "ma_hang", "nam", "thang"] });
  }
  return { data: r.data || [], error: r.error };
}

/** Gộp danh sách dòng theo tháng thành Map<ma_hang, Map<monthId, tổng>>. */
export function gomTheoThang(rows, monthId) {
  const m = new Map();
  rows.forEach((r) => {
    if (!m.has(r.ma_hang)) m.set(r.ma_hang, new Map());
    const theoThang = m.get(r.ma_hang);
    const k = monthId(Number(r.nam), Number(r.thang));
    theoThang.set(k, (theoThang.get(k) || 0) + (Number(r.so_luong) || 0));
  });
  return m;
}
