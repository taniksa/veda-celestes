import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {SwissEphemeris} from '../browser/lib/swisseph-browser.js';
import factory from '../browser/lib/swisseph.js';
import {angle} from '../browser/chart-engine.mjs';

export async function benchmarkHorizons(){
  const reference=JSON.parse(await readFile(new URL('./horizons-reference.json',import.meta.url),'utf8'));
  if(reference.records.length!==40)throw Error('Expected all 40 independent observations');
  const swe=new SwissEphemeris();
  const binary=await WebAssembly.compile(await readFile(new URL('../browser/lib/swisseph.wasm',import.meta.url)));
  swe.module=await factory({instantiateWasm(imports,ready){ready(new WebAssembly.Instance(binary,imports));return {};}});
  swe._wrapFunctions();swe.ready=true;
  const bodies=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const results=[];
  for(const record of reference.records){
    const raw=await readFile(new URL(`./horizons-raw/${record.body}.json`,import.meta.url));
    if(createHash('sha256').update(raw).digest('hex')!==record.rawSha256)throw Error('Reference response integrity failure');
    const p=swe.calculatePosition(record.julianDay,bodies.indexOf(record.body),4|256);
    const longitudeErrorArcseconds=Math.abs(angle(p.longitude-record.longitude+180)-180)*3600;
    const latitudeErrorArcseconds=Math.abs(p.latitude-record.latitude)*3600;
    results.push({body:record.body,instant:record.instant,longitudeErrorArcseconds,latitudeErrorArcseconds,pass:Math.max(longitudeErrorArcseconds,latitudeErrorArcseconds)<=reference.thresholdArcseconds});
  }
  swe.close();
  return {source:reference.source,referenceRetrievedAt:reference.retrievedAt,model:'Swiss Ephemeris 2.10.03 / Moshier / browser WASM',observations:results.length,epochs:reference.epochs,thresholdArcseconds:reference.thresholdArcseconds,maxLongitudeErrorArcseconds:Math.max(...results.map(r=>r.longitudeErrorArcseconds)),maxLatitudeErrorArcseconds:Math.max(...results.map(r=>r.latitudeErrorArcseconds)),pass:results.every(r=>r.pass),limitations:'Geocentric apparent ecliptic longitude/latitude only. Four sampled epochs (2000–2026), not all dates, houses, rise/set times, traditional formulas or interpretive validity. Horizons IAU76/80 and Swiss frames/time models differ slightly.',results};
}
if(process.argv[1]&&new URL(import.meta.url).pathname.endsWith(process.argv[1].replaceAll('\\','/').split('/').at(-1))){
  const report=await benchmarkHorizons();
  await writeFile(new URL('./RESULTS.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({...report,results:undefined},null,2));
  if(!report.pass)process.exitCode=1;
}
