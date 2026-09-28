"""Khẳng định các vá VÒNG 5 (28/09/2026, sau kiểm định độc lập lượt 3).

Test chỉ đọc văn bản (jsx), không chạm DB, không chạy build/preview.
Nguồn quyết định: `.scratch/test-toan-bo/SO_CHUNG.md` mục 21 và
`.scratch/test-toan-bo/KIEM_DINH_DOC_LAP_LUOT3.md` (M2, M3, M4, M5, M9, M10).
QĐ Q08: "năm đề xuất" của một ô là năm của ĐỢT (`dot_de_xuat.nam`).

Nhiều trợ lý cùng vá vòng này trên các file khác nhau — mỗi trợ lý CHỈ được
THÊM hàm test của phần mình vào cuối file, không xoá hay ghi đè hàm đã có.

Phần dưới đây là của BanDieuHanhPdd.jsx (M2), TongHopPdd.jsx (M3, M4, M5, M9)
và GioRotCuaKhoa.jsx (M10).
"""
import re
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
FE = GOC.parent / "frontend" / "src" / "features"
BAN_DIEU_HANH = FE / "BanDieuHanhPdd.jsx"
TONG_HOP = FE / "TongHopPdd.jsx"
GIO_ROT = FE / "GioRotCuaKhoa.jsx"


# ---------------------------------------------------------------------------
# M2 — BanDieuHanhPdd.jsx: nút "dọn dữ liệu làm việc" phải dùng NĂM CỦA ĐỢT
# (dot.nam), không phải hằng NAM_DE_XUAT (năm hiện tại + 1). Đợt khác năm
# hằng (vd #202=2028, #203=2026) trước đây đếm ra 0 và không xoá được gì.
# ---------------------------------------------------------------------------

def test_m2_dem_du_lieu_lam_viec_dung_nam_cua_dot():
    text = BAN_DIEU_HANH.read_text(encoding="utf-8")
    m = re.search(r'rpc\("dem_du_lieu_lam_viec",\s*\{([^}]*)\}', text, re.S)
    assert m, "không tìm thấy lời gọi rpc dem_du_lieu_lam_viec"
    assert "p_nam_de_xuat: dot?.nam" in m.group(1)
    # Không còn dùng thẳng hằng NAM_DE_XUAT làm năm lọc.
    assert re.search(r"p_nam_de_xuat:\s*NAM_DE_XUAT\s*,", m.group(1)) is None


def test_m2_don_du_lieu_lam_viec_dung_nam_cua_dot():
    text = BAN_DIEU_HANH.read_text(encoding="utf-8")
    m = re.search(r'rpc\("don_du_lieu_lam_viec",\s*\{([^}]*)\}', text, re.S)
    assert m, "không tìm thấy lời gọi rpc don_du_lieu_lam_viec"
    assert "p_nam_de_xuat: dot?.nam" in m.group(1)
    assert re.search(r"p_nam_de_xuat:\s*NAM_DE_XUAT\s*,", m.group(1)) is None


def test_m2_van_co_du_phong_khi_dot_chua_co_nam():
    """Vá không được làm hỏng nhánh cũ nếu `dot` (hoặc `dot.nam`) rỗng — phải
    có `?? NAM_DE_XUAT` để không gửi `p_nam_de_xuat: undefined` lên server."""
    text = BAN_DIEU_HANH.read_text(encoding="utf-8")
    assert text.count("p_nam_de_xuat: dot?.nam ?? NAM_DE_XUAT") == 2


# ---------------------------------------------------------------------------
# M3 — TongHopPdd.jsx: lịch sử ô (xemAudit) phải BỎ điều kiện năm khi có
# `dotId` (goiScope đã mang hậu tố ":dot:N"), vì lọc thêm năm làm mất các
# dòng audit cũ mang năm khác (vd hằng cũ 2027) mà màn khoa vẫn thấy đủ.
# ---------------------------------------------------------------------------

def test_m3_xem_audit_bo_loc_nam_khi_co_dot_id():
    text = TONG_HOP.read_text(encoding="utf-8")
    m = re.search(r"const xemAudit = async[\s\S]*?\n  \};", text)
    assert m, "không tìm thấy hàm xemAudit"
    than = m.group(0)
    assert "danh_muc_tong_hop_o_audit" in than
    # Lọc năm phải nằm trong nhánh điều kiện không có dotId.
    assert re.search(r"if\s*\(\s*!dotId\s*\)\s*q\s*=\s*q\.eq\(\"nam_de_xuat\",\s*namDot\)", than)
    # Điều kiện goi_id vẫn phải giữ, không bị bỏ theo.
    assert 'eq("goi_id", goiScope)' in than


# ---------------------------------------------------------------------------
# M4 (phía PĐD) — TongHopPdd.jsx: đổi đợt bằng hash trong CÙNG TAB có thể có
# hai lượt `taiLai` chạy chồng nhau; lượt cũ trả lời sau phải bị bỏ, không
# được ghi đè state của lượt mới (mẫu L13 ở BanDieuHanhPdd.jsx).
# ---------------------------------------------------------------------------

def test_m4_co_bo_dem_luot_tai_bang_useref():
    text = TONG_HOP.read_text(encoding="utf-8")
    assert re.search(r"const luotTaiRef = useRef\(0\)", text)


def test_m4_tai_lai_tang_luot_va_kiem_truoc_khi_ghi_state():
    text = TONG_HOP.read_text(encoding="utf-8")
    m = re.search(r"const taiLai = useCallback\(async \(\) => \{[\s\S]*?\}, \[goiId, dotId, goiScope, namDot\]\);", text)
    assert m, "không tìm thấy hàm taiLai"
    than = m.group(0)
    assert "++luotTaiRef.current" in than
    # Phải kiểm lượt SAU MỖI await tải dữ liệu phụ thuộc đợt — ít nhất 3 lần
    # (sau Promise.all đầu, sau rpc khoa_chua_xac_nhan, sau Promise.all chốt).
    so_lan_kiem = len(re.findall(r"luot !== luotTaiRef\.current", than))
    assert so_lan_kiem >= 3, f"chỉ thấy {so_lan_kiem} chỗ kiểm lượt, cần chặn ở mọi điểm await"


def test_m4_khong_tat_dang_tai_neu_khong_con_la_luot_moi_nhat():
    """`dangTai` (và `loi`) chỉ được lượt MỚI NHẤT set — nếu không, lượt cũ về
    sau có thể tắt "đang tải" đè lên lúc lượt mới còn đang chạy."""
    text = TONG_HOP.read_text(encoding="utf-8")
    m = re.search(
        r"\} catch \(e\) \{\s*if \(luot === luotTaiRef\.current\) setLoi\([\s\S]*?\);\s*"
        r"\} finally \{[\s\S]*?if \(luot === luotTaiRef\.current\) setDangTai\(false\);",
        text,
    )
    assert m, "catch/finally của taiLai phải chỉ hành động khi vẫn là lượt mới nhất"


# ---------------------------------------------------------------------------
# M5 — TongHopPdd.jsx: hộp "Lịch sử sửa ô" (audit) và ô đang sửa (oDangChon)
# phải đóng/bỏ khi đổi gói/đợt, cùng họ với vá L18/N7 (loiO, thongBaoThau).
# ---------------------------------------------------------------------------

def test_m5_dong_hop_lich_su_va_bo_o_dang_chon_khi_doi_dot():
    text = TONG_HOP.read_text(encoding="utf-8")
    m = re.search(
        r'useEffect\(\(\) => \{ setLoiO\(""\); setThongBaoThau\(""\);([^}]*)\}, \[goiId, dotId\]\);',
        text,
    )
    assert m, "không tìm thấy useEffect xoá loiO/thongBaoThau theo [goiId, dotId]"
    than = m.group(1)
    assert "setAudit(null)" in than
    assert "setODangChon(null)" in than


def test_m5_khai_bao_audit_truoc_useeffect_dung():
    """`audit` phải được khai báo TRƯỚC useEffect gọi setAudit ở trên (không
    thì lỗi TDZ "Cannot access 'setAudit' before initialization")."""
    text = TONG_HOP.read_text(encoding="utf-8")
    vi_tri_khai_bao = text.index("const [audit, setAudit] = useState(null)")
    vi_tri_effect = text.index('useEffect(() => { setLoiO(""); setThongBaoThau("");')
    assert vi_tri_khai_bao < vi_tri_effect
    # Chỉ có đúng một chỗ khai báo audit (không bị nhân đôi khi dời).
    assert text.count("const [audit, setAudit] = useState(null)") == 1


# ---------------------------------------------------------------------------
# M9 (phía PĐD) — TongHopPdd.jsx: dòng lịch sử có `gia_tri_moi` rỗng/null (do
# "Khôi phục ô") phải hiện "(bỏ sửa, về giá trị gốc)", không phải "(trống)"
# (dễ đọc nhầm là PĐD đã xoá trắng ô). Nhãn người sửa lấy theo `nguoi_sua`
# thật, không gán cứng.
# ---------------------------------------------------------------------------

def test_m9_gia_tri_moi_rong_hien_bo_sua_ve_goc():
    text = TONG_HOP.read_text(encoding="utf-8")
    assert "(bỏ sửa, về giá trị gốc)" in text
    m = re.search(
        r'\{a\.gia_tri_moi == null \|\| a\.gia_tri_moi === "" \? \([\s\S]*?bỏ sửa, về giá trị gốc[\s\S]*?\) : \([\s\S]*?a\.gia_tri_moi\}[\s\S]*?\)\}',
        text,
    )
    assert m, "chưa thấy nhánh điều kiện hiện thị đúng cho gia_tri_moi rỗng/null"


def test_m9_nhan_nguoi_sua_doc_thang_khong_gan_cung():
    text = TONG_HOP.read_text(encoding="utf-8")
    assert "Panel lịch sử sửa 1 ô" in text
    khoi_panel = text.split("Panel lịch sử sửa 1 ô", 1)[1].split("</AnimatePresence>", 1)[0]
    # Dòng ngày giờ + người sửa của mỗi lần audit phải đọc thẳng a.nguoi_sua...
    assert "{a.nguoi_sua}" in khoi_panel
    # ...không có chuỗi cứng kiểu "PĐD" thay cho nó trong cả khối panel.
    assert '"PĐD"' not in khoi_panel


# ---------------------------------------------------------------------------
# M10 — GioRotCuaKhoa.jsx: nhãn "Rớt từ: …" (và "Đã gửi ở đợt …", cùng nguồn
# `tenDotById`) không còn lặp tháng hai lần. Đợt bổ sung được tạo bằng
# format('Mua sắm bổ sung đợt tháng %s/%s', v_moc, v_nam) với v_moc/v_nam
# CHÍNH LÀ thang_moc/nam — nên khi thang_moc khác null, `ten` LUÔN đã có sẵn
# tháng, không cần (và không được) ghép thêm "(T.../...)" .
# ---------------------------------------------------------------------------

def test_m10_khong_con_ghep_thang_moc_lap_vao_nhan():
    text = GIO_ROT.read_text(encoding="utf-8")
    # Mẫu lỗi cũ: `${dd.ten} (T${dd.thang_moc}/${dd.nam})` — không còn nữa.
    assert "(T${dd.thang_moc}/${dd.nam})" not in text
    assert "dd?.thang_moc ? `${dd.ten}" not in text


def test_m10_nhan_dung_thang_ten_dot_khong_doi():
    text = GIO_ROT.read_text(encoding="utf-8")
    m = re.search(r"tenDotById\[dg\.id\]\s*=\s*\{[^}]*\};", text)
    assert m, "không tìm thấy chỗ gán tenDotById[dg.id]"
    assert 'nhan: dd?.ten || ""' in m.group(0)


# ===========================================================================
# Phần dưới đây là của DanhMucDeXuatKhoa.jsx — M1, M4 (phía khoa), M6, M9
# (phía khoa). Nguồn: KIEM_DINH_DOC_LAP_LUOT3.md (mục M1, M4, M6, M9) và
# SO_CHUNG.md mục 21, dòng "M1 M4k M6 M9k ... | DanhMucDeXuatKhoa.jsx".
# ===========================================================================

DANH_MUC_KHOA = FE / "DanhMucDeXuatKhoa.jsx"


# ---------------------------------------------------------------------------
# M1 — onClick mở ô (bản vá L19) thiếu điều kiện `!isEditing`: bấm lại vào
# TRONG ô đang gõ làm `giaTriMoLuc` bị chụp bằng chữ vừa gõ, nên rời ô bị coi
# là "không đổi" và KHÔNG lưu (mất trắng khi tải lại). Áp cho cả cột chữ lẫn
# cột số lượng vì cả hai đi qua CÙNG một onClick trong RowKhoa.
# ---------------------------------------------------------------------------

def test_m1_onclick_mo_o_co_dieu_kien_khong_dang_sua():
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    m = re.search(
        r"onClick=\{\(\)\s*=>\s*canSua\s*&&\s*!isEditing\s*\n?\s*&&\s*setODangChon\("
        r"\{\s*maHang:\s*r\.ma_hang,\s*colKey:\s*c\.key,\s*giaTriMoLuc:\s*value\s*\}\)\}",
        text,
    )
    assert m, "onClick mở ô phải có điều kiện !isEditing trước khi chụp giaTriMoLuc"


def test_m1_chi_mot_diem_goi_setodangchon_voi_giatrimoluc():
    """Chỉ một chỗ trong file gọi `setODangChon({..., giaTriMoLuc})` — đây là
    điểm rủi ro M1 duy nhất; các chỗ khác chỉ đóng ô bằng `setODangChon(null)`,
    không cần vá."""
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    assert len(re.findall(r"setODangChon\(\{", text)) == 1
    assert "setODangChon(null)" in text


# ---------------------------------------------------------------------------
# M4 (phía khoa) — đổi đợt bằng hash trong cùng tab: một lượt tải CŨ (goi/khoa/
# đợt trước, có thể còn mang năm cũ trong một nhịp render trước khi effect
# `setNamDot(null)` kịp chạy) có thể trả lời SAU lượt MỚI và ghi đè state bằng
# đúng dữ liệu sai đợt/sai năm — "lượt nào xong sau thì thắng" (bằng chứng
# KIEM_DINH_DOC_LAP_LUOT3.md M4). QĐ vá: GIỮ NGUYÊN khai báo `namDot` gốc
# (không đổi, để không phá vỡ các bài test_vong4 đã khoá đúng hành vi
# `setNamDot(null)` đồng bộ trong effect [dotId]) và CHẶN KẾT QUẢ LƯỢT TẢI CŨ
# bằng ref đếm lượt (mẫu L13) ở CẢ BA hàm tải chính phụ thuộc đợt — nhờ vậy dù
# một lượt mang tham số sai (năm cũ ghép dotId mới) có lỡ bắn ra, kết quả của
# nó vẫn bị bỏ khi có lượt mới hơn đã bắt đầu, không còn cảnh "lượt sau thắng".
# ---------------------------------------------------------------------------

def test_m4k_namdot_giu_nguyen_khai_bao_goc():
    """Không đổi cấu trúc state `namDot`/`setNamDot` — các test vòng 4
    (`test_q08_danhmucdexuatkhoa_co_bien_nam_dot` và các bài đọc/ghi theo
    `namDot`) khoá đúng hành vi `setNamDot(null)` đồng bộ trong effect
    `[dotId]`; vá M4 không được phá vỡ phần đó, chỉ cộng thêm lớp chặn lượt
    tải cũ bên dưới."""
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    assert "const [namDot, setNamDot] = useState(() => (dotId ? null : NAM_DE_XUAT));" in text


def test_m4k_co_bo_dem_luot_tai_bang_useref_cho_ba_ham_tai_chinh():
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    for ten_ref in ("luotTaiChinh", "luotTaiCauHinhCot", "luotTaiTrangThaiChot"):
        assert re.search(rf"const {ten_ref} = useRef\(0\)", text), f"thiếu ref đếm lượt {ten_ref}"


def test_m4k_tai_lai_kiem_luot_sau_moi_await_truoc_khi_ghi_state():
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    m = re.search(
        r"const taiLai = useCallback\(async \(\) => \{[\s\S]*?"
        r"\}, \[goiId, khoaHienTai, dotId, sanSangGoi, taiODaLuu, taiSuaDeCuaPdd\]\);",
        text,
    )
    assert m, "không tìm thấy hàm taiLai"
    than = m.group(0)
    assert "++luotTaiChinh.current" in than
    so_lan_kiem = len(re.findall(r"luot !== luotTaiChinh\.current", than))
    assert so_lan_kiem >= 3, f"chỉ thấy {so_lan_kiem} chỗ kiểm lượt trong taiLai, cần chặn ở mọi điểm await"
    # catch/finally chỉ hành động khi vẫn là lượt mới nhất — lượt cũ báo lỗi
    # hoặc tắt "đang tải" muộn không được đè lên lượt mới đang chạy.
    assert "if (luot !== luotTaiChinh.current) return; // M4k/L13: lỗi của lượt cũ, bỏ qua" in than
    assert "if (luot === luotTaiChinh.current) setDangTai(false);" in than


def test_m4k_taicauhinhcot_kiem_luot_sau_await():
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    m = re.search(r"const taiCauHinhCot = useCallback\(async \(\) => \{[\s\S]*?\}, \[goiId, khoaHienTai, dotId, namDot\]\);", text)
    assert m, "không tìm thấy hàm taiCauHinhCot"
    than = m.group(0)
    assert "++luotTaiCauHinhCot.current" in than
    assert len(re.findall(r"luot !== luotTaiCauHinhCot\.current", than)) >= 1


# ---------------------------------------------------------------------------
# M6 — server từ chối lưu một ô (vd cột đang khoá) thì phải trả Ô về giá trị
# TRƯỚC khi sửa, không để nguyên chữ bị từ chối cho tới khi tải lại trang.
# Dải báo lỗi (loiLuuO) phải giữ nguyên như cũ.
# ---------------------------------------------------------------------------

def test_m6_luuolenserver_tu_tinh_gia_tri_truoc_khi_sua():
    """Không đổi chữ ký/điểm gọi `luuOLenServer(maHang, colKey, giaTri)` (test
    vòng 4 `test_l19_...chan_truoc_khi_goi_luuolenserver` khoá đúng lời gọi cũ)
    — hàm tự đọc lại `oDangChon` (cùng closure/cùng lượt render với
    `ketThucSuaO`, `setODangChon(null)` chỉ đặt lịch render sau) để có mốc giá
    trị trước khi sửa mà không cần thêm tham số."""
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    assert "const luuOLenServer = async (maHang, colKey, giaTri) => {" in text
    m = re.search(r"const luuOLenServer = async \(maHang, colKey, giaTri\) => \{([\s\S]*?)\n\s*const traOVeTruocKhiSua", text)
    assert m, "không tìm thấy phần đầu luuOLenServer trước traOVeTruocKhiSua"
    assert re.search(
        r'giaTriTruocKhiSua = oDangChon\?\.maHang === maHang && oDangChon\?\.colKey === colKey\s*\n\s*\? oDangChon\.giaTriMoLuc : undefined;',
        m.group(1),
    )
    assert "const traOVeTruocKhiSua = () => {" in text


def test_m6_ca_hai_nhanh_loi_deu_tra_o_ve_va_giu_dai_bao_loi():
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    # Nhánh lỗi cột SỐ.
    m_so = re.search(
        r'setLoiLuuO\(loiSo\.code === "PGRST202"[\s\S]*?\);\s*'
        r"traOVeTruocKhiSua\(\);[^\n]*\n\s*return;",
        text,
    )
    assert m_so, "nhánh lỗi lưu SỐ phải gọi traOVeTruocKhiSua() rồi mới return"
    # Nhánh lỗi cột chữ (chung cho giải trình lẫn ô tổng hợp).
    m_chu = re.search(
        r'setLoiLuuO\(chuaPatch[\s\S]*?\);\s*'
        r"traOVeTruocKhiSua\(\);[^\n]*\n\s*return;",
        text,
    )
    assert m_chu, "nhánh lỗi lưu Ô CHỮ phải gọi traOVeTruocKhiSua() rồi mới return"


def test_m6_ketthucsuao_khong_doi_loi_goi_luuolenserver():
    """Giữ đúng lời gọi cũ (test vòng 4 khoá literal này) — `giaTriMoLuc` để
    trả ô về khi lỗi được `luuOLenServer` tự đọc lại từ `oDangChon`, không đi
    qua tham số của lời gọi này."""
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    assert "await luuOLenServer(maHang, colKey, giaTri);" in text


# ---------------------------------------------------------------------------
# M9 (phía khoa) — hộp "Lịch sử sửa ô": dòng có gia_tri_moi rỗng/null (do
# "Khôi phục ô") phải hiện "(bỏ sửa, về giá trị gốc)" thay vì "(trống)". Nhãn
# người sửa phải suy ra từ `nguoi_sua` thật (dùng lại `tenNguoiSuaNgan` — vai
# trò có sẵn của màn này), không gán cứng theo bảng audit nào trả dòng về.
# ---------------------------------------------------------------------------

def test_m9k_gia_tri_moi_rong_hien_bo_sua_ve_goc():
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    assert "(bỏ sửa, về giá trị gốc)" in text
    assert '{a.gia_tri_moi || "(bỏ sửa, về giá trị gốc)"}' in text
    # Không còn nhánh cũ hiện "(trống)" cho gia_tri_moi.
    assert "{a.gia_tri_moi ?? \"(trống)\"}" not in text


def test_m9k_nhan_nguoi_sua_doc_theo_nguoi_sua_that():
    text = DANH_MUC_KHOA.read_text(encoding="utf-8")
    assert "Panel lịch sử sửa 1 ô" in text
    khoi_panel = text.split("Panel lịch sử sửa 1 ô", 1)[1].split("</AnimatePresence>", 1)[0]
    assert "const nhanNguoiSua = tenNguoiSuaNgan(a.nguoi_sua);" in khoi_panel
    # Không còn gán cứng theo `a.ben` (bảng audit nào trả dòng về).
    assert 'a.ben === "pdd" ? "PĐD" : "Khoa"' not in khoi_panel


# ===========================================================================
# M7/N1 — patch_zzzzzzzk (SQL) + CumThauTongHop.jsx: gộp chốt trình ký toàn bộ
# vào MỘT giao dịch ở server, bỏ vòng lặp + lưới tự gỡ ở client.
#
# Nguồn quyết định: SO_CHUNG.md mục 21, dòng "M7/N1 | hàm server
# chot_trinh_ky_toan_bo_nguyen_khoi_v3(...) ... | patch_zzzzzzzk (+rollback) ·
# CumThauTongHop.jsx"; KIEM_DINH_DOC_LAP_LUOT3.md mã M7; KIEM_DINH_DOC_LAP_LUOT2.md
# mã N1.
#
# Test chỉ đọc văn bản (SQL + jsx), không chạm DB, không chạy patch/build.
# Xem thêm các bài đã CẬP NHẬT (không xoá) trong test_vong3_ra_code.py
# (test_l17_chot_het_kiem_khoa_cung_2_truoc_vong_lap_khoa,
# test_l17_khong_con_vong_lap_chot_tung_khoa_o_client, test_l17_ghi_chu_tai_cho)
# và test_vong4_ra_code.py (sáu bài test_n1_*) — các bài đó khoá HÀNH VI CŨ của
# vòng 3/4 (tiền kiểm fn_dong_vuot_quyen_v3 ở client, lưới goTuDong) và đã
# được sửa THÂN BÀI để khoá đúng hành vi mới, giữ nguyên tên.
# ===========================================================================

SQL_DIR = GOC / "sql"
PATCH_VONG5 = SQL_DIR / "patch_zzzzzzzk_vong5_chot_trinh_ky_nguyen_khoi.sql"
ROLLBACK_VONG5 = SQL_DIR / "rollback_zzzzzzzk_vong5.sql"
CUM_THAU_TONG_HOP = FE / "CumThauTongHop.jsx"


# ---------------------------------------------------------------------------
# Patch SQL: hàm được tạo, đúng chữ ký/loại bảo mật, gọi đúng ba hàm cũ theo
# đúng thứ tự, và có grant/revoke đúng như các hàm anh em (chot_trinh_ky_khoa_v3,
# chot_trinh_ky_toan_bo_v3, mo_chot_trinh_ky_khoa_v3 — patch_zzzzd_v3_trinh_ky.sql).
# ---------------------------------------------------------------------------

def test_m7n1_patch_ton_tai_va_boc_begin_commit():
    assert PATCH_VONG5.exists(), f"thiếu file patch: {PATCH_VONG5}"
    text = PATCH_VONG5.read_text(encoding="utf-8")
    than = text.split("begin;", 1)[1] if "begin;" in text else ""
    assert than, "patch phải bọc begin;"
    assert than.rstrip().endswith("commit;"), "patch phải bọc commit; ở cuối"


def test_m7n1_patch_tao_ham_dung_chu_ky_va_bao_mat():
    text = PATCH_VONG5.read_text(encoding="utf-8")
    assert "create or replace function public.chot_trinh_ky_toan_bo_nguyen_khoi_v3(p_dot_goi_id bigint)" in text
    assert "returns chot_trinh_ky_phien_v3" in text
    assert "language plpgsql" in text
    assert "security invoker" in text
    assert "set search_path = public" in text


def test_m7n1_patch_goi_dung_thu_tu_ba_ham_cu():
    """Thân hàm mới KHÔNG được viết lại logic nghiệp vụ — chỉ lặp đúng
    `khoa_chua_du_chot_trinh_ky`, gọi đúng `chot_trinh_ky_khoa_v3` cho từng
    khoa, rồi trả về đúng `chot_trinh_ky_toan_bo_v3`, theo ĐÚNG thứ tự web
    đang làm (đọc thật trên DB staging 28/09/2026 — AGENTS.md điều 2)."""
    text = PATCH_VONG5.read_text(encoding="utf-8")
    m = re.search(
        r"as \$function\$([\s\S]*?)\$function\$;", text,
    )
    assert m, "không tìm thấy thân hàm chot_trinh_ky_toan_bo_nguyen_khoi_v3"
    than = m.group(1)
    idx_thieu = than.find("khoa_chua_du_chot_trinh_ky(p_dot_goi_id)")
    idx_khoa = than.find("chot_trinh_ky_khoa_v3(p_dot_goi_id, r.khoa)")
    idx_toan_bo = than.find("chot_trinh_ky_toan_bo_v3(p_dot_goi_id)")
    assert -1 not in (idx_thieu, idx_khoa, idx_toan_bo), "thiếu lời gọi một trong ba hàm cũ"
    assert idx_thieu < idx_khoa < idx_toan_bo, "phải gọi đúng thứ tự: thiếu khoa → chốt khoa → chốt toàn bộ"
    assert "return chot_trinh_ky_toan_bo_v3(p_dot_goi_id);" in than


def test_m7n1_patch_grant_authenticated_revoke_anon():
    """Cùng khuôn ACL với các hàm anh em (chot_trinh_ky_khoa_v3,
    chot_trinh_ky_toan_bo_v3, mo_chot_trinh_ky_khoa_v3 — đều revoke
    public/anon, grant authenticated ở patch_zzzzd_v3_trinh_ky.sql)."""
    text = PATCH_VONG5.read_text(encoding="utf-8")
    assert re.search(
        r"revoke execute on function public\.chot_trinh_ky_toan_bo_nguyen_khoi_v3\(bigint\)\s*"
        r"from public, anon;", text,
    )
    assert re.search(
        r"grant execute on function public\.chot_trinh_ky_toan_bo_nguyen_khoi_v3\(bigint\)\s*"
        r"to authenticated;", text,
    )


def test_m7n1_patch_tu_kiem_co_has_function_privilege():
    """Patch phải tự kiểm cuối cùng: hàm tồn tại, authenticated có quyền
    execute, anon thì không — raise exception mới hoàn tác được cả patch nếu
    tự kiểm sai (do chay_patch.py chạy autocommit=True, patch tự bọc
    begin/commit)."""
    text = PATCH_VONG5.read_text(encoding="utf-8")
    assert "has_function_privilege('authenticated'," in text
    assert "has_function_privilege('anon'," in text
    assert "raise exception" in text


def test_m7n1_rollback_ton_tai_va_drop_function():
    assert ROLLBACK_VONG5.exists(), f"thiếu file rollback: {ROLLBACK_VONG5}"
    text = ROLLBACK_VONG5.read_text(encoding="utf-8")
    assert "drop function if exists public.chot_trinh_ky_toan_bo_nguyen_khoi_v3(bigint);" in text
    than = text.split("begin;", 1)[1] if "begin;" in text else ""
    assert than.rstrip().endswith("commit;")


# ---------------------------------------------------------------------------
# CumThauTongHop.jsx: chotHet gọi MỘT RPC mới, không còn vòng lặp/lưới cũ.
# ---------------------------------------------------------------------------

def test_m7n1_chothet_goi_dung_mot_rpc_nguyen_khoi():
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    m = re.search(r"const chotHet = async \(\) => \{([\s\S]*?)\n  \};", text)
    assert m, "không tìm thấy hàm chotHet"
    than = m.group(1)
    assert re.search(
        r'rpc\("chot_trinh_ky_toan_bo_nguyen_khoi_v3",\s*\{\s*\n\s*p_dot_goi_id:\s*dotGoiId,\s*\n\s*\}\)',
        than,
    ), "chotHet phải gọi đúng một RPC chot_trinh_ky_toan_bo_nguyen_khoi_v3(p_dot_goi_id)"
    # Không còn vòng lặp gọi chot_trinh_ky_khoa_v3 hay chot_trinh_ky_toan_bo_v3 rời.
    assert "chot_trinh_ky_khoa_v3" not in than
    assert '"chot_trinh_ky_toan_bo_v3"' not in than
    # Chỉ MỘT lời gọi supabase.rpc trong thân chotHet.
    assert than.count("supabase.rpc(") == 1


def test_m7n1_khong_con_gotudong_hay_khoavuachotluotnay_trong_code():
    """`goTuDong` và `khoaVuaChotLuotNay` không còn là code chạy — không còn
    trạng thái nửa chốt để phải tự gỡ vì server đã gộp một giao dịch. Comment
    đầu component được phép nhắc tên hai thứ này khi kể lại lịch sử đã bỏ."""
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    assert "const goTuDong = async" not in text
    assert "const khoaVuaChotLuotNay = [];" not in text
    assert "await goTuDong(" not in text


def test_m7n1_loi_hien_qua_dichloi_khong_con_tu_go():
    """Lỗi (bất kỳ lý do) của chotHet phải hiện qua `dichLoi(error)` — câu chữ
    của server — trừ nhánh riêng "không tìm thấy hàm" (chưa chạy patch)."""
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    m = re.search(r"const chotHet = async \(\) => \{([\s\S]*?)\n  \};", text)
    assert m
    than = m.group(1)
    assert "dichLoi(error)" in than
    assert "mo_chot_trinh_ky_khoa_v3" not in than, "chotHet không được tự gọi mo_chot_trinh_ky_khoa_v3 để tự gỡ nữa"


def test_m7n1_nhanh_rieng_khi_chua_chay_patch():
    """Lỗi 'không tìm thấy hàm' (PostgREST PGRST202 hoặc Postgres 42883 — DB
    staging chưa chạy patch_zzzzzzzk) phải báo đúng câu nêu mã patch, KHÔNG
    được âm thầm quay lại đường cũ (vòng lặp đã bỏ hẳn)."""
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    assert "PGRST202" in text
    assert "42883" in text
    assert "Hệ thống chưa được cập nhật đủ (mã patch_zzzzzzzk) — báo Phòng Điều dưỡng." in text


def test_m7n1_giu_nguyen_chu_nut_va_trang_thai_dang_chay():
    """Chữ nút, trạng thái đang chạy (dangChay/tienDo) phải giữ nguyên —
    nhiệm vụ giao việc yêu cầu KHÔNG đổi phần này."""
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    assert '"CHỐT TRÌNH KÝ TOÀN BỘ"' in text
    assert 'dangChay === "toan_bo" ? "Đang chốt…"' in text
    assert 'setDangChay("toan_bo")' in text
