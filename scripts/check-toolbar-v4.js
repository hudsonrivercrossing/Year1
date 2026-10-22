async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));const assert=(c,m)=>{if(!c)throw Error(m);};const read=()=>page.evaluate(()=>window.__brickWorld),views=[{width:320,height:568},{width:390,height:667},{width:390,height:844},{width:430,height:932}],results=[];
 const bounds=async()=>page.evaluate(()=>{const r=document.querySelector('.moments-list').getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom};});
 for(const view of views){
  await page.setViewportSize(view);await page.evaluate(()=>{localStorage.clear();localStorage.setItem('little-world-hints','off');});await page.reload();await page.locator('#hint').waitFor();
  assert(await page.locator('#hint-toggle').count()===0,'Hint switch should be removed');assert((await read()).hintsOn,'Old saved off-state should not hide picked-part highlight');
  assert(await page.locator('.build-tool-row button:visible').count()===3,'Expected three direct build tools');await page.locator('#hint').click();assert(await page.locator('#hint').getAttribute('data-ready')==='true','Find did not offer place');await page.locator('#hint').click();assert((await read()).count===1,'Contextual place failed');
  if(view.height===844)await page.screenshot({path:'output/playwright/toolbar-v4-free.png'});
  await page.locator('#mode-guided').click();await page.locator('#auto').click();await page.locator('#life').waitFor({timeout:9000});
  for(const lang of ['zh','en']){if((await read()).language!==lang)await page.locator('#language').click();const buttons=await page.locator('#tools>button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{x:r.x,right:r.right,height:r.height};}));assert(buttons.every(b=>b.x>=0&&b.right<=view.width&&b.height>=44),'Ready buttons overflow '+JSON.stringify({view,lang,buttons}));}
  await page.locator('#life').click();await page.locator('#moments').waitFor({timeout:6000});
  for(const lang of ['zh','en']){
   if((await read()).language!==lang)await page.locator('#language').click();await page.locator('#moments summary').click();
   for(const tab of ['affection','together','stories']){
    await page.locator('#library-tab-'+tab).click();const b=await bounds();assert(b.x>=0&&b.right<=view.width&&b.y>60&&b.bottom<view.height-48,'Popover outside phone '+JSON.stringify({view,lang,tab,b}));
    const counts=await page.locator('#library-panel-'+tab+' button:visible').count();assert(counts===(tab==='together'?6:4),'Wrong visible choices '+tab+' '+counts);const sizes=await page.locator('#library-panel-'+tab+' button:visible').evaluateAll(bs=>bs.map(b=>b.getBoundingClientRect().height));assert(sizes.every(h=>h>=44),'Small touch target');
   }
   await page.locator('#library-tab-affection').focus();await page.keyboard.press('ArrowRight');assert(await page.locator('#library-tab-together').getAttribute('aria-selected')==='true','Keyboard tabs failed');
   const on=(await read()).autoInteractions;await page.locator('#surprises').click();assert((await read()).autoInteractions!==on&&await page.locator('#moments').getAttribute('open')!==null,'Auto setting closed library');assert(await page.evaluate(()=>document.activeElement.id)==='surprises','Setting lost keyboard focus');await page.locator('#surprises').click();
   if(view.height===844){await page.locator('#library-tab-affection').click();await page.screenshot({path:`output/playwright/toolbar-v4-actions-${lang}.png`});}
   await page.locator('#library-close').click();assert(await page.evaluate(()=>document.activeElement===document.querySelector('#moments summary')),'Close did not restore focus');
   await page.locator('#moments summary').click();await page.keyboard.press('Escape');assert(await page.locator('#moments').getAttribute('open')===null,'Escape left library open');
   const over=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight+1);assert(!over,'Viewport overflow '+JSON.stringify({view,lang}));results.push({view,lang});
  }
 }
 // Face the pair from the opposite side; hand assignment must flip correctly.
 await page.setViewportSize({width:390,height:844});await page.locator('#moments summary').click();if((await read()).autoInteractions)await page.locator('#surprises').click();await page.keyboard.press('Escape');
 const r=await page.locator('#scene').boundingBox();await page.mouse.move(r.width*.15,r.y+r.height*.45);await page.mouse.down();await page.mouse.move(r.width*.85,r.y+r.height*.45,{steps:24});await page.mouse.up();await page.waitForTimeout(500);assert(!(await read()).autoFraming,'Manual orbit was overwritten');
 const before=(await read()).sounds.counts.highFive;await page.locator('#moments summary').click();await page.locator('#library-tab-affection').click();await page.locator('#highFive').click();await page.waitForFunction(()=>window.__brickWorld.activity==='highFive'&&window.__brickWorld.action?.phase==='gesture'&&window.__brickWorld.action.time>.9,null,{timeout:35000});
 let s=await read();assert(s.action.contact.distance>.16&&s.action.contact.distance<.28,'Opposite-view hand alignment failed');assert(s.sounds.counts.highFive===before+1,'Contact sound not played exactly once');await page.screenshot({path:'output/playwright/motion-v4-highFive-reverse.png'});
 await page.locator('#language').click();assert((await read()).activity==='highFive','Language reset live action');await page.locator('#stop').click();await page.waitForFunction(()=>window.__brickWorld.activity==='recover',null,{timeout:5000});await page.setViewportSize({width:320,height:568});
 const row=await page.locator('#tools>button:visible,#moments summary').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{x:r.x,right:r.right,height:r.height};}));assert(row.every(b=>b.x>=0&&b.right<=320&&b.height>=44),'Recovery controls overflow '+JSON.stringify(row));await page.screenshot({path:'output/playwright/toolbar-v4-recover-small.png'});
 await page.waitForFunction(()=>window.__brickWorld.activity==='wander',null,{timeout:45000});s=await read();assert(s.props.held===4&&!s.effects&&!s.props.dropped,'Recovery leaked state');assert(!errors.length,errors.join(';'));return{passed:true,results,checks:['no hint switch','always-on picked-part highlight setting','three keyboard-accessible tabs','touch targets','focus-preserving auto switch','close and Escape focus','bilingual ready/play/recovery rows','opposite-side high-five contact and one cue','language mid-action','complete recovery'],errors};
}
