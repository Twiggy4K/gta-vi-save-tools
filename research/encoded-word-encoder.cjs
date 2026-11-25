'use strict';
// Mathematical reconstruction of RVA 0x560d580 and the first-word bridge
// at 0x5612d30. Target machine code is never executed.
function makeWordEncoder(ops,byteAt){
  return function encodeWord(value,slotToken=0x1200000311bn){
    if(!Number.isInteger(value)||value<0||value>0xffffffff)throw new RangeError('Expected uint32');
    const shares=[];
    for(const base of [0x5fbde10,0x5fbe110]){
      const raw=Buffer.alloc(24),pieces=Buffer.alloc(32),joined=Buffer.alloc(24),out=Buffer.alloc(40);
      for(let i=0;i<4;i++)for(let j=0;j<3;j++){
        const b=byteAt(base+((value>>>(8*i))&255)*3+j);
        raw[6*i+2*j]=b&7;raw[6*i+2*j+1]=b>>>3;
      }
      for(let i=0;i<4;i++){
        const token=base===0x5fbde10?(i?0x6000005274n:0x60000059f7n):(i?0x6000001602n:0x6000002182n);
        ops.binary(token,raw.subarray(6*i),raw.subarray(6*i),pieces.subarray(i?8+6*(i-1):0));
      }
      pieces.copy(joined,0,0,6);
      for(let i=1;i<4;i++)pieces.copy(joined,6+4*(i-1),10+6*(i-1),14+6*(i-1));
      ops.shifted(base===0x5fbde10?0x40012000004770n:0x40012000001eb0n,joined,joined,out);
      shares.push(out);
    }
    const sum=Buffer.alloc(40),normalized=Buffer.alloc(40),encoded=Buffer.alloc(18);
    ops.binary(0x22000002590n,shares[0],shares[1],sum);
    ops.unaryWord(0xc01f000c0684cn,sum,normalized);
    ops.binary(slotToken,normalized,normalized,encoded);
    return encoded;
  };
}
module.exports={makeWordEncoder};
