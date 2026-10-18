import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {navamsa,vimshottari,dignity,annualProfection,DASHA_YEARS,vedicAspects} from '../browser/traditional.mjs';
import {solarEvents,solarAltitude,planetaryHours,hebrewCivil,jewishCalendar,hebrewNumber} from '../browser/solar-calendar.mjs';
import {calculateExperience,validateExperienceInput} from '../browser/experience.mjs';
import {SwissEphemeris} from '../browser/lib/swisseph-browser.js';
import factory from '../browser/lib/swisseph.js';
const YEAR=365.25*86400000,birth=Date.parse('2000-01-01T12:00:00Z');
let engine;
async function swe(){if(!engine){engine=new SwissEphemeris();const binary=await WebAssembly.compile(await readFile(new URL('../browser/lib/swisseph.wasm',import.meta.url)));engine.module=await factory({instantiateWasm(imports,ready){ready(new WebAssembly.Instance(binary,imports));return {};}});engine._wrapFunctions();engine.ready=true;}return engine;}
test('standard D9 maps every segment and keeps degree-boundary sides distinct',()=>{
 for(let i=0;i<108;i++){
  assert.equal(Math.floor(navamsa((i+.5)*10/3).longitude/30),i%12);
  if(i>0){assert.equal(Math.floor(navamsa(i*10/3-1e-8).longitude/30),(i+11)%12);assert.equal(Math.floor(navamsa(i*10/3+1e-8).longitude/30),i%12);}
 }
 assert.equal(navamsa(30).sign,'Capricorn');assert.equal(navamsa(60).sign,'Libra');
});
test('Vimshottari transitions are half-open, proportional and cover exactly 120 years',()=>{
 assert.equal(DASHA_YEARS.reduce((a,b)=>a+b,0),120);
 assert.equal(vimshottari(0,birth,birth).currentLord,'ketu');
 assert.equal(vimshottari(0,birth,birth+7*YEAR-1).currentLord,'ketu');
 assert.equal(vimshottari(0,birth,birth+7*YEAR).currentLord,'venus');
 assert.equal(vimshottari(0,birth,birth-1).state,'before_birth');
 assert.equal(vimshottari(0,birth,birth+120*YEAR).state,'outside_coverage');
 for(let moon=.1;moon<360;moon+=7.37){
  const d=vimshottari(moon,birth,birth+36*YEAR),p=d.periods;
  assert.equal(Date.parse(p[0].start),birth);assert.equal(Date.parse(p.at(-1).end),birth+120*YEAR);
  assert.equal(p.filter(x=>x.active).length,1);
  for(let i=0;i<p.length;i++){
   if(i)assert.equal(p[i].start,p[i-1].end);
   assert.ok(Math.abs(Date.parse(p[i].subperiods[0].start)-Date.parse(p[i].start))<=1);
   assert.ok(Math.abs(Date.parse(p[i].subperiods.at(-1).end)-Date.parse(p[i].end))<=1);
  }
 }
});
test('classical sign dignity is explicit and not a fabricated strength score',()=>{
 assert.equal(dignity('mercury',165),'domicile · exaltation');
 assert.equal(dignity('sun',315),'detriment');assert.equal(dignity('saturn',15),'fall');
 assert.equal(dignity('venus',345),'exaltation');assert.equal(dignity('uranus',15),'not assigned');
});
test('annual profection changes on local birthday, not January 1',()=>{
 const chart={instant:'2000-06-15T08:30:00Z',western:{ascendant:{longitude:155}}},input={date:'2000-06-15',time:'10:30',timezone:'Europe/Paris'};
 assert.equal(annualProfection(chart,input,'2026-06-15T08:29:59Z').age,25);
 const p=annualProfection(chart,input,'2026-06-15T08:30:00Z');assert.equal(p.age,26);assert.equal(p.house,3);assert.equal(p.sign,'Scorpio');assert.equal(p.lord,'mars');
 assert.equal(annualProfection(chart,input,'1999-01-01T00:00Z').state,'before_birth');
});
test('Hebrew civil dates agree with seven independently archived Hebcal conversions',async()=>{
 const reference=JSON.parse(await readFile(new URL('../benchmark/hebrew-reference.json',import.meta.url),'utf8'));
 assert.equal(reference.records.length,7);
 const aliases={Iyyar:'Iyar',Tamuz:'Tammuz',"Sh'vat":'Shevat'};
 for(const row of reference.records){const h=hebrewCivil(row.date+'T12:00Z');assert.equal(h.year,row.response.hy);assert.equal(h.day,row.response.hd);assert.equal(h.month,aliases[row.response.hm]||row.response.hm);}
});
test('Jewish date changes at sunset, preserves leap Adar and declares polar fallback',()=>{
 assert.equal(hebrewNumber(15),'ט״ו');assert.equal(hebrewNumber(16),'ט״ז');assert.equal(hebrewNumber(787),'תשפ״ז');
 const sunset={kind:'set',timestamp:Date.parse('2023-09-15T18:00Z')};
 const before=jewishCalendar('2023-09-15T17:59:59Z','UTC',[sunset]),after=jewishCalendar('2023-09-15T18:00Z','UTC',[sunset]);
 assert.equal(before.display,'29 Elul 5783');assert.equal(after.display,'1 Tishrei 5784');assert.equal(after.leapYear,true);assert.ok(after.observances.includes('Rosh Hashanah'));
 assert.equal(jewishCalendar('2024-03-24T12:00Z','UTC',[]).month,'Adar II');
 assert.equal(jewishCalendar('2024-06-21T12:00Z','UTC',[]).boundaryState,'unavailable');
 const festival=jewishCalendar('2025-01-01T12:00Z','UTC',[]);assert.ok(festival.observances.some(o=>o.startsWith('Hanukkah')));
});
test('unequal planetary hours are contiguous, sum to a solar cycle and handle polar day',async()=>{
 const s=await swe(),instant='2026-10-18T06:30:00Z',events=solarEvents(s,instant,12.9716,77.5946),hours=planetaryHours(events,instant,'Asia/Kolkata');
 assert.equal(hours.state,'available');assert.equal(hours.hours.length,24);assert.equal(hours.hours.filter(h=>h.active).length,1);assert.equal(hours.dayLord,'sun');assert.equal(hours.hours[0].lord,'sun');
 for(let i=1;i<24;i++)assert.equal(hours.hours[i].start,hours.hours[i-1].end);
 for(const e of events){const altitude=solarAltitude(s,e.timestamp/86400000+2440587.5,12.9716,77.5946);assert.ok(Math.abs(altitude+.833)<.001);}
 const polar=planetaryHours(solarEvents(s,'2024-06-21T12:00Z',80,20),'2024-06-21T12:00Z','UTC');assert.equal(polar.state,'unavailable');assert.deepEqual(polar.hours,[]);
});
test('advanced experience is deterministic, evidence-grounded and works without network',async()=>{
 const s=await swe(),input={date:'1990-05-15',time:'14:30',timezone:'Europe/London',latitude:51.5074,longitude:-.1278,referenceDate:'2026-10-18'};
 const original=globalThis.fetch;globalThis.fetch=()=>{throw Error('Unexpected network request')};
 try{
  const a=calculateExperience(s,input),b=calculateExperience(s,input);assert.deepEqual(a,b);
  for(const tradition of ['vedic','western','arabic','jewish']){assert.ok(a.interpretations[tradition].length>=2);assert.ok(a.interpretations[tradition].every(r=>r.evidence.length&&r.text.length>50));}
  assert.equal(a.techniques.western.profection.age,36);assert.equal(a.techniques.vedic.navamsa.planets.sun.sign,navamsa(a.vedic.planets.sun.longitude).sign);assert.equal(a.jewish.year,5750);
  assert.ok(a.techniques.western.transits.every(t=>t.orb<=2));
  assert.throws(()=>validateExperienceInput({...input,referenceDate:'2026-02-30'}));
  for(const referenceDate of ['',null,0,true])assert.throws(()=>validateExperienceInput({...input,referenceDate}));
  assert.notEqual(calculateExperience(s,{...input,time:'15:30'}).western.ascendant.longitude,a.western.ascendant.longitude);
 }finally{globalThis.fetch=original;}
});
test('sign-level graha drishti applies classical special aspects without node claims',()=>{
 const p={mars:{longitude:0},jupiter:{longitude:90},saturn:{longitude:180},mean_node:{longitude:30}};
 const a=vedicAspects(p);assert.ok(a.some(x=>x.body==='mars'&&x.target==='jupiter'&&x.relativeHouse===4));assert.ok(a.every(x=>x.body!=='mean_node'&&x.target!=='mean_node'));
});
