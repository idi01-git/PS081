import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  DashboardHeader,
  Sidebar,
  OperationalCommandStrip,
  ExtremeAlert,
  ConsensusCard,
  HazardMatrixCard,
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
  fetchAlerts,
  getImmediateForecast,
  getImmediateWeights,
  getImmediateVerification,
  getImmediateAlerts
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

  // Backend live state & immediate 0ms data state
  const [isBackendLive, setIsBackendLive] = useState(false);
  const [backendLatency, setBackendLatency] = useState(1.2);
  const [liveForecast, setLiveForecast] = useState(() => getImmediateForecast(LOCATIONS[0], 'rain', 72));
  const [liveWeights, setLiveWeights] = useState(() => getImmediateWeights(LOCATIONS[0], 'rain', 72));
  const [liveVerification, setLiveVerification] = useState(() => getImmediateVerification('rain'));
  const [liveAlert, setLiveAlert] = useState(() => getImmediateAlerts(LOCATIONS[0], 'rain', 72));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
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

  // 1. Instant 0ms synchronous UI update whenever loc, param, or h changes
  useEffect(() => {
    setLiveForecast(getImmediateForecast(loc, param, h));
    setLiveWeights(getImmediateWeights(loc, param, h));
    setLiveVerification(getImmediateVerification(param));
    setLiveAlert(getImmediateAlerts(loc, param, h));
  }, [loc.id, param, h]);

  // 2. Debounced background live server sync (only if backend is active)
  useEffect(() => {
    if (!isBackendLive) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const [fc, wt, sc, al] = await Promise.all([
          fetchForecastData(loc.id, param, h, controller.signal),
          fetchModelWeights(loc.id, param, h, controller.signal),
          fetchVerificationScorecard(param, controller.signal),
          fetchAlerts(loc.id, controller.signal)
        ]);
        if (!controller.signal.aborted) {
          if (fc) setLiveForecast(fc);
          if (wt) setLiveWeights(wt);
          if (sc) setLiveVerification(sc);
          if (al) setLiveAlert(al);
        }
      } catch {
        // Aborted or temporary network delay; UI already has instant data
      }
    }, 120);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [loc.id, param, h, isBackendLive]);


  const forecastValue = liveForecast?.currentBlended ?? getForecast(loc, param, h);
  const map = ht => (
    <WeatherMap loc={loc} param={param} h={h} setH={setH} layer={layer} setLayer={setLayer} height={ht} />
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
        <div className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-12">
          <div className="md:col-span-2 xl:col-span-4 h-full">
            <ExtremeAlert loc={loc} value={forecastValue} param={param} h={h} liveAlert={liveAlert} />
          </div>
          <div className="xl:col-span-4 h-full">
            <ConsensusCard loc={loc} liveAlert={liveAlert} />
          </div>
          <div className="md:col-span-2 xl:col-span-4 h-full">
            <HazardMatrixCard loc={loc} />
          </div>
        </div>
        <div className="grid gap-3 xl:grid-cols-5 items-stretch">
          <div className="xl:col-span-3 h-full">{map('h-[420px]')}</div>
          <div className="xl:col-span-2 h-full">
            <TrustMapCard onView={() => setPage('Model Weights')} height="h-[420px]" h={h} setH={setH} />
          </div>
        </div>
        <div className="grid gap-3 xl:grid-cols-5 items-stretch">
          <div className="xl:col-span-3 h-full">
            <ForecastTimeSeries loc={loc} param={param} h={h} setH={setH} liveForecast={liveForecast} />
          </div>
          <div className="xl:col-span-2 h-full">
            <ModelWeightChart loc={loc} liveWeights={liveWeights} h={h} setH={setH} />
          </div>
        </div>
        <div className="grid gap-3 xl:grid-cols-5 items-stretch">
          <div className="xl:col-span-2 h-full">
            <VerificationScorecard loc={loc} liveVerification={liveVerification} h={h} setH={setH} />
          </div>
          <div className="xl:col-span-3 h-full">
            <ExplainabilityCard loc={loc} h={h} setH={setH} liveWeights={liveWeights} />
          </div>
        </div>
      </>
    ),
    'Forecast Map': (
      <div className="grid gap-3 xl:grid-cols-5 items-stretch">
        <div className="xl:col-span-3 h-full">{map('h-[560px]')}</div>
        <div className="xl:col-span-2 h-full">
          <TrustMapCard onView={() => setPage('Model Weights')} height="h-[560px]" h={h} setH={setH} />
        </div>
      </div>
    ),
    'Time Series': (
      <>
        <ForecastTimeSeries loc={loc} param={param} h={h} setH={setH} liveForecast={liveForecast} />
        <ExtremeAlert loc={loc} value={forecastValue} param={param} h={h} liveAlert={liveAlert} />
      </>
    ),
    'Model Weights': (
      <div className="grid gap-3 xl:grid-cols-2 items-stretch">
        <div className="h-full">
          <ModelWeightChart loc={loc} liveWeights={liveWeights} h={h} setH={setH} />
        </div>
        <div className="h-full">
          <TrustMapCard onView={() => setPage('Model Weights')} h={h} setH={setH} />
        </div>
        <div className="xl:col-span-2">
          <ExplainabilityCard loc={loc} h={h} setH={setH} liveWeights={liveWeights} />
        </div>
      </div>
    ),
    Verification: (
      <>
        <VerificationScorecard loc={loc} liveVerification={liveVerification} h={h} setH={setH} />
        <ExplainabilityCard loc={loc} h={h} setH={setH} liveWeights={liveWeights} />
      </>
    ),
    'Case Studies': (
      <div className="grid gap-3 md:grid-cols-2">
        {CASES.map(c => (
          <Card key={c.t} c="p-4">
            <DemoTag />
            <div className="mt-2 font-semibold text-slate-900 dark:text-white">{c.t}</div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">{c.d}</p>
            <button
              onClick={() => {
                const target = LOCATIONS.find(l => l.id === c.loc);
                if (target) setLoc(target);
                setPage('Overview');
              }}
              className="mt-3 inline-flex min-h-8 items-center rounded-md bg-[#1d6dff] px-3 text-xs !text-white font-semibold shadow-xs hover:bg-blue-600 transition-colors"
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
        <div className="text-sm text-slate-800 dark:text-slate-200">
          Export multi-model forecast data for <b className="text-slate-900 dark:text-white">{loc.name}</b> (+{h}h).{' '}
          {isBackendLive
            ? 'Connected to operational SQLite/Parquet backend.'
            : 'Running in standalone heuristic demonstration mode.'}
        </div>
        <button onClick={csv} className="mr-2 inline-flex min-h-9 items-center rounded-md bg-[#1d6dff] px-3 text-xs !text-white font-semibold shadow-xs hover:bg-blue-600 transition-colors">
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
          className="inline-flex min-h-9 items-center rounded-md bg-[#1d6dff] px-3 text-xs !text-white font-semibold shadow-xs hover:bg-blue-600 transition-colors"
        >
          Model Weights + Explainability (JSON)
        </button>
      </Card>
    )
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-100 dark:bg-[#050c18]">
      <DashboardHeader
        now={now}
        onHow={() => setHow(true)}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar a={page} setA={setPage} theme={theme} setTheme={setTheme} />
        <main className="min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-3">
          <OperationalCommandStrip
            loc={loc}
            setLoc={setLoc}
            h={h}
            setH={setH}
            param={param}
            setParam={setParam}
          />
          {views[page]}
          <p className="pb-2 text-center text-[10px] text-slate-600 dark:text-slate-400 font-medium">
            {isBackendLive
              ? 'Connected to Backend (PS 26081) · Data from Open-Meteo & Parquet Weather Store · Operational Evaluation Benchmark'
              : 'Smart India Hackathon 2026 (PS 26081) · Hybrid AI-NWP Blending System · Standalone Mode'}
          </p>
        </main>
      </div>
      {how && (
        <div
          className="fixed inset-0 z-[3000] grid place-items-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setHow(false)}
        >
          <div onClick={e => e.stopPropagation()}>
            <Card c="w-full max-w-[500px] p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-slate-200 dark:border-[#172b4d] pb-2">
                <b className="text-base text-slate-900 dark:text-white">How Hybrid AI-NWP Blending Works</b>
                <button onClick={() => setHow(false)} className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-1.5">
                {FLOW.map((f, i) => (
                  <div key={i}>
                    <div
                      className={`rounded-lg border p-2 text-center text-xs sm:text-sm transition-all ${
                        i === 2
                          ? 'border-blue-400 bg-blue-50 text-blue-900 font-bold dark:border-cyan-400 dark:bg-[#1d6dff]/30 dark:text-cyan-100'
                          : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-[#172b4d] dark:bg-[#071120] dark:text-slate-200'
                      }`}
                    >
                      {f}
                    </div>
                    {i < 5 && <div className="text-center font-bold text-blue-600 dark:text-cyan-400 py-0.5">↓</div>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
