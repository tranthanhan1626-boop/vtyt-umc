# Dữ liệu và biểu mẫu

Không cần dữ liệu người bệnh. Không nhận mật khẩu, service key hoặc thông tin
đăng nhập trong file bàn giao.

## 1. Dữ liệu hiện có

- Danh mục vật tư và mã quản lý.
- Lịch sử sử dụng tháng từ 01/2022 đến 06/2026 trong staging/backtest.
- Danh sách khoa và người dùng.
- Proposal, lý do, biểu mẫu, lịch sử sử dụng hiện hành.
- Ảnh chụp khả dụng/hợp đồng từ file thời gian sử dụng, gồm 2.661 dòng nguồn.
- Các patch workflow từ A2 đến Z (kể cả X2 — đề xuất cấp mã quản lý) nằm
  trong `backend/sql/`, đánh số theo thứ tự chạy.

Nguồn Excel bệnh viện được giữ trong `database/`; dữ liệu staging xuất ra JSON
nằm trong `backend/du_lieu_staging/`.

## 2. Dữ liệu còn cần

| Nhóm | Cột quan trọng |
|---|---|
| Tồn/hàng về | ngày chốt, mã hàng, tồn dùng được, hàng chắc chắn về, ngày về |
| Hợp đồng | hợp đồng, hiệu lực, nhà cung cấp, lịch giao — **không lấy đơn giá** |
| Thiếu hàng | số yêu cầu, số được cấp, ca hoãn, mã thay thế, phản hồi |
| Gợi ý quy đổi danh mục | `nhom_ky_thuat.dvt_chuan`, `vat_tu.he_so_quy_doi` |
| Snapshot quy đổi và phân bổ đề xuất | `proposals.so_luong_ma_quan_ly`, `dvt_ma_quan_ly`, `he_so_quy_doi`, `bang_quy_doi` |
| Chuẩn hóa mã | mã cũ–mới và ngày hiệu lực, quy đổi ĐVT, mã tương đương |
| Lâm sàng | VEN/criticality, mã Thông tư 04, phân nhóm TT14 |
| Kết quả thầu | số đề xuất, số trúng, lý do rớt, thời điểm hàng về |
| Hồ sơ cũ | file gốc và manifest theo khoa/đợt/loại/revision |

Thiếu tồn/hàng về thì công thức chỉ ra nhu cầu gộp. Thiếu số yêu cầu/được cấp
thì lịch sử xuất kho có thể thấp hơn nhu cầu thật.

**Cập nhật 17/08/2026:**

- **Bỏ hẳn mọi cột giá** khỏi hệ thống — đơn giá, giá hợp đồng cũ, tổng giá trị
  ước tính. Giá không thuộc phạm vi. Hợp đồng vẫn cần cho timeline khả dụng,
  nhưng chỉ lấy hiệu lực/nhà cung cấp/lịch giao.
- **Bỏ nhóm "Sự kiện nhu cầu"** — chức năng đã gỡ khỏi hệ thống.

**🆕 Cập nhật 21/08/2026 — bốn mảng sau đấu thầu vào phạm vi:**

✅ **XONG 25/08/2026 — dùng biểu mẫu MỚI, đừng đụng file cũ.**

| | |
|---|---|
| **Điền vào đây** | `database/MAU_GOM_DU_LIEU_SAU_THAU.xlsx` |
| Sinh lại bằng | `backend/scripts/tao_mau_gom_du_lieu_sau_thau.py` |
| Kiểm trước khi gửi | `backend/scripts/kiem_mau_gom_du_lieu.py <file> --xac-nhan-staging` |
| Nạp vào DB | `backend/scripts/nap_du_lieu_sau_thau.py <file> --xac-nhan-staging` |

Ba sheet, điền theo thứ tự: **`HOP_DONG`** (mỗi nhà thầu một dòng) →
**`HOP_DONG_MA_HANG`** (mã hàng thuộc từng hợp đồng) → **`GIAO_HANG`** (mỗi lần
hàng về một dòng, điền dần không cần chờ đủ).

Phép kiểm bắt **12 loại sai** trước khi nạp: hợp đồng mồ côi · số HĐ lặp · mã
hàng không có trong danh mục · khoa sai tên · gói con sai · không có đợt khớp ·
ngày sai dạng · hết hạn trước ngày ký · số âm · mã ghi hai lần trong một HĐ ·
giao trước ngày ký · giao vượt cam kết.

⚠️ **Ba sheet sau thầu của `database web.xlsx` (03/08/2026) đã LẠC HẬU** —
`HOP_DONG` (có cột trần hợp đồng, trái QĐ bỏ mọi cột giá) · `KET_QUA_THAU`
(trong v3 kết quả thầu do web TỰ SINH) · `GOI_THAU_TIMELINE` (đổ vào
`goi_thau_moc` đã chết từ 17/08). **Điền vào đó là dữ liệu rơi vào hư không.**

Ba bảng đích đã dựng ngày 25/08 (`patch_zzzzzj`): `hop_dong_v3` ·
`hop_dong_ma_hang` · `giao_hang`, neo đợt bằng khoá ngoại thật, cascade hai
tầng. "Đã giao / còn thiếu" **không lưu thành cột** — là view
`v_giao_hang_theo_ma_v3`.

| Mảng | Cần gì | Trạng thái nguồn |
|---|---|---|
| **Hợp đồng** | số HĐ · ngày ký · thời hạn · nhà thầu trúng theo mã hàng. **Không đơn giá, không giá trị HĐ** | ✅ Bảng `hop_dong_v3` + `hop_dong_ma_hang` đã dựng 25/08. **Mỗi nhà thầu MỘT hợp đồng** (QĐ 25/08) nên tách hai bảng |
| **Giao hàng** | **từng lần giao**: ngày · mã hàng · số lượng · khoa *(để trống nếu về kho chung)* | ✅ Bảng `giao_hang` đã dựng 25/08. **Không lưu lô/hạn dùng** (QĐ 25/08) |
| **Cam kết 20/50/80** | không cần dữ liệu mới — tính bằng view từ số trúng + số đã giao | ✅ `v_tien_do_su_dung` viết lại 25/08: mốc đếm = **ngày hàng về thật** (`min(giao_hang.ngay_giao)`), chưa có dòng giao thì lùi về ngày chốt trình ký. Cột `nguon_moc` nói rõ đang lấy mốc nào |
| **Mua thêm 30%** | không cần gì thêm | ✅ Đã đúng theo v3 |

Ba quyết định về mức chi tiết (QĐ 21/08/2026):

🆕 **Bốn quyết định 25/08/2026 đóng vào biểu mẫu** — `test_mau_gom_du_lieu_sau_thau.py`
giữ cả bốn, đừng thêm cột: (1) không cột giá nào; (2) giao hàng ghi từng lần
giao; (3) mỗi nhà thầu một hợp đồng → hai sheet; (4) không lưu lô/hạn dùng, và
cột `khoa` **để trống được** vì hàng về **kho trước** rồi kho mới cấp cho khoa —
phần kho→khoa lấy từ lịch sử xuất kho HIS (141.623 dòng đã nạp), không gõ lại.

- Giao hàng lưu **sự kiện từng lần giao** (≈12.000 dòng/đợt ≈ **3,2 MB/năm**),
  **không** lưu ảnh chụp tồn kho theo kỳ (≈48.000 dòng/năm ≈ 33 MB/năm — nặng gấp
  10 lần mà không biết được từng lần giao).
- "Đã giao bao nhiêu" ở cấp **mã hàng × từng khoa** — cần mức này mới chỉ được
  đích danh khoa nào chậm cam kết.
- "Đã giao / còn lại" và "% cam kết" là **VIEW, không lưu**.

**Dung lượng không phải vấn đề** (đo `pg_database_size` ngày 21/08/2026): database
**136/500 MB**, bốn mảng trên chỉ tốn **≈5–6 MB/năm**. Chỗ nặng là lịch sử HIS —
`usage_history_current` 63,67 MB + `usage_history_changelog` 48,23 MB = 82% database.

Mọi bảng mới phải neo `dot_goi_id` bằng **khoá ngoại thật**, không nhét vào chuỗi
— dự án đã dính đúng lớp lỗi này bốn lần.

Chi tiết khảo sát + schema đề xuất + **17 câu hỏi cần chủ dự án trả lời**:
`.scratch/mot-mat-ban/DU_LIEU_SAU_THAU.md`.

## 3. Năm biểu mẫu chính thức

Folder nguồn: `Form biểu mẫu/`.

1. Word chỉ định thầu.
2. Word cam kết số lượng.
3. Excel danh mục đề xuất của ĐVSD.
4. Word đề nghị mua thầu của PĐD.
5. Excel tổng hợp danh mục đi thầu.

Hệ thống phải dùng file mẫu thật, không dựng lại bố cục bằng tay. Word dùng form
sẵn; Excel đổ từng mã hàng theo mã quản lý và giữ đủ metadata.

**Cập nhật 09/08/2026 — nơi tạo 5 biểu mẫu:**

| # | Biểu mẫu | Tạo ở đâu |
|---|---|---|
| 1 | Word chỉ định thầu | tab "Hồ sơ chỉ định thầu" (`XuatHoSo.jsx`) |
| 2 | Word cam kết số lượng | tab "Cam kết của khoa" (`XuatHoSo.jsx`) |
| 3 | Excel danh mục đề xuất ĐVSD | `#danh-muc-de-xuat/<goiId>/<khoa>` (`DanhMucDeXuatKhoa.jsx`) |
| 4 | Word đề nghị mua thầu PĐD | Bàn điều hành → tab "Phiếu đề nghị mua thầu" |
| 5 | Excel tổng hợp đi thầu | `#tong-hop-pdd/<goiId>` (`TongHopPdd.jsx`), nút "Xuất Excel" |

Biểu mẫu 4 và 5 trước đây nằm chung ở màn "Tổng hợp & xuất hồ sơ"
(`TongHopPhongDieuDuong.jsx`), dựng trên một snapshot `phien_tong_hop` do PĐD
chốt tay. **Màn đó đã bị gỡ 09/08/2026** — snapshot thủ công là quyết định đã
bị đảo (xem `06_DUNG_LAM_LAI.md`), và giữ hai đường tổng
hợp song song là cách chắc chắn để hai file trình ký lệch số nhau. Bản tổng hợp
duy nhất hiện nay là Danh mục tổng hợp live sync, mở từ Bàn điều hành.

### Cột đã có thể đổ

- mã hàng, mã quản lý và tên nhóm;
- tên vật tư, tiêu chí kỹ thuật, ĐVT;
- lịch sử sử dụng theo năm;
- số lượng đề xuất và giải trình;
- tên thương mại, ký mã hiệu, hãng, nước sản xuất;
- tùy chọn 30%: trước thầu là số tạm tính trên số hiện hành, sau khi chốt trình
  ký là trần chính thức `floor(số trúng đã phân bổ × 30%)`.

### Cột phải thêm cho workflow v3

- số tham gia đấu thầu (baseline Q) theo khoa;
- số rớt theo từng giai đoạn (Chào giá / Mở thầu / Đánh giá) và lý do;
- số trúng = Q − tổng rớt;
- số trúng đã phân bổ cho từng khoa;
- số revision và thời điểm sinh file.

### Cột còn thiếu hoặc chưa chắc

- nhiều hệ mã HIS qua các quyết định cũ;
- mã kỹ thuật chi tiết;
- mã/tên Thông tư 04 và phân nhóm TT14;
- quy cách đóng gói;
- tên/đặc tính kỳ trước;
- lý do rớt thầu cũ;
- số thứ tự cố định để đối chiếu.

### Cột đã bỏ khỏi biểu mẫu

Giá dự kiến · giá hợp đồng cũ · tổng giá trị ước tính (QĐ 17/08/2026).

Không tự đoán hoặc chọn một dòng khi nguồn xung đột. Ghi vấn đề, giữ nguyên
nguồn và chờ người phụ trách xác nhận.

## 4. Quy tắc chất lượng

1. Mã hàng, mã quản lý và mã gói phải là text; không làm mất số 0 đầu.
2. Tên khoa phải thống nhất giữa lịch sử, proposal và kết quả.
3. Mỗi lần đề xuất có một ĐVT chuẩn do ĐVSD chọn trong các ĐVT của mã quản lý;
   đổi ĐVT chuẩn phải nhập lại đủ bảng quy đổi và lưu snapshot cùng đề xuất.
4. Ngày dùng ISO `YYYY-MM-DD`; số không chứa chữ/đơn vị.
5. Không sửa tay mã cho “giống nhau”; dùng bảng ánh xạ có thời gian hiệu lực.
6. Mỗi file ghi nguồn, thời điểm xuất và người xác nhận.
7. Không nạp thẳng production; kiểm và lập báo cáo lỗi trên staging trước.

## 5. Thứ tự nhận dữ liệu

1. Danh mục vật tư và nhóm kỹ thuật.
2. Lịch sử xuất kho ít nhất 24–36 tháng.
3. Đề xuất, gói, timeline và kết quả thầu.
4. Hồ sơ Word/Excel cũ kèm manifest.
5. Tồn, hàng về, hợp đồng và lead time (không cần giá).
5b. 🆕 **Giao hàng từng lần** (ngày · mã hàng · khoa · số lượng) — nạp theo mẫu
    v3 mới, không dùng sheet `TON_KHO_HANG_VE` cũ.
6. Thiếu hàng, VEN, quy đổi ĐVT và mã thay thế.
