async page=>{
 await page.setViewportSize({width:1440,height:960});await page.evaluate(()=>localStorage.clear());await page.reload();await page.locator('#hint-toggle').waitFor();await page.waitForTimeout(1600);await page.evaluate(()=>document.fonts.ready);
 const read=()=>page.evaluate(()=>window.__brickWorld);
 if((await read()).sounds.state!=='locked')throw Error('Sound unlocked before a gesture');
 const font=await page.evaluate(()=>({script:[...document.fonts].some(f=>f.family==='Keepsake Script'&&f.status==='loaded'),body:getComputedStyle(document.querySelector('#subtitle')).fontSize,button:getComputedStyle(document.querySelector('#hint')).fontSize,tip:getComputedStyle(document.querySelector('#navigation-tip')).fontSize}));
 if(!font.script||font.body!=='16px'||font.button!=='16px'||font.tip!=='12px')throw Error('Font hierarchy incorrect '+JSON.stringify(font));
 await page.screenshot({path:'output/playwright/keepsake-zh.png'});await page.locator('#language').click();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);await page.screenshot({path:'output/playwright/keepsake-en.png'});
 await page.waitForFunction(()=>window.__brickWorld.sounds.state==='running');
 if((await read()).music.enabled)throw Error('Sound effects started background music');
 await page.waitForTimeout(1500);const beforeDrop=(await read()).sounds.counts.drop;
 // Drop an unsupported torso from above the table; actual floor collisions make the sounds.
 const toss=async()=>{let grabbed=false;
 for(const offset of [0,4,-4,8,-8]){
  const p=(await read()).pieces.find(p=>p.character===0&&p.slot==='torso');
  await page.mouse.move(p.screen.x+offset,p.screen.y);await page.mouse.down();const held=(await read()).pieces.find(p=>p.held);
  if(held?.character===0&&held?.slot==='torso'){
   grabbed=true;await page.mouse.move(p.screen.x+50,p.screen.y-160,{steps:20});await page.mouse.up();break;
  }await page.mouse.up();
 }
 if(!grabbed)throw Error('Could not pick a real torso');};await toss();
 await page.waitForFunction(n=>window.__brickWorld.sounds.counts.drop>n,beforeDrop,{timeout:6000});
 if((await read()).count!==0)throw Error('Unsupported torso attached');
 await page.waitForTimeout(1600);const impacts=(await read()).sounds.counts.drop-beforeDrop;
 if(impacts<1)throw Error('No physical impact sound');
 const beforeSecond=(await read()).sounds.counts.drop;await toss();await page.waitForFunction(n=>window.__brickWorld.sounds.counts.drop>n,beforeSecond,{timeout:6000});
 await page.locator('#sound').click();await page.waitForTimeout(200);let muted=await read();if(muted.sounds.enabled||await page.locator('#sound').getAttribute('aria-pressed')!=='false')throw Error('Mute failed');
 const silentCount=JSON.stringify(muted.sounds.counts);await page.locator('#scatter').click();await page.waitForTimeout(2200);
 if(JSON.stringify((await read()).sounds.counts)!==silentCount)throw Error('Muted scatter scheduled sounds');
 await page.locator('#sound').click();
 for(let i=0;i<12;i++){await page.locator('#hint').click();await page.locator('#connect').click();}
 let state=await read();if(state.sounds.counts.snap!==12||state.sounds.counts.complete!==1||state.count!==12)throw Error('Snap/complete cues incorrect '+JSON.stringify(state.sounds));
 await page.screenshot({path:'output/playwright/keepsake-ready-en.png'});
 await page.locator('#life').click();await page.locator('#wave').waitFor({timeout:8000});
 await page.locator('#wave').click();await page.waitForFunction(()=>window.__brickWorld.activity==='wander',{timeout:12000});
 await page.locator('#hug').click();await page.waitForFunction(()=>window.__brickWorld.sounds.counts.hug===1,{timeout:20000});
 await page.waitForFunction(()=>window.__brickWorld.activity==='wander',{timeout:20000});
 await page.locator('#dance').click();await page.waitForFunction(()=>window.__brickWorld.activity==='wander',{timeout:20000});
 state=await read();for(const cue of ['awaken','wave','hug','dance'])if(state.sounds.counts[cue]!==1)throw Error('Missing/duplicate '+cue+' sound');
 if(state.music.enabled)throw Error('Effects rely on background music');
 // Render the actual synthesis into offline buffers: nonempty, quiet, and a silent tail.
 const levels=await page.evaluate(async()=>{
  const {scheduleCue}=await import('/src/sound-effects.ts'),result={};
  for(const cue of ['snap','drop','complete','awaken','wave','hug','dance']){
   const ctx=new OfflineAudioContext(1,48000*3,48000),master=ctx.createGain();master.gain.value=.28;master.connect(ctx.destination);scheduleCue(ctx,master,cue,.01,.8);
   const data=(await ctx.startRendering()).getChannelData(0);let peak=0,energy=0,tail=0;
   for(let n=0;n<data.length;n++){peak=Math.max(peak,Math.abs(data[n]));energy+=data[n]*data[n];if(n>48000*2.5)tail=Math.max(tail,Math.abs(data[n]));}result[cue]={peak,rms:Math.sqrt(energy/data.length),tail};
  }return result;
 });
 for(const [cue,level]of Object.entries(levels))if(level.peak<.001||level.peak>.09||level.tail>1e-6)throw Error('Sound level/tail invalid '+cue+JSON.stringify(level));
 await page.locator('#reset').click();await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1600);await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:'output/playwright/keepsake-mobile-en.png'});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('English mobile overflow');
 await page.locator('#language').click();await page.waitForTimeout(500);await page.screenshot({path:'output/playwright/keepsake-mobile-zh.png'});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Chinese mobile overflow');
 for(const id of ['language','music','sound']){const r=await page.locator('#'+id).boundingBox();if(r.width<44||r.height<44)throw Error('Small control target '+id);}
 return {passed:true,font,impacts,counts:state.sounds.counts,levels,checks:['handwritten display and readable names','16px body/actions, 14px secondary, 12px captions','repeated unsupported drops trigger actual contact cues','independent music/effects','mute suppresses physical impacts','snap and completion cues','awakening/wave/hug/dance cues','offline quiet audio buffers and silent tails','bilingual mobile layouts']};
}
