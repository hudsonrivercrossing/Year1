/** Geometry regression: a full-scale standard bag must really fit the cavity. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {makeGiftBag,makeGiftBox,BAG_GRIP,BAG_SUPPORT,BAG_IN_BOX,GIFT_BOX_POSITION,GIFT_BOX_RADIUS} from '../src/gift-model';
const make=(id:string,color:string)=>{const root=new T.Group();const data=JSON.parse(fs.readFileSync('public/models/'+id+'.json','utf8'));for(const vertices of Object.values(data) as number[][]){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices.map((v,i)=>v*.035*(i%3===0?1:-1)),3));root.add(new T.Mesh(geometry,new T.MeshStandardMaterial({color})));}return root;};
const bag=makeGiftBag(make),bounds=new T.Box3().setFromObject(bag);
assert(Math.abs(bounds.min.y)<1e-6,'Bag origin not at bottom');
assert(bounds.max.x<.7&&bounds.min.x>-.7&&bounds.max.z<.35&&bounds.min.z>-.35,'Full-scale bag does not fit cavity');
assert(bounds.max.y+.28<1.96,'Bag hits closed lid');
assert.equal(BAG_GRIP.y,BAG_SUPPORT.y);assert.equal(BAG_GRIP.y,.9975);
assert(Math.abs(BAG_IN_BOX.y-GIFT_BOX_POSITION.y-.28)<1e-8);
assert.equal(bag.userData.standardParts[0],'93091');
const {root,lid}=makeGiftBox(make),boxBounds=new T.Box3().setFromObject(root),center=GIFT_BOX_POSITION;
for(const x of [boxBounds.min.x,boxBounds.max.x])for(const z of [boxBounds.min.z,boxBounds.max.z])assert(Math.hypot(x-center.x,z-center.z)<=GIFT_BOX_RADIUS,'Mesh extends outside navigation footprint');
// There must be no body mesh crossing the cavity centre above the floor.
for(const child of root.children){if(child===lid)continue;const b=new T.Box3().setFromObject(child);assert(!(b.containsPoint(new T.Vector3(center.x,center.y+.8,center.z))),'Box cavity is solid');}
console.log(JSON.stringify({passed:true,bagSize:bounds.getSize(new T.Vector3()).toArray(),boxSize:boxBounds.getSize(new T.Vector3()).toArray(),checks:['original LDraw scale','bag fits hollow cavity','closed lid clearance','grip bar height','conservative navigation footprint']}));
