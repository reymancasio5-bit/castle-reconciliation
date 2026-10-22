export function validBridgeOrigin(origin:string){return /^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(origin);}
export function validEnvelope(value:any,nonce:string){return !!nonce&&value?.castle===true&&value.nonce===nonce;}

