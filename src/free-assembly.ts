import * as T from 'three';
import * as C from 'cannon-es';
import { slots, type SlotId } from './characters';
import { t,person,slotNames } from './i18n';

export type LoosePart = {
  character: number; slot: SlotId; visual: T.Group; body: C.Body;
  center: T.Vector3; ghost: T.Group; half: T.Vector3; attached: boolean;
};
/** Loose pieces are dynamic rigid bodies; attachment locks a body in place. */
export class FreeAssembly {
  readonly world = new C.World({ gravity: new C.Vec3(0,-12,0), allowSleep: true });
  readonly pieces: LoosePart[] = [];
  selected?: LoosePart;
  hintsEnabled=true;
  get holding(){return this.held;}
  private held?: LoosePart;
  private offset = new T.Vector3();
  private plane = new T.Plane();
  private point = new T.Vector3();
  constructor(
    private scene: T.Scene,
    private roots: { parts: Record<SlotId,T.Group> }[],
    private clone: (group:T.Group)=>T.Group,
    private dispose: (group:T.Group)=>void,
    private canvas: HTMLCanvasElement,
    private camera: T.Camera,
    private attached: ()=>void,
    private message: (text:string)=>void,
    private bounds: {width:number;depth:number},
    private impact: (speed:number)=>void,
  ) {
    this.world.defaultContactMaterial.friction=.55;
    this.world.defaultContactMaterial.restitution=.17;
    const floor=new C.Body({mass:0,shape:new C.Box(new C.Vec3(bounds.width/2,.15,bounds.depth/2))});floor.position.y=-.075;this.world.addBody(floor);
    const ground=new C.Body({mass:0,shape:new C.Plane()});ground.quaternion.setFromEuler(-Math.PI/2,0,0);ground.position.y=-.29;this.world.addBody(ground);
    scene.updateMatrixWorld(true);
    for(let character=0;character<2;character++)for(let i=0;i<slots.length;i++){
      const slot=slots[i].id,source=roots[character].parts[slot];
      // Compute the local geometric centre without changing the shared source mesh.
      const shape=this.clone(source);shape.position.set(0,0,0);shape.quaternion.identity();shape.updateMatrixWorld(true);
      const box=new T.Box3().setFromObject(shape),center=box.getCenter(new T.Vector3()),half=box.getSize(new T.Vector3()).multiplyScalar(.5);
      shape.position.copy(center).negate();
      const visual=new T.Group();visual.add(shape);scene.add(visual);
      const ghost=this.clone(source);source.getWorldPosition(ghost.position);source.getWorldQuaternion(ghost.quaternion);
      ghost.traverse(o=>{if(o instanceof T.Mesh){if(o.userData.print)o.visible=false;const material=o.material as T.MeshStandardMaterial;material.transparent=true;material.opacity=.1;material.depthWrite=false;o.castShadow=false;}});scene.add(ghost);
      const body=new C.Body({mass:.2,shape:new C.Box(new C.Vec3(Math.max(.12,half.x),Math.max(.12,half.y),Math.max(.12,half.z))),linearDamping:.25,angularDamping:.4,sleepSpeedLimit:.12,sleepTimeLimit:.6});
      this.world.addBody(body);
      let lastImpact=-1;
      body.addEventListener('collide',(event:{body:C.Body;contact:C.ContactEquation})=>{
        if(body.type!==C.Body.DYNAMIC||(event.body!==floor&&event.body!==ground))return;
        const speed=Math.abs(event.contact.getImpactVelocityAlongNormal());
        if(speed>.22&&this.world.time-lastImpact>.07){lastImpact=this.world.time;this.impact(speed);}
      });
      const piece={character,slot,visual,body,center,ghost,half,attached:false};this.pieces.push(piece);
      visual.traverse(o=>o.userData.loosePiece=piece);
    }
    this.scatter();
  }
  scatter(){
    this.held=undefined;this.selected=undefined;
    // Stratified random sampling covers all quadrants; shuffle identities so colours
    // and part types never fall into rows. Keep space around the assembly anchors.
    const remaining=this.pieces.filter(p=>!p.attached);
    for(let i=remaining.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[remaining[i],remaining[j]]=[remaining[j],remaining[i]];}
    const points:T.Vector2[]=[];
    for(let n=0;n<remaining.length;n++){
      const p=remaining[n],sx=n%2===0?-1:1,sz=Math.floor(n/2)%2===0?-1:1;
      let point=new T.Vector2();
      for(let attempt=0;attempt<150;attempt++){
        point.set(sx*(2+Math.random()*(this.bounds.width/2-3.4)),sz*(1.7+Math.random()*(this.bounds.depth/2-3.1)));
        if(points.every(other=>other.distanceTo(point)>2.4))break;
      }
      points.push(point);
      p.body.type=C.Body.DYNAMIC;p.body.mass=.2;p.body.updateMassProperties();p.body.collisionFilterMask=-1;
      p.body.position.set(point.x,1.8+Math.random()*1.8,point.y);
      p.body.quaternion.setFromEuler((Math.random()-.5)*Math.PI*2,Math.random()*Math.PI*2,(Math.random()-.5)*Math.PI);
      p.body.velocity.set((Math.random()-.5)*.25,0,(Math.random()-.5)*.25);p.body.angularVelocity.set(0,0,0);p.body.wakeUp();
    }
    this.sync();
  }
  eligible(p:LoosePart){
    const parts=this.roots[p.character].parts;
    return !p.attached && (p.slot==='legs'||(p.slot==='torso'?parts.legs.visible:p.slot==='hair'?parts.head.visible:parts.torso.visible));
  }
  target(p:LoosePart){
    const source=this.roots[p.character].parts[p.slot];
    const q=source.getWorldQuaternion(new T.Quaternion());
    return source.getWorldPosition(new T.Vector3()).add(p.center.clone().applyQuaternion(q));
  }
  private screen(world:T.Vector3){const p=world.clone().project(this.camera);return new T.Vector2((p.x*.5+.5)*this.canvas.clientWidth,(-p.y*.5+.5)*this.canvas.clientHeight);}
  pick(ray:T.Raycaster){
    const hit=ray.intersectObjects(this.pieces.filter(p=>!p.attached).map(p=>p.visual),true)[0];
    return hit?.object.userData.loosePiece as LoosePart|undefined;
  }
  begin(p:LoosePart,ray:T.Raycaster){
    this.held=p;this.selected=p;p.body.type=C.Body.KINEMATIC;p.body.updateMassProperties();p.body.velocity.setZero();p.body.angularVelocity.setZero();p.body.collisionFilterMask=0;
    // Move along the pickup ray into the attachment plane, preserving its screen
    // position. A piece scattered at the back must not be trapped at that depth.
    this.plane.setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(new T.Vector3()),this.target(p));
    const projected=p.visual.position.clone().project(this.camera),centerRay=new T.Raycaster();
    centerRay.setFromCamera(new T.Vector2(projected.x,projected.y),this.camera);
    const aligned=centerRay.ray.intersectPlane(this.plane,new T.Vector3())??p.visual.position.clone();
    ray.ray.intersectPlane(this.plane,this.point);this.offset.copy(aligned).sub(this.point);
    p.visual.position.copy(aligned);p.body.position.set(aligned.x,aligned.y,aligned.z);
    // Present the piece upright while held; attachment orientation is assisted.
    this.roots[p.character].parts[p.slot].getWorldQuaternion(p.visual.quaternion);
    p.body.quaternion.copy(p.visual.quaternion as unknown as C.Quaternion);
    this.describe(p);
  }
  drag(ray:T.Raycaster){if(!this.held)return;const p=this.held;
    if(ray.ray.intersectPlane(this.plane,this.point)){
      const v=this.point.clone().add(this.offset);v.y=Math.max(p.half.y+.12,v.y);
      v.x=T.MathUtils.clamp(v.x,-this.bounds.width/2+1,this.bounds.width/2-1);v.z=T.MathUtils.clamp(v.z,-this.bounds.depth/2+1,this.bounds.depth/2-1);
      p.body.position.set(v.x,v.y,v.z);p.visual.position.copy(v);
    }
  }
  near(p:LoosePart){
    const target=this.screen(this.target(p)),current=this.screen(p.visual.position);
    // Scale tolerance with the visible geometry, not a huge fixed pixel radius.
    const source=this.roots[p.character].parts[p.slot];
    const size=new T.Box3().setFromObject(source).getSize(new T.Vector3()).length();
    const screenSize=this.screen(this.target(p).add(new T.Vector3(size*.22,0,0))).distanceTo(target);
    return target.distanceTo(current)<T.MathUtils.clamp(screenSize,18,34);
  }
  end(cancel=false){
    const p=this.held;if(!p)return;this.held=undefined;
    if(!cancel&&this.eligible(p)&&this.near(p)){this.connect(p);return;}
    p.body.type=C.Body.DYNAMIC;p.body.updateMassProperties();p.body.collisionFilterMask=-1;p.body.velocity.set(0,-.15,0);p.body.angularVelocity.set((Math.random()-.5)*2,0,(Math.random()-.5)*2);p.body.wakeUp();
    if(!cancel)this.message(this.eligible(p)?t('还差一点，再试一次。','Almost. Give it another try.'):t('先拼好下面的部分，再接上这一块。','Build its supporting pieces first.'));
  }
  connect(p:LoosePart){if(!this.eligible(p))return;
    p.attached=true;p.body.type=C.Body.STATIC;p.body.mass=0;p.body.updateMassProperties();p.body.collisionFilterMask=-1;const target=this.target(p);p.body.position.set(target.x,target.y,target.z);const q=this.roots[p.character].parts[p.slot].getWorldQuaternion(new T.Quaternion());p.body.quaternion.set(q.x,q.y,q.z,q.w);p.body.velocity.setZero();p.body.angularVelocity.setZero();p.body.aabbNeedsUpdate=true;this.dispose(p.visual);this.dispose(p.ghost);
    this.roots[p.character].parts[p.slot].visible=true;this.selected=undefined;this.attached();
  }
  hint(){const p=this.selected&&this.eligible(this.selected)?this.selected:this.pieces.find(p=>this.eligible(p));if(!p)return;
    this.selected=p;this.describe(p);return p;
  }
  describe(p:LoosePart){const names=slotNames[p.slot];this.message(`${person(p.character)} · ${t(names[0],names[1])} · ${this.eligible(p)?t('靠近对应的虚影','Bring it close to its outline'):t('先拼好下面的部分','Build the supporting pieces first')}`);}
  update(dt:number){this.world.step(1/60,dt,4);this.sync();for(const p of this.pieces){if(p.attached)continue;
    // Silhouettes are permanent assembly anchors. The switch controls only the
    // exact target highlight while a loose part is being held.
    p.ghost.visible=true;
    const highlighted=this.hintsEnabled && p===this.held;
    p.ghost.userData.highlighted=highlighted;
    const active=this.eligible(p);
    p.ghost.traverse(o=>{if(o instanceof T.Mesh){const mat=o.material as T.MeshStandardMaterial;
      mat.opacity=highlighted?.52:.14;
      mat.color.set(highlighted?(active?'#6f8155':'#b8864d'):(p.character===0?'#81909a':'#a18b78'));
      mat.emissive.set(highlighted?(active?'#52613d':'#8b623b'):'#000000');
      mat.emissiveIntensity=highlighted?.16:0;
    }});
  }}
  sync(){for(const p of this.pieces){if(p.attached)continue;p.visual.position.copy(p.body.position as unknown as T.Vector3);p.visual.quaternion.copy(p.body.quaternion as unknown as T.Quaternion);}}
  destroy(){for(const p of this.pieces)if(!p.attached){this.dispose(p.visual);this.dispose(p.ghost);}this.pieces.length=0;}
}
