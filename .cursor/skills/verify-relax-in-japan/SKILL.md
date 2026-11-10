---
name: verify-relax-in-japan
description: Verifies RelaxInJapan (Serene Dashboard) - the repo's own Jest suites and its five browser/data test drives in real Chrome - with machine-readable evidence.
---

# Verify RelaxInJapan

## Launch

```bash
python3 .cursor/skills/verify-relax-in-japan/verify.py
```

Exit 0 and `FAILURES=0` mean green.

## Doctor

Gates on `npm` and a Chrome/Chromium binary (`CHROME_BIN`, passed to the
drives as `CHROME_PATH`, which three of them require). Runs `npm ci`
when node_modules is absent.

## Drive

1. `npx jest` - 124 unit/jsdom tests.
2. Browser drives in real Chrome: `calm-data` (localStorage survival
   across layouts; the runner serves the app on port 4213 for it),
   `journal-browser`, `quick-links-browser`, `timer-browser`,
   `calm-browser` (these four self-serve).

## Evidence

Each run writes a fresh `EVIDENCE_DIR` with `evidence.json`; the drives
also land screenshots under `docs/`. `FAILURES=n` is the last line; the
exit code mirrors it.

## Cleanup

The calm-data server is a daemon thread on the documented port, shut
down at the end of the run, pass or fail. If the port is occupied the
runner refuses rather than disturbing it.

## Maintenance

The suites are the app's own; new drives in `tests/` should be added to
SELF_SERVED or NEEDS_SERVER in the runner in the same commit.
