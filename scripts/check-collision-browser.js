async page=>{
 const errors=[],read=()=>page.evaluate(()=>window.__brickWorld),assert=(v,m)=>{if(!v)throw Error(m);};page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('#mode-guided').click();await page.locator('#auto').click();await page.locator('#life').waitFor({timeout:12000});await page.locator('#life').click();await page.locator('#moments').waitFor({timeout:10000});await page.locator('#moments summary').click();if((await read()).autoInteractions)await page.locator('#surprises').click();await page.keyboard.press('Escape');
 await page.evaluate(()=>{window.__brickWorld={positions:[[-4,0],[4,0]],targets:[[4,0],[-4,0]],flower:[0,0]};});
 let minimumFlower=Infinity,minimumPeople=Infinity;
 for(let n=0;n<100;n++){await page.waitForTimeout(80);const s=await read();for(const f of s.figures)minimumFlower=Math.min(minimumFlower,Math.hypot(f.x,f.z)-1);minimumPeople=Math.min(minimumPeople,Math.hypot(s.figures[0].x-s.figures[1].x,s.figures[0].z-s.figures[1].z));}
 assert(minimumFlower>=.70,'Walked through flower '+minimumFlower);assert(minimumPeople>=2.30,'People crossed while wandering '+minimumPeople);
 const results=[];
 for(const positions of [[[-3,-3],[-2.8,-3]],[[10,6],[10.15,6]]]){
  await page.evaluate(positions=>{window.__brickWorld={positions};},positions);await page.locator('#hug').click();
  await page.waitForFunction(()=>window.__brickWorld.action?.phase==='gesture',null,{timeout:90000});let s=await read();
  assert(s.arena&&s.props.dropped===4,'No clear-space transaction');
  const nearest=s.obstacles.filter(o=>o.kind!=='flower').reduce((m,o)=>{const p=s.arena.center,dx=o.b.x-o.a.x,dz=o.b.z-o.a.z,t=Math.max(0,Math.min(1,((p.x-o.a.x)*dx+(p.z-o.a.z)*dz)/(dx*dx+dz*dz||1)));return Math.min(m,Math.hypot(p.x-o.a.x-dx*t,p.z-o.a.z-dz*t)-o.radius);},Infinity);
  assert(nearest>3.45,'Interaction still among dropped accessories '+nearest);assert(Math.hypot(s.figures[0].x-s.figures[1].x,s.figures[0].z-s.figures[1].z)>1.05,'People overlapped');
  await page.screenshot({path:`output/playwright/collision-clearing-${results.length}.png`});await page.locator('#stop').click();await page.waitForFunction(()=>window.__brickWorld.activity==='wander',null,{timeout:90000});s=await read();assert(s.props.held===4&&!s.props.dropped,'Close original positions prevented pickup');results.push({positions,nearest,stands:s.props.origins.map(o=>o.stand)});
 }
 // An advanced scene must also use a nearby clearing with a shifted anchor.
 await page.locator('#moments summary').click();await page.locator('#library-tab-life').click();await page.locator('#overtime').click();await page.waitForFunction(()=>window.__brickWorld.action?.phase==='work',null,{timeout:90000});let s=await read();assert(s.action.anchor&&s.props.dropped===4,'Office not relocated');await page.screenshot({path:'output/playwright/collision-office.png'});await page.locator('#stop').click();await page.waitForFunction(()=>window.__brickWorld.activity==='wander',null,{timeout:90000});assert((await read()).props.held===4,'Office recovery blocked');assert(!errors.length,errors.join(';'));
 return{passed:true,minimumFlower,minimumPeople,results,errors};
}
