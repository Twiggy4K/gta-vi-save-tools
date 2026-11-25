'use strict';
const {isDeepStrictEqual}=require('node:util');
// Byte offsets, not JS string offsets: edits preserve UTF-8 and untouched bytes.
function parseDocument(data){
 if(!Buffer.isBuffer(data)||data.toString('ascii',0,4)!=='JSAV'||data.readUInt32LE(4)!==3)throw new Error('Unsupported JSAV v3');
 const codes=data.readUInt32LE(8),scripts=data.readUInt32LE(12),count=codes+scripts,start=Math.ceil((16+count*20)/16)*16;
 if(count>10000||start>data.length)throw new Error('Invalid JSAV index');
 let end=data.length;while(end>start&&data[end-1]===0)end--;
 const root=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data.subarray(start,end)));
 if(!Array.isArray(root.CodeSaveBlocks)||!Array.isArray(root.ScriptSaveBlocks)||root.CodeSaveBlocks.length!==codes||root.ScriptSaveBlocks.length!==scripts)throw new Error('JSAV block count mismatch');
 const blocks=[...root.CodeSaveBlocks,...root.ScriptSaveBlocks];
 const entries=[];for(let i=0;i<count;i++){const at=16+i*20,pos=data.readUInt32LE(at+12),size=data.readUInt32LE(at+16);if(pos<start||pos+size>end)throw new Error('JSAV indexed range');const value=JSON.parse(data.subarray(pos,pos+size).toString('utf8'));if(!isDeepStrictEqual(value,blocks[i]))throw new Error('JSAV index and document disagree');entries.push({at,start:pos,size,value});}
 const numbers=new Map();let p=start;
 function ws(){while(p<end&&[9,10,13,32].includes(data[p]))p++;}
 function str(){const a=p++;while(p<end){const c=data[p++];if(c===92){p++;continue;}if(c===34)return JSON.parse(data.subarray(a,p).toString('utf8'));}throw new Error('Unterminated string');}
 function value(path,depth=0){if(depth>128)throw new Error('JSON nesting limit');ws();const c=data[p];
  if(c===123){p++;ws();if(data[p]===125){p++;return;}while(true){ws();if(data[p]!==34)throw new Error('Object key');const k=str();ws();if(data[p++]!==58)throw new Error('Object separator');value([...path,k],depth+1);ws();const sep=data[p++];if(sep===125)return;if(sep!==44)throw new Error('Object delimiter');}}
  if(c===91){p++;ws();if(data[p]===93){p++;return;}let i=0;while(true){value([...path,i++],depth+1);ws();const sep=data[p++];if(sep===93)return;if(sep!==44)throw new Error('Array delimiter');}}
  if(c===34){str();return;}
  const a=p;while(p<end&&![9,10,13,32,44,93,125].includes(data[p]))p++;
  const token=data.subarray(a,p).toString('ascii');if(/^[-0-9]/.test(token)){const n=Number(token);if(Number.isFinite(n))numbers.set(JSON.stringify(path),{path,start:a,end:p,value:n,token});}else if(!['true','false','null'].includes(token))throw new Error('JSON scalar');
 }
 value([]);ws();if(p!==end)throw new Error('Trailing JSON data');
 return {data,root,entries,numbers,start,end,codes,scripts};
}
function patchNumbers(doc,changes){
 const edits=changes.map(({path,value})=>{const original=doc.numbers.get(JSON.stringify(path));if(!original)throw new Error('Unknown numeric path');if(!Number.isSafeInteger(value)||value<0)throw new Error('Only nonnegative safe integers are editable');return {...original,bytes:Buffer.from(String(value)),delta:Buffer.byteLength(String(value))-(original.end-original.start)};}).sort((a,b)=>a.start-b.start);
 for(let i=1;i<edits.length;i++)if(edits[i].start<edits[i-1].end)throw new Error('Overlapping edits');
 if(!edits.length||edits.every(e=>e.bytes.toString()===e.token))return Buffer.from(doc.data);
 const chunks=[];let p=0;for(const e of edits){chunks.push(doc.data.subarray(p,e.start),e.bytes);p=e.end;}chunks.push(doc.data.subarray(p,doc.end));
 const raw=Buffer.concat(chunks),out=Buffer.alloc(Math.ceil(raw.length/16)*16);raw.copy(out);
 for(const entry of doc.entries){let shift=0,growth=0;for(const e of edits){if(e.end<=entry.start)shift+=e.delta;else if(e.start>=entry.start&&e.end<=entry.start+entry.size)growth+=e.delta;else if(e.start<entry.start+entry.size&&e.end>entry.start)throw new Error('Edit crosses indexed boundary');}out.writeUInt32LE(entry.start+shift,entry.at+12);out.writeUInt32LE(entry.size+growth,entry.at+16);}
 const checked=parseDocument(out);for(const e of edits)if(checked.numbers.get(JSON.stringify(e.path))?.value!==Number(e.bytes.toString()))throw new Error('Edit verification failed');
 return out;
}
module.exports={parseDocument,patchNumbers};
