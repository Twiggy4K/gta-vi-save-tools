'use strict';
// Version-pinned, local integrity generator. No output files or console access.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {parse}=require('./static-pe.cjs'),{loadTrailerTables}=require('./trailer-table-loader.cjs');
const {parseSetupPayload,unpack3}=require('./encoded-trailer-ops.cjs'),{decodeState,ENCODE}=require('./trailer-state.cjs');
const {makeWordEncoder}=require('./encoded-word-encoder.cjs'),{continueHash}=require('./sha256-continuation.cjs');
const {makeModel}=require('./outer-arithmetic-model.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest();
function createTrailerGenerator(){
const binary=fs.readFileSync(__dirname+'/private-inputs/game_scarlett_master.exe');
assert.equal(hash(binary).toString('hex'),'e95020b2fa4a721db3df59fdecf75621730ac559d8835252f6c3b658d5a08993');
const pe=parse(binary),tables=loadTrailerTables(binary,pe),at=pe.offset(0x66fd190,378);
const setup=parseSetupPayload(binary.subarray(at+4,at+281)),state=decodeState(tables,setup),suffix=unpack3(binary.subarray(at+281,at+378),258);
const encoder=makeWordEncoder(tables.ops,r=>binary[pe.offset(r)]);
assert.equal(setup.readBigUInt64LE(0),64n);
assert.equal(setup.readBigUInt64LE(0x110),0n);
assert.equal(setup.readBigUInt64LE(0x1f0),0n);
function outer(inner){
  const model=makeModel(binary,pe,tables,[__dirname+'/private-listings/outer-model-disassembly.txt',__dirname+'/private-listings/outer-pack-disassembly.txt',__dirname+'/private-listings/digest-state-output-disassembly.txt']);
  const words=Buffer.alloc(144);for(let i=0;i<8;i++)encoder(inner.readUInt32BE(i*4),ENCODE[i]).copy(words,i*18);
  const wordsAt=model.alloc(words),packedAt=model.alloc(512);
  model.call(0x5613250,[wordsAt,32n,packedAt]);
  const packed=model.read(packedAt,130),innerEncoded=Buffer.alloc(130),work=Buffer.alloc(386),input=Buffer.alloc(386);
  tables.ops.binary(0x82000004636n,packed,packed,innerEncoded);
  suffix.copy(work,128);work.fill(0,0,128);work[127]=3;
  tables.ops.binary(0x40008200000408en,innerEncoded,work,input);
  const inputAt=model.alloc(input),outAt=model.alloc(256);
  model.call(0x560f320,[inputAt,0x145fbee90n,outAt]);
  const encoded=model.read(outAt,130),normalized=Buffer.alloc(130);
  tables.ops.unaryWord(0xc07f000c044c5n,encoded,normalized);
  const a=Buffer.alloc(4),b=Buffer.alloc(4),out=Buffer.alloc(32);
  for(let i=0;i<64;i++){
    tables.ops.binary(0x4000001d73n,normalized,normalized,a);
    if(i<63)tables.ops.shifted(0x8080000804d9cn,normalized,normalized,normalized);
    tables.ops.binary(0x4000001eacn,a,a,b);
    const v=binary[pe.offset(0x5fbf020+((b[3]<<3)^b[2]))],digit=i&1?v>>>4:v&15;
    out[i>>>1]^=digit<<((i&1)*4);
  }
  return {digest:out.reverse(),metadata:model.metadata()};
}
return function generate(covered){
  if(!Buffer.isBuffer(covered)||covered.length>64*1024*1024)throw new RangeError('Expected a bounded covered byte buffer');
  return outer(continueHash(covered,state,64n));
};
}
module.exports={createTrailerGenerator};
