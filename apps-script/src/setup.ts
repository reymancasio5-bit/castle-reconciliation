import {book,props,lock,META,metadataRequests,cellRequest} from './storage';
import {reservationSchema,bundleSchema,columnMap} from '../../lib/sheet-mapping';
declare const DriveApp:any,Sheets:any,SpreadsheetApp:any,Utilities:any,Session:any;
export function setupWorkspace_(){return lock(()=>{
 const owner=Session.getEffectiveUser().getEmail().toLowerCase();
 const b=book();let backupId=props().getProperty('BACKUP_ID');
 if(!backupId){const backup=DriveApp.getFileById(b.getId()).makeCopy(b.getName()+' - before Castle setup '+new Date().toISOString());backupId=backup.getId();props().setProperty('BACKUP_ID',backupId);}
 const requests:any[]=[];
 for(const [name,schema] of [['Reservation Payouts',reservationSchema],['Bundle Register',bundleSchema]] as const){
  const s=b.getSheetByName(name);if(!s)throw Error('Missing business sheet: '+name);
  const headers=s.getRange(1,1,1,s.getLastColumn()).getValues()[0];const map=columnMap(headers,schema);let col=headers.length;
  for(const [key,aliases]of Object.entries(schema))if(map[key]<0){map[key]=col++;requests.push(cellRequest(s.getSheetId(),0,map[key],aliases[0]));}
  if(col>s.getMaxColumns())requests.unshift({appendDimension:{sheetId:s.getSheetId(),dimension:'COLUMNS',length:col-s.getMaxColumns()}});
  if(name==='Reservation Payouts'){const rows=s.getDataRange().getValues();for(let i=1;i<rows.length;i++)if(rows[i][map.reservationCode]&&!rows[i][map.id])requests.push(cellRequest(s.getSheetId(),i,map.id,'PAY-'+Utilities.getUuid().toUpperCase()));}
 }
 if(requests.length)Sheets.Spreadsheets.batchUpdate({requests},b.getId());
 for(const [key,name]of Object.entries(META)){
  let sheet=b.getSheetByName(name);
  if(!sheet){sheet=b.insertSheet(name);sheet.getRange('A1').setValue('Castle JSON chunks - managed by app');
   const initial=key==='settings'?{members:[],tolerance:1}:[];
   Sheets.Spreadsheets.batchUpdate({requests:metadataRequests(sheet,initial)},b.getId());
  }
  if(key==='settings'){const protections=sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);const p=protections[0]||sheet.protect();p.setDescription('Castle deployment owner');p.addEditor(owner);for(const editor of p.getEditors())if(editor.getEmail().toLowerCase()!==owner)p.removeEditor(editor);if(p.canDomainEdit())p.setDomainEdit(false);}
 }
 props().setProperty('SCHEMA_VERSION','1');SpreadsheetApp.flush();return {backupId,initialized:true,spreadsheetId:b.getId()};
 });}

