'use strict';
// Empirically recovered from seven private ASAV samples. Header-only support.
const HEADER_BYTES = 0x170;
const CHECKSUM_OFFSET = 0x160;
const SEED = 0x4bf672ed;

function checkHeader(data) {
  if (!Buffer.isBuffer(data) || data.length < HEADER_BYTES || data.toString('ascii',0,4) !== 'ASAV') throw new Error('Not a complete ASAV header');
  if (data.readUInt32LE(4) !== 1) throw new Error('Unsupported ASAV version');
}
function headerChecksum(data) {
  checkHeader(data);
  let hash = SEED;
  for (let i=0;i<HEADER_BYTES;i++) {
    const byte = i>=CHECKSUM_OFFSET && i<CHECKSUM_OFFSET+4 ? 0 : data.readInt8(i);
    hash = (hash + byte) >>> 0;
    hash = (hash + (hash << 10)) >>> 0;
    hash ^= hash >>> 6;
  }
  hash = (hash + (hash << 3)) >>> 0;
  hash ^= hash >>> 11;
  return (hash + (hash << 15)) >>> 0;
}
function verifyHeader(data) {
  const computed=headerChecksum(data), stored=data.readUInt32LE(CHECKSUM_OFFSET);
  return {stored:stored.toString(16).padStart(8,'0'),computed:computed.toString(16).padStart(8,'0'),valid:stored===computed,coverage:'Header bytes only; does not authenticate or validate the game body'};
}
function titleCopy(data,title) {
  if (!verifyHeader(data).valid) throw new Error('Input header checksum is invalid');
  const end=data.readBigUInt64LE(0x168);
  if(end<BigInt(HEADER_BYTES)||end>BigInt(data.length))throw new Error('Invalid stored end');
  if(typeof title!=='string'||title.includes('\0')||!title.isWellFormed()||Buffer.byteLength(title,'utf16le')>254)throw new Error('Title must fit 127 UTF-16 code units, without NUL or unpaired surrogates');
  const output=Buffer.from(data);
  output.fill(0,0x28,0x128);output.write(title,0x28,254,'utf16le');
  output.writeUInt32LE(headerChecksum(output),CHECKSUM_OFFSET);
  return output;
}
module.exports={headerChecksum,verifyHeader,titleCopy,HEADER_BYTES,SEED};
