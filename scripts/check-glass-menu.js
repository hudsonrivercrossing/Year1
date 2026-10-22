async page=>{
 const read=()=>page.evaluate(()=>window.__brickWorld),assert=(v,m)=>{if(!v)throw Error(m);},results=[];
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 for(const view of [{width:320,height:568},{width:390,height:667},{width:390,height:844},{width:430,height:932},{width:844,height:390}]){
  await page.setViewportSize(view);await page.reload();await page.locator('#mode-guided').click();await page.locator('#auto').click();await page.locator('#life').waitFor({timeout:12000});await page.locator('#life').click();await page.locator('#moments').waitFor({timeout:8000});
  await page.locator('#moments summary').click();if((await read()).autoInteractions)await page.locator('#surprises').click();await page.keyboard.press('Escape');
  for(const lang of ['zh','en']){
   if((await read()).language!==lang)await page.locator('#language').click();const follow=(await read()).autoFraming;await page.locator('#moments summary').click();await page.waitForTimeout(800);
   for(const tab of ['affection','together','stories','life']){
    await page.locator('#library-tab-'+tab).click();await page.waitForTimeout(250);const panel=await page.locator('.moments-list').boundingBox(),s=await read();
    assert(panel.height<=244&&panel.x>=0&&panel.x+panel.width<=view.width+1&&panel.y>=0&&panel.y+panel.height<view.height,'Card bounds '+JSON.stringify({view,lang,tab,panel}));
    const buttons=await page.locator('#library-panel-'+tab+' button:visible').evaluateAll(bs=>bs.map(n=>n.getBoundingClientRect().height));assert(buttons.every(h=>h>=44),'Small touch target');
    if(view.width<=700)assert(s.figures.every(f=>f.screen.y<panel.y-20),'Actor behind portrait menu '+JSON.stringify({view,lang,tab,actors:s.figures.map(f=>f.screen),panel}));
    else assert(s.figures.every(f=>f.screen.x<panel.x-20),'Actor behind landscape menu');
    assert(s.autoFraming===follow,'Menu changed camera ownership');results.push({view,lang,tab,height:panel.height,offset:s.camera.viewOffset});
   }
   const glass=await page.locator('.moments-list').evaluate(n=>({background:getComputedStyle(n).backgroundColor,blur:getComputedStyle(n).backdropFilter}));assert(glass.blur.includes('5px')&&glass.background.includes('0.76'),'Frosted style missing');
   if(view.width===390&&view.height===844){await page.locator('#library-tab-affection').click();await page.screenshot({path:`output/playwright/glass-menu-${lang}.png`});}
   await page.locator('#library-close').click();await page.waitForTimeout(800);assert((await read()).camera.viewOffset.every(v=>v===0),'Closed menu left projection shift');assert(await page.evaluate(()=>document.activeElement===document.querySelector('#moments summary')),'Focus not restored');
  }
 }
 await page.setViewportSize({width:390,height:844});const scene=await page.locator('#scene').boundingBox();await page.mouse.move(40,scene.y+20);await page.mouse.down();await page.mouse.move(130,scene.y+20,{steps:12});await page.mouse.up();assert(!(await read()).autoFraming,'Orbit did not keep control');
 await page.locator('#moments summary').click();await page.waitForTimeout(300);assert(!(await read()).autoFraming,'Menu stole manual view');await page.locator('#library-tab-together').click();await page.locator('#wait').click();assert(await page.locator('#moments').getAttribute('open')===null,'Action did not close card');await page.locator('#stop').click();await page.waitForFunction(()=>window.__brickWorld.activity==='wander',null,{timeout:45000});
 await page.setViewportSize({width:1440,height:960});await page.locator('#moments summary').click();await page.waitForTimeout(700);assert((await read()).camera.viewOffset.every(v=>v===0),'Phone shift leaked to desktop');const bg=await page.locator('.moments-list').evaluate(n=>getComputedStyle(n).backgroundColor);assert(bg==='rgb(247, 242, 233)','Desktop paper changed');
 assert(!errors.length,errors.join(';'));return{passed:true,results,errors,checks:['small frosted card','all actions/tabs remain','44px touch targets','actors outside card','close restores projection and focus','manual camera preserved','action/stop recovery','desktop unchanged']};
}
