async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));const assert=(c,m)=>{if(!c)throw Error(m);};const read=()=>page.evaluate(()=>window.__brickWorld);await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>window.__brickWorld.activity==='wander',{timeout:45000});
 if((await read()).autoInteractions){await page.locator('#moments summary').click();await page.locator('#surprises').click();await page.keyboard.press('Escape');}
 const results=[];
 for(const [recipe,expected]of [['together',['dance','holdHands','look']],['reunion',['stroll','wait','beckon','approach','hug']]]){
  await page.locator('#moments summary').click();await page.locator('#library-tab-stories').click();await page.locator('#'+recipe).click();const seen=[],deadline=Date.now()+100000;let recovering=false,switched=false,shot=false;
  while(Date.now()<deadline){
   const s=await read();if(s.activity==='wander')break;
   if(s.activity==='recover'){recovering=true;assert(!s.sequence&&s.queue.length===0,'Queue not cleared before recovery');}
   else {assert(s.sequence===recipe,'Lost sequence identity');assert(s.props.held===0&&s.props.dropped===4,'Repeated pickup/drop between sequence stages');if(seen.at(-1)!==s.activity)seen.push(s.activity);}
   if(recipe==='reunion'&&!switched&&s.activity==='beckon'){const lang=s.language;await page.locator('#language').click();const after=await read();assert(after.language!==lang&&after.sequence===recipe&&after.props.held===0,'Language reset a live sequence');switched=true;}
   if(recipe==='together'&&s.activity==='holdHands'&&s.action?.phase==='gesture'&&s.action.time>1&&!shot){await page.screenshot({path:'output/playwright/mobile-v2-sequence-hands.png'});shot=true;}
   await page.waitForTimeout(160);
  }
  const s=await read();assert(s.activity==='wander','Sequence timed out '+recipe);assert(recovering&&s.props.held===4&&!s.props.dropped&&!s.props.recovering,'Incomplete end-of-sequence pickup '+recipe);assert(JSON.stringify(seen)===JSON.stringify(expected),'Wrong sequence '+JSON.stringify(seen));assert(s.effects===0&&!s.cancelling&&!s.sequence&&s.queue.length===0,'Residual sequence state');results.push({recipe,seen:seen,held:s.props.held});
 }
 // Cancel during approach, then reset while the recovery transaction is active.
 await page.locator('#moments summary').click();await page.locator('#sweet').click();await page.locator('#stop').click();await page.waitForFunction(()=>window.__brickWorld.activity==='recover',{timeout:7000});await page.locator('#moments summary').click();await page.locator('#rebuild-menu').click();
 let s=await read();assert(s.mode==='build'&&s.count===0&&s.effects===0&&s.queue.length===0&&!s.sequence&&!s.props.active&&!s.props.recovering&&!s.props.dropped,'Reset leaked props/queue/effects');
 // The original guided build remains usable after the prop rigs are removed.
 await page.locator('#mode-guided').click();await page.locator('#auto').click();await page.locator('#life').waitFor({timeout:9000});await page.locator('#life').click();await page.locator('#moments').waitFor({timeout:6000});assert((await read()).props.held===4,'Re-awakening failed to equip props');
 assert(!errors.length,errors.join(';'));return {passed:true,results,checks:['single release across each complete recipe','language during active sequence','approach cancellation','reset during recovery','guided rebuild and re-equip'],errors};
}
