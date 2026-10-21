import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { characters, partIds, slots, type SlotId } from './characters';
import './style.css';
import { FreeAssembly } from './free-assembly';
import {t,getLanguage,setLanguage,person,slotNames} from './i18n';
import {AnniversaryMusic} from './music';
import {SoundEffects} from './sound-effects';
import {anniversary} from './anniversary';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<main><div id="scene" aria-label="3D workbench"></div><div class="corner-tools"><button id="language" class="quiet-control language-control"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 12.1a8.2 8.2 0 1 1-16.4-.2 8.2 8.2 0 0 1 16.4.2Z"/><path d="M3.9 12h16.2M12 3.9c-4.4 4.5-4.5 11.4 0 16.2M12 3.9c4.2 4.8 4.2 11.5 0 16.2"/></svg><span id="language-label">EN</span></button><button id="music" class="quiet-control music-control" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 17.8V6.5l9-2.1v11.1"/><path d="m9.3 9.3 8.7-2"/><ellipse cx="6.2" cy="18" rx="3" ry="2.1" transform="rotate(-18 6.2 18)"/><ellipse cx="15.2" cy="15.6" rx="3" ry="2.1" transform="rotate(-18 15.2 15.6)"/><path class="music-muted-mark" d="m4.6 4.1 15 16"/></svg><span id="music-label" class="sr-only"></span><span class="music-on-dot" aria-hidden="true"></span></button><button id="sound" class="quiet-control sound-control" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5.5 5.7 9H3.5v6h2.2l4.3 3.5Z"/><path class="sound-waves" d="M13.5 8.5a5 5 0 0 1 0 7M16 5.8a8.6 8.6 0 0 1 0 12.4"/><path class="sound-muted-mark" d="m13.5 9 6 6m0-6-6 6"/></svg></button><details class="credits"><summary aria-label="About this little world">ⓘ</summary><div><p>LDraw Parts Library · <a href="https://www.ldraw.org/" target="_blank" rel="noreferrer">LDraw.org</a></p><p>Geometry transformed and triangulated. Original authors and licenses:</p><a href="/ldraw-source/CAreadme.txt" target="_blank">CC BY license information</a><p>Original part sources and author credits are included with this project.</p><p>Music: Built With Love · Treblo · original instrumental.</p></div></details></div><section class="intro"><p class="eyebrow"><span class="couple-names">${anniversary.names.join(' &amp; ')}</span><span class="dedication-dot">·</span><span class="dedication">${anniversary.dedication}</span></p><h1 id="title"></h1><p id="subtitle"></p><div class="assembly-modes" id="assembly-modes"><button id="mode-free" aria-pressed="true"></button><button id="mode-guided" aria-pressed="false"></button></div></section><div class="counter" id="counter">00 <small>/ 12</small></div><div class="label" id="name-0">DJ</div><div class="label" id="name-1">YW</div><div class="bottom"><div class="instruction" id="status" role="status" aria-live="polite"></div><div class="tools" id="tools"></div><p id="navigation-tip" class="navigation-tip"></p></div><div id="loading"><div class="spinner"></div><span id="loading-label"></span></div></main>`;
const $ = <E extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as E;
const status = (message: string) => { $('status').textContent = message; };
const SCALE = .035;
const WORLD = { width: 28, depth: 20, wanderX: 11.5, wanderZ: 8 };
const playCamera = () => camera.aspect < .85 ? new T.Vector3(20, 28, 58) : new T.Vector3(14, 20, 35);
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
function part(id: string,color:string){const group=new T.Group();for(const [code,geo] of Object.entries(geometries.get(id)!)){const material=new T.MeshStandardMaterial({color:code==='16'?color:code==='0'?'#201c18':code==='14'?'#f2c638':color,roughness:.32,metalness:0,side:T.DoubleSide});const mesh=new T.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}return group;}
type Figure={root:T.Group,parts:Record<SlotId,T.Group>,legPivots:T.Group[],x:number,z:number,heading:number,target:T.Vector2,pause:number,speed:number,decision:number,look:number,phase:number};
const figures:Figure[]=[];
function makeFigure(i:number):Figure{
 const def=characters[i];const root=new T.Group();root.position.set(i===0?-2:2,72*SCALE,0);scene.add(root);
 const parts={} as Record<SlotId,T.Group>;for(const slot of slots){parts[slot.id]=new T.Group();root.add(parts[slot.id]);parts[slot.id].visible=false;}
 parts.torso.add(part('973',def.torso));
 parts.legs.position.copy(pos(0,32,0));parts.legs.add(part('3815',def.legs));
 const legPivots:T.Group[]=[];
 for(const [id,x] of [['3816',-10],['3817',10]] as const){const pivot=new T.Group();pivot.position.copy(pos(x,12,0));const m=part(id,def.legs);m.position.copy(pos(-x,0,0));pivot.add(m);parts.legs.add(pivot);legPivots.push(pivot);}
 for(const [key,id,x] of [['rightArm','3818',-15.552],['leftArm','3819',15.552]] as const){const arm=parts[key];arm.position.copy(pos(x,9,0));arm.rotation.z=(key==='rightArm'?-1:1)*T.MathUtils.degToRad(9.782);arm.add(part(id,def.torso));const hand=part('3820','#f2cb42');hand.position.copy(pos(key==='rightArm'?-5:5,20,-10));hand.rotation.x=Math.PI/4;arm.add(hand);}
 parts.head.position.copy(pos(0,-24,0));parts.head.add(part('3626cp01','#f2cb42'));
 parts.hair.position.copy(pos(0,-24,0));parts.hair.add(part(def.hairPart,def.hair));
 return {root,parts,legPivots,x:root.position.x,z:0,heading:0,target:new T.Vector2(root.position.x,0),pause:.4+Math.random()*2,speed:.8,decision:2,look:0,phase:Math.random()*10};
}
let count=0;let mode:'build'|'ready'|'awakening'|'play'='build';let activity:'wander'|'wave'|'hug'|'dance'='wander';let activityTime=0;let elapsed=0;let transitionTime=0;let automatic=false;
let hintsOn=localStorage.getItem('little-world-hints')!=='off';
const music=new AnniversaryMusic();
const sounds=new SoundEffects();
document.addEventListener('pointerdown',()=>sounds.unlock(),{capture:true,passive:true});
document.addEventListener('keydown',()=>sounds.unlock(),{capture:true});
$('sound').onclick=()=>{sounds.toggle();renderCopy();};
let assemblyMode:'free'|'guided'='free';
let freeAssembly:FreeAssembly|undefined;
const buildCamera=()=>{if(assemblyMode==='guided')return new T.Vector3(8,10,camera.aspect<.85?24:17);const distance=Math.max(43,17/(Math.tan(T.MathUtils.degToRad(camera.fov/2))*camera.aspect));return new T.Vector3(.12,.85,1).normalize().multiplyScalar(distance);};
function setBuildView(){camera.position.copy(buildCamera());controls.target.set(0,1,0);controls.enabled=true;controls.enablePan=true;controls.enableZoom=true;controls.enableRotate=true;controls.mouseButtons.LEFT=T.MOUSE.ROTATE;controls.mouseButtons.RIGHT=T.MOUSE.PAN;controls.touches.ONE=T.TOUCH.ROTATE;controls.touches.TWO=T.TOUCH.DOLLY_PAN;pauseOrbitForPiece();controls.enabled=true;}
function pauseOrbitForPiece(){
 const position=camera.position.clone(),target=controls.target.clone();
 controls.enableDamping=false;controls.update();
 camera.position.copy(position);controls.target.copy(target);controls.enableDamping=true;controls.update();controls.enabled=false;
}

let tray:T.Group|undefined;let ghost:T.Group|undefined;let dragging=false;let dragOffset=new T.Vector3();let dragPlane=new T.Plane();let trayHome=new T.Vector3();
const pointer=new T.Vector2(),ray=new T.Raycaster();
$('music').onclick=async()=>{try{await music.toggle();renderCopy();}catch{status(t('音乐暂时无法播放，请再点一次。','Music could not start. Please try again.'));}};
$('language').onclick=()=>{setLanguage(getLanguage()==='zh'?'en':'zh');renderCopy();if(mode==='build'){if(assemblyMode==='free'){freeTools();if(freeAssembly?.selected)freeAssembly.describe(freeAssembly.selected);else status('');}else guidedStatus();}else if(mode==='play'){playTools();activityStatus();}else if(mode==='ready')readyTools();};
function renderCopy(){
 $('sound').setAttribute('aria-pressed',String(sounds.enabled));$('sound').setAttribute('aria-label',sounds.enabled?t('关闭音效','Mute sound effects'):t('打开音效','Enable sound effects'));$('sound').title=sounds.enabled?t('音效开 · 点击关闭','Sound effects on · Click to mute'):t('音效关 · 点击打开','Sound effects off · Click to enable');
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
 $('hint-toggle')?.setAttribute('aria-pressed',String(hintsOn));
 if($('hint-toggle'))$('hint-toggle').textContent=hintsOn?t('提示开','Hints on'):t('提示关','Hints off');
 if($('hint-toggle'))$('hint-toggle').title=t('拾起零件时，高亮对应部位','Highlight the matching part while holding a piece');
 if(freeAssembly)freeAssembly.hintsEnabled=hintsOn;
}
function activityStatus(){status(activity==='wander'?t('',''):activity==='wave'?t('嘿，我在这里。','Hey, here I am.'):activity==='hug'?t('世界那么大，还好有你。','A big world. My favourite place is with you.'):t('和你，连平常的一天都值得庆祝。','Even an ordinary day is worth a dance with you.'));}

function disposeClone(group:T.Group|undefined){if(!group)return;scene.remove(group);group.traverse(obj=>{if(obj instanceof T.Mesh){const mats=Array.isArray(obj.material)?obj.material:[obj.material];for(const mat of mats)mat.dispose();}});}
function cloneIndependent(source:T.Group){const clone=source.clone(true);clone.visible=true;clone.traverse(o=>{if(o instanceof T.Mesh){o.material=(o.material as T.Material).clone();}});return clone;}
function freeTools(){
 $('tools').innerHTML=`<button id="hint-toggle" aria-pressed="${hintsOn}"></button><button id="hint" class="hint-helper">${t('下一块提示','A little hint')}</button><button id="connect" class="hint-helper">${t('装上这一块 ↵','Place this piece ↵')}</button><button id="scatter">${t('再散开一次','Scatter again')}</button>`;
 $('hint-toggle').onclick=()=>{hintsOn=!hintsOn;localStorage.setItem('little-world-hints',hintsOn?'on':'off');renderCopy();status('');};
 $('hint').onclick=()=>{freeAssembly?.hint();refreshFreeButton();};
 $('connect').onclick=()=>{const p=freeAssembly?.selected;if(p&&freeAssembly?.eligible(p))freeAssembly.connect(p);};
 $('scatter').onclick=()=>{freeAssembly?.scatter();status('');};
 renderCopy();refreshFreeButton();
}
function refreshFreeButton(){const button=$<HTMLButtonElement>('connect');if(button)button.disabled=!freeAssembly?.selected||!freeAssembly.eligible(freeAssembly.selected);}
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
 ghost=cloneIndependent(source);source.getWorldPosition(ghost.position);source.getWorldQuaternion(ghost.quaternion);ghost.traverse(obj=>{if(obj instanceof T.Mesh){obj.material=new T.MeshStandardMaterial({color:i===0?'#64869d':'#9a7058',transparent:true,opacity:.2,depthWrite:false,side:T.DoubleSide});obj.castShadow=false;}});scene.add(ghost);
 tray=cloneIndependent(source);tray.position.set(0,1.25,2.9);tray.rotation.set(0,-.15,0);scene.add(tray);trayHome.copy(tray.position);
 guidedStatus();
 $('tools').innerHTML=`<button class="primary" id="attach">${t('装上这一块 ↵','Place this piece ↵')}</button><button id="auto">${t('自动拼装','Build for me')}</button>`;renderCopy();
 $('attach').onclick=attach;$('auto').onclick=()=>{automatic=true;autoBuild();};
}
let autoTimer:ReturnType<typeof setTimeout>|undefined;
function autoBuild(){if(!automatic||mode!=='build')return;attach();autoTimer=setTimeout(autoBuild,350);}
function attach(){if(mode!=='build'||assemblyMode==='free'||count>=12)return;figures[Math.floor(count/6)].parts[slots[count%6].id].visible=true;count++;sounds.play('snap');showNext();}
function reset(){freeAssembly?.destroy();freeAssembly=undefined;disposeClone(tray);disposeClone(ghost);tray=undefined;ghost=undefined;$('assembly-modes').hidden=false;for(const k of ['free','guided'])$('mode-'+k).setAttribute('aria-pressed',String(k===assemblyMode));automatic=false;if(autoTimer)clearTimeout(autoTimer);dragging=false;mode='build';activity='wander';activityTime=0;hugHold=0;count=0;transitionTime=0;controls.enableRotate=false;controls.enableZoom=false;controls.target.set(0,1,0);for(let i=0;i<2;i++){const f=figures[i];f.root.position.set(i===0?-2:2,72*SCALE,0);f.root.rotation.set(0,0,0);f.x=f.root.position.x;f.z=0;f.heading=0;f.target.set(f.x,0);f.pause=.4+Math.random()*2;f.decision=1+Math.random()*3;f.phase=Math.random()*10;Object.values(f.parts).forEach(p=>p.visible=false);pose(f,0,0);}setSteps('build');setBuildView();showNext();renderCopy();}
function setSteps(_step:string){/* The gift has no product navigation header. */}
function guidedStatus(){const i=Math.floor(count/6),slot=slots[count%6];if(!slot)return;const names=slotNames[slot.id];status(`${person(i)} · ${t(names[0],names[1])}`);if($('attach'))$('attach').textContent=t('装上这一块 ↵','Place this piece ↵');if($('auto'))$('auto').textContent=t('自动拼装','Build for me');}
function readyTools(){status('');$('tools').innerHTML=`<button class="primary" id="life">${t('让我们的小世界动起来','Bring our world to life')}</button><button id="reset">${t('再拼一次','Build again')}</button>`;$('life').onclick=awaken;$('reset').onclick=reset;}
function awaken(){if(mode!=='ready')return;awakeningFrom.copy(camera.position);awakeningTarget.copy(controls.target);controls.enabled=false;controls.enableDamping=false;mode='awakening';$('assembly-modes').hidden=true;transitionTime=0;$('tools').innerHTML='';status('');renderCopy();sounds.play('awaken');}
const actionIcon=(name:'wave'|'hug'|'dance'|'reset')=>{
 const paths={
  wave:'<path d="m8 12-1.4-4.5a1.3 1.3 0 0 1 2.5-.7L10.3 11 9.5 4.9a1.3 1.3 0 0 1 2.6-.3l.7 6.1.1-7a1.3 1.3 0 0 1 2.6 0l-.1 7.2 1.1-4.5a1.3 1.3 0 0 1 2.5.6l-1.6 7.6c-.7 3.2-2.4 5-5.4 5-2.2 0-3.5-1.1-4.6-2.8l-2.7-4.1a1.4 1.4 0 0 1 2.1-1.8L9 13.1"/><path d="M3 5.3 2 3m18 14.7 1.5 1.6"/>',
  hug:'<path d="M12 20S3.5 14.7 3.5 8.5A4.5 4.5 0 0 1 12 6.4a4.5 4.5 0 0 1 8.5 2.1C20.5 14.7 12 20 12 20Z"/>',
  dance:'<path d="M9 17.5V6.2l10-2v11.2M9 9l10-2"/><ellipse cx="6.5" cy="17.5" rx="2.5" ry="1.9" transform="rotate(-15 6.5 17.5)"/><ellipse cx="16.5" cy="15.5" rx="2.5" ry="1.9" transform="rotate(-15 16.5 15.5)"/>',
  reset:'<path d="M5 8a7.2 7.2 0 1 1-.4 7.1M5 3.7V8h4.3"/>'
 };
 return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
};
function playTools(){
 $('tools').innerHTML=`<button class="action" id="wave" aria-pressed="${activity==='wave'}">${actionIcon('wave')}<span>${t('打个招呼','Say hello')}</span></button><button class="action" id="hug" aria-pressed="${activity==='hug'}">${actionIcon('hug')}<span>${t('抱抱','A hug')}</span></button><button class="action" id="dance" aria-pressed="${activity==='dance'}">${actionIcon('dance')}<span>${t('一起跳舞','A little dance')}</span></button><button class="rebuild" id="reset">${actionIcon('reset')}<span>${t('再拼一次','Build again')}</span></button>`;
 for(const a of ['wave','hug','dance'] as const){$(a).onclick=()=>startActivity(a);$<HTMLButtonElement>(a).disabled=activity!=='wander';}$('reset').onclick=reset;renderCopy();
}
function startActivity(a:'wave'|'hug'|'dance'){if(mode!=='play'||activity!=='wander')return;activity=a;activityTime=0;hugHold=0;if(a!=='hug')sounds.play(a);activityStatus();for(const id of ['wave','hug','dance']){$<HTMLButtonElement>(id).disabled=true;$(id).setAttribute('aria-pressed',String(id===a));}}
function finishActivity(){activity='wander';activityTime=0;for(const f of figures){f.pause=.4+Math.random()*2;f.decision=.5+Math.random()*3;f.target.set(f.x,f.z);}activityStatus();for(const id of ['wave','hug','dance']){$<HTMLButtonElement>(id).disabled=false;$(id).setAttribute('aria-pressed','false');}}
function pose(f:Figure,walk:number,t:number){f.legPivots[0].rotation.x=Math.sin(t*8)*.42*walk;f.legPivots[1].rotation.x=-Math.sin(t*8)*.42*walk;f.parts.rightArm.rotation.x=-Math.sin(t*8)*.3*walk;f.parts.leftArm.rotation.x=Math.sin(t*8)*.3*walk;f.parts.head.rotation.y=Math.sin(t*.9)*.09;f.parts.hair.rotation.y=f.parts.head.rotation.y;f.root.rotation.z=0;}
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
   if(f.pause>0){f.pause-=dt;f.heading=T.MathUtils.damp(f.heading,f.look,2,dt);f.parts.head.rotation.y=Math.sin(elapsed*1.3+f.phase)*.25;f.parts.hair.rotation.y=f.parts.head.rotation.y;continue;}
   let distance=Math.hypot(f.target.x-f.x,f.target.y-f.z);
   if(distance<.15||f.decision<=0){chooseWander(f);continue;}
   const next=new T.Vector2(f.target.x-f.x,f.target.y-f.z).normalize();
   const away=new T.Vector2(f.x-other.x,f.z-other.z),separation=away.length();
   if(separation<2.1){
    if(separation<.001)away.set(i===0?-1:1,.3);
    away.normalize();
    const lateral=new T.Vector2(-away.y,away.x).multiplyScalar(i===0?.8:-.8);
    next.addScaledVector(away,(2.1-separation)*2.5).add(lateral).normalize();
   }
   const step=Math.min(distance,f.speed*dt);
   const x=T.MathUtils.clamp(f.x+next.x*step,-WORLD.wanderX,WORLD.wanderX),z=T.MathUtils.clamp(f.z+next.y*step,-WORLD.wanderZ,WORLD.wanderZ);
   moveTo(f,x,z,dt,f.speed);pose(f,1,elapsed*f.speed+f.phase);
  }
 }else{
  activityTime+=dt;const t=activityTime;
  if(activity==='wave'){for(const f of figures){f.heading=T.MathUtils.damp(f.heading,.3,4,dt);f.parts.rightArm.rotation.x=-2.4+Math.sin(t*10)*.25;}if(t>3.2)finishActivity();}
  if(activity==='dance'){for(let i=0;i<2;i++){const f=figures[i];f.heading+=dt*1.2;pose(f,.6,elapsed*1.6);f.parts.rightArm.rotation.x=-1.3+Math.sin(t*5+i)*.6;f.parts.leftArm.rotation.x=-1.3-Math.sin(t*5+i)*.6;f.root.rotation.z=Math.sin(t*5)*.09;}if(t>6)finishActivity();}
  if(activity==='hug'){
   const reached=figures.every((f,i)=>Math.hypot(f.x-(i===0?-.58:.58),f.z)<.09);
   if(!reached&&hugHold===0){for(let i=0;i<2;i++){const f=figures[i];moveTo(f,i===0?-.58:.58,0,dt,1.5);pose(f,1,elapsed*1.3);}}
   else{if(hugHold===0)sounds.play('hug');hugHold+=dt;for(let i=0;i<2;i++){const f=figures[i];f.heading=T.MathUtils.damp(f.heading,i===0?Math.PI/2:-Math.PI/2,8,dt);const lift=Math.min(1,hugHold*2);f.parts.rightArm.rotation.x=-1.5*lift;f.parts.leftArm.rotation.x=-1.5*lift;}if(hugHold>2.8){for(let i=0;i<2;i++)moveTo(figures[i],i===0?-1.5:1.5,0,dt,1);if(hugHold>4){hugHold=0;finishActivity();}}}
  }
 }
 for(const f of figures){f.root.position.set(f.x,72*SCALE+(activity==='dance'?Math.abs(Math.sin(activityTime*5))*.14:0),f.z);f.root.rotation.y=f.heading;}
}
let hugHold=0;
const awakeningFrom=new T.Vector3(),awakeningTarget=new T.Vector3();
function pointerFrom(e:PointerEvent){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);}
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0)return;if(mode==='build'&&assemblyMode==='free'&&freeAssembly){pointerFrom(e);const p=freeAssembly.pick(ray);if(p){dragging=true;pauseOrbitForPiece();pointerFrom(e);freeAssembly.begin(p,ray);renderer.domElement.setPointerCapture(e.pointerId);refreshFreeButton();}return;}if(mode!=='build'||!tray||automatic)return;pointerFrom(e);if(!ray.intersectObject(tray,true).length)return;dragging=true;pauseOrbitForPiece();pointerFrom(e);renderer.domElement.setPointerCapture(e.pointerId);const normal=camera.getWorldDirection(new T.Vector3());dragPlane.setFromNormalAndCoplanarPoint(normal,tray.position);const hit=new T.Vector3();ray.ray.intersectPlane(dragPlane,hit);dragOffset.copy(tray.position).sub(hit);renderer.domElement.style.cursor='grabbing';},{capture:true});
renderer.domElement.addEventListener('pointermove',e=>{if(assemblyMode==='free'&&mode==='build'&&freeAssembly){pointerFrom(e);if(dragging)freeAssembly.drag(ray);else renderer.domElement.style.cursor=freeAssembly.pick(ray)?'grab':'default';return;}if(!dragging||!tray)return;pointerFrom(e);const hit=new T.Vector3();if(ray.ray.intersectPlane(dragPlane,hit))tray.position.copy(hit.add(dragOffset));});
function release(e:PointerEvent,cancel=false){if(assemblyMode==='free'&&mode==='build'&&freeAssembly){if(dragging){dragging=false;controls.enabled=true;if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);freeAssembly.end(cancel);refreshFreeButton();}return;}if(!dragging||!tray||!ghost)return;dragging=false;controls.enabled=true;renderer.domElement.style.cursor='grab';if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);const a=tray.position.clone().project(camera),b=ghost.position.clone().project(camera);const r=renderer.domElement.getBoundingClientRect();const distance=Math.hypot((a.x-b.x)*r.width/2,(a.y-b.y)*r.height/2);if(!cancel&&distance<85)attach();else{tray.position.copy(trayHome);if(!cancel)status(t('再靠近一点点。','A little closer.'));}}
renderer.domElement.addEventListener('pointerup',e=>release(e));renderer.domElement.addEventListener('pointercancel',e=>release(e,true));
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&mode==='build'&&(e.target===document.body||e.target===renderer.domElement)){e.preventDefault();if(assemblyMode==='guided')attach();else{const p=freeAssembly?.selected;if(p&&freeAssembly?.eligible(p))freeAssembly.connect(p);}}});
function resize(){const r=$('scene').getBoundingClientRect();camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height);if(mode==='build'||mode==='ready')setBuildView();}
window.addEventListener('resize',resize);resize();
const clock=new T.Clock();
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;
 if(mode==='build'||mode==='ready'){if(tray&&!dragging)tray.rotation.y=-.15+Math.sin(elapsed*.8)*.12;}
 if(mode==='build')freeAssembly?.update(dt);
 if(mode==='awakening'){transitionTime+=dt;const k=Math.min(1,transitionTime/2.2),e=1-Math.pow(1-k,3);const end=playCamera();camera.position.copy(awakeningFrom).lerp(end,e);controls.target.copy(awakeningTarget).lerp(new T.Vector3(0,1,0),e);figures.forEach((f,i)=>{f.parts.head.rotation.y=Math.sin(transitionTime*3+i)*.2;f.parts.hair.rotation.y=f.parts.head.rotation.y;f.parts.rightArm.rotation.x=-Math.sin(Math.min(transitionTime/2.2,1)*Math.PI)*.8;});if(k===1){mode='play';controls.enabled=true;controls.enableDamping=true;controls.enableRotate=true;controls.enableZoom=true;controls.enablePan=true;controls.mouseButtons.LEFT=T.MOUSE.ROTATE;controls.touches.ONE=T.TOUCH.ROTATE;activityStatus();playTools();renderCopy();}}
 if(mode==='play')updateCharacters(dt);
 controls.update();
 for(let i=0;i<2;i++){if(!figures[i])continue;const p=figures[i].root.position.clone();p.y=0;p.z+=.9;p.project(camera);const r=$('scene').getBoundingClientRect();const label=$('name-'+i);label.style.left=`${(p.x*.5+.5)*r.width}px`;label.style.top=`${(-p.y*.5+.5)*r.height}px`;}
 renderer.render(scene,camera);
}
async function boot(){try{await Promise.all(partIds.map(async id=>{const response=await fetch(`/models/${id}.json`);if(!response.ok)throw Error(`零件 ${id} 加载失败`);const data=await response.json() as Record<string,number[]>;const groups:Record<string,T.BufferGeometry>={};for(const [code,vertices] of Object.entries(data)){const transformed=vertices.map((v,i)=>v*SCALE*(i%3===0?1:-1));const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(transformed,3));geo.computeVertexNormals();groups[code]=geo;}geometries.set(id,groups);}));figures.push(makeFigure(0),makeFigure(1));$('loading').hidden=true;showNext();frame();}catch(error){$('loading').innerHTML=`<p>${t('零件还没准备好。','The pieces are not ready yet.')}</p><button id="retry">${t('再试一次','Try again')}</button>`;status(String(error));$('retry').onclick=()=>location.reload();console.error(error);}}
// Read-only inspection for local browser QA; eliminated from production builds.
if(import.meta.env.DEV)Object.defineProperty(window,'__brickWorld',{get:()=>{
 const project=(v:T.Vector3)=>{const r=renderer.domElement.getBoundingClientRect();const p=v.clone().project(camera);return {x:r.left+(p.x*.5+.5)*r.width,y:r.top+(-p.y*.5+.5)*r.height};};
 return {mode,assemblyMode,count,activity,hintsOn,language:getLanguage(),sounds:sounds.snapshot,guided:tray&&ghost?{piece:project(tray.position),target:project(ghost.position)}:null,camera:{position:camera.position.toArray(),target:controls.target.toArray(),azimuth:controls.getAzimuthalAngle(),polar:controls.getPolarAngle()},music:{enabled:music.enabled,paused:music.audio.paused,time:music.audio.currentTime,source:music.audio.currentSrc},world:WORLD,figures:figures.map(f=>({x:f.x,z:f.z,speed:f.speed,pause:f.pause,heading:f.heading,target:[f.target.x,f.target.y]})),pieces:freeAssembly?.pieces.map(p=>({character:p.character,slot:p.slot,attached:p.attached,held:p===freeAssembly?.holding,hintVisible:p.ghost.visible,highlighted:Boolean(p.ghost.userData.highlighted),eligible:freeAssembly!.eligible(p),position:p.visual.position.toArray(),velocity:p.body.velocity.toArray(),screen:project(p.visual.position),target:project(freeAssembly!.target(p))}))??[]};
}});
renderCopy();
void boot();
