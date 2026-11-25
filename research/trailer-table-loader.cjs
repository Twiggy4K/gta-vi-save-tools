'use strict';
const path=require('node:path'),{execFileSync}=require('node:child_process');
const {makeEncodedOps,makeWordDecoder}=require('./encoded-trailer-ops.cjs');
function loadTrailerTables(binary,pe){
  const byteTable=Buffer.from(binary.subarray(pe.offset(0x5f459b0,0x20000),pe.offset(0x5f459b0,0x20000)+0x20000));
  let byteMask=0;for(const b of byteTable)byteMask^=b;for(let i=0;i<byteTable.length;i++)byteTable[i]^=byteMask;
  const localScript=path.join(__dirname,'expand-trailer-table.py');
  let command='python3',args=[localScript,String(pe.offset(0x5f659b0,0x4f4c5))];
  if(process.platform==='win32'){
    if(!/^[a-z]:[\\/]/i.test(localScript))throw new Error('The Windows research checkout must use a drive-letter path for WSL');
    const script='/mnt/'+localScript[0].toLowerCase()+localScript.slice(2).replaceAll('\\','/');
    command='wsl.exe';args=['-e','python3',script,args[1]];
  }
  const wordTable=execFileSync(command,args,{maxBuffer:1024*1024,windowsHide:true});
  if(wordTable.length!==0x90000)throw new Error('Unexpected word table length');
  let wordMask=0;for(let i=0;i<wordTable.length;i+=2)wordMask^=wordTable.readUInt16LE(i);
  for(let i=0;i<wordTable.length;i+=2)wordTable.writeUInt16LE(wordTable.readUInt16LE(i)^wordMask,i);
  const byte=r=>binary[pe.offset(r)],check=(i,n)=>{if(!Number.isSafeInteger(i)||i<0||i>=n)throw new RangeError('Lookup outside reconstructed table');return i;};
  const ops=makeEncodedOps({mapByte:i=>byte(0x5fb4e80+i),lookupByte:i=>byteTable[check(i,byteTable.length)],lookupWord:i=>wordTable.readUInt16LE(check(i,wordTable.length/2)*2)});
  return {ops,decodeWord:makeWordDecoder(ops,i=>byte(0x5fbddd0+i)),metadata:{byteTableBytes:byteTable.length,wordTableBytes:wordTable.length,tablesWrittenToDisk:false}};
}
module.exports={loadTrailerTables};
