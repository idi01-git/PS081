"""
Main Ingestion Pipeline for Hybrid AI-NWP Blending System (PS 26081).
Orchestrates multi-model forecast data fetching, schema normalization,
ensemble metric generation, and storage persistence.
"""
import argparse
from datetime import datetime, timedelta
import pandas as pd
import logging

from config import LOCATIONS, VARIABLES, MODELS
from fetcher import WeatherDataFetcher
from normalizer import ForecastNormalizer
from storage import WeatherStorage

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class Phase1DataPipeline:
    """Orchestrates end-to-end meteorological data ingestion and normalization."""

    def __init__(self):
        self.fetcher = WeatherDataFetcher()
        self.normalizer = ForecastNormalizer()
        self.storage = WeatherStorage()

    def run_live_forecast_ingestion(self, forecast_days: int = 5, past_days: int = 2) -> pd.DataFrame:
        """
        Executes live multi-model forecast ingestion for all monitored Indian locations.
        Collects forecasts from GFS, ECMWF IFS, ICON, JMA, GEM, and ECMWF AIFS (AI model).
        """
        logger.info(f"--- Starting Phase 1 Live Forecast Ingestion across {len(LOCATIONS)} locations ---")
        all_frames = []

        for loc_id, meta in LOCATIONS.items():
            try:
                raw_payload = self.fetcher.fetch_multimodel_forecast(
                    latitude=meta["latitude"],
                    longitude=meta["longitude"],
                    forecast_days=forecast_days,
                    past_days=past_days
                )
                df = self.normalizer.parse_multimodel_payload(loc_id, meta, raw_payload)
                if not df.empty:
                    all_frames.append(df)
                    self.storage.log_ingestion(
                        location_id=loc_id,
                        data_type="multimodel_forecast",
                        record_count=len(df),
                        status="SUCCESS"
                    )
                    logger.info(f"Successfully processed {loc_id} ({meta['name']}): {len(df)} records")
                else:
                    self.storage.log_ingestion(
                        location_id=loc_id,
                        data_type="multimodel_forecast",
                        record_count=0,
                        status="WARNING",
                        error="Empty parsed DataFrame"
                    )
            except Exception as e:
                logger.error(f"Error during ingestion for {loc_id}: {e}")
                self.storage.log_ingestion(
                    location_id=loc_id,
                    data_type="multimodel_forecast",
                    record_count=0,
                    status="FAILED",
                    error=str(e)
                )

        if all_frames:
            combined_df = pd.concat(all_frames, ignore_index=True)
            self.storage.save_forecasts_parquet(combined_df)
            logger.info(f"Phase 1 Ingestion Completed! Total normalized records: {len(combined_df)}")
            return combined_df
        else:
            logger.warning("No records ingested.")
            return pd.DataFrame()

    def run_historical_observations_ingestion(self, days_back: int = 14) -> pd.DataFrame:
        """
        Retrieves ERA5 reanalysis ground-truth observations for skill scoring and verification.
        """
        end_date = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=days_back + 2)).strftime("%Y-%m-%d")

        logger.info(f"--- Ingesting Ground Truth Historical Observations ({start_date} to {end_date}) ---")
        all_obs = []

        for loc_id, meta in LOCATIONS.items():
            try:
                raw_payload = self.fetcher.fetch_historical_observations(
                    latitude=meta["latitude"],
                    longitude=meta["longitude"],
                    start_date=start_date,
                    end_date=end_date
                )
                df = self.normalizer.parse_historical_observations(loc_id, meta, raw_payload)
                if not df.empty:
                    all_obs.append(df)
                    self.storage.log_ingestion(
                        location_id=loc_id,
                        data_type="historical_obs",
                        record_count=len(df),
                        status="SUCCESS"
                    )
                time_delay = 0.2
            except Exception as e:
                logger.error(f"Failed to fetch historical observations for {loc_id}: {e}")

        if all_obs:
            combined_obs = pd.concat(all_obs, ignore_index=True)
            self.storage.save_observations_parquet(combined_obs)
            logger.info(f"Historical observations saved! Total rows: {len(combined_obs)}")
            return combined_obs
        return pd.DataFrame()

    def print_pipeline_summary(self):
        """Displays data summary and integrity statistics."""
        forecast_df = self.storage.load_latest_forecast()
        obs_df = self.storage.load_historical_observations()

        print("\n========================================================")
        print("   PS 26081 PHASE 1: DATA PIPELINE INTEGRITY REPORT    ")
        print("========================================================")
        print(f"Monitored Stations: {len(LOCATIONS)}")
        print(f"Weather Variables:  {', '.join(VARIABLES)}")
        print(f"Ingested Models:    {', '.join([m['label'] for m in MODELS.values()])}")
        print("--------------------------------------------------------")

        if not forecast_df.empty:
            print(f"Latest Forecast Records: {len(forecast_df):,}")
            print(f"Forecast Time Range:    {forecast_df['timestamp'].min()} to {forecast_df['timestamp'].max()}")
            print(f"Locations Covered:      {forecast_df['location_id'].nunique()} stations")
            print("\nSample Forecast Record (Delhi - Precipitation):")
            sample = forecast_df[
                (forecast_df["location_id"] == "delhi") & 
                (forecast_df["variable"] == "precipitation")
            ].head(3)
            print(sample[["timestamp", "variable", "gfs", "ecmwf_ifs", "ecmwf_aifs", "ensemble_mean", "ensemble_std"]])
        else:
            print("No forecast data in storage. Run --live to populate.")

        if not obs_df.empty:
            print(f"\nHistorical Obs Records: {len(obs_df):,}")
            print(f"Obs Time Range:         {obs_df['timestamp'].min()} to {obs_df['timestamp'].max()}")
        print("========================================================\n")


def main():
    parser = argparse.ArgumentParser(description="Phase 1 Data Pipeline Runner (PS 26081)")
    parser.add_argument("--live", action="store_true", help="Fetch and normalize live multi-model forecasts")
    parser.add_argument("--historical", action="store_true", help="Fetch historical ground-truth observations")
    parser.add_argument("--days", type=int, default=14, help="Number of historical days to fetch (default: 14)")
    parser.add_argument("--summary", action="store_true", help="Display storage and data integrity summary")

    args = parser.parse_args()
    pipeline = Phase1DataPipeline()

    if args.live:
        pipeline.run_live_forecast_ingestion()

    if args.historical:
        pipeline.run_historical_observations_ingestion(days_back=args.days)

    if args.summary or (not args.live and not args.historical):
        pipeline.print_pipeline_summary()


if __name__ == "__main__":
    main()
