'use strict';
// Experimental observation-based profile. No chapter-number or personal-balance rules.
const {discover}=require('../workshop/inventory-profile.cjs');
const STASH_PARENT=4030395321,CASH_PARENT=3984562790,STASH_CAP=20000;
function resolve(doc,selection={}){
 const d=discover(doc),parent=w=>w.inventory.rows[w.row.parentRow]?.itemHash;
 const stash=d.wallets.filter(w=>parent(w)===STASH_PARENT);
 if(stash.length!==1)throw Error('Experimental stash profile requires exactly one registered stash');
 const box=stash[0],cash=d.wallets.filter(w=>parent(w)===CASH_PARENT),candidates=[];
 for(const code of [...new Set(d.statistics.filter(s=>s.id===265).map(s=>s.characterCode))]){
  try{
   const cs=d.stat(265,code),bank=d.stat(262,code),combined=d.stat(274,code);
   if(!d.scope(d.checking,bank.value)||combined.value!==cs.value+bank.value+box.row.quantity)continue;
   const matching=cash.filter(w=>w.row.quantity===cs.value);
   if(matching.length===1)candidates.push({code,cash:matching[0],cashStat:cs});
   else if(cs.value===0&&cash.length===0)candidates.push({code,cash:null,cashStat:cs});
  }catch{}
 }
 const filtered=candidates.filter(c=>(selection.characterCode===undefined||c.code===selection.characterCode)&&(!selection.walletId||selection.walletId===box.id||selection.walletId===c.cash?.id));
 if(filtered.length!==1)throw Error('Stash ownership is ambiguous or its money mirrors disagree');
 const chosen=filtered[0];
 // Stale mirrors remain untouched. Only uniquely matching current relationships qualify.
 const mirrors=d.statistics.filter(s=>s.id===274).filter(s=>{try{return s.value===d.stat(265,s.characterCode).value+d.stat(262,s.characterCode).value+box.row.quantity;}catch{return false;}});
 return{d,box,...chosen,mirrors};
}
function report(m){return{mode:'experimental-stash',mappingReady:true,protagonistNamesInferred:false,selection:{walletId:m.box.id,characterCode:m.code},wallets:[{id:m.box.id,quantity:m.box.row.quantity,characterCandidates:[m.code],kind:'Bed stash'}],balances:{stash:m.box.row.quantity,cash:m.cash?.row.quantity||0,checking:m.d.checking.total,savings:m.d.savings.total},limits:{stash:Math.max(STASH_CAP,m.box.row.quantity),cash:20000,checking:2000000,savings:1000000},editable:{stash:true,cash:!!m.cash,checking:false,savings:false},note:'Experimental bed stash mapping. Bank/savings preserved, even when present. Missing cash wallets are not created. Stash policy is not a verified game maximum.'};}
function plan(m,targets){
 const before=report(m).balances;
 for(const k of ['stash','cash','checking','savings'])if(!Number.isSafeInteger(targets[k])||targets[k]<0)throw Error('Enter whole nonnegative balances');
 if(targets.stash>Math.max(STASH_CAP,before.stash)||targets.cash>20000)throw Error('Outside experimental stash/cash policy');
 if(targets.checking!==before.checking||targets.savings!==before.savings)throw Error('Bank/savings edits are disabled in the experimental stash profile');
 if(!m.cash&&targets.cash!==0)throw Error('No corroborated cash wallet exists; creating one is unsupported');
 const changes=[],add=(path,value,old)=>{if(value!==old){if(!Number.isSafeInteger(value)||value<0||value>2147483647)throw Error('Unsafe mirror value');changes.push({path,value});}};
 add(m.box.row.quantityPath,targets.stash,before.stash);
 if(m.cash){add(m.cash.row.quantityPath,targets.cash,before.cash);add(m.cashStat.path,targets.cash,m.cashStat.value);}
 for(const s of m.mirrors)add(s.path,s.value+targets.stash-before.stash+(s.characterCode===m.code?targets.cash-before.cash:0),s.value);
 return{before,after:{...targets},changes,selection:{walletId:m.box.id,characterCode:m.code},experimentalStash:true,bankAndSavingsPreserved:true};
}
module.exports={resolve,report,plan,STASH_PARENT,CASH_PARENT,STASH_CAP};
