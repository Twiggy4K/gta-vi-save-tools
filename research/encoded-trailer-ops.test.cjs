'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {tokenFields,unpack3,makeEncodedOps,parseSetupPayload}=require('./encoded-trailer-ops.cjs');
test('setup parser preserves raw fields and expands packed state groups',()=>{
  const input=Buffer.alloc(277,255),copy=Buffer.from(input),state=parseSetupPayload(input);
  assert.equal(state.length,0x218);assert(state.subarray(8,0x110).every(x=>x===7));
  assert(state.subarray(0x118,0x1a8).every(x=>x===7));assert.equal(state[0x1a8],0);
  assert(state.subarray(0x1a9,0x1e9).every(x=>x===255));assert.equal(state.readBigUInt64LE(0x1f0),0xffffffffffffffffn);
  assert.deepEqual(input,copy);assert.throws(()=>parseSetupPayload(Buffer.alloc(276)));
});
const token=(prefix,count,tail,offset=0)=>BigInt(offset)|(BigInt(prefix)<<22n)|(BigInt(count)<<36n)|(BigInt(tail)<<50n);
function fixture(){return makeEncodedOps({mapByte:()=>0,lookupByte:i=>((i&7)+((i>>>8)&7)+((i>>>3)&1)),lookupWord:i=>(i&7)+((i>>>3)&1)});}
test('decodes independent token fields without Number precision loss',()=>{
  assert.deepEqual(tokenFields(token(1234,5678,12345,0x3abcde)),{offset:0x3abcde,prefix:1234,count:5678,tail:12345});
  assert.throws(()=>tokenFields(1));assert.throws(()=>tokenFields(-1n));
});
test('unpacks symbols crossing every bit alignment',()=>{
  const values=Array.from({length:258},(_,i)=>(i*5)&7),packed=Buffer.alloc(Math.ceil(values.length*3/8));
  for(let i=0;i<values.length;i++)for(let bit=0;bit<3;bit++)if(values[i]&(1<<bit)){const at=i*3+bit;packed[at>>>3]|=1<<(at&7);}
  assert.deepEqual([...unpack3(packed,258)],values);assert.throws(()=>unpack3(Buffer.alloc(1),3));
});
test('binary operation preserves carry across symbols and supports aliased output',()=>{
  const a=Buffer.from([7,0,5]),b=Buffer.from([7,0,1]),out=Buffer.alloc(3);
  fixture().binary(token(0,3,0),a,b,out);assert.deepEqual([...out],[6,1,6]);
  fixture().binary(token(0,3,0),a,b,a);assert.deepEqual(a,out);
});
test('prefix stage retains carry without writing its skipped output',()=>{
  const out=Buffer.alloc(2,255);
  fixture().shifted(token(1,2,0),Buffer.from([7,0,5]),Buffer.from([7,0,1]),out);
  assert.deepEqual([...out],[1,6]);
});
test('word-operation tail reuses input index 2 and the full carry',()=>{
  const seen=[],ops=makeEncodedOps({mapByte:()=>0,lookupByte:()=>0,lookupWord:i=>{seen.push(i);return i;}}),out=Buffer.alloc(2);
  ops.unaryWord(token(1,1,1),Buffer.from([1,2,4]),out);
  assert.deepEqual(seen,[1,2,6]);assert.deepEqual([...out],[2,6]);
});
test('shifted tail reads mapping symbols, not a supplied input stream',()=>{
  const seen=[],ops=makeEncodedOps({mapByte:i=>i+1,lookupByte:i=>{seen.push(i);return 0;},lookupWord:()=>0});
  ops.shifted(token(0,0,2),Buffer.alloc(0),Buffer.alloc(0),Buffer.alloc(2));
  assert.deepEqual(seen,[1<<11,2<<11]);
});
test('rejects truncated input/output and invalid table results',()=>{
  assert.throws(()=>fixture().binary(token(0,2,0),Buffer.alloc(1),Buffer.alloc(2),Buffer.alloc(2)),/bounds/);
  assert.throws(()=>fixture().shifted(token(0,2,0),Buffer.alloc(2),Buffer.alloc(2),Buffer.alloc(1)),/bounds/);
  const bad=makeEncodedOps({mapByte:()=>256,lookupByte:()=>0,lookupWord:()=>0});
  assert.throws(()=>bad.binary(token(0,1,0),Buffer.alloc(1),Buffer.alloc(1),Buffer.alloc(1)),/mapping/);
});
