"""
Storage and Persistence Module for Hybrid AI-NWP Blending System (PS 26081).
Manages fast columnar Parquet files and SQLite relational cache.
"""
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
import pandas as pd
import logging

from config import PARQUET_DIR, DB_PATH, LOCATIONS

logger = logging.getLogger(__name__)


from contextlib import contextmanager

class WeatherStorage:
    """Handles Parquet file serialization and SQLite metadata tracking."""

    def __init__(self, db_path: Path = DB_PATH, parquet_dir: Path = PARQUET_DIR):
        self.db_path = db_path
        self.parquet_dir = parquet_dir
        self.init_database()

    @contextmanager
    def get_connection(self):
        """Yields an SQLite connection that is committed and explicitly closed."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def init_database(self):
        """Initializes relational tables for locations, ingestion runs, and cached forecasts."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Monitored Stations Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS stations (
                    location_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    state TEXT,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    zone TEXT,
                    primary_risks TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Ingestion Audit Log
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ingestion_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ingestion_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    location_id TEXT NOT NULL,
                    data_type TEXT NOT NULL,
                    record_count INTEGER,
                    status TEXT NOT NULL,
                    error_message TEXT
                )
            """)

            # Seed stations if empty
            cursor.execute("SELECT COUNT(*) FROM stations")
            if cursor.fetchone()[0] == 0:
                for loc_id, meta in LOCATIONS.items():
                    cursor.execute("""
                        INSERT INTO stations (location_id, name, state, latitude, longitude, zone, primary_risks)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        loc_id,
                        meta["name"],
                        meta["state"],
                        meta["latitude"],
                        meta["longitude"],
                        meta["zone"],
                        ", ".join(meta.get("primary_risks", []))
                    ))
            conn.commit()

    def save_forecasts_parquet(self, df: pd.DataFrame, partition_col: str = "location_id") -> Path:
        """
        Saves normalized forecast DataFrame to Parquet format.
        Partitioned by location for ultra-fast reading.
        """
        if df.empty:
            logger.warning("Empty DataFrame provided to save_forecasts_parquet")
            return self.parquet_dir

        target_file = self.parquet_dir / "latest_multimodel_forecasts.parquet"
        df.to_parquet(target_file, engine="pyarrow", index=False)
        logger.info(f"Saved {len(df)} forecast records to {target_file}")

        # Also save individual station partitions for quick lookups
        for loc_id, loc_df in df.groupby("location_id"):
            loc_file = self.parquet_dir / f"forecast_{loc_id}.parquet"
            loc_df.to_parquet(loc_file, engine="pyarrow", index=False)

        return target_file

    def save_observations_parquet(self, df: pd.DataFrame) -> Path:
        """
        Saves historical ground-truth observations to Parquet.
        """
        if df.empty:
            logger.warning("Empty observations DataFrame provided")
            return self.parquet_dir

        target_file = self.parquet_dir / "historical_observations.parquet"
        df.to_parquet(target_file, engine="pyarrow", index=False)
        logger.info(f"Saved {len(df)} observation records to {target_file}")
        return target_file

    def log_ingestion(self, location_id: str, data_type: str, record_count: int, status: str, error: str = ""):
        """Records an ingestion run into SQLite audit table."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO ingestion_logs (location_id, data_type, record_count, status, error_message)
                VALUES (?, ?, ?, ?, ?)
            """, (location_id, data_type, record_count, status, error))
            conn.commit()

    def load_latest_forecast(self, location_id: Optional[str] = None, variable: Optional[str] = None) -> pd.DataFrame:
        """
        Reads stored forecasts from Parquet with optional station or variable filters.
        """
        target_file = self.parquet_dir / "latest_multimodel_forecasts.parquet"
        if not target_file.exists():
            logger.warning(f"Forecast file not found: {target_file}")
            return pd.DataFrame()

        df = pd.read_parquet(target_file, engine="pyarrow")
        if location_id:
            df = df[df["location_id"] == location_id]
        if variable:
            df = df[df["variable"] == variable]
        return df

    def load_historical_observations(self, location_id: Optional[str] = None, variable: Optional[str] = None) -> pd.DataFrame:
        """
        Reads stored historical ground truth observations.
        """
        target_file = self.parquet_dir / "historical_observations.parquet"
        if not target_file.exists():
            logger.warning(f"Observations file not found: {target_file}")
            return pd.DataFrame()

        df = pd.read_parquet(target_file, engine="pyarrow")
        if location_id:
            df = df[df["location_id"] == location_id]
        if variable:
            df = df[df["variable"] == variable]
        return df
