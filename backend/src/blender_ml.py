"""
Context-Aware Adaptive Weight Learner (PS 26081).
Uses LightGBM and regularized Softmax regression to dynamically assign
optimal model weights conditioned on region, season, lead-time, and atmospheric state.
"""
from typing import Dict, List, Tuple, Optional
import numpy as np
import pandas as pd
import lightgbm as lgb
from scipy.special import softmax
import logging

from feature_engine import WeatherFeatureEngine
from config import MODELS

logger = logging.getLogger(__name__)


class AdaptiveMLBlender:
    """Trains and predicts dynamic, context-aware weights for multi-model blending."""

    def __init__(self, temperature: float = 1.0, shrinkage: float = 0.75):
        """
        Args:
            temperature: Softmax temperature parameter controlling weight concentration.
            shrinkage: Prior regularization weight (blends ML weights with inverse-error prior).
        """
        self.temperature = temperature
        self.shrinkage = shrinkage
        self.feature_engine = WeatherFeatureEngine()
        self.models: Dict[str, lgb.LGBMRegressor] = {}
        self.is_fitted = False
        self.model_cols: List[str] = [m["label"].lower().replace(" ", "_") for m in MODELS.values()]

    def fit_from_historical_data(
        self,
        df_forecasts: pd.DataFrame,
        df_observations: pd.DataFrame,
        variable: str = "temperature_2m"
    ):
        """
        Trains adaptive skill predictors using historical forecast vs observed pairs.
        For each model m, trains a LightGBM regressor predicting absolute accuracy / skill score.
        """
        logger.info(f"Training Adaptive ML Blender for variable: {variable}")

        # 1. Merge forecast and observations on timestamp, location_id, variable
        fc_var = df_forecasts[df_forecasts["variable"] == variable].copy()
        obs_var = df_observations[df_observations["variable"] == variable].copy()

        if fc_var.empty or obs_var.empty:
            logger.warning(f"Insufficient paired data to fit ML blender for {variable}")
            return

        merged = pd.merge(
            fc_var,
            obs_var[["timestamp", "location_id", "observed_value"]],
            on=["timestamp", "location_id"],
            how="inner"
        )

        if len(merged) < 50:
            logger.warning(f"Only {len(merged)} paired samples found. Using prior baseline.")
            return

        # 2. Extract feature matrix
        X = self.feature_engine.extract_features(merged, is_training=True)

        # 3. Train skill predictor for each model
        # Target: Negative absolute error (- |Forecast - Observed|) -> Higher is better skill
        for col in self.model_cols:
            if col in merged.columns and merged[col].notnull().sum() > 20:
                abs_error = (merged[col] - merged["observed_value"]).abs()
                # Target skill score: inversely proportional to error
                y_skill = -1.0 * abs_error

                model = lgb.LGBMRegressor(
                    n_estimators=60,
                    learning_rate=0.08,
                    max_depth=4,
                    num_leaves=15,
                    min_child_samples=10,
                    random_state=42,
                    verbose=-1
                )
                model.fit(X, y_skill)
                self.models[col] = model

        self.is_fitted = True
        logger.info(f"Adaptive ML Blender successfully trained across {len(self.models)} models.")

    def predict_weights(self, df_forecast: pd.DataFrame) -> Tuple[np.ndarray, List[Dict[str, float]]]:
        """
        Predicts dynamic weights for each row in df_forecast.
        Returns:
            weights_matrix: (N, M) numpy array of normalized weights.
            weights_dicts: List of dicts mapping model name -> weight for each row.
        """
        valid_cols = [c for c in self.model_cols if c in df_forecast.columns]
        n_samples = len(df_forecast)
        n_models = len(valid_cols)

        if not self.is_fitted or not self.models:
            # Fallback to equal weighting if not fitted
            equal_w = np.full((n_samples, n_models), 1.0 / n_models)
            return equal_w, [{col: 1.0 / n_models for col in valid_cols} for _ in range(n_samples)]

        X = self.feature_engine.extract_features(df_forecast)
        skill_logits = np.zeros((n_samples, n_models))

        for idx, col in enumerate(valid_cols):
            if col in self.models:
                skill_logits[:, idx] = self.models[col].predict(X)
            else:
                skill_logits[:, idx] = -1.0  # Default lower prior

        # Apply Softmax to convert raw skill logits into valid probability weights (sum = 1, w >= 0)
        scaled_logits = skill_logits / self.temperature
        ml_weights = softmax(scaled_logits, axis=1)

        # Apply shrinkage toward equal/prior weights for numerical stability
        prior_weights = np.full((n_samples, n_models), 1.0 / n_models)
        final_weights = self.shrinkage * ml_weights + (1.0 - self.shrinkage) * prior_weights

        weights_dicts = []
        for i in range(n_samples):
            w_dict = {valid_cols[j]: float(final_weights[i, j]) for j in range(n_models)}
            weights_dicts.append(w_dict)

        return final_weights, weights_dicts

    def blend(self, df_forecast: pd.DataFrame) -> Tuple[pd.Series, pd.DataFrame]:
        """
        Applies adaptive weights to compute blended forecast series and returns weights table.
        """
        valid_cols = [c for c in self.model_cols if c in df_forecast.columns]
        weights_matrix, weights_dicts = self.predict_weights(df_forecast)

        # Mask NaNs and renormalize weights per row so sum of active weights is 1.0
        val_matrix = df_forecast[valid_cols].values
        is_valid = ~np.isnan(val_matrix)

        # Zero-out weights for models that returned NaN for this time step
        effective_weights = np.where(is_valid, weights_matrix, 0.0)
        row_sums = effective_weights.sum(axis=1, keepdims=True)
        row_sums = np.where(row_sums > 0, row_sums, 1.0)
        renormalized_weights = effective_weights / row_sums

        # Compute dot product: sum_m (W_m * Forecast_m)
        clean_forecast_matrix = np.nan_to_num(val_matrix, nan=0.0)
        blended_values = np.sum(clean_forecast_matrix * renormalized_weights, axis=1)

        blended_series = pd.Series(blended_values, index=df_forecast.index, name="blended_forecast")

        # Create structured DataFrame of assigned weights (showing effective renormalized weights)
        weights_df = pd.DataFrame(renormalized_weights, columns=valid_cols, index=df_forecast.index)
        weights_df["dominant_model"] = weights_df[valid_cols].idxmax(axis=1)
        weights_df["dominant_weight"] = weights_df[valid_cols].max(axis=1)

        return blended_series, weights_df
