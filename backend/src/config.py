"""
Configuration module for the Hybrid AI-NWP Blending System (PS 26081).
Defines monitored locations, weather models, physical parameters, and storage paths.
"""
from pathlib import Path

# Base directories (BASE_DIR is 081/)
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
PARQUET_DIR = DATA_DIR / "parquet"
DB_PATH = DATA_DIR / "weather_store.db"

DATA_DIR.mkdir(parents=True, exist_ok=True)
PARQUET_DIR.mkdir(parents=True, exist_ok=True)

# 10 Representative Indian Climatic Zones & Disaster-Prone Hubs
LOCATIONS = {
    "delhi": {
        "name": "Delhi NCR",
        "state": "Delhi",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "zone": "Northern Plains",
        "primary_risks": ["Heatwave", "Urban Flooding", "Dense Fog"]
    },
    "mumbai": {
        "name": "Mumbai Coastal",
        "state": "Maharashtra",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "zone": "Konkan West Coast",
        "primary_risks": ["Monsoon Deluge", "Urban Flooding", "High Tide Inundation"]
    },
    "chennai": {
        "name": "Chennai Coastal",
        "state": "Tamil Nadu",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "zone": "Coromandel East Coast",
        "primary_risks": ["Northeast Monsoon", "Tropical Cyclones", "Flash Floods"]
    },
    "kolkata": {
        "name": "Kolkata Delta",
        "state": "West Bengal",
        "latitude": 22.5726,
        "longitude": 88.3639,
        "zone": "Gangetic Delta",
        "primary_risks": ["Bay of Bengal Cyclones", "Severe Waterlogging"]
    },
    "bengaluru": {
        "name": "Bengaluru",
        "state": "Karnataka",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "zone": "South Deccan Plateau",
        "primary_risks": ["Convective Cloudbursts", "Flash Flooding"]
    },
    "hyderabad": {
        "name": "Hyderabad",
        "state": "Telangana",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "zone": "Central Deccan",
        "primary_risks": ["Severe Heatwave", "Sudden Urban Inundation"]
    },
    "kochi": {
        "name": "Kochi / Kerala Coast",
        "state": "Kerala",
        "latitude": 9.9312,
        "longitude": 76.2673,
        "zone": "Malabar Coast",
        "primary_risks": ["Monsoon Surge", "Landslides", "River Floods"]
    },
    "shimla": {
        "name": "Shimla Himalayas",
        "state": "Himachal Pradesh",
        "latitude": 31.1048,
        "longitude": 77.1734,
        "zone": "Western Himalayas",
        "primary_risks": ["Cloudbursts", "Flash Floods", "Landslides"]
    },
    "bhubaneswar": {
        "name": "Bhubaneswar",
        "state": "Odisha",
        "latitude": 20.2961,
        "longitude": 85.8245,
        "zone": "East Coastal Belt",
        "primary_risks": ["Cyclone Landfalls", "Heavy Depressions"]
    },
    "ahmedabad": {
        "name": "Ahmedabad",
        "state": "Gujarat",
        "latitude": 23.0225,
        "longitude": 72.5714,
        "zone": "Semi-Arid Western",
        "primary_risks": ["Extreme Heatwave", "Arabian Sea Cyclonic Rains"]
    }
}

# Meteorological Models to Ingest
# 5 Physical NWP models + 1 Advanced AI-based Model (AIFS)
MODELS = {
    "gfs_seamless": {
        "label": "GFS",
        "org": "NOAA (USA)",
        "type": "Physical NWP",
        "raw_col_suffix": "gfs_seamless"
    },
    "ecmwf_ifs025": {
        "label": "ECMWF IFS",
        "org": "ECMWF (Europe)",
        "type": "Physical NWP",
        "raw_col_suffix": "ecmwf_ifs025"
    },
    "icon_seamless": {
        "label": "ICON",
        "org": "DWD (Germany)",
        "type": "Physical NWP",
        "raw_col_suffix": "icon_seamless"
    },
    "jma_seamless": {
        "label": "JMA",
        "org": "JMA (Japan)",
        "type": "Physical NWP",
        "raw_col_suffix": "jma_seamless"
    },
    "gem_seamless": {
        "label": "GEM",
        "org": "ECCC (Canada)",
        "type": "Physical NWP",
        "raw_col_suffix": "gem_seamless"
    },
    "ecmwf_aifs025": {
        "label": "ECMWF AIFS",
        "org": "ECMWF (Europe)",
        "type": "AI Weather Model (GNN)",
        "raw_col_suffix": "ecmwf_aifs025"
    }
}

# Physical Meteorological Variables to Blend
VARIABLES = [
    "temperature_2m",       # Air temperature at 2 meters (°C)
    "precipitation",        # Total precipitation (rain + showers + snow) (mm)
    "wind_speed_10m",       # Wind speed at 10 meters above ground (km/h)
    "surface_pressure"      # Atmospheric pressure at surface (hPa)
]

# API Endpoints
FORECAST_API_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_API_URL = "https://archive-api.open-meteo.com/v1/archive"
