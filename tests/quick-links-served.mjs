import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const base=process.env.DIRECT_URL||'https://rajeshceg3.github.io/RelaxInJapan/';const html=fs.readFileSync('index.html','utf8');
const files=['index.html',...new Set([...html.matchAll(/(?:src|href)="((?:js|css)\/[^"?#]+)"/g)].map(x=>x[1]))];const results=[];
for(const file of files){const url=new URL(file,base).href,local=fs.readFileSync(file),remote=execFileSync('curl',['--fail','--silent','--show-error','--location','--max-time','30',url]);const hash=b=>crypto.createHash('sha256').update(b).digest('hex');const row={file,url,local:hash(local),served:hash(remote),match:local.equals(remote)};results.push(row);console.log(file,row.match);}
fs.writeFileSync('docs/quick-links-recovery/served-hashes.json',JSON.stringify(results,null,2));if(results.some(x=>!x.match))process.exitCode=1;
