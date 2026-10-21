import assert from 'node:assert/strict';
import {AUTO_ACTIONS,SEQUENCES,chooseFresh} from '../src/action-library.ts';
let seed=8249;
const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
for(const [options,window] of [[AUTO_ACTIONS,3],[Object.keys(SEQUENCES),2]] as const){
 const recent:string[]=[];
 for(let i=0;i<600;i++){
  const chosen=chooseFresh<string>(options,recent,window,random);
  assert(chosen&&options.includes(chosen as never));assert(!recent.slice(-window).includes(chosen),'Repeats inside the available exclusion window');recent.push(chosen);if(recent.length>8)recent.shift();
 }
}
assert.equal(chooseFresh([],[]),undefined);assert.equal(chooseFresh(['only'],['only']),'only');assert.equal(chooseFresh(['a','b'],['a','b'],3,()=>.9),'a');
console.log('PASS: 1,200 seeded surprise selections avoid recent actions/recipes; empty/singleton/exhausted pools remain usable.');
