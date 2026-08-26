import { supabase } from "../supabaseClient";

export const MA_DU_AN_STAGING = "ihgfafubwyxnbubmppbj";

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "");

// Local dev và đúng project staging mới hiện dấu xóa. Production không thể
// bật nhầm chỉ bằng UI vì RPC phía DB còn kiểm tra issuer của JWT.
//
// ⚠️ 26/08/2026 — go-live giữa T9 dùng CHÍNH project staging làm hệ thống
// thật, nên nhánh `supabaseUrl.includes(MA_DU_AN_STAGING)` sẽ bật dấu xoá
// ngay trên hệ thống của 62 khoa. Chủ dự án quyết GIỮ để còn xoá trong giai
// đoạn test, và sẽ báo thời điểm gỡ. Việc phải làm trước khi mở cho khoa:
// gỡ 4 RPC (backend/sql/patch_zzzzzz_go_tay_xoa_du_lieu.sql) và đổi dòng
// dưới thành chỉ đọc cờ VITE_ENABLE_TEST_DELETE.
export const BAT_XOA_DU_LIEU_TEST =
  import.meta.env.DEV
  || supabaseUrl.includes(MA_DU_AN_STAGING)
  || import.meta.env.VITE_ENABLE_TEST_DELETE === "true";

export async function xoaDuLieuKiemThu(loai, id) {
  if (!BAT_XOA_DU_LIEU_TEST) {
    throw new Error("Chức năng xóa dữ liệu kiểm thử không được bật ở môi trường này.");
  }
  // Xóa ĐỢT phải đi qua `xoa_dot_kiem_thu_v3`: nhánh 'dot_de_xuat' của
  // `xoa_du_lieu_kiem_thu` viết từ trước v3 nên không dọn 20 bảng v3, và chết
  // ngay ở `delete from proposals` vì `phan_bo_khoa.proposal_id` là NO ACTION.
  // Hàm mới dọn v3 trước rồi mới gọi lại đúng hàm cũ. Các loại còn lại
  // (đề xuất, hồ sơ, phiên tổng hợp) không đụng bảng v3 nên giữ nguyên đường cũ.
  // Hai loại phải đi qua hàm bọc v3 vì nhánh tương ứng trong
  // `xoa_du_lieu_kiem_thu` viết từ trước v3 và vỡ khoá ngoại
  // `phan_bo_khoa_proposal_id_fkey`:
  //   - 'dot_de_xuat'  -> xoa_dot_kiem_thu_v3   (vá 19/08, Lỗi 5)
  //   - 'nhom_de_xuat' -> xoa_de_xuat_kiem_thu_v3 (vá 19/08, cùng lỗi — lần vá
  //     trước chỉ rà nhánh đợt nên bỏ sót nhánh này)
  // Các loại còn lại không đụng bảng v3 nên giữ nguyên đường cũ.
  const { data, error } = loai === "dot_de_xuat"
    ? await supabase.rpc("xoa_dot_kiem_thu_v3", {
      p_id: Number(id),
      p_xac_nhan: "XOA-DU-LIEU-TEST",
    })
    : loai === "nhom_de_xuat"
    ? await supabase.rpc("xoa_de_xuat_kiem_thu_v3", {
      p_id: String(id),
      p_xac_nhan: "XOA-DU-LIEU-TEST",
    })
    : await supabase.rpc("xoa_du_lieu_kiem_thu", {
      p_loai: loai,
      p_id: String(id),
      p_xac_nhan: "XOA-DU-LIEU-TEST",
    });
  if (error) {
    const chuaPatch = error.code === "PGRST202"
      || /xoa_du_lieu_kiem_thu|xoa_dot_kiem_thu_v3|xoa_de_xuat_kiem_thu_v3/i.test(error.message || "");
    throw new Error(chuaPatch
      ? "Staging chưa có chức năng xóa test. Cần chạy backend/sql/patch_za_xoa_du_lieu_kiem_thu.sql."
      : error.message);
  }
  return data;
}
