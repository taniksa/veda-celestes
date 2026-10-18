// Explicit, inspectable traditional conventions. No stochastic or network dependency.
export const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
export const LORDS=['mars','venus','mercury','moon','sun','mercury','venus','mars','jupiter','saturn','saturn','jupiter'];
export const DASHA_LORDS=['ketu','venus','sun','moon','mars','rahu','jupiter','saturn','mercury'];
export const DASHA_YEARS=[7,20,6,10,7,18,16,19,17];
export const NAKSHATRAS=['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
export const angle=n=>((n%360)+360)%360;
const YEAR=365.25*86400000;
const iso=t=>new Date(t).toISOString();
export function navamsa(longitude){const l=angle(longitude*9);return {longitude:l,sign:SIGNS[Math.floor(l/30)],degree:l%30};}
export function vimshottari(moonLongitude,birthTimestamp,referenceTimestamp){
  const birth=+new Date(birthTimestamp),reference=+new Date(referenceTimestamp),moon=angle(moonLongitude);
  const mansion=moon/(40/3),index=Math.floor(mansion)%9,elapsed=mansion%1;
  let cursor=birth-elapsed*DASHA_YEARS[index]*YEAR;
  const periods=[],coverageEnd=birth+120*YEAR;
  for(let n=0;n<11&&cursor<coverageEnd;n++){
    const i=(index+n)%9,end=cursor+DASHA_YEARS[i]*YEAR,subperiods=[];
    let sub=cursor;
    for(let k=0;k<9;k++){
      const j=(i+k)%9,next=sub+DASHA_YEARS[i]*DASHA_YEARS[j]/120*YEAR;
      if(next>birth&&sub<coverageEnd)subperiods.push({lord:DASHA_LORDS[j],start:iso(Math.max(sub,birth)),end:iso(Math.min(next,coverageEnd)),active:reference>=Math.max(sub,birth)&&reference<Math.min(next,coverageEnd)});
      sub=next;
    }
    periods.push({lord:DASHA_LORDS[i],start:iso(Math.max(cursor,birth)),end:iso(Math.min(end,coverageEnd)),fullStart:iso(cursor),active:reference>=Math.max(cursor,birth)&&reference<Math.min(end,coverageEnd),subperiods});cursor=end;
  }
  const active=periods.find(p=>p.active);
  return {yearDays:365.25,convention:'Vimshottari from Lahiri Moon; 365.25-day years; half-open UTC intervals; 120 years from birth. Other year-length conventions differ.',birthLord:DASHA_LORDS[index],balanceYears:(1-elapsed)*DASHA_YEARS[index],periods,currentLord:active?.lord||null,currentSubLord:active?.subperiods.find(p=>p.active)?.lord||null,state:reference<birth?'before_birth':reference>=coverageEnd?'outside_coverage':'available'};
}
export function dignity(body,longitude){
  const index=Math.floor(angle(longitude)/30),domiciles={sun:[4],moon:[3],mercury:[2,5],venus:[1,6],mars:[0,7],jupiter:[8,11],saturn:[9,10]},exaltations={sun:0,moon:1,mercury:5,venus:11,mars:9,jupiter:3,saturn:6};
  if(!domiciles[body])return 'not assigned';
  const conditions=[];
  if(domiciles[body].includes(index))conditions.push('domicile');
  if(exaltations[body]===index)conditions.push('exaltation');
  if(domiciles[body].some(i=>(i+6)%12===index))conditions.push('detriment');
  if((exaltations[body]+6)%12===index)conditions.push('fall');
  return conditions.join(' · ')||'no major sign dignity';
}
export function annualProfection(chart,birthInput,referenceTimestamp){
  const birth=new Date(chart.instant),reference=new Date(referenceTimestamp);
  if(reference<birth)return {state:'before_birth',convention:'Age zero starts in the first whole-sign house; changes on local birthday. Feb 29 birthdays use Feb 28 in non-leap years.'};
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:birthInput.timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(reference).map(p=>[p.type,p.value]));
  const [by,bm,bd]=birthInput.date.split('-').map(Number),[bh,bmin,bs=0]=birthInput.time.split(':').map(Number);
  const anniversaryDay=Math.min(bd,new Date(Date.UTC(+p.year,bm,0)).getUTCDate());
  const now=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second),anniversary=Date.UTC(+p.year,bm-1,anniversaryDay,bh,bmin,bs);
  const age=+p.year-by-(now<anniversary?1:0),house=age%12+1,signIndex=(Math.floor(chart.western.ascendant.longitude/30)+age)%12;
  return {state:'available',age,house,sign:SIGNS[signIndex],lord:LORDS[signIndex],convention:'Annual whole-sign profection at local civil birthday; traditional seven-planet rulers. Feb 29 uses Feb 28 in non-leap years.'};
}
export function vedicAspects(planets){
  const result=[];
  for(const [body,p] of Object.entries(planets)){
    if(!['sun','moon','mercury','venus','mars','jupiter','saturn'].includes(body))continue;
    const offsets=body==='mars'?[4,7,8]:body==='jupiter'?[5,7,9]:body==='saturn'?[3,7,10]:[7];
    for(const [target,q] of Object.entries(planets))if(target!==body&&['sun','moon','mercury','venus','mars','jupiter','saturn'].includes(target)){
      const relative=(Math.floor(q.longitude/30)-Math.floor(p.longitude/30)+12)%12+1;
      if(offsets.includes(relative))result.push({body,target,relativeHouse:relative});
    }
  }
  return result;
}
