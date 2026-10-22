/** Shared ground footprint: renderer and clearing planner must agree. */
export const GIFT_BOX_LAYOUT={x:-.3,z:-3,radius:1.76} as const;
export const GIFT_BOX_Z_OPTIONS=[-3,4] as const;
export const giftUnwrapPoint=(z:number)=>({x:-2.1,z:z+(z<0?1.9:-1.9)});
