/* Manual link files. No cloud transfer, no automatic recovery writes. */
(function(root){
 'use strict';
 const KEY='quickLinks',APP='relax-in-japan-links',LIMIT=1024*1024;
 function safeURL(value){
  if(typeof value!=='string'||value.length>8192)throw Error('A link URL is invalid.');
  let url;try{url=new URL(value)}catch{throw Error('Every URL must be a complete web address.');}
  if(!['http:','https:','ftp:','ftps:'].includes(url.protocol))throw Error('Only HTTP, HTTPS, FTP and FTPS links are allowed.');
  return value;
 }
 function validate(links){
  if(!Array.isArray(links)||links.length>20)throw Error('Expected up to 20 links. No links are truncated.');
  const ids=new Set();
  for(const l of links){
   if(!l||typeof l!=='object'||Array.isArray(l)||typeof l.id!=='string'||!l.id||l.id.length>256||ids.has(l.id))throw Error('Each link needs a unique text ID.');
   ids.add(l.id);
   if(typeof l.name!=='string'||!l.name.trim()||l.name.length>1000)throw Error('A link name is invalid.');
   for(const k of ['icon','category'])if(l[k]!==undefined&&(typeof l[k]!=='string'||l[k].length>1000))throw Error('A link icon or category is invalid.');
   safeURL(l.url);
  }return links;
 }
 function local(raw){return validate(raw===null?[]:JSON.parse(raw));}
 function parse(text){
  if(new Blob([text]).size>LIMIT)throw Error('Choose a link file smaller than 1 MB.');
  const d=JSON.parse(text);
  // Accept the exact array format previously exported by this app, without coercion.
  if(Array.isArray(d))return validate(d);
  if(!d||d.app!==APP||d.version!==1)throw Error('This is not a Relax in Japan link backup.');
  return validate(d.links);
 }
 function encode(links){const text=JSON.stringify({app:APP,version:1,links:validate(links)},null,2);if(new Blob([text]).size>LIMIT)throw Error('Link file exceeds the 1 MB restore limit.');return text;}
 function raw(raw){return JSON.stringify({app:APP+'-raw',version:1,storageKey:KEY,raw},null,2);}
 function commit(storage,expected,links){validate(links);if(storage.getItem(KEY)!==expected)throw Error('Links changed in another tab. Reload before saving.');const text=JSON.stringify(links);storage.setItem(KEY,text);return text;}
 function replace(storage,expected,links,id){
  validate(links);if(storage.getItem(KEY)!==expected)throw Error('Links changed after preview. Choose the file again.');
  const k='quickLinksRecoveryPrior:'+id;if(storage.getItem(k)!==null)throw Error('Could not create a unique previous copy.');
  storage.setItem(k,raw(expected));commit(storage,expected,links);return k;
 }
 const api={KEY,APP,LIMIT,safeURL,validate,local,parse,encode,raw,commit,replace};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;root.QuickLinkData=api;
})(typeof window!=='undefined'?window:globalThis);
