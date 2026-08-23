# MỘT MẶT BÀN — thiết kế lại màn Tổng hợp danh mục PĐD

Viết 21/08/2026. Góc nhìn: **người dùng PĐD**, không phải lập trình viên.
Ba luật chốt cùng ngày làm nền:

1. Mọi thay đổi sửa **trực tiếp trên bảng tổng hợp**, không sửa ở màn khác.
2. Tích rớt xong, PĐD **gõ tay** số cho từng khoa (ô để trống), có thêm nút
   **"Chia theo tỉ lệ Q"** bấm khi lười gõ.
3. Tổng phân bổ ≠ số trúng: **cho lưu nháp**, tô đỏ, **chỉ chặn ở chốt trình ký**.

Kiến trúc không đụng: `proposals` bất biến → `phan_bo_khoa` là số hiện hành →
tổng hợp là VIEW SUM. Gõ trên grid vẫn ghi xuống dòng khoa. Q là snapshot bất
biến, số gõ sau rớt nằm ở **cột khác**.

---

## 1. Hiện trạng — PĐD phải đi bao nhiêu chỗ

Đếm từ mã nguồn (`TongHopPdd.jsx`, `BanDieuHanhPdd.jsx`, `KhungGoiThau.jsx`).
Chỗ nào không đếm chắc được thì ghi **(ước lượng)**.

| # | Việc PĐD làm | Đang ở màn nào | Click | Đổi màn/tab |
|---|---|---|---|---|
| 1 | Sửa 1 ô cột chữ (TSKT, tên VT) | Tổng hợp | 2 (ô → Lưu) | không |
| 2 | Sửa tổng SL 1 mã hàng | Tổng hợp | 3 (ô → Lưu → Lưu phân bổ) | không |
| 3 | Xem breakdown theo khoa | Tổng hợp | 1 (chevron) | không |
| 4 | Xem audit 1 ô | Tổng hợp | 1 (⏱) | không |
| 5 | **Tích rớt 1 mã hàng** | **Bàn điều hành › tab Tổng hợp** | **6–10** | **1 đổi màn + 1 tab + 1 modal** |
| 6 | **Rớt cả mã quản lý** | **Bàn điều hành › tab Tổng hợp** | **5–9** | như trên |
| 7 | **Rớt thêm giai đoạn 2/3** | **Bàn điều hành › tab Tổng hợp** | **5–8** | như trên |
| 8 | **Gõ số trúng cho các khoa** | **Bàn điều hành › tab Kết quả** | **3 + n ô** | **+1 tab** |
| 9 | Bắt đầu/hoàn thành 1 giai đoạn thầu | Bàn điều hành › tab Kết quả | 1 | +1 màn |
| 10 | Chốt số đi thầu (Q) | Tổng hợp | 1 | không |
| 11 | Chốt trình ký 1 khoa | Bàn điều hành › tab Kết quả | 1 × 49 khoa | +1 màn |
| 12 | Chốt trình ký toàn bộ | Bàn điều hành › tab Kết quả | 1 | +1 màn |
| 13 | Xuất Excel | Tổng hợp | 1 | không |

**Một mã hàng bị rớt, làm trọn vẹn = ~11–14 click và 3 lần đổi ngữ cảnh:**

```
Tổng hợp ──▶ Bàn điều hành/tab Tổng hợp ──▶ tab Kết quả ──▶ quay lại Tổng hợp
  (thấy mã)      (tích rớt, modal)          (gõ số khoa)      (kiểm số)
```

Chi tiết bước 5 (đếm thật): sidebar "Bàn điều hành" · chọn đợt · chọn gói con ·
tab "Tổng hợp" · bung mã quản lý · nút "Tích rớt" · chọn giai đoạn · tick "Rớt
toàn bộ" hoặc gõ số · gõ lý do · "Xác nhận rớt".

### Bốn thứ hỏng/khó chịu tìm thấy trong mã nguồn

| | Vấn đề | Bằng chứng |
|---|---|---|
| a | **Không có phím tắt nào.** Không Enter lưu, không Esc huỷ, không Tab sang ô kế. Mọi lần lưu đều phải rê chuột bấm nút "Lưu" | `grep onKeyDown` trên `TongHopPdd.jsx` + `DanhMucDeXuatKhoa.jsx` = **0 kết quả** |
| b | Nút **"Xem theo khoa ▾"** trên thanh công cụ là nút chết, không có `onClick` | `TongHopPdd.jsx:901` |
| c | Bảng Kết quả liệt kê **mọi mã có snapshot Q**, không lọc riêng mã rớt → phải cuộn tìm | `BanDieuHanhPdd.jsx:1386` |
| d | Cột số nằm lọt giữa 30 cột, cuộn ngang là mất khỏi tầm mắt | `COT_PDD` — `sl_de_xuat_2627` là cột thứ 24/30 |

---

## 2. Thiết kế mới — một grid, không rời màn

### 2.1 Nguyên tắc

> Mắt đọc một dòng từ trái sang phải là ra hết câu chuyện:
> **đề xuất bao nhiêu → chốt bao nhiêu → rớt bao nhiêu → còn bao nhiêu → chia về khoa thế nào.**

### 2.2 Bố cục cột

**Hai chế độ xem, đổi bằng 1 nút:**

| Chế độ | Dùng khi | Cột hiện |
|---|---|---|
| **Làm việc** (mặc định) | PĐD đang gõ | ~10 cột — vừa màn hình, **không cuộn ngang** |
| **Đầy đủ 30 cột** | đọc đối chiếu, trước khi xuất Excel | đủ 30 cột chuẩn bệnh viện, nhóm SỐ **ghim phải** |

**Cột ở chế độ Làm việc:**

| Vùng | Cột | Ghi chú |
|---|---|---|
| Ghim trái | ☐ chọn · STT · HIS QĐ1599 · **Tên vật tư 2026-2027** | 2 cột sau đã có `freeze:true` sẵn |
| Nhóm SỐ | **Đề xuất** · Dải P50–P75 · **Q** · **R1** · **R2** · **R3** · **Trúng** · **Đã chia** | trái tim của màn |
| Cuối dòng | ▾ n khoa | bấm để sổ |

**Luật từng cột số:**

| Cột | Nguồn | Sửa được? |
|---|---|---|
| Đề xuất | SUM `phan_bo_khoa.so_luong_hien_hanh` | ✅ trước chốt Q · gõ tổng → chia xuống khoa |
| Dải P50–P75 | công thức | ❌ |
| **Q** | snapshot chốt đi thầu | ❌ **bất biến, nền xám** |
| **R1 / R2 / R3** | ngoại lệ rớt từng giai đoạn | ✅ **ba ô riêng** |
| **Trúng** | `Q − R1 − R2 − R3` | ❌ tính tại chỗ |
| **Đã chia** | SUM số trúng đã phân bổ về khoa | ❌ · **≠ Trúng thì tô đỏ** |

> **Ba ô R1/R2/R3 riêng biệt là chỗ chữa lỗi cũ.** Lỗi hiện tại ("mã đã có rớt
> thì mất đường nhập giai đoạn sau") sinh ra vì UI cũ là **một nút bập bênh**
> `rot ? "Bỏ tích" : "Tích rớt"`. Ba ô thì không có gì để kẹt: ô nào trống thì
> gõ vào ô đó. DB vốn đã nhận đủ R1+R2+R3 rồi.

**Ẩn mặc định ở chế độ Làm việc:** nhóm Lịch sử (SL 2019→7T2025, Theo 18T), nhóm
Thương mại 2026-2027, nhóm Phân nhóm quản lý (TT04, TT14). Cơ chế `cotAn` đã có.

### 2.3 Ba trạng thái của grid — mockup

**(1) Bình thường**

```
┌─ Tổng hợp danh mục đề xuất · 18T/Dùng chung · Đợt 39 ────────────────────────────────────┐
│ Giai đoạn: [Chào giá ●][Mở thầu][Đánh giá]   Lọc:[Tất cả ▾]  ⚠ 3 dòng lệch   🔍[      ]  │
│ [Làm việc│Đầy đủ]  [Cột ▾]  [Chốt số đi thầu]  [Chốt trình ký]  [Xuất Excel ▾]           │
├──┬─────────┬──────────────────────┬─────────┬─────────┬─────────┬──────┬──────┬──────┬────────┤
│☐ │HIS 1599 │ Tên vật tư 2026-2027 │ Đề xuất │ P50–P75 │    Q    │  R1  │  R2  │  R3  │  Trúng │
├──┼─────────┼──────────────────────┼─────────┼─────────┼─────────┼──────┼──────┼──────┼────────┤
│☐ │▸ N03.03.050.07 · Kim luồn tĩnh mạch (4 mã hàng)  │ 161.000 │      │      │      │161.000 │
│☐ │  67159  │ Kim luồn 22G     ▾3 │ 121.000 │ 98k–134k│ 121.000 │  —   │  —   │  —   │121.000 │
│☐ │  67160  │ Kim luồn 24G     ▾2 │  40.000 │ 31k–52k │  40.000 │  —   │  —   │  —   │ 40.000 │
└──┴─────────┴──────────────────────┴─────────┴─────────┴─────────┴──────┴──────┴──────┴────────┘
```

**(2) Đang sổ khoa — trước thầu, sửa số đề xuất**

```
│☐ │  67159  │ Kim luồn 22G     ▾3 │ 121.000 │ 98k–134k│ 121.000 │  —   │  —   │  —   │121.000 │
│  └─ 3 khoa đề xuất mã này                  │         │         │                     │        │
│     Khoa                                   │ Đề xuất │         │ Q khoa  │           │ Trúng  │
│     Khoa GMHS - Phòng mổ                   │[ 80.000]│         │  80.000 │           │ 80.000 │
│     Khoa PT hàm mặt RHM                    │[ 25.000]│         │  25.000 │           │ 25.000 │
│     Khoa Ngoại thần kinh                   │[ 16.000]│         │  16.000 │           │ 16.000 │
│     ────────────────────────────────────── │─────────│         │─────────│           │────────│
│     Tổng 3 khoa                            │ 121.000 │ ✓ khớp  │ 121.000 │           │121.000 │
```

**(3) Sau khi tích rớt — đang gõ số trúng cho khoa**

```
│☐ │  67159  │ Kim luồn 22G     ▾3 │ 121.000 │ 98k–134k│ 121.000 │[40.000]│20.000│  —  │ 61.000 │
│                                             ┌─ Lý do rớt R1 (bắt buộc) ──────────────────────┐│
│                                             │ (○)Không có nhà thầu  (●)Giá vượt dự toán      ││
│                                             │ (○)Không đạt TSKT     (○)Khác: [           ]   ││
│                                             │                                    ⏎ Lưu · Esc ││
│                                             └────────────────────────────────────────────────┘│
│  └─ Chia 61.000 về khoa · đang chia 45.000 · ⚠ CÒN LỆCH 16.000   [Chia theo tỉ lệ Q]         │
│     Khoa                          │ Đề xuất │  Q khoa │ Trúng khoa │ 30% (sau chốt trình ký) │
│     Khoa GMHS - Phòng mổ          │  80.000 │  80.000 │ [ 30.000 ] │            —            │
│     Khoa PT hàm mặt RHM           │  25.000 │  25.000 │ [ 15.000‸] │            —            │
│     Khoa Ngoại thần kinh          │  16.000 │  16.000 │ [        ] │            —            │
│     ───────────────────────────── │─────────│─────────│────────────│                         │
│     Tổng 3 khoa                   │ 121.000 │ 121.000 │  45.000 ⚠  │      cần 61.000         │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
  ⏎/Tab = khoa kế · Ctrl+⏎ = lưu cụm · Esc = huỷ · nền đỏ = chưa khớp (vẫn lưu nháp được)
```

### 2.4 Gõ số trong dòng sổ

- Bấm ô "Trúng khoa" đầu tiên → con trỏ vào ô, **số cũ bôi sẵn**, gõ đè luôn.
- **⏎ hoặc Tab = xuống khoa kế tiếp** (không sang phải — PĐD đang điền một cột
  dọc, không phải một hàng ngang). Shift+Tab = lên.
- Tab ở khoa cuối = **lưu cụm và nhảy sang mã hàng kế tiếp**, dòng tự bung.
- **Ctrl+⏎** = lưu cụm ngay, không rời chỗ. **Esc** = huỷ cả cụm.
- Dòng tổng cập nhật ngay khi gõ: `đang chia … / cần …` và số lệch.
- Nút **[Chia theo tỉ lệ Q]** trong đầu cụm — chia theo `q_khoa`, làm tròn
  xuống, dư dồn khoa lớn nhất (cùng quy tắc `chiaTheoTiLe` đang chạy). Đây là
  **gợi ý điền vào ô**, PĐD gõ đè thoải mái.

### 2.5 Tích rớt ngay trong dòng

| Thao tác | Cách làm | Số click |
|---|---|---|
| Rớt một phần giai đoạn 1 | bấm ô R1 → gõ số → chọn 1 lý do soạn sẵn → ⏎ | 2 click + gõ |
| Rớt thêm ở giai đoạn 2 | bấm ô R2 → như trên | 2 click + gõ |
| Rớt toàn bộ số còn lại | bấm ô R → gõ `*` hoặc bấm chip **"Toàn bộ"** trong popover | 2 click |
| Bỏ ngoại lệ rớt | xoá trắng ô R → ⏎ | 1 click + Del |
| **Rớt cả mã quản lý** | bấm ô R **trên dòng nhóm** (dòng ▸ mã quản lý) → hệ rải xuống mọi mã hàng bên trong | 2 click |

Lý do rớt vẫn **bắt buộc** (RPC đòi). Bốn chip soạn sẵn + ô "Khác" biến việc gõ
lý do thành 1 click. Popover neo ngay dưới ô, không phải modal che màn hình.

### 2.6 Làm hàng loạt

- ☐ đầu dòng · Shift+click chọn dải · Ctrl+A chọn hết dòng đang lọc.
- Chọn xong hiện **thanh hành động nổi** dưới đáy màn:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Đã chọn 23 mã hàng   [Rớt toàn bộ ▾] [Chia theo tỉ lệ Q] [Áp 1 lý do] [Bỏ] │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Dán từ Excel**: chọn ô đầu cột R1 (hoặc cột Trúng khoa) → Ctrl+V một cột số
  từ file kết quả thầu → **hiện bảng xem trước "mã hàng ↔ số sắp ghi"**, PĐD
  duyệt mắt rồi bấm Ghi. **Không ghi thẳng** — dán lệch một dòng là sai cả bảng
  mà không ai biết. Bảng xem trước chính là dấu vết.

### 2.7 Tìm dòng lệch trước khi chốt

- Chip đỏ trên thanh công cụ: **⚠ 3 dòng lệch** → bấm là lọc còn 3 dòng đó.
- Ô **Lọc ▾**: `Tất cả · Có rớt · Lệch tổng · Chưa phân bổ · Khoa tự sửa số ·
  Vượt P75`.
- Nút **Chốt trình ký** hiện luôn con số: `Chốt trình ký (còn 3 dòng lệch)` và
  **mờ** khi còn > 0 — đúng luật 3: nháp lệch thì lưu được, cổng chốt thì chặn.

### 2.8 Phím tắt (cho người gõ hàng trăm dòng)

| Phím | Việc |
|---|---|
| ⏎ | lưu ô, xuống dòng dưới |
| Tab / Shift+Tab | ô kế / ô trước |
| Esc | huỷ ô đang gõ |
| Ctrl+⏎ | lưu cả cụm khoa |
| Ctrl+V | dán cột từ Excel (có xem trước) |
| Space | bung/đóng dòng sổ khoa |
| Ctrl+F | nhảy vào ô tìm kiếm |
| Ctrl+S | lưu mọi ô đang treo |

> Đây là phần **đáng giá nhất và rẻ nhất**: hôm nay chưa có phím tắt nào.

---

## 3. Bàn điều hành còn lại gì

| Phần | Số phận |
|---|---|
| Tab **Khoa** — khoa nào chưa gửi, thiếu hồ sơ, tỉ trọng | **GIỮ, chỉ để xem.** Đây là câu hỏi điều hành, không phải chỗ sửa số |
| Tab **Tổng hợp** — cây mã quản lý + nút Tích rớt | **GỠ HẲN.** Trùng hoàn toàn với grid mới |
| Tab **Kết quả** — bảng Q/R1/R2/R3 + panel "Phân bổ về khoa" | **GỠ HẲN.** Thành cột trong grid |
| **Ba giai đoạn thầu** (Bắt đầu/Hoàn thành/Mở lại) | **CHUYỂN** lên thanh công cụ grid — 3 chip, quyết định ô R nào đang hiện hành |
| **Chốt trình ký từng khoa** (49 nút) + **toàn bộ** | **CHUYỂN** vào **ngăn kéo trượt từ phải** ngay trên grid, không phải màn riêng |
| **Giỏ rớt toàn viện** | **GIỮ** ở Bàn điều hành — theo dõi khoa xử lý, không phải sửa số |
| **Hồ sơ trực tuyến** | **GIỮ** |
| Nút chết **"Xem theo khoa ▾"** (`TongHopPdd.jsx:901`) | **GỠ** |

Sau khi dọn: PĐD ở **một màn** làm xong mọi việc từ danh mục tổng hợp tới chốt
trình ký. Bàn điều hành thành **màn theo dõi**, mở khi muốn biết "khoa nào đang
nợ", không phải chỗ làm việc.

---

## 4. Hai chỗ có đánh đổi thật

### 4.1 Làm sao cột số không biến mất khi cuộn ngang 30 cột

| PA | Cách | Được | Mất |
|---|---|---|---|
| **A (đề nghị)** | Chế độ **Làm việc** ẩn bớt cột, còn ~10 cột vừa màn | Không cuộn ngang lúc gõ. Tái dùng `cotAn` sẵn có | Muốn đọc cột lịch sử phải đổi chế độ |
| **B (đề nghị, kèm A)** | Chế độ Đầy đủ: nhóm SỐ **ghim phải** | Đọc 30 cột mà số vẫn trong tầm mắt | Ăn ~400px bề ngang |
| C | Tách bảng số ra panel riêng bên phải | Grid giữ nguyên | Lại là hai chỗ nhìn — đúng cái đang muốn bỏ |

→ **Làm A + B. Mặc định mở ở chế độ Làm việc.**

### 4.2 Cho lưu nháp lệch (luật 3) — hệ quả kỹ thuật cần biết trước

Hôm nay **cả màn lẫn server đều chặn cứng** — đã đọc thẳng mã nguồn, không suy đoán:

| Chặn ở đâu | Câu lệnh |
|---|---|
| Màn Tổng hợp | `TongHopPdd.jsx:~793` — `Tổng các khoa … chưa khớp tổng cần phân bổ …` |
| Màn Bàn điều hành | `BanDieuHanhPdd.jsx:~1153` — `Tổng … chưa khớp số trúng …` |
| **Server** | `patch_zzzzc_v3_ket_qua_thau.sql:297` — `if v_tong<>v_trung then raise exception 'Tổng phân bổ % phải bằng số trúng %.'` |

Muốn cho lưu nháp lệch thì **phải sửa cả RPC**, không chỉ sửa giao diện.

Tin tốt: bảng `phan_bo_trung_v3` (số trúng theo khoa, có cột `q_khoa` riêng) đã
tồn tại sẵn — nên yêu cầu "số gõ sau rớt nằm ở cột khác, không đè Q" **đã đúng
theo cấu trúc**, không phải xây mới.

| PA | Cách | Được | Mất |
|---|---|---|---|
| **A (đề nghị)** | RPC nhận thêm cờ `cho_phep_lech` · dòng lệch bị đánh dấu ở DB · `chot_trinh_ky_toan_bo_v3` từ chối khi còn dòng lệch | Đúng luật 3. Cổng cuối vẫn là bất biến toán học | Phải sửa 2–3 RPC |
| B | Giữ chặn cứng ở server, màn giữ nháp trong bộ nhớ trình duyệt | Không đụng SQL | F5 là mất hết số đang gõ dở — không chấp nhận được |

→ **Làm A.**

---

## 5. Con số cuối

| | Hôm nay | Sau thiết kế |
|---|---|---|
| Tích rớt 1 mã + gõ số trúng cho khoa | **~11–14 click · 3 lần đổi ngữ cảnh** | **~3 click · 0 đổi màn** |
| Rớt cả mã quản lý | ~5–9 click + modal | 2 click |
| Rớt thêm giai đoạn 2 | ~5–8 click | 2 click |
| Rớt 50 mã cùng lý do | 50 × (5–8) click | chọn dải + 3 click |
| Số màn PĐD phải mở để hoàn tất 1 gói con | 2 màn · 3 tab | **1 màn** |
| Phím tắt | **0** | 8 |

---

## 6. Còn phải hỏi chủ dự án

1. **Cột `giai_trinh_2627` là ngoại lệ theo khoa** (mỗi khoa một bản, lưu ở
   `danh_muc_khoa_o`), nhưng `COT_PDD` đang có cột `giai_trinh` ở cấp mã hàng.
   Trên grid mới, giải trình hiện ở **dòng sổ theo khoa** hay giữ ở dòng mã hàng?
2. **Sau khi chốt Q rồi mà PĐD muốn sửa số đề xuất** thì luật hiện tại là mở
   chốt + nhập lý do. Trên một mặt bàn, ô Q có nên cho gõ đè kèm hộp lý do tại
   chỗ (thay vì mở chốt cả gói con)?
3. **Ô R gõ vượt Q** — khoá cứng 3 (`R1+R2+R3 ≤ Q`) đang chặn ở server
   (`patch_zzzzc_v3_ket_qua_thau.sql:248`) và **nên giữ nguyên** (khác với khoá
   tổng phân bổ ở luật 3 — cái đó lệch trong lúc gõ là chuyện thường, còn rớt
   vượt Q thì không có nghĩa gì cả). Xin xác nhận là giữ.
4. **Ba giai đoạn thầu chuyển lên thanh công cụ grid** — có đúng ý không, hay
   PĐD vẫn muốn nó ở màn theo dõi riêng?
5. **Dán từ Excel** — PĐD có thật sự nhận kết quả thầu dạng file Excel không?
   Nếu không thì bỏ tính năng này, đỡ một mảng rủi ro.
6. **Chốt trình ký từng khoa (49 nút)** — có còn cần bấm từng khoa không, hay
   chỉ cần nút "chốt toàn bộ"? Nếu vẫn cần thì ngăn kéo là đủ.
