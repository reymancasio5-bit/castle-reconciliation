import {request} from './connection';import type {Workspace,WorkspaceAction} from '../rpc-contract';
let queue:Promise<unknown>=Promise.resolve();
export function serialized<T>(fn:()=>Promise<T>):Promise<T>{const next=queue.then(fn,fn);queue=next.catch(()=>{});return next;}
export const readWorkspace=()=>serialized(()=>request<Workspace>({kind:'read'}));
export const mutateWorkspace=(version:string,action:WorkspaceAction)=>serialized(()=>request<Workspace>({kind:'mutate',version,action}));

