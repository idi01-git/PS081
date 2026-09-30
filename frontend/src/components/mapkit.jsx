// Shared map building blocks: reliable key-free basemaps + smooth canvas raster overlay.
import {useEffect,useState} from 'react';
import L from 'leaflet';
import {TileLayer,useMap} from 'react-leaflet';

const ESRI='https://server.arcgisonline.com/ArcGIS/rest/services';
const ESRI_ATTR='Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community';
// None of these providers need an API key.
export const BASEMAPS={
 satellite:{label:'Satellite',
  base:{url:`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`,attribution:ESRI_ATTR,maxNativeZoom:17,className:'tile-dim'},
  ref:{url:`${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`,attribution:'',maxNativeZoom:13}},
 dark:{label:'Dark',
  base:{url:`${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,attribution:'Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap contributors',maxNativeZoom:16},
  ref:{url:`${ESRI}/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,attribution:'',maxNativeZoom:16}},
 street:{label:'Street',
  base:{url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxNativeZoom:19},
  ref:null}};

// Basemap + (optional) label layer. Labels sit in their own pane above weather and boundaries.
export function BaseLayers({kind}){
 const b=BASEMAPS[kind]||BASEMAPS.satellite;
 return <>
  <TileLayer key={kind+'b'} {...b.base} maxZoom={12} crossOrigin="anonymous"/>
  {b.ref&&<TileLayer key={kind+'r'} {...b.ref} maxZoom={12} pane="lb" opacity={.9}/>}
 </>;
}

export function BasemapSwitch({kind,setKind,className='absolute left-3 bottom-3'}){
 return <div className={`${className} z-[1000] flex overflow-hidden rounded border border-[#172b4d] bg-[#0a1628]/95 text-[11px]`}>
  {Object.entries(BASEMAPS).map(([k,v])=><button key={k} onClick={()=>setKind(k)} className={`px-2.5 py-1 ${k===kind?'bg-[#1d6dff]':'hover:bg-[#10213c]'}`}>{v.label}</button>)}
 </div>;
}

export function useStates(){
 const [s,setS]=useState(null);
 useEffect(()=>{fetch('/india_states.geojson').then(r=>r.json()).then(setS).catch(()=>{})},[]);
 return s;
}

// ---- projection helpers (Web-Mercator so the raster lines up with tiles) ----
const RAD=Math.PI/180;
export const merc=la=>Math.log(Math.tan(Math.PI/4+la*RAD/2));
const unmerc=y=>Math.atan(Math.sinh(y))/RAD;

// Renders sample(la,lo)->[r,g,b,a(0..1)] into a canvas covering bounds=[south,west,north,east].
// Rows are spaced in Mercator space, so no latitude distortion. Browser bilinear scaling gives smooth results.
export function renderField(bounds,sample,W=640,post){
 const [s,w,n,e]=bounds,ys=merc(s),yn=merc(n),H=Math.round(W*(yn-ys)/((e-w)*RAD));
 const c=document.createElement('canvas');c.width=W;c.height=H;
 const ctx=c.getContext('2d'),img=ctx.createImageData(W,H),d=img.data;
 for(let j=0;j<H;j++){const la=unmerc(yn-(j+.5)/H*(yn-ys));
  for(let i=0;i<W;i++){const lo=w+(i+.5)/W*(e-w),p=sample(la,lo);if(!p||p[3]<=0)continue;
   const k=(j*W+i)*4;d[k]=p[0];d[k+1]=p[1];d[k+2]=p[2];d[k+3]=Math.round(255*Math.min(1,p[3]));}}
 ctx.putImageData(img,0,0);
 const proj=(la,lo)=>[(lo-w)/(e-w)*W,(yn-merc(la))/(yn-ys)*H];
 return post?post(c,proj):c;
}

// Leaflet ImageOverlay driven by a canvas; re-rendered when `deps` change.
export function FieldOverlay({bounds,build,deps,opacity=.72,pane}){
 const map=useMap();
 useEffect(()=>{
  const url=build().toDataURL('image/png');
  const layer=L.imageOverlay(url,[[bounds[0],bounds[1]],[bounds[2],bounds[3]]],{opacity,interactive:false,pane,className:'field-overlay'}).addTo(map);
  return()=>{map.removeLayer(layer)};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },deps);
 return null;
}

// Smooth colour ramp through the discrete BINS stops (ascending values).
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
export function makeRamp(BINS){
 const st=[...BINS].reverse().map(([t,c])=>[t,hex(c)]);
 return v=>{
  if(v<=st[0][0])return st[0][1];
  for(let i=1;i<st.length;i++)if(v<=st[i][0]){const [a,ca]=st[i-1],[b,cb]=st[i],f=(v-a)/(b-a);
   return [0,1,2].map(k=>ca[k]+(cb[k]-ca[k])*f);}
  return st[st.length-1][1];};
}
// Fade alpha for values ~0..2 so light rain blends into the basemap, and near the raster edge.
export const rainAlpha=v=>Math.max(0,Math.min(1,v/1.5));
export const edgeFade=(la,lo,[s,w,n,e],m=1.5)=>Math.max(0,Math.min(1,(la-s)/m,(n-la)/m,(lo-w)/m,(e-lo)/m));

// Gradient legend used by the precipitation maps.
export function GradientLegend({BINS,title,className}){
 const asc=[...BINS].reverse(),grad=asc.map(([,c],i)=>`${c} ${(i/(asc.length-1)*100).toFixed(1)}%`).join(',');
 return <div className={`${className} z-[1000] rounded border border-[#172b4d] bg-[#0a1628]/95 p-2 text-[10px]`}>
  <div className="mb-1 font-semibold">{title}</div>
  <div className="flex gap-2"><div className="w-3 rounded-sm" style={{background:`linear-gradient(to top,${grad})`,height:BINS.length*15}}/>
   <div className="flex flex-col-reverse justify-between" style={{height:BINS.length*15}}>{asc.map(([t],i)=><div key={t} className="leading-[15px]">{t===0?'0':t===300?'300+':`${t}–${asc[i+1][0]}`}</div>)}</div></div>
 </div>;
}

// Mock precipitation field: smooth Gaussian weather systems only (no noise / stripe texture).
export const wxField=(la,lo,loc,peak)=>{const g=(a,b,p,s2)=>p*Math.exp(-((la-a)**2+(lo-b)**2)/s2),k=.35+.65*Math.min(1,peak/150);
 return k*3+g(loc.lat,loc.lon,peak,11)+g(loc.lat,loc.lon,peak*.35,60)+g(17,90,peak*.3,20)+g(23,72.5,peak*.22,12)+g(26,92,peak*.32,14)+g(9.5,76,peak*.25,7)+g(20,78,peak*.14,22)+g(31,79,peak*.18,10);};
