# Lộ trình tự bấm thử — cho chủ dự án

Soạn 28/09/2026, trên dữ liệu test **đợt #202** đang có sẵn (chủ dự án chọn dùng
luôn, không dọn). Mỗi bước ghi **trang** trong
`huong-dan-su-dung/HuongDan_SuDung_VTYT.pdf` để mở đối chiếu. Lộ trình này
**không tả lại nút bấm** — tả nút là việc của PDF; đây chỉ là thứ tự đi và chỗ cần soi.

## 0. Trước khi bấm

1. Bấm đúp **`MO_WEB.command`** ở thư mục gốc repo. Chờ khoảng nửa phút, trình
   duyệt tự mở `http://localhost:4173`. Cửa sổ Terminal phải ghi
   `Database: STAGING`. Tắt web: đóng cửa sổ Terminal.
2. Tài khoản — mật khẩu đều là `111111`:

   | Vai | Email | Khoa |
   |---|---|---|
   | PĐD | `pdd@umc.edu.vn` | Phòng Điều dưỡng |
   | Khoa 1 | `dvsd1@umc.edu.vn` | Khoa GMHS - Phòng mổ — có đề xuất ở cả 4 gói con |
   | Khoa 2 | `dvsd2@umc.edu.vn` | Khoa Phẫu thuật hàm mặt RHM — chỉ gói Dùng chung |
   | Khoa 3 | `dvsd3@umc.edu.vn` | Khoa Ngoại thần kinh — chỉ gói Dùng chung |

   Muốn xem hai vai cùng lúc: mở vai thứ hai trong **cửa sổ ẩn danh**.
3. Dữ liệu đang có (đọc thật 28/09):

   | Đợt | Là gì | Tình trạng |
   |---|---|---|
   | #202 | Gói 18 tháng 1/2028 - 6/2029 — **test** | 50 khoa, 2.485 đề xuất; mọi khoa đã xác nhận; **đã chốt Q** cả 5 gói con; đã mở giai đoạn Chào giá; đã có 15 dòng chuyển tiếp mã rớt |
   | #203–#206 | Bổ sung T9/2026 · T1/2027 · T5/2027 · T9/2027 | đang mở; giỏ có 17 mục mã rớt |

   ⚠️ **Staging cũng là hệ thật duy nhất.** Được phép làm bẩn các đợt trên (đều
   là test). Không bấm nút **"Dọn dữ liệu kiểm thử"** trừ khi định xoá thật.

## 1. Phần chung — bất kỳ tài khoản nào (≈10 phút)

- [ ] Đăng nhập — trang **7**
- [ ] Thanh tiến trình: ô tô đậm có đúng bước đang làm không — trang **8**
- [ ] Trợ giúp: bấm vài câu hỏi — trang **9**
- [ ] Chuông hộp thư — trang **10**

## 2. Khoa gõ một đề xuất mới (dvsd1, ≈20 phút)

Làm ở **một đợt bổ sung**, vì gói 18 tháng #202 đã chốt Q.

- [ ] Trang chính của khoa → menu trái chọn gói bổ sung — trang **12–13**
- [ ] Tìm một nhóm kỹ thuật — trang **14**
- [ ] Bước ① đơn vị tính → ② tổng và kỳ dùng, xem mức gợi ý P50–P95 → ③ chia
      cho mã hàng — trang **15–18**
- [ ] Thêm vào giỏ, xem giỏ, gửi — trang **19–20**
- [ ] Mở danh mục của khoa, thấy mã vừa gửi — trang **21**
- [ ] Xác nhận thông tin đề xuất — trang **22**
- [ ] (tuỳ) Thử "Không phát sinh nhu cầu" ở một gói khác — trang **23**

Soi: số gợi ý có hợp lý với khoa đó không · bao nhiêu cú bấm cho một mã (đây là
việc code đáng làm nhất còn lại — xem `05` mục 7, việc 6).

## 3. PĐD chạy thầu trên đợt #202 (pdd, ≈40 phút)

- [ ] Bàn điều hành: chọn gói con, xem khoa nào đã gửi/xác nhận — trang **28–29**
- [ ] Mở bảng Tổng hợp, đọc cột — trang **30**
- [ ] (tuỳ) Sửa số một khoa: phải **Mở chốt** trước vì đã chốt Q — trang **31–32**
- [ ] Ba giai đoạn thầu — trang **33**
- [ ] Gõ số rớt R1 · R2 · R3 cho vài mã — trang **34**
- [ ] **Chia số trúng về khoa** — trang **35**
- [ ] Đổ sang mã tương đương (nếu mã rớt có mã cùng mã quản lý) — trang **36**
- [ ] **Xác nhận rớt** — trang **37**
- [ ] Theo dõi chuyển tiếp mã rớt: mã vừa rớt đi về đợt bổ sung nào — trang **43**
- [ ] Chốt trình ký (một nút cho cả gói con; 50 khoa mất khoảng một phút) — trang **38**
- [ ] Xuất Excel tổng hợp — trang **39**

Thứ tự sau khi có kết quả thầu **hệ sẽ chặn nếu làm sai**: gõ số rớt → chia số
trúng → đổ mã tương đương → chia lại → Xác nhận rớt. Bị chặn đúng chỗ đó là đúng,
không phải lỗi.

## 4. Khoa xem kết quả (dvsd1, ≈10 phút)

- [ ] Kết quả thầu hiện trên danh mục — trang **24**
- [ ] Mã vừa rớt ở bước 3 đã nằm trong giỏ bổ sung — trang **25**
- [ ] Báo một mã rớt "không cần nữa" — trang **26**
- [ ] Chuông có thông báo từ PĐD không — trang **10**

## 5. Màn quản trị của PĐD — chỉ XEM, đừng đổi (≈5 phút)

- [ ] Quản lý đợt đề xuất — trang **40**. Muốn thử "mở đợt mới" thì đặt tên có
      chữ TEST cho dễ dọn.
- [ ] Gán khoa cho tài khoản — trang **41**. Đừng đổi khoa của 3 tài khoản test.
- [ ] Nạp dữ liệu HIS — trang **42**. Chưa có file T7–T8/2026, bỏ qua.

## Lỗi đã biết — không cần báo lại

(từ kiểm định tài liệu hướng dẫn 19/09, `.scratch/huong-dan/KIEM_DINH_3.md` mục 3)

- Ô chọn đợt liệt kê **mọi** đợt bổ sung → chọn đúng đợt có chữ tháng và năm mình cần.
- Ở gói bổ sung, tiêu đề cột ghi "SL ĐỀ XUẤT 18 tháng" — sai chữ, số vẫn đúng.

## Gặp lỗi thì ghi thế này

Mỗi lỗi một dòng, gửi lại cho Claude:

```
Tài khoản · màn nào · bấm gì · thấy gì · đáng lẽ phải thấy gì · (ảnh chụp nếu có)
```

Claude sẽ tự bấm lại để bắt lỗi trước khi vá (luật `AGENTS.md`: xây xong phải
bấm thử thật).

## Test xong muốn dọn

**Nhờ Claude xem trước phạm vi rồi soạn lệnh** — đừng gõ theo trí nhớ. Chủ dự án
tự gõ lệnh ghi (Claude bị chặn ghi database), và luôn sao lưu trước.

Hai điều đã kiểm 28/09:

- ❌ `tao_du_lieu_test_day_du.py --xoa` **không dọn được đợt #202**: nó tìm đợt
  theo tên `TEST ĐẦY ĐỦ — Gói 18 tháng…`, còn tên trong DB đã đổi thành
  `Gói 18 tháng 1/2028 - 6/2029`. Nó cũng không đụng tới bốn đợt bổ sung #203–#206.
- `don_sach_moi_dot.py --xac-nhan-staging --that-su-xoa` xoá **mọi** đợt và mọi
  thứ đợt đẻ ra (đề xuất, giỏ, chốt, thầu…), giữ dữ liệu nền; không đụng bảng
  `de_xuat_ky_truoc`. Đây là script đã dùng để dọn 26/08.

Sao lưu trước khi dọn:

```bash
cd backend && set -a && . ./.env.local && set +a
.venv/bin/python scripts/sao_luu.py --staging
```
