import {apply,roleFor} from '../../lib/workflows';
import {stageImport,commitImport} from '../../lib/imports';
import type {State} from '../../lib/types';
export type Storage={identity:()=>string;admin:()=>string;load:()=>{state:State;version:string};save:(before:State,after:State,version:string)=>void;lock:<T>(fn:()=>T)=>T};
export function createService(storage:Storage,options:{publicAccess?:boolean}={}){return function dispatch(request:any):any{
 if(!request||typeof request!=='object'||JSON.stringify(request).length>8000000)throw Error('Invalid or oversized request');
 const email=options.publicAccess?'Public visitor':storage.identity().trim().toLowerCase();if(!email)throw Error('Sign in with Google and grant the requested permissions');
 const run=()=>{
 const current=storage.load();const role=options.publicAccess?'public':roleFor({email},current.state.members,storage.admin());if(!role)throw Error('Your account has no workspace access');
 const actor:import('../../lib/types').Member={email,role};if(request.kind==='read')return {...current,actor};
 if(!['mutate','previewImport','commitImport'].includes(request.kind))throw Error('Unknown operation');
 if(role==='viewer')throw Error('Read-only access');
 if(request.version!==current.version)throw Error('Data changed. Refresh and review before saving or previewing again.');
 if(request.kind==='mutate'){
  if(!request.action||typeof request.action.kind!=='string')throw Error('Invalid action');
  if(options.publicAccess&&request.action.kind==='member')throw Error('Staff roles are not available in this public workspace');
  const next=apply(current.state,request.action,actor);storage.save(current.state,next,current.version);return {...storage.load(),actor};
 }
 if(!Array.isArray(request.rows)||request.rows.length>20000||!request.options||typeof request.options.mapping!=='object')throw Error('Invalid import rows or mapping');
 const preview=stageImport(request.rows,request.options,current.state);
 if(request.kind==='previewImport')return {preview,version:current.version};
 if(typeof request.file!=='string'||request.file.length>300)throw Error('Invalid filename');
 const result=commitImport(current.state,preview,actor,request.file);
 storage.save(current.state,result.state,current.version);
 return {...storage.load(),actor,preview,summary:result.summary};
 };
 return request.kind==='read'?run():storage.lock(run);
};}

