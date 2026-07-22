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
// bảng nào có thể vượt 1000 dòng (vat_tu đang 2218, nhom_ky_thuat 878 và còn
// tăng) bắt buộc phải lấy qua hàm này, nếu không sẽ thiếu dữ liệu âm thầm.
// Truyền vào 1 hàm nhận (from, to) và trả về query đã gắn .range(from, to).
export async function fetchAllRows(buildQuery, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery(from, from + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...data);
    if (data.length < pageSize) return { data: rows, error: null };
  }
}
