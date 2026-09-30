import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  DashboardHeader,
  Sidebar,
  LocationSelector,
  QuickLocations,
  ForecastHorizon,
  WeatherParameterSelector,
  ExtremeAlert,
  ConsensusCard,
  RiskRow,
  Card,
  DemoTag
} from './components/Panels';
import { TrustMapCard } from './components/TrustMap';
import { WeatherMap } from './components/WeatherMap';
import {
  ModelWeightChart,
  ForecastTimeSeries,
  VerificationScorecard,
  ExplainabilityCard
} from './components/Charts';
import { LOCATIONS, CASES, MODELS, getForecast, getTimeSeries } from './data/mockData';
import {
  checkBackendStatus,
  fetchForecastData,
  fetchModelWeights,
  fetchVerificationScorecard,
  fetchAlerts
} from './services/api';

const FLOW = [
  'OBSERVATIONS & REANALYSIS',
  'MULTI-NWP INGESTION · ECMWF | GFS | ICON | JMA | GEM | AIFS',
  'ADAPTIVE AI WEIGHTING ENGINE',
  'ENSEMBLE UNCERTAINTY BLENDING',
  'OPERATIONAL FORECAST TRAJECTORY',
  'DECISION SUPPORT & EXTREME RISK DETECTION'
];

const save = (name, text, type) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
};

export default function App() {
  const [loc, setLoc] = useState(LOCATIONS[0]);
  const [h, setH] = useState(72);
  const [param, setParam] = useState('rain');
  const [layer, setLayer] = useState('Blended');
  const [how, setHow] = useState(false);
  const [now, setNow] = useState(new Date());
  const [page, setPage] = useState('Overview');
  const [theme, setTheme] = useState('dark');

  // Backend live state
  const [isBackendLive, setIsBackendLive] = useState(false);
  const [backendLatency, setBackendLatency] = useState(1.2);
  const [liveForecast, setLiveForecast] = useState(null);
  const [liveWeights, setLiveWeights] = useState(null);
  const [liveVerification, setLiveVerification] = useState(null);
  const [liveAlert, setLiveAlert] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Poll backend health status
  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      const res = await checkBackendStatus();
      if (mounted) {
        setIsBackendLive(res.online);
        if (res.latency_ms) setBackendLatency(res.latency_ms);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch forecast data and weights when loc, param, or h changes
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      const [fc, wt, sc, al] = await Promise.all([
        fetchForecastData(loc.id, param, h),
        fetchModelWeights(loc.id, param, h),
        fetchVerificationScorecard(param),
        fetchAlerts(loc.id)
      ]);
      if (mounted) {
        setLiveForecast(fc);
        setLiveWeights(wt);
        setLiveVerification(sc);
        setLiveAlert(al);
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, [loc.id, param, h]);

  const rain = liveForecast?.currentBlended ?? getForecast(loc, 'rain', h);
  const map = ht => (
    <WeatherMap loc={loc} param={param} h={h} layer={layer} setLayer={setLayer} height={ht} />
  );

  const csv = () => {
    const d = liveForecast?.timeSeries || getTimeSeries(loc, param, h);
    const headers = ['t', 'Blended', ...MODELS].join(',');
    const rows = d.map(r => [r.t, r.Blended, ...MODELS.map(m => r[m] ?? '')].join(','));
    save(
      `${loc.id}_${param}_${h}h_${isBackendLive ? 'LIVE' : 'DEMO'}.csv`,
      [headers, ...rows].join('\n'),
      'text/csv'
    );
  };

  const views = {
    Overview: (
      <>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6 [&>*]:h-full [&>div>div]:h-full">
          <div className="md:col-span-3 xl:col-span-2">
            <ExtremeAlert loc={loc} rain={rain} h={h} liveAlert={liveAlert} />
          </div>
          <ConsensusCard loc={loc} liveAlert={liveAlert} />
          <RiskRow loc={loc} />
        </div>
        <div className="grid gap-3 xl:grid-cols-5">
          <div className="xl:col-span-3">{map('h-[430px]')}</div>
          <div className="xl:col-span-2">
            <TrustMapCard onView={() => setPage('Model Weights')} />
          </div>
        </div>
        <div className="grid gap-3 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <ForecastTimeSeries loc={loc} param={param} h={h} liveForecast={liveForecast} />
          </div>
          <div className="xl:col-span-2">
            <ModelWeightChart loc={loc} liveWeights={liveWeights} />
          </div>
        </div>
        <div className="grid gap-3 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <VerificationScorecard loc={loc} liveVerification={liveVerification} />
          </div>
          <div className="xl:col-span-3">
            <ExplainabilityCard loc={loc} h={h} liveWeights={liveWeights} />
          </div>
        </div>
      </>
    ),
    'Forecast Map': (
      <>
        {map('h-[72vh]')}
        <TrustMapCard onView={() => setPage('Model Weights')} />
      </>
    ),
    'Time Series': (
      <>
        <ForecastTimeSeries loc={loc} param={param} h={h} liveForecast={liveForecast} />
        <ExtremeAlert loc={loc} rain={rain} h={h} liveAlert={liveAlert} />
      </>
    ),
    'Model Weights': (
      <div className="grid gap-3 xl:grid-cols-2">
        <ModelWeightChart loc={loc} liveWeights={liveWeights} />
        <TrustMapCard onView={() => setPage('Model Weights')} />
        <div className="xl:col-span-2">
          <ExplainabilityCard loc={loc} h={h} liveWeights={liveWeights} />
        </div>
      </div>
    ),
    Verification: (
      <>
        <VerificationScorecard loc={loc} liveVerification={liveVerification} />
        <ExplainabilityCard loc={loc} h={h} liveWeights={liveWeights} />
      </>
    ),
    'Case Studies': (
      <div className="grid gap-3 md:grid-cols-2">
        {CASES.map(c => (
          <Card key={c.t} c="p-4">
            <DemoTag />
            <div className="mt-2 font-semibold">{c.t}</div>
            <p className="text-xs text-slate-300">{c.d}</p>
            <button
              onClick={() => {
                const target = LOCATIONS.find(l => l.id === c.loc);
                if (target) setLoc(target);
                setPage('Overview');
              }}
              className="mt-3 rounded bg-[#1d6dff] px-3 py-1 text-xs"
            >
              Open in dashboard
            </button>
          </Card>
        ))}
      </div>
    ),
    Downloads: (
      <Card c="space-y-3 p-4">
        <DemoTag t={isBackendLive ? 'Live Parquet Export' : 'Prototype Data'} />
        <div className="text-sm">
          Export multi-model forecast data for {loc.name} (+{h}h).{' '}
          {isBackendLive
            ? 'Connected to operational SQLite/Parquet backend.'
            : 'Running in standalone heuristic demonstration mode.'}
        </div>
        <button onClick={csv} className="mr-2 rounded bg-[#1d6dff] px-3 py-1.5 text-xs">
          Time series trajectory (CSV)
        </button>
        <button
          onClick={() =>
            save(
              `${loc.id}_weights_${isBackendLive ? 'LIVE' : 'DEMO'}.json`,
              JSON.stringify(
                {
                  location: loc.name,
                  variable: param,
                  horizon: h,
                  weights: liveWeights?.weights || loc.weights,
                  dominantModel: liveWeights?.dominantModel || 'ECMWF',
                  backendConnected: isBackendLive
                },
                null,
                2
              ),
              'application/json'
            )
          }
          className="rounded bg-[#1d6dff] px-3 py-1.5 text-xs"
        >
          Model Weights + Explainability (JSON)
        </button>
      </Card>
    )
  };

  return (
    <div className="flex h-screen flex-col">
      <DashboardHeader
        now={now}
        onHow={() => setHow(true)}
        isBackendLive={isBackendLive}
        backendLatency={backendLatency}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar a={page} setA={setPage} theme={theme} setTheme={setTheme} />
        <main className="flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-3">
          <Card c="grid gap-4 p-3 xl:grid-cols-[1.35fr_1fr_1.25fr]">
            <div className="space-y-2">
              <LocationSelector loc={loc} setLoc={setLoc} />
              <QuickLocations loc={loc} setLoc={setLoc} />
            </div>
            <ForecastHorizon h={h} setH={setH} />
            <WeatherParameterSelector param={param} setParam={setParam} />
          </Card>
          {views[page]}
          <p className="pb-2 text-center text-[10px] text-slate-500">
            {isBackendLive
              ? 'Connected to Backend (PS 26081) · Data from Open-Meteo & Parquet Weather Store · Operational Evaluation Benchmark'
              : 'Smart India Hackathon 2026 (PS 26081) · Hybrid AI-NWP Blending System · Standalone Mode'}
          </p>
        </main>
      </div>
      {how && (
        <div
          className="fixed inset-0 z-[3000] grid place-items-center bg-black/70"
          onClick={() => setHow(false)}
        >
          <Card c="w-[500px] p-5">
            <div className="mb-3 flex justify-between">
              <b>How Hybrid AI-NWP Blending Works</b>
              <button onClick={() => setHow(false)}>
                <X size={16} />
              </button>
            </div>
            {FLOW.map((f, i) => (
              <div key={i}>
                <div
                  className={`rounded border p-2 text-center text-sm ${
                    i === 2
                      ? 'border-cyan-400 bg-[#1d6dff]/30 font-bold'
                      : 'border-[#172b4d] bg-[#071120]'
                  }`}
                >
                  {f}
                </div>
                {i < 5 && <div className="text-center text-cyan-400">↓</div>}
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
