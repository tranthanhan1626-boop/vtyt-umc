import { createClient } from "@supabase/supabase-js";

// VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY lấy từ Supabase Dashboard >
// Settings > API. anon key AN TOÀN để đưa vào code FE (kể cả public GitHub
// repo) — nó không có quyền gì cả nếu không có RLS cho phép; toàn bộ phân
// quyền nằm ở sql/rls_policies.sql, KHÔNG dựa vào việc giấu key này.
//
// TUYỆT ĐỐI KHÔNG đưa SUPABASE_SERVICE_ROLE_KEY vào đây hay bất kỳ đâu trong
// thư mục frontend/ — key đó bỏ qua toàn bộ RLS, chỉ dùng trong script ingest
// chạy local (xem backend/scripts/ingest_cli.py).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — kiểm tra file .env " +
      "(local) hoặc Environment Variables trong Cloudflare Pages (production)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// PostgREST trả TỐI ĐA 1000 dòng mỗi request và KHÔNG báo lỗi khi cắt bớt —
// bảng nào có thể vượt 1000 dòng (vat_tu đang 3.327, nhom_ky_thuat 1.369 và
// còn tăng) bắt buộc phải lấy qua hàm này, nếu không sẽ thiếu dữ liệu âm thầm.
// Truyền vào 1 hàm nhận (from, to) và trả về query đã gắn .range(from, to).
//
// ⚠️ BẮT BUỘC CÓ SẮP XẾP — bẫy 21 (08/08/2026)
// LIMIT/OFFSET mà KHÔNG có ORDER BY thì Postgres **không hứa** thứ tự dòng
// giống nhau giữa các lần chạy. Trang 1 và trang 2 có thể trả trùng dòng và bỏ
// sót dòng khác — kết quả là tổng bị thiếu ÂM THẦM, đúng thứ khó phát hiện
// nhất. Rủi ro không phải lý thuyết: `usage_history_current` đang 141.623 dòng
// nên Postgres bật parallel seq scan, thứ tự trả về đổi theo lần chạy.
//
// Vì vậy hàm này TỰ GẮN `.order(...)`. Cột sắp xếp phải là khoá định danh
// (hoặc bộ cột đủ phân biệt) của bảng/view đang đọc — truyền qua `order`.
//
// @param buildQuery (from, to) => query đã gắn .range(from, to)
// @param order      tên cột, hoặc mảng cột, dùng để sắp xếp ổn định
// @param pageSize   số dòng mỗi trang
export async function fetchAllRows(buildQuery, { order, pageSize = 1000 } = {}) {
  const cols = order == null ? [] : Array.isArray(order) ? order : [order];
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    let q = buildQuery(from, from + pageSize - 1);
    for (const c of cols) q = q.order(c);
    const { data, error } = await q;
    if (error) return { data: null, error };
    rows.push(...data);
    if (data.length < pageSize) return { data: rows, error: null };
    if (!cols.length && import.meta.env.DEV) {
      // Chỉ cảnh báo khi THỰC SỰ phải sang trang thứ 2 — dưới 1000 dòng thì
      // không phân trang nên không có gì sai.
      console.warn(
        "[fetchAllRows] phân trang mà không có `order` — dữ liệu có thể thiếu "
        + "hoặc trùng dòng. Truyền { order: '<cột khoá>' }.",
      );
    }
  }
}
