async page=>{
 return await page.evaluate(async()=>{
  const {AnniversaryMusic}=await import('/src/music.ts?check-ramp=v2');const music=new AnniversaryMusic();let paused=false;music.audio.play=()=>Promise.resolve();music.audio.pause=()=>{paused=true;};const raf=window.requestAnimationFrame,cancel=window.cancelAnimationFrame,frames=[];window.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};window.cancelAnimationFrame=()=>{};
  try{await music.toggle();frames.shift()(performance.now()-8);if(music.audio.volume!==0)throw Error('Pre-start frame must clamp to zero');frames.shift()(performance.now()+1200);if(Math.abs(music.audio.volume-.14)>.00001)throw Error('Fade-in incomplete');await music.toggle();frames.shift()(performance.now()-8);if(music.audio.volume>.14||music.audio.volume<0)throw Error('Fade-out out of range');frames.shift()(performance.now()+1200);if(music.audio.volume!==0||!paused||music.enabled)throw Error('Fade-out failed to pause');return{passed:true,checks:['RAF timestamp earlier than fade start','bounded media volume','fade-in','fade-out and pause']};}finally{window.requestAnimationFrame=raf;window.cancelAnimationFrame=cancel;}
 });
}
