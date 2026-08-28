#!/usr/bin/env python3
"""Kiểm DANH MỤC CHUẨN THEO KỲ trên staging, trong một giao dịch TỰ HUỶ.

Chạy được bất cứ lúc nào, kể cả trên dữ liệu thật: mọi thứ script ghi ra đều
bị `rollback` ở cuối, staging không đổi một dòng nào.

Kiểm năm hành vi của patch_zzzzzzd:
  1. PĐD gõ ô mà CHƯA chốt  -> danh mục chuẩn không đổi
  2. Chốt đợt 200           -> ô xuống chuẩn, gồm cả cột trước đây không có chỗ
  3. Đợt 201 chốt SAU       -> đè đợt 200, và khối "kỳ trước" hiện bản đợt 200
  4. Đẩy lại lần nữa        -> 0 ô (không sinh rác)
  5. Cột số                 -> bị check constraint chặn

    cd backend
    set -a && . ./.env.local && set +a
    .venv/bin/python scripts/kiem_danh_muc_chuan_theo_ky.py
"""
import os, psycopg
dsn = os.environ["SUPABASE_STAGING_DB_URL"]
assert "ihgfafubwyxnbubmppbj" in dsn, "TỪ CHỐI: không trỏ staging đã định danh."
with psycopg.connect(dsn, autocommit=False) as conn:
    cur = conn.cursor()
    def show(nhan):
        cur.execute("""select ten_vt_2627, left(coalesce(tskt_2627,'-'),28) as tskt,
                              coalesce(ma_tt04,'-') as ma_tt04, coalesce(tskt_2526,'-') as ky_truoc
                       from v_danh_muc_chuan where ma_hang='66326'""")
        print(f"  {nhan:14} {cur.fetchone()}")

    cur.execute("select id, dot_id, goi_id from dot_goi where dot_id=200 and goi_id='18t-dung-chung'")
    dg_id, dot_id, goi_id = cur.fetchone()
    cur.execute("select nam from dot_de_xuat where id=%s", (dot_id,))
    nam = cur.fetchone()[0]
    scope = f"{goi_id}:dot:{dot_id}"
    print(f"dot_goi={dg_id} dot={dot_id} scope={scope} nam={nam}\n")

    print("TRƯỚC KHI SỬA:"); show("gốc")

    # PĐD sửa 2 ô: 1 cột có nền HIS (tskt) + 1 cột trước đây không có chỗ nào (ma_tt04)
    for cot, gt in [("tskt_2627", "TSKT BẢN PĐD SỬA ĐỢT 200"), ("ma_tt04", "TT04-ABC")]:
        cur.execute("""insert into danh_muc_tong_hop_o (goi_id, nam_de_xuat, ma_hang, cot, gia_tri, updated_by)
                       values (%s,%s,'66326',%s,%s,'pdd@umc.edu.vn')
                       on conflict (goi_id,nam_de_xuat,ma_hang,cot)
                       do update set gia_tri=excluded.gia_tri""", (scope, nam, cot, gt))
    print("\nSAU KHI PĐD GÕ Ô (chưa chốt):"); show("chưa chốt")

    cur.execute("select day_ky_ve_danh_muc(%s)", (dg_id,))
    print(f"\nĐẨY ĐỢT 200 → ghi {cur.fetchone()[0]} ô"); show("sau chốt 200")

    # Đợt 201 chốt SAU, sửa cùng mã -> phải đè, và kỳ trước phải hiện bản đợt 200
    cur.execute("select id, dot_id, goi_id from dot_goi where dot_id=201")
    dg2, dot2, goi2 = cur.fetchone()
    cur.execute("select nam from dot_de_xuat where id=%s", (dot2,))
    nam2 = cur.fetchone()[0]
    cur.execute("""insert into danh_muc_tong_hop_o (goi_id,nam_de_xuat,ma_hang,cot,gia_tri,updated_by)
                   values (%s,%s,'66326','tskt_2627','TSKT BẢN ĐỢT 201 LÀM SAU','pdd@umc.edu.vn')""",
                (f"{goi2}:dot:{dot2}", nam2))
    cur.execute("select day_ky_ve_danh_muc(%s)", (dg2,))
    print(f"\nĐẨY ĐỢT 201 (làm sau) → ghi {cur.fetchone()[0]} ô"); show("sau chốt 201")

    # Đẩy lại đợt 201 lần nữa: không được sinh thêm dòng nào
    cur.execute("select day_ky_ve_danh_muc(%s)", (dg2,))
    print(f"\nĐẨY LẠI ĐỢT 201 → ghi {cur.fetchone()[0]} ô (kỳ vọng 0)")

    cur.execute("select dot_id, cot, gia_tri from danh_muc_chot_ky order by dot_id, cot")
    print("\nBảng chốt:")
    for r in cur.fetchall(): print("   ", r)

    # Cột số phải bị chặn
    try:
        cur.execute("insert into danh_muc_chot_ky (dot_id,ma_hang,cot,gia_tri) values (%s,'66326','sl_de_xuat_2627','999')", (dot_id,))
        print("\n❌ CHẶN HỎNG: ghi được cột số!")
    except Exception as e:
        conn.rollback()
        print(f"\n✅ Cột số bị chặn đúng: {type(e).__name__}")
    conn.rollback()
print("\n↩︎ đã rollback, staging sạch")
