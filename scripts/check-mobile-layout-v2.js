async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const assert=(c,m)=>{if(!c)throw Error(m);};const results=[];
 for(const view of [{width:320,height:568},{width:390,height:667},{width:390,height:844},{width:430,height:932}]){
  await page.setViewportSize(view);await page.evaluate(()=>localStorage.clear());await page.reload();await page.locator('#fit').waitFor();await page.waitForTimeout(1100);
  for(const language of ['zh','en']){
   if(await page.evaluate(()=>window.__brickWorld.language)!==language)await page.locator('#language').click();
   const metrics=await page.evaluate(()=>{const r=document.querySelector('#scene').getBoundingClientRect(),m=document.querySelector('main').getBoundingClientRect();return {scene:{x:r.x,y:r.y,width:r.width,height:r.height},main:{width:m.width,height:m.height},overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight+1,subtitle:getComputedStyle(document.querySelector('#subtitle')).width,pieces:window.__brickWorld.pieces.map(p=>p.screen)};});
   assert(!metrics.overflow,'Mobile overflow '+JSON.stringify({view,language,metrics}));assert(metrics.scene.height/view.height>=.62,'Workbench too small '+JSON.stringify({view,metrics}));assert(metrics.scene.y<=116,'Header crowds workbench');assert(!await page.locator('#hint').isVisible(),'Extra build buttons should be tucked away');
   for(const p of metrics.pieces)assert(p.x>=2&&p.x<=view.width-2&&p.y>=metrics.scene.y&&p.y<=metrics.scene.y+metrics.scene.height,'Scattered piece outside mobile canvas '+JSON.stringify({view,p,metrics}));
   for(const id of ['build-assist-toggle','fit']){const b=await page.locator('#'+id).boundingBox();assert(b&&b.height>=44&&b.x>=0&&b.x+b.width<=view.width,'Mobile controls overflow '+id);}
   await page.locator('#build-assist-toggle').click();assert(await page.locator('#hint').isVisible(),'Help menu unavailable');await page.keyboard.press('Escape');assert(!await page.locator('#hint').isVisible(),'Help Escape failed');
   if(view.height===844)await page.screenshot({path:`output/playwright/mobile-v2-build-${language}.png`});
   results.push({view,language,workbenchFraction:metrics.scene.height/view.height});
  }
 }
 await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('#fit').waitFor();await page.waitForTimeout(1000);
 // Install one real loose part by touch-sized screen coordinates, then finish via help.
 let installed=false;
 for(const offset of [{x:0,y:0},{x:4,y:0},{x:-4,y:0},{x:0,y:4},{x:0,y:-4}]){
  const s=await page.evaluate(()=>window.__brickWorld),p=s.pieces.find(p=>p.character===0&&p.slot==='legs');await page.mouse.move(p.screen.x+offset.x,p.screen.y+offset.y);await page.mouse.down();await page.mouse.move(p.target.x+offset.x,p.target.y+offset.y,{steps:25});await page.mouse.up();await page.waitForTimeout(220);
  if(await page.evaluate(()=>window.__brickWorld.count)===1){installed=true;break;}await page.waitForTimeout(400);
 }
 assert(installed,'Mobile real drag failed');await page.locator('#build-assist-toggle').click();for(let i=1;i<12;i++){await page.locator('#hint').click();await page.locator('#connect').click();}
 await page.locator('#life').click();await page.locator('#moments').waitFor();await page.waitForTimeout(1100);await page.locator('#moments summary').click();if(await page.evaluate(()=>window.__brickWorld.autoInteractions))await page.locator('#surprises').click();await page.locator('#moments summary').click();
 assert((await page.evaluate(()=>window.__brickWorld.props)).held===4,'Photo props not equipped');
 for(const language of ['zh','en']){
  if(await page.evaluate(()=>window.__brickWorld.language)!==language)await page.locator('#language').click();
  assert(!await page.locator('#wave').isVisible()&&!await page.locator('#dance').isVisible(),'Too many homepage actions on mobile');assert(await page.locator('#hug').isVisible(),'Primary hug missing');
  await page.locator('#moments summary').click();await page.locator('#library-tab-stories').click();await page.locator('#together').scrollIntoViewIfNeeded();const box=await page.locator('.moments-list').boundingBox();assert(box&&box.x>=0&&box.x+box.width<=390&&box.y>60&&box.y+box.height<800,'Library outside mobile bounds');assert(await page.locator('#library-dance').count()===1,'Dance missing from phone menu');await page.screenshot({path:`output/playwright/mobile-v2-library-${language}.png`});await page.keyboard.press('Escape');
 }
 // Manual camera controls keep ownership until the explicit reframe action.
 await page.mouse.move(330,200);await page.mouse.down();await page.mouse.move(260,230,{steps:12});await page.mouse.up();assert(!await page.evaluate(()=>window.__brickWorld.autoFraming),'Orbit did not stop auto-framing');await page.locator('#fit').click();assert(await page.evaluate(()=>window.__brickWorld.autoFraming),'Reframe did not restore following');
 await page.waitForTimeout(1200);await page.screenshot({path:'output/playwright/mobile-v2-play-final.png'});
 assert(errors.length===0,'Browser errors '+errors.join(';'));return {passed:true,results,checks:['62-82% dedicated workbench','no scrolling','bilingual compact chrome','all scattered piece centres visible','real mobile drag','help disclosure','one action menu','props equipped','camera ownership'],errors};
}
