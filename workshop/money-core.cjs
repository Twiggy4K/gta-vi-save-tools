'use strict';
const path=require('node:path');
const research=path.resolve(__dirname,'../research');
const {parseDocument}=require(research+'/jsav-document.cjs'),{encodeBlock}=require(research+'/lz4-encode.cjs'),{headerChecksum,verifyHeader}=require(research+'/../header/header-codec.cjs');
const {readInventories,locate,column}=require('../checker/inventory-model.cjs');
const VALUE='$0x450ce2f0',ID='$0x92f37a48',CHAR='$0x46be9d78';
function unique(a,label){if(a.length!==1)throw Error('Ambiguous or absent '+label);return a[0];}
const profile=require('./inventory-profile.cjs');
const model=(doc,selection)=>profile.model(doc,selection);
function patchScalars(doc,changes){const edits=changes.map(c=>{const n=doc.numbers.get(JSON.stringify(c.path));if(!n||!Number.isSafeInteger(c.value)||Math.abs(c.value)>2147483647)throw Error('Invalid numeric edit');return{...n,bytes:Buffer.from(String(c.value)),delta:String(c.value).length-n.token.length};}).sort((a,b)=>a.start-b.start);
 for(let i=1;i<edits.length;i++)if(edits[i].start<edits[i-1].end)throw Error('Overlapping edits');
 const chunks=[];let at=0;for(const e of edits){chunks.push(doc.data.subarray(at,e.start),e.bytes);at=e.end;}chunks.push(doc.data.subarray(at,doc.end));const raw=Buffer.concat(chunks),out=Buffer.alloc(Math.ceil(raw.length/16)*16);raw.copy(out);
 for(const entry of doc.entries){let shift=0,growth=0;for(const e of edits){if(e.end<=entry.start)shift+=e.delta;else if(e.start>=entry.start&&e.end<=entry.start+entry.size)growth+=e.delta;else if(e.start<entry.start+entry.size&&e.end>entry.start)throw Error('Cross-block edit');}out.writeUInt32LE(entry.start+shift,entry.at+12);out.writeUInt32LE(entry.size+growth,entry.at+16);}
 const checked=parseDocument(out),wanted=new Map(changes.map(c=>[JSON.stringify(c.path),c.value]));for(const[key,n]of doc.numbers){const after=checked.numbers.get(key);if(!after)throw Error('Numeric path disappeared');if(wanted.has(key)){if(after.value!==wanted.get(key))throw Error('Edit mismatch');}else if(after.token!==n.token)throw Error('Unrelated numeric token changed');}
 const expected=structuredClone(doc.root);for(const c of changes){let x=expected;for(const k of c.path.slice(0,-1))x=x[k];x[c.path.at(-1)]=c.value;}require('node:assert/strict').deepEqual(checked.root,expected);return out;
}
const limits=()=>({...profile.LIMITS});
const plan=(doc,targets,selection)=>profile.plan(doc,targets,selection);
function createMoneyEditor(codec,trailer){
 function open(jsav,chives,selection={}){const offset=chives.indexOf(Buffer.from('ASAV'));if(offset!==32)throw Error('Unsupported chives wrapper');const original=chives.subarray(offset);if(!verifyHeader(original).valid)throw Error('Original header invalid');const end=Number(original.readBigUInt64LE(0x168));if(!Number.isSafeInteger(end)||end>original.length||end<0x190)throw Error('Invalid original end');if(!trailer(original.subarray(0,end-32)).digest.equals(original.subarray(end-32,end)))throw Error('Original trailer invalid');const decoded=codec.decode(original);if(!decoded.plain.equals(jsav))throw Error('JSAV does not match the original chives body');const doc=parseDocument(jsav),m=model(doc,selection);return{original,doc,selection:{walletId:m.walletId,characterCode:m.characterCode},model:m,balances:{cash:m.cash.quantity,checking:m.checking.total,savings:m.savings.total},limits:limits(m)};}
 function edit(opened,targets){for(const k of ['cash','checking','savings'])if(!Number.isSafeInteger(targets[k])||targets[k]<0||targets[k]>limits()[k])throw Error(k+' outside the currently verified range');
  if(Object.keys(opened.balances).every(k=>targets[k]===opened.balances[k]))return{asav:Buffer.from(opened.original),jsav:Buffer.from(opened.doc.data),plan:{changes:[],before:opened.balances,after:{...targets},limits:limits(),addedRows:0},noOp:true};
  const expanded=require('./expand-inventory.cjs').expand(opened.doc,targets,opened.balances,opened.selection),p=plan(expanded.doc,targets,opened.selection);p.addedRows=expanded.addedRows;
  const plain=patchScalars(expanded.doc,p.changes),packed=encodeBlock(plain),pad=16-packed.length%16,padded=Buffer.alloc(packed.length+pad,pad);packed.copy(padded);const body=codec.crypt(padded),end=0x170+body.length+32,out=Buffer.alloc(Math.max(opened.original.length,end));opened.original.copy(out,0,0,0x170);out.writeUInt32LE(0x170+packed.length,0x18);out.writeUInt32LE(0x170+plain.length,0x1c);out.writeBigUInt64LE(BigInt(end),0x168);out.writeUInt32LE(headerChecksum(out),0x160);body.copy(out,0x170);trailer(out.subarray(0,end-32)).digest.copy(out,end-32);
  if(!verifyHeader(out).valid||!trailer(out.subarray(0,end-32)).digest.equals(out.subarray(end-32,end))||!codec.decode(out).plain.equals(plain))throw Error('Output authentication/roundtrip failed');const checked=model(parseDocument(plain),opened.selection);if(checked.cash.quantity!==targets.cash||checked.checking.total!==targets.checking||checked.savings.total!==targets.savings)throw Error('Output balance mismatch');return{asav:out,jsav:plain,plan:p,noOp:false};}
 return{open,edit};
}
module.exports={model,plan,patchScalars,createMoneyEditor};
