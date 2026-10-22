/** The finite animation vocabulary. Future prompts may select these IDs; they
 * cannot create arbitrary geometry, code or unbounded timelines. */
import type {SoundCue} from './sound-effects';
export type ActionId='wave'|'hug'|'dance'|'kiss'|'shy'|'holdHands'|'highFive'|'beckon'|'look'|'sit'|'wait'|'stroll'|'approach'|'overtime'|'flower'|'gift';
export type PhaseName='approach'|'turn'|'gesture'|'depart';
export type Phase={name:PhaseName;duration?:number;spacing?:number;speed?:number;facing?:'partner'|'together'|'viewer';motion?:'stroll'};
export type ActionSpec={label:readonly[string,string];copy:readonly[string,string];participants:readonly number[];cue?:SoundCue;phases:readonly Phase[];exit:'separate'|'stay'};
const pair=(spacing:number,duration:number,facing:'partner'|'together'='partner'):Phase[]=>[
 {name:'approach',spacing,speed:1.5},{name:'turn',duration:.65,facing},
 {name:'gesture',duration,facing},{name:'depart',spacing:3.1,speed:1},
];
export const ACTIONS:Record<ActionId,ActionSpec>={
 overtime:{label:['加一会儿班','A little overtime'],copy:['陪你加一会儿班。','A little overtime, together.'],participants:[0,1],phases:[],exit:'stay'},
 flower:{label:['种一朵花','A flower for us'],copy:['种一朵花，送给我们。','A little flower, for us.'],participants:[0,1],phases:[],exit:'stay'},
 gift:{label:['送你一只包','A bag for you'],copy:['DJ 送给 YW 的爱马仕，是一份小小偏爱。','A Hermès gift from DJ to YW, with love.'],participants:[0,1],phases:[],exit:'stay'},
 wave:{label:['打个招呼','Say hello'],copy:['嘿，我在这里。','Hey, here I am.'],participants:[0,1],cue:'wave',phases:[{name:'turn',duration:.4,facing:'viewer'},{name:'gesture',duration:3.2,facing:'viewer'}],exit:'stay'},
 hug:{label:['抱抱','A hug'],copy:['世界那么大，还好有你。','A big world. My favourite place is with you.'],participants:[0,1],cue:'hug',phases:pair(1.2,2.8),exit:'separate'},
 dance:{label:['一起跳舞','A little dance'],copy:['和你，平常的一天也值得庆祝。','An ordinary day is worth a dance with you.'],participants:[0,1],cue:'dance',phases:[{name:'gesture',duration:5.5}],exit:'stay'},
 kiss:{label:['亲脸颊','A cheek kiss'],copy:['偷偷，亲一下你的脸颊。','Just a little kiss on your cheek.'],participants:[0,1],cue:'kiss',phases:[{name:'approach',spacing:2.5,speed:1.5},{name:'turn',duration:.6,facing:'partner'},...pair(1.04,2.8)],exit:'separate'},
 shy:{label:['羞羞','Feeling shy'],copy:['一年了，还是会害羞。','A year together, and you still make me shy.'],participants:[0,1],cue:'shy',phases:pair(2.5,3.8),exit:'separate'},
 holdHands:{label:['牵牵手','Hold hands'],copy:['你的手，刚刚好。','Your hand fits right here.'],participants:[0,1],cue:'holdHands',phases:pair(2.05,3.8,'together'),exit:'separate'},
 highFive:{label:['击个掌','A high five'],copy:['我们真棒。','Look at us go.'],participants:[0,1],cue:'highFive',phases:pair(2.1,2.8,'together'),exit:'separate'},
 beckon:{label:['过来呀','Come closer'],copy:['来这边，留了位置给你。','Over here. I saved you a place.'],participants:[0],cue:'wave',phases:pair(2.8,2.8),exit:'separate'},
 look:{label:['一起看风景','Side by side'],copy:['不赶路，陪你看一会儿。','No hurry. Just this view, with you.'],participants:[0,1],cue:'look',phases:pair(1.48,4.5,'together'),exit:'separate'},
 sit:{label:['坐一会','Sit awhile'],copy:['坐下来，慢慢陪你。','A little rest, together.'],participants:[0,1],cue:'look',phases:pair(1.9,5,'together'),exit:'separate'},
 wait:{label:['等你一下','Wait for you'],copy:['慢慢来，我等你。','Take your time. I’m right here.'],participants:[0],phases:[{name:'gesture',duration:3.2}],exit:'stay'},
 stroll:{label:['漫步一小段','A little stroll'],copy:['走一小段，再靠近一点。','A little wandering, a little closer.'],participants:[0,1],phases:[{name:'gesture',duration:4,motion:'stroll'}],exit:'stay'},
 approach:{label:['靠近一点','A little closer'],copy:['一步一步，走向你。','Step by step, back to you.'],participants:[0,1],phases:[{name:'approach',spacing:1.5,speed:1.2},{name:'turn',duration:.6,facing:'partner'}],exit:'stay'},
};
export const SEQUENCES={
 sweet:{label:['亲亲 · 羞羞 · 抱抱','Kiss · blush · hug'],steps:['kiss','shy','hug']},
 reunion:{label:['走着走着，抱抱你','Wander back to you'],steps:['stroll','wait','beckon','approach','hug']},
 together:{label:['跳支舞，再牵手','A dance, then your hand'],steps:['dance','holdHands','look']},
} satisfies Record<string,{label:readonly[string,string];steps:ActionId[]}>;
export type SequenceId=keyof typeof SEQUENCES;
export const LIBRARY_GROUPS=[
 {label:['小小心动','Little moments'],actions:['kiss','shy','holdHands','highFive']},
 {label:['慢慢陪你','Just being together'],actions:['beckon','look','sit','wait']},
] satisfies {label:readonly[string,string];actions:ActionId[]}[];
export const AUTO_ACTIONS:ActionId[]=['wave','shy','holdHands','beckon','look','wait'];

/** Prefer anything outside the recent window; exhaust small pools gracefully. */
export function chooseFresh<T>(options:readonly T[],recent:readonly T[],window=3,random=Math.random):T|undefined{
 const unseen=options.filter(value=>!recent.slice(-window).includes(value));
 const pool=unseen.length?unseen:options.filter(value=>value!==recent.at(-1));
 return pool[Math.floor(random()*pool.length)]??options[0];
}
