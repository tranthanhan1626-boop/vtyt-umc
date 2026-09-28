-- patch_zzzzzzzk — 28/09/2026 (vòng 5 vá, theo M7/N1 của kiểm định độc lập
-- lượt 2 và lượt 3: .scratch/test-toan-bo/KIEM_DINH_DOC_LAP_LUOT2.md,
-- KIEM_DINH_DOC_LAP_LUOT3.md, SO_CHUNG.md mục 21)
--
-- LỖI — "CHỐT TRÌNH KÝ TOÀN BỘ" CÓ THỂ KẸT NỬA CHỐT
--
-- Nút "Chốt trình ký toàn bộ" (CumThauTongHop.jsx, hàm chotHet) gọi
-- `chot_trinh_ky_khoa_v3` LẦN LƯỢT cho từng khoa còn thiếu — MỖI LƯỢT LÀ MỘT
-- LỜI GỌI RPC RIÊNG, tức MỘT GIAO DỊCH DB RIÊNG (PostgREST bọc mỗi RPC trong
-- một transaction của chính nó) — rồi mới gọi `chot_trinh_ky_toan_bo_v3`. Nếu
-- bước cuối này (hoặc một khoa giữa vòng lặp) bị từ chối, các khoa đã chốt ở
-- những giao dịch TRƯỚC ĐÓ đã commit rồi, không tự lùi lại: gói kẹt nửa chốt —
-- mọi thao tác "Chia"/"Mở lại" trên các khoa đó bị trigger chặn với "Đã có
-- bảng khoa chốt trình ký; phải mở chốt trình ký trước khi sửa kết quả", và
-- PĐD phải gỡ TỪNG khoa một bằng tay.
--
-- Vòng 4 đã thêm một lưới tự gỡ ở phía JS (`goTuDong`, gọi
-- `mo_chot_trinh_ky_khoa_v3` cho các khoa lượt bấm này vừa chốt) — giảm nhẹ
-- nhưng KHÔNG triệt để (M7, .scratch/test-toan-bo/KIEM_DINH_DOC_LAP_LUOT3.md
-- dòng 63): lưới đó gỡ cho MỌI lỗi của bước cuối, kể cả khi lỗi là "đã có
-- revision hiệu lực" (một PĐD khác vừa chốt xong) hoặc lỗi mạng giữa chừng —
-- hai trường hợp này lưới có thể vô hiệu nhầm một bản chốt CHÍNH THỨC vừa
-- được tạo, không phải bản của chính lượt bấm đang lỗi.
--
-- GỐC: `chot_trinh_ky_khoa_v3` và `chot_trinh_ky_toan_bo_v3` là hai hàm gọi
-- rời, không có cơ chế nào ở DB gộp chúng vào một giao dịch. Đọc định nghĩa
-- THẬT trên DB staging 28/09/2026 bằng pg_get_functiondef (repo SQL không
-- phải nguồn chuẩn — AGENTS.md điều 2):
--
--   khoa_chua_du_chot_trinh_ky(p_dot_goi_id bigint) RETURNS TABLE(khoa text)
--     LANGUAGE sql STABLE (KHÔNG có SECURITY DEFINER — chạy dưới quyền
--     người gọi). Liệt kê khoa: tham_gia=true VÀ đã gửi đề xuất thật
--     (phan_bo_khoa.so_luong_hien_hanh>0) VÀ (chưa có danh_muc_khoa_chot HOẶC
--     chưa có chot_trinh_ky_khoa_v3) cho DOT_GOI đó.
--
--   chot_trinh_ky_khoa_v3(p_dot_goi_id, p_khoa) SECURITY DEFINER — tự kiểm
--     current_user_role() in ('dieu_duong','admin'), Q đã chốt, đủ ba giai
--     đoạn thầu, khoa tham gia, đã chốt danh mục, chưa từng chốt trình ký
--     khoa — rồi insert chot_trinh_ky_khoa_v3 + audit.
--
--   chot_trinh_ky_toan_bo_v3(p_dot_goi_id) SECURITY DEFINER — tự kiểm
--     current_user_role(), advisory lock, chưa có revision hiệu lực, có
--     snapshot Q, đủ ba giai đoạn thầu, khoa_chua_du_chot_trinh_ky() RỖNG,
--     fn_dong_vuot_quyen_v3(v_q.id, null) RỖNG, rồi khoá cứng 2
--     (v_phan_bo_trung_theo_ma_v3.da_khop) — mới insert chot_trinh_ky_phien_v3
--     + chot_trinh_ky_dong_v3 + audit + day_ky_ve_danh_muc(...).
--
--   current_user_role() SECURITY DEFINER STABLE: `select role from users
--     where email = auth.email()`.
--   auth.email() LANGUAGE sql STABLE: đọc
--     coalesce(current_setting('request.jwt.claim.email', true),
--       (current_setting('request.jwt.claims', true)::jsonb->>'email')) —
--     đây là GUC gắn theo TỪNG REQUEST của PostgREST (đặt từ JWT của người
--     bấm nút), KHÔNG phụ thuộc DB role đang thực thi (definer hay invoker).
--
-- CÁCH SỬA — GỘP MỘT GIAO DỊCH, KHÔNG ĐỔI LUẬT/CỔNG NÀO:
--
-- Tạo `chot_trinh_ky_toan_bo_nguyen_khoi_v3(p_dot_goi_id bigint)`
-- RETURNS chot_trinh_ky_phien_v3, LANGUAGE plpgsql, SECURITY INVOKER, thân
-- hàm CHỈ lặp qua đúng danh sách của `khoa_chua_du_chot_trinh_ky`, gọi đúng
-- `chot_trinh_ky_khoa_v3` cho từng khoa rồi trả về đúng
-- `chot_trinh_ky_toan_bo_v3` — không viết lại một dòng logic nghiệp vụ nào,
-- chỉ gọi nguyên văn ba hàm đã có theo ĐÚNG thứ tự web đang gọi hôm nay. Vì
-- toàn bộ nằm trong MỘT lời gọi RPC = MỘT giao dịch DB, bất kỳ raise exception
-- nào ở bất kỳ bước nào (một khoa bị chối giữa vòng lặp, hoặc
-- chot_trinh_ky_toan_bo_v3 bị chối ở bất kỳ cổng nào trong 6 cổng của nó —
-- kể cả fn_dong_vuot_quyen_v3 và khoá cứng 2) khiến Postgres TỰ ĐỘNG rollback
-- toàn bộ giao dịch: không khoa nào bị chốt dở dang. Đây đúng là đề xuất gốc
-- của N1 trong KIEM_DINH_DOC_LAP_LUOT2.md ("cho chot_trinh_ky_toan_bo_v3 tự
-- chốt các khoa còn thiếu bên trong cùng giao dịch, sau khi mọi cổng đã qua").
--
-- `khoa_chua_du_chot_trinh_ky` liệt kê khoa "không đủ điều kiện chốt vì lý do
-- khác" (vd chưa chốt danh mục ban đầu) VẪN có thể lọt vào danh sách nó trả
-- về — khi đó `chot_trinh_ky_khoa_v3` sẽ raise đúng như hôm nay, và với hàm
-- gộp này thì TOÀN BỘ giao dịch (kể cả các khoa đã chốt trước đó trong cùng
-- lượt gọi) rollback theo — đây LÀ HÀNH VI ĐÚNG, không phải lỗi.
--
-- VÌ SAO SECURITY INVOKER, KHÔNG PHẢI DEFINER:
--   (a) current_user_role() (và do đó luật phân quyền "chỉ dieu_duong/admin"
--       trong hai hàm SECURITY DEFINER bên trong) đọc auth.email(), mà
--       auth.email() đọc GUC theo REQUEST (JWT của người bấm nút) — KHÔNG
--       đổi theo DB role đang thực thi. Nghĩa là dù hàm gộp chạy invoker hay
--       definer, hai hàm bên trong vẫn nhận diện ĐÚNG người bấm nút như khi
--       web gọi thẳng — chọn invoker/definer ở TẦNG NÀY không ảnh hưởng kết
--       quả kiểm quyền.
--   (b) `khoa_chua_du_chot_trinh_ky` KHÔNG phải SECURITY DEFINER — nó đọc
--       trực tiếp dot_goi_khoa, phan_bo_khoa, danh_muc_khoa_chot,
--       chot_trinh_ky_khoa_v3 (cả bốn bảng đều bật RLS — kiểm relrowsecurity
--       = true trên DB staging 28/09) DƯỚI QUYỀN NGƯỜI GỌI. Nếu hàm gộp là
--       SECURITY DEFINER, bốn SELECT đó sẽ chạy dưới vai chủ hàm thay vì vai
--       `authenticated` đang gọi thật — lệch với "y hệt khi web gọi thẳng".
--       SECURITY INVOKER giữ nguyên ngữ cảnh RLS cho bước này.
--   (c) `authenticated` đã có sẵn EXECUTE trên cả ba hàm con (kiểm
--       has_function_privilege = true cho khoa_chua_du_chot_trinh_ky,
--       chot_trinh_ky_khoa_v3, chot_trinh_ky_toan_bo_v3 trên DB staging
--       28/09), nên hàm invoker gọi được ngay — chỉ cần cấp EXECUTE cho
--       chính hàm gộp mới, không cần đụng quyền bảng nào khác.
--
-- KHÔNG ĐỔI LUẬT, KHÔNG ĐỔI CỔNG NÀO của khoa_chua_du_chot_trinh_ky,
-- chot_trinh_ky_khoa_v3, chot_trinh_ky_toan_bo_v3, fn_dong_vuot_quyen_v3,
-- current_user_role — patch này CHỈ THÊM một hàm gộp giao dịch mới, gọi
-- nguyên văn ba hàm cũ theo đúng thứ tự web đang dùng hôm nay.
--
-- Chạy: cd backend && set -a && . ./.env.local && set +a &&
--       .venv/bin/python scripts/chay_patch.py sql/patch_zzzzzzzk_vong5_chot_trinh_ky_nguyen_khoi.sql
-- Gỡ:   sql/rollback_zzzzzzzk_vong5.sql
--
-- Kiểm lại sau khi chạy (chỉ đọc, không ghi):
--   -- hàm tồn tại đúng chữ ký, authenticated có quyền execute, anon thì không
--   select has_function_privilege('authenticated',
--       'public.chot_trinh_ky_toan_bo_nguyen_khoi_v3(bigint)', 'execute'),
--     has_function_privilege('anon',
--       'public.chot_trinh_ky_toan_bo_nguyen_khoi_v3(bigint)', 'execute');
--   -- kỳ vọng: true, false
--
--   -- kiểm hành vi (cần một DOT_GOI có khoa còn thiếu ở môi trường test,
--   -- KHÔNG chạy trên dữ liệu thật — script này không tự chạy phần kiểm này):
--   -- ép một khoa trong danh sách khoa_chua_du_chot_trinh_ky bị chối (vd xoá
--   -- tạm dòng danh_muc_khoa_chot của nó), gọi
--   -- supabase.rpc("chot_trinh_ky_toan_bo_nguyen_khoi_v3", {p_dot_goi_id}),
--   -- rồi kiểm không còn dòng chot_trinh_ky_khoa_v3 nào MỚI cho các khoa khác
--   -- trong lượt gọi đó, và không có chot_trinh_ky_phien_v3 mới — tức toàn bộ
--   -- đã rollback.

begin;

create or replace function public.chot_trinh_ky_toan_bo_nguyen_khoi_v3(p_dot_goi_id bigint)
returns chot_trinh_ky_phien_v3
language plpgsql
security invoker
set search_path = public
as $function$
declare
    r record;
begin
    -- Đúng vòng lặp mà web đang làm ở nhiều lượt mạng hôm nay (CumThauTongHop.jsx,
    -- hàm chotHet) — chỉ khác là giờ nằm trong MỘT giao dịch DB. Một khoa bị
    -- chối ⇒ raise ⇒ toàn bộ (kể cả các khoa đã chốt trước đó trong vòng lặp
    -- này) tự rollback, không cần lưới tự gỡ ở JS nữa.
    for r in select khoa from khoa_chua_du_chot_trinh_ky(p_dot_goi_id) loop
        perform chot_trinh_ky_khoa_v3(p_dot_goi_id, r.khoa);
    end loop;

    -- chot_trinh_ky_toan_bo_v3 tự kiểm lại toàn bộ 6 cổng của nó (kể cả
    -- fn_dong_vuot_quyen_v3 và khoá cứng 2) trên dữ liệu MỚI NHẤT, bao gồm cả
    -- các khoa vừa được chốt ở vòng lặp trên. Bị chối ⇒ raise ⇒ rollback hết.
    return chot_trinh_ky_toan_bo_v3(p_dot_goi_id);
end;
$function$;

revoke execute on function public.chot_trinh_ky_toan_bo_nguyen_khoi_v3(bigint)
    from public, anon;
grant execute on function public.chot_trinh_ky_toan_bo_nguyen_khoi_v3(bigint)
    to authenticated;

-- ── Tự kiểm cuối patch (raise exception ⇒ rollback transaction) ───────────

do $$
declare
    v_ton_tai boolean;
    v_quyen_authenticated boolean;
    v_quyen_anon boolean;
begin
    select exists (
        select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'chot_trinh_ky_toan_bo_nguyen_khoi_v3'
    ) into v_ton_tai;
    if not v_ton_tai then
        raise exception 'chot_trinh_ky_toan_bo_nguyen_khoi_v3 không tồn tại sau patch.';
    end if;

    select has_function_privilege('authenticated',
        'public.chot_trinh_ky_toan_bo_nguyen_khoi_v3(bigint)', 'execute')
      into v_quyen_authenticated;
    if not v_quyen_authenticated then
        raise exception 'authenticated KHÔNG có quyền execute trên chot_trinh_ky_toan_bo_nguyen_khoi_v3.';
    end if;

    select has_function_privilege('anon',
        'public.chot_trinh_ky_toan_bo_nguyen_khoi_v3(bigint)', 'execute')
      into v_quyen_anon;
    if v_quyen_anon then
        raise exception 'anon VẪN có quyền execute trên chot_trinh_ky_toan_bo_nguyen_khoi_v3 — phải bị revoke.';
    end if;
end $$;

commit;
