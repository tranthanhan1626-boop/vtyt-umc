# Kịch bản demo cho lãnh đạo — số thật, tính từ lịch sử thật

> Site test, đợt **#118 — "TEST ĐẦY ĐỦ — Gói 18 tháng 1/2028 - 6/2029"**.
> **323 mã hàng · 50 khoa · 2.561 dòng đề xuất**, cả 5 gói con đã chốt số đi
> thầu và đang ở giai đoạn **Chào giá**.
> Đăng nhập: `pdd@umc.edu.vn` / `111111`

---

## Điều đáng nói nhất về bộ dữ liệu này

**100% mã hàng có tổng đề xuất nằm trong dải P50–P75** tính từ chính lịch sử
xuất kho của mã đó — đúng dải mà web hiện ở cột *"Dải thường P50–P75"*.

Đây không phải số bịa cho đẹp. Dải được tính bằng **chính công thức của web**
(`src/lib/congThucSoLuong.js`, gọi qua `frontend/tools/tinh-dai-p50-p75.mjs`) —
một công thức, một bản, không có bản thứ hai viết lại cho script.

**Số khoa cũng theo sản lượng thật:**

| Loại vật tư | Ví dụ | Số khoa | Vì sao |
|---|---|---|---|
| Dùng khắp viện | Khẩu trang y tế | **50 khoa** | gần như khoa nào cũng dùng |
| Dùng nhiều khoa | Tấm lót 60×90 | **40 khoa** | khoa lâm sàng dùng |
| Chuyên khoa | Stent động mạch vành | **2–4 khoa** | chỉ can thiệp tim mạch dùng |

Nếu lãnh đạo hỏi *"số này ở đâu ra"* — trả lời: **lịch sử xuất kho 141.623 dòng
của chính bệnh viện**, không phải số giả.

---

## Sân khấu: gói 18T / Dùng chung

Mở `#tong-hop-pdd/18t-dung-chung/118`, hoặc **Bàn điều hành → Danh mục tổng hợp**.

| Mã hàng | Tên | Khoa | Mỗi khoa | Tổng đi thầu | Dải P50–P75 |
|---|---|---|---|---|---|
| **66510** | Khẩu trang y tế dây thun | 50 | 28.000 | **1.400.000** | 1.388.162 – 1.428.368 |
| 74372 | Khẩu trang 4 lớp | 50 | 11.500 | 575.000 | 555.657 – 597.071 |
| **66418** | Tấm lót 60 × 90cm | 40 | 4.000 | **160.000** | 158.001 – 161.878 |
| 66417 | Tấm lót 60 × 60cm | 40 | 3.000 | 120.000 | 116.639 – 120.795 |
| 66421 | Tấm lót 37cm × 36m | 25 | 3.000 | 75.000 | 74.539 – 79.515 |

Chỉ vào cột **Dải thường** và nói: *"Cột này là mức bình thường của chính bệnh
viện mình, máy tính ra từ lịch sử. Số đề xuất nằm gọn trong đó — không ai phải
tranh cãi con số là nhiều hay ít."*

---

## Màn 1 — Rớt một phần, còn hàng thay trong cùng nhóm

**Mã 66418 · Tấm lót 60 × 90cm · 40 khoa × 4.000 = 160.000 Miếng**

| Bước | Thao tác | Số ra |
|---|---|---|
| 1 | Gõ **40.000** vào ô **R1** (Chào giá) + lý do | Trúng = 160.000 − 40.000 = **120.000** |
| 2 | Nhìn cột **Đã chia** | về **0**, nền đỏ, có nút **Chia**; nút "Xác nhận rớt" biến mất |
| 3 | Bấm **Chia** | 120.000 ÷ 40 khoa = **3.000 / khoa** |
| 4 | Cột **Xử lý rớt** | *Chưa xử lý **40.000*** |
| 5 | Bấm → chọn mã nhận **66417** (Tấm lót 60×60, cùng nhóm K00.24.000.01, cùng ĐVT Miếng) | mỗi khoa chuyển đúng phần của mình: **1.000 / khoa** |

**Câu để nói:** *"Nhà thầu trượt một phần mã này, nhưng cùng nhóm kỹ thuật còn
mã khác trúng. Phòng Điều dưỡng chuyển nhu cầu sang mã đó — số của từng khoa
giữ nguyên, tổng nhóm không đổi. Bệnh viện không thiếu hàng, không phải làm lại
thủ tục."*

Điểm nhấn: hệ **chặn** không cho đổ sang mã khác đơn vị tính. Đo trên danh mục
thật: **68 trên 446 nhóm** có mã lệch ĐVT (Bộ với Cái) — đổ nhầm là sai số hàng
chục lần.

---

## Màn 2 — Rớt mà nhóm hết hàng thay: tự chuyển tiếp sang đợt bổ sung

Chọn một mã ở gói khác (**GMHS** hoặc **Tim mạch**) mà nhóm không còn mã trúng.

| Bước | Thao tác | Kết quả |
|---|---|---|
| 1 | Gõ số rớt vào **R1** → bấm **Chia** | Đã chia = Trúng |
| 2 | Bấm **Xác nhận rớt (N)** trên thanh giai đoạn | phần chưa xử lý sang **đợt bổ sung tháng 9/2026** |
| 3 | Vào **Theo dõi chuyển tiếp mã rớt** | mỗi mã một dòng, sổ ra thấy từng khoa |
| 4 | Đăng xuất → đăng nhập một khoa | **chuông đỏ** + badge **"n mã rớt"** ở Gói bổ sung |
| 5 | Khoa mở danh mục đợt bổ sung | mã nằm sẵn, số **bằng đúng số rớt**, khoa sửa được |

**Câu để nói:** *"Mã rớt không rơi ra ngoài. Nó tự nằm sẵn trong đợt mua sắm bổ
sung gần nhất của khoa, số lượng bằng đúng số đã rớt. Khoa vào sửa nếu cần —
khoa vẫn quyết cuối cùng. Không ai phải nhớ, không ai phải nhắc."*

Lịch đợt bổ sung cố định **tháng 1 · 5 · 9**, luôn mở sẵn. Rớt tháng nào vào đợt
gần nhất chưa chốt số: rớt tháng 3 → đợt tháng 5.
Bốn đợt đã mở sẵn để xem: **T9/2026 · T1/2027 · T5/2027 · T9/2027**.

---

## Màn 3 — Hai bên nhìn thấy nhau

Hộp thư ở **chuông trên cùng**, cả hai vai trò:

- Phòng Điều dưỡng thấy: khoa nào vừa sửa số · mỗi lần đổ mã · mỗi lần chuyển tiếp.
- Khoa thấy: mã nào của mình vừa rớt · đã vào đợt bổ sung nào · PĐD vừa sửa gì.

Sửa vặt **gộp một dòng mỗi ngày**, **xem xong là xoá hẳn** nên hộp thư không bao
giờ phình. Ở quy mô thật một lần chuyển tiếp chỉ đẻ **61 dòng** cho 60 khoa,
không phải 1.609 dòng.

---

## Khi bị hỏi "chạy nổi ở quy mô thật không"

Đã đo thật, không ước lượng:

| | |
|---|---|
| Quy mô đã chạy thử | **250 mã hàng × 60 khoa** = 5.470 dòng đề xuất |
| Mở bảng tổng hợp | **4,1 giây** |
| Chuyển tiếp 1.601 dòng rớt về đợt bổ sung | **1,7 giây** |
| Dung lượng database | 122 / 500 MB |
| Lịch sử xuất kho đang dùng để tính dải | **141.623 dòng** |

---

## Ba chỗ hệ CHẶN CỨNG, không cho làm sai

1. Tổng theo mã hàng phải bằng tổng đã chốt cho cả mã quản lý.
2. Tổng chia về các khoa phải bằng số trúng — **chưa chia xong thì không xác
   nhận rớt được** (nút tự ẩn).
3. Tổng rớt ba giai đoạn không được vượt số mang đi thầu.

Ngoài ba chỗ đó web **không chặn quy trình**: không hạn nộp, không duyệt trung
gian. Web là sổ ghi, máy tính và dấu vết — thương lượng vẫn ở Teams.
