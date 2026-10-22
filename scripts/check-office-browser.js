async page=>{
 const errors=[],assert=(v,m)=>{if(!v)throw Error(m);},read=()=>page.evaluate(()=>window.__brickWorld),results=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('#mode-guided').click();await page.locator('#auto').click();await page.locator('#life').waitFor({timeout:12000});await page.locator('#life').click();await page.locator('#moments').waitFor({timeout:10000});
 await page.locator('#moments summary').click();if((await read()).autoInteractions)await page.locator('#surprises').click();await page.keyboard.press('Escape');
 const start=async id=>{await page.locator('#moments summary').click();await page.locator('#library-tab-life').click();await page.locator('#'+id).click();assert(await page.locator('#moments').getAttribute('open')===null,'Life action did not close menu');};
 const recover=async()=>{await page.waitForFunction(()=>window.__brickWorld.activity==='wander',null,{timeout:90000});const s=await read();assert(s.props.held===4&&!s.props.dropped&&!s.cancelling&&!s.action,'Recovery failed');assert(s.figures.every(f=>Math.abs(f.heightOffset)<.001),'Seated pose leaked');};
 await page.evaluate(()=>{window.__brickWorld={positions:[[-2,0],[2,0]],flowers:[[-9,-5],[-9,0],[-9,5],[9,-5],[9,5]]};});
 for(const cancelAt of [null,'work','exit']){
  await start('overtime');await page.waitForFunction(()=>window.__brickWorld.action?.phase==='work',null,{timeout:60000});
  let s=await read();assert(s.life.flowers===5,'Lost flowers');assert(Math.abs(s.figures[1].heightOffset+.23)<.001,'YW not seated');assert(Math.abs(s.figures[0].heightOffset)<.001,'DJ sat down');
  const seen=new Set();for(let n=0;n<35;n++){await page.waitForTimeout(100);s=await read();if(s.action?.phase==='work')seen.add(s.action.routeIndex);}
  assert(seen.size>=2,'DJ did not move through route');await page.screenshot({path:`output/playwright/office-solo-${cancelAt??'normal'}.png`});
  if(cancelAt){if(cancelAt==='exit')await page.waitForFunction(()=>window.__brickWorld.action?.phase==='exit',null,{timeout:60000});await page.locator('#stop').click();}
  await recover();results.push({cancelAt,routeCorners:[...seen],compact:s.arena?.compact});
 }
 for(const view of [{width:320,height:568},{width:430,height:932},{width:844,height:390}]){
  await page.setViewportSize(view);await page.locator('#moments summary').click();await page.locator('#library-tab-life').click();
  const b=await page.locator('.moments-list').boundingBox();assert(b.x>=0&&b.x+b.width<=view.width+1&&b.y>=0&&b.y+b.height<=view.height+1,'Life menu overflow');
  assert(await page.locator('#library-panel-life button').count()===3,'Life menu count');await page.locator('#library-tab-life').focus();await page.keyboard.press('ArrowRight');assert(await page.locator('#library-tab-affection').getAttribute('aria-selected')==='true','Four-tab wrap failed');await page.keyboard.press('End');assert(await page.locator('#library-tab-life').getAttribute('aria-selected')==='true','End did not reach life tab');await page.keyboard.press('Escape');
 }
 assert(!errors.length,errors.join(';'));return{passed:true,results,checks:['YW alone seated','DJ moves around furniture','five flowers persist','normal and cancelled office restores four original props','mobile menu and keyboard'],errors};
}