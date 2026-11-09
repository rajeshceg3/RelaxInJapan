# Custom quick links: private manual backup and guarded replacement

Source baseline: 425641688ba810d0e287d03984ed1c80ce29b75c.

## Why this increment

Custom links are deliberate saved choices. The shipped form lacked icon, category and ID elements still read by its script, breaking Add/Edit. Old import checked only the first record, coerced arbitrary fields, accepted script URLs and silently truncated after20. Loading malformed storage threw before recovery controls were wired. Existing writes changed memory before knowing whether browser storage worked.

## Behavior and limits

- Manual JSON download, file preview, explicit replacement checkbox and cancel. Not cloud sync, automatic transfer or an account.
- All records validated, maximum20 unchanged, no truncation. Unique text IDs; HTTP/HTTPS/FTP/FTPS URLs only. Legacy plain-array files accepted without type coercion; unknown record fields survive import/export and edits.
- Original raw text, including malformed/unpaired UTF16, can be downloaded in a raw JSON envelope. It is not a typed restorable file and may need repair. Unsafe/malformed existing lists are not rendered or overwritten. Raw download remains reachable; an invalid original requires repair outside this UI before reload/typed restore.
- Writes succeed before displayed list changes. Quota/stale-storage refusal keeps the open Add/Edit draft. Replacement keeps an exact previous raw copy first. Previous-copy write failure stops replacement; final-write failure retains original and previous copy.
- Temporary My links view reaches all five layouts without changing saved layout choice. Journal reading view remains separate. Modal scrolls on short screens and has Escape, focus return and keyboard focus containment.
- This is not full transactional multi-tab synchronization. A value changed after the final synchronous comparison cannot be fully protected across processes. Browser clearing still removes local copies; independently downloaded files matter.
- Existing unrelated meditation script error remains and is tracked separately. This increment does not claim whole-app, Safari, real-device, exhaustive accessibility, storage-repair or cloud qualification.

## Reproduce

`npm ci && npm test -- --runInBand`

`npx playwright install --with-deps chromium`

`node tests/quick-links-browser.mjs`

`node tests/journal-browser.mjs`

For installed Chrome: `CHROME_PATH=/usr/bin/google-chrome node tests/quick-links-browser.mjs`.
For production: prefix `DIRECT_URL=https://rajeshceg3.github.io/RelaxInJapan/`.

The browser fixture uses isolated synthetic local data, actual file downloads, rendered controls, reload, failed storage, stale previews, malformed originals and four viewport widths. Local/hosted results identify the gate actually run. CI uploads pixel and downloaded synthetic-file evidence. No owner data is included.
