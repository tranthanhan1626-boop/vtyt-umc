-- ZU — Đo dung lượng Supabase ngay trong app, không phải nhớ đo tay
--
-- ============================== VÌ SAO ==============================
-- Dự án chốt chỉ dùng gói Supabase FREE (500MB). Đo tay 07/08/2026: 142MB.
-- Tốc độ tăng ~96.000 dòng/năm cho lịch sử HIS -> 2-3 năm nữa đụng trần.
--
-- Vấn đề không phải là thiếu cách đo, mà là **phải NHỚ đi đo**. Không ai nhớ.
-- Đụng trần thì Supabase khoá ghi — giữa mùa đấu thầu là hỏng việc thật.
-- `patch_zn` đã dựng sẵn hạ tầng nén lịch sử cũ nhưng cố ý chưa chạy; cần một
-- tín hiệu nói "giờ chạy đi" thay vì để chủ dự án tự canh.
--
-- Hàm này cho Bàn điều hành hiện số thật, và tự đổi mức cảnh báo theo ngưỡng.

begin;

create or replace function do_dung_luong()
returns json
language plpgsql
security definer          -- pg_* view cần quyền cao hơn authenticated
set search_path = public
as $$
declare
    v_tong    bigint;
    v_bang    json;
    v_gioi_han constant bigint := 500 * 1024 * 1024;   -- gói free
begin
    if (select current_user_role()) not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ Phòng Điều dưỡng xem được dung lượng.';
    end if;

    select coalesce(sum(pg_total_relation_size(c.oid)), 0)
      into v_tong
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'm');

    -- 8 bảng nặng nhất, đủ để biết nén cái nào là hiệu quả nhất.
    select json_agg(x order by x.bytes desc)
      into v_bang
      from (
        select c.relname as ten,
               pg_total_relation_size(c.oid) as bytes,
               (select reltuples::bigint from pg_class where oid = c.oid) as so_dong_uoc
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind in ('r', 'm')
         order by pg_total_relation_size(c.oid) desc
         limit 8
      ) x;

    return json_build_object(
        'bytes', v_tong,
        'gioi_han_bytes', v_gioi_han,
        'phan_tram', round(100.0 * v_tong / v_gioi_han, 1),
        -- Ngưỡng chọn theo tốc độ tăng thật (~96k dòng/năm ≈ 30MB/năm):
        --   70% = còn khoảng 3 năm  -> bắt đầu để ý
        --   85% = còn khoảng 1 năm  -> chạy nén patch_zn trong quý này
        --   95% = sắp khoá ghi      -> xử lý ngay
        'muc', case
                 when v_tong >= v_gioi_han * 0.95 then 'nguy_hiem'
                 when v_tong >= v_gioi_han * 0.85 then 'canh_bao'
                 when v_tong >= v_gioi_han * 0.70 then 'de_y'
                 else 'on'
               end,
        'bang_nang_nhat', coalesce(v_bang, '[]'::json),
        'do_luc', now());
end;
$$;

revoke execute on function do_dung_luong() from public, anon;
grant execute on function do_dung_luong() to authenticated;

comment on function do_dung_luong is
    'Dung lượng schema public so với trần 500MB của gói Supabase free, kèm 8 '
    'bảng nặng nhất. Bàn điều hành gọi hàm này để tự cảnh báo, thay cho việc '
    'chủ dự án phải nhớ vào Dashboard đo tay. Ngưỡng: 70% để ý · 85% chạy nén '
    '(patch_zn) · 95% xử lý ngay.';

commit;
