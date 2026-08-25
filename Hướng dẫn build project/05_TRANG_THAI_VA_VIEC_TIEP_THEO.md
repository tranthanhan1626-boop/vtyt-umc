# Trạng thái hiện tại và việc tiếp theo

Cập nhật **24/08/2026**. Nhánh `phase-a-luong-de-xuat`.

> 🔴 **ĐỔI HƯỚNG 21/08/2026 — đọc trước mọi thứ khác trong file này.**
>
> Chủ dự án báo hướng cũ **đi chệch**. Chốt lại bằng 17 quyết định, gọi chung là
> bản **MỘT MẶT BÀN**. Luật mới đã vào `01_NGHIEP_VU_HIEN_HANH.md` và
> `06_DUNG_LAM_LAI.md`; **chưa thi công dòng code nào**.
>
> | | |
> |---|---|
> | Giữ nguyên | Toàn bộ flow từ đầu tới Danh mục tổng hợp |
> | Đổi | Mọi thao tác sửa của PĐD dồn về Danh mục tổng hợp; các màn khác chỉ để xem |
> | Đổi | Sau tích rớt, ô số để trống — **PĐD gõ tay**, có nút "chia theo tỉ lệ Q" |
> | Đổi | Khoá tổng phân bổ **chỉ chặn ở cổng chốt trình ký**, lúc gõ chỉ tô đỏ |
> | Đổi | Chốt trình ký còn **một nút toàn bộ**; bỏ 49 nút chốt từng khoa |
> | Đổi | Sửa số sau chốt Q: **gõ đè tại chỗ kèm lý do**, không mở chốt cả gói |
> | Thêm | **Chuyển tiếp** mã rớt vào đợt bổ sung gần nhất, hệ tự tạo đợt T1/T5/T9 |
> | Thêm | **Bốn mảng sau đấu thầu**: hợp đồng · giao hàng · cam kết 20/50/80 · 30% |
> | Bỏ | Dán kết quả thầu từ Excel (kết quả về bản giấy) |
> | Hoãn | Chỉ định thầu (gói riêng, flow khác) · 4 màn ngoài pipeline |
>
> Kế hoạch chi tiết + hai tài liệu nền: `.scratch/mot-mat-ban/`
> (`KE_HOACH.md` · `UX_MOT_MAT_BAN.md` · `DU_LIEU_SAU_THAU.md`).

> ✅ **HÔM NAY 24/08/2026 — đọc khối này trước.**
>
> Chủ dự án tự bấm trên site test và bắt được một chuỗi lỗi liên hoàn. Đã vá hết
> và chốt thêm **5 quyết định D11–D15**. Kèm một vòng **test quy mô thật
> 250 mã × 60 khoa** tìm ra 6 lỗi nữa.
>
> | | |
> |---|---|
> | D11 | Chuyển tiếp lần hai **cộng thêm**, không đè số khoa đã sửa |
> | D12 | Chuyển tiếp **chỉ cộng, không bao giờ trừ**; phần thừa thì HIỆN RA |
> | D13 | Gói 30% chỉ giữ mã **đã trúng** sau cả ba giai đoạn |
> | D14 | **Bỏ tự chia số trúng** — PĐD gõ tay; chia theo tỉ lệ là nút bấm |
> | D15 | Số phải chia = **trúng + phần nhận** từ mã rớt cùng nhóm |
>
> **Đổi thuật ngữ:** "cuốn chiếu" → **"chuyển tiếp"**, đổi cả tên bảng trong
> database. Phân biệt: `chuyen_so_rot_v3` đổi **MÃ** cùng đợt ·
> `chuyen_tiep_rot_v3` đổi **ĐỢT** cùng mã.
>
> **Thứ tự thao tác sau khi có kết quả thầu — hệ chặn nếu làm sai:**
>
> ```text
> gõ số rớt → CHIA số trúng về khoa → đổ sang mã tương đương
>           → mã nhận về trống, CHIA LẠI trên tổng mới → Xác nhận rớt
> ```
>
> **Giao diện:** Bàn điều hành **chỉ còn để xem** (gỡ 2 tab, thi công QĐ A2) ·
> bảng Tổng hợp có **CHẾ ĐỘ GÕ RỚT** gom còn 14 cột lọt trọn màn 1440px ·
> mở bằng **tab trình duyệt mới** · nút chuyển giai đoạn có chữ.
>
> **Dữ liệu test đang nằm trên staging** — đợt **#118**, 323 mã × 50 khoa, cả 5
> gói con đã chốt Q và ở giai đoạn Chào giá; đợt bổ sung T9/2026 · T1/2027 ·
> T5/2027 · T9/2027 mở sẵn. **100% mã có tổng nằm trong dải P50–P75** tính từ
> lịch sử thật. Dựng/xoá bằng `scripts/tao_du_lieu_test_day_du.py`.
> Kịch bản trình bày với lãnh đạo: `.scratch/demo/KICH_BAN_DEMO.md`.

> ✅ **BẢN VÒNG KHÉP KÍN — chốt VÀ THI CÔNG XONG ngày 23/08/2026.**
>
> Chủ dự án mô tả lại workflow đầy đủ 2 vai trò vì thấy dự án lệch hướng. Rà mã
> nguồn ra nguyên nhân: **không phải chưa build, mà đã build đầu tháng 8 rồi
> chết** khi thay xương sống sang v3. Ba bảng `goi_thau_ket_qua_ma` ·
> `goi_thau_tien_do` · `goi_thau_moc` không còn ai ghi vào, nên năm màn đọc
> chúng chỉ hiện rỗng mà không báo lỗi.
>
> **10 quyết định (D1–D10)** và toàn bộ 5 bước thi công đã xong, đo thật bằng
> trình duyệt hai vai trò. Chi tiết: `.scratch/vong-khep-kin/KE_HOACH.md`.
>
> | | |
> |---|---|
> | Xong | Cụm cột **Q · R1 · R2 · R3 · Trúng · Xử lý rớt** ngay trên Danh mục tổng hợp, kèm dải giai đoạn thầu |
> | Xong | **Hai nhịp**: gõ nháp → nút **"Xác nhận rớt"** là cò |
> | Xong | **Đổ số rớt sang mã tương đương** cùng mã quản lý, giữ nguyên số theo khoa; lệch ĐVT thì chặn |
> | Xong | **Chuyển tiếp mọi phần rớt chưa đổ** về đợt bổ sung T1/T5/T9 **luôn mở sẵn** |
> | Xong | **Hộp thư hai chiều** + badge đỏ ở Gói bổ sung |
> | Xong | Màn **Theo dõi chuyển tiếp mã rớt** cho PĐD |
> | Xong | Hồi sinh 3 view chết lên nền v3 → 5 màn sống lại |
> | Hoãn | **Miếng 0 và miếng 3** của bản một mặt bàn → nhánh sau (QĐ D6) |
>
> ⚠️ **Mục 3 bên dưới (bốn miếng của MỘT MẶT BÀN) đã lạc hậu ở miếng 0 và 3.**
> **Miếng 1 và miếng 2 đã XONG HẲN** (1c và 1d khép lại cuối ngày 24/08).

> 🟢 **25/08/2026 — MIẾNG 3 XONG, và bộ dữ liệu QUY MÔ THẬT đã có.**
>
> Ba bảng sau đấu thầu (`hop_dong_v3` · `hop_dong_ma_hang` · `giao_hang`), mốc
> cam kết 20/50/80 đếm từ ngày hàng về thật, đường nạp từ biểu mẫu Excel.
>
> Hai bộ dữ liệu ~1.586 mã × 50 khoa (≈16.200 dòng), tách nhau theo NĂM:
> **A = 2029** (test nội bộ) · **B = 2030** (chủ dự án tự bấm). Dựng lại bằng
> `scripts/tao_du_lieu_test_quy_mo_that.py --xac-nhan-staging --bo A|B`.
>
> Full pipeline chạy hết cả hai đường (18T 5 gói con + bổ sung) trong **105 giây**.

> 🔴 **TEST Ở LOCALHOST, KHÔNG DÙNG NETLIFY** (QĐ 25/08/2026). Tài khoản
> Netlify miễn phí đã hết credits build của tháng — push thêm KHÔNG build lại.
> Nghiệm thu bằng `cd frontend && npm run build && npm run preview` (cổng 4173),
> **không đo trên `npm run dev`** vì StrictMode gọi mọi truy vấn hai lần.
> Database không liên quan: patch chạy thẳng lên staging.

> ⚡ **Mở bảng Tổng hợp 340 mã: 15,9 s → ~5,4 s** (25/08). Hai việc: bọc lời gọi
> hàm trong policy RLS, và `fetchAllRows` tải các trang SONG SONG thay vì nối
> đuôi. **Đo trên bản build thật** — bản dev bật StrictMode nên gọi mọi truy vấn
> hai lần, con số đo ở đó bị thổi lên gấp đôi.
>
> ⚠️ **Hợp đồng mới của `fetchAllRows`:** `buildQuery(from, to)` PHẢI dựng truy
> vấn MỚI mỗi lần. Builder supabase-js đổi tại chỗ; dùng lại một builder đã dựng
> sẵn thì các trang song song đè range của nhau — đo thật: bảng 340 mã hiện 157
> mã, không báo lỗi gì.

> 🔴 **25/08/2026 — BẢY LỖI HỆ THỐNG lộ ra ở quy mô thật.** Không cái nào là lỗi
> mới viết; tất cả nằm sẵn, chỉ chưa ai chạy đủ lớn. Chi tiết ở `07`, khối 25/08 (2).
>
> Nặng nhất: **24 policy RLS gọi hàm theo TỪNG DÒNG** — ở 18.764 dòng là gần
> 37.000 truy vấn phụ cho một lần đọc, làm mở bảng Tổng hợp mất 15,9 s và đếm
> view kết quả thầu thì timeout. Vá xong còn **6,7 s** và **0,9 s**.
>
> Và **rò rỉ RLS**: khoa đọc được dòng rớt/chuyển tiếp/giao hàng của **cả 50
> khoa** ở ba bảng. Đã bịt.
>
> **Luật rút ra:** mọi policy RLS phải bọc lời gọi hàm trong `(select ham())`.
> `kiem_moi_man.py` nay có vòng canh riêng cho việc này.

> 🔴 **24/08/2026 cuối ngày — HAI LỖI CÓ SẴN, cùng một lớp: màn chết mà không
> ai biết.** Cả hai chỉ lộ ra khi bấm thật trên trình duyệt, `build` và
> `pytest` đều cho qua.
>
> 1. `BangSoTrungTheoKhoa` dùng ở `TongHopPdd.jsx` mà **không có trong câu
>    import** — sổ một dòng ở đợt đã chốt Q là **trắng cả màn**. Đã vá.
> 2. `v_ket_qua_thau_theo_khoa` **mất ba cột** khi viết lại nền hôm 23/08
>    (`da_xu_ly` · `ket_qua_id` · `dot_id`), làm **vỡ hẳn ba màn** — trong đó có
>    Danh mục đề xuất của ĐVSD. Đã vá bằng `patch_zzzzzi`.
>
> **Bài học đã thành công cụ:** `kiem_moi_man.py` trước chỉ dò `select("*")` nên
> báo xanh cả khi ba màn đã chết. Nay nó đọc **đúng danh sách cột** trong từng
> `.select(...)` và `.order(...)` rồi gọi thật bằng chính chúng. Chạy nó sau
> **mọi** lần viết lại view, không chỉ khi đổi bảng.

> File này **chỉ nói hôm nay đang ở đâu**. Nhật ký đầy đủ theo ngày ở
> `lich-su/NHAT_KY_TIEN_DO_2026.md`; tóm tắt thay đổi theo mốc ở
> `07_NHAT_KY_THAY_DOI.md`.

---

## 1. Web đáp ứng bao nhiêu phần workflow

**43/43 điều khoản kiểm được của workflow v3** — đã bấm thật trên giao diện ở
đúng vai trò và đối chiếu số ở database (vòng test 18–19/08/2026). Cộng thêm
3 điều khoản V2 (19, 20, 21) thi công và đo ngày 19/08.

⚠️ **Con số 43/43 đo theo luật TRƯỚC 21/08/2026.** Bảy điều khoản trong đó vừa bị
đảo (xem `06_DUNG_LAM_LAI.md`, khối 21/08). Chúng vẫn đang chạy đúng theo luật cũ
— nhưng luật cũ không còn là đích nữa. Phải đo lại sau khi thi công một mặt bàn.

🆕 **Ba bảng chết đã được chữa 23/08/2026.** Rà 34 màn cho ra đúng ba bảng của
mô hình trước v3 (`goi_thau_ket_qua_ma` · `goi_thau_tien_do` · `goi_thau_moc`).
Cách chữa: viết lại **nền của view** chứ không sửa từng màn — `patch_zzzzza` trỏ
`v_ket_qua_thau_theo_khoa` · `v_ma_rot_theo_goi` · `v_tien_do_su_dung` sang bảng
v3 mà giữ nguyên tên cột, nên 5 màn sống lại cùng lúc. Chỉ còn `TienDoGoiThau`
đọc bảng cũ — đã gỡ khỏi menu, để nguyên cho nhánh D6 viết lại.

**17/18 invariant** đo được và đúng. Cái còn lại (*một mã quản lý chỉ thuộc một
gói con*) cần **quyết định nghiệp vụ**, không phải việc code — xem mục 4.

Nghiệm thu ngày **25/08/2026 (cuối ngày)**: `pytest` **209** ·
`smoke_workflow_v3_staging` **29/29** · `kiem_do_ma_tuong_duong` **8/8** ·
33 bảng về đúng số dòng ban đầu · `kiem_moi_man` **ba vòng** xanh (nguồn · **298
cột** · RLS) · `test:formula` OK · `build` ✓ · **full pipeline quy mô thật
(1.586 mã × 50 khoa, cả hai đường) 105 giây không lỗi**.

🆕 **Thêm một vòng kiểm mới**: `scripts/kiem_moi_man.py --xac-nhan-staging` quét
mọi `.from()` / `.rpc()` của **36 màn** (63 bảng/view · 41 RPC), gọi thật bằng
JWT hai vai trò. Kết quả 23/08: **không màn nào gọi ra lỗi**; không nguồn nào
không tồn tại. Đây là vòng bắt đúng lớp lỗi "hiện rỗng mà không báo" mà smoke
không thấy vì smoke chỉ đi một đường xuyên pipeline chính.

🆕 **Đo bằng trình duyệt thật** (Chrome, hai vai trò, 23/08): chốt Q → chạy ba
giai đoạn → rớt → đổ mã → xác nhận rớt → chuyển tiếp → khoa nhận thông báo và
thấy mã trong đợt bổ sung với đúng số. Vòng này tìm ra **4 lỗi giao diện** mà
pytest và smoke không thấy (cột bị bóp còn 16px và bị ô khác đè · dải giai đoạn
không tải lại sau chốt Q · ô rớt không bắt được bàn phím · `window.confirm` khoá
cả trang). Cả bốn đã vá.

## 2. Cái gì đã chạy được, cái gì chưa từng test

**Đã đi qua và đo:** toàn bộ pipeline chính — PĐD tạo đợt → khoa lập đề xuất →
vòng xác nhận lần N → PĐD hiệu chỉnh → danh mục tổng hợp → chốt Q → ba giai
đoạn thầu → ngoại lệ rớt → phân bổ số trúng → giỏ rớt → chốt trình ký →
revision → Excel chính thức → tuỳ chọn 30%. Cả pipeline bổ sung.

**Chưa test lần nào** — bốn màn ngoài pipeline (mục 11 của `01`). 🆕 **QĐ
21/08/2026: cả bốn TẠM DỪNG, không build tiếp** — chưa ai xài lần nào, ưu tiên
dồn cho một mặt bàn và bốn mảng sau thầu:

| Màn | Vì sao vẫn quan trọng |
|---|---|
| Sổ thiếu hàng | **Nguồn duy nhất** đo nhu cầu thật; HIS chỉ có lượng đã cấp khi còn hàng. Cần để hiệu chuẩn công thức 2027 |
| Điều chỉnh tiêu chí kỹ thuật | Khoa đề nghị sửa TSKT, PĐD duyệt |
| Duyệt mã kỹ thuật khoa đề nghị | Việc duy nhất còn lại của tab Chờ duyệt |
| Tiến độ sử dụng theo cam kết | Module sau khi hàng về, theo dõi 20/50/80. ⚠️ **Đang hỏng ngầm** — view đọc 3 bảng của mô hình trước v3, cả ba 0 dòng, không ai ghi vào nữa. Không báo lỗi, chỉ hiện rỗng. Đây là việc **viết lại**, đã chuyển vào miếng 3 |

**Chưa test ở quy mô thật.** Vòng test dùng 1 mã quản lý · 11–14 mã hàng ·
2–3 khoa. Gói 18T thật có **hàng trăm mã và 62 khoa**. Luật V2 đổi hành vi đúng
chỗ đông người dùng nhất (ai cũng sửa được cột chữ), nên vòng test quy mô thật
càng cần.

## 3. Việc tiếp theo — bốn miếng của bản MỘT MẶT BÀN

Xếp theo nguyên tắc: **thứ nào chặn việc của người thì làm trước.**

### Miếng 0 — ✅ XONG 25/08/2026

Workbook `database web.xlsx` lập 03/08 trỏ vào các bảng của mô hình **trước v3**;
ba sheet sau thầu (`HOP_DONG`, `KET_QUA_THAU`, `GOI_THAU_TIMELINE`) đều **0
dòng** và điền vào đó thì dữ liệu **rơi vào hư không**.

Thay bằng **`database/MAU_GOM_DU_LIEU_SAU_THAU.xlsx`** — sinh bằng
`backend/scripts/tao_mau_gom_du_lieu_sau_thau.py`, ba sheet:

| Sheet | Một dòng là | Cột |
|---|---|---|
| `HOP_DONG` | một hợp đồng | gói con · năm · số HĐ · nhà cung cấp · ngày ký · ngày hết hạn · có tùy chọn 30% · ghi chú |
| `HOP_DONG_MA_HANG` | một mã hàng trong một hợp đồng | số HĐ · mã hàng · số lượng hợp đồng · ĐVT · ghi chú |
| `GIAO_HANG` | **một lần giao** | ngày giao · số HĐ · mã hàng · số thực nhận · khoa *(để trống nếu về kho)* · ghi chú |

**Bốn quyết định đóng vào thiết kế** — `test_mau_gom_du_lieu_sau_thau.py` giữ cả
bốn, đừng thêm cột:

1. **Không cột giá** nào (QĐ 17/08, xác nhận 21/08).
2. Giao hàng ghi **từng lần giao**, không phải ảnh chụp tồn kho định kỳ (21/08).
   Phương án ảnh chụp nặng gấp 10 (33 MB/năm so với 3,2) mà 90% dòng lặp lại.
3. **Mỗi nhà thầu một hợp đồng** → tách hai sheet (25/08).
4. **Không lưu lô/hạn dùng**; cột `khoa` **để trống được** vì hàng về **kho
   trước** rồi kho mới cấp cho khoa (25/08). Phần kho→khoa lấy từ lịch sử xuất
   kho HIS đã nạp, không gõ lại.

🆕 **Kèm phép kiểm chạy được NGAY, chưa cần bảng đích:**

```bash
cd backend && set -a && . ./.env.local && . ../frontend/.env && set +a
.venv/bin/python scripts/kiem_mau_gom_du_lieu.py \
    ../database/MAU_GOM_DU_LIEU_SAU_THAU.xlsx --xac-nhan-staging
```

12 phép: hợp đồng mồ côi · số HĐ lặp · mã hàng không có trong danh mục · khoa sai
tên · gói con sai · không có đợt khớp · ngày sai dạng · hết hạn trước ngày ký ·
số âm · mã ghi hai lần trong một HĐ · giao trước ngày ký · giao vượt cam kết.
Đã đo bằng hai file cố tình sai: bắt đúng cả 12.

→ Chủ dự án gom dữ liệu **song song** với lúc build, và biết ngay dữ liệu có dùng
được không thay vì gom hàng nghìn dòng sai rồi mới phát hiện lúc nạp.

⚠️ **Đường NẠP chưa có** — ba bảng đích (`hop_dong_v3` · `hop_dong_ma_hang` ·
`giao_hang`) dựng ở **miếng 3**. Thiết kế cột đã chốt ở
`.scratch/mot-mat-ban/DU_LIEU_SAU_THAU.md` mục 4; cột của biểu mẫu ánh xạ 1-1
sang chúng (xem cột "Đích database" trong sheet `01_TU_DIEN_COT`).

### Miếng 1 — Grid một mặt bàn (lớn nhất)

Thiết kế chi tiết + ASCII mockup ở `.scratch/mot-mat-ban/UX_MOT_MAT_BAN.md`.

| | Nội dung | Đụng tới |
|---|---|---|
| 1a | R1/R2/R3 thành **ba ô gõ riêng** trong dòng | `TongHopPdd.jsx` — vá luôn lỗi "mã đã rớt mất đường nhập giai đoạn 2/3" |
| 1b | Cụm ô nhập số trúng theo khoa trong dòng sổ + nút "Chia theo tỉ lệ Q" | `TongHopPdd.jsx` + RPC phân bổ |
| 1c | ✅ **XONG 24/08** — nới khoá cứng 2: cho lưu bản còn THIẾU, vẫn chặn bản DƯ | `patch_zzzzzh` + `CumThauTongHop.jsx` |
| 1d | ✅ **XONG 24/08** — hai chế độ cột · phím tắt gõ dọc · ô nhập lý do · gỡ 2 tab | `TongHopPdd.jsx`, `CumThauTongHop.jsx`, `BanDieuHanhPdd.jsx` |

**Miếng 1 đã khép lại.** Cách nới 1c: đổi đúng một câu trong
`cap_nhat_phan_bo_trung_v3` (`tổng <> phải chia` → `tổng > phải chia`). Nới được
là vì **hai cổng dựa trên `da_khop` vẫn sống** — `xac_nhan_rot_v3` (D14) và
`chot_trinh_ky_toan_bo_v3`. `test_patch_zzzzzh_contract.py` đọc thẳng hai patch
đó, ai gỡ cổng sẽ làm đỏ test. Đừng gỡ.

Số đo hiện trạng (đếm từ code, một số bước là ước lượng — ghi rõ trong tài liệu
UX): tích rớt một mã + gõ số trúng cho khoa hiện tốn **~11–14 click, 3 lần đổi
ngữ cảnh**; sau khi làm còn **~3 click, 0 đổi màn**. Hoàn tất một gói con: **2
màn/3 tab → 1 màn**. Hôm nay hai màn danh mục **không có phím tắt nào**
(`grep onKeyDown` = 0 kết quả).

### Miếng 2 — Chuyển tiếp mã rớt

Lịch đợt bổ sung T1/T5/T9 · tự sinh đợt khi thiếu · tự đưa mã rớt vào đợt gần
nhất của từng khoa kèm số · màn theo dõi của PĐD (`01` mục 6.2).
Phụ thuộc miếng 1 — số rớt phải nhập được đã.

### Miếng 3 — Bốn mảng sau đấu thầu

Bảng hợp đồng + bảng giao hàng từng lần (neo `dot_goi_id` bằng **khoá ngoại
thật**). Rồi **viết lại** view cam kết 20/50/80. Mua thêm 30% đã đúng v3, không
đụng. Phụ thuộc miếng 0 — cần dữ liệu thật để thử.

Khảo sát + thiết kế + **17 câu hỏi dữ liệu** cho chủ dự án:
`.scratch/mot-mat-ban/DU_LIEU_SAU_THAU.md`.

---

## 3b. Nợ cũ — gộp vào lúc tiện tay

**a. `danh_muc_khoa_o` — ĐÃ NEO ĐỢT 20/08/2026 (`patch_zzzzw`).** Thêm cột
`dot_goi_id` khoá ngoại `ON DELETE CASCADE`, đưa vào khoá duy nhất. Đo thật sau
khi vá: hai đợt bổ sung 2027 cùng ghi `goi_id='bo-sung'` giữ được **hai dòng
riêng**; xoá một đợt thì dòng của đợt kia còn nguyên.

**b. Ba bảng cùng lớp lỗi vẫn CHƯA neo đợt:**

| Bảng | Hiện trạng | Gộp vào |
|---|---|---|
| `danh_muc_tong_hop_o` | có đợt nhưng nhét trong **CHUỖI** `'<goi>:dot:<id>'`, không phải khoá ngoại — nguồn của Lỗi 24 | **Miếng 1** đụng đúng bảng này |
| `danh_muc_khoa_cot_cau_hinh` | cấu hình khoá/ẩn cột theo (goi_id, nam, khoa); cấu hình kỳ trước lẫn sang kỳ sau | Miếng 1d |
| `dem_du_lieu_lam_viec` · `don_du_lieu_lam_viec` | nút "Kết thúc đợt & dọn" nhận (goi_id, nam) nên quét **cả 3 đợt bổ sung cùng năm** | Miếng 2 |

**c. `.docx` — ✅ ĐÃ ĐỒNG BỘ 25/08/2026.** `Full workflow vtyt web.docx` nay
khớp `01`: khoá cứng 2 nới theo miếng 1c, trọng số chia trừ phần đã đưa đi, và
mục **XII quater** về dữ liệu sau đấu thầu (hợp đồng · giao hàng · mốc cam kết).
Sửa `01` thì nhớ sửa cả `.docx` — quy ước hai file phải khớp.

**d. Sơ đồ `so-do-workflow/` lại lạc hậu** — vẽ lại 20/08 theo v3+V2, chưa có
21/08. Lưu ý `generate-diagrams.mjs` **không sinh `.png`**, phải xuất tay theo
`so-do-workflow/README.md`.

**e. Cờ `da_di_thau` — kịch bản C còn hở.** `fn_chan_o_da_lock` +
`fn_chan_xoa_o_da_chot` chặn mọi sửa ô tổng hợp khi có dòng
`danh_muc_tong_hop_chot`, mà **không có nút nào trên giao diện mở lại**. Hiện vô
hại vì không code frontend nào ghi bảng đó — nhưng **miếng 1 sẽ ghi vào bảng tổng
hợp rất nhiều**, phải kiểm lại trước khi làm 1b.

**f. Bổ sung smoke đường THÀNH CÔNG** — 🆕 **đã trả một phần 24/08** cho đường
phân bổ số trúng (3 phép mới: lưu bản thiếu rồi ĐỌC LẠI số ở database · gõ dư bị
chặn · cổng xác nhận rớt vẫn chặn). Các RPC khác vẫn còn chỉ có `phai_loi`. Lỗ
hổng đã chứng minh được: `cap_nhat_tong_phan_bo_khoa` từng hỏng hoàn toàn mà
smoke vẫn xanh, vì phép thử duy nhất gọi nó là `phai_loi(...)` — nó ném lỗi thật
nhưng vì lý do sai.

**g. Nhánh chết `su_kien_nhu_cau`** trong `xoa_du_lieu_kiem_thu` (bảng đã bỏ theo
QĐ 17/08, gọi tới là `42P01`). Không nút nào gọi tới; gỡ phải viết lại nguyên hàm
14KB.

**h. Nút chết:** "Xem theo khoa ▾" ở `TongHopPdd.jsx:901` không có `onClick`.

**i. Comment trỏ đường dẫn cũ** — sáu chỗ còn ghi `Tổng quan/...`. Tất cả là
comment/docstring, không chỗ nào đọc file:

| File | Dòng |
|---|---|
| `netlify.toml` | 2 |
| `frontend/src/features/BanDieuHanhPdd.jsx` | 16 · 125 |
| `frontend/src/lib/congThucSoLuong.js` | 3 |
| `frontend/src/features/DeXuatTongHop.jsx` | 24 · 196 |
| `backend/scripts/smoke_pipeline_hien_tai.py` | 7 · 10 |

---

## 3c. 🆕 Việc tiếp theo sau ngày 24/08/2026

Xếp theo thứ tự nên làm:

| # | Việc | Ghi chú |
|---|---|---|
| ~~1~~ | ~~Miếng **1c**~~ | ✅ xong 24/08 — `patch_zzzzzh` |
| ~~2~~ | ~~Miếng **1d**~~ | ✅ xong 24/08 — Enter/Shift+Enter/Esc/Ctrl+Enter trong bảng chia số trúng |
| ~~3~~ | ~~**Miếng 0** — mẫu Excel gom dữ liệu~~ | ✅ xong 25/08 |
| ~~4~~ | ~~**Miếng 3** — nền dữ liệu sau đấu thầu~~ | ✅ xong 25/08 — 3 bảng + đường nạp + mốc cam kết theo ngày giao thật |
| ~~6~~ | ~~**Sửa gốc lỗi "đổ quá tay"**~~ | ✅ xong 25/08 — trọng số chia TRỪ phần đã đưa đi (`patch_zzzzzt`) |
| ~~5~~ | ~~**Tối ưu tốc độ bảng Tổng hợp**~~ | ✅ xong 25/08 — **15,9 s → ~5,4 s**. Phân trang song song + vá RLS |
| 3 | Nhánh **D6** — tiến độ gói thầu theo số quyết định / số hợp đồng | Thiết kế + 6 câu hỏi ở `.scratch/tien-do-goi-thau/BRAINSTORM.md` |
| 4 | Vẽ lại sơ đồ theo D11–D15 | Sơ đồ đang ở mốc 23/08 |
| 5 | Nợ cũ mục 3b — neo đợt cho 3 bảng còn lại | Cùng lớp lỗi với `danh_muc_khoa_o` đã neo 20/08 |

**Script mới thêm trong hai ngày 23–24/08:**

| Script | Dùng khi |
|---|---|
| `kiem_moi_man.py` | sau mỗi lần đổi schema hoặc gỡ/thêm màn — bắt lỗi "hiện rỗng mà không báo" |
| `test_quy_mo_that.py` | trước khi tin rằng thứ gì đó chạy nổi ở quy mô thật |
| `kiem_do_ma_tuong_duong.py` | mỗi lần đụng vào đường đổ số rớt sang mã tương đương |
| `tao_du_lieu_test_day_du.py` | dựng / xoá bộ dữ liệu để chủ dự án tự bấm |

---

## 4. Đang chờ quyết định của chủ dự án

### Đã trả lời 21/08/2026

| Câu | Trả lời |
|---|---|
| Cột `giai_trinh_2627` nằm ở dòng nào trên grid | **Dòng sổ của khoa** |
| Khoá cứng 3 (`R1+R2+R3 ≤ Q`) có nới như khoá 2 không | **Không — giữ chặn cứng ngay** |
| Mã rớt tháng 4 → đợt T5, tháng 10 → đợt T1 năm sau | **Đúng** |
| Màn theo dõi mã rớt hiển thị gì | Theo **từng mã hàng rớt**: khoa nào đã đề xuất mã đó, từng khoa đã có mã đó trong đợt bổ sung gần nhất chưa |
| Hợp đồng có cột giá không | **Không** — giữ QĐ 17/08 |
| Dữ liệu giao hàng dạng gì | **Từng lần giao** |
| "Đã giao" ở mức nào | **Mã hàng × từng khoa** |

### ✅ Đã chốt 25/08/2026 — cách sửa gốc lỗi "đổ quá tay"

Chủ dự án chọn **hướng 1: trọng số chia = `(Q của khoa − đã đưa đi) + nhận`**.
Thi công ở `patch_zzzzzt`, áp cho cả chia tự động lẫn trần gõ tay, và bảng chia
có thêm cột **Đã đưa đi**. Chi tiết ở `01` mục 5.3 và `07` khối 25/08 (4).

Hai cổng chặn (`patch_zzzzzn` + `patch_zzzzzs`) giữ nguyên làm **lưới an toàn**.

### Còn mở — khác

| Việc | Nội dung |
|---|---|
| **`usage_history_changelog` 48 MB** | Dọn giữ 12 tháng (thu ~45 MB), dọn sạch, hay để nguyên? Chưa gấp — 136/500 MB vẫn còn chỗ. Xoá = mất khả năng **hoàn tác mẻ nạp nhầm**, không mất số hiện hành |
| **14 câu hỏi dữ liệu còn lại** | Mục 8 của `.scratch/mot-mat-ban/DU_LIEU_SAU_THAU.md` — nhóm hợp đồng, giao hàng, cam kết, nạp dữ liệu. Trả lời khi làm miếng 0 |
| **PĐD sửa tổng mã hàng trước thầu** | Một mặt bàn chốt "gõ tay" cho phần **sau** rớt. Phần **trước** thầu vẫn giữ đường "gõ vào ô tổng → hệ chia theo tỉ lệ", chỉ thêm đường gõ thẳng ô từng khoa. Đây là **suy ra**, chưa hỏi — xem `01` mục 3 |
| **3 mã quản lý vắt ngang gói con** | `N03.03.050.07` · `N05.02.030.14` · `N07.03.020.01`. Invariant 2 chưa đạt. Để nguyên theo ý chủ dự án — tự phân trên web |
| **Khoa A sửa TSKT làm khoa B mất xác nhận** | Đã đo 20/08: đúng là vậy. Cần xác nhận đây là ý muốn |

---

## 5. Lộ trình tới go-live

| Chặng | Nội dung | Trạng thái |
|---|---|---|
| 1. Nền | `dot_goi`, schema v2, migrate khoá | ✅ chạy được, đo trên staging |
| 2. Số theo khoa | `phan_bo_khoa`, tổng hợp thành view | ✅ |
| 3. Chốt Q | Snapshot bất biến, nhánh "không phát sinh nhu cầu" | ✅ |
| 4. Sau đấu thầu | Rớt 3 GĐ → số trúng → phân bổ → giỏ rớt → 30% | ✅ theo luật cũ; **miếng 1+2 viết lại phần lớn** |
| 5. Chốt & xuất | Revision 2 tầng, Excel chính thức | ✅ theo luật cũ; **miếng 1d đụng tới** |
| **6. Một mặt bàn** | Miếng 0 · 1 · 2 | 🆕 **chưa bắt đầu** |
| **7. Sau đấu thầu mở rộng** | Miếng 3: hợp đồng · giao hàng · cam kết 20/50/80 | 🆕 **chưa bắt đầu** |
| Test quy mô thật | Hàng trăm mã × 62 khoa | chưa làm |
| Pilot 3–5 khoa | | T12/2026 |
| Chuyển production | Theo thứ tự bắt buộc ở `04`, mục 4b | T12/2026 |
| **Go-live** | | **01/01/2027** |

> Năm chặng đầu lập ngày 17/08/2026 và đã chạy nhanh hơn kế hoạch rất nhiều — tới
> 20/08 cả năm đều có đường đi chạy được trên staging. Thời gian đệm T9–T11 giờ
> dùng cho **chặng 6 và 7**, cộng với test ở quy mô thật.

---

## 6. Năm việc bắt buộc trước go-live

1. **Gỡ RPC `xoa_du_lieu_kiem_thu`** khỏi project sẽ thành production và đổi
   ref nhận diện — `04`, mục 4b, bẫy 28. Không làm thì nút "Dọn dữ liệu kiểm
   thử" nằm trên hệ thống thật.
2. Dọn sạch dữ liệu thử, nạp lại dữ liệu nền thật, đối chiếu số dòng.
3. **Diễn tập phục hồi trên bảng LỚN** (`proposals`, `usage_history_current`) —
   mới diễn tập được bảng nhỏ.
4. **Kế hoạch dung lượng phải tính cả `usage_history_changelog`**: 291.622 dòng
   / 48,2 MB, chiếm 40% dung lượng và tăng gấp đôi bảng lịch sử, nhưng
   `patch_zn` KHÔNG đụng tới. Đang **122/500 MB** gói free (đo 20/08).
5. **Màn quản trị người dùng** — sau `patch_zx`, người PĐD tự đăng ký vào với
   vai trò `dvsd` và phải nâng quyền tay trong Supabase Table Editor.

## 7. Trạng thái staging ngay lúc này

Đã dọn về **dữ liệu nền**, mọi bảng nghiệp vụ = 0:

```text
users 8 · vat_tu 3.327 · nhom_ky_thuat 1.369
usage_history_current 141.623 · usage_history_changelog 291.622
dot_de_xuat 0 · proposals 0 · phan_bo_khoa 0 · chot_q_phien 0
```

**Dung lượng — đo thật 21/08/2026** (`pg_database_size`, không phải ước lượng):

| | |
|---|---|
| Cả database | **136 / 500 MB** gói free |
| `usage_history_current` | 63,67 MB |
| `usage_history_changelog` | 48,23 MB |
| Hai bảng đó cộng lại | **111,9 MB = 82% database** |
| Bốn mảng sau đấu thầu sẽ tốn | **≈5–6 MB/năm** |

Giả định "import dữ liệu sau thầu vào sẽ quá nặng" đã được **đo và bác bỏ**. Chỗ
nặng là lịch sử HIS (~55 MB/năm), không phải dữ liệu nghiệp vụ. `patch_zn` chỉ
nén `usage_history_current`, **không đụng** changelog.

Tài khoản test — **mật khẩu tất cả là `111111`**:

| Email | Vai trò | Khoa |
|---|---|---|
| `pdd@umc.edu.vn` | dieu_duong | Phòng Điều dưỡng |
| `an.tt1@umc.edu.vn` · `admin@umc.edu.vn` | admin | Phòng Điều dưỡng |
| `dvsd1@umc.edu.vn` · `phongmo@umc.edu.vn` | dvsd | Khoa GMHS - Phòng mổ |
| `dvsd2@umc.edu.vn` · `rhm@umc.edu.vn` | dvsd | Khoa Phẫu thuật hàm mặt răng hàm mặt |
| `dvsd3@umc.edu.vn` | dvsd | Khoa Ngoại thần kinh |
