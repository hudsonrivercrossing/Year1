import * as T from 'three';
import * as C from 'cannon-es';
import type {SlotId} from './characters';
import appearances from './photo-props.json' with {type:'json'};

export type PropActor={root:T.Group;parts:Record<SlotId,T.Group>;waist:T.Group;x:number;z:number;heading:number};
type Hand='rightArm'|'leftArm';
type PropKind='pole'|'mug'|'iceCream';
type Prop={
 kind:PropKind;actor:number;hand:Hand;visual:T.Group;socket:T.Group;center:T.Vector3;half:T.Vector3;
 held:boolean;body?:C.Body;pickupFrom:T.Vector3;pickupRotation:T.Quaternion;
};
type Recovery={origin:T.Vector2;heading:number;stage:'return'|'reach'|'lift'|'straighten'|'done';time:number;index:number;items:Prop[]};
type Move=(actor:PropActor,x:number,z:number,dt:number,speed:number)=>number;
type Walk=(actor:PropActor,amount:number,time:number)=>void;
const S=.035;
const smooth=(t:number)=>T.MathUtils.smoothstep(t,0,1);
const gripPoint=new T.Vector3(0,.8229*S,9.8948*S);

/** Four removable accessories. They never enter the build-mode arm clones.
 * Their physical drop and walk-back/pickup share one lifecycle across a whole
 * action sequence; reset removes both floor bodies and all grip nodes.
 */
export class HandProps{
 private readonly world=new C.World({gravity:new C.Vec3(0,-12,0),allowSleep:true});
 private readonly items:Prop[]=[];
 private recovery:Recovery[]=[];
 private active=false;
 private recovering=false;
 private carryBlend=0;
 private readonly floor:C.Body;
 constructor(private scene:T.Scene,private actors:PropActor[],makePart:(id:string,color:string)=>T.Group,impact:(speed:number)=>void,bounds={width:28,depth:20}){
  this.world.defaultContactMaterial.friction=.68;this.world.defaultContactMaterial.restitution=.12;
  this.floor=new C.Body({mass:0,shape:new C.Box(new C.Vec3(bounds.width/2,.15,bounds.depth/2)),collisionFilterGroup:1});this.floor.position.y=-.075;this.world.addBody(this.floor);
  const ground=new C.Body({mass:0,shape:new C.Plane(),collisionFilterGroup:1});ground.quaternion.setFromEuler(-Math.PI/2,0,0);ground.position.y=-.29;this.world.addBody(ground);
  const add=(actor:number,hand:Hand,kind:PropKind)=>{
   const visual=new T.Group();visual.name=`photo-prop-${actor}-${kind}`;
   const appearance=appearances[kind];
   // All accessories share the figure's standard LDraw units. 33120 already
   // includes its ice cream; adding 6254 made an incorrect extra tower.
   for(const spec of appearance.parts){const model=makePart(spec.id,spec.color),[x,y,z]=spec.offset;model.position.set(x*S,-y*S,-z*S);visual.add(model);}
   const box=new T.Box3().setFromObject(visual),socket=new T.Group();socket.name=`photo-grip-${actor}-${hand}`;socket.position.copy(gripPoint);
   // Nominal hand axis is 14.5°; a carrying tilt clears the studs at full stride.
   socket.rotation.x=T.MathUtils.degToRad(appearance.gripTiltDegrees);
   const item:Prop={kind,actor,hand,visual,socket,center:box.getCenter(new T.Vector3()),half:box.getSize(new T.Vector3()).multiplyScalar(.5),held:false,pickupFrom:new T.Vector3(),pickupRotation:new T.Quaternion()};
   visual.userData.photoProp=kind;this.items.push(item);
  };
  add(0,'rightArm','pole');add(0,'leftArm','mug');add(1,'rightArm','pole');add(1,'leftArm','iceCream');
  this.onImpact=impact;
 }
 private onImpact:(speed:number)=>void;
 /** Call only after awakening. Construction itself leaves source arms untouched. */
 equip(){
  this.reset();this.active=true;
  for(const p of this.items){
   const hand=this.actors[p.actor].parts[p.hand].children[1];
   if(!hand)throw Error(`Missing ${p.hand} hand for photo accessory`);
   hand.add(p.socket);this.attach(p);
  }
  this.syncSockets();
 }
 private attach(p:Prop){p.socket.add(p.visual);p.visual.position.set(0,0,0);p.visual.quaternion.identity();p.held=true;if(p.body){this.world.removeBody(p.body);p.body=undefined;}}
 private syncSockets(){
  this.scene.updateMatrixWorld(true);
  for(const p of this.items){
   if(p.kind==='pole')continue;
   const parent=p.socket.parent;if(!parent)continue;
   // Cups/cones stay upright as the shoulder sways. Position is still the actual
   // LDraw hand centre, so nothing hovers beside the hand.
   const handRotation=parent.getWorldQuaternion(new T.Quaternion());
   p.socket.quaternion.copy(handRotation.invert()).multiply(new T.Quaternion().setFromAxisAngle(T.Object3D.DEFAULT_UP,this.actors[p.actor].heading));
   p.socket.updateMatrixWorld(true);
  }
 }
 /** Release once before the first stage, not between each queued action. */
 drop(){
  if(!this.active||this.items.every(p=>!p.held))return;
  this.syncSockets();this.recovering=false;
  this.carryBlend=0;
  this.recovery=this.actors.map(f=>({origin:new T.Vector2(f.x,f.z),heading:f.heading,stage:'return',time:0,index:0,items:[]}));
  for(const p of this.items){
   if(!p.held)continue;
   this.scene.attach(p.visual);p.held=false;
   const rotation=p.visual.quaternion,center=p.center.clone().applyQuaternion(rotation).add(p.visual.position);
   const body=new C.Body({mass:p.kind==='pole'?.035:.055,shape:new C.Box(new C.Vec3(Math.max(.045,p.half.x),Math.max(.045,p.half.y),Math.max(.045,p.half.z))),linearDamping:.6,angularDamping:.65,sleepSpeedLimit:.13,sleepTimeLimit:.55,collisionFilterGroup:2,collisionFilterMask:1});
   body.position.set(center.x,center.y,center.z);body.quaternion.set(rotation.x,rotation.y,rotation.z,rotation.w);
   // Barely any lateral energy: the accessory lands beside its owner rather
   // than being flung across the workbench.
   body.velocity.set(0,-.1,0);body.angularVelocity.set(p.kind==='pole'?.35:.65,0,(p.hand==='rightArm'?-1:1)*.25);
   let last=-1;
   body.addEventListener('collide',(event:{contact:C.ContactEquation})=>{const strength=Math.abs(event.contact.getImpactVelocityAlongNormal());if(strength>.22&&this.world.time-last>.08){last=this.world.time;this.onImpact(strength);}});
   p.body=body;this.world.addBody(body);this.recovery[p.actor].items.push(p);
  }
 }
 beginRecovery(){
  if(!this.active||!this.items.some(p=>!p.held))return false;
  this.recovering=true;
  for(const r of this.recovery){r.stage=r.items.some(p=>!p.held)?'return':'done';r.time=0;r.index=r.items.findIndex(p=>!p.held);}
  return true;
 }
 /** Run after the character pose/root transforms, so held items follow this frame. */
 updatePhysics(dt:number){
  if(!this.active)return;
  if(!this.recovering&&this.items.every(p=>p.held)){
   this.carryBlend=Math.min(1,this.carryBlend+dt/.65);const k=smooth(this.carryBlend);
   // Quieter shoulders hold the cup near the waist/chest and keep poles clear.
   // Ease into it after pickup rather than snapping the newly held item.
   for(const p of this.items){const arm=this.actors[p.actor].parts[p.hand];arm.rotation.x=T.MathUtils.lerp(arm.rotation.x,appearances[p.kind].carryShoulder+arm.rotation.x*.35,k);}
  }
  this.world.step(1/60,dt,4);
  for(const p of this.items)if(p.body){
   const q=p.body.quaternion;p.visual.quaternion.set(q.x,q.y,q.z,q.w);
   p.visual.position.set(p.body.position.x,p.body.position.y,p.body.position.z).sub(p.center.clone().applyQuaternion(p.visual.quaternion));
  }
  this.syncSockets();
 }
 /** Main has already applied its neutral pose; pickup overrides it for this frame. */
 updateRecovery(dt:number,move:Move,walk:Walk,elapsed:number){
  if(!this.recovering)return !this.items.some(p=>!p.held);
  for(let i=0;i<this.actors.length;i++){
   const f=this.actors[i],r=this.recovery[i];if(!r||r.stage==='done')continue;
   if(r.stage==='return'){
    const d=Math.hypot(f.x-r.origin.x,f.z-r.origin.y);
    if(d>.04){move(f,r.origin.x,r.origin.y,dt,d>4?2.2:1.7);walk(f,1,elapsed*1.5);continue;}
    r.stage='reach';r.time=0;
   }
   r.time+=dt;const p=r.items[r.index];
   if(!p){r.stage='done';continue;}
   // Face the item at its actual resting position, then reach down from the hip.
   const target=p.body?p.visual.position:p.pickupFrom;
   const dx=target.x-f.x,dz=target.z-f.z,heading=Math.hypot(dx,dz)>.08?Math.atan2(dx,dz):r.heading;
   const angle=Math.atan2(Math.sin(heading-f.heading),Math.cos(heading-f.heading));
   f.heading+=T.MathUtils.clamp(angle,-2.4*dt,2.4*dt);
   let bend=1;
   if(r.stage==='reach')bend=smooth(r.time/.75);
   else if(r.stage==='straighten')bend=1-smooth(r.time/.7);
   f.waist.rotation.x=bend*1.22;f.parts[p.hand].rotation.x=-.4*bend;
   f.root.position.x=f.x;f.root.position.z=f.z;f.root.rotation.y=f.heading;
   this.syncSockets();
   if(r.stage==='reach'&&r.time>=.8&&Math.abs(angle)<.12){
    p.pickupFrom.copy(p.visual.position);p.pickupRotation.copy(p.visual.quaternion);
    if(p.body){this.world.removeBody(p.body);p.body=undefined;}
    r.stage='lift';r.time=0;
   }else if(r.stage==='lift'){
    const k=smooth(r.time/.65),position=p.socket.getWorldPosition(new T.Vector3()),rotation=p.socket.getWorldQuaternion(new T.Quaternion());
    p.visual.position.copy(p.pickupFrom).lerp(position,k);p.visual.quaternion.copy(p.pickupRotation).slerp(rotation,k);
    if(k>=1){this.attach(p);r.stage='straighten';r.time=0;}
   }else if(r.stage==='straighten'&&r.time>=.72){
    r.index++;r.time=0;r.stage=r.index<r.items.length?'reach':'done';
   }
  }
  if(this.recovery.every(r=>r.stage==='done')){this.recovering=false;return true;}
  return false;
 }
 reset(){
  this.carryBlend=0;
  for(const p of this.items){if(p.body)this.world.removeBody(p.body);p.body=undefined;p.visual.removeFromParent();p.socket.removeFromParent();p.held=false;}
  this.active=false;this.recovering=false;this.recovery=[];
 }
 dispose(){this.reset();for(const p of this.items)p.visual.traverse(o=>{if(o instanceof T.Mesh){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
 get snapshot(){return {active:this.active,recovering:this.recovering,held:this.items.filter(p=>p.held).length,dropped:this.items.filter(p=>!p.held&&this.active).length,origins:this.recovery.map(r=>({position:r.origin.toArray(),stage:r.stage,index:r.index})),items:this.items.map(p=>({actor:p.actor,hand:p.hand,kind:p.kind,held:p.held,body:Boolean(p.body),position:p.visual.getWorldPosition(new T.Vector3()).toArray(),grip:p.socket.parent?p.socket.getWorldPosition(new T.Vector3()).toArray():null,grounded:p.body?Math.abs(p.body.velocity.y)<.12:false}))};}
}
