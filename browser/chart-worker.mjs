import {SwissEphemeris} from './lib/swisseph-browser.js';
import {calculateExperience,validateExperienceInput} from './experience.mjs';
let enginePromise;
self.onmessage=async({data})=>{
  const id=data?.id;
  try{
    validateExperienceInput(data?.input); // Reject before downloading or initialising the astronomy module.
    if(!enginePromise)enginePromise=(async()=>{const swe=new SwissEphemeris();await swe.init();return swe;})();
    const result=calculateExperience(await enginePromise,data.input);
    self.postMessage({id,result});
  }catch(error){enginePromise=undefined;self.postMessage({id,error:error instanceof Error?error.message:'Calculation unavailable. Please try again.'});}
};
