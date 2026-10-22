async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));const assert=(c,m)=>{if(!c)throw Error(m);};const read=()=>page.evaluate(()=>window.__brickWorld),results=[];
 await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('#mode-guided').click();await page.locator('#auto').click();await page.locator('#life').waitFor({timeout:9000});let s=await read();const buildElevation=90-s.camera.polar*180/Math.PI;assert(buildElevation>58&&buildElevation<62,'Phone build elevation '+buildElevation);await page.screenshot({path:'output/playwright/angle-v4-build-after.png'});
 await page.locator('#life').click();await page.locator('#moments').waitFor({timeout:6000});if((await read()).autoInteractions){await page.locator('#moments summary').click();await page.locator('#surprises').click();await page.keyboard.press('Escape');}
 for(const id of ['holdHands','highFive','kiss','hug']){
  if(id==='hug')await page.locator('#hug').click();else{await page.locator('#moments summary').click();await page.locator('#library-tab-affection').click();await page.locator('#'+id).click();}
  const deadline=Date.now()+35000;let contact,earlyGap=Infinity;
  while(Date.now()<deadline){s=await read();if(s.activity===id&&s.action?.phase==='gesture'){
    if(s.action.contact){const[a,b]=s.figures,[pa,pb]=s.action.contact.hands,dx=b.x-a.x,dz=b.z-a.z;const gap=((pb[0]-pa[0])*dx+(pb[2]-pa[2])*dz)/Math.hypot(dx,dz);earlyGap=Math.min(earlyGap,gap);assert(gap>.03,'Hands crossed during '+id+' '+gap);}
    if(s.action.time>.9){contact=s.action.contact;break;}
   }await page.waitForTimeout(35);
  }
  assert(s.activity===id&&s.action?.phase==='gesture','Gesture never reached '+id);assert(s.props.dropped===4&&s.props.held===0,'Props were not put down '+id);
  if(contact){assert(contact.distance>.16&&contact.distance<.28,'Hand alignment '+id+' '+contact.distance);if(id==='highFive')assert(contact.hands.every(p=>p[1]>3.05),'High five is below face level');}
  if(id==='hug')assert(Math.abs(s.figures[0].arms[0][0]-s.figures[1].arms[0][0])>.15,'Hug arms are not staggered');
  const elevation=90-s.camera.polar*180/Math.PI;assert(elevation>34&&elevation<38,'Play view too steep '+elevation);
  await page.screenshot({path:`output/playwright/motion-v4-${id}-after.png`});
  if(id==='kiss'){
   const scene=await page.locator('#scene').boundingBox();await page.mouse.move(scene.x+scene.width*.8,scene.y+scene.height*.6);await page.mouse.down();await page.mouse.move(scene.x+scene.width*.5,scene.y+scene.height*.55,{steps:16});await page.mouse.up();assert(!(await read()).autoFraming,'Manual orbit did not keep ownership');await page.screenshot({path:'output/playwright/motion-v4-kiss-orbit.png'});await page.locator('#fit').click();
  }
  if(id==='highFive'||id==='hug')await page.locator('#stop').click();
  await page.waitForFunction(()=>window.__brickWorld.activity==='wander',null,{timeout:45000});s=await read();assert(s.props.held===4&&!s.props.dropped&&!s.queue.length&&!s.effects&&!s.cancelling,'Action cleanup failed '+id);assert(s.figures.every(f=>Math.abs(f.heightOffset)<.001&&f.waist.slice(0,3).every(v=>Math.abs(v)<.001)),'Pose not reset '+id);
  results.push({id,contact:contact?.distance,earlyGap:contact?earlyGap:undefined,cancelled:id==='highFive'||id==='hug'});
 }
 assert(!errors.length,errors.join(';'));return{passed:true,buildElevation,results,errors};
}
