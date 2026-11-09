const m=require('../js/quick-link-data');
const link={id:'one',name:'தமிழ்',url:'https://example.com/',icon:'',category:'__proto__',extension:{original:true}};
function storage(raw=null){const s=new Map(raw===null?[]:[[m.KEY,raw]]);return{getItem:k=>s.has(k)?s.get(k):null,setItem:(k,v)=>s.set(k,v),s};}
test('typed and legacy files preserve every field and order',()=>{expect(m.parse(m.encode([link]))).toEqual([link]);expect(m.parse(JSON.stringify([link]))).toEqual([link]);});
test.each(['javascript:alert(1)','data:text/html,x','file:///tmp/x','//example.com','not a url'])('refuses unsafe or incomplete URL %s',url=>expect(()=>m.validate([{...link,url}])).toThrow());
test.each(['https://example.com','http://example.com','ftp://example.com/x','ftps://example.com/x'])('keeps legacy safe URL %s',url=>expect(m.validate([{...link,url}])[0].url).toBe(url));
test('validates every record rather than just the first',()=>expect(()=>m.parse(JSON.stringify([link,{...link,id:'two',url:'javascript:x'}]))).toThrow());
test('refuses duplicate IDs and oversized lists instead of coercing/truncating',()=>{expect(()=>m.validate([link,link])).toThrow();expect(()=>m.validate(Array.from({length:21},(_,i)=>({...link,id:String(i)})))).toThrow();expect(()=>m.validate([{...link,id:12}])).toThrow();});
test('wrong app and raw envelope are not restorable',()=>{expect(()=>m.parse('{"app":"journal","version":1,"links":[]}')).toThrow();expect(()=>m.parse(m.raw('[]'))).toThrow();});
test('raw export keeps malformed and unpaired UTF16 text',()=>{for(const x of[null,'{bad','\ud800'])expect(JSON.parse(m.raw(x)).raw).toBe(x);});
test('commit failure leaves old stored value unchanged',()=>{const s=storage('[]');s.setItem=()=>{throw Error('quota')};expect(()=>m.commit(s,'[]',[link])).toThrow();expect(s.getItem(m.KEY)).toBe('[]');});
test('stale commit/replacement does not alter storage',()=>{const s=storage(' [] ');expect(()=>m.commit(s,'[]',[link])).toThrow();expect(()=>m.replace(s,'[]',[link],'test')).toThrow();expect(s.s.size).toBe(1);});
test('replacement keeps exact previous bytes before updating',()=>{const s=storage(' [ ] ');m.replace(s,' [ ] ',[link],'test');expect(JSON.parse(s.getItem('quickLinksRecoveryPrior:test')).raw).toBe(' [ ] ');expect(JSON.parse(s.getItem(m.KEY))).toEqual([link]);});
test('failed previous-copy write stops replacement',()=>{const s=storage('[]');s.setItem=()=>{throw Error('quota')};expect(()=>m.replace(s,'[]',[link],'test')).toThrow();expect(s.getItem(m.KEY)).toBe('[]');});
test('failed final write retains previous copy and original',()=>{const s=storage('[]');const write=s.setItem;s.setItem=(k,v)=>{if(k===m.KEY)throw Error('quota');write(k,v)};expect(()=>m.replace(s,'[]',[link],'test')).toThrow();expect(s.getItem(m.KEY)).toBe('[]');expect(JSON.parse(s.getItem('quickLinksRecoveryPrior:test')).raw).toBe('[]');});
test('explicit empty file clears links only',()=>{const s=storage(JSON.stringify([link]));s.setItem('journalEntries','unchanged');m.replace(s,s.getItem(m.KEY),[],'empty');expect(s.getItem(m.KEY)).toBe('[]');expect(s.getItem('journalEntries')).toBe('unchanged');});
