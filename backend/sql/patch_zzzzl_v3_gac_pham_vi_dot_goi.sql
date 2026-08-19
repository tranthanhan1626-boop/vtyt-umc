-- Workflow V3 / gác phạm vi DOT_GOI ở tầng SERVER — vá lỗi phát hiện 19/08/2026
-- khi test Bước 2 (Khoa lập đề xuất).
--
-- Hai lỗ hổng cùng một gốc: đường gửi đề xuất suy ra `dot_goi_id` rồi ghi
-- thẳng, KHÔNG hề đọc lại bảng `dot_goi`. Đo được trên staging bằng JWT thật
-- của khoa:
--
--   1. Khoa gửi được đề xuất vào gói con ĐANG ĐÓNG (dot_goi 47 `18t-gmhs`,
--      trang_thai='dong') — proposal vẫn tạo và vẫn gán đúng dot_goi_id.
--   2. Khoa KHÔNG nằm trong danh sách tham gia vẫn gửi được vào gói con đó
--      (gỡ khoa khỏi `dot_goi_khoa` rồi gửi — không bị chặn).
--
-- Cả hai phá invariant 1 "Một DOT_GOI độc lập hoàn toàn với gói con khác":
-- phạm vi của một gói con không còn do PĐD quyết định nữa. Lỗ 2 còn kéo theo
-- Giai đoạn 6 — khoa không thuộc gói vẫn lọt vào baseline Q, mà "chỉ khoa có
-- đề xuất mã hàng trong baseline Q mới được nhận số trúng".
--
-- Trạng thái mở/đóng và danh sách khoa tham gia là RANH GIỚI DỮ LIỆU, không
-- phải cổng chặn quy trình: chúng nói dữ liệu được phép ghi vào đâu, chứ
-- không bắt ai phải làm xong việc gì trước. Vì vậy chặn cứng ở đây không mâu
-- thuẫn với nguyên tắc "ngoài ba khóa cứng thì chỉ cảnh báo".

begin;

create or replace function fn_gac_pham_vi_dot_goi_v3()
returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare
    v_trang_thai text;
    v_nhan text;
    v_tham_gia boolean;
begin
    -- Dòng chưa suy ra được DOT_GOI thì để nguyên: đó là dữ liệu của luồng cũ
    -- hoặc đợt chưa migrate, không phải việc của gác phạm vi.
    if new.dot_goi_id is null then
        return new;
    end if;

    select dg.trang_thai, coalesce(gc.nhan, dg.goi_id)
      into v_trang_thai, v_nhan
      from dot_goi dg
      left join goi_con gc on gc.goi_id = dg.goi_id
     where dg.id = new.dot_goi_id;

    if v_trang_thai is null then
        raise exception 'Không tìm thấy gói con của đề xuất (dot_goi_id=%).', new.dot_goi_id;
    end if;

    if v_trang_thai <> 'mo' then
        raise exception
            'Gói con "%" đang đóng — không nhận thêm đề xuất. Liên hệ Phòng Điều dưỡng qua Teams để mở lại.',
            v_nhan;
    end if;

    select tham_gia into v_tham_gia
      from dot_goi_khoa
     where dot_goi_id = new.dot_goi_id and khoa = new.don_vi;

    if v_tham_gia is distinct from true then
        raise exception
            'Khoa "%" không nằm trong danh sách tham gia gói con "%" — không gửi đề xuất vào gói này được.',
            new.don_vi, v_nhan;
    end if;

    return new;
end;
$$;

-- Tên bắt đầu bằng `trg_z_` để chắc chắn chạy SAU `trg_gan_dot_goi_proposal_v3`
-- (Postgres gọi trigger cùng thời điểm theo THỨ TỰ TÊN). Chạy trước thì
-- `new.dot_goi_id` còn null và cả hàm gác thành vô nghĩa.
--
-- Phải bắt cả UPDATE, không chỉ INSERT: `submit_proposal_group_v2` chèn dòng
-- TRƯỚC rồi mới `update ... set dot_id` (xem patch_zzzzh), nên tại thời điểm
-- INSERT thì `dot_goi_id` vẫn còn null và hàm gác thoát sớm. Đây đúng là lý do
-- bản gác chỉ-INSERT đầu tiên không chặn được gì.
drop trigger if exists trg_z_gac_pham_vi_dot_goi_v3 on proposals;
create trigger trg_z_gac_pham_vi_dot_goi_v3
before insert or update of dot_id, dot_goi_id, loai_mua_sam, goi on proposals
for each row execute function fn_gac_pham_vi_dot_goi_v3();

commit;
