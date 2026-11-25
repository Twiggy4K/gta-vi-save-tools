'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{accountWireHex,equalFields}=require('./sfo-metadata.cjs');
function sfo(){const b=Buffer.alloc(56);b.writeUInt32LE(0x46535000);b.writeUInt32LE(36,8);b.writeUInt32LE(48,12);b.writeUInt32LE(1,16);b.writeUInt32LE(8,24);b.write('ACCOUNT_ID',36);Buffer.from([1,2,3,4,5,6,7,8]).copy(b,48);return b;}
test('account wire form preserves original bytes, not a reversed display number',()=>assert.equal(accountWireHex(sfo()),'0102030405060708'));
test('account metadata comparison detects reversed binding',()=>{const a=sfo(),b=Buffer.from(a);b.subarray(48).reverse();assert(!equalFields(a,b));assert(equalFields(a,Buffer.from(a)));});
