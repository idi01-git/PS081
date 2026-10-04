import { Fragment, useState, useRef, useEffect } from 'react';
import { Home, Map as MapIcon, LineChart, Scale, BarChart3, ClipboardList, Download, CloudRain, Thermometer, Wind, Gauge, Search, ChevronRight, ChevronLeft, ChevronDown, SlidersHorizontal, AlertTriangle, CloudLightning, Workflow, Sun, Moon, Clock, MapPin, X } from 'lucide-react';
import { PARAMS, HORIZONS, LOCATIONS, IMD_THRESHOLD, riskLevel, MODELS, COLORS } from '../data/mockData';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
export const Card = ({ c = '', children }) => (
  <div className={`rounded-xl border border-slate-200 bg-white dark:border-[#172b4d] dark:bg-[#0a1628]/95 shadow-sm dark:shadow-[0_2px_10px_rgba(0,0,0,.22)] ${c}`}>
    {children}
  </div>
);
export const DemoTag = ({ t = 'Operational Benchmark' }) => (
  <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300 px-1.5 py-0.5 text-[10px] font-medium">
    {t}
  </Badge>
);
const Dot = ({ c = 'bg-emerald-500 dark:bg-green-400' }) => <span className={`inline-block h-2 w-2 rounded-full ${c}`} />;

export function ThemeToggle({ theme, setTheme, collapsed = false }) {
  const isDark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
      className={`group relative flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 dark:border-[#172b4d] dark:bg-[#071120] dark:text-slate-300 dark:hover:border-cyan-500/50 dark:hover:bg-[#10213c] dark:hover:text-white ${
        collapsed ? 'h-9 w-9 mx-auto' : 'w-full gap-2.5 px-3 py-2 text-xs font-medium'
      }`}
    >
      {isDark ? (
        <Sun size={15} className="text-amber-400 transition-transform duration-200 group-hover:rotate-45" />
      ) : (
        <Moon size={15} className="text-sky-600 transition-transform duration-200 group-hover:-rotate-12" />
      )}
      {!collapsed && (
        <>
          <span className="flex-1 text-left font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          <span className="rounded bg-slate-100 text-slate-600 border border-slate-200 dark:bg-[#0a1628] dark:text-slate-400 dark:border-[#172b4d] px-1.5 py-0.5 text-[10px] font-mono">
            {isDark ? 'Dark' : 'Light'}
          </span>
        </>
      )}
      {collapsed && (
        <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-[2000] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <div className="rounded-md border border-slate-200 bg-white text-slate-800 dark:border-[#172b4d] dark:bg-[#0a1628] dark:text-slate-200 px-2.5 py-1 text-xs font-medium shadow-xl whitespace-nowrap">
            {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </div>
        </div>
      )}
    </button>
  );
}
const LogoArt = {
  moes: <svg viewBox="0 0 40 40" className="h-full w-full"><circle cx="20" cy="20" r="19" fill="#0b3a6e" stroke="#38bdf8" strokeWidth="1.5" /><path d="M6 24q4-4 7 0t7 0 7 0 7 0M8 29q4-4 6 0t6 0 6 0 6 0" fill="none" stroke="#7dd3fc" strokeWidth="1.6" /><path d="M10 20l6-9 4 6 3-4 7 7z" fill="#e2f1ff" /><circle cx="28" cy="10" r="3" fill="#fbbf24" /></svg>,
  imd: <svg viewBox="0 0 40 40" className="h-full w-full"><circle cx="20" cy="20" r="19" fill="#0a4a8a" stroke="#22d3ee" strokeWidth="1.5" /><circle cx="20" cy="20" r="10" fill="#1d6dff" stroke="#e2f1ff" strokeWidth="1" /><ellipse cx="20" cy="20" rx="4.5" ry="10" fill="none" stroke="#e2f1ff" strokeWidth="1" /><path d="M10 20h20M12 14h16M12 26h16" stroke="#e2f1ff" strokeWidth="1" /><path d="M20 3v4M6 9l3 3M34 9l-3 3" stroke="#fbbf24" strokeWidth="1.6" /></svg>
};
// Drop official logos at public/logos/moes.png and public/logos/imd.png to replace these placeholder badges.
export function Logo({ kind }) {
  const [bad, setBad] = useState(false);
  const alt = kind === 'moes' ? 'Ministry of Earth Sciences' : 'India Meteorological Department';
  const I = (src, c) => (
    <img
      src={src}
      alt={alt}
      onError={() => setBad(true)}
      decoding="async"
      className={`h-full w-full object-contain ${c}`}
    />
  );
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center">
      {bad ? (
        LogoArt[kind]
      ) : kind === 'moes' ? (
        <>
          {I('/logos/moes-light.png', 'logo-dark-only')}
          {I('/logos/moes.png', 'logo-light-only')}
        </>
      ) : (
        I('/logos/imd.png', '')
      )}
    </div>
  );
}

export function DashboardHeader({ now, onHow }) {
  return (
    <header className="relative z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 dark:border-[#172b4d] dark:bg-[#050d1a]/95 px-5 py-2.5 backdrop-blur-md shadow-xs dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)] select-none">
      {/* Left: Institutional Identity */}
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-[#172b4d] dark:bg-[#071120] p-1 shadow-xs">
            <Logo kind="moes" />
          </div>
          <div className="leading-tight">
            <div className="text-[12px] font-bold tracking-tight text-slate-900 dark:text-slate-100">Ministry of Earth Sciences</div>
            <div className="text-[10px] font-medium tracking-wide text-slate-600 dark:text-slate-400">Government of India</div>
          </div>
        </div>

        <div className="hidden h-7 w-px bg-slate-200 dark:bg-slate-700/60 sm:block" />

        <div className="hidden sm:flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-[#172b4d] dark:bg-[#071120] p-1 shadow-xs">
            <Logo kind="imd" />
          </div>
          <div className="leading-tight">
            <div className="text-[12px] font-bold tracking-tight text-slate-900 dark:text-slate-100">India Meteorological Department</div>
            <div className="text-[10px] font-semibold tracking-wide text-blue-700 dark:text-cyan-400">National Weather Service</div>
          </div>
        </div>
      </div>

      {/* Center: System Title & Mission Classification */}
      <div className="hidden md:flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-sm lg:text-[16px] font-bold tracking-wider text-slate-900 dark:text-white uppercase drop-shadow-xs">
          HYBRID AI–NWP FORECAST BLENDING SYSTEM
        </h1>
        <div className="mt-0.5 flex items-center justify-center gap-2 text-[10px] font-semibold tracking-widest text-blue-700 dark:text-cyan-400 uppercase">
          <span>Disaster Management</span>
          <span className="text-slate-400 dark:text-slate-500 font-bold">·</span>
          <span>Operational Forecasting</span>
          <span className="text-slate-400 dark:text-slate-500 font-bold">·</span>
          <span>MoES / NCMRWF</span>
        </div>
      </div>

      {/* Right: Actions & Live Operational Telemetry */}
      <div className="flex items-center gap-3">
        <button
          onClick={onHow}
          className="group flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-xs transition-all hover:border-blue-300 hover:bg-blue-100 active:scale-95 dark:border-cyan-500/30 dark:bg-cyan-950/25 dark:text-cyan-300 dark:hover:border-cyan-400 dark:hover:bg-cyan-500/15 dark:hover:text-cyan-100"
          title="How Hybrid AI-NWP Blending Works"
        >
          <Workflow size={13} className="text-blue-600 dark:text-cyan-400 transition-transform duration-200 group-hover:rotate-45" />
          <span>How it works</span>
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700/60" />

        {/* Live Operational Clock Widget */}
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 shadow-inner dark:border-[#172b4d] dark:bg-[#071120]">
          <Clock size={14} className="text-blue-600 dark:text-cyan-400 shrink-0" />
          <div className="font-mono leading-tight text-left">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 dark:text-slate-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
              <span>{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST</span>
            </div>
            <div className="text-[9px] font-medium tracking-wider text-slate-600 dark:text-slate-400 uppercase">
              {now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

const NAV_GROUPS = [
  {
    category: 'MONITORING',
    items: [
      { id: 'Overview', label: 'Overview', icon: Home, hint: 'Operational situation & hazards' },
      { id: 'Forecast Map', label: 'Forecast Map', icon: MapIcon, hint: 'Interactive raster weather heatmap' },
      { id: 'Time Series', label: 'Time Series', icon: LineChart, hint: 'Multi-model ensemble trajectories' }
    ]
  },
  {
    category: 'ANALYTICS',
    items: [
      { id: 'Model Weights', label: 'Model Weights', icon: Scale, hint: 'Adaptive AI model weighting engine' },
      { id: 'Verification', label: 'Verification', icon: BarChart3, hint: 'Ground-truth scorecard & metrics' }
    ]
  },
  {
    category: 'RESOURCES',
    items: [
      { id: 'Case Studies', label: 'Case Studies', icon: ClipboardList, hint: 'Extreme weather case benchmarks' },
      { id: 'Downloads', label: 'Downloads', icon: Download, hint: 'Parquet, CSV & JSON data exports' }
    ]
  }
];

export function Sidebar({ a, setA, theme, setTheme }) {
  const [open, setOpen] = useState(true);

  return (
    <aside
      className={`relative z-20 flex h-full shrink-0 flex-col border-r border-slate-200 bg-slate-50/90 dark:border-[#172b4d] dark:bg-[#050d1a] transition-[width] duration-200 ease-in-out select-none ${
        open ? 'w-56 overflow-y-auto' : 'w-16 overflow-visible'
      }`}
    >
      {/* Top Header: Collapse / Expand Control */}
      {open ? (
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#172b4d]/60 px-3.5 py-2.5">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Navigation</span>
          <button
            onClick={() => setOpen(false)}
            title="Collapse sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#10213c] dark:hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      ) : (
        <div className="relative group py-2.5 flex justify-center border-b border-slate-200 dark:border-[#172b4d]/60">
          <button
            onClick={() => setOpen(true)}
            title="Expand sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 dark:border-[#172b4d] dark:bg-[#071120] dark:text-slate-400 dark:hover:border-cyan-500/50 dark:hover:bg-[#10213c] dark:hover:text-white"
          >
            <ChevronRight size={16} />
          </button>
          <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-[2000] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <div className="rounded-md border border-slate-200 bg-white text-slate-800 dark:border-[#172b4d] dark:bg-[#0a1628] dark:text-slate-200 px-2.5 py-1 text-xs font-medium shadow-xl whitespace-nowrap">
              Expand sidebar
            </div>
          </div>
        </div>
      )}

      {/* Nav Menu Items */}
      <nav className={`flex-1 py-2 ${open ? 'space-y-4 px-2' : 'space-y-1 px-1'}`}>
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={group.category}>
            {open ? (
              <div className="px-3 pb-1 text-[10px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase">
                {group.category}
              </div>
            ) : groupIdx > 0 ? (
              <div className="my-2 mx-auto w-6 border-t border-slate-200 dark:border-[#172b4d]" />
            ) : null}

            <div className={open ? 'space-y-1' : 'space-y-1.5'}>
              {group.items.map(item => {
                const isActive = a === item.id;
                const Icon = item.icon;

                if (open) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => setA(item.id)}
                      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-[#1d6dff] !text-white shadow-sm font-semibold'
                          : 'text-slate-800 hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-[#10213c] dark:hover:text-white'
                      }`}
                    >
                      <Icon
                        size={17}
                        className={`shrink-0 transition-colors duration-150 ${
                          isActive ? '!text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400'
                        }`}
                      />
                      <span className={`truncate ${isActive ? '!text-white' : ''}`}>{item.label}</span>
                    </button>
                  );
                }

                // Collapsed item with centered icon and floating tooltip
                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => setA(item.id)}
                      className={`relative flex h-10 w-10 mx-auto items-center justify-center rounded-lg transition-all duration-150 ${
                        isActive
                          ? 'bg-[#1d6dff] !text-white shadow-sm ring-1 ring-blue-400/50'
                          : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#10213c] dark:hover:text-white'
                      }`}
                    >
                      <Icon
                        size={18}
                        className={`transition-all duration-150 group-hover:scale-110 ${
                          isActive ? '!text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-300'
                        }`}
                      />
                      {isActive && (
                        <span className="absolute -left-2 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                      )}
                    </button>

                    {/* Floating Tooltip */}
                    <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-[2500] invisible opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1">
                      <div className="rounded-lg border border-slate-200 bg-white text-slate-900 dark:border-cyan-500/30 dark:bg-[#0a1628] dark:text-white px-3 py-1.5 shadow-xl">
                        <div className="text-xs font-semibold whitespace-nowrap">{item.label}</div>
                        {item.hint && <div className="text-[10px] text-slate-600 dark:text-slate-400 whitespace-nowrap">{item.hint}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Operational Engine Status */}
      {open ? (
        <div className="mx-2.5 mb-2 rounded-lg border border-slate-200 bg-slate-100/90 dark:border-[#172b4d] dark:bg-[#071120] p-2.5">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-900 dark:text-slate-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
            <span>Operational Mode</span>
          </div>
          <div className="mt-0.5 text-[9px] text-slate-600 dark:text-slate-400 font-medium">Multi-Model AI Blending Engine</div>
        </div>
      ) : (
        <div className="relative group my-2 flex justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 dark:border-[#172b4d] dark:bg-[#071120] cursor-default">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
          </div>
          <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-[2000] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <div className="rounded-md border border-slate-200 bg-white text-slate-800 dark:border-[#172b4d] dark:bg-[#0a1628] dark:text-slate-200 px-2.5 py-1 text-xs font-medium shadow-xl whitespace-nowrap">
              Operational · Live AI Blending
            </div>
          </div>
        </div>
      )}

      {/* Theme Toggle */}
      <div className={open ? 'px-2.5 mb-2.5' : 'mb-2'}>
        <ThemeToggle theme={theme} setTheme={setTheme} collapsed={!open} />
      </div>

      {/* User Profile */}
      {open ? (
        <div className="flex items-center gap-2.5 border-t border-slate-200 dark:border-[#172b4d] p-3 bg-slate-100/60 dark:bg-[#050d1a]">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-blue-700 to-cyan-600 text-xs font-bold !text-white shadow-xs ring-1 ring-cyan-500/30">
            U
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">Forecaster Desk</div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Duty Specialist</div>
          </div>
        </div>
      ) : (
        <div className="relative group flex items-center justify-center border-t border-slate-200 dark:border-[#172b4d] py-3 bg-slate-100/60 dark:bg-[#050d1a]">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-blue-700 to-cyan-600 text-xs font-bold !text-white shadow-xs ring-1 ring-cyan-500/30 cursor-pointer">
            U
          </div>
          <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-[2000] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <div className="rounded-md border border-slate-200 bg-white text-slate-800 dark:border-[#172b4d] dark:bg-[#0a1628] dark:text-slate-200 px-2.5 py-1 text-xs font-medium shadow-xl whitespace-nowrap">
              Duty Specialist · Forecaster Desk
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
export function OperationalCommandStrip({ loc, setLoc, h, setH, param, setParam }) {
  const [openStationMenu, setOpenStationMenu] = useState(false);
  const [q, setQ] = useState('');
  const menuRef = useRef(null);

  // Close station dropdown on click outside or escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenStationMenu(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setOpenStationMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const filteredLocations = q.trim()
    ? LOCATIONS.filter(l => (l.name + ' ' + l.state + ' ' + (l.regime || '')).toLowerCase().includes(q.toLowerCase()))
    : LOCATIONS;

  const currentHorizonIdx = Math.max(0, HORIZONS.indexOf(h));

  return (
    <Card c="p-3 relative z-30">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.15fr_1.1fr_1.2fr] gap-3 items-stretch">
        
        {/* Module 1: Observatory Station */}
        <div ref={menuRef} className="relative flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 dark:border-[#172b4d] dark:bg-[#071120]/80 p-2.5 transition-all hover:border-blue-400 dark:hover:border-cyan-500/40">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1.5">
              <MapPin size={13} className="text-blue-600 dark:text-cyan-400" /> Observatory Station
            </span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-cyan-950/60 dark:border-cyan-500/40 dark:text-cyan-300 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
              {loc.state}
            </Badge>
          </div>

          {/* Station Trigger Button */}
          <button
            type="button"
            onClick={() => setOpenStationMenu(!openStationMenu)}
            className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-[#172b4d] dark:bg-[#050d1a] dark:hover:bg-[#0c1a30] px-3 py-1.5 text-left transition-all hover:border-blue-400 dark:hover:border-cyan-400 group shadow-inner cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] shrink-0 animate-pulse" />
              <div className="truncate">
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-cyan-200 transition-colors">
                  {loc.name}
                </span>
                <span className="ml-1.5 text-[10px] text-slate-600 dark:text-slate-400 font-medium">· {loc.state}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200 dark:bg-[#071120] dark:text-cyan-300 dark:border-[#172b4d] text-[9px] font-semibold">
                {loc.regime || 'Climatic Zone'}
              </Badge>
              <ChevronDown
                size={14}
                className={`text-slate-600 dark:text-slate-400 transition-transform duration-200 ${
                  openStationMenu ? 'rotate-180 text-blue-600 dark:text-cyan-400' : 'group-hover:text-slate-900 dark:group-hover:text-white'
                }`}
              />
            </div>
          </button>

          {/* Interactive Station Popover Menu */}
          {openStationMenu && (
            <div
              onClick={e => e.stopPropagation()}
              className="absolute left-0 right-0 top-full mt-2 z-[2500] min-w-[320px] rounded-xl border border-slate-200 bg-white dark:border-cyan-500/40 dark:bg-[#0a1628] p-2.5 shadow-2xl backdrop-blur-2xl"
            >
              {/* Search filter within dropdown */}
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 dark:border-[#172b4d] dark:bg-[#050d1a] px-2.5 py-1.5 focus-within:border-blue-500 dark:focus-within:border-cyan-400">
                <Search size={13} className="text-slate-500 dark:text-slate-400 shrink-0" />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search 10 monitored stations..."
                  autoFocus
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none font-medium"
                />
                {q && (
                  <button onClick={() => setQ('')} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Station List with State Badges */}
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {filteredLocations.map(l => {
                  const isSelected = l.id === loc.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setLoc(l);
                        setOpenStationMenu(false);
                        setQ('');
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1d6dff] !text-white shadow-sm font-semibold'
                          : 'text-slate-800 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-[#10213c] dark:hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`font-bold truncate ${isSelected ? '!text-white' : 'text-slate-900 dark:text-slate-100'}`}>{l.name}</span>
                        </div>
                        <div className={`text-[10px] truncate font-medium ${isSelected ? '!text-blue-100' : 'text-blue-700 dark:text-cyan-400'}`}>
                          {l.regime}
                        </div>
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        <Badge
                          variant={isSelected ? 'default' : 'outline'}
                          className={`text-[10px] font-medium px-2 py-0.5 ${
                            isSelected
                              ? 'bg-blue-600 border-blue-400 !text-white'
                              : 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700/60 dark:text-slate-200'
                          }`}
                        >
                          {l.state}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
                {filteredLocations.length === 0 && (
                  <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    No stations found matching "{q}"
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-1 text-[9px] text-slate-600 dark:text-slate-400 font-medium">
            <span>National Met. Network</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
            </span>
          </div>
        </div>

        {/* Module 2: Forecast Horizon */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 dark:border-[#172b4d] dark:bg-[#071120]/80 p-2.5 transition-all hover:border-blue-400 dark:hover:border-cyan-500/40">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1.5">
              <Clock size={13} className="text-blue-600 dark:text-cyan-400" /> Forecast Horizon
            </span>
            <span className="font-mono text-[10px] font-semibold text-blue-700 dark:text-cyan-400">
              +{h}h Lead ({h === 6 ? 'Nowcast' : h === 12 ? 'Short Range' : h === 24 ? 'Day 1' : h === 48 ? 'Day 2' : h === 72 ? 'Day 3' : 'Day 5 Outlook'})
            </span>
          </div>

          {/* Shadcn Tabs Toggle */}
          <Tabs value={String(h)} onValueChange={v => setH(Number(v))} className="w-full">
            <TabsList className="grid grid-cols-6 w-full h-11 p-0 overflow-hidden rounded-lg border border-slate-200 dark:border-[#172b4d] bg-white dark:bg-[#071120] divide-x divide-slate-200 dark:divide-[#172b4d] shadow-xs">
              {HORIZONS.map(x => {
                const isAct = h === x;
                const sublabel = x === 6 ? 'Nowcast' : x === 12 ? 'Short' : x === 24 ? 'Day 1' : x === 48 ? 'Day 2' : x === 72 ? 'Day 3' : 'Day 5';
                return (
                  <TabsTrigger
                    key={x}
                    value={String(x)}
                    className={`flex flex-col items-center justify-center h-full w-full p-0 rounded-none transition-colors font-medium shadow-none data-[state=active]:shadow-none data-[state=active]:bg-[#1d6dff] data-[state=active]:!text-white ${
                      isAct
                        ? 'bg-[#1d6dff] !text-white'
                        : 'bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-900 dark:bg-[#071120] dark:text-slate-200 dark:hover:bg-[#0c1a30] dark:hover:text-white'
                    }`}
                  >
                    <span className={`text-[11px] font-bold leading-tight ${isAct ? '!text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                      +{x}h
                    </span>
                    <span className={`text-[9px] font-normal leading-none mt-0.5 ${isAct ? '!text-blue-100' : 'text-slate-600 dark:text-slate-400'}`}>
                      {sublabel}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          <div className="flex items-center justify-between px-1 text-[9px] text-slate-600 dark:text-slate-400 font-medium">
            <span>Deterministic + Ensemble Spread</span>
            <span className="font-mono text-blue-700 dark:text-cyan-300 font-semibold">Valid: T+{h}h UTC</span>
          </div>
        </div>

        {/* Module 3: Meteorological Variable */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 dark:border-[#172b4d] dark:bg-[#071120]/80 p-2.5 transition-all hover:border-blue-400 dark:hover:border-cyan-500/40">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1.5">
              <SlidersHorizontal size={13} className="text-blue-600 dark:text-cyan-400" /> Weather Variable
            </span>
            <span className="font-mono text-[10px] font-semibold text-blue-700 dark:text-cyan-400">
              {PARAMS[param].label} ({PARAMS[param].unit})
            </span>
          </div>

          {/* Shadcn Tabs Toggle */}
          <Tabs value={param} onValueChange={setParam} className="w-full">
            <TabsList className="grid grid-cols-4 w-full h-11 p-0 overflow-hidden rounded-lg border border-slate-200 dark:border-[#172b4d] bg-white dark:bg-[#071120] divide-x divide-slate-200 dark:divide-[#172b4d] shadow-xs">
              {Object.entries(PARAMS).map(([k, cfg]) => {
                const isAct = param === k;
                const Icon = PI[k];
                return (
                  <TabsTrigger
                    key={k}
                    value={k}
                    className={`flex h-full w-full items-center justify-center gap-1.5 p-0 px-2 rounded-none transition-colors font-medium shadow-none data-[state=active]:shadow-none data-[state=active]:bg-[#1d6dff] data-[state=active]:!text-white ${
                      isAct
                        ? 'bg-[#1d6dff] !text-white'
                        : 'bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-900 dark:bg-[#071120] dark:text-slate-200 dark:hover:bg-[#0c1a30] dark:hover:text-white'
                    }`}
                  >
                    <Icon size={14} className={`shrink-0 ${isAct ? '!text-white' : 'text-blue-600 dark:text-cyan-400'}`} />
                    <div className="text-left leading-tight truncate">
                      <span className={`text-[11px] font-bold block truncate ${isAct ? '!text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                        {cfg.label}
                      </span>
                      <span className={`text-[9px] font-mono ${isAct ? '!text-blue-100' : 'text-slate-600 dark:text-slate-400'}`}>
                        ({cfg.unit})
                      </span>
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          <div className="flex items-center justify-between px-1 text-[9px] text-slate-600 dark:text-slate-400 font-medium">
            <span>Operational IMD Dataset</span>
            <span className="font-mono text-blue-700 dark:text-cyan-300 font-semibold">Unit: {PARAMS[param].unit}</span>
          </div>
        </div>

      </div>
    </Card>
  );
}

export function LocationSelector({ loc, setLoc }) {
  const [q, setQ] = useState('');
  const hits = q ? LOCATIONS.filter(l => (l.name + l.state).toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <div className="relative">
      <div className="mb-1 text-[11px] text-slate-400">Location</div>
      <div className="flex items-center gap-2 rounded-md border border-[#172b4d] bg-[#071120] px-3 py-1.5 text-sm">
        <Search size={14} className="text-slate-500" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={`${loc.name}, ${loc.state}`} className="w-52 bg-transparent outline-none placeholder:text-slate-200" />
      </div>
      {hits.length > 0 && (
        <div className="absolute z-[2000] mt-1 w-full rounded border border-[#172b4d] bg-[#0a1628]">
          {hits.map(l => (
            <button key={l.id} onClick={() => { setLoc(l); setQ(''); }} className="block w-full px-3 py-1.5 text-left text-sm hover:bg-[#1d6dff]/30">
              {l.name}, {l.state}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const QuickLocations = ({ loc, setLoc }) => (
  <div className="flex flex-wrap gap-2 self-end">
    {LOCATIONS.map(l => (
      <button key={l.id} onClick={() => setLoc(l)} className={`rounded-md border px-3 py-1.5 text-xs ${l.id === loc.id ? 'border-blue-400 bg-[#1d6dff] text-white shadow-[0_0_12px_#3b82f6aa]' : 'border-[#172b4d] text-slate-300 hover:border-blue-500'}`}>
        {l.name}
      </button>
    ))}
  </div>
);

export const ForecastHorizon = ({ h, setH }) => (
  <div>
    <div className="mb-1 text-[11px] text-slate-400">Forecast Horizon</div>
    <div className="flex gap-1.5">
      {HORIZONS.map(x => (
        <button key={x} onClick={() => setH(x)} className={`rounded-md border px-3 py-1.5 text-xs ${x === h ? 'border-blue-400 bg-[#1d6dff] text-white shadow-[0_0_12px_#3b82f6aa]' : 'border-[#172b4d] text-slate-300 hover:border-blue-500'}`}>
          +{x}h
        </button>
      ))}
    </div>
  </div>
);

const PI = { rain: CloudRain, temp: Thermometer, wind: Wind, pres: Gauge };
function WeatherParameterCard({ k, sel, onClick }) {
  const I = PI[k];
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-left text-xs ${sel ? 'border-cyan-400 bg-[#1d6dff]/20 shadow-[0_0_12px_#22d3ee55]' : 'border-[#172b4d] hover:border-blue-500'}`}>
      <I size={18} className={sel ? 'text-cyan-300' : 'text-slate-400'} />
      <span>{PARAMS[k].label}<br /><span className="text-slate-400">({PARAMS[k].unit})</span></span>
    </button>
  );
}
export const WeatherParameterSelector = ({ param, setParam }) => (
  <div>
    <div className="mb-1 text-[11px] text-slate-400">Weather Parameter</div>
    <div className="flex gap-1.5">
      {Object.keys(PARAMS).map(k => (
        <WeatherParameterCard key={k} k={k} sel={k === param} onClick={() => setParam(k)} />
      ))}
    </div>
  </div>
);

export function ExtremeAlert({ loc, value, param = 'rain', h = 24, liveAlert }) {
  const P = PARAMS[param] || PARAMS.rain;
  const displayVal = Number(value !== undefined ? value : loc?.base?.[param] ?? 20);

  // 1. Calculate Threat Index & Severity Level based on scientific IMD standards
  let thresholdVal = 64.5;
  let pctOfThreshold = 0;
  let severity = 'NOMINAL'; // 'NOMINAL' | 'WATCH' | 'WARNING'
  let headline = '';
  let guidanceText = '';

  if (param === 'rain') {
    thresholdVal = 64.5; // IMD Heavy Rain Threshold (>64.5mm/24h)
    pctOfThreshold = Math.min(100, Math.round((displayVal / thresholdVal) * 100));
    if (displayVal >= 115.5 || pctOfThreshold >= 95) {
      severity = 'WARNING';
      headline = `Severe Deluge / Torrential Flood Alert (${displayVal} mm)`;
      guidanceText = `Precipitation exceeds IMD Very Heavy Rain threshold (64.5mm). Immediate regional flood response alert triggered for ${loc.name}.`;
    } else if (displayVal >= 35.5 || pctOfThreshold >= 55) {
      severity = 'WATCH';
      headline = `Moderate Precipitation Advisory (${displayVal} mm)`;
      guidanceText = `Significant convective rainbands approaching ${loc.name}. Monitor stormwater drainage channels and Doppler radar echoes.`;
    } else {
      severity = 'NOMINAL';
      headline = `Precipitation Nominal (${displayVal} mm)`;
      guidanceText = `Rainfall accumulation within seasonal baseline limits for ${loc.zone}.`;
    }
  } else if (param === 'temp') {
    thresholdVal = 40.0; // IMD Heatwave Threshold (>40°C in plains)
    // Anomaly baseline: for heat, 28°C is normal baseline, 43°C+ is extreme heatwave
    pctOfThreshold = displayVal <= 28 ? 12 : Math.min(100, Math.round(((displayVal - 28) / (43 - 28)) * 100));
    if (displayVal >= 42.0 || pctOfThreshold >= 85) {
      severity = 'WARNING';
      headline = `Severe Heatwave Warning (${displayVal}°C)`;
      guidanceText = `Extreme boundary-layer thermal anomaly at ${loc.name}. IMD Red alert conditions: limit daytime outdoor operations.`;
    } else if (displayVal >= 37.5 || pctOfThreshold >= 55) {
      severity = 'WATCH';
      headline = `Thermal Anomaly / Heat Watch (${displayVal}°C)`;
      guidanceText = `Elevated daytime temperatures at ${loc.name}. Hydration and agricultural thermal advisories active.`;
    } else {
      severity = 'NOMINAL';
      headline = `Temperatures Seasonal Normal (${displayVal}°C)`;
      guidanceText = `Surface thermal profile well within 30-year climatological normal for ${loc.zone}.`;
    }
  } else if (param === 'wind') {
    thresholdVal = 50.0; // IMD Strong Breeze / Gale Threshold (>50 km/h)
    pctOfThreshold = Math.min(100, Math.round((displayVal / thresholdVal) * 100));
    if (displayVal >= 55.0 || pctOfThreshold >= 85) {
      severity = 'WARNING';
      headline = `Gale-Force Wind Warning (${displayVal} km/h)`;
      guidanceText = `Squally maritime surface winds expected at ${loc.name}. Advise coastal marine suspension and secure loose infrastructure.`;
    } else if (displayVal >= 35.0 || pctOfThreshold >= 55) {
      severity = 'WATCH';
      headline = `Elevated Wind Shear Advisory (${displayVal} km/h)`;
      guidanceText = `Moderate boundary-layer wind gusts across ${loc.name}. Monitor aviation approach and port container sectors.`;
    } else {
      severity = 'NOMINAL';
      headline = `Wind Velocities Nominal (${displayVal} km/h)`;
      guidanceText = `Surface wind vector within normal operational bounds for ${loc.zone}.`;
    }
  } else if (param === 'pres') {
    const normalPres = loc.normalPres || 1008.0;
    const drop = Math.max(0, normalPres - displayVal);
    thresholdVal = Math.round(normalPres);
    // Pressure deficit: 10 hPa drop = 100% cyclone threat
    pctOfThreshold = Math.min(100, Math.round((drop / 10.0) * 100));
    if (drop >= 8.0 || pctOfThreshold >= 80) {
      severity = 'WARNING';
      headline = `Deep Cyclonic Pressure Deficit (${displayVal} hPa)`;
      guidanceText = `Barometric pressure dropped ${drop.toFixed(1)} hPa below station normal (${normalPres} hPa). Tropical depression/cyclone circulation active!`;
    } else if (drop >= 4.0 || pctOfThreshold >= 45) {
      severity = 'WATCH';
      headline = `Synoptic Low Pressure Watch (${displayVal} hPa)`;
      guidanceText = `Barometric pressure is ${drop.toFixed(1)} hPa below normal. Low pressure trough developing over ${loc.name}.`;
    } else {
      severity = 'NOMINAL';
      headline = `Barometric Field Stable (${displayVal} hPa)`;
      guidanceText = `Surface pressure normal for ${loc.name} elevation (${loc.elevation || 10}m ASL).`;
    }
  }

  // Override with server alert if server sends an explicit live alert
  if (liveAlert?.isLive && liveAlert?.alert_level && liveAlert.alert_level !== 'NONE') {
    severity = liveAlert.alert_level === 'CRITICAL' || liveAlert.alert_level === 'WARNING' ? 'WARNING' : 'WATCH';
    if (liveAlert.guidance_note) headline = liveAlert.guidance_note;
  }

  // Guaranteed synchronization: Threat Index >= 80% is ALWAYS WARNING/CRITICAL, >= 50% is ALWAYS WATCH
  const isCritical = severity === 'WARNING' || pctOfThreshold >= 80;
  const isWatch = !isCritical && (severity === 'WATCH' || pctOfThreshold >= 50);
  const badgeLabel = isCritical ? 'WARNING' : isWatch ? 'WATCH' : 'NOMINAL';

  return (
    <Card c={`h-full flex flex-col justify-between p-4 transition-all duration-300 ${
      isCritical
        ? 'border-red-400 bg-gradient-to-br from-red-50 via-rose-50/70 to-white dark:border-red-500/70 dark:bg-gradient-to-br dark:from-[#3a0a10] dark:via-[#1f0508] dark:to-[#0a1628] shadow-md dark:shadow-[0_0_30px_rgba(239,68,68,0.3)]'
        : isWatch
          ? 'border-amber-400 bg-gradient-to-br from-amber-50 via-yellow-50/70 to-white dark:border-amber-500/60 dark:bg-gradient-to-br dark:from-[#2d1606] dark:via-[#180c03] dark:to-[#0a1628] shadow-sm dark:shadow-[0_0_24px_rgba(245,158,11,0.2)]'
          : 'border-slate-200 bg-gradient-to-br from-emerald-50/40 via-slate-50/30 to-white dark:border-emerald-500/40 dark:bg-gradient-to-br dark:from-[#042014] dark:via-[#05140d] dark:to-[#0a1628] shadow-xs'
    }`}>
      {/* Top Category Ribbon */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#172b4d]/70">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isCritical ? 'bg-red-400' : isWatch ? 'bg-amber-400' : 'bg-emerald-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isCritical ? 'bg-red-500' : isWatch ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-600 dark:text-slate-400">
            IMD Operational Hazard Watch
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-medium">+{h}h Lead</span>
          <Badge
            variant={isCritical ? 'destructive' : 'outline'}
            className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 ${
              isCritical
                ? 'bg-red-600 !text-white border-red-500 shadow-xs'
                : isWatch
                  ? 'bg-amber-500 text-slate-900 border-amber-400 font-bold dark:bg-amber-500/30 dark:text-amber-200 dark:border-amber-500/60'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/50'
            }`}
          >
            {badgeLabel}
          </Badge>
        </div>
      </div>

      {/* Main Headline & Synoptic Guidance */}
      <div className="my-2.5">
        <div className={`text-base lg:text-lg font-bold tracking-tight leading-snug ${
          isCritical ? 'text-red-950 dark:text-red-100' : isWatch ? 'text-amber-950 dark:text-amber-100' : 'text-slate-900 dark:text-white'
        }`}>
          {headline}
        </div>
        <div className="text-[11px] text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
          {guidanceText}
        </div>
      </div>

      {/* Structured Telemetry KPI & Threat Bar */}
      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#172b4d]/70">
        <div className="grid grid-cols-3 gap-2 text-left">
          <div className="rounded-lg bg-white/90 dark:bg-[#071120]/90 p-2 border border-slate-200 dark:border-[#172b4d]">
            <div className="text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold truncate">Blended {P.label}</div>
            <div className={`text-sm lg:text-base font-extrabold font-mono mt-0.5 ${
              isCritical ? 'text-red-700 dark:text-red-400' : isWatch ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-cyan-300'
            }`}>
              {displayVal} <span className="text-xs font-normal text-slate-600 dark:text-slate-400">{P.unit}</span>
            </div>
          </div>
          <div className="rounded-lg bg-white/90 dark:bg-[#071120]/90 p-2 border border-slate-200 dark:border-[#172b4d]">
            <div className="text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold truncate">IMD Threshold</div>
            <div className="text-sm lg:text-base font-extrabold font-mono mt-0.5 text-slate-900 dark:text-slate-100">
              {thresholdVal} <span className="text-xs font-normal text-slate-600 dark:text-slate-400">{P.unit}</span>
            </div>
          </div>
          <div className="rounded-lg bg-white/90 dark:bg-[#071120]/90 p-2 border border-slate-200 dark:border-[#172b4d]">
            <div className="text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold truncate">Threat Index</div>
            <div className={`text-sm lg:text-base font-extrabold font-mono mt-0.5 ${
              isCritical ? 'text-red-700 dark:text-red-400' : isWatch ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
            }`}>
              {pctOfThreshold}%
            </div>
          </div>
        </div>

        {/* Threat Level Spectrum Bar */}
        <div>
          <div className="flex justify-between text-[8px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
            <span>Nominal (&lt;50%)</span>
            <span>Advisory (50–79%)</span>
            <span>Warning (≥80%)</span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                isCritical
                  ? 'bg-gradient-to-r from-amber-500 to-red-500'
                  : isWatch
                    ? 'bg-gradient-to-r from-emerald-500 to-amber-400'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(6, pctOfThreshold)}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ConsensusCard({ loc, liveAlert }) {
  const isLive = liveAlert?.isLive;
  const v = isLive && liveAlert.confidence_pct ? Math.round(liveAlert.confidence_pct) : loc.consensus;
  const ratio = isLive && liveAlert.consensus_ratio ? liveAlert.consensus_ratio : `${loc.agree} of 6`;
  const isHigh = v >= 80;
  const weights = loc.weights || { ECMWF: 30, GFS: 25, ICON: 15, JMA: 12, GEM: 8, AIFS: 10 };
  const r = 38;
  const C = 2 * Math.PI * r;

  return (
    <Card c="h-full flex flex-col justify-between p-4 transition-all duration-200 border-slate-200 bg-white dark:border-[#172b4d] dark:bg-[#0a1628]/95 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#172b4d]/70">
        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <Workflow size={13} className="text-blue-600 dark:text-cyan-400" /> Multi-Model Consensus
        </span>
        <Badge
          variant="outline"
          className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 ${
            isHigh
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/50'
              : 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/50'
          }`}
        >
          {isHigh ? 'High Confidence' : 'Moderate'}
        </Badge>
      </div>

      {/* Hero Circular Graph + Confidence Score Deck */}
      <div className="my-2 flex items-center justify-between gap-3">
        {/* Sleek Glowing Circular Confidence Gauge */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width="98" height="98" viewBox="0 0 100 100" className="shrink-0 -rotate-90">
            <defs>
              <linearGradient id="confidenceScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            {/* Dimmed Background Track */}
            <circle
              cx="50"
              cy="50"
              r={r}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="7"
              fill="none"
            />
            {/* Active Illuminated Radial Arc */}
            <circle
              cx="50"
              cy="50"
              r={r}
              stroke="url(#confidenceScoreGrad)"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - v / 100)}
              style={{
                filter: isHigh ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.45))' : 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.45))',
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          </svg>

          {/* Centered Confidence Metric */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <div className="flex items-baseline">
              <span className="text-2xl font-black font-mono text-slate-900 dark:text-white leading-none tracking-tight">
                {v}
              </span>
              <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 ml-0.5">
                %
              </span>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mt-1 font-mono leading-none">
              Confidence
            </span>
          </div>
        </div>

        {/* Side Telemetry KPI Cards */}
        <div className="flex-1 space-y-2 min-w-0">
          <div className="rounded-lg bg-slate-50/90 dark:bg-[#050d1a]/90 p-2 border border-slate-200 dark:border-[#172b4d]">
            <div className="text-[8px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono font-semibold">Model Accord</div>
            <div className="text-xs font-bold font-mono text-slate-900 dark:text-white mt-0.5 truncate flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {ratio} Converged
            </div>
          </div>
          <div className="rounded-lg bg-slate-50/90 dark:bg-[#050d1a]/90 p-2 border border-slate-200 dark:border-[#172b4d]">
            <div className="text-[8px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono font-semibold">Ensemble Spread</div>
            <div className="text-xs font-bold font-mono text-blue-700 dark:text-cyan-300 mt-0.5 truncate">
              σ = ±0.3°C (Tight)
            </div>
          </div>
        </div>
      </div>

      {/* Model Weights Breakdown */}
      <div className="space-y-1 bg-slate-50/90 dark:bg-[#050d1a]/80 p-2 rounded-lg border border-slate-200 dark:border-[#172b4d]">
        <div className="flex items-center justify-between text-[8px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          <span>Active NWP Weights</span>
          <span className="text-blue-700 dark:text-cyan-400 font-mono font-semibold">6 Constituent Ingestion</span>
        </div>
        <div className="grid grid-cols-6 gap-1 pt-0.5">
          {MODELS.map((m, idx) => {
            const wt = weights[m] || 15;
            const isAligned = idx < loc.agree;
            const col = COLORS[m] || '#38bdf8';
            return (
              <div key={m} className="flex flex-col items-center">
                <span className="text-[8px] font-bold font-mono text-slate-800 dark:text-slate-200 truncate max-w-full">
                  {m}
                </span>
                <div className="w-full bg-slate-200 dark:bg-slate-900 h-1 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, wt * 2.5)}%`,
                      backgroundColor: isAligned ? col : '#94a3b8'
                    }}
                  />
                </div>
                <span className="text-[8px] font-mono text-slate-700 dark:text-slate-300 mt-0.5 font-semibold">
                  {wt}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#172b4d]/70 text-[9px] text-slate-600 dark:text-slate-400 font-medium">
        <span className="truncate max-w-[130px]">Zone: <b className="text-slate-900 dark:text-white font-bold">{loc.regime}</b></span>
        <span className="font-mono text-blue-700 dark:text-cyan-300 flex items-center gap-1 font-semibold">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-cyan-400" /> Bayesian Stacking
        </span>
      </div>
    </Card>
  );
}

export function HazardMatrixCard({ loc }) {
  const hazards = [
    {
      icon: CloudLightning,
      title: 'Cyclonic Vortex & Storm Risk',
      status: loc.cyclone === 'LOW' ? 'NOMINAL' : loc.cyclone === 'WATCH' ? 'WATCH' : 'CRITICAL',
      statusDetail: loc.cycloneTxt || 'Offshore synoptic assessment nominal',
      badgeClass: loc.cyclone === 'LOW'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40 shadow-xs'
        : loc.cyclone === 'WATCH'
          ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40 shadow-xs'
          : 'bg-red-50 text-red-800 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/40 shadow-xs',
      iconBox: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
      meterLevel: loc.cyclone === 'LOW' ? 1 : loc.cyclone === 'WATCH' ? 3 : 5
    },
    {
      icon: Thermometer,
      title: 'Thermal Anomaly (Heatwave)',
      status: loc.heat === 'NO' ? `NORMAL (${loc.heatD > 0 ? '+' : ''}${loc.heatD}°C)` : `${loc.heat === 'CRITICAL' ? 'SEVERE HEATWAVE' : 'HEAT ANOMALY'} (+${loc.heatD}°C)`,
      statusDetail: loc.heat === 'NO' ? 'Surface thermal profile stable vs 30-yr normal' : loc.heat === 'CRITICAL' ? 'Severe heatwave threshold breached (>42°C)' : 'Elevated boundary layer temperature',
      badgeClass: loc.heat === 'NO'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40 shadow-xs'
        : loc.heat === 'CRITICAL'
          ? 'bg-red-50 text-red-800 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/40 shadow-xs'
          : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40 shadow-xs',
      iconBox: loc.heat === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',
      meterLevel: loc.heat === 'NO' ? 1 : loc.heat === 'CRITICAL' ? 5 : 3
    },
    {
      icon: Wind,
      title: 'Boundary Layer Gust Potential',
      status: `${loc.gustLvl} (${loc.gust} km/h)`,
      statusDetail: `Coastal shear gusts · Beaufort scale 6`,
      badgeClass: loc.gustLvl === 'LOW'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40 shadow-xs'
        : loc.gustLvl === 'MODERATE'
          ? 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/40 shadow-xs'
          : 'bg-red-50 text-red-800 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/40 shadow-xs',
      iconBox: 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-cyan-400',
      meterLevel: Math.min(5, Math.max(1, Math.round((loc.gust / 100) * 5)))
    }
  ];

  return (
    <Card c="h-full flex flex-col justify-between p-4 transition-all duration-200 border-slate-200 bg-white dark:border-[#172b4d] dark:bg-[#0a1628]/95 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#172b4d]/70">
        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <Scale size={13} className="text-blue-600 dark:text-cyan-400" /> Situational Hazard Matrix
        </span>
        <Badge variant="outline" className="bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-[#172b4d] text-slate-700 dark:text-slate-300 text-[9px] font-mono">
          3 Vectors Monitored
        </Badge>
      </div>

      {/* 3 Tactical Glass Modules */}
      <div className="space-y-2 my-2">
        {hazards.map((hz, idx) => {
          const Icon = hz.icon;
          return (
            <div
              key={idx}
              className="rounded-lg border border-slate-200 dark:border-[#172b4d] bg-slate-50/80 dark:bg-[#050d1a]/85 p-2.5 transition-all hover:border-blue-400 dark:hover:border-cyan-500/40 hover:bg-slate-100 dark:hover:bg-[#0c1a30] shadow-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`rounded-md border p-1.5 shrink-0 ${hz.iconBox}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {hz.title}
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300 truncate mt-0.5 font-medium">
                      {hz.statusDetail}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1">
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-bold font-mono px-2 py-0.5 border ${hz.badgeClass}`}
                  >
                    {hz.status}
                  </Badge>
                  {/* Micro 5-step LED Hazard Meter */}
                  <div className="flex gap-0.5 items-center">
                    {[1, 2, 3, 4, 5].map(step => (
                      <span
                        key={step}
                        className={`h-1 w-2.5 rounded-xs transition-colors duration-300 ${
                          step <= hz.meterLevel
                            ? hz.meterLevel <= 2
                              ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]'
                              : hz.meterLevel <= 3
                                ? 'bg-amber-500 shadow-[0_0_4px_#f59e0b]'
                                : 'bg-red-500 shadow-[0_0_4px_#ef4444]'
                            : 'bg-slate-200 dark:bg-slate-800/80'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#172b4d]/70 text-[9px] text-slate-600 dark:text-slate-400 font-medium">
        <span>IMD Tri-Vector Surveillance</span>
        <span className="font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Nominal State
        </span>
      </div>
    </Card>
  );
}

export const RiskRow = HazardMatrixCard;
