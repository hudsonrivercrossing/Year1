import {publicAsset} from './public-asset';
/** Background music only starts in a click gesture; it never autoplays on arrival. */
export class AnniversaryMusic {
 readonly audio=new Audio(publicAsset('audio/little-days.mp3'));
 enabled=false;
 private fade?:number;
 constructor(){this.audio.loop=true;this.audio.preload='metadata';this.audio.volume=0;}
 async toggle(){
  if(this.enabled){this.enabled=false;this.ramp(0,()=>this.audio.pause());return false;}
  this.audio.volume=0;
  await this.audio.play();this.enabled=true;this.ramp(.14);return true;
 }
 private ramp(target:number,done?:()=>void){if(this.fade)cancelAnimationFrame(this.fade);const start=this.audio.volume,at=performance.now();
  const tick=(now:number)=>{const p=Math.max(0,Math.min(1,(now-at)/1100));this.audio.volume=Math.max(0,Math.min(1,start+(target-start)*p));if(p<1)this.fade=requestAnimationFrame(tick);else{this.fade=undefined;done?.();}};this.fade=requestAnimationFrame(tick);
 }
}
