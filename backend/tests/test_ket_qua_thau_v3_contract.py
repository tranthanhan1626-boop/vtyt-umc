from pathlib import Path

PATCH=(Path(__file__).resolve().parents[1]/"sql"/"patch_zzzzc_v3_ket_qua_thau.sql").read_text()

def test_three_ordered_stages_and_reopen_invalidation():
    for x in ("chao_gia","mo_thau","danh_gia"): assert x in PATCH
    assert "Phải hoàn thành giai đoạn trước" in PATCH
    assert "ly_do_vo_hieu" in PATCH

def test_winner_is_q_minus_three_rejection_stages():
    assert "q.q-coalesce(r.r1,0)-coalesce(r.r2,0)-coalesce(r.r3,0)" in PATCH
    assert "Tổng rớt R1+R2+R3" in PATCH

def test_winner_allocation_is_only_to_q_departments_and_exact():
    assert "floor(v_trung*q_khoa/v_q)" in PATCH
    assert "Chỉ được phân bổ cho đúng các khoa có trong Q" in PATCH
    assert "Tổng phân bổ % phải bằng số trúng %" in PATCH
    assert "Phân bổ vượt Q của khoa phải nhập lý do" in PATCH

def test_rejection_cart_is_derived_from_unmet_q():
    assert "create or replace view v_gio_rot_v3" in PATCH
    assert "g.so_luong_q-g.so_luong_trung" in PATCH
    assert "da_submit_bo_sung" in PATCH
    assert "khong_con_nhu_cau" in PATCH

def test_legacy_30_percent_activation_is_closed():
    assert "revoke execute on function kich_hoat_tuy_chon_mua_them_30" in PATCH
