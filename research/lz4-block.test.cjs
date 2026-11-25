'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {decodeBlock}=require('./lz4-block.cjs');
test('matches five independently compressed system-LZ4 vectors',()=>{
  const vectors=require('./lz4-synthetic-vectors.json');
  assert.equal(vectors.length,5);
  for(const v of vectors){const plain=Buffer.from(v.plain,'base64');assert.deepEqual(decodeBlock(Buffer.from(v.packed,'base64'),plain.length),plain);}
});
test('literal-only block, including empty payload',()=>{
  assert.equal(decodeBlock(Buffer.from([0]),0).length,0);
  assert.equal(decodeBlock(Buffer.from('504a53415603','hex'),5).toString('hex'),'4a53415603');
});
test('overlapping match repeats newly produced bytes',()=>{
  const b=Buffer.concat([Buffer.from([0x18,0x41,1,0,0x50]),Buffer.from('12345')]);
  assert.equal(decodeBlock(b,18).toString(),'A'.repeat(13)+'12345');
});
test('extended literal lengths are bounded',()=>{
  const payload=Buffer.alloc(280,0x42),b=Buffer.concat([Buffer.from([0xf0,255,10]),payload]);
  assert.deepEqual(decodeBlock(b,280),payload);
  assert.throws(()=>decodeBlock(b,279),/limit/);
});
test('rejects truncated tokens, literals and offsets',()=>{
  for(const b of [[],[0xf0],[0x20,65],[0x10,65,1]])assert.throws(()=>decodeBlock(Buffer.from(b),100));
});
test('rejects zero/backward-out-of-range offsets and oversized output',()=>{
  for(const b of [[0x10,65,0,0],[0x10,65,2,0]])assert.throws(()=>decodeBlock(Buffer.from(b),100),/offset/);
  assert.throws(()=>decodeBlock(Buffer.from([0x1f,65,1,0,255,255]),32),/limit/);
  assert.throws(()=>decodeBlock(Buffer.from([0]),-1),/limit/);
});
