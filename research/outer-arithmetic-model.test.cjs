'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {makeModel,parseReviewedText}=require('./outer-arithmetic-model.cjs');
const entry=0x145613250n;
function model(lines){
  const rows=lines.map(([op,...args],i)=>({at:entry+BigInt(i),op,args,ripTarget:null}));
  return makeModel(Buffer.alloc(64),{offset:(r,n)=>{if(r<0||r+n>64)throw new RangeError('Static range');return r;}},{ops:{}},[rows]);
}
test('listing parser excludes wrapped byte-only rows and retains full immediate',()=>{
  const rows=parseReviewedText('   145613250:\t48 b9 70 47 00 00 20 \tmovabs rcx,0x40012000004770\n   145613257:\t01 40 00 \n   14561325a:\tc3                   \tret\n');
  assert.equal(rows.length,2);assert.equal(rows[0].args[1],'0x40012000004770');assert.equal(rows[1].op,'ret');
});
test('model preserves partial registers and zero extends 32-bit writes',()=>{
  const m=model([['movabs','rax','0xffffffffffffffff'],['mov','eax','0x12345678'],['mov','al','0xab'],['mov','QWORD PTR [rcx]','rax'],['ret']]),out=m.alloc(8);
  m.call(0x5613250,[out]);assert.equal(m.read(out,8).readBigUInt64LE(),0x123456abn);
});
test('model respects signed versus unsigned branch conditions',()=>{
  const m=model([['mov','eax','0xffffffff'],['cmp','eax','0x0'],['jl','0x145613255'],['mov','DWORD PTR [rcx]','0x0'],['ret'],['mov','DWORD PTR [rcx]','0x1'],['ret']]),out=m.alloc(4);
  m.call(0x5613250,[out]);assert.equal(m.read(out,4).readUInt32LE(),1);
});
test('model copies SIMD buffers without aliasing or widening stores',()=>{
  const m=model([['vmovups','xmm0','XMMWORD PTR [rcx]'],['vmovups','XMMWORD PTR [rdx]','xmm0'],['ret']]);
  const input=m.alloc(Buffer.from(Array.from({length:16},(_,i)=>i))),out=m.alloc(Buffer.alloc(32,255));m.call(0x5613250,[input,out]);
  assert.deepEqual(m.read(out,16),m.read(input,16));assert(m.read(out+16n,16).every(v=>v===255));
});
test('model rejects non-allowlisted calls and writes outside isolated memory',()=>{
  const imports=model([['call','0x140123456'],['ret']]);assert.throws(()=>imports.call(0x5613250,[]),/allowlist/);
  const writes=model([['mov','BYTE PTR [rcx]','0x1'],['ret']]);assert.throws(()=>writes.call(0x5613250,[0x140000000n]),/outside model memory/);
});
