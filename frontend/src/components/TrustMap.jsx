import {useMemo,useState,useRef,useEffect} from 'react';
import {MapContainer,Pane,GeoJSON} from 'react-leaflet';
import {Info,Clock,ChevronDown} from 'lucide-react';
import {Card,DemoTag} from './Panels';
import {BaseLayers,BasemapSwitch,useStates} from './mapkit';
import {COLORS,MODELS,REGIONS,dominant,HORIZONS} from '../data/mockData';
const PANES=[['wx',250],['bd',350],['lb',450],['mk',600]];
const Pn=()=>PANES.map(([n,z])=><Pane key={n} name={n} style={{zIndex:z}}/>);
export function TrustMapCard({onView,height='h-[420px]',h=24,setH}){
 const states=useStates(),[sel,setSel]=useState(null),[base,setBase]=useState('satellite');
 const [timelineOpen,setTimelineOpen]=useState(false);
 const timelineRef=useRef(null);

 useEffect(()=>{
  function handleClickOutside(e){
   if(timelineRef.current && !timelineRef.current.contains(e.target)){
    setTimelineOpen(false);
   }
  }
  document.addEventListener('mousedown',handleClickOutside);
  return()=>document.removeEventListener('mousedown',handleClickOutside);
 },[]);

 const reg=useMemo(()=>{if(!states)return{};const o={};states.features.forEach(f=>{const r=f.geometry.coordinates.reduce((a,b)=>b[0].length>a[0].length?b:a)[0];
  const la=r.reduce((s,p)=>s+p[1],0)/r.length,lo=r.reduce((s,p)=>s+p[0],0)/r.length;
  o[f.properties.name]=REGIONS.reduce((b,x)=>((x.lat-la)**2+(x.lon-lo)**2<(b.lat-la)**2+(b.lon-lo)**2?x:b));});return o;},[states]);
 const share=MODELS.map(m=>[m,Object.values(reg).filter(r=>dominant(r.w)===m).length]),tot=Object.keys(reg).length||1;
 return <Card c="relative overflow-hidden flex flex-col h-full">
  <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#172b4d] px-3 py-2 bg-slate-50/80 dark:bg-[#071120]/80 min-h-[48px]">
    <div className="flex items-center gap-2 min-w-0">
      <span className="rounded-md border border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:bg-[#0a1628] dark:text-cyan-200 px-3 py-1.5 text-sm font-semibold truncate">
        Model Trust & Dominance Map
      </span>
      <Info size={14} className="text-slate-500 dark:text-slate-400 shrink-0" title="Model Trust & Dominance Map shows which model has highest weight per region"/>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <DemoTag/>
    </div>
  </div>
  <div className={`relative ${height}`}>
    {/* In-Map Floating Timeline Toggle Button */}
    {setH && (
      <div ref={timelineRef} className="absolute left-3 top-3 z-[1000]">
        <button
          onClick={(e)=>{e.stopPropagation();setTimelineOpen(!timelineOpen);}}
          className="flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-[#172b4d] bg-white/95 dark:bg-[#0a1628]/95 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-md hover:border-blue-500 hover:text-blue-600 dark:hover:text-cyan-300 backdrop-blur-sm transition-all cursor-pointer"
          title="Toggle Forecast Timeline Horizon"
        >
          <Clock size={14} className="text-blue-600 dark:text-cyan-400 shrink-0"/>
          <span>Timeline: <b className="text-blue-600 dark:text-cyan-300 font-bold">+{h}h</b></span>
          <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${timelineOpen?'rotate-180':''}`}/>
        </button>
        {timelineOpen && (
          <div
            onClick={(e)=>e.stopPropagation()}
            className="mt-1.5 w-44 rounded-lg border border-slate-200 dark:border-[#172b4d] bg-white/98 dark:bg-[#0a1628]/98 p-1.5 text-xs shadow-2xl backdrop-blur-md z-[1500]"
          >
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#172b4d] mb-1">
              Forecast Horizon
            </div>
            {HORIZONS.map(val=>(
              <button
                key={val}
                onClick={()=>{setH(val);setTimelineOpen(false);}}
                className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left font-medium transition-colors ${
                  val===h
                    ? 'bg-[#1d6dff] text-white font-bold shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#10213c]'
                }`}
              >
                <span>+{val}h Lead ({val>=24?`Day ${Math.floor(val/24)}`:`${val}h`})</span>
                {val===h && <span className="text-xs font-bold">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    )}
    <MapContainer center={[22,80]} zoom={4.25} zoomSnap={.25} minZoom={3} maxZoom={7} zoomControl={false} className="h-full w-full"><Pn/><BaseLayers kind={base}/>
   {states&&<GeoJSON key={sel} data={states} pane="bd" style={f=>{const r=reg[f.properties.name];return{color:'#e2e8f0',weight:f.properties.name===sel?2.2:.8,fillColor:r?COLORS[dominant(r.w)]:'#334155',fillOpacity:.68}}}
    onEachFeature={(f,l)=>l.on('click',()=>setSel(f.properties.name))}/>}</MapContainer>
   <BasemapSwitch kind={base} setKind={setBase} className="absolute left-3 bottom-3"/>
   <div className="absolute right-3 top-3 z-[1000] w-48 rounded-lg border border-slate-200 dark:border-[#172b4d] bg-white/95 dark:bg-[#0a1628]/95 p-3 text-xs text-slate-800 dark:text-slate-200 shadow-xl">
    <div className="mb-1 font-bold text-slate-900 dark:text-white">Dominant Model</div>
    {share.map(([m,n])=><div key={m} className="flex items-center gap-2 py-0.5"><span className="h-2.5 w-2.5 rounded-full" style={{background:COLORS[m]}}/>{m} ({Math.round(n/tot*100)}%)</div>)}
    {sel&&reg[sel]&&<div className="mt-2 border-t border-slate-200 dark:border-[#172b4d] pt-2"><b className="text-slate-900 dark:text-white">{sel}</b><div className="text-[10px] text-slate-600 dark:text-slate-400">Region: {reg[sel].name}</div>{MODELS.map(m=><div key={m} className="flex items-center gap-1 py-px font-mono"><span className="w-11 font-medium">{m}</span><i className="h-1.5 rounded" style={{width:`${reg[sel].w[m]*1.4}%`,background:COLORS[m]}}/><span className="ml-auto">{reg[sel].w[m]}%</span></div>)}</div>}
    <div className="mt-2 text-[9px] leading-tight text-slate-600 dark:text-slate-400">Colour shows the model with the highest weight in each region. Share = % of states.</div>
    <button onClick={onView} className="mt-2 w-full rounded border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-[#172b4d] dark:bg-[#071120] dark:text-slate-200 dark:hover:bg-[#10213c] py-1 font-medium transition-colors">View Regional Weights</button>
   </div>
  </div>
 </Card>;
}
