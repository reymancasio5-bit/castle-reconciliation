import {mapSheetRows,reservationSchema,bundleSchema,columnMap,changesFor, type Schema} from '../../lib/sheet-mapping';
import type {State} from '../../lib/types';
declare const SpreadsheetApp:any,PropertiesService:any,Session:any,Utilities:any,Sheets:any,LockService:any;
export const META={settings:'_Castle Settings',properties:'_Castle Properties',imports:'_Castle Imports',audit:'_Castle Audit'};
export function props(){return PropertiesService.getScriptProperties();}
export function book(){const id=props().getProperty('SPREADSHEET_ID');if(!id)throw Error('Owner setup required: SPREADSHEET_ID');return SpreadsheetApp.openById(id);}
export function identity(){return Session.getActiveUser().getEmail()||'';}
export function admin(){const a=props().getProperty('ADMIN_EMAIL');if(!a)throw Error('Owner setup required: ADMIN_EMAIL');return a.toLowerCase();}
export function lock<T>(fn:()=>T):T{const l=LockService.getScriptLock();if(!l.tryLock(30000))throw Error('Another save is running. Try again.');try{return fn();}finally{l.releaseLock();}}
function values(sheet:any,tz:string){if(sheet.getLastRow()>20001||sheet.getLastColumn()>100)throw Error('Worksheet capacity exceeded: '+sheet.getName());return sheet.getDataRange().getValues().map((row:any[])=>row.map(v=>Object.prototype.toString.call(v)==='[object Date]'?Utilities.formatDate(v,tz,'yyyy-MM-dd'):v));}
function json(sheet:any){const chunks=sheet.getDataRange().getValues().slice(1).map((r:any[])=>r[0]||'').join('');return JSON.parse(chunks||'[]');}
export function snapshot(){const b=book(),tz=b.getSpreadsheetTimeZone();const tabs:any={};
 for(const name of ['Reservation Payouts','Bundle Register',...Object.values(META)]){const s=b.getSheetByName(name);if(!s)throw Error('Run setupWorkspace before connecting: missing '+name);tabs[name]={sheet:s,values:values(s,tz),formulas:s.getDataRange().getFormulas()};}
 const fingerprint=JSON.stringify(Object.entries(tabs).map(([name,t]:any)=>[name,t.values,t.formulas]));
 const version=Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,fingerprint));
 const mapped=mapSheetRows(tabs['Reservation Payouts'].values,tabs['Bundle Register'].values,{currency:props().getProperty('DEFAULT_CURRENCY')||'CAD',timeZone:tz});
 const settings=json(tabs[META.settings].sheet);if(!settings||!Array.isArray(settings.members)||!Number.isInteger(settings.tolerance))throw Error('Invalid workspace settings');
 const properties=json(tabs[META.properties].sheet);
 const state:State={...mapped,properties,members:settings.members,tolerance:settings.tolerance,imports:json(tabs[META.imports].sheet),audit:json(tabs[META.audit].sheet),source:{kind:'google-sheets',readOnly:false,readAt:new Date().toISOString(),timeZone:tz,warnings:mapped.warnings}};
 return {b,tabs,state,version};
}
export function cellRequest(sheetId:number,row:number,column:number,value:any){return {updateCells:{range:{sheetId,startRowIndex:row,endRowIndex:row+1,startColumnIndex:column,endColumnIndex:column+1},rows:[{values:[{userEnteredValue:typeof value==='number'?{numberValue:value}:typeof value==='boolean'?{boolValue:value}:{stringValue:String(value??'')}}]}],fields:'userEnteredValue'}};}
export function metadataRequests(sheet:any,value:any){const encoded=JSON.stringify(value);const chunks=encoded.match(/[\s\S]{1,30000}/g)||['[]'];if(chunks.length+1>sheet.getMaxRows())throw Error('Metadata capacity reached; extend '+sheet.getName());
 const rows=Array.from({length:Math.max(chunks.length,sheet.getLastRow()-1)},(_,i)=>({values:[{userEnteredValue:{stringValue:chunks[i]||''}}]}));
 return [{updateCells:{range:{sheetId:sheet.getSheetId(),startRowIndex:1,endRowIndex:rows.length+1,startColumnIndex:0,endColumnIndex:1},rows,fields:'userEnteredValue'}}];
}
export function save(before:State,after:State,version:string){
 const current=snapshot();if(current.version!==version)throw Error('Data changed. Refresh before saving.');
 const requests:any[]=[];
 for(const [name,schema,records,previous] of [['Reservation Payouts',reservationSchema,after.reservations,before.reservations],['Bundle Register',bundleSchema,after.bundles,before.bundles]] as const){
  const tab=current.tabs[name];
  // Virtual bundles remain virtual unless explicitly changed or created.
  const existingIds=new Set(tab.values.slice(1).map((r:any[])=>r[columnMap(tab.values[0],schema).id]));
  const filtered=records.filter((r:any)=>existingIds.has(r.id)||!previous.some((p:any)=>p.id===r.id&&JSON.stringify(p)===JSON.stringify(r)));
  const changes=changesFor(tab.values,filtered,schema);
  const end=Math.max(0,...changes.map(c=>c.row+1));if(end>tab.sheet.getMaxRows())requests.push({appendDimension:{sheetId:tab.sheet.getSheetId(),dimension:'ROWS',length:end-tab.sheet.getMaxRows()}});
  for(const c of changes){if(tab.formulas[c.row]?.[c.column])throw Error(name+' row '+(c.row+1)+': edit this formula in Google Sheets before replacing it');requests.push(cellRequest(tab.sheet.getSheetId(),c.row,c.column,c.value));}
 }
 const nextMeta:any={settings:{members:after.members,tolerance:after.tolerance},properties:after.properties||[],imports:after.imports,audit:after.audit};
 const oldMeta:any={settings:{members:before.members,tolerance:before.tolerance},properties:before.properties||[],imports:before.imports,audit:before.audit};
 for(const key of Object.keys(META) as (keyof typeof META)[])if(JSON.stringify(nextMeta[key])!==JSON.stringify(oldMeta[key]))requests.push(...metadataRequests(current.tabs[META[key]].sheet,nextMeta[key]));
 if(requests.length)Sheets.Spreadsheets.batchUpdate({requests},current.b.getId());
 SpreadsheetApp.flush();
}
export function load(){const s=snapshot();return {state:s.state,version:s.version};}

