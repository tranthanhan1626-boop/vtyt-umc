"""
Chạy MỖI LẦN có file HIS mới (2 lần/tuần). Thay cho /api/ingest/commit —
chạy local trên máy admin, không cần host, không lo giới hạn timeout serverless
(file ~150k dòng, quá 10 giây free-tier serverless cho phép).

Dùng:
  python scripts/ingest_cli.py duong/dan/file.xlsx --preview   # chỉ xem, không ghi
  python scripts/ingest_cli.py duong/dan/file.xlsx --commit    # ghi thật
  python scripts/ingest_cli.py duong/dan/file.xlsx --commit --ack-incomplete
      # bắt buộc thêm --ack-incomplete nếu preview báo has_truncation_warning=true

Cần biến môi trường SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
"""
import argparse
import os
import sys

import pandas as pd
from supabase import create_client

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.ingest.validator import FileLevelRejection, validate_and_clean  # noqa: E402


def get_known_ma_hang(db) -> set[str]:
    # PostgREST trả tối đa 1000 dòng/request -> phải phân trang, nếu không
    # sẽ báo nhầm "mã hàng chưa có trong danh mục" cho phần vượt 1000.
    PAGE = 1000
    known: set[str] = set()
    offset = 0
    while True:
        res = db.table("vat_tu").select("ma_hang").range(offset, offset + PAGE - 1).execute()
        known.update(row["ma_hang"] for row in res.data)
        if len(res.data) < PAGE:
            return known
        offset += PAGE


def print_result(result):
    print(f"row_count_raw           : {result.row_count_raw}")
    print(f"row_count_junk_stripped  : {result.row_count_junk_stripped}")
    print(f"row_count_rejected       : {result.row_count_rejected}")
    print(f"row_count_committed      : {result.row_count_committed}")
    print(f"has_truncation_warning   : {result.has_truncation_warning}")
    if result.warnings:
        print("Cảnh báo:")
        for w in result.warnings:
            print(f"  - {w}")
    if result.rejected_rows_sample:
        print(f"Mẫu dòng bị loại (tối đa 50, xem đủ trong import_batches.rejected_rows_sample):")
        for r in result.rejected_rows_sample[:10]:
            print(f"  - {r}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("filepath")
    parser.add_argument("--preview", action="store_true")
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--ack-incomplete", action="store_true",
                         help="Xác nhận đã biết file có thể thiếu dữ liệu (Power BI export limit), vẫn muốn nạp.")
    args = parser.parse_args()

    if not args.preview and not args.commit:
        print("Phải chọn --preview hoặc --commit.")
        sys.exit(1)

    supabase_url = os.environ["SUPABASE_URL"]
    service_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    db = create_client(supabase_url, service_key)

    print(f"Đang đọc {args.filepath} ...")
    raw_df = pd.read_excel(args.filepath, sheet_name="Export")
    known_ma_hang = get_known_ma_hang(db)

    try:
        result = validate_and_clean(raw_df, known_ma_hang=known_ma_hang)
    except FileLevelRejection as e:
        print(f"TỪ CHỐI NẠP: {e}")
        sys.exit(1)

    print_result(result)

    if args.preview:
        print("\n(Chế độ --preview: chưa ghi gì vào DB.)")
        return

    if result.has_truncation_warning and not args.ack_incomplete:
        print(
            "\nDỪNG: file có dấu hiệu bị Power BI cắt bớt dữ liệu. Chạy lại với "
            "--ack-incomplete nếu vẫn muốn nạp (đã hiểu dữ liệu có thể thiếu)."
        )
        sys.exit(1)

    batch = (
        db.table("import_batches")
        .insert({
            "source_filename": os.path.basename(args.filepath),
            "imported_by": os.environ.get("ADMIN_EMAIL", "admin@umc.edu.vn"),
            "row_count_raw": result.row_count_raw,
            "row_count_junk_stripped": result.row_count_junk_stripped,
            "row_count_rejected": result.row_count_rejected,
            "row_count_upserted": result.row_count_committed,
            "has_truncation_warning": result.has_truncation_warning,
            "acknowledged_incomplete": args.ack_incomplete,
            "warnings": result.warnings,
            "rejected_rows_sample": result.rejected_rows_sample,
        })
        .execute()
        .data[0]
    )
    print(f"\nĐã tạo import_batches.id = {batch['id']}. Đang upsert usage_history_current ...")

    records = result.clean_df.assign(last_batch_id=batch["id"]).to_dict("records")
    CHUNK = 500
    for i in range(0, len(records), CHUNK):
        chunk = records[i : i + CHUNK]
        db.table("usage_history_current").upsert(
            chunk, on_conflict="don_vi,kho_xuat,ma_hang,nam,thang"
        ).execute()
        print(f"  ... {min(i + CHUNK, len(records))}/{len(records)}")

    print("\nXong. Kiểm tra usage_history_changelog để xem dòng nào thực sự đổi giá trị.")


if __name__ == "__main__":
    main()
