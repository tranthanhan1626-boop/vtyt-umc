# Kịch bản demo cho lãnh đạo — mọi phép tính ra số tròn

> Dữ liệu trên site test, đợt **#108 — "TEST ĐẦY ĐỦ — Gói 18 tháng 1/2028 - 6/2029"**.
> 350 mã hàng · 50 khoa · cả 5 gói con đã chốt Q, đang ở giai đoạn **Chào giá**.
> Mọi số lượng là **bội của 1.000**, mỗi mã dùng một mức duy nhất — nên chia về
> khoa luôn chia hết, không có số lẻ nào trên màn hình.
>
> Đăng nhập: `pdd@umc.edu.vn` / `111111`

---

## Sân khấu: nhóm Stent động mạch vành

Gói **18T / Tim mạch** → mã quản lý **N06.02.020.01**. Bảy mã hàng cùng ĐVT
"Cái", nên đổ số qua lại giữa chúng được:

| Mã hàng | Khoa | Mỗi khoa | Tổng đi thầu |
|---|---|---|---|
| 63209 | 25 | 50.000 | **1.250.000** |
| 21032 | 40 | 20.000 | **800.000** |
| 63245 | 5 | 50.000 | **250.000** |
| **62569** | **10** | **10.000** | **100.000** ← mã diễn chính |
| 63711 | 25 | 2.000 | 50.000 |
| 63903 | 10 | 5.000 | 50.000 |
| 63136 | 20 | 2.000 | 40.000 |

Mở bảng: **Bàn điều hành → Danh mục tổng hợp**, hoặc dán thẳng
`#tong-hop-pdd/18t-tim-mach/108`

---

## Màn 1 — Nhà thầu rớt một phần, còn hàng thay thế

**Mã 62569 · 10 khoa × 10.000 = 100.000**

| Bước | Thao tác | Số trên màn |
|---|---|---|
| 1 | Gõ **50.000** vào ô **R1** (Chào giá), lý do bất kỳ | Trúng: 100.000 − 50.000 = **50.000** |
| 2 | Nhìn cột **Đã chia** | về **0**, nền đỏ, có nút **Chia** — nút "Xác nhận rớt" biến mất |
| 3 | Bấm **Chia** | 50.000 ÷ 10 khoa = **5.000 / khoa** |
| 4 | Cột **Xử lý rớt** | *Chưa xử lý **50.000*** |
| 5 | Bấm vào đó → chọn mã nhận **63209** | mỗi khoa được chuyển đúng phần rớt của mình: **5.000 / khoa** |

**Câu để nói:** *"Nhà thầu trượt một nửa mã này, nhưng trong cùng nhóm kỹ thuật
còn mã khác trúng. Phòng Điều dưỡng chuyển nhu cầu sang mã đó — số của từng
khoa giữ nguyên, tổng nhóm không đổi. Bệnh viện không thiếu hàng, và không phải
làm lại thủ tục."*

Điểm cần nhấn: hệ **chặn** không cho đổ sang mã khác đơn vị tính. Đo trên dữ
liệu thật: **68 trong 446 nhóm** có mã lệch ĐVT (Bộ với Cái) — đổ nhầm là sai
số hàng chục lần.

---

## Màn 2 — Rớt mà không còn hàng thay: tự chuyển tiếp sang đợt bổ sung

Chọn một mã ở **gói khác** (Dùng chung / GMHS) mà nhóm không còn mã nào trúng.

| Bước | Thao tác | Số trên màn |
|---|---|---|
| 1 | Gõ số rớt vào **R1**, bấm **Chia** | Đã chia = Trúng |
| 2 | Bấm **Xác nhận rớt (N)** trên thanh giai đoạn | hệ đưa phần chưa xử lý sang **đợt bổ sung tháng 9/2026** |
| 3 | Vào **Theo dõi chuyển tiếp mã rớt** | mỗi mã một dòng, sổ ra thấy từng khoa |
| 4 | Đăng xuất → đăng nhập một khoa | **chuông đỏ** + badge **"n mã rớt"** ở mục Gói bổ sung |
| 5 | Khoa mở danh mục đợt bổ sung | mã nằm sẵn, số **bằng đúng số rớt**, khoa sửa được |

**Câu để nói:** *"Mã rớt không rơi ra ngoài. Nó tự nằm sẵn trong đợt mua sắm bổ
sung gần nhất của từng khoa, với số lượng bằng đúng số đã rớt. Khoa vào sửa nếu
cần — khoa vẫn là người quyết cuối cùng. Không ai phải nhớ, không ai phải nhắc."*

Lịch đợt bổ sung cố định **tháng 1 · 5 · 9**, luôn mở sẵn. Rớt tháng nào thì vào
đợt gần nhất chưa chốt số: rớt tháng 3 → đợt tháng 5.

---

## Màn 3 — Hai bên nhìn thấy nhau

Hộp thư ở **chuông trên cùng**, cả hai vai trò:

- Phòng Điều dưỡng thấy: khoa nào vừa sửa số, mỗi lần đổ mã, mỗi lần chuyển tiếp.
- Khoa thấy: mã nào của mình vừa rớt, đã vào đợt bổ sung nào, PĐD vừa sửa gì.

Sửa vặt **gộp một dòng mỗi ngày**; **xem xong là xoá hẳn** nên hộp thư không
bao giờ phình. Ở quy mô thật một lần chuyển tiếp chỉ đẻ **61 dòng** cho 60 khoa,
không phải 1.609 dòng.

---

## Con số nên đưa ra khi bị hỏi "chạy nổi ở quy mô thật không"

Đã đo thật, không phải ước lượng:

| | |
|---|---|
| Quy mô đã chạy | **250 mã hàng × 60 khoa** = 5.470 dòng đề xuất |
| Mở bảng tổng hợp | **4,1 giây** |
| Chuyển tiếp 1.601 dòng rớt về đợt bổ sung | **1,7 giây** |
| Bộ dữ liệu đang demo | 350 mã × 50 khoa, **7.575 dòng**, cả 5 gói con |
| Dung lượng database | 122 / 500 MB |

---

## Ba chỗ hệ CHẶN CỨNG, không cho làm sai

1. Tổng theo mã hàng phải bằng tổng đã chốt cho cả mã quản lý.
2. Tổng chia về các khoa phải bằng số trúng — **chưa chia xong thì không xác
   nhận rớt được** (nút tự ẩn).
3. Tổng rớt ba giai đoạn không được vượt số mang đi thầu.

Ngoài ba chỗ đó web **không chặn quy trình**: không hạn nộp, không duyệt trung
gian. Web là sổ ghi, máy tính và dấu vết — thương lượng vẫn ở Teams.
