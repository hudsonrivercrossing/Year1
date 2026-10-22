import * as T from 'three';
import {GIFT_BOX_LAYOUT} from './gift-layout';
const mesh=(geo:T.BufferGeometry,color:string,metalness=0)=>{const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:metalness?.32:.65,metalness}));m.userData.originalGeometry=true;m.castShadow=true;m.receiveShadow=true;return m;};
type PartFactory=(id:string,color:string)=>T.Group;
// 93091's horizontal handle is centred at LDraw y=0; its bottom is y=28.5.
// Keep the original LDraw scale (.035) and move only the origin to the bottom.
export const BAG_GRIP=new T.Vector3(.26,.9975,0);
export const BAG_SUPPORT=new T.Vector3(-.26,.9975,0);
export const GIFT_BOX_POSITION=new T.Vector3(GIFT_BOX_LAYOUT.x,.08,GIFT_BOX_LAYOUT.z);
// Circumscribed footprint of the 4 x 3 stud box, including lid overhang.
export const GIFT_BOX_RADIUS=GIFT_BOX_LAYOUT.radius;
export const BAG_IN_BOX=new T.Vector3(GIFT_BOX_LAYOUT.x,.36,GIFT_BOX_LAYOUT.z);
/** Official LDraw 93091, with a deliberately virtual warm-brown colour. */
export function makeGiftBag(make:PartFactory){
 const bag=new T.Group();bag.name='one-gift-bag';
 const part=make('93091','#a96e3e');part.position.y=.9975;bag.add(part);
 bag.userData.standardParts=['93091'];bag.userData.virtualColor=true;return bag;
}
/** Hollow 4 x 3 stud gift box, assembled only from standard part geometry.
 * Internal clearance: 1.4 x 1.68 x .7; bag: 1.333 x 1.138 x .681.
 * The lid lifts on a virtual animation pivot, not a claimed LEGO hinge. */
export function makeGiftBox(make:PartFactory){
 const root=new T.Group(),lid=new T.Group();root.name='surprise-gift-box';root.position.copy(GIFT_BOX_POSITION);
 const add=(parent:T.Group,id:string,color:string,x:number,y:number,z:number,turn=0)=>{const part=make(id,color);part.position.set(x,y,z);part.rotation.y=turn;parent.add(part);};
 const orange='#d58b45',ribbon='#664333';
 for(const x of [-.7,.7])add(root,'3021',orange,x,.28,0,Math.PI/2);
 for(const y of [1.12,1.96]){
  for(const z of [-.7,.7])add(root,'3010',orange,0,y,z);
  for(const x of [-1.05,1.05])add(root,'3005',orange,x,y,0);
 }
 lid.position.set(0,1.96,-1.05);root.add(lid);
 for(const x of [-.7,.7])add(lid,'3021',orange,x,.28,1.05,Math.PI/2);
 // A flush cross of five standard 1 x 2 tiles; no synthetic ribbon meshes.
 for(const x of [-1.05,1.05])add(lid,'3069b',ribbon,x,.56,1.05,Math.PI/2);
 for(const z of [.35,1.05,1.75])add(lid,'3069b',ribbon,0,.56,z);
 root.userData.standardParts=['3021','3010','3005','3069b'];
 return {root,lid};
}
export function makeSmallHeart(){
 const shape=new T.Shape();shape.moveTo(0,-.18);shape.bezierCurveTo(-.35,.03,-.25,.29,-.11,.24);shape.quadraticCurveTo(0,.24,0,.14);shape.bezierCurveTo(.15,.35,.37,.15,0,-.18);
 const heart=mesh(new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:false}), '#bf7772');heart.name='gift-heart';return heart;
}
