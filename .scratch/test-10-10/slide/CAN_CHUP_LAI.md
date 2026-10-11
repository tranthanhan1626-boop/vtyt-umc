# Ảnh cần chụp lại cho slide (11/10/2026)

> **CẬP NHẬT 11/10 (chặng 4): ĐÃ CHỤP LẠI** khoa_09, khoa_21, khoa_22, pdd_04, pdd_05, pdd_06, pdd_08, pdd_09, pdd_10, pdd_15, pdd_17, pdd_18, pdd_20, pdd_23, pdd_24, pdd_25, pdd_26, pdd_27, pdd_28, pdd_31, pdd_32, pdd_34, pdd_35, pdd_44 bằng web index-DGTpMIHI.js, dùng gói con Tim mạch (đợt 209). Ảnh cũ ở `anh/_cu/`. **Còn để ảnh cũ:** khoa_31 (lỗi L11 nằm ở DB, chưa sửa). Chi tiết ở SO_CHUNG mục 6 "Chặng 4". Slide đã dựng lại, toạ độ khung cam đã chỉnh, `kiem_tra.py` = 0 lỗi. Bảng dưới là danh sách gốc (lịch sử).


Các ảnh dưới đây được chụp lúc web còn lỗi (đã sửa ở chặng 3). Slide đang **tạm dùng ảnh cũ**.
Chụp lại xong thì **ghi đè đúng tên file** trong `.scratch/test-10-10/anh/` (1440×900, cách chụp như
SO_CHUNG mục 2 điều 5), rồi chạy lại:

```bash
cd "/Users/tranhien/Downloads/0. Collapse with Claude/9.vtyt"
.scratch/test-10-10/slide/.venv/bin/python .scratch/test-10-10/slide/dung_slide.py
.scratch/test-10-10/slide/xem_thu.sh          # ảnh xem thử ra .scratch/test-10-10/slide/xem/
```

Nếu bố cục màn mới lệch so với ảnh cũ thì phải sửa toạ độ khung cam (pixel trên ảnh 1440×900) ở
đoạn `TRANG <số>` trong `dung_slide.py`.

| Trang | File ảnh | Lỗi trên ảnh cũ | Cần chụp màn gì, ở trạng thái nào | Khung cam đang khoanh (px) |
|---|---|---|---|---|
| 9 — Xem giỏ và gửi | `khoa_09_da_gui_de_xuat.png` | L7: ngăn kéo giỏ không tự đóng sau khi gửi | Khoa (vd dvsd1), màn Đề xuất số lượng của một gói con **ngay sau khi bấm "Gửi đề xuất (N nhóm)"**: ngăn giỏ đã đóng, thanh bước sang "Xác nhận", dải đáy "Đã gửi N nhóm vào đợt…". Cần một gói con còn gửi được (vd đợt bổ sung T1/2027 hoặc đợt mới sau khi dọn) | ④ thanh bước (587,145)-(713,196); ⑤ dải đáy (528,846)-(985,872) |
| 13 — Có mã rớt thầu | `khoa_21_menu_goi_bo_sung_nhan_do_5_ma_rot.png` | L10/L14/L15: nhãn đỏ menu đếm sai, thẻ "Mã rớt cần xử lý" đếm thiếu | Khoa dvsd1, **Trang chính**, ngay sau khi PĐD bấm "Xác nhận rớt", khi khoa **chưa xử lý mục nào**: nhãn đỏ "N mã rớt" ở menu Gói bổ sung, bước 5 "Kết quả thầu" của gói con đang chọn, chuông có số. Số trên nhãn phải bằng "Chưa xử lý" ở màn ③ Mã rớt (cùng lúc chụp `khoa_22` để hai số khớp) | ① menu Gói bổ sung (40,322)-(272,388); ② chuông (1268,22)-(1308,52); ③ ô bước 5 (1203,357)-(1398,402) |
| 15 — Danh mục sau thầu, hộp thư | `khoa_31_hop_thu_khoa_ma_rot_do_ma.png` | L11: thư ghi "nay là 0" khi PĐD chỉ đổ một phần | Khoa dvsd1, mở **chuông** (hộp thư khoa) có thư "số của khoa chuyển sang mã …" **sau khi chạy patch L11** (thư mới phải ghi "nay còn <số còn lại>"). Lưu ý: patch L11 chưa chạy → thư cũ trong DB vẫn ghi "nay là 0"; phải có một lần PĐD đổ một phần MỚI sau khi chạy patch | ④ chuông (1268,22)-(1308,52); ⑤ khung thư (895,100)-(1307,285) |
| 19 — Xem từng khoa | `pdd_08_so_xuong_xem_tung_khoa.png` | L2: mọi dòng gắn nhãn "1 khoa tự sửa" dù khoa không sửa | PĐD, Danh mục tổng hợp gói con có ≥1 khoa gửi, "Cách xem: Theo việc đang làm", **bấm mũi tên đầu một dòng** để bảng con "từng khoa" mở ra. Nhãn "khoa tự sửa" chỉ còn ở dòng bị sửa thật | ① mũi tên (3,388)-(32,412); ② bảng con (40,440)-(815,548) |
| 20 — Chốt số, bắt đầu Chào giá | `pdd_10_da_chot_so_di_thau_cho_bat_dau_chao_gia.png` | L2 (nhãn "1 khoa tự sửa" ở mọi dòng cột Tổng đề xuất) | PĐD, Danh mục tổng hợp **ngay sau khi bấm "Chốt số đi thầu"**, chưa bấm "Bắt đầu Chào giá": nhãn "Đã chốt số đi thầu · bản số 1", nút "Bắt đầu Chào giá", cụm cột KẾT QUẢ ĐẤU THẦU. Cắt đáy 120 px | ① nhãn chốt (218,154)-(585,175); ② nút (486,184)-(652,218); ③ cụm cột (790,230)-(1420,318) |
| 28 — Mua thêm 30%, tiến độ sử dụng | `pdd_44_tien_do_su_dung_sau_chot_trinh_ky.png` | L13: dòng gói con ghi "Hàng về 11/10/2026" (thật ra là ngày chốt trình ký) | PĐD, Nghiệp vụ dùng chung → **Tiến độ sử dụng**, sau khi có ≥1 gói con chốt trình ký: mỗi dòng nay ghi "Mốc tạm (chưa có giao hàng): ngày chốt trình ký …" (đã có ảnh tham khảo `xem/sua_L13_tien_do.png` của trợ lý sửa, nhưng chưa đúng khổ 1440×900 của bộ ảnh). Cắt đáy 150 px | ③ chữ cam kết (308,162)-(1066,182); ④ ô lọc (528,197)-(695,227); ⑤ menu Tiến độ sử dụng (38,557)-(270,596) |

## Ảnh khác nên xem lại khi chụp (không có dấu `*` trong dàn, nhưng ảnh cũng chụp trước khi sửa)

Các ảnh này slide đang dùng và **không khoanh vào chỗ lỗi**, nhưng trong ảnh vẫn thấy dấu vết lỗi cũ.
Chụp lại được thì tốt; không thì để nguyên.

| Trang | File | Dấu vết lỗi còn thấy trong ảnh |
|---|---|---|
| 13 | `khoa_22_ma_rot_gio_rot_co_ten_vat_tu.png` | Phải chụp cùng lúc với `khoa_21` để số "Chưa xử lý" khớp nhãn đỏ |
| 17 | `pdd_04_…`, `pdd_05_…` | Chụp trước L1 (gói Tim mạch "không phát sinh" chưa hiện ở ô ①/②) — không khoanh chỗ đó |
| 18, 20–25 | `pdd_06`, `pdd_09`, `pdd_17`, `pdd_18`, `pdd_20`, `pdd_23–28`, `pdd_31`, `pdd_32` | Nhãn vàng "1 khoa tự sửa" (L2) ở mọi dòng cột Tổng đề xuất — chữ nhỏ, không khoanh |
| 24 | `pdd_32_sau_xac_nhan_rot_thong_bao_da_vao_gio.png` | L17: dải xanh ghi "5 mã × 2 khoa" (nay là "6 dòng: 5 mã, 2 khoa") — slide có khoanh dải này nhưng chữ quá nhỏ để đọc; nếu chụp lại thì phải bấm "Xác nhận rớt" trên một gói con mới |
| 26 | `pdd_34_hoi_chot_trinh_ky_khi_chua_xac_nhan_rot.png` | L19: dòng cam "… còn N khoa chưa đủ" trong ô Chốt trình ký (nay là chữ trung tính) — muốn chụp lại phải có gói con CHƯA chốt trình ký |
| 29 | `pdd_15_hop_thu_khoa_vua_sua_so.png` | L4: "Khoa Khoa Ngoại thần kinh" (lặp chữ) |

Không dùng `khoa_27`, `khoa_28` (ảnh lỗi L12) — slide không có trang nào dùng hai ảnh này.
