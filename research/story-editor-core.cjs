'use strict';
const crypto=require('node:crypto');
const {parseDocument,patchNumbers}=require('./jsav-document.cjs'),{encodeBlock}=require('./lz4-encode.cjs');
const {headerChecksum,verifyHeader}=require('../header/header-codec.cjs');
const FIELDS=['$0x92f37a48','$0x4d20ff5b','$0x46be9d78'],VALUE='$0x450ce2f0';
const CASH_IDENTITY='4d34ca68b7a8700cbac20eaf35c3f5370d5b351e2197dabbbe2da1e1519f7070';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function findCash(doc){
 const found=[];
 function walk(x,path,depth=0){if(depth>128)throw new Error('Object depth');if(!x||typeof x!=='object')return;
  if(!Array.isArray(x)&&FIELDS.every(k=>Array.isArray(x[k]?.$data))&&Array.isArray(x[VALUE]?.$data)){
   const values=x[VALUE].$data;if(FIELDS.some(k=>x[k].$data.length!==values.length))throw new Error('Uneven property columns');
   for(let i=0;i<values.length;i++){const identity=hash(JSON.stringify(FIELDS.map(k=>[k,x[k].$data[i]])));if(identity===CASH_IDENTITY){const v=values[i];if(!Number.isSafeInteger(v)||v<0||v>20000)throw new Error('Cash candidate outside validated range');found.push({path:[...path,VALUE,'$data',i],value:v,evidence:'338 to 317 controlled purchase; 317 unchanged control',status:'candidate-not-game-validated'});}}
  }
  for(const [k,v] of Object.entries(x))if(v&&typeof v==='object')walk(v,[...path,Array.isArray(x)?Number(k):k],depth+1);
 }
 walk(doc.root,[]);if(found.length!==1)throw new Error('Expected exactly one controlled cash candidate; edit disabled');return found[0];
}
function createEditor(bodyCodec,generateTrailer){
 function inspect(input){
  if(!verifyHeader(input).valid)throw new Error('Header checksum invalid');
  const end=Number(input.readBigUInt64LE(0x168));if(!Number.isSafeInteger(end)||end<0x190||end>input.length)throw new Error('Invalid stored end');
  if(!generateTrailer(input.subarray(0,end-32)).digest.equals(input.subarray(end-32,end)))throw new Error('Integrity trailer invalid');
  const decoded=bodyCodec.decode(input);
  const doc=parseDocument(decoded.plain),cash=findCash(doc);return {decoded,doc,cash,sha256:hash(input)};
 }
 function editCash(input,amount){
  if(!Number.isSafeInteger(amount)||amount<0||amount>20000)throw new Error('Cash must be a whole number from 0 to 20000');
  const before=inspect(input);if(amount===before.cash.value)return {output:Buffer.from(input),before:amount,after:amount,noOp:true,validatedLocally:true,consoleAcceptanceVerified:false};
  const plain=patchNumbers(before.doc,[{path:before.cash.path,value:amount}]),packed=encodeBlock(plain),padding=16-(packed.length%16),padded=Buffer.alloc(packed.length+padding,padding);packed.copy(padded);
  const protectedBody=bodyCodec.crypt(padded),header=Buffer.from(input.subarray(0,0x170)),end=0x170+protectedBody.length+32;
  header.writeUInt32LE(0x170+packed.length,0x18);header.writeUInt32LE(0x170+plain.length,0x1c);header.writeBigUInt64LE(BigInt(end),0x168);header.writeUInt32LE(headerChecksum(header),0x160);
  // Keep the original backing capacity when the rebuilt payload fits. Zero
  // trailing slack rather than retaining stale protected data after a resize.
  const output=Buffer.alloc(Math.max(input.length,end));header.copy(output);protectedBody.copy(output,0x170);
  generateTrailer(output.subarray(0,end-32)).digest.copy(output,end-32);
  const checked=inspect(output);if(checked.cash.value!==amount||!checked.decoded.plain.equals(plain))throw new Error('Rebuilt payload mismatch');
  if(hash(input)!==before.sha256)throw new Error('Original buffer changed');
  return {output,before:before.cash.value,after:amount,noOp:false,validatedLocally:true,consoleAcceptanceVerified:false};
 }
 return {inspect,editCash};
}
module.exports={findCash,createEditor};
