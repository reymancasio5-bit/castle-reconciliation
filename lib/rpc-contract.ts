import type {State,Member,Reservation,Bundle,PropertyMapping} from './types';
import type {ImportOptions} from './imports';
export type Revision=string;
export type Workspace={state:State;version:Revision;actor:Member};
export type WorkspaceAction=
 |{kind:'reservation';record:Reservation;create?:boolean}
 |{kind:'bundle';record:Bundle;create?:boolean}
 |{kind:'assign';ids:string[];bundleId:string}
 |{kind:'deleteReservation'|'deletePropertyMapping';id:string}
 |{kind:'deleteBundle';id:string;unassign:boolean}
 |{kind:'propertyMapping';record:PropertyMapping;applyExisting?:boolean;create?:boolean}
 |{kind:'settings';tolerance:number}
 |{kind:'member';email:string;role:'accountant'|'viewer'|'remove'};
export type RpcRequest={kind:'read'}|{kind:'mutate';version:Revision;action:WorkspaceAction}|{kind:'previewImport'|'commitImport';version:Revision;rows:Record<string,unknown>[];options:ImportOptions;file?:string};
export type RpcReply<T>={ok:true;data:T}|{ok:false;error:{code:string;message:string}};

