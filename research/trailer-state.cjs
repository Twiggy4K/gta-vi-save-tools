'use strict';
// Slot bridges from 0x5612d30 and 0x5612ab0. Values here are operation
// selectors, not recovered secret parameters.
const ENCODE=[0x1200000311bn,0x12000005adan,0x1200000165en,0x12000001c25n,0x12000006781n,0x120000045d1n,0x1200000203an,0x1200000650dn];
const NORMALIZE=[0x40012000000c39n,0x40012000001215n,0x400120000043dan,0x40012000004b94n,0x40012000003ec6n,0x40012000005f00n,0x40012000002385n,0x400120000023e8n];
function decodeSlot(tables,input,slot){
  if(!Number.isInteger(slot)||slot<0||slot>=8||input.length<18)throw new RangeError('Invalid state slot');
  const work=Buffer.alloc(40);tables.ops.shifted(NORMALIZE[slot],input,input,work);return tables.decodeWord(work);
}
function decodeState(tables,state){
  if(!Buffer.isBuffer(state)||state.length<0x1a8)throw new RangeError('Truncated state');
  return NORMALIZE.map((_,i)=>decodeSlot(tables,state.subarray(0x118+i*18,0x118+(i+1)*18),i));
}
module.exports={ENCODE,NORMALIZE,decodeSlot,decodeState};
