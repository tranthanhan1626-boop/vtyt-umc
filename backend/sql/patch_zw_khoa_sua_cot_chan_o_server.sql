-- ZW — "Khoá sửa cột" của Danh mục đề xuất khoa phải chặn Ở SERVER
--
-- ============================== VÌ SAO ==============================
-- Phát hiện 09/08/2026 khi viết smoke pipeline hiện tại
-- (`scripts/smoke_pipeline_hien_tai.py`): ĐVSD bật `khoa_sua = true` cho một
-- cột rồi vẫn gọi `luu_o_danh_muc_khoa` sửa được ô trong đúng cột đó.
--
-- Đây KHÔNG phải chuyện nhỏ về giao diện. Nó vi phạm trực tiếp hai chỗ đã
-- chốt trong `01_NGHIEP_VU_VA_QUYET_DINH.md`:
--   · mục 3.1 — "Cột/dòng đã lock: không ai sửa (kể cả PĐD, phải unlock trước)";
--   · mục 9   — "RLS phải bảo vệ ở database; ẩn nút trên giao diện KHÔNG được
--                coi là phân quyền... quyền edit Excel cộng tác cần enforced ở
--                RLS theo `khoa` và trạng thái lock của cột/dòng."
-- và bảng cờ ở cuối mục 9 (patch_zi) ghi rõ `khoa_sua` = "không ai sửa được ô
-- trong cột, kể cả PĐD".
--
-- So sánh cho thấy đây là chỗ BỎ SÓT chứ không phải quyết định: phía PĐD,
-- `danh_muc_tong_hop_o` đã có `fn_chan_o_da_lock` (patch_zd) chặn đúng như vậy
-- từ đầu. Phía khoa chỉ có `fn_chan_o_khoa_da_chot` (patch_zs) chặn khi ĐÃ CHỐT
-- CẢ DANH MỤC — không có gì chặn theo từng cột.
--
-- Hậu quả thật: hai người cùng khoa mở một danh mục, một người khoá cột "SL
-- đề xuất" để giữ số đã thống nhất, người kia (hoặc chính người đó ở tab đang
-- mở sẵn, chưa tải lại cấu hình) vẫn ghi đè được — và ghi đè im lặng, vì mọi
-- thứ trả HTTP 200.
--
-- ========================= CÁCH LÀM =========================
-- Thêm một trigger nữa trên `danh_muc_khoa_o`, cùng kiểu với trigger chốt sẵn
-- có. KHÔNG gộp vào `fn_chan_o_khoa_da_chot`: hai điều kiện độc lập nhau và
-- câu báo lỗi phải khác nhau (mở chốt ≠ mở khoá cột), gộp lại thì người dùng
-- đọc lỗi không biết phải bấm nút nào.
--
-- ⚠️ Ràng buộc: `danh_muc_khoa_o` lưu MỘT DÒNG cho mỗi (gói con, năm, khoa,
-- mã hàng) với cột `gia_tri` kiểu jsonb gom mọi ô (quyết định JSONB, mục 6b
-- `04_VAN_HANH_KY_THUAT.md`). Trigger vì vậy không nhận được "cột nào đang bị
-- sửa" một cách trực tiếp — phải SO SÁNH old.gia_tri với new.gia_tri và chỉ
-- chặn khi khoá phủ đúng key vừa đổi. Chặn cả dòng là sai: khoá một cột sẽ
-- khoá luôn mọi cột khác của cùng mã hàng.
--
-- Phụ thuộc: patch_zm (danh_muc_khoa_o), patch_zh/zi (cột khoa_sua),
--            patch_zs (trigger chốt — patch này chạy song song, không thay thế).
-- Chạy STAGING trước production.

begin;

create or replace function fn_chan_o_cot_khoa_sua()
returns trigger
language plpgsql
set search_path = public
as $$
declare
    v_key text;
    v_khoa_sua text[];
begin
    -- Bẫy 24: không gán OLD/NEW ở khối DECLARE.
    if TG_OP = 'DELETE' then
        -- Xoá cả dòng cũng là xoá nội dung mọi cột đang khoá trong dòng đó.
        select array_agg(cot) into v_khoa_sua
        from danh_muc_khoa_cot_cau_hinh
        where goi_id = old.goi_id and nam_de_xuat = old.nam_de_xuat
          and khoa = old.khoa and khoa_sua
          and cot in (select jsonb_object_keys(old.gia_tri));
        if v_khoa_sua is not null then
            raise exception
                'Cột % đang KHOÁ SỬA — mở khoá (biểu tượng 🔒) trước khi xoá.',
                array_to_string(v_khoa_sua, ', ');
        end if;
        return old;
    end if;

    -- Chỉ xét những key THỰC SỰ đổi giá trị. `luu_o_danh_muc_khoa` hợp nhất
    -- bằng `||` nên new.gia_tri luôn chứa đủ mọi key cũ; so cả object sẽ báo
    -- lỗi oan cho các cột không ai đụng tới.
    for v_key in
        select k from jsonb_object_keys(new.gia_tri) k
        where TG_OP = 'INSERT'
           or (old.gia_tri -> k) is distinct from (new.gia_tri -> k)
    loop
        if exists (
            select 1 from danh_muc_khoa_cot_cau_hinh
            where goi_id = new.goi_id and nam_de_xuat = new.nam_de_xuat
              and khoa = new.khoa and cot = v_key and khoa_sua
        ) then
            raise exception
                'Cột "%" đang KHOÁ SỬA — mở khoá (biểu tượng 🔒) trước khi sửa ô.',
                v_key;
        end if;
    end loop;
    return new;
end;
$$;

drop trigger if exists trg_chan_o_cot_khoa_sua on danh_muc_khoa_o;
create trigger trg_chan_o_cot_khoa_sua
before insert or update or delete on danh_muc_khoa_o
for each row execute function fn_chan_o_cot_khoa_sua();

commit;

-- ============================ KIỂM SAU KHI CHẠY ============================
-- Đường ngắn nhất: chạy lại smoke pipeline, bước "cột đã khoá sửa thì SERVER
-- chặn" phải PASS:
--   .venv/bin/python scripts/smoke_pipeline_hien_tai.py --xac-nhan-staging
--
-- Kiểm tay (bằng JWT của ĐVSD, KHÔNG dùng service role — service role bỏ qua
-- RLS nhưng trigger thì vẫn chạy, nên vẫn thấy được lỗi):
-- 1. bật khoa_sua cho cột 'ghi_chu_khoa' của (gói con, năm, khoa) đang test;
-- 2. gọi luu_o_danh_muc_khoa vào đúng cột đó   -> PHẢI văng lỗi 'đang KHOÁ SỬA';
-- 3. gọi luu_o_danh_muc_khoa vào cột KHÁC       -> phải chạy bình thường
--    (đây là phép kiểm quan trọng nhất: khoá 1 cột không được khoá cả dòng);
-- 4. tắt khoa_sua rồi sửa lại                   -> phải chạy bình thường.
