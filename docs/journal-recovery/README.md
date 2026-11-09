# Journal preservation, November 9, 2026

This app was selected because daily authored journal entries are meaningful records. Fresh main0a4d4bfc49eb3dc45a2c92833075ec91f4c48389 writes journalEntries to browser localStorage only, without an export or restore path. The HTML omitted the empty-state element read by the journal script, causing a fresh journal to throw on startup. Malformed JSON also prevented startup, and storage failure could lose the in-memory update while leaving no clear feedback.

## Bounded change

- Restore the missing empty state, clearly say entries are browser-only, and expose My journal from the header.
- Validate existing journal records before editing. Malformed original bytes stay unchanged; saving is blocked and an unchanged raw download is available. Do not claim a damaged raw copy is automatically restorable.
- Download a typed, app/version-specific journal file. The file includes original text, null moods and extension fields unchanged. Excludes quick links, theme/layout, weather cache, timer state and other apps.
- Choose file -> preview -> explicit replacement acknowledgement. No write on selection, preview or cancel. Reject wrong app/version, invalid dates/text/moods, duplicate dates and files over2MB rather than truncating or guessing. Empty journal files deliberately clear the journal only.
- Before replacement, recheck exact previous bytes to reject stale previews. Write a unique retained previous copy before the atomic journal-key write. A failed previous-copy write leaves the journal untouched. Previous copy download survives reload. No expiry/deletion or compaction introduced.
- Failed saves keep the draft and original records; stale-tab writes are refused. Older open versions cannot cooperate in this check, so reload the app before editing across tabs.
- Primary action is bright brown Download journal, changing to Replace journal during preview. Floating gallery/audio controls are hidden only while recovery is open, restored on close, so confirmations and warnings are never covered. Mood labels remain readable without emoji font support; stored mood values unchanged.

## Proof and limits

Baseline80 tests passed without covering the empty journal fault. The new20 model tests plus baseline total100 pass. Four-width real-Chrome local browser suite320/390/844/1320 uses synthetic records only and actual downloaded bytes: save, backup, wrong-app refusal, preview no-write, explicit confirmation, reload, retained previous copy, exact downloaded-file round trip, cancel, explicit empty, stale preview, quota/draft preservation and malformed raw export. Every screenshot is inspected before release.

There is a pre-existing unrelated meditation startup error at js/meditation-timer.js:38 because required inputs are missing from the HTML. This increment does not fix the timer or claim zero whole-app errors. Browser results separately record only that known error and reject all other script errors. Quick-link malformed data/unsafe import and missing form fields remain a separate follow-up. No real owner records were read or migrated, no cloud saving/automatic sync/private companion added, and no whole-dashboard design/performance/accessibility acceptance claimed.

Production URL from successful existing GitHub Pages deployment: https://rajeshceg3.github.io/RelaxInJapan/ . Production release/source-byte qualification remains required after normal PR merge.

## Portable CI

A separate read-only journal verification workflow pins ubuntu-24.04 and Node22, installs the locked Playwright1.58.2 Chromium and runs100 unit tests plus the real browser matrix. It has no secrets, schedules, deployment step or write permission. Existing main CI/deploy workflow is unchanged. Local installed Chrome can be selected with CHROME_PATH. npm audit reports14 development dependency advisories; no production package is served by this static change. They are not silently fixed by a breaking upgrade or claimed resolved here.

## Redundant deployment failure found during release

PR66 merged as0b2cf0a7f1de62e1c4a898a27ef086c5afded24e. The real native Pages run https://github.com/rajeshceg3/RelaxInJapan/actions/runs/42564925363 succeeded and served the updated index. Journal main CI passed. The unrelated legacy deploy step https://github.com/rajeshceg3/RelaxInJapan/actions/runs/42564926309/job/128989259219 tried pushing gh-pages and failed403 as github-actions[bot]. Current Pages settings https://github.com/rajeshceg3/RelaxInJapan/settings/pages explicitly show Deploy from a branch: main / (root), last published by native pages build and deployment. No settings changed.

Follow-up removes that unused publishing step, keeps the existing test job/check name, pins supported runner and Node22, uses npm ci, and explicitly narrows contents permission to read. Native main/root Pages publishing remains unchanged. No token write grant, secret, account or provider change. Source regression checks that the redundant publisher and write permission are absent. Final total101 unit tests.

## Hidden-layout follow-up

Minimal and winter/autumn layouts hide the widget column. My journal now opens a temporary reading view, hiding unrelated widgets and floating controls while preserving the exact selected layout preference. Back to dashboard returns to that layout, without resetting or saving any new preference. Recovery has one bright next action; the journal Save is quiet while recovery is open. Browser regressions seed the hidden Minimal layout for every lifecycle run, prove return does not alter its preference, and separately check all five stored layout choices.

Raw export preserves the exact localStorage string inside a JSON envelope's raw field, including malformed text and unpaired UTF16 code units that a direct UTF8 Blob would replace. It is deliberately distinct from a restorable journal file. Raw-copy fidelity has a model regression. Final unit total102.
