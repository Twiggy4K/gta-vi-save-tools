'use strict';
// Independent greedy raw-LZ4 encoder. Leaves the final five bytes literal and
// starts the final match at least twelve bytes before the input end.
function encodeBlock(input){
 if(!Buffer.isBuffer(input)||input.length>64*1024*1024)throw new RangeError('Expected at most 64 MiB');
 const out=Buffer.alloc(input.length+Math.ceil(input.length/255)+32),table=new Int32Array(65536).fill(-1);let op=0,p=0,anchor=0;
 const hash=pos=>Math.imul(input.readUInt32LE(pos),0x9e3779b1)>>>16;
 function ext(n){while(n>=255){out[op++]=255;n-=255;}out[op++]=n;}
 function sequence(end,match,length){const literals=end-anchor,ml=length?length-4:0;out[op++]=(Math.min(literals,15)<<4)|Math.min(ml,15);if(literals>=15)ext(literals-15);input.copy(out,op,anchor,end);op+=literals;if(length){out.writeUInt16LE(end-match,op);op+=2;if(ml>=15)ext(ml-15);}}
 while(p<=input.length-12){const h=hash(p),match=table[h];table[h]=p;
  if(match>=0&&p-match<=65535&&input.readUInt32LE(match)===input.readUInt32LE(p)){
   let length=4;while(p+length<input.length-5&&input[match+length]===input[p+length])length++;
   sequence(p,match,length);const old=p;p+=length;anchor=p;
   for(let j=old+1;j<p&&j<=input.length-12;j++)table[hash(j)]=j;
  }else p++;
 }
 sequence(input.length,0,0);return Buffer.from(out.subarray(0,op));
}
module.exports={encodeBlock};
