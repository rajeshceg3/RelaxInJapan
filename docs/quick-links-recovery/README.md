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

## Production qualification, 2026-11-09 18:37 IST

PR69 https://github.com/rajeshceg3/RelaxInJapan/pull/69 final head1c2814720b03a05854a67aa19f4f1e9ff574893c passed both checks before normal merge. Runtime main f49a6b6330f5d25f201f1ccd2e4917689efd0fe9.

Native Pages https://github.com/rajeshceg3/RelaxInJapan/actions/runs/42622205841 and main workflows42622207665/42622207678 all succeeded on that exact commit. Live https://rajeshceg3.github.io/RelaxInJapan/ . All19 referenced runtime files, including index, both CSS and16scripts, matched exact source bytes. Served script retained as tests/quick-links-served.mjs.

Actual hosted custom-link journey passed320/390/844/1320 and all5saved layouts with synthetic isolated data. Hosted journal regression also passed4widths and5layouts. Inspected actual hosted390preview,844quota notice and scrolled Save/Cancel,1320preview and320malformed raw recovery pixels. Controls readable and reachable; short-screen modal scroll checked at both notice and footer. The unrelated meditation initialization error remains6reload errors perwidth in fixtures, with no new link errors.

Evidence-only branch retains hosted results and screenshots beside code. It is not a new production deployment. No private owner storage was read or migrated.
