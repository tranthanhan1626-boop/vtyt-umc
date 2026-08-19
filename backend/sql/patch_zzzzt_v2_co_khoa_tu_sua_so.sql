-- V2 bước 2b — CỜ "KHOA TỰ SỬA SỐ" cho bản Tổng hợp.
--
-- Tổng đi thầu giờ là phép cộng của các khoa, và khoa sửa được số của mình.
-- Nghĩa là tổng PĐD vừa chia xong có thể đổi mà PĐD không hay. Vòng xác nhận
-- (bước 4) sẽ chặn việc chốt, nhưng PĐD cần THẤY ngay mã nào bị đụng.
--
-- Cách làm: đánh dấu tại nguồn thay vì đoán từ email người sửa. Đoán bằng cách
-- tra vai trò của `updated_by` vừa đắt vừa sai khi một người đổi vai trò.
--
-- Trigger đặt ở bảng chứ không nhét vào từng RPC: `sua_so_luong_khoa_v3` và
-- `cap_nhat_tong_phan_bo_khoa` là hai đường ghi hiện có, mai mốt thêm đường
-- thứ ba mà quên set cờ thì cờ sai âm thầm.
--
-- Chạy 1 lần trên STAGING. Chạy lại được.

begin;

alter table phan_bo_khoa
    add column if not exists sua_boi_khoa boolean not null default false;

comment on column phan_bo_khoa.sua_boi_khoa is
    'true = lần sửa gần nhất của dòng này là do KHOA tự sửa, không phải PĐD chia. '
    'Bản Tổng hợp dùng để bật cờ cho PĐD (V2, 19/08/2026).';

create or replace function fn_phan_bo_danh_dau_ai_sua()
returns trigger language plpgsql set search_path to 'public', 'auth' as $function$
begin
    new.sua_boi_khoa := (current_user_role() = 'dvsd');
    return new;
end;
$function$;

drop trigger if exists trg_phan_bo_danh_dau_ai_sua on phan_bo_khoa;
create trigger trg_phan_bo_danh_dau_ai_sua
before insert or update of so_luong_hien_hanh on phan_bo_khoa
for each row execute function fn_phan_bo_danh_dau_ai_sua();

-- Dòng đã có trước patch: đánh dấu lại theo người sửa gần nhất, chỉ để bảng
-- không rỗng nghĩa ngay sau khi chạy. Từ giờ trigger lo.
update phan_bo_khoa pb
set sua_boi_khoa = coalesce(
        (select u.role = 'dvsd' from users u where u.email = pb.updated_by), false)
where pb.updated_by is not null;

commit;
