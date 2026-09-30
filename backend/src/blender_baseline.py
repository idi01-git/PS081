"""
Baseline Blending Strategies for Hybrid AI-NWP System (PS 26081).
Implements Equal-Weight Mean and Dynamic Inverse-Error (RMSE-based) Weighting.
"""
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)


class BaselineBlender:
    """Provides standard meteorological benchmark blending algorithms."""

    @staticmethod
    def equal_weight_blend(df: pd.DataFrame, model_cols: List[str]) -> Tuple[pd.Series, Dict[str, float]]:
        """
        Computes standard multi-model arithmetic mean (equal weights 1/M).
        """
        valid_cols = [c for c in model_cols if c in df.columns]
        if not valid_cols:
            raise ValueError("No valid model columns found for equal-weight blending")
        
        n_models = len(valid_cols)
        weights = {col: 1.0 / n_models for col in valid_cols}
        blended_series = df[valid_cols].mean(axis=1)
        return blended_series, weights

    @staticmethod
    def inverse_error_blend(
        df_forecast: pd.DataFrame,
        model_errors: Dict[str, float],
        model_cols: List[str],
        power: float = 1.0
    ) -> Tuple[pd.Series, Dict[str, float]]:
        """
        Computes inverse-error weighting where models with lower recent RMSE receive higher weight.
        Formula: W_m = (1 / RMSE_m^p) / sum_k(1 / RMSE_k^p)
        """
        valid_cols = [c for c in model_cols if c in df_forecast.columns]
        
        inv_weights = {}
        for col in valid_cols:
            rmse = model_errors.get(col, 1.0)
            # Prevent division by zero with small epsilon
            inv_weights[col] = 1.0 / (max(rmse, 1e-4) ** power)

        total_weight = sum(inv_weights.values())
        normalized_weights = {col: w / total_weight for col, w in inv_weights.items()}

        # Mask NaNs and renormalize weights per row so sum of weights on available models is strictly 1.0
        val_matrix = df_forecast[valid_cols].values
        weights_vec = np.array([normalized_weights[col] for col in valid_cols])
        
        # Broadcast weights to matrix shape
        w_matrix = np.tile(weights_vec, (len(df_forecast), 1))
        
        # Mask where value is NaN
        is_valid = ~np.isnan(val_matrix)
        w_matrix = np.where(is_valid, w_matrix, 0.0)
        
        # Renormalize row sums
        row_sums = w_matrix.sum(axis=1, keepdims=True)
        # Avoid division by zero if all are NaN
        row_sums = np.where(row_sums > 0, row_sums, 1.0)
        w_renorm = w_matrix / row_sums
        
        # Compute dot product with NaNs replaced by 0 (masked out)
        blended_values = np.sum(np.nan_to_num(val_matrix, nan=0.0) * w_renorm, axis=1)
        blended_series = pd.Series(blended_values, index=df_forecast.index)

        return blended_series, normalized_weights
