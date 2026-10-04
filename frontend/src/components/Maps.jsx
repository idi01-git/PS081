import {useEffect,useState,useRef} from 'react';
import {MapContainer,Pane,GeoJSON,CircleMarker,Tooltip,useMap,useMapEvents} from 'react-leaflet';
import {BaseLayers,BasemapSwitch,FieldOverlay,GradientLegend,renderField,makeRamp,rainAlpha,edgeFade,useStates,wxField} from './mapkit';
import {Card,DemoTag} from './Panels';
import {COLORS,MODELS,PARAMS,REGIONS,IMD_THRESHOLD,getForecast,getModelForecasts,dominant,riskLevel,HORIZONS} from '../data/mockData';
import {X, Clock, ChevronDown} from 'lucide-react';
export const BINS=[[300,'#c026d3'],[200,'#dc2626'],[100,'#f97316'],[50,'#facc15'],[25,'#a3d63a'],[10,'#22c55e'],[5,'#22d3ee'],[1,'#3b82f6'],[0,'#1e3a8a']];
export const colorFor=v=>(BINS.find(([t])=>v>=t)||BINS[8])[1];
const CITIES=[['Delhi',28.61,77.21],['Mumbai',19.08,72.88],['Kolkata',22.57,88.36],['Chennai',13.08,80.27],['Bengaluru',12.97,77.59],['Hyderabad',17.39,78.49],['Lucknow',26.85,80.95],['Kochi',9.93,76.27],['Ahmedabad',23.02,72.57]];
const RAMP=makeRamp(BINS),EXT=[5,66,38,99];
const hexRgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
function Fly({c}){const m=useMap();useEffect(()=>{m.flyTo(c,5,{duration:.8})},[c[0],c[1]]);return null;}
export function ForecastMap({loc,param,h,setH,layer,setLayer}){
 const mf=getModelForecasts(loc,param,h),v=layer==='Blended'?mf.Blended:mf[layer],peak=v/PARAMS[param].max*300,[base,setBase]=useState('dark');
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
 const build=()=>renderField(EXT,(la,lo)=>{const d2=(la-loc.lat)**2+(lo-loc.lon)**2,n=Math.sin(la*1.7)*Math.cos(lo*2.1);
  const x=wxField(la,lo,loc,peak);
  const a=rainAlpha(x)*edgeFade(la,lo,EXT);if(a<=0)return null;const c=RAMP(x);return [c[0],c[1],c[2],a];},720);
 const states=useStates();
 return <Card c="relative overflow-hidden flex flex-col h-full">
  <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#172b4d] px-3 py-2 bg-slate-50/80 dark:bg-[#071120]/80 min-h-[48px]">
   <div className="flex items-center gap-2">
    <span className="rounded bg-[#0a1628]/95 px-3 py-1.5 text-sm font-semibold">{layer} Forecast Heatmap — {PARAMS[param].label}</span>
   </div>
   <DemoTag/>
  </div>
  <div className="h-[470px] relative">
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
   <MapContainer center={[loc.lat,loc.lon]} zoom={5} minZoom={4} maxZoom={10} className="h-full w-full"><Fly c={[loc.lat,loc.lon]}/>
   <Pane name="wx" style={{zIndex:250}}><FieldOverlay bounds={EXT} build={build} deps={[loc.id,param,h,layer]} opacity={.62} pane="wx"/></Pane>
   <Pane name="bd" style={{zIndex:350}}>{states&&<GeoJSON data={states} pane="bd" interactive={false} style={{color:'#e2e8f0',weight:.9,fill:false,opacity:.7}}/>}</Pane>
   <Pane name="lb" style={{zIndex:450}}/><BaseLayers kind={base}/>
   {CITIES.map(([n,la,lo])=><CircleMarker key={n} center={[la,lo]} radius={2.5} pathOptions={{color:'#fff',weight:1}}><Tooltip permanent direction="right" className="city">{n}</Tooltip></CircleMarker>)}
   <CircleMarker center={[loc.lat,loc.lon]} radius={9} pathOptions={{color:'#fff',fillColor:'#2563eb',fillOpacity:1,weight:2}}><Tooltip permanent direction="top" offset={[0,-8]}>{loc.name}</Tooltip></CircleMarker></MapContainer>
  <div className="absolute bottom-3 left-3 z-[1000] flex gap-1">{['Blended',...MODELS].map(m=><button key={m} onClick={()=>setLayer(m)} className={`rounded border px-3 py-1 text-xs font-medium transition-colors ${m===layer?'border-blue-400 bg-[#1d6dff] text-white font-semibold':'border-[#172b4d] bg-[#0a1628]/95 text-slate-300 hover:text-white'}`}>{m}</button>)}</div>
  <BasemapSwitch kind={base} setKind={setBase} className="absolute right-3 bottom-8"/>
  <GradientLegend BINS={BINS} title={`${PARAMS[param].label} (${PARAMS[param].unit}, scaled)`} className="absolute bottom-14 left-3"/>
  <LocationForecastPanel loc={loc} param={param} h={h}/></div></Card>;
}
export function LocationForecastPanel({loc,param,h}){
 const [open,setOpen]=useState(true);useEffect(()=>setOpen(true),[loc.id]);
 if(!open)return null;
 const mf=getModelForecasts(loc,param,h),u=PARAMS[param].unit,mx=Math.max(...Object.values(mf));
 return <div className="absolute right-3 top-3 z-[1000] w-64 rounded-lg border border-[#172b4d] bg-[#0a1628]/95 p-3 text-xs shadow-xl">
  <div className="flex justify-between"><b>Station Details: {loc.name}</b><button onClick={()=>setOpen(false)}><X size={14}/></button></div>
  <div className="text-[10px] text-slate-400">{loc.lat.toFixed(4)}°N, {loc.lon.toFixed(4)}°E</div>
  <div className="mt-2 text-slate-300">Forecast (+{h}h)</div>
  <div className="flex items-center gap-2"><span className="text-2xl font-bold">{mf.Blended} {u}</span>{param==='rain'&&<span className="rounded bg-red-600/30 px-1.5 py-0.5 text-red-300">{riskLevel(mf.Blended)==='HIGH RISK'?'Heavy Rain':riskLevel(mf.Blended)==='MODERATE'?'Moderate Rain':'Light Rain'}</span>}</div>
  <div className="mt-2 space-y-1">{Object.entries(mf).map(([m,v])=><div key={m} className="flex items-center gap-2"><span className="w-14">{m}</span><div className="h-2 flex-1 rounded bg-[#10213c]"><div className="h-2 rounded" style={{width:`${v/mx*100}%`,background:COLORS[m]}}/></div><span className="w-10 text-right">{v}</span></div>)}</div>
  {param==='rain'&&<div className="mt-2 border-t border-[#172b4d] pt-1 text-[10px] text-slate-400">IMD Heavy Rain Threshold: {IMD_THRESHOLD} mm / 24h</div>}</div>;
}
function Pick({onPick}){useMapEvents({click:e=>onPick(e.latlng)});return null;}
const nearest=(la,lo)=>REGIONS.reduce((b,x)=>((x.lat-la)**2+(x.lon-lo)**2<(b.lat-la)**2+(b.lon-lo)**2?x:b));
export function ModelTrustMap(){
 const [sel,setSel]=useState(REGIONS[4]),[base,setBase]=useState('dark'),states=useStates();
 // Dominance field: nearest-region colouring, softened and clipped to India's state polygons so it follows real geography.
 const build=()=>renderField(EXT,(la,lo)=>{const r=nearest(la,lo),c=hexRgb(COLORS[dominant(r.w)]);return [c[0],c[1],c[2],r===sel?1:.88];},720,(cv,proj)=>{
  if(!states)return cv;
  const out=document.createElement('canvas');out.width=cv.width;out.height=cv.height;const x=out.getContext('2d');
  x.filter='blur(1.5px)';x.drawImage(cv,0,0);x.filter='none';x.globalCompositeOperation='destination-in';x.beginPath();
  states.features.forEach(f=>{const g=f.geometry,polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;
   polys.forEach(p=>p.forEach(ring=>ring.forEach(([lo,la],i)=>{const [px,py]=proj(la,lo);i?x.lineTo(px,py):x.moveTo(px,py);})));});
  x.fillStyle='#000';x.fill('evenodd');return out;});
 return <Card c="relative overflow-hidden"><div className="absolute left-3 top-3 z-[1000] flex items-center gap-2"><span className="rounded bg-[#0a1628]/95 px-3 py-1.5 text-sm font-semibold">Model Trust & Dominance Map</span><DemoTag/></div>
  <div className="h-[470px]"><MapContainer center={[22,80]} zoom={4.6} zoomSnap={.1} minZoom={4} maxZoom={9} className="h-full w-full">
   <Pane name="wx" style={{zIndex:250}}><FieldOverlay bounds={EXT} build={build} deps={[sel,states]} opacity={.62} pane="wx"/></Pane>
   <Pane name="bd" style={{zIndex:350}}>{states&&<GeoJSON data={states} pane="bd" interactive={false} style={{color:'#f1f5f9',weight:.8,fill:false,opacity:.7}}/>}</Pane>
   <Pane name="lb" style={{zIndex:450}}/><BaseLayers kind={base}/>
   <Pick onPick={ll=>setSel(nearest(ll.lat,ll.lng))}/>
   <Pane name="mk" style={{zIndex:600}}>{REGIONS.map(r=><CircleMarker key={r.name} center={[r.lat,r.lon]} radius={r===sel?5:3} pane="mk" eventHandlers={{click:()=>setSel(r)}} pathOptions={{color:'#0b1526',weight:1,fillColor:'#fff',fillOpacity:1}}><Tooltip direction="right" offset={[5,0]} permanent className="city">{r.name}</Tooltip></CircleMarker>)}</Pane></MapContainer></div>
  <BasemapSwitch kind={base} setKind={setBase} className="absolute left-3 bottom-8"/>
  <div className="absolute right-3 top-3 z-[1000] w-44 rounded-lg border border-[#172b4d] bg-[#0a1628]/95 p-3 text-xs">
   <div className="font-semibold">Dominant Model</div>{MODELS.map(m=><div key={m} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{background:COLORS[m]}}/>{m}</div>)}
   <div className="mt-2 border-t border-[#172b4d] pt-2"><div className="font-semibold">Region: {sel.name}</div>{MODELS.map(m=><div key={m} className="flex justify-between"><span>{m}</span><span>{sel.w[m]}%</span></div>)}
   <div className="mt-1 text-cyan-300">Dominant: {dominant(sel.w)}</div></div></div></Card>;
}
