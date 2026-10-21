async page=>{
 await page.setViewportSize({width:1440,height:960});await page.evaluate(()=>localStorage.clear());await page.reload();await page.locator('#hint-toggle').waitFor();await page.waitForTimeout(1600);await page.evaluate(()=>document.fonts.ready);
 const read=()=>page.evaluate(()=>window.__brickWorld);
 const fonts=await page.evaluate(()=>Array.from(document.fonts).map(f=>({family:f.family,style:f.style,status:f.status})));
 if(!fonts.some(f=>f.family==='Anniversary WenKai'&&f.status==='loaded')||!fonts.some(f=>f.family==='Anniversary Latin'&&f.status==='loaded')||!fonts.some(f=>f.family==='Keepsake Script'&&f.status==='loaded'))throw Error('Local font pair not loaded '+JSON.stringify(fonts));
 await page.screenshot({path:'output/playwright/fonts-final-zh.png'});await page.locator('#language').click();await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'output/playwright/fonts-final-en.png'});await page.locator('#language').click();
 const fullOrbit=async()=>{
  let last=(await read()).camera.azimuth,total=0;
  const accumulate=async()=>{const now=(await read()).camera.azimuth;total+=Math.atan2(Math.sin(now-last),Math.cos(now-last));last=now;};
  await page.mouse.move(1370,320);await page.mouse.down();
  for(let n=1;n<=100;n++){await page.mouse.move(1370-1290*n/100,320);await accumulate();}
  await page.mouse.up();await page.waitForTimeout(2000);await accumulate();
  if(Math.abs(total)<Math.PI*2)throw Error('Orbit restricted: '+total);
  return total*180/Math.PI;
 };
 const freeDegrees=await fullOrbit();
 // Install an actual scattered part after circling the workbench. Camera must freeze during pickup.
 let placed=false;
 for(const offset of [{x:0,y:0},{x:4,y:0},{x:-4,y:0},{x:0,y:4},{x:0,y:-4},{x:8,y:0},{x:-8,y:0}]){
  const before=await read(),p=before.pieces.find(p=>p.character===0&&p.slot==='legs');
  await page.mouse.move(p.screen.x+offset.x,p.screen.y+offset.y);await page.mouse.down();await page.waitForTimeout(80);
  let held=await read();if(!held.pieces.some(p=>p.held)){await page.mouse.up();continue;}
  const frozen=held.camera.position;await page.mouse.move(p.target.x+offset.x,p.target.y+offset.y,{steps:24});
  held=await read();if(Math.hypot(...held.camera.position.map((n,i)=>n-frozen[i]))>1e-7)throw Error('Camera moved while dragging a piece');
  await page.mouse.up();await page.waitForTimeout(250);if((await read()).count===1){placed=true;break;}await page.waitForTimeout(500);
 }
 if(!placed)throw Error('Could not place real part after orbit');
 await page.screenshot({path:'output/playwright/orbit-free-build.png'});
 // A right drag over a real loose component must pan, not pick it up.
 const beforePan=await read(),p=beforePan.pieces.find(p=>!p.attached);
 await page.mouse.move(p.screen.x,p.screen.y);await page.mouse.down({button:'right'});await page.mouse.move(p.screen.x+80,p.screen.y+20,{steps:15});
 if((await read()).pieces.some(p=>p.held))throw Error('Right drag picked a piece');await page.mouse.up({button:'right'});await page.waitForTimeout(700);
 if(Math.hypot(...(await read()).camera.target.map((n,i)=>n-beforePan.camera.target[i]))<.2)throw Error('Right pan did not move camera target');
 await page.locator('#mode-guided').click();await page.locator('#attach').waitFor();await page.waitForTimeout(400);
 const guidedDegrees=await fullOrbit();const guidedBefore=await read();await page.waitForTimeout(500);
 if(Math.abs((await read()).camera.azimuth)<.001)throw Error('Guided camera snapped back to the default view');
 const g=(await read()).guided;await page.mouse.move(g.piece.x,g.piece.y);await page.mouse.down();const frozen=(await read()).camera.position;
 await page.mouse.move(g.target.x,g.target.y,{steps:25});
 if(Math.hypot(...(await read()).camera.position.map((n,i)=>n-frozen[i]))>1e-6)throw Error('Guided drag rotated camera');
 await page.mouse.up();await page.waitForTimeout(200);if((await read()).count!==1)throw Error('Guided placement failed after orbit');
 await page.screenshot({path:'output/playwright/orbit-guided-build.png'});
 // Both language layouts remain within a narrow viewport with their local fonts.
 await page.locator('#mode-free').click();await page.setViewportSize({width:390,height:844});await page.waitForTimeout(600);await page.evaluate(()=>document.fonts.ready);
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Chinese mobile overflow');
 await page.screenshot({path:'output/playwright/fonts-mobile-zh.png'});await page.locator('#language').click();await page.evaluate(()=>document.fonts.ready);
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('English mobile overflow');
 await page.screenshot({path:'output/playwright/fonts-mobile-en.png'});
 return {passed:true,freeDegrees,guidedDegrees,fonts,checks:['local Chinese and English font pair','360 degree orbit in free and guided modes','real placement after orbit','no camera drift while carrying parts','right drag pans over loose parts','Chinese and English mobile layouts']};
}
