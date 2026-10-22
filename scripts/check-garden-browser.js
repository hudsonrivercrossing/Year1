async page=>{
 const errors=[],assert=(v,m)=>{if(!v)throw Error(m);},read=()=>page.evaluate(()=>window.__brickWorld),results=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('#mode-guided').click();await page.locator('#auto').click();await page.locator('#life').waitFor({timeout:12000});await page.locator('#life').click();await page.locator('#moments').waitFor({timeout:10000});
 await page.locator('#moments summary').click();if((await read()).autoInteractions)await page.locator('#surprises').click();await page.keyboard.press('Escape');
 const start=async id=>{await page.locator('#moments summary').click();await page.locator('#library-tab-life').click();await page.locator('#'+id).click();assert(await page.locator('#moments').getAttribute('open')===null,'Life action did not close menu');};
 const recover=async()=>{await page.waitForFunction(()=>window.__brickWorld.activity==='wander',null,{timeout:90000});const s=await read();assert(s.props.held===4&&!s.props.dropped&&!s.cancelling&&!s.action,'Recovery failed');assert(s.figures.every(f=>Math.abs(f.heightOffset)<.001),'Seated pose leaked');};
 for(let i=0;i<5;i++){
  await start('flower');await page.waitForFunction(n=>window.__brickWorld.life.flowers===n,i+1,{timeout:60000});
  await page.screenshot({path:`output/playwright/garden-${i+1}.png`});await recover();
  const s=await read();assert(s.life.items.length===i+1,'Wrong garden size');results.push({flowers:s.life.items});
 }
 assert(await page.locator('#flower').textContent()==='陪花跳支舞','Full garden label not updated');
 let last=-1;for(let i=0;i<2;i++){
  await start('flower');await page.waitForFunction(()=>window.__brickWorld.action?.phase==='flower-dance',null,{timeout:60000});
  const s=await read();assert(s.life.selected!==last,'Repeated flower');last=s.life.selected;
  await page.locator('#stop').click();await recover();assert((await read()).life.flowers===5,'Cancellation removed garden');
 }
 for(const view of [{width:320,height:568},{width:430,height:932},{width:844,height:390}]){
  await page.setViewportSize(view);await page.locator('#moments summary').click();await page.locator('#library-tab-life').click();
  const b=await page.locator('.moments-list').boundingBox();assert(b.x>=0&&b.x+b.width<=view.width+1&&b.y>=0&&b.y+b.height<=view.height+1,'Life menu overflow');
  assert(await page.locator('#library-panel-life button').count()===3,'Life menu count');await page.locator('#library-tab-life').focus();await page.keyboard.press('ArrowRight');assert(await page.locator('#library-tab-affection').getAttribute('aria-selected')==='true','Four-tab wrap failed');await page.keyboard.press('End');assert(await page.locator('#library-tab-life').getAttribute('aria-selected')==='true','End did not reach life tab');await page.keyboard.press('Escape');
 }
 await start('gift');await page.waitForFunction(()=>window.__brickWorld.action?.bagVisible,null,{timeout:60000});await page.locator('#moments summary').click();await page.locator('#rebuild-menu').click();assert((await read()).life.flowers===0&&!(await read()).action,'Rebuild leaked flower or scene');assert(!errors.length,errors.join(';'));
 return{passed:true,results,checks:['five normal plantings with four props recovered','capacity label and no repeated flower','dance cancellation preserves garden','four-tab keyboard and small phone/landscape','rebuild clears garden and transient gift'],errors};
}
