"""
Data Ingestion Fetcher for Hybrid AI-NWP Blending System (PS 26081).
Queries Open-Meteo Multi-Model Forecast API (GFS, ECMWF IFS, ICON, JMA, GEM, ECMWF AIFS)
and Historical Reanalysis/Observations Archive with retry logic and error handling.
"""
import time
import logging
from typing import Dict, Any, Optional
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from config import (
    MODELS,
    VARIABLES,
    FORECAST_API_URL,
    ARCHIVE_API_URL,
    LOCATIONS
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def create_resilient_session(retries: int = 3, backoff_factor: float = 0.5) -> requests.Session:
    """Creates a requests session configured with exponential backoff retries."""
    session = requests.Session()
    retry_strategy = Retry(
        total=retries,
        backoff_factor=backoff_factor,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


class WeatherDataFetcher:
    """Handles API interactions for real-time multi-model forecasts and historical observations."""

    def __init__(self, timeout: int = 15):
        self.session = create_resilient_session()
        self.timeout = timeout

    def fetch_multimodel_forecast(
        self,
        latitude: float,
        longitude: float,
        forecast_days: int = 5,
        past_days: int = 2
    ) -> Dict[str, Any]:
        """
        Fetches combined multi-model forecasts (GFS, ECMWF IFS, ICON, JMA, GEM, AIFS AI)
        for a geographic coordinate.
        """
        models_str = ",".join(MODELS.keys())
        variables_str = ",".join(VARIABLES)

        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": variables_str,
            "models": models_str,
            "forecast_days": forecast_days,
            "past_days": past_days,
            "timezone": "auto"
        }

        logger.info(f"Fetching multi-model forecast for ({latitude}, {longitude}) | Horizon: {forecast_days}d")
        response = self.session.get(FORECAST_API_URL, params=params, timeout=self.timeout)
        response.raise_for_status()
        return response.json()

    def fetch_historical_observations(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """
        Fetches ground-truth historical reanalysis/station weather observations from ERA5.
        Format of dates: YYYY-MM-DD
        """
        variables_str = ",".join(VARIABLES)
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": variables_str,
            "timezone": "auto"
        }

        logger.info(f"Fetching historical observations for ({latitude}, {longitude}) [{start_date} to {end_date}]")
        response = self.session.get(ARCHIVE_API_URL, params=params, timeout=self.timeout)
        response.raise_for_status()
        return response.json()

    def fetch_all_monitored_locations(
        self,
        forecast_days: int = 5,
        past_days: int = 2,
        delay_between_calls: float = 0.3
    ) -> Dict[str, Dict[str, Any]]:
        """
        Iterates over all defined Indian climatic hubs and retrieves multi-model forecasts.
        """
        results = {}
        for loc_id, info in LOCATIONS.items():
            try:
                data = self.fetch_multimodel_forecast(
                    latitude=info["latitude"],
                    longitude=info["longitude"],
                    forecast_days=forecast_days,
                    past_days=past_days
                )
                results[loc_id] = {
                    "location_info": info,
                    "payload": data
                }
                time.sleep(delay_between_calls)
            except Exception as e:
                logger.error(f"Failed to fetch data for location {loc_id} ({info['name']}): {e}")
        return results
