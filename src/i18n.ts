import {anniversary} from './anniversary';
export type Language='zh'|'en';
let language:Language=localStorage.getItem('little-world-language')==='en'?'en':'zh';
export const getLanguage=()=>language;
export function setLanguage(value:Language){language=value;localStorage.setItem('little-world-language',value);document.documentElement.lang=value==='zh'?'zh-CN':'en';}
export function t(zh:string,en:string){return language==='zh'?zh:en;}
export const slotNames={legs:['双腿','Legs'],torso:['身体','Body'],rightArm:['右臂','Right arm'],leftArm:['左臂','Left arm'],head:['头','Head'],hair:['头发','Hair']} as const;
export function person(index:number){return anniversary.names[index]??'';}
