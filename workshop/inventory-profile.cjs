'use strict';
const {readInventories,locate,column}=require('../checker/inventory-model.cjs');
const {joaat}=require('./hash.cjs');
const CURRENCY=2084597891,CONTAINER=1490883802,WALLET=4163145158;
const VALUE='$0x450ce2f0',ID='$0x92f37a48',CHAR='$0x46be9d78';
const LIMITS=Object.freeze({cash:20000,checking:2000000,savings:1000000});
// Reported capacities apply only to these item/slot pairs. Unknown containers
// are bounded by their own loaded quantity, never a maintainer-specific amount.
const SPECS=new Map([
 // This exact item/slot pair held 15,000 in a subsequently saved/reloaded
 // source. 15,000 is a conservative mapped capacity, not a user's bank total.
 [0x26457c8e,{slot:6837455,capacity:15000}],
 [0xcfefdcf1,{slot:joaat('slotid_currency_cash_5000'),capacity:5000}],
 [0x33894998,{slot:2177639769,capacity:85000}],
 [0xb84a2da6,{slot:joaat('slotid_currency_cash_95000'),capacity:95000}],
 [0xa61b8949,{slot:joaat('slotid_currency_cash_400000'),capacity:400000}],
 [0x6ab81283,{slot:joaat('slotid_currency_cash_500000'),capacity:500000}],
 [0x88e64edf,{slot:joaat('slotid_currency_cash_1000000'),capacity:1000000}]
]);
function unique(list,label){if(list.length!==1)throw Error('Ambiguous or absent '+label);return list[0];}
function discover(doc){
 const inventories=readInventories(doc);
 if(!inventories.length)throw Error('No recognized inventories');
 for(const inv of inventories)for(const row of inv.rows)if(!Number.isSafeInteger(row.quantity)||row.quantity<0||row.itemHash<0||row.itemHash>0xffffffff||row.slotHash<0||row.slotHash>0xffffffff)throw Error('Invalid inventory scalar');
 function account(itemHash,label){
  const found=inventories.flatMap(inv=>inv.rows.filter(row=>row.itemHash===itemHash).map(root=>({inv,root})));
  const {inv,root}=unique(found,label+' root');
  const boxes=inv.rows.filter(row=>row.parentRow===root.row&&row.row!==root.row);
  if(!root.registered||boxes.some(b=>!b.registered||b.slotHash!==CONTAINER))throw Error('Unverified '+label+' registration');
  const rows=inv.rows.filter(row=>row.itemHash===CURRENCY&&boxes.some(b=>b.row===row.parentRow));
  const occupied=new Set();
  for(const row of rows){const box=inv.rows[row.parentRow],spec=SPECS.get(box.itemHash);if(!row.registered||occupied.has(box.row))throw Error('Ambiguous '+label+' currency row');occupied.add(box.row);if(spec&&row.slotHash!==spec.slot)throw Error('Unexpected known-container currency slot');if(spec&&row.quantity>spec.capacity)throw Error('Known container quantity exceeds mapped capacity');row.capacity=spec?spec.capacity:row.quantity;row.capacitySource=spec?'mapped-item-slot':'loaded-quantity-only';}
  const total=rows.reduce((n,row)=>n+row.quantity,0);if(!Number.isSafeInteger(total))throw Error('Unsafe account total');
  return{inventory:inv,root,boxes,rows,total,label};
 }
 const checking=account(869874572,'checking'),savings=account(1019291102,'savings');
 const wallets=inventories.flatMap((inv,ordinal)=>inv.rows.filter(row=>row.itemHash===CURRENCY&&row.slotHash===WALLET).map(row=>{
  const parent=row.parentRow===null?null:inv.rows[row.parentRow];
  if(!row.registered||!parent||!parent.registered||parent.slotHash!==CONTAINER)throw Error('Unverified wallet relationship');
  return{id:'inventory-'+ordinal+'-row-'+row.row,inventory:inv,row};
 }));
 const table=unique(locate(doc.root,'$0x97232209').filter(t=>t.value&&Object.hasOwn(t.value,VALUE)&&Object.hasOwn(t.value,ID)&&Object.hasOwn(t.value,CHAR)),'statistics table');
 const vals=column(table.value[VALUE],[...table.path,VALUE]),ids=column(table.value[ID],[]).values,chars=column(table.value[CHAR],[]).values;
 if(vals.values.length!==ids.length||ids.length!==chars.length)throw Error('Unequal statistics columns');
 const statistics=[];for(let i=0;i<ids.length;i++)if([262,265,274,275].includes(ids[i])){if(!Number.isSafeInteger(chars[i])||!Number.isSafeInteger(vals.values[i])||Math.abs(vals.values[i])>2147483647)throw Error('Invalid money statistic');statistics.push({id:ids[i],characterCode:chars[i],value:vals.values[i],path:[...vals.path,i]});}
 function stat(id,code){return unique(statistics.filter(s=>s.id===id&&s.characterCode===code),'statistic '+id+'/'+code);}
 const codes=[...new Set(statistics.filter(s=>s.id===265).map(s=>s.characterCode))];
 function scope(account,value){
  if(value===account.total)return{kind:'account-total',rows:account.rows};
  const positive=account.rows.filter(row=>row.quantity>0&&row.quantity<=value);if(value<=0||positive.length>16)return null;
  const matches=[];function search(i,sum,rows){if(matches.length>1)return;if(sum===value){matches.push(rows);return;}if(i>=positive.length||sum>value)return;search(i+1,sum,rows);search(i+1,sum+positive[i].quantity,[...rows,positive[i]]);}search(0,0,[]);
  return matches.length===1?{kind:'unique-currency-subset',rows:matches[0]}:null;
 }
 const walletOptions=wallets.map(w=>({...w,characterCandidates:codes.filter(code=>{try{const bank=stat(262,code);return stat(265,code).value===w.row.quantity&&scope(checking,bank.value)!==null&&stat(274,code).value===w.row.quantity+bank.value;}catch{return false;}})}));
 function ledger(key,total,label){const found=unique(locate(doc.root,key),label+' ledger');if(!Array.isArray(found.value)||!found.value.length)throw Error('Missing '+label+' ledger history');for(let i=0;i<found.value.length;i++){const e=found.value[i];if(!e||!Number.isSafeInteger(e['$0xa662d8be'])||!Number.isSafeInteger(e['$0x818f6f6d'])||Math.abs(e['$0xa662d8be'])>2147483647||e['$0x818f6f6d']<0||e['$0x818f6f6d']>2147483647)throw Error('Invalid ledger scalar');if(i&&e['$0x818f6f6d']!==found.value[i-1]['$0x818f6f6d']+e['$0xa662d8be'])throw Error('Ledger arithmetic mismatch');}const i=found.value.length-1,e=found.value[i];if(e['$0x818f6f6d']!==total)throw Error('Ledger and account disagree');return{path:[...found.path,i],delta:e['$0xa662d8be'],balance:total,count:found.value.length};}
 return{inventories,checking,savings,wallets:walletOptions,statistics,stat,scope,ledgers:{checking:ledger('$0x1e1e8a08',checking.total,'checking'),savings:ledger('$0xf4a14422',savings.total,'savings')}};
}
function model(doc,selection={}){
 const found=discover(doc);
 const eligible=selection.walletId?found.wallets.filter(w=>w.id===selection.walletId):found.wallets.filter(w=>w.characterCandidates.length===1);
 const wallet=unique(eligible,'wallet selection; choose a wallet with corroborating statistics');
 const code=selection.characterCode===undefined?unique(wallet.characterCandidates,'character mapping'):selection.characterCode;
 if(!wallet.characterCandidates.includes(code))throw Error('Chosen character code is not corroborated by the wallet and shared-account mirrors');
 const checkingStats=found.statistics.filter(s=>s.id===262).map(s=>({...s,scope:found.scope(found.checking,s.value)})).filter(s=>s.scope);
 if(!checkingStats.length)throw Error('No matching checking mirrors');
 const combined=checkingStats.map(s=>{const cash=found.stat(265,s.characterCode),total=found.stat(274,s.characterCode);if(total.value!==cash.value+s.value)throw Error('Combined money mirror mismatch');return{...total,cashValue:cash.value,selected:s.characterCode===code,scope:s.scope};});
 const savingsStats=found.statistics.filter(s=>s.id===275).map(s=>({...s,scope:found.scope(found.savings,s.value)})).filter(s=>s.scope);if(!savingsStats.length)throw Error('No matching savings mirror');
 return{...found,cash:wallet.row,walletId:wallet.id,characterCode:code,stats:{cash:found.stat(265,code),checking:checkingStats,combined,savings:savingsStats}};
}
function plan(doc,targets,selection={}){
 const m=model(doc,selection);for(const k of Object.keys(LIMITS))if(!Number.isSafeInteger(targets[k])||targets[k]<0||targets[k]>LIMITS[k])throw Error(k+' outside editor policy range');
 const changes=[];function add(path,value,old){if(!Number.isSafeInteger(value)||Math.abs(value)>2147483647)throw Error('Unsafe money scalar');if(value!==old)changes.push({path,value});}
 add(m.cash.quantityPath,targets.cash,m.cash.quantity);add(m.stats.cash.path,targets.cash,m.stats.cash.value);
 function distribute(account,total){let left=total;for(const row of account.rows){const amount=Math.min(left,row.capacity);left-=amount;add(row.quantityPath,amount,row.quantity);}if(left)throw Error(account.label+' needs more independently mapped container capacity; refusing to overfill an unknown box');}
 distribute(m.checking,targets.checking);distribute(m.savings,targets.savings);
 const changedValues=new Map(changes.map(c=>[JSON.stringify(c.path),c.value]));
 function scopedTotal(scope,total){return scope.kind==='account-total'?total:scope.rows.reduce((n,r)=>n+(changedValues.get(JSON.stringify(r.quantityPath))??r.quantity),0);}
 for(const s of m.stats.checking)add(s.path,scopedTotal(s.scope,targets.checking),s.value);
 for(const s of m.stats.combined)add(s.path,scopedTotal(s.scope,targets.checking)+(s.selected?targets.cash:s.cashValue),s.value);
 for(const s of m.stats.savings)add(s.path,scopedTotal(s.scope,targets.savings),s.value);
 for(const k of ['checking','savings']){const l=m.ledgers[k];if(targets[k]!==l.balance){add([...l.path,'$0x818f6f6d'],targets[k],l.balance);add([...l.path,'$0xa662d8be'],l.delta+targets[k]-l.balance,l.delta);}}
 return{changes,before:{cash:m.cash.quantity,checking:m.checking.total,savings:m.savings.total},after:{...targets},limits:{...LIMITS},selection:{walletId:m.walletId,characterCode:m.characterCode},mapping:'current-document relationships with statistic/ledger corroboration; no protagonist name inferred'};
}
module.exports={discover,model,plan,LIMITS,SPECS,CURRENCY,CONTAINER,WALLET};
