import {test} from 'node:test';import assert from 'node:assert/strict';import * as XLSX from 'xlsx';
import {reportBytes} from '../lib/client/files';import {emptyState} from '../lib/workflows';
test('CSV and XLSX exports work without a server',()=>{const state=emptyState();const csv=reportBytes(state,'reservations',{},'csv');assert.equal(typeof csv,'string');const bytes=reportBytes(state,'bundles',{},'xlsx');const b=XLSX.read(bytes,{type:'array'});assert.deepEqual(b.SheetNames,['bundles','Read me']);});
