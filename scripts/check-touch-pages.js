async page=>{
 const context=await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const mobile=await context.newPage(),errors=[];mobile.on('pageerror',e=>errors.push(String(e)));
 const assert=(c,m)=>{if(!c)throw Error(m);};
 try{
  await mobile.goto(page.url());await mobile.waitForFunction(()=>document.querySelector('#loading')?.hidden);await mobile.waitForTimeout(900);
  const read=()=>mobile.evaluate(()=>window.__brickWorld),cdp=await context.newCDPSession(mobile);
  const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});let held;
  for(const offset of [0,4,-4,7,-7]){
   const p=(await read()).pieces.find(p=>p.character===0&&p.slot==='legs');await touch('touchStart',p.screen.x+offset,p.screen.y);await mobile.waitForTimeout(60);held=(await read()).pieces.find(p=>p.held);
   if(held){assert(held.highlighted&&held.hintVisible,'Touch did not highlight target');for(let i=1;i<=22;i++)await touch('touchMove',p.screen.x+offset+(held.target.x-p.screen.x-offset)*i/22,p.screen.y+(held.target.y-p.screen.y)*i/22);await touch('touchEnd');break;}await touch('touchEnd');
  }
  await mobile.waitForTimeout(300);assert(held&&(await read()).count===1,'Touch drag/install failed');
  const bounds=await mobile.locator('#scene').boundingBox(),before=(await read()).camera.azimuth;
  await touch('touchStart',bounds.x+30,bounds.y+30);for(let i=1;i<=20;i++)await touch('touchMove',bounds.x+30+i*6,bounds.y+30);await touch('touchEnd');await mobile.waitForTimeout(500);
  assert(Math.abs((await read()).camera.azimuth-before)>.1,'Touch orbit did not move camera');
  await mobile.locator('#music').tap();await mobile.waitForTimeout(1500);assert((await read()).music.time>0,'Touch failed to unlock audio');await mobile.locator('#music').tap();
  await mobile.locator('#mode-guided').tap();await mobile.locator('#auto').tap();await mobile.locator('#life').waitFor({timeout:12000});await mobile.locator('#life').tap();await mobile.locator('#moments').waitFor({timeout:8000});await mobile.locator('#moments summary').tap();await mobile.locator('#library-tab-together').tap();assert(await mobile.locator('#library-tab-together').getAttribute('aria-selected')==='true','Touch tab selection failed');
  await mobile.screenshot({path:'output/playwright/year1-touch-menu.png'});await mobile.setViewportSize({width:844,height:390});await mobile.waitForTimeout(500);
  assert(await mobile.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),'Touch landscape overflow');await mobile.screenshot({path:'output/playwright/year1-touch-landscape.png'});
  assert(!errors.length,errors.join(';'));return{passed:true,checks:['mobile touch context','CDP touch drag/install/highlight','one-finger orbit','tap unlocks music','touch build and menu tabs','portrait to landscape'],errors};
 }finally{await context.close();}
}
