async page=>{
 const errors=[],assert=(v,m)=>{if(!v)throw Error(m);},read=()=>page.evaluate(()=>window.__brickWorld),results=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('#mode-guided').click();await page.locator('#auto').click();await page.locator('#life').waitFor({timeout:12000});await page.locator('#life').click();await page.locator('#moments').waitFor({timeout:10000});
 await page.locator('#moments summary').click();if((await read()).autoInteractions)await page.locator('#surprises').click();await page.keyboard.press('Escape');
 const waitPhase=async phase=>{try{await page.waitForFunction(phase=>window.__brickWorld.action?.phase===phase,phase,{timeout:60000});}catch(error){throw Error(JSON.stringify({expected:phase,results,trace:await page.evaluate(()=>window.__giftRegressionTrace),state:await read(),error:String(error)}));}};
 const start=async id=>{await page.evaluate(()=>{clearInterval(window.__giftRegressionTimer);window.__giftRegressionTrace=[];window.__giftRegressionTimer=setInterval(()=>{const s=window.__brickWorld,key=s.activity+':'+s.action?.phase;if(window.__giftRegressionTrace.at(-1)?.key!==key)window.__giftRegressionTrace.push({key,action:s.action,figures:s.figures.map(f=>[f.x,f.z]),obstacles:s.obstacles,arena:s.arena});},250);});await page.locator('#moments summary').click();await page.locator('#library-tab-life').click();await page.locator('#'+id).click();assert(await page.locator('#moments').getAttribute('open')===null,'Life action did not close menu');};
 const recover=async()=>{await page.waitForFunction(()=>window.__brickWorld.activity==='wander',null,{timeout:90000});const s=await read();assert(s.props.held===4&&!s.props.dropped&&!s.cancelling&&!s.action,'Recovery failed');assert(s.figures.every(f=>Math.abs(f.heightOffset)<.001),'Seated pose leaked');};
 await page.evaluate(()=>{window.__brickWorld={positions:[[-2,0],[2,0]],flowers:[[-9,-5],[-9,0],[-9,5],[9,-5],[9,5]]};});
 await start('gift');
 for(const phase of ['unwrap','curious','offer','show','kiss','shy']){
  await waitPhase(phase);await page.waitForTimeout(250);const s=await read();
  assert(s.props.held===0&&s.props.dropped===4,'Original props not dropped');
  if(phase==='offer')assert(s.action.supportGripError<.2,'Support hand missing handle');
  if(phase==='show')assert(s.action.bagOwner==='YW'&&s.action.transferGap<1e-6&&s.action.bagInstances===1,'Handoff invalid');
  if(phase==='kiss'||phase==='shy')assert(!s.action.bagVisible,'Bag not stowed before kiss');
  await page.screenshot({path:`output/playwright/gift-surprise-${phase}.png`});results.push({phase,state:s.action});
 }
 await recover();
 for(const phase of ['unwrap','receive','show','kiss']){
  await start('gift');await waitPhase(phase);await page.locator('#stop').click();await recover();assert((await read()).life.flowers===5,'Gift removed garden');results.push({cancelAt:phase});
 }
 for(const view of [{width:320,height:568},{width:430,height:932},{width:844,height:390}]){
  await page.setViewportSize(view);await page.locator('#moments summary').click();await page.locator('#library-tab-life').click();
  const b=await page.locator('.moments-list').boundingBox();assert(b.x>=0&&b.x+b.width<=view.width+1&&b.y>=0&&b.y+b.height<=view.height+1,'Life menu overflow');
  assert(await page.locator('#library-panel-life button').count()===3,'Life menu count');await page.locator('#library-tab-life').focus();await page.keyboard.press('ArrowRight');assert(await page.locator('#library-tab-affection').getAttribute('aria-selected')==='true','Four-tab wrap failed');await page.keyboard.press('End');assert(await page.locator('#library-tab-life').getAttribute('aria-selected')==='true','End did not reach life tab');await page.keyboard.press('Escape');
 }
 await start('gift');await waitPhase('show');await page.locator('#language').click();const s=await read();assert(s.action.bagOwner==='YW','Language reset owner');await page.locator('#moments summary').click();await page.locator('#rebuild-menu').click();assert((await read()).life.flowers===0&&!(await read()).action,'Rebuild leaked garden or gift');assert(!errors.length,errors.join(';'));return{passed:true,results,checks:['full surprise sequence','double-hand grip','one exact handoff','stow before kiss','cancellation and original props','five flowers persist','language preserves owner','phone menu and rebuild'],errors};
}