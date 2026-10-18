// Věda Célestes · AGPL-3.0 · no network, storage or personal-data logging.
export const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
export const angle=value=>((value%360)+360)%360;
export function placement(longitude){longitude=angle(longitude);return {longitude,sign:SIGNS[Math.floor(longitude/30)],degree:longitude%30};}
const invalid=message=>{throw new Error(message);};

export function resolveInstant(input){
  if(!input||typeof input!=='object')invalid('Supply a date, time, timezone and coordinates.');
  if(typeof input.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||typeof input.time!=='string'||!/^\d{2}:\d{2}(:\d{2})?$/.test(input.time))invalid('Enter a valid calendar date and local time.');
  const [year,month,day]=input.date.split('-').map(Number);
  const [hour,minute,second=0]=input.time.split(':').map(Number);
  const local=Date.UTC(year,month-1,day,hour,minute,second);
  const check=new Date(local);
  if(year<1800||year>2399||check.getUTCFullYear()!==year||check.getUTCMonth()!==month-1||check.getUTCDate()!==day||hour>23||minute>59||second>59)invalid('Use a real date in 1800–2399 and a valid 24-hour time.');
  if(typeof input.timezone!=='string'||input.timezone.length>80||(!input.timezone.includes('/')&&input.timezone!=='UTC'))invalid('Use an IANA timezone such as Asia/Kolkata, or UTC.');
  let formatter;
  try{formatter=new Intl.DateTimeFormat('en-GB',{timeZone:input.timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});}catch{invalid('That timezone is not recognised by this browser.');}
  const wall=timestamp=>{const p=Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map(p=>[p.type,p.value]));return Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);};
  // Collect offsets either side of transitions, then round-trip to detect folds/gaps.
  const offsets=new Set();
  for(let hours=-48;hours<=48;hours+=6){const t=local+hours*3600000;offsets.add(wall(t)-t);}
  const candidates=[...offsets].map(offset=>local-offset).filter(t=>wall(t)===local);
  if(candidates.length!==1)invalid(candidates.length?'This local time occurs twice at a clock change. Use UTC for the intended occurrence.':'This local time does not exist at a clock change. Check the time or use UTC.');
  const instant=new Date(candidates[0]);
  if(instant.getUTCFullYear()<1800||instant.getUTCFullYear()>2399)invalid('The UTC instant must be within 1800–2399.');
  return instant;
}
export function validateInput(input){
  const instant=resolveInstant(input);
  for(const [key,limit] of [['latitude',89.5],['longitude',180]])if(typeof input[key]!=='number'||!Number.isFinite(input[key])||Math.abs(input[key])>limit)invalid(`${key} must be a number from ${-limit} to ${limit}.`);
  return instant;
}

export function calculateChart(swe,input){
  const utc=validateInput(input),lat=input.latitude,lon=input.longitude;
  const jd=swe.dateToJulianDay(utc),flags=4|256; // Moshier + speed; never load external ephemeris files.
  swe.setSiderealMode(1); // Lahiri
  const tropical={},sidereal={};
  const bodies=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','mean_node'];
  for(const [body,name] of bodies.entries()){
    const p=swe.calculatePosition(jd,body,flags),s=swe.calculatePosition(jd,body,flags|65536);
    if(!Number.isFinite(p.longitude)||!Number.isFinite(s.longitude)||(body<10&&!(p.flags&4)))invalid('The astronomy engine returned an unexpected result.');
    tropical[name]={...placement(p.longitude),speed:p.longitudeSpeed,retrograde:p.longitudeSpeed<0};
    sidereal[name]={...placement(s.longitude),speed:s.longitudeSpeed,retrograde:s.longitudeSpeed<0};
  }
  sidereal.ketu=placement(sidereal.mean_node.longitude+180);
  const houses=swe.calculateHouses(jd,lat,lon,'W'),asc=houses.ascendant;
  if(!Number.isFinite(asc)||!Number.isFinite(houses.armc)||houses.cusps.some(c=>!Number.isFinite(c)))invalid('Houses could not be calculated for this location.');
  const equatorial=swe.calculatePosition(jd,0,flags|2048),r=Math.PI/180;
  // Geometric Sun-centre altitude: hour angle = local apparent sidereal time − RA.
  const altitude=Math.asin(Math.max(-1,Math.min(1,Math.sin(lat*r)*Math.sin(equatorial.latitude*r)+Math.cos(lat*r)*Math.cos(equatorial.latitude*r)*Math.cos((houses.armc-equatorial.longitude)*r))))/r;
  const day=altitude>=0,sun=tropical.sun.longitude,moon=tropical.moon.longitude,elongation=angle(moon-sun),moonSid=sidereal.moon.longitude;
  const aspects=[];
  for(let i=0;i<10;i++)for(let j=i+1;j<10;j++){
    const a=bodies[i],b=bodies[j],distance=Math.abs(angle(tropical[a].longitude-tropical[b].longitude+180)-180);
    for(const [aspect,exact] of [['conjunction',0],['sextile',60],['square',90],['trine',120],['opposition',180]])if(Math.abs(distance-exact)<=6)aspects.push({bodies:[a,b],aspect,orb:Math.abs(distance-exact)});
  }
  // Sidereal houses use the true ayanamsha (including nutation), not the mean display value.
  const siderealAsc=placement(asc-swe.getAyanamsaExUt(jd,flags));
  const withHouses=(planets,ascendant)=>Object.fromEntries(Object.entries(planets).map(([name,p])=>[name,{...p,house:Math.floor(angle(p.longitude-Math.floor(ascendant.longitude/30)*30)/30)+1}]));
  return {schemaVersion:'1',engineVersion:'0.3.0-browser',instant:utc.toISOString(),
    reference:{timezone:input.timezone,latitude:lat,longitude:lon},
    provenance:{library:'Swiss Ephemeris',version:swe.version(),wrapper:'@swisseph/browser 1.3.1',model:'Moshier',timezoneDatabase:'Browser Intl (host timezone database)',supportedYears:[1800,2399],timeConvention:'UTC supplied as UT approximation; Swiss delta-T model',accuracy:'Cross-checked against native engine; independent precision benchmark pending'},
    western:{zodiac:'tropical',planets:withHouses(tropical,placement(asc)),ascendant:placement(asc),houseSystem:'whole-sign',cusps:houses.cusps.slice(1),aspects},
    vedic:{zodiac:'sidereal',ayanamsha:'Lahiri',ayanamshaDegrees:swe.getAyanamsa(jd),ascendant:siderealAsc,houseSystem:'whole-sign',planets:withHouses(sidereal,siderealAsc),panchanga:{tithi:Math.floor(elongation/12)+1,paksha:elongation<180?'shukla':'krishna',nakshatra:Math.floor(moonSid/(40/3))+1,pada:Math.floor((moonSid%(40/3))/(10/3))+1,yoga:Math.floor(angle(sidereal.sun.longitude+moonSid)/(40/3))+1,karanaHalfTithi:Math.floor(elongation/6)+1}},
    arabic:{convention:'Hellenistic-derived Fortune/Spirit; reversed by sect; equal tropical lunar mansions',sect:day?'day':'night',sectRule:'Sun geometric centre altitude >= 0 degrees',fortune:placement(asc+(day?moon-sun:sun-moon)),spirit:placement(asc+(day?sun-moon:moon-sun)),lunarMansion:Math.floor(moon/(360/28))+1}};
}
