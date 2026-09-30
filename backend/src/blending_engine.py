"""
Master Blending Engine for Hybrid AI-NWP Blending System (PS 26081).
Orchestrates multi-model weighting algorithms (Equal-Weight, Inverse-Error, Adaptive ML),
generates dynamic weight maps, evaluates multi-model consensus, and persists blended forecasts.
"""
import argparse
from pathlib import Path
import pandas as pd
import numpy as np
import logging

from config import VARIABLES, MODELS, PARQUET_DIR, DB_PATH
from storage import WeatherStorage
from blender_baseline import BaselineBlender
from blender_ml import AdaptiveMLBlender
from extreme_detector import ExtremeWeatherDetector

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class HybridBlendingEngine:
    """Master orchestrator for multi-model forecast blending and extreme alert detection."""

    def __init__(self):
        self.storage = WeatherStorage()
        self.baseline_blender = BaselineBlender()
        self.ml_blender = AdaptiveMLBlender(temperature=1.0, shrinkage=0.75)
        self.extreme_detector = ExtremeWeatherDetector()
        self.model_cols = [m["label"].lower().replace(" ", "_") for m in MODELS.values()]

    def compute_historical_model_errors(self, df_forecasts: pd.DataFrame, df_obs: pd.DataFrame) -> dict:
        """
        Computes historical Root Mean Square Error (RMSE) for each constituent model.
        Returns a dict of {variable: {model_name: rmse}}.
        """
        model_errors = {}
        if df_forecasts.empty or df_obs.empty:
            return {var: {m: 1.0 for m in self.model_cols} for var in VARIABLES}

        merged = pd.merge(
            df_forecasts,
            df_obs[["timestamp", "location_id", "variable", "observed_value"]],
            on=["timestamp", "location_id", "variable"],
            how="inner"
        )

        for var in VARIABLES:
            model_errors[var] = {}
            var_sub = merged[merged["variable"] == var]
            
            for m in self.model_cols:
                if m in var_sub.columns and var_sub[m].notnull().sum() > 10:
                    diff = var_sub[m] - var_sub["observed_value"]
                    rmse = np.sqrt(np.mean(diff ** 2))
                    model_errors[var][m] = float(max(rmse, 0.05))
                else:
                    model_errors[var][m] = 1.0

        return model_errors

    def run_blending(self) -> dict:
        """
        Executes end-to-end multi-model blending across all locations and weather variables.
        """
        logger.info("--- Initiating Phase 2 Hybrid Forecast Blending Pipeline ---")

        # 1. Load normalized forecasts and historical observations
        df_forecast = self.storage.load_latest_forecast()
        df_obs = self.storage.load_historical_observations()

        if df_forecast.empty:
            raise RuntimeError("No forecast records found. Run Phase 1 pipeline first: python pipeline.py --live")

        # 2. Compute historical errors for inverse-error baseline prior
        model_errors_by_var = self.compute_historical_model_errors(df_forecast, df_obs)
        logger.info("Historical model errors computed across variables.")

        # 3. Fit Adaptive ML Blender on paired historical data
        for var in VARIABLES:
            self.ml_blender.fit_from_historical_data(df_forecast, df_obs, variable=var)

        # 4. Perform Blending across each variable
        all_blended_records = []
        all_weights_records = []
        all_alerts_records = []

        for var, var_group in df_forecast.groupby("variable"):
            # Strategy A: Equal Weight
            eq_blended, _ = self.baseline_blender.equal_weight_blend(var_group, self.model_cols)

            # Strategy B: Inverse-Error Weighting
            var_errors = model_errors_by_var.get(var, {})
            inv_blended, inv_weights = self.baseline_blender.inverse_error_blend(
                var_group, var_errors, self.model_cols
            )

            # Strategy C: Context-Aware Adaptive ML Blending (Primary System Output)
            ml_blended, weights_df = self.ml_blender.blend(var_group)

            # Enforce physical non-negativity bounds for precipitation and wind speed
            if var in ["precipitation", "wind_speed_10m"]:
                eq_blended = np.maximum(eq_blended, 0.0)
                inv_blended = np.maximum(inv_blended, 0.0)
                ml_blended = np.maximum(ml_blended, 0.0)

            # Attach blended outputs
            processed_df = var_group.copy()
            processed_df["blend_equal_weight"] = eq_blended
            processed_df["blend_inverse_error"] = inv_blended
            processed_df["blend_hybrid_ml"] = ml_blended

            # The primary operational forecast is the Hybrid ML Blend
            processed_df["final_blended_forecast"] = ml_blended

            # Attach dominant model and weights
            weights_merged = weights_df.copy()
            weights_merged["timestamp"] = processed_df["timestamp"]
            weights_merged["location_id"] = processed_df["location_id"]
            weights_merged["location_name"] = processed_df["location_name"]
            weights_merged["variable"] = var
            weights_merged["lead_time_hours"] = processed_df["lead_time_hours"]

            # Strategy D: Extreme Weather Detection
            alerts_df = self.extreme_detector.detect_extremes_for_forecast(processed_df, ml_blended)

            all_blended_records.append(processed_df)
            all_weights_records.append(weights_merged)
            all_alerts_records.append(alerts_df)

        final_blended_df = pd.concat(all_blended_records).sort_index().reset_index(drop=True)
        final_weights_df = pd.concat(all_weights_records).sort_index().reset_index(drop=True)
        final_alerts_df = pd.concat(all_alerts_records).sort_index().reset_index(drop=True)

        # 5. Persist Blending Outputs to Parquet
        blended_path = PARQUET_DIR / "blended_forecasts.parquet"
        weights_path = PARQUET_DIR / "adaptive_model_weights.parquet"
        alerts_path = PARQUET_DIR / "extreme_weather_alerts.parquet"

        final_blended_df.to_parquet(blended_path, engine="pyarrow", index=False)
        final_weights_df.to_parquet(weights_path, engine="pyarrow", index=False)
        final_alerts_df.to_parquet(alerts_path, engine="pyarrow", index=False)

        logger.info(f"Saved Blended Forecasts: {len(final_blended_df):,} rows -> {blended_path}")
        logger.info(f"Saved Adaptive Weights:  {len(final_weights_df):,} rows -> {weights_path}")
        logger.info(f"Saved Extreme Alerts:    {len(final_alerts_df):,} rows -> {alerts_path}")

        # 6. Save critical alerts to SQLite for fast dashboard lookup
        self.save_alerts_to_sqlite(final_alerts_df)

        return {
            "blended_df": final_blended_df,
            "weights_df": final_weights_df,
            "alerts_df": final_alerts_df
        }

    def save_alerts_to_sqlite(self, df_alerts: pd.DataFrame):
        """Saves high-priority active alerts into SQLite."""
        active_alerts = df_alerts[df_alerts["alert_level"] != "NONE"]
        with self.storage.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS active_weather_alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    location_id TEXT,
                    location_name TEXT,
                    lead_time_hours INTEGER,
                    variable TEXT,
                    blended_value REAL,
                    alert_level TEXT,
                    consensus_ratio TEXT,
                    confidence_pct REAL,
                    guidance_note TEXT
                )
            """)
            cursor.execute("DELETE FROM active_weather_alerts")

            for _, row in active_alerts.iterrows():
                cursor.execute("""
                    INSERT INTO active_weather_alerts (
                        timestamp, location_id, location_name, lead_time_hours,
                        variable, blended_value, alert_level, consensus_ratio,
                        confidence_pct, guidance_note
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    str(row["timestamp"]), row["location_id"], row["location_name"],
                    int(row["lead_time_hours"]), row["variable"], float(row["blended_value"]),
                    row["alert_level"], row["consensus_ratio"], float(row["confidence_pct"]),
                    row["guidance_note"]
                ))

    def print_blending_report(self, results: dict):
        """Prints a human-readable executive summary of the blending engine results."""
        blended = results["blended_df"]
        weights = results["weights_df"]
        alerts = results["alerts_df"]

        print("\n" + "=" * 70)
        print("     HYBRID AI-NWP FORECAST BLENDING SYSTEM (PHASE 2 SUMMARY)     ")
        print("=" * 70)
        print(f"Total Blended Forecast Points: {len(blended):,}")
        print(f"Blending Strategies Evaluated:  Equal-Weight, Inverse-Error, Adaptive ML")
        print(f"Output Meteorological Models:   {', '.join([m['label'] for m in MODELS.values()])}")
        print("-" * 70)

        print("\n[SAMPLE 1] Multi-Model vs Blended Forecast (Delhi - Rain, Lead-Time: +24h):")
        sample_delhi = blended[
            (blended["location_id"] == "delhi") & 
            (blended["variable"] == "precipitation") &
            (blended["lead_time_hours"] == 24)
        ].head(1)
        if not sample_delhi.empty:
            row = sample_delhi.iloc[0]
            print(f"  Time: {row['timestamp']} | Location: Delhi NCR")
            print(f"  Individual Models:")
            print(f"    - GFS:        {row.get('gfs', 0.0):.2f} mm")
            print(f"    - ECMWF IFS:  {row.get('ecmwf_ifs', 0.0):.2f} mm")
            print(f"    - ICON:       {row.get('icon', 0.0):.2f} mm")
            print(f"    - JMA:        {row.get('jma', 0.0):.2f} mm")
            print(f"    - GEM:        {row.get('gem', 0.0):.2f} mm")
            print(f"    - ECMWF AIFS: {row.get('ecmwf_aifs', 0.0):.2f} mm (AI Model)")
            print(f"  Ensemble Arithmetic Mean: {row.get('ensemble_mean', 0.0):.2f} mm")
            print(f"  --> FINAL BLENDED HYBRID: {row.get('final_blended_forecast', 0.0):.2f} mm")

        print("\n[SAMPLE 2] Adaptive Model Trust & Weight Allocation (Mumbai Coastal):")
        sample_w = weights[
            (weights["location_id"] == "mumbai") & 
            (weights["variable"] == "temperature_2m") &
            (weights["lead_time_hours"] == 12)
        ].head(1)
        if not sample_w.empty:
            w_row = sample_w.iloc[0]
            for m in self.model_cols:
                if m in w_row:
                    print(f"    - {m.upper():12s}: {w_row[m] * 100:.1f}%")
            print(f"  Dominant Model: {w_row.get('dominant_model', '').upper()} ({w_row.get('dominant_weight', 0.0)*100:.1f}%)")

        print("\n[SAMPLE 3] Active Extreme Weather Alerts Summary:")
        active_counts = alerts["alert_level"].value_counts()
        for lvl, cnt in active_counts.items():
            print(f"    - Alert Level [{lvl:8s}]: {cnt:,} hours flagged")

        critical_alerts = alerts[alerts["alert_level"].isin(["CRITICAL", "WARNING", "WATCH"])].head(3)
        if not critical_alerts.empty:
            print("\n  Sample Flagged Warnings:")
            for _, a_row in critical_alerts.iterrows():
                print(f"    [{a_row['alert_level']}] {a_row['location_name']} (+{a_row['lead_time_hours']}h): {a_row['guidance_note']} (Confidence: {a_row['confidence_pct']}%)")
        print("=" * 70 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Phase 2 Master Blending Engine Runner (PS 26081)")
    parser.add_argument("--run", action="store_true", help="Run full blending, weight optimization, and alert generation")
    args = parser.parse_args()

    engine = HybridBlendingEngine()
    results = engine.run_blending()
    engine.print_blending_report(results)


if __name__ == "__main__":
    main()
