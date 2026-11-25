'use strict';
const fs=require('node:fs'),{createBodyCodec}=require('./story-body-codec.cjs'),{parseDocument}=require('./jsav-document.cjs');
const codec=createBodyCodec(),names=['SARC0001','SARC0002','SARC0002-control'],docs={};
for(const name of names)docs[name]=parseDocument(codec.decode(fs.readFileSync(__dirname+'/../private-fixtures/payloads/'+name)).plain);
const a=docs.SARC0001,b=docs.SARC0002,c=docs['SARC0002-control'];
const candidates=[];for(const [key,n] of a.numbers){const bn=b.numbers.get(key),cn=c.numbers.get(key);if(n.value===338&&bn?.value===317&&cn?.value===317)candidates.push({path:n.path,before:338,after:317,control:317});}
const report={samples:names,candidates,numericCounts:names.map(name=>({name,count:docs[name].numbers.size})),originalsReadOnly:true,plaintextWritten:false};
fs.writeFileSync(__dirname+'/money-baseline-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
