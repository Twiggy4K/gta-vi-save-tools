'use strict';
// Independently authored client for the public HTOS job protocol. No shared key.
// One consented live round trip passed; every returned file still needs verification.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const BASE='https://garlicsaves.com';
async function processSave(config,{fetchImpl=fetch,sleep=ms=>new Promise(r=>setTimeout(r,ms)),now=Date.now}={}){
 if(config.consent!==true)throw Error('Explicit approval to upload this save is required');
 if(!['encrypt','decrypt'].includes(config.operation))throw Error('Unsupported remote operation');
 if(typeof config.workerKey!=='string'||config.workerKey.trim().length<16)throw Error('Provide your own GarlicSaves worker/API key');
 if(!Buffer.isBuffer(config.bytes)||config.bytes.length===0||config.bytes.length>134217728)throw Error('Remote input must be between 1 byte and 128 MiB');
 if(typeof config.fileName!=='string'||!/^[A-Za-z0-9_.-]{1,150}$/.test(config.fileName))throw Error('Unsupported upload filename');
 if(config.operation==='encrypt'&&!/^[0-9a-fA-F]{16}$/.test(config.accountIdWireHex||''))throw Error('Encryption requires the original account ID wire bytes from your own export');
 const timeout=config.timeoutMs??600000;if(!Number.isInteger(timeout)||timeout<1||timeout>600000)throw Error('Invalid processing timeout');
 const headers={'X-Worker-Key':config.workerKey.trim()},form=new FormData();form.set('operation',config.operation);form.set('platform','ps5');
 if(config.operation==='decrypt')form.set('include_sce_sys','true');else form.set('account_id',config.accountIdWireHex);
 form.set('files',new Blob([config.bytes],{type:'application/octet-stream'}),config.fileName);
 async function request(url,options={}){const r=await fetchImpl(url,{...options,headers:{...headers,...options.headers},redirect:'error',signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('Remote service HTTP '+r.status);return r;}
 const submitted=await(await request(BASE+'/api/v1/jobs',{method:'POST',body:form})).json();
 if(typeof submitted.job_id!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(submitted.job_id))throw Error('Invalid remote job response');
 const deadline=now()+timeout;let done=false;
 while(now()<deadline){const job=await(await request(BASE+'/api/v1/jobs/'+submitted.job_id)).json();if(job.status==='failed')throw Error('Remote processing failed; private server details are not echoed');if(job.status==='done'){done=true;break;}await sleep(1500);}
 if(!done)throw Error('Remote processing timed out; a server-side job may still exist');
 const result=await request(BASE+'/api/v1/jobs/'+submitted.job_id+'/result'),chunks=[];let size=0;
 if(Number(result.headers.get('content-length')||0)>134217728)throw Error('Remote result exceeds limit');
 for await(const chunk of result.body){size+=chunk.length;if(size>134217728)throw Error('Remote result exceeds limit');chunks.push(Buffer.from(chunk));}
 if(size===0)throw Error('Remote result is empty');return Buffer.concat(chunks);
}
async function run(){let text='';for await(const chunk of process.stdin){text+=chunk;if(text.length>32768)throw Error('Configuration too large');}const config=JSON.parse(text);if(typeof config.input!=='string')throw Error('Choose an input file');const stat=fs.statSync(config.input);if(!stat.isFile()||stat.size>134217728)throw Error('Invalid remote input file');const bytes=fs.readFileSync(config.input),before=crypto.createHash('sha256').update(bytes).digest('hex');const result=await processSave({...config,bytes});if(crypto.createHash('sha256').update(fs.readFileSync(config.input)).digest('hex')!==before)throw Error('Original changed');const out=path.join(__dirname,'private-outputs','remote-'+Date.now()+'-'+crypto.randomBytes(4).toString('hex'));fs.mkdirSync(out,{recursive:true});const output=path.join(out,'remote-result.zip');fs.writeFileSync(output,result,{flag:'wx'});console.log(JSON.stringify({ok:true,output,requiresContentVerification:true,restorationPerformed:false}));}
if(require.main===module)run().catch(()=>{console.error(JSON.stringify({ok:false,error:'Online processing did not complete. Check consent, your API key, input, account setting and service availability. No server response or credentials are printed.'}));process.exitCode=1;});
module.exports={processSave};
