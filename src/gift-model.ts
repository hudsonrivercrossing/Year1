import * as T from 'three';
const mesh=(geo:T.BufferGeometry,color:string,metalness=0)=>{const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:metalness?.32:.65,metalness}));m.userData.originalGeometry=true;m.castShadow=true;m.receiveShadow=true;return m;};
const block=(x:number,y:number,z:number,color:string)=>mesh(new T.BoxGeometry(x,y,z),color);
/** Original small leather-style accessory. No logo or official LEGO claim. */
export function makeGiftBag(make:(id:string,color:string)=>T.Group){
 const bag=new T.Group(),leather='#a96e3e',edge='#805333',gold='#d4b474';bag.name='one-gift-bag';
 const plate=make('3023',leather);plate.rotation.y=Math.PI/2;plate.position.y=.12;bag.add(plate);
 const shape=new T.Shape();shape.moveTo(-.65,.08);shape.lineTo(.65,.08);shape.lineTo(.75,.78);shape.quadraticCurveTo(0,.87,-.75,.78);shape.closePath();
 const body=mesh(new T.ExtrudeGeometry(shape,{depth:.57,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:2,steps:1}),leather);body.position.z=-.285;bag.add(body);
 const flap=block(1.48,.25,.055,edge);flap.position.set(0,.67,.327);bag.add(flap);
 const belt=block(1.48,.085,.04,leather);belt.position.set(0,.53,.365);bag.add(belt);
 for(const x of [-.47,.47]){const strap=block(.095,.32,.04,leather);strap.position.set(x,.63,.367);bag.add(strap);}
 for(const z of [-.2,.2]){
  const curve=new T.CatmullRomCurve3([new T.Vector3(-.29,.75,z),new T.Vector3(-.28,1.00,z),new T.Vector3(0,1.105,z),new T.Vector3(.28,1,z),new T.Vector3(.29,.75,z)]);
  bag.add(mesh(new T.TubeGeometry(curve,20,.036,6,false),edge));
 }
 const clasp=mesh(new T.BoxGeometry(.17,.11,.05),gold,.65);clasp.position.set(0,.535,.411);bag.add(clasp);
 const turn=mesh(new T.BoxGeometry(.09,.025,.04),'#f0d699',.7);turn.position.set(0,.535,.45);bag.add(turn);
 const lock=mesh(new T.BoxGeometry(.095,.13,.05),gold,.65);lock.position.set(.35,.34,.40);bag.add(lock);
 const ring=mesh(new T.TorusGeometry(.036,.012,5,10,Math.PI),gold,.65);ring.position.set(.35,.42,.40);bag.add(ring);
 const clochette=block(.10,.22,.045,edge);clochette.position.set(-.38,.39,.40);clochette.rotation.z=-.15;bag.add(clochette);
 // Sparse, readable stitching; no raster texture or external asset dependency.
 for(let i=0;i<17;i++){const stitch=block(.025,.009,.008,'#d8ba91');stitch.position.set(-.63+i*.079,.14,.326);bag.add(stitch);}
 for(const side of [-1,1])for(let i=0;i<7;i++){const stitch=block(.009,.025,.008,'#d8ba91');stitch.position.set(side*(.65+i*.009),.19+i*.07,.326);bag.add(stitch);}
 return bag;
}
export function makeGiftBox(){
 const root=new T.Group(),lid=new T.Group();root.name='surprise-gift-box';root.position.set(-.3,.08,-1.7);
 const base=block(1.9,.48,1.3,'#d58b45');base.position.y=.24;root.add(base);
 lid.position.set(0,.51,-.65);root.add(lid);
 const top=block(1.96,.10,1.36,'#e4a15b');top.position.z=.65;lid.add(top);
 for(const [x,z,w,d] of [[0,.65,.12,1.38],[0,.65,1.98,.12]]){const ribbon=block(w,.014,d,'#664333');ribbon.position.set(x,.064,z);lid.add(ribbon);}
 for(const sign of [-1,1]){const loop=mesh(new T.TorusGeometry(.13,.024,5,16),'#664333');loop.scale.set(1.4,.6,1);loop.rotation.x=-Math.PI/2;loop.rotation.z=sign*.3;loop.position.set(sign*.13,.10,.65);lid.add(loop);}
 return {root,lid};
}
export function makeSmallHeart(){
 const shape=new T.Shape();shape.moveTo(0,-.18);shape.bezierCurveTo(-.35,.03,-.25,.29,-.11,.24);shape.quadraticCurveTo(0,.24,0,.14);shape.bezierCurveTo(.15,.35,.37,.15,0,-.18);
 const heart=mesh(new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:false}), '#bf7772');heart.name='gift-heart';return heart;
}
