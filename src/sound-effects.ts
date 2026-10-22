export type SoundCue='snap'|'drop'|'complete'|'awaken'|'wave'|'hug'|'dance'|'kiss'|'shy'|'holdHands'|'highFive'|'look'|'type'|'arrive'|'plant'|'gift'|'boxOpen'|'clasp';

/** Soft, original Web Audio cues. All envelopes start/end at zero to avoid clicks. */
export function scheduleCue(ctx:BaseAudioContext,output:AudioNode,cue:SoundCue,at:number,strength=1){
 const tone=(hz:number,delay:number,duration:number,level:number,kind:OscillatorType='sine',end=hz)=>{
  const osc=ctx.createOscillator(),gain=ctx.createGain(),start=at+delay;
  osc.type=kind;osc.frequency.setValueAtTime(hz,start);osc.frequency.exponentialRampToValueAtTime(end,start+duration);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(level,start+.007);gain.gain.exponentialRampToValueAtTime(.00001,start+duration);gain.gain.setValueAtTime(0,start+duration+.008);
  osc.connect(gain);gain.connect(output);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(start);osc.stop(start+duration+.012);
 };
 const tap=(level:number,cutoff:number,duration:number)=>{
  const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/data.length*7);
  const noise=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();noise.buffer=buffer;filter.type='lowpass';filter.frequency.value=cutoff;
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(level,at+.002);gain.gain.exponentialRampToValueAtTime(.00001,at+duration);
  noise.connect(filter);filter.connect(gain);gain.connect(output);noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect();};noise.start(at);
 };
 const phrase=(notes:number[],spacing:number,duration:number,level:number)=>notes.forEach((hz,i)=>tone(hz,i*spacing,duration,level));
 switch(cue){
  case 'boxOpen':tap(.018,1300,.08);tone(520,.02,.12,.012);break;
  case 'clasp':tap(.018,2200,.025);tone(900,.005,.055,.012);break;
  case 'type':tap(.014,1800,.025);break;
  case 'arrive':tone(392,0,.14,.018);break;
  case 'plant':phrase([523.25,783.99],.13,.3,.025);break;
  case 'gift':phrase([659.25,880,987.77],.12,.3,.025);break;
  case 'snap':tap(.15,2600,.045);tone(1150,.006,.055,.07,'triangle',730);break;
  case 'drop':{
   const force=Math.max(.15,Math.min(1,strength));tap(.13*force,1500+force*900,.055);tone(310,0,.065,.09*force,'sine',165);break;
  }
  case 'complete':phrase([523.25,659.25,783.99],.14,.55,.065);break;
  case 'awaken':phrase([261.63,392,523.25,659.25,783.99],.22,.75,.075);tone(1046.5,.95,.85,.025);break;
  case 'wave':tone(783.99,0,.2,.07,'sine',880);tone(987.77,.18,.28,.06);break;
  case 'hug':tone(261.63,0,.8,.075);tone(329.63,.09,.8,.05);tone(392,.18,.85,.05);break;
  case 'kiss':tone(659.25,0,.24,.045,'sine',739.99);tone(987.77,.12,.4,.032);break;
  case 'holdHands':tone(329.63,0,.65,.04);tone(493.88,.18,.65,.025);break;
  case 'highFive':tap(.075,1900,.035);tone(880,.01,.13,.035,'triangle',660);break;
  case 'look':tone(261.63,0,.85,.025);tone(392,.16,.85,.02);break;
  case 'shy':tone(523.25,0,.42,.04);tone(659.25,.2,.52,.03);break;
  case 'dance':phrase([523.25,659.25,783.99,659.25,587.33,783.99],.17,.18,.065);break;
 }
}

/** Music and sound effects are independent. Audio unlocks only in a user gesture. */
export class SoundEffects{
 readonly enabled=true;
 private context?:AudioContext;
 private master?:GainNode;
 private nextImpact=0;
 private counts:Record<SoundCue,number>={snap:0,drop:0,complete:0,awaken:0,wave:0,hug:0,dance:0,kiss:0,shy:0,holdHands:0,highFive:0,look:0,type:0,arrive:0,plant:0,gift:0,boxOpen:0,clasp:0};
 unlock(){
  try{
   if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=.28;this.master.connect(this.context.destination);}
   if(this.context.state==='suspended')void this.context.resume().catch(()=>{});
  }catch{/* A silent fallback keeps the gift usable when audio is unavailable. */}
 }
 play(cue:SoundCue,strength=1){
  const ctx=this.context;if(!ctx||ctx.state!=='running'||!this.master)return;
  // Impacts at rest stay silent; limit simultaneous clatter from an initial scatter.
  if(cue==='drop'){if(strength<.045||ctx.currentTime<this.nextImpact)return;this.nextImpact=ctx.currentTime+.035;}
  this.counts[cue]++;scheduleCue(ctx,this.master,cue,ctx.currentTime+.004,strength);
 }
 get snapshot(){return {enabled:this.enabled,state:this.context?.state??'locked',counts:{...this.counts},gain:this.master?.gain.value??0};}
}
