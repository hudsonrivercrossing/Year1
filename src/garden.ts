import {findClearing,clearance,distance,planPath,type Point,type Obstacle,type Bounds,type Clearing} from './navigation';

/** Sample across the bench, while preserving a usable office and dance area.
 * This only proposes a location; the shared navigator still owns all movement. */
export function planFlower(actors:readonly Point[],obstacles:readonly Obstacle[],bounds:Bounds,viewerAxis:Point,random=Math.random):Clearing|undefined{
 for(let n=0;n<90;n++){
  const center={x:(random()*2-1)*(bounds.wanderX-2.1),z:(random()*2-1)*(bounds.wanderZ-2.1)};
  if(obstacles.some(o=>clearance(center,o)<(o.kind==='flower'?4.2:2.4)))continue;
  const prospective:Obstacle={a:center,b:center,radius:1.05,kind:'flower'};
  const plan=findClearing(actors,obstacles,bounds,'flower',center,viewerAxis);if(!plan)continue;
  const all=[...obstacles,prospective];
  if(plan.points.some(p=>all.some(o=>clearance(p,o)<1.05)))continue;
  // Check persistent flowers against future scene ingress, independent of where
  // the four movable hand props happen to land during this action.
  const permanent=all.filter(o=>o.kind==='flower');
  if(!findClearing(actors,permanent,bounds,'overtime')||!findClearing(actors,permanent,bounds,'basic'))continue;
  // The final stand must remain reachable after the flower appears as well.
  if(plan.points.some((p,i)=>!planPath(actors[i],p,all,bounds,.72).length&&distance(actors[i],p)>.04))continue;
  return plan;
 }
 return undefined;
}
