async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>localStorage.setItem('little-world-sfx','off'));
 await page.reload();await page.waitForFunction(()=>window.__brickWorld?.pieces.length===12);
 const read=()=>page.evaluate(()=>window.__brickWorld);
 assert(await page.locator('#sound').count()===0,'Sound switch remains');
 await page.locator('#hint').click();await page.locator('#hint').click();
 let s=await read();assert(s.count===1&&s.sounds.enabled&&s.sounds.counts.snap===1,'Old mute preference disabled snap');
 assert(!s.music.enabled,'Music should start off');
 await page.locator('#mode-guided').click();
 for(const lang of ['zh','en']){
  if((await read()).language!==lang)await page.locator('#language').click();
  assert(await page.locator('#tools button').count()===1&&await page.locator('#auto').isVisible(),'Lazy mode has extra controls');
  assert(await page.locator('#auto').innerText()===(lang==='zh'?'自动拼装':'Build for me'),'Auto label not localized');
 }
 const before=(await read()).sounds.counts.snap;
 await page.locator('#auto').click();assert(await page.locator('#auto').isDisabled(),'Auto not disabled during build');
 await page.locator('#language').click();assert(await page.locator('#auto').isDisabled(),'Language reenabled running build');
 await page.locator('#life').waitFor({timeout:12000});s=await read();
 assert(s.count===12&&s.sounds.counts.snap===before+12,'Auto did not install exactly twelve pieces');
 assert(s.sounds.counts.complete===1&&s.sounds.enabled&&!s.music.enabled,'Independent always-on effects failed');
 await page.locator('#reset').click();assert(await page.locator('#auto').isEnabled(),'Rebuild left auto disabled');
 await page.locator('#mode-free').click();await page.locator('#hint').click();
 s=await read();const piece=s.pieces.find(p=>!p.attached&&p.slot==='legs'&&p.character===0);
 // Exercise the actual pointer drag path after retiring manual guided placement.
 await page.mouse.move(piece.screen.x,piece.screen.y);await page.mouse.down();assert((await read()).pieces.some(p=>p.held),'Pointer did not pick up a piece');await page.mouse.move(piece.screen.x+20,piece.screen.y-15,{steps:5});await page.mouse.up();
 assert(!(await read()).pieces.some(p=>p.held),'Pointer release left a held piece');
 assert(!errors.length,errors.join(';'));
 await page.screenshot({path:'output/playwright/simple-controls-phone.png'});
 return{passed:true,checks:['no sound switch','old mute ignored','free place and drag/release','one lazy auto control in both languages','disabled while building','exactly 12 automatic snaps','music independent','rebuild reset'],errors};
}
