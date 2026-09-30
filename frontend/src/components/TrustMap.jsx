import {useMemo,useState} from 'react';
import {MapContainer,Pane,GeoJSON} from 'react-leaflet';
import {Info} from 'lucide-react';
import {Card,DemoTag} from './Panels';
import {BaseLayers,BasemapSwitch,useStates} from './mapkit';
import {COLORS,MODELS,REGIONS,dominant} from '../data/mockData';
const PANES=[['wx',250],['bd',350],['lb',450],['mk',600]];
const Pn=()=>PANES.map(([n,z])=><Pane key={n} name={n} style={{zIndex:z}}/>);
export function TrustMapCard({onView,height='h-[384px]'}){
 const states=useStates(),[sel,setSel]=useState(null),[base,setBase]=useState('satellite');
 const reg=useMemo(()=>{if(!states)return{};const o={};states.features.forEach(f=>{const r=f.geometry.coordinates.reduce((a,b)=>b[0].length>a[0].length?b:a)[0];
  const la=r.reduce((s,p)=>s+p[1],0)/r.length,lo=r.reduce((s,p)=>s+p[0],0)/r.length;
  o[f.properties.name]=REGIONS.reduce((b,x)=>((x.lat-la)**2+(x.lon-lo)**2<(b.lat-la)**2+(b.lon-lo)**2?x:b));});return o;},[states]);
 const share=MODELS.map(m=>[m,Object.values(reg).filter(r=>dominant(r.w)===m).length]),tot=Object.keys(reg).length||1;
 return <Card c="relative overflow-hidden"><div className="flex items-center gap-2 border-b border-[#172b4d] p-2"><span className="rounded-md border border-blue-500 bg-[#071120] px-3 py-1.5 text-sm font-medium">Model Trust & Dominance Map</span><Info size={14} className="text-slate-400"/><span className="ml-auto"><DemoTag/></span></div>
  <div className={`relative ${height}`}><MapContainer center={[22,80]} zoom={4.25} zoomSnap={.25} minZoom={3} maxZoom={7} zoomControl={false} className="h-full w-full"><Pn/><BaseLayers kind={base}/>
   {states&&<GeoJSON key={sel} data={states} pane="bd" style={f=>{const r=reg[f.properties.name];return{color:'#e2e8f0',weight:f.properties.name===sel?2.2:.8,fillColor:r?COLORS[dominant(r.w)]:'#334155',fillOpacity:.68}}}
    onEachFeature={(f,l)=>l.on('click',()=>setSel(f.properties.name))}/>}</MapContainer>
   <BasemapSwitch kind={base} setKind={setBase} className="absolute left-3 bottom-3"/>
   <div className="absolute right-3 top-3 z-[1000] w-44 rounded-lg border border-[#172b4d] bg-[#0a1628]/95 p-3 text-xs"><div className="mb-1 font-semibold">Dominant Model</div>
    {share.map(([m,n])=><div key={m} className="flex items-center gap-2 py-0.5"><span className="h-2.5 w-2.5 rounded-full" style={{background:COLORS[m]}}/>{m} ({Math.round(n/tot*100)}%)</div>)}
    {sel&&reg[sel]&&<div className="mt-2 border-t border-[#172b4d] pt-2"><b>{sel}</b><div className="text-[10px] text-slate-400">Region: {reg[sel].name}</div>{MODELS.map(m=><div key={m} className="flex items-center gap-1 py-px"><span className="w-11">{m}</span><i className="h-1.5 rounded" style={{width:`${reg[sel].w[m]*1.4}%`,background:COLORS[m]}}/><span className="ml-auto">{reg[sel].w[m]}%</span></div>)}</div>}
    <div className="mt-2 text-[9px] leading-tight text-slate-400">Colour shows the model with the highest weight in each region. Share = % of states.</div>
    <button onClick={onView} className="mt-2 w-full rounded border border-[#172b4d] py-1 hover:border-blue-500">View Regional Weights</button></div></div></Card>;
}
