import { supabase } from "../supabaseClient";

export const MA_DU_AN_STAGING = "ihgfafubwyxnbubmppbj";

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "");

// Local dev và đúng project staging mới hiện dấu xóa. Production không thể
// bật nhầm chỉ bằng UI vì RPC phía DB còn kiểm tra issuer của JWT.
export const BAT_XOA_DU_LIEU_TEST =
  import.meta.env.DEV
  || supabaseUrl.includes(MA_DU_AN_STAGING)
  || import.meta.env.VITE_ENABLE_TEST_DELETE === "true";

export async function xoaDuLieuKiemThu(loai, id) {
  if (!BAT_XOA_DU_LIEU_TEST) {
    throw new Error("Chức năng xóa dữ liệu kiểm thử không được bật ở môi trường này.");
  }
  const { data, error } = await supabase.rpc("xoa_du_lieu_kiem_thu", {
    p_loai: loai,
    p_id: String(id),
    p_xac_nhan: "XOA-DU-LIEU-TEST",
  });
  if (error) {
    const chuaPatch = error.code === "PGRST202"
      || /xoa_du_lieu_kiem_thu/i.test(error.message || "");
    throw new Error(chuaPatch
      ? "Staging chưa có chức năng xóa test. Cần chạy backend/sql/patch_za_xoa_du_lieu_kiem_thu.sql."
      : error.message);
  }
  return data;
}
