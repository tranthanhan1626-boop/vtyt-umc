# Workflow V3 — phase A / staging

Nguồn yêu cầu: `Full workflow vtyt web.docx` và bộ `Hướng dẫn build project/` cập nhật
17/08/2026. Mọi thay đổi thực hiện trên nhánh `phase-a-luong-de-xuat` và được
kiểm trên staging trước production.

## Thứ tự thi công

1. Nền: schema v2, RLS v2, `dot_goi`, migrate khóa và gỡ workflow đã bỏ.
2. Số theo khoa: `phan_bo_khoa`, view tổng hợp và phân bổ theo tỷ lệ.
3. Chốt Q: snapshot bất biến, cổng mềm, không phát sinh nhu cầu.
4. Sau đấu thầu: ba giai đoạn rớt, số trúng, phân bổ, giỏ rớt và 30%.
5. Chốt và xuất: revision hai tầng, Excel chính thức và smoke E2E.

## Bất biến

- Tổng mã hàng sau quy đổi bằng tổng mã quản lý.
- Tổng phân bổ về khoa bằng số trúng.
- Tổng rớt ba giai đoạn không vượt số tham gia thầu.
- `proposals` là dấu vết gốc, không sửa đè.
- Mọi trạng thái và khóa nghiệp vụ nằm trong đúng một `DOT_GOI`.

