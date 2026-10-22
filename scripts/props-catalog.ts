/** README-only renderer. Imports the actual game assemblies, never substitutes
 * a catalog photograph or an independently modelled approximation. */
import * as T from 'three';
import {LittleLifeWorld,LifeScene,FLOWER_STYLES} from '../src/life-scenes';
import {makeGiftBag,makeGiftBox} from '../src/gift-model';
const geometries=new Map<string,T.BufferGeometry[]>();
for(const id of ['93091','3021','3010','3069b','3032','3005','4079','3023','3068b','99249','24866']){
 const data=await(await fetch('/models/'+id+'.json')).json();
 geometries.set(id,Object.values(data).map((vertices:any)=>{const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices.map((v:number,i:number)=>v*.035*(i%3===0?1:-1)),3));geo.computeVertexNormals();return geo;}));
}
const make=(id:string,color:string)=>{const root=new T.Group();for(const geo of geometries.get(id)!){const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.4,side:T.DoubleSide}));mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}return root;};
const scene=new T.Scene(),renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(640,640);renderer.setPixelRatio(1);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;document.body.append(renderer.domElement);
scene.add(new T.HemisphereLight('#fffaf0','#d8d4cb',2.3));const sun=new T.DirectionalLight('#fff5de',3);sun.position.set(-5,9,7);scene.add(sun);const fill=new T.DirectionalLight('#eef4ff',1.4);fill.position.set(5,4,-4);scene.add(fill);
const camera=new T.OrthographicCamera(-3,3,3,-3,.01,200),catalog=new Map<string,T.Group>();
const world=new LittleLifeWorld(scene,make),garden=new T.Group();
for(let i=0;i<5;i++){world.prepareFlower(()=>0);world.plant();const flower=world.flower;flower.position.set(0,0,0);catalog.set('flower-'+FLOWER_STYLES[i].name,flower);flower.removeFromParent();const clone=flower.clone(true);clone.position.set((i-2)*1.8,0,0);garden.add(clone);}
catalog.set('flower-garden',garden);catalog.set('gift-bag',makeGiftBag(make));const box=makeGiftBox(make);box.root.position.set(0,0,0);catalog.set('gift-box',box.root);
new LifeScene('overtime',[],scene,world,()=>0,()=>{},()=>{},new T.Vector2(),0);const office=scene.getObjectByName('little-life-scene') as T.Group;office.removeFromParent();catalog.set('office-desk',office);
let current:T.Group|undefined;
function show(name:string){if(current)scene.remove(current);current=catalog.get(name);if(!current)throw Error(name);scene.add(current);scene.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(current),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());const direction=new T.Vector3(.65,.45,1).normalize();if(name==='office-desk')direction.set(.65,.7,-1).normalize();camera.position.copy(center).addScaledVector(direction,20);camera.lookAt(center);camera.updateMatrixWorld(true);
 const projected=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])projected.push(new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));const half=Math.max(...projected.map(p=>Math.max(Math.abs(p.x),Math.abs(p.y))))*1.16;camera.left=camera.bottom=-half;camera.right=camera.top=half;camera.updateProjectionMatrix();renderer.render(scene,camera);return{size:size.toArray(),name};}
Object.assign(window,{propCatalog:{names:[...catalog.keys()],show}});show('gift-bag');
