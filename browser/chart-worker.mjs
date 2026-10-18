import {SwissEphemeris} from './lib/swisseph-browser.js';
import {calculateChart,validateInput} from './chart-engine.mjs';
let enginePromise;
self.onmessage=async({data})=>{
  const id=data?.id;
  try{
    validateInput(data?.input); // Reject before downloading or initialising the astronomy module.
    if(!enginePromise)enginePromise=(async()=>{const swe=new SwissEphemeris();await swe.init();return swe;})();
    const result=calculateChart(await enginePromise,data.input);
    self.postMessage({id,result});
  }catch(error){enginePromise=undefined;self.postMessage({id,error:error instanceof Error?error.message:'Calculation unavailable. Please try again.'});}
};
