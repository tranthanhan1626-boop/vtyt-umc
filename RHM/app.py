#!/usr/bin/env python3
"""Web localhost RHM — không cần framework hay dịch vụ bên ngoài."""

from __future__ import annotations

import argparse
import csv
import io
import json
import math
import mimetypes
import sqlite3
import threading
import webbrowser
from contextlib import closing
from datetime import datetime
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse


APP_ROOT = Path(__file__).resolve().parent
STATIC_ROOT = APP_ROOT / "static"
DATA_ROOT = APP_ROOT / "data"
SEED_FILE = DATA_ROOT / "seed.json"
DB_FILE = DATA_ROOT / "rhm.sqlite3"
MAX_BODY_BYTES = 5 * 1024 * 1024

DECISION_FIELDS = {
    "stock",
    "incoming",
    "shelf_life_months",
    "unit_price",
    "proposed_qty",
    "reason_type",
    "reason_text",
    "procedure_current",
    "procedure_future",
    "clinical_context",
    "substitute_status",
    "stockout_months",
    "source_reference",
    "actor_name",
    "actor_unit",
    "review_status",
}

NUMERIC_DECISION_FIELDS = {
    "stock",
    "incoming",
    "shelf_life_months",
    "unit_price",
    "proposed_qty",
    "procedure_current",
    "procedure_future",
    "stockout_months",
}

SETTINGS_FIELDS = {
    "period_from",
    "period_to",
    "horizon_months",
    "transition_delay_months",
    "r_adjust",
    "k_ab",
    "k_c",
    "abc_cutoff",
}

# Trọng số mô phỏng được ước lượng từ trung vị:
#   số Khoa từng đề xuất / nhu cầu nền 18 tháng
# trên các dòng RHM cũ có cùng nhóm lý do. Nhóm thiếu mẫu được gắn rõ "tạm giả
# lập" để sau này thay bằng dữ liệu ĐVSD thu thập trực tiếp.
REASON_WEIGHTS = {
    "theo_lich_su": {
        "label": "Nhu cầu ổn định, theo lịch sử",
        "weight": 1.0,
        "sample_size": 0,
        "source": "Mốc trung tính",
    },
    "tang_nhu_cau": {
        "label": "Tăng số ca / tăng nhu cầu",
        "weight": 1.68,
        "sample_size": 73,
        "source": "Trung vị 73 dòng dữ liệu cũ",
    },
    "giam_nhu_cau": {
        "label": "Giảm số ca / giảm nhu cầu",
        "weight": 0.7,
        "sample_size": 4,
        "source": "Tạm hiệu chỉnh; 4 mẫu cũ đều là ngưng dùng",
    },
    "ngung_su_dung": {
        "label": "Ngưng sử dụng vật tư",
        "weight": 0.0,
        "sample_size": 4,
        "source": "Trung vị 4 dòng giảm/ngưng dùng cũ",
    },
    "ky_thuat_moi": {
        "label": "Triển khai kỹ thuật / danh mục mới",
        "weight": 2.96,
        "sample_size": 1,
        "source": "Trung vị 1 dòng dữ liệu cũ",
    },
    "dut_hang": {
        "label": "Lịch sử bị thiếu hàng / không trúng thầu",
        "weight": 1.3,
        "sample_size": 0,
        "source": "Tạm giả lập — chưa có mẫu lý do cũ",
    },
    "thiet_yeu": {
        "label": "Vật tư thiết yếu / dự phòng cấp cứu",
        "weight": 2.29,
        "sample_size": 2,
        "source": "Trung vị 2 dòng dữ liệu cũ",
    },
    "thay_the": {
        "label": "Có vật tư hoặc kỹ thuật thay thế",
        "weight": 0.7,
        "sample_size": 0,
        "source": "Tạm giả lập — chưa có mẫu lý do cũ",
    },
    "khac": {
        "label": "Lý do khác",
        "weight": 1.79,
        "sample_size": 121,
        "source": "Trung vị 121 dòng dữ liệu cũ",
    },
}


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def load_seed() -> dict[str, Any]:
    if not SEED_FILE.exists():
        raise RuntimeError(
            f"Thiếu {SEED_FILE}. Hãy chạy scripts/build_seed.py trước."
        )
    return json.loads(SEED_FILE.read_text(encoding="utf-8"))


def connect_db() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_FILE, timeout=15)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA foreign_keys=ON")
    return connection


def initialize_database() -> None:
    DATA_ROOT.mkdir(parents=True, exist_ok=True)
    seed = load_seed()
    with closing(connect_db()) as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS decisions (
                item_id TEXT PRIMARY KEY,
                stock REAL,
                incoming REAL,
                shelf_life_months REAL,
                unit_price REAL,
                proposed_qty REAL,
                reason_type TEXT,
                reason_text TEXT,
                procedure_current REAL,
                procedure_future REAL,
                clinical_context TEXT,
                substitute_status TEXT,
                stockout_months REAL,
                source_reference TEXT,
                actor_name TEXT,
                actor_unit TEXT,
                review_status TEXT NOT NULL DEFAULT 'nhap',
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id TEXT,
                action TEXT NOT NULL,
                actor_name TEXT,
                old_payload TEXT,
                new_payload TEXT,
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_audit_item
            ON audit_log(item_id, created_at DESC);
            """
        )
        existing_settings = connection.execute(
            "SELECT 1 FROM settings WHERE id = 1"
        ).fetchone()
        if not existing_settings:
            connection.execute(
                "INSERT INTO settings(id, payload, updated_at) VALUES(1, ?, ?)",
                (json.dumps(seed["settings"], ensure_ascii=False), now_iso()),
            )

        existing_count = connection.execute(
            "SELECT COUNT(*) AS count FROM decisions"
        ).fetchone()["count"]
        if existing_count == 0:
            for item in seed["items"]:
                imported_reason = item.get("current_reason", "")
                status = (
                    "can_xac_nhan"
                    if imported_reason
                    else "can_giai_trinh"
                    if item.get("reason_required")
                    else "nhap"
                )
                connection.execute(
                    """
                    INSERT INTO decisions(
                        item_id, proposed_qty, reason_type, reason_text,
                        actor_name, actor_unit, review_status, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        item["id"],
                        item.get("initial_working_qty"),
                        item.get("reason_type", "theo_lich_su"),
                        imported_reason,
                        "Dữ liệu nhập từ workbook RHM" if imported_reason else "",
                        "Khoa RHM",
                        status,
                        now_iso(),
                    ),
                )
        connection.commit()


def get_settings(connection: sqlite3.Connection) -> dict[str, Any]:
    row = connection.execute("SELECT payload FROM settings WHERE id = 1").fetchone()
    return json.loads(row["payload"])


def get_decisions(connection: sqlite3.Connection) -> dict[str, dict[str, Any]]:
    return {
        row["item_id"]: dict(row)
        for row in connection.execute("SELECT * FROM decisions").fetchall()
    }


def safe_float(value: Any, *, minimum: float | None = None) -> float | None:
    if value in (None, ""):
        return None
    try:
        result = float(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"Giá trị số không hợp lệ: {value}") from error
    if not math.isfinite(result):
        raise ValueError("Giá trị số phải hữu hạn.")
    if minimum is not None and result < minimum:
        raise ValueError(f"Giá trị phải lớn hơn hoặc bằng {minimum}.")
    return result


def rounded_quantity(value: float) -> int:
    return max(0, math.ceil(value - 1e-9))


def calculate_item(
    item: dict[str, Any],
    decision: dict[str, Any],
    settings: dict[str, Any],
) -> dict[str, Any]:
    d12 = float(item.get("d12") or 0)
    base_months = float(settings.get("horizon_months") or 18)
    transition_delay = float(settings.get("transition_delay_months") or 0)
    horizon = max(1, base_months + transition_delay)

    # Dùng toàn bộ chuỗi tháng nguồn thay vì chỉ D12. Trọng số theo năm giúp dữ
    # liệu gần hiện tại có ảnh hưởng lớn hơn nhưng không bỏ các mốc cũ:
    # 2024 × 1, 2025 × 2, 2026 × 3.
    monthly = item.get("monthly") or {}
    year_weights = {"2024": 1.0, "2025": 2.0, "2026": 3.0}
    weighted_sum = 0.0
    weight_total = 0.0
    history_total = 0.0
    for month, value in sorted(monthly.items()):
        quantity = float(value or 0)
        weight = year_weights.get(str(month)[:4], 1.0)
        history_total += quantity
        weighted_sum += quantity * weight
        weight_total += weight
    if weight_total:
        weighted_monthly_average = weighted_sum / weight_total
    else:
        # Tương thích với dữ liệu kiểm thử/cũ chưa có chuỗi tháng.
        weighted_monthly_average = d12 / 12
    base_need = weighted_monthly_average * horizon
    gross = base_need
    floor = base_need
    raw_net = base_need
    formula_final = max(base_need, 0)
    expiry_ceiling = None
    formula_final_rounded = rounded_quantity(formula_final)

    proposed = decision.get("proposed_qty")
    if proposed is None:
        proposed = formula_final_rounded
    proposed = float(proposed)
    delta = None
    if formula_final_rounded == 0:
        if proposed > 0:
            delta = 1.0
    else:
        delta = (proposed - formula_final_rounded) / formula_final_rounded
    reason_required = bool(
        (formula_final_rounded == 0 and proposed > 0)
        or (
            formula_final_rounded > 0
            and abs(proposed - formula_final_rounded) / formula_final_rounded > 0.30
        )
        or (formula_final_rounded > 0 and proposed == 0)
    )
    reason_text = (decision.get("reason_text") or "").strip()
    data_complete = True
    confirmed = decision.get("review_status") in {"da_gui", "da_duyet"}
    if confirmed and reason_required and len(reason_text) < 20:
        review_state = "can_giai_trinh"
    elif decision.get("review_status") == "da_duyet":
        review_state = "da_duyet"
    elif decision.get("review_status") == "da_gui":
        review_state = "da_gui"
    elif reason_required and len(reason_text) < 20:
        review_state = "can_giai_trinh"
    elif reason_required and decision.get("review_status") == "can_xac_nhan":
        review_state = "can_xac_nhan"
    elif not data_complete:
        review_state = "cho_du_lieu"
    else:
        review_state = "san_sang"

    price = decision.get("unit_price")
    if price is None:
        price = item.get("reference_price")
    estimated_value = proposed * float(price) if price is not None else None

    result = dict(item)
    result["decision"] = {
        key: decision.get(key)
        for key in DECISION_FIELDS | {"updated_at"}
    }
    result["calculation"] = {
        "horizon_months": horizon,
        "k": 1.0,
        "history_months": len(monthly),
        "history_total": round(history_total, 4),
        "history_weighted_sum": round(weighted_sum, 4),
        "history_weight_total": round(weight_total, 4),
        "weighted_monthly_average": round(weighted_monthly_average, 4),
        "base_need": round(base_need, 4),
        "year_weights": year_weights,
        "gross": round(gross, 4),
        "floor": round(floor, 4),
        "raw_net": round(raw_net, 4),
        "expiry_ceiling": None if expiry_ceiling is None else round(expiry_ceiling, 4),
        "formula_final": formula_final_rounded,
        "proposed_qty": proposed,
        "delta": None if delta is None else round(delta, 4),
        "reason_required": reason_required,
        "data_complete": data_complete,
        "review_state": review_state,
        "effective_unit_price": price,
        "estimated_value": None if estimated_value is None else round(estimated_value, 2),
    }
    return result


def assign_dynamic_abc(
    items: list[dict[str, Any]],
    decisions: dict[str, dict[str, Any]],
    cutoff: float,
) -> list[dict[str, Any]]:
    """Phân ABC lại khi người dùng bổ sung giá hoặc đổi ngưỡng lũy kế."""

    copied = [dict(item) for item in items]
    groups: dict[str, dict[str, Any]] = {}
    for item in copied:
        key = item.get("management_code") or item.get("technical_code") or item["id"]
        group = groups.setdefault(
            key,
            {"items": [], "quantity": 0.0, "value": 0.0, "price_complete": True},
        )
        group["items"].append(item)
        quantity = float(item.get("d12") or 0)
        group["quantity"] += quantity
        decision_price = decisions.get(item["id"], {}).get("unit_price")
        price = decision_price if decision_price is not None else item.get("reference_price")
        if quantity > 0 and price is None:
            group["price_complete"] = False
        if price is not None:
            group["value"] += quantity * float(price)

    assignments: dict[str, tuple[str, str]] = {}
    value_groups = [
        (key, group)
        for key, group in groups.items()
        if group["quantity"] > 0 and group["price_complete"] and group["value"] > 0
    ]
    quantity_groups = [
        (key, group)
        for key, group in groups.items()
        if group["quantity"] > 0
        and not (group["price_complete"] and group["value"] > 0)
    ]
    for subset, metric, method in (
        (value_groups, "value", "Giá trị tiền"),
        (quantity_groups, "quantity", "Số lượng (tạm do thiếu giá)"),
    ):
        total = sum(float(group[metric]) for _, group in subset)
        cumulative = 0.0
        for key, group in sorted(subset, key=lambda pair: pair[1][metric], reverse=True):
            share_before = cumulative / total if total else 1.0
            assignments[key] = ("A+B" if share_before < cutoff else "C", method)
            cumulative += float(group[metric])

    for key, group in groups.items():
        if group["quantity"] <= 0:
            abc_group, abc_method = "MỚI", "Chưa có D12"
        else:
            abc_group, abc_method = assignments[key]
        for item in group["items"]:
            item["abc_group"] = abc_group
            item["abc_method"] = abc_method
    return copied


def build_bootstrap() -> dict[str, Any]:
    seed = load_seed()
    with closing(connect_db()) as connection:
        settings = get_settings(connection)
        decisions = get_decisions(connection)
    classified_items = assign_dynamic_abc(
        seed["items"],
        decisions,
        float(settings.get("abc_cutoff") or 0.95),
    )
    computed = [
        calculate_item(item, decisions.get(item["id"], {}), settings)
        for item in classified_items
    ]
    priced_items = [
        item for item in computed if item["calculation"]["estimated_value"] is not None
    ]
    summary = {
        "total_lines": len(computed),
        "tender_lines": sum(item["scope"] == "chuyen_khoa" for item in computed),
        "supplemental_lines": sum(item["scope"] != "chuyen_khoa" for item in computed),
        "needs_reason": sum(
            item["calculation"]["review_state"] == "can_giai_trinh"
            for item in computed
        ),
        "needs_confirmation": sum(
            item["calculation"]["review_state"] == "can_xac_nhan"
            for item in computed
        ),
        "waiting_data": sum(
            item["calculation"]["review_state"] == "cho_du_lieu"
            for item in computed
        ),
        "submitted": sum(
            item["calculation"]["review_state"] in {"da_gui", "da_duyet"}
            for item in computed
        ),
        "estimated_budget": round(
            sum(item["calculation"]["estimated_value"] or 0 for item in computed), 2
        ),
        "budget_coverage": round(len(priced_items) / len(computed), 4) if computed else 0,
        "stock_coverage": round(
            sum(item["decision"].get("stock") is not None for item in computed)
            / len(computed),
            4,
        )
        if computed
        else 0,
        "reason_coverage": round(
            sum(
                len((item["decision"].get("reason_text") or "").strip()) >= 20
                for item in computed
                if item["calculation"]["reason_required"]
            )
            / max(
                1,
                sum(item["calculation"]["reason_required"] for item in computed),
            ),
            4,
        ),
    }
    return {
        "meta": seed["meta"],
        "quality": seed["quality"],
        "settings": settings,
        "reason_weights": REASON_WEIGHTS,
        "summary": summary,
        "activity_monthly": seed["activity_monthly"],
        "items": computed,
    }


def save_decision(item_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    seed = load_seed()
    item = next((row for row in seed["items"] if row["id"] == item_id), None)
    if item is None:
        raise LookupError("Không tìm thấy dòng vật tư.")
    clean: dict[str, Any] = {}
    for key, value in payload.items():
        if key not in DECISION_FIELDS:
            continue
        if key in NUMERIC_DECISION_FIELDS:
            clean[key] = safe_float(value, minimum=0)
        else:
            clean[key] = as_short_text(value, 8000)
    if not clean:
        raise ValueError("Không có trường hợp lệ để lưu.")
    if clean.get("review_status") in {"da_gui", "da_duyet"}:
        actor = (clean.get("actor_name") or payload.get("actor_name") or "").strip()
        if not actor:
            raise ValueError("Cần nhập họ tên người xác nhận trước khi gửi.")

    with closing(connect_db()) as connection:
        old_row = connection.execute(
            "SELECT * FROM decisions WHERE item_id = ?", (item_id,)
        ).fetchone()
        if old_row is None:
            connection.execute(
                "INSERT INTO decisions(item_id, updated_at) VALUES(?, ?)",
                (item_id, now_iso()),
            )
            old_payload: dict[str, Any] = {}
        else:
            old_payload = dict(old_row)
        clean["updated_at"] = now_iso()
        assignments = ", ".join(f"{key} = ?" for key in clean)
        connection.execute(
            f"UPDATE decisions SET {assignments} WHERE item_id = ?",
            (*clean.values(), item_id),
        )
        new_row = connection.execute(
            "SELECT * FROM decisions WHERE item_id = ?", (item_id,)
        ).fetchone()
        actor_name = clean.get("actor_name") or old_payload.get("actor_name") or ""
        connection.execute(
            """
            INSERT INTO audit_log(
                item_id, action, actor_name, old_payload, new_payload, created_at
            ) VALUES (?, 'Cập nhật hồ sơ', ?, ?, ?, ?)
            """,
            (
                item_id,
                actor_name,
                json.dumps(old_payload, ensure_ascii=False),
                json.dumps(dict(new_row), ensure_ascii=False),
                now_iso(),
            ),
        )
        settings = get_settings(connection)
        connection.commit()
    return calculate_item(item, dict(new_row), settings)


def as_short_text(value: Any, limit: int) -> str:
    if value is None:
        return ""
    return str(value).strip()[:limit]


def save_settings(payload: dict[str, Any]) -> dict[str, Any]:
    with closing(connect_db()) as connection:
        old = get_settings(connection)
        updated = dict(old)
        for key, value in payload.items():
            if key not in SETTINGS_FIELDS:
                continue
            if key in {"period_from", "period_to"}:
                updated[key] = as_short_text(value, 7)
            else:
                minimum = 0 if key != "r_adjust" else 0.01
                updated[key] = safe_float(value, minimum=minimum)
        if not 1 <= float(updated["horizon_months"]) <= 60:
            raise ValueError("Số tháng hợp đồng phải từ 1 đến 60.")
        if not 0 <= float(updated["transition_delay_months"]) <= 24:
            raise ValueError("Độ trễ chuyển kỳ phải từ 0 đến 24 tháng.")
        if not 0 < float(updated["abc_cutoff"]) <= 1:
            raise ValueError("Ngưỡng ABC phải nằm trong (0; 1].")
        connection.execute(
            "UPDATE settings SET payload = ?, updated_at = ? WHERE id = 1",
            (json.dumps(updated, ensure_ascii=False), now_iso()),
        )
        connection.execute(
            """
            INSERT INTO audit_log(action, actor_name, old_payload, new_payload, created_at)
            VALUES('Cập nhật tham số', ?, ?, ?, ?)
            """,
            (
                as_short_text(payload.get("actor_name"), 200),
                json.dumps(old, ensure_ascii=False),
                json.dumps(updated, ensure_ascii=False),
                now_iso(),
            ),
        )
        connection.commit()
    return updated


def bulk_supplement(payload: dict[str, Any]) -> dict[str, Any]:
    rows = payload.get("rows")
    if not isinstance(rows, list):
        raise ValueError("Dữ liệu bổ sung phải có mảng rows.")
    seed = load_seed()
    index: dict[str, set[str]] = {}
    for item in seed["items"]:
        keys = [item["id"], item.get("technical_code", "")]
        keys.extend(item.get("his_codes", []))
        for key in keys:
            if key:
                index.setdefault(str(key).strip(), set()).add(item["id"])

    updated: list[str] = []
    skipped: list[dict[str, Any]] = []
    for row_number, row in enumerate(rows, start=2):
        if not isinstance(row, dict):
            skipped.append({"row": row_number, "reason": "Dòng không hợp lệ"})
            continue
        lookup = as_short_text(
            row.get("item_id") or row.get("ma_his") or row.get("ma_ky_thuat"),
            200,
        )
        matches = index.get(lookup, set())
        if len(matches) != 1:
            skipped.append(
                {
                    "row": row_number,
                    "lookup": lookup,
                    "reason": "Không tìm thấy duy nhất một dòng",
                }
            )
            continue
        item_id = next(iter(matches))
        decision_payload = {
            "stock": row.get("ton_kho"),
            "incoming": row.get("hang_dang_ve"),
            "shelf_life_months": row.get("han_dung_thang"),
            "unit_price": row.get("don_gia"),
            "proposed_qty": row.get("so_luong_de_xuat"),
            "actor_name": payload.get("actor_name") or "Nhập CSV",
            "actor_unit": payload.get("actor_unit") or "Phòng Vật tư",
        }
        decision_payload = {
            key: value
            for key, value in decision_payload.items()
            if value not in (None, "")
        }
        try:
            save_decision(item_id, decision_payload)
            updated.append(item_id)
        except (ValueError, LookupError) as error:
            skipped.append({"row": row_number, "lookup": lookup, "reason": str(error)})
    return {
        "updated": len(updated),
        "updated_ids": updated,
        "skipped": skipped,
    }


def export_csv() -> bytes:
    data = build_bootstrap()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "STT",
            "Phạm vi",
            "Mã HIS",
            "Mã quản lý",
            "Mã kỹ thuật",
            "Tên vật tư",
            "ĐVT",
            "Sử dụng 2024",
            "Sử dụng 2025",
            "Sử dụng 6T/2026",
            "Tổng 30 tháng",
            "Bình quân tháng có trọng số",
            "Đề xuất theo lịch sử",
            "Mã lý do ĐVSD",
            "Nhóm lý do ĐVSD",
            "Trọng số lý do",
            "SL Khoa chốt",
            "Giải thích thực tế ĐVSD",
            "Trạng thái",
        ]
    )
    for item in data["items"]:
        calculation = item["calculation"]
        decision = item["decision"]
        reason_type = decision.get("reason_type") or "theo_lich_su"
        reason_meta = REASON_WEIGHTS.get(reason_type, REASON_WEIGHTS["khac"])
        writer.writerow(
            [
                item["order"],
                item["scope_label"],
                " | ".join(item["his_codes"]),
                item["management_code"],
                item["technical_code"],
                item["item_name"],
                item["unit"],
                item["use_2024"],
                item["use_2025"],
                item["use_2026_h1"],
                calculation["history_total"],
                calculation["weighted_monthly_average"],
                calculation["formula_final"],
                reason_type,
                reason_meta["label"],
                reason_meta["weight"],
                calculation["proposed_qty"],
                decision.get("reason_text"),
                calculation["review_state"],
            ]
        )
    return ("\ufeff" + output.getvalue()).encode("utf-8")


def audit_for_item(item_id: str) -> list[dict[str, Any]]:
    with closing(connect_db()) as connection:
        rows = connection.execute(
            """
            SELECT id, action, actor_name, created_at
            FROM audit_log
            WHERE item_id = ?
            ORDER BY id DESC
            LIMIT 30
            """,
            (item_id,),
        ).fetchall()
    return [dict(row) for row in rows]


class RHMRequestHandler(BaseHTTPRequestHandler):
    server_version = "RHM-Local/1.0"

    def log_message(self, format_string: str, *args: Any) -> None:
        print(
            f"[{self.log_date_time_string()}] "
            f"{self.client_address[0]} {format_string % args}"
        )

    def send_json(
        self,
        payload: Any,
        status: HTTPStatus = HTTPStatus.OK,
    ) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def send_error_json(self, status: HTTPStatus, message: str) -> None:
        self.send_json({"error": message}, status)

    def read_json(self) -> dict[str, Any]:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise ValueError("Content-Length không hợp lệ.") from error
        if length <= 0 or length > MAX_BODY_BYTES:
            raise ValueError("Nội dung gửi lên rỗng hoặc vượt quá 5 MB.")
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise ValueError("JSON không hợp lệ.") from error
        if not isinstance(payload, dict):
            raise ValueError("Nội dung phải là một JSON object.")
        return payload

    def do_GET(self) -> None:
        path = unquote(urlparse(self.path).path)
        try:
            if path == "/api/health":
                self.send_json(
                    {
                        "status": "ok",
                        "app": "RHM",
                        "database": DB_FILE.name,
                        "time": now_iso(),
                    }
                )
                return
            if path == "/api/bootstrap":
                self.send_json(build_bootstrap())
                return
            if path.startswith("/api/audit/"):
                item_id = path.removeprefix("/api/audit/")
                self.send_json({"items": audit_for_item(item_id)})
                return
            if path == "/api/export.csv":
                body = export_csv()
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-Type", "text/csv; charset=utf-8")
                self.send_header(
                    "Content-Disposition",
                    'attachment; filename="RHM_de_xuat_so_luong.csv"',
                )
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            self.serve_static(path)
        except Exception as error:  # noqa: BLE001 - biên HTTP cần trả lỗi gọn
            self.send_error_json(HTTPStatus.INTERNAL_SERVER_ERROR, str(error))

    def do_POST(self) -> None:
        path = unquote(urlparse(self.path).path)
        try:
            payload = self.read_json()
            if path.startswith("/api/decisions/"):
                item_id = path.removeprefix("/api/decisions/")
                self.send_json(save_decision(item_id, payload))
                return
            if path == "/api/settings":
                self.send_json(save_settings(payload))
                return
            if path == "/api/supplement":
                self.send_json(bulk_supplement(payload))
                return
            self.send_error_json(HTTPStatus.NOT_FOUND, "Không tìm thấy API.")
        except LookupError as error:
            self.send_error_json(HTTPStatus.NOT_FOUND, str(error))
        except ValueError as error:
            self.send_error_json(HTTPStatus.BAD_REQUEST, str(error))
        except Exception as error:  # noqa: BLE001
            self.send_error_json(HTTPStatus.INTERNAL_SERVER_ERROR, str(error))

    def serve_static(self, path: str) -> None:
        relative = "index.html" if path in {"", "/"} else path.lstrip("/")
        target = (STATIC_ROOT / relative).resolve()
        static_root = STATIC_ROOT.resolve()
        if static_root not in target.parents and target != static_root:
            self.send_error_json(HTTPStatus.FORBIDDEN, "Đường dẫn không hợp lệ.")
            return
        if not target.exists() or not target.is_file():
            target = STATIC_ROOT / "index.html"
        body = target.read_bytes()
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        if content_type.startswith("text/") or target.suffix in {".js", ".css", ".svg"}:
            content_type += "; charset=utf-8"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Chạy web localhost RHM")
    parser.add_argument("--port", type=int, default=8026, help="Cổng localhost")
    parser.add_argument(
        "--lan",
        action="store_true",
        help="Cho phép máy khác trong cùng mạng LAN truy cập",
    )
    parser.add_argument(
        "--no-open",
        action="store_true",
        help="Không tự mở trình duyệt",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    initialize_database()
    host = "0.0.0.0" if args.lan else "127.0.0.1"
    server = ThreadingHTTPServer((host, args.port), RHMRequestHandler)
    local_url = f"http://127.0.0.1:{args.port}"
    print()
    print("RHM — Bảng đề xuất số lượng đi thầu")
    print(f"Đang chạy tại: {local_url}")
    if args.lan:
        print(
            "Chế độ LAN đang bật. Chỉ dùng trong mạng nội bộ tin cậy; "
            "bản demo chưa có đăng nhập."
        )
    print("Nhấn Ctrl+C để dừng.")
    print()
    if not args.no_open:
        threading.Timer(0.8, lambda: webbrowser.open(local_url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nĐã dừng web RHM.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
