"""
Unit Tests for Phase 3 Evaluation and Verification Metrics (PS 26081).
Validates mathematical precision of RMSE, MAE, Bias, Pearson R,
Skill Score calculations, and 2x2 Contingency Table metrics.
"""
import sys
from pathlib import Path
_SRC = str(Path(__file__).resolve().parent.parent / "src")
if _SRC not in sys.path:
    sys.path.insert(0, _SRC)

import unittest
import numpy as np
import pandas as pd

from metrics import VerificationMetrics
from evaluator import ForecastEvaluator


class TestPhase3Evaluation(unittest.TestCase):
    """Test suite for Phase 3 statistical metrics and evaluation logic."""

    def test_continuous_metrics_calculation(self):
        """Validates mathematical correctness of RMSE, MAE, Bias, and Pearson R."""
        y_true = np.array([10.0, 20.0, 30.0, 40.0, 50.0])
        # Prediction with constant +2 error
        y_pred = np.array([12.0, 22.0, 32.0, 42.0, 52.0])

        res = VerificationMetrics.compute_continuous_metrics(y_true, y_pred)
        self.assertAlmostEqual(res["rmse"], 2.0, places=4)
        self.assertAlmostEqual(res["mae"], 2.0, places=4)
        self.assertAlmostEqual(res["bias"], 2.0, places=4)
        self.assertAlmostEqual(res["correlation"], 1.0, places=4)

    def test_continuous_metrics_with_nans(self):
        """Validates that NaNs in inputs are cleanly ignored without skewing metrics."""
        y_true = np.array([10.0, 20.0, np.nan, 40.0, 50.0])
        y_pred = np.array([12.0, np.nan, 30.0, 42.0, 52.0])

        # Valid pairs are only indices 0, 3, 4 (errors are all +2)
        res = VerificationMetrics.compute_continuous_metrics(y_true, y_pred)
        self.assertEqual(res["n_samples"], 3)
        self.assertAlmostEqual(res["rmse"], 2.0, places=4)

    def test_skill_score_formula(self):
        """Validates Skill Score relative to reference benchmark."""
        # Target RMSE = 1.5, Reference RMSE = 2.0
        # SS = (1 - (2.25 / 4.0)) * 100% = 43.75%
        ss = VerificationMetrics.compute_skill_score(target_rmse=1.5, reference_rmse=2.0)
        self.assertAlmostEqual(ss, 43.75, places=2)

        # Equal performance -> 0%
        ss_equal = VerificationMetrics.compute_skill_score(target_rmse=2.0, reference_rmse=2.0)
        self.assertAlmostEqual(ss_equal, 0.0, places=2)

        # Worse performance -> Negative SS
        ss_worse = VerificationMetrics.compute_skill_score(target_rmse=2.5, reference_rmse=2.0)
        self.assertLess(ss_worse, 0.0)

    def test_contingency_table_metrics(self):
        """Validates 2x2 contingency table (Hits, False Alarms, Misses, POD, FAR, CSI)."""
        # Threshold = 20.0
        # True:  [10, 25, 30,  5, 40] -> events: F, T, T, F, T (3 events)
        # Pred:  [15, 22, 10, 25, 45] -> events: F, T, F, T, T (3 forecast)
        # Pairs:
        # 0: F, F -> Correct Negative
        # 1: T, T -> Hit (a)
        # 2: T, F -> Miss (c)
        # 3: F, T -> False Alarm (b)
        # 4: T, T -> Hit (a)
        # Hits = 2, False Alarms = 1, Misses = 1, Correct Negatives = 1
        y_true = np.array([10.0, 25.0, 30.0, 5.0, 40.0])
        y_pred = np.array([15.0, 22.0, 10.0, 25.0, 45.0])

        res = VerificationMetrics.compute_contingency_table(y_true, y_pred, threshold=20.0)
        self.assertEqual(res["hits"], 2)
        self.assertEqual(res["false_alarms"], 1)
        self.assertEqual(res["misses"], 1)
        self.assertEqual(res["correct_negatives"], 1)

        # POD = a / (a + c) = 2 / 3 = 0.6667
        self.assertAlmostEqual(res["pod"], 2/3, places=3)
        # FAR = b / (a + b) = 1 / 3 = 0.3333
        self.assertAlmostEqual(res["far"], 1/3, places=3)
        # CSI = a / (a + b + c) = 2 / 4 = 0.5000
        self.assertAlmostEqual(res["csi"], 0.5, places=3)

    def test_evaluator_end_to_end_on_real_data(self):
        """Validates that ForecastEvaluator executes on stored Parquet files and generates scorecards."""
        evaluator = ForecastEvaluator()
        results = evaluator.run_full_evaluation()

        self.assertIn("summary", results)
        self.assertIn("station", results)
        self.assertIn("lead_time", results)
        self.assertIn("contingency", results)

        summary_df = results["summary"]
        self.assertFalse(summary_df.empty)
        self.assertIn("skill_score_vs_best_nwp", summary_df.columns)
        self.assertIn("rmse", summary_df.columns)


if __name__ == "__main__":
    unittest.main()
