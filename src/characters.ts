/** Stable part IDs + attachment transforms; swap geometry without rewriting behavior. */
import definitions from './character-definitions.json';
export const characters = definitions;
export const partIds = ['yw-long-bangs-approx','99930','3626cp8r','90540','3899','33120','6254','3626cp8y','3626cp01','973','3815','3816','3817','3818','3819','3820','3901','87991','4530'];
export const slots = [
 {id:'legs', label:'双腿组件', hint:'先搭稳脚步'},
 {id:'torso', label:'躯干', hint:'把身体放到双腿上'},
 {id:'rightArm', label:'右臂组件', hint:'连接肩部'},
 {id:'leftArm', label:'左臂组件', hint:'另一边也接上'},
 {id:'head', label:'头部', hint:'笑容就位'},
 {id:'hair', label:'头发', hint:'最后一块！'},
] as const;
export type SlotId = typeof slots[number]['id'];
