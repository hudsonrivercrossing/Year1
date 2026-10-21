async page=>{
 await page.setViewportSize({width:1440,height:960});await page.evaluate(()=>localStorage.clear());await page.reload();await page.locator('#hint-toggle').waitFor();await page.waitForTimeout(1200);
 const read=()=>page.evaluate(()=>window.__brickWorld);
 let state=await read();if(state.pieces.some(p=>!p.hintVisible||p.highlighted))throw Error('Resting silhouettes should be visible and unhighlighted');
 const grab=async()=>{
  for(const offset of [{x:0,y:0},{x:4,y:0},{x:-4,y:0},{x:0,y:4},{x:0,y:-4}]){
   const p=(await read()).pieces.find(p=>p.character===0&&p.slot==='legs');await page.mouse.move(p.screen.x+offset.x,p.screen.y+offset.y);await page.mouse.down();await page.waitForTimeout(100);
   if((await read()).pieces.some(p=>p.held))return;
   await page.mouse.up();
  }
  throw Error('Could not grab a real piece');
 };
 await grab();state=await read();
 if(state.pieces.filter(p=>p.highlighted).length!==1||!state.pieces.find(p=>p.held).highlighted)throw Error('Only held target should highlight');
 await page.screenshot({path:'output/playwright/hints-on-held.png'});await page.mouse.up();await page.waitForTimeout(200);
 if((await read()).pieces.some(p=>p.highlighted))throw Error('Highlight remains after release');
 await page.locator('#hint-toggle').click();await page.waitForTimeout(150);state=await read();
 if(state.hintsOn||state.pieces.some(p=>!p.hintVisible))throw Error('Hints off hid a silhouette');
 if(!await page.locator('#hint').isVisible()||!await page.locator('#connect').isVisible())throw Error('Switch changed unrelated controls');
 await grab();state=await read();if(state.pieces.some(p=>p.highlighted)||state.pieces.some(p=>!p.hintVisible))throw Error('Hints off highlighted or hid anchors');
 await page.screenshot({path:'output/playwright/hints-off-held.png'});await page.mouse.up();
 await page.locator('#language').click();await page.evaluate(()=>document.fonts.ready);
 const fonts=await page.evaluate(()=>Array.from(document.fonts).map(f=>({family:f.family,status:f.status})));
 if(!fonts.some(f=>f.family==='Anniversary Latin'&&f.status==='loaded'))throw Error('Local Baskervville font not loaded');
 if(await page.locator('#language svg').count()!==1||await page.locator('#music svg').count()!==1)throw Error('Icons missing');
 await page.locator('#music').click();await page.waitForFunction(()=>window.__brickWorld.music.enabled&&window.__brickWorld.music.time>.4,{timeout:10000});
 state=await read();if(!state.music.source.includes('built-with-love.mp3'))throw Error('Wrong music version');
 await page.locator('#language').click();if(!(await read()).music.enabled)throw Error('Switching language stopped music');
 await page.locator('#music').click();await page.waitForFunction(()=>window.__brickWorld.music.paused,{timeout:4000});
 await page.locator('#language').click();await page.screenshot({path:'output/playwright/lettering-final-en.png'});
 await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('#hint-toggle').waitFor();await page.waitForTimeout(1400);await page.evaluate(()=>document.fonts.ready);
 if((await read()).pieces.some(p=>!p.hintVisible))throw Error('Mobile hints off hid silhouettes');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 await page.screenshot({path:'output/playwright/lettering-final-mobile.png'});
 return {passed:true,checks:['permanent silhouettes','highlight only held part','off disables only highlight','local matching font loaded','icons','new soundtrack playback/pause','language preserves music','mobile']};
}
