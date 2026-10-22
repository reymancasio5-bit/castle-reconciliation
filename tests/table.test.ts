import {test} from 'node:test';import assert from 'node:assert/strict';import {compareValues} from '../lib/table';
test('financial table sorting compares amounts numerically',()=>{assert.ok(compareValues(100000,20000)>0);assert.ok(compareValues(9324,14784)<0);assert.ok(compareValues('2026-05-01','2026-06-01')<0)});
