import {publicAsset} from './public-asset';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { characters, partIds, slots, type SlotId } from './characters';
import './style.css';
import { FreeAssembly } from './free-assembly';
import {t,getLanguage,setLanguage,person,slotNames} from './i18n';
import {AnniversaryMusic} from './music';
import {SoundEffects} from './sound-effects';
import {anniversary} from './anniversary';
import ldrawColors from './ldraw-colors.json';
import {loadShirtPrints,shirtPrint} from './shirt-prints';
import {ActionScene,headPose} from './affection';
import {ACTIONS,SEQUENCES,LIBRARY_GROUPS,AUTO_ACTIONS,chooseFresh,type ActionId,type SequenceId} from './action-library';
import {LifeScene,LittleLifeWorld,isLifeAction,LIFE_ACTIONS} from './life-scenes';
import {HandProps} from './hand-props';
import {waistBand} from './waist-band';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<main><div id="scene" aria-label="3D workbench"></div><div class="corner-tools"><button id="language" class="quiet-control language-control"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 12.1a8.2 8.2 0 1 1-16.4-.2 8.2 8.2 0 0 1 16.4.2Z"/><path d="M3.9 12h16.2M12 3.9c-4.4 4.5-4.5 11.4 0 16.2M12 3.9c4.2 4.8 4.2 11.5 0 16.2"/></svg><span id="language-label">EN</span></button><button id="music" class="quiet-control music-control" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 17.8V6.5l9-2.1v11.1"/><path d="m9.3 9.3 8.7-2"/><ellipse cx="6.2" cy="18" rx="3" ry="2.1" transform="rotate(-18 6.2 18)"/><ellipse cx="15.2" cy="15.6" rx="3" ry="2.1" transform="rotate(-18 15.2 15.6)"/><path class="music-muted-mark" d="m4.6 4.1 15 16"/></svg><span id="music-label" class="sr-only"></span><span class="music-on-dot" aria-hidden="true"></span></button><details class="credits"><summary aria-label="About this little world">ⓘ</summary><div><p>LDraw Parts Library · <a href="https://www.ldraw.org/" target="_blank" rel="noreferrer">LDraw.org</a></p><p>Geometry transformed and triangulated. Original authors and licenses:</p><a href="${publicAsset('ldraw-source/CAreadme.txt')}" target="_blank">CC BY license information</a><p>Original part sources and author credits are included with this project.</p><p>Shirt prints: original redraws of catalogued designs. <a href="${publicAsset('textures/README.md')}" target='_blank'>Pattern notes</a></p><p>Music: Piece by Piece · Treblo · original instrumental.</p></div></details></div><section class="intro"><p class="eyebrow"><span class="couple-names">${anniversary.names.join(' &amp; ')}</span><span class="dedication-dot">·</span><span class="dedication">${anniversary.dedication}</span></p><h1 id="title"></h1><p id="subtitle"></p><div class="assembly-modes" id="assembly-modes"><button id="mode-free" aria-pressed="true"></button><button id="mode-guided" aria-pressed="false"></button></div></section><div class="counter" id="counter">00 <small>/ 12</small></div><div class="label" id="name-0">DJ</div><div class="label" id="name-1">YW</div><div class="bottom"><div class="instruction" id="status" role="status" aria-live="polite"></div><div class="tools" id="tools"></div><p id="navigation-tip" class="navigation-tip"></p></div><div id="loading"><div class="spinner"></div><span id="loading-label"></span></div></main>`;
const $ = <E extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as E;
const status = (message: string) => { $('status').textContent = message; };
const SCALE = .035;
const WORLD = { width: 28, depth: 20, wanderX: 11.5, wanderZ: 8 };
const phoneView=()=>window.matchMedia('(max-width:700px), (max-width:1000px) and (max-height:500px)').matches;
let autoFraming=phoneView();
const pos = (x: number,y: number,z: number) => new T.Vector3(x*SCALE,-y*SCALE,-z*SCALE);
const scene = new T.Scene(); scene.background = new T.Color('#eee9df');
const camera = new T.PerspectiveCamera(36,1,.1,150);
const renderer = new T.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
$('scene').appendChild(renderer.domElement);
const controls = new OrbitControls(camera,renderer.domElement);controls.target.set(0,1,0);controls.enableDamping=true;controls.enablePan=false;controls.enableRotate=false;controls.enableZoom=false;controls.minDistance=11;controls.maxDistance=125;controls.maxPolarAngle=Math.PI*.46;
scene.add(new T.HemisphereLight('#fff8e7','#8a8978',3));
const sun = new T.DirectionalLight('#fff3dd',4);sun.position.set(-5,12,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;sun.shadow.normalBias=.035;scene.add(sun);
const ground = new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:'#e3dccb',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.3;ground.receiveShadow=true;scene.add(ground);
const board = new T.Mesh(new T.BoxGeometry(WORLD.width,.25,WORLD.depth),new T.MeshStandardMaterial({color:'#c8c8ad',roughness:.7}));board.position.y=-.14;board.receiveShadow=true;board.castShadow=true;scene.add(board);
const studGeo = new T.CylinderGeometry(.15,.15,.085,20);const studMat = new T.MeshStandardMaterial({color:'#c8c8ad',roughness:.55});
const studs = new T.InstancedMesh(studGeo,studMat,55*39);const dummy = new T.Object3D();let si=0;
for(let x=-27;x<=27;x++)for(let z=-19;z<=19;z++){dummy.position.set(x*.5,.025,z*.5);dummy.updateMatrix();studs.setMatrixAt(si++,dummy.matrix);}studs.receiveShadow=true;scene.add(studs);
const geometries = new Map<string,Record<string,T.BufferGeometry>>();
const palette:Record<string,string>=ldrawColors;
function part(id: string,color:string){const group=new T.Group();for(const [code,geo] of Object.entries(geometries.get(id)!)){const material=new T.MeshStandardMaterial({color:code==='16'?color:palette[code]??(/^0x2[0-9a-f]{6}$/i.test(code)?'#'+code.slice(3):color),roughness:.32,metalness:0,side:T.DoubleSide});const mesh=new T.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}return group;}
type Figure={root:T.Group,waist:T.Group,heightOffset:number,footHeight:(angle:number)=>number,parts:Record<SlotId,T.Group>,legPivots:T.Group[],x:number,z:number,heading:number,target:T.Vector2,pause:number,speed:number,decision:number,look:number,phase:number};
const figures:Figure[]=[];
function makeFigure(i:number):Figure{
 const def=characters[i];const root=new T.Group();root.position.set(phoneView()?0:i===0?-2:2,72*SCALE,phoneView()?(i===0?2.2:-2.2):0);root.rotation.y=phoneView()?Math.PI/2:0;scene.add(root);
 const waist=new T.Group(),upper=new T.Group();waist.position.y=-32*SCALE;upper.position.y=32*SCALE;waist.add(upper);root.add(waist);
 const parts={} as Record<SlotId,T.Group>;for(const slot of slots){parts[slot.id]=new T.Group();(slot.id==='legs'?root:upper).add(parts[slot.id]);parts[slot.id].visible=false;}
 parts.torso.add(part('973',def.torso),shirtPrint(def.shirtPrint,SCALE));
 parts.legs.position.copy(pos(0,32,0));parts.legs.add(part('3815',def.hips));if(def.waistBand)parts.legs.add(waistBand(def.waistBand,SCALE));
 const legPivots:T.Group[]=[];
 for(const [id,x] of [['3816',-10],['3817',10]] as const){const pivot=new T.Group();pivot.position.copy(pos(x,12,0));const m=part(id,def.legs);m.position.copy(pos(-x,0,0));pivot.add(m);parts.legs.add(pivot);legPivots.push(pivot);}
 for(const [key,id,x] of [['rightArm','3818',-15.552],['leftArm','3819',15.552]] as const){const arm=parts[key];arm.position.copy(pos(x,9,0));arm.rotation.z=(key==='rightArm'?-1:1)*T.MathUtils.degToRad(9.782);arm.add(part(id,def.arm));const hand=part('3820',def.skin);hand.position.copy(pos(key==='rightArm'?-5:5,20,-10));hand.rotation.x=Math.PI/4;arm.add(hand);}
 parts.head.position.copy(pos(0,-24,0));parts.head.add(part(def.headPart,def.skin));
 parts.hair.position.copy(pos(0,-24,0));parts.hair.add(part(def.hairPart,def.hair));parts.hair.userData.longHair=def.hairPart==='yw-long-bangs-approx';
 const footSamples=Object.values(geometries.get('3816')!).flatMap(geometry=>Array.from(geometry.getAttribute('position').array));
 const footHeight=(angle:number)=>{let low=Infinity;const c=Math.cos(angle),s=Math.sin(angle);for(let i=0;i<footSamples.length;i+=3)low=Math.min(low,footSamples[i+1]*c-footSamples[i+2]*s);return 28*SCALE+low;};
 return {root,waist,heightOffset:0,footHeight,parts,legPivots,x:root.position.x,z:root.position.z,heading:root.rotation.y,target:new T.Vector2(root.position.x,root.position.z),pause:.4+Math.random()*2,speed:.8,decision:2,look:0,phase:Math.random()*10};
}
type Action=ActionId;
let lifeWorld:LittleLifeWorld|undefined;let encounter:ActionScene|LifeScene|undefined;let props:HandProps|undefined;let queue:Action[]=[];let sweet=false;
let sequence:SequenceId|undefined;let cancelling=false;let autoInteractions=localStorage.getItem('little-world-surprises')!=='off';let nextAuto=45+Math.random()*25;const recentActions:Action[]=[];const recentSequences:SequenceId[]=[];
let count=0;let mode:'build'|'ready'|'awakening'|'play'='build';let activity:Action|'wander'|'recover'='wander';let activityTime=0;let elapsed=0;let transitionTime=0;let automatic=false;
const hintsOn=true;
const music=new AnniversaryMusic();
const sounds=new SoundEffects();
document.addEventListener('pointerdown',()=>sounds.unlock(),{capture:true,passive:true});
document.addEventListener('keydown',()=>sounds.unlock(),{capture:true});
let assemblyMode:'free'|'guided'='free';
let freeAssembly:FreeAssembly|undefined;
const MOBILE_FRAME_SCALE=.95;
const buildCamera=()=>{if(phoneView()){const d=Math.max(44,13.4/(Math.tan(T.MathUtils.degToRad(camera.fov/2))*camera.aspect));return new T.Vector3(.85,.9,.15).normalize().multiplyScalar(d*MOBILE_FRAME_SCALE);}if(assemblyMode==='guided')return new T.Vector3(8,10,camera.aspect<.85?24:17);const distance=Math.max(43,17/(Math.tan(T.MathUtils.degToRad(camera.fov/2))*camera.aspect));return new T.Vector3(.12,.85,1).normalize().multiplyScalar(distance);};
// One mobile frame for awakening, follow and explicit reframe. A lower
// elevation shows faces without losing the workbench and scattered pieces.
function playView(){
 if(!phoneView())return{position:new T.Vector3(14,20,35),target:new T.Vector3(0,1,0)};
 const[a,b]=figures,target=new T.Vector3((a.x+b.x)/2,1.3,(a.z+b.z)/2);
 const distance=Math.max(21,(Math.abs(a.x-b.x)+7)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*camera.aspect),(Math.abs(a.z-b.z)+7)*1.55);
 return{target,position:target.clone().add(new T.Vector3(.1,.56,1).normalize().multiplyScalar(distance*MOBILE_FRAME_SCALE))};
}
function setBuildView(){camera.position.copy(buildCamera());controls.target.set(0,phoneView()?.4:1,0);controls.enabled=true;controls.enablePan=true;controls.enableZoom=true;controls.enableRotate=true;controls.mouseButtons.LEFT=T.MOUSE.ROTATE;controls.mouseButtons.RIGHT=T.MOUSE.PAN;controls.touches.ONE=T.TOUCH.ROTATE;controls.touches.TWO=T.TOUCH.DOLLY_PAN;pauseOrbitForPiece();controls.enabled=true;}
function pauseOrbitForPiece(){
 const position=camera.position.clone(),target=controls.target.clone();
 controls.enableDamping=false;controls.update();
 camera.position.copy(position);controls.target.copy(target);controls.enableDamping=true;controls.update();controls.enabled=false;
}

let tray:T.Group|undefined;let ghost:T.Group|undefined;let dragging=false;
const pointer=new T.Vector2(),ray=new T.Raycaster();
$('music').onclick=async()=>{try{await music.toggle();renderCopy();}catch{status(t('音乐暂时无法播放，请再点一次。','Music could not start. Please try again.'));}};
$('language').onclick=()=>{setLanguage(getLanguage()==='zh'?'en':'zh');renderCopy();if(mode==='build'){if(assemblyMode==='free'){freeTools();if(freeAssembly?.selected)freeAssembly.describe(freeAssembly.selected);else status('');}else guidedStatus();}else if(mode==='play'){playTools();activityStatus();}else if(mode==='ready')readyTools();};
function renderCopy(){
 document.body.dataset.hints=hintsOn?'on':'off';document.body.dataset.mode=mode;document.body.dataset.assembly=assemblyMode;
 document.documentElement.lang=getLanguage()==='zh'?'zh-CN':'en';document.title=`${anniversary.names.join(' & ')} · ${anniversary.dedication}`;
 $('title').textContent=mode==='ready'?t('我们，刚刚好。','Better, together.'):t('一起，体验这个世界。',anniversary.theme+'.');
 // Keep the final two words together at every viewport width.
 if(getLanguage()==='en'&&mode!=='ready'){
  const title=$('title'),text=title.textContent!,split=text.indexOf('world together');
  if(split>=0){const phrase=document.createElement('span');phrase.className='title-phrase';phrase.textContent=text.slice(split);title.replaceChildren(text.slice(0,split),phrase);}
 }
 $('subtitle').textContent=mode==='ready'?t('下一块，也想和你一起。','Every next piece, with you.'):mode==='play'?t('各自去看看，再回来抱抱。','A little exploring. A little closer.'):t('一块一块，拼出我们的世界。','Piece by piece, a world of our own.');
 $('language-label').textContent=getLanguage()==='zh'?'EN':'中';$('language').setAttribute('aria-label',t('Switch to English','切换到中文'));
 $('music-label').textContent=music.enabled?t('音乐开','Music on'):t('音乐关','Music off');$('music').setAttribute('aria-label',music.enabled?t('关闭音乐','Turn music off'):t('播放音乐','Play music'));$('music').setAttribute('aria-pressed',String(music.enabled));$('music').title=music.enabled?t('暂停音乐','Pause music'):t('播放音乐','Play music');$('language').title=t('切换语言 · English','Switch language · 中文');
 $('mode-free').textContent=t('自由拼装','Free build');$('mode-guided').innerHTML=`<span class="lazy-label">${t('我太懒了','I’m too lazy')}<sup class="sleep-mark" aria-hidden="true"><span>z</span><span>z</span><span>z</span></sup></span>`;
 $('name-0').textContent='DJ';$('name-1').textContent='YW';$('loading-label')?.replaceChildren(t('把小小的我们，摆上桌。','Setting out the pieces of us.'));
 $('navigation-tip').textContent=mode==='build'?t('拖空白处环绕 · 右键平移 · 滚轮或双指缩放','Drag empty space to orbit · Right-drag to pan · Scroll or pinch to zoom'):'';
 if(freeAssembly)freeAssembly.hintsEnabled=hintsOn;
}
function activityStatus(){
 if(cancelling){status(t('歇一会，再捡起小东西。','A little pause, then our little things.'));return;}
 if(activity==='recover'){status(t('先回去，把小东西捡起来。','Back for our little things.'));return;}
 status(activity==='wander'?'':t(...ACTIONS[activity].copy));
}
function fitView(){autoFraming=phoneView();if(mode==='build'||mode==='ready')setBuildView();else{const view=playView();camera.position.copy(view.position);controls.target.copy(view.target);controls.update();}}
const fitButton=(build=false)=>`<button id="fit" class="mobile-only ${build?'build-tool':'fit-control'}" aria-label="${t('重新取景','Frame the workbench')}" title="${t('重新取景','Frame the workbench')}">${build?'<span class="tool-disc">':''}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4M9 12h6m-3-3v6"/></svg>${build?`</span><span class="tool-caption">${t('取景','Frame')}</span>`:''}</button>`;


function disposeClone(group:T.Group|undefined){if(!group)return;scene.remove(group);group.traverse(obj=>{if(obj instanceof T.Mesh){const mats=Array.isArray(obj.material)?obj.material:[obj.material];for(const mat of mats)mat.dispose();}});}
function cloneIndependent(source:T.Group){const clone=source.clone(true);clone.visible=true;clone.traverse(o=>{if(o instanceof T.Mesh){o.material=(o.material as T.Material).clone();}});return clone;}
const helperIcon=(ready:boolean)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ready?'<path d="M7 4v7a5 5 0 0 0 10 0V4M7 8h3m4 0h3M7 4h3v7a2 2 0 0 0 4 0V4h3"/><path d="m3 15 2 1m14 0 2-1M12 20v2"/>':'<path d="m12 3 1.8 6.2L20 12l-6.2 2.8L12 21l-1.8-6.2L4 12l6.2-2.8ZM20 3v4m-2-2h4"/>'}</svg>`;
function freeTools(){
 $('tools').innerHTML=`<div class="build-tool-row"><button id="hint" class="hint-helper build-tool"><span class="tool-disc">${helperIcon(false)}</span><span class="tool-caption">${t('找一块','Find a piece')}</span><span class="desktop-label">${t('下一块提示','A little hint')}</span></button><button id="connect" class="hint-helper desktop-connect">${t('装上这一块','Place this piece')}</button><button id="scatter" class="build-tool"><span class="tool-disc"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="6" height="6" rx="1" transform="rotate(-12 7 8)"/><rect x="14" y="12" width="6" height="6" rx="1" transform="rotate(14 17 15)"/><path d="m15 3 3 1-1 3M3 16l2 3 3-1"/></svg></span><span class="tool-caption">${t('再散开','Mix it up')}</span><span class="desktop-label">${t('再散开一次','Scatter again')}</span></button>${fitButton(true)}</div>`;
 $('hint').onclick=()=>{
  const selected=freeAssembly?.selected;
  if(phoneView()&&selected&&freeAssembly?.eligible(selected))freeAssembly.connect(selected);
  else{freeAssembly?.hint();if(phoneView())status(t('找到啦，再点一下帮你放好。','Found one. Tap again to place it.'));}
  refreshFreeButton();
 };
 $('connect').onclick=()=>{const p=freeAssembly?.selected;if(p&&freeAssembly?.eligible(p))freeAssembly.connect(p);};
 $('scatter').onclick=()=>{freeAssembly?.scatter();refreshFreeButton();status('');};
 $('fit').onclick=fitView;
 renderCopy();refreshFreeButton();
}
function refreshFreeButton(){
 const ready=!!freeAssembly?.selected&&freeAssembly.eligible(freeAssembly.selected);
 const button=$<HTMLButtonElement>('connect');if(button)button.disabled=!ready;
 const helper=$<HTMLButtonElement>('hint');if(!helper)return;
 helper.dataset.ready=String(ready);helper.setAttribute('aria-label',phoneView()?(ready?t('帮放好选中的零件','Place the selected piece'):t('找一块可以拼装的零件','Find a piece to build')):t('下一块提示','A little hint'));
 helper.querySelector('.tool-disc')!.innerHTML=helperIcon(ready);
 helper.querySelector('.tool-caption')!.textContent=ready?t('帮放好','Place it'):t('找一块','Find a piece');
}
function startFree(){
 freeAssembly?.destroy();
 setBuildView();freeAssembly=new FreeAssembly(scene,figures,cloneIndependent,group=>disposeClone(group),renderer.domElement,camera,()=>{count++;sounds.play('snap');$('counter').innerHTML=`${String(count).padStart(2,'0')} <small>/ 12</small>`;if(count===12){freeAssembly?.destroy();freeAssembly=undefined;showNext();}else{status(t('又靠近一点点。','A little closer.'));refreshFreeButton();}},status,WORLD,speed=>sounds.play('drop',Math.min(1,speed/5)));
 freeAssembly.hintsEnabled=hintsOn;freeTools();status('');
}
for(const kind of ['free','guided'] as const)$('mode-'+kind).onclick=()=>{assemblyMode=kind;reset();};
function showNext(){
 disposeClone(tray);disposeClone(ghost);tray=undefined;ghost=undefined;
 $('counter').innerHTML=`${String(count).padStart(2,'0')} <small>/ 12</small>`;
 if(count===12){sounds.play('complete');mode='ready';readyTools();renderCopy();return;}
 if(assemblyMode==='free'){startFree();return;}
 const i=Math.floor(count/6),slot=slots[count%6],figure=figures[i],source=figure.parts[slot.id];scene.updateMatrixWorld(true);
 ghost=cloneIndependent(source);source.getWorldPosition(ghost.position);source.getWorldQuaternion(ghost.quaternion);ghost.traverse(obj=>{if(obj instanceof T.Mesh){if(obj.userData.print)obj.visible=false;obj.material=new T.MeshStandardMaterial({color:i===0?'#64869d':'#9a7058',transparent:true,opacity:.2,depthWrite:false,side:T.DoubleSide});obj.castShadow=false;}});scene.add(ghost);
 tray=cloneIndependent(source);tray.position.set(0,1.25,2.9);tray.rotation.set(0,-.15,0);scene.add(tray);
 guidedStatus();
 $('tools').innerHTML=`<button class="primary" id="auto" ${automatic?'disabled':''}>${automatic?t('拼装中…','Building…'):t('自动拼装','Build for me')}</button>`;renderCopy();
 $('auto').onclick=()=>{if(automatic)return;automatic=true;autoBuild();};
}
let autoTimer:ReturnType<typeof setTimeout>|undefined;
function autoBuild(){if(!automatic||mode!=='build')return;attach();if(mode==='build')autoTimer=setTimeout(autoBuild,350);else automatic=false;}
function attach(){if(mode!=='build'||assemblyMode==='free'||count>=12)return;figures[Math.floor(count/6)].parts[slots[count%6].id].visible=true;count++;sounds.play('snap');showNext();}
function reset(){lifeWorld?.reset();props?.reset();cancelling=false;sequence=undefined;recentActions.length=0;recentSequences.length=0;nextAuto=45+Math.random()*25;autoFraming=phoneView();encounter?.dispose();encounter=undefined;queue=[];sweet=false;freeAssembly?.destroy();freeAssembly=undefined;disposeClone(tray);disposeClone(ghost);tray=undefined;ghost=undefined;$('assembly-modes').hidden=false;for(const k of ['free','guided'])$('mode-'+k).setAttribute('aria-pressed',String(k===assemblyMode));automatic=false;if(autoTimer)clearTimeout(autoTimer);dragging=false;mode='build';activity='wander';activityTime=0;count=0;transitionTime=0;controls.enableRotate=false;controls.enableZoom=false;controls.target.set(0,1,0);for(let i=0;i<2;i++){const f=figures[i];f.root.position.set(phoneView()?0:i===0?-2:2,72*SCALE,phoneView()?(i===0?2.2:-2.2):0);f.root.rotation.set(0,phoneView()?Math.PI/2:0,0);f.x=f.root.position.x;f.z=f.root.position.z;f.heading=f.root.rotation.y;f.target.set(f.x,f.z);f.pause=.4+Math.random()*2;f.decision=1+Math.random()*3;f.phase=Math.random()*10;Object.values(f.parts).forEach(p=>p.visible=false);pose(f,0,0);}setSteps('build');setBuildView();showNext();renderCopy();}
function setSteps(_step:string){/* The gift has no product navigation header. */}
function guidedStatus(){status('');const button=$<HTMLButtonElement>('auto');if(button){button.disabled=automatic;button.textContent=automatic?t('拼装中…','Building…'):t('自动拼装','Build for me');}}
function readyTools(){status('');$('tools').innerHTML=`<button class="primary" id="life">${t('让我们的小世界动起来','Bring our world to life')}</button><button id="reset">${t('再拼一次','Build again')}</button>`;$('life').onclick=awaken;$('reset').onclick=reset;}
const awakeningActors:{x:number;z:number;heading:number}[]=[];
function awaken(){if(mode!=='ready')return;awakeningActors.splice(0,2,...figures.map(f=>({x:f.x,z:f.z,heading:f.heading})));autoFraming=phoneView();awakeningFrom.copy(camera.position);awakeningTarget.copy(controls.target);controls.enabled=false;controls.enableDamping=false;mode='awakening';$('assembly-modes').hidden=true;transitionTime=0;$('tools').innerHTML='';status('');renderCopy();sounds.play('awaken');}
const actionIcon=(name:'wave'|'hug'|'dance'|'reset'|'moments')=>{
 const paths={
  wave:'<path d="m8 12-1.4-4.5a1.3 1.3 0 0 1 2.5-.7L10.3 11 9.5 4.9a1.3 1.3 0 0 1 2.6-.3l.7 6.1.1-7a1.3 1.3 0 0 1 2.6 0l-.1 7.2 1.1-4.5a1.3 1.3 0 0 1 2.5.6l-1.6 7.6c-.7 3.2-2.4 5-5.4 5-2.2 0-3.5-1.1-4.6-2.8l-2.7-4.1a1.4 1.4 0 0 1 2.1-1.8L9 13.1"/><path d="M3 5.3 2 3m18 14.7 1.5 1.6"/>',
  hug:'<path d="M12 20S3.5 14.7 3.5 8.5A4.5 4.5 0 0 1 12 6.4a4.5 4.5 0 0 1 8.5 2.1C20.5 14.7 12 20 12 20Z"/>',
  dance:'<path d="M9 17.5V6.2l10-2v11.2M9 9l10-2"/><ellipse cx="6.5" cy="17.5" rx="2.5" ry="1.9" transform="rotate(-15 6.5 17.5)"/><ellipse cx="16.5" cy="15.5" rx="2.5" ry="1.9" transform="rotate(-15 16.5 15.5)"/>',
  moments:'<path d="m12 3 1.8 6.7L20 12l-6.2 2.3L12 21l-1.8-6.7L4 12l6.2-2.3ZM20 2v4m-2-2h4"/>',
  reset:'<path d="M5 8a7.2 7.2 0 1 1-.4 7.1M5 3.7V8h4.3"/>'
 };
 return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
};
let libraryTab:'affection'|'together'|'stories'|'life'='affection';
function closeLibrary(focus=false){const menu=$('moments') as HTMLDetailsElement;if(menu){const wasOpen=menu.open;menu.open=false;if(focus&&wasOpen)menu.querySelector('summary')?.focus();}}
function selectLibraryTab(tab:typeof libraryTab,focus=false){
 libraryTab=tab;
 for(const id of ['affection','together','stories','life'] as const){const selected=id===tab,button=$('library-tab-'+id);button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;$('library-panel-'+id).hidden=!selected;if(selected&&focus)button.focus();}
}
function playTools(){
 const actions=(ids:readonly Action[])=>ids.map(id=>`<button id="${id==='wave'||id==='dance'?'library-'+id:id}" data-action="${id}">${t(...ACTIONS[id].label)}</button>`).join('');
 const recipes=Object.entries(SEQUENCES).map(([id,recipe])=>`<button id="${id}" data-sequence="${id}">${t(...recipe.label)}</button>`).join('');
 const tabs=[['affection',t('心动','Affection')],['together',t('陪伴','Together')],['stories',t('组合','Stories')],['life',t('生活','Life')]] as const;
 const panels=tabs.map(([id])=>`<section id="library-panel-${id}" class="library-group ${id==='stories'?'recipes':''}" role="tabpanel" aria-labelledby="library-tab-${id}" ${libraryTab===id?'':'hidden'}><div>${id==='affection'?actions(LIBRARY_GROUPS[0].actions):id==='together'?actions(['wave','dance',...LIBRARY_GROUPS[1].actions]):id==='life'?actions(LIFE_ACTIONS):recipes+`<button id="surprise">${t('随心来一段','Surprise us')}</button>`}</div></section>`).join('');
 $('tools').innerHTML=`<button class="action quick-action" id="wave">${actionIcon('wave')}<span>${t(...ACTIONS.wave.label)}</span></button><button class="action" id="hug">${actionIcon('hug')}<span>${t(...ACTIONS.hug.label)}</span></button><button class="action quick-action" id="dance">${actionIcon('dance')}<span>${t(...ACTIONS.dance.label)}</span></button><details class="moments" id="moments"><summary>${actionIcon('moments')}<span class="moments-label-long">${t('小小心动','Little moments')}</span><span class="moments-label-short">${t('小小心动','Moments')}</span><svg class="menu-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 10 4-4 4 4"/></svg></summary><div class="moments-list" role="region" aria-label="${t('选择一个小互动','Choose a little moment')}"><header class="library-heading"><h2>${t('想做点什么？','What shall we do?')}</h2><button id="library-close" class="library-close" aria-label="${t('收起动作','Close actions')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button></header><div id="library-tabs" class="library-tabs" role="tablist" aria-label="${t('动作类型','Kinds of moments')}">${tabs.map(([id,label])=>`<button id="library-tab-${id}" role="tab" aria-selected="${libraryTab===id}" aria-controls="library-panel-${id}" tabindex="${libraryTab===id?0:-1}">${label}</button>`).join('')}</div>${panels}<footer class="library-footer"><button id="surprises" class="surprises-toggle" role="switch" aria-checked="${autoInteractions}"><span>${t('偶尔的小互动','Little surprises')}</span><span class="switch-track" aria-hidden="true"></span></button><button id="rebuild-menu" class="mobile-only" aria-label="${t('再拼一次','Build again')}" title="${t('再拼一次','Build again')}">${actionIcon('reset')}<span>${t('再拼一次','Build again')}</span></button></footer></div></details><button class="rebuild" id="stop" hidden>${t('先歇一会','A little pause')}</button>${fitButton()}<button class="rebuild desktop-rebuild" id="reset">${actionIcon('reset')}<span>${t('再拼一次','Build again')}</span></button>`;
 for(const [id]of tabs)$('library-tab-'+id).onclick=()=>selectLibraryTab(id);
 $('library-tabs').onkeydown=e=>{const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(e.key))return;e.preventDefault();e.stopPropagation();const focused=tabs.findIndex(([id])=>'library-tab-'+id===(e.target as HTMLElement).id),i=focused<0?tabs.findIndex(([id])=>id===libraryTab):focused,next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length;selectLibraryTab(tabs[next][0],true);};
 $('library-close').onclick=()=>closeLibrary(true);
 for(const id of ['wave','hug','dance'] as const)$(id).onclick=()=>{closeLibrary(true);startActivity(id);};
 $('tools').querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button=>button.onclick=()=>{closeLibrary(true);startActivity(button.dataset.action as Action);});
 $('tools').querySelectorAll<HTMLButtonElement>('[data-sequence]').forEach(button=>button.onclick=()=>{closeLibrary(true);startSequence(button.dataset.sequence as SequenceId);});
 $('surprise').onclick=()=>{closeLibrary(true);startSequence(chooseFresh(Object.keys(SEQUENCES) as SequenceId[],recentSequences,2)??'sweet');};
 $('surprises').onclick=()=>{autoInteractions=!autoInteractions;localStorage.setItem('little-world-surprises',autoInteractions?'on':'off');$('surprises').setAttribute('aria-checked',String(autoInteractions));};
 $('stop').onclick=()=>{if(activity==='recover'||cancelling)return;queue=[];sweet=false;sequence=undefined;cancelling=true;encounter?.cancel();if(!encounter)finishActivity();activityStatus();actionControls();};
 $('reset').onclick=reset;$('rebuild-menu').onclick=reset;$('fit').onclick=fitView;renderCopy();actionControls();
}
function actionControls(){
 const busy=activity!=='wander';
 for(const button of Array.from($('tools').querySelectorAll<HTMLButtonElement>('[data-action],[data-sequence],#wave,#hug,#dance,#surprise'))){button.disabled=busy;const id=button.dataset.action??button.dataset.sequence??button.id;button.setAttribute('aria-pressed',String(sequence?id===sequence:id===activity));}
 if($('stop')){$('stop').hidden=!busy;$<HTMLButtonElement>('stop').disabled=activity==='recover'||cancelling;$('stop').textContent=activity==='recover'?t('捡起小东西','Picking up…'):t('先歇一会','A little pause');}
 $('moments')?.classList.toggle('active',busy);
}
function startActivity(a:Action){if(mode!=='play'||activity!=='wander')return;sequence=undefined;sweet=false;props?.drop();beginActivity(a);}
function startSequence(id:SequenceId){if(mode!=='play'||activity!=='wander')return;sequence=id;sweet=id==='sweet';recentSequences.push(id);if(recentSequences.length>6)recentSequences.shift();const steps=[...SEQUENCES[id].steps];queue=steps.slice(1);props?.drop();beginActivity(steps[0]);}
function beginActivity(a:Action){
 activity=a;activityTime=0;cancelling=false;recentActions.push(a);if(recentActions.length>8)recentActions.shift();
 const center=figures.reduce((v,f)=>v.add(new T.Vector2(f.x,f.z)),new T.Vector2()).multiplyScalar(.5);
 encounter=isLifeAction(a)?new LifeScene(a,figures,scene,lifeWorld!,(f,x,z,dt,speed)=>moveTo(f as Figure,x,z,dt,speed),(f,amount)=>pose(f as Figure,amount,elapsed*1.3),cue=>sounds.play(cue)):new ActionScene(a,figures,scene,(f,x,z,dt,speed)=>moveTo(f as Figure,x,z,dt,speed),(f,amount)=>pose(f as Figure,amount,elapsed*1.3),cue=>sounds.play(cue),WORLD,queue.length>0,Math.atan2(camera.position.x-center.x,camera.position.z-center.y));
 activityStatus();actionControls();
}
function finishActivity(){
 encounter?.dispose();encounter=undefined;for(const f of figures)pose(f,0,elapsed);
 const next=queue.shift();if(next&&!cancelling){beginActivity(next);return;}
 queue=[];sweet=false;sequence=undefined;cancelling=false;
 if(props?.beginRecovery()){activity='recover';activityStatus();actionControls();return;}
 resumeWander();
}
function resumeWander(){activity='wander';activityTime=0;nextAuto=45+Math.random()*25;for(const f of figures){pose(f,0,elapsed);f.pause=.4+Math.random()*2;f.look=f.heading;f.decision=.5+Math.random()*3;f.target.set(f.x,f.z);}activityStatus();actionControls();}
function pose(f:Figure,walk:number,t:number){f.heightOffset=0;f.waist.rotation.set(0,0,0);f.legPivots[0].rotation.x=Math.sin(t*8)*.42*walk;f.legPivots[1].rotation.x=-Math.sin(t*8)*.42*walk;f.parts.rightArm.rotation.set(-Math.sin(t*8)*.3*walk,0,-T.MathUtils.degToRad(9.782));f.parts.leftArm.rotation.set(Math.sin(t*8)*.3*walk,0,T.MathUtils.degToRad(9.782));headPose(f,0,Math.sin(t*.9)*.09);f.root.rotation.z=0;}
function moveTo(f:Figure,x:number,z:number,dt:number,speed:number){const dx=x-f.x,dz=z-f.z,d=Math.hypot(dx,dz);if(d>.00001){const step=Math.min(d,speed*dt);f.x+=dx/d*step;f.z+=dz/d*step;const angle=Math.atan2(dx,dz);f.heading+=Math.atan2(Math.sin(angle-f.heading),Math.cos(angle-f.heading))*Math.min(1,dt*8);}return d;}
function chooseWander(f:Figure){
 const r=Math.random();f.decision=1.8+Math.random()*6;
 if(r<.26){f.pause=.5+Math.random()*3.5;f.look=f.heading+(Math.random()-.5)*2.2;f.target.set(f.x,f.z);return;}
 if(r<.78){const angle=f.heading+(Math.random()-.5)*Math.PI*1.7,distance=.8+Math.random()*5;f.target.set(T.MathUtils.clamp(f.x+Math.sin(angle)*distance,-WORLD.wanderX,WORLD.wanderX),T.MathUtils.clamp(f.z+Math.cos(angle)*distance,-WORLD.wanderZ,WORLD.wanderZ));}
 else f.target.set((Math.random()*2-1)*WORLD.wanderX,(Math.random()*2-1)*WORLD.wanderZ);
 f.speed=.5+Math.random()*1.05;f.pause=Math.random()<.2?Math.random()*.9:0;f.look=f.heading;
}
function updateCharacters(dt:number){
 for(const f of figures)pose(f,0,elapsed);
 if(activity==='wander'){
  for(let i=0;i<2;i++){
   const f=figures[i],other=figures[1-i];f.decision-=dt;
   if(f.pause>0){f.pause-=dt;f.heading=T.MathUtils.damp(f.heading,f.look,2,dt);headPose(f,0,Math.sin(elapsed*1.3+f.phase)*.18);continue;}
   let distance=Math.hypot(f.target.x-f.x,f.target.y-f.z);
   if(distance<.15||f.decision<=0){chooseWander(f);continue;}
   const next=new T.Vector2(f.target.x-f.x,f.target.y-f.z).normalize();
   const away=new T.Vector2(f.x-other.x,f.z-other.z),separation=away.length();
   if(separation<2.8){
    if(separation<.001)away.set(i===0?-1:1,.3);
    away.normalize();
    const lateral=new T.Vector2(-away.y,away.x).multiplyScalar(i===0?.8:-.8);
    next.addScaledVector(away,(2.8-separation)*2.5).add(lateral).normalize();
   }
   const flower=lifeWorld?.obstacle;if(flower){const awayFlower=new T.Vector2(f.x-flower.x,f.z-flower.z),d=awayFlower.length();if(d<flower.radius+1.2){if(d<.01)awayFlower.set(1,0);next.addScaledVector(awayFlower.normalize(),(flower.radius+1.2-d)*4).normalize();if(Math.hypot(f.target.x-flower.x,f.target.y-flower.z)<flower.radius+1)f.decision=0;}}
   const step=Math.min(distance,f.speed*dt);
   const x=T.MathUtils.clamp(f.x+next.x*step,-WORLD.wanderX,WORLD.wanderX),z=T.MathUtils.clamp(f.z+next.y*step,-WORLD.wanderZ,WORLD.wanderZ);
   moveTo(f,x,z,dt,f.speed);pose(f,1,elapsed*f.speed+f.phase);
  }
  if(autoInteractions){nextAuto-=dt;if(nextAuto<=0){startActivity(chooseFresh(AUTO_ACTIONS,recentActions,3)??'look');}}
 }else if(activity==='recover'){
  if(props?.updateRecovery(dt,(f,x,z,delta,speed)=>moveTo(f as Figure,x,z,delta,speed),(f,amount,time)=>pose(f as Figure,amount,time),elapsed))resumeWander();
 }else{
  activityTime+=dt;if(encounter?.update(dt))finishActivity();
 }
 for(const f of figures){f.root.position.set(f.x,72*SCALE+f.heightOffset,f.z);f.root.rotation.y=f.heading;}
 props?.updatePhysics(dt);
}

const awakeningFrom=new T.Vector3(),awakeningTarget=new T.Vector3();
function pointerFrom(e:PointerEvent){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);}
renderer.domElement.addEventListener('pointerdown',e=>{
 if(e.button!==0||mode!=='build'||assemblyMode!=='free'||!freeAssembly)return;
 pointerFrom(e);const p=freeAssembly.pick(ray);
 if(p){dragging=true;pauseOrbitForPiece();pointerFrom(e);freeAssembly.begin(p,ray);renderer.domElement.setPointerCapture(e.pointerId);refreshFreeButton();}
},{capture:true});
renderer.domElement.addEventListener('pointermove',e=>{if(mode!=='build'||assemblyMode!=='free'||!freeAssembly)return;pointerFrom(e);if(dragging)freeAssembly.drag(ray);else renderer.domElement.style.cursor=freeAssembly.pick(ray)?'grab':'default';});
function release(e:PointerEvent,cancel=false){
 if(assemblyMode!=='free'||mode!=='build'||!freeAssembly||!dragging)return;
 dragging=false;controls.enabled=true;if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);freeAssembly.end(cancel);refreshFreeButton();
}
renderer.domElement.addEventListener('pointerup',e=>release(e));renderer.domElement.addEventListener('pointercancel',e=>release(e,true));
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&mode==='build'&&(e.target===document.body||e.target===renderer.domElement)){e.preventDefault();if(assemblyMode==='guided')$('auto')?.click();else{const p=freeAssembly?.selected;if(p&&freeAssembly?.eligible(p))freeAssembly.connect(p);}}});
function resize(){const r=$('scene').getBoundingClientRect();camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height);if(mode==='build'||mode==='ready')setBuildView();if(mode==='build'&&assemblyMode==='free')refreshFreeButton();}
window.addEventListener('resize',resize);new ResizeObserver(resize).observe($('scene'));resize();
controls.addEventListener('start',()=>{if(mode==='play')autoFraming=false;});
// A layout offset leaves the actors visible above/beside the compact menu.
// Camera position, orbit, zoom and the user's follow preference stay untouched.
let menuShiftX=0,menuShiftY=0;
function frameForLibrary(dt:number){
 const panel=$('moments') as HTMLDetailsElement|null;
 let x=0,y=0;
 if(mode==='play'&&phoneView()&&panel?.open){
  const bounds=panel.querySelector('.moments-list')!.getBoundingClientRect();
  if(innerWidth>700)x=bounds.width*.38;else y=bounds.height*.5;
 }
 const alpha=matchMedia('(prefers-reduced-motion:reduce)').matches?1:1-Math.exp(-dt*12);
 menuShiftX=T.MathUtils.lerp(menuShiftX,x,alpha);menuShiftY=T.MathUtils.lerp(menuShiftY,y,alpha);
 if(mode!=='play'){menuShiftX=0;menuShiftY=0;}
 if(Math.abs(menuShiftX-x)<.1)menuShiftX=x;if(Math.abs(menuShiftY-y)<.1)menuShiftY=y;
 const rect=renderer.domElement.getBoundingClientRect();
 if(menuShiftX||menuShiftY)camera.setViewOffset(rect.width,rect.height,menuShiftX,menuShiftY,rect.width,rect.height);
 else if(camera.view?.enabled)camera.clearViewOffset();
}
const clock=new T.Clock();
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;
 if(mode==='build'||mode==='ready'){if(tray&&!dragging)tray.rotation.y=-.15+Math.sin(elapsed*.8)*.12;}
 if(mode==='build')freeAssembly?.update(dt);
 if(mode==='awakening'){transitionTime+=dt;const k=Math.min(1,transitionTime/2.2),e=1-Math.pow(1-k,3);const end=playView();camera.position.copy(awakeningFrom).lerp(end.position,e);controls.target.copy(awakeningTarget).lerp(end.target,e);figures.forEach((f,i)=>{const from=awakeningActors[i];f.x=T.MathUtils.lerp(from.x,i===0?-2:2,e);f.z=T.MathUtils.lerp(from.z,0,e);f.heading=T.MathUtils.lerp(from.heading,0,e);f.root.position.set(f.x,72*SCALE,f.z);f.root.rotation.y=f.heading;f.parts.head.rotation.y=Math.sin(transitionTime*3+i)*.2;f.parts.hair.rotation.y=f.parts.head.rotation.y;f.parts.rightArm.rotation.x=-Math.sin(Math.min(transitionTime/2.2,1)*Math.PI)*.8;});if(k===1){mode='play';props?.equip();controls.enabled=true;controls.enableDamping=true;controls.enableRotate=true;controls.enableZoom=true;controls.enablePan=true;controls.mouseButtons.LEFT=T.MOUSE.ROTATE;controls.touches.ONE=T.TOUCH.ROTATE;activityStatus();playTools();renderCopy();}}
 if(mode==='play')updateCharacters(dt);
 if(mode==='play'&&phoneView()&&autoFraming){const view=playView(),alpha=1-Math.exp(-dt*1.8);camera.position.lerp(view.position,alpha);controls.target.lerp(view.target,alpha);}
 controls.update();frameForLibrary(dt);
 for(let i=0;i<2;i++){if(!figures[i])continue;const p=figures[i].root.position.clone();p.y=0;p.z+=.9;p.project(camera);const r=$('scene').getBoundingClientRect();const label=$('name-'+i);label.style.left=`${r.left+(p.x*.5+.5)*r.width}px`;label.style.top=`${r.top+(-p.y*.5+.5)*r.height}px`;}
 renderer.render(scene,camera);
}
async function boot(){try{await loadShirtPrints(characters.map(d=>d.shirtPrint));await Promise.all(partIds.map(async id=>{const revision=characters.find(d=>d.hairPart===id)?.hairRevision;const response=await fetch(publicAsset(`models/${id}.json${revision?'?v='+revision:''}`));if(!response.ok)throw Error(`零件 ${id} 加载失败`);const data=await response.json() as Record<string,number[]>;const groups:Record<string,T.BufferGeometry>={};for(const [code,vertices] of Object.entries(data)){const transformed=vertices.map((v,i)=>v*SCALE*(i%3===0?1:-1));let geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(transformed,3));if(id==='yw-long-bangs-approx')geo=mergeVertices(geo,.0001);geo.computeVertexNormals();groups[code]=geo;}geometries.set(id,groups);}));figures.push(makeFigure(0),makeFigure(1));lifeWorld=new LittleLifeWorld(scene,part);props=new HandProps(scene,figures,part,speed=>sounds.play('drop',Math.min(1,speed/5)),WORLD);$('loading').hidden=true;showNext();frame();}catch(error){$('loading').innerHTML=`<p>${t('零件还没准备好。','The pieces are not ready yet.')}</p><button id="retry">${t('再试一次','Try again')}</button>`;status(String(error));$('retry').onclick=()=>location.reload();console.error(error);}}
// Read-only inspection for local browser QA; eliminated from production builds.
if(import.meta.env.DEV)Object.defineProperty(window,'__brickWorld',{get:()=>{
 const project=(v:T.Vector3)=>{const r=renderer.domElement.getBoundingClientRect();const p=v.clone().project(camera);return {x:r.left+(p.x*.5+.5)*r.width,y:r.top+(-p.y*.5+.5)*r.height};};
 return {life:lifeWorld?.snapshot,mode,assemblyMode,count,activity,sequence,cancelling,action:encounter?.snapshot??null,props:props?.snapshot??null,recentActions:[...recentActions],autoInteractions,nextAuto,autoFraming,effects:scene.children.filter(o=>o.name==='affection-heart').length,encounter:encounter?.phase??null,queue:[...queue],sweet,hintsOn,language:getLanguage(),sounds:sounds.snapshot,guided:tray&&ghost?{piece:project(tray.position),target:project(ghost.position)}:null,camera:{viewOffset:camera.view?.enabled?[camera.view.offsetX,camera.view.offsetY]:[0,0],position:camera.position.toArray(),target:controls.target.toArray(),azimuth:controls.getAzimuthalAngle(),polar:controls.getPolarAngle()},music:{enabled:music.enabled,paused:music.audio.paused,time:music.audio.currentTime,volume:music.audio.volume,loop:music.audio.loop,source:music.audio.currentSrc},world:WORLD,portraits:characters.map(d=>({head:d.headPart,hair:d.hairPart,skin:d.skin,legs:d.legs,hips:d.hips,shirt:d.shirtCatalog,print:d.shirtPrint})),figures:figures.map(f=>({waist:f.waist.rotation.toArray(),heightOffset:f.heightOffset,feetY:f.footHeight(f.legPivots[0].rotation.x)+f.heightOffset,legs:f.legPivots.map(p=>p.rotation.toArray()),screen:project(f.root.position),head:f.parts.head.rotation.toArray(),hair:f.parts.hair.rotation.toArray(),headPosition:f.parts.head.position.toArray(),hairPosition:f.parts.hair.position.toArray(),arms:[f.parts.rightArm.rotation.toArray(),f.parts.leftArm.rotation.toArray()],x:f.x,z:f.z,speed:f.speed,pause:f.pause,heading:f.heading,target:[f.target.x,f.target.y]})),pieces:freeAssembly?.pieces.map(p=>({character:p.character,slot:p.slot,attached:p.attached,held:p===freeAssembly?.holding,hintVisible:p.ghost.visible,highlighted:Boolean(p.ghost.userData.highlighted),eligible:freeAssembly!.eligible(p),position:p.visual.position.toArray(),velocity:p.body.velocity.toArray(),screen:project(p.visual.position),target:project(freeAssembly!.target(p))}))??[]};
}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLibrary(true);});
document.addEventListener('pointerdown',e=>{if(e.target instanceof Element&&!e.target.closest('#moments'))closeLibrary();});
renderCopy();
void boot();
