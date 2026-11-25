'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const research=path.resolve(__dirname,'../research');
const {createBodyCodec}=require(research+'/story-body-codec.cjs'),{createTrailerGenerator}=require(research+'/trailer-generator.cjs'),{createMoneyEditor}=require('./money-core.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function run(args){const command=args[0],opts={};for(let i=1;i<args.length;i+=2){if(!['--folder','--cash','--checking','--savings'].includes(args[i])||args[i+1]===undefined||Object.hasOwn(opts,args[i]))throw Error('Invalid options');opts[args[i]]=args[i+1];}if(!['inspect','edit'].includes(command)||!opts['--folder'])throw Error('Choose a prepared save folder');
 const dir=path.resolve(opts['--folder']),input=fs.readFileSync(path.join(dir,'SARC0010')),chives=fs.readFileSync(path.join(dir,'chives.dat')),initial={jsav:hash(input),chives:hash(chives)},engine=createMoneyEditor(createBodyCodec(),createTrailerGenerator()),opened=engine.open(input,chives);
 if(command==='inspect'){console.log(JSON.stringify({ok:true,slot:'SARC0010',balances:opened.balances,limits:opened.limits,indexedBlocks:opened.doc.entries.length,headerAndTrailerValid:true,gameplayVerified:false}));return;}
 const targets={};for(const k of ['cash','checking','savings']){if(!/^(0|[1-9]\d{0,9})$/.test(opts['--'+k]||''))throw Error('Enter whole nonnegative balances');targets[k]=Number(opts['--'+k]);}const result=engine.edit(opened,targets);
 if(hash(fs.readFileSync(path.join(dir,'SARC0010')))!==initial.jsav||hash(fs.readFileSync(path.join(dir,'chives.dat')))!==initial.chives)throw Error('Inputs changed; no output created');
 const out=path.join(__dirname,'private-outputs',new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(4).toString('hex'));fs.mkdirSync(out,{recursive:true});
 const asavPath=path.join(out,'SARC0010.test-only.asav'),jsavPath=path.join(out,'SARC0010.test-only.jsav');
 fs.writeFileSync(asavPath,result.asav,{flag:'wx'});fs.writeFileSync(jsavPath,result.jsav,{flag:'wx'});
 const manifest={developmentVersion:'0.3.0-experimental',createdAt:new Date().toISOString(),inputHashes:initial,outputHashes:{asav:hash(result.asav),jsav:hash(result.jsav)},plan:result.plan,noOp:result.noOp,originalsUnchanged:true,validatedLocally:true,consoleAcceptanceVerified:false,limitsPolicy:'Cash <=20000; checking <=2000000; savings <=1000000 conservative editor cap. Append-only currency containers; increases not gameplay verified.',platformContainerEncrypted:false};fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx'});
 console.log(JSON.stringify({ok:true,outputFolder:out,asavPath,jsavPath,noOp:result.noOp,before:result.plan.before,after:result.plan.after,gameplayVerified:false}));}
if(require.main===module)try{run(process.argv.slice(2));}catch(e){console.error(JSON.stringify({ok:false,error:e.message}));process.exitCode=1;}
module.exports={run};
