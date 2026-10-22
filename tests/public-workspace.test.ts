import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createService} from '../apps-script/src/service';
import {emptyState} from '../lib/workflows';
import {autoMap} from '../lib/imports';

test('public visitors read and edit without consulting Google identity or staff roles',()=>{
 let state=emptyState(),revision=1;
 const service=createService({identity:()=>{throw Error('Google login must not be consulted')},admin:()=>{throw Error('No administrator required')},load:()=>({state,version:String(revision)}),save:(_before,after)=>{state=after;revision++},lock:fn=>fn()}, {publicAccess:true});
 assert.equal(service({kind:'read'}).actor.role,'public');
 const updated=service({kind:'mutate',version:'1',action:{kind:'settings',tolerance:3}});
 assert.equal(updated.state.tolerance,3);
 assert.equal(updated.state.audit[0].actor,'Public visitor');
 assert.throws(()=>service({kind:'mutate',version:'1',action:{kind:'settings',tolerance:4}}),/changed/);
 assert.throws(()=>service({kind:'mutate',version:'2',action:{kind:'member',email:'someone@example.test',role:'accountant'}}),/not available/);
 assert.throws(()=>service({kind:'mutate',version:'2',action:{kind:'settings',tolerance:-1}}),/Tolerance/);
 assert.equal(revision,2);
});

test('anonymous visitors can preview, import, edit and delete payment rows',()=>{
 let state=emptyState(),revision=1;
 const service=createService({identity:()=>'',admin:()=>'',load:()=>({state,version:String(revision)}),save:(_before,after)=>{state=after;revision++},lock:fn=>fn()}, {publicAccess:true});
 const rows=[{'Reservation Code':'PUBLIC-TEST','Property Name':'Test House','Guest Name':'Test Guest','Check-in Date':'2026-01-01','Check-out Date':'2026-01-03',Revenue:10,'Split to Castle':2}];
 const options={mode:'reservation',currency:'CAD',defaultType:'split',confirmLinks:false,mapping:autoMap(Object.keys(rows[0]))};
 const preview=service({kind:'previewImport',version:'1',rows,options});
 assert.equal(preview.preview.summary.failed,0);
 assert.equal(state.reservations.length,0);
 service({kind:'commitImport',version:'1',rows,options,file:'synthetic.csv'});
 assert.equal(state.reservations.length,1);
 assert.equal(state.reservations[0].split,200);
 const record={...state.reservations[0],notes:'Public edit'};
 service({kind:'mutate',version:'2',action:{kind:'reservation',record}});
 assert.equal(state.reservations[0].notes,'Public edit');
 service({kind:'mutate',version:'3',action:{kind:'deleteReservation',id:record.id}});
 assert.equal(state.reservations.length,0);
 assert.ok(state.audit.every(entry=>entry.actor==='Public visitor'));
});
