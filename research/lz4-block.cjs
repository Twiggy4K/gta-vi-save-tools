'use strict';
// Independent bounded reader for the public LZ4 block format. No target code.
function decodeBlock(input,limit){
  if(!Buffer.isBuffer(input))throw new TypeError('Expected Buffer');
  if(!Number.isSafeInteger(limit)||limit<0||limit>64*1024*1024)throw new RangeError('Output limit must be 0..64 MiB');
  const out=Buffer.alloc(limit);let ip=0,op=0;
  const byte=()=>{if(ip>=input.length)throw new Error('Truncated LZ4 block');return input[ip++];};
  function length(n){if(n===15){let x;do{x=byte();n+=x;if(n>limit)throw new Error('Output limit exceeded');}while(x===255);}return n;}
  if(input.length===0)throw new Error('Missing token');
  while(ip<input.length){
    const token=byte(),literals=length(token>>>4);
    if(literals>input.length-ip)throw new Error('Truncated literals');
    if(literals>limit-op)throw new Error('Output limit exceeded');
    input.copy(out,op,ip,ip+literals);ip+=literals;op+=literals;
    if(ip===input.length)return out.subarray(0,op);
    const offset=byte()|(byte()<<8);
    if(offset===0||offset>op)throw new Error('Invalid match offset');
    const match=length(token&15)+4;
    if(match>limit-op)throw new Error('Output limit exceeded');
    for(let i=0;i<match;i++){out[op]=out[op-offset];op++;}
  }
  throw new Error('Missing final literal sequence');
}
module.exports={decodeBlock};
