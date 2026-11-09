const m=require('../js/journal-recovery');
const entry={date:'2026-11-09',text:'தமிழ்\nSecond line',mood:null};
function store(initial={}){const data={...initial};return {getItem:k=>Object.hasOwn(data,k)?data[k]:null,setItem:(k,v)=>{data[k]=v;},data};}
test('exact journal text, null mood and extension fields round trip',()=>{const e={...entry,legacy:'kept'};expect(m.parse(m.encode([e]))).toEqual([e]);});
test('empty is an explicit valid replacement, not missing data',()=>{expect(m.parse(m.encode([]))).toEqual([]);expect(m.local(null)).toEqual([]);expect(()=>m.local('null')).toThrow();});
test.each(['{','{}','[]','{"app":"other","version":1,"entries":[]}','{"app":"relax-in-japan-journal","version":2,"entries":[]}'])('reject wrong/malformed file %s',text=>{expect(()=>m.parse(text)).toThrow();});
test.each([{...entry,date:'2026-02-30'},{...entry,date:'no'}, {...entry,text:42},{...entry,mood:{}},null])('reject invalid records',e=>{expect(()=>m.validate([e])).toThrow();});
test('refuse duplicate date without silently dropping either entry',()=>{expect(()=>m.validate([entry,{...entry,text:'other'}])).toThrow();});
test('refuse oversize file',()=>{expect(()=>m.parse(' '.repeat(m.LIMIT+1))).toThrow();});
test('raw malformed bytes never silently reset',()=>{const s=store({journalEntries:'bad bytes'});expect(()=>m.local(s.getItem(m.KEY))).toThrow();expect(s.getItem(m.KEY)).toBe('bad bytes');});
test('replacement retains exact previous bytes first',()=>{const raw=' [ '+JSON.stringify(entry)+' ] ';const s=store({journalEntries:raw});const key=m.replace(s,raw,[],'unique');expect(JSON.parse(s.getItem(key)).raw).toBe(raw);expect(s.getItem(m.KEY)).toBe('[]');});
test('stale preview refuses without writes',()=>{const s=store({journalEntries:'[]'});expect(()=>m.replace(s,null,[entry],'unique')).toThrow(/changed/);expect(Object.keys(s.data)).toEqual(['journalEntries']);});
test('backup storage failure refuses replacement',()=>{const s=store({journalEntries:'[]'});s.setItem=()=>{throw Error('quota')};expect(()=>m.replace(s,'[]',[entry],'unique')).toThrow();expect(s.getItem(m.KEY)).toBe('[]');});
test('destination storage failure leaves previous record and prior copy',()=>{const s=store({journalEntries:'[]'});const set=s.setItem;s.setItem=(k,v)=>{if(k===m.KEY)throw Error('quota');set(k,v);};expect(()=>m.replace(s,'[]',[entry],'unique')).toThrow();expect(s.getItem(m.KEY)).toBe('[]');expect(JSON.parse(s.getItem('journalRecoveryPrior:unique')).raw).toBe('[]');});
test('same prior key cannot overwrite recovery history',()=>{const s=store({journalEntries:'[]','journalRecoveryPrior:one':'original'});expect(()=>m.replace(s,'[]',[entry],'one')).toThrow();expect(s.getItem('journalRecoveryPrior:one')).toBe('original');});

test('CI does not try an unused publishing branch or ask for write permission',()=>{const fs=require('fs');const ci=fs.readFileSync('.github/workflows/main.yml','utf8');expect(ci).not.toContain('uses: peaceiris/actions-gh-pages');expect(ci).not.toContain('contents: write');expect(ci).toContain('contents: read');expect(ci).toContain('run: npm test -- --runInBand');});

test('raw envelope preserves malformed text and unpaired UTF16 code units exactly',()=>{for(const raw of [null,'{bad bytes','\ud800தமிழ்'])expect(JSON.parse(m.encodeRaw(raw)).raw).toBe(raw);expect(()=>m.parse(m.encodeRaw('[]'))).toThrow();});
