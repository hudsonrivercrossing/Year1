import * as T from 'three';

/** A replaceable narrow print on the unchanged standard 3815 hip surfaces.
 * The hip, central crotch and hidden connectors keep the trouser base colour. */
export function waistBand(spec:{color:string;height:number},scale:number){
 const x=18.025,z=10.025,h=spec.height;
 const faces=[
  [[-x,0,-z],[-x,h,-z],[x,h,-z],[x,0,-z]],
  [[x,0,z],[x,h,z],[-x,h,z],[-x,0,z]],
  [[-x,0,z],[-x,h,z],[-x,h,-z],[-x,0,-z]],
  [[x,0,-z],[x,h,-z],[x,h,z],[x,0,z]],
 ];
 const vertices:number[]=[];
 for(const face of faces)for(const i of [0,1,2,0,2,3]){const [a,b,c]=face[i];vertices.push(a*scale,-b*scale,-c*scale);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
 const material=new T.MeshStandardMaterial({color:spec.color,roughness:.42,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const mesh=new T.Mesh(geometry,material);mesh.name='Recreated narrow waist print';mesh.userData.print=true;mesh.receiveShadow=true;return mesh;
}
