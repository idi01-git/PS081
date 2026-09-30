// ALL DEMO DATA LIVES HERE. Prototype values only — NOT NCMRWF/IMD observations.
// FUTURE API: replace the get*() helpers with fetch() calls (see src/App.jsx).
export const MODELS=['ECMWF','GFS','ICON','JMA','AIFS'];
export const COLORS={Blended:'#ff6b6b',ECMWF:'#ff3b3b',GFS:'#1f7bff',ICON:'#1fd06b',JMA:'#9b5cf6',AIFS:'#fbbf24'};
export const HORIZONS=[6,12,24,48,72,120];
export const HSCALE={6:.12,12:.25,24:.5,48:.8,72:1,120:1.2};
export const PARAMS={rain:{label:'Precipitation',unit:'mm',max:300},temp:{label:'Temperature',unit:'°C',max:50},wind:{label:'Wind Speed',unit:'km/h',max:100},pres:{label:'Pressure',unit:'hPa',max:1100}};
export const IMD_THRESHOLD=64.5;
const L=(id,name,state,lat,lon,base,regime,season,weights,factors,rmse,risk)=>({id,name,state,lat,lon,base,regime,season,weights,factors,rmse,...risk});
const W=(a,b,c,d,e)=>({ECMWF:a,GFS:b,ICON:c,JMA:d,AIFS:e});
const R=(g,e,i,j,a,b)=>({GFS:g,ECMWF:e,ICON:i,JMA:j,AIFS:a,Blended:b});
export const LOCATIONS=[
L('chennai','Chennai','Tamil Nadu',13.0827,80.2707,{rain:132,temp:29,wind:28,pres:1004,hum:86},'Heavy Rainfall','Monsoon',W(42,28,15,10,5),W(1.12,.92,.83,.72,.97),R(78,62,71,68,66,48),{cyclone:'LOW',cycloneTxt:'No significant cyclone risk in next 72h',heat:'NO',heatD:.8,gust:48,gustLvl:'MODERATE',consensus:88,agree:4}),
L('delhi','Delhi NCR','Delhi',28.6139,77.209,{rain:18,temp:36,wind:22,pres:1002,hum:52},'Hot & Humid','Post-monsoon',W(30,34,14,12,10),W(1.05,.95,.8,.9,1.1),R(45,41,52,49,44,33),{cyclone:'LOW',cycloneTxt:'No cyclone activity expected',heat:'WATCH',heatD:2.4,gust:30,gustLvl:'LOW',consensus:74,agree:3}),
L('mumbai','Mumbai','Maharashtra',19.076,72.8777,{rain:96,temp:28,wind:36,pres:1006,hum:90},'Monsoon Trough','Monsoon',W(38,22,20,8,12),W(1.08,.9,.95,.8,1.02),R(69,55,60,66,58,44),{cyclone:'LOW',cycloneTxt:'Weak offshore vortex; monitor',heat:'NO',heatD:.2,gust:44,gustLvl:'MODERATE',consensus:81,agree:4}),
L('kolkata','Kolkata','West Bengal',22.5726,88.3639,{rain:108,temp:30,wind:34,pres:1003,hum:88},'Bay of Bengal Low','Monsoon',W(35,30,10,15,10),W(1.1,.98,.78,.85,1.01),R(74,60,68,63,62,50),{cyclone:'MODERATE',cycloneTxt:'Depression possible over N. Bay in 72h',heat:'NO',heatD:.5,gust:52,gustLvl:'MODERATE',consensus:79,agree:4}),
L('lucknow','Lucknow','Uttar Pradesh',26.8467,80.9462,{rain:42,temp:33,wind:20,pres:1001,hum:70},'Convective','Monsoon',W(42,28,15,10,5),W(1.06,.94,.9,.8,1.04),R(60,49,58,55,52,41),{cyclone:'LOW',cycloneTxt:'No cyclone risk',heat:'NO',heatD:1.1,gust:28,gustLvl:'LOW',consensus:68,agree:3}),
L('kerala','Kerala','Kerala',10.8505,76.2711,{rain:165,temp:27,wind:31,pres:1007,hum:92},'Orographic Rainfall','Monsoon',W(36,20,14,10,20),W(1.15,.85,.9,.75,1.05),R(84,66,75,72,63,49),{cyclone:'LOW',cycloneTxt:'No significant cyclone risk in next 72h',heat:'NO',heatD:-.3,gust:40,gustLvl:'MODERATE',consensus:90,agree:5}),
L('himalaya','Himalayan Belt','Uttarakhand',30.0668,79.0193,{rain:74,temp:14,wind:26,pres:860,hum:78},'Cloudburst Prone','Monsoon',W(28,18,12,10,32),W(1.2,.7,.9,.8,1.25),R(90,70,80,77,58,52),{cyclone:'LOW',cycloneTxt:'Not applicable (inland)',heat:'NO',heatD:-1.2,gust:38,gustLvl:'MODERATE',consensus:71,agree:3}),
];
export const REGIONS=[
{name:'Tamil Nadu',lat:11,lon:78.5,w:W(42,28,15,10,5)},{name:'Kerala',lat:10.5,lon:76.3,w:W(36,20,14,10,20)},
{name:'Maharashtra',lat:19.5,lon:76,w:W(38,22,20,8,12)},{name:'Gujarat & Rajasthan',lat:24.5,lon:72,w:W(20,40,15,15,10)},
{name:'Uttar Pradesh',lat:26.5,lon:80.5,w:W(42,28,15,10,5)},{name:'West Bengal & Odisha',lat:21.5,lon:86.5,w:W(35,30,10,15,10)},
{name:'Central India',lat:22,lon:79.5,w:W(25,22,12,31,10)},{name:'Northeast India',lat:26,lon:93,w:W(18,15,10,12,45)},
{name:'Himalayan Belt',lat:31,lon:78,w:W(28,18,12,10,32)},{name:'Andhra & Telangana',lat:16.5,lon:79,w:W(30,26,12,14,18)},
];
export const dominant=w=>Object.entries(w).sort((a,b)=>b[1]-a[1])[0][0];
export const getForecast=(loc,p,h)=>{const s=HSCALE[h],b=loc.base[p];return Math.round((p==='rain'?b*s:b*(1+(s-1)*.03))*10)/10;};
export const getModelForecasts=(loc,p,h)=>{const bl=getForecast(loc,p,h),k=p==='rain'?1:.1,o={Blended:bl};MODELS.forEach(m=>o[m]=Math.round(bl*(1+(loc.factors[m]-1)*k)*10)/10);return o;};
export const getTimeSeries=(loc,p,h)=>{const mf=getModelForecasts(loc,p,h),step=h/6;return Array.from({length:7},(_,i)=>{const s=p==='rain'?Math.pow(i/6,1.6):1+.04*Math.sin(i*1.1);const v=k=>Math.round(mf[k]*s*10)/10;const row={t:`${Math.round(i*step)}h`,Observed:i<=2?Math.round(v('Blended')*(1+.03*Math.sin(i+1))*10)/10:null};['Blended',...MODELS].forEach(k=>row[k]=v(k));const u=mf.Blended*s*(.04+.14*i/6);row.band=[Math.round((row.Blended-u)*10)/10,Math.round((row.Blended+u)*10)/10];return row;});};
export const riskLevel=v=>v>=IMD_THRESHOLD?'HIGH RISK':v>=30?'MODERATE':'LOW';
export const CASES=[
{t:'Chennai Heavy Rainfall (Demo Replay)',d:'Hybrid blend reduced peak-rain error vs best single model (illustrative).',loc:'chennai'},
{t:'Kerala Orographic Burst (Demo Replay)',d:'AIFS weight rose with lead time in the orographic regime (illustrative).',loc:'kerala'},
{t:'Himalayan Cloudburst Watch (Demo Replay)',d:'Regime-aware weighting favoured AIFS in complex terrain (illustrative).',loc:'himalaya'},
{t:'Bay of Bengal Depression (Demo Replay)',d:'ECMWF-led blend with wide spread flagged uncertainty (illustrative).',loc:'kolkata'}];
