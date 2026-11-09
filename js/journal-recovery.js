/* Journal files are a manual backup, not sync or a cloud account. */
(function(root) {
  'use strict';
  const APP = 'relax-in-japan-journal';
  const KEY = 'journalEntries';
  const LIMIT = 2 * 1024 * 1024;
  function validate(entries) {
    if (!Array.isArray(entries) || entries.length > 20000) throw Error('Expected a journal entry list (up to 20,000 entries).');
    const seen = new Set();
    for (const e of entries) {
      if (!e || typeof e !== 'object' || Array.isArray(e) || typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date) || !Number.isFinite(Date.parse(e.date + 'T00:00:00Z')) || new Date(e.date + 'T00:00:00Z').toISOString().slice(0,10) !== e.date) throw Error('An entry has an invalid date. Nothing changed.');
      if (seen.has(e.date)) throw Error('Two entries share a date. Nothing changed.');
      seen.add(e.date);
      if (typeof e.text !== 'string' || e.text.length > 1000000 || !(e.mood == null || typeof e.mood === 'string' && e.mood.length <= 64)) throw Error('An entry has invalid text or mood. Nothing changed.');
    }
    return entries;
  }
  function local(raw) {
    return validate(raw === null ? [] : JSON.parse(raw));
  }
  function parse(text) {
    if (new Blob([text]).size > LIMIT) throw Error('Choose a journal file smaller than 2 MB.');
    const data = JSON.parse(text);
    if (!data || data.app !== APP || data.version !== 1) throw Error('This is not a Relax in Japan journal backup. Nothing changed.');
    validate(data.entries);
    return data.entries;
  }
  function encode(entries) {
    validate(entries);
    const text = JSON.stringify({app: APP, version: 1, exportedAt: new Date().toISOString(), entries}, null, 2);
    if (new Blob([text]).size > LIMIT) throw Error('Journal exceeds the 2 MB restore limit. Use the raw copy and keep it safe.');
    return text;
  }
  function replace(storage, expected, entries, id) {
    validate(entries);
    if (storage.getItem(KEY) !== expected) throw Error('This journal changed after preview. Choose the file again to review the current version.');
    const priorKey = 'journalRecoveryPrior:' + id;
    if (storage.getItem(priorKey) !== null) throw Error('Could not create a unique previous copy. Nothing changed.');
    const next = JSON.stringify(entries);
    storage.setItem(priorKey, JSON.stringify({raw:expected}));
    storage.setItem(KEY, next);
    return priorKey;
  }
  const model = {APP,KEY,LIMIT,validate,local,parse,encode,replace};
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  if (typeof document === 'undefined') return;
  root.JournalRecovery = model;
  document.addEventListener('DOMContentLoaded', () => {
    const file = document.getElementById('journal-backup-file');
    if (!file) return;
    const jump=document.querySelector('.journal-jump');
    const exit=document.getElementById('journal-exit-reading');
    jump.addEventListener('click',event=>{
      event.preventDefault();document.body.classList.add('journal-reading');exit.hidden=false;jump.hidden=true;
      document.getElementById('journaling-widget').scrollIntoView({block:'start'});
      document.getElementById('journaling-widget-title').focus({preventScroll:true});
    });
    exit.addEventListener('click',()=>{
      reset();file.value='';document.getElementById('journal-recovery').open=false;
      document.body.classList.remove('journal-reading');exit.hidden=true;jump.hidden=false;scrollTo(0,0);jump.focus();
    });
    const status = document.getElementById('journal-recovery-status');
    const preview = document.getElementById('journal-restore-preview');
    const confirm = document.getElementById('journal-restore-confirm');
    const approve = document.getElementById('journal-replace-approve');
    const previous = document.getElementById('journal-download-previous');
    let staged = null, previousRaw;
    try {
      const keys=Object.keys(localStorage).filter(k=>k.startsWith('journalRecoveryPrior:')).sort();
      if(keys.length){previousRaw=JSON.parse(localStorage.getItem(keys[keys.length-1])).raw;previous.hidden=false;}
    }catch(_){}
    const tell = text => {status.textContent = text;};
    function reset() { staged = null; preview.hidden = true; confirm.hidden = true; approve.checked = false; confirm.disabled = true; }
    function download(text, name) {
      const url = URL.createObjectURL(new Blob([text], {type:'application/json'}));
      const a = document.createElement('a');a.href = url;a.download = name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    document.getElementById('journal-download-backup').addEventListener('click', () => {
      try {download(encode(local(localStorage.getItem(KEY))), 'relax-journal-' + Date.now() + '.json');tell('Journal file download requested. Keep it somewhere private. This is not cloud saving.');}
      catch(e) {tell('Could not make a restorable backup: ' + e.message + ' Download the unchanged raw copy below.');}
    });
    document.getElementById('journal-download-raw').addEventListener('click', () => {
      try {download(localStorage.getItem(KEY) ?? 'null', 'relax-journal-original-' + Date.now() + '.json');tell('Unchanged raw journal download requested. A damaged raw copy may need repair before restore.');}catch(e){tell('Could not read the journal: ' + e.message);}
    });
    file.addEventListener('change', async () => {
      reset();const selected=file.files[0]; if(!selected){tell('No file selected. Nothing changed.');return;}
      try {
        if(selected.size>LIMIT) throw Error('Choose a file smaller than 2 MB.');
        const entries=parse(await selected.text());
        if(file.files[0]!==selected)return;
        const expected=localStorage.getItem(KEY);
        // Refuse replacing malformed local records. The raw copy remains available.
        const current=local(expected);
        staged={entries,expected};
        document.getElementById('journal-preview-summary').textContent = `${entries.length} entries in this file. This replaces all ${current.length} entries in this browser, including entries absent from the file. An empty file clears the journal. Nothing has changed yet.`;
        preview.hidden=false;confirm.hidden=false;tell('Preview ready. A previous copy will be kept in this browser before replacement. Download your current journal first for an independent copy.');
      }catch(e){tell('File refused: '+e.message);}
    });
    approve.addEventListener('change',()=>{confirm.disabled=!approve.checked||!staged;});
    document.getElementById('journal-restore-cancel').addEventListener('click',()=>{reset();file.value='';tell('Restore cancelled. Nothing changed.');});
    confirm.addEventListener('click',()=>{
      if(!staged||!approve.checked)return;
      try {
        const raw=staged.expected;
        const id=Date.now()+'-'+crypto.randomUUID();
        replace(localStorage,raw,staged.entries,id);
        previousRaw=raw;previous.hidden=false;
        const j=root.journalWidget;
        if(j){j.loadEntries();j.currentEntryIndex=j.entries.length-1;if(j.entries.length)j.displayEntry(j.currentEntryIndex);else j.showEmptyState();j.updateNavigationButtons();j.populateDatePickerWithEntryDates();}
        reset();file.value='';tell('Journal replaced in this browser. Previous copy retained here and available to download below. No cloud sync or other device was changed.');
      }catch(e){reset();tell('Restore stopped: '+e.message);}
    });
    previous.addEventListener('click',()=>{
      try {download(encode(local(previousRaw)), 'relax-journal-previous-'+Date.now()+'.json');tell('Previous journal file download requested.');}catch(e){tell(e.message);}
    });
  });
})(typeof window !== 'undefined' ? window : globalThis);
