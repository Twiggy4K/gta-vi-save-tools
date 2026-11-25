'use strict';
// Static parsing only: never loads the target as a module or launches its code.
const fs=require('node:fs'),crypto=require('node:crypto');
const hex=n=>'0x'+n.toString(16);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function parse(b){
  function bound(o,n){if(!Number.isSafeInteger(o)||!Number.isSafeInteger(n)||o<0||n<0||o+n>b.length)throw Error('PE range outside file');}
  function u16(o){bound(o,2);return b.readUInt16LE(o);}function u32(o){bound(o,4);return b.readUInt32LE(o);}
  bound(0,64);if(b.toString('ascii',0,2)!=='MZ')throw Error('Not MZ');const pe=u32(60);bound(pe,24);if(b.toString('binary',pe,pe+4)!=='PE\0\0')throw Error('Not PE');
  const machine=u16(pe+4),count=u16(pe+6),optionalSize=u16(pe+20),o=pe+24;bound(o,optionalSize);
  if(machine!==0x8664||u16(o)!==0x20b||optionalSize<112||count>96)throw Error('Unsupported PE layout');
  const imageBase=b.readBigUInt64LE(o+24),headerSize=u32(o+60),directories=[];
  for(let i=0;i<Math.min(16,u32(o+108));i++){if(112+i*8+8>optionalSize)throw Error('Truncated directories');directories.push({rva:u32(o+112+i*8),size:u32(o+116+i*8)});}
  const sections=[];for(let i=0;i<count;i++){const s=o+optionalSize+i*40;bound(s,40);const raw=u32(s+20),size=u32(s+16);bound(raw,size);
    const data=b.subarray(raw,raw+size),freq=Array(256).fill(0);for(const v of data)freq[v]++;let entropy=0;for(const n of freq)if(n){const p=n/size;entropy-=p*Math.log2(p);}
    sections.push({name:b.toString('ascii',s,s+8).split('\0')[0],rva:u32(s+12),virtualSize:u32(s+8),rawOffset:raw,rawSize:size,characteristics:hex(u32(s+36)),executable:Boolean(u32(s+36)&0x20000000),entropy});}
  function offset(rva,n=1){if(rva<headerSize){bound(rva,n);return rva;}const s=sections.find(s=>rva>=s.rva&&rva-s.rva+n<=s.rawSize);if(!s)throw Error('RVA has no raw bytes: '+hex(rva));return s.rawOffset+rva-s.rva;}
  function rvaAt(file){const s=sections.find(s=>file>=s.rawOffset&&file<s.rawOffset+s.rawSize);return s?s.rva+file-s.rawOffset:null;}
  function str(file){bound(file,1);const end=b.indexOf(0,file);if(end<0||end-file>4096)throw Error('Unbounded PE string');return b.toString('ascii',file,end);}
  const imports=[];const dir=directories[1];
  if(dir?.rva){for(let i=0;i<512;i++){const d=offset(dir.rva+i*20,20),thunk=u32(d),name=u32(d+12),iat=u32(d+16);if(!thunk&&!name&&!iat)break;
    const dll=str(offset(name)),symbols=[];for(let j=0;j<8192;j++){const t=offset((thunk||iat)+j*8,8),v=b.readBigUInt64LE(t);if(!v)break;const ordinal=Boolean(v>>63n);symbols.push({name:ordinal?'#'+Number(v&65535n):str(offset(Number(v))+2),iatRva:hex(iat+j*8)});}
    imports.push({dll,symbols});}}
  const functions=[];const ex=directories[3];if(ex?.rva){if(ex.size>16*1024*1024||ex.size%12)throw Error('Invalid exception directory');const start=offset(ex.rva,ex.size);for(let p=start;p<start+ex.size;p+=12){const begin=u32(p),end=u32(p+4);if(end>begin)functions.push({begin,end,unwind:u32(p+8)});}}
  const functionAt=rva=>{let lo=0,hi=functions.length-1;while(lo<=hi){const mid=(lo+hi)>>1,f=functions[mid];if(rva<f.begin)hi=mid-1;else if(rva>=f.end)lo=mid+1;else return {begin:hex(f.begin),end:hex(f.end)};}return null;};
  return {metadata:{bytes:b.length,sha256:hash(b),machine:hex(machine),format:'PE32+ AMD64',imageBase:hex(imageBase),entryRva:hex(u32(o+16)),imageSize:u32(o+56),sectionCount:count,sections,directories,certificateTablePresent:Boolean(directories[4]?.size),delayImportsPresent:Boolean(directories[13]?.size),exceptionFunctionCount:functions.length,imports},offset,rvaAt,functionAt};
}
function analyze(b){const pe=parse(b),m=pe.metadata;
  const terms=/\bASAV\b|\bSARC\w*|SettingsProfileSettings|savegame|save.game|autosave|save.archive|save.slot|save.data|save.manager|save.failed|saving.failed|serialization|serializer|deserialize|compress|decompress|zlib|inflate|deflate|oodle|lz4|zstd|encrypt|decrypt|cipher|XGameSave|XUser|BCrypt/i;
  const strings=[];
  for(const section of m.sections.filter(s=>!s.executable&&s.rawSize)){
    const raw=b.toString('latin1',section.rawOffset,section.rawOffset+section.rawSize);
    for(const match of raw.matchAll(/[\x20-\x7e]{6,}/g)){if(match[0].length<=2000&&terms.test(match[0]))strings.push({encoding:'ascii',section:section.name,fileOffset:section.rawOffset+match.index,rva:pe.rvaAt(section.rawOffset+match.index),text:match[0].slice(0,500)});}
    for(const match of raw.matchAll(/(?:[\x20-\x7e]\x00){6,}/g)){const text=match[0].replace(/\x00/g,'');if(text.length<=2000&&terms.test(text))strings.push({encoding:'utf16le',section:section.name,fileOffset:section.rawOffset+match.index,rva:pe.rvaAt(section.rawOffset+match.index),text:text.slice(0,500)});}
  }
  const constants={ASAV:Buffer.from('ASAV'),SARC:Buffer.from('SARC'),effectiveHeaderSeedLE:Buffer.from('ed72f64b','hex'),legacyJenkinsSeedLE:Buffer.from('2571ac3f','hex')},hits={};
  for(const [name,pattern]of Object.entries(constants)){hits[name]=[];let p=-1;while((p=b.indexOf(pattern,p+1))!==-1){const rva=pe.rvaAt(p);hits[name].push({fileOffset:hex(p),rva:rva===null?null:hex(rva),function:rva===null?null:pe.functionAt(rva)});}}
  // Raw RIP-relative LEA/MOV and indirect-import patterns are candidate xrefs only.
  // Instruction boundaries and reachability must be confirmed with a disassembler.
  const targets=new Map(strings.filter(s=>s.rva!==null).map(s=>[s.rva,s]));
  const saveImports=m.imports.flatMap(d=>d.symbols.filter(s=>/XGameSave|XUser|CreateFile|ReadFile|WriteFile|FlushFile|BCrypt|Crypt|Compress|Decompress/i.test(s.name)).map(s=>({...s,dll:d.dll})));
  const iats=new Map(saveImports.map(i=>[parseInt(i.iatRva,16),i]));const xrefs=[];
  for(const section of m.sections.filter(s=>s.executable)){const end=section.rawOffset+section.rawSize;
    for(let p=section.rawOffset;p+7<=end;p++){
      const rex=b[p],op=b[p+1],mod=b[p+2];let length=0,disp=0,kind=null;
      if(rex>=0x48&&rex<=0x4f&&(op===0x8d||op===0x8b)&&(mod&0xc7)===5){length=7;disp=b.readInt32LE(p+3);kind=op===0x8d?'lea-candidate':'mov-candidate';}
      else if(b[p]===0xff&&(b[p+1]===0x15||b[p+1]===0x25)){length=6;disp=b.readInt32LE(p+2);kind=b[p+1]===0x15?'indirect-call-candidate':'indirect-jump-candidate';}
      if(!length)continue;const rva=section.rva+p-section.rawOffset,target=rva+length+disp,term=targets.get(target),imp=iats.get(target);
      if(term||imp)xrefs.push({instructionRva:hex(rva),targetRva:hex(target),kind,function:pe.functionAt(rva),string:term?.text,import:imp?imp.dll+'!'+imp.name:undefined});
    }}
  return {...m,saveImports,strings,constants:hits,candidateXrefs:xrefs,limitations:['String presence does not establish a save routine.','Raw xrefs can include false instruction boundaries.','Exception ranges are runtime metadata, not confirmed source function identities.','No binary execution, authentication verdict, decoder or secret extraction.']};
}
if(require.main===module){const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Usage: node static-pe.cjs INPUT OUTPUT');const b=fs.readFileSync(input);if(b.length>512*1024*1024)throw Error('File too large');const result=analyze(b);if(hash(fs.readFileSync(input))!==result.sha256)throw Error('Input changed');fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({sha256:result.sha256,sections:result.sectionCount,functions:result.exceptionFunctionCount,imports:result.imports.reduce((n,d)=>n+d.symbols.length,0),saveStrings:result.strings.length,xrefs:result.candidateXrefs.length,constantCounts:Object.fromEntries(Object.entries(result.constants).map(([k,v])=>[k,v.length]))}));}
module.exports={parse,analyze};
