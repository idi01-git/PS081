// Screenshot-style map cards: heatmap card (map + docked Station Details) and Model Trust & Dominance card.
import {useEffect,useMemo,useRef,useState} from 'react';
import L from 'leaflet';
import {MapContainer,Pane,GeoJSON,CircleMarker,Tooltip,useMap} from 'react-leaflet';
import {Plus,Minus,Crosshair,X,ChevronDown,Info} from 'lucide-react';
import {Card,DemoTag} from './Panels';
import {BINS} from './Maps';
import {BaseLayers,FieldOverlay,GradientLegend,renderField,makeRamp,rainAlpha,edgeFade,useStates} from './mapkit';
import {COLORS,MODELS,PARAMS,REGIONS,IMD_THRESHOLD,getModelForecasts,dominant,riskLevel} from '../data/mockData';
// FUTURE API: feed weatherApiData into build() below instead of the mock field.
const B=[4,64,38,100],PANES=[['wx',250],['bd',350],['lb',450],['mk',600]];
function Sync({loc,zoom}){const m=useMap();useEffect(()=>{m.flyTo([loc.lat,loc.lon],zoom,{duration:.9})},[loc.id]);
 useEffect(()=>{const ro=new ResizeObserver(()=>m.invalidateSize());ro.observe(m.getContainer());return()=>ro.disconnect()},[]);return null;}
function Ctl({loc,zoom}){const m=useMap(),r=useRef();useEffect(()=>{L.DomEvent.disableClickPropagation(r.current)},[]);
 const K=({f,I})=><button onClick={f} className="grid h-8 w-8 place-items-center border-b border-[#1e3252] last:border-0 hover:bg-blue-600"><I size={15}/></button>;
 return <div ref={r} className="absolute bottom-14 left-3 z-[1000] overflow-hidden rounded border border-[#1e3252] bg-[#0d1a30]/95"><K f={()=>m.zoomIn()} I={Plus}/><K f={()=>m.zoomOut()} I={Minus}/><K f={()=>m.flyTo([loc.lat,loc.lon],zoom)} I={Crosshair}/></div>;}
const Pn=()=>PANES.map(([n,z])=><Pane key={n} name={n} style={{zIndex:z}}/>);
export function ForecastMapCard({loc,param,h,layer,setLayer,height='h-[380px]'}){
 const [show,setShow]=useState(true),states=useStates();useEffect(()=>setShow(true),[loc.id]);
 const mf=getModelForecasts(loc,param,h),v=layer==='Blended'?mf.Blended:mf[layer],P=PARAMS[param],mx=Math.max(...Object.values(mf));
 const build=()=>{const peak=v/P.max*300,ramp=makeRamp(BINS);return renderField(B,(la,lo)=>{const n=Math.sin(la*1.7)*Math.cos(lo*2.1),d2=(la-loc.lat)**2+(lo-loc.lon)**2;
  const x=peak*Math.exp(-d2/32)*(1+.25*n)+peak*.25*Math.exp(-((la-22)**2+(lo-88)**2)/30)+6*Math.max(0,n);const c=ramp(x);return [c[0],c[1],c[2],rainAlpha(x)*edgeFade(la,lo,B)];},520);};
 return <Card c="overflow-hidden"><div className="flex items-center gap-2 border-b border-[#1e3252] p-2">
  <div className="relative"><select value={layer} onChange={e=>setLayer(e.target.value)} className="appearance-none rounded-md border border-blue-500 bg-[#0a1526] py-1.5 pl-3 pr-8 text-sm font-medium outline-none">{['Blended',...MODELS].map(m=><option key={m} value={m}>{m} Forecast Heatmap</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-2 top-2.5"/></div>
  <span className="text-sm text-slate-400">{P.label} ({P.unit}) · +{h}h</span><span className="ml-auto"><DemoTag/></span></div>
  <div className="flex"><div className={`relative min-w-0 flex-1 ${height}`}>
   <MapContainer center={[19,80]} zoom={4.5} zoomSnap={.5} minZoom={4} maxZoom={10} zoomControl={false} maxBounds={[[-2,55],[45,110]]} className="h-full w-full"><Pn/>
    <BaseLayers kind="dark"/><FieldOverlay bounds={B} build={build} deps={[loc.id,param,layer,h]} opacity={.85} pane="wx"/>
    {states&&<GeoJSON data={states} pane="bd" interactive={false} style={{color:'#cbd5e1',weight:.7,fill:false,opacity:.55}}/>}
    <CircleMarker center={[loc.lat,loc.lon]} radius={11} pane="mk" pathOptions={{color:'#fff',weight:2,fillOpacity:0}}><Tooltip permanent direction="right" offset={[10,0]}>{loc.name}</Tooltip></CircleMarker>
    <CircleMarker center={[loc.lat,loc.lon]} radius={3} pane="mk" pathOptions={{color:'#fff',weight:1,fillColor:'#fff',fillOpacity:1}}/>
    <Sync loc={loc} zoom={6}/><Ctl loc={loc} zoom={6}/></MapContainer>
   <GradientLegend BINS={BINS} title={`${P.label} (${P.unit})`} className="absolute right-3 top-3"/>
   <div className="absolute bottom-3 left-3 z-[1000] flex gap-1">{['Blended',...MODELS].map(m=><button key={m} onClick={()=>setLayer(m)} className={`rounded border px-3 py-1 text-xs font-medium ${m===layer?'border-blue-400 bg-blue-600 text-white shadow-[0_0_10px_#3b82f6aa]':'border-[#1e3252] bg-[#0d1a30]/95'}`}>{m}</button>)}</div></div>
   {show&&<div className="hidden w-60 shrink-0 border-l border-[#1e3252] p-3 text-xs md:block">
    <div className="flex justify-between text-sm"><span><b>Station Details:</b> <span className="text-blue-400">{loc.name}</span></span><button onClick={()=>setShow(false)}><X size={14}/></button></div>
    <div className="text-[10px] text-slate-400">{loc.lat.toFixed(4)}°N, {loc.lon.toFixed(4)}°E</div>
    <div className="mt-3 text-slate-300">Forecast (+{h}h)</div>
    <div className="my-1 flex items-center gap-2"><span className="text-3xl font-semibold">{mf.Blended}</span><span className="text-slate-400">{P.unit}</span>
     {param==='rain'&&<span className="ml-auto rounded bg-red-600/30 px-2 py-0.5 text-red-300">{{'CRITICAL':'Heavy Rain','WARNING':'Heavy Rain','WATCH':'Moderate Rain','NOMINAL':'Light Rain','HIGH RISK':'Heavy Rain','MODERATE':'Moderate Rain','LOW':'Light Rain'}[riskLevel(mf.Blended)] || 'Nominal'}</span>}</div>
    <div className="mt-2 flex justify-between border-b border-[#1e3252] py-1 text-slate-400"><span>Model</span><span>Forecast ({P.unit})</span></div>
    {Object.entries(mf).map(([m,x])=><div key={m} className={`relative my-1 flex justify-between overflow-hidden rounded border py-1 pl-3 pr-2 ${m==='Blended'?'border-blue-500 bg-blue-600/25':'border-transparent bg-[#0a1526]'}`}><i className="absolute inset-y-0 left-0 w-1" style={{background:COLORS[m]}}/><span>{m}</span><b>{x}</b></div>)}
    {param==='rain'&&<div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400"><Info size={12}/>IMD Threshold (Heavy): {IMD_THRESHOLD} mm/24h</div>}</div>}</div></Card>;
}
export function TrustMapCard({onView,height='h-[380px]'}){
 const states=useStates(),[sel,setSel]=useState(null);
 const reg=useMemo(()=>{if(!states)return{};const o={};states.features.forEach(f=>{const r=f.geometry.coordinates.reduce((a,b)=>b[0].length>a[0].length?b:a)[0];
  const la=r.reduce((s,p)=>s+p[1],0)/r.length,lo=r.reduce((s,p)=>s+p[0],0)/r.length;
  o[f.properties.name]=REGIONS.reduce((b,x)=>((x.lat-la)**2+(x.lon-lo)**2<(b.lat-la)**2+(b.lon-lo)**2?x:b));});return o;},[states]);
 const share=MODELS.map(m=>[m,Object.values(reg).filter(r=>dominant(r.w)===m).length]),tot=Object.keys(reg).length||1;
 return <Card c="relative overflow-hidden"><div className="flex items-center gap-2 border-b border-[#1e3252] p-2"><span className="rounded-md border border-blue-500 bg-[#0a1526] px-3 py-1.5 text-sm font-medium">Model Trust & Dominance Map</span><Info size={14} className="text-slate-400"/><span className="ml-auto"><DemoTag/></span></div>
  <div className={`relative ${height}`}><MapContainer center={[22,80]} zoom={4} minZoom={3} maxZoom={7} zoomControl={false} className="h-full w-full"><Pn/><BaseLayers kind="dark"/>
   {states&&<GeoJSON key={sel} data={states} pane="bd" style={f=>{const r=reg[f.properties.name];return{color:'#e2e8f0',weight:f.properties.name===sel?2.2:.8,fillColor:r?COLORS[dominant(r.w)]:'#334155',fillOpacity:.68}}}
    onEachFeature={(f,l)=>l.on('click',()=>setSel(f.properties.name))}/>}</MapContainer>
   <div className="absolute right-3 top-3 z-[1000] w-44 rounded-lg border border-[#1e3252] bg-[#0d1a30]/95 p-3 text-xs"><div className="mb-1 font-semibold">Dominant Model</div>
    {share.map(([m,n])=><div key={m} className="flex items-center gap-2 py-0.5"><span className="h-2.5 w-2.5 rounded-full" style={{background:COLORS[m]}}/>{m} ({Math.round(n/tot*100)}%)</div>)}
    {sel&&reg[sel]&&<div className="mt-2 border-t border-[#1e3252] pt-2"><b>{sel}</b><div className="text-[10px] text-slate-400">Region: {reg[sel].name}</div>{MODELS.map(m=><div key={m} className="flex justify-between"><span>{m}</span><span>{reg[sel].w[m]}%</span></div>)}</div>}
    <div className="mt-2 text-[9px] leading-tight text-slate-400">Colour shows the model with the highest weight in each region. Share = % of states.</div>
    <button onClick={onView} className="mt-2 w-full rounded border border-[#1e3252] py-1 hover:border-blue-500">View Regional Weights</button></div></div></Card>;
}
