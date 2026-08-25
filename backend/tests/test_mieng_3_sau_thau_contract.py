"""Khẳng định miếng 3 — ba bảng sau đấu thầu + mốc cam kết theo ngày giao thật.

Bốn quyết định nghiệp vụ đóng vào schema. Cột thừa hay khoá lỏng ở đây không
làm hỏng gì ngay — nó chỉ nổ ra sau khi đã gom hàng nghìn dòng.
"""
from pathlib import Path

import pytest

GOC = Path(__file__).resolve().parents[1]
BANG = GOC / "sql" / "patch_zzzzzj_ba_bang_sau_thau.sql"
# Bản ĐANG CHẠY của `v_tien_do_su_dung` là patch_zzzzzo, không phải zzzzzk:
# zzzzzk timeout ở quy mô thật, đếm `da_dung` hai lần khi một gói con có nhiều
# đợt, và còn thiếu năm cột hai màn đang đọc. Test phải soi bản mới nhất —
# soi bản cũ là tự ru ngủ (rà soát 25/08/2026).
VIEW = GOC / "sql" / "patch_zzzzzo_tien_do_su_dung_chay_noi.sql"
NAP = GOC / "scripts" / "nap_du_lieu_sau_thau.py"


@pytest.fixture(scope="module")
def sql() -> str:
    assert BANG.exists()
    return BANG.read_text(encoding="utf-8")


def than(sql: str, ten: str) -> str:
    return sql.split(f"create table if not exists {ten} (")[1].split(");")[0]


# ── Bốn quyết định nghiệp vụ ────────────────────────────────────────────────

def test_khong_cot_gia_nao_trong_ca_ba_bang(sql: str) -> None:
    """QĐ 17/08/2026, xác nhận 21/08: web này không quản lý tiền."""
    cam = {"gia", "tran", "tien", "thanh"}
    for bang in ("hop_dong_v3", "hop_dong_ma_hang", "giao_hang"):
        for dong in than(sql, bang).splitlines():
            ten = dong.strip().split()[0] if dong.strip() else ""
            assert not (cam & set(ten.split("_"))), f"{bang}.{ten} là cột giá"


def test_giao_hang_la_su_kien_khong_phai_anh_chup_ton_kho(sql: str) -> None:
    """QĐ 21/08/2026. Ảnh chụp tồn kho tốn ~33 MB/năm so với ~3,2."""
    t = than(sql, "giao_hang")
    assert "ngay_giao" in t and "so_luong_thuc_nhan" in t
    assert "ton_" not in t and "ngay_chot" not in t, \
        "cột tồn kho là dấu hiệu quay lại phương án ảnh chụp định kỳ"


def test_khong_luu_lo_va_han_dung(sql: str) -> None:
    """QĐ 25/08/2026."""
    t = than(sql, "giao_hang")
    assert "so_lo" not in t and "han_dung" not in t


def test_khoa_o_giao_hang_duoc_phep_null(sql: str) -> None:
    """QĐ 25/08/2026: hàng về KHO trước, phần kho→khoa lấy từ HIS."""
    for dong in than(sql, "giao_hang").splitlines():
        if dong.strip().startswith("khoa "):
            assert "not null" not in dong.lower(), \
                "về kho chung là trường hợp thường gặp — ép not null là bắt người dùng bịa"
            return
    pytest.fail("không thấy cột khoa trong giao_hang")


# ── Neo đợt: lớp lỗi dự án đã dính bốn lần ──────────────────────────────────

def test_neo_dot_bang_khoa_ngoai_that_khong_phai_chuoi(sql: str) -> None:
    for bang in ("hop_dong_v3", "giao_hang"):
        t = than(sql, bang)
        assert "references dot_goi(id) on delete cascade" in t, \
            f"{bang} phải neo đợt bằng khoá ngoại thật, không nhét vào chuỗi"


def test_cascade_hai_tang_cho_bang_con(sql: str) -> None:
    assert "references hop_dong_v3(id) on delete cascade" in than(sql, "hop_dong_ma_hang")
    assert "references hop_dong_v3(id) on delete cascade" in than(sql, "giao_hang")


def test_so_hop_dong_duy_nhat_trong_mot_dot(sql: str) -> None:
    assert "create unique index if not exists hop_dong_v3_so_uidx" in sql
    assert "(dot_goi_id, btrim(so_hop_dong))" in sql


# ── Đã giao / còn thiếu là VIEW, không phải cột ─────────────────────────────

def test_da_giao_con_thieu_khong_luu_thanh_cot(sql: str) -> None:
    for bang in ("hop_dong_v3", "hop_dong_ma_hang", "giao_hang"):
        t = than(sql, bang)
        assert "da_giao" not in t and "con_thieu" not in t, \
            "mọi con số cộng ra đều là view — nguyên tắc nền của v3"
    assert "create view v_giao_hang_theo_ma_v3" in sql


def test_so_phai_giao_lay_tu_chot_trinh_ky_khong_phai_hop_dong() -> None:
    """Hai con số này lệch được, và cái quyết định là bản trình ký."""
    v = BANG.read_text(encoding="utf-8").split("create view v_giao_hang_theo_ma_v3")[1]
    assert "chot_trinh_ky_dong_v3" in v
    assert "hieu_luc" in v, "chỉ tính revision trình ký còn hiệu lực"


# ── Mốc cam kết 20/50/80 ────────────────────────────────────────────────────

def test_moc_uu_tien_ngay_giao_lui_ve_chot_trinh_ky() -> None:
    v = VIEW.read_text(encoding="utf-8")
    assert "min(ngay_giao) as lan_giao_dau" in v
    assert "coalesce(g.lan_giao_dau::timestamptz, n.ngay_chot_trinh_ky)" in v, \
        "chưa có dòng giao nào thì phải lùi về ngày chốt trình ký, không để trống"
    assert "then 'giao_hang' else 'chot_trinh_ky' end as nguon_moc" in v, \
        "người xem phải biết mốc đang lấy từ đâu"


def test_view_giu_nguyen_moi_cot_cu() -> None:
    """Bài học 24/08: viết lại view mà rớt cột làm vỡ ba màn, build không thấy.

    Danh sách này phải là **mọi cột màn đang đọc**, không phải mọi cột bản
    trước có. Bản 25/08 chỉ liệt 17 cột của bản v3 nên vẫn xanh trong lúc
    `ThongBaoChamTienDo` chết với `42703` vì thiếu `con_lai` và
    `ngay_du_kien_het` — đo thật ngày 25/08/2026.
    """
    v = VIEW.read_text(encoding="utf-8")
    for c in ("goi_id", "ten_goi", "nam", "loai_mua_sam", "nguon_moc", "ma_hang",
              "ten_vat_tu", "dvt", "ma_quan_ly", "ten_quan_ly", "don_vi",
              "sl_trung", "ngay_bat_dau", "da_dung", "phan_tram_da_dung",
              "thang_da_qua", "nguong_phai_dat", "ngay_chot_trinh_ky", "so_lan_giao",
              "sl_de_xuat", "tb_thang", "con_lai", "thang_con_lai", "ngay_du_kien_het"):
        assert c in v, f"cột {c} biến mất khỏi v_tien_do_su_dung"


def test_da_dung_gop_theo_dung_khoa_cua_moc() -> None:
    """`da_dung` phải gộp theo (đợt × mã × khoa), có `dot_goi_id` trong khoá.

    Thiếu `dot_goi_id`, hai đợt cùng gói con (`bs-t1` năm nào cũng có) nhận
    chung một tổng usage → `da_dung` nhân đôi. Đo thật 25/08/2026: một cặp
    mã × khoa ra 6.762.500 thay vì 3.381.250.
    """
    v = VIEW.read_text(encoding="utf-8")
    than = v.split("dung as materialized (")[1].split("),\n")[0]
    assert "group by" in than and "m.dot_goi_id" in than.split("group by")[1], \
        "khoá gộp của `dung` phải chứa dot_goi_id"
    assert "join dung" not in v and "join dung d" not in v, \
        "không được nối ngược `dung` vào `moc` — đó là chỗ đẻ nested loop 126 triệu dòng"


# ── Đường nạp ───────────────────────────────────────────────────────────────

def test_nap_kiem_truoc_va_mot_transaction() -> None:
    t = NAP.read_text(encoding="utf-8")
    assert "kiem_main()" in t and "KHÔNG nạp dòng nào" in t, \
        "còn lỗi chặn mà vẫn nạp là cách nhanh nhất để có dữ liệu không đối chiếu được"
    assert "cn.commit()" in t and t.count("cn.commit()") == 1, "một transaction duy nhất"


def test_nap_tu_choi_khi_se_nhan_doi_giao_hang() -> None:
    t = NAP.read_text(encoding="utf-8")
    assert "--thay-the" in t and "NHÂN ĐÔI" in t, \
        "giao_hang không có khoá tự nhiên: hai lần giao giống hệt nhau là chuyện có thật"
