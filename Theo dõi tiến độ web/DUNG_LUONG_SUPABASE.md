# Dung lượng Supabase — đo thật và cách giữ free vĩnh viễn

**Đo ngày 31/07/2026 trên staging** (đã có đủ dữ liệu thật của production).

---

## 1. Hiện tại: 38 MB / 500 MB — dùng 7,6%

| Bảng | Dòng | ~KB/dòng | ~Tổng |
|---|---:|---:|---:|
| `usage_history_current` | 149.999 | 0,26 | **38 MB** |
| `ho_so_cong_tac_lich_su` | 10 | 3,44 | 34 KB |
| `lan_xuat_ho_so` | 13 | 1,43 | 19 KB |
| `ho_so_cong_tac` | 4 | 4,09 | 16 KB |
| `proposals` | 16 | 0,58 | 9 KB |

**Web KHÔNG lưu file Excel/Word** (QĐ-12) — file sinh thẳng trong trình duyệt,
không đi qua Supabase Storage. Nên **1 GB Storage của free tier vẫn còn nguyên,
chưa dùng byte nào.**

---

## 2. Rủi ro thật KHÔNG phải file — mà là SNAPSHOT dạng JSON

Các bảng sau lưu **nguyên nội dung** dưới dạng `jsonb` để tái lập đúng bản đã nộp:

`lan_xuat_ho_so` · `ho_so_cong_tac` · `ho_so_cong_tac_lich_su` ·
`phien_tong_hop` · `de_nghi_sua_tieu_chi`

Hiện mỗi bản chỉ vài KB **vì đang test với ít mã**. Chiếu sang quy mô thật:

```
1 hồ sơ khoa ~200 mã hàng           → ~100 KB/bản
66 khoa × 3 gói × 5 loại file       → ~990 bản/kỳ
Cộng revision (mỗi lần sửa 1 bản)   → ×3–5 lần

→ ƯỚC 100–300 MB MỘT KỲ THẦU
```

**Nghĩa là: chạy được kỳ đầu, nhưng kỳ thứ hai sẽ chạm trần 500 MB.**

---

## 3. Bốn cách giữ free vĩnh viễn — theo thứ tự hiệu quả

### 3.1 · Snapshot lưu ID, không lưu lại tên và đặc tả *(giảm ~80%)*

Hiện snapshot chép cả `ten_vat_tu`, `tieu_chi_ky_thuat`, `hang`, `nuoc_san_xuat`…
— toàn thứ **đã có sẵn trong `vat_tu`**.

Đổi thành lưu `{ma_hang, so_luong, don_vi, ky}` rồi **join lại lúc dựng file**.

> ⚠️ **Đánh đổi phải hiểu rõ:** nếu tên/đặc tả trong danh mục đổi sau đó, file
> dựng lại sẽ mang tên MỚI chứ không phải tên lúc nộp. Với hồ sơ thầu thì điều
> này **có thể không chấp nhận được**.
>
> **Cách dung hoà:** lưu đầy đủ cho bản **đã duyệt/đã nộp** (ít, quan trọng),
> lưu gọn cho bản **nháp và revision trung gian** (nhiều, ít quan trọng).

### 3.2 · Dọn revision trung gian sau khi kỳ đóng *(giảm ~60% phần lịch sử)*

Giữ: bản đầu · bản đã duyệt · bản cuối. Xoá các bản nháp ở giữa.
Chạy sau khi kỳ thầu chốt, không xoá đang giữa chừng.

### 3.3 · Lịch sử xuất dùng chỉ giữ 3 năm gần nhất *(giảm ~20 MB nếu cần)*

`usage_history_current` chiếm 38 MB — nhưng **bị ghi đè mỗi lần nạp, không cộng
dồn**, nên nó ĐỨNG YÊN, không phải nguồn phình. Chỉ đụng tới khi thật sự cần chỗ.

Dữ liệu cũ luôn nạp lại được từ Excel HIS nên xoá bớt không mất gì.

### 3.4 · Giỏ đang soạn xoá sau khi gửi ✅ *(đã làm)*

`gio_nhap` xoá ngay khi gửi — nội dung thật đã sang `proposals`.

---

## 4. Nếu vẫn chạm trần — ba lối thoát, đều miễn phí

| Cách | Việc phải làm |
|---|---|
| **Chuyển hồ sơ cũ ra máy** | Kỳ đóng rồi thì `sao_luu.py` xuất ra máy, xoá khỏi Supabase. Cần tra thì nạp lại |
| **Dựng project thứ hai** | Free tier cho 2 project. Kỳ cũ để project A, kỳ mới project B |
| **Đổi nền tảng** | Dữ liệu là Postgres chuẩn, phân quyền là SQL chuẩn — dựng lại được từ `schema.sql` + `rls_policies.sql` ở bất kỳ Postgres nào (QĐ-12) |

---

## 5. Việc nên làm và khi nào

| Khi nào | Làm gì |
|---|---|
| **Bây giờ** | Không cần làm gì. 7,6% là rất thoải mái |
| **Trước go-live 01/01/2027** | Chốt cách 3.1 — lưu đầy đủ cho bản đã duyệt, lưu gọn cho bản nháp |
| **Mỗi quý** | Chạy `sao_luu.py --kiem`, xem dung lượng ở Supabase Dashboard |
| **Khi tới 300 MB** | Làm 3.2 (dọn revision) + 4.1 (chuyển kỳ cũ ra máy) |

**Ngưỡng cảnh báo: 300 MB.** Đừng đợi tới 500 — lúc đó ghi mới sẽ lỗi và khoa
đang nhập dở sẽ mất dữ liệu.
