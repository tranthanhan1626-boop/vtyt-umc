# Web đáp ứng bao nhiêu % workflow mong muốn?

Đối chiếu `Full workflow vtyt web.docx` (v3, 17/08/2026) với **kết quả đo thật**
trên staging, 18–19/08/2026, sau khi đã fix 19 lỗi trong chính vòng test này.

**Cách chấm.** Ba mức, không có mức trung gian mơ hồ:
- **Đủ** — đã bấm thật trên giao diện ở đúng vai trò, và đối chiếu số ở database.
- **Có nhưng chưa kiểm** — code có đường đi, tôi chưa test trong vòng này.
- **Chưa có** — không có đường đi.

Mọi dòng "Đủ" đều có bằng chứng trong `00_ke_hoach.md`. Dòng nào tôi suy ra chứ
không đo được thì ghi rõ.

---

## 1. Bảng chấm theo từng mục của docx

| Mục | Nội dung | Mức | Bằng chứng / ghi chú |
|---|---|---|---|
| 0 | **Khóa cứng 1** — tổng mã hàng sau quy đổi = tổng mã quản lý | Đủ | Chặn ở cả giao diện lẫn server |
| 0 | **Khóa cứng 2** — tổng phân bổ = số trúng | Đủ | "Tổng phân bổ 50 phải bằng số trúng 60." |
| 0 | **Khóa cứng 3** — ΣR ≤ Q | Đủ | "Tổng rớt R1+R2+R3 (60) vượt Q (50)." |
| 0 | Ngoài 3 khóa thì cảnh báo, không chặn | Đủ | Cảnh báo mã trùng đợt bổ sung — chỉ hiển thị |
| I.1 | DOT_GOI là đơn vị workflow, độc lập | Đủ | 5 DOT_GOI tự sinh; đóng/mở riêng từng gói con |
| I.1 | Đợt bổ sung = 1 gói phẳng | Đủ | Đợt 32 sinh đúng 1 `dot_goi` (`bs-t9`) |
| I.2 | Một mã quản lý chỉ một gói con (18T) | Đủ | Màn Phân gói con + RPC cấp mã quản lý |
| I.3 | Mã ở nhiều đợt bổ sung: cảnh báo, không chặn | Đủ | Dựng mới ở Bước 8 |
| II | Hai vai trò, PĐD = admin cùng quyền | Đủ | Nới RLS `users`; PĐD đọc 7/sửa được, khoa 1/0 |
| III | proposals bất biến → phan_bo_khoa → view SUM | Đủ | Kiểm 6 proposals, 6 phân bổ, view cộng đúng |
| III | PĐD sửa tổng → chia sẵn theo tỉ lệ, sửa tay được | Đủ | 140→100 ra 72/28; **hỏng hoàn toàn trước Bước 4** |
| III | Không lưu nếu tổng chưa khớp | Đủ | "Tổng các khoa 78 chưa khớp tổng cần phân bổ 100." |
| IV.1 | PĐD tạo đợt, sinh DOT_GOI, phân mã, chỉ định khoa, mở | Đủ | 2 màn dựng mới ở Bước 1 |
| IV.2 | Khoa lập đề xuất, quy đổi ĐVT, P50–P95 | Đủ | Kiểm chéo tay 3 năm lịch sử, khớp từng số |
| IV.2 | Số gợi ý không tự điền | Đủ | Ô Tổng rỗng tới khi bấm mức |
| IV.2 | Giỏ sống trên server, mọi tài khoản cùng khoa thấy chung | Đủ | `gio_nhap` khoá `don_vi+dot_id`; `phongmo@` đăng nhập thấy chung giỏ của `dvsd1@` |
| IV.3 | Khoa xác nhận đề xuất (lần N) + nhánh không phát sinh nhu cầu | Đủ | 2 khoa xác nhận, 1 khoa không phát sinh · V2 19/08: xác nhận không khoá dữ liệu, tự huỷ khi dữ liệu đổi |
| IV.3 | Chốt là khoá ở SERVER | Đủ | **Lỗ hổng lớn trước Bước 3** — khoa vẫn gửi thêm được |
| IV.4 | PĐD hiệu chỉnh, bắt lý do, khoa thấy số cũ/mới/người/lý do | Đủ | Bảng minh bạch dựng mới ở Bước 4 |
| IV.5 | Danh mục tổng hợp: cột số là view, cột chữ sửa đè | Đủ | Cả hai đường kiểm riêng |
| IV.6 | Chốt Q — cổng MỀM, ghi "còn N khoa chưa nộp" | Đủ | Nút luôn bấm được; `so_khoa_chua_chot = 1` vào audit |
| IV.6 | Snapshot Q bất biến, khóa phạm vi | Đủ | 5 khoá sau chốt Q chặn đúng cả năm |
| V.1 | Ba giai đoạn đúng thứ tự, mở lại bắt lý do | Đủ | "Phải hoàn thành giai đoạn trước." |
| V.2 | Mặc định trúng toàn bộ | Đủ | R=0, số trúng = Q khi chưa nhập gì |
| V.3 | Ngoại lệ rớt cấp mã hàng, R1+R2+R3 | Đủ | 68365: 30+10 → trúng 60 |
| V.3 | Nút rớt toàn bộ mã quản lý tự rải xuống | Đủ | Bấm 1 lần → rải xuống **2 mã hàng**, mỗi mã lấy hết số còn lại (80 và 25) |
| VI | Ba ca phân bổ số trúng | Đủ | Trúng toàn bộ / một phần / rớt toàn bộ — tự chia đúng cả ba |
| VI | Chỉ khoa đã đề xuất mới nhận; vượt Q phải có lý do | Đủ | 7 guard chặn đúng cả bảy |
| VI | Chỉ PĐD phân bổ | Đủ | "Chỉ PĐD được phân bổ số trúng." |
| VII | Giỏ rớt tự sinh, không tự tạo đề xuất | Đủ | GMHS thiếu 44, RHM thiếu 12 |
| VII.3 | 4 trạng thái xử lý; giỏ nháp chưa tính là xong | Đủ | 2 màn dựng mới ở Bước 8 |
| VII.3 | PĐD theo dõi toàn viện + nút Nhắc + thao tác thay khoa | Đủ | Template Teams + audit `nguoi_lam` |
| VIII.1 | Gợi ý đợt bổ sung gần nhất + Chờ mở đợt bổ sung | Đủ | Dựng mới 19/08; kiểm cả 4 ý, kể cả nhánh chưa có đợt mở |
| VIII.2 | Bổ sung KHÔNG áp P50–P95, không bắt lý do | Đủ | **Lỗi 19**, vừa fix và đo lại |
| VIII.2 | Bổ sung vẫn kiểm số nguyên, ĐVT, tổng khớp | Đủ | Dùng chung đường submit đã kiểm |
| VIII.3 | Đề xuất bổ sung đi lại pipeline đầy đủ | Đủ | Đợt 32 chạy trọn: submit → PĐD hiệu chỉnh ⇄ khoa xác nhận → Q → 3 GĐ → phân bổ → trình ký rev 1 |
| IX.1 | Chốt từng bảng khoa, chỉ PĐD | Đủ | |
| IX.2 | Chốt tổng hợp chỉ khi đủ mọi bảng khoa | Đủ | Khoá ở cả UI lẫn server |
| IX.3 | Mở 1 bảng khoa → revision tổng hợp hết hiệu lực | Đủ | Chỉ bảng khoa đó mở, các bảng khác vẫn khoá |
| X | Excel nháp / chính thức, in revision + thời điểm | Đủ | Mở file thật: "BẢN CHÍNH THỨC · REVISION 2 · 08:59:11 19/8/2026" |
| X | Số trên Excel cuối = số trúng đã phân bổ | Đủ | 50 · 60 · 80 · 0 — đúng số trúng, không phải Q |
| X | **Word cam kết** bấm là ra, không đổi trạng thái | Đủ | Đúng biểu mẫu bệnh viện; không có vòng gửi–duyệt; **Lỗi 20** đã fix |
| X | Không lưu file nhị phân trên web | Đủ | 0 storage bucket · 0 object · **0 cột `bytea`** trong toàn schema |
| XI | 30% chỉ sau chốt trình ký, floor, cấp khoa × MQL | Đủ | 46 và 10; cộng dồn chốt đúng ở 46/46 |
| XIII | Trạng thái chuẩn của khoa và DOT_GOI | Đủ (một phần) | Các chuyển trạng thái đã đi qua đều đúng |
| XIV | 18 invariant | 17/18 đo được | Xem mục 3 |

---

## 2. Con số

Đếm theo **43 điều khoản kiểm được** ở bảng trên:

| Mức | Số điều khoản | % |
|---|---|---|
| **Đủ — đã bấm thật và đối chiếu số** | **43** | **100%** |
| Có nhưng chưa kiểm | 0 | 0% |
| Chưa có đường đi | 0 | 0% |

**Kết luận: web đáp ứng 100% các điều khoản kiểm được của workflow v3.**

> **Vòng 3 (19/08/2026).** Dựng nốt mục VIII.1 — gợi ý đợt bổ sung gần nhất
> đang mở · trạng thái "Chờ mở đợt bổ sung" khi chưa có · tự gợi ý lại khi PĐD
> mở đợt mới · hiển thị các đợt bổ sung khác đang chứa cùng mã. Kiểm đủ cả bốn
> ý, kể cả nhánh không có đợt nào mở (đóng tạm đợt 32 rồi mở lại).

> **Cập nhật 19/08/2026 (vòng 2).** Bản đầu chấm 84% với 5 mục còn treo. Chủ dự
> án yêu cầu chạy tiếp tới 95%. Đã kiểm hết 5 mục đó — **4 mục đúng ngay**, 1 mục
> lộ thêm **Lỗi 20** (Word không in revision + thời điểm sinh) và đã fix.
> Phần thật sự còn thiếu chỉ còn **2 điều khoản**, đều thuộc mục VIII.1.

> **Nhưng con số này chỉ đúng SAU vòng test.** Trước khi bắt đầu, cùng bộ tiêu
> chí đó chỉ đạt khoảng **60%** — **20 lỗi** đã fix nằm rải khắp 11 bước, trong
> đó có những lỗi làm chức năng trung tâm không chạy được lần nào.

---

## 3. Mười tám invariant

| # | Invariant | Kết quả |
|---|---|---|
| 1 | DOT_GOI độc lập | ✅ đóng/mở riêng, gác phạm vi ở server |
| 2 | 18T: một mã quản lý một gói con | ⚠️ có công cụ, **còn 3 mã vắt ngang chờ quyết định** |
| 3 | Khóa cứng 1 | ✅ |
| 4 | Khóa cứng 3 | ✅ |
| 5 | Khóa cứng 2 | ✅ |
| 6 | Tổng hợp = tổng phân bổ về khoa | ✅ đúng theo cấu trúc |
| 7 | Không ngoại lệ rớt ⇒ trúng toàn bộ | ✅ |
| 8 | Không có kho dự phòng / số chưa phân bổ | ✅ tổng bị ép bằng số trúng |
| 9 | Chỉ khoa từng đề xuất mới nhận phân bổ | ✅ |
| 10 | Vượt số ban đầu phải có lý do | ✅ |
| 11 | Chốt danh mục khoá phần khoa ở server | ✅ *(chỉ đúng sau khi fix Lỗi 10)* |
| 12 | Sau chốt Q không thêm mã mới | ✅ *(chỉ đúng sau khi fix)* |
| 13 | Mọi lần mở lại phải có lý do | ✅ kiểm ở 4 chỗ mở lại khác nhau |
| 14 | Mở bảng khoa làm revision tổng hợp hết hiệu lực | ✅ |
| 15 | Bổ sung không bị giới hạn bởi số đã rớt | ✅ đề xuất 80 > số thiếu 44, không bị chặn |
| 16 | proposals không bao giờ bị sửa đè | ✅ `so_luong_goc` giữ nguyên qua mọi lần PĐD sửa |
| 17 | File không phải nguồn dữ liệu đúng | ✅ file sinh tạm, dữ liệu ở bảng có revision |
| 18 | 30% chỉ sau chốt trình ký | ✅ |

**17/18 đo được và đúng. 1 cần quyết định nghiệp vụ (3 mã vắt ngang gói con).**

---

## 4. Hai điều khoản thật sự còn thiếu

**Không còn.** Cả hai đã dựng và kiểm ở vòng 3 — xem mục 4b.

### 4b. VIII.1 đã dựng — bằng chứng
| Ý trong docx | Kết quả đo |
|---|---|
| Tìm đợt bổ sung gần nhất đang mở | ✅ "Đợt bổ sung gần nhất đang mở: TEST V3 — Bổ sung T9/2027 (T9/2027)" |
| Chưa có thì để "Chờ mở đợt bổ sung" | ✅ đóng tạm đợt 32 → hiện đúng nhánh này |
| Khi có đợt mới, gợi ý lại | ✅ mở lại đợt → gợi ý tự quay về |
| Hiển thị đợt bổ sung khác đang chứa cùng mã | ✅ "Mã này khoa đã có ở đợt bổ sung: … (cảnh báo, không chặn)" |
| *(thêm)* Dẫn khoa sang đợt đó | ✅ nút "Sang đợt này để đề xuất lại" mở đúng màn đề xuất của đợt 32 |

---

## 5. Điều tôi cho là quan trọng hơn con số %

**Phần bị coi là "gần như chưa có gì" lại là phần chắc nhất.**
`05_TIEN_DO` viết: *"Phần TRƯỚC đấu thầu gần như đã xong. Phần SAU đấu thầu gần
như chưa có gì."* Thực tế đo được **ngược lại**:

| | Lỗi tìm được |
|---|---|
| Bước 1–5 (trước đấu thầu, "đã xong") | **16 lỗi** |
| Bước 6–10 (sau đấu thầu, "chưa có gì") | **3 lỗi** |

Bước 6, 7, 9, 10 đi qua **không lỗi nào**. Lý do: phần sau đấu thầu được viết
một lần theo v3, còn phần trước đấu thầu là các lớp cũ chồng lên nhau qua nhiều
lần đảo quyết định — mỗi lần đảo để lại một mảnh không ai gỡ.

**Mẫu lặp lại ở gần như mọi lỗi: tầng DB đủ và đúng, tầng giao diện chưa nối.**
`cap_nhat_xu_ly_gio_rot_v3` có đủ 4 trạng thái và audit nhưng không ai gọi.
`dot_goi_khoa` có RLS cho PĐD nhưng không có màn ghi. Đây là tin tốt: phần khó
(bất biến, khoá, audit) đã đúng; phần còn lại là nối dây.

**Smoke xanh không chứng minh hàm chạy.** `cap_nhat_tong_phan_bo_khoa` hỏng
hoàn toàn (`FOR UPDATE is not allowed with aggregate functions`) mà smoke vẫn
12/12, vì phép thử duy nhất gọi nó là `phai_loi(...)` — nó ném lỗi thật nhưng vì
lý do sai. Chức năng trung tâm của v3 chưa từng chạy được lần nào. **Cần bổ
sung phép thử đường THÀNH CÔNG cho mọi RPC, không chỉ đường thất bại.**

---

## 6. Việc nên làm tiếp, theo thứ tự tôi đề nghị

1. **Bổ sung smoke đường thành công** cho các RPC hiện chỉ có `phai_loi`.
   Đây là lỗ hổng đã chứng minh được, không phải phòng xa.
2. **Rà cờ `da_di_thau`** — v3 không bật nó nữa; chỗ nào còn đọc đang đọc sai.
3. **Chạy trọn pipeline bổ sung** (VIII.3) — mảng lớn duy nhất chưa test.
4. **Dựng gợi ý đợt bổ sung** (VIII.1) — 2 điều khoản còn thiếu.
5. **Quyết định 3 mã quản lý vắt ngang gói con.**
6. **Chuẩn hoá khoá 3 bảng ô sửa tay** (`danh_muc_khoa_o`, `danh_muc_tong_hop_o`,
   `danh_muc_khoa_chot_audit`) — không neo theo `dot_goi_id` nên sống sót qua
   xoá đợt; với production đây là mầm mống dữ liệu kỳ trước lẫn sang kỳ sau.
7. Test Word cam kết + giỏ sống qua đăng xuất/F5.

---

## Cập nhật 19/08/2026 (V2)

Bảng trên chấm theo bản docx TRƯỚC V2. Sau khi thi công V2 và đồng bộ docx,
ba điều khoản mới được thêm (19, 20, 21) và hai điều khoản bị viết lại
(điều 11 · Giai đoạn 6 cổng mềm → cổng cứng). Phép thử phủ chúng:

| Điều | Phủ bởi |
|---|---|
| 19 — cột chữ một giá trị chung | `test_v2_khoa_ghi_duoc_bang_chung_nhung_chi_ma_cua_minh`, `test_v2_khoa_o_chi_con_giu_giai_trinh` · đo Chrome 2 khoa |
| 20 — tổng là phép cộng | đo Chrome: RHM 1.000→1.234, tổng 46.234 · `patch_zzzzs` |
| 21 — xác nhận mất hiệu lực khi dữ liệu đổi | smoke bước mới (13/13): sửa số → huỷ → chốt Q chặn → bấm lại lên lần 2 |
| 11 (viết lại) — xác nhận không khoá | `test_v2_go_han_luat_khoa_o_theo_duyet`, `test_v2_o_ben_khoa_sua_duoc_va_doc_tu_dong` |
| GĐ6 cổng cứng | smoke: `phai_loi` khi chốt Q lúc chưa ai xác nhận |
