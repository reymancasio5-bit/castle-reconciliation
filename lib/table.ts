export function compareValues(a:unknown,b:unknown):number{if(typeof a==='number'&&typeof b==='number')return a-b;return String(a??'').localeCompare(String(b??''))}
