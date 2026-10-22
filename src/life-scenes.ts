import * as T from 'three';
import {headPose,type Actor} from './affection';
import type {SoundCue} from './sound-effects';
import grips from './photo-props.json' with {type:'json'};

export const LIFE_ACTIONS=['overtime','flower','gift'] as const;
export type LifeId=typeof LIFE_ACTIONS[number];
export const isLifeAction=(id:string):id is LifeId=>(LIFE_ACTIONS as readonly string[]).includes(id);
type Maker=(id:string,color:string)=>T.Group;
type Move=(f:Actor,x:number,z:number,dt:number,speed:number)=>number;
const ease=(v:number)=>T.MathUtils.smoothstep(v,0,1);
const turn=(f:Actor,a:number,dt:number)=>{f.heading+=Math.atan2(Math.sin(a-f.heading),Math.cos(a-f.heading))*(1-Math.exp(-dt*8));};
const grip=new T.Vector3(grips.handGrip[0]*.035,-grips.handGrip[1]*.035,-grips.handGrip[2]*.035);
const palm=(f:Actor,hand:'leftArm'|'rightArm')=>f.parts[hand].children[1].localToWorld(grip.clone());
const box=(x:number,y:number,z:number,color:string)=>{const m=new T.Mesh(new T.BoxGeometry(x,y,z),new T.MeshStandardMaterial({color,roughness:.38}));m.castShadow=true;m.receiveShadow=true;return m;};
function clear(root:T.Group){root.removeFromParent();root.traverse(o=>{if(o instanceof T.Mesh){if(o.userData.originalGeometry)o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}}});root.clear();}
function originalBox(x:number,y:number,z:number,color:string){const m=box(x,y,z,color);m.userData.originalGeometry=true;return m;}

/** Permanent objects belong to the world, transient props to one scene. */
export class LittleLifeWorld{
 readonly flower=new T.Group();planted=false;
 readonly flowerPoint=new T.Vector2(-5,-3);
 constructor(private scene:T.Scene,readonly make:Maker){
  this.flower.name='anniversary-flower';this.flower.visible=false;this.flower.position.set(-5,.04,-3);
  const base=make('3068b','#a6b48b');base.position.y=.28;
  const stem=make('99249','#60865b');stem.position.y=.28;
  const petals=make('24866','#dc8e91');petals.name='flower-petals';petals.position.set(0,2.03,0);
  this.flower.add(base,stem,petals);scene.add(this.flower);
 }
 plant(){this.planted=true;this.flower.visible=true;this.flower.scale.setScalar(1);}
 reset(){this.planted=false;this.flower.visible=false;this.flower.scale.setScalar(1);}
 get obstacle(){return this.planted?{x:-5,z:-3,radius:1.3}:undefined;}
 get snapshot(){return{flowers:Number(this.planted),position:this.flower.position.toArray()};}
}

type Stage={name:string;duration?:number;points?:[number,number][]};
/** A bounded stage machine with one release -> clear -> exit cancellation route.
 * Joints stay rigid; the table and gift never acquire duplicated owners. */
export class LifeScene{
 private root=new T.Group();private furniture=new T.Group();private laptop=new T.Group();private lid=new T.Group();private gift=new T.Group();private seed=new T.Group();
 private index=0;private time=0;private total=0;private done=false;private cancelled=false;private release=0;private committed=false;private owner:'DJ'|'YW'='DJ';private tick=0;
 private cancelGiftPosition=new T.Vector3();private clearViaSeat=false;private exitFrom=-13;private saved?:{height:number;legs:number[];arms:number[];waist:number}[];
 private stages:Stage[];private seatBlend=0;private bagVisible=false;private transferGap:number|undefined;
 constructor(readonly kind:LifeId,private actors:Actor[],private scene:T.Scene,private world:LittleLifeWorld,private move:Move,private walk:(f:Actor,k:number)=>void,private sound:(cue:SoundCue)=>void){
  this.root.name='little-life-scene';scene.add(this.root);
  if(kind==='overtime'){
   this.buildOffice();this.stages=[{name:'make-room',points:[[-3,-3],[3,-3]]},{name:'enter',duration:2},{name:'beside-seats',points:[[-3,-1.65],[3,-1.65]]},{name:'take-seats',points:[[-1.35,-1.65],[1.35,-1.65]]},{name:'sit',duration:1},{name:'work',duration:5.5},{name:'stand',duration:1},{name:'leave-seats',points:[[-3,-1.65],[3,-1.65]]},{name:'clear',points:[[-3,-3],[3,-3]]},{name:'exit',duration:2}];
  }else if(kind==='flower'){
   this.seed.add(world.make('24866','#dc8e91'));this.root.add(this.seed);this.seed.visible=!world.planted;
   this.stages=[{name:'approach',points:[[-6.1,-1.4],[-3.9,-1.4]]},{name:'reveal',duration:1.2},{name:world.planted?'tend':'plant',duration:2.4},{name:'admire',duration:3},{name:'release',duration:.8}];
  }else{
   this.buildGift();this.stages=[{name:'approach',points:[[-.95,1],[.95,1]]},{name:'reveal',duration:1.4},{name:'offer',duration:1.5},{name:'receive',duration:1.2},{name:'show',duration:2.8},{name:'stow',duration:1.2},{name:'release',duration:.65}];
  }
 }
 private buildOffice(){
  const make=this.world.make;this.root.add(this.furniture);this.furniture.position.z=-13;this.furniture.rotation.y=Math.PI;
  const top=make('3032','#bca58a');top.position.y=1.96;this.furniture.add(top);
  for(const x of [-1.75,1.75])for(const z of [-.98])for(const y of [.84,1.68]){const leg=make('3005','#e0d8c6');leg.position.set(x,y,z);this.furniture.add(leg);}
  for(const x of [-1.35,1.35]){
   const chair=make('4079','#8a9b9b');chair.position.set(x,.89,1.65);chair.rotation.y=Math.PI;this.furniture.add(chair);
   const pedestal=make('3005','#b9b4a6');pedestal.position.set(x,.56,1.65);this.furniture.add(pedestal);
  }
  this.laptop.position.set(0,2.38,0);this.laptop.rotation.y=Math.PI;this.furniture.add(this.laptop);
  const base=make('3068b','#434e53');this.laptop.add(base);
  this.lid.position.set(0,0,-.7);this.laptop.add(this.lid);const back=make('3068b','#434e53');back.position.z=.7;this.lid.add(back);this.lid.rotation.x=-1.08;
  const screen=originalBox(1.12,.018,1.04,'#b7d9cf');screen.position.set(0,.155,.7);this.lid.add(screen);
  for(let row=0;row<3;row++){const line=originalBox(.55-row*.1,.025,.025,'#e7f0db');line.position.set(-.15,.174,.4+row*.18);this.lid.add(line);}
  for(const x of [-.35,0,.35]){const key=originalBox(.2,.025,.14,'#c0c5bd');key.position.set(x,.17,.2);this.laptop.add(key);}
 }
 private buildGift(){
  this.root.add(this.gift);this.gift.name='one-gift-bag';this.gift.visible=false;
  // Standard 1x2 brick body, original rigid handles/flap and clasp. No logo.
  const body=this.world.make('3023','#b37845');body.rotation.y=Math.PI/2;body.position.y=.34;this.gift.add(body);
  const front=originalBox(1.3,.65,.6,'#b37845');front.position.y=.35;this.gift.add(front);
  const flap=originalBox(1.32,.2,.05,'#956036');flap.position.set(0,.61,.325);this.gift.add(flap);
  for(const x of [-.26,.26]){const side=originalBox(.055,.38,.055,'#805331');side.position.set(x,.91,0);this.gift.add(side);}
  const handle=originalBox(.57,.055,.055,'#805331');handle.position.set(0,1.1,0);this.gift.add(handle);
  const clasp=originalBox(.09,.13,.035,'#d7b66e');clasp.position.set(0,.52,.365);this.gift.add(clasp);
 }
 get phase(){return this.done?'done':this.cancelled?this.release<1?'release':this.release<2?'clear':'exit':this.stages[this.index]?.name??'done';}
 get snapshot(){return{id:this.kind,phase:this.phase,stage:this.index,time:this.time,total:this.total,cancelled:this.cancelled,seatBlend:this.seatBlend,flowerCommitted:this.committed,bagOwner:this.owner,bagVisible:this.bagVisible,bagInstances:this.gift.parent?1:0,transferGap:this.transferGap,bagRotation:this.gift.rotation.y,furnitureZ:this.furniture.position.z,rootAttached:!!this.root.parent};}
 private advance(){this.index++;this.time=0;}
 private positions(points:number[][],dt:number){let arrived=true;this.actors.forEach((f,i)=>{const[x,z]=points[i],d=Math.hypot(f.x-x,f.z-z);if(d>.03){arrived=false;this.move(f,x,z,dt,2.4);this.walk(f,.85);}});return arrived;}
 private face(dt:number){this.actors.forEach((f,i)=>turn(f,this.kind==='overtime'?0:this.kind==='flower'?Math.atan2(-5-f.x,-3-f.z):i===0?Math.PI/2:-Math.PI/2,dt));}
 private seated(k:number){this.seatBlend=k;this.actors.forEach((f,i)=>{f.legPivots.forEach(p=>p.rotation.x=-Math.PI/2*k);f.heightOffset=-.23*k;f.parts.rightArm.rotation.x=(i===1?-1.6:-.7)*k;f.parts.leftArm.rotation.x=(i===0?-1.6:-.7)*k;headPose(f,.05*k);});}
 private updateRoots(){for(const f of this.actors){f.root.position.set(f.x,2.52+f.heightOffset,f.z);f.root.rotation.y=f.heading;}this.scene.updateMatrixWorld(true);}
 private holdGift(position:T.Vector3){this.gift.position.copy(position).add(new T.Vector3(0,-1.08,0));this.gift.rotation.set(0,0,0);}
 cancel(){
  if(this.done||this.cancelled)return;this.cancelGiftPosition.copy(this.gift.position);this.cancelled=true;this.release=0;this.time=0;this.exitFrom=this.furniture.position.z;this.clearViaSeat=this.kind==='overtime'&&['take-seats','sit','work','stand','leave-seats'].includes(this.stages[this.index]?.name);
  this.saved=this.actors.map(f=>({height:f.heightOffset,legs:f.legPivots.map(p=>p.rotation.x),arms:[f.parts.rightArm.rotation.x,f.parts.leftArm.rotation.x],waist:f.waist.rotation.x}));
 }
 private cancelUpdate(dt:number){
  this.time+=dt;
  if(this.release===0){const k=1-ease(this.time/.8);this.actors.forEach((f,i)=>{const s=this.saved![i];f.heightOffset=s.height*k;f.legPivots.forEach((p,j)=>p.rotation.x=s.legs[j]*k);f.parts.rightArm.rotation.x=s.arms[0]*k;f.parts.leftArm.rotation.x=s.arms[1]*k;f.waist.rotation.x=s.waist*k;});this.updateRoots();if(this.kind==='gift'&&this.bagVisible){const hand=palm(this.actors[this.owner==='DJ'?0:1],this.owner==='DJ'?'leftArm':'rightArm').add(new T.Vector3(0,-1.08,0));this.gift.position.lerpVectors(this.cancelGiftPosition,hand,ease(this.time/.6));if(this.time>.6){this.gift.visible=false;this.bagVisible=false;}}if(this.time>=.8){this.seed.visible=false;this.release=1;this.time=0;}}
  else if(this.release===1){if(this.kind!=='overtime'||this.exitFrom<=-12.99){this.release=2;this.time=0;}else if(this.clearViaSeat){if(this.positions([[-3,-1.65],[3,-1.65]],dt))this.clearViaSeat=false;}else if(this.positions([[-3,-3],[3,-3]],dt)){this.release=2;this.time=0;}}
  else{if(this.kind==='overtime')this.furniture.position.z=T.MathUtils.lerp(this.exitFrom,-13,ease(this.time/1.8));if(this.kind!=='overtime'||this.time>=1.8){this.dispose();return true;}}
  return false;
 }
 update(dt:number){
  if(this.done)return true;this.total+=dt;if(this.cancelled)return this.cancelUpdate(dt);
  const s=this.stages[this.index];if(!s){this.dispose();return true;}this.time+=dt;
  if(s.points){if(this.positions(s.points,dt))this.advance();return false;}
  this.face(dt);const p=Math.min(1,this.time/s.duration!);
  if(this.kind==='overtime'){
   if(s.name==='enter')this.furniture.position.z=T.MathUtils.lerp(-13,0,ease(p));
   if(s.name==='sit')this.seated(ease(p));
   if(s.name==='work'){this.seated(1);this.actors.forEach((f,i)=>{f.parts.rightArm.rotation.x+=Math.sin(this.time*12+i)*.065;f.parts.leftArm.rotation.x+=Math.cos(this.time*12+i)*.065;headPose(f,.04,Math.sin(this.time*1.4+i)*.1);});const beat=Math.floor(this.time*3);if(beat>this.tick){this.tick=beat;this.sound('type');}}
   if(s.name==='stand'){this.seated(1-ease(p));this.lid.rotation.x=-1.08*(1-ease(p));}
   if(s.name==='exit')this.furniture.position.z=T.MathUtils.lerp(0,-13,ease(p));
  }else if(this.kind==='flower'){
   const[a,b]=this.actors;
   if(s.name==='reveal'){a.parts.leftArm.rotation.x=-.8*ease(p);this.updateRoots();this.seed.position.copy(palm(a,'leftArm'));}
   if(s.name==='plant'||s.name==='tend'){
    const bend=Math.sin(p*Math.PI)*.28;a.waist.rotation.x=bend;b.waist.rotation.x=bend;
    a.parts.leftArm.rotation.x=-.8;b.parts.rightArm.rotation.x=-.65;
    this.updateRoots();const from=palm(a,'leftArm'),to=new T.Vector3(-5,1.9,-3);this.seed.position.lerpVectors(from,to,ease(Math.min(1,p*1.6)));
    if(p>.62&&!this.committed){this.world.plant();this.committed=true;this.seed.visible=false;this.sound('plant');}
   }
   if(s.name==='admire'){this.actors.forEach(f=>turn(f,0,dt));headPose(a,.06,-.12);headPose(b,.06,.12);}
  }else{
   const[a,b]=this.actors;const k=s.name==='reveal'?ease(p):s.name==='stow'?1-ease(p):s.name==='release'?0:1;
   a.parts.leftArm.rotation.x=-1.12*k;b.parts.rightArm.rotation.x=-1.12*(s.name==='receive'||s.name==='show'?1:s.name==='stow'?k:0);
   this.updateRoots();const from=palm(a,'leftArm'),to=palm(b,'rightArm');
   if(s.name==='reveal'&&p>.3){this.bagVisible=true;this.gift.visible=true;}
   if(s.name==='receive'){
    // One world-space instance follows a continuous path to the recipient's grip.
    this.holdGift(from.clone().lerp(to,ease(p)));
    if(p===1&&this.owner==='DJ'){this.transferGap=this.gift.position.clone().add(new T.Vector3(0,1.08,0)).distanceTo(to);this.owner='YW';this.sound('gift');}
   }else this.holdGift(this.owner==='DJ'?from:to);
   if(s.name==='show'){headPose(b,.07,Math.sin(this.time*2)*.1);a.parts.rightArm.rotation.x=-.35;}
   if(s.name==='stow'&&p>.8){this.gift.visible=false;this.bagVisible=false;}
  }
  if(p>=1){if(s.name==='enter')this.sound('arrive');this.advance();}
  return false;
 }
 dispose(){if(this.done)return;this.done=true;clear(this.root);for(const f of this.actors)headPose(f);}
}
