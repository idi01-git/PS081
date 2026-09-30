import {useState} from 'react';
import {PieChart,Pie,Cell,ResponsiveContainer,ComposedChart,Area,Line,XAxis,YAxis,CartesianGrid,Tooltip,BarChart,Bar,LabelList} from 'recharts';
import {Lightbulb,Trophy} from 'lucide-react';
import {Card,DemoTag} from './Panels';
import {COLORS,MODELS,PARAMS,getTimeSeries} from '../data/mockData';
export function ModelWeightChart({loc}){
 const data=MODELS.map(m=>({name:m,value:loc.weights[m]}));
 return <Card c="p-4"><div className="mb-1 flex items-center justify-between"><b>Model Weight Distribution <span className="font-normal text-slate-400">({loc.name})</span></b><DemoTag/></div>
  <div className="flex items-center"><div className="relative h-44 w-44"><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">{data.map(d=><Cell key={d.name} fill={COLORS[d.name]}/>)}</Pie></PieChart></ResponsiveContainer><div className="absolute inset-0 grid place-items-center text-center text-xs font-semibold">Weighted<br/>Ensemble</div></div>
   <div className="flex-1 space-y-1 text-sm">{data.map(d=><div key={d.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{background:COLORS[d.name]}}/><span className="flex-1">{d.name}</span><b>{d.value}%</b></div>)}</div></div>
  <div className="mt-2 flex gap-2 rounded-md border border-[#172b4d] bg-[#071120] p-2 text-[11px] text-slate-300"><Lightbulb size={16} className="shrink-0 text-yellow-400"/><span><b>Why these weights?</b> ECMWF receives the highest weight because historical validation data shows lower error under similar regional and weather-regime conditions.</span></div></Card>;
}
export function ForecastTimeSeries({loc,param,h}){
 const data=getTimeSeries(loc,param,h),P=PARAMS[param],TC=m=>m==='Blended'?'#ff4d4f':COLORS[m],ax={stroke:'#7f93b2',fontSize:11};
 const Sel=({t})=><span className="rounded-md border border-[#172b4d] bg-[#071120] px-3 py-1 text-xs">{t} ⌄</span>;
 return <Card c="p-4"><div className="mb-2 flex flex-wrap items-center gap-3"><b className="text-[15px]">Multi-Model Ensemble Forecast <span className="font-normal text-slate-400">({loc.name})</span></b><Sel t={`${P.label} (${P.unit})`}/><Sel t={`+${h}h`}/><span className="ml-auto"><DemoTag/></span></div>
  <div className="flex"><div className="h-72 min-w-0 flex-1"><ResponsiveContainer><ComposedChart data={data} margin={{top:8,right:12,left:0,bottom:4}}><CartesianGrid stroke="#16294a" strokeDasharray="2 4"/>
   <XAxis dataKey="t" {...ax} height={44} label={{value:'Forecast Lead Time',position:'insideBottom',offset:-4,fill:'#7f93b2',fontSize:11}}/>
   <YAxis {...ax} width={58} domain={[0,'auto']} label={{value:`${P.label} (${P.unit})`,angle:-90,position:'insideLeft',fill:'#7f93b2',fontSize:11,style:{textAnchor:'middle'}}}/>
   <Tooltip formatter={v=>Array.isArray(v)?`${v[0]} – ${v[1]} ${P.unit}`:`${v} ${P.unit}`} contentStyle={{background:'#0a1628',border:'1px solid #172b4d',fontSize:12,borderRadius:6}}/>
   <Area type="monotone" dataKey="band" name="Uncertainty Range" fill="#8b7cf6" fillOpacity={.3} stroke="none"/>
   {MODELS.map(m=><Line type="monotone" key={m} dataKey={m} stroke={TC(m)} strokeDasharray="5 4" dot={false} strokeWidth={1.4}/>)}
   <Line type="monotone" dataKey="Blended" name="Blended (Ours)" stroke={TC('Blended')} strokeWidth={3.5} dot={{r:3.5,fill:'#fff',stroke:'#ff4d4f'}}/>
   <Line type="monotone" dataKey="Observed" name="Observed (Past)" stroke="#fff" strokeWidth={2} dot={{r:4,fill:'#fff'}} connectNulls={false}/></ComposedChart></ResponsiveContainer></div>
  <div className="hidden w-40 shrink-0 space-y-2 pl-3 pt-4 text-xs sm:block">{[['Observed (Past)','Observed'],['Blended (Ours)','Blended'],...MODELS.map(m=>[m,m])].map(([l,m])=><div key={m} className="flex items-center gap-2"><svg width="26" height="8"><line x1="0" x2="26" y1="4" y2="4" stroke={m==='Observed'?'#fff':TC(m)} strokeWidth={m==='Blended'?3.5:1.6} strokeDasharray={m==='Observed'||m==='Blended'?'':'5 3'}/>{m==='Observed'&&<circle cx="13" cy="4" r="3" fill="#fff"/>}</svg>{l}</div>)}
   <div className="flex items-center gap-2"><span className="h-3 w-6 rounded-sm bg-[#8b7cf6]/40"/>Uncertainty Range</div></div></div></Card>;
}
const MET={RMSE:[r=>r,'RMSE (mm)',true],MAE:[r=>Math.round(r*.74),'MAE (mm)',true],'False Alarm Rate':[r=>Math.round(r*.45),'FAR (%)',true],'Hit Rate':[r=>Math.round(97-r*.6),'Hit Rate (%)',false]};
export function VerificationScorecard({loc}){
 const [tab,setTab]=useState('RMSE'),[f,label,lower]=MET[tab];
 const data=['GFS','ECMWF','ICON','JMA','AIFS','Blended'].map(k=>({k,v:f(loc.rmse[k])}));
 const best=data.filter(d=>d.k!=='Blended').reduce((a,b)=>(lower?b.v<a.v:b.v>a.v)?b:a),bl=data[5].v;
 const pct=Math.abs((best.v-bl)/best.v*100).toFixed(1);
 return <Card c="p-4"><div className="mb-2 flex items-center justify-between"><b>Verification Scorecard <span className="font-normal text-slate-400">(Past 30 Days)</span></b><DemoTag t="Historical Validation — Prototype Data"/></div>
  <div className="mb-2 flex gap-1">{Object.keys(MET).map(t=><button key={t} onClick={()=>setTab(t)} className={`flex-1 rounded border px-2 py-1 text-xs ${t===tab?'border-blue-400 bg-[#1d6dff]/30':'border-[#172b4d]'}`}>{t}</button>)}</div>
  <div className="h-44"><ResponsiveContainer><BarChart data={data}><CartesianGrid stroke="#173050" vertical={false}/><XAxis dataKey="k" stroke="#7f93b2" fontSize={11}/><YAxis stroke="#7f93b2" fontSize={11} width={30}/><Bar dataKey="v" radius={[3,3,0,0]}>{data.map(d=><Cell key={d.k} fill={COLORS[d.k]}/>)}<LabelList dataKey="v" position="top" fill="#dbe7f7" fontSize={11}/></Bar></BarChart></ResponsiveContainer></div>
  <div className="mt-1 flex items-center gap-3 rounded-md border border-green-600/40 bg-green-950/40 p-2"><Trophy className="text-yellow-400"/><div><b className="text-green-400">{pct}% {lower?'lower':'higher'} {tab} (demo)</b><div className="text-[11px] text-slate-300">Illustrative vs. best standalone model ({best.k}). Not a verified NCMRWF result.</div></div></div></Card>;
}
export function ExplainabilityCard({loc,h}){
 const F=[['📍 Region',`${loc.name}, ${loc.state}`],['📅 Season',loc.season],['⏱ Lead Time',`${h} hours`],['🌦 Weather Regime',loc.regime],['📊 Historical Skill','Model-specific validation']];
 return <Card c="p-4"><div className="mb-2 flex justify-between"><b>Why did the system choose these weights?</b><DemoTag/></div>
  <div className="grid gap-2 sm:grid-cols-5">{F.map(([a,b])=><div key={a} className="rounded border border-[#172b4d] bg-[#071120] p-2 text-xs"><div className="text-slate-400">{a}</div><b>{b}</b></div>)}</div>
  <div className="mt-2 flex flex-wrap gap-2 text-xs">{MODELS.map(m=><span key={m} className="rounded px-2 py-1" style={{background:COLORS[m]+'33',border:`1px solid ${COLORS[m]}`}}>{m} → {loc.weights[m]}%</span>)}</div>
  <p className="mt-2 text-[11px] text-slate-300">The adaptive weighting engine increases the contribution of models that historically perform better under similar regional, seasonal and weather-regime conditions.</p></Card>;
}
