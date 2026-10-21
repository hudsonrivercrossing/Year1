import fs from 'node:fs';
import * as T from 'three';
import {fileURLToPath} from 'node:url';
import {HandProps} from '../src/hand-props.ts';
const base=fileURLToPath(new URL('../',import.meta.url));
const makePart=(id,color)=>{const root=new T.Group();for(const vertices of Object.values(JSON.parse(fs.readFileSync(base+'public/models/'+id+'.json','utf8')))){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices.map((v,i)=>v*.035*(i%3===0?1:-1)),3));root.add(new T.Mesh(g,new T.MeshStandardMaterial({color})));}return root;};
const scene=new T.Scene();
const actors=[0,1].map(i=>{const root=new T.Group();root.position.set(i===0?-2:2,2.52,0);scene.add(root);const waist=new T.Group(),upper=new T.Group();waist.position.y=-1.12;upper.position.y=1.12;root.add(waist);waist.add(upper);const parts={};for(const id of ['legs','torso','head','hair','rightArm','leftArm']){parts[id]=new T.Group();upper.add(parts[id]);}
 for(const [key,id,x]of[['rightArm','3818',-15.552],['leftArm','3819',15.552]]){const a=parts[key];a.position.set(x*.035,-9*.035,0);a.rotation.z=(key==='rightArm'?-1:1)*T.MathUtils.degToRad(9.782);a.add(makePart(id,'#999999'));const hand=makePart('3820','#ffcc33');hand.position.set((key==='rightArm'?-5:5)*.035,-20*.035,10*.035);hand.rotation.x=Math.PI/4;a.add(hand);}
 return{root,parts,waist,x:root.position.x,z:0,heading:0};});
let impacts=0;const props=new HandProps(scene,actors,makePart,()=>impacts++);
const assert=(c,m)=>{if(!c)throw Error(m);};
const neutral=()=>actors.forEach(f=>{f.waist.rotation.x=0;f.parts.rightArm.rotation.x=0;f.parts.leftArm.rotation.x=0;});
const rootSync=()=>actors.forEach(f=>{f.root.position.x=f.x;f.root.position.z=f.z;f.root.rotation.y=f.heading;});
assert(actors.every(f=>f.parts.rightArm.children[1].children.length>=1),'Actual hand geometry absent');
const children=actors.map(f=>[f.parts.rightArm.children[1].children.length,f.parts.leftArm.children[1].children.length]);
props.equip();props.updatePhysics(1/60);
assert(props.snapshot.held===4,'All four held props missing');
const heldBounds=[];
for(let n=0;n<120;n++){actors.forEach(f=>{f.parts.rightArm.rotation.x=-Math.sin(n/120*Math.PI*2)*.3;f.parts.leftArm.rotation.x=Math.sin(n/120*Math.PI*2)*.3;});props.updatePhysics(1/60);for(const p of props.snapshot.items){const o=scene.getObjectByName(`photo-prop-${p.actor}-${p.kind}`),b=new T.Box3().setFromObject(o);if(n===0)heldBounds.push({actor:p.actor,kind:p.kind,min:b.min.toArray(),max:b.max.toArray()});assert(b.min.y>.075,`Held ${p.kind} crosses floor: ${b.min.y}`);assert(Math.hypot(...p.position.map((v,j)=>v-p.grip[j]))<1e-6,'Grip not matched');}}
neutral();props.updatePhysics(1/60);props.drop();const origins=props.snapshot.origins.map(r=>r.position);
actors[0].x=-.5;actors[0].z=3;actors[1].x=.5;actors[1].z=3;rootSync();
for(let n=0;n<360;n++)props.updatePhysics(1/60);
assert(props.snapshot.dropped===4&&props.snapshot.items.every(p=>p.body),'Drops not physical');
assert(impacts>0,'No floor impact callback');
for(const p of props.snapshot.items)assert(Math.hypot(p.position[0]-origins[p.actor][0],p.position[2]-origins[p.actor][1])<3.1,'Prop thrown too far');
const move=(f,x,z,dt,speed)=>{const dx=x-f.x,dz=z-f.z,d=Math.hypot(dx,dz);if(d>.00001){const s=Math.min(d,dt*speed);f.x+=dx/d*s;f.z+=dz/d*s;f.heading=Math.atan2(dx,dz);}return d;};
const walk=(f,amount,t)=>{f.parts.rightArm.rotation.x=-Math.sin(t*8)*.3*amount;f.parts.leftArm.rotation.x=Math.sin(t*8)*.3*amount;};
assert(props.beginRecovery(),'Recovery failed to start');let done=false,frames=0,peakJump=0;let last=props.snapshot.items.map(p=>p.position);
for(;frames<1800&&!done;frames++){neutral();done=props.updateRecovery(1/60,move,walk,frames/60);rootSync();props.updatePhysics(1/60);const now=props.snapshot.items.map(p=>p.position);now.forEach((p,i)=>peakJump=Math.max(peakJump,Math.hypot(...p.map((v,j)=>v-last[i][j]))));last=now;}
assert(done&&props.snapshot.held===4&&props.snapshot.items.every(p=>!p.body),'Recovery incomplete');assert(peakJump<.16,'Pickup teleported a prop '+peakJump);
for(const f of actors)assert(Math.abs(f.waist.rotation.x)<.00001,'Waist did not straighten');
props.drop();assert(props.beginRecovery(),'Immediate cancellation recovery did not start');
for(let n=0;n<100;n++){neutral();props.updateRecovery(1/60,move,walk,n/60);rootSync();props.updatePhysics(1/60);}
props.reset();assert(!props.snapshot.active&&!props.snapshot.recovering,'Reset active state leaked');
actors.forEach((f,i)=>{assert(f.parts.rightArm.children[1].children.length===children[i][0]&&f.parts.leftArm.children[1].children.length===children[i][1],'Reset left grip node in source arm');});
assert(!scene.getObjectByName('photo-prop-0-pole'),'Reset left floor model');
props.equip();assert(props.snapshot.held===4,'Re-equip after interrupted recovery failed');
props.dispose();console.log(JSON.stringify({passed:true,frames,peakJump,impacts,heldBounds},null,2));
