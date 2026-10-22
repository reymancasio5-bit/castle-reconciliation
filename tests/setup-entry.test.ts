import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('generated setupWorkspace is runnable by the owner and rejects anonymous visitors',()=>{
 execFileSync(process.execPath,['scripts/build-apps-script.mjs']);
 let active='',calls=0;
 const context:any={Session:{getActiveUser:()=>({getEmail:()=>active}),getEffectiveUser:()=>({getEmail:()=> 'owner@example.test'})}};
 runInNewContext(readFileSync('apps-script/dist/Code.gs','utf8'),context);
 context.CastleServer={setupWorkspace_:()=>{calls++;return {initialized:true}}};
 assert.equal(typeof context.setupWorkspace,'function');
 assert.throws(()=>context.setupWorkspace(),/script owner/);
 active='visitor@example.test';
 assert.throws(()=>context.setupWorkspace(),/script owner/);
 assert.equal(calls,0);
 active='OWNER@example.test';
 assert.deepEqual(context.setupWorkspace(),{initialized:true});
 assert.equal(calls,1);
});

