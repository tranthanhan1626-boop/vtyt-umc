# Ghi đè danh mục chuẩn từ bảng Tổng hợp — kế hoạch

Chốt với chủ dự án 27/08/2026. Chưa thi công.

## Quyết định

| | |
|---|---|
| Thời điểm ghi | Bấm **chốt trình ký** (`chot_trinh_ky_toan_bo_v3`) |
| Cột được ghi | 15: 7 cột đã có trong `vat_tu` + 8 cột `NGUON_KHONG_CO` |
| Khoa sửa | KHÔNG đẩy xuống chuẩn — chỉ PĐD chốt |
| Mở chốt | Không tự lùi |
| Lưu theo kỳ | CÓ — mã × đợt |
| Ai thắng | **Đợt nào chốt SAU thì giá trị đó hiệu lực** |
| Mã không sửa ở đợt này | Không ghi dòng mới, kế thừa dòng chốt gần nhất |

## Vì sao không đụng `vat_tu`

Đo được 27/08: `seed_danh_muc.py` upsert đè `ten_vat_tu` + `dvt` cho cả 3.327
mã mỗi lần HIS có mã mới; `seed_thong_tin_vtyt.py` đè 5 cột đặc tả. Ghi thẳng
vào `vat_tu` thì lần nạp HIS T7+T8/2026 sắp tới xoá sạch công gõ, không báo gì.

Tách bảng riêng → `vat_tu` là nền HIS, bảng chốt thắng khi đọc. Hai script cứ
chạy như cũ, không phải rào.

Cũng đo được: `vat_tu` có 0 trigger, nhưng RLS chỉ cho `admin` UPDATE, mà
`pdd@umc.edu.vn` mang vai `dieu_duong` → mọi đường ghi phải qua `security definer`.

## Bảng mới `danh_muc_chot_ky`

    id        bigserial pk
    dot_id    bigint not null references dot_de_xuat(id)
    ma_hang   text   not null references vat_tu(ma_hang)
    cot       text   not null          -- 1 trong 15 khoá
    gia_tri   text
    chot_boi  text
    chot_luc  timestamptz not null default now()
    unique (dot_id, ma_hang, cot)

Đọc hiệu lực: `distinct on (ma_hang, cot) … order by ma_hang, cot, chot_luc desc`.

RLS: SELECT cho mọi authenticated; không policy ghi nào — chỉ hàm definer ghi được.

## 15 cột: khoá lưới -> nguồn

Có sẵn trong `vat_tu`: ten_vt_2627→ten_vat_tu · tskt_2627→tieu_chi_ky_thuat ·
dvt · ten_tm_2627→ten_thuong_mai · ma_sp→ky_ma_hieu · hang_sx→hang ·
nuoc_sx→nuoc_san_xuat

Chưa có chỗ nào (nay sống trong bảng chốt): ma_tt04 · ten_tt04 · his_1599 ·
his_957 · ma_kt · quy_cach · co_dinh_276 · phan_nhom_tt14

KHÔNG BAO GIỜ ghi: sl_* · theo_18t_* · dai_p50_p75 · mua_them_30 · giai_trinh ·
sl_de_xuat_2627 · ma_nhom · ten_nhom_ql (số tính ra / readonly).

## View `v_danh_muc_chuan`

1 dòng/mã, bẹt 15 cột, đã gộp nền `vat_tu`, kèm khối "kỳ trước" cho 6 cột
2025-2026 đang trống. Hai màn đọc view này thay cho `vat_tu`.

⚠️ Bẫy 26/08: view gộp không có cột `id` mà `fetchAllRows` phân trang bằng
`order: "id"`. Đã kiểm — cả hai chỗ gọi đều dùng `{ order: "ma_hang" }`, an toàn.

## Hàm `day_ky_ve_danh_muc(p_dot_goi_id)`

`security definer`, gọi trong `chot_trinh_ky_toan_bo_v3`. Chép từ
`danh_muc_tong_hop_o` của đúng `goi_id = <goi>:dot:<N>` sang bảng chốt, lọc:
cột nằm trong 15 khoá cho phép **và** giá trị khác giá trị đang hiệu lực.
Đường ghi ô giữ nguyên → 8 trigger hiện có vẫn chạy đủ.

## Frontend — 2 file

- `TongHopPdd.jsx:177` và `DanhMucDeXuatKhoa.jsx:145`: `from("vat_tu")` →
  `from("v_danh_muc_chuan")`, `.select()` thêm 15 cột.
- Gỡ 8 khoá khỏi `NGUON_KHONG_CO` (TongHopPdd) và các khoá tương ứng khỏi
  `NGUON_KHONG_CO_KHOA` (DanhMucDeXuatKhoa), gồm 6 cột kỳ 2025-2026.

## Nghiệm thu

pytest contract cho patch (khuôn `test_chuan_bi_dot_v3_contract.py`) →
`kiem_moi_man.py` → **bấm thật Chrome**: gõ TSKT mã bất kỳ → chốt trình ký →
mở màn khoa xem giá trị mới có sang không.

## Thứ tự "thầu nào thắng" — đã chốt 27/08/2026

Khoá sắp xếp là `chot_luc` = **thời điểm bấm chốt trình ký**, tức thời gian
phát sinh làm thầu. KHÔNG xét thời gian hiệu lực của gói.

> Chủ dự án 27/08: "thầu nào làm sau thì thầu đó xác nhận thông tin chính xác
> nhất cần cập nhật chứ không xét thời gian hiệu lực, xét thời gian phát sinh
> làm thầu".

⚠️ `dot_de_xuat` KHÔNG có cột nào mô tả khoảng hiệu lực. `thang_moc` là mốc
tháng của đợt, dùng để đặt tên ("T9/2026") và sắp xếp — đừng suy nó thành
khoảng thời gian gói có hiệu lực.
