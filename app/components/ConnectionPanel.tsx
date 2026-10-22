import {useState} from 'react';
import {authorize,connect} from '@/lib/client/connection';
import type {Workspace} from '@/lib/rpc-contract';
export default function ConnectionPanel({onConnected}:{onConnected:(v:Workspace)=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function run(fn:()=>Promise<unknown>){setBusy(true);setError('');try{await fn();}catch(e){setError((e as Error).message)}finally{setBusy(false);}}
 return <section className="panel empty"><h2>Connect your Google workspace</h2><p>Use the Google account that has access to the Castle spreadsheet. First authorize Google, then return here and connect.</p><div className="heading-actions" style={{justifyContent:'center'}}><button className="button" disabled={busy} onClick={()=>run(authorize)}>1. Authorize Google</button><button className="primary" disabled={busy} onClick={()=>run(async()=>onConnected(await connect()))}>{busy?'Connecting…':'2. Connect'}</button></div>{error&&<p role="alert" className="error">{error}</p>}</section>;
}

