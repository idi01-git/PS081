"""
Schema Normalizer for Hybrid AI-NWP Blending System (PS 26081).
Harmonizes diverse multi-model payloads into standardized, clean tabular DataFrames
with computed ensemble baselines (mean, spread) and lead-time indexing.
"""
from datetime import datetime
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
import logging

from config import MODELS, VARIABLES

logger = logging.getLogger(__name__)


class ForecastNormalizer:
    """Transforms raw API responses into structured DataFrames for storage and ML modeling."""

    @staticmethod
    def parse_multimodel_payload(
        location_id: str,
        location_meta: Dict[str, Any],
        raw_json: Dict[str, Any]
    ) -> pd.DataFrame:
        """
        Parses a single location's multi-model forecast response into a clean, normalized DataFrame.
        """
        hourly = raw_json.get("hourly", {})
        if not hourly or "time" not in hourly:
            logger.warning(f"No hourly forecast data found in payload for {location_id}")
            return pd.DataFrame()

        times = pd.to_datetime(hourly["time"])
        n_rows = len(times)

        # Base metadata
        base_df = pd.DataFrame({
            "timestamp": times,
            "location_id": location_id,
            "location_name": location_meta.get("name", location_id),
            "state": location_meta.get("state", ""),
            "zone": location_meta.get("zone", ""),
            "latitude": location_meta.get("latitude", raw_json.get("latitude")),
            "longitude": location_meta.get("longitude", raw_json.get("longitude")),
            "elevation": raw_json.get("elevation", 0.0)
        })

        # Calculate lead time in hours relative to current time or forecast start
        current_time = pd.Timestamp.now().floor("h")
        base_df["lead_time_hours"] = ((base_df["timestamp"] - current_time).dt.total_seconds() / 3600).astype(int)

        # Parse each variable across all models
        records = []
        for var in VARIABLES:
            var_df = base_df.copy()
            var_df["variable"] = var

            model_cols = []
            for model_key, model_info in MODELS.items():
                col_name = f"{var}_{model_info['raw_col_suffix']}"
                clean_col = model_info["label"].lower().replace(" ", "_")
                
                if col_name in hourly:
                    vals = pd.to_numeric(hourly[col_name], errors="coerce")
                    if var in ["precipitation", "wind_speed_10m"]:
                        vals = np.maximum(vals, 0.0)
                    var_df[clean_col] = vals
                    model_cols.append(clean_col)
                else:
                    var_df[clean_col] = np.nan

            # Compute ensemble statistics across active physical and AI models
            valid_model_data = var_df[model_cols]
            var_df["ensemble_mean"] = valid_model_data.mean(axis=1)
            var_df["ensemble_std"] = valid_model_data.std(axis=1)
            var_df["ensemble_min"] = valid_model_data.min(axis=1)
            var_df["ensemble_max"] = valid_model_data.max(axis=1)
            
            # Model agreement ratio (spread relative to mean)
            # Low normalized spread = High model consensus
            epsilon = 1e-4
            var_df["normalized_spread"] = var_df["ensemble_std"] / (var_df["ensemble_mean"].abs() + epsilon)

            records.append(var_df)

        combined_df = pd.concat(records, ignore_index=True)
        return combined_df

    @staticmethod
    def parse_historical_observations(
        location_id: str,
        location_meta: Dict[str, Any],
        raw_json: Dict[str, Any]
    ) -> pd.DataFrame:
        """
        Parses historical ground-truth reanalysis observations into a standard DataFrame.
        """
        hourly = raw_json.get("hourly", {})
        if not hourly or "time" not in hourly:
            logger.warning(f"No hourly observation data found in payload for {location_id}")
            return pd.DataFrame()

        times = pd.to_datetime(hourly["time"])
        records = []

        for var in VARIABLES:
            if var in hourly:
                df = pd.DataFrame({
                    "timestamp": times,
                    "location_id": location_id,
                    "location_name": location_meta.get("name", location_id),
                    "latitude": location_meta.get("latitude", raw_json.get("latitude")),
                    "longitude": location_meta.get("longitude", raw_json.get("longitude")),
                    "variable": var,
                    "observed_value": pd.to_numeric(hourly[var], errors="coerce")
                })
                records.append(df)

        if not records:
            return pd.DataFrame()

        return pd.concat(records, ignore_index=True)
