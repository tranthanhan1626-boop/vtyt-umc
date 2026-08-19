# V2 — bỏ khoá ô theo duyệt, khoá theo chốt trình ký

Chốt với chủ dự án 19/08/2026, sau khi vá Lỗi 24. **THAY THẾ** các quyết định
1, 2, 3, 6 của `THIET_KE.md` (bản 19/08 sáng). Những phần khác của bản cũ
(ánh xạ cột, ngoại lệ `giai_trinh_2627`, cột SỐ đi đường `phan_bo_khoa`) giữ
nguyên.

Nguyên văn yêu cầu: *"PĐD chỉnh sửa rồi khoa chỉnh sửa nữa, đừng có PĐD xong là
khoá ô"* và *"ai sửa sau sẽ đè được thông tin, nhưng nếu PĐD duyệt thì không ai
sửa được nữa"* — với "duyệt" chốt lại là **chốt trình ký toàn bộ**, không phải
một nút duyệt riêng cho từng ô.

---

## 1. Luật mới, gọn trong 5 dòng

1. **Ai sửa sau đè.** Không còn khái niệm "ô đã duyệt thì khoá".
2. **PĐD sửa trên Tổng hợp → đè xuống mọi khoa.** Giữ nguyên đường link đã có.
3. **Khoa sửa lại → chỉ đè ô của khoa mình.** Không đụng khoa khác, không đụng
   bản Tổng hợp. Tổng hợp bật **cờ lệch** + **đếm ở đầu trang**.
4. **Chốt Q** → khoá cột SỐ, chặn khoa gửi thêm đề xuất.
   **Chốt trình ký toàn bộ** → khoá cột CHỮ, cả bảng đóng băng.
5. **Mở chốt trình ký = mở toàn bộ bảng** (RPC đã có). Ai sửa ô nào đã có
   `danh_muc_khoa_o_audit` / `danh_muc_tong_hop_o_audit` ghi lại.

Bỏ hẳn bước **"khoa chốt danh mục của mình"** — nút, cờ, và số đếm khoa chưa
chốt. Khoa báo xong việc qua Teams.

## 2. Vì sao bỏ khoá-theo-duyệt

Bản 19/08 sáng khoá ô ngay khi PĐD gõ, vì sợ 62 khoa mỗi khoa một TSKT thì hồ
sơ mời thầu không dùng được. Nhưng nó gộp hai việc khác nhau vào một thao tác:
*gõ để soạn* và *chốt để đóng*. Hệ quả là PĐD vừa gõ nửa chừng, chưa xác minh
xong với nhà thầu, thì khoa đã hết đường sửa.

V2 tách hai việc đó: gõ là gõ, đóng băng là `chot_trinh_ky_toan_bo_v3`. Nỗi lo
"62 khoa 62 kiểu TSKT" vẫn được xử — nhưng bằng **cờ lệch cho PĐD nhìn thấy**
chứ không bằng khoá tay khoa lại.

## 3. Việc phải làm

### Tầng DB

| # | Việc | Ghi chú |
|---|---|---|
| D1 | Gỡ `trg_z_khoa_o_khoa_khi_pdd_da_duyet` + hàm của nó | patch_zzzzp mục 3 — hết lý do tồn tại |
| D2 | Gỡ `trg_chan_o_khoa_da_chot` + `fn_chan_o_khoa_da_chot` | patch_zs mục 4b — bỏ bước khoa chốt |
| D3 | Thêm `fn_khoa_o_khoa_sau_chot_trinh_ky` | đối xứng `fn_khoa_o_tong_hop_sau_chot_q`; nhớ `danh_muc_khoa_o` KHÔNG mang `dot_goi_id`, phải so qua `goi_id` như D5 |
| D4 | Chuyển chặn gửi thêm đề xuất từ `danh_muc_khoa_chot` sang `chot_q_phien` | patch_zzzzm |
| D5 | `so_khoa_chua_chot` → đổi cách tính thành **số khoa tham gia mà chưa có dòng đề xuất nào** | giữ tên cột, đổi nghĩa; đó chính là con số cảnh báo ở F4 |
| D6 | Ngừng dùng `danh_muc_khoa_chot` (giữ bảng, chưa drop) | drop sau khi chạy thật ổn một kỳ |
| D7 | Thêm `danh_muc_khoa_o.sua_luc jsonb` (cột → thời điểm sửa) | **bắt buộc** cho luật "ai sửa sau đè": bảng lưu cả dòng trong một JSONB, chỉ có `updated_at` cho CẢ DÒNG nên không biết được từng ô sửa lúc nào |

### Tầng giao diện

| # | Việc |
|---|---|
| F1 | `DanhMucDeXuatKhoa`: ô PĐD đã sửa **bỏ `readonly`**, giữ viền tím + nhãn đổi thành "PĐD đã sửa" (không phải "PĐD duyệt"). So `sua_luc` với `danh_muc_tong_hop_o.updated_at` để biết hiện giá trị nào |
| F2 | Bỏ nút "Chốt danh mục" và "Mở lại để sửa" bên khoa |
| F3 | `TongHopPdd`: cờ lệch trên ô + đếm "N ô có khoa gõ khác bản đi thầu" ở đầu trang |
| F4 | Hộp xác nhận trước khi chốt: liệt kê tên khoa chưa gửi đề xuất, vẫn cho chốt |
| F5 | `BanDieuHanhPdd`: bỏ cột "khoa chưa chốt", thay bằng "khoa chưa gửi đề xuất" |
| F6 | Excel khoa lấy giá trị bản Tổng hợp khi ô đó PĐD có sửa |

### Phải rà lại

- `test_so_chot_contract.py`, `test_chot_q_v3_contract.py`,
  `test_pdd_duyet_o_chu_contract.py` (10 test viết cho luật cũ — sẽ đỏ)
- `smoke_workflow_v3_staging.py`, `kiem_truoc_deploy.py`
- **`Full workflow vtyt web.docx`** — 43 điều khoản có nhắc "khoa chốt danh
  mục". Bỏ bước này nghĩa là văn bản gốc không còn khớp mã nguồn. Phải sửa docx
  hoặc ghi phụ lục, nếu không lần test sau lại báo "thiếu điều khoản".

## 4. Điểm chưa nhất quán — cần biết trước khi làm

Chủ dự án chốt "Excel khoa **luôn lấy giá trị PĐD**" (F6) từ vòng hỏi khi mô
hình còn là "PĐD là chân lý". Sang luật "ai sửa sau đè" thì sinh ra chuyện:
khoa gõ sau PĐD → **màn hình khoa hiện giá trị khoa, file Excel khoa in ra giá
trị PĐD**. Khoa sẽ hỏi vì sao hai cái khác nhau.

Đề nghị xử: giữ đúng F6 (file phải khớp bản đi thầu — đó là mục IX.2), nhưng
lúc bấm xuất Excel thì hiện cảnh báo *"N ô của khoa đang khác bản đi thầu; file
này in theo bản đi thầu"*. Chưa hỏi lại chủ dự án điểm này.
