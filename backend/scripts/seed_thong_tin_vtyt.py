"""
Nạp danh mục "thông tin vật tư y tế tiêu hao" vào vat_tu: gói thầu + 5 cột đặc
tả (tiêu chí kỹ thuật, tên thương mại, ký mã hiệu, hãng, nước SX), khoá theo mã
hàng. Chạy SAU patch_danh_muc_vtyt.sql (cần các cột mới trong vat_tu).

Chạy: python scripts/seed_thong_tin_vtyt.py "duong/dan/thong tin vat tu y te tieu hao.xlsx"

2 loại mã:
- Mã ĐÃ có trong vat_tu -> chỉ CẬP NHẬT 6 cột đặc tả/gói (KHÔNG đụng ten_vat_tu,
  dvt, ma_quan_ly — giữ tên theo HIS mà người dùng quen).
- Mã CHƯA có (danh mục này khác vat_tu dựng từ lịch sử HIS) -> INSERT mới, đầy
  đủ ten_vat_tu/dvt từ file, ma_quan_ly để null (chưa gán nhóm).

Cần SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (bỏ qua RLS — chỉ chạy local).
"""
import os
import sys

import pandas as pd
from supabase import create_client

COT = {
    "Gói": "goi", "Mã hàng": "ma_hang", "Tên vật tư": "ten_vat_tu", "ĐVT": "dvt",
    "Tiêu chí kỹ thuật": "tieu_chi_ky_thuat", "Tên thương mại": "ten_thuong_mai",
    "Ký mã hiệu": "ky_ma_hieu", "Hãng": "hang", "Nước sản xuất": "nuoc_san_xuat",
}
CHI_TIET = ["goi", "tieu_chi_ky_thuat", "ten_thuong_mai", "ky_ma_hieu", "hang", "nuoc_san_xuat"]


def fetch_ma_hang_hien_co(db):
    known, start = set(), 0
    while True:
        rows = db.table("vat_tu").select("ma_hang").range(start, start + 999).execute().data
        known.update(r["ma_hang"] for r in rows)
        if len(rows) < 1000:
            return known
        start += 1000


def main(filepath: str):
    db = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    df = pd.read_excel(filepath, sheet_name="Sheet1").rename(columns=COT)
    df["ma_hang"] = df["ma_hang"].apply(
        lambda v: str(int(v)) if isinstance(v, float) and v.is_integer() else str(v).strip()
    )
    # File có 5 dòng trùng mã (2 mã thuộc 2 gói) — giữ dòng đầu, đủ cho nhãn gói.
    df = df.drop_duplicates(subset=["ma_hang"], keep="first")
    df = df.astype(object).where(pd.notnull(df), None)  # NaN -> None (bẫy 5.10)
    print(f"Mã hàng trong file (distinct): {len(df)}")

    known = fetch_ma_hang_hien_co(db)
    df_cu = df[df["ma_hang"].isin(known)]
    df_moi = df[~df["ma_hang"].isin(known)]
    print(f"  - đã có trong vat_tu (cập nhật đặc tả): {len(df_cu)}")
    print(f"  - mã mới (insert): {len(df_moi)}")

    # Insert mã mới: đủ ten_vat_tu/dvt + đặc tả, ma_quan_ly để null.
    moi = df_moi[["ma_hang", "ten_vat_tu", "dvt", *CHI_TIET]].to_dict("records")
    for i in range(0, len(moi), 500):
        db.table("vat_tu").insert(moi[i:i + 500]).execute()

    # Cập nhật mã cũ: CHỈ 6 cột đặc tả, không đụng ten_vat_tu/dvt/ma_quan_ly.
    for i, row in enumerate(df_cu.to_dict("records"), 1):
        db.table("vat_tu").update({k: row[k] for k in CHI_TIET}).eq("ma_hang", row["ma_hang"]).execute()
        if i % 300 == 0:
            print(f"    ...đã cập nhật {i}/{len(df_cu)}")

    tong = db.table("vat_tu").select("ma_hang", count="exact").limit(0).execute().count
    co_goi = db.table("vat_tu").select("ma_hang", count="exact").not_.is_("goi", "null").limit(0).execute().count
    print(f"Xong. vat_tu tổng: {tong}, có gói thầu: {co_goi}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print('Dùng: python scripts/seed_thong_tin_vtyt.py "duong/dan/file.xlsx"')
        sys.exit(1)
    main(sys.argv[1])
