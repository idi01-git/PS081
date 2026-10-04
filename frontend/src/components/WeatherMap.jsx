import {useEffect,useMemo,useRef,useState} from 'react';
import L from 'leaflet';
import {MapContainer,Pane,GeoJSON,CircleMarker,Popup,Tooltip,useMap,useMapEvents} from 'react-leaflet';
import {Plus,Minus,Home,Crosshair,Layers,Clock,Play,Pause,ChevronLeft,ChevronRight,ChevronDown,X} from 'lucide-react';
import {Card,DemoTag} from './Panels';
import {BINS,colorFor} from './Maps'; // existing precipitation palette, reused unchanged
import {BaseLayers,BasemapSwitch,FieldOverlay,GradientLegend,renderField,makeRamp,rainAlpha,edgeFade,useStates,wxField} from './mapkit';
import {MODELS,PARAMS,getModelForecasts,riskLevel,HORIZONS} from '../data/mockData';

const CITIES=[['Delhi',28.61,77.21],['Mumbai',19.08,72.88],['Kolkata',22.57,88.36],['Chennai',13.08,80.27],['Bengaluru',12.97,77.59],['Hyderabad',17.39,78.49],['Lucknow',26.85,80.95],['Ahmedabad',23.02,72.57],['Bhopal',23.26,77.41],['Jaipur',26.91,75.79],['Patna',25.59,85.14],['Bhubaneswar',20.3,85.82],['Guwahati',26.14,91.74]];
const RAMP=makeRamp(BINS),EXT=[5,66,38,99]; // raster extent [south,west,north,east]
const INDIA=[[19,80],4.5];

function Sync({loc,zoom}){
  const m=useMap();
  const first=useRef(true);
  useEffect(()=>{
    if(first.current){first.current=false;return;}
    m.flyTo([loc.lat,loc.lon],zoom,{duration:.5});
  },[loc.id]);
  useEffect(()=>{
    const ro=new ResizeObserver(()=>m.invalidateSize());
    ro.observe(m.getContainer());
    setTimeout(()=>m.invalidateSize(),200);
    return()=>ro.disconnect();
  },[]);
  return null;
}

function Controls({loc,zoom}){
  const m=useMap(),r=useRef();
  useEffect(()=>{
    L.DomEvent.disableClickPropagation(r.current);
    L.DomEvent.disableScrollPropagation(r.current);
  },[]);
  const B=({f,i:I,t})=>(
    <button
      title={t}
      onClick={f}
      className="grid h-7 w-7 place-items-center rounded border border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-[#172b4d] dark:bg-[#0a1628]/95 dark:text-slate-300 dark:hover:bg-[#1d6dff] dark:hover:text-white shadow-xs transition-colors"
    >
      <I size={14}/>
    </button>
  );
  return (
    <div ref={r} className="absolute right-3 top-3 z-[1000] flex flex-col gap-1">
      <B f={()=>m.zoomIn()} i={Plus} t="Zoom in"/>
      <B f={()=>m.zoomOut()} i={Minus} t="Zoom out"/>
      <B f={()=>m.flyTo(...INDIA)} i={Home} t="Reset to India"/>
      <B f={()=>m.flyTo([loc.lat,loc.lon],zoom)} i={Crosshair} t="Locate selected region"/>
    </div>
  );
}

function Cities(){
  const [z,setZ]=useState(5);
  const m=useMapEvents({zoomend:()=>setZ(m.getZoom())});
  return CITIES.map(([n,la,lo])=>(
    <CircleMarker key={n} center={[la,lo]} radius={3} pane="mk" pathOptions={{color:'#0b1526',weight:1,fillColor:'#fff',fillOpacity:1}}>
      <Tooltip permanent={z>=6} direction="right" offset={[5,0]} opacity={.62}>{n}</Tooltip>
    </CircleMarker>
  ));
}

export function WeatherMap({loc,param,h,setH,layer,setLayer,height='h-[420px]'}){
  const states=useStates();
  const [menu,setMenu]=useState(false);
  const [timelineOpen,setTimelineOpen]=useState(false);
  const [base,setBase]=useState('satellite');
  const menuRef=useRef(null);
  const timelineRef=useRef(null);

  // Close menus on click outside
  useEffect(()=>{
    function handleClickOutside(e){
      if(menuRef.current && !menuRef.current.contains(e.target)){
        setMenu(false);
      }
      if(timelineRef.current && !timelineRef.current.contains(e.target)){
        setTimelineOpen(false);
      }
    }
    document.addEventListener('mousedown',handleClickOutside);
    return()=>document.removeEventListener('mousedown',handleClickOutside);
  },[]);

  const mf=getModelForecasts(loc,param,h);
  const v=layer==='Blended'?mf.Blended:mf[layer];
  const u=PARAMS[param].unit;
  const peak=v/PARAMS[param].max*300;
  const cacheKey=`${loc.id}_${param}_${layer}_${h}_${Math.round(peak)}`;
  const build=()=>renderField(EXT,(la,lo)=>{
    const d2=(la-loc.lat)**2+(lo-loc.lon)**2,n=Math.sin(la*1.7)*Math.cos(lo*2.1);
    const x=wxField(la,lo,loc,peak);
    const a=rainAlpha(x)*edgeFade(la,lo,EXT);
    if(a<=0)return null;
    const c=RAMP(x);
    return [c[0],c[1],c[2],a];
  },260);
  const zoom=5.5;

  return (
    <Card c="relative overflow-hidden flex flex-col h-full">
      {/* Unified Card Header Bar matching TrustMapCard */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#172b4d] px-3 py-2 bg-slate-50/80 dark:bg-[#071120]/80 min-h-[48px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="rounded-md border border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:bg-[#0a1628] dark:text-cyan-200 px-3 py-1.5 text-sm font-semibold truncate">
            {layer} Forecast — {PARAMS[param].label}
          </span>
          <div ref={menuRef} className="relative">
            <button
              onClick={()=>setMenu(!menu)}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-[#172b4d] bg-white dark:bg-[#050d1a] px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-blue-400 dark:hover:border-cyan-400 shadow-xs transition-colors"
            >
              <Layers size={13} className="text-blue-600 dark:text-cyan-400 shrink-0"/>
              <span>Weather Layers</span>
            </button>
            {menu && (
              <div className="absolute left-0 mt-1 w-44 rounded-lg border border-slate-200 dark:border-[#172b4d] bg-white dark:bg-[#0a1628] p-1 text-xs shadow-2xl z-[1500]">
                {['Blended',...MODELS].map(m=>(
                  <button
                    key={m}
                    onClick={()=>{setLayer(m);setMenu(false);}}
                    className={`flex w-full items-center justify-between rounded px-2.5 py-1 text-left font-medium transition-colors ${
                      m===layer
                        ? 'bg-[#1d6dff] !text-white font-semibold'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#10213c]'
                    }`}
                  >
                    <span>{m==='Blended'?'☔ Blended Forecast':m}</span>
                    {m===layer && <span className="text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="flex items-center gap-2 shrink-0">
          <DemoTag/>
        </div>
      </div>

      {/* Map Surface */}
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

        <MapContainer zoomSnap={.5} center={INDIA[0]} zoom={INDIA[1]} minZoom={4} maxZoom={10} zoomControl={false} maxBounds={[[-2,58],[42,108]]} className="h-full w-full">
          <Pane name="wx" style={{zIndex:250}}>
            <FieldOverlay bounds={EXT} build={build} cacheKey={cacheKey} deps={[loc.id,param,layer,h]} opacity={.62} pane="wx"/>
          </Pane>
          <Pane name="bd" style={{zIndex:350}}>
            {states && <GeoJSON data={states} pane="bd" interactive={false} style={{color:base==='street'?'#475569':'#e2e8f0',weight:.9,fill:false,opacity:.7}}/>}
          </Pane>
          <Pane name="lb" style={{zIndex:450}}/>
          <BaseLayers kind={base}/>
          <Pane name="mk" style={{zIndex:600}}>
            <Cities/>
            <CircleMarker center={[loc.lat,loc.lon]} radius={9} pane="mk" pathOptions={{color:'#fff',weight:3,fillColor:'#2563eb',fillOpacity:1}}>
              <Popup>
                <div className="text-xs text-slate-800">
                  <b>{loc.name}</b><br/>Forecast: {v} {u}<br/>Risk: {param==='rain' ? (v >= 115.5 ? 'Extreme Deluge' : v >= 64.5 ? 'Heavy Rain' : v >= 35.5 ? 'Moderate Rain' : 'Light Rain') : riskLevel(v, param, loc)}<br/>Lead Time: +{h}h
                </div>
              </Popup>
            </CircleMarker>
          </Pane>
          <Sync loc={loc} zoom={zoom}/>
          <Controls loc={loc} zoom={zoom}/>
        </MapContainer>

        {/* Basemap Switcher on Bottom Left */}
        <BasemapSwitch kind={base} setKind={setBase} className="absolute left-3 bottom-3"/>

        {/* Gradient Legend on Bottom Right */}
        <GradientLegend BINS={BINS} title={`${PARAMS[param].label.toUpperCase()} (${u}, scaled)`} className="absolute bottom-3 right-3"/>
      </div>
    </Card>
  );
}
