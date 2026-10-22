import * as T from 'three';
import type {SlotId} from './characters';
import type {SoundCue} from './sound-effects';
import propData from './photo-props.json' with {type:'json'};
import {ACTIONS,type ActionId,type Phase} from './action-library';
export type Actor={root:T.Group;parts:Record<SlotId,T.Group>;waist:T.Group;legPivots:T.Group[];heightOffset:number;footHeight:(angle:number)=>number;x:number;z:number;heading:number};
export function headPose(f:Pick<Actor,'parts'>,pitch=0,yaw=0,roll=0){
 if(f.parts.hair.userData.longHair){pitch=T.MathUtils.clamp(pitch,-.09,.09);yaw=T.MathUtils.clamp(yaw,-.18,.18);roll=T.MathUtils.clamp(roll,-.06,.06);}
 const q=new T.Quaternion().setFromEuler(new T.Euler(pitch,yaw,roll));
 for(const slot of ['head','hair'] as const){f.parts[slot].quaternion.copy(q);f.parts[slot].position.set(0,.66,0).applyQuaternion(q).y+=.18;}
}
const [gx,gy,gz]=propData.handGrip;
const gripPoint=new T.Vector3(gx*.035,-gy*.035,-gz*.035);
type Hand='leftArm'|'rightArm';
const ease=(t:number)=>T.MathUtils.smoothstep(t,0,1);
const turn=(f:Actor,angle:number,dt:number)=>{f.heading+=Math.atan2(Math.sin(angle-f.heading),Math.cos(angle-f.heading))*(1-Math.exp(-8*dt));};
const heartTexture=()=>{
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const c=canvas.getContext('2d')!;
 c.fillStyle='#b96d67';c.beginPath();c.moveTo(64,110);c.bezierCurveTo(10,76,9,43,27,27);c.bezierCurveTo(42,14,58,24,64,37);c.bezierCurveTo(70,24,86,14,101,27);c.bezierCurveTo(119,43,118,76,64,110);c.fill();
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;
};
type SavedPose={nodes:{node:T.Object3D;q:T.Quaternion;p:T.Vector3}[];height:number};
/** Executes one declared timeline. Main owns the queue and prop transaction;
 * this module owns only bounded movement, joints and transient effects. */
export class ActionScene{
 private index=0;private time=0;private cuePlayed=false;private done=false;private cancelled?:SavedPose[];
 private center:T.Vector2;private axis:T.Vector2;private angle:number;private viewerAngle:number;
 private starts:T.Vector2[];private heart:T.Sprite;private togetherAngle:number;private handSide=1;
 private stages:Phase[];
 constructor(readonly kind:ActionId,private actors:Actor[],private scene:T.Scene,
  private move:(f:Actor,x:number,z:number,dt:number,speed:number)=>number,
  private walk:(f:Actor,amount:number)=>void,private sound:(cue:SoundCue)=>void,
  private bounds:{wanderX:number;wanderZ:number},continueSequence=false,viewerAngle=.3){
  const[a,b]=actors;this.center=new T.Vector2(T.MathUtils.clamp((a.x+b.x)/2,-bounds.wanderX+2,bounds.wanderX-2),T.MathUtils.clamp((a.z+b.z)/2,-bounds.wanderZ+2,bounds.wanderZ-2));
  this.axis=new T.Vector2(b.x-a.x,b.z-a.z);if(this.axis.length()<.01)this.axis.set(1,0);this.axis.normalize();this.angle=Math.atan2(this.axis.x,this.axis.y);
  this.viewerAngle=viewerAngle;this.togetherAngle=this.angle-Math.PI/2;if(Math.cos(this.togetherAngle-viewerAngle)<0){this.togetherAngle+=Math.PI;this.handSide=-1;}this.starts=actors.map(f=>new T.Vector2(f.x,f.z));
  this.stages=ACTIONS[kind].phases.filter(p=>!(p.name==='depart'&&(continueSequence||ACTIONS[kind].exit==='stay'))).map(p=>({...p}));
  this.heart=new T.Sprite(new T.SpriteMaterial({map:heartTexture(),transparent:true,opacity:0,depthWrite:false}));this.heart.name='affection-heart';this.heart.scale.setScalar(.34);scene.add(this.heart);
 }
 get phase(){return this.done?'done':this.cancelled?'release':this.stages[this.index]?.name??'done';}
 get snapshot(){return {id:this.kind,phase:this.phase,stage:this.index,time:this.time,participants:ACTIONS[this.kind].participants,contact:this.kind==='holdHands'||this.kind==='highFive'?{hands:this.contactPoints().map(v=>v.toArray()),distance:this.contactDistance()}:undefined};}
 private contactPoints(){const side=this.handSide;return this.actors.map((f,i)=>f.parts[(i===0)===(side===1)?'leftArm':'rightArm'].children[1].localToWorld(gripPoint.clone()));}
 private contactDistance(){const[a,b]=this.contactPoints();return a.distanceTo(b);}
 private meetHands(f:Actor,hand:Hand,k:number,raised:boolean){
  const arm=f.parts[hand],palm=arm.children[1],reach=gripPoint.clone().applyQuaternion(palm.quaternion).add(palm.position);
  const spacing=Math.hypot(this.actors[0].x-this.actors[1].x,this.actors[0].z-this.actors[1].z);
  // Solve the small inward shoulder adjustment from the real hand anchor.
  // Raise forward for the high five; never sweep arms through each other.
  const side=Math.sign(arm.position.x),radius=Math.hypot(reach.x,reach.y);
  const reachX=(spacing-.22)/2-Math.abs(arm.position.x);
  const angle=Math.asin(T.MathUtils.clamp(reachX/radius,-.95,.95))-Math.atan2(Math.abs(reach.x),-reach.y);
  arm.rotation.z=T.MathUtils.lerp(side*T.MathUtils.degToRad(9.782),side*angle,k);
  arm.rotation.x=(raised?-2.3:-.15)*k;
 }
 private points(spacing:number){return[-1,1].map(sign=>this.center.clone().addScaledVector(this.axis,sign*spacing/2));}
 cancel(){
  if(this.done||this.cancelled)return;
  this.time=0;this.heart.material.opacity=0;
  this.cancelled=this.actors.map(f=>({height:f.heightOffset,nodes:[f.waist,...f.legPivots,f.parts.rightArm,f.parts.leftArm,f.parts.head,f.parts.hair].map(node=>({node,q:node.quaternion.clone(),p:node.position.clone()}))}));
 }
 update(dt:number){
  if(this.done)return true;this.time+=dt;
  if(this.cancelled){
   const k=ease(this.time/.45);this.actors.forEach((f,i)=>{f.heightOffset=this.cancelled![i].height*(1-k);for(const saved of this.cancelled![i].nodes){const q=saved.node.quaternion.clone(),p=saved.node.position.clone();saved.node.quaternion.slerpQuaternions(saved.q,q,k);saved.node.position.lerpVectors(saved.p,p,k);}if(this.kind==='sit'){const angle=f.legPivots[0].rotation.x;f.heightOffset=.065*ease(Math.abs(angle)/(.15*Math.PI/2))-f.footHeight(angle);}});
   if(k===1){this.dispose();return true;}return false;
  }
  const stage=this.stages[this.index];if(!stage){this.dispose();return true;}
  if(stage.name==='approach'||stage.name==='depart'){
   const points=this.points(stage.spacing!);let arrived=true;
   this.heart.material.opacity=0;
   this.actors.forEach((f,i)=>{const p=points[i],d=Math.hypot(f.x-p.x,f.z-p.y);if(d>.025){arrived=false;this.move(f,p.x,p.y,dt,d>4?2.2:stage.speed??1.5);this.walk(f,stage.name==='depart'?.65:1);}});
   if(arrived||this.time>25)this.advance();
  }else{
   const duration=stage.duration!,envelope=ease(this.time/.65)*(1-ease((this.time-(duration-.65))/.65));
   if(stage.facing)this.face(stage.facing,dt);
   if(stage.name==='gesture'){
    if(stage.motion==='stroll')this.stroll(dt,duration);else this.gesture(this.time,envelope,dt);
    if(!this.cuePlayed&&this.time>.68&&ACTIONS[this.kind].cue&&(!['holdHands','highFive'].includes(this.kind)||this.contactDistance()<.28)){this.cuePlayed=true;this.sound(ACTIONS[this.kind].cue!);}
   }
   if(this.time>=duration)this.advance();
  }
  return this.done;
 }
 private advance(){this.time=0;this.index++;if(this.index>=this.stages.length)this.dispose();}
 private face(facing:NonNullable<Phase['facing']>,dt:number){
  this.actors.forEach((f,i)=>{turn(f,facing==='viewer'?this.viewerAngle:facing==='together'?this.togetherAngle:this.angle+(i===0?0:Math.PI)+(this.kind==='kiss'&&i===1?.75:0),dt);headPose(f);});
 }
 private stroll(dt:number,duration:number){
  const k=this.time/duration,normal=new T.Vector2(-this.axis.y,this.axis.x);
  this.actors.forEach((f,i)=>{
   const p=this.starts[i].clone().addScaledVector(this.axis,(i===0?-1:1)*(.5-Math.cos(k*Math.PI*2)*.5)).addScaledVector(normal,Math.sin(k*Math.PI*2)*.65);
   p.x=T.MathUtils.clamp(p.x,-this.bounds.wanderX,this.bounds.wanderX);p.y=T.MathUtils.clamp(p.y,-this.bounds.wanderZ,this.bounds.wanderZ);
   this.move(f,p.x,p.y,dt,1);this.walk(f,.8);
  });
 }
 private gesture(t:number,k:number,dt:number){
  const [a,b]=this.actors,side=this.handSide,handA=side===1?'leftArm':'rightArm',handB=side===1?'rightArm':'leftArm';
  const participants=ACTIONS[this.kind].participants.map(i=>this.actors[i]),lead=participants[0],other=this.actors[1-ACTIONS[this.kind].participants[0]];
  switch(this.kind){
   case'wave':for(const f of participants)f.parts.rightArm.rotation.x=(-2.4+Math.sin(t*10)*.25)*k;break;
   case'dance':participants.forEach((f,i)=>{f.heading+=dt*1.2;this.walk(f,.35*k);f.parts.rightArm.rotation.x=(-1.3+Math.sin(t*5+i)*.6)*k;f.parts.leftArm.rotation.x=(-1.3-Math.sin(t*5+i)*.6)*k;f.waist.rotation.z=Math.sin(t*5)*.06*k;f.heightOffset=Math.abs(Math.sin(t*5))*.1*k;});break;
   case'hug':participants.forEach((f,i)=>{const reach=i===0?-1.35:-1.57;f.parts.rightArm.rotation.x=reach*k;f.parts.leftArm.rotation.x=reach*k;f.waist.rotation.x=.025*k;});break;
   case'kiss':
    headPose(a,.12*k,0,-.04*k);headPose(b,.08*k,Math.PI/4*k,.04*k);
    for(const f of this.actors){f.parts.rightArm.rotation.x=.22*k;f.parts.leftArm.rotation.x=.18*k;}
    this.heart.material.opacity=t>.68?Math.sin(Math.min(1,(t-.68)/1.7)*Math.PI)*.8:0;this.heart.position.set(this.center.x,3.65+Math.min(t,2)*.15,this.center.y);break;
   case'shy':this.actors.forEach((f,i)=>{const amount=k*(i===0?.72:1);headPose(f,.18*k,((i===0?-.35:.4)+Math.sin(t*1.8)*.1)*k,(i===0?-.08:.08)*k);f.parts.rightArm.rotation.x=-2.05*amount;f.parts.leftArm.rotation.x=-1.9*amount;f.parts.rightArm.rotation.z+=.28*k;f.parts.leftArm.rotation.z-=.28*k;});break;
   case'holdHands':
    this.meetHands(a,handA,k,false);this.meetHands(b,handB,k,false);
    headPose(a,.02*k,.2*side*k);headPose(b,.02*k,-.2*side*k);break;
   case'highFive':
    this.meetHands(a,handA,k,true);this.meetHands(b,handB,k,true);
    headPose(a,-.07*k,.22*side*k);headPose(b,-.07*k,-.22*side*k);break;
   case'beckon':lead.parts.rightArm.rotation.x=(-1.65+Math.sin(t*8)*.25)*k;headPose(lead,0,.1*k);headPose(other,.05*k,-.12*k);break;
   case'look':for(const f of this.actors)headPose(f,-.07*k,Math.sin(t*.8)*.14*k);break;
   case'sit':for(const f of this.actors){const angle=-Math.PI/2*k;f.heightOffset=.065*ease(k/.15)-f.footHeight(angle);f.legPivots.forEach(leg=>leg.rotation.x=angle);f.waist.rotation.x=.08*k;f.parts.rightArm.rotation.x=-.35*k;f.parts.leftArm.rotation.x=-.35*k;headPose(f,.08*k,Math.sin(t*.7)*.1*k);}break;
   case'wait':headPose(lead,.03*k,Math.sin(t*1.3)*.3*k);lead.legPivots[0].rotation.x=Math.sin(t*4)*.04*k;headPose(other,0,Math.sin(t*.8)*.12*k);break;
  }
 }
 dispose(){if(this.done)return;this.done=true;this.scene.remove(this.heart);this.heart.material.map?.dispose();this.heart.material.dispose();for(const f of this.actors)headPose(f);}
}
