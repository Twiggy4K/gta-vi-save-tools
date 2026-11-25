'use strict';
// Parameterized reconstruction candidate. Contains no proprietary tables or keys.
function makeBlockTransform({inputMaps,mixTables,roundWords,outputMaps}){
  function tables(a,Type){if(!Array.isArray(a)||a.length!==16||a.some(t=>!(t instanceof Type)||t.length!==256))throw new TypeError('Expected sixteen 256-entry '+Type.name+' tables');}
  tables(inputMaps,Uint8Array);tables(mixTables,Uint32Array);tables(outputMaps,Uint8Array);
  if(!(roundWords instanceof Uint32Array)||roundWords.length<56)throw new TypeError('Expected at least 56 round words');
  // Copy supplied parameters, so caller mutation cannot alter an active model.
  inputMaps=inputMaps.map(t=>t.slice());mixTables=mixTables.map(t=>t.slice());outputMaps=outputMaps.map(t=>t.slice());roundWords=roundWords.slice();
  const pick=(w,row)=>(w>>>(24-row*8))&255;
  return function transform(block){
    if(!Buffer.isBuffer(block)||block.length!==16)throw new TypeError('Expected a 16-byte block');
    let state=new Uint32Array(4);
    for(let col=0;col<4;col++){
      let w=0;for(let row=0;row<4;row++){const i=col*4+row;w=(w<<8)|inputMaps[i][block[i]];}
      state[col]=(w^roundWords[col])>>>0;
    }
    for(let round=1;round<=13;round++){
      const next=new Uint32Array(4);
      for(let col=0;col<4;col++){
        let w=roundWords[round*4+col];
        for(let row=0;row<4;row++){
          const src=(col+row)&3;
          w^=mixTables[src*4+row][pick(state[src],row)];
        }
        next[col]=w>>>0;
      }
      state=next;
    }
    const out=Buffer.alloc(16);
    for(let col=0;col<4;col++)for(let row=0;row<4;row++){
      const i=col*4+row;out[i]=outputMaps[i][pick(state[(col+row)&3],row)];
    }
    return out;
  };
}
function makeCounterStream(transform,initialCounter,width=16){
  if(typeof transform!=='function'||!Buffer.isBuffer(initialCounter)||initialCounter.length!==16)throw new TypeError('Expected transform and 16-byte counter');
  if(!Number.isInteger(width)||width<1||width>16)throw new RangeError('Counter width must be 1..16');
  const counter=Buffer.from(initialCounter);let stream=Buffer.alloc(0),used=0;
  return function update(input){
    if(!Buffer.isBuffer(input))throw new TypeError('Expected Buffer');
    const out=Buffer.alloc(input.length);
    for(let i=0;i<input.length;i++){
      if(used===stream.length){
        stream=transform(Buffer.from(counter));
        if(!Buffer.isBuffer(stream)||stream.length!==16)throw new Error('Transform returned invalid block');
        stream=Buffer.from(stream);used=0;
        for(let j=15;j>=16-width;j--){counter[j]=(counter[j]+1)&255;if(counter[j]!==0)break;}
      }
      out[i]=input[i]^stream[used++];
    }
    return out;
  };
}
module.exports={makeBlockTransform,makeCounterStream};
