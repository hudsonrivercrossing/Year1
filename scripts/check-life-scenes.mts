import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as T from 'three';
import {LifeScene,LittleLifeWorld,LIFE_ACTIONS} from '../src/life-scenes.ts';
import {Navigator,segmentClear,distance,findClearing} from '../src/navigation';
import {planFlower} from '../src/garden';
const cache=new Map();
const make=(id:string,color:string)=>{if(!cache.has(id)){const data=JSON.parse(fs.readFileSync('public/models/'+id+'.json','utf8'));cache.set(id,Object.values(data).map((vs:any)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vs.map((v:number,i:number)=>v*.035*(i%3===0?1:-1)),3));return g;}));}const root=new T.Group();for(const geo of cache.get(id))root.add(new T.Mesh(geo,new T.MeshStandardMaterial({color})));return root;};
function fixture(collisions=false){let active:LifeScene|undefined;const nav=new Navigator();const scene=new T.Scene(),world=new LittleLifeWorld(scene,make);const actors=[0,1].map(i=>{const root=new T.Group(),waist=new T.Group(),upper=new T.Group();root.add(waist);waist.position.y=-1.12;waist.add(upper);upper.position.y=1.12;scene.add(root);const parts:any={};for(const id of ['legs','torso','head','hair','rightArm','leftArm']){parts[id]=new T.Group();upper.add(parts[id]);}
 for(const [key,id,x]of[['rightArm','3818',-15.552],['leftArm','3819',15.552]] as const){const a=parts[key];a.position.set(x*.035,-9*.035,0);a.rotation.z=(key==='rightArm'?-1:1)*T.MathUtils.degToRad(9.782);a.add(make(id,'#999999'));const hand=make('3820','#ffcc33');hand.position.set((key==='rightArm'?-5:5)*.035,-20*.035,10*.035);hand.rotation.x=Math.PI/4;a.add(hand);}
 return{root,parts,waist,legPivots:[new T.Group(),new T.Group()],heightOffset:0,footHeight:()=>0,x:i===0?-9:8,z:i===0?6:-7,heading:0};});
 const walk=(f:any)=>{f.heightOffset=0;f.waist.rotation.x=0;f.legPivots.forEach((p:any)=>p.rotation.x=0);f.parts.leftArm.rotation.x=0;f.parts.rightArm.rotation.x=0;};
 const move=(f:any,x:number,z:number,dt:number,speed:number)=>{const d=Math.hypot(x-f.x,z-f.z);if(collisions){const i=actors.indexOf(f),other=actors[1-i],obstacles=[...world.obstacles,...(active?.obstaclesFor(i)??[]),{a:other,b:other,radius:active?.kind==='gift'&&['kiss-approach','kiss'].includes(active.phase)?.29:1,kind:'person'}],end=nav.step(f,{x,z},dt,speed,obstacles,{wanderX:11.5,wanderZ:8},.72);assert(segmentClear(f,end,obstacles,.72),'Movement crossed a collider');assert(distance(f,end)<=speed*dt+.0001,'Teleported');f.x=end.x;f.z=end.z;return d;}const k=Math.min(d,speed*dt)/(d||1);f.x+=(x-f.x)*k;f.z+=(z-f.z)*k;return d;};
 const sync=()=>{actors.forEach(f=>{f.root.position.set(f.x,2.52+f.heightOffset,f.z);f.root.rotation.y=f.heading;});scene.updateMatrixWorld(true);};
 return{scene,world,actors,walk,move,sync,setActive:(a:LifeScene)=>{active=a;}};}
const results=[];
for(const kind of LIFE_ACTIONS){
 const f=fixture(),cues:string[]=[],phases=new Set<string>(),a=new LifeScene(kind,f.actors,f.scene,f.world,f.move,f.walk,c=>cues.push(c));let done=false,previousOwner='DJ';
 for(let n=0;n<9000;n++){f.actors.forEach(f.walk);done=a.update(1/60);f.sync();const s=a.snapshot;phases.add(s.phase);assert(s.bagInstances<=1);if(s.bagOwner!==previousOwner){assert.equal(s.bagOwner,'YW');assert(s.transferGap!<1e-6);assert.equal(s.bagRotation,Math.PI/2,'Handoff changed bag orientation');previousOwner=s.bagOwner;}assert(f.actors.every(x=>[x.x,x.z,x.heightOffset,...x.legPivots.map(p=>p.rotation.x)].every(Number.isFinite)));if(done)break;}
 assert(done,kind+' never ends');assert(!f.scene.getObjectByName('little-life-scene'));if(kind==='flower'){assert.equal(f.world.snapshot.flowers,1);f.world.reset();assert.equal(f.world.snapshot.flowers,0);}if(kind==='gift')assert.equal(cues.filter(x=>x==='gift').length,1);if(kind==='overtime')assert(cues.includes('type')&&cues.includes('arrive'));
 // Interrupt every declared stage; exercise partial entry and seated cleanup.
 for(const phase of phases){if(phase==='done')continue;const g=fixture(),b=new LifeScene(kind,g.actors,g.scene,g.world,g.move,g.walk,()=>{});let reached=false,ended=false;for(let n=0;n<9000;n++){g.actors.forEach(g.walk);b.update(1/60);g.sync();if(b.phase===phase){b.update(.2);b.cancel();reached=true;break;}}assert(reached,kind+' missing '+phase);for(let n=0;n<9000;n++){g.actors.forEach(g.walk);ended=b.update(1/60);g.sync();if(ended)break;}assert(ended,kind+' cancel stuck '+phase);assert(!g.scene.getObjectByName('little-life-scene'));assert(g.actors.every(x=>Math.abs(x.heightOffset)<1e-6));}
 results.push({kind,phases:[...phases],cues});
}
// Repeated planting reuses the one permanent object.
{const f=fixture();f.world.plant();const flower=f.world.flower;for(let repeat=0;repeat<3;repeat++){const a=new LifeScene('flower',f.actors,f.scene,f.world,f.move,f.walk,()=>{});for(let n=0;n<9000;n++){f.actors.forEach(f.walk);if(a.update(1/60))break;}assert.equal(f.world.flower,flower);assert.equal(f.scene.children.filter(o=>o.name==='anniversary-flower').length,1);}}
// Five committed flowers survive cancellation; an unplanted seed never commits.
{const f=fixture();for(let i=0;i<5;i++){
 f.world.prepareFlower(()=>.2);f.world.setFlowerPoint(-8+i*4,4);
 let a=new LifeScene('flower',f.actors,f.scene,f.world,f.move,f.walk,()=>{});
 a.cancel();for(let n=0;n<300;n++){f.actors.forEach(f.walk);if(a.update(1/60))break;}
 assert.equal(f.world.snapshot.flowers,i,'Cancelled seed committed');
 a=new LifeScene('flower',f.actors,f.scene,f.world,f.move,f.walk,()=>{});
 for(let n=0;n<9000;n++){f.actors.forEach(f.walk);a.update(1/60);f.sync();if(a.snapshot.flowerCommitted){a.cancel();break;}}
 for(let n=0;n<300;n++){f.actors.forEach(f.walk);if(a.update(1/60))break;}
 assert.equal(f.world.snapshot.flowers,i+1,'Committed flower lost');
}assert.equal(f.world.obstacles.length,5);f.world.reset();assert.equal(f.world.obstacles.length,0);}
// Real shared navigation around a single seated YW, desk, chair and five flowers.
for(const cancelPhase of [undefined,'enter','take-seats','work','stand','exit']){
 const f=fixture(true);let seed=17;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<5;i++){f.world.prepareFlower(random);const p=planFlower(f.actors,f.world.obstacles,{wanderX:11.5,wanderZ:8},{x:1,z:0},random)!;assert(p,`No garden location ${i}: ${JSON.stringify(f.world.snapshot.items)}`);f.world.setFlowerPoint(p.center.x,p.center.z);f.world.plant();}
 const p=findClearing(f.actors,f.world.obstacles,{wanderX:11.5,wanderZ:8},'overtime')!;assert(p);
 const a=new LifeScene('overtime',f.actors,f.scene,f.world,f.move,f.walk,()=>{},new T.Vector2(p.center.x,p.center.z),p.entryZ,undefined,p.compact);f.setActive(a);
 let done=false,cancelled=false;const corners=new Set<number>();
 for(let n=0;n<12000;n++){f.actors.forEach(f.walk);done=a.update(1/60);f.sync();if(a.phase==='work'){assert.equal(f.actors[0].heightOffset,0,'DJ sat down');assert.equal(f.actors[1].heightOffset,-.23,'YW not seated');corners.add(a.snapshot.routeIndex);}
  if(cancelPhase&&a.phase===cancelPhase&&!cancelled){a.update(.3);a.cancel();cancelled=true;}
  if(done)break;
 }
 assert(done,'Shared-navigation office stuck '+cancelPhase);if(cancelPhase)assert(cancelled,'Cancel phase not reached '+cancelPhase);else assert.equal(corners.size,p.compact?2:4,'DJ did not complete safe route');assert.equal(f.world.snapshot.flowers,5);assert(!f.scene.getObjectByName('little-life-scene'));
}
// Gift box remains a real obstacle; close contact is enabled only for the kiss.
for(const cancelPhase of [undefined,'unwrap','offer','receive','show','kiss','shy']){
 const f=fixture(true);const anchor=new T.Vector2(2,1);const a=new LifeScene('gift',f.actors,f.scene,f.world,f.move,f.walk,()=>{},anchor);f.setActive(a);let done=false,cancelled=false,supportError:number|undefined;
 for(let n=0;n<12000;n++){f.actors.forEach(f.walk);done=a.update(1/60);f.sync();const state=a.snapshot;supportError=state.supportGripError??supportError;
  if(state.bagOwner==='YW')assert(state.transferGap!<1e-6,'Shared-navigation handoff jumped');
  if(['kiss-approach','kiss','shy'].includes(a.phase))assert(!state.bagVisible,'Bag was not stowed before kiss');
  if(cancelPhase&&a.phase===cancelPhase&&!cancelled){a.update(.2);a.cancel();cancelled=true;}if(done)break;
 }
 assert(done,'Gift shared navigation stuck '+cancelPhase);if(cancelPhase)assert(cancelled,'Gift cancel phase missing '+cancelPhase);
 if(!cancelPhase)assert(supportError!==undefined&&supportError<.2,'Support hand not near handle '+supportError);
 assert(!f.scene.getObjectByName('little-life-scene'));assert(!f.scene.getObjectByName('surprise-gift-box'));assert(!f.scene.getObjectByName('gift-heart'));
}
// Every life scene must keep ownership/grips correct away from world origin.
for(const kind of LIFE_ACTIONS){const f=fixture(),anchor=new T.Vector2(4,3);if(kind==='flower')f.world.setFlowerPoint(anchor.x,anchor.y);const a=new LifeScene(kind,f.actors,f.scene,f.world,f.move,f.walk,()=>{},anchor,10);let done=false;for(let n=0;n<9000;n++){f.actors.forEach(f.walk);done=a.update(1/60);f.sync();if(kind==='gift'&&a.snapshot.bagOwner==='YW')assert(a.snapshot.transferGap!<1e-6,'Translated handoff jumps');if(done)break;}assert(done,kind+' shifted scene stuck');assert(!f.scene.getObjectByName('little-life-scene'));}
console.log(JSON.stringify({passed:true,results,checks:['all normal stages','cancel every stage','single bag with exact grip handoff','five flowers and pre/post-commit cancellation','finite poses','quiet event cues','no scene roots left','five-flower office with shared navigator, full/partial route and cancellation']}));
