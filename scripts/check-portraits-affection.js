async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:1440,height:960});await page.evaluate(()=>localStorage.clear());await page.reload();await page.locator('#hint').waitFor();
 const read=()=>page.evaluate(()=>window.__brickWorld);
 const assert=(condition,message)=>{if(!condition)throw Error(message);};
 const after=async()=>{await page.waitForFunction(()=>window.__brickWorld.activity==='wander',{},{timeout:25000});const s=await read();assert(s.effects===0&&!s.encounter,'Transient encounter leaked');for(const f of s.figures){assert(Math.abs(f.head[0])+Math.abs(f.head[2])<.00001,'Head tilt did not reset');assert(Math.abs(f.arms[0][0])+Math.abs(f.arms[1][0])<.00001,'Arms did not reset');}return s;};
 const begin=async id=>{await page.locator('#moments summary').click();await page.locator('#'+id).click();};
 const gesture=async kind=>{await page.waitForFunction(k=>window.__brickWorld.activity===k&&window.__brickWorld.encounter==='gesture',kind,{timeout:25000});};
 const poseSynced=async()=>{const s=await read();for(const f of s.figures)assert(JSON.stringify(f.head)===JSON.stringify(f.hair)&&JSON.stringify(f.headPosition)===JSON.stringify(f.hairPosition),'Face/hair separated');};
 const initial=await read();assert(initial.pieces.length===12&&initial.pieces.every(p=>p.hintVisible),'Assembly silhouettes missing');
 assert(initial.portraits[0].head==='3626cp8y'&&initial.portraits[0].shirt==='973pb5102c01'&&initial.portraits[1].shirt==='973pb3541c01','Portrait mapping changed');
 const stripes=await page.evaluate(async()=>{const image=new Image();image.src='/textures/yw-stripes-front.png';await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const c=canvas.getContext('2d');c.drawImage(image,0,0);const v=c.getImageData(512,0,1,1024).data;let bands=0,previous=false;for(let i=0;i<1024;i++){const red=v[i*4]>v[i*4+1]*2&&v[i*4]>v[i*4+2]*2;if(red&&!previous)bands++;previous=red;}return bands;});assert(stripes===6,'YW shirt must have six thin red stripes');
 for(let i=0;i<12;i++){await page.locator('#hint').click();await page.locator('#connect').click();}
 await page.locator('#life').click();await page.locator('#wave').waitFor();await page.mouse.move(1200,450);await page.mouse.wheel(0,-1300);await page.waitForTimeout(700);
 const before=await read();await begin('kiss');
 // Sample real animation frames: no jump to a fixed origin, even at entry.
 const maxJump=await page.evaluate(()=>new Promise(resolve=>{let last=window.__brickWorld.figures,max=0,n=0;const tick=()=>{const now=window.__brickWorld.figures;now.forEach((f,i)=>max=Math.max(max,Math.hypot(f.x-last[i].x,f.z-last[i].z)));last=now;if(++n<45)requestAnimationFrame(tick);else resolve(max);};requestAnimationFrame(tick);}));assert(maxJump<.16,'Encounter teleported an actor');
 await gesture('kiss');const preContact=await read();assert(preContact.sounds.counts.kiss===before.sounds.counts.kiss,'Kiss cue played before its gesture');await page.waitForTimeout(850);await poseSynced();
 const contact=await read();assert(contact.sounds.counts.kiss===before.sounds.counts.kiss+1,'Kiss cue missing/repeated');assert(contact.effects===1,'Expected one small heart');
 await page.screenshot({path:'output/playwright/affection-kiss.png'});
 await page.locator('#language').click();assert((await read()).activity==='kiss','Language switch reset encounter');assert(await page.locator('#kiss').textContent()==='A cheek kiss','English action missing');
 await after();await begin('shy');await gesture('shy');await page.waitForTimeout(1000);await poseSynced();await page.screenshot({path:'output/playwright/affection-shy.png'});await after();
 // Queue uses the same scenes, with exactly one sound per actual encounter.
 const queueBefore=(await read()).sounds.counts;await begin('sweet');assert((await read()).queue.join(',')==='shy,hug','Combination queue is wrong');
 await gesture('kiss');await gesture('shy');assert((await read()).queue.join(',')==='hug','Shy not sequenced after kiss');await gesture('hug');assert((await read()).queue.length===0,'Hug not last');
 const combined=await after();for(const k of ['kiss','shy','hug'])assert(combined.sounds.counts[k]===queueBefore[k]+1,`Wrong ${k} combination cue count`);
 // Cancel on approach and during a gesture; the next encounter remains usable.
 const cancelledBefore=(await read()).sounds.counts.kiss;await begin('kiss');await page.waitForTimeout(100);await page.locator('#stop').click();await after();assert((await read()).sounds.counts.kiss===cancelledBefore,'Cancelled approach played a contact cue');
 await begin('shy');await gesture('shy');await page.waitForTimeout(1000);await page.locator('#stop').click();await after();
 // Existing actions still complete after new actions and cancellation.
 for(const id of ['wave','dance','hug']){await page.locator('#'+id).click();await after();}
 // Music and effects remain independent. Muting effects must silence new cues.
 await page.locator('#music').click();await page.locator('#sound').click();const muted=(await read()).sounds.counts.shy;await begin('shy');await gesture('shy');await page.waitForTimeout(800);assert((await read()).sounds.counts.shy===muted,'Muted shy cue sounded');assert((await read()).music.enabled,'Muting effects stopped music');await page.locator('#stop').click();await after();await page.locator('#music').click();await page.locator('#sound').click();
 // Both languages fit a phone, including the expanded menu.
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
 for(const language of ['en','zh']){
  if((await read()).language!==language)await page.locator('#language').click();await page.locator('#moments summary').click();await page.evaluate(()=>document.fonts.ready);
  const bounds=await page.locator('.moments-list').boundingBox();assert(bounds&&bounds.x>=0&&bounds.x+bounds.width<=390,'Action menu overflows mobile');assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'Mobile page overflows');
  await page.screenshot({path:`output/playwright/affection-mobile-${language}.png`});await page.locator('#moments summary').click();
 }
 // Full rebuild also cancels the combo, its cue/queue and its transient graphics.
 await begin('sweet');await gesture('kiss');await page.locator('#reset').click();const reset=await read();assert(reset.mode==='build'&&reset.count===0&&reset.effects===0&&!reset.sweet&&reset.queue.length===0,'Rebuild did not cancel encounter');assert(reset.pieces.length===12,'Rebuild lost printed parts');await poseSynced();
 assert(errors.length===0,'Browser errors: '+errors.join('; '));
 const soundLevels=await page.evaluate(async()=>{
  const {scheduleCue}=await import('/src/sound-effects.ts'),levels={};
  for(const cue of ['kiss','shy']){
   const ctx=new OfflineAudioContext(1,48000*3,48000),master=ctx.createGain();master.gain.value=.28;master.connect(ctx.destination);scheduleCue(ctx,master,cue,.01);
   const data=(await ctx.startRendering()).getChannelData(0);let peak=0,tail=0;
   for(let i=0;i<data.length;i++){peak=Math.max(peak,Math.abs(data[i]));if(i>48000*2.5)tail=Math.max(tail,Math.abs(data[i]));}levels[cue]={peak,tail};
  }return levels;
 });
 for(const [cue,level]of Object.entries(soundLevels))assert(level.peak>.001&&level.peak<.035&&level.tail<1e-6,'New cue level or tail invalid: '+cue);
 const report={passed:true,stripes,maxJump,soundLevels,portraits:initial.portraits,sounds:combined.sounds.counts,checks:['printed-part assembly','face/hair alignment','individual shy and cheek kiss','kiss -> shy -> hug','cancel approach/gesture','existing wave/dance/hug','bilingual mobile menu','independent music/sfx','rebuild cancellation'],errors};
 await page.evaluate(report=>localStorage.setItem('brick-world-qa-portrait-affection',JSON.stringify(report)),report);return report;
}
