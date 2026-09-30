"""
Extreme Weather Detection & Multi-Model Consensus Engine (PS 26081).
Implements IMD-aligned threshold detection for heavy rainfall, heatwaves,
and gale-force winds with multi-model agreement and confidence scoring.
"""
from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd
import logging

from config import MODELS

logger = logging.getLogger(__name__)

# IMD Meteorological Thresholds
THRESHOLDS = {
    "precipitation": {
        "watch": 15.0,        # Convective rain / flash alert (mm)
        "heavy": 64.5,        # IMD Heavy Rain threshold (mm/24h or high hourly)
        "very_heavy": 115.5,  # IMD Very Heavy Rain (mm)
        "extreme": 204.4      # IMD Extremely Heavy Rain (mm)
    },
    "temperature_2m": {
        "plains_heatwave": 40.0,         # Plains heatwave threshold (°C)
        "severe_heatwave": 45.0,         # Severe heatwave (°C)
        "hills_heatwave": 30.0,          # Mountain zones (°C)
        "coastal_heatwave": 37.0         # Coastal zones (°C)
    },
    "wind_speed_10m": {
        "squall": 40.0,                  # Strong squall (km/h)
        "gale_warning": 62.0,            # Cyclone gale force wind (km/h)
        "destructive": 90.0              # Very severe storm (km/h)
    }
}


class ExtremeWeatherDetector:
    """Evaluates multi-model consensus and classifies extreme meteorological risks."""

    def __init__(self):
        self.model_cols = [m["label"].lower().replace(" ", "_") for m in MODELS.values()]

    def detect_extremes_for_forecast(
        self,
        df_forecast: pd.DataFrame,
        blended_series: pd.Series
    ) -> pd.DataFrame:
        """
        Analyzes blended forecast values alongside individual model predictions
        to generate risk alerts, consensus ratios, and confidence scores.
        """
        results = df_forecast[["timestamp", "location_id", "location_name", "lead_time_hours", "variable"]].copy()
        results["blended_value"] = blended_series
        valid_models = [c for c in self.model_cols if c in df_forecast.columns]
        n_models = len(valid_models)

        alert_levels = []
        consensus_ratios = []
        confidence_scores = []
        guidance_notes = []

        for idx, row in df_forecast.iterrows():
            var = row["variable"]
            blended_val = blended_series.loc[idx]
            model_vals = [row[c] for c in valid_models if pd.notnull(row[c])]
            actual_n = len(model_vals) if model_vals else 1

            level = "NONE"
            exceed_count = 0
            reason = "Weather parameters within seasonal normal."

            if var == "precipitation":
                threshold = THRESHOLDS["precipitation"]["heavy"]
                watch_thresh = THRESHOLDS["precipitation"]["watch"]
                exceed_count = sum(1 for v in model_vals if v >= threshold)
                watch_count = sum(1 for v in model_vals if v >= watch_thresh)

                if blended_val >= THRESHOLDS["precipitation"]["extreme"] or exceed_count >= 4:
                    level = "CRITICAL"
                    reason = f"Extreme Rainfall Event predicted ({blended_val:.1f} mm). {exceed_count}/{actual_n} models agree."
                elif blended_val >= THRESHOLDS["precipitation"]["very_heavy"] or exceed_count >= 3:
                    level = "WARNING"
                    reason = f"Very Heavy Rainfall alert ({blended_val:.1f} mm). {exceed_count}/{actual_n} models agree."
                elif blended_val >= threshold or exceed_count >= 2:
                    level = "WATCH"
                    reason = f"Heavy Rainfall Watch ({blended_val:.1f} mm). Model agreement: {exceed_count}/{actual_n}."
                elif blended_val >= watch_thresh and watch_count >= 3:
                    level = "ADVISORY"
                    reason = f"Moderate convective rain spells expected ({blended_val:.1f} mm)."

            elif var == "temperature_2m":
                is_hills = "himalaya" in str(row.get("zone", "")).lower() or "shimla" in str(row.get("location_id", "")).lower()
                thresh = THRESHOLDS["temperature_2m"]["hills_heatwave"] if is_hills else THRESHOLDS["temperature_2m"]["plains_heatwave"]
                exceed_count = sum(1 for v in model_vals if v >= thresh)

                if blended_val >= THRESHOLDS["temperature_2m"]["severe_heatwave"] or (exceed_count >= 4 and blended_val >= 43.0):
                    level = "CRITICAL"
                    reason = f"Severe Heatwave Alert ({blended_val:.1f}°C). Prolonged high daytime thermal stress."
                elif blended_val >= thresh and exceed_count >= 2:
                    level = "WARNING"
                    reason = f"Heatwave Warning ({blended_val:.1f}°C). Exceeds regional threshold."
                elif blended_val >= (thresh - 2.0) and exceed_count >= 2:
                    level = "WATCH"
                    reason = f"Warm temperature anomaly ({blended_val:.1f}°C). Pre-heatwave conditions."

            elif var == "wind_speed_10m":
                gale_thresh = THRESHOLDS["wind_speed_10m"]["gale_warning"]
                squall_thresh = THRESHOLDS["wind_speed_10m"]["squall"]
                exceed_count = sum(1 for v in model_vals if v >= gale_thresh)
                squall_count = sum(1 for v in model_vals if v >= squall_thresh)

                if blended_val >= THRESHOLDS["wind_speed_10m"]["destructive"] or exceed_count >= 3:
                    level = "CRITICAL"
                    reason = f"Severe Cyclonic Gale Force Winds ({blended_val:.1f} km/h). Structural danger."
                elif blended_val >= gale_thresh or exceed_count >= 2:
                    level = "WARNING"
                    reason = f"Gale Wind Warning ({blended_val:.1f} km/h). Marine & coastal advisories active."
                elif blended_val >= squall_thresh and squall_count >= 3:
                    level = "WATCH"
                    reason = f"Strong squally winds expected ({blended_val:.1f} km/h)."

            ratio = exceed_count / max(actual_n, 1)
            spread = row.get("normalized_spread", 0.2)
            # High consensus + low spread = high confidence
            confidence = max(10.0, min(99.0, (ratio * 70.0 + (1.0 - min(spread, 1.0)) * 30.0)))
            if level == "NONE":
                confidence = max(5.0, (1.0 - min(spread, 1.0)) * 85.0)

            alert_levels.append(level)
            consensus_ratios.append(f"{exceed_count}/{actual_n}")
            confidence_scores.append(round(confidence, 1))
            guidance_notes.append(reason)

        results["alert_level"] = alert_levels
        results["consensus_ratio"] = consensus_ratios
        results["confidence_pct"] = confidence_scores
        results["guidance_note"] = guidance_notes

        return results
