import {test} from 'node:test';import assert from 'node:assert/strict';import {draftRevision} from '../lib/client/draft';
test('an edit retains its opening revision after a workspace refresh',()=>{assert.equal(draftRevision({version:'opened'},'refreshed'),'opened');assert.equal(draftRevision(null,'current'),'current')});
