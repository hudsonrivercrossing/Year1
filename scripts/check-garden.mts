import assert from 'node:assert/strict';
import * as T from 'three';
import {LittleLifeWorld} from '../src/life-scenes';
import {planFlower} from '../src/garden';
import {findClearing,clearance,type Obstacle} from '../src/navigation';

const bounds={wanderX:11.5,wanderZ:8},actors=[{x:-2,z:0},{x:2,z:0}];
let planted=0;
for(let seed=1;seed<=20;seed++){
 let state=seed;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
 const scene=new T.Scene(),world=new LittleLifeWorld(scene,()=>new T.Group());
 for(let i=0;i<5;i++){
  world.prepareFlower(random);const plan=planFlower(actors,world.obstacles,bounds,{x:1,z:0},random);
  assert(plan,`garden ${seed} stalled at ${i}`);world.setFlowerPoint(plan.center.x,plan.center.z);world.plant();
  assert.equal(world.snapshot.flowers,i+1);
  assert(world.obstacles.every((o,j,all)=>all.every((other,k)=>j===k||clearance(o.a,other)>=3.1)));
  assert(findClearing(actors,world.obstacles,bounds,'overtime'),'flowers blocked office ingress');
  assert(findClearing(actors,world.obstacles,bounds,'basic'),'flowers blocked interactions');
  planted++;
 }
 assert(world.full);assert.equal(new Set(world.snapshot.items.map(f=>f.color)).size,5);
 let last=-1;for(let i=0;i<20;i++){world.prepareFlower(random);assert.notEqual(world.selectedId,last);last=world.selectedId;world.plant();assert.equal(world.snapshot.flowers,5);}
 world.reset();assert.equal(world.obstacles.length,0);assert.equal(world.snapshot.flowers,0);
 assert.equal(scene.children.filter(o=>o.name==='anniversary-flower').length,1);
}
const blocked:Obstacle[]=[{a:{x:-20,z:0},b:{x:20,z:0},radius:30}];
assert.equal(planFlower(actors,blocked,bounds,{x:1,z:0}),undefined);
console.log(JSON.stringify({passed:true,planted,checks:['20 seeded five-flower layouts','office ingress and interaction space remain','five colors','no immediate repeat at capacity','reset clears all colliders','no unsafe fallback']}));
