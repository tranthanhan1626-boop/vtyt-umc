-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzu — DẤU VẾT "SỬA CUỐI" PHẢI NÓI ĐÚNG GIỜ
--                (đo thật 25/08/2026, vòng test toàn bộ)
--
-- Chủ dự án chốt 20/08/2026: mỗi ô phải khai ra AI chạm sau cùng và LÚC NÀO.
-- Hai màn đều in dấu vết đó — nhãn nhỏ cạnh giá trị ở `TongHopPdd.jsx` và
-- `DanhMucDeXuatKhoa.jsx`, cộng tooltip "Sửa cuối bởi … lúc …".
--
-- Nhưng `updated_at` của `danh_muc_tong_hop_o` và `danh_muc_khoa_o` chỉ có
-- `DEFAULT now()`, tức chỉ được đặt lúc INSERT. Mọi lần UPDATE sau đó (upsert
-- từ giao diện dùng `onConflict`, tức là UPDATE) giữ nguyên giờ cũ.
--
-- Đo được trên mã 66510, cột `tskt_2627`, đợt #168:
--     audit  08:13:37 pdd@umc     → TEST-PDD-1415
--     audit  08:16:45 dvsd1@umc   → TEST-KHOA1-1516
--     audit  08:18:09 dvsd1@umc   → TEST-KHOA1-1520
--     bảng   updated_at = 08:13:37   ← đứng yên ở lần ghi ĐẦU TIÊN
-- Giá trị và người sửa thì đúng, riêng THỜI ĐIỂM chỉ ra lần đầu ô bị chạm.
-- Hai màn vì thế nói "Sửa cuối bởi dvsd1@umc.edu.vn lúc 15:13" cho một lần
-- sửa xảy ra lúc 15:18.
--
-- Chỗ thứ hai bị ảnh hưởng, kín hơn: `DanhMucDeXuatKhoa.jsx` dùng `updated_at`
-- trong `thangTruoc()` để chọn bản ghi nào thắng khi một mã có ô ở nhiều đợt.
-- Mốc đứng yên nghĩa là bản ghi bị chạm nhiều lần vẫn "cũ" hơn bản mới tạo,
-- nên khoa có thể thấy giá trị của đợt khác.
--
-- Sửa: một trigger BEFORE UPDATE đặt `updated_at = now()`. Không đụng
-- `updated_by` — giao diện đã gửi đúng và không phải chỗ nào cũng có JWT.
--
-- KHÔNG phải cổng chặn quy trình, không đổi luật nghiệp vụ nào: chỉ làm cho
-- dấu vết đã chốt 20/08 nói đúng sự thật.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.fn_dat_updated_at()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
    -- Chỉ chạm giờ khi nội dung THỰC SỰ đổi. Upsert lặp lại y nguyên giá trị
    -- (giao diện gửi lại cả dòng mỗi lần rời ô) không phải là một lần sửa —
    -- ghi giờ mới cho nó sẽ làm dấu vết nói dối theo chiều ngược lại.
    if to_jsonb(new) - 'updated_at' is distinct from to_jsonb(old) - 'updated_at' then
        new.updated_at := now();
    end if;
    return new;
end;
$$;

drop trigger if exists trg_updated_at_o_tong_hop on public.danh_muc_tong_hop_o;
create trigger trg_updated_at_o_tong_hop
    before update on public.danh_muc_tong_hop_o
    for each row execute function public.fn_dat_updated_at();

drop trigger if exists trg_updated_at_o_khoa on public.danh_muc_khoa_o;
create trigger trg_updated_at_o_khoa
    before update on public.danh_muc_khoa_o
    for each row execute function public.fn_dat_updated_at();

-- Kéo các dòng CŨ về đúng giờ lần sửa cuối đã ghi trong audit. Không có audit
-- thì để nguyên — thà giữ giờ tạo còn hơn bịa ra một mốc.
update public.danh_muc_tong_hop_o o
   set updated_at = a.thoi_gian
  from (
        select goi_id, nam_de_xuat, ma_hang, cot, max(thoi_gian) as thoi_gian
          from public.danh_muc_tong_hop_o_audit
         group by 1, 2, 3, 4
       ) a
 where a.goi_id = o.goi_id
   and a.nam_de_xuat = o.nam_de_xuat
   and a.ma_hang = o.ma_hang
   and a.cot = o.cot
   and a.thoi_gian > o.updated_at;
