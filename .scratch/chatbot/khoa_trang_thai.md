# Khoá trạng thái chatbot cần

Tài liệu này dành cho agent xây hook tiến trình và agent xây chatbot. Mỗi khoá có mặt trong `cau_hoi.json`, ở trường `khi` của biến thể hoặc trong chỗ trống `{...}` của câu trả lời.

**Đã có sẵn một phần.** `frontend/src/lib/useTienTrinh.js` và `frontend/src/lib/tienTrinh.js` đã tải và tính gần hết trạng thái. Tôi đặt tên khoá **theo đúng tên trường ở đó** khi có sẵn. Cột "Nguồn" ghi `CÓ SẴN` nếu hook đã trả về trường đó, và `MỚI` nếu hook chưa có.

## Luật chung

1. **`null` / `undefined` nghĩa là "chưa rõ"** (quy ước ở đầu `useTienTrinh.js:11-12`). Một điều kiện dính vào khoá chưa rõ thì coi là **SAI**, và chatbot rơi về `tra_loi` gốc. Không đoán thay.
2. Xét biến thể theo thứ tự từ trên xuống. Gặp điều kiện đúng đầu tiên thì dùng câu đó.
3. Ngữ cảnh (`ctx.*`) gắn với **màn người dùng đang đứng**, gồm gói, gói con và đợt. Khoa không đứng ở màn nào gắn với đợt (ví dụ đang ở Nghiệp vụ dùng chung) thì mọi `khoa.*` theo đợt đều là chưa rõ.
4. `tinhTienTrinhKhoa()` đã trả `viecTiepTheo`, một câu "việc tiếp theo" tính sẵn (`tienTrinh.js:196-208`). Agent chatbot có thể dùng câu này thay cho biến thể của `k_tiep_goc` nếu muốn một nguồn duy nhất. Hai bộ câu hiện nói cùng một luật.

## Ngữ cảnh: `ctx.*`

| Khoá | Kiểu | Nghĩa | Nguồn | Dùng ở nút |
|---|---|---|---|---|
| `ctx.laPdd` | bool | Vai trò là `admin` hoặc `dieu_duong` | MỚI · `App.jsx:98` | k_loi_he_thong |
| `ctx.goi` | `dau_thau_rong_rai` \| `mua_sam_bo_sung` \| `chi_dinh_thau` | Gói đang mở trên menu | MỚI · `chon.goi` (`App.jsx:85`) | điều hướng |
| `ctx.goiCon` / `ctx.goiId` | chuỗi, vd `18t-gmhs`, `bs-t9` | Gói con. **Phải là khoá thật** (`bs-t9`), không được là bí danh `bo-sung` | MỚI · `chon.goiCon`; `lib/cotChuan.js:183-232` | điều hướng |
| `ctx.dotId` | số | Đợt đang chọn | MỚI · `dotDung.id` (`Function1.jsx:479-481`) | điều hướng |
| `ctx.dotDangMo` | bool | Gói đang xem có ít nhất một đợt `trang_thai = 'mo'` | MỚI · `useDotDangMo().theoGoi[goi]` (`KhungGoiThau.jsx:148-160`) | k_tiep_goc, k_dx_nut_gui |
| `ctx.loiDocDot` | bool | Menu đang ghi "Không đọc được trạng thái" | MỚI · `useDotDangMo().loi` khác rỗng mà không có đợt mở (`KhungGoiThau.jsx:242`) | k_tiep_chua_mo_dot |
| `ctx.soDotHopLe` | số | Số đợt hợp lệ cho gói con đang đứng (bổ sung lọc theo tháng mốc) | MỚI · `dsDotHopLe.length` (`Function1.jsx:469-475`) | k_dx_nut_gui |
| `ctx.dotDaChon` | bool | Đã chọn đợt ở ô "— Chọn đợt gửi đề xuất —" (hoặc chỉ có một đợt nên hệ tự lấy) | MỚI · `!!dotDung` (`Function1.jsx:479-481`) | k_dx_nut_gui |

## Khoa: `khoa.*`, theo một DOT_GOI (đợt × gói con)

| Khoá | Kiểu | Nghĩa | Nguồn | Dùng ở nút |
|---|---|---|---|---|
| `khoa.daGui` | bool\|null | Khoa có `phan_bo_khoa.so_luong_hien_hanh > 0` trong DOT_GOI | CÓ SẴN · `taiTrangThaiKhoa().daGui` (`useTienTrinh.js:79`) | k_tiep_goc, k_tiep_khong_nhu_cau |
| `khoa.daXacNhan` | bool\|null | `xacNhan?.hieu_luc === true` | CÓ SẴN (dẫn xuất) · `xacNhan` (`useTienTrinh.js:81`); cùng luật `DanhMucDeXuatKhoa.jsx:511` | k_tiep_goc, k_xn_la_gi, k_xn_nut_mo |
| `khoa.xacNhanHetHieuLuc` | bool\|null | Đã có dòng xác nhận nhưng `hieu_luc = false`, tức bị huỷ vì khoa tự sửa | CÓ SẴN (dẫn xuất) · `xacNhan && xacNhan.hieu_luc === false` | k_tiep_goc, k_xn_lan_2 |
| `khoa.lanXacNhan` | số | `xacNhan.lan` | CÓ SẴN | k_tiep_goc, k_xn_* |
| `khoa.lanXacNhanKe` | số | Số lần hiện trên nút: còn hiệu lực thì `lan`, hết hiệu lực thì `lan + 1`, chưa có dòng thì `1` | CÓ SẴN (dẫn xuất) · luật `DanhMucDeXuatKhoa.jsx:513` | k_tiep_goc, k_xn_lan_2 |
| `khoa.lyDoHuyXacNhan` | chuỗi | `danh_muc_khoa_chot.huy_do`, **qua `thayTenCot()`** để ra tên cột người dùng thấy | MỚI · hook chưa select `huy_do` (`useTienTrinh.js:49`); màn đọc ở `DanhMucDeXuatKhoa.jsx:468-469, 1131` | k_xn_lan_2 |
| `khoa.xacNhanLuc` | ngày giờ vi-VN | `danh_muc_khoa_chot.chot_luc` | MỚI · như trên | k_xn_nut_mo |
| `khoa.coPhienQ` | bool\|null | PĐD đã chốt số đi thầu (`chot_q_phien.hieu_luc`) | CÓ SẴN · `useTienTrinh.js:82` | k_tiep_goc, k_dx_sua_sau_gui |
| `khoa.coPhienTrinhKy` | bool\|null | DOT_GOI có `chot_trinh_ky_phien_v3.hieu_luc = true` | MỚI · cùng truy vấn `CumThauTongHop.jsx:797-798`. ⚠ Chưa kiểm RLS cho vai `dvsd` đọc bảng này | k_tiep_goc, k_th_kich_hoat_30 |
| `khoa.giaiDoan` | mảng | Các dòng `giai_doan_thau_v3` | CÓ SẴN · `useTienTrinh.js:83` | (qua `viecTiepTheo`) |
| `khoa.soMaRot` | số\|null | Số mã hàng khác nhau có `ket_qua = 'khong_trung'` | CÓ SẴN · `useTienTrinh.js:84` | k_th_nhan_rot |
| `khoa.soMaTrongGio` | số\|null | Số mã hàng trong `gio_nhap.noi_dung` có `soLuong > 0` | CÓ SẴN khi gọi `docGio: true` (`useTienTrinh.js:67-77`) | k_tiep_goc, k_dx_gio_o_dau, k_dx_nut_gui |
| `khoa.soMaQuanLyTrongGio` | số | Số `ma_quan_ly` khác nhau trong giỏ, đúng con số trên nút "Gửi N mã quản lý" | MỚI · đếm `nd.ma_quan_ly` trong cùng `noi_dung` | k_dx_gio_o_dau |
| `khoa.soMaRotMoi` | số | Số thông báo `thong_bao` có `pham_vi='khoa'` và `loai='ma_rot_ve_khoa'`, đúng số trên nhãn đỏ ở Gói bổ sung | MỚI · cùng truy vấn `KhungGoiThau.jsx:180-182`. **Không theo đợt**: đây là số thông báo chưa xem, về 0 khi khoa bấm "Đã xem", dù mã vẫn còn trong giỏ | k_tiep_goc, k_th_ma_rot_di_dau |
| `khoa.soMaTrenDanhMuc` | số | Số dòng mã trên Danh mục đề xuất của khoa (`rows.length`) | MỚI · `DanhMucDeXuatKhoa.jsx:1021`. Cách rẻ hơn là đếm `phan_bo_khoa` của khoa trong DOT_GOI, **kể cả dòng số 0** | k_xn_nut_mo |
| `khoa.soLanPddDieuChinh` | số | Số lần PĐD sửa số của khoa: dòng `phan_bo_khoa_audit` có khoa trong `sau` và người sửa là PĐD | MỚI · `DanhMucDeXuatKhoa.jsx:681-695` | k_xn_pdd_sua |

## PĐD: `pdd.*`, theo một DOT_GOI

| Khoá | Kiểu | Nghĩa | Nguồn | Dùng ở nút |
|---|---|---|---|---|
| `pdd.khoaChuaXacNhan` | string[]\|null | Kết quả RPC `khoa_chua_xac_nhan`, chính là cổng chặn nút "Chốt số đi thầu" | CÓ SẴN · `taiTrangThaiPddTheoDot` (`useTienTrinh.js:211-212`); `TongHopPdd.jsx:456-457` | p_tiep_goc, p_q_nut_mo, p_tiep_nhac_khoa |
| `pdd.khoaDaGui` | string[]\|null | Khoa **tham gia** đã gửi thật | CÓ SẴN · `dauVaoPdd` (`useTienTrinh.js:160-167`) | p_tiep_goc |
| `pdd.soKhoaThamGia` | số\|null | Số khoa `dot_goi_khoa.tham_gia` | CÓ SẴN | (chưa dùng) |
| `pdd.coPhienQ` | bool\|null | Đã chốt số đi thầu | CÓ SẴN | p_tiep_goc, p_q_*, p_th_giai_doan |
| `pdd.revisionQ` | số | `chot_q_phien.revision`, hiện là "bản chốt số N" trên băng | MỚI · `TongHopPdd.jsx:465-467, 1217` | p_q_nut_mo |
| `pdd.giaiDoan` | mảng | Ba dòng `giai_doan_thau_v3` | CÓ SẴN | (dẫn xuất hai khoá dưới) |
| `pdd.giaiDoanDangChay` | chuỗi\|null | **Nhãn** của giai đoạn đang `dang_thuc_hien`: "Chào giá" / "Mở thầu" / "Đánh giá" | CÓ SẴN (dẫn xuất) · `CumThauTongHop.jsx:116-119`; nhãn ở `tienTrinh.js:27-30` | p_tiep_goc |
| `pdd.baGiaiDoanXong` | bool | Cả ba giai đoạn `hoan_thanh` | CÓ SẴN (dẫn xuất) | p_tiep_goc, p_tk_khi_nao |
| `pdd.coPhienTrinhKy` | bool\|null | Đã chốt trình ký | CÓ SẴN | p_tiep_goc, p_tk_khi_nao |
| `pdd.revisionTrinhKy` | số | `chot_trinh_ky_phien_v3.revision` | MỚI · `CumThauTongHop.jsx:797-798, 867` | p_tk_khi_nao |
| `pdd.soMaChuaChiaDu` | số | Số mã có `phanBo.da_khop = false`, đúng số trên băng vàng đầu bảng Tổng hợp | MỚI · `TongHopPdd.jsx:547-550`, dữ liệu từ `useDuLieuThau` | p_tiep_goc, p_th_chia |
| `pdd.soChuaChia` | số | Như trên nhưng **chỉ tính mã còn phần rớt chưa xử lý**, là điều kiện ẩn nút "Xác nhận rớt" | MỚI · `CumThauTongHop.jsx:125-128` | p_tiep_goc, p_th_xac_nhan_rot |
| `pdd.tongRotChuaXuLy` | số | Tổng số lượng rớt chưa đổ đi đâu, là số trong ngoặc của "Xác nhận rớt (N)" | MỚI · `CumThauTongHop.jsx:120-123` | p_tiep_goc, p_th_xac_nhan_rot |
| `pdd.rotTrongGio.soMa` / `.soKhoa` | số | Mã rớt đã vào giỏ khoa mà khoa chưa gửi, tính theo **đợt gốc** | MỚI · view `v_ma_rot_trong_gio_v3` (`BanDieuHanhPdd.jsx:354-357`), gom ở `189-202` | p_tiep_goc, p_td_rot_trong_gio |

> **Lưu ý hai số "chưa chia".** `soMaChuaChiaDu` là số trên băng đầu bảng. `soChuaChia` là số trên dải giai đoạn. Hai số có thể khác nhau, vì cái sau chỉ đếm mã còn rớt chưa xử lý. Hãy giữ đúng hai khoá, đừng gộp làm một.
