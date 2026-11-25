'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const forbidden=[];let files=0;
const blockedDir=new Set(['private-inputs','private-fixtures','private-listings','private-outputs']);
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 const full=path.join(dir,entry.name),rel=path.relative(root,full).replaceAll('\\','/');
 if(entry.name==='.git'||entry.name==='node_modules')continue;
 if(entry.isSymbolicLink()){forbidden.push(rel+' (symlink)');continue;}
 if(entry.isDirectory()){if(blockedDir.has(entry.name.toLowerCase()))forbidden.push(rel+' (private directory)');else walk(full);continue;}
 files++;
 if(/(?:-disassembly\.txt$|\.(?:exe|elf|bin|asav|zip|rar|png|jpe?g|xci|nsp)$|(?:^|\/)(?:node-runtime\.json|runtime\.local\.json|PS5IMAGE|PS5KEY|param\.sfo|keystone|memory\.dat|SARC\d+|\.env(?:\..*)?)$)/i.test(rel))forbidden.push(rel+' (excluded asset)');
 if(fs.statSync(full).size>1024*1024){forbidden.push(rel+' (unexpected large file)');continue;}
 const text=fs.readFileSync(full,'utf8');if(/(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----)/.test(text))forbidden.push(rel+' (possible credential)');
 if(/[A-Z]:[\\/](?:Users|Dev)[\\/]/i.test(text))forbidden.push(rel+' (machine-specific absolute path)');
}}
walk(root);if(forbidden.length){console.error(JSON.stringify({passed:false,findings:forbidden}));process.exitCode=1;}else console.log(JSON.stringify({passed:true,files,privateAssetsIncluded:false}));
