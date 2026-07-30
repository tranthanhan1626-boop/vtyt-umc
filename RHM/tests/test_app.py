from __future__ import annotations

import json
import sys
import tempfile
import unittest
from contextlib import closing
from pathlib import Path


APP_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(APP_ROOT))

import app  # noqa: E402


class FormulaTests(unittest.TestCase):
    def setUp(self):
        self.item = {
            "id": "X",
            "d12": 120,
            "abc_group": "A+B",
            "reference_price": 10,
        }
        self.settings = {
            "horizon_months": 18,
            "transition_delay_months": 0,
            "r_adjust": 1,
            "k_ab": 1.2,
            "k_c": 2.9,
        }

    def test_default_formula(self):
        result = app.calculate_item(
            self.item,
            {"stock": None, "incoming": None, "shelf_life_months": None},
            self.settings,
        )
        self.assertEqual(result["calculation"]["gross"], 180)
        self.assertEqual(result["calculation"]["formula_final"], 180)

    def test_inventory_fields_do_not_change_the_simple_formula(self):
        result = app.calculate_item(
            self.item,
            {"stock": 100, "incoming": 30, "shelf_life_months": None},
            self.settings,
        )
        self.assertEqual(result["calculation"]["floor"], 180)
        self.assertEqual(result["calculation"]["formula_final"], 180)

    def test_expiry_field_does_not_change_the_simple_formula(self):
        result = app.calculate_item(
            self.item,
            {"stock": 0, "incoming": 0, "shelf_life_months": 12},
            self.settings,
        )
        self.assertIsNone(result["calculation"]["expiry_ceiling"])
        self.assertEqual(result["calculation"]["formula_final"], 180)

    def test_all_months_are_used_with_recency_weights(self):
        item = dict(self.item)
        item["monthly"] = {
            **{f"2024-{month:02d}": 10 for month in range(1, 13)},
            **{f"2025-{month:02d}": 20 for month in range(1, 13)},
            **{f"2026-{month:02d}": 30 for month in range(1, 7)},
        }
        result = app.calculate_item(
            item,
            {"stock": None, "incoming": None, "shelf_life_months": None},
            self.settings,
        )
        self.assertEqual(result["calculation"]["history_months"], 30)
        self.assertAlmostEqual(
            result["calculation"]["weighted_monthly_average"], 21.1111, places=4
        )
        self.assertEqual(result["calculation"]["formula_final"], 380)


class SeedTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.seed = json.loads((APP_ROOT / "data" / "seed.json").read_text(encoding="utf-8"))

    def test_seed_contains_both_scopes(self):
        scopes = {item["scope"] for item in self.seed["items"]}
        self.assertIn("chuyen_khoa", scopes)
        self.assertTrue({"dung_chung", "ngoai_danh_muc"} & scopes)

    def test_item_ids_are_unique(self):
        ids = [item["id"] for item in self.seed["items"]]
        self.assertEqual(len(ids), len(set(ids)))

    def test_monthly_series_is_complete(self):
        self.assertTrue(all(len(item["monthly"]) == 30 for item in self.seed["items"]))

    def test_reason_weights_distinguish_observed_and_assumed_groups(self):
        self.assertEqual(app.REASON_WEIGHTS["tang_nhu_cau"]["weight"], 1.68)
        self.assertEqual(app.REASON_WEIGHTS["tang_nhu_cau"]["sample_size"], 73)
        self.assertEqual(app.REASON_WEIGHTS["dut_hang"]["sample_size"], 0)
        self.assertIn("Tạm giả lập", app.REASON_WEIGHTS["dut_hang"]["source"])

    def test_export_is_a_dvsd_reason_collection_table(self):
        header = app.export_csv().decode("utf-8-sig").splitlines()[0]
        self.assertIn("Tổng 30 tháng", header)
        self.assertIn("Nhóm lý do ĐVSD", header)
        self.assertIn("Trọng số lý do", header)
        self.assertIn("Giải thích thực tế ĐVSD", header)


class PersistenceTests(unittest.TestCase):
    def test_decision_is_saved_with_audit(self):
        original_db = app.DB_FILE
        with tempfile.TemporaryDirectory() as directory:
            app.DB_FILE = Path(directory) / "test.sqlite3"
            try:
                app.initialize_database()
                saved = app.save_decision(
                    "T-1",
                    {
                        "proposed_qty": 12,
                        "reason_type": "tang_nhu_cau",
                        "reason_text": "ĐVSD xác nhận số ca dự kiến tăng trong kỳ mới.",
                        "actor_name": "Kiểm thử",
                        "actor_unit": "Khoa RHM",
                        "review_status": "da_gui",
                    },
                )
                self.assertEqual(saved["decision"]["proposed_qty"], 12)
                self.assertEqual(saved["decision"]["reason_type"], "tang_nhu_cau")
                self.assertEqual(saved["decision"]["review_status"], "da_gui")
                with closing(app.connect_db()) as connection:
                    audit_count = connection.execute(
                        "SELECT COUNT(*) AS count FROM audit_log WHERE item_id = 'T-1'"
                    ).fetchone()["count"]
                self.assertEqual(audit_count, 1)
            finally:
                app.DB_FILE = original_db


if __name__ == "__main__":
    unittest.main()
