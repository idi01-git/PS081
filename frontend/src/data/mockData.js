// Meteorological constants and local baseline cache aligned with Python backend (PS 26081)
export const MODELS = ['ECMWF', 'GFS', 'ICON', 'JMA', 'GEM', 'AIFS'];
export const COLORS = {
  Blended: '#ff6b6b',
  ECMWF: '#ff3b3b',
  GFS: '#1f7bff',
  ICON: '#1fd06b',
  JMA: '#9b5cf6',
  GEM: '#06b6d4',
  AIFS: '#fbbf24'
};
export const HORIZONS = [6, 12, 24, 48, 72, 120];
export const HSCALE = { 6: 0.12, 12: 0.25, 24: 0.5, 48: 0.8, 72: 1.0, 120: 1.2 };
export const PARAMS = {
  rain: { label: 'Precipitation', unit: 'mm', max: 300, backendVar: 'precipitation' },
  temp: { label: 'Temperature', unit: '°C', max: 50, backendVar: 'temperature_2m' },
  wind: { label: 'Wind Speed', unit: 'km/h', max: 100, backendVar: 'wind_speed_10m' },
  pres: { label: 'Pressure', unit: 'hPa', max: 1100, backendVar: 'surface_pressure' }
};
export const IMD_THRESHOLD = 64.5;

const L = (id, name, state, lat, lon, base, regime, season, weights, factors, rmse, risk) => ({
  id, name, state, lat, lon, base, regime, season, weights, factors, rmse, ...risk
});

const W = (e, g, i, j, m, a) => ({ ECMWF: e, GFS: g, ICON: i, JMA: j, GEM: m, AIFS: a });
const R = (g, e, i, j, m, a, b) => ({ GFS: g, ECMWF: e, ICON: i, JMA: j, GEM: m, AIFS: a, Blended: b });

// 10 Monitored Stations from backend/src/config.py
export const LOCATIONS = [
  L('delhi', 'Delhi NCR', 'Delhi', 28.6139, 77.2090, { rain: 18, temp: 36, wind: 22, pres: 1002, hum: 52 }, 'Northern Plains', 'Post-monsoon', W(28, 30, 15, 12, 8, 7), W(1.05, 0.95, 0.8, 0.9, 0.92, 1.1), R(45, 41, 52, 49, 48, 44, 33), { cyclone: 'LOW', cycloneTxt: 'No cyclone activity expected', heat: 'WATCH', heatD: 2.4, gust: 30, gustLvl: 'LOW', consensus: 74, agree: 5 }),
  L('mumbai', 'Mumbai Coastal', 'Maharashtra', 19.0760, 72.8777, { rain: 96, temp: 28, wind: 36, pres: 1006, hum: 90 }, 'Konkan West Coast', 'Post-monsoon', W(35, 20, 18, 8, 9, 10), W(1.08, 0.9, 0.95, 0.8, 0.88, 1.02), R(69, 55, 60, 66, 62, 58, 44), { cyclone: 'LOW', cycloneTxt: 'Weak offshore vortex; monitor', heat: 'NO', heatD: 0.2, gust: 44, gustLvl: 'MODERATE', consensus: 81, agree: 5 }),
  L('chennai', 'Chennai Coastal', 'Tamil Nadu', 13.0827, 80.2707, { rain: 132, temp: 29, wind: 28, pres: 1004, hum: 86 }, 'Coromandel East Coast', 'Northeast Monsoon', W(40, 25, 14, 10, 6, 5), W(1.12, 0.92, 0.83, 0.72, 0.78, 0.97), R(78, 62, 71, 68, 66, 66, 48), { cyclone: 'LOW', cycloneTxt: 'No significant cyclone risk in next 72h', heat: 'NO', heatD: 0.8, gust: 48, gustLvl: 'MODERATE', consensus: 88, agree: 5 }),
  L('kolkata', 'Kolkata Delta', 'West Bengal', 22.5726, 88.3639, { rain: 108, temp: 30, wind: 34, pres: 1003, hum: 88 }, 'Gangetic Delta', 'Post-monsoon', W(32, 28, 10, 14, 8, 8), W(1.1, 0.98, 0.78, 0.85, 0.82, 1.01), R(74, 60, 68, 63, 64, 62, 50), { cyclone: 'MODERATE', cycloneTxt: 'Depression possible over N. Bay in 72h', heat: 'NO', heatD: 0.5, gust: 52, gustLvl: 'MODERATE', consensus: 79, agree: 5 }),
  L('bengaluru', 'Bengaluru', 'Karnataka', 12.9716, 77.5946, { rain: 45, temp: 26, wind: 18, pres: 910, hum: 75 }, 'South Deccan Plateau', 'Post-monsoon', W(30, 25, 15, 12, 8, 10), W(1.04, 0.96, 0.85, 0.88, 0.9, 1.05), R(55, 45, 50, 52, 49, 46, 38), { cyclone: 'LOW', cycloneTxt: 'Inland plateau; no cyclone threat', heat: 'NO', heatD: -0.5, gust: 28, gustLvl: 'LOW', consensus: 85, agree: 5 }),
  L('hyderabad', 'Hyderabad', 'Telangana', 17.3850, 78.4867, { rain: 38, temp: 32, wind: 20, pres: 955, hum: 68 }, 'Central Deccan', 'Post-monsoon', W(32, 26, 14, 12, 8, 8), W(1.05, 0.94, 0.88, 0.85, 0.86, 1.02), R(58, 48, 54, 53, 50, 48, 40), { cyclone: 'LOW', cycloneTxt: 'Dry conditions prevailing', heat: 'NO', heatD: 0.9, gust: 26, gustLvl: 'LOW', consensus: 82, agree: 5 }),
  L('kochi', 'Kochi / Kerala Coast', 'Kerala', 9.9312, 76.2673, { rain: 165, temp: 27, wind: 31, pres: 1007, hum: 92 }, 'Malabar Coast', 'Post-monsoon', W(34, 18, 14, 10, 8, 16), W(1.15, 0.85, 0.9, 0.75, 0.8, 1.05), R(84, 66, 75, 72, 70, 63, 49), { cyclone: 'LOW', cycloneTxt: 'Arabian Sea coastal surveillance normal', heat: 'NO', heatD: -0.3, gust: 40, gustLvl: 'MODERATE', consensus: 90, agree: 5 }),
  L('shimla', 'Shimla Himalayas', 'Himachal Pradesh', 31.1048, 77.1734, { rain: 74, temp: 14, wind: 26, pres: 860, hum: 78 }, 'Western Himalayas', 'Post-monsoon', W(26, 16, 12, 10, 8, 28), W(1.2, 0.7, 0.9, 0.8, 0.82, 1.25), R(90, 70, 80, 77, 75, 58, 52), { cyclone: 'LOW', cycloneTxt: 'Not applicable (mountain terrain)', heat: 'NO', heatD: -1.2, gust: 38, gustLvl: 'MODERATE', consensus: 71, agree: 4 }),
  L('bhubaneswar', 'Bhubaneswar', 'Odisha', 20.2961, 85.8245, { rain: 88, temp: 31, wind: 24, pres: 1005, hum: 84 }, 'East Coastal Belt', 'Post-monsoon', W(36, 24, 12, 12, 8, 8), W(1.08, 0.95, 0.82, 0.84, 0.85, 1.0), R(68, 56, 62, 60, 59, 56, 45), { cyclone: 'WATCH', cycloneTxt: 'Watch low pressure zone in Bay of Bengal', heat: 'NO', heatD: 0.6, gust: 36, gustLvl: 'LOW', consensus: 78, agree: 5 }),
  L('ahmedabad', 'Ahmedabad', 'Gujarat', 23.0225, 72.5714, { rain: 15, temp: 35, wind: 21, pres: 1003, hum: 55 }, 'Semi-Arid Western', 'Post-monsoon', W(28, 32, 16, 10, 8, 6), W(1.06, 0.96, 0.85, 0.86, 0.88, 1.04), R(50, 44, 49, 48, 47, 45, 36), { cyclone: 'LOW', cycloneTxt: 'Stable weather over Gujarat plains', heat: 'WATCH', heatD: 1.8, gust: 28, gustLvl: 'LOW', consensus: 80, agree: 5 })
];

export const REGIONS = [
  { name: 'Delhi NCR', lat: 28.61, lon: 77.21, w: W(28, 30, 15, 12, 8, 7) },
  { name: 'Maharashtra', lat: 19.5, lon: 76.0, w: W(35, 20, 18, 8, 9, 10) },
  { name: 'Tamil Nadu', lat: 11.0, lon: 78.5, w: W(40, 25, 14, 10, 6, 5) },
  { name: 'West Bengal', lat: 22.5, lon: 88.0, w: W(32, 28, 10, 14, 8, 8) },
  { name: 'Karnataka', lat: 13.0, lon: 76.5, w: W(30, 25, 15, 12, 8, 10) },
  { name: 'Telangana', lat: 17.5, lon: 79.0, w: W(32, 26, 14, 12, 8, 8) },
  { name: 'Kerala', lat: 10.5, lon: 76.3, w: W(34, 18, 14, 10, 8, 16) },
  { name: 'Western Himalayas', lat: 31.5, lon: 77.0, w: W(26, 16, 12, 10, 8, 28) },
  { name: 'Odisha', lat: 20.5, lon: 85.5, w: W(36, 24, 12, 12, 8, 8) },
  { name: 'Gujarat', lat: 23.0, lon: 72.0, w: W(28, 32, 16, 10, 8, 6) }
];

export const dominant = w => Object.entries(w).sort((a, b) => b[1] - a[1])[0][0];

export const getForecast = (loc, p, h) => {
  const s = HSCALE[h] || 1.0;
  const b = loc.base[p] ?? 20;
  return Math.round((p === 'rain' ? b * s : b * (1 + (s - 1) * 0.03)) * 10) / 10;
};

export const getModelForecasts = (loc, p, h) => {
  const bl = getForecast(loc, p, h);
  const k = p === 'rain' ? 1.0 : 0.1;
  const o = { Blended: bl };
  MODELS.forEach(m => {
    const factor = loc.factors[m] ?? 1.0;
    o[m] = Math.round(bl * (1 + (factor - 1) * k) * 10) / 10;
  });
  return o;
};

export const getTimeSeries = (loc, p, h) => {
  const mf = getModelForecasts(loc, p, h);
  const step = h / 6;
  return Array.from({ length: 7 }, (_, i) => {
    const s = p === 'rain' ? Math.pow(i / 6, 1.6) : 1 + 0.04 * Math.sin(i * 1.1);
    const v = k => Math.round(mf[k] * s * 10) / 10;
    const row = {
      t: `${Math.round(i * step)}h`,
      Observed: i <= 2 ? Math.round(v('Blended') * (1 + 0.03 * Math.sin(i + 1)) * 10) / 10 : null
    };
    ['Blended', ...MODELS].forEach(k => {
      row[k] = v(k);
    });
    const u = mf.Blended * s * (0.04 + 0.14 * i / 6);
    row.band = [Math.round((row.Blended - u) * 10) / 10, Math.round((row.Blended + u) * 10) / 10];
    return row;
  });
};

export const riskLevel = v => (v >= IMD_THRESHOLD ? 'HIGH RISK' : v >= 30 ? 'MODERATE' : 'LOW');

export const CASES = [
  { t: 'Chennai Heavy Rainfall Case Study', d: 'Hybrid blend reduced peak-rain error vs best single model during northeast monsoon surge.', loc: 'chennai' },
  { t: 'Kochi Orographic Burst Case Study', d: 'AIFS neural weight rose dynamically with lead time in the Western Ghats orographic regime.', loc: 'kochi' },
  { t: 'Shimla Cloudburst Risk Case Study', d: 'Regime-aware weighting favored AIFS and IFS in complex Himalayan terrain.', loc: 'shimla' },
  { t: 'Kolkata & Bay of Bengal Depression', d: 'ECMWF-led blend with wider ensemble spread accurately flagged track uncertainty.', loc: 'kolkata' }
];
