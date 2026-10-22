import assert from 'node:assert/strict';
import {planPath,segmentClear,clearance,findClearing,Navigator,distance,type Obstacle} from '../src/navigation.ts';
const bounds={wanderX:11.5,wanderZ:8};
const flower:Obstacle={a:{x:0,z:0},b:{x:0,z:0},radius:1,kind:'flower'};
const pole:Obstacle={a:{x:-2,z:-2},b:{x:2,z:-2},radius:.15,owner:0};
// Old straight-line movement crosses both the flower and a fallen ski pole.
assert(!segmentClear({x:-4,z:0},{x:4,z:0},[flower],.72));
for(const [start,end,objects] of [
 [{x:-4,z:0},{x:4,z:0},[flower]],
 [{x:0,z:-4},{x:0,z:2},[pole,flower]],
 [{x:0,z:-2},{x:5,z:1},[pole]],
 [{x:-10,z:-7},{x:10,z:7},[flower,pole]],
] as const){const route=planPath(start,end,objects,bounds);assert(route.length);let previous=start;for(const point of route){assert(segmentClear(previous,point,objects,.72),'Route crosses obstacle');previous=point;}assert(distance(previous,end)<.05);}
let seed=3912;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
let checked=0;for(let n=0;n<100;n++){
 const start={x:-9,z:(rand()-.5)*13},goal={x:9,z:(rand()-.5)*13};const objects=[flower,{a:{x:-3,z:-3},b:{x:2,z:-3},radius:.15},{a:{x:4,z:3},b:{x:4,z:3},radius:.5}];
 const actor={...start},nav=new Navigator();let last={...actor};for(let frame=0;frame<2500&&distance(actor,goal)>.04;frame++){const next=nav.step(actor,goal,1/60,2.4,objects,bounds);assert(segmentClear(actor,next,objects,.72));assert(distance(actor,next)<=.04001,'Movement teleported');Object.assign(actor,next);last=next;}assert(distance(last,goal)<.05,'Route stalled');checked++;
}
const drops:Obstacle[]=[{a:{x:-.6,z:-.4},b:{x:-.6,z:2},radius:.15,owner:0},{a:{x:.7,z:-1.8},b:{x:.7,z:.8},radius:.15,owner:1},{a:{x:-1,z:0},b:{x:-1,z:0},radius:.5,owner:0},{a:{x:1,z:0},b:{x:1,z:0},radius:.5,owner:1}, {a:{x:-5,z:-3},b:{x:-5,z:-3},radius:1,kind:'flower'}];
for(const kind of ['basic','gift','flower','overtime'] as const){const plan=findClearing([{x:0,z:0},{x:.1,z:.1}],drops,bounds,kind);assert(plan,kind+' no clearing');assert(distance(plan.center,{x:0,z:0})<8,'Too far');for(const p of plan.points)assert(drops.every(o=>clearance(p,o)>.8));if(kind!=='overtime')assert(drops.every(o=>clearance(plan.center,o)>=(kind==='gift'?2.7:3.4)+.19));}
// Two moving people exchange sides without sharing the same point.
{const actors=[{x:-2,z:0},{x:2,z:0}],goals=[{x:2,z:0},{x:-2,z:0}],nav=new Navigator();for(let frame=0;frame<2000;frame++){for(let i=0;i<2;i++){const other=actors[1-i],o={a:{...other},b:{...other},radius:1.72-.72};Object.assign(actors[i],nav.step(actors[i],goals[i],1/60,2,[o],bounds));}assert(distance(actors[0],actors[1])>=1.719);if(actors.every((a,i)=>distance(a,goals[i])<.05))break;}assert(actors.every((a,i)=>distance(a,goals[i])<.05),'People deadlocked');}
console.log(JSON.stringify({passed:true,checked,checks:['straight-line regression','flower and horizontal pole detours','swept collision at every frame','no teleport','nearby clear stages including office ingress','people exchanging sides']}));
