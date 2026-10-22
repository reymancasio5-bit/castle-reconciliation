import {useEffect,useRef,useState} from 'react';
import {connect} from '@/lib/client/connection';
import type {Workspace} from '@/lib/rpc-contract';
export default function ConnectionPanel({onConnected}:{onConnected:(v:Workspace)=>void}){
 const [busy,setBusy]=useState(true),[error,setError]=useState('');
 const callback=useRef(onConnected);callback.current=onConnected;
 const attempt=useRef(0);
 async function load(){const id=++attempt.current;setBusy(true);setError('');try{const workspace=await connect();if(id===attempt.current)callback.current(workspace);}catch(e){if(id===attempt.current)setError((e as Error).message);}finally{if(id===attempt.current)setBusy(false);}}
 useEffect(()=>{void load();return()=>{attempt.current++;};},[]);
 return <section className="panel empty"><h2>{busy?'Loading shared workspace':'Workspace connection unavailable'}</h2><p>Anyone with the link can view and edit. No Google sign-in is required.</p>{error&&<p role="alert" className="error">{error}</p>}{!busy&&<button className="primary" onClick={()=>void load()}>Retry connection</button>}</section>;
}
