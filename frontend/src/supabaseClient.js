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
/**
 * Tải hết mọi trang của một truy vấn.
 *
 * ⚠️ `buildQuery(from, to)` PHẢI dựng một truy vấn MỚI mỗi lần gọi. Builder của
 * supabase-js đổi tại chỗ, nên dùng lại một builder đã dựng sẵn thì các trang
 * sẽ đè range của nhau. Trước 25/08/2026 hàm này chạy nối đuôi nên lỗi đó im
 * lặng; nay tải song song thì nó làm mất dòng ngay (đo thật: bảng 340 mã hiện
 * 157 mã, không báo lỗi gì).
 */
export async function fetchAllRows(
  buildQuery,
  { order, pageSize = 1000, songSong = 4 } = {},
) {
  // Server chặn cứng 1.000 dòng mỗi lượt (`db-max-rows` của Supabase). Xin
  // nhiều hơn thì nó VẪN trả 1.000, mà vòng lặp thấy `data.length < pageSize`
  // sẽ tưởng hết dữ liệu và DỪNG SỚM — mất dòng trong im lặng. Đo thật
  // 25/08/2026: xin cỡ trang 5.000 cho 7.556 dòng thì chỉ nhận về 1.000.
  const buoc = Math.min(pageSize, 1000);
  const cols = order == null ? [] : Array.isArray(order) ? order : [order];

  const tai = async (from) => {
    let q = buildQuery(from, from + buoc - 1);
    for (const c of cols) q = q.order(c);
    return q;
  };

  // Tải theo ĐỢT SONG SONG thay vì nối đuôi. Ở quy mô thật một màn phải kéo
  // 7.556 dòng = 8 lượt; nối đuôi là 8 lần chờ mạng cộng lại (đo: 2,0s), còn
  // chia hai đợt song song chỉ còn 2 lần chờ (đo: 1,16s).
  //
  // Không hỏi `count` trước được: `buildQuery` đã dựng sẵn `.select(...)` nên
  // không chèn thêm tuỳ chọn count vào đó. Nên cứ bắn một đợt, thấy đợt nào có
  // trang ngắn thì dừng — trang ngắn là hết dữ liệu.
  // Trang ĐẦU đi một mình. Phần lớn truy vấn của app dưới 1.000 dòng — bắn
  // song song ngay từ đầu là biến 1 lượt gọi thành 4 cho không.
  const dauTien = await tai(0);
  if (dauTien.error) return { data: null, error: dauTien.error };
  const rows = [...dauTien.data];
  if (dauTien.data.length < buoc) return { data: rows, error: null };

  for (let dot = 0; ; dot += 1) {
    const dau = buoc + dot * songSong * buoc;
    const ketQua = await Promise.all(
      Array.from({ length: songSong }, (_, k) => tai(dau + k * buoc)),
    );
    let het = false;
    for (const { data, error } of ketQua) {
      if (error) return { data: null, error };
      rows.push(...data);
      if (data.length < buoc) het = true;
    }
    if (het) return { data: rows, error: null };
    if (!cols.length && import.meta.env.DEV) {
      // Chỉ cảnh báo khi THỰC SỰ phải sang trang — dưới 1.000 dòng thì không
      // phân trang nên không có gì sai.
      console.warn(
        "[fetchAllRows] phân trang mà không có `order` — dữ liệu có thể thiếu "
        + "hoặc trùng dòng. Truyền { order: '<cột khoá>' }.",
      );
    }
  }
}
