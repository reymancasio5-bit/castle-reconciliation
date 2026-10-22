import * as XLSX from 'xlsx';
import {exportRows} from '../reports';
import type {State,Filters} from '../types';
function validFile(file:File){if(!/\.(csv|xlsx|xlsm)$/i.test(file.name)||file.size>8*1024*1024)throw Error('Choose a CSV/XLSX/XLSM file under 8 MB');}
async function read(file:File){validFile(file);return XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false,cellFormula:true,sheetRows:20002,raw:true});}
export async function inspectFile(file:File){return {sheets:(await read(file)).SheetNames};}
export async function readImportRows(file:File,sheet:string){const wb=await read(file);if(!wb.Sheets[sheet])throw Error('Choose a worksheet');const rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(wb.Sheets[sheet],{defval:'',raw:true});if(rows.length>20000)throw Error('Import limit is 20,000 rows');return rows;}
export function reportBytes(state:State,kind:'reservations'|'bundles',filters:Filters,format:'csv'|'xlsx'){
 const ws=XLSX.utils.json_to_sheet(exportRows(state,kind,filters));
 if(format==='csv')return XLSX.utils.sheet_to_csv(ws);
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,kind);
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet([{Exported:new Date().toISOString(),Filters:JSON.stringify(filters),Revenue:'Per row only. Aggregate rule is not defined; repeated values and adjustments are preserved.',Scope:'Whole related bundles; source transfer amounts are not bank deposits.',ToleranceCents:state.tolerance}]),'Read me');
 return XLSX.write(wb,{type:'array',bookType:'xlsx'});
}
export function downloadReport(state:State,kind:'reservations'|'bundles',filters:Filters,format:'csv'|'xlsx'){
 const bytes=reportBytes(state,kind,filters,format),url=URL.createObjectURL(new Blob([bytes],{type:format==='csv'?'text/csv;charset=utf-8':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
 const a=document.createElement('a');a.href=url;a.download='castle-'+kind+'.'+format;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

