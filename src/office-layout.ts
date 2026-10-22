import type {Obstacle,Point} from './navigation';

/** Conservative envelopes of the standard desk and single chair. Local contact
 * at the seat is an explicit YW-only exception, never a global collision switch. */
export function officeObstacles(anchor:Point,z:number,seatingContact=false):Obstacle[]{
 const at=(x:number,d:number)=>({x:anchor.x+x,z:anchor.z+z+d});
 return [
  {a:at(-1.4,0),b:at(1.4,0),radius:1.57,kind:'desk'},
  ...seatingContact?[]:[{a:at(0,-1.65),b:at(0,-1.65),radius:.9,kind:'chair'}],
 ];
}
export const OFFICE_ROUTE=[[-3.8,-3.6],[-3.8,2.9],[3.8,2.9],[3.8,-3.6]] as const;
