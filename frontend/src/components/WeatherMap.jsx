import {useEffect,useMemo,useRef,useState} from 'react';
import L from 'leaflet';
import {MapContainer,Pane,GeoJSON,CircleMarker,Popup,Tooltip,useMap,useMapEvents} from 'react-leaflet';
import {Plus,Minus,Home,Crosshair,Layers} from 'lucide-react';
import {Card,DemoTag} from './Panels';
import {BINS,colorFor} from './Maps'; // existing precipitation palette, reused unchanged
import {BaseLayers,BasemapSwitch,FieldOverlay,GradientLegend,renderField,makeRamp,rainAlpha,edgeFade,useStates,wxField} from './mapkit';
import {MODELS,PARAMS,getModelForecasts,riskLevel} from '../data/mockData';
// FUTURE API: pass weatherApiData (array of {la,lo,val}) instead of the mock grid built below.
const CITIES=[['Delhi',28.61,77.21],['Mumbai',19.08,72.88],['Kolkata',22.57,88.36],['Chennai',13.08,80.27],['Bengaluru',12.97,77.59],['Hyderabad',17.39,78.49],['Lucknow',26.85,80.95],['Ahmedabad',23.02,72.57],['Bhopal',23.26,77.41],['Jaipur',26.91,75.79],['Patna',25.59,85.14],['Bhubaneswar',20.3,85.82],['Guwahati',26.14,91.74]];
const RAMP=makeRamp(BINS),EXT=[5,66,38,99]; // raster extent [south,west,north,east]
const INDIA=[[19,80],4.5];
function Sync({loc,zoom}){const m=useMap();const first=useRef(true);useEffect(()=>{if(first.current){first.current=false;return}m.flyTo([loc.lat,loc.lon],zoom,{duration:.9})},[loc.id]);
 useEffect(()=>{const ro=new ResizeObserver(()=>m.invalidateSize());ro.observe(m.getContainer());setTimeout(()=>m.invalidateSize(),200);return()=>ro.disconnect()},[]);return null;}
function Controls({loc,zoom}){const m=useMap(),r=useRef();useEffect(()=>{L.DomEvent.disableClickPropagation(r.current);L.DomEvent.disableScrollPropagation(r.current)},[]);
 const B=({f,i:I,t})=><button title={t} onClick={f} className="grid h-8 w-8 place-items-center rounded bg-[#0a1628]/95 border border-[#172b4d] hover:bg-[#1d6dff]"><I size={15}/></button>;
 return <div ref={r} className="absolute right-3 top-14 z-[1000] flex flex-col gap-1"><B f={()=>m.zoomIn()} i={Plus} t="Zoom in"/><B f={()=>m.zoomOut()} i={Minus} t="Zoom out"/><B f={()=>m.flyTo(...INDIA)} i={Home} t="Reset to India"/><B f={()=>m.flyTo([loc.lat,loc.lon],zoom)} i={Crosshair} t="Locate selected region"/></div>;}
function Cities(){const [z,setZ]=useState(5);const m=useMapEvents({zoomend:()=>setZ(m.getZoom())});
 return CITIES.map(([n,la,lo])=><CircleMarker key={n} center={[la,lo]} radius={3} pane="mk" pathOptions={{color:'#0b1526',weight:1,fillColor:'#fff',fillOpacity:1}}><Tooltip permanent={z>=6} direction="right" offset={[5,0]} opacity={.62}>{n}</Tooltip></CircleMarker>);}
export function WeatherMap({loc,param,h,layer,setLayer,height='h-[560px]'}){
 const states=useStates(),[menu,setMenu]=useState(false),[base,setBase]=useState('dark');
 const mf=getModelForecasts(loc,param,h),v=layer==='Blended'?mf.Blended:mf[layer],u=PARAMS[param].unit;
 // Same analytic field as before, but evaluated per pixel and drawn as one smooth raster instead of 0.75° squares.
 const peak=v/PARAMS[param].max*300;
 const build=()=>renderField(EXT,(la,lo)=>{const d2=(la-loc.lat)**2+(lo-loc.lon)**2,n=Math.sin(la*1.7)*Math.cos(lo*2.1);
   const x=wxField(la,lo,loc,peak);
   const a=rainAlpha(x)*edgeFade(la,lo,EXT);if(a<=0)return null;const c=RAMP(x);return [c[0],c[1],c[2],a];},720);
 const zoom=5.5;
 return <Card c="relative overflow-hidden">
  <div className="absolute left-3 top-3 z-[1000] flex items-center gap-2"><span className="rounded bg-[#0a1628]/95 px-3 py-1.5 text-sm font-semibold">{layer} Forecast — {PARAMS[param].label}</span><DemoTag/><span className="rounded bg-[#0a1628]/95 px-2 py-1 text-[10px]"><span className="live-dot"/> DEMO FEED · Forecast +{h}h</span>
   <div className="relative"><button onClick={()=>setMenu(!menu)} className="flex items-center gap-1 rounded border border-[#172b4d] bg-[#0a1628]/95 px-2 py-1.5 text-xs"><Layers size={14}/>Weather Layers</button>
    {menu&&<div className="absolute mt-1 w-40 rounded border border-[#172b4d] bg-[#0a1628] p-1 text-xs">{['Blended',...MODELS].map(m=><button key={m} onClick={()=>{setLayer(m);setMenu(false)}} className={`block w-full rounded px-2 py-1 text-left ${m===layer?'bg-[#1d6dff]':'hover:bg-[#10213c]'}`}>{m==='Blended'?'☔ Blended Forecast':m}</button>)}</div>}</div></div>
  <div className={height}><MapContainer zoomSnap={.5} center={INDIA[0]} zoom={INDIA[1]} minZoom={4} maxZoom={10} zoomControl={false} maxBounds={[[-2,58],[42,108]]} className="h-full w-full">
   <Pane name="wx" style={{zIndex:250}}><FieldOverlay bounds={EXT} build={build} deps={[loc.id,param,layer,h]} opacity={.62} pane="wx"/></Pane>
   <Pane name="bd" style={{zIndex:350}}>{states&&<GeoJSON data={states} pane="bd" interactive={false} style={{color:base==='street'?'#475569':'#e2e8f0',weight:.9,fill:false,opacity:.7}}/>}</Pane>
   <Pane name="lb" style={{zIndex:450}}/>
   <BaseLayers kind={base}/>
   <Pane name="mk" style={{zIndex:600}}><Cities/>
    <CircleMarker center={[loc.lat,loc.lon]} radius={9} pane="mk" pathOptions={{color:'#fff',weight:3,fillColor:'#2563eb',fillOpacity:1}}><Popup><div className="text-xs text-slate-800"><b>{loc.name}</b><br/>Forecast: {v} {u}<br/>Risk: {param==='rain'?(riskLevel(v)==='HIGH RISK'?'Heavy Rain':riskLevel(v)):'—'}<br/>Lead Time: +{h}h</div></Popup></CircleMarker></Pane>
   <Sync loc={loc} zoom={zoom}/><Controls loc={loc} zoom={zoom}/></MapContainer></div>
  <BasemapSwitch kind={base} setKind={setBase} className="absolute left-3 bottom-3"/>
  <GradientLegend BINS={BINS} title={`${PARAMS[param].label.toUpperCase()} (${u}, scaled)`} className="absolute bottom-8 right-3"/></Card>;
}
