'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createTrailerGenerator}=require('./trailer-generator.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),generate=createTrailerGenerator();
const audit=JSON.parse(fs.readFileSync(path.join(__dirname,'../private-fixtures/prefix-audit-results.json'))),samples=[];
for(const s of audit.samples){
  const file=path.join(__dirname,'../private-fixtures/payloads',s.name),b=fs.readFileSync(file);
  assert.equal(hash(b),s.sha256);if(b.length<0x170||b.readUInt32LE(8)!==1)continue;
  const end=Number(b.readBigUInt64LE(0x168));assert(end>=0x190&&end<=b.length);
  const covered=b.subarray(0,end-32),expected=b.subarray(end-32,end),result=generate(covered);
  const repeat=generate(covered),header=Buffer.from(covered),body=Buffer.from(covered);
  header[0x20]^=1;body[0x170]^=1;
  const headerResult=generate(header),bodyResult=generate(body),alteredTrailer=Buffer.from(expected);alteredTrailer[0]^=1;
  const row={sample:s.name,exactTrailerMatch:result.digest.equals(expected),deterministic:repeat.digest.equals(result.digest),
    headerMutationRejected:!headerResult.digest.equals(expected),bodyMutationRejected:!bodyResult.digest.equals(expected),
    alteredTrailerRejected:!result.digest.equals(alteredTrailer),originalUnchanged:hash(fs.readFileSync(file))===s.sha256,...result.metadata};
  for(const key of ['exactTrailerMatch','deterministic','headerMutationRejected','bodyMutationRejected','alteredTrailerRejected','originalUnchanged'])assert(row[key],s.name+' '+key);
  samples.push(row);
}
assert.equal(samples.length,5);
const report={date:'2026-11-23',samples,trailerGeneratorVerified:true,sampleScope:5,writebackVerified:false,
  privateStateAndDigestsWritten:false,modifiedSaveFilesWritten:false,nativeCodeExecuted:false};
fs.writeFileSync(__dirname+'/complete-trailer-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
