import {test} from 'node:test';import assert from 'node:assert/strict';
import {money,expected,reconcile,report} from '../lib/accounting';
const r=(type='split',payout:number|null=62158,split:number|null=9324)=>({id:'TEST000001',payoutType:type,payout,split,currency:'CAD',bundleId:'b',checkout:'2026-05-17',statementMonth:'2026-05',property:'Example House'});
test('sample original payouts and Castle shares remain separate',()=>{const a=[r(),{...r(),id:'TEST000002',payout:98561,split:14784}];assert.equal(a.reduce((s,x)=>s+x.payout!,0),160719);assert.equal(a.reduce((s,x)=>s+expected(x)!,0),24108)});
test('all payout types and unknown values',()=>{assert.equal(expected(r('castle')),62158);assert.equal(expected(r('owner')),0);assert.equal(expected(r('split',null,null)),null)});
test('money parser rejects malformed values, preserves negatives',()=>{assert.equal(money('1,234.56'),123456);assert.equal(money('-3.21'),-321);for(const x of ['', '1x','1,2', 'NaN', 'Infinity', '#VALUE!' ])assert.throws(()=>money(x))});
test('missing bank evidence and incomplete samples never match',()=>{assert.equal(reconcile({id:'b',currency:'CAD',actual:null,depositDate:''},[r()],1).status,'Awaiting deposit');assert.equal(reconcile({id:'b',currency:'CAD',actual:55816,depositDate:'2026-05-22'},[r()],1).status,'Review')});
test('tolerance boundaries, unknowns, currency and no eligible assignments',()=>{const b={id:'b',currency:'CAD',actual:9325,depositDate:'2026-05-22'};assert.equal(reconcile(b,[r()],1).status,'Matched');assert.equal(reconcile({...b,actual:9326},[r()],1).status,'Review');assert.equal(reconcile(b,[r('split',null,null)],1).status,'Incomplete data');assert.equal(reconcile(b,[],1).status,'Review');assert.throws(()=>reconcile(b,[{...r(),currency:'USD'}],1))});
test('partial filters retain whole bundle and deduplicate bank deposits',()=>{const a=[r(),{...r(),id:'other',property:'Other',split:100}];const b=[{id:'b',currency:'CAD',actual:9424,depositDate:'2026-05-22'}];const x=report(a,b,{property:'Example House'},1);assert.equal(x.CAD.actual,9424);assert.equal(x.CAD.matched,1);assert.equal(x.CAD.expected,9324)});
test('known larger source transfer prevents a false match on a partial bank amount',()=>{const b={id:'b',currency:'CAD',actual:9324,depositDate:'2026-05-22',sourceAmount:55816};assert.equal(reconcile(b,[r()],1).status,'Review')});
test('installments leave aggregate revenue undefined but sum each Castle payment including filtered results',()=>{const rows=[{...r(),id:'A / B1',reservationCode:'A',payout:149480,split:2585,bundleId:'B1'},{...r(),id:'A / B2',reservationCode:'A',payout:149480,split:24321,bundleId:'B2'}];const totals=report(rows,[],{},1).CAD;assert.equal(totals.payout,null);assert.equal(totals.expected,26906);assert.equal(report(rows,[],{property:'Example House'},1).CAD.payout,null);});


test('money rounds extra decimals consistently including negative adjustments and formula residue',()=>{
 for(const [input,cents] of [['123.456',12346],['1.005',101],['-1.005',-101],['10.075',1008],['0.30000000000000004',30],['$1,234.567',123457],['(23.456)',-2346],['.125',13],['-.125',-13],['-0.001',0]] as const)assert.equal(money(input),cents,input);
 assert.equal(money(1e-8),0);
 assert.throws(()=>money(Infinity));
});
