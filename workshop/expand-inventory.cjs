'use strict';
// Independent append-only inventory construction. Existing wide integer tokens
// are retained verbatim; no JSON stringify of an entire decoded save is used.
const crypto=require('node:crypto');
const {K,readInventories,column,at,exact}=require('../checker/inventory-model.cjs');
const {parseDocument}=require('../research/jsav-document.cjs');
function replaceArrays(doc,replacements){
 const spans=new Map();let pos=doc.start;
 const ws=()=>{while([9,10,13,32].includes(doc.data[pos]))pos++;};
 function string(){const start=pos++;while(pos<doc.end){const c=doc.data[pos++];if(c===92)pos++;else if(c===34)return JSON.parse(doc.data.subarray(start,pos).toString());}throw Error('Unterminated string');}
 function walk(path){ws();const start=pos,c=doc.data[pos];if(c===123){pos++;ws();if(doc.data[pos]===125)pos++;else while(true){ws();const key=string();ws();if(doc.data[pos++]!==58)throw Error('Object separator');walk([...path,key]);ws();const sep=doc.data[pos++];if(sep===125)break;if(sep!==44)throw Error('Object delimiter');}}
 else if(c===91){pos++;ws();if(doc.data[pos]===93)pos++;else {let i=0;while(true){walk([...path,i++]);ws();const sep=doc.data[pos++];if(sep===93)break;if(sep!==44)throw Error('Array delimiter');}}}
 else if(c===34)string();else while(pos<doc.end&&![9,10,13,32,44,93,125].includes(doc.data[pos]))pos++;
 if(replacements.has(JSON.stringify(path)))spans.set(JSON.stringify(path),{start,end:pos});}
 walk([]);if(spans.size!==replacements.size)throw Error('Missing array replacement');
 const edits=[...spans].map(([key,s])=>({...s,bytes:Buffer.from('['+replacements.get(key).join(',')+']')})).sort((a,b)=>a.start-b.start);
 for(let i=1;i<edits.length;i++)if(edits[i].start<edits[i-1].end)throw Error('Overlapping arrays');
 let p=0;const parts=[];for(const e of edits){parts.push(doc.data.subarray(p,e.start),e.bytes);p=e.end;}parts.push(doc.data.subarray(p,doc.end));const raw=Buffer.concat(parts),out=Buffer.alloc(Math.ceil(raw.length/16)*16);raw.copy(out);
 for(const entry of doc.entries){let shift=0,growth=0;for(const e of edits){const delta=e.bytes.length-(e.end-e.start);if(e.end<=entry.start)shift+=delta;else if(e.start>=entry.start&&e.end<=entry.start+entry.size)growth+=delta;else if(e.start<entry.start+entry.size&&e.end>entry.start)throw Error('Cross-block array edit');}out.writeUInt32LE(entry.start+shift,entry.at+12);out.writeUInt32LE(entry.size+growth,entry.at+16);}
 const checked=parseDocument(out);for(const[key,n]of doc.numbers)if(checked.numbers.get(key)?.token!==n.token)throw Error('Existing number changed during append');return checked;
}
function expand(doc,targets,balances,selection={}){
 const {model,SPECS,CURRENCY,CONTAINER}=require('./inventory-profile.cjs'),mapped=model(doc,selection);
 const arrays=new Map(),builders=new Map(),used=new Set([...doc.numbers.values()].map(n=>n.token));let addedRows=0;
 function builder(inv){const key=JSON.stringify(inv.inventoryPath);if(builders.has(key))return builders.get(key);const owner=at(doc.root,inv.inventoryPath),cols={};
  function load(value,path){const c=column(value,path),tokens=c.values.map((v,i)=>typeof v==='boolean'?String(v):exact(doc,[...c.path,i],v));arrays.set(JSON.stringify(c.path),tokens);return tokens;}
  for(const k of ['guid','parent','item','slot','qty','flag'])cols[k]=load(owner[K.main][K[k]],[...inv.inventoryPath,K.main,K[k]]);
  const parents=load(owner[K.parents],[...inv.inventoryPath,K.parents]),registrations=load(owner[K.registration],[...inv.inventoryPath,K.registration]);
  function append(parentRow,item,slot,quantity){const row=cols.guid.length,parentGuid=cols.guid[parentRow];if(parentGuid===undefined)throw Error('Missing expansion parent');let index=parents.indexOf(parentGuid);if(index<0){index=parents.length;parents.push(parentGuid);}let guid;do{guid=crypto.randomBytes(8).readBigInt64LE().toString();}while(guid==='0'||used.has(guid));used.add(guid);const values={guid,parent:String(index),item:String(item),slot:String(slot),qty:String(quantity),flag:'false'};for(const k of Object.keys(cols))cols[k].push(values[k]);registrations.push(String(row*16+1));addedRows++;return row;}
  const b={append};builders.set(key,b);return b;
 }
 for(const kind of ['checking','savings']){
  const account=mapped[kind];if(targets[kind]<=account.total)continue;
  const inventory=account.inventory,b=builder(inventory);
  const supported=kind==='checking'?[0x26457c8e,0x33894998,0xa61b8949,0x6ab81283,0x88e64edf]:[0xcfefdcf1,0xb84a2da6,0xa61b8949,0x6ab81283];
  for(const item of supported){const spec=SPECS.get(item),matches=account.boxes.filter(row=>row.itemHash===item);if(matches.length>1)throw Error('Duplicate expansion container');const box=matches.length?matches[0].row:b.append(account.root.row,item,CONTAINER,1);if(!inventory.rows.some(row=>row.parentRow===box&&row.itemHash===CURRENCY))b.append(box,CURRENCY,spec.slot,0);}
 }
 if(!addedRows)return{doc,addedRows:0};const changed=replaceArrays(doc,arrays);model(changed,selection);return{doc:changed,addedRows};
}
module.exports={expand,replaceArrays};
