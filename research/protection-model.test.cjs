'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {makeBlockTransform,makeCounterStream}=require('./protection-model.cjs');
function params(){return {
  inputMaps:Array.from({length:16},()=>Uint8Array.from({length:256},(_,i)=>i)),
  outputMaps:Array.from({length:16},()=>Uint8Array.from({length:256},(_,i)=>i)),
  mixTables:Array.from({length:16},(_,j)=>Uint32Array.from({length:256},(_,i)=>(i<<(24-8*(j%4)))>>>0)),
  roundWords:new Uint32Array(60)
};}
test('synthetic identity tables reduce to 14 row rotations',()=>{
  const input=Buffer.from(Array.from({length:16},(_,i)=>i));
  const expected=Buffer.from([0,9,2,11,4,13,6,15,8,1,10,3,12,5,14,7]);
  assert.deepEqual(makeBlockTransform(params())(input),expected);
});
test('13 nonzero synthetic round additions have the expected parity',()=>{
  const p=params();p.roundWords.fill(0x01010101,4,56);
  const expected=Buffer.from([0,9,2,11,4,13,6,15,8,1,10,3,12,5,14,7].map(x=>x^1));
  assert.deepEqual(makeBlockTransform(p)(Buffer.from(Array.from({length:16},(_,i)=>i))),expected);
});
test('parameters and input buffers remain isolated',()=>{
  const p=params(),fn=makeBlockTransform(p),input=Buffer.alloc(16),before=Buffer.from(input);
  p.roundWords.fill(0xffffffff);p.inputMaps[0].fill(255);
  assert.deepEqual(fn(input),Buffer.alloc(16));assert.deepEqual(input,before);
});
test('counter uses its initial value before big-endian carry and respects width',()=>{
  const seen=[],ctr=Buffer.alloc(16);ctr[14]=0xaa;ctr[15]=255;
  const fn=makeCounterStream(b=>{seen.push(Buffer.from(b));return b;},ctr,1);
  fn(Buffer.alloc(33));assert.equal(seen.length,3);
  assert.equal(seen[0][15],255);assert.equal(seen[1][15],0);assert.equal(seen[2][15],1);
  assert.equal(seen[1][14],0xaa);assert.equal(ctr[15],255);
});
test('arbitrary chunk boundaries preserve keystream and XOR symmetry',()=>{
  const block=makeBlockTransform(params()),ctr=Buffer.alloc(16),input=Buffer.from(Array.from({length:1001},(_,i)=>(i*37)&255));
  ctr[14]=255;ctr[15]=250;
  const all=makeCounterStream(block,ctr)(input),chunks=makeCounterStream(block,ctr);
  const parts=[];let at=0;for(const size of [0,1,15,17,33,127,808]){parts.push(chunks(input.subarray(at,at+size)));at+=size;}
  assert.equal(at,input.length);assert.deepEqual(Buffer.concat(parts),all);
  assert.deepEqual(makeCounterStream(block,ctr)(all),input);
});
test('rejects malformed parameters and blocks',()=>{
  assert.throws(()=>makeBlockTransform({...params(),roundWords:new Uint32Array(55)}));
  assert.throws(()=>makeBlockTransform(params())(Buffer.alloc(15)));
  assert.throws(()=>makeCounterStream(x=>x,Buffer.alloc(16),0));
  assert.throws(()=>makeCounterStream(()=>Buffer.alloc(15),Buffer.alloc(16))(Buffer.alloc(1)));
});
