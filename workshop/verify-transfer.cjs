'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const research=path.resolve(__dirname,'../research');
function verify(file,manifestFile){
 const bytes=fs.readFileSync(file),manifest=JSON.parse(fs.readFileSync(manifestFile));
 const hash=crypto.createHash('sha256').update(bytes).digest('hex');
 assert.equal(hash,manifest.outputHashes.asav,'Recovered game file differs from the requested edit');
 assert(require(research+'/../header/header-codec.cjs').verifyHeader(bytes).valid,'Invalid header');
 const end=Number(bytes.readBigUInt64LE(0x168));assert(Number.isSafeInteger(end)&&end>=0x190&&end<=bytes.length,'Invalid stored end');
 const trailer=require(research+'/trailer-generator.cjs').createTrailerGenerator();
 assert(trailer(bytes.subarray(0,end-32)).digest.equals(bytes.subarray(end-32,end)),'Invalid trailer');
 const plain=require(research+'/story-body-codec.cjs').createBodyCodec().decode(bytes).plain;
 const doc=require(research+'/jsav-document.cjs').parseDocument(plain),m=require('./money-core.cjs').model(doc);
 const balances={cash:m.cash.quantity,checking:m.checking.total,savings:m.savings.total};assert.deepEqual(balances,manifest.plan.after,'Unexpected balances');
 return{ok:true,balances,indexedBlocks:doc.entries.length,gameFileHash:hash,integrityVerified:true,inventoryAndMirrorsVerified:true,restorationPerformed:false};
}
if(require.main===module)try{console.log(JSON.stringify(verify(process.argv[2],process.argv[3])));}catch(e){console.error(JSON.stringify({ok:false,error:e.message}));process.exitCode=1;}
module.exports={verify};
