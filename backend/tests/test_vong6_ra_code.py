"""Khẳng định các vá VÒNG 6 (28/09/2026, sau kiểm định độc lập lượt 4).

Test chỉ đọc văn bản (jsx), không chạm DB, không chạy build/preview.
Nguồn quyết định: `.scratch/test-toan-bo/SO_CHUNG.md` mục 24 và
`.scratch/test-toan-bo/KIEM_DINH_DOC_LAP_LUOT4.md` (P1, P6).

Nhiều trợ lý cùng vá vòng này trên các file khác nhau — mỗi trợ lý CHỈ được
THÊM hàm test của phần mình vào cuối file, không xoá hay ghi đè hàm đã có.

Phần dưới đây là của DanhMucDeXuatKhoa.jsx (P1, P6k).
"""
import re
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
FE = GOC.parent / "frontend" / "src" / "features"
DANH_MUC_KHOA = FE / "DanhMucDeXuatKhoa.jsx"


# ---------------------------------------------------------------------------
# P1 — `taiKetQuaThau` chỉ lọc `ket_qua = "khong_trung"`, bỏ sót mã TRÚNG MỘT
# PHẦN (`trung_mot_phan`, patch_zzzzzl_view_ket_qua_chay_o_quy_mo_that.sql:62-64
# — `khong_trung` khi so_luong_trung = 0, `trung_mot_phan` khi
# 0 < so_luong_trung < q_khoa). Vì lọc cũ chỉ lấy `khong_trung`, nhánh nhãn
# vàng "Rớt N ở … · trúng M" (dựa vào `Number(r.rot.so_luong_trung) > 0`) là
# CODE CHẾT và chân bảng "N mã rớt" chỉ đếm rớt toàn bộ. K13
# (.scratch/huong-dan/DAN_Y.md) yêu cầu có cả nhãn vàng lẫn đỏ.
# ---------------------------------------------------------------------------

def test_p1_tai_ket_qua_thau_loc_ca_khong_trung_va_trung_mot_phan():
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    m = re.search(r"async function taiKetQuaThau\([\s\S]*?\n\}", text)
    assert m, "không tìm thấy hàm taiKetQuaThau"
    than = m.group(0)
    m_in = re.search(r'\.in\(\s*"ket_qua"\s*,\s*\[([^\]]*)\]\s*\)', than)
    assert m_in, "phải lọc ket_qua bằng .in([...]) thay vì .eq() một giá trị"
    danh_sach = [x.strip().strip('"') for x in m_in.group(1).split(",")]
    assert set(danh_sach) == {"khong_trung", "trung_mot_phan"}, (
        f"danh sách ket_qua phải đúng hai loại rớt (khong_trung, trung_mot_phan), "
        f"không lấy 'trung' (trúng đủ): thấy {danh_sach}"
    )


def test_p1_khong_con_loc_cung_mot_gia_tri_khong_trung():
    """Không còn literal `.eq("ket_qua", "khong_trung")` — bản vá cũ khoá cứng
    một giá trị enum duy nhất, đúng nguồn gốc lỗi P1 (bẫy `06_DUNG_LAM_LAI.md`:
    đổi enum của view mà không soi lại chỗ lọc `.eq(ket_qua, …)`)."""
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    assert 'eq("ket_qua", "khong_trung")' not in text


def test_p1_van_giu_du_cot_can_cho_nhan_vang_do():
    """Vá P1 không được làm mất các cột mà nhãn vàng/đỏ và tooltip cần đọc
    (so_luong_trung, so_luong_thieu, ma_moc_rot, ly_do_khong_trung) — thiếu
    một cột là sai lặng lẽ (AGENTS.md điều 7)."""
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    m = re.search(r"async function taiKetQuaThau\([\s\S]*?\n\}", text)
    assert m
    than = m.group(0)
    for cot in ("so_luong_trung", "so_luong_thieu", "ma_moc_rot", "ly_do_khong_trung", "ket_qua"):
        assert cot in than, f"thiếu cột {cot} trong .select() của taiKetQuaThau"


# ---------------------------------------------------------------------------
# P6k — hộp "Lịch sử sửa ô" phía khoa: `gia_tri_cu` rỗng/null đang hiện
# "(trống) → X", trong khi rỗng ở đây nghĩa là TRƯỚC ĐÓ ô đang mang giá trị
# GỐC (chưa có sửa đè nào trước lần này) — xem
# patch_zl_khoi_phuc_o_goc.sql:39-41 ("gia_tri_cu NULL = lần đầu ghi đè").
# Đổi thành "(giá trị gốc) → X". Không đổi phần `gia_tri_moi` (M9k đã vá).
# ---------------------------------------------------------------------------

def test_p6k_gia_tri_cu_rong_hien_gia_tri_goc():
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    assert '{a.gia_tri_cu || "(giá trị gốc)"}' in text
    # Không còn nhánh cũ hiện "(trống)" cho gia_tri_cu.
    assert 'a.gia_tri_cu ?? "(trống)"' not in text


def test_p6k_khong_dong_cham_nhan_gia_tri_moi_da_va_o_m9k():
    """P6k chỉ sửa nửa `gia_tri_cu` còn lại của M9 — phần `gia_tri_moi` đã vá
    đúng ở vòng 5 (M9k), không được đổi lại."""
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    assert '{a.gia_tri_moi || "(bỏ sửa, về giá trị gốc)"}' in text


# ===========================================================================
# Phần dưới đây: P2, P5 (CumThauTongHop.jsx) · P3+Q09 (TheoDoiChuyenTiep.jsx) ·
# P7 (BanDieuHanhPdd.jsx) · P6p (TongHopPdd.jsx).
# Nguồn: KIEM_DINH_DOC_LAP_LUOT4.md mục P2/P3/P5/P6/P7 và SO_CHUNG.md mục 24
# (bảng VÒNG 6, có QĐ chủ dự án Q09 ở mục 23).
# ===========================================================================

CUM_THAU = FE / "CumThauTongHop.jsx"
THEO_DOI = FE / "TheoDoiChuyenTiep.jsx"
BAN_DIEU_HANH = FE / "BanDieuHanhPdd.jsx"
TONG_HOP_PDD = FE / "TongHopPdd.jsx"


def _than_ham(text, ten_ham, tu_khoa="function"):
    """Cắt ra thân của một hàm/const bằng cách đếm ngoặc nhọn — tránh regex
    non-greedy cắt hụt khi thân hàm có nhiều `\\n}` lồng nhau (arrow function,
    object, JSX...). Trả về đoạn text từ chữ đầu hàm tới dấu `}` khớp cặp."""
    if tu_khoa == "function":
        m = re.search(r"async function " + re.escape(ten_ham) + r"\(", text)
    else:
        m = re.search(r"const " + re.escape(ten_ham) + r" = (?:useCallback\()?async \(", text)
    assert m, f"không tìm thấy hàm {ten_ham}"
    i = text.index("{", m.end())
    depth = 0
    for j in range(i, len(text)):
        if text[j] == "{":
            depth += 1
        elif text[j] == "}":
            depth -= 1
            if depth == 0:
                return text[m.start():j + 1]
    raise AssertionError(f"không đóng được ngoặc của hàm {ten_ham}")


# ---------------------------------------------------------------------------
# P2 — `useDuLieuThau`: `setCoPhienQ` chạy ngay sau truy vấn `chot_q_phien`
# trong khi `giaiDoan` còn rỗng/của đợt cũ, và `ThanhGiaiDoanThau` không xét
# `dangTai` → mở bảng Tổng hợp của gói đã chốt Q chớp "Chưa chốt số đi thầu."
# rồi dải đỏ "...HỎNG" trước khi tới thanh đúng (tái hiện được mỗi lần mở,
# xem KIEM_DINH_DOC_LAP_LUOT4.md mục P2). Vá: đặt coPhienQ CÙNG LÚC với
# giaiDoan (sau khi cả hai có dữ liệu thật của đúng đợt), thêm chặn `dangTai`
# ở ThanhGiaiDoanThau, và thêm chốt chặn lượt tải cũ (mẫu L13) cho hook này.
# ---------------------------------------------------------------------------

def test_p2_dat_co_phien_q_cung_luc_voi_giai_doan_khong_phai_ngay_sau_chot_q_phien():
    text = CUM_THAU.read_text(encoding="utf-8")
    than = _than_ham(text, "tai", tu_khoa="const")
    i_giai_doan = than.index("setGiaiDoan(gd.data || [])")
    i_co_phien_q = than.index("setCoPhienQ(!!phienId)")
    assert i_co_phien_q > i_giai_doan, (
        "setCoPhienQ(!!phienId) phải chạy SAU setGiaiDoan(...), không phải ngay "
        "sau truy vấn chot_q_phien — nếu không, coPhienQ mang giá trị mới trong "
        "khi giaiDoan vẫn rỗng/của đợt cũ, gây nhấp nháy sai (P2)."
    )
    # Không được gọi setCoPhienQ thêm lần nào TRƯỚC khối Promise.all (tức là
    # bản vá cũ "đặt ngay sau chot_q_phien" phải biến mất hẳn, không phải chỉ
    # thêm một lần gọi mới ở cuối).
    # Đặt lại về false ở đầu lượt tải là ĐÚNG (xoá trạng thái đợt cũ); cái bị
    # cấm là đặt giá trị THẬT (true / !!phienId) trước khi có giai đoạn.
    i_promise_all = than.index("Promise.all([")
    than_truoc_promise = than[:i_promise_all]
    assert "setCoPhienQ(true)" not in than_truoc_promise
    assert "setCoPhienQ(!!phienId)" not in than_truoc_promise


def test_p2_thanh_giai_doan_thau_khong_hien_chua_chot_hoac_hong_khi_dang_tai():
    text = CUM_THAU.read_text(encoding="utf-8")
    m = re.search(r"export function ThanhGiaiDoanThau\(\{([\s\S]*?)\}\) \{", text)
    assert m, "không tìm thấy ThanhGiaiDoanThau"
    assert "dangTai" in m.group(1), "ThanhGiaiDoanThau phải nhận prop dangTai"

    i_ham = text.index("export function ThanhGiaiDoanThau")
    i_ket_thuc = text.index("\n/** Sáu ô đuôi dòng", i_ham)
    than = text[i_ham:i_ket_thuc]

    i_if_dang_tai = than.index("if (dangTai)")
    i_if_chua_chot = than.index("if (!coPhienQ)")
    i_if_hong = than.index('if (giaiDoan.length === 0)')
    assert i_if_dang_tai < i_if_chua_chot < i_if_hong, (
        "chặn dangTai phải đứng TRƯỚC cả hai điều kiện 'chưa chốt Q' và "
        "'thiếu giai đoạn (hỏng)', để không hiện hai câu đó trong lúc đang tải"
    )
    khoi_dang_tai = than[i_if_dang_tai:i_if_chua_chot]
    assert "Chưa chốt số đi thầu" not in khoi_dang_tai
    assert "hỏng" not in khoi_dang_tai.lower()


def test_p2_co_chot_chan_luot_tai_cu_kieu_l13_trong_use_du_lieu_thau():
    """Đổi dotGoiId liên tiếp (đổi hash nhanh) có thể khiến lượt tải cũ trả về
    sau lượt mới — phải có ref đếm lượt và bỏ kết quả của lượt không mới nhất,
    cùng mẫu L13 đã dùng ở BanDieuHanhPdd.jsx/DanhMucDeXuatKhoa.jsx."""
    text = CUM_THAU.read_text(encoding="utf-8")
    i = text.index("export function useDuLieuThau")
    j = text.index("\nexport function", i + 10)
    than = text[i:j]
    assert "useRef(0)" in than, "thiếu ref đếm lượt tải (mẫu L13)"
    assert than.count("luotTai.current") >= 3, (
        "phải kiểm luotTai.current sau ít nhất truy vấn chot_q_phien và sau "
        "Promise.all năm truy vấn còn lại (không đổi thứ tự truy vấn gốc)"
    )


# ---------------------------------------------------------------------------
# P5 — `chotHet`: câu lỗi thiếu hàm ghi "báo Phòng Điều dưỡng" trong khi chính
# PĐD là người đang bấm nút; và nhánh lỗi không đọc lại trạng thái chốt nên
# nếu server đã chốt xong mà mạng lỗi thì màn báo lỗi sai (phải tải lại trang
# mới thấy đúng).
# ---------------------------------------------------------------------------

def test_p5_cau_loi_thieu_ham_bao_dung_vai():
    text = CUM_THAU.read_text(encoding="utf-8")
    than = _than_ham(text, "chotHet", tu_khoa="const")
    # Bỏ chú thích: câu cũ được trích trong chú thích giải thích lý do sửa.
    than = re.sub(r"/\*[\s\S]*?\*/", "", than)
    than = re.sub(r"//[^\n]*", "", than)
    assert "báo người quản trị hệ thống" in than
    assert "báo Phòng Điều dưỡng" not in than, (
        "câu lỗi thiếu hàm hiện cho chính PĐD đang bấm nút — không được bảo "
        "PĐD tự báo cho PĐD"
    )
    assert "patch_zzzzzzzk" in than, "vẫn phải giữ mã patch trong câu báo"


def test_p5_nhanh_loi_doc_lai_trang_thai_chot():
    text = CUM_THAU.read_text(encoding="utf-8")
    than = _than_ham(text, "chotHet", tu_khoa="const")
    i_if_error = than.index("if (error) {")
    i_return_thanh_cong = than.index("await onXong?.(\"Đã chốt trình ký toàn bộ")
    khoi_loi = than[i_if_error:i_return_thanh_cong]
    assert khoi_loi.count("await doc()") >= 1, (
        "nhánh lỗi của chotHet phải gọi lại doc() để đọc trạng thái chốt mới "
        "nhất — tránh báo lỗi giả khi server đã chốt xong nhưng mạng lỗi lúc "
        "nhận phản hồi (P5)"
    )


def test_p5_doc_tra_ve_phien_moi_de_chothet_phan_biet_da_chot_hay_chua():
    """`doc()` phải trả về phiên vừa đọc được (hoặc null) — chotHet dựa vào
    giá trị trả về này để quyết định có báo lỗi hay không, không đọc state cũ
    (state không cập nhật đồng bộ ngay sau `await doc()`)."""
    text = CUM_THAU.read_text(encoding="utf-8")
    than = _than_ham(text, "doc", tu_khoa="const")
    assert re.search(r"return phienMoi;", than), "doc() phải return phiên vừa đọc được"
    assert "const phienMoi = ph.data || null;" in than


# ---------------------------------------------------------------------------
# P3 + Q09 — TheoDoiChuyenTiep.jsx: dòng CHƯA bấm "Xác nhận rớt" (con_no_xu_ly)
# đang hiện "— TRỐNG" đỏ và nút "Chạy lại" (gọi thẳng xac_nhan_rot_v3, không
# hỏi lại). QĐ chủ dự án Q09 (28/09): "Chạy lại" CHỈ hiện ở dòng chuyển tiếp
# HỎNG (chuyen_tiep_hong); dòng chưa xác nhận rớt: không nút, ghi "Chưa xác
# nhận rớt — làm trên bảng Tổng hợp".
# ---------------------------------------------------------------------------

def test_p3_q09_nut_chay_lai_chi_hien_khi_hong_khong_con_theo_dieu_kien_no():
    text = THEO_DOI.read_text(encoding="utf-8")
    assert "{(g.hong > 0 || g.no > 0) &&" not in text, (
        "điều kiện cũ cho nút 'Chạy lại' còn cả g.no > 0 — Q09 chỉ cho hiện "
        "khi g.hong > 0 (chuyển tiếp hỏng)"
    )
    assert re.search(r"\{g\.hong > 0 &&\s*\(\s*<button[\s\S]{0,600}Chạy lại", text), (
        "nút 'Chạy lại' phải chỉ còn điều kiện g.hong > 0"
    )


def test_p3_q09_dong_chua_xac_nhan_rot_khong_con_chu_trong():
    text = THEO_DOI.read_text(encoding="utf-8")
    assert "Chưa xác nhận rớt — làm trên bảng Tổng hợp" in text
    # Nhánh hiển thị ô "Đợt bổ sung" ở dòng mã hàng: chỉ còn TRỐNG đỏ khi hong>0.
    m = re.search(
        r"g\.doMa === g\.khoa\.length[\s\S]{0,1200}Chưa xác nhận rớt — làm trên bảng Tổng hợp",
        text,
    )
    assert m, "nhánh else của ô 'Đợt bổ sung' phải rơi vào câu 'Chưa xác nhận rớt' khi không hong"


def test_p3_q09_cau_dau_man_khong_con_noi_sai_hai_truong_hop():
    text = THEO_DOI.read_text(encoding="utf-8")
    # Đoạn <p> mở đầu màn (không phải khối chú thích JS ở đầu file).
    m = re.search(r'<h1[\s\S]*?</h1>\s*<p className="mt-0\.5[\s\S]*?</p>', text)
    assert m, "không tìm thấy đoạn mở đầu màn"
    doan = m.group(0)
    # Câu cũ gộp chung ô trống = hỏng, không phân biệt "chưa xác nhận rớt".
    assert "không phải đang chờ khoa" not in doan
    assert "chưa bấm" in doan and "Xác nhận rớt" in doan
    assert "bảng Tổng hợp" in doan
    assert "Chạy lại" in doan


def test_p3_q09_nhan_con_no_xu_ly_va_chuyen_tiep_hong_giu_nguyen():
    """Q09 chỉ đổi cách hiện nút/chữ TRỐNG — không đổi hai nhãn màu đã có."""
    text = THEO_DOI.read_text(encoding="utf-8")
    assert '"Còn nợ xử lý"' in text
    assert '"CHUYỂN TIẾP HỎNG"' in text


# ---------------------------------------------------------------------------
# P7 — BanDieuHanhPdd.jsx: `mocHis` (Dữ liệu HIS mới nhất) chỉ nạp trong `tai`
# sau nhánh "chưa chọn gói con" → mở màn thấy "chưa có". Vá: nạp một lần khi
# mở màn, effect riêng không phụ thuộc gói con.
# ---------------------------------------------------------------------------

def test_p7_moc_his_nap_o_effect_rieng_khong_phu_thuoc_goi_con():
    text = BAN_DIEU_HANH.read_text(encoding="utf-8")
    m = re.search(
        r"useEffect\(\(\) => \{\s*\(async \(\) => \{[\s\S]*?usage_history_current"
        r"[\s\S]*?setMocHis\([\s\S]*?\}\)\(\);\s*\}, \[\]\);",
        text,
    )
    assert m, (
        "phải có một useEffect RIÊNG, deps rỗng [], nạp usage_history_current "
        "rồi setMocHis — không phụ thuộc goiConId/dot"
    )


def test_p7_khong_con_nap_moc_his_trong_ham_tai():
    text = BAN_DIEU_HANH.read_text(encoding="utf-8")
    than = _than_ham(text, "tai", tu_khoa="const")
    assert "usage_history_current" not in than, (
        "hàm tai() (chạy theo dot/goiConId) không được nạp usage_history_current "
        "nữa — việc đó đã dời sang effect riêng nạp một lần lúc mở màn"
    )
    # Chỉ còn đúng một nơi trong cả file gọi usage_history_current.
    assert text.count("usage_history_current") == 1


# ---------------------------------------------------------------------------
# P6p — TongHopPdd.jsx hộp "Lịch sử sửa ô": `gia_tri_cu` rỗng/null hiện
# "(trống) → X" → phải là "(giá trị gốc) → X"; tooltip nút ✎ ở Ô CHỮ ghi
# "trả về số gốc" → "trả về giá trị gốc" (ô số vẫn giữ "số gốc").
# ---------------------------------------------------------------------------

def test_p6p_gia_tri_cu_rong_hien_gia_tri_goc_trong_hop_lich_su():
    text = TONG_HOP_PDD.read_text(encoding="utf-8")
    assert 'a.gia_tri_cu == null || a.gia_tri_cu === "" ? "(giá trị gốc)" : a.gia_tri_cu' in text
    # Không còn nhánh cũ dùng "(trống)" cho gia_tri_cu trong hộp lịch sử.
    assert 'a.gia_tri_cu ?? "(trống)"' not in text


def test_p6p_tooltip_but_khoi_phuc_o_chu_ghi_gia_tri_goc_o_so_giu_so_goc():
    text = TONG_HOP_PDD.read_text(encoding="utf-8")
    # Tooltip phải rẽ nhánh theo c.kieu === "num" ngay trong câu "trả về ...".
    assert re.search(
        r"bấm để bỏ sửa đè, trả về \$\{c\.kieu === \"num\" \? \"số gốc\" : \"giá trị gốc\"\}",
        text,
    ), "tooltip nút ✎ phải rẽ nhánh: ô số → 'số gốc', ô chữ → 'giá trị gốc'"
    # Không còn câu cũ cố định "trả về số gốc" cho mọi loại ô.
    assert "trả về số gốc`}" not in text
