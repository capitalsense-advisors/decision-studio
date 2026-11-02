import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statusFrom } from './ipo-status.mjs';
test('status parsing does not mistake future openings for open offers',()=>{
 for(const status of ['Opens 5 Nov','Opening soon','Not yet open','Upcoming']) assert.equal(statusFrom(status),'upcoming');
 for(const status of ['Open','Live','Open now']) assert.equal(statusFrom(status),'open');
 assert.equal(statusFrom('Closed'),'closed'); assert.equal(statusFrom('Listed'),'listed');
});
