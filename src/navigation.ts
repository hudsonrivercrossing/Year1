/** Swept 2D capsules: feet/body clearance for a rigid toy, not a ragdoll solver. */
export type Point={x:number;z:number};
export type Obstacle={a:Point;b:Point;radius:number;owner?:number;kind?:string};
export type Bounds={wanderX:number;wanderZ:number};
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
export function closest(p:Point,a:Point,b:Point):Point{const x=b.x-a.x,z=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*x+(p.z-a.z)*z)/(x*x+z*z||1)));return{x:a.x+x*t,z:a.z+z*t};}
const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
export function segmentDistance(a:Point,b:Point,c:Point,d:Point){
 const ab1=cross(a,b,c),ab2=cross(a,b,d),cd1=cross(c,d,a),cd2=cross(c,d,b);
 if(ab1*ab2<0&&cd1*cd2<0)return 0;
 return Math.min(distance(a,closest(a,c,d)),distance(b,closest(b,c,d)),distance(c,closest(c,a,b)),distance(d,closest(d,a,b)));
}
export const clearance=(p:Point,o:Obstacle)=>distance(p,closest(p,o.a,o.b))-o.radius;
export function segmentClear(a:Point,b:Point,obstacles:readonly Obstacle[],padding=0){return obstacles.every(o=>{
 const r=o.radius+padding,initial=clearance(a,o)+o.radius;
 // A pre-existing overlap may leave, but cannot travel deeper through it.
 if(initial<r-.001){const q=closest(a,o.a,o.b),dx=a.x-q.x,dz=a.z-q.z;return clearance(b,o)>clearance(a,o)+1e-7&&((b.x-a.x)*dx+(b.z-a.z)*dz)>=-1e-7;}
 return segmentDistance(a,b,o.a,o.b)>=r-.0001;
});}
export function safePoint(p:Point,obstacles:readonly Obstacle[],bounds:Bounds,padding=.72){
 let q={...p};for(let pass=0;pass<12;pass++){
  q.x=Math.max(-bounds.wanderX,Math.min(bounds.wanderX,q.x));q.z=Math.max(-bounds.wanderZ,Math.min(bounds.wanderZ,q.z));
  for(const o of obstacles){const c=closest(q,o.a,o.b),d=distance(q,c),r=o.radius+padding+.035;if(d<r){const length=distance(o.a,o.b)||1,x=d>.0001?(q.x-c.x)/d:-(o.b.z-o.a.z)/length||1,z=d>.0001?(q.z-c.z)/d:(o.b.x-o.a.x)/length;let next={x:c.x+x*r,z:c.z+z*r};
    if(Math.abs(next.x)>bounds.wanderX||Math.abs(next.z)>bounds.wanderZ){const choices=Array.from({length:24},(_,i)=>({x:c.x+Math.cos(i*Math.PI/12)*r,z:c.z+Math.sin(i*Math.PI/12)*r})).filter(p=>Math.abs(p.x)<=bounds.wanderX&&Math.abs(p.z)<=bounds.wanderZ);choices.sort((a,b)=>distance(a,q)-distance(b,q));next=choices[0]??q;}q=next;}}
 }return{x:Math.max(-bounds.wanderX,Math.min(bounds.wanderX,q.x)),z:Math.max(-bounds.wanderZ,Math.min(bounds.wanderZ,q.z))};
}
export function planPath(start:Point,goal:Point,obstacles:readonly Obstacle[],bounds:Bounds,padding=.72):Point[]{
 const end=safePoint(goal,obstacles,bounds,padding);
 if(obstacles.some(o=>clearance(start,o)<padding-.001)){const exit=safePoint(start,obstacles,bounds,padding);if(distance(exit,start)>.01&&segmentClear(start,exit,obstacles,padding))return[exit,...planPath(exit,end,obstacles,bounds,padding)];}
 if(segmentClear(start,end,obstacles,padding))return[end];
 const nodes:Point[]=[start,end];
 for(const o of obstacles){const r=o.radius+padding+.085;
  for(const c of distance(o.a,o.b)<.01?[o.a]:[o.a,o.b])for(let i=0;i<16;i++){
   const a=i*Math.PI/8,p={x:c.x+Math.cos(a)*r,z:c.z+Math.sin(a)*r};
   if(Math.abs(p.x)>bounds.wanderX||Math.abs(p.z)>bounds.wanderZ||obstacles.some(v=>clearance(p,v)<padding+.015))continue;
   if(!nodes.some(n=>distance(n,p)<.04))nodes.push(p);
  }
 }
 const costs=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),used=new Set<number>();costs[0]=0;
 for(let pass=0;pass<nodes.length;pass++){
  let i=-1;for(let j=0;j<nodes.length;j++)if(!used.has(j)&&(i<0||costs[j]<costs[i]))i=j;
  if(i<0||!Number.isFinite(costs[i]))break;if(i===1)break;used.add(i);
  for(let j=1;j<nodes.length;j++){if(used.has(j)||!segmentClear(nodes[i],nodes[j],obstacles,padding))continue;const next=costs[i]+distance(nodes[i],nodes[j]);if(next<costs[j]){costs[j]=next;prev[j]=i;}}
 }
 if(!Number.isFinite(costs[1]))return[];
 const path:Point[]=[];for(let i=1;i>0;i=prev[i]){path.unshift(nodes[i]);if(prev[i]<0)return[];}return path;
}
export type Clearing={center:Point;axis:Point;points:Point[];entryZ:number;compact?:boolean};
function intersectsBox(o:Obstacle,c:Point,left:number,right:number,back:number,front:number){
 const corners=[{x:c.x+left,z:c.z+back},{x:c.x+right,z:c.z+back},{x:c.x+right,z:c.z+front},{x:c.x+left,z:c.z+front}];
 if([o.a,o.b].some(p=>p.x>=corners[0].x&&p.x<=corners[1].x&&p.z>=corners[0].z&&p.z<=corners[2].z))return true;
 return corners.some((p,i)=>segmentDistance(o.a,o.b,p,corners[(i+1)%4])<o.radius+.2);
}
export function findClearing(actors:readonly Point[],obstacles:readonly Obstacle[],bounds:Bounds,kind:'basic'|'overtime'|'flower'|'gift'='basic',fixedFlower?:Point,viewerAxis:Point={x:1,z:0}):Clearing|undefined{
 const mid={x:(actors[0].x+actors[1].x)/2,z:(actors[0].z+actors[1].z)/2},candidates:Point[]=[];
 if(fixedFlower)candidates.push(fixedFlower);else{
  candidates.push(mid);for(let r=.7;r<=9;r+=.7)for(let i=0;i<24;i++){const a=i*Math.PI/12;candidates.push({x:mid.x+Math.cos(a)*r,z:mid.z+Math.sin(a)*r});}
 }
 let best:Clearing|undefined,score=Infinity;
 for(const c of candidates){
  let entryZ=-13,compact=false;
  if(kind==='overtime'){
   if(c.x-4.6<-bounds.wanderX||c.x+4.6>bounds.wanderX||c.z-4.4<-bounds.wanderZ)continue;
   if(obstacles.some(o=>intersectsBox(o,c,-2.5,2.5,-2.8,1.8)))continue;
   const route=[[-3.8,-3.6],[-3.8,2.9],[3.8,2.9],[3.8,-3.6]].map(([x,z])=>({x:c.x+x,z:c.z+z}));
   const fits=(points:Point[])=>points.every(p=>Math.abs(p.x)+.75<=bounds.wanderX&&Math.abs(p.z)+.75<=bounds.wanderZ&&obstacles.every(o=>clearance(p,o)>.8))&&points.every((p,i)=>segmentClear(p,points[(i+1)%points.length],obstacles,.8));
   if(!fits(route)){if(!fits([route[0],{x:c.x-3.8,z:c.z+1.3}]))continue;compact=true;}
   if([route[0],route[3],{x:c.x,z:c.z-3.6}].some(p=>obstacles.some(o=>clearance(p,o)<.8)))continue;
   const entries=[-13-c.z,13-c.z].filter(z=>!obstacles.some(o=>intersectsBox(o,c,-2.8,2.8,Math.min(-2.5,z-2.5),Math.max(1.4,z+1.4))));
   if(!entries.length)continue;entryZ=entries.reduce((a,b)=>Math.abs(a)<Math.abs(b)?a:b);
  }else if(!fixedFlower){
   const radius=3.4;
   if(Math.abs(c.x)+radius>bounds.wanderX||Math.abs(c.z)+radius>bounds.wanderZ||obstacles.some(o=>clearance(c,o)<radius+.2))continue;
  }
  const base=Math.atan2(actors[1].z-actors[0].z,actors[1].x-actors[0].x);
  for(let i=0;i<(fixedFlower?48:4);i++){
   const angle=fixedFlower?(i%16)*Math.PI/8:base+i*Math.PI/4,axis={x:Math.cos(angle),z:Math.sin(angle)};
   const points=kind==='gift'?[-1,1].map(s=>({x:c.x+s*1.6,z:c.z+1})):fixedFlower?[-1,1].map(s=>({x:c.x+s*1.1*axis.x-(1.9+Math.floor(i/16)*.45)*axis.z,z:c.z+s*1.1*axis.z+(1.9+Math.floor(i/16)*.45)*axis.x})):[-1,1].map(s=>({x:c.x+s*1.6*axis.x,z:c.z+s*1.6*axis.z}));
   if(points.some(p=>Math.abs(p.x)>bounds.wanderX||Math.abs(p.z)>bounds.wanderZ||obstacles.some(o=>clearance(p,o)<.8)))continue;
   const travel=distance(actors[0],points[0])+distance(actors[1],points[1]),cost=travel+(compact?8:0)+distance(mid,c)*.3+i*.025+(1-Math.abs((axis.x*viewerAxis.x+axis.z*viewerAxis.z)/(Math.hypot(viewerAxis.x,viewerAxis.z)||1)))*1.2;
   if(cost<score){score=cost;best={center:{...c},axis,points,entryZ,compact};}
  }
 }return best;
}

/** Cached visibility paths, checked again against moving objects before each step. */
export class Navigator{
 private paths=new Map<object,{goal:Point;points:Point[];age:number}>();
 reset(){this.paths.clear();}
 step(actor:Point,goal:Point,dt:number,speed:number,obstacles:readonly Obstacle[],bounds:Bounds,padding=.72){
  let cache=this.paths.get(actor);if(cache)cache.age+=dt;
  if(!cache||distance(cache.goal,goal)>.18||cache.age>.65||!cache.points.length||!segmentClear(actor,cache.points[0],obstacles,padding)){
   cache={goal:{...goal},points:planPath(actor,goal,obstacles,bounds,padding),age:0};this.paths.set(actor,cache);
  }
  while(cache.points.length&&distance(actor,cache.points[0])<.025)cache.points.shift();
  const next=cache.points[0];if(!next)return{x:actor.x,z:actor.z};const d=distance(actor,next),k=Math.min(d,speed*dt)/(d||1),end={x:actor.x+(next.x-actor.x)*k,z:actor.z+(next.z-actor.z)*k};
  return segmentClear(actor,end,obstacles,padding)?end:{x:actor.x,z:actor.z};
 }
}
