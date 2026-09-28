"""Khẳng định các vá vòng 3 (28/09/2026) — Q05, L15, Q06, L08b, Q04, L14.

Test chỉ đọc văn bản (jsx), không chạm DB, không chạy build/preview.
Nguồn quyết định: `.scratch/test-toan-bo/SO_CHUNG.md` mục 15 và
`.scratch/test-toan-bo/KIEM_DINH_DOC_LAP.md` #2, #3, #4, #8, #11, #18.

- Q05: TongHopKetQuaThau.jsx phải đọc trạng thái từ `giai_doan_thau_v3`
  (cột `trang_thai`) để chỉ hiện gói con đã hoàn thành đủ ba giai đoạn thầu,
  và phải gộp theo cặp (dot_goi_id, ma_hang) — không chỉ ma_hang — để không
  trộn hai đợt/gói con cùng mã hàng.
- L15: dòng "Trúng một phần" (`trung_mot_phan`) cũng phải hiện "Rớt ở … · lý
  do" khi có `ly_do_khong_trung`, không chỉ riêng "Không trúng".
- Q06: `taiSuaDeCuaPdd` (DanhMucDeXuatKhoa.jsx) khi có `dotId` phải lọc đúng
  đợt bằng `.eq("goi_id", goiScopeTongHop)` ở ngay truy vấn — cùng cách bản vá
  L05 đã làm ở hàm `xemAudit` — thay vì lấy mọi đợt rồi tự chọn ưu tiên.
- L08b: GioRotCuaKhoa.jsx phải hiện ĐÚNG đợt bổ sung thật của từng mục (đọc
  `chuyen_tiep_rot_v3`), bỏ hẳn cách đoán "đợt sớm nhất đang mở" của Q03.
- Q04: GioRotCuaKhoa.jsx phải đọc `proposals` để biết khoa đã GỬI mã rớt ở
  đợt bổ sung đích chưa (is_current, da_rut) — chỉ đọc, không thêm nút.
- L14: câu đầu màn Giỏ rớt của khoa không còn khẳng định tuyệt đối, và không
  còn gọi nhầm nút "Gửi giỏ" (tên thật: "Gửi đề xuất").
- L16 (vòng 3b, R3b.md): lỗi THAO TÁC (đổi giai đoạn thầu, xác nhận rớt, chia
  theo tỉ lệ Q) không còn đổ vào `loi` (trang lỗi toàn màn) của TongHopPdd.jsx
  — chuyển sang `loiO` (dải báo lỗi cục bộ có sẵn trên thanh công cụ).
- L17 (vòng 3b, R3b.md): "CHỐT TRÌNH KÝ TOÀN BỘ" (ChotTrinhKyTongHop,
  CumThauTongHop.jsx) phải kiểm khoá cứng 2 (`v_phan_bo_trung_theo_ma_v3.da_khop`)
  TRƯỚC vòng lặp chốt từng khoa (`chot_trinh_ky_khoa_v3`) để không để gói kẹt
  nửa chốt khi `chot_trinh_ky_toan_bo_v3` từ chối ở bước cuối.
"""
import re
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
FE = GOC.parent / "frontend" / "src" / "features"
KET_QUA_THAU = FE / "TongHopKetQuaThau.jsx"
DANH_MUC_DE_XUAT_KHOA = FE / "DanhMucDeXuatKhoa.jsx"
TONG_HOP_PDD = FE / "TongHopPdd.jsx"
CUM_THAU_TONG_HOP = FE / "CumThauTongHop.jsx"


def test_q05_doc_giai_doan_thau_v3():
    text = KET_QUA_THAU.read_text(encoding="utf-8")
    assert '"giai_doan_thau_v3"' in text
    assert "hoan_thanh" in text


def test_q05_gop_theo_dot_goi_id_va_ma_hang_khong_chi_ma_hang():
    """Gộp phải dùng khoá kèm dot_goi_id — không còn chỗ nào set()/get() Map
    tầng 1 chỉ bằng r.ma_hang trần (bản cũ, lỗi trộn đợt của KĐ#4)."""
    text = KET_QUA_THAU.read_text(encoding="utf-8")
    assert "r.dot_goi_id" in text
    # Khoá gộp phải ghép dot_goi_id với ma_hang, không phải mỗi ma_hang.
    assert re.search(r"\{r\.dot_goi_id\}.*\{r\.ma_hang\}", text)
    assert "m.set(r.ma_hang" not in text
    assert "m.has(r.ma_hang)" not in text


def test_q05_man_rong_chi_gom_goi_con_da_xong_ba_giai_doan():
    text = KET_QUA_THAU.read_text(encoding="utf-8")
    assert "Chưa có gói con nào hoàn thành đủ ba giai đoạn đấu thầu." in text


def test_l15_trung_mot_phan_cung_hien_rot_o():
    """Trước vá chỉ `r.ket_qua === "khong_trung"` mới hiện "Rớt ở ..."; L15
    yêu cầu thêm nhánh `trung_mot_phan` trong CÙNG một điều kiện (cả hai nối
    bằng `||`, không phải hai khối if tách rời)."""
    text = KET_QUA_THAU.read_text(encoding="utf-8")
    dieu_kien = (
        '(r.ket_qua === "khong_trung" || r.ket_qua === "trung_mot_phan") '
        '&& r.ly_do_khong_trung'
    )
    assert dieu_kien in text
    # Điều kiện phải nằm ngay trước đoạn hiện "Rớt ở ..." (không phải trùng
    # hợp ở chỗ khác trong file).
    idx = text.index(dieu_kien)
    assert "Rớt ở" in text[idx: idx + 400]


def test_q06_taisuadeCuapdd_dung_goiScopeTongHop_trong_truy_van():
    text = DANH_MUC_DE_XUAT_KHOA.read_text(encoding="utf-8")
    m = re.search(r"const taiSuaDeCuaPdd = useCallback\(async[\s\S]*?\n  \}, \[[^\]]*\]\);", text)
    assert m, "không tìm thấy hàm taiSuaDeCuaPdd"
    than_ham = m.group(0)
    assert "goiScopeTongHop" in than_ham
    # Phải có nhánh lọc thẳng bằng .eq("goi_id", ...) khi có dotId (như L05 ở
    # xemAudit), không chỉ lọc lại sau khi đã tải hết bằng .like().
    assert re.search(r'\.eq\(\s*"goi_id"\s*,\s*goiScope\s*\)', than_ham)
    assert "dotId" in than_ham


def test_q06_chu_thich_khong_con_nhac_trigger_da_go():
    """Chú thích cũ nói lấy theo cách trigger `fn_khoa_o_khoa_khi_pdd_da_duyet`
    lấy — trigger đó đã bị gỡ ở patch_zzzzr_v2_cot_chu_mot_gia_tri.sql, không
    còn là nguồn thật. Chú thích mới phải nói rõ hàm đã bị gỡ."""
    text = DANH_MUC_DE_XUAT_KHOA.read_text(encoding="utf-8")
    assert "patch_zzzzr_v2_cot_chu_mot_gia_tri.sql" in text
    assert "ĐÃ BỊ GỠ" in text


# ---------------------------------------------------------------------------
# L08b, Q04, L14 (28/09/2026) — GioRotCuaKhoa.jsx (KIEM_DINH_DOC_LAP.md #2,
# #3, #11).
#
# Test chỉ đọc văn bản GioRotCuaKhoa.jsx, không chạm DB, không chạy
# build/preview/vite.
#
# - L08b: mỗi mục phải hiện ĐÚNG đợt bổ sung thật mà "Xác nhận rớt" đã chuyển
#   tiếp mã của mục đó sang, đọc từ `chuyen_tiep_rot_v3` — không còn đoán
#   "đợt bổ sung gần nhất đang mở" bằng cách sắp xếp `dot_de_xuat` tăng dần.
# - Q04: mục mà khoa đã GỬI đề xuất ở đúng đợt bổ sung đích (đọc `proposals`,
#   `is_current` + `da_rut`) phải được coi là đã xử lý.
# - L14: câu đầu màn không còn khẳng định tuyệt đối "mã rớt đã được đưa vào
#   giỏ"; dòng nhắc giỏ nháp không còn gọi nhầm tên nút "Gửi giỏ".
# ---------------------------------------------------------------------------
GIO_ROT_CUA_KHOA_V3 = FE / "GioRotCuaKhoa.jsx"


def test_l08b_khong_con_doan_dot_som_nhat_dang_mo():
    """Bản vá vòng 1/Q03 từng lấy 'đợt bổ sung gần nhất đang mở' bằng cách sắp
    xếp `dot_de_xuat` theo `nam`/`thang_moc` tăng dần rồi lấy 1 dòng — cách đó
    chỉ đúng tới hết T9/2026 (KIEM_DINH_DOC_LAP.md #3). L08b bỏ hẳn cách đoán
    này."""
    text = GIO_ROT_CUA_KHOA_V3.read_text(encoding="utf-8")
    assert 'from("dot_de_xuat")' not in text
    assert '.order("nam", { ascending: true })' not in text
    assert "dotBoSungMo" not in text


def test_l08b_doc_dung_dot_tu_chuyen_tiep_rot_v3():
    """Đợt của từng mục phải đọc từ `chuyen_tiep_rot_v3.dot_goi_bo_sung_id`,
    nối về mục của màn qua `vat_tu.ma_quan_ly` (không phải theo ma_hang trần,
    vì `v_gio_rot_v3` gộp theo ma_quan_ly)."""
    text = GIO_ROT_CUA_KHOA_V3.read_text(encoding="utf-8")
    assert 'from("chuyen_tiep_rot_v3")' in text
    assert "dot_goi_bo_sung_id" in text
    assert "vat_tu!inner(ma_quan_ly)" in text
    assert "chuyenTiepByKey" in text


def test_q04_doc_proposals_de_xac_dinh_da_gui():
    """Q04: mục coi là đã xử lý khi khoa đã gửi đề xuất chính thức ở đợt bổ
    sung đích — đọc `proposals`, lọc `is_current` và `da_rut`, không thêm nút
    (không có RPC/insert/update mới nào cho việc này)."""
    text = GIO_ROT_CUA_KHOA_V3.read_text(encoding="utf-8")
    assert 'from("proposals")' in text
    assert '.eq("is_current", true)' in text
    assert '.eq("da_rut", false)' in text
    assert "daGuiByKey" in text


def test_q04_da_gui_khong_tinh_vao_chua_xu_ly():
    """Đếm 'Chưa xử lý' phải loại cả mục đã Q04-xử lý (daGuiByKey), không chỉ
    DA_XU_LY (trang_thai cũ)."""
    text = GIO_ROT_CUA_KHOA_V3.read_text(encoding="utf-8")
    m = re.search(r"choXuLy:\s*rows\.filter\([\s\S]*?\)\.length,", text)
    assert m, "không tìm thấy biểu thức tính choXuLy"
    assert "daGuiByKey" in m.group(0)


def test_l14_khong_con_khang_dinh_tuyet_doi_da_dua_vao_gio():
    """Câu đầu màn không còn nói khẳng định vô điều kiện 'Mã rớt đã được đưa
    vào giỏ' — phải có điều kiện (sau khi PĐD xác nhận rớt)."""
    text = GIO_ROT_CUA_KHOA_V3.read_text(encoding="utf-8")
    assert "Mã rớt đã được đưa" not in text
    assert 'Xác nhận rớt' in text


def test_l14_khong_con_goi_nham_gui_gio():
    """Tên nút thật là 'Gửi đề xuất' (Function1.jsx), không phải 'Gửi giỏ'.
    Không còn câu 'Phải gửi giỏ ở đợt bổ sung thì mục này mới đóng lại'."""
    text = GIO_ROT_CUA_KHOA_V3.read_text(encoding="utf-8")
    assert "Phải gửi giỏ ở đợt bổ sung" not in text
    assert "Gửi giỏ" not in text
    assert "Gửi đề xuất" in text


# ---------------------------------------------------------------------------
# L16 (vòng 3b, R3b.md "Lỗi chi tiết") — TongHopPdd.jsx: lỗi THAO TÁC không
# còn đổ vào `loi` (state lỗi TẢI TRANG, render trang lỗi toàn màn thay cho cả
# bảng Tổng hợp). Server từ chối một thao tác ("Chia", "Mở lại…", "Chia theo
# tỉ lệ Q") không còn thay cả màn — chỉ hiện ở dải `loiO` cục bộ có sẵn.
#
# Test chỉ đọc văn bản, không chạm DB, không build/preview.
# ---------------------------------------------------------------------------


def test_l16_khong_con_onloi_do_vao_loi_trang():
    """Bản lỗi: `onLoi={(m) => setLoi(m)}` truyền cho ThanhGiaiDoanThau/
    CumThauTongHop — mọi lỗi đổi giai đoạn thầu hay xác nhận rớt bị server từ
    chối là mất cả màn Tổng hợp (xem crash ở R3b, mục "Lỗi chi tiết")."""
    text = TONG_HOP_PDD.read_text(encoding="utf-8")
    assert "onLoi={(m) => setLoi(m)}" not in text


def test_l16_onloi_dung_loio():
    """onLoi phải đổ vào `loiO` (dải báo lỗi cục bộ trên thanh công cụ), không
    phải `loi` (trang lỗi toàn màn, chỉ dành cho lỗi TẢI TRANG ở taiLai)."""
    text = TONG_HOP_PDD.read_text(encoding="utf-8")
    assert re.search(r"onLoi=\{\(m\)\s*=>\s*setLoiO\(m\)\}", text)


def test_l16_chia_theo_ti_le_dung_loio_khong_dung_loi():
    """Nhánh xử lý lỗi của `chia_theo_ti_le_q_v3` (nút "Chia theo tỉ lệ Q"
    trên dòng, gọi qua onChiaTiLe) là lỗi thao tác — phải dùng setLoiO."""
    text = TONG_HOP_PDD.read_text(encoding="utf-8")
    m = re.search(
        r'p_ma_hang:\s*r\.ma_hang,\s*\}\);\s*setDangChiaTiLe\(""\);'
        r'[\s\S]{0,300}?if \(error\) \{ (set\w+)\(dichLoi\(error\)\); return; \}',
        text,
    )
    assert m, "không tìm thấy khối xử lý lỗi của chia_theo_ti_le_q_v3"
    assert m.group(1) == "setLoiO"


# ---------------------------------------------------------------------------
# L17 (vòng 3b, R3b.md "Lỗi chi tiết" — App crash khi chốt/sửa lúc gói nửa
# chốt) — CumThauTongHop.jsx, ChotTrinhKyTongHop: "CHỐT TRÌNH KÝ TOÀN BỘ" phải
# kiểm khoá cứng 2 (điều kiện của `chot_trinh_ky_toan_bo_v3`, bản mới nhất ở
# backend/sql/patch_zzzzzzd_danh_muc_chuan_theo_ky.sql dòng ~297-308: mọi mã
# `v_phan_bo_trung_theo_ma_v3.da_khop` phải true) TRƯỚC vòng lặp gọi
# `chot_trinh_ky_khoa_v3` cho từng khoa — hàm đó (patch_zzzzd_v3_trinh_ky.sql)
# không tự kiểm khoá cứng 2, nên nếu không chặn sớm, các khoa "còn thiếu" bị
# chốt xong rồi bước "toàn bộ" mới bị từ chối => gói kẹt nửa chốt.
#
# Test chỉ đọc văn bản, không chạm DB, không build/preview.
# ---------------------------------------------------------------------------


def test_l17_ham_kiem_khoa_cung_2_loc_da_khop():
    """Hàm kiểm khoá cứng 2 phải lọc trên đúng trường `da_khop` của `phanBo`
    (bơm từ view `v_phan_bo_trung_theo_ma_v3` — cùng trường server dùng)."""
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    m = re.search(
        r"const timMaLechKhoaCung2 = \(\) => \{([\s\S]*?)\n  \};", text
    )
    assert m, "không tìm thấy hàm kiểm khoá cứng 2 (timMaLechKhoaCung2)"
    assert "!p.da_khop" in m.group(1)


def test_l17_chot_het_kiem_khoa_cung_2_truoc_vong_lap_khoa():
    """Trong hàm `chotHet`, bước kiểm khoá cứng 2 (gọi hàm lọc `da_khop` ở
    trên) phải đứng TRƯỚC lời gọi RPC chốt — và phải DỪNG HẲN (return) khi còn
    mã lệch — không chốt bất cứ khoa nào.

    🔄 28/09/2026 vòng 5 (patch_zzzzzzzk, xem test_vong5_ra_code.py): "vòng
    `for (...) { ... chot_trinh_ky_khoa_v3 ... }`" mà bài test gốc canh không
    còn tồn tại ở CLIENT nữa — server đã gộp cả vòng lặp chốt từng khoa lẫn
    chốt toàn bộ vào MỘT hàm nguyên khối
    (`chot_trinh_ky_toan_bo_nguyen_khoi_v3`), gọi bằng MỘT RPC. Đổi mốc so
    sánh từ "trước vòng lặp chot_trinh_ky_khoa_v3" thành "trước lời gọi RPC
    nguyên khối" — tinh thần bài test (kiểm khoá cứng 2 SỚM, không chốt gì nếu
    lệch) giữ nguyên, chỉ mốc so sánh đổi theo code mới."""
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    m = re.search(r"const chotHet = async \(\) => \{([\s\S]*?)\n  \};", text)
    assert m, "không tìm thấy hàm chotHet"
    than = m.group(1)
    idx_kiem = than.find("timMaLechKhoaCung2")
    idx_rpc = than.find("chot_trinh_ky_toan_bo_nguyen_khoi_v3")
    assert idx_kiem != -1, "chotHet không gọi hàm kiểm khoá cứng 2"
    assert idx_rpc != -1, "chotHet không còn gọi chot_trinh_ky_toan_bo_nguyen_khoi_v3"
    assert idx_kiem < idx_rpc, (
        "kiểm khoá cứng 2 phải đứng TRƯỚC lời gọi RPC chốt nguyên khối, "
        "nếu không sẽ mất tác dụng báo sớm bằng dữ liệu đã có sẵn"
    )
    # Dừng hẳn (return), không gọi RPC chốt, khi còn mã lệch.
    assert re.search(r"maLech\.length > 0[\s\S]{0,400}?return;", than)


def test_l17_khong_con_vong_lap_chot_tung_khoa_o_client():
    """28/09/2026 vòng 5 (N1 gốc): `chotHet` không còn tự lặp gọi
    `chot_trinh_ky_khoa_v3` cho từng khoa — việc đó chuyển hẳn vào MỘT giao
    dịch ở server (`chot_trinh_ky_toan_bo_nguyen_khoi_v3`, patch_zzzzzzzk) để
    tránh kẹt nửa chốt khi bước cuối bị từ chối. `chot_trinh_ky_khoa_v3` vẫn
    còn xuất hiện ở nơi khác của file (truy vấn đọc `daChot` trong `doc()`) —
    chỉ riêng thân `chotHet` là không còn gọi RPC đó nữa."""
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    m = re.search(r"const chotHet = async \(\) => \{([\s\S]*?)\n  \};", text)
    assert m, "không tìm thấy hàm chotHet"
    than = m.group(1)
    assert '"chot_trinh_ky_khoa_v3"' not in than
    assert '"chot_trinh_ky_toan_bo_v3"' not in than
    assert '"chot_trinh_ky_toan_bo_nguyen_khoi_v3"' in than


def test_l17_chot_trinh_ky_tong_hop_nhan_prop_phan_bo():
    """Component phải nhận `phanBo` (từ `useDuLieuThau`) để kiểm bằng đúng dữ
    liệu server dùng, không đoán/không gọi thêm RPC riêng."""
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    assert re.search(
        r"export function ChotTrinhKyTongHop\(\{[^}]*\bphanBo\b[^}]*\}\)", text
    )


def test_l17_tong_hop_pdd_truyen_thau_phanbo_xuong():
    """TongHopPdd.jsx phải truyền `thau.phanBo` (dữ liệu view
    v_phan_bo_trung_theo_ma_v3 của đúng phiên Q hiệu lực) xuống
    ChotTrinhKyTongHop — không truyền thì phía kiểm khoá cứng 2 im lặng bỏ
    qua (phanBo=null)."""
    text = TONG_HOP_PDD.read_text(encoding="utf-8")
    m = re.search(r"<ChotTrinhKyTongHop([\s\S]*?)/>", text)
    assert m, "không tìm thấy nơi gọi <ChotTrinhKyTongHop"
    assert "phanBo={thau.phanBo}" in m.group(1)


def test_l17_ghi_chu_tai_cho():
    """QĐ ghi trong nhiệm vụ: ghi chú tại chỗ nêu rõ ngày, lý do và tên biến
    server tương ứng (file:dòng) — không chỉ sửa code mà không để lại vết.

    🔄 28/09/2026 vòng 5: bỏ đòi `patch_zzzzd_v3_trinh_ky.sql` khỏi assert này
    — khối chú thích L17 được viết lại ở vòng 5 (patch_zzzzzzzk) để mô tả cơ
    chế MỘT RPC nguyên khối mới, không còn cần trích dẫn riêng file định nghĩa
    `chot_trinh_ky_khoa_v3` (giờ chỉ server gọi hàm đó, client không gọi trực
    tiếp nữa — xem test_l17_khong_con_vong_lap_chot_tung_khoa_o_client và
    test_vong5_ra_code.py). Thêm đòi trích dẫn patch_zzzzzzzk thay vào đó."""
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    assert "L17 28/09/2026" in text
    assert "patch_zzzzzzd_danh_muc_chuan_theo_ky.sql" in text
    assert "patch_zzzzzzzk" in text
