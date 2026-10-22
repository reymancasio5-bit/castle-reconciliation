import {test} from 'node:test';
import assert from 'node:assert/strict';
import {report} from '../lib/accounting';
import {exportRows} from '../lib/reports';
import {validateReservation} from '../lib/validation';
import {emptyState} from '../lib/workflows';
test('row revenues and adjustments survive validation and exports without an aggregate',()=>{
 const s=emptyState();
 s.reservations=[77220,29380,-10000,77220].map((payout,i)=>validateReservation({id:'PAY-'+i,reservationCode:'BOOKING',property:'Test House',guest:'Test Guest',checkin:'2026-01-01',checkout:'2026-01-05',payout,split:payout,payoutType:'split',currency:'CAD',arrival:'',sourceBundleAmount:null,sourceBundleId:'',bundleId:'',notes:''}));
 assert.equal(s.reservations[1].reservationCode,'BOOKING');
 const totals=report(s.reservations,[],{},1).CAD;
 assert.equal(totals.payout,null);
 assert.equal(totals.expected,173820);
 assert.deepEqual(exportRows(s,'reservations',{}).map(x=>x.Payout),[772.2,293.8,-100,772.2]);
});
