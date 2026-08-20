# V2 — một giá trị chung, ai sửa sau đè, xác nhận theo vòng

Chốt với chủ dự án 19/08/2026 (chiều + tối). **THAY THẾ** `THIET_KE.md` (đã xoá 20/08/2026) (bản
sáng cùng ngày) ở mọi điểm mâu thuẫn.

> ✅ **ĐÃ THI CÔNG XONG 19/08/2026** — 4 bước, 4 patch SQL đã chạy staging, giao
> diện xong, đo bằng Chrome với JWT thật của cả hai vai trò. Kết quả từng bước:
> `CHECKLIST_THI_CONG.md`. `Full workflow vtyt web.docx` cũng đã sửa theo
> (8 chỗ + 3 điều khoản mới + 6 dòng nhật ký quyết định) — xem `PHU_LUC_DOCX_V2.md`.
>
> Nghiệm thu: `pytest` **107** · `smoke_workflow_v3` **13/13** ·
> `kiem_truoc_deploy` **Sạch** · `test:formula` 5/5 · `build` ✓

Tên file giữ nguyên từ lúc tạo, nhưng nội dung đã đi xa hơn "bỏ khoá ô" — đọc
hết mục 1 trước khi làm bất cứ việc gì.

---

## 1. Mô hình cuối — bốn mảnh

### 1.1 Cột CHỮ: MỘT giá trị chung toàn viện

> TSKT là thuộc tính của **MÃ HÀNG**, không phải của khoa. Cả viện dùng chung
> đúng một dòng cho mỗi (mã hàng, cột).

- Ai sửa sau đè **cho tất cả** — PĐD sửa hay khoa sửa đều vậy.
- GMHS sửa TSKT mã X → RHM mở màn ra thấy ngay giá trị mới.
- Bản Tổng hợp và bản khoa **không thể lệch nhau**. Nguyên văn chủ dự án:
  *"cả 2 phải là 1 chứ sao khác nhau được?"*
- Hệ quả: **bỏ cờ lệch cho cột chữ** (không còn gì để lệch), và
  `danh_muc_khoa_o` phần cột chữ trở thành **thừa** — xem D1.
- **NGOẠI LỆ `giai_trinh_2627`**: giải trình là tiếng nói của từng khoa, giữ
  riêng theo khoa như cũ, không dùng chung.
- Khoá: **chốt trình ký toàn bộ**.

### 1.2 Cột SỐ: mỗi khoa một số, tổng là phép cộng

- `phan_bo_khoa.so_luong_goc` = số khoa gửi ban đầu, **đóng băng làm dấu vết**.
  Mọi lần sửa sau vào `so_luong_hien_hanh`.
- **Tổng đi thầu = cộng số hiện hành của các khoa.** Khoa sửa số của mình thì
  tổng đổi theo ngay.
- PĐD không gõ số từng khoa mà gõ **tổng**; hệ chia về các khoa theo tỉ lệ
  (`cap_nhat_tong_phan_bo_khoa` — đã có, đã vá 19/08).
- Khoa sửa số **ngay trên màn Danh mục đề xuất của khoa** (hiện cột số đang
  chỉ đọc, có dòng chữ "chỉ sửa được ở màn Nhập đề xuất" — phải gỡ).
- Chủ dự án sẽ dặn qua Teams: *đề xuất rồi thì hạn chế tự sửa số, để PĐD điều
  chỉnh.* Đó là quy ước mềm, **không cài thành chặn**.
- Khoá: **chốt Q**.

### 1.3 Cột range P50–P75 — MỚI

Thêm một cột đứng cạnh cột số, ở **cả hai bảng**:

| Bảng | Dải tính trên |
|---|---|
| Danh mục đề xuất của khoa | lịch sử dùng của **chính khoa đó** |
| Tổng hợp của PĐD | lịch sử **toàn viện** của mã đó |

- Số vượt **P75** → **tô nổi bật**. Dưới P50 không sao.
- **Chỉ tô nổi bật.** Không chặn lưu, không bắt nhập lý do, không đếm đầu trang.
- Dùng lại `danhGiaSoLuong(lichSu, thieu, H, giaTri, thangCuoiHIS)` trong
  `frontend/src/lib/congThucSoLuong.js` — trả đúng `{tu: p50, den: P75,
  ngoaiKhoang: so > P75}`. `H` đã lấy theo kỳ của gói, **không đóng đinh 18**.
- Cột `p50` `p75` `p90` `p95` đã khai sẵn trong `cotChuan.js`
  (`COT_QUA_TRINH_MO_RONG`) nhưng chưa gắn vào hai bảng này.

### 1.4 Vòng xác nhận — thay cho "khoa chốt danh mục"

```
khoa sửa → [Xác nhận thông tin đề xuất lần 1]
         → ai đó sửa mã X → xác nhận của khoa có mã X tự huỷ
         → nút thành [Xác nhận lần 2] → PĐD nhắn Teams → khoa check → bấm
         → … → PĐD chốt danh sách đề xuất đi thầu
```

- **Số lần không giới hạn** — lần 3, lần 4 nếu còn sửa tiếp.
- **Phạm vi huỷ**: chỉ các khoa **có đề xuất mã X**. Khoa không dùng mã đó giữ
  nguyên xác nhận. (Với 62 khoa và hàng trăm mã, huỷ toàn đợt là không dùng được.)
- **Khoa tự sửa cũng tự huỷ xác nhận của chính mình** — xác nhận luôn gắn với
  bản dữ liệu tại thời điểm bấm.
- **Chốt danh sách đi thầu: CHẶN CỨNG** nếu còn khoa chưa xác nhận lần mới nhất.
- **Khoa chưa gửi đề xuất nào thì không tính** — không gửi thì không phải xác
  nhận. Khoa đó chỉ hiện ở dòng cảnh báo, không làm kẹt nút chốt.
- Khoa không sửa được sau chốt; **PĐD vẫn mở chốt được** (giữ
  `mo_chot_so_tham_gia_thau_v3`, `mo_chot_trinh_ky_khoa_v3`).

> **Suy ra, chưa hỏi chủ dự án:** cột chữ là giá trị chung, nên GMHS sửa TSKT
> mã X cũng làm **RHM mất xác nhận** (bản RHM đã xem bị đổi). Đúng theo logic
> "xác nhận = tôi đã xem bản này", nhưng chủ dự án chưa xác nhận điểm này.

---

## 2. Vì sao bỏ luật khoá ô của bản sáng

Bản sáng khoá ô ngay khi PĐD gõ, vì sợ 62 khoa mỗi khoa một TSKT thì hồ sơ mời
thầu không dùng được. Nó gộp *gõ để soạn* và *chốt để đóng* vào một thao tác:
PĐD gõ nửa chừng là khoa hết đường sửa.

V2 xử nỗi lo đó bằng cách khác và triệt để hơn: **cột chữ chỉ có một giá trị**,
nên không có gì để lệch ngay từ đầu. Việc đóng băng dời sang chốt trình ký, và
việc "mọi khoa đã ngó qua bản cuối" giao cho vòng xác nhận.

---

## 3. Việc phải làm

### Tầng DB

> Bảng dưới là kế hoạch lúc lập. Trạng thái thật của từng mục:
> `CHECKLIST_THI_CONG.md`. **D7 hoá ra không cần cột `sua_luc`** — cột chữ về
> một bảng chung nên không còn hai giá trị để so "ai sửa sau"; **D5 cũng không
> cần hàm mới** — `trg_khoa_o_tong_hop_sau_chot_q` đã tách số/chữ sẵn.

| # | Việc | Ghi chú |
|---|---|---|
| D1 | **Cột chữ về một chỗ**: mọi vai trò ghi vào `danh_muc_tong_hop_o`; `danh_muc_khoa_o` chỉ còn giữ `giai_trinh_2627` | mảnh nặng nhất. Phải **chuyển dữ liệu cột chữ đang nằm ở `danh_muc_khoa_o`** sang trước, quyết định lấy bản nào khi 2 khoa đang lệch |
| D2 | Gỡ `trg_z_khoa_o_khoa_khi_pdd_da_duyet` + hàm | patch_zzzzp mục 3 — hết lý do tồn tại |
| D3 | Gỡ `trg_chan_o_khoa_da_chot` + `fn_chan_o_khoa_da_chot` | patch_zs mục 4b |
| D4 | Mở RLS cho `dvsd` **GHI** `danh_muc_tong_hop_o` (nay chỉ cho đọc) | hệ quả trực tiếp của D1 |
| D5 | Khoá cột chữ theo `chot_trinh_ky_phien_v3`, cột số theo `chot_q_phien` | đã có mẫu ở `fn_khoa_o_tong_hop_sau_chot_q` |
| D6 | Mở đường khoa sửa `phan_bo_khoa.so_luong_hien_hanh` của chính khoa mình | RLS hiện chỉ cho `dieu_duong/admin` |
| D7 | Đổi `danh_muc_khoa_chot` thành bảng **xác nhận theo vòng**: thêm cột `lan int`, huỷ khi có sửa | dùng lại audit + RLS đã có, đừng dựng bảng mới |
| D8 | Trigger huỷ xác nhận khi `danh_muc_tong_hop_o` hoặc `phan_bo_khoa` đổi | phạm vi: các khoa có đề xuất đúng mã đó |
| D9 | `chot_so_tham_gia_thau_v3`: **chặn cứng** khi còn khoa đã gửi mà chưa xác nhận lần mới nhất | đổi từ "ghi số" sang "chặn" |
| D10 | `so_khoa_chua_chot` → đổi nghĩa: số khoa **chưa gửi đề xuất nào** (dòng cảnh báo) | giữ tên cột |

### Tầng giao diện

| # | Việc |
|---|---|
| F1 | `DanhMucDeXuatKhoa`: cột chữ bỏ `readonly`, ghi thẳng vào `danh_muc_tong_hop_o`; bỏ nhãn phụ "PĐD duyệt" (không còn hai giá trị) |
| F2 | `DanhMucDeXuatKhoa`: **mở cột số cho khoa sửa**, gỡ dòng "chỉ sửa được ở màn Nhập đề xuất" |
| F3 | Thêm cột **P50–P75** cạnh cột số ở CẢ hai bảng, tô nổi bật ô vượt P75 |
| F4 | Nút **"Xác nhận thông tin đề xuất lần N"** bên khoa + trạng thái hiện trên Bàn điều hành PĐD |
| F5 | `TongHopPdd`: nút chốt **mờ đi** khi chưa đủ xác nhận, hiện rõ còn thiếu khoa nào |
| F6 | Bỏ nút "Chốt danh mục" / "Mở lại để sửa" bên khoa |
| F7 | `BanDieuHanhPdd`: cột "khoa chưa chốt" → "khoa chưa xác nhận lần N" + "khoa chưa gửi đề xuất" |
| F8 | Giữ cờ lệch **chỉ cho cột số**: "tổng đã đổi so với lúc PĐD chia" |

### Phải rà lại

- `test_pdd_duyet_o_chu_contract.py` (10 test viết cho luật khoá ô — sẽ đỏ toàn bộ),
  `test_so_chot_contract.py`, `test_chot_q_v3_contract.py`
- `smoke_workflow_v3_staging.py`, `kiem_truoc_deploy.py`
- **`Full workflow vtyt web.docx`** — bỏ "khoa chốt danh mục", thêm vòng xác
  nhận. 43 điều khoản không còn khớp mã nguồn; phải sửa docx hoặc ghi phụ lục,
  nếu không vòng test sau lại báo thiếu điều khoản.

---

## 4. Ba chỗ phải cẩn thận khi thi công

1. **D1 là chuyển nhà, không phải thêm cột.** Cột chữ đang nằm ở hai bảng với
   hai phạm vi khoá khác nhau (`danh_muc_khoa_o` theo khoa; `danh_muc_tong_hop_o`
   theo `goi_id` có hậu tố `:dot:N` — xem Lỗi 24). Gộp về một chỗ phải quyết
   trước: khi 2 khoa đang giữ 2 giá trị khác nhau thì lấy bản nào.
2. **Ô số của khoa và tổng phải nhất quán trong cùng một giao dịch.** Tổng là
   phép cộng, nên khoa sửa số phải đi qua RPC có advisory lock như
   `cap_nhat_tong_phan_bo_khoa`, đừng cho `update` thẳng vào bảng.
3. **Lỗi 24 vẫn còn nguyên bài học**: hai màn dùng `goi_id` khác phạm vi là lỗi
   im lặng, không có lỗi đỏ nào. Làm D1 thì rà lại mọi truy vấn chạm hai bảng ô.
