# Khoá màn trong `di_toi.man`

App điều hướng bằng hai cách. Nguồn là `frontend/src/App.jsx`.

1. **State `chon = { nhom, man, goi?, goiCon?, dotId? }`**, đổi bằng `setChon(...)` (`App.jsx:85`). Những màn này nằm trong khung menu.
2. **Hash** cho hai màn toàn trang dạng bảng: `#tong-hop-pdd/<goiId>/<dotId>` (`App.jsx:175-195`) và `#danh-muc-de-xuat/<goiId>/<khoa>/<dotId>` (`App.jsx:203-209`). Mọi nút có sẵn trong app mở hai màn này **ở TAB MỚI** qua `lib/moManExcel.js:28-43` (`window.open` có đặt tên cửa sổ). Chatbot nên gọi đúng hai hàm `moTongHopPdd` / `moDanhMucDeXuat` để cư xử giống app.

⚠ Để gọi `setChon`, chatbot phải được `App.jsx` truyền `setChon` vào. Hiện `App` đưa `setChon` thẳng cho `KhungGoiThau`, `TrangDungChung` và `ChoDuyet` (`App.jsx:245, 284, 358`). Các màn khác chỉ nhận callback bọc sẵn.

⚠ **Số dòng có thể lệch.** Lúc tôi soạn (18/09, khoảng 11:00), một agent khác đang sửa `Function1.jsx`, `TongHopPdd.jsx` và `BanDieuHanhPdd.jsx` để gắn thanh tiến trình. Tôi đã dò lại số dòng của ba file này lúc 11:08. Nếu lệch nữa thì grep theo nhãn nút ghi trong bảng.

## Khoá dùng trong `cau_hoi.json`

| Khoá màn | Cách đi | Tham số cần | Căn cứ | Ghi chú |
|---|---|---|---|---|
| `khoa.de_xuat_so_luong` | `setChon({ nhom: "goi", goi: ctx.goi, goiCon: ctx.goiCon, man: "de_xuat", dotId: ctx.dotId })` | `goi`, `goiCon` (gói 18 tháng bắt buộc có gói con), `dotId` tuỳ chọn | `App.jsx:360-363`; nút gói con `KhungGoiThau.jsx:260-266` | Không có `goiCon` thì nên mở gói ở menu (`KhungGoiThau.jsx:216`) và nói khoa chọn gói con |
| `khoa.bo_sung_de_xuat` | `setChon({ nhom: "goi", goi: "mua_sam_bo_sung", goiCon: "bs-t<tháng>", man: "de_xuat", dotId })` | `dotId`; `goiCon` suy từ `thang_moc` của đợt | `App.jsx:250-255, 276-278` (hai chỗ app đã tự nhảy như vậy, **không** truyền `goiCon`); `Function1.jsx:466-475` | Không truyền `goiCon` thì màn nhận `dotIdKhoiTao` và vẫn chạy, giống `App.jsx:276-278` |
| `khoa.danh_muc_de_xuat` | `moDanhMucDeXuat(goiId, khoa, dotId)` → `#danh-muc-de-xuat/<goiId>/<khoa>/<dotId>` | `goiId` **phải là khoá gói con thật** (`18t-…` hoặc `bs-t1/t5/t9`, không phải `bo-sung`), `khoa`, `dotId` | `lib/moManExcel.js:34-38`; `App.jsx:203-209`; bẫy bí danh ở `lib/cotChuan.js:213-232`, `DanhMucDeXuatLinks.jsx:60-63` | Thiếu `dotId` thì màn rơi về đường cũ và hiện 0 mã (`Function1.jsx:1646-1651`). **Thiếu tham số thì dùng `khoa.danh_sach_danh_muc`** |
| `khoa.danh_sach_danh_muc` | `setChon({ nhom: "goi", goi: ctx.goi, goiCon: null, man: "danh_muc_khoa" })` | `goi` | `App.jsx:375-376`; `KhungGoiThau.jsx:207-209` | Danh sách các kỳ, mỗi dòng có nút "Mở". Đây là đích dự phòng an toàn cho `khoa.danh_muc_de_xuat` |
| `chung.tuy_chon_mua_them` | `setChon({ nhom: "tuy_chon_mua_them", man: "tuy_chon_mua_them" })` | — | `App.jsx:381-382`; `KhungGoiThau.jsx:346-349` | |
| `pdd.ban_dieu_hanh` | `setChon({ nhom: "chung", man: "ban_dieu_hanh" })` | — | `App.jsx:237-243`; `KhungGoiThau.jsx:325-328` | Chỉ PĐD. PĐD đăng nhập là vào thẳng màn này (`App.jsx:104-109`) |
| `pdd.tong_hop` | `moTongHopPdd(goiId, dotId)` → `#tong-hop-pdd/<goiId>/<dotId>` | `goiId` (gói con thật), `dotId` | `lib/moManExcel.js:40-43`; `App.jsx:175-195`; `BanDieuHanhPdd.jsx:768-785` | Thiếu tham số thì đi `pdd.ban_dieu_hanh`. Thiếu `goiId` thì App tự rơi về `18t-dung-chung` (`App.jsx:192`), có thể mở **nhầm gói** |
| `pdd.chuyen_tiep` | `setChon({ nhom: "chung", man: "chuyentiep" })` | — | `App.jsx:261`; `KhungGoiThau.jsx:382-391` | Chỉ PĐD |

## Khoá dự phòng (có trong App, nội dung hiện chưa dùng)

| Khoá | Cách đi | Căn cứ |
|---|---|---|
| `chung.tong_quan` | `setChon({ nhom: "chung", man: "tongquan" })` | `App.jsx:244-245` |
| `chung.gio_rot` | `setChon({ nhom: "chung", man: "giorot" })` | `App.jsx:271-280`, xem câu hỏi Q6 trong `can_xac_nhan.md` |
| `pdd.ket_qua_thau` | `setChon({ nhom: "chung", man: "ketquathau" })` | `App.jsx:260`; `KhungGoiThau.jsx:371-380` |
| `pdd.quan_ly_dot` | `setChon({ nhom: "chung", man: "quanlydot" })` | `App.jsx:266` |
| `pdd.cho_duyet` | `setChon({ nhom: "chung", man: "choduyet" })` | `App.jsx:281-286, 327` |
| `pdd.danh_muc_khoa` | `moDanhMucDeXuat(goiId, khoa, dotId)` với khoa bất kỳ (PĐD xem thay) | `BanDieuHanhPdd.jsx:653-665` |

## Đích TRONG trang: đã có sẵn, do thanh tiến trình dựng

`components/ThanhTienTrinh.jsx:137` có sẵn hàm `diToiPhanTu(id)`: cuộn tới một phần tử và nháy viền 1,5 giây. Chatbot có thể dùng lại hàm này khi người dùng **đang đứng đúng màn**. Có thể đặt khoá dạng `trong_trang.<id>`.

| id | Ở đâu | Dùng cho nút chatbot |
|---|---|---|
| `f1-tim-nhom` | Ô tìm nhóm, màn Đề xuất số lượng (`Function1.jsx:1671`) | k_dx_bat_dau, k_dx_khong_thay_ma |
| `th-nut-chot-q` | Nút "Chốt số đi thầu" / "Mở chốt để sửa" (`TongHopPdd.jsx:1172`) | p_q_nut_mo, p_q_sua_sau_chot |
| `th-giai-doan-thau` | Dải giai đoạn thầu, nút Xác nhận rớt, Chốt trình ký (`TongHopPdd.jsx:1069`) | p_th_giai_doan, p_th_xac_nhan_rot, p_tk_khi_nao |
| `th-dai-trang-thai` | Băng trạng thái đầu bảng, gồm danh sách khoa chưa xác nhận (`TongHopPdd.jsx:1195`) | p_q_nut_mo, p_tiep_nhac_khoa |

Mở ngăn giỏ **từ bên trong** `Function1` thì làm được: thanh tiến trình gọi `setMoGio(true)` (`Function1.jsx:1355`). Từ chatbot thì phải được `Function1` truyền callback ra.

## Không phải màn, nên để `di_toi: null`

| Thứ | Vì sao | Chatbot nên nói |
|---|---|---|
| Ngăn "Giỏ đề xuất" | `moGio` là state riêng của `Function1` (`Function1.jsx:1488-1491`), không mở được từ ngoài | Đi `khoa.de_xuat_so_luong`, rồi bảo "bấm nút tròn hình giỏ hàng góc trên bên phải" |
| Hộp thư (chuông) | State riêng của `HopThuThongBao` (`App.jsx:347`) | "Bấm chuông trên thanh trên cùng" |
| Menu "Ẩn/khóa cột" | State riêng của `DanhMucDeXuatKhoa` | Chỉ tên nút |

⚠ **Vị trí bong bóng.** Góc dưới bên phải đang có khung thông báo `ThongBaoChamTienDo`, `fixed bottom-4 right-4 z-50` rộng `w-80` (`App.jsx:396-401`). Nút giỏ nằm ở `right-6 top-20` (`Function1.jsx:1490`), không đụng. Hai màn toàn trang Tổng hợp và Danh mục đề xuất là `fixed inset-0`, nên bong bóng phải có `z-index` cao hơn màn đó thì mới hiện trên màn.
