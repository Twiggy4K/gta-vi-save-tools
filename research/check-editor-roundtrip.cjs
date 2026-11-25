'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createBodyCodec}=require('./story-body-codec.cjs'),{createTrailerGenerator}=require('./trailer-generator.cjs'),{createEditor,findCash}=require('./story-editor-core.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),editor=createEditor(createBodyCodec(),createTrailerGenerator()),samples=[];
for(const name of ['SARC0000','SARC0001','SARC0002','SARC0002-control','memory.dat']){
 const file=__dirname+'/../private-fixtures/payloads/'+name,input=fs.readFileSync(file),originalHash=hash(input),info=editor.inspect(input),edits=[];
 assert(editor.editCash(input,info.cash.value).output.equals(input));
 for(const amount of [0,999,20000]){
  const result=editor.editCash(input,amount),checked=editor.inspect(result.output),expected=info.doc.root;
  let parent=expected;for(const key of info.cash.path.slice(0,-1))parent=parent[key];const last=info.cash.path.at(-1),old=parent[last];parent[last]=amount;
  assert.deepEqual(checked.doc.root,expected);parent[last]=old;
  assert.equal(checked.cash.value,amount);assert(checked.doc.entries.length===82);assert.equal(hash(input),originalHash);
  const restored=editor.editCash(result.output,info.cash.value),restoredInfo=editor.inspect(restored.output);assert.deepEqual(restoredInfo.doc.root,info.doc.root);
  edits.push({amount,changedExactlyOneNumericField:true,headerAndTrailerValid:true,indexedBlocks:82,reverseEditRestoresOriginalDocument:true,outputBytes:result.output.length});
 }
 const tampered=Buffer.from(input);tampered[0x170]^=1;assert.throws(()=>editor.inspect(tampered));assert.throws(()=>editor.editCash(input,20001));
 const tablePath=info.cash.path.slice(0,-3);let table=info.doc.root;for(const key of tablePath)table=table[key];
 const originalIndex=info.cash.path.at(-1),otherIndex=originalIndex===0?1:0;
 const columns=Object.values(table).map(c=>c.$data);for(const column of columns)[column[originalIndex],column[otherIndex]]=[column[otherIndex],column[originalIndex]];
 assert.equal(findCash(info.doc).path.at(-1),otherIndex);
 for(const column of columns)column[originalIndex]=column[otherIndex];assert.throws(()=>findCash(info.doc),/exactly one/);
 assert.equal(hash(fs.readFileSync(file)),originalHash);samples.push({name,before:info.cash.value,noOpByteIdentical:true,edits,tamperedInputRejected:true,rowRelocationSupported:true,ambiguousIdentityRejected:true,originalUnchanged:true});
}
const report={date:'2026-11-23',samples,localRebuildValidated:true,consoleAcceptanceVerified:false,privatePlaintextWritten:false,modifiedSaveFilesWritten:false};
fs.writeFileSync(__dirname+'/editor-roundtrip-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
