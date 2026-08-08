/*
 * Lọc đề xuất theo ĐÚNG đợt bổ sung (patch_zt — dứt điểm bẫy 16).
 *
 * Gói 18T chỉ cần (loai_mua_sam, goi) là đủ. Gói bổ sung thì không: cả 3 đợt
 * T1/T5/T9 đều là `loai_mua_sam = 'mua_sam_bo_sung'` và `goi = null`, chúng chỉ
 * khác nhau ở `dot_de_xuat.thang_moc`. Không lọc thêm thì bấm "Bổ sung tháng 1"
 * lại thấy luôn cả đề xuất của tháng 5 và tháng 9.
 */
import { supabase } from "../supabaseClient";

/**
 * Danh sách dot_id thuộc đúng gói con đang xem.
 * @returns {Promise<number[] | null>} null = KHÔNG cần lọc theo đợt
 *   (gói 18T, hoặc khoá "bo-sung" gộp cả 3 đợt). Mảng rỗng = có ràng buộc đợt
 *   nhưng chưa đợt nào được tạo -> phải ra 0 dòng, đừng nhầm thành "lấy tất".
 */
export async function taiDotIdCuaGoi(bo) {
  if (bo?.thang_moc == null) return null;
  const { data, error } = await supabase.from("dot_de_xuat")
    .select("id")
    .eq("loai_mua_sam", bo.loai_mua_sam)
    .eq("thang_moc", bo.thang_moc);
  if (error) return null;   // lỗi mạng thì thà hiện thừa còn hơn hiện trắng
  return (data || []).map((d) => d.id);
}

/** Gắn điều kiện đợt vào query proposals, nếu gói con có ràng buộc đợt. */
export function locTheoDot(query, dsDotId) {
  if (dsDotId == null) return query;
  // Mảng rỗng: `.in("dot_id", [])` trả 0 dòng — đúng ý.
  return query.in("dot_id", dsDotId);
}
