'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./fixtures.cjs'),{inspect,edit}=require('./editor.cjs');
test('stash-only zero cash and zero bank maps without creating cash',()=>{
 const b=fixture({bank:0,savings:0,cash:0,stash:3183,absentCash:true}),r=inspect(b).report;
 assert.equal(r.mappingReady,true);assert.equal(r.balances.stash,3183);assert.equal(r.editable.cash,false);
 const e=edit(b,{stash:3182,cash:0,checking:0,savings:0});assert.equal(inspect(e.bytes).report.balances.stash,3182);
 assert.throws(()=>edit(b,{stash:3183,cash:1,checking:0,savings:0}),/creating one/);
});
test('cash and stash edited separately with zero bank',()=>{
 const b=fixture({bank:0,savings:0,cash:338,stash:3001});
 const e=edit(b,{stash:3000,cash:317,checking:0,savings:0});const r=inspect(e.bytes).report;
 assert.equal(r.balances.stash,3000);assert.equal(r.balances.cash,317);assert.equal(e.manifest.addedRows,0);
});
test('stash with bank keeps bank and savings unchanged',()=>{
 const b=fixture({bank:1100,savings:600,cash:3559,stash:3001});
 assert.throws(()=>edit(b,{stash:3000,cash:3559,checking:1101,savings:600}),/disabled/);
 const e=edit(b,{stash:3000,cash:3559,checking:1100,savings:600});assert.equal(inspect(e.bytes).report.balances.checking,1100);
});
test('stash no-op is byte-identical',()=>{
 const b=fixture({bank:0,savings:0,cash:338,stash:3001});assert.deepEqual(edit(b,{stash:3001,cash:338,checking:0,savings:0}).bytes,b);
});
test('ASAV gives actionable game-level decode error',()=>assert.throws(()=>inspect(Buffer.from('ASAV12345678')),/Local GarlicMgr/));
test('stash policy rejects excessive or fractional targets',()=>{
 const b=fixture({bank:0,savings:0,cash:0,stash:3183,absentCash:true});
 assert.throws(()=>edit(b,{stash:20001,cash:0,checking:0,savings:0}),/policy/);
 assert.throws(()=>edit(b,{stash:3182.5,cash:0,checking:0,savings:0}),/whole/);
});
