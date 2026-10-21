async page=>{
 const result=await page.evaluate(async()=>{
  const {scheduleCue}=await import('/src/sound-effects.ts'),out=[];
  for(const cue of ['holdHands','highFive','look']){
   const ctx=new OfflineAudioContext(1,96000,48000),gain=ctx.createGain();gain.gain.value=.28;gain.connect(ctx.destination);scheduleCue(ctx,gain,cue,.04);const buffer=await ctx.startRendering(),a=buffer.getChannelData(0);let peak=0,tail=0;for(let i=0;i<a.length;i++){peak=Math.max(peak,Math.abs(a[i]));if(i>62400)tail=Math.max(tail,Math.abs(a[i]));}out.push({cue,peak,tail});
  }
  return out;
 });
 for(const r of result)if(!(r.peak>0&&r.peak<.035&&r.tail===0))throw Error('Cue level/tail '+JSON.stringify(r));
 const read=()=>page.evaluate(()=>window.__brickWorld);const initial=await read();if(initial.music.enabled)await page.locator('#music').click();if(!initial.sounds.enabled)await page.locator('#sound').click();await page.locator('#music').click();await page.waitForFunction(()=>window.__brickWorld.music.enabled&&!window.__brickWorld.music.paused);await page.locator('#sound').click();let s=await read();if(s.sounds.enabled||!s.music.enabled||s.music.paused)throw Error('Sound mute stopped music');await page.locator('#sound').click();await page.locator('#music').click();s=await read();if(!s.sounds.enabled||s.music.enabled)throw Error('Audio toggles coupled');return {passed:true,rendered:result,independentToggles:true};
}
