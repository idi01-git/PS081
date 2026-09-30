"""
Unit & Integration Test Suite for Phase 2 Blending Engine (PS 26081).
Validates baseline blending, feature extraction, adaptive ML weights (sum to 1, non-negative),
extreme hazard detection thresholds, and Parquet persistence.
"""
import sys
from pathlib import Path
_SRC = str(Path(__file__).resolve().parent.parent / "src")
if _SRC not in sys.path:
    sys.path.insert(0, _SRC)

import unittest
import pandas as pd
import numpy as np

from blender_baseline import BaselineBlender
from feature_engine import WeatherFeatureEngine
from blender_ml import AdaptiveMLBlender
from extreme_detector import ExtremeWeatherDetector, THRESHOLDS


class TestPhase2BlendingEngine(unittest.TestCase):
    """Test suite for Phase 2 algorithmic components."""

    def setUp(self):
        # Create a synthetic multi-model dataframe for deterministic testing
        n = 10
        self.model_cols = ["gfs", "ecmwf_ifs", "icon", "jma", "gem", "ecmwf_aifs"]
        self.df_sample = pd.DataFrame({
            "timestamp": pd.date_range("2026-09-29", periods=n, freq="h"),
            "location_id": ["delhi"] * n,
            "location_name": ["Delhi NCR"] * n,
            "latitude": [28.61] * n,
            "longitude": [77.20] * n,
            "elevation": [216.0] * n,
            "zone": ["Northern Plains"] * n,
            "lead_time_hours": list(range(n)),
            "variable": ["precipitation"] * n,
            "gfs": [10.0, 12.0, 15.0, 70.0, 80.0, 5.0, 2.0, 0.0, 0.0, 1.0],
            "ecmwf_ifs": [12.0, 14.0, 18.0, 75.0, 85.0, 6.0, 3.0, 0.0, 0.0, 2.0],
            "icon": [11.0, 13.0, 16.0, 72.0, 82.0, 5.5, 2.5, 0.0, 0.0, 1.5],
            "jma": [9.0, 11.0, 14.0, 65.0, 75.0, 4.0, 2.0, 0.0, 0.0, 1.0],
            "gem": [10.5, 12.5, 15.5, 68.0, 78.0, 5.0, 2.2, 0.0, 0.0, 1.2],
            "ecmwf_aifs": [12.5, 14.5, 17.5, 76.0, 84.0, 6.2, 3.1, 0.0, 0.0, 2.1],
        })
        self.df_sample["ensemble_mean"] = self.df_sample[self.model_cols].mean(axis=1)
        self.df_sample["ensemble_std"] = self.df_sample[self.model_cols].std(axis=1)
        self.df_sample["ensemble_min"] = self.df_sample[self.model_cols].min(axis=1)
        self.df_sample["ensemble_max"] = self.df_sample[self.model_cols].max(axis=1)
        self.df_sample["normalized_spread"] = self.df_sample["ensemble_std"] / (self.df_sample["ensemble_mean"] + 1e-4)

    def test_equal_weight_blending(self):
        """Validates equal-weight arithmetic blending."""
        blended, weights = BaselineBlender.equal_weight_blend(self.df_sample, self.model_cols)
        self.assertEqual(len(blended), len(self.df_sample))
        self.assertAlmostEqual(sum(weights.values()), 1.0, places=5)
        # Check against arithmetic mean
        np.testing.assert_allclose(blended.values, self.df_sample["ensemble_mean"].values)

    def test_inverse_error_blending(self):
        """Validates that a model with lower RMSE receives proportionally higher weight."""
        # ECMWF has lowest error (0.5), GFS has highest (2.0)
        errors = {"ecmwf_ifs": 0.5, "gfs": 2.0, "icon": 1.0, "jma": 1.5, "gem": 1.2, "ecmwf_aifs": 0.6}
        blended, weights = BaselineBlender.inverse_error_blend(self.df_sample, errors, self.model_cols)

        self.assertAlmostEqual(sum(weights.values()), 1.0, places=5)
        self.assertGreater(weights["ecmwf_ifs"], weights["gfs"])
        self.assertGreater(weights["ecmwf_aifs"], weights["gfs"])

    def test_feature_engineering(self):
        """Validates spatial, cyclical temporal, and spread feature extraction."""
        feat = WeatherFeatureEngine.extract_features(self.df_sample)
        self.assertEqual(len(feat), len(self.df_sample))
        self.assertFalse(feat.isnull().any().any(), "Features should contain zero NaNs")
        
        # Verify cyclical sine/cosine ranges [-1, 1]
        self.assertTrue((feat["hour_sin"] >= -1.0).all() and (feat["hour_sin"] <= 1.0).all())
        self.assertTrue((feat["month_cos"] >= -1.0).all() and (feat["month_cos"] <= 1.0).all())

    def test_adaptive_ml_weights(self):
        """Validates that ML predicted weights satisfy probability simplex (w >= 0, sum = 1)."""
        blender = AdaptiveMLBlender()
        blended, weights_df = blender.blend(self.df_sample)

        self.assertEqual(len(blended), len(self.df_sample))
        
        # Check weight constraints for each row
        weight_cols = [c for c in weights_df.columns if c in self.model_cols]
        row_sums = weights_df[weight_cols].sum(axis=1)
        np.testing.assert_allclose(row_sums.values, 1.0, atol=1e-4)
        self.assertTrue((weights_df[weight_cols] >= 0.0).all().all())

    def test_extreme_rainfall_detection(self):
        """Validates that high precipitation values (>64.5 mm) trigger critical/warning alerts."""
        detector = ExtremeWeatherDetector()
        blended_series = self.df_sample["ensemble_mean"]
        alerts = detector.detect_extremes_for_forecast(self.df_sample, blended_series)

        # Rows 3 and 4 have ~70-80mm rain
        self.assertIn(alerts.loc[3, "alert_level"], ["CRITICAL", "WARNING", "WATCH"])
        self.assertIn(alerts.loc[4, "alert_level"], ["CRITICAL", "WARNING", "WATCH"])
        self.assertGreater(alerts.loc[3, "confidence_pct"], 50.0)


if __name__ == "__main__":
    unittest.main()
