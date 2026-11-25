'use strict';
// Read-only format discovery. This program has no codec, save writer or network client.
const fs=require('node:fs');
const {parseDocument}=require('./jsav-document.cjs');
const {readInventories,locate,column}=require('./inventory-model.cjs');
const CURRENCY=2084597891,WALLET=4163145158,CONTAINER=1490883802;
const ACCOUNTS=new Map([[869874572,'checking'],[1019291102,'familySavings']]);
const hex=n=>'0x'+n.toString(16).padStart(8,'0');
function inspect(bytes){
 const report={schemaVersion:1,checkerVersion:'0.1.1',readOnly:true,editingApproved:false,privacy:{accountIdsIncluded:false,guidsIncluded:false,pathsIncluded:false,saveContentIncluded:false,gameplayBalancesIncluded:true},format:'unknown',status:'unsupported',findings:[],inventories:[],accounts:[],walletCandidates:[],statistics:[],ledgers:[],ownership:'Unassigned: inventory positions and statistic character IDs do not establish protagonist identity.'};
 if(!Buffer.isBuffer(bytes)||bytes.length>8388608){report.findings.push('INPUT_SIZE_UNSUPPORTED');return report;}
 const magic=bytes.toString('ascii',0,4);
 if(magic!=='JSAV'){report.format=magic==='ASAV'?'ASAV':'unknown-or-encrypted';report.findings.push(magic==='ASAV'?'GAME_BODY_STILL_ENCODED':'DECODED_JSAV_REQUIRED');return report;}
 report.format='JSAV';
 let doc;try{doc=parseDocument(bytes);}catch{report.findings.push('JSAV_STRUCTURE_INVALID_OR_UNSUPPORTED');return report;}
 const ranges=[...doc.entries].sort((a,b)=>a.start-b.start);if(ranges.some((r,i)=>i&&r.start<ranges[i-1].start+ranges[i-1].size)){report.findings.push('JSAV_INDEX_OVERLAP');return report;}
 report.jsavVersion=3;report.indexedBlocks=doc.entries.length;report.status='inspectable';
 let inventories;try{inventories=readInventories(doc);}catch{report.status='inconsistent';report.findings.push('INVENTORY_COLUMNS_GUIDS_OR_PARENTS_INVALID');return report;}
 if(!inventories.length){report.status='unrecognized';report.findings.push('NO_RECOGNIZED_INVENTORIES');}
 for(const [inventoryNumber,inv]of inventories.entries()){
  const invLabel='inventory-'+inventoryNumber;
  if(inv.rows.some(r=>r.quantity<0)){report.status='inconsistent';report.findings.push('NEGATIVE_INVENTORY_QUANTITY');}
  report.inventories.push({inventory:invLabel,rows:inv.rows.length,registeredRows:inv.rows.filter(r=>r.registered).length,externalParentRows:inv.rows.filter(r=>r.parentKind==='external').length,parallelColumnsValid:true,exactGuidUnique:true});
  for(const root of inv.rows.filter(r=>ACCOUNTS.has(r.itemHash))){
   const boxes=inv.rows.filter(r=>r.parentRow===root.row&&r.row!==root.row);
   const money=inv.rows.filter(r=>r.itemHash===CURRENCY&&boxes.some(b=>b.row===r.parentRow));
   const total=money.reduce((sum,r)=>sum+r.quantity,0);
   if(!Number.isSafeInteger(total)){report.status='inconsistent';report.findings.push('ACCOUNT_TOTAL_UNSAFE');continue;}
   const account={inventory:invLabel,kind:ACCOUNTS.get(root.itemHash),balance:total,rootRegistered:root.registered,containers:boxes.map(b=>({itemHash:hex(b.itemHash),slotHash:hex(b.slotHash),registered:b.registered,currencyRows:money.filter(r=>r.parentRow===b.row).length})),currencyRows:money.length,currencyRegistered:money.every(r=>r.registered),containerSlotsRecognized:boxes.every(b=>b.slotHash===CONTAINER)};
   if(!account.rootRegistered||!account.currencyRegistered||!account.containerSlotsRecognized||boxes.some(b=>!b.registered)||boxes.some(b=>money.filter(r=>r.parentRow===b.row).length>1)){report.status='inconsistent';report.findings.push('ACCOUNT_REGISTRATION_OR_CONTAINER_AMBIGUOUS');}
   report.accounts.push(account);
  }
  for(const row of inv.rows.filter(r=>r.itemHash===CURRENCY&&r.slotHash===WALLET))report.walletCandidates.push({inventory:invLabel,quantity:row.quantity,registered:row.registered,parentResolved:row.parentRow!==null,parentItemHash:row.parentRow===null?null:hex(inv.rows[row.parentRow].itemHash)});
 }
 for(const candidate of locate(doc.root,'$0x97232209')){
  try{const values=column(candidate.value['$0x450ce2f0'],[]).values,ids=column(candidate.value['$0x92f37a48'],[]).values,chars=column(candidate.value['$0x46be9d78'],[]).values;
   if(ids.length!==values.length||chars.length!==values.length)throw Error();
   for(let i=0;i<ids.length;i++)if([262,265,274,275].includes(ids[i])){
    if(!Number.isSafeInteger(chars[i])||chars[i]<0||chars[i]>16||!Number.isSafeInteger(values[i])){report.findings.push('STATISTIC_SCALAR_UNSUPPORTED');continue;}
    report.statistics.push({id:ids[i],characterCode:chars[i],value:values[i]});
   }
  }catch{report.findings.push('STATISTICS_TABLE_UNRECOGNIZED');}
 }
 for(const [key,kind]of [['$0x1e1e8a08','checking'],['$0xf4a14422','familySavings']]){
  const candidates=locate(doc.root,key);
  for(const c of candidates){if(!Array.isArray(c.value)){report.findings.push('LEDGER_SHAPE_UNRECOGNIZED');continue;}
   let valid=true;for(let i=0;i<c.value.length;i++){const e=c.value[i];if(!e||!Number.isSafeInteger(e['$0xa662d8be'])||!Number.isSafeInteger(e['$0x818f6f6d'])||(i&&e['$0x818f6f6d']!==c.value[i-1]['$0x818f6f6d']+e['$0xa662d8be']))valid=false;}
   const last=c.value.at(-1),balance=valid&&last?last['$0x818f6f6d']:null,accounts=report.accounts.filter(a=>a.kind===kind);
   report.ledgers.push({kind,entries:c.value.length,arithmeticValid:valid,latestBalance:balance,uniqueAccountAgreement:accounts.length===1&&balance!==null?accounts[0].balance===balance:null});
   if(!valid){report.status='inconsistent';report.findings.push('LEDGER_ARITHMETIC_INVALID');}
   if(accounts.length===1&&balance!==null&&accounts[0].balance!==balance){report.status='inconsistent';report.findings.push('LEDGER_ACCOUNT_BALANCE_MISMATCH');}
  }
 }
 for(const kind of ['checking','familySavings'])if(report.accounts.filter(a=>a.kind===kind).length!==1)report.findings.push('ACCOUNT_MAPPING_NOT_UNIQUE_'+kind.toUpperCase());
 report.findings.push('READ_ONLY_DISCOVERY_NOT_WRITE_COMPATIBILITY','GAME_VERSION_NOT_DETERMINED','CHARACTER_OWNERSHIP_REQUIRES_CORROBORATION');
 report.findings=[...new Set(report.findings)];return report;
}
if(require.main===module){try{const stat=fs.statSync(process.argv[2]);if(!stat.isFile()||stat.size>8388608)throw Error();const report=inspect(fs.readFileSync(process.argv[2]));console.log(JSON.stringify(report));}catch{console.log(JSON.stringify({schemaVersion:1,checkerVersion:'0.1.1',readOnly:true,editingApproved:false,status:'unsupported',findings:['INPUT_UNREADABLE_OR_TOO_LARGE']}));process.exitCode=1;}}
module.exports={inspect};
