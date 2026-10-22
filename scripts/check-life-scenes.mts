import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as T from 'three';
import {LifeScene,LittleLifeWorld,LIFE_ACTIONS} from '../src/life-scenes.ts';
const cache=new Map();
const make=(id:string,color:string)=>{if(!cache.has(id)){const data=JSON.parse(fs.readFileSync('public/models/'+id+'.json','utf8'));cache.set(id,Object.values(data).map((vs:any)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vs.map((v:number,i:number)=>v*.035*(i%3===0?1:-1)),3));return g;}));}const root=new T.Group();for(const geo of cache.get(id))root.add(new T.Mesh(geo,new T.MeshStandardMaterial({color})));return root;};
function fixture(){const scene=new T.Scene(),world=new LittleLifeWorld(scene,make);const actors=[0,1].map(i=>{const root=new T.Group(),waist=new T.Group(),upper=new T.Group();root.add(waist);waist.position.y=-1.12;waist.add(upper);upper.position.y=1.12;scene.add(root);const parts:any={};for(const id of ['legs','torso','head','hair','rightArm','leftArm']){parts[id]=new T.Group();upper.add(parts[id]);}
 for(const [key,id,x]of[['rightArm','3818',-15.552],['leftArm','3819',15.552]] as const){const a=parts[key];a.position.set(x*.035,-9*.035,0);a.rotation.z=(key==='rightArm'?-1:1)*T.MathUtils.degToRad(9.782);a.add(make(id,'#999999'));const hand=make('3820','#ffcc33');hand.position.set((key==='rightArm'?-5:5)*.035,-20*.035,10*.035);hand.rotation.x=Math.PI/4;a.add(hand);}
 return{root,parts,waist,legPivots:[new T.Group(),new T.Group()],heightOffset:0,footHeight:()=>0,x:i===0?-9:8,z:i===0?6:-7,heading:0};});
 const walk=(f:any)=>{f.heightOffset=0;f.waist.rotation.x=0;f.legPivots.forEach((p:any)=>p.rotation.x=0);f.parts.leftArm.rotation.x=0;f.parts.rightArm.rotation.x=0;};
 const move=(f:any,x:number,z:number,dt:number,speed:number)=>{const d=Math.hypot(x-f.x,z-f.z),k=Math.min(d,speed*dt)/(d||1);f.x+=(x-f.x)*k;f.z+=(z-f.z)*k;return d;};
 const sync=()=>{actors.forEach(f=>{f.root.position.set(f.x,2.52+f.heightOffset,f.z);f.root.rotation.y=f.heading;});scene.updateMatrixWorld(true);};
 return{scene,world,actors,walk,move,sync};}
const results=[];
for(const kind of LIFE_ACTIONS){
 const f=fixture(),cues:string[]=[],phases=new Set<string>(),a=new LifeScene(kind,f.actors,f.scene,f.world,f.move,f.walk,c=>cues.push(c));let done=false,previousOwner='DJ';
 for(let n=0;n<9000;n++){f.actors.forEach(f.walk);done=a.update(1/60);f.sync();const s=a.snapshot;phases.add(s.phase);assert(s.bagInstances<=1);if(s.bagOwner!==previousOwner){assert.equal(s.bagOwner,'YW');assert(s.transferGap!<1e-6);assert.equal(s.bagRotation,0,'Handoff changed bag orientation');previousOwner=s.bagOwner;}assert(f.actors.every(x=>[x.x,x.z,x.heightOffset,...x.legPivots.map(p=>p.rotation.x)].every(Number.isFinite)));if(done)break;}
 assert(done,kind+' never ends');assert(!f.scene.getObjectByName('little-life-scene'));if(kind==='flower'){assert.equal(f.world.snapshot.flowers,1);f.world.reset();assert.equal(f.world.snapshot.flowers,0);}if(kind==='gift')assert.equal(cues.filter(x=>x==='gift').length,1);if(kind==='overtime')assert(cues.includes('type')&&cues.includes('arrive'));
 // Interrupt every declared stage; exercise partial entry and seated cleanup.
 for(const phase of phases){if(phase==='done')continue;const g=fixture(),b=new LifeScene(kind,g.actors,g.scene,g.world,g.move,g.walk,()=>{});let reached=false,ended=false;for(let n=0;n<9000;n++){g.actors.forEach(g.walk);b.update(1/60);g.sync();if(b.phase===phase){b.update(.2);b.cancel();reached=true;break;}}assert(reached,kind+' missing '+phase);for(let n=0;n<9000;n++){g.actors.forEach(g.walk);ended=b.update(1/60);g.sync();if(ended)break;}assert(ended,kind+' cancel stuck '+phase);assert(!g.scene.getObjectByName('little-life-scene'));assert(g.actors.every(x=>Math.abs(x.heightOffset)<1e-6));}
 results.push({kind,phases:[...phases],cues});
}
// Repeated planting reuses the one permanent object.
{const f=fixture();f.world.plant();const flower=f.world.flower;for(let repeat=0;repeat<3;repeat++){const a=new LifeScene('flower',f.actors,f.scene,f.world,f.move,f.walk,()=>{});for(let n=0;n<9000;n++){f.actors.forEach(f.walk);if(a.update(1/60))break;}assert.equal(f.world.flower,flower);assert.equal(f.scene.children.filter(o=>o.name==='anniversary-flower').length,1);}}
console.log(JSON.stringify({passed:true,results,checks:['all normal stages','cancel every stage','single bag with exact grip handoff','one persistent flower and reset','finite poses','quiet event cues','no scene roots left']}));
