import {build} from 'esbuild';import fs from 'node:fs';
fs.mkdirSync('apps-script/dist',{recursive:true});
await build({entryPoints:['apps-script/src/entry.ts'],bundle:true,format:'iife',globalName:'CastleServer',platform:'neutral',target:'es2020',outfile:'apps-script/dist/Code.gs',banner:{js:"var structuredClone = function(v){return JSON.parse(JSON.stringify(v));}; var crypto = {randomUUID:function(){return Utilities.getUuid();}};"},footer:{js:"function doGet(e){return CastleServer.doGet(e)}\nfunction castleRpc(r){return CastleServer.castleRpc(r)}\nfunction setupWorkspace_(){return CastleServer.setupWorkspace_()}"}});
fs.copyFileSync('apps-script/src/Connection.html','apps-script/dist/Connection.html');fs.copyFileSync('apps-script/appsscript.json','apps-script/dist/appsscript.json');
console.log('Apps Script installation files: apps-script/dist');

