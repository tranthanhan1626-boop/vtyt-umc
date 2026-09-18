-- patch_zzzzzzze — 18/09/2026
--
-- PĐD SỬA SỐ CỦA KHOA THÌ KHOA KHÔNG MẤT XÁC NHẬN
--
-- Chủ dự án chốt 18/09/2026 ("a không cần"): PĐD sửa số lượng của một khoa
-- trên Danh mục tổng hợp thì khoa KHÔNG phải xác nhận lại — đúng như
-- `01_NGHIEP_VU_HIEN_HANH.md` Giai đoạn 4 ("Khoa thấy được số cũ, số mới,
-- người sửa và lý do ngay trên bảng của mình — không cần xác nhận lại").
--
-- Trước patch này: cột CHỮ đã làm đúng (`fn_huy_xac_nhan_khi_o_doi`, patch_zzzzx
-- mục A2), còn cột SỐ (`fn_huy_xac_nhan_khi_so_doi`, patch_zzzzx mục A3) huỷ
-- xác nhận của khoa BẤT KỂ AI SỬA. patch_zzzzx tự ghi phần A3 là "suy rộng,
-- chủ dự án mới chỉ nói về cột chữ". Hệ quả: PĐD sửa số → khoa mất xác nhận →
-- nút Chốt số đi thầu bị khoá cho tới khi khoa vào bấm lại.
--
-- Sau patch — ba nhánh, khớp đúng hàm của cột chữ:
--   * Khoa (dvsd) tự sửa số của mình  -> khoa đó mất xác nhận (giữ nguyên).
--   * PĐD (dieu_duong/admin) sửa      -> KHÔNG huỷ của ai. Khoa vẫn nhận
--     thông báo (trigger fn_thong_bao_phan_bo_khoa, không đụng tới).
--   * Không xác định được vai trò (script service role, migration)
--                                     -> giữ luật cũ, huỷ. Thà thừa còn hơn sót.
--
-- Chỉ thay THÂN hàm. Trigger `trg_huy_xac_nhan_khi_so_doi` trên `phan_bo_khoa`
-- giữ nguyên, không drop/create lại.

create or replace function fn_huy_xac_nhan_khi_so_doi()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare
    v_vai_tro text;
begin
    -- Chỉ SỐ HIỆN HÀNH đổi mới là lý do phải xác nhận lại. `so_luong_goc` đóng
    -- băng nên không bao giờ đổi; các cột kỹ thuật (revision, updated_at) đổi
    -- theo, không phải lý do huỷ.
    if new.so_luong_hien_hanh is not distinct from old.so_luong_hien_hanh then
        return new;
    end if;

    v_vai_tro := current_user_role();

    -- QĐ 18/09/2026: PĐD sửa thì không huỷ xác nhận của ai.
    if v_vai_tro in ('dieu_duong', 'admin') then
        return new;
    end if;

    perform huy_xac_nhan_theo_ma(new.dot_goi_id, new.ma_hang,
        'Số lượng mã ' || new.ma_hang || ' của khoa mình vừa đổi',
        new.khoa);
    return new;
end;
$$;
