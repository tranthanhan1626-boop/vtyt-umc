"""
Chạy 1 LẦN trước khi nạp lịch sử lần đầu (và mỗi khi HIS có mã/nhóm mới).
Đọc distinct (Mã hàng, Tên vật tư, ĐVT, Mã quản lý, Tên quản lý) từ file HIS,
upsert vào nhom_ky_thuat rồi vat_tu (đúng thứ tự vì vat_tu.ma_quan_ly là FK).

Chạy: python scripts/seed_danh_muc.py duong/dan/file.xlsx

Cần biến môi trường SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (key ADMIN, bỏ
qua RLS — KHÔNG đưa key này vào bất kỳ đâu trong thư mục frontend/).
"""
import os
import sys

import pandas as pd
from supabase import create_client

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.core.config import HIS_COLUMN_MAP  # noqa: E402


def main(filepath: str):
    supabase_url = os.environ["SUPABASE_URL"]
    service_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    db = create_client(supabase_url, service_key)

    raw_df = pd.read_excel(filepath, sheet_name="Export")
    df = raw_df.rename(columns=HIS_COLUMN_MAP)

    # Bỏ dòng rác (Total, blank, cảnh báo Power BI...) trước khi lấy danh mục
    df = df.dropna(subset=["ma_hang"])
    df["ma_hang"] = df["ma_hang"].apply(
        lambda v: str(int(v)) if isinstance(v, float) and v.is_integer() else str(v).strip()
    )

    # --- Nhóm kỹ thuật (mã quản lý) trước, vì vat_tu tham chiếu tới nó ------
    nhom = (
        df.dropna(subset=["ma_quan_ly"])[["ma_quan_ly", "ten_quan_ly"]]
        .drop_duplicates(subset=["ma_quan_ly"])
    )
    print(f"Nhóm kỹ thuật (mã quản lý) distinct: {len(nhom)}")
    for i in range(0, len(nhom), 500):
        chunk = nhom.iloc[i : i + 500].to_dict("records")
        db.table("nhom_ky_thuat").upsert(chunk, on_conflict="ma_quan_ly").execute()

    # --- Vật tư (mã hàng) — ma_quan_ly có thể null (đã xác nhận ~10.5% dữ liệu thật) ---
    vat_tu = (
        df[["ma_hang", "ten_vat_tu", "dvt", "ma_quan_ly"]]
        .drop_duplicates(subset=["ma_hang"])
    )
    # .where(notnull, None) KHÔNG đổi được NaN->None với dtype `str` của pandas
    # mới (NaN còn nguyên -> json.dumps lỗi "Out of range float values").
    # astype(object) trước mới ép được về None thật.
    vat_tu = vat_tu.astype(object).where(pd.notnull(vat_tu), None)
    print(f"Vật tư (mã hàng) distinct: {len(vat_tu)}")
    for i in range(0, len(vat_tu), 500):
        chunk = vat_tu.iloc[i : i + 500].to_dict("records")
        db.table("vat_tu").upsert(chunk, on_conflict="ma_hang").execute()

    print("Xong. Kiểm tra lại trong Supabase Table Editor: nhom_ky_thuat, vat_tu.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Dùng: python scripts/seed_danh_muc.py duong/dan/file.xlsx")
        sys.exit(1)
    main(sys.argv[1])
