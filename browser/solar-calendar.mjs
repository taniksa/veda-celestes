const DAY=86400000;
const dateKey=(instant,timezone)=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(instant)).map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}`;};
export function solarAltitude(swe,jd,latitude,longitude){
  const p=swe.calculatePosition(jd,0,4|2048),h=swe.calculateHouses(jd,latitude,longitude,'W'),r=Math.PI/180;
  return Math.asin(Math.max(-1,Math.min(1,Math.sin(latitude*r)*Math.sin(p.latitude*r)+Math.cos(latitude*r)*Math.cos(p.latitude*r)*Math.cos((h.armc-p.longitude)*r))))/r;
}
export function solarEvents(swe,instant,latitude,longitude){
  const center=+new Date(instant),start=center-36*3600000,end=center+36*3600000,events=[];
  const height=t=>solarAltitude(swe,t/DAY+2440587.5,latitude,longitude)+.833;
  let previous=start,old=height(start);
  for(let t=start+20*60000;t<=end;t+=20*60000){
    const next=height(t);
    if((old<0&&next>=0)||(old>=0&&next<0)){
      let a=previous,b=t,left=old;
      while(b-a>250){const mid=(a+b)/2,v=height(mid);if((left<0)===(v<0)){a=mid;left=v;}else b=mid;}
      events.push({kind:old<0?'rise':'set',timestamp:(a+b)/2});
    }
    previous=t;old=next;
  }
  return events;
}
export function planetaryHours(events,instant,timezone){
  const timestamp=+new Date(instant),rises=events.filter(e=>e.kind==='rise');
  const rise=rises.filter(e=>e.timestamp<=timestamp).at(-1),next=rises.find(e=>e.timestamp>timestamp),set=events.find(e=>e.kind==='set'&&e.timestamp>rise?.timestamp&&e.timestamp<next?.timestamp);
  const convention='Unequal seasonal hours; standard Sun-centre altitude −0.833°, sea level, flat horizon. No terrain or local weather correction. Shared medieval convention, not exclusively Arabic.';
  if(!rise||!next||!set)return {state:'unavailable',reason:'No complete sunrise–sunset cycle near this moment (possible polar day/night).',convention,hours:[]};
  const weekday=new Intl.DateTimeFormat('en-US',{timeZone:timezone,weekday:'short'}).format(new Date(rise.timestamp)),dayLord={Sun:'sun',Mon:'moon',Tue:'mars',Wed:'mercury',Thu:'jupiter',Fri:'venus',Sat:'saturn'}[weekday];
  const sequence=['saturn','jupiter','mars','sun','venus','mercury','moon'],offset=sequence.indexOf(dayLord),hours=[];
  for(let i=0;i<24;i++){
    const from=i<12?rise.timestamp:set.timestamp,to=i<12?set.timestamp:next.timestamp,j=i%12;
    const start=from+(to-from)*j/12,end=from+(to-from)*(j+1)/12;
    hours.push({number:i+1,lord:sequence[(offset+i)%7],period:i<12?'day':'night',start:new Date(start).toISOString(),end:new Date(end).toISOString(),active:timestamp>=start&&timestamp<end});
  }
  return {state:'available',dayLord,currentLord:hours.find(h=>h.active)?.lord,currentNumber:hours.find(h=>h.active)?.number,sunrise:new Date(rise.timestamp).toISOString(),sunset:new Date(set.timestamp).toISOString(),nextSunrise:new Date(next.timestamp).toISOString(),hours,convention};
}
export function hebrewCivil(instant,timezone='UTC'){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-u-ca-hebrew',{timeZone:timezone,year:'numeric',month:'long',day:'numeric'}).formatToParts(new Date(instant)).map(p=>[p.type,p.value]));
  const aliases={Tishri:'Tishrei',Heshvan:'Cheshvan',Tamuz:'Tammuz',Iyyar:'Iyar'};
  return {year:+parts.year,month:aliases[parts.month]||parts.month,day:+parts.day};
}
const MONTHS=['Nisan','Iyar','Sivan','Tammuz','Av','Elul','Tishrei','Cheshvan','Kislev','Tevet','Shevat','Adar'];
const MAZAL=['Taleh · Aries','Shor · Taurus','Teomim · Gemini','Sartan · Cancer','Aryeh · Leo','Betulah · Virgo','Moznayim · Libra','Akrav · Scorpio','Keshet · Sagittarius','Gedi · Capricorn','Deli · Aquarius','Dagim · Pisces'];
const HEBREW_MONTHS={Nisan:'ניסן',Iyar:'אייר',Sivan:'סיוון',Tammuz:'תמוז',Av:'אב',Elul:'אלול',Tishrei:'תשרי',Cheshvan:'חשוון',Kislev:'כסלו',Tevet:'טבת',Shevat:'שבט',Adar:'אדר','Adar I':'אדר א׳','Adar II':'אדר ב׳'};
export function hebrewNumber(value){
  if(!Number.isInteger(value)||value<1||value>999)throw Error('Hebrew numeral requires 1–999');
  let n=value,s='';
  for(const [amount,letter] of [[400,'ת'],[300,'ש'],[200,'ר'],[100,'ק']])while(n>=amount){s+=letter;n-=amount;}
  if(n===15||n===16){s+=n===15?'טו':'טז';n=0;}
  for(const [amount,letter] of [[90,'צ'],[80,'פ'],[70,'ע'],[60,'ס'],[50,'נ'],[40,'מ'],[30,'ל'],[20,'כ'],[10,'י'],[9,'ט'],[8,'ח'],[7,'ז'],[6,'ו'],[5,'ה'],[4,'ד'],[3,'ג'],[2,'ב'],[1,'א']])if(n>=amount){s+=letter;n-=amount;}
  return s.length===1?s+'׳':s.slice(0,-1)+'״'+s.slice(-1);
}
export function jewishCalendar(instant,timezone,events){
  const timestamp=+new Date(instant),civil=dateKey(timestamp,timezone),sunset=events.find(e=>e.kind==='set'&&dateKey(e.timestamp,timezone)===civil),after=sunset?timestamp>=sunset.timestamp:false;
  // Intl calendar dates change at civil midnight; select next civil noon after sunset.
  const effectiveCivil=new Date(civil+'T12:00:00Z');if(after)effectiveCivil.setUTCDate(effectiveCivil.getUTCDate()+1);
  const calendar=hebrewCivil(effectiveCivil,'UTC'),month=calendar.month.startsWith('Adar')?'Adar':calendar.month,index=MONTHS.indexOf(month),leap=((7*calendar.year+1)%19)<7;
  const observances=[];
  if(month!=='Tishrei'&&(calendar.day===1||calendar.day===30))observances.push('Rosh Chodesh (calendar marker)');
  if(month==='Tishrei'&&calendar.day<=2)observances.push('Rosh Hashanah');
  if(month==='Tishrei'&&calendar.day===10)observances.push('Yom Kippur');
  if(month==='Tishrei'&&calendar.day>=15&&calendar.day<=21)observances.push('Sukkot');
  if(month==='Tishrei'&&calendar.day===22)observances.push('Shemini Atzeret; Simchat Torah timing varies by community');
  if(month==='Tishrei'&&calendar.day===23)observances.push('Simchat Torah (Diaspora calendar)');
  if(month==='Nisan'&&calendar.day>=15&&calendar.day<=22)observances.push('Passover season (Israel/Diaspora final day differs)');
  if(month==='Sivan'&&(calendar.day===6||calendar.day===7))observances.push('Shavuot season (Israel/Diaspora observance differs)');
  if(month==='Adar'&&calendar.day===14&&(!leap||calendar.month==='Adar II'))observances.push('Purim (unwalled-city calendar; local practice varies)');
  if(month==='Shevat'&&calendar.day===15)observances.push('Tu BiShvat');
  for(let offset=0;offset<8;offset++){const prior=hebrewCivil(+effectiveCivil-offset*DAY,'UTC');if(prior.month==='Kislev'&&prior.day===25){observances.push(`Hanukkah · calendar day ${offset+1}`);break;}}
  const omer=month==='Nisan'&&calendar.day>=16?calendar.day-15:month==='Iyar'?15+calendar.day:month==='Sivan'&&calendar.day<=5?44+calendar.day:null;
  if(omer===33)observances.push('Lag BaOmer');
  const yearNumeral=calendar.year%1000?hebrewNumber(calendar.year%1000):hebrewNumber(Math.floor(calendar.year/1000))+' אלפים';
  return {...calendar,civilDate:civil,display:`${calendar.day} ${calendar.month} ${calendar.year}`,hebrewDisplay:`${hebrewNumber(calendar.day)} ${HEBREW_MONTHS[calendar.month]||calendar.month} ${yearNumeral}`,leapYear:leap,afterSunset:after,boundaryState:sunset?'calculated':'unavailable',sunset:sunset?new Date(sunset.timestamp).toISOString():null,weekday:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Shabbat'][effectiveCivil.getUTCDay()],mazal:index>=0?MAZAL[index]:'Not assigned',omerDay:omer,observances,convention:'Fixed Hebrew calendar via browser Intl; day advanced at standard sunset. Twilight/nightfall, candle-lighting and halakhic rulings are not calculated. High-latitude sunset may be unavailable; then a civil-calendar date is shown. Month–mazal correspondence is one Sefer Yetzirah-based symbolic convention; both Adars use Pisces, not a computed natal Sun sign.'};
}
