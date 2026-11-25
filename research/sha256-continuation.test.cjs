'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {IV,compress,continueHash}=require('./sha256-continuation.cjs');
test('SHA-256 model matches independent Node implementation across padding boundaries',()=>{
  for(const n of [0,1,3,55,56,63,64,65,119,120,127,128,1024,330000]){
    const b=Buffer.from(Array.from({length:n},(_,i)=>(i*73+19)&255));
    assert.deepEqual(continueHash(b),crypto.createHash('sha256').update(b).digest());
  }
});
test('continuation preserves the already processed prefix length',()=>{
  const b=Buffer.from(Array.from({length:205},(_,i)=>i&255));let s=IV;
  for(let at=0;at<128;at+=64)s=compress(s,b.subarray(at,at+64));
  assert.deepEqual(continueHash(b.subarray(128),s,128n),crypto.createHash('sha256').update(b).digest());
  assert.notDeepEqual(continueHash(b.subarray(128),s,0n),continueHash(b.subarray(128),s,128n));
});
test('rejects malformed block sizes and processed lengths',()=>{
  assert.throws(()=>compress(IV,Buffer.alloc(63)));assert.throws(()=>continueHash(Buffer.alloc(0),IV,1n));
});
