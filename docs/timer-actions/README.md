# Timer action repair

Baseline main f49a6b6330f5d25f201f1ccd2e4917689efd0fe9.

The shipped focus input used a different ID from the timer script, causing
initialization to throw before Start/Pause/Reset were wired. Breathing
pattern controls were absent and its toggle sat inside the element hidden
at startup. The old unit test used invented matching markup and missed it.

Repair keeps one clear theme-fit Start/Resume or Pause action, a quieter
Reset, readable labels and honest running/paused/complete status. Timer
ends at zero rather than one tick later. Actual ring/time alignment and
preset hit targets were fixed after pixel inspection. Optional focus and
breathing controls use disclosures. The temporary My timer view reaches
all5saved layouts without changing the layout preference. Switching to
journal/links exits that view. No data storage or backup workflow changed.

Tests include the actual shipped DOM contract (not only mock markup),124
unit tests and a real Chrome fourwidth browser fixture. The fixture uses
Playwright-controlled timer events to verify preset/custom/start/pause/
resume/reset/zero completion, focus-to-long-break transition, breathing
show/hold/hide, view switching and5saved layouts. It does not certify
background tab/device/sleep timing, actual bell audibility, medical value,
all accessibility or Safari/physical devices. Existing bell filenames do
not exist in the repository and remain a separate sound-content defect;
this gate uses Silent and does not claim to repair them. Existing manual
recovery UI/data is untouched under the no-manual-backup correction.

Reproduce `npm ci && npm test -- --runInBand`, then
`npx playwright install --with-deps chromium && node tests/timer-browser.mjs`.
Installed Chrome can use CHROME_PATH=/usr/bin/google-chrome. DIRECT_URL
selects the hosted target. Existing journal and link lifecycle fixtures
also pass4widths with zero timer initialization errors,5saved layouts each.

Local screenshots/results are not production proof. Normal green PR,
main CI/deployment, exact served files and hosted actions/pixels are still
required before calling this released.
