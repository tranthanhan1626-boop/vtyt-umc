-- Phục hồi nhu cầu bị CHE bởi thiếu hàng, cho khoảng gợi ý phân vị (QĐ-27).
--
-- Đề án `DE_AN_DU_BAO_NHU_CAU_VA_DU_TRU_MUA_THAU_VTYT.docx`, mục 3.4:
--
--     Y_t      = min(D_t, C_t)            -- số xuất kho chỉ là CẬN DƯỚI
--     U_direct = max(yêu cầu hợp lệ − đã cấp − thay thế, 0)
--     D_lower  = F + U_direct
--
-- Nghĩa là: tháng nào khoa báo hết hàng / cấp hạn chế thì con số xuất kho của
-- tháng đó KHÔNG phải nhu cầu, nó là mức trần của kho. Học trung bình và độ
-- lệch chuẩn trên những tháng đó sẽ tái tạo đúng giới hạn cung ứng cũ — đúng
-- cái QĐ-01 đã cảnh báo từ đầu.
--
-- View này KHÔNG sửa lịch sử xuất kho. Đề án mục 3.4: "Không được ghi đè số
-- xuất gốc bằng một con số bù mà không còn dấu vết." Chart vẫn vẽ số xuất
-- thật; chỉ riêng công thức mới cộng phần thiếu có bằng chứng vào.
--
-- Hai mức chất lượng, FE phải phân biệt:
--   thieu_co_bang_chung > 0  → khoa có ghi sl_yeu_cau/sl_duoc_cap, CỘNG LẠI ĐƯỢC
--   bi_nen = true, thiếu = 0 → chỉ biết tháng đó thiếu, không biết thiếu bao
--                              nhiêu. LOẠI tháng đó khỏi μ/σ, đừng coi là 0.
--
-- Chạy 1 lần trên STAGING.

begin;

create or replace view v_thieu_theo_thang
with (security_invoker = true) as
select
    s.don_vi,
    s.ma_hang,
    date_part('year',  s.ngay_bao)::int  as nam,
    date_part('month', s.ngay_bao)::int  as thang,
    -- Phần thiếu ĐO ĐƯỢC. Chỉ cộng khi khoa ghi cả hai số; thiếu một số thì
    -- không suy ra được, để 0 và đánh dấu bị nén.
    coalesce(sum(
        case when s.sl_yeu_cau is not null and s.sl_duoc_cap is not null
             then greatest(s.sl_yeu_cau - s.sl_duoc_cap, 0) end
    ), 0) as thieu_co_bang_chung,
    -- Tháng có bất kỳ lần báo hết hàng / cấp hạn chế nào.
    bool_or(s.tinh_trang in ('het_hang', 'cap_han_che')) as bi_nen,
    count(*) as so_lan_bao
from su_kien_thieu_hang s
where s.ma_hang is not null
  and s.an_khoi_bao_cao = false        -- QĐ-11: ẩn khỏi báo cáo thì ẩn cả ở đây
group by s.don_vi, s.ma_hang,
         date_part('year', s.ngay_bao), date_part('month', s.ngay_bao);

comment on view v_thieu_theo_thang is
    'Nhu cầu KHÔNG được đáp ứng, theo khoa × mã hàng × tháng. Dùng để phục hồi '
    'nhu cầu bị che trước khi tính μ/σ cho khoảng gợi ý phân vị. '
    'bi_nen=true mà thieu_co_bang_chung=0 nghĩa là biết thiếu nhưng không đo '
    'được — phải LOẠI tháng đó khỏi thống kê, không được coi là không thiếu.';

commit;
