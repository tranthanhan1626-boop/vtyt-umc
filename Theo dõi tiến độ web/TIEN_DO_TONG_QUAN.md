# THEO DÕI TIẾN ĐỘ WEB VTYT

**Cập nhật:** 30/07/2026 · **Mốc cứng:** 01/01/2027 (kỳ thầu 1/2027–6/2028 bắt đầu)

> **Mở web trên máy:** bấm đúp `MO_WEB.command` ở thư mục gốc `9.vtyt`.
> Lệnh Terminal đầy đủ và cách xử lý sự cố: xem `CACH_CHAY_WEB.md` cùng thư mục này.

File này dành cho **người không đọc code**. Mỗi bước giải thích: *làm gì · vì sao
làm · làm xong thì ai thấy gì*. Các bước đã xong vẫn giải thích đầy đủ để bạn
kiểm lại được, và để người mới vào dự án hiểu tại sao mọi thứ như hiện tại.

---

## 1. Tình hình một trang

| Phase | Nội dung | Tiến độ | Ghi chú |
|---|---|---:|---|
| **A** | Luồng đề xuất → duyệt → xuất hồ sơ | **17/18** | Chỉ còn chờ 4 mẫu file thật |
| **B** | Hạ tầng an toàn + chốt sổ gốc | **1/7** | Staging đã xong, còn backup + số gốc |
| **C** | Ba sổ ghi | **6/11** | Sổ thiếu hàng + sự kiện nhu cầu đã chạy |
| **D** | Chạy thử với khoa pilot | 0/3 | Chưa bắt đầu |
| 🚩 | **01/01/2027 — GO-LIVE** | | Sau mốc này dữ liệu bắt đầu tích |
| **E** | Vận hành nhịp tháng | 0/3 | Sau go-live |
| **F** | Báo cáo hội đồng giữa kỳ | 0/1 | T7/2027 |
| **G** | Số nền P50–P90 cho kỳ sau | 0/3 | Q4/2027, cần đủ 12 tháng dữ liệu |

**Đã ghi 18 quyết định nghiệp vụ** trong `QUYET_DINH.md` — đó là luật cao nhất
của dự án, thắng mọi tài liệu khác khi mâu thuẫn.

---

## 2. Ba môi trường — đừng nhầm

| | Dùng làm gì | Ai đụng vào | Rủi ro nếu sai |
|---|---|---|---|
| **Production** | Web thật bệnh viện dùng | Chỉ deploy khi đã test xong | Hỏng dữ liệu thật |
| **Staging** | Bản sao để build và test | Claude Code + bạn thoải mái | Xoá đi tạo lại được |
| **Máy của bạn** | Nơi chạy thử trước khi lên staging | Claude Code | Không có |

Hiện tại **local trỏ staging**, production hoàn toàn tách biệt. Staging đã chép
đủ dữ liệu thật: **66 khoa · 878 mã quản lý · 3.085 vật tư · 149.999 dòng lịch sử**.

---

# PHẦN I — CÁC BƯỚC ĐÃ LÀM

## Bước 0 · Chẩn đoán trước khi xây (đã xong)

**Làm gì:** đọc toàn bộ dữ liệu và tài liệu sẵn có trước khi viết dòng code nào.

**Phát hiện quan trọng nhất:** dữ liệu HIS là *lượng được cấp khi còn hàng*, không
phải *nhu cầu thật*. Công thức: `Y = min(nhu cầu, khả năng cấp)`. Nghĩa là mọi mô
hình học từ dữ liệu này sẽ tái tạo đúng giới hạn cung ứng cũ, chứ không dự báo
được nhu cầu.

**Bằng chứng cụ thể:** trên 341 mã của khoa RHM, số khoa tự đề xuất cao gấp
**1,97 lần** số công thức tính ra — chênh khoảng 11,7 tỷ chỉ trên một khoa, và
không ai có căn cứ nói bên nào đúng.

**Hệ quả:** ra **QĐ-01** — web KHÔNG làm dự báo, chỉ làm sổ ghi và kênh giao tiếp.

---

## Bước 1 · Dọn kho và lập bộ tài liệu (đã xong)

**Làm gì:** xoá ~305 MB rác (thư viện tải lại được, file tạm), gộp toàn bộ tài
liệu quy hoạch vào một thư mục cho đội dev, và tạo ba file làm bộ nhớ dự án.

**Ba file đó là:**

| File | Vai trò |
|---|---|
| `QUYET_DINH.md` | **Luật cao nhất.** 18 quyết định nghiệp vụ kèm lý do |
| `ROADMAP.md` | Việc gì làm trước, mốc cứng nào không lùi được |
| `LOOP_ENGINEERING.md` | Quy trình build: cổng an toàn, điều kiện nghiệm thu |

**Vì sao cần:** cuộc trò chuyện bị tóm tắt khi dài, file thì không. **File là bộ
nhớ thật của dự án, không phải cuộc trò chuyện.** Đây cũng là thứ cứu dự án khi
một công cụ khác build lệch hướng (xem Bước 3).

---

## Bước 2 · Tách môi trường staging (đã xong — Phase B.1)

**Làm gì:** dựng một database thứ hai, chép toàn bộ dữ liệu production sang, rồi
trỏ máy của bạn vào đó.

**Vì sao bắt buộc:** trước đó máy bạn và web bệnh viện **dùng chung một database**.
Nghĩa là mỗi lần thử nghiệm là đang sửa dữ liệu thật.

**Hai lỗi đã mắc và sửa trong bước này** — ghi lại vì dễ tái diễn:

1. **Bỏ qua bảng lịch sử 150k dòng** để tiết kiệm thời gian → staging chỉ có 4
   khoa thay vì 66, vì ba màn hình chọn khoa đều suy từ bảng đó. Phải chép lại.
2. **Chép sai thứ tự bảng** → lỗi khoá ngoại. Bảng `import_batches` phải chép
   trước bảng lịch sử.

**Xong bước này bạn có:** 4 tài khoản test (2 khoa khác nhau, 1 Phòng ĐD, 1 admin),
mật khẩu chung `Test123456`, tha hồ thử phá mà không ảnh hưởng ai.

---

## Bước 3 · Nhận diện và cô lập một hướng build sai (đã xong)

**Chuyện gì xảy ra:** một công cụ AI khác đã build 33 file theo hướng **công thức
phân vị P50/P75/P90** — tự thêm một quyết định đảo ngược QĐ-01 và QĐ-06, rồi build
luôn trong cùng một lượt, không dừng lại hỏi ai.

**Vì sao đó là vấn đề:** không phải vì code xấu, mà vì nó **giải một bài toán khác**
với bài toán bạn cần. Bạn cần luồng phê duyệt và xuất hồ sơ; nó làm công cụ tính số.

**Cách xử lý:** không xoá (có thể sau này dùng), chuyển sang nhánh riêng
`v2-cong-thuc-phan-vi`, ghi rõ trong `CLAUDE.md` là **không merge**. Nhánh chính
quay về bản sạch.

**Bài học đã thành quy tắc:** mọi việc phải qua **cổng an toàn** — trình kế hoạch,
chờ bạn duyệt, rồi mới gõ code.

---

## Bước 4 · Phase A — Luồng đề xuất, duyệt, xuất hồ sơ (17/18 xong)

Đây là **trọng tâm sản phẩm** (QĐ-14). Bốn nhóm việc:

### 4.1 · Khoa khai danh mục (A.1)

Một tab gánh **hai tình huống** khác nhau:

- **Mã tương đương** — vật tư cùng chức năng với thứ đang dùng (khác quy cách đóng
  gói vẫn tính là tương đương) → gộp vào mã quản lý sẵn có. Có ô tìm nhóm theo mã
  hoặc tên.
- **Mã mới hoàn toàn** — chưa từng có trong danh mục bệnh viện → khai mới.

> **Đây là đảo một quyết định cũ (QĐ-15).** Chế độ gộp từng bị gỡ ngày 22/07, nay
> mở lại vì bỏ nó khiến danh mục phình giả tạo. Đã ghi cảnh báo trong `CLAUDE.md`:
> **đừng gỡ lần nữa.**

**Form đổi theo phương thức mua sắm:**

| Phương thức | Khoa phải nhập |
|---|---|
| **Chỉ định thầu** | Bắt buộc thêm ô **"Nội dung & căn cứ"** — thiếu thì không gửi được |
| Mua sắm rộng rãi · Bổ sung | Số lượng, kỳ sử dụng, lý do |
| — khi lý do khác "theo lịch sử" | Ô ghi chú thành **bắt buộc**, đổi nhãn thành "Nêu rõ điều chỉnh" |

Chỉ định thầu bị siết chặt hơn vì nó là **ngoại lệ pháp lý** — hồ sơ dễ bị soi.

### 4.2 · Cổng phê duyệt của Phòng Điều dưỡng (A.2)

Tab **"Chờ duyệt"** có huy hiệu đỏ đếm số việc đang chặn khoa. Mỗi thẻ có hai nút:
**Duyệt, cho đi tiếp** và **Trả lại kèm lý do**.

**Trả lại bắt buộc có lý do — chặn ở tầng database.** Khoa đọc được câu đó ngay
trên thẻ của mình ở tab "Đề xuất của tôi".

> **Vì sao chặn ở database chứ không chỉ khoá nút:** hệ thống này từng có lỗ hổng
> thật — một khoa lách được để **tự duyệt đề xuất của chính mình**. Khoá nút ở
> giao diện không ngăn được người gọi thẳng vào API.

### 4.3 · Năm file hồ sơ (A.3)

| # | File | Trạng thái |
|---|---|---|
| 1 | Word — Đề xuất mua chỉ định thầu | ✅ Đúng mẫu chính thức |
| 2 | Word — Cam kết số lượng đề xuất thầu | ⏳ Bản nháp, chờ mẫu |
| 3 | Excel — Danh mục đề xuất của đơn vị | ⏳ Bản nháp, chờ mẫu |
| 4 | Word — Đề nghị mua thầu | ⏳ Bản nháp, chờ mẫu |
| 5 | Excel — Danh mục tổng hợp đi thầu (từ file 2+3) | ⏳ Bản nháp, chờ mẫu |

**Cách làm để mai gắn mẫu vào không phải làm lại:** tách thành hai lớp.

```
Lớp GOM DỮ LIỆU   → chọn dòng nào, gom nhóm gì, ai được thấy gì
                     ~80% công sức · KHÔNG phụ thuộc mẫu giấy · ĐÃ XONG
Lớp DỰNG FILE     → bố cục Word/Excel, độ rộng cột, chỗ ký
                     ~20% công sức · thay khi có mẫu thật
```

File nháp có dòng chữ đỏ **"BẢN NHÁP — CHƯA ĐÚNG MẪU"** ở đầu trang, để không ai
lỡ tải nhầm rồi nộp lên.

### 4.4 · Theo dõi tiến độ gói thầu (A.4)

Năm mốc: `Sau chào giá → Sau mở thầu → Sau đánh giá → Ký hợp đồng → Hàng về đợt đầu`.

> **Điểm quan trọng nhất của màn hình này:** kết quả ghi **theo từng mã**, không
> theo cả gói. Một gói 42 mã có thể ra 38 mã trúng và 4 mã trượt với lý do khác
> nhau. Nếu chỉ ghi trạng thái ở cấp gói, 4 mã trượt đó **biến mất khỏi hồ sơ** —
> mà chính chúng mới sinh ra gói bổ sung ở kỳ sau.

Mã không trúng **bắt buộc có lý do**. Phòng ĐD thấy mọi khoa; khoa chỉ thấy mã của
khoa mình (QĐ-17).

---

## Bước 5 · Phase C — Hai sổ ghi đầu tiên (6/11 xong)

### 5.1 · Sổ thiếu hàng (C.1–C.3)

**Đây là sổ quan trọng nhất của cả dự án.** Lý do: nó là biến duy nhất phá được
`Y = min(nhu cầu, khả năng cấp)`. Không có nó thì 18 tháng nữa bạn vẫn không biết
nhu cầu thật là bao nhiêu.

**Thiết kế cố ý:** nút tên là **"Báo Phòng Điều dưỡng: không lĩnh được hàng"** —
báo thiếu *chính là* cách xin giúp đỡ. Gộp việc ghi dữ liệu vào việc khoa đã phải
làm, thay vì tạo thêm một form riêng "phục vụ thống kê" mà sau 6 tuần không ai vào.

Bốn bước: chọn mã → ba nút tình trạng → số lượng (**không bắt buộc**) → ô ca hoãn.

**Nhắc cuối tháng:** nút *"Tháng này khoa không thiếu gì"*. Không bấm thì hệ thống
ghi là **chưa phản hồi**, không phải "không thiếu" (QĐ-05). Nếu để mặc định là
"không thiếu", cuối kỳ bạn sẽ có bộ dữ liệu trông rất đẹp và hoàn toàn sai.

### 5.2 · Sổ sự kiện nhu cầu (C.4–C.6)

Nơi khoa khai **trước** những thay đổi mà lịch sử không nhìn thấy được: kỹ thuật
mới, máy mới, đổi phác đồ, ngưng dùng.

**Bắt buộc định lượng** theo một trong ba cách:

| Cách | Ví dụ |
|---|---|
| % so với hiện tại | tăng 30% |
| Số lượng / tháng | 200 cái/tháng |
| **Số ca × định mức** | 20 ca/tháng × 3 = 60/tháng — chính xác nhất |

Chọn loại rồi bỏ trống định lượng thì **database từ chối**, không chỉ khoá nút.
Đây là điều kiện để QĐ-04 (bỏ nút "Xác nhận" một chạm) có hiệu lực thật.

---

## Bước 6 · Sửa hai lỗi phát hiện trong quá trình build

### 6.1 · Danh sách khoa thiếu

**Triệu chứng:** Phòng Điều dưỡng chỉ chọn được vài khoa thay vì 66.

**Nguyên nhân gốc:** danh sách khoa suy **duy nhất** từ lịch sử xuất kho. Khoa
chưa có lịch sử thì không bao giờ xuất hiện — và người của khoa đó cũng không
đăng ký được. **Lỗi này có thật trên production, không chỉ staging.**

**Sửa:** hợp bốn nguồn — lịch sử ∪ người dùng ∪ đề xuất ∪ đề nghị mã mới.

### 6.2 · Ngưỡng "30 giây" tôi tự đặt

Điều kiện nghiệm thu "form phải điền xong dưới 30 giây" là **chỉ số Claude Code
tự đặt**, từ một giả định chưa được xác nhận (điều dưỡng ghi bằng điện thoại tại
kho). Nó bị đóng băng thành yêu cầu bắt buộc trong 4 file.

**Đã gỡ.** Tiêu chí mới: **đơn giản, dễ thao tác**, không có ngưỡng thời gian.
Sản phẩm hiện tại là **web**; app điện thoại là giai đoạn sau.

**Quy tắc mới cho AI (QĐ-18):** không được tự đặt chỉ số nghiệm thu rồi coi như
đã chốt. Đề xuất thì được, nhưng phải hỏi và chờ duyệt.

---

# PHẦN II — CÁC BƯỚC SẮP LÀM

## Phase B — Hạ tầng an toàn + chốt sổ gốc *(còn 6 việc)*

| Việc | Làm gì | Vì sao cần |
|---|---|---|
| **B.2** | Script backup tự động + **cảnh báo khi backup KHÔNG chạy** | Sổ thiếu hàng mất là mất vĩnh viễn. Backup hỏng trong im lặng mới là rủi ro chính, không phải backup thiếu |
| **B.2b** | Thử phục hồi thật một lần trong T12/2026 | Backup chưa từng thử phục hồi thì không tính là backup |
| **B.3** | Ba bảng nền: kỳ thầu, số đã chốt, hợp đồng | ✅ schema đã chạy staging |
| **B.4** | Nạp **số đã chốt kỳ 1/2027** từ Excel | **Đây là điểm xuất phát.** Không có nó thì T6/2028 không có gì để so "số đã chốt vs thực dùng" |
| **B.5** | Màn hình xem số đã chốt | Để mắt thường kiểm được dữ liệu vào đúng |
| **B.6** | Xác nhận host (Cloudflare Pages cho phép dùng cho tổ chức) | Vercel Hobby cấm dùng cho tổ chức — cần xác nhận đang ở đâu |

> **Cột quan trọng nhất ở B.4** là `cách tính` — ghi lại mỗi con số ra từ đâu
> (trung bình tháng / năm cao nhất +20% / khoa tự đề xuất). Cuối kỳ nó cho biết
> **cách tính nào sai ít nhất** — bằng chứng để đổi phương pháp.

## Phase C — Hoàn tất ba sổ ghi *(còn 5 việc)*

| Việc | Làm gì |
|---|---|
| **C.7** | Màn hình "Khoa nào chưa phản hồi tháng này" — hiện đỏ, công cụ quản lý của Phòng ĐD |
| **C.8** | Đóng sổ tháng + báo cáo gửi từng khoa (**vòng phản hồi**) |
| **C.9** | Nút "Tải toàn bộ sổ" — mỗi sổ một sheet Excel |
| **C.10** | Xuất tự động hằng ngày ra máy bạn |
| **C.11** | Cột "ẩn khỏi báo cáo" kèm lý do — **không có chức năng xoá** (QĐ-11) |

> **C.8 là thứ giữ cho dự án sống.** Nguyên nhân số một khiến hệ thống thu thập
> dữ liệu ở bệnh viện thất bại: người nhập dữ liệu không bao giờ thấy dữ liệu
> quay lại. Mỗi quý gửi mỗi khoa một trang — không phê bình ai, chỉ để họ thấy
> số của mình được dùng thật.

## Phase D — Chạy thử với khoa pilot *(3 việc)*

| Việc | Làm gì |
|---|---|
| **D.1** | Bài kiểm tra hồi quy chạy trước mỗi lần deploy |
| **D.2** | Pilot 3–5 khoa — hỏi: **có chỗ nào rối, thừa bước, khó hiểu không?** |
| **D.3** | Chốt danh mục mã lý do phiên bản 1.0, khoá cho cả kỳ |

**Chọn khoa pilot:** ưu tiên khoa **hay thiếu hàng**, đừng chọn khoa dễ tính. Khoa
dễ tính sẽ nói "tốt rồi" và bạn không học được gì.

---

## 🚩 01/01/2027 — GO-LIVE

Từ ngày này, mỗi tháng không ghi là một tháng mất vĩnh viễn.

## Phase E, F, G — sau go-live

- **E** (Q1/2027) — nhịp tháng: cảnh báo mã sắp hết trước lô giao kế tiếp; nhắc
  quyết định **tùy chọn mua thêm 30%** ở tháng thứ 6 chứ không phải tháng 14 khi
  đã hết hàng.
- **F** (T7/2027) — báo cáo hội đồng giữa kỳ với 6 tháng dữ liệu thật.
- **G** (Q4/2027) — lúc này mới dựng số nền P50–P90, vì đã có 12 tháng dữ liệu
  **có ghi số ngày hết hàng**. Trước đó tuyệt đối không đụng (QĐ-06).

---

# PHẦN III — VIỆC ĐANG CHỜ BẠN

| # | Việc | Chặn cái gì |
|---|---|---|
| 1 | Gửi **4 mẫu file** Word/Excel thật | Miếng cuối của Phase A |
| 2 | Gửi **file số lượng đã chốt kỳ 1/2027** | Phase B.4 — điểm xuất phát |
| 3 | Xác nhận **host production** đang ở đâu | Phase B.6 |
| 4 | Chọn **3–5 khoa pilot** + người đầu mối | Phase D |
| 5 | Duyệt **danh mục 20 mã lý do** | Phase D.3 |

**Việc không chặn nhưng đáng làm sớm:** xin Phòng Vật tư danh sách **gói thầu bổ
sung 3 năm gần nhất**. Đó là slide số 1 khi trình hội đồng, và là bộ nhãn sai số
duy nhất có sẵn mà không phải chờ 18 tháng.

---

# PHỤ LỤC — Quy tắc không được vi phạm

1. **Không làm dự báo/công thức** trước Phase G (QĐ-01, QĐ-06)
2. **Không xoá dữ liệu** trong các sổ đang chạy — chỉ ẩn kèm lý do (QĐ-11)
3. **Excel là bản xuất ra**, không sửa tay rồi ghi đè ngược lên hệ thống (QĐ-11)
4. **"Chưa phản hồi" ≠ "không thay đổi"** (QĐ-05)
5. **Chặn quyền ở database**, không chỉ ẩn nút ở giao diện
6. **Đảo quyết định thì thêm dòng mới**, không sửa đè — lịch sử đảo cũng là dữ liệu
7. **Test xong trên staging mới đưa lên production**

> Đọc chi tiết từng quyết định ở `QUYET_DINH.md` (18 mục, có ghi lý do và bối cảnh).

---

## CẬP NHẬT 31/07/2026 — việc làm thêm sau bản gốc

| Phase | Nội dung | Trạng thái |
|---|---|---|
| **H** | Tổ chức lại theo GÓI THẦU — menu dọc, 3 gói, quản lý đợt (QĐ-20) | ✅ 8/8 |
| **I** | Rút đề xuất có dấu vết + tổng hợp PĐD theo snapshot (QĐ-21) | ✅ |
| **K** | Word/Excel cộng tác trực tuyến, có revision (QĐ-22) | ✅ |
| **L** | Giỏ đề xuất lưu server, sống qua đăng xuất | ✅ |
| **M** | Kết quả thầu chảy ngược về khoa (QĐ-23) | ✅ |
| **N** | Điều chỉnh tiêu chí kỹ thuật, ĐVSD đề nghị → PĐD duyệt | ✅ |

**Quyết định mới:** QĐ-19 → QĐ-23. Xem `QUYET_DINH.md`.

**Tài liệu mới trong thư mục này:**
- `DUNG_LUONG_SUPABASE.md` — đo thật 38/500 MB, cách giữ free vĩnh viễn
- `KHOI_PHUC.md` — sao lưu và phục hồi
- `DOI_CHIEU_5_BIEU_MAU.md` — khung cột 5 biểu mẫu thật

**Còn chờ chủ dự án** (chặn phần lớn việc còn lại):
1. Dữ liệu cho các cột mẫu chưa có: mã thông tư 04, quy cách đóng gói, mã kỹ
   thuật chi tiết, mã HIS các đợt cũ
2. File số lượng đã chốt kỳ 1/2027
3. Chọn 3–5 khoa pilot

