import {publicAsset} from './public-asset';
import * as T from 'three';

const prints=new Map<string,T.Texture>();
/** Original print redraws on the unchanged standard 973 front/back polygons. */
export async function loadShirtPrints(names:string[]){
 const loader=new T.TextureLoader();
 await Promise.all([...new Set(names)].flatMap(name=>['front','back'].map(async side=>{
  const texture=await loader.loadAsync(publicAsset(`textures/${name}-${side}.png`));
  texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;prints.set(`${name}-${side}`,texture);
 })));
}
export function shirtPrint(name:string,scale:number){
 const group=new T.Group();group.name=`Recreated print: ${name}`;
 const outline=[[-12,0],[12,0],[14.345,2],[19,29],[19,32],[-19,32],[-19,29],[-14.345,2]];
 for(const [side,direction] of [['front',1],['back',-1]] as const){
  const positions:number[]=[],uvs:number[]=[];
  for(let i=1;i<outline.length-1;i++)for(const index of (direction===1?[0,i+1,i]:[0,i,i+1])){
   const [x,y]=outline[index];positions.push(x*scale,-y*scale,direction*10.015*scale);
   uvs.push(.5+direction*x/38,1-y/32);
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.computeVertexNormals();
  const material=new T.MeshStandardMaterial({map:prints.get(`${name}-${side}`),roughness:.42,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const mesh=new T.Mesh(geometry,material);mesh.receiveShadow=true;mesh.userData.print=true;group.add(mesh);
 }
 return group;
}
