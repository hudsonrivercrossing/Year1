async page=>{
 const errors=[],failed=[],requests=[];
 const assert=(value,message)=>{if(!value)throw Error(message);};
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()});});
 const origin=new URL(page.url()).origin;
 page.on('request',r=>{const u=new URL(r.url());if(u.origin===origin)requests.push(u.pathname);});
 await page.addInitScript(()=>{
  window.Audio=new Proxy(window.Audio,{construct(Target,args){const audio=Reflect.construct(Target,args);window.__year1TestAudio=audio;return audio;}});
 });
 await page.setViewportSize({width:390,height:844});await page.reload();
 await page.locator('#mode-guided').waitFor();await page.waitForFunction(()=>document.querySelector('#loading').hidden);
 assert(!await page.evaluate(()=>'__brickWorld'in window),'Development snapshot exposed');
 const audio=await page.evaluate(()=>{const a=window.__year1TestAudio;return{src:a.src,paused:a.paused,loop:a.loop};});
 assert(new URL(audio.src).pathname==='/Year1/audio/little-days.mp3'&&audio.paused&&audio.loop,'Audio path, loop or no-autoplay failed');
 for(const family of ['Anniversary WenKai','Anniversary Latin','Keepsake Script'])assert(await page.evaluate(async family=>(await document.fonts.load(`16px "${family}"`)).length>0,family),'Font failed '+family);
 await page.locator('.credits summary').click();
 for(const path of ['ldraw-source/CAreadme.txt','textures/README.md']){
  const link=page.locator(`.credits a[href$="${path}"]`);assert(new URL(await link.getAttribute('href'),page.url()).pathname==='/Year1/'+path,'Credit link lost base');
 }
 await page.locator('.credits summary').click();
 await page.locator('#music').click();await page.waitForTimeout(1500);
 const playing=await page.evaluate(()=>{const a=window.__year1TestAudio;return{paused:a.paused,time:a.currentTime,volume:a.volume};});assert(!playing.paused&&playing.time>0&&Math.abs(playing.volume-.14)<.001,'Music did not play quietly');
 await page.locator('#language').click();assert(!await page.evaluate(()=>window.__year1TestAudio.paused),'Language interrupted audio');
 const sound=await page.locator('#sound').getAttribute('aria-pressed');await page.locator('#sound').click();assert(await page.locator('#sound').getAttribute('aria-pressed')!==sound&&!await page.evaluate(()=>window.__year1TestAudio.paused),'Sound effects not independent');await page.locator('#sound').click();
 await page.locator('#music').click();await page.waitForTimeout(1300);assert(await page.evaluate(()=>window.__year1TestAudio.paused),'Music did not pause');
 await page.locator('#mode-guided').click();await page.locator('#auto').click();await page.locator('#life').waitFor({timeout:12000});await page.locator('#life').click();await page.locator('#moments').waitFor({timeout:8000});
 await page.locator('#moments summary').click();if(await page.locator('#surprises').getAttribute('aria-checked')==='true')await page.locator('#surprises').click();await page.keyboard.press('Escape');
 const layouts=[];
 for(const view of [{width:320,height:568},{width:390,height:667},{width:390,height:844},{width:430,height:932},{width:844,height:390},{width:1440,height:960}]){
  await page.setViewportSize(view);await page.waitForTimeout(200);
  for(const lang of ['zh','en']){
   if(await page.locator('html').getAttribute('lang')!==(lang==='zh'?'zh-CN':'en'))await page.locator('#language').click();
   const label=await page.locator('#moments summary').innerText();assert(lang==='zh'?label.includes('小小心动'):label.includes(view.width<=700||view.width<=1000&&view.height<=500?'Moments':'Little moments'),'Menu name changed '+label);
   await page.locator('#moments summary').click();
   for(const tab of ['affection','together','stories']){
    await page.locator('#library-tab-'+tab).click();const box=await page.locator('.moments-list').boundingBox();assert(box.x>=0&&box.x+box.width<=view.width+1&&box.y>=0&&box.y+box.height<=view.height,'Menu outside viewport '+JSON.stringify({view,lang,tab,box}));
   }
   await page.keyboard.press('Escape');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1),'Viewport overflow '+JSON.stringify({view,lang}));
   if(view.width===390&&view.height===844)await page.screenshot({path:`output/playwright/year1-pages-${lang}.png`});layouts.push({view,lang});
  }
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#moments summary').click();await page.locator('#library-tab-affection').click();await page.locator('#highFive').click();await page.locator('#stop').waitFor();await page.locator('#stop').click();await page.waitForFunction(()=>{const h=document.querySelector('#hug');return h&&!h.disabled;},null,{timeout:45000});
 await page.locator('#fit').click();await page.locator('#moments summary').click();await page.locator('#rebuild-menu').click();await page.locator('#mode-free').waitFor();assert(await page.locator('#auto').isVisible(),'Guided rebuild failed');await page.locator('#mode-free').click();await page.locator('#hint').waitFor();
 assert(requests.some(p=>p.startsWith('/Year1/models/'))&&requests.some(p=>p.startsWith('/Year1/textures/'))&&requests.some(p=>p.startsWith('/Year1/fonts/')),'Runtime assets not requested');
 assert(requests.every(p=>p.startsWith('/Year1/')),'Escaped base: '+requests.filter(p=>!p.startsWith('/Year1/')).join(','));
 assert(!errors.length&&!failed.length,JSON.stringify({errors,failed}));
 return{passed:true,url:page.url(),layouts,audio,playing,requests:[...new Set(requests)],errors,failed,checks:['model/texture/font/music base paths','credit links','no autoplay','quiet playback and fade','independent sound effects','bilingual toolbar and three-tab menu','phone/landscape/desktop layouts','cancel/recover/rebuild','no development global']};
}
