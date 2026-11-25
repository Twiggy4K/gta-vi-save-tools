'use strict';
// Local prototype. Only separate, clearly labeled test outputs may be written.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const research=path.join(__dirname,'../research');
const {createBodyCodec}=require(path.join(research,'story-body-codec.cjs')),{createTrailerGenerator}=require(path.join(research,'trailer-generator.cjs')),{createEditor}=require(path.join(research,'story-editor-core.cjs'));
function args(argv){const options={command:argv[0]||'help'};for(let i=1;i<argv.length;i+=2){if(!['--input','--cash'].includes(argv[i])||argv[i+1]===undefined)throw new Error('Usage: inspect --input FILE or edit --input FILE --cash AMOUNT');if(options[argv[i].slice(2)]!==undefined)throw new Error('Duplicate option');options[argv[i].slice(2)]=argv[i+1];}return options;}
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function run(argv){
 const o=args(argv);if(o.command==='help'){console.log('GTA VI PS5 cash prototype\ninspect --input FILE\nedit --input FILE --cash AMOUNT\nWrites separate test copies only. Console restoration is not verified.');return;}
 if(!['inspect','edit'].includes(o.command)||!o.input)throw new Error('Choose an ASAV story save to inspect or edit.');
 const inputPath=path.resolve(o.input),stat=fs.statSync(inputPath);if(!stat.isFile()||stat.size>64*1024*1024)throw new Error('Choose a file of at most 64 MiB.');
 const input=fs.readFileSync(inputPath),inputHash=hash(input),editor=createEditor(createBodyCodec(),createTrailerGenerator());
 if(o.command==='inspect'){const info=editor.inspect(input);console.log(JSON.stringify({ok:true,cash:info.cash.value,cashLimit:20000,headerValid:true,trailerValid:true,indexedBlocks:info.doc.entries.length,bankEditable:false,consoleAcceptanceVerified:false}));return;}
 if(!/^(0|[1-9][0-9]{0,4})$/.test(o.cash||''))throw new Error('Cash must be a whole number from 0 to 20000.');
 const amount=Number(o.cash),result=editor.editCash(input,amount);if(hash(fs.readFileSync(inputPath))!==inputHash)throw new Error('Input changed during processing; no output written.');
 const dir=path.join(__dirname,'private-outputs');fs.mkdirSync(dir,{recursive:true});
 const base=path.basename(inputPath).replace(/[^a-zA-Z0-9_.-]/g,'_').slice(0,48),id=Date.now()+'-'+crypto.randomBytes(4).toString('hex'),outputPath=path.join(dir,base+'-'+id+'.test-only.asav');
 const manifest={prototypeVersion:'0.1.0',testOnly:true,originalFilename:path.basename(inputPath),originalSha256:inputHash,outputSha256:hash(result.output),originalBytes:input.length,outputBytes:result.output.length,beforeCash:result.before,afterCash:result.after,noOp:result.noOp,validatedLocally:true,consoleAcceptanceVerified:false,platformScope:'Five preserved PS5 story samples; Xbox and PC untested',createdAt:new Date().toISOString()};
 fs.writeFileSync(outputPath+'.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 try{fs.writeFileSync(outputPath,result.output,{flag:'wx'});}catch(error){fs.unlinkSync(outputPath+'.json');throw error;}
 console.log(JSON.stringify({ok:true,before:result.before,after:result.after,noOp:result.noOp,outputPath,manifestPath:outputPath+'.json',originalUnchanged:true,validatedLocally:true,consoleAcceptanceVerified:false}));
}
if(require.main===module){try{run(process.argv.slice(2));}catch(error){const safe=/^(Usage:|Choose |Duplicate |Cash must |Input changed)/.test(error.message)?error.message:'This save is unsupported or did not pass validation. No output was written.';console.error(JSON.stringify({ok:false,error:safe}));process.exitCode=1;}}
module.exports={run,args};
