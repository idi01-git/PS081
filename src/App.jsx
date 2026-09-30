import {useEffect,useState} from 'react';
import {X} from 'lucide-react';
import {DashboardHeader,Sidebar,LocationSelector,QuickLocations,ForecastHorizon,WeatherParameterSelector,ExtremeAlert,ConsensusCard,RiskRow,Card,DemoTag} from './components/Panels';
import {TrustMapCard} from './components/TrustMap';
import {WeatherMap} from './components/WeatherMap';
import {ModelWeightChart,ForecastTimeSeries,VerificationScorecard,ExplainabilityCard} from './components/Charts';
import {LOCATIONS,CASES,MODELS,getForecast,getTimeSeries} from './data/mockData';
// FUTURE API: replace the get*() helpers in src/data/mockData.js with fetch() calls (weatherApiData).
const FLOW=['OBSERVATIONS','NWP MODELS · ECMWF | GFS | ICON | JMA | AIFS','AI WEIGHTING ENGINE','ENSEMBLE BLENDING','FORECAST','RISK / DECISION SUPPORT'];
const save=(name,text,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();};
export default function App(){
 const [loc,setLoc]=useState(LOCATIONS[0]),[h,setH]=useState(72),[param,setParam]=useState('rain'),[layer,setLayer]=useState('Blended'),[how,setHow]=useState(false),[now,setNow]=useState(new Date()),[page,setPage]=useState('Overview'),[theme,setTheme]=useState('dark');
 useEffect(()=>{document.documentElement.dataset.theme=theme},[theme]);
 useEffect(()=>{const t=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(t)},[]);
 const rain=getForecast(loc,'rain',h),map=(ht)=><WeatherMap loc={loc} param={param} h={h} layer={layer} setLayer={setLayer} height={ht}/>;
 const csv=()=>{const d=getTimeSeries(loc,param,h);save(`${loc.id}_${param}_${h}h_DEMO.csv`,['t,'+['Blended',...MODELS].join(','),...d.map(r=>[r.t,r.Blended,...MODELS.map(m=>r[m])].join(','))].join('\n'),'text/csv');};
 const views={
  Overview:<>
   <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6 [&>*]:h-full [&>div>div]:h-full"><div className="md:col-span-3 xl:col-span-2"><ExtremeAlert loc={loc} rain={rain} h={h}/></div><ConsensusCard loc={loc}/><RiskRow loc={loc}/></div>
   <div className="grid gap-3 xl:grid-cols-5"><div className="xl:col-span-3">{map('h-[430px]')}</div><div className="xl:col-span-2"><TrustMapCard onView={()=>setPage('Model Weights')}/></div></div>
   <div className="grid gap-3 xl:grid-cols-5"><div className="xl:col-span-3"><ForecastTimeSeries loc={loc} param={param} h={h}/></div><div className="xl:col-span-2"><ModelWeightChart loc={loc}/></div></div>
   <div className="grid gap-3 xl:grid-cols-5"><div className="xl:col-span-2"><VerificationScorecard loc={loc}/></div><div className="xl:col-span-3"><ExplainabilityCard loc={loc} h={h}/></div></div></>,
  'Forecast Map':<>{map('h-[72vh]')}<TrustMapCard onView={()=>setPage('Model Weights')}/></>,
  'Time Series':<><ForecastTimeSeries loc={loc} param={param} h={h}/><ExtremeAlert loc={loc} rain={rain} h={h}/></>,
  'Model Weights':<div className="grid gap-3 xl:grid-cols-2"><ModelWeightChart loc={loc}/><TrustMapCard onView={()=>setPage('Model Weights')}/><div className="xl:col-span-2"><ExplainabilityCard loc={loc} h={h}/></div></div>,
  Verification:<><VerificationScorecard loc={loc}/><ExplainabilityCard loc={loc} h={h}/></>,
  'Case Studies':<div className="grid gap-3 md:grid-cols-2">{CASES.map(c=><Card key={c.t} c="p-4"><DemoTag/><div className="mt-2 font-semibold">{c.t}</div><p className="text-xs text-slate-300">{c.d}</p><button onClick={()=>{setLoc(LOCATIONS.find(l=>l.id===c.loc));setPage('Overview')}} className="mt-3 rounded bg-[#1d6dff] px-3 py-1 text-xs">Open in dashboard</button></Card>)}</div>,
  Downloads:<Card c="space-y-3 p-4"><DemoTag/><div className="text-sm">Export demo data for {loc.name} (+{h}h). Files are mock values, not NCMRWF data.</div>
   <button onClick={csv} className="mr-2 rounded bg-[#1d6dff] px-3 py-1.5 text-xs">Time series (CSV)</button>
   <button onClick={()=>save(`${loc.id}_weights_DEMO.json`,JSON.stringify({location:loc.name,weights:loc.weights,rmse:loc.rmse},null,2),'application/json')} className="rounded bg-[#1d6dff] px-3 py-1.5 text-xs">Weights + RMSE (JSON)</button></Card>};
 return <div className="flex h-screen flex-col"><DashboardHeader now={now} onHow={()=>setHow(true)}/>
  <div className="flex min-h-0 flex-1"><Sidebar a={page} setA={setPage} theme={theme} setTheme={setTheme}/>
   <main className="flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-3">
    <Card c="grid gap-4 p-3 xl:grid-cols-[1.35fr_1fr_1.25fr]"><div className="space-y-2"><LocationSelector loc={loc} setLoc={setLoc}/><QuickLocations loc={loc} setLoc={setLoc}/></div><ForecastHorizon h={h} setH={setH}/><WeatherParameterSelector param={param} setParam={setParam}/></Card>
    {views[page]}
    <p className="pb-2 text-center text-[10px] text-slate-500">Prototype — all values are mock/demo data for the Smart India Hackathon 2026 (PS 26081). Not NCMRWF/IMD observations.</p>
   </main></div>
  {how&&<div className="fixed inset-0 z-[3000] grid place-items-center bg-black/70" onClick={()=>setHow(false)}><Card c="w-[480px] p-5"><div className="mb-3 flex justify-between"><b>How Hybrid Forecasting Works</b><button onClick={()=>setHow(false)}><X size={16}/></button></div>
   {FLOW.map((f,i)=><div key={i}><div className={`rounded border p-2 text-center text-sm ${i===2?'border-cyan-400 bg-[#1d6dff]/30 font-bold':'border-[#172b4d] bg-[#071120]'}`}>{f}</div>{i<5&&<div className="text-center text-cyan-400">↓</div>}</div>)}</Card></div>}
 </div>;
}
