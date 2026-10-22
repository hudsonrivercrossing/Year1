async page=>{
 const errors=[],assert=(v,m)=>{if(!v)throw Error(m);},read=()=>page.evaluate(()=>window.__brickWorld),results=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('#mode-guided').click();await page.locator('#auto').click();await page.locator('#life').waitFor({timeout:12000});await page.locator('#life').click();await page.locator('#moments').waitFor({timeout:10000});
 await page.locator('#moments summary').click();if((await read()).autoInteractions)await page.locator('#surprises').click();await page.keyboard.press('Escape');
 const start=async id=>{await page.locator('#moments summary').click();await page.locator('#library-tab-life').click();await page.locator('#'+id).click();assert(await page.locator('#moments').getAttribute('open')===null,'Life action did not close menu');};
 const recover=async()=>{await page.waitForFunction(()=>window.__brickWorld.activity==='wander',null,{timeout:90000});const s=await read();assert(s.props.held===4&&!s.props.dropped&&!s.cancelling&&!s.action,'Recovery failed');assert(s.figures.every(f=>Math.abs(f.heightOffset)<.001),'Seated pose leaked');};
 for(const [id,phase]of[['overtime','work'],['flower','admire'],['gift','show']]){
  await start(id);await page.waitForFunction(phase=>window.__brickWorld.action?.phase===phase,phase,{timeout:60000});let s=await read();assert(s.props.held===0&&s.props.dropped===4,'Original props still held '+id);
  if(id==='overtime')assert(s.action.seatBlend===1&&Math.abs(s.figures[1].legs[0][0]+Math.PI/2)<.01&&Math.abs(s.figures[0].heightOffset)<.001,'Not seated');
  if(id==='flower')assert(s.life.flowers===1,'Flower not planted');
  if(id==='gift')assert(s.action.bagOwner==='YW'&&s.action.bagInstances===1&&s.action.transferGap<1e-6,'Gift handoff failed');
  await page.screenshot({path:`output/playwright/life-${id}-phone.png`});
  await page.locator('#language').click();assert((await read()).activity===id,'Language restarted scene');
  if(id==='gift'){
   const r=await page.locator('#scene').boundingBox();await page.mouse.move(30,r.y+40);await page.mouse.down();await page.mouse.move(140,r.y+40,{steps:8});await page.mouse.up();assert(!(await read()).autoFraming,'Manual view lost');
  }
  await recover();results.push({id,normal:true});
 }
 // Planting again adds a second persistent flower.
 await start('flower');await page.waitForFunction(()=>window.__brickWorld.action?.phase==='admire',null,{timeout:60000});await page.locator('#stop').click();await recover();assert((await read()).life.flowers===2,'Cancelled planting lost committed flower');
 for(const [id,phase]of[['overtime','sit'],['gift','receive']]){await start(id);await page.waitForFunction(phase=>window.__brickWorld.action?.phase===phase,phase,{timeout:60000});await page.locator('#stop').click();await recover();results.push({id,cancelledAt:phase});}
 for(const view of [{width:320,height:568},{width:430,height:932},{width:844,height:390}]){
  await page.setViewportSize(view);await page.locator('#moments summary').click();await page.locator('#library-tab-life').click();
  const b=await page.locator('.moments-list').boundingBox();assert(b.x>=0&&b.x+b.width<=view.width+1&&b.y>=0&&b.y+b.height<=view.height+1,'Life menu overflow');
  assert(await page.locator('#library-panel-life button').count()===3,'Life menu count');await page.locator('#library-tab-life').focus();await page.keyboard.press('ArrowRight');assert(await page.locator('#library-tab-affection').getAttribute('aria-selected')==='true','Four-tab wrap failed');await page.keyboard.press('End');assert(await page.locator('#library-tab-life').getAttribute('aria-selected')==='true','End did not reach life tab');await page.keyboard.press('Escape');
 }
 await start('gift');await page.waitForFunction(()=>window.__brickWorld.action?.bagVisible,null,{timeout:60000});await page.locator('#moments summary').click();await page.locator('#rebuild-menu').click();assert((await read()).life.flowers===0&&!(await read()).action,'Rebuild leaked flower or scene');assert(!errors.length,errors.join(';'));
 return{passed:true,results,checks:['three normal scenes','four props recovered each time','cancel while sitting and receiving','unique persistent flower','tending cancellation','language mid-scene','manual camera','four-tab keyboard and small phone/landscape','rebuild clears all'],errors};
}
