# ĐỌC TRƯỚC KHI CODE — Web VTYT (Phòng Điều dưỡng ↔ ĐVSD)

> **Đây là bản SAO chụp lại tại một thời điểm**, không phải nguồn sống. Bản gốc
> đang làm việc nằm ở gốc repo (`ROADMAP.md`, `QUYET_DINH.md`,
> `LOOP_ENGINEERING.md`, `backend/CLAUDE.md`, `docs/`). Muốn bản mới nhất, nhờ
> tổng hợp lại thư mục này thay vì đọc file trong đây làm chuẩn khi đã cách xa
> ngày tạo.

Sản phẩm: một cuốn sổ làm việc chung giữa **Đơn vị sử dụng (ĐVSD)** và
**Phòng Điều dưỡng (PĐD)**, mở rộng trên web đang chạy thật (React + Supabase).
**Không làm dự báo/AI tính số lượng** — xem lý do ở file 01, mục QĐ-01.

---

## Đọc theo đúng thứ tự này

| # | File | Trả lời câu hỏi gì |
|---|---|---|
| 01 | `01_QUYET_DINH_DA_CHOT.md` | Cái gì đã CHỐT, vì sao — luật cao nhất, mọi file khác phải tuân theo |
| 02 | `02_DAC_TA_SAN_PHAM.md` | Sản phẩm làm gì, cho ai, KHÔNG làm gì |
| 03 | `03_MO_HINH_DU_LIEU.md` | Bảng nào có sẵn, bảng nào thêm mới, RLS ra sao |
| 04 | `04_KE_HOACH_CODE.md` | Thứ tự lát cắt kỹ thuật để code — **dev bám theo file này khi code** |
| 05 | `05_QUY_TRINH_LAM_VIEC_VOI_AI.md` | Cách làm việc theo vòng lặp: cổng an toàn, Definition of Done |
| 06 | `06_LO_TRINH_SO_GHI_NGHIEP_VU.md` | Mốc nghiệp vụ theo THỜI GIAN (neo vào 01/01/2027) — dùng để biết ưu tiên theo lịch, không phải thứ tự code |
| 07 | `07_BAY_KY_THUAT_DA_GAP.md` | Bẫy kỹ thuật THẬT đã gặp và đã sửa — đọc kỹ mục 5 trước khi đụng RLS/SQL/Word |
| 08 | `08_HUONG_DAN_SUA_FRONTEND.md` | Bản đồ chức năng ↔ file ↔ bảng, sửa nhãn/dropdown ở đâu |

Thư mục `boi-canh-phan-tich/` — không bắt buộc đọc để code, nhưng giải thích
**vì sao** sản phẩm không làm dự báo ngay: công thức cũ, backtest, đề án chiến
lược, phương pháp demo RHM.

## File 04 và file 06 khác nhau ở chỗ nào — dễ nhầm nhất

- **File 04 (Kế hoạch code)** = trả lời "code cái gì trước, cái gì sau" theo
  **phụ thuộc kỹ thuật** (không đổi schema trước khi có staging, không code UI
  trước khi có API...). Dev bám theo file này khi ngồi viết code.
- **File 06 (Lộ trình sổ ghi)** = trả lời "phải xong TRƯỚC NGÀY NÀO" theo
  **mốc nghiệp vụ** (01/01/2027 là ngày kỳ thầu mới bắt đầu, không lùi được).
  Dùng để biết việc gì gấp, việc gì có thể lùi sang sau go-live.

Nếu hai file mâu thuẫn nhau ở một điểm cụ thể: **file 01 (Quyết định) luôn
thắng**. Phát hiện mâu thuẫn thì báo lại để thêm quyết định mới, không tự chọn
bên nào đúng.

## Ba ranh giới không được vượt qua khi code (nhắc lại từ file 01, vì quan trọng nhất)

1. **Không làm dự báo/tính hệ số** trước khi có 12 tháng dữ liệu có ghi số ngày
   hết hàng (khoảng Q4/2027).
2. **Không xoá dữ liệu** trong các sổ đang chạy (thiếu hàng, sự kiện nhu cầu,
   đề xuất). Chỉ ẩn kèm lý do + người + thời điểm.
3. **Local và production dùng chung 1 Supabase** cho tới khi có staging riêng —
   mọi thao tác sửa/xoá dữ liệu phải xem trước bằng `select`, xác nhận rồi mới
   chạy.

## Người phụ trách nghiệp vụ

Chủ dự án (Phòng Điều dưỡng) không đọc code, quyết định qua xem **ảnh chụp màn
hình thật**, không qua mô tả bằng lời. Xem quy trình cụ thể ở file 05.
