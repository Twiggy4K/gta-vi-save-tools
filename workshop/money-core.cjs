'use strict';
const path=require('node:path');
const research=path.resolve(__dirname,'../research');
const {parseDocument}=require(research+'/jsav-document.cjs'),{encodeBlock}=require(research+'/lz4-encode.cjs'),{headerChecksum,verifyHeader}=require(research+'/../header/header-codec.cjs');
const {readInventories,locate,column}=require('../checker/inventory-model.cjs');
const VALUE='$0x450ce2f0',ID='$0x92f37a48',CHAR='$0x46be9d78';
function unique(a,label){if(a.length!==1)throw Error('Ambiguous or absent '+label);return a[0];}
function model(doc){
 const invs=readInventories(doc);if(invs.length!==21)throw Error('Unsupported inventory layout');
 const main=n=>unique(invs.filter(x=>x.inventoryIndex===n),'inventory '+n),active=main(1),shared=main(0);
 const currency=inv=>inv.rows.filter(r=>r.itemHash===2084597891);
 const cash=unique(currency(active).filter(r=>r.slotHash===4163145158),'cash item');
 if(!cash.registered||active.rows[cash.parentRow]?.itemHash!==3984562790)throw Error('Unsupported wallet');
 function account(hash){const root=unique(shared.rows.filter(r=>r.itemHash===hash),'account'),boxes=shared.rows.filter(r=>r.parentRow===root.row&&r.row!==root.row);
  const rows=currency(shared).filter(r=>boxes.some(b=>b.row===r.parentRow));
  if(!root.registered||rows.length<1||rows.some(r=>!r.registered)||boxes.some(b=>!b.registered||b.slotHash!==1490883802))throw Error('Unverified account registration');
  return{root,rows,total:rows.reduce((n,r)=>n+r.quantity,0),boxes};}
 const checking=account(869874572),savings=account(1019291102);
 const hash=require('./hash.cjs').joaat;
 const bankSpecs=new Map([[16515606,[2657057649,17860]],[864635288,[2177639769,85000]],[2786822473,[2755084099,400000]],[1790448259,[hash('slotid_currency_cash_500000'),500000]],[0x88e64edf,[hash('slotid_currency_cash_1000000'),1000000]]]);
 const bankBoxes=new Set([642088078,3678672908,...bankSpecs.keys()]);
 if(checking.boxes.length<4||checking.boxes.length>7||checking.boxes.some(b=>!bankBoxes.has(b.itemHash))||new Set(checking.boxes.map(b=>b.itemHash)).size!==checking.boxes.length)throw Error('Unsupported checking boxes');
 function validateRows(account,specs){const seen=new Set();for(const r of account.rows){const box=shared.rows[r.parentRow],spec=specs.get(box?.itemHash);if(!spec||r.slotHash!==spec[0]||r.quantity<0||r.quantity>spec[1]||seen.has(box.row))throw Error('Unsupported currency container');seen.add(box.row);r.capacity=spec[1];}}
 validateRows(checking,bankSpecs);
 const savingsSpecs=new Map([[3488603377,[2474250864,5000]],[3091869094,[2022508071,95000]],[2786822473,[2755084099,400000]],[1790448259,[hash('slotid_currency_cash_500000'),500000]]]);
 if(savings.rows.length<3||savings.rows.length>4||savings.boxes.length!==4||savings.boxes.some(b=>!savingsSpecs.has(b.itemHash))||new Set(savings.boxes.map(b=>b.itemHash)).size!==4)throw Error('Unsupported savings containers');
 validateRows(savings,savingsSpecs);
 const st=unique(locate(doc.root,'$0x97232209').filter(t=>t.value?.[VALUE]?.$data),'statistics'),vals=column(st.value[VALUE],[...st.path,VALUE]),ids=column(st.value[ID],[]).values,chars=column(st.value[CHAR],[]).values;
 if(ids.length!==vals.values.length||chars.length!==ids.length)throw Error('Unequal statistics');
 function stat(id,char){const i=unique(ids.flatMap((v,i)=>v===id&&chars[i]===char?[i]:[]),'statistic '+id+'/'+char);return{path:[...vals.path,i],value:vals.values[i]};}
 const stats={cash:stat(265,2),checking:stat(262,2),combined:stat(274,2),savings:[stat(275,1),stat(275,2)]};
 if(stats.cash.value!==cash.quantity||stats.checking.value!==checking.total||stats.combined.value!==cash.quantity+checking.total||stats.savings.some(s=>s.value!==savings.total))throw Error('Balances and mirrors disagree');
 const book=unique(locate(doc.root,'$0x1e1e8a08'),'checking ledger'),sav=unique(locate(doc.root,'$0xf4a14422'),'savings ledger');
 function ledger(t,total){if(!Array.isArray(t.value)||t.value.length<2)throw Error('Missing real ledger');
  for(let i=0;i<t.value.length;i++){const e=t.value[i];if(!Number.isSafeInteger(e['$0xa662d8be'])||!Number.isSafeInteger(e['$0x818f6f6d']))throw Error('Invalid ledger scalar');if(i&&e['$0x818f6f6d']!==t.value[i-1]['$0x818f6f6d']+e['$0xa662d8be'])throw Error('Ledger arithmetic mismatch');}
  const i=t.value.length-1,e=t.value[i];if(e['$0x818f6f6d']!==total)throw Error('Ledger balance mismatch');return{delta:e['$0xa662d8be'],balance:total,path:[...t.path,i],count:t.value.length};}
 return{cash,checking,savings,stats,ledgers:{checking:ledger(book,checking.total),savings:ledger(sav,savings.total)}};
}
function patchScalars(doc,changes){const edits=changes.map(c=>{const n=doc.numbers.get(JSON.stringify(c.path));if(!n||!Number.isSafeInteger(c.value)||Math.abs(c.value)>2147483647)throw Error('Invalid numeric edit');return{...n,bytes:Buffer.from(String(c.value)),delta:String(c.value).length-n.token.length};}).sort((a,b)=>a.start-b.start);
 for(let i=1;i<edits.length;i++)if(edits[i].start<edits[i-1].end)throw Error('Overlapping edits');
 const chunks=[];let at=0;for(const e of edits){chunks.push(doc.data.subarray(at,e.start),e.bytes);at=e.end;}chunks.push(doc.data.subarray(at,doc.end));const raw=Buffer.concat(chunks),out=Buffer.alloc(Math.ceil(raw.length/16)*16);raw.copy(out);
 for(const entry of doc.entries){let shift=0,growth=0;for(const e of edits){if(e.end<=entry.start)shift+=e.delta;else if(e.start>=entry.start&&e.end<=entry.start+entry.size)growth+=e.delta;else if(e.start<entry.start+entry.size&&e.end>entry.start)throw Error('Cross-block edit');}out.writeUInt32LE(entry.start+shift,entry.at+12);out.writeUInt32LE(entry.size+growth,entry.at+16);}
 const checked=parseDocument(out),wanted=new Map(changes.map(c=>[JSON.stringify(c.path),c.value]));for(const[key,n]of doc.numbers){const after=checked.numbers.get(key);if(!after)throw Error('Numeric path disappeared');if(wanted.has(key)){if(after.value!==wanted.get(key))throw Error('Edit mismatch');}else if(after.token!==n.token)throw Error('Unrelated numeric token changed');}
 const expected=structuredClone(doc.root);for(const c of changes){let x=expected;for(const k of c.path.slice(0,-1))x=x[k];x[c.path.at(-1)]=c.value;}require('node:assert/strict').deepEqual(checked.root,expected);return out;
}
function limits(m){return{cash:20000,checking:2000000,savings:1000000};}
function plan(doc,targets){const m=model(doc),max=limits(m);for(const k of ['cash','checking','savings'])if(!Number.isSafeInteger(targets[k])||targets[k]<0||targets[k]>max[k])throw Error(k+' outside the currently verified range');
 const changes=[];const add=(path,value,old)=>{if(value!==old)changes.push({path,value});};
 add(m.cash.quantityPath,targets.cash,m.cash.quantity);add(m.stats.cash.path,targets.cash,m.stats.cash.value);
 function distribute(account,total){let left=total;for(const r of account.rows){const amount=Math.min(left,r.capacity);left-=amount;add(r.quantityPath,amount,r.quantity);}if(left)throw Error('Required currency containers are missing');}
 distribute(m.checking,targets.checking);add(m.stats.checking.path,targets.checking,m.stats.checking.value);
 add(m.stats.combined.path,targets.cash+targets.checking,m.stats.combined.value);
 distribute(m.savings,targets.savings);
 for(const s of m.stats.savings)add(s.path,targets.savings,s.value);
 for(const k of ['checking','savings']){const l=m.ledgers[k];if(targets[k]!==l.balance){add([...l.path,'$0x818f6f6d'],targets[k],l.balance);add([...l.path,'$0xa662d8be'],l.delta+targets[k]-l.balance,l.delta);}}
 return{changes,before:{cash:m.cash.quantity,checking:m.checking.total,savings:m.savings.total},after:{...targets},limits:max};
}
function createMoneyEditor(codec,trailer){
 function open(jsav,chives){const offset=chives.indexOf(Buffer.from('ASAV'));if(offset!==32)throw Error('Unsupported chives wrapper');const original=chives.subarray(offset);if(!verifyHeader(original).valid)throw Error('Original header invalid');const end=Number(original.readBigUInt64LE(0x168));if(!Number.isSafeInteger(end)||end>original.length||end<0x190)throw Error('Invalid original end');if(!trailer(original.subarray(0,end-32)).digest.equals(original.subarray(end-32,end)))throw Error('Original trailer invalid');const decoded=codec.decode(original);if(!decoded.plain.equals(jsav))throw Error('JSAV does not match the original chives body');const doc=parseDocument(jsav),m=model(doc);return{original,doc,model:m,balances:{cash:m.cash.quantity,checking:m.checking.total,savings:m.savings.total},limits:limits(m)};}
 function edit(opened,targets){for(const k of ['cash','checking','savings'])if(!Number.isSafeInteger(targets[k])||targets[k]<0||targets[k]>limits()[k])throw Error(k+' outside the currently verified range');
  if(Object.keys(opened.balances).every(k=>targets[k]===opened.balances[k]))return{asav:Buffer.from(opened.original),jsav:Buffer.from(opened.doc.data),plan:{changes:[],before:opened.balances,after:{...targets},limits:limits(),addedRows:0},noOp:true};
  const expanded=require('./expand-inventory.cjs').expand(opened.doc,targets,opened.balances),p=plan(expanded.doc,targets);p.addedRows=expanded.addedRows;
  const plain=patchScalars(expanded.doc,p.changes),packed=encodeBlock(plain),pad=16-packed.length%16,padded=Buffer.alloc(packed.length+pad,pad);packed.copy(padded);const body=codec.crypt(padded),end=0x170+body.length+32,out=Buffer.alloc(Math.max(opened.original.length,end));opened.original.copy(out,0,0,0x170);out.writeUInt32LE(0x170+packed.length,0x18);out.writeUInt32LE(0x170+plain.length,0x1c);out.writeBigUInt64LE(BigInt(end),0x168);out.writeUInt32LE(headerChecksum(out),0x160);body.copy(out,0x170);trailer(out.subarray(0,end-32)).digest.copy(out,end-32);
  if(!verifyHeader(out).valid||!trailer(out.subarray(0,end-32)).digest.equals(out.subarray(end-32,end))||!codec.decode(out).plain.equals(plain))throw Error('Output authentication/roundtrip failed');const checked=model(parseDocument(plain));if(checked.cash.quantity!==targets.cash||checked.checking.total!==targets.checking||checked.savings.total!==targets.savings)throw Error('Output balance mismatch');return{asav:out,jsav:plain,plan:p,noOp:false};}
 return{open,edit};
}
module.exports={model,plan,patchScalars,createMoneyEditor};
