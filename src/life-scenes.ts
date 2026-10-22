import * as T from 'three';
import {headPose,type Actor} from './affection';
import type {Point} from './navigation';
import {officeObstacles,OFFICE_ROUTE} from './office-layout';
import {makeGiftBag,makeGiftBox,makeSmallHeart} from './gift-model';
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
export const FLOWER_STYLES=[
 {name:'rose',color:'#dc8e91',petals:1},
 {name:'sunshine',color:'#e8bd59',petals:2},
 {name:'lavender',color:'#ad9ac5',petals:3},
 {name:'ivory',color:'#f4e9cb',petals:4},
 {name:'cornflower',color:'#8ebbc9',petals:5},
] as const;
type Flower={id:number;root:T.Group;point:T.Vector2;radius:number;style:number};
export class LittleLifeWorld{
 readonly flowers:Flower[]=[];private selected:Flower;private lastDance=-1;
 constructor(private scene:T.Scene,readonly make:Maker){this.selected=this.create(0);}
 private create(style:number):Flower{
  const root=new T.Group(),spec=FLOWER_STYLES[style];root.name='anniversary-flower';root.visible=false;root.position.set(-5,.04,-3);
  const base=this.make('3068b','#a6b48b');base.position.y=.28;
  const stem=this.make('99249','#60865b');stem.position.y=.28;root.add(base,stem);
  // Five rigid assemblies of standard flower plates; never stretch a source mesh.
  for(let n=0;n<spec.petals;n++){
   const petals=this.make('24866',spec.color);petals.name='flower-petals';
   const r=spec.petals<=2?0:.24,angle=n*Math.PI*2/spec.petals;
   petals.position.set(Math.cos(angle)*r,2.03+n*.065,Math.sin(angle)*r);petals.rotation.y=n*.7;root.add(petals);
  }
  this.scene.add(root);return{id:style,root,point:new T.Vector2(-5,-3),radius:1.05,style};
 }
 get flower(){return this.selected.root;}
 get flowerPoint(){return this.selected.point;}
 get planted(){return this.flowers.includes(this.selected);}
 get full(){return this.flowers.length>=5;}
 prepareFlower(random=Math.random){
  if(this.full){const options=this.flowers.filter(f=>f.id!==this.lastDance);this.selected=options[Math.floor(random()*options.length)]??this.flowers[0];this.lastDance=this.selected.id;}
  else if(this.planted)this.selected=this.create(this.flowers.length);
 }
 setFlowerPoint(x:number,z:number){if(this.planted)return;this.flowerPoint.set(x,z);this.flower.position.set(x,.04,z);}
 plant(){if(!this.planted&&!this.full)this.flowers.push(this.selected);this.flower.visible=true;}
 reset(){const roots=new Set([...this.flowers.map(f=>f.root),this.flower]);for(const root of roots)clear(root);this.flowers.length=0;this.lastDance=-1;this.selected=this.create(0);}
 get obstacles(){return this.flowers.map(f=>({a:{x:f.point.x,z:f.point.y},b:{x:f.point.x,z:f.point.y},radius:f.radius,kind:'flower',owner:100+f.id}));}
 get obstacle(){return this.planted?{x:this.flowerPoint.x,z:this.flowerPoint.y,radius:this.selected.radius}:undefined;}
 get selectedId(){return this.selected.id;}
 get snapshot(){return{flowers:this.flowers.length,position:this.flower.position.toArray(),selected:this.selected.id,full:this.full,items:this.flowers.map(f=>({id:f.id,position:f.root.position.toArray(),style:FLOWER_STYLES[f.style].name,color:FLOWER_STYLES[f.style].color,radius:f.radius}))};}
}

type Stage={name:string;duration?:number;points?:[number,number][]};
/** A bounded stage machine with one release -> clear -> exit cancellation route.
 * Joints stay rigid; the table and gift never acquire duplicated owners. */
export class LifeScene{
 private giftBox=new T.Group();private boxLid=new T.Group();private heart:T.Mesh|undefined;private events=new Set<string>();private supportGrip?:{x:number;z:number;error:number};private root=new T.Group();private furniture=new T.Group();private laptop=new T.Group();private lid=new T.Group();private gift=new T.Group();private seed=new T.Group();
 private index=0;private time=0;private total=0;private done=false;private cancelled=false;private release=0;private committed=false;private owner:'DJ'|'YW'='DJ';private tick=0;
 private anchor:T.Vector2;private entryZ:number;private cancelGiftPosition=new T.Vector3();private clearViaSeat=false;private exitFrom=-13;private saved?:{height:number;legs:number[];arms:number[];waist:number}[];
 private routeIndex=0;private routePause=0;private stages:Stage[];private seatBlend=0;private bagVisible=false;private transferGap:number|undefined;
 constructor(readonly kind:LifeId,private actors:Actor[],private scene:T.Scene,private world:LittleLifeWorld,private move:Move,private walk:(f:Actor,k:number)=>void,private sound:(cue:SoundCue)=>void,anchor?:T.Vector2,entryZ=-13,flowerStands?:Point[],private officeCompact=false){
  this.anchor=anchor??(kind==='flower'?world.flowerPoint.clone():new T.Vector2());this.entryZ=entryZ;this.root.position.set(this.anchor.x,0,this.anchor.y);
  this.root.name='little-life-scene';scene.add(this.root);
  if(kind==='overtime'){
   this.buildOffice();this.stages=[{name:'make-room',points:[[-3.8,-3.6],[3.8,-3.6]]},{name:'enter',duration:2},{name:'beside-seats',points:[[-3.8,-3.6],[0,-3.6]]},{name:'take-seats',points:[[-3.8,-3.6],[0,-1.65]]},{name:'sit',duration:1},{name:'work',duration:18},{name:'stand',duration:1},{name:'leave-seats',points:[[-3.8,-3.6],[0,-3.6]]},{name:'clear',points:[[-3.8,-3.6],[3.8,-3.6]]},{name:'exit',duration:2}];
  }else if(kind==='flower'){
   this.seed.add(world.make('24866',FLOWER_STYLES[world.selectedId].color));this.root.add(this.seed);this.seed.visible=!world.planted;
   this.stages=[{name:'approach',points:flowerStands?flowerStands.map(p=>[p.x-this.anchor.x,p.z-this.anchor.y]):[[-1.1,1.6],[1.1,1.6]]},{name:'reveal',duration:1.2},{name:world.planted?'flower-dance':'plant',duration:world.planted?5.5:2.4},{name:'admire',duration:3},{name:'release',duration:.8}];
  }else{
   this.buildGift();this.stages=[{name:'unwrap-approach',points:[[-2.5,-1.7],[1.4,1]]},{name:'unwrap',duration:1.4},{name:'tuck-away',duration:.7},{name:'approach',points:[[-1.3,1],[1.3,1]]},{name:'curious',duration:1.1},{name:'hide-turn',duration:1.1},{name:'reveal',duration:1.4},{name:'offer',duration:1.2},{name:'receive',duration:1.2},{name:'show',duration:3.2},{name:'stow',duration:1},{name:'kiss-approach',points:[[-.54,1],[.54,1]]},{name:'kiss',duration:2.2},{name:'shy-space',points:[[-1.2,1],[1.2,1]]},{name:'shy',duration:2.3},{name:'separate',points:[[-1.4,1],[1.4,1]]},{name:'release',duration:.65}];
  }
 }
 private buildOffice(){
  const make=this.world.make;this.root.add(this.furniture);this.furniture.position.z=this.entryZ;this.furniture.rotation.y=Math.PI;
  const top=make('3032','#bca58a');top.position.y=1.96;this.furniture.add(top);
  for(const x of [-1.75,1.75])for(const z of [-.98])for(const y of [.84,1.68]){const leg=make('3005','#e0d8c6');leg.position.set(x,y,z);this.furniture.add(leg);}
  for(const x of [0]){
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
  this.gift=makeGiftBag(this.world.make);this.gift.visible=false;this.root.add(this.gift);
  const box=makeGiftBox();this.giftBox=box.root;this.boxLid=box.lid;this.root.add(this.giftBox);
  this.heart=makeSmallHeart();this.heart.visible=false;this.root.add(this.heart);
 }
 private event(id:string,cue:SoundCue){if(this.events.has(id))return;this.events.add(id);this.sound(cue);}
 private supportHand(){
  const actor=this.actors[0],arm=actor.parts.rightArm,target=this.gift.localToWorld(new T.Vector3(-.26,1.08,.2));
  let x=-1.12,z=.4,error=Infinity;
  for(let step=.4;step>.02;step*=.5){let best={x,z,error};for(const dx of [-step,0,step])for(const dz of [-step,0,step]){arm.rotation.x=T.MathUtils.clamp(x+dx,-2.2,.5);arm.rotation.z=T.MathUtils.clamp(z+dz,-.9,.9);this.scene.updateMatrixWorld(true);const d=palm(actor,'rightArm').distanceTo(target);if(d<best.error)best={x:arm.rotation.x,z:arm.rotation.z,error:d};}({x,z,error}=best);}
  this.supportGrip={x,z,error};arm.rotation.x=x;arm.rotation.z=z;
 }
 private giftPose(stage:string,p:number,dt:number){
  const[a,b]=this.actors;
  const hidden=['unwrap-approach','approach','curious','hide-turn'].includes(stage);
  const showing=['reveal','offer','receive'].includes(stage);
  if(hidden){a.parts.leftArm.rotation.x=.65;a.parts.leftArm.rotation.z=.12;}
  if(stage==='tuck-away'){a.parts.leftArm.rotation.x=T.MathUtils.lerp(-1,.65,ease(p));a.parts.leftArm.rotation.z=.12;this.boxLid.rotation.x=-1.6*(1-ease(p));this.giftBox.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshStandardMaterial;m.transparent=true;m.opacity=1-ease(p);}});if(p>.98)this.giftBox.visible=false;}
  if(stage==='unwrap'){
   a.parts.leftArm.rotation.x=-1; a.waist.rotation.x=Math.sin(p*Math.PI)*.12;this.updateRoots();
   this.boxLid.rotation.x=-1.6*ease(p);if(p>.12)this.event('box','boxOpen');
   this.bagVisible=true;this.gift.visible=true;const from=new T.Vector3(-.3,.57,-1.7),to=palm(a,'leftArm').sub(this.root.position).sub(new T.Vector3(.26,1.08,.2).applyAxisAngle(new T.Vector3(0,1,0),Math.PI/2));this.gift.position.lerpVectors(from,to,ease(Math.max(0,(p-.2)/.8)));this.gift.rotation.y=Math.PI/2;return;
  }
  if(stage==='curious')headPose(b,.03,-.12,.06*Math.sin(p*Math.PI));
  if(stage==='hide-turn'){turn(a,Math.PI/2-.8*Math.sin(p*Math.PI),dt);headPose(b,.03,-.12,.04);}
  if(showing){const k=stage==='reveal'?ease(p):1;a.parts.leftArm.rotation.x=T.MathUtils.lerp(.65,-1.12,k);a.parts.leftArm.rotation.z=T.MathUtils.lerp(.12,-.25,k);}
  if(stage==='receive'||stage==='show'||stage==='stow')b.parts.rightArm.rotation.x=stage==='show'?T.MathUtils.lerp(-1.12,-.35,ease(p*3)):stage==='stow'?-.35*(1-ease(p)):-1.12;
  if(stage==='show'){turn(b,-Math.PI/2+Math.sin(p*Math.PI*2)*.45,dt);headPose(b,.03,Math.sin(p*Math.PI*2)*.08);headPose(a,.03,.08);}
  this.updateRoots();const from=palm(a,'leftArm'),to=palm(b,'rightArm');
  if(stage==='receive'){
   this.holdGift(from.clone().lerp(to,ease(p)));
   if(p===1&&this.owner==='DJ'){this.transferGap=this.gift.localToWorld(new T.Vector3(.26,1.08,.2)).distanceTo(to);this.owner='YW';this.event('handoff','gift');}
  }else this.holdGift(this.owner==='DJ'?from:to,hidden?a.heading:stage==='show'?T.MathUtils.lerp(Math.PI/2,b.heading+Math.PI/2,ease(p/.25)):stage==='stow'?b.heading+Math.PI/2:Math.PI/2);
  if(stage==='offer'){if(!this.supportGrip)this.supportHand();const k=ease(p/.35);a.parts.rightArm.rotation.x=this.supportGrip!.x*k;a.parts.rightArm.rotation.z=T.MathUtils.lerp(-T.MathUtils.degToRad(9.782),this.supportGrip!.z,k);b.parts.rightArm.rotation.x=-1.12*ease(p);}
  if(stage==='receive'&&this.supportGrip){const k=1-ease(p/.4);a.parts.rightArm.rotation.x=this.supportGrip.x*k;a.parts.rightArm.rotation.z=T.MathUtils.lerp(-T.MathUtils.degToRad(9.782),this.supportGrip.z,k);}
  if(stage==='offer'||stage==='receive'){this.heart!.visible=true;this.heart!.position.set(0,4.1+Math.sin(p*Math.PI)*.12,1);this.heart!.rotation.y=.2;}
  else this.heart!.visible=false;
  if(stage==='stow'&&p>.8){this.gift.visible=false;this.bagVisible=false;this.event('clasp','clasp');}
  if(stage==='kiss'){
   const k=Math.sin(p*Math.PI);headPose(b,.08*k,-.18*k,.04*k);headPose(a,.08*k,.12*k,-.04*k);b.parts.rightArm.rotation.x=.18*k;b.parts.leftArm.rotation.x=.2*k;turn(a,Math.PI/2+.65,dt);turn(b,-Math.PI/2,dt);
   this.heart!.visible=true;this.heart!.position.set(0,3.8+Math.sin(p*Math.PI)*.18,1);if(p>.35)this.event('kiss','kiss');
  }
  if(stage==='shy'){const k=Math.sin(p*Math.PI);headPose(a,.12*k,-.28*k,-.06*k);a.parts.rightArm.rotation.x=-2.05*k;a.parts.leftArm.rotation.x=-1.9*k;headPose(b,.03,.12*k);if(p>.2)this.event('shy','shy');}
  if(stage==='release')this.giftBox.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshStandardMaterial;m.transparent=true;m.opacity=1-ease(p);}});
 }
 get phase(){return this.done?'done':this.cancelled?this.release<1?'release':this.release<2?'clear':'exit':this.stages[this.index]?.name??'done';}
 get snapshot(){return{id:this.kind,phase:this.phase,stage:this.index,time:this.time,total:this.total,cancelled:this.cancelled,seatBlend:this.seatBlend,routeIndex:this.routeIndex,furnitureObstacles:this.movementObstacles,flowerCommitted:this.committed,bagOwner:this.owner,bagVisible:this.bagVisible,bagInstances:this.gift.parent?1:0,transferGap:this.transferGap,bagRotation:this.gift.rotation.y,boxVisible:this.giftBox.visible&&!!this.giftBox.parent,heartVisible:this.heart?.visible??false,supportGripError:this.supportGrip?.error,furnitureZ:this.furniture.position.z,anchor:this.anchor.toArray(),rootAttached:!!this.root.parent};}
 get movementObstacles(){return this.kind==='overtime'?officeObstacles({x:this.anchor.x,z:this.anchor.y},this.furniture.position.z):[];}
 obstaclesFor(actor:number){
  if(this.kind==='gift')return this.giftBox.visible?[{a:{x:this.anchor.x-.3,z:this.anchor.y-1.7},b:{x:this.anchor.x-.3,z:this.anchor.y-1.7},radius:1.2,kind:'gift-box'}]:[];
  if(this.kind!=='overtime')return[];
  // YW alone may cross the chair/desk envelope to reach the authored seat.
  const contact=actor===1&&(this.cancelled?this.release<2&&this.clearViaSeat:['take-seats','sit','work','stand','leave-seats'].includes(this.phase));
  return contact?[]:this.movementObstacles;
 }
 private advance(){this.index++;this.time=0;}
 private positions(points:number[][],dt:number){let arrived=true;this.actors.forEach((f,i)=>{const x=points[i][0]+this.anchor.x,z=points[i][1]+this.anchor.y,d=Math.hypot(f.x-x,f.z-z);if(d>.03){arrived=false;this.move(f,x,z,dt,2.4);this.walk(f,.85);}});return arrived;}
 private face(dt:number){this.actors.forEach((f,i)=>{if(this.kind==='overtime'&&i===0&&this.phase==='work')return;turn(f,this.kind==='overtime'?0:this.kind==='flower'?Math.atan2(this.world.flowerPoint.x-f.x,this.world.flowerPoint.y-f.z):i===0?Math.PI/2:-Math.PI/2,dt);});}
 private seated(k:number){this.seatBlend=k;this.actors.forEach((f,i)=>{if(i===0)return;f.legPivots.forEach(p=>p.rotation.x=-Math.PI/2*k);f.heightOffset=-.23*k;f.parts.rightArm.rotation.x=-1.6*k;f.parts.leftArm.rotation.x=-1.6*k;headPose(f,.05*k);});}
 private updateRoots(){for(const f of this.actors){f.root.position.set(f.x,2.52+f.heightOffset,f.z);f.root.rotation.y=f.heading;}this.scene.updateMatrixWorld(true);}
 private holdGift(position:T.Vector3,yaw=Math.PI/2){const anchor=new T.Vector3(.26,1.08,.2).applyAxisAngle(new T.Vector3(0,1,0),yaw);this.gift.position.copy(position).sub(this.root.position).sub(anchor);this.gift.rotation.set(0,yaw,0);}
 cancel(){
  if(this.done||this.cancelled)return;this.cancelGiftPosition.copy(this.gift.position);this.cancelled=true;if(this.heart)this.heart.visible=false;this.release=0;this.time=0;this.exitFrom=this.furniture.position.z;this.clearViaSeat=this.kind==='overtime'&&['take-seats','sit','work','stand','leave-seats'].includes(this.stages[this.index]?.name);
  this.saved=this.actors.map(f=>({height:f.heightOffset,legs:f.legPivots.map(p=>p.rotation.x),arms:[f.parts.rightArm.rotation.x,f.parts.leftArm.rotation.x],waist:f.waist.rotation.x}));
 }
 private cancelUpdate(dt:number){
  this.time+=dt;
  if(this.release===0){const k=1-ease(this.time/.8);this.actors.forEach((f,i)=>{const s=this.saved![i];f.heightOffset=s.height*k;f.legPivots.forEach((p,j)=>p.rotation.x=s.legs[j]*k);f.parts.rightArm.rotation.x=s.arms[0]*k;f.parts.leftArm.rotation.x=s.arms[1]*k;f.waist.rotation.x=s.waist*k;});this.updateRoots();if(this.kind==='gift'&&this.bagVisible){const hand=palm(this.actors[this.owner==='DJ'?0:1],this.owner==='DJ'?'leftArm':'rightArm').sub(this.root.position).sub(new T.Vector3(.26,1.08,.2).applyAxisAngle(new T.Vector3(0,1,0),this.gift.rotation.y));this.gift.position.lerpVectors(this.cancelGiftPosition,hand,ease(this.time/.6));if(this.time>.6){this.gift.visible=false;this.bagVisible=false;}}if(this.time>=.8){this.seed.visible=false;this.release=1;this.time=0;}}
  else if(this.release===1){if(this.kind!=='overtime'||Math.abs(this.exitFrom-this.entryZ)<.01){this.release=2;this.time=0;}else if(this.clearViaSeat){if(this.positions([[-3.8,-3.6],[0,-3.6]],dt))this.clearViaSeat=false;}else if(this.positions([[-3.8,-3.6],[3.8,-3.6]],dt)){this.release=2;this.time=0;}}
  else{if(this.kind==='overtime')this.furniture.position.z=T.MathUtils.lerp(this.exitFrom,this.entryZ,ease(this.time/1.8));if(this.kind!=='overtime'||this.time>=1.8){this.dispose();return true;}}
  return false;
 }
 update(dt:number){
  if(this.done)return true;this.total+=dt;if(this.cancelled)return this.cancelUpdate(dt);
  const s=this.stages[this.index];if(!s){this.dispose();return true;}this.time+=dt;
  if(s.points){const arrived=this.positions(s.points,dt);if(this.kind==='gift')this.giftPose(s.name,0,dt);if(arrived)this.advance();return false;}
  this.face(dt);const p=Math.min(1,this.time/s.duration!);
  if(this.kind==='overtime'){
   if(s.name==='enter')this.furniture.position.z=T.MathUtils.lerp(this.entryZ,0,ease(p));
   if(s.name==='sit')this.seated(ease(p));
   if(s.name==='work'){
    this.seated(1);const[dj,yw]=this.actors;
    yw.parts.rightArm.rotation.x+=Math.sin(this.time*12)*.065;yw.parts.leftArm.rotation.x+=Math.cos(this.time*12)*.065;headPose(yw,.04,Math.sin(this.time*1.4)*.06);
    const route=this.officeCompact?[[-3.8,-3.6],[-3.8,1.3]]:OFFICE_ROUTE,point=route[this.routeIndex],x=this.anchor.x+point[0],z=this.anchor.y+point[1];
    if(Math.hypot(dj.x-x,dj.z-z)<.06){this.routePause+=dt;turn(dj,Math.atan2(yw.x-dj.x,yw.z-dj.z),dt);headPose(dj,.03);if(this.routePause>.75){this.routePause=0;this.routeIndex=(this.routeIndex+1)%route.length;}}
    else{this.move(dj,x,z,dt,3.3);this.walk(dj,.7);}
    const beat=Math.floor(this.time*3);if(beat>this.tick){this.tick=beat;this.sound('type');}
   }
   if(s.name==='stand'){this.seated(1-ease(p));this.lid.rotation.x=-1.08*(1-ease(p));}
   if(s.name==='exit')this.furniture.position.z=T.MathUtils.lerp(0,this.entryZ,ease(p));
  }else if(this.kind==='flower'){
   const[a,b]=this.actors;
   if(s.name==='reveal'){a.parts.leftArm.rotation.x=-.8*ease(p);this.updateRoots();this.seed.position.copy(palm(a,'leftArm')).sub(this.root.position);}
   if(s.name==='plant'||s.name==='tend'){
    const bend=Math.sin(p*Math.PI)*.28;a.waist.rotation.x=bend;b.waist.rotation.x=bend;
    a.parts.leftArm.rotation.x=-.8;b.parts.rightArm.rotation.x=-.65;
    this.updateRoots();const from=palm(a,'leftArm'),to=new T.Vector3(this.world.flowerPoint.x,1.9,this.world.flowerPoint.y);this.seed.position.lerpVectors(from,to,ease(Math.min(1,p*1.6))).sub(this.root.position);
    if(p>.62&&!this.committed){this.world.plant();this.committed=true;this.seed.visible=false;this.sound('plant');}
   }
   if(s.name==='flower-dance'){this.actors.forEach((f,i)=>{turn(f,Math.atan2(this.world.flowerPoint.x-f.x,this.world.flowerPoint.y-f.z)+Math.sin(this.time*2+i)*.25,dt);f.legPivots.forEach((leg,j)=>leg.rotation.x=Math.sin(this.time*7+i+j*Math.PI)*.18);f.parts.leftArm.rotation.x=-.5+Math.sin(this.time*4+i)*.2;f.parts.rightArm.rotation.x=-.5-Math.sin(this.time*4+i)*.2;headPose(f,.03,Math.sin(this.time*3+i)*.12);});if(this.tick===0){this.tick=1;this.sound('dance');}}
   if(s.name==='admire'){this.actors.forEach(f=>turn(f,0,dt));headPose(a,.06,-.12);headPose(b,.06,.12);}
  }else this.giftPose(s.name,p,dt);

  if(p>=1){if(s.name==='enter')this.sound('arrive');this.advance();}
  return false;
 }
 dispose(){if(this.done)return;this.done=true;clear(this.root);for(const f of this.actors)headPose(f);}
}
