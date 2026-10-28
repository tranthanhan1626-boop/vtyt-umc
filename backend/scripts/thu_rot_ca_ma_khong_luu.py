#!/usr/bin/env python3
"""Thử trọn vòng miếng 3 trên gói con thử RHM (859) rồi HUỶ HẾT — không lưu gì.

28/10/2026. Chốt trình ký thật sẽ đẩy cột chữ của dữ liệu thử vào
`danh_muc_chot_ky` (danh mục chuẩn theo kỳ) và Xác nhận rớt sẽ tạo giỏ đợt bổ
sung + thư báo cho khoa thật — nên chạy cả vòng trong MỘT giao dịch, in kết
quả từng bước, cuối cùng ROLLBACK.

    cd backend && set -a && . ./.env.local && set +a
    .venv/bin/python scripts/thu_rot_ca_ma_khong_luu.py
"""
from __future__ import annotations

import os
import sys

import psycopg

STAGING_REF = "ihgfafubwyxnbubmppbj"
DOT_GOI = 859
MA = "67330"


def main() -> int:
    dsn = os.environ.get("SUPABASE_STAGING_DB_URL", "").strip()
    if STAGING_REF not in dsn:
        print("Thiếu SUPABASE_STAGING_DB_URL trỏ đúng staging.")
        return 1
    con = psycopg.connect(dsn)
    c = con.cursor()
    loi = 0

    def buoc(ten, sql, args=()):
        nonlocal loi
        c.execute("savepoint b")
        try:
            c.execute(sql, args)
            kq = c.fetchall() if c.description else None
            c.execute("release savepoint b")
            print(f"✅ {ten}: {kq}")
            return kq
        except Exception as e:  # noqa: BLE001 — in lỗi rồi đi tiếp
            c.execute("rollback to savepoint b")
            print(f"❌ {ten}: {str(e).splitlines()[0]}")
            loi += 1
            return None

    def phai_loi(ten, sql, args, chu):
        nonlocal loi
        c.execute("savepoint b")
        try:
            c.execute(sql, args)
            c.execute("release savepoint b")
            print(f"❌ {ten}: đáng lẽ bị chặn mà chạy được")
            loi += 1
        except Exception as e:  # noqa: BLE001
            c.execute("rollback to savepoint b")
            dong = str(e).splitlines()[0]
            ok = chu in dong
            print(f"{'✅' if ok else '❌'} {ten} bị chặn đúng: {dong}")
            loi += 0 if ok else 1

    try:
        c.execute("""select set_config('request.jwt.claims',
                     '{"email":"pdd@umc.edu.vn","role":"authenticated"}', true)""")
        so = lambda: buoc(  # noqa: E731
            f"   số mã {MA}",
            """select k.so_luong_trung, k.r_mo_thau, k.r_danh_gia,
                      (select json_agg(json_build_object(p.khoa, p.so_luong_trung) order by p.khoa)
                         from phan_bo_trung_v3 p where p.phien_q_id = k.phien_q_id and p.ma_hang = k.ma_hang),
                      (select sum(con_lai) from v_rot_chua_xu_ly_v3 v
                        where v.phien_q_id = k.phien_q_id and v.ma_hang = k.ma_hang)
                 from v_ket_qua_thau_v3 k where k.dot_goi_id = %s and k.ma_hang = %s""", (DOT_GOI, MA))

        phai_loi("Mở thầu trước trình ký",
                 "select cap_nhat_giai_doan_thau_v3(%s,'mo_thau','dang_thuc_hien')", (DOT_GOI,),
                 "Phải chốt trình ký trước")
        buoc("Chốt trình ký (sẽ huỷ)", "select id from chot_trinh_ky_toan_bo_nguyen_khoi_v3(%s)", (DOT_GOI,))
        phai_loi("Mở lại Hội đồng sau trình ký",
                 "select cap_nhat_giai_doan_thau_v3(%s,'hoi_dong','dang_thuc_hien','thử')", (DOT_GOI,),
                 "chốt trình ký")
        buoc("Bắt đầu Mở thầu", "select trang_thai from cap_nhat_giai_doan_thau_v3(%s,'mo_thau','dang_thuc_hien')", (DOT_GOI,))
        so()
        buoc("Không có nhà thầu → rớt cả mã",
             "select so_luong_rot, rot_toan_bo from rot_ca_ma_sau_trinh_ky_v3(%s,%s,'mo_thau','Không có nhà thầu tham dự')",
             (DOT_GOI, MA))
        so()
        phai_loi("Rớt lần hai", "select rot_ca_ma_sau_trinh_ky_v3(%s,%s,'mo_thau','x')", (DOT_GOI, MA), "đã rớt hết")
        buoc("Bỏ rớt (bấm nhầm)", "select bo_rot_ca_ma_sau_trinh_ky_v3(%s,%s,'mo_thau','bấm nhầm')", (DOT_GOI, MA))
        so()
        buoc("Rớt lại", "select so_luong_rot from rot_ca_ma_sau_trinh_ky_v3(%s,%s,'mo_thau','Không có nhà thầu tham dự')",
             (DOT_GOI, MA))
        buoc("Xác nhận rớt → giỏ bổ sung", "select xac_nhan_rot_v3(%s,'mo_thau',null)", (DOT_GOI,))
        so()
        buoc("   giỏ bổ sung của khoa",
             """select t.khoa, t.so_luong, t.giai_doan_phat_sinh from chuyen_tiep_rot_v3 t
                 join chot_q_phien q on q.id = t.phien_q_id and q.hieu_luc
                where q.dot_goi_id = %s and t.ma_hang = %s order by t.khoa""", (DOT_GOI, MA))
        phai_loi("Bỏ rớt sau khi đã xác nhận", "select bo_rot_ca_ma_sau_trinh_ky_v3(%s,%s,'mo_thau','x')",
                 (DOT_GOI, MA), "đã Xác nhận rớt")
        phai_loi("Gõ rớt một phần ở Chào giá sau trình ký",
                 "select ghi_ngoai_le_rot_v3(%s,'67161','chao_gia',1,false,'x')", (DOT_GOI,), "")
        buoc("Hoàn thành Mở thầu", "select trang_thai from cap_nhat_giai_doan_thau_v3(%s,'mo_thau','hoan_thanh')", (DOT_GOI,))
        buoc("Bắt đầu Kết quả đánh giá", "select trang_thai from cap_nhat_giai_doan_thau_v3(%s,'danh_gia','dang_thuc_hien')", (DOT_GOI,))
        buoc("Hoàn thành Kết quả đánh giá", "select trang_thai from cap_nhat_giai_doan_thau_v3(%s,'danh_gia','hoan_thanh')", (DOT_GOI,))
    finally:
        con.rollback()
        con.close()
    print(f"\nĐÃ HUỶ toàn bộ (rollback) — DB giữ nguyên như trước khi chạy. Lỗi: {loi}")
    return 1 if loi else 0


if __name__ == "__main__":
    sys.exit(main())
