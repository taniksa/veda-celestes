import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {calculateChart,resolveInstant,validateInput,angle} from '../browser/chart-engine.mjs';
import {SwissEphemeris} from '../browser/lib/swisseph-browser.js';
import factory from '../browser/lib/swisseph.js';

const input={date:'2026-10-18',time:'12:00',timezone:'Asia/Kolkata',latitude:12.9716,longitude:77.5946};
test('resolves offsets, leap days, DST gaps and folds without silent guessing',()=>{
  assert.equal(resolveInstant(input).toISOString(),'2026-10-18T06:30:00.000Z');
  assert.equal(resolveInstant({...input,date:'2024-02-29',time:'23:59:59'}).toISOString(),'2024-02-29T18:29:59.000Z');
  for(const request of [
    {...input,date:'2025-02-29'}, {...input,date:'1799-01-01'}, {...input,date:'2400-01-01'},
    {...input,time:'24:00'}, {...input,time:'12:60'}, {...input,timezone:'Mars/Olympus'},
    {...input,date:'2024-03-10',time:'02:30',timezone:'America/New_York'},
    {...input,date:'2024-11-03',time:'01:30',timezone:'America/New_York'},
    {...input,date:'2024-10-27',time:'01:30',timezone:'Europe/London'},
    {...input,date:'2011-12-30',timezone:'Pacific/Apia'},
  ])assert.throws(()=>resolveInstant(request),JSON.stringify(request));
  assert.equal(resolveInstant({...input,date:'2024-11-03',time:'06:30',timezone:'UTC'}).toISOString(),'2024-11-03T06:30:00.000Z');
});
test('rejects invalid, empty and out-of-range coordinates',()=>{
  for(const value of [null,'',true,NaN,Infinity,90,-90])assert.throws(()=>validateInput({...input,latitude:value}));
  for(const value of [null,'',Infinity,181])assert.throws(()=>validateInput({...input,longitude:value}));
  assert.doesNotThrow(()=>validateInput({...input,latitude:0,longitude:0}));
});
test('browser WASM agrees with native Swiss Ephemeris over synthetic moments',async()=>{
  const swe=new SwissEphemeris();
  // Test-only initialization from the exact production binary; no HTTP/CDN required.
  const binary=await WebAssembly.compile(await readFile(new URL('../browser/lib/swisseph.wasm',import.meta.url)));
  swe.module=await factory({instantiateWasm(imports,ready){ready(new WebAssembly.Instance(binary,imports));return {};}});
  swe._wrapFunctions();swe.ready=true;
  const fixtures=JSON.parse(await readFile(new URL('./browser-fixtures.json',import.meta.url),'utf8'));
  const near=(actual,expected,label)=>assert.ok(Math.abs(angle(actual-expected+180)-180)<1e-7,`${label}: ${actual} != ${expected}`);
  for(const {input,expected} of fixtures){
    const chart=calculateChart(swe,input),label=JSON.stringify(input);
    assert.equal(Date.parse(chart.instant),Date.parse(expected.instant),label);
    for(const tradition of ['western','vedic'])for(const [name,p] of Object.entries(expected[tradition].planets)){
      near(chart[tradition].planets[name].longitude,p.longitude,`${label} ${tradition} ${name}`);
      assert.equal(chart[tradition].planets[name].sign,p.sign);
      assert.ok(chart[tradition].planets[name].house>=1&&chart[tradition].planets[name].house<=12);
    }
    near(chart.western.ascendant.longitude,expected.western.ascendant.longitude,label+' ascendant');
    near(chart.vedic.ascendant.longitude,expected.siderealAscendant,label+' sidereal ascendant');
    chart.western.cusps.forEach((c,i)=>near(c,expected.western.cusps[i],label+' house cusp'));
    near(chart.vedic.ayanamshaDegrees,expected.vedic.ayanamshaDegrees,label+' ayanamsha');
    assert.deepEqual(chart.vedic.panchanga,expected.vedic.panchanga,label+' panchanga');
    assert.equal(chart.arabic.sect,expected.arabic.sect,label+' sect');
    for(const lot of ['fortune','spirit'])near(chart.arabic[lot].longitude,expected.arabic[lot].longitude,label+' '+lot);
    assert.equal(chart.arabic.lunarMansion,expected.arabic.lunarMansion);
    assert.equal(chart.western.aspects.length,expected.western.aspects.length);
    chart.western.aspects.forEach((a,i)=>{assert.deepEqual(a.bodies,expected.western.aspects[i].bodies);assert.equal(a.aspect,expected.western.aspects[i].aspect);near(a.orb,expected.western.aspects[i].orb,label+' aspect orb')});
  }
  swe.close();
});
