"""
Feature Engineering Engine for Hybrid AI-NWP Blending System (PS 26081).
Extracts cyclical temporal, spatial-climatic, and ensemble-spread features
to drive adaptive ML weight optimization.
"""
from typing import List, Tuple
import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)

# Zone encoding map for Indian climatic regions
CLIMATIC_ZONE_MAP = {
    "Northern Plains": 0,
    "Konkan West Coast": 1,
    "Coromandel East Coast": 2,
    "Gangetic Delta": 3,
    "South Deccan Plateau": 4,
    "Central Deccan": 5,
    "Malabar Coast": 6,
    "Western Himalayas": 7,
    "East Coastal Belt": 8,
    "Semi-Arid Western": 9
}


class WeatherFeatureEngine:
    """Builds numerical feature vectors for adaptive weighting and skill learning."""

    @staticmethod
    def extract_features(df: pd.DataFrame, is_training: bool = False) -> pd.DataFrame:
        """
        Extracts temporal cyclical, spatial, lead-time, and ensemble consensus features.
        """
        feat = pd.DataFrame(index=df.index)

        # 1. Spatial Features
        feat["latitude"] = df["latitude"]
        feat["longitude"] = df["longitude"]
        feat["elevation"] = df.get("elevation", 0.0)
        feat["zone_code"] = df["zone"].map(CLIMATIC_ZONE_MAP).fillna(-1)

        # 2. Temporal & Cyclical Features (captures monsoon, diurnal cycles)
        timestamps = pd.to_datetime(df["timestamp"])
        hour = timestamps.dt.hour
        month = timestamps.dt.month
        day_of_year = timestamps.dt.dayofyear

        # Diurnal solar cycle (24h period)
        feat["hour_sin"] = np.sin(2 * np.pi * hour / 24.0)
        feat["hour_cos"] = np.cos(2 * np.pi * hour / 24.0)

        # Annual seasonal cycle (365.25d period)
        feat["month_sin"] = np.sin(2 * np.pi * month / 12.0)
        feat["month_cos"] = np.cos(2 * np.pi * month / 12.0)
        feat["doy_sin"] = np.sin(2 * np.pi * day_of_year / 365.25)
        feat["doy_cos"] = np.cos(2 * np.pi * day_of_year / 365.25)

        # 3. Forecast Horizon
        lead_time = df["lead_time_hours"] if "lead_time_hours" in df else 0
        feat["lead_time_hours"] = np.maximum(lead_time, 0)

        # 4. Ensemble Consensus & Atmospheric Dynamics
        feat["ensemble_mean"] = df["ensemble_mean"]
        feat["ensemble_std"] = df["ensemble_std"]
        feat["normalized_spread"] = df["normalized_spread"].fillna(0.0)

        if "ensemble_max" in df and "ensemble_min" in df:
            feat["model_divergence"] = df["ensemble_max"] - df["ensemble_min"]
        else:
            feat["model_divergence"] = feat["ensemble_std"] * 2.0

        return feat

    @staticmethod
    def get_feature_names() -> List[str]:
        """Returns the ordered list of generated feature columns."""
        return [
            "latitude", "longitude", "elevation", "zone_code",
            "hour_sin", "hour_cos", "month_sin", "month_cos", "doy_sin", "doy_cos",
            "lead_time_hours", "ensemble_mean", "ensemble_std", "normalized_spread", "model_divergence"
        ]
