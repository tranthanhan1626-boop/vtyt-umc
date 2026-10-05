import { supabase } from "../supabaseClient";
import { dichLoi } from "./dichLoi";
import { hienNutKiemThu } from "./hienNutKiemThu";

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
//
// 05/10/2026 — thêm công tắc ngoài cùng `hienNutKiemThu()` (VITE_HIEN_NUT_KIEM_THU=1):
// không đặt thì TẤT CẢ nút/khối dọn dữ liệu kiểm thử đều ẩn (chuẩn bị demo 14/10);
// các điều kiện cũ bên dưới giữ nguyên làm lớp an toàn thứ hai.
export const BAT_XOA_DU_LIEU_TEST =
  hienNutKiemThu() && (
    import.meta.env.DEV
    || supabaseUrl.includes(MA_DU_AN_STAGING)
    || import.meta.env.VITE_ENABLE_TEST_DELETE === "true"
  );

// 18/09/2026 — chủ dự án chốt: nút xoá dữ liệu test ẨN với tài khoản khoa,
// PĐD vẫn thấy. App.jsx báo vai trò vào đây ngay khi biết hồ sơ; các nút xoá
// đọc lại qua `duocThayNutXoaTest()`. Chỉ là ẩn nút — quyền thật vẫn do RPC
// phía database quyết.
let vaiTroHienTai = null;
export function datVaiTroChoNutXoaTest(role) { vaiTroHienTai = role || null; }
export function duocThayNutXoaTest() {
  return BAT_XOA_DU_LIEU_TEST && (vaiTroHienTai === "admin" || vaiTroHienTai === "dieu_duong");
}

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
      ? "Hệ thống chưa được cập nhật đủ để làm việc này (mã patch_za_xoa_du_lieu_kiem_thu). Vui lòng báo Phòng Điều dưỡng."
      : dichLoi(error));
  }
  return data;
}
