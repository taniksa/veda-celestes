import assert from 'node:assert/strict';
import test from 'node:test';
import {benchmarkHorizons} from '../benchmark/verify-horizons.mjs';
test('matches independently retrieved JPL Horizons observations within the declared 60-arcsecond limit',async()=>{
  const report=await benchmarkHorizons();
  assert.equal(report.observations,40);
  assert.equal(report.pass,true,JSON.stringify(report.results.filter(r=>!r.pass)));
});
