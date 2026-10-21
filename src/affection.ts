import * as T from 'three';
import type {SlotId} from './characters';
import type {SoundCue} from './sound-effects';

export type Affection='kiss'|'shy'|'hug';
export type Actor={parts:Record<SlotId,T.Group>;x:number;z:number;heading:number};
export function headPose(f:Actor,pitch=0,yaw=0,roll=0){
 // Both shapes share the neck pivot. Moving hair and face together avoids gaps.
 const q=new T.Quaternion().setFromEuler(new T.Euler(pitch,yaw,roll));
 for(const slot of ['head','hair'] as const){f.parts[slot].quaternion.copy(q);f.parts[slot].position.set(0,.66,0).applyQuaternion(q).y+=.18;}
}
const ease=(t:number)=>T.MathUtils.smoothstep(t,0,1);
const turn=(f:Actor,angle:number,dt:number)=>{f.heading+=Math.atan2(Math.sin(angle-f.heading),Math.cos(angle-f.heading))*(1-Math.exp(-8*dt));};
const heartTexture=()=>{
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const c=canvas.getContext('2d')!;
 c.fillStyle='#b96d67';c.beginPath();c.moveTo(64,110);c.bezierCurveTo(10,76,9,43,27,27);c.bezierCurveTo(42,14,58,24,64,37);c.bezierCurveTo(70,24,86,14,101,27);c.bezierCurveTo(119,43,118,76,64,110);c.fill();
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;
};
/** A cancellable local encounter: approach -> turn -> gesture -> separate.
 * Coordinates are reserved once per encounter, never teleported to the origin.
 */
export class AffectionScene{
 phase:'approach'|'turn'|'gesture'|'depart'|'done'='approach';
 private time=0;
 private cue=false;
 private readonly center:T.Vector2;
 private readonly axis:T.Vector2;
 private readonly angle:number;
 private readonly heart:T.Sprite;
 private readonly targets:T.Vector2[];
 private walkingIn=false;
 constructor(readonly kind:Affection,private actors:Actor[],private scene:T.Scene,
  private move:(f:Actor,x:number,z:number,dt:number,speed:number)=>number,
  private walk:(f:Actor,amount:number)=>void,private sound:(cue:SoundCue)=>void,
  bounds:{wanderX:number;wanderZ:number}){
  const [a,b]=actors;this.center=new T.Vector2(T.MathUtils.clamp((a.x+b.x)/2,-bounds.wanderX+2,bounds.wanderX-2),T.MathUtils.clamp((a.z+b.z)/2,-bounds.wanderZ+2,bounds.wanderZ-2));
  this.axis=new T.Vector2(b.x-a.x,b.z-a.z);if(this.axis.length()<.01)this.axis.set(1,0);this.axis.normalize();this.angle=Math.atan2(this.axis.x,this.axis.y);
  this.targets=this.points(kind==='shy'?2.5:kind==='hug'?1.2:1.04);
  // Stage kiss approaches outside the other actor's shoulder envelope.
  this.walkingIn=kind==='kiss';
  const material=new T.SpriteMaterial({map:heartTexture(),transparent:true,opacity:0,depthWrite:false});
  this.heart=new T.Sprite(material);this.heart.name='affection-heart';this.heart.scale.setScalar(.34);scene.add(this.heart);
 }
 private points(separation:number){return [-1,1].map(sign=>this.center.clone().addScaledVector(this.axis,sign*separation/2));}
 private stage(phase:typeof this.phase){this.phase=phase;this.time=0;}
 update(dt:number){
  if(this.phase==='done')return true;
  this.time+=dt;
  if(this.phase==='approach'){
   const points=this.walkingIn?this.points(2.5):this.targets;
   let reached=true;
   for(let i=0;i<2;i++){
    const f=this.actors[i],p=points[i],d=Math.hypot(f.x-p.x,f.z-p.y);
    if(d>.025){reached=false;this.move(f,p.x,p.y,dt,d>4?2.2:1.5);this.walk(f,1);}
   }
   if(reached)this.stage('turn');
  }else if(this.phase==='turn'){
   this.face(dt,0);
   if(this.time>.65){if(this.walkingIn){this.walkingIn=false;this.stage('approach');}else this.stage('gesture');}
  }else if(this.phase==='gesture'){
   const t=this.time,fade=ease(t/.55)*(1-ease((t-(this.kind==='shy'?3.1:2.1))/.65));
   this.face(dt,fade);
   if(!this.cue&&t>.58){this.cue=true;this.sound(this.kind);}
   if(this.kind==='shy'){
    for(let i=0;i<2;i++){
     const f=this.actors[i],k=i===0?.72:1;
     headPose(f,.18*fade,((i===0?-.35:.4)+Math.sin(t*1.8)*.1)*fade,(i===0?-.08:.08)*fade);
     f.parts.rightArm.rotation.x=-2.05*fade*k;f.parts.leftArm.rotation.x=-1.9*fade*k;
     f.parts.rightArm.rotation.z+=.28*fade;f.parts.leftArm.rotation.z-=.28*fade;
    }
   }else if(this.kind==='kiss'){
    headPose(this.actors[0],.12*fade,0,-.04*fade);
    headPose(this.actors[1],.08*fade,Math.PI/4*fade,.04*fade);
    for(const f of this.actors){f.parts.rightArm.rotation.x=.22*fade;f.parts.leftArm.rotation.x=.18*fade;}
    this.heart.material.opacity=t>.58?Math.sin(Math.min(1,(t-.58)/1.7)*Math.PI)*.8:0;
    this.heart.position.set(this.center.x,3.65+Math.min(t,2)*.15,this.center.y);
   }else for(const f of this.actors){f.parts.rightArm.rotation.x=-1.5*fade;f.parts.leftArm.rotation.x=-1.5*fade;}
   if(t>(this.kind==='shy'?3.8:2.8))this.stage('depart');
  }else if(this.phase==='depart'){
   this.heart.material.opacity=0;
   const points=this.points(3.1);let reached=true;
   for(let i=0;i<2;i++){
    const f=this.actors[i],p=points[i];if(Math.hypot(f.x-p.x,f.z-p.y)>.025){reached=false;this.move(f,p.x,p.y,dt,1);this.walk(f,.65);}
   }
   if(reached){this.dispose();return true;}
  }
  return false;
 }
 private face(dt:number,amount:number){
  this.actors.forEach((f,i)=>{
   turn(f,this.angle+(i===0?0:Math.PI),dt);
   headPose(f);
   if(this.kind!=='shy'){f.parts.rightArm.rotation.x=(this.kind==='hug'?-1.5:.2)*amount;f.parts.leftArm.rotation.x=(this.kind==='hug'?-1.5:.2)*amount;}
  });
 }
 dispose(){if(this.phase==='done')return;this.phase='done';this.scene.remove(this.heart);this.heart.material.map?.dispose();this.heart.material.dispose();for(const f of this.actors)headPose(f);}
}
