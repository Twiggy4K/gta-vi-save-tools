'use strict';
const assert=require('node:assert/strict');const {inspect}=require('./checker.cjs');
const {K}=require('./inventory-model.cjs');
function fixture(options={}){
 const typed=x=>({$content:'int_array',$data:x});
 const owner={
  [K.main]:{[K.guid]:{$content:'int64_array',$data:['GUID0','GUID1','GUID2']},[K.parent]:typed([0,0,1]),[K.item]:typed([869874572,864635288,2084597891]),[K.slot]:typed([0,1490883802,2177639769]),[K.qty]:typed([1,1,100]),[K.flag]:[false,false,false]},
  [K.parents]:{$content:'int64_array',$data:['GUID0','GUID1']},[K.registration]:typed([1,17,33])
 };
 if(options.badParent)owner[K.main][K.parent].$data[2]=99;
 const block={Inventory:[owner],SecretPSN:'NEVER_INCLUDE_THIS_ACCOUNT',Path:'C:\\Private\\NEVER_INCLUDE_THIS_PATH',
  '$0x1e1e8a08':[{'$0xa662d8be':100,'$0x818f6f6d':100},{'$0xa662d8be':0,'$0x818f6f6d':options.badLedger?99:100}]};
 let blockText=JSON.stringify(block).replaceAll('"GUID0"','9007199254740992').replaceAll('"GUID1"','9007199254740993').replaceAll('"GUID2"',options.duplicateGuid?'9007199254740993':'9007199254740994');
 const rootText='{"CodeSaveBlocks":['+blockText+'],"ScriptSaveBlocks":[]}';
 const start=48,raw=Buffer.from(rootText),out=Buffer.alloc(Math.ceil((start+raw.length)/16)*16);out.write('JSAV');out.writeUInt32LE(3,4);out.writeUInt32LE(1,8);out.writeUInt32LE(start+Buffer.byteLength('{"CodeSaveBlocks":['),28);out.writeUInt32LE(Buffer.byteLength(blockText),32);raw.copy(out,start);return out;
}
let count=0;function test(name,fn){fn();count++;}
test('encoded ASAV rejected',()=>{assert(inspect(Buffer.from('ASAV')).findings.includes('GAME_BODY_STILL_ENCODED'));});
test('unknown binary rejected',()=>assert.equal(inspect(Buffer.from('random')).status,'unsupported'));
test('invalid JSAV rejected',()=>assert.equal(inspect(Buffer.from('JSAV')).status,'unsupported'));
test('general inventory discovered without 21-inventory assumption',()=>{const r=inspect(fixture());assert.equal(r.status,'inspectable');assert.equal(r.inventories.length,1);assert.equal(r.accounts[0].balance,100);assert.equal(r.ledgers[0].uniqueAccountAgreement,true);assert.equal(r.editingApproved,false);});
test('unsafe wide integers preserved and distinguished',()=>assert.equal(inspect(fixture()).inventories[0].exactGuidUnique,true));
test('duplicate exact GUID rejected',()=>assert.equal(inspect(fixture({duplicateGuid:true})).status,'inconsistent'));
test('broken parent rejected',()=>assert.equal(inspect(fixture({badParent:true})).status,'inconsistent'));
test('broken ledger rejected',()=>assert.equal(inspect(fixture({badLedger:true})).status,'inconsistent'));
test('allowlist excludes private canaries and GUID values',()=>{const text=JSON.stringify(inspect(fixture()));for(const canary of ['NEVER_INCLUDE','SecretPSN','9007199254740992','9007199254740993','9007199254740994'])assert(!text.includes(canary));});
test('read-only input unchanged',()=>{const input=fixture(),before=Buffer.from(input);inspect(input);assert(input.equals(before));});
test('oversized input rejected before parsing',()=>assert(inspect(Buffer.alloc(8388609)).findings.includes('INPUT_SIZE_UNSUPPORTED')));
test('unsupported JSAV version rejected',()=>{const input=fixture();input.writeUInt32LE(4,4);assert.equal(inspect(input).status,'unsupported');});
console.log(JSON.stringify({passed:count,networkRequests:0,saveWrites:0}));
module.exports={fixture};
