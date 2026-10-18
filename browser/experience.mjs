import {calculateChart,validateInput,resolveInstant} from './chart-engine.mjs';
import {SIGNS,LORDS,NAKSHATRAS,navamsa,vimshottari,dignity,annualProfection,vedicAspects,angle} from './traditional.mjs';
import {solarEvents,planetaryHours,jewishCalendar} from './solar-calendar.mjs';
import {interpretChart} from './interpretations.mjs';

export function validateExperienceInput(input){
  validateInput(input);
  const referenceDate=input.referenceDate===undefined?new Date().toISOString().slice(0,10):input.referenceDate;
  resolveInstant({date:referenceDate,time:'12:00',timezone:'UTC'});
  return referenceDate;
}
export function calculateExperience(swe,input){
  const referenceDate=validateExperienceInput(input),chart=calculateChart(swe,input),analysisInstant=referenceDate+'T12:00:00.000Z';
  chart.engineVersion='0.4.0-browser';chart.analysisInstant=analysisInstant;
  chart.provenance.accuracy='Independent JPL Horizons benchmark: 40 sampled geocentric observations, 2000–2026; maximum longitude difference 0.657 arcsec, latitude 0.406 arcsec. Not a validation of all epochs, houses, rise/set times or symbolic interpretations.';
  const natalEvents=solarEvents(swe,chart.instant,input.latitude,input.longitude),referenceEvents=solarEvents(swe,analysisInstant,input.latitude,input.longitude);
  const d9Asc=navamsa(chart.vedic.ascendant.longitude),d9Planets=Object.fromEntries(Object.entries(chart.vedic.planets).map(([body,p])=>{const d9=navamsa(p.longitude);return [body,{...d9,house:(Math.floor(d9.longitude/30)-Math.floor(d9Asc.longitude/30)+12)%12+1,vargottama:d9.sign===p.sign}];}));
  const jd=swe.dateToJulianDay(new Date(analysisInstant)),transits=[];
  const names=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  for(let i=0;i<names.length;i++){
    const p=swe.calculatePosition(jd,i,4|256);
    for(const [target,natal] of Object.entries({...chart.western.planets,ascendant:chart.western.ascendant})){
      if(!['sun','moon','mercury','venus','mars','jupiter','saturn','ascendant'].includes(target))continue;
      const distance=Math.abs(angle(p.longitude-natal.longitude+180)-180);
      for(const [aspect,exact] of [['conjunction',0],['sextile',60],['square',90],['trine',120],['opposition',180]]){
        const orb=Math.abs(distance-exact);
        if(orb<=2){const next=Math.abs(Math.abs(angle(p.longitude+p.longitudeSpeed/24-natal.longitude+180)-180)-exact);transits.push({body:names[i],target,aspect,orb,motion:orb<.01?'near exact':next<orb?'applying':'separating'});}
      }
    }
  }
  const balance={fire:0,earth:0,air:0,water:0};for(const p of Object.values(chart.western.planets).slice(0,7))balance[['fire','earth','air','water'][Math.floor(p.longitude/30)%4]]++;
  chart.techniques={
    vedic:{nakshatraName:NAKSHATRAS[chart.vedic.panchanga.nakshatra-1],nakshatraLord:['ketu','venus','sun','moon','mars','rahu','jupiter','saturn','mercury'][(chart.vedic.panchanga.nakshatra-1)%9],navamsa:{ascendant:d9Asc,planets:d9Planets,convention:'Standard Parashari D9: sidereal longitude × 9 modulo 360. Whole-sign D9 houses. Not a physical planetary position.'},vimshottari:vimshottari(chart.vedic.planets.moon.longitude,chart.instant,analysisInstant),grahaDrishti:vedicAspects(chart.vedic.planets)},
    western:{dignities:Object.entries(chart.western.planets).filter(([body])=>names.slice(0,7).includes(body)).map(([body,p])=>({body,sign:p.sign,dignity:dignity(body,p.longitude)})),elements:balance,profection:annualProfection(chart,input,analysisInstant),transits:transits.sort((a,b)=>a.orb-b.orb),transitConvention:'Geocentric transits at reference date 12:00 UTC, five major aspects, fixed 2° orb to seven natal planets and ascendant; applying/separating estimated one hour ahead.'},
    arabic:{mansionStart:(chart.arabic.lunarMansion-1)*360/28,mansionEnd:chart.arabic.lunarMansion*360/28,mansionProgressPercent:((chart.western.planets.moon.longitude%(360/28))/(360/28))*100,natalHours:planetaryHours(natalEvents,chart.instant,input.timezone),referenceHours:planetaryHours(referenceEvents,analysisInstant,input.timezone)}
  };
  chart.jewish=jewishCalendar(chart.instant,input.timezone,natalEvents);
  chart.jewishReference=jewishCalendar(analysisInstant,input.timezone,referenceEvents);
  chart.interpretations=interpretChart(chart);
  return chart;
}
