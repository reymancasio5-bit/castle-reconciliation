import {money} from './accounting';
import {validateReservation,validateBundle} from './validation';
import type {Reservation,Bundle} from './types';
export type Schema=Record<string,string[]>;
export const reservationSchema:Schema={
 property:['Property Name','Internal Property Name'],statementMonth:['Statement Month'],
 reservationCode:['Reservation Code','Reservation ID'],guest:['Guest Name','Guest'],checkin:['Check-in Date'],checkout:['Check-out Date'],
 payout:['Revenue','Payout','Original Payout'],split:['Split to Castle'],sourceBundleAmount:['Airbnb Payment Bundle Amount (Paid to castle)','Airbnb Payment Bundle Amount'],
 arrival:['Arriving by Date'],bundleId:['Bundle ID / Reference','Bundle ID'],notes:['Notes'],
 id:['Payment ID'],currency:['Currency'],payoutType:['Payout Type'],airbnbListing:['Airbnb Listing Name'],propertyId:['Property ID'],
 sourceBundleId:['Source Bundle ID'],locks:['Castle Locks'],deleted:['Castle Deleted']
};
export const bundleSchema:Schema={id:['Bundle ID / Reference','Bundle ID'],depositDate:['Bank Deposit Date','Actual Bank Deposit Date'],
 actual:['Bank Bundle Amount','Bank Deposit Amount'],notes:['Notes'],currency:['Currency'],reference:['Bank Transaction Reference'],
 paymentDate:['Airbnb Payment Date'],arrival:['Expected Arrival Date'],sourceAmount:['Source Transfer Amount'],locks:['Castle Locks'],deleted:['Castle Deleted']};
const norm=(v:unknown)=>String(v??'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
export function columnMap(headers:unknown[],schema:Schema){return Object.fromEntries(Object.entries(schema).map(([k,aliases])=>{
 const matches=headers.map((h,i)=>aliases.some(a=>norm(a)===norm(h))?i:-1).filter(i=>i>=0);
 if(k==='property'&&matches.length===0&&norm(headers[1])==='statementmonth'&&norm(headers[2])==='reservationcode')matches.push(0);
 if(matches.length>1)throw Error('Duplicate header: '+aliases[0]);return [k,matches[0]??-1];
}));}
const amounts=new Set(['payout','split','sourceBundleAmount','actual','sourceAmount']);
const dates=new Set(['checkin','checkout','arrival','depositDate','paymentDate']);
const blank=(v:unknown)=>v===undefined||v===null||v==='';
function decode(k:string,v:any):any{
 if(amounts.has(k))return blank(v)?null:money(String(v));
 if(dates.has(k)&&typeof v==='number')return new Date(Date.UTC(1899,11,30)+Math.floor(v)*86400000).toISOString().slice(0,10);
 if(k==='locks'){if(blank(v))return [];const parsed=JSON.parse(String(v));if(!Array.isArray(parsed)||parsed.some(x=>typeof x!=='string'))throw Error('Invalid Castle Locks');return parsed;}
 if(k==='payoutType')return ({'Full Payout to Castle':'castle','Split Payout':'split','Full Payout to Owner':'owner'} as any)[v]||v||'split';
 if(k==='statementMonth')return String(v??'').replace(/^(\d{4})(\d{2})$/,'$1-$2');
 return String(v??'').trim();
}
function encode(k:string,v:any){if(amounts.has(k))return v==null?'':v/100;if(k==='locks')return JSON.stringify(v??[]);if(k==='payoutType')return ({castle:'Full Payout to Castle',split:'Split Payout',owner:'Full Payout to Owner'} as any)[v]||v;return v??'';}
export function readRecords(data:unknown[][],schema:Schema){const map=columnMap(data[0]??[],schema);return data.slice(1).flatMap((row,index)=>{
 if(String(row[map.deleted]??'').toUpperCase()==='TRUE')return [];
 const indicator=schema===reservationSchema?'reservationCode':'id';
 if(blank(row[map[indicator]])){
  if(Object.entries(map).some(([k,col])=>!['deleted','locks','id','payoutType','currency'].includes(k)&&col>=0&&!blank(row[col])))throw Error('Row '+(index+2)+': missing '+schema[indicator][0]);
  return [];
 }
 const result:any={sourceRow:index+2};for(const [key,col]of Object.entries(map))result[key]=decode(key,row[col]);
 return [result];
});}
export function mapSheetRows(reservations:unknown[][],banks:unknown[][],options:{currency:string;timeZone:string}){
 const warnings:string[]=[];const ids=new Set<string>();
 const rs:Reservation[]=readRecords(reservations,reservationSchema).map(r=>{
  if(!r.id)throw Error('Run setupWorkspace_ first: missing Payment ID on row '+r.sourceRow);
  if(ids.has(r.id))throw Error('Duplicate Payment ID: '+r.id);ids.add(r.id);
  return validateReservation({...r,currency:r.currency||options.currency});
 });
 const bs:Bundle[]=readRecords(banks,bundleSchema).map(b=>validateBundle({...b,currency:b.currency||options.currency}));
 const byId=new Map<string,Bundle>();for(const b of bs){if(byId.has(b.id))throw Error('Duplicate Bundle ID: '+b.id);byId.set(b.id,b);}
 for(const r of rs){if(!r.bundleId)continue;let b=byId.get(r.bundleId);
  if(!b){b=validateBundle({id:r.bundleId,currency:r.currency,actual:null,sourceAmount:null,paymentDate:'',arrival:'',depositDate:'',reference:'',notes:''});bs.push(b);byId.set(b.id,b);}
  if(b.currency!==r.currency)throw Error('Bundle currency mismatch: '+b.id);
  if(r.sourceBundleAmount!==null){if(b.sourceAmount!==null&&b.sourceAmount!==r.sourceBundleAmount)warnings.push('Different source transfer references for bundle '+b.id);else b.sourceAmount=r.sourceBundleAmount;}
  if(r.arrival>b.arrival)b.arrival=r.arrival;
 }
 return {reservations:rs,bundles:bs,warnings:[...new Set(warnings)]};
}
export type CellChange={row:number;column:number;value:string|number|boolean};
export function changesFor(data:unknown[][],records:any[],schema:Schema):CellChange[]{
 const columns=columnMap(data[0]??[],schema);const existing=readRecords(data,schema);
 const used=new Set(records.map(r=>r.id));const changes:CellChange[]=[];
 let nextRow=Math.max(1,...data.map((row,i)=>i>0&&[columns.id,columns.reservationCode,columns.deleted].some(c=>c>=0&&!blank(row[c]))?i+1:1)); // 0-based append index; skip active data, reuse template-only rows
 for(const record of records){const old=existing.find(r=>r.id===record.id);const row=old?old.sourceRow-1:nextRow++;
  for(const [key,col] of Object.entries(columns)){if(col<0||key==='deleted')continue;
   const value=encode(key,record[key]);
   // Compare semantic values so native date and currency cells aren't unnecessarily rewritten.
   if(old&&JSON.stringify(old[key]??'')===JSON.stringify(record[key]??''))continue;
   if(!old&&value==='')continue;
   changes.push({row,column:col,value});
  }
 }
 for(const old of existing)if(!used.has(old.id)){if(columns.deleted<0)throw Error('Missing Castle Deleted column');changes.push({row:old.sourceRow-1,column:columns.deleted,value:'TRUE'});}
 return changes;
}

