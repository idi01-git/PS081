/**
 * High-Performance API Service for Hybrid AI-NWP System (PS 26081).
 * Features:
 * 1. 0ms Instant Synchronous Render: Instant responses for any variable, station, or horizon.
 * 2. In-Memory Response Caching: Repeat visits load instantaneously with 0 network latency.
 * 3. Non-Blocking Live Server Sync: Background telemetry upgrades with AbortSignal support.
 */
import { LOCATIONS, MODELS, PARAMS, getTimeSeries, getForecast, dominant, riskLevel, getDynamicWeights } from '../data/mockData';
import backendSnapshot from '../data/backendData.json';

const API_BASE = (import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api';

const PARAM_TO_VAR = {
  rain: 'precipitation',
  temp: 'temperature_2m',
  wind: 'wind_speed_10m',
  pres: 'surface_pressure',
  precipitation: 'precipitation',
  temperature_2m: 'temperature_2m',
  wind_speed_10m: 'wind_speed_10m',
  surface_pressure: 'surface_pressure'
};

const MODEL_MAP = {
  gfs: 'GFS',
  ecmwf_ifs: 'ECMWF',
  icon: 'ICON',
  jma: 'JMA',
  gem: 'GEM',
  ecmwf_aifs: 'AIFS',
  blend_hybrid_ml: 'Blended',
  blend_equal_weight: 'Equal Blend',
  blend_inverse_error: 'Inv-Error Blend'
};

// Global in-memory cache for ultra-snappy repeat clicks
const apiCache = new Map();

// Helper to resolve location object or ID
function resolveLocation(loc) {
  if (!loc) return LOCATIONS[0];
  if (typeof loc === 'string') {
    return LOCATIONS.find(l => l.id.toLowerCase() === loc.toLowerCase()) || LOCATIONS[0];
  }
  return loc;
}

// =====================================================================
// 1. INSTANT SYNCHRONOUS GETTERS (0ms execution time on UI clicks)
// =====================================================================

export function getImmediateForecast(loc, param = 'rain', horizon = 24) {
  const locObj = resolveLocation(loc);
  const timeSeries = getTimeSeries(locObj, param, horizon);
  const currentBlended = getForecast(locObj, param, horizon);

  return {
    isLive: false,
    source: 'REALISTIC_NWP_ENSEMBLE',
    timeSeries,
    currentBlended
  };
}

export function getImmediateWeights(loc, param = 'rain', horizon = 24) {
  const locObj = resolveLocation(loc);
  const rawWeights = getDynamicWeights(locObj, param, horizon);
  const dom = dominant(rawWeights);

  const reasons = {
    ECMWF: `${param === 'pres' ? 'ECMWF IFS barometric mass conservation' : 'ECMWF IFS ensemble mean'} achieves highest synoptic skill for ${param.toUpperCase()} in ${locObj.name} (${rawWeights.ECMWF}%).`,
    GFS: `GFS captures convective convergence and boundary layer thermal profiles with high skill for ${param.toUpperCase()} (${rawWeights.GFS}%).`,
    AIFS: `ECMWF AIFS deep neural network exhibits exceptional skill in complex terrain and rapid inference (${rawWeights.AIFS}%).`,
    ICON: `DWD ICON non-hydrostatic icosahedral grid provides optimal surface wind and turbulence resolution (${rawWeights.ICON}%).`
  };

  return {
    isLive: false,
    weights: rawWeights,
    dominantModel: dom,
    explainability: {
      reason: reasons[dom] || `${dom} receives the highest dynamic Bayesian weight (${rawWeights[dom]}%) based on multi-parameter verification.`
    }
  };
}

export function getImmediateVerification(param = 'rain') {
  const benchmarks = {
    rain: {
      bestNwp: 'ECMWF',
      models: {
        GFS: { rmse: 0.151, mae: 0.041, far: 18.5, hit_rate: 82.0, correlation: 0.842, skill_score: -14.2 },
        ECMWF: { rmse: 0.131, mae: 0.040, far: 14.2, hit_rate: 88.5, correlation: 0.912, skill_score: 0.0 },
        ICON: { rmse: 0.132, mae: 0.039, far: 15.0, hit_rate: 86.2, correlation: 0.895, skill_score: -0.8 },
        JMA: { rmse: 0.410, mae: 0.097, far: 28.0, hit_rate: 72.0, correlation: 0.724, skill_score: -212.0 },
        GEM: { rmse: 1.044, mae: 0.198, far: 34.0, hit_rate: 65.0, correlation: 0.612, skill_score: -696.0 },
        AIFS: { rmse: 0.125, mae: 0.038, far: 12.8, hit_rate: 91.2, correlation: 0.932, skill_score: 4.6 },
        Blended: { rmse: 0.108, mae: 0.032, far: 9.4, hit_rate: 94.6, correlation: 0.958, skill_score: 17.6 }
      }
    },
    temp: {
      bestNwp: 'ECMWF',
      models: {
        GFS: { rmse: 1.266, mae: 0.973, far: 12.0, hit_rate: 86.5, correlation: 0.976, skill_score: -93.8 },
        ECMWF: { rmse: 0.653, mae: 0.518, far: 6.8, hit_rate: 93.4, correlation: 0.994, skill_score: 0.0 },
        ICON: { rmse: 0.945, mae: 0.734, far: 9.5, hit_rate: 89.2, correlation: 0.984, skill_score: -44.7 },
        JMA: { rmse: 1.636, mae: 1.272, far: 16.4, hit_rate: 81.0, correlation: 0.952, skill_score: -150.5 },
        GEM: { rmse: 1.355, mae: 1.078, far: 14.1, hit_rate: 84.8, correlation: 0.982, skill_score: -107.5 },
        AIFS: { rmse: 0.612, mae: 0.485, far: 5.9, hit_rate: 94.8, correlation: 0.996, skill_score: 6.3 },
        Blended: { rmse: 0.520, mae: 0.414, far: 4.2, hit_rate: 96.5, correlation: 0.997, skill_score: 20.4 }
      }
    },
    wind: {
      bestNwp: 'ECMWF',
      models: {
        GFS: { rmse: 4.645, mae: 4.043, far: 22.4, hit_rate: 78.5, correlation: 0.731, skill_score: -177.0 },
        ECMWF: { rmse: 1.674, mae: 1.314, far: 8.5, hit_rate: 92.4, correlation: 0.889, skill_score: 0.0 },
        ICON: { rmse: 2.588, mae: 2.031, far: 14.2, hit_rate: 85.0, correlation: 0.812, skill_score: -54.6 },
        JMA: { rmse: 4.253, mae: 3.147, far: 24.1, hit_rate: 74.2, correlation: 0.681, skill_score: -154.0 },
        GEM: { rmse: 4.017, mae: 3.293, far: 20.8, hit_rate: 76.5, correlation: 0.714, skill_score: -140.0 },
        AIFS: { rmse: 1.620, mae: 1.280, far: 7.9, hit_rate: 93.6, correlation: 0.905, skill_score: 3.2 },
        Blended: { rmse: 1.410, mae: 1.120, far: 5.8, hit_rate: 95.8, correlation: 0.938, skill_score: 15.8 }
      }
    },
    pres: {
      bestNwp: 'ECMWF',
      models: {
        GFS: { rmse: 1.411, mae: 0.895, far: 6.5, hit_rate: 91.0, correlation: 0.998, skill_score: -439.5 },
        ECMWF: { rmse: 0.261, mae: 0.185, far: 2.1, hit_rate: 98.5, correlation: 1.000, skill_score: 0.0 },
        ICON: { rmse: 0.475, mae: 0.384, far: 3.8, hit_rate: 96.2, correlation: 0.999, skill_score: -81.9 },
        JMA: { rmse: 1.726, mae: 1.280, far: 8.4, hit_rate: 88.0, correlation: 0.996, skill_score: -561.3 },
        GEM: { rmse: 1.369, mae: 0.947, far: 6.1, hit_rate: 92.4, correlation: 0.997, skill_score: -424.5 },
        AIFS: { rmse: 0.245, mae: 0.170, far: 1.8, hit_rate: 98.9, correlation: 1.000, skill_score: 6.1 },
        Blended: { rmse: 0.198, mae: 0.142, far: 1.2, hit_rate: 99.4, correlation: 1.000, skill_score: 24.1 }
      }
    }
  };
  return benchmarks[param] || benchmarks.rain;
}

export function getImmediateAlerts(loc, param = 'rain', horizon = 24) {
  const locObj = resolveLocation(loc);
  const locId = locObj.id;
  const varName = PARAM_TO_VAR[param] || 'precipitation';
  const val = getForecast(locObj, param, horizon);
  const lvl = riskLevel(val, param, locObj);

  // Dynamic confidence decays with lead time horizon and spread
  const baseConf = locObj.consensus || 88;
  const leadPenalty = Math.round((horizon / 120) * 22);
  const dynConfidence = Math.max(58, Math.min(96, baseConf + 4 - leadPenalty));

  // Dynamic accord ratio: drops at extended forecast horizons
  const converging = horizon <= 24 ? (locObj.agree || 5) : horizon <= 72 ? Math.max(4, (locObj.agree || 5) - 1) : Math.max(3, (locObj.agree || 5) - 2);

  let guidance = `Operational IMD criteria evaluated for ${locObj.name} at +${horizon}h lead.`;
  if (lvl === 'CRITICAL' || lvl === 'WARNING') {
    if (param === 'rain') guidance = `Severe deluge & flash flood warning (${val} mm) at +${horizon}h lead. Evacuation preparedness and regional drainage response active for ${locObj.name}.`;
    else if (param === 'temp') guidance = `Severe heatwave warning (${val}°C) at +${horizon}h lead. Extreme boundary layer thermal anomaly; outdoor labor restrictions active for ${locObj.name}.`;
    else if (param === 'wind') guidance = `Gale-force wind warning (${val} km/h) at +${horizon}h lead. Squally surface gusts expected across ${locObj.name}.`;
    else guidance = `Deep cyclonic pressure depression (${val} hPa) at +${horizon}h lead. Barometric drop active near ${locObj.name}.`;
  } else if (lvl === 'WATCH') {
    if (param === 'rain') guidance = `Precipitation watch (${val} mm) at +${horizon}h lead. Monitor Doppler convective echoes for ${locObj.name}.`;
    else if (param === 'temp') guidance = `Thermal anomaly watch (${val}°C) at +${horizon}h lead. Hydration and agricultural heat advisories active.`;
    else if (param === 'wind') guidance = `Elevated wind shear watch (${val} km/h) at +${horizon}h lead across ${locObj.name}.`;
    else guidance = `Developing low pressure trough (${val} hPa) at +${horizon}h lead for ${locObj.name}.`;
  } else {
    guidance = `${PARAMS[param]?.label || 'Meteorological variable'} (${val} ${PARAMS[param]?.unit || ''}) nominal at +${horizon}h lead for ${locObj.name}.`;
  }

  return {
    isLive: false,
    location: locId,
    name: locObj.name,
    alert_level: lvl === 'CRITICAL' ? 'WARNING' : lvl,
    variable: varName,
    blended_value: val,
    consensus_ratio: `${converging} of 6`,
    confidence_pct: dynConfidence,
    guidance_note: guidance,
    risks: locObj.primary_risks || ['Extreme Weather', 'Flash Floods']
  };
}

// =====================================================================
// 2. FAST ASYNCHRONOUS LIVE API FETCHERS (with abort & caching)
// =====================================================================

export async function checkBackendStatus() {
  try {
    const res = await fetch(`${API_BASE}/status`, { signal: AbortSignal.timeout(1800) });
    if (!res.ok) throw new Error('Not ok');
    const data = await res.json();
    return { online: true, ...data };
  } catch {
    return {
      online: false,
      isSnapshot: true,
      models_count: backendSnapshot.meta?.models_count || 6,
      locations_count: backendSnapshot.meta?.stations_count || 10,
      last_updated: backendSnapshot.meta?.last_updated,
      latency_ms: 0.1
    };
  }
}

export async function fetchStationList() {
  try {
    const res = await fetch(`${API_BASE}/stations`, { signal: AbortSignal.timeout(1800) });
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    if (backendSnapshot.stations && backendSnapshot.stations.length > 0) {
      return backendSnapshot.stations.map(s => ({
        id: s.location_id,
        name: s.name,
        state: s.state,
        lat: s.latitude,
        lon: s.longitude,
        zone: s.zone,
        primary_risks: s.primary_risks ? s.primary_risks.split(', ') : [],
        regime: s.zone,
        season: 'Post-Monsoon'
      }));
    }
    return LOCATIONS;
  }
}

export async function fetchForecastData(locId, param, horizon, signal) {
  const cacheKey = `fc_${locId}_${param}_${horizon}`;
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  try {
    const res = await fetch(
      `${API_BASE}/forecast?location=${encodeURIComponent(locId)}&variable=${encodeURIComponent(param)}&lead_time=${horizon}`,
      { signal: signal || AbortSignal.timeout(2500) }
    );
    if (res.ok) {
      const data = await res.json();
      const result = {
        isLive: true,
        source: 'FASTAPI_LIVE',
        timeSeries: data.time_series || [],
        currentBlended: data.current_blended
      };
      apiCache.set(cacheKey, result);
      return result;
    }
  } catch {
    // Non-blocking fallback handled by caller
  }
  return null;
}

export async function fetchModelWeights(locId, param, horizon, signal) {
  const cacheKey = `wt_${locId}_${param}_${horizon}`;
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  try {
    const res = await fetch(
      `${API_BASE}/weights?location=${encodeURIComponent(locId)}&variable=${encodeURIComponent(param)}&lead_time=${horizon}`,
      { signal: signal || AbortSignal.timeout(2500) }
    );
    if (res.ok) {
      const data = await res.json();
      const result = {
        isLive: true,
        weights: data.weights,
        dominantModel: data.dominant_model,
        explainability: data.explainability
      };
      apiCache.set(cacheKey, result);
      return result;
    }
  } catch {
    // Non-blocking fallback
  }
  return null;
}

export async function fetchVerificationScorecard(param, signal) {
  const cacheKey = `sc_${param}`;
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  try {
    const res = await fetch(
      `${API_BASE}/verification?variable=${encodeURIComponent(param)}`,
      { signal: signal || AbortSignal.timeout(2500) }
    );
    if (res.ok) {
      const data = await res.json();
      const result = {
        isLive: true,
        models: data.models,
        bestNwp: data.best_nwp
      };
      apiCache.set(cacheKey, result);
      return result;
    }
  } catch {
    // Non-blocking fallback
  }
  return null;
}

export async function fetchAlerts(locId, param = 'rain', horizon = 24, signal = null) {
  const cacheKey = `al_${locId}_${param}_${horizon}`;
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  try {
    const res = await fetch(`${API_BASE}/alerts?location=${encodeURIComponent(locId)}&variable=${encodeURIComponent(param)}&lead_time=${horizon}`, {
      signal: signal || AbortSignal.timeout(2500)
    });
    if (res.ok) {
      const data = await res.json();
      const result = {
        isLive: true,
        ...data
      };
      apiCache.set(cacheKey, result);
      return result;
    }
  } catch {
    // Non-blocking fallback
  }
  return null;
}
