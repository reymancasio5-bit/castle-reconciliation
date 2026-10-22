import {validBridgeOrigin,validEnvelope} from './protocol';
import type {RpcRequest,Workspace} from '../rpc-contract';
let frame:HTMLIFrameElement|null=null,peer:Window|null=null,origin='',nonce='';
let configPromise:Promise<string>|null=null;
let sequence=0;let closed=true;
const pending=new Map<string,{resolve:(v:any)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
export async function endpoint(){return configPromise??=(async()=>{const r=await fetch(new URL('config.json',document.baseURI),{cache:'no-store'});if(!r.ok)throw Error('Missing config.json');const c=await r.json();if(!/^https:\/\/script.google.com\/macros\/s\/[\w-]+\/exec$/.test(c.appsScriptUrl||''))throw Error('Configure the Apps Script /exec URL in public/config.json before connecting');return c.appsScriptUrl;})().catch(e=>{configPromise=null;throw e});}
export async function authorize(){const popup=window.open('about:blank','castle-google-authorization','width=700,height=700');if(!popup)throw Error('Allow popups to authorize the Google connection');try{popup.location.href=await endpoint();}catch(e){popup.close();throw e;}}
function belongsToFrame(source:MessageEventSource|null):boolean{
 try{let w=source as Window|null;for(let depth=0;w&&depth<8;depth++){if(w===frame?.contentWindow)return true;const parent=w.parent;if(parent===w)break;w=parent;}}catch{}return false;
}
let listener:((e:MessageEvent)=>void)|null=null;
export function disconnect(){closed=true;peer=null;origin='';nonce='';if(listener)window.removeEventListener('message',listener);listener=null;frame?.remove();frame=null;for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Google connection closed'));}pending.clear();}
export async function connect():Promise<Workspace>{
 const url=await endpoint();disconnect();closed=false;nonce=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
 await new Promise<void>((resolve,reject)=>{
  const timer=setTimeout(()=>{disconnect();reject(Error('Google connection timed out. Open Google authorization, grant access, then return and Connect. Check ALLOWED_ORIGIN in Apps Script.'));},25000);
  listener=(e:MessageEvent)=>{
   const m=e.data;if(!validEnvelope(m,nonce)||!validBridgeOrigin(e.origin)||!belongsToFrame(e.source))return;
   if(m.type==='ready'&&!peer){peer=e.source as Window;origin=e.origin;clearTimeout(timer);peer.postMessage({castle:true,type:'ack',nonce},origin);resolve();return;}
   if(e.source!==peer||e.origin!==origin||m.type!=='reply')return;
   const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);
   if(m.reply?.ok===true)p.resolve(m.reply.data);else p.reject(Error(m.reply?.error?.message||'Google request failed'));
  };window.addEventListener('message',listener);
  frame=document.createElement('iframe');frame.hidden=true;frame.title='Castle authenticated Google connection';frame.src=url+'?nonce='+nonce;document.body.appendChild(frame);
 });
 return request<Workspace>({kind:'read'});
}
export function request<T>(request:RpcRequest):Promise<T>{
 if(closed||!peer)return Promise.reject(Error('Connect to Google before accessing the workspace'));
 const id=String(++sequence);return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{pending.delete(id);reject(Error('Google request timed out. Refresh before retrying a save; it may already have completed.'));},60000);
  pending.set(id,{resolve,reject,timer});peer!.postMessage({castle:true,type:'request',nonce,id,request},origin);
 });
}

