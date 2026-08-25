# Kế hoạch test toàn bộ web VTYT — chạy ở localhost

Lập **25/08/2026**. Người lập chỉ **lập kế hoạch**, không sửa code, không chạy
test. Mọi con số dữ liệu trong file này **đo thật trên staging
`ihgfafubwyxnbubmppbj`** lúc lập kế hoạch, không phải ước lượng.

Đọc hết mục 0 trước khi bấm gì. Mục 0 quyết định bạn được làm bẩn cái nào.

---

## 0. Luật chơi

### 0.1 Chạy web

```bash
cd /Users/tranhien/Downloads/9.vtyt/frontend
npm run build && npm run preview        # → http://localhost:4173
```

| Vai | Email | Mật khẩu | Khoa |
|---|---|---|---|
| PĐD | `pdd@umc.edu.vn` | `111111` | Phòng Điều dưỡng |
| Khoa 1 | `dvsd1@umc.edu.vn` | `111111` | Khoa GMHS - Phòng mổ |
| Khoa 2 | `dvsd2@umc.edu.vn` | `111111` | Khoa Phẫu thuật hàm mặt răng hàm mặt |
| Khoa 3 | `dvsd3@umc.edu.vn` | `111111` | Khoa Ngoại thần kinh |

**Ba điều bắt buộc, sai một là kết luận sai:**

1. **Không dùng `npm run dev`.** Bản dev bật `React.StrictMode` nên gọi mọi truy
   vấn hai lần — mọi số đo bị thổi gấp đôi, và một số lỗi "gọi hai lần" chỉ có ở
   dev chứ không có ở bản thật.
2. **Không dùng Netlify.** Tài khoản hết credits build tháng này; push không làm
   site đổi. Database thì không liên quan — patch chạy thẳng lên staging.
3. **Build lại + tải lại bỏ qua cache trước mỗi vòng đo.** `preview` phục vụ
   `dist/` đã build. Kiểm nhanh trong console:
   ```js
   [...document.querySelectorAll('script[src]')].map(s => s.src)
   ```
   phải trùng tên với `ls frontend/dist/assets/index-*.js`.

Ba vai chạy song song thì dùng **ba cửa sổ trình duyệt tách hồ sơ** (hoặc
private window), không dùng ba tab cùng hồ sơ — Supabase giữ session trong
`localStorage` chung theo origin, ba tab cùng hồ sơ là **cùng một người đăng
nhập**.

### 0.2 Bản đồ dữ liệu đang có trên staging

Đo thật lúc lập kế hoạch. `dgid` là `dot_goi.id` — đơn vị workflow thật
(`DOT_GOI = Đợt × Gói con`).

| Đợt | Tên | dgid | Mã hàng | Khoa | Trạng thái |
|---|---|---|---|---|---|
| **#168** | TEST QUY MÔ THẬT **B** — chủ dự án tự bấm (năm 2030) | 680 Dùng chung · 681 GMHS · 682 RHM · 683 Tim mạch · 684 CTCH-NTK | 340 · 341 · 183 · 297 · 307 = **1.468** | 50 | **đã chốt Q · Chào giá đang mở · 0 dòng rớt** |
| **#169** | TEST QUY MÔ THẬT **B** — bổ sung T1/2030 | 690 | **120** | 50 | đã chốt Q · Chào giá đang mở |
| #166 | TEST QUY MÔ THẬT **A** (năm 2029) | 668–672 | ~1.586 | 50 | **đã đi hết pipeline tới chốt trình ký** |
| #167 | TEST QUY MÔ THẬT **A** — bổ sung T1/2029 | 678 | — | 50 | đã chốt trình ký |
| #118 | TEST ĐẦY ĐỦ (năm 2028) | 427–431 | ~323 | 50 | đã chốt Q, có 1 dòng rớt ở 427 |
| #69 | Mua sắm bổ sung T9/2026 | 230 | 3.070 dòng đề xuất | 60 | **CHƯA chốt Q — mở hẳn** |
| #101/#102/#103 | Bổ sung T1/2027 · T5/2027 · T9/2027 | 383 · 385 · 387 | **0** | 3 khoa test đã được gán | mở, rỗng |
| #68 | Gói rộng rãi 1/2027-6/2028 | 225–229 | 13 dòng ở 225 | 2 | rác cũ |

Cả ba tài khoản khoa test đều **có dòng thật trong bộ B** (ví dụ ở dgid 680:
GMHS 109 mã · RHM 97 mã · Ngoại thần kinh 105 mã), nên không phải đi tìm khoa
nào có dữ liệu.

### 0.3 Cái gì được làm bẩn, cái gì không

| Bộ | Được làm bẩn? | Dựng lại thế nào |
|---|---|---|
| **Bộ B (#168, #169)** | **Hạn chế.** Đây là bộ chủ dự án sẽ tự bấm | có script, ~28 s — xem dưới |
| Bộ A (#166, #167) | **Thoải mái** | cùng script, `--bo A` |
| #69 (dgid 230) | Được, nhưng **không có script dựng lại** | không có — sửa là sửa vĩnh viễn |
| #101/102/103 | Được | tự tạo lại bằng tay hoặc để nguyên |
| #118, #68 | Được | `tao_du_lieu_test_day_du.py` cho #118 |

```bash
cd /Users/tranhien/Downloads/9.vtyt/backend
set -a && . ./.env.local && . ../frontend/.env && set +a
.venv/bin/python scripts/tao_du_lieu_test_quy_mo_that.py --xac-nhan-staging --bo B
```

⚠️ **Script XOÁ rồi DỰNG LẠI.** Chạy xong, số đợt **đổi** (#168 → id mới) vì
`dot_de_xuat.id` là serial. Mọi hash `#tong-hop-pdd/18t-dung-chung/168` bạn đã
ghi lại sẽ trỏ vào chỗ trống. Sau khi dựng lại, lấy id mới bằng:

```bash
.venv/bin/python - <<'PY'
import os, psycopg
with psycopg.connect(os.environ['SUPABASE_STAGING_DB_URL']) as c, c.cursor() as cur:
    cur.execute("select id, ten from dot_de_xuat where ten like 'TEST QUY MÔ THẬT B%' order by id")
    print(cur.fetchall())
PY
```

### 0.4 🔴 BỐN CÁI KHÔNG ĐƯỢC BẤM

1. **Nút thùng rác "Dọn dữ liệu kiểm thử" ở vai PĐD.** PĐD xoá được dữ liệu
   workflow **toàn viện** — bấm nhầm là mất cả bộ A, bộ B, #118 và #69 cùng
   lúc. Ở vai khoa thì chỉ xoá khoa mình, vẫn nên tránh.
2. **"Mở chốt để sửa" (mở snapshot Q) trên bộ B** — trừ đúng bước 2.6 của kịch
   bản, và phải chốt lại ngay sau đó. Mở chốt Q làm mọi ô số của cả DOT_GOI mở
   ra và `chot_q_phien` cũ mất hiệu lực.
3. **"Xác nhận rớt"** trên bộ B trước khi đọc xong mục 3 — nó là cò **một
   chiều**: đẩy mã vào đợt bổ sung của 50 khoa và bắn thông báo đỏ. Không có nút
   hoàn tác.
4. **Đổi mật khẩu / vai trò tài khoản test** ở màn Quản trị người dùng.

### 0.5 Ghi kết quả ở đâu

Mỗi bước có mã (`A1`, `B3`…). Ghi vào một file
`.scratch/test-full-localhost/KET_QUA.md` theo mẫu:

```
| Mã | Kỳ vọng | Thấy thật | Đạt? | Ảnh/console |
```

Lỗi console (F12) phải chụp lại **nguyên văn**, đặc biệt mã Postgres
(`42703` = thiếu cột, `42P01` = thiếu bảng, `PGRST202` = thiếu RPC,
`PGRST116` = 0 dòng khi đòi 1). Ba mã đầu là lớp lỗi đã cắn dự án này bốn lần.

---

## 1. Danh sách đầy đủ chức năng đã build

`hash` trống nghĩa là màn nằm trong khung nav chính, đi bằng menu.
Cột "Dữ liệu" nói **hôm nay có gì để bấm**, đo thật trên staging.

### 1.1 Vai ĐVSD (khoa)

| # | Chức năng | Màn (file) | Đường vào | Dữ liệu |
|---|---|---|---|---|
| K1 | Đăng nhập · đăng ký · quên mật khẩu · đặt lại mật khẩu | `auth/Login`, `auth/DatLaiMatKhau` | `/` | ✅ 8 tài khoản |
| K2 | **Đề xuất số lượng** — chọn mã quản lý, chọn ĐVT chuẩn + hệ số, xem P50/P75/P90/P95/TSB, chốt tổng, phân bổ xuống mã hàng (khoá cứng 1), thêm vào giỏ, gửi giỏ | `Function1` | menu Gói 18 tháng / Gói bổ sung → *Đề xuất số lượng* | ✅ 1.367 nhóm KT · 141.623 dòng lịch sử HIS |
| K3 | Gợi ý số lượng (P50 chọn sẵn, không tự điền) | `GoiYSoLuong` (trong K2) | trong K2 | ✅ |
| K4 | Cảnh báo mã đã có ở đợt khác | `CanhBaoMaTrungDot` (trong K2) | trong K2 | ✅ (bộ B có mã nằm ở nhiều đợt) |
| K5 | **Đề xuất của tôi** — danh sách giỏ đã gửi, rút giỏ | `DeXuatCuaToi` | menu gói → *Đề xuất của tôi* | ✅ 38.024 dòng |
| K6 | **Danh mục đề xuất của khoa** (bảng Excel 30 cột) — sửa số, sửa cột chữ, cột giải trình, ghim/khoá cột, xem điều chỉnh của PĐD, xem nhãn kết quả thầu | `DanhMucDeXuatKhoa` | `#danh-muc-de-xuat/<goiId>/<khoa>/<dotId>` — **mở tab riêng** | ✅ 3.224 dòng ô khoa; bộ B: 521 ô ở dgid 680 |
| K7 | Trang liên kết Danh mục đề xuất theo đợt | `DanhMucDeXuatLinks` | menu gói → *Danh mục đề xuất của khoa* | ✅ |
| K8 | **Xác nhận thông tin đề xuất lần N** · chốt danh mục · "không phát sinh nhu cầu" | trong `DanhMucDeXuatKhoa` | K6 | ✅ 852 dòng `danh_muc_khoa_chot`; bộ B 50/50 khoa đã chốt lần 1 |
| K9 | **Cam kết của khoa** — sinh Word/Excel, soạn hồ sơ trực tuyến, lưu phiên bản | `XuatHoSo` + `HoSoTrucTuyen` | menu gói → *Cam kết của khoa* | ⚠️ `ho_so_cong_tac` = **0 dòng** — chỉ test được đường tạo mới |
| K10 | **Gói tùy chọn mua thêm 30%** — xem trần, kích hoạt | `GoiTuyChonMuaThem` | menu → *Gói tùy chọn mua thêm* | ✅ view có 12.145 dòng trần (từ bộ A đã chốt trình ký); ⚠️ 0 lần kích hoạt |
| K11 | **Giỏ rớt của khoa** — phần chưa được đáp ứng, đề xuất lại hay thôi | `GioRotCuaKhoa` | *Nghiệp vụ dùng chung* → *Giỏ rớt của khoa* | ✅ 1.730 dòng (bộ A) |
| K12 | Sổ thiếu hàng | `SoThieuHang` | *Nghiệp vụ dùng chung* | ❌ 0 dòng — xem mục 2 |
| K13 | Mã kỹ thuật khoa tự thêm (đề nghị mã quản lý mới) | `NhomKyThuatCuaKhoa` | *Nghiệp vụ dùng chung* | ❌ 0 dòng |
| K14 | Điều chỉnh tiêu chí kỹ thuật (khoa đề nghị) | `DieuChinhTieuChi` | nút *Điều chỉnh tiêu chí kỹ thuật* ở sidebar | ❌ 0 dòng |
| K15 | **Tiến độ sử dụng theo cam kết 20/50/80** + ngưỡng + toast cảnh báo chậm | `TienDoSuDung` · `NguongCamKet` · `ThongBaoChamTienDo` | sidebar → *Tiến độ sử dụng* | ⚠️ 15.889 dòng nhưng **100% mốc lấy từ ngày chốt trình ký** — xem mục 2 |
| K16 | Lịch sử hồ sơ đề xuất | `LichSuXuatHoSo` | sidebar → *Lịch sử hồ sơ đề xuất* | ❌ 0 dòng |
| K17 | **Hộp thư của khoa** (chuông) — nhận báo PĐD sửa, mã rớt về đợt bổ sung, số đã chuyển sang mã nào | `HopThuThongBao` | biểu tượng chuông thanh trên | ✅ 1.200 dòng `ma_rot_ve_khoa` + 415 `chuyen_ma` + 9 `pdd_sua` |
| K18 | **Badge đỏ ở Gói bổ sung** đếm mã rớt vừa chuyển tiếp về | `KhungGoiThau` | sidebar | ✅ (từ bộ A) |
| K19 | Chỉnh cỡ hiển thị | `components/ChinhCoHienThi` | thanh trên | ✅ |
| K20 | Dọn dữ liệu kiểm thử (khoa mình) | `QuanLyDuLieuTest` | thùng rác thanh trên | ⚠️ **đừng bấm** |
| K21 | Hub Nghiệp vụ dùng chung | `TrangDungChung` | sidebar → *Nghiệp vụ dùng chung* | ✅ |

### 1.2 Vai PĐD (= admin, cùng quyền)

| # | Chức năng | Màn (file) | Đường vào | Dữ liệu |
|---|---|---|---|---|
| P1 | **Bàn điều hành** — chọn đợt + gói con, 2 tab: *Theo dõi khoa* · *Phiếu đề nghị mua thầu*; dải nút mở bảng Tổng hợp từng gói con (tab mới); nút sinh template nhắc Teams | `BanDieuHanhPdd` | sidebar → *Bàn điều hành* | ✅ |
| P2 | **Danh mục tổng hợp = mặt bàn** — 30 cột chuẩn, sổ dòng theo khoa, sửa cột chữ (override + audit + khôi phục), sửa ô tổng → hệ chia theo tỉ lệ, sửa phân bổ theo khoa, khoá cột/khoá dòng, ẩn/hiện cột, chế độ gõ rớt, nội dung ô gọn/đầy đủ, xuất Excel nháp/chính thức | `TongHopPdd` | `#tong-hop-pdd/<goiId>/<dotId>` — **mở tab riêng** từ P1 | ✅ bộ B 1.468 mã |
| P3 | **Chốt / mở chốt số tham gia đấu thầu** (cổng cứng: mọi khoa đã gửi phải đã xác nhận) | trong `TongHopPdd` | nút *Chốt số đi thầu* | ✅ bộ B đã chốt |
| P4 | **Dải ba giai đoạn thầu** Chào giá → Mở thầu → Đánh giá, có nút chữ "▶ Bắt đầu" · "✓ Hoàn thành" · "mở lại (bắt buộc lý do)" | `CumThauTongHop` trong P2 | trên bảng Tổng hợp | ✅ 54 dòng `giai_doan_thau_v3` |
| P5 | **Ba ô rớt R1/R2/R3** trên dòng mã hàng, chỉ mở ô của giai đoạn đang chạy, lý do bắt buộc, khoá cứng 3 chặn ngay | `CumThauTongHop` | trên bảng Tổng hợp | ✅ (bộ B 0 dòng rớt — tự gõ) |
| P6 | "Rớt toàn bộ mã quản lý" (rải xuống mọi mã hàng) | RPC `rot_toan_bo_ma_quan_ly_v3` | trên bảng Tổng hợp | ✅ |
| P7 | **Cột "Đã chia"** + nút **Chia theo tỉ lệ Q** trên dòng | `CumThauTongHop` | trên bảng Tổng hợp | ✅ |
| P8 | **Bảng "Chia số trúng về khoa"** trong dòng sổ — cột *Đã đưa đi*, *Nhận từ mã rớt*, nút *Lưu tạm (còn thiếu N)* / *Xác nhận chia*, **phím tắt Enter/Shift+Enter/Esc/Ctrl+Enter** | `BangSoTrungTheoKhoa` trong `CumThauTongHop` | sổ dòng mã trên Tổng hợp | ✅ |
| P9 | **Đổ số rớt sang mã tương đương** (cùng mã quản lý, chặn lệch ĐVT, chặn khi chưa chia, chặn mã ngoài đợt), bỏ đổ kèm lý do | RPC `day_so_luong_rot_v3` | cột *Xử lý rớt* trên dòng | ✅ 415 dòng sổ (bộ A) |
| P10 | **Băng đếm "Còn N mã chưa chia đủ số trúng về khoa"** + bấm để lọc / thoát lọc | `TongHopPdd` | đầu bảng Tổng hợp | ✅ |
| P11 | **Nút "Xác nhận rớt (N)"** — cò chuyển tiếp; bị **ẩn** khi còn mã chưa chia | `CumThauTongHop` | dải giai đoạn | ✅ |
| P12 | **Theo dõi chuyển tiếp mã rớt** — theo từng mã: tổng rớt, số khoa, đợt bổ sung, n/m khoa đã sửa, n/m đã xác nhận, trạng thái (kể cả *Đã đưa nhiều hơn số rớt* và *CHUYỂN TIẾP HỎNG*), nút *Chạy lại* | `TheoDoiChuyenTiep` | sidebar → *Theo dõi chuyển tiếp mã rớt* | ✅ 1.883 dòng |
| P13 | Tổng hợp kết quả thầu (theo khoa) | `TongHopKetQuaThau` | sidebar → *Tổng hợp kết quả thầu* | ✅ 35.274 dòng |
| P14 | Đề xuất các khoa (thay cho "Đề xuất của tôi") | `DeXuatTongHop` | menu gói → *Đề xuất các khoa* | ✅ |
| P15 | Công việc chờ duyệt (badge trên thanh) | `ChoDuyet` | nút *Chờ duyệt* | ❌ `khoa_nhom_ky_thuat` 0 dòng → badge luôn 0 |
| P16 | Duyệt mã kỹ thuật khoa đề nghị (gán mã hàng/mã quản lý rồi duyệt/từ chối) | `DuyetNhomKyThuat` | *Nghiệp vụ dùng chung* | ❌ 0 dòng |
| P17 | Duyệt điều chỉnh tiêu chí kỹ thuật | `DieuChinhTieuChi` (RPC `duyet_sua_tieu_chi`) | sidebar | ❌ 0 dòng |
| P18 | Quản lý đợt đề xuất (mở/đóng đợt, gói con, danh sách khoa) | `QuanLyDot` + `DotGoiCuaDot` | *Nghiệp vụ dùng chung* | ✅ 10 đợt · 26 DOT_GOI · 1.630 dòng khoa |
| P19 | Phân gói con cho mã quản lý | `PhanGoiConMaQuanLy` | *Nghiệp vụ dùng chung* | ✅ 1.367 mã quản lý |
| P20 | Quản trị người dùng (gán vai trò + khoa) | `QuanLyNguoiDung` | *Nghiệp vụ dùng chung* | ✅ 8 tài khoản |
| P21 | Nạp dữ liệu sử dụng (file HIS hàng tháng) | `NapDuLieuSuDung` | *Nghiệp vụ dùng chung* | ✅ 2 mẻ đã nạp · 141.623 dòng |
| P22 | **Hộp thư Phòng Điều dưỡng** | `HopThuThongBao` | chuông thanh trên | ✅ 46 `chuyen_ma` + 6 `ma_rot_ve_khoa` + 1 `khoa_sua` |
| P23 | Phiếu đề nghị mua thầu (trang riêng) | `PhieuDeNghi` | `?phieu=<id>` | ❌ `phieu_de_nghi` 0 dòng |
| P24 | Dọn dữ liệu kiểm thử toàn viện | `QuanLyDuLieuTest` | thùng rác | ⚠️ **cấm bấm** |

### 1.3 Chung hai vai

| # | Chức năng | Ghi chú |
|---|---|---|
| C1 | Khung điều hướng theo gói (18T · bổ sung · chỉ định thầu · 30%) | PĐD **không** thấy cây gói — chỉ có Bàn điều hành + các mục dùng chung |
| C2 | Ghim cột (`khoa_cot` 📌) và khoá sửa cột (`khoa_sua` 🔒) — hai cờ **độc lập** | 3 dòng cấu hình đang có |
| C3 | Audit từng ô (`danh_muc_tong_hop_o_audit`, `danh_muc_khoa_o_audit`, `phan_bo_khoa_audit`) | ✅ 93 dòng audit chốt Q |
| C4 | Xuất Excel bản nháp / bản chính thức có revision | ✅ |

### 1.4 Đã build nhưng **KHÔNG CÒN ĐƯỜNG BẤM TỚI** (đọc từ mã nguồn)

Không phải thiếu dữ liệu — thiếu **nút**. Phải xác minh bằng cách bấm thật.

| Chức năng | Vì sao mất đường |
|---|---|
| **Chốt toàn bộ dữ liệu trình ký** (`chot_trinh_ky_toan_bo_v3`) | nằm trong `TabKetQua` của `BanDieuHanhPdd`; ngày 24/08 gỡ hai tab *Danh mục tổng hợp* và *Kết quả thầu* khỏi mảng `TAB`, mà `setTab` chỉ được gọi từ chính mảng đó → nhánh `tab === "ket_qua"` thành mã chết |
| **Chốt / mở chốt trình ký từng bảng khoa** | cùng chỗ |
| **Giỏ rớt toàn viện** (`GioRotToanVien`) | cùng chỗ |
| **Tiến độ gói thầu** (`TienDoGoiThau`) | menu bọc trong `{false && …}` (cố ý, chờ nhánh D6) — và nó đọc 3 bảng đã chết |
| Chỉ định thầu | không có pipeline (QĐ 21/08) |

Hệ quả nặng nhất: **đuôi pipeline (chốt trình ký → Excel chính thức → kích hoạt
30%) không đi trọn được bằng giao diện.** Bộ A đã chốt trình ký bằng script nên
vẫn *xem* được hệ quả, nhưng không *bấm* lại được.

**Tổng cộng: 21 chức năng ĐVSD + 24 chức năng PĐD + 4 chức năng chung = 49**,
cộng **5 chức năng đã build mà mất đường bấm**.

---

## 2. Chức năng CHƯA CÓ DỮ LIỆU để test

Đếm thật trên staging, không đoán. Chủ dự án cần biết cái nào không kiểm được
và vì sao.

| # | Chức năng | Số dòng thật | Thiếu cái gì · làm sao có |
|---|---|---|---|
| 1 | **Hợp đồng · Giao hàng** | `hop_dong_v3` **0** · `hop_dong_ma_hang` **0** · `giao_hang` **0** | **Không có màn nào trên web đọc ba bảng này** (`grep` toàn bộ `frontend/src` cho `hop_dong_v3`/`giao_hang` = 0 kết quả). Miếng 3 mới dựng **nền dữ liệu**: bảng + biểu mẫu Excel + script nạp. ⇒ **Chỉ kiểm được bằng CLI**, không kiểm được bằng trình duyệt. Cần chủ dự án điền `database/MAU_GOM_DU_LIEU_SAU_THAU.xlsx` |
| 2 | **Tiến độ sử dụng theo cam kết 20/50/80** | `v_tien_do_su_dung` **15.889** dòng, nhưng `nguon_moc` = `chot_trinh_ky` cho **100%** | Màn **có** dữ liệu và mở được. Nhưng phần mới nhất (`patch_zzzzzk`: mốc đếm từ **ngày hàng về thật**) chưa bao giờ chạy vì `giao_hang` rỗng — mọi mã đang lùi về ngày chốt trình ký. Chỉ cần **1 dòng `giao_hang`** là kiểm được cả hai nhánh |
| 3 | **Sổ thiếu hàng** | `su_kien_thieu_hang` **0** · `xac_nhan_thang` **0** · `v_thieu_theo_thang` **0** | Chỉ test được đường *tạo mới*. Không test được lọc/thống kê/xác nhận cuối tháng. QĐ 21/08 để màn này **tạm dừng** |
| 4 | **Điều chỉnh tiêu chí kỹ thuật** | `de_nghi_sua_tieu_chi` **0** | Khoa phải tự tạo 1 đề nghị trong kịch bản rồi PĐD duyệt/từ chối. Không có dữ liệu cũ để kiểm hiển thị danh sách dài |
| 5 | **Duyệt mã kỹ thuật khoa đề nghị** + **badge Chờ duyệt** | `khoa_nhom_ky_thuat` **0** | Badge *Chờ duyệt* luôn hiện 0, màn Duyệt rỗng. Phải tự tạo đề nghị ở vai khoa (K13) trước |
| 6 | **Lịch sử hồ sơ đề xuất** | `lan_xuat_ho_so` **0** | Chỉ có dòng khi ai đó xuất Word/Excel qua màn *Cam kết của khoa*. Tự sinh trong kịch bản |
| 7 | **Hồ sơ trực tuyến / bộ hồ sơ** | `ho_so_cong_tac` **0** | Tự tạo trong kịch bản |
| 8 | **Phiếu đề nghị** (`?phieu=<id>`) | `phieu_de_nghi` **0** | Không có id nào để mở. Route không kiểm được cho tới khi có phiếu |
| 9 | **Kích hoạt tùy chọn 30%** | `tuy_chon_mua_them_30_v3` **0** · `tuy_chon_mua_them_kich_hoat` **0** | Trần thì có (12.145 dòng, từ bộ A). Nhưng chưa ai kích hoạt lần nào ⇒ luật *"tổng các lần kích hoạt không vượt trần"* chưa từng chạy. Kích hoạt được — làm bẩn bộ A, chấp nhận |
| 10 | **Chuyển tiếp lần thứ hai (QĐ D11 · D12)** | bộ B **0 dòng rớt** | Cần một mã **rớt ở hai giai đoạn khác nhau** rồi xác nhận rớt hai lần. Phải tự dựng trong kịch bản (bước C7) |
| 11 | **Trạng thái "Đã đưa nhiều hơn số rớt"** trên màn Theo dõi | có dữ liệu cũ ở bộ A | Kiểm được bằng cách **xem** bộ A; muốn dựng lại thì phải chạy đúng chuỗi D12 |
| 12 | **Cột chữ đã sửa đè trên bộ B** | `danh_muc_tong_hop_o` chỉ **10 dòng**, đều thuộc đợt #68/#71 | Bộ B chưa có ô nào bị sửa đè ⇒ trạng thái "đã sửa đè · nút Bỏ sửa đè · tooltip ai sửa cuối" phải tự tạo. Đây là **điểm xuất phát sạch**, tốt cho phần trọng tâm |
| 13 | **Tiến độ gói thầu** (`TienDoGoiThau`) | `goi_thau_ket_qua_ma` · `goi_thau_tien_do` · `goi_thau_moc` đều **0** | Ba bảng của mô hình trước v3, đã chết từ 17/08, đã gỡ khỏi menu. **Không test.** Đừng bơm dữ liệu vào |
| 14 | **Chỉ định thầu** | `goi_thau` **0** | Không có pipeline (QĐ 21/08). Chỉ có màn xuất hồ sơ |
| 15 | **Chốt dữ liệu trình ký qua giao diện** | — | Không phải thiếu dữ liệu mà **thiếu nút** (mục 1.4) |
| 16 | **Sửa số sau chốt Q bằng "gõ đè tại chỗ kèm lý do"** (QĐ 21/08) | — | Trigger `fn_khoa_phan_bo_sau_chot_q` **chặn cứng mọi ghi** vào `phan_bo_khoa` khi còn `chot_q_phien` hiệu lực, không có đường vòng nào trong `sua_so_luong_khoa_v3` hay `cap_nhat_tong_phan_bo_khoa`. ⇒ **Luật này chưa thi công**; đường duy nhất còn lại là *Mở chốt để sửa*. Phải xác minh bằng bấm thật |

**Đếm: 16 mục. Trong đó 11 mục là "0 dòng thật", 5 mục là "có dữ liệu nhưng
nhánh cần kiểm chưa bao giờ chạy" hoặc "mất đường bấm".**

---

## 3. Kịch bản test — theo thứ tự chạy được

Thứ tự có chủ đích: kiểm tự động trước (rẻ, bắt lớp lỗi im lặng), rồi phần
trọng tâm trên nền sạch, rồi mới tới phần làm bẩn dữ liệu.

---

### VÒNG A — Các phép kiểm tự động (chạy trước khi mở trình duyệt)

Vì sao trước: `kiem_moi_man.py` bắt đúng lớp lỗi *"màn hiện rỗng mà không báo
lỗi"* và *"view rớt cột"* — hai lớp đã làm chết 8 màn trong hai ngày 23–24/08.
Chạy sau khi đã bấm nửa ngày thì bạn không phân biệt được lỗi có sẵn với lỗi
mình vừa tạo.

```bash
cd /Users/tranhien/Downloads/9.vtyt/backend
set -a && . ./.env.local && . ../frontend/.env && set +a
```

| Mã | Lệnh | Kỳ vọng hiện tại | Sai thì dấu hiệu |
|---|---|---|---|
| **A1** | `.venv/bin/pytest -q` | **215 passed** | ít hơn 215 = có test bị xoá; đỏ ở `test_patch_zzzzzh_contract.py` hoặc `test_patch_zzzzzt_trong_so.py` = ai đó gỡ cổng chặn hoặc gỡ luật trọng số |
| **A2** | `.venv/bin/python scripts/kiem_moi_man.py --xac-nhan-staging` | **ba vòng** đều xanh: vòng *nguồn* (63 bảng/view · 41 RPC của 36 màn), vòng *cột* (**298 cột**), vòng *RLS* | bất kỳ dòng ❌ nào. Đặc biệt `42703 column … does not exist` = view rớt cột → **ba tới bốn màn đang chết**. Số cột < 298 = script không đọc được một `.select(...)` nào đó |
| **A3** | `.venv/bin/python scripts/smoke_workflow_v3_staging.py --xac-nhan-staging` | **29/29** | dừng ở bước nào thì bước đó là chỗ hỏng; script tự dọn, không để lại rác |
| **A4** | `.venv/bin/python scripts/kiem_do_ma_tuong_duong.py --xac-nhan-staging` | **8/8 PASS** | đường đổ số rớt sang mã tương đương hỏng — dừng ngay, đừng chạy vòng C |
| **A5** | `cd ../frontend && npm run build` | build ✓, không warning về import thiếu | build xanh **không** chứng minh màn chạy (bẫy `BangSoTrungTheoKhoa`) |
| **A6** | `npm run test:formula` | 5 file test đều OK | công thức số lượng lệch → mọi số P50–P95 trên màn sai |
| **A7** | `.venv/bin/python scripts/kiem_truoc_deploy.py` | "Sạch" | bắt lệch `GOI_ID_MAP` ↔ bảng `goi_con` |

Nếu **A2** không xanh: **dừng.** Mọi kết luận giao diện sau đó đều không đáng
tin — đây đúng là bài học 24/08 (`kiem_moi_man` báo xanh suốt một ngày trong lúc
ba màn đã chết vì nó chỉ dò `select("*")`).

---

### VÒNG B — 🔴 TRỌNG TÂM: Tổng hợp (PĐD) ↔ Danh mục đề xuất của khoa (ĐVSD)

Đây là phần dài nhất, và là phần chủ dự án dặn kỹ nhất. Đọc hết B0 trước khi
bấm — nó giải thích **vì sao** phải chia sân, nếu không bạn sẽ kết luận sai.

#### B0 — Kiến trúc phải hiểu trước

Ba kho số, không được lẫn:

```
proposals            khoa gửi giỏ — BẤT BIẾN, không ai sửa
   ↓ khởi tạo
phan_bo_khoa         SỐ HIỆN HÀNH theo (DOT_GOI × mã hàng × khoa) — nguồn DUY NHẤT
   ↓ SUM
Danh mục tổng hợp    VIEW cộng lên, KHÔNG lưu số riêng
```

Cột **chữ** đi đường khác hẳn:

| Loại ô | Bảng | Phạm vi | Ai sửa sau đè? |
|---|---|---|---|
| Cột chữ (TSKT, tên thương mại, mã SP, hãng, nước…) | `danh_muc_tong_hop_o` | **một giá trị chung toàn viện** theo `(goi_id, nam, mã hàng, cột)` | **Có** — PĐD hay khoa đều đè |
| Cột giải trình `giai_trinh_2627` | `danh_muc_khoa_o` | **riêng từng khoa** | không đè nhau |
| Cột số `sl_de_xuat_2627` | `phan_bo_khoa` | riêng từng khoa | ai ghi sau thắng, tổng là view |

Hai cột **không** đi xuống khoa: `giai_trinh` (bản PĐD) và `sl_de_xuat_2627` —
hàm `cot_khong_link_xuong_khoa()` chốt đúng hai cái đó.

Khoá tên cột hai bên **khác nhau**, quy đổi bằng `cot_pdd_sang_khoa()`:

```
sl_de_xuat_2627 → sl_de_xuat_18t     giai_trinh → giai_trinh_2627
ma_sp → ma_sp_2627    hang_sx → hang_sx_2627    nuoc_sx → nuoc_sx_2627
```

**Ô nào bị khoá lúc nào** (đo từ định nghĩa trigger trên staging):

| Cột | Khoá khi | Trigger |
|---|---|---|
| Cột **số** | **chốt Q** có hiệu lực | `fn_khoa_o_tong_hop_sau_chot_q` (bảng tổng hợp) + `fn_khoa_phan_bo_sau_chot_q` (`phan_bo_khoa`) |
| Cột **chữ** | **chốt trình ký** có hiệu lực | `fn_khoa_o_tong_hop_sau_chot_q` |
| Ô bất kỳ | cột bị `khoa_sua` 🔒 hoặc dòng bị lock | `fn_chan_o_da_lock`, `fn_chan_o_cot_khoa_sua` |

**Huỷ xác nhận (luật V2, đã nới 20/08)** — đây là chỗ hay hiểu sai nhất:

| Ai sửa gì | Khoa nào mất xác nhận |
|---|---|
| **Khoa** sửa cột chữ | **chỉ khoa đó** (`fn_huy_xac_nhan_khi_o_doi` truyền `current_user_khoa()`) |
| **PĐD** sửa cột chữ | **không ai** — khoa thấy thay đổi + dấu vết ngay trên bảng của mình |
| Bất kỳ ai đổi `so_luong_hien_hanh` | **đúng khoa của dòng đó** (`fn_huy_xac_nhan_khi_so_doi`) |
| Script / service-role (không rõ vai) | **mọi khoa có mã đó** — thà huỷ thừa còn hơn bỏ sót |

**Hộp thư (đo từ định nghĩa hàm):**

| Việc | Ai nhận | Gộp theo ngày? |
|---|---|---|
| PĐD sửa **ô chữ** trên Tổng hợp | **mọi khoa** có mã đó trong đợt đang mở | có, `so_lan +1` |
| PĐD sửa **số** của một khoa | đúng khoa đó | có |
| **Khoa** sửa **số** | PĐD | có |
| **Khoa** sửa **ô chữ** | ⚠️ **không ai** — `fn_thong_bao_o_tong_hop` thoát sớm nếu vai không phải `dieu_duong`/`admin` | — |

Dòng cuối là **bất đối xứng có thật trong code**. Bước B9 đo nó.

#### B0b — Chia sân, và vì sao

Mọi DOT_GOI của bộ B **đã chốt Q** ⇒ ô số **khoá cứng ở server**. Nên:

| Nửa của trọng tâm | Sân | Lý do |
|---|---|---|
| **Cột CHỮ** — một giá trị chung, ai sửa sau đè, hộp thư, huỷ xác nhận, cột giải trình | **bộ B, dgid 680** (`18t-dung-chung`, đợt #168) | cột chữ chỉ khoá ở **chốt trình ký**, mà bộ B **chưa** chốt trình ký ⇒ sửa được. Làm bẩn: thêm dòng `danh_muc_tong_hop_o`, `danh_muc_khoa_o`, `thong_bao`, và hạ `danh_muc_khoa_chot.hieu_luc` |
| **Cột SỐ** — khoa sửa ↔ PĐD sửa, ô tổng chia theo tỉ lệ, huỷ xác nhận theo số | **đợt #69 / dgid 230** (`bs-t9`, 3.070 dòng, 60 khoa, **chưa chốt Q**) | sân duy nhất có sẵn dữ liệu mà ô số còn mở |
| **Cột SỐ, đường sạch từ đầu** | **đợt #103 / dgid 387** (`bs-t9`/2027, rỗng, 3 khoa test đã gán) | dùng ở vòng E (pipeline bổ sung đi lại từ đầu) |

⚠️ **#69 cũng là đích chuyển tiếp của hôm nay.** `fn_dot_bo_sung_gan_nhat` tính
từ `CURRENT_DATE` (25/08/2026) → mốc T9/2026 → đúng đợt #69. Nên **chạy vòng B
trước vòng C**; sau vòng C, số dòng ở #69 sẽ tăng và đó là bằng chứng chuyển
tiếp chạy đúng.

**Làm bẩn bộ B tới đâu:** B1–B12 chỉ chạm cột chữ và giải trình của **đúng 2 mã
hàng** bạn tự chọn ở dgid 680. Dọn được bằng nút *Bỏ sửa đè* (xoá hẳn dòng
override) và bằng cách khoa bấm xác nhận lại. Nếu thấy khó dọn, cứ dựng lại bộ B
theo 0.3 — mất 28 giây, nhưng **đổi id đợt**.

#### B1 — Mở hai màn cạnh nhau, đúng cùng một DOT_GOI

| | |
|---|---|
| Thao tác | Cửa sổ 1 (PĐD): *Bàn điều hành* → chọn đợt **TEST QUY MÔ THẬT B** → gói con **Dùng chung** → bấm nút mở bảng Tổng hợp. Cửa sổ 2 (dvsd1): menu **Gói 18 tháng → Dùng chung → Danh mục đề xuất của khoa** → chọn đợt TEST QUY MÔ THẬT B |
| Màn | `TongHopPdd` ← → `DanhMucDeXuatKhoa` |
| Hash | PĐD `#tong-hop-pdd/18t-dung-chung/168` · khoa `#danh-muc-de-xuat/18t-dung-chung/Khoa%20GMHS%20-%20Ph%C3%B2ng%20m%E1%BB%95/168` |
| Kỳ vọng | Cả hai **mở ở TAB TRÌNH DUYỆT MỚI**. PĐD: header *"Danh mục tổng hợp — Gói 18T / Dùng chung"*, badge **Tổng mã hàng: 340**, **50 khoa đã đề xuất**. Khoa: 109 dòng |
| Sai thì | Mở trong tab cũ = `lib/moManExcel.js` không được gọi. Số mã ≠ 340 (hay ra 157) = bẫy `fetchAllRows` dùng lại builder → các trang song song đè `range` của nhau, **mất dòng trong im lặng, không báo lỗi** |
| Đo thêm | Bấm giờ từ lúc đổi hash tới lúc đủ 340 dòng. Mốc hiện tại **~4,9–5,7 s**. Trên 10 s = có policy RLS mới bị viết không bọc `(select ham())` |

#### B2 — Bấm lại cùng khoa/gói: phải dùng lại đúng tab cũ

Bấm lại nút mở Tổng hợp của **cùng gói con** → không được đẻ tab thứ hai. Bấm
gói con **khác** → phải ra tab khác. Vì sao quan trọng: tên cửa sổ bỏ dấu tiếng
Việt rồi nối mã băm — nếu ai đó bỏ mã băm thì "Khoa Nội soi" và "Khoa Noi soi"
giành nhau một tab.

#### B3 — 🔴 Ba cửa vào danh mục khoa có ra cùng một bản không?

Đây là phép thử **quan trọng nhất** của vòng B, và là chỗ người lập kế hoạch
nghi ngờ nhất khi đọc mã nguồn.

`danh_muc_tong_hop_o` khoá theo `goi_id = "<goiId>:dot:<dotId>"`. Ba cửa sinh ba
`goiId` khác nhau:

| Cửa | Sinh hash | Scope thành |
|---|---|---|
| Menu *Danh mục đề xuất của khoa* (`DanhMucDeXuatLinks`) | `#danh-muc-de-xuat/<goiId>/<khoa>/<dotId>` — gói bổ sung ra **`bo-sung`** | `bo-sung:dot:69` |
| Nút trong *Đề xuất số lượng* / *Đề xuất của tôi* | `moDanhMucDeXuat(goiId, khoa)` — **KHÔNG truyền dotId** | `<goiId>` trần, **không có `:dot:N`** |
| PĐD mở từ *Bàn điều hành* | `moDanhMucDeXuat(goi_id thật, khoa, dot.id)` — bổ sung ra **`bs-t9`** | `bs-t9:dot:69` |

| | |
|---|---|
| Thao tác | Với **gói 18T** (bộ B): mở danh mục khoa GMHS lần lượt bằng cả ba cửa, so từng ô chữ. Rồi làm lại với **gói bổ sung** (đợt #69) |
| Kỳ vọng | Cả ba cửa ra **cùng một bộ giá trị**. Nếu không, ghi rõ cửa nào ra bản nào |
| Sai thì dấu hiệu | Với gói 18T: cửa 1 và cửa 3 khớp (`18t-dung-chung:dot:168`), cửa 2 **thiếu `:dot:`** → ô chữ trống hoặc khác. Với gói bổ sung: cửa 1 ra `bo-sung:dot:69` còn cửa 3 ra `bs-t9:dot:69` → **PĐD sửa ô chữ mà khoa không thấy gì**, và ngược lại. Đây là lớp lỗi "hai đường tới cùng một con số" mà dự án đã dính bốn lần |
| Kiểm chéo ở DB | `select distinct goi_id from danh_muc_tong_hop_o;` — nếu sau khi test thấy cả `bo-sung:dot:69` lẫn `bs-t9:dot:69` thì **đã tách làm hai kho, xác nhận lỗi** |

Còn một hệ quả nữa của cửa 2: `dotId = null` ⇒ `dotGoiId = null` ⇒ khoa gõ số
sẽ gọi `sua_so_luong_khoa_v3(p_dot_goi_id: null)`. Kỳ vọng: báo lỗi rõ ràng, chứ
không im lặng.

#### B4 — Chiều PĐD → khoa: cột CHỮ

| | |
|---|---|
| Thao tác | Cửa sổ PĐD, bảng Tổng hợp dgid 680: chọn một mã hàng có nhiều khoa (dùng cột *Khoa đề xuất* để chọn mã ≥ 10 khoa). Bấm vào ô **Tiêu chí kỹ thuật** → gõ `TEST-PDD-<giờ phút>` → **Lưu** |
| Kỳ vọng ở PĐD | Ô đổi màu *đã sửa đè*; tooltip ô ghi *"Đã sửa đè — số gốc: …"* và *"Sửa cuối bởi pdd@umc.edu.vn lúc …"*. Xuất hiện nút **Bỏ sửa đè** |
| Kỳ vọng ở khoa | Cửa sổ khoa **F5** (không có realtime) → ô Tiêu chí kỹ thuật của đúng mã đó hiện `TEST-PDD-…`, kèm nhãn ai sửa |
| Kỳ vọng ở hộp thư khoa | Chuông của **cả ba** khoa test hiện thêm 1 dòng loại `pdd_sua`: *"Phòng Điều dưỡng vừa sửa nội dung trên danh mục tổng hợp"* |
| Kỳ vọng về xác nhận | Trạng thái *"Đã chốt danh mục"* của khoa **KHÔNG bị huỷ** — PĐD sửa cột chữ không huỷ xác nhận của ai |
| Sai thì | Khoa không thấy giá trị mới = lệch scope `goi_id` (xem B3) hoặc `cot_pdd_sang_khoa` sai. Khoa **mất xác nhận** = `fn_huy_xac_nhan_khi_o_doi` không đọc được vai trò → rơi vào nhánh "huỷ hết" |

#### B5 — Chiều khoa → PĐD: cột CHỮ, và **ai sửa sau đè**

| | |
|---|---|
| Thao tác | Cửa sổ khoa (dvsd1), cùng mã hàng đó: sửa ô **Tiêu chí kỹ thuật** thành `TEST-KHOA1-<giờ phút>` |
| Kỳ vọng ở PĐD | F5 bảng Tổng hợp → ô hiện `TEST-KHOA1-…`, **đè lên** giá trị PĐD vừa gõ ở B4. Tooltip ô ghi *Sửa cuối bởi `dvsd1@umc.edu.vn`* |
| Kỳ vọng ở khoa 2 | Đăng nhập `dvsd2`, mở danh mục cùng gói con → nếu khoa 2 cũng đề xuất mã đó thì cũng thấy `TEST-KHOA1-…`. **Một giá trị chung toàn viện** |
| Kỳ vọng về xác nhận | **Chỉ khoa 1** mất xác nhận. Bảng của khoa 1 hiện băng *"Xác nhận lần 1 đã hết hiệu lực … kiểm lại rồi bấm Xác nhận thông tin đề xuất lần 2"*. Khoa 2 **giữ nguyên** xác nhận |
| Sai thì | Khoa 2 cũng mất xác nhận = luật đã nới 20/08 bị lật lại (`huy_xac_nhan_theo_ma` gọi với `p_chi_khoa = null`). Đây là lỗi khiến hộp thư và vòng xác nhận thành vô dụng ở quy mô 62 khoa |
| Kiểm chéo ở PĐD | Trên bảng Tổng hợp, badge cạnh nút chốt phải đổi thành *"1 khoa chưa xác nhận: Khoa GMHS - Phòng mổ — chưa chốt số đi thầu được"* |

#### B6 — Ô có nhiều khoa ghi khác nhau: PĐD phải thấy ngay

| | |
|---|---|
| Thao tác | Khoa 1 gõ `AAA` vào ô **Tên thương mại** của mã X. Khoa 2 gõ `BBB` vào **cùng ô đó**. Cột chữ là giá trị chung nên `BBB` phải đè `AAA` — đó chính là điều phải đo |
| Kỳ vọng | Giá trị cuối là `BBB`. PĐD rê chuột vào ô thấy tooltip liệt kê từng khoa đã ghi gì (`oKhoaTheoMa`), và nếu hai khoa ghi khác nhau ở **cột giải trình** thì có cờ lệch |
| Sai thì | Không thấy tooltip liệt kê = `danh_muc_khoa_o` không được đọc vào (`dotGoiIdKhoa` tra ra `null` vì `goiId` không có hậu tố `:dot:N`) |

#### B7 — Cột GIẢI TRÌNH: ngoại lệ duy nhất, riêng từng khoa

| | |
|---|---|
| Thao tác | Khoa 1 sửa ô **Giải trình** của mã X thành `GT-KHOA1`. Khoa 2 sửa cùng mã thành `GT-KHOA2` |
| Kỳ vọng | Hai khoa **giữ hai giá trị khác nhau**, không đè nhau. Bộ B đã có sẵn giải trình `"Dữ liệu test — cố ý đề xuất vượt dải P50–P75…"` ở các mã cố ý vượt P75 (521 ô ở dgid 680) — dùng chúng để đối chiếu |
| Kỳ vọng ở PĐD | Theo QĐ 21/08 giải trình phải nằm ở **dòng sổ của khoa**. Đọc mã nguồn thì `TongHopPdd` **không render cột giải trình trong dòng sổ** — dòng sổ chỉ có Khoa · SL gốc · SL hiện hành · Tỉ trọng · Trạng thái. Giải trình chỉ tới PĐD qua **tooltip của ô trên dòng mã hàng**. ⇒ **Phải bấm thật để xác nhận**; nếu đúng vậy thì đây là chỗ lệch giữa QĐ 21/08 và bản đang chạy |
| Sai thì | Nếu hai khoa đè nhau → trigger `fn_khoa_o_chi_nhan_giai_trinh` bị vô hiệu, hoặc giải trình bị ghi nhầm vào `danh_muc_tong_hop_o` |

#### B8 — Ghim cột 📌 và khoá sửa cột 🔒 là hai thứ khác nhau

| | |
|---|---|
| Thao tác | Ở bảng khoa: bấm 📌 trên một cột → cuộn ngang. Rồi bấm 🔒 trên cột khác → thử sửa ô cột đó |
| Kỳ vọng | 📌 = cột dính bên trái khi cuộn, **vẫn sửa được**. 🔒 = **không ai sửa được, kể cả PĐD**; PĐD thử sửa cùng cột đó trên bảng Tổng hợp cũng bị chặn (`fn_chan_o_da_lock`) |
| Sai thì | 📌 mà khoá luôn nội dung = nhầm hai cờ. 🔒 mà PĐD vẫn sửa được = trigger không chạy trên đường của PĐD |
| Dọn | Bấm lại để tắt cả hai — cấu hình này dùng chung toàn viện, để nguyên là làm phiền vòng test sau |

#### B9 — Hộp thư hai chiều: ba luật phải đúng cả ba

| | |
|---|---|
| Thao tác 1 | Khoa 1 sửa **5 ô số hoặc ô chữ khác nhau** trong cùng một ngày |
| Kỳ vọng | Hộp thư PĐD chỉ có **một dòng** cho khoa đó trong ngày, đếm bằng **`×n`**. Không được đẻ 5 dòng |
| Thao tác 2 | PĐD bấm *Xác nhận đã xem* một dòng |
| Kỳ vọng | Dòng **biến mất hẳn**, không chuyển sang trạng thái "đã đọc". Dấu vết thật vẫn còn ở audit từng ô |
| Thao tác 3 | Khoa 1 sửa **ô chữ** (không phải ô số) |
| Kỳ vọng theo tài liệu | PĐD nhận thông báo *khoa vừa sửa nội dung* |
| ⚠️ Kỳ vọng theo mã nguồn | **Không có thông báo nào** — `fn_thong_bao_o_tong_hop` thoát sớm nếu vai không phải `dieu_duong`/`admin`; chỉ `fn_thong_bao_phan_bo_khoa` (ô SỐ) mới báo cho PĐD |
| Ghi kết quả | Ghi rõ thấy cái nào. Nếu đúng là không có thông báo thì đây là **hở của luật V2**: khoa đè lên PĐD ở cột chữ mà PĐD không có chỗ nào nhìn thấy — đúng cái vấn đề mà hộp thư sinh ra để giải |

#### B10 — Chiều PĐD → khoa: cột SỐ (sân #69, dgid 230)

Chuyển sang đợt **Mua sắm bổ sung T9/2026** — chưa chốt Q nên ô số còn mở.
PĐD: `#tong-hop-pdd/bs-t9/69`. Khoa: menu **Gói bổ sung → Danh mục đề xuất của
khoa** → chọn đợt T9/2026.

| | |
|---|---|
| Thao tác a | PĐD sổ một dòng mã hàng → bấm **Sửa phân bổ theo khoa** → đổi số của khoa GMHS → nhập lý do → **Lưu phân bổ** |
| Kỳ vọng | Không lưu được nếu tổng các khoa ≠ tổng cần phân bổ — báo *"Tổng các khoa X chưa khớp tổng cần phân bổ Y"*. Lưu được thì ô tổng của mã đổi theo **ngay** (tổng là view) |
| Kỳ vọng ở khoa | F5 → số hiện hành đổi; bảng có mục *điều chỉnh của PĐD* ghi số cũ → số mới → người sửa → lý do. Xác nhận của **đúng khoa đó** bị huỷ |
| Kỳ vọng hộp thư | Khoa GMHS nhận *"Phòng Điều dưỡng vừa chỉnh số trên danh mục của khoa"*. Các khoa khác **không** nhận |
| Thao tác b | PĐD bấm vào **ô tổng** của một mã → gõ tổng mới |
| Kỳ vọng | Không ghi thẳng. Dòng **tự sổ ra** và hệ chia sẵn phần chênh theo tỉ lệ `so_luong_goc`, **làm tròn xuống, phần dư dồn vào khoa có số gốc lớn nhất**. PĐD sửa tay dòng nào cũng được, nhưng tổng phải khớp mới lưu |
| Kỳ vọng lý do | Vì #69 đã có khoa chốt danh mục nên **bỏ trống lý do phải bị chặn**: *"Phải nhập lý do vì có khoa đã chốt danh mục."* |
| Sai thì | Gõ tổng mà ghi thẳng không sổ dòng = mất đường sửa tay, và invariant 6 bị phá. Không đòi lý do = mất dấu vết bắt buộc |

#### B11 — Chiều khoa → PĐD: cột SỐ

| | |
|---|---|
| Thao tác | Khoa GMHS sửa số của một mã trên bảng của mình |
| Kỳ vọng ở PĐD | F5 bảng Tổng hợp → **ô tổng đổi theo** (invariant 20: tổng đi thầu = tổng số hiện hành của các khoa). Dòng sổ hiện đúng số mới ở cột *SL hiện hành*, còn *SL gốc* **không đổi** |
| Kỳ vọng hộp thư PĐD | Một dòng *"Khoa … vừa sửa số trên bảng đề xuất"*, gộp theo ngày |
| Kỳ vọng xác nhận | Xác nhận của chính khoa đó bị huỷ |
| Sai thì | `so_luong_goc` đổi theo = phá dấu vết gốc. Ô tổng không đổi = bảng tổng hợp đang lưu số riêng thay vì cộng lên — **phá bất biến quan trọng nhất của v3** |
| Kiểm chéo | `select so_luong_goc, so_luong_hien_hanh, revision, sua_boi_khoa from phan_bo_khoa where dot_goi_id=230 and ma_hang='<mã>' and khoa='Khoa GMHS - Phòng mổ';` — `revision` phải +1, `sua_boi_khoa` phải true |

#### B12 — Hai bên sửa **cùng một ô** gần như cùng lúc

| | |
|---|---|
| Thao tác | Khoa mở ô số của mã X, gõ `100` nhưng **chưa Lưu**. PĐD sửa cùng mã đó thành `200` và lưu. Khoa bấm Lưu |
| Kỳ vọng | Ai lưu sau thắng → `100`. Không được có màn hình nào vỡ, không mất số của người kia mà không có dấu vết. `phan_bo_khoa_audit` phải có **hai** dòng |
| Sai thì | Số cuối không phải của người bấm sau, hoặc một trong hai lần ghi biến mất khỏi audit |
| Vì sao đo | `sua_so_luong_khoa_v3` và `cap_nhat_tong_phan_bo_khoa` đều lấy `pg_advisory_xact_lock` theo `(dot_goi_id, mã hàng)` — bước này chứng minh khoá đó thật sự chạy |

#### B13 — Khoá cột số ở chốt Q (quay lại bộ B)

| | |
|---|---|
| Thao tác | Trên bộ B (đã chốt Q), khoa thử sửa số một mã; PĐD thử bấm *Sửa phân bổ theo khoa* |
| Kỳ vọng | Cả hai **bị chặn ở server**: *"Số tham gia thầu đã chốt; PĐD phải mở snapshot Q trước."* Nút *Sửa phân bổ theo khoa* của PĐD **không hiện** |
| Kỳ vọng cột chữ | Cùng lúc đó cột **chữ vẫn sửa được** — chốt Q chỉ khoá cột số |
| ⚠️ Đo thêm | QĐ 21/08 nói PĐD phải **gõ đè thẳng tại ô kèm lý do, không phải mở chốt cả gói con**. Đọc mã nguồn thì đường đó **không tồn tại** — trigger chặn cứng, không có tham số lý do nào đi vòng qua được. Bấm thật để xác nhận, rồi ghi vào kết quả là **luật đã chốt nhưng chưa thi công** |

#### B14 — Cổng chốt số đi thầu

| | |
|---|---|
| Thao tác | Trên đợt #69 (chưa chốt Q), để **một khoa chưa xác nhận** rồi bấm *Chốt số đi thầu* |
| Kỳ vọng | Nút **mờ**, tooltip liệt kê đích danh khoa chưa xác nhận. Khoa **chưa gửi đề xuất nào thì không tính** — nếu tính thì gói 49 khoa sẽ không bao giờ chốt được |
| Sau khi khoa xác nhận | Nút sáng; bấm → tạo `chot_q_phien` mới, mọi ô số khoá lại, dải giai đoạn xuất hiện |
| Sai thì | Nút sáng khi còn khoa chưa xác nhận = cổng cứng 19/08 bị gỡ |
| ⚠️ | Bước này **làm bẩn #69**: chốt Q ở đó sẽ khiến chuyển tiếp của vòng C nhảy sang mốc T1/2027. Nếu muốn giữ #69 làm đích chuyển tiếp thì **mở chốt lại ngay** sau khi đo xong |

---

### VÒNG C — Pipeline gói 18 tháng sau chốt Q (bộ B, 5 gói con)

🔴 **Thứ tự bắt buộc, hệ chặn nếu làm sai:**

```
gõ số rớt → CHIA số trúng về khoa → đổ sang mã tương đương
          → mã nhận về trống, CHIA LẠI trên tổng mới → Xác nhận rớt
```

Chạy vòng này trên **dgid 680** (`18t-dung-chung`, 340 mã). Sau đó lặp rút gọn
cho 4 gói con còn lại để chứng minh **gói con độc lập nhau**.

#### C1 — Dải giai đoạn có nút CHỮ

| | |
|---|---|
| Kỳ vọng | Ba thẻ Chào giá · Mở thầu · Đánh giá. Chào giá đang *đang thực hiện*. Hai thẻ sau hiện thẳng **"chờ giai đoạn trước"**, không phải biểu tượng 11px |
| Thao tác | Bấm **✓ Hoàn thành** Chào giá → **▶ Bắt đầu** Mở thầu → bấm **mở lại** Chào giá |
| Kỳ vọng | Mở lại **bắt buộc nhập lý do**, Enter để xác nhận / Esc để huỷ. Mở lại làm kết quả các giai đoạn sau hết hiệu lực |
| Sai thì | Không có ô lý do = mất dấu vết bắt buộc (QĐ mục 5.1) |

#### C2 — Gõ số rớt R1/R2/R3, và khoá cứng 3

| | |
|---|---|
| Thao tác | Chọn một mã có Q lớn và nhiều khoa. Bấm ô **R1** → gõ số rớt một phần + lý do |
| Kỳ vọng | Chỉ ô của **giai đoạn đang chạy** mở được; hai ô kia là số chỉ đọc, nền xám. Lý do **bắt buộc**. Cột **Trúng** = Q − tổng rớt, đổi ngay |
| Thao tác | Thử gõ số rớt **lớn hơn Q** |
| Kỳ vọng | **Chặn ngay lúc gõ** (khoá cứng 3 — QĐ 21/08 giữ chặn cứng, không nới như khoá 2) |
| Kỳ vọng phụ | Sau khi ghi rớt, ô số trúng theo khoa **về trống** (QĐ D14 — hệ không tự chia nữa). Cột **Đã chia** nền **đỏ**, có nút **Chia** |
| Sai thì | Ô số trúng tự điền = `fn_dong_bo_phan_bo_trung_v3` lại đi chia thay vì xoá trắng → sẽ **xoá mất phân bổ PĐD gõ tay** |

#### C3 — Băng đếm và nút lọc (miếng 1c)

| | |
|---|---|
| Kỳ vọng | Đầu bảng hiện băng hổ phách **"Còn N mã chưa chia đủ số trúng về khoa · bấm để lọc ra"** |
| Thao tác | Bấm băng → bảng lọc còn **đúng N dòng**; chân bảng ghi *"Đang lọc N/340 mã chưa chia đủ"*. Băng đổi sang nền đặc, chữ *"bấm để xem lại tất cả"* |
| Thao tác | Chia đủ hết **trong lúc đang lọc** |
| Kỳ vọng | Không kẹt bảng rỗng — hiện nút xanh **"Đã chia đủ hết — bấm để xem lại tất cả"** |
| Sai thì | Bảng rỗng không lối thoát = đúng lỗi miếng 1c sinh ra để tránh |

#### C4 — Bảng "Chia số trúng về khoa": cột Đã đưa đi, phím tắt, lưu tạm

| | |
|---|---|
| Thao tác | Sổ dòng mã vừa gõ rớt → bảng *Chia số trúng về khoa* hiện ra |
| Kỳ vọng cột | `Khoa` · `Q của khoa` · **`Đã đưa đi`** (dấu trừ, màu hổ phách) · **`Nhận từ mã rớt`** (dấu cộng, xanh) · ô nhập |
| Kỳ vọng dòng đầu | Dòng nhắc: *"Enter xuống khoa kế · Shift+Enter lên · Esc trả về số cũ · Ctrl+Enter lưu"* |
| **Phím tắt (miếng 1d)** | **Enter** → xuống khoa kế, ô mới **tự bôi đen**. **Shift+Enter** → lên. **Esc** → ô về đúng số đã lưu. **Ctrl/⌘+Enter** → lưu cả cụm |
| ⚠️ | Phím tắt **chưa ai gõ thật bằng bàn phím vật lý** (24/08: công cụ tự động không đẩy được phím tới vì cửa sổ Chrome không giữ focus). **Đây là chỗ bắt buộc gõ tay.** |
| **Lưu tạm (miếng 1c)** | Gõ **300/520** rồi lưu → nút là **"Lưu tạm (còn thiếu 220)"** màu hổ phách, **LƯU ĐƯỢC**, dòng đỏ |
| **Chặn phía dư** | Gõ **600/520** → nút **tắt**, server **chặn** — *làm dở luôn là THIẾU, dư nghĩa là gõ nhầm* |
| Khớp | Gõ đủ 520 → nút đổi thành **"Xác nhận chia"** |
| Sai thì | Lưu được bản dư = `patch_zzzzzh` bị lật (`tổng > phải chia` đổi lại thành `<>`). Không lưu được bản thiếu = miếng 1c mất |

#### C5 — Nút **Chia theo tỉ lệ Q**, và trọng số TRỪ phần đã đưa đi

| | |
|---|---|
| Thao tác | Trên cột *Đã chia* của dòng còn lệch, bấm nút **Chia** |
| Kỳ vọng | Điền sẵn cho mọi khoa, tổng khớp ngay, ô *Đã chia* hết đỏ, nút *Xác nhận rớt* hiện lại |
| Kỳ vọng công thức | Trọng số của khoa = **`(Q của khoa − đã đưa đi) + phần khoa đó nhận`**, làm tròn xuống, dư dồn vào khoa lớn nhất |
| Phép thử quyết định | Sau bước C6 (đổ mã), quay lại bấm **Chia** cho một khoa đã đổ đi N: cột *Đã đưa đi* hiện `−N`, và **`giữ + đã đưa đi ≤ Q + nhận`** |
| Sai thì | Nếu `giữ + đã đưa đi > Q` (ví dụ Q 10, giữ 8, đã đổ 3 → 11) thì `fn_trong_so_chia_v3` không trừ phần đã đưa đi → **lỗi "đổ quá tay" tái phát** |
| Đo tốc độ | Chia một mã × 50 khoa: mốc hiện tại **0,24–0,35 s**; đọc bảng chia 50 dòng **0,38 s** |

#### C6 — Đổ số rớt sang mã tương đương, và hai cổng chặn

| | |
|---|---|
| Thao tác a | Với mã **chưa chia** số trúng, bấm cột *Xử lý rớt* → chọn mã nhận |
| Kỳ vọng a | **BỊ CHẶN** — cổng đòi *mã rớt phải chia xong trước*. Thiếu cổng này thì hệ tưởng khoa rớt toàn bộ Q và **đổ đi cả Q** (đo thật: Q 200 rớt 80, chưa chia → đổ đi 200) |
| Thao tác b | Chia xong rồi đổ sang một mã **cùng mã quản lý** |
| Kỳ vọng b | Đổ được. Khoa A rớt bao nhiêu thì **nhận đúng bấy nhiêu** ở mã mới — PĐD chỉ chọn mã nhận, không chia lại |
| Thao tác c | Thử đổ sang mã **lệch ĐVT** trong cùng nhóm |
| Kỳ vọng c | **CHẶN** (68/446 nhóm có lệch ĐVT, chủ yếu Bộ vs Cái). Không được có bảng hệ số quy đổi nào |
| Thao tác d | Nếu mở được đường gọi RPC tay: thử mã nhận **không có trong đợt** |
| Kỳ vọng d | **CHẶN** — mã ngoài snapshot Q thì phần nhận không có chỗ đứng |
| Kỳ vọng hiển thị | Dòng mã **rớt** hiện `→ <mã nhận> (N)`. Dòng mã **nhận** hiện `← nhận N từ <mã rớt>` — **cả hai chiều**, đây đúng chỗ chủ dự án bắt lỗi ngày 24/08 |
| Kỳ vọng D15 | Sau khi đổ, ô số trúng của **mã nhận về trống**; cột *Đã chia* của nó so với **`Trúng + Nhận`**, không phải Trúng thuần. Tooltip ghi *"Trúng X + nhận Y từ mã rớt = Z sẽ mua"* |
| Kỳ vọng hộp thư | Khoa nhận dòng **đỏ** *"số đã chuyển sang mã nào"*; khoa chưa từng dùng mã nhận phải được nói rõ *"đây là mã khoa chưa từng đề xuất"* |
| Sai thì | Chỉ dòng mã rớt hiện, dòng mã nhận trống = lỗi 24/08 tái phát. Ô mã nhận **không** về trống = D15 bị lật |

#### C7 — Cổng "đổ quá tay" (lưới an toàn `patch_zzzzzn` + `zzzzzs`)

| | |
|---|---|
| Dựng tình huống | Chọn nhóm mã quản lý có ≥ 3 mã hàng cùng ĐVT: **A → B → C**. Cho **B vừa đổ đi vừa nhận về** |
| Chuỗi | rớt A → chia A → đổ A sang B → B về trống, chia lại B → rớt B → chia B → đổ B sang C |
| Kỳ vọng | Với `patch_zzzzzt` đã vá gốc, **không khoa nào vượt quyền**: `giữ + đã đưa đi ≤ Q + nhận`. Cột *Đã đưa đi* giải thích vì sao con số của khoa nhỏ đi |
| Kỳ vọng cổng | Nếu vẫn có dòng vượt (bản ghi cũ / gõ tay), **cả hai cổng** phải chặn: *Xác nhận rớt* và *Chốt trình ký* |
| Kiểm chéo | `select count(*) from ... fn_dong_vuot_quyen_v3` — mốc kỳ vọng sau khi vá: **0 dòng vượt trong cả gói con** |
| Sai thì | Cổng báo 0 mà DB có dòng vượt = điểm mù `v_rot_chua_xu_ly_v3` (view lọc `q_khoa > so_luong_trung`) tái phát — đo thật 25/08 từng cho **26 dòng vượt mà cổng thấy 0** |

#### C8 — Nút "Xác nhận rớt (N)" và chuyển tiếp

| | |
|---|---|
| Kỳ vọng trước | Khi còn mã chưa chia hết: băng hổ phách *"Còn N mã chưa chia hết số trúng về khoa — chưa xác nhận rớt được"* và nút *Xác nhận rớt* **BIẾN MẤT** |
| Kỳ vọng sau khi chia đủ | Nút đỏ **"Xác nhận rớt (N)"** hiện lại với đúng tổng chưa xử lý |
| Thao tác | Bấm → hộp xác nhận đỏ giải thích *"…sẽ vào đợt bổ sung gần nhất của từng khoa NGAY, và khoa được báo đỏ. Phần đã đổ sang mã tương đương không bị đưa vào."* → **Đồng ý, chuyển tiếp** |
| Kỳ vọng kết quả | Mã vào **đợt bổ sung T9/2026 (#69)** — mốc gần nhất chưa chốt Q tính từ 25/08/2026. Số điền sẵn **đúng bằng số khoa đó đã rớt**. Khoa nhận thông báo **đỏ** và **badge đỏ ở mục Gói bổ sung** |
| Kỳ vọng ở khoa | Đăng nhập dvsd1 → menu Gói bổ sung có badge đỏ → mở đợt T9/2026 → thấy mã mới với đúng số. **Sửa được**: nhiều hơn, ít hơn, hoặc về 0 |
| Sai thì | Mã không vào đợt nào = **CHUYỂN TIẾP HỎNG** (màn Theo dõi phải in đỏ ô trống). Số điền sẵn = **toàn bộ Q** thay vì số rớt = cổng "chưa chia" đã thủng |
| Kiểm chéo | `select count(*) from chuyen_tiep_rot_v3 where dot_goi_bo_sung_id = 230;` trước/sau |

#### C9 — Chuyển tiếp **lần thứ hai** (D11 · D12)

| | |
|---|---|
| Thao tác | Hoàn thành Chào giá → bắt đầu **Mở thầu** → gõ thêm số rớt **cùng mã đó** ở R2 → chia lại → Xác nhận rớt lần hai |
| Kỳ vọng D11 | Ở đợt bổ sung, số của khoa **CỘNG THÊM**, không đè. (Khoa sửa 44.210 → 50.000; rớt thêm 10.000 → thành **60.000**) |
| Thao tác | Trước lần hai, vào vai khoa **sửa** con số hệ điền sẵn |
| Kỳ vọng | Phần khoa sửa **được giữ**, phần rớt mới cộng vào |
| Kỳ vọng D12 | Hệ **không bao giờ trừ đi**. Nếu phần đã chuyển tiếp vượt số rớt hiện hành thì màn *Theo dõi chuyển tiếp* hiện cột **thừa so với rớt** và trạng thái **"Đã đưa nhiều hơn số rớt"** |
| Sai thì | Số bị đè = D11 mất, khoa mất công sửa. Hệ tự trừ = D12 mất |

#### C10 — Màn Theo dõi chuyển tiếp mã rớt

| | |
|---|---|
| Kỳ vọng cột | Mã hàng · mã quản lý · Tổng rớt (kèm ĐVT) · Số khoa · **Đợt bổ sung** (tên, hoặc **— TRỐNG in đỏ**) · Khoa đã sửa số `n/m` · Khoa đã xác nhận `n/m` · Trạng thái |
| Trạng thái phải thấy được | *Còn nợ xử lý* · *Đã đổ sang mã khác* · *Đã vào đợt bổ sung* · *Đã đưa nhiều hơn số rớt* · *CHUYỂN TIẾP HỎNG* |
| Thao tác | Bấm dòng → sổ ra danh sách khoa. Bấm **Chạy lại** trên một dòng còn nợ |
| Kỳ vọng | Chạy lại gọi cò cho **riêng mã đó**, không đụng mã khác |
| Kỳ vọng phân trang | Ở quy mô 1.468 mã, màn phải hiện **đủ**, không dừng ở 1.000 dòng. Đây là lỗi đã gặp 24/08: bốn truy vấn thiếu phân trang làm nút Xác nhận rớt báo **thiếu 38%** |
| Sai thì | Ô "đợt bổ sung" trống mà trạng thái không phải HỎNG = màn không dò được lỗi máy, chỉ là bảng trang trí |

#### C11 — Bốn gói con còn lại: chứng minh độc lập

Lặp C2 → C5 rút gọn cho **GMHS (681)**. Kỳ vọng: chốt/mở/sửa một gói con
**không** đụng bốn gói con còn lại — kiểm bằng cách xem lại trạng thái giai đoạn
và số của 680, 682, 683, 684 sau khi thao tác trên 681.

#### C12 — Đuôi pipeline: chốt trình ký

| | |
|---|---|
| Thao tác | Tìm nút **"Chốt toàn bộ dữ liệu trình ký"** |
| ⚠️ Kỳ vọng theo mã nguồn | **Không tìm thấy** — nó nằm trong tab *Kết quả thầu & giỏ rớt* đã bị gỡ khỏi mảng `TAB` ngày 24/08 (mục 1.4) |
| Việc phải làm | Đi hết Bàn điều hành (cả hai tab), bảng Tổng hợp, thanh sidebar. Nếu thật sự không có, ghi thành **thiếu sót chặn go-live** — chốt trình ký là nơi duy nhất **khoá cứng 2** được thi hành và là điều kiện của Excel chính thức + kích hoạt 30% |
| Cách xem hệ quả mà không cần nút | Bộ A (#166) đã chốt trình ký bằng script: mở Tổng hợp gói con của bộ A → nút xuất phải ghi **"Xuất Excel CHÍNH THỨC (rev 1)"**, tooltip nói số lượng là **số trúng đã phân bổ sau thầu** |

---

### VÒNG D — Chức năng mới hai ngày 24–25/08 (gom lại để kiểm nhanh)

Phần lớn đã nằm trong vòng C. Bảng này để **không sót cái nào**.

| Mã | Việc | Ở bước nào | Dấu hiệu sai |
|---|---|---|---|
| D1 | **Miếng 1c** — lưu bản chia còn thiếu, chặn bản dư | C4 | lưu được bản dư, hoặc không lưu được bản thiếu |
| D2 | **Miếng 1c** — băng đếm + nút lọc | C3 | không có băng, hoặc lọc xong kẹt bảng rỗng |
| D3 | **Miếng 1d** — Enter / Shift+Enter / Esc / Ctrl+Enter | C4 | **phải gõ tay**, chưa ai đo bằng bàn phím thật |
| D4 | **Hai màn Excel mở tab riêng**, dùng lại đúng tab cũ | B1, B2 | mở trong tab hiện tại; hoặc hai khoa khác nhau giành một tab |
| D5 | **Cột "Đã đưa đi"** trong bảng chia | C4, C5 | không có cột → PĐD thấy số nhỏ đi mà không hiểu vì sao |
| D6 | **Trọng số chia trừ phần đã đưa đi** (`patch_zzzzzt`) | C5, C7 | `giữ + đã đưa đi > Q + nhận` |
| D7 | **Cổng chặn "đổ quá tay"** ở cả hai cổng | C7 | cổng báo 0 mà DB có dòng vượt |
| D8 | **Chế độ gõ rớt** — ẩn nhóm lịch sử/phân nhóm/thương mại, giữ 14 cột | mới | ở màn 1440px phải **lọt trọn, không cuộn ngang**; tự bật một lần khi đã chốt Q; **không đổi file Excel xuất ra** (Excel bám `cotAn`, không bám chế độ) |
| D9 | **Cột "Khoa · tổng" bẻ đôi con số** (sửa 25/08) | mới | ở chế độ gõ rớt, cột khoa phải là **hai dòng**: dòng trên `8 khoa`, dòng dưới `960 tổng`. Nếu thấy `96` xuống dòng thành `0` thì lỗi tái phát |
| D10 | **Nút chuyển giai đoạn có CHỮ** | C1 | quay lại biểu tượng 11px |
| D11 | **Bàn điều hành chỉ để xem** | mới | nếu còn tab *Danh mục tổng hợp* / *Kết quả thầu* thì QĐ A2 bị lật |
| D12 | **Khoa thấy kết quả thầu trên danh mục của mình** | sau C8 | nhãn *"Rớt N ở \<giai đoạn\> · trúng M"*, tooltip đủ **số mang đi thầu / trúng / thiếu / lý do**. Nút *"Đẩy SL"* của khoa phải **TẮT** |
| D13 | **Gói 30% chỉ giữ mã ĐÃ TRÚNG** (D13) | vòng F | mã rớt sạch **biến mất** khỏi danh sách, không hiện dòng trần 0 |
| D14 | **Phân trang song song `fetchAllRows`** | B1 | bảng 340 mã hiện 157 mã mà không báo lỗi |
| D15 | **Tốc độ sau vá RLS** | B1 | mở bảng 340 mã > 10 s |

---

### VÒNG E — Pipeline gói bổ sung đi lại từ đầu

Yêu cầu của mục 6.3: đề xuất bổ sung đi **pipeline đầy đủ**, y như gói gốc.
Chạy trên **đợt #103 / dgid 387 (T9/2027)** — rỗng, mở, cả ba khoa test đã được
gán. Sân này sạch nên cũng là chỗ tốt để đo lại nửa "cột SỐ" của vòng B trên nền
không có dữ liệu cũ.

| Mã | Bước | Kỳ vọng | Sai thì |
|---|---|---|---|
| E1 | Khoa lập đề xuất mới (`Function1`) | Chọn mã quản lý → chọn **một ĐVT chuẩn**, nhập hệ số cho ĐVT còn lại → thấy lịch sử 24 tháng + P50/P75/P90/P95/TSB → chốt tổng ở **cấp mã quản lý** → phân bổ xuống mã hàng | Nhóm trộn nhiều ĐVT mà **không** bị chặn tới khi nhập đủ hệ số = có nguy cơ cộng thô ĐVT khác nhau |
| E2 | Khoá cứng 1 | Tổng mã hàng **sau quy đổi** phải đúng bằng số đã chốt, lệch là chặn | không chặn = số trên giấy trình ký sai |
| E3 | Ngưỡng lý do | Chỉ **> P75** mới bắt lý do. Dưới P50 **không hỏi gì** | bắt lý do ở P50–P75 = luật cũ đã bị đảo 17/08 |
| E4 | Số gợi ý | **Không tự điền vào ô**; phải bấm mới vào. Không có nút "đồng ý một chạm" | tự điền = phá nguyên tắc 1 |
| E5 | Thêm cả mã quản lý vào giỏ | Một transaction; giỏ sống qua F5/đăng xuất; mọi tài khoản **cùng khoa** thấy chung giỏ (thử `dvsd1` và `phongmo`) | giỏ chỉ thấy ở một tài khoản = khoá theo email thay vì theo khoa |
| E6 | Gửi giỏ | **Gửi là chính thức**, không có bước PĐD duyệt giỏ. Mã quản lý **ẩn khỏi danh sách của khoa** sau khi gửi | còn nút chờ duyệt = dựng lại thứ đã bỏ 05/08 |
| E7 | Cảnh báo mã trùng đợt | Hiện mã đang có ở đợt nào, số lượng, tiến độ — **cảnh báo, không chặn** | chặn = sai mục 1.3 |
| E8 | Vòng xác nhận lần N | Khoa xác nhận → PĐD sửa → xác nhận **hết hiệu lực**, khoa bấm lần N+1. **Không giới hạn số lần** | có giới hạn = sai invariant 21 |
| E9 | Không phát sinh nhu cầu | Đường thứ hai của Giai đoạn 3 phải bấm được và tính vào cổng chốt | |
| E10 | PĐD hiệu chỉnh trên Tổng hợp | `#tong-hop-pdd/bs-t9/103` — lặp B10, B11 trên nền sạch | |
| E11 | Chốt số đi thầu | Cổng cứng như B14 | |
| E12 | Ba giai đoạn + rớt + chia + đổ + xác nhận rớt | **Giống hệt** gói 18T | khác đường = pipeline bổ sung không độc lập |
| E13 | Mã rớt của đợt bổ sung lại chuyển tiếp tiếp | Sang mốc kế (T1/2028 — hệ **tự tạo** nếu chưa có) | không tự tạo đợt = QĐ D10 mất |
| E14 | Đề xuất bổ sung **không** bị giới hạn bởi số đã rớt | Khoa đề xuất nhiều hơn / ít hơn / bằng đều được. **Không áp** P50/P75/P90/P95, không trần theo số cũ | có trần = sai invariant 15 |
| E15 | Pipeline bổ sung **không chặn** việc chốt kết quả của gói gốc | Chạy song song được | |

---

### VÒNG F — Các màn ngoài pipeline và màn chỉ để xem

| Mã | Màn | Sân | Kỳ vọng | Sai thì |
|---|---|---|---|---|
| F1 | **Tổng hợp kết quả thầu** (`TongHopKetQuaThau`) | bộ A | 35.274 dòng, mở được, có `ket_qua_id` để sắp xếp khi phân trang | lỗi `42703 ket_qua_id does not exist` = view lại rớt cột |
| F2 | **Giỏ rớt của khoa** (`GioRotCuaKhoa`) | bộ A, vai khoa | Hiện phần chưa được đáp ứng; khoa đánh dấu đề xuất lại hay thôi; có đường **dẫn sang đợt bổ sung** | không có đường sang đợt bổ sung = khoa phải tự đi tìm |
| F3 | **Gói tùy chọn mua thêm 30%** | bộ A (đã chốt trình ký) | Trần = `floor(số trúng đã phân bổ × 30%)`, **làm tròn xuống**; tính ở cấp **khoa × mã quản lý**; **chỉ mã ĐÃ TRÚNG** mới có mặt (D13); nút kích hoạt **chỉ sáng sau chốt trình ký** | thấy mã rớt sạch với trần 0 = D13 bị lật; kích hoạt được trước chốt trình ký = sai invariant 18 |
| F4 | Kích hoạt 30% nhiều lần | bộ A | Tổng các lần kích hoạt **không vượt trần** — chưa ai chạy lần nào, đây là lần đầu | vượt trần = không có phép cộng dồn |
| F5 | **Tiến độ sử dụng theo cam kết** | bộ A | 15.889 dòng; hai cảnh báo **tách bạch**: *chậm cam kết* và *sắp hết sớm*; PĐD sửa được ngưỡng 20/50/80 ngay trên web | màn rỗng = view lại đọc bảng chết. Băng "sắp hết hàng" biến mất = view rớt 5 cột (`sl_de_xuat`, `tb_thang`, `con_lai`, `thang_con_lai`, `ngay_du_kien_het`) và component **nuốt lỗi** |
| F6 | Mốc cam kết theo **ngày hàng về thật** | — | **KHÔNG kiểm được** — `giao_hang` 0 dòng, 100% dòng đang lấy mốc `chot_trinh_ky` | ghi vào mục "chưa kiểm được" |
| F7 | **Sổ thiếu hàng** | — | Chỉ test đường tạo mới: ghi số yêu cầu / số được cấp / ca hoãn / mã thay thế | |
| F8 | **Mã kỹ thuật khoa tự thêm** → **Duyệt mã kỹ thuật** | tự dựng | Khoa tạo 1 đề nghị → badge *Chờ duyệt* lên 1 → PĐD gán mã hàng/mã quản lý → duyệt / từ chối kèm lý do | badge không lên = `demViecChoDuyet` không đếm |
| F9 | **Điều chỉnh tiêu chí kỹ thuật** | tự dựng | Khoa đề nghị sửa TSKT → PĐD duyệt (`duyet_sua_tieu_chi`) | |
| F10 | **Cam kết của khoa** (Word/Excel) | bộ B | Bấm là **sinh file ngay**, không cần điều kiện chốt, không đổi trạng thái workflow, **không lưu file nhị phân trên web**. File in **revision + thời điểm sinh** | có trạng thái chờ duyệt = dựng lại vòng đời đã bỏ 17/08 |
| F11 | **Lịch sử hồ sơ đề xuất** | sau F10 | Có dòng mới sau khi xuất ở F10 | vẫn 0 dòng = không ghi `lan_xuat_ho_so` |
| F12 | **Xuất Excel** từ bảng Tổng hợp | bộ B (nháp) + bộ A (chính thức) | Trước chốt trình ký chỉ ra **bản nháp**; sau thì **chính thức có revision**. Excel bám cấu hình **ẩn cột**, **không** bám chế độ gõ rớt | chế độ gõ rớt làm đổi file = lăng kính xem bị rò sang đầu ra |
| F13 | **Quản lý đợt** · **Phân gói con** · **Quản trị người dùng** · **Nạp dữ liệu sử dụng** | có dữ liệu | Mở được, không lỗi console. **Đừng** đổi vai trò tài khoản test, **đừng** nạp file HIS mới | |
| F14 | **Phân gói con** | 1.367 mã quản lý | 3 mã đang vắt ngang gói con (`N03.03.050.07` · `N05.02.030.14` · `N07.03.020.01`) — invariant 2 chưa đạt, **để nguyên theo ý chủ dự án** | đừng "sửa hộ" |
| F15 | **RLS hai vai** | bộ B | Vai khoa gõ tay URL của khoa khác: `#danh-muc-de-xuat/18t-dung-chung/Khoa%20Noi%20soi/168` → **không đọc được dòng khoa khác**. Vai khoa gõ `#tong-hop-pdd/...` → màn báo *"chỉ dành cho Phòng Điều dưỡng/admin"* | đọc được = rò rỉ RLS. Ba bảng `chuyen_so_rot_v3` · `chuyen_tiep_rot_v3` · `giao_hang` từng để khoa đọc dòng của cả 50 khoa (vá 25/08 bằng `patch_zzzzzq`) — kiểm lại đúng ba bảng này |

---

### VÒNG G — Dữ liệu sau đấu thầu (chỉ CLI, không có màn)

Không có màn nào trên web đọc `hop_dong_v3` / `giao_hang`. Kiểm bằng CLI.

```bash
cd /Users/tranhien/Downloads/9.vtyt/backend
set -a && . ./.env.local && . ../frontend/.env && set +a
.venv/bin/python scripts/kiem_mau_gom_du_lieu.py \
    ../database/MAU_GOM_DU_LIEU_SAU_THAU.xlsx --xac-nhan-staging
```

| Mã | Việc | Kỳ vọng |
|---|---|---|
| G1 | Biểu mẫu mở được, 3 sheet `HOP_DONG` · `HOP_DONG_MA_HANG` · `GIAO_HANG` | header khớp khai báo; **không có cột nào chứa `gia` / `tran` / `tien`** |
| G2 | Chạy `kiem_mau_gom_du_lieu.py` trên file mẫu trống | chạy được, không nổ |
| G3 | Tự điền vài dòng **cố ý sai** | bắt đủ **12 phép**: hợp đồng mồ côi · số HĐ lặp · mã hàng không có trong danh mục · khoa sai tên · gói con sai · không có đợt khớp · ngày sai dạng · hết hạn trước ngày ký · số âm · mã ghi hai lần trong một HĐ · giao trước ngày ký · giao vượt cam kết. **Ba phép cuối là cảnh báo**, không chặn |
| G4 | Nạp thử vào bộ **A** (`nap_du_lieu_sau_thau.py`) | kiểm trước nạp sau · một transaction · **từ chối nạp lại** nếu sẽ nhân đôi dòng giao |
| G5 | Sau khi có ≥1 dòng `giao_hang`, mở lại màn **Tiến độ sử dụng** | cột `nguon_moc` phải đổi từ `chot_trinh_ky` sang mốc **ngày hàng về thật** cho mã đó — đây là phép thử duy nhất của `patch_zzzzzk` |

⚠️ G4/G5 **làm bẩn bộ A**. Bộ A dựng lại được, cứ làm.

---

### VÒNG H — Dọn dẹp và trả staging về nền

| Mã | Việc |
|---|---|
| H1 | Bỏ mọi 📌 / 🔒 đã bật ở B8 — cấu hình cột dùng chung toàn viện |
| H2 | Bấm **Bỏ sửa đè** cho mọi ô chữ đã gõ `TEST-…` ở B4/B5/B6 (xoá hẳn dòng override) |
| H3 | Nếu đã mở chốt Q ở đâu (B13, B14) thì **chốt lại** |
| H4 | Dựng lại **bộ B**: `--bo B` (28 s) — và **ghi lại id đợt mới** cho chủ dự án |
| H5 | Dựng lại **bộ A** nếu đã nạp dữ liệu sau thầu: `--bo A` |
| H6 | Chạy lại **A1–A6** để chắc không có gì hỏng sau một ngày bấm |
| H7 | Đếm lại 33 bảng nghiệp vụ, đối chiếu với số ghi ở mục 0.2 |

---

## 4. Ba chỗ rủi ro nhất

### 1. Đuôi pipeline mất nút — chốt trình ký không bấm tới được

Đọc mã nguồn: ngày 24/08 gỡ hai tab *Danh mục tổng hợp* và *Kết quả thầu & giỏ
rớt* khỏi mảng `TAB` của Bàn điều hành, nhưng **ba chức năng còn sống trong tab
bị gỡ** không được dời đi đâu cả: **Chốt toàn bộ dữ liệu trình ký**, **chốt/mở
chốt trình ký từng bảng khoa**, **Giỏ rớt toàn viện**. `setTab` chỉ được gọi từ
chính mảng `TAB` nên hai nhánh kia là mã chết.

Hậu quả dây chuyền: chốt trình ký là nơi **duy nhất** khoá cứng 2 được thi hành,
và là điều kiện của Excel chính thức + kích hoạt 30% + gói 30% chỉ giữ mã đã
trúng. Bộ A đã chốt bằng script nên nhìn qua thì "mọi thứ có dữ liệu" — đúng
kiểu ngụy trang của bẫy thứ năm (*"màn này hiện rỗng, chắc chưa ai dùng"*), lần
này là *"chức năng này có dữ liệu, chắc bấm được"*.

**Việc phải làm:** bước C12 đi hết mọi màn tìm nút đó. Nếu không có, đây là
thiếu sót **chặn go-live**, không phải việc để sau.

### 2. Ba cửa vào danh mục khoa sinh ba `goi_id` khác nhau

`danh_muc_tong_hop_o` khoá theo `goi_id = "<goiId>:dot:<dotId>"`, mà ba đường
vào sinh ba `goiId`:

| Cửa | Ra |
|---|---|
| Menu *Danh mục đề xuất của khoa* | gói bổ sung → **`bo-sung`** |
| Nút trong *Đề xuất số lượng* / *Đề xuất của tôi* | **không truyền `dotId`** → scope không có `:dot:N` |
| PĐD mở từ Bàn điều hành | gói bổ sung → **`bs-t9`** |

Với gói 18T hai cửa đầu tương đối khớp; với **gói bổ sung thì lệch hẳn**. Nếu
đúng như đọc, PĐD sửa cột chữ ở `bs-t9:dot:69` mà khoa mở ra ở `bo-sung:dot:69`
sẽ **không thấy gì** — và cả hai bên đều không có báo lỗi nào, đúng lớp lỗi im
lặng đã cắn dự án bốn lần. Bước **B3** là phép thử quyết định.

### 3. Luật "sửa số sau chốt Q bằng gõ đè tại chỗ" chưa thi công

QĐ 21/08 nói rõ: sau chốt Q, PĐD **gõ đè thẳng tại ô kèm lý do**, *"không phải
mở chốt cả gói con — mở chốt cả gói làm toàn bộ DOT_GOI mất trạng thái chỉ vì
sửa một ô"*. Nhưng trigger `fn_khoa_phan_bo_sau_chot_q` chặn **mọi** ghi vào
`phan_bo_khoa` khi còn `chot_q_phien` hiệu lực, và không hàm nào
(`sua_so_luong_khoa_v3`, `cap_nhat_tong_phan_bo_khoa`) có đường vòng. Giao diện
cũng ẩn nút *Sửa phân bổ theo khoa* khi đã chốt. Đường duy nhất còn lại là **Mở
chốt để sửa** — đúng thứ QĐ 21/08 muốn bỏ.

Rủi ro thật không nằm ở chỗ "thiếu tính năng" mà ở chỗ **bộ B đã chốt Q toàn
bộ**: nghĩa là nửa quan trọng nhất của phần trọng tâm (hai bên tranh nhau sửa
**số**) không có sân nào trên bộ B để đo, và người test dễ kết luận "chạy đúng"
chỉ vì mọi thứ đều bị chặn. Đó là lý do kế hoạch này tách sân ở **B0b** thay vì
chạy tất cả trên bộ B.

---

## 5. Bảng tổng kết phép kiểm tự động (dán lại cho tiện)

```bash
cd /Users/tranhien/Downloads/9.vtyt/backend
set -a && . ./.env.local && . ../frontend/.env && set +a

.venv/bin/pytest -q                                                    # 215 passed
.venv/bin/python scripts/kiem_moi_man.py --xac-nhan-staging            # 3 vòng xanh, 298 cột
.venv/bin/python scripts/smoke_workflow_v3_staging.py --xac-nhan-staging   # 29/29
.venv/bin/python scripts/kiem_do_ma_tuong_duong.py --xac-nhan-staging      # 8/8
.venv/bin/python scripts/kiem_truoc_deploy.py                          # Sạch

cd ../frontend
npm run build                                                          # ✓
npm run test:formula                                                   # 5 file OK
npm run preview                                                        # → :4173
```

Không bắt buộc nhưng đáng chạy một lần trước khi kết luận về hiệu năng:

```bash
cd ../backend
.venv/bin/python scripts/test_full_pipeline_quy_mo_that.py --xac-nhan-staging
# cả hai đường (18T 5 gói con + bổ sung), mốc hiện tại ~154 giây, không lỗi
```

⚠️ Script này chạy trên **bộ A** và đưa nó đi hết pipeline — chạy xong bộ A **đã
bẩn**. Dựng lại bằng `--bo A`. Nó **không đụng bộ B**.

Ba mốc thời gian đáng đối chiếu (đo 25/08, trên bản build thật):

| Việc | Mốc |
|---|---|
| Mở bảng Tổng hợp 340 mã | **~4,9–5,7 s** (đầu ngày 25/08 là 15,9 s) |
| Mở Danh mục đề xuất của khoa, 93 dòng | ~4,6 s |
| Chia một mã × 50 khoa | 0,24–0,35 s |
| Đọc bảng chia 50 dòng | 0,38 s |
| Chốt trình ký 50 khoa, mỗi gói con | 5,5–6,6 s |
