'use strict';
// Independently implemented from locally verified schema observations.
// Wide identifiers are compared using original JSON tokens, never IEEE doubles.
function joaat(s){let h=0;for(const b of Buffer.from(s.toLowerCase())){h=(h+b)>>>0;h=(h+(h<<10))>>>0;h^=h>>>6;}h=(h+(h<<3))>>>0;h^=h>>>11;return(h+(h<<15))>>>0;}
const K={main:'$0xfc8f2620',guid:'$0xb4bfeab1',parent:'$0xc5730137',item:'$0xbe8e255c',slot:'$0x12ae4287',qty:'$0xe3fead7a',flag:'$0x63b44f39',registration:'$0xabb1e011',parents:'$0xd558e4da'};
function locate(root,key){const found=[];function walk(x,p){if(!x||typeof x!=='object')return;for(const[k,v]of Object.entries(x)){const q=[...p,Array.isArray(x)?Number(k):k];if(k===key)found.push({value:v,path:q});walk(v,q);}}walk(root,[]);return found;}
function column(value,path){if(Array.isArray(value))return{values:value,path};if(Array.isArray(value?.$data))return{values:value.$data,path:[...path,'$data']};if(value&&['int_array','int64_array'].includes(value.$content)&&!Object.hasOwn(value,'$data'))return{values:[],path:[...path,'$data']};throw Error('Unsupported inventory column');}
function at(root,path){return path.reduce((x,k)=>x[k],root);}
function exact(doc,path,value){const t=doc.numbers.get(JSON.stringify(path));if(t){if(!/^-?\d+$/.test(t.token))throw Error('Nonintegral identifier');return BigInt(t.token).toString();}if(typeof value==='string')return value;throw Error('Missing exact identifier token');}
function readInventories(doc){return locate(doc.root,K.main).map(({value:main,path:p})=>{
 const owner=at(doc.root,p.slice(0,-1)),cols=Object.fromEntries(['guid','parent','item','slot','qty','flag'].map(k=>[k,column(main[K[k]], [...p,K[k]])]));
 const length=cols.item.values.length;if(Object.values(cols).some(c=>c.values.length!==length))throw Error('Unequal inventory columns');
 const parents=column(owner[K.parents],[...p.slice(0,-1),K.parents]),reg=column(owner[K.registration],[...p.slice(0,-1),K.registration]);
 const ids=cols.guid.values.map((v,i)=>exact(doc,[...cols.guid.path,i],v));if(new Set(ids).size!==ids.length)throw Error('Ambiguous exact GUID');
 const parentIds=parents.values.map((v,i)=>exact(doc,[...parents.path,i],v));
 const rows=cols.item.values.map((hash,i)=>{const pi=cols.parent.values[i];if(!Number.isSafeInteger(pi)||pi<0||pi>=parentIds.length)throw Error('Invalid parent index');const parentRow=ids.indexOf(parentIds[pi]);
  if(!Number.isSafeInteger(hash)||!Number.isSafeInteger(cols.slot.values[i])||!Number.isSafeInteger(cols.qty.values[i])||typeof cols.flag.values[i]!=='boolean')throw Error('Unsafe inventory scalar');
  return{row:i,itemHash:hash,slotHash:cols.slot.values[i],quantity:cols.qty.values[i],equipped:cols.flag.values[i],guidLabel:'row:'+i,parentRow:parentRow<0?null:parentRow,parentKind:parentRow===i?'self':parentRow<0?'external':'row',registered:reg.values.includes(i*16+1),quantityPath:[...cols.qty.path,i]};});
 return{inventoryPath:p.slice(0,-1),inventoryIndex:p.at(-2),rows,parallelArraysAgree:true,exactGuidUnique:true,unsafeGuidCount:cols.guid.values.filter(x=>typeof x==='number'&&!Number.isSafeInteger(x)).length,parentCount:parents.values.length,registrationCount:reg.values.length};
 });}
function summary(doc){return readInventories(doc).map(v=>({...v,rows:v.rows.map(r=>({...r,knownName:r.itemHash===joaat('currency_cash')?'currency_cash':r.itemHash===joaat('bank_checking')?'bank_checking':r.itemHash===joaat('bank_savings')?'bank_savings':null}))}));}
module.exports={K,locate,column,at,exact,readInventories,summary};
