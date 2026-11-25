'use strict';
// Bounded mathematical evaluation of the reviewed final-stage data flow.
// No native code, executable pages, imports, syscalls, network or writes to
// external memory are available. Every procedure and helper call is allowlisted.
const fs=require('node:fs');
const MASK=(1n<<64n)-1n,BASE=0x140000000n;
function loadReviewedListing(file){
  return parseReviewedText(fs.readFileSync(file,'utf8'));
}
function parseReviewedText(text){
  const rows=[];
  for(const line of text.split(/\r?\n/)){
    const m=line.match(/^\s*([0-9a-f]+):\t([0-9a-f ]+)\t([a-z][a-z0-9]*)\s*(.*)$/i);
    if(!m)continue;
    let op=m[3],args=m[4].split('#')[0].trim();
    if(op==='rex'){op=args.split(/\s/)[0];args=args.slice(op.length).trim();}
    const target=line.match(/#\s*(0x[0-9a-f]+)/i);
    rows.push({at:BigInt('0x'+m[1]),op,args:args?args.split(',').map(x=>x.trim()):[],ripTarget:target?BigInt(target[1]):null});
  }
  return rows;
}
function makeModel(binary,pe,tables,files){
  const program=new Map();for(const file of files)for(const row of typeof file==='string'?loadReviewedListing(file):file)program.set(row.at.toString(),row);
  const ordered=[...program.values()].sort((a,b)=>a.at<b.at?-1:1),next=new Map();
  for(let i=0;i<ordered.length-1;i++)next.set(ordered[i].at.toString(),ordered[i+1].at);
  const memory=Buffer.alloc(0x400000),regs=new Map(),vectors=new Map();let heap=0x10000,steps=0,calls=0;
  let comparison={zero:false,unsignedLess:false,signedLess:false};
  const procedures=new Set([0x560ddf0,0x560db40,0x560df50,0x560e140,0x560e6c0,0x560ec40,0x560eef0,0x560f1a0,0x560f320,0x5613250].map(n=>(BASE+BigInt(n)).toString()));
  const aliases={};for(const [full,d,w,b] of [['rax','eax','ax','al'],['rbx','ebx','bx','bl'],['rcx','ecx','cx','cl'],['rdx','edx','dx','dl'],['rsi','esi','si','sil'],['rdi','edi','di','dil'],['rbp','ebp','bp','bpl'],['rsp','esp','sp','spl']])for(const [name,bits] of [[full,64],[d,32],[w,16],[b,8]])aliases[name]={full,bits};
  for(let i=8;i<16;i++)for(const [suffix,bits] of [['',64],['d',32],['w',16],['b',8]])aliases['r'+i+suffix]={full:'r'+i,bits};
  function reg(name){const a=aliases[name];if(!a)throw new Error('Unsupported register '+name);return (regs.get(a.full)||0n)&((1n<<BigInt(a.bits))-1n);}
  function setReg(name,value){const a=aliases[name];if(!a)throw new Error('Unsupported register '+name);const mask=(1n<<BigInt(a.bits))-1n;value&=mask;regs.set(a.full,a.bits>=32?value:((regs.get(a.full)||0n)&(MASK^mask))|value);}
  function address(arg,row){
    const m=arg.match(/\[([^\]]+)\]/);if(!m)throw new Error('Expected bounded address');
    if(m[1].includes('rip')){if(row.ripTarget===null)throw new Error('Unresolved static reference');return row.ripTarget;}
    let result=0n;for(const term of m[1].replace(/-/g,'+-').split('+').filter(Boolean)){
      const sign=term[0]==='-'?-1n:1n,part=term.replace(/^-/,'');let product=1n;
      for(const factor of part.split('*'))product*=aliases[factor]?reg(factor):BigInt(factor);
      result+=sign*product;
    }
    return result&MASK;
  }
  function readBytes(at,n){
    if(at>=BASE){const offset=pe.offset(Number(at-BASE),n);return binary.subarray(offset,offset+n);}
    const off=Number(at);if(!Number.isSafeInteger(off)||off<0||off+n>memory.length)throw new Error('Read outside model memory');return memory.subarray(off,off+n);
  }
  function writeBytes(at,b){const off=Number(at);if(at>=BASE||!Number.isSafeInteger(off)||off<0||off+b.length>memory.length)throw new Error('Write outside model memory');b.copy(memory,off);}
  function width(arg){if(aliases[arg])return aliases[arg].bits;const m=arg.match(/^(BYTE|WORD|DWORD|QWORD|XMMWORD|YMMWORD) PTR/);if(!m)throw new Error('Missing operand width');return {BYTE:8,WORD:16,DWORD:32,QWORD:64,XMMWORD:128,YMMWORD:256}[m[1]];}
  function read(arg,row,bits){
    if(aliases[arg])return reg(arg);
    if(arg.includes('[')){const b=readBytes(address(arg,row),(bits||width(arg))/8);let value=0n;for(let i=b.length-1;i>=0;i--)value=(value<<8n)|BigInt(b[i]);return value;}
    return BigInt(arg);
  }
  function write(arg,value,row){
    if(aliases[arg])return setReg(arg,value);
    const n=width(arg)/8,b=Buffer.alloc(n);let v=value&((1n<<BigInt(n*8))-1n);for(let i=0;i<n;i++){b[i]=Number(v&255n);v>>=8n;}writeBytes(address(arg,row),b);
  }
  function vec(arg,row,n){if(/^[xy]mm\d+$/.test(arg))return Buffer.from((vectors.get(arg.replace('ymm','xmm'))||Buffer.alloc(32)).subarray(0,n));return Buffer.from(readBytes(address(arg,row),n));}
  function putVec(arg,row,value){if(/^[xy]mm\d+$/.test(arg)){const b=Buffer.alloc(32);value.copy(b);vectors.set(arg.replace('ymm','xmm'),b);}else writeBytes(address(arg,row),value);}
  function compare(a,b,bits){const mask=(1n<<BigInt(bits))-1n;a&=mask;b&=mask;const signed=v=>v&(1n<<BigInt(bits-1))?v-(1n<<BigInt(bits)):v;comparison={zero:a===b,unsignedLess:a<b,signedLess:signed(a)<signed(b)};}
  function push(v){setReg('rsp',reg('rsp')-8n);const b=Buffer.alloc(8);b.writeBigUInt64LE(v&MASK);writeBytes(reg('rsp'),b);}
  function pop(){const v=readBytes(reg('rsp'),8).readBigUInt64LE();setReg('rsp',reg('rsp')+8n);return v;}
  function invokeHelper(target){
    const rva=Number(target-BASE);if(rva===0x55ea040||rva===0x5647140)return true;
    if(![0x5604380,0x5604460,0x5604580].includes(rva))return false;
    const token=reg('rcx'),a=reg('rdx'),b=reg('r8'),out=reg(rva===0x5604460?'r8':'r9');
    const {tokenFields}=require('./encoded-trailer-ops.cjs'),f=tokenFields(token);
    const need=f.prefix+f.count+f.tail+4,outSize=f.count+f.tail;
    // Views preserve aliasing where a helper updates a buffer in place.
    const av=readBytes(a,need),bv=rva===0x5604460?null:readBytes(b,need),ov=readBytes(out,outSize);
    if(out>=BASE)throw new Error('Static helper output rejected');
    if(rva===0x5604380)tables.ops.binary(token,av,bv,ov);
    else if(rva===0x5604580)tables.ops.shifted(token,av,bv,ov);
    else tables.ops.unaryWord(token,av,ov);
    calls++;return true;
  }
  function run(entry,depth=0){
    if(depth>20||!procedures.has(entry.toString()))throw new Error('Procedure outside model allowlist');
    let pc=entry;
    while(true){
      if(++steps>1000000)throw new Error('Arithmetic model step budget exceeded');
      const row=program.get(pc.toString());if(!row)throw new Error('Missing reviewed instruction at '+pc.toString(16));
      const [a,b,c]=row.args,op=row.op;let jump=null;
      try{
        if(['nop','data16','cs','vzeroupper'].includes(op)){}
        else if(op==='push')push(read(a,row));
        else if(op==='pop')write(a,pop(),row);
        else if(op==='ret'){pop();return;}
        else if(op==='lea')write(a,address(b,row),row);
        else if(['mov','movabs','movzx'].includes(op))write(a,read(b,row),row);
        else if(op==='movsxd')write(a,BigInt.asIntN(32,read(b,row)),row);
        else if(['vmovups','vmovdqu','vmovsd'].includes(op)){const n=op==='vmovsd'?8:(a.includes('ymm')||b.includes('ymm')||a.includes('YMMWORD')||b.includes('YMMWORD')?32:16);putVec(a,row,vec(b,row,n));}
        else if(op==='vpxor'){const n=a.includes('ymm')?32:16,x=vec(b,row,n),y=vec(c,row,n);for(let i=0;i<n;i++)x[i]^=y[i];putVec(a,row,x);}
        else if(['add','sub','xor','and','or','inc','dec'].includes(op)){
          const x=read(a,row),y=b===undefined?1n:read(b,row);let v;
          if(op==='add'||op==='inc')v=x+y;else if(op==='sub'||op==='dec')v=x-y;else if(op==='xor')v=x^y;else if(op==='and')v=x&y;else v=x|y;
          write(a,v,row);compare(v,0n,width(a));
        }
        else if(op==='imul')write(a,read(b,row)*read(c,row),row);
        else if(op==='cmp')compare(read(a,row),read(b,row),width(a));
        else if(op==='test'){compare(read(a,row)&read(b,row),0n,width(a));}
        else if(op==='call'){
          const target=BigInt(a);if(!invokeHelper(target)){push(next.get(pc.toString()));run(target,depth+1);}
        }
        else if(op==='jmp')jump=BigInt(a);
        else if(['je','jz','jne','jnz','jb','jae','ja','jbe','jl','jge'].includes(op)){
          const f=comparison,take={je:f.zero,jz:f.zero,jne:!f.zero,jnz:!f.zero,jb:f.unsignedLess,jae:!f.unsignedLess,ja:!f.zero&&!f.unsignedLess,jbe:f.zero||f.unsignedLess,jl:f.signedLess,jge:!f.signedLess}[op];if(take)jump=BigInt(a);
        }
        else throw new Error('Unsupported model operation '+op);
      }catch(error){throw new Error('Model at '+pc.toString(16)+' ('+op+'): '+error.message);}
      pc=jump===null?next.get(pc.toString()):jump;if(pc===undefined)throw new Error('Missing model continuation');
    }
  }
  function alloc(b){if(typeof b==='number')b=Buffer.alloc(b);const at=heap;heap+=b.length+64;if(heap>=0x100000)throw new Error('Model heap exhausted');writeBytes(BigInt(at),b);return BigInt(at);}
  function call(rva,args,stackArgs=[]){setReg('rsp',0x3f0000n);for(let i=0;i<args.length;i++)setReg(['rcx','rdx','r8','r9'][i],args[i]);for(let i=0;i<stackArgs.length;i++){const b=Buffer.alloc(8);b.writeBigUInt64LE(stackArgs[i]);writeBytes(reg('rsp')+0x20n+BigInt(i*8),b);}push(0n);run(BASE+BigInt(rva));}
  return {alloc,call,read:(at,n)=>Buffer.from(readBytes(at,n)),metadata:()=>({steps,lookupCalls:calls,nativeCodeExecuted:false})};
}
module.exports={makeModel,loadReviewedListing,parseReviewedText};
