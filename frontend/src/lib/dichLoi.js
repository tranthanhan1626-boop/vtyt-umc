/*
 * dichLoi — đổi lỗi của hệ thống thành câu tiếng Việt người dùng hiểu được.
 *
 * Vì sao có file này (khảo sát UI/UX 18/09/2026): khoảng 70 chỗ in thẳng
 * `error.message` ra màn, nên khoa đọc được những câu như "JWT expired",
 * "new row violates row-level security policy…" hay tên cột database
 * ("ten_vt_2627").
 *
 * CHỈ dùng ở chỗ HIỂN THỊ. Mọi chỗ code còn dò `error.message` / `error.code`
 * để rẽ nhánh (vd. `/submit_proposal_group_v2/i.test(error.message)`) phải
 * giữ nguyên bản gốc — dịch ở đó là làm hỏng nhánh.
 *
 * Lỗi do trigger/RPC của database ném ra đã viết sẵn bằng tiếng Việt nên đi
 * thẳng, chỉ thay tên cột kỹ thuật bằng tên cột người dùng đang thấy.
 */
import { COT_KHOA, COT_PDD, COT_QUA_TRINH_MO_RONG } from "./cotChuan";

const NHAN_COT = new Map(
  [...COT_KHOA, ...COT_PDD, ...COT_QUA_TRINH_MO_RONG].map((c) => [c.key, c.nhan]),
);
// Hai tên cột chỉ có ở bảng tổng hợp phía database.
NHAN_COT.set("sl_de_xuat_2627", "Số lượng đề xuất");
NHAN_COT.set("giai_trinh", "Giải trình");

const CO_DAU_TIENG_VIET = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

const LOI_HE_THONG = "Hệ thống chưa được cập nhật đủ để làm việc này. Vui lòng báo Phòng Điều dưỡng.";

// [điều kiện trên message hoặc code, câu tiếng Việt]
const LUAT = [
  // L4 (bấm thử 03/10/2026, THỢ B — báo THỢ A trước khi sửa): tab mở từ bản
  // cũ, web vừa build/đẩy bản mới → tải phần chia nhỏ (vd thư viện Excel) theo
  // tên file cũ thất bại. Lỗi này cũng chứa "Failed to fetch" nên PHẢI đứng
  // TRƯỚC luật mất kết nối, nếu không bị dịch nhầm thành "Mất kết nối…".
  // Chrome: "Failed to fetch dynamically imported module" · Safari: "Importing
  // a module script failed" · Firefox: "error loading dynamically imported
  // module" · Vite: "Unable to preload CSS" · webpack: ChunkLoadError (ở name).
  [/dynamically imported module|Importing a module script failed|Unable to preload CSS|ChunkLoadError|Loading chunk \S+ failed/i,
    "Web vừa được cập nhật — bấm Tải lại trang (F5) rồi làm lại."],
  [/Failed to fetch|NetworkError|Load failed|fetch failed|ERR_NETWORK/i,
    "Mất kết nối tới máy chủ. Kiểm tra mạng rồi bấm Tải lại."],
  [/JWT expired|invalid JWT|refresh token|Auth session missing/i,
    "Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất rồi đăng nhập lại."],
  [/Invalid login credentials/i, "Sai email hoặc mật khẩu."],
  [/Email not confirmed/i, "Email chưa được xác nhận. Mở hộp thư và bấm vào link xác nhận trước."],
  [/User already registered|already been registered/i, "Email này đã có tài khoản."],
  [/rate limit|too many requests/i, "Thao tác quá nhanh. Vui lòng chờ ít phút rồi thử lại."],
  [/row-level security|permission denied|^42501$/i,
    "Tài khoản của bạn không có quyền làm thao tác này. Nếu cần, liên hệ Phòng Điều dưỡng."],
  [/duplicate key|^23505$/i, "Dữ liệu này đã có rồi, không lưu trùng được."],
  [/foreign key|^23503$/i, "Dữ liệu này đang được nơi khác dùng tới nên chưa đổi hoặc xoá được."],
  [/not-null|^23502$/i, "Còn thiếu thông tin bắt buộc."],
  [/check constraint|^23514$|invalid input syntax/i, "Giá trị vừa nhập không hợp lệ."],
  [/statement timeout|canceling statement|^57014$/i,
    "Máy chủ xử lý quá lâu. Chờ một chút rồi thử lại."],
  [/Could not find the function|does not exist|schema cache|^PGRST2\d\d$|^42P01$|^42703$|^42883$/i,
    LOI_HE_THONG],
];

/** Thay "ten_vt_2627" (có hoặc không có ngoặc kép) bằng tên cột người dùng thấy.
 *  Dùng cả cho chữ do database ghi sẵn, vd. lý do xác nhận hết hiệu lực. */
export function thayTenCot(msg) {
  if (!msg) return msg;
  return String(msg).replace(/"?\b([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b"?/g, (khop, key) => {
    const nhan = NHAN_COT.get(key);
    return nhan ? `"${nhan}"` : khop;
  });
}

/** Chuỗi, Error hay lỗi Supabase `{ message, code }` đều nhận. Rỗng thì trả "". */
export function dichLoi(loi) {
  if (!loi) return "";
  const msg = typeof loi === "string" ? loi
    // `name` ghép vào để bắt ChunkLoadError (lỗi đó mang tên ở `name`).
    : [loi.name === "ChunkLoadError" ? loi.name : "", String(loi.message || "")].filter(Boolean).join(": ");
  const code = typeof loi === "object" ? String(loi.code || "") : "";

  if (msg && CO_DAU_TIENG_VIET.test(msg)) return thayTenCot(msg);

  for (const [dk, cau] of LUAT) {
    if ((msg && dk.test(msg)) || (code && dk.test(code))) return cau;
  }
  return "Có lỗi xảy ra, thao tác chưa hoàn tất. Bấm Tải lại rồi thử lần nữa; nếu vẫn lỗi, "
    + "chụp màn hình gửi Phòng Điều dưỡng."
    + (msg ? ` (Chi tiết kỹ thuật: ${msg})` : "");
}
