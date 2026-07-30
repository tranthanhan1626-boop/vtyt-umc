-- A.2 — Cổng phê duyệt: trả lại kèm LÝ DO, chặn ở tầng database.
-- Chạy 1 lần trên staging, verify xong thì gộp vào baseline rồi XOÁ file này
-- (quy ước ở CLAUDE.md mục 4 — gộp XONG mới xoá, đã mắc bẫy quên gộp 1 lần).

begin;

-- 1) Cột lý do trả lại. Thêm cột nullable = thay đổi cộng thêm, không phá dữ
--    liệu cũ (QĐ về đổi schema kiểu cộng thêm).
alter table proposals add column if not exists ly_do_tra_lai text;

-- 2) Content-lock: chặn dvsd tự ghi vào ly_do_tra_lai.
--    RLS cho dvsd quyền UPDATE dòng đề xuất khoa mình (để hạ cờ is_current),
--    mà RLS KHÔNG gác được cấp cột (bẫy 5.4). Không chặn ở đây thì dvsd tự
--    bịa lý do trả lại cho chính đề xuất của mình.
create or replace function fn_chan_sua_noi_dung_de_xuat()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    if new.ma_hang          is distinct from old.ma_hang
    or new.don_vi           is distinct from old.don_vi
    or new.nam_de_xuat      is distinct from old.nam_de_xuat
    or new.so_luong         is distinct from old.so_luong
    or new.so_thang_du_kien is distinct from old.so_thang_du_kien
    or new.loai_mua_sam     is distinct from old.loai_mua_sam
    or new.tu_thang         is distinct from old.tu_thang
    or new.tu_nam           is distinct from old.tu_nam
    or new.den_thang        is distinct from old.den_thang
    or new.den_nam          is distinct from old.den_nam
    or new.nhom_de_xuat     is distinct from old.nhom_de_xuat
    or new.goi              is distinct from old.goi
    or new.version          is distinct from old.version then
        raise exception 'Không được sửa nội dung đề xuất — tạo version mới thay vì ghi đè.';
    end if;

    if new.ly_do_tra_lai is distinct from old.ly_do_tra_lai
       and (select current_user_role()) not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ dieu_duong/admin được ghi lý do trả lại.';
    end if;

    return new;
end;
$$;

-- 3) Chuyển trạng thái: trả lại BẮT BUỘC có lý do; đi tiếp thì xoá lý do cũ.
create or replace function fn_kiem_tra_chuyen_trang_thai()
returns trigger language plpgsql set search_path = public as $$
begin
    if new.trang_thai = old.trang_thai then
        return new;
    end if;
    if (select current_user_role()) not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ dieu_duong/admin được đổi trạng thái đề xuất.';
    end if;
    if (old.trang_thai, new.trang_thai) not in (
        ('de_xuat', 'xet_duyet'),
        ('xet_duyet', 'hoan_thanh'),
        ('xet_duyet', 'tu_choi'),
        ('de_xuat', 'tu_choi')          -- trả lại thẳng, không cần qua xét duyệt
    ) then
        raise exception 'Không thể chuyển trạng thái từ % sang %', old.trang_thai, new.trang_thai;
    end if;

    if new.trang_thai = 'tu_choi'
       and nullif(trim(coalesce(new.ly_do_tra_lai, '')), '') is null then
        raise exception 'Phải ghi lý do khi trả lại đề xuất cho khoa.';
    end if;

    if new.trang_thai in ('xet_duyet', 'hoan_thanh') then
        new.ly_do_tra_lai := null;      -- đi tiếp thì lý do cũ hết hiệu lực
    end if;

    return new;
end;
$$;

-- 4) Lộ lý do ra view cho FE. Cột mới LUÔN nằm CUỐI — chèn vào giữa sẽ lỗi
--    42P16 "cannot change name of view column" (bẫy 5.3).
create or replace view v_de_xuat_tong_hop
with (security_invoker = true) as
select
    p.id, p.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly, n.ten_quan_ly,
    p.so_luong, r.loai_ly_do, r.ten_ky_thuat_moi, r.uoc_ca_thang, r.ghi_chu,
    p.don_vi, p.nam_de_xuat, p.version, p.created_by, p.created_at,
    p.created_by_ho_ten, p.trang_thai, p.so_thang_du_kien, p.loai_mua_sam,
    p.tu_thang, p.tu_nam, p.den_thang, p.den_nam, p.nhom_de_xuat,
    coalesce(p.goi, v.goi) as goi,
    p.ly_do_tra_lai                     -- CỘT MỚI, phải nằm cuối
from proposals p
join vat_tu v on v.ma_hang = p.ma_hang
left join nhom_ky_thuat n on n.ma_quan_ly = v.ma_quan_ly
left join proposal_reasons r on r.proposal_id = p.id
where p.is_current;

commit;
