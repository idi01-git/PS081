"""
Unit and Integration Tests for Phase 1 Data Pipeline (PS 26081).
Validates API ingestion, schema normalization, multi-model column integrity,
and Parquet/SQLite storage roundtrip.
"""
import sys
from pathlib import Path
_SRC = str(Path(__file__).resolve().parent.parent / "src")
if _SRC not in sys.path:
    sys.path.insert(0, _SRC)

import unittest
import pandas as pd
import numpy as np
from pathlib import Path
import shutil

from config import LOCATIONS, MODELS, VARIABLES, BASE_DIR
from fetcher import WeatherDataFetcher
from normalizer import ForecastNormalizer
from storage import WeatherStorage


class TestPhase1DataPipeline(unittest.TestCase):
    """Test suite for the Phase 1 ingestion, normalization, and persistence stack."""

    @classmethod
    def setUpClass(cls):
        cls.fetcher = WeatherDataFetcher()
        cls.normalizer = ForecastNormalizer()
        cls.test_data_dir = BASE_DIR / "test_data"
        cls.test_data_dir.mkdir(exist_ok=True)
        cls.storage = WeatherStorage(
            db_path=cls.test_data_dir / "test_store.db",
            parquet_dir=cls.test_data_dir
        )

    @classmethod
    def tearDownClass(cls):
        if cls.test_data_dir.exists():
            shutil.rmtree(cls.test_data_dir)

    def test_single_location_fetch_and_normalize(self):
        """Tests that fetching a single location returns all models and variables."""
        loc_id = "delhi"
        meta = LOCATIONS[loc_id]
        
        # 1. Fetch
        raw_json = self.fetcher.fetch_multimodel_forecast(
            latitude=meta["latitude"],
            longitude=meta["longitude"],
            forecast_days=3,
            past_days=1
        )
        self.assertIn("hourly", raw_json)
        self.assertIn("time", raw_json["hourly"])

        # 2. Normalize
        df = self.normalizer.parse_multimodel_payload(loc_id, meta, raw_json)
        self.assertFalse(df.empty, "Normalized DataFrame should not be empty")

        # 3. Check Variables
        variables_in_df = set(df["variable"].unique())
        for var in VARIABLES:
            self.assertIn(var, variables_in_df, f"Variable {var} missing from normalized output")

        # 4. Check Models (Clean column names)
        expected_models = [m["label"].lower().replace(" ", "_") for m in MODELS.values()]
        for model_col in expected_models:
            self.assertIn(model_col, df.columns, f"Model column {model_col} missing in output DataFrame")

        # 5. Check Ensemble Metrics
        self.assertIn("ensemble_mean", df.columns)
        self.assertIn("ensemble_std", df.columns)
        self.assertIn("normalized_spread", df.columns)
        self.assertIn("lead_time_hours", df.columns)

        # 6. Verify Values
        self.assertTrue((df["ensemble_mean"].notnull()).any(), "Ensemble mean should contain non-null numbers")

    def test_storage_roundtrip(self):
        """Tests saving to Parquet and retrieving back."""
        loc_id = "mumbai"
        meta = LOCATIONS[loc_id]
        raw_json = self.fetcher.fetch_multimodel_forecast(
            latitude=meta["latitude"],
            longitude=meta["longitude"],
            forecast_days=2,
            past_days=1
        )
        df = self.normalizer.parse_multimodel_payload(loc_id, meta, raw_json)
        
        # Save
        parquet_path = self.storage.save_forecasts_parquet(df)
        self.assertTrue(parquet_path.exists())

        # Load
        loaded_df = self.storage.load_latest_forecast(location_id=loc_id, variable="precipitation")
        self.assertFalse(loaded_df.empty)
        self.assertEqual(loaded_df["location_id"].iloc[0], loc_id)
        self.assertEqual(loaded_df["variable"].iloc[0], "precipitation")

    def test_sqlite_audit_logging(self):
        """Tests that ingestion events are logged in SQLite."""
        self.storage.log_ingestion("chennai", "multimodel_forecast", 150, "SUCCESS")
        with self.storage.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM ingestion_logs WHERE location_id='chennai'")
            row = cursor.fetchone()
            self.assertIsNotNone(row)
            self.assertEqual(row["status"], "SUCCESS")
            self.assertEqual(row["record_count"], 150)


if __name__ == "__main__":
    unittest.main()
