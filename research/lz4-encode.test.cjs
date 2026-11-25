'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{encodeBlock}=require('./lz4-encode.cjs'),{decodeBlock}=require('./lz4-block.cjs');
test('LZ4 encoder round trips boundaries, noise and repetitive data',()=>{
 for(const n of [0,1,4,5,11,12,15,16,255,270,65535,65536,100000])for(const kind of [0,1,2]){
  let seed=42;const input=Buffer.alloc(n);for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;input[i]=kind===0?0:kind===1?i%251:seed>>>24;}
  const copy=Buffer.from(input),packed=encodeBlock(input);assert.deepEqual(decodeBlock(packed,n),input);assert.deepEqual(input,copy);
 }
});
test('LZ4 compressor shrinks repetitive data',()=>{assert(encodeBlock(Buffer.alloc(10000,65)).length<100);assert.throws(()=>encodeBlock('no'));});
