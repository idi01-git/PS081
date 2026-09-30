"""
Meteorological Verification Metrics Module for Hybrid AI-NWP System (PS 26081).
Implements standard WMO/IMD evaluation formulas:
- RMSE, MAE, Mean Bias Error (MBE)
- Pearson Correlation (R)
- Skill Score (SS) relative to reference models
- 2x2 Contingency Table Metrics (POD, FAR, CSI, HSS) for extreme weather events
"""
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)


class VerificationMetrics:
    """Computes statistical and categorical verification metrics for forecast verification."""

    @staticmethod
    def compute_continuous_metrics(
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, float]:
        """
        Computes standard continuous verification metrics: RMSE, MAE, Bias, Pearson R.
        Handles NaNs by masking.
        """
        mask = (~np.isnan(y_true)) & (~np.isnan(y_pred))
        yt = y_true[mask]
        yp = y_pred[mask]

        n = len(yt)
        if n < 2:
            return {
                "n_samples": n,
                "rmse": np.nan,
                "mae": np.nan,
                "bias": np.nan,
                "correlation": np.nan
            }

        diff = yp - yt
        rmse = float(np.sqrt(np.mean(diff ** 2)))
        mae = float(np.mean(np.abs(diff)))
        bias = float(np.mean(diff))

        # Pearson correlation
        std_t = np.std(yt)
        std_p = np.std(yp)
        if std_t > 1e-6 and std_p > 1e-6:
            r = float(np.corrcoef(yt, yp)[0, 1])
        else:
            r = 0.0

        return {
            "n_samples": n,
            "rmse": round(rmse, 4),
            "mae": round(mae, 4),
            "bias": round(bias, 4),
            "correlation": round(r, 4)
        }

    @staticmethod
    def compute_skill_score(
        target_rmse: float,
        reference_rmse: float
    ) -> float:
        """
        Computes Skill Score (percentage improvement in MSE) relative to a reference model.
        SS = (1 - (MSE_target / MSE_ref)) * 100%
        Positive SS indicates target outperforms reference.
        """
        if reference_rmse <= 1e-6 or np.isnan(reference_rmse) or np.isnan(target_rmse):
            return 0.0
        
        mse_target = target_rmse ** 2
        mse_ref = reference_rmse ** 2
        ss = (1.0 - (mse_target / mse_ref)) * 100.0
        return round(float(ss), 2)

    @staticmethod
    def compute_contingency_table(
        y_true: np.ndarray,
        y_pred: np.ndarray,
        threshold: float
    ) -> Dict[str, Any]:
        """
        Computes 2x2 contingency table and extreme event skill scores:
        - Hits (a), False Alarms (b), Misses (c), Correct Rejections (d)
        - POD (Probability of Detection / Hit Rate): a / (a + c)
        - FAR (False Alarm Ratio): b / (a + b)
        - CSI (Critical Success Index / Threat Score): a / (a + b + c)
        - HSS (Heidke Skill Score): Accuracy normalized by random chance
        """
        mask = (~np.isnan(y_true)) & (~np.isnan(y_pred))
        yt = y_true[mask]
        yp = y_pred[mask]

        obs_event = yt >= threshold
        fc_event = yp >= threshold

        a = int(np.sum(fc_event & obs_event))         # Hits
        b = int(np.sum(fc_event & (~obs_event)))      # False Alarms
        c = int(np.sum((~fc_event) & obs_event))      # Misses
        d = int(np.sum((~fc_event) & (~obs_event)))   # Correct Negatives

        total = a + b + c + d
        if total == 0:
            return {"hits": 0, "false_alarms": 0, "misses": 0, "correct_negatives": 0,
                    "pod": 0.0, "far": 0.0, "csi": 0.0, "hss": 0.0}

        # Probability of Detection (Hit Rate)
        pod = (a / (a + c)) if (a + c) > 0 else 0.0
        # False Alarm Ratio
        far = (b / (a + b)) if (a + b) > 0 else 0.0
        # Critical Success Index (Threat Score)
        csi = (a / (a + b + c)) if (a + b + c) > 0 else 0.0

        # Heidke Skill Score (HSS)
        expected_correct = ((a + b) * (a + c) + (c + d) * (b + d)) / total
        denom = total - expected_correct
        hss = ((a + d - expected_correct) / denom) if denom != 0 else 0.0

        return {
            "threshold": threshold,
            "hits": a,
            "false_alarms": b,
            "misses": c,
            "correct_negatives": d,
            "pod": round(float(pod), 4),
            "far": round(float(far), 4),
            "csi": round(float(csi), 4),
            "hss": round(float(hss), 4)
        }
