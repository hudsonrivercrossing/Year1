async page=>{
 await page.setViewportSize({width:1440,height:960});
 await page.evaluate(()=>localStorage.clear());await page.reload();
 await page.locator('#hint-toggle').waitFor();await page.waitForTimeout(1800);
 const read=()=>page.evaluate(()=>window.__brickWorld);
 let state=await read();
 if(state.pieces.length!==12||state.world.width!==28)throw Error('Missing expanded table pieces');
 const xs=state.pieces.map(p=>p.position[0]),zs=state.pieces.map(p=>p.position[2]);
 if(Math.min(...xs)>-5||Math.max(...xs)<5||Math.min(...zs)>-4||Math.max(...zs)<4)throw Error('Not scattered across table');
 if(await page.locator('header,footer').count())throw Error('Header/footer not removed');
 if((await page.locator('body').innerText()).includes('2025')||(await page.locator('body').innerText()).includes('2026'))throw Error('Date remains visible');
 await page.locator('#hint-toggle').click();await page.waitForTimeout(150);
 state=await read();if(state.hintsOn||state.pieces.some(p=>!p.hintVisible))throw Error('Permanent silhouettes hidden');
 if(!await page.locator('#hint').isVisible()||!await page.locator('#connect').isVisible())throw Error('Highlight switch changed unrelated controls');
 await page.locator('#language').click();
 await page.getByRole('heading',{name:'Experience the world together.',exact:true}).waitFor();
 state=await read();if(state.count!==0||state.hintsOn||state.language!=='en')throw Error('Language reset state');
 await page.screenshot({path:'output/playwright/anniversary-en-no-hints.png'});
 await page.locator('#music').click();
 await page.waitForFunction(()=>window.__brickWorld.music.enabled&&!window.__brickWorld.music.paused&&window.__brickWorld.music.time>.3,{timeout:10000});
 await page.locator('#language').click();if(!(await read()).music.enabled)throw Error('Language stopped music');
 await page.locator('#music').click();
 await page.waitForFunction(()=>window.__brickWorld.music.paused&&!window.__brickWorld.music.enabled,{timeout:4000});
 await page.locator('#hint-toggle').click();
 await page.waitForTimeout(100);
 if((await read()).pieces.some(p=>!p.hintVisible))throw Error('Hints did not return');
 // Dragging a real piece must keep the camera fixed while a picked piece is held.
 state=await read();let leg=state.pieces.find(p=>p.character===0&&p.slot==='legs');
 const drag=async(p,offset)=>{await page.mouse.move(p.screen.x+offset.x,p.screen.y+offset.y);await page.mouse.down();await page.mouse.move(p.target.x+offset.x,p.target.y+offset.y,{steps:25});await page.mouse.up();};
 let attached=false;
 for(const offset of [{x:0,y:0},{x:4,y:0},{x:-4,y:0},{x:0,y:4},{x:0,y:-4}]){
  state=await read();leg=state.pieces.find(p=>p.character===0&&p.slot==='legs');await drag(leg,offset);await page.waitForTimeout(200);if((await read()).count===1){attached=true;break;}await page.waitForTimeout(700);
 }
 if(!attached)throw Error('Real drag failed with panning controls');
 // Switching language preserves already connected components.
 await page.locator('#language').click();if((await read()).count!==1)throw Error('Language lost assembly');
 // Finish via the accessible hint/placement path; parts remain dependency checked.
 for(let i=0;i<11;i++){await page.locator('#hint').click();await page.locator('#connect').click();}
 if((await read()).count!==12)throw Error('Assembly did not finish');
 await page.screenshot({path:'output/playwright/anniversary-ready-en.png'});
 await page.locator('#life').click();await page.locator('#hug').waitFor({timeout:6000});
 await page.locator('#hug').click();await page.waitForFunction(()=>window.__brickWorld.activity==='wander',{timeout:30000});
 await page.locator('#language').click();
 await page.screenshot({path:'output/playwright/anniversary-play-zh.png'});
 await page.locator('#reset').click();
 await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('#hint-toggle').waitFor();await page.waitForTimeout(1500);
 state=await read();
 if(state.pieces.length!==12)throw Error('Mobile pieces missing');
 const outside=state.pieces.filter(p=>p.screen.x<10||p.screen.x>380||p.screen.y<240||p.screen.y>730);
 if(outside.length)throw Error('Scattered mobile pieces out of overview: '+JSON.stringify(outside));
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow');
 await page.screenshot({path:'output/playwright/anniversary-mobile-zh.png'});
 await page.locator('#language').click();await page.locator('#hint-toggle').click();
 await page.screenshot({path:'output/playwright/anniversary-mobile-en.png'});
 return {passed:true,checks:['whole table scatter','no header/footer/dates','highlight switch preserves outlines','bilingual state preservation','actual music start-stop','real drag while pan enabled','all pieces complete','hug returns','mobile overview contains every piece']};
}
