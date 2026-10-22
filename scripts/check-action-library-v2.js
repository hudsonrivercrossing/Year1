async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));const assert=(c,m)=>{if(!c)throw Error(m);};const read=()=>page.evaluate(()=>window.__brickWorld),results=[];
 if((await read()).mode!=='play')throw Error('Start in assembled play mode');
 await page.waitForFunction(()=>window.__brickWorld.activity==='wander',{timeout:45000});
 if((await read()).autoInteractions){await page.locator('#moments summary').click();await page.locator('#surprises').click();await page.keyboard.press('Escape');}
 for(const id of ['highFive','sit','beckon','holdHands','look','wait']){
  await page.locator('#moments summary').click();await page.locator('#library-tab-'+(['highFive','holdHands'].includes(id)?'affection':'together')).click();await page.locator('#'+id).click();let state=await read();assert(state.props.held===0&&state.props.dropped===4,'Props must be dropped before '+id);
  await page.waitForFunction(id=>window.__brickWorld.activity===id&&window.__brickWorld.action?.phase==='gesture'&&window.__brickWorld.action.time>.95,id,{timeout:35000});
  state=await read();assert(state.props.held===0,'Props re-equipped in gesture '+id);if(id==='sit')for(const f of state.figures){assert(f.heightOffset<-.4,'Sit must lower pelvis');assert(f.feetY>=-.002&&f.feetY<.075,'Seated feet must rest on board '+f.feetY);}
  await page.screenshot({path:`output/playwright/mobile-v2-${id}.png`});
  if(id==='sit'){
   await page.locator('#stop').click();for(let i=0;i<4;i++){await page.waitForTimeout(70);const s=await read();if(s.activity==='sit')for(const f of s.figures)assert(f.feetY>=-.005&&f.feetY<.08,'Cancel sit clips floor');}
  }
  await page.waitForFunction(()=>window.__brickWorld.activity==='recover',{timeout:35000});assert((await read()).props.dropped>0,'Recovery skipped dropped props');
  await page.waitForFunction(()=>window.__brickWorld.activity==='wander',{timeout:45000});state=await read();assert(state.props.held===4&&state.props.dropped===0&&!state.props.recovering,'Recovery incomplete '+id);assert(state.queue.length===0&&state.effects===0&&!state.sequence&&!state.cancelling,'Residual action state '+id);for(const f of state.figures){assert(Math.abs(f.heightOffset)<.001,'Height not reset '+id);assert(f.waist.slice(0,3).every(x=>Math.abs(x)<.001),'Waist not reset '+id);}
  results.push({id,held:state.props.held,cancelled:id==='sit'});
 }
 assert(!errors.length,errors.join(';'));return {passed:true,results,errors};
}
