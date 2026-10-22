async page=>{
 const read=()=>page.evaluate(()=>window.__brickWorld),assert=(v,m)=>{if(!v)throw Error(m);},results=[];
 for(const view of [{width:320,height:568},{width:390,height:667},{width:390,height:844},{width:430,height:932},{width:844,height:390}]){
  await page.setViewportSize(view);await page.reload();await page.waitForFunction(()=>document.querySelector('#loading').hidden);await page.waitForTimeout(1000);
  const state=await read(),elevation=90-state.camera.polar*180/Math.PI;assert(elevation>44&&elevation<48,'Build angle '+elevation);
  for(const lang of ['zh','en']){
   if((await read()).language!==lang)await page.locator('#language').click();
   const tools=await page.locator('.build-tool-row button:visible').evaluateAll(bs=>bs.map(n=>({id:n.id,label:n.innerText,box:n.getBoundingClientRect().toJSON()})));
   assert(tools.length===3&&tools.every(n=>n.box.x>=0&&n.box.right<=view.width&&n.box.height>=44),'Build tools '+JSON.stringify({view,lang,tools}));assert(await page.locator('#build-assist-toggle').count()===0,'Old disclosure remains');
   await page.locator('#hint').click();assert(await page.locator('#hint').getAttribute('data-ready')==='true','Find did not select');await page.locator('#scatter').click();assert(await page.locator('#hint').getAttribute('data-ready')==='false'&&(await read()).count===0,'Scatter did not clear selected helper');
   await page.locator('#hint').click();await page.locator('#hint').click();assert((await read()).count===1,'Two-step help did not place');
   await page.locator('#mode-guided').click();await page.locator('#mode-free').click();results.push({view,lang,elevation});
  }
  if(view.width===390&&view.height===844){
   await page.waitForTimeout(1300);const box=await page.locator('#scene').boundingBox();
   for(let i=0;i<5;i++){await page.locator('#scatter').click();await page.waitForTimeout(900);const pieces=(await read()).pieces;assert(pieces.every(p=>p.screen.x>=8&&p.screen.x<view.width-8&&p.screen.y>=box.y&&p.screen.y<box.y+box.height),'Scattered part center outside initial frame '+JSON.stringify(pieces.filter(p=>p.screen.x<8||p.screen.x>view.width-8)));}
   await page.screenshot({path:'output/playwright/frame-v5-build-final.png'});
  }
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#mode-guided').click();await page.locator('#auto').click();await page.locator('#life').waitFor({timeout:12000});await page.locator('#life').click();await page.locator('#moments').waitFor({timeout:8000});await page.waitForTimeout(500);
 let state=await read();const elevation=90-state.camera.polar*180/Math.PI,distance=Math.hypot(...state.camera.position.map((v,i)=>v-state.camera.target[i]));assert(elevation>27&&elevation<31&&distance>19.9,'Wander frame '+JSON.stringify({elevation,distance}));await page.screenshot({path:'output/playwright/frame-v5-wander-final.png'});
 const box=await page.locator('#scene').boundingBox();await page.mouse.move(30,box.y+20);await page.mouse.down();await page.mouse.move(180,box.y+20,{steps:16});await page.mouse.up();assert(!(await read()).autoFraming,'Orbit lost ownership');await page.locator('#fit').click();assert((await read()).autoFraming,'Frame did not restore follow');
 await page.setViewportSize({width:1440,height:960});await page.locator('#reset').click();await page.locator('#mode-free').click();assert(await page.locator('#hint').isVisible()&&await page.locator('#connect').isVisible()&&await page.locator('#scatter').isVisible()&&!await page.locator('#fit').isVisible(),'Desktop build controls changed');
 return{passed:true,results,wander:{elevation,distance},checks:['three parallel tools','contextual find/place','scatter clears selection','five random scatters visible','flatter build/play views','slightly closer mobile framing','manual orbit ownership','desktop controls retained']};
}
