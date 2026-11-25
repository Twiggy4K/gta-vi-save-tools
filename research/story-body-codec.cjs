'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const {parse}=require('./static-pe.cjs'),{makeBlockTransform,makeCounterStream}=require('./protection-model.cjs'),{decodeBlock}=require('./lz4-block.cjs');
function createBodyCodec(){
 const binary=fs.readFileSync(__dirname+'/private-inputs/game_scarlett_master.exe');
 if(crypto.createHash('sha256').update(binary).digest('hex')!=='e95020b2fa4a721db3df59fdecf75621730ac559d8835252f6c3b658d5a08993')throw new Error('Executable fingerprint mismatch');
 const pe=parse(binary),read=(r,n)=>binary.subarray(pe.offset(r,n),pe.offset(r,n)+n),matches=[];
 for(let i=0;i<24;i++){const r=read(0x66e5900+i*24,24);if(r.readBigUInt64LE()===(0xc3n<<32n|3n<<24n))matches.push({rva:Number(r.readBigUInt64LE(8)-0x140000000n),size:Number(r.readBigUInt64LE(16))});}
 if(matches.length!==1||matches[0].size!==4340)throw new Error('Unsupported body descriptor');
 const d=read(matches[0].rva,4340);if(d.readUInt32LE()!==0x57aa38aa)throw new Error('Body descriptor marker');
 const block=makeBlockTransform({roundWords:Uint32Array.from({length:60},(_,i)=>d.readUInt32LE(4+i*4)),
 inputMaps:Array.from({length:16},(_,i)=>Uint8Array.from(read(0x60c0be0+i*256,256))),
 mixTables:Array.from({length:16},(_,i)=>Uint32Array.from({length:256},(_,j)=>read(0x60c1be0+i*1024+j*4,4).readUInt32LE())),
 outputMaps:Array.from({length:16},(_,i)=>Uint8Array.from(d.subarray(244+i*256,244+(i+1)*256)))});
 const counter=Buffer.from(read(0x62fda90,16)),crypt=input=>makeCounterStream(block,counter)(input);
 return {crypt,decode(data){
  if(!Buffer.isBuffer(data)||data.length<0x190||data.toString('ascii',0,4)!=='ASAV'||data.readUInt32LE(4)!==1||data.readUInt32LE(8)!==1||data.readUInt32LE(12)!==3)throw new Error('Unsupported ASAV story save');
  const end=Number(data.readBigUInt64LE(0x168));if(!Number.isSafeInteger(end)||end>data.length||end<0x190||(end-0x190)%16)throw new Error('Invalid story framing');
  const padded=crypt(data.subarray(0x170,end-32)),pad=padded.at(-1);
  if(pad<1||pad>16||!padded.subarray(-pad).every(v=>v===pad))throw new Error('Invalid body padding');
  const packed=padded.subarray(0,padded.length-pad);if(packed.length+0x170!==data.readUInt32LE(0x18))throw new Error('Packed length mismatch');
  const size=data.readUInt32LE(0x1c)-0x170;if(size<16||size>64*1024*1024)throw new Error('Invalid decoded size');
  const plain=decodeBlock(packed,size);if(plain.length!==size)throw new Error('Logical length mismatch');
  return {plain,packed,padded,end,pad};
 }};
}
module.exports={createBodyCodec};
