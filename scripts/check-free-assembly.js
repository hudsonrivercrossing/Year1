async page=>{
 await page.setViewportSize({width:1440,height:960});await page.evaluate(()=>localStorage.clear());await page.reload();
 await page.locator('#hint-toggle').waitFor();await page.waitForTimeout(1600);
 const read=()=>page.evaluate(()=>window.__brickWorld);
 const positions=(await read()).pieces.map(p=>({slot:p.slot,character:p.character,position:p.position}));
 for(let character=0;character<2;character++)for(const slot of ['legs','torso','rightArm','leftArm','head','hair']){
  let attached=false;
  for(const offset of [{x:0,y:0},{x:3,y:0},{x:-3,y:0},{x:0,y:3},{x:0,y:-3},{x:6,y:0},{x:-6,y:0},{x:0,y:6},{x:0,y:-6}]){
   const state=await read(),p=state.pieces.find(p=>p.character===character&&p.slot===slot);
   await page.mouse.move(p.screen.x+offset.x,p.screen.y+offset.y);await page.mouse.down();await page.mouse.move(p.target.x+offset.x,p.target.y+offset.y,{steps:24});await page.mouse.up();await page.waitForTimeout(180);
   const after=await read();attached=after.count===12||after.pieces.find(p=>p.character===character&&p.slot===slot)?.attached;
   if(attached)break;await page.waitForTimeout(600);
  }
  if(!attached)throw Error('Failed real scattered drag '+character+' '+slot+' state='+JSON.stringify(await read()));
 }
 await page.screenshot({path:'output/playwright/anniversary-ready-zh.png'});
 await page.locator('#life').click();await page.locator('#hug').waitFor({timeout:6000});
 await page.locator('#hug').click();await page.waitForFunction(()=>window.__brickWorld.activity==='wander',{timeout:30000});
 return {passed:true,checks:['all 12 real drags across table depths','assembled and awake','hug after whole-table assembly'],positions};
}
