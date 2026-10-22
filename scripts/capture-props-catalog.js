async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.waitForFunction(()=>window.propCatalog);
 const names=await page.evaluate(()=>window.propCatalog.names),rendered=[];
 for(const name of names){const model=await page.evaluate(name=>window.propCatalog.show(name),name);await page.locator('canvas').screenshot({path:'readme-assets/'+name+'.png',omitBackground:true});rendered.push(model);}
 if(errors.length)throw Error(errors.join(';'));return{passed:true,rendered,errors};
}
