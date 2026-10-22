import {createService} from './service';
import {identity,admin,load,save,lock,props} from './storage';
export {setupWorkspace_} from './setup';
declare const HtmlService:any;
export function castleRpc(request:unknown){try{return {ok:true,data:createService({identity,admin,load,save,lock})(request)};}catch(e){return {ok:false,error:{code:'REQUEST_FAILED',message:e instanceof Error?e.message:'Request failed'}};}}
export function doGet(e:any){
 const origin=props().getProperty('ALLOWED_ORIGIN');if(!origin||!/^https:\/\/[^/]+$/.test(origin))throw Error('Set ALLOWED_ORIGIN to your exact HTTPS GitHub Pages origin');
 const nonce=String(e?.parameter?.nonce||'');if(nonce&&!/^[a-f0-9]{64}$/.test(nonce))throw Error('Invalid connection');
 const template=HtmlService.createTemplateFromFile('Connection');
 template.origin=JSON.stringify(origin).replace(/</g,'\\u003c');template.nonce=JSON.stringify(nonce);
 return template.evaluate().setTitle('Castle Google connection').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

