'use strict';
const {K}=require('../checker/inventory-model.cjs'),{CONTAINER,CURRENCY,WALLET}=require('../workshop/inventory-profile.cjs'),{joaat}=require('../workshop/hash.cjs');
function fixture({bank=23456,savings=1700,cash=4321,sharedIndex=3,walletIndex=1,inventoryCount=7,ambiguous=false}={}){
 let sequence=9007199254741000n;const typed=a=>({$content:'int_array',$data:a});
 function inventory(rows){const ids=rows.map(()=>String(sequence++)),parents=[];const indices=rows.map(r=>{const p=ids[r.parent];if(!parents.includes(p))parents.push(p);return parents.indexOf(p);});return{[K.main]:{[K.guid]:{$content:'int64_array',$data:ids.map(s=>'WIDE:'+s)},[K.parent]:typed(indices),[K.item]:typed(rows.map(r=>r.item)),[K.slot]:typed(rows.map(r=>r.slot)),[K.qty]:typed(rows.map(r=>r.qty)),[K.flag]:rows.map(()=>false)},[K.parents]:{$content:'int64_array',$data:parents.map(s=>'WIDE:'+s)},[K.registration]:typed(rows.map((_,i)=>i*16+1))};}
 const list=Array.from({length:inventoryCount},()=>inventory([]));
 list[sharedIndex]=inventory([{parent:0,item:869874572,slot:0,qty:1},{parent:0,item:0x77777777,slot:CONTAINER,qty:1},{parent:1,item:CURRENCY,slot:0x55555555,qty:bank},{parent:3,item:1019291102,slot:0,qty:1},{parent:3,item:0xa61b8949,slot:CONTAINER,qty:1},{parent:4,item:CURRENCY,slot:joaat('slotid_currency_cash_400000'),qty:savings}]);
 list[walletIndex]=inventory([{parent:0,item:0x44444444,slot:0,qty:1},{parent:0,item:0x33333333,slot:CONTAINER,qty:1},{parent:1,item:CURRENCY,slot:WALLET,qty:cash}]);
 const stats=[[265,7,cash],[262,7,bank],[274,7,bank+cash],[275,7,savings],[265,12,ambiguous?cash:44],[262,12,ambiguous?bank:3333],[274,12,ambiguous?bank+cash:3377],[275,12,savings]];
 const ledger=total=>[{'$0xa662d8be':total,'$0x818f6f6d':total},{'$0xa662d8be':0,'$0x818f6f6d':total}];
 const block={Inventories:list,'$0x97232209':{'$0x92f37a48':typed(stats.map(s=>s[0])),'$0x46be9d78':typed(stats.map(s=>s[1])),'$0x450ce2f0':typed(stats.map(s=>s[2]))},'$0x1e1e8a08':ledger(bank),'$0xf4a14422':ledger(savings),unrelated:'leave this unchanged'};
 const blockText=JSON.stringify(block).replace(/"WIDE:(\d+)"/g,'$1'),text='{"CodeSaveBlocks":['+blockText+'],"ScriptSaveBlocks":[]}',start=48,payload=Buffer.from(text),out=Buffer.alloc(Math.ceil((start+payload.length)/16)*16);out.write('JSAV');out.writeUInt32LE(3,4);out.writeUInt32LE(1,8);out.writeUInt32LE(start+Buffer.byteLength('{"CodeSaveBlocks":['),28);out.writeUInt32LE(Buffer.byteLength(blockText),32);payload.copy(out,start);return out;
}
module.exports={fixture};
