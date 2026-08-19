-- Workflow V3 / khoá phần khoa sau khi CHỐT — vá lỗi phát hiện 19/08/2026
-- khi test Bước 3 (Khoa chốt danh mục).
--
-- Giai đoạn 3 nói: "Khi đã chốt: toàn bộ phần khoa được sửa bị khóa ở SERVER."
-- Thực tế đo được bằng JWT thật của khoa, ngay sau khi khoa bấm Chốt danh mục:
--
--   a) khoa tự mở chốt        -> đã chặn đúng
--   b) khoa sửa phan_bo_khoa  -> RLS trả 0 dòng, số không đổi (an toàn)
--   c) khoa GỬI THÊM đề xuất  -> KHÔNG CHẶN, tạo proposal mới bình thường
--
-- (c) là lỗ thật: PĐD tưởng danh mục của khoa đã đóng băng và đi hiệu chỉnh
-- trên đó, trong khi khoa vẫn thêm được mã mới vào cùng DOT_GOI.
--
-- Vá cùng chỗ với gác phạm vi (patch_zzzzl) vì cùng một câu hỏi: dòng này có
-- được phép rơi vào DOT_GOI này không. Nhân tiện đóng luôn invariant 12 —
-- "sau chốt số tham gia thầu không được thêm mã mới": Giai đoạn 6 khoá phạm vi
-- danh mục mang đi thầu, mã thiếu phát hiện sau đó xử lý ngoài hệ thống.

begin;

create or replace function fn_gac_pham_vi_dot_goi_v3()
returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare
    v_trang_thai text;
    v_nhan text;
    v_tham_gia boolean;
    v_chot_luc timestamptz;
    v_chot_boi text;
    v_co_q boolean;
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

    -- Giai đoạn 6 trước Giai đoạn 3: phạm vi toàn gói bị khoá thì kể cả khoa
    -- chưa chốt danh mục cũng không được thêm mã.
    select exists (
        select 1 from chot_q_phien where dot_goi_id = new.dot_goi_id and hieu_luc
    ) into v_co_q;
    if v_co_q then
        raise exception
            'Gói con "%" đã chốt số tham gia đấu thầu — phạm vi danh mục đã khoá, không thêm mã mới được.',
            v_nhan;
    end if;

    select chot_luc, chot_boi into v_chot_luc, v_chot_boi
      from danh_muc_khoa_chot
     where dot_goi_id = new.dot_goi_id and khoa = new.don_vi;

    if v_chot_luc is not null then
        raise exception
            'Khoa "%" đã chốt danh mục gói con "%" lúc % (bởi %) — không gửi thêm đề xuất được. Liên hệ Phòng Điều dưỡng qua Teams để mở lại.',
            new.don_vi, v_nhan, to_char(v_chot_luc at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM/YYYY'), v_chot_boi;
    end if;

    return new;
end;
$$;

commit;
