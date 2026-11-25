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
function expand(doc,targets,balances){
 if(targets.checking<=balances.checking&&targets.savings<=balances.savings)return{doc,addedRows:0};
 const inventory=readInventories(doc).find(v=>v.inventoryIndex===0),owner=at(doc.root,inventory.inventoryPath),main=owner[K.main],arrays=new Map(),cols={};
 function load(value,path){const c=column(value,path),tokens=c.values.map((v,i)=>typeof v==='boolean'?String(v):exact(doc,[...c.path,i],v));arrays.set(JSON.stringify(c.path),tokens);return tokens;}
 for(const key of ['guid','parent','item','slot','qty','flag'])cols[key]=load(main[K[key]],[...inventory.inventoryPath,K.main,K[key]]);
 const parents=load(owner[K.parents],[...inventory.inventoryPath,K.parents]),registration=load(owner[K.registration],[...inventory.inventoryPath,K.registration]);
 const used=new Set([...doc.numbers.values()].map(n=>n.token));let addedRows=0;
 function guid(){let v;do{v=crypto.randomBytes(8).readBigInt64LE().toString();}while(v==='0'||used.has(v));used.add(v);return v;}
 function append(parentRow,item,slot,quantity){const row=cols.guid.length,parentGuid=cols.guid[parentRow];let pi=parents.indexOf(parentGuid);if(pi<0){pi=parents.length;parents.push(parentGuid);}const values={guid:guid(),parent:String(pi),item:String(item),slot:String(slot),qty:String(quantity),flag:'false'};for(const k of Object.keys(cols))cols[k].push(values[k]);registration.push(String(row*16+1));addedRows++;return row;}
 function addCash(box,slot){if(!inventory.rows.some(r=>r.parentRow===box&&r.itemHash===2084597891))append(box,2084597891,slot,0);}
 if(targets.checking>balances.checking){const root=inventory.rows.find(r=>r.itemHash===869874572);if(!root)throw Error('Missing checking root');
  for(const [item,slot]of [[864635288,2177639769],[2786822473,2755084099],[1790448259,require('./hash.cjs').joaat('slotid_currency_cash_500000')],[2296794847,require('./hash.cjs').joaat('slotid_currency_cash_1000000')]]){
   const matches=inventory.rows.filter(r=>r.parentRow===root.row&&r.itemHash===item);if(matches.length>1)throw Error('Duplicate checking box');const box=matches.length?matches[0].row:append(root.row,item,1490883802,1);addCash(box,slot);
  }
 }
 if(targets.savings>balances.savings){const root=inventory.rows.find(r=>r.itemHash===1019291102),box=inventory.rows.filter(r=>r.parentRow===root?.row&&r.itemHash===1790448259);if(box.length!==1)throw Error('Missing savings expansion box');addCash(box[0].row,require('./hash.cjs').joaat('slotid_currency_cash_500000'));}
 const changed=replaceArrays(doc,arrays);readInventories(changed);return{doc:changed,addedRows};
}
module.exports={expand,replaceArrays};
