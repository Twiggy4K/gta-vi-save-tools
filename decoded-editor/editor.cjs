'use strict';
// Runnable decoded-JSAV writer: no private codec, game binary, console or network.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {parseDocument}=require('../research/jsav-document.cjs'),{discover,model,LIMITS,plan}=require('../workshop/inventory-profile.cjs'),{patchScalars}=require('../workshop/money-core.cjs'),{expand}=require('../workshop/expand-inventory.cjs');
const stashProfile=require('./stash-profile.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function inspect(bytes,selection={}){
 if(!Buffer.isBuffer(bytes)||bytes.length>8388608)throw Error('Decoded input exceeds 8 MiB limit');
 if(bytes.toString('ascii',0,4)==='ASAV')throw Error('This is GTA VI ASAV, not decoded JSAV. Local GarlicMgr may only decrypt the PS5 container. Use a compatible game-level decoder; see the guide. No edit was made.');
 const doc=parseDocument(bytes),d=discover(doc);
 if(d.wallets.some(w=>w.inventory.rows[w.row.parentRow]?.itemHash===stashProfile.STASH_PARENT)){try{return{doc,report:{format:'decoded-JSAV-only',...stashProfile.report(stashProfile.resolve(doc,selection))}};}catch(e){return{doc,report:{mode:'experimental-stash',mappingReady:false,wallets:[],balances:{checking:d.checking.total,savings:d.savings.total},reason:e.message}};}}
 const result={format:'decoded-JSAV-only',limits:{...LIMITS},wallets:d.wallets.map(w=>({id:w.id,quantity:w.row.quantity,characterCandidates:w.characterCandidates})),balances:{checking:d.checking.total,savings:d.savings.total},mappingReady:false,protagonistNamesInferred:false};
 try{const m=model(doc,selection);result.mappingReady=true;result.selection={walletId:m.walletId,characterCode:m.characterCode};result.balances.cash=m.cash.quantity;}catch(e){result.reason=e.message;}
 return{doc,report:result};
}
function edit(bytes,targets,selection={}){
 const opened=inspect(bytes,selection),{doc}=opened;
 if(opened.report.mode==='experimental-stash'){const m=stashProfile.resolve(doc,selection),p=stashProfile.plan(m,targets),out=p.changes.length?patchScalars(doc,p.changes):Buffer.from(bytes),checked=stashProfile.report(stashProfile.resolve(parseDocument(out),p.selection));for(const k of ['cash','stash','checking','savings'])if(checked.balances[k]!==targets[k])throw Error('Reparsed stash output differs');return{bytes:out,manifest:{...p,noOp:p.changes.length===0,addedRows:0,outputFormat:'decoded-JSAV',requiresGameEncodingAndPlatformEncryption:true,gameplayAcceptanceVerified:false}};}
 const m=model(doc,selection),chosen={walletId:m.walletId,characterCode:m.characterCode};
 for(const k of Object.keys(LIMITS))if(!Number.isSafeInteger(targets[k])||targets[k]<0||targets[k]>LIMITS[k])throw Error(k+' outside editor policy range');
 const before={cash:m.cash.quantity,checking:m.checking.total,savings:m.savings.total};
 if(Object.keys(before).every(k=>targets[k]===before[k]))return{bytes:Buffer.from(bytes),manifest:{before,after:{...targets},selection:chosen,noOp:true,addedRows:0,outputFormat:'decoded-JSAV',requiresGameEncodingAndPlatformEncryption:true}};
 const expanded=expand(doc,targets,before,chosen),p=plan(expanded.doc,targets,chosen),out=patchScalars(expanded.doc,p.changes),checked=model(parseDocument(out),chosen);
 if(checked.cash.quantity!==targets.cash||checked.checking.total!==targets.checking||checked.savings.total!==targets.savings)throw Error('Reparsed output balances differ');
 return{bytes:out,manifest:{...p,noOp:false,addedRows:expanded.addedRows,outputFormat:'decoded-JSAV',requiresGameEncodingAndPlatformEncryption:true,gameplayAcceptanceVerified:false}};
}
function run(args){const command=args[0],opts={};for(let i=1;i<args.length;i+=2){if(!['--input','--cash','--checking','--savings','--stash','--wallet','--character-code'].includes(args[i])||args[i+1]===undefined||Object.hasOwn(opts,args[i]))throw Error('Invalid options');opts[args[i]]=args[i+1];}if(!['inspect','edit'].includes(command)||!opts['--input'])throw Error('Choose inspect/edit and --input');
 const file=path.resolve(opts['--input']),stat=fs.statSync(file);if(!stat.isFile()||stat.size>8388608)throw Error('Input must be a decoded save no larger than 8 MiB');const bytes=fs.readFileSync(file),sourceHash=hash(bytes),selection={};if(opts['--wallet'])selection.walletId=opts['--wallet'];if(opts['--character-code']!==undefined){if(!/^\d{1,3}$/.test(opts['--character-code']))throw Error('Invalid character code');selection.characterCode=Number(opts['--character-code']);}
 const opened=inspect(bytes,selection);if(command==='inspect'){console.log(JSON.stringify({ok:true,...opened.report}));return;}
 const targets={};for(const k of [...Object.keys(LIMITS),...(opened.report.mode==='experimental-stash'?['stash']:[])]){if(!/^(0|[1-9]\d{0,9})$/.test(opts['--'+k]||''))throw Error('Enter whole nonnegative balances');targets[k]=Number(opts['--'+k]);}
 const result=edit(bytes,targets,selection);if(hash(fs.readFileSync(file))!==sourceHash)throw Error('Input changed; no output created');
 const directory=path.join(__dirname,'private-outputs',new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(4).toString('hex'));fs.mkdirSync(directory,{recursive:true});
 fs.writeFileSync(path.join(directory,'original-decoded.jsav'),bytes,{flag:'wx'});const outputFile=path.join(directory,'edited-decoded.jsav');fs.writeFileSync(outputFile,result.bytes,{flag:'wx'});const manifest={version:'0.5.0-stash-preview.1',inputHash:sourceHash,outputHash:hash(result.bytes),originalUnchanged:true,...result.manifest};fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx'});
 console.log(JSON.stringify({ok:true,outputDirectory:directory,outputFile,before:manifest.before,after:manifest.after,selection:manifest.selection,requiresGameEncodingAndPlatformEncryption:true}));
}
if(require.main===module)try{run(process.argv.slice(2));}catch(e){console.error(JSON.stringify({ok:false,error:e.message}));process.exitCode=1;}
module.exports={inspect,edit};
