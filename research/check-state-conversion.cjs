'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {parse}=require('./static-pe.cjs'),{loadTrailerTables}=require('./trailer-table-loader.cjs'),{makeWordEncoder}=require('./encoded-word-encoder.cjs');
const {ENCODE,decodeSlot}=require('./trailer-state.cjs');
const b=fs.readFileSync(__dirname+'/private-inputs/game_scarlett_master.exe');
assert.equal(crypto.createHash('sha256').update(b).digest('hex'),'e95020b2fa4a721db3df59fdecf75621730ac559d8835252f6c3b658d5a08993');
const pe=parse(b),t=loadTrailerTables(b,pe),enc=makeWordEncoder(t.ops,r=>b[pe.offset(r)]);
const {K}=require('./sha256-continuation.cjs');
const constantsAt=pe.offset(0x5f458b0,256);
const sha256RoundConstantsMatch=K.every((v,i)=>b.readUInt32LE(constantsAt+i*4)===v);
assert(sha256RoundConstantsMatch);
const values=[0,1,2,15,16,255,256,65535,65536,0x7fffffff,0x80000000,0xffffffff];
let n=0;for(let i=0;i<256;i++){n=(Math.imul(n,1664525)+1013904223)>>>0;values.push(n);}
const slots=ENCODE.map((token,slot)=>{let matches=0;for(const v of values)if(decodeSlot(t,enc(v,token),slot)===v)matches++;return {slot,values:values.length,matches};});
const allMatched=slots.every(s=>s.matches===s.values);
const report={sha256RoundConstantsMatch,syntheticValues:values.length,slots,totalRoundTrips:values.length*8,allMatched,nativeOracleUsed:false,privateSavesRead:false,parametersExported:false};
fs.writeFileSync(__dirname+'/state-conversion-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
assert(allMatched,'State conversion round trip mismatch');
