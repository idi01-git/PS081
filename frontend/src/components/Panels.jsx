import {Fragment,useState} from 'react';
import {Home,Map as MapIcon,LineChart,Scale,BarChart3,ClipboardList,Download,CloudRain,Thermometer,Wind,Gauge,Search,ChevronRight,ChevronLeft,AlertTriangle,CloudLightning,Workflow,Sun,Moon} from 'lucide-react';
import {PARAMS,HORIZONS,LOCATIONS,IMD_THRESHOLD,riskLevel} from '../data/mockData';
export const Card=({c='',children})=><div className={`rounded-xl border border-[#172b4d] bg-[#0a1628]/95 shadow-[0_2px_10px_rgba(0,0,0,.22)] ${c}`}>{children}</div>;
export const DemoTag=({t='Prototype / Demo Data'})=><span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">{t}</span>;
const Dot=({c='bg-green-400'})=><span className={`inline-block h-2 w-2 rounded-full ${c}`}/>;

export const ThemeToggle=({theme,setTheme})=><button onClick={()=>setTheme(theme==="dark"?"light":"dark")} title="Toggle light / dark theme" className="flex items-center gap-1 rounded border border-[#172b4d] px-2 py-1 hover:border-blue-500">{theme==="dark"?<Sun size={14}/>:<Moon size={14}/>}{theme==="dark"?"Light":"Dark"}</button>;
const LogoArt={
 moes:<svg viewBox="0 0 40 40" className="h-full w-full"><circle cx="20" cy="20" r="19" fill="#0b3a6e" stroke="#38bdf8" strokeWidth="1.5"/><path d="M6 24q4-4 7 0t7 0 7 0 7 0M8 29q4-4 6 0t6 0 6 0 6 0" fill="none" stroke="#7dd3fc" strokeWidth="1.6"/><path d="M10 20l6-9 4 6 3-4 7 7z" fill="#e2f1ff"/><circle cx="28" cy="10" r="3" fill="#fbbf24"/></svg>,
 imd:<svg viewBox="0 0 40 40" className="h-full w-full"><circle cx="20" cy="20" r="19" fill="#0a4a8a" stroke="#22d3ee" strokeWidth="1.5"/><circle cx="20" cy="20" r="10" fill="#1d6dff" stroke="#e2f1ff" strokeWidth="1"/><ellipse cx="20" cy="20" rx="4.5" ry="10" fill="none" stroke="#e2f1ff" strokeWidth="1"/><path d="M10 20h20M12 14h16M12 26h16" stroke="#e2f1ff" strokeWidth="1"/><path d="M20 3v4M6 9l3 3M34 9l-3 3" stroke="#fbbf24" strokeWidth="1.6"/></svg>};
// Drop official logos at public/logos/moes.png and public/logos/imd.png to replace these placeholder badges.
export function Logo({kind}){const [bad,setBad]=useState(false);const alt=kind==='moes'?'Ministry of Earth Sciences':'India Meteorological Department';const I=(src,c)=><img src={src} alt={alt} onError={()=>setBad(true)} decoding="async" className={`h-full w-auto object-contain ${c}`}/>;
 return <div className={`shrink-0 ${kind==='imd'?'h-12':'h-11 w-11'}`}>{bad?LogoArt[kind]:kind==='moes'?<>{I('/logos/moes-light.png','logo-dark-only')}{I('/logos/moes.png','logo-light-only')}</>:I('/logos/imd.png','')}</div>;}
export function DashboardHeader({now,onHow,isBackendLive=false,backendLatency=1.2}){
 return <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#172b4d] bg-[#050d1a] px-4 py-2">
  <div className="flex items-center gap-3 text-[11px] leading-tight">
   <Logo kind="moes"/>
   <div><b>Ministry of Earth Sciences</b><br/>Government of India</div>
   <Logo kind="imd"/>
   <div><b>India Meteorological Department</b></div>
  </div>
  <div className="text-center"><h1 className="text-lg font-bold tracking-wide text-white">HYBRID AI–NWP FORECAST BLENDING SYSTEM</h1>
   <p className="text-[11px] tracking-wider text-cyan-400">DISASTER MANAGEMENT | OPERATIONAL FORECASTING | MoES / NCMRWF</p></div>
  <div className="flex items-center gap-1.5 text-[10px] leading-tight">
   <button onClick={onHow} className="flex items-center gap-1 rounded border border-cyan-600/50 px-1.5 py-0.5 text-cyan-300 hover:bg-cyan-500/10"><Workflow size={11}/>How it works</button>
   {isBackendLive ? (
    <div className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-emerald-300 font-semibold"><span className="live-dot bg-emerald-400"/> FASTAPI BACKEND CONNECTED</div>
   ) : (
    <div className="rounded border border-yellow-500/40 bg-yellow-500/10 px-1.5 py-0.5 text-yellow-300"><span className="live-dot bg-yellow-400"/> STANDALONE CLIENT MODE</div>
   )}
   <div className="rounded border border-[#172b4d] px-1.5 py-0.5"><span className="live-dot"/> 6/6 MODELS SYNCED<div className="text-[10px] text-slate-400">Latency: {backendLatency}ms</div></div>
   <div className="text-right"><DemoTag t={isBackendLive ? "Operational Feed" : "Prototype Mode"}/><div className="mt-0.5 text-slate-300">Last updated: {now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})} {now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} IST</div></div>
  </div></header>;
}
const SEC={Overview:'MONITORING','Model Weights':'ANALYTICS','Case Studies':'RESOURCES'};
const NAV=[[Home,'Overview'],[MapIcon,'Forecast Map'],[LineChart,'Time Series'],[Scale,'Model Weights'],[BarChart3,'Verification'],[ClipboardList,'Case Studies'],[Download,'Downloads']];
export function Sidebar({a,setA,theme,setTheme}){
 const [open,setOpen]=useState(true);
 return <aside className={`flex shrink-0 flex-col border-r border-[#172b4d] bg-[#050d1a] transition-all ${open?'w-52':'w-14'}`}>
  <button onClick={()=>setOpen(!open)} className="m-2 self-end text-slate-400 hover:text-white">{open?<ChevronLeft size={16}/>:<ChevronRight size={16}/>}</button>
  <nav className="flex-1 space-y-1 px-2">{NAV.map(([I,n])=><Fragment key={n}>{open&&SEC[n]&&<div className="px-3 pb-1 pt-3 text-[10px] font-semibold tracking-widest text-slate-500">{SEC[n]}</div>}<button onClick={()=>setA(n)} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm ${a===n?'bg-[#1d6dff] text-white shadow-[0_0_14px_#2563eb88]':'text-slate-300 hover:bg-[#10213c]'}`}><I size={17}/>{open&&n}</button></Fragment>)}</nav>
  {open&&<div className="space-y-1 p-3 text-[11px] text-slate-300"><div><Dot/> Models Synced</div><div><span className="live-dot"/> LIVE OPERATIONS MODE</div></div>}
  <div className="mx-3 mb-2 text-xs"><ThemeToggle theme={theme} setTheme={setTheme}/></div>
  <div className="flex items-center gap-2 border-t border-[#172b4d] p-3"><div className="grid h-8 w-8 place-items-center rounded-full bg-blue-700 text-xs">U</div>{open&&<div className="text-xs">User</div>}</div>
 </aside>;
}
export function LocationSelector({loc,setLoc}){
 const [q,setQ]=useState('');
 const hits=q?LOCATIONS.filter(l=>(l.name+l.state).toLowerCase().includes(q.toLowerCase())):[];
 return <div className="relative">
  <div className="mb-1 text-[11px] text-slate-400">Location</div>
  <div className="flex items-center gap-2 rounded-md border border-[#172b4d] bg-[#071120] px-3 py-1.5 text-sm"><Search size={14} className="text-slate-500"/>
   <input value={q} onChange={e=>setQ(e.target.value)} placeholder={`${loc.name}, ${loc.state}`} className="w-52 bg-transparent outline-none placeholder:text-slate-200"/></div>
  {hits.length>0&&<div className="absolute z-[2000] mt-1 w-full rounded border border-[#172b4d] bg-[#0a1628]">{hits.map(l=><button key={l.id} onClick={()=>{setLoc(l);setQ('')}} className="block w-full px-3 py-1.5 text-left text-sm hover:bg-[#1d6dff]/30">{l.name}, {l.state}</button>)}</div>}
 </div>;
}
export const QuickLocations=({loc,setLoc})=><div className="flex flex-wrap gap-2 self-end">{LOCATIONS.map(l=><button key={l.id} onClick={()=>setLoc(l)} className={`rounded-md border px-3 py-1.5 text-xs ${l.id===loc.id?'border-blue-400 bg-[#1d6dff] text-white shadow-[0_0_12px_#3b82f6aa]':'border-[#172b4d] text-slate-300 hover:border-blue-500'}`}>{l.name}</button>)}</div>;
export const ForecastHorizon=({h,setH})=><div><div className="mb-1 text-[11px] text-slate-400">Forecast Horizon</div><div className="flex gap-1.5">{HORIZONS.map(x=><button key={x} onClick={()=>setH(x)} className={`rounded-md border px-3 py-1.5 text-xs ${x===h?'border-blue-400 bg-[#1d6dff] text-white shadow-[0_0_12px_#3b82f6aa]':'border-[#172b4d] text-slate-300 hover:border-blue-500'}`}>+{x}h</button>)}</div></div>;
const PI={rain:CloudRain,temp:Thermometer,wind:Wind,pres:Gauge};
function WeatherParameterCard({k,sel,onClick}){const I=PI[k];return <button onClick={onClick} className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-left text-xs ${sel?'border-cyan-400 bg-[#1d6dff]/20 shadow-[0_0_12px_#22d3ee55]':'border-[#172b4d] hover:border-blue-500'}`}><I size={18} className={sel?'text-cyan-300':'text-slate-400'}/><span>{PARAMS[k].label}<br/><span className="text-slate-400">({PARAMS[k].unit})</span></span></button>;}
export const WeatherParameterSelector=({param,setParam})=><div><div className="mb-1 text-[11px] text-slate-400">Weather Parameter</div><div className="flex gap-1.5">{Object.keys(PARAMS).map(k=><WeatherParameterCard key={k} k={k} sel={k===param} onClick={()=>setParam(k)}/>)}</div></div>;

export function ExtremeAlert({loc,rain,h,liveAlert}){
 const isLive = liveAlert?.isLive;
 const lvl = isLive ? liveAlert.alert_level : riskLevel(rain);
 const hi = lvl==='HIGH RISK' || lvl==='CRITICAL' || lvl==='WARNING';
 const displayVal = isLive && liveAlert.blended_value !== undefined ? liveAlert.blended_value : rain;
 const reason = isLive && liveAlert.guidance_note ? liveAlert.guidance_note : (hi?'Heavy Rainfall Expected':lvl==='MODERATE'?'Moderate Rainfall Possible':'No Extreme Rainfall');
 return <Card c={`flex items-center gap-4 p-4 ${hi?'border-red-500/60 bg-gradient-to-br from-[#5c0f16] to-[#2b0a12] shadow-[0_0_24px_#ef444433]':lvl==='MODERATE'||lvl==='WATCH'?'border-orange-500/50 bg-orange-950/30':'border-green-600/40'}`}>
  <AlertTriangle size={44} className={hi?'text-red-500':lvl==='WATCH'?'text-orange-400':'text-green-400'}/>
  <div className="flex-1"><div className="text-[10px] font-semibold tracking-widest text-orange-300">⚠ OPERATIONAL HAZARD WATCH</div>
   <div className="text-xl font-bold text-white">{reason}</div>
   <div className="text-xs text-slate-300">Blended value: <b>{displayVal} mm</b> accumulated to +{h}h · {loc.name}</div>
   <div className="text-xs text-orange-300">(&gt; {IMD_THRESHOLD} mm IMD heavy-rain threshold)</div></div>
  <div className="flex items-center gap-1"><span className={`rounded px-2 py-1 text-xs font-bold ${hi?'bg-red-600':lvl==='WATCH'?'bg-orange-600':'bg-emerald-600'}`}>{lvl}</span><ChevronRight size={18}/></div>
 </Card>;
}
export function ConsensusCard({loc,liveAlert}){
 const isLive = liveAlert?.isLive;
 const v = isLive && liveAlert.confidence_pct ? Math.round(liveAlert.confidence_pct) : loc.consensus;
 const ratio = isLive && liveAlert.consensus_ratio ? liveAlert.consensus_ratio : `${loc.agree} of 6`;
 const r=34,C=2*Math.PI*r;
 return <Card c="flex items-center gap-4 p-4"><svg width="88" height="88" viewBox="0 0 88 88"><circle cx="44" cy="44" r={r} stroke="#173050" strokeWidth="8" fill="none"/><circle cx="44" cy="44" r={r} stroke="#2ee27d" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-v/100)} transform="rotate(-90 44 44)"/><text x="44" y="50" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700">{v}%</text></svg>
  <div><div className="font-semibold text-white">Multi-Model Consensus</div><div className="text-xs text-slate-300">{ratio} constituent models indicate<br/>{loc.regime.toLowerCase()}</div><span className={`mt-1 inline-block rounded border px-2 py-0.5 text-[11px] ${v>=80?'border-green-500 text-green-400':'border-yellow-500 text-yellow-300'}`}>{v>=80?'High Confidence':'Moderate Confidence'}</span></div></Card>;
}
const TONE={LOW:'text-green-400',NO:'text-green-400',WATCH:'text-orange-300',MODERATE:'text-orange-300',HIGH:'text-red-400'};
export const RiskCard=({icon:I,title,level,text})=><Card c="flex items-start gap-3 p-4"><I size={30} className="text-cyan-400"/><div><div className="text-[11px] text-slate-400">{title}</div><div className={`text-xl font-bold ${TONE[level]}`}>{level[0]+level.slice(1).toLowerCase()}</div><div className="text-[11px] text-slate-400">{text}</div></div></Card>;
export const RiskRow=({loc})=><>
 <RiskCard icon={CloudLightning} title="Cyclone / Storm Risk" level={loc.cyclone} text={loc.cycloneTxt}/>
 <RiskCard icon={Thermometer} title="Heatwave Anomaly" level={loc.heat} text={`${loc.heatD>0?'+':''}${loc.heatD}°C vs normal`}/>
 <RiskCard icon={Wind} title="Strong Winds" level={loc.gustLvl} text={`Gusts up to ${loc.gust} km/h`}/></>;
