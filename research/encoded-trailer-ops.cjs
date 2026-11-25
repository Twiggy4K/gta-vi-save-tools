'use strict';
// Mathematical reconstruction of three reviewed lookup/carry helpers.
// All tables are supplied by callbacks; no proprietary data is embedded.
function tokenFields(token){
  if(typeof token!=='bigint'||token<0n||token>0xffffffffffffffffn)throw new TypeError('Expected uint64 token');
  return {offset:Number(token&0x3fffffn),prefix:Number((token>>22n)&0x3fffn),count:Number((token>>36n)&0x3fffn),tail:Number(token>>50n)};
}
function unpack3(input,count){
  if(!Buffer.isBuffer(input)||!Number.isInteger(count)||count<0||count>1000000||Math.ceil(count*3/8)>input.length)throw new RangeError('Invalid packed symbol range');
  const out=Buffer.alloc(count);
  for(let i=0;i<count;i++){const bit=i*3,at=bit>>>3,shift=bit&7;out[i]=((input[at]|((input[at+1]||0)<<8))>>>shift)&7;}
  return out;
}
function makeEncodedOps({mapByte,lookupByte,lookupWord}){
  if([mapByte,lookupByte,lookupWord].some(f=>typeof f!=='function'))throw new TypeError('Expected lookup callbacks');
  const get=(b,i)=>{if(!(b instanceof Uint8Array)||i<0||i>=b.length)throw new RangeError('Encoded input out of bounds');return b[i];};
  const put=(b,i,v)=>{if(!(b instanceof Uint8Array)||i<0||i>=b.length)throw new RangeError('Encoded output out of bounds');b[i]=v&7;};
  const mapped=(offset,i)=>{const v=mapByte(offset+i);if(!Number.isInteger(v)||v<0||v>255)throw new RangeError('Invalid mapping byte');return v;};
  const byte=(i)=>{const v=lookupByte(i);if(!Number.isInteger(v)||v<0||v>255)throw new RangeError('Invalid byte lookup');return v;};
  const word=(i)=>{const v=lookupWord(i);if(!Number.isInteger(v)||v<0||v>65535)throw new RangeError('Invalid word lookup');return v;};
  // RVA 0x5604380: count outputs use both inputs; tail uses the second input.
  function binary(token,a,b,out){
    const f=tokenFields(token);let carry=0;
    for(let i=0;i<f.count;i++){
      carry=byte((((mapped(f.offset,i)<<3)^get(b,i))<<8)^get(a,i)^(carry&0xf8));
      put(out,i,carry);
    }
    for(let i=0;i<f.tail;i++){
      carry=byte((((mapped(f.offset,f.count+i)<<3)^get(b,f.count+i))<<8)^(carry&0xf8));
      put(out,f.count+i,carry);
    }
  }
  // RVA 0x5604580: skip prefix outputs while retaining carry, then emit.
  function shifted(token,a,b,out){
    const f=tokenFields(token);let carry=0;
    for(let i=0;i<f.prefix;i++)carry=byte((((mapped(f.offset,i)<<3)^get(b,i))<<8)^get(a,i)^(carry&0xf8));
    for(let i=0;i<f.count;i++){
      const j=f.prefix+i;
      carry=byte((((mapped(f.offset,j)<<3)^get(b,j))<<8)^get(a,j)^(carry&0xf8));
      put(out,i,carry);
    }
    for(let i=0;i<f.tail;i++){
      carry=byte((mapped(f.offset,f.prefix+f.count+i)<<11)^(carry&0xf8));
      put(out,f.count+i,carry);
    }
  }
  // RVA 0x5604460: word lookup family; tail reuses input starting at index 2.
  function unaryWord(token,a,out){
    const f=tokenFields(token);let carry=0;
    for(let i=0;i<f.prefix;i++)carry=word((mapped(f.offset,i)<<12)^get(a,i)^(carry&0xff8));
    for(let i=0;i<f.count;i++){
      const j=f.prefix+i;
      carry=word((mapped(f.offset,j)<<12)^get(a,j)^(carry&0xff8));
      put(out,i,carry);
    }
    for(let i=0;i<f.tail;i++){
      carry=word((mapped(f.offset,f.prefix+f.count+i)<<12)^get(a,2+i)^carry);
      put(out,f.count+i,carry);
    }
  }
  return {binary,shifted,unaryWord};
}
function parseSetupPayload(input){
  if(!Buffer.isBuffer(input)||input.length!==277)throw new RangeError('Expected 277-byte setup payload');
  const state=Buffer.alloc(0x218);let at=0;
  input.copy(state,0,at,at+8);at+=8;
  for(let i=0;i<4;i++){unpack3(input.subarray(at,at+25),66).copy(state,8+i*66);at+=25;}
  input.copy(state,0x110,at,at+8);at+=8;
  for(let i=0;i<8;i++){unpack3(input.subarray(at,at+7),18).copy(state,0x118+i*18);at+=7;}
  state[0x1a8]=input[at++]===1?1:0;
  input.copy(state,0x1a9,at,at+64);at+=64;
  input.copy(state,0x1f0,at,at+8);at+=8;
  input.copy(state,0x1f8,at,at+32);at+=32;
  if(at!==277)throw new Error('Setup layout mismatch');
  return state;
}
// RVA 0x560d410: reconstructs a 32-bit value through reviewed helper calls.
function makeWordDecoder(ops,nibbleByte){
  return function decodeWord(input){
    if(!(input instanceof Uint8Array)||input.length<18)throw new RangeError('Expected 18 encoded symbols');
    const first=Buffer.alloc(32),work=Buffer.alloc(32),a=Buffer.alloc(4),b=Buffer.alloc(4);
    ops.binary(0x12000004624n,input,input,first);
    ops.unaryWord(0xc00f000c047aan,first,work);
    let out=0;
    for(let i=0;i<8;i++){
      ops.binary(0x4000003b48n,work,work,a);
      if(i<7)ops.shifted(0x80100008066bbn,work,work,work);
      ops.binary(0x40000060e8n,a,a,b);
      const n=nibbleByte((b[3]<<3)^b[2]);
      if(!Number.isInteger(n)||n<0||n>255)throw new RangeError('Invalid nibble lookup');
      const digit=i&1?n>>>4:n&15;
      out=(out|(digit<<(i*4)))>>>0;
    }
    return out;
  };
}
module.exports={tokenFields,unpack3,makeEncodedOps,parseSetupPayload,makeWordDecoder};
