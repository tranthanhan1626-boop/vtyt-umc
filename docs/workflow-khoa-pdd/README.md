# Workflow Khoa ↔ Phòng Điều dưỡng

Bộ sơ đồ này mô tả workflow hiện hành của nhánh `phase-a-luong-de-xuat`
trên staging, dựa trên code frontend, SQL/RLS/RPC, contract tests, smoke hiện
hành và tài liệu nghiệp vụ trong `Tổng quan/`.

## File bàn giao

| File | Mục đích |
|---|---|
| `workflow-khoa-pdd.drawio` | Workbook chỉnh sửa trực tiếp trên diagrams.net, gồm 4 trang |
| `workflow-overview.png` / `.svg` | Swimlane tổng quan Khoa ↔ PĐD |
| `workflow-khoa.png` / `.svg` | Workflow chi tiết phía Khoa |
| `workflow-pdd.png` / `.svg` | Workflow chi tiết phía PĐD |
| `workflow-knowledge.png` / `.svg` | Knowledge graph thực thể, checkpoint và vòng lặp |
| `workflow-*.mmd` | Mermaid source để sửa nhanh bằng văn bản |
| `generate-diagrams.mjs` | Nguồn sinh lại Draw.io, SVG và Mermaid |

## Cách chỉnh sửa

### Draw.io — khuyến nghị

1. Mở <https://app.diagrams.net/>.
2. Chọn **File → Open From → Device**.
3. Mở `workflow-khoa-pdd.drawio`.
4. Workbook có 4 page ở thanh tab dưới cùng: Tổng quan, Khoa, PĐD và
   Knowledge graph.
5. Mỗi node, nhãn và connector đều là phần tử rời, có thể kéo, đổi chữ,
   đổi màu hoặc thêm nhánh.

### Mermaid

Mở một file `workflow-*.mmd` trong Mermaid Live Editor, VS Code hoặc bất kỳ
Markdown editor nào có Mermaid. Đây là bản gọn hơn, phù hợp khi muốn sửa
workflow bằng text và quản lý diff trong Git.

### Sinh lại file từ nguồn

```bash
node docs/workflow-khoa-pdd/generate-diagrams.mjs
```

Lệnh trên ghi đè workbook Draw.io, SVG và Mermaid. Không chạy lệnh này sau
khi đã sửa thủ công workbook nếu chưa chuyển thay đổi ngược vào script.

## Cách đọc sơ đồ

- Xanh ngọc: thao tác hoặc dữ liệu thuộc Khoa/ĐVSD.
- Xanh dương: thao tác PĐD.
- Tím: hệ thống, DB, trigger hoặc đồng bộ.
- Đỏ: nhánh rớt thầu hoặc lỗi mô hình nghiêm trọng.
- Cam nét đứt: vòng lặp, checkpoint còn thiếu hoặc phần chưa nối đủ.
- Cạnh liền: đã có đường thực thi trong code.
- Cạnh nét đứt: cần tải lại, là hành vi vòng lặp, hoặc chưa được triển khai
  end-to-end.

## Mô hình nghiệp vụ cốt lõi

Phạm vi đúng của một workflow là:

```text
DOT_GOI = dot_id × goi_id
```

- `dot_id` xác định kỳ/đợt thực tế.
- `goi_id` xác định gói con/biểu mẫu. Một đợt 18 tháng có 5 gói con đi thầu
  riêng.
- Code hiện chưa có thực thể `DOT_GOI` thống nhất; đây là seam đỏ chính trên
  knowledge graph.

Workflow không phải một state machine duy nhất. Có ít nhất ba checkpoint
nghiệp vụ độc lập:

1. `KHOA_READY`: Khoa chốt danh mục; Khoa hoặc PĐD có thể mở lại.
2. `TENDER_INPUT_FROZEN`: PĐD đóng băng số mang đi thầu.
3. `TENDER_RESULT_FINALIZED`: chốt kết quả sau ba giai đoạn và sau khi xử lý
   mã rớt.

Checkpoint số 3 chưa có entity/cờ độc lập. Cờ chốt hiện tại đang bị dùng lẫn
giữa “chốt số đi thầu” trên UI và “chốt sau đấu thầu” trong tài liệu.
Trạng thái `dot_de_xuat.mo/dong` chỉ là cổng nhận đề xuất, không thay thế ba
checkpoint này.

## Workflow hiện hành theo hai đơn vị

### Khoa / ĐVSD

1. Chọn đợt đang mở và gói con.
2. Chọn mã quản lý, ĐVT chuẩn và hệ số quy đổi.
3. Xem TSB 24 tháng cùng P50/P75/P90/P95; chốt tổng mã quản lý.
4. Phân bổ xuống mã hàng; tổng sau quy đổi phải khớp tuyệt đối.
5. Lưu giỏ server; account khác cùng Khoa nhìn thấy cùng giỏ.
6. Gửi giỏ bằng transaction. Đây là đề xuất chính thức, không có bước PĐD
   duyệt giỏ.
7. Tạo Word cam kết; hoàn thiện Danh mục Khoa, audit và chốt/mở chốt.
8. Nhận kết quả rớt:
   - rớt một phần: chuyển số lượng sang SKU tương đương cùng mã quản lý;
   - rớt cả nhóm: chọn đợt bổ sung, đưa vào giỏ và submit vòng mới.
9. Theo dõi hợp đồng, hàng về, sử dụng; báo thiếu hàng hoặc sự kiện nhu cầu.

### Phòng Điều dưỡng

1. Tạo, mở hoặc đóng đợt.
2. Bàn điều hành chọn đợt + gói con, theo dõi Khoa đã đề xuất/đã có Word/đã
   chốt và nhắc phần còn thiếu.
3. Tổng hợp theo mã hàng, drill-down đóng góp từng Khoa.
4. Sửa đè, khóa dòng/cột, audit, xuất Excel và Word đề nghị mua.
5. Theo dõi ba giai đoạn chào giá → mở thầu → đánh giá; chỉ tích mã rớt.
6. Theo dõi giỏ rớt toàn viện và chờ Khoa chuyển số lượng hoặc sang bổ sung.
7. Chốt, tạo kết quả mặc định trúng và 5 mốc theo dõi; lưu ý phạm vi chốt
   hiện vẫn chưa cô lập đúng từng `DOT_GOI`.
8. Hoàn thành ký hợp đồng, hàng về đợt đầu; nạp HIS, chỉnh ngưỡng và giám sát
   cam kết sử dụng.
9. Xử lý các sổ thiếu hàng, sự kiện nhu cầu và yêu cầu mã kỹ thuật.

## Phát hiện quan trọng khi đối chiếu toàn dự án

| Mức | Điểm cần xử lý | Hiện trạng |
|---|---|---|
| P0 | Chốt sai phạm vi | `danh_muc_dot_chot` chỉ khóa `dot_id`; chốt một gói con 18T có thể tác động mọi proposal của cả đợt |
| P0 | Split-brain khóa dữ liệu | PĐD ghi override bằng `goi_id:dot:dot_id`; màn Khoa và view số chốt còn đọc `goi_id` tĩnh |
| P0 | Hai hệ chốt cũ/mới | Chốt mới theo dot tạo tracker/winner; trigger khóa override, `da_di_thau` và view `da_chot` còn bám bảng gói+năm cũ |
| P0 | Proposal version chưa theo đợt | Current-version dùng mã hàng + Khoa + năm, thiếu `dot_id`; submit đợt sau cùng năm có thể làm đợt trước mất dòng current |
| P0 | Thiếu checkpoint kết quả cuối | Chưa tách `TENDER_INPUT_FROZEN` và `TENDER_RESULT_FINALIZED` |
| P0 | Tổng PĐD chưa chia ngược | Override tổng toàn viện chưa phân bổ lại xuống proposal từng Khoa; số đi thầu và số giám sát có thể lệch |
| P0 | Hồ sơ Word chưa khép kín | UI tạo một Word nhưng RPC chuyển trạng thái vẫn đòi bộ hai tài liệu; tạo Word đã được smoke, gửi/xét chưa được chứng minh end-to-end |
| P1 | Đồng bộ không realtime | Các màn chủ yếu tải lại từ DB; không có subscription push `postgres_changes` cho luồng tổng hợp |
| P1 | Quy tắc số lượng lệch tài liệu | Code chỉ bắt lý do + ghi chú khi lớn hơn P75; dưới P50 vẫn nhận, trong khi tài liệu ghi ngoài P50–P75 phải giải trình |
| P1 | Trần 30% lệch cấp | Tài liệu tính theo tổng mã quản lý; RPC/UI hiện tính theo từng proposal/SKU |
| P1 | Cờ Khoa đã chốt thiếu dot | Key chốt Khoa là gói+năm+Khoa; Bàn PĐD còn map theo Khoa nên có thể báo chốt nhầm gói/đợt |

## Nguồn đối chiếu chính

### Frontend

- [App.jsx](../../frontend/src/App.jsx): actor, route và dashboard theo vai trò.
- [KhungGoiThau.jsx](../../frontend/src/features/KhungGoiThau.jsx): gói, gói con và menu của Khoa/PĐD.
- [Function1.jsx](../../frontend/src/features/Function1.jsx): công thức, phân bổ, giỏ và submit transaction.
- [DanhMucDeXuatKhoa.jsx](../../frontend/src/features/DanhMucDeXuatKhoa.jsx): danh mục Khoa, audit, chốt và xử lý rớt một phần.
- [BanDieuHanhPdd.jsx](../../frontend/src/features/BanDieuHanhPdd.jsx): dashboard 62 Khoa, tổng hợp, kết quả và giỏ rớt.
- [TongHopPdd.jsx](../../frontend/src/features/TongHopPdd.jsx): override/lock/chốt tổng hợp và scope `goi:dot:id`.
- [TienDoGoiThau.jsx](../../frontend/src/features/TienDoGoiThau.jsx): ba giai đoạn, hợp đồng, hàng về và vòng bổ sung.
- [TienDoSuDung.jsx](../../frontend/src/features/TienDoSuDung.jsx): giám sát từ số trúng và HIS.
- [XuatHoSo.jsx](../../frontend/src/features/XuatHoSo.jsx) và [HoSoTrucTuyen.jsx](../../frontend/src/features/HoSoTrucTuyen.jsx): Word và lifecycle hồ sơ.

### SQL, RLS và smoke

- [patch_x2_de_xuat_theo_ma_quan_ly.sql](../../backend/sql/patch_x2_de_xuat_theo_ma_quan_ly.sql): submit nhóm và gắn đợt.
- [patch_zj_ban_dieu_hanh_pdd.sql](../../backend/sql/patch_zj_ban_dieu_hanh_pdd.sql): chốt Khoa, đánh dấu/bỏ mã rớt theo đợt.
- [patch_zs_so_chot_va_khoa_sau_chot.sql](../../backend/sql/patch_zs_so_chot_va_khoa_sau_chot.sql): override, nguồn số chốt và khóa theo bảng cũ.
- [patch_zz_tach_ky_goi_va_thong_bao_rot.sql](../../backend/sql/patch_zz_tach_ky_goi_va_thong_bao_rot.sql): chốt theo `dot_id` và quyền mua thêm.
- [patch_zzz_mac_dinh_trung_va_hang_ve.sql](../../backend/sql/patch_zzz_mac_dinh_trung_va_hang_ve.sql): trigger tạo tracker, 5 mốc và kết quả mặc định trúng.
- [patch_zg_cho_phep_day_sl_ghi_ket_qua.sql](../../backend/sql/patch_zg_cho_phep_day_sl_ghi_ket_qua.sql): chuyển số lượng rớt và xác nhận bổ sung.
- [smoke_pipeline_hien_tai.py](../../backend/scripts/smoke_pipeline_hien_tai.py): tuyến smoke được coi là hiện hành, nhưng phần chốt vẫn dùng bảng gói+năm cũ.

### Tài liệu nghiệp vụ

- [00_BAT_DAU.md](../../Tổng%20quan/00_BAT_DAU.md): điểm vào và tuyến hiện hành.
- [01_NGHIEP_VU_VA_QUYET_DINH.md](../../Tổng%20quan/01_NGHIEP_VU_VA_QUYET_DINH.md): quyết định nghiệp vụ, gói con, xử lý rớt và chốt sau thầu.
- [05_TIEN_DO_VA_VIEC_TIEP_THEO.md](../../Tổng%20quan/05_TIEN_DO_VA_VIEC_TIEP_THEO.md): phần đã làm, phần cũ và công việc còn mở.

## Phạm vi không đưa vào luồng chính

- Luồng PĐD duyệt giỏ proposal cũ; submit hiện là chính thức.
- `phien_tong_hop` và snapshot tổng hợp cũ.
- Màn “Quá trình đề xuất Excel 50–70 cột” đã bị gỡ.
- Smoke cũ còn duyệt proposal hoặc bắt Word + Excel.
- `proposals.trang_thai = xet_duyet/hoan_thanh/tu_choi` là lifecycle legacy;
  không dùng nó làm trục chính của workflow mới.

Các phần legacy vẫn còn trong SQL/test để tương thích hoặc chưa dọn, nên nếu
chỉ tìm theo tên trạng thái mà không kiểm route hiện hành sẽ dễ dựng nhầm
workflow.
